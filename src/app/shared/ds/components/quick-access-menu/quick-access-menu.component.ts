import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import type { FvdrIconName } from '../../icons/icons';

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: FvdrIconName;
  active?: boolean;
}

/**
 * DS Quick Access Menu — Figma: liyNDiFf1piO8SQmHNKoeU, node 36673-1987
 *
 * Collapsible shortcut panel placed on the left side of the workspace.
 * Shows a header with title + controls, and a list of shortcut items.
 * In collapsed mode the header shows icon buttons instead of the title.
 *
 * Usage:
 *   <fvdr-quick-access-menu
 *     [items]="shortcuts"
 *     [(collapsed)]="menuCollapsed"
 *     (itemClick)="onShortcut($event)"
 *   />
 */
@Component({
  selector: 'fvdr-quick-access-menu',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="qa-menu" [class.qa-menu--collapsed]="collapsed">

      <!-- Header -->
      <div class="qa-header">
        <ng-container *ngIf="!collapsed; else collapsedHeader">
          <span class="qa-header__title">Quick access</span>
          <div class="qa-header__actions">
            <button class="qa-icon-btn" title="Expand/Collapse" (click)="toggleCollapse()">
              <fvdr-icon name="angle-double-left" />
            </button>
            <button class="qa-icon-btn" title="Close" (click)="closed.emit()">
              <fvdr-icon name="chevron-left" />
            </button>
          </div>
        </ng-container>

        <ng-template #collapsedHeader>
          <div class="qa-header__collapsed-icons">
            <button class="qa-icon-btn" *ngFor="let item of items" [title]="item.label" (click)="itemClick.emit(item)">
              <fvdr-icon [name]="item.icon" />
            </button>
            <button class="qa-icon-btn qa-icon-btn--expand" title="Expand" (click)="toggleCollapse()">
              <fvdr-icon name="angle-double-right" />
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Items (hidden when collapsed) -->
      <div class="qa-items" *ngIf="!collapsed">
        <button
          *ngFor="let item of items"
          class="qa-item"
          [class.qa-item--active]="item.active"
          (click)="onItemClick(item)"
        >
          <span class="qa-item__icon">
            <fvdr-icon [name]="item.icon" />
          </span>
          <span class="qa-item__label">{{ item.label }}</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Shell ── */
    .qa-menu {
      width: 340px;
      display: flex;
      flex-direction: column;
      background: var(--color-stone-0, #fff);
      border-radius: var(--radius-sm, 4px);
      overflow: hidden;
      font-family: var(--font-family, 'Open Sans', sans-serif);
    }
    .qa-menu--collapsed {
      width: auto;
    }

    /* ── Header ── */
    .qa-header {
      height: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: var(--color-stone-200, #f7f7f7);
      border-radius: var(--radius-sm, 4px);
      flex-shrink: 0;
    }
    .qa-menu--collapsed .qa-header {
      padding: 0 8px;
      justify-content: center;
    }

    .qa-header__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary, #1f2129);
      white-space: nowrap;
    }

    .qa-header__actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .qa-header__collapsed-icons {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    /* ── Icon button ── */
    .qa-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary, #5f616a);
      border-radius: var(--radius-sm, 4px);
      font-size: 16px;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.12s;
    }
    .qa-icon-btn:hover {
      background: var(--color-hover-bg, #eceef9);
      color: var(--color-text-primary, #1f2129);
    }

    /* ── Items list ── */
    .qa-items {
      display: flex;
      flex-direction: column;
    }

    .qa-item {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 40px;
      padding: 10px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 400;
      font-family: var(--font-family, 'Open Sans', sans-serif);
      color: var(--color-text-primary, #1f2129);
      text-align: left;
      border-radius: var(--radius-sm, 4px);
      transition: background 0.1s;
      white-space: nowrap;
      width: 100%;
    }
    .qa-item:hover {
      background: var(--color-hover-bg, #eceef9);
    }
    .qa-item--active {
      background: var(--color-primary-50, #ebf8ef);
    }
    .qa-item--active:hover {
      background: var(--color-primary-50, #ebf8ef);
    }

    .qa-item__icon {
      display: flex;
      align-items: center;
      font-size: 16px;
      color: var(--color-text-secondary, #5f616a);
      flex-shrink: 0;
    }
    .qa-item--active .qa-item__icon {
      color: var(--color-primary-500, #2c9c74);
    }

    .qa-item__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  `],
})
export class QuickAccessMenuComponent {
  @Input() items: QuickAccessItem[] = [
    { id: 'recent',    label: 'Recent',    icon: 'clock'  as FvdrIconName },
    { id: 'favorites', label: 'Favorites', icon: 'sort'   as FvdrIconName },
    { id: 'new',       label: 'New',       icon: 'upload' as FvdrIconName },
    { id: 'notes',     label: 'Notes',     icon: 'note'   as FvdrIconName },
  ];
  @Input()  collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<QuickAccessItem>();
  @Output() closed = new EventEmitter<void>();

  onItemClick(item: QuickAccessItem): void {
    this.items.forEach(i => i.active = false);
    item.active = true;
    this.itemClick.emit(item);
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
