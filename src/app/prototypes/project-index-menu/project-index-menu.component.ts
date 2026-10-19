import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, FvdrIconName, SegmentItem, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

/** Context the Documents table is in — drives the Project index menu content. */
type ViewId = 'folder' | 'recent' | 'new' | 'unpublished' | 'favorites';
type OptionId = 'o1' | 'o2';

interface MenuItem { label: string; icon: FvdrIconName; }
interface MenuGroup { title: string; items: MenuItem[]; }

interface DocRow { id: number; index: string; name: string; }

const ROWS: DocRow[] = [
  { id: 1, index: '1', name: 'ODM intellectual property' },
  { id: 2, index: '2', name: 'Intellectual property' },
  { id: 3, index: '3', name: 'Trade secrets' },
  { id: 4, index: '4', name: 'ACME Inc.' },
  { id: 5, index: '5', name: 'ACME Cooperative' },
];

/** Mock contents shown when a top-level folder is opened. */
const SUBFOLDERS = ['Agreements', 'Financial statements', 'Correspondence', 'Board minutes'];

const VIEW_LABEL: Record<ViewId, string> = {
  folder: '',
  recent: 'Recently viewed',
  new: 'Newly uploaded',
  unpublished: 'Unpublished',
  favorites: 'Favorites',
};

