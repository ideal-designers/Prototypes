import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  SidebarNavItem,
  FvdrFileType,
  FvdrIconName,
  ToastService,
  SegmentItem,
  TabItem,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permissions-draft-v2';

/**
 * Permissions — Draft & bulk save, Version 2.
 *
 * Same draft model as Version 1, but the right panel opens by itself on the first
 * edit and works like an AI assistant's activity log: every change is recorded as
 * it happens ("not saved yet"), cascades and reverts show up as steps, and the
 * panel adds hints when an edit deserves a second look. Save / Discard live in the
 * panel footer.
 *
 * Today an admin edits one document (or one group), has to Save, and only then
 * moves on. Here every edit lands in a draft that survives switching documents,
 * groups and view modes. Changed cells are highlighted against their saved value,
 * the Changes panel lists everything in the draft (and the history of past saves),
 * and a single review step saves the whole batch.
 */

interface TreeItem {
  id: number;
  index: string;
  name: string;
  type: 'folder' | 'xlsx' | 'pdf' | 'doc' | 'video';
  perms: number[];       // saved levels, index = group id (0–5), value = level 0–7
  restricted?: number[]; // levels (1–7) not offered for this file type
  published?: boolean;
  parentId?: number;     // folder this item sits in (top level when absent)
}

interface GroupUser { id: number; name: string; initials: string; }

interface Group {
  id: number;
  name: string;
  color: string | null;
  users: GroupUser[];
}

interface PermLevelInfo {
  level: number;
  label: string;
  icon: FvdrIconName;
  description: string;
}

/** One pending edit: a single document × group cell. */
interface Change {
  docId: number;
  groupId: number;
  from: number;  // saved level
  to: number;    // draft level
  at: Date;
  via?: number;  // folder id when the change cascaded down from a folder edit
}

/** A saved batch, as it appears in the History tab. */
interface SavedBatch {
  id: number;
  at: Date;
  author: string;
  initials: string;
  note: string;
  changes: Change[];
}

/** Undo step — one user action may touch several cells (e.g. reverting a whole batch). */
type UndoStep = { key: string; prev: Change | undefined }[];

type ViewMode = 'by-groups' | 'by-documents';
type ChangesGrouping = 'doc' | 'group';
type PanelTab = 'activity' | 'draft' | 'history';

type LogKind = 'session' | 'edit' | 'cascade' | 'hint' | 'revert' | 'undo' | 'saved' | 'discarded';

/** One line in the Activity log. */
interface LogEntry {
  id: number;
  at: Date;
  kind: LogKind;
  docId?: number;
  groupId?: number;
  from?: number;
  to?: number;
  count?: number;
  items?: { docId: number; to: number; wanted: number }[]; // cascade: what each item inside got
  tone?: 'warning' | 'info' | 'tip';
  title?: string;
  text?: string;
  action?: { label: string; run: () => void };
  actionDone?: boolean;
  pending?: boolean;  // short "recording…" state right after the edit
  open?: boolean;     // cascade list expanded
  closed?: boolean;   // the draft this entry belonged to was saved or discarded
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

const PERM_LEVELS: PermLevelInfo[] = [
  { level: 0, label: 'No access', icon: 'cancel',
    description: 'The group doesn’t see this file or folder at all.' },
  { level: 1, label: 'Fence', icon: 'perm-fence',
    description: 'Views only the area around the cursor in-browser — the rest is masked.' },
  { level: 2, label: 'View', icon: 'perm-view',
    description: 'Views the file in-browser with a watermark. Includes everything from Fence.' },
  { level: 3, label: 'Encrypted', icon: 'perm-encrypted',
    description: 'Downloads an encrypted, password-protected copy.' },
  { level: 4, label: 'PDF', icon: 'perm-pdf',
    description: 'Downloads and prints a watermarked PDF copy.' },
  { level: 5, label: 'Original', icon: 'perm-original',
    description: 'Downloads the original file format. This download can’t be revoked afterwards.' },
  { level: 6, label: 'Upload', icon: 'perm-upload',
    description: 'Adds new documents to this folder, plus everything below.' },
  { level: 7, label: 'Manage', icon: 'perm-manage',
    description: 'Deletes, moves, copies, renames, redacts and labels — full control.' },
];

/** Levels from which a download of the original file becomes possible. */
const ORIGINAL_LEVEL = 5;

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

function minutesAgo(m: number): Date { return new Date(Date.now() - m * 60_000); }

@Component({
  selector: 'fvdr-permissions-draft-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Nova Z"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavItem($event)"
      />

      <div class="main">

        <!-- Header -->
        <header class="top-bar">
          <fvdr-breadcrumbs [items]="breadcrumbs" />
          <div class="hdr-actions">
            <button class="ic-btn" fvdrTooltip="Help" tooltipPosition="bottom" aria-label="Help">
              <fvdr-icon name="help" />
            </button>
            <fvdr-avatar initials="JD" size="md" />
          </div>
        </header>

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

            <div class="toolbar-right">
              <button class="tool-btn"
                      [class.tool-btn--active]="panelOpen"
                      data-track="toggle-changes-panel"
                      (click)="togglePanel()">
                <fvdr-icon name="history" />
                Changes
                <fvdr-counter *ngIf="changeCount" [value]="changeCount" variant="warning" />
              </button>
            </div>
          </div>

          <div class="panels" [class.panels--with-drawer]="panelOpen">

            <!-- ── LEFT PANEL ───────────────────────────────── -->
            <div class="tree-panel">
              <div class="tree-hdr">
                <span class="tree-hdr-title">{{ viewMode === 'by-groups' ? 'Documents' : 'Groups' }}</span>
                <button class="tool-link tool-link--sm" data-track="toggle-view-mode" (click)="toggleViewMode()">
                  <fvdr-icon [name]="viewMode === 'by-groups' ? 'users-groups' : 'documents'" />
                  {{ viewMode === 'by-groups' ? 'By groups' : 'By documents' }}
                </button>
              </div>

              <div class="search-wrap" *ngIf="viewMode === 'by-groups'">
                <fvdr-search [(ngModel)]="searchQuery" placeholder="Search" />
              </div>

              <button class="changed-filter"
                      *ngIf="changeCount"
                      [class.changed-filter--on]="changedOnly"
                      data-track="changed-only-filter"
                      (click)="changedOnly = !changedOnly">
                <span class="changed-filter-dot"></span>
                {{ changedOnly ? 'Showing changed only' : 'Show changed only' }}
                <span class="changed-filter-count">{{ viewMode === 'by-groups' ? changedDocIds.length : changedGroupIds.length }}</span>
                <fvdr-icon *ngIf="changedOnly" name="close" />
              </button>

              <!-- By groups: documents tree -->
              <div class="tree-list" *ngIf="viewMode === 'by-groups'">
                <div *ngFor="let item of leftDocs"
                     class="tree-item"
                     [class.tree-item--selected]="item.id === selectedDocId"
                     [class.tree-item--changed]="subtreeChangeCount(item.id) > 0"
                     [style.padding-left]="indent(item)"
                     (click)="selectedDocId = item.id">
                  <ng-container *ngTemplateOutlet="folderToggle; context: { $implicit: item }"></ng-container>
                  <ng-container *ngTemplateOutlet="fileChip; context: { $implicit: item }"></ng-container>
                  <span class="item-idx">{{ item.index }}</span>
                  <span class="item-name" [innerHTML]="highlight(item.name)"></span>
                  <span *ngIf="docChangeCount(item.id) as n"
                        class="change-pill"
                        [fvdrTooltip]="n + ' unsaved ' + (n === 1 ? 'change' : 'changes')"
                        tooltipPosition="right">{{ n }}</span>
                  <span *ngIf="!docChangeCount(item.id) && subtreeChangeCount(item.id)"
                        class="change-dot"
                        fvdrTooltip="Items inside have unsaved changes" tooltipPosition="right"></span>
                </div>
                <div class="tree-empty" *ngIf="!leftDocs.length">No matches found</div>
              </div>

              <!-- By documents: groups list -->
              <div class="tree-list" *ngIf="viewMode === 'by-documents'">
                <ng-container *ngFor="let g of leftGroups">
                  <div class="tree-item group-item"
                       [class.tree-item--selected]="selectedGroupId === g.id"
                       [class.tree-item--changed]="groupChangeCount(g.id) > 0"
                       (click)="selectedGroupId = g.id">
                    <button *ngIf="g.users.length"
                            class="expand-btn"
                            [attr.aria-label]="isGroupExpanded(g.id) ? 'Collapse group' : 'Expand group'"
                            (click)="$event.stopPropagation(); toggleGroupExpand(g.id)">
                      <fvdr-icon name="chevron-right" [class.chevron-open]="isGroupExpanded(g.id)" />
                    </button>
                    <span *ngIf="!g.users.length" class="expand-gap"></span>
                    <fvdr-icon name="participants" [style.color]="g.color ?? 'var(--color-text-secondary)'" />
                    <span class="item-name">{{ g.name }}</span>
                    <span *ngIf="groupChangeCount(g.id) as n"
                          class="change-pill"
                          [fvdrTooltip]="n + ' unsaved ' + (n === 1 ? 'change' : 'changes')"
                          tooltipPosition="right">{{ n }}</span>
                  </div>
                  <ng-container *ngIf="isGroupExpanded(g.id)">
                    <div *ngFor="let u of g.users" class="tree-item tree-item--user"
                         [class.tree-item--selected]="selectedGroupId === g.id">
                      <fvdr-avatar [initials]="u.initials" size="sm" [color]="g.color ?? '#9C9EA8'" textColor="#fff" />
                      <span class="item-name">{{ u.name }}</span>
                    </div>
                  </ng-container>
                </ng-container>
              </div>
            </div>

            <!-- ── PERMISSION TABLE ─────────────────────────── -->
            <div class="perm-table">
              <div class="pt-header">
                <div class="pt-expand-cell"></div>
                <div class="pt-entity-cell pt-entity-hdr">
                  <ng-container *ngIf="viewMode === 'by-groups'">
                    Groups
                    <span class="pt-context">for <strong>{{ selectedDoc.index }} {{ selectedDoc.name }}</strong></span>
                  </ng-container>
                  <ng-container *ngIf="viewMode === 'by-documents'">
                    Documents
                    <span class="pt-context">for <strong>{{ selectedGroup.name }}</strong></span>
                  </ng-container>
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

              <div class="pt-rows">

                <!-- By groups: one row per group, for the selected document -->
                <ng-container *ngIf="viewMode === 'by-groups'">
                  <ng-container *ngFor="let g of groups">
                    <ng-container *ngTemplateOutlet="permRow; context: {
                      docId: selectedDocId, groupId: g.id, item: selectedDoc, group: g, kind: 'group'
                    }"></ng-container>
                    <ng-container *ngIf="isGroupExpanded(g.id)">
                      <div *ngFor="let u of g.users" class="pt-row pt-row--user">
                        <div class="pt-expand-cell"></div>
                        <div class="pt-entity-cell pt-entity-cell--user">
                          <fvdr-avatar [initials]="u.initials" size="sm" [color]="g.color ?? '#9C9EA8'" textColor="#fff" />
                          <span class="pt-entity-name">{{ u.name }}</span>
                        </div>
                        <div class="pt-perm-cell">
                          <span class="row-empty-slot">
                            <fvdr-icon *ngIf="level(selectedDocId, g.id) === 0" name="cancel" class="row-empty-icon" />
                          </span>
                          <div class="slider-track slider-track--ro">
                            <div *ngFor="let pos of sliderRange" class="slider-block"
                                 [ngClass]="'s-' + segClass(level(selectedDocId, g.id), pos, selectedDoc.restricted)"></div>
                          </div>
                        </div>
                      </div>
                    </ng-container>
                  </ng-container>
                </ng-container>

                <!-- By documents: one row per document, for the selected group -->
                <ng-container *ngIf="viewMode === 'by-documents'">
                  <ng-container *ngFor="let item of visibleDocs">
                    <ng-container *ngTemplateOutlet="permRow; context: {
                      docId: item.id, groupId: selectedGroupId, item: item, group: selectedGroup, kind: 'doc'
                    }"></ng-container>
                  </ng-container>
                </ng-container>

