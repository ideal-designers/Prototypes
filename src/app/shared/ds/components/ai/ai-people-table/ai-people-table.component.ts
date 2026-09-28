import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../avatar/avatar.component';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { ButtonComponent } from '../../button/button.component';

export interface AiPersonRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  group: string;
  /** Pre-formatted, e.g. "Sep 20, 2026 · 07:20". */
  when: string;
}

/**
 * People table — who did something, from which group, and when. The AI answer block
 * for activity questions ("who downloaded…", "who signed in…").
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB) › "Table/Scroll" (190:18236), in context 496:61652.
 *
 * Anatomy: title + meta · bordered table (#, Name + email, Group, date column with sort
 * affordance) scrolling inside a fixed height · "Showing N of M" + link to the full report
 * · Share / Export list. The answer shows a slice; the report stays the source of truth.
 */
@Component({
  selector: 'fvdr-ai-people-table',
  standalone: true,
  imports: [CommonModule, AvatarComponent, FvdrIconComponent, ButtonComponent],
  template: `
    <section class="blk">
      <header class="blk__head" *ngIf="title">
        <h3 class="blk__title">{{ title }}</h3>
        <p class="blk__meta" *ngIf="meta.length">
          <ng-container *ngFor="let m of meta; let last = last">{{ m }}<span *ngIf="!last" class="blk__dot" aria-hidden="true"></span></ng-container>
        </p>
      </header>

      <div class="box">
        <div class="tbl" role="table" [attr.aria-label]="title" [style.max-height.px]="maxHeight">
          <div class="tr tr--head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">Name</span>
            <span role="columnheader">Group</span>
            <span role="columnheader" class="th-sort">{{ whenLabel }} <fvdr-icon name="sort"></fvdr-icon></span>
          </div>
          <div class="tr" role="row" *ngFor="let r of rows; let i = index">
            <span role="cell">{{ i + 1 }}</span>
            <span role="cell" class="person">
              <fvdr-avatar size="md" [initials]="r.initials" color="var(--color-stone-300)" textColor="var(--color-text-primary)"></fvdr-avatar>
              <span class="person__txt"><span class="person__name">{{ r.name }}</span><span class="person__mail">{{ r.email }}</span></span>
            </span>
            <span role="cell">{{ r.group }}</span>
            <span role="cell">{{ r.when }}</span>
          </div>
        </div>

        <div class="foot">
          <span class="foot__count">Showing {{ rows.length }} of {{ total ?? rows.length }} {{ noun }}</span>
          <button *ngIf="reportLinkLabel" type="button" class="foot__link" (click)="reportRequested.emit()">{{ reportLinkLabel }}</button>
          <span class="foot__spacer"></span>
          <fvdr-btn label="Share" variant="secondary" size="m" (clicked)="shared.emit()"></fvdr-btn>
          <fvdr-btn label="Export list" variant="secondary" size="m" (clicked)="exported.emit()"></fvdr-btn>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); }
    .blk { display: flex; flex-direction: column; gap: var(--space-2); }
    .blk__head { display: flex; flex-direction: column; gap: 2px; }
    .blk__title { margin: 0; font-size: var(--font-size-base, 14px); line-height: 20px; font-weight: var(--font-weight-semi, 600); }
    .blk__meta { display: flex; align-items: center; gap: var(--space-2); margin: 0;
      font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .blk__dot { display: inline-block; width: 2px; height: 2px; margin-left: var(--space-2); border-radius: 50%;
      background: var(--color-text-secondary); vertical-align: middle; }

    .box { max-width: 660px; border: 1px solid var(--color-stone-300); border-radius: var(--radius-sm); overflow: hidden; }
    .tbl { overflow-y: auto; }
    .tr { display: grid; grid-template-columns: 40px minmax(160px, 1.2fr) minmax(100px, 1fr) minmax(160px, 1fr);
      align-items: center; min-height: 56px; padding: 0 var(--space-4); column-gap: var(--space-4);
      font-size: var(--font-size-base, 14px); line-height: 20px; }
    .tr:nth-child(odd):not(.tr--head) { background: var(--color-stone-100); }
    .tr--head { position: sticky; top: 0; z-index: 1; min-height: 48px; background: var(--color-stone-200); font-weight: var(--font-weight-semi, 600); }
    .th-sort { display: inline-flex; align-items: center; gap: var(--space-2); }
    .th-sort fvdr-icon { color: var(--color-text-secondary); font-size: var(--font-size-base, 14px); }
    .person { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .person__txt { display: flex; flex-direction: column; min-width: 0; }
    .person__name, .person__mail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .person__mail { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }

    .foot { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--color-stone-300); }
    .foot__count { font-size: var(--text-caption1-size, 12px); line-height: 16px; }
    .foot__link { padding: 0; border: none; background: transparent; cursor: pointer; font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px); color: var(--color-primary-500); }
    .foot__link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .foot__spacer { flex: 1; }
  `],
})
export class AiPeopleTableComponent {
  @Input() title = '';
  @Input() meta: string[] = [];
  @Input() rows: AiPersonRow[] = [];
  /** Total in the source report when `rows` is a slice. */
  @Input() total?: number;
  /** Plural noun for the footer count — "downloads", "sign-ins". */
  @Input() noun = 'rows';
  /** Header of the date column. */
  @Input() whenLabel = 'Date';
  /** Link to the full report. Empty hides it. */
  @Input() reportLinkLabel = 'View activity log';
  /** Scroll height of the table body, px. */
  @Input() maxHeight = 272;

  @Output() shared = new EventEmitter<void>();
  @Output() exported = new EventEmitter<void>();
  @Output() reportRequested = new EventEmitter<void>();
}
