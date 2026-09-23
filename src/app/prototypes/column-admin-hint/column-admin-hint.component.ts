import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, SegmentItem } from '../../shared/ds';
import { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';
import { TrackerService } from '../../services/tracker.service';

type ColId =
  | 'index' | 'name' | 'publishing' | 'size' | 'addedOn' | 'notes' | 'labels'
  | 'viewedOn' | 'permission' | 'id' | 'redaction' | 'addedBy';

interface ColDef {
  id: ColId;
  label: string;
  width: string;
  locked?: boolean;       // always visible, can't be toggled
  visible: boolean;
  /** Hidden for everyone by default — an admin can turn it on for all users in Settings. */
  adminManaged?: boolean;
}

type Variant = 'hovercard' | 'nudge' | 'footer' | 'quick';

interface DocRow {
  fileType: FvdrFileType;
  index: number;
  name: string;
  published: boolean;
  addedOn: string;
  addedBy: string;
  initials: string;
  notes: number;
  size: [string, string];
  labels: string;
  viewedOn: string;
  permission: string;
  docId: string;
  redaction: boolean;
}

@Component({
  selector: 'fvdr-column-admin-hint',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">
      <fvdr-sidebar-nav variant="vdr" accountName="Room name" [items]="navItems" [(collapsed)]="sidebarCollapsed" />

      <div class="main-area">
        <fvdr-header [breadcrumbs]="breadcrumbItems" [actions]="headerActions" userName="LZ" />

        <div class="content-wrap">
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn label="Add" variant="primary" size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn label="Download" variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m" iconName="action-list"></fvdr-btn>
            </div>
            <div class="toolbar-right">
              <fvdr-btn label="View as" variant="secondary" size="m" iconName="view-as"></fvdr-btn>
              <fvdr-search placeholder="Search" [filter]="true"></fvdr-search>
            </div>
          </div>

          <div class="tbl-area">
            <div class="tbl-wrap">
              <div class="tbl-row tbl-row--header" [style.grid-template-columns]="gridCols">
                <div class="c-chk"></div>
                <div *ngFor="let c of visibleCols">{{ c.label }}</div>
                <div class="c-menu">
                  <button class="cols-btn" [class.cols-btn--open]="menuOpen"
                          (click)="toggleMenu($event)" aria-label="Manage columns">
                    <fvdr-icon name="table-view"></fvdr-icon>
                  </button>
                </div>
              </div>

              <div class="tbl-row" *ngFor="let r of rows" [style.grid-template-columns]="gridCols">
                <div class="c-chk"></div>
                <div *ngFor="let c of visibleCols" [ngSwitch]="c.id" class="cell"
                     [class.cell--flash]="flashCol === c.id">
                  <ng-container *ngSwitchCase="'index'">{{ r.index }}</ng-container>
                  <ng-container *ngSwitchCase="'name'">
                    <fvdr-file-icon [type]="r.fileType"></fvdr-file-icon><span class="ellipsis">{{ r.name }}</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'publishing'">
                    <fvdr-icon [name]="r.published ? 'finished' : 'cross-circle'" [class]="r.published ? 'pub-yes' : 'pub-no'"></fvdr-icon>
                  </ng-container>
                  <ng-container *ngSwitchCase="'size'">
                    <div class="two-line"><span>{{ r.size[0] }}</span><span class="sub">{{ r.size[1] }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'addedOn'"><span class="small">{{ r.addedOn }}</span></ng-container>
                  <ng-container *ngSwitchCase="'addedBy'">
                    <fvdr-avatar [initials]="r.initials" size="sm"></fvdr-avatar><span class="ellipsis">{{ r.addedBy }}</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'notes'"><span class="notes-badge" *ngIf="r.notes">{{ r.notes }}</span></ng-container>
                  <ng-container *ngSwitchCase="'labels'"><span class="small">{{ r.labels }}</span></ng-container>
                  <ng-container *ngSwitchCase="'viewedOn'"><span class="small">{{ r.viewedOn }}</span></ng-container>
                  <ng-container *ngSwitchCase="'permission'"><span class="small">{{ r.permission }}</span></ng-container>
                  <ng-container *ngSwitchCase="'id'"><span class="small sub">{{ r.docId }}</span></ng-container>
                  <ng-container *ngSwitchCase="'redaction'">
                    <span class="red-chip" [class.red-chip--on]="r.redaction">{{ r.redaction ? 'Applied' : 'None' }}</span>
                  </ng-container>
                </div>
                <div></div>
              </div>
            </div>

            <!-- ═══════════ Column manager popover ═══════════ -->
            <div class="colmenu" *ngIf="menuOpen" (click)="$event.stopPropagation()">
              <div class="colmenu__top">
                <fvdr-toggle size="s" [checked]="foldersFirst" (checkedChange)="foldersFirst = $event" label="Folders first"></fvdr-toggle>
              </div>

              <div class="colmenu__list">
                <ng-container *ngFor="let c of cols">
                  <div class="crow"
                       [class.crow--on]="c.visible && !c.locked"
                       [class.crow--locked]="c.locked"
                       [class.crow--managed]="c.adminManaged"
                       (mouseenter)="onRowEnter(c, $event)"
                       (mouseleave)="onRowLeave()">
                    <fvdr-icon name="drag" class="crow__drag"></fvdr-icon>
                    <fvdr-checkbox [checked]="c.visible" [disabled]="!!c.locked" (checkedChange)="toggleCol(c, $event)"></fvdr-checkbox>
                    <span class="crow__label" (click)="!c.locked && toggleCol(c, !c.visible)">{{ c.label }}</span>

                    <!-- V1 · Hover card trigger -->
                    <span *ngIf="variant === 'hovercard' && c.adminManaged" class="crow__info"
                          [class.crow__info--active]="hoverCol === c.id">
                      <fvdr-icon name="participants"></fvdr-icon>
                    </span>

                    <!-- V3 · Footer: subtle marker that links the row to the footer -->
                    <span *ngIf="variant === 'footer' && c.adminManaged" class="crow__dot" title="Hidden for other users"></span>

                    <!-- V4 · Quick action revealed on row hover -->
                    <button *ngIf="variant === 'quick' && c.adminManaged" class="crow__quick"
                            (click)="openQuick(c, $event)">
                      <fvdr-icon name="participants"></fvdr-icon><span>For all</span>
                    </button>
                  </div>

                  <!-- V2 · Just-in-time nudge, slides in right after the admin turns the column on -->
                  <div class="nudge" *ngIf="variant === 'nudge' && nudgeCol === c.id">
                    <div class="nudge__inner">
                      <fvdr-icon name="eye" class="nudge__icon"></fvdr-icon>
                      <div class="nudge__text">
                        Only you see this column.
                        <a class="link" (click)="goSettings(c)">Show it for all users<fvdr-icon name="share"></fvdr-icon></a>
                      </div>
                      <button class="nudge__close" (click)="nudgeCol = null" aria-label="Dismiss"><fvdr-icon name="close"></fvdr-icon></button>
                    </div>
                    <div class="nudge__timer"></div>
                  </div>
                </ng-container>
              </div>

              <!-- V3 · Admin footer -->
              <div class="cfooter" *ngIf="variant === 'footer'" [class.cfooter--pulse]="hoverManaged">
                <div class="cfooter__icon"><fvdr-icon name="participants"></fvdr-icon></div>
                <div class="cfooter__body">
                  <div class="cfooter__title">Columns for all users</div>
                  <div class="cfooter__text">
                    <span class="crow__dot crow__dot--inline"></span>
                    {{ managedHiddenCount }} columns are hidden for other users.
                  </div>
                  <a class="link" (click)="goSettings(null)">Manage in Settings<fvdr-icon name="share"></fvdr-icon></a>
                </div>
              </div>

              <!-- V1 · Hover card, anchored to the left of the hovered row -->
              <div class="hcard" *ngIf="variant === 'hovercard' && hoverColDef as hc"
                   [style.top.px]="hoverTop"
                   (mouseenter)="cancelLeave()" (mouseleave)="onRowLeave()">
                <div class="hcard__body">
                  <div class="hcard__head">
                    <span class="hcard__badge"><fvdr-icon name="lock-close"></fvdr-icon>Admin</span>
                  </div>
                  <div class="hcard__title">{{ hc.label }} is hidden for other users</div>
                  <div class="hcard__text">Turning it on here changes only your view. Make it a default column for everyone in the room.</div>
                  <a class="link link--strong" (click)="goSettings(hc)">Enable for everyone in Settings<fvdr-icon name="share"></fvdr-icon></a>
                </div>
              </div>

              <!-- V4 · Quick action mini-dialog -->
              <div class="qpop" *ngIf="variant === 'quick' && quickColDef as qc" [style.top.px]="quickTop">
                <div class="qpop__title">Show “{{ qc.label }}” for all users?</div>
                <div class="qpop__text">Default columns are managed in Settings. We'll open it with <b>{{ qc.label }}</b> preselected.</div>
                <div class="qpop__actions">
                  <fvdr-btn label="Cancel" variant="ghost" size="s" (clicked)="quickCol = null"></fvdr-btn>
                  <fvdr-btn label="Open Settings" variant="primary" size="s" (clicked)="goSettings(qc)"></fvdr-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Variant switcher -->
    <div class="switcher">
      <span class="switcher__label">Interaction</span>
      <fvdr-segment [items]="variantItems" [activeId]="variant" (activeIdChange)="setVariant($event)" size="sm"></fvdr-segment>
      <span class="switcher__hint">{{ variantHint[variant] }}</span>
    </div>

    <!-- Fake Settings destination -->
    <div class="toast" [class.toast--show]="toast">
      <fvdr-icon name="settings"></fvdr-icon>{{ toast }}
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); font-size: var(--font-size-base); color: var(--color-text-primary); height: 100vh; overflow: hidden; }
    .page-layout { display: flex; height: 100%; background: var(--color-stone-100); }
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .content-wrap { flex: 1; display: flex; flex-direction: column; padding: var(--space-6); gap: var(--space-5); min-height: 0; background: var(--color-stone-0); }
    .toolbar { display: flex; align-items: center; justify-content: space-between; height: 40px; flex-shrink: 0; }
    .toolbar-left, .toolbar-right { display: flex; gap: var(--space-3); align-items: center; }

    /* ── Table ── */
    .tbl-area { position: relative; flex: 1; min-height: 0; }
    .tbl-wrap { height: 100%; overflow: auto; }
    .tbl-row { display: grid; align-items: center; min-width: max-content; min-height: 44px; }
    .tbl-row > div { padding: 0 var(--space-3); display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .tbl-row--header { position: sticky; top: 0; z-index: 3; min-height: 48px; background: var(--color-stone-200); font-weight: 600; }
    .tbl-row:not(.tbl-row--header):hover { background: var(--color-hover-bg); }
    .c-menu { justify-content: flex-end; }
    .cell { transition: background 0.6s ease; height: 100%; }
    .cell--flash { background: var(--color-primary-50); transition: none; }
    .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .small { font-size: var(--text-caption1-size); }
    .sub { color: var(--color-text-secondary); }
    .two-line { display: flex; flex-direction: column; font-size: var(--text-caption1-size); line-height: 16px; }
    .pub-yes { color: var(--color-primary-500); font-size: 16px; }
    .pub-no { color: var(--color-stone-500); font-size: 16px; }
    .notes-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; border-radius: var(--radius-lg); background: var(--color-stone-300); }
    .red-chip { display: inline-flex; height: 24px; align-items: center; padding: 0 var(--space-3); border-radius: var(--radius-lg); background: var(--color-stone-300); white-space: nowrap; }
    .red-chip--on { background: var(--color-primary-50); }

    .cols-btn { width: 32px; height: 32px; border: none; border-radius: var(--radius-sm); background: transparent; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--color-text-secondary); cursor: pointer; }
    .cols-btn:hover, .cols-btn--open { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Column manager ── */
    .colmenu {
      position: absolute; top: 44px; right: 0; z-index: 20; width: 256px;
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md);
      box-shadow: var(--shadow-popup); animation: pop-in 0.14s ease-out;
    }
    @keyframes pop-in { from { opacity: 0; transform: translateY(-4px); } }
    .colmenu__top { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .colmenu__list { padding: var(--space-1) 0; max-height: 440px; overflow-y: auto; }

    .crow { position: relative; display: flex; align-items: center; gap: var(--space-2); height: 36px; padding: 0 var(--space-3) 0 var(--space-2); }
    .crow:hover { background: var(--color-stone-200); }
    .crow--on { background: var(--color-primary-50); }
    .crow--on:hover { background: var(--color-primary-50); }
    .crow--locked .crow__label { color: var(--color-text-disabled); cursor: default; }
    .crow__drag { font-size: 14px; color: var(--color-stone-500); opacity: 0; transition: opacity 0.12s; }
    .crow:hover .crow__drag { opacity: 1; }
    .crow--locked .crow__drag { visibility: hidden; }
    .crow__label { flex: 1; cursor: pointer; user-select: none; }

    .crow__info { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm); font-size: 15px; color: var(--color-stone-600); cursor: help; transition: all 0.12s; }
    .crow__info--active { background: var(--color-stone-0); color: var(--color-primary-600); box-shadow: var(--shadow-card); }

    .crow__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-info-500); flex-shrink: 0; margin-right: var(--space-2); }
    .crow__dot--inline { display: inline-block; margin: 0 var(--space-1) 1px 0; }

    .crow__quick {
      display: inline-flex; align-items: center; gap: var(--space-1); height: 24px; padding: 0 var(--space-2);
      border: 1px solid var(--color-divider); border-radius: var(--radius-lg); background: var(--color-stone-0);
      font-family: inherit; font-size: var(--text-caption1-size); color: var(--color-text-secondary); cursor: pointer;
      opacity: 0; transform: translateX(4px); transition: opacity 0.14s, transform 0.14s;
    }
    .crow:hover .crow__quick { opacity: 1; transform: none; }
    .crow__quick:hover { border-color: var(--color-primary-500); color: var(--color-primary-600); }

    .link { display: inline-flex; align-items: center; white-space: nowrap; align-self: flex-start; gap: var(--space-1); color: var(--color-primary-500); cursor: pointer; text-decoration: none; font-weight: 500; }
    .link fvdr-icon { font-size: 12px; }
    .link:hover { color: var(--color-primary-700); text-decoration: underline; text-underline-offset: 2px; }

    /* V1 hover card */
    .hcard { position: absolute; right: 100%; padding-right: var(--space-2); width: 280px; z-index: 21; animation: slide-l 0.16s ease-out; }
    @keyframes slide-l { from { opacity: 0; transform: translateX(6px); } }
    .hcard__body { background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md); box-shadow: var(--shadow-popup); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .hcard__badge { display: inline-flex; align-items: center; gap: var(--space-1); height: 20px; padding: 0 var(--space-2); border-radius: var(--radius-sm); background: var(--color-stone-200); color: var(--color-text-secondary); font-size: var(--text-caption1-size); }
    .hcard__title { font-weight: 600; }
    .hcard__text { color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: 18px; }
    .link--strong { margin-top: var(--space-1); }

    /* V2 nudge */
    .nudge { overflow: hidden; animation: grow 0.22s ease-out; position: relative; }
    @keyframes grow { from { max-height: 0; opacity: 0; } to { max-height: 80px; opacity: 1; } }
    .nudge__inner { display: flex; gap: var(--space-2); align-items: flex-start; margin: var(--space-1) var(--space-2) var(--space-2) var(--space-8); padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--color-stone-200); font-size: var(--text-caption1-size); line-height: 18px; }
    .nudge__icon { font-size: 14px; color: var(--color-text-secondary); margin-top: 2px; }
    .nudge__text { flex: 1; color: var(--color-text-secondary); display: flex; flex-direction: column; }
    .nudge__close { border: none; background: transparent; color: var(--color-stone-600); cursor: pointer; font-size: 12px; padding: 2px; display: flex; }
    .nudge__close:hover { color: var(--color-text-primary); }
    .nudge__timer { position: absolute; left: var(--space-8); right: var(--space-2); bottom: var(--space-2); height: 2px; border-radius: 1px; background: var(--color-primary-500); transform-origin: left; animation: timer 6s linear forwards; opacity: 0.5; }
    @keyframes timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }

    /* V3 footer */
    .cfooter { display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-divider); background: var(--color-stone-100); border-radius: 0 0 var(--radius-md) var(--radius-md); transition: background 0.2s; }
    .cfooter--pulse { background: var(--color-stone-300); }
    .cfooter__icon { width: 28px; height: 28px; border-radius: 50%; background: var(--color-stone-0); border: 1px solid var(--color-divider); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); flex-shrink: 0; }
    .cfooter__body { display: flex; flex-direction: column; gap: 2px; font-size: var(--text-caption1-size); line-height: 18px; }
    .cfooter__title { font-weight: 600; font-size: var(--font-size-base); }
    .cfooter__text { color: var(--color-text-secondary); }

    /* V4 quick dialog */
    .qpop { position: absolute; right: calc(100% + var(--space-2)); width: 272px; z-index: 21; background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md); box-shadow: var(--shadow-popup); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); animation: slide-l 0.16s ease-out; }
    .qpop__title { font-weight: 600; }
    .qpop__text { font-size: var(--text-caption1-size); line-height: 18px; color: var(--color-text-secondary); }
    .qpop__actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

    /* Switcher */
    .switcher { position: fixed; left: 50%; bottom: var(--space-6); transform: translateX(-50%); z-index: 90; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-4); background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
    .switcher__label { font-size: var(--text-caption1-size); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .switcher__hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); white-space: nowrap; }

    .toast { position: fixed; top: var(--space-6); left: 50%; transform: translate(-50%, -8px); z-index: 100; display: flex; align-items: center; gap: var(--space-2); background: var(--color-stone-900); color: var(--color-stone-0); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); opacity: 0; pointer-events: none; transition: all 0.16s ease; }
    .toast--show { opacity: 1; transform: translate(-50%, 0); }
  `],
})
export class ColumnAdminHintComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  sidebarCollapsed = true;
  breadcrumbItems = [{ id: 'docs', label: 'Documents' }, { id: 'all', label: 'All' }];
  navItems: SidebarNavItem[] = [
    { id: 'overview', icon: 'nav-overview', iconActive: 'nav-overview-active', label: 'Dashboard', active: false },
    { id: 'projects', icon: 'nav-projects', iconActive: 'nav-projects-active', label: 'Documents', active: true },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'settings', icon: 'nav-settings', iconActive: 'nav-settings-active', label: 'Settings', active: false },
  ];
  headerActions: HeaderAction[] = [{ id: 'theme', icon: 'theme-dark' }, { id: 'help', icon: 'help' }];

  variant: Variant = 'hovercard';
  variantItems: SegmentItem[] = [
    { id: 'hovercard', label: '1 · Hover card' },
    { id: 'nudge', label: '2 · Just-in-time' },
    { id: 'footer', label: '3 · Footer' },
    { id: 'quick', label: '4 · Quick action' },
  ];
  variantHint: Record<Variant, string> = {
    hovercard: 'Hover the people icon next to Added on / Added by',
    nudge: 'Turn on Added on or Added by',
    footer: 'Persistent admin footer; blue dot marks affected columns',
    quick: 'Hover Added on / Added by and click “For all”',
  };

  menuOpen = true;
  foldersFirst = true;

  cols: ColDef[] = [
    { id: 'index', label: 'Index', width: '64px', locked: true, visible: true },
    { id: 'name', label: 'Name', width: 'minmax(180px, 1fr)', locked: true, visible: true },
    { id: 'publishing', label: 'Publishing', width: '100px', locked: true, visible: true },
    { id: 'size', label: 'Size', width: '120px', visible: true },
    { id: 'addedOn', label: 'Added on', width: '110px', visible: false, adminManaged: true },
    { id: 'notes', label: 'Notes', width: '72px', visible: true },
    { id: 'labels', label: 'Labels', width: '100px', visible: false },
    { id: 'viewedOn', label: 'Viewed on', width: '110px', visible: false },
    { id: 'permission', label: 'Permission', width: '110px', visible: false },
    { id: 'id', label: 'ID', width: '90px', visible: false },
    { id: 'redaction', label: 'Redaction', width: '110px', visible: true },
    { id: 'addedBy', label: 'Added by', width: '170px', visible: false, adminManaged: true },
  ];

  rows: DocRow[] = [
    { fileType: 'folder', index: 1, name: 'Alpha Division', published: true, addedOn: 'Jul 11, 2026', addedBy: 'Brian Chen', initials: 'BC', notes: 0, size: ['0 subfolders', '0 files'], labels: '—', viewedOn: 'Sep 20, 2026', permission: 'Download', docId: 'D-1001', redaction: false },
    { fileType: 'folder', index: 2, name: 'Beta Sector', published: true, addedOn: 'Jul 12, 2026', addedBy: 'Brian Chen', initials: 'BC', notes: 0, size: ['0 subfolders', '0 files'], labels: '—', viewedOn: 'Sep 18, 2026', permission: 'View', docId: 'D-1002', redaction: false },
    { fileType: 'folder', index: 3, name: 'Gamma Quadrant', published: true, addedOn: 'Jul 13, 2026', addedBy: 'Cathy Chung', initials: 'CC', notes: 0, size: ['0 subfolders', '0 files'], labels: 'Legal', viewedOn: 'Sep 12, 2026', permission: 'View', docId: 'D-1003', redaction: false },
    { fileType: 'folder', index: 4, name: 'Zeta Complex', published: false, addedOn: 'Feb 23, 2026', addedBy: 'David Carter', initials: 'DC', notes: 2, size: ['5 subfolders', '10 files'], labels: '—', viewedOn: 'Aug 30, 2026', permission: 'Manage', docId: 'D-1004', redaction: false },
    { fileType: 'folder', index: 5, name: 'Delta Labs', published: false, addedOn: 'Aug 21, 2026', addedBy: 'Eva Collins', initials: 'EC', notes: 2, size: ['12 subfolders', '89 files'], labels: 'HR', viewedOn: 'Sep 01, 2026', permission: 'Download', docId: 'D-1005', redaction: false },
    { fileType: 'doc', index: 6, name: 'Uni Labs', published: false, addedOn: 'Feb 23, 2026', addedBy: 'Franklin Shmungartenberg', initials: 'FS', notes: 2, size: ['4.9 KB', '4 pages'], labels: '—', viewedOn: 'Sep 21, 2026', permission: 'View', docId: 'D-1006', redaction: false },
    { fileType: 'pdf', index: 7, name: 'Elipson Project', published: false, addedOn: 'Sep 15, 2026', addedBy: 'Grace Cooper', initials: 'GC', notes: 0, size: ['72 MB', '34 pages'], labels: 'Finance', viewedOn: 'Sep 22, 2026', permission: 'Download', docId: 'D-1007', redaction: true },
    { fileType: 'xls', index: 9, name: 'Elipson Project', published: false, addedOn: 'Oct 30, 2026', addedBy: 'Grace Cooper', initials: 'GC', notes: 0, size: ['72 MB', '34 pages'], labels: '—', viewedOn: 'Sep 22, 2026', permission: 'View', docId: 'D-1009', redaction: false },
  ];

  get visibleCols(): ColDef[] { return this.cols.filter(c => c.visible); }
  get gridCols(): string { return ['32px', ...this.visibleCols.map(c => c.width), '48px'].join(' '); }
  get managedHiddenCount(): number { return this.cols.filter(c => c.adminManaged).length; }

  // hover state (V1, V3)
  hoverCol: ColId | null = null;
  hoverTop = 0;
  hoverManaged = false;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
  get hoverColDef(): ColDef | undefined { return this.cols.find(c => c.id === this.hoverCol); }

  // V2
  nudgeCol: ColId | null = null;
  private nudgeTimer: ReturnType<typeof setTimeout> | null = null;

  // V4
  quickCol: ColId | null = null;
  quickTop = 0;
  get quickColDef(): ColDef | undefined { return this.cols.find(c => c.id === this.quickCol); }

  flashCol: ColId | null = null;
  toast = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  setVariant(v: string): void {
    this.variant = v as Variant;
    this.hoverCol = this.nudgeCol = this.quickCol = null;
    this.menuOpen = true;
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
    this.quickCol = this.hoverCol = null;
  }

  @HostListener('document:click')
  onDocClick(): void { this.quickCol = null; }

  toggleCol(c: ColDef, on: boolean): void {
    if (c.locked) return;
    c.visible = on;
    if (on) {
      this.flashCol = c.id;
      setTimeout(() => (this.flashCol = null), 50);
    }
    if (this.variant === 'nudge') {
      if (this.nudgeTimer) clearTimeout(this.nudgeTimer);
      this.nudgeCol = on && c.adminManaged ? c.id : null;
      if (this.nudgeCol) this.nudgeTimer = setTimeout(() => (this.nudgeCol = null), 6000);
    }
  }

  onRowEnter(c: ColDef, e: MouseEvent): void {
    this.cancelLeave();
    this.hoverManaged = !!c.adminManaged;
    if (!c.adminManaged) { this.hoverCol = null; return; }
    const row = e.currentTarget as HTMLElement;
    const menu = row.closest('.colmenu') as HTMLElement;
    this.hoverTop = row.getBoundingClientRect().top - menu.getBoundingClientRect().top - 8;
    this.hoverCol = c.id;
  }

  onRowLeave(): void {
    this.leaveTimer = setTimeout(() => { this.hoverCol = null; this.hoverManaged = false; }, 180);
  }

  cancelLeave(): void {
    if (this.leaveTimer) { clearTimeout(this.leaveTimer); this.leaveTimer = null; }
  }

  openQuick(c: ColDef, e: MouseEvent): void {
    e.stopPropagation();
    const row = (e.currentTarget as HTMLElement).closest('.crow') as HTMLElement;
    const menu = row.closest('.colmenu') as HTMLElement;
    this.quickTop = row.getBoundingClientRect().top - menu.getBoundingClientRect().top - 8;
    this.quickCol = c.id;
  }

  goSettings(c: ColDef | null): void {
    this.quickCol = this.hoverCol = this.nudgeCol = null;
    this.toast = c
      ? `Opening Settings › Documents › Default columns — “${c.label}” preselected`
      : 'Opening Settings › Documents › Default columns';
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 2600);
  }

  ngOnInit(): void { this.tracker.trackPageView('column-admin-hint'); }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    [this.leaveTimer, this.nudgeTimer, this.toastTimer].forEach(t => t && clearTimeout(t));
  }
}
