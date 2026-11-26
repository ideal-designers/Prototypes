import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextareaState = 'default' | 'error' | 'disabled';
export type TextareaSize = 's' | 'm' | 'l';

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
    <!-- Read only (Figma State=Read only): label + the full text, no box -->
    <div *ngIf="readonly; else editable" class="field field--{{ size }}">
      <span *ngIf="label" class="field__label">{{ label }}</span>
      <p class="field__value">{{ value || '—' }}</p>
    </div>

    <ng-template #editable>
    <div class="field field--{{ size }}" [class.field--error]="state === 'error'" [class.field--disabled]="state === 'disabled'">
      <label *ngIf="label" class="field__label">{{ label }}<span *ngIf="required" class="field__required"> *</span></label>
      <textarea
        class="field__textarea"
        [class.field__textarea--focused]="focused"
        [placeholder]="placeholder"
        [disabled]="state === 'disabled'"
        [rows]="rows"
        [attr.maxlength]="maxlength || null"
        (input)="onInput($event)"
        (focus)="focused = true"
        (blur)="focused = false; onTouched()"
      >{{ value }}</textarea>
      <div *ngIf="maxlength" class="field__counter">{{ value.length }} / {{ maxlength }}</div>
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

    .field__textarea {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
      background: var(--color-stone-0);
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
    /* Sizes — Figma S 14/20 pad 8·12 · M 15/24 pad 8·16 · L 16/24 pad 8·16 */
    .field--m .field__textarea { font-size: var(--text-base-m-size); line-height: var(--text-base-m-lh); padding: var(--space-2) var(--space-4); }
    .field--l .field__textarea { font-size: var(--text-base-l-size); line-height: var(--text-base-l-lh); padding: var(--space-2) var(--space-4); }

    .field__value {
      margin: 0;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .field--m .field__value { font-size: var(--text-base-m-size); line-height: var(--text-base-m-lh); }
    .field--l .field__value { font-size: var(--text-base-l-size); line-height: var(--text-base-l-lh); }

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
  /** s — 14px (default) · m — 15px · l — 16px; match the inputs next to it. */
  @Input() size: TextareaSize = 's';
  /** Figma State=Read only: the text under the label, with no box. */
  @Input() readonly = false;

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
