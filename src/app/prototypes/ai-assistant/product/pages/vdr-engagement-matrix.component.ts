import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TreeNode } from '../../../../shared/ds';

/**
 * Reports › Engagement matrix — replica of `.design/real-product-spec.md`
 * section 4.6: period + "Include deleted groups" toggle with Export/Subscribe,
 * the Groups pane with its "By documents" pivot link, and the matrix table with
 * a leading folder-picker header cell and no rows.
 *
 * The toggle renders on but is inert (`.inert` in vdr-page.css), like every
 * other control on the replica.
 */
@Component({
  selector: 'fvdr-vdr-engagement-matrix',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <span class="label">Period</span>
    <fvdr-filter-btn size="S" icon="calendar" label="Aug 14, 2026 – Aug 20, 2026" [clearable]="true"></fvdr-filter-btn>

    <span class="label">Include deleted groups</span>
    <fvdr-toggle class="inert" [checked]="true"></fvdr-toggle>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <!-- ── Groups pane + matrix ────────────────────────────────────────── -->
  <div class="matrix">

    <fvdr-card title="Groups" class="matrix__groups">
      <fvdr-btn card-header-actions variant="text" size="s" label="By documents"></fvdr-btn>
      <div class="matrix__groups-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="matrix__tree">
          <fvdr-tree class="inert" [nodes]="groups" [checkboxes]="true"></fvdr-tree>
        </div>
      </div>
    </fvdr-card>

    <div class="matrix__table">
      <table class="dtable">
        <thead>
          <tr>
            <!-- Folder picker the product puts in the leading header cell -->
            <th class="dtable__th dtable__th--picker">
              <fvdr-ghost-btn size="small" icon="folder" tooltip="Choose folder"></fvdr-ghost-btn>
            </th>
            <th class="dtable__th" *ngFor="let c of columns" [style.width]="c.width">{{ c.label }}</th>
            <th class="dtable__th dtable__th--tools">
              <fvdr-ghost-btn size="small" icon="table-view" tooltip="Customize columns"></fvdr-ghost-btn>
            </th>
          </tr>
        </thead>
        <!-- Captured with no rows: nothing is selected in the Groups pane. -->
      </table>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .matrix { display: flex; gap: var(--space-4); align-items: flex-start; }
    .matrix__groups { flex: 0 0 340px; }
    .matrix__table { flex: 1; min-width: 0; overflow-x: auto; }

    .matrix__groups-body { display: flex; flex-direction: column; gap: var(--space-3); }
    /* The tree rows run to the card's edges, as the product's pane does. */
    .matrix__tree { margin: 0 calc(var(--space-4) * -1); }

    .dtable__th--picker { width: 56px; }
  `],
})
export class VdrEngagementMatrixComponent {
  /** Group tree — one row, as captured; nothing is selected, so the matrix is empty. */
  readonly groups: TreeNode[] = [
    { id: 'administrators', label: 'Administrators', icon: 'group' },
  ];

  readonly columns = [
    { label: 'Index', width: '80px' },
    { label: 'Name', width: '' },
    { label: 'Files', width: '90px' },
    { label: '% engaged', width: '120px' },
    { label: 'Total', width: '90px' },
    { label: 'Views', width: '90px' },
    { label: 'Downloads', width: '120px' },
  ];
}
