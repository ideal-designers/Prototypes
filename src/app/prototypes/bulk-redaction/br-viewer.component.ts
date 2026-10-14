import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DS_COMPONENTS, FloatingPanelItem, RedactionMarkPage, RedactionMarkType, SegmentItem, ToastService } from '../../shared/ds';
import type { StatusChipPick } from '../../shared/ds';
import { BrStore } from './br-store.service';
import { BrPdfComponent } from './br-pdf.component';
import { BrPdfService } from './br-pdf.service';
import { BrRulesComponent } from './br-rules.component';
import { BrTagInputComponent } from './br-tag-input.component';
import { PII_ICON_SVG } from './br-icons';
import {
  ICON_CLOSE_VIEWER, ICON_PII, ICON_REDACT_AREA, ICON_REDO, ICON_RIGHT_ASIDE, ICON_SEARCH, ICON_UNDO, NAV_OUTLINE_PATH, NAV_THUMBNAILS_PATH,
} from './br-viewer-icons';
import {
  CATEGORY_LABEL, DocStatus, Mark, PII_CATEGORIES, PiiCategory, RuleSet, STATUS_LABEL, cloneRules, countByCategory, emptyRules,
  fileIconOf, nodeById, pathOf,
} from './bulk-redaction.data';

interface MarkGroup { key: string; type: RedactionMarkType; title: string; marks: Mark[]; pages: RedactionMarkPage[]; expanded: boolean }
interface Section { key: string; label: string; count: number; groups: MarkGroup[] }

/**
 * Full-screen redaction viewer for a batch — Figma "Bulk redaction / Concept 2 / Viewer"
 * (header, toolbar, floating panels and the Detect popover are taken from /redaction-viewer).
 * Only the parts this prototype is about are live: changing the status, Detect sensitive information
 * with exceptions, the Redaction templates tool and switching between the batch's documents.
 * Redact area, Search & redact, undo and redo are shown but intentionally inert.
 */
