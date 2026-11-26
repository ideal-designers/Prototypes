import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { AI_SCOPE_ICON, AiScopeKind } from '../ai.models';

/**
 * What the assistant is currently allowed to look at, and the control to change it.
 *
 * Scope drives answer quality more than any other input in a data room, so it is
 * visible before the user types — not buried in a menu. Reads as a caption, not
 * a toolbar: no border, no fill, 32px tall.
 */
@Component({
  selector: 'fvdr-ai-scope-bar',
  standalone: true,
  imports: [CommonModule, FileIconComponent],
  template: `
    <!-- Banner (Figma "Chat · 1.1 · Scope · Applied in chat"): the chat is limited to a selection -->
    <div class="scope-banner" *ngIf="variant === 'banner'; else caption" role="status">
      <fvdr-file-icon class="scope__icon" type="folder"></fvdr-file-icon>
      <span class="scope-banner__text">{{ label }}</span>
      <button *ngIf="editable" type="button" class="scope__change" (click)="changeRequested.emit()">{{ changeLabel }}</button>
      <button type="button" class="scope__reset" (click)="resetRequested.emit()">{{ resetLabel }}</button>
    </div>

    <ng-template #caption>
    <div class="scope">
      <fvdr-file-icon class="scope__icon" [type]="icon"></fvdr-file-icon>
      <span class="scope__label" [attr.title]="label">{{ label }}</span>
      <span class="scope__count" *ngIf="docCount != null">· {{ docCount }} {{ docCount === 1 ? 'document' : 'documents' }}</span>
      <span class="scope__spacer"></span>
      <button
        *ngIf="editable"
        type="button"
        class="scope__change"
        (click)="changeRequested.emit()"
      >{{ changeLabel }}</button>
    </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .scope {
      display: flex; align-items: center; gap: var(--space-1);
      height: 32px;
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }

    .scope__icon { flex: 0 0 auto; }
    .scope__label {
      min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--color-text-primary);
    }
    .scope__count { flex: 0 0 auto; }
    .scope__spacer { flex: 1; }

    .scope__change {
      flex: 0 0 auto;
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-primary-500);
      cursor: pointer;
    }
    .scope__change:hover { color: var(--color-primary-600); text-decoration: underline; }

    .scope-banner {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: var(--space-10);
      padding: 0 var(--space-3);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      background: var(--color-primary-50);
      font-size: var(--text-body3-size); line-height: var(--text-body3-lh);
      color: var(--color-text-primary);
    }
    .scope-banner__text { flex: 1; min-width: 0; }
    .scope-banner .scope__change { font-size: var(--text-body3-size); }
    .scope__reset {
      flex: 0 0 auto;
      border: none; background: transparent; padding: 0; margin: 0 0 0 var(--space-2);
      font-family: var(--font-family); font-size: var(--text-body3-size);
      color: var(--color-text-secondary); cursor: pointer;
    }
    .scope__reset:hover { color: var(--color-text-primary); text-decoration: underline; }
  `],
})
export class AiScopeBarComponent {
  @Input() kind: AiScopeKind = 'room';
  @Input({ required: true }) label = '';
  @Input() docCount?: number | null;
  @Input() editable = true;
  @Input() changeLabel = 'Change';
  /** caption — quiet line above the composer · banner — tinted strip when the chat is limited to a selection. */
  @Input() variant: 'caption' | 'banner' = 'caption';
  @Input() resetLabel = 'Reset to all files';

  @Output() changeRequested = new EventEmitter<void>();
  @Output() resetRequested = new EventEmitter<void>();

  get icon() { return AI_SCOPE_ICON[this.kind]; }
}
