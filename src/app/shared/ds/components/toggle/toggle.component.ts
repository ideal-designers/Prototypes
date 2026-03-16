import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * DS Toggle / Switch — Figma: liyNDiFf1piO8SQmHNKoeU, node 15851-7316
 *
 * DS specs:
 *   Track: 36×20px, radius 10px
 *   Thumb: 16×16px, radius 8px, inset 2px
 *   Off: track #DEE0EB, thumb #FFFFFF
 *   On: track #2C9C74, thumb #FFFFFF
 *   Hover off: track #BBBDC8
 *   Hover on: track #1C8269
 *   Disabled: opacity 0.45
 *   Label: 14px w400 right of toggle
 *
 * Usage:
 *   <fvdr-toggle label="Enable notifications" [(checked)]="enabled" />
 *   <fvdr-toggle [(ngModel)]="active" />
 */
@Component({
  selector: 'fvdr-toggle',
  standalone: true,
  imports: [CommonModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ToggleComponent), multi: true },
  ],
  template: `
    <label class="toggle" [class.toggle--disabled]="disabled" (click)="!disabled && toggle()">
      <span class="toggle__track" [class.toggle__track--on]="checked">
        <span class="toggle__thumb"></span>
      </span>
      <span *ngIf="label" class="toggle__label">{{ label }}</span>
    </label>
  `,
  styles: [`
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      user-select: none;
    }
    .toggle--disabled { opacity: 0.45; cursor: not-allowed; }

    .toggle__track {
      position: relative;
      display: inline-flex;
      width: 36px;
      height: 20px;
      border-radius: 10px;
      background: var(--color-stone-400);
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .toggle__track--on { background: var(--color-primary-500); }
    .toggle:not(.toggle--disabled):hover .toggle__track { background: var(--color-stone-500); }
    .toggle:not(.toggle--disabled):hover .toggle__track--on { background: var(--color-primary-600); }

    .toggle__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--color-stone-0);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .toggle__track--on .toggle__thumb { transform: translateX(16px); }

    .toggle__label {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-weight);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
    }
  `],
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
    this.onChange(this.checked);
    this.onTouched();
  }

  writeValue(v: boolean): void { this.checked = !!v; }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
