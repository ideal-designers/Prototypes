import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { AiStep } from '../../models/ai-step.model';

/**
 * Streaming reasoning block.
 *   · streaming  → thinking-orbs pill (live step label) + step rows appearing one by one + Stop
 *   · completed  → single "Thought for Ns" row, click to audit every step (VDR traceability)
 */
@Component({
  selector: 'fvdr-ai-steps',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="steps">
      <!-- Live header -->
      <div class="steps__live" *ngIf="streaming">
        <fvdr-thinking-orbs class="steps__orbs" [label]="liveLabel" [running]="streaming" [size]="32" [dots]="1.2"></fvdr-thinking-orbs>
        <button type="button" class="steps__stop" (click)="stopped.emit()">Stop</button>
      </div>

      <!-- Collapsed summary — still expands to the full audit trail -->
      <button
        type="button"
        class="steps__summary"
        *ngIf="!streaming && steps.length"
        [attr.aria-expanded]="expanded"
        [attr.title]="expanded ? 'Hide the reasoning steps' : 'Show the reasoning steps'"
        (click)="toggled.emit()"
      >
        <span>{{ summaryLabel }}</span>
      </button>

      <!-- Step rows -->
      <ul class="steps__list" *ngIf="streaming || expanded">
        <li class="steps__row" *ngFor="let s of steps" [class.steps__row--result]="s.kind === 'result'">
          <span class="steps__row-label">{{ s.label }}</span>
          <ng-container *ngIf="s.detail">
            <span class="steps__row-sep">▸</span>
            <span class="steps__row-detail">{{ s.detail }}</span>
          </ng-container>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .steps { display: flex; flex-direction: column; gap: var(--space-2); }

    /* In-flight indicator — the orbs pill carries the live step label. */
    .steps__live { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .steps__orbs { min-width: 0; }
    .steps__stop {
      margin-left: var(--space-1);
      border: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-3);
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      cursor: pointer;
    }
    .steps__stop:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .steps__summary {
      display: inline-flex; align-items: center; gap: var(--space-2);
      align-self: flex-start;
      border: none; background: transparent; cursor: pointer;
      padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
    }
    .steps__summary:hover { color: var(--color-text-primary); text-decoration: underline; }

    .steps__list {
      list-style: none; margin: 0; padding: 0 0 0 var(--space-5);
      display: flex; flex-direction: column; gap: var(--space-1);
      border-left: 1px solid var(--color-divider);
      margin-left: var(--space-2);
    }
    .steps__row {
      display: flex; align-items: baseline; gap: var(--space-1);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
      animation: ai-step-in 0.2s ease;
    }
    .steps__row--result .steps__row-label {
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semi, 600);
    }
    .steps__row-sep { color: var(--color-stone-500); }
    .steps__row-detail { color: var(--color-text-secondary); }
    @keyframes ai-step-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
  `],
})
export class AiStepsComponent {
  @Input() steps: AiStep[] = [];
  @Input() streaming = false;
  @Input() expanded = false;
  @Input() cancelled = false;
  /** Measured streaming duration of the turn. */
  @Input() thoughtMs = 0;

  @Output() toggled = new EventEmitter<void>();
  @Output() stopped = new EventEmitter<void>();

  get liveLabel(): string {
    return this.steps.at(-1)?.label ?? 'Thinking';
  }

  /** "Thought for 3s" — never "0s"; a stopped turn keeps reporting the step count. */
  get summaryLabel(): string {
    if (this.cancelled) {
      return `Stopped after ${this.steps.length} ${this.steps.length === 1 ? 'step' : 'steps'}`;
    }
    return `Thought for ${Math.max(1, Math.round(this.thoughtMs / 1000))}s`;
  }
}
