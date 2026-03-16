import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

/**
 * DS Special controls — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-7631
 *
 * Includes:
 *   - Number Stepper (increment/decrement with +/- buttons)
 *   - Range/Slider input
 *   - Star Rating
 *   - Progress bar
 */

// ─── Number Stepper ───────────────────────────────────────────────────────────
@Component({
  selector: 'fvdr-number-stepper',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberStepperComponent), multi: true },
  ],
  template: `
    <div class="stepper" [class.stepper--disabled]="disabled">
      <label *ngIf="label" class="stepper__label">{{ label }}</label>
      <div class="stepper__wrapper">
        <button class="stepper__btn" [disabled]="disabled || value <= min" (click)="decrement()">
          <fvdr-icon name="minus" />
        </button>
        <input
          class="stepper__input"
          type="number"
          [min]="min" [max]="max" [step]="step"
          [value]="value"
          [disabled]="disabled"
          (input)="onInput($event)"
        />
        <button class="stepper__btn" [disabled]="disabled || value >= max" (click)="increment()">
          <fvdr-icon name="plus" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .stepper { display: flex; flex-direction: column; gap: var(--space-1); }
    .stepper--disabled { opacity: 0.45; }
    .stepper__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }
    .stepper__wrapper {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--color-stone-200);
      height: 40px;
    }
    .stepper__btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 100%; border: none;
      background: transparent; cursor: pointer;
      color: var(--color-text-secondary); font-size: 14px;
      transition: background 0.1s;
    }
    .stepper__btn:hover:not(:disabled) { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .stepper__btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .stepper__input {
      flex: 1; min-width: 48px; border: none; border-left: 1px solid var(--color-stone-400); border-right: 1px solid var(--color-stone-400);
      background: var(--color-stone-0); font-family: var(--font-family); font-size: var(--text-base-s-size);
      color: var(--color-text-primary); text-align: center; outline: none; padding: 0; height: 100%;
      -moz-appearance: textfield;
    }
    .stepper__input::-webkit-inner-spin-button, .stepper__input::-webkit-outer-spin-button { -webkit-appearance: none; }
  `],
})
export class NumberStepperComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() disabled = false;
  value = 0;
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};
  increment(): void { this.set(this.value + this.step); }
  decrement(): void { this.set(this.value - this.step); }
  onInput(e: Event): void { this.set(+(e.target as HTMLInputElement).value); }
  private set(v: number): void { this.value = Math.min(this.max, Math.max(this.min, v)); this.onChange(this.value); this.onTouched(); }
  writeValue(v: number): void { this.value = v ?? 0; }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
@Component({
  selector: 'fvdr-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress">
      <div class="progress__header" *ngIf="label || showValue">
        <span *ngIf="label" class="progress__label">{{ label }}</span>
        <span *ngIf="showValue" class="progress__value">{{ value }}%</span>
      </div>
      <div class="progress__track">
        <div class="progress__fill progress__fill--{{ variant }}" [style.width.%]="value"></div>
      </div>
    </div>
  `,
  styles: [`
    .progress { display: flex; flex-direction: column; gap: var(--space-1); }
    .progress__header { display: flex; justify-content: space-between; align-items: center; }
    .progress__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }
    .progress__value { font-family: var(--font-family); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .progress__track {
      height: 8px;
      background: var(--color-stone-300);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress__fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
    .progress__fill--default { background: var(--color-primary-500); }
    .progress__fill--success { background: var(--color-primary-500); }
    .progress__fill--warning { background: var(--color-warning-600); }
    .progress__fill--error   { background: var(--color-error-600); }
  `],
})
export class ProgressComponent {
  @Input() value = 0; // 0-100
  @Input() label = '';
  @Input() showValue = false;
  @Input() variant: 'default' | 'success' | 'warning' | 'error' = 'default';
}

// ─── Range Slider ─────────────────────────────────────────────────────────────
@Component({
  selector: 'fvdr-range',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RangeComponent), multi: true },
  ],
  template: `
    <div class="range" [class.range--disabled]="disabled">
      <label *ngIf="label" class="range__label">{{ label }}<span *ngIf="showValue" class="range__val">{{ value }}</span></label>
      <input
        class="range__input"
        type="range"
        [min]="min" [max]="max" [step]="step"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        [style.--pct]="pct + '%'"
      />
    </div>
  `,
  styles: [`
    .range { display: flex; flex-direction: column; gap: var(--space-2); }
    .range--disabled { opacity: 0.45; }
    .range__label {
      display: flex; justify-content: space-between;
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }
    .range__val { color: var(--color-text-primary); font-weight: var(--text-base-s-sb-weight); }
    .range__input {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 4px; border-radius: 2px;
      background: linear-gradient(to right, var(--color-primary-500) var(--pct, 0%), var(--color-stone-300) var(--pct, 0%));
      outline: none; cursor: pointer;
    }
    .range__input::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--color-stone-0);
      border: 2px solid var(--color-primary-500);
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      cursor: pointer;
    }
    .range__input:disabled { cursor: not-allowed; }
  `],
})
export class RangeComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() disabled = false;
  @Input() showValue = true;
  value = 0;
  get pct(): number { return ((this.value - this.min) / (this.max - this.min)) * 100; }
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};
  onInput(e: Event): void { this.value = +(e.target as HTMLInputElement).value; this.onChange(this.value); this.onTouched(); }
  writeValue(v: number): void { this.value = v ?? 0; }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
