import { Component, Input, Output, EventEmitter, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';
import { CheckboxComponent } from '../checkbox/checkbox.component';

export interface DroplistItem {
  id: string;
  label: string;
  description?: string;
  icon?: FvdrIconName;
  rightText?: string;
  badge?: number;
  disabled?: boolean;
  dividerAfter?: boolean;
  variant?: 'default' | 'danger';
  /** Child items — renders chevron-right and opens a submenu on hover */
  children?: DroplistItem[];
}

/**
 * DS Droplist — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13916
 *
 * DS specs:
 *   Panel: bg #FFFFFF, radius 4px (--radius-sm), shadow-popover, border 1px stone-400
 *   Min-width: 280px
 *   Item height: 40px, padding 0 16px
 *   Hover bg: #ECEEF9 (--color-hover-bg)
 *   Active bg: #EBF8EF (--color-primary-50, green)
 *   Checkbox mode: [checkboxes]="true", [selectedIds] / (selectionChange)
 *   Cascade: item.children — submenu opens to the right on hover
 *
 * Usage:
 *   <fvdr-droplist [items]="menuItems" (itemClick)="onAction($event)" />
 *   <fvdr-droplist [items]="opts" [checkboxes]="true" [selectedIds]="sel" (selectionChange)="sel=$event" />
 */
@Component({
  selector: 'fvdr-droplist',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent, CheckboxComponent],
  template: `
    <div class="droplist-wrap" (mouseleave)="scheduleClose()">
      <div class="droplist" [style.min-width.px]="minWidth">
        <ng-container *ngFor="let item of items">
          <button
            class="droplist__item"
            [class.droplist__item--danger]="item.variant === 'danger'"
            [class.droplist__item--active]="!checkboxes && activeId === item.id"
            [class.droplist__item--checked]="checkboxes && isChecked(item.id)"
            [class.droplist__item--cascade-open]="hoveredChildId === item.id"
            [class.droplist__item--with-desc]="item.description"
            [disabled]="item.disabled"
            (mouseenter)="onItemEnter(item, $event)"
            (click)="onItemClick(item)"
          >
            <!-- Checkbox mode -->
            <fvdr-checkbox
              *ngIf="checkboxes"
              [ngModel]="isChecked(item.id)"
              [disabled]="!!item.disabled"
              class="droplist__checkbox"
              (click)="$event.stopPropagation()"
              (ngModelChange)="toggleCheck(item.id)"
            ></fvdr-checkbox>

            <!-- Icon (non-checkbox mode) -->
            <fvdr-icon *ngIf="item.icon && !checkboxes" [name]="item.icon" class="droplist__icon" />

            <span class="droplist__text">
              <span class="droplist__label">{{ item.label }}</span>
              <span *ngIf="item.description" class="droplist__desc">{{ item.description }}</span>
            </span>

            <span *ngIf="item.rightText && !checkboxes && !item.children" class="droplist__right">{{ item.rightText }}</span>
            <span *ngIf="item.badge" class="droplist__badge">{{ item.badge }}</span>
            <fvdr-icon *ngIf="item.children?.length" name="chevron-right" class="droplist__cascade-arrow" />
            <fvdr-icon *ngIf="!checkboxes && !item.children?.length && activeId === item.id && !item.description" name="check" class="droplist__check" />
          </button>
          <div *ngIf="item.dividerAfter" class="droplist__divider"></div>
        </ng-container>
      </div>

      <!-- Cascade submenu -->
      <div
        *ngIf="activeChildItem"
        class="droplist__submenu"
        [style.top.px]="submenuTop"
        (mouseenter)="cancelClose()"
        (mouseleave)="scheduleClose()"
      >
        <fvdr-droplist
          [items]="activeChildItem.children!"
          [activeId]="activeId"
          [minWidth]="minWidth"
          (itemClick)="itemClick.emit($event)"
        ></fvdr-droplist>
      </div>
    </div>
  `,
  styles: [`
    .droplist-wrap {
      position: relative;
      display: inline-block;
    }

    .droplist {
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      padding: var(--space-1) 0;
      overflow: hidden;
    }

    .droplist__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      height: 40px;
      padding: 0 var(--space-4);
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
    .droplist__item--checked { background: var(--color-primary-50); }
    .droplist__item--cascade-open { background: var(--color-hover-bg); }
    .droplist__item--with-desc { height: auto; padding: var(--space-2) var(--space-4); align-items: flex-start; }

    .droplist__checkbox { flex-shrink: 0; pointer-events: none; }

    .droplist__icon { font-size: 16px; color: var(--color-stone-600); flex-shrink: 0; margin-top: 2px; }
    .droplist__item--danger .droplist__icon { color: var(--color-error-600); }

    .droplist__text { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
    .droplist__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .droplist__desc {
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: normal;
    }

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
    .droplist__cascade-arrow { font-size: 14px; color: var(--color-text-secondary); margin-left: auto; flex-shrink: 0; }

    .droplist__divider {
      height: 1px;
      background: var(--color-divider);
      margin: var(--space-1) 0;
    }

    /* Cascade submenu */
    .droplist__submenu {
      position: absolute;
      left: calc(100% + 2px);
      z-index: 1001;
    }
  `],
})
export class DroplistComponent {
  @Input() items: DroplistItem[] = [];
  @Input() activeId = '';
  @Input() minWidth = 280;
  @Input() checkboxes = false;
  @Input() selectedIds: string[] = [];
  @Output() itemClick = new EventEmitter<DroplistItem>();
  @Output() selectionChange = new EventEmitter<string[]>();

  hoveredChildId = '';
  submenuTop = 0;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  get activeChildItem(): DroplistItem | undefined {
    return this.items.find(i => i.id === this.hoveredChildId);
  }

  onItemEnter(item: DroplistItem, event: MouseEvent): void {
    this.cancelClose();
    if (item.children?.length) {
      const btn = event.currentTarget as HTMLElement;
      this.submenuTop = btn.offsetTop;
      this.hoveredChildId = item.id;
    } else {
      this.hoveredChildId = '';
    }
  }

  scheduleClose(): void {
    this.closeTimer = setTimeout(() => { this.hoveredChildId = ''; }, 180);
  }

  cancelClose(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  isChecked(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  toggleCheck(id: string): void {
    const next = this.isChecked(id)
      ? this.selectedIds.filter(s => s !== id)
      : [...this.selectedIds, id];
    this.selectedIds = next;
    this.selectionChange.emit(next);
  }

  onItemClick(item: DroplistItem): void {
    if (item.disabled) return;
    if (item.children?.length) return; // handled by hover
    if (this.checkboxes) {
      this.toggleCheck(item.id);
    } else {
      this.itemClick.emit(item);
    }
  }
}
