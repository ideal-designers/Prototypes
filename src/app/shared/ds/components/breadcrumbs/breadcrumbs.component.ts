import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import type { BreadcrumbItem } from '../header/header.component';

interface FlatBcItem {
  id: string;
  label: string;
  isMore: boolean;
  isLast: boolean;
}

/**
 * DS Breadcrumbs — Figma: liyNDiFf1piO8SQmHNKoeU, node 22780-6027
 *
 * Inline navigation trail. Shows all items when ≤ 4; collapses middle
 * items into "···" when there are more than 4.
 *
 * Usage:
 *   <fvdr-breadcrumbs
 *     [items]="breadcrumbs"
 *     (itemClick)="onBreadcrumb($event)"
 *   />
 */
@Component({
  selector: 'fvdr-breadcrumbs',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <nav class="bc" aria-label="Breadcrumb">
      <ng-container *ngFor="let item of visibleItems">

        <!-- ··· collapsed item -->
        <span *ngIf="item.isMore" class="bc-item bc-item--more" aria-hidden="true">
          <fvdr-icon name="more" class="bc-more-icon" />
          <fvdr-icon name="chevron-right" class="bc-sep" />
        </span>

        <!-- non-last clickable item -->
        <button
          *ngIf="!item.isMore && !item.isLast"
          class="bc-item bc-item--link"
          [title]="item.label"
          (click)="itemClick.emit(item.id)"
        >
          <span class="bc-label">{{ item.label }}</span>
          <fvdr-icon name="chevron-right" class="bc-sep" />
        </button>

        <!-- last (current) item -->
        <button
          *ngIf="!item.isMore && item.isLast"
          class="bc-item bc-item--current"
          (click)="itemClick.emit(item.id)"
        >
          <span class="bc-label">{{ item.label }}</span>
          <fvdr-icon name="chevron-down" class="bc-trail" />
        </button>

      </ng-container>
    </nav>
  `,
  styles: [`
    :host { display: inline-flex; }

    .bc {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    .bc-item {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-2) var(--space-2) 0;
      border: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      font-weight: 600;
      line-height: 1.5;
      white-space: nowrap;
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: color 0.15s;
    }

    .bc-item--link {
      color: var(--color-text-secondary);
    }
    .bc-item--link:hover {
      color: var(--color-text-primary);
    }

    .bc-item--current {
      color: var(--color-text-primary);
      cursor: default;
    }

    .bc-item--more {
      color: var(--color-text-secondary);
      cursor: default;
    }

    .bc-sep { font-size: 16px; color: var(--color-stone-500); flex-shrink: 0; }
    .bc-trail { font-size: 16px; color: var(--color-text-secondary); flex-shrink: 0; }
    .bc-more-icon { font-size: 16px; }
    .bc-label { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Output() itemClick = new EventEmitter<string>();

  get visibleItems(): FlatBcItem[] {
    const n = this.items.length;
    if (n === 0) return [];
    if (n <= 4) {
      return this.items.map((item, i) => ({
        ...item, isMore: false, isLast: i === n - 1,
      }));
    }
    // > 4: first 2, ···, last 2
    return [
      { ...this.items[0], isMore: false, isLast: false },
      { ...this.items[1], isMore: false, isLast: false },
      { id: '__more__', label: '', isMore: true, isLast: false },
      { ...this.items[n - 2], isMore: false, isLast: false },
      { ...this.items[n - 1], isMore: false, isLast: true },
    ];
  }
}
