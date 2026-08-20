import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../shared/ds';
import { AiConversationService } from '../services/ai-conversation.service';
import { AiConversationComponent } from '../components/ai-conversation/ai-conversation.component';

const WIN_WIDTH = 490;
const WIN_HEIGHT = 560;

/**
 * Floating shell — compact movable window overlaying the current screen, opened
 * in-context (e.g. from a folder) and seeded with that scope.
 * Drag follows the manual mousedown/mousemove/mouseup pattern used by the
 * quick-access panel's resizer, applied to x/y instead of width.
 */
@Component({
  selector: 'fvdr-ai-floating',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, AiConversationComponent],
  template: `
    <div class="win" [style.left.px]="x" [style.top.px]="y">
      <header class="win__head" (mousedown)="startDrag($event)">
        <span class="win__title" [attr.title]="conv.seededTitle()">{{ conv.seededTitle() }}</span>

        <fvdr-ghost-btn
          size="small"
          icon="new-session"
          tooltip="New chat"
          (clicked)="conv.newChat()"
        ></fvdr-ghost-btn>
        <!-- Glyph shows the current display mode; clicking docks the chat to the side.
             Hidden below the docking breakpoint — there is no room for a drawer, so
             offering a toggle that silently does nothing would be worse than no toggle. -->
        <fvdr-ghost-btn
          *ngIf="conv.canDock()"
          size="small"
          icon="floating-mode"
          tooltip="Dock to the side panel"
          (clicked)="conv.setShell('sidebar')"
        ></fvdr-ghost-btn>
        <fvdr-ghost-btn
          size="small"
          icon="close"
          tooltip="Close"
          (clicked)="conv.setShell('none')"
        ></fvdr-ghost-btn>
      </header>

      <div class="win__body">
        <fvdr-ai-conversation [compact]="true"></fvdr-ai-conversation>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .win {
      position: fixed; z-index: 400;
      width: 490px; height: 560px;
      display: flex; flex-direction: column; min-height: 0;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-popover);
      overflow: hidden;
    }

    .win__head {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      cursor: move; user-select: none;
      flex-shrink: 0;
    }
    .win__title {
      flex: 1; min-width: 0;
      font-size: var(--font-size-md, 15px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .win__body { flex: 1; min-height: 0; padding: 0 var(--space-4); }
  `],
})
export class AiFloatingComponent implements OnDestroy {
  readonly conv = inject(AiConversationService);

  x = Math.max(24, window.innerWidth - WIN_WIDTH - 48);
  y = Math.max(24, Math.round((window.innerHeight - WIN_HEIGHT) / 2));

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private originX = 0;
  private originY = 0;
  private pending: { x: number; y: number } | null = null;
  private rafScheduled = false;

  startDrag(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.originX = this.x;
    this.originY = this.y;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging) return;
    this.pending = {
      x: this.clampX(this.originX + (e.clientX - this.startX)),
      y: this.clampY(this.originY + (e.clientY - this.startY)),
    };
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      requestAnimationFrame(() => {
        this.rafScheduled = false;
        if (this.dragging && this.pending) {
          this.x = this.pending.x;
          this.y = this.pending.y;
        }
      });
    }
  };

  private onMouseUp = () => {
    // Commit synchronously in case the last mousemove's rAF hasn't fired yet.
    if (this.dragging && this.pending) {
      this.x = this.pending.x;
      this.y = this.pending.y;
    }
    this.pending = null;
    this.stopDrag();
  };

  private stopDrag(): void {
    this.dragging = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private clampX(value: number): number {
    return Math.min(Math.max(0, value), Math.max(0, window.innerWidth - WIN_WIDTH));
  }

  private clampY(value: number): number {
    return Math.min(Math.max(0, value), Math.max(0, window.innerHeight - WIN_HEIGHT));
  }

  ngOnDestroy(): void {
    this.stopDrag();
  }
}
