import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  SidebarNavItem,
  FvdrFileType,
  FvdrIconName,
  ToastService,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permissions-legend-v2';
const COACH_KEY = 'vdsn32-permissions-coachmark-seen-v2';
const PUBLISH_CONFIRM_SKIP_KEY = 'vdsn32-publish-confirm-skip-v2';

interface TreeItem {
  id: number;
  index: string;
  name: string;
  type: 'folder' | 'xlsx' | 'pdf' | 'doc' | 'video';
  perms: number[];       // index = groupIdx (0–5), value = level 0–7
  restricted?: number[]; // levels (1–7) not offered for this file type
  published?: boolean;   // shown as a tiny corner badge on the file/folder icon
}

interface GroupUser {
  id: number;
  name: string;
  initials: string;
}

interface Group {
  id: number; // matches perms[] index
  name: string;
  color: string | null;
  users: GroupUser[];
}

interface PermLevelInfo {
  level: number; // 0–7
  label: string;
  icon: FvdrIconName | null;
  description: string;
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

// Full 0–7 hierarchy — level 0 has no column/icon, shown only in the legend.
const PERM_LEVELS: PermLevelInfo[] = [
  { level: 0, label: 'No access', icon: null,
    description: 'The group doesn’t see this file or folder at all.' },
  { level: 1, label: 'Fence', icon: 'perm-fence',
    description: 'Views only the area around the cursor in-browser — the rest is masked. Protects against camera-shot leaks.' },
  { level: 2, label: 'View', icon: 'perm-view',
    description: 'Views the file in-browser with a watermark. Includes everything from Fence.' },
  { level: 3, label: 'Encrypted', icon: 'perm-encrypted',
    description: 'Downloads an encrypted, password-protected copy (IRM for Office files, encrypted PDF for others).' },
  { level: 4, label: 'PDF', icon: 'perm-pdf',
    description: 'Downloads and prints a watermarked PDF copy.' },
  { level: 5, label: 'Original', icon: 'perm-original',
    description: 'Downloads the original file format. This download can’t be revoked afterwards.' },
  { level: 6, label: 'Upload', icon: 'perm-upload',
    description: 'Adds new documents to this folder, plus everything below.' },
  { level: 7, label: 'Manage', icon: 'perm-manage',
    description: 'Deletes, moves, copies, renames, redacts and labels — full control.' },
];

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
  selector: 'fvdr-permissions-legend-v2',
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

            <div class="legend-wrap">
              <button class="tool-btn" [class.tool-btn--active]="legendOpen"
                      data-track="toggle-legend"
                      (click)="toggleLegend()">
                <fvdr-icon name="info" />
                Legend
              </button>

              <div class="legend-panel" *ngIf="legendOpen">
                <div class="legend-panel-hdr">
                  <span>What do the icons and colors mean?</span>
                  <button class="ic-btn" aria-label="Close legend" (click)="legendOpen = false">
                    <fvdr-icon name="close" />
                  </button>
                </div>

                <div class="legend-row" *ngFor="let lvl of permLevels">
                  <span class="legend-swatch"
                        [class.legend-swatch--none]="lvl.level === 0"
                        [style.background]="lvl.level > 0 ? swatchColor() : null"></span>
                  <fvdr-icon *ngIf="lvl.icon" [name]="lvl.icon" />
                  <span *ngIf="!lvl.icon" class="legend-icon-gap"></span>
                  <div class="legend-text">
                    <strong>{{ lvl.label }}</strong>
                    <span>{{ lvl.description }}</span>
                  </div>
                </div>

                <div class="legend-row">
                  <span class="legend-swatch legend-swatch--hatched"></span>
                  <span class="legend-icon-gap"></span>
                  <div class="legend-text">
                    <strong>Not available</strong>
                    <span>This permission level doesn’t apply to this file type (e.g. unsupported formats or video files offer a reduced set of levels).</span>
                  </div>
                </div>

