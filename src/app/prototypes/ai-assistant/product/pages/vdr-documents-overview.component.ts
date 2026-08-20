import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TreeNode } from '../../../../shared/ds';
import { PROJECT_NODE_ID, projectTree } from '../data/project-tree';
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
    <fvdr-filter-btn size="S" icon="calendar" label="Aug 14, 2026 – Aug 20, 2026" [clearable]="true"></fvdr-filter-btn>

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

    <fvdr-card title="Documents" class="ovw__docs">
      <div class="ovw__docs-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="ovw__tree">
          <fvdr-tree [nodes]="tree" [selectedId]="selectedNode"></fvdr-tree>
        </div>
      </div>
    </fvdr-card>

    <fvdr-card title="Summary" class="ovw__summary">
      <div class="metrics">
        <div class="metrics__cell" *ngFor="let m of metrics">
          <span class="metric">{{ m.value }}</span>
          <span class="label">{{ m.label }}</span>
        </div>
      </div>
    </fvdr-card>

    <fvdr-card title="Dynamics of viewing time" class="ovw__chart">
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
    </fvdr-card>
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
    .ovw__docs { flex: 0 0 340px; }
    .ovw__summary { flex: 0 0 340px; }
    .ovw__chart { flex: 1; min-width: 0; }

    .ovw__docs-body { display: flex; flex-direction: column; gap: var(--space-3); }
    /* The tree rows run to the card's edges, as the product's pane does. */
    .ovw__tree { margin: 0 calc(var(--space-4) * -1); }

    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .metrics__cell { display: flex; flex-direction: column; }
  `],
})
export class VdrDocumentsOverviewComponent {
  /** Project tree — the same room the assistant answers from. */
  readonly tree: TreeNode[] = projectTree();
  readonly selectedNode = PROJECT_NODE_ID;

  readonly metrics = [
    { value: '0m', label: 'Total viewing time' },
    { value: '0m', label: 'Average viewing time' },
    { value: '0', label: 'Total views' },
    { value: '0', label: 'Participants engaged' },
  ];

  readonly days = ['Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20'];
}