@Component({
  selector: 'fvdr-br-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, BrPdfComponent, BrRulesComponent, BrTagInputComponent],
  template: `
    <div class="rv" role="dialog" aria-label="Redaction viewer">
      <!-- ══ Header ══ -->
      <header class="rv-header">
        <div class="rv-left">
          <fvdr-ghost-btn size="small" [iconPath]="ICON_CLOSE" tooltip="Close" [arrow]="false" (clicked)="closed.emit()"></fvdr-ghost-btn>
          <div class="rv-file">
            <button type="button" class="rv-file__dir" (click)="openFolder.emit(node.parent || '')" fvdrTooltip="Open folder">
              <fvdr-icon name="folder-outline" class="rv-file__folder"></fvdr-icon><span class="rv-file__path">{{ folderPath }} /</span>
            </button>
            <fvdr-file-icon [type]="fileIcon"></fvdr-file-icon>
            <b class="rv-file__name">{{ node.name }}</b>
          </div>
          <span class="rv-mode"><fvdr-icon name="redact"></fvdr-icon>Redacting<fvdr-icon name="chevron-down"></fvdr-icon></span>
          <!-- Status (#9, #10): Draft → Ready for review → Reviewed are changed by hand from here -->
          <fvdr-status-chip *ngIf="status !== 'none'" [status]="status" [label]="statusText" [counter]="marks.length || null" [menu]="store.canSetStatus(docId)"
                          (picked)="setStatus($event)"></fvdr-status-chip>
        </div>
        <div class="rv-right">
          <!-- Switching between the batch's documents (#7) -->
          <div class="rv-nav">
            <!-- Hovering either arrow previews that document (DS document info card) -->
            <span class="rv-next" aria-label="Previous file" (mouseenter)="hoverSide = 'prev'" (mouseleave)="hoverSide = null">
              <fvdr-btn variant="ghost" size="s" iconName="chevron-left" [iconOnly]="true" [disabled]="index === 0" (clicked)="go(index - 1)"></fvdr-btn>
            </span>
            <span class="rv-nav__txt">{{ index + 1 }} draft file of {{ ids.length }}</span>
            <span class="rv-next" aria-label="Next file" (mouseenter)="hoverSide = 'next'" (mouseleave)="hoverSide = null">
              <fvdr-btn variant="ghost" size="s" iconName="chevron-right" [iconOnly]="true" [disabled]="index >= ids.length - 1" (clicked)="go(index + 1)"></fvdr-btn>
            </span>
            <fvdr-doc-info-card *ngIf="hoverSide && neighbour as n" class="rv-next__card" [name]="n.index + ' ' + n.name"
                                [type]="n.ext === 'pdf' ? 'pdf' : 'doc'" [thumbSrc]="thumb" [fields]="nextFields(n)"></fvdr-doc-info-card>
          </div>
          <fvdr-toggle label="Preview" [(checked)]="preview"></fvdr-toggle>
          <fvdr-btn *ngIf="concept === 'c2'" label="Apply & Open next" variant="primary" (clicked)="applyAndNext()"></fvdr-btn>
          <fvdr-btn *ngIf="concept === 'c1'" label="Apply" variant="primary" [disabled]="!marks.length" (clicked)="applyOne()"></fvdr-btn>
        </div>
      </header>

      <!-- ══ Toolbar ══ -->
      <div class="rv-toolbar">
        <fvdr-ghost-btn size="small" [iconPath]="ICON_UNDO" tooltip="Undo" [arrow]="false"></fvdr-ghost-btn>
        <fvdr-ghost-btn size="small" [iconPath]="ICON_REDO" tooltip="Redo" [arrow]="false"></fvdr-ghost-btn>
        <div class="rv-sep"></div>
        <fvdr-ghost-btn class="rv-tab" label="Redact area" size="small" [iconPath]="ICON_REDACT_AREA"></fvdr-ghost-btn>
        <fvdr-ghost-btn class="rv-tab" label="Search & redact" size="small" [arrow]="false" [iconPath]="ICON_SEARCH"></fvdr-ghost-btn>

        <!-- Detect sensitive information (+ exceptions) -->
        <div class="rv-tabwrap" (click)="$event.stopPropagation()">
          <fvdr-ghost-btn class="rv-tab" label="Detect sensitive information" size="small" [arrow]="false" [selected]="detectOpen"
                          [iconPath]="ICON_PII" (clicked)="toggleDetect()"></fvdr-ghost-btn>
          <div class="rv-float rv-float--detect" *ngIf="detectOpen">
            <div class="rv-float__in">
              <div class="rv-detecting" *ngIf="detecting">
                <div class="rv-float__title">Detecting sensitive information</div>
                <p class="rv-sub">This can take a few moments…</p>
                <fvdr-progress [value]="detectProgress"></fvdr-progress>
              </div>
              <div class="rv-results" *ngIf="!detecting && pii.length">
                <div class="rv-float__title">Sensitive information</div>
                <div class="rv-pii">
                  <fvdr-filter-btn label="All" size="S" [showIcon]="false" [showCounter]="true" [counter]="'' + piiTotal" [selected]="allPiiOn"
                                   (clicked)="toggleAllPii()"></fvdr-filter-btn>
                  <fvdr-filter-btn *ngFor="let c of pii" [label]="c.label" size="S" [icon]="svg[c.id] ? undefined : c.icon" [iconHtml]="svg[c.id] || null"
                                   [showCounter]="true" [counter]="'' + c.count" [selected]="picked.has(c.id)" (clicked)="togglePii(c.id)"></fvdr-filter-btn>
                </div>
                <fvdr-checkbox label="Add exceptions" [checked]="excOn" (checkedChange)="toggleExc($event)"></fvdr-checkbox>
                <fvdr-br-tag-input *ngIf="excOn" [items]="exceptions" ariaLabel="Exceptions" placeholder="Add term" (itemsChange)="exceptions = $event"></fvdr-br-tag-input>
                <fvdr-btn label="Mark for redaction" variant="primary" size="s" [disabled]="!picked.size" (clicked)="markPii()"></fvdr-btn>
                <div class="rv-info"><fvdr-icon name="info"></fvdr-icon>AI-generated – check for accuracy</div>
              </div>
              <div *ngIf="!detecting && !pii.length">
                <div class="rv-float__title">No sensitive information found</div>
                <p class="rv-sub">We couldn't detect any sensitive information in this document.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Redaction templates: the same rule editor as the Redact modal in the Documents list -->
        <fvdr-ghost-btn class="rv-tab" label="Redaction templates" size="small" [arrow]="false" [iconPath]="ICON_REDACT_AREA"
                        (clicked)="openTemplates()"></fvdr-ghost-btn>
      </div>

      <!-- ══ Body ══ -->
      <div class="rv-body">
        <div class="rv-area" #area (scroll)="onScroll()">
          <fvdr-br-pdf class="rv-pages" [marks]="marks" [preview]="preview" [scale]="zoom / 75" [selectedId]="selectedId" [deletable]="true" (markClick)="select($event)"
                       (deleteOne)="deleteMark($event)" (deleteAll)="deleteSame($event)"></fvdr-br-pdf>
        </div>

        <!-- Marks panel -->
        <aside class="rv-panel" *ngIf="panelOpen">
          <div class="rv-panel__head">
            <span class="rv-panel__title">Redaction marks</span>
            <button type="button" class="rv-x" fvdrTooltip="Close" (click)="panelOpen = false"><fvdr-icon name="close"></fvdr-icon></button>
          </div>
          <div class="rv-panel__tabs">
            <fvdr-segment variant="table" size="mobile" [items]="groupTabs" [activeId]="groupBy" (activeIdChange)="groupBy = $any($event)"></fvdr-segment>
          </div>
          <div class="rv-panel__body">
            <p class="rv-empty" *ngIf="!marks.length">No marks yet. Use Detect sensitive information or Redaction templates to add them.</p>
            <section *ngFor="let s of sections; trackBy: trackKey">
              <h4 class="rv-sec"><span>{{ s.label }}</span><span class="rv-sec__n">{{ s.count }}</span></h4>
              <fvdr-redaction-mark-card *ngFor="let g of s.groups; trackBy: trackKey" [type]="g.type" [title]="g.title"
                  [status]="g.marks[0].state" [selected]="isSel(g)" [pageLabel]="'Page ' + g.marks[0].page"
                  [groupedBy]="groupBy === 'page' ? 'page' : 'category'" [pages]="g.pages" [expanded]="g.expanded"
                  (expandedChange)="toggleExp(g.key, $event)" (clicked)="select(g.marks[0])" (deleted)="removeGroup(g)"
                  (pageClicked)="selectById($event)" (pageDeleted)="removeById($event)"></fvdr-redaction-mark-card>
            </section>
          </div>
        </aside>

        <!-- Floating panels -->
        <fvdr-floating-panel class="rv-nav-panel" [items]="navItems" orientation="vertical" size="big"></fvdr-floating-panel>
        <fvdr-floating-panel *ngIf="!panelOpen" class="rv-right-panel" [items]="rightItems" orientation="vertical" size="big"
                             (itemClicked)="panelOpen = true"></fvdr-floating-panel>
        <div class="rv-zoom">
          <span class="rv-zoom__page">{{ currentPage }}</span><span class="rv-zoom__total">{{ totalPages }}</span>
          <fvdr-btn variant="ghost" size="s" iconName="plus" [iconOnly]="true" ariaLabel="Zoom in" (clicked)="zoom = clamp(zoom + 15)"></fvdr-btn>
          <span class="rv-zoom__pct">{{ zoom }}%</span>
          <fvdr-btn variant="ghost" size="s" iconName="minus" [iconOnly]="true" ariaLabel="Zoom out" (clicked)="zoom = clamp(zoom - 15)"></fvdr-btn>
        </div>
      </div>

      <!-- Redaction templates tool -->
      <fvdr-modal [visible]="tplOpen" title="Redaction templates" size="m" (closed)="tplOpen = false">
        <fvdr-br-rules picker="dropdown" [(rules)]="rules" [(templateId)]="templateId"></fvdr-br-rules>
        <div class="rv-mfoot">
          <fvdr-btn label="Cancel" variant="secondary" (clicked)="tplOpen = false"></fvdr-btn>
          <fvdr-btn label="Mark for redaction" variant="primary" [disabled]="!rules.categories.length && !rules.keywords.length" (clicked)="runTemplates()"></fvdr-btn>
        </div>
      </fvdr-modal>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 500; display: block; font-family: var(--font-family);
      /* Marks panel: draft marks are grey and a selected card turns green (Figma "Redaction mark card") */
      --redaction-status-draft: var(--color-stone-500); --redaction-selected-bg: var(--color-status-stable-bg);
      --redaction-selected-border: var(--color-primary-500); --redaction-draft-bar: var(--color-primary-500); }
    .rv { display: flex; flex-direction: column; height: 100%; background: var(--color-stone-200); color: var(--color-text-primary); font-size: var(--font-size-base);
      position: relative; overflow: hidden; }
    /* Header */
    .rv-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4) 0; background: var(--color-stone-0); flex-shrink: 0; position: relative; z-index: 30; }
    .rv-left, .rv-right { display: flex; align-items: center; gap: var(--space-4); }
    .rv-file { display: flex; align-items: center; gap: var(--space-2); }
    .rv-file__dir { display: inline-flex; align-items: center; gap: var(--space-2); border: none; background: transparent; padding: 0; cursor: pointer; font-family: inherit; font-size: inherit; }
    .rv-file__dir:hover .rv-file__path { color: var(--color-text-primary); text-decoration: underline; }
    .rv-file__folder, .rv-file__path { color: var(--color-text-secondary); }
    .rv-file__name { font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .rv-file__folder { font-size: 20px; }
    .rv-mode { display: inline-flex; align-items: center; gap: var(--space-2); height: 28px; padding: 0 var(--space-3); border-radius: var(--radius-sm);
      background: var(--color-hover-bg); color: var(--color-text-primary); }
    .rv-mode fvdr-icon { color: var(--color-text-secondary); }
    .rv-next { display: inline-flex; }
    .rv-next__card { position: absolute; top: calc(100% + var(--space-1)); right: 0; z-index: 40; }
    .rv-nav { position: relative; display: inline-flex; align-items: center; gap: var(--space-1); color: var(--color-text-secondary); }
    /* Toolbar */
    .rv-toolbar { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-3) var(--space-4) var(--space-4); background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider); flex-shrink: 0; position: relative; z-index: 20; }
    .rv-sep { width: 1px; height: 16px; background: var(--color-divider); margin: 0 var(--space-1); }
    .rv-tabwrap { position: relative; }
    /* Detect popover (gradient border, same as /redaction-viewer) */
    .rv-float { position: absolute; top: calc(100% + 4px); left: 0; z-index: 30; width: 320px; background: var(--color-stone-0); border-radius: var(--radius-sm); box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.10); }
    .rv-float--detect { border: 1px solid transparent; box-shadow: none;
      background: linear-gradient(#fff, #fff) padding-box,
        linear-gradient(135deg, hsla(238, 45%, 84%, 1) 0%, hsla(233, 47%, 90%, 1) 33%, hsla(53, 94%, 75%, 1) 66%, hsla(130, 85%, 77%, 1) 100%) border-box; }
    .rv-float__in { padding: var(--space-4); }
    .rv-results, .rv-detecting { display: flex; flex-direction: column; gap: var(--space-3); }
    .rv-float__title { font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .rv-sub { margin: 0; color: var(--color-text-secondary); }
    .rv-pii { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-1); }
    .rv-results fvdr-btn { display: block; width: 100%; }
    .rv-results fvdr-btn ::ng-deep button { width: 100%; }
    .rv-info { display: flex; align-items: center; gap: var(--space-2); height: 32px; margin: 0 calc(var(--space-4) * -1) calc(var(--space-4) * -1); padding: 0 var(--space-4);
      background: var(--color-stone-200); color: var(--color-text-secondary); }
    /* Body */
    .rv-body { display: flex; flex: 1; overflow: hidden; position: relative; }
    .rv-area { flex: 1; overflow: auto; background: var(--color-stone-200); }
    .rv-pages { padding: var(--space-4) 0 var(--space-6); min-width: min-content; }
    .rv-nav-panel { position: absolute; top: var(--space-4); left: var(--space-4); z-index: 25; }
    .rv-right-panel { position: absolute; top: var(--space-4); right: var(--space-4); z-index: 25; }
    .rv-zoom { position: absolute; left: var(--space-4); bottom: var(--space-4); z-index: 25; display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
      padding: var(--space-2); background: var(--color-stone-0); border-radius: var(--radius-md); box-shadow: var(--shadow-card); font-size: var(--text-caption1-size); }
    .rv-zoom__page { min-width: 28px; padding: var(--space-1) var(--space-2); text-align: center; border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .rv-zoom__total, .rv-zoom__pct { color: var(--color-text-secondary); }
    /* Marks panel */
    .rv-panel { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--color-stone-0); border-left: 1px solid var(--color-divider); min-height: 0; }
    .rv-panel__head { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4); }
    .rv-panel__title { font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .rv-x { display: inline-flex; border: none; background: transparent; cursor: pointer; color: var(--color-stone-700); }
    .rv-x:hover { color: var(--color-text-primary); }
    .rv-panel__tabs { padding: var(--space-2) var(--space-4); }
    .rv-panel__tabs fvdr-segment { display: block; }
    .rv-panel__tabs fvdr-segment ::ng-deep .seg-table { display: flex; width: 100%; }
    .rv-panel__tabs fvdr-segment ::ng-deep .seg-table__item { flex: 1; }
    .rv-panel__body { flex: 1; overflow-y: auto; padding: 0 var(--space-4) var(--space-6); }
    .rv-empty { color: var(--color-text-secondary); }
    .rv-sec { display: flex; justify-content: space-between; margin: var(--space-4) 0 var(--space-2); font-weight: var(--font-weight-semi); }
    .rv-sec__n { color: var(--color-text-secondary); font-weight: var(--font-weight-regular); }
    fvdr-redaction-mark-card { display: block; margin-bottom: var(--space-2); }
    .rv-mfoot { display: flex; justify-content: flex-end; gap: var(--space-2); }
  `],
})
export class BrViewerComponent implements OnInit, OnChanges {
  store = inject(BrStore);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private pdf = inject(BrPdfService);

