import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface SearchFilter {
  id: string;
  label: string;
  active?: boolean;
}

/**
 * DS Input / Search with filters — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12166
 *
 * DS specs:
 *   Height: 40px
 *   Search icon left, clear button right
 *   Optional filter chips below / inline
 *   Border: same as Input field
 *
 * Usage:
 *   <fvdr-search placeholder="Search..." [(ngModel)]="query" />
 *   <fvdr-search [filters]="filters" (filterToggle)="onFilter($event)" />
 */
@Component({
  selector: 'fvdr-search',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchComponent), multi: true },
  ],
  template: `
    <div class="search">
      <div class="search__wrapper" [class.search__wrapper--focused]="focused">
        <fvdr-icon name="search" class="search__icon" />
        <input
          class="search__input"
          type="text"
          [placeholder]="placeholder"
          [value]="value"
          (input)="onInput($event)"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        />
        <button *ngIf="value" class="search__clear" (click)="clear()">
          <fvdr-icon name="close" />
        </button>
        <button *ngIf="showFilterBtn" class="search__filter-btn" [class.search__filter-btn--active]="hasActiveFilters" (click)="filterBtnClick.emit()">
          <fvdr-icon name="filter" />
        </button>
      </div>
      <div *ngIf="filters?.length" class="search__filters">
        <button
          *ngFor="let f of filters"
          class="search__filter-chip"
          [class.search__filter-chip--active]="f.active"
          (click)="filterToggle.emit(f)"
        >{{ f.label }}</button>
      </div>
    </div>
  `,
  styles: [`
    .search { display: flex; flex-direction: column; gap: var(--space-2); }

    .search__wrapper {
      position: relative;
      display: flex;
      align-items: center;
      height: 40px;
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s, background 0.15s;
    }
    .search__wrapper--focused {
      background: var(--color-stone-0);
      border-color: var(--color-primary-500);
    }

    .search__icon {
      position: absolute;
      left: var(--space-3);
      font-size: 16px;
      color: var(--color-text-placeholder);
      pointer-events: none;
    }

    .search__input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      padding: 0 var(--space-3) 0 var(--space-8);
      height: 100%;
    }
    .search__input::placeholder { color: var(--color-text-placeholder); }

    .search__clear,
    .search__filter-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .search__clear:hover { color: var(--color-text-primary); }
    .search__filter-btn { border-left: 1px solid var(--color-stone-400); }
    .search__filter-btn--active { color: var(--color-primary-500); }
    .search__filter-btn:hover { background: var(--color-hover-bg); }

    .search__filters { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    .search__filter-chip {
      display: inline-flex;
      align-items: center;
      height: 28px;
      padding: 0 var(--space-3);
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-stone-400);
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .search__filter-chip:hover { border-color: var(--color-primary-500); color: var(--color-primary-500); }
    .search__filter-chip--active {
      background: var(--color-primary-50);
      border-color: var(--color-primary-500);
      color: var(--color-primary-500);
    }
  `],
})
export class SearchComponent implements ControlValueAccessor {
  @Input() placeholder = 'Search...';
  @Input() filters?: SearchFilter[];
  @Input() showFilterBtn = false;
  @Output() filterToggle = new EventEmitter<SearchFilter>();
  @Output() filterBtnClick = new EventEmitter<void>();

  value = '';
  focused = false;

  get hasActiveFilters(): boolean {
    return this.filters?.some(f => f.active) ?? false;
  }

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  clear(): void {
    this.value = '';
    this.onChange('');
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(): void {}
}
