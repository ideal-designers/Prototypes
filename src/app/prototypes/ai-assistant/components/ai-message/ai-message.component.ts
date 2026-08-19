import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, ToastService } from '../../../../shared/ds';
import { ChatMessage } from '../../models/ai-message.model';
import {
  DdReportAnswer,
  ProjectAnswer,
  ProseAnswer,
  SingleDocAnswer,
  SummaryAnswer,
  TableAnswer,
} from '../../models/ai-scenario.model';
import { MockDocument } from '../../models/mock-doc.model';
import { AiStepsComponent } from '../ai-steps/ai-steps.component';
import { AiAnswerProseComponent } from '../ai-answer-prose/ai-answer-prose.component';
import { AiAnswerDocComponent } from '../ai-answer-doc/ai-answer-doc.component';
import { AiAnswerTableComponent } from '../ai-answer-table/ai-answer-table.component';
import { AiAnswerDocListComponent } from '../ai-answer-doc-list/ai-answer-doc-list.component';
import { AiAnswerSummaryComponent } from '../ai-answer-summary/ai-answer-summary.component';
import { AiAnswerDdReportComponent } from '../ai-answer-dd-report/ai-answer-dd-report.component';
import { AiAnswerProjectComponent } from '../ai-answer-project/ai-answer-project.component';

/** One conversation turn — user bubble or assistant steps + answer + actions. */
@Component({
  selector: 'fvdr-ai-message',
  standalone: true,
  imports: [
    CommonModule,
    ...DS_COMPONENTS,
    AiStepsComponent,
    AiAnswerProseComponent,
    AiAnswerDocComponent,
    AiAnswerTableComponent,
    AiAnswerDocListComponent,
    AiAnswerSummaryComponent,
    AiAnswerDdReportComponent,
    AiAnswerProjectComponent,
  ],
  template: `
    <!-- ── User turn ── -->
    <div class="turn turn--user" *ngIf="message.role === 'user'">
      <div class="bubble">{{ message.text }}</div>
    </div>

    <!-- ── Assistant turn ── -->
    <div class="turn turn--assistant" *ngIf="message.role === 'assistant'">
      <fvdr-ai-steps
        [steps]="message.steps || []"
        [streaming]="!!message.streaming"
        [expanded]="!!message.stepsExpanded"
        [cancelled]="!!message.cancelled"
        [thoughtMs]="message.thoughtMs || 0"
        (toggled)="stepsToggled.emit()"
        (stopped)="stopRequested.emit()"
      ></fvdr-ai-steps>

      <p class="cancelled" *ngIf="message.cancelled">Response stopped.</p>

      <div class="answer" *ngIf="message.answer">
        <fvdr-ai-answer-prose *ngIf="prose as p" [answer]="p"></fvdr-ai-answer-prose>

        <fvdr-ai-answer-doc
          *ngIf="singleDoc as d"
          [answer]="d"
          (docOpened)="docOpened.emit($event)"
          (folderOpened)="folderOpened.emit($event)"
        ></fvdr-ai-answer-doc>

        <!-- Narrow shells render the numbered list; full screen keeps the table. -->
        <fvdr-ai-answer-doc-list
          *ngIf="tableCompact as t"
          [answer]="t"
          (docOpened)="docOpened.emit($event)"
          (folderOpened)="folderOpened.emit($event)"
        ></fvdr-ai-answer-doc-list>

        <fvdr-ai-answer-table
          *ngIf="tableFull as t"
          [answer]="t"
          (docOpened)="docOpened.emit($event)"
          (folderOpened)="folderOpened.emit($event)"
        ></fvdr-ai-answer-table>

        <fvdr-ai-answer-summary
          *ngIf="summary as s"
          [answer]="s"
          (docOpened)="docOpened.emit($event)"
          (folderOpened)="folderOpened.emit($event)"
          (exported)="onExport()"
        ></fvdr-ai-answer-summary>

        <fvdr-ai-answer-dd-report
          *ngIf="ddReport as r"
          [answer]="r"
          (docOpened)="docOpened.emit($event)"
          (folderOpened)="folderOpened.emit($event)"
          (exported)="onExport()"
        ></fvdr-ai-answer-dd-report>

        <fvdr-ai-answer-project
          *ngIf="project as p"
          [answer]="p"
          (projectOpened)="folderOpened.emit($event)"
          (nextStepChosen)="onNextStep($event)"
        ></fvdr-ai-answer-project>

        <p class="perm-note" *ngIf="message.answer?.permissionNote">
          <fvdr-icon name="lock-close"></fvdr-icon>
          <span>{{ message.answer?.permissionNote }}</span>
        </p>
      </div>

      <div class="actions" *ngIf="message.done && message.answer">
        <button type="button" class="actions__btn" title="Regenerate" (click)="onRegenerate()">
          <fvdr-icon name="refresh"></fvdr-icon>
        </button>
        <button type="button" class="actions__btn" title="Copy" (click)="onCopy()">
          <fvdr-icon name="copy"></fvdr-icon>
        </button>
        <button type="button" class="actions__btn" title="Good answer" (click)="onFeedback()">
          <fvdr-icon name="thumbs-up"></fvdr-icon>
        </button>
        <button type="button" class="actions__btn" title="Bad answer" (click)="onFeedback()">
          <fvdr-icon name="thumbs-down"></fvdr-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .turn { display: flex; flex-direction: column; gap: var(--space-3); }
    .turn--user { align-items: flex-end; }

    .bubble {
      max-width: 70%;
      background: var(--color-stone-200);
      color: var(--color-text-primary);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-normal, 22px);
      white-space: pre-wrap;
    }

    .cancelled {
      margin: 0;
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }

    .answer { display: flex; flex-direction: column; gap: var(--space-3); }

    .perm-note {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }

    .actions { display: flex; align-items: center; gap: var(--space-1); }
    .actions__btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-stone-600);
      font-size: var(--font-size-base, 14px);
      transition: background 0.12s ease, color 0.12s ease;
    }
    .actions__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
  `],
})
export class AiMessageComponent {
  private toast = inject(ToastService);