@Component({
  selector: 'fvdr-project-index-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Option switcher (prototype control) ── -->
  <div class="proto-bar">
    <span class="proto-bar__label">Project index menu · with permission</span>
    <fvdr-segment [items]="optionItems" [activeId]="option" (activeIdChange)="setOption($event)"></fvdr-segment>
    <span class="proto-bar__hint">{{ option === 'o1' ? 'Divide into groups (context / Project)' : 'Change copy (Export / Manage)' }}</span>
  </div>

  <div class="app">
    <!-- ── Main menu (collapsed rail) ── -->
    <aside class="rail">
      <div class="rail__logo"><span class="rail__logo-mark">N</span></div>
      <nav class="rail__nav">
        <span class="rail__item" *ngFor="let n of navTop" [class.rail__item--active]="n === 'documents-active'">
          <fvdr-icon [name]="n"></fvdr-icon>
        </span>
        <span class="rail__item" *ngFor="let n of navBottom"><fvdr-icon [name]="n"></fvdr-icon></span>
      </nav>
      <div class="rail__brand"></div>
    </aside>

    <div class="main">
      <!-- Desktop header -->
      <header class="header">
        <div class="crumbs">
          <span [class.crumbs__link]="crumbLabel || folder" (click)="resetContext()">Documents</span>
          <ng-container *ngIf="folder && !crumbLabel">
            <fvdr-icon name="chevron-right" class="crumbs__sep"></fvdr-icon>
            <span>{{ folder.index }} {{ folder.name }}</span>
          </ng-container>
          <ng-container *ngIf="crumbLabel">
            <fvdr-icon name="chevron-right" class="crumbs__sep"></fvdr-icon>
            <span>{{ crumbLabel }}</span>
          </ng-container>
        </div>
        <div class="header__actions">
          <fvdr-icon name="theme-dark"></fvdr-icon>
          <fvdr-icon name="help"></fvdr-icon>
          <fvdr-icon name="nav-applications"></fvdr-icon>
          <span class="header__avatar">TN</span>
        </div>
      </header>

      <div class="midgard">
        <!-- Top panel -->
        <div class="top-panel">
          <div class="top-panel__btns">
            <fvdr-btn *ngIf="view === 'folder' && !isNarrowed" label="Add" iconName="plus" variant="primary"></fvdr-btn>
            <fvdr-btn label="Download" iconName="download" variant="secondary"></fvdr-btn>

            <div class="pi" [class.pi--open]="menuOpen" (click)="$event.stopPropagation()">
              <fvdr-btn label="Project index" iconName="index-list" variant="secondary" dataTrack="project-index-open"
                        (clicked)="toggleMenu()"></fvdr-btn>

              <div class="droplist" *ngIf="menuOpen">
                <ng-container *ngFor="let g of menu; let first = first">
                  <div class="droplist__sep" *ngIf="!first"><span></span></div>
                  <div class="droplist__group" [class.droplist__group--next]="!first">{{ g.title }}</div>
                  <button class="droplist__item" *ngFor="let it of g.items"
                          [attr.data-track]="'pi-' + it.label" (click)="pick(g, it)">
                    <fvdr-icon [name]="it.icon"></fvdr-icon>
                    <span>{{ it.label }}</span>
                  </button>
                </ng-container>
              </div>
            </div>

            <button class="icon-btn"><fvdr-icon name="more"></fvdr-icon></button>
            <span class="top-panel__selected" *ngIf="selected.size">Selected: {{ selected.size }}</span>
          </div>

          <div class="top-panel__right">
            <button class="icon-btn"><fvdr-icon name="view-as"></fvdr-icon></button>
            <div class="search">
              <fvdr-icon name="search" class="search__icon"></fvdr-icon>
              <input class="search__input" placeholder="Search" [(ngModel)]="query" (ngModelChange)="onNarrowChange()" />
              <button class="search__filter" [class.search__filter--on]="filterOn" title="Filters" (click)="toggleFilter()">
                <fvdr-icon name="settings-v"></fvdr-icon>
                <span class="search__dot" *ngIf="filterOn"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Quick access + folder structure -->
          <div class="side">
            <div class="quick">
              <div class="quick__views">
                <button class="quick__btn" *ngFor="let q of quickViews" [title]="q.label"
                        [class.quick__btn--on]="view === q.id" (click)="setView(q.id)">
                  <fvdr-icon [name]="q.icon"></fvdr-icon>
                </button>
              </div>
              <div class="quick__tools">
                <span class="quick__tool"><fvdr-icon name="angles-up-down"></fvdr-icon></span>
                <span class="quick__tool"><fvdr-icon name="chevron-left"></fvdr-icon></span>
              </div>
            </div>

            <div class="tree">
              <div class="tree__root" [class.tree__row--sel]="!folder && view === 'folder' && !isNarrowed" (click)="resetContext()">
                <span class="tree__project">N</span>
                <span>Nike</span>
              </div>
              <div class="tree__row" *ngFor="let r of rows; let i = index"
                   [class.tree__row--sel]="folder?.id === r.id && view === 'folder' && !isNarrowed" (click)="openFolder(r)">
                <span class="tree__icons">
                  <fvdr-icon *ngIf="i === 0" name="chevron-right" class="tree__chev"></fvdr-icon>
                  <span *ngIf="i !== 0" class="tree__chev-space"></span>
                  <fvdr-icon name="folder-colored" class="tree__folder"></fvdr-icon>
                </span>
                <span class="tree__txt"><span>{{ r.index }}</span><span>{{ r.name }}</span></span>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="table">
            <div class="table__head">
              <span class="c-check">
                <fvdr-checkbox [checked]="allSelected" [indeterminate]="someSelected"
                               (checkedChange)="toggleAll()"></fvdr-checkbox>
              </span>
              <span class="c-index">Index <fvdr-icon name="sort" class="th-icon"></fvdr-icon></span>
              <span class="c-name">Name</span>
              <span class="c-pages">Pages <fvdr-icon name="sort" class="th-icon"></fvdr-icon></span>
              <span class="c-date">Added on <fvdr-icon name="sort-down" class="th-icon"></fvdr-icon></span>
              <span class="c-cols"><fvdr-icon name="table-view"></fvdr-icon></span>
            </div>
            <div class="table__body">
              <div class="table__row" *ngFor="let r of visibleRows; trackBy: trackRow" [class.table__row--sel]="selected.has(r.id)"
                   (click)="toggleRow(r.id)" (dblclick)="!folder && openFolder(r)">
                <span class="c-check"><fvdr-checkbox [checked]="selected.has(r.id)"></fvdr-checkbox></span>
                <span class="c-index"><fvdr-icon name="folder-colored" class="tree__folder"></fvdr-icon>{{ r.index }}</span>
                <span class="c-name">{{ r.name }}</span>
                <span class="c-pages">—</span>
                <span class="c-date">Nov 16, 2021</span>
                <span class="c-cols"></span>
              </div>
              <div class="table__empty" *ngIf="!visibleRows.length">No matching items</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <fvdr-toast-host></fvdr-toast-host>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: var(--font-family); color: var(--color-text-primary); }
    .page { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-page); }
    button { font-family: inherit; }

    /* prototype bar */
    .proto-bar {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-2) var(--space-6);
      background: var(--color-bg-surface); border-bottom: 1px solid var(--color-divider);
      font-size: var(--font-size-sm);
    }
    .proto-bar__label { font-weight: var(--font-weight-semi); white-space: nowrap; }
    .proto-bar__hint { color: var(--color-text-muted); }

    .app { flex: 1; display: flex; min-height: 0; }

    /* ── Main menu rail (72px) ── */
    .rail {
      width: var(--space-18); flex-shrink: 0; display: flex; flex-direction: column; align-items: center;
      background: var(--color-bg-surface); border-right: 1px solid var(--color-divider);
    }
    .rail__logo { height: calc(var(--space-16) + var(--space-4)); display: flex; align-items: center; }
    .rail__logo-mark {
      width: var(--space-10); height: var(--space-10); border-radius: var(--radius-sm);
      background: var(--color-text-primary); color: var(--color-text-inverse);
      display: flex; align-items: center; justify-content: center; font-weight: var(--font-weight-bold);
    }
    .rail__nav { flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-8); padding-top: var(--space-3); }
    .rail__item { font-size: var(--space-6); color: var(--color-icon); display: flex; cursor: pointer; }
    .rail__item:hover { color: var(--color-text-primary); }
    .rail__item--active { color: var(--color-text-primary); }
    .rail__brand {
      width: var(--space-8); height: var(--space-8); margin: var(--space-6) 0;
      border-radius: var(--radius-full); background: var(--color-interactive-primary);
    }

    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    /* ── Desktop header (64px) ── */
    .header {
      height: var(--space-16); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-6); border-bottom: 1px solid var(--color-divider); background: var(--color-bg-page);
    }
    .crumbs {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: var(--font-size-lg); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi);
    }
    .crumbs__link { cursor: pointer; font-weight: var(--font-weight-regular); color: var(--color-text-secondary); }
    .crumbs__link:hover { color: var(--color-interactive-primary); }
    .crumbs__sep { font-size: var(--font-size-lg); color: var(--color-icon-muted); }
    .header__actions { display: flex; align-items: center; gap: var(--space-6); font-size: var(--space-6); color: var(--color-icon); }
    .header__avatar {
      width: var(--space-10); height: var(--space-10); border-radius: var(--radius-full);
      background: var(--color-selection-bg); color: var(--color-text-primary);
      display: flex; align-items: center; justify-content: center; font-size: var(--font-size-lg);
    }

    /* ── Midgard ── */
    .midgard { flex: 1; min-height: 0; overflow: auto; padding: var(--space-6); }

    .top-panel { height: var(--space-10); display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); }
    .top-panel__btns { display: flex; align-items: center; gap: var(--space-4); }
    .top-panel__selected { font-size: var(--font-size-base); color: var(--color-text-secondary); white-space: nowrap; }
    .top-panel__right { display: flex; align-items: center; gap: var(--space-4); }
    .icon-btn {
      width: var(--space-10); height: var(--space-10); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--color-border-input); border-radius: var(--radius-sm); background: var(--color-bg-page);
      font-size: var(--font-size-lg); color: var(--color-interactive-secondary); cursor: pointer;
    }
    .icon-btn:hover { background: var(--color-bg-surface); }

    /* Project index trigger + droplist */
    .pi { position: relative; flex-shrink: 0; }
    .pi--open ::ng-deep .btn { background: var(--color-hover-bg); }
    .droplist {
      position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: var(--z-dropdown);
      min-width: calc(var(--space-16) * 3 + var(--space-12)); width: max-content; padding: var(--space-2) 0;
      background: var(--color-bg-page); border-radius: var(--radius-sm); box-shadow: var(--shadow-popup);
    }
    .droplist__group {
      height: var(--space-8); display: flex; align-items: center; padding: 0 var(--space-3);
      font-size: var(--font-size-base); line-height: var(--line-height-base); font-weight: var(--font-weight-semi);
    }
    .droplist__group--next { height: calc(var(--space-8) + var(--space-1)); padding-top: var(--space-1); }
    .droplist__item {
      width: 100%; height: var(--space-8); display: flex; align-items: center; gap: var(--space-3);
      padding: 0 var(--space-4) 0 var(--space-3); border: 0; background: none; text-align: left; cursor: pointer; white-space: nowrap;
      font-size: var(--font-size-base); line-height: var(--line-height-base); color: var(--color-text-primary);
    }
    .droplist__item:hover { background: var(--color-hover-bg); }
    .droplist__item fvdr-icon { font-size: var(--font-size-lg); color: var(--color-icon); }
    .droplist__sep { height: var(--space-2); display: flex; align-items: center; }
    .droplist__sep span { flex: 1; height: 1px; background: var(--color-divider); }

    /* Search */
    .search {
      width: calc(var(--space-16) * 5 - var(--space-4)); height: var(--space-10);
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4);
      border: 1px solid var(--color-border-input); border-radius: var(--radius-sm); background: var(--color-bg-page);
    }
    .search:focus-within { border-color: var(--color-interactive-primary); }
    .search__icon { font-size: var(--font-size-lg); color: var(--color-icon); }
    .search__input {
      flex: 1; min-width: 0; border: 0; outline: 0; font: inherit;
      font-size: var(--font-size-md); line-height: var(--line-height-lg); color: var(--color-text-primary);
    }
    .search__input::placeholder { color: var(--color-text-subtle); }
    .search__filter {
      position: relative; display: flex; border: 0; background: none; cursor: pointer; padding: 0;
      font-size: var(--font-size-lg); color: var(--color-icon);
    }
    .search__filter--on { color: var(--color-interactive-primary); }
    .search__dot {
      position: absolute; top: calc(var(--space-1) * -1); right: calc(var(--space-1) * -1);
      width: var(--space-2); height: var(--space-2);
      border-radius: var(--radius-full); background: var(--color-interactive-primary);
    }

    /* ── Content ── */
    .content { display: flex; gap: var(--space-6); align-items: flex-start; }

    .side { width: calc(var(--space-16) * 5); flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .quick {
      height: var(--space-12); display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-4) 0 var(--space-2); background: var(--color-bg-surface); border-radius: var(--radius-sm);
    }
    .quick__views { display: flex; gap: var(--space-2); }
    .quick__btn {
      width: var(--space-8); height: var(--space-8); display: flex; align-items: center; justify-content: center;
      border: 0; border-radius: var(--radius-full); background: none; cursor: pointer;
      font-size: var(--font-size-lg); color: var(--color-icon);
    }
    .quick__btn:hover { background: var(--color-hover-bg); }
    .quick__btn--on { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .quick__tools { display: flex; gap: var(--space-2); }
    .quick__tool {
      width: var(--space-6); height: var(--space-6); display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-lg); color: var(--color-icon);
    }

    .tree { font-size: var(--font-size-base); line-height: var(--line-height-base); }
    .tree__root, .tree__row { height: var(--space-10); display: flex; align-items: center; gap: var(--space-3); border-radius: var(--radius-sm); }
    .tree__root { padding-left: var(--space-3); cursor: pointer; }
    .tree__root:hover, .tree__row:hover { background: var(--color-bg-surface); }
    .tree__row { padding-left: var(--space-4); cursor: pointer; }
    .tree__row--sel, .tree__row--sel:hover { background: var(--color-selected-row); }
    .tree__project {
      width: var(--space-6); height: var(--space-6); border-radius: var(--radius-sm);
      background: var(--color-text-primary); color: var(--color-text-inverse);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
    }
    .tree__icons { display: flex; align-items: center; gap: var(--space-2); }
    .tree__chev { font-size: var(--font-size-lg); color: var(--color-icon); }
    .tree__chev-space { width: var(--space-4); }
    .tree__folder { font-size: var(--font-size-2xl); color: var(--color-interactive-primary); }
    .tree__txt { display: flex; gap: var(--space-2); white-space: nowrap; overflow: hidden; }

    /* Table */
    .table { flex: 1; min-width: 0; font-size: var(--font-size-base); line-height: var(--line-height-base); }
    .table__head {
      height: var(--space-12); display: flex; align-items: center;
      background: var(--color-bg-surface); border-radius: var(--radius-sm);
      font-weight: var(--font-weight-semi);
    }
    .table__body { margin-top: var(--space-2); }
    .table__row { height: var(--space-10); display: flex; align-items: center; cursor: pointer; border-radius: var(--radius-sm); }
    .table__row:hover { background: var(--color-bg-surface); }
    .table__row--sel, .table__row--sel:hover { background: var(--color-selected-row); }
    .table__empty { padding: var(--space-8); text-align: center; color: var(--color-text-muted); }
    .th-icon { font-size: var(--font-size-lg); color: var(--color-icon); }

    .c-check { width: var(--space-8); padding-left: var(--space-4); display: flex; flex-shrink: 0; }
    .c-index {
      width: calc(var(--space-16) + var(--space-8)); flex-shrink: 0;
      display: flex; align-items: center; gap: var(--space-4); padding: 0 var(--space-4);
    }
    .table__head .c-index { gap: var(--space-2); }
    .c-name { flex: 1; min-width: 0; padding: 0 var(--space-4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .c-pages { width: calc(var(--space-16) + var(--space-8)); flex-shrink: 0; display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); }
    .c-date { width: calc(var(--space-16) * 2 - var(--space-2)); flex-shrink: 0; display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4); white-space: nowrap; }
    .c-cols { width: var(--space-12); flex-shrink: 0; display: flex; justify-content: center; font-size: var(--font-size-lg); color: var(--color-icon); }
  `],
})
export class ProjectIndexMenuComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  readonly optionItems: SegmentItem[] = [
    { id: 'o1', label: 'Option 1 · Groups' },
    { id: 'o2', label: 'Option 2 · Copy' },
  ];
  readonly navTop: FvdrIconName[] = [
    'nav-overview', 'documents-active', 'nav-participants', 'nav-permissions', 'nav-qa', 'nav-reports',
  ];
  readonly navBottom: FvdrIconName[] = ['nav-settings', 'nav-archiving', 'recycle-bin'];
  readonly quickViews: { id: ViewId; label: string; icon: FvdrIconName }[] = [
    { id: 'recent', label: 'Recently viewed', icon: 'history' },
    { id: 'new', label: 'Newly uploaded', icon: 'upload' },
    { id: 'unpublished', label: 'Unpublished', icon: 'cross-circle' },
    { id: 'favorites', label: 'Favorites', icon: 'favorites' },
  ];
  readonly rows = ROWS;

  option: OptionId = 'o1';
  view: ViewId = 'folder';
  menuOpen = false;
  query = '';
  filterOn = false;
  selected = new Set<number>();
  /** Folder opened from the left tree; null = project root (Nike). */
  folder: DocRow | null = null;
  /** Mock contents of the opened folder (built once per open so row identity is stable). */
  folderRows: DocRow[] = [];

  ngOnInit(): void {
    this.tracker.trackPageView('project-index-menu');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  // ── Context ──────────────────────────────────────────────

  get isSearch(): boolean { return this.query.trim().length > 0; }
  get isNarrowed(): boolean { return this.isSearch || this.filterOn; }

  /** Label of the active narrowing context (breadcrumb + context group), '' for a plain folder. */
  get contextLabel(): string {
    if (this.narrowCount >= 2) return 'Matching items';
    if (this.view !== 'folder') return VIEW_LABEL[this.view];
    if (this.isNarrowed) return 'Filtered items';
    return '';
  }

  /** How many narrowing types are active: quick view, search, filters. */
  get narrowCount(): number {
    return (this.view !== 'folder' ? 1 : 0) + (this.isSearch ? 1 : 0) + (this.filterOn ? 1 : 0);
  }

  /** Breadcrumb after “Documents”: quick view name, or “All” for search / filters. */
  get crumbLabel(): string {
    if (this.view !== 'folder') return VIEW_LABEL[this.view];
    return this.isNarrowed ? 'All' : '';
  }

  /** Icon of the context item in Option 2 (per Figma: History / upload / cross circle / Favorites / filter / Matching items). */
  get contextIcon(): FvdrIconName {
    if (this.narrowCount >= 2) return 'matching-items';
    if (this.view !== 'folder') return this.quickViews.find(q => q.id === this.view)!.icon;
    return 'filter';
  }

  get visibleRows(): DocRow[] {
    const q = this.query.trim().toLowerCase();
    let rows = this.folder ? this.folderRows : this.rows;
    if (this.view === 'recent') rows = rows.filter(r => r.id !== 4);
    if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q));
    return rows;
  }

  get hasSelection(): boolean { return this.selected.size > 0; }
  get allSelected(): boolean { return this.visibleRows.length > 0 && this.visibleRows.every(r => this.selected.has(r.id)); }
  get someSelected(): boolean { return this.selected.size > 0 && !this.allSelected; }

  // ── Menu content per option / context ────────────────────

  get menu(): MenuGroup[] {
    if (!this.folder && !this.contextLabel && !this.hasSelection) return this.menuProjectRoot();
    return this.option === 'o1' ? this.menuOption1() : this.menuOption2();
  }

  /** Project root (Nike), nothing selected — same for both options (Figma 39183:441890). */
  private menuProjectRoot(): MenuGroup[] {
    return [
      { title: 'Export', items: [
        { label: 'Full project index', icon: 'export' },
        { label: 'Custom project index', icon: 'settings-h' },
        { label: 'Index summary', icon: 'index-summary' },
      ] },
      { title: 'Manage', items: [
        { label: 'Rebuild index', icon: 'index-list' },
        { label: 'Bulk rename', icon: 'bulk-rename' },
      ] },
    ];
  }

  /** Option 1 — divide into groups: current scope (folder / selection / context) first, then “Project”. */
  private menuOption1(): MenuGroup[] {
    const ctx = this.contextLabel;
    if (ctx) {
      return [
        { title: ctx, items: [{ label: 'Export index', icon: 'export' }] },
        { title: 'Project', items: [
          { label: 'Export full index', icon: 'export' },
          { label: 'Export custom index', icon: 'settings-h' },
          { label: 'Bulk rename', icon: 'bulk-rename' },
          { label: 'Rebuild index', icon: 'index-list' },
          { label: 'Index summary', icon: 'index-summary' },
        ] },
      ];
    }
    // Selection at project root (Figma 39185:449973) vs inside an opened folder (Figma 39183:448953)
    const scope: MenuGroup = this.hasSelection && !this.folder
      ? { title: 'Selected', items: [
          { label: 'Export items', icon: 'export' },
          { label: 'Rebuild index', icon: 'index-list' },
        ] }
      : this.hasSelection
      ? { title: 'This folder', items: [
          { label: 'Export selected items', icon: 'export' },
          { label: 'Rebuild index', icon: 'index-list' },
        ] }
      : { title: 'This folder', items: [
          { label: 'Export index', icon: 'download-folder' },
          { label: 'Rebuild index', icon: 'index-list' },
        ] };
    return [
      scope,
      { title: 'Project', items: [
        { label: 'Export full index', icon: 'export' },
        { label: 'Export custom index', icon: 'settings-h' },
        { label: 'Bulk rename', icon: 'bulk-rename' },
        { label: 'Index summary', icon: 'index-summary' },
      ] },
    ];
  }

  /** Option 2 — change copy: “Export” (context first) + “Manage”. */
  private menuOption2(): MenuGroup[] {
    const first: MenuItem = this.contextLabel
      ? { label: this.contextLabel, icon: this.contextIcon }
      : this.hasSelection
        ? { label: 'Selected items', icon: 'export' }
        : { label: 'Current folder index', icon: 'folder' };
    return [
      { title: 'Export', items: [
        first,
        { label: 'Full project index', icon: 'export' },
        { label: 'Custom project index', icon: 'settings-h' },
        { label: 'Index summary across project', icon: 'index-summary' },
      ] },
      { title: 'Manage', items: [
        { label: 'Rebuild index in this folder', icon: 'index-list' },
        { label: 'Bulk rename across project', icon: 'bulk-rename' },
      ] },
    ];
  }

  // ── Interactions ─────────────────────────────────────────

  setOption(id: string): void {
    this.option = id as OptionId;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  closeMenu(): void { this.menuOpen = false; }

  pick(g: MenuGroup, it: MenuItem): void {
    this.menuOpen = false;
    this.tracker.trackTask('project-index-menu', 'task_complete');
    this.toast.show({ variant: 'success', title: g.title, message: `${it.label} — started` });
  }

  setView(id: ViewId): void {
    this.view = this.view === id ? 'folder' : id;
    this.folder = null;
    this.selected.clear();
    this.menuOpen = false;
  }

  openFolder(r: DocRow): void {
    this.folder = r;
    this.folderRows = SUBFOLDERS.map((name, i) => ({ id: r.id * 100 + i + 1, index: `${r.index}.${i + 1}`, name }));
    this.view = 'folder';
    this.query = '';
    this.filterOn = false;
    this.selected.clear();
    this.menuOpen = false;
  }

  resetContext(): void {
    this.folder = null;
    this.selected.clear();
    this.view = 'folder';
    this.query = '';
    this.filterOn = false;
    this.menuOpen = false;
  }

  toggleFilter(): void {
    this.filterOn = !this.filterOn;
    this.onNarrowChange();
  }

  onNarrowChange(): void {
    this.selected.clear();
    this.menuOpen = false;
  }

  trackRow(_: number, r: DocRow): number { return r.id; }

  toggleAll(): void {
    if (this.allSelected) this.selected.clear();
    else this.visibleRows.forEach(r => this.selected.add(r.id));
    this.menuOpen = false;
  }

  toggleRow(id: number): void {
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
    this.menuOpen = false;
  }
}
