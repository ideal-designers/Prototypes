import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiCitationComponent } from '../ai-citation/ai-citation.component';
import { AiDocRef } from '../ai.models';

/**
 * The collected sources of one answer, numbered to match the inline citation
 * markers and collapsed by default. Gives a reviewer one place to check
 * everything the answer stood on.
 */
@Component({
  selector: 'fvdr-ai-source-list',
  standalone: true,
  imports: [CommonModule, AiCitationComponent],
  template: `
    <div class="srcs" *ngIf="sources.length">
      <button
        type="button"
        class="srcs__toggle"
        [attr.aria-expanded]="expanded"
        (click)="toggled.emit()"
      >{{ label }}</button>

      <ol class="srcs__list" *ngIf="expanded">
        <li *ngFor="let s of sources; let i = index">
          <fvdr-ai-citation
            [index]="i + 1"
            [label]="s.name"
            [page]="s.page"
            [fileType]="s.type"
            (opened)="docOpened.emit(s)"
          ></fvdr-ai-citation>
        </li>
      </ol>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .srcs { display: flex; flex-direction: column; gap: var(--space-2); }

    .srcs__toggle {
      align-self: flex-start;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .srcs__toggle:hover { color: var(--color-text-primary); text-decoration: underline; }

    .srcs__list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-direction: column; gap: var(--space-1);
    }
  `],
})
export class AiSourceListComponent {
  @Input() sources: AiDocRef[] = [];
  @Input() expanded = false;

  @Output() toggled = new EventEmitter<void>();
  @Output() docOpened = new EventEmitter<AiDocRef>();

  get label(): string {
    const n = this.sources.length;
    return this.expanded ? 'Hide sources' : `${n} ${n === 1 ? 'source' : 'sources'}`;
  }
}
