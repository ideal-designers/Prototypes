import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../shared/ds';
import { AiConversationService } from '../services/ai-conversation.service';
import { AiConversationComponent } from '../components/ai-conversation/ai-conversation.component';

/**
 * Docked shell — right-hand panel beside the Documents view. Hosts the same
 * conversation surface as the other shells, just in a narrower container.
 */
@Component({
  selector: 'fvdr-ai-sidebar',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, AiConversationComponent],
  template: `
    <aside class="panel">
      <header class="panel__head">
        <span class="panel__mark"><fvdr-icon name="api"></fvdr-icon></span>
        <span class="panel__title">{{ conv.seededTitle() }}</span>

        <button type="button" class="panel__btn" title="Pop out to full screen" (click)="conv.setShell('fullscreen')">
          <fvdr-icon name="expand"></fvdr-icon>
        </button>
        <button type="button" class="panel__btn" title="Undock to a floating window" (click)="conv.setShell('floating')">
          <fvdr-icon name="collapse"></fvdr-icon>
        </button>
        <button type="button" class="panel__btn" title="Close" (click)="conv.setShell('documents')">
          <fvdr-icon name="close"></fvdr-icon>
        </button>
      </header>

      <div class="panel__body">
        <fvdr-ai-conversation [compact]="true"></fvdr-ai-conversation>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; height: 100%; flex-shrink: 0; font-family: var(--font-family); }

    .panel {
      width: 400px; height: 100%;
      display: flex; flex-direction: column; min-height: 0;
      background: var(--color-stone-0);
      border-left: 1px solid var(--color-divider);
    }

    .panel__head {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .panel__mark { display: inline-flex; color: var(--color-primary-500); font-size: var(--font-size-lg, 16px); }
    .panel__title {
      flex: 1; min-width: 0;
      font-size: var(--font-size-md, 15px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .panel__btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-base, 14px);
    }
    .panel__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .panel__body { flex: 1; min-height: 0; padding: 0 var(--space-4); }
  `],
})
export class AiSidebarComponent {
  readonly conv = inject(AiConversationService);
}
