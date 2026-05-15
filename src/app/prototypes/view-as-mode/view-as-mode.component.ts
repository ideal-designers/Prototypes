import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DS_COMPONENTS, SidebarNavItem, HeaderAction, BreadcrumbItem } from '../../shared/ds';

interface FileRow {
  index: string;
  name: string;
  notes: number;
  labels: number;
  size: string;
  pages: string;
  highlighted?: boolean;
}

@Component({
  selector: 'app-view-as-mode',
  standalone: true,
  imports: [CommonModule, RouterModule, ...DS_COMPONENTS],
  template: `
<div class="vam-layout">

  <!-- ── DS Sidebar ────────────────────────────────────────────── -->
  <fvdr-sidebar-nav
    variant="vdr"
    accountName="Nova project"
    [items]="navItems"
    [(collapsed)]="sidebarCollapsed"
    (itemClick)="onNavClick($event)"
  ></fvdr-sidebar-nav>

  <!-- ── Main ──────────────────────────────────────────────────── -->
  <div class="vam-main">

    <!-- DS Header with breadcrumbs -->
    <fvdr-header
      [breadcrumbs]="headerBreadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="LZ"
    ></fvdr-header>

    <!-- View-as banner -->
    <div class="vam-banner" [class.vam-banner--visible]="isViewAsMode">
      <fvdr-icon name="view-as" class="vam-banner__icon"></fvdr-icon>
      <span class="vam-banner__text">
        Viewing documents as <span class="vam-banner__name">Bidder 1</span>
      </span>
      <button class="vam-banner__close" type="button" aria-label="Exit view-as mode" (click)="exitViewAsMode()">
        <fvdr-icon name="cross-solid"></fvdr-icon>
      </button>
    </div>

    <!-- Content -->
    <div class="vam-content" [class.vam-content--view-as]="isViewAsMode">

      <!-- Top panel -->
      <div class="vam-topbar">
        <div class="vam-topbar__left">
          <div class="vam-download-wrap" (mouseenter)="onDownloadHover()">
            <fvdr-btn
              variant="secondary"
              size="m"
              iconName="download"
              label="Download"
            ></fvdr-btn>
            <!-- Download popover — anchored directly under button -->
            <div class="vam-popover" [class.vam-popover--show]="showPopover && isViewAsMode">
              <div class="vam-popover__card">
                <div class="vam-popover__title">Why is Download available?</div>
                <div class="vam-popover__body">
                  Upon download, users without download permissions receive URL files linking to documents online, ensuring secure access.
                </div>
                <!-- Pie CSS timer — fills in 5s to signal auto-dismiss -->
                <span class="vam-pie" [class.vam-pie--run]="showPopover && isViewAsMode"></span>
              </div>
            </div>
          </div>
          <fvdr-btn variant="secondary" size="m" iconName="documents" label="Project index"></fvdr-btn>
          <button class="vam-icon-btn-square" type="button" aria-label="More">
            <fvdr-icon name="more"></fvdr-icon>
          </button>
        </div>
        <div class="vam-topbar__right">
          <fvdr-btn
            variant="secondary"
            size="m"
            iconName="view-as"
            label="View as"
            (clicked)="enterViewAsMode()"
          ></fvdr-btn>
          <fvdr-search placeholder="Search" size="m" style="width: 280px"></fvdr-search>
        </div>
      </div>

      <!-- Body: quick access + table -->
      <div class="vam-body">

        <!-- Quick access sidebar -->
        <div class="vam-qa">
          <div class="vam-qa__header">
            <span class="vam-qa__title">Quick access</span>
            <div class="vam-qa__actions">
              <button class="vam-icon-btn-sm"><fvdr-icon name="sort"></fvdr-icon></button>
              <button class="vam-icon-btn-sm"><fvdr-icon name="chevron-right"></fvdr-icon></button>
            </div>
          </div>
          <div class="vam-qa__list">
            <div class="vam-qa__item">
              <fvdr-icon name="clock"></fvdr-icon>
              <span>Recently viewed</span>
            </div>
            <div class="vam-qa__item">
              <fvdr-icon name="upload"></fvdr-icon>
              <span>Newly upload</span>
            </div>
            <div class="vam-qa__item">
              <fvdr-icon name="sort"></fvdr-icon>
              <span>Favorites</span>
            </div>
          </div>

          <!-- Folder tree -->
          <div class="vam-tree">
            <div class="vam-tree__item vam-tree__item--project">
              <div class="vam-tree__project-badge">RN</div>
              <span>Nova project</span>
            </div>
            <div class="vam-tree__item vam-tree__item--indent" *ngFor="let f of folders; let i = index"
                 [class.vam-tree__item--active]="i === activeFolder"
                 (click)="activeFolder = i">
              <fvdr-icon name="documents" class="vam-tree__file-icon"></fvdr-icon>
              <span class="vam-tree__index">{{ i + 1 }}</span>
              <span class="vam-tree__name">{{ f }}</span>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="vam-table-wrap">
          <table class="vam-table">
            <thead>
              <tr>
                <th class="vam-th vam-th--check"><span class="vam-checkbox"></span></th>
                <th class="vam-th">Index</th>
                <th class="vam-th vam-th--name">Name</th>
                <th class="vam-th">Notes</th>
                <th class="vam-th">Labels</th>
                <th class="vam-th">Size</th>
                <th class="vam-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows"
                  class="vam-tr"
                  [class.vam-tr--highlighted]="isViewAsMode && row.highlighted">
                <td class="vam-td vam-td--check">
                  <span class="vam-checkbox"
                        [class.vam-checkbox--checked]="isViewAsMode && row.highlighted"></span>
                </td>
                <td class="vam-td vam-td--index">
                  <fvdr-icon name="documents" class="vam-td__file-icon"></fvdr-icon>
                  {{ row.index }}
                </td>
                <td class="vam-td vam-td--name">{{ row.name }}</td>
                <td class="vam-td">
                  <span class="vam-counter">{{ row.notes }}</span>
                </td>
                <td class="vam-td">
                  <span class="vam-counter">{{ row.labels }}</span>
                </td>
                <td class="vam-td vam-td--size">
                  <span class="vam-size__main">{{ row.size }}</span>
                  <span class="vam-size__sub">{{ row.pages }}</span>
                </td>
                <td class="vam-td vam-td--actions"></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div><!-- /body -->
    </div><!-- /content -->
  </div><!-- /main -->
</div>
  `,
  styles: [`
    /* ── Reset / base ─────────────────────────────────────────── */
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family, 'Open Sans', sans-serif);
    }

    /* ── Layout ───────────────────────────────────────────────── */
    .vam-layout {
      display: flex;
      width: 100%;
      height: 100%;
      background: #fff;
    }

    /* ── Main area ────────────────────────────────────────────── */
    .vam-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* ── View-as banner ───────────────────────────────────────── */
    .vam-banner {
      position: absolute;
      top: 64px;
      left: 50%;
      transform: translateX(-50%) translateY(-100%);
      width: 480px;
      background: var(--color-primary-500, #2c9c74);
      border-radius: 0 0 8px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      color: white;
      z-index: 20;
      opacity: 0;
      transition: transform 0.25s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.2s;
      pointer-events: none;
    }
    .vam-banner--visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    .vam-banner__icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    .vam-banner__text {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }
    .vam-banner__name {
      font-weight: 400;
      text-decoration: underline;
    }
    .vam-banner__close {
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: var(--radius-full, 9999px);
      transition: background 0.15s;
      flex-shrink: 0;
      margin-left: var(--space-2);
    }
    .vam-banner__close:hover { background: rgba(255, 255, 255, 0.32); }
    .vam-banner__close:active { background: rgba(255, 255, 255, 0.42); }
    .vam-banner__close fvdr-icon { font-size: 12px; display: inline-flex; }

    /* ── Content ──────────────────────────────────────────────── */
    .vam-content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }

    /* ── Topbar ───────────────────────────────────────────────── */
    .vam-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .vam-topbar__left,
    .vam-topbar__right {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    /* Secondary icon-only square button — matches fvdr-btn secondary M */
    .vam-icon-btn-square {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-stone-900);
      cursor: pointer;
      padding: 0;
      transition: background 0.15s, border-color 0.15s;
    }
    .vam-icon-btn-square:hover {
      background: var(--color-stone-200);
    }
    .vam-icon-btn-square:active {
      background: var(--color-stone-300);
    }
    .vam-icon-btn-square fvdr-icon {
      font-size: 16px;
      display: inline-flex;
    }

    /* ── Download popover (anchored to Download button) ───────── */
    .vam-download-wrap {
      position: relative;
      display: inline-flex;
    }
    .vam-popover {
      position: absolute;
      top: calc(100% + var(--space-2));
      left: 0;
      width: 320px;
      z-index: 30;
      opacity: 0;
      transform: translateY(-6px);
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .vam-popover--show {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .vam-popover__card {
      position: relative;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: var(--space-4);
      padding-right: calc(var(--space-4) + 24px);
      box-shadow: 0 4px 16px rgba(31, 33, 41, 0.10), 0 1px 2px rgba(31, 33, 41, 0.04);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .vam-popover__title {
      font-size: var(--text-base-s-size);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: var(--text-base-s-lh);
    }
    .vam-popover__body {
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      line-height: var(--text-base-s-lh);
    }

    /* ── Pie CSS timer ────────────────────────────────────────── */
    @property --vam-pie-percentage {
      syntax: '<percentage>';
      inherits: false;
      initial-value: 0%;
    }
    .vam-pie {
      position: absolute;
      top: var(--space-4);
      right: var(--space-4);
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: conic-gradient(
        var(--color-stone-300) var(--vam-pie-percentage, 0%),
        var(--color-stone-100) 0
      );
      pointer-events: none;
    }
    .vam-pie--run {
      animation: vam-pie-timer 10s linear forwards;
    }
    @keyframes vam-pie-timer {
      to { --vam-pie-percentage: 100%; }
    }

    /* ── Body (quick access + table) ──────────────────────────── */
    .vam-body {
      flex: 1;
      min-height: 0;
      display: flex;
      gap: 24px;
      overflow: hidden;
    }

    /* ── Quick access ─────────────────────────────────────────── */
    .vam-qa {
      width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow: hidden;
    }
    .vam-qa__header {
      height: 48px;
      background: var(--color-stone-200, #f7f7f7);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      flex-shrink: 0;
    }
    .vam-qa__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary, #1f2129);
    }
    .vam-qa__actions {
      display: flex;
      gap: 4px;
    }
    .vam-icon-btn-sm {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      color: var(--color-text-secondary, #5f616a);
      font-size: 16px;
    }
    .vam-icon-btn-sm:hover { background: var(--color-divider, #dee0eb); }
    .vam-qa__list {
      background: #fff;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .vam-qa__item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      font-size: 14px;
      color: var(--color-text-primary, #1f2129);
      cursor: pointer;
      border-radius: 4px;
    }
    .vam-qa__item:hover { background: var(--color-stone-200, #f7f7f7); }
    .vam-qa__item fvdr-icon { font-size: 16px; color: var(--color-text-secondary, #5f616a); flex-shrink: 0; }

    /* Folder tree */
    .vam-tree {
      flex: 1;
      overflow-y: auto;
    }
    .vam-tree__item {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      font-size: 14px;
      color: var(--color-text-primary, #1f2129);
      cursor: pointer;
      border-radius: 4px;
    }
    .vam-tree__item:hover { background: var(--color-stone-200, #f7f7f7); }
    .vam-tree__item--active { background: var(--color-primary-50, #ebf8ef); }
    .vam-tree__item--project {
      cursor: default;
      font-weight: 500;
    }
    .vam-tree__project-badge {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: var(--color-primary-500, #2c9c74);
      color: white;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vam-tree__item--indent { padding-left: 32px; }
    .vam-tree__file-icon { font-size: 16px; color: var(--color-text-secondary, #5f616a); flex-shrink: 0; }
    .vam-tree__index {
      color: var(--color-text-secondary, #5f616a);
      min-width: 16px;
      flex-shrink: 0;
    }
    .vam-tree__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    /* ── Table ────────────────────────────────────────────────── */
    .vam-table-wrap {
      flex: 1;
      min-width: 0;
      overflow: auto;
      border-radius: 4px;
    }
    .vam-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .vam-th {
      background: var(--color-stone-200, #f7f7f7);
      padding: 0 16px;
      height: 48px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary, #1f2129);
      white-space: nowrap;
      border-bottom: 1px solid var(--color-divider, #dee0eb);
    }
    .vam-th--check { width: 48px; }
    .vam-th--name { width: 100%; }
    .vam-tr { border-bottom: 1px solid var(--color-divider, #dee0eb); transition: background 0.2s; }
    .vam-tr:hover .vam-td { background: var(--color-stone-200, #f7f7f7); }
    .vam-tr--highlighted .vam-td { background: var(--color-primary-50, #ebf8ef); }
    .vam-tr--highlighted:hover .vam-td { background: var(--color-primary-50, #d8f2e4); }
    .vam-td {
      padding: 0 16px;
      height: 44px;
      color: var(--color-text-primary, #1f2129);
      white-space: nowrap;
    }
    .vam-td--check { width: 48px; }
    .vam-td--index {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary, #5f616a);
    }
    .vam-td__file-icon { font-size: 16px; flex-shrink: 0; }
    .vam-td--name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    .vam-td--size { color: var(--color-text-secondary, #5f616a); }

    /* Checkbox */
    .vam-checkbox {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--color-divider, #dee0eb);
      border-radius: 1px;
      background: #fff;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
    }
    .vam-checkbox--checked {
      background: var(--color-primary-500, #2c9c74);
      border-color: var(--color-primary-500, #2c9c74);
    }
    .vam-checkbox--checked::after {
      content: '';
      position: absolute;
      left: 2px;
      top: 5px;
      width: 10px;
      height: 5px;
      border-left: 1.5px solid white;
      border-bottom: 1.5px solid white;
      transform: rotate(-45deg) translateY(-2px);
    }

    /* Counter badge */
    .vam-counter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 7.5px;
      background: var(--color-stone-300, #eceef9);
      border-radius: 16px;
      font-size: 14px;
      color: var(--color-text-primary, #1f2129);
    }

    /* Size cell */
    .vam-td--size { vertical-align: middle; }
    .vam-size__main { display: block; font-size: 12px; color: var(--color-text-primary, #1f2129); }
    .vam-size__sub  { display: block; font-size: 12px; color: var(--color-text-secondary, #5f616a); }
  `],
})
export class ViewAsModeComponent implements OnDestroy {

