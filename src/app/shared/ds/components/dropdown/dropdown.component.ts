import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

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
 *   Same visual style as Input field
 *   Chevron right, selected label shown
 *   Droplist panel: shadow-popover, radius 8px
 *   Option height: 36px, hover #ECEEF9
 *
 * Usage:
 *   <fvdr-dropdown [options]="opts" [(ngModel)]="value" placeholder="Select..." />
 *   <fvdr-dropdown [options]="opts" [(value)]="val" [multi]="true" />
 */
@Component({
  selector: 'fvdr-dropdown',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DropdownComponent), multi: true },
  ],
  template: `
    <div class="dropdown dropdown--{{ size }}" [class.dropdown--open]="open" [class.dropdown--disabled]="disabled">
      <label *ngIf="label" class="dropdown__label">{{ label }}</label>
      <button class="dropdown__trigger" type="button" [disabled]="disabled" (click)="toggle()">
        <span class="dropdown__value" [class.dropdown__value--placeholder]="!selectedLabel">
          {{ selectedLabel || placeholder }}
        </span>
        <fvdr-icon name="chevron-down" class="dropdown__chevron" />
      </button>
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
      justify-content: space-between;
      width: 100%;
      background: var(--color-stone-200);
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-3);
      cursor: pointer;
      font-family: var(--font-family);
      transition: border-color 0.15s, background 0.15s;
      text-align: left;
    }
    .dropdown__trigger:hover { border-color: var(--color-primary-500); }
    .dropdown--open .dropdown__trigger { border-color: var(--color-primary-500); background: var(--color-stone-0); }
    .dropdown--disabled .dropdown__trigger { opacity: 0.45; cursor: not-allowed; }

    .dropdown--s .dropdown__trigger { height: 32px; font-size: var(--text-base-s-size); }
    .dropdown--m .dropdown__trigger { height: 40px; font-size: var(--text-base-m-size); }
    .dropdown--l .dropdown__trigger { height: 48px; font-size: var(--text-base-l-size); }

    .dropdown__value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-primary); }
    .dropdown__value--placeholder { color: var(--color-text-placeholder); }
    .dropdown__chevron {
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .dropdown--open .dropdown__chevron { transform: rotate(180deg); }

    .dropdown__panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-md);
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
      background: var(--color-stone-200);
      outline: none;
      box-sizing: border-box;
    }
    .dropdown__search:focus { border-color: var(--color-primary-500); background: var(--color-stone-0); }

    .dropdown__list { max-height: 240px; overflow-y: auto; padding: var(--space-1) 0; }

    .dropdown__group-label {
      padding: var(--space-1) var(--space-3);
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
      height: 36px;
      padding: 0 var(--space-3);
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
    .dropdown__option--selected { color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
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
