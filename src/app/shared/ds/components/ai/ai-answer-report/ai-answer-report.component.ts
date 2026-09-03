import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../badge/badge.component';
import { ButtonComponent } from '../../button/button.component';
import { AiCitationComponent } from '../ai-citation/ai-citation.component';
import { AiDocRef, AiReportSection, AiSeverity } from '../ai.models';

const SEVERITY_LABEL: Record<AiSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * A long generated artifact — a due-diligence draft, a red-flag list, a
 * disclosure schedule — presented as a titled document with sections, findings
 * and severities, plus export and save-to-room actions.
 *
 * The VDR equivalent of an artifact: the answer is a deliverable, so it gets a
 * surface of its own and always carries the Draft flag until a human signs off.
 */
@Component({
  selector: 'fvdr-ai-answer-report',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent, AiCitationComponent],
  template: `
    <article class="rep">
      <header class="rep__head">
        <div class="rep__titles">
          <h3 class="rep__title">
            {{ title }}
            <!-- neutral is the only badge variant that clears AA in both themes -->
            <fvdr-badge *ngIf="draft" label="Draft" variant="neutral"></fvdr-badge>
          </h3>
          <p class="rep__sub" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="rep__actions">
          <fvdr-btn variant="ghost" size="s" label="Export" (clicked)="exported.emit()"></fvdr-btn>
          <fvdr-btn variant="secondary" size="s" label="Save to room" (clicked)="savedToRoom.emit()"></fvdr-btn>
        </div>
      </header>

      <div class="rep__legend" *ngIf="severityLegend">
        <span class="rep__legend-item"><i class="rep__dot rep__dot--high"></i>High</span>
        <span class="rep__legend-item"><i class="rep__dot rep__dot--medium"></i>Medium</span>
        <span class="rep__legend-item"><i class="rep__dot rep__dot--low"></i>Low</span>
      </div>

      <div class="rep__body">
        <section class="rep__section" *ngFor="let s of sections">
          <h4 class="rep__heading">{{ s.heading }}</h4>

          <ul class="rep__findings">
            <li class="rep__finding" *ngFor="let f of s.findings">
              <span class="rep__sev" *ngIf="f.severity" [ngClass]="'rep__sev--' + f.severity">{{ severityLabel(f.severity) }}</span>
              <span class="rep__text">{{ f.text }}</span>
              <span class="rep__sources" *ngIf="f.sources?.length">
                <fvdr-ai-citation
                  *ngFor="let src of f.sources"
                  variant="pill"
                  [label]="src.name"
                  [page]="src.page"
                  [fileType]="src.type"
                  (opened)="docOpened.emit(src)"
                ></fvdr-ai-citation>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .rep {
      display: flex; flex-direction: column;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg);
      background: var(--color-stone-0);
      overflow: hidden;
    }

    .rep__head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4);
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .rep__titles { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .rep__title {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0;
      font-size: var(--font-size-lg, 16px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }
    .rep__sub { margin: 0; font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }
    .rep__actions { display: flex; align-items: center; gap: var(--space-2); flex: 0 0 auto; }

    .rep__legend {
      display: flex; gap: var(--space-4);
      padding: var(--space-2) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-100);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .rep__legend-item { display: inline-flex; align-items: center; gap: var(--space-1); }
    .rep__dot { width: 8px; height: 8px; border-radius: var(--radius-full); display: inline-block; }
    .rep__dot--high   { background: var(--color-error-600); }
    .rep__dot--medium { background: var(--color-warning-600); }
    .rep__dot--low    { background: var(--color-stone-500); }

    /* A 40-page draft cannot own the whole transcript. */
    .rep__body {
      display: flex; flex-direction: column; gap: var(--space-5);
      padding: var(--space-4);
      max-height: 520px;
      overflow-y: auto;
    }

    .rep__section { display: flex; flex-direction: column; gap: var(--space-2); }
    .rep__heading {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }

    .rep__findings { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .rep__finding {
      display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2);
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .rep__finding:last-child { border-bottom: none; }

    .rep__sev {
      flex: 0 0 auto;
      padding: 1px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-3xs, 10px);
      font-weight: var(--font-weight-semi, 600);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    /* --chip-bg-* are the only tint tokens defined for both themes; the
       --color-*-bg pair is light-only and left the label unreadable in dark. */
    /* The tint carries the severity; the label stays text-primary, because a red
       label on the dark tint only reaches 3.4:1 and the tag is 10px. */
    .rep__sev--high   { background: var(--chip-bg-danger); color: var(--color-text-primary); }
    .rep__sev--medium { background: var(--chip-bg-yellow); color: var(--color-text-primary); }
    .rep__sev--low    { background: var(--color-stone-200); color: var(--color-text-secondary); }

    .rep__text {
      flex: 1 1 260px; min-width: 0;
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }
    .rep__sources { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  `],
})
export class AiAnswerReportComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() sections: AiReportSection[] = [];
  @Input() severityLegend = false;
  @Input() draft = true;

  @Output() exported = new EventEmitter<void>();
  @Output() savedToRoom = new EventEmitter<void>();
  @Output() docOpened = new EventEmitter<AiDocRef>();

  severityLabel(severity: AiSeverity): string { return SEVERITY_LABEL[severity]; }
}