  isViewAsMode = false;
  showPopover  = false;
  activeFolder = 3; // "M&A Financial Analysis" row active by default
  sidebarCollapsed = false;

  navItems: SidebarNavItem[] = [
    { id: 'dashboard',    icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Dashboard',     active: false },
    { id: 'documents',    icon: 'nav-projects',     iconActive: 'nav-projects-active',     label: 'Documents',     active: true  },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants',  active: false },
    { id: 'qa',           icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Q&A',           active: false },
    { id: 'reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',      label: 'Reports',       active: false },
    { id: 'settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Settings',      active: false },
  ];

  headerBreadcrumbs: BreadcrumbItem[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'all',       label: 'All' },
  ];

  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'help',  icon: 'help' },
    { id: 'apps',  icon: 'menu' },
  ];

  onNavClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  private popoverTimer: ReturnType<typeof setTimeout> | null = null;

  folders = [
    'M&A Project Files',
    'M&A Strategy Documents',
    'M&A Due Diligence',
    'M&A Financial Analysis',
    'M&A Legal Agreements',
    'Q&A attachments',
  ];

  rows: FileRow[] = [
    { index: '4.4', name: 'ACME Inc.',          notes: 2, labels: 2, size: '3 MB',  pages: '13 pages' },
    { index: '4.5', name: 'ACME Cooperative',   notes: 2, labels: 2, size: '3 MB',  pages: '13 pages' },
    { index: '4.1', name: 'M&A Overview',        notes: 1, labels: 1, size: '1.2 MB', pages: '8 pages' },
    { index: '4.2', name: 'Financial Summary',   notes: 0, labels: 3, size: '5 MB',  pages: '24 pages' },
    { index: '4.3', name: 'Due Diligence Pack',  notes: 4, labels: 1, size: '12 MB', pages: '56 pages' },
  ];

  enterViewAsMode(): void {
    if (this.isViewAsMode) return;
    this.isViewAsMode = true;
    // highlight first two rows
    this.rows[0].highlighted = true;
    this.rows[1].highlighted = true;
    this.triggerPopover();
  }

  exitViewAsMode(): void {
    this.isViewAsMode = false;
    this.showPopover  = false;
    this.rows.forEach(r => r.highlighted = false);
    this.clearTimer();
  }

  onDownloadHover(): void {
    if (this.isViewAsMode) {
      this.triggerPopover();
    }
  }

  private triggerPopover(): void {
    this.showPopover = true;
    this.clearTimer();
    this.popoverTimer = setTimeout(() => {
      this.showPopover = false;
    }, 10000);
  }

  private clearTimer(): void {
    if (this.popoverTimer) {
      clearTimeout(this.popoverTimer);
      this.popoverTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
