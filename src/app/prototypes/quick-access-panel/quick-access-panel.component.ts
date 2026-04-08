import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import { FvdrIconName } from '../../shared/ds/icons/icons';
import { TrackerService } from '../../services/tracker.service';

interface ShortcutItem {
  id: string;
  label: string;
  icon: FvdrIconName;
}

interface TreeNode {
  id: string;
  index: string;
  label: string;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  isActive: boolean;
}

@Component({
  selector: 'fvdr-quick-access-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="layout">

      <!-- Quick Access Panel -->
      <div
        class="qa-panel"
        [style.width.px]="panelWidth"
        [class.is-resizing]="isResizing"
      >
        <!-- Panel content -->
        <div class="qa-content">

          <!-- Header -->
          <div class="qa-header">
            <span class="qa-header__title">Quick access</span>
            <div class="qa-header__actions">
              <button class="icon-btn" title="Collapse">
                <fvdr-icon name="angle-double-left" />
              </button>
              <button class="icon-btn" title="Navigate">
                <fvdr-icon name="chevron-left" />
              </button>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="qa-shortcuts">
            <div
              *ngFor="let item of shortcuts"
              class="qa-shortcut-item"
            >
              <span class="qa-shortcut-icon">
                <fvdr-icon [name]="item.icon" />
              </span>
              <span class="qa-shortcut-label">{{ item.label }}</span>
            </div>
          </div>

          <!-- Folder structure -->
          <div class="qa-tree">
            <ng-container *ngFor="let node of treeNodes">
              <div
                class="qa-tree-item"
                [class.qa-tree-item--active]="node.isActive"
                [style.padding-left.px]="16 + node.level * 16"
                (click)="toggleNode(node)"
              >
                <!-- Chevron / spacer -->
                <span class="qa-tree-chevron">
                  <ng-container *ngIf="node.hasChildren">
                    <fvdr-icon [name]="node.expanded ? 'chevron-down' : 'chevron-right'" />
                  </ng-container>
                </span>

                <!-- Folder icon or project badge -->
                <ng-container *ngIf="node.level === 0; else fileIcon">
                  <span class="qa-project-badge">RN</span>
                </ng-container>
                <ng-template #fileIcon>
                  <span class="qa-folder-icon">
                    <fvdr-icon name="folder" />
                  </span>
                </ng-template>

                <!-- Index -->
                <span *ngIf="node.index" class="qa-tree-index">{{ node.index }}</span>

                <!-- Label -->
                <span class="qa-tree-label">{{ node.label }}</span>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Resize handle -->
        <div
          class="qa-resize-handle"
          [class.qa-resize-handle--hover]="handleHovered"
          (mouseenter)="handleHovered = true"
          (mouseleave)="!isResizing && (handleHovered = false)"
          (mousedown)="startResize($event)"
        >
          <div class="qa-resize-line"></div>
        </div>
      </div>

      <!-- Main content area -->
      <div class="main-area">
        <div class="main-toolbar">
          <div class="toolbar-btns">
            <fvdr-btn label="Upload" variant="secondary" size="m" />
            <fvdr-btn label="New folder" variant="secondary" size="m" />
            <fvdr-btn label="New document" variant="secondary" size="m" />
            <fvdr-btn label="" variant="ghost" size="m">
              <fvdr-icon name="more" />
            </fvdr-btn>
          </div>
          <div class="toolbar-right">
            <fvdr-btn label="Filter" variant="ghost" size="m" />
            <fvdr-search placeholder="Search..." />
          </div>
        </div>

        <div class="table-placeholder">
          <div class="table-header-row">
            <div class="col-check"></div>
            <div class="col-index">Index</div>
            <div class="col-name">Document name</div>
            <div class="col-type">Type</div>
            <div class="col-date">Modified</div>
            <div class="col-status">Status</div>
            <div class="col-owner">Owner</div>
            <div class="col-actions"></div>
          </div>
          <div *ngFor="let row of tableRows" class="table-row">
            <div class="col-check">
              <fvdr-checkbox [(ngModel)]="row.checked" />
            </div>
            <div class="col-index">{{ row.index }}</div>
            <div class="col-name">
              <span class="row-icon"><fvdr-icon name="folder" /></span>
              {{ row.name }}
            </div>
            <div class="col-type">{{ row.type }}</div>
            <div class="col-date">{{ row.date }}</div>
            <div class="col-status">
              <fvdr-badge [label]="row.status" [variant]="row.statusVariant" />
            </div>
            <div class="col-owner">{{ row.owner }}</div>
            <div class="col-actions">
              <button class="icon-btn"><fvdr-icon name="more" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      height: 100vh;
      overflow: hidden;
    }

    /* ── Layout ─────────────────────────────── */
    .layout {
      display: flex;
      height: 100%;
      background: var(--color-stone-100);
    }

    /* ── Quick Access Panel ──────────────────── */
    .qa-panel {
      display: flex;
      flex-shrink: 0;
      position: relative;
      background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      min-width: 200px;
      max-width: 560px;
      user-select: none;
    }

    .qa-panel.is-resizing {
      cursor: col-resize;
    }

    .qa-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* Header */
    .qa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 var(--space-4);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }

    .qa-header__title {
      font-size: var(--text-label-s-size, 14px);
      font-weight: var(--text-label-s-weight, 600);
      color: var(--color-text-primary);
    }

    .qa-header__actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Shortcuts */
    .qa-shortcuts {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .qa-shortcut-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      height: 40px;
      padding: 0 var(--space-4);
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: var(--text-body3-size, 14px);
    }

    .qa-shortcut-item:hover {
      background: var(--color-hover-bg);
    }

    .qa-shortcut-icon {
      display: flex;
      align-items: center;
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }

    .qa-shortcut-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Tree */
    .qa-tree {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--color-divider);
      padding-top: var(--space-2);
    }

    .qa-tree-item {
      display: flex;
      align-items: center;
      height: 40px;
      padding-right: var(--space-4);
      gap: var(--space-2);
      cursor: pointer;
      font-size: var(--text-body3-size, 14px);
      color: var(--color-text-primary);
      flex-shrink: 0;
    }

    .qa-tree-item:hover {
      background: var(--color-hover-bg);
    }

    .qa-tree-item--active {
      background: var(--color-primary-50);
      border-radius: var(--radius-sm);
    }

    .qa-tree-chevron {
      display: flex;
      align-items: center;
      font-size: 16px;
      width: 16px;
      flex-shrink: 0;
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
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .qa-folder-icon {
      display: flex;
      align-items: center;
      font-size: 20px;
      width: 20px;
      flex-shrink: 0;
      color: var(--color-text-secondary);
    }

    .qa-tree-index {
      color: var(--color-text-secondary);
      font-size: var(--text-body3-size, 14px);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .qa-tree-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    /* ── Resize Handle ───────────────────────── */
    .qa-resize-handle {
      position: absolute;
      right: -4px;
      top: 0;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      z-index: 10;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }

    .qa-resize-line {
      width: 2px;
      background: transparent;
      transition: background 0.15s ease;
    }

    .qa-resize-handle--hover .qa-resize-line,
    .qa-resize-handle:active .qa-resize-line {
      background: var(--color-stone-400);
    }

    /* ── Main content ────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding: var(--space-6);
      gap: var(--space-4);
      overflow: hidden;
    }

    .main-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .toolbar-btns {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .toolbar-right {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    /* Table */
    .table-placeholder {
      flex: 1;
      overflow-y: auto;
      background: var(--color-stone-0);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-divider);
      box-shadow: var(--shadow-card);
    }

    .table-header-row,
    .table-row {
      display: grid;
      grid-template-columns: 32px 72px 1fr 80px 120px 100px 160px 48px;
      align-items: center;
      border-bottom: 1px solid var(--color-divider);
      min-height: 48px;
      padding: 0 var(--space-2);
    }

    .table-header-row {
      background: var(--color-stone-200);
      font-size: var(--text-label-s-size, 14px);
      font-weight: 600;
      color: var(--color-text-secondary);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .table-row {
      font-size: var(--text-body3-size, 14px);
      min-height: 44px;
    }

    .table-row:hover {
      background: var(--color-hover-bg);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .col-name {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-icon {
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }

    /* Shared */
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
      border-radius: var(--radius-full);
      font-size: 16px;
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

  panelWidth = 320;
  isResizing = false;
  handleHovered = false;

  private startX = 0;
  private startWidth = 0;

  shortcuts: ShortcutItem[] = [
    { id: 'recent', label: 'Recently viewed', icon: 'clock' },
    { id: 'recent2', label: 'Recently viewed', icon: 'clock' },
    { id: 'upload', label: 'Newly upload', icon: 'upload' },
    { id: 'favorites', label: 'Favorites', icon: 'sort' },
  ];

  treeNodes: TreeNode[] = [
    { id: '0', index: '', label: 'Conference Room', level: 0, expanded: true, hasChildren: true, isActive: false },
    { id: '1', index: '1', label: 'Client Documents', level: 1, expanded: false, hasChildren: false, isActive: false },
    { id: '2', index: '2', label: 'Archived Files', level: 1, expanded: false, hasChildren: false, isActive: false },
    { id: '3', index: '3', label: 'Design Assets', level: 1, expanded: false, hasChildren: false, isActive: false },
    { id: '4', index: '4', label: 'Research Data', level: 1, expanded: true, hasChildren: true, isActive: true },
    { id: '4.1', index: '4.1', label: 'Innovative Studies', level: 2, expanded: true, hasChildren: true, isActive: false },
    { id: '4.1.1', index: '4.1.1', label: 'Exploration Initiatives', level: 3, expanded: true, hasChildren: true, isActive: false },
    { id: '4.1.1.1', index: '4.1.1.1', label: 'Academic Ventures', level: 4, expanded: false, hasChildren: false, isActive: false },
    { id: '4.1.2', index: '4.1.2', label: 'Discovery Projects', level: 3, expanded: false, hasChildren: false, isActive: false },
    { id: '4.1.3', index: '4.1.3', label: 'Research Endeavors', level: 3, expanded: false, hasChildren: false, isActive: false },
    { id: '4.2', index: '4.2', label: 'Innovative Studies', level: 2, expanded: false, hasChildren: false, isActive: false },
    { id: '4.3', index: '4.3', label: 'Exploratory Research', level: 2, expanded: false, hasChildren: false, isActive: false },
    { id: '5', index: '5', label: 'Comprehensive Project Documentation and Resource Files', level: 1, expanded: false, hasChildren: false, isActive: false },
    { id: 'qa', index: '', label: 'Q&A attachments', level: 1, expanded: false, hasChildren: false, isActive: false },
  ];

  tableRows = [
    { checked: false, index: '1', name: 'Client Documents', type: 'Folder', date: 'Jan 12, 2026', status: 'Published', statusVariant: 'success' as const, owner: 'Alex B.' },
    { checked: false, index: '2', name: 'Archived Files', type: 'Folder', date: 'Jan 10, 2026', status: 'Published', statusVariant: 'success' as const, owner: 'Maria S.' },
    { checked: false, index: '3', name: 'Design Assets', type: 'Folder', date: 'Dec 28, 2025', status: 'Published', statusVariant: 'success' as const, owner: 'John D.' },
    { checked: false, index: '4', name: 'Research Data', type: 'Folder', date: 'Mar 5, 2026', status: 'Published', statusVariant: 'success' as const, owner: 'Anna K.' },
    { checked: false, index: '5', name: 'Comprehensive Project Documentation', type: 'Folder', date: 'Feb 20, 2026', status: 'Unpublished', statusVariant: 'neutral' as const, owner: 'Bob L.' },
  ];

  ngOnInit(): void {
    this.tracker.trackPageView('quick-access-panel');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    this.stopResize();
  }

  toggleNode(node: TreeNode): void {
    if (node.hasChildren) {
      node.expanded = !node.expanded;
    }
    this.treeNodes.forEach(n => n.isActive = false);
    node.isActive = true;
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.panelWidth;
    this.handleHovered = true;

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - this.startX;
      const newWidth = Math.min(560, Math.max(200, this.startWidth + delta));
      this.panelWidth = newWidth;
    };

    const onUp = () => {
      this.isResizing = false;
      this.handleHovered = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private stopResize(): void {
    this.isResizing = false;
  }
}