                <button class="legend-replay" data-track="replay-coachmark" (click)="replayCoachmark()">
                  <fvdr-icon name="overview" />
                  Show me how it works
                </button>
              </div>
            </div>
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
                        <span class="file-icon-wrap">
                          <fvdr-file-icon [type]="fileType(pinnedItem!.type)" />
                          <ng-container *ngTemplateOutlet="pubBadge; context: { $implicit: pinnedItem! }"></ng-container>
                        </span>
                        <span class="item-idx">{{ pinnedItem!.index }}</span>
                        <span class="item-name"
                              [innerHTML]="highlight(pinnedItem!.name)"></span>
                        <span class="unsaved-chip">Unsaved</span>
                        <div class="tree-item-actions">
                          <button class="tree-item-more"
                                  [class.tree-item-more--open]="publishMenuFor === pinnedItem!.id"
                                  (click)="togglePublishMenu(pinnedItem!.id, $event)">
                            <fvdr-icon name="more" />
                          </button>
                          <div class="publish-menu" *ngIf="publishMenuFor === pinnedItem!.id" (click)="$event.stopPropagation()">
                            <ng-container *ngTemplateOutlet="publishMenuTpl; context: { $implicit: pinnedItem }"></ng-container>
                          </div>
                        </div>
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
                        <span class="file-icon-wrap">
                          <fvdr-file-icon [type]="fileType(item.type)" />
                          <ng-container *ngTemplateOutlet="pubBadge; context: { $implicit: item }"></ng-container>
                        </span>
                        <span class="item-idx">{{ item.index }}</span>
                        <span class="item-name"
                              [innerHTML]="highlight(item.name)"></span>
                        <span *ngIf="searchQuery.trim() && pendingPerms[item.id]" class="unsaved-chip">Unsaved</span>
                        <div class="tree-item-actions">
                          <button class="tree-item-more"
                                  [class.tree-item-more--open]="publishMenuFor === item.id"
                                  (click)="togglePublishMenu(item.id, $event)">
                            <fvdr-icon name="more" />
                          </button>
                          <div class="publish-menu" *ngIf="publishMenuFor === item.id" (click)="$event.stopPropagation()">
                            <ng-container *ngTemplateOutlet="publishMenuTpl; context: { $implicit: item }"></ng-container>
                          </div>
                        </div>
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
                  <div *ngFor="let col of permCols; let i = index"
                       class="perm-th"
                       (mouseenter)="hoveredCol = i + 1"
                       (mouseleave)="hoveredCol = null">
                    <fvdr-icon [name]="col.icon" />
                    <span>{{ col.label }}</span>
                    <div class="th-tooltip" *ngIf="hoveredCol === i + 1">
                      <strong>{{ col.label }}</strong>
                      <p>{{ permLevels[i + 1].description }}</p>
                    </div>
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
                        <span class="row-empty-slot row-empty-slot--clickable"
                              (mouseenter)="hoveredSeg = 'g' + gi + '-0'"
                              (mouseleave)="hoveredSeg = null"
                              (click)="setLevelByGroup(gi, 0)">
                          <fvdr-icon *ngIf="getLevel(selectedDocId, gi) === 0" name="cancel" class="row-empty-icon" />
                          <div class="seg-tooltip" *ngIf="hoveredSeg === 'g' + gi + '-0'">
                            {{ permLevels[0].label }}
                          </div>
                        </span>
                        <div class="slider-track">
                          <div *ngFor="let pos of sliderRange"
                               class="slider-block"
                               [class.s-light]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'light'"
                               [class.s-active]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'active'"
                               [class.s-none]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'none'"
                               [class.s-hatched]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'hatched'"
                               (mouseenter)="hoveredSeg = 'g' + gi + '-' + pos"
                               (mouseleave)="hoveredSeg = null"
                               (click)="setLevelByGroup(gi, pos)">
                            <div class="seg-tooltip" *ngIf="hoveredSeg === 'g' + gi + '-' + pos">
                              {{ permLevels[pos].label }}
                            </div>
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
                          <span class="row-empty-slot">
                            <fvdr-icon *ngIf="getLevel(selectedDocId, gi) === 0" name="cancel" class="row-empty-icon" />
                          </span>
                          <div class="slider-track slider-track--ro">
                            <div *ngFor="let pos of sliderRange"
                                 class="slider-block"
                                 [class.s-light]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'light'"
                                 [class.s-active]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'active'"
                                 [class.s-none]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'none'"
                                 [class.s-hatched]="segClass(getLevel(selectedDocId, gi), pos, selectedDocItem.restricted) === 'hatched'">
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
                      <span class="file-icon-wrap">
                        <fvdr-file-icon [type]="fileType(item.type)" />
                        <ng-container *ngTemplateOutlet="pubBadge; context: { $implicit: item }"></ng-container>
                      </span>
                      <span class="item-idx">{{ item.index }}</span>
                      <span class="pt-entity-name pt-entity-name--tight">{{ item.name }}</span>
                      <div class="entity-more-wrap">
                        <button class="entity-more"
                                [class.entity-more--open]="publishMenuFor === item.id"
                                (click)="togglePublishMenu(item.id, $event)">
                          <fvdr-icon name="more" />
                        </button>
                        <div class="publish-menu" *ngIf="publishMenuFor === item.id" (click)="$event.stopPropagation()">
                          <ng-container *ngTemplateOutlet="publishMenuTpl; context: { $implicit: item }"></ng-container>
                        </div>
                      </div>
                    </div>
                    <div class="pt-perm-cell">
                      <span class="row-empty-slot row-empty-slot--clickable"
                            (mouseenter)="hoveredSeg = 'd' + item.id + '-0'"
                            (mouseleave)="hoveredSeg = null"
                            (click)="setLevelByDoc(item.id, 0)">
                        <fvdr-icon *ngIf="getLevel(item.id, selectedGroupIdx) === 0" name="cancel" class="row-empty-icon" />
                        <div class="seg-tooltip" *ngIf="hoveredSeg === 'd' + item.id + '-0'">
                          {{ permLevels[0].label }}
                        </div>
                      </span>
                      <div class="slider-track">
                        <div *ngFor="let pos of sliderRange"
                             class="slider-block"
                             [class.s-light]="segClass(getLevel(item.id, selectedGroupIdx), pos, item.restricted) === 'light'"
                             [class.s-active]="segClass(getLevel(item.id, selectedGroupIdx), pos, item.restricted) === 'active'"
                             [class.s-none]="segClass(getLevel(item.id, selectedGroupIdx), pos, item.restricted) === 'none'"
                             [class.s-hatched]="segClass(getLevel(item.id, selectedGroupIdx), pos, item.restricted) === 'hatched'"
                             (mouseenter)="hoveredSeg = 'd' + item.id + '-' + pos"
                             (mouseleave)="hoveredSeg = null"
                             (click)="setLevelByDoc(item.id, pos)">
                          <div class="seg-tooltip" *ngIf="hoveredSeg === 'd' + item.id + '-' + pos">
                            {{ permLevels[pos].label }}
                          </div>
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

