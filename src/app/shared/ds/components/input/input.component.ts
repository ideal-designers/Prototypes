import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export type InputSize = 's' | 'm' | 'l';
export type InputState = 'default' | 'error' | 'success' | 'disabled';

/**
 * DS Input / Text field — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12127
 *
 * DS specs:
 *   Height: S=32px, M=40px, L=48px
 *   Border: 1px #DEE0EB, focus #2C9C74, error #E54430
 *   Bg: #F7F7F7 default, #FFFFFF focus
 *   Radius: 4px
 *   Label: 12px caption above, helper/error text 12px below
 *
 * Usage:
 *   <fvdr-input label="Email" placeholder="Enter email" [(ngModel)]="email" />
 *   <fvdr-input label="Name" state="error" errorText="Required" />
 *   <fvdr-input iconLeft="search" placeholder="Search..." />
 */
@Component({
  selector: 'fvdr-input',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true },
  ],
  template: `
    <!-- Read only (Figma State=Read only): label + value as text, no field box -->
    <div *ngIf="readonly; else editable" class="field field--{{ size }} field--readonly">
      <span *ngIf="label" class="field__label">{{ label }}</span>
      <span class="field__value">{{ value || '—' }}</span>
    </div>

    <ng-template #editable>
    <div class="field field--{{ size }}" [class.field--error]="state === 'error'" [class.field--success]="state === 'success'" [class.field--disabled]="state === 'disabled'">
      <label *ngIf="label" class="field__label">{{ label }}<span *ngIf="required" class="field__required"> *</span></label>
      <div class="field__wrapper" [class.field__wrapper--focused]="focused">
        <fvdr-icon *ngIf="iconLeft" [name]="iconLeft" class="field__icon field__icon--left" />
        <input
          class="field__input"
          [class.field__input--icon-left]="iconLeft"
          [class.field__input--icon-right]="iconRight || state === 'error' || state === 'success'"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="state === 'disabled'"
          [value]="value"
          (input)="onInput($event)"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        />
        <fvdr-icon *ngIf="state === 'error'" name="error" class="field__icon field__icon--right field__icon--state" />
        <fvdr-icon *ngIf="state === 'success'" name="check" class="field__icon field__icon--right field__icon--state field__icon--success" />
        <fvdr-icon *ngIf="iconRight && state === 'default'" [name]="iconRight" class="field__icon field__icon--right" />
      </div>
      <span *ngIf="state === 'error' && errorText" class="field__helper field__helper--error">{{ errorText }}</span>
      <span *ngIf="state !== 'error' && helperText" class="field__helper">{{ helperText }}</span>
    </div>
    </ng-template>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: var(--space-1); }

    .field__label {
      font-family: var(--font-family);
      font-size: var(--text-label-m-size);
      font-weight: var(--text-label-m-weight);
      line-height: var(--text-label-m-lh);
      color: var(--color-text-primary);
    }
    /* Figma: the label scales with the field — Label S / M / L */
    .field--s .field__label { font-size: var(--text-label-s-size); line-height: var(--text-label-s-lh); }
    .field--l .field__label { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); }
    .field__required { color: var(--color-error-600); }

    .field__wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s, background 0.15s;
    }
    .field__wrapper--focused {
      background: var(--color-stone-0);
      border-color: var(--color-primary-500);
    }
    .field--error .field__wrapper { border-color: var(--color-error-600); }
    .field--success .field__wrapper { border-color: var(--color-primary-500); }
    .field--disabled .field__wrapper { opacity: 0.45; cursor: not-allowed; }

    .field__input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      padding: 0 var(--space-3);
      width: 100%;
    }
    .field__input::placeholder { color: var(--color-text-placeholder); }
    .field__input:disabled { cursor: not-allowed; }
    .field__input--icon-left { padding-left: var(--space-8); }
    .field__input--icon-right { padding-right: var(--space-8); }

    /* Sizes */
    .field--s .field__wrapper { height: 32px; }
    .field--s .field__input { font-size: var(--text-base-s-size); }
    .field--m .field__wrapper { height: 40px; }
    .field--m .field__input { font-size: var(--text-base-m-size); padding: 0 var(--space-4); }
    .field--l .field__wrapper { height: 48px; }
    .field--l .field__input { font-size: var(--text-base-l-size); padding: 0 var(--space-4); }
    .field--m .field__input--icon-left, .field--l .field__input--icon-left { padding-left: var(--space-10); }
    .field--m .field__input--icon-right, .field--l .field__input--icon-right { padding-right: var(--space-10); }
    .field--m .field__icon--left, .field--l .field__icon--left { left: var(--space-4); }
    .field--m .field__icon--right, .field--l .field__icon--right { right: var(--space-4); }

    /* Read only — label + value, 8 apart; value in secondary text at the field's size */
    .field--readonly { gap: var(--space-2); }
    .field__value {
      font-family: var(--font-family);
      color: var(--color-text-secondary);
      font-size: var(--text-base-m-size);
      line-height: var(--text-base-m-lh);
      word-break: break-word;
    }
    .field--s .field__value { font-size: var(--text-base-s-size); line-height: var(--text-base-s-lh); }
    .field--l .field__value { font-size: var(--text-base-l-size); line-height: var(--text-base-l-lh); }

    .field__icon {
      position: absolute;
      font-size: var(--font-size-lg, 16px);
      color: var(--color-text-placeholder);
      display: flex;
      align-items: center;
      pointer-events: none;
    }
    .field__icon--left { left: var(--space-3); }
    .field__icon--right { right: var(--space-3); }
    .field__icon--state { color: var(--color-error-600); }
    .field__icon--success { color: var(--color-primary-500); }

    .field__helper {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      line-height: var(--text-caption1-lh);
      color: var(--color-text-secondary);
    }
    .field__helper--error { color: var(--color-error-600); }
  `],
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() size: InputSize = 'm';
  @Input() state: InputState = 'default';
  @Input() required = false;
  @Input() helperText = '';
  @Input() errorText = '';
  @Input() iconLeft?: FvdrIconName;
  @Input() iconRight?: FvdrIconName;
  /** Figma State=Read only: shows the value as text under the label, with no field box. */
  @Input() readonly = false;

  value = '';
  focused = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.state = d ? 'disabled' : 'default'; }
}
