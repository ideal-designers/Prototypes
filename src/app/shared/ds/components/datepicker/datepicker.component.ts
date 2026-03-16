import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { CalendarComponent } from '../calendar/calendar.component';

/**
 * DS Input / Calendar (Date picker) — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12231
 *
 * DS specs:
 *   Same trigger as Input field (40px height)
 *   Calendar icon right side
 *   Opens Calendar panel below
 *   Selected date shown as DD.MM.YYYY
 *
 * Usage:
 *   <fvdr-datepicker label="Start date" [(ngModel)]="date" />
 *   <fvdr-datepicker label="Period" [rangeMode]="true" [(rangeStart)]="start" [(rangeEnd)]="end" />
 */
@Component({
  selector: 'fvdr-datepicker',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, CalendarComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatepickerComponent), multi: true },
  ],
  template: `
    <div class="dp" [class.dp--open]="open">
      <label *ngIf="label" class="dp__label">{{ label }}</label>
      <button class="dp__trigger" type="button" [disabled]="disabled" (click)="toggle()">
        <span class="dp__value" [class.dp__value--placeholder]="!displayValue">
          {{ displayValue || placeholder }}
        </span>
        <fvdr-icon name="folder" class="dp__icon" />
      </button>
      <div *ngIf="open" class="dp__panel">
        <fvdr-calendar
          [selected]="value"
          [rangeMode]="rangeMode"
          [rangeStart]="rangeStart"
          [rangeEnd]="rangeEnd"
          (selectedChange)="onDateSelect($event)"
          (rangeStartChange)="rangeStart = $event; rangeStartChange.emit($event)"
          (rangeEndChange)="rangeEnd = $event; rangeEndChange.emit($event); open = false"
        />
      </div>
    </div>
  `,
  styles: [`
    .dp { position: relative; display: flex; flex-direction: column; gap: var(--space-1); }

    .dp__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .dp__trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      padding: 0 var(--space-3);
      background: var(--color-stone-200);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      transition: border-color 0.15s;
      width: 100%;
      text-align: left;
    }
    .dp__trigger:hover { border-color: var(--color-primary-500); }
    .dp--open .dp__trigger { border-color: var(--color-primary-500); background: var(--color-stone-0); }
    .dp__trigger:disabled { opacity: 0.45; cursor: not-allowed; }

    .dp__value { color: var(--color-text-primary); }
    .dp__value--placeholder { color: var(--color-text-placeholder); }
    .dp__icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    .dp__panel { position: absolute; top: calc(100% + 4px); left: 0; z-index: 1000; }
  `],
})
export class DatepickerComponent implements ControlValueAccessor {
  private elRef = inject(ElementRef);

  @Input() label = '';
  @Input() placeholder = 'Select date...';
  @Input() disabled = false;
  @Input() rangeMode = false;
  @Input() rangeStart?: Date;
  @Input() rangeEnd?: Date;
  @Output() rangeStartChange = new EventEmitter<Date>();
  @Output() rangeEndChange = new EventEmitter<Date>();

  value?: Date;
  open = false;

  get displayValue(): string {
    if (this.rangeMode) {
      if (this.rangeStart && this.rangeEnd)
        return `${this.fmt(this.rangeStart)} — ${this.fmt(this.rangeEnd)}`;
      if (this.rangeStart) return this.fmt(this.rangeStart);
      return '';
    }
    return this.value ? this.fmt(this.value) : '';
  }

  private fmt(d: Date): string {
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  }

  toggle(): void { this.open = !this.open; }

  onDateSelect(d: Date): void {
    this.value = d;
    this.open = false;
    this.onChange(d);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.open = false;
  }

  private onChange: (v: Date | undefined) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: Date): void { this.value = v; }
  registerOnChange(fn: (v: Date | undefined) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
