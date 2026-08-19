import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProseAnswer } from '../../models/ai-scenario.model';

/** Plain prose answer + optional follow-up offer line. */
@Component({
  selector: 'fvdr-ai-answer-prose',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="prose">
      <p class="prose__text">{{ answer.text }}</p>
      <p class="prose__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }
    .prose { display: flex; flex-direction: column; gap: var(--space-2); }
    .prose__text {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
      color: var(--color-text-primary);
    }
    .prose__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiAnswerProseComponent {
  @Input({ required: true }) answer!: ProseAnswer;
}
