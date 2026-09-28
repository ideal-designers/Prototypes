import {
  Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, forwardRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FileIconComponent, FvdrFileType } from '../file-icon/file-icon.component';

/** A document or folder matched while the user types. */
export interface SmartSearchResult {
  id: string;
  name: string;
  type: FvdrFileType;
  /** Room index, e.g. "5.5.1". */
  index?: string;
}

type ItemKind = 'recent' | 'ai' | 'result' | 'more';
interface MenuItem { kind: ItemKind; label: string; result?: SmartSearchResult }

/**
 * Smart search — the Documents search field that also takes a question for AI.
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › Components › Smart search (208:22423),
 * menu states on "↳ Documnets page" (216:1310, 208:22534, 216:1980, 238:17451).
 *
 * The menu shows, depending on what is typed:
 *   · empty      → Recents (if any) + "Try asking AI" prompts
 *   · typing     → "Results: N" — live name matches, capped at `maxResults`, + "Show more"
 * and always ends with a trust note (`footerNote`) about access rights.
 * Enter submits the text as-is: the host decides whether it becomes a plain
 * search, a keyword search or an AI Overview.
 *
 * Usage:
 *   <fvdr-smart-search [(ngModel)]="q" [recents]="recents" [aiSuggestions]="prompts"
 *     [results]="matches" [resultsTotal]="12"
 *     (submitted)="run($event)" (resultPicked)="open($event)" />
 */
