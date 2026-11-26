import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, ButtonType } from '../button/button.component';
import { FvdrIconName } from '../../icons/icons';

/**
 * Empty-state illustrations exported from the DS library
 * (Figma "↳ Icons/Illustrations/Flags library" → Illustrations, 176×120) to
 * src/assets/illustrations/empty/{name}.svg. Add a new one the same way.
 */
export type EmptyStateIllustration =
  | 'not-found' | 'no-documents' | 'upload' | 'search-file' | 'no-text-found' | 'files-uploaded'
  | 'no-users' | 'no-projects' | 'no-questions' | 'no-notes' | 'no-notifications' | 'report'
  | 'trash-empty' | 'access-denied' | 'no-connection' | 'no-recovery-codes'
  | 'export-xls' | 'rename' | 'drop-xls';

export const EMPTY_STATE_ILLUSTRATIONS: EmptyStateIllustration[] = [
  'not-found', 'no-documents', 'upload', 'search-file', 'no-text-found', 'files-uploaded',
  'no-users', 'no-projects', 'no-questions', 'no-notes', 'no-notifications', 'report',
  'trash-empty', 'access-denied', 'no-connection', 'no-recovery-codes',
  'export-xls', 'rename', 'drop-xls',
];

/** Big — a page or a large panel. Small — a modal, a drawer, a card. */
export type EmptyStateSize = 'big' | 'small';

/** One step of the Onboarding type: illustration, numbered text, one action. */
export interface EmptyStateStep {
  illustration: EmptyStateIllustration;
  /** Short step name next to the number, e.g. "Export". */
  title: string;
  text: string;
  actionLabel: string;
  actionIcon?: FvdrIconName;
  actionVariant?: ButtonType;
}

/**
 * DS Empty state — Figma: liyNDiFf1piO8SQmHNKoeU, "↳ Empty states" page 25440:9372, component set 25440:12257
 *
 * Types (from the Figma variants):
 *   Default    — illustration + title + description
 *   Buttons    — the same + actions: project fvdr-btn elements into the [empty-actions] slot
 *   Onboarding — title + description + numbered steps ([steps]), each with its own illustration and action
 * Title=No (Small only): leave [title] empty — just the illustration and one line of text.
 *
 * Usage:
 *   <fvdr-empty-state illustration="no-documents" title="You have no documents yet"
 *                     description="Drag and drop files here or start by creating folder structure">
 *     <fvdr-btn empty-actions label="Import folder structure" variant="secondary" iconName="folder" />
 *     <fvdr-btn empty-actions label="Upload" variant="primary" iconName="upload" />
 *   </fvdr-empty-state>
 */
