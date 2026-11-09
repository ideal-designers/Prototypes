import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbItem, DS_COMPONENTS, DropdownOption, HeaderAction, SidebarNavItem } from '../../shared/ds';
import type { FvdrFileType } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { ProtoGroup, VdrProtoSwitcherComponent } from '../_shared/proto-switcher.component';

type Variant = 'A' | 'B';
type FilterMode = 'all' | 'renamed' | 'low';

interface Item {
  id: string;
  index: string;
  name: string;
  /** Name before renaming (includes its own numbering, as in the source file). */
  orig: string;
  kind: 'folder' | 'file';
  ext?: 'pdf' | 'xls' | 'doc' | 'ppt';
  parent: string | null;
  level: number;
  low?: boolean;
  kids?: boolean;
}

interface Row { item: Item; level: number; open: boolean; hasKids: boolean }

const f = (id: string, index: string, name: string, orig: string, parent: string | null, level: number, kids = false): Item =>
  ({ id, index, name, orig, kind: 'folder', parent, level, kids });
const d = (id: string, index: string, name: string, orig: string, ext: Item['ext'], parent: string, level: number, low = false): Item =>
  ({ id, index, name, orig, kind: 'file', ext, parent, level, low });

/** Same structure on both sides — only the names differ. */
const DATA: Item[] = [
  f('1', '1', 'ODM intellectual property', 'ODM intellectual property', null, 0),
  f('2', '2', 'Intellectual property', '02. Intellectual property', null, 0),
  f('2.1', '2.1', 'Licensing', '2.1 Licensing', '2', 1),
  d('2.1.1', '2.1.1', 'Licence agreement – ACME Inc.pdf', '2.1.1_Licence agreement – ACME Inc.pdf', 'pdf', '2.1', 2),
  d('2.1.2', '2.1.2', 'Licence agreement – Orion Ltd.pdf', '2.1.2 Licence agreement – Orion Ltd (2).pdf', 'pdf', '2.1', 2),
  d('2.1.3', '2.1.3', 'Royalty schedule.xlsx', '2.1.3-Royalty schedule FINAL.xlsx', 'xls', '2.1', 2),
  f('2.2', '2.2', 'Litigation', '02.2 Litigation', '2', 1),
  d('2.2.1', '2.2.1', 'Court ruling – Case 14-2231 – 2022-05-18.pdf', 'scan0012.pdf', 'pdf', '2.2', 2, true),
  d('2.2.2', '2.2.2', 'Settlement agreement.docx', 'Settlement agreement.docx', 'doc', '2.2', 2),
  d('2.2.3', '2.2.3', 'Expert opinion.docx', '2_2_3 Expert opinion.docx', 'doc', '2.2', 2),
  f('2.3', '2.3', 'Trademarks', '2.3. Trademarks', '2', 1),
  d('2.3.1', '2.3.1', 'Trademark register.xlsx', 'Trademark register.xlsx', 'xls', '2.3', 2),
  f('2.4', '2.4', 'Patents', 'Patents', '2', 1),
  d('2.4.1', '2.4.1', 'Patent portfolio.pdf', 'Patent portfolio.pdf', 'pdf', '2.4', 2),
  d('2.5', '2.5', 'IP overview.pptx', 'IP_overview_v3 (old).pptx', 'ppt', '2', 1),
  f('3', '3', 'Financial statements', 'Financial statements', null, 0),
  f('4', '4', 'Employment', 'Employment', null, 0),
  f('5', '5', 'Insurance', 'Insurance', null, 0),
];

/**
 * Bulk rename with AI — step 2 "Review names": how the "Show original names" diff view appears.
 *   Variant A · original on the RIGHT  (toggle next to the filter) — Figma Staging Hub / FVDR / NT, section A
 *   Variant B · original on the LEFT   (toggle next to Rebuild index) — section B
 * Structure never changes, only names. New names are editable, original names are a read-only reference.
 */
