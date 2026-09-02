import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { AiBubbleComponent } from '../ai-bubble/ai-bubble.component';
import { AiComposerComponent } from '../ai-composer/ai-composer.component';
import { AiStepsComponent } from '../ai-steps/ai-steps.component';
import { AiMarkdownComponent } from '../ai-markdown/ai-markdown.component';
import { AiActionsComponent } from '../ai-actions/ai-actions.component';
import { AiErrorComponent } from '../ai-error/ai-error.component';
import { AiEmptyStateComponent } from '../ai-empty-state/ai-empty-state.component';
import { AiSourceListComponent } from '../ai-source-list/ai-source-list.component';
import { AiPermissionNoteComponent } from '../ai-permission-note/ai-permission-note.component';
import { AiRating } from '../ai-actions/ai-actions.component';
import { AiChatMessage, AiDocRef } from '../ai.models';

/**
 * The transcript: empty state ↔ turn list, composer docked at the bottom.
 *
 * Owns scroll behaviour. It follows a streaming answer only while the reader is
 * already at the bottom — yanking the view while someone is reading an earlier
 * turn is the single most common chat-UI mistake. Otherwise it offers
 * "jump to latest" instead.
 *
 * Answer bodies default to markdown; pass `answerTemplate` to render a
 * product-specific block (a document table, a report) per turn.
 */
@Component({
  selector: 'fvdr-ai-conversation',
  standalone: true,
  imports: [
    CommonModule,
    FvdrIconComponent,
    AiBubbleComponent,
    AiComposerComponent,
    AiStepsComponent,
    AiMarkdownComponent,
    AiActionsComponent,
    AiErrorComponent,
    AiEmptyStateComponent,
    AiSourceListComponent,
    AiPermissionNoteComponent,
  ],
  template: `
    <div class="conv" [class.conv--compact]="compact">

      <!-- ── Empty ── -->
      <fvdr-ai-empty-state
        *ngIf="!messages.length; else transcript"
        [greeting]="greeting"
        [placeholder]="placeholder"
        [suggestions]="suggestions"
        [compact]="compact"
        [busy]="streaming"
        [disabled]="disabled"
        (promptSubmitted)="promptSubmitted.emit($event)"
        (contextRequested)="contextRequested.emit()"
        (voiceRequested)="voiceRequested.emit()"
      ></fvdr-ai-empty-state>

      <!-- ── Active transcript ── -->
      <ng-template #transcript>
        <div class="conv__scroll" #scroll (scroll)="onScroll()">
          <div class="conv__column">
            <ng-container *ngFor="let m of messages; trackBy: trackById">

              <fvdr-ai-bubble *ngIf="m.role === 'user'" role="user" [text]="m.text"></fvdr-ai-bubble>

              <fvdr-ai-bubble *ngIf="m.role === 'assistant'" role="assistant">
                <fvdr-ai-steps
                  *ngIf="m.steps?.length"
                  [steps]="m.steps || []"
                  [streaming]="!!m.streaming"
                  [expanded]="!!m.stepsExpanded"
                  [cancelled]="!!m.cancelled"
                  [thoughtMs]="m.thoughtMs || 0"
                  (toggled)="stepsToggled.emit(m)"
                  (stopped)="stopRequested.emit()"
                ></fvdr-ai-steps>

                <fvdr-ai-error
                  *ngIf="m.error"
                  [variant]="m.errorVariant || 'generic'"
                  [message]="m.error"
                  (retried)="regenerated.emit(m)"
                ></fvdr-ai-error>

                <!-- Product-specific answer body, else markdown -->
                <ng-container *ngIf="!m.error && answerTemplate; else defaultAnswer">
                  <ng-container *ngTemplateOutlet="answerTemplate; context: { $implicit: m }"></ng-container>
                </ng-container>
                <ng-template #defaultAnswer>
                  <fvdr-ai-markdown
                    *ngIf="!m.error && m.text"
                    [source]="m.text"
                    [streaming]="!!m.streaming"
                  ></fvdr-ai-markdown>
                </ng-template>

                <p class="conv__cancelled" *ngIf="m.cancelled && !m.text">Response stopped.</p>

                <fvdr-ai-source-list
                  *ngIf="m.sources?.length"
                  [sources]="m.sources || []"
                  [expanded]="expandedSources.has(m.id)"
                  (toggled)="toggleSources(m.id)"
                  (docOpened)="docOpened.emit($event)"
                ></fvdr-ai-source-list>

                <fvdr-ai-permission-note
                  *ngIf="m.permissionNote || m.hiddenCount"
                  [message]="m.permissionNote || ''"
                  [hiddenCount]="m.hiddenCount"
                ></fvdr-ai-permission-note>

                <fvdr-ai-actions
                  *ngIf="m.done && !m.error"
                  [rating]="m.rating || null"
                  (regenerated)="regenerated.emit(m)"
                  (copyRequested)="copyRequested.emit(m)"
                  (rated)="rated.emit({ message: m, rating: $event })"
                ></fvdr-ai-actions>
              </fvdr-ai-bubble>

            </ng-container>
          </div>
        </div>

        <!-- Shown only when the reader has scrolled away from the newest turn -->
        <button type="button" class="conv__jump" *ngIf="!atBottom" (click)="scrollToBottom(true)">
          <fvdr-icon name="chevron-down"></fvdr-icon>
          <span>Jump to latest</span>
        </button>

        <div class="conv__dock">
          <ng-content select="[conv-dock-top]"></ng-content>
          <fvdr-ai-composer
            #composer
            [placeholder]="placeholder"
            [busy]="streaming"
            [disabled]="disabled"
            (submitted)="promptSubmitted.emit($event)"
            (contextRequested)="contextRequested.emit()"
            (voiceRequested)="voiceRequested.emit()"
          ></fvdr-ai-composer>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); }

    .conv { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; }

    .conv__scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-6) var(--space-6) var(--space-4); }
    .conv__column { display: flex; flex-direction: column; gap: var(--space-6); max-width: 720px; margin: 0 auto; }

    .conv__cancelled {
      margin: 0;
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }

    .conv__dock {
      flex: 0 0 auto;
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-3) var(--space-6) var(--space-5);
      background: var(--color-stone-0);
    }
    .conv__dock > fvdr-ai-composer { max-width: 720px; width: 100%; margin: 0 auto; }

    .conv__jump {
      position: absolute; left: 50%; transform: translateX(-50%);
      bottom: 96px; z-index: 2;
      display: inline-flex; align-items: center; gap: var(--space-1);
      height: 28px; padding: 0 var(--space-3);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-full);
      background: var(--color-stone-0);
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
      cursor: pointer;
      box-shadow: var(--shadow-card);
    }
    .conv__jump:hover { color: var(--color-text-primary); border-color: var(--color-stone-500); }

    /* Sidebar / floating shells: tighter gutters, no reading-column cap. */
    .conv--compact .conv__scroll { padding: var(--space-4) var(--space-4) var(--space-3); }
    .conv--compact .conv__column { gap: var(--space-5); max-width: none; }
    .conv--compact .conv__dock { padding: var(--space-2) var(--space-4) var(--space-4); }
    .conv--compact .conv__jump { bottom: 84px; }
  `],
})
export class AiConversationComponent implements AfterViewChecked {
  @Input() messages: AiChatMessage[] = [];
  @Input() streaming = false;
  @Input() disabled = false;
  /** Narrow shells stack the starters and drop the reading-column cap. */
  @Input() compact = false;
  @Input() greeting = 'How can I help you today?';
  @Input() placeholder = 'Ask AI assistant anything ...';
  @Input() suggestions: string[] = [];
  /** Per-turn answer body; falls back to markdown when absent. */
  @Input() answerTemplate?: TemplateRef<{ $implicit: AiChatMessage }>;

