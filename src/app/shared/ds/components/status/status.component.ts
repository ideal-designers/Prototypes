import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusVariant =
  | 'active' | 'inactive' | 'pending' | 'draft'
  | 'success' | 'error' | 'warning' | 'info'
  | 'new' | 'in-progress' | 'done' | 'cancelled';

const STATUS_CONFIG: Record<StatusVariant, { label: string; color: string; bg: string; border: string }> = {
  active:      { label: 'Active',       color: '#2C9C74', bg: '#E8F5EE', border: '#A5D6B9' },
  done:        { label: 'Done',         color: '#2C9C74', bg: '#E8F5EE', border: '#A5D6B9' },
  success:     { label: 'Success',      color: '#2C9C74', bg: '#E8F5EE', border: '#A5D6B9' },
  inactive:    { label: 'Inactive',     color: '#5F616A', bg: '#F7F7F7', border: '#DEE0EB' },
  draft:       { label: 'Draft',        color: '#5F616A', bg: '#F7F7F7', border: '#DEE0EB' },
  cancelled:   { label: 'Cancelled',    color: '#5F616A', bg: '#F7F7F7', border: '#DEE0EB' },
  pending:     { label: 'Pending',      color: '#D1B200', bg: '#FFFAE0', border: '#FFE480' },
  warning:     { label: 'Warning',      color: '#D1B200', bg: '#FFFAE0', border: '#FFE480' },
  'in-progress': { label: 'In Progress', color: '#358CEB', bg: '#EBF4FD', border: '#BDD9F8' },
  info:        { label: 'Info',         color: '#358CEB', bg: '#EBF4FD', border: '#BDD9F8' },
  new:         { label: 'New',          color: '#358CEB', bg: '#EBF4FD', border: '#BDD9F8' },
  error:       { label: 'Error',        color: '#E54430', bg: '#FDF0EE', border: '#F5C4BC' },
};

/**
 * DS Statuses — Figma: liyNDiFf1piO8SQmHNKoeU, node 30725-10146
 *
 * DS specs:
 *   Height: 22px, padding: 0 8px
 *   Radius: full
 *   Dot: 6px circle left of label
 *   Font: 12px w600
 *
 * Usage:
 *   <fvdr-status variant="active" />
 *   <fvdr-status variant="pending" label="In Review" />
 */
@Component({
  selector: 'fvdr-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status" [style.color]="cfg.color" [style.background]="cfg.bg" [style.border-color]="cfg.border">
      <span class="status__dot" [style.background]="cfg.color"></span>
      {{ label || cfg.label }}
    </span>
  `,
  styles: [`
    .status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 22px;
      padding: 0 var(--space-2);
      border-radius: var(--radius-full);
      border: 1px solid;
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      white-space: nowrap;
    }
    .status__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `],
})
export class StatusComponent {
  @Input() variant: StatusVariant = 'active';
  @Input() label = '';

  get cfg() { return STATUS_CONFIG[this.variant] ?? STATUS_CONFIG.inactive; }
}
