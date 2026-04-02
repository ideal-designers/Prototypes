import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

// ─── CA Dashboard chip variants ──────────────────────────────────────────────
export type StatusVariant =
  // Project-specific statuses (Figma: 30267-13707)
  | 'pending' | 'preparation' | 'live' | 'locked' | 'closed' | 'archived' | 'on-hold' | 'frozen'
  // Legacy generic variants (kept for backwards compatibility)
  | 'active' | 'inactive' | 'draft' | 'success' | 'error' | 'warning' | 'info' | 'new' | 'in-progress' | 'done' | 'cancelled';

// ─── Project/External button variants ────────────────────────────────────────
export type StatusBtnVariant = 'preparation' | 'live' | 'locked' | 'archived';

interface StatusConfig {
  label: string;
  bg: string;
  icon: FvdrIconName;
}

interface StatusBtnConfig {
  label: string;
  bg: string;
  icon: FvdrIconName;
}

// ─── CA Dashboard chip config ─────────────────────────────────────────────────
// Figma: node 30267-13707 (Light) / 30267-13749 (Dark)
// Height: 28px · Padding: 6px 12px · Radius: 16px (pill) · Text: 14px regular #1F2129
const STATUS_CONFIG: Record<StatusVariant, StatusConfig> = {
  // Project statuses
  pending:      { label: 'Pending',     bg: '#fffbe5', icon: 'bell' },
  preparation:  { label: 'Preparation', bg: '#ebf4fd', icon: 'clock' },
  live:         { label: 'Live',        bg: '#ebf8ef', icon: 'finished' },
  locked:       { label: 'Locked',      bg: '#ececec', icon: 'lock-close' },
  closed:       { label: 'Closed',      bg: '#f7f7f7', icon: 'check' },
  archived:     { label: 'Archived',    bg: '#eceef9', icon: 'folder' },
  'on-hold':    { label: 'On hold',     bg: '#ffe7e3', icon: 'attention' },
  frozen:       { label: 'Frozen',      bg: '#f0f0ff', icon: 'info' },
  // Legacy aliases
  active:       { label: 'Active',      bg: '#ebf8ef', icon: 'finished' },
  done:         { label: 'Done',        bg: '#ebf8ef', icon: 'finished' },
  success:      { label: 'Success',     bg: '#ebf8ef', icon: 'finished' },
  inactive:     { label: 'Inactive',    bg: '#f7f7f7', icon: 'check' },
  draft:        { label: 'Draft',       bg: '#f7f7f7', icon: 'check' },
  cancelled:    { label: 'Cancelled',   bg: '#f7f7f7', icon: 'cancel' },
  'in-progress':{ label: 'In Progress', bg: '#ebf4fd', icon: 'clock' },
  info:         { label: 'Info',        bg: '#ebf4fd', icon: 'info' },
  new:          { label: 'New',         bg: '#ebf4fd', icon: 'clock' },
  error:        { label: 'Error',       bg: '#fdf0ee', icon: 'error' },
  warning:      { label: 'Warning',     bg: '#ffe7e3', icon: 'attention' },
};

// ─── Project/External status button config ────────────────────────────────────
// Figma: node 30267-13707 (Project / External column)
// Height: 32px · Padding: 6px 12px · Radius: 4px · White text · Chevron-down right
const STATUS_BTN_CONFIG: Record<StatusBtnVariant, StatusBtnConfig> = {
  preparation: { label: 'Preparation', bg: '#358CEB', icon: 'clock' },
  live:        { label: 'Live',        bg: '#2C9C74', icon: 'finished' },
  locked:      { label: 'Locked',      bg: '#535353', icon: 'lock-close' },
  archived:    { label: 'Archived',    bg: '#73757F', icon: 'folder' },
};

/**
 * DS Status — CA Dashboard pill chip
 * Figma: liyNDiFf1piO8SQmHNKoeU, node 30267-13707
 *
 * Height: 28px · Pill radius · Icon + label · Light bg · Dark text
 *
 * Usage:
 *   <fvdr-status variant="pending" />
 *   <fvdr-status variant="live" label="Active" />
 */
@Component({
  selector: 'fvdr-status',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span class="status-chip" [style.background]="cfg.bg">
      <fvdr-icon [name]="cfg.icon" class="status-chip__icon" />
      <span class="status-chip__label">{{ label || cfg.label }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      height: 28px;
      padding: 0 12px;
      border-radius: 16px;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: 400;
      color: var(--color-text-primary);
      white-space: nowrap;
      user-select: none;
    }

    .status-chip__icon {
      font-size: 14px;
      flex-shrink: 0;
      color: inherit;
      opacity: 0.65;
    }

    .status-chip__label {
      line-height: 20px;
    }
  `],
})
export class StatusComponent {
  @Input() variant: StatusVariant = 'active';
  @Input() label = '';

  get cfg(): StatusConfig { return STATUS_CONFIG[this.variant] ?? STATUS_CONFIG.inactive; }
}

/**
 * DS Status Button — Project/External interactive status selector
 * Figma: liyNDiFf1piO8SQmHNKoeU, node 30267-13728 / 13733 / 13738 / 13742
 *
 * Height: 32px · Radius 4px · Solid colored bg · White text · Icon + label + chevron-down
 * Emits (clicked) — use as dropdown/popover trigger
 *
 * Usage:
 *   <fvdr-status-btn variant="live" (clicked)="openStatusPicker()" />
 *   <fvdr-status-btn variant="preparation" [disabled]="true" />
 */
@Component({
  selector: 'fvdr-status-btn',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <button
      class="status-btn"
      [style.background]="cfg.bg"
      [disabled]="disabled || null"
      (click)="clicked.emit()"
    >
      <fvdr-icon [name]="cfg.icon" class="status-btn__icon" />
      <span class="status-btn__label">{{ label || cfg.label }}</span>
      <fvdr-icon name="chevron-down" class="status-btn__chevron" />
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    .status-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      height: 32px;
      padding: 0 12px;
      border: none;
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: 400;
      color: #ffffff;
      white-space: nowrap;
      cursor: pointer;
      transition: filter 0.15s;
      user-select: none;
    }
    .status-btn:hover:not(:disabled) { filter: brightness(1.1); }
    .status-btn:active:not(:disabled) { filter: brightness(0.92); }
    .status-btn:disabled { opacity: 0.45; cursor: default; }

    .status-btn__icon { font-size: 14px; flex-shrink: 0; }
    .status-btn__label { line-height: 20px; }
    .status-btn__chevron { font-size: 14px; flex-shrink: 0; opacity: 0.8; }
  `],
})
export class StatusButtonComponent {
  @Input() variant: StatusBtnVariant = 'live';
  @Input() label = '';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();

  get cfg(): StatusBtnConfig { return STATUS_BTN_CONFIG[this.variant] ?? STATUS_BTN_CONFIG.live; }
}
