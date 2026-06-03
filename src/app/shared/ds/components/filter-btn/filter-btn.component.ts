import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';

/**
 * fvdr-filter-btn — Filter button with color variants.
 *
 * Figma: FVDR - Design System
 *   Frame: node 37844:15398
 *
 * ── Sizes ────────────────────────────────────────────────────
 *   M → h-40px, px-16, icon 16px, label 15px/16lh   (default)
 *   S → h-32px, px-12, icon 14px, label 14px/14lh
 *
 * ── States ───────────────────────────────────────────────────
 *   default  → white bg, stone-300 border
 *   hover    → stone-200 bg
 *   selected → color-specific bg + border
 *   disabled → 40% opacity
 *
 * ── Colors (12 variants) ─────────────────────────────────────
 *   default | stone | blue | yellow | orange | lime |
 *   teal | indigo | purple | magenta | danger | coffee
 *
 * ── Optional parts ───────────────────────────────────────────
 *   [showIcon]    → leading SVG icon (configurable via [iconPath])
 *   [showStatus]  → 8×8 colored dot (color depends on [color])
 *   [showCounter] → secondary text badge (e.g. "10")
 *   [showArrow]   → chevron-down arrow
 */

export type FilterBtnSize  = 'M' | 'S';
export type FilterBtnColor =
  'default' | 'stone' | 'blue' | 'yellow' | 'orange' |
  'lime' | 'teal' | 'indigo' | 'purple' | 'magenta' | 'danger' | 'coffee';

interface ColorTokens { bg: string; border: string; dot: string; }

/** Selected-state tokens for each color, from Figma */
const COLOR_TOKENS: Record<FilterBtnColor, ColorTokens> = {
  default: { bg: '#EAF6ED', border: '#2C9C74', dot: '#B1EAC2' },
  stone:   { bg: '#ECEEF9', border: '#BBBDC8', dot: '#BBBDC8' },
  blue:    { bg: '#EAF2FA', border: '#3B85CC', dot: '#A9CBED' },
  yellow:  { bg: '#FFF5E0', border: '#D48806', dot: '#FFD88A' },
  orange:  { bg: '#FFEDE1', border: '#DF6D00', dot: '#FFC694' },
  lime:    { bg: '#EEF6E3', border: '#5B9500', dot: '#CAE6A0' },
  teal:    { bg: '#E8FAFA', border: '#0095A4', dot: '#A3E9EC' },
  indigo:  { bg: '#F0F0FF', border: '#656EE2', dot: '#C4C8F7' },
  purple:  { bg: '#F9F1FF', border: '#A964F7', dot: '#EBD5FF' },
  magenta: { bg: '#FEEFF9', border: '#E142BC', dot: '#FFCEF2' },
  danger:  { bg: '#FFF0EE', border: '#DE1135', dot: '#FFD2CD' },
  coffee:  { bg: '#F0EDEA', border: '#886A53', dot: '#CEC2B8' },
};

/**
 * Default icon: color palette (paintbrush/palette shape).
 * 16×16 viewBox, fill-rule evenodd.
 */
