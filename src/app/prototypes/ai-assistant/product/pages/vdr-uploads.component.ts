import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrPageId } from '../data/product-nav';
import { DS_COMPONENTS, FvdrIconName } from '../../../../shared/ds';
import { FOLDER_ROLLUPS, MOCK_DATA_ROOM } from '../../data/mock-data';
import {
  DOC_ROW_ICON,
  folderDisplayName,
  formatSizeKb,
  pagesLabel,
} from '../../models/mock-doc.model';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/** One row of the Newly uploaded list — a folder or one of its documents. */
interface UploadRow {
  index: string;
  name: string;
  /** File-type icon matched to the extension. */
  icon: FvdrIconName;
  size: string;
  /** Second line of the size cell — page or file count, absent for video. */
  count?: string;
  location: string;
  addedOn: string;
  /** Printed as a small "v3" pill after the name; unset while a file is at v1. */
  version?: number;
}

/**
 * Documents › Newly uploaded — replica of `.design/real-product-spec.md`
 * section 4.4, the one populated list we captured, so it doubles as the
 * reference for what a realistic document table looks like. Rows come from the
 * shared corpus in `data/mock-data.ts` — every folder followed by its documents,
 * the way the product interleaves them.
 *
 * The table is hand-rolled (`.dtable` in vdr-page.css) rather than fvdr-table:
 * the product groups rows under a full-width `Last 7 days` header row, which the
 * DS table has no concept of. Every control is inert.
 */
@Component({
  selector: 'fvdr-vdr-uploads',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrActionBarComponent, VdrQuickAccessComponent],
  template: `
<div class="page page--flush docs">

  <div class="page-bar">
    <fvdr-vdr-action-bar
      [secondaries]="secondaries"
      searchPlaceholder="Search in documents"
    ></fvdr-vdr-action-bar>
  </div>

  <div class="two-pane">
    <aside class="two-pane__side">
      <fvdr-vdr-quick-access selected="uploads" (navigate)="navigate.emit($event)"></fvdr-vdr-quick-access>
    </aside>

    <section class="two-pane__main">
      <table class="dtable">
        <thead>
          <tr>
            <th class="dtable__th" style="width: 80px">Index</th>
            <th class="dtable__th">Name</th>
            <th class="dtable__th" style="width: 130px">Size</th>
            <th class="dtable__th" style="width: 200px">Location</th>
            <th class="dtable__th" style="width: 130px">Added on</th>
            <th class="dtable__th" style="width: 90px">Notes</th>
            <th class="dtable__th dtable__th--tools">
              <fvdr-ghost-btn size="small" icon="table-view" tooltip="Customize columns"></fvdr-ghost-btn>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td class="dtable__group-cell" colspan="7">Last 7 days</td>
          </tr>

          <tr class="dtable__row" *ngFor="let r of rows">
            <td class="dtable__td">{{ r.index }}</td>
            <td class="dtable__td">
              <span class="cell-name">
                <span class="cell-icon"><fvdr-icon [name]="r.icon"></fvdr-icon></span>
                <span>{{ r.name }}</span>
                <!-- Files past their first version carry the product's small "v3" pill. -->
                <fvdr-chip *ngIf="r.version" size="xs" variant="grey" [label]="'v' + r.version"></fvdr-chip>
              </span>
            </td>
            <td class="dtable__td">
              <span class="cell-2l">
                <span>{{ r.size }}</span>
                <span class="cell-2l__sub" *ngIf="r.count">{{ r.count }}</span>
              </span>
            </td>
            <td class="dtable__td">
              <span class="cell-name">
                <span class="cell-icon cell-icon--sm"><fvdr-icon name="folder"></fvdr-icon></span>
                <span>{{ r.location }}</span>
              </span>
            </td>
            <td class="dtable__td">{{ r.addedOn }}</td>
            <td class="dtable__td"></td>
            <td class="dtable__td"></td>
          </tr>
        </tbody>
      </table>
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

    /* Location cells use a smaller folder glyph than the file-type column. */
    .cell-icon--sm { font-size: var(--font-size-base, 14px); }
  `],
})
export class VdrUploadsComponent {
  /**
   * Quick access shortcut clicked — Documents › Recently viewed / Newly uploaded
   * / Favorites live in that pane, not in the sidebar, so the page bubbles the
   * request up instead of navigating itself.
   */
  @Output() navigate = new EventEmitter<VdrPageId>();
  readonly secondaries: VdrActionBarButton[] = [{ id: 'index', label: 'Project index' }];

  /** Folder row, then its documents — as the product lists a fresh upload batch. */
  readonly rows: UploadRow[] = FOLDER_ROLLUPS.flatMap(r => [
    {
      index: r.folder.index,
      name: folderDisplayName(r.folder.name),
      icon: 'folder' as FvdrIconName,
      size: formatSizeKb(r.sizeKb),
      count: r.files + (r.files === 1 ? ' file' : ' files'),
      location: MOCK_DATA_ROOM.name,
      addedOn: r.folder.addedOn,
    },
    ...r.documents.map(d => ({
      index: d.index,
      name: d.name,
      icon: DOC_ROW_ICON[d.type],
      size: d.sizeLabel,
      // Video carries no page count, so the second line is simply omitted.
      count: d.pages ? pagesLabel(d.pages) : undefined,
      location: d.folderPath,
      addedOn: d.addedOn,
      version: d.version,
    })),
  ]);
}
