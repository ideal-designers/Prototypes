import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  SidebarNavItem,
  FvdrFileType,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permission-search';

interface TreeItem {
  id: number;
  index: string;
  name: string;
  type: 'folder' | 'xlsx' | 'pdf' | 'doc';
  perms: number[]; // index = group, value = level 0–7
}

const PERM_COLS = [
  { label: 'Fence',     icon: 'perm-fence'     },
  { label: 'View',      icon: 'perm-view'      },
  { label: 'Encrypted', icon: 'perm-encrypted' },
  { label: 'PDF',       icon: 'perm-pdf'       },
  { label: 'Original',  icon: 'perm-original'  },
  { label: 'Upload',    icon: 'perm-upload'    },
  { label: 'Manage',    icon: 'perm-manage'    },
] as const;

@Component({
  selector: 'fvdr-permission-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <!-- ── Sidebar ─────────────────────────────────────────── -->
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Nova Z"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavItem($event)"
      />

      <!-- ── Main ────────────────────────────────────────────── -->
      <div class="main">

        <!-- Header -->
        <header class="top-bar">
          <fvdr-breadcrumbs [items]="breadcrumbs" />
          <div class="hdr-actions">
            <button class="ic-btn" aria-label="Help">
              <fvdr-icon name="help" />
            </button>
            <fvdr-avatar initials="JD" size="md" />
          </div>
        </header>

        <!-- Content -->
        <div class="content">

          <!-- Toolbar -->
          <div class="toolbar">
            <button class="tool-btn">
              <fvdr-icon name="settings-filter" />
              Set permissions by file type
            </button>
            <button class="tool-btn">
              <fvdr-icon name="download" />
              Export
            </button>
            <button class="tool-btn">
              <fvdr-icon name="view-as" />
              View as
            </button>
            <button class="tool-link">
              Permissions log
              <fvdr-icon name="share" />
            </button>
          </div>

          <!-- Panels -->
          <div class="panels">

            <!-- Tree panel -->
            <div class="tree-panel">
              <div class="tree-hdr">
                <span class="tree-hdr-title">Documents</span>
                <button class="tool-link tool-link--sm">
                  <fvdr-icon name="share" />
                  By groups
                </button>
              </div>

              <div class="search-wrap">
                <fvdr-search [(ngModel)]="searchQuery" placeholder="Search" />
              </div>

              <div class="tree-list">
                <!-- Pinned item (selected with unsaved changes while searching) -->
                <ng-container *ngIf="pinnedItem">
                  <div class="tree-item tree-item--selected"
                       (click)="selectItem(pinnedItem!.id)">
                    <div class="tree-item-body">
                      <fvdr-file-icon [type]="fileType(pinnedItem!.type)" />
                      <span class="item-idx">{{ pinnedItem!.index }}</span>
                      <span class="item-name"
                            [innerHTML]="highlight(pinnedItem!.name)"></span>
                      <span class="item-dot"></span>
                    </div>
                  </div>
                  <div class="tree-divider"></div>
                </ng-container>

                <!-- Filtered items -->
                <ng-container *ngIf="filteredItems.length; else emptyTpl">
                  <div *ngFor="let item of filteredItems"
                       class="tree-item"
                       [class.tree-item--selected]="item.id === selectedId"
                       (click)="selectItem(item.id)">
                    <div class="tree-item-body">
                      <fvdr-file-icon [type]="fileType(item.type)" />
                      <span class="item-idx">{{ item.index }}</span>
                      <span class="item-name"
                            [innerHTML]="highlight(item.name)"></span>
                      <span *ngIf="pendingPerms[item.id]" class="item-dot"></span>
                    </div>
                  </div>
                </ng-container>

                <ng-template #emptyTpl>
                  <div *ngIf="!pinnedItem" class="tree-empty">No matches found</div>
                  <div *ngIf="pinnedItem" class="tree-empty">No other matches found</div>
                </ng-template>
              </div>
            </div>

            <!-- Permission table -->
            <div class="perm-table">

              <!-- Expand col -->
              <div class="col-expand">
                <div class="th-expand"></div>
                <div *ngFor="let g of groups; let gi = index" class="td-expand">
                  <fvdr-icon *ngIf="gi > 0" name="chevron-right" />
                </div>
              </div>

              <!-- Groups col -->
              <div class="col-groups">
                <div class="th-groups">Groups</div>
                <div *ngFor="let g of groups; let gi = index" class="td-group">
                  <fvdr-icon name="participants" />
                  <span>{{ g }}</span>
                </div>
              </div>

              <!-- Permission slider col -->
              <div class="col-sliders">
                <!-- Header -->
                <div class="perm-header">
                  <div class="perm-spacer"></div>
                  <div *ngFor="let col of permCols" class="perm-th">
                    <fvdr-icon [name]="col.icon" />
                    <span>{{ col.label }}</span>
                  </div>
                </div>

                <!-- Rows -->
                <div *ngFor="let g of groups; let gi = index" class="perm-row">
                  <div class="slider-track">
                    <div *ngFor="let pos of sliderRange"
                         class="slider-block"
                         [class.s-light]="sliderCls(currentPerms(selectedId)[gi], pos) === 'light'"
                         [class.s-active]="sliderCls(currentPerms(selectedId)[gi], pos) === 'active'"
                         [class.s-none]="sliderCls(currentPerms(selectedId)[gi], pos) === 'none'"
                         (click)="setLevel(gi, pos)">
                    </div>
                  </div>
                </div>
              </div>

            </div><!-- /perm-table -->
          </div><!-- /panels -->
        </div><!-- /content -->
      </div><!-- /main -->
    </div><!-- /shell -->

    <!-- Save bar -->
    <div class="save-bar" [class.save-bar--visible]="hasUnsavedChanges">
      <fvdr-btn variant="secondary" label="Cancel" (clicked)="cancel()" />
      <fvdr-btn variant="primary"   label="Save"   (clicked)="save()"   />
    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Shell ── */
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family);
      background: var(--color-stone-0);
    }

    /* ── Main ── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Top bar ── */
    .top-bar {
      height: 64px;
      min-height: 64px;
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6);
      flex-shrink: 0;
    }
    .hdr-actions { display: flex; align-items: center; gap: var(--space-6); }
    .ic-btn {
      background: none; border: none; cursor: pointer;
      width: 24px; height: 24px; padding: 0;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary); font-size: 20px;
      border-radius: var(--radius-sm); transition: color 0.12s;
    }
    .ic-btn:hover { color: var(--color-text-primary); }

    /* ── Content ── */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: var(--space-6);
      gap: var(--space-6);
      background: var(--color-stone-0);
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-shrink: 0;
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      height: 36px;
      padding: 0 var(--space-4);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-family: var(--font-family);
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      color: var(--color-text-primary);
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.12s;
      font-size: 14px;
    }
    .tool-btn fvdr-icon { font-size: 16px; color: var(--color-text-secondary); }
    .tool-btn:hover { border-color: var(--color-primary-500); }

    .tool-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--color-primary-500);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .tool-link fvdr-icon { font-size: 16px; }
    .tool-link--sm { font-size: var(--text-base-s-size, 13px); }

    /* ── Panels ── */
    .panels {
      display: flex;
      gap: var(--space-6);
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Tree panel ── */
    .tree-panel {
      width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      overflow: hidden;
    }

    .tree-hdr {
      height: 48px;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-4);
      flex-shrink: 0;
    }
    .tree-hdr-title {
      font-size: var(--text-label-m-size, 14px);
      font-weight: var(--text-label-m-weight, 600);
      color: var(--color-text-primary);
    }

    .search-wrap {
      padding: 0 0 var(--space-2);
      flex-shrink: 0;
    }
    .search-wrap fvdr-search { display: block; }

    .tree-list {
      flex: 1;
      overflow-y: auto;
    }
    .tree-list::-webkit-scrollbar { width: 4px; }
    .tree-list::-webkit-scrollbar-track { background: transparent; }
    .tree-list::-webkit-scrollbar-thumb {
      background: var(--color-divider);
      border-radius: 2px;
    }

    .tree-item {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.1s;
    }
    .tree-item:hover { background: var(--color-stone-200); }
    .tree-item--selected { background: var(--color-primary-50); }
    .tree-item--selected:hover { background: var(--color-primary-50); }

    .tree-item-body {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      min-width: 0;
    }
    .item-idx {
      font-size: var(--text-base-m-size);
      color: var(--color-text-primary);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item-name {
      font-size: var(--text-base-m-size);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    :host ::ng-deep .item-name mark {
      background: rgba(44,156,116,0.18);
      color: var(--color-primary-500);
      border-radius: 2px;
      padding: 0 1px;
      font-style: normal;
    }
    .item-dot {
      width: 8px; height: 8px;
      border-radius: var(--radius-full, 50%);
      background: #f4640c;
      flex-shrink: 0;
      margin-left: auto;
    }
    .tree-divider {
      height: 1px;
      background: var(--color-divider);
      margin: 0 0 var(--space-1);
    }
    .tree-empty {
      padding: var(--space-6) var(--space-4);
      text-align: center;
      color: var(--color-text-placeholder);
      font-size: var(--text-base-m-size);
    }

    /* ── Permission table ── */
    .perm-table {
      flex: 1;
      min-width: 0;
      display: flex;
      overflow: hidden;
      align-self: flex-start;
    }

    /* Expand col */
    .col-expand {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      flex-shrink: 0;
    }
    .th-expand {
      width: 32px; height: 48px;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    .td-expand {
      width: 32px; height: 40px;
      display: flex; align-items: center;
      padding-left: var(--space-4);
      color: var(--color-text-secondary);
      font-size: 16px;
    }

    /* Groups col */
    .col-groups {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      flex-shrink: 0;
    }
    .th-groups {
      height: 48px;
      background: var(--color-stone-200);
      display: flex;
      align-items: center;
      padding: 0 var(--space-4);
      font-size: var(--text-label-m-size, 14px);
      font-weight: var(--text-label-m-weight, 600);
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .td-group {
      height: 40px;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-4);
      font-size: var(--text-base-m-size);
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .td-group fvdr-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    /* Sliders col */
    .col-sliders {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      flex-shrink: 0;
    }
    .perm-header {
      height: 48px;
      background: var(--color-stone-200);
      display: flex;
      align-items: stretch;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    .perm-spacer {
      width: var(--space-4);
      flex-shrink: 0;
      background: var(--color-stone-200);
    }
    .perm-th {
      width: 62px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: var(--space-1) 0;
    }
    .perm-th fvdr-icon { font-size: 16px; color: var(--color-text-primary); }
    .perm-th span {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .perm-row {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 var(--space-1);
    }
    .slider-track {
      height: 16px;
      display: flex;
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .slider-block {
      width: 62px; height: 16px;
      border: 1px solid var(--color-stone-500);
      border-left: none;
      flex-shrink: 0;
      cursor: pointer;
      transition: filter 0.1s;
    }
    .slider-block:first-child {
      border-left: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    .slider-block:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .slider-block:hover { filter: brightness(0.88); }

    .s-light  { background: #7fdea5; }
    .s-active { background: var(--color-primary-500); }
    .s-none   { background: var(--color-stone-300); }

    /* ── Save bar ── */
    .save-bar {
      position: fixed;
      bottom: 0;
      right: 0;
      left: 72px;
      background: var(--color-stone-0);
      border-top: 1px solid var(--color-divider);
      display: none;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-6);
      z-index: 200;
    }
    .save-bar--visible { display: flex; }
  `],
})
export class PermissionSearchComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  sidebarCollapsed = true;
  searchQuery = '';
  selectedId = 1;
  pendingPerms: Record<number, number[]> = {};

  readonly navItems: SidebarNavItem[] = [
    { id: 'documents',   label: 'Documents',   icon: 'documents',       iconActive: 'documents-active'       },
    { id: 'users',       label: 'Users',        icon: 'users-groups',    iconActive: 'users-groups-active'    },
    { id: 'permissions', label: 'Permissions',  icon: 'nav-permissions', iconActive: 'nav-permissions-active', active: true },
    { id: 'settings',    label: 'Settings',     icon: 'nav-settings',    iconActive: 'nav-settings-active'    },
    { id: 'activity',    label: 'Activity',     icon: 'activities',      iconActive: 'activities-active'      },
  ];

  readonly treeItems: TreeItem[] = [
    { id: 1, index: '1',   name: 'Stage folder',                        type: 'folder', perms: [6,6,5,4,3,6] },
    { id: 2, index: '2',   name: 'Organizational chart and manage',     type: 'folder', perms: [7,7,6,5,4,5] },
    { id: 3, index: '3.1', name: 'Corporate DD — Product and Services', type: 'folder', perms: [5,6,4,2,3,5] },
    { id: 4, index: '4',   name: 'Financial DD — Accounts Receivables', type: 'folder', perms: [6,6,5,3,4,6] },
    { id: 5, index: '5',   name: 'Key contacts by function',            type: 'xlsx',   perms: [4,5,3,1,2,4] },
    { id: 6, index: '6',   name: 'Tax accounting.xlsx',                 type: 'xlsx',   perms: [5,5,4,2,3,5] },
    { id: 7, index: '7',   name: 'Tax returns.pdf',                     type: 'pdf',    perms: [3,4,3,1,0,3] },
    { id: 8, index: '8',   name: 'Registration with tax authorities',   type: 'doc',    perms: [6,7,5,4,3,6] },
  ];

  readonly groups = ['All groups', 'White Co.', 'Yellow Co.', 'Red Co.', 'Green Co.', 'Blue co.'];
  readonly permCols = PERM_COLS;
  readonly sliderRange = Array.from({ length: 7 }, (_, i) => i + 1);

  get selectedItem(): TreeItem { return this.treeItems.find(t => t.id === this.selectedId)!; }

  get breadcrumbs() {
    return [
      { id: 'permissions', label: 'Permissions' },
      { id: 'item', label: this.selectedItem?.name ?? '' },
    ];
  }

  get hasUnsavedChanges(): boolean { return Object.keys(this.pendingPerms).length > 0; }

  currentPerms(id: number): number[] {
    return this.pendingPerms[id] ?? this.treeItems.find(t => t.id === id)!.perms.slice();
  }

  get filteredItems(): TreeItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const hasDirty = !!this.pendingPerms[this.selectedId];
    const shouldPin = q && hasDirty;
    return this.treeItems.filter(item => {
      if (shouldPin && item.id === this.selectedId) return false;
      return !q
        || item.name.toLowerCase().includes(q)
        || item.index.toLowerCase().includes(q);
    });
  }

  get pinnedItem(): TreeItem | null {
    const q = this.searchQuery.trim();
    return (q && !!this.pendingPerms[this.selectedId]) ? this.selectedItem : null;
  }

  highlight(text: string): string {
    const q = this.searchQuery.trim();
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!q) return safe;
    const re = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${re})`, 'gi'), '<mark>$1</mark>');
  }

  fileType(type: string): FvdrFileType {
    const map: Record<string, FvdrFileType> = { folder: 'folder', xlsx: 'xls', pdf: 'pdf', doc: 'doc' };
    return map[type] ?? 'placeholder';
  }

  selectItem(id: number): void { this.selectedId = id; }

  sliderCls(level: number, pos: number): 'light' | 'active' | 'none' {
    if (level === 0) return 'none';
    if (pos < level)  return 'light';
    if (pos === level) return 'active';
    return 'none';
  }

  setLevel(groupIndex: number, newLevel: number): void {
    if (!this.pendingPerms[this.selectedId]) {
      this.pendingPerms = {
        ...this.pendingPerms,
        [this.selectedId]: this.currentPerms(this.selectedId),
      };
    }
    const updated = [...this.pendingPerms[this.selectedId]];
    updated[groupIndex] = newLevel;
    this.pendingPerms = { ...this.pendingPerms, [this.selectedId]: updated };
  }

  save(): void {
    Object.entries(this.pendingPerms).forEach(([id, perms]) => {
      const item = this.treeItems.find(t => t.id === Number(id));
      if (item) item.perms = perms.slice();
    });
    this.pendingPerms = {};
  }

  cancel(): void { this.pendingPerms = {}; }

  onNavItem(_item: SidebarNavItem): void { /* prototype — no routing */ }

  ngOnInit(): void  { this.tracker.trackPageView(SLUG); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }
}