const DEFAULT_ICON_PATH =
  'M8.15039 0.5C9.15025 0.500045 10.0941 0.67167 10.9814 1.01562C11.8689 1.35962 12.6474 1.83542 13.3164 2.44141C13.9852 3.04733 14.5167 3.76633 14.9102 4.59766C15.3034 5.42891 15.4999 6.32545 15.5 7.28711C15.5 8.72461 15.0625 9.82866 14.1875 10.5977C13.3125 11.3665 12.2499 11.7505 11 11.75H9.6123C9.50002 11.75 9.42241 11.7814 9.37891 11.8438C9.33544 11.9062 9.31304 11.9749 9.3125 12.0498C9.3125 12.1998 9.40625 12.4158 9.59375 12.6973C9.78118 12.9787 9.87493 13.3003 9.875 13.6621C9.875 14.2871 9.70287 14.7498 9.35938 15.0498C9.01589 15.3497 8.56294 15.5 8 15.5C6.97502 15.5 6.00623 15.3032 5.09375 14.9092C4.18125 14.5152 3.38412 13.9779 2.70312 13.2969C2.02213 12.6159 1.48482 11.8187 1.09082 10.9062C0.696839 9.99377 0.5 9.02498 0.5 8C0.5 6.96261 0.702965 5.98761 1.10938 5.0752C1.51587 4.1627 2.06627 3.36836 2.75977 2.69336C3.45322 2.01845 4.26259 1.48428 5.1875 1.09082C6.11248 0.697339 7.10042 0.5005 8.15039 0.5Z' +
  'M8.15039 2C6.45039 2 4.9998 2.58164 3.7998 3.74414C2.6 4.90659 2 6.32514 2 8C2 9.6625 2.58491 11.0781 3.75391 12.2471C4.92288 13.416 6.33805 14.0005 8 14C8.1125 14 8.20346 13.9688 8.27246 13.9062C8.34138 13.8438 8.3755 13.7621 8.375 13.6621C8.37486 13.4872 8.28105 13.2812 8.09375 13.0439C7.90625 12.8064 7.8125 12.4496 7.8125 11.9746C7.81259 11.4498 7.99403 11.0312 8.35645 10.7188C8.71892 10.4063 9.16255 10.25 9.6875 10.25H11C11.825 10.25 12.5316 10.0093 13.1191 9.52832C13.7064 9.04731 14 8.29992 14 7.28711C13.9999 5.77478 13.4215 4.5152 12.2656 3.50879C11.1098 2.50256 9.73808 1.99958 8.15039 2Z' +
  'M4 6.5C4.55228 6.5 5 6.94772 5 7.5C5 8.05228 4.55228 8.5 4 8.5C3.44772 8.5 3 8.05228 3 7.5C3 6.94772 3.44772 6.5 4 6.5Z' +
  'M12 6.5C12.5523 6.5 13 6.94772 13 7.5C13 8.05228 12.5523 8.5 12 8.5C11.4477 8.5 11 8.05228 11 7.5C11 6.94772 11.4477 6.5 12 6.5Z' +
  'M6.25 3.5C6.80228 3.5 7.25 3.94772 7.25 4.5C7.25 5.05228 6.80228 5.5 6.25 5.5C5.69772 5.5 5.25 5.05228 5.25 4.5C5.25 3.94772 5.69772 3.5 6.25 3.5Z' +
  'M10 3.5C10.5523 3.5 11 3.94772 11 4.5C11 5.05228 10.5523 5.5 10 5.5C9.44772 5.5 9 5.05228 9 4.5C9 3.94772 9.44772 3.5 10 3.5Z';

/** Chevron-down path (12×12 viewBox) */
const ARROW_PATH =
  'M9.96973 3.46984C10.2626 3.17695 10.7374 3.17695 11.0303 3.46984C11.3232 3.76274 11.3232 4.2375 11.0303 4.53039L6.67188 8.88879C6.30088 9.25979 5.69913 9.25979 5.32813 8.88879L0.969729 4.53039L0.917971 4.47375C0.677662 4.17917 0.695125 3.74445 0.969729 3.46984C1.24433 3.19524 1.67905 3.17778 1.97364 3.41809L2.03028 3.46984L6 7.43957L9.96973 3.46984Z';

