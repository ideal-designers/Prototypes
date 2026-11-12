import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName, SegmentItem, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

/**
 * Insights → Documents dashboard → "Clean up" side panel.
 * Figma: fChBFcd7WAfqxq73sduKrn, section 39853:242465 ("Small updates").
 *   o1 — accordion groups (39858:243975 / 39869:377598, with context menu)
 *   o2 — groups with "N identical files" caption (39869:377919)
 *   o3 — groups as bordered blocks (39884:378656)
 */
type OptionId = 'o1' | 'o2' | 'o3';
type TabId = 'empty' | 'duplicated';
type FileType = 'doc' | 'ppt' | 'xls' | 'pdf' | 'zip' | 'img';

interface FileCopy { id: string; name: string; size: string; location: string; added: string; pages: number; docId: number; }
interface DupGroup {
  id: string;
  name: string;
  type: FileType;
  location: string;
  copies: FileCopy[];
}
interface EmptyFolder { id: string; index: string; name: string; location: string; }
interface MenuItem { label: string; icon: FvdrIconName; danger?: boolean; sepBefore?: boolean; }

const PAGE = 5;

const SEED: { name: string; type: FileType; copies: number; size: string }[] = [
  { name: '1000 pages.docx', type: 'doc', copies: 24, size: '47,5 KB' },
  { name: 'Investor deck Q3.pptx', type: 'ppt', copies: 2, size: '2,1 MB' },
  { name: 'Financial model 2026.xlsx', type: 'xls', copies: 9, size: '820 KB' },
  { name: 'NDA template.pdf', type: 'pdf', copies: 31, size: '118 KB' },
  { name: 'Board minutes – March.docx', type: 'doc', copies: 6, size: '64 KB' },
  { name: 'Site photos.zip', type: 'zip', copies: 3, size: '48,2 MB' },
  { name: 'Org chart.pdf', type: 'pdf', copies: 4, size: '312 KB' },
  { name: 'Company logo.png', type: 'img', copies: 18, size: '23,5 KB' },
  { name: 'Lease agreement.pdf', type: 'pdf', copies: 2, size: '540 KB' },
  { name: 'Cap table.xlsx', type: 'xls', copies: 3, size: '96 KB' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FOLDERS = ['Linked docs', 'Docs', 'Legal', 'Finance', 'HR', 'Corporate', 'Tax', 'IP'];
const PREFIXES = ['1.1.1.9.3', '1.9.3', '5.1.9.3', '5.4.1.9.3', '5.7.3', '6.5.3', '6.7.3', '9.6.3', '9.8.1.9.3',
  '9.8.4.1.9.3', '9.8.7.3', '9.10.5.3', '9.12.6.3', '9.12.8.1.9.3', '9.12.8.4.1.9.3', '9.12.8.7.3'];

function buildGroups(): DupGroup[] {
  return SEED.map((s, gi) => ({
    id: `g${gi}`,
    name: s.name,
    type: s.type,
    location: '9.8 Linked docs',
    copies: Array.from({ length: s.copies }, (_, ci) => {
      const prefix = PREFIXES[(ci + gi * 3) % PREFIXES.length];
      const folderIdx = (ci + gi) % FOLDERS.length;
      return {
        id: `g${gi}c${ci}`,
        name: `${prefix} ${s.name}`,
        size: s.size,
        location: `${(ci % 12) + 1}.${(gi % 9) + 1} ${FOLDERS[folderIdx]}`,
        added: `${MONTHS[(ci * 5 + gi) % 12]} ${((ci * 7 + gi * 3) % 28) + 1}, ${2024 + ((ci + gi) % 2)}`,
        pages: ((ci * 11 + gi * 7) % 60) + 1,
        docId: 9628361 + gi * 1000 + ci * 37,
      };
    }),
  }));
}

function buildEmpty(): EmptyFolder[] {
  const names = ['Archive', 'Drafts', 'Old versions', 'Scans', 'To review', 'Misc', 'Templates', 'Attachments',
    'Correspondence', 'Back-up', 'New folder', 'Signed', 'Exhibits', 'Due diligence'];
  return names.map((n, i) => ({
    id: `e${i}`,
    index: `${(i % 9) + 1}.${(i % 5) + 2}.${i + 1}`,
    name: n,
    location: `${(i % 9) + 1}.${(i % 5) + 2} ${FOLDERS[i % FOLDERS.length]}`,
  }));
}

@Component({
  selector: 'fvdr-insights-cleanup-drawer',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Prototype control ── -->
  <div class="proto-bar">
    <span class="proto-bar__label">Clean up · Duplicated</span>
    <fvdr-segment [items]="optionItems" [activeId]="option" (activeIdChange)="setOption($event)"></fvdr-segment>
    <span class="proto-bar__hint">{{ optionHint[option] }}</span>
  </div>

  <div class="app">
    <!-- ── Main menu rail ── -->
    <aside class="rail">
      <div class="rail__logo"><span class="rail__logo-mark">N</span></div>
      <nav class="rail__nav">
        <span class="rail__item" *ngFor="let n of navTop" [class.rail__item--active]="n === 'nav-overview-active'">
          <fvdr-icon [name]="n"></fvdr-icon>
        </span>
      </nav>
      <div class="rail__brand"></div>
    </aside>

    <div class="main">
      <header class="header">
        <span class="header__title">Dashboard</span>
        <div class="header__actions">
          <fvdr-icon name="theme-dark"></fvdr-icon>
          <fvdr-icon name="help"></fvdr-icon>
          <fvdr-icon name="nav-applications"></fvdr-icon>
          <span class="header__avatar">MA</span>
        </div>
      </header>

      <div class="body">
        <!-- ── Dashboard ── -->
        <div class="dash">
          <div class="dash-tabs">
            <button class="dash-tab" *ngFor="let t of dashTabs" [class.dash-tab--on]="dashTab === t.id" (click)="dashTab = t.id">
              <fvdr-icon [name]="t.icon"></fvdr-icon>{{ t.label }}
            </button>
          </div>

          <div class="cards">
            <div class="card" *ngFor="let c of cards">
              <div class="card__title">{{ c.title }}</div>
              <button class="stat" *ngFor="let s of c.stats" [class.stat--link]="!!s.tab"
                      [class.stat--on]="drawerOpen && s.tab === tab" (click)="s.tab && openDrawer(s.tab)">
                <span class="stat__icon"><fvdr-icon [name]="s.icon"></fvdr-icon></span>
                <span class="stat__txt">
                  <span class="stat__label">{{ s.label }}</span>
                  <span><b>{{ s.value }}</b> {{ s.unit }}</span>
                </span>
              </button>
            </div>
          </div>

          <div class="lower">
            <div class="overview">
              <div class="overview__head">Overview</div>
              <div class="stat" *ngFor="let s of overview">
                <span class="stat__icon"><fvdr-icon [name]="s.icon"></fvdr-icon></span>
                <span class="stat__txt">
                  <span class="stat__label">{{ s.label }}</span>
                  <span>{{ s.value }}</span>
                </span>
              </div>
            </div>
            <div class="docs">
              <div class="docs__head">
                <span class="c-ico"><fvdr-icon name="folder" class="docs__folder"></fvdr-icon><fvdr-icon name="chevron-down" class="docs__caret"></fvdr-icon></span>
                <span class="c-idx">Index</span>
                <span class="c-name">Name</span>
                <span class="c-num"># Files</span>
                <span class="c-size">Size</span>
                <span class="c-act">Actions</span>
              </div>
              <div class="docs__row" *ngFor="let d of docRows">
                <span class="c-ico"><fvdr-icon name="folder" class="docs__folder"></fvdr-icon></span>
                <span class="c-idx">{{ d.index }}</span>
                <span class="c-name">{{ d.name }}</span>
                <span class="c-num">{{ d.files }}</span>
                <span class="c-size">{{ d.size }}</span>
                <span class="c-act">
                  <button class="ibtn" title="Open"><fvdr-icon name="link"></fvdr-icon></button>
                  <button class="ibtn" title="Download"><fvdr-icon name="download"></fvdr-icon></button>
                  <button class="ibtn" title="More"><fvdr-icon name="more"></fvdr-icon></button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Clean up drawer ── -->
        <aside class="drawer" *ngIf="drawerOpen">
          <div class="drawer__head">
            <span class="drawer__title">Clean up</span>
            <div class="drawer__actions">
              <button class="ibtn" title="Export to Excel" (click)="toastInfo('Export started')"><fvdr-icon name="export"></fvdr-icon></button>
              <button class="ibtn" title="Open in new tab"><fvdr-icon name="link"></fvdr-icon></button>
              <button class="ibtn" title="Close" (click)="drawerOpen = false"><fvdr-icon name="cancel"></fvdr-icon></button>
            </div>
          </div>

          <div class="tabs">
            <button class="tab" [class.tab--on]="tab === 'empty'" (click)="setTab('empty')">
              <span class="tab__badge">{{ fmt(emptyTotal) }}</span>Empty
            </button>
            <button class="tab" [class.tab--on]="tab === 'duplicated'" (click)="setTab('duplicated')">
              <span class="tab__badge">{{ fmt(dupTotal) }}</span>Duplicated
            </button>
            <span class="tabs__rest"></span>
          </div>

          <div class="list" (scroll)="closeMenu(); hideTip()">

            <!-- Empty folders -->
            <ng-container *ngIf="tab === 'empty'">
              <div class="row row--zebra" *ngFor="let f of emptyFolders">
                <fvdr-icon name="folder" class="row__folder"></fvdr-icon>
                <span class="row__txt">
                  <span class="row__name">{{ f.index }} {{ f.name }}</span>
                  <span class="row__meta">location {{ f.location }}</span>
                </span>
                <button class="row__more" (click)="openMenu($event, f.id, f.index + ' ' + f.name)"
                        [class.row__more--on]="menu?.key === f.id"><fvdr-icon name="more"></fvdr-icon></button>
              </div>
            </ng-container>

            <!-- Duplicated · Option 1 — accordion -->
            <ng-container *ngIf="tab === 'duplicated' && option === 'o1'">
              <ng-container *ngFor="let g of groups; let gi = index">
                <button class="ghead" [class.ghead--zebra]="gi % 2 === 1 && !isOpen(g)" (click)="toggle(g)">
                  <fvdr-icon [name]="isOpen(g) ? 'chevron-down' : 'chevron-right'" class="ghead__chev"></fvdr-icon>
                  <span class="ficon" [ngClass]="'ficon--' + g.type"></span>
                  <span class="row__txt">
                    <span class="row__name">{{ g.name }}</span>
                    <span class="row__meta">{{ g.copies.length }} copies</span>
                  </span>
                </button>
                <ng-container *ngIf="isOpen(g)">
                  <div class="row row--copy" *ngFor="let c of g.copies; let ci = index" [class.row--zebra]="ci % 2 === 0"
                       (mouseenter)="showTip($event, c, g)" (mouseleave)="hideTip()">
                    <span class="ficon" [ngClass]="'ficon--' + g.type"></span>
                    <span class="row__txt">
                      <span class="row__name">{{ c.name }}</span>
                      <span class="row__meta">location {{ c.location }}</span>
                    </span>
                    <button class="row__more" (click)="openMenu($event, c.id, c.name, g)"
                            [class.row__more--on]="menu?.key === c.id"><fvdr-icon name="more"></fvdr-icon></button>
                  </div>
                </ng-container>
              </ng-container>
            </ng-container>

            <!-- Duplicated · Option 2 — caption + rows -->
            <ng-container *ngIf="tab === 'duplicated' && option === 'o2'">
              <div class="cgroup" *ngFor="let g of groups">
                <div class="cgroup__caption">{{ g.copies.length }} identical files</div>
                <div class="row" *ngFor="let c of visible(g); let ci = index" [class.row--zebra]="ci % 2 === 0"
                       (mouseenter)="showTip($event, c, g)" (mouseleave)="hideTip()">
                  <span class="ficon" [ngClass]="'ficon--' + g.type"></span>
                  <span class="row__txt">
                    <span class="row__name">{{ c.name }}</span>
                    <span class="row__meta">location {{ c.location }}</span>
                  </span>
                  <button class="row__more" (click)="openMenu($event, c.id, c.name, g)"
                          [class.row__more--on]="menu?.key === c.id"><fvdr-icon name="more"></fvdr-icon></button>
                </div>
                <button class="more-link" *ngIf="hasMore(g)" (click)="showAll(g)">Show more</button>
              </div>
            </ng-container>

            <!-- Duplicated · Option 3 — bordered blocks -->
            <ng-container *ngIf="tab === 'duplicated' && option === 'o3'">
              <div class="block" *ngFor="let g of groups">
                <div class="row" *ngFor="let c of visible(g)"
                       (mouseenter)="showTip($event, c, g)" (mouseleave)="hideTip()">
                  <span class="ficon" [ngClass]="'ficon--' + g.type"></span>
                  <span class="row__txt">
                    <span class="row__name">{{ c.name }}</span>
                    <span class="row__meta">location {{ c.location }}</span>
                  </span>
                  <button class="row__more" (click)="openMenu($event, c.id, c.name, g)"
                          [class.row__more--on]="menu?.key === c.id"><fvdr-icon name="more"></fvdr-icon></button>
                </div>
                <button class="more-link" *ngIf="hasMore(g)" (click)="showAll(g)">Show more</button>
              </div>
            </ng-container>

          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- ── Document hover card (as in product) ── -->
  <div class="tip" *ngIf="tip && !menu" [style.top.px]="tip.top" [style.left.px]="tip.left">
    <div class="tip__head">
      <span class="ficon ficon--lg" [ngClass]="'ficon--' + tip.group.type"></span>
      <span class="tip__name">{{ tip.copy.name }}</span>
    </div>
    <dl class="tip__grid">
      <dt>Added on:</dt><dd>{{ tip.copy.added }}</dd>
      <dt>Size:</dt><dd>{{ tip.copy.size.replace(',', '.') }}</dd>
      <dt>Pages:</dt><dd>{{ tip.copy.pages }}</dd>
      <dt>ID:</dt><dd>{{ tip.copy.docId }}</dd>
    </dl>
  </div>

  <!-- ── Context menu (fixed, so it is not clipped by the scrolling list) ── -->
  <div class="ctx" *ngIf="menu" [style.top.px]="menu.top" [style.left.px]="menu.left" (click)="$event.stopPropagation()">
    <ng-container *ngFor="let it of menuItems">
      <div class="ctx__sep" *ngIf="it.sepBefore"></div>
      <button class="ctx__item" [class.ctx__item--danger]="it.danger" [attr.data-track]="'cleanup-menu-' + it.label"
              (click)="pick(it)">
        <fvdr-icon [name]="it.icon"></fvdr-icon><span>{{ it.label }}</span>
      </button>
    </ng-container>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: var(--font-family); color: var(--color-text-primary); }
    button { font: inherit; color: inherit; }
    .page { height: 100%; display: flex; flex-direction: column; background: var(--color-bg-page); }

    .proto-bar {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-2) var(--space-6);
      background: var(--color-bg-surface); border-bottom: 1px solid var(--color-divider);
      font-size: var(--font-size-sm);
    }
    .proto-bar__label { font-weight: var(--font-weight-semi); white-space: nowrap; }
    .proto-bar__hint { color: var(--color-text-muted); }

    .app { flex: 1; display: flex; min-height: 0; }

    /* Rail */
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
    .rail__item { font-size: var(--space-6); color: var(--color-icon); display: flex; }
    .rail__item--active { color: var(--color-text-primary); }
    .rail__brand {
      width: var(--space-8); height: var(--space-8); margin: var(--space-6) 0;
      border-radius: var(--radius-full); background: var(--color-interactive-primary);
    }

    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .header {
      height: var(--space-16); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-6); border-bottom: 1px solid var(--color-divider);
    }
    .header__title { font-size: var(--font-size-xl); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi); }
    .header__actions { display: flex; align-items: center; gap: var(--space-6); font-size: var(--space-6); color: var(--color-icon); }
    .header__avatar {
      width: var(--space-10); height: var(--space-10); border-radius: var(--radius-full);
      background: var(--color-selection-bg); color: var(--color-text-primary);
      display: flex; align-items: center; justify-content: center; font-size: var(--font-size-lg);
    }

    .body { flex: 1; min-height: 0; display: flex; }

    /* Dashboard */
    .dash { flex: 1; min-width: 0; overflow: auto; padding: var(--space-6); }
    .dash-tabs { display: inline-flex; border: 1px solid var(--color-border-input); border-radius: var(--radius-sm); margin-bottom: var(--space-6); }
    .dash-tab {
      height: var(--space-10); display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-4);
      border: 0; background: var(--color-bg-page); cursor: pointer; font-size: var(--font-size-md);
    }
    .dash-tab fvdr-icon { font-size: var(--font-size-lg); color: var(--color-icon); }
    .dash-tab + .dash-tab { border-left: 1px solid var(--color-border-input); }
    .dash-tab:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
    .dash-tab:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .dash-tab:hover:not(.dash-tab--on) { background: var(--color-hover-bg); }
    .dash-tab--on { background: var(--color-selected-row); color: var(--color-interactive-primary); box-shadow: inset 0 0 0 1px var(--color-interactive-primary); }
    .dash-tab--on fvdr-icon { color: var(--color-interactive-primary); }

    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6); }
    .card { border: 1px solid var(--color-divider); border-radius: var(--radius-sm); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .card__title { font-size: var(--font-size-md); font-weight: var(--font-weight-semi); margin-bottom: var(--space-1); }

    .stat {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-1);
      border: 0; background: none; text-align: left; border-radius: var(--radius-sm);
      font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary);
    }
    .stat b { font-size: var(--font-size-lg); line-height: var(--line-height-lg); color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .stat--link { cursor: pointer; }
    .stat--link:hover, .stat--on { background: var(--color-bg-surface); }
    .stat__icon {
      width: var(--space-8); height: var(--space-8); flex-shrink: 0; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; background: var(--color-bg-surface);
      font-size: var(--font-size-lg); color: var(--color-icon);
    }
    .stat__txt { display: flex; flex-direction: column; }
    .stat__label { font-weight: var(--font-weight-semi); color: var(--color-text-primary); }

    .lower { display: flex; gap: var(--space-6); align-items: flex-start; }
    .overview { width: calc(var(--space-16) * 5); flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .overview__head, .docs__head {
      height: var(--space-12); display: flex; align-items: center; padding: 0 var(--space-4);
      background: var(--color-bg-surface); border-radius: var(--radius-sm); font-weight: var(--font-weight-semi); font-size: var(--font-size-md);
    }
    /* Documents table (top-level folders, like in product) */
    .docs { flex: 1; min-width: 0; font-size: var(--font-size-base); line-height: var(--line-height-base); }
    .docs__head { padding: 0; }
    .docs__row {
      height: var(--space-12); display: flex; align-items: center; border-radius: var(--radius-sm); cursor: pointer;
    }
    .docs__row:nth-child(odd) { background: var(--color-bg-subtle); }
    .docs__row:hover { background: var(--color-bg-surface); }
    .docs__folder { font-size: var(--font-size-2xl); color: var(--color-warning-700); }
    .docs__caret { font-size: var(--font-size-sm); color: var(--color-icon); }
    .c-ico { width: var(--space-16); flex-shrink: 0; display: flex; align-items: center; gap: var(--space-1); padding-left: var(--space-4); }
    .c-idx { width: var(--space-16); flex-shrink: 0; padding: 0 var(--space-2); }
    .c-name { flex: 1; min-width: 0; padding: 0 var(--space-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .c-num { width: calc(var(--space-16) + var(--space-4)); flex-shrink: 0; padding: 0 var(--space-2); }
    .c-size { width: calc(var(--space-16) + var(--space-6)); flex-shrink: 0; padding: 0 var(--space-2); }
    .c-act { width: calc(var(--space-16) + var(--space-10)); flex-shrink: 0; display: flex; gap: var(--space-2); padding: 0 var(--space-2); }
    .docs__row .c-act .ibtn { opacity: 0; }
    .docs__row:hover .c-act .ibtn { opacity: 1; }

    /* Drawer — 480px */
    .drawer {
      width: calc(var(--space-16) * 7 + var(--space-8)); flex-shrink: 0;
      display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-4);
      background: var(--color-bg-page); border-top-left-radius: var(--radius-sm); box-shadow: var(--shadow-popup);
      position: relative; z-index: var(--z-sticky);
    }
    .drawer__head { display: flex; align-items: center; justify-content: space-between; }
    .drawer__title { font-size: var(--font-size-xl); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi); }
    .drawer__actions { display: flex; gap: var(--space-4); }
    .ibtn {
      width: var(--space-6); height: var(--space-6); display: flex; align-items: center; justify-content: center;
      border: 0; background: none; cursor: pointer; padding: 0; border-radius: var(--radius-sm);
      font-size: var(--font-size-lg); color: var(--color-icon);
    }
    .ibtn:hover { background: var(--color-bg-surface); color: var(--color-text-primary); }

    .drawer > .tabs { margin-bottom: calc(var(--space-4) * -1); }
    .tabs { display: flex; flex-shrink: 0; }
    .tab {
      height: var(--space-10); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-4);
      border: 0; border-bottom: 1px solid var(--color-divider); background: none; cursor: pointer;
      font-size: var(--font-size-md); line-height: var(--line-height-lg); color: var(--color-text-secondary);
      border-top-left-radius: var(--radius-sm); border-top-right-radius: var(--radius-sm);
    }
    .tab:hover { color: var(--color-text-primary); }
    .tab--on { background: var(--color-selected-row); border-bottom: 2px solid var(--color-interactive-primary); color: var(--color-text-primary); }
    .tab__badge {
      min-width: var(--space-5); padding: 0 var(--space-2); border-radius: var(--radius-full);
      background: var(--color-selection-bg); color: var(--color-text-secondary);
      font-size: var(--font-size-xs); line-height: var(--line-height-sm); font-weight: var(--font-weight-semi);
    }
    .tab--on .tab__badge { background: var(--color-interactive-primary); color: var(--color-text-inverse); }
    .tabs__rest { flex: 1; border-bottom: 1px solid var(--color-divider); }

    .list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; padding-top: var(--space-2); }

    /* Rows */
    .row {
      position: relative; min-height: calc(var(--space-12) + var(--space-1)); flex-shrink: 0;
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
    }
    .row--zebra { background: var(--color-bg-subtle); }
    .row--rounded { border-radius: var(--radius-sm); }
    .row--copy { padding-left: var(--space-12); }
    .row:hover { background: var(--color-bg-surface); }
    .row__folder { font-size: var(--font-size-2xl); color: var(--color-warning-700); flex-shrink: 0; }
    .row__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: calc(var(--space-1) / 2); text-align: left; }
    .row__name { font-size: var(--font-size-base); line-height: var(--line-height-base); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row__meta { font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row__more {
      width: var(--space-8); height: var(--space-8); flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      border: 0; background: none; cursor: pointer; border-radius: var(--radius-sm);
      font-size: var(--font-size-lg); color: var(--color-icon); opacity: 0;
    }
    .row:hover .row__more, .row__more--on { opacity: 1; }
    .row__more:hover, .row__more--on { background: var(--color-selection-bg); }

    /* Option 1 — group header */
    .ghead {
      min-height: var(--space-14, calc(var(--space-12) + var(--space-2))); flex-shrink: 0;
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-4) var(--space-1) var(--space-2);
      border: 0; background: var(--color-bg-page); cursor: pointer; border-radius: var(--radius-sm); text-align: left;
    }
    .ghead--zebra { background: var(--color-bg-subtle); }
    .ghead:hover { background: var(--color-bg-surface); }
    .ghead__chev { font-size: var(--font-size-lg); color: var(--color-icon); flex-shrink: 0; }

    /* Option 2 — caption */
    .cgroup { display: flex; flex-direction: column; padding-bottom: var(--space-4); }
    .cgroup__caption {
      padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); line-height: var(--line-height-sm);
      font-weight: var(--font-weight-semi); color: var(--color-text-secondary);
    }

    /* Option 3 — bordered block */
    .block {
      flex-shrink: 0; display: flex; flex-direction: column; margin-bottom: var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden;
    }

    .more-link {
      align-self: flex-start; border: 0; background: none; cursor: pointer;
      padding: var(--space-2) var(--space-4); font-size: var(--font-size-base); line-height: var(--line-height-base);
      font-weight: var(--font-weight-semi); color: var(--color-interactive-primary);
    }
    .more-link:hover { color: var(--color-interactive-hover); }
    .more-link--indent { padding-left: var(--space-12); }

    /* File type glyph — 16×20 page with lines, tinted by type */
    .ficon {
      width: var(--space-4); height: var(--space-5); flex-shrink: 0; margin: 0 var(--space-1) 0 calc(var(--space-1) / 2);
      border: 1px solid currentColor; border-radius: calc(var(--radius-sm) / 2); color: var(--color-info-500);
      background:
        linear-gradient(currentColor, currentColor) center 40% / 60% 1px no-repeat,
        linear-gradient(currentColor, currentColor) center 55% / 60% 1px no-repeat,
        linear-gradient(currentColor, currentColor) center 70% / 60% 1px no-repeat;
    }
    .ficon--doc { color: var(--color-info-500); }
    .ficon--ppt { color: var(--color-error-500); }
    .ficon--xls { color: var(--color-primary-500); }
    .ficon--pdf { color: var(--color-error-600); }
    .ficon--zip { color: var(--color-stone-600); }
    .ficon--img { color: var(--color-warning-700); }

    .ficon--lg { width: var(--space-5); height: var(--space-6); margin: calc(var(--space-1) / 2) 0 0; }

    /* Document hover card — 320px */
    .tip {
      position: fixed; z-index: var(--z-dropdown); width: calc(var(--space-16) * 5); pointer-events: none;
      padding: var(--space-4) var(--space-5); background: var(--color-bg-page);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-popup);
    }
    .tip__head { display: flex; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-3); }
    .tip__name { font-size: var(--font-size-lg); line-height: var(--line-height-lg); word-break: break-word; }
    .tip__grid {
      margin: 0; display: grid; grid-template-columns: calc(var(--space-16) + var(--space-12)) 1fr;
      row-gap: var(--space-1); font-size: var(--font-size-base); line-height: var(--line-height-base);
    }
    .tip__grid dt { color: var(--color-text-primary); }
    .tip__grid dd { margin: 0; color: var(--color-text-secondary); }

    /* Context menu — 232px */
    .ctx {
      position: fixed; z-index: var(--z-dropdown); width: calc(var(--space-16) * 3 + var(--space-10));
      padding: var(--space-1) 0; background: var(--color-bg-page); border-radius: var(--radius-sm); box-shadow: var(--shadow-popup);
    }
    .ctx__item {
      width: 100%; height: var(--space-8); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-3);
      border: 0; background: none; cursor: pointer; text-align: left; white-space: nowrap;
      font-size: var(--font-size-base); line-height: var(--line-height-base);
    }
    .ctx__item:hover { background: var(--color-hover-bg); }
    .ctx__item fvdr-icon { font-size: var(--font-size-lg); color: var(--color-icon); }
    .ctx__item--danger, .ctx__item--danger fvdr-icon { color: var(--color-danger); }
    .ctx__sep { height: 1px; margin: var(--space-1) 0; background: var(--color-divider); }
  `],
})
export class InsightsCleanupDrawerComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  readonly optionItems: SegmentItem[] = [
    { id: 'o1', label: 'Option 1 · Accordion' },
    { id: 'o2', label: 'Option 2 · Caption' },
    { id: 'o3', label: 'Option 3 · Blocks' },
  ];
  readonly optionHint: Record<OptionId, string> = {
    o1: 'Groups collapsed by original file; expand to see copies',
    o2: 'Every group labelled "N identical files", flat list',
    o3: 'Every group in its own bordered block',
  };
  readonly navTop: FvdrIconName[] = [
    'nav-overview-active', 'documents', 'nav-participants', 'nav-permissions', 'nav-qa', 'nav-reports',
    'nav-settings', 'nav-archiving', 'recycle-bin',
  ];

  readonly cards: { title: string; stats: { label: string; value: string; unit: string; icon: FvdrIconName; tab?: TabId }[] }[] = [
    { title: 'Permissions', stats: [
      { label: 'Not assigned', value: '0', unit: 'files', icon: 'cancel' },
      { label: 'Not accessed', value: '28,984', unit: 'files', icon: 'lock-close' },
    ] },
    { title: 'Publishing', stats: [
      { label: 'Published', value: '29,033', unit: 'files', icon: 'finished' },
      { label: 'Unpublished', value: '0', unit: 'files', icon: 'cross-circle' },
    ] },
    { title: 'Clean up', stats: [
      { label: 'Empty', value: '10,655', unit: 'folders', icon: 'folder', tab: 'empty' },
      { label: 'Duplicated', value: '26,879', unit: 'files', icon: 'copy', tab: 'duplicated' },
    ] },
    { title: 'Redaction', stats: [
      { label: 'Drafted', value: '0', unit: 'files', icon: 'edit' },
      { label: 'Redacted', value: '38', unit: 'files', icon: 'edit' },
    ] },
  ];
  readonly overview: { label: string; value: string; icon: FvdrIconName }[] = [
    { label: 'Project index', value: '11,388 folders | 29,033 files', icon: 'folders' },
    { label: 'Q&A attachments', value: '1 files', icon: 'nav-qa' },
    { label: 'Recycle bin', value: '4 folders | 1 files', icon: 'trash' },
  ];
  readonly dashTabs: { id: string; label: string; icon: FvdrIconName }[] = [
    { id: 'activity', label: 'Activity', icon: 'nav-reports' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'qa', label: 'Q&A', icon: 'nav-qa' },
  ];
  dashTab = 'documents';

  readonly docRows: { index: string; name: string; files: string; size: string }[] = [
    { index: '1', name: 'Corporate documents', files: '1,248', size: '86,4 MB' },
    { index: '2', name: 'Financial information', files: '3,912', size: '412,7 MB' },
    { index: '3', name: 'Legal', files: '2,087', size: '158,2 MB' },
    { index: '4', name: 'Intellectual property', files: '764', size: '61,9 MB' },
    { index: '5', name: 'Human resources', files: '1,530', size: '97,3 MB' },
    { index: '6', name: 'Tax', files: '918', size: '44,8 MB' },
    { index: '7', name: 'Real estate', files: '402', size: '230,5 MB' },
    { index: '8', name: 'Commercial contracts', files: '2,644', size: '187,1 MB' },
    { index: '9', name: 'Linked docs', files: '15,428', size: '702,6 MB' },
    { index: '10', name: 'Insurance', files: '96', size: '8,4 MB' },
    { index: '11', name: 'Environmental', files: '64', size: '12,2 MB' },
  ];

  readonly menuItems: MenuItem[] = [
    { label: 'View', icon: 'view-as' },
    { label: 'Open in documents', icon: 'link' },
    { label: 'Download', icon: 'download' },
    { label: 'View activity log', icon: 'history', sepBefore: true },
    { label: 'View documents overview', icon: 'nav-reports' },
    { label: 'View engagement matrix', icon: 'table-view' },
    { label: 'View permissions log', icon: 'lock-close' },
    { label: 'Delete', icon: 'trash', danger: true, sepBefore: true },
  ];

  option: OptionId = 'o1';
  tab: TabId = 'duplicated';
  drawerOpen = true;

  groups: DupGroup[] = buildGroups();
  emptyFolders: EmptyFolder[] = buildEmpty();
  emptyTotal = 10655;
  dupTotal = 26879;

  /** o1: expanded group ids. All groups collapsed by default. */
  open = new Set<string>();
  /** How many copies are shown per group (Show more adds PAGE). */
  shown: Record<string, number> = {};

  menu: { key: string; label: string; group?: DupGroup; top: number; left: number } | null = null;

  ngOnInit(): void { this.tracker.trackPageView('insights-cleanup-drawer'); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  setOption(id: string): void {
    this.option = id as OptionId;
    this.shown = {};
    this.open.clear();
    this.closeMenu();
  }
  setTab(t: TabId): void { this.tab = t; this.closeMenu(); }
  openDrawer(t: TabId): void { this.tab = t; this.drawerOpen = true; }

  fmt(n: number): string { return n.toLocaleString('en-US').replace(/,/g, ' '); }

  isOpen(g: DupGroup): boolean { return this.open.has(g.id); }
  toggle(g: DupGroup): void {
    this.open.has(g.id) ? this.open.delete(g.id) : this.open.add(g.id);
    this.closeMenu();
  }
  visible(g: DupGroup): FileCopy[] { return g.copies.slice(0, this.shown[g.id] ?? PAGE); }
  hasMore(g: DupGroup): boolean { return g.copies.length > (this.shown[g.id] ?? PAGE); }
  showAll(g: DupGroup): void { this.shown[g.id] = g.copies.length; }

  openMenu(ev: MouseEvent, key: string, label: string, group?: DupGroup): void {
    ev.stopPropagation();
    if (this.menu?.key === key) { this.closeMenu(); return; }
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const w = 232, h = 300;
    const top = r.bottom + h > window.innerHeight ? r.top - h - 4 : r.bottom + 4;
    this.menu = { key, label, group, top, left: r.right - w };
  }

  tip: { copy: FileCopy; group: DupGroup; top: number; left: number } | null = null;
  private tipTimer?: ReturnType<typeof setTimeout>;

  /** Hover card appears under the hovered row after a short delay. */
  showTip(ev: MouseEvent, copy: FileCopy, group: DupGroup): void {
    clearTimeout(this.tipTimer);
    const row = ev.currentTarget as HTMLElement;
    const r = row.getBoundingClientRect();
    const nameLeft = (row.querySelector('.row__txt') as HTMLElement | null)?.getBoundingClientRect().left ?? r.left;
    this.tipTimer = setTimeout(() => {
      const w = 320, h = 180, gap = 4;
      // Under the row, starting at the file name (as in product); flip above near the bottom edge.
      const top = r.bottom + h + gap > window.innerHeight ? r.top - h - gap : r.bottom + gap;
      const left = Math.min(nameLeft, window.innerWidth - w - gap * 2);
      this.tip = { copy, group, top, left };
    }, 400);
  }
  hideTip(): void { clearTimeout(this.tipTimer); this.tip = null; }

  @HostListener('document:click')
  @HostListener('window:resize')
  closeMenu(): void { this.menu = null; }

  pick(it: MenuItem): void {
    const m = this.menu;
    this.closeMenu();
    if (!m) return;
    if (it.danger) {
      if (m.group) {
        m.group.copies = m.group.copies.filter(c => c.id !== m.key);
        this.dupTotal--;
        if (m.group.copies.length < 2) this.groups = this.groups.filter(g => g !== m.group);
      } else {
        this.emptyFolders = this.emptyFolders.filter(f => f.id !== m.key);
        this.emptyTotal--;
      }
      this.toast.show({ variant: 'success', message: `"${m.label}" moved to Recycle bin` });
      this.tracker.trackTask('insights-cleanup-drawer', 'task_complete');
      return;
    }
    this.toastInfo(`${it.label}: ${m.label}`);
  }

  toastInfo(message: string): void { this.toast.show({ variant: 'info', message }); }
}
