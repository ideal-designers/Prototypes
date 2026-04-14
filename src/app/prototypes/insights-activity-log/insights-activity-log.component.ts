import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { HeaderAction, SidebarNavItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

interface ActivityRow {
  id: string;
  time: string;
  userInitials: string;
  userName: string;
  userEmail: string;
  avatarColor: string;
  userRole: string;
  action: 'File viewing' | 'Login' | 'User invitation';
  detailsText: string;
  subText: string;
  targetName?: string;
  targetPath?: string;
  viewingTime?: string;
  viewerType?: string;
  viewerMode?: string;
  version?: number;
  inviteeEmail?: string;
  appType?: string;
}

interface FileTreeNode {
  id: string;
  name: string;
  type: 'root' | 'folder' | 'file';
  checked: boolean;
  indeterminate: boolean;
  expanded: boolean;
  children?: FileTreeNode[];
}

@Component({
  selector: 'fvdr-insights-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout" [class.dark-theme]="isDark">

      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Project Nova"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavClick($event)"
      />

      <!-- ── Main Area ─────────────────────────────────────────── -->
      <div class="main-area">

        <fvdr-header
          [breadcrumbs]="headerBreadcrumbs"
          [actions]="headerActions"
          [showMenu]="false"
          userName="IR"
          (actionClick)="onHeaderAction($event)"
        />

        <div class="content">

          <!-- Figma 33310:83516 — Target filter + Filters row (gap-[16px] between them) -->
          <div class="filters-section">

          <!-- Target filter row -->
          <div class="target-filter-row">
            <span class="target-label">Report on</span>
            <button class="target-chip">
              <fvdr-icon name="folder"></fvdr-icon>
              <span>Files and folders</span>
              <fvdr-icon name="chevron-down"></fvdr-icon>
            </button>
          </div>

          <!-- Filter bar -->
          <div class="filter-bar">
            <div class="filter-bar-left">
              <button class="period-btn">
                <span class="period-placeholder">Period</span>
                <fvdr-icon name="calendar"></fvdr-icon>
              </button>
              <fvdr-dropdown
                [options]="actionOptions"
                placeholder="Action"
                [(ngModel)]="selectedAction"
                size="m"
              ></fvdr-dropdown>
              <fvdr-dropdown
                [options]="authorOptions"
                placeholder="Author"
                [(ngModel)]="selectedAuthor"
                size="m"
              ></fvdr-dropdown>
            </div>
            <div class="filter-bar-right">
              <fvdr-btn label="Export" variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Subscribe" variant="secondary" size="m" iconName="bell"></fvdr-btn>
            </div>
          </div>

          </div><!-- /filters-section -->

          <!-- Body: files panel + table + details — Figma 33310:83528 gap-[24px] -->
          <div class="body-area">

            <!-- Files panel -->
            <div class="files-panel">
              <div class="files-header">
                <span class="files-title">Files and folders</span>
              </div>

              <div class="files-tree">
                <!-- Root node -->
                <div class="tree-item tree-item--root" (click)="toggleTreeNode(fileTree[0])">
                  <!-- 16px box with absolute 24px green badge -->
                  <span class="tree-brand-box">
                    <span class="tree-brand-icon">RN</span>
                  </span>
                  <span
                    class="tree-checkbox"
                    [class.checked]="fileTree[0].checked"
                    [class.indeterminate]="fileTree[0].indeterminate"
                    (click)="toggleRootCheckbox($event)"
                  >
                    <fvdr-icon *ngIf="fileTree[0].checked && !fileTree[0].indeterminate" name="check"></fvdr-icon>
                    <fvdr-icon *ngIf="fileTree[0].indeterminate" name="minus"></fvdr-icon>
                  </span>
                  <span class="tree-label">{{ fileTree[0].name }}</span>
                </div>

                <ng-container *ngIf="fileTree[0].expanded">
                  <ng-container *ngFor="let node of fileTree[0].children">
                    <div
                      class="tree-item tree-item--child"
                      [class.tree-item--folder]="node.type === 'folder'"
                      [class.tree-item--file]="node.type === 'file'"
                      (click)="node.type === 'folder' ? toggleTreeNode(node) : null"
                    >
                      <!-- Chevron or ghost placeholder (16×16) -->
                      <button
                        *ngIf="node.type === 'folder'"
                        class="tree-expand"
                        (click)="toggleTreeNode(node); $event.stopPropagation()"
                      >
                        <fvdr-icon [name]="node.expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                      </button>
                      <span *ngIf="node.type === 'file'" class="tree-expand-placeholder"></span>

                      <!-- Checkbox -->
                      <fvdr-checkbox
                        [(ngModel)]="node.checked"
                        (ngModelChange)="onChildCheckChange()"
                        (click)="$event.stopPropagation()"
                      ></fvdr-checkbox>

                      <!-- Icon + name group (gap 8px) -->
                      <span class="tree-icon-name">
                        <fvdr-file-icon
                          [type]="node.type === 'folder' ? 'folder' : 'pdf'"
                        ></fvdr-file-icon>
                        <span class="tree-label">{{ node.name }}</span>
                      </span>
                    </div>
                  </ng-container>
                </ng-container>
              </div>
            </div>

            <!-- Table wrapper -->
            <div class="table-wrapper">
              <div class="table-area">

                <!-- DS-matching table header -->
                <div class="table-header">
                  <div class="col-time th th--first">Date and time</div>
                  <div class="col-user th">Author</div>
                  <div class="col-action th">Action</div>
                  <div class="col-details th th--last" [class.hidden]="detailsPanelOpen">Description</div>
                </div>

                <!-- Today group -->
                <div class="group-label">Today</div>
                <div
                  *ngFor="let row of todayRows; let i = index"
                  class="table-row"
                  [class.table-row--even]="i % 2 === 1"
                  [class.table-row--selected]="selectedRow?.id === row.id"
                  (click)="selectRow(row)"
                >
                  <div class="col-time">
                    <span class="time-text">{{ row.time }}</span>
                  </div>
                  <div class="col-user">
                    <div class="user-cell">
                      <fvdr-avatar
                        [initials]="row.userInitials"
                        size="md"
                        [color]="row.avatarColor"
                        textColor="#ffffff"
                      ></fvdr-avatar>
                      <div class="user-info">
                        <span class="user-name">{{ row.userName }}</span>
                        <span class="user-email">{{ row.userEmail }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-action">
                    <span class="action-text">{{ row.action }}</span>
                    <span *ngIf="detailsPanelOpen" class="action-sub">{{ row.subText }}</span>
                  </div>
                  <div class="col-details" [class.hidden]="detailsPanelOpen">
                    <span class="details-text">{{ row.detailsText }}</span>
                  </div>
                </div>

                <!-- Yesterday group -->
                <div class="group-label">Yesterday</div>
                <div
                  *ngFor="let row of yesterdayRows; let i = index"
                  class="table-row"
                  [class.table-row--even]="i % 2 === 1"
                  [class.table-row--selected]="selectedRow?.id === row.id"
                  (click)="selectRow(row)"
                >
                  <div class="col-time">
                    <span class="time-text">{{ row.time }}</span>
                  </div>
                  <div class="col-user">
                    <div class="user-cell">
                      <fvdr-avatar
                        [initials]="row.userInitials"
                        size="md"
                        [color]="row.avatarColor"
                        textColor="#ffffff"
                      ></fvdr-avatar>
                      <div class="user-info">
                        <span class="user-name">{{ row.userName }}</span>
                        <span class="user-email">{{ row.userEmail }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-action">
                    <span class="action-text">{{ row.action }}</span>
                    <span *ngIf="detailsPanelOpen" class="action-sub">{{ row.subText }}</span>
                  </div>
                  <div class="col-details" [class.hidden]="detailsPanelOpen">
                    <span class="details-text">{{ row.detailsText }}</span>
                  </div>
                </div>

              </div><!-- /table-area -->

            </div><!-- /table-wrapper -->

            <!-- Details panel — Figma 33310:83631 — direct child of body-area so gap:24px applies -->
            <div class="details-panel" [class.details-panel--open]="detailsPanelOpen">
                <div class="details-panel-inner" *ngIf="selectedRow">

                  <!-- Header: bg stone-200, h-48, pl-16, no border-bottom -->
                  <div class="dp-header">
                    <span class="dp-title">{{ selectedRow.action }}</span>
                    <button class="dp-close-btn" (click)="closeDetails()" title="Close">
                      <fvdr-icon name="cancel"></fvdr-icon>
                    </button>
                  </div>

                  <!-- Target + Author section: px-16 pt-16 pb-16, gap-16 flex-col, border-bottom divider -->
                  <div class="dp-top-section">
                    <div class="dp-field-group" *ngIf="selectedRow.targetName">
                      <span class="dp-label">Target</span>
                      <div class="dp-target-item">
                        <fvdr-file-icon type="doc"></fvdr-file-icon>
                        <span class="dp-target-name">{{ selectedRow.targetName }}</span>
                      </div>
                    </div>

                    <div class="dp-field-group">
                      <span class="dp-label">Author</span>
                      <div class="dp-author-row">
                        <fvdr-avatar
                          [initials]="selectedRow.userInitials"
                          size="sm"
                          [color]="selectedRow.avatarColor"
                          textColor="#ffffff"
                        ></fvdr-avatar>
                        <div class="dp-author-info">
                          <div class="dp-author-name">{{ selectedRow.userName }}</div>
                          <div class="dp-author-email">{{ selectedRow.userEmail }}</div>
                          <fvdr-badge [label]="selectedRow.userRole" variant="neutral"></fvdr-badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Actions bar: px-16 pt-8 pb-16, gap-16, 5 icon buttons in stone-200 squares -->
                  <div class="dp-actions">
                    <button class="dp-action-btn" title="Filter"><fvdr-icon name="filter"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Download"><fvdr-icon name="download"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Subscribe"><fvdr-icon name="bell"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Share"><fvdr-icon name="share"></fvdr-icon></button>
                    <button class="dp-action-btn" title="More"><fvdr-icon name="more"></fvdr-icon></button>
                  </div>

                  <!-- Detail fields: p-16, gap-16, flex-col, no individual borders -->
                  <div class="dp-fields">
                    <ng-container *ngIf="selectedRow.action === 'File viewing'">
                      <div class="dp-field">
                        <span class="dp-label">Total viewing time</span>
                        <span class="dp-field-value">{{ selectedRow.viewingTime }}</span>
                      </div>
                      <div class="dp-field">
                        <span class="dp-label">File path</span>
                        <span class="dp-field-value">{{ selectedRow.targetPath }}</span>
                      </div>
                      <div class="dp-field">
                        <span class="dp-label">Viewer type</span>
                        <span class="dp-field-value">{{ selectedRow.viewerType }}</span>
                      </div>
                      <div class="dp-field">
                        <span class="dp-label">Viewer mode</span>
                        <span class="dp-field-value">{{ selectedRow.viewerMode }}</span>
                      </div>
                      <div class="dp-field">
                        <span class="dp-label">Version</span>
                        <span class="dp-field-value">{{ selectedRow.version }}</span>
                      </div>
                    </ng-container>

                    <ng-container *ngIf="selectedRow.action === 'Login'">
                      <div class="dp-field">
                        <span class="dp-label">Application type</span>
                        <span class="dp-field-value">{{ selectedRow.appType }}</span>
                      </div>
                    </ng-container>

                    <ng-container *ngIf="selectedRow.action === 'User invitation'">
                      <div class="dp-field">
                        <span class="dp-label">Invited user</span>
                        <span class="dp-field-value">{{ selectedRow.inviteeEmail }}</span>
                      </div>
                    </ng-container>
                  </div>

                </div>
              </div><!-- /details-panel -->

          </div><!-- /body-area -->
        </div><!-- /content -->
      </div><!-- /main-area -->
    </div><!-- /page-layout -->
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family, 'Open Sans', sans-serif);
      color: var(--color-text-primary);
    }

    /* ── Page Layout ──────────────────────────────────── */
    .page-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ── Main Area ───────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Content ─────────────────────────────────────── */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      /* Figma 33310:83515 — pt-[24px] px-[24px], no bottom padding, gap-[24px] between rows */
      padding: 24px 24px 0;
      gap: 24px;
    }

    /* ── Target Filter Row ───────────────────────────── */
    .target-filter-row {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      /* margin removed — gap on .content handles spacing */
      font-size: 14px;
      flex-shrink: 0;
    }

    .target-label { color: var(--color-text-secondary); }

    .target-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-primary-500);
      font-size: var(--text-label-s-size);
      font-weight: var(--text-label-s-weight);
      padding: 0;
      font-family: var(--font-family);
    }
    .target-chip:hover { color: var(--color-primary-600); }

    /* ── Filters Section ─────────────────────────────── */
    /* Figma 33310:83516 — flex-col gap-[16px] */
    .filters-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex-shrink: 0;
      width: 100%;
    }

    /* ── Filter Bar ──────────────────────────────────── */
    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      flex-shrink: 0;
    }

    .filter-bar-left  { display: flex; align-items: center; gap: var(--space-2, 8px); }
    .filter-bar-right { display: flex; align-items: center; gap: var(--space-2, 8px); }

    .period-btn {
      height: 40px;
      width: 240px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-3, 12px);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-stone-0);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: var(--text-body3-size);
      font-family: var(--font-family);
    }
    .period-btn:hover { border-color: var(--color-stone-500); }
    .period-placeholder { color: var(--color-text-placeholder, #9C9EA8); }

    /* ── Body Area ───────────────────────────────────── */
    /* Figma 33310:83528 — flex row, gap-[24px] between columns, no border */
    .body-area {
      flex: 1;
      display: flex;
      overflow: hidden;
      gap: 24px;
      min-height: 0;
    }

    /* ── Files Panel ─────────────────────────────────── */
    /* Figma 33310:83529 — w-[320px] shrink-0, no border (gap-[24px] separates columns) */
    .files-panel {
      width: 320px;
      min-width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    .files-header {
      height: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: var(--color-stone-200);
      border-radius: 4px 0 0 0;
      flex-shrink: 0;
    }

    .files-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .files-tree {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0 16px;
    }

    /* Tree items */
    .tree-item {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 8px 16px;
      cursor: pointer;
      gap: 16px;
    }
    .tree-item:hover { background: var(--color-hover-bg); }
    .tree-item--child { padding-left: 16px; }

    .tree-expand {
      width: 16px;
      height: 16px;
      min-width: 16px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 0;
    }

    .tree-expand-placeholder { width: 16px; height: 16px; min-width: 16px; flex-shrink: 0; }

    .tree-checkbox {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      border: 1.5px solid var(--color-stone-500);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      cursor: pointer;
      background: var(--color-stone-0);
      color: var(--color-stone-0);
      transition: background 0.12s, border-color 0.12s;
    }
    .tree-checkbox.checked,
    .tree-checkbox.indeterminate {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    /* Root project badge — 16px box with 24px abs badge inside (matches Figma) */
    .tree-brand-box {
      width: 16px;
      height: 16px;
      min-width: 16px;
      flex-shrink: 0;
      position: relative;
    }
    .tree-brand-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      background: var(--color-primary-500);
      color: #fff;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    /* Icon+name inner section */
    .tree-icon-name {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .tree-label {
      font-size: 14px;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Table Wrapper ───────────────────────────────── */
    /* flex: 1 fills remaining space between files-panel and details-panel */
    .table-wrapper {
      flex: 1;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Table Area ──────────────────────────────────── */
    .table-area {
      flex: 1;
      overflow-y: auto;
      min-width: 0;
    }

    /* DS-matching table header */
    .table-header {
      display: flex;
      align-items: center;
      height: 48px;
      min-height: 48px;
      background: var(--color-stone-200);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .th {
      font-size: var(--text-base-s-size, 14px);
      font-weight: 600;
      color: var(--color-text-primary);
      padding: 0 var(--space-4);
      white-space: nowrap;
    }

    /* Rounded corners on first/last th cell */
    .th--first { border-radius: 4px 0 0 4px; }
    .th--last  { border-radius: 0 4px 4px 0; }

    /* Group label — no border, secondary text */
    .group-label {
      padding: var(--space-3) var(--space-4) var(--space-2);
      font-size: var(--text-body3-size);
      font-weight: 600;
      color: var(--color-text-secondary);
      background: var(--color-stone-0);
    }

    /* Table rows — zebra via class, no borders */
    .table-row {
      display: flex;
      align-items: center;
      min-height: 68px;
      background: var(--color-stone-0);
      cursor: pointer;
      transition: background 0.1s;
    }

    .table-row--even { background: var(--color-stone-100); }
    .table-row:hover { background: var(--color-hover-bg); }
    .table-row--selected { background: var(--color-primary-50) !important; }

    /* Column widths */
    .col-time {
      width: 128px;
      min-width: 128px;
      padding: 0 var(--space-4);
      flex-shrink: 0;
    }

    .col-user {
      width: 232px;
      min-width: 232px;
      padding: 0 var(--space-4);
      flex-shrink: 0;
    }

    .col-action {
      width: 186px;
      min-width: 186px;
      padding: 0 var(--space-4);
      flex-shrink: 0;
    }

    .col-details {
      flex: 1;
      min-width: 0;
      padding: 0 var(--space-4);
    }

    .col-details.hidden { display: none; }

    .time-text {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    /* User cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: var(--text-label-s-size);
      font-weight: var(--text-label-s-weight);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-text {
      display: block;
      font-size: var(--text-body3-size);
      color: var(--color-text-primary);
    }

    .action-sub {
      display: block;
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .details-text {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Details Panel ───────────────────────────────── */
    /* Figma 33310:83631 — w-[320px] shrink-0 pb-[24px], no border (gap handles separation) */
    .details-panel {
      width: 0;
      flex-shrink: 0;
      overflow: hidden;
      transition: width 0.22s ease;
    }

    .details-panel--open { width: 320px; }

    .details-panel-inner {
      width: 320px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background: var(--color-stone-0);
      padding-bottom: 24px;
    }

    /* ── Details Panel internals (Figma 33310:83631) ─── */

    /* Header: bg stone-200, h-48, pl-16, no border-bottom */
    .dp-header {
      height: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 16px;
      background: var(--color-stone-200);
      border-radius: 4px 4px 0 0;
      flex-shrink: 0;
    }

    .dp-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 20px;
    }

    /* Close button: stone-200 bg, p-16, rounded-tr-4 rounded-br-4 */
    .dp-close-btn {
      height: 48px;
      min-width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      background: var(--color-stone-200);
      border: none;
      cursor: pointer;
      border-radius: 0 4px 0 0;
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .dp-close-btn:hover { color: var(--color-text-primary); }

    /* Top section: Target + Author — flex-col gap-16, px-16 pt-16 pb-16, border-bottom divider */
    .dp-top-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }

    /* Generic field group: label + content, gap-4 */
    .dp-field-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Labels: 12px/600/primary — Figma caption-2 */
    .dp-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 16px;
    }

    /* Target item: fvdr-file-icon (20px) + filename text, gap-8, pt-4 */
    .dp-target-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding-top: 4px;
    }

    .dp-target-name {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-primary);
      line-height: 20px;
    }

    /* Author row: sm avatar (32px) + info stack, gap-8 */
    .dp-author-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .dp-author-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .dp-author-name {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-primary);
      line-height: 20px;
    }

    .dp-author-email {
      font-size: 12px;
      font-weight: 400;
      color: var(--color-text-secondary);
      line-height: 16px;
    }

    /* Actions bar: px-16 pt-8 pb-16, gap-16 — Figma 30978:432713 */
    .dp-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px 16px;
      flex-shrink: 0;
    }

    /* Action buttons: 32×32px stone-200 bg, rounded-4, icon 16px */
    .dp-action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--color-stone-200);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .dp-action-btn:hover { background: var(--color-stone-300, #dee0eb); color: var(--color-text-primary); }

    /* Detail fields container: p-16, gap-16, flex-col — Figma 30195:22316 */
    .dp-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    /* Individual field: label + value, gap-4 */
    .dp-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dp-field-value {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-secondary);
      line-height: 20px;
    }

    /* ── Dark Theme ──────────────────────────────────── */
    .dark-theme.page-layout { background: var(--primitive-dark-stone-0); }

    .dark-theme .files-panel      { background: var(--primitive-dark-stone-100); }
    .dark-theme .files-header     { background: var(--primitive-dark-stone-200); }
    .dark-theme .files-title      { color: var(--primitive-dark-stone-1000); }
    .dark-theme .tree-item:hover  { background: var(--primitive-dark-stone-300); }
    .dark-theme .tree-label       { color: var(--primitive-dark-stone-900); }

    .dark-theme .table-header     { background: var(--primitive-dark-stone-200); }
    .dark-theme .th               { color: var(--primitive-dark-stone-1000); }
    .dark-theme .group-label      { color: var(--primitive-dark-stone-700); background: var(--primitive-dark-stone-0); }
    .dark-theme .table-row        { background: var(--primitive-dark-stone-0); }
    .dark-theme .table-row--even  { background: var(--primitive-dark-stone-100); }
    .dark-theme .table-row:hover  { background: rgba(255,255,255,0.05); }
    .dark-theme .table-row--selected { background: rgba(44,156,116,0.12) !important; }

    .dark-theme .time-text        { color: var(--primitive-dark-stone-700); }
    .dark-theme .user-name        { color: var(--primitive-dark-stone-1000); }
    .dark-theme .user-email       { color: var(--primitive-dark-stone-800); }
    .dark-theme .action-text      { color: var(--primitive-dark-stone-900); }
    .dark-theme .action-sub       { color: var(--primitive-dark-stone-700); }
    .dark-theme .details-text     { color: var(--primitive-dark-stone-700); }

    .dark-theme .details-panel-inner { background: var(--primitive-dark-stone-200); }
    .dark-theme .dp-header        { background: var(--primitive-dark-stone-200); }
    .dark-theme .dp-close-btn     { background: var(--primitive-dark-stone-200); color: var(--primitive-dark-stone-700); }
    .dark-theme .dp-title         { color: var(--primitive-dark-stone-1000); }
    .dark-theme .dp-top-section   { border-bottom-color: var(--primitive-dark-stone-400); }
    .dark-theme .dp-label         { color: var(--primitive-dark-stone-1000); }
    .dark-theme .dp-target-name   { color: var(--primitive-dark-stone-900); }
    .dark-theme .dp-author-name   { color: var(--primitive-dark-stone-1000); }
    .dark-theme .dp-author-email  { color: var(--primitive-dark-stone-800); }
    .dark-theme .dp-action-btn    { background: var(--primitive-dark-stone-300); color: var(--primitive-dark-stone-700); }
    .dark-theme .dp-field-value   { color: var(--primitive-dark-stone-700); }
    .dark-theme .period-btn       { background: var(--primitive-dark-stone-200); border-color: var(--primitive-dark-stone-500); color: var(--primitive-dark-stone-900); }
    .dark-theme .target-label     { color: var(--primitive-dark-stone-800); }
  `],
})
export class InsightsActivityLogComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  isDark = false;
  sidebarCollapsed = false;

  headerBreadcrumbs: { id: string; label: string }[] = [
    { id: 'reports', label: 'Reports' },
    { id: 'activity-log', label: 'Activity log' },
  ];

  get headerActions(): HeaderAction[] {
    return [
      { id: 'theme', icon: this.isDark ? 'theme-light' : 'theme-dark' },
      { id: 'help', icon: 'help' },
    ];
  }

  onHeaderAction(id: string): void {
    if (id === 'theme') this.isDark = !this.isDark;
  }

  navItems: SidebarNavItem[] = [
    { id: 'dashboard',    icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Dashboard',     active: false },
    { id: 'documents',    icon: 'nav-projects',     iconActive: 'nav-projects-active',     label: 'Documents',     active: false },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants',  active: false },
    { id: 'permissions',  icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Permissions',   active: false },
    { id: 'qa',           icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Q&A',           active: false },
    { id: 'reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',      label: 'Reports',       active: true  },
    { id: 'settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Settings',      active: false },
  ];

  onNavClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  fileTree: FileTreeNode[] = [
    {
      id: 'root',
      name: 'Room name',
      type: 'root',
      checked: false,
      indeterminate: true,
      expanded: true,
      children: [
        { id: 'f1', name: '1  Company A',   type: 'folder', checked: true, indeterminate: false, expanded: false, children: [] },
        { id: 'f2', name: '2  Company B',   type: 'folder', checked: true, indeterminate: false, expanded: false, children: [] },
        { id: 'f3', name: '3  Company C',   type: 'folder', checked: true, indeterminate: false, expanded: false, children: [] },
        { id: 'f4', name: '4  Company D',   type: 'folder', checked: true, indeterminate: false, expanded: false, children: [] },
        { id: 'r1', name: '5  Report 2025', type: 'file',   checked: true, indeterminate: false, expanded: false },
      ],
    },
  ];

  selectedAction: string | string[] = '';
  selectedAuthor: string | string[] = '';

  actionOptions = [
    { value: '',                label: 'All actions'     },
    { value: 'file-viewing',    label: 'File viewing'    },
    { value: 'login',           label: 'Login'           },
    { value: 'user-invitation', label: 'User invitation' },
  ];

  authorOptions = [
    { value: '',       label: 'All authors' },
    { value: 'olivia', label: 'Olivia Rhye' },
    { value: 'avery',  label: 'Avery Park'  },
  ];

  selectedRow: ActivityRow | null = null;
  detailsPanelOpen = false;

  todayRows: ActivityRow[] = [
    {
      id: '1', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '1.9 Contracts - Contract - Standard Accts Pay.doc',
      targetPath: '/1 Team Structure/1.9 Contracts - Contract - Standard Accts Pay.doc',
      viewingTime: '10 s', viewerType: 'Ideals Spreadsheet Viewer', viewerMode: 'Normal', version: 2,
    },
    {
      id: '2', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'Login',
      detailsText: 'Application type: Web application', subText: 'Web application', appType: 'Web application',
    },
    {
      id: '3', time: '4:35:25 PM',
      userInitials: 'AP', userName: 'Avery Park', userEmail: 'avery@gmail.com',
      avatarColor: '#9747FF', userRole: 'Viewers',
      action: 'Login',
      detailsText: 'Application type: Web application', subText: 'Web application', appType: 'Web application',
    },
  ];

  yesterdayRows: ActivityRow[] = [
    {
      id: '4', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'Login',
      detailsText: 'Application type: Web application', subText: 'Web application', appType: 'Web application',
    },
    {
      id: '5', time: '4:35:25 PM',
      userInitials: 'AP', userName: 'Avery Park', userEmail: 'avery@gmail.com',
      avatarColor: '#9747FF', userRole: 'Viewers',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s', viewerType: 'Ideals Spreadsheet Viewer', viewerMode: 'Normal', version: 1,
    },
    {
      id: '6', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s', viewerType: 'Ideals Spreadsheet Viewer', viewerMode: 'Normal', version: 1,
    },
    {
      id: '7', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'User invitation',
      detailsText: 'Invited: leslie.alexander@gmail.com',
      subText: 'leslie.alexander@gmail.com',
      inviteeEmail: 'leslie.alexander@gmail.com',
    },
    {
      id: '8', time: '4:35:25 PM',
      userInitials: 'OR', userName: 'Olivia Rhye', userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74', userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s', viewerType: 'Ideals Spreadsheet Viewer', viewerMode: 'Normal', version: 1,
    },
  ];

  ngOnInit(): void {
    this.tracker.trackPageView('insights-activity-log');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  selectRow(row: ActivityRow): void {
    if (this.selectedRow?.id === row.id) {
      this.closeDetails();
    } else {
      this.selectedRow = row;
      this.detailsPanelOpen = true;
      this.tracker.trackTask('insights-activity-log', 'task_complete');
    }
  }

  closeDetails(): void {
    this.selectedRow = null;
    this.detailsPanelOpen = false;
  }

  toggleTreeNode(node: FileTreeNode): void {
    if (node.children) node.expanded = !node.expanded;
  }

  toggleRootCheckbox(event: Event): void {
    event.stopPropagation();
    const root = this.fileTree[0];
    if (root.indeterminate) {
      root.checked = true;
      root.indeterminate = false;
    } else {
      root.checked = !root.checked;
    }
    root.children?.forEach(c => { c.checked = root.checked; });
  }

  onChildCheckChange(): void {
    const root = this.fileTree[0];
    if (!root.children) return;
    const allChecked  = root.children.every(c => c.checked);
    const noneChecked = root.children.every(c => !c.checked);
    root.checked = allChecked;
    root.indeterminate = !allChecked && !noneChecked;
  }
}
