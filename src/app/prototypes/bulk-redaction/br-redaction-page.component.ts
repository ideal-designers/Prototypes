import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbItem, DS_COMPONENTS, DroplistItem, ToastService } from '../../shared/ds';
import type { StatusChipPick } from '../../shared/ds';
import { BrStore } from './br-store.service';
import { BrRulesComponent } from './br-rules.component';
import { BrTrayComponent } from './br-tray.component';
import { Memo, StartRequest, ViewRequest } from './br-types';
import {
  DocNode, DocStatus, NODES, RuleSet, STATUS_LABEL, childrenOf, emptyRules, fileIconOf, filesUnder, nodeById, sameRules,
} from './bulk-redaction.data';

type View = 'empty' | 'files' | 'rules' | 'table';
type Filter = 'all' | 'applied' | 'marked' | 'none';
interface Row { node: DocNode; level: number; hasKids: boolean }

/**
 * Concept 1 — a dedicated "Redaction" section under Documents:
 * empty state → New redaction (Add files → Add redaction rules) → Redaction table with statuses.
 */
@Component({
  selector: 'fvdr-br-redaction-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, BrRulesComponent, BrTrayComponent],
  template: `
    <!-- ═══ Empty state ═══ -->
    <div class="empty" *ngIf="view === 'empty'">
      <h2 class="empty__title">You have no redacted documents yet</h2>
      <p class="empty__sub">Add files and folders to detect and redact sensitive information</p>
      <ol class="steps">
        <li class="steps__i"><img class="steps__img" src="assets/redaction/add-files.svg" alt="" />
          <b><span class="steps__n">1</span>Add files</b><small>Select files and folders you want to redact</small></li>
        <li class="steps__arrow" aria-hidden="true"><img src="assets/redaction/arrow-a.svg" alt="" /></li>
        <li class="steps__i"><img class="steps__img" src="assets/redaction/redaction-rules.svg" alt="" />
          <b><span class="steps__n">2</span>Add redaction rules</b><small>Select the type of information to redact</small></li>
        <li class="steps__arrow" aria-hidden="true"><img src="assets/redaction/arrow-b.svg" alt="" /></li>
        <li class="steps__i"><img class="steps__img" src="assets/redaction/preview-apply.svg" alt="" />
          <b><span class="steps__n">3</span>Preview and apply</b><small>Preview and apply your redaction marks</small></li>
      </ol>
      <fvdr-btn label="New redaction" variant="primary" iconName="plus" (clicked)="startWizard()"></fvdr-btn>
    </div>

    <!-- Batch tray: drafts being created / ready (same as the Documents list) -->
    <fvdr-br-tray *ngIf="trayOpen && store.batch && view === 'table'" (dismissed)="trayOpen = false" (review)="openViewer($event, 0)"></fvdr-br-tray>

    <!-- ═══ New redaction wizard ═══ -->
    <div class="wiz" *ngIf="view === 'files' || view === 'rules'">
      <div class="stepper">
        <span class="stepper__s" [class.stepper__s--on]="view === 'files'" [class.stepper__s--done]="view === 'rules'">
          <span class="stepper__n"><fvdr-icon *ngIf="view === 'rules'" name="check"></fvdr-icon><ng-container *ngIf="view === 'files'">1</ng-container></span>Add files</span>
        <span class="stepper__line"></span>
        <span class="stepper__s" [class.stepper__s--on]="view === 'rules'"><span class="stepper__n">2</span>Add redaction rules</span>
        <span class="grow"></span>
        <a class="learn">Learn more <fvdr-icon name="link"></fvdr-icon></a>
      </div>

      <!-- Step 1 -->
      <div class="wiz__body" *ngIf="view === 'files'">
        <div class="trow trow--root" [class.trow--sel]="allSelected">
          <span class="tchev"></span>
          <fvdr-checkbox [checked]="allSelected" [indeterminate]="someSelected && !allSelected"
                         (checkedChange)="toggleAll($event)" aria-label="Select everything"></fvdr-checkbox>
          <span class="badge">PA</span><span class="tname">Project Alpha</span>
        </div>
        <div class="trow" *ngFor="let r of pickRows; trackBy: trackRow" [class.trow--sel]="isChecked(r.node)" [style.padding-left.px]="r.level * 24">
          <button type="button" class="tchev tchev--btn" *ngIf="r.hasKids" [attr.aria-label]="open.has(r.node.id) ? 'Collapse' : 'Expand'"
                  (click)="toggleOpen(r.node.id)"><fvdr-icon [name]="open.has(r.node.id) ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
          <span class="tchev" *ngIf="!r.hasKids"></span>
          <fvdr-checkbox [checked]="isChecked(r.node)" [indeterminate]="isPartial(r.node)"
                         (checkedChange)="toggleNode(r.node, $event)"></fvdr-checkbox>
          <fvdr-file-icon [type]="icon(r.node)"></fvdr-file-icon>
          <span class="tidx">{{ r.node.index }}</span><span class="tname">{{ r.node.name }}</span>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="wiz__body wiz__body--rules" *ngIf="view === 'rules'">
        <!-- same editor as the Redact modal: one 520px column, template dropdown with rename / delete on the rows -->
        <fvdr-br-rules #rulesCmp picker="dropdown" chipSize="S" label="Templates" saveMode="modal" [(rules)]="rules" [(templateId)]="templateId"></fvdr-br-rules>
      </div>

      <footer class="foot">
        <ng-container *ngIf="view === 'files'">
          <fvdr-btn label="Cancel" variant="secondary" (clicked)="cancelWizard()"></fvdr-btn>
          <fvdr-btn label="Next" variant="primary" [disabled]="!selectedFiles.size" (clicked)="view = 'rules'; crumbs()"></fvdr-btn>
          <fvdr-checkbox label="Detect marks in all new files added to the selected folders" [(ngModel)]="autoDetect"></fvdr-checkbox>
        </ng-container>
        <ng-container *ngIf="view === 'rules'">
          <fvdr-btn label="Back" variant="secondary" (clicked)="view = 'files'; crumbs()"></fvdr-btn>
          <fvdr-btn *ngIf="!templateId" label="Save as template" variant="secondary" [disabled]="!hasRules" (clicked)="rulesCmp.openSave()"></fvdr-btn>
          <fvdr-btn *ngIf="templateModified" label="Update template" variant="secondary" (clicked)="rulesCmp.updateTemplate()"></fvdr-btn>
          <fvdr-btn label="Start detection" variant="primary" [disabled]="!hasRules" (clicked)="start()"></fvdr-btn>
        </ng-container>
      </footer>
    </div>

    <!-- ═══ Redaction table ═══ -->
    <div class="tbl" *ngIf="view === 'table'">
      <div class="tbl__main">
        <div class="tools">
          <fvdr-btn label="New redaction" variant="primary" iconName="plus" (clicked)="startWizard()"></fvdr-btn>
          <!-- Same actions as the row menu and the Redaction menu in the Documents list; only what can be done is shown -->
          <ng-container *ngIf="!checked.size">
            <fvdr-btn *ngIf="allReady && withMarks.length" label="Review marks" variant="secondary" iconName="eye" (clicked)="openViewer(withMarks, 0)"></fvdr-btn>
          </ng-container>
          <ng-container *ngIf="checked.size">
            <fvdr-btn *ngIf="!drafting && reviewable.length" label="Apply" variant="secondary" iconName="check" (clicked)="bulkApply()"></fvdr-btn>
            <fvdr-btn *ngIf="appliedSel.length" label="Unredact" variant="secondary" (clicked)="bulkUnredact()"></fvdr-btn>
            <fvdr-btn *ngIf="allReady && checkedWithMarks.length" label="Review marks" variant="secondary" iconName="eye" (clicked)="reviewSelected()"></fvdr-btn>
            <fvdr-btn *ngIf="!checkedWithMarks.length && !drafting && noMarksSel.length" label="Redact" variant="secondary" iconName="redact" (clicked)="startWizard()"></fvdr-btn>
            <span class="chg" *ngIf="!drafting && reviewable.length" (click)="$event.stopPropagation()">
              <fvdr-btn label="Change status" variant="secondary" (clicked)="statusOpen = !statusOpen"></fvdr-btn>
              <!-- same dropdown as the status chip in the table: dot + label -->
              <div class="chg__menu" *ngIf="statusOpen" role="listbox">
                <div class="chg__opt" *ngFor="let o of statusMenu" role="option" tabindex="0" (click)="bulkStatus(o.id)" (keydown.enter)="bulkStatus(o.id)">
                  <span class="chg__dot chg__dot--{{ o.id }}"></span>{{ o.label }}
                </div>
              </div>
            </span>
            <span class="sel">Selected: {{ checked.size }}</span>
          </ng-container>
          <span class="grow"></span>
          <fvdr-input class="search" placeholder="Search" iconLeft="search" size="m" [(ngModel)]="query"></fvdr-input>
        </div>

        <div class="chips">
          <fvdr-filter-btn label="All" size="S" [showIcon]="false" [showCounter]="true" [counter]="'' + count('all')" [selected]="filter === 'all'" (clicked)="filter = 'all'"></fvdr-filter-btn>
          <fvdr-filter-btn label="Applied" size="S" color="default" [showIcon]="false" [showStatus]="true" [showCounter]="true" [counter]="'' + count('applied')" [selected]="filter === 'applied'" (clicked)="filter = 'applied'"></fvdr-filter-btn>
          <fvdr-filter-btn label="Draft" size="S" color="stone" [showIcon]="false" [showStatus]="true" [showCounter]="true" [counter]="'' + count('marked')" [selected]="filter === 'marked'" (clicked)="filter = 'marked'"></fvdr-filter-btn>
          <fvdr-filter-btn label="No marks" size="S" [showIcon]="false" [showCounter]="true" [counter]="'' + count('none')" [selected]="filter === 'none'" (clicked)="filter = 'none'"></fvdr-filter-btn>
        </div>

        <div class="grid grid--head">
          <span><fvdr-checkbox [checked]="allChecked" [indeterminate]="checked.size > 0 && !allChecked" (checkedChange)="checkAll($event)"></fvdr-checkbox></span>
          <span class="h">
            <button type="button" class="exp" [fvdrTooltip]="allOpen ? 'Collapse all' : 'Expand all'" (click)="toggleExpandAll()"><fvdr-icon [name]="allOpen ? 'collapse' : 'expand'"></fvdr-icon></button>
            Name</span>
          <span class="h">Redaction marks</span><span class="h">Updated on</span><span></span>
        </div>
        <div class="grid grid--row" *ngFor="let r of tableRows; trackBy: trackRow" [class.grid--sel]="checked.has(r.node.id)"
             (click)="onRowClick(r.node, $event)">
          <span><fvdr-checkbox [checked]="checked.has(r.node.id)" (checkedChange)="toggleCheck(r.node.id, $event)"></fvdr-checkbox></span>
          <span class="name" [style.padding-left.px]="r.level * 24">
            <button type="button" class="tchev tchev--btn" *ngIf="r.hasKids" (click)="toggleOpen(r.node.id)"
                    [attr.aria-label]="open.has(r.node.id) ? 'Collapse' : 'Expand'"><fvdr-icon [name]="open.has(r.node.id) ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
            <span class="tchev" *ngIf="!r.hasKids"></span>
            <fvdr-file-icon [type]="icon(r.node)"></fvdr-file-icon>
            <span class="tidx">{{ r.node.index }}</span><span class="nm">{{ r.node.name }}</span>
          </span>
          <span class="marks">
            <ng-container *ngIf="agg(r.node) as a">
              <span *ngIf="statusOf(r.node) === 'none'" class="dash">—</span>
              <ng-container *ngIf="statusOf(r.node) !== 'none'">
                <fvdr-status-chip *ngIf="a.draft || statusOf(r.node) === 'detecting'" [status]="statusOf(r.node)" [counter]="a.draft || null"
                                [menu]="canMenu(r.node)" (picked)="rowStatus(r.node, $event)"></fvdr-status-chip>
                <fvdr-status-chip *ngIf="a.applied" status="applied" [counter]="a.applied"></fvdr-status-chip>
              </ng-container>
            </ng-container>
          </span>
          <span class="upd">{{ r.node.updated }}</span>
          <span class="acts" [class.acts--open]="menuRow === r.node.id" (click)="$event.stopPropagation()">
            <ng-container *ngIf="rowMenu(r.node) as items">
              <button type="button" class="act" *ngIf="items.length" aria-label="More actions"
                      (click)="menuRow = menuRow === r.node.id ? null : r.node.id"><fvdr-icon name="more"></fvdr-icon></button>
              <fvdr-droplist *ngIf="menuRow === r.node.id && items.length" class="rowmenu" [items]="items" [minWidth]="220"
                             (itemClick)="onRowMenu(r.node, $event)"></fvdr-droplist>
            </ng-container>
          </span>
        </div>
        <p class="none" *ngIf="!tableRows.length">Nothing matches this filter.</p>
      </div>

    </div>

  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: var(--font-family); color: var(--color-text-primary); }
    .grow { flex: 1; }
    /* empty */
    .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-8); text-align: center; }
    .empty__title { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semi); }
    .empty__sub { margin: 0 0 var(--space-8); font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .steps { display: flex; align-items: flex-start; gap: var(--space-4); list-style: none; margin: 0 0 var(--space-8); padding: 0; }
    .steps__i { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); width: 220px; }
    .steps__img { width: 176px; height: 120px; }
    .steps__arrow { margin-top: var(--space-12); }
    .steps__i b { font-size: var(--font-size-base); font-weight: var(--font-weight-semi); display: inline-flex; align-items: center; gap: var(--space-2); }
    .steps__n { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: var(--radius-full);
      background: var(--color-hover-bg); font-size: var(--text-caption1-size); }
    .steps__i small { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    /* wizard */
    .wiz { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .stepper { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); flex-shrink: 0; }
    .stepper__s { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-base); }
    .stepper__s--on { color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .stepper__n { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: var(--radius-full);
      background: var(--color-hover-bg); font-size: var(--text-caption1-size); }
    .stepper__s--on .stepper__n, .stepper__s--done .stepper__n { background: var(--color-primary-500); color: var(--color-text-inverse); }
    .stepper__line { width: 16px; height: 1px; background: var(--color-divider); }
    .learn { display: inline-flex; align-items: center; gap: var(--space-1); color: var(--color-primary-600); font-size: var(--font-size-base); cursor: pointer; }
    .wiz__body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 var(--space-6) var(--space-6); }
    .wiz__body--rules { padding-top: var(--space-2); max-width: calc(520px + var(--space-12)); }
    .chg { position: relative; }
    .chg__menu { position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 40; min-width: 160px; background: var(--color-stone-0);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-popup); }
    .chg__opt { display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 var(--space-4) 0 var(--space-3); cursor: pointer;
      font-size: var(--font-size-base); color: var(--color-text-primary); white-space: nowrap; }
    .chg__opt:hover { background: var(--color-stone-200); }
    .chg__dot { width: 8px; height: 8px; margin: 0 4px; border-radius: 2px; background: var(--color-stone-500); }
    .chg__dot--ready { background: var(--chip-dot-orange, #ffc694); }
    .chg__dot--reviewed { background: var(--chip-dot-purple, #ebd5ff); }
    .dash { color: var(--color-text-secondary); }
    .trow { display: flex; align-items: center; gap: var(--space-2); height: 40px; border-radius: var(--radius-sm); font-size: var(--font-size-base); }
    .trow--sel { background: var(--color-selected-row); }
    .trow--root { font-weight: var(--font-weight-semi); }
    .tchev { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-text-secondary); }
    .tchev--btn { border: none; background: transparent; cursor: pointer; border-radius: var(--radius-sm); padding: 0; }
    .tchev--btn:hover { background: var(--color-hover-bg); }
    .badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm);
      background: var(--color-primary-600); color: var(--color-text-inverse); font-size: var(--font-size-3xs); font-weight: var(--font-weight-semi); }
    .tidx { color: var(--color-text-secondary); min-width: 28px; }
    .tname, .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .foot fvdr-checkbox { margin-left: var(--space-3); }
    .foot { display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); height: 72px; flex-shrink: 0;
      border-top: 1px solid var(--color-divider); background: var(--color-stone-0); }
    /* table */
    .tbl { position: relative; display: flex; flex: 1; min-height: 0; }
    .tbl__main { flex: 1; min-width: 0; overflow-y: auto; padding: var(--space-4) var(--space-6) var(--space-12); }
    .tools { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .search { width: 320px; }
    .sel { font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .chips { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
    .grid { display: grid; grid-template-columns: 40px minmax(240px, 1fr) 280px 120px 72px; align-items: center; column-gap: var(--space-2);
      padding: 0 var(--space-3); min-height: 40px; }
    .grid--head { min-height: 48px; background: var(--color-stone-200); border-radius: var(--radius-sm); font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .h { display: inline-flex; align-items: center; gap: var(--space-2); }
    .exp { display: inline-flex; border: none; background: transparent; cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .exp:hover { background: var(--color-hover-bg); }
    .grid--row { cursor: pointer; min-height: 40px; font-size: var(--font-size-base); border-radius: var(--radius-sm); }
    .grid--row:hover { background: var(--color-hover-bg); }
    .grid--sel { background: var(--color-selected-row); }
    .grid--on { background: var(--color-hover-bg); }
    .name { display: inline-flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .spin { display: inline-flex; color: var(--color-info-primary); animation: br-spin 1s linear infinite; }
    @keyframes br-spin { to { transform: rotate(360deg); } }
    .st { position: relative; }
    .pill { display: inline-flex; align-items: center; gap: var(--space-1); border: none; background: transparent; cursor: pointer;
      padding: 0 var(--space-1) 0 0; border-radius: var(--radius-full); color: var(--color-text-secondary); }
    .pill:hover { background: var(--color-stone-300); }
    .menu { position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 30; }
    .marks { display: inline-flex; gap: var(--space-2); flex-wrap: wrap; }
    .mk { pointer-events: none; }
    .upd { color: var(--color-text-secondary); }
    .acts { display: inline-flex; gap: var(--space-1); justify-content: flex-end; opacity: 0; }
    .grid--row:hover .acts, .acts--open { opacity: 1; }
    .acts { position: relative; }
    .rowmenu { position: absolute; top: 100%; right: 0; z-index: 40; }
    /* same menu spec as the Documents context menu: 32px actions, #5F616A icons; the submenu opens to the left (the table edge is close) */
    .rowmenu ::ng-deep .droplist__item { height: 32px; }
    .rowmenu ::ng-deep .droplist__icon { color: var(--color-text-secondary); margin-top: 0; }
    .rowmenu ::ng-deep .droplist__submenu { left: auto; right: calc(100% + 2px); }
    .act { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: none; background: transparent;
      cursor: pointer; border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .act:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .none { color: var(--color-text-secondary); text-align: center; padding: var(--space-8); }
    @media (max-width: 1500px) { .grid { grid-template-columns: 40px minmax(200px, 1fr) 240px 100px 64px; } }
  `],
})
export class BrRedactionPageComponent implements OnInit {
  store = inject(BrStore);
  private toast = inject(ToastService);

