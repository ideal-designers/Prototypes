import { Component, EventEmitter, HostListener, OnInit, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbItem, DS_COMPONENTS, DroplistItem, QuickAccessItem, ToastService } from '../../shared/ds';
import { BrStore } from './br-store.service';
import { BrRulesComponent } from './br-rules.component';
import { BrStatusComponent, BrStatusPick } from './br-status.component';
import { BrTrayComponent } from './br-tray.component';
import { Memo, StartRequest, ViewRequest } from './br-types';
import {
  DocNode, DocStatus, NODES, RuleSet, STATUS_LABEL, childrenOf, emptyRules, fileIconOf, filesUnder, nodeById, pathOf,
} from './bulk-redaction.data';

interface TreeRow { node: DocNode; level: number; hasKids: boolean }

/**
 * Concept 2 — everything happens on the standard Documents page: select files/folders →
 * ⋯ → Redact → "Redact N items" modal → draft marks are created in the background → the
 * Redaction column shows the status and "Review results" opens the viewer.
 */
@Component({
  selector: 'fvdr-br-documents-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, BrRulesComponent, BrStatusComponent, BrTrayComponent],
  template: `
    <div class="toolbar">
      <fvdr-btn label="Add" variant="primary" iconName="plus"></fvdr-btn>
      <fvdr-btn label="Publish" variant="secondary" iconName="publish"></fvdr-btn>
      <fvdr-btn label="Download" variant="secondary" iconName="download"></fvdr-btn>
      <fvdr-btn label="Project index" variant="secondary" iconName="action-list"></fvdr-btn>
      <span class="more">
        <fvdr-btn variant="secondary" iconName="more" [iconOnly]="true" ariaLabel="More actions"
                  (clicked)="moreOpen = !moreOpen; $event.stopPropagation()"></fvdr-btn>
        <fvdr-droplist *ngIf="moreOpen" class="more__menu" [items]="moreItems" [minWidth]="260"
                       (click)="$event.stopPropagation()" (itemClick)="onMore($event)"></fvdr-droplist>
      </span>
      <span class="sel" *ngIf="selected.size">Selected: {{ selected.size }}</span>
      <span class="grow"></span>
      <fvdr-input class="search" placeholder="Search" iconLeft="search" size="m" [(ngModel)]="query"></fvdr-input>
    </div>

    <div class="content">
      <aside class="qa">
        <fvdr-quick-access-menu [items]="shortcuts" [width]="320" [showCollapseAll]="true"></fvdr-quick-access-menu>
        <div class="tree">
          <div class="tree__row" [class.tree__row--on]="folder === null" (click)="go(null)">
            <span class="tree__chev"></span><span class="badge">PA</span><span class="tree__lbl">Project Alpha</span>
          </div>
          <div class="tree__row" *ngFor="let r of treeRows; trackBy: trackRow" [class.tree__row--on]="folder === r.node.id"
               [style.padding-left.px]="16 + r.level * 16" (click)="go(r.node.id)">
            <button type="button" class="tree__chev tree__chev--btn" *ngIf="r.hasKids" [attr.aria-label]="open.has(r.node.id) ? 'Collapse' : 'Expand'"
                    (click)="toggleOpen(r.node.id); $event.stopPropagation()"><fvdr-icon [name]="open.has(r.node.id) ? 'chevron-down' : 'chevron-right'"></fvdr-icon></button>
            <span class="tree__chev" *ngIf="!r.hasKids"></span>
            <fvdr-file-icon type="folder-colored"></fvdr-file-icon>
            <span class="tree__lbl">{{ r.node.name }}</span>
          </div>
        </div>
      </aside>

      <section class="tbl">
        <div class="grid grid--head">
          <span><fvdr-checkbox [checked]="allChecked" [indeterminate]="selected.size > 0 && !allChecked" (checkedChange)="checkAll($event)"></fvdr-checkbox></span>
          <span class="h">Index</span><span class="h">Name</span><span class="h">Publishing</span><span class="h">Redaction</span>
        </div>
        <div class="grid grid--row" *ngFor="let n of rows; trackBy: trackNode" [class.grid--sel]="selected.has(n.id)">
          <span><fvdr-checkbox [checked]="selected.has(n.id)" (checkedChange)="toggle(n.id, $event)"></fvdr-checkbox></span>
          <span class="idx">{{ n.index }}</span>
          <span class="name">
            <fvdr-file-icon [type]="icon(n)"></fvdr-file-icon>
            <button type="button" class="nm nm--link" *ngIf="n.kind === 'folder'" (click)="go(n.id)">{{ n.name }}</button>
            <span class="nm" *ngIf="n.kind === 'file'">{{ n.name }}</span>
          </span>
          <span class="pub"><fvdr-icon name="cross-circle"></fvdr-icon></span>
          <span class="st">
            <fvdr-br-status *ngIf="tracked(n) && statusOf(n) !== 'none'; else dash" [status]="statusOf(n)" [menu]="canMenu(n)" (picked)="rowStatus(n, $event)"></fvdr-br-status>
            <ng-template #dash><span class="dash">—</span></ng-template>
          </span>
        </div>
        <p class="none" *ngIf="!rows.length">This folder is empty.</p>
      </section>
    </div>

    <!-- Redact N items — same rule editor as concept 1's "Add redaction rules" step -->
    <fvdr-modal [visible]="redactOpen" [title]="'Redact ' + selected.size + (selected.size === 1 ? ' item' : ' items')" size="m"
                (closed)="redactOpen = false">
      <fvdr-br-rules #rulesCmp picker="dropdown" chipSize="S" [(rules)]="rules" [(templateId)]="templateId"></fvdr-br-rules>
      <!-- Footer: name field replaces it while saving a template (no second modal) -->
      <div class="mfoot" *ngIf="!rulesCmp.naming">
        <span class="mfoot__l">
          <button type="button" class="link" *ngIf="!rulesCmp.templateId" [disabled]="!hasRules" (click)="rulesCmp.openSave()">Save as template</button>
          <button type="button" class="link" *ngIf="rulesCmp.modified" (click)="rulesCmp.updateTemplate()">Update template</button>
        </span>
        <fvdr-btn label="Cancel" variant="secondary" (clicked)="redactOpen = false"></fvdr-btn>
        <fvdr-btn label="Create drafts" variant="primary" [disabled]="!hasRules" (clicked)="createDrafts()"></fvdr-btn>
      </div>
      <div class="mfoot" *ngIf="rulesCmp.naming">
        <fvdr-input class="mfoot__in" placeholder="Enter template name" [(ngModel)]="rulesCmp.saveName" (keydown.enter)="rulesCmp.doSave()"></fvdr-input>
        <fvdr-btn variant="primary" iconName="check" [iconOnly]="true" ariaLabel="Save template" [disabled]="!rulesCmp.saveName.trim()" (clicked)="rulesCmp.doSave()"></fvdr-btn>
        <fvdr-btn variant="secondary" iconName="close" [iconOnly]="true" ariaLabel="Cancel" (clicked)="rulesCmp.setNaming(false)"></fvdr-btn>
      </div>
    </fvdr-modal>

    <fvdr-br-tray *ngIf="progressOpen && batch" (dismissed)="progressOpen = false" (review)="openViewer($event, 0, true)"></fvdr-br-tray>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; font-family: var(--font-family); color: var(--color-text-primary); }
    .grow { flex: 1; }
    .toolbar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); flex-shrink: 0; }
    .more { position: relative; }
    .more__menu { position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 40; }
    /* Context menu spec: 32px actions, icons #5F616A (delete stays red) */
    .more__menu ::ng-deep .droplist__item { height: 32px; }
    .more__menu ::ng-deep .droplist__icon { color: var(--color-text-secondary); margin-top: 0; }
    .more__menu ::ng-deep .droplist__item--danger .droplist__icon { color: var(--color-error-600); }
    .sel { font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .search { width: 320px; }
    .content { display: flex; flex: 1; min-height: 0; gap: var(--space-6); padding: 0 var(--space-6) var(--space-6); }
    .qa { width: 320px; flex-shrink: 0; overflow-y: auto; }
    .tree { margin-top: var(--space-2); }
    .tree__row { display: flex; align-items: center; gap: var(--space-2); height: 36px; padding-right: var(--space-3); cursor: pointer;
      border-radius: var(--radius-sm); font-size: var(--font-size-base); }
    .tree__row:hover { background: var(--color-hover-bg); }
    .tree__row--on { background: var(--color-selected-row); }
    .tree__chev { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-text-secondary); }
    .tree__chev--btn { border: none; background: transparent; cursor: pointer; border-radius: var(--radius-sm); padding: 0; }
    .tree__chev--btn:hover { background: var(--color-stone-300); }
    .tree__lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm);
      background: var(--color-primary-600); color: var(--color-text-inverse); font-size: var(--font-size-3xs); font-weight: var(--font-weight-semi); }
    .tbl { flex: 1; min-width: 0; overflow-y: auto; }
    .grid { display: grid; grid-template-columns: 40px 64px minmax(200px, 1fr) 120px 200px; align-items: center; column-gap: var(--space-2);
      padding: 0 var(--space-3); min-height: 40px; }
    .grid--head { min-height: 48px; background: var(--color-stone-200); border-radius: var(--radius-sm); font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .h { display: inline-flex; align-items: center; }
    .grid--row { font-size: var(--font-size-base); border-radius: var(--radius-sm); min-height: 48px; }
    .grid--row:hover { background: var(--color-hover-bg); }
    .grid--sel { background: var(--color-selected-row); }
    .idx { color: var(--color-text-secondary); }
    .name { display: inline-flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nm--link { border: none; background: transparent; padding: 0; cursor: pointer; font-family: inherit; font-size: inherit; color: inherit; }
    .nm--link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .pub { color: var(--color-text-secondary); display: inline-flex; }
    .st { position: relative; display: inline-flex; align-items: center; }
    .dash { color: var(--color-text-secondary); }
    .pill { display: inline-flex; align-items: center; gap: var(--space-1); border: none; background: transparent; cursor: pointer;
      padding: 0 var(--space-1) 0 0; border-radius: var(--radius-full); color: var(--color-text-secondary); }
    .pill:hover:not(.pill--static) { background: var(--color-stone-300); }
    .pill--static { cursor: default; padding: 0; }
    .spin { display: inline-flex; color: var(--color-info-primary); animation: br-spin 1s linear infinite; }
    @keyframes br-spin { to { transform: rotate(360deg); } }
    .menu { position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 30; }
    .none { color: var(--color-text-secondary); text-align: center; padding: var(--space-8); }
    .mfoot { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-6); }
    .mfoot__l { flex: 1; display: inline-flex; gap: var(--space-4); }
    .mfoot__in { flex: 1; }
    .link { border: none; background: transparent; padding: 0; cursor: pointer; font-family: inherit; font-size: var(--font-size-base); color: var(--color-primary-600); }
    .link:hover:not(:disabled) { text-decoration: underline; }
    .link:disabled { color: var(--color-text-disabled); cursor: default; }
  `],
})
export class BrDocumentsPageComponent implements OnInit {
  store = inject(BrStore);
  private toast = inject(ToastService);

