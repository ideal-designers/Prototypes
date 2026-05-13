import {
  Component, Input, Output, EventEmitter, HostListener, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import type { FvdrIconName } from '../../icons/icons';

export interface SidebarNavSubItem {
  id: string;
  label: string;
  active?: boolean;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: FvdrIconName;
  iconActive: FvdrIconName;
  active?: boolean;
  open?: boolean;
  children?: SidebarNavSubItem[];
}

export type SidebarNavVariant = 'vdr' | 'ca' | 'internal';

/** Breakpoints (px) — single source of truth */
const BP_DESKTOP = 1440; // ≥ this → desktop (sidebar expanded by default)
const BP_TABLET  = 1024; // ≥ this && < BP_DESKTOP → tablet (icon-only, hover overlay)
                         // < BP_TABLET → mobile (burger)

type SidebarMode = 'desktop' | 'tablet' | 'mobile';

const VARIANT_CONFIG: Record<SidebarNavVariant, { bg: string; label: string }> = {
  vdr:      { bg: '#084D4B', label: 'VDR' },
  ca:       { bg: '#1C3B6E', label: 'CA'  },
  internal: { bg: '#3B1C6E', label: 'INT' },
};

/**
 * DS Sidebar Navigation — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-15291
 *
 * App-level left sidebar used in VDR, CA, and Internal contexts.
 * Supports three responsive modes:
 *
 * ── DESKTOP (≥1440px) ──────────────────────────────────────────
 *   Open by default. Collapse/expand with the arrow button (bottom-left).
 *   [(collapsed)] two-way binding controls the state from outside.
 *
 * ── TABLET (1024–1439px) ──────────────────────────────────────
 *   Defaults to icon-only (72px). On hover the sidebar expands as an
 *   overlay (fixed position) — it does NOT push the page content.
 *   Click the arrow button to PIN the sidebar open (locks it expanded
 *   and it becomes part of the layout flow at 280px again).
 *   Click the arrow again to un-pin (back to icon-only hover mode).
 *
 * ── MOBILE (<1024px) ──────────────────────────────────────────
 *   The sidebar is hidden; a burger button (☰) is rendered instead.
 *   Clicking the burger opens the sidebar as a full-height fixed overlay.
 *   A backdrop click closes it.
 *
 * Usage:
 *   <fvdr-sidebar-nav
 *     variant="ca"
 *     accountName="ACME Corp"
 *     [items]="navItems"
 *     [(collapsed)]="sidebarCollapsed"
 *     (itemClick)="onNavItem($event)"
 *     (subItemClick)="onSubNav($event)"
 *   />
 */
@Component({
  selector: 'fvdr-sidebar-nav',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <!-- ═══ MOBILE burger trigger ═══════════════════════════════ -->
    <button
      *ngIf="mode === 'mobile'"
      class="burger-btn"
      (click)="mobileOpen = true; cdr.markForCheck()"
      aria-label="Open menu"
    >
      <fvdr-icon name="menu" />
    </button>

    <!-- ═══ Mobile backdrop ════════════════════════════════════ -->
    <div
      *ngIf="mode === 'mobile' && mobileOpen"
      class="mobile-backdrop"
      (click)="mobileOpen = false; cdr.markForCheck()"
    ></div>

    <!-- ═══ SIDEBAR PANEL ══════════════════════════════════════ -->
    <nav
      class="sidebar"
      [class.sidebar--collapsed]="isVisuallyCollapsed"
      [class.sidebar--overlay]="isOverlay"
      [class.sidebar--hidden]="mode === 'mobile' && !mobileOpen"
      [class.sidebar--mobile-open]="mode === 'mobile' && mobileOpen"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >

      <!-- ── Account switcher ──────────────────────────────── -->
      <div class="account-switcher" (click)="accountClick.emit()">
        <div class="account-logo" [style.background]="cfg.bg">{{ cfg.label }}</div>
        <ng-container *ngIf="!isVisuallyCollapsed">
          <span class="account-name">{{ accountName }}</span>
          <fvdr-icon name="chevron-down" class="account-chevron" />
        </ng-container>
      </div>

      <!-- ── Nav list ─────────────────────────────────────── -->
      <div class="nav-list">
        <ng-container *ngFor="let item of items">
          <button
            class="nav-item"
            [class.nav-item--active]="item.active"
            [class.nav-item--open]="item.open"
            [class.nav-item--has-children]="!!item.children"
            [title]="isVisuallyCollapsed ? item.label : ''"
            (click)="toggleItem(item)"
          >
            <span class="nav-icon-zone">
              <span class="nav-icon">
                <fvdr-icon class="icon-default" [name]="item.icon" />
                <fvdr-icon class="icon-active"  [name]="item.iconActive" />
              </span>
            </span>
            <span class="nav-label" *ngIf="!isVisuallyCollapsed">{{ item.label }}</span>
            <fvdr-icon
              *ngIf="!isVisuallyCollapsed && item.children"
              name="chevron-down"
              class="nav-chevron"
              [class.nav-chevron--up]="item.open"
            />
          </button>

          <!-- Sub-items -->
          <div *ngIf="!isVisuallyCollapsed && item.open && item.children" class="nav-subitems">
            <button
              *ngFor="let child of item.children"
              class="nav-subitem"
              [class.nav-subitem--active]="child.active"
              (click)="onSubItem(item, child)"
            >{{ child.label }}</button>
          </div>
        </ng-container>
      </div>

      <!-- ── Bottom: logo + collapse/burger-close ─────────── -->
      <div class="sidebar-bottom">

        <!-- Full wordmark (expanded) -->
        <div class="sidebar-logo sidebar-logo--full" *ngIf="!isVisuallyCollapsed">
          <svg width="85" height="18" viewBox="0 0 117 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.380615 3.0228C0.380615 1.67609 1.47081 0.650024 2.84959 0.650024C4.1963 0.650024 5.25444 1.67609 5.25444 3.0228C5.25444 4.40158 4.1963 5.39558 2.84959 5.39558C1.43875 5.39558 0.380615 4.40158 0.380615 3.0228ZM0.861584 22.967V7.25533H4.67727V22.967H0.861584Z" fill="currentColor"/>
            <path d="M23.2427 1.00281V22.9991H19.5232V20.947C18.3689 22.3258 16.7336 23.3839 14.457 23.3839C9.93588 23.3839 6.56909 19.8247 6.56909 15.1433C6.56909 10.526 9.96794 6.93476 14.4249 6.93476C16.6694 6.93476 18.2727 7.96083 19.427 9.30754V1.00281H23.2427ZM19.6514 15.1112C19.6514 12.514 17.8238 10.3336 15.0021 10.3336C12.2125 10.3336 10.3848 12.514 10.3848 15.1112C10.3848 17.7726 12.2125 19.9209 15.0021 19.9209C17.7917 19.9209 19.6514 17.7726 19.6514 15.1112Z" fill="currentColor"/>
            <path d="M40.9744 16.4579H28.8861C29.367 18.478 30.842 20.0812 33.7278 20.0812C35.5234 20.0812 37.5756 19.4078 38.9544 18.4459L40.4614 21.1393C38.9864 22.2295 36.4533 23.3197 33.5675 23.3197C27.6035 23.3197 24.9742 19.2796 24.9742 15.1112C24.9742 10.4298 28.2768 6.90265 33.2148 6.90265C37.6718 6.90265 41.0706 9.82053 41.0706 14.7905C41.1027 15.4318 41.0386 15.9449 40.9744 16.4579ZM28.8861 13.6041H37.3511C37.0305 11.3917 35.3952 10.045 33.2148 10.045C31.0344 10.045 29.3991 11.4238 28.8861 13.6041Z" fill="currentColor"/>
            <path d="M59.1871 7.28742V22.967H55.5638V21.0431C54.3774 22.3899 52.6779 23.3518 50.4014 23.3518C45.8161 23.3518 42.5455 19.6964 42.5455 15.0471C42.5455 10.3336 45.8803 6.90265 50.4014 6.90265C52.6779 6.90265 54.3453 7.92872 55.5638 9.27543V7.28742H59.1871ZM55.66 15.1112C55.66 12.514 53.7681 10.3336 50.9785 10.3336C48.1889 10.3336 46.3292 12.514 46.3292 15.1112C46.3292 17.7405 48.1889 19.9209 50.9785 19.9209C53.7361 19.9209 55.66 17.7405 55.66 15.1112Z" fill="currentColor"/>
            <path d="M61.5919 22.9671V1.00281H65.3755V22.9991H61.5919V22.9671Z" fill="currentColor"/>
            <path d="M66.9468 20.2735L69.0951 17.9649C70.1853 19.3757 71.8206 20.1773 73.3597 20.1773C74.7385 20.1773 75.7004 19.4399 75.7004 18.5421C75.7004 17.8687 75.2515 17.4198 74.514 17.035C73.6162 16.5861 71.5641 15.9128 70.5701 15.3997C68.7745 14.534 67.9087 13.1231 67.9087 11.3916C67.9087 8.69822 70.1532 6.74228 73.6803 6.74228C75.7004 6.74228 77.6884 7.4477 79.1313 9.05093L77.1433 11.4558C76.0211 10.3015 74.6743 9.82048 73.5841 9.82048C72.3657 9.82048 71.6603 10.4938 71.6603 11.2955C71.6603 11.8406 72.013 12.4498 73.0391 12.8346C74.0651 13.2514 75.6042 13.7644 76.8547 14.4057C78.6183 15.3356 79.5482 16.554 79.5482 18.4138C79.5482 21.2034 77.1433 23.3838 73.3918 23.3838C70.8587 23.3838 68.4538 22.3577 66.9468 20.2735Z" fill="currentColor"/>
            <path d="M80.51 21.1714C80.51 19.9209 81.5361 18.959 82.8187 18.959C84.0371 18.959 85.0311 19.9209 85.0311 21.1714C85.0311 22.4861 84.0371 23.416 82.8187 23.416C81.5361 23.448 80.51 22.4861 80.51 21.1714Z" fill="currentColor"/>
          </svg>
        </div>

        <!-- Small icon mark (collapsed) -->
        <div class="sidebar-logo sidebar-logo--small" *ngIf="isVisuallyCollapsed">
          <svg width="24" height="24" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.4615 32.6773C25.553 32.6773 32.9231 25.3622 32.9231 16.3387C32.9231 7.31507 25.553 0 16.4615 0C7.37008 0 0 7.31507 0 16.3387C0 25.3622 7.37008 32.6773 16.4615 32.6773Z" fill="#1D8269"/>
            <path d="M16.4615 32.6773C25.553 32.6773 32.9231 25.3622 32.9231 16.3387C32.9231 7.31507 25.553 0 16.4615 0C7.37008 0 0 7.31507 0 16.3387C0 25.3622 7.37008 32.6773 16.4615 32.6773Z" fill="url(#sl_r0)" fill-opacity="0.9"/>
            <path d="M12.3462 30.635C19.1648 30.635 24.6923 24.2343 24.6923 16.3387C24.6923 8.44301 19.1648 2.04233 12.3462 2.04233C5.52756 2.04233 0 8.44301 0 16.3387C0 24.2343 5.52756 30.635 12.3462 30.635Z" fill="url(#sl_l1)"/>
            <path d="M12.3462 30.635C19.1648 30.635 24.6923 24.2343 24.6923 16.3387C24.6923 8.44301 19.1648 2.04233 12.3462 2.04233C5.52756 2.04233 0 8.44301 0 16.3387C0 24.2343 5.52756 30.635 12.3462 30.635Z" fill="url(#sl_r2)" fill-opacity="0.9"/>
            <path d="M8.23077 28.5926C12.7765 28.5926 16.4615 23.1063 16.4615 16.3386C16.4615 9.57095 12.7765 4.08466 8.23077 4.08466C3.68504 4.08466 0 9.57095 0 16.3386C0 23.1063 3.68504 28.5926 8.23077 28.5926Z" fill="url(#sl_l3)"/>
            <path d="M8.23077 28.5926C12.7765 28.5926 16.4615 23.1063 16.4615 16.3386C16.4615 9.57095 12.7765 4.08466 8.23077 4.08466C3.68504 4.08466 0 9.57095 0 16.3386C0 23.1063 3.68504 28.5926 8.23077 28.5926Z" fill="url(#sl_r4)"/>
            <path d="M4.11539 24.508C6.38825 24.508 8.23077 20.8505 8.23077 16.3387C8.23077 11.8269 6.38825 8.16934 4.11539 8.16934C1.84252 8.16934 0 11.8269 0 16.3387C0 20.8505 1.84252 24.508 4.11539 24.508Z" fill="#57D188"/>
            <path d="M4.11539 24.508C6.38825 24.508 8.23077 20.8505 8.23077 16.3387C8.23077 11.8269 6.38825 8.16934 4.11539 8.16934C1.84252 8.16934 0 11.8269 0 16.3387C0 20.8505 1.84252 24.508 4.11539 24.508Z" fill="url(#sl_l5)" fill-opacity="0.85"/>
            <defs>
              <radialGradient id="sl_r0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12.3462 20.168) rotate(-90) scale(18.1257 15.5245)">
                <stop offset="0.585" stop-color="#022E34"/><stop offset="1" stop-color="#022E34" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="sl_l1" x1="12.3462" y1="-10.3819" x2="12.3462" y2="30.635" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2C9C74"/><stop offset="1" stop-color="#3FB67D"/>
              </linearGradient>
              <radialGradient id="sl_r2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.23077 20.2531) rotate(-90) scale(16.0114 10.691)">
                <stop offset="0.485" stop-color="#022E34"/><stop offset="1" stop-color="#022E34" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="sl_l3" x1="8.23077" y1="-5.61642" x2="8.23077" y2="28.5926" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2C9C74"/><stop offset="1" stop-color="#57D188"/>
              </linearGradient>
              <radialGradient id="sl_r4" cx="0" cy="0" r="1" gradientTransform="matrix(0.771635 -11.403 6.01676 0.401094 3.77244 19.0618)" gradientUnits="userSpaceOnUse">
                <stop offset="0.350058" stop-color="#022E34"/><stop offset="0.95" stop-color="#022E34" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="sl_l5" x1="4.11539" y1="-6.80776" x2="4.11539" y2="24.508" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2C9C74"/><stop offset="1" stop-color="#70EB94"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Collapse/pin button — only when expanded (not visually collapsed) -->
        <button
          *ngIf="mode !== 'mobile' && !isVisuallyCollapsed"
          class="collapse-btn"
          (click)="toggleCollapse()"
          [title]="collapseTooltip"
        >
          <fvdr-icon [name]="collapseIcon" />
        </button>

        <!-- Close button — mobile overlay -->
        <button
          *ngIf="mode === 'mobile'"
          class="collapse-btn"
          (click)="mobileOpen = false; cdr.markForCheck()"
          title="Close menu"
        >
          <fvdr-icon name="close" />
        </button>

      </div>
    </nav>
  `,
  styles: [`
    :host { display: contents; }

    /* ═══ Burger (mobile only) ═════════════════════════════════ */
    .burger-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: 24px;
      border-radius: var(--radius-sm);
      transition: background 0.12s;
    }
    .burger-btn:hover { background: var(--color-hover-bg); }

    /* ═══ Mobile backdrop ══════════════════════════════════════ */
    .mobile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.32);
      z-index: 199;
    }

    /* ═══ Sidebar shell ════════════════════════════════════════ */
    .sidebar {
      width: 280px;
      min-width: 280px;
      height: 100%;
      background: var(--color-stone-100);
      border-right: 1px solid var(--color-divider);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
      transition: width 0.22s ease, min-width 0.22s ease, box-shadow 0.22s ease;
      position: relative;
      z-index: 10;
    }

    /* Collapsed — icon-only */
    .sidebar--collapsed {
      width: 72px;
      min-width: 72px;
    }

    /* Overlay: position fixed, no layout impact, appears above content */
    .sidebar--overlay {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 200;
      box-shadow: 4px 0 24px rgba(0,0,0,0.14);
    }

    /* Mobile: hidden by default */
    .sidebar--hidden {
      display: none;
    }

    /* Mobile: open as fixed overlay */
    .sidebar--mobile-open {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 280px !important;
      min-width: 280px !important;
      z-index: 200;
      box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    }

    /* ═══ Account switcher ══════════════════════════════════════ */
    .account-switcher {
      height: 64px;
      min-height: 64px;
      background: var(--color-stone-100);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      overflow: hidden;
      cursor: pointer;
      transition: background 0.12s;
    }
    .account-switcher:hover { background: var(--color-hover-bg); }
    .sidebar--collapsed .account-switcher { justify-content: center; padding: 12px 0; }

    .account-logo {
      width: 40px; height: 40px; min-width: 40px;
      border-radius: var(--radius-sm);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .account-name {
      flex: 1; font-size: 16px; font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .account-chevron { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    /* ═══ Nav list ══════════════════════════════════════════════ */
    .nav-list {
      flex: 1;
      display: flex; flex-direction: column;
      padding: 24px 0; gap: 24px;
      overflow-y: auto; overflow-x: hidden;
      background: var(--color-stone-100);
    }

    /* ═══ Nav item ══════════════════════════════════════════════ */
    .nav-item {
      display: flex; align-items: center;
      width: 100%; height: 32px;
      padding: 0 24px 0 0;
      background: transparent; border: none; cursor: pointer;
      color: var(--color-text-primary);
      font-size: 16px; font-weight: 400;
      font-family: var(--font-family);
      text-align: left;
      transition: background 0.1s;
      white-space: nowrap; overflow: hidden;
    }
    .icon-active { display: none; }
    .nav-item:hover { background: var(--color-hover-bg); }
    .nav-item:hover .icon-default { display: none; }
    .nav-item:hover .icon-active  { display: inline-flex; }
    .nav-item--active, .nav-item--open { font-weight: 600; }
    .nav-item--active { background: var(--color-primary-50); }
    .nav-item--active:hover { background: var(--color-primary-50); }
    .nav-item--active .icon-default,
    .nav-item--open   .icon-default { display: none; }
    .nav-item--active .icon-active,
    .nav-item--open   .icon-active  { display: inline-flex; }
    .nav-item--has-children { padding-right: 16px; }

    .nav-icon-zone {
      width: 72px; min-width: 72px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .nav-icon {
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary); font-size: 24px;
    }
    .nav-item--active .nav-icon,
    .nav-item--open   .nav-icon { color: var(--color-primary-500); }
    .nav-item:hover   .nav-icon { color: var(--color-text-primary); }
    .icon-default { display: flex; }
    .nav-label { flex: 1; }
    .nav-chevron {
      font-size: 16px; color: var(--color-text-secondary);
      transition: transform 0.2s; flex-shrink: 0;
    }
    .nav-chevron--up { transform: rotate(180deg); }

    /* ═══ Sub-items ════════════════════════════════════════════ */
    .nav-subitems {
      display: flex; flex-direction: column; gap: 10px;
      background: var(--color-stone-100);
    }
    .nav-subitem {
      height: 32px; padding: 0 16px 0 72px;
      background: none; border: none; cursor: pointer;
      font-size: 14px; font-weight: 400;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      text-align: left; transition: background 0.1s; white-space: nowrap;
    }
    .nav-subitem:hover { background: var(--color-hover-bg); }
    .nav-subitem--active { font-weight: 600; color: var(--color-primary-500); }

    /* ═══ Bottom bar ════════════════════════════════════════════ */
    .sidebar-bottom {
      background: var(--color-stone-100);
      display: flex; align-items: center;
      padding: 24px 16px 24px 24px;
      overflow: hidden; flex-shrink: 0;
    }
    .sidebar--collapsed .sidebar-bottom { justify-content: center; padding: 16px 0; }

    .sidebar-logo {
      flex: 1; display: flex; align-items: center;
      overflow: hidden; color: var(--color-text-primary);
    }
    .sidebar-logo--small {
      justify-content: center;
      flex: 0 0 auto;
      margin-right: 0;
    }

    .collapse-btn {
      width: 32px; height: 32px; min-width: 32px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: none;
      border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: 16px;
      flex-shrink: 0; transition: background 0.12s;
    }
    .collapse-btn:hover { background: var(--color-hover-bg); }
    .sidebar--collapsed .collapse-btn { margin: 0; }
  `],
})
export class SidebarNavComponent implements OnInit {
  @Input() variant: SidebarNavVariant = 'ca';
  @Input() accountName = 'Account';
  @Input() items: SidebarNavItem[] = [];
  /** Desktop: explicit collapsed state from parent. Tablet/mobile: managed internally. */
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<SidebarNavItem>();
  @Output() subItemClick = new EventEmitter<{ item: SidebarNavItem; subItem: SidebarNavSubItem }>();
  @Output() accountClick = new EventEmitter<void>();

  mode: SidebarMode = 'desktop';
  /** Tablet: sidebar is hovered open (overlay, not pinned) */
  hovered = false;
  /** Tablet: user clicked the arrow to pin the sidebar open in flow */
  pinned = false;
  /** Mobile: overlay is open */
  mobileOpen = false;

  constructor(readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.updateMode(); }

  @HostListener('window:resize')
  onResize(): void { this.updateMode(); }

  private updateMode(): void {
    const w = window.innerWidth;
    const prev = this.mode;
    if (w >= BP_DESKTOP)      this.mode = 'desktop';
    else if (w >= BP_TABLET)  this.mode = 'tablet';
    else                      this.mode = 'mobile';

    // Reset tablet state when leaving tablet mode
    if (prev !== this.mode) { this.hovered = false; this.pinned = false; this.mobileOpen = false; }
    this.cdr.markForCheck();
  }

  /** True when the sidebar should render as icon-only */
  get isVisuallyCollapsed(): boolean {
    if (this.mode === 'mobile') return false;
    if (this.hovered || this.pinned) return false;
    if (this.mode === 'desktop') return this.collapsed;
    return true; // tablet: collapsed by default
  }

  /** True when the sidebar should float over content (not part of flow) */
  get isOverlay(): boolean {
    if (this.mode === 'mobile') return false;
    // Desktop: overlay only while hovered (not when permanently expanded)
    if (this.mode === 'desktop') return this.collapsed && this.hovered && !this.pinned;
    // Tablet: overlay while hovered but not pinned (pinned = part of flow)
    return this.hovered && !this.pinned;
  }

  get collapseIcon(): FvdrIconName {
    if (this.mode === 'desktop') return 'chevron-left';
    return this.pinned ? 'chevron-left' : 'chevron-right';
  }

  get collapseTooltip(): string {
    if (this.mode === 'desktop') return 'Collapse';
    return this.pinned ? 'Unpin sidebar' : 'Pin sidebar open';
  }

  get cfg() { return VARIANT_CONFIG[this.variant]; }

  onMouseEnter(): void {
    if (this.mode === 'mobile') return;
    // Desktop: expand on hover only when collapsed
    if (this.mode === 'desktop' && !this.collapsed) return;
    if (!this.pinned) {
      this.hovered = true;
      this.cdr.markForCheck();
    }
  }

  onMouseLeave(): void {
    if (this.mode === 'mobile') return;
    if (!this.pinned) {
      this.hovered = false;
      this.cdr.markForCheck();
    }
  }

  toggleCollapse(): void {
    if (this.mode === 'desktop') {
      // If currently hovering over collapsed sidebar → expand permanently
      if (this.hovered && this.collapsed) {
        this.collapsed = false;
        this.hovered = false;
      } else {
        this.collapsed = !this.collapsed;
        this.hovered = false;
      }
      this.collapsedChange.emit(this.collapsed);
    } else if (this.mode === 'tablet') {
      this.pinned = !this.pinned;
      if (!this.pinned) this.hovered = false;
    }
    this.cdr.markForCheck();
  }

  toggleItem(item: SidebarNavItem): void {
    if (item.children) {
      item.open = !item.open;
    } else {
      this.items.forEach(i => i.active = false);
      item.active = true;
    }
    this.itemClick.emit(item);
  }

  onSubItem(item: SidebarNavItem, sub: SidebarNavSubItem): void {
    this.items.forEach(i => { i.active = false; i.children?.forEach(c => c.active = false); });
    sub.active = true;
    item.active = true;
    this.subItemClick.emit({ item, subItem: sub });
  }
}
