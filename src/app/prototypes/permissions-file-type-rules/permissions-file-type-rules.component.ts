import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, FvdrIconName, SegmentItem, SidebarNavItem, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permissions-file-type-rules';

/**
 * Permissions — File type rules, three interaction versions behind a switcher.
 *
 *  A · Read-only + Edit   Rules table is read-only. The row "…" menu opens Edit,
 *                         which turns that row's cells into inputs. No status column.
 *  B · Inline inputs      Every cell is an input. Status, file types, groups and the
 *                         permission bar change on the fly.
 *  C · Click to edit      The table stays read-only until you click a status toggle, a
 *                         permission segment or the edit icon next to the chips.
 *
 * All versions share one draft model: a change creates a draft for its row, and the
 * footer's Cancel / Save applies every draft at once.
 */

type View = 'documents' | 'rules';
type Variant = 'read' | 'inline' | 'click';
type FieldKind = 'types' | 'groups' | 'perm';

interface PermCol { label: string; icon: FvdrIconName }

interface RuleState {
  enabled: boolean;
  types: string[];
  groups: string[];   // group names, or [ALL_GROUPS]
  level: number;      // 0–7, cumulative across PERM_COLS
  applyNoAccess?: boolean;  // set in the Add rule dialog
  folders?: string[];       // folders selected in the Add rule dialog
}

type ModalPicker = 'types' | 'groups' | 'folders' | 'perm';

interface ModalDraft {
  types: string[];
  groups: string[];
  level: number;
  applyNoAccess: boolean;
  folders: string[];
}

interface FileTypeRule extends RuleState { id: number }

interface TableRow {
  key: number;        // stable key for trackBy (0 = new rule)
  rule: FileTypeRule | null;
  editing: boolean;
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

interface FieldErrors { types?: string; groups?: string }

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

/** Icons for levels 0–7; "No access" uses the close icon, as in the Figma dropdown. */
const PERM_ICONS: FvdrIconName[] = ['cancel', ...PERM_COLS.map(c => c.icon)];

const LEVEL_OPTIONS = LEVEL_LABELS.map((label, level) => ({ level, label, icon: PERM_ICONS[level] }));

const DEFAULT_LEVEL = 2;

const VARIANTS: SegmentItem[] = [
  { id: 'read',   label: 'A · Read-only + Edit' },
  { id: 'inline', label: 'B · Inline inputs' },
  { id: 'click',  label: 'C · Click to edit' },
];

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

const FOLDER_OPTIONS = DOCUMENTS.filter(d => d.type === 'folder').map(d => `${d.index} ${d.name}`);

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
              <fvdr-btn label="Add rule" iconName="plus" [disabled]="!!drafts[0]" (clicked)="addRule()" />
              <div class="variant-switch">
                <span class="variant-caption">Prototype version</span>
                <fvdr-segment [items]="variantItems" [activeId]="variant" (activeIdChange)="setVariant($event)" />
              </div>
            </div>

            <fvdr-info-banner
              variant="info"
              message="Rules apply to every new upload of the selected file types. Existing files are updated when you save a rule."
            />

            <div class="rules-table" *ngIf="tableRows.length; else emptyState">

              <div class="tbl-head rule-grid" [ngClass]="gridClass">
                <span *ngIf="variant !== 'read'">Status</span>
                <span>File type</span>
                <span>Groups</span>
                <div class="perm-heads" *ngIf="variant !== 'read'">
                  <div class="perm-head" *ngFor="let c of permCols">
                    <fvdr-icon [name]="c.icon" />
                    <span>{{ c.label }}</span>
                  </div>
                </div>
                <span *ngIf="variant === 'read'">Permission</span>
                <span *ngIf="variant === 'read'"></span>
              </div>

              <div
                *ngFor="let row of tableRows; trackBy: trackRow"
                class="tbl-row rule-grid"
                [ngClass]="gridClass"
                [class.is-editing]="row.editing"
                [class.is-muted]="variant !== 'inline' && hasDrafts && !row.editing"
              >
                <!-- Status (B and C) -->
                <div class="cell-status" *ngIf="variant !== 'read'">
                  <fvdr-toggle
                    [checked]="stateOf(row).enabled"
                    (checkedChange)="onToggle(row, $event)"
                  />
                </div>

                <!-- File types -->
                <div class="cell-field">
                  <ng-container *ngIf="inputMode(row); else staticTypes">
                    <div
                      class="field"
                      [class.is-open]="isPicker(row, 'types')"
                      [class.is-error]="!!errors[row.key]?.types"
                      (click)="openPicker(row, 'types')"
                    >
                      <span class="chip" *ngFor="let t of stateOf(row).types">
                        {{ t }}
                        <button type="button" class="chip-x" [attr.aria-label]="'Remove ' + t" (click)="removeChip(row, 'types', t, $event)">
                          <fvdr-icon name="close" />
                        </button>
                      </span>
                      <span class="field-placeholder" *ngIf="!stateOf(row).types.length">Select</span>
                      <fvdr-icon name="chevron-down" class="field-chev" />
                    </div>
                    <div class="field-error" *ngIf="errors[row.key]?.types">{{ errors[row.key]?.types }}</div>

