import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AiStat {
  label: string;
  /** Bold lead value, e.g. "8". */
  value: string;
  /** Plain continuation after the value, e.g. "of 50 (16 %)". */
  note?: string;
}

/**
 * Stat list — a few headline numbers an AI answer computed, with where they came from.
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › ↳ Dashboards › "Card" (169:14737), in context 324:29930.
 *
 * Anatomy: title (18 semibold) · meta line ("Project Nova · Last 7 days") · bordered box with
 * label/value rows and a provenance footnote. The footnote is the audit trail — keep it.
 *
 * Usage:
 *   <fvdr-ai-stat-list title="Activity this week" [meta]="['Project Nova','Last 7 days']"
 *     [stats]="[{label:'Total sign-ins', value:'63'}]" footnote="Calculated from activity log · Updated 2 min ago" />
 */
@Component({
  selector: 'fvdr-ai-stat-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="blk">
      <header class="blk__head" *ngIf="title">
        <h3 class="blk__title">{{ title }}</h3>
        <p class="blk__meta" *ngIf="meta.length">
          <ng-container *ngFor="let m of meta; let last = last">{{ m }}<span *ngIf="!last" class="blk__dot" aria-hidden="true"></span></ng-container>
        </p>
      </header>
      <div class="box">
        <dl class="stats">
          <div class="stats__row" *ngFor="let s of stats">
            <dt>{{ s.label }}</dt>
            <dd><strong>{{ s.value }}</strong><span *ngIf="s.note"> {{ s.note }}</span></dd>
          </div>
        </dl>
        <p class="box__foot" *ngIf="footnote">{{ footnote }}</p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); }
    .blk { display: flex; flex-direction: column; gap: var(--space-2); }
    .blk__head { display: flex; flex-direction: column; gap: 2px; }
    .blk__title { margin: 0; font-size: var(--font-size-base, 14px); line-height: 20px; font-weight: var(--font-weight-semi, 600); }
    .blk__meta { display: flex; align-items: center; gap: var(--space-2); margin: 0;
      font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .blk__dot { display: inline-block; width: 2px; height: 2px; margin-left: var(--space-2); border-radius: 50%;
      background: var(--color-text-secondary); vertical-align: middle; }

    .box { display: inline-flex; flex-direction: column; gap: var(--space-4); align-self: flex-start;
      min-width: 280px; max-width: 100%; padding: var(--space-4); box-sizing: border-box;
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .stats { display: flex; flex-direction: column; margin: 0; }
    .stats__row { display: grid; grid-template-columns: minmax(140px, auto) 1fr; column-gap: var(--space-8);
      padding: var(--space-1) 0; font-size: var(--font-size-base, 14px); line-height: 20px; }
    .stats__row dt, .stats__row dd { margin: 0; }
    .stats__row strong { font-weight: var(--font-weight-semi, 600); }
    .box__foot { margin: 0; font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
  `],
})
export class AiStatListComponent {
  @Input() title = '';
  /** Scope facts shown under the title — joined with a dot. */
  @Input() meta: string[] = [];
  @Input() stats: AiStat[] = [];
  /** Where the numbers came from and how fresh they are. */
  @Input() footnote = '';
}
