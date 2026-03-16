import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextareaState = 'default' | 'error' | 'disabled';

/**
 * DS Input / Text area — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12204
 *
 * DS specs:
 *   Min-height: 80px
 *   Border: 1.5px #DEE0EB, focus #2C9C74, error #E54430
 *   Bg: #F7F7F7 default, #FFFFFF focus
 *   Radius: 4px
 *   Resize: vertical only
 *
 * Usage:
 *   <fvdr-textarea label="Description" placeholder="Enter text..." [(ngModel)]="text" />
 *   <fvdr-textarea label="Notes" [rows]="6" />
 */
@Component({
  selector: 'fvdr-textarea',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true },
  ],
  template: `
    <div class="field" [class.field--error]="state === 'error'" [class.field--disabled]="state === 'disabled'">
      <label *ngIf="label" class="field__label">{{ label }}<span *ngIf="required" class="field__required"> *</span></label>
      <textarea
        class="field__textarea"
        [class.field__textarea--focused]="focused"
        [placeholder]="placeholder"
        [disabled]="state === 'disabled'"
        [rows]="rows"
        [maxlength]="maxlength || null"
        (input)="onInput($event)"
        (focus)="focused = true"
        (blur)="focused = false; onTouched()"
      >{{ value }}</textarea>
      <div *ngIf="maxlength" class="field__counter">{{ value.length }} / {{ maxlength }}</div>
      <span *ngIf="state === 'error' && errorText" class="field__helper field__helper--error">{{ errorText }}</span>
      <span *ngIf="state !== 'error' && helperText" class="field__helper">{{ helperText }}</span>
    </div>
  `,
  styles: [`
    .field { display: flex; flex-direction: column; gap: var(--space-1); }

    .field__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      line-height: var(--text-caption2-lh);
      color: var(--color-text-secondary);
    }
    .field__required { color: var(--color-error-600); }

    .field__textarea {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
      background: var(--color-stone-200);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      resize: vertical;
      min-height: 80px;
      width: 100%;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s, background 0.15s;
    }
    .field__textarea::placeholder { color: var(--color-text-placeholder); }
    .field__textarea--focused,
    .field__textarea:focus {
      background: var(--color-stone-0);
      border-color: var(--color-primary-500);
    }
    .field--error .field__textarea { border-color: var(--color-error-600); }
    .field--disabled .field__textarea { opacity: 0.45; cursor: not-allowed; }

    .field__counter {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      text-align: right;
    }
    .field__helper {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      line-height: var(--text-caption1-lh);
      color: var(--color-text-secondary);
    }
    .field__helper--error { color: var(--color-error-600); }
  `],
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() rows = 4;
  @Input() state: TextareaState = 'default';
  @Input() required = false;
  @Input() helperText = '';
  @Input() errorText = '';
  @Input() maxlength?: number;

  value = '';
  focused = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event): void {
    this.value = (e.target as HTMLTextAreaElement).value;
    this.onChange(this.value);
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.state = d ? 'disabled' : 'default'; }
}
