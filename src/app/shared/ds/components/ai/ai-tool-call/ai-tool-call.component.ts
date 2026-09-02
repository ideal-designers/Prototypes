import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { FvdrIconName } from '../../../icons/icons';
import { ButtonComponent } from '../../button/button.component';

export type AiToolCallStatus = 'running' | 'done' | 'error' | 'needs-confirm';

/**
 * One action the assistant took on the room — searched documents, read a file,
 * drafted a Q&A answer, created a folder.
 *
 * Distinct from AI Steps: steps narrate, a tool call is an auditable operation
 * with a target, a result and a status. A write operation must arrive as
 * `needs-confirm` — it never runs without an explicit click.
 */
@Component({
  selector: 'fvdr-ai-tool-call',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <div class="tool" [class.tool--error]="status === 'error'" [class.tool--confirm]="status === 'needs-confirm'">
      <div class="tool__head">
        <button
          type="button"
          class="tool__toggle"
          [attr.aria-expanded]="expanded"
          [disabled]="status === 'needs-confirm'"
          (click)="toggled.emit()"
        >
          <fvdr-icon class="tool__chevron" *ngIf="status !== 'needs-confirm'" [name]="expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
          <fvdr-icon class="tool__icon" [name]="icon"></fvdr-icon>
          <span class="tool__title">{{ title }}</span>
          <span class="tool__target" *ngIf="target" [attr.title]="target">{{ target }}</span>
        </button>

        <span class="tool__status">
          <fvdr-icon class="tool__spin" *ngIf="status === 'running'" name="spinner"></fvdr-icon>
          <span class="tool__count" *ngIf="status === 'done' && resultCount != null">{{ resultCount }}</span>
          <fvdr-icon class="tool__done" *ngIf="status === 'done' && resultCount == null" name="check"></fvdr-icon>
          <fvdr-icon class="tool__err" *ngIf="status === 'error'" name="attention"></fvdr-icon>

          <ng-container *ngIf="status === 'needs-confirm'">
            <fvdr-btn variant="ghost" size="s" label="Cancel" (clicked)="cancelled.emit()"></fvdr-btn>
            <fvdr-btn variant="primary" size="s" [label]="confirmLabel" (clicked)="confirmed.emit()"></fvdr-btn>
          </ng-container>
        </span>
      </div>

      <div class="tool__body" *ngIf="expanded && status !== 'needs-confirm'">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .tool {
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
      overflow: hidden;
    }
    .tool--error { border-color: var(--color-error-600); }
    /* A pending write is the one state allowed to draw attention. */
    .tool--confirm { border-color: var(--color-primary-500); background: var(--color-primary-50); }

    .tool__head {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 40px;
      padding: 0 var(--space-2) 0 var(--space-3);
    }

    .tool__toggle {
      display: flex; align-items: center; gap: var(--space-2);
      flex: 1; min-width: 0;
      border: none; background: transparent; padding: var(--space-2) 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
      cursor: pointer; text-align: left;
    }
    .tool__toggle:disabled { cursor: default; }

    .tool__chevron { flex: 0 0 auto; color: var(--color-text-secondary); font-size: var(--font-size-xs, 12px); }
    .tool__icon { flex: 0 0 auto; color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .tool__title { flex: 0 0 auto; }
    .tool__target {
      min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm, 13px);
    }

    .tool__status { display: flex; align-items: center; gap: var(--space-1); flex: 0 0 auto; }
    .tool__count {
      min-width: 20px; padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs, 12px);
      text-align: center;
    }
    .tool__done { color: var(--color-primary-500); font-size: var(--font-size-sm, 13px); }
    .tool__err  { color: var(--color-error-600); font-size: var(--font-size-sm, 13px); }
    .tool__spin { color: var(--color-text-secondary); font-size: var(--font-size-sm, 13px); animation: tool-spin 1s linear infinite; }
    @keyframes tool-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .tool__spin { animation: none; } }

    .tool__body {
      padding: var(--space-3);
      border-top: 1px solid var(--color-divider);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }
  `],
})
export class AiToolCallComponent {
  @Input() icon: FvdrIconName = 'search';
  @Input({ required: true }) title = '';
  /** What it acted on — a folder path, a document name. */
  @Input() target = '';
  @Input() status: AiToolCallStatus = 'done';
  @Input() resultCount?: number | null;
  @Input() expanded = false;
  @Input() confirmLabel = 'Run';

  @Output() toggled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