  @Output() crumbsChange = new EventEmitter<BreadcrumbItem[]>();
  @Output() startRequest = new EventEmitter<StartRequest>();
  @Output() viewRequest = new EventEmitter<ViewRequest>();
  @ViewChild('rulesCmp') rulesCmp?: BrRulesComponent;

  folder: string | null = null;
  open = new Set<string>();
  selected = new Set<string>();
  query = '';
  moreOpen = false;
  menuFor: string | null = null;
  redactOpen = false;
  rules: RuleSet = emptyRules();
  templateId: string | null = null;
  progressOpen = false;

  readonly shortcuts: QuickAccessItem[] = [
    { id: 'recent', label: 'Recently viewed', icon: 'history' },
    { id: 'uploaded', label: 'Newly uploaded', icon: 'upload' },
    { id: 'unpublished', label: 'Unpublished', icon: 'cross-circle' },
    { id: 'favorites', label: 'Favorites', icon: 'star' },
  ];
  readonly icon = fileIconOf;
  readonly trackRow = (_: number, r: TreeRow) => r.node.id;
  readonly trackNode = (_: number, n: DocNode) => n.id;

  ngOnInit(): void {
    this.crumbs();
    // returning to the page with a batch already running/finished → show the panel again
    if (this.store.batch) this.progressOpen = true;
  }
  @HostListener('document:click') closeMenus(): void { this.moreOpen = false; this.menuFor = null; }

