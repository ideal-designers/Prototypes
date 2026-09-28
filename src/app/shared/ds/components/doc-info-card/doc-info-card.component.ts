import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent, FvdrFileType } from '../file-icon/file-icon.component';

export interface DocInfoField { label: string; value: string }

/**
 * Document info card — the hover preview of a file: name, first-page thumbnail, key facts.
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › "Folder info" popover on 422:20411 / 426:42122.
 * 320px wide, 16px padding, 12px rhythm; fields are label (80px, primary) + value (secondary).
 *
 * Presentational only — the host positions it (absolute / fixed) and decides when it shows,
 * so it works under a citation chip, a table row or a tree node alike.
 * Without `thumbSrc` it draws a neutral page placeholder, never a broken image.
 *
 * Usage:
 *   <fvdr-doc-info-card name="5.5.3 Asset Purchase Agreement.pdf" type="pdf"
 *     [fields]="[{label:'Added on:', value:'Apr 4, 2023'}, {label:'Pages:', value:'40'}]" />
 */
@Component({
  selector: 'fvdr-doc-info-card',
  standalone: true,
  imports: [CommonModule, FileIconComponent],
  template: `
    <div class="dic" role="tooltip">
      <div class="dic__head">
        <fvdr-file-icon class="dic__icon" [type]="type"></fvdr-file-icon>
        <span class="dic__name" [title]="name">{{ name }}</span>
      </div>

      <div class="dic__thumb" aria-hidden="true">
        <img *ngIf="thumbSrc; else pagePh" [src]="thumbSrc" alt="" />
        <ng-template #pagePh>
          <div class="dic__page">
            <span class="dic__line dic__line--title"></span>
            <span class="dic__line dic__line--title dic__line--short"></span>
            <span class="dic__line" *ngFor="let w of lines" [style.width.%]="w"></span>
          </div>
        </ng-template>
      </div>

      <dl class="dic__fields" *ngIf="fields.length">
        <div class="dic__row" *ngFor="let f of fields">
          <dt>{{ f.label }}</dt>
          <dd>{{ f.value }}</dd>
        </div>
      </dl>
    </div>
  `,
  styles: [`
    :host { display: block; width: 320px; font-family: var(--font-family); }

    .dic {
      display: flex; flex-direction: column; align-items: stretch; gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popup, 0 4px 16px rgba(0, 0, 0, 0.12));
    }

    .dic__head { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .dic__icon { flex: 0 0 auto; display: inline-flex; }
    .dic__name {
      min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--font-size-base, 14px); line-height: 20px; color: var(--color-text-primary);
    }

    .dic__thumb { display: flex; justify-content: center; }
    .dic__thumb img { width: 80px; height: 113px; object-fit: cover; border: 1px solid var(--color-divider); }
    .dic__page {
      display: flex; flex-direction: column; gap: 3px;
      width: 80px; height: 113px; padding: var(--space-2) 7px;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      box-sizing: border-box; overflow: hidden;
    }
    .dic__line { display: block; height: 2px; border-radius: 1px; background: var(--color-stone-400); flex: 0 0 auto; }
    .dic__line--title { height: 3px; background: var(--color-stone-700); width: 90%; }
    .dic__line--short { width: 60%; margin-bottom: 3px; }

    .dic__fields { display: flex; flex-direction: column; gap: var(--space-1); margin: 0; }
    .dic__row { display: flex; gap: var(--space-4); font-size: var(--text-caption1-size, 12px); line-height: 16px; }
    .dic__row dt { flex: 0 0 80px; margin: 0; color: var(--color-text-primary); }
    .dic__row dd { flex: 1; min-width: 0; margin: 0; color: var(--color-text-secondary); }
  `],
})
export class DocInfoCardComponent {
  @Input({ required: true }) name = '';
  @Input() type: FvdrFileType = 'pdf';
  /** First-page image. Omit for the drawn page placeholder. */
  @Input() thumbSrc?: string;
  @Input() fields: DocInfoField[] = [];

  readonly lines = [92, 70, 84, 88, 60, 90, 76, 86, 64, 92, 80, 70, 88, 58, 84, 90, 72, 66];
}
