import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName } from '../../../shared/ds';

/**
 * Centred empty state, as the live product uses it on Signatures, Due diligence
 * checklist, Permissions and Recycle bin (`.design/real-product-spec.md`
 * section 1, "Empty state").
 *
 * The illustration is projected, because the artwork differs per page and is
 * decorative (each page ships its own inline SVG):
 *
 *   <fvdr-vdr-empty-state title="Recycle bin is empty"
 *                         [subtitle]="['All deleted files will appear here']">
 *     <svg>...</svg>
 *   </fvdr-vdr-empty-state>
 *
 * Multi-step empty states (Signatures, Q&A onboarding) project a whole row of
 * numbered illustrations into the same slot and set [wide]="true".
 * The button is inert.
 */
@Component({
  selector: 'fvdr-vdr-empty-state',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="empty" [class.empty--wide]="wide">
  <div class="empty__art"><ng-content></ng-content></div>

  <h2 class="empty__title">{{ title }}</h2>

  <p class="empty__sub" *ngFor="let line of subtitle">{{ line }}</p>

  <fvdr-btn
    *ngIf="buttonLabel"
    class="empty__btn"
    size="m"
    [variant]="buttonVariant"
    [label]="buttonLabel"
    [iconName]="buttonIcon"
  ></fvdr-btn>

  <ng-content select="[empty-footer]"></ng-content>
</div>
  `,
  styles: [`
    :host { display: block; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 420px;
      margin: 0 auto;
      padding: var(--space-12) var(--space-6);
    }
    .empty--wide { max-width: 820px; }

    .empty__art { margin-bottom: var(--space-5); color: var(--color-stone-500); }
    /* Multi-step states put their artwork in [empty-footer] instead */
    .empty__art:empty { display: none; }

    .empty__title {
      margin: 0;
      font-size: var(--font-size-2xl, 20px);
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .empty__sub {
      margin: var(--space-2) 0 0;
      font-size: var(--font-size-md, 15px);
      line-height: 22px;
      color: var(--color-text-secondary);
    }

    .empty__btn { margin-top: var(--space-5); }
  `],
})
export class VdrEmptyStateComponent {
  @Input() title = '';
  /** One line per array entry — the product wraps its own copy manually. */
  @Input() subtitle: string[] = [];
  @Input() buttonLabel?: string;
  @Input() buttonIcon?: FvdrIconName;
  @Input() buttonVariant: 'primary' | 'secondary' = 'primary';
  /** Widen for multi-step (3 illustration) empty states. */
  @Input() wide = false;
}