  // ── Navigation ───────────────────────────────────────────────────────────
  private crumbs(): void {
    const c: BreadcrumbItem[] = [{ id: 'documents', label: 'Documents' }, { id: 'all', label: 'All' }];
    if (this.folder) c.push({ id: this.folder, label: pathOf(this.folder).replace(/ \/ /g, ' › ') });
    this.crumbsChange.emit(c);
  }
  go(id: string | null): void { this.folder = id; this.selected = new Set(); this.crumbs(); }
  toggleOpen(id: string): void { this.open.has(id) ? this.open.delete(id) : this.open.add(id); }

  get treeRows(): TreeRow[] {
    const walk = (parent: string | null, level: number): TreeRow[] => childrenOf(parent).filter(n => n.kind === 'folder').flatMap(n => {
      const kids = childrenOf(n.id).filter(k => k.kind === 'folder');
      return [{ node: n, level, hasKids: kids.length > 0 }, ...(this.open.has(n.id) ? walk(n.id, level + 1) : [])];
    });
    return walk(null, 0);
  }
  get rows(): DocNode[] {
    const q = this.query.trim().toLowerCase();
    return childrenOf(this.folder).filter(n => !q || n.name.toLowerCase().includes(q));
  }

  // ── Selection ────────────────────────────────────────────────────────────
  get allChecked(): boolean { return this.rows.length > 0 && this.rows.every(n => this.selected.has(n.id)); }
  checkAll(on: boolean): void { this.selected = new Set(on ? this.rows.map(n => n.id) : []); }
  toggle(id: string, on: boolean): void { on ? this.selected.add(id) : this.selected.delete(id); }
  private selFiles(): string[] { return this.store.files([...this.selected]); }