  @Input({ required: true }) message!: ChatMessage;
  /** Narrow shells (docked / floating) render the compact answer variants. */
  @Input() compact = false;

  @Output() stepsToggled = new EventEmitter<void>();
  @Output() stopRequested = new EventEmitter<void>();
  @Output() docOpened = new EventEmitter<MockDocument>();
  @Output() folderOpened = new EventEmitter<string>();
  @Output() regenerated = new EventEmitter<void>();

  get prose(): ProseAnswer | null {
    const a = this.message.answer;
    return a?.kind === 'prose' ? a : null;
  }

  get singleDoc(): SingleDocAnswer | null {
    const a = this.message.answer;
    return a?.kind === 'singleDoc' ? a : null;
  }

  /** Multi-document result in a narrow shell → numbered list. */
  get tableCompact(): TableAnswer | null {
    const a = this.message.answer;
    return this.compact && a?.kind === 'table' ? a : null;
  }

  /** Same payload in the full-screen shell → full result table. */
  get tableFull(): TableAnswer | null {
    const a = this.message.answer;
    return !this.compact && a?.kind === 'table' ? a : null;
  }

  get summary(): SummaryAnswer | null {
    const a = this.message.answer;
    return a?.kind === 'summary' ? a : null;
  }

  get ddReport(): DdReportAnswer | null {
    const a = this.message.answer;
    return a?.kind === 'ddReport' ? a : null;
  }

  get project(): ProjectAnswer | null {
    const a = this.message.answer;
    return a?.kind === 'project' ? a : null;
  }

  onExport(): void {
    this.toast.show({ variant: 'info', message: 'Export is out of scope for this prototype' });
  }

  onNextStep(step: string): void {
    this.toast.show({ variant: 'info', message: `Would start: ${step}` });
  }

  onCopy(): void {
    const text = this.message.text;
    navigator.clipboard?.writeText(text).then(
      () => this.toast.show({ variant: 'success', message: 'Answer copied to clipboard' }),
      () => this.toast.show({ variant: 'error', message: 'Could not copy the answer' }),
    );
  }

  onRegenerate(): void {
    this.regenerated.emit();
    this.toast.show({ variant: 'info', message: 'Regenerating — coming in the next phase' });
  }

  onFeedback(): void {
    this.toast.show({ variant: 'success', message: 'Feedback recorded' });
  }
}
