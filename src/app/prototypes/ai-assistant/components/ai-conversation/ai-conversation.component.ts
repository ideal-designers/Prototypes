import { Component, ElementRef, HostBinding, Input, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, ToastService } from '../../../../shared/ds';
import { AiConversationService } from '../../services/ai-conversation.service';
import { AiEngineService } from '../../services/ai-engine.service';
import { ChatMessage } from '../../models/ai-message.model';
import { MockDocument } from '../../models/mock-doc.model';
import { AiMessageComponent } from '../ai-message/ai-message.component';
import { AiComposerComponent } from '../ai-composer/ai-composer.component';

/** Empty state ↔ active transcript, with the composer docked at the bottom. */
@Component({
  selector: 'fvdr-ai-conversation',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, AiMessageComponent, AiComposerComponent],
  template: `
    <div class="conv">
      <!-- ── Empty state ── -->
      <div class="empty" *ngIf="conv.isEmpty(); else transcript">
        <span class="empty__mark"><fvdr-icon name="ideon"></fvdr-icon></span>
        <h1 class="empty__title">How can I help you today?</h1>

        <fvdr-ai-composer
          class="empty__composer"
          [busy]="engine.streaming()"
          (submitted)="send($event)"
        ></fvdr-ai-composer>

        <div class="empty__chips">
          <fvdr-chip
            *ngFor="let s of suggestions()"
            [label]="s"
            variant="grey"
            size="l"
            [clickable]="true"
            (clicked)="send(s)"
          ></fvdr-chip>
        </div>
      </div>

      <!-- ── Active transcript ── -->
      <ng-template #transcript>
        <div class="conv__scroll" #scroll>
          <fvdr-ai-message
            *ngFor="let m of conv.messages(); trackBy: trackById"
            [message]="m"
            [compact]="compact"
            (stepsToggled)="conv.toggleSteps(m.id)"
            (stopRequested)="engine.stop()"
            (docOpened)="onDocOpened($event)"
            (folderOpened)="onFolderOpened($event)"
          ></fvdr-ai-message>
        </div>

        <div class="conv__dock">
          <fvdr-ai-composer
            [busy]="engine.streaming()"
            (submitted)="send($event)"
          ></fvdr-ai-composer>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); }

    .conv { display: flex; flex-direction: column; height: 100%; min-height: 0; }

    /* ── Empty state ── */
    .empty {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: var(--space-4); padding: var(--space-8) 0;
    }
    .empty__mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: var(--radius-full);
      background: var(--color-primary-50); color: var(--color-primary-500);
      font-size: var(--font-size-2xl, 20px);
    }
    .empty__title {
      margin: 0;
      font-size: var(--font-size-5xl, 28px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary);
    }
    .empty__composer { width: 100%; }
    .empty__chips {
      display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2);
    }
    /* The DS chip's grey fill is a light constant — retint it for the dark shell. */
    :host-context(.dark-theme) .empty__chips { --chip-bg-grey: var(--color-stone-300); }

    /* ── Transcript ── */
    .conv__scroll {
      flex: 1; min-height: 0; overflow-y: auto;
      display: flex; flex-direction: column; gap: var(--space-6);
      padding: var(--space-6) 0;
    }
    .conv__dock { padding-bottom: var(--space-6); }

    /* ── Compact containers (sidebar ~400px, floating ~490px) ── */
    :host(.conv--compact) .empty { gap: var(--space-3); padding: var(--space-4) 0; }
    :host(.conv--compact) .empty__title { font-size: var(--font-size-2xl, 20px); text-align: center; }
    :host(.conv--compact) .empty__chips { flex-direction: column; align-items: stretch; }
    :host(.conv--compact) .conv__scroll { gap: var(--space-4); padding: var(--space-4) 0; }
    :host(.conv--compact) .conv__dock { padding-bottom: var(--space-4); }
  `],
})
export class AiConversationComponent {
  readonly conv = inject(AiConversationService);
  readonly engine = inject(AiEngineService);
  private toast = inject(ToastService);

  @ViewChild('scroll') scrollRef?: ElementRef<HTMLElement>;

  /** Narrow containers (sidebar / floating) stack the chips instead of wrapping them. */
  @Input() @HostBinding('class.conv--compact') compact = false;

  /** Chips follow the active scope — a folder-seeded chat offers folder-level actions. */
  readonly suggestions = computed<string[]>(() => {
    const scope = this.conv.scope();
    if (scope.kind === 'folder') {
      return [
        'Summarize the documents in this folder',
        'Show all documents missing signatures',
        'Generate a due diligence report draft',
      ];
    }
    return [
      'Summarize the documents in this data room',
      'Show all documents missing signatures',
      'Generate a due diligence report draft',
    ];
  });

  constructor() {
    effect(() => {
      this.conv.messages();
      setTimeout(() => this.scrollToBottom());
    });
  }

  trackById(_: number, message: ChatMessage): string {
    return message.id;
  }

  send(text: string): void {
    void this.engine.send(text);
  }

  onDocOpened(doc: MockDocument): void {
    this.toast.show({ variant: 'info', message: `Would open ${doc.name}` });
  }

  onFolderOpened(folderPath: string): void {
    this.toast.show({ variant: 'info', message: `Would open ${folderPath}` });
  }

  private scrollToBottom(): void {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
