import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, QuickAccessItem } from '../../shared/ds';
import { FvdrIconName } from '../../shared/ds/icons/icons';
import { TrackerService } from '../../services/tracker.service';

interface TreeNode {
  id: string;
  index: string;
  label: string;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  isActive: boolean;
  parentId?: string;
}

interface TableRow {
  index: number;
  name: string;
  notes: number;
  size: string;
  files: string;
  published: boolean;
  redaction: 'applied' | 'applied-drafted' | 'drafted' | 'none';
}

type ResizableColId = 'idx' | 'name' | 'notes' | 'size' | 'pub' | 'red';

@Component({
  selector: 'fvdr-quick-access-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Sidebar ── -->
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Conference Room"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavClick($event)"
      />

      <!-- ── Main area ── -->
      <div class="main-area">

        <!-- ── Header 64px ── -->
        <fvdr-header
          [breadcrumbs]="breadcrumbItems"
          [actions]="headerActions"
          userName="LZ"
          (actionClick)="onHeaderAction($event)"
        />

        <!-- ── Content ── -->
        <div class="content-wrap">

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn label="Add" variant="primary"   size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn label="Download"      variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m" iconName="action-list"></fvdr-btn>
              <fvdr-btn variant="secondary" size="m" [iconOnly]="true" iconName="more" ariaLabel="More actions"></fvdr-btn>
            </div>
            <div class="toolbar-right">
              <fvdr-btn label="View as" variant="secondary" size="m" iconName="view-as"></fvdr-btn>
              <fvdr-search placeholder="Search" [filter]="true"></fvdr-search>
            </div>
          </div>

          <!-- Content row: QA Panel + Table -->
          <div class="content-row">

            <!-- ── Quick Access Panel ── -->
            <div class="qa-panel">

              <!-- Collapsed-all rail: mirrors the real product's "Collapse all" state -->
              <div class="qa-rail" *ngIf="panelCollapsed">
                <button class="icon-btn" *ngFor="let s of shortcuts" [title]="s.label" (click)="onShortcutClick(s)">
                  <fvdr-icon [name]="s.icon"></fvdr-icon>
                </button>
                <div class="qa-rail-divider"></div>
                <span class="qa-project-badge" title="Conference Room">RN</span>
                <button class="icon-btn" title="Expand" (click)="panelCollapsed = false">
                  <fvdr-icon name="chevron-right"></fvdr-icon>
                </button>
              </div>

              <ng-container *ngIf="!panelCollapsed">
                <fvdr-quick-access-menu
                  [items]="shortcuts"
                  [(collapsed)]="shortcutsCollapsed"
                  [showCollapseAll]="true"
                  (itemClick)="onShortcutClick($event)"
                  (collapseAllClick)="panelCollapsed = true"
                ></fvdr-quick-access-menu>

                <!-- Folder tree -->
                <div class="qa-tree">
                  <ng-container *ngFor="let node of visibleNodes">
                    <div class="qa-tree-row"
                         [class.qa-tree-row--active]="node.isActive"
                         [style.padding-left.px]="16 + node.level * 16"
                         (click)="toggleNode(node)">

                      <!-- Chevron zone (16px) -->
                      <span class="qa-chevron">
                        <fvdr-icon *ngIf="node.hasChildren"
                                   [name]="node.expanded ? 'chevron-down' : 'chevron-right'">
                        </fvdr-icon>
                      </span>

                      <!-- Level 0: project badge; others: folder icon -->
                      <span *ngIf="node.level === 0" class="qa-project-badge">RN</span>
                      <fvdr-file-icon *ngIf="node.level > 0"
                                      class="qa-folder"
                                      [type]="node.hasChildren && node.expanded ? 'folder-open' : 'folder-colored'">
                      </fvdr-file-icon>

                      <!-- Index -->
                      <span *ngIf="node.index" class="qa-idx">{{ node.index }}</span>

                      <!-- Label -->
                      <span class="qa-lbl">{{ node.label }}</span>
                    </div>
                  </ng-container>
                </div>
              </ng-container>
            </div>

            <!-- ── Table ── -->
            <div class="tbl-wrap" [class.is-col-resizing]="!!resizingCol">

              <!-- Header row -->
              <div class="tbl-row tbl-row--header" [style.grid-template-columns]="gridTemplateColumns">
                <div class="col-idx" (mouseenter)="onColHeaderEnter($event, 'idx')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="idx">Index</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'idx'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Index"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'idx')"
                        (keydown)="onColResizeKeydown($event, 'idx')"
                        (dblclick)="autoFitColumn('idx')"></span>
                </div>
                <div class="col-name" (mouseenter)="onColHeaderEnter($event, 'name')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="name">Name</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'name'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Name"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'name')"
                        (keydown)="onColResizeKeydown($event, 'name')"
                        (dblclick)="autoFitColumn('name')"></span>
                </div>
                <div class="col-notes" (mouseenter)="onColHeaderEnter($event, 'notes')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="notes">Notes</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'notes'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Notes"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'notes')"
                        (keydown)="onColResizeKeydown($event, 'notes')"
                        (dblclick)="autoFitColumn('notes')"></span>
                </div>
                <div class="col-size" (mouseenter)="onColHeaderEnter($event, 'size')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="size">Size</span>
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'size'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Size"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'size')"
                        (keydown)="onColResizeKeydown($event, 'size')"
                        (dblclick)="autoFitColumn('size')"></span>
                </div>
                <div class="col-pub" (mouseenter)="onColHeaderEnter($event, 'pub')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="pub">Publishing</span>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'pub'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Publishing"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'pub')"
                        (keydown)="onColResizeKeydown($event, 'pub')"
                        (dblclick)="autoFitColumn('pub')"></span>
                </div>
                <div class="col-red" (mouseenter)="onColHeaderEnter($event, 'red')" (mouseleave)="onColHeaderLeave()">
                  <span class="th-label" data-col-measure="red">Redaction</span>
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                  <span class="col-resize-handle"
                        [class.col-resize-handle--active]="resizingCol === 'red'"
                        role="separator" aria-orientation="vertical" aria-label="Resize column Redaction"
                        tabindex="0"
                        (mousedown)="startColResize($event, 'red')"
                        (keydown)="onColResizeKeydown($event, 'red')"
                        (dblclick)="autoFitColumn('red')"></span>
                </div>
                <div class="col-act">
                  <button class="icon-btn"><fvdr-icon name="filter"></fvdr-icon></button>
                </div>
              </div>

              <!-- Data rows -->
              <div *ngFor="let row of tableRows" class="tbl-row" [style.grid-template-columns]="gridTemplateColumns">
                <!-- Index: doc icon + number -->
                <div class="col-idx">
                  <fvdr-file-icon type="pdf" class="doc-icon"></fvdr-file-icon>
                  <span class="td-idx" data-col-measure="idx">{{ row.index }}</span>
                </div>

                <!-- Name -->
                <div class="col-name">
                  <span class="td-name" data-col-measure="name">{{ row.name }}</span>
                </div>

                <!-- Notes counter -->
                <div class="col-notes">
                  <span class="notes-badge" data-col-measure="notes">{{ row.notes }}</span>
                </div>

                <!-- Size (two-line) -->
                <div class="col-size">
                  <span class="td-size-main" data-col-measure="size">{{ row.size }}</span>
                  <span class="td-size-sub" data-col-measure="size">{{ row.files }}</span>
                </div>

                <!-- Publishing icon -->
                <div class="col-pub">
                  <fvdr-icon
                    [name]="row.published ? 'finished' : 'cross-circle'"
                    [class.pub-yes]="row.published"
                    [class.pub-no]="!row.published">
                  </fvdr-icon>
                </div>

                <!-- Redaction chip -->
                <div class="col-red">
                  <span class="red-chip" data-col-measure="red" [ngClass]="'red-chip--' + row.redaction">
                    {{ redactionLabel(row.redaction) }}
                  </span>
                </div>

                <!-- Actions (empty cell) -->
                <div class="col-act"></div>
              </div>

              <!-- Column hover indicator: one solid line per column edge, like the qa-panel resize handle -->
              <ng-container *ngIf="hoveredColRect">
                <div class="col-hover-line" [style.left.px]="hoveredColRect.left" [style.height.px]="hoveredColRect.height"></div>
                <div class="col-hover-line" [style.left.px]="hoveredColRect.left + hoveredColRect.width" [style.height.px]="hoveredColRect.height"></div>
              </ng-container>

            </div><!-- /tbl-wrap -->

          </div><!-- /content-row -->
        </div><!-- /content-wrap -->
      </div><!-- /main-area -->
    </div><!-- /page-layout -->
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      height: 100vh;
      overflow: hidden;
      --color-dodger-blue-50: var(--color-feature-bg);
    }

    /* ──────────────────────────────────────────
       Shell
    ────────────────────────────────────────── */
    .page-layout {
      display: flex;
      height: 100%;
      background: var(--color-stone-100);
    }

    /* ──────────────────────────────────────────
       Main area
    ────────────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    /* ──────────────────────────────────────────
       Content wrap
    ────────────────────────────────────────── */
    .content-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-6);
      gap: var(--space-5);
      overflow: hidden;
      min-height: 0;
      background: var(--color-stone-0);
    }

    /* ──────────────────────────────────────────
       Toolbar
    ────────────────────────────────────────── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      height: 40px;
    }
    .toolbar-left  { display: flex; gap: var(--space-3); align-items: center; }
    .toolbar-right { display: flex; gap: var(--space-3); align-items: center; }

    /* ──────────────────────────────────────────
       Content row (QA + Table)
    ────────────────────────────────────────── */
    .content-row {
      flex: 1;
      display: flex;
      gap: var(--space-6);
      min-height: 0;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ──────────────────────────────────────────
       Quick Access Panel
    ────────────────────────────────────────── */
    .qa-panel {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      background: var(--color-stone-0);
      overflow: hidden;
    }

    fvdr-quick-access-menu { flex-shrink: 0; }

    /* Collapsed-all rail — mirrors the real product's "Collapse all" state */
    .qa-rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      width: 56px;
      padding: var(--space-4) 0;
      flex-shrink: 0;
    }
    .qa-rail-divider {
      width: 24px;
      height: 1px;
      background: var(--color-divider);
      margin: var(--space-2) 0;
    }

    /* Tree */
    .qa-tree {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      padding: var(--space-2) 0;
    }
    .qa-tree-row {
      display: flex;
      align-items: center;
      height: 40px;
      padding-right: var(--space-4);
      gap: var(--space-2);
      cursor: pointer;
      flex-shrink: 0;
    }
    .qa-tree-row:hover { background: var(--color-hover-bg); }
    .qa-tree-row--active {
      background: var(--color-primary-50);
      border-radius: var(--radius-sm);
    }

    .qa-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      flex-shrink: 0;
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
    }

    .qa-project-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--color-primary-500);
      border-radius: var(--radius-sm);
      color: white;
      font-size: var(--text-caption1-size);
      font-weight: 600;
      flex-shrink: 0;
    }

    .qa-folder {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .qa-idx {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      flex-shrink: 0;
      white-space: nowrap;
    }

    .qa-lbl {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    /* ──────────────────────────────────────────
       Table
    ────────────────────────────────────────── */
    .tbl-wrap {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--color-stone-0);
      overflow: auto;
      min-width: 0;
    }

    .tbl-row {
      display: grid;
      align-items: center;
      min-width: max-content;
    }
    .tbl-row:not(.tbl-row--header):hover { background: var(--color-hover-bg); }

    /* Hovering a column's header reveals one solid line per edge, spanning header + all rows
       — same visual language as the qa-panel resize handle, not a per-cell border. */
    .col-hover-line {
      position: absolute;
      top: 0;
      width: 1px;
      background: var(--color-divider);
      pointer-events: none;
      z-index: 2;
    }

    .tbl-row--header {
      background: var(--color-stone-200);
      min-height: 48px;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .tbl-row:not(.tbl-row--header) { min-height: 44px; }

    /* Header cells */
    .tbl-row--header > div {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-4);
    }
    .th-label {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .th-sort { font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); flex-shrink: 0; }

    /* Column resize handle */
    .col-resize-handle {
      position: absolute;
      top: 0; bottom: 0;
      right: -3px;
      width: 6px;
      cursor: col-resize;
      z-index: 2;
      outline: none;
    }
    .col-resize-handle::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      background: transparent;
      transition: background 0.12s ease, width 0.12s ease;
    }
    .col-resize-handle:hover::after,
    .col-resize-handle:focus-visible::after {
      background: var(--color-primary-500);
    }
    .col-resize-handle--active::after {
      width: 3px;
      background: var(--color-primary-500);
    }
    .col-resize-handle:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: -2px;
      border-radius: var(--radius-xs);
    }
    .tbl-wrap.is-col-resizing { cursor: col-resize; user-select: none; }

    @media (max-width: 767px) {
      .col-resize-handle { display: none; }
    }

    /* Data cells */
    .tbl-row:not(.tbl-row--header) > div {
      display: flex;
      align-items: center;
      padding: 0 var(--space-4);
    }

    /* Index col: doc icon + number */
    .col-idx { gap: var(--space-2); }
    .doc-icon { display: flex; align-items: center; flex-shrink: 0; }
    .td-idx {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
    }

    /* Name col */
    .col-name { overflow: hidden; }
    .td-name {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Notes counter badge */
    .col-notes {}
    .notes-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 var(--space-2);
      background: var(--color-stone-300);
      border-radius: 12px;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      font-weight: 400;
    }

    /* Size col (two-line) */
    .col-size { flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; }
    .tbl-row--header .col-size { flex-direction: row; align-items: center; gap: var(--space-2); }
    .td-size-main { font-size: var(--text-caption1-size); color: var(--color-text-primary); line-height: 16px; }
    .td-size-sub  { font-size: var(--text-caption1-size); color: var(--color-text-secondary); line-height: 16px; }

    /* Publishing icon */
    .col-pub { justify-content: flex-start; }
    .pub-yes { color: var(--color-primary-500); font-size: var(--font-size-lg, 16px); }
    .pub-no  { color: var(--color-stone-500);   font-size: var(--font-size-lg, 16px); }

    /* Redaction chips */
    .col-red {}
    .red-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 var(--space-3);
      border-radius: 24px;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .red-chip--applied         { background: var(--color-primary-50); }
    .red-chip--applied-drafted { background: var(--color-dodger-blue-50); }
    .red-chip--drafted         { background: var(--color-stone-300); }
    .red-chip--none            { background: var(--color-stone-300); }

    /* Actions col */
    .col-act { justify-content: flex-end; }

    /* ──────────────────────────────────────────
       Shared
    ────────────────────────────────────────── */
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-lg, 16px);
      padding: 0;
    }
    .icon-btn:hover {
      background: var(--color-hover-bg);
      color: var(--color-text-primary);
    }
  `],
})
export class QuickAccessPanelComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  breadcrumbItems = [
    { id: 'docs', label: 'Documents' },
    { id: 'all', label: 'All' },
  ];

  /** "Collapse all" state — mirrors the real product: shrinks shortcuts + tree to an icon-only rail. */
  panelCollapsed = false;
  /** "Collapse quick filters" state — owned by <fvdr-quick-access-menu>'s own [(collapsed)] binding. */
  shortcutsCollapsed = false;

  sidebarCollapsed = true;

  navItems: SidebarNavItem[] = [
    { id: 'overview',     icon: 'nav-overview',      iconActive: 'nav-overview-active',      label: 'Dashboard',    active: false },
    { id: 'projects',     icon: 'nav-projects',      iconActive: 'nav-projects-active',      label: 'Documents',    active: true  },
    { id: 'reports',      icon: 'nav-reports',       iconActive: 'nav-reports-active',       label: 'Reports',      active: false },
    { id: 'participants', icon: 'nav-participants',  iconActive: 'nav-participants-active',   label: 'Participants', active: false },
    { id: 'api',          icon: 'nav-api',           iconActive: 'nav-api-active',            label: 'Q&A',          active: false },
    { id: 'settings',     icon: 'nav-settings',       iconActive: 'nav-settings-active',      label: 'Settings',     active: false },
    { id: 'trash',        icon: 'trash',             iconActive: 'trash',                     label: 'Trash',        active: false },
  ];

  headerActions: HeaderAction[] = [
    { id: 'theme',    icon: 'theme-dark' },
    { id: 'help',     icon: 'help'       },
    { id: 'overview', icon: 'overview'   },
  ];

  onNavClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  onHeaderAction(_id: string): void {}

  // Matches the real product's Quick Access shortcuts exactly (content, order, icons).
  shortcuts: QuickAccessItem[] = [
    { id: 'recent',      label: 'Recently viewed', icon: 'history'      as FvdrIconName },
    { id: 'uploaded',    label: 'Newly uploaded',  icon: 'upload'       as FvdrIconName },
    { id: 'unpublished', label: 'Unpublished',     icon: 'cross-circle' as FvdrIconName },
    { id: 'favorites',   label: 'Favorites',       icon: 'star'         as FvdrIconName },
  ];

  onShortcutClick(_item: QuickAccessItem): void {}

  allNodes: TreeNode[] = [
    { id: 'rn',      index: '',      label: 'Conference Room',                                  level: 0, expanded: true,  hasChildren: true,  isActive: false },
    { id: '1',       index: '1',     label: 'Client Documents',                                 level: 1, expanded: false, hasChildren: false, isActive: false, parentId: 'rn' },
    { id: '2',       index: '2',     label: 'Archived Files',                                   level: 1, expanded: false, hasChildren: false, isActive: false, parentId: 'rn' },
    { id: '3',       index: '3',     label: 'Design Assets',                                    level: 1, expanded: false, hasChildren: false, isActive: false, parentId: 'rn' },
    { id: '4',       index: '4',     label: 'Research Data',                                    level: 1, expanded: true,  hasChildren: true,  isActive: true,  parentId: 'rn' },
    { id: '4.1',     index: '4.1',   label: 'Innovative Studies',                               level: 2, expanded: true,  hasChildren: true,  isActive: false, parentId: '4' },
    { id: '4.1.1',   index: '4.1.1', label: 'Exploration Initiatives',                          level: 3, expanded: true,  hasChildren: true,  isActive: false, parentId: '4.1' },
    { id: '4.1.1.1', index: '4.1.1.1', label: 'Academic Ventures',                             level: 4, expanded: false, hasChildren: false, isActive: false, parentId: '4.1.1' },
    { id: '4.1.2',   index: '4.1.2', label: 'Discovery Projects',                               level: 3, expanded: false, hasChildren: false, isActive: false, parentId: '4.1' },
    { id: '4.1.3',   index: '4.1.3', label: 'Research Endeavors',                               level: 3, expanded: false, hasChildren: false, isActive: false, parentId: '4.1' },
    { id: '4.2',     index: '4.2',   label: 'Innovative Studies',                               level: 2, expanded: false, hasChildren: false, isActive: false, parentId: '4' },
    { id: '4.3',     index: '4.3',   label: 'Exploratory Research',                             level: 2, expanded: false, hasChildren: false, isActive: false, parentId: '4' },
    { id: '5',       index: '5',     label: 'Comprehensive Project Documentation and Resource Files', level: 1, expanded: false, hasChildren: false, isActive: false, parentId: 'rn' },
    { id: 'qa',      index: '',      label: 'Q&A attachments',                                  level: 1, expanded: false, hasChildren: false, isActive: false, parentId: 'rn' },
  ];

  tableRows: TableRow[] = [
    { index: 1, name: 'ODM intellectual property', notes: 1, size: '72 MB', files: '9 files',      published: true,  redaction: 'applied'         },
    { index: 2, name: 'Intellectual property',     notes: 2, size: '0 MB',  files: '0 files',      published: true,  redaction: 'applied-drafted' },
    { index: 3, name: 'Trade secrets',             notes: 2, size: '72 MB', files: '18297 files',   published: true,  redaction: 'drafted'         },
    { index: 4, name: 'ACME Inc.',                 notes: 2, size: '3 MB',  files: '13 pages',     published: false, redaction: 'none'            },
    { index: 5, name: 'ACME Cooperative',          notes: 2, size: '3 MB',  files: '13 pages',     published: false, redaction: 'none'            },
  ];

  get visibleNodes(): TreeNode[] {
    const visible: TreeNode[] = [];
    const expandedIds = new Set<string>();

    for (const node of this.allNodes) {
      if (node.level === 0) {
        visible.push(node);
        if (node.expanded) expandedIds.add(node.id);
      } else {
        const parentVisible = node.parentId ? expandedIds.has(node.parentId) : false;
        // check all ancestors are expanded
        if (this.isAncestorChainVisible(node)) {
          visible.push(node);
          if (node.expanded) expandedIds.add(node.id);
        }
      }
    }
    return visible;
  }

  private isAncestorChainVisible(node: TreeNode): boolean {
    if (!node.parentId) return true;
    const parent = this.allNodes.find(n => n.id === node.parentId);
    if (!parent) return false;
    if (!parent.expanded) return false;
    return this.isAncestorChainVisible(parent);
  }

  redactionLabel(r: TableRow['redaction']): string {
    const map = {
      'applied':         'Applied',
      'applied-drafted': 'Applied & drafted',
      'drafted':         'Drafted',
      'none':            'None',
    };
    return map[r];
  }

  toggleNode(node: TreeNode): void {
    if (node.hasChildren) {
      node.expanded = !node.expanded;
    }
    this.allNodes.forEach(n => n.isActive = false);
    node.isActive = true;
  }

  ngOnInit(): void {
    this.tracker.trackPageView('quick-access-panel');
    this.loadColumnWidths();
    this.updateResponsiveState();
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    this.stopColResize();
    window.removeEventListener('resize', this.onWindowResize);
  }

  // ── Column resize (Documents table) ─────────────────────────────────────

  private readonly COLS_STORAGE_KEY = 'fvdr-quick-access-panel:col-widths';
  private readonly COL_DEFAULTS: Record<ResizableColId, number> = { idx: 94, name: 280, notes: 72, size: 121, pub: 127, red: 172 };
  private readonly COL_MIN: Record<ResizableColId, number>      = { idx: 64, name: 120, notes: 48, size: 80,  pub: 80,  red: 100 };
  private readonly COL_MAX: Record<ResizableColId, number>      = { idx: 240, name: 640, notes: 200, size: 300, pub: 300, red: 320 };
  /** Fixed content (icon + gap) that precedes the measured text in a cell, added on auto-fit. */
  private readonly COL_MEASURE_OFFSET: Record<ResizableColId, number> = { idx: 28, name: 0, notes: 0, size: 0, pub: 0, red: 0 };

  colWidths: Record<ResizableColId, number> = { ...this.COL_DEFAULTS };
  resizingCol: ResizableColId | null = null;
  hoveredColRect: { left: number; width: number; height: number } | null = null;
  isMobileViewport = false;
  private colStartX = 0;
  private colStartWidth = 0;
  private pendingColWidth: number | null = null;
  private colRafScheduled = false;

  get gridTemplateColumns(): string {
    const c = this.colWidths;
    // Every column is a plain fixed-px track (no flex/minmax) so resize is
    // identical for all of them: a column's left edge never moves, only its
    // own right edge grows/shrinks, shifting columns to its right.
    return `${c.idx}px ${c.name}px ${c.notes}px ${c.size}px ${c.pub}px ${c.red}px 80px`;
  }

  private onWindowResize = () => this.updateResponsiveState();

  private updateResponsiveState(): void {
    this.isMobileViewport = window.innerWidth < 768;
  }

  private clampColWidth(id: ResizableColId, value: number): number {
    return Math.min(this.COL_MAX[id], Math.max(this.COL_MIN[id], Math.round(value)));
  }

  onColHeaderEnter(event: MouseEvent, _colId: ResizableColId): void {
    if (this.isMobileViewport || this.resizingCol) return;
    const cell = event.currentTarget as HTMLElement;
    const wrap = cell.closest('.tbl-wrap') as HTMLElement | null;
    if (!wrap) return;
    this.hoveredColRect = {
      left: cell.offsetLeft,
      width: cell.offsetWidth,
      height: wrap.scrollHeight,
    };
  }

  onColHeaderLeave(): void {
    this.hoveredColRect = null;
  }

  startColResize(event: MouseEvent, colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    event.preventDefault();
    event.stopPropagation();
    this.resizingCol = colId;
    this.hoveredColRect = null;
    this.colStartX = event.clientX;
    this.colStartWidth = this.colWidths[colId];
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.onColMouseMove);
    document.addEventListener('mouseup', this.onColMouseUp);
  }

  private onColMouseMove = (e: MouseEvent) => {
    if (!this.resizingCol) return;
    const id = this.resizingCol;
    const delta = e.clientX - this.colStartX;
    this.pendingColWidth = this.clampColWidth(id, this.colStartWidth + delta);
    if (!this.colRafScheduled) {
      this.colRafScheduled = true;
      requestAnimationFrame(() => {
        this.colRafScheduled = false;
        if (this.resizingCol && this.pendingColWidth !== null) {
          this.colWidths = { ...this.colWidths, [this.resizingCol]: this.pendingColWidth };
        }
      });
    }
  };

  private onColMouseUp = () => {
    if (this.resizingCol) {
      // Commit synchronously in case the last mousemove's rAF hasn't fired yet —
      // otherwise a fast drag-and-release can persist a stale, pre-final width.
      if (this.pendingColWidth !== null) {
        this.colWidths = { ...this.colWidths, [this.resizingCol]: this.pendingColWidth };
      }
      this.saveColumnWidths();
    }
    this.pendingColWidth = null;
    this.stopColResize();
  };

  private stopColResize(): void {
    this.resizingCol = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this.onColMouseMove);
    document.removeEventListener('mouseup', this.onColMouseUp);
  }

  onColResizeKeydown(event: KeyboardEvent, colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    const step = event.shiftKey ? 32 : 8;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.colWidths = { ...this.colWidths, [colId]: this.clampColWidth(colId, this.colWidths[colId] - step) };
      this.saveColumnWidths();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.colWidths = { ...this.colWidths, [colId]: this.clampColWidth(colId, this.colWidths[colId] + step) };
      this.saveColumnWidths();
    }
  }

  autoFitColumn(colId: ResizableColId): void {
    if (this.isMobileViewport) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-col-measure="${colId}"]`));
    const widest = els.length ? Math.max(...els.map(el => el.scrollWidth)) : this.COL_MIN[colId];
    const cellPadding = 32; // --space-4 on both sides of the cell
    const target = widest + this.COL_MEASURE_OFFSET[colId] + cellPadding;
    this.colWidths = { ...this.colWidths, [colId]: this.clampColWidth(colId, target) };
    this.saveColumnWidths();
  }

  private loadColumnWidths(): void {
    try {
      const raw = sessionStorage.getItem(this.COLS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Record<ResizableColId, number>>;
      const merged = { ...this.COL_DEFAULTS };
      (Object.keys(merged) as ResizableColId[]).forEach(id => {
        const v = saved[id];
        if (typeof v === 'number') merged[id] = this.clampColWidth(id, v);
      });
      this.colWidths = merged;
    } catch {
      // corrupted sessionStorage entry — fall back to defaults
    }
  }

  private saveColumnWidths(): void {
    try {
      sessionStorage.setItem(this.COLS_STORAGE_KEY, JSON.stringify(this.colWidths));
    } catch {
      // sessionStorage unavailable (private mode / quota) — resize still works in-memory for this session
    }
  }

}