@Component({
  selector: 'fvdr-bulk-rename-original-names',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent],
  template: `
    <div class="dark-theme app">
      <fvdr-sidebar-nav variant="vdr" accountName="Project Alpha" accountMark="PA" [items]="navItems" [collapsed]="true"></fvdr-sidebar-nav>

      <div class="main">
        <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="TN"></fvdr-header>

        <div class="content">
          <!-- Stepper -->
          <div class="stepper">
            <span class="stepper__s stepper__s--done"><span class="stepper__n"><fvdr-icon name="check"></fvdr-icon></span>Describe changes</span>
            <span class="stepper__line"></span>
            <span class="stepper__s stepper__s--on"><span class="stepper__n">2</span>Review names</span>
            <span class="grow"></span>
            <a class="learn">Learn more <fvdr-icon name="link"></fvdr-icon></a>
          </div>

          <!-- Toolbar: where the toggle sits is the difference between the variants -->
          <div class="controls">
            <fvdr-btn label="Rebuild index" variant="secondary" iconName="action-list"></fvdr-btn>
            <fvdr-toggle *ngIf="variant === 'B'" class="toggle" label="Show original names" [checked]="showOrig" (checkedChange)="setShowOrig($event)"></fvdr-toggle>
            <span class="grow"></span>
            <fvdr-toggle *ngIf="variant === 'A'" class="toggle" label="Show original names" [checked]="showOrig" (checkedChange)="setShowOrig($event)"></fvdr-toggle>
            <fvdr-dropdown class="filter" [options]="filterOptions" [value]="filter" [iconLeft]="filterIcon"
                           (valueChange)="setFilter($event)"></fvdr-dropdown>
          </div>

          <!-- Trees: one scroll area, so both columns scroll together and rows stay aligned -->
          <div class="scroll">
            <div class="split" #split [style.--ow]="origShare" [class.split--b]="variant === 'B'" [class.split--on]="showOrig" [class.split--nohead]="!showHeader" [class.split--drag]="dragging">
              <section class="col col--new" aria-label="New names">
                <div class="col__top"><div class="col__head"><span>New names</span></div></div>
                <div class="rows">
                  <div class="row" *ngFor="let r of rows; trackBy: trackRow" [class.row--hot]="hot === r.item.id"
                       (mouseenter)="hot = r.item.id" (mouseleave)="hot = null">
                    <span class="row__main" [style.padding-left.px]="16 + r.level * 24">
                      <button type="button" class="chev" *ngIf="r.hasKids" [attr.aria-label]="r.open ? 'Collapse' : 'Expand'" (click)="toggle(r.item.id)">
                        <fvdr-icon [name]="r.open ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
                      <span class="chev chev--ghost" *ngIf="!r.hasKids"></span>
                      <fvdr-file-icon [type]="icon(r.item)"></fvdr-file-icon>
                      <span class="idx">{{ r.item.index }}</span>
                      <input *ngIf="editing === r.item.id" class="edit" [(ngModel)]="editValue" aria-label="New name"
                             (keydown.enter)="saveEdit(r.item)" (keydown.escape)="editing = null" (blur)="saveEdit(r.item)" />
                      <button *ngIf="editing !== r.item.id" type="button" class="name" (click)="startEdit(r.item)" fvdrTooltip="Click to edit">{{ r.item.name }}</button>
                    </span>
                    <span class="row__st">
                      <span class="badge" *ngIf="r.item.low">Low confidence</span>
                      <fvdr-icon *ngIf="changed(r.item)" class="ren" name="rename"></fvdr-icon>
                    </span>
                  </div>
                </div>
              </section>

              <div class="resizer" role="separator" aria-orientation="vertical" aria-label="Resize columns" tabindex="-1"
                   (pointerdown)="startResize($event, split)" (dblclick)="origShare = 0.5"></div>

              <section class="col col--orig" aria-label="Original names" [attr.aria-hidden]="!showOrig">
                <div class="col__top"><div class="col__head"><span>Original names</span></div></div>
                <div class="rows rows--ref">
                  <div class="row" *ngFor="let r of rows; trackBy: trackRow" [class.row--hot]="hot === r.item.id"
                       (mouseenter)="hot = r.item.id" (mouseleave)="hot = null">
                    <span class="row__main" [style.padding-left.px]="16 + r.level * 24">
                      <button type="button" class="chev" *ngIf="r.hasKids" tabindex="-1" (click)="toggle(r.item.id)">
                        <fvdr-icon [name]="r.open ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
                      <span class="chev chev--ghost" *ngIf="!r.hasKids"></span>
                      <fvdr-file-icon [type]="icon(r.item)"></fvdr-file-icon>
                      <span class="idx">{{ r.item.index }}</span>
                      <span class="name name--ref">{{ r.item.orig }}</span>
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bar">
          <fvdr-btn label="Back" variant="secondary"></fvdr-btn>
          <fvdr-btn label="Rename" variant="primary"></fvdr-btn>
          <button type="button" class="chip" [class.chip--active]="filter === 'renamed'" (click)="setFilter(filter === 'renamed' ? 'all' : 'renamed')"><fvdr-icon name="rename"></fvdr-icon>{{ renamedCount }} items to rename</button>
          <button type="button" class="chip chip--warn" *ngIf="lowCount" [class.chip--active]="filter === 'low'" (click)="setFilter(filter === 'low' ? 'all' : 'low')"><fvdr-icon name="warning"></fvdr-icon>{{ lowCount }} with low confidence</button>
          <span class="grow"></span>
          <span class="ai">AI-generated – check for accuracy</span>
        </div>
      </div>

      <fvdr-vdr-proto-switcher [groups]="groups" [showRestart]="true" (changed)="onOption($event)" (restart)="restart()"></fvdr-vdr-proto-switcher>
    </div>
  `,
  styles: [`
    /* slide-in time of the original-names column (brief: ~250–300ms) */
    :host { --slide: 280ms; display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); }
    .app { --warn-bg: color-mix(in srgb, var(--color-alert-warning) 18%, var(--color-stone-0)); display: flex; height: 100%; background: var(--color-bg-page); color: var(--color-text-primary); font-size: var(--font-size-base); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .grow { flex: 1; }
    .content { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-6); }

    /* Stepper */
    .stepper { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
    .stepper__s { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); }
    .stepper__s--on { color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .stepper__n { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: var(--radius-full);
      background: var(--color-hover-bg); font-size: var(--text-caption1-size); }
    .stepper__s--on .stepper__n, .stepper__s--done .stepper__n { background: var(--color-primary-500); color: var(--color-stone-0); }
    .stepper__line { width: 16px; height: 1px; background: var(--color-divider); }
    .learn { display: inline-flex; align-items: center; gap: var(--space-1); color: var(--color-primary-500); cursor: pointer; }

    /* Controls */
    .controls { display: flex; align-items: center; gap: var(--space-4); flex-shrink: 0; }
    .toggle { margin-right: var(--space-2); }
    .controls .filter { width: 224px; }
    .controls .toggle + .filter { margin-left: var(--space-2); }

    /* Trees */
    .scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
    .split { display: flex; align-items: flex-start; min-height: 100%; }
    .col { min-width: 0; }
    .col--new { flex: 1 1 0; }
    .col--orig { flex: 0 0 0; width: 0; opacity: 0; overflow: clip; margin: 0; pointer-events: none;
      transition: flex-basis var(--slide) ease-out, width var(--slide) ease-out, opacity var(--slide) ease-out; }
    /* --ow = share of the (width minus the 16px gutter) taken by the original column; dragged via .resizer */
    .split--on .col--orig { flex-basis: calc((100% - var(--space-4)) * var(--ow, 0.5)); width: calc((100% - var(--space-4)) * var(--ow, 0.5)); opacity: 1; pointer-events: auto; }
    .resizer { flex: 0 0 0; width: 0; align-self: stretch; position: relative; overflow: visible; transition: flex-basis var(--slide) ease-out, width var(--slide) ease-out; }
    .split--on .resizer { flex-basis: var(--space-4); width: var(--space-4); cursor: col-resize; touch-action: none; }
    .split--on .resizer::before { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px;
      border-radius: var(--radius-sm); background: transparent; transition: background var(--slide) ease-out; }
    .split--on .resizer:hover::before, .split--drag .resizer::before { background: var(--color-primary-500); }
    .split--drag { cursor: col-resize; user-select: none; }
    .split--drag .col--orig, .split--drag .resizer { transition: none; }
    /* A: original on the right · B: original on the left */
    .split--b .col--orig { order: -2; }
    .split--b .resizer { order: -1; }

    /* column headers stay put while the rows scroll under them */
    .col__top { position: sticky; top: 0; z-index: 3; background: var(--color-bg-page); }
    .col__head { display: flex; align-items: center; height: 40px; overflow: hidden; padding: 0 var(--space-4); margin-bottom: var(--space-2);
      border-radius: var(--radius-sm); background: var(--color-bg-surface); font-weight: var(--font-weight-semi); white-space: nowrap; }
    .split--nohead .col__head { display: none; }
    .rows--ref { background: var(--color-stone-100); border-radius: var(--radius-sm); }

    .row { display: flex; align-items: center; justify-content: space-between; height: 40px; border-radius: var(--radius-sm); }
    .row--hot { background: var(--color-hover-bg); }
    .row__main { display: flex; align-items: center; gap: var(--space-2); min-width: 0; flex: 1; padding-right: var(--space-4); }
    .row__st { display: flex; align-items: center; gap: var(--space-3); padding-right: var(--space-4); flex-shrink: 0; color: var(--color-text-secondary); }
    .ren { color: var(--color-stone-800, var(--color-text-secondary)); }
    .chev { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; padding: 0; border: none;
      background: transparent; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-xs); }
    .chev:hover { color: var(--color-text-primary); }
    .chev--ghost { cursor: default; }
    .idx { margin-left: var(--space-1); flex-shrink: 0; }
    .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: none; background: transparent; padding: 0; text-align: left;
      font-family: inherit; font-size: inherit; color: inherit; cursor: text; }
    .name:not(.name--ref):hover { text-decoration: underline; text-decoration-color: var(--color-stone-500); text-underline-offset: 3px; }
    .name--ref { cursor: default; }
    .edit { flex: 1; min-width: 0; height: 28px; padding: 0 var(--space-2); border: 1px solid var(--color-primary-500); border-radius: var(--radius-sm); outline: none;
      background: var(--color-stone-0); color: var(--color-text-primary); font-family: inherit; font-size: inherit; }

    /* Footer */
    .bar { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) var(--space-6); flex-shrink: 0; border-top: 1px solid var(--color-divider); }
    .chip { display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-3); border-radius: var(--radius-sm);
      background: var(--color-bg-surface); }
    .chip { border: 0; font: inherit; cursor: pointer; }
    .chip--active { outline: 1px solid var(--color-stone-600); outline-offset: -1px; }
    .chip--warn { background: var(--warn-bg); }
    .chip--warn fvdr-icon { color: var(--color-alert-warning); }
    /* Low confidence: orange label on a dark amber tint (Figma "Badge · Document request") */
    .badge { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: var(--radius-sm); background: var(--warn-bg);
      color: var(--color-alert-warning); font-size: var(--text-caption1-size); line-height: 16px; white-space: nowrap; }
    .ai { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    fvdr-vdr-proto-switcher { top: var(--space-3); bottom: auto; }
  `],
})
export class BulkRenameOriginalNamesComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  variant: Variant = 'A';
  showOrig = false;
  /** Column headers (New names / Original names) on or off. */
  showHeader = true;
  /** Share of the width taken by the Original names column (0.25–0.75). */
  origShare = 0.5;
  dragging = false;
  filter: FilterMode = 'all';
  open = new Set<string>(['2', '2.1', '2.2', '2.3', '2.4']);
  hot: string | null = null;
  editing: string | null = null;
  editValue = '';
  items: Item[] = DATA.map(i => ({ ...i }));

  readonly crumbs: BreadcrumbItem[] = [{ id: 'documents', label: 'Documents' }, { id: 'rename', label: 'Bulk rename' }];
  readonly headerActions: HeaderAction[] = [{ id: 'theme', icon: 'theme-light', label: 'Light mode' }, { id: 'help', icon: 'help', label: 'Help' }];
  readonly navItems: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', active: true },
    { id: 'checklist', label: 'Due diligence checklist', icon: 'nav-checklist', iconActive: 'nav-checklist' },
    { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
    { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    { id: 'recycle-bin', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];
  readonly filterOptions: DropdownOption[] = [
    { value: 'all', label: 'Full structure', icon: 'folders-all' },
    { value: 'renamed', label: 'Renamed', icon: 'rename' },
    { value: 'low', label: 'Low confidence', icon: 'warning' },
  ];
  get filterIcon(): 'folders-all' | 'rename' | 'warning' { return this.filter === 'all' ? 'folders-all' : this.filter === 'renamed' ? 'rename' : 'warning'; }

  get groups(): ProtoGroup[] {
    return [
      { id: 'variant', label: 'Structure placement', value: this.variant, options: [
        { id: 'A', label: 'Original on the right' }, { id: 'B', label: 'Original on the left' } ] },
      { id: 'header', label: 'Header', value: this.showHeader ? 'yes' : 'no', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] },
    ];
  }

  ngOnInit(): void { this.tracker.trackPageView('bulk-rename-original-names'); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  onOption(e: { group: string; value: string }): void {
    if (e.group === 'variant') this.variant = e.value as Variant;
    if (e.group === 'header') this.showHeader = e.value === 'yes';
  }
  startResize(e: PointerEvent, split: HTMLElement): void {
    e.preventDefault();
    this.dragging = true;
    const rect = split.getBoundingClientRect();
    const gutter = 16;
    const move = (ev: PointerEvent) => {
      const usable = rect.width - gutter;
      const share = this.variant === 'B' ? (ev.clientX - rect.left - gutter / 2) / usable : (rect.right - ev.clientX - gutter / 2) / usable;
      this.origShare = Math.min(0.75, Math.max(0.25, share));
    };
    const up = () => { this.dragging = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  restart(): void {
    this.origShare = 0.5;
    this.items = DATA.map(i => ({ ...i }));
    this.open = new Set(['2', '2.1', '2.2', '2.3', '2.4']);
    this.showOrig = false;
    this.filter = 'all';
    this.editing = null;
  }

  setShowOrig(v: boolean): void { this.showOrig = v; this.tracker.trackTask('bulk-rename-original-names', 'task_complete'); }
  setFilter(v: string | string[]): void { this.filter = (Array.isArray(v) ? v[0] : v) as FilterMode; this.editing = null; }

  // ── Tree ─────────────────────────────────────────────────────────────────
  changed = (i: Item): boolean => i.name !== i.orig;
  icon = (i: Item): FvdrFileType => (i.kind === 'folder' ? 'folder-dark' : i.ext === 'ppt' ? 'ppt' : i.ext === 'xls' ? 'xls' : i.ext === 'doc' ? 'doc' : 'pdf');
  trackRow = (_: number, r: Row) => r.item.id;
  private hasChildren(id: string): boolean { return this.items.some(i => i.parent === id) || !!this.items.find(i => i.id === id)?.kids; }

  /** Visible rows — the same list drives both columns, so they can never drift apart. */
  get rows(): Row[] {
    if (this.filter !== 'all') {
      return this.items.filter(i => this.filter === 'low' ? !!i.low : this.changed(i)).map(item => ({ item, level: 0, open: false, hasKids: false }));
    }
    const out: Row[] = [];
    const visible = (i: Item): boolean => {
      for (let p = i.parent; p; ) { if (!this.open.has(p)) return false; p = this.items.find(x => x.id === p)?.parent ?? null; }
      return true;
    };
    for (const item of this.items) if (visible(item)) out.push({ item, level: item.level, open: this.open.has(item.id), hasKids: item.kind === 'folder' && this.hasChildren(item.id) });
    return out;
  }
  toggle(id: string): void { this.open.has(id) ? this.open.delete(id) : this.open.add(id); }

  // ── Inline edit (new names only) ─────────────────────────────────────────
  startEdit(i: Item): void {
    this.editing = i.id;
    this.editValue = i.name;
    setTimeout(() => (document.querySelector('.edit') as HTMLInputElement | null)?.select());
  }
  saveEdit(i: Item): void {
    if (this.editing !== i.id) return;
    const v = this.editValue.trim();
    if (v) i.name = v;
    this.editing = null;
  }

  get renamedCount(): number { return this.items.filter(i => this.changed(i)).length; }
  get lowCount(): number { return this.items.filter(i => i.low).length; }
}
