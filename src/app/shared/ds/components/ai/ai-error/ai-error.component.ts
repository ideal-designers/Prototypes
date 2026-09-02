import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { ButtonComponent } from '../../button/button.component';

export type AiErrorVariant = 'timeout' | 'rate-limit' | 'unavailable' | 'permission' | 'generic';

const DEFAULT_MESSAGE: Record<AiErrorVariant, string> = {
  'timeout':     'The assistant took too long to answer.',
  'rate-limit':  'Too many questions at once.',
  'unavailable': 'The assistant is temporarily unavailable.',
  'permission':  'You do not have access to the documents needed to answer this.',
  'generic':     'Something went wrong while answering.',
};

const DEFAULT_HINT: Record<AiErrorVariant, string> = {
  'timeout':     'Narrowing the scope usually helps.',
  'rate-limit':  'Try again in a moment.',
  'unavailable': 'Nothing was lost — your question is still in the transcript.',
  'permission':  'Ask a data room administrator if you need access.',
  'generic':     '',
};

/**
 * The failure state of a turn. Lives inside the transcript, not in a toast: the
 * prompt stays recoverable and there is exactly one way forward. Never blames
 * the user, never shows a stack trace.
 */
@Component({
  selector: 'fvdr-ai-error',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <div class="err">
      <fvdr-icon class="err__icon" name="attention"></fvdr-icon>
      <div class="err__body">
        <p class="err__message">{{ resolvedMessage }}</p>
        <p class="err__hint" *ngIf="resolvedHint">{{ resolvedHint }}</p>
      </div>
      <fvdr-btn
        *ngIf="retryable && variant !== 'permission'"
        class="err__retry"
        variant="secondary"
        size="s"
        label="Retry"
        (clicked)="retried.emit()"
      ></fvdr-btn>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .err {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-100);
    }

    /* Colour is carried by the icon alone — a full red fill would read as a
       system failure rather than one answer that needs another try. */
    .err__icon { flex: 0 0 auto; color: var(--color-error-600); font-size: var(--font-size-lg, 16px); line-height: 22px; }

    .err__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .err__message {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }
    .err__hint {
      margin: 0;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .err__retry { flex: 0 0 auto; }
  `],
})
export class AiErrorComponent {
  @Input() variant: AiErrorVariant = 'generic';
  /** Overrides the variant's default copy. */
  @Input() message = '';
  @Input() hint = '';
  @Input() retryable = true;

  @Output() retried = new EventEmitter<void>();

  get resolvedMessage(): string {
    return this.message || DEFAULT_MESSAGE[this.variant];
  }

  get resolvedHint(): string {
    return this.hint || DEFAULT_HINT[this.variant];
  }
}
