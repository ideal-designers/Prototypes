import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { ProjectAnswer } from '../../models/ai-scenario.model';

/** Scenario D — creation confirmation, project citation and next-step chips. */
@Component({
  selector: 'fvdr-ai-answer-project',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="proj">
      <p class="proj__text">{{ answer.text }}</p>

      <button type="button" class="proj__link" (click)="projectOpened.emit(answer.projectName)">
        <fvdr-file-icon type="folder"></fvdr-file-icon>
        <span>{{ answer.projectName }}</span>
      </button>

      <div class="proj__chips">
        <fvdr-chip
          *ngFor="let s of answer.nextSteps"
          [label]="s"
          variant="grey"
          size="m"
          [clickable]="true"
          (clicked)="nextStepChosen.emit(s)"
        ></fvdr-chip>
      </div>

      <p class="proj__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .proj { display: flex; flex-direction: column; gap: var(--space-3); }
    .proj__text {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
      color: var(--color-text-primary);
    }
    .proj__link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      align-self: flex-start;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-md, 15px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-primary-500);
      cursor: pointer;
    }
    .proj__link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .proj__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    /* The DS chip's grey fill is a light constant — retint it for the dark shell. */
    :host-context(.dark-theme) .proj__chips { --chip-bg-grey: var(--color-stone-300); }
    .proj__follow {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiAnswerProjectComponent {
  @Input({ required: true }) answer!: ProjectAnswer;
  @Output() projectOpened = new EventEmitter<string>();
  @Output() nextStepChosen = new EventEmitter<string>();
}
