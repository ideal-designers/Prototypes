import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { TableAnswer } from '../../models/ai-scenario.model';
import {
  DOC_FILE_ICON,
  MockDocType,
  MockDocument,
  docSizeMeta,
} from '../../models/mock-doc.model';

/** Keep in sync with `.preview { width }`. */
const PREVIEW_WIDTH = 280;

interface DocPreview {
  doc: MockDocument;
  top: number;
  left: number;
}

/**
 * Compact multi-result answer — numbered document list used by the docked and
 * floating shells (the full-screen shell keeps `fvdr-ai-answer-table`).
 * Metadata is trimmed to Modified / Size; Location and the page count stay
 * reachable through the hover preview.
 */
@Component({
  selector: 'fvdr-ai-answer-doc-list',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="res">
      <!-- Nothing to number — fall back to the lead-in so the count is still stated. -->
      <p class="res__summary" *ngIf="!answer.docs.length">{{ answer.summary }}</p>

      <ol class="docs">
        <li class="docs__item" *ngFor="let d of answer.docs; let i = index">
          <div class="docs__head">
            <span class="docs__marker">{{ i + 1 }}.</span>
            <fvdr-file-icon [type]="fileIcon(d.type)"></fvdr-file-icon>
            <button
              type="button"
              class="docs__link"
              (click)="docOpened.emit(d)"
              (mouseenter)="showPreview(d, $event)"
              (mouseleave)="hidePreview()"
            >{{ d.index }} {{ d.name }}</button>
          </div>

          <ul class="docs__meta">
            <li>
              <span class="docs__marker">•</span>
              <span>Modified: {{ d.addedOn }}</span>
            </li>
            <li *ngIf="signatures; else sizeRow">
              <span class="docs__marker">•</span>
              <span>Signature status: {{ d.signatureStatus }}</span>
            </li>
            <ng-template #sizeRow>
              <li>
                <span class="docs__marker">•</span>
                <span>Size: {{ d.sizeLabel }}</span>
              </li>
            </ng-template>
          </ul>
        </li>
      </ol>

      <p class="res__follow" *ngIf="answer.followUp">{{ answer.followUp }}</p>
    </div>

    <!-- Hover preview (fixed, so the transcript's scroll container can't clip it) -->
    <div
      class="preview"
      *ngIf="preview as p"
      [style.top.px]="p.top"
      [style.left.px]="p.left"
    >
      <div class="preview__thumb"><fvdr-file-icon [type]="fileIcon(p.doc.type)"></fvdr-file-icon></div>
      <div class="preview__body">
        <span class="preview__title">{{ p.doc.name }}</span>
        <span class="preview__row">Location: {{ p.doc.folderPath }}</span>
        <span class="preview__row">Size: {{ sizeMeta(p.doc) }}</span>
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
    .res__follow { color: var(--color-text-primary); }

    /* Numbers and bullets share one gutter column, as in the design. */
    .docs {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    .docs__item { display: flex; flex-direction: column; gap: var(--space-2); }

    /* Top-aligned so a wrapping name keeps its number and icon on the first line. */
    .docs__head { display: flex; align-items: flex-start; gap: var(--space-2); }
    .docs__head fvdr-file-icon { flex-shrink: 0; }

    .docs__marker {
      flex-shrink: 0;
      min-width: var(--space-4);
      color: var(--color-text-primary);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
    }

    .docs__link {
      border: none; background: transparent; padding: 0; margin: 0;
      min-width: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-primary-500);
      text-decoration: underline;
      cursor: pointer; text-align: left;
      overflow-wrap: anywhere;
    }
    .docs__link:hover { color: var(--color-primary-600); }

    .docs__meta {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--space-1);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }
    .docs__meta li { display: flex; align-items: baseline; gap: var(--space-2); }

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
export class AiAnswerDocListComponent {
  @Input({ required: true }) answer!: TableAnswer;
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();

  preview: DocPreview | null = null;

  /** DS file-icon glyph for a document extension. */
  fileIcon(type: MockDocType) {
    return DOC_FILE_ICON[type];
  }

  /** "412.05 KB · 24 pages", or just the size when the file has no page count. */
  sizeMeta(doc: MockDocument): string {
    return docSizeMeta(doc);
  }

  /** Scenario C1 swaps the Size line for the signature status. */
  get signatures(): boolean {
    return this.answer.variant === 'signatures';
  }

  showPreview(doc: MockDocument, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // Narrow shells sit near the right edge — keep the card on screen.
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PREVIEW_WIDTH - 8));
    this.preview = { doc, top: rect.bottom + 8, left };
  }

  hidePreview(): void {
    this.preview = null;
  }
}
