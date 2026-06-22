import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * fvdr-plan-icon — Colored subscription-plan badge icon.
 *
 * Renders a rounded-square brand badge for an iDeals plan / data-room type.
 * Each plan ships in three native sizes (authored in Figma with a constant
 * 4px corner radius), served as standalone SVG assets from
 * /assets/plan-icons/{name}-{s|m|l}.svg.
 *
 * Sizes:  s → 24px · m → 32px (default) · l → 40px
 *
 * Usage:
 *   <fvdr-plan-icon name="vault" />
 *   <fvdr-plan-icon name="enterprise" size="l" />
 *   <fvdr-plan-icon name="trial" size="s" />
 */
export type FvdrPlanName =
  | 'basic'
  | 'business'
  | 'core'
  | 'demo-test'
  | 'elite'
  | 'enterprise'
  | 'premier'
  | 'preparation-area'
  | 'pro24'
  | 'trial'
  | 'vault'
  | 'vault-max'
  | 'vault-trial';

export type FvdrPlanIconSize = 's' | 'm' | 'l';

/** All plan names, in display order — handy for showcases / dropdowns. */
export const FVDR_PLAN_NAMES: FvdrPlanName[] = [
  'basic',
  'business',
  'core',
  'demo-test',
  'elite',
  'enterprise',
  'premier',
  'preparation-area',
  'pro24',
  'trial',
  'vault',
  'vault-max',
  'vault-trial',
];

const SIZE_PX: Record<FvdrPlanIconSize, number> = { s: 24, m: 32, l: 40 };

@Component({
  selector: 'fvdr-plan-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      [src]="src"
      [alt]="name + ' plan'"
      [width]="px"
      [height]="px"
      class="plan-icon"
      draggable="false"
    />
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .plan-icon {
      display: block;
      object-fit: contain;
    }
  `],
})
export class PlanIconComponent {
  /** Plan / data-room type to display. */
  @Input() name: FvdrPlanName = 'basic';

  /** Badge size: 's' (24px), 'm' (32px, default), 'l' (40px). */
  @Input() size: FvdrPlanIconSize = 'm';

  get px(): number {
    return SIZE_PX[this.size] ?? SIZE_PX['m'];
  }

  get src(): string {
    return `assets/plan-icons/${this.name}-${this.size}.svg`;
  }
}
