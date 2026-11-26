import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { CheckboxComponent } from '../../checkbox/checkbox.component';
import { SearchComponent } from '../../search/search.component';
import { ButtonComponent } from '../../button/button.component';
import { ModalComponent } from '../../modal/modal.component';
import { AiScopeNode } from '../ai.models';

export type AiScopePickerMode = 'popover' | 'dialog';

/** What Apply hands back: the compact selection (a fully selected folder → its id) plus counts. */
export interface AiScopeSelection {
  /** Empty = the whole project. */
  ids: string[];
  folders: number;
  files: number;
  /** Number of documents (leaves) the assistant will use. */
  documents: number;
}

/**
 * Chat scope picker — Figma AI-Assistant "Chat · 1.1 · Scope": Picker popover (2739:60220)
 * and Picker dialog (2739:61018).
 *
 * The user narrows what the assistant may use in this chat to folders and files.
 * A folder checkbox selects everything inside it; a partly selected folder shows
 * the mixed state. Nothing selected (or Clear / Reset) = the whole project.
 *
 * popover — compact card that opens above the composer; the parent positions it.
 * dialog  — the full picker in a modal: tree on the left, the Selected list on the right.
 */
@Component({
  selector: 'fvdr-ai-scope-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent, FileIconComponent, CheckboxComponent, SearchComponent, ButtonComponent, ModalComponent],
  template: `
    <!-- Shared tree rows -->
    <ng-template #rows let-list let-depth="depth">
      <ng-container *ngFor="let n of list">
        <ng-container *ngIf="visible(n)">
          <div class="sp-row" [class.sp-row--on]="state(n) !== 'off'" [style.padding-left.px]="16 + depth * 24">
            <button *ngIf="n.children?.length; else spacer" type="button" class="sp-caret"
                    [attr.aria-label]="isOpen(n) ? 'Collapse ' + n.name : 'Expand ' + n.name"
                    (click)="toggleOpen(n)">
              <fvdr-icon [name]="isOpen(n) ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
            </button>
            <ng-template #spacer><span class="sp-caret sp-caret--blank"></span></ng-template>
            <fvdr-checkbox [checked]="state(n) === 'on'" [indeterminate]="state(n) === 'mixed'"
                           (checkedChange)="toggle(n)"></fvdr-checkbox>
            <fvdr-file-icon class="sp-row__icon" [type]="n.type"></fvdr-file-icon>
            <span class="sp-row__name" [attr.title]="n.name">{{ n.name }}</span>
            <span class="sp-row__count" *ngIf="n.children?.length">{{ leafCount(n) }}</span>
          </div>
          <ng-container *ngIf="n.children?.length && isOpen(n)">
            <ng-container *ngTemplateOutlet="rows; context: { $implicit: n.children, depth: depth + 1 }"></ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
    </ng-template>

    <!-- ── Popover ── -->
    <div *ngIf="mode === 'popover' && open" class="sp-pop" role="dialog" aria-label="Use in this chat">
      <header class="sp-pop__head">
        <span class="sp-pop__title">{{ title }}</span>
        <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="closed.emit()"></fvdr-btn>
      </header>
      <div class="sp-pop__search"><fvdr-search size="m" placeholder="Search files and folders" [(ngModel)]="query"></fvdr-search></div>

      <div class="sp-pop__all sp-row" [class.sp-row--on]="allState !== 'off'">
        <fvdr-checkbox [checked]="allState === 'on'" [indeterminate]="allState === 'mixed'" (checkedChange)="toggleAll()"></fvdr-checkbox>
        <fvdr-file-icon class="sp-row__icon" type="folder"></fvdr-file-icon>
        <span class="sp-row__name sp-row__name--strong">All files and folders</span>
        <span class="sp-row__count">{{ totalLeaves }}</span>
      </div>
      <div class="sp-caption">Project structure</div>
      <div class="sp-tree"><ng-container *ngTemplateOutlet="rows; context: { $implicit: nodes, depth: 0 }"></ng-container></div>

      <footer class="sp-pop__foot">
        <div class="sp-summary">
          <span class="sp-summary__main">{{ summaryLine }}</span>
          <span class="sp-summary__sub">{{ documentsLine }}</span>
        </div>
        <fvdr-btn label="Clear" variant="ghost" size="m" (clicked)="clear()"></fvdr-btn>
        <fvdr-btn label="Apply" variant="primary" size="m" (clicked)="apply()"></fvdr-btn>
      </footer>
    </div>

    <!-- ── Dialog ── -->
    <fvdr-modal *ngIf="mode === 'dialog'" [visible]="open" size="xxl" [flush]="true"
                title="Select files and folders"
                subtitle="Choose what the assistant can use to answer in this chat. Folders include everything inside them."
                cancelLabel="Cancel" cancelVariant="secondary" confirmLabel="Apply"
                (confirmed)="apply()" (cancelled)="cancel()" (closed)="closed.emit()">
      <div class="sp-dlg">
        <div class="sp-dlg__tree">
          <div class="sp-dlg__search"><fvdr-search size="m" placeholder="Search files and folders" [(ngModel)]="query"></fvdr-search></div>
          <div class="sp-dlg__project"><span class="sp-dlg__project-name">{{ projectName }}</span> {{ totalLeaves }} files</div>
          <div class="sp-tree"><ng-container *ngTemplateOutlet="rows; context: { $implicit: nodes, depth: 0 }"></ng-container></div>
        </div>
        <aside class="sp-dlg__side">
          <div class="sp-dlg__side-head">
            <span class="sp-dlg__side-title">Selected ({{ compact.length }})</span>
            <button type="button" class="sp-link" *ngIf="compact.length" (click)="clear()">Clear all</button>
          </div>
          <ul class="sp-sel">
            <li class="sp-sel__item" *ngFor="let n of compact">
              <fvdr-file-icon [type]="n.type"></fvdr-file-icon>
              <span class="sp-sel__text">
                <span class="sp-sel__name">{{ n.name }}</span>
                <span class="sp-sel__sub">{{ n.children?.length ? leafCount(n) + ' files' : (n.path || '') }}</span>
              </span>
              <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" [ariaLabel]="'Remove ' + n.name" (clicked)="toggle(n)"></fvdr-btn>
            </li>
            <li class="sp-sel__empty" *ngIf="!compact.length">Nothing selected — the assistant uses all files.</li>
          </ul>
          <p class="sp-note">{{ documentsCount }} {{ documentsCount === 1 ? 'document' : 'documents' }} will be used to answer. Files you don’t have access to are not included.</p>
        </aside>
      </div>
      <button modal-footer-start type="button" class="sp-link sp-link--quiet" (click)="clear()">Reset to all files</button>
    </fvdr-modal>
  `,
  styles: [`
    :host { display: contents; font-family: var(--font-family); }

    /* ── Tree rows (both modes) ── */
    .sp-tree { overflow-y: auto; }
    .sp-row {
      display: flex; align-items: center; gap: var(--space-2);
      height: 35px; padding-right: var(--space-4);
      font-size: var(--text-body2-size); line-height: var(--text-body2-lh);
      color: var(--color-text-primary);
    }
    .sp-row--on { background: var(--color-primary-50); }
    .sp-caret {
      flex: none; display: inline-flex; align-items: center; justify-content: center;
      width: var(--space-4); height: var(--space-4);
      border: none; background: transparent; padding: 0; cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--text-caption1-size);
    }
    .sp-caret--blank { cursor: default; }
    .sp-row__icon { flex: none; }
    .sp-row__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sp-row__name--strong { font-weight: var(--text-label-m-weight); }
    .sp-row__count { flex: none; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-placeholder); }

    /* ── Popover — Figma 2739:60220 ── */
    .sp-pop {
      display: flex; flex-direction: column;
      width: 440px; max-height: 520px;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      overflow: hidden;
    }
    .sp-pop__head { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-2) var(--space-2) var(--space-4); }
    .sp-pop__title { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); color: var(--color-text-primary); }
    .sp-pop__search { padding: 0 var(--space-4) var(--space-3); }
    .sp-pop__all { padding-left: var(--space-4); background: var(--color-stone-200); }
    .sp-pop__all.sp-row--on { background: var(--color-stone-200); }
    .sp-caption {
      padding: var(--space-2) var(--space-4) var(--space-1);
      font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh);
      text-transform: uppercase; color: var(--color-text-secondary);
    }
    .sp-pop .sp-tree { flex: 1; min-height: 0; }
    .sp-pop__foot {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-divider);
    }
    .sp-summary { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .sp-summary__main { font-size: var(--text-label-s-size); line-height: var(--text-label-s-lh); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .sp-summary__sub { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }

    /* ── Dialog — Figma 2739:61018 ── */
    .sp-dlg { display: flex; height: 426px; }
    .sp-dlg__tree { flex: 1; min-width: 0; display: flex; flex-direction: column; padding-top: var(--space-4); }
    .sp-dlg__search { padding: 0 var(--space-6) var(--space-3); }
    .sp-dlg__project { padding: 0 var(--space-6) var(--space-2); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-placeholder); }
    .sp-dlg__project-name { color: var(--color-text-secondary); margin-right: var(--space-1); }
    .sp-dlg__tree .sp-tree { flex: 1; min-height: 0; }
    .sp-dlg__side {
      flex: none; width: 330px; box-sizing: border-box;
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      background: var(--color-stone-100);
      border-left: 1px solid var(--color-divider);
    }
    .sp-dlg__side-head { display: flex; align-items: center; justify-content: space-between; }
    .sp-dlg__side-title { font-size: var(--text-label-m-size); line-height: var(--text-label-m-lh); font-weight: var(--text-label-m-weight); color: var(--color-text-primary); }
    .sp-sel { list-style: none; margin: 0; padding: 0; flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-2); }
    .sp-sel__item {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
    }
    .sp-sel__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .sp-sel__name { font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sp-sel__sub { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .sp-sel__empty { font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-secondary); }
    .sp-note {
      margin: 0; padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--color-primary-50);
      font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh);
      color: var(--color-text-secondary);
    }

    .sp-link {
      border: none; background: transparent; padding: 0; cursor: pointer;
      font-family: var(--font-family); font-size: var(--text-body3-size); line-height: var(--text-body3-lh);
      color: var(--color-primary-500);
    }
    .sp-link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .sp-link--quiet { font-size: var(--text-body2-size); color: var(--color-text-secondary); }
    .sp-link--quiet:hover { color: var(--color-text-primary); }
  `],
})
export class AiScopePickerComponent implements OnChanges {
  @Input() mode: AiScopePickerMode = 'popover';
  @Input() open = true;
  @Input() nodes: AiScopeNode[] = [];
  /** Applied selection (folder and file ids). Empty = whole project. */
  @Input() selected: string[] = [];
  @Input() title = 'Use in this chat';
  @Input() projectName = 'Project';

