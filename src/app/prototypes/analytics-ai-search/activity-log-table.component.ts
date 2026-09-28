import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { LogDay } from './analytics-ai-search.data';

/**
 * Activity log table — rows grouped by day. Figma: ↳ Reports › "Table - Report" (370:36901).
 * `highlight` marks rows whose author the AI answer pointed at.
 */
@Component({
  selector: 'fvdr-vdr-activity-log-table',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="log" role="table" aria-label="Activity log">
      <div class="tr tr--head" role="row">
        <span role="columnheader">Date and time</span><span role="columnheader">Author</span>
        <span role="columnheader">Action</span><span role="columnheader">Description</span><span></span>
      </div>
      <ng-container *ngFor="let d of days">
        <div class="day" role="row"><span role="cell">{{ d.day }}</span></div>
        <div class="tr" role="row" *ngFor="let r of d.rows; let i = index" [class.tr--alt]="i % 2 === 0"
             [class.tr--hit]="highlight && r.name === highlight">
          <span role="cell">{{ r.time }}</span>
          <span role="cell" class="author">
            <span class="author__ava">
              <fvdr-avatar size="md" [initials]="r.initials" color="var(--color-stone-300)" textColor="var(--color-text-primary)"></fvdr-avatar>
              <span class="author__role" [class.author__role--admin]="r.role === 'admin'" [title]="r.role === 'admin' ? 'Administrator' : 'User'">
                <fvdr-icon [name]="r.role === 'admin' ? 'user-check' : 'user'"></fvdr-icon>
              </span>
            </span>
            <span class="author__txt"><span>{{ r.name }}</span><small>{{ r.email }}</small></span>
          </span>
          <span role="cell">{{ r.action }}</span>
          <span role="cell" class="desc">
            <span class="desc__k">{{ r.detail }}</span>
            <ng-container *ngIf="r.filePath">&nbsp;<b>File path:</b>&nbsp;<span class="desc__k">{{ r.filePath }}</span></ng-container>
          </span>
          <span></span>
        </div>
      </ng-container>
      <p class="empty" *ngIf="!days.length">No activity matches these filters.</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); font-size: var(--font-size-base, 14px); }
    .log { display: flex; flex-direction: column; }
    .tr { display: grid; grid-template-columns: 128px 232px 186px minmax(200px, 1fr) 48px; align-items: center; min-height: 68px; }
    .tr > span { padding: 0 var(--space-4); min-width: 0; }
    .tr--head { min-height: 48px; background: var(--color-stone-200); font-weight: var(--font-weight-semi, 600); }
    .tr--alt { background: var(--color-stone-100); }
    .tr--hit { background: var(--color-primary-50); }
    .day { display: flex; align-items: center; min-height: 68px; padding: 0 var(--space-4);
      font-weight: var(--font-weight-semi, 600); color: var(--color-text-secondary); }
    .author { display: flex; align-items: center; gap: var(--space-2); }
    .author__ava { position: relative; flex: 0 0 auto; }
    .author__role { position: absolute; right: -4px; bottom: -4px; display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--color-stone-0); background: var(--chip-bg-indigo);
      color: var(--color-info-500); font-size: var(--font-size-3xs, 10px); box-sizing: border-box; }
    .author__role--admin { background: var(--chip-bg-magenta); color: var(--color-text-secondary); }
    .author__txt { display: flex; flex-direction: column; min-width: 0; }
    .author__txt span, .author__txt small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .author__txt small { font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .desc__k { color: var(--color-text-secondary); }
    .desc b { font-weight: var(--font-weight-semi, 600); }
    .empty { padding: var(--space-6) var(--space-4); color: var(--color-text-secondary); margin: 0; }
  `],
})
export class VdrActivityLogTableComponent {
  @Input() days: LogDay[] = [];
  @Input() highlight = '';
}
