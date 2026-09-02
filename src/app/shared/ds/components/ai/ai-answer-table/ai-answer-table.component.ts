import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { StatusComponent, StatusVariant } from '../../status/status.component';
import { AiDocRef } from '../ai.models';

/** `signatures` swaps Index/Size for a signature-status column. */
export type AiAnswerTableVariant = 'default' | 'signatures';

/**
 * Tabular results inside an answer — documents against comparable columns.
 * Scrolls inside its own container so a wide result never makes the transcript
 * scroll sideways.
 */
@Component({
  selector: 'fvdr-ai-answer-table',
  standalone: true,
  imports: [CommonModule, FileIconComponent, StatusComponent],
  template: `
    <div class="at">
      <p class="at__summary" *ngIf="summary">{{ summary }}</p>

      <div class="at__wrap">
        <table class="at__table">
          <thead>
            <tr>
              <th class="at__th at__th--name">Name</th>
              <ng-container *ngIf="variant === 'default'">
                <th class="at__th">Index</th>
                <th class="at__th">Size</th>
              </ng-container>
              <th class="at__th" *ngIf="variant === 'signatures'">Signatures</th>
              <th class="at__th">Folder</th>
            </tr>
          </thead>
          <tbody>
            <tr class="at__tr" *ngFor="let doc of docs">
              <td class="at__td at__td--name">
                <fvdr-file-icon class="at__icon" [type]="doc.type"></fvdr-file-icon>
                <button type="button" class="at__name" [attr.title]="doc.name" (click)="docOpened.emit(doc)">{{ doc.name }}</button>
              </td>

              <ng-container *ngIf="variant === 'default'">
                <td class="at__td at__td--muted">{{ doc.index || '—' }}</td>
                <td class="at__td at__td--muted">{{ doc.size || '—' }}</td>
              </ng-container>

              <td class="at__td" *ngIf="variant === 'signatures'">
                <fvdr-status [label]="doc.status || 'Unknown'" [variant]="statusVariant(doc)"></fvdr-status>
              </td>

              <td class="at__td">
                <button
                  *ngIf="doc.folderPath; else noFolder"
                  type="button"
                  class="at__folder"
                  (click)="folderOpened.emit(doc.folderPath!)"
                >{{ doc.folderPath }}</button>
                <ng-template #noFolder><span class="at__td--muted">—</span></ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="at__follow" *ngIf="followUp">{{ followUp }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .at { display: flex; flex-direction: column; gap: var(--space-3); }

    .at__summary, .at__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .at__summary { color: var(--color-text-primary); }
    .at__follow { color: var(--color-text-secondary); }

    /* The one place a horizontal scrollbar is allowed. */
    .at__wrap { overflow-x: auto; }

    .at__table { width: 100%; border-collapse: collapse; font-size: var(--font-size-base, 14px); }

    .at__th {
      text-align: left;
      padding: var(--space-2) var(--space-3) var(--space-2) 0;
      border-bottom: 1px solid var(--color-divider);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .at__th--name { min-width: 220px; }

    .at__td {
      padding: var(--space-2) var(--space-3) var(--space-2) 0;
      border-bottom: 1px solid var(--color-divider);
      vertical-align: middle;
      white-space: nowrap;
    }
    .at__tr:last-child .at__td { border-bottom: none; }
    .at__td--muted { color: var(--color-text-secondary); }

    .at__td--name { display: flex; align-items: center; gap: var(--space-2); max-width: 380px; }
    .at__icon { flex: 0 0 auto; }
    .at__name {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .at__name:hover { color: var(--color-primary-600); text-decoration: underline; }

    .at__folder {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .at__folder:hover { color: var(--color-text-primary); text-decoration: underline; }
  `],
})
export class AiAnswerTableComponent {
  @Input() summary = '';
  @Input() docs: AiDocRef[] = [];
  @Input() variant: AiAnswerTableVariant = 'default';
  @Input() followUp = '';

  @Output() docOpened = new EventEmitter<AiDocRef>();
  @Output() folderOpened = new EventEmitter<string>();

  statusVariant(doc: AiDocRef): StatusVariant {
    switch (doc.statusVariant) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error':   return 'error';
      default:        return 'inactive';
    }
  }
}
