import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { AiDocRef } from '../ai.models';

/**
 * Numbered document results for narrow shells — the compact counterpart of
 * AI Answer · Table. Rows are separated by dividers, never boxed into cards:
 * content areas in FVDR are white and borderless.
 */
@Component({
  selector: 'fvdr-ai-answer-doc-list',
  standalone: true,
  imports: [CommonModule, FileIconComponent],
  template: `
    <div class="dl">
      <p class="dl__intro" *ngIf="intro">{{ intro }}</p>

      <ol class="dl__list">
        <li class="dl__row" *ngFor="let doc of docs; let i = index">
          <span class="dl__ordinal">{{ i + 1 }}</span>
          <fvdr-file-icon class="dl__icon" [type]="doc.type"></fvdr-file-icon>
          <span class="dl__body">
            <button type="button" class="dl__name" [attr.title]="doc.name" (click)="docOpened.emit(doc)">{{ doc.name }}</button>
            <span class="dl__meta">
              <button
                *ngIf="doc.folderPath"
                type="button"
                class="dl__folder"
                (click)="folderOpened.emit(doc.folderPath!)"
              >{{ doc.folderPath }}</button>
              <span *ngIf="doc.index">· {{ doc.index }}</span>
              <span *ngIf="doc.size">· {{ doc.size }}</span>
              <span *ngIf="doc.status">· {{ doc.status }}</span>
            </span>
          </span>
        </li>
      </ol>

      <p class="dl__follow" *ngIf="followUp">{{ followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .dl { display: flex; flex-direction: column; gap: var(--space-3); }

    .dl__intro, .dl__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .dl__intro { color: var(--color-text-primary); }
    .dl__follow { color: var(--color-text-secondary); }

    .dl__list { list-style: none; margin: 0; padding: 0; }

    .dl__row {
      display: flex; align-items: flex-start; gap: var(--space-2);
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .dl__row:last-child { border-bottom: none; }

    .dl__ordinal {
      flex: 0 0 auto;
      min-width: 16px;
      font-size: var(--font-size-xs, 12px);
      line-height: 18px;
      color: var(--color-text-secondary);
      text-align: right;
    }
    .dl__icon { flex: 0 0 auto; margin-top: 1px; }

    .dl__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .dl__name {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-tight, 18px);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dl__name:hover { color: var(--color-primary-600); text-decoration: underline; }

    .dl__meta {
      display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .dl__folder {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .dl__folder:hover { color: var(--color-text-primary); text-decoration: underline; }
  `],
})
export class AiAnswerDocListComponent {
  @Input() intro = '';
  @Input() docs: AiDocRef[] = [];
  @Input() followUp = '';

  @Output() docOpened = new EventEmitter<AiDocRef>();
  @Output() folderOpened = new EventEmitter<string>();
}
