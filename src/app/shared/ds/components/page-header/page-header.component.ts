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
    :host { display: block; }
    .page-header {
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-6) 0 var(--space-4);
    }
    .breadcrumb {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary);
    }
    .bc-item { color: var(--color-text-secondary); }
    .bc-sep { font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); }
    .page-title {
      margin: 0;
      font-size: var(--font-size-2xl, 20px);
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
