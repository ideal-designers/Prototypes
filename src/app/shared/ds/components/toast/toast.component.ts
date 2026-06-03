import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { BehaviorSubject, Subject } from 'rxjs';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick?: () => void;
  /** Keep the toast open after the action runs. Default: close on click. */
  keepOpen?: boolean;
}

export interface ToastData {
  id?: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persistent
  actions?: ToastAction[]; // up to 2 inline action links
}

/**
 * DS Toasts — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-16725
 *
 * DS specs (Toast local 400px {fix}):
 *   Width: 400px
 *   Radius: 4px (--radius-sm)
 *   Left bar: 4px, rounded left, variant-colored
 *   Gap bar→content: 20px, inner padding: 16px top/bottom, 16px right
 *   Icon: 20px, variant-colored. Close: 16px.
 *   Message: Open Sans 16px / 24px, text-primary. Optional title (semibold).
 *   Shadow: --shadow-toast
 *   Variants: success/error/warning/info → --color-alert-*
 *   Stack vertically top-right by default
 *
 * Usage (service):
 *   inject(ToastService).show({ variant: 'success', message: 'Saved!' });
 *
 * Usage (standalone):
 *   <fvdr-toast variant="success" message="Operation complete" (closed)="hide()" />
 */
@Component({
  selector: 'fvdr-toast',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="toast toast--{{ variant }}" [class.toast--visible]="visible" role="alert">
      <span class="toast__bar" aria-hidden="true"></span>
      <div class="toast__inner" [class.toast__inner--actions]="actions.length">
        <fvdr-icon [name]="iconName" class="toast__icon" />
        <div class="toast__body">
          <span *ngIf="title" class="toast__title">{{ title }}</span>
          <span *ngIf="message" class="toast__message">{{ message }}</span>
          <div *ngIf="actions.length" class="toast__actions">
            <button
              *ngFor="let action of actions"
              type="button"
              class="toast__action"
              (click)="runAction(action)"
            >{{ action.label }}</button>
          </div>
        </div>
        <button class="toast__close" (click)="close()" aria-label="Close">
          <fvdr-icon name="close" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: stretch;
      gap: var(--space-5);
      width: 400px;
      padding-right: var(--space-4);
      border-radius: var(--radius-sm);
      background: var(--color-stone-50);
      box-shadow: var(--shadow-toast);
      overflow: hidden;
      opacity: 0;
      transform: translateX(16px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none;
    }
    .toast--visible { opacity: 1; transform: translateX(0); pointer-events: all; }

    .toast__bar {
      flex-shrink: 0;
      width: 4px;
      align-self: stretch;
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    .toast--success .toast__bar { background: var(--color-alert-success); }
    .toast--error   .toast__bar { background: var(--color-alert-error); }
    .toast--warning .toast__bar { background: var(--color-alert-warning); }
    .toast--info    .toast__bar { background: var(--color-alert-info); }

    .toast__inner {
      flex: 1;
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4) 0;
      min-width: 0;
    }
    /* Action variant: deeper bottom padding (Figma pt-16 / pb-24) */
    .toast__inner--actions { padding-bottom: var(--space-6); }

    .toast__icon {
      width: 24px;
      height: 24px;
      font-size: var(--font-size-2xl);
      flex-shrink: 0;
    }
    .toast--success .toast__icon { color: var(--color-alert-success); }
    .toast--error   .toast__icon { color: var(--color-alert-error); }
    .toast--warning .toast__icon { color: var(--color-alert-warning); }
    .toast--info    .toast__icon { color: var(--color-alert-info); }

    .toast__body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .toast__title {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 24px;
    }
    .toast__message {
      font-family: var(--font-family);
      font-size: var(--font-size-lg);
      color: var(--color-text-primary);
      line-height: 24px;
      word-break: break-word;
    }
    .toast__title + .toast__message { margin-top: var(--space-1); }

    .toast__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-6);
      margin-top: var(--space-4);
    }
    .toast__action {
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--font-size-md);
      font-weight: 400;
      line-height: 16px;
      color: var(--color-primary-500);
    }
    .toast__action:hover { text-decoration: underline; }
    .toast--error .toast__action { color: var(--color-alert-error); }

    .toast__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      font-size: var(--font-size-lg);
      padding: 0;
    }
    .toast__close:hover { color: var(--color-text-primary); }
  `],
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() variant: ToastVariant = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() duration = 5000;
  @Input() actions: ToastAction[] = [];
  @Output() closed = new EventEmitter<void>();

  visible = false;
  private timer?: ReturnType<typeof setTimeout>;

  runAction(action: ToastAction): void {
    action.onClick?.();
    if (!action.keepOpen) this.close();
  }

  get iconName() {
    const map: Record<ToastVariant, string> = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info',
    };
    return map[this.variant] as any;
  }

  ngOnInit(): void {
    requestAnimationFrame(() => { this.visible = true; });
    if (this.duration > 0) {
      this.timer = setTimeout(() => this.close(), this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  close(): void {
    this.visible = false;
    setTimeout(() => this.closed.emit(), 250);
  }
}

// ─── Toast Host (container that renders active toasts) ───────────────────────

/**
 * DS Toast Host — place once in app root:
 *   <fvdr-toast-host />
 *
 * Then inject ToastService anywhere to show toasts.
 */
@Component({
  selector: 'fvdr-toast-host',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="toast-host">
      <fvdr-toast
        *ngFor="let t of toasts$ | async; trackBy: trackById"
        [variant]="t.variant"
        [title]="t.title || ''"
        [message]="t.message"
        [duration]="t.duration ?? 5000"
        [actions]="t.actions || []"
        (closed)="remove(t.id!)"
      />
    </div>
  `,
  styles: [`
    .toast-host {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      pointer-events: none;
    }
  `],
})
export class ToastHostComponent {
  private svc = inject(ToastService);
  toasts$ = this.svc.toasts$;
  trackById = (_: number, t: ToastData) => t.id;
  remove(id: string): void { this.svc.remove(id); }
}

// ─── Toast Service ────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<ToastData[]>([]);
  toasts$ = this._toasts.asObservable();

  show(data: Omit<ToastData, 'id'>): string {
    const id = Math.random().toString(36).slice(2);
    this._toasts.next([...this._toasts.value, { ...data, id }]);
    return id;
  }

  remove(id: string): void {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
}
