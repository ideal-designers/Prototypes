import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardState = 'default' | 'hover' | 'active';
export type CardSelector = 'none' | 'checkbox' | 'radio';

/**
 * DS Card — Figma: ↳ Cards ✅ (liyNDiFf1piO8SQmHNKoeU, page 15023:113847)
 * Component set: "Card"
 *
 * DS specs:
 *   default  → border 1px #DEE0EB, bg #FFFFFF, radius 4px, padding 16px
 *   hover    → border 1px #2C9C74
 *   active   → border 1px #2C9C74
 *   Title text: Label/Large → 16px w600 #1F2129
 *   Body text: UI/Base Component M → 15px w400 #5F616A
 *   Shadow: 0 1px 4px rgba(0,0,0,0.08)
 *
 * Usage:
 *   <fvdr-card title="Card title">
 *     <p>Card content goes here</p>
 *   </fvdr-card>
 *
 *   <fvdr-card title="Active card" [active]="true">...</fvdr-card>
 *   <fvdr-card [noPadding]="true">...</fvdr-card>
 */
@Component({
  selector: 'fvdr-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card"
      [class.card--active]="active"
      [class.card--no-padding]="noPadding"
      [class.card--hoverable]="hoverable"
    >
      <div *ngIf="title" class="card__header">
        <span class="card__title">{{ title }}</span>
        <span *ngIf="badge" class="card__badge">{{ badge }}</span>
        <ng-content select="[card-header-actions]"></ng-content>
      </div>
      <div class="card__body" [class.card__body--no-title]="!title">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    /* DS: State=default → border 1px var(--color-border), radius 4px */
    .card {
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);  /* var(--color-border) */
      border-radius: var(--radius-sm);            /* 4px */
      padding: var(--space-4);                    /* 16px */
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      box-shadow: var(--shadow-card);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    /* DS: State=hover-active → border 1px var(--color-interactive-primary) */
    .card--hoverable:hover {
      border-color: var(--color-primary-500);
      box-shadow: var(--shadow-card-hover);
    }
    .card--active {
      border-color: var(--color-primary-500);
    }
    .card--no-padding { padding: 0; }

    /* DS: Title → Label/Large 16px w600 var(--color-text-primary) */
    .card__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .card__title {
      font-size: var(--text-label-l-size);   /* 16px */
      font-weight: var(--text-label-l-weight); /* 600 */
      line-height: var(--text-label-l-lh);
      color: var(--color-text-primary);
      flex: 1;
    }
    /* DS: Badge 12px w600 var(--color-interactive-primary) */
    .card__badge {
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-primary-500);
      background: var(--color-primary-50);
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .card__body { font-size: var(--text-base-m-size); color: var(--color-text-secondary); }
    .card__body--no-title { }
  `],
})
export class CardComponent {
  @Input() title = '';
  @Input() badge = '';
  @Input() active = false;
  @Input() hoverable = false;
  @Input() noPadding = false;
}
