import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

export type InlineMessageVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * DS Inline messages — Figma: liyNDiFf1piO8SQmHNKoeU, node 16160-9495
 *
 * DS specs:
 *   Inline, compact — no background, just icon + text
 *   Icon: 16px left
 *   Text: 13px
 *   Variants: info/success/warning/error
 *   Used inside forms, under inputs, in tables
 *
 * Usage:
 *   <fvdr-inline-message variant="error" text="This field is required" />
 *   <fvdr-inline-message variant="info" text="Changes will apply on next login" />
 */
@Component({
  selector: 'fvdr-inline-message',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span class="inline-msg inline-msg--{{ variant }}">
      <fvdr-icon [name]="iconName" class="inline-msg__icon" />
      <span class="inline-msg__text">{{ text }}</span>
    </span>
  `,
  styles: [`
    .inline-msg {
      display: inline-flex;
      align-items: flex-start;
      gap: 5px;
      font-family: var(--font-family);
      font-size: 13px;
      line-height: 20px;
    }
    .inline-msg__icon { font-size: 14px; margin-top: 3px; flex-shrink: 0; }

    .inline-msg--info    { color: var(--color-info-500); }
    .inline-msg--success { color: var(--color-primary-500); }
    .inline-msg--warning { color: var(--color-warning-700); }
    .inline-msg--error   { color: var(--color-error-600); }
  `],
})
export class InlineMessageComponent {
  @Input() variant: InlineMessageVariant = 'info';
  @Input() text = '';

  get iconName() {
    const map: Record<InlineMessageVariant, string> = {
      info: 'info', success: 'check', warning: 'attention', error: 'error',
    };
    return map[this.variant] as any;
  }
}
