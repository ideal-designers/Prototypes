import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SegmentItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * DS Segment controls — Figma: liyNDiFf1piO8SQmHNKoeU, node 18667-538
 *
 * DS specs:
 *   Height: 36px
 *   Background container: #ECEEF9 (hover-bg)
 *   Active segment: #FFFFFF with shadow
 *   Radius container: 6px, active: 4px
 *   Text: 14px w400, active w600
 *   Gap between items: 2px padding
 *
 * Usage:
 *   <fvdr-segment [items]="items" [(activeId)]="tab" />
 */
@Component({
  selector: 'fvdr-segment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="segment">
      <button
        *ngFor="let item of items"
        class="segment__item"
        [class.segment__item--active]="activeId === item.id"
        [disabled]="item.disabled"
        (click)="!item.disabled && select(item.id)"
      >{{ item.label }}</button>
    </div>
  `,
  styles: [`
    .segment {
      display: inline-flex;
      align-items: center;
      background: var(--color-hover-bg);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }

    .segment__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      padding: 0 var(--space-3);
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .segment__item:disabled { opacity: 0.45; cursor: not-allowed; }
    .segment__item:not(:disabled):hover { color: var(--color-text-primary); }
    .segment__item--active {
      background: var(--color-stone-0);
      color: var(--color-text-primary);
      font-weight: var(--text-base-s-sb-weight);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
  `],
})
export class SegmentComponent {
  @Input() items: SegmentItem[] = [];
  @Input() activeId = '';
  @Output() activeIdChange = new EventEmitter<string>();

  select(id: string): void {
    this.activeId = id;
    this.activeIdChange.emit(id);
  }
}
