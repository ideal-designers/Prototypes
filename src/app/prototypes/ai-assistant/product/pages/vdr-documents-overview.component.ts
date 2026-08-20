import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Reports › Documents overview — replica of `.design/real-product-spec.md`
 * section 2.9: period + "Overview on" filters with Export/Subscribe, then the
 * Documents tree, the 2x2 Summary grid and an empty viewing-time chart, with the
 * "No participant data found" empty state underneath.
 *
 * Chart is static inline SVG; the empty-state artwork is decorative inline SVG.
 */
@Component({
  selector: 'fvdr-vdr-documents-overview',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrEmptyStateComponent],
  template: `
<div class="page">

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <span class="label">Period</span>
    <span class="field">
      <span>Aug 14, 2026 – Aug 20, 2026</span>
      <button type="button" class="field__icon-btn" title="Clear"><fvdr-icon name="close"></fvdr-icon></button>
      <span class="field__icon"><fvdr-icon name="calendar"></fvdr-icon></span>
    </span>

    <span class="label">Overview on</span>
    <button type="button" class="inline-select">
      All participants
      <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
    </button>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <!-- ── Three panels ────────────────────────────────────────────────── -->
  <div class="ovw">

    <div class="panel ovw__docs">
      <div class="panel__head"><span class="panel__title">Documents</span></div>
      <div class="panel__body ovw__docs-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="ovw__tree">
          <button type="button" class="qa-row qa-row--selected">
            <fvdr-icon name="chevron-down" class="qa-row__icon"></fvdr-icon>
            <span class="proj-mark">T2</span>
            <span>test 2</span>
          </button>
          <button type="button" class="qa-row qa-row--child">
            <fvdr-icon name="chevron-right" class="qa-row__icon"></fvdr-icon>
            <span class="qa-row__icon"><fvdr-icon name="folder"></fvdr-icon></span>
            <span>1 Get to know VDR</span>
          </button>
        </div>
      </div>
    </div>

    <div class="panel ovw__summary">
      <div class="panel__head"><span class="panel__title">Summary</span></div>
      <div class="panel__body">
        <div class="metrics">
          <div class="metrics__cell" *ngFor="let m of metrics">
            <span class="metric">{{ m.value }}</span>
            <span class="label">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel ovw__chart">
      <div class="panel__head"><span class="panel__title">Dynamics of viewing time</span></div>
      <div class="panel__body">
        <svg class="chart" viewBox="0 0 640 200" aria-hidden="true">
          <g class="chart__grid" stroke-width="1">
            <line x1="52" y1="20" x2="620" y2="20" />
            <line x1="52" y1="90" x2="620" y2="90" />
            <line x1="52" y1="160" x2="620" y2="160" />
          </g>
          <g class="chart__axis" text-anchor="end">
            <text x="42" y="24">1m</text>
            <text x="42" y="94">0.5m</text>
            <text x="42" y="164">0m</text>
          </g>
          <g class="chart__axis" text-anchor="middle">
            <text *ngFor="let d of days; let i = index" [attr.x]="68 + i * 91" y="186">{{ d }}</text>
          </g>
        </svg>
      </div>
    </div>
  </div>

  <!-- ── No participant data ─────────────────────────────────────────── -->
  <fvdr-vdr-empty-state
    title="No participant data found"
    [subtitle]="['Participants who have viewed the document will display here']"
  >
    <svg class="art" width="150" height="110" viewBox="0 0 150 110" aria-hidden="true">
      <rect x="18" y="20" width="114" height="72" rx="8" class="art__shape" />
      <rect x="18" y="20" width="114" height="14" rx="8" class="art__shape2" />
      <rect x="32" y="48" width="16" height="30" rx="3" class="art__shape2" />
      <rect x="56" y="58" width="16" height="20" rx="3" class="art__shape2" />
      <rect x="80" y="40" width="16" height="38" rx="3" class="art__accent" />
      <rect x="104" y="62" width="16" height="16" rx="3" class="art__shape2" />
    </svg>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .ovw { display: flex; gap: var(--space-4); align-items: stretch; }
    .ovw__docs { flex: 0 0 325px; }
    .ovw__summary { flex: 0 0 340px; }
    .ovw__chart { flex: 1; min-width: 0; }

    .ovw__docs-body { display: flex; flex-direction: column; gap: var(--space-3); }
    .ovw__tree { margin: 0 calc(var(--space-4) * -1); }

    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .metrics__cell { display: flex; flex-direction: column; }
  `],
})
export class VdrDocumentsOverviewComponent {
  readonly metrics = [
    { value: '0m', label: 'Total viewing time' },
    { value: '0m', label: 'Average viewing time' },
    { value: '0', label: 'Total views' },
    { value: '0', label: 'Participants engaged' },
  ];

  readonly days = ['Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20'];
}