                    <div class="picker" *ngIf="isPicker(row, 'types')">
                      <fvdr-search placeholder="Search" [(ngModel)]="pickerQuery" />
                      <div class="picker-list">
                        <div class="picker-cat" *ngFor="let cat of filteredCategories">
                          <fvdr-checkbox
                            [label]="cat.label"
                            [checked]="allTypesOf(row.key, cat.types)"
                            [indeterminate]="someTypesOf(row.key, cat.types)"
                            (checkedChange)="toggleCategory(row.key, cat.types, $event)"
                          />
                          <div class="picker-sub">
                            <fvdr-checkbox
                              *ngFor="let t of cat.types"
                              [label]="t"
                              [checked]="isTypeSelected(row.key, t)"
                              (checkedChange)="toggleType(row.key, t)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <ng-template #staticTypes>
                    <div class="static">
                      <span class="tag" *ngFor="let t of stateOf(row).types">{{ t }}</span>
                      <button
                        *ngIf="pencilVisible(row)"
                        type="button"
                        class="edit-ic"
                        aria-label="Edit file types"
                        fvdrTooltip="Edit file types"
                        tooltipPosition="top"
                        (click)="openPicker(row, 'types')"
                      >
                        <fvdr-icon name="edit" />
                      </button>
                    </div>
                  </ng-template>
                </div>

                <!-- Groups -->
                <div class="cell-field">
                  <ng-container *ngIf="inputMode(row); else staticGroups">
                    <div
                      class="field"
                      [class.is-open]="isPicker(row, 'groups')"
                      [class.is-error]="!!errors[row.key]?.groups"
                      (click)="openPicker(row, 'groups')"
                    >
                      <span class="chip chip--group" *ngFor="let g of stateOf(row).groups">
                        <fvdr-icon [name]="g === allGroupsLabel ? 'users-groups' : 'nav-participants'" />
                        {{ g }}
                        <button type="button" class="chip-x" [attr.aria-label]="'Remove ' + g" (click)="removeChip(row, 'groups', g, $event)">
                          <fvdr-icon name="close" />
                        </button>
                      </span>
                      <span class="field-placeholder" *ngIf="!stateOf(row).groups.length">Select</span>
                      <fvdr-icon name="chevron-down" class="field-chev" />
                    </div>
                    <div class="field-error" *ngIf="errors[row.key]?.groups">{{ errors[row.key]?.groups }}</div>

                    <div class="picker picker--groups" *ngIf="isPicker(row, 'groups')">
                      <div class="picker-list">
                        <fvdr-checkbox
                          [label]="allGroupsLabel"
                          [checked]="isGroupSelected(row.key, allGroupsLabel)"
                          (checkedChange)="toggleGroup(row.key, allGroupsLabel)"
                        />
                        <fvdr-checkbox
                          *ngFor="let g of groupOptions"
                          [label]="g"
                          [checked]="isGroupSelected(row.key, g)"
                          [disabled]="isGroupSelected(row.key, allGroupsLabel)"
                          (checkedChange)="toggleGroup(row.key, g)"
                        />
                      </div>
                    </div>
                  </ng-container>

                  <ng-template #staticGroups>
                    <div class="static">
                      <span class="tag tag--group" *ngFor="let g of stateOf(row).groups">
                        <fvdr-icon [name]="g === allGroupsLabel ? 'users-groups' : 'nav-participants'" />
                        {{ g }}
                      </span>
                      <button
                        *ngIf="pencilVisible(row)"
                        type="button"
                        class="edit-ic"
                        aria-label="Edit groups"
                        fvdrTooltip="Edit groups"
                        tooltipPosition="top"
                        (click)="openPicker(row, 'groups')"
                      >
                        <fvdr-icon name="edit" />
                      </button>
                    </div>
                  </ng-template>
                </div>

                <!-- Permission level: a dropdown while editing in A, otherwise the cumulative bar -->
                <div class="cell-field" *ngIf="variant === 'read'; else barTpl">
                  <div class="perm-value" *ngIf="!row.editing">
                    <fvdr-icon [name]="permIcon(levelOf(row))" />
                    <span>{{ levelLabels[levelOf(row)] }}</span>
                  </div>
                  <div class="field perm-field" *ngIf="row.editing" [class.is-open]="isPicker(row, 'perm')" (click)="openPicker(row, 'perm')">
                    <fvdr-icon [name]="permIcon(levelOf(row))" />
                    <span>{{ levelLabels[levelOf(row)] }}</span>
                    <fvdr-icon name="chevron-down" class="field-chev" />
                  </div>
                  <div class="picker picker--perm" *ngIf="isPicker(row, 'perm')">
                    <button
                      *ngFor="let o of levelOptions"
                      type="button"
                      class="perm-option"
                      [class.is-selected]="o.level === levelOf(row)"
                      (click)="pickLevel(row, o.level, $event)"
                    >
                      <fvdr-icon [name]="o.icon" />
                      <span>{{ o.label }}</span>
                    </button>
                  </div>
                </div>