    <!-- Publishing status — tiny corner badge on the file/folder icon, expands to a labeled
         pill on hover and collapses back when the hover ends (visual unchanged). Clicking the
         badge itself directly requests the toggle, same as the publish icon in v1 — the full
         context menu (with the rest of the row actions) lives behind the "···" trigger instead. -->
    <ng-template #pubBadge let-item>
      <span class="pub-badge" [class.pub-badge--published]="item.published"
            (click)="$event.stopPropagation(); requestPublishToggle(item)">
        <fvdr-icon [name]="item.published ? 'check' : 'close'" />
        <span>{{ item.published ? 'Published' : 'Unpublished' }}</span>
      </span>
    </ng-template>

    <!-- Publishing context menu — shared between every pubBadge instance -->
    <ng-template #publishMenuTpl let-item>
      <button class="publish-menu-item" (click)="closePublishMenu()">
        <fvdr-icon name="link" />
        <span>Open in new browser tab</span>
      </button>
      <button class="publish-menu-item" (click)="closePublishMenu()">
        <fvdr-icon name="history" />
        <span>View activity log</span>
      </button>
      <button class="publish-menu-item" (click)="closePublishMenu()">
        <fvdr-icon name="overview" />
        <span>View document overview</span>
      </button>
      <button class="publish-menu-item" (click)="closePublishMenu()">
        <fvdr-icon name="settings" />
        <span>View engagement matrix</span>
      </button>
      <button class="publish-menu-item" (click)="closePublishMenu()">
        <fvdr-icon name="reports" />
        <span>View permission log</span>
      </button>
      <div class="publish-menu-divider"></div>
      <button class="publish-menu-item" (click)="requestPublishToggle(item)">
        <fvdr-icon [name]="item.published ? 'close' : 'check'" />
        <span>{{ item.published ? 'Unpublish' : 'Publish' }}</span>
      </button>
    </ng-template>