  @Input() ids: string[] = [];
  @Input() index = 0;
  @Input() concept: 'c1' | 'c2' = 'c2';
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();
  /** Folder breadcrumb clicked: the host closes the viewer and shows that folder ('' = project root). */
  @Output() openFolder = new EventEmitter<string>();
  @ViewChild('area') area?: ElementRef<HTMLElement>;

  readonly ICON_CLOSE = ICON_CLOSE_VIEWER;
  readonly ICON_UNDO = ICON_UNDO;
  readonly ICON_REDO = ICON_REDO;
  readonly ICON_REDACT_AREA = ICON_REDACT_AREA;
  readonly ICON_SEARCH = ICON_SEARCH;
  readonly ICON_PII = ICON_PII;
  readonly navItems: FloatingPanelItem[] = [
    { id: 'thumbnails', iconPath: NAV_THUMBNAILS_PATH, tooltip: 'Page thumbnails' },
    { id: 'outline', iconPath: NAV_OUTLINE_PATH, tooltip: 'Outline' },
  ];
  readonly rightItems: FloatingPanelItem[] = [{ id: 'marks', iconPath: ICON_RIGHT_ASIDE, tooltip: 'Redaction marks' }];
  readonly groupTabs: SegmentItem[] = [
    { id: 'category', icon: 'group-by-category', label: 'By category' }, { id: 'page', icon: 'group-by-page', label: 'By page' },
  ];
  readonly svg: Record<string, SafeHtml> = Object.fromEntries(
    Object.entries(PII_ICON_SVG).map(([k, v]) => [k, this.sanitizer.bypassSecurityTrustHtml(v)]));

