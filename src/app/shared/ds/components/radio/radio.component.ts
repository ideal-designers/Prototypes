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
    <div class="radio-group radio-group--{{ layout }}">
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

    .radio-circle {
      width: 18px;
      height: 18px;
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
      width: 8px;
      height: 8px;
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
  `],
})
export class RadioComponent {
  @Input() options: RadioOption[] = [];
  @Input() value = '';
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  @Output() valueChange = new EventEmitter<string>();

  select(val: string): void {
    this.value = val;
    this.valueChange.emit(val);
  }
}