                <ng-template #barTpl>
                <!-- Clickable segments where the version allows editing. -->
                <div class="bar">
                  <span
                    *ngFor="let c of cells(levelOf(row)); let i = index"
                    class="bar-cell"
                    [class.on]="c.on"
                    [class.top]="c.top"
                    [class.editable]="isLive(row)"
                    [attr.role]="isLive(row) ? 'button' : null"
                    [attr.aria-label]="isLive(row) ? levelLabels[i + 1] : null"
                    [fvdrTooltip]="isLive(row) ? levelLabels[i + 1] : ''"
                    tooltipPosition="top"
                    (click)="onLevelClick(row, i + 1, $event)"
                  ></span>
                </div>
                </ng-template>

                <!-- Row actions (A only) -->
                <div class="cell-actions" *ngIf="variant === 'read'">
                  <ng-container *ngIf="row.rule && !row.editing">
                    <button type="button" class="more-btn" aria-label="Rule actions" (click)="toggleMenu(row.key, $event)">
                      <fvdr-icon name="more" />
                    </button>
                    <div class="menu" *ngIf="menuFor === row.key">
                      <button type="button" class="menu-item" (click)="startEdit(row, $event)">
                        <fvdr-icon name="edit" />
                        Edit
                      </button>
                      <button type="button" class="menu-item menu-item--danger" (click)="deleteRule(row.key, $event)">
                        <fvdr-icon name="trash" />
                        Delete
                      </button>
                    </div>
                  </ng-container>
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

          <footer class="edit-bar" *ngIf="hasDrafts">
            <fvdr-btn variant="secondary" label="Cancel" (clicked)="cancelAll()" />
            <fvdr-btn label="Save" (clicked)="saveAll()" />
            <div class="warn" *ngIf="lowerAccessWarning as warning">
              <fvdr-icon name="warning" />
              <span>{{ warning }}</span>
            </div>
          </footer>
        </ng-template>

      </div>

      <fvdr-modal
        [visible]="modalOpen"
        title="Set permissions by file type"
        size="md"
        confirmLabel="Apply"
        cancelLabel="Cancel"
        (confirmed)="applyModal()"
        (cancelled)="closeModal()"
        (closed)="onModalClosed()"
      >
        <div class="m-form">

          <div class="m-field">
            <span class="m-label">File types</span>
            <div class="field" [class.is-open]="modalPicker === 'types'" [class.is-error]="!!modalErrors.types" (click)="toggleModalPicker('types')">
              <span class="chip" *ngFor="let t of modalDraft.types">
                {{ t }}
                <button type="button" class="chip-x" [attr.aria-label]="'Remove ' + t" (click)="modalRemoveType(t, $event)">
                  <fvdr-icon name="close" />
                </button>
              </span>
              <span class="field-placeholder" *ngIf="!modalDraft.types.length">Select</span>
              <button *ngIf="modalDraft.types.length" type="button" class="clear-btn" aria-label="Clear file types" (click)="modalClearTypes($event)">
                <fvdr-icon name="close" />
              </button>
              <fvdr-icon name="chevron-down" class="field-chev" />
            </div>
            <div class="field-error" *ngIf="modalErrors.types">{{ modalErrors.types }}</div>
            <div class="m-panel" *ngIf="modalPicker === 'types'">
              <fvdr-search placeholder="Search" [(ngModel)]="pickerQuery" />
              <div class="picker-list">
                <div class="picker-cat" *ngFor="let cat of filteredCategories">
                  <fvdr-checkbox
                    [label]="cat.label"
                    [checked]="allModalTypesOf(cat.types)"
                    [indeterminate]="someModalTypesOf(cat.types)"
                    (checkedChange)="modalToggleCategory(cat.types, $event)"
                  />
                  <div class="picker-sub">
                    <fvdr-checkbox
                      *ngFor="let t of cat.types"
                      [label]="t"
                      [checked]="isModalTypeSelected(t)"
                      (checkedChange)="modalToggleType(t)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="m-field">
            <span class="m-label">Permission</span>
            <div class="field perm-field m-full" [class.is-open]="modalPicker === 'perm'" (click)="toggleModalPicker('perm')">
              <fvdr-icon [name]="permIcon(modalDraft.level)" />
              <span>{{ levelLabels[modalDraft.level] }}</span>
              <fvdr-icon name="chevron-down" class="field-chev" />
            </div>
            <div class="m-panel" *ngIf="modalPicker === 'perm'">
              <button
                *ngFor="let o of levelOptions"
                type="button"
                class="perm-option"
                [class.is-selected]="o.level === modalDraft.level"
                (click)="modalPickLevel(o.level)"
              >
                <fvdr-icon [name]="o.icon" />
                <span>{{ o.label }}</span>
              </button>
            </div>
          </div>

