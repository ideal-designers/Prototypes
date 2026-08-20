import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TableColumn } from '../../../../shared/ds';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';

/**
 * Documents › All — replica of `.design/real-product-spec.md` section 2.2, the
 * page the assistant will most often be opened on top of.
 *
 * Two panes: the 325px Quick access panel (its own close + collapse controls,
 * three shortcut rows, then the project tree) and the document table with the
 * Customize columns affordance. Static content, inert controls.
 */
@Component({
  selector: 'fvdr-vdr-documents',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrActionBarComponent],
  template: `
<div class="page page--flush docs">

  <div class="docs__bar">
    <fvdr-vdr-action-bar
      [primary]="primary"
      [secondaries]="secondaries"
      searchPlaceholder="Search in documents"
    ></fvdr-vdr-action-bar>
  </div>

  <div class="two-pane">

    <!-- ── Quick access ────────────────────────────────────────────────── -->
    <aside class="two-pane__side">
      <div class="qa-panel__head">
        <span class="qa-panel__title">Quick access</span>
        <button type="button" class="icon-btn" title="Close"><fvdr-icon name="close"></fvdr-icon></button>
        <button type="button" class="icon-btn" title="Collapse"><fvdr-icon name="angle-double-left"></fvdr-icon></button>
      </div>

      <button type="button" class="qa-row" *ngFor="let s of shortcuts">
        <span class="qa-row__icon"><fvdr-icon [name]="s.icon"></fvdr-icon></span>
        <span>{{ s.label }}</span>
      </button>

      <hr class="divider" />

      <!-- Project tree: selected project row + one child folder -->
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
    </aside>

    <!-- ── Document table ─────────────────────────────────────────────── -->
    <section class="two-pane__main">
      <div class="table-wrap">
        <fvdr-table [columns]="columns" [data]="rows">
          <ng-template fvdrCell="name" let-value>
            <span class="cell-name">
              <span class="cell-icon"><fvdr-icon name="folder"></fvdr-icon></span>
              <span>{{ value }}</span>
            </span>
          </ng-template>

          <ng-template fvdrCell="size" let-value let-row="row">
            <span class="cell-2l">
              <span>{{ value }}</span>
              <span class="cell-2l__sub">{{ row.files }}</span>
            </span>
          </ng-template>
        </fvdr-table>

        <button type="button" class="icon-btn table-wrap__cols" title="Customize columns">
          <fvdr-icon name="table-view"></fvdr-icon>
        </button>
      </div>
    </section>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; height: 100%; }

    .docs { height: 100%; }
    .docs__bar { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-divider); }

    .two-pane { min-height: 0; }
    .two-pane__main { overflow: auto; }
  `],
})
export class VdrDocumentsComponent {
  readonly primary: VdrActionBarButton = { id: 'add', label: 'Add', icon: 'plus' };
  readonly secondaries: VdrActionBarButton[] = [
    { id: 'download', label: 'Download' },
    { id: 'index', label: 'Project index' },
  ];

  readonly shortcuts: { icon: 'history' | 'upload' | 'star'; label: string }[] = [
    { icon: 'history', label: 'Recently viewed' },
    { icon: 'upload', label: 'Newly uploaded' },
    { icon: 'star', label: 'Favorites' },
  ];

  readonly columns: TableColumn[] = [
    { key: 'index', label: 'Index', width: '80px' },
    { key: 'name', label: 'Name' },
    { key: 'size', label: 'Size', width: '140px' },
    { key: 'addedOn', label: 'Added on', width: '140px' },
    { key: 'notes', label: 'Notes', width: '90px' },
    { key: 'labels', label: 'Labels', width: '120px' },
  ];

  readonly rows = [
    {
      index: '1',
      name: 'Get to know VDR',
      size: '3.52 MB',
      files: '7 files',
      addedOn: 'Aug 14, 2026',
      notes: '',
      labels: '',
    },
  ];
}
