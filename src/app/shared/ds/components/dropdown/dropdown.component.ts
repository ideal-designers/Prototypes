import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, inject, OnDestroy, ViewChild, ElementRef as ElRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;    // Right-aligned secondary text (e.g. "UTC-5"), used for search
  icon?: string;
  disabled?: boolean;
  group?: string;
  aliases?: string[];   // Extra search terms (e.g. ["Kiev", "Kyiv"])
  badge?: string;       // Inline chip label (e.g. "Your location")
}

export type DropdownSize = 's' | 'm' | 'l';

/**
 * DS Dropdown control — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13756
 *
 * Timezone mode:
 *   <fvdr-dropdown
 *     [options]="timezoneOptions"
 *     [(ngModel)]="tz"
 *     [searchable]="true"
 *     searchPlaceholder="Search by city or timezone…"
 *     detectAutoLabel="Auto-detected"
 *     detectAutoSublabel="Kyiv · UTC+2"
 *     detectAutoValue="Europe/Kyiv"
 *     [showCurrentTime]="true"
 *     [panelMaxHeight]="300"
 *     (autoDetected)="setAutoTimezone()"
 *   />
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
         [class.dropdown--error]="error"
         (keydown)="onKeydown($event)">
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
          <!-- Auto-detected state -->
          <ng-container *ngIf="isAutoSelected && detectAutoLabel; else regularValue">
            <span class="dropdown__value">{{ detectAutoSublabel || detectAutoLabel }}</span>
            <span class="dropdown__trigger-auto-badge">{{ detectAutoLabel }}</span>
            <span *ngIf="showCurrentTime && currentTimeDisplay" class="dropdown__current-time">
              <fvdr-icon name="clock" />
              {{ currentTimeDisplay }}
            </span>
          </ng-container>
          <ng-template #regularValue>
            <span class="dropdown__value" [class.dropdown__value--placeholder]="!selectedLabel">
              {{ selectedLabel || placeholder }}
            </span>
            <span *ngIf="showCurrentTime && selectedSublabel" class="dropdown__trigger-sublabel">{{ selectedSublabel }}</span>
            <span *ngIf="showCurrentTime && currentTimeDisplay" class="dropdown__current-time">
              <fvdr-icon name="clock" />
              {{ currentTimeDisplay }}
            </span>
          </ng-template>
        </ng-template>

        <fvdr-icon name="chevron-down" class="dropdown__chevron" style="margin-left:auto" />
      </button>

      <!-- Hint / helper -->
      <span *ngIf="helperText" class="dropdown__hint" [class.dropdown__hint--error]="error">{{ helperText }}</span>

      <!-- Panel -->
      <div *ngIf="open" class="dropdown__panel" [style.max-height.px]="panelMaxHeight + 60">
        <!-- Search -->
        <div *ngIf="searchable" class="dropdown__search-wrap">
          <input #searchInput
                 class="dropdown__search"
                 type="text"
                 [placeholder]="searchPlaceholder"
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="onSearch()"
                 (keydown.arrowdown)="moveFocus(1, $event)"
                 (keydown.escape)="close()" />
        </div>

        <!-- Detect automatically row -->
        <div *ngIf="detectAutoLabel" class="dropdown__detect-row"
             [class.dropdown__detect-row--selected]="isAutoSelected"
             [class.dropdown__detect-row--active]="activeIndex === 0"
             (click)="selectAuto()"
             (mouseenter)="onAutoHover()"
             (mouseleave)="onOptionLeave()">
          <span class="dropdown__detect-dot"></span>
          <span class="dropdown__detect-label">{{ detectAutoSublabel || detectAutoLabel }}</span>
          <span class="dropdown__detect-badge">{{ detectAutoLabel }}</span>
        </div>

        <!-- Options list -->
        <div class="dropdown__list" [style.max-height.px]="panelMaxHeight">
          <ng-container *ngFor="let opt of filteredOptions; let i = index">
            <div *ngIf="opt.group && isFirstInGroup(opt)"
                 class="dropdown__group-label"
                 [class.dropdown__group-label--first]="isFirstGroup(opt)">{{ opt.group }}</div>
            <button
              class="dropdown__option"
              type="button"
              [class.dropdown__option--selected]="isSelected(opt.value)"
              [class.dropdown__option--active]="getListIndex(i) === activeIndex"
              [disabled]="opt.disabled"
              (click)="select(opt)"
              (mouseenter)="onOptionHover(opt)"
              (mouseleave)="onOptionLeave()"
            >
              <fvdr-icon *ngIf="opt.icon" [name]="$any(opt.icon)" class="dropdown__opt-icon" />
              <span class="dropdown__opt-label">{{ opt.label }}</span>
              <span *ngIf="opt.badge" class="dropdown__opt-badge">{{ opt.badge }}</span>
              <span class="dropdown__opt-meta">
                <span *ngIf="opt.sublabel" class="dropdown__opt-sublabel">{{ opt.sublabel }}</span>
                <span *ngIf="showCurrentTime && liveTimes[opt.value]" class="dropdown__opt-time">
                  <fvdr-icon name="clock" />{{ liveTimes[opt.value] }}
                </span>
              </span>
            </button>
          </ng-container>
          <!-- Empty state -->
          <div *ngIf="!filteredOptions.length" class="dropdown__empty">
            <span>No results for "{{ searchQuery }}"</span>
            <button class="dropdown__empty-clear" type="button" (click)="clearSearch()">Clear</button>
          </div>
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
    .dropdown--m .dropdown__trigger:has(.dropdown__chips) { height: auto; min-height: 40px; padding-top: 6px; padding-bottom: 6px; }
    .dropdown--l .dropdown__trigger:has(.dropdown__chips) { height: auto; min-height: 48px; padding-top: 8px; padding-bottom: 8px; }

    .dropdown__icon-left { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }

    .dropdown__value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-primary); }
    .dropdown__value--placeholder { color: var(--color-text-placeholder); }

    /* Auto badge in trigger */
    .dropdown__trigger-auto-badge {
      display: inline-flex;
      align-items: center;
      height: 18px;
      padding: 0 6px;
      border-radius: 9px;
      background: var(--color-primary-50);
      color: var(--color-primary-600);
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
      border: 1px solid rgba(44,156,116,0.2);
    }

    /* UTC offset sublabel in trigger (e.g. "UTC-5") */
    .dropdown__trigger-sublabel {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Live time in trigger */
    .dropdown__current-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dropdown__current-time fvdr-icon { font-size: 12px; }

    .dropdown__chevron {
      font-size: 16px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .dropdown--open .dropdown__chevron { transform: rotate(180deg); }

    /* Chips */
    .dropdown__chips { flex: 1; display: flex; flex-wrap: wrap; gap: var(--space-1); min-width: 0; }
    .dropdown__chip {
      display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 var(--space-3);
      border-radius: var(--radius-md); background: var(--color-stone-200, #eceef9);
      font-size: var(--text-caption1-size, 14px); color: var(--color-text-primary); white-space: nowrap;
    }
    .dropdown__chip-remove {
      display: inline-flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer; padding: 0;
      color: var(--color-text-secondary); font-size: 12px; line-height: 1;
    }
    .dropdown__chip-remove:hover { color: var(--color-text-primary); }

    /* Hint */
    .dropdown__hint { font-family: var(--font-family); font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .dropdown__hint--error { color: var(--color-error-600); }

    /* Panel */
    .dropdown__panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0; z-index: 1000;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      overflow: hidden;
    }

    /* Search */
    .dropdown__search-wrap { padding: var(--space-2); border-bottom: 1px solid var(--color-stone-400); }
    .dropdown__search {
      width: 100%; height: 40px;
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-3);
      font-family: var(--font-family);
      font-size: var(--text-base-m-size);
      background: var(--color-stone-0);
      outline: none; box-sizing: border-box;
    }
    .dropdown__search:focus { border-color: var(--color-primary-500); }

    /* Detect automatically row */
    .dropdown__detect-row {
      display: flex; align-items: center; gap: var(--space-2);
      height: 40px; padding: 0 var(--space-4); cursor: pointer;
      border-bottom: 1px solid var(--color-divider); transition: background 0.1s;
    }
    .dropdown__detect-row:hover,
    .dropdown__detect-row--active { background: var(--color-hover-bg); }
    .dropdown__detect-row--selected { background: var(--color-primary-50); }
    .dropdown__detect-row--selected:hover,
    .dropdown__detect-row--selected.dropdown__detect-row--active { background: var(--color-primary-50); filter: brightness(0.97); }

    .dropdown__detect-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-primary-500); flex-shrink: 0;
      box-shadow: 0 0 0 2px var(--color-primary-50);
    }
    .dropdown__detect-label {
      font-family: var(--font-family); font-size: var(--text-base-s-size); color: var(--color-text-primary); flex: 1;
    }
    .dropdown__detect-row--selected .dropdown__detect-label { color: var(--color-primary-600); font-weight: 600; }

    .dropdown__detect-badge {
      display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
      border-radius: 9px; background: var(--color-primary-50); color: var(--color-primary-600);
      font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
      border: 1px solid rgba(44,156,116,0.2);
    }

    /* List */
    .dropdown__list { overflow-y: auto; padding: var(--space-1) 0; }

    .dropdown__group-label {
      padding: var(--space-3) var(--space-4) var(--space-1);
      margin-top: var(--space-1);
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-placeholder);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-top: 1px solid var(--color-divider);
    }
    .dropdown__group-label--first { margin-top: 0; border-top: none; padding-top: var(--space-1); }

    .dropdown__option {
      display: flex; align-items: center; gap: var(--space-2);
      width: 100%; height: 40px; padding: 0 var(--space-4);
      background: transparent; border: none; cursor: pointer;
      font-family: var(--font-family); font-size: var(--text-base-s-size);
      color: var(--color-text-primary); text-align: left; transition: background 0.1s;
    }
    .dropdown__option:hover:not(:disabled),
    .dropdown__option--active:not(:disabled) { background: var(--color-hover-bg); }
    .dropdown__option--selected { background: var(--color-primary-50); color: var(--color-primary-500); font-weight: var(--text-base-s-sb-weight); }
    .dropdown__option--selected:hover,
    .dropdown__option--selected.dropdown__option--active { background: var(--color-primary-50); filter: brightness(0.97); }
    .dropdown__option:disabled { opacity: 0.45; cursor: not-allowed; }
    .dropdown__opt-icon { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }
    .dropdown__opt-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dropdown__opt-meta {
      display: flex; align-items: center; gap: var(--space-2);
      flex-shrink: 0; margin-left: auto; padding-left: var(--space-2);
    }
    .dropdown__opt-sublabel {
      font-size: var(--text-caption1-size); color: var(--color-text-secondary);
      white-space: nowrap; font-variant-numeric: tabular-nums;
    }
    .dropdown__opt-time {
      display: flex; align-items: center; gap: 3px;
      font-size: var(--text-caption1-size); color: var(--color-text-secondary);
      white-space: nowrap; font-variant-numeric: tabular-nums;
    }
    .dropdown__opt-time fvdr-icon { font-size: 11px; }
    .dropdown__option--selected .dropdown__opt-sublabel,
    .dropdown__option--selected .dropdown__opt-time { color: var(--color-primary-500); opacity: 0.8; }
    .dropdown__opt-badge {
      display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
      border-radius: 9px; background: var(--color-primary-50); color: var(--color-primary-500);
      font-size: 11px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
    }

    /* Empty state */
    .dropdown__empty {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-base-s-size); color: var(--color-text-secondary);
    }
    .dropdown__empty-clear {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: var(--text-base-s-size); color: var(--color-primary-500);
      font-family: var(--font-family); font-weight: 500;
    }
    .dropdown__empty-clear:hover { color: var(--color-primary-600); }
  `],
})
export class DropdownComponent implements ControlValueAccessor, OnDestroy {
  private elRef = inject(ElementRef);
  @ViewChild('searchInput') searchInputRef?: ElRef;

  @Input() label = '';
  @Input() placeholder = 'Select...';
  @Input() options: DropdownOption[] = [];
  @Input() size: DropdownSize = 'm';
  @Input() disabled = false;
  @Input() multi = false;
  @Input() searchable = false;
  @Input() searchPlaceholder = 'Search...';
  @Input() error = false;
  @Input() helperText = '';
  @Input() iconLeft: FvdrIconName | '' = '';
  @Input() value: string | string[] = '';
  @Input() detectAutoLabel = '';
  @Input() detectAutoSublabel = '';
  @Input() detectAutoValue = '';
  @Input() showCurrentTime = false;
  @Input() panelMaxHeight = 240;
  @Output() valueChange = new EventEmitter<string | string[]>();
  @Output() autoDetected = new EventEmitter<void>();

  open = false;
  searchQuery = '';
  filteredOptions: DropdownOption[] = [];
  isAutoSelected = false;
  currentTimeDisplay = '';
  liveTimes: { [key: string]: string } = {};  // IANA → HH:MM
  activeIndex = -1;  // -1=none, 0=detect-auto or first option, ...

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(): void {
    this.filteredOptions = [...(this.options ?? [])];
    if (this.showCurrentTime) this.startClock();
  }

  ngOnInit(): void {
    this.filteredOptions = [...(this.options ?? [])];
    if (this.detectAutoLabel && !this.value) this.isAutoSelected = true;
    if (this.showCurrentTime) this.startClock();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private startClock(): void {
    this.updateTime();
    this.updateLiveTimes();
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      this.updateTime();
      this.updateLiveTimes();
    }, 60_000);
  }

  private updateTime(): void {
    const tz = this.isAutoSelected && this.detectAutoValue
      ? this.detectAutoValue
      : (Array.isArray(this.value) ? this.value[0] : this.value);
    if (!tz) { this.currentTimeDisplay = ''; return; }
    try {
      const fmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
      this.currentTimeDisplay = fmt.format(new Date());
    } catch {
      this.currentTimeDisplay = '';
    }
  }

  private updateLiveTimes(): void {
    if (!this.showCurrentTime) return;
    const now = new Date();
    const map: { [key: string]: string } = {};
    for (const opt of this.options) {
      if (!opt.value) continue;
      try {
        const fmt = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: opt.value });
        map[opt.value] = fmt.format(now);
      } catch {
        map[opt.value] = opt.sublabel ?? '';
      }
    }
    this.liveTimes = map;
  }

  get selectedLabel(): string {
    if (this.isAutoSelected && this.detectAutoLabel) return this.detectAutoLabel;
    if (Array.isArray(this.value)) {
      const labels = this.options.filter(o => (this.value as string[]).includes(o.value)).map(o => o.label);
      return labels.length ? labels.join(', ') : '';
    }
    return this.options.find(o => o.value === this.value)?.label ?? '';
  }

  get selectedSublabel(): string {
    if (this.isAutoSelected) return '';
    const val = Array.isArray(this.value) ? this.value[0] : this.value;
    return this.options.find(o => o.value === val)?.sublabel ?? '';
  }

  get selectedValues(): string[] {
    return Array.isArray(this.value) ? this.value : (this.value ? [this.value] : []);
  }

  labelOf(val: string): string { return this.options.find(o => o.value === val)?.label ?? val; }

  isSelected(val: string): boolean {
    return Array.isArray(this.value) ? this.value.includes(val) : this.value === val;
  }

  isFirstInGroup(opt: DropdownOption): boolean {
    return this.filteredOptions.findIndex(o => o.group === opt.group) === this.filteredOptions.indexOf(opt);
  }

  isFirstGroup(opt: DropdownOption): boolean {
    const firstGrouped = this.filteredOptions.find(o => !!o.group);
    return firstGrouped?.group === opt.group;
  }

  // Keyboard navigation index: 0=detect-auto (if present), then options
  get autoRowOffset(): number { return this.detectAutoLabel ? 1 : 0; }
  getListIndex(optIdx: number): number { return optIdx + this.autoRowOffset; }

  toggle(): void {
    this.open = !this.open;
    this.activeIndex = -1;
    if (this.open) {
      setTimeout(() => (this.searchInputRef?.nativeElement as HTMLInputElement)?.focus(), 0);
    }
  }

  close(): void { this.open = false; this.activeIndex = -1; }

  onKeydown(e: KeyboardEvent): void {
    if (!this.open) return;
    const total = this.autoRowOffset + this.filteredOptions.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, total - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, this.searchable ? -1 : 0);
      if (this.activeIndex === -1) setTimeout(() => (this.searchInputRef?.nativeElement as HTMLInputElement)?.focus(), 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.activeIndex === 0 && this.detectAutoLabel) { this.selectAuto(); }
      else if (this.activeIndex >= this.autoRowOffset) {
        const opt = this.filteredOptions[this.activeIndex - this.autoRowOffset];
        if (opt) this.select(opt);
      }
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  moveFocus(dir: number, e: Event): void {
    e.preventDefault();
    this.activeIndex = Math.max(0, this.activeIndex + dir);
  }

  select(opt: DropdownOption): void {
    this.isAutoSelected = false;
    if (this.multi) {
      const arr = Array.isArray(this.value) ? [...this.value] : [];
      const idx = arr.indexOf(opt.value);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(opt.value);
      this.value = arr;
    } else {
      this.value = opt.value;
      this.open = false;
      this.activeIndex = -1;
    }
    this.valueChange.emit(this.value);
    this.onChange(this.value);
    if (this.showCurrentTime) this.updateTime();
  }

  selectAuto(): void {
    this.isAutoSelected = true;
    this.open = false;
    this.activeIndex = -1;
    this.autoDetected.emit();
    if (this.showCurrentTime) this.updateTime();
  }

  onOptionHover(opt: DropdownOption): void {
    if (!this.showCurrentTime) return;
    this.currentTimeDisplay = this.liveTimes[opt.value] ?? '';
  }

  onAutoHover(): void {
    if (!this.showCurrentTime || !this.detectAutoValue) return;
    this.currentTimeDisplay = this.liveTimes[this.detectAutoValue] ?? '';
  }

  onOptionLeave(): void {
    if (!this.showCurrentTime) return;
    this.updateTime();
  }

  removeChip(val: string, event: Event): void {
    event.stopPropagation();
    const arr = Array.isArray(this.value) ? this.value.filter(v => v !== val) : [];
    this.value = arr;
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  onSearch(): void {
    const normalize = (s: string) => s.toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, '');
    const q = normalize(this.searchQuery);
    if (!q) { this.filteredOptions = [...this.options]; return; }
    this.filteredOptions = this.options.filter(o =>
      normalize(o.label).includes(q) ||
      normalize(o.sublabel ?? '').includes(q) ||
      (o.aliases?.some(a => normalize(a).includes(q)))
    );
    this.activeIndex = -1;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.activeIndex = -1;
    setTimeout(() => (this.searchInputRef?.nativeElement as HTMLInputElement)?.focus(), 0);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.close();
  }

  private onChange: (v: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string | string[]): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string | string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
