import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';

/**
 * The line that tells the reader an answer is permission-filtered.
 *
 * Non-negotiable in a data room: an incomplete answer that looks complete is a
 * liability. Deliberately quiet — no card, no fill. It must inform without
 * looking like an error, or people will learn to ignore it.
 */
@Component({
  selector: 'fvdr-ai-permission-note',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <p class="note" [class.note--warning]="tone === 'warning'">
      <fvdr-icon class="note__icon" name="lock-close"></fvdr-icon>
      <span>{{ resolvedMessage }}</span>
    </p>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .note {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0;
      font-size: var(--font-size-xs, 12px);
      line-height: var(--line-height-tight, 18px);
      color: var(--color-text-secondary);
    }
    .note__icon { flex: 0 0 auto; }
    .note--warning { color: var(--color-text-primary); }
    .note--warning .note__icon { color: var(--color-warning-600); }
  `],
})
export class AiPermissionNoteComponent {
  /** Overrides the count-derived default copy. */
  @Input() message = '';
  @Input() hiddenCount?: number | null;
  @Input() tone: 'info' | 'warning' = 'info';

  get resolvedMessage(): string {
    if (this.message) return this.message;
    if (this.hiddenCount != null && this.hiddenCount > 0) {
      const noun = this.hiddenCount === 1 ? 'document is' : 'documents are';
      return `Results filtered by your access — ${this.hiddenCount} ${noun} hidden.`;
    }
    return 'Results filtered by your access — some documents may be hidden.';
  }
}
