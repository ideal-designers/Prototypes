import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, DropdownOption } from '../../../../shared/ds';

/**
 * Reports › Activity log — replica of `.design/real-product-spec.md` section 2.8.
 *
 * The table is hand-rolled rather than fvdr-table: the product groups rows under
 * full-width date header rows (Today, Aug 18, 2026), which the DS table has no
 * concept of. Everything is inert.
 */
@Component({
  selector: 'fvdr-vdr-activity-log',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <div class="row">
    <span class="label">Report on</span>
    <button type="button" class="inline-select">
      All actions
      <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
    </button>
  </div>

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <span class="field">
      <span>Aug 14, 2026 – Aug 20, 2026</span>
      <button type="button" class="field__icon-btn" title="Clear"><fvdr-icon name="close"></fvdr-icon></button>
      <span class="field__icon"><fvdr-icon name="calendar"></fvdr-icon></span>
    </span>

    <div class="filter-select">
      <fvdr-dropdown [options]="actionOptions" placeholder="Action" size="s"></fvdr-dropdown>
    </div>
    <div class="filter-select">
      <fvdr-dropdown [options]="authorOptions" placeholder="Author" size="s"></fvdr-dropdown>
    </div>

    <button type="button" class="link">
      <fvdr-icon name="filter"></fvdr-icon>
      Clear all
    </button>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <!-- ── Log table with date group rows ──────────────────────────────── -->
  <div class="log">
    <table class="log__table">
      <thead>
        <tr>
          <th class="log__th" style="width: 150px">Date and time</th>
          <th class="log__th" style="width: 280px">Author</th>
          <th class="log__th" style="width: 220px">Action</th>
          <th class="log__th">Description</th>
          <th class="log__th log__th--tools">
            <button type="button" class="icon-btn" title="Customize columns">
              <fvdr-icon name="table-view"></fvdr-icon>
            </button>
          </th>
        </tr>
      </thead>

      <tbody *ngFor="let group of groups">
        <tr class="log__group">
          <td class="log__group-cell" colspan="5">{{ group.label }}</td>
        </tr>
        <tr class="log__row" *ngFor="let e of group.entries">
          <td class="log__td">{{ e.time }}</td>
          <td class="log__td">
            <span class="cell-name">
              <fvdr-avatar [initials]="e.initials" size="sm"></fvdr-avatar>
              <span class="cell-2l">
                <span>{{ e.author }}</span>
                <span class="cell-2l__sub">{{ e.email }}</span>
              </span>
            </span>
          </td>
          <td class="log__td">{{ e.action }}</td>
          <td class="log__td">
            <strong>{{ e.descKey }}:</strong> {{ e.descValue }}
          </td>
          <td class="log__td"></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .filter-select { width: 180px; }

    .log__table { width: 100%; border-collapse: collapse; }
    .log__th {
      height: 40px;
      padding: 0 var(--space-4);
      background: var(--color-stone-200);
      color: var(--color-text-primary);
      font-size: var(--font-size-base, 14px);
      font-weight: 600;
      text-align: left;
      white-space: nowrap;
    }
    .log__th:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
    .log__th:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .log__th--tools { width: 56px; text-align: right; padding-right: var(--space-2); }

    /* Full-width date group header row */
    .log__group-cell {
      padding: var(--space-3) var(--space-4);
      background: var(--color-stone-100);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm, 13px);
      font-weight: 600;
      border-bottom: 1px solid var(--color-divider);
    }

    .log__td {
      height: 56px;
      padding: var(--space-2) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      font-size: var(--font-size-base, 14px);
      vertical-align: middle;
    }
    .log__row:hover .log__td { background: var(--color-hover-bg); }
  `],
})
export class VdrActivityLogComponent {
  readonly actionOptions: DropdownOption[] = [
    { value: 'sign-in', label: 'Sign-in' },
    { value: 'settings', label: 'Settings changed' },
  ];

  readonly authorOptions: DropdownOption[] = [
    { value: 'ds', label: 'Dmytro Siniehin' },
  ];

  readonly groups = [
    {
      label: 'Today',
      entries: [
        {
          time: '12:33',
          initials: 'DS',
          author: 'Dmytro Siniehin',
          email: 'dmitriy.siniehin@idealscorp.com',
          action: 'Signed in',
          descKey: 'Session duration',
          descValue: 'Not finished',
        },
        {
          time: '12:31',
          initials: 'DS',
          author: 'Dmytro Siniehin',
          email: 'dmitriy.siniehin@idealscorp.com',
          action: 'Changed branding',
          descKey: 'Theme color',
          descValue: 'Ideals Corp → Red',
        },
      ],
    },
    {
      label: 'Aug 18, 2026',
      entries: [
        {
          time: '09:12',
          initials: 'DS',
          author: 'Dmytro Siniehin',
          email: 'dmitriy.siniehin@idealscorp.com',
          action: 'Changed project status',
          descKey: 'Project status',
          descValue: 'Preparation → Active',
        },
      ],
    },
  ];
}
