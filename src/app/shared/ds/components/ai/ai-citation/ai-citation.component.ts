import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent, FvdrFileType } from '../../file-icon/file-icon.component';

export type AiCitationVariant = 'inline' | 'pill';

/**
 * Source reference under (or inside) an AI answer — the audit trail of a VDR answer.
 * Every generated claim must be traceable to the document it came from, so this is
 * the one AI atom that is never optional.
 *
 *   · inline → link-styled, sits at the end of a sentence or under a key point
 *   · pill   → bordered chip, for rows of sources under a paragraph
 */
@Component({
  selector: 'fvdr-ai-citation',
  standalone: true,
  imports: [CommonModule, FileIconComponent],
  template: `
    <button
      type="button"
      class="cite"
      [class.cite--pill]="variant === 'pill'"
      [attr.title]="title"
      [attr.aria-label]="ariaLabel"
      (click)="opened.emit()"
    >
      <span class="cite__index" *ngIf="index">{{ index }}</span>
      <fvdr-file-icon class="cite__icon" *ngIf="showIcon" [type]="fileType"></fvdr-file-icon>
      <span class="cite__name">{{ label }}</span>
      <span class="cite__page" *ngIf="page">· p. {{ page }}</span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; max-width: 100%; font-family: var(--font-family); }

    .cite {
      display: inline-flex; align-items: center; gap: var(--space-1);
      max-width: 100%;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      line-height: var(--line-height-tight, 18px);
      color: var(--color-primary-500);
      cursor: pointer; text-align: left;
    }
    .cite:hover { color: var(--color-primary-600); }
    .cite:hover .cite__name { text-decoration: underline; }

    /* Bordered variant — for a row of sources rather than an end-of-sentence link. */
    .cite--pill {
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-full);
      padding: 2px var(--space-2) 2px var(--space-1);
      background: var(--color-stone-0);
      color: var(--color-text-secondary);
    }
    .cite--pill:hover {
      background: var(--color-hover-bg);
      border-color: var(--color-stone-500);
      color: var(--color-text-primary);
    }
    .cite--pill:hover .cite__name { text-decoration: none; }

    /* Superscript-style marker, matching a numbered source list. */
    .cite__index {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 16px; height: 16px; padding: 0 4px;
      border-radius: var(--radius-sm);
      /* --chip-bg-* flips with the theme; --color-primary-50/700 do not, and in
         dark they collapse to dark green on dark green. */
      background: var(--chip-bg-green);
      color: var(--color-text-primary);
      font-size: var(--font-size-3xs, 10px);
      font-weight: var(--font-weight-semi, 600);
    }
    .cite__icon { flex: 0 0 auto; }
    .cite__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cite__page { flex: 0 0 auto; color: var(--color-text-secondary); }
  `],
})
export class AiCitationComponent {
  /** Document or folder name. */
  @Input({ required: true }) label = '';
  /** Page / sheet the claim came from — omit when the whole document is the source. */
  @Input() page?: number | string;
  /** Ordinal marker when the answer keeps a numbered source list. */
  @Input() index?: number;
  @Input() fileType: FvdrFileType = 'pdf';
  @Input() showIcon = true;
  @Input() variant: AiCitationVariant = 'inline';

  @Output() opened = new EventEmitter<void>();

  get title(): string {
    return this.page ? `Open ${this.label}, page ${this.page}` : `Open ${this.label}`;
  }

  get ariaLabel(): string {
    return `Source: ${this.title}`;
  }
}
