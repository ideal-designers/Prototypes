import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';

export type AiPanelMode = 'fullscreen' | 'sidebar' | 'floating';

/**
 * The shell the conversation lives in, in three modes:
 *   · fullscreen → takes the content area
 *   · sidebar    → right rail that pushes the layout
 *   · floating   → draggable card over the content
 *
 * One conversation, three containers. Switching mode must never reset the
 * thread, so the panel owns only chrome and geometry — the transcript is
 * projected and outlives the mode change.
 */
@Component({
  selector: 'fvdr-ai-panel',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="panel" *ngIf="open" [ngClass]="'panel--' + mode" [style.width.px]="mode === 'sidebar' ? width : null">
      <header class="panel__head" (pointerdown)="onDragStart($event)">
        <span class="panel__title">{{ title }}</span>

        <span class="panel__tools">
          <button type="button" class="panel__btn" title="New chat" aria-label="New chat" (click)="newChat.emit()">
            <fvdr-icon name="new-session"></fvdr-icon>
          </button>
          <button
            *ngIf="showHistory"
            type="button"
            class="panel__btn"
            [class.panel__btn--on]="historyOpen"
            title="History"
            aria-label="History"
            (click)="historyToggled.emit()"
          >
            <fvdr-icon name="history"></fvdr-icon>
          </button>

          <span class="panel__sep"></span>

          <button
            *ngFor="let m of modes"
            type="button"
            class="panel__btn"
            [class.panel__btn--on]="mode === m.id"
            [title]="m.label"
            [attr.aria-label]="m.label"
            [attr.aria-pressed]="mode === m.id"
            (click)="setMode(m.id)"
          >
            <fvdr-icon [name]="m.icon"></fvdr-icon>
          </button>

          <button type="button" class="panel__btn" title="Close" aria-label="Close" (click)="close()">
            <fvdr-icon name="close"></fvdr-icon>
          </button>
        </span>
      </header>

      <!-- Sidebar resize grip -->
      <span class="panel__grip" *ngIf="mode === 'sidebar'" (pointerdown)="onResizeStart($event)"></span>

      <div class="panel__body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; font-family: var(--font-family); }

    .panel {
      display: flex; flex-direction: column;
      min-height: 0;
      background: var(--color-stone-0);
    }

    /* Fullscreen — fills the content area it is dropped into, flex host or not. */
    .panel--fullscreen { height: 100%; flex: 1 1 auto; min-width: 0; }

    /* Sidebar — in the layout flow, so the content reflows rather than being covered. */
    .panel--sidebar {
      position: relative;
      height: 100%;
      flex: 0 0 auto;
      border-left: 1px solid var(--color-divider);
    }

    /* Floating — over the content, draggable by its header. */
    .panel--floating {
      position: fixed;
      right: var(--space-6); bottom: var(--space-6);
      width: 380px; height: 560px;
      max-height: calc(100vh - 96px);
      z-index: 300;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-toast);
      overflow: hidden;
    }

    .panel__head {
      flex: 0 0 auto;
      display: flex; align-items: center; gap: var(--space-2);
      height: 48px;
      padding: 0 var(--space-2) 0 var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .panel--floating .panel__head { cursor: grab; }
    .panel--floating .panel__head:active { cursor: grabbing; }

    .panel__title {
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-primary);
    }

    .panel__tools { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
    .panel__sep { width: 1px; height: 20px; margin: 0 var(--space-1); background: var(--color-divider); }

    .panel__btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-base, 14px);
      transition: background 0.12s ease, color 0.12s ease;
    }
    .panel__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .panel__btn--on { color: var(--color-primary-500); }

    .panel__body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

    /* 8px hit area straddling the border — comfortable without being visible. */
    .panel__grip {
      position: absolute; left: -4px; top: 0; bottom: 0;
      width: 8px; z-index: 1;
      cursor: col-resize;
    }

    @media (max-width: 1023px) {
      /* No room for a rail on a phone — the sidebar becomes a full sheet. */
      .panel--sidebar { position: fixed; inset: 0; width: 100% !important; z-index: 300; border-left: none; }
      .panel--floating { inset: auto var(--space-3) var(--space-3); width: auto; height: 70vh; }
    }
  `],
})
export class AiPanelComponent {
  readonly modes: { id: AiPanelMode; icon: 'panel-window' | 'sidebar-mode' | 'floating-mode'; label: string }[] = [
    { id: 'fullscreen', icon: 'panel-window',  label: 'Full screen' },
    { id: 'sidebar',    icon: 'sidebar-mode',   label: 'Side panel' },
    { id: 'floating',   icon: 'floating-mode',  label: 'Floating' },
  ];

  @Input() mode: AiPanelMode = 'sidebar';
  @Output() modeChange = new EventEmitter<AiPanelMode>();

  @Input() open = true;
  @Output() openChange = new EventEmitter<boolean>();

  @Input() title = 'AI assistant';
  @Input() showHistory = false;
  @Input() historyOpen = false;

  /** Sidebar width in px, clamped to [minWidth, maxWidth] while dragging. */
  @Input() width = 440;
  @Output() widthChange = new EventEmitter<number>();
  @Input() minWidth = 400;
  @Input() maxWidth = 560;

  @Output() newChat = new EventEmitter<void>();
  @Output() historyToggled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  /** Floating offset from its docked corner, so a drag survives re-render. */
  @HostBinding('style.--ai-panel-dx') dx: string | null = null;

  private resizeFrom = 0;
  private widthFrom = 0;

  setMode(mode: AiPanelMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.modeChange.emit(mode);
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
  }

  onResizeStart(event: PointerEvent): void {
    if (this.mode !== 'sidebar') return;
    event.preventDefault();
    this.resizeFrom = event.clientX;
    this.widthFrom = this.width;

    const move = (e: PointerEvent) => {
      // The rail is on the right, so dragging left widens it.
      const next = this.widthFrom + (this.resizeFrom - e.clientX);
      this.width = Math.min(this.maxWidth, Math.max(this.minWidth, next));
      this.widthChange.emit(this.width);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  onDragStart(event: PointerEvent): void {
    if (this.mode !== 'floating') return;
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;   // tool clicks are not drags

    const panel = (event.currentTarget as HTMLElement).parentElement;
    if (!panel) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const rect = panel.getBoundingClientRect();

    const move = (e: PointerEvent) => {
      const left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, rect.left + (e.clientX - startX)));
      const top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, rect.top + (e.clientY - startY)));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
}