              </div>
            </div>

            <!-- ── CHANGES / HISTORY DRAWER ─────────────────── -->
            <aside class="drawer" *ngIf="panelOpen">
              <div class="drawer-hdr">
                <fvdr-tabs [tabs]="panelTabs" [activeId]="panelTab" size="s"
                           (activeIdChange)="panelTab = $any($event)" />
                <button class="ic-btn" fvdrTooltip="Close panel" tooltipPosition="left"
                        aria-label="Close panel" (click)="panelOpen = false">
                  <fvdr-icon name="close" />
                </button>
              </div>

              <!-- Activity log -->
              <ng-container *ngIf="panelTab === 'activity'">
                <div class="session-hdr">
                  <span class="session-dot" [class.session-dot--live]="changeCount"></span>
                  <div class="session-meta">
                    <strong>{{ changeCount ? 'Draft · not saved yet' : 'No unsaved changes' }}</strong>
                    <span>{{ changeCount ? sessionSubline : 'Every edit is recorded here before it’s saved' }}</span>
                  </div>
                </div>

                <div class="feed" #feed>
                  <div class="feed-empty" *ngIf="!log.length">
                    <span class="fe-icon fe-icon--tip"><fvdr-icon name="sparkle" /></span>
                    <p>Change permissions on as many documents and groups as you need. I’ll keep a log of what changed and point out anything worth a second look. Nothing is saved until you click <strong>Save</strong>.</p>
                  </div>

                  <ng-container *ngFor="let e of log; trackBy: trackLog">
                    <!-- divider: a new draft started -->
                    <div class="fe-divider" *ngIf="e.kind === 'session'">
                      <span>Draft started · {{ e.at | date:'HH:mm' }}</span>
                    </div>

                    <div class="fe" *ngIf="e.kind !== 'session'"
                         [ngClass]="'fe--' + e.kind + (e.tone ? ' fe--' + e.tone : '')"
                         [class.fe--stale]="isStale(e)">
                      <span class="fe-icon" [ngClass]="'fe-icon--' + (e.tone ?? e.kind)">
                        <fvdr-icon [name]="e.pending ? 'spinner' : logIcon(e)" [class.spin]="e.pending" />
                      </span>

                      <div class="fe-body">
                        <!-- edit -->
                        <ng-container *ngIf="e.kind === 'edit'">
                          <div class="fe-line">
                            <span class="fe-text">
                              <button class="fe-link" (click)="jumpToEntry(e)">{{ group(e.groupId!).name }}</button>
                              on
                              <button class="fe-link" (click)="jumpToEntry(e)">{{ doc(e.docId!).index }} {{ doc(e.docId!).name }}</button>
                            </span>
                          </div>
                          <div class="cl-delta">
                            <span class="lvl lvl--from"><fvdr-icon [name]="permLevels[e.from!].icon" />{{ permLevels[e.from!].label }}</span>
                            <fvdr-icon name="chevron-right" class="cl-arrow" />
                            <span class="lvl" [class.lvl--up]="e.to! > e.from!" [class.lvl--down]="e.to! < e.from!">
                              <fvdr-icon [name]="permLevels[e.to!].icon" />{{ permLevels[e.to!].label }}
                            </span>
                            <span class="fe-state" *ngIf="e.pending">Recording…</span>
                            <span class="fe-state fe-state--draft" *ngIf="!e.pending && !e.closed && !isStale(e)">Not saved</span>
                            <span class="fe-state" *ngIf="isStale(e)">{{ staleLabel(e) }}</span>
                          </div>
                        </ng-container>

                        <!-- cascade -->
                        <ng-container *ngIf="e.kind === 'cascade'">
                          <button class="fe-toggle" (click)="e.open = !e.open">
                            Also applied to {{ e.count }} {{ e.count === 1 ? 'item' : 'items' }} inside the folder
                            <fvdr-icon name="chevron-right" [class.chevron-open]="e.open" />
                          </button>
                          <div class="cl-children" *ngIf="e.open">
                            <div class="cl-child" *ngFor="let it of e.items">
                              <fvdr-file-icon [type]="fileType(doc(it.docId).type)" />
                              <span class="cl-name">{{ doc(it.docId).index }} {{ doc(it.docId).name }}</span>
                              <span class="lvl">{{ permLevels[it.to].label }}</span>
                            </div>
                          </div>
                        </ng-container>

                        <!-- hint -->
                        <ng-container *ngIf="e.kind === 'hint'">
                          <div class="fe-card">
                            <strong>{{ e.title }}</strong>
                            <p>{{ e.text }}</p>
                            <button *ngIf="e.action && !e.actionDone && !e.closed" class="fe-action"
                                    data-track="hint-action" (click)="runAction(e)">{{ e.action.label }}</button>
                            <span *ngIf="e.actionDone" class="fe-done"><fvdr-icon name="check" /> Done</span>
                          </div>
                        </ng-container>

                        <!-- system lines -->
                        <span class="fe-text" *ngIf="e.kind === 'revert' || e.kind === 'undo' || e.kind === 'saved' || e.kind === 'discarded'">
                          {{ e.text }}
                          <button *ngIf="e.kind === 'saved'" class="fe-link" (click)="panelTab = 'history'">View in History</button>
                        </span>
                      </div>

                      <div class="fe-side">
                        <span class="fe-time">{{ e.at | date:'HH:mm' }}</span>
                        <button *ngIf="e.kind === 'edit' && !e.closed && !e.pending && !isStale(e)"
                                class="row-revert" fvdrTooltip="Revert this change" tooltipPosition="left"
                                aria-label="Revert this change" (click)="revertEntry(e)">
                          <fvdr-icon name="undo" />
                        </button>
                      </div>
                    </div>
                  </ng-container>

                  <div class="feed-live" *ngIf="changeCount">
                    <span class="typing"><i></i><i></i><i></i></span>
                    Keep editing — I’ll log every change
                  </div>
                </div>
              </ng-container>

              <!-- Summary: the same grouped list as Version 1 -->
              <ng-container *ngIf="panelTab === 'draft'">
                <div class="drawer-empty" *ngIf="!changeCount">
                  <fvdr-icon name="edit" />
                  <strong>No unsaved changes</strong>
                  <span>Change any permission — on as many documents and groups as you need. Everything stays in a draft until you save it.</span>
                </div>

                <ng-container *ngIf="changeCount">
                  <div class="drawer-sub">
                    <span class="drawer-summary">{{ draftSummary }}</span>
                    <fvdr-segment variant="table" size="sm" [items]="groupingItems" [activeId]="grouping"
                                  (activeIdChange)="grouping = $any($event)" />
                  </div>

                  <div class="drawer-list">
                    <div class="cg" *ngFor="let section of draftSections; trackBy: trackSection">
                      <div class="cg-hdr">
                        <ng-container *ngTemplateOutlet="sectionTitle; context: { $implicit: section }"></ng-container>
                        <button class="cg-revert" data-track="revert-section"
                                (click)="revertMany(section.changes)">Revert</button>
                      </div>
                      <ng-container *ngFor="let c of section.changes; trackBy: trackChange">
                        <ng-container *ngTemplateOutlet="changeLine; context: { $implicit: c, editable: true, list: changes }"></ng-container>
                      </ng-container>
                    </div>
                  </div>
                </ng-container>
              </ng-container>

              <!-- History of saved batches -->
              <div class="drawer-list" *ngIf="panelTab === 'history'">
                <div class="batch" *ngFor="let b of history" [class.batch--open]="openBatchId === b.id">
                  <button class="batch-hdr" (click)="openBatchId = openBatchId === b.id ? null : b.id">
                    <fvdr-avatar [initials]="b.initials" size="sm" />
                    <div class="batch-meta">
                      <span class="batch-title">
                        {{ topOf(b.changes).length }} {{ topOf(b.changes).length === 1 ? 'change' : 'changes' }}
                        · {{ docsIn(b.changes) }} {{ docsIn(b.changes) === 1 ? 'document' : 'documents' }}
                      </span>
                      <span class="batch-sub">{{ b.author }} · {{ when(b.at) }}</span>
                    </div>
                    <fvdr-icon name="chevron-down" class="batch-chevron" />
                  </button>
                  <div class="batch-note" *ngIf="b.note">“{{ b.note }}”</div>
                  <div class="batch-body" *ngIf="openBatchId === b.id">
                    <ng-container *ngFor="let c of topOf(b.changes); trackBy: trackChange">
                      <ng-container *ngTemplateOutlet="changeLine; context: { $implicit: c, editable: false, showDoc: true, list: b.changes }"></ng-container>
                    </ng-container>
                    <button class="batch-revert" data-track="revert-batch" (click)="revertBatch(b)">
                      <fvdr-icon name="undo" />
                      Revert these changes
                    </button>
                    <span class="batch-revert-hint">Puts the previous levels back into your draft — nothing is saved until you click Save.</span>
                  </div>
                </div>
              </div>
              <div class="drawer-foot" *ngIf="changeCount && panelTab !== 'history'">
                <div class="foot-sum">
                  <strong>{{ changeCount }} unsaved {{ changeCount === 1 ? 'change' : 'changes' }}</strong>
                  <span>{{ draftSummary }}</span>
                </div>
                <!-- Save first and left-aligned: the right corner is taken by the platform's floating buttons -->
                <div class="foot-actions">
                  <fvdr-btn variant="primary" [label]="'Save ' + changeCount + (changeCount === 1 ? ' change' : ' changes')"
                            dataTrack="open-save-review" (clicked)="openSaveReview()" />
                  <fvdr-btn variant="secondary" label="Discard" (clicked)="discardOpen = true" />
                  <fvdr-btn variant="ghost" [iconOnly]="true" iconName="undo"
                            ariaLabel="Undo last change (⌘Z)"
                            [disabled]="!undoStack.length"
                            (clicked)="undo()" />
                </div>
              </div>
            </aside>

          </div>
        </div>

