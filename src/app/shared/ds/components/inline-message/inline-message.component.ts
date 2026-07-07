import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export type InlineMessageVariant = 'info' | 'success' | 'warning' | 'error';
export type InlineMessageSize = 's' | 'm' | 'l';

/**
 * DS Inline messages — Figma: liyNDiFf1piO8SQmHNKoeU, node 16160-9495
 *
 * A filled, rounded message box: severity-tinted background + severity-colored
 * status icon (16px) + primary-text copy. Fills or hugs its container.
 *
 *   Backgrounds  — Severities/*-bg tokens (info → grey-50)
 *   Icon colour  — Severities/*-icon tokens
 *   Text colour  — always primary text (#1F2129)
 *   Sizes (Figma): S 32px (px8/py6, 14px), M 40px (px12/py8, 15px), L 48px (px16/py12, 16px)
 *
 * Usage:
 *   <fvdr-inline-message variant="warning" text="You have unsaved changes" />
 *   <fvdr-inline-message variant="error" size="s" message="This field is required" />
 */
@Component({
  selector: 'fvdr-inline-message',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span class="im im--{{ variant }} im--{{ size }}">
      <fvdr-icon [name]="iconName" class="im__icon" />
      <span class="im__text">{{ text || message }}</span>
    </span>
  `,
  styles: [`
    .im {
      display: inline-flex; align-items: flex-start; gap: 8px;
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
      color: var(--color-text-primary);
      box-sizing: border-box;
    }
    .im__text { flex: 1 1 auto; min-width: 0; }
    .im__icon { flex-shrink: 0; font-size: var(--font-size-lg, 16px); }

    /* ── Sizes ── */
    .im--s { padding: 6px 8px; font-size: var(--font-size-base, 14px); line-height: var(--line-height-base, 20px); }
    .im--m { padding: 8px 12px; font-size: var(--font-size-md, 15px); line-height: var(--line-height-lg, 24px); }
    .im--l { padding: 12px 16px; font-size: var(--font-size-lg, 16px); line-height: var(--line-height-lg, 24px); }
    .im--s .im__icon { margin-top: 2px; }
    .im--m .im__icon,
    .im--l .im__icon { margin-top: 4px; }

    /* ── Variants (bg + icon colour; text stays primary) ── */
    .im--success { background: var(--color-success-bg); }
    .im--success .im__icon { color: var(--color-success-icon); }
    .im--warning { background: var(--color-warning-bg); }
    .im--warning .im__icon { color: var(--color-warning-icon); }
    .im--error { background: var(--color-error-bg); }
    .im--error .im__icon { color: var(--color-error-icon); }
    .im--info { background: var(--color-stone-200); }
    .im--info .im__icon { color: var(--color-alert-info); }
  `],
})
export class InlineMessageComponent {
  @Input() variant: InlineMessageVariant = 'info';
  @Input() size: InlineMessageSize = 'm';
  @Input() text = '';
  /** Alias for `text` (some call sites use `message`). */
  @Input() message = '';

  get iconName(): FvdrIconName {
    const map: Record<InlineMessageVariant, FvdrIconName> = {
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning',
      error: 'toast-error',
    };
    return map[this.variant];
  }
}