          <fvdr-checkbox
            label="Apply to files that have no access"
            [checked]="modalDraft.applyNoAccess"
            (checkedChange)="setApplyNoAccess($event)"
          />

          <div class="m-field">
            <span class="m-label">Groups</span>
            <div class="field" [class.is-open]="modalPicker === 'groups'" [class.is-error]="!!modalErrors.groups" (click)="toggleModalPicker('groups')">
              <span class="chip chip--group" *ngFor="let g of modalDraft.groups">
                <fvdr-icon [name]="g === allGroupsLabel ? 'users-groups' : 'nav-participants'" />
                {{ g }}
                <button type="button" class="chip-x" [attr.aria-label]="'Remove ' + g" (click)="modalRemoveGroup(g, $event)">
                  <fvdr-icon name="close" />
                </button>
              </span>
              <span class="field-placeholder" *ngIf="!modalDraft.groups.length">Select</span>
              <button *ngIf="modalDraft.groups.length" type="button" class="clear-btn" aria-label="Clear groups" (click)="modalClearGroups($event)">
                <fvdr-icon name="close" />
              </button>
              <fvdr-icon name="chevron-down" class="field-chev" />
            </div>
            <div class="field-error" *ngIf="modalErrors.groups">{{ modalErrors.groups }}</div>
            <div class="m-panel" *ngIf="modalPicker === 'groups'">
              <fvdr-checkbox
                [label]="allGroupsLabel"
                [checked]="isModalGroupSelected(allGroupsLabel)"
                (checkedChange)="modalToggleGroup(allGroupsLabel)"
              />
              <fvdr-checkbox
                *ngFor="let g of groupOptions"
                [label]="g"
                [checked]="isModalGroupSelected(g)"
                [disabled]="isModalGroupSelected(allGroupsLabel)"
                (checkedChange)="modalToggleGroup(g)"
              />
            </div>
          </div>

          <div class="m-field">
            <button type="button" class="m-link" (click)="toggleModalPicker('folders')">Select folders</button>
            <div class="m-chips" *ngIf="modalDraft.folders.length">
              <span class="chip" *ngFor="let f of modalDraft.folders">
                <fvdr-icon name="folder" />
                {{ f }}
                <button type="button" class="chip-x" [attr.aria-label]="'Remove ' + f" (click)="modalRemoveFolder(f, $event)">
                  <fvdr-icon name="close" />
                </button>
              </span>
            </div>
            <div class="m-panel" *ngIf="modalPicker === 'folders'">
              <fvdr-checkbox
                *ngFor="let f of folderOptions"
                [label]="f"
                [checked]="modalDraft.folders.includes(f)"
                (checkedChange)="modalToggleFolder(f)"
              />
            </div>
          </div>

        </div>
      </fvdr-modal>

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
    .rules-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
    .variant-switch { display: flex; align-items: center; gap: var(--space-3); }
    .variant-caption { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .rules-table { display: flex; flex-direction: column; }
    .rule-grid {
      display: grid;
      align-items: center; column-gap: var(--space-4);
      padding: 0 var(--space-4);
    }
    .rule-grid.grid--full {
      grid-template-columns: 64px minmax(190px, 1fr) minmax(220px, 1.3fr) 434px;
    }
    .rule-grid.grid--read {
      grid-template-columns: minmax(190px, 1fr) minmax(220px, 1.3fr) 240px 40px;
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
    .tbl-row:hover { background: var(--color-hover-bg); }
    .tbl-row.is-editing { background: var(--color-primary-50); }
    .tbl-row.is-editing:hover { background: var(--color-primary-50); }
    .tbl-row.is-muted { opacity: 0.6; }

    .cell-field { position: relative; min-width: 0; padding: var(--space-2) 0; }
    .static { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); min-height: 36px; }
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

    .edit-ic {
      background: none; border: none; padding: 0 var(--space-1); cursor: pointer;
      color: var(--color-primary-500); display: inline-flex; align-items: center;
      opacity: 0;
    }
    .tbl-row:hover .edit-ic,
    .edit-ic:focus-visible { opacity: 1; }

    /* Input-style field: chips with remove buttons, chevron on the right */
    .field {
      position: relative;
      min-height: 36px;
      display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1);
      padding: var(--space-1) var(--space-8) var(--space-1) var(--space-2);
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      cursor: text;
      font-size: var(--font-size-base);
    }
    .field:hover,
    .field.is-open { border-color: var(--color-primary-500); }
    .field.is-error { border-color: var(--color-error-600); }
    .field-placeholder { color: var(--color-text-placeholder); padding: 0 var(--space-1); }
    .field-chev {
      position: absolute; right: var(--space-2); top: 50%;
      color: var(--color-stone-600);
    }
    .chip {
      display: inline-flex; align-items: center; gap: var(--space-1);
      height: 24px; padding: 0 var(--space-1) 0 var(--space-2);
      background: var(--color-stone-300);
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }
    .chip--group { background: var(--color-stone-200); border: 1px solid var(--color-stone-400); }
    .chip--group fvdr-icon { color: var(--color-info-500); }
    .chip-x {
      background: none; border: none; padding: 0; cursor: pointer;
      display: inline-flex; color: var(--color-stone-600);
    }
    .chip-x:hover { color: var(--color-text-primary); }
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

