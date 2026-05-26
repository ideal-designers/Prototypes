import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

@Component({
  selector: 'fvdr-page-header',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <header class="page-header">
      <nav class="breadcrumb" *ngIf="parentItems?.length">
        <ng-container *ngFor="let item of parentItems; let last = last">
          <span class="bc-item">{{ item }}</span>
          <fvdr-icon name="chevron-right" class="bc-sep"></fvdr-icon>
        </ng-container>
      </nav>
      <h1 class="page-title">{{ title }}</h1>
    </header>
  `,
  styles: [`
    :host { display: block; flex-shrink: 0; }
    .page-header {
      display: flex; flex-direction: column; gap: var(--space-1);
      padding: var(--space-4) var(--space-6) var(--space-4);
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
    }
    .breadcrumb {
      display: flex; align-items: center; gap: var(--space-1);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
      line-height: 1;
    }
    .bc-item { color: var(--color-text-secondary); }
    .bc-sep { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); }
    .page-title {
      margin: 0;
      font-size: var(--font-size-xl, 18px);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.4;
    }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() parentItems: string[] = [];
}
