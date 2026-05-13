import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * DS Checkbox — Figma: ↳ Checkboxes ✍🏻 (liyNDiFf1piO8SQmHNKoeU, page 15023:113852)
 *
 * DS specs:
 *   Size: 16×16px, border-radius 1px
 *   States:
 *     unselected → border 1.5px #DEE0EB, bg #FFFFFF
 *     selected   → bg #2C9C74, border #2C9C74
 *     hover+sel  → bg #1C8269
 *     mid (indeterminate) → bg #2C9C74 with dash
 *     disabled   → opacity 0.45
 *   Label: UI/Base Component S → 14px w400 #1F2129
 *
 * Usage:
 *   <fvdr-checkbox label="Accept terms" [(checked)]="accepted" />
 *   <fvdr-checkbox label="Partial" [indeterminate]="true" />
 *   <fvdr-checkbox label="Locked" [disabled]="true" />
 *
 * Or with ngModel (implements ControlValueAccessor):
 *   <fvdr-checkbox label="Option" [(ngModel)]="value" />
 */
@Component({
  selector: 'fvdr-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true },
  ],
  template: `
    <label
      class="checkbox-wrapper"
      [class.disabled]="disabled"
      (click)="!disabled && toggle()"
    >
      <span
        class="checkbox-box"
        [class.checked]="checked"
        [class.indeterminate]="indeterminate && !checked"
        [class.disabled]="disabled"
      >
        <!-- Checkmark -->
        <svg *ngIf="checked && !indeterminate" width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Dash (indeterminate/mid) -->
        <svg *ngIf="indeterminate && !checked" width="8" height="2" viewBox="0 0 8 2" fill="none">
          <path d="M1 1h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>
      <span *ngIf="label" class="checkbox-label">{{ label }}</span>
      <ng-content></ng-content>
    </label>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }

    .checkbox-wrapper {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      user-select: none;
    }
    .checkbox-wrapper.disabled { cursor: not-allowed; opacity: 0.45; }

    /* DS: 16×16px, radius 1px */
    .checkbox-box {
      width: var(--checkbox-size);   /* 16px */
      height: var(--checkbox-size);  /* 16px */
      border-radius: var(--checkbox-radius); /* 1px */
      border: 1.5px solid var(--color-stone-400); /* unselected: #DEE0EB */
      background: var(--color-stone-0);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, border-color 0.15s;
    }

    /* DS: Property 2=selected → bg #2C9C74 */
    .checkbox-box.checked {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }
    /* DS: Property 2=mid (indeterminate) */
    .checkbox-box.indeterminate {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }

    .checkbox-wrapper:not(.disabled):hover .checkbox-box.checked {
      background: var(--color-primary-600);   /* DS: hover+selected #1C8269 */
      border-color: var(--color-primary-600);
    }
    .checkbox-wrapper:not(.disabled):hover .checkbox-box:not(.checked):not(.indeterminate) {
      border-color: var(--color-primary-500);
    }

    /* DS: Label → UI/Base Component S 14px w400 */
    .checkbox-label {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
    }
  `],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    this.checked = !this.checked;
    this.indeterminate = false;
    this.checkedChange.emit(this.checked);
    this.onChange(this.checked);
    this.onTouched();
  }

  writeValue(v: boolean): void { this.checked = !!v; }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