        <!-- ── DRAFT BAR ─────────────────────────────────────── -->
        <div class="draft-bar" *ngIf="changeCount && !panelOpen">
          <div class="draft-actions">
            <fvdr-btn variant="ghost" [iconOnly]="true" iconName="undo"
                      ariaLabel="Undo last change (⌘Z)"
                      [disabled]="!undoStack.length"
                      (clicked)="undo()" />
            <fvdr-btn variant="secondary" label="Discard all" (clicked)="discardOpen = true" />
            <fvdr-btn variant="primary" [label]="'Save ' + changeCount + (changeCount === 1 ? ' change' : ' changes')"
                      dataTrack="open-save-review" (clicked)="openSaveReview()" />
          </div>
          <div class="draft-status">
            <span class="draft-mark"><fvdr-icon name="edit" /></span>
            <div class="draft-text">
              <strong>{{ changeCount }} unsaved {{ changeCount === 1 ? 'change' : 'changes' }}</strong>
              <span>{{ changedDocIds.length }} {{ changedDocIds.length === 1 ? 'document' : 'documents' }}
                · {{ changedGroupIds.length }} {{ changedGroupIds.length === 1 ? 'group' : 'groups' }}</span>
            </div>
            <button class="tool-link" data-track="review-changes" (click)="openPanel('activity')">Open activity</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Templates ═══════════════════════════════════════════ -->

    <!-- One editable permission row (works for both view modes) -->
    <ng-template #permRow let-docId="docId" let-groupId="groupId" let-item="item" let-group="group" let-kind="kind">
      <div class="pt-row"
           [class.pt-row--changed]="isChanged(docId, groupId)"
           [class.pt-row--inherited]="changeAt(docId, groupId)?.via != null"
           [class.pt-row--child-changed]="kind === 'doc' && !isChanged(docId, groupId) && !isFolderExpanded(docId) && innerChangeCount(docId, groupId) > 0"
           [class.pt-row--flash]="flashKey === key(docId, groupId)">
        <div class="pt-expand-cell">
          <button *ngIf="kind === 'group' && group.users.length"
                  class="expand-btn"
                  [attr.aria-label]="isGroupExpanded(group.id) ? 'Collapse group' : 'Expand group'"
                  (click)="toggleGroupExpand(group.id)">
            <fvdr-icon name="chevron-right" [class.chevron-open]="isGroupExpanded(group.id)" />
          </button>
        </div>

        <div class="pt-entity-cell">
          <ng-container *ngIf="kind === 'group'">
            <fvdr-icon name="participants" [style.color]="group.color ?? 'var(--color-text-secondary)'" />
            <span class="pt-entity-name">{{ group.name }}</span>
          </ng-container>
          <ng-container *ngIf="kind === 'doc'">
            <span class="indent" [style.width]="indent(item, 0)"></span>
            <ng-container *ngTemplateOutlet="folderToggle; context: { $implicit: item }"></ng-container>
            <ng-container *ngTemplateOutlet="fileChip; context: { $implicit: item }"></ng-container>
            <span class="item-idx">{{ item.index }}</span>
            <span class="pt-entity-name">{{ item.name }}</span>
            <span *ngIf="!isChanged(docId, groupId) && !isFolderExpanded(docId) && innerChangeCount(docId, groupId) as n"
                  class="inside-tag" (click)="toggleFolder(docId)">{{ n }} changed inside</span>
          </ng-container>

          <ng-container *ngIf="changeAt(docId, groupId) as c">
            <span class="was-tag"
                  [fvdrTooltip]="c.via != null
                    ? 'Changed together with folder ' + doc(c.via).index + ' ' + doc(c.via).name + ' · saved level: ' + permLevels[c.from].label
                    : 'Saved level: ' + permLevels[c.from].label">
              <fvdr-icon *ngIf="c.via != null" name="folder" class="was-via" />
              was <fvdr-icon [name]="permLevels[c.from].icon" /> {{ permLevels[c.from].label }}
            </span>
            <button class="row-revert" fvdrTooltip="Revert to saved" aria-label="Revert to saved"
                    data-track="revert-row" (click)="revert(c)">
              <fvdr-icon name="undo" />
            </button>
          </ng-container>
        </div>

        <div class="pt-perm-cell">
          <span class="row-empty-slot row-empty-slot--clickable"
                [class.row-empty-slot--was]="wasLevel(docId, groupId) === 0"
                (mouseenter)="hoveredSeg = key(docId, groupId) + '-0'"
                (mouseleave)="hoveredSeg = null"
                (click)="setLevel(docId, groupId, 0)">
            <fvdr-icon *ngIf="level(docId, groupId) === 0 || wasLevel(docId, groupId) === 0"
                       name="cancel" class="row-empty-icon" />
            <div class="seg-tooltip" *ngIf="hoveredSeg === key(docId, groupId) + '-0'">{{ permLevels[0].label }}</div>
          </span>
          <div class="slider-track">
            <div *ngFor="let pos of sliderRange"
                 class="slider-block"
                 [ngClass]="'s-' + segClass(level(docId, groupId), pos, item.restricted)"
                 [class.s-was]="wasLevel(docId, groupId) === pos"
                 (mouseenter)="hoveredSeg = key(docId, groupId) + '-' + pos"
                 (mouseleave)="hoveredSeg = null"
                 (click)="setLevel(docId, groupId, pos)">
              <div class="seg-tooltip" *ngIf="hoveredSeg === key(docId, groupId) + '-' + pos">
                {{ permLevels[pos].label }}<span *ngIf="wasLevel(docId, groupId) === pos"> · saved level</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Folder expand arrow (or an equal-width gap for files, so names stay aligned) -->
    <ng-template #folderToggle let-item>
      <button *ngIf="hasChildren(item.id); else toggleGap"
              class="expand-btn"
              [attr.aria-label]="isFolderExpanded(item.id) ? 'Collapse folder' : 'Expand folder'"
              data-track="toggle-folder"
              (click)="$event.stopPropagation(); toggleFolder(item.id)">
        <fvdr-icon name="chevron-right" [class.chevron-open]="isFolderExpanded(item.id)" />
      </button>
      <ng-template #toggleGap><span class="expand-gap"></span></ng-template>
    </ng-template>

    <!-- File icon chip (static here — publishing is out of scope for this prototype) -->
    <ng-template #fileChip let-item>
      <span class="file-chip" [class.file-chip--off]="!item.published">
        <fvdr-file-icon [type]="fileType(item.type)" />
        <fvdr-icon [name]="item.published ? 'check' : 'close'" />
      </span>
    </ng-template>

    <!-- Section header in the Changes list -->
    <ng-template #sectionTitle let-s>
      <ng-container *ngIf="s.doc as d">
        <fvdr-file-icon [type]="fileType(d.type)" />
        <span class="cg-title">{{ d.index }} {{ d.name }}</span>
      </ng-container>
      <ng-container *ngIf="s.group as g">
        <fvdr-icon name="participants" [style.color]="g.color ?? 'var(--color-text-secondary)'" />
        <span class="cg-title">{{ g.name }}</span>
      </ng-container>
      <span class="cg-count">{{ s.changes.length }}</span>
    </ng-template>

    <!-- A single change line: "<who/what>  View → PDF  [revert]" -->
    <ng-template #changeLine let-c let-editable="editable" let-showDoc="showDoc" let-list="list">
      <div class="cl" [class.cl--clickable]="editable" (click)="editable && jumpTo(c)">
        <div class="cl-subject">
          <ng-container *ngIf="showDoc || (editable && grouping === 'group'); else groupSubject">
            <fvdr-file-icon [type]="fileType(doc(c.docId).type)" />
            <span class="cl-name">{{ doc(c.docId).index }} {{ doc(c.docId).name }}</span>
            <span class="cl-for" *ngIf="showDoc">· {{ group(c.groupId).name }}</span>
          </ng-container>
          <ng-template #groupSubject>
            <fvdr-icon name="participants" [style.color]="group(c.groupId).color ?? 'var(--color-text-secondary)'" />
            <span class="cl-name">{{ group(c.groupId).name }}</span>
          </ng-template>
        </div>
        <div class="cl-delta">
          <span class="lvl lvl--from"><fvdr-icon [name]="permLevels[c.from].icon" />{{ permLevels[c.from].label }}</span>
          <fvdr-icon name="chevron-right" class="cl-arrow" />
          <span class="lvl" [class.lvl--up]="c.to > c.from" [class.lvl--down]="c.to < c.from">
            <fvdr-icon [name]="permLevels[c.to].icon" />{{ permLevels[c.to].label }}
          </span>
          <span class="cl-flag" *ngIf="grantsOriginal(c)" fvdrTooltip="Grants download of the original file — can’t be revoked once downloaded">
            <fvdr-icon name="warning" />
          </span>
          <span class="cl-time" *ngIf="editable">{{ c.at | date:'HH:mm' }}</span>
          <button *ngIf="editable" class="row-revert" fvdrTooltip="Revert" tooltipPosition="left"
                  aria-label="Revert change" (click)="$event.stopPropagation(); revert(c)">
            <fvdr-icon name="undo" />
          </button>
        </div>
        <ng-container *ngIf="insideOf(c, list ?? changes) as inner">
          <button *ngIf="inner.length" class="cl-inside"
                  data-track="toggle-inside-changes"
                  (click)="$event.stopPropagation(); toggleInside(c)">
            <fvdr-icon name="chevron-right" [class.chevron-open]="isInsideOpen(c)" />
            + {{ inner.length }} {{ inner.length === 1 ? 'item' : 'items' }} inside
          </button>
          <div class="cl-children" *ngIf="isInsideOpen(c) && inner.length">
            <div class="cl-child" *ngFor="let ch of inner; trackBy: trackChange">
              <fvdr-file-icon [type]="fileType(doc(ch.docId).type)" />
              <span class="cl-name">{{ doc(ch.docId).index }} {{ doc(ch.docId).name }}</span>
              <span class="lvl lvl--from"><fvdr-icon [name]="permLevels[ch.from].icon" />{{ permLevels[ch.from].label }}</span>
              <fvdr-icon name="chevron-right" class="cl-arrow" />
              <span class="lvl" [class.lvl--up]="ch.to > ch.from" [class.lvl--down]="ch.to < ch.from">{{ permLevels[ch.to].label }}</span>
            </div>
          </div>
        </ng-container>
      </div>
    </ng-template>

    <!-- ═══ Modals ══════════════════════════════════════════════ -->

    <fvdr-modal
      [visible]="saveOpen"
      title="Save permission changes"
      size="m"
      cancelLabel="Back to editing"
      [confirmLabel]="'Save ' + changeCount + (changeCount === 1 ? ' change' : ' changes')"
      (confirmed)="save()"
      (cancelled)="saveOpen = false"
      (closed)="saveOpen = false">
      <div class="save-body" *ngIf="saveOpen">
        <div class="save-stats">
          <div class="save-stat"><strong>{{ changeCount }}</strong><span>{{ changeCount === 1 ? 'change' : 'changes' }}</span></div>
          <div class="save-stat"><strong>{{ changedDocIds.length }}</strong><span>{{ changedDocIds.length === 1 ? 'document' : 'documents' }}</span></div>
          <div class="save-stat"><strong>{{ changedGroupIds.length }}</strong><span>{{ changedGroupIds.length === 1 ? 'group' : 'groups' }}</span></div>
          <div class="save-stat save-stat--up"><strong>{{ upCount }}</strong><span>access widened</span></div>
          <div class="save-stat save-stat--down"><strong>{{ downCount }}</strong><span>access reduced</span></div>
        </div>