  @Output() crumbsChange = new EventEmitter<BreadcrumbItem[]>();
  @Output() startRequest = new EventEmitter<StartRequest>();
  @Output() viewRequest = new EventEmitter<ViewRequest>();
  @ViewChild('rulesCmp') rulesCmp!: BrRulesComponent;

  view: View = 'empty';
  rules: RuleSet = emptyRules();
  templateId: string | null = null;
  autoDetect = true;
  /** Add files — selected file ids. */
  selectedFiles = new Set<string>();
  open = new Set<string>();
  /** Table */
  checked = new Set<string>();
  filter: Filter = 'all';
  query = '';
  statusOpen = false;
  menuRow: string | null = null;
  trayOpen = false;

  readonly icon = fileIconOf;
  readonly trackRow = (_: number, r: Row) => r.node.id;
  private readonly allFiles = NODES.filter(n => n.kind === 'file').map(n => n.id);

  ngOnInit(): void { this.view = this.store.roots.length ? 'table' : 'empty'; this.crumbs(); }

  @HostListener('document:click') closeMenu(): void { this.statusOpen = false; this.menuRow = null; }

  // ── Breadcrumbs + wizard ─────────────────────────────────────────────────
  crumbs(): void {
    const base: BreadcrumbItem[] = [{ id: 'documents', label: 'Documents' }, { id: 'redaction', label: 'Redaction' }];
    this.crumbsChange.emit(this.view === 'files' || this.view === 'rules' ? [...base, { id: 'new', label: 'New redaction' }] : base);
  }
  startWizard(): void {
    // New redaction on files picked in the table: straight to step 2; Back shows them already selected
    const picked = this.checked.size ? this.store.files([...this.checked]) : [];
    this.selectedFiles = new Set(picked);
    this.rules = emptyRules();
    this.templateId = null;
    this.open = new Set();
    this.view = picked.length ? 'rules' : 'files';
    this.checked.clear();
    this.crumbs();
  }
  cancelWizard(): void { this.view = this.store.roots.length ? 'table' : 'empty'; this.crumbs(); }
  /** Breadcrumb "Redaction" while in the wizard. */
  backToList(): void { if (this.view === 'files' || this.view === 'rules') this.cancelWizard(); }

