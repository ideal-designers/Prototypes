import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { AiComposerComponent } from '../ai-composer/ai-composer.component';
import { AiSuggestionsComponent } from '../ai-suggestions/ai-suggestions.component';
import { AiMarkdownComponent } from '../ai-markdown/ai-markdown.component';
import { AiActionsComponent, AiRating } from '../ai-actions/ai-actions.component';
import { ThinkingOrbsComponent } from '../thinking-orbs/thinking-orbs.component';

/**
 * The one-shot assistant, embedded in a product surface — "Ask about this
 * document" in the viewer, "Draft an answer" in Q&A, "Explain this" in the log.
 *
 * Prompt in, one answer out, with a way into the full conversation if the user
 * wants to keep going. No transcript, no history: the moment it needs those, it
 * should have been the panel.
 */
@Component({
  selector: 'fvdr-ai-inline-prompt',
  standalone: true,
  imports: [
    CommonModule,
    FvdrIconComponent,
    AiComposerComponent,
    AiSuggestionsComponent,
    AiMarkdownComponent,
    AiActionsComponent,
    ThinkingOrbsComponent,
  ],
  template: `
    <div class="inline">
      <div class="inline__head">
        <span class="inline__scope" [attr.title]="scopeLabel">
          <fvdr-icon name="ideon"></fvdr-icon>
          <span>{{ scopeLabel }}</span>
        </span>
        <button type="button" class="inline__close" *ngIf="dismissible" title="Close" aria-label="Close" (click)="dismissed.emit()">
          <fvdr-icon name="close"></fvdr-icon>
        </button>
      </div>

      <fvdr-ai-composer
        #composer
        [placeholder]="placeholder"
        [busy]="streaming"
        [showAddContext]="false"
        [showVoice]="false"
        (submitted)="promptSubmitted.emit($event)"
      ></fvdr-ai-composer>

      <fvdr-ai-suggestions
        *ngIf="suggestions.length && !answer && !streaming"
        [items]="suggestions"
        [max]="3"
        (chosen)="promptSubmitted.emit($event)"
      ></fvdr-ai-suggestions>

      <fvdr-thinking-orbs *ngIf="streaming && !answer" label="Reading the document…" [size]="28" [dots]="1.2"></fvdr-thinking-orbs>

      <div class="inline__answer" *ngIf="answer">
        <fvdr-ai-markdown [source]="answer" [streaming]="streaming"></fvdr-ai-markdown>

        <div class="inline__foot" *ngIf="!streaming">
          <fvdr-ai-actions
            [showRegenerate]="false"
            [rating]="rating"
            (copyRequested)="copyRequested.emit()"
            (rated)="rated.emit($event)"
          ></fvdr-ai-actions>
          <button type="button" class="inline__expand" (click)="expandRequested.emit()">Continue in assistant</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; max-width: 420px; font-family: var(--font-family); }

    .inline {
      display: flex; flex-direction: column; gap: var(--space-3);
      padding: var(--space-3);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg);
      background: var(--color-stone-0);
      box-shadow: var(--shadow-popover);
    }

    .inline__head { display: flex; align-items: center; gap: var(--space-2); }
    .inline__scope {
      display: flex; align-items: center; gap: var(--space-1);
      min-width: 0; flex: 1;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .inline__scope span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .inline__scope fvdr-icon { flex: 0 0 auto; color: var(--color-primary-500); }

    .inline__close {
      display: inline-flex; align-items: center; justify-content: center;
      flex: 0 0 auto;
      width: 24px; height: 24px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs, 12px);
    }
    .inline__close:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* An inline answer must not grow past the surface it is embedded in. */
    .inline__answer { display: flex; flex-direction: column; gap: var(--space-2); max-height: 320px; overflow-y: auto; }

    .inline__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .inline__expand {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-primary-500);
      cursor: pointer;
    }
    .inline__expand:hover { color: var(--color-primary-600); text-decoration: underline; }
  `],
})
export class AiInlinePromptComponent {
  @Input() placeholder = 'Ask about this document…';
  @Input({ required: true }) scopeLabel = '';
  @Input() suggestions: string[] = [];
  /** Markdown answer; empty until the first response arrives. */
  @Input() answer = '';
  @Input() streaming = false;
  @Input() rating: AiRating = null;
  @Input() dismissible = true;

  @Output() promptSubmitted = new EventEmitter<string>();
  @Output() expandRequested = new EventEmitter<void>();
  @Output() copyRequested = new EventEmitter<void>();
  @Output() rated = new EventEmitter<AiRating>();
  @Output() dismissed = new EventEmitter<void>();

  @ViewChild('composer') composer?: AiComposerComponent;

  focus(): void { this.composer?.focus(); }
}