  // ── Redaction column ─────────────────────────────────────────────────────
  tracked(n: DocNode): boolean {
    return n.kind === 'file' ? this.store.inRedaction(n.id) : filesUnder(n.id).some(f => this.store.inRedaction(f.id));
  }
  statusOf(n: DocNode): DocStatus { return n.kind === 'file' ? this.store.status(n.id) : this.store.aggregate(n.id).status; }
  /** The status chip gets its dropdown when the row (or any file under a folder) can be changed by hand. */
  canMenu(n: DocNode): boolean {
    return n.kind === 'file' ? this.store.canSetStatus(n.id) : filesUnder(n.id).some(f => this.store.canSetStatus(f.id));
  }
  rowStatus(n: DocNode, s: BrStatusPick): void {
    const ids = n.kind === 'file' ? [n.id] : filesUnder(n.id).map(f => f.id);
    const c = this.store.setStatus(ids, s);
    this.toast.show({ variant: 'success', duration: 3000,
      message: c > 1 ? `${c} files changed to ${STATUS_LABEL[s].toLowerCase()}` : `Status changed to ${STATUS_LABEL[s].toLowerCase()}` });
  }

  // ── ⋯ menu ───────────────────────────────────────────────────────────────
  private menus = new Memo<DroplistItem[]>();
  /**
   * ⋯ menu — Figma "Context menu" (20668:121257) and the version with marks (20907:119631).
   * What the Redaction entry offers depends on the redaction status of everything selected
   * (folders count as the files inside them):
   *  • nothing redacted yet            → a plain "Redact" (disabled until something is selected)
   *  • anything redacted / drafting    → "Redaction ▸" with Apply, Unredact, status changes and Review marks
   *  • selection also has files that are untracked or came out with no marks → "Redact" is added at the top of that submenu
   */
  get moreItems(): DroplistItem[] {
    const files = this.selFiles();
    const tracked = files.filter(f => this.store.inRedaction(f));
    const drafting = tracked.some(f => this.store.status(f) === 'detecting');
    const reviewable = tracked.filter(f => this.store.canSetStatus(f));          // Draft / Ready for review / Reviewed with marks
    const applied = tracked.filter(f => this.store.status(f) === 'applied');
    const withMarks = tracked.filter(f => this.store.hasMarks(f) && this.store.status(f) !== 'detecting');
    const needsRedact = files.length > files.filter(f => this.store.hasMarks(f)).length;
    const state = `${this.selected.size > 0}|${tracked.length > 0}|${drafting}|${reviewable.length}|${reviewable.filter(f => this.store.status(f) !== 'ready').length}|${reviewable.filter(f => this.store.status(f) !== 'reviewed').length}|${applied.length}|${withMarks.length}|${needsRedact}`;
    return this.menus.get(`more|${state}`, () => {
      // Nothing selected: only the two page-level actions
      if (this.selected.size === 0) {
        return [
          { id: 'open-tab', label: 'Open in new browser tab', icon: 'link', dividerAfter: true },
          { id: 'copy-link', label: 'Copy link', icon: 'copy-link' },
        ] as DroplistItem[];
      }
      // Something selected: a plain "Redact" until something has been redacted, then Redaction ▸
      // Only actions that can actually be done are shown — nothing is disabled
      const sub: DroplistItem[] = tracked.length === 0
        ? [{ id: 'redact', label: 'Redact' }]
        : [
            ...(needsRedact && !drafting ? [{ id: 'redact', label: 'Redact' }] : []),
            ...(!drafting && reviewable.length ? [{ id: 'apply', label: 'Apply' }] : []),
            ...(applied.length ? [{ id: 'unredact', label: 'Unredact', dividerAfter: true }] : []),
            ...(!drafting && reviewable.some(f => this.store.status(f) !== 'ready') ? [{ id: 'ready', label: 'Mark as ready for review' }] : []),
            ...(withMarks.length && !this.store.batch?.ids.some(f => this.store.status(f) === 'detecting') ? [{ id: 'review', label: 'Review marks' }] : []),
            ...(!drafting && reviewable.some(f => this.store.status(f) !== 'reviewed') ? [{ id: 'reviewed', label: 'Mark as reviewed' }] : []),
          ];
      // a trailing divider means nothing follows it, so drop it
      if (sub.length && sub[sub.length - 1].dividerAfter) sub[sub.length - 1] = { ...sub[sub.length - 1], dividerAfter: false };
      const redaction: DroplistItem | null = !sub.length ? null
        : tracked.length === 0 ? { id: 'redact', label: 'Redact', icon: 'redact' }
        : { id: 'redaction', label: 'Redaction', icon: 'redact', children: sub };
      return [
        { id: 'print', label: 'Print', icon: 'print', dividerAfter: !redaction },
        ...(redaction ? [{ ...redaction, dividerAfter: true }] : []),
        { id: 'notify', label: 'Send notifications', icon: 'mail-outline', dividerAfter: true },
        { id: 'labels', label: 'Add labels', icon: 'tag' },
        { id: 'copy', label: 'Copy to...', icon: 'copy-outline', children: [
          { id: 'copy-folder', label: 'Another folder' }, { id: 'copy-project', label: 'Another project' } ] },
        { id: 'move', label: 'Move', icon: 'move-arrows' },
        { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
      ] as DroplistItem[];
    });
  }
  onMore(item: DroplistItem): void {
    this.moreOpen = false;
    if (item.disabled) return;
    const files = this.selFiles();
    const withMarks = files.filter(f => this.store.hasMarks(f) && this.store.status(f) !== 'detecting');
    switch (item.id) {
      case 'copy-link': this.toast.show({ variant: 'success', message: 'Link copied', duration: 3000 }); break;
      case 'redact': this.openRedact(); break;
      case 'ready':
      case 'reviewed': {
        const n = this.store.setStatus(files, item.id);
        this.toast.show({ variant: n ? 'success' : 'info', duration: 3000,
          message: n ? `${n} file${n === 1 ? '' : 's'} marked as ${STATUS_LABEL[item.id].toLowerCase()}` : 'Nothing to update' });
        this.selected = new Set();
        break;
      }
      case 'review': this.openViewer(withMarks, 0, true); this.selected = new Set(); break;
      case 'apply': {
        const n = this.store.apply(files.filter(f => this.store.canSetStatus(f)));
        this.toast.show({ variant: 'success', message: `Redaction applied in ${n} file${n === 1 ? '' : 's'}`, duration: 3000 });
        this.selected = new Set();
        break;
      }
      case 'unredact': {
        const n = this.store.unredact(files);
        this.toast.show({ variant: 'success', message: `Redaction removed from ${n} file${n === 1 ? '' : 's'}`, duration: 3000 });
        this.selected = new Set();
        break;
      }
      default: break;
    }
  }

  // ── Redact modal ─────────────────────────────────────────────────────────
  get hasRules(): boolean { return this.rules.categories.length > 0 || this.rules.keywords.length > 0; }
  openRedact(): void {
    if (!this.selected.size) return;
    this.rules = emptyRules();
    this.templateId = null;
    this.redactOpen = true;
  }
  createDrafts(): void {
    this.startRequest.emit({
      nodes: [...this.selected], rules: this.rules, toast: false,
      closeUi: () => (this.redactOpen = false),
      reopen: () => (this.redactOpen = true),
      // the action is done: selection goes back to the default
      done: () => { this.redactOpen = false; this.selected = new Set(); this.progressOpen = true; },
    });
  }

  get batch() { return this.store.batch; }

  openViewer(ids: string[], index: number, _fromList: boolean): void {
    if (!ids.length) return;
    this.viewRequest.emit({ ids, index });
  }
}
