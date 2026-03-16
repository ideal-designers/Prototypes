import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

/**
 * DS Calendar — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12446
 *
 * DS specs:
 *   Width: 280px
 *   Header: Month Year + prev/next arrows
 *   Day grid: 7 columns, Mon–Sun
 *   Day cell: 32×32px, radius 50% for selected
 *   Selected: bg #2C9C74 text white
 *   Today: border 1px #2C9C74
 *   Range: primary-50 bg between start/end
 *   Disabled days: opacity 0.3
 *
 * Usage:
 *   <fvdr-calendar [(selected)]="date" />
 *   <fvdr-calendar [rangeMode]="true" [(rangeStart)]="start" [(rangeEnd)]="end" />
 */
@Component({
  selector: 'fvdr-calendar',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="cal">
      <!-- Header -->
      <div class="cal__header">
        <button class="cal__nav" (click)="prevMonth()">
          <fvdr-icon name="chevron-left" />
        </button>
        <span class="cal__title">{{ monthLabel }} {{ viewYear }}</span>
        <button class="cal__nav" (click)="nextMonth()">
          <fvdr-icon name="chevron-right" />
        </button>
      </div>

      <!-- Day names -->
      <div class="cal__grid cal__grid--head">
        <span *ngFor="let d of dayNames" class="cal__day-name">{{ d }}</span>
      </div>

      <!-- Days -->
      <div class="cal__grid">
        <button
          *ngFor="let cell of cells"
          class="cal__cell"
          [class.cal__cell--other]="!cell.current"
          [class.cal__cell--today]="cell.today"
          [class.cal__cell--selected]="cell.selected"
          [class.cal__cell--range]="cell.inRange"
          [class.cal__cell--range-start]="cell.rangeStart"
          [class.cal__cell--range-end]="cell.rangeEnd"
          [class.cal__cell--disabled]="cell.disabled"
          [disabled]="cell.disabled"
          (click)="onDayClick(cell)"
        >{{ cell.day }}</button>
      </div>
    </div>
  `,
  styles: [`
    .cal {
      display: inline-flex;
      flex-direction: column;
      width: 280px;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      box-shadow: var(--shadow-popover);
      user-select: none;
    }

    .cal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-2);
    }
    .cal__nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 14px;
    }
    .cal__nav:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .cal__title {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-sb-weight);
      color: var(--color-text-primary);
    }

    .cal__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .cal__grid--head { margin-bottom: 4px; }

    .cal__day-name {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .cal__cell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 1;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      transition: background 0.1s;
    }
    .cal__cell:hover:not(:disabled):not(.cal__cell--selected) { background: var(--color-hover-bg); }
    .cal__cell--other { color: var(--color-text-disabled); }
    .cal__cell--today { border: 1.5px solid var(--color-primary-500); }
    .cal__cell--selected { background: var(--color-primary-500); color: #fff; border-color: transparent; }
    .cal__cell--range { background: var(--color-primary-50); border-radius: 0; }
    .cal__cell--range-start { background: var(--color-primary-500); color: #fff; border-radius: 50% 0 0 50%; }
    .cal__cell--range-end   { background: var(--color-primary-500); color: #fff; border-radius: 0 50% 50% 0; }
    .cal__cell--disabled { opacity: 0.3; cursor: not-allowed; }
  `],
})
export class CalendarComponent implements OnChanges {
  @Input() selected?: Date;
  @Input() rangeMode = false;
  @Input() rangeStart?: Date;
  @Input() rangeEnd?: Date;
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Output() selectedChange = new EventEmitter<Date>();
  @Output() rangeStartChange = new EventEmitter<Date>();
  @Output() rangeEndChange = new EventEmitter<Date>();

  dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  cells: CalCell[] = [];
  viewYear!: number;
  viewMonth!: number;

  private monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  get monthLabel(): string { return this.monthNames[this.viewMonth]; }

  ngOnChanges(): void { this.buildCells(); }

  ngOnInit(): void {
    const d = this.selected ?? this.rangeStart ?? new Date();
    this.viewYear = d.getFullYear();
    this.viewMonth = d.getMonth();
    this.buildCells();
  }

  prevMonth(): void {
    if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
    else this.viewMonth--;
    this.buildCells();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
    else this.viewMonth++;
    this.buildCells();
  }

  onDayClick(cell: CalCell): void {
    const d = new Date(cell.year, cell.month, cell.day);
    if (this.rangeMode) {
      if (!this.rangeStart || (this.rangeStart && this.rangeEnd)) {
        this.rangeStart = d;
        this.rangeEnd = undefined;
        this.rangeStartChange.emit(d);
      } else {
        if (d < this.rangeStart) { this.rangeEnd = this.rangeStart; this.rangeStart = d; }
        else this.rangeEnd = d;
        this.rangeStartChange.emit(this.rangeStart!);
        this.rangeEndChange.emit(this.rangeEnd!);
      }
    } else {
      this.selected = d;
      this.selectedChange.emit(d);
    }
    this.buildCells();
  }

  private buildCells(): void {
    if (this.viewYear === undefined) return;
    const today = new Date();
    const first = new Date(this.viewYear, this.viewMonth, 1);
    // Monday-based: 0=Mon..6=Sun
    let startDow = (first.getDay() + 6) % 7;
    const cells: CalCell[] = [];

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(this.viewYear, this.viewMonth, -i);
      cells.push(this.makeCell(d, false, today));
    }
    // Current month
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(this.viewYear, this.viewMonth, day);
      cells.push(this.makeCell(d, true, today));
    }
    // Next month fill
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(this.viewYear, this.viewMonth + 1, day);
      cells.push(this.makeCell(d, false, today));
    }
    this.cells = cells;
  }

  private makeCell(d: Date, current: boolean, today: Date): CalCell {
    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const selected = !this.rangeMode && !!this.selected && isSameDay(d, this.selected);
    const rangeStart = !!this.rangeStart && isSameDay(d, this.rangeStart);
    const rangeEnd = !!this.rangeEnd && isSameDay(d, this.rangeEnd);
    const inRange = !!(this.rangeStart && this.rangeEnd && d > this.rangeStart && d < this.rangeEnd);
    const disabled = !!(this.minDate && d < this.minDate) || !!(this.maxDate && d > this.maxDate);
    return {
      day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
      current, today: isSameDay(d, today), selected, rangeStart, rangeEnd, inRange, disabled,
    };
  }
}

interface CalCell {
  day: number; month: number; year: number;
  current: boolean; today: boolean; selected: boolean;
  rangeStart: boolean; rangeEnd: boolean; inRange: boolean; disabled: boolean;
}
