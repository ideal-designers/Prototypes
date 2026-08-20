import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';

/**
 * Dashboard — replica of `.design/real-product-spec.md` section 2.1.
 *
 * Two stat cards (Activity is outlined and tinted), the date-range +
 * "Activity on" filter row, the Participants panel with its stacked bar and
 * four-item legend, then the Summary donut and the "Dynamics of" card with its
 * bar/line toggle over an empty chart.
 *
 * Charts are static inline SVG on purpose — no chart library, no data.
 */
@Component({
  selector: 'fvdr-vdr-dashboard',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Stat cards ──────────────────────────────────────────────────── -->
  <div class="stats">
    <!-- The live Activity card is the accent-outlined one — fvdr-card's [active]. -->
    <fvdr-card class="stat stat--accent" [active]="true">
      <div class="stat__body">
        <span class="label">Activity</span>
        <span class="metric">3</span>
        <span class="muted">sign-ins over the last two weeks</span>
      </div>
    </fvdr-card>
    <fvdr-card class="stat">
      <div class="stat__body">
        <span class="label">Documents</span>
        <span class="metric">0</span>
        <span class="muted">views in the last two weeks</span>
      </div>
    </fvdr-card>
  </div>

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <fvdr-filter-btn size="S" icon="calendar" label="Aug 14, 2026 – Aug 20, 2026" [clearable]="true"></fvdr-filter-btn>

    <span class="label">Activity on</span>
    <button type="button" class="inline-select">
      All groups
      <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
    </button>
  </div>

  <!-- ── Participants ────────────────────────────────────────────────── -->
  <fvdr-card title="Participants">
    <div class="row participants__count">
      <span class="participants__value">1</span>
      <span class="label">Participants</span>
      <fvdr-ghost-btn size="small" icon="link" tooltip="Open participants"></fvdr-ghost-btn>
    </div>

    <!--
      Stacked bar. Stays hand-rolled: fvdr-progress renders a single value, and
      this track is segmented by participant state (invited / signed in /
      engaged / deactivated).
    -->
    <div class="bar">
      <span class="bar__seg bar__seg--signed" style="width: 100%"></span>
    </div>

    <div class="legend">
      <span class="legend__item" *ngFor="let l of legend">
        <span class="legend__dot" [ngClass]="'legend__dot--' + l.tone"></span>
        <span class="legend__value">{{ l.value }}</span>
        <span class="label">{{ l.label }}</span>
      </span>
    </div>
  </fvdr-card>

  <!-- ── Summary + Dynamics ──────────────────────────────────────────── -->
  <div class="charts">

    <fvdr-card title="Summary" class="charts__summary">
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
          <circle cx="80" cy="80" r="62" fill="none" stroke-width="20" class="donut__track" />
          <text x="80" y="76" text-anchor="middle" class="donut__value">0%</text>
          <text x="80" y="96" text-anchor="middle" class="donut__caption">of actions</text>
        </svg>
      </div>
    </fvdr-card>

    <fvdr-card title="Dynamics of" class="charts__dynamics">
      <div card-header-actions class="row charts__head">
        <button type="button" class="inline-select">
          Activity
          <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
        </button>
        <span class="spacer"></span>
        <fvdr-ghost-btn size="small" icon="chart-bar" tooltip="Bar chart" [selected]="true"></fvdr-ghost-btn>
        <fvdr-ghost-btn size="small" icon="chart-line" tooltip="Line chart"></fvdr-ghost-btn>
      </div>

      <!-- Empty chart with real axis labels, as the live product shows it -->
      <svg class="chart" viewBox="0 0 1000 200" aria-hidden="true">
        <g class="chart__grid" stroke-width="1">
          <line x1="52" y1="20" x2="980" y2="20" />
          <line x1="52" y1="90" x2="980" y2="90" />
          <line x1="52" y1="160" x2="980" y2="160" />
        </g>
        <g class="chart__axis" text-anchor="end">
          <text x="42" y="24">1</text>
          <text x="42" y="94">0.5</text>
          <text x="42" y="164">0</text>
        </g>
        <g class="chart__axis" text-anchor="middle">
          <text *ngFor="let d of days; let i = index" [attr.x]="80 + i * 150" y="186">{{ d }}</text>
        </g>
      </svg>
    </fvdr-card>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    /* Stat cards */
    .stats { display: flex; gap: var(--space-4); }
    .stat { flex: 1; }
    .stat__body { display: flex; flex-direction: column; gap: var(--space-1); }
    /* fvdr-card's [active] paints the accent border. The live card is also
       tinted and the DS card has no tinted variant, so retint the surface token
       it paints itself with rather than layering a background behind it. */
    .stat--accent { --color-stone-0: var(--color-primary-50); }

    /* Participants */
    .participants__count { margin-bottom: var(--space-3); }
    .participants__value { font-size: var(--font-size-2xl, 20px); font-weight: 600; }

    .bar {
      display: flex;
      height: 8px;
      border-radius: var(--radius-full);
      overflow: hidden;
      background: var(--color-stone-300);
    }
    .bar__seg--signed { background: var(--color-primary-500); }

    .legend { display: flex; flex-wrap: wrap; gap: var(--space-6); margin-top: var(--space-3); }
    .legend__item { display: inline-flex; align-items: center; gap: var(--space-2); }
    .legend__value { font-weight: 600; }
    .legend__dot { width: 8px; height: 8px; border-radius: var(--radius-full); }
    .legend__dot--invited { background: var(--color-stone-500); }
    .legend__dot--signed { background: var(--color-primary-500); }
    .legend__dot--engaged { background: var(--color-info-500); }
    .legend__dot--off { background: var(--color-stone-400); }

    /* Charts row */
    .charts { display: flex; gap: var(--space-4); align-items: stretch; }
    .charts__summary { flex: 0 0 320px; }
    .charts__dynamics { flex: 1; min-width: 0; }
    /* Chart-type toggles sit on the right of the card header. */
    .charts__head { flex: 1; }

    .donut-wrap { display: flex; justify-content: center; }
    .donut__track { stroke: var(--color-stone-300); }
    .donut__value { fill: var(--color-text-primary); font-size: var(--font-size-4xl, 24px); font-weight: 600; }
    .donut__caption { fill: var(--color-text-secondary); font-size: var(--font-size-xs, 12px); }
  `],
})
export class VdrDashboardComponent {
  readonly legend: { value: number; label: string; tone: 'invited' | 'signed' | 'engaged' | 'off' }[] = [
    { value: 0, label: 'Invited', tone: 'invited' },
    { value: 1, label: 'Signed in', tone: 'signed' },
    { value: 0, label: 'Engaged', tone: 'engaged' },
    { value: 0, label: 'Deactivated', tone: 'off' },
  ];

  readonly days = ['Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20'];
}
