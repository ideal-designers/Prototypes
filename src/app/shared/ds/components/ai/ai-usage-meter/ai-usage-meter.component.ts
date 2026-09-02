import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressComponent } from '../../special-controls/special-controls.component';

/**
 * AI consumption against the plan's allowance.
 *
 * Lives in billing, and compactly in the assistant header once the allowance
 * runs low — it is the answer to "why is the composer disabled", so it must be
 * reachable from the assistant, not only from Settings.
 */
@Component({
  selector: 'fvdr-ai-usage-meter',
  standalone: true,
  imports: [CommonModule, ProgressComponent],
  template: `
    <div class="usage" [class.usage--compact]="compact" [ngClass]="'usage--' + level">
      <div class="usage__head">
        <span class="usage__text">
          <b>{{ used | number }}</b> of {{ limit | number }} {{ unit }} {{ periodLabel }}
        </span>
        <button
          type="button"
          class="usage__upgrade"
          *ngIf="level !== 'ok'"
          (click)="upgradeRequested.emit()"
        >Upgrade</button>
      </div>

      <fvdr-progress class="usage__bar" *ngIf="!compact" [value]="percent" [variant]="barVariant"></fvdr-progress>

      <p class="usage__note" *ngIf="!compact && level === 'full'">
        The assistant stops answering until the allowance resets.
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .usage { display: flex; flex-direction: column; gap: var(--space-2); }

    .usage__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
    .usage__text {
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
    }
    .usage__text b { color: var(--color-text-primary); font-weight: var(--font-weight-semi, 600); }

    .usage__upgrade {
      flex: 0 0 auto;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-primary-500);
      cursor: pointer;
    }
    .usage__upgrade:hover { color: var(--color-primary-600); text-decoration: underline; }

    .usage__note {
      margin: 0;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-error-600);
    }

    /* Header variant — one line, no bar. */
    .usage--compact .usage__text { font-size: var(--font-size-xs, 12px); }
    .usage--compact .usage__upgrade { font-size: var(--font-size-xs, 12px); }
  `],
})
export class AiUsageMeterComponent {
  @Input() used = 0;
  @Input() limit = 0;
  @Input() unit = 'questions';
  /** e.g. "this month" */
  @Input() periodLabel = 'this month';
  /** Fraction of the allowance at which the meter starts warning. */
  @Input() warnAt = 0.8;
  @Input() compact = false;

  @Output() upgradeRequested = new EventEmitter<void>();

  get percent(): number {
    if (!this.limit) return 0;
    return Math.min(100, Math.round((this.used / this.limit) * 100));
  }

  /** The DS progress component owns the fill colour — map the level onto it. */
  get barVariant(): 'default' | 'warning' | 'error' {
    switch (this.level) {
      case 'full': return 'error';
      case 'warn': return 'warning';
      default:     return 'default';
    }
  }

  get level(): 'ok' | 'warn' | 'full' {
    if (!this.limit) return 'ok';
    const ratio = this.used / this.limit;
    if (ratio >= 1) return 'full';
    return ratio >= this.warnAt ? 'warn' : 'ok';
  }
}