@Component({
  selector: 'fvdr-filter-btn',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="fb"
      [class.fb--m]="size === 'M'"
      [class.fb--s]="size === 'S'"
      [class.fb--selected]="selected"
      [disabled]="disabled || null"
      [style.background]="selected ? colorTokens.bg  : null"
      [style.borderColor]="selected ? colorTokens.border : null"
      (click)="clicked.emit()">

      <!-- Leading icon: SafeHtml override or path-based SVG -->
      <span *ngIf="showIcon && iconHtml" class="fb-icon-html" [innerHTML]="iconHtml"></span>
      <svg *ngIf="showIcon && !iconHtml"
           class="fb-icon"
           [attr.width]="size === 'M' ? 16 : 14"
           [attr.height]="size === 'M' ? 16 : 14"
           viewBox="0 0 16 16" fill="none">
        <path [attr.d]="iconPath" fill="currentColor"
              fill-rule="evenodd" clip-rule="evenodd"/>
      </svg>

      <!-- Status color dot -->
      <span *ngIf="showStatus"
            class="fb-dot"
            [style.background]="colorTokens.dot">
      </span>

      <!-- Label -->
      <span *ngIf="label" class="fb-label">{{ label }}</span>

      <!-- Counter badge (secondary text) -->
      <span *ngIf="showCounter && counter" class="fb-counter">{{ counter }}</span>

      <!-- Chevron-down arrow -->
      <svg *ngIf="showArrow"
           class="fb-arrow"
           [attr.width]="size === 'M' ? 12 : 10"
           [attr.height]="size === 'M' ? 12 : 10"
           viewBox="0 0 12 12" fill="none">
        <path [attr.d]="arrowPath" fill="currentColor"/>
      </svg>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    /* ── Base ─────────────────────────────────────────────── */
    .fb {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--color-stone-0, #FFFFFF);
      border: 1px solid var(--color-divider, #DEE0EB);
      border-radius: var(--radius-sm, 4px);
      cursor: pointer;
      font-family: inherit;
      outline: none;
      white-space: nowrap;
      transition: background 0.12s, border-color 0.12s;
      flex-shrink: 0;
      text-align: left;
    }

    /* ── Sizes ──────────────────────────────────────────────  */
    .fb--m { height: 40px; padding: 0 16px; font-size: 15px; line-height: 16px; }
    .fb--s { height: 32px; padding: 0 12px; font-size: 14px; line-height: 14px; }

    /* ── Hover ──────────────────────────────────────────────  */
    .fb:hover:not(:disabled):not(.fb--selected) {
      background: var(--color-stone-200, #F7F7F7);
    }
    .fb:active:not(:disabled) {
      background: var(--color-stone-300, #ECEEF9);
    }

    /* ── Leading icon ───────────────────────────────────────  */
    .fb-icon {
      flex-shrink: 0;
      color: var(--color-stone-700, #73757F);
    }
    .fb-icon-html {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      color: var(--color-stone-700, #73757F);
    }
    .fb--selected .fb-icon-html { color: var(--color-primary-500, #2C9C74); }

    /* ── Status dot ─────────────────────────────────────────  */
    .fb-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Label ──────────────────────────────────────────────  */
    .fb-label {
      color: var(--color-text-primary, #1F2129);
      font-weight: 400;
      flex-shrink: 0;
    }

    /* ── Counter ────────────────────────────────────────────  */
    .fb-counter {
      color: var(--color-text-secondary, #5F616A);
      font-weight: 400;
      flex-shrink: 0;
    }
    /* counter turns dark in selected state */
    .fb--selected .fb-counter {
      color: var(--color-text-primary, #1F2129);
    }

    /* ── Arrow ──────────────────────────────────────────────  */
    .fb-arrow {
      flex-shrink: 0;
      color: var(--color-stone-700, #73757F);
    }

    /* ── Disabled ───────────────────────────────────────────  */
    .fb:disabled { opacity: 0.4; cursor: default; }
    .fb:disabled:hover { background: var(--color-stone-0, #FFFFFF); }
  `]
})
export class FilterBtnComponent {
  /** Text label */
  @Input() label = 'Filter';

  /** Size: 'M' (40px, default) or 'S' (32px) */
  @Input() size: FilterBtnSize = 'M';

  /** Color variant — affects selected-state bg/border and status dot */
  @Input() color: FilterBtnColor = 'default';

  /** Active/selected state */
  @Input() selected = false;

  /** Disabled state */
  @Input() disabled = false;

  /** Show leading icon (default: true) */
  @Input() showIcon = true;

  /** SVG path `d` attribute for the leading icon */
  @Input() iconPath: string = DEFAULT_ICON_PATH;

  /** Optional SafeHtml SVG override — renders instead of path-based icon */
  @Input() iconHtml: SafeHtml | null = null;

  /** Show color status dot (8×8, color from [color] variant) */
  @Input() showStatus = false;

  /** Show counter badge */
  @Input() showCounter = false;

  /** Counter value string (e.g. '10') */
  @Input() counter = '';

  /** Show chevron-down arrow */
  @Input() showArrow = false;

  @Output() clicked = new EventEmitter<void>();

  /** Resolved color tokens for the current [color] */
  get colorTokens(): ColorTokens {
    return COLOR_TOKENS[this.color];
  }

  readonly arrowPath = ARROW_PATH;
}
