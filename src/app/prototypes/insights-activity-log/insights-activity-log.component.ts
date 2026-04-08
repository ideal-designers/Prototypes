import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
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

interface NavItem {
  id: string;
  icon: string;
  iconActive: string;
  label: string;
  active: boolean;
  open?: boolean;
  children?: { label: string; active?: boolean }[];
}

@Component({
  selector: 'fvdr-insights-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout" [class.dark-theme]="isDark">
      <!-- ── Sidebar ──────────────────────────────────────────── -->
      <nav class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">
        <div class="account-switcher">
          <div class="account-switcher-left">
            <div class="account-logo">PA</div>
            <span class="account-name" *ngIf="!sidebarCollapsed">Project Alpha</span>
          </div>
          <fvdr-icon *ngIf="!sidebarCollapsed" name="chevron-down" class="account-chevron"></fvdr-icon>
        </div>

        <div class="nav-list">
          <div class="nav-group" *ngFor="let item of navItems">
            <button
              class="nav-item"
              [class.nav-item--active]="item.active"
              [class.nav-item--open]="item.open"
              [class.nav-item--has-chevron]="item.children && !sidebarCollapsed"
              [title]="sidebarCollapsed ? item.label : ''"
              (click)="toggleNavItem(item)"
            >
              <span class="nav-icon-zone">
                <span class="nav-icon">
                  <fvdr-icon class="icon-default" [name]="$any(item.icon)"></fvdr-icon>
                  <fvdr-icon class="icon-active" [name]="$any(item.iconActive)"></fvdr-icon>
                </span>
              </span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
              <fvdr-icon
                *ngIf="!sidebarCollapsed && item.children"
                name="chevron-down"
                class="nav-chevron"
                [class.nav-chevron--up]="item.open"
              ></fvdr-icon>
            </button>
            <div *ngIf="!sidebarCollapsed && item.open && item.children" class="nav-subitems">
              <button
                *ngFor="let child of item.children"
                class="nav-subitem"
                [class.nav-subitem--active]="child.active"
              >{{ child.label }}</button>
            </div>
          </div>
        </div>

        <div class="sidebar-bottom">
          <div class="sidebar-logo" *ngIf="!sidebarCollapsed">
            <svg width="56" height="16" viewBox="0 0 56 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.4 0H0V16H2.4V0Z" fill="currentColor"/>
              <path d="M9.6 4.8H7.2V16H9.6V4.8Z" fill="currentColor"/>
              <path d="M9.6 0H7.2V2.4H9.6V0Z" fill="currentColor"/>
              <path d="M16.8 16H14.4V0H16.8L24 10.4V0H26.4V16H24L16.8 5.6V16Z" fill="currentColor"/>
              <path d="M31.2 16V0H40.8V2.4H33.6V6.4H39.6V8.8H33.6V13.6H40.8V16H31.2Z" fill="currentColor"/>
              <path d="M48 16H43.2V0H48C52.4 0 55.2 3.2 55.2 8C55.2 12.8 52.4 16 48 16ZM45.6 13.6H48C50.8 13.6 52.8 11.4 52.8 8C52.8 4.6 50.8 2.4 48 2.4H45.6V13.6Z" fill="currentColor"/>
            </svg>
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <fvdr-icon [name]="sidebarCollapsed ? 'angle-double-right' : 'angle-double-left'"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ── Main Area ──────────────────────────────────────── -->
      <div class="main-area">

        <!-- Header (64px) -->
        <header class="page-header">
          <nav class="breadcrumb">
            <button class="bc-item bc-item--link">
              Reports
              <fvdr-icon name="chevron-right" class="bc-chevron bc-chevron--dim"></fvdr-icon>
            </button>
            <button class="bc-item bc-item--current">
              Activity log
              <fvdr-icon name="chevron-down" class="bc-chevron"></fvdr-icon>
            </button>
          </nav>
          <div class="header-actions">
            <button class="theme-toggle" (click)="toggleTheme()">
              <fvdr-icon [name]="isDark ? 'theme-light' : 'theme-dark'" class="theme-toggle__icon"></fvdr-icon>
              <span class="theme-toggle__label">{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
            </button>
            <fvdr-icon name="help" class="header-icon"></fvdr-icon>
            <fvdr-avatar initials="IR" size="lg" color="#eceef9" textColor="#1f2129"></fvdr-avatar>
          </div>
        </header>

        <!-- Content -->
        <div class="content">

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

          <!-- Body: tree + table -->
          <div class="body-area">

            <!-- Files panel (320px) -->
            <div class="files-panel">
              <div class="files-header">
                <span class="files-title">Files and folders</span>
              </div>

              <div class="files-tree">
                <!-- Root node -->
                <div class="tree-item tree-item--root" (click)="toggleTreeNode(fileTree[0])">
                  <button class="tree-expand" (click)="toggleTreeNode(fileTree[0]); $event.stopPropagation()">
                    <fvdr-icon [name]="fileTree[0].expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                  </button>
                  <span
                    class="tree-checkbox"
                    [class.checked]="fileTree[0].checked"
                    [class.indeterminate]="fileTree[0].indeterminate"
                    (click)="toggleRootCheckbox($event)"
                  >
                    <fvdr-icon *ngIf="fileTree[0].checked && !fileTree[0].indeterminate" name="check"></fvdr-icon>
                    <fvdr-icon *ngIf="fileTree[0].indeterminate" name="minus"></fvdr-icon>
                  </span>
                  <span class="tree-brand-icon">RN</span>
                  <span class="tree-label">{{ fileTree[0].name }}</span>
                </div>

                <!-- Children -->
                <ng-container *ngIf="fileTree[0].expanded">
                  <ng-container *ngFor="let node of fileTree[0].children">
                    <div
                      class="tree-item tree-item--child"
                      [class.tree-item--folder]="node.type === 'folder'"
                      [class.tree-item--file]="node.type === 'file'"
                      (click)="node.type === 'folder' ? toggleTreeNode(node) : null"
                    >
                      <button
                        *ngIf="node.type === 'folder'"
                        class="tree-expand tree-expand--child"
                        (click)="toggleTreeNode(node); $event.stopPropagation()"
                      >
                        <fvdr-icon [name]="node.expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                      </button>
                      <span *ngIf="node.type === 'file'" class="tree-expand-placeholder"></span>

                      <fvdr-checkbox
                        [(ngModel)]="node.checked"
                        (ngModelChange)="onChildCheckChange()"
                        (click)="$event.stopPropagation()"
                      ></fvdr-checkbox>

                      <span *ngIf="node.type === 'folder'" class="tree-folder-icon">
                        <fvdr-icon name="folder"></fvdr-icon>
                      </span>
                      <span *ngIf="node.type === 'file'" class="tree-file-icon">
                        <fvdr-icon name="reports"></fvdr-icon>
                      </span>

                      <span class="tree-label">{{ node.name }}</span>
                    </div>
                  </ng-container>
                </ng-container>
              </div>
            </div>

            <!-- Table wrapper (flex:1) -->
            <div class="table-wrapper">
              <div class="table-area">

                <!-- Table header -->
                <div class="table-header">
                  <div class="col-time th">Date and time</div>
                  <div class="col-user th">Author</div>
                  <div class="col-action th">Action</div>
                  <div class="col-details th" [class.hidden]="detailsPanelOpen">Description</div>
                </div>

                <!-- Today group -->
                <div class="group-label">Today</div>
                <div
                  *ngFor="let row of todayRows"
                  class="table-row"
                  [class.table-row--selected]="selectedRow?.id === row.id"
                  (click)="selectRow(row)"
                  (mouseenter)="hoveredRowId = row.id"
                  (mouseleave)="hoveredRowId = null"
                >
                  <div class="col-time">
                    <span class="time-text">{{ row.time }}</span>
                  </div>
                  <div class="col-user">
                    <div class="user-cell">
                      <div class="avatar-wrapper">
                        <fvdr-avatar
                          [initials]="row.userInitials"
                          size="md"
                          [color]="row.avatarColor"
                          textColor="#ffffff"
                        ></fvdr-avatar>
                      </div>
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
                  *ngFor="let row of yesterdayRows"
                  class="table-row"
                  [class.table-row--selected]="selectedRow?.id === row.id"
                  (click)="selectRow(row)"
                  (mouseenter)="hoveredRowId = row.id"
                  (mouseleave)="hoveredRowId = null"
                >
                  <div class="col-time">
                    <span class="time-text">{{ row.time }}</span>
                  </div>
                  <div class="col-user">
                    <div class="user-cell">
                      <div class="avatar-wrapper">
                        <fvdr-avatar
                          [initials]="row.userInitials"
                          size="md"
                          [color]="row.avatarColor"
                          textColor="#ffffff"
                        ></fvdr-avatar>
                      </div>
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

              <!-- Details panel (push layout) -->
              <div class="details-panel" [class.details-panel--open]="detailsPanelOpen">
                <div class="details-panel-inner" *ngIf="selectedRow">

                  <!-- Panel header -->
                  <div class="dp-header">
                    <span class="dp-title">{{ selectedRow.action }}</span>
                    <button class="icon-btn" (click)="closeDetails()">
                      <fvdr-icon name="close"></fvdr-icon>
                    </button>
                  </div>

                  <!-- Target -->
                  <div class="dp-section dp-target" *ngIf="selectedRow.targetName">
                    <div class="dp-field-label">Target</div>
                    <div class="dp-target-value">
                      <span class="dp-target-icon">
                        <fvdr-icon name="folder"></fvdr-icon>
                      </span>
                      <span class="dp-target-name">{{ selectedRow.targetName }}</span>
                    </div>
                  </div>

                  <!-- Author -->
                  <div class="dp-section dp-author">
                    <div class="dp-field-label">Author</div>
                    <div class="dp-author-row">
                      <fvdr-avatar
                        [initials]="selectedRow.userInitials"
                        size="md"
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

                  <!-- Action icons -->
                  <div class="dp-actions">
                    <button class="dp-action-btn" title="Filter by this user"><fvdr-icon name="filter"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Download"><fvdr-icon name="download"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Subscribe"><fvdr-icon name="bell"></fvdr-icon></button>
                    <button class="dp-action-btn" title="Share"><fvdr-icon name="share"></fvdr-icon></button>
                    <button class="dp-action-btn" title="More actions"><fvdr-icon name="more"></fvdr-icon></button>
                  </div>

                  <div class="dp-divider"></div>

                  <!-- Detail fields: File viewing -->
                  <ng-container *ngIf="selectedRow.action === 'File viewing'">
                    <div class="dp-field">
                      <span class="dp-field-label">Total viewing time</span>
                      <span class="dp-field-value">{{ selectedRow.viewingTime }}</span>
                    </div>
                    <div class="dp-field">
                      <span class="dp-field-label">File path</span>
                      <span class="dp-field-value">{{ selectedRow.targetPath }}</span>
                    </div>
                    <div class="dp-field">
                      <span class="dp-field-label">Viewer type</span>
                      <span class="dp-field-value">{{ selectedRow.viewerType }}</span>
                    </div>
                    <div class="dp-field">
                      <span class="dp-field-label">Viewer mode</span>
                      <span class="dp-field-value">{{ selectedRow.viewerMode }}</span>
                    </div>
                    <div class="dp-field">
                      <span class="dp-field-label">Version</span>
                      <span class="dp-field-value">{{ selectedRow.version }}</span>
                    </div>
                  </ng-container>

                  <!-- Detail fields: Login -->
                  <ng-container *ngIf="selectedRow.action === 'Login'">
                    <div class="dp-field">
                      <span class="dp-field-label">Application type</span>
                      <span class="dp-field-value">{{ selectedRow.appType }}</span>
                    </div>
                  </ng-container>

                  <!-- Detail fields: User invitation -->
                  <ng-container *ngIf="selectedRow.action === 'User invitation'">
                    <div class="dp-field">
                      <span class="dp-field-label">Invited user</span>
                      <span class="dp-field-value">{{ selectedRow.inviteeEmail }}</span>
                    </div>
                  </ng-container>

                </div>
              </div><!-- /details-panel -->

            </div><!-- /table-wrapper -->
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
      --color-border: #DEE0EB;
      --color-divider: #DEE0EB;
    }

    /* ── Page Layout ─────────────────────────────────── */
    .page-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    /* ── Sidebar ─────────────────────────────────────── */
    .sidebar {
      width: 280px;
      min-width: 280px;
      background: #f7f7f7;
      border-right: 1px solid #dee0eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
      transition: width 0.22s ease, min-width 0.22s ease;
    }

    .sidebar--collapsed { width: 72px; min-width: 72px; }

    .account-switcher {
      height: 64px;
      min-height: 64px;
      background: #f7f7f7;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      border-bottom: 1px solid #dee0eb;
      gap: 10px;
      overflow: hidden;
      cursor: pointer;
    }

    .account-switcher:hover { background: #efefef; }

    .sidebar--collapsed .account-switcher { justify-content: center; padding: 0; }

    .account-switcher-left {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }

    .account-logo {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: var(--radius-sm);
      background: #F97316;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .account-name {
      font-size: 16px;
      font-weight: 600;
      color: #1f2129;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .account-chevron { font-size: 16px; color: #5f616a; flex-shrink: 0; }

    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24px 0 8px;
      gap: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: #f7f7f7;
    }

    .nav-group { display: flex; flex-direction: column; }

    .nav-item {
      width: 100%;
      height: 32px;
      min-height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #40424b;
      font-size: 16px;
      font-weight: 400;
      font-family: var(--font-family);
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      transition: background 0.12s;
    }

    .icon-active { display: none; }

    .nav-item:hover { background: transparent; font-weight: 600; }
    .nav-item:hover .icon-default { display: none; }
    .nav-item:hover .icon-active  { display: inline-flex; }

    .nav-item--active, .nav-item--open { color: #1f2129; font-weight: 600; }
    .nav-item--active { background: #f0faf5; }
    .nav-item--active:hover { background: #f0faf5; }
    .nav-item--active .icon-default,
    .nav-item--open   .icon-default { display: none; }
    .nav-item--active .icon-active,
    .nav-item--open   .icon-active  { display: inline-flex; }

    .nav-icon-zone {
      width: 72px;
      min-width: 72px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-icon { display: flex; align-items: center; justify-content: center; color: #5f616a; font-size: 24px; }
    .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .nav-chevron { font-size: 16px; margin-right: 16px; flex-shrink: 0; color: #5f616a; transition: transform 0.2s ease; }
    .nav-chevron--up { transform: rotate(180deg); }

    .nav-subitems { display: flex; flex-direction: column; background: #f7f7f7; }

    .nav-subitem {
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0 16px 0 72px;
      font-size: 14px;
      font-weight: 400;
      font-family: var(--font-family);
      color: #1f2129;
      text-align: left;
      white-space: nowrap;
    }

    .nav-subitem:hover { background: transparent; font-weight: 600; }
    .nav-subitem--active { font-weight: 600; color: #2c9c74; background: transparent; }
    .nav-subitem--active:hover { background: transparent; }

    .sidebar-bottom {
      height: 72px;
      min-height: 72px;
      background: #f7f7f7;
      border-top: 1px solid #dee0eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px 0 24px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .sidebar--collapsed .sidebar-bottom { justify-content: center; padding: 0; }

    .sidebar-logo { color: #73757f; display: flex; align-items: center; overflow: hidden; }

    .collapse-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #5f616a;
      flex-shrink: 0;
      transition: background 0.12s;
      margin-left: auto;
    }

    .collapse-btn:hover { background: #e8e8e8; }

    /* ── Main Area ───────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Page Header (64px) ──────────────────────────── */
    .page-header {
      height: 64px;
      min-height: 64px;
      padding: 0 var(--space-6, 24px);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-stone-0, #FFFFFF);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .breadcrumb { display: flex; align-items: center; gap: var(--space-1); }
    .bc-item {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family);
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
      padding: 4px 6px;
      border-radius: var(--radius-sm);
    }
    .bc-item--link { color: var(--color-text-secondary); font-weight: 400; }
    .bc-item--link:hover { color: var(--color-text-primary); background: var(--color-hover-bg); }
    .bc-chevron { font-size: 14px; color: var(--color-stone-600); }
    .bc-chevron--dim { opacity: 0.5; }

    .header-actions { display: flex; align-items: center; gap: var(--space-3); }

    .theme-toggle {
      display: flex; align-items: center; gap: var(--space-2);
      background: none; border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-3);
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      font-family: var(--font-family);
    }
    .theme-toggle:hover { border-color: var(--color-stone-500); color: var(--color-text-primary); }
    .theme-toggle__icon { font-size: 16px; }
    .header-icon { font-size: 20px; color: var(--color-stone-600); cursor: pointer; }

    /* ── Content ─────────────────────────────────────── */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: var(--space-6, 24px) var(--space-6, 24px) 0;
    }

    /* ── Target Filter Row ───────────────────────────── */
    .target-filter-row {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      margin-bottom: var(--space-3, 12px);
      font-size: 14px;
    }

    .target-label {
      color: var(--color-text-secondary, #5F616A);
    }

    .target-chip {
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-primary-500, #2C9C74);
      font-size: 14px;
      font-weight: 600;
      padding: 0;
    }

    .target-chip:hover {
      color: var(--color-primary-600, #1C8269);
    }

    /* ── Filter Bar ──────────────────────────────────── */
    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3, 12px);
      gap: var(--space-4, 16px);
      flex-shrink: 0;
    }

    .filter-bar-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .filter-bar-right {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .period-btn {
      height: 40px;
      width: 320px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-3, 12px);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-stone-0, #FFFFFF);
      cursor: pointer;
      color: var(--color-text-secondary, #5F616A);
      font-size: 14px;
    }

    .period-btn:hover {
      border-color: var(--color-stone-500, #BBBDC8);
    }

    .period-placeholder {
      color: var(--color-text-placeholder, #9C9EA8);
    }


    /* ── Body Area ───────────────────────────────────── */
    .body-area {
      flex: 1;
      display: flex;
      overflow: hidden;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-6, 24px);
    }

    /* ── Files Panel (320px) ─────────────────────────── */
    .files-panel {
      width: 320px;
      min-width: 320px;
      flex-shrink: 0;
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .files-header {
      height: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      padding: 0 var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .files-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .files-tree {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-2, 8px) 0;
    }

    /* Tree items */
    .tree-item {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0;
      cursor: pointer;
      gap: var(--space-1, 4px);
    }

    .tree-item:hover {
      background: var(--color-hover-bg, #ECEEF9);
    }

    .tree-item--child {
      padding-left: var(--space-4, 16px);
    }

    .tree-expand {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--color-stone-600, #9C9EA8);
      padding: 0;
    }

    .tree-expand--child {
      /* slightly smaller padding */
    }

    .tree-expand-placeholder {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    /* Custom checkbox for tree root (indeterminate support) */
    .tree-checkbox {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      border: 1.5px solid var(--color-stone-500, #BBBDC8);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      cursor: pointer;
      background: var(--color-stone-0, #FFFFFF);
      color: var(--color-stone-0, #FFFFFF);
      transition: background 0.12s, border-color 0.12s;
    }

    .tree-checkbox.checked,
    .tree-checkbox.indeterminate {
      background: var(--color-primary-500, #2C9C74);
      border-color: var(--color-primary-500, #2C9C74);
    }

    .tree-brand-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      background: #1A1A1A;
      color: #ffffff;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      margin: 0 var(--space-1, 4px);
    }

    .tree-folder-icon {
      font-size: 16px;
      color: var(--color-primary-500, #2C9C74);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .tree-file-icon {
      font-size: 16px;
      color: var(--color-error-600, #E54430);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .tree-label {
      font-size: 14px;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Table Wrapper ───────────────────────────────── */
    .table-wrapper {
      flex: 1;
      display: flex;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Table Area ──────────────────────────────────── */
    .table-area {
      flex: 1;
      overflow-y: auto;
      min-width: 0;
    }

    /* Table header row */
    .table-header {
      display: flex;
      align-items: center;
      height: 48px;
      min-height: 48px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-stone-100, #FAFAFA);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .th {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
      padding: 0 var(--space-4, 16px);
      white-space: nowrap;
    }

    /* Group label */
    .group-label {
      padding: var(--space-3, 12px) var(--space-4, 16px) var(--space-2, 8px);
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
      border-bottom: 1px solid var(--color-border);
    }

    /* Table rows */
    .table-row {
      display: flex;
      align-items: center;
      min-height: 68px;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: background 0.1s;
    }

    .table-row:hover,
    .table-row--selected {
      background: var(--color-primary-50, #EBF8EF);
    }

    /* Column widths */
    .col-time {
      width: 128px;
      min-width: 128px;
      padding: 0 var(--space-4, 16px);
      flex-shrink: 0;
    }

    .col-user {
      width: 232px;
      min-width: 232px;
      padding: 0 var(--space-4, 16px);
      flex-shrink: 0;
    }

    .col-action {
      width: 186px;
      min-width: 186px;
      padding: 0 var(--space-4, 16px);
      flex-shrink: 0;
    }

    .col-details {
      flex: 1;
      min-width: 0;
      padding: 0 var(--space-4, 16px);
    }

    .col-details.hidden {
      display: none;
    }

    .time-text {
      font-size: 13px;
      color: var(--color-text-secondary, #5F616A);
      white-space: nowrap;
    }

    /* User cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
    }

    .avatar-wrapper {
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 12px;
      color: var(--color-text-secondary, #5F616A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Action cell */
    .action-text {
      display: block;
      font-size: 14px;
      color: var(--color-text-primary);
    }

    .action-sub {
      display: block;
      font-size: 12px;
      color: var(--color-text-secondary, #5F616A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    /* Details cell */
    .details-text {
      font-size: 13px;
      color: var(--color-text-secondary, #5F616A);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Details Panel ───────────────────────────────── */
    .details-panel {
      width: 0;
      flex-shrink: 0;
      overflow: hidden;
      transition: width 0.25s ease;
    }

    .details-panel--open {
      width: 320px;
    }

    .details-panel-inner {
      width: 320px;
      height: 100%;
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background: var(--color-stone-0, #FFFFFF);
    }

    .dp-header {
      height: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .dp-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .dp-section {
      padding: var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .dp-field-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
      margin-bottom: var(--space-2, 8px);
    }

    .dp-target-value {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2, 8px);
    }

    .dp-target-icon {
      font-size: 16px;
      color: var(--color-stone-400, #DEE0EB);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .dp-target-name {
      font-size: 13px;
      color: var(--color-text-primary);
      line-height: 1.4;
    }

    .dp-author-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3, 12px);
    }

    .dp-author-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
      min-width: 0;
    }

    .dp-author-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .dp-author-email {
      font-size: 12px;
      color: var(--color-text-secondary, #5F616A);
    }

    .dp-actions {
      display: flex;
      align-items: center;
      gap: var(--space-1, 4px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .dp-action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--radius-sm, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--color-stone-600, #9C9EA8);
    }

    .dp-action-btn:hover {
      background: var(--color-hover-bg, #ECEEF9);
      color: var(--color-text-primary);
    }

    .dp-divider {
      height: 1px;
      display: none; /* already handled by section borders */
    }

    .dp-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border);
    }

    .dp-field-value {
      font-size: 14px;
      color: var(--color-text-primary);
      line-height: 1.4;
    }

    /* ── Dark Theme ──────────────────────────────────── */
    .dark-theme.page-layout { background: #1F2129; }

    .dark-theme .sidebar      { background: #212426; border-right-color: #33383B; }
    .dark-theme .account-switcher { background: #212426; border-bottom-color: #33383B; }
    .dark-theme .account-switcher:hover { background: #272c2e; }
    .dark-theme .account-name { color: #ffffff; }
    .dark-theme .nav-list     { background: #212426; }
    .dark-theme .nav-subitems { background: #212426; }
    .dark-theme .nav-item     { color: #b5bbbf; }
    .dark-theme .nav-item:hover { background: transparent; }
    .dark-theme .nav-item--active,
    .dark-theme .nav-item--open { color: #ffffff; }
    .dark-theme .nav-item--active { background: #1e3028; }
    .dark-theme .nav-item--active:hover { background: #1e3028; }
    .dark-theme .nav-subitem  { color: #b5bbbf; }
    .dark-theme .nav-subitem--active { color: #3fb67d; }
    .dark-theme .sidebar-logo { color: #8A9199; }
    .dark-theme .sidebar-bottom { background: #212426; border-top-color: #33383B; }

    .dark-theme .page-header  { background: #212426; border-bottom-color: #33383B; }
    .dark-theme .bc-item--link { color: #A2A9AF; }
    .dark-theme .bc-item--current { color: #ffffff; }
    .dark-theme .theme-toggle { border-color: #33383B; color: #b5bbbf; }

    .dark-theme .files-panel {
      background: #212426;
      border-right-color: #33383B;
    }

    .dark-theme .files-header {
      border-bottom-color: #33383B;
    }

    .dark-theme .files-title {
      color: #FFFFFF;
    }

    .dark-theme .tree-item:hover {
      background: #33383B;
    }

    .dark-theme .tree-label {
      color: #B5BBBF;
    }

    .dark-theme .body-area {
      border-color: #33383B;
    }

    .dark-theme .table-header {
      background: #292D2F;
      border-bottom-color: #40464A;
    }

    .dark-theme .th {
      color: #8B949A;
    }

    .dark-theme .group-label {
      color: #8B949A;
      border-bottom-color: #40464A;
    }

    .dark-theme .table-row {
      border-bottom-color: #40464A;
    }

    .dark-theme .table-row:hover,
    .dark-theme .table-row--selected {
      background: rgba(44, 156, 116, 0.12);
    }

    .dark-theme .time-text {
      color: #8B949A;
    }

    .dark-theme .user-name {
      color: #FFFFFF;
    }

    .dark-theme .user-email {
      color: #A2A9AF;
    }

    .dark-theme .action-text {
      color: #B5BBBF;
    }

    .dark-theme .action-sub {
      color: #8B949A;
    }

    .dark-theme .details-text {
      color: #8B949A;
    }

    .dark-theme .details-panel-inner {
      background: #292D2F;
      border-left-color: #33383B;
    }

    .dark-theme .dp-header {
      border-bottom-color: #40464A;
    }

    .dark-theme .dp-title {
      color: #FFFFFF;
    }

    .dark-theme .dp-section {
      border-bottom-color: #40464A;
    }

    .dark-theme .dp-field-label {
      color: #8B949A;
    }

    .dark-theme .dp-target-name {
      color: #B5BBBF;
    }

    .dark-theme .dp-author-name {
      color: #FFFFFF;
    }

    .dark-theme .dp-author-email {
      color: #A2A9AF;
    }

    .dark-theme .dp-actions {
      border-bottom-color: #40464A;
    }

    .dark-theme .dp-field {
      border-bottom-color: #40464A;
    }

    .dark-theme .dp-field-value {
      color: #B5BBBF;
    }

    .dark-theme .period-btn {
      background: #292D2F;
      border-color: #50575C;
      color: #B5BBBF;
    }

    .dark-theme .target-label { color: #A2A9AF; }
  `],
})
export class InsightsActivityLogComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  isDark = false;
  sidebarCollapsed = false;

  navItems: NavItem[] = [
    { id: 'dashboard',    icon: 'nav-overview',      iconActive: 'nav-overview-active',      label: 'Dashboard',          active: false },
    { id: 'documents',    icon: 'nav-projects',      iconActive: 'nav-projects-active',      label: 'Documents',          active: false },
    { id: 'participants', icon: 'nav-participants',  iconActive: 'nav-participants-active',  label: 'Participants',       active: false },
    { id: 'permissions',  icon: 'nav-settings',      iconActive: 'nav-settings-active',      label: 'Permissions',        active: false },
    { id: 'qa',           icon: 'nav-overview',      iconActive: 'nav-overview-active',      label: 'Q&A',                active: false },
    { id: 'reports',      icon: 'nav-reports',       iconActive: 'nav-reports-active',       label: 'Reports',            active: true,  open: true,
      children: [
        { label: 'Activity log',        active: true  },
        { label: 'Documents overview',  active: false },
      ],
    },
    { id: 'settings',     icon: 'nav-settings',      iconActive: 'nav-settings-active',      label: 'Settings',           active: false,
      children: [
        { label: 'General'      },
        { label: 'Integrations' },
      ],
    },
    { id: 'archiving',    icon: 'nav-overview',      iconActive: 'nav-overview-active',      label: 'Project archiving',  active: false },
    { id: 'recycle',      icon: 'trash',             iconActive: 'trash',                    label: 'Recycle bin',        active: false },
  ];

  fileTree: FileTreeNode[] = [
    {
      id: 'root',
      name: 'Room name',
      type: 'root',
      checked: false,
      indeterminate: true,
      expanded: true,
      children: [
        { id: 'f1', name: '1  Company A', type: 'folder', checked: true,  indeterminate: false, expanded: false, children: [] },
        { id: 'f2', name: '2  Company B', type: 'folder', checked: true,  indeterminate: false, expanded: false, children: [] },
        { id: 'f3', name: '3  Company C', type: 'folder', checked: true,  indeterminate: false, expanded: false, children: [] },
        { id: 'f4', name: '4  Company D', type: 'folder', checked: true,  indeterminate: false, expanded: false, children: [] },
        { id: 'r1', name: '5  Report 2025', type: 'file', checked: true,  indeterminate: false, expanded: false },
      ],
    },
  ];

  selectedAction: string | string[] = '';
  selectedAuthor: string | string[] = '';

  actionOptions = [
    { value: '',               label: 'All actions'     },
    { value: 'file-viewing',   label: 'File viewing'    },
    { value: 'login',          label: 'Login'           },
    { value: 'user-invitation',label: 'User invitation' },
  ];

  authorOptions = [
    { value: '',       label: 'All authors'  },
    { value: 'olivia', label: 'Olivia Rhye'  },
    { value: 'avery',  label: 'Avery Park'   },
  ];

  hoveredRowId: string | null = null;
  selectedRow: ActivityRow | null = null;
  detailsPanelOpen = false;

  todayRows: ActivityRow[] = [
    {
      id: '1',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '1.9 Contracts - Contract - Standard Accts Pay.doc',
      targetPath: '/1 Team Structure/1.9 Contracts - Contract - Standard Accts Pay.doc',
      viewingTime: '10 s',
      viewerType: 'Ideals Spreadsheet Viewer',
      viewerMode: 'Normal',
      version: 2,
    },
    {
      id: '2',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'Login',
      detailsText: 'Application type: Web application',
      subText: 'Web application',
      appType: 'Web application',
    },
    {
      id: '3',
      time: '4:35:25 PM',
      userInitials: 'AP',
      userName: 'Avery Park',
      userEmail: 'avery@gmail.com',
      avatarColor: '#9747FF',
      userRole: 'Viewers',
      action: 'Login',
      detailsText: 'Application type: Web application',
      subText: 'Web application',
      appType: 'Web application',
    },
  ];

  yesterdayRows: ActivityRow[] = [
    {
      id: '4',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'Login',
      detailsText: 'Application type: Web application',
      subText: 'Web application',
      appType: 'Web application',
    },
    {
      id: '5',
      time: '4:35:25 PM',
      userInitials: 'AP',
      userName: 'Avery Park',
      userEmail: 'avery@gmail.com',
      avatarColor: '#9747FF',
      userRole: 'Viewers',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s',
      viewerType: 'Ideals Spreadsheet Viewer',
      viewerMode: 'Normal',
      version: 1,
    },
    {
      id: '6',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s',
      viewerType: 'Ideals Spreadsheet Viewer',
      viewerMode: 'Normal',
      version: 1,
    },
    {
      id: '7',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'User invitation',
      detailsText: 'Invited: leslie.alexander@gmail.com',
      subText: 'leslie.alexander@gmail.com',
      inviteeEmail: 'leslie.alexander@gmail.com',
    },
    {
      id: '8',
      time: '4:35:25 PM',
      userInitials: 'OR',
      userName: 'Olivia Rhye',
      userEmail: 'olivia@gmail.com',
      avatarColor: '#2C9C74',
      userRole: 'Administrators',
      action: 'File viewing',
      detailsText: 'Total viewing time: 1 min 10 sec · File path: /56 [folder name]/56...',
      subText: '56.2.1.5 [file name long version exam...',
      targetName: '56.2.1.5 Financial Report Q4 2024.xlsx',
      targetPath: '/1 Team Structure/56.2.1.5 Financial Report Q4 2024.xlsx',
      viewingTime: '1 min 10 s',
      viewerType: 'Ideals Spreadsheet Viewer',
      viewerMode: 'Normal',
      version: 1,
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
    const allChecked = root.children.every(c => c.checked);
    const noneChecked = root.children.every(c => !c.checked);
    root.checked = allChecked;
    root.indeterminate = !allChecked && !noneChecked;
  }

  toggleNavItem(item: NavItem): void {
    if (item.children) {
      item.open = !item.open;
      return;
    }
    this.navItems.forEach(n => { n.active = false; });
    item.active = true;
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
  }
}
