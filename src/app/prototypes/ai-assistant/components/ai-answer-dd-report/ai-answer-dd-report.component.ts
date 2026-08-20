import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { DdClaim, DdReportAnswer } from '../../models/ai-scenario.model';
import {
  DOC_FILE_ICON,
  MockDocType,
  MockDocument,
} from '../../models/mock-doc.model';

/** Scenario C2 — sectioned due-diligence draft with a citation on every claim. */
@Component({
  selector: 'fvdr-ai-answer-dd-report',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="dd">
      <header class="dd__head">
        <div class="dd__titles">
          <h3 class="dd__title">{{ answer.title }}</h3>
          <fvdr-badge label="Draft for review" variant="warning"></fvdr-badge>
        </div>
        <fvdr-btn
          label="Export"
          variant="ghost"
          size="s"
          iconName="download"
          (clicked)="exported.emit()"
        ></fvdr-btn>
      </header>

      <fvdr-inline-message
        *ngIf="answer.partialNote"
        variant="warning"
        [message]="answer.partialNote"
      ></fvdr-inline-message>

      <section class="dd__section" *ngFor="let s of answer.sections">
        <h4 class="dd__heading">{{ s.heading }}</h4>
        <ul class="dd__claims">
          <li *ngFor="let c of s.claims">
            <span class="dd__text">{{ c.text }}</span>
            <button
              type="button"
              class="dd__cite"
              *ngIf="c.sourceDoc || c.sourceFolder"
              (click)="onCite(c)"
            >
              <fvdr-file-icon [type]="c.sourceDoc ? fileIcon(c.sourceDoc.type) : 'folder'"></fvdr-file-icon>
              <span>{{ c.sourceDoc ? c.sourceDoc.name : c.sourceFolder }}</span>
            </button>
          </li>
        </ul>
      </section>

      <p class="dd__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .dd { display: flex; flex-direction: column; gap: var(--space-4); }

    .dd__head {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-3); flex-wrap: wrap;
      border-bottom: 1px solid var(--color-divider);
      padding-bottom: var(--space-2);
    }
    .dd__titles { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .dd__title {
      margin: 0;
      font-size: var(--font-size-xl, 18px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary);
    }

    .dd__section { display: flex; flex-direction: column; gap: var(--space-2); }
    .dd__heading {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .dd__claims {
      list-style: none; margin: 0; padding: 0 0 0 var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-2);
      border-left: 1px solid var(--color-divider);
    }
    .dd__claims li { display: flex; flex-direction: column; gap: 2px; }
    .dd__text {
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }

    .dd__cite {
      display: inline-flex; align-items: center; gap: var(--space-1);
      align-self: flex-start;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-primary-500);
      cursor: pointer;
    }
    .dd__cite:hover { color: var(--color-primary-600); text-decoration: underline; }

    .dd__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiAnswerDdReportComponent {
  @Input({ required: true }) answer!: DdReportAnswer;
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();
  @Output() exported = new EventEmitter<void>();

  /** DS file-icon glyph for a document extension. */
  fileIcon(type: MockDocType) {
    return DOC_FILE_ICON[type];
  }

  onCite(claim: DdClaim): void {
    if (claim.sourceDoc) this.docOpened.emit(claim.sourceDoc);
    else if (claim.sourceFolder) this.folderOpened.emit(claim.sourceFolder);
  }
}
