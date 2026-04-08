import { Component, Input, Output, EventEmitter } from '@angular/core';
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

const VARIANT_CONFIG: Record<SidebarNavVariant, { bg: string; label: string }> = {
  vdr:      { bg: '#084D4B', label: 'VDR' },
  ca:       { bg: '#1C3B6E', label: 'CA'  },
  internal: { bg: '#3B1C6E', label: 'INT' },
};

/**
 * DS Sidebar Navigation — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-15291
 *
 * App-level left sidebar used in VDR, CA, and Internal contexts.
 * Supports collapsible mode, nested sub-items, and account switcher.
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
  template: `
    <nav class="sidebar" [class.sidebar--collapsed]="collapsed">

      <!-- ── Account switcher ──────────────────────────── -->
      <div class="account-switcher" (click)="accountClick.emit()">
        <div class="account-logo" [style.background]="cfg.bg">{{ cfg.label }}</div>
        <ng-container *ngIf="!collapsed">
          <span class="account-name">{{ accountName }}</span>
          <fvdr-icon name="chevron-down" class="account-chevron" />
        </ng-container>
      </div>

      <!-- ── Nav list ──────────────────────────────────── -->
      <div class="nav-list">
        <ng-container *ngFor="let item of items">
          <button
            class="nav-item"
            [class.nav-item--active]="item.active"
            [class.nav-item--open]="item.open"
            [title]="collapsed ? item.label : ''"
            (click)="toggleItem(item)"
          >
            <span class="nav-icon-zone">
              <span class="nav-icon">
                <fvdr-icon class="icon-default" [name]="item.icon" />
                <fvdr-icon class="icon-active"  [name]="item.iconActive" />
              </span>
            </span>
            <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
            <fvdr-icon
              *ngIf="!collapsed && item.children"
              name="chevron-down"
              class="nav-chevron"
              [class.nav-chevron--up]="item.open"
            />
          </button>

          <!-- Sub-items -->
          <div *ngIf="!collapsed && item.open && item.children" class="nav-subitems">
            <button
              *ngFor="let child of item.children"
              class="nav-subitem"
              [class.nav-subitem--active]="child.active"
              (click)="onSubItem(item, child)"
            >{{ child.label }}</button>
          </div>
        </ng-container>
      </div>

      <!-- ── Bottom: logo + collapse ───────────────────── -->
      <div class="sidebar-bottom">
        <div class="sidebar-logo" *ngIf="!collapsed">
          <!-- ideals. wordmark -->
          <svg width="68" height="14" viewBox="0 0 87 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.285 2.27C0.285 1.26 1.1 0.487 2.137 0.487c1.005 0 1.804 0.773 1.804 1.782 0 1.05-.8 1.796-1.804 1.796C1.1 4.065.285 3.32.285 2.27Zm0.361 15.525V5.441h2.867V17.795H.646Z" fill="currentColor"/>
            <path d="M17.432 0.752v16.499H14.659v-1.538c-.863 1.038-2.078 1.788-3.817 1.788-3.386 0-5.773-2.674-5.773-5.98 0-3.438 2.452-5.949 5.773-5.949 1.739 0 2.922.773 3.817 1.789V.752h2.773Zm-2.84 10.769c0-1.948-1.37-3.622-3.483-3.622-2.112 0-3.482 1.674-3.482 3.622 0 2.012 1.37 3.622 3.482 3.622 2.113 0 3.483-1.61 3.483-3.622Z" fill="currentColor"/>
            <path d="M30.73 12.343H21.65c.36 1.5 1.434 2.701 3.418 2.701 1.345 0 2.838-.503 3.907-1.253l1.133 2.035c-1.133.847-3.01 1.63-5.105 1.63-4.474 0-6.397-2.894-6.397-6.233 0-3.578 2.484-5.96 5.94-5.96 3.289 0 6.183 2.2 6.183 5.757.024.486-.007.873-.098 1.323Zm-9.08-2.14h6.38c-.245-1.666-1.517-2.654-3.18-2.654-1.663 0-2.936 1.053-3.2 2.654Z" fill="currentColor"/>
            <path d="M44.39 5.472v11.789h-2.677V15.71c-.886.98-2.24 1.744-3.947 1.744-3.386 0-5.772-2.614-5.772-5.857 0-3.375 2.45-5.96 5.772-5.96 1.707 0 2.971.773 3.947 1.789V5.472h2.677Zm-2.773 7.125c0-1.949-1.402-3.623-3.482-3.623-2.113 0-3.483 1.674-3.483 3.623 0 1.98 1.37 3.621 3.483 3.621 1.983 0 3.482-1.64 3.482-3.621Z" fill="currentColor"/>
            <path d="M46.194 17.217V.752h2.867V17.24h-2.867v-.023Z" fill="currentColor"/>
            <path d="M50.21 15.17l1.6-1.726c.833 1.058 2.08 1.629 3.19 1.629 1.044 0 1.768-.565 1.768-1.326 0-.544-.335-.87-0.897-1.157-.67-.36-2.29-.91-3.127-1.344-1.339-.67-1.998-1.726-1.998-3.084 0-2.034 1.703-3.644 4.388-3.644 1.538 0 3.104.541 4.225 1.726L57.773 7.98c-.83-.819-1.935-1.2-2.786-1.2-.9 0-1.494.498-1.494.995 0 .414.265.826.927 1.08.765.302 2.1.652 3.053.975 1.302.628 2.07 1.564 2.07 3.08 0 2.2-1.837 3.645-4.375 3.645-1.906 0-3.77-.797-4.957-2.384Z" fill="currentColor"/>
            <circle cx="81.5" cy="15.5" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()" [title]="collapsed ? 'Expand' : 'Collapse'">
          <fvdr-icon [name]="collapsed ? 'chevron-right' : 'chevron-left'" />
        </button>
      </div>

    </nav>
  `,
  styles: [`
    :host { display: contents; }

    /* ── Shell ── */
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
      transition: width 0.22s ease, min-width 0.22s ease;
    }
    .sidebar--collapsed { width: 72px; min-width: 72px; }

    /* ── Account switcher ── */
    .account-switcher {
      height: 64px;
      min-height: 64px;
      background: var(--color-stone-100);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      border-bottom: 1px solid var(--color-divider);
      overflow: hidden;
      cursor: pointer;
      transition: background 0.12s;
    }
    .account-switcher:hover { background: var(--color-hover-bg); }
    .sidebar--collapsed .account-switcher { justify-content: center; padding: 0; }

    .account-logo {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: var(--radius-sm);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .account-name {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-chevron { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    /* ── Nav list ── */
    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      gap: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--color-stone-100);
    }

    /* ── Nav item ── */
    .nav-item {
      display: flex;
      align-items: center;
      width: 100%;
      height: 40px;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: 14px;
      font-weight: 400;
      font-family: var(--font-family);
      text-align: left;
      transition: background 0.1s;
      white-space: nowrap;
      overflow: hidden;
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

    .nav-icon-zone {
      width: 56px;
      min-width: 56px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: 20px;
    }
    .nav-item--active .nav-icon,
    .nav-item--open   .nav-icon { color: var(--color-primary-500); }
    .nav-item:hover   .nav-icon { color: var(--color-text-primary); }
    .icon-default { display: flex; }
    .nav-label { flex: 1; }
    .nav-chevron {
      font-size: 16px;
      margin-right: 16px;
      color: var(--color-text-secondary);
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .nav-chevron--up { transform: rotate(180deg); }

    /* ── Sub-items ── */
    .nav-subitems {
      display: flex;
      flex-direction: column;
      background: var(--color-stone-100);
    }
    .nav-subitem {
      height: 40px;
      padding: 0 16px 0 56px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 400;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      text-align: left;
      transition: background 0.1s;
      white-space: nowrap;
    }
    .nav-subitem:hover { background: var(--color-hover-bg); }
    .nav-subitem--active { font-weight: 600; color: var(--color-primary-500); }

    /* ── Bottom ── */
    .sidebar-bottom {
      height: 64px;
      min-height: 64px;
      background: var(--color-stone-100);
      border-top: 1px solid var(--color-divider);
      display: flex;
      align-items: center;
      padding: 0 16px;
      overflow: hidden;
      flex-shrink: 0;
      gap: 8px;
    }
    .sidebar-logo {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
      color: var(--color-text-secondary);
    }
    .collapse-btn {
      width: 32px;
      height: 32px;
      min-width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 16px;
      flex-shrink: 0;
      transition: background 0.12s;
      margin-left: auto;
    }
    .collapse-btn:hover { background: var(--color-hover-bg); }
    .sidebar--collapsed .sidebar-bottom { justify-content: center; padding: 0; }
    .sidebar--collapsed .collapse-btn { margin-left: 0; }
  `],
})
export class SidebarNavComponent {
  @Input() variant: SidebarNavVariant = 'ca';
  @Input() accountName = 'Account';
  @Input() items: SidebarNavItem[] = [];
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<SidebarNavItem>();
  @Output() subItemClick = new EventEmitter<{ item: SidebarNavItem; subItem: SidebarNavSubItem }>();
  @Output() accountClick = new EventEmitter<void>();

  get cfg() { return VARIANT_CONFIG[this.variant]; }

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
    this.items.forEach(i => {
      i.active = false;
      i.children?.forEach(c => c.active = false);
    });
    sub.active = true;
    item.active = true;
    this.subItemClick.emit({ item, subItem: sub });
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
