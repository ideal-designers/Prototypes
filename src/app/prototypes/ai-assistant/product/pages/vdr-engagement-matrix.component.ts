import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';

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
    <span class="field">
      <span>Aug 14, 2026 – Aug 20, 2026</span>
      <button type="button" class="field__icon-btn" title="Clear"><fvdr-icon name="close"></fvdr-icon></button>
      <span class="field__icon"><fvdr-icon name="calendar"></fvdr-icon></span>
    </span>

    <span class="label">Include deleted groups</span>
    <fvdr-toggle class="inert" [checked]="true"></fvdr-toggle>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <!-- ── Groups pane + matrix ────────────────────────────────────────── -->
  <div class="matrix">

    <div class="panel matrix__groups">
      <div class="panel__head">
        <span class="panel__title">Groups</span>
        <span class="spacer"></span>
        <button type="button" class="link">By documents</button>
      </div>
      <div class="panel__body matrix__groups-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="matrix__tree">
          <button type="button" class="qa-row">
            <fvdr-icon name="chevron-right" class="qa-row__icon"></fvdr-icon>
            <fvdr-checkbox class="inert"></fvdr-checkbox>
            <span class="qa-row__icon"><fvdr-icon name="group"></fvdr-icon></span>
            <span>Administrators</span>
          </button>
        </div>
      </div>
    </div>

    <div class="matrix__table">
      <table class="dtable">
        <thead>
          <tr>
            <!-- Folder picker the product puts in the leading header cell -->
            <th class="dtable__th dtable__th--picker">
              <button type="button" class="icon-btn" title="Choose folder">
                <fvdr-icon name="folder"></fvdr-icon>
                <fvdr-icon name="chevron-down" class="picker__caret"></fvdr-icon>
              </button>
            </th>
            <th class="dtable__th" *ngFor="let c of columns" [style.width]="c.width">{{ c.label }}</th>
            <th class="dtable__th dtable__th--tools">
              <button type="button" class="icon-btn" title="Customize columns">
                <fvdr-icon name="table-view"></fvdr-icon>
              </button>
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
    .matrix__groups { flex: 0 0 325px; }
    .matrix__table { flex: 1; min-width: 0; overflow-x: auto; }

    .matrix__groups-body { display: flex; flex-direction: column; gap: var(--space-3); }
    .matrix__tree { margin: 0 calc(var(--space-4) * -1); }

    .dtable__th--picker { width: 56px; }
    .dtable__th--picker .icon-btn { width: auto; gap: var(--space-1); }
    .picker__caret { font-size: var(--font-size-xs, 12px); }
  `],
})
export class VdrEngagementMatrixComponent {
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
