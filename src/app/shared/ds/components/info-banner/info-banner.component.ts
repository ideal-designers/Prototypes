import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * DS Info Banner / Message — Figma: ↳ Alerts/Toasts ⌛️
 *
 * DS specs (from Severities/* colors):
 *   info    → bg #F7F7F7,  border #DEE0EB,  icon #358CEB
 *   success → bg #E8F5EE,  border #A5D6B9,  icon #2C9C74
 *   warning → bg #FFFAE0,  border #FFE480,  icon #D1B200
 *   error   → bg #FDF0EE,  border #F5C4BC,  icon #E54430
 *   text: UI/Base Component S → 14px w400 lh=20px
 *
 * Usage:
 *   <fvdr-info-banner message="Only corporate-level integrations can be enabled." />
 *   <fvdr-info-banner variant="warning" message="This affects new projects only." />
 *   <fvdr-info-banner variant="error" message="Access denied." />
 */
@Component({
  selector: 'fvdr-info-banner',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <div class="banner banner--{{ variant }}" role="alert">
      <svg class="banner__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
        <path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <div class="banner__content">
        <span *ngIf="title" class="banner__title">{{ title }}</span>
        <span class="banner__message">
          {{ message }}
          <ng-content></ng-content>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .banner {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid;
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
    }

    .banner--info {
      background: var(--color-stone-0);
      border-color: var(--color-stone-400);
    }
    .banner--info .banner__icon { color: var(--color-info-500); }

    .banner--success {
      background: var(--color-success-bg);
      border-color: var(--color-success-border);
    }
    .banner--success .banner__icon { color: var(--color-success-icon); }

    .banner--warning {
      background: var(--color-warning-bg);
      border-color: var(--color-warning-border);
    }
    .banner--warning .banner__icon { color: var(--color-warning-icon); }

    .banner--error {
      background: var(--color-error-bg);
      border-color: var(--color-error-border);
    }
    .banner--error .banner__icon { color: var(--color-error-600); }

    .banner__icon { flex-shrink: 0; margin-top: 2px; }
    .banner__content { display: flex; flex-direction: column; gap: 2px; }
    .banner__title { font-weight: 600; }
    .banner__message { color: var(--color-text-primary); }
  `],
})
export class InfoBannerComponent {
  @Input() message = '';
  @Input() title = '';
  @Input() variant: BannerVariant = 'info';
}