  @Output() promptSubmitted = new EventEmitter<string>();
  @Output() stopRequested = new EventEmitter<void>();
  @Output() stepsToggled = new EventEmitter<AiChatMessage>();
  @Output() regenerated = new EventEmitter<AiChatMessage>();
  @Output() copyRequested = new EventEmitter<AiChatMessage>();
  @Output() rated = new EventEmitter<{ message: AiChatMessage; rating: AiRating }>();
  @Output() docOpened = new EventEmitter<AiDocRef>();
  @Output() contextRequested = new EventEmitter<void>();
  @Output() voiceRequested = new EventEmitter<void>();

  @ViewChild('scroll') scrollRef?: ElementRef<HTMLElement>;
  @ViewChild('composer') composer?: AiComposerComponent;

  /** Expanded source lists, keyed by turn — local view state, not the host's. */
  readonly expandedSources = new Set<string>();

  atBottom = true;
  private lastHeight = 0;

  /** Follow new content only while the reader is already at the bottom. */
  ngAfterViewChecked(): void {
    const el = this.scrollRef?.nativeElement;
    if (!el) return;
    if (el.scrollHeight !== this.lastHeight) {
      this.lastHeight = el.scrollHeight;
      if (this.atBottom) this.scrollToBottom();
    }
  }

  trackById(_: number, message: AiChatMessage): string { return message.id; }

  toggleSources(id: string): void {
    this.expandedSources.has(id) ? this.expandedSources.delete(id) : this.expandedSources.add(id);
  }

  onScroll(): void {
    const el = this.scrollRef?.nativeElement;
    if (!el) return;
    // 24px of slack — an exact comparison flickers on sub-pixel scroll heights.
    this.atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  scrollToBottom(smooth = false): void {
    const el = this.scrollRef?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    this.atBottom = true;
  }

  focus(): void { this.composer?.focus(); }
}
