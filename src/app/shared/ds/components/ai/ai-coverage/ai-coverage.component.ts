import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { ButtonComponent } from '../../button/button.component';
import { AiCoverageState } from '../ai.models';

/**
 * Answer coverage — Figma AI-Assistant "Chat · 1.1 · Limited access":
 * Full answer · In scope (2798:199636), Full answer · Narrowed scope (2798:200200),
 * Partial answer (2798:198494), Not found (2798:199065).
 *
 * Says how much of the question the answer could cover inside the chat's scope.
 * When everything was found it is one quiet line under the answer; when something
 * is missing it becomes a card with the two ways out: widen the scope, or search
 * every file. The assistant never fills a gap by guessing — this is where it says so.
 */
@Component({
  selector: 'fvdr-ai-coverage',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <!-- complete · narrowed: one line -->
    <p class="cov-line" *ngIf="state === 'complete' || state === 'narrowed'; else card">
      <fvdr-icon name="finished" class="cov-line__icon"></fvdr-icon>
      <span>{{ basedOn }} · All requested data found</span>
      <button type="button" class="cov-link" (click)="scopeRequested.emit()">{{ state === 'narrowed' ? 'Edit scope' : 'View scope' }}</button>
    </p>

    <!-- partial · not-found: card with the ways out -->
    <ng-template #card>
      <div class="cov-card" role="status">
        <div class="cov-card__head">
          <fvdr-icon name="attention" class="cov-card__icon"></fvdr-icon>
          <span class="cov-card__title">{{ state === 'partial' ? basedOn : 'Not found in scope' }}</span>
        </div>
        <p class="cov-card__text" *ngIf="cardText">{{ cardText }}</p>
        <div class="cov-card__actions">
          <fvdr-btn label="Expand scope" variant="secondary" size="s" (clicked)="expandScope.emit()"></fvdr-btn>
          <fvdr-btn label="Search all files" variant="secondary" size="s" (clicked)="searchAll.emit()"></fvdr-btn>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .cov-line {
      display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2);
      margin: 0;
      font-size: var(--text-body3-size); line-height: var(--text-body3-lh);
      color: var(--color-text-secondary);
    }
    .cov-line__icon { flex: none; color: var(--color-primary-500); font-size: var(--text-body1-size); }
    .cov-link {
      border: none; background: transparent; padding: 0; cursor: pointer;
      font-family: var(--font-family); font-size: var(--text-body3-size); line-height: var(--text-body3-lh);
      font-weight: var(--text-label-s-weight);
      color: var(--color-primary-500);
    }
    .cov-link:hover { color: var(--color-primary-600); text-decoration: underline; }

    .cov-card {
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-3) var(--space-4) var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-100);
    }
    .cov-card__head { display: flex; align-items: center; gap: var(--space-2); }
    .cov-card__icon { flex: none; color: var(--badge-fg-yellow); font-size: var(--text-body1-size); }
    .cov-card__title { font-size: var(--text-label-m-size); line-height: var(--text-label-m-lh); font-weight: var(--text-label-m-weight); color: var(--color-text-primary); }
    .cov-card__text { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-secondary); }
    .cov-card__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-1); }
  `],
})
export class AiCoverageComponent {
  @Input() state: AiCoverageState = 'complete';
  /** Documents the answer stands on. */
  @Input() used?: number;
  /** Documents in the chat's scope. */
  @Input() inScope?: number;
  /** Narrowed scope, in words: "1. Financial and 2 selected files". */
  @Input() scopeLabel = '';
  /** Partial: what was asked for but not found in scope. */
  @Input() missing: string[] = [];
  /** Not found: where the data may be instead. Defaults to a generic line. */
  @Input() hint = '';

  /** complete / narrowed: View scope / Edit scope. */
  @Output() scopeRequested = new EventEmitter<void>();
  @Output() expandScope = new EventEmitter<void>();
  @Output() searchAll = new EventEmitter<void>();

  get basedOn(): string {
    if (this.state === 'narrowed' && this.scopeLabel) return `Based on ${this.scopeLabel}`;
    if (this.used != null && this.inScope != null) return `Based on ${this.used} of ${this.inScope} documents in scope`;
    return 'Based on the documents in scope';
  }

  get cardText(): string {
    if (this.state === 'partial') return this.missing.length ? `Not found in scope: ${this.missing.join(' · ')}` : '';
    return this.hint || 'Files outside this chat’s scope may contain this data.';
  }
}
