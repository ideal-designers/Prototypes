import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary';

/**
 * DS Badge/Tag — Figma: ↳ Chips & chip, tag ⌛️
 *
 * DS specs:
 *   text: Hint/Caption-2 → 12px w600 lh=16px
 *   padding: 2px 8px, radius full
 *
 * Usage:
 *   <fvdr-badge label="New" />
 *   <fvdr-badge label="Error" variant="error" />
 *   <fvdr-badge label="5" variant="info" />
 */
@Component({
  selector: 'fvdr-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge badge--{{ variant }}">{{ label }}</span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);   /* 12px */
      font-weight: var(--text-caption2-weight); /* 600 */
      line-height: var(--text-caption2-lh);
      white-space: nowrap;
    }

    .badge--primary {
      background: var(--color-primary-50);
      color: var(--color-primary-500);
    }
    .badge--success {
      background: var(--color-success-bg);
      color: var(--color-success-icon);
    }
    .badge--error {
      background: var(--color-error-bg);
      color: var(--color-error-600);
    }
    .badge--warning {
      background: var(--color-warning-bg);
      color: var(--color-warning-700);
    }
    .badge--info {
      background: var(--color-feature-bg);
      color: var(--color-info-500);
    }
    .badge--neutral {
      background: var(--color-stone-0);
      color: var(--color-text-secondary);
    }
  `],
})
export class BadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'primary';
}
