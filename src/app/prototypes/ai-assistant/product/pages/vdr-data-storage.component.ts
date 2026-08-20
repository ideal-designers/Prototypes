import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName, RadioOption } from '../../../../shared/ds';
import {
  FOLDER_ROLLUPS,
  MOCK_DATA_ROOM,
  MOCK_PROJECT_MARK,
  PERMITTED_DOCUMENTS,
} from '../../data/mock-data';
import { MockDocType, folderDisplayName } from '../../models/mock-doc.model';

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

/** Report category per extension — the product groups the room's types this way. */
const CATEGORIES: { key: string; label: string; icon: FvdrIconName; types: MockDocType[] }[] = [
  { key: 'video',        label: 'Video',        icon: 'video',      types: ['mp4'] },
  { key: 'pdf',          label: 'PDF',          icon: 'perm-pdf',   types: ['pdf'] },
  { key: 'spreadsheets', label: 'Spreadsheets', icon: 'table-view', types: ['xls', 'xlsx'] },
  { key: 'images',       label: 'Images',       icon: 'image',      types: ['jpg'] },
  { key: 'documents',    label: 'Documents',    icon: 'documents',  types: ['docx', 'txt'] },
];

/** Donut radius and circumference — the dash geometry is derived from these. */
const DONUT_R = 62;
const DONUT_C = 2 * Math.PI * DONUT_R;

/** Line-chart geometry: one point per captured day, y axis 0 → axisMax. */
const CHART_ZERO_Y = 170;
const CHART_HEIGHT = 150;
const CHART_FIRST_X = 80;
const CHART_STEP_X = 150;

/**
 * Reports › Data storage — replica of `.design/real-product-spec.md` section
 * 4.7: the GB/MB unit radios, the Summary donut with its per-type legend, the
 * "Over the period" line chart, and the per-folder storage table.
 *
 * Both charts are static inline SVG (no chart library). The legend, the donut
 * segments and the per-folder table all aggregate the shared corpus in
 * `data/mock-data.ts`, so the numbers here match the documents the assistant
 * cites; the line stays flat at the room total with a marker per day. Every
 * control is inert.
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
    <fvdr-card title="Summary" class="storage__summary">
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
    </fvdr-card>

    <!-- ── Over the period: line chart + table ───────────────────────── -->
    <div class="storage__main">
      <fvdr-card title="Over the period">
        <button card-header-actions type="button" class="inline-select">
          All time
          <span class="inline-select__caret"><fvdr-icon name="chevron-down"></fvdr-icon></span>
        </button>
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
      </fvdr-card>

      <table class="dtable">
        <thead>
          <tr>
            <!-- Folder picker the product puts in the leading header cell -->
            <th class="dtable__th dtable__th--picker">
              <fvdr-ghost-btn size="small" icon="folder" tooltip="Choose folder"></fvdr-ghost-btn>
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
                <span class="proj-mark" *ngIf="r.project">{{ projectMark }}</span>
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
  `],
})
export class VdrDataStorageComponent {
  readonly radius = DONUT_R;
  readonly projectMark = MOCK_PROJECT_MARK;

  readonly unitOptions: RadioOption[] = [
    { value: 'gb', label: 'GB' },
    { value: 'mb', label: 'MB' },
  ];

  /**
   * Legend rows, largest first as the product orders them. Sizes are rounded to
   * the two decimals the MB unit shows, and the donut hole prints the sum of
   * those rounded rows so the total always equals what the legend adds up to.
   */
  readonly types: StorageType[] = CATEGORIES
    .map(c => {
      const docs = PERMITTED_DOCUMENTS.filter(d => c.types.includes(d.type));
      const mb = Number((docs.reduce((acc, d) => acc + d.sizeKb, 0) / 1024).toFixed(2));
      return {
        key: c.key,
        label: c.label,
        icon: c.icon,
        // The product writes "1 files" — keep its own phrasing.
        files: docs.length + ' files',
        size: mb.toFixed(2) + ' MB',
        value: mb,
      };
    })
    .filter(t => t.value > 0)
    .sort((a, b) => b.value - a.value);

  readonly totalMb = Number(this.types.reduce((acc, t) => acc + t.value, 0).toFixed(2));
  readonly total = this.totalMb.toFixed(2) + ' MB';

  /** Donut dash geometry, derived from the per-category sizes. */
  readonly segments: { key: string; dash: string; offset: number }[];

  /** y axis runs 0 → the next 4 MB step above the room total. */
  readonly axisMax = Math.max(4, Math.ceil(this.totalMb / 4) * 4);

  readonly gridLines = [4, 3, 2, 1, 0].map(quarter => ({
    y: CHART_ZERO_Y - (quarter / 4) * CHART_HEIGHT,
    label: (quarter * this.axisMax) / 4 + ' MB',
  }));

  readonly points = ['Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20'].map(
    (label, i) => ({
      label,
      x: CHART_FIRST_X + i * CHART_STEP_X,
      y: CHART_ZERO_Y - (this.totalMb / this.axisMax) * CHART_HEIGHT,
    }),
  );

  readonly linePoints = this.points.map(p => p.x + ',' + p.y).join(' ');

  /** Per-folder totals, then the project root — which holds no loose files. */
  readonly rows = [
    ...FOLDER_ROLLUPS.map(r => ({
      index: r.folder.index,
      name: folderDisplayName(r.folder.name),
      files: String(r.files),
      size: (r.sizeKb / 1024).toFixed(2) + ' MB',
      project: false,
    })),
    { index: '', name: MOCK_DATA_ROOM.name, files: '0', size: '< 0.01 MB', project: true },
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
