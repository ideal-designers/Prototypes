import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * fvdr-ghost-btn — Ghost button with configurable icon.
 *
 * Figma: FVDR - Viewers
 *   Icon-only:       node 7023:23051
 *   Labeled (Big):   node 17912:43215
 *   Labeled sizes:   node 17913:43460
 *
 * ── Sizes ────────────────────────────────────────────────────
 *   big   → h-40px, px-12 py-8, label 15px/24lh  (default)
 *   small → h-32px, p-8,        label 14px/20lh
 *
 * ── States ───────────────────────────────────────────────────
 *   default  → transparent bg
 *   hover    → #F7F7F7   (CSS :hover)
 *   active   → #ECEEF9   (CSS :active)
 *   selected → #EAF6ED bg, icon + arrow green, text stays dark
 *
 * ── Optional parts ───────────────────────────────────────────
 *   [label]    → shows text + chevron-down arrow
 *   [shortcut] → keyboard shortcut badge (e.g. 'Shift')
 *   [iconPath] → SVG <path d="..."> string; defaults to circle-plus
 */
export type GhostBtnSize = 'big' | 'small';

/** Default icon: circle with plus (16×16, filled path) */
const DEFAULT_ICON_PATH =
  'M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0Z' +
  'M8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5Z' +
  'M8 4C8.41421 4 8.75 4.33579 8.75 4.75V7.25H11.25C11.6642 7.25 12 7.58579 12 8C12 8.41421 11.6642 8.75 11.25 8.75H8.75V11.25C8.75 11.6642 8.41421 12 8 12C7.58579 12 7.25 11.6642 7.25 11.25V8.75H4.75C4.33579 8.75 4 8.41421 4 8C4 7.58579 4.33579 7.25 4.75 7.25H7.25V4.75C7.25 4.33579 7.58579 4 8 4Z';

@Component({
  selector: 'fvdr-ghost-btn',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="vb"
      [class.vb--big]="size === 'big'"
      [class.vb--small]="size === 'small'"
      [class.vb--labeled]="!!label"
      [class.vb--selected]="selected"
      [disabled]="disabled"
      (click)="clicked.emit()">

      <!-- Icon (16×16, configurable via [iconPath]) -->
      <svg class="vb-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path [attr.d]="iconPath" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
      </svg>

      <!-- Text label -->
      <span *ngIf="label" class="vb-label">{{ label }}</span>

      <!-- Chevron-down (only when label set and arrow not disabled) -->
      <svg *ngIf="label && arrow" class="vb-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M9.96973 3.46984C10.2626 3.17695 10.7374 3.17695 11.0303 3.46984C11.3232 3.76274 11.3232 4.2375 11.0303 4.53039L6.67188 8.88879C6.30088 9.25979 5.69913 9.25979 5.32813 8.88879L0.969729 4.53039L0.917971 4.47375C0.677662 4.17917 0.695125 3.74445 0.969729 3.46984C1.24433 3.19524 1.67905 3.17778 1.97364 3.41809L2.03028 3.46984L6 7.43957L9.96973 3.46984Z"
              fill="currentColor"/>
      </svg>

      <!-- Keyboard shortcut badge -->
      <span *ngIf="shortcut" class="vb-shortcut">{{ shortcut }}</span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    /* ── Base ── */
    .vb {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      overflow: hidden;
      transition: background 0.12s;
      flex-shrink: 0;
      font-family: inherit;
      outline: none;
      white-space: nowrap;
      text-align: left;
    }

    /* ── Sizes ── */
    .vb--big   { height: 40px; padding: 8px 12px; }
    .vb--small { height: 32px; padding: 8px; }

    /* ── Hover / Active ── */
    .vb:hover:not(:disabled)  { background: var(--color-stone-200, #F7F7F7); }
    .vb:active:not(:disabled) { background: var(--color-hover-bg, #ECEEF9); }

    /* ── Selected bg ── */
    .vb--selected,
    .vb--selected:hover:not(:disabled),
    .vb--selected:active:not(:disabled) { background: #EAF6ED; }

    /* ── Icon (default) ── */
    .vb-icon  { flex-shrink: 0; color: var(--color-stone-700, #73757F); }
    .vb-arrow { flex-shrink: 0; color: var(--color-stone-700, #73757F); }

    /* ── Icon selected → always green ── */
    .vb--selected .vb-icon  { color: var(--color-primary-500, #2C9C74); }
    .vb--selected .vb-arrow { color: var(--color-primary-500, #2C9C74); }

    /* ── Label ── */
    .vb-label {
      flex-shrink: 0;
      font-weight: 400;
      color: var(--color-text-primary, #1F2129);
    }

    /* Label sizes */
    .vb--big .vb-label   { font-size: 15px; line-height: 24px; }
    .vb--small .vb-label { font-size: 14px; line-height: 20px; }

    /* Selected → label stays dark (both sizes) */
    .vb--selected .vb-label { color: var(--color-text-primary, #1F2129); }

    /* ── Shortcut badge ── */
    .vb-shortcut {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 24px;
      padding: 0 6px;
      background: var(--color-hover-bg, #ECEEF9);
      border-radius: var(--radius-sm, 4px);
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      color: var(--color-text-primary, #1F2129);
      flex-shrink: 0;
    }

    /* ── Disabled ── */
    .vb:disabled { opacity: 0.4; cursor: default; }
  `]
})
export class GhostBtnComponent {
  /** Button size: 'big' (40px, default) or 'small' (32px). */
  @Input() size: GhostBtnSize = 'big';

  /** SVG path `d` attribute for the icon. Defaults to circle-plus. */
  @Input() iconPath: string = DEFAULT_ICON_PATH;

  /** Text label. When set → shows text + chevron arrow. */
  @Input() label = '';

  /** Keyboard shortcut badge (e.g. 'Shift', 'Ctrl+K'). */
  @Input() shortcut = '';

  /** Show chevron-down arrow when label is set (default true). */
  @Input() arrow = true;

  /** Selected state — green highlight. */
  @Input() selected = false;

  /** Disabled state. */
  @Input() disabled = false;

  @Output() clicked = new EventEmitter<void>();
}
