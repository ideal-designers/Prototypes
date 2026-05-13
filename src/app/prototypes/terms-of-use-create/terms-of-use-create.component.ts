import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, RadioOption, DropdownOption, MultiselectOption } from '../../shared/ds';
import type { HeaderAction, SidebarNavItem } from '../../shared/ds';

// ── Types ───────────────────────────────────────────────────────────────────

interface FileChip {
  id: string;
  name: string;
  restricted: boolean;
  showTooltip: boolean;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  restricted?: boolean;
  expanded: boolean;
  selected: boolean;
  children?: TreeNode[];
}

interface FlatNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  restricted?: boolean;
  expanded: boolean;
  selected: boolean;
  depth: number;
  hasChildren: boolean;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_TREE: TreeNode[] = [
  { id: 'f1', name: '1  Folder name', type: 'folder', expanded: false, selected: false, children: [
    { id: 'f1-1', name: 'Document 1.pdf', type: 'file', expanded: false, selected: false },
    { id: 'f1-2', name: 'Document 2.doc', type: 'file', expanded: false, selected: false },
  ]},
  { id: 'f2', name: '2  Folder name', type: 'folder', expanded: false, selected: false, children: [
    { id: 'f2-1', name: 'Report Q1.pdf', type: 'file', expanded: false, selected: false },
  ]},
  { id: 'f3', name: '3  Folder name', type: 'folder', expanded: true, selected: false, children: [
    { id: 'f3-1', name: '3.1  Folder name', type: 'folder', expanded: true, selected: false, children: [
      { id: 'f3-1-1', name: '3.1.1  Folder name', type: 'folder', expanded: false, selected: false, children: [
        { id: 'f3-1-1-1', name: 'Overview.ppt', type: 'file', expanded: false, selected: false },
      ]},
      { id: 'f3-1-2', name: '3.1.2  PPT', type: 'file', expanded: false, selected: false },
      { id: 'f3-1-3', name: '3.1.3  Report 2023-2024', type: 'file', restricted: true, expanded: false, selected: false },
    ]},
    { id: 'f3-2', name: '3.2  Tax report', type: 'folder', expanded: false, selected: false, children: [
      { id: 'f3-2-1', name: 'Tax_2024.pdf', type: 'file', expanded: false, selected: false },
    ]},
  ]},
  { id: 'f4', name: 'Q&A attach', type: 'folder', expanded: false, selected: false, children: [
    { id: 'f4-1', name: 'Legal_2024.pdf', type: 'file', restricted: true, expanded: false, selected: false },
    { id: 'f4-2', name: 'Finance_2024.xls', type: 'file', expanded: false, selected: false },
    { id: 'f4-3', name: 'Accounting2024.doc', type: 'file', expanded: false, selected: false },
  ]},
];

function deepCloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(n => ({
    ...n,
    children: n.children ? deepCloneTree(n.children) : undefined,
  }));
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'fvdr-terms-of-use-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Sidebar ── -->
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Project Nova"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavItemClick($event)"
      />

      <!-- ── Main ── -->
      <div class="main-area">
        <fvdr-header
          [breadcrumbs]="breadcrumbs"
          [actions]="headerActions"
          [showMenu]="false"
          userName="TN"
          (actionClick)="onHeaderAction($event)"
        />

        <!-- Settings horizontal tabs -->
        <div class="settings-tabs">
          <button *ngFor="let tab of settingsTabs" class="settings-tab" [class.settings-tab--active]="tab.active">
            {{ tab.label }}
          </button>
        </div>

        <!-- ── Demo mode switcher ── -->
        <div class="demo-banner">
          <span class="demo-label">Demo mode:</span>
          <button class="demo-btn" [class.demo-btn--active]="mode === 'create'" (click)="setMode('create')">Create new terms</button>
          <button class="demo-btn" [class.demo-btn--active]="mode === 'edit'" (click)="setMode('edit')">Edit terms of use</button>
        </div>

        <!-- ── Form ── -->
        <div class="content-area">
          <div class="form-container">

            <!-- 1. Terms of use type -->
            <div class="field-group">
              <label class="field-label">Terms of use</label>
              <fvdr-dropdown
                [options]="touTypeOptions"
                [value]="touType ?? ''"
                (valueChange)="onTouTypeChange($event)"
                size="m"
              />
              <!-- Custom title input (conditional) -->
              <div class="custom-title-wrap" [class.custom-title-wrap--visible]="touType === 'custom'">
                <fvdr-input
                  [(ngModel)]="customTitle"
                  placeholder="Enter your terms of use title"
                />
              </div>
            </div>

            <!-- 2. Display timing -->
            <div class="field-group">
              <label class="field-label">Display terms of use</label>
              <fvdr-radio
                [options]="displayOptions"
                [value]="displayTiming"
                (valueChange)="displayTiming = $event"
                layout="horizontal"
              />
            </div>

            <!-- 3. Require signature -->
            <div class="field-group field-group--inline">
              <fvdr-checkbox [(checked)]="requireSignature" />
              <span class="inline-label">Require signature to accept</span>
            </div>

            <!-- 4. Assigned groups -->
            <div class="field-group">
              <fvdr-multiselect
                [options]="groupOptions"
                [(values)]="selectedGroups"
                label="Assigned groups"
                placeholder="Select"
                [showChips]="true"
                helperText="Each group can have only one active agreement at one time"
              />
            </div>

            <!-- 5. Apply to -->
            <div class="field-group">
              <label class="field-label">Apply to</label>
              <fvdr-radio
                [options]="applyToOptions"
                [value]="applyTo"
                (valueChange)="onApplyToChange($event)"
                layout="horizontal"
              />

              <!-- Specific files section -->
              <div *ngIf="applyTo === 'specific'" class="specific-files">
                <button class="select-files-link" (click)="openFilePicker()">
                  {{ selectedFiles.length > 0 ? 'Select files' : 'Select files' }}
                </button>

                <!-- File chips -->
                <div *ngIf="selectedFiles.length > 0" class="chip-row">
                  <ng-container *ngFor="let chip of visibleChips; let i = index">
                    <div
                      class="file-chip"
                      [class.file-chip--warning]="chip.restricted && selectedGroups.length > 0"
                      (mouseenter)="chip.showTooltip = chip.restricted && selectedGroups.length > 0"
                      (mouseleave)="chip.showTooltip = false"
                    >
                      <span class="chip-name">{{ chip.name }}</span>
                      <fvdr-icon *ngIf="chip.restricted && selectedGroups.length > 0" name="warning" class="chip-warn-icon"></fvdr-icon>
                      <button class="chip-remove" (click)="removeFileChip(chip.id)">
                        <fvdr-icon name="close"></fvdr-icon>
                      </button>

                      <!-- Tooltip -->
                      <div *ngIf="chip.showTooltip" class="chip-tooltip">
                        <span>Selected group can't view this file</span>
                        <button class="tooltip-link" (click)="chip.showTooltip = false">
                          Go to permissions
                          <fvdr-icon name="link" class="tooltip-link-icon"></fvdr-icon>
                        </button>
                      </div>
                    </div>
                  </ng-container>

                  <!-- "+N more" badge -->
                  <button
                    *ngIf="!showAllChips && hiddenChipsCount > 0"
                    class="chips-more"
                    (click)="showAllChips = true"
                  >+{{ hiddenChipsCount }} more</button>
                </div>

                <!-- Warning banner -->
                <div *ngIf="conflictCount > 0 && selectedGroups.length > 0" class="conflict-banner">
                  <fvdr-icon name="info" class="conflict-icon"></fvdr-icon>
                  <span>
                    {{ conflictCount }} selected file{{ conflictCount > 1 ? 's are' : ' is' }} not accessible to selected groups.
                    <button class="conflict-link" (click)="$event.preventDefault()">Go to permissions →</button>
                  </span>
                </div>
              </div>
            </div>

            <div class="section-divider"></div>

            <!-- 6. Terms of use content -->
            <div class="field-group">
              <label class="field-label">Terms of use content</label>
              <fvdr-radio
                [options]="contentTypeOptions"
                [value]="contentType"
                (valueChange)="contentType = $event"
                layout="horizontal"
              />

              <!-- Upload document -->
              <div *ngIf="contentType === 'upload'" class="upload-area">
                <button class="add-doc-btn" (click)="onAddDocument()">
                  <fvdr-icon name="plus" class="add-doc-icon"></fvdr-icon>
                  Add document
                </button>
                <div *ngFor="let doc of uploadedDocs" class="uploaded-doc">
                  <div class="doc-icon">
                    <fvdr-icon name="folder" class="doc-file-icon"></fvdr-icon>
                  </div>
                  <span class="doc-name">{{ doc.name }}</span>
                  <button class="doc-preview" title="Preview">
                    <fvdr-icon name="overview"></fvdr-icon>
                  </button>
                  <button class="doc-remove" (click)="removeDoc(doc.name)">
                    <fvdr-icon name="close"></fvdr-icon>
                  </button>
                </div>
              </div>

              <!-- Paste a text editor -->
              <div *ngIf="contentType === 'paste'" class="editor-wrap">
                <div class="editor-toolbar">
                  <div class="toolbar-group">
                    <button class="tb-btn" title="Bold"><fvdr-icon name="edit"></fvdr-icon></button>
                    <button class="tb-btn tb-btn--text" title="Bold"><strong>B</strong></button>
                    <button class="tb-btn tb-btn--text" title="Italic"><em>I</em></button>
                    <button class="tb-btn tb-btn--text" title="Underline"><u>U</u></button>
                  </div>
                  <div class="toolbar-sep"></div>
                  <div class="toolbar-group">
                    <button class="tb-btn" title="Bullet list"><fvdr-icon name="filter"></fvdr-icon></button>
                    <button class="tb-btn" title="Numbered list"><fvdr-icon name="sort"></fvdr-icon></button>
                  </div>
                  <div class="toolbar-sep"></div>
                  <div class="toolbar-group">
                    <button class="tb-btn" title="Align left"><fvdr-icon name="move"></fvdr-icon></button>
                  </div>
                  <div class="toolbar-sep"></div>
                  <div class="toolbar-group">
                    <button class="tb-btn" title="Insert image"><fvdr-icon name="download"></fvdr-icon></button>
                    <button class="tb-btn" title="Insert link"><fvdr-icon name="link"></fvdr-icon></button>
                  </div>
                  <div class="toolbar-sep"></div>
                  <div class="toolbar-group">
                    <button class="tb-btn" title="Clear formatting"><fvdr-icon name="cancel"></fvdr-icon></button>
                  </div>
                </div>
                <div
                  class="editor-body"
                  contenteditable="true"
                  [class.editor-body--empty]="editorContent.length === 0"
                  (focus)="editorFocused = true"
                  (blur)="editorFocused = false"
                  [class.editor-body--focused]="editorFocused"
                  (input)="onEditorInput($event)"
                  [attr.data-placeholder]="'Enter terms content…'"
                ><ng-container *ngIf="mode === 'edit' && editorContent">{{ editorContent }}</ng-container></div>
              </div>
            </div>

          </div><!-- /form-container -->
        </div><!-- /content-area -->

        <!-- ── Footer ── -->
        <div class="form-footer">
          <fvdr-btn label="Cancel" variant="ghost" size="m" (clicked)="onCancel()" />
          <fvdr-btn
            [label]="mode === 'create' ? 'Create' : 'Save'"
            variant="primary"
            size="m"
            [disabled]="!touType"
            (clicked)="onSubmit()"
          />
        </div>

      </div><!-- /main-area -->
    </div><!-- /page-layout -->

    <!-- ══════════════════════════════════════════
         FILE PICKER MODAL
    ══════════════════════════════════════════ -->
    <div *ngIf="filePickerOpen" class="overlay" (click)="closeFilePicker()">
      <div class="file-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Select files and folders">

        <div class="file-modal__header">
          <span class="file-modal__title">Select files and folders</span>
          <button class="file-modal__close" (click)="closeFilePicker()">
            <fvdr-icon name="close"></fvdr-icon>
          </button>
        </div>

        <div class="file-modal__search">
          <fvdr-icon name="search" class="search-icon"></fvdr-icon>
          <input
            [(ngModel)]="treeSearch"
            placeholder="Search"
            class="search-input"
            (click)="$event.stopPropagation()"
          />
        </div>

        <div class="file-modal__tree">
          <ng-container *ngFor="let node of filteredFlatTree">
            <div
              class="tree-row"
              [class.tree-row--selected]="node.selected && node.type === 'file'"
              [style.paddingLeft.px]="16 + node.depth * 20"
            >
              <!-- Expand/collapse toggle for folders -->
              <button
                *ngIf="node.type === 'folder' && node.hasChildren"
                class="tree-toggle"
                (click)="toggleTreeNode(node.id)"
              >
                <fvdr-icon [name]="node.expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
              </button>
              <span *ngIf="node.type === 'folder' && !node.hasChildren" class="tree-toggle-spacer"></span>
              <span *ngIf="node.type === 'file'" class="tree-toggle-spacer"></span>

              <!-- Checkbox for files -->
              <fvdr-checkbox
                *ngIf="node.type === 'file'"
                [checked]="node.selected"
                (checkedChange)="toggleFileSelect(node.id, $event)"
              />
              <span *ngIf="node.type === 'folder'" class="tree-folder-spacer"></span>

              <!-- Icon -->
              <fvdr-icon
                [name]="node.type === 'folder' ? 'folder' : 'folder'"
                class="tree-icon"
                [class.tree-icon--folder]="node.type === 'folder'"
                [class.tree-icon--file]="node.type === 'file'"
              ></fvdr-icon>

              <!-- Name -->
              <span class="tree-name" [class.tree-name--restricted]="node.restricted">{{ node.name }}</span>
              <fvdr-icon *ngIf="node.restricted" name="warning" class="tree-restricted-icon"></fvdr-icon>
            </div>
          </ng-container>
          <div *ngIf="filteredFlatTree.length === 0" class="tree-empty">No results</div>
        </div>

        <div class="file-modal__footer">
          <fvdr-btn label="Cancel" variant="secondary" size="m" (clicked)="cancelFilePicker()" />
          <fvdr-btn label="Apply" variant="primary" size="m" (clicked)="applyFileSelection()" />
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-family); display: block; }

    /* ── Layout ── */
    .page-layout { display: flex; height: 100vh; background: var(--color-stone-200); overflow: hidden; }

    /* ── Main ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--color-stone-0); }

    /* ── Settings tabs ── */
    .settings-tabs {
      display: flex; gap: 0; border-bottom: 1px solid var(--color-divider);
      padding: 0 var(--space-6); overflow-x: auto; flex-shrink: 0;
      background: var(--color-stone-0);
    }
    .settings-tab {
      height: 48px; padding: 0 var(--space-4);
      border: none; background: transparent; cursor: pointer;
      font-size: 14px; font-weight: 400; color: var(--color-text-secondary);
      font-family: var(--font-family); white-space: nowrap;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .settings-tab:hover { color: var(--color-text-primary); }
    .settings-tab--active { color: var(--color-text-primary); font-weight: 600; border-bottom-color: var(--color-primary-500); }

    /* ── Demo banner ── */
    .demo-banner {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-6);
      background: var(--color-stone-100);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .demo-label { font-size: 12px; color: var(--color-text-secondary); font-weight: 400; }
    .demo-btn {
      height: 24px; padding: 0 var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      background: var(--color-stone-0); cursor: pointer;
      font-size: 12px; color: var(--color-text-secondary); font-family: var(--font-family);
    }
    .demo-btn:hover { border-color: var(--color-stone-600); }
    .demo-btn--active { background: var(--color-primary-50); border-color: var(--color-primary-500); color: var(--color-primary-600); font-weight: 600; }

    /* ── Content area ── */
    .content-area { flex: 1; overflow-y: auto; padding: var(--space-6); background: var(--color-stone-0); }
    .form-container { max-width: 560px; display: flex; flex-direction: column; gap: var(--space-6); }

    /* ── Field groups ── */
    .field-group { display: flex; flex-direction: column; gap: var(--space-3); }
    .field-group--inline { flex-direction: row; align-items: center; gap: var(--space-3); padding: var(--space-1) 0; }
    .field-label {
      font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4;
    }
    .inline-label { font-size: 14px; color: var(--color-text-primary); }

    /* Custom title animate */
    .custom-title-wrap { overflow: hidden; max-height: 0; opacity: 0; transition: max-height 0.18s ease, opacity 0.18s ease; }
    .custom-title-wrap--visible { max-height: 60px; opacity: 1; }

    /* ── Specific files ── */
    .specific-files { display: flex; flex-direction: column; gap: var(--space-3); }
    .select-files-link {
      display: inline-flex; align-items: center; gap: var(--space-1);
      background: transparent; border: none; cursor: pointer;
      color: var(--color-primary-500); font-size: 14px; font-weight: 400;
      font-family: var(--font-family); padding: 0; text-decoration: underline;
      text-underline-offset: 2px;
    }
    .select-files-link:hover { color: var(--color-primary-600); }

    /* File chips */
    .chip-row { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
    .file-chip {
      position: relative;
      display: inline-flex; align-items: center; gap: var(--space-2);
      height: 28px; padding: 0 var(--space-2);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-size: 13px; color: var(--color-text-primary);
    }
    .file-chip--warning { border-color: #FFDA07; background: #FFFDE7; }
    .chip-name { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chip-warn-icon { font-size: 14px; color: #B45309; flex-shrink: 0; }
    .chip-remove {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 16px;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary); padding: 0; font-size: 12px;
    }
    .chip-remove:hover { color: var(--color-text-primary); }

    /* Tooltip */
    .chip-tooltip {
      position: absolute; bottom: calc(100% + 6px); left: 0;
      z-index: 100;
      background: var(--color-stone-900); color: var(--color-stone-0);
      border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3);
      font-size: 12px; white-space: nowrap;
      display: flex; flex-direction: column; gap: var(--space-1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.18);
    }
    .tooltip-link {
      display: inline-flex; align-items: center; gap: var(--space-1);
      background: transparent; border: none; cursor: pointer;
      color: var(--color-primary-500); font-size: 12px; font-family: var(--font-family); padding: 0;
    }
    .tooltip-link:hover { color: #5EC99A; }
    .tooltip-link-icon { font-size: 12px; }

    .chips-more {
      height: 28px; padding: 0 var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      background: var(--color-stone-200); cursor: pointer;
      font-size: 13px; color: var(--color-text-secondary); font-family: var(--font-family);
    }
    .chips-more:hover { background: var(--color-stone-300); color: var(--color-text-primary); }

    /* Conflict banner */
    .conflict-banner {
      display: flex; align-items: flex-start; gap: var(--space-2);
      padding: var(--space-3) var(--space-3);
      background: var(--color-stone-100);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      font-size: 13px; color: var(--color-text-primary); line-height: 1.5;
    }
    .conflict-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; margin-top: 1px; }
    .conflict-link {
      background: transparent; border: none; cursor: pointer;
      color: var(--color-primary-500); font-size: 13px; font-family: var(--font-family); padding: 0;
    }
    .conflict-link:hover { text-decoration: underline; }

    /* Section divider */
    .section-divider { height: 1px; background: var(--color-divider); margin: 0; }

    /* ── Upload area ── */
    .upload-area { display: flex; flex-direction: column; gap: var(--space-3); }
    .add-doc-btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      height: 36px; padding: 0 var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      background: var(--color-stone-0); cursor: pointer;
      font-size: 14px; color: var(--color-text-primary); font-family: var(--font-family);
      align-self: flex-start;
    }
    .add-doc-btn:hover { border-color: var(--color-stone-600); background: var(--color-stone-100); }
    .add-doc-icon { font-size: 16px; color: var(--color-primary-500); }
    .uploaded-doc {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      background: var(--color-stone-0);
    }
    .doc-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .doc-file-icon { font-size: 20px; color: var(--color-error-600); }
    .doc-name { flex: 1; font-size: 14px; color: var(--color-text-primary); }
    .doc-preview, .doc-remove {
      width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary); font-size: 16px; padding: 0;
    }
    .doc-preview:hover, .doc-remove:hover { color: var(--color-text-primary); }

    /* ── Editor ── */
    .editor-wrap {
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .editor-toolbar {
      display: flex; align-items: center; gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-100);
    }
    .toolbar-group { display: flex; align-items: center; gap: 2px; }
    .toolbar-sep { width: 1px; height: 16px; background: var(--color-divider); margin: 0 var(--space-1); }
    .tb-btn {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border: none; border-radius: var(--radius-sm); background: transparent; cursor: pointer;
      font-size: 14px; color: var(--color-text-secondary); font-family: var(--font-family);
      padding: 0;
    }
    .tb-btn:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .tb-btn--text { font-size: 13px; }
    .editor-body {
      min-height: 200px; padding: var(--space-4);
      font-size: 14px; color: var(--color-text-primary); line-height: 1.6;
      outline: none; background: var(--color-stone-0);
    }
    .editor-body--focused { box-shadow: inset 0 0 0 2px var(--color-primary-500); }
    .editor-body:empty::before {
      content: attr(data-placeholder);
      color: var(--color-text-placeholder);
      pointer-events: none;
    }

    /* ── Footer ── */
    .form-footer {
      display: flex; align-items: center; justify-content: flex-start; gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      flex-shrink: 0;
    }

    /* ══ FILE PICKER MODAL ══ */
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(31,33,41,0.4);
      display: flex; align-items: center; justify-content: center;
    }
    .file-modal {
      width: 520px; max-height: 600px;
      background: var(--color-stone-0);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .file-modal__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .file-modal__title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
    .file-modal__close {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      font-size: 16px; color: var(--color-text-secondary); border-radius: var(--radius-sm);
    }
    .file-modal__close:hover { background: var(--color-stone-200); }

    .file-modal__search {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .search-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; color: var(--color-text-primary); font-family: var(--font-family);
    }
    .search-input::placeholder { color: var(--color-text-placeholder); }

    .file-modal__tree { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }
    .tree-row {
      display: flex; align-items: center; gap: var(--space-2);
      height: 36px; cursor: default;
      transition: background 0.1s;
    }
    .tree-row:hover { background: var(--color-stone-100); }
    .tree-row--selected { background: var(--color-primary-50); }
    .tree-row--selected:hover { background: var(--color-primary-50); }

    .tree-toggle {
      width: 20px; height: 20px; min-width: 20px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      font-size: 12px; color: var(--color-text-secondary); padding: 0;
    }
    .tree-toggle:hover { color: var(--color-text-primary); }
    .tree-toggle-spacer { width: 20px; min-width: 20px; display: inline-block; }
    .tree-folder-spacer { width: 20px; min-width: 20px; display: inline-block; }

    .tree-icon { font-size: 16px; flex-shrink: 0; }
    .tree-icon--folder { color: var(--color-primary-500); }
    .tree-icon--file { color: var(--color-stone-600); }
    .tree-name { font-size: 14px; color: var(--color-text-primary); flex: 1; }
    .tree-name--restricted { color: var(--color-text-secondary); }
    .tree-restricted-icon { font-size: 14px; color: #B45309; margin-right: var(--space-3); }
    .tree-empty { padding: var(--space-4) var(--space-6); font-size: 14px; color: var(--color-text-secondary); }

    .file-modal__footer {
      display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
  `],
})
export class TermsOfUseCreateComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────

  mode: 'create' | 'edit' = 'create';
  sidebarCollapsed = false;

  touType: string | null = null;
  customTitle = '';
  displayTiming = 'first';
  requireSignature = false;
  selectedGroups: string[] = [];
  applyTo = 'all';
  selectedFiles: FileChip[] = [];
  showAllChips = false;
  contentType = 'paste';
  uploadedDocs: { name: string }[] = [{ name: 'Terms of Use .pdf' }];
  editorContent = '';
  editorFocused = false;
  filePickerOpen = false;
  treeSearch = '';
  treeNodes: TreeNode[] = [];
  private treeSnapshot: { id: string; selected: boolean }[] = [];

  // ── Options ────────────────────────────────────────────────────────────────

  touTypeOptions: DropdownOption[] = [
    { value: 'nda', label: 'NDA' },
    { value: 'terms', label: 'Terms and conditions of access' },
    { value: 'confidentiality', label: 'Confidentiality agreement' },
    { value: 'disclaimer', label: 'Disclaimer' },
    { value: 'custom', label: 'Custom title' },
  ];

  displayOptions: RadioOption[] = [
    { value: 'first', label: 'On a first sign in' },
    { value: 'each', label: 'Each sign in' },
  ];

  groupOptions: MultiselectOption[] = [
    { value: 'user-group', label: 'User group' },
    { value: 'admin-group', label: 'Admin group' },
    { value: 'external', label: 'External Partners' },
    { value: 'legal', label: 'Legal team' },
  ];

  applyToOptions: RadioOption[] = [
    { value: 'all', label: 'All project' },
    { value: 'specific', label: 'Specific files' },
  ];

  contentTypeOptions: RadioOption[] = [
    { value: 'upload', label: 'Upload document' },
    { value: 'paste', label: 'Paste a text' },
  ];

  settingsTabs = [
    { label: 'General', active: false },
    { label: 'Branding', active: false },
    { label: 'Documents', active: false },
    { label: 'Labels', active: false },
    { label: 'Terms of use', active: true },
    { label: 'Watermarks', active: false },
    { label: 'Security', active: false },
    { label: 'AI tools', active: false },
    { label: 'Integrations', active: false },
  ];

  navItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Documents', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active', active: true, open: true,
      children: [
        { id: 'project', label: 'Project', active: true },
        { id: 'personal', label: 'Personal', active: false },
      ]},
    { id: 'qa', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
  ];

  // ── Header ─────────────────────────────────────────────────────────────────

  get breadcrumbs() {
    return [
      { id: 'settings', label: 'Settings' },
      { id: 'project', label: 'Project' },
      { id: 'tou', label: 'Terms of Use' },
      { id: 'page', label: this.mode === 'create' ? 'Create new terms' : 'Edit terms of use' },
    ];
  }

  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'help', icon: 'help' },
  ];

  onHeaderAction(_id: string): void {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.treeNodes = deepCloneTree(INITIAL_TREE);
  }

  // ── Mode ───────────────────────────────────────────────────────────────────

  setMode(m: 'create' | 'edit'): void {
    this.mode = m;
    if (m === 'edit') {
      this.loadEditState();
    } else {
      this.resetForm();
    }
  }

  private loadEditState(): void {
    this.touType = 'nda';
    this.customTitle = '';
    this.displayTiming = 'first';
    this.requireSignature = true;
    this.selectedGroups = ['user-group', 'admin-group'];
    this.applyTo = 'specific';
    this.contentType = 'upload';
    this.uploadedDocs = [{ name: 'Terms of Use .pdf' }];
    this.editorContent = 'Letter of Intent (LOI)\n• Purpose: Outlines the preliminary terms and conditions of the deal.\n• Key Point: Acts as a roadmap and sets expectations for both parties.';
    this.showAllChips = false;

    // Pre-select some files in the tree
    this.treeNodes = deepCloneTree(INITIAL_TREE);
    this.setNodeSelected('f4-2', true); // Finance_2024.xls
    this.setNodeSelected('f4-3', true); // Accounting2024.doc
    this.setNodeSelected('f4-1', true); // Legal_2024.pdf (restricted)
    this.setNodeSelected('f3-1-2', true); // 3.1.2 PPT
    this.setNodeSelected('f3-1-3', true); // 3.1.3 Report (restricted)
    this.setNodeSelected('f2-1', true); // Report Q1.pdf

    this.syncChipsFromTree();
  }

  private resetForm(): void {
    this.touType = null;
    this.customTitle = '';
    this.displayTiming = 'first';
    this.requireSignature = false;
    this.selectedGroups = [];
    this.applyTo = 'all';
    this.selectedFiles = [];
    this.showAllChips = false;
    this.contentType = 'paste';
    this.uploadedDocs = [{ name: 'Terms of Use .pdf' }];
    this.editorContent = '';
    this.treeNodes = deepCloneTree(INITIAL_TREE);
  }

  // ── Nav ────────────────────────────────────────────────────────────────────

  onNavItemClick(item: SidebarNavItem): void {
    if (item.children) { item.open = !item.open; }
  }

  // ── Form handlers ──────────────────────────────────────────────────────────

  onTouTypeChange(v: string | string[]): void {
    this.touType = Array.isArray(v) ? v[0] : v;
  }

  onApplyToChange(v: string): void {
    this.applyTo = v;
    if (v === 'all') { this.selectedFiles = []; this.showAllChips = false; }
  }

  onEditorInput(e: Event): void {
    this.editorContent = (e.target as HTMLElement).innerText;
  }

  onAddDocument(): void {
    this.uploadedDocs.push({ name: 'New Document.pdf' });
  }

  removeDoc(name: string): void {
    this.uploadedDocs = this.uploadedDocs.filter(d => d.name !== name);
  }

  onCancel(): void {}
  onSubmit(): void {}

  // ── File chips ─────────────────────────────────────────────────────────────

  get visibleChips(): FileChip[] {
    return this.showAllChips ? this.selectedFiles : this.selectedFiles.slice(0, 3);
  }

  get hiddenChipsCount(): number {
    return Math.max(0, this.selectedFiles.length - 3);
  }

  get conflictCount(): number {
    return this.selectedFiles.filter(f => f.restricted).length;
  }

  removeFileChip(id: string): void {
    this.selectedFiles = this.selectedFiles.filter(f => f.id !== id);
    this.setNodeSelected(id, false);
    if (this.selectedFiles.length <= 3) this.showAllChips = false;
  }

  // ── File picker ────────────────────────────────────────────────────────────

  openFilePicker(): void {
    // Snapshot current selection for cancel
    this.treeSnapshot = this.getAllNodes(this.treeNodes).map(n => ({ id: n.id, selected: n.selected }));
    this.treeSearch = '';
    this.filePickerOpen = true;
  }

  closeFilePicker(): void {
    this.cancelFilePicker();
  }

  cancelFilePicker(): void {
    // Restore snapshot
    this.treeSnapshot.forEach(snap => this.setNodeSelected(snap.id, snap.selected));
    this.filePickerOpen = false;
  }

  applyFileSelection(): void {
    this.syncChipsFromTree();
    this.showAllChips = false;
    this.filePickerOpen = false;
  }

  private syncChipsFromTree(): void {
    const selected = this.getAllNodes(this.treeNodes).filter(n => n.type === 'file' && n.selected);
    this.selectedFiles = selected.map(n => ({
      id: n.id,
      name: n.name,
      restricted: !!n.restricted,
      showTooltip: false,
    }));
  }

  get filteredFlatTree(): FlatNode[] {
    const flat = this.flattenTree(this.treeNodes, 0);
    if (!this.treeSearch.trim()) return flat;
    const q = this.treeSearch.toLowerCase();
    return flat.filter(n => n.name.toLowerCase().includes(q));
  }

  private flattenTree(nodes: TreeNode[], depth: number): FlatNode[] {
    const result: FlatNode[] = [];
    for (const node of nodes) {
      result.push({
        id: node.id, name: node.name, type: node.type,
        restricted: node.restricted, expanded: node.expanded,
        selected: node.selected, depth,
        hasChildren: !!(node.children && node.children.length > 0),
      });
      if (node.type === 'folder' && node.expanded && node.children) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  toggleTreeNode(id: string): void {
    this.mutateNode(this.treeNodes, id, n => { n.expanded = !n.expanded; });
  }

  toggleFileSelect(id: string, checked: boolean): void {
    this.setNodeSelected(id, checked);
  }

  private setNodeSelected(id: string, selected: boolean): void {
    this.mutateNode(this.treeNodes, id, n => { n.selected = selected; });
  }

  private mutateNode(nodes: TreeNode[], id: string, fn: (n: TreeNode) => void): boolean {
    for (const node of nodes) {
      if (node.id === id) { fn(node); return true; }
      if (node.children && this.mutateNode(node.children, id, fn)) return true;
    }
    return false;
  }

  private getAllNodes(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) result.push(...this.getAllNodes(node.children));
    }
    return result;
  }
}
