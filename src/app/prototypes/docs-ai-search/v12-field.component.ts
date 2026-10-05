import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../shared/ds/icons/icon.component';

/**
 * V1.2 small AI input — one 40px line with a green → indigo hairline (Figma 720:131529):
 * + · text · mic · send. Lives inside the AI Overview card, under the answer.
 */
@Component({
  selector: 'fvdr-vdr-v12-field',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent],
  template: `
    <div class="fld" [class.fld--focus]="focused">
      <button type="button" class="ib" title="Add files" aria-label="Add files"><fvdr-icon name="plus"></fvdr-icon></button>
      <input #input class="fld__input" type="text" [placeholder]="placeholder" [attr.aria-label]="ariaLabel"
             [ngModel]="value" (ngModelChange)="value = $event; valueChange.emit($event)"
             (focus)="focused = true" (blur)="focused = false" (keydown.enter)="send()" />
      <button type="button" class="ib" title="Voice input" aria-label="Voice input"><fvdr-icon name="voice" class="ib__voice"></fvdr-icon></button>
      <button type="button" class="ib ib--send" [class.ib--ready]="value.trim()" [attr.aria-disabled]="!value.trim()"
              [title]="sendHint" [attr.aria-label]="sendHint" (click)="send()"><fvdr-icon name="enter"></fvdr-icon></button>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }
    .fld { display: flex; align-items: center; gap: var(--space-2); height: 48px; padding: 0 var(--space-2);
      box-sizing: border-box; border: 1px solid transparent; border-radius: var(--radius-sm);
      background: linear-gradient(var(--color-stone-0), var(--color-stone-0)) padding-box, var(--ai-edge) border-box;
      box-shadow: var(--shadow-card); transition: box-shadow 0.15s ease; }
    .fld--focus { background: linear-gradient(var(--color-stone-0), var(--color-stone-0)) padding-box,
      linear-gradient(90deg, var(--color-primary-500), var(--color-primary-500)) border-box; }
    .fld__input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: transparent; padding: 0 var(--space-1);
      font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .fld__input::placeholder { color: var(--color-text-placeholder); }
    .ib { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0;
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary);
      font-size: var(--font-size-base, 14px); }
    .ib:hover:not(:disabled) { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .ib__voice { font-size: var(--font-size-xl, 20px); }
    .ib--send:not(.ib--ready) { color: var(--color-text-disabled); cursor: default; }
    .ib--send:not(.ib--ready):hover { background: transparent; color: var(--color-text-disabled); }
    .ib--ready { background: var(--color-primary-500); color: var(--color-stone-0); }
    .ib--ready:hover:not(:disabled) { background: var(--color-primary-600); color: var(--color-stone-0); }
  `],
})
export class VdrV12FieldComponent {
  @Input() value = '';
  @Input() placeholder = 'Ask about this documents or describe a task';
  @Input() ariaLabel = 'Ask the AI Assistant';
  /** Tooltip on the enter button — tells where the question goes. */
  @Input() sendHint = 'Send';
  @Output() valueChange = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<string>();
  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;
  focused = false;

  focus(): void { this.input?.nativeElement.focus(); }

  send(): void {
    const v = this.value.trim();
    if (!v) return;
    this.submitted.emit(v);
  }
}