  @Output() applied = new EventEmitter<AiScopeSelection>();
  @Output() closed = new EventEmitter<void>();

  query = '';
  private picked = new Set<string>();          // selected leaf ids
  private expanded = new Set<string>();
  private byId = new Map<string, AiScopeNode>();
  /** Bumped on every selection change; keeps compact() a stable array for *ngFor between changes. */
  private version = 0;
  private compactCache: { v: number; list: AiScopeNode[] } = { v: -1, list: [] };

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['nodes']) {
      this.byId.clear();
      this.walk(this.nodes, n => this.byId.set(n.id, n));
      if (!this.expanded.size) this.nodes.slice(0, 1).forEach(n => this.expanded.add(n.id));
    }
    if (ch['nodes'] || ch['selected'] || (ch['open'] && this.open)) this.reset();
  }

  // ── selection state ──
  state(n: AiScopeNode): 'on' | 'off' | 'mixed' {
    const leaves = this.leaves(n);
    const on = leaves.filter(l => this.picked.has(l.id)).length;
    return on === 0 ? 'off' : on === leaves.length ? 'on' : 'mixed';
  }
  get allState(): 'on' | 'off' | 'mixed' {
    const all = this.totalLeaves, on = this.picked.size;
    return on === 0 ? 'off' : on === all ? 'on' : 'mixed';
  }
  toggle(n: AiScopeNode): void {
    const turnOn = this.state(n) !== 'on';
    this.leaves(n).forEach(l => turnOn ? this.picked.add(l.id) : this.picked.delete(l.id));
    this.version++;
  }
  toggleAll(): void {
    if (this.allState === 'on') this.picked.clear();
    else this.walk(this.nodes, n => { if (!n.children?.length) this.picked.add(n.id); });
    this.version++;
  }
  clear(): void { this.picked.clear(); this.version++; }

  /** Fully selected folders collapse to the folder; the rest are single files. */
  get compact(): AiScopeNode[] {
    if (this.compactCache.v === this.version) return this.compactCache.list;
    this.compactCache = { v: this.version, list: this.computeCompact() };
    return this.compactCache.list;
  }
  private computeCompact(): AiScopeNode[] {
    if (this.allState === 'on') return [];
    const out: AiScopeNode[] = [];
    const visit = (list: AiScopeNode[]) => list.forEach(n => {
      const s = this.state(n);
      if (s === 'on') out.push(n);
      else if (s === 'mixed' && n.children?.length) visit(n.children);
    });
    visit(this.nodes);
    return out;
  }
  get documentsCount(): number { return this.picked.size || this.totalLeaves; }
  get summaryLine(): string {
    const c = this.compact;
    if (!c.length) return 'All files and folders';
    const folders = c.filter(n => n.children?.length).length, files = c.length - folders;
    const part = (k: number, w: string) => k ? `${k} ${w}${k === 1 ? '' : 's'}` : '';
    return [part(folders, 'folder'), part(files, 'file')].filter(Boolean).join(', ') + ' selected';
  }
  get documentsLine(): string {
    const d = this.documentsCount;
    return `${d} ${d === 1 ? 'document' : 'documents'} will be used`;
  }

  apply(): void {
    const c = this.compact;
    const folders = c.filter(n => n.children?.length).length;
    this.applied.emit({ ids: c.map(n => n.id), folders, files: c.length - folders, documents: this.documentsCount });
    if (this.mode === 'popover') this.closed.emit();
  }
  cancel(): void { this.reset(); }

  // ── tree helpers ──
  isOpen(n: AiScopeNode): boolean { return !!this.query || this.expanded.has(n.id); }
  toggleOpen(n: AiScopeNode): void { this.expanded.has(n.id) ? this.expanded.delete(n.id) : this.expanded.add(n.id); }
  visible(n: AiScopeNode): boolean {
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    const hit = (x: AiScopeNode): boolean => x.name.toLowerCase().includes(q) || !!x.children?.some(hit);
    return hit(n);
  }
  leafCount(n: AiScopeNode): number { return this.leaves(n).length; }
  get totalLeaves(): number { return this.nodes.reduce((a, n) => a + this.leaves(n).length, 0); }

  private leaves(n: AiScopeNode): AiScopeNode[] {
    return n.children?.length ? n.children.flatMap(c => this.leaves(c)) : [n];
  }
  private walk(list: AiScopeNode[], fn: (n: AiScopeNode) => void): void {
    list.forEach(n => { fn(n); if (n.children) this.walk(n.children, fn); });
  }
  private reset(): void {
    this.version++;
    this.picked.clear();
    this.query = '';
    for (const id of this.selected) {
      const n = this.byId.get(id);
      if (n) this.leaves(n).forEach(l => this.picked.add(l.id));
    }
  }
}
