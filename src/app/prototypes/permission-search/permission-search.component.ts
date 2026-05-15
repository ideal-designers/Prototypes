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
  perms: number[]; // index = groupIdx (0–5), value = level 0–7
}

interface GroupUser {
  id: number;
  name: string;
  initials: string;
}

interface Group {
  id: number;       // matches perms[] index
  name: string;
  color: string | null;
  users: GroupUser[];
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

const GROUPS: Group[] = [
  { id: 0, name: 'All groups', color: null, users: [] },
  { id: 1, name: 'White Co.',  color: '#EB5DB0', users: [
    { id: 101, name: 'Nina Ross',   initials: 'NR' },
    { id: 102, name: 'Ryan Cook',   initials: 'RC' },
  ]},
  { id: 2, name: 'Yellow Co.', color: '#D1B200', users: [
    { id: 201, name: 'Anna Miller', initials: 'AM' },
    { id: 202, name: 'John Smith',  initials: 'JS' },
    { id: 203, name: 'Kate Brown',  initials: 'KB' },
  ]},
  { id: 3, name: 'Red Co.',    color: '#E54430', users: [
    { id: 301, name: 'Mark Davis',  initials: 'MD' },
    { id: 302, name: 'Sarah Wilson',initials: 'SW' },
  ]},
  { id: 4, name: 'Green Co.',  color: '#2C9C74', users: [
    { id: 401, name: 'Tom Clark',   initials: 'TC' },
    { id: 402, name: 'Lisa Lee',    initials: 'LL' },
  ]},
  { id: 5, name: 'Blue co.',   color: '#358CEB', users: [
    { id: 501, name: 'Peter Hall',  initials: 'PH' },
    { id: 502, name: 'Chris Tan',   initials: 'CT' },
  ]},
];

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

            <!-- ── LEFT PANEL ───────────────────────────────── -->
            <div class="tree-panel">
              <div class="tree-hdr">
                <span class="tree-hdr-title">{{ leftPanelTitle }}</span>
                <button class="tool-link tool-link--sm" (click)="toggleViewMode()">
                  <fvdr-icon [name]="viewMode === 'by-groups' ? 'users-groups' : 'documents'" />
                  {{ viewMode === 'by-groups' ? 'By groups' : 'By documents' }}
                </button>
              </div>

              <!-- By groups: document search + tree -->
              <ng-container *ngIf="viewMode === 'by-groups'">
                <div class="search-wrap">
                  <fvdr-search [(ngModel)]="searchQuery" placeholder="Search" />
                </div>
                <div class="tree-list">
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
                  <ng-container *ngIf="filteredItems.length; else emptyTpl">
                    <div *ngFor="let item of filteredItems"
                         class="tree-item"
                         [class.tree-item--selected]="item.id === selectedDocId"
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
                    <div class="tree-empty">
                      {{ pinnedItem ? 'No other matches found' : 'No matches found' }}
                    </div>
                  </ng-template>
                </div>
              </ng-container>

              <!-- By documents: groups list with colors + expand -->
              <ng-container *ngIf="viewMode === 'by-documents'">
                <div class="tree-list">
                  <ng-container *ngFor="let g of groupsForPanel">
                    <!-- Group row -->
                    <div class="tree-item group-item"
                         [class.tree-item--selected]="selectedGroupIdx === g.id"
                         (click)="selectGroup(g.id)">
                      <button *ngIf="g.users.length"
                              class="expand-btn"
                              (click)="$event.stopPropagation(); toggleGroupExpand(g.id)">
                        <fvdr-icon name="chevron-right"
                                   [class.chevron-open]="isGroupExpanded(g.id)" />
                      </button>
                      <span *ngIf="!g.users.length" class="expand-gap"></span>
                      <fvdr-icon name="participants"
                                 [style.color]="g.color ?? 'var(--color-text-secondary)'" />
                      <span class="item-name">{{ g.name }}</span>
                    </div>
                    <!-- User sub-rows -->
                    <ng-container *ngIf="isGroupExpanded(g.id)">
                      <div *ngFor="let u of g.users"
                           class="tree-item tree-item--user"
                           [class.tree-item--selected]="selectedGroupIdx === g.id">
                        <span class="expand-gap"></span>
                        <fvdr-avatar [initials]="u.initials" size="sm"
                                     [color]="g.color ?? '#9C9EA8'"
                                     textColor="#fff" />
                        <span class="item-name">{{ u.name }}</span>
                      </div>
                    </ng-container>
                  </ng-container>
                </div>
              </ng-container>
            </div>

