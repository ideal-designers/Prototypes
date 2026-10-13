import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';

/**
 * Typed-or-imported term list (PRD #3, #4). One component for "Custom terms" and
 * "Do not redact terms", so the two lists behave and look identical everywhere.
 */
@Component({
  selector: 'fvdr-br-tag-input',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="tags" [class.tags--focus]="focused" (click)="input.focus()">
      <fvdr-chip *ngFor="let t of items" [label]="t" variant="indigo" size="s" [removable]="true" (removed)="remove(t)"></fvdr-chip>
      <input #input class="tags__input" [placeholder]="items.length ? '' : placeholder" [attr.aria-label]="ariaLabel"
             (keydown)="onKey($event)" (paste)="onPaste($event)" (blur)="focused = false; commit()" (focus)="focused = true" />
    </div>
    <div class="foot">
      <span class="foot__hint">Use comma or enter to separate</span>
      <button type="button" class="foot__import" (click)="file.click()">
        <fvdr-icon name="upload"></fvdr-icon>Import
      </button>
      <input #file type="file" accept=".txt,.csv" hidden (change)="onFile($event)" />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .tags { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); align-items: center; min-height: 40px;
      padding: var(--space-2) var(--space-3); background: var(--color-stone-0); border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm); cursor: text; }
    .tags:hover { border-color: var(--color-stone-500); }
    .tags--focus { border-color: var(--color-primary-500); }
    .tags__input { flex: 1 1 120px; min-width: 80px; border: none; outline: none; background: transparent;
      font-family: var(--font-family); font-size: var(--font-size-base); color: var(--color-text-primary); }
    /* term chips: 14px label everywhere (the DS size-s chip is 12px) */
    .tags fvdr-chip ::ng-deep .chip { font-size: var(--font-size-base); line-height: 20px; }
    .tags__input::placeholder { color: var(--color-text-placeholder); }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-1); }
    .foot__hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .foot__import { display: inline-flex; align-items: center; gap: var(--space-1); border: none; background: transparent;
      padding: 0; cursor: pointer; font-family: var(--font-family); font-size: var(--text-caption1-size);
      color: var(--color-primary-600); }
    .foot__import:hover { color: var(--color-primary-700); text-decoration: underline; }
  `],
})
export class BrTagInputComponent {
  @Input() items: string[] = [];
  @Input() placeholder = 'Add term';
  @Input() ariaLabel = 'Terms';
  @Output() itemsChange = new EventEmitter<string[]>();
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;
  focused = false;

  onKey(e: KeyboardEvent): void {
    const el = this.input.nativeElement;
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); this.commit(); }
    else if (e.key === 'Backspace' && !el.value && this.items.length) this.emitItems(this.items.slice(0, -1));
  }

  onPaste(e: ClipboardEvent): void {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!/[,\n;]/.test(text)) return;
    e.preventDefault();
    this.add(text);
  }

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then(t => this.add(t));
    (e.target as HTMLInputElement).value = '';
  }

  commit(): void {
    const el = this.input.nativeElement;
    if (el.value.trim()) { this.add(el.value); el.value = ''; }
  }

  remove(t: string): void { this.emitItems(this.items.filter(x => x !== t)); }

  private add(raw: string): void {
    const next = [...this.items];
    for (const part of raw.split(/[,\n;]/).map(s => s.trim()).filter(Boolean)) {
      if (!next.some(x => x.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    this.emitItems(next);
  }

  private emitItems(next: string[]): void { this.items = next; this.itemsChange.emit(next); }
}
