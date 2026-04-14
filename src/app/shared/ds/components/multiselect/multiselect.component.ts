import {
  Component, Input, Output, EventEmitter, HostListener,
  ElementRef, forwardRef, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

export interface MultiselectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * DS Multiselect — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13916 / 15032-13999
 *
 * DS specs:
 *   Panel: white, radius 4px, shadow 0 2px 12px rgba(0,0,0,0.10)
 *   Header: stone-100 bg, bottom border #DEE0EB
 *     — checkbox (select-all) left, search field right
 *   Items: 40px (M) / 32px (S) · padding 8px 16px · gap 12px
 *     — checkbox + label text #5F616A
 *   Active item: bg #EBF8EF, text primary, checkbox checked green
 *   Hover item: bg #F7F7F7
 *   Trigger: text field style with "N selected" label + chevron
 *
 * Usage:
 *   <fvdr-multiselect label="Tags" [options]="opts" [(ngModel)]="selected" />
 *   <fvdr-multiselect label="Status" [options]="opts" [(values)]="ids" placeholder="Choose statuses…" />
 */
@Component({
  selector: 'fvdr-multiselect',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultiselectComponent),
    multi: true,
  }],
  template: `
    <!-- Label -->
    <label *ngIf="label" class="ms-label">{{ label }}<span *ngIf="required" class="ms-required">*</span></label>

    <!-- Trigger button -->
    <button
      type="button"
      class="ms-trigger"
      [class.ms-trigger--open]="open"
      [class.ms-trigger--disabled]="disabled"
      [disabled]="disabled || null"
      (click)="toggle()"
    >
      <span class="ms-trigger__text" [class.ms-trigger__text--placeholder]="selected.length === 0">
        {{ triggerLabel }}
      </span>
      <!-- selected chips strip -->
      <span *ngIf="selected.length > 0 && showChips" class="ms-trigger__chips">
        <span *ngFor="let v of selected.slice(0, maxChips)" class="ms-chip">{{ labelOf(v) }}</span>
        <span *ngIf="selected.length > maxChips" class="ms-chip ms-chip--more">+{{ selected.length - maxChips }}</span>
      </span>
      <fvdr-icon name="chevron-down" class="ms-trigger__chevron" [class.ms-trigger__chevron--up]="open" />
    </button>

    <!-- Hint / error -->
    <p *ngIf="errorText && state === 'error'" class="ms-error">{{ errorText }}</p>
    <p *ngIf="helperText && state !== 'error'" class="ms-hint">{{ helperText }}</p>

    <!-- Panel -->
    <div *ngIf="open" class="ms-panel">

      <!-- Header: select-all checkbox + search -->
      <div class="ms-panel__header">
        <span
          class="ms-selectall"
          [class.ms-selectall--checked]="allChecked"
          [class.ms-selectall--indeterminate]="someChecked && !allChecked"
          (click)="toggleAll()"
          role="checkbox"
          [attr.aria-checked]="allChecked ? 'true' : someChecked ? 'mixed' : 'false'"
          tabindex="0"
          (keydown.enter)="toggleAll()"
          (keydown.space)="$event.preventDefault(); toggleAll()"
        ></span>

        <div class="ms-search-wrap">
          <fvdr-icon name="search" class="ms-search__icon" />
          <input
            #searchInput
            class="ms-search"
            type="text"
            [placeholder]="searchPlaceholder"
            [(ngModel)]="query"
            (ngModelChange)="onQuery()"
            autocomplete="off"
          />
          <button *ngIf="query" class="ms-search__clear" type="button" (click)="query=''; onQuery()">
            <fvdr-icon name="close" />
          </button>
        </div>
      </div>

      <!-- Items list -->
      <div class="ms-panel__list" [style.max-height]="maxHeight">
        <ng-container *ngIf="filtered.length > 0; else empty">
          <div
            *ngFor="let opt of filtered"
            class="ms-item"
            [class.ms-item--active]="isSelected(opt.value)"
            [class.ms-item--disabled]="opt.disabled"
            (click)="!opt.disabled && toggleOption(opt.value)"
            role="option"
            [attr.aria-selected]="isSelected(opt.value)"
          >
            <span
              class="ms-item__cb"
              [class.ms-item__cb--checked]="isSelected(opt.value)"
              [class.ms-item__cb--disabled]="opt.disabled"
            ></span>
            <span class="ms-item__label">{{ opt.label }}</span>
          </div>
        </ng-container>
        <ng-template #empty>
          <div class="ms-item ms-item--empty">No results for "{{ query }}"</div>
        </ng-template>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      font-family: var(--font-family);
    }

    /* ── Label ── */
    .ms-label {
      display: block;
      font-size: var(--text-caption1-size);
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }
    .ms-required { color: var(--color-error-600, #e54430); margin-left: 2px; }

    /* ── Trigger ── */
    .ms-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-height: 40px;
      padding: 6px 12px;
      background: var(--color-stone-0, #fff);
      border: 1px solid var(--color-stone-500, #bbbdc8);
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .ms-trigger:hover:not(:disabled) { border-color: var(--color-primary-500); }
    .ms-trigger--open { border-color: var(--color-primary-500); }
    .ms-trigger--disabled { opacity: 0.45; cursor: default; }

    .ms-trigger__text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 20px;
    }
    .ms-trigger__text--placeholder { color: var(--color-text-placeholder, #9c9ea8); }

    .ms-trigger__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
    }
    .ms-chip {
      display: inline-flex;
      align-items: center;
      height: 20px;
      padding: 0 6px;
      background: var(--color-primary-50, #ebf8ef);
      border-radius: 10px;
      font-size: 12px;
      color: var(--color-primary-500);
      white-space: nowrap;
    }
    .ms-chip--more { background: var(--color-stone-200, #efefef); color: var(--color-text-secondary); }

    .ms-trigger__chevron {
      flex-shrink: 0;
      font-size: 16px;
      color: var(--color-text-secondary);
      transition: transform 0.2s;
    }
    .ms-trigger__chevron--up { transform: rotate(180deg); }

    /* ── Hint / Error ── */
    .ms-hint { font-size: 12px; color: var(--color-text-secondary); margin: 4px 0 0; }
    .ms-error { font-size: 12px; color: var(--color-error-600, #e54430); margin: 4px 0 0; }

    /* ── Panel ── */
    .ms-panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 200;
      background: var(--color-stone-0, #fff);
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
      overflow: hidden;
    }

    /* Header */
    .ms-panel__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-stone-100, #fbfbfb);
      border-bottom: 1px solid var(--color-divider, #dee0eb);
    }

    /* Select-all custom checkbox */
    .ms-selectall {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--color-divider, #dee0eb);
      border-radius: 2px;
      background: #fff;
      cursor: pointer;
      position: relative;
      transition: border-color 0.15s, background 0.15s;
    }
    .ms-selectall--checked {
      background: var(--color-primary-500, #2c9c74);
      border-color: var(--color-primary-500, #2c9c74);
    }
    .ms-selectall--checked::after {
      content: '';
      display: block;
      width: 9px;
      height: 6px;
      border-left: 1.5px solid #fff;
      border-bottom: 1.5px solid #fff;
      transform: rotate(-45deg) translate(0, -1px);
    }
    .ms-selectall--indeterminate {
      background: var(--color-primary-500, #2c9c74);
      border-color: var(--color-primary-500, #2c9c74);
    }
    .ms-selectall--indeterminate::after {
      content: '';
      display: block;
      width: 8px;
      height: 1.5px;
      background: #fff;
    }

    /* Search */
    .ms-search-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-stone-0, #fff);
      border: 1px solid var(--color-stone-500, #bbbdc8);
      border-radius: var(--radius-sm);
      padding: 0 10px;
      height: 32px;
    }
    .ms-search__icon { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
    .ms-search {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: 14px;
      color: var(--color-text-primary);
      min-width: 0;
    }
    .ms-search::placeholder { color: var(--color-text-placeholder, #9c9ea8); }
    .ms-search__clear {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      color: var(--color-text-secondary);
      font-size: 12px;
      flex-shrink: 0;
    }

    /* ── List ── */
    .ms-panel__list {
      overflow-y: auto;
      padding: 8px 0;
    }

    /* ── Item ── */
    .ms-item {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 40px;
      padding: 8px 16px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .ms-item:hover { background: var(--color-hover-bg, #f7f7f7); }
    .ms-item--active { background: var(--color-primary-50, #ebf8ef); }
    .ms-item--active:hover { background: var(--color-selected-row-hover); }
    .ms-item--disabled { opacity: 0.4; cursor: default; }
    .ms-item--empty {
      color: var(--color-text-secondary);
      font-size: 14px;
      cursor: default;
      justify-content: center;
      height: 48px;
    }
    .ms-item--empty:hover { background: none; }

    /* Item custom checkbox */
    .ms-item__cb {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--color-divider, #dee0eb);
      border-radius: 2px;
      background: #fff;
      transition: border-color 0.15s, background 0.15s;
    }
    .ms-item__cb--checked {
      background: var(--color-primary-500, #2c9c74);
      border-color: var(--color-primary-500, #2c9c74);
    }
    .ms-item__cb--checked::after {
      content: '';
      display: block;
      width: 9px;
      height: 6px;
      border-left: 1.5px solid #fff;
      border-bottom: 1.5px solid #fff;
      transform: rotate(-45deg) translate(0, -1px);
    }
    .ms-item__cb--disabled { opacity: 0.45; }

    .ms-item__label {
      flex: 1;
      font-size: 15px;
      color: var(--color-text-secondary, #5f616a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 24px;
    }
    .ms-item--active .ms-item__label { color: var(--color-text-primary); }
  `],
})
export class MultiselectComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'Select options…';
  @Input() searchPlaceholder = 'Search…';
  @Input() options: MultiselectOption[] = [];
  @Input() maxHeight = '240px';
  @Input() maxChips = 2;
  @Input() showChips = true;
  @Input() required = false;
  @Input() disabled = false;
  @Input() state: 'default' | 'error' = 'default';
  @Input() errorText = '';
  @Input() helperText = '';

  /** Two-way binding for selected values array */
  @Input() values: string[] = [];
  @Output() valuesChange = new EventEmitter<string[]>();
  @Output() selectionChange = new EventEmitter<string[]>();

  selected: string[] = [];
  open = false;
  query = '';
  filtered: MultiselectOption[] = [];

  private onChange: (v: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.filtered = [...this.options];
    if (this.values?.length) {
      this.selected = [...this.values];
    }
  }

  // ControlValueAccessor
  writeValue(v: string[]): void { this.selected = v ?? []; }
  registerOnChange(fn: (v: string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  get triggerLabel(): string {
    if (this.selected.length === 0) return this.placeholder;
    if (this.showChips) return '';
    if (this.selected.length === 1) return this.labelOf(this.selected[0]);
    return `${this.selected.length} selected`;
  }

  get allChecked(): boolean {
    return this.filtered.filter(o => !o.disabled).every(o => this.selected.includes(o.value));
  }
  get someChecked(): boolean {
    return this.filtered.some(o => this.selected.includes(o.value));
  }

  labelOf(value: string): string {
    return this.options.find(o => o.value === value)?.label ?? value;
  }

  isSelected(value: string): boolean {
    return this.selected.includes(value);
  }

  toggle(): void {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) {
      this.query = '';
      this.filtered = [...this.options];
    }
    this.onTouched();
  }

  toggleOption(value: string): void {
    const idx = this.selected.indexOf(value);
    if (idx === -1) {
      this.selected = [...this.selected, value];
    } else {
      this.selected = this.selected.filter(v => v !== value);
    }
    this.emit();
  }

  toggleAll(): void {
    const eligible = this.filtered.filter(o => !o.disabled).map(o => o.value);
    if (this.allChecked) {
      this.selected = this.selected.filter(v => !eligible.includes(v));
    } else {
      const toAdd = eligible.filter(v => !this.selected.includes(v));
      this.selected = [...this.selected, ...toAdd];
    }
    this.emit();
  }

  onQuery(): void {
    const q = this.query.toLowerCase().trim();
    this.filtered = q
      ? this.options.filter(o => o.label.toLowerCase().includes(q))
      : [...this.options];
  }

  private emit(): void {
    this.onChange(this.selected);
    this.valuesChange.emit(this.selected);
    this.selectionChange.emit(this.selected);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) {
      this.open = false;
    }
  }
}
