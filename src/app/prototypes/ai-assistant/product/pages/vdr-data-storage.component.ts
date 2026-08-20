import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName, RadioOption } from '../../../../shared/ds';

/** One row of the Summary legend, which also drives a donut segment. */
interface StorageType {
  key: string;
  label: string;
  icon: FvdrIconName;
  files: string;
  size: string;
  /** MB, used for the donut geometry. */
  value: number;
}

/** Donut radius and circumference — the dash geometry is derived from these. */
const DONUT_R = 62;
const DONUT_C = 2 * Math.PI * DONUT_R;

/** Line-chart geometry: 0–4 MB over the y axis, one point per captured day. */
const CHART_ZERO_Y = 170;
const CHART_MB_STEP = 37.5;
const CHART_FIRST_X = 80;
const CHART_STEP_X = 150;
/** Flat series: the project has held 3.52 MB across the whole period. */
const CHART_VALUE = 3.52;

/**
 * Reports › Data storage — replica of `.design/real-product-spec.md` section
 * 4.7: the GB/MB unit radios, the Summary donut with its per-type legend, the
 * "Over the period" line chart, and the per-folder storage table.
 *
 * Both charts are static inline SVG (no chart library): the donut segments are
 * derived from the legend's captured sizes, and the line is flat at 3.52 MB with
 * a marker per day. Every control is inert.
 */
