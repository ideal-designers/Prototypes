import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TableColumn } from '../../../../shared/ds';
import { FOLDER_ROLLUPS } from '../../data/mock-data';
import { folderDisplayName, formatSizeKb } from '../../models/mock-doc.model';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/**
 * Documents › All — replica of `.design/real-product-spec.md` section 2.2, the
 * page the assistant will most often be opened on top of.
 *
 * Two panes: the 325px Quick access panel and the document table with the
 * Customize columns affordance. Rows are the real data room's top-level folders
 * (`data/mock-data.ts`), so the table behind the assistant lists exactly what
 * the assistant cites. Inert controls — with one
 * exception: the row-hover "Ask AI" action, which emits the folder name so a
 * host can open its assistant already scoped to that folder. The replica itself
 * stays assistant-free (no services, no assistant components).
 */
@Component({
  selector: 'fvdr-vdr-documents',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrActionBarComponent, VdrQuickAccessComponent],
  template: `
<div class="page page--flush docs">

  <div class="page-bar">
    <fvdr-vdr-action-bar
      [primary]="primary"
      [secondaries]="secondaries"
      searchPlaceholder="Search in documents"
    ></fvdr-vdr-action-bar>
  </div>

  <div class="two-pane">

    <!-- ── Quick access ────────────────────────────────────────────────── -->
    <aside class="two-pane__side">
      <fvdr-vdr-quick-access selected="project"></fvdr-vdr-quick-access>
    </aside>

    <!-- ── Document table ─────────────────────────────────────────────── -->
    <section class="two-pane__main">
      <div class="table-wrap docs__table">
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

          <!--
            Folder context seeding: hidden at rest so the table gains no
            always-visible chrome, revealed on row hover / keyboard focus.
          -->
          <ng-template fvdrCell="actions" let-row="row">
            <button
              type="button"
              class="icon-btn row-ask"
              [attr.title]="'Ask AI about ' + row.fullName"
              [attr.aria-label]="'Ask AI about ' + row.fullName"
              (click)="askAiForFolder.emit(row.fullName)"
            >
              <fvdr-icon name="ai-assistant"></fvdr-icon>
            </button>
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

    .two-pane { min-height: 0; }
    .two-pane__main { overflow: auto; }

    /* Row action revealed on hover. The <tr> belongs to fvdr-table, so the
       hover selector has to reach into it. */
    .row-ask { opacity: 0; transition: opacity 0.12s ease; }
    .docs__table ::ng-deep .table__row:hover .row-ask,
    .docs__table ::ng-deep .table__row:focus-within .row-ask { opacity: 1; }
  `],
})
export class VdrDocumentsComponent {
  /**
   * Folder the user asked the assistant about, from the row-hover action.
   * Bubbled up by fvdr-vdr-shell — the replica never talks to the assistant
   * itself.
   */
  @Output() askAiForFolder = new EventEmitter<string>();

  readonly primary: VdrActionBarButton = { id: 'add', label: 'Add', icon: 'plus' };
  readonly secondaries: VdrActionBarButton[] = [
    { id: 'download', label: 'Download' },
    { id: 'index', label: 'Project index' },
  ];

  readonly columns: TableColumn[] = [
    { key: 'index', label: 'Index', width: '80px' },
    { key: 'name', label: 'Name' },
    { key: 'size', label: 'Size', width: '140px' },
    { key: 'addedOn', label: 'Added on', width: '140px' },
    { key: 'notes', label: 'Notes', width: '90px' },
    { key: 'labels', label: 'Labels', width: '120px' },
    // Row-hover action; the header cell stays empty under the Customize icon.
    { key: 'actions', label: '', width: '56px', align: 'right' },
  ];

  /**
   * One row per top-level folder, derived from the shared corpus. `name` drops
   * the index prefix the way the product's Name column does, while `fullName`
   * keeps it — that is the value the assistant scopes a chat on.
   */
  readonly rows = FOLDER_ROLLUPS.map(r => ({
    index: r.folder.index,
    name: folderDisplayName(r.folder.name),
    fullName: r.folder.name,
    size: formatSizeKb(r.sizeKb),
    files: r.files + (r.files === 1 ? ' file' : ' files'),
    addedOn: r.folder.addedOn,
    notes: '',
    labels: '',
  }));
}
