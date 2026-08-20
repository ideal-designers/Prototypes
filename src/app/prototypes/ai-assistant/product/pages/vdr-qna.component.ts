import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TableColumn } from '../../../../shared/ds';

/**
 * Q&A › Setup — replica of `.design/real-product-spec.md` section 2.7.
 *
 * Worth replicating exactly: it is the product's established pattern for
 * introducing a new capability — a "Welcome to ..." overlay on top of
 * live-looking content, with the rows fading out underneath.
 *
 * Everything is inert. The three onboarding illustrations are decorative inline
 * SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-qna',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page page--flush qna">

  <!-- ── Behind the overlay: the real Q&A list ─────────────────────────── -->
  <div class="two-pane qna__behind">
    <aside class="two-pane__side">
      <div class="qa-panel__head"><span class="qa-panel__title">Quick access</span></div>
      <button
        type="button"
        class="qa-row"
        *ngFor="let s of shortcuts; let first = first"
        [class.qa-row--selected]="first"
      >
        <span>{{ s.label }}</span>
        <span class="qa-row__count">{{ s.count }}</span>
      </button>
    </aside>

    <section class="two-pane__main">
      <div class="table-wrap">
        <fvdr-table [columns]="columns" [data]="rows">
          <ng-template fvdrCell="status" let-value let-row="row">
            <fvdr-chip [label]="value" [variant]="row.statusTone" size="s"></fvdr-chip>
          </ng-template>

          <ng-template fvdrCell="author" let-value let-row="row">
            <span class="cell-name">
              <fvdr-avatar [initials]="row.authorInitials" size="sm"></fvdr-avatar>
              <span>{{ value }}</span>
            </span>
          </ng-template>

          <ng-template fvdrCell="priority" let-value let-row="row">
            <span class="prio" [ngClass]="'prio--' + row.priorityTone">
              <fvdr-icon [name]="row.priorityIcon"></fvdr-icon>
              <span>{{ value }}</span>
            </span>
          </ng-template>

          <ng-template fvdrCell="category" let-value>
            <fvdr-chip [label]="value" variant="blue" size="s"></fvdr-chip>
          </ng-template>
        </fvdr-table>

        <button type="button" class="icon-btn table-wrap__cols" title="Customize columns">
          <fvdr-icon name="table-view"></fvdr-icon>
        </button>
      </div>
    </section>
  </div>

  <!-- Rows dissolve into the page under the overlay -->
  <div class="qna__fade"></div>

  <!-- ── Onboarding overlay ────────────────────────────────────────────── -->
  <div class="qna__overlay">
    <div class="panel welcome">
      <h2 class="welcome__title">Welcome to Q&amp;A</h2>
      <p class="welcome__sub">A single place to coordinate questions, answers, and ownership across teams</p>

      <div class="steps welcome__steps">
        <div class="steps__item">
          <svg class="art" width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
            <rect x="10" y="12" width="64" height="40" rx="6" class="art__shape" />
            <path d="M26 52L26 64L40 52H26Z" class="art__shape" />
            <rect x="46" y="30" width="64" height="38" rx="6" class="art__accent" />
            <rect x="56" y="42" width="44" height="4" rx="2" class="art__on-accent" />
            <rect x="56" y="52" width="30" height="4" rx="2" class="art__on-accent" />
          </svg>
          <span class="steps__num">1</span>
          <span class="steps__label">Structured communication</span>
          <span class="steps__text">Threads keep every question with its answer</span>
        </div>

        <div class="steps__item">
          <svg class="art" width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
            <circle cx="60" cy="40" r="28" class="art__shape" />
            <path d="M60 22V40L74 48" class="art__hand" stroke-width="3" stroke-linecap="round" fill="none" />
            <circle cx="96" cy="20" r="12" class="art__accent" />
            <path d="M90 20L94.5 24.5L102 16" class="art__on-accent-line" stroke-width="2.4" stroke-linecap="round" fill="none" />
          </svg>
          <span class="steps__num">2</span>
          <span class="steps__label">Faster responses</span>
          <span class="steps__text">Assign owners and track due dates</span>
        </div>

        <div class="steps__item">
          <svg class="art" width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
            <path d="M60 8L92 20V42C92 58 78 70 60 74C42 70 28 58 28 42V20L60 8Z" class="art__shape" />
            <rect x="48" y="36" width="24" height="20" rx="3" class="art__accent" />
            <path d="M53 36V31C53 27 56 24 60 24C64 24 67 27 67 31V36" class="art__accent-line" stroke-width="3" fill="none" />
          </svg>
          <span class="steps__num">3</span>
          <span class="steps__label">Secure access</span>
          <span class="steps__text">Group permissions decide who sees what</span>
        </div>
      </div>

      <div class="welcome__actions">
        <fvdr-btn size="m" variant="primary" label="Set up Q&amp;A"></fvdr-btn>
        <button type="button" class="link">
          Learn more
          <fvdr-icon name="link"></fvdr-icon>
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; height: 100%; }

    .qna { position: relative; height: 100%; overflow: hidden; }
    .qna__behind { min-height: 0; height: 100%; }

    /* The captured page fades its lower rows out behind the overlay */
    .qna__fade {
      position: absolute; left: 0; right: 0; top: 140px; bottom: 0;
      background: linear-gradient(to bottom, transparent 0, var(--color-stone-0) 50px);
      pointer-events: none;
    }

    .qna__overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-6);
    }

    .welcome {
      width: 760px;
      max-width: 100%;
      padding: var(--space-8);
      text-align: center;
      box-shadow: var(--shadow-popover);
      background: var(--color-stone-0);
    }
    .welcome__title { margin: 0; font-size: var(--font-size-4xl, 24px); font-weight: 700; }
    .welcome__sub {
      margin: var(--space-2) 0 0;
      font-size: var(--font-size-md, 15px);
      color: var(--color-text-secondary);
    }
    .welcome__steps { margin-top: var(--space-6); gap: var(--space-4); }
    .welcome__actions {
      display: flex; align-items: center; justify-content: center; gap: var(--space-4);
      margin-top: var(--space-6);
    }

    .art__hand { stroke: var(--color-stone-500); }
    .art__on-accent-line { stroke: var(--color-text-inverse, #ffffff); }

    /* Priority cell */
    .prio { display: inline-flex; align-items: center; gap: var(--space-1); }
    .prio--high { color: var(--color-error-600); }
    .prio--mid { color: var(--color-text-secondary); }
    .prio--low { color: var(--color-info-500); }
  `],
})
export class VdrQnaComponent {
  readonly shortcuts = [
    { label: 'All', count: 20 },
    { label: 'Action required', count: 2 },
    { label: 'Assigned', count: 6 },
    { label: 'Unanswered', count: 10 },
  ];

  readonly columns: TableColumn[] = [
    { key: 'num', label: '#', width: '80px' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'author', label: 'Author', width: '190px' },
    { key: 'priority', label: 'Priority', width: '130px' },
    { key: 'category', label: 'Category', width: '150px' },
  ];

  readonly rows = [
    {
      num: 'B100',
      subject: 'When was the last environmental audit completed?',
      status: 'Answered', statusTone: 'green',
      author: 'Jane Doe', authorInitials: 'JD',
      priority: 'High', priorityTone: 'high', priorityIcon: 'trending-up',
      category: 'Environmental',
    },
    {
      num: 'B101',
      subject: 'Provide the 2025 revenue breakdown by region',
      status: 'Assigned', statusTone: 'yellow',
      author: 'Adam Miller', authorInitials: 'AM',
      priority: 'Medium', priorityTone: 'mid', priorityIcon: 'trending-up',
      category: 'Financial',
    },
    {
      num: 'B102',
      subject: 'Confirm the status of pending litigation',
      status: 'Rejected', statusTone: 'grey',
      author: 'Lena Schmidt', authorInitials: 'LS',
      priority: 'Low', priorityTone: 'low', priorityIcon: 'trending-down',
      category: 'Legal',
    },
  ];
}
