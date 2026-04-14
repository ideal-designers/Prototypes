import {
  Component, Input, Output, EventEmitter, forwardRef,
  HostListener, ElementRef, OnInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface TimeValue { hours: number; minutes: number; }

/**
 * DS Time picker — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12265
 *
 * Dropdown-based time picker with 15-minute intervals.
 * Input field (L/M/S sizes) + scrollable popover with time options.
 *
 * Usage:
 *   <fvdr-timepicker label="Start time" [(ngModel)]="time" />
 *   <fvdr-timepicker label="End time" [mode]="'12h'" [showUtc]="true" />
 *   <fvdr-timepicker label="Time" size="m" hint="Select departure time" />
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

      <!-- Label -->
      <label *ngIf="label" class="tp__label tp__label--{{ size }}">{{ label }}</label>

      <!-- Input field trigger -->
      <div
        class="tp__field tp__field--{{ size }}"
        [class.tp__field--focused]="open"
        [class.tp__field--error]="error"
        [class.tp__field--filled]="!!displayValue"
        (click)="toggle()"
      >
        <div class="tp__field-content">
          <span class="tp__value tp__value--{{ size }}" [class.tp__value--placeholder]="!displayValue">
            {{ displayValue || placeholder }}
          </span>
          <span *ngIf="showUtc" class="tp__utc tp__utc--{{ size }}">UTC</span>
        </div>
        <fvdr-icon name="clock" class="tp__icon tp__icon--{{ size }}" />
      </div>

      <!-- Hint / Error message -->
      <span *ngIf="hint || error" class="tp__hint" [class.tp__hint--error]="error">
        {{ error || hint }}
      </span>

      <!-- Dropdown -->
      <div *ngIf="open" class="tp__dropdown">
        <div class="tp__scroll" #scrollEl>
          <div
            *ngFor="let opt of options"
            class="tp__option"
            [class.tp__option--selected]="opt === displayValue"
            (click)="select(opt)"
            (mouseenter)="hoveredOption = opt"
            (mouseleave)="hoveredOption = ''"
          >
            {{ opt }}
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }

    .tp { display: flex; flex-direction: column; gap: var(--space-1); }
    .tp--disabled { opacity: 0.45; pointer-events: none; }

    /* ── Label ── */
    .tp__label {
      font-family: var(--font-family);
      font-weight: var(--text-label-weight);
      color: var(--color-text-primary);
      line-height: 24px;
    }
    .tp__label--l { font-size: var(--text-label-l-size, 16px); }
    .tp__label--m { font-size: var(--text-label-m-size, 14px); }
    .tp__label--s { font-size: var(--text-label-s-size, 13px); }

    /* ── Field ── */
    .tp__field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-4);
      cursor: pointer;
      transition: border-color 0.15s;
      user-select: none;
    }
    .tp__field:hover:not(.tp__field--focused) { border-color: var(--color-stone-600); }
    .tp__field--focused { border-color: var(--color-primary-500); }
    .tp__field--error { border-color: var(--color-error-600); }

    .tp__field--l { height: 48px; }
    .tp__field--m { height: 40px; }
    .tp__field--s { height: 32px; padding: 0 var(--space-3); }

    /* ── Field content ── */
    .tp__field-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 1;
      gap: var(--space-1);
    }

    /* ── Value / Placeholder ── */
    .tp__value {
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .tp__value--placeholder { color: var(--color-text-placeholder); }
    .tp__value--l { font-size: var(--text-base-l-size, 16px); line-height: 24px; }
    .tp__value--m { font-size: var(--text-base-s-size, 15px); line-height: 24px; }
    .tp__value--s { font-size: var(--text-caption1-size, 14px); line-height: 24px; }

    /* ── UTC badge ── */
    .tp__utc {
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .tp__utc--l { font-size: var(--text-base-s-size, 15px); }
    .tp__utc--m { font-size: var(--text-caption1-size, 14px); }
    .tp__utc--s { font-size: var(--text-caption2-size, 12px); }

    /* ── Clock icon ── */
    .tp__icon { color: var(--color-text-secondary); flex-shrink: 0; margin-left: var(--space-2); }
    .tp__icon--l { font-size: 16px; }
    .tp__icon--m { font-size: 16px; }
    .tp__icon--s { font-size: 14px; }

    /* ── Hint ── */
    .tp__hint {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: 400;
      color: var(--color-text-secondary);
      line-height: 16px;
    }
    .tp__hint--error { color: var(--color-error-600); }

    /* ── Dropdown ── */
    .tp__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      width: 160px;
      overflow: hidden;
    }

    .tp__scroll {
      max-height: 240px;
      overflow-y: auto;
      padding: var(--space-2) 0;
    }
    .tp__scroll::-webkit-scrollbar { width: 4px; }
    .tp__scroll::-webkit-scrollbar-thumb { background: var(--color-stone-400); border-radius: 2px; }

    /* ── Option ── */
    .tp__option {
      display: flex;
      align-items: center;
      height: 40px;
      padding: var(--space-2) var(--space-4);
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: 400;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background 0.1s;
      white-space: nowrap;
    }
    .tp__option:hover { background: var(--color-hover-bg); }
    .tp__option--selected {
      background: var(--color-primary-50);
      color: var(--color-text-primary);
    }
  `],
})
export class TimepickerComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() hint = '';
  @Input() placeholder = 'hh:mm';
  @Input() size: 'l' | 'm' | 's' = 'm';
  @Input() mode: '12h' | '24h' = '24h';
  @Input() showUtc = false;
  @Input() disabled = false;
  @Input() error = '';
  @Input() step = 15; // minutes between options

  displayValue = '';
  open = false;
  options: string[] = [];
  hoveredOption = '';

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.options = this.buildOptions();
  }

  buildOptions(): string[] {
    const opts: string[] = [];
    const total = 24 * 60;
    for (let m = 0; m < total; m += this.step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      if (this.mode === '12h') {
        const period = h < 12 ? 'AM' : 'PM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        opts.push(`${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`);
      } else {
        opts.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    return opts;
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
    this.onTouched();
    if (this.open) {
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  select(opt: string): void {
    this.displayValue = opt;
    this.open = false;
    this.onChange(opt);
  }

  scrollToSelected(): void {
    if (!this.displayValue) return;
    const idx = this.options.indexOf(this.displayValue);
    if (idx === -1) return;
    const scroll = this.elRef.nativeElement.querySelector('.tp__scroll');
    if (scroll) {
      const itemHeight = 40;
      scroll.scrollTop = Math.max(0, idx * itemHeight - 80);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.open = false;
      this.cdr.markForCheck();
    }
  }

  // ControlValueAccessor
  writeValue(v: string): void {
    this.displayValue = v || '';
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
