import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';
import { CounterComponent } from '../counter/counter.component';

export interface SegmentItem {
  id: string;
  label?: string;
  icon?: FvdrIconName;
  count?: number;
  disabled?: boolean;
}

export type SegmentVariant = 'primary' | 'table';
export type SegmentSize = 'sm' | 'md' | 'mobile';

/**
 * DS Segment controls — Figma: liyNDiFf1piO8SQmHNKoeU, node 18667-538
 *
 * Two variants:
 *
 * variant="primary"  (default) — Full-color toggle:
 *   Active: bg #2C9C74 (primary-500), white text, border primary-500
 *   Inactive: bg #F7F7F7 (stone-200), dark text
 *   Hover inactive: bg #ECEEF9 (stone-300)
 *   Height: auto (py-8px px-16px)
 *
 * variant="table" — Outlined segment tabs (for table filtering):
 *   S size: 28px height, px-12px
 *   M size: 40px height, px-16px
 *   Mobile: 32px height, px-12px
 *   Active: bg primary-highlight (#EBF8EF), border primary-500
 *   Inactive: bg white, border devider (#DEE0EB)
 *   Supports: icon (FvdrIconName), label, count (badge)
 *   Left item: rounded tl/bl-4px
 *   Middle items: top+bottom border only
 *   Right item: rounded tr/br-4px
 *
 * Usage:
 *   <!-- Primary toggle -->
 *   <fvdr-segment [items]="tabs" [(activeId)]="active" />
 *
 *   <!-- Table tabs with icon+label+counter -->
 *   <fvdr-segment variant="table" size="sm"
 *     [items]="[{id:'a', icon:'documents', label:'Documents', count:12}, ...]"
 *     [(activeId)]="active" />
 */
@Component({
  selector: 'fvdr-segment',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <!-- ── Primary variant ─────────────────────────────────── -->
    <div *ngIf="variant === 'primary'" class="seg-primary">
      <button
        *ngFor="let item of items; let first = first; let last = last"
        class="seg-primary__item"
        [class.seg-primary__item--active]="activeId === item.id"
        [class.seg-primary__item--first]="first"
        [class.seg-primary__item--last]="last"
        [disabled]="item.disabled"
        (click)="!item.disabled && select(item.id)"
      >
        <fvdr-icon *ngIf="item.icon" [name]="item.icon" class="seg-primary__icon" />
        <span *ngIf="item.label">{{ item.label }}</span>
      </button>
    </div>

    <!-- ── Table variant ────────────────────────────────────── -->
    <div *ngIf="variant === 'table'" class="seg-table seg-table--{{ size }}">
      <button
        *ngFor="let item of items; let i = index; let first = first; let last = last"
        class="seg-table__item"
        [class.seg-table__item--active]="activeId === item.id"
        [class.seg-table__item--first]="first"
        [class.seg-table__item--last]="last"
        [class.seg-table__item--middle]="!first && !last"
        [disabled]="item.disabled"
        (click)="!item.disabled && select(item.id)"
      >
        <fvdr-icon *ngIf="item.icon" [name]="item.icon" class="seg-table__icon" />
        <span *ngIf="item.label" class="seg-table__label">{{ item.label }}</span>
        <span *ngIf="item.count !== undefined" class="seg-table__counter">{{ item.count }}</span>
      </button>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════
       PRIMARY VARIANT
    ═══════════════════════════════════════════════════════ */
    .seg-primary {
      display: inline-flex;
      align-items: stretch;
    }

    .seg-primary__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 1.5px solid transparent;
      background: var(--color-stone-200);
      font-family: var(--font-family);
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
      line-height: var(--text-base-m-lh);
    }
    .seg-primary__item--first {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    .seg-primary__item--last {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    .seg-primary__item:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Active: solid green */
    .seg-primary__item--active {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
      color: #ffffff;
    }

    /* Hover on inactive */
    .seg-primary__item:not(.seg-primary__item--active):not(:disabled):hover {
      background: var(--color-stone-300);
    }

    .seg-primary__icon { font-size: 16px; }


    /* ═══════════════════════════════════════════════════════
       TABLE VARIANT
    ═══════════════════════════════════════════════════════ */
    .seg-table {
      display: inline-flex;
      align-items: center;
    }

    .seg-table__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: 0 var(--space-3);
      height: 28px;                          /* S size default */
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
      line-height: var(--text-base-s-lh);
      position: relative;
    }
    .seg-table__item:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Left corner radius */
    .seg-table__item--first {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    /* Right corner radius */
    .seg-table__item--last {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    /* Middle items: only top/bottom border, pull left to avoid double borders */
    .seg-table__item--middle {
      border-left: none;
      border-right: none;
      border-radius: 0;
    }
    /* Prevent double border: last item's left removed when not active */
    .seg-table__item--last:not(.seg-table__item--active) {
      border-left: none;
    }

    /* Active: light green highlight + green border */
    .seg-table__item--active {
      background: var(--color-primary-50);   /* #EBF8EF */
      border: 1.5px solid var(--color-primary-500) !important;
      color: var(--color-text-primary);
      z-index: 1;
    }
    .seg-table__item:not(.seg-table__item--active):not(:disabled):hover {
      background: var(--color-stone-100);
    }

    /* M size */
    .seg-table--md .seg-table__item {
      height: 40px;
      padding: 0 var(--space-4);
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      line-height: var(--text-base-m-lh);
    }
    /* Mobile size */
    .seg-table--mobile .seg-table__item {
      height: 32px;
      padding: 0 var(--space-3);
    }

    .seg-table__icon { font-size: 16px; flex-shrink: 0; }
    .seg-table__label { flex-shrink: 0; }

    /* Counter badge */
    .seg-table__counter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 var(--space-1);
      border-radius: 16px;
      background: var(--color-stone-300);
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      color: var(--color-text-primary);
      line-height: 1;
    }
    .seg-table__item--active .seg-table__counter {
      background: var(--color-primary-100);
    }
  `],
})
export class SegmentComponent {
  @Input() items: SegmentItem[] = [];
  @Input() activeId = '';
  @Input() variant: SegmentVariant = 'primary';
  @Input() size: SegmentSize = 'sm';
  @Output() activeIdChange = new EventEmitter<string>();

  select(id: string): void {
    this.activeId = id;
    this.activeIdChange.emit(id);
  }
}