    <!-- Save bar -->
    <div class="save-bar" [class.save-bar--visible]="hasUnsavedChanges">
      <fvdr-btn variant="secondary" label="Cancel" (clicked)="cancel()" />
      <fvdr-btn variant="primary"   label="Save"   (clicked)="save()"   />
    </div>

    <fvdr-toast-host></fvdr-toast-host>

    <!-- Publish / Unpublish confirmation -->
    <fvdr-modal
      [visible]="!!publishConfirmItem"
      [title]="publishConfirmItem?.published ? 'Unpublish file' : 'Publish file'"
      cancelLabel="Cancel"
      [confirmLabel]="publishConfirmItem?.published ? 'Unpublish' : 'Publish'"
      confirmVariant="primary"
      size="s"
      (confirmed)="confirmPublishToggle()"
      (cancelled)="cancelPublishConfirm()"
      (closed)="cancelPublishConfirm()">
      <div class="publish-confirm-body" *ngIf="publishConfirmItem as pItem">
        <p class="publish-confirm-text">
          {{ pItem.published
              ? 'Once unpublished, documents will no longer be visible to project participants.'
              : 'Once published, documents will become visible to project participants according to their permissions.' }}
        </p>
        <p class="publish-confirm-text">
          {{ pItem.published ? 'Unpublish' : 'Publish' }} <strong>{{ pItem.name }}</strong>?
        </p>
        <fvdr-checkbox [(ngModel)]="publishConfirmDontShow" label="Don't show again" />
      </div>
    </fvdr-modal>

