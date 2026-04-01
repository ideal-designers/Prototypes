import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface TimeValue { hours: number; minutes: number; }

/**
 * DS Input / Time picker — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12265
 *
 * DS specs:
 *   Height: 40px, same as Input
 *   HH:MM format with stepper arrows
 *   Hours: 00–23, Minutes: 00–59
 *   Clock icon right side
 *
 * Usage:
 *   <fvdr-timepicker label="Start time" [(ngModel)]="time" />
 */
@Component({
  selector: 'fvdr-timepicker',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimepickerComponent), multi: true },
  ],
  template: `
    <div class="tp" [class.tp--disabled]="disabled">
      <label *ngIf="label" class="tp__label">{{ label }}</label>
      <div class="tp__wrapper" [class.tp__wrapper--focused]="focused">
        <div class="tp__segment">
          <button class="tp__step" (click)="step('h', 1)"><fvdr-icon name="chevron-up" /></button>
          <input
            class="tp__input"
            type="number"
            min="0" max="23"
            [value]="pad(hours)"
            (input)="onHours($event)"
            (focus)="focused = true"
            (blur)="focused = false"
          />
          <button class="tp__step" (click)="step('h', -1)"><fvdr-icon name="chevron-down" /></button>
        </div>
        <span class="tp__sep">:</span>
        <div class="tp__segment">
          <button class="tp__step" (click)="step('m', 1)"><fvdr-icon name="chevron-up" /></button>
          <input
            class="tp__input"
            type="number"
            min="0" max="59"
            [value]="pad(minutes)"
            (input)="onMinutes($event)"
            (focus)="focused = true"
            (blur)="focused = false"
          />
          <button class="tp__step" (click)="step('m', -1)"><fvdr-icon name="chevron-down" /></button>
        </div>
        <fvdr-icon name="clock" class="tp__icon" />
      </div>
    </div>
  `,
  styles: [`
    .tp { display: flex; flex-direction: column; gap: var(--space-1); }
    .tp--disabled { opacity: 0.45; pointer-events: none; }

    .tp__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .tp__wrapper {
      display: inline-flex;
      align-items: center;
      height: 40px;
      padding: 0 var(--space-3);
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      gap: var(--space-1);
      transition: border-color 0.15s;
    }
    .tp__wrapper--focused { border-color: var(--color-primary-500); background: var(--color-stone-0); }

    .tp__segment { display: flex; flex-direction: column; align-items: center; }
    .tp__step {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 12px; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: 10px; padding: 0;
    }
    .tp__step:hover { color: var(--color-primary-500); }

    .tp__input {
      width: 28px;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      text-align: center;
      -moz-appearance: textfield;
    }
    .tp__input::-webkit-inner-spin-button,
    .tp__input::-webkit-outer-spin-button { -webkit-appearance: none; }

    .tp__sep {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-secondary);
    }
    .tp__icon { font-size: 16px; color: var(--color-text-secondary); margin-left: var(--space-2); }
  `],
})
export class TimepickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() disabled = false;

  hours = 0;
  minutes = 0;
  focused = false;

  private onChange: (v: TimeValue) => void = () => {};
  private onTouched: () => void = () => {};

  pad(n: number): string { return String(n).padStart(2, '0'); }

  step(type: 'h' | 'm', dir: number): void {
    if (type === 'h') { this.hours = (this.hours + dir + 24) % 24; }
    else { this.minutes = (this.minutes + dir + 60) % 60; }
    this.emit();
  }

  onHours(e: Event): void {
    this.hours = Math.min(23, Math.max(0, +(e.target as HTMLInputElement).value || 0));
    this.emit();
  }

  onMinutes(e: Event): void {
    this.minutes = Math.min(59, Math.max(0, +(e.target as HTMLInputElement).value || 0));
    this.emit();
  }

  private emit(): void { this.onChange({ hours: this.hours, minutes: this.minutes }); }

  writeValue(v: TimeValue): void { if (v) { this.hours = v.hours; this.minutes = v.minutes; } }
  registerOnChange(fn: (v: TimeValue) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