  /** Rules differ from the chosen template, so "Update template" appears (Figma: Template changed). */
  get templateModified(): boolean {
    const t = this.store.template(this.templateId);
    return !!t && !sameRules(this.rules, t);
  }
  get hasRules(): boolean { return this.rules.categories.length > 0 || this.rules.keywords.length > 0; }

  start(): void {
    const roots = this.minimalRoots();
    this.startRequest.emit({
      nodes: roots, rules: this.rules, toast: true,
      done: () => { this.view = 'table'; this.filter = 'all'; this.checked.clear(); this.trayOpen = true; this.crumbs(); },
    });
  }

  // ── Add files tree ───────────────────────────────────────────────────────
  get pickRows(): Row[] { return this.flatten(null, 0, () => true); }
  private flatten(parent: string | null, level: number, keep: (n: DocNode) => boolean): Row[] {
    return childrenOf(parent).filter(keep).flatMap(n => {
      const kids = childrenOf(n.id).filter(keep);
      return [{ node: n, level, hasKids: kids.length > 0 }, ...(this.open.has(n.id) ? this.flatten(n.id, level + 1, keep) : [])];
    });
  }
  toggleOpen(id: string): void { this.open.has(id) ? this.open.delete(id) : this.open.add(id); }
  private filesOf(n: DocNode): string[] { return filesUnder(n.id).map(f => f.id); }
  isChecked(n: DocNode): boolean { const f = this.filesOf(n); return f.length > 0 && f.every(i => this.selectedFiles.has(i)); }
  isPartial(n: DocNode): boolean { const f = this.filesOf(n); return !this.isChecked(n) && f.some(i => this.selectedFiles.has(i)); }
  toggleNode(n: DocNode, on: boolean): void { this.filesOf(n).forEach(i => (on ? this.selectedFiles.add(i) : this.selectedFiles.delete(i))); }
  get allSelected(): boolean { return this.allFiles.every(i => this.selectedFiles.has(i)); }
  get someSelected(): boolean { return this.selectedFiles.size > 0; }
  toggleAll(on: boolean): void { this.selectedFiles = new Set(on ? this.allFiles : []); }

