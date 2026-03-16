import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

/**
 * DS Chips — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13859
 *
 * DS specs:
 *   Height: 28px
 *   Padding: 0 8px
 *   Radius: full (14px)
 *   Border: 1.5px
 *   Variants: default (stone), primary (green), success, warning, error
 *   Removable: × button right side
 *   Clickable/selectable state
 *
 * Usage:
 *   <fvdr-chip label="React" />
 *   <fvdr-chip label="Angular" variant="primary" [removable]="true" (removed)="onRemove()" />
 *   <fvdr-chip label="Active" [selected]="true" (clicked)="toggle()" />
 */
@Component({
  selector: 'fvdr-chip',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span
      class="chip chip--{{ variant }}"
      [class.chip--selected]="selected"
      [class.chip--clickable]="clickable || clicked.observers.length > 0"
      (click)="onClick()"
    >
      <fvdr-icon *ngIf="icon" [name]="icon" class="chip__icon" />
      <span class="chip__label">{{ label }}</span>
      <button *ngIf="removable" class="chip__remove" (click)="onRemove($event)">
        <fvdr-icon name="close" />
      </button>
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 var(--space-2);
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-stone-400);
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      line-height: 1;
      color: var(--color-text-secondary);
      user-select: none;
      transition: all 0.15s;
    }
    .chip--clickable { cursor: pointer; }
    .chip--clickable:hover { border-color: var(--color-primary-500); color: var(--color-primary-500); }

    /* Variants */
    .chip--primary { border-color: var(--color-primary-500); color: var(--color-primary-500); background: var(--color-primary-50); }
    .chip--success { border-color: var(--color-success-border); color: var(--color-success-icon); background: var(--color-success-bg); }
    .chip--warning { border-color: var(--color-warning-border); color: var(--color-warning-700); background: var(--color-warning-bg); }
    .chip--error   { border-color: var(--color-error-border);   color: var(--color-error-600);   background: var(--color-error-bg); }

    .chip--selected {
      background: var(--color-primary-50);
      border-color: var(--color-primary-500);
      color: var(--color-primary-500);
    }

    .chip__icon { font-size: 12px; }
    .chip__label { white-space: nowrap; }

    .chip__remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: inherit;
      opacity: 0.7;
      font-size: 10px;
    }
    .chip__remove:hover { opacity: 1; }
  `],
})
export class ChipComponent {
  @Input() label = '';
  @Input() variant: ChipVariant = 'default';
  @Input() selected = false;
  @Input() removable = false;
  @Input() clickable = false;
  @Input() icon?: FvdrIconName;
  @Output() clicked = new EventEmitter<void>();
  @Output() removed = new EventEmitter<void>();

  onClick(): void { this.clicked.emit(); }
  onRemove(e: Event): void { e.stopPropagation(); this.removed.emit(); }
}
