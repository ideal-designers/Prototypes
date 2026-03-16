import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { ButtonComponent } from '../button/button.component';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

export type ModalSize = 's' | 'm' | 'l' | 'xl';

export interface ModalConfig {
  id?: string;
  title: string;
  content?: string;
  size?: ModalSize;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * DS Modals — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-15799
 *
 * DS specs:
 *   Width: S=400px, M=520px, L=640px, XL=800px
 *   Radius: 12px
 *   Overlay: rgba(0,0,0,0.48)
 *   Header: 20px title w600, close button top-right
 *   Body: scrollable if needed
 *   Footer: right-aligned action buttons
 *   Animation: fade + scale in
 *
 * Usage (service):
 *   inject(ModalService).open({ title: 'Confirm', content: 'Are you sure?', onConfirm: () => ... });
 *
 * Usage (direct):
 *   <fvdr-modal [visible]="show" title="Edit" (closed)="show=false">
 *     <ng-content />
 *   </fvdr-modal>
 */
@Component({
  selector: 'fvdr-modal',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <div *ngIf="visible" class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal modal--{{ size }}" (click)="$event.stopPropagation()">
        <div class="modal__header">
          <span class="modal__title">{{ title }}</span>
          <button class="modal__close" (click)="close()">
            <fvdr-icon name="close" />
          </button>
        </div>
        <div class="modal__body">
          <ng-content></ng-content>
          <p *ngIf="content" class="modal__content-text">{{ content }}</p>
        </div>
        <div *ngIf="confirmLabel || cancelLabel" class="modal__footer">
          <fvdr-btn *ngIf="cancelLabel" [label]="cancelLabel" variant="ghost" (clicked)="cancel()" />
          <fvdr-btn *ngIf="confirmLabel" [label]="confirmLabel" [variant]="confirmVariant || 'primary'" (clicked)="confirm()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.48);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: var(--color-stone-0);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-popover);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 80px);
      animation: scale-in 0.15s ease;
    }
    @keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

    .modal--s  { width: 400px; }
    .modal--m  { width: 520px; }
    .modal--l  { width: 640px; }
    .modal--xl { width: 800px; }

    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }

    .modal__title {
      font-family: var(--font-family);
      font-size: var(--text-sub2-size);
      font-weight: var(--text-sub2-weight);
      color: var(--color-text-primary);
      line-height: var(--text-sub2-lh);
    }

    .modal__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      font-size: 16px;
    }
    .modal__close:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .modal__body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
    }

    .modal__content-text {
      font-family: var(--font-family);
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      line-height: var(--text-body3-lh);
      margin: 0;
    }

    .modal__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
  `],
})
export class ModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() content = '';
  @Input() size: ModalSize = 'm';
  @Input() confirmLabel = '';
  @Input() cancelLabel = '';
  @Input() confirmVariant: 'primary' | 'danger' = 'primary';
  @Input() closeOnOverlay = true;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onOverlayClick(e: Event): void {
    if (this.closeOnOverlay) this.close();
  }
  close(): void { this.closed.emit(); }
  confirm(): void { this.confirmed.emit(); this.close(); }
  cancel(): void { this.cancelled.emit(); this.close(); }
}

// ─── Mobile Modal / Bottom Sheet ─────────────────────────────────────────────

/**
 * DS Mobile modals — Figma: liyNDiFf1piO8SQmHNKoeU, node 15874-8424
 * Bottom sheet variant for mobile
 */
@Component({
  selector: 'fvdr-bottom-sheet',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, ButtonComponent],
  template: `
    <div *ngIf="visible" class="sheet-overlay" (click)="onOverlayClick()">
      <div class="sheet" (click)="$event.stopPropagation()">
        <div class="sheet__handle"></div>
        <div class="sheet__header" *ngIf="title">
          <span class="sheet__title">{{ title }}</span>
          <button class="sheet__close" (click)="close()">
            <fvdr-icon name="close" />
          </button>
        </div>
        <div class="sheet__body">
          <ng-content></ng-content>
        </div>
        <div *ngIf="confirmLabel || cancelLabel" class="sheet__footer">
          <fvdr-btn *ngIf="cancelLabel" [label]="cancelLabel" variant="ghost" size="l" style="width:100%" (clicked)="cancel()" />
          <fvdr-btn *ngIf="confirmLabel" [label]="confirmLabel" [variant]="confirmVariant" size="l" style="width:100%" (clicked)="confirm()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sheet-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.48);
      display: flex;
      align-items: flex-end;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .sheet {
      width: 100%;
      background: var(--color-stone-0);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slide-up 0.25s ease;
    }
    @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

    .sheet__handle {
      width: 40px; height: 4px;
      background: var(--color-stone-400);
      border-radius: 2px;
      margin: var(--space-2) auto;
      flex-shrink: 0;
    }

    .sheet__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2) var(--space-4) var(--space-4);
      flex-shrink: 0;
    }
    .sheet__title {
      font-family: var(--font-family);
      font-size: var(--text-sub2-size);
      font-weight: var(--text-sub2-weight);
      color: var(--color-text-primary);
    }
    .sheet__close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; background: transparent;
      cursor: pointer; color: var(--color-text-secondary); font-size: 16px;
    }
    .sheet__body { flex: 1; overflow-y: auto; padding: 0 var(--space-4) var(--space-4); }
    .sheet__footer { padding: var(--space-4); border-top: 1px solid var(--color-divider); display: flex; flex-direction: column; gap: var(--space-2); flex-shrink: 0; }
  `],
})
export class BottomSheetComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() confirmLabel = '';
  @Input() cancelLabel = '';
  @Input() confirmVariant: 'primary' | 'danger' = 'primary';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onOverlayClick(): void { this.close(); }
  close(): void { this.closed.emit(); }
  confirm(): void { this.confirmed.emit(); this.close(); }
  cancel(): void { this.cancelled.emit(); this.close(); }
}