        <fvdr-inline-message *ngIf="originalCount" variant="warning"
          [message]="originalCount + (originalCount === 1 ? ' change grants' : ' changes grant') + ' download of the original file. Once downloaded, it can’t be revoked.'" />
        <fvdr-inline-message *ngIf="lostAccessCount" variant="info"
          [message]="lostAccessCount + (lostAccessCount === 1 ? ' group will lose' : ' groups will lose') + ' access to a document completely.'" />

        <div class="save-list">
          <div class="cg" *ngFor="let section of sectionsBy('doc'); trackBy: trackSection">
            <div class="cg-hdr">
              <ng-container *ngTemplateOutlet="sectionTitle; context: { $implicit: section }"></ng-container>
            </div>
            <ng-container *ngFor="let c of section.changes; trackBy: trackChange">
              <ng-container *ngTemplateOutlet="changeLine; context: { $implicit: c, editable: false, list: changes }"></ng-container>
            </ng-container>
          </div>
        </div>

        <fvdr-textarea [(ngModel)]="saveNote" label="Note for the permission log (optional)"
                       placeholder="e.g. Opened financial DD to bidders for round 2" [rows]="2" />
        <fvdr-checkbox [(ngModel)]="notifyUsers" label="Notify affected users by email" />
      </div>
    </fvdr-modal>

    <fvdr-modal
      [visible]="discardOpen"
      title="Discard all changes?"
      size="s"
      cancelLabel="Keep editing"
      confirmLabel="Discard"
      confirmVariant="danger"
      (confirmed)="discardAll()"
      (cancelled)="discardOpen = false"
      (closed)="discardOpen = false">
      <p class="modal-text">
        {{ changeCount }} unsaved {{ changeCount === 1 ? 'change' : 'changes' }} across
        {{ changedDocIds.length }} {{ changedDocIds.length === 1 ? 'document' : 'documents' }} will be lost.
        Saved permissions stay as they are.
      </p>
    </fvdr-modal>

    <fvdr-modal
      [visible]="!!leaveTarget"
      title="You have unsaved permission changes"
      size="s"
      cancelLabel="Stay here"
      confirmLabel="Review and save"
      (confirmed)="leaveTarget = null; openSaveReview()"
      (cancelled)="leaveTarget = null"
      (closed)="leaveTarget = null">
      <p class="modal-text">
        Leaving the Permissions page would drop {{ changeCount }} unsaved {{ changeCount === 1 ? 'change' : 'changes' }}.
        Save them first, or stay and keep editing.
      </p>
    </fvdr-modal>

