import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChipComponent } from '../../chip/chip.component';
import { CheckboxComponent } from '../../checkbox/checkbox.component';
import { ButtonComponent } from '../../button/button.component';

/** wrap / stack — chips · select — a checklist card to pick several (Figma "What next - List V2 - multiple selection", 1352:49643). */
export type AiSuggestionsLayout = 'wrap' | 'stack' | 'select';
/** `send` fires immediately; `prefill` hands the text to the composer to edit. */
export type AiSuggestionsBehaviour = 'send' | 'prefill';

/**
 * Starter and follow-up prompt chips.
 * The point is to narrow, not to browse — anything past `max` is dropped.
 */
@Component({
  selector: 'fvdr-ai-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule, ChipComponent, CheckboxComponent, ButtonComponent],
  template: `
    <!-- Select: pick several, then send them as one follow-up -->
    <div class="pick" *ngIf="layout === 'select'; else chips" role="group" [attr.aria-label]="title || 'Suggestions'">
      <div class="pick__head">
        <span class="pick__title">{{ title }}</span>
        <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Dismiss" (clicked)="dismissed.emit()"></fvdr-btn>
      </div>
      <div class="pick__row" *ngFor="let item of visible">
        <fvdr-checkbox [checked]="picked.has(item)" (checkedChange)="togglePick(item)"></fvdr-checkbox>
        <span class="pick__label" (click)="togglePick(item)">{{ item }}</span>
      </div>
      <div class="pick__row" *ngIf="allowCustom">
        <fvdr-checkbox [checked]="!!custom.trim()" [disabled]="!custom.trim()" (checkedChange)="custom = ''"></fvdr-checkbox>
        <input class="pick__input" type="text" [placeholder]="customPlaceholder" [(ngModel)]="custom" (keydown.enter)="submit()" />
      </div>
      <div class="pick__foot">
        <span class="pick__count">{{ selection.length }} selected</span>
        <fvdr-btn variant="ghost" size="s" iconName="send" [iconOnly]="true" ariaLabel="Send" [disabled]="!selection.length" (clicked)="submit()"></fvdr-btn>
      </div>
    </div>

    <ng-template #chips>
    <div class="sugg" [class.sugg--stack]="layout === 'stack'">
      <fvdr-chip
        *ngFor="let item of visible"
        [label]="item"
        variant="grey"
        size="l"
        [clickable]="true"
        (clicked)="chosen.emit(item)"
      ></fvdr-chip>
    </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .sugg { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    /* Narrow shells stack instead of wrapping — a half-wrapped chip reads as broken. */
    .sugg--stack { flex-direction: column; align-items: stretch; flex-wrap: nowrap; }
    .sugg--stack fvdr-chip { display: block; }

    /* Select card */
    .pick {
      display: flex; flex-direction: column;
      padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
    }
    .pick__head { display: flex; align-items: center; justify-content: space-between; min-height: var(--space-8); }
    .pick__title { font-size: var(--text-label-m-size); line-height: var(--text-label-m-lh); font-weight: var(--text-label-m-weight); color: var(--color-text-primary); }
    .pick__row { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; cursor: pointer; }
    .pick__label { font-size: var(--text-body2-size); line-height: var(--text-body2-lh); color: var(--color-text-primary); }
    .pick__input {
      flex: 1; border: none; outline: none; background: transparent; padding: 0;
      font-family: var(--font-family); font-size: var(--text-body2-size); line-height: var(--text-body2-lh);
      color: var(--color-text-primary);
    }
    .pick__input::placeholder { color: var(--color-text-placeholder); }
    .pick__foot { display: flex; align-items: center; justify-content: space-between; min-height: var(--space-8); }
    .pick__count { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-placeholder); }
  `],
})
export class AiSuggestionsComponent {
  @Input() items: string[] = [];
  @Input() layout: AiSuggestionsLayout = 'wrap';
  @Input() behaviour: AiSuggestionsBehaviour = 'send';
  @Input() max = 4;

  /** Select layout: the clarifying question above the options. */
  @Input() title = '';
  /** Select layout: add a free-text "Suggest your request" row. */
  @Input() allowCustom = true;
  @Input() customPlaceholder = 'Suggest your request';

  @Output() chosen = new EventEmitter<string>();
  /** Select layout: the picked options (and the custom request, if typed). */
  @Output() submitted = new EventEmitter<string[]>();
  @Output() dismissed = new EventEmitter<void>();

  picked = new Set<string>();
  custom = '';

  togglePick(item: string): void { this.picked.has(item) ? this.picked.delete(item) : this.picked.add(item); }
  get selection(): string[] {
    const c = this.custom.trim();
    return c ? [...this.picked, c] : [...this.picked];
  }
  submit(): void {
    if (!this.selection.length) return;
    this.submitted.emit(this.selection);
    this.picked.clear();
    this.custom = '';
  }

  /**
   * Safe as a getter only because the items are strings: *ngFor tracks by item
   * identity, and equal strings compare equal, so the chips are reused rather
   * than rebuilt each change-detection pass. Switch to objects and this must
   * become a field recomputed on input change.
   */
  get visible(): string[] {
    return this.items.slice(0, this.max);
  }
}
