import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { SummaryAnswer } from '../../models/ai-scenario.model';
import {
  DOC_FILE_ICON,
  MockDocType,
  MockDocument,
} from '../../models/mock-doc.model';

/** Scenario B — overview paragraph + grouped key points, each citing its source. */
@Component({
  selector: 'fvdr-ai-answer-summary',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="sum">
      <p class="sum__overview">{{ answer.overview }}</p>

      <section class="sum__group" *ngFor="let g of answer.groups">
        <h4 class="sum__title">
          <fvdr-file-icon [type]="g.titleDoc ? fileIcon(g.titleDoc.type) : 'folder'"></fvdr-file-icon>
          <button type="button" class="sum__link" (click)="onTitleClick(g.title, g.titleDoc)">
            {{ g.title }}
          </button>
        </h4>

        <ul class="sum__points">
          <li *ngFor="let p of g.points">
            <span class="sum__text">{{ p.text }}</span>
            <button type="button" class="sum__cite" (click)="docOpened.emit(p.source)">
              <fvdr-file-icon [type]="fileIcon(p.source.type)"></fvdr-file-icon>
              <span>{{ p.source.name }}</span>
            </button>
          </li>
        </ul>
      </section>

      <p class="sum__follow" *ngIf="answer.followUp">
        {{ answer.followUp }}
        <button type="button" class="sum__export" (click)="exported.emit()">Export summary</button>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .sum { display: flex; flex-direction: column; gap: var(--space-4); }

    .sum__overview, .sum__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .sum__overview { color: var(--color-text-primary); }
    .sum__follow { color: var(--color-text-secondary); }

    .sum__group { display: flex; flex-direction: column; gap: var(--space-2); }
    .sum__title {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0;
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }

    .sum__points {
      list-style: none; margin: 0; padding: 0 0 0 var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-2);
      border-left: 1px solid var(--color-divider);
    }
    .sum__points li { display: flex; flex-direction: column; gap: 2px; }
    .sum__text {
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }

    .sum__link, .sum__cite, .sum__export {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
    }
    .sum__link { font-size: var(--font-size-base, 14px); font-weight: var(--font-weight-semi, 600); }
    .sum__cite {
      display: inline-flex; align-items: center; gap: var(--space-1);
      align-self: flex-start;
      font-size: var(--font-size-xs, 12px);
    }
    .sum__export { font-size: var(--font-size-md, 15px); }
    .sum__link:hover, .sum__cite:hover, .sum__export:hover {
      color: var(--color-primary-600); text-decoration: underline;
    }
  `],
})
export class AiAnswerSummaryComponent {
  @Input({ required: true }) answer!: SummaryAnswer;
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();
  @Output() exported = new EventEmitter<void>();

  /** DS file-icon glyph for a document extension. */
  fileIcon(type: MockDocType) {
    return DOC_FILE_ICON[type];
  }

  onTitleClick(title: string, doc?: MockDocument): void {
    doc ? this.docOpened.emit(doc) : this.folderOpened.emit(title);
  }
}
