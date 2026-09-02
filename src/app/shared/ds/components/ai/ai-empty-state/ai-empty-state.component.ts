import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { AiComposerComponent } from '../ai-composer/ai-composer.component';
import { AiSuggestionsComponent } from '../ai-suggestions/ai-suggestions.component';

/**
 * The zero-message screen: Ideon mark, greeting, composer, scope-aware starters.
 * Composer and suggestions travel together so compact shells can dock the pair.
 */
@Component({
  selector: 'fvdr-ai-empty-state',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, AiComposerComponent, AiSuggestionsComponent],
  template: `
    <div class="empty" [class.empty--compact]="compact">
      <div class="empty__intro">
        <span class="empty__mark"><fvdr-icon name="ideon"></fvdr-icon></span>
        <h1 class="empty__title">{{ greeting }}</h1>
        <p class="empty__sub" *ngIf="subtitle">{{ subtitle }}</p>
      </div>

      <div class="empty__actions">
        <fvdr-ai-composer
          #composer
          class="empty__composer"
          [placeholder]="placeholder"
          [busy]="busy"
          [disabled]="disabled"
          (submitted)="promptSubmitted.emit($event)"
          (contextRequested)="contextRequested.emit()"
          (voiceRequested)="voiceRequested.emit()"
        ></fvdr-ai-composer>

        <fvdr-ai-suggestions
          *ngIf="suggestions.length"
          [items]="suggestions"
          [layout]="compact ? 'stack' : 'wrap'"
          (chosen)="promptSubmitted.emit($event)"
        ></fvdr-ai-suggestions>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); }

    .empty {
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      gap: var(--space-8);
      height: 100%;
      padding: var(--space-6);
    }

    .empty__intro { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; }
    .empty__mark { font-size: 40px; line-height: 1; color: var(--color-primary-500); }
    .empty__title {
      margin: 0;
      font-size: var(--font-size-2xl, 24px);
      font-weight: var(--font-weight-semi, 600);
      line-height: var(--line-height-tight, 32px);
      color: var(--color-text-primary);
    }
    .empty__sub {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
      max-width: 420px;
    }

    .empty__actions {
      display: flex; flex-direction: column; gap: var(--space-3);
      width: 100%; max-width: 680px;
    }

    /* Sidebar / floating shells: smaller mark, chips stack, less air. */
    .empty--compact { gap: var(--space-5); padding: var(--space-4); }
    .empty--compact .empty__mark { font-size: var(--font-size-5xl, 28px); }
    .empty--compact .empty__title { font-size: var(--font-size-lg, 16px); line-height: var(--line-height-normal, 22px); }
  `],
})
export class AiEmptyStateComponent {
  @Input() greeting = 'How can I help you today?';
  @Input() subtitle = '';
  @Input() placeholder = 'Ask AI assistant anything ...';
  @Input() suggestions: string[] = [];
  @Input() compact = false;
  @Input() busy = false;
  @Input() disabled = false;

  @Output() promptSubmitted = new EventEmitter<string>();
  @Output() contextRequested = new EventEmitter<void>();
  @Output() voiceRequested = new EventEmitter<void>();

  @ViewChild('composer') composer?: AiComposerComponent;

  focus(): void { this.composer?.focus(); }
}
