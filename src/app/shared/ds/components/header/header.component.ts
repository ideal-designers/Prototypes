import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { FvdrIconName } from '../../icons/icons';

export interface HeaderNavItem {
  id: string;
  label: string;
  icon?: FvdrIconName;
  activeIcon?: FvdrIconName;
  badge?: number;
}

export interface HeaderAction {
  id: string;
  icon: FvdrIconName;
  label?: string;
  badge?: number;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
}

/**
 * DS Desktop header — Figma: liyNDiFf1piO8SQmHNKoeU, node 16471-25871
 *
 * DS specs:
 *   Height: 64px
 *   Left: Logo/wordmark
 *   Center or left: Nav items
 *   Right: action icons + avatar
 *   Border-bottom: 1px #DEE0EB
 *   Background: #FFFFFF
 *
 * Usage:
 *   <fvdr-header [navItems]="nav" [activeNavId]="current" (navClick)="navigate($event)" />
 */
@Component({
  selector: 'fvdr-header',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, AvatarComponent, BadgeComponent, BreadcrumbsComponent],
  template: `
    <header class="header">
      <!-- Breadcrumbs mode -->
      <ng-container *ngIf="breadcrumbs?.length; else logoMode">
        <button *ngIf="showMenu" class="header__menu" (click)="menuClick.emit()">
          <fvdr-icon name="more" />
        </button>
        <fvdr-breadcrumbs
          class="header__breadcrumbs"
          [items]="breadcrumbs"
          (itemClick)="breadcrumbClick.emit($event)"
        />
      </ng-container>

      <!-- Logo + Nav mode (original) -->
      <ng-template #logoMode>
        <div class="header__logo" (click)="logoClick.emit()">
          <ng-content select="[logo]"></ng-content>
          <span *ngIf="!hasLogo" class="header__logo-text">{{ appName }}</span>
        </div>
        <nav *ngIf="navItems?.length" class="header__nav">
          <button
            *ngFor="let item of navItems"
            class="header__nav-item"
            [class.header__nav-item--active]="activeNavId === item.id"
            (click)="onNavClick(item)"
          >
            <fvdr-icon
              *ngIf="item.icon"
              [name]="activeNavId === item.id && item.activeIcon ? item.activeIcon : (item.icon || 'overview')"
              class="header__nav-icon"
            />
            <span>{{ item.label }}</span>
            <span *ngIf="item.badge" class="header__nav-badge">{{ item.badge }}</span>
          </button>
        </nav>
      </ng-template>

      <!-- Right -->
      <div class="header__right">
        <button
          *ngFor="let action of actions"
          class="header__action"
          [title]="action.label || ''"
          (click)="actionClick.emit(action.id)"
        >
          <fvdr-icon [name]="action.icon" />
          <span *ngIf="action.badge" class="header__action-badge">{{ action.badge > 99 ? '99+' : action.badge }}</span>
        </button>
        <fvdr-avatar *ngIf="userName" [initials]="toInitials(userName)" [imgSrc]="userAvatar" size="md" class="header__avatar" (click)="avatarClick.emit()" />
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      height: 64px;
      padding: 0 var(--space-6);
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      gap: var(--space-6);
      position: relative;
      z-index: 100;
    }

    .header__logo {
      display: flex;
      align-items: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .header__logo-text {
      font-family: var(--font-family);
      font-size: var(--text-sub2-size);
      font-weight: 700;
      color: var(--color-primary-500);
    }

    .header__nav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }

    .header__nav-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      height: 36px;
      padding: 0 var(--space-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-secondary);
      transition: all 0.15s;
      position: relative;
    }
    .header__nav-item:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .header__nav-item--active {
      background: var(--color-primary-50);
      color: var(--color-primary-500);
      font-weight: var(--text-base-s-sb-weight);
    }
    .header__nav-icon { font-size: 16px; }
    .header__nav-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: var(--radius-full);
      background: var(--color-error-600);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
    }

    .header__menu { width:36px; height:36px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--color-text-secondary); font-size:24px; flex-shrink:0; }
    .header__menu:hover { background:var(--color-hover-bg); color:var(--color-text-primary); }
    .header__breadcrumbs { flex:1; }

    .header__right {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      margin-left: auto;
    }

    .header__action {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 24px;
    }
    .header__action:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .header__action-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 16px;
      height: 16px;
      padding: 0 3px;
      border-radius: var(--radius-full);
      background: var(--color-error-600);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header__avatar { cursor: pointer; }
  `],
})
export class HeaderComponent {
  @Input() appName = 'FVDR';
  @Input() navItems: HeaderNavItem[] = [];
  @Input() activeNavId = '';
  @Input() actions: HeaderAction[] = [];
  @Input() userName = '';
  @Input() userAvatar = '';
  @Input() hasLogo = false;
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() showMenu = false;
  @Output() logoClick = new EventEmitter<void>();
  @Output() navClick = new EventEmitter<string>();
  @Output() actionClick = new EventEmitter<string>();
  @Output() avatarClick = new EventEmitter<void>();
  @Output() breadcrumbClick = new EventEmitter<string>();
  @Output() menuClick = new EventEmitter<void>();