            <!-- ── RIGHT PANEL: row-based permission table ─── -->
            <div class="perm-table">

              <!-- Header row -->
              <div class="pt-header">
                <div class="pt-expand-cell"></div>
                <div class="pt-entity-cell pt-entity-hdr">
                  {{ viewMode === 'by-groups' ? 'Groups' : 'Documents' }}
                </div>
                <div class="pt-perm-hdr">
                  <div class="perm-spacer"></div>
                  <div *ngFor="let col of permCols" class="perm-th">
                    <fvdr-icon [name]="col.icon" />
                    <span>{{ col.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Scrollable rows -->
              <div class="pt-rows">

                <!-- ── By groups: group rows + expandable users ── -->
                <ng-container *ngIf="viewMode === 'by-groups'">
                  <ng-container *ngFor="let g of groups; let gi = index">
                    <!-- Group row -->
                    <div class="pt-row">
                      <div class="pt-expand-cell">
                        <button *ngIf="g.users.length"
                                class="expand-btn"
                                (click)="toggleGroupExpand(g.id)">
                          <fvdr-icon name="chevron-right"
                                     [class.chevron-open]="isGroupExpanded(g.id)" />
                        </button>
                      </div>
                      <div class="pt-entity-cell">
                        <fvdr-icon name="participants"
                                   [style.color]="g.color ?? 'var(--color-text-secondary)'" />
                        <span class="pt-entity-name">{{ g.name }}</span>
                      </div>
                      <div class="pt-perm-cell">
                        <div class="slider-track">
                          <div *ngFor="let pos of sliderRange"
                               class="slider-block"
                               [class.s-light]="sliderCls(getLevel(selectedDocId, gi), pos) === 'light'"
                               [class.s-active]="sliderCls(getLevel(selectedDocId, gi), pos) === 'active'"
                               [class.s-none]="sliderCls(getLevel(selectedDocId, gi), pos) === 'none'"
                               (click)="setLevelByGroup(gi, pos)">
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- User sub-rows (expanded) -->
                    <ng-container *ngIf="isGroupExpanded(g.id)">
                      <div *ngFor="let u of g.users" class="pt-row pt-row--user">
                        <div class="pt-expand-cell"></div>
                        <div class="pt-entity-cell pt-entity-cell--user">
                          <fvdr-avatar [initials]="u.initials" size="sm"
                                       [color]="g.color ?? '#9C9EA8'"
                                       textColor="#fff" />
                          <span class="pt-entity-name">{{ u.name }}</span>
                        </div>
                        <div class="pt-perm-cell">
                          <div class="slider-track slider-track--ro">
                            <div *ngFor="let pos of sliderRange"
                                 class="slider-block"
                                 [class.s-light]="sliderCls(getLevel(selectedDocId, gi), pos) === 'light'"
                                 [class.s-active]="sliderCls(getLevel(selectedDocId, gi), pos) === 'active'"
                                 [class.s-none]="sliderCls(getLevel(selectedDocId, gi), pos) === 'none'">
                            </div>
                          </div>
                        </div>
                      </div>
                    </ng-container>
                  </ng-container>
                </ng-container>

                <!-- ── By documents: document rows ── -->
                <ng-container *ngIf="viewMode === 'by-documents'">
                  <div *ngFor="let item of treeItems" class="pt-row">
                    <div class="pt-expand-cell">
                      <fvdr-icon *ngIf="item.type === 'folder'"
                                 name="chevron-right"
                                 style="color: var(--color-text-secondary); font-size: 16px;" />
                    </div>
                    <div class="pt-entity-cell">
                      <fvdr-file-icon [type]="fileType(item.type)" />
                      <span class="item-idx">{{ item.index }}</span>
                      <span class="pt-entity-name">{{ item.name }}</span>
                      <span *ngIf="hasDocPending(item.id)" class="item-dot"></span>
                    </div>
                    <div class="pt-perm-cell">
                      <div class="slider-track">
                        <div *ngFor="let pos of sliderRange"
                             class="slider-block"
                             [class.s-light]="sliderCls(getLevel(item.id, selectedGroupIdx), pos) === 'light'"
                             [class.s-active]="sliderCls(getLevel(item.id, selectedGroupIdx), pos) === 'active'"
                             [class.s-none]="sliderCls(getLevel(item.id, selectedGroupIdx), pos) === 'none'"
                             (click)="setLevelByDoc(item.id, pos)">
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>

              </div><!-- /pt-rows -->
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
      font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer;
      white-space: nowrap;
      transition: border-color 0.12s;
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
    .tool-link--sm { font-size: 13px; }

    /* ── Panels ── */
    .panels {
      display: flex;
      gap: var(--space-6);
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Left / tree panel ── */
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
      font-size: 14px;
      font-weight: 600;
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

    /* Tree items (docs + groups) */
    .tree-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: 40px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.1s;
    }
    .tree-item:hover { background: var(--color-stone-200); }
    .tree-item--selected { background: var(--color-primary-50); }
    .tree-item--selected:hover { background: var(--color-primary-50); }
    .tree-item--user { padding-left: calc(var(--space-4) + 16px + var(--space-2)); height: 36px; }

    /* Doc tree items layout */
    .tree-item-body {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      min-width: 0;
    }
    .item-idx {
      font-size: 14px;
      color: var(--color-text-primary);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .item-name {
      font-size: 14px;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
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
      border-radius: 50%;
      background: var(--color-warning-600);
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
      font-size: 14px;
    }

    /* Groups in left panel */
    .group-item { gap: var(--space-1); }
    .group-item fvdr-icon { font-size: 16px; flex-shrink: 0; }
    .expand-gap { width: 20px; flex-shrink: 0; }

    /* ── Expand button (chevron) ── */
    .expand-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 14px;
      padding: 0;
      transition: background 0.1s;
    }
    .expand-btn:hover { background: var(--color-stone-300); }
    .expand-btn fvdr-icon { transition: transform 0.18s ease; }
    .expand-btn fvdr-icon.chevron-open { transform: rotate(90deg); }

    /* ── Permission table (row-based) ── */
    .perm-table {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header row */
    .pt-header {
      height: 48px;
      min-height: 48px;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: stretch;
      flex-shrink: 0;
    }

    /* Scrollable rows wrapper */
    .pt-rows {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .pt-rows::-webkit-scrollbar { width: 4px; }
    .pt-rows::-webkit-scrollbar-track { background: transparent; }
    .pt-rows::-webkit-scrollbar-thumb {
      background: var(--color-divider);
      border-radius: 2px;
    }

    /* Data row */
    .pt-row {
      display: flex;
      align-items: center;
      height: 40px;
      min-height: 40px;
      transition: background 0.1s;
    }
    .pt-row:hover { background: var(--color-stone-100); }
    .pt-row--user {
      height: 36px;
      min-height: 36px;
      background: var(--color-stone-100);
    }
    .pt-row--user:hover { background: var(--color-stone-200); }

    /* Expand cell */
    .pt-expand-cell {
      width: 32px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Entity cell (groups name / doc name) */
    .pt-entity-cell {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-3);
      overflow: hidden;
    }
    .pt-entity-cell fvdr-icon { font-size: 16px; flex-shrink: 0; }
    .pt-entity-hdr {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      padding: 0 var(--space-4);
    }
    .pt-entity-cell--user {
      padding-left: calc(var(--space-3) + 8px);
    }
    .pt-entity-name {
      font-size: 14px;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    /* Perm header (icons + labels) */
    .pt-perm-hdr {
      display: flex;
      align-items: stretch;
      flex-shrink: 0;
    }
    .perm-spacer {
      width: var(--space-2);
      flex-shrink: 0;
    }
    .perm-th {
      width: 62px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: var(--space-1) 0;
      flex-shrink: 0;
    }
    .perm-th fvdr-icon { font-size: 16px; color: var(--color-text-primary); }
    .perm-th span {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* Perm cell (slider) */
    .pt-perm-cell {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      padding: 0 var(--space-2);
    }
    .slider-track {
      height: 16px;
      display: flex;
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .slider-track--ro { opacity: 0.55; pointer-events: none; }
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
    .s-light  { background: var(--color-primary-50); filter: saturate(1.8); }
    .s-active { background: var(--color-primary-500); }
    .s-none   { background: var(--color-stone-300); }

    /* ── Save bar ── */
    .save-bar {
      position: fixed;
      bottom: 0; right: 0; left: 72px;
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
  selectedDocId = 1;
  selectedGroupIdx = 2; // Yellow Co. selected by default in "By documents" mode
  viewMode: 'by-groups' | 'by-documents' = 'by-groups';
  pendingPerms: Record<number, number[]> = {};
  private expandedGroupIds = new Set<number>();

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

  readonly groups = GROUPS;
  readonly permCols = PERM_COLS;
  readonly sliderRange = Array.from({ length: 7 }, (_, i) => i + 1);

  /** Groups shown in "By documents" left panel (skip "All groups") */
  get groupsForPanel(): Group[] {
    return GROUPS.filter(g => g.id !== 0);
  }

  get leftPanelTitle(): string {
    return this.viewMode === 'by-groups' ? 'Documents' : 'Groups';
  }

  get selectedDocItem(): TreeItem {
    return this.treeItems.find(t => t.id === this.selectedDocId)!;
  }

  get selectedGroup(): Group {
    return GROUPS.find(g => g.id === this.selectedGroupIdx) ?? GROUPS[0];
  }

  get breadcrumbs() {
    if (this.viewMode === 'by-groups') {
      return [
        { id: 'permissions', label: 'Permissions' },
        { id: 'item', label: this.selectedDocItem?.name ?? '' },
      ];
    } else {
      return [
        { id: 'permissions', label: 'Permissions' },
        { id: 'item', label: 'Documents' },
      ];
    }
  }

  get hasUnsavedChanges(): boolean {
    return Object.keys(this.pendingPerms).length > 0;
  }

  /** Returns current permission level for docId + groupIdx */
  getLevel(docId: number, groupIdx: number): number {
    const base = this.treeItems.find(t => t.id === docId)!.perms;
    const overrides = this.pendingPerms[docId] ?? base;
    return overrides[groupIdx] ?? 0;
  }

  hasDocPending(docId: number): boolean {
    return !!this.pendingPerms[docId];
  }

  /** Group expand/collapse */
  toggleGroupExpand(groupId: number): void {
    if (this.expandedGroupIds.has(groupId)) {
      this.expandedGroupIds.delete(groupId);
    } else {
      this.expandedGroupIds.add(groupId);
    }
    // trigger change detection
    this.expandedGroupIds = new Set(this.expandedGroupIds);
  }

  isGroupExpanded(groupId: number): boolean {
    return this.expandedGroupIds.has(groupId);
  }

  /** Mode toggle */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'by-groups' ? 'by-documents' : 'by-groups';
    this.expandedGroupIds = new Set();
  }

  /** "By documents" left panel: select a group */
  selectGroup(groupId: number): void {
    this.selectedGroupIdx = groupId;
  }

  // ── Filtered tree (By groups mode) ───────────────────────

  get filteredItems(): TreeItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const hasDirty = !!this.pendingPerms[this.selectedDocId];
    const shouldPin = q && hasDirty;
    return this.treeItems.filter(item => {
      if (shouldPin && item.id === this.selectedDocId) return false;
      return !q
        || item.name.toLowerCase().includes(q)
        || item.index.toLowerCase().includes(q);
    });
  }

  get pinnedItem(): TreeItem | null {
    const q = this.searchQuery.trim();
    return (q && !!this.pendingPerms[this.selectedDocId]) ? this.selectedDocItem : null;
  }

  highlight(text: string): string {
    const q = this.searchQuery.trim();
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!q) return safe;
    const re = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${re})`, 'gi'), '<mark>$1</mark>');
  }

  fileType(type: string): FvdrFileType {
    const map: Record<string, FvdrFileType> = {
      folder: 'folder', xlsx: 'xls', pdf: 'pdf', doc: 'doc',
    };
    return map[type] ?? 'placeholder';
  }

  selectItem(id: number): void { this.selectedDocId = id; }

  sliderCls(level: number, pos: number): 'light' | 'active' | 'none' {
    if (level === 0) return 'none';
    if (pos < level)  return 'light';
    if (pos === level) return 'active';
    return 'none';
  }

  /** "By groups" mode: set level for a group on the selected document */
  setLevelByGroup(groupIdx: number, newLevel: number): void {
    const docId = this.selectedDocId;
    if (!this.pendingPerms[docId]) {
      this.pendingPerms = {
        ...this.pendingPerms,
        [docId]: this.treeItems.find(t => t.id === docId)!.perms.slice(),
      };
    }
    const updated = [...this.pendingPerms[docId]];
    updated[groupIdx] = newLevel;
    this.pendingPerms = { ...this.pendingPerms, [docId]: updated };
  }

  /** "By documents" mode: set level for a document on the selected group */
  setLevelByDoc(docId: number, newLevel: number): void {
    if (!this.pendingPerms[docId]) {
      this.pendingPerms = {
        ...this.pendingPerms,
        [docId]: this.treeItems.find(t => t.id === docId)!.perms.slice(),
      };
    }
    const updated = [...this.pendingPerms[docId]];
    updated[this.selectedGroupIdx] = newLevel;
    this.pendingPerms = { ...this.pendingPerms, [docId]: updated };
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
