import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import type { FvdrIconName } from '../../icons/icons';

export type ButtonType = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'text';
export type ButtonSize = 's' | 'm' | 'l';

/**
 * DS Button — Figma: ↳ Buttons ⌛️ (liyNDiFf1piO8SQmHNKoeU, page 15023:113844)
 *
 * Variants:
 *   Type=Primary   → bg #2C9C74, hover #1C8269, active #12695C
 *   Type=Secondary → border #BBBDC8 (stone-500), text #40424B (stone-900), bg transparent
 *   Type=Ghost     → no border, text #40424B (stone-900)
 *   Type=Danger    → bg #E54430, hover #C62C19
 *   Type=Link      → no bg, bottom-border underline, primary color
 *   Type=Text      → no bg/border, primary color
 *
 * Sizes (DS):
 *   S → h=32px, text 14px
 *   M → h=40px, text 15px
 *   L → h=48px, text 16px
 *
 * Usage:
 *   <fvdr-btn label="Save" (clicked)="onSave()" />
 *   <fvdr-btn label="Delete" variant="danger" size="s" />
 *   <fvdr-btn label="Cancel" variant="secondary" />
 *   <fvdr-btn label="Loading..." [loading]="true" />
 *   <fvdr-btn label="Disabled" [disabled]="true" />
 */
@Component({
  selector: 'fvdr-btn',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <button
      class="btn btn--{{ variant }} btn--{{ size }}"
      [disabled]="disabled || loading"
      [attr.data-track]="dataTrack"
      (click)="!disabled && !loading && clicked.emit($event)"
    >
      <span *ngIf="loading" class="btn__spinner"></span>
      <!-- iconName: FvdrIconName (preferred) -->
      <fvdr-icon *ngIf="iconName && !loading" [name]="iconName" class="btn__icon-ds"></fvdr-icon>
      <!-- icon: raw SVG innerHTML (legacy) -->
      <svg *ngIf="icon && !iconName && !loading" class="btn__icon" [innerHTML]="icon" width="16" height="16" viewBox="0 0 16 16"></svg>
      <span class="btn__label">{{ label }}</span>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 var(--space-3);
      border-radius: var(--radius-sm);
      border: 1.5px solid transparent;
      font-family: var(--font-family);
      font-weight: 400;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
      white-space: nowrap;
      text-decoration: none;
    }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

    /* ── Size: S — DS: h=32px, fs=14px ── */
    .btn--s { height: var(--btn-height-s); font-size: var(--text-btn-s-size); padding: 0 var(--space-3); }
    /* ── Size: M — DS: h=40px, fs=15px ── */
    .btn--m { height: var(--btn-height-m); font-size: var(--text-btn-m-size); padding: 0 var(--space-4); }
    /* ── Size: L — DS: h=48px, fs=16px ── */
    .btn--l { height: var(--btn-height-l); font-size: var(--text-btn-l-size); padding: 0 var(--space-4); }

    /* ── Type: Primary ── */
    .btn--primary {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
      color: #fff;
    }
    .btn--primary:hover:not(:disabled) {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
    }
    .btn--primary:active:not(:disabled) {
      background: var(--color-primary-700);
      border-color: var(--color-primary-700);
    }

    /* ── Type: Secondary — gray outlined (stone) ── */
    .btn--secondary {
      background: transparent;
      border-color: var(--color-stone-500);
      color: var(--color-stone-900);
    }
    .btn--secondary:hover:not(:disabled) {
      background: var(--color-stone-200);
      border-color: var(--color-stone-500);
      color: var(--color-stone-900);
    }
    .btn--secondary:active:not(:disabled) {
      background: var(--color-stone-400);
      border-color: var(--color-stone-500);
      color: var(--color-stone-900);
    }

    /* ── Type: Ghost — no border, stone-900 text ── */
    .btn--ghost {
      background: transparent;
      border-color: transparent;
      color: var(--color-stone-900);
    }
    .btn--ghost:hover:not(:disabled) {
      background: var(--color-hover-bg);
      border-color: transparent;
      color: var(--color-stone-900);
    }
    .btn--ghost:active:not(:disabled) {
      background: var(--color-stone-300);
      border-color: transparent;
      color: var(--color-stone-900);
    }

    /* ── Type: Link — inline text + bottom underline border ── */
    .btn--link {
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--color-primary-500);
      border-radius: 0;
      padding: 0;
      height: auto;
      color: var(--color-primary-500);
    }
    .btn--link:hover:not(:disabled) {
      background: transparent;
      border-bottom-color: var(--color-primary-600);
      color: var(--color-primary-600);
    }
    .btn--link:active:not(:disabled) {
      background: transparent;
      border-bottom-color: var(--color-primary-700);
      color: var(--color-primary-700);
    }

    /* ── Type: Text — text only, primary color, no decoration ── */
    .btn--text {
      background: transparent;
      border-color: transparent;
      color: var(--color-primary-500);
      padding: 0;
      height: auto;
    }
    .btn--text:hover:not(:disabled) {
      background: transparent;
      color: var(--color-primary-600);
    }
    .btn--text:active:not(:disabled) {
      background: transparent;
      color: var(--color-primary-700);
    }

    /* ── Type: Danger ── */
    .btn--danger {
      background: var(--color-error-600);
      border-color: var(--color-error-600);
      color: #fff;
    }
    .btn--danger:hover:not(:disabled) {
      background: var(--color-error-700);
      border-color: var(--color-error-700);
    }

    /* ── Spinner ── */
    .btn__spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .btn__icon { flex-shrink: 0; }
    .btn__icon-ds { flex-shrink: 0; font-size: 16px; }
    .btn__label { line-height: 1; }
  `],
})
export class ButtonComponent {
  @Input() label = '';
  @Input() variant: ButtonType = 'primary';
  @Input() size: ButtonSize = 'm';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string;           // legacy: raw SVG string
  @Input() iconName?: FvdrIconName; // preferred: DS icon name
  @Input() dataTrack?: string;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
