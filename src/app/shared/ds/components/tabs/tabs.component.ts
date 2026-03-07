import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  counter?: number;
  disabled?: boolean;
}

/**
 * DS Tabs — Figma: ↳ Tabs ✍🏻 (liyNDiFf1piO8SQmHNKoeU, page 15023:113850)
 * Component set: "Tabs - padding 24"
 *
 * DS specs:
 *   h = 48px
 *   padding-horizontal = 24px
 *   selected → bg #EBF8EF, border-bottom 2px #2C9C74, border-radius top 4px, text #1F2129
 *   unselected → border-bottom 2px #DEE0EB, text #5F616A
 *   text: UI/Base Component L → 16px w400 lh=24px
 *
 * Usage:
 *   <fvdr-tabs [tabs]="tabs" [(activeId)]="activeTab" (tabChange)="onTabChange($event)" />
 *
 *   tabs = [
 *     { id: 'overview', label: 'Overview' },
 *     { id: 'settings', label: 'Settings', counter: 3 },
 *     { id: 'archive', label: 'Archive', disabled: true },
 *   ];
 */
@Component({
  selector: 'fvdr-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs-bar" role="tablist">
      <button
        *ngFor="let tab of tabs"
        class="tab-item"
        role="tab"
        [class.active]="activeId === tab.id"
        [disabled]="tab.disabled"
        [attr.aria-selected]="activeId === tab.id"
        [attr.data-track]="'tab-' + tab.id"
        (click)="!tab.disabled && select(tab.id)"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span *ngIf="tab.counter != null" class="tab-counter">{{ tab.counter }}</span>
      </button>
    </div>
  `,
  styles: [`
    .tabs-bar {
      display: flex;
      border-bottom: 2px solid var(--color-stone-400);
    }

    /* DS: Tabs - padding 24, h=48px */
    .tab-item {
      height: var(--tab-height);    /* 48px */
      padding: 0 var(--space-6);   /* 24px horizontal */
      border: none;
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--text-base-l-size);   /* 16px */
      font-weight: var(--text-base-l-weight); /* 400 */
      line-height: var(--text-base-l-lh);
      color: var(--color-text-secondary);   /* #5F616A */
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      border-bottom: 2px solid transparent;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0; /* [4,4,0,0] */
      margin-bottom: -2px;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .tab-item:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* DS: Selection states=selected */
    .tab-item.active {
      background: var(--color-primary-50);        /* #EBF8EF */
      color: var(--color-text-primary);           /* #1F2129 */
      border-bottom-color: var(--color-primary-500); /* 2px #2C9C74 */
    }
    .tab-item:hover:not(.active):not(:disabled) {
      color: var(--color-text-primary);
      background: var(--color-stone-200);
    }

    .tab-counter {
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: var(--color-stone-300);
      color: var(--color-text-secondary);
      font-size: var(--text-caption2-size);  /* 12px w600 */
      font-weight: var(--text-caption2-weight);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tab-item.active .tab-counter {
      background: var(--color-primary-500);
      color: #fff;
    }
  `],
})
export class TabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeId = '';
  @Output() activeIdChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<string>();

  select(id: string): void {
    this.activeId = id;
    this.activeIdChange.emit(id);
    this.tabChange.emit(id);
  }
}
