import {
  Component, Input, Output, EventEmitter, forwardRef,
  HostListener, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

/**
 * DS Time Picker — Figma: liyNDiFf1piO8SQmHNKoeU
 *   Input field:  node 5590-26501
 *   Dropdown list: node 18797-17939
 *   Scroll drum:   node 18828-28537
 *
 * Value: string "HH:MM" (24-hour, e.g. "09:30")
 *
 * Usage:
 *   <fvdr-timepicker label="Start time" [(ngModel)]="time" />
 *   <fvdr-timepicker label="Time" size="l" format="12h" [utc]="true" hint="UTC timezone" [(ngModel)]="time" />
 *   <fvdr-timepicker state="error" errorMessage="Select an upcoming time" [(ngModel)]="time" />
 */
@Component({
  selector: 'fvdr-timepicker',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimepickerComponent), multi: true },
  ],
  template: `
    <div class="tp" [class.tp--disabled]="disabled">

      <!-- Label -->
      <label *ngIf="label" class="tp__label">{{ label }}</label>

      <!-- Field -->
      <div
        class="tp__field"
        [class.tp__field--s]="size === 's'"
        [class.tp__field--m]="size === 'm'"
        [class.tp__field--l]="size === 'l'"
        [class.tp__field--focused]="open"
        [class.tp__field--error]="state === 'error'"
        [class.tp__field--disabled]="disabled"
        (click)="toggle()"
      >
        <!-- UTC badge -->
        <span *ngIf="utc" class="tp__utc">UTC</span>

        <!-- Value or placeholder -->
        <span class="tp__value" [class.tp__value--placeholder]="!value">
          {{ value ? displayValue : 'hh:mm' }}
        </span>

        <!-- Clock icon -->
        <fvdr-icon name="clock" class="tp__icon" />
      </div>

      <!-- Hint / Error -->
      <span *ngIf="state === 'error' && errorMessage" class="tp__error">{{ errorMessage }}</span>
      <span *ngIf="state !== 'error' && hint" class="tp__hint">{{ hint }}</span>

      <!-- Dropdown -->
      <div *ngIf="open" class="tp__dropdown" (click)="$event.stopPropagation()">
        <div
          *ngFor="let slot of slots"
          class="tp__option"
          [class.tp__option--selected]="slot.value === value"
          (click)="select(slot.value)"
        >
          {{ slot.label }}
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }

    .tp { display: flex; flex-direction: column; gap: var(--space-1); }
    .tp--disabled { opacity: 0.45; pointer-events: none; }

    /* Label */
    .tp__label {
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 20px;
    }

    /* Field */
    .tp__field {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-3);
      background: var(--color-bg-page);
      border: 1px solid var(--color-border-input);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: border-color 0.15s;
      user-select: none;
    }

    /* Sizes */
    .tp__field--s { height: 32px; }
    .tp__field--m { height: 40px; }
    .tp__field--l { height: 48px; padding: 0 var(--space-4); }

    /* States */
    .tp__field--focused { border-color: var(--color-interactive-primary); }
    .tp__field--error   { border-color: var(--color-danger); }
    .tp__field--disabled { background: var(--color-bg-surface); cursor: default; }

    /* UTC badge */
    .tp__utc {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }

    /* Value text */
    .tp__value {
      flex: 1;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .tp__value--placeholder { color: var(--color-text-placeholder); }

    /* Clock icon */
    .tp__icon {
      font-size: 16px;
      color: var(--color-text-placeholder);
      flex-shrink: 0;
    }

    /* Hint / Error */
    .tp__hint {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: 18px;
    }
    .tp__error {
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      color: var(--color-danger);
      line-height: 18px;
    }

    /* Dropdown */
    .tp__dropdown {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 4px);
      background: var(--color-bg-page);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      max-height: 216px;
      overflow-y: auto;
      z-index: 200;
      scrollbar-width: none;
    }
    .tp__dropdown::-webkit-scrollbar { display: none; }

    /* Option */
    .tp__option {
      display: flex;
      align-items: center;
      height: 36px;
      padding: 0 var(--space-3);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.1s;
    }
    .tp__option:hover { background: var(--color-hover-bg); }
    .tp__option--selected {
      background: var(--color-selected-row);
      color: var(--color-interactive-primary);
      font-weight: 600;
    }
  `],
})
export class TimepickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() hint = '';
  @Input() errorMessage = '';
  @Input() state: 'default' | 'error' = 'default';
  @Input() size: 's' | 'm' | 'l' = 'm';
  @Input() format: '12h' | '24h' = '24h';
  @Input() utc = false;
  @Input() disabled = false;
  @Input() step = 15; // minutes between options

  value = '';
  open = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  /** All time slots based on step */
  get slots(): { value: string; label: string }[] {
    const result: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += this.step) {
        const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        result.push({ value, label: this.format24to(value) });
      }
    }
    return result;
  }

  /** Convert "HH:MM" to display format */
  get displayValue(): string {
    return this.format24to(this.value);
  }

  private format24to(v: string): string {
    if (!v) return '';
    if (this.format === '24h') return v;
    const [h, m] = v.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) this.onTouched();
    // Scroll selected option into view on next tick
    if (this.open && this.value) {
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  select(v: string): void {
    this.value = v;
    this.open = false;
    this.onChange(v);
  }

  private scrollToSelected(): void {
    const dropdown = this.el.nativeElement.querySelector('.tp__dropdown');
    const selected = this.el.nativeElement.querySelector('.tp__option--selected');
    if (dropdown && selected) {
      const top = (selected as HTMLElement).offsetTop - dropdown.clientHeight / 2 + 18;
      dropdown.scrollTop = top;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) {
      this.open = false;
    }
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
