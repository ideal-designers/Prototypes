import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { AiActionsComponent, AiRating } from '../ai-actions/ai-actions.component';
import { AiSuggestionsComponent } from '../ai-suggestions/ai-suggestions.component';
import { AiComposerComponent } from '../ai-composer/ai-composer.component';
import { ThinkingOrbsComponent } from '../thinking-orbs/thinking-orbs.component';

/** `collapse` — the card folds to its header (V1, sits above a result table).
 *  `dismiss` — open-in-assistant + close in the header (V2, the card is the result). */
export type AiOverviewHeaderMode = 'collapse' | 'dismiss';

/**
 * AI Overview — an AI answer embedded at the top of a product page, above (or instead of)
 * the regular results. Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › ↳ Documnets page,
 * V1 234:13029 (collapse header) and V2 426:18769 (dismiss header).
 *
 * Anatomy: gradient header (sparkle + title + header actions) · answer body (ng-content)
 * · action row (copy / rate / more + "Continue in AI Assistant") · "What next?" follow-ups
 * · optional inline composer for a follow-up without leaving the page.
 *
 * The body is projected, so the host renders whatever the answer is — a cited summary,
 * a clarifying question, a table. While `loading`, the body is replaced by a thinking row.
 */
@Component({
  selector: 'fvdr-ai-overview',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, AiActionsComponent, AiSuggestionsComponent, AiComposerComponent, ThinkingOrbsComponent],
  template: `
    <section class="ov" [class.ov--collapsed]="collapsed" [attr.aria-label]="title">
      <header class="ov__head" (click)="headerMode === 'collapse' && toggle()"
              [class.ov__head--clickable]="headerMode === 'collapse'">
        <fvdr-icon name="sparkle" class="ov__spark"></fvdr-icon>
        <h2 class="ov__title">{{ title }}</h2>

        <ng-container *ngIf="headerMode === 'collapse'; else dismissBtns">
          <button type="button" class="ov__icon-btn" [attr.aria-expanded]="!collapsed"
                  [attr.aria-label]="collapsed ? 'Expand AI Overview' : 'Collapse AI Overview'"
                  [title]="collapsed ? 'Expand' : 'Collapse'"
                  (click)="$event.stopPropagation(); toggle()">
            <fvdr-icon [name]="collapsed ? 'expand' : 'collapse'"></fvdr-icon>
          </button>
        </ng-container>
        <ng-template #dismissBtns>
          <button type="button" class="ov__icon-btn" title="Open in AI Assistant"
                  aria-label="Open in AI Assistant" (click)="openInAssistant.emit()">
            <fvdr-icon name="link"></fvdr-icon>
          </button>
          <button type="button" class="ov__icon-btn" title="Close AI Overview"
                  aria-label="Close AI Overview" (click)="dismissed.emit()">
            <fvdr-icon name="close"></fvdr-icon>
          </button>
        </ng-template>
      </header>

      <div class="ov__body" *ngIf="!collapsed">
        <div *ngIf="loading; else content" class="ov__loading" role="status">
          <fvdr-thinking-orbs [label]="loadingLabel" [showLabel]="true" [size]="32"></fvdr-thinking-orbs>
        </div>

        <ng-template #content>
          <div class="ov__answer"><ng-content></ng-content></div>

          <div class="ov__foot" *ngIf="showActions || continueLabel">
            <fvdr-ai-actions *ngIf="showActions"
              [showRegenerate]="false" [rating]="rating"
              (rated)="rated.emit($event)" (copyRequested)="copyRequested.emit()">
              <button type="button" class="ov__more" title="More" aria-label="More actions"
                      (click)="moreRequested.emit()">
                <fvdr-icon name="more"></fvdr-icon>
              </button>
            </fvdr-ai-actions>
            <span class="ov__spacer"></span>
            <button *ngIf="continueLabel" type="button" class="ov__continue" (click)="openInAssistant.emit()">
              {{ continueLabel }}
              <fvdr-icon name="link"></fvdr-icon>
            </button>
          </div>

          <div class="ov__next" *ngIf="followUps.length">
            <span class="ov__next-label">{{ followUpsLabel }}</span>
            <fvdr-ai-suggestions [items]="followUps" [max]="3" (chosen)="followUpChosen.emit($event)"></fvdr-ai-suggestions>
          </div>

          <fvdr-ai-composer *ngIf="showComposer" class="ov__composer" layout="inline"
            [placeholder]="composerPlaceholder" [showAddContext]="false"
            [value]="composerValue" (valueChange)="composerValueChange.emit($event)"
            (submitted)="promptSubmitted.emit($event)"></fvdr-ai-composer>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .ov {
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-300);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }
    .ov--collapsed { border-color: transparent; }

    /* Header — green → indigo wash (Figma: #F0F0FF base + brand gradient image) */
    .ov__head {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 48px; padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
      background: linear-gradient(90deg, var(--chip-bg-green) 0%, var(--chip-bg-indigo) 100%);
      box-sizing: border-box;
    }
    .ov__head--clickable { cursor: pointer; }
    .ov__spark { flex: 0 0 auto; font-size: var(--font-size-lg, 16px); color: var(--color-primary-500); }
    .ov__title {
      flex: 1; margin: 0;
      font-size: var(--font-size-base, 14px); line-height: 20px;
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }
    .ov__icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0; border: none; background: transparent;
      border-radius: var(--radius-full); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-base, 14px);
    }
    .ov__icon-btn:hover { background: var(--color-stone-0); color: var(--color-text-primary); }

    .ov__body { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); }
    .ov__loading { display: flex; align-items: center; min-height: 56px; }

    .ov__answer {
      font-size: var(--font-size-base, 14px); line-height: 20px;
      color: var(--color-text-primary);
    }

    .ov__foot { display: flex; align-items: center; gap: var(--space-2); }
    .ov__spacer { flex: 1; }
    .ov__more {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0; border: none; background: transparent;
      border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-base, 14px);
    }
    .ov__more:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .ov__continue {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0; border: none; background: transparent; cursor: pointer;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px); line-height: 20px;
      color: var(--color-primary-500);
    }
    .ov__continue:hover { color: var(--color-primary-600); text-decoration: underline; }

    .ov__next { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
    .ov__next-label {
      font-size: var(--font-size-base, 14px); line-height: 20px;
      font-weight: var(--font-weight-semi, 600); color: var(--color-text-primary);
    }
  `],
})
export class AiOverviewComponent {
  @Input() title = 'AI Overview';
  @Input() headerMode: AiOverviewHeaderMode = 'collapse';
  /** Folded to the header — only in `collapse` mode. Two-way bindable. */
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  @Input() loading = false;
  @Input() loadingLabel = 'Reading the documents…';

  @Input() showActions = true;
  @Input() rating: AiRating = null;
  /** Link that hands the thread to the full assistant. Empty hides it. */
  @Input() continueLabel = 'Continue in AI Assistant';

  @Input() followUps: string[] = [];
  @Input() followUpsLabel = 'What next?';

  /** Inline follow-up field — ask again without leaving the page. */
  @Input() showComposer = false;
  @Input() composerPlaceholder = 'Write a message...';
  @Input() composerValue = '';
  @Output() composerValueChange = new EventEmitter<string>();

  @Output() openInAssistant = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();
  @Output() followUpChosen = new EventEmitter<string>();
  @Output() promptSubmitted = new EventEmitter<string>();
  @Output() rated = new EventEmitter<AiRating>();
  @Output() copyRequested = new EventEmitter<void>();
  @Output() moreRequested = new EventEmitter<void>();

  toggle(): void {
    if (this.headerMode !== 'collapse') return;
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
