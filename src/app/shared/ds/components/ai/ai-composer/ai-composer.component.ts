import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../../icons/icon.component';

/**
 * Composer — auto-growing prompt input with add-context / mic / send affordances.
 * Fluid: fills whatever container it is dropped into (full-screen, sidebar, floating).
 */
@Component({
  selector: 'fvdr-ai-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent],
  template: `
    <div class="composer" [class.composer--busy]="busy" [class.composer--disabled]="disabled">
      <textarea
        #input
        class="composer__input"
        rows="1"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (keydown)="onKeydown($event)"
      ></textarea>

      <div class="composer__bar">
        <button
          *ngIf="showAddContext"
          type="button"
          class="composer__btn"
          title="Add context"
          [disabled]="disabled"
          (click)="contextRequested.emit()"
        >
          <fvdr-icon name="plus"></fvdr-icon>
        </button>

        <span class="composer__spacer"></span>

        <button
          *ngIf="showVoice"
          type="button"
          class="composer__btn"
          title="Voice input"
          [disabled]="disabled"
          (click)="voiceRequested.emit()"
        >
          <fvdr-icon name="mic"></fvdr-icon>
        </button>

        <button
          type="button"
          class="composer__btn composer__btn--send"
          title="Send"
          [disabled]="!canSend"
          (click)="submit()"
        >
          <fvdr-icon name="send"></fvdr-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .composer {
      display: flex; flex-direction: column; gap: var(--space-2);
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      transition: border-color 0.15s ease;
    }
    .composer:focus-within { border-color: var(--color-primary-500); }
    .composer--disabled { background: var(--color-stone-200); }

    .composer__input {
      width: 100%; border: none; outline: none; resize: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
      max-height: 160px; overflow-y: auto;
    }
    .composer__input::placeholder { color: var(--color-text-placeholder); }
    .composer__input:disabled { cursor: not-allowed; }

    .composer__bar { display: flex; align-items: center; gap: var(--space-1); }
    .composer__spacer { flex: 1; }

    .composer__btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg, 16px);
      transition: background 0.12s ease, color 0.12s ease;
    }
    .composer__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .composer__btn:disabled { cursor: not-allowed; color: var(--color-text-disabled); }
    .composer__btn:disabled:hover { background: transparent; color: var(--color-text-disabled); }

    .composer__btn--send {
      background: var(--color-primary-500); color: var(--color-stone-0);
      border-radius: var(--radius-md);
    }
    .composer__btn--send:hover { background: var(--color-primary-600); color: var(--color-stone-0); }
    /* Empty / streaming — the send stays green, just muted (per design). */
    .composer__btn--send:disabled {
      background: var(--color-primary-200); color: var(--color-stone-0);
      cursor: not-allowed;
    }
    .composer__btn--send:disabled:hover { background: var(--color-primary-200); color: var(--color-stone-0); }
  `],
})
export class AiComposerComponent {
  @Input() placeholder = 'Ask AI assistant anything ...';
  /** True while a response is streaming — send is disabled. */
  @Input() busy = false;
  /** AI unavailable (no permission, quota spent) — the whole composer is inert. */
  @Input() disabled = false;
  @Input() showAddContext = true;
  @Input() showVoice = true;

  /** Two-way bindable, so suggestion chips can pre-fill the prompt. */
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  @Output() submitted = new EventEmitter<string>();
  /** Host decides what "add context" opens — folder picker, doc picker, … */
  @Output() contextRequested = new EventEmitter<void>();
  @Output() voiceRequested = new EventEmitter<void>();

  @ViewChild('input') inputRef?: ElementRef<HTMLTextAreaElement>;

  get canSend(): boolean {
    return !this.busy && !this.disabled && this.value.trim().length > 0;
  }

  onValueChange(value: string): void {
    this.valueChange.emit(value);
    this.autoGrow();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    if (!this.canSend) return;
    this.submitted.emit(this.value.trim());
    this.value = '';
    this.valueChange.emit('');
    queueMicrotask(() => this.autoGrow());
  }

  /** Put the caret in the prompt — after opening the panel or picking a suggestion. */
  focus(): void {
    this.inputRef?.nativeElement.focus();
  }

  autoGrow(): void {
    const el = this.inputRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
