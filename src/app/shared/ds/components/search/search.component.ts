import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export type SearchSize = 's' | 'm' | 'l';

/**
 * DS Search field — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-12166
 *
 * DS specs:
 *   Size: S=32px, M=40px, L=48px
 *   Border: 1.5px stone-400, focused/hover: primary-500, error: error-600
 *   Border-radius: 4px (--radius-sm)
 *   Left: search icon (16px, placeholder color)
 *   Right: clear × when value entered; filter button (separated by 1px border) when [filter]="true"
 *   Filter indicator: 8px green dot top-right when [indicator]="true"
 *   Label: SemiBold above field
 *   HelperText: 12px caption below field (red when error)
 *
 * Usage:
 *   <fvdr-search placeholder="Search…" [(ngModel)]="query" />
 *   <fvdr-search label="Filter table" [filter]="true" [indicator]="activeFilters > 0"
 *                (filterClick)="openFilters()" [(ngModel)]="query" />
 */
@Component({
  selector: 'fvdr-search',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchComponent), multi: true },
  ],
  template: `
    <div class="search search--{{ size }}"
         [class.search--error]="error"
         [class.search--disabled]="disabled">

      <label *ngIf="label" class="search__label">{{ label }}</label>

      <div class="search__field" [class.search__field--focused]="focused">
        <fvdr-icon name="search" class="search__icon" />

        <input
          class="search__input"
          type="text"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          (input)="onInput($event)"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        />

        <button *ngIf="value && !disabled" class="search__clear" type="button" (click)="clear()">
          <fvdr-icon name="close" />
        </button>

        <ng-container *ngIf="filter">
          <button
            class="search__filter-btn"
            [class.search__filter-btn--active]="indicator"
            type="button"
            [disabled]="disabled"
            (click)="filterClick.emit()"
          >
            <fvdr-icon name="filter" />
          </button>
          <span *ngIf="indicator" class="search__indicator"></span>
        </ng-container>
      </div>

      <span *ngIf="helperText" class="search__hint" [class.search__hint--error]="error">
        {{ helperText }}
      </span>
    </div>
  `,
  styles: [`
    .search { display: flex; flex-direction: column; gap: var(--space-1); width: 100%; }

    .search__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    /* Field */
    .search__field {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      transition: border-color 0.15s;
      overflow: hidden;
    }
    .search__field:hover { border-color: var(--color-primary-500); }
    .search__field--focused { border-color: var(--color-primary-500); }
    .search--error .search__field { border-color: var(--color-error-600); }
    .search--error .search__field:hover { border-color: var(--color-error-600); }
    .search--disabled .search__field { opacity: 0.45; pointer-events: none; }

    /* Sizes */
    .search--s .search__field { height: 32px; }
    .search--m .search__field { height: 40px; }
    .search--l .search__field { height: 48px; }

    /* Search icon */
    .search__icon {
      flex-shrink: 0;
      font-size: 16px;
      color: var(--color-text-placeholder);
      margin-left: var(--space-3);
    }

    /* Input */
    .search__input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      padding: 0 var(--space-2);
      height: 100%;
    }
    .search--l .search__input { font-size: var(--text-base-m-size); }
    .search__input::placeholder { color: var(--color-text-placeholder); }

    /* Clear button */
    .search__clear {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 28px;
      height: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 14px;
      padding: 0;
    }
    .search__clear:hover { color: var(--color-text-primary); }

    /* Filter button */
    .search__filter-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 16px;
      padding: 0;
      margin-right: var(--space-3);
      transition: color 0.1s;
    }
    .search__filter-btn:hover { color: var(--color-text-primary); }
    .search__filter-btn--active { color: var(--color-primary-500); }
    .search--l .search__filter-btn { margin-right: var(--space-4); }

    /* Active filter indicator dot — absolute within .search__field */
    .search__indicator {
      position: absolute;
      top: 6px;
      right: 8px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary-500);
      border: 1.5px solid var(--color-stone-0);
      pointer-events: none;
    }

    /* Hint */
    .search__hint {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
    .search__hint--error { color: var(--color-error-600); }
  `],
})
export class SearchComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Search...';
  @Input() size: SearchSize = 'm';
  @Input() disabled = false;
  @Input() error = false;
  @Input() helperText = '';
  /** Show filter icon button on the right */
  @Input() filter = false;
  /** Green dot indicator on the filter button — signals active filters */
  @Input() indicator = false;
  @Output() filterClick = new EventEmitter<void>();

  value = '';
  focused = false;

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
  setDisabledState(d: boolean): void { this.disabled = d; }
}
