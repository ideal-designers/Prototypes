import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import { AnalyticsAnswer, FOOTNOTE, META } from './analytics-ai-search.data';

/** Which parts of an answer render — Figma columns "Only X", "Text+X", "Text+X+text". */
export type AnswerShape = 'block' | 'text-block' | 'text-block-text';

/**
 * Body of one analytics answer: lead text → one DS data block → closing text.
 * Shared by the AI Overview and the full assistant so both read the same.
 */
@Component({
  selector: 'fvdr-vdr-analytics-answer',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="ans">
      <p class="ans__p" *ngIf="shape !== 'block'">{{ answer.lead }}</p>

      <ng-container [ngSwitch]="answer.block.kind">
        <fvdr-ai-stat-list *ngSwitchCase="'stats'" [title]="$any(answer.block).title" [meta]="meta"
          [stats]="$any(answer.block).stats" [footnote]="footnote"></fvdr-ai-stat-list>
        <fvdr-ai-bar-list *ngSwitchCase="'bars'" [title]="$any(answer.block).title" [meta]="meta"
          [chartTitle]="$any(answer.block).chartTitle" [items]="$any(answer.block).items" [footnote]="footnote"></fvdr-ai-bar-list>
        <fvdr-ai-people-table *ngSwitchCase="'people'" [title]="$any(answer.block).title" [meta]="meta"
          [rows]="$any(answer.block).rows" [total]="$any(answer.block).total" [noun]="$any(answer.block).noun"
          [whenLabel]="$any(answer.block).whenLabel" (reportRequested)="reportRequested.emit()"></fvdr-ai-people-table>
      </ng-container>

      <p class="ans__p" *ngIf="shape === 'text-block-text'">{{ answer.tail }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }
    .ans { display: flex; flex-direction: column; gap: var(--space-3); color: var(--color-text-primary);
      font-size: var(--font-size-base, 14px); line-height: 20px; }
    .ans__p { margin: 0; }
  `],
})
export class VdrAnalyticsAnswerComponent {
  @Input({ required: true }) answer!: AnalyticsAnswer;
  @Input() shape: AnswerShape = 'text-block-text';
  @Output() reportRequested = new EventEmitter<void>();

  readonly meta = META;
  readonly footnote = FOOTNOTE;
}
