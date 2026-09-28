import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AiBarItem {
  label: string;
  /** Raw magnitude — bars are scaled against the largest value. */
  value: number;
  /** Formatted value shown at the bar end, e.g. "14 h 20 m". */
  display: string;
}

/**
 * Ranked bar list — one horizontal bar per entity, sorted by the host, largest first.
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › "Ranked Bar — Time Spent by Group" (174:4982),
 * in context 367:20630. Bars below `lowShare` of the leader turn grey — that's the
 * "gone quiet" signal the answer text usually points at.
 *
 * Usage:
 *   <fvdr-ai-bar-list title="Buyer engagement, this week" [meta]="['Project Nova','Last 7 days']"
 *     chartTitle="Time spent by bidder group" [items]="bars" footnote="Calculated from activity log" />
 */
@Component({
  selector: 'fvdr-ai-bar-list',
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
        <p class="box__title" *ngIf="chartTitle">{{ chartTitle }}</p>
        <ul class="bars" [attr.aria-label]="chartTitle || title">
          <li class="bars__row" *ngFor="let it of items">
            <span class="bars__label">{{ it.label }}</span>
            <span class="bars__track" role="img" [attr.aria-label]="it.label + ': ' + it.display">
              <span class="bars__fill" [class.bars__fill--low]="isLow(it)" [style.width.%]="pct(it)"></span>
            </span>
            <span class="bars__value">{{ it.display }}</span>
          </li>
        </ul>
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

    .box { display: flex; flex-direction: column; gap: var(--space-2); max-width: 632px; padding: var(--space-4);
      box-sizing: border-box; border: 1px solid var(--color-stone-300); border-radius: var(--radius-sm); }
    .box__title { margin: 0 0 var(--space-1); font-size: var(--font-size-base, 14px); line-height: 20px; font-weight: var(--font-weight-semi, 600); }
    .bars { display: flex; flex-direction: column; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
    .bars__row { display: grid; grid-template-columns: 72px 1fr 80px; align-items: center; column-gap: var(--space-3); }
    .bars__label { font-size: var(--font-size-base, 14px); line-height: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bars__track { height: 14px; border-radius: var(--radius-sm); background: var(--color-stone-300); overflow: hidden; }
    .bars__fill { display: block; height: 100%; min-width: 14px; border-radius: var(--radius-sm); background: var(--color-primary-500);
      transition: width 0.4s ease; }
    .bars__fill--low { background: var(--color-stone-500); }
    .bars__value { font-size: var(--text-caption1-size, 12px); line-height: 16px; font-weight: var(--font-weight-semi, 600); white-space: nowrap; }
    .box__foot { margin: var(--space-1) 0 0; font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
  `],
})
export class AiBarListComponent {
  @Input() title = '';
  @Input() meta: string[] = [];
  @Input() chartTitle = '';
  @Input() items: AiBarItem[] = [];
  @Input() footnote = '';
  /** Share of the leader (0–1) under which a bar reads as "quiet" and turns grey. */
  @Input() lowShare = 0.1;

  private get max(): number { return Math.max(1, ...this.items.map(i => i.value)); }
  pct(it: AiBarItem): number { return (it.value / this.max) * 100; }
  isLow(it: AiBarItem): boolean { return it.value / this.max < this.lowShare; }
}
