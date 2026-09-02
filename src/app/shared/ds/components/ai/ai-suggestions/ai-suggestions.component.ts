import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChipComponent } from '../../chip/chip.component';

export type AiSuggestionsLayout = 'wrap' | 'stack';
/** `send` fires immediately; `prefill` hands the text to the composer to edit. */
export type AiSuggestionsBehaviour = 'send' | 'prefill';

/**
 * Starter and follow-up prompt chips.
 * The point is to narrow, not to browse — anything past `max` is dropped.
 */
@Component({
  selector: 'fvdr-ai-suggestions',
  standalone: true,
  imports: [CommonModule, ChipComponent],
  template: `
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
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .sugg { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    /* Narrow shells stack instead of wrapping — a half-wrapped chip reads as broken. */
    .sugg--stack { flex-direction: column; align-items: stretch; flex-wrap: nowrap; }
    .sugg--stack fvdr-chip { display: block; }
  `],
})
export class AiSuggestionsComponent {
  @Input() items: string[] = [];
  @Input() layout: AiSuggestionsLayout = 'wrap';
  @Input() behaviour: AiSuggestionsBehaviour = 'send';
  @Input() max = 4;

  @Output() chosen = new EventEmitter<string>();

  get visible(): string[] {
    return this.items.slice(0, this.max);
  }
}
