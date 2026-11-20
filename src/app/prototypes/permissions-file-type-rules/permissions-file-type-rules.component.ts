import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, FvdrIconName, SidebarNavItem, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permissions-file-type-rules';

/**
 * Permissions — Documents entry and File type rules, built from the Figma
 * "Permissions by file type — Rules on page, no modals (v3)" frames.
 *
 * Flow: the Documents page shows a "File type rules" button with the number of
 * active rules. The rules page lists one row per rule (status, file types, groups,
 * and a 7-step permission level). Adding or editing a rule happens inline in the
 * table — no modals — and the footer bar holds Cancel / Save.
 */

type View = 'documents' | 'rules';
type PickerKind = 'types' | 'groups';

interface PermCol { label: string; icon: FvdrIconName }

interface FileTypeRule {
  id: number;
  enabled: boolean;
  types: string[];
  groups: string[];   // group names, or [ALL_GROUPS]
  level: number;      // 0–7, cumulative across PERM_COLS
}

interface RuleDraft {
  id: number | null;  // null → new rule
  enabled: boolean;
  types: string[];
  groups: string[];
  level: number;
}

interface TableRow {
  key: number;        // stable key for trackBy (0 = new rule)
  editing: boolean;
  rule: FileTypeRule | null;
}

interface DocRow {
  name: string;
  index?: string;
  type?: 'folder' | 'xls' | 'pdf' | 'doc';
  room?: boolean;
  level: number;
  ruleManaged?: boolean;
}

interface Cell { on: boolean; top: boolean }

const ALL_GROUPS = 'All groups';

const GROUP_OPTIONS = ['Bidder Seller', 'Bidder Brd', 'Seller', 'Seller Unt', 'Seller Dept', 'Seller Tm'];

const FILE_TYPE_CATEGORIES: { label: string; types: string[] }[] = [
  { label: 'Spreadsheets', types: ['XLS', 'XLSX', 'XLSM', 'CSV'] },
  { label: 'Documents',    types: ['PDF', 'DOC', 'DOCX'] },
  { label: 'Images',       types: ['JPG', 'PNG', 'RAW'] },
];

const PERM_COLS: PermCol[] = [
  { label: 'Fence',     icon: 'perm-fence' },
  { label: 'View',      icon: 'perm-view' },
  { label: 'Encrypted', icon: 'perm-encrypted' },
  { label: 'PDF',       icon: 'perm-pdf' },
  { label: 'Original',  icon: 'perm-original' },
  { label: 'Upload',    icon: 'perm-upload' },
  { label: 'Manage',    icon: 'perm-manage' },
];

const LEVEL_LABELS = ['No access', ...PERM_COLS.map(c => c.label)];

const DEFAULT_LEVEL = 2;

const DOCUMENT_GROUPS = ['Yellow Co.', 'Red Co.', 'Green Co.', 'Blue Co.', 'White team'];

const DOCUMENTS: DocRow[] = [
  { name: 'Room name', room: true, level: 5 },
  { name: 'Stage folder', index: '1', type: 'folder', level: 2 },
  { name: 'Organizational chart and management', index: '2', type: 'folder', level: 7 },
  { name: 'Corporate DD — Product and Services', index: '3', type: 'folder', level: 2 },
  { name: 'Financial DD — Accounts Receivables', index: '4', type: 'folder', level: 2 },
  { name: 'Key contacts by function', index: '5', type: 'xls', level: 2 },
  { name: 'Tax accounting.xlsx', index: '6', type: 'xls', level: 2 },
  { name: 'Tax returns.pdf', index: '7', type: 'pdf', level: 2 },
  { name: 'Registration with tax authorities', index: '8', type: 'doc', level: 2, ruleManaged: true },
];

const SEED_RULES: FileTypeRule[] = [
  { id: 1, enabled: true,  types: ['XLSX', 'CSV', 'XLS'], groups: [ALL_GROUPS], level: 5 },
  { id: 2, enabled: true,  types: ['DOC'], groups: ['Bidder Seller', 'Seller', 'Seller Unt'], level: 2 },
  { id: 3, enabled: true,  types: ['JPG'], groups: ['Seller Dept'], level: 7 },
  { id: 4, enabled: false, types: ['RAW'], groups: [ALL_GROUPS], level: 2 },
  { id: 5, enabled: false, types: ['DOC', 'PDF'], groups: ['Seller Tm', 'Bidder Brd'], level: 2 },
];

