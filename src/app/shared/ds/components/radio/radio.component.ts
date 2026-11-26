import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * DS Radio button — Figma: liyNDiFf1piO8SQmHNKoeU, node 15851-7241
 *
 * DS specs:
 *   Size: 18×18px outer, 8×8px inner dot
 *   Border: 1.5px #DEE0EB unselected, #2C9C74 selected
 *   Selected inner dot: #2C9C74
 *   Disabled: opacity 0.45
 *   Label: 14px w400 #1F2129
 *   Vertical or horizontal group
 *
 * Usage:
 *   <fvdr-radio [options]="options" [(value)]="selected" />
 *   <fvdr-radio [options]="options" layout="horizontal" [(value)]="val" />
 */
@Component({
  selector: 'fvdr-radio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="radio-group radio-group--{{ layout }} radio-group--{{ size }}">
      <label
        *ngFor="let opt of options"
        class="radio-item"
        [class.radio-item--disabled]="opt.disabled"
        (click)="!opt.disabled && select(opt.value)"
      >
        <span class="radio-circle" [class.radio-circle--checked]="value === opt.value">
          <span *ngIf="value === opt.value" class="radio-dot"></span>
        </span>
        <span class="radio-label">{{ opt.label }}</span>
      </label>
    </div>
  `,
  styles: [`
    .radio-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .radio-group--horizontal { flex-direction: row; flex-wrap: wrap; gap: var(--space-4); }

    .radio-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      user-select: none;
    }
    .radio-item--disabled { opacity: 0.45; cursor: not-allowed; }

    /* Figma: 16px circle, 6px dot in every size */
    .radio-circle {
      width: var(--space-4);
      height: var(--space-4);
      border-radius: 50%;
      border: 1.5px solid var(--color-stone-400);
      background: var(--color-stone-0);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.15s;
    }
    .radio-circle--checked { border-color: var(--color-primary-500); }
    .radio-item:not(.radio-item--disabled):hover .radio-circle { border-color: var(--color-primary-500); }

    .radio-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary-500);
    }

    .radio-label {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
    }

    /* Sizes — Figma S 14/20 · M 15/24 · L 16/24 */
    .radio-group--m .radio-label { font-size: var(--text-base-m-size); line-height: var(--text-base-m-lh); }
    .radio-group--l .radio-label { font-size: var(--text-base-l-size); line-height: var(--text-base-l-lh); }
  `],
})
export class RadioComponent {
  @Input() options: RadioOption[] = [];
  @Input() value = '';
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  /** s — 14px label (default) · m — 15px · l — 16px; match the fields around it. */
  @Input() size: 's' | 'm' | 'l' = 's';
  @Output() valueChange = new EventEmitter<string>();

  select(val: string): void {
    this.value = val;
    this.valueChange.emit(val);
  }
}
