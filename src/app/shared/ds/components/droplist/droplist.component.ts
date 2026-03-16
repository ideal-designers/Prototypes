import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export interface DroplistItem {
  id: string;
  label: string;
  icon?: FvdrIconName;
  rightText?: string;
  badge?: number;
  disabled?: boolean;
  dividerAfter?: boolean;
  variant?: 'default' | 'danger';
}

/**
 * DS Droplist — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13916
 * DS Droplist items — Figma: node 18501-1954
 *
 * DS specs:
 *   Panel: bg #FFFFFF, radius 8px, shadow-popover, border 1px #DEE0EB
 *   Min-width: 160px
 *   Item height: 36px, padding 0 12px
 *   Hover bg: #ECEEF9
 *   Icon left: 16px, color stone-600
 *   Right: shortcut text / badge / check
 *   Divider: 1px #DEE0EB full width
 *   Danger item: text #E54430
 *
 * Usage (standalone panel):
 *   <fvdr-droplist [items]="menuItems" (itemClick)="onAction($event)" />
 */
@Component({
  selector: 'fvdr-droplist',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="droplist" [style.min-width.px]="minWidth">
      <ng-container *ngFor="let item of items">
        <button
          class="droplist__item"
          [class.droplist__item--danger]="item.variant === 'danger'"
          [class.droplist__item--active]="activeId === item.id"
          [disabled]="item.disabled"
          (click)="onItemClick(item)"
        >
          <fvdr-icon *ngIf="item.icon" [name]="item.icon" class="droplist__icon" />
          <span class="droplist__label">{{ item.label }}</span>
          <span *ngIf="item.rightText" class="droplist__right">{{ item.rightText }}</span>
          <span *ngIf="item.badge" class="droplist__badge">{{ item.badge }}</span>
          <fvdr-icon *ngIf="activeId === item.id" name="check" class="droplist__check" />
        </button>
        <div *ngIf="item.dividerAfter" class="droplist__divider"></div>
      </ng-container>
    </div>
  `,
  styles: [`
    .droplist {
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      padding: var(--space-1) 0;
      overflow: hidden;
    }

    .droplist__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      height: 36px;
      padding: 0 var(--space-3);
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      text-align: left;
      transition: background 0.1s;
    }
    .droplist__item:hover:not(:disabled) { background: var(--color-hover-bg); }
    .droplist__item:disabled { opacity: 0.45; cursor: not-allowed; }
    .droplist__item--danger { color: var(--color-error-600); }
    .droplist__item--active { background: var(--color-primary-50); color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }

    .droplist__icon { font-size: 16px; color: var(--color-stone-600); flex-shrink: 0; }
    .droplist__item--danger .droplist__icon { color: var(--color-error-600); }

    .droplist__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .droplist__right {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .droplist__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: var(--radius-full);
      background: var(--color-primary-500);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
    }
    .droplist__check { font-size: 14px; color: var(--color-primary-500); margin-left: auto; }

    .droplist__divider {
      height: 1px;
      background: var(--color-divider);
      margin: var(--space-1) 0;
    }
  `],
})
export class DroplistComponent {
  @Input() items: DroplistItem[] = [];
  @Input() activeId = '';
  @Input() minWidth = 160;
  @Output() itemClick = new EventEmitter<DroplistItem>();

  onItemClick(item: DroplistItem): void {
    if (!item.disabled) this.itemClick.emit(item);
  }
}