    <!-- First-use coach mark -->
    <div class="coach-overlay" *ngIf="coachStep" (click)="finishCoachmark()">
      <div class="coach-highlight"
           *ngIf="coachRect"
           [style.top.px]="coachRect.top - 6"
           [style.left.px]="coachRect.left - 6"
           [style.width.px]="coachRect.width + 12"
           [style.height.px]="coachRect.height + 12"
           (click)="$event.stopPropagation()">
      </div>
      <div class="coach-card"
           *ngIf="coachRect"
           [style.top.px]="coachCardTop()"
           [style.left.px]="coachCardLeft()"
           (click)="$event.stopPropagation()">
        <div class="coach-card-step">Step {{ coachStep }} of 2</div>
        <h4>{{ coachStep === 1 ? 'These icons are permission levels' : 'The colored bar shows current access' }}</h4>
        <p>{{ coachStep === 1
            ? 'From Fence (least access) to Manage (most). Hover any column icon to see what it allows.'
            : 'Light green = included, dark green = the exact level this group has, grey = not granted, and a striped block means that level isn’t offered for this file type. Hover any segment for details.' }}</p>
        <div class="coach-card-actions">
          <button class="coach-skip" data-track="coachmark-skip" (click)="finishCoachmark()">Skip</button>
          <button class="coach-next" data-track="coachmark-next" (click)="nextCoachStep()">
            {{ coachStep === 2 ? 'Got it' : 'Next' }}
          </button>
        </div>
      </div>
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
      transition: border-color 0.12s, background 0.12s;
    }
    .tool-btn fvdr-icon { font-size: 16px; color: var(--color-text-secondary); }
    .tool-btn:hover { border-color: var(--color-primary-500); }
    .tool-btn--active {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }
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

    /* ── Legend ── */
    .legend-wrap { position: relative; margin-left: auto; }
    .legend-panel {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      width: 340px;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(31, 33, 41, 0.16);
      padding: var(--space-4);
      z-index: 300;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .legend-panel-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-divider);
    }
    .legend-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
    }
    .legend-row fvdr-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; margin-top: 1px; }
    .legend-icon-gap { width: 16px; flex-shrink: 0; }
    .legend-swatch {
      width: 20px; height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 2px;
      border: 1px solid var(--color-stone-500);
    }
    .legend-swatch--none { background: var(--color-stone-300); }
    .legend-swatch--hatched {
      background: repeating-linear-gradient(
        45deg,
        var(--color-stone-500),
        var(--color-stone-500) 2px,
        var(--color-stone-200) 2px,
        var(--color-stone-200) 5px
      );
    }
    .legend-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .legend-text strong { font-size: 13px; color: var(--color-text-primary); }
    .legend-text span { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }
    .legend-replay {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      align-self: flex-start;
      margin-top: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border: none;
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .legend-replay fvdr-icon { font-size: 15px; }
    .legend-replay:hover { background: var(--color-primary-50); filter: brightness(0.97); }

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

    /* Publishing status badge — a small dot pinned to the file/folder icon's
       corner that expands into a labeled pill on hover. */
    .file-icon-wrap {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
    }
    .pub-badge {
      position: absolute;
      left: 9px;
      bottom: -3px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      height: 14px;
      min-width: 14px;
      max-width: 14px;
      padding: 0;
      border-radius: 100px;
      border: 1.2px solid var(--color-stone-0);
      background: var(--color-stone-200);
      overflow: hidden;
      white-space: nowrap;
      cursor: pointer;
      transition: max-width 0.2s ease, padding 0.2s ease, gap 0.2s ease;
    }
    .pub-badge:hover {
      max-width: 100px;
      padding: 0 4px;
      gap: 4px;
    }
    /* Scoped under .file-icon-wrap so the row-level "fvdr-icon" sizing rules
       (e.g. .pt-entity-cell fvdr-icon) don't win on equal specificity. */
    .file-icon-wrap .pub-badge fvdr-icon {
      font-size: 8px;
      flex-shrink: 0;
      color: var(--color-text-secondary);
    }
    /* Collapsed, the label must take up no space at all — otherwise the
       centered flex row (icon + label) pushes the 8px glyph out of the 14px
       clipping box and the badge reads as an empty dot. */
    .file-icon-wrap .pub-badge span {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-secondary);
      max-width: 0;
      overflow: hidden;
      opacity: 0;
      transition: max-width 0.2s ease, opacity 0.15s ease 0.05s;
    }
    .file-icon-wrap .pub-badge:hover span { max-width: 100px; opacity: 1; }
    .pub-badge--published { background: var(--chip-bg-green, #eaf6ed); }
    .file-icon-wrap .pub-badge--published fvdr-icon,
    .file-icon-wrap .pub-badge--published span { color: var(--color-primary-500); }

    /* Publishing context menu — opened by clicking the badge above. Anchored to
       .file-icon-wrap (already position:relative), same technique as the badge itself. */
    .publish-menu {
      position: absolute;
      top: calc(100% + var(--space-1));
      left: 0;
      width: 260px;
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: 0 1px 4px rgba(52, 58, 64, 0.2);
      padding: var(--space-2) 0;
      z-index: 300;
      display: flex;
      flex-direction: column;
    }
    .publish-menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      height: 40px;
      padding: 0 var(--space-4);
      background: none;
      border: none;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--color-text-primary);
      text-align: left;
      white-space: nowrap;
    }
    .publish-menu-item:hover { background: var(--color-stone-200); }
    .publish-menu-item fvdr-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }
    .publish-menu-divider {
      height: 1px;
      background: var(--color-divider);
      margin: var(--space-1) 0;
    }

    /* Publish / Unpublish confirmation modal */
    .publish-confirm-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .publish-confirm-text {
      font-size: 16px;
      line-height: 24px;
      color: var(--color-text-primary);
    }

    /* "···" trigger — hidden until the row is hovered or its menu is open (tree items) */
    .tree-item-actions {
      position: relative;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: auto;
    }
    .tree-item-more {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      background: none;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.1s, background 0.1s;
    }
    .tree-item-more fvdr-icon { font-size: 16px; }
    .tree-item-more:hover { background: var(--color-stone-300); }
    .tree-item:hover .tree-item-more,
    .tree-item-more--open {
      opacity: 1;
      pointer-events: auto;
    }
    /* Narrow tree panel — the menu must grow left from the row's right edge, not right off the panel. */
    .tree-item-actions .publish-menu { left: auto; right: 0; }

    /* "···" trigger — same idea, for the "By documents" table rows */
    .pt-entity-name.pt-entity-name--tight { flex: 0 1 auto; }
    .entity-more-wrap { position: relative; flex-shrink: 0; }
    .entity-more {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: none;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.1s, background 0.1s;
    }
    .entity-more fvdr-icon { font-size: 16px; }
    .entity-more:hover { background: var(--color-stone-200); }
    .pt-row:hover .entity-more,
    .entity-more--open {
      opacity: 1;
      pointer-events: auto;
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
    .unsaved-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 16px;
      padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
      background: var(--chip-bg-yellow, #fff5e0);
      color: var(--primitive-yellow-900, #c88b00);
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
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
      width: 32px;
      flex-shrink: 0;
    }
    .perm-th {
      position: relative;
      width: 62px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: var(--space-1) 0;
      flex-shrink: 0;
      cursor: default;
    }
    .perm-th fvdr-icon { font-size: 16px; color: var(--color-text-primary); }
    .perm-th span {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* Header tooltip */
    .th-tooltip {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      background: var(--color-text-primary);
      color: var(--color-stone-0);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      z-index: 250;
      pointer-events: none;
      box-shadow: 0 6px 16px rgba(31, 33, 41, 0.22);
    }
    .th-tooltip strong { display: block; font-size: 12px; margin-bottom: 2px; }
    .th-tooltip p { font-size: 12px; line-height: 1.4; font-weight: 400; color: var(--color-stone-300); }

    /* Perm cell (slider) */
    .pt-perm-cell {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      padding: 0 var(--space-2);
    }
    .row-empty-slot {
      position: relative;
      width: 24px;
      height: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .row-empty-slot--clickable { cursor: pointer; }
    .row-empty-icon { font-size: 16px; color: var(--primitive-red-500, #e54430); }
    .slider-track {
      height: 16px;
      display: flex;
      border-radius: var(--radius-sm);
      overflow: visible;
    }
    .slider-track--ro { opacity: 0.55; pointer-events: none; }
    .slider-block {
      position: relative;
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
    .s-hatched {
      background: repeating-linear-gradient(
        45deg,
        var(--color-stone-500),
        var(--color-stone-500) 2px,
        var(--color-stone-200) 2px,
        var(--color-stone-200) 5px
      );
      cursor: not-allowed;
    }
    .s-hatched:hover { filter: none; }

    /* Segment tooltip — sits under the row, just the level name */
    .seg-tooltip {
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      background: var(--color-text-primary);
      color: var(--color-stone-0);
      border-radius: var(--radius-sm);
      padding: 3px var(--space-2);
      font-size: 12px;
      font-weight: 600;
      z-index: 250;
      pointer-events: none;
      box-shadow: 0 6px 16px rgba(31, 33, 41, 0.22);
    }

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

    /* ── Coach mark ── */
    .coach-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      cursor: pointer;
    }
    .coach-highlight {
      position: fixed;
      border-radius: var(--radius-md);
      border: 2px solid var(--color-primary-500);
      box-shadow: 0 0 0 9999px rgba(15, 23, 20, 0.55);
      pointer-events: none;
      transition: top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease;
    }
    .coach-card {
      position: fixed;
      width: 300px;
      background: var(--color-stone-0);
      border-radius: var(--radius-md);
      box-shadow: 0 12px 32px rgba(31, 33, 41, 0.28);
      padding: var(--space-4);
      cursor: default;
    }
    .coach-card-step {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-primary-500);
      margin-bottom: var(--space-1);
    }
    .coach-card h4 { font-size: 14px; color: var(--color-text-primary); margin-bottom: var(--space-2); }
    .coach-card p { font-size: 13px; line-height: 1.5; color: var(--color-text-secondary); margin-bottom: var(--space-3); }
    .coach-card-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3); }
    .coach-skip {
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family); font-size: 13px;
      color: var(--color-text-secondary); padding: var(--space-2) var(--space-2);
    }
    .coach-skip:hover { color: var(--color-text-primary); }
    .coach-next {
      background: var(--color-primary-500); border: none; cursor: pointer;
      color: #fff; font-family: var(--font-family); font-size: 13px; font-weight: 600;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm);
    }
    .coach-next:hover { background: var(--color-primary-600); }
  `],
})
export class PermissionsLegendV2Component implements OnInit, AfterViewInit, OnDestroy {
  private tracker = inject(TrackerService);
  private hostEl = inject(ElementRef<HTMLElement>);
  private toast = inject(ToastService);

  sidebarCollapsed = true;
  searchQuery = '';
  selectedDocId = 1;
  selectedGroupIdx = 2; // Yellow Co. selected by default in "By documents" mode
  viewMode: 'by-groups' | 'by-documents' = 'by-documents';
  pendingPerms: Record<number, number[]> = {};
  private expandedGroupIds = new Set<number>();

  // Legend + tooltips
  legendOpen = false;
  hoveredCol: number | null = null;
  hoveredSeg: string | null = null;

  // Publishing context menu
  publishMenuFor: number | null = null;
  publishConfirmItem: TreeItem | null = null;
  publishConfirmDontShow = false;

  // Coach mark
  coachStep = 0; // 0 = hidden, 1 | 2 = active step
  coachRect: { top: number; left: number; width: number; height: number } | null = null;

  readonly navItems: SidebarNavItem[] = [
    { id: 'documents',   label: 'Documents',   icon: 'documents',       iconActive: 'documents-active'       },
    { id: 'users',       label: 'Users',        icon: 'users-groups',    iconActive: 'users-groups-active'    },
    { id: 'permissions', label: 'Permissions',  icon: 'nav-permissions', iconActive: 'nav-permissions-active', active: true },
    { id: 'settings',    label: 'Settings',     icon: 'nav-settings',    iconActive: 'nav-settings-active'    },
    { id: 'activity',    label: 'Activity',     icon: 'activities',      iconActive: 'activities-active'      },
  ];

  readonly treeItems: TreeItem[] = [
    { id: 1, index: '1',   name: 'Stage folder',                        type: 'folder', perms: [6,6,5,4,3,6], published: true },
    { id: 2, index: '2',   name: 'Organizational chart and manage',     type: 'folder', perms: [7,7,6,5,4,5], published: true },
    { id: 3, index: '3.1', name: 'Corporate DD — Product and Services', type: 'folder', perms: [5,6,4,2,3,5] },
    { id: 4, index: '4',   name: 'Financial DD — Accounts Receivables', type: 'folder', perms: [6,6,5,3,4,6], published: true },
    { id: 5, index: '5',   name: 'Key contacts by function',            type: 'xlsx',   perms: [4,5,3,1,2,4], published: true },
    { id: 6, index: '6',   name: 'Tax accounting.xlsx',                 type: 'xlsx',   perms: [5,5,4,2,3,5], published: true },
    { id: 7, index: '7',   name: 'Tax returns.pdf',                     type: 'pdf',    perms: [3,4,3,1,0,3] },
    { id: 8, index: '8',   name: 'Registration with tax authorities',   type: 'doc',    perms: [6,7,5,4,3,6] },
    { id: 9, index: '9',   name: 'Site walkthrough recording.mp4',      type: 'video',  perms: [0,2,7,5,0,7], restricted: [1,3,4,6] },
  ];

  readonly groups = GROUPS;
  readonly permCols = PERM_COLS;
  readonly permLevels = PERM_LEVELS;
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
      folder: 'folder', xlsx: 'xls', pdf: 'pdf', doc: 'doc', video: 'video',
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

  /** Same as sliderCls, but a restricted level always renders as a hatched "not available" block. */
  segClass(level: number, pos: number, restricted: number[] = []): 'light' | 'active' | 'none' | 'hatched' {
    if (restricted.includes(pos)) return 'hatched';
    return this.sliderCls(level, pos);
  }

  /** Approximate swatch color for the legend rows (mirrors the "active"/granted segment color). */
  swatchColor(): string {
    return 'var(--color-primary-500)';
  }

  /** "By groups" mode: set level for a group on the selected document */
  setLevelByGroup(groupIdx: number, newLevel: number): void {
    const docId = this.selectedDocId;
    if (this.selectedDocItem.restricted?.includes(newLevel)) return;
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
    const item = this.treeItems.find(t => t.id === docId)!;
    if (item.restricted?.includes(newLevel)) return;
    if (!this.pendingPerms[docId]) {
      this.pendingPerms = {
        ...this.pendingPerms,
        [docId]: item.perms.slice(),
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

  // ── Legend ────────────────────────────────────────────────

  toggleLegend(): void {
    this.legendOpen = !this.legendOpen;
  }

  // ── Publishing context menu ─────────────────────────────────

  togglePublishMenu(docId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.publishMenuFor = this.publishMenuFor === docId ? null : docId;
  }

  closePublishMenu(): void {
    this.publishMenuFor = null;
  }

  setPublished(item: TreeItem, published: boolean): void {
    item.published = published;
    this.closePublishMenu();
    this.toast.show({
      variant: 'success',
      message: published ? `“${item.name}” published` : `“${item.name}” unpublished`,
    });
  }

  /** Menu "Publish"/"Unpublish" click — confirm first, unless the user opted out. */
  requestPublishToggle(item: TreeItem): void {
    this.closePublishMenu();
    if (localStorage.getItem(PUBLISH_CONFIRM_SKIP_KEY)) {
      this.setPublished(item, !item.published);
      return;
    }
    this.publishConfirmDontShow = false;
    this.publishConfirmItem = item;
  }

  confirmPublishToggle(): void {
    const item = this.publishConfirmItem;
    if (!item) return;
    if (this.publishConfirmDontShow) {
      localStorage.setItem(PUBLISH_CONFIRM_SKIP_KEY, '1');
    }
    this.setPublished(item, !item.published);
    this.publishConfirmItem = null;
  }

  cancelPublishConfirm(): void {
    this.publishConfirmItem = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.publishMenuFor !== null) this.closePublishMenu();
  }

  // ── Coach mark ────────────────────────────────────────────

  private startCoachmark(): void {
    this.coachStep = 1;
    this.updateCoachRect();
  }

  nextCoachStep(): void {
    if (this.coachStep === 1) {
      this.coachStep = 2;
      this.updateCoachRect();
    } else {
      this.finishCoachmark();
    }
  }

  finishCoachmark(): void {
    this.coachStep = 0;
    this.coachRect = null;
    localStorage.setItem(COACH_KEY, '1');
  }

  replayCoachmark(): void {
    this.legendOpen = false;
    this.coachStep = 1;
    setTimeout(() => this.updateCoachRect(), 50);
  }

  private updateCoachRect(): void {
    const selector = this.coachStep === 1 ? '.pt-perm-hdr' : '.pt-rows .slider-track';
    const el = this.hostEl.nativeElement.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.coachRect = { top: r.top, left: r.left, width: r.width, height: r.height };
  }

  coachCardTop(): number {
    if (!this.coachRect) return 0;
    return this.coachRect.top + this.coachRect.height + 20;
  }

  coachCardLeft(): number {
    if (!this.coachRect) return 0;
    const left = this.coachRect.left;
    const maxLeft = window.innerWidth - 300 - 24;
    return Math.min(left, Math.max(24, maxLeft));
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.coachStep) this.updateCoachRect();
  }

  ngOnInit(): void {
    this.tracker.trackPageView(SLUG);
  }

  ngAfterViewInit(): void {
    if (!localStorage.getItem(COACH_KEY)) {
      setTimeout(() => this.startCoachmark(), 500);
    }
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }
}