  /** Top-most fully-selected nodes (a folder when all of it is selected, otherwise its files). */
  private minimalRoots(): string[] {
    const walk = (parent: string | null): string[] => childrenOf(parent).flatMap(n =>
      this.isChecked(n) ? [n.id] : n.kind === 'folder' ? walk(n.id) : []);
    return walk(null);
  }

  // ── Table ────────────────────────────────────────────────────────────────
  private tracked(n: DocNode): string[] { return this.filesOf(n).filter(i => this.store.inRedaction(i)); }
  statusOf(n: DocNode): DocStatus { return n.kind === 'file' ? this.store.status(n.id) : this.store.aggregate(n.id).status; }
  agg(n: DocNode): { applied: number; draft: number } {
    return n.kind === 'file' ? { applied: this.store.count(n.id, 'applied'), draft: this.store.count(n.id, 'draft') } : this.store.aggregate(n.id);
  }
  private matches(n: DocNode): boolean {
    const files = this.tracked(n);
    if (!files.length) return false;
    const q = this.query.trim().toLowerCase();
    if (q && !n.name.toLowerCase().includes(q) && !files.some(i => nodeById(i).name.toLowerCase().includes(q))) return false;
    const hit = (id: string) => {
      const s = this.store.status(id);
      return this.filter === 'all' || (this.filter === 'applied' && s === 'applied') ||
        (this.filter === 'marked' && this.store.count(id, 'draft') > 0) || (this.filter === 'none' && !this.store.hasMarks(id));
    };
    return files.some(hit);
  }
  get tableRows(): Row[] {
    const out: Row[] = [];
    const walk = (n: DocNode, level: number) => {
      if (!this.matches(n)) return;
      const kids = childrenOf(n.id).filter(k => this.matches(k));
      out.push({ node: n, level, hasKids: kids.length > 0 });
      if (this.open.has(n.id)) kids.forEach(k => walk(k, level + 1));
    };
    this.store.roots.map(nodeById).sort((a, b) => NODES.indexOf(a) - NODES.indexOf(b)).forEach(n => walk(n, 0));
    return out;
  }
  get allOpen(): boolean {
    const folders = NODES.filter(n => n.kind === 'folder' && this.tracked(n).length);
    return folders.length > 0 && folders.every(n => this.open.has(n.id));
  }
  toggleExpandAll(): void {
    const folders = NODES.filter(n => n.kind === 'folder' && this.tracked(n).length).map(n => n.id);
    this.open = this.allOpen ? new Set() : new Set(folders);
  }
  count(f: Filter): number {
    const files = this.allFiles.filter(i => this.store.inRedaction(i));
    switch (f) {
      case 'all': return files.length;
      case 'applied': return files.filter(i => this.store.status(i) === 'applied').length;
      case 'marked': return files.filter(i => this.store.count(i, 'draft') > 0).length;
      default: return files.filter(i => !this.store.hasMarks(i)).length;
    }
  }
  get withMarks(): string[] { return this.allFiles.filter(i => this.store.inRedaction(i) && this.store.hasMarks(i)); }