@Component({
  selector: 'fvdr-permissions-file-type-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Project Alpha"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavItem($event)"
        (subItemClick)="onSubNav($event.subItem.id)"
      />

      <div class="main">

        <header class="top-bar">
          <fvdr-breadcrumbs [items]="breadcrumbs" />
          <div class="hdr-actions">
            <button class="ic-btn" aria-label="Dark theme" fvdrTooltip="Dark theme" tooltipPosition="bottom">
              <fvdr-icon name="theme-dark" />
            </button>
            <button class="ic-btn" aria-label="Help" fvdrTooltip="Help" tooltipPosition="bottom">
              <fvdr-icon name="help" />
            </button>
            <fvdr-avatar initials="TN" size="md" />
          </div>
        </header>

        <!-- ═══ Documents entry ═══ -->
        <div class="content" *ngIf="view === 'documents'; else rulesView">
          <div class="toolbar">
            <button type="button" class="tool-btn">Copy from another group</button>
            <button type="button" class="tool-btn">
              <fvdr-icon name="download" />
              Export
            </button>
            <button type="button" class="tool-btn" (click)="setView('rules')">
              <fvdr-icon name="settings-filter" />
              File type rules
              <fvdr-counter [value]="enabledRuleCount" size="s" />
            </button>
            <fvdr-search class="toolbar-search" placeholder="Search" />
          </div>

          <div class="split">
            <section class="panel groups-panel">
              <div class="panel-head">
                <span>Groups</span>
                <button type="button" class="link-btn">
                  <fvdr-icon name="folder-outline" />
                  By documents
                </button>
              </div>
              <ul class="group-list">
                <li class="group-row" *ngFor="let g of documentGroups; let i = index" [class.is-selected]="i === 0">
                  <fvdr-icon name="chevron-right" class="chev" />
                  <fvdr-icon name="nav-participants" />
                  <span>{{ g }}</span>
                </li>
              </ul>
            </section>

            <section class="panel docs-panel">
              <div class="panel-head docs-head">
                <span>Documents</span>
                <div class="perm-heads">
                  <div class="perm-head" *ngFor="let c of permCols">
                    <fvdr-icon [name]="c.icon" />
                    <span>{{ c.label }}</span>
                  </div>
                </div>
              </div>
              <div class="doc-row" *ngFor="let d of documents">
                <div class="doc-name">
                  <span class="doc-index" *ngIf="d.index">{{ d.index }}</span>
                  <span class="room-mark" *ngIf="d.room">RN</span>
                  <fvdr-file-icon *ngIf="d.type" [type]="d.type" />
                  <span class="doc-title">{{ d.name }}</span>
                  <button
                    *ngIf="d.ruleManaged"
                    type="button"
                    class="rule-mark"
                    aria-label="Permissions set by a file type rule"
                    fvdrTooltip="Permissions set by a file type rule. Change them in File type rules."
                    tooltipPosition="top"
                    (click)="setView('rules')"
                  >
                    <fvdr-icon name="settings-filter" />
                  </button>
                </div>
                <div class="bar">
                  <span class="bar-cell" *ngFor="let c of cells(d.level)" [class.on]="c.on" [class.top]="c.top"></span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- ═══ File type rules ═══ -->
        <ng-template #rulesView>
          <div class="content">

            <div class="rules-top">
              <fvdr-btn label="Add rule" iconName="plus" [disabled]="!!draft" (clicked)="addRule()" />
            </div>

            <fvdr-info-banner
              variant="info"
              message="Rules apply to every new upload of the selected file types. Existing files are updated when you save a rule."
            />

            <div class="rules-table" *ngIf="rules.length || draft; else emptyState">

              <div class="tbl-head rule-grid">
                <span>Status</span>
                <span>File type</span>
                <span>Groups</span>
                <div class="perm-heads">
                  <div class="perm-head" *ngFor="let c of permCols">
                    <fvdr-icon [name]="c.icon" />
                    <span>{{ c.label }}</span>
                  </div>
                </div>
              </div>

              <div
                *ngFor="let row of tableRows; trackBy: trackRow"
                class="tbl-row rule-grid"
                [class.is-editing]="row.editing"
                [class.is-muted]="!!draft && !row.editing"
                [class.is-clickable]="!draft && !!row.rule"
                (click)="onRowClick(row)"
              >
                <!-- Status -->
                <div class="cell-status" (click)="$event.stopPropagation()">
                  <fvdr-toggle
                    [checked]="row.editing ? !!draft?.enabled : !!row.rule?.enabled"
                    [disabled]="!!draft && !row.editing"
                    (checkedChange)="onToggle(row, $event)"
                  />
                </div>

                <!-- File types -->
                <div class="cell-picker">
                  <ng-container *ngIf="row.editing && draft; else typeTags">
                    <button
                      type="button"
                      class="picker-trigger"
                      [class.is-open]="openPicker === 'types'"
                      [class.is-error]="!!errors.types"
                      (click)="togglePicker('types')"
                    >
                      <span [class.placeholder]="!draft.types.length">
                        {{ draft.types.length ? draft.types.join(', ') : 'Select' }}
                      </span>
                      <fvdr-icon name="chevron-down" />
                    </button>
                    <div class="field-error" *ngIf="errors.types">{{ errors.types }}</div>

                    <div class="picker" *ngIf="openPicker === 'types'">
                      <fvdr-search placeholder="Search" [(ngModel)]="pickerQuery" />
                      <div class="picker-list">
                        <div class="picker-cat" *ngFor="let cat of filteredCategories">
                          <fvdr-checkbox
                            [label]="cat.label"
                            [checked]="allTypesOf(cat.types)"
                            [indeterminate]="someTypesOf(cat.types)"
                            (checkedChange)="toggleCategory(cat.types, $event)"
                          />
                          <div class="picker-sub">
                            <fvdr-checkbox
                              *ngFor="let t of cat.types"
                              [label]="t"
                              [checked]="isTypeSelected(t)"
                              (checkedChange)="toggleType(t)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <ng-template #typeTags>
                    <div class="tags">
                      <span class="tag" *ngFor="let t of row.rule?.types">{{ t }}</span>
                    </div>
                  </ng-template>
                </div>

                <!-- Groups -->
                <div class="cell-picker">
                  <ng-container *ngIf="row.editing && draft; else groupTags">
                    <button
                      type="button"
                      class="picker-trigger"
                      [class.is-open]="openPicker === 'groups'"
                      [class.is-error]="!!errors.groups"
                      (click)="togglePicker('groups')"
                    >
                      <span [class.placeholder]="!draft.groups.length">
                        {{ draft.groups.length ? draft.groups.join(', ') : 'Select' }}
                      </span>
                      <fvdr-icon name="chevron-down" />
                    </button>
                    <div class="field-error" *ngIf="errors.groups">{{ errors.groups }}</div>

                    <div class="picker picker--groups" *ngIf="openPicker === 'groups'">
                      <div class="picker-list">
                        <fvdr-checkbox
                          [label]="allGroupsLabel"
                          [checked]="isGroupSelected(allGroupsLabel)"
                          (checkedChange)="toggleGroup(allGroupsLabel)"
                        />
                        <fvdr-checkbox
                          *ngFor="let g of groupOptions"
                          [label]="g"
                          [checked]="isGroupSelected(g)"
                          [disabled]="isGroupSelected(allGroupsLabel)"
                          (checkedChange)="toggleGroup(g)"
                        />
                      </div>
                    </div>
                  </ng-container>

                  <ng-template #groupTags>
                    <div class="tags">
                      <span class="tag tag--group" *ngFor="let g of row.rule?.groups">
                        <fvdr-icon [name]="g === allGroupsLabel ? 'users-groups' : 'nav-participants'" />
                        {{ g }}
                      </span>
                    </div>
                  </ng-template>
                </div>

                <!-- Permission levels: cumulative bar; in edit mode each segment sets the level -->
                <div class="bar">
                  <span
                    *ngFor="let c of cells(levelOf(row)); let i = index"
                    class="bar-cell"
                    [class.on]="c.on"
                    [class.top]="c.top"
                    [class.editable]="row.editing"
                    [attr.role]="row.editing ? 'button' : null"
                    [attr.aria-label]="row.editing ? levelLabels[i + 1] : null"
                    [fvdrTooltip]="row.editing ? levelLabels[i + 1] : ''"
                    tooltipPosition="top"
                    (click)="onLevelClick(row, i + 1, $event)"
                  ></span>
                </div>
              </div>
            </div>

            <ng-template #emptyState>
              <div class="empty">
                <div class="empty-art" aria-hidden="true">
                  <span class="empty-folder"></span>
                </div>
                <p class="empty-title">No file type rules yet</p>
                <p class="empty-text">Set permissions once for each file type</p>
                <fvdr-btn label="Add rule" iconName="plus" (clicked)="addRule()" />
              </div>
            </ng-template>

          </div>

          <footer class="edit-bar" *ngIf="draft">
            <fvdr-btn variant="secondary" label="Cancel" (clicked)="cancelDraft()" />
            <fvdr-btn label="Save" (clicked)="saveDraft()" />
            <span class="spacer"></span>
            <fvdr-btn
              *ngIf="draft.id !== null"
              variant="danger-secondary"
              label="Delete rule"
              (clicked)="deleteDraft()"
            />
          </footer>
        </ng-template>

      </div>

      <fvdr-toast-host />
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family);
      background: var(--color-stone-0);
      color: var(--color-text-primary);
    }
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

    /* ── Header ── */
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

    /* ── Content ── */
    .content {
      flex: 1; min-height: 0;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: var(--space-4);
      padding: var(--space-6);
    }

    /* ── Shared buttons ── */
    .toolbar { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
    .toolbar-search { margin-left: auto; width: 320px; }
    .tool-btn {
      height: 36px; padding: 0 var(--space-3);
      display: inline-flex; align-items: center; gap: var(--space-2);
      white-space: nowrap;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font: inherit; font-size: var(--font-size-base);
      cursor: pointer;
    }
    .tool-btn:hover { background: var(--color-hover-bg); }
    .link-btn {
      background: none; border: none; padding: 0; cursor: pointer;
      display: inline-flex; align-items: center; gap: var(--space-1);
      color: var(--color-primary-500); font: inherit; font-size: var(--font-size-base);
    }

    /* ── Documents entry ── */
    .split { flex: 1; min-height: 0; display: flex; gap: var(--space-4); }
    .panel { display: flex; flex-direction: column; min-width: 0; }
    .groups-panel { width: 320px; flex-shrink: 0; }
    .docs-panel { flex: 1; }
    .panel-head {
      min-height: 48px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-4);
      background: var(--color-stone-200);
      font-weight: 600;
    }
    .group-list { list-style: none; margin: 0; padding: 0; }
    .group-row {
      height: 48px; display: flex; align-items: center; gap: var(--space-2);
      padding: 0 var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      cursor: pointer;
    }
    .group-row:hover { background: var(--color-hover-bg); }
    .group-row.is-selected { background: var(--color-primary-50); }
    .group-row .chev { color: var(--color-stone-600); }
    .docs-head { gap: var(--space-4); }
    .doc-row {
      min-height: 48px; display: grid; grid-template-columns: minmax(0, 1fr) 434px;
      align-items: center; column-gap: var(--space-4);
      padding: 0 var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .doc-name { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .doc-index { width: 16px; color: var(--color-text-secondary); }
    .doc-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .room-mark {
      width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm); background: var(--color-primary-500);
      color: var(--color-stone-0); font-size: var(--text-caption1-size); font-weight: 600;
    }
    .rule-mark {
      background: none; border: none; padding: 0; cursor: pointer;
      color: var(--color-primary-500); display: inline-flex;
    }

    /* ── Permission bar (7 levels) ── */
    .perm-heads { display: grid; grid-template-columns: repeat(7, 1fr); }
    .perm-head {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
      font-size: var(--text-caption1-size); font-weight: 400; color: var(--color-text-secondary);
      text-align: center;
    }
    .bar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .bar-cell {
      height: 8px; border-radius: 2px;
      background: var(--color-stone-300);
    }
    .bar-cell.on { background: var(--color-primary-200); }
    .bar-cell.top { background: var(--color-primary-500); }
    .bar-cell.editable { cursor: pointer; height: 16px; }
    .bar-cell.editable:hover { outline: 1px solid var(--color-primary-500); outline-offset: 1px; }

    /* ── Rules page ── */
    .rules-top { display: flex; align-items: center; }
    .rules-table { display: flex; flex-direction: column; }
    .rule-grid {
      display: grid;
      grid-template-columns: 64px minmax(170px, 1fr) minmax(200px, 1.3fr) 434px;
      align-items: center; column-gap: var(--space-4);
      padding: 0 var(--space-4);
    }
    .tbl-head {
      min-height: 48px;
      background: var(--color-stone-200);
      font-weight: 600;
    }
    .tbl-row {
      min-height: 56px;
      border-bottom: 1px solid var(--color-divider);
      position: relative;
    }
    .tbl-row.is-clickable { cursor: pointer; }
    .tbl-row.is-clickable:hover { background: var(--color-hover-bg); }
    .tbl-row.is-editing { background: var(--color-primary-50); }
    .tbl-row.is-muted { opacity: 0.6; }

    .cell-picker { position: relative; min-width: 0; padding: var(--space-2) 0; }
    .tags { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .tag {
      display: inline-flex; align-items: center; gap: var(--space-1);
      height: 24px; padding: 0 var(--space-2);
      background: var(--color-stone-300);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-base); color: var(--color-text-primary);
      white-space: nowrap;
    }
    .tag--group { background: var(--color-stone-200); border: 1px solid var(--color-stone-400); }
    .tag--group fvdr-icon { color: var(--color-info-500); }

    .picker-trigger {
      width: 100%; height: 36px; min-width: 0;
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
      padding: 0 var(--space-3);
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      font: inherit; font-size: var(--font-size-base); color: var(--color-text-primary);
      text-align: left; cursor: pointer;
    }
    .picker-trigger span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
    .picker-trigger .placeholder { color: var(--color-text-placeholder); }
    .picker-trigger:hover,
    .picker-trigger.is-open { border-color: var(--color-primary-500); }
    .picker-trigger.is-error { border-color: var(--color-error-600); }
    .field-error {
      margin-top: var(--space-1);
      font-size: var(--text-caption1-size); color: var(--color-error-600);
    }

    .picker {
      position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 20;
      width: 320px; max-height: 360px; overflow-y: auto;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .picker--groups { width: 280px; }
    .picker-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .picker-sub { display: flex; flex-direction: column; gap: var(--space-2); padding-left: var(--space-6); }

    /* ── Empty state ── */
    .empty {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: var(--space-2);
      padding: var(--space-10) 0;
    }
    .empty-art { position: relative; width: 120px; height: 96px; margin-bottom: var(--space-2); }
    .empty-folder {
      position: absolute; left: 24px; bottom: 8px;
      width: 88px; height: 56px;
      background: var(--color-primary-200);
      border-radius: var(--radius-sm);
    }
    .empty-folder::before {
      content: ''; position: absolute; left: 0; top: -8px;
      width: 36px; height: 12px;
      background: var(--color-primary-500);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }
    .empty-title { margin: 0; font-weight: 600; font-size: var(--font-size-base); }
    .empty-text { margin: 0; color: var(--color-text-secondary); }
    .empty fvdr-btn { margin-top: var(--space-3); }

    /* ── Footer for inline editing ── */
    .edit-bar {
      flex-shrink: 0;
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      background: var(--color-stone-0);
      border-top: 1px solid var(--color-divider);
    }
    .spacer { flex: 1; }
  `],
})
export class PermissionsFileTypeRulesComponent implements OnInit, OnDestroy {
  private readonly tracker = inject(TrackerService);
  private readonly toast = inject(ToastService);

  // ── Static data exposed to the template ───────────────────
  readonly permCols = PERM_COLS;
  readonly levelLabels = LEVEL_LABELS;
  readonly groupOptions = GROUP_OPTIONS;
  readonly allGroupsLabel = ALL_GROUPS;
  readonly documentGroups = DOCUMENT_GROUPS;
  readonly documents = DOCUMENTS;
  /** Precomputed bar states per level (0–7) — keeps template bindings stable. */
  private readonly levelCells: Cell[][] = Array.from({ length: PERM_COLS.length + 1 }, (_, level) =>
    Array.from({ length: PERM_COLS.length }, (_, i) => ({ on: i < level, top: i === level - 1 })),
  );

  // ── State ─────────────────────────────────────────────────
  view: View = 'documents';
  sidebarCollapsed = false;

  rules: FileTypeRule[] = SEED_RULES.map(r => ({ ...r, types: [...r.types], groups: [...r.groups] }));
  private nextRuleId = SEED_RULES.length + 1;

  /** Inline edit state: a draft for an existing rule (id set) or a new one (id null). */
  draft: RuleDraft | null = null;
  errors: { types?: string; groups?: string } = {};

  openPicker: PickerKind | null = null;
  pickerQuery = '';

  navItems: SidebarNavItem[] = [];

  constructor() {
    this.buildNav();
  }

  // ── Derived ───────────────────────────────────────────────

  get enabledRuleCount(): number { return this.rules.filter(r => r.enabled).length; }

  get breadcrumbs(): { id: string; label: string }[] {
    return this.view === 'documents'
      ? [{ id: 'permission', label: 'Permission' }, { id: 'documents', label: 'Documents' }]
      : [{ id: 'permission', label: 'Permission' }, { id: 'rules', label: 'File type rules' }];
  }

  get filteredCategories(): { label: string; types: string[] }[] {
    const q = this.pickerQuery.trim().toLowerCase();
    if (!q) return FILE_TYPE_CATEGORIES;
    return FILE_TYPE_CATEGORIES
      .map(c => ({ label: c.label, types: c.types.filter(t => t.toLowerCase().includes(q)) }))
      .filter(c => c.types.length > 0);
  }

  /** Rows for the rules table: the new draft (if any) on top, then the saved rules. */
  get tableRows(): TableRow[] {
    const rows: TableRow[] = [];
    if (this.draft && this.draft.id === null) rows.push({ key: 0, editing: true, rule: null });
    for (const rule of this.rules) {
      rows.push({ key: rule.id, editing: this.draft?.id === rule.id, rule });
    }
    return rows;
  }

  cells(level: number): Cell[] { return this.levelCells[level] ?? this.levelCells[0]; }

  levelOf(row: TableRow): number {
    if (row.editing && this.draft) return this.draft.level;
    return row.rule?.level ?? 0;
  }

  trackRow = (_: number, row: TableRow): number => row.key;

  // ── Navigation ────────────────────────────────────────────

  private buildNav(): void {
    this.navItems = [
      { id: 'documents',   label: 'Documents',   icon: 'documents',       iconActive: 'documents-active' },
      { id: 'users',       label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
      {
        id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active',
        active: true, open: true,
        children: [
          { id: 'perm-documents', label: 'Documents', active: this.view === 'documents' },
          { id: 'perm-qa',        label: 'Q&A attachments' },
          { id: 'perm-rules',     label: 'File type rules', active: this.view === 'rules' },
        ],
      },
      { id: 'reports',  label: 'Reports',    icon: 'nav-reports',  iconActive: 'nav-reports-active' },
      { id: 'settings', label: 'Settings',   icon: 'nav-settings', iconActive: 'nav-settings-active' },
      { id: 'recycle',  label: 'Recycle bin', icon: 'trash',       iconActive: 'trash' },
    ];
  }

  onNavItem(item: SidebarNavItem): void {
    if (item.id === 'permissions') this.setView('documents');
  }

  onSubNav(id: string): void {
    if (id === 'perm-documents') this.setView('documents');
    if (id === 'perm-rules') this.setView('rules');
  }

  setView(view: View): void {
    if (this.view === view) return;
    this.cancelDraft();
    this.view = view;
    this.buildNav();
  }

  // ── Rule editing ──────────────────────────────────────────

  addRule(): void {
    if (this.draft) return;
    this.draft = { id: null, enabled: false, types: [], groups: [], level: DEFAULT_LEVEL };
    this.errors = {};
  }

  editRule(rule: FileTypeRule): void {
    if (this.draft) return;
    this.draft = { id: rule.id, enabled: rule.enabled, types: [...rule.types], groups: [...rule.groups], level: rule.level };
    this.errors = {};
  }

  onRowClick(row: TableRow): void {
    if (!this.draft && row.rule) this.editRule(row.rule);
  }

  onToggle(row: TableRow, checked: boolean): void {
    if (row.editing && this.draft) {
      this.draft.enabled = checked;
    } else if (row.rule) {
      row.rule.enabled = checked;
    }
  }

  onLevelClick(row: TableRow, level: number, event: MouseEvent): void {
    if (!row.editing || !this.draft) return;
    event.stopPropagation();
    this.draft.level = level;
  }

  togglePicker(kind: PickerKind): void {
    this.openPicker = this.openPicker === kind ? null : kind;
    if (this.openPicker === 'types') this.pickerQuery = '';
  }

  isTypeSelected(type: string): boolean {
    return !!this.draft?.types.includes(type);
  }

  allTypesOf(types: string[]): boolean {
    return types.length > 0 && types.every(t => this.isTypeSelected(t));
  }

  someTypesOf(types: string[]): boolean {
    return types.some(t => this.isTypeSelected(t)) && !this.allTypesOf(types);
  }

  toggleType(type: string): void {
    if (!this.draft) return;
    const list = this.draft.types;
    this.draft.types = list.includes(type) ? list.filter(t => t !== type) : [...list, type];
    this.errors = { ...this.errors, types: undefined };
  }

  toggleCategory(types: string[], checked: boolean): void {
    if (!this.draft) return;
    const rest = this.draft.types.filter(t => !types.includes(t));
    this.draft.types = checked ? [...rest, ...types] : rest;
    this.errors = { ...this.errors, types: undefined };
  }

  isGroupSelected(group: string): boolean {
    return !!this.draft?.groups.includes(group);
  }

  toggleGroup(group: string): void {
    if (!this.draft) return;
    const list = this.draft.groups;
    if (group === ALL_GROUPS) {
      this.draft.groups = list.includes(ALL_GROUPS) ? [] : [ALL_GROUPS];
    } else {
      const without = list.filter(g => g !== ALL_GROUPS);
      this.draft.groups = without.includes(group) ? without.filter(g => g !== group) : [...without, group];
    }
    this.errors = { ...this.errors, groups: undefined };
  }

  cancelDraft(): void {
    this.draft = null;
    this.errors = {};
    this.openPicker = null;
  }

  saveDraft(): void {
    if (!this.draft) return;
    const errors: { types?: string; groups?: string } = {};
    if (!this.draft.types.length) errors.types = 'Choose at least one file type';
    if (!this.draft.groups.length) errors.groups = 'Choose at least one group';
    this.errors = errors;
    if (errors.types || errors.groups) return;

    const { id, enabled, types, groups, level } = this.draft;
    if (id === null) {
      this.rules = [{ id: this.nextRuleId++, enabled, types, groups, level }, ...this.rules];
    } else {
      this.rules = this.rules.map(r => (r.id === id ? { id, enabled, types, groups, level } : r));
    }
    this.toast.show({
      variant: 'success',
      message: 'File type rule saved. Existing files were updated.',
    });
    this.cancelDraft();
  }

  deleteDraft(): void {
    if (!this.draft || this.draft.id === null) return;
    const id = this.draft.id;
    this.rules = this.rules.filter(r => r.id !== id);
    this.toast.show({ variant: 'info', message: 'File type rule deleted' });
    this.cancelDraft();
  }

  // ── Outside click / Escape close pickers ──────────────────

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(e: MouseEvent): void {
    if (!this.openPicker) return;
    const target = e.target as Element | null;
    if (target?.closest?.('.picker, .picker-trigger')) return;
    this.openPicker = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.openPicker) this.openPicker = null;
  }

  ngOnInit(): void { this.tracker.trackPageView(SLUG); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }
}
