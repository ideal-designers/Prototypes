import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, SegmentItem, TabItem } from '../../shared/ds';
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
  /** Admin enabled it for everyone in Settings › Project › Documents. */
  forAll?: boolean;
}

type Variant = 'hint' | 'badge';

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
      <fvdr-sidebar-nav variant="vdr" accountName="Room name" [items]="navItems" [(collapsed)]="sidebarCollapsed" (itemClick)="onNavClick($event)" />

      <div class="main-area">
        <fvdr-header [breadcrumbs]="breadcrumbItems" [actions]="headerActions" userName="LZ" (breadcrumbClick)="onCrumb($event)" />

        <div class="content-wrap" *ngIf="view === 'docs'">
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

            <!-- ═══════════ Column manager popover (Figma 29961-166319 / 30022-168764) ═══════════ -->
            <div class="colmenu" *ngIf="menuOpen" (click)="$event.stopPropagation()">
              <div class="colmenu__top">
                <fvdr-toggle size="s" [checked]="foldersFirst" (checkedChange)="foldersFirst = $event" label="Folders first"></fvdr-toggle>
              </div>

              <div class="colmenu__list">
                <!-- One hover zone per column: the row + (option 1) its inline hint, so moving the
                     pointer from the row down into the hint's "Change settings" link keeps it open. -->
                <div class="citem" *ngFor="let c of cols"
                     (mouseenter)="hoverCol = c.id"
                     (mouseleave)="hoverCol = null">
                  <div class="crow"
                       [class.crow--on]="c.visible && !c.locked"
                       [class.crow--locked]="c.locked"
                       [class.crow--hover]="hoverCol === c.id && !c.locked">
                    <span class="crow__drag"><fvdr-icon name="drag"></fvdr-icon></span>
                    <div class="crow__main">
                      <fvdr-checkbox [checked]="c.visible" [disabled]="!!c.locked" (checkedChange)="toggleCol(c, $event)"></fvdr-checkbox>
                      <span class="crow__label" (click)="!c.locked && toggleCol(c, !c.visible)">{{ c.label }}</span>

                      <!-- Option 2 · "For all" badge, revealed on row hover -->
                      <button *ngIf="variant === 'badge' && c.adminManaged && !c.forAll && hoverCol === c.id"
                              class="forall" (click)="goSettings(c)"
                              title="Enable this column for all users in Settings">
                        <fvdr-icon name="user"></fvdr-icon><span>For all</span>
                      </button>
                    </div>
                  </div>

                  <!-- Option 1 · Inline hint, revealed on row hover -->
                  <div class="hint" *ngIf="variant === 'hint' && c.adminManaged && !c.forAll && hoverCol === c.id">
                    <div class="hint__box">
                      <span class="hint__icon"><fvdr-icon name="eye-slash"></fvdr-icon></span>
                      <div class="hint__body">
                        <span class="hint__text">Only admin can see this column</span>
                        <a class="hint__link" (click)="goSettings(c)">Change settings</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════ Settings › Project › Documents (Figma 29961-165793) ═══════════ -->
        <div class="settings" *ngIf="view === 'settings'">
          <fvdr-tabs [tabs]="settingsTabs" activeId="documents"></fvdr-tabs>
          <div class="settings__list">
            <div class="srow" *ngFor="let s of settingRows"
                 [id]="'setting-' + s.id"
                 [class.srow--focus]="focusSetting === s.id">
              <div class="srow__text">
                <div class="srow__title">{{ s.title }}</div>
                <div class="srow__desc">{{ s.desc }}</div>
              </div>
              <fvdr-toggle [checked]="settingValue(s.id)" (checkedChange)="setSetting(s.id, $event)"></fvdr-toggle>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Variant switcher -->
    <div class="switcher" *ngIf="view === 'docs'">
      <span class="switcher__label">Interaction</span>
      <fvdr-segment [items]="variantItems" [activeId]="variant" (activeIdChange)="setVariant($event)" size="sm"></fvdr-segment>
      <span class="switcher__hint">{{ variantHint[variant] }}</span>
    </div>

    <!-- Fake Settings destination -->
    <div class="toast" [class.toast--show]="toast">
      <fvdr-icon name="check"></fvdr-icon>{{ toast }}
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

    /* ── Column manager (Figma: radius 4, pop-over shadow, 40px rows, 15/24 text) ── */
    .colmenu {
      position: absolute; top: 44px; right: 0; z-index: 20; width: 268px;
      background: var(--color-stone-0); border-radius: var(--radius-sm);
      box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.2); overflow: hidden; animation: pop-in 0.14s ease-out;
    }
    @keyframes pop-in { from { opacity: 0; transform: translateY(-4px); } }
    .colmenu__top { padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .colmenu__list { padding-top: var(--space-2); max-height: 560px; overflow-y: auto; }

    .crow { display: flex; align-items: center; height: 40px; font-size: 15px; line-height: 24px; }
    .crow--on { background: var(--color-primary-50); }
    .crow--hover:not(.crow--on) { background: var(--color-stone-200); }
    .crow--locked { opacity: 0.4; }
    .crow__drag { display: flex; align-items: center; padding-left: var(--space-2); font-size: 16px; color: var(--color-stone-500); cursor: grab; }
    .crow--locked .crow__drag { cursor: default; }
    .crow__main { flex: 1; min-width: 0; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-4) var(--space-2) var(--space-3); }
    .crow__label { flex: 1; min-width: 0; cursor: pointer; user-select: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .crow--locked .crow__label { cursor: default; }

    /* Option 2 · "For all" badge — green-50 bg, 12/16 semibold green-500, user icon 14 */
    .forall {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1);
      min-width: 20px; padding: 2px 6px; border: none; border-radius: var(--radius-sm);
      background: var(--color-primary-50); color: var(--color-primary-500);
      font-family: inherit; font-size: var(--text-caption1-size); font-weight: 600; line-height: 16px;
      white-space: nowrap; cursor: pointer; flex-shrink: 0; animation: fade-in 0.12s ease-out;
    }
    .forall fvdr-icon { font-size: 14px; }
    .forall:hover { color: var(--color-primary-700); }
    @keyframes fade-in { from { opacity: 0; } }

    /* Option 1 · Inline hint — stone-100 box, radius 8, eye-slash 16, 12/16 text */
    .hint { padding: var(--space-1) var(--space-3); animation: fade-in 0.12s ease-out; }
    .hint__box { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--color-stone-200); }
    .hint__icon { display: flex; padding: 2px 0; font-size: 16px; color: var(--color-text-secondary); }
    .hint__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
    .hint__text { font-size: var(--text-caption1-size); line-height: 16px; color: var(--color-text-secondary); }
    .hint__link { align-self: flex-start; font-size: var(--text-caption1-size); line-height: 14px; color: var(--color-primary-500); cursor: pointer; }
    .hint__link:hover { color: var(--color-primary-700); text-decoration: underline; text-underline-offset: 2px; }

    /* ── Settings page ── */
    .settings { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-6); background: var(--color-stone-0); }
    .settings__list { margin-top: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); max-width: 560px; }
    .srow {
      display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-6);
      padding: var(--space-2) var(--space-3); margin: 0 calc(-1 * var(--space-3));
      border-radius: var(--radius-md); transition: background 1.2s ease;
    }
    .srow--focus { background: var(--color-primary-50); transition: none; }
    .srow__title { font-size: 15px; line-height: 24px; font-weight: 600; color: var(--color-text-primary); }
    .srow__desc { white-space: nowrap; margin-top: var(--space-1); font-size: var(--font-size-base); line-height: 20px; color: var(--color-text-secondary); }
    .srow fvdr-toggle { margin-top: 2px; flex-shrink: 0; }

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
  view: 'docs' | 'settings' = 'docs';

  get breadcrumbItems() {
    return this.view === 'docs'
      ? [{ id: 'docs', label: 'Documents' }, { id: 'all', label: 'All' }]
      : [{ id: 'settings', label: 'Settings' }, { id: 'project', label: 'Project' }, { id: 'documents', label: 'Documents' }];
  }

  settingsTabs: TabItem[] = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'documents', label: 'Documents' },
    { id: 'labels', label: 'Labels' },
    { id: 'terms', label: 'Terms of use' },
    { id: 'watermarks', label: 'Watermarks' },
    { id: 'security', label: 'Security' },
  ];

  settingRows: { id: string; title: string; desc: string }[] = [
    { id: 'indexing', title: 'Automatic indexing', desc: 'Assign sequential indices to documents or sort them alphanumerically' },
    { id: 'versioning', title: 'Versioning', desc: 'Add new versions to files and track version history' },
    { id: 'publishing', title: 'Publishing', desc: 'Keep documents hidden until published, regardless of their permissions' },
    { id: 'addedOn', title: 'Added on', desc: 'Show when each document was added, in its own column' },
    { id: 'addedBy', title: 'Added by', desc: 'Show which user added each document, in its own column' },
  ];
  private roomSettings: Record<string, boolean> = { indexing: true, versioning: true, publishing: false };
  focusSetting: string | null = null;

  settingValue(id: string): boolean {
    const col = this.cols.find(c => c.id === id);
    return col ? !!col.forAll : !!this.roomSettings[id];
  }

  setSetting(id: string, on: boolean): void {
    const col = this.cols.find(c => c.id === id);
    if (!col) { this.roomSettings[id] = on; return; }
    col.forAll = on;
    // Enabling for everyone also shows it in the admin's own view; turning it off keeps their personal choice.
    if (on) col.visible = true;
    this.showToast(on ? `“${col.label}” column is now shown to all users` : `“${col.label}” column is hidden for other users`);
  }

  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'settings') this.openView('settings');
    if (item.id === 'projects') this.openView('docs');
  }

  onCrumb(id: string): void {
    if (id === 'docs') this.openView('docs');
  }

  private openView(v: 'docs' | 'settings'): void {
    this.view = v;
    this.hoverCol = null;
    const activeId = v === 'docs' ? 'projects' : 'settings';
    this.navItems = this.navItems.map(n => ({ ...n, active: n.id === activeId }));
  }
  navItems: SidebarNavItem[] = [
    { id: 'overview', icon: 'nav-overview', iconActive: 'nav-overview-active', label: 'Dashboard', active: false },
    { id: 'projects', icon: 'nav-projects', iconActive: 'nav-projects-active', label: 'Documents', active: true },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'settings', icon: 'nav-settings', iconActive: 'nav-settings-active', label: 'Settings', active: false },
  ];
  headerActions: HeaderAction[] = [{ id: 'theme', icon: 'theme-dark' }, { id: 'help', icon: 'help' }];

  variant: Variant = 'hint';
  variantItems: SegmentItem[] = [
    { id: 'hint', label: '1 · Inline hint' },
    { id: 'badge', label: '2 · “For all” badge' },
  ];
  variantHint: Record<Variant, string> = {
    hint: 'Hover Added on or Added by',
    badge: 'Hover Added on or Added by, then click “For all”',
  };

  menuOpen = true;
  foldersFirst = true;

  cols: ColDef[] = [
    { id: 'index', label: 'Index', width: '64px', locked: true, visible: true },
    { id: 'name', label: 'Name', width: 'minmax(180px, 1fr)', locked: true, visible: true },
    { id: 'publishing', label: 'Publishing', width: '100px', locked: true, visible: true },
    { id: 'size', label: 'Size', width: '120px', visible: true },
    { id: 'addedOn', label: 'Added on', width: '110px', visible: false, adminManaged: true },
    { id: 'addedBy', label: 'Added by', width: '170px', visible: false, adminManaged: true },
    { id: 'notes', label: 'Notes', width: '72px', visible: true },
    { id: 'labels', label: 'Labels', width: '100px', visible: false },
    { id: 'viewedOn', label: 'Viewed on', width: '110px', visible: false },
    { id: 'permission', label: 'Permission', width: '110px', visible: false },
    { id: 'id', label: 'ID', width: '90px', visible: false },
    { id: 'redaction', label: 'Redaction', width: '110px', visible: true },
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

  hoverCol: ColId | null = null;

  flashCol: ColId | null = null;
  toast = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  setVariant(v: string): void {
    this.variant = v as Variant;
    this.hoverCol = null;
    this.menuOpen = true;
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  toggleCol(c: ColDef, on: boolean): void {
    if (c.locked) return;
    c.visible = on;
    if (on) {
      this.flashCol = c.id;
      setTimeout(() => (this.flashCol = null), 50);
    }
  }

  goSettings(c: ColDef): void {
    this.openView('settings');
    this.focusSetting = c.id;
    setTimeout(() => document.getElementById('setting-' + c.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => (this.focusSetting = null), 1600);
  }

  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  private showToast(msg: string): void {
    this.toast = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 2600);
  }

  ngOnInit(): void { this.tracker.trackPageView('column-admin-hint'); }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.focusTimer) clearTimeout(this.focusTimer);
  }
}