  // Selection
  get allChecked(): boolean { const r = this.tableRows; return r.length > 0 && r.every(x => this.checked.has(x.node.id)); }
  checkAll(on: boolean): void { this.checked = new Set(on ? this.tableRows.map(r => r.node.id) : []); }
  toggleCheck(id: string, on: boolean): void { on ? this.checked.add(id) : this.checked.delete(id); }
  private checkedFiles(): string[] {
    return [...new Set([...this.checked].flatMap(id => this.tracked(nodeById(id))))];
  }
  get checkedWithMarks(): string[] { return this.checkedFiles().filter(i => this.store.hasMarks(i) && this.store.status(i) !== 'detecting'); }

  // Statuses — single row or folder (#9, #10): the chip opens the Draft / Ready for review / Reviewed dropdown
  canMenu(n: DocNode): boolean {
    return n.kind === 'file' ? this.store.canSetStatus(n.id) : this.tracked(n).some(i => this.store.canSetStatus(i));
  }
  rowStatus(n: DocNode, s: StatusChipPick): void {
    const c = this.store.setStatus(n.kind === 'file' ? [n.id] : this.tracked(n), s);
    this.toast.show({ variant: 'success', duration: 3000,
      message: c > 1 ? `${c} files changed to ${STATUS_LABEL[s].toLowerCase()}` : `Status changed to ${STATUS_LABEL[s].toLowerCase()}` });
  }
  // Bulk actions — same rules as the Redaction submenu in the Documents list
  readonly statusMenu: DroplistItem[] = [
    { id: 'draft', label: 'Draft' }, { id: 'ready', label: 'Ready for review' }, { id: 'reviewed', label: 'Reviewed' },
  ];
  /** Review marks only appears once drafting has finished for every document. */
  get allReady(): boolean { return this.allFiles.filter(i => this.store.inRedaction(i)).every(i => this.store.status(i) !== 'detecting'); }
  private menus = new Memo<DroplistItem[]>();
  /** The ⋯ menu of a row: the same actions as the toolbar, for that row's files only. */
  rowMenu(n: DocNode): DroplistItem[] {
    const files = this.tracked(n);
    const drafting = files.some(i => this.store.status(i) === 'detecting');
    const reviewable = files.some(i => this.store.canSetStatus(i));
    const applied = files.some(i => this.store.status(i) === 'applied');
    const review = this.allReady && files.some(i => this.store.hasMarks(i));
    const redact = !drafting && files.length > 0 && !files.some(i => this.store.hasMarks(i));
    return this.menus.get(`row|${drafting}|${reviewable}|${applied}|${review}|${redact}`, () => [
      ...(!drafting && reviewable ? [{ id: 'apply', label: 'Apply', icon: 'check' as const }] : []),
      ...(applied ? [{ id: 'unredact', label: 'Unredact', icon: 'undo' as const }] : []),
      ...(review ? [{ id: 'review', label: 'Review marks', icon: 'eye' as const }] : []),
      ...(redact ? [{ id: 'redact', label: 'Redact', icon: 'redact' as const }] : []),
      ...(!drafting && reviewable ? [{ id: 'status', label: 'Change status', icon: 'edit' as const, children: this.statusMenu }] : []),
    ]);
  }
  onRowMenu(n: DocNode, item: DroplistItem): void {
    this.menuRow = null;
    const files = this.tracked(n);
    switch (item.id) {
      case 'apply': { const c = this.store.apply(files.filter(i => this.store.canSetStatus(i)));
        this.toast.show({ variant: 'success', message: `Redaction applied in ${c} file${c === 1 ? '' : 's'}`, duration: 3000 }); break; }
      case 'unredact': { const c = this.store.unredact(files);
        this.toast.show({ variant: 'success', message: `Redaction removed from ${c} file${c === 1 ? '' : 's'}`, duration: 3000 }); break; }
      case 'review': this.openRow(n); break;
      case 'redact': this.checked = new Set([n.id]); this.startWizard(); break;
      default: if (['draft', 'ready', 'reviewed'].includes(item.id)) this.rowStatus(n, item.id as StatusChipPick);
    }
  }
  get noMarksSel(): string[] { return this.checkedFiles().filter(i => !this.store.hasMarks(i) && this.store.status(i) !== 'detecting'); }
  get drafting(): boolean { return this.checkedFiles().some(i => this.store.status(i) === 'detecting'); }
  get reviewable(): string[] { return this.checkedFiles().filter(i => this.store.canSetStatus(i)); }
  get appliedSel(): string[] { return this.checkedFiles().filter(i => this.store.status(i) === 'applied'); }
  bulkStatus(s: string): void {
    this.statusOpen = false;
    const n = this.store.setStatus(this.checkedFiles(), s as 'draft' | 'ready' | 'reviewed');
    this.toast.show({ variant: n ? 'success' : 'info', duration: 3000,
      message: n ? `${n} file${n === 1 ? '' : 's'} changed to ${STATUS_LABEL[s as DocStatus].toLowerCase()}` : 'Nothing to update' });
    this.checked.clear();
  }
  bulkApply(): void {
    const n = this.store.apply(this.reviewable);
    this.toast.show({ variant: 'success', message: `Redaction applied in ${n} file${n === 1 ? '' : 's'}`, duration: 3000 });
    this.checked.clear();
  }
  bulkUnredact(): void {
    const n = this.store.unredact(this.appliedSel);
    this.toast.show({ variant: 'success', message: `Redaction removed from ${n} file${n === 1 ? '' : 's'}`, duration: 3000 });
    this.checked.clear();
  }
  reviewSelected(): void { const f = this.checkedWithMarks; this.checked.clear(); this.openViewer(f, 0); }

