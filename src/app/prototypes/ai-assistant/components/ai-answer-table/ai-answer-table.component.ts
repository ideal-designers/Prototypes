import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, StatusVariant, TableColumn } from '../../../../shared/ds';
import { TableAnswer } from '../../models/ai-scenario.model';
import { MockDocument } from '../../models/mock-doc.model';

interface DocPreview {
  doc: MockDocument;
  top: number;
  left: number;
}

/** Multi-result answer — summary line, result table, follow-up offer. */
@Component({
  selector: 'fvdr-ai-answer-table',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="res">
      <p class="res__summary">{{ answer.summary }}</p>

      <fvdr-table [columns]="columns" [data]="answer.docs">
        <ng-template fvdrCell="name" let-value let-row="row">
          <span class="res__name">
            <fvdr-file-icon [type]="row.type"></fvdr-file-icon>
            <button
              type="button"
              class="res__link"
              (click)="docOpened.emit(row)"
              (mouseenter)="showPreview(row, $event)"
              (mouseleave)="hidePreview()"
            >{{ value }}</button>
          </span>
        </ng-template>

        <ng-template fvdrCell="folderPath" let-value>
          <button type="button" class="res__link res__link--muted" (click)="folderOpened.emit(value)">
            {{ value }}
          </button>
        </ng-template>

        <ng-template fvdrCell="sizeLabel" let-value let-row="row">
          {{ value }} · {{ row.pages }} pages
        </ng-template>

        <ng-template fvdrCell="signatureStatus" let-value>
          <fvdr-status [label]="value" [variant]="statusVariant(value)"></fvdr-status>
        </ng-template>
      </fvdr-table>

      <p class="res__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>

    <!-- Hover preview (fixed, so the table's scroll container can't clip it) -->
    <div
      class="preview"
      *ngIf="preview as p"
      [style.top.px]="p.top"
      [style.left.px]="p.left"
    >
      <div class="preview__thumb"><fvdr-file-icon [type]="p.doc.type"></fvdr-file-icon></div>
      <div class="preview__body">
        <span class="preview__title">{{ p.doc.name }}</span>
        <span class="preview__row">Location: {{ p.doc.folderPath }}</span>
        <span class="preview__row">Size: {{ p.doc.sizeLabel }} · {{ p.doc.pages }} pages</span>
        <span class="preview__row">Added on: {{ p.doc.addedOn }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .res { display: flex; flex-direction: column; gap: var(--space-3); }
    .res__summary, .res__follow {
      margin: 0;
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
    }
    .res__summary { color: var(--color-text-primary); }
    .res__follow { color: var(--color-text-secondary); }

    .res__name { display: inline-flex; align-items: center; gap: var(--space-2); }

    .res__link {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
    }
    .res__link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .res__link--muted { color: var(--color-text-secondary); }
    .res__link--muted:hover { color: var(--color-text-primary); }

    .preview {
      position: fixed; z-index: 300;
      display: flex; gap: var(--space-3);
      width: 280px; padding: var(--space-3);
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      pointer-events: none;
    }
    .preview__thumb {
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 60px; flex-shrink: 0;
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
    }
    .preview__body { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
    .preview__title {
      font-size: var(--font-size-sm, 13px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }
    .preview__row {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiAnswerTableComponent {
  @Input({ required: true }) answer!: TableAnswer;
  /** True inside the docked / floating shells. */
  @Input() compact = false;
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();

  preview: DocPreview | null = null;

  private readonly defaultColumns: TableColumn[] = [
    { key: 'index', label: 'Index', width: '88px' },
    { key: 'name', label: 'Name' },
    { key: 'folderPath', label: 'Location' },
    { key: 'sizeLabel', label: 'Size', width: '190px' },
    { key: 'addedOn', label: 'Added on', width: '150px' },
  ];

  /** Scenario C1 swaps Index/Size for the signature status. */
  private readonly signatureColumns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'folderPath', label: 'Location' },
    { key: 'signatureStatus', label: 'Signature status', width: '170px' },
    { key: 'addedOn', label: 'Added on', width: '150px' },
  ];

  /** Narrow shells drop the secondary columns — the hover preview still carries them. */
  private readonly compactColumns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'folderPath', label: 'Location' },
    { key: 'addedOn', label: 'Added on' },
  ];

  private readonly compactSignatureColumns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'signatureStatus', label: 'Signature status' },
  ];

  get columns(): TableColumn[] {
    const signatures = this.answer.variant === 'signatures';
    if (this.compact) return signatures ? this.compactSignatureColumns : this.compactColumns;
    return signatures ? this.signatureColumns : this.defaultColumns;
  }

  /** "0/2 signed" reads as blocking, "1/2 signed" as in progress. */
  statusVariant(status: string): StatusVariant {
    return /^0\s*\//.test(status) ? 'error' : 'warning';
  }

  showPreview(doc: MockDocument, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.preview = { doc, top: rect.bottom + 8, left: rect.left };
  }

  hidePreview(): void {
    this.preview = null;
  }
}
