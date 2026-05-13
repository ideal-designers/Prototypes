import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

export type DropdownSize = 's' | 'm' | 'l';

/**
 * DS Dropdown control — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13756
 *
 * DS specs:
 *   Height: S=32, M=40, L=48px
 *   Border: 1.5px stone-400, hover/open: primary-500
 *   Error: border error-600, hint error-600
 *   Icon left: 16px secondary on trigger
 *   Multi chips: 28px pill, bg stone-300, × to remove
 *   Panel: radius 4px (--radius-sm), shadow-popover
 *   Option height: 40px, hover hover-bg
 *
 * Usage:
 *   <fvdr-dropdown [options]="opts" [(ngModel)]="value" placeholder="Select..." />
 *   <fvdr-dropdown [options]="opts" [multi]="true" helperText="Choose multiple" />
 *   <fvdr-dropdown [options]="opts" iconLeft="filter" [error]="true" helperText="Required" />
 */
@Component({
  selector: 'fvdr-dropdown',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DropdownComponent), multi: true },
  ],
  template: `
    <div class="dropdown dropdown--{{ size }}"
         [class.dropdown--open]="open"
         [class.dropdown--disabled]="disabled"
         [class.dropdown--error]="error">
      <label *ngIf="label" class="dropdown__label">{{ label }}</label>
      <button class="dropdown__trigger" type="button" [disabled]="disabled" (click)="toggle()">
        <!-- Icon left -->
        <fvdr-icon *ngIf="iconLeft" [name]="iconLeft" class="dropdown__icon-left" />

        <!-- Multi chips -->
        <ng-container *ngIf="multi && selectedValues.length; else singleValue">
          <div class="dropdown__chips">
            <span *ngFor="let v of selectedValues" class="dropdown__chip">
              {{ labelOf(v) }}
              <button type="button" class="dropdown__chip-remove" (click)="removeChip(v, $event)">
                <fvdr-icon name="close" />
              </button>
            </span>
          </div>
        </ng-container>
        <ng-template #singleValue>
          <span class="dropdown__value" [class.dropdown__value--placeholder]="!selectedLabel">
            {{ selectedLabel || placeholder }}
          </span>
        </ng-template>

        <fvdr-icon name="chevron-down" class="dropdown__chevron" />
      </button>

      <!-- Hint / helper -->
      <span *ngIf="helperText" class="dropdown__hint" [class.dropdown__hint--error]="error">{{ helperText }}</span>

      <!-- Panel -->
      <div *ngIf="open" class="dropdown__panel">
        <div *ngIf="searchable" class="dropdown__search-wrap">
          <input class="dropdown__search" type="text" placeholder="Search..." [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" />
        </div>
        <div class="dropdown__list">
          <ng-container *ngFor="let opt of filteredOptions">
            <div *ngIf="opt.group && isFirstInGroup(opt)" class="dropdown__group-label">{{ opt.group }}</div>
            <button
              class="dropdown__option"
              type="button"
              [class.dropdown__option--selected]="isSelected(opt.value)"
              [disabled]="opt.disabled"
              (click)="select(opt)"
            >
              <fvdr-icon *ngIf="opt.icon" [name]="$any(opt.icon)" class="dropdown__opt-icon" />
              <span>{{ opt.label }}</span>
              <fvdr-icon *ngIf="isSelected(opt.value)" name="check" class="dropdown__check" />
            </button>
          </ng-container>
          <div *ngIf="!filteredOptions.length" class="dropdown__empty">No options</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dropdown { position: relative; display: flex; flex-direction: column; gap: var(--space-1); }

    .dropdown__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .dropdown__trigger {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      background: var(--color-stone-0);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-3);
      cursor: pointer;
      font-family: var(--font-family);
      transition: border-color 0.15s, background 0.15s;
      text-align: left;
    }
    .dropdown__trigger:hover:not(:disabled) { border-color: var(--color-primary-500); }
    .dropdown--open .dropdown__trigger { border-color: var(--color-primary-500); }
    .dropdown--error .dropdown__trigger { border-color: var(--color-error-600); }
    .dropdown--error .dropdown__trigger:hover:not(:disabled) { border-color: var(--color-error-600); }
    .dropdown--error.dropdown--open .dropdown__trigger { border-color: var(--color-error-600); }
    .dropdown--disabled .dropdown__trigger { opacity: 0.45; cursor: not-allowed; }

    .dropdown--s .dropdown__trigger { height: 32px; font-size: var(--text-base-s-size); }
    .dropdown--m .dropdown__trigger { height: 40px; font-size: var(--text-base-m-size); }
    .dropdown--l .dropdown__trigger { height: 48px; font-size: var(--text-base-l-size); }
    /* When chips present the trigger grows */
    .dropdown--m .dropdown__trigger:has(.dropdown__chips) { height: auto; min-height: 40px; padding-top: 6px; padding-bottom: 6px; }
    .dropdown--l .dropdown__trigger:has(.dropdown__chips) { height: auto; min-height: 48px; padding-top: 8px; padding-bottom: 8px; }

    .dropdown__icon-left { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    .dropdown__value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-primary); }
    .dropdown__value--placeholder { color: var(--color-text-placeholder); }

    .dropdown__chevron {
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .dropdown--open .dropdown__chevron { transform: rotate(180deg); }

    /* Chips */
    .dropdown__chips {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      min-width: 0;
    }
    .dropdown__chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 var(--space-3);
      border-radius: var(--radius-md);
      background: var(--color-stone-200, #eceef9);
      font-size: var(--text-caption1-size, 14px);
      color: var(--color-text-primary);
      white-space: nowrap;
    }
    .dropdown__chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: var(--color-text-secondary);
      font-size: 12px;
      line-height: 1;
    }
    .dropdown__chip-remove:hover { color: var(--color-text-primary); }

    /* Hint */
    .dropdown__hint {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
    }
    .dropdown__hint--error { color: var(--color-error-600); }

    /* Panel */
    .dropdown__panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      overflow: hidden;
    }

    .dropdown__search-wrap { padding: var(--space-2); border-bottom: 1px solid var(--color-stone-400); }
    .dropdown__search {
      width: 100%;
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: 4px var(--space-2);
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      background: var(--color-stone-0);
      outline: none;
      box-sizing: border-box;
    }
    .dropdown__search:focus { border-color: var(--color-primary-500); }

    .dropdown__list { max-height: 240px; overflow-y: auto; padding: var(--space-1) 0; }

    .dropdown__group-label {
      padding: var(--space-1) var(--space-4);
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dropdown__option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      height: 40px;
      padding: 0 var(--space-4);
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      color: var(--color-text-primary);
      text-align: left;
      transition: background 0.1s;
    }
    .dropdown__option:hover:not(:disabled) { background: var(--color-hover-bg); }
    .dropdown__option--selected { background: var(--color-primary-50); color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
    .dropdown__option:disabled { opacity: 0.45; cursor: not-allowed; }
    .dropdown__opt-icon { font-size: 16px; color: var(--color-text-secondary); }
    .dropdown__check { margin-left: auto; font-size: 14px; color: var(--color-primary-500); }

    .dropdown__empty { padding: var(--space-3); font-size: var(--text-base-s-size); color: var(--color-text-secondary); text-align: center; }
  `],
})
export class DropdownComponent implements ControlValueAccessor {
  private elRef = inject(ElementRef);