    /* "Set permissions by file type" dialog (version A) */
    .m-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .m-field { position: relative; display: flex; flex-direction: column; gap: var(--space-2); }
    .m-label { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); }
    .m-full { width: 100%; }
    .m-panel {
      display: flex; flex-direction: column; gap: var(--space-2);
      max-height: 240px; overflow-y: auto;
      padding: var(--space-3);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
    }
    .m-panel .perm-option { height: 40px; }
    .m-panel .picker-sub { padding-left: var(--space-6); }
    .m-link {
      align-self: flex-start;
      background: none; border: none; padding: 0; cursor: pointer;
      font: inherit; font-size: var(--font-size-base); color: var(--color-primary-500);
    }
    .m-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .clear-btn {
      position: absolute; right: var(--space-8); top: 50%; transform: translateY(-50%);
      background: none; border: none; padding: 0; cursor: pointer;
      display: inline-flex; color: var(--color-stone-600);
    }
    .clear-btn:hover { color: var(--color-text-primary); }

    /* Single permission shown in preview (version A) */
    .perm-value {
      min-height: 36px; width: 100%;
      display: flex; align-items: center; gap: var(--space-2);
      font-size: var(--font-size-base); color: var(--color-text-primary);
    }
    .perm-value fvdr-icon { color: var(--color-text-secondary); }

    /* Permission dropdown (version A) */
    .perm-field { width: 240px; cursor: pointer; flex-wrap: nowrap; }
    .perm-field span { white-space: nowrap; }
    .perm-field fvdr-icon { color: var(--color-text-secondary); }
    .picker--perm {
      width: 240px; max-height: none;
      padding: var(--space-1) 0; gap: 0;
    }
    .perm-option {
      height: 40px; width: 100%;
      display: flex; align-items: center; gap: var(--space-3);
      padding: 0 var(--space-3);
      background: none; border: none; cursor: pointer;
      font: inherit; font-size: var(--font-size-base); color: var(--color-text-primary);
      text-align: left;
    }
    .perm-option:hover { background: var(--color-hover-bg); }
    .perm-option.is-selected { background: var(--color-primary-50); }
    .perm-option fvdr-icon { color: var(--color-text-secondary); }
    .picker-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .picker-sub { display: flex; flex-direction: column; gap: var(--space-2); padding-left: var(--space-6); }

    /* ── Row actions (A) ── */
    .cell-actions { position: relative; display: flex; justify-content: flex-end; }
    .more-btn {
      background: none; border: none; cursor: pointer;
      width: 32px; height: 32px; padding: 0;
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary); border-radius: var(--radius-sm);
    }
    .more-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .menu {
      position: absolute; top: calc(100% + var(--space-1)); right: 0; z-index: 30;
      min-width: 160px;
      display: flex; flex-direction: column;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-1) 0;
    }
    .menu-item {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: none; border: none; cursor: pointer;
      font: inherit; color: var(--color-text-primary); text-align: left; white-space: nowrap;
    }
    .menu-item:hover { background: var(--color-hover-bg); }
    .menu-item--danger { color: var(--color-error-600); }

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

    /* ── Footer for pending changes ── */
    .edit-bar {
      flex-shrink: 0;
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      background: var(--color-stone-0);
      border-top: 1px solid var(--color-divider);
    }
    .warn {
      flex: 1; min-width: 0;
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      font-size: var(--text-caption1-size);
    }
    .warn fvdr-icon { color: var(--color-warning-600); flex-shrink: 0; }
  `],
})
export class PermissionsFileTypeRulesComponent implements OnInit, OnDestroy {
  private readonly tracker = inject(TrackerService);
  private readonly toast = inject(ToastService);

  // ── Static data exposed to the template ───────────────────
  readonly permCols = PERM_COLS;
  readonly levelLabels = LEVEL_LABELS;
  readonly levelOptions = LEVEL_OPTIONS;
  readonly groupOptions = GROUP_OPTIONS;
  readonly allGroupsLabel = ALL_GROUPS;
  readonly documentGroups = DOCUMENT_GROUPS;
  readonly documents = DOCUMENTS;
  readonly variantItems = VARIANTS;
  /** Precomputed bar states per level (0–7) — keeps template bindings stable. */
  private readonly levelCells: Cell[][] = Array.from({ length: PERM_COLS.length + 1 }, (_, level) =>
    Array.from({ length: PERM_COLS.length }, (_, i) => ({ on: i < level, top: i === level - 1 })),
  );

  // ── State ─────────────────────────────────────────────────
  view: View = 'documents';
  variant: Variant = 'read';
  sidebarCollapsed = false;

  rules: FileTypeRule[] = SEED_RULES.map(r => ({ ...r, types: [...r.types], groups: [...r.groups] }));
  private nextRuleId = SEED_RULES.length + 1;

  /** Pending edits per row. Key 0 is a new rule. */
  drafts: Record<number, RuleState> = {};
  errors: Record<number, FieldErrors> = {};
  /** Open type/group picker, if any. */
  picker: { id: number; kind: FieldKind } | null = null;
  pickerQuery = '';
  /** Open row actions menu (version A). */
  menuFor: number | null = null;

  /** "Set permissions by file type" dialog, used for Add rule in version A. */
  modalOpen = false;
  modalDraft: ModalDraft = { types: [], groups: [], level: DEFAULT_LEVEL, applyNoAccess: false, folders: [] };
  modalErrors: FieldErrors = {};
  modalPicker: ModalPicker | null = null;
  private ignoreNextModalClose = false;
  readonly folderOptions = FOLDER_OPTIONS;

  navItems: SidebarNavItem[] = [];

  constructor() {
    this.buildNav();
  }

  // ── Derived ───────────────────────────────────────────────

  get enabledRuleCount(): number { return this.rules.filter(r => r.enabled).length; }

  get hasDrafts(): boolean { return Object.keys(this.drafts).length > 0; }

  get gridClass(): string { return this.variant === 'read' ? 'grid--read' : 'grid--full'; }

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
    if (this.drafts[0]) rows.push({ key: 0, rule: null, editing: true });
    for (const rule of this.rules) {
      rows.push({ key: rule.id, rule, editing: !!this.drafts[rule.id] });
    }
    return rows;
  }

  /** Warning shown in version C when a pending change lowers access for existing files. */
  get lowerAccessWarning(): string | null {
    if (this.variant !== 'click') return null;
    for (const rule of this.rules) {
      const d = this.drafts[rule.id];
      if (d && d.level < rule.level) {
        return `Lowering access updates existing files of ${rule.types.join(', ')} when you save.`;
      }
    }
    return null;
  }

  cells(level: number): Cell[] { return this.levelCells[level] ?? this.levelCells[0]; }

  /** Current values for a row: its draft if one exists, otherwise the saved rule. */
  stateOf(row: TableRow): RuleState {
    return this.drafts[row.key] ?? (row.rule as RuleState);
  }

  levelOf(row: TableRow): number { return this.stateOf(row).level; }

  /** Fields render as inputs: always in B, only while editing in A and C. */
  inputMode(row: TableRow): boolean {
    return this.variant === 'inline' || row.editing;
  }

  /** Edit icon next to chips — only in C, only on rows that are not being edited. */
  pencilVisible(row: TableRow): boolean {
    return this.variant === 'click' && !row.editing && !!row.rule;
  }

  /** Permission segments respond to clicks: always in B and C, while editing in A. */
  isLive(row: TableRow): boolean {
    return this.variant !== 'read' || row.editing;
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
    this.cancelAll();
    this.view = view;
    this.buildNav();
  }

  setVariant(id: string): void {
    this.variant = id as Variant;
    this.cancelAll();
  }

  // ── Editing model ─────────────────────────────────────────

  private blank(): RuleState {
    // Version A has no status control, so new rules start active there.
    return { enabled: this.variant === 'read', types: [], groups: [], level: DEFAULT_LEVEL };
  }

  /** Create a draft for a row (copying its saved values) if it does not have one yet. */
  private ensure(key: number, rule: FileTypeRule | null): void {
    if (this.drafts[key]) return;
    const base = rule ?? this.blank();
    this.drafts = {
      ...this.drafts,
      [key]: { enabled: base.enabled, types: [...base.types], groups: [...base.groups], level: base.level },
    };
  }

  private patch(key: number, change: Partial<RuleState>): void {
    const current = this.drafts[key];
    if (!current) return;
    this.drafts = { ...this.drafts, [key]: { ...current, ...change } };
  }

  private clearError(key: number, field: keyof FieldErrors): void {
    if (this.errors[key]?.[field]) {
      this.errors = { ...this.errors, [key]: { ...this.errors[key], [field]: undefined } };
    }
  }

  addRule(): void {
    this.menuFor = null;
    if (this.variant === 'read') {
      this.openModal();
      return;
    }
    if (this.drafts[0]) return;
    this.ensure(0, null);
  }

  // ── "Set permissions by file type" dialog (version A) ─────

  openModal(): void {
    this.modalDraft = { types: [], groups: [], level: DEFAULT_LEVEL, applyNoAccess: false, folders: [] };
    this.modalErrors = {};
    this.modalPicker = null;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalPicker = null;
  }

  /** The DS modal emits `closed` right after `confirmed`; a failed Apply must keep the dialog open. */
  onModalClosed(): void {
    if (this.ignoreNextModalClose) {
      this.ignoreNextModalClose = false;
      return;
    }
    this.closeModal();
  }

  toggleModalPicker(kind: ModalPicker): void {
    this.modalPicker = this.modalPicker === kind ? null : kind;
    this.pickerQuery = '';
  }

  isModalTypeSelected(type: string): boolean {
    return this.modalDraft.types.includes(type);
  }

  allModalTypesOf(types: string[]): boolean {
    return types.length > 0 && types.every(t => this.isModalTypeSelected(t));
  }

  someModalTypesOf(types: string[]): boolean {
    return types.some(t => this.isModalTypeSelected(t)) && !this.allModalTypesOf(types);
  }

  modalToggleType(type: string): void {
    const list = this.modalDraft.types;
    this.modalDraft = { ...this.modalDraft, types: list.includes(type) ? list.filter(t => t !== type) : [...list, type] };
    this.modalErrors = { ...this.modalErrors, types: undefined };
  }

  modalToggleCategory(types: string[], checked: boolean): void {
    const rest = this.modalDraft.types.filter(t => !types.includes(t));
    this.modalDraft = { ...this.modalDraft, types: checked ? [...rest, ...types] : rest };
    this.modalErrors = { ...this.modalErrors, types: undefined };
  }

  isModalGroupSelected(group: string): boolean {
    return this.modalDraft.groups.includes(group);
  }

  modalToggleGroup(group: string): void {
    const list = this.modalDraft.groups;
    let next: string[];
    if (group === ALL_GROUPS) {
      next = list.includes(ALL_GROUPS) ? [] : [ALL_GROUPS];
    } else {
      const without = list.filter(g => g !== ALL_GROUPS);
      next = without.includes(group) ? without.filter(g => g !== group) : [...without, group];
    }
    this.modalDraft = { ...this.modalDraft, groups: next };
    this.modalErrors = { ...this.modalErrors, groups: undefined };
  }

  modalToggleFolder(folder: string): void {
    const list = this.modalDraft.folders;
    this.modalDraft = { ...this.modalDraft, folders: list.includes(folder) ? list.filter(f => f !== folder) : [...list, folder] };
  }

  modalRemoveType(type: string, event: MouseEvent): void {
    event.stopPropagation();
    this.modalDraft = { ...this.modalDraft, types: this.modalDraft.types.filter(t => t !== type) };
  }

  modalRemoveGroup(group: string, event: MouseEvent): void {
    event.stopPropagation();
    this.modalDraft = { ...this.modalDraft, groups: this.modalDraft.groups.filter(g => g !== group) };
  }

  modalRemoveFolder(folder: string, event: MouseEvent): void {
    event.stopPropagation();
    this.modalDraft = { ...this.modalDraft, folders: this.modalDraft.folders.filter(f => f !== folder) };
  }

  modalClearTypes(event: MouseEvent): void {
    event.stopPropagation();
    this.modalDraft = { ...this.modalDraft, types: [] };
  }

  modalClearGroups(event: MouseEvent): void {
    event.stopPropagation();
    this.modalDraft = { ...this.modalDraft, groups: [] };
  }

  modalPickLevel(level: number): void {
    this.modalDraft = { ...this.modalDraft, level };
    this.modalPicker = null;
  }

  setApplyNoAccess(checked: boolean): void {
    this.modalDraft = { ...this.modalDraft, applyNoAccess: checked };
  }

  applyModal(): void {
    const d = this.modalDraft;
    const errors: FieldErrors = {};
    if (!d.types.length) errors.types = 'Choose at least one file type';
    if (!d.groups.length) errors.groups = 'Choose at least one group';
    this.modalErrors = errors;
    if (errors.types || errors.groups) {
      this.ignoreNextModalClose = true;
      return;
    }

    const rule: FileTypeRule = {
      id: this.nextRuleId++,
      enabled: true,
      types: [...d.types],
      groups: [...d.groups],
      level: d.level,
      applyNoAccess: d.applyNoAccess,
      folders: [...d.folders],
    };
    this.rules = [rule, ...this.rules];
    this.toast.show({ variant: 'success', message: 'File type rule saved. Existing files were updated.' });
    this.closeModal();
  }

  startEdit(row: TableRow, event: MouseEvent): void {
    event.stopPropagation();
    this.menuFor = null;
    if (row.rule) this.ensure(row.key, row.rule);
  }

  toggleMenu(key: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuFor = this.menuFor === key ? null : key;
  }

  deleteRule(key: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuFor = null;
    this.rules = this.rules.filter(r => r.id !== key);
    const remaining = { ...this.drafts };
    delete remaining[key];
    this.drafts = remaining;
    this.toast.show({ variant: 'info', message: 'File type rule deleted' });
  }

  onToggle(row: TableRow, checked: boolean): void {
    this.ensure(row.key, row.rule);
    this.patch(row.key, { enabled: checked });
  }

  onLevelClick(row: TableRow, level: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isLive(row)) return;
    this.ensure(row.key, row.rule);
    this.patch(row.key, { level });
  }

  permIcon(level: number): FvdrIconName {
    return PERM_ICONS[level];
  }

  /** Version A dropdown: choosing a permission sets the draft level and closes the list. */
  pickLevel(row: TableRow, level: number, event: MouseEvent): void {
    event.stopPropagation();
    this.ensure(row.key, row.rule);
    this.patch(row.key, { level });
    this.picker = null;
  }

  openPicker(row: TableRow, kind: FieldKind): void {
    if (!this.isLive(row) && !row.editing) return;
    this.ensure(row.key, row.rule);
    if (this.picker && this.picker.id === row.key && this.picker.kind === kind) {
      this.picker = null;
    } else {
      this.picker = { id: row.key, kind };
      this.pickerQuery = '';
    }
  }

  isPicker(row: TableRow, kind: FieldKind): boolean {
    return this.picker?.id === row.key && this.picker.kind === kind;
  }

  removeChip(row: TableRow, kind: FieldKind, value: string, event: MouseEvent): void {
    event.stopPropagation();
    this.ensure(row.key, row.rule);
    const current = this.drafts[row.key];
    if (kind === 'types') {
      this.patch(row.key, { types: current.types.filter(t => t !== value) });
    } else {
      this.patch(row.key, { groups: current.groups.filter(g => g !== value) });
    }
  }

  isTypeSelected(key: number, type: string): boolean {
    return !!this.drafts[key]?.types.includes(type);
  }

  allTypesOf(key: number, types: string[]): boolean {
    return types.length > 0 && types.every(t => this.isTypeSelected(key, t));
  }

  someTypesOf(key: number, types: string[]): boolean {
    return types.some(t => this.isTypeSelected(key, t)) && !this.allTypesOf(key, types);
  }

  toggleType(key: number, type: string): void {
    const current = this.drafts[key];
    if (!current) return;
    const list = current.types;
    this.patch(key, { types: list.includes(type) ? list.filter(t => t !== type) : [...list, type] });
    this.clearError(key, 'types');
  }

  toggleCategory(key: number, types: string[], checked: boolean): void {
    const current = this.drafts[key];
    if (!current) return;
    const rest = current.types.filter(t => !types.includes(t));
    this.patch(key, { types: checked ? [...rest, ...types] : rest });
    this.clearError(key, 'types');
  }

  isGroupSelected(key: number, group: string): boolean {
    return !!this.drafts[key]?.groups.includes(group);
  }

  toggleGroup(key: number, group: string): void {
    const current = this.drafts[key];
    if (!current) return;
    const list = current.groups;
    if (group === ALL_GROUPS) {
      this.patch(key, { groups: list.includes(ALL_GROUPS) ? [] : [ALL_GROUPS] });
    } else {
      const without = list.filter(g => g !== ALL_GROUPS);
      this.patch(key, { groups: without.includes(group) ? without.filter(g => g !== group) : [...without, group] });
    }
    this.clearError(key, 'groups');
  }

  cancelAll(): void {
    this.drafts = {};
    this.errors = {};
    this.picker = null;
    this.menuFor = null;
  }

  saveAll(): void {
    const keys = Object.keys(this.drafts).map(Number);
    if (!keys.length) return;

    const nextErrors: Record<number, FieldErrors> = {};
    for (const key of keys) {
      const d = this.drafts[key];
      const e: FieldErrors = {};
      if (!d.types.length) e.types = 'Choose at least one file type';
      if (!d.groups.length) e.groups = 'Choose at least one group';
      if (e.types || e.groups) nextErrors[key] = e;
    }
    this.errors = nextErrors;
    if (Object.keys(nextErrors).length) return;

    let rules = this.rules;
    for (const key of keys) {
      const d = this.drafts[key];
      const values: RuleState = { enabled: d.enabled, types: [...d.types], groups: [...d.groups], level: d.level };
      if (key === 0) {
        rules = [{ id: this.nextRuleId++, ...values }, ...rules];
      } else {
        rules = rules.map(r => (r.id === key ? { ...r, ...values } : r));
      }
    }
    this.rules = rules;

    this.toast.show({
      variant: 'success',
      message: keys.length === 1
        ? 'File type rule saved. Existing files were updated.'
        : `${keys.length} file type rules saved. Existing files were updated.`,
    });
    this.cancelAll();
  }

  // ── Outside click / Escape close pickers and menus ────────

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(e: MouseEvent): void {
    const target = e.target as Element | null;
    if (this.picker && !target?.closest?.('.picker, .field')) this.picker = null;
    if (this.menuFor !== null && !target?.closest?.('.menu, .more-btn')) this.menuFor = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.picker = null;
    this.menuFor = null;
    this.modalPicker = null;
  }

  ngOnInit(): void { this.tracker.trackPageView(SLUG); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }
}
