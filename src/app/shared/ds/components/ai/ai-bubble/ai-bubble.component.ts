import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AiBubbleRole = 'user' | 'assistant';

/**
 * One conversation turn's container.
 *   · user      → right-aligned grey bubble, max 70% of the column
 *   · assistant → full-width, no bubble (the answer blocks carry their own structure)
 *
 * Content is projected, so the same shell holds plain text, an answer block or a
 * whole report. Pass `text` for the common single-string case.
 */
@Component({
  selector: 'fvdr-ai-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="turn" [class.turn--user]="role === 'user'" [class.turn--assistant]="role === 'assistant'">
      <div class="bubble" [class.bubble--plain]="role === 'assistant'">
        <span class="bubble__text" *ngIf="text">{{ text }}</span>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .turn { display: flex; flex-direction: column; gap: var(--space-3); }
    .turn--user { align-items: flex-end; }

    .bubble {
      max-width: 70%;
      background: var(--color-stone-200);
      color: var(--color-text-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
    }
    .bubble__text { white-space: pre-wrap; }

    /* Assistant turns are the reading column — no tint, no inset, full width. */
    .bubble--plain {
      max-width: 100%;
      background: transparent;
      border-radius: 0;
      padding: 0;
    }

    @media (max-width: 768px) {
      .bubble { max-width: 85%; }
      .bubble--plain { max-width: 100%; }
    }
  `],
})
export class AiBubbleComponent {
  @Input() role: AiBubbleRole = 'user';
  /** Convenience for plain-text turns; richer content goes through ng-content. */
  @Input() text = '';
}
