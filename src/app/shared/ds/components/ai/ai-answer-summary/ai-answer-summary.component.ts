import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { AiCitationComponent } from '../ai-citation/ai-citation.component';
import { AiDocRef, AiSummaryGroup } from '../ai.models';

/**
 * Overview paragraph, then key points grouped by folder or document, every
 * point citing its source. The default shape for "summarize this folder" and
 * the block where citations matter most — a summary without them is a rumour.
 */
@Component({
  selector: 'fvdr-ai-answer-summary',
  standalone: true,
  imports: [CommonModule, FileIconComponent, AiCitationComponent],
  template: `
    <div class="sum">
      <p class="sum__scope" *ngIf="scopeLabel">{{ scopeLabel }}</p>
      <p class="sum__overview" *ngIf="overview">{{ overview }}</p>

      <section class="sum__group" *ngFor="let g of groups">
        <h4 class="sum__title">
          <fvdr-file-icon [type]="g.titleDoc ? g.titleDoc.type : 'folder'"></fvdr-file-icon>
          <button type="button" class="sum__link" (click)="onTitleClick(g)">{{ g.title }}</button>
        </h4>

        <ul class="sum__points">
          <li *ngFor="let p of g.points">
            <span class="sum__text">{{ p.text }}</span>
            <fvdr-ai-citation
              *ngIf="p.source"
              [label]="p.source.name"
              [page]="p.source.page"
              [fileType]="p.source.type"
              (opened)="docOpened.emit(p.source!)"
            ></fvdr-ai-citation>
          </li>
        </ul>
      </section>

      <p class="sum__follow" *ngIf="followUp || exportable">
        <span *ngIf="followUp">{{ followUp }}</span>
        <button type="button" class="sum__export" *ngIf="exportable" (click)="exported.emit()">Export summary</button>
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .sum { display: flex; flex-direction: column; gap: var(--space-4); }

    .sum__scope {
      margin: 0;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .sum__overview, .sum__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .sum__overview { color: var(--color-text-primary); }
    .sum__follow { color: var(--color-text-secondary); display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: baseline; }

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
    .sum__points li { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; }
    .sum__text {
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }

    .sum__link, .sum__export {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
    }
    .sum__link { font-size: var(--font-size-base, 14px); font-weight: var(--font-weight-semi, 600); }
    .sum__export { font-size: var(--font-size-md, 15px); }
    .sum__link:hover, .sum__export:hover { color: var(--color-primary-600); text-decoration: underline; }
  `],
})
export class AiAnswerSummaryComponent {
  @Input() overview = '';
  @Input() groups: AiSummaryGroup[] = [];
  /** e.g. "12 documents in /Financials" */
  @Input() scopeLabel = '';
  @Input() followUp = '';
  @Input() exportable = true;

  @Output() docOpened = new EventEmitter<AiDocRef>();
  @Output() folderOpened = new EventEmitter<string>();
  @Output() exported = new EventEmitter<void>();

  onTitleClick(group: AiSummaryGroup): void {
    group.titleDoc ? this.docOpened.emit(group.titleDoc) : this.folderOpened.emit(group.title);
  }
}
