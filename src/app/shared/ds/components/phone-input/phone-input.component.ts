import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface PhoneCountry {
  code: string;   // '+1'
  iso: string;    // 'US'
  flag: string;   // '🇺🇸'
  name: string;
}

const DEFAULT_COUNTRIES: PhoneCountry[] = [
  { code: '+1',   iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+44',  iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+49',  iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+380', iso: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+48',  iso: 'PL', flag: '🇵🇱', name: 'Poland' },
];

/**
 * DS Input / Phone number — Figma: liyNDiFf1piO8SQmHNKoeU, node 19635-3445
 *
 * DS specs:
 *   Height: 40px
 *   Flag + country code selector on left
 *   Phone number input on right
 *   Same border/bg as Input field
 *
 * Usage:
 *   <fvdr-phone-input label="Phone" [(ngModel)]="phone" />
 */
@Component({
  selector: 'fvdr-phone-input',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  template: `
    <div class="phone" [class.phone--disabled]="disabled">
      <label *ngIf="label" class="phone__label">{{ label }}</label>
      <div class="phone__wrapper" [class.phone__wrapper--focused]="focused">
        <!-- Country selector -->
        <div class="phone__country" (click)="showDropdown = !showDropdown">
          <span class="phone__flag">{{ selectedCountry.flag }}</span>
          <span class="phone__code">{{ selectedCountry.code }}</span>
          <fvdr-icon name="chevron-down" class="phone__chevron" [class.phone__chevron--open]="showDropdown" />
          <!-- Country dropdown -->
          <div *ngIf="showDropdown" class="phone__dropdown">
            <button
              *ngFor="let c of countries"
              class="phone__country-opt"
              type="button"
              [class.phone__country-opt--active]="c.iso === selectedCountry.iso"
              (click)="selectCountry(c); $event.stopPropagation()"
            >
              <span>{{ c.flag }}</span>
              <span>{{ c.name }}</span>
              <span class="phone__country-code">{{ c.code }}</span>
            </button>
          </div>
        </div>
        <div class="phone__divider"></div>
        <input
          class="phone__input"
          type="tel"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="number"
          (ngModelChange)="emit()"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        />
      </div>
      <span *ngIf="errorText" class="phone__error">{{ errorText }}</span>
    </div>
  `,
  styles: [`
    .phone { display: flex; flex-direction: column; gap: var(--space-1); }
    .phone--disabled { opacity: 0.45; pointer-events: none; }

    .phone__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .phone__wrapper {
      display: flex;
      align-items: center;
      height: 40px;
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s, background 0.15s;
      overflow: visible;
    }
    .phone__wrapper--focused { border-color: var(--color-primary-500); background: var(--color-stone-0); }

    .phone__country {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 var(--space-2) 0 var(--space-3);
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      height: 100%;
    }
    .phone__country:hover { background: var(--color-hover-bg); }
    .phone__flag { font-size: 16px; line-height: 1; }
    .phone__code { font-family: var(--font-family); font-size: var(--text-base-s-size); color: var(--color-text-primary); }
    .phone__chevron { font-size: 14px; color: var(--color-text-secondary); transition: transform 0.15s; }
    .phone__chevron--open { transform: rotate(180deg); }

    .phone__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: -2px;
      z-index: 1000;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      min-width: 200px;
      max-height: 200px;
      overflow-y: auto;
      padding: var(--space-1) 0;
    }
    .phone__country-opt {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: 0 var(--space-3);
      height: 36px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      text-align: left;
    }
    .phone__country-opt:hover { background: var(--color-hover-bg); }
    .phone__country-opt--active { color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
    .phone__country-code { margin-left: auto; color: var(--color-text-secondary); font-size: var(--text-caption1-size); }

    .phone__divider { width: 1px; height: 20px; background: var(--color-stone-400); flex-shrink: 0; }

    .phone__input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      padding: 0 var(--space-3);
      height: 100%;
    }
    .phone__input::placeholder { color: var(--color-text-placeholder); }

    .phone__error {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-error-600);
    }
  `],
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '000 000 0000';
  @Input() disabled = false;
  @Input() errorText = '';
  @Input() countries: PhoneCountry[] = DEFAULT_COUNTRIES;

  selectedCountry: PhoneCountry = DEFAULT_COUNTRIES[0];
  number = '';
  focused = false;
  showDropdown = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  selectCountry(c: PhoneCountry): void {
    this.selectedCountry = c;
    this.showDropdown = false;
    this.emit();
  }

  emit(): void { this.onChange(this.selectedCountry.code + this.number); }

  writeValue(v: string): void {
    if (!v) { this.number = ''; return; }
    const country = this.countries.find(c => v.startsWith(c.code));
    if (country) { this.selectedCountry = country; this.number = v.slice(country.code.length); }
    else this.number = v;
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
