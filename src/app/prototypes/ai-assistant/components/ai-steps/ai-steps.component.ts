import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { AiStep } from '../../models/ai-step.model';

/**
 * Streaming reasoning block.
 *   · streaming  → animated ✦ + live header + step rows appearing one by one + Stop
 *   · completed  → single "Completed N steps ›" row, click to audit every step
 */
@Component({
  selector: 'fvdr-ai-steps',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="steps">
      <!-- Live header -->
      <div class="steps__live" *ngIf="streaming">
        <span class="steps__mark steps__mark--spin"><fvdr-icon name="ai-assistant"></fvdr-icon></span>
        <span class="steps__live-label">{{ liveLabel }}</span>
        <button type="button" class="steps__stop" (click)="stopped.emit()">Stop</button>
      </div>

      <!-- Collapsed summary -->
      <button
        type="button"
        class="steps__summary"
        *ngIf="!streaming && steps.length"
        (click)="toggled.emit()"
      >
        <span class="steps__mark"><fvdr-icon name="ai-assistant"></fvdr-icon></span>
        <span>{{ cancelled ? 'Stopped after' : 'Completed' }} {{ steps.length }} {{ steps.length === 1 ? 'step' : 'steps' }}</span>
        <fvdr-icon
          name="chevron-right"
          class="steps__caret"
          [class.steps__caret--open]="expanded"
        ></fvdr-icon>
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

    .steps__mark {
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--color-primary-500);
      font-size: var(--font-size-base, 14px);
      flex-shrink: 0;
    }
    .steps__mark--spin { animation: ai-spin 1.4s linear infinite; }
    @keyframes ai-spin { to { transform: rotate(360deg); } }

    .steps__live { display: flex; align-items: center; gap: var(--space-2); }
    .steps__live-label {
      font-size: var(--font-size-sm, 13px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }
    .steps__stop {
      margin-left: var(--space-2);
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
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }
    .steps__summary:hover { color: var(--color-text-primary); }
    .steps__caret {
      font-size: var(--font-size-xs, 12px);
      transition: transform 0.15s ease;
    }
    .steps__caret--open { transform: rotate(90deg); }

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

  @Output() toggled = new EventEmitter<void>();
  @Output() stopped = new EventEmitter<void>();

  get liveLabel(): string {
    return this.steps.at(-1)?.label ?? 'Thinking';
  }
}
