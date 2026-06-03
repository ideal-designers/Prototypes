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
      color: var(--color-stone-0, #ffffff);
    }

    /* Hover on inactive */
    .seg-primary__item:not(.seg-primary__item--active):not(:disabled):hover {
      background: var(--color-stone-300);
    }

    .seg-primary__icon { font-size: var(--font-size-lg, 16px); }


    /* ═══════════════════════════════════════════════════════
       TABLE VARIANT
    ═══════════════════════════════════════════════════════ */
    .seg-table {
      display: inline-flex;
      align-items: center;
    }

    /* ── Base item (sm = 28px default) ── */
    .seg-table__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: 0 var(--space-3);
      height: 28px;
      background: var(--color-stone-0, #ffffff);
      border: 1px solid var(--color-divider, #dee0eb);
      border-radius: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      line-height: 20px;
      font-weight: 400;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
      position: relative;
      z-index: 0;
    }
    .seg-table__item:disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── Border shape: first / middle / last ── */
    .seg-table__item--first {
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);  /* 4px 0 0 4px */
    }
    .seg-table__item--last {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;  /* 0 4px 4px 0 */
    }
    /* Middle items: suppress left + right borders to avoid doubles */
    .seg-table__item--middle {
      border-left: none;
      border-right: none;
      border-radius: 0;
    }

    /* ── Hover (inactive items only): full green border on all 4 sides ── */
    .seg-table__item:not(.seg-table__item--active):not(:disabled):hover {
      border: 1px solid var(--color-primary-500, #2c9c74) !important;
      z-index: 2;
    }
    .seg-table__item:not(.seg-table__item--active):not(:disabled):hover .seg-table__icon {
      color: var(--color-primary-500, #2c9c74);
    }
    /* Prevent double border: last item active — overlap prev item's right border */
    .seg-table__item--last.seg-table__item--active {
      margin-left: -1px;
    }

    /* ── Active state: green highlight + full green border ── */
    .seg-table__item--active {
      background: var(--color-primary-50, #eaf6ed);
      border: 1px solid var(--color-primary-500, #2c9c74) !important;
      color: var(--color-text-primary);
      z-index: 1;
    }
    .seg-table__item--active .seg-table__icon {
      color: var(--color-primary-500, #2c9c74);
    }
    /* Override middle-item border suppression when active */
    .seg-table__item--middle.seg-table__item--active {
      border-left: 1px solid var(--color-primary-500, #2c9c74) !important;
      border-right: 1px solid var(--color-primary-500, #2c9c74) !important;
    }

    /* ── Icon colors ── */
    .seg-table__icon {
      font-size: var(--font-size-lg, 16px);
      flex-shrink: 0;
      color: var(--color-stone-600, #9c9ea8);
    }
    .seg-table__item--active .seg-table__icon {
      color: var(--color-primary-500, #2c9c74);
    }

    .seg-table__label { flex-shrink: 0; }

    /* ── Counter pill ── */
    .seg-table__counter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7.5px;
      border-radius: 16px;
      background: var(--color-stone-300, #eceef9);
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      line-height: 20px;
      font-weight: 400;
      color: var(--color-text-primary);
    }

    /* ── Size: md (40px) ── */
    .seg-table--md .seg-table__item {
      height: 40px;
      padding: 0 var(--space-4);               /* 0 16px */
      font-size: var(--font-size-md, 15px);
      line-height: 24px;
      gap: var(--space-2);                     /* 8px */
    }

    /* ── Size: mobile (32px) ── */
    .seg-table--mobile .seg-table__item {
      height: 32px;
      padding: 0 var(--space-3);               /* 0 12px */
      font-size: var(--font-size-base, 14px);
      line-height: 20px;
      gap: var(--space-1);                     /* 4px */
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
