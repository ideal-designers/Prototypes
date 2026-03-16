import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CounterVariant = 'default' | 'primary' | 'error' | 'warning';
export type CounterSize = 's' | 'm';

/**
 * DS Counters — Figma: liyNDiFf1piO8SQmHNKoeU, node 35020-79605
 *
 * DS specs:
 *   Size S: 16px height, 12px font
 *   Size M: 20px height, 12px font
 *   Min-width = height (circle for single digit)
 *   Radius: full
 *   Variants: default (stone), primary (green), error (red), warning (yellow)
 *   Max display: 99+
 *
 * Usage:
 *   <fvdr-counter [value]="5" />
 *   <fvdr-counter [value]="120" variant="error" />
 *   <fvdr-counter [value]="3" size="m" variant="primary" />
 */
@Component({
  selector: 'fvdr-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="counter counter--{{ variant }} counter--{{ size }}">{{ display }}</span>
  `,
  styles: [`
    .counter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      line-height: 1;
      padding: 0 4px;
      min-width: var(--counter-size);
      height: var(--counter-size);
      white-space: nowrap;
    }

    .counter--s { --counter-size: 16px; }
    .counter--m { --counter-size: 20px; }

    .counter--default  { background: var(--color-stone-300); color: var(--color-text-secondary); }
    .counter--primary  { background: var(--color-primary-500); color: #fff; }
    .counter--error    { background: var(--color-error-600); color: #fff; }
    .counter--warning  { background: var(--color-warning-500); color: var(--color-text-primary); }
  `],
})
export class CounterComponent {
  @Input() value = 0;
  @Input() variant: CounterVariant = 'default';
  @Input() size: CounterSize = 's';
  @Input() max = 99;

  get display(): string {
    return this.value > this.max ? `${this.max}+` : String(this.value);
  }
}
