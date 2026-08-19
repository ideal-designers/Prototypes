import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { SingleDocAnswer } from '../../models/ai-scenario.model';
import { MockDocument } from '../../models/mock-doc.model';

/** Single-document answer — citation card with metadata bullets. */
@Component({
  selector: 'fvdr-ai-answer-doc',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="doc">
      <p class="doc__intro" *ngIf="answer.intro">{{ answer.intro }}</p>

      <div class="doc__head">
        <fvdr-file-icon [type]="answer.doc.type"></fvdr-file-icon>
        <button type="button" class="doc__link" (click)="docOpened.emit(answer.doc)">
          {{ answer.doc.index }} {{ answer.doc.name }}
        </button>
      </div>

      <ul class="doc__meta">
        <li>
          <span class="doc__meta-key">Location:</span>
          <button type="button" class="doc__link doc__link--folder" (click)="folderOpened.emit(answer.doc.folderPath)">
            {{ answer.doc.folderPath }}
          </button>
        </li>
        <li>
          <span class="doc__meta-key">Size:</span>
          <span>{{ answer.doc.sizeLabel }} · {{ answer.doc.pages }} pages</span>
        </li>
        <li>
          <span class="doc__meta-key">Added on:</span>
          <span>{{ answer.doc.addedOn }}</span>
        </li>
        <li *ngIf="answer.doc.signatureStatus">
          <span class="doc__meta-key">Signatures:</span>
          <span>{{ answer.doc.signatureStatus }}</span>
        </li>
      </ul>

      <p class="doc__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .doc { display: flex; flex-direction: column; gap: var(--space-3); }

    .doc__intro, .doc__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .doc__intro { color: var(--color-text-primary); }
    .doc__follow { color: var(--color-text-secondary); }

    .doc__head { display: flex; align-items: center; gap: var(--space-2); }

    .doc__link {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-md, 15px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
    }
    .doc__link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .doc__link--folder {
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-regular, 400);
    }

    .doc__meta {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--space-1);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
    }
    .doc__meta li { display: flex; align-items: baseline; gap: var(--space-2); }
    .doc__meta-key { color: var(--color-text-secondary); min-width: 72px; }
  `],
})
export class AiAnswerDocComponent {
  @Input({ required: true }) answer!: SingleDocAnswer;
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();
}