@Component({
  selector: 'fvdr-smart-search',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FileIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SmartSearchComponent), multi: true },
  ],
  template: `
    <div class="ss" [class.ss--open]="menuOpen" [class.ss--disabled]="disabled">
      <div class="ss__field" [class.ss__field--focused]="focused" (click)="inputRef.focus()">
        <fvdr-icon name="ai-search" class="ss__icon"></fvdr-icon>
        <input
          #inputRef
          class="ss__input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="menuOpen"
          [attr.aria-activedescendant]="activeIndex >= 0 ? uid + '-opt-' + activeIndex : null"
          [attr.aria-controls]="uid + '-menu'"
          [attr.aria-label]="ariaLabel"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (keydown)="onKeydown($event)"
        />
        <button *ngIf="value && !disabled" type="button" class="ss__btn" title="Clear search"
                aria-label="Clear search" (click)="clear($event)">
          <fvdr-icon name="close"></fvdr-icon>
        </button>
        <button *ngIf="filter" type="button" class="ss__btn ss__btn--filter" title="Search filters"
                aria-label="Search filters" [disabled]="disabled" (click)="$event.stopPropagation(); filterClick.emit()">
          <fvdr-icon name="settings-filter"></fvdr-icon>
        </button>
      </div>

      <div *ngIf="menuOpen" class="ss__menu" role="listbox" [id]="uid + '-menu'">
        <ng-container *ngIf="!value.trim(); else typing">
          <ng-container *ngIf="recents.length">
            <div class="ss__title">{{ recentsTitle }}</div>
            <ng-container *ngFor="let it of items; let i = index; trackBy: trackItem">
              <button *ngIf="it.kind === 'recent'" type="button" class="ss__item" role="option"
                      [id]="uid + '-opt-' + i" [class.ss__item--active]="i === activeIndex"
                      (mousedown)="$event.preventDefault()" (mouseenter)="activeIndex = i" (click)="pick(it)">
                <fvdr-icon name="history" class="ss__item-icon ss__item-icon--muted"></fvdr-icon>
                <span class="ss__item-label">{{ it.label }}</span>
              </button>
            </ng-container>
          </ng-container>
          <ng-container *ngIf="aiSuggestions.length">
            <div class="ss__title">{{ aiTitle }}</div>
            <ng-container *ngFor="let it of items; let i = index; trackBy: trackItem">
              <button *ngIf="it.kind === 'ai'" type="button" class="ss__item" role="option"
                      [id]="uid + '-opt-' + i" [class.ss__item--active]="i === activeIndex"
                      (mousedown)="$event.preventDefault()" (mouseenter)="activeIndex = i" (click)="pick(it)">
                <fvdr-icon name="sparkle" class="ss__item-icon ss__item-icon--ai"></fvdr-icon>
                <span class="ss__item-label">{{ it.label }}</span>
              </button>
            </ng-container>
          </ng-container>
        </ng-container>

        <ng-template #typing>
          <div class="ss__title">Results: {{ resultsTotal ?? results.length }}</div>
          <div *ngIf="!results.length" class="ss__empty">
            No names match — press Enter to ask AI across the room.
          </div>
          <ng-container *ngFor="let it of items; let i = index; trackBy: trackItem">
            <button *ngIf="it.kind === 'result'" type="button" class="ss__item" role="option"
                    [id]="uid + '-opt-' + i" [class.ss__item--active]="i === activeIndex"
                    (mousedown)="$event.preventDefault()" (mouseenter)="activeIndex = i" (click)="pick(it)">
              <fvdr-file-icon class="ss__item-file" [type]="it.result!.type"></fvdr-file-icon>
              <span class="ss__item-index" *ngIf="it.result!.index">{{ it.result!.index }}</span>
              <span class="ss__item-label">{{ it.label }}</span>
            </button>
            <button *ngIf="it.kind === 'more'" type="button" class="ss__more" role="option"
                    [id]="uid + '-opt-' + i" [class.ss__more--active]="i === activeIndex"
                    (mousedown)="$event.preventDefault()" (mouseenter)="activeIndex = i" (click)="pick(it)">
              Show more
            </button>
          </ng-container>
        </ng-template>

        <div *ngIf="footerNote" class="ss__note">
          <fvdr-icon name="lock-close" class="ss__note-icon"></fvdr-icon>
          <span>{{ footerNote }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; font-family: var(--font-family); }
    .ss { position: relative; width: 100%; }

    /* Field — same box as fvdr-search (M, 40px) */
    .ss__field {
      display: flex; align-items: center; gap: var(--space-2);
      height: 40px; padding: 0 var(--space-3) 0 var(--space-4);
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      cursor: text;
      transition: border-color 0.15s ease;
    }
    .ss__field:hover, .ss__field--focused { border-color: var(--color-primary-500); }
    .ss--disabled .ss__field { opacity: 0.45; pointer-events: none; }

    .ss__icon { flex: 0 0 auto; font-size: var(--font-size-lg, 16px); color: var(--color-stone-900); }
    .ss__input {
      flex: 1; min-width: 0; height: 100%;
      border: none; outline: none; background: transparent; padding: 0;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-base, 20px);
      color: var(--color-text-primary);
    }
    .ss__input::placeholder { color: var(--color-text-placeholder); }

    .ss__btn {
      flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; padding: 0; border: none; background: transparent;
      color: var(--color-text-secondary); cursor: pointer;
      font-size: var(--font-size-base, 14px); border-radius: var(--radius-sm);
    }
    .ss__btn:hover { color: var(--color-text-primary); }
    .ss__btn--filter { font-size: var(--font-size-lg, 16px); }

    /* Menu — wider than the field, right-aligned to it (Figma: 464 vs 380) */
    .ss__menu {
      position: absolute; top: calc(100% + var(--space-1)); right: 0; z-index: 300;
      width: max(100%, 464px); max-width: calc(100vw - var(--space-8));
      padding: var(--space-1) 0;
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popup, 0 4px 16px rgba(0, 0, 0, 0.12));
      box-sizing: border-box;
    }
    .ss__title {
      padding: var(--space-3) var(--space-4) var(--space-2);
      font-size: var(--text-caption1-size, 12px); line-height: 16px;
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }
    .ss__item {
      display: flex; align-items: center; gap: var(--space-2);
      width: 100%; height: 32px; padding: 0 var(--space-4);
      border: none; background: transparent; cursor: pointer; text-align: left;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px);
      line-height: 20px; color: var(--color-text-primary);
    }
    .ss__item--active { background: var(--color-hover-bg); }
    .ss__item-icon { flex: 0 0 auto; font-size: var(--font-size-lg, 16px); }
    .ss__item-icon--muted { color: var(--color-text-placeholder); }
    .ss__item-icon--ai { color: var(--color-primary-500); }
    .ss__item-file { flex: 0 0 auto; display: inline-flex; }
    .ss__item-index { flex: 0 0 auto; color: var(--color-text-primary); }
    .ss__item-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .ss__more {
      display: block; width: 100%; height: 28px; padding: 0 var(--space-4);
      border: none; background: transparent; cursor: pointer; text-align: left;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px);
      color: var(--color-primary-500);
    }
    .ss__more:hover, .ss__more--active { color: var(--color-primary-600); text-decoration: underline; }

    .ss__empty {
      padding: var(--space-1) var(--space-4) var(--space-2);
      font-size: var(--font-size-base, 14px); color: var(--color-text-secondary);
    }

    .ss__note {
      display: flex; align-items: center; gap: var(--space-1);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-caption1-size, 12px); line-height: 16px;
      color: var(--color-text-secondary);
    }
    .ss__note-icon { flex: 0 0 auto; font-size: var(--text-caption1-size, 12px); color: var(--color-text-placeholder); }
  `],
})
export class SmartSearchComponent implements ControlValueAccessor {
  private static seq = 0;
  private host = inject(ElementRef<HTMLElement>);

