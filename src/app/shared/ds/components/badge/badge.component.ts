import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

/** The 14 Figma badge styles: Primary (Theme), Stone (Default) and 12 palette colours. */
export type BadgeColor =
  | 'primary' | 'stone' | 'green' | 'grey' | 'red' | 'blue' | 'teal'
  | 'lime' | 'orange' | 'yellow' | 'coffee' | 'magenta' | 'purple' | 'indigo';

/** Semantic names kept for existing screens — each maps to a Figma colour (see BADGE_ALIASES). */
export type BadgeSemantic = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type BadgeVariant = BadgeColor | BadgeSemantic;

/** xs = 16px · s = 20px (default) · m = 24px */
export type BadgeSize = 'xs' | 's' | 'm';

export const BADGE_COLORS: BadgeColor[] = [
  'primary', 'stone', 'green', 'grey', 'red', 'blue', 'teal',
  'lime', 'orange', 'yellow', 'coffee', 'magenta', 'purple', 'indigo',
];

const BADGE_ALIASES: Record<BadgeSemantic, BadgeColor> = {
  success: 'green',
  error:   'red',
  warning: 'yellow',
  info:    'blue',
  neutral: 'stone',
};

/**
 * DS Badge — Figma: liyNDiFf1piO8SQmHNKoeU, "↳ Badges ✅" page 37560:21312, component set 37560:22038
 *
 * Figma props → inputs:
 *   Style (14)      → variant   primary | stone | green | grey | red | blue | teal | lime | orange | yellow | coffee | magenta | purple | indigo
 *                                (semantic aliases still work: success→green, error→red, warning→yellow, info→blue, neutral→stone)
 *   Size            → size      xs (16) | s (20, default) | m (24)
 *   Rounded         → rounded   false = 4px corners (default) · true = pill
 *   Color bold      → bold      false = tinted fill + coloured text (default) · true = solid fill + white text
 *   Icon start      → icon      any FvdrIconName (14px; 16px at size m)
 *   Has label       → label     leave empty for an icon-only badge
 *
 * Text: Caption 2 (12px, 600). Padding 4/6/8, gap 4.
 *
 * Usage:
 *   <fvdr-badge label="New" />
 *   <fvdr-badge label="Overdue" variant="red" [bold]="true" />
 *   <fvdr-badge label="Pending" variant="yellow" size="m" icon="clock" [rounded]="true" />
 */
@Component({
  selector: 'fvdr-badge',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span class="badge badge--{{ color }} badge--{{ size }}"
          [class.badge--bold]="bold"
          [class.badge--rounded]="rounded"
          [class.badge--icon-only]="!!icon && !label">
      <fvdr-icon *ngIf="icon" [name]="icon" class="badge__icon"></fvdr-icon>
      <span *ngIf="label" class="badge__label">{{ label }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; vertical-align: middle; }

    .badge {
      --bd-bg: var(--chip-bg-default);
      --bd-fg: var(--badge-fg-stone);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      box-sizing: border-box;
      height: var(--space-5);              /* s — 20 */
      padding: 0 6px;                      /* Figma s-20: 6 */
      border-radius: var(--radius-sm);
      background: var(--bd-bg);
      color: var(--bd-fg);
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);     /* 12px */
      font-weight: var(--text-caption2-weight); /* 600 */
      line-height: var(--text-caption2-lh);
      white-space: nowrap;
    }

    /* Sizes */
    .badge--xs { height: var(--space-4); padding: 0 var(--space-1); }   /* 16 · pad 4 */
    .badge--m  { height: var(--space-6); padding: 0 var(--space-2); }   /* 24 · pad 8 */
    .badge--icon-only { padding: 0; aspect-ratio: 1; }

    .badge--rounded { border-radius: var(--radius-full); }

    .badge__icon { font-size: var(--font-size-base); flex: none; }   /* 14 */
    .badge--m .badge__icon { font-size: var(--space-4); }

    /* Colours — light: tinted fill + coloured text */
    .badge--primary { --bd-bg: var(--color-primary-50); --bd-fg: var(--color-primary-500); }
    .badge--stone   { --bd-bg: var(--chip-bg-default);  --bd-fg: var(--badge-fg-stone); }
    .badge--green   { --bd-bg: var(--chip-bg-green);    --bd-fg: var(--badge-fg-green); }
    .badge--grey    { --bd-bg: var(--chip-bg-grey);     --bd-fg: var(--badge-fg-grey); }
    .badge--red     { --bd-bg: var(--chip-bg-danger);   --bd-fg: var(--badge-fg-red); }
    .badge--blue    { --bd-bg: var(--chip-bg-blue);     --bd-fg: var(--badge-fg-blue); }
    .badge--teal    { --bd-bg: var(--chip-bg-teal);     --bd-fg: var(--badge-fg-teal); }
    .badge--lime    { --bd-bg: var(--chip-bg-lime);     --bd-fg: var(--badge-fg-lime); }
    .badge--orange  { --bd-bg: var(--chip-bg-orange);   --bd-fg: var(--badge-fg-orange); }
    .badge--yellow  { --bd-bg: var(--chip-bg-yellow);   --bd-fg: var(--badge-fg-yellow); }
    .badge--coffee  { --bd-bg: var(--chip-bg-coffee);   --bd-fg: var(--badge-fg-coffee); }
    .badge--magenta { --bd-bg: var(--chip-bg-magenta);  --bd-fg: var(--badge-fg-magenta); }
    .badge--purple  { --bd-bg: var(--chip-bg-purple);   --bd-fg: var(--badge-fg-purple); }
    .badge--indigo  { --bd-bg: var(--chip-bg-indigo);   --bd-fg: var(--badge-fg-indigo); }

    /* Bold: solid fill + white text */
    .badge--bold { background: var(--bd-fg); color: var(--badge-fg-on-bold); }
  `],
})
export class BadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'primary';
  @Input() size: BadgeSize = 's';
  @Input() rounded = false;
  @Input() bold = false;
  @Input() icon?: FvdrIconName;

  get color(): BadgeColor {
    return (BADGE_ALIASES as Record<string, BadgeColor>)[this.variant] ?? (this.variant as BadgeColor);
  }
}