    <fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      /* Width of one permission block — narrows when the Changes drawer is open */
      --blk: 62px;
      --changed-bg:  var(--color-warning-bg);
      --changed-bar: var(--color-warning-700);
    }

    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family);
      background: var(--color-stone-0);
    }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

    .top-bar {
      height: 64px; min-height: 64px;
      border-bottom: 1px solid var(--color-divider);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
      flex-shrink: 0;
    }
    .hdr-actions { display: flex; align-items: center; gap: var(--space-6); }
    .ic-btn {
      background: none; border: none; cursor: pointer;
      width: 24px; height: 24px; padding: 0;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary); font-size: 20px;
      border-radius: var(--radius-sm);
    }
    .ic-btn:hover { color: var(--color-text-primary); }

    .content {
      flex: 1;
      display: flex; flex-direction: column;
      overflow: hidden;
      padding: var(--space-6);
      gap: var(--space-6);
      min-height: 0;
    }

    /* ── Toolbar ── */
    .toolbar { display: flex; align-items: center; gap: var(--space-4); flex-shrink: 0; }
    .toolbar-right { margin-left: auto; display: flex; gap: var(--space-4); }
    .tool-btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      height: 36px; padding: 0 var(--space-4);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-family: var(--font-family); font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer; white-space: nowrap;
      transition: border-color 0.12s, background 0.12s;
    }
    .tool-btn fvdr-icon { font-size: 16px; color: var(--color-text-secondary); }
    .tool-btn:hover { border-color: var(--color-primary-500); }
    .tool-btn--active { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .tool-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-family: var(--font-family); font-size: 14px;
      color: var(--color-primary-500);
      background: none; border: none; cursor: pointer; padding: 0;
      white-space: nowrap;
    }
    .tool-link:hover { color: var(--color-primary-600); }
    .tool-link fvdr-icon { font-size: 16px; }
    .tool-link--sm { font-size: 13px; }

    /* ── Panels ── */
    .panels { display: flex; gap: var(--space-6); flex: 1; min-height: 0; overflow: hidden; }
    .panels--with-drawer { --blk: 44px; gap: var(--space-4); }
    .panels--with-drawer .tree-panel { width: 200px; }

    /* ── Left panel ── */
    .tree-panel {
      width: 320px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: var(--space-2);
      overflow: hidden;
      transition: width 0.22s ease;
    }
    .tree-hdr {
      height: 48px; flex-shrink: 0;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-4);
    }
    .tree-hdr-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
    .search-wrap { flex-shrink: 0; }
    .search-wrap fvdr-search { display: block; }

    .changed-filter {
      display: inline-flex; align-items: center; gap: var(--space-2);
      align-self: flex-start;
      height: 28px; padding: 0 var(--space-3);
      border: 1px dashed var(--changed-bar);
      border-radius: var(--radius-full, 999px);
      background: var(--color-stone-0);
      font-family: var(--font-family); font-size: 12px;
      color: var(--color-text-primary);
      cursor: pointer;
      flex-shrink: 0;
    }
    .changed-filter:hover { background: var(--changed-bg); }
    .changed-filter--on { border-style: solid; background: var(--changed-bg); font-weight: 600; }
    .changed-filter fvdr-icon { font-size: 12px; color: var(--color-text-secondary); }
    .changed-filter-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--changed-bar); }
    .changed-filter-count { color: var(--color-text-secondary); font-weight: 400; }

    .tree-list { flex: 1; overflow-y: auto; }
    .tree-item {
      position: relative;
      display: flex; align-items: center; gap: var(--space-2);
      height: 40px; padding: 0 var(--space-3) 0 var(--space-4);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.1s;
    }
    .tree-item:hover { background: var(--color-stone-200); }
    .tree-item--selected, .tree-item--selected:hover { background: var(--color-primary-50); }
    .tree-item--user { padding-left: calc(var(--space-4) + 44px); height: 36px; cursor: default; }
    .tree-item--changed::before {
      content: '';
      position: absolute; left: 0; top: 8px; bottom: 8px;
      width: 3px; border-radius: 2px;
      background: var(--changed-bar);
    }
    .group-item { gap: var(--space-1); }
    .group-item > fvdr-icon { font-size: 16px; flex-shrink: 0; }
    .expand-gap { width: 20px; flex-shrink: 0; }
    .tree-empty { padding: var(--space-6) var(--space-4); text-align: center; color: var(--color-text-placeholder); font-size: 14px; }

    .item-idx { font-size: 14px; color: var(--color-text-primary); white-space: nowrap; flex-shrink: 0; }
    .item-name {
      font-size: 14px; color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; min-width: 0;
    }
    :host ::ng-deep .item-name mark {
      background: var(--color-primary-50); color: var(--color-primary-600);
      border-radius: 2px; padding: 0 1px;
    }
    .change-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--changed-bar);
      flex-shrink: 0;
    }
    .indent { flex-shrink: 0; }
    .inside-tag {
      display: inline-flex; align-items: center;
      height: 20px; padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--chip-bg-yellow);
      color: var(--primitive-yellow-800);
      font-size: 12px; white-space: nowrap; flex-shrink: 0;
      cursor: pointer;
    }
    .was-via { color: var(--color-text-secondary); margin-right: 2px; }
    .change-pill {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 18px; padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
      background: var(--chip-bg-yellow);
      color: var(--primitive-yellow-800);
      font-size: 12px; font-weight: 600;
      flex-shrink: 0;
    }

    .expand-btn {
      display: flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; flex-shrink: 0;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary); font-size: 14px; padding: 0;
    }
    .expand-btn:hover { background: var(--color-stone-300); }
    .expand-btn fvdr-icon { transition: transform 0.18s ease; }
    .expand-btn fvdr-icon.chevron-open { transform: rotate(90deg); }

    /* File chip (compact version of the v3 publishing chip) */
    .file-chip {
      display: inline-flex; align-items: center; gap: 2px;
      height: 28px; padding: 0 var(--space-1);
      border: 1px solid var(--color-malachite-100);
      border-radius: var(--radius-sm);
      background: var(--color-primary-50);
      flex-shrink: 0;
    }
    .file-chip > fvdr-icon { font-size: 10px; color: var(--color-primary-500); }
    .file-chip--off { background: var(--color-stone-200); border-color: var(--color-stone-300); }
    .file-chip--off > fvdr-icon { color: var(--color-text-secondary); }

    /* ── Permission table ── */
    .perm-table { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .pt-header {
      height: 48px; min-height: 48px;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      display: flex; align-items: stretch;
      flex-shrink: 0;
    }
    .pt-rows { flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding-bottom: var(--space-4); }

    .pt-row {
      position: relative;
      display: flex; align-items: center;
      height: 40px; min-height: 40px;
      transition: background 0.15s;
    }
    .pt-row:hover { background: var(--color-stone-100); }
    .pt-row--user { height: 36px; min-height: 36px; background: var(--color-stone-100); }

    /* Changed row — yellow wash + left bar, so edits stand out while scrolling */
    .pt-row--changed, .pt-row--changed:hover { background: var(--changed-bg); }
    .pt-row--changed::before {
      content: '';
      position: absolute; left: 0; top: 0; bottom: 0;
      width: 3px;
      background: var(--changed-bar);
    }
    /* Cascaded from a folder — same wash, lighter bar, so the edited folder still reads as the source */
    .pt-row--inherited::before { opacity: 0.45; }
    /* Collapsed folder whose children changed — only the bar */
    .pt-row--child-changed::before {
      content: '';
      position: absolute; left: 0; top: 8px; bottom: 8px;
      width: 3px; border-radius: 2px;
      background: var(--changed-bar);
    }
    .pt-row--flash { animation: row-flash 1.2s ease-out; }
    @keyframes row-flash {
      0%, 30% { box-shadow: inset 0 0 0 2px var(--changed-bar); }
      100%    { box-shadow: inset 0 0 0 2px transparent; }
    }

    .pt-expand-cell { width: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .pt-entity-cell {
      flex: 1; min-width: 0;
      display: flex; align-items: center; gap: var(--space-2);
      padding: 0 var(--space-3);
    }
    .pt-entity-cell > fvdr-icon { font-size: 16px; flex-shrink: 0; }
    .pt-entity-hdr { font-size: 14px; font-weight: 600; color: var(--color-text-primary); gap: var(--space-2); white-space: nowrap; overflow: hidden; }
    .pt-context {
      font-weight: 400; color: var(--color-text-secondary);
      overflow: hidden; text-overflow: ellipsis;
    }
    .pt-context strong { font-weight: 600; color: var(--color-text-primary); }
    .pt-entity-cell--user { padding-left: calc(var(--space-3) + 8px); }
    .pt-entity-name {
      font-size: 14px; color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 0 1 auto; min-width: 0;
    }

    .was-tag {
      display: inline-flex; align-items: center; gap: 2px;
      height: 20px; padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      border: 1px solid var(--color-warning-border);
      font-size: 12px; color: var(--color-text-secondary);
      white-space: nowrap; flex-shrink: 0;
      margin-left: auto;
    }
    .was-tag fvdr-icon { font-size: 12px; }
    /* Drawer open → the table is narrow; the dashed ghost already marks the saved level */
    .panels--with-drawer .was-tag { display: none; }
    .panels--with-drawer .row-revert { margin-left: auto; }
    .row-revert {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; flex-shrink: 0;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary); font-size: 16px;
      padding: 0;
    }
    .row-revert:hover { background: var(--color-stone-300); color: var(--color-text-primary); }

    .pt-perm-hdr { display: flex; align-items: stretch; flex-shrink: 0; }
    .perm-spacer { width: 32px; flex-shrink: 0; }
    .perm-th {
      position: relative;
      width: var(--blk);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px; flex-shrink: 0;
      transition: width 0.22s ease;
    }
    .perm-th fvdr-icon { font-size: 16px; color: var(--color-text-primary); }
    .perm-th span { font-size: 12px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; }
    .panels--with-drawer .perm-th span { font-size: 10px; }
    .th-tooltip {
      position: absolute; top: calc(100% + 8px); left: 50%;
      transform: translateX(-50%);
      width: 200px;
      background: var(--color-text-primary); color: var(--color-stone-0);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      z-index: 250; pointer-events: none;
    }
    .th-tooltip strong { display: block; font-size: 12px; margin-bottom: 2px; }
    .th-tooltip p { font-size: 12px; line-height: 1.4; color: var(--color-stone-300); }

    .pt-perm-cell { flex-shrink: 0; display: flex; align-items: center; padding: 0 var(--space-2); }
    .row-empty-slot {
      position: relative;
      width: 24px; height: 16px; flex-shrink: 0;
      display: flex; align-items: center;
    }
    .row-empty-slot--clickable { cursor: pointer; }
    .row-empty-icon { font-size: 16px; color: var(--color-error-600); }
    .row-empty-slot--was .row-empty-icon { opacity: 0.35; }
    .slider-track { height: 16px; display: flex; }
    .slider-track--ro { opacity: 0.55; pointer-events: none; }
    .slider-block {
      position: relative;
      width: var(--blk); height: 16px;
      border: 1px solid var(--color-stone-500);
      border-left: none;
      flex-shrink: 0;
      cursor: pointer;
      transition: filter 0.1s, width 0.22s ease, background 0.15s;
    }
    .slider-block:first-child { border-left: 1px solid var(--color-stone-500); border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
    .slider-block:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .slider-block:hover { filter: brightness(0.88); }
    .s-light  { background: var(--color-primary-50); filter: saturate(1.8); }
    .s-active { background: var(--color-primary-500); }
    .s-none   { background: var(--color-stone-300); }
    .s-hatched {
      background: repeating-linear-gradient(45deg,
        var(--color-stone-500), var(--color-stone-500) 2px,
        var(--color-stone-200) 2px, var(--color-stone-200) 5px);
      cursor: not-allowed;
    }
    .s-hatched:hover { filter: none; }
    /* Ghost marker for the saved level of a changed cell */
    .s-was::after {
      content: '';
      position: absolute; inset: 2px;
      border: 1.5px dashed var(--color-stone-900);
      border-radius: 2px;
      pointer-events: none;
    }
    .s-active.s-was::after { border-color: var(--color-stone-0); }

    .seg-tooltip {
      position: absolute; top: calc(100% + 6px); left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      background: var(--color-text-primary); color: var(--color-stone-0);
      border-radius: var(--radius-sm);
      padding: 3px var(--space-2);
      font-size: 12px; font-weight: 600;
      z-index: 250; pointer-events: none;
    }
    .seg-tooltip span { font-weight: 400; color: var(--color-stone-400); }

    /* ── Drawer ── */
    .drawer {
      width: 340px; flex-shrink: 0;
      display: flex; flex-direction: column;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
      overflow: hidden;
      animation: drawer-in 0.22s ease;
    }
    @keyframes drawer-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
    .drawer-hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2) var(--space-4) 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .drawer-sub {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .drawer-summary { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; }
    .drawer-list { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }
    .drawer-empty {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-10) var(--space-6);
      text-align: center;
    }
    .drawer-empty fvdr-icon { font-size: 24px; color: var(--color-stone-600); }
    .drawer-empty strong { font-size: 14px; color: var(--color-text-primary); }
    .drawer-empty span { font-size: 13px; line-height: 1.5; color: var(--color-text-secondary); }

    /* Change groups */
    .cg { padding: var(--space-2) 0; }
    .cg + .cg { border-top: 1px solid var(--color-divider); }
    .cg-hdr {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-1) var(--space-4);
      min-width: 0;
    }
    .cg-hdr > fvdr-icon { font-size: 16px; flex-shrink: 0; }
    .cg-title {
      font-size: 13px; font-weight: 600; color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .cg-count {
      font-size: 12px; color: var(--color-text-secondary);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-1);
      flex-shrink: 0;
    }
    .cg-revert {
      margin-left: auto;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family); font-size: 12px;
      color: var(--color-text-secondary);
      padding: 2px var(--space-1);
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }
    .cg-revert:hover { color: var(--color-text-primary); background: var(--color-stone-200); }

    .cl {
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--space-2) var(--space-4) var(--space-2) calc(var(--space-4) + 24px);
    }
    .cl--clickable { cursor: pointer; }
    .cl--clickable:hover { background: var(--color-stone-100); }
    .cl-subject { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .cl-subject > fvdr-icon { font-size: 14px; flex-shrink: 0; }
    .cl-name {
      font-size: 13px; color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .cl-for { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; }
    .cl-delta { display: flex; align-items: center; gap: var(--space-1); min-height: 24px; }
    .cl-arrow { font-size: 12px; color: var(--color-stone-600); }
    .lvl {
      display: inline-flex; align-items: center; gap: var(--space-1);
      height: 20px; padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      font-size: 12px; white-space: nowrap;
      background: var(--color-stone-200);
      color: var(--color-text-primary);
    }
    .lvl fvdr-icon { font-size: 12px; }
    .lvl--from { color: var(--color-text-secondary); text-decoration: line-through; text-decoration-color: var(--color-stone-500); }
    .lvl--up { background: var(--color-primary-50); color: var(--color-primary-700); font-weight: 600; }
    .lvl--down { background: var(--color-stone-300); color: var(--color-text-primary); font-weight: 600; }
    .cl-flag { display: inline-flex; font-size: 14px; color: var(--color-warning-700); }
    .cl-inside {
      display: inline-flex; align-items: center; gap: var(--space-1);
      align-self: flex-start;
      margin-top: 2px;
      padding: 0;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family); font-size: 12px;
      color: var(--primitive-yellow-800);
    }
    .cl-inside fvdr-icon { font-size: 12px; transition: transform 0.18s ease; }
    .cl-inside fvdr-icon.chevron-open { transform: rotate(90deg); }
    .cl-children {
      display: flex; flex-direction: column; gap: var(--space-1);
      margin-top: var(--space-1);
      padding-left: var(--space-3);
      border-left: 2px solid var(--color-warning-border);
    }
    .cl-child { display: flex; align-items: center; gap: var(--space-1); min-width: 0; }
    .cl-child fvdr-file-icon { flex-shrink: 0; }
    .cl-child .cl-name { flex: 1 1 auto; font-size: 12px; }
    .cl-time { margin-left: auto; font-size: 11px; color: var(--color-text-placeholder); }
    .cl:not(.cl--clickable) .cl-flag { margin-left: auto; }

    /* History batches */
    .batch { border-bottom: 1px solid var(--color-divider); }
    .batch-hdr {
      display: flex; align-items: center; gap: var(--space-3);
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family); text-align: left;
    }
    .batch-hdr:hover { background: var(--color-stone-100); }
    .batch-meta { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .batch-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
    .batch-sub { font-size: 12px; color: var(--color-text-secondary); }
    .batch-chevron { font-size: 16px; color: var(--color-text-secondary); transition: transform 0.18s ease; }
    .batch--open .batch-chevron { transform: rotate(180deg); }
    .batch-note {
      margin: 0 var(--space-4) var(--space-3) calc(var(--space-4) + 36px);
      font-size: 12px; font-style: italic; color: var(--color-text-secondary);
    }
    .batch-body { padding-bottom: var(--space-3); }
    .batch-body .cl { padding-left: calc(var(--space-4) + 36px); }
    .batch-revert {
      display: inline-flex; align-items: center; gap: var(--space-2);
      margin: var(--space-2) var(--space-4) 0 calc(var(--space-4) + 36px);
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-family: var(--font-family); font-size: 13px;
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .batch-revert:hover { border-color: var(--color-primary-500); }
    .batch-revert fvdr-icon { font-size: 14px; color: var(--color-text-secondary); }
    .batch-revert-hint {
      display: block;
      margin: var(--space-1) var(--space-4) 0 calc(var(--space-4) + 36px);
      font-size: 11px; line-height: 1.4; color: var(--color-text-placeholder);
    }

    /* ── Activity log ── */
    .drawer { width: 360px; }
    .session-hdr {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .session-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-stone-500); flex-shrink: 0; }
    .session-dot--live { background: var(--changed-bar); animation: live-pulse 1.6s ease-in-out infinite; }
    @keyframes live-pulse {
      0%, 100% { box-shadow: 0 0 0 0 var(--color-warning-border); }
      50%      { box-shadow: 0 0 0 5px transparent; }
    }
    .session-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .session-meta strong { font-size: 13px; color: var(--color-text-primary); }
    .session-meta span { font-size: 12px; color: var(--color-text-secondary); }

    .feed {
      flex: 1; overflow-y: auto;
      display: flex; flex-direction: column; gap: var(--space-1);
      padding: var(--space-3) var(--space-3) var(--space-4);
      scroll-behavior: smooth;
    }
    .feed-empty { display: flex; gap: var(--space-3); padding: var(--space-2); }
    .feed-empty p { font-size: 13px; line-height: 1.5; color: var(--color-text-secondary); }
    .feed-empty strong { color: var(--color-text-primary); }

    .fe-divider {
      display: flex; align-items: center; gap: var(--space-2);
      margin: var(--space-2) 0;
      font-size: 11px; color: var(--color-text-placeholder);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .fe-divider::before, .fe-divider::after { content: ''; flex: 1; height: 1px; background: var(--color-divider); }

    .fe {
      display: flex; gap: var(--space-2);
      padding: var(--space-2);
      border-radius: var(--radius-md);
      animation: fe-in 0.25s ease-out;
    }
    .fe:hover { background: var(--color-stone-100); }
    @keyframes fe-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .fe--stale { opacity: 0.55; }
    .fe--stale .lvl { text-decoration: line-through; }

    .fe-icon {
      width: 24px; height: 24px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--color-stone-200);
      color: var(--color-text-secondary);
      font-size: 12px;
    }
    .fe-icon--edit    { background: var(--changed-bg); color: var(--changed-bar); }
    .fe-icon--cascade { background: var(--changed-bg); color: var(--changed-bar); }
    .fe-icon--warning { background: var(--color-warning-bg); color: var(--color-warning-700); }
    .fe-icon--info    { background: var(--color-stone-200); color: var(--color-info-500); }
    .fe-icon--tip     { background: var(--color-primary-50); color: var(--color-primary-500); }
    .fe-icon--saved   { background: var(--color-primary-50); color: var(--color-primary-500); }
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fe-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); padding-top: 2px; }
    .fe-line { display: flex; min-width: 0; }
    .fe-text { font-size: 13px; line-height: 1.45; color: var(--color-text-primary); }
    .fe-link {
      background: none; border: none; padding: 0; cursor: pointer;
      font-family: var(--font-family); font-size: 13px; font-weight: 600;
      color: var(--color-text-primary); text-align: left;
    }
    .fe-link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .fe-state { font-size: 11px; color: var(--color-text-placeholder); white-space: nowrap; }
    .fe-state--draft {
      padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
      background: var(--chip-bg-yellow);
      color: var(--primitive-yellow-800);
      font-weight: 600;
    }
    .fe-side { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-1); flex-shrink: 0; }
    .fe-time { font-size: 11px; color: var(--color-text-placeholder); line-height: 24px; }

    .fe-toggle {
      display: inline-flex; align-items: center; gap: var(--space-1);
      align-self: flex-start;
      background: none; border: none; padding: 2px 0; cursor: pointer;
      font-family: var(--font-family); font-size: 13px; color: var(--color-text-primary);
    }
    .fe-toggle fvdr-icon { font-size: 12px; color: var(--color-text-secondary); transition: transform 0.18s ease; }
    .fe-toggle fvdr-icon.chevron-open { transform: rotate(90deg); }

    .fe-card {
      display: flex; flex-direction: column; gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .fe--warning .fe-card { border-color: var(--color-warning-border); background: var(--color-warning-bg); }
    .fe--tip .fe-card { border-color: var(--color-malachite-100); background: var(--color-primary-50); }
    .fe-card strong { font-size: 13px; color: var(--color-text-primary); }
    .fe-card p { font-size: 12px; line-height: 1.5; color: var(--color-text-secondary); }
    .fe-action {
      align-self: flex-start;
      margin-top: var(--space-1);
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-family: var(--font-family); font-size: 12px; font-weight: 600;
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .fe-action:hover { border-color: var(--color-primary-500); color: var(--color-primary-600); }
    .fe-done { display: inline-flex; align-items: center; gap: var(--space-1); font-size: 12px; color: var(--color-primary-600); }

    .feed-live {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-2) 0 calc(var(--space-2) + 32px);
      font-size: 12px; color: var(--color-text-placeholder);
    }
    .typing { display: inline-flex; gap: 3px; }
    .typing i {
      width: 4px; height: 4px; border-radius: 50%;
      background: var(--color-stone-600);
      animation: typing 1.2s ease-in-out infinite;
    }
    .typing i:nth-child(2) { animation-delay: 0.15s; }
    .typing i:nth-child(3) { animation-delay: 0.3s; }
    @keyframes typing { 0%, 60%, 100% { opacity: 0.25; transform: none; } 30% { opacity: 1; transform: translateY(-2px); } }

    .drawer-foot {
      display: flex; flex-direction: column; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .foot-sum { display: flex; align-items: baseline; gap: var(--space-2); }
    .foot-sum strong { font-size: 13px; color: var(--color-text-primary); }
    .foot-sum span { font-size: 12px; color: var(--color-text-secondary); }
    .foot-actions { display: flex; align-items: center; gap: var(--space-2); }

    /* ── Draft bar ── */
    .draft-bar {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
      /* extra right padding keeps Save clear of the platform's floating feedback buttons */
      padding: var(--space-3) calc(var(--space-10) * 2) var(--space-3) var(--space-6);
      border-top: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      box-shadow: 0 -4px 16px rgba(31, 33, 41, 0.06);
      flex-shrink: 0;
      animation: bar-in 0.2s ease;
    }
    @keyframes bar-in { from { transform: translateY(100%); } to { transform: none; } }
    .draft-status { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .draft-status .tool-link { order: -1; }
    .draft-mark {
      width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--changed-bg);
      color: var(--changed-bar); font-size: 16px;
    }
    .draft-text { display: flex; flex-direction: column; gap: 1px; }
    .draft-text strong { font-size: 14px; color: var(--color-text-primary); }
    .draft-text span { font-size: 12px; color: var(--color-text-secondary); }
    .draft-actions { display: flex; align-items: center; gap: var(--space-3); }

    /* ── Save review ── */
    .save-body { display: flex; flex-direction: column; gap: var(--space-4); }
    .save-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .save-stat {
      flex: 1 1 0; min-width: 80px;
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
    }
    .save-stat strong { font-size: 18px; color: var(--color-text-primary); }
    .save-stat span { font-size: 12px; color: var(--color-text-secondary); }
    .save-stat--up { background: var(--color-primary-50); }
    .save-stat--up strong { color: var(--color-primary-700); }
    .save-list {
      max-height: 260px; overflow-y: auto;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
    }
    .modal-text { font-size: 14px; line-height: 1.5; color: var(--color-text-primary); }

    @media (prefers-reduced-motion: reduce) {
      .drawer, .draft-bar, .pt-row--flash, .fe, .typing i, .session-dot--live, .spin { animation: none; }
    }
  `],
})
export class PermissionsDraftV2Component implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  sidebarCollapsed = true;
  viewMode: ViewMode = 'by-documents';
  selectedDocId = 1;
  selectedGroupId = 2;
  searchQuery = '';
  changedOnly = false;
  private expandedGroupIds = new Set<number>();

  hoveredCol: number | null = null;
  hoveredSeg: string | null = null;
  flashKey: string | null = null;
  private flashTimer?: ReturnType<typeof setTimeout>;

  /** The draft: one entry per edited document × group cell. */
  draft: Record<string, Change> = {};
  undoStack: UndoStep[] = [];

  panelOpen = false;
  panelTab: PanelTab = 'activity';

  // ── Activity log ──
  @ViewChild('feed') private feedEl?: ElementRef<HTMLElement>;
  log: LogEntry[] = [];
  private nextLogId = 1;
  private sessionStart: Date | null = null;
  /** The panel opens by itself once per draft; if the admin closes it, it stays closed. */
  private autoOpened = false;
  private shownTips = new Set<string>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  grouping: ChangesGrouping = 'doc';
  openBatchId: number | null = 1;

  saveOpen = false;
  saveNote = '';
  notifyUsers = false;
  discardOpen = false;
  leaveTarget: SidebarNavItem | null = null;

  readonly groupingItems: SegmentItem[] = [
    { id: 'doc',   label: 'Document' },
    { id: 'group', label: 'Group' },
  ];

  readonly navItems: SidebarNavItem[] = [
    { id: 'documents',   label: 'Documents',   icon: 'documents',       iconActive: 'documents-active'       },
    { id: 'users',       label: 'Users',       icon: 'users-groups',    iconActive: 'users-groups-active'    },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active', active: true },
    { id: 'settings',    label: 'Settings',    icon: 'nav-settings',    iconActive: 'nav-settings-active'    },
    { id: 'activity',    label: 'Activity',    icon: 'activities',      iconActive: 'activities-active'      },
  ];

  readonly treeItems: TreeItem[] = [
    { id: 1,  index: '1',     name: 'Stage folder',                        type: 'folder', perms: [6,6,5,4,3,6], published: true },
    { id: 11, index: '1.1',   name: 'Term sheet.pdf',                      type: 'pdf',    perms: [6,6,5,4,3,6], published: true, parentId: 1 },
    { id: 12, index: '1.2',   name: 'Board approval.docx',                 type: 'doc',    perms: [6,5,4,4,2,6], published: true, parentId: 1 },
    { id: 2,  index: '2',     name: 'Organizational chart and manage',     type: 'folder', perms: [7,7,6,5,4,5], published: true },
    { id: 21, index: '2.1',   name: 'Org chart.pdf',                       type: 'pdf',    perms: [7,7,6,5,4,5], published: true, parentId: 2 },
    { id: 22, index: '2.2',   name: 'Management bios',                     type: 'folder', perms: [7,6,6,4,4,5], published: true, parentId: 2 },
    { id: 23, index: '2.2.1', name: 'CEO bio.docx',                        type: 'doc',    perms: [7,6,6,4,4,5], published: true, parentId: 22 },
    { id: 24, index: '2.2.2', name: 'CFO interview.mp4',                   type: 'video',  perms: [7,5,5,2,2,5], published: true, parentId: 22, restricted: [1,3,4,6] },
    { id: 3,  index: '3.1',   name: 'Corporate DD — Product and Services', type: 'folder', perms: [5,6,4,2,3,5], published: true },
    { id: 31, index: '3.1.1', name: 'Product overview.pdf',                type: 'pdf',    perms: [5,6,4,2,3,5], published: true, parentId: 3 },
    { id: 32, index: '3.1.2', name: 'Services catalogue.xlsx',             type: 'xlsx',   perms: [5,5,4,2,3,5], parentId: 3 },
    { id: 4,  index: '4',     name: 'Financial DD — Accounts Receivables', type: 'folder', perms: [6,6,5,3,4,6], published: true },
    { id: 41, index: '4.1',   name: 'AR aging report.xlsx',                type: 'xlsx',   perms: [6,6,5,3,4,6], published: true, parentId: 4 },
    { id: 42, index: '4.2',   name: 'Customer contracts.pdf',              type: 'pdf',    perms: [6,5,5,3,2,6], published: true, parentId: 4 },
    { id: 5,  index: '5',     name: 'Key contacts by function',            type: 'xlsx',   perms: [4,5,3,1,2,4], published: true },
    { id: 6,  index: '6',     name: 'Tax accounting.xlsx',                 type: 'xlsx',   perms: [5,5,4,2,3,5], published: true },
    { id: 7,  index: '7',     name: 'Tax returns.pdf',                     type: 'pdf',    perms: [3,4,3,1,0,3] },
    { id: 8,  index: '8',     name: 'Registration with tax authorities',   type: 'doc',    perms: [6,7,5,4,3,6] },
    { id: 9,  index: '9',     name: 'Site walkthrough recording.mp4',      type: 'video',  perms: [0,2,7,5,0,7], restricted: [1,3,4,6] },
  ];

  history: SavedBatch[] = [
    { id: 1, at: minutesAgo(95), author: 'John Doe', initials: 'JD',
      note: 'Opened financial DD to bidders for round 2',
      changes: [
        { docId: 4, groupId: 3, from: 1, to: 3, at: minutesAgo(95) },
        { docId: 4, groupId: 4, from: 2, to: 4, at: minutesAgo(95) },
        { docId: 6, groupId: 3, from: 0, to: 2, at: minutesAgo(95) },
      ]},
    { id: 2, at: minutesAgo(60 * 26), author: 'Anna Miller', initials: 'AM',
      note: '',
      changes: [
        { docId: 7, groupId: 4, from: 2, to: 0, at: minutesAgo(60 * 26) },
        { docId: 2, groupId: 5, from: 7, to: 5, at: minutesAgo(60 * 26) },
      ]},
  ];
  private nextBatchId = 3;

  readonly groups = GROUPS;
  readonly permCols = PERM_COLS;
  readonly permLevels = PERM_LEVELS;
  readonly sliderRange = Array.from({ length: 7 }, (_, i) => i + 1);

  // ── Derived state ─────────────────────────────────────────

  get changes(): Change[] {
    return Object.values(this.draft).sort((a, b) => b.at.getTime() - a.at.getTime());
  }
  /** Changes the admin made directly; cascaded children ride along with their folder's change. */
  get topChanges(): Change[] { return this.topOf(this.changes); }
  get changeCount(): number { return this.topChanges.length; }
  get changedDocIds(): number[] { return [...new Set(this.changes.map(c => c.docId))]; }
  get changedGroupIds(): number[] { return [...new Set(this.changes.map(c => c.groupId))]; }
  get upCount(): number { return this.topChanges.filter(c => c.to > c.from).length; }
  get downCount(): number { return this.topChanges.filter(c => c.to < c.from).length; }
  get originalCount(): number { return this.changes.filter(c => this.grantsOriginal(c)).length; }
  get lostAccessCount(): number { return this.topChanges.filter(c => c.to === 0).length; }

  /** A cascaded change counts as top-level once its folder's own change is gone from the list. */
  topOf(list: Change[]): Change[] {
    return list.filter(c => c.via == null || !list.some(p => p.docId === c.via && p.groupId === c.groupId));
  }
  /** Cascaded changes that came from folder change c. */
  insideOf(c: Change, list: Change[]): Change[] {
    return list.filter(x => x.via === c.docId && x.groupId === c.groupId);
  }

  get draftSummary(): string {
    const d = this.changedDocIds.length, g = this.changedGroupIds.length;
    return `${d} ${d === 1 ? 'document' : 'documents'} · ${g} ${g === 1 ? 'group' : 'groups'}`;
  }

  /** Cached so fvdr-tabs doesn't re-create its buttons on every change-detection pass (that swallows clicks). */
  private tabsCache: { count: number; tabs: TabItem[] } = { count: -1, tabs: [] };
  get panelTabs(): TabItem[] {
    const count = this.changeCount;
    if (this.tabsCache.count !== count) {
      this.tabsCache = { count, tabs: [
        { id: 'activity', label: 'Activity', counter: count || undefined },
        { id: 'draft',    label: 'Summary' },
        { id: 'history',  label: 'History' },
      ]};
    }
    return this.tabsCache.tabs;
  }

  get draftSections() { return this.sectionsBy(this.grouping); }

  sectionsBy(by: ChangesGrouping): { doc?: TreeItem; group?: Group; changes: Change[] }[] {
    const map = new Map<number, Change[]>();
    for (const c of this.topChanges) {
      const id = by === 'doc' ? c.docId : c.groupId;
      map.set(id, [...(map.get(id) ?? []), c]);
    }
    const ids = by === 'doc'
      ? this.treeItems.map(t => t.id).filter(id => map.has(id))
      : GROUPS.map(g => g.id).filter(id => map.has(id));
    return ids.map(id => by === 'doc'
      ? { doc: this.doc(id), changes: map.get(id)! }
      : { group: this.group(id), changes: map.get(id)! });
  }

  get selectedDoc(): TreeItem { return this.doc(this.selectedDocId); }
  get selectedGroup(): Group { return this.group(this.selectedGroupId); }

  get breadcrumbs() {
    return [
      { id: 'permissions', label: 'Permissions' },
      { id: 'item', label: this.viewMode === 'by-groups' ? this.selectedDoc.name : 'Documents' },
    ];
  }

  /** Tree rows honouring folder expansion; search and the changed-only filter list matches flat. */
  get leftDocs(): TreeItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q && !this.changedOnly) return this.visibleDocs;
    return this.treeItems.filter(item =>
      (!this.changedOnly || this.docChangeCount(item.id) > 0) &&
      (!q || item.name.toLowerCase().includes(q) || item.index.includes(q)));
  }

  get visibleDocs(): TreeItem[] {
    return this.treeItems.filter(item => this.ancestors(item.id).every(a => this.expandedFolders.has(a)));
  }

  // ── Folder tree ───────────────────────────────────────────

  private expandedFolders = new Set<number>();

  hasChildren(id: number): boolean { return this.treeItems.some(t => t.parentId === id); }
  descendants(id: number): TreeItem[] {
    const kids = this.treeItems.filter(t => t.parentId === id);
    return kids.flatMap(k => [k, ...this.descendants(k.id)]);
  }
  ancestors(id: number): number[] {
    const out: number[] = [];
    for (let p = this.doc(id).parentId; p != null; p = this.doc(p).parentId) out.push(p);
    return out;
  }
  /** Left padding for a tree row: 20px per nesting level on top of the base. */
  indent(item: TreeItem, base = 16): string { return `${base + this.ancestors(item.id).length * 20}px`; }
  isFolderExpanded(id: number): boolean { return this.expandedFolders.has(id); }
  toggleFolder(id: number): void {
    const s = new Set(this.expandedFolders);
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedFolders = s;
  }
  private expandPath(id: number, includeSelf = false): void {
    const s = new Set(this.expandedFolders);
    this.ancestors(id).forEach(a => s.add(a));
    // includeSelf opens the folder and every subfolder, so all cascaded rows are in view
    if (includeSelf) [id, ...this.descendants(id).map(d => d.id)].filter(x => this.hasChildren(x)).forEach(x => s.add(x));
    this.expandedFolders = s;
  }

  /** Changed cells of a folder's descendants for one group. */
  innerChangeCount(docId: number, groupId: number): number {
    return this.descendants(docId).filter(d => this.isChanged(d.id, groupId)).length;
  }
  /** Any group: changes on the item itself or anywhere inside it. */
  subtreeChangeCount(docId: number): number {
    const ids = new Set([docId, ...this.descendants(docId).map(d => d.id)]);
    return this.changes.filter(c => ids.has(c.docId)).length;
  }

  // Lists below are rebuilt from fresh arrays on every pass — trackBy keeps their DOM (and clicks) alive.
  trackChange = (_: number, c: Change) => this.key(c.docId, c.groupId);
  trackSection = (_: number, sec: { doc?: TreeItem; group?: Group }) => sec.doc ? 'd' + sec.doc.id : 'g' + sec.group!.id;

  // ── "+N inside" toggles in the change lists ──
  private openInside = new Set<string>();
  isInsideOpen(c: Change): boolean { return this.openInside.has(this.key(c.docId, c.groupId)); }
  toggleInside(c: Change): void {
    const k = this.key(c.docId, c.groupId), s = new Set(this.openInside);
    s.has(k) ? s.delete(k) : s.add(k);
    this.openInside = s;
  }

  get leftGroups(): Group[] {
    return GROUPS.filter(g => g.id !== 0 && (!this.changedOnly || this.groupChangeCount(g.id) > 0));
  }

  doc(id: number): TreeItem { return this.treeItems.find(t => t.id === id)!; }
  group(id: number): Group { return GROUPS.find(g => g.id === id) ?? GROUPS[0]; }
  key(docId: number, groupId: number): string { return `${docId}:${groupId}`; }

  docChangeCount(docId: number): number { return this.changes.filter(c => c.docId === docId).length; }
  groupChangeCount(groupId: number): number { return this.changes.filter(c => c.groupId === groupId).length; }
  docsIn(changes: Change[]): number { return new Set(changes.map(c => c.docId)).size; }

  savedLevel(docId: number, groupId: number): number { return this.doc(docId).perms[groupId] ?? 0; }
  level(docId: number, groupId: number): number {
    return this.draft[this.key(docId, groupId)]?.to ?? this.savedLevel(docId, groupId);
  }
  changeAt(docId: number, groupId: number): Change | undefined { return this.draft[this.key(docId, groupId)]; }
  isChanged(docId: number, groupId: number): boolean { return !!this.changeAt(docId, groupId); }
  /** Saved level of a changed cell — drawn as a dashed ghost; null when the cell is unchanged. */
  wasLevel(docId: number, groupId: number): number | null { return this.changeAt(docId, groupId)?.from ?? null; }

  grantsOriginal(c: Change): boolean { return c.to >= ORIGINAL_LEVEL && c.from < ORIGINAL_LEVEL; }

  segClass(level: number, pos: number, restricted: number[] = []): 'light' | 'active' | 'none' | 'hatched' {
    if (restricted.includes(pos)) return 'hatched';
    if (level === 0 || pos > level) return 'none';
    return pos < level ? 'light' : 'active';
  }

  fileType(type: string): FvdrFileType {
    const map: Record<string, FvdrFileType> = { folder: 'folder', xlsx: 'xls', pdf: 'pdf', doc: 'doc', video: 'video' };
    return map[type] ?? 'placeholder';
  }

  highlight(text: string): string {
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const q = this.searchQuery.trim();
    if (!q) return safe;
    const re = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${re})`, 'gi'), '<mark>$1</mark>');
  }

  when(d: Date): string {
    const mins = Math.round((Date.now() - d.getTime()) / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Editing the draft ─────────────────────────────────────

  /** Writes one cell into the draft and returns the undo record. A cell set back to its saved level leaves the draft. */
  private write(docId: number, groupId: number, to: number, via?: number): { key: string; prev: Change | undefined } {
    const k = this.key(docId, groupId);
    const prev = this.draft[k];
    const from = this.savedLevel(docId, groupId);
    const next = { ...this.draft };
    if (to === from) delete next[k];
    else next[k] = { docId, groupId, from, to, at: new Date(), ...(via != null ? { via } : {}) };
    this.draft = next;
    return { key: k, prev };
  }

  /** Highest level ≤ `to` that the item offers (video etc. skip some levels). */
  private allowedLevel(item: TreeItem, to: number): number {
    let l = to;
    while (l > 0 && item.restricted?.includes(l)) l--;
    return l;
  }

  /** Setting a folder's level cascades the same level to everything inside it, for that group. */
  setLevel(docId: number, groupId: number, to: number): void {
    if (this.doc(docId).restricted?.includes(to)) return;
    const from = this.level(docId, groupId);
    if (from === to) return;
    const startsDraft = this.changeCount === 0;
    const inner = this.descendants(docId);
    const step = [
      this.write(docId, groupId, to),
      ...inner.map(d => this.write(d.id, groupId, this.allowedLevel(d, to), docId)),
    ];
    this.undoStack = [...this.undoStack, step];
    if (inner.length) this.expandPath(docId, true);

    if (startsDraft) {
      this.sessionStart = new Date();
      this.pushLog({ kind: 'session' });
    }
    if (!this.panelOpen && !this.autoOpened) {
      this.panelOpen = true;
      this.panelTab = 'activity';
    }
    this.autoOpened = true;

    const saved = this.savedLevel(docId, groupId);
    const entry = this.pushLog({ kind: 'edit', docId, groupId, from: saved, to, pending: true });
    this.later(450, () => {
      entry.pending = false;
      if (inner.length) {
        this.pushLog({
          kind: 'cascade', docId, groupId, count: inner.length,
          items: inner.map(d => ({ docId: d.id, to: this.allowedLevel(d, to), wanted: to })),
        });
      }
      this.later(350, () => this.addHints(docId, groupId, saved, to, inner));
    });
  }

  /** Rules that turn an edit into a hint in the log. Each tip shows once per draft. */
  private addHints(docId: number, groupId: number, from: number, to: number, inner: TreeItem[]): void {
    if (this.level(docId, groupId) !== to) return; // already changed again
    const d = this.doc(docId), g = this.group(groupId);
    const docLabel = `${d.index} ${d.name}`;

    if (to >= ORIGINAL_LEVEL && from < ORIGINAL_LEVEL) {
      this.pushLog({
        kind: 'hint', tone: 'warning', docId, groupId,
        title: 'Original downloads can’t be revoked',
        text: `Once someone in ${g.name} downloads the original of “${docLabel}”, you can’t take it back. If a watermarked copy is enough, PDF keeps you in control.`,
        action: d.restricted?.includes(4) ? undefined : { label: 'Use PDF instead', run: () => this.setLevel(docId, groupId, 4) },
      });
    }

    if (to === 0) {
      const users = g.users.length;
      const extra = inner.length ? ` and ${inner.length} ${inner.length === 1 ? 'item' : 'items'} inside` : '';
      this.pushLog({
        kind: 'hint', tone: 'info', docId, groupId,
        title: `${g.name} will lose access`,
        text: groupId === 0
          ? `No group will see “${docLabel}”${extra} unless it has its own permission.`
          : `${users} ${users === 1 ? 'user' : 'users'} in ${g.name} won’t see “${docLabel}”${extra} after you save.`,
      });
    }

    const clamped = inner.filter(i => this.allowedLevel(i, to) !== to);
    if (clamped.length) {
      const first = clamped[0];
      this.pushLog({
        kind: 'hint', tone: 'info', docId, groupId,
        title: `${clamped.length === 1 ? 'One item' : clamped.length + ' items'} got a different level`,
        text: `${first.name} doesn’t offer ${this.permLevels[to].label}, so it got ${this.permLevels[this.allowedLevel(first, to)].label} instead${clamped.length > 1 ? ' (and similar for the others)' : ''}.`,
      });
    }

    if (d.parentId != null) {
      const parentLevel = this.level(d.parentId, groupId);
      if (to > parentLevel && this.tipOnce(`above-parent:${docId}:${groupId}`)) {
        const parent = this.doc(d.parentId);
        this.pushLog({
          kind: 'hint', tone: 'tip', docId, groupId,
          title: 'Higher than its folder',
          text: `“${d.name}” now allows more than its folder “${parent.name}” (${this.permLevels[parentLevel].label}). That’s fine — just note that new files added to the folder will get ${this.permLevels[parentLevel].label}.`,
        });
      }
    }

    if (this.viewMode === 'by-documents' && this.tipOnce('apply-all-groups')) {
      const others = GROUPS.filter(x => x.id !== 0 && x.id !== groupId && this.level(docId, x.id) !== to && !d.restricted?.includes(to));
      if (others.length) {
        this.pushLog({
          kind: 'hint', tone: 'tip', docId, groupId,
          title: 'Same level for the other groups?',
          text: `${others.length} other ${others.length === 1 ? 'group has' : 'groups have'} a different level on “${docLabel}”.`,
          action: { label: `Set ${this.permLevels[to].label} for all groups`, run: () => this.applyToGroups(docId, others.map(o => o.id), to) },
        });
      }
    }

    if (this.changeCount >= 5 && this.tipOnce('review-summary')) {
      this.pushLog({
        kind: 'hint', tone: 'tip',
        title: `${this.changeCount} changes so far`,
        text: `They touch ${this.changedDocIds.length} documents and ${this.changedGroupIds.length} groups. The Summary tab groups them by document or group — handy for a final check before saving.`,
        action: { label: 'Open Summary', run: () => (this.panelTab = 'draft') },
      });
    }
  }

  private applyToGroups(docId: number, groupIds: number[], to: number): void {
    for (const gid of groupIds) this.setLevel(docId, gid, to);
  }

  private tipOnce(id: string): boolean {
    if (this.shownTips.has(id)) return false;
    this.shownTips.add(id);
    return true;
  }

  private pushLog(e: Omit<LogEntry, 'id' | 'at'>): LogEntry {
    const entry: LogEntry = { id: this.nextLogId++, at: new Date(), ...e };
    this.log = [...this.log, entry];
    this.later(30, () => {
      const el = this.feedEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
    return entry;
  }

  private later(ms: number, fn: () => void): void { this.timers.push(setTimeout(fn, ms)); }

  /** Ends the current draft in the log: older entries lose their undo buttons and stale styling. */
  private closeSession(): void {
    this.log = this.log.map(e => ({ ...e, closed: true, pending: false }));
    this.autoOpened = false;
    this.sessionStart = null;
    this.shownTips = new Set();
  }

  trackLog = (_: number, e: LogEntry) => e.id;

  logIcon(e: LogEntry): FvdrIconName {
    switch (e.kind) {
      case 'edit':      return 'edit';
      case 'cascade':   return 'folder';
      case 'hint':      return e.tone === 'warning' ? 'warning' : e.tone === 'tip' ? 'sparkle' : 'info';
      case 'revert':    return 'undo';
      case 'undo':      return 'undo';
      case 'saved':     return 'check';
      case 'discarded': return 'trash';
      default:          return 'info';
    }
  }

  /** An edit is stale once the cell no longer holds that value (reverted, undone or changed again). */
  isStale(e: LogEntry): boolean {
    if (e.kind !== 'edit' || e.closed || e.pending) return false;
    return this.level(e.docId!, e.groupId!) !== e.to;
  }
  staleLabel(e: LogEntry): string {
    return this.isChanged(e.docId!, e.groupId!) ? 'Changed again' : 'Reverted';
  }

  get sessionSubline(): string {
    const t = this.sessionStart ? this.sessionStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    return `Started ${t} · ${this.draftSummary}`;
  }

  jumpToEntry(e: LogEntry): void {
    const c = this.changeAt(e.docId!, e.groupId!) ?? { docId: e.docId!, groupId: e.groupId!, from: e.from!, to: e.to!, at: e.at };
    this.jumpTo(c);
  }

  revertEntry(e: LogEntry): void {
    const c = this.changeAt(e.docId!, e.groupId!);
    if (c) this.revert(c);
  }

  runAction(e: LogEntry): void {
    e.action?.run();
    e.actionDone = true;
  }

  revert(c: Change): void { this.revertMany([c]); }

  /** Reverting a folder change also reverts what cascaded from it. */
  revertMany(changes: Change[]): void {
    const all = changes.flatMap(c => [c, ...this.insideOf(c, this.changes)]);
    const step = [...new Map(all.map(c => [this.key(c.docId, c.groupId), c])).values()]
      .map(c => this.write(c.docId, c.groupId, c.from));
    this.undoStack = [...this.undoStack, step];
    const c = changes[0];
    this.pushLog({
      kind: 'revert',
      text: changes.length === 1
        ? `Reverted ${this.group(c.groupId).name} on ${this.doc(c.docId).index} ${this.doc(c.docId).name} back to ${this.permLevels[c.from].label}`
        : `Reverted ${changes.length} changes back to their saved levels`,
    });
  }

  undo(): void {
    const step = this.undoStack[this.undoStack.length - 1];
    if (!step) return;
    const next = { ...this.draft };
    for (const { key, prev } of [...step].reverse()) {
      if (prev) next[key] = prev; else delete next[key];
    }
    this.draft = next;
    this.undoStack = this.undoStack.slice(0, -1);
    this.pushLog({ kind: 'undo', text: step.length > 1 ? `Undid the last step (${step.length} cells)` : 'Undid the last change' });
  }

  /** Puts a saved batch's previous levels back into the draft (not saved yet). */
  revertBatch(b: SavedBatch): void {
    if (this.changeCount === 0) {
      this.sessionStart = new Date();
      this.pushLog({ kind: 'session' });
    }
    const step = b.changes.map(c => this.write(c.docId, c.groupId, c.from, c.via));
    this.undoStack = [...this.undoStack, step];
    this.panelTab = 'activity';
    this.autoOpened = true;
    const n = this.topOf(b.changes).length;
    this.pushLog({ kind: 'revert', text: `Put back the levels from before ${b.author}’s save (${n} ${n === 1 ? 'change' : 'changes'}) — review and save to apply` });
    this.toast.show({ variant: 'info', message: `${n} ${n === 1 ? 'change' : 'changes'} added to your draft — review and save to apply` });
  }

  discardAll(): void {
    const n = this.changeCount;
    this.pushLog({ kind: 'discarded', text: `Discarded ${n} unsaved ${n === 1 ? 'change' : 'changes'}` });
    this.closeSession();
    this.draft = {};
    this.undoStack = [];
    this.discardOpen = false;
    this.changedOnly = false;
    this.toast.show({ variant: 'info', message: 'All unsaved changes discarded' });
  }

  openSaveReview(): void {
    this.saveNote = '';
    this.notifyUsers = false;
    this.saveOpen = true;
  }

  save(): void {
    const changes = this.changes;
    for (const c of changes) this.doc(c.docId).perms[c.groupId] = c.to;
    this.history = [{
      id: this.nextBatchId++, at: new Date(), author: 'John Doe', initials: 'JD',
      note: this.saveNote.trim(), changes,
    }, ...this.history];
    const n0 = this.topOf(changes).length;
    this.pushLog({ kind: 'saved', text: `Saved ${n0} ${n0 === 1 ? 'change' : 'changes'} across ${this.docsIn(changes)} ${this.docsIn(changes) === 1 ? 'document' : 'documents'}.` });
    this.closeSession();
    this.draft = {};
    this.undoStack = [];
    this.saveOpen = false;
    this.changedOnly = false;
    const d = this.docsIn(changes), n = this.topOf(changes).length;
    this.toast.show({
      variant: 'success',
      message: `${n} ${n === 1 ? 'change' : 'changes'} saved across ${d} ${d === 1 ? 'document' : 'documents'}`,
    });
  }

  // ── Navigation ────────────────────────────────────────────

  /** Opens the row a change belongs to and briefly outlines it. */
  jumpTo(c: Change): void {
    if (this.viewMode === 'by-documents') this.selectedGroupId = c.groupId;
    else this.selectedDocId = c.docId;
    this.expandPath(c.docId);
    this.flashKey = this.key(c.docId, c.groupId);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => (this.flashKey = null), 1200);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'by-groups' ? 'by-documents' : 'by-groups';
    this.expandedGroupIds = new Set();
  }

  toggleGroupExpand(id: number): void {
    const s = new Set(this.expandedGroupIds);
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedGroupIds = s;
  }
  isGroupExpanded(id: number): boolean { return this.expandedGroupIds.has(id); }

  togglePanel(): void { this.panelOpen = !this.panelOpen; }
  openPanel(tab: PanelTab): void { this.panelTab = tab; this.panelOpen = true; }

  onNavItem(item: SidebarNavItem): void {
    if (item.id !== 'permissions' && this.changeCount) this.leaveTarget = item;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]')) return;
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && this.undoStack.length) {
      e.preventDefault();
      this.undo();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.changeCount) e.preventDefault();
  }

  ngOnInit(): void { this.tracker.trackPageView(SLUG); }
  ngOnDestroy(): void {
    clearTimeout(this.flashTimer);
    this.timers.forEach(clearTimeout);
    this.tracker.destroyListeners();
  }
}
