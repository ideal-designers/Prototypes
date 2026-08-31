import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrPageId } from '../data/product-nav';
import { DS_COMPONENTS, FvdrIconName, TableColumn } from '../../../../shared/ds';
import { FOLDER_ROLLUPS } from '../../data/mock-data';
import { folderDisplayName, formatSizeKb } from '../../models/mock-doc.model';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/**
 * One table row. The room root holds only folders, so every row is a folder
 * rollup today — `icon` and `version` keep the file shape the product also
 * renders here, and the Name cell prints them when a file row appears.
 */
interface VdrDocsRow {
  index: string;
  name: string;
  /**
   * Folder name with its index prefix — the value the assistant scopes a chat
   * on. Files carry none, so the row-hover action only appears on folders.
   */
  fullName?: string;
  icon: FvdrIconName;
  published: boolean;
  /** Printed as a small "v3" pill after the name; absent while a file is at v1. */
  version?: number;
  size: string;
  /** Second line under the size: "7 files" for a folder, "12 pages" for a file. */
  sizeSub: string;
  addedOn: string;
  notes: string;
  labels: string[];
}

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
    >
      <!-- Right group, before the search field — the product's viewer switcher. -->
      <fvdr-ghost-btn
        bar-end
        icon="view-as"
        label="View as"
        [arrow]="false"
      ></fvdr-ghost-btn>
    </fvdr-vdr-action-bar>
  </div>

  <div class="two-pane">

    <!-- ── Quick access ────────────────────────────────────────────────── -->
    <aside class="two-pane__side">
      <fvdr-vdr-quick-access selected="project" (navigate)="navigate.emit($event)"></fvdr-vdr-quick-access>
    </aside>

    <!-- ── Document table ─────────────────────────────────────────────── -->
    <section class="two-pane__main">
      <div class="table-wrap docs__table">
        <fvdr-table [columns]="columns" [data]="rows">
          <ng-template fvdrCell="name" let-value let-row="row">
            <span class="cell-name">
              <span class="cell-icon"><fvdr-icon [name]="row.icon"></fvdr-icon></span>
              <span class="cell-name__text" [title]="value">{{ value }}</span>
              <fvdr-chip
                *ngIf="row.version"
                size="xs"
                variant="grey"
                [label]="'v' + row.version"
              ></fvdr-chip>
            </span>
          </ng-template>

          <!-- Published / unpublished, the same pair of circle glyphs the
               Quick access "Unpublished" row uses. -->
          <ng-template fvdrCell="published" let-value>
            <span
              class="cell-pub"
              [class.cell-pub--off]="!value"
              [title]="value ? 'Published' : 'Unpublished'"
            >
              <fvdr-icon [name]="value ? 'finished' : 'cross-circle'"></fvdr-icon>
            </span>
          </ng-template>

          <ng-template fvdrCell="size" let-value let-row="row">
            <span class="cell-2l">
              <span>{{ value }}</span>
              <span class="cell-2l__sub">{{ row.sizeSub }}</span>
            </span>
          </ng-template>

          <!-- First label, then a "+N" chip — the cell never wraps. -->
          <ng-template fvdrCell="labels" let-value>
            <span class="cell-labels" *ngIf="value.length">
              <fvdr-chip size="s" variant="default" [label]="value[0]"></fvdr-chip>
              <fvdr-chip
                *ngIf="value.length > 1"
                size="s"
                variant="grey"
                [label]="'+' + (value.length - 1)"
              ></fvdr-chip>
            </span>
          </ng-template>

          <!--
            Folder context seeding: hidden at rest so the table gains no
            always-visible chrome, revealed on row hover / keyboard focus.
          -->
          <ng-template fvdrCell="actions" let-row="row">
            <fvdr-ghost-btn
              *ngIf="row.fullName"
              class="row-ask"
              size="small"
              icon="ai-assistant"
              [tooltip]="'Ask AI about ' + row.fullName"
              (clicked)="askAiForFolder.emit(row.fullName)"
            ></fvdr-ghost-btn>
          </ng-template>
        </fvdr-table>

        <fvdr-ghost-btn
          class="table-wrap__cols"
          size="small"
          icon="table-view"
          tooltip="Customize columns"
        ></fvdr-ghost-btn>
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

    /* Seven columns only fit the pane if the declared widths are honoured, so
       this table lays out fixed and the Name column ellipsizes instead. */
    .docs__table ::ng-deep .table { table-layout: fixed; }
    .cell-name { max-width: 100%; }
    .cell-name__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* Size / date cells keep to one line each now that they have room. */
    .docs__table ::ng-deep .table__td { white-space: nowrap; }

    /* Publishing glyph: green when published, muted grey when not. */
    .cell-pub {
      display: inline-flex;
      font-size: var(--font-size-lg, 16px);
      color: var(--color-primary-500);
    }
    .cell-pub--off { color: var(--color-stone-600); }

    .cell-labels { display: inline-flex; align-items: center; gap: var(--space-1); }

    /* Row action revealed on hover. The <tr> belongs to fvdr-table, so the
       hover selector has to reach into it. */
    .row-ask { opacity: 0; transition: opacity 0.12s ease; }
    .docs__table ::ng-deep .table__row:hover .row-ask,
    .docs__table ::ng-deep .table__row:focus-within .row-ask { opacity: 1; }
  `],
})
export class VdrDocumentsComponent {
  /**
   * Quick access shortcut clicked — Documents › Recently viewed / Newly uploaded
   * / Favorites live in that pane, not in the sidebar, so the page bubbles the
   * request up instead of navigating itself.
   */
  @Output() navigate = new EventEmitter<VdrPageId>();
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

  /**
   * Widths are honoured (the table runs table-layout: fixed here) so the seven
   * columns fit the pane without a horizontal scrollbar; Name takes whatever is
   * left and ellipsizes.
   */
  readonly columns: TableColumn[] = [
    { key: 'index', label: 'Index', width: '70px' },
    { key: 'name', label: 'Name' },
    { key: 'published', label: 'Publishing', width: '100px' },
    { key: 'size', label: 'Size', width: '100px' },
    { key: 'addedOn', label: 'Added on', width: '112px' },
    { key: 'notes', label: 'Notes', width: '72px' },
    { key: 'labels', label: 'Labels', width: '132px' },
    // Row-hover action; the header cell stays empty under the Customize icon.
    { key: 'actions', label: '', width: '56px', align: 'right' },
  ];

  /**
   * One row per top-level folder, derived from the shared corpus. `name` drops
   * the index prefix the way the product's Name column does, while `fullName`
   * keeps it — that is the value the assistant scopes a chat on.
   */
  readonly rows: VdrDocsRow[] = FOLDER_ROLLUPS.map(r => ({
    index: r.folder.index,
    name: folderDisplayName(r.folder.name),
    fullName: r.folder.name,
    icon: 'folder' as FvdrIconName,
    published: r.folder.published,
    size: formatSizeKb(r.sizeKb),
    sizeSub: r.files + (r.files === 1 ? ' file' : ' files'),
    addedOn: r.folder.addedOn,
    notes: '',
    labels: r.folder.labels ?? [],
  }));
}