@Component({
  selector: 'fvdr-vdr-data-storage',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <span class="label">Unit:</span>
    <fvdr-radio class="inert" [options]="unitOptions" value="mb" layout="horizontal"></fvdr-radio>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <div class="storage">

    <!-- ── Summary: donut + legend ───────────────────────────────────── -->
    <div class="panel storage__summary">
      <div class="panel__head"><span class="panel__title">Summary</span></div>
      <div class="panel__body">
        <div class="donut-wrap">
          <svg class="donut" viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
            <circle cx="80" cy="80" [attr.r]="radius" fill="none" stroke-width="20" class="donut__track" />
            <g transform="rotate(-90 80 80)">
              <circle
                *ngFor="let s of segments"
                cx="80"
                cy="80"
                [attr.r]="radius"
                fill="none"
                stroke-width="20"
                class="donut__seg"
                [ngClass]="'donut__seg--' + s.key"
                [attr.stroke-dasharray]="s.dash"
                [attr.stroke-dashoffset]="s.offset"
              />
            </g>
            <text x="80" y="76" text-anchor="middle" class="donut__value">{{ total }}</text>
            <text x="80" y="96" text-anchor="middle" class="donut__caption">Total</text>
          </svg>
        </div>

        <div class="legend">
          <div class="legend__row" *ngFor="let t of types">
            <span class="legend__dot" [ngClass]="'legend__dot--' + t.key"></span>
            <span class="legend__icon"><fvdr-icon [name]="t.icon"></fvdr-icon></span>
            <span class="legend__label">{{ t.label }}</span>
            <span class="muted legend__files">{{ t.files }}</span>
            <span class="legend__size">{{ t.size }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Over the period: line chart + table ───────────────────────── -->
    <div class="storage__main">
      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Over the period</span>
          <button type="button" class="inline-select">
            All time
            <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
          </button>
        </div>
        <div class="panel__body">
          <svg class="chart" viewBox="0 0 1000 200" aria-hidden="true">
            <g class="chart__grid" stroke-width="1">
              <line *ngFor="let g of gridLines" x1="52" [attr.y1]="g.y" x2="980" [attr.y2]="g.y" />
            </g>
            <g class="chart__axis" text-anchor="end">
              <text *ngFor="let g of gridLines" x="42" [attr.y]="g.y + 4">{{ g.label }}</text>
            </g>

            <!-- Flat series with a marker per day -->
            <polyline class="chart__line" [attr.points]="linePoints" />
            <circle *ngFor="let p of points" [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" class="chart__point" />

            <g class="chart__axis" text-anchor="middle">
              <text *ngFor="let p of points" [attr.x]="p.x" y="186">{{ p.label }}</text>
            </g>
          </svg>
        </div>
      </div>

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
            <th class="dtable__th" style="width: 80px">Index</th>
            <th class="dtable__th">Name</th>
            <th class="dtable__th" style="width: 110px"># Files</th>
            <th class="dtable__th" style="width: 130px">Size</th>
          </tr>
        </thead>
        <tbody>
          <tr class="dtable__row" *ngFor="let r of rows">
            <td class="dtable__td"></td>
            <td class="dtable__td">{{ r.index }}</td>
            <td class="dtable__td">
              <span class="cell-name">
                <span class="cell-icon" *ngIf="!r.project"><fvdr-icon name="folder"></fvdr-icon></span>
                <span class="proj-mark" *ngIf="r.project">T2</span>
                <span>{{ r.name }}</span>
              </span>
            </td>
            <td class="dtable__td">{{ r.files }}</td>
            <td class="dtable__td">{{ r.size }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .storage { display: flex; gap: var(--space-4); align-items: flex-start; }
    .storage__summary { flex: 0 0 360px; }
    .storage__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-4); }

    /* Donut */
    .donut-wrap { display: flex; justify-content: center; }
    .donut__track { stroke: var(--color-stone-300); }
    .donut__value { fill: var(--color-text-primary); font-size: var(--font-size-2xl, 20px); font-weight: 600; }
    .donut__caption { fill: var(--color-text-secondary); font-size: var(--font-size-xs, 12px); }

    .donut__seg--video        { stroke: var(--color-primary-500); }
    .donut__seg--pdf          { stroke: var(--color-error-600); }
    .donut__seg--spreadsheets { stroke: var(--color-info-500); }
    .donut__seg--images       { stroke: var(--color-warning-600); }
    .donut__seg--documents    { stroke: var(--color-stone-600); }

    /* Legend: name + file count left, size right-aligned */
    .legend { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-4); }
    .legend__row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-base, 14px); }
    .legend__dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex: none; }
    .legend__icon { display: inline-flex; color: var(--color-stone-600); font-size: var(--font-size-base, 14px); }
    .legend__label { color: var(--color-text-primary); }
    .legend__files { margin-left: var(--space-1); }
    .legend__size { margin-left: auto; color: var(--color-text-primary); }

    .legend__dot--video        { background: var(--color-primary-500); }
    .legend__dot--pdf          { background: var(--color-error-600); }
    .legend__dot--spreadsheets { background: var(--color-info-500); }
    .legend__dot--images       { background: var(--color-warning-600); }
    .legend__dot--documents    { background: var(--color-stone-600); }

    /* Line chart */
    .chart__line { fill: none; stroke: var(--color-primary-500); stroke-width: 2; }
    .chart__point { fill: var(--color-primary-500); }

    .dtable__th--picker { width: 56px; }
    .dtable__th--picker .icon-btn { width: auto; gap: var(--space-1); }
    .picker__caret { font-size: var(--font-size-xs, 12px); }
  `],
})
export class VdrDataStorageComponent {
  readonly radius = DONUT_R;
  readonly total = '3.52 MB';

  readonly unitOptions: RadioOption[] = [
    { value: 'gb', label: 'GB' },
    { value: 'mb', label: 'MB' },
  ];

  readonly types: StorageType[] = [
    { key: 'video',        label: 'Video',        icon: 'video',      files: '1 files', size: '2.85 MB', value: 2.85 },
    { key: 'pdf',          label: 'PDF',          icon: 'perm-pdf',   files: '1 files', size: '0.46 MB', value: 0.46 },
    { key: 'spreadsheets', label: 'Spreadsheets', icon: 'table-view', files: '2 files', size: '0.08 MB', value: 0.08 },
    { key: 'images',       label: 'Images',       icon: 'image',      files: '1 files', size: '0.07 MB', value: 0.07 },
    { key: 'documents',    label: 'Documents',    icon: 'documents',  files: '2 files', size: '0.05 MB', value: 0.05 },
  ];

  /** Donut dash geometry, derived from the captured per-type sizes. */
  readonly segments: { key: string; dash: string; offset: number }[];

  readonly gridLines = [4, 3, 2, 1, 0].map(mb => ({
    y: CHART_ZERO_Y - mb * CHART_MB_STEP,
    label: mb + ' MB',
  }));

  readonly points = ['Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20'].map(
    (label, i) => ({
      label,
      x: CHART_FIRST_X + i * CHART_STEP_X,
      y: CHART_ZERO_Y - CHART_VALUE * CHART_MB_STEP,
    }),
  );

  readonly linePoints = this.points.map(p => p.x + ',' + p.y).join(' ');

  readonly rows = [
    { index: '1', name: 'Get to know VDR', files: '7', size: '3.52 MB', project: false },
    { index: '', name: 'test 2', files: '0', size: '< 0.01 MB', project: true },
  ];

  constructor() {
    const sum = this.types.reduce((acc, t) => acc + t.value, 0);
    let start = 0;
    this.segments = this.types.map(t => {
      const len = (t.value / sum) * DONUT_C;
      const seg = { key: t.key, dash: len.toFixed(2) + ' ' + (DONUT_C - len).toFixed(2), offset: -start };
      start += len;
      return seg;
    });
  }
}
