import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName } from '../../../../shared/ds';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/** One captured row of the Newly uploaded list. */
interface UploadRow {
  index: string;
  name: string;
  /** File-type icon matched to the extension. */
  icon: FvdrIconName;
  size: string;
  /** Second line of the size cell — page or file count, absent for video. */
  count?: string;
  location: string;
}

/**
 * Documents › Newly uploaded — replica of `.design/real-product-spec.md`
 * section 4.4, the one populated list we captured, so it doubles as the
 * reference for what a realistic document table looks like.
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
      <fvdr-vdr-quick-access selected="uploads"></fvdr-vdr-quick-access>
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
              <button type="button" class="icon-btn" title="Customize columns">
                <fvdr-icon name="table-view"></fvdr-icon>
              </button>
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
            <td class="dtable__td">{{ addedOn }}</td>
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
  readonly secondaries: VdrActionBarButton[] = [{ id: 'index', label: 'Project index' }];

  /** Every captured row shares the upload date. */
  readonly addedOn = 'Aug 14, 2026';

  readonly rows: UploadRow[] = [
    { index: '1',   name: 'Get to know VDR',                      icon: 'folder',     size: '3.52 MB',  count: '7 files',  location: 'test 2' },
    { index: '1.1', name: 'Advantages of using VDR.txt',          icon: 'note',       size: '2.21 KB',  count: '1 page',   location: '1 Get to know VDR' },
    { index: '1.2', name: 'Available document permissions.docx',  icon: 'documents',  size: '52.53 KB', count: '4 pages',  location: '1 Get to know VDR' },
    { index: '1.3', name: 'Guidelines on using VDR efficiently.pdf', icon: 'perm-pdf', size: '474.7 KB', count: '5 pages', location: '1 Get to know VDR' },
    { index: '1.4', name: 'Sample balance sheet.xls',             icon: 'table-view', size: '44.5 KB',  count: '12 pages', location: '1 Get to know VDR' },
    { index: '1.5', name: 'Sample financial model.xlsx',          icon: 'table-view', size: '41.3 KB',  count: '8 pages',  location: '1 Get to know VDR' },
    { index: '1.6', name: 'Sensitive data redaction.mp4',         icon: 'video',      size: '2.85 MB',                     location: '1 Get to know VDR' },
    { index: '1.7', name: 'The five steps to start with iDeals VDR.jpg', icon: 'image', size: '70.94 KB', count: '1 page', location: '1 Get to know VDR' },
  ];
}
