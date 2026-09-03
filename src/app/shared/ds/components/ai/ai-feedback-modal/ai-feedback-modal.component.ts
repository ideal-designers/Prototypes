import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal.component';
import { RadioComponent, RadioOption } from '../../radio/radio.component';
import { TextareaComponent } from '../../textarea/textarea.component';
import { CheckboxComponent } from '../../checkbox/checkbox.component';
import { InlineMessageComponent } from '../../inline-message/inline-message.component';

export interface AiFeedback {
  reason: string;
  comment: string;
  includeTranscript: boolean;
  /** True when the reason reports the assistant exposing restricted content. */
  securityReport: boolean;
}

/** Reasons whose wording marks a leak rather than a quality problem. */
const SECURITY_REASON = /should not see|not have access|leak/i;

const DEFAULT_REASONS = [
  'Incorrect',
  'Incomplete',
  'Missed a document',
  'Showed something I should not see',
];

const toOptions = (reasons: string[]): RadioOption[] =>
  reasons.map(reason => ({ label: reason, value: reason }));

/**
 * What opens after a thumbs-down: pick a reason, add a comment, decide whether
 * to attach the transcript.
 *
 * The permission-leak reason is not quality feedback — it is a security report,
 * and the modal says so before the user sends it, so it gets routed and
 * triaged differently.
 */
@Component({
  selector: 'fvdr-ai-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RadioComponent, TextareaComponent, CheckboxComponent, InlineMessageComponent],
  template: `
    <fvdr-modal
      [visible]="visible"
      title="Tell us what went wrong"
      size="m"
      confirmLabel="Send feedback"
      cancelLabel="Cancel"
      [confirmDisabled]="!reason"
      (confirmed)="submit()"
      (cancelled)="cancel()"
      (closed)="cancel()"
    >
      <div class="fb">
        <fvdr-radio
          [options]="options"
          [value]="reason"
          layout="vertical"
          (valueChange)="reason = $event"
        ></fvdr-radio>

        <fvdr-inline-message
          *ngIf="isSecurityReport"
          variant="warning"
          message="This is reported as a security issue, not answer quality — it goes to the team that reviews access, and the conversation is attached."
        ></fvdr-inline-message>

        <fvdr-textarea
          [(ngModel)]="comment"
          label="Anything else? (optional)"
          placeholder="What did you expect the assistant to answer?"
          [maxlength]="500"
        ></fvdr-textarea>

        <fvdr-checkbox
          *ngIf="allowTranscript && !isSecurityReport"
          [(ngModel)]="includeTranscript"
          label="Include this conversation"
        ></fvdr-checkbox>
      </div>
    </fvdr-modal>
  `,
  styles: [`
    .fb { display: flex; flex-direction: column; gap: var(--space-4); }
  `],
})
export class AiFeedbackModalComponent {
  @Input() visible = false;
  @Input() allowTranscript = true;

  /**
   * Built once per `reasons` change, never in a getter: a getter hands *ngFor a
   * fresh array of fresh objects on every change-detection pass, so the rows are
   * torn down between mousedown and mouseup and the click is never synthesized.
   */
  options: RadioOption[] = toOptions(DEFAULT_REASONS);

  private _reasons: string[] = DEFAULT_REASONS;

  @Input()
  set reasons(value: string[]) {
    this._reasons = value?.length ? value : DEFAULT_REASONS;
    this.options = toOptions(this._reasons);
  }
  get reasons(): string[] {
    return this._reasons;
  }

  @Output() submitted = new EventEmitter<AiFeedback>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';
  comment = '';
  includeTranscript = true;

  get isSecurityReport(): boolean {
    return SECURITY_REASON.test(this.reason);
  }

  submit(): void {
    if (!this.reason) return;
    this.submitted.emit({
      reason: this.reason,
      comment: this.comment.trim(),
      // A leak report is useless without the conversation that produced it.
      includeTranscript: this.isSecurityReport ? true : this.includeTranscript,
      securityReport: this.isSecurityReport,
    });
    this.reset();
  }

  cancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  private reset(): void {
    this.reason = '';
    this.comment = '';
    this.includeTranscript = true;
  }
}
