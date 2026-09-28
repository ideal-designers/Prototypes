import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SegmentItem } from '../../shared/ds';
import { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';
import { TrackerService } from '../../services/tracker.service';

/**
 * Documents — mobile filters
 * Figma: h9MR3O7N3kLV2xl2MGQDxs — original 26704-90152, improved 30138-310856 (390 wide)
 *
 * Two modes:
 *   original — Figma as-is: "Files / Folders" chips are independent from the format chips,
 *              so "Folders + DOC" is a valid (but always empty) combination.
 *   improved — Files is the parent of every format (tri-state), Folders is a leaf with no
 *              children, file-only filters are disabled when only folders are in scope,
 *              sections collapse with a summary, selection is edited as a draft.
 */

type Mode = 'original' | 'improved';
type DatePreset = 'any' | 'today' | '7d' | '30d' | 'custom';
type ViewedId = 'me' | 'notMe' | 'group' | 'notGroup';
type RedactionId = 'applied' | 'drafted' | 'appliedDraft' | 'none';
type SectionId = 'type' | 'added' | 'addedBy' | 'viewed' | 'redaction' | 'labels' | 'area';

interface FormatGroup { id: string; label: string; formats: string[]; icon: FvdrFileType; }
interface Person { name: string; initials: string; }

interface FilterState {
  addedOn: DatePreset;
  rangeStart?: Date;
  rangeEnd?: Date;
  viewed: Set<ViewedId>;
  addedBy: Set<string>;
  /** Original mode only — the standalone "Files" chip. Improved mode derives Files from formats. */
  filesChip: boolean;
  folders: boolean;
  formats: Set<string>;
  redaction: Set<RedactionId>;
  searchArea: Set<'titles' | 'content'>;
  regions: Set<string>;
  departments: Set<string>;
}

interface DocItem {
  id: number;
  name: string;
  isFolder: boolean;
  format: string;          // '' for folders
  icon: FvdrFileType;
  addedBy: string;
  daysAgo: number;
  viewedByMe: boolean;
  viewedByGroup: boolean;
  redaction: RedactionId | null;
  region: string;
  department: string;
}

interface AppliedChip { key: string; label: string; remove: () => void; }

const FORMAT_GROUPS: FormatGroup[] = [
  { id: 'sheets', label: 'Spreadsheets', icon: 'xls', formats: ['XLS', 'XLSX', 'XLSM', 'CSV'] },
  { id: 'docs', label: 'Documents', icon: 'doc', formats: ['PDF', 'DOC', 'DOCX', 'TXT', 'RTF'] },
  { id: 'images', label: 'Images', icon: 'image', formats: ['JPG', 'JPEG', 'JPE', 'GIF', 'BMP', 'PNG', 'TIF', 'TIFF', 'WMF'] },
  { id: 'slides', label: 'Presentations', icon: 'ppt', formats: ['PPT', 'PPTX'] },
  { id: 'video', label: 'Video', icon: 'video', formats: ['FLV', 'MP4', 'MOV', 'AVI', 'WMV', 'M4V', 'MPG', 'MXF', 'MKV', '3GP', 'MPEG', 'TS'] },
  { id: 'web', label: 'Web pages', icon: 'code', formats: ['HTM', 'HTML', 'MHT'] },
  { id: 'email', label: 'Emails', icon: 'eml', formats: ['EML', 'MSG'] },
  { id: 'other', label: 'Additional formats', icon: 'dwg', formats: ['DWG', 'Other'] },
];
const ALL_FORMATS = FORMAT_GROUPS.flatMap(g => g.formats);

const PEOPLE: Person[] = [
  { name: 'Anna Camp', initials: 'AC' }, { name: 'Ben Johnson', initials: 'BJ' },
  { name: 'Clara Lee', initials: 'CL' }, { name: 'David Smith', initials: 'DS' },
  { name: 'Eva Martinez', initials: 'EM' }, { name: 'Frank Wright', initials: 'FW' },
  { name: 'Grace Kim', initials: 'GK' }, { name: 'Henry Novak', initials: 'HN' },
  { name: 'Iris Chen', initials: 'IC' }, { name: 'Jack Brown', initials: 'JB' },
];

const REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Oceania', 'Africa'];
const DEPARTMENTS = ['Finance', 'Accounting', 'Legal', 'M4V', 'Human resources', 'Information technology', 'Sales', 'Marketing'];

const VIEWED_OPTS: { id: ViewedId; label: string }[] = [
  { id: 'me', label: 'Viewed by me' }, { id: 'notMe', label: 'Not viewed by me' },
  { id: 'group', label: 'Viewed by group' }, { id: 'notGroup', label: 'Not viewed by group' },
];
const REDACTION_OPTS: { id: RedactionId; label: string }[] = [
  { id: 'applied', label: 'Applied' }, { id: 'drafted', label: 'Drafted' },
  { id: 'appliedDraft', label: 'Applied and has new draft' }, { id: 'none', label: 'None' },
];
const DATE_OPTS: { id: DatePreset; label: string }[] = [
  { id: 'any', label: 'Any time' }, { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' }, { id: 'custom', label: 'Custom range' },
];

const NAME_STEMS = ['Financial statements', 'Share purchase agreement', 'Board minutes', 'Due diligence report',
  'Cap table', 'Employee handbook', 'IP assignment', 'Lease agreement', 'Tax return', 'Audit letter',
  'Customer contracts', 'Product roadmap', 'Site plan', 'Investor deck', 'Insurance policy', 'NDA'];
const FOLDER_NAMES = ['Corporate', 'Finance', 'Legal', 'HR', 'Tax', 'IP', 'Commercial', 'Real estate', 'Insurance', 'IT'];

function iconFor(format: string): FvdrFileType {
  if (format === 'PDF') return 'pdf';
  if (format === 'TXT') return 'txt';
  return FORMAT_GROUPS.find(g => g.formats.includes(format))?.icon ?? 'placeholder';
}

function buildItems(): DocItem[] {
  let seed = 42;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  // Weighted toward the formats a data room actually holds
  const weighted = [...ALL_FORMATS, ...Array(14).fill('PDF'), ...Array(8).fill('DOCX'), ...Array(6).fill('XLSX'),
    ...Array(3).fill('PPTX'), ...Array(3).fill('JPEG'), ...Array(2).fill('MSG')];
  const items: DocItem[] = [];
  for (let i = 0; i < 1080; i++) {
    const isFolder = i % 16 === 0;
    const format = isFolder ? '' : pick(weighted);
    const r = rnd();
    items.push({
      id: i,
      isFolder,
      format,
      icon: isFolder ? 'folder' : iconFor(format),
      name: isFolder ? `${pick(FOLDER_NAMES)} ${1 + (i % 9)}` : `${pick(NAME_STEMS)} ${2019 + (i % 7)}.${format.toLowerCase()}`,
      addedBy: pick(PEOPLE).name,
      daysAgo: Math.floor(rnd() * 120),
      viewedByMe: rnd() > 0.55,
      viewedByGroup: rnd() > 0.35,
      redaction: isFolder ? null : r < 0.08 ? 'applied' : r < 0.13 ? 'drafted' : r < 0.16 ? 'appliedDraft' : 'none',
      region: pick(REGIONS),
      department: pick(DEPARTMENTS),
    });
  }
  return items;
}

function emptyState(): FilterState {
  return {
    addedOn: 'any', viewed: new Set(), addedBy: new Set(), filesChip: false, folders: false,
    formats: new Set(), redaction: new Set(), searchArea: new Set(), regions: new Set(), departments: new Set(),
  };
}

function cloneState(s: FilterState): FilterState {
  return {
    ...s, viewed: new Set(s.viewed), addedBy: new Set(s.addedBy), formats: new Set(s.formats),
    redaction: new Set(s.redaction), searchArea: new Set(s.searchArea), regions: new Set(s.regions), departments: new Set(s.departments),
  };
}

/** The state shown in the Figma frame: Files + DOC + JPEG, six people. */
function figmaState(): FilterState {
  const s = emptyState();
  s.filesChip = true;
  s.formats = new Set(['DOC', 'JPEG']);
  s.addedBy = new Set(PEOPLE.slice(0, 6).map(p => p.name));
  return s;
}

/** Improved frame (30138-310856): all spreadsheets + DOC + JPEG, nobody under Added by. */
function improvedState(): FilterState {
  const s = emptyState();
  s.formats = new Set(['XLS', 'XLSX', 'XLSM', 'CSV', 'DOC', 'JPEG']);
  return s;
}

function toggleIn<T>(set: Set<T>, v: T): void { set.has(v) ? set.delete(v) : set.add(v); }

@Component({
  selector: 'fvdr-mobile-doc-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page">
      <!-- ── Rationale panel ───────────────────────────────────── -->
      <aside class="notes">
        <div class="notes__eyebrow">Documents · Mobile</div>
        <h1 class="notes__title">Filters on mobile</h1>
        <p class="notes__lead">All filters from Figma, in a full-screen sheet. Switch modes to compare the Figma version with the improved one.</p>

        <fvdr-segment [items]="modeItems" [activeId]="mode" (activeIdChange)="setMode($any($event))" size="md" />

        <ng-container *ngIf="mode === 'improved'; else origNotes">
          <h2 class="notes__h">What changed and why</h2>
          <ol class="notes__list">
            <li><b>Files is the parent of every format.</b> Selecting Files selects all 39 formats; unselecting one format turns Files into a partial (–) state. Before, “Files” and “DOC” were unrelated chips, so it was unclear whether “Files + DOC” meant all files or only DOC files.</li>
            <li><b>Folders is a leaf.</b> Folders have no formats, so selecting Folders never selects or clears anything else. Selecting Folders and Files together just means “both”.</li>
            <li><b>Format groups have their own checkbox.</b> “All spreadsheets” is one tap, not four. The group checkbox shows partial (–) when only some of its formats are on.</li>
            <li><b>No impossible combinations.</b> In Figma, “Folders + DOC” is allowed and always returns 0 results. Now formats live under Files, so this combination can’t be built.</li>
            <li><b>File-only filters say so.</b> When only Folders are in scope, Redaction is disabled with a note instead of silently returning nothing.</li>
            <li><b>Everything is visible, but sections can collapse.</b> All filters are open by default, including the date picker and every format. Each section collapses with its chevron, and Files collapses its format list.</li>
            <li><b>Same order as Figma.</b> Added on → Viewed → Added by → Item type → Redaction → Search area → Labels, so the date picker is the first thing you see.</li>
            <li><b>Selected chips are easier to see.</b> Selected chips use a light-green fill with green text instead of light grey, so a group of selected formats is easy to read.</li>
            <li><b>Changes are a draft.</b> The button counts results live. Closing the sheet with ✕ discards changes, and applied filters show as removable chips above the list.</li>
          </ol>
        </ng-container>
        <ng-template #origNotes>
          <h2 class="notes__h">Problems in the Figma version</h2>
          <ol class="notes__list">
            <li>“Files” is selected but only DOC and JPEG are highlighted. Does it mean all files or two formats?</li>
            <li>Try <b>Folders</b> + any format: the result is always <b>0</b>, and nothing tells you why.</li>
            <li>39 format chips make the sheet about 2,100px tall. Labels and Search area are far below the fold.</li>
            <li>Grey selected chips are hard to tell apart from unselected ones.</li>
          </ol>
        </ng-template>

        <h2 class="notes__h">Try it</h2>
        <div class="notes__tries">
          <button class="try" type="button" (click)="tryFiles()">Tap “Files”</button>
          <button class="try" type="button" (click)="tryFolders()">Folders + DOC</button>
          <button class="try" type="button" (click)="tryFoldersOnly()">Folders only</button>
          <button class="try" type="button" (click)="tryReset()">Reset to Figma state</button>
        </div>
      </aside>

      <!-- ── Phone ─────────────────────────────────────────────── -->
      <div class="phone">
        <div class="screen">
          <!-- Documents list -->
          <div class="m-header">
            <fvdr-icon name="chevron-left" class="m-header__back" />
            <div class="m-header__title">Documents</div>
            <button class="icon-btn" type="button" (click)="openSheet()" aria-label="Filters">
              <fvdr-icon name="filter" />
              <span *ngIf="appliedCount" class="icon-btn__badge">{{ appliedCount }}</span>
            </button>
          </div>

          <div class="applied" *ngIf="appliedChips.length">
            <fvdr-chip *ngFor="let c of appliedChips; trackBy: trackKey" [label]="c.label" [removable]="true" (removed)="c.remove()" />
            <button class="link" type="button" (click)="clearApplied()">Clear all</button>
          </div>

          <div class="list-meta">{{ appliedResults.length | number }} items</div>
          <div class="list">
            <div class="row" *ngFor="let it of appliedResults.slice(0, 40); trackBy: trackId">
              <fvdr-file-icon [type]="it.icon" />
              <div class="row__body">
                <div class="row__name">{{ it.name }}</div>
                <div class="row__meta">{{ it.addedBy }} · {{ it.daysAgo === 0 ? 'Today' : it.daysAgo + 'd ago' }}</div>
              </div>
              <fvdr-icon name="more" class="row__more" />
            </div>
            <div class="empty" *ngIf="!appliedResults.length">
              <fvdr-icon name="search" class="empty__icon" />
              <div class="empty__title">No items match these filters</div>
              <button class="link" type="button" (click)="clearApplied()">Clear filters</button>
            </div>
          </div>

          <!-- Filter sheet -->
          <div class="sheet" [class.sheet--open]="sheetOpen">
            <div class="sheet__header">
              <div class="sheet__title">Filters</div>
              <button class="link" type="button" [disabled]="!draftCount" (click)="resetDraft()">Reset</button>
              <button class="icon-btn" type="button" (click)="closeSheet()" aria-label="Close"><fvdr-icon name="close" /></button>
            </div>

            <div class="sheet__body">
              <!-- ═════════ IMPROVED — Figma 30138-310856 ═════════ -->
              <ng-container *ngIf="mode === 'improved'">
                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('added')">
                    <span class="sec__title">Added on</span>
                    <fvdr-icon [name]="open.added ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.added">
                    <fvdr-datepicker class="dp" placeholder="Select date or range" [rangeMode]="true"
                      [(rangeStart)]="draft.rangeStart" [(rangeEnd)]="draft.rangeEnd"
                      (rangeStartChange)="syncDate()" (rangeEndChange)="syncDate()" />
                  </div>
                </section>

                <!-- Added by: title + Select link, chips only when people are picked -->
                <section class="sec sec--action">
                  <div class="sec__headrow">
                    <span class="sec__title">Added by</span>
                    <button class="link" type="button" (click)="openPeople()">Select</button>
                  </div>
                  <div class="people" *ngIf="draft.addedBy.size">
                    <fvdr-chip *ngFor="let n of addedByList" [label]="n" [removable]="true" [rounded]="true" (removed)="draft.addedBy.delete(n)" />
                  </div>
                </section>

                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('viewed')">
                    <span class="sec__title">Viewed</span>
                    <fvdr-icon [name]="open.viewed ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.viewed">
                    <div class="opts">
                      <button *ngFor="let v of viewedOpts" type="button" class="opt opt--new" [class.opt--on]="draft.viewed.has(v.id)" (click)="toggleViewed(v.id)">{{ v.label }}</button>
                    </div>
                  </div>
                </section>

                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('type')">
                    <span class="sec__title">Item type</span>
                    <fvdr-icon [name]="open.type ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.type">
                    <!-- Files: tri-state parent of every format -->
                    <div class="tree__row">
                      <fvdr-checkbox [checked]="filesState === 'all'" [indeterminate]="filesState === 'some'" (checkedChange)="toggleFiles()" />
                      <fvdr-file-icon type="doc" />
                      <button class="tree__label" type="button" (click)="open.formats = !open.formats">
                        <span>Files ({{ draft.formats.size }}/{{ allFormatsCount }})</span>
                        <fvdr-icon [name]="open.formats ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                      </button>
                    </div>

                    <div class="tree__children" [class.tree__children--open]="open.formats">
                      <div class="tree__children-inner">
                        <div class="grp" *ngFor="let g of groups">
                          <div class="grp__head">
                            <fvdr-checkbox [checked]="groupState(g) === 'all'" [indeterminate]="groupState(g) === 'some'" (checkedChange)="toggleGroup(g)">
                              <span class="grp__label">{{ g.label }}</span>
                            </fvdr-checkbox>
                          </div>
                          <div class="opts">
                            <button *ngFor="let f of g.formats" type="button" class="opt opt--new"
                              [class.opt--on]="draft.formats.has(f)" (click)="toggleFormat(f)">{{ f }}</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Folders: leaf, no children -->
                    <div class="tree__row">
                      <fvdr-checkbox [checked]="draft.folders" (checkedChange)="draft.folders = $event" />
                      <fvdr-file-icon type="folder-colored" />
                      <span class="tree__label tree__label--static">Folders</span>
                    </div>
                  </div>
                </section>

                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('redaction')">
                    <span class="sec__title">Redaction</span>
                    <fvdr-icon [name]="open.redaction ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.redaction">
                    <fvdr-inline-message *ngIf="foldersOnly" variant="info" message="Redaction applies to files only. Select Files or a format to use this filter." />
                    <div class="opts">
                      <button *ngFor="let r of redactionOpts" type="button" class="opt opt--new" [disabled]="foldersOnly" [class.opt--on]="draft.redaction.has(r.id) && !foldersOnly" (click)="toggleIn(draft.redaction, r.id)">{{ r.label }}</button>
                    </div>
                  </div>
                </section>

                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('area')">
                    <span class="sec__title">Search area</span>
                    <fvdr-icon [name]="open.area ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.area">
                    <div class="opts">
                      <button type="button" class="opt opt--new" [class.opt--on]="draft.searchArea.has('titles')" (click)="toggleArea('titles')">Titles</button>
                      <button type="button" class="opt opt--new" [class.opt--on]="draft.searchArea.has('content')" (click)="toggleArea('content')">Documents’ content</button>
                    </div>
                  </div>
                </section>

                <section class="sec">
                  <button class="sec__head" type="button" (click)="toggleSection('labels')">
                    <span class="sec__title">Labeled</span>
                    <fvdr-icon [name]="open.labels ? 'chevron-up' : 'chevron-down'" class="sec__chev" />
                  </button>
                  <div class="sec__body" *ngIf="open.labels">
                    <div class="sub">Region</div>
                    <div class="opts">
                      <button *ngFor="let r of regions" type="button" class="opt opt--new" [class.opt--on]="draft.regions.has(r)" (click)="toggleIn(draft.regions, r)">{{ r }}</button>
                    </div>
                    <div class="sub">Department</div>
                    <div class="opts">
                      <button *ngFor="let d of visibleDepartments" type="button" class="opt opt--new" [class.opt--on]="draft.departments.has(d)" (click)="toggleIn(draft.departments, d)">{{ d }}</button>
                    </div>
                    <button class="link link--sm" type="button" (click)="showAllDepts = !showAllDepts">{{ showAllDepts ? 'Show less' : 'Show more' }}</button>
                  </div>
                </section>
              </ng-container>

              <!-- ═════════ ORIGINAL (Figma as-is) ═════════ -->
              <ng-container *ngIf="mode === 'original'">
                <div class="o-sec">
                  <div class="o-title">Added on</div>
                  <fvdr-datepicker placeholder="Select date or range" [rangeMode]="true" [(rangeStart)]="draft.rangeStart" [(rangeEnd)]="draft.rangeEnd" (rangeEndChange)="draft.addedOn = 'custom'" />
                </div>
                <div class="o-sec">
                  <div class="o-title">Viewed</div>
                  <div class="opts">
                    <button *ngFor="let v of viewedOpts" type="button" class="opt" [class.opt--grey]="draft.viewed.has(v.id)" (click)="toggleViewed(v.id)">{{ v.label }}</button>
                  </div>
                </div>
                <div class="o-sec">
                  <div class="o-row"><div class="o-title">Added by</div><button class="link" type="button" (click)="openPeople()">Select</button></div>
                  <div class="people">
                    <fvdr-chip *ngFor="let n of addedByList" [label]="n" [removable]="true" [rounded]="true" (removed)="draft.addedBy.delete(n)" />
                  </div>
                </div>
                <div class="o-sec">
                  <div class="o-title">Item type</div>
                  <div class="opts">
                    <button type="button" class="opt" [class.opt--grey]="draft.filesChip" (click)="draft.filesChip = !draft.filesChip">Files</button>
                    <button type="button" class="opt" [class.opt--grey]="draft.folders" (click)="draft.folders = !draft.folders">Folders</button>
                  </div>
                  <div *ngFor="let g of groups" class="o-grp">
                    <div class="o-sub">{{ g.label }}</div>
                    <div class="opts">
                      <button *ngFor="let f of g.formats" type="button" class="opt" [class.opt--grey]="draft.formats.has(f)" (click)="toggleFormat(f)">{{ f }}</button>
                    </div>
                  </div>
                </div>
                <div class="o-sec">
                  <div class="o-title">Redaction</div>
                  <div class="opts">
                    <button *ngFor="let r of redactionOpts" type="button" class="opt" [class.opt--grey]="draft.redaction.has(r.id)" (click)="toggleIn(draft.redaction, r.id)">{{ r.label }}</button>
                  </div>
                </div>
                <div class="o-sec">
                  <div class="o-title">Search area</div>
                  <div class="opts">
                    <button type="button" class="opt" [class.opt--grey]="draft.searchArea.has('titles')" (click)="toggleArea('titles')">Titles</button>
                    <button type="button" class="opt" [class.opt--grey]="draft.searchArea.has('content')" (click)="toggleArea('content')">Documents’ content</button>
                  </div>
                </div>
                <div class="o-sec">
                  <div class="o-title o-title--l">Labeled</div>
                  <div class="o-sub">Region</div>
                  <div class="opts">
                    <button *ngFor="let r of regions" type="button" class="opt" [class.opt--grey]="draft.regions.has(r)" (click)="toggleIn(draft.regions, r)">{{ r }}</button>
                  </div>
                  <div class="o-sub">Department</div>
                  <div class="opts">
                    <button *ngFor="let d of departments" type="button" class="opt" [class.opt--grey]="draft.departments.has(d)" (click)="toggleIn(draft.departments, d)">{{ d }}</button>
                  </div>
                </div>
              </ng-container>
            </div>

            <div class="sheet__footer">
              <fvdr-btn class="cta" size="l" variant="primary" [label]="'Show results (' + draftResults.length + ')'" (clicked)="applyDraft()" />
            </div>

            <!-- People picker (nested sheet) -->
            <div class="picker" [class.picker--open]="peopleOpen">
              <div class="sheet__header">
                <button class="icon-btn" type="button" (click)="peopleOpen = false" aria-label="Back"><fvdr-icon name="chevron-left" /></button>
                <div class="sheet__title">Added by</div>
                <button class="link" type="button" [disabled]="!draft.addedBy.size" (click)="draft.addedBy.clear()">Clear</button>
              </div>
              <div class="picker__search"><fvdr-search placeholder="Search people" [(ngModel)]="peopleQuery" /></div>
              <div class="picker__list">
                <label class="picker__row" *ngFor="let p of filteredPeople">
                  <fvdr-checkbox [checked]="draft.addedBy.has(p.name)" (checkedChange)="toggleIn(draft.addedBy, p.name)" />
                  <fvdr-avatar [initials]="p.initials" size="sm" />
                  <span class="picker__name">{{ p.name }}</span>
                </label>
              </div>
              <div class="sheet__footer">
                <fvdr-btn class="cta" size="l" variant="primary" label="Done" (clicked)="peopleOpen = false" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--color-stone-200); font-family: var(--font-family); color: var(--color-text-primary); }

    .page { display: flex; gap: var(--space-10); justify-content: center; align-items: flex-start; padding: var(--space-10) var(--space-6); }

    /* ── Notes panel ── */
    .notes { width: 420px; flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: var(--space-10); max-height: calc(100vh - 80px); overflow-y: auto; padding-right: var(--space-2); }
    .notes__eyebrow { font-size: var(--text-caption1-size); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-primary-500); }
    .notes__title { margin: 0; font-size: var(--text-h2-size); font-weight: 600; }
    .notes__lead { margin: 0; font-size: var(--text-body3-size); line-height: 20px; color: var(--color-text-secondary); }
    .notes__h { margin: var(--space-2) 0 0; font-size: var(--text-label-m-size); font-weight: 600; }
    .notes__list { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); font-size: var(--text-body3-size); line-height: 20px; color: var(--color-text-secondary); }
    .notes__list b { color: var(--color-text-primary); font-weight: 600; }
    .notes__tries { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .try { height: var(--space-8); padding: 0 var(--space-3); border: 1px solid var(--color-stone-400); border-radius: var(--radius-sm); background: var(--color-stone-0); font: inherit; font-size: var(--text-body3-size); color: var(--color-text-primary); cursor: pointer; }
    .try:hover { background: var(--color-hover-bg); }

    /* ── Phone frame ── */
    .phone { flex-shrink: 0; padding: var(--space-3); background: var(--color-stone-900); border-radius: 44px; box-shadow: var(--shadow-modal); }
    .screen { position: relative; width: 390px; height: 800px; background: var(--color-stone-0); border-radius: 32px; overflow: hidden; overflow: clip; display: flex; flex-direction: column; }

    /* ── List screen ── */
    .m-header { height: 64px; flex-shrink: 0; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-6) var(--space-4) 0; }
    .m-header__back { font-size: var(--space-5); color: var(--color-stone-700); }
    .m-header__title { flex: 1; font-size: var(--text-label-l-size); font-weight: 600; }
    .icon-btn { position: relative; width: var(--space-10); height: var(--space-10); display: flex; align-items: center; justify-content: center; border: none; background: none; border-radius: var(--radius-sm); color: var(--color-stone-900); font-size: var(--space-5); cursor: pointer; }
    .icon-btn:hover { background: var(--color-hover-bg); }
    .icon-btn__badge { position: absolute; top: var(--space-1); right: 2px; min-width: var(--space-4); height: var(--space-4); padding: 0 var(--space-1); border-radius: var(--radius-full); background: var(--color-primary-500); color: var(--color-stone-0); font-size: var(--text-caption2-size); font-weight: 600; line-height: 16px; }

    .applied { display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-4); overflow-x: auto; flex-shrink: 0; align-items: center; scrollbar-width: none; }
    .applied fvdr-chip { flex-shrink: 0; }
    .applied .link { flex-shrink: 0; }

    .list-meta { padding: var(--space-2) var(--space-4); font-size: var(--text-caption1-size); color: var(--color-text-secondary); border-bottom: 1px solid var(--color-divider); flex-shrink: 0; }
    .list { flex: 1; overflow-y: auto; }
    .row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .row__body { flex: 1; min-width: 0; }
    .row__name { font-size: var(--text-body3-size); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row__meta { font-size: var(--text-caption1-size); color: var(--color-text-secondary); margin-top: 2px; }
    .row__more { color: var(--color-stone-600); font-size: var(--space-4); }
    .empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-16) var(--space-6); text-align: center; }
    .empty__icon { font-size: var(--space-8); color: var(--color-stone-500); }
    .empty__title { font-size: var(--text-label-m-size); font-weight: 600; }

    .link { border: none; background: none; padding: 0; font: inherit; font-size: var(--text-body3-size); color: var(--color-primary-500); cursor: pointer; white-space: nowrap; }
    .link:hover { color: var(--color-primary-600); }
    .link:disabled { color: var(--color-text-disabled); cursor: default; }
    .link--block { display: block; margin-top: var(--space-3); }

    /* ── Sheet ── */
    .sheet { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; background: var(--color-stone-0); overflow: clip; transform: translateY(100%); visibility: hidden; transition: transform 0.28s ease, visibility 0s linear 0.28s; }
    .sheet--open { transform: translateY(0); visibility: visible; transition: transform 0.28s ease; }
    .sheet__header { height: 80px; flex-shrink: 0; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-6) var(--space-3) 0 var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .sheet__title { flex: 1; font-size: var(--text-label-l-size); font-weight: 600; }
    .sheet__body { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
    .sheet__footer { flex-shrink: 0; padding: var(--space-4) var(--space-4) var(--space-8); border-top: 1px solid var(--color-divider); background: var(--color-stone-0); }
    .cta { display: block; }
    .cta ::ng-deep button { width: 100%; }

    /* Improved (Figma 30138-310856): sections — 16px padding, title 15/600 + chevron, 12px to content */
    .sec { padding: var(--space-4); border-bottom: 1px solid var(--color-divider); display: flex; flex-direction: column; gap: var(--space-3); }
    .sec__head { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0; border: none; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
    .sec__title { font-size: var(--text-label-m-size); font-weight: 600; line-height: 20px; }
    .sec__chev { color: var(--color-stone-700); font-size: var(--space-4); flex-shrink: 0; }
    .sec__body { display: flex; flex-direction: column; gap: var(--space-2); }
    .sec--action { padding-top: var(--space-2); padding-bottom: var(--space-2); }
    .sec__headrow { min-height: var(--space-10); display: flex; align-items: center; justify-content: space-between; }
    .sub { font-size: var(--text-label-s-size); font-weight: 600; line-height: 20px; }
    .sub + .opts { margin-top: 0; }
    .opts + .sub { margin-top: var(--space-2); }
    .dp { display: block; }
    /* Mobile field per Figma: 48px, 16px text */
    .dp ::ng-deep .dp__trigger { height: var(--space-12); padding: 0 var(--space-4); border-color: var(--color-stone-500); }
    .dp ::ng-deep .dp__value { font-size: var(--text-label-l-size); }

    /* Item type tree */
    .tree__row { display: flex; align-items: center; gap: var(--space-4); min-height: var(--space-12); }
    .tree__label { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; padding: 0; border: none; background: none; font: inherit; font-size: var(--text-label-m-size); font-weight: 600; line-height: 20px; color: var(--color-text-primary); text-align: left; cursor: pointer; }
    .tree__label--static { cursor: default; }
    .tree__children { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.24s ease; }
    .tree__children--open { grid-template-rows: 1fr; }
    .tree__children-inner { overflow: hidden; }
    .grp { padding: var(--space-2) 0 var(--space-2) var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .grp__head { display: flex; align-items: center; }
    .grp__head fvdr-checkbox ::ng-deep .checkbox-wrapper { gap: 10px; }
    .grp__label { font-size: var(--text-label-s-size); font-weight: 600; line-height: 20px; color: var(--color-text-primary); }

    .people { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
    .link--sm { align-self: flex-start; font-size: var(--text-body3-size); margin-top: var(--space-2); }

    /* Option buttons (Figma "Button" toggle, 40px) */
    .opts { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .opt { height: var(--space-10); padding: 0 var(--space-4); display: inline-flex; align-items: center; gap: var(--space-1); border: 1px solid var(--color-stone-500); border-radius: var(--radius-sm); background: var(--color-stone-0); font: inherit; font-size: var(--text-btn-m-size); color: var(--color-stone-800); cursor: pointer; transition: background 0.12s ease, border-color 0.12s ease; }
    .opt:disabled { cursor: not-allowed; color: var(--color-text-disabled); border-color: var(--color-stone-400); }
    .opt--grey { background: var(--color-stone-300); }
    .opt--new.opt--on { background: var(--color-primary-50); border-color: var(--color-primary-50); color: var(--color-primary-500); }
    .opt--new.opt--on:hover { background: var(--color-primary-100); border-color: var(--color-primary-100); }

    /* Original (Figma as-is) */
    .o-sec { padding: var(--space-3) var(--space-4) var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .o-row { display: flex; align-items: center; justify-content: space-between; }
    .o-title { font-size: var(--text-label-m-size); font-weight: 600; }
    .o-title--l { font-size: var(--text-label-l-size); }
    .o-sub { font-size: var(--text-label-s-size); font-weight: 600; margin-top: var(--space-2); }
    .o-grp { display: flex; flex-direction: column; gap: var(--space-2); }

    /* People picker */
    .picker { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; background: var(--color-stone-0); transform: translateX(100%); visibility: hidden; transition: transform 0.24s ease, visibility 0s linear 0.24s; }
    .picker--open { transform: translateX(0); visibility: visible; transition: transform 0.24s ease; }
    .picker__search { padding: var(--space-3) var(--space-4); }
    .picker__list { flex: 1; overflow-y: auto; }
    .picker__row { display: flex; align-items: center; gap: var(--space-3); min-height: 52px; padding: 0 var(--space-4); border-bottom: 1px solid var(--color-stone-200); cursor: pointer; }
    .picker__name { font-size: var(--text-body3-size); }

    /* Real phones: drop the frame and the notes, the prototype is the screen */
    @media (max-width: 900px) {
      .page { flex-direction: column-reverse; align-items: stretch; padding: 0; gap: 0; }
      .notes { width: auto; position: static; max-height: none; padding: var(--space-6) var(--space-4); }
      .phone { padding: 0; border-radius: 0; background: none; box-shadow: none; }
      .screen { width: 100%; height: 100vh; height: 100dvh; border-radius: 0; }
    }
  `],
})
export class MobileDocFiltersComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  readonly groups = FORMAT_GROUPS;
  readonly regions = REGIONS;
  readonly departments = DEPARTMENTS;
  readonly viewedOpts = VIEWED_OPTS;
  readonly redactionOpts = REDACTION_OPTS;
  readonly dateOpts = DATE_OPTS;
  readonly toggleIn = toggleIn;
  readonly modeItems: SegmentItem[] = [{ id: 'improved', label: 'Improved' }, { id: 'original', label: 'Figma original' }];

  private readonly items = buildItems();
  readonly totalFiles = this.items.filter(i => !i.isFolder).length;
  readonly totalFolders = this.items.length - this.totalFiles;

  mode: Mode = 'improved';
  readonly allFormatsCount = ALL_FORMATS.length;
  applied: FilterState = improvedState();
  draft: FilterState = cloneState(this.applied);
  sheetOpen = true;
  peopleOpen = false;
  peopleQuery = '';
  showAllDepts = true;

  open: Record<SectionId | 'formats', boolean> = {
    type: true, formats: true, added: true, addedBy: true, viewed: true, redaction: true, labels: true, area: true,
  };

  ngOnInit(): void { this.tracker.trackPageView('mobile-doc-filters'); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  // ── Mode / demo shortcuts ──────────────────────────────────
  setMode(m: Mode): void {
    this.mode = m;
    this.tryReset();
  }

  tryFiles(): void {
    this.sheetOpen = true;
    this.open.type = true;
    this.open.formats = true;
    if (this.mode === 'improved') this.toggleFiles();
    else this.draft.filesChip = !this.draft.filesChip;
  }

  tryFolders(): void {
    this.sheetOpen = true;
    this.open.type = true;
    this.open.formats = true;
    this.draft = emptyState();
    this.draft.folders = true;
    this.draft.formats.add('DOC');
  }

  tryFoldersOnly(): void {
    this.sheetOpen = true;
    this.open.type = this.open.redaction = true;
    this.draft = emptyState();
    this.draft.folders = true;
    this.draft.redaction.add('applied');
  }

  tryReset(): void {
    this.applied = this.mode === 'improved' ? improvedState() : figmaState();
    this.draft = cloneState(this.applied);
    this.sheetOpen = true;
    this.peopleOpen = false;
    this.open.formats = true;
  }

  // ── Sheet lifecycle ────────────────────────────────────────
  openSheet(): void { this.draft = cloneState(this.applied); this.sheetOpen = true; }
  closeSheet(): void { this.sheetOpen = false; this.peopleOpen = false; }
  applyDraft(): void { this.applied = cloneState(this.draft); this.sheetOpen = false; }
  resetDraft(): void { this.draft = emptyState(); }
  clearApplied(): void { this.applied = emptyState(); }
  toggleSection(id: SectionId): void { this.open[id] = !this.open[id]; }
  syncDate(): void { this.draft.addedOn = this.draft.rangeStart ? 'custom' : 'any'; }
  openPeople(): void { this.peopleQuery = ''; this.peopleOpen = true; }

  // ── Item type: Files ⊃ groups ⊃ formats, Folders is a leaf ─
  get filesState(): 'all' | 'some' | 'none' {
    const n = this.draft.formats.size;
    return n === 0 ? 'none' : n === ALL_FORMATS.length ? 'all' : 'some';
  }

  toggleFiles(): void {
    // Partial or empty → select every format. All → clear. Folders untouched.
    this.draft.formats = this.filesState === 'all' ? new Set() : new Set(ALL_FORMATS);
  }

  groupSelected(g: FormatGroup): number { return g.formats.filter(f => this.draft.formats.has(f)).length; }

  groupState(g: FormatGroup): 'all' | 'some' | 'none' {
    const n = this.groupSelected(g);
    return n === 0 ? 'none' : n === g.formats.length ? 'all' : 'some';
  }

  toggleGroup(g: FormatGroup): void {
    const selectAll = this.groupState(g) !== 'all';
    g.formats.forEach(f => (selectAll ? this.draft.formats.add(f) : this.draft.formats.delete(f)));
  }

  toggleFormat(f: string): void { toggleIn(this.draft.formats, f); }

  toggleViewed(id: ViewedId): void {
    const s = this.draft.viewed;
    // "Viewed by me" and "Not viewed by me" together cancel out — keep them mutually exclusive.
    const opposite: Record<ViewedId, ViewedId> = { me: 'notMe', notMe: 'me', group: 'notGroup', notGroup: 'group' };
    if (!s.has(id)) s.delete(opposite[id]);
    toggleIn(s, id);
  }

  toggleArea(a: 'titles' | 'content'): void {
    toggleIn(this.draft.searchArea, a);
  }

  /** Only folders are in scope → file-only filters don't apply. */
  get foldersOnly(): boolean { return this.draft.folders && this.draft.formats.size === 0; }







  get addedByList(): string[] { return [...this.draft.addedBy]; }
  get visibleDepartments(): string[] { return this.showAllDepts ? DEPARTMENTS : DEPARTMENTS.slice(0, 4); }
  get filteredPeople(): Person[] {
    const q = this.peopleQuery.trim().toLowerCase();
    return q ? PEOPLE.filter(p => p.name.toLowerCase().includes(q)) : PEOPLE;
  }

  dateLabel(s: FilterState): string {
    if (s.addedOn === 'custom') {
      if (!s.rangeStart) return 'Custom range';
      const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return s.rangeEnd ? `${f(s.rangeStart)} – ${f(s.rangeEnd)}` : f(s.rangeStart);
    }
    return DATE_OPTS.find(d => d.id === s.addedOn)!.label;
  }

  // ── Results ────────────────────────────────────────────────
  get draftResults(): DocItem[] { return this.run(this.draft); }
  get appliedResults(): DocItem[] { return this.run(this.applied); }

  private run(s: FilterState): DocItem[] {
    const now = Date.now();
    const DAY = 86_400_000;
    return this.items.filter(it => {
      // Item type
      if (this.mode === 'improved') {
        if (s.folders || s.formats.size) {
          const ok = it.isFolder ? s.folders : s.formats.has(it.format);
          if (!ok) return false;
        }
      } else {
        // Figma as-is: item type and formats are two independent AND-ed filters
        if (s.filesChip || s.folders) {
          if (!((s.filesChip && !it.isFolder) || (s.folders && it.isFolder))) return false;
        }
        if (s.formats.size && (it.isFolder || !s.formats.has(it.format))) return false;
      }
      // Added on
      if (s.addedOn === 'today' && it.daysAgo > 0) return false;
      if (s.addedOn === '7d' && it.daysAgo > 7) return false;
      if (s.addedOn === '30d' && it.daysAgo > 30) return false;
      if (s.addedOn === 'custom' && s.rangeStart) {
        const added = now - it.daysAgo * DAY;
        const end = (s.rangeEnd ?? s.rangeStart).getTime() + DAY;
        if (added < s.rangeStart.getTime() || added > end) return false;
      }
      if (s.addedBy.size && !s.addedBy.has(it.addedBy)) return false;
      // Viewed (OR within the group)
      if (s.viewed.size) {
        const hit = (s.viewed.has('me') && it.viewedByMe) || (s.viewed.has('notMe') && !it.viewedByMe)
          || (s.viewed.has('group') && it.viewedByGroup) || (s.viewed.has('notGroup') && !it.viewedByGroup);
        if (!hit) return false;
      }
      // Redaction — ignored while only folders are in scope (improved), otherwise excludes folders
      const redactionActive = s.redaction.size && !(this.mode === 'improved' && s.folders && s.formats.size === 0);
      if (redactionActive && (!it.redaction || !s.redaction.has(it.redaction))) return false;
      if (s.regions.size && !s.regions.has(it.region)) return false;
      if (s.departments.size && !s.departments.has(it.department)) return false;
      return true;
    });
  }

  // ── Applied chips on the list ──────────────────────────────
  get appliedChips(): AppliedChip[] {
    const s = this.applied;
    const chips: AppliedChip[] = [];
    if (this.mode === 'improved') {
      const n = s.formats.size;
      if (n === ALL_FORMATS.length) chips.push({ key: 'files', label: 'All files', remove: () => (s.formats = new Set()) });
      else if (n) {
        FORMAT_GROUPS.forEach(g => {
          const sel = g.formats.filter(f => s.formats.has(f));
          if (sel.length === g.formats.length) chips.push({ key: g.id, label: g.label, remove: () => g.formats.forEach(f => s.formats.delete(f)) });
          else sel.forEach(f => chips.push({ key: f, label: f, remove: () => s.formats.delete(f) }));
        });
      }
    } else {
      if (s.filesChip) chips.push({ key: 'files', label: 'Files', remove: () => (s.filesChip = false) });
      s.formats.forEach(f => chips.push({ key: f, label: f, remove: () => s.formats.delete(f) }));
    }
    if (s.folders) chips.push({ key: 'folders', label: 'Folders', remove: () => (s.folders = false) });
    if (s.addedOn !== 'any' && (s.addedOn !== 'custom' || s.rangeStart))
      chips.push({ key: 'date', label: this.dateLabel(s), remove: () => { s.addedOn = 'any'; s.rangeStart = s.rangeEnd = undefined; } });
    if (s.addedBy.size)
      chips.push({ key: 'by', label: s.addedBy.size === 1 ? [...s.addedBy][0] : `Added by · ${s.addedBy.size}`, remove: () => s.addedBy.clear() });
    s.viewed.forEach(v => chips.push({ key: 'v' + v, label: VIEWED_OPTS.find(o => o.id === v)!.label, remove: () => s.viewed.delete(v) }));
    s.redaction.forEach(r => chips.push({ key: 'r' + r, label: 'Redaction: ' + REDACTION_OPTS.find(o => o.id === r)!.label, remove: () => s.redaction.delete(r) }));
    s.regions.forEach(r => chips.push({ key: 'rg' + r, label: r, remove: () => s.regions.delete(r) }));
    s.departments.forEach(d => chips.push({ key: 'd' + d, label: d, remove: () => s.departments.delete(d) }));
    return chips;
  }

  get appliedCount(): number { return this.appliedChips.length; }
  get draftCount(): number {
    const s = this.draft;
    return s.formats.size + (s.filesChip ? 1 : 0) + (s.folders ? 1 : 0) + (s.addedOn !== 'any' ? 1 : 0) + s.addedBy.size
      + s.viewed.size + s.redaction.size + s.regions.size + s.departments.size + s.searchArea.size;
  }

  trackKey = (_: number, c: AppliedChip) => c.key;
  trackId = (_: number, it: DocItem) => it.id;
}
