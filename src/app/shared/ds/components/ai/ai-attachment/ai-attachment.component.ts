import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { FileIconComponent, FvdrFileType } from '../../file-icon/file-icon.component';

export type AiAttachmentState = 'ready' | 'indexing' | 'error';

/**
 * A context chip inside the composer — the documents or folders this prompt is
 * pinned to. In a data room the attachment is a reference to something already
 * in the room, not an upload.
 */
@Component({
  selector: 'fvdr-ai-attachment',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, FileIconComponent],
  template: `
    <div class="att" [class.att--error]="state === 'error'">
      <fvdr-file-icon class="att__icon" [type]="fileType"></fvdr-file-icon>
      <span class="att__name" [attr.title]="label">{{ label }}</span>
      <span class="att__meta" *ngIf="meta">{{ meta }}</span>

      <fvdr-icon class="att__state att__state--spin" *ngIf="state === 'indexing'" name="spinner" title="Indexing"></fvdr-icon>
      <fvdr-icon class="att__state att__state--error" *ngIf="state === 'error'" name="attention" title="Could not be read"></fvdr-icon>

      <button
        *ngIf="removable"
        type="button"
        class="att__remove"
        [attr.aria-label]="'Remove ' + label"
        title="Remove"
        (click)="removed.emit()"
      >
        <fvdr-icon name="close"></fvdr-icon>
      </button>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; max-width: 100%; font-family: var(--font-family); }

    .att {
      display: inline-flex; align-items: center; gap: var(--space-1);
      max-width: 100%;
      height: 26px;
      padding: 0 var(--space-1) 0 var(--space-2);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-primary);
    }
    .att--error { border-color: var(--color-error-600); }

    .att__icon { flex: 0 0 auto; }
    .att__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .att__meta { flex: 0 0 auto; color: var(--color-text-secondary); }

    .att__state { flex: 0 0 auto; font-size: var(--font-size-sm, 13px); }
    .att__state--error { color: var(--color-error-600); }
    .att__state--spin { color: var(--color-text-secondary); animation: att-spin 1s linear infinite; }
    @keyframes att-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .att__state--spin { animation: none; } }

    .att__remove {
      display: inline-flex; align-items: center; justify-content: center;
      flex: 0 0 auto;
      width: 18px; height: 18px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs, 12px);
    }
    .att__remove:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
  `],
})
export class AiAttachmentComponent {
  @Input({ required: true }) label = '';
  @Input() fileType: FvdrFileType = 'pdf';
  /** e.g. "24 docs" for a folder attachment. */
  @Input() meta = '';
  @Input() removable = true;
  @Input() state: AiAttachmentState = 'ready';

  @Output() removed = new EventEmitter<void>();
}