@Component({
  selector: 'fvdr-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <!-- Onboarding -->
    <ng-container *ngIf="steps.length; else single">
      <div class="es-text">
        <h3 class="es-title" *ngIf="title">{{ title }}</h3>
        <p class="es-desc" *ngIf="description">{{ description }}</p>
      </div>
      <ol class="es-steps">
        <ng-container *ngFor="let s of steps; let i = index; let last = last">
          <li class="es-step">
            <img class="es-art" [src]="src(s.illustration)" width="176" height="120" alt="" />
            <div class="es-step__body">
              <div class="es-step__text">
                <span class="es-step__head"><span class="es-step__num">{{ i + 1 }}</span>{{ s.title }}</span>
                <span>{{ s.text }}</span>
              </div>
              <fvdr-btn [label]="s.actionLabel" [iconName]="s.actionIcon" size="m"
                        [variant]="s.actionVariant || (last ? 'primary' : 'secondary')"
                        (clicked)="stepAction.emit(i)"></fvdr-btn>
            </div>
          </li>
          <li class="es-arrow" *ngIf="!last" aria-hidden="true">
            <img [src]="assetBase + 'step-arrow.svg'" width="106" height="20" alt="" />
          </li>
        </ng-container>
      </ol>
    </ng-container>

    <!-- Default / Buttons -->
    <ng-template #single>
      <img class="es-art" *ngIf="illustration || illustrationSrc"
           [src]="illustrationSrc || src(illustration!)" width="176" height="120" alt="" />
      <div class="es-group">
        <div class="es-text">
          <h3 class="es-title" *ngIf="title">{{ title }}</h3>
          <p class="es-desc" *ngIf="description">{{ description }}</p>
        </div>
        <div class="es-actions"><ng-content select="[empty-actions]"></ng-content></div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-8);
      max-width: 440px;
      margin: 0 auto;
      text-align: center;
      font-family: var(--font-family);
    }
    /* Title=No — 24 between the art and the line */
    :host(.es--no-title) { gap: var(--space-6); }
    :host(.es--onboarding) { max-width: none; gap: var(--space-10); }

    .es-art { display: block; flex: none; width: 176px; height: 120px; }

    .es-group { display: flex; flex-direction: column; align-items: center; gap: var(--space-6); width: 100%; }
    .es-text { display: flex; flex-direction: column; gap: var(--space-2); width: 100%; }

    .es-title {
      margin: 0;
      color: var(--color-text-primary);
      font-size: var(--text-sub2-size);
      line-height: var(--text-sub2-lh);
      font-weight: var(--text-sub2-weight);
    }
    .es-desc {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--text-body2-size);
      line-height: var(--text-body2-lh);
      font-weight: var(--text-body2-weight);
    }
    :host(.es--small) .es-title {
      font-size: var(--text-label-l-size);
      line-height: var(--text-label-l-lh);
      font-weight: var(--text-label-l-weight);
    }
    :host(.es--small) .es-desc {
      font-size: var(--text-body3-size);
      line-height: var(--text-body3-lh);
    }

    .es-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-4); }
    .es-actions:empty { display: none; }

    /* Onboarding steps — 176 wide columns, 24 between, a dashed arrow between steps */
    .es-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: var(--space-6);
    }
    .es-step { width: 176px; display: flex; flex-direction: column; align-items: center; gap: var(--space-6); }
    .es-step__body { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); }
    .es-step__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text-secondary);
      font-size: var(--text-body3-size);
      line-height: var(--text-body3-lh);
    }
    .es-step__head {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text-primary);
      font-size: var(--text-label-s-size);
      line-height: var(--text-label-s-lh);
      font-weight: var(--text-label-s-weight);
    }
    /* Figma "Bullet number": 20×20, stone-300 circle, Label S secondary */
    .es-step__num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--space-5);
      height: var(--space-5);
      border-radius: var(--radius-full);
      background: var(--color-stone-300);
      color: var(--color-text-secondary);
      font-size: var(--text-label-s-size);
      line-height: var(--text-label-s-lh);
      font-weight: var(--text-label-s-weight);
    }
    .es-arrow { display: flex; align-items: center; height: 120px; }
    .es-arrow img { display: block; width: 106px; height: 20px; }

    @media (max-width: 767px) {
      .es-steps { flex-direction: column; align-items: center; }
      .es-arrow { display: none; }
    }
  `],
  host: {
    '[class.es--small]': "size === 'small'",
    '[class.es--no-title]': '!title && !steps.length',
    '[class.es--onboarding]': 'steps.length > 0',
  },
})
export class EmptyStateComponent {
  @Input() illustration?: EmptyStateIllustration;
  /** A custom illustration URL — use only when the library has nothing that fits. */
  @Input() illustrationSrc = '';
  @Input() title = '';
  @Input() description = '';
  @Input() size: EmptyStateSize = 'big';
  /** Onboarding type: 2–3 numbered steps. When set, the single illustration is not shown. */
  @Input() steps: EmptyStateStep[] = [];

  /** Onboarding: index of the step whose action was clicked. */
  @Output() stepAction = new EventEmitter<number>();

  readonly assetBase = 'assets/illustrations/empty/';
  src(name: EmptyStateIllustration): string { return this.assetBase + name + '.svg'; }
}