  preview = false;
  panelOpen = false;
  groupBy: 'category' | 'page' = 'category';
  selectedId: string | null = null;
  zoom = 75;
  currentPage = 1;
  totalPages = 0;
  hoverSide: 'prev' | 'next' | null = null;
  thumb = '';
  private expanded = new Set<string>();

  // Detect sensitive information (+ exceptions)
  detectOpen = false;
  detecting = false;
  detectProgress = 0;
  pii: { id: PiiCategory; label: string; icon: any; count: number }[] = [];
  picked = new Set<PiiCategory>();
  excOn = false;
  exceptions: string[] = [];
  private detectTimer?: ReturnType<typeof setInterval>;

  // Redaction templates tool
  tplOpen = false;
  rules: RuleSet = emptyRules();
  templateId: string | null = null;

  ngOnInit(): void {
    this.pdf.pageSizes().then(s => (this.totalPages = s.length));
    this.pdf.thumb().then(t => (this.thumb = t));
  }
  ngOnChanges(ch: SimpleChanges): void {
    if (ch['concept']) this.panelOpen = this.concept === 'c1';
  }

  @HostListener('document:click') closeMenus(): void { this.detectOpen = false; }

  // ── Derived ──────────────────────────────────────────────────────────────
  get docId(): string { return this.ids[this.index]; }
  get node() { return nodeById(this.docId); }
  /** The document the hovered arrow leads to — null when there is none (first / last file). */
  get neighbour() {
    const i = this.hoverSide === 'prev' ? this.index - 1 : this.index + 1;
    return this.hoverSide && i >= 0 && i < this.ids.length ? nodeById(this.ids[i]) : null;
  }
  nextFields(n: { id: string; index: string; updated: string }): { label: string; value: string }[] {
    const h = [...n.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return [
      { label: 'Added on:', value: n.updated }, { label: 'Size:', value: `${(1.2 + (h % 40) / 10).toFixed(1)} MB` },
      { label: 'Pages:', value: String(this.totalPages || '') }, { label: 'ID:', value: n.index },
    ];
  }
  get fileIcon() { return fileIconOf(this.node); }
  get folderPath(): string { return this.node.parent ? pathOf(this.node.parent) : 'Integrations'; }
  get status(): DocStatus { return this.store.status(this.docId); }
  get marks(): Mark[] { return this.store.marks(this.docId); }
  /** "Draft marks 10" / "Ready for review 10" / "Reviewed marks 10" */
  get statusText(): string {
    const s = this.status;
    return s === 'draft' ? 'Draft marks' : s === 'reviewed' ? 'Reviewed marks' : s === 'applied' ? 'Applied marks' : STATUS_LABEL[s];
  }
  clamp = (n: number) => Math.min(150, Math.max(45, n));
  trackKey = (_: number, x: { key: string }) => x.key;

  // ── Marks panel ──────────────────────────────────────────────────────────
  get sections(): Section[] {
    const out = new Map<string, Mark[]>();
    const keyOf = (m: Mark) => (this.groupBy === 'category' ? m.kind : `p${String(m.page).padStart(3, '0')}`);
    [...this.marks].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x).forEach(m => out.set(keyOf(m), [...(out.get(keyOf(m)) ?? []), m]));
    const order = [...PII_CATEGORIES.map(c => c.id as string), 'keyword', 'manual'];
    const keys = [...out.keys()].sort((a, b) => this.groupBy === 'category' ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b));
    return keys.map(k => {
      const marks = out.get(k)!;
      const byText = new Map<string, Mark[]>();
      marks.forEach(m => byText.set(m.text.toLowerCase(), [...(byText.get(m.text.toLowerCase()) ?? []), m]));
      const groups: MarkGroup[] = [...byText.values()].map(ms => {
        const key = `${k}|${ms[0].text.toLowerCase()}`;
        return {
          key, type: this.cardType(ms[0]), title: ms[0].text, marks: ms, expanded: this.expanded.has(key),
          pages: ms.length > 1 ? ms.map(m => ({ id: m.id, pageLabel: `Page ${m.page}`, status: m.state, selected: m.id === this.selectedId })) : [],
        };
      });
      return { key: k, label: this.groupBy === 'category' ? CATEGORY_LABEL[k] : `Page ${+k.slice(1)}`, count: marks.length, groups };
    });
  }
  private cardType(m: Mark): RedactionMarkType { return PII_CATEGORIES.find(c => c.id === m.kind)?.card ?? 'text-mark'; }
  toggleExp(key: string, open: boolean): void { open ? this.expanded.add(key) : this.expanded.delete(key); }
  isSel = (g: MarkGroup) => g.marks.some(m => m.id === this.selectedId);
  select(m: Mark): void {
    this.selectedId = m.id;
    this.panelOpen = true;
    setTimeout(() => this.area?.nativeElement.querySelector(`[data-mark="${m.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }
  selectById(id: string): void { const m = this.marks.find(x => x.id === id); if (m) this.select(m); }
  deleteMark(m: Mark): void { this.removeById(m.id); }
  deleteSame(m: Mark): void {
    const n = this.store.removeSame(this.docId, m.id);
    this.selectedId = null;
    this.toast.show({ variant: 'success', duration: 3000, message: `${n} mark${n === 1 ? '' : 's'} deleted` });
  }
  removeById(id: string): void { this.store.removeMark(this.docId, id); if (this.selectedId === id) this.selectedId = null; }
  removeGroup(g: MarkGroup): void { g.marks.forEach(m => this.store.removeMark(this.docId, m.id)); this.selectedId = null; }

  onScroll(): void {
    const el = this.area?.nativeElement;
    if (!el) return;
    const pages = Array.from(el.querySelectorAll<HTMLElement>('.pg'));
    const mid = el.scrollTop + el.clientHeight / 3;
    const cur = pages.findIndex(p => p.offsetTop + p.offsetHeight > mid);
    this.currentPage = Math.max(1, cur + 1);
  }

  // ── Status (#9, #10) ─────────────────────────────────────────────────────
  setStatus(s: StatusChipPick): void {
    this.store.setStatus([this.docId], s);
    this.toast.show({ variant: 'success', message: `Status changed to ${STATUS_LABEL[s].toLowerCase()}`, duration: 3000 });
  }

  // ── Detect sensitive information + exceptions ────────────────────────────
  get piiTotal(): number { return this.pii.reduce((n, c) => n + c.count, 0); }
  get allPiiOn(): boolean { return this.pii.length > 0 && this.pii.every(c => this.picked.has(c.id)); }
  toggleDetect(): void {
    if (this.detectOpen) { this.detectOpen = false; return; }
    this.detectOpen = true;
    this.detecting = true;
    this.detectProgress = 0;
    this.picked = new Set();
    this.excOn = false;
    this.exceptions = [];
    clearInterval(this.detectTimer);
    this.detectTimer = setInterval(() => (this.detectProgress = Math.min(100, this.detectProgress + 20)), 150);
    Promise.all([this.store.pdfItems(), new Promise(r => setTimeout(r, 900))]).then(([items]) => {
      clearInterval(this.detectTimer);
      const counts = countByCategory(this.node.content ?? 'plain', items);
      this.pii = PII_CATEGORIES.filter(c => counts[c.id]).map(c => ({ id: c.id, label: c.label, icon: c.icon, count: counts[c.id] }));
      this.detecting = false;
    });
  }
  togglePii(id: PiiCategory): void { this.picked.has(id) ? this.picked.delete(id) : this.picked.add(id); }
  toggleAllPii(): void { this.picked = this.allPiiOn ? new Set() : new Set(this.pii.map(c => c.id)); }
  toggleExc(on: boolean): void { this.excOn = on; if (!on) this.exceptions = []; }
  async markPii(): Promise<void> {
    const rules: RuleSet = { categories: [...this.picked], keywords: [], doNotRedact: this.excOn ? this.exceptions : [] };
    const n = await this.store.detectNow(this.docId, rules);
    this.detectOpen = false;
    this.toast.show({ variant: 'success', duration: 4000, message: n ? `${n} mark${n === 1 ? '' : 's'} added` : 'No new marks were added' });
  }

  // ── Redaction templates tool ─────────────────────────────────────────────
  openTemplates(): void {
    this.rules = cloneRules(this.store.batchRules);
    this.templateId = null;
    this.tplOpen = true;
  }
  async runTemplates(): Promise<void> {
    this.tplOpen = false;
    this.store.batchRules = cloneRules(this.rules);
    const n = await this.store.detectNow(this.docId, this.rules);
    this.toast.show({ variant: 'success', duration: 4000, message: n ? `${n} mark${n === 1 ? '' : 's'} added` : 'No new marks were added' });
  }

  // ── Apply + switching documents (#7) ─────────────────────────────────────
  applyOne(): void {
    if (this.store.apply([this.docId])) this.toast.show({ variant: 'success', duration: 5000, message: 'Redaction marks are being applied. It can take a few moments.' });
  }
  applyAndNext(): void {
    this.store.apply([this.docId]);
    this.toast.show({ variant: 'success', duration: 5000, message: 'Redaction marks are being applied. It can take a few moments.' });
    const next = this.ids.findIndex((id, i) => i > this.index && this.store.status(id) !== 'applied' && this.store.hasMarks(id));
    if (next >= 0) { this.go(next); return; }
    this.closed.emit();
  }
  go(i: number): void {
    if (i < 0 || i >= this.ids.length) return;
    this.index = i;
    this.selectedId = null;
    this.detectOpen = false;
    this.indexChange.emit(i);
    setTimeout(() => this.area?.nativeElement.scrollTo({ top: 0 }));
  }
}