  @Input() label = '';
  @Input() placeholder = 'Select...';
  @Input() options: DropdownOption[] = [];
  @Input() size: DropdownSize = 'm';
  @Input() disabled = false;
  @Input() multi = false;
  @Input() searchable = false;
  @Input() error = false;
  @Input() helperText = '';
  @Input() iconLeft: FvdrIconName | '' = '';
  @Input() value: string | string[] = '';
  @Output() valueChange = new EventEmitter<string | string[]>();

  open = false;
  searchQuery = '';
  filteredOptions: DropdownOption[] = [];

  ngOnChanges(): void { this.filteredOptions = [...(this.options ?? [])]; }
  ngOnInit(): void { this.filteredOptions = [...(this.options ?? [])]; }

  get selectedLabel(): string {
    if (Array.isArray(this.value)) {
      const labels = this.options.filter(o => (this.value as string[]).includes(o.value)).map(o => o.label);
      return labels.length ? labels.join(', ') : '';
    }
    return this.options.find(o => o.value === this.value)?.label ?? '';
  }

  get selectedValues(): string[] {
    return Array.isArray(this.value) ? this.value : (this.value ? [this.value] : []);
  }

  labelOf(val: string): string {
    return this.options.find(o => o.value === val)?.label ?? val;
  }

  isSelected(val: string): boolean {
    return Array.isArray(this.value) ? this.value.includes(val) : this.value === val;
  }

  isFirstInGroup(opt: DropdownOption): boolean {
    return this.filteredOptions.findIndex(o => o.group === opt.group) === this.filteredOptions.indexOf(opt);
  }

  toggle(): void { this.open = !this.open; }

  select(opt: DropdownOption): void {
    if (this.multi) {
      const arr = Array.isArray(this.value) ? [...this.value] : [];
      const idx = arr.indexOf(opt.value);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(opt.value);
      this.value = arr;
    } else {
      this.value = opt.value;
      this.open = false;
    }
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  removeChip(val: string, event: Event): void {
    event.stopPropagation();
    const arr = Array.isArray(this.value) ? this.value.filter(v => v !== val) : [];
    this.value = arr;
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredOptions = this.options.filter(o => o.label.toLowerCase().includes(q));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.open = false;
  }

  private onChange: (v: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string | string[]): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string | string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
