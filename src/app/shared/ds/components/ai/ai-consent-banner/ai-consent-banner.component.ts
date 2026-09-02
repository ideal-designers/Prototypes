import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { ButtonComponent } from '../../button/button.component';

export type AiConsentVariant = 'first-run' | 'disabled' | 'updated-terms';

export interface AiConsentTerms {
  /** What the assistant reads, e.g. "documents you already have access to". */
  processing: string;
  /** How long anything is kept, e.g. "prompts are not used for training". */
  retention: string;
  docsUrl?: string;
}

/**
 * The first-run notice: what the assistant reads, where it is processed, and
 * that answers must be verified against the source. Also the surface for an
 * admin having switched AI off for a data room.
 *
 * Legal and enterprise buyers gate on this screen, so it never auto-accepts and
 * Accept is never the only way out.
 */
@Component({
  selector: 'fvdr-ai-consent-banner',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <div class="consent" [class.consent--disabled]="variant === 'disabled'">
      <span class="consent__mark">
        <fvdr-icon [name]="variant === 'disabled' ? 'lock-close' : 'ideon'"></fvdr-icon>
      </span>

      <h3 class="consent__title">{{ resolvedTitle }}</h3>

      <ng-container *ngIf="variant !== 'disabled'">
        <ul class="consent__points">
          <li>
            <fvdr-icon name="documents"></fvdr-icon>
            <span>{{ terms.processing }}</span>
          </li>
          <li>
            <fvdr-icon name="lock-close"></fvdr-icon>
            <span>{{ terms.retention }}</span>
          </li>
          <li>
            <fvdr-icon name="attention"></fvdr-icon>
            <span>Answers can be wrong or incomplete — always check them against the cited document.</span>
          </li>
        </ul>

        <a class="consent__docs" *ngIf="terms.docsUrl" [href]="terms.docsUrl" target="_blank" rel="noopener noreferrer" (click)="learnMore.emit()">
          How the AI assistant handles your data
        </a>

        <div class="consent__actions">
          <fvdr-btn variant="ghost" size="m" label="Not now" (clicked)="declined.emit()"></fvdr-btn>
          <fvdr-btn variant="primary" size="m" [label]="acceptLabel" (clicked)="accepted.emit()"></fvdr-btn>
        </div>
      </ng-container>

      <p class="consent__disabled-note" *ngIf="variant === 'disabled'">
        {{ disabledNote }}
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); }

    .consent {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: var(--space-4);
      height: 100%;
      padding: var(--space-6);
      text-align: center;
    }

    .consent__mark { font-size: 36px; line-height: 1; color: var(--color-primary-500); }
    .consent--disabled .consent__mark { color: var(--color-stone-600); }

    .consent__title {
      margin: 0;
      max-width: 420px;
      font-size: var(--font-size-lg, 16px);
      font-weight: var(--font-weight-semi, 600);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }

    .consent__points {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--space-3);
      max-width: 460px;
      text-align: left;
    }
    .consent__points li {
      display: flex; align-items: flex-start; gap: var(--space-2);
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-secondary);
    }
    .consent__points fvdr-icon {
      flex: 0 0 auto;
      margin-top: 3px;
      color: var(--color-stone-600);
      font-size: var(--font-size-base, 14px);
    }

    .consent__docs {
      font-size: var(--font-size-sm, 13px);
      color: var(--color-primary-500);
      text-decoration: none;
    }
    .consent__docs:hover { color: var(--color-primary-600); text-decoration: underline; }

    .consent__actions { display: flex; align-items: center; gap: var(--space-2); }

    .consent__disabled-note {
      margin: 0;
      max-width: 420px;
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiConsentBannerComponent {
  @Input() variant: AiConsentVariant = 'first-run';
  @Input() terms: AiConsentTerms = {
    processing: 'The assistant reads only the documents you already have access to.',
    retention: 'Your prompts stay in this data room and are not used to train models.',
  };
  /** Overrides the variant's default heading. */
  @Input() title = '';
  /** Shown in the `disabled` variant — say who can turn it on. */
  @Input() disabledNote = 'A data room administrator can enable the AI assistant in Settings.';

  @Output() accepted = new EventEmitter<void>();
  @Output() declined = new EventEmitter<void>();
  @Output() learnMore = new EventEmitter<void>();

  get resolvedTitle(): string {
    if (this.title) return this.title;
    switch (this.variant) {
      case 'disabled':      return 'The AI assistant is turned off for this data room';
      case 'updated-terms': return 'We have updated how the AI assistant works';
      default:              return 'Before you start using the AI assistant';
    }
  }

  get acceptLabel(): string {
    return this.variant === 'updated-terms' ? 'Got it' : 'Accept and continue';
  }
}
