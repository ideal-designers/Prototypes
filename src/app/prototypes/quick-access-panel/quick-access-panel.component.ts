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
  hovered: boolean;
}

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

interface NavItem {
  id: string;
  icon: FvdrIconName;
  iconActive: FvdrIconName;
  active: boolean;
  title: string;
}

@Component({
  selector: 'fvdr-quick-access-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Sidebar 72px ── -->
      <nav class="sidebar sidebar--collapsed">
        <div class="account-switcher">
          <div class="project-badge-nav">RN</div>
        </div>

        <div class="nav-list">
          <button *ngFor="let item of navItems"
            class="nav-item"
            [class.nav-item--active]="item.active"
            [title]="item.title">
            <span class="nav-icon-zone">
              <fvdr-icon class="icon-default" [name]="item.icon"></fvdr-icon>
              <fvdr-icon class="icon-active"  [name]="item.iconActive"></fvdr-icon>
            </span>
          </button>
        </div>

        <div class="sidebar-bottom">
          <div class="sidebar-logo-sm">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="3" fill="#084D4B"/>
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M6 16C6 21.523 10.477 26 16 26C21.522 26 26 21.522 26 16C26 10.477 21.522 6 16 6C10.477 6 6 10.477 6 16ZM24 16C24 20.418 20.418 24 16 24C15.729 24 15.462 23.983 15.2 23.95C18.357 23.557 20.8 20.864 20.8 17.6C20.8 14.336 18.357 11.643 15.2 11.25C15.462 11.217 15.729 11.2 16 11.2C20.418 11.2 24 14.582 24 17.6V16ZM8 16C8 14.674 9.074 13.6 10.4 13.6C11.726 13.6 12.8 14.674 12.8 16C12.8 17.326 11.726 18.4 10.4 18.4C9.074 18.4 8.001 17.326 8 16Z"
                fill="#8CEAA7"/>
            </svg>
          </div>
          <button class="collapse-btn" title="Expand">
            <fvdr-icon name="angle-double-right"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ── Main area ── -->
      <div class="main-area">

        <!-- ── Header 64px ── -->
        <header class="page-header">
          <nav class="breadcrumb">
            <span class="bc-item bc-item--link">Documents</span>
            <fvdr-icon name="chevron-right" class="bc-sep"></fvdr-icon>
            <span class="bc-item bc-item--current">All</span>
          </nav>
          <div class="header-actions">
            <button class="icon-btn" title="Dark mode">
              <fvdr-icon name="theme-dark"></fvdr-icon>
            </button>
            <button class="icon-btn" title="Help">
              <fvdr-icon name="help"></fvdr-icon>
            </button>
            <button class="icon-btn" title="View">
              <fvdr-icon name="overview"></fvdr-icon>
            </button>
            <div class="user-avatar">LZ</div>
          </div>
        </header>

        <!-- ── Content ── -->
        <div class="content-wrap">

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn label="Add" variant="primary"   size="m"></fvdr-btn>
              <fvdr-btn label="Download"      variant="secondary" size="m"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m"></fvdr-btn>
              <button class="icon-btn toolbar-more"><fvdr-icon name="more"></fvdr-icon></button>
            </div>
            <div class="toolbar-right">
              <fvdr-btn label="View as" variant="ghost" size="m"></fvdr-btn>
              <fvdr-search placeholder="Search"></fvdr-search>
              <button class="icon-btn"><fvdr-icon name="filter"></fvdr-icon></button>
            </div>
          </div>

          <!-- Content row: QA Panel + Table -->
          <div class="content-row">

            <!-- ── Quick Access Panel ── -->
            <div class="qa-panel"
                 [style.width.px]="panelWidth"
                 [class.is-resizing]="isResizing">

              <div class="qa-content">

                <!-- QA Header -->
                <div class="qa-header">
                  <span class="qa-title">Quick access</span>
                  <div class="qa-header-btns">
                    <button class="icon-btn" title="Collapse">
                      <fvdr-icon name="angle-double-left"></fvdr-icon>
                    </button>
                    <button class="icon-btn" title="Navigate back">
                      <fvdr-icon name="chevron-left"></fvdr-icon>
                    </button>
                  </div>
                </div>

                <!-- Shortcuts -->
                <div class="qa-shortcuts">
                  <div *ngFor="let s of shortcuts"
                       class="qa-sc-row"
                       (mouseenter)="s.hovered = true"
                       (mouseleave)="s.hovered = false">
                    <span class="qa-sc-icon"><fvdr-icon [name]="s.icon"></fvdr-icon></span>
                    <span class="qa-sc-label">{{ s.label }}</span>
                    <button *ngIf="s.hovered" class="icon-btn qa-sc-add" title="Add">
                      <fvdr-icon name="plus"></fvdr-icon>
                    </button>
                  </div>
                </div>

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
                      <span *ngIf="node.level > 0" class="qa-folder">
                        <fvdr-icon name="folder"></fvdr-icon>
                      </span>

                      <!-- Index -->
                      <span *ngIf="node.index" class="qa-idx">{{ node.index }}</span>

                      <!-- Label -->
                      <span class="qa-lbl">{{ node.label }}</span>
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Resize handle -->
              <div class="qa-handle"
                   [class.qa-handle--active]="handleHovered || isResizing"
                   (mouseenter)="handleHovered = true"
                   (mouseleave)="!isResizing && (handleHovered = false)"
                   (mousedown)="startResize($event)">
                <div class="qa-handle-line"></div>
              </div>
            </div>

            <!-- ── Table ── -->
            <div class="tbl-wrap">

              <!-- Header row -->
              <div class="tbl-row tbl-row--header">
                <div class="col-idx">
                  <span class="th-label">Index</span>
                </div>
                <div class="col-name">
                  <span class="th-label">Name</span>
                </div>
                <div class="col-notes">
                  <span class="th-label">Notes</span>
                </div>
                <div class="col-size">
                  <span class="th-label">Size</span>
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                </div>
                <div class="col-pub">
                  <span class="th-label">Publishing</span>
                </div>
                <div class="col-red">
                  <span class="th-label">Redaction</span>
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                </div>
                <div class="col-act">
                  <button class="icon-btn"><fvdr-icon name="filter"></fvdr-icon></button>
                </div>
              </div>

              <!-- Data rows -->
              <div *ngFor="let row of tableRows" class="tbl-row">
                <!-- Index: doc icon + number -->
                <div class="col-idx">
                  <span class="doc-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="1" width="13" height="17" rx="1" fill="#FDE8E6" stroke="#F3A49D" stroke-width="1"/>
                      <path d="M11 1v4h4" stroke="#F3A49D" stroke-width="1" fill="none"/>
                      <path d="M15 5L11 1" stroke="#F3A49D" stroke-width="1"/>
                      <line x1="5" y1="8"  x2="12" y2="8"  stroke="#F3A49D" stroke-width="1"/>
                      <line x1="5" y1="11" x2="12" y2="11" stroke="#F3A49D" stroke-width="1"/>
                      <line x1="5" y1="14" x2="9"  y2="14" stroke="#F3A49D" stroke-width="1"/>
                    </svg>
                  </span>
                  <span class="td-idx">{{ row.index }}</span>
                </div>

                <!-- Name -->
                <div class="col-name">
                  <span class="td-name">{{ row.name }}</span>
                </div>

                <!-- Notes counter -->
                <div class="col-notes">
                  <span class="notes-badge">{{ row.notes }}</span>
                </div>

                <!-- Size (two-line) -->
                <div class="col-size">
                  <span class="td-size-main">{{ row.size }}</span>
                  <span class="td-size-sub">{{ row.files }}</span>
                </div>

                <!-- Publishing icon -->
                <div class="col-pub">
                  <fvdr-icon
                    [name]="row.published ? 'finished' : 'cancel'"
                    [class.pub-yes]="row.published"
                    [class.pub-no]="!row.published">
                  </fvdr-icon>
                </div>

                <!-- Redaction chip -->
                <div class="col-red">
                  <span class="red-chip" [ngClass]="'red-chip--' + row.redaction">
                    {{ redactionLabel(row.redaction) }}
                  </span>
                </div>

                <!-- Actions (empty cell) -->
                <div class="col-act"></div>
              </div>

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
       Sidebar (72px, icon-only)
    ────────────────────────────────────────── */
    .sidebar {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: 280px;
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      transition: width 0.22s ease;
      overflow: hidden;
    }
    .sidebar--collapsed { width: 72px; }

    .account-switcher {
      display: flex;
      align-items: center;
      padding: 12px var(--space-4);
      flex-shrink: 0;
    }

    .project-badge-nav {
      width: 40px;
      height: 40px;
      background: var(--color-primary-500);
      border-radius: var(--radius-sm);
      color: white;
      font-size: var(--text-caption1-size);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-6) 0;
      overflow: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      width: 100%;
      color: var(--color-text-secondary);
    }
    .nav-item:hover { color: var(--color-text-primary); }
    .nav-item--active { color: var(--color-primary-500); font-weight: 600; }

    .nav-icon-zone {
      width: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 24px;
      position: relative;
    }

    .icon-default, .icon-active { position: absolute; }
    .icon-active { display: none; }
    .nav-item--active .icon-default { display: none; }
    .nav-item--active .icon-active  { display: block; }

    .sidebar-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-6) var(--space-4) var(--space-6) 19px;
      flex-shrink: 0;
    }
    .sidebar-logo-sm { display: flex; align-items: center; }
    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
    }
    .collapse-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

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
       Header 64px
    ────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      flex-shrink: 0;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    .bc-item { font-size: var(--font-size-base); line-height: 1; }
    .bc-item--link { color: var(--color-text-secondary); }
    .bc-item--current { color: var(--color-text-primary); font-weight: 600; }
    .bc-sep { font-size: 14px; color: var(--color-text-secondary); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary-500);
      color: white;
      font-size: var(--text-caption1-size);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
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
    .toolbar-more {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px;
      border: 1.5px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: transparent; cursor: pointer;
      color: var(--color-text-secondary);
    }
    .toolbar-more:hover { background: var(--color-hover-bg); }

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
      flex-shrink: 0;
      position: relative;
      background: var(--color-stone-0);
      min-width: 200px;
      max-width: 560px;
      overflow: hidden;
    }
    .qa-panel.is-resizing { cursor: col-resize; user-select: none; }

    .qa-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* QA Header */
    .qa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 var(--space-4);
      background: var(--color-stone-200);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .qa-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .qa-header-btns { display: flex; gap: var(--space-2); align-items: center; }

    /* Shortcuts */
    .qa-shortcuts {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid var(--color-divider);
    }
    .qa-sc-row {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 var(--space-4);
      gap: var(--space-4);
      cursor: pointer;
      position: relative;
    }
    .qa-sc-row:hover { background: var(--color-hover-bg); }
    .qa-sc-icon {
      display: flex; align-items: center;
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .qa-sc-label {
      flex: 1;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .qa-sc-add {
      margin-left: auto;
      opacity: 1;
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
      font-size: 14px;
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
      font-size: 18px;
      flex-shrink: 0;
      color: var(--color-primary-500);
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

    /* Resize handle */
    .qa-handle {
      position: absolute;
      right: -4px;
      top: 0; bottom: 0;
      width: 8px;
      cursor: col-resize;
      z-index: 10;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }
    .qa-handle-line {
      width: 2px;
      background: transparent;
      transition: background 0.15s ease;
    }
    .qa-handle--active .qa-handle-line {
      background: var(--color-stone-400);
    }

    /* ──────────────────────────────────────────
       Table
    ────────────────────────────────────────── */
    .tbl-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--color-stone-0);
      overflow: hidden;
      min-width: 0;
    }

    .tbl-row {
      display: grid;
      grid-template-columns: 120px 1fr 72px 120px 100px 180px 48px;
      align-items: center;
      border-bottom: 1px solid var(--color-divider);
    }
    .tbl-row:last-child { border-bottom: none; }
    .tbl-row:not(.tbl-row--header):hover { background: var(--color-hover-bg); }

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
    }
    .th-sort { font-size: 14px; color: var(--color-text-secondary); }

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
    .td-size-main { font-size: var(--text-caption1-size); color: var(--color-text-primary); line-height: 16px; }
    .td-size-sub  { font-size: var(--text-caption1-size); color: var(--color-text-secondary); line-height: 16px; }

    /* Publishing icon */
    .col-pub { justify-content: flex-start; }
    .pub-yes { color: var(--color-primary-500); font-size: 18px; }
    .pub-no  { color: var(--color-stone-500);   font-size: 18px; }

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
    .red-chip--applied-drafted { background: var(--color-stone-300); }
    .red-chip--drafted         { background: var(--color-stone-300); }
    .red-chip--none            { background: var(--color-stone-200); }

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

  navItems: NavItem[] = [
    { id: 'overview',     icon: 'nav-overview',      iconActive: 'nav-overview-active',      active: false, title: 'Dashboard'     },
    { id: 'projects',     icon: 'nav-projects',      iconActive: 'nav-projects-active',      active: true,  title: 'Documents'     },
    { id: 'reports',      icon: 'nav-reports',        iconActive: 'nav-reports-active',       active: false, title: 'Reports'       },
    { id: 'participants', icon: 'nav-participants',   iconActive: 'nav-participants-active',  active: false, title: 'Participants'  },
    { id: 'api',          icon: 'nav-api',            iconActive: 'nav-api-active',           active: false, title: 'Q&A'           },
    { id: 'settings',     icon: 'nav-settings',       iconActive: 'nav-settings-active',      active: false, title: 'Settings'      },
    { id: 'trash',        icon: 'trash',              iconActive: 'trash',                    active: false, title: 'Trash'         },
  ];

  shortcuts: ShortcutItem[] = [
    { id: 's1', label: 'Recently viewed', icon: 'clock',  hovered: false },
    { id: 's2', label: 'Recently viewed', icon: 'clock',  hovered: false },
    { id: 's3', label: 'Newly upload',    icon: 'upload', hovered: false },
    { id: 's4', label: 'Favorites',       icon: 'sort',   hovered: false },
  ];

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
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    this.stopResize();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup',   this.onMouseUp);
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.panelWidth;
    this.handleHovered = true;
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup',   this.onMouseUp);
  }

  private onMouseMove = (e: MouseEvent) => {
    const delta = e.clientX - this.startX;
    this.panelWidth = Math.min(560, Math.max(200, this.startWidth + delta));
  };

  private onMouseUp = () => {
    this.isResizing = false;
    this.handleHovered = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup',   this.onMouseUp);
  };

  private stopResize(): void {
    this.isResizing = false;
  }
}