  onNavClick(item: HeaderNavItem): void { this.navClick.emit(item.id); }
  toInitials(name: string): string { return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }
}

// ─── Mobile Header ────────────────────────────────────────────────────────────

/**
 * DS Mobile header — Figma: liyNDiFf1piO8SQmHNKoeU, node 16411-25469
 */
@Component({
  selector: 'fvdr-mobile-header',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, AvatarComponent],
  template: `
    <header class="mob-header">
      <button *ngIf="showBack" class="mob-header__back" (click)="backClick.emit()">
        <fvdr-icon name="chevron-left" />
      </button>
      <button *ngIf="!showBack && showMenu" class="mob-header__menu" (click)="menuClick.emit()">
        <fvdr-icon name="more" />
      </button>
      <span class="mob-header__title">{{ title }}</span>
      <div class="mob-header__right">
        <button *ngFor="let action of actions" class="mob-header__action" (click)="actionClick.emit(action.id)">
          <fvdr-icon [name]="action.icon" />
          <span *ngIf="action.badge" class="mob-header__badge">{{ action.badge > 9 ? '9+' : action.badge }}</span>
        </button>
        <fvdr-avatar *ngIf="userName" [initials]="toInitials(userName)" size="sm" (click)="avatarClick.emit()" />
      </div>
    </header>
  `,
  styles: [`
    .mob-header {
      display: flex;
      align-items: center;
      height: 56px;
      padding: 0 var(--space-4);
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      gap: var(--space-2);
    }

    .mob-header__back,
    .mob-header__menu {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: 20px; flex-shrink: 0;
      border-radius: var(--radius-sm);
    }
    .mob-header__back:hover,
    .mob-header__menu:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .mob-header__title {
      flex: 1;
      font-family: var(--font-family);
      font-size: var(--text-sub2-size);
      font-weight: var(--text-sub2-weight);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mob-header__right { display: flex; align-items: center; gap: var(--space-1); margin-left: auto; flex-shrink: 0; }

    .mob-header__action {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: 20px;
      border-radius: var(--radius-sm);
    }
    .mob-header__action:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .mob-header__badge {
      position: absolute; top: 4px; right: 4px;
      min-width: 14px; height: 14px; padding: 0 3px;
      border-radius: var(--radius-full); background: var(--color-error-600);
      color: #fff; font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
  `],
})
export class MobileHeaderComponent {
  @Input() title = '';
  @Input() showBack = false;
  @Input() showMenu = true;
  @Input() actions: HeaderAction[] = [];
  @Input() userName = '';
  @Output() backClick = new EventEmitter<void>();
  @Output() menuClick = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<string>();
  @Output() avatarClick = new EventEmitter<void>();
  toInitials(name: string): string { return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }
}
