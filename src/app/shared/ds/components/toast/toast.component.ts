import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { BehaviorSubject, Subject } from 'rxjs';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id?: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persistent
}

/**
 * DS Toasts — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-16725
 *
 * DS specs:
 *   Width: 360px
 *   Padding: 12px 16px
 *   Radius: 8px
 *   Shadow: --shadow-toast
 *   Icon left 20px, close button right
 *   Title: 14px w600, message: 13px w400
 *   Variants: success/error/warning/info
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
      <fvdr-icon [name]="iconName" class="toast__icon" />
      <div class="toast__body">
        <span *ngIf="title" class="toast__title">{{ title }}</span>
        <span class="toast__message">{{ message }}</span>
      </div>
      <button class="toast__close" (click)="close()">
        <fvdr-icon name="close" />
      </button>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      width: 360px;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
      box-shadow: var(--shadow-toast);
      border-left: 4px solid;
      opacity: 0;
      transform: translateX(16px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none;
    }
    .toast--visible { opacity: 1; transform: translateX(0); pointer-events: all; }

    .toast--success { border-color: var(--color-primary-500); }
    .toast--error   { border-color: var(--color-error-600); }
    .toast--warning { border-color: var(--color-warning-600); }
    .toast--info    { border-color: var(--color-info-500); }

    .toast__icon {
      font-size: 20px;
      margin-top: 1px;
      flex-shrink: 0;
    }
    .toast--success .toast__icon { color: var(--color-primary-500); }
    .toast--error   .toast__icon { color: var(--color-error-600); }
    .toast--warning .toast__icon { color: var(--color-warning-700); }
    .toast--info    .toast__icon { color: var(--color-info-500); }

    .toast__body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .toast__title {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-sb-weight);
      color: var(--color-text-primary);
      line-height: var(--text-base-s-lh);
    }
    .toast__message {
      font-family: var(--font-family);
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 20px;
    }

    .toast__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      font-size: 14px;
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
  @Output() closed = new EventEmitter<void>();

  visible = false;
  private timer?: ReturnType<typeof setTimeout>;

  get iconName() {
    const map: Record<ToastVariant, string> = { success: 'check', error: 'error', warning: 'attention', info: 'info' };
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