  // Viewer
  private rowFiles(n: DocNode): string[] { return this.tracked(n).filter(i => this.store.hasMarks(i)); }
  /** Opens the viewer on this row's files only (a file → just that file, a folder → the files with marks inside it). */
  openRow(n: DocNode): void {
    const f = this.rowFiles(n);
    if (!f.length) { this.toast.show({ variant: 'info', message: 'No marks to review yet', duration: 3000 }); return; }
    this.openViewer(f, 0);
  }
  /** Click anywhere on a file row opens the viewer; folders expand. Controls inside the row keep their own click. */
  onRowClick(n: DocNode, e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('fvdr-checkbox, button, fvdr-status-chip, .acts, fvdr-droplist')) return;
    if (n.kind === 'folder') { this.toggleOpen(n.id); return; }
    if (this.allReady && this.store.hasMarks(n.id)) this.openRow(n);
  }
  /** Expands the table down to a folder (used when the viewer's folder breadcrumb is clicked). */
  reveal(id: string): void {
    this.view = 'table';
    for (let n = id ? nodeById(id) : null; n; n = n.parent ? nodeById(n.parent) : null) this.open.add(n.id);
    this.crumbs();
  }
  openViewer(ids: string[], index: number): void { this.viewRequest.emit({ ids, index }); }
}