  @Input() placeholder = 'Smart search';
  @Input() ariaLabel = 'Search documents or ask AI';
  @Input() disabled = false;
  /** Shows the search-settings button at the right edge. */
  @Input() filter = true;
  /** Earlier queries — shown only while the field is empty. */
  @Input() recents: string[] = [];
  /** Starter questions for AI — shown only while the field is empty. */
  @Input() aiSuggestions: string[] = [];
  /** Live name matches for the typed text. */
  @Input() results: SmartSearchResult[] = [];
  /** Total matches when `results` is a capped slice — drives "Results: N" and "Show more". */
  @Input() resultsTotal?: number;
  @Input() maxResults = 5;
  @Input() recentsTitle = 'Recents';
  @Input() aiTitle = 'Try asking AI';
  /** Trust note pinned to the bottom of the menu. Empty string hides it. */
  @Input() footerNote = 'Every answer is built from documents you already have access.';

  /** Enter, or a recent / AI prompt picked from the menu. */
  @Output() submitted = new EventEmitter<string>();
  @Output() resultPicked = new EventEmitter<SmartSearchResult>();
  @Output() showMore = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();

  @ViewChild('inputRef', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  readonly uid = `fvdr-ss-${++SmartSearchComponent.seq}`;
  value = '';
  focused = false;
  menuOpen = false;
  activeIndex = -1;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Flat list behind the menu, in visual order — keeps arrow-key navigation simple. */
  get items(): MenuItem[] {
    if (!this.value.trim()) {
      return [
        ...this.recents.map(label => ({ kind: 'recent' as const, label })),
        ...this.aiSuggestions.map(label => ({ kind: 'ai' as const, label })),
      ];
    }
    const shown = this.results.slice(0, this.maxResults);
    const total = this.resultsTotal ?? this.results.length;
    const list: MenuItem[] = shown.map(r => ({ kind: 'result' as const, label: r.name, result: r }));
    if (total > shown.length) list.push({ kind: 'more', label: 'Show more' });
    return list;
  }

  /** `items` is rebuilt on every read — track by content so hover doesn't re-create the
   *  button under the pointer (which would swallow the click between mousedown and mouseup). */
  trackItem = (_: number, it: MenuItem) => `${it.kind}:${it.result?.id ?? it.label}`;

  onFocus(): void {
    this.focused = true;
    this.menuOpen = true;
    this.activeIndex = -1;
  }

  onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.onChange(this.value);
    this.menuOpen = true;
    this.activeIndex = -1;
  }

  onKeydown(e: KeyboardEvent): void {
    const count = this.items.length;
    if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      this.menuOpen = true;
      this.activeIndex = (this.activeIndex + 1) % count;
    } else if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      this.activeIndex = this.activeIndex <= 0 ? count - 1 : this.activeIndex - 1;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = this.activeIndex >= 0 ? this.items[this.activeIndex] : undefined;
      if (it) this.pick(it);
      else if (this.value.trim()) this.submit(this.value.trim());
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  pick(it: MenuItem): void {
    if (it.kind === 'result' && it.result) {
      this.resultPicked.emit(it.result);
      this.close();
    } else if (it.kind === 'more') {
      this.showMore.emit(this.value.trim());
      this.close();
    } else {
      this.setValue(it.label);
      this.submit(it.label);
    }
  }

  clear(e: Event): void {
    e.stopPropagation();
    this.setValue('');
    this.cleared.emit();
    this.inputRef.nativeElement.focus();
  }

  /** Close the menu and drop focus — the host calls this after it takes over (e.g. opens results). */
  close(): void {
    this.menuOpen = false;
    this.activeIndex = -1;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMousedown(e: MouseEvent): void {
    if (!this.host.nativeElement.contains(e.target as Node)) {
      this.close();
      if (this.focused) { this.focused = false; this.onTouched(); }
    }
  }

  private submit(q: string): void {
    this.submitted.emit(q);
    this.close();
    this.inputRef.nativeElement.blur();
    this.focused = false;
  }

  private setValue(v: string): void {
    this.value = v;
    this.onChange(v);
  }

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
