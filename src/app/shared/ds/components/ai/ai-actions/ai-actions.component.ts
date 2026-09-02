import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';

export type AiRating = 'up' | 'down' | null;

/**
 * Action row under a finished assistant turn — regenerate, copy, rate.
 * Appears only once the answer is complete; it is the feedback loop that tells us
 * whether the assistant is trusted, so keep it on every answer surface.
 */
@Component({
  selector: 'fvdr-ai-actions',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="actions">
      <button
        *ngIf="showRegenerate"
        type="button"
        class="actions__btn"
        title="Regenerate"
        aria-label="Regenerate answer"
        (click)="regenerated.emit()"
      >
        <fvdr-icon name="refresh"></fvdr-icon>
      </button>

      <button
        *ngIf="showCopy"
        type="button"
        class="actions__btn"
        [class.actions__btn--done]="copied"
        [title]="copied ? 'Copied' : 'Copy'"
        aria-label="Copy answer"
        (click)="onCopy()"
      >
        <fvdr-icon [name]="copied ? 'check' : 'copy'"></fvdr-icon>
      </button>

      <ng-container *ngIf="showRating">
        <button
          type="button"
          class="actions__btn"
          [class.actions__btn--active]="rating === 'up'"
          title="Good answer"
          aria-label="Rate answer as good"
          [attr.aria-pressed]="rating === 'up'"
          (click)="rate('up')"
        >
          <fvdr-icon name="thumbs-up"></fvdr-icon>
        </button>
        <button
          type="button"
          class="actions__btn"
          [class.actions__btn--active]="rating === 'down'"
          title="Bad answer"
          aria-label="Rate answer as bad"
          [attr.aria-pressed]="rating === 'down'"
          (click)="rate('down')"
        >
          <fvdr-icon name="thumbs-down"></fvdr-icon>
        </button>
      </ng-container>

      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .actions { display: flex; align-items: center; gap: var(--space-1); }

    .actions__btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-base, 14px);
      transition: background 0.12s ease, color 0.12s ease;
    }
    .actions__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .actions__btn--active { color: var(--color-primary-500); }
    .actions__btn--active:hover { color: var(--color-primary-600); }
    .actions__btn--done { color: var(--color-primary-500); }
  `],
})
export class AiActionsComponent {
  @Input() showRegenerate = true;
  @Input() showCopy = true;
  @Input() showRating = true;
  /** Current rating — persisted by the host so it survives a re-render. */
  @Input() rating: AiRating = null;
  /** Transient "copied ✓" confirmation window, in ms. */
  @Input() copiedTimeout = 1600;

  @Output() regenerated = new EventEmitter<void>();
  @Output() copyRequested = new EventEmitter<void>();
  @Output() rated = new EventEmitter<AiRating>();

  copied = false;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  onCopy(): void {
    this.copyRequested.emit();
    this.copied = true;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), this.copiedTimeout);
  }

  /** Clicking the active thumb clears the rating, like every other toggle in the DS. */
  rate(value: Exclude<AiRating, null>): void {
    this.rating = this.rating === value ? null : value;
    this.rated.emit(this.rating);
  }
}
