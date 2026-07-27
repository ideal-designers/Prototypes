import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction } from '../../shared/ds';
import { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';
import { TrackerService } from '../../services/tracker.service';

interface Uploader {
  name: string;
  email: string;
  initials: string;
  role: string;
}

interface DocRow {
  id: string;
  fileType: FvdrFileType;
  name: string;
  index: number;
  published: boolean;
  addedDate: string;
  addedBy: Uploader;
  notes: number;
  sizeMain: string;
  sizeSub: string;
  redaction: 'applied' | 'none';
}

@Component({
  selector: 'fvdr-added-column-hover',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Room name"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavClick($event)"
      />

      <div class="main-area">
        <fvdr-header
          [breadcrumbs]="breadcrumbItems"
          [actions]="headerActions"
          userName="LZ"
        />

        <div class="content-wrap">
          <div class="toolbar">
            <div class="toolbar-left">
              <fvdr-btn label="Add" variant="primary" size="m" iconName="plus"></fvdr-btn>
              <fvdr-btn label="Download" variant="secondary" size="m" iconName="download"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m" iconName="action-list"></fvdr-btn>
              <fvdr-btn variant="secondary" size="m" [iconOnly]="true" iconName="more" ariaLabel="More actions"></fvdr-btn>
            </div>
            <div class="toolbar-right">
              <fvdr-btn label="View as" variant="secondary" size="m" iconName="view-as"></fvdr-btn>
              <fvdr-search placeholder="Search" [filter]="true"></fvdr-search>
            </div>
          </div>

          <div class="content-row">

            <div class="qa-panel">
              <div class="qa-section">
                <div class="qa-heading">Quick access</div>
                <div class="qa-item"><fvdr-icon name="history"></fvdr-icon><span>Recently viewed</span></div>
                <div class="qa-item"><fvdr-icon name="upload"></fvdr-icon><span>Newly upload</span></div>
                <div class="qa-item"><fvdr-icon name="star"></fvdr-icon><span>Favorites</span></div>
              </div>
              <div class="qa-tree">
                <div class="qa-tree-row qa-tree-row--root">
                  <span class="qa-project-badge">RN</span>
                  <span class="qa-lbl">Room name</span>
                </div>
                <div class="qa-tree-row" *ngFor="let row of rows" [style.padding-left.px]="32">
                  <fvdr-file-icon [type]="row.fileType"></fvdr-file-icon>
                  <span class="qa-idx">{{ row.index }}</span>
                  <span class="qa-lbl">{{ row.name }}</span>
                </div>
              </div>
            </div>

            <div class="tbl-wrap">
              <div class="tbl-row tbl-row--header">
                <div class="col-chk"><fvdr-checkbox></fvdr-checkbox></div>
                <div class="col-idx">Index</div>
                <div class="col-name">Name</div>
                <div class="col-pub">Publishing</div>
                <div class="col-added">
                  Added
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                </div>
                <div class="col-notes">Notes</div>
                <div class="col-size">Size</div>
                <div class="col-red">
                  Redaction
                  <fvdr-icon name="sort" class="th-sort"></fvdr-icon>
                </div>
                <div class="col-act"></div>
              </div>

              <div class="tbl-row" *ngFor="let row of rows">
                <div class="col-chk"><fvdr-checkbox></fvdr-checkbox></div>
                <div class="col-idx">{{ row.index }}</div>
                <div class="col-name">
                  <fvdr-file-icon [type]="row.fileType" class="doc-icon"></fvdr-file-icon>
                  <span class="td-name">{{ row.name }}</span>
                </div>
                <div class="col-pub">
                  <fvdr-icon [name]="row.published ? 'finished' : 'cross-circle'"
                             [class.pub-yes]="row.published"
                             [class.pub-no]="!row.published"></fvdr-icon>
                </div>

                <!-- ── Added column: hover trigger ── -->
                <div class="col-added">
                  <div class="added-cell"
                       (mouseenter)="openPopover(row)"
                       (mouseleave)="scheduleClosePopover()"
                       (focus)="openPopover(row)"
                       (blur)="scheduleClosePopover()"
                       tabindex="0">
                    <div class="added-line">
                      <span class="added-date">{{ row.addedDate }}</span>
                    </div>
                    <div class="added-line added-line--who">
                      <span class="added-who">{{ row.addedBy.name }}</span>
                      <fvdr-icon name="more" class="added-trigger-icon"></fvdr-icon>
                    </div>
                  </div>

                  <div class="uploader-popover"
                       *ngIf="activeRow?.id === row.id"
                       (mouseenter)="cancelClosePopover()"
                       (mouseleave)="scheduleClosePopover()">
                    <div class="pv-line">
                      <span class="pv-text pv-name">{{ row.addedBy.name }}</span>
                      <button class="icon-btn" (click)="copyText(row.addedBy.name, 'Name')" aria-label="Copy name">
                        <fvdr-icon name="copy"></fvdr-icon>
                      </button>
                      <button class="icon-btn" (click)="openUserCard(row.addedBy)" aria-label="Open user card">
                        <fvdr-icon name="user-circle"></fvdr-icon>
                      </button>
                    </div>
                    <div class="pv-line">
                      <span class="pv-text">{{ row.addedBy.email }}</span>
                      <button class="icon-btn" (click)="copyText(row.addedBy.email, 'Email')" aria-label="Copy email">
                        <fvdr-icon name="copy"></fvdr-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="col-notes">
                  <span class="notes-badge" *ngIf="row.notes">{{ row.notes }}</span>
                </div>
                <div class="col-size">
                  <span class="td-size-main">{{ row.sizeMain }}</span>
                  <span class="td-size-sub">{{ row.sizeSub }}</span>
                </div>
                <div class="col-red">
                  <span class="red-chip" [ngClass]="'red-chip--' + row.redaction">
                    {{ row.redaction === 'applied' ? 'Applied' : 'None' }}
                  </span>
                </div>
                <div class="col-act"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <fvdr-modal [visible]="cardModalOpen" [title]="selectedUser?.name || ''" size="s" (closed)="cardModalOpen = false">
      <div class="user-card" *ngIf="selectedUser as u">
        <div class="user-card__head">
          <fvdr-avatar [initials]="u.initials" size="lg"></fvdr-avatar>
          <div>
            <p class="user-card__name">{{ u.name }}</p>
            <p class="user-card__role">{{ u.role }}</p>
          </div>
        </div>
        <div class="user-card__row">
          <fvdr-icon name="mail"></fvdr-icon>
          <span>{{ u.email }}</span>
        </div>
        <div class="user-card__row">
          <fvdr-icon name="upload"></fvdr-icon>
          <span>{{ filesAddedBy(u) }} files added to this room</span>
        </div>
      </div>
    </fvdr-modal>

    <div class="toast" [class.toast--show]="toastMessage">{{ toastMessage }}</div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      height: 100vh;
      overflow: hidden;
    }

    .page-layout { display: flex; height: 100%; background: var(--color-stone-100); }
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .content-wrap {
      flex: 1; display: flex; flex-direction: column;
      padding: var(--space-6); gap: var(--space-5);
      overflow: hidden; min-height: 0; background: var(--color-stone-0);
    }

    .toolbar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; height: 40px; }
    .toolbar-left, .toolbar-right { display: flex; gap: var(--space-3); align-items: center; }

    .content-row { flex: 1; display: flex; gap: var(--space-6); min-height: 0; overflow: hidden; background: var(--color-stone-0); }

    /* ── Quick access + tree (static) ── */
    .qa-panel { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto; }
    .qa-heading { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); padding: var(--space-3) 0; }
    .qa-item { display: flex; align-items: center; gap: var(--space-3); height: 40px; padding: 0 var(--space-2); color: var(--color-text-secondary); border-radius: var(--radius-sm); cursor: pointer; }
    .qa-item:hover { background: var(--color-hover-bg); }
    .qa-tree { margin-top: var(--space-4); display: flex; flex-direction: column; }
    .qa-tree-row { display: flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-2); border-radius: var(--radius-sm); cursor: pointer; }
    .qa-tree-row:hover { background: var(--color-hover-bg); }
    .qa-tree-row--root { padding-left: var(--space-2); font-weight: 600; }
    .qa-project-badge {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; background: var(--color-primary-500);
      border-radius: var(--radius-sm); color: #fff; font-size: var(--text-caption1-size); font-weight: 600; flex-shrink: 0;
    }
    .qa-idx { font-size: var(--font-size-base); color: var(--color-text-secondary); flex-shrink: 0; }
    .qa-lbl { font-size: var(--font-size-base); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

    /* ── Table ── */
    .tbl-wrap { position: relative; flex: 1; display: flex; flex-direction: column; background: var(--color-stone-0); overflow: auto; min-width: 0; }
    .tbl-row { display: grid; grid-template-columns: 32px 70px minmax(200px,1fr) 100px 160px 64px 110px 110px 40px; align-items: center; min-width: max-content; }
    .tbl-row:not(.tbl-row--header):hover { background: var(--color-hover-bg); }
    .tbl-row--header { background: var(--color-stone-200); min-height: 48px; position: sticky; top: 0; z-index: 3; }
    .tbl-row--header > div { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: var(--space-2); }
    .tbl-row:not(.tbl-row--header) { min-height: 44px; }
    .tbl-row > div { padding: 0 var(--space-3); overflow: visible; }
    .th-sort { font-size: 14px; color: var(--color-text-secondary); }

    .col-chk { justify-content: center; display: flex; }
    .col-name { display: flex; align-items: center; gap: var(--space-2); overflow: hidden; }
    .doc-icon { flex-shrink: 0; }
    .td-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .col-pub { display: flex; }
    .pub-yes { color: var(--color-primary-500); font-size: 16px; }
    .pub-no { color: var(--color-stone-500); font-size: 16px; }

    .col-notes { display: flex; }
    .notes-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 24px; height: 24px; padding: 0 var(--space-2);
      background: var(--color-stone-300); border-radius: 12px; font-size: var(--font-size-base);
    }

    .col-size { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; }
    .td-size-main { font-size: var(--text-caption1-size); color: var(--color-text-primary); line-height: 16px; }
    .td-size-sub { font-size: var(--text-caption1-size); color: var(--color-text-secondary); line-height: 16px; }

    .col-red { display: flex; }
    .red-chip {
      display: inline-flex; align-items: center; justify-content: center;
      height: 28px; padding: 0 var(--space-3); border-radius: 24px;
      font-size: var(--font-size-base); color: var(--color-text-primary); white-space: nowrap;
    }
    .red-chip--applied { background: var(--color-primary-50); }
    .red-chip--none { background: var(--color-stone-300); }

    .col-act { justify-content: flex-end; display: flex; }

    /* ── Added column hover interaction ── */
    .col-added { position: relative; overflow: visible; }
    .added-cell {
      display: flex; flex-direction: column; justify-content: center; gap: 2px;
      padding: 4px 6px; margin: -4px -6px; border-radius: var(--radius-sm);
      cursor: default; outline: none;
    }
    .added-cell:hover, .added-cell:focus-visible { background: var(--color-hover-bg); }
    .added-date { font-size: var(--text-caption1-size); color: var(--color-text-primary); line-height: 16px; }
    .added-line--who { display: flex; align-items: center; gap: 4px; }
    .added-who {
      font-size: var(--text-caption1-size); color: var(--color-text-secondary); line-height: 16px;
      text-decoration: underline dotted; text-underline-offset: 2px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 84px;
    }
    .added-trigger-icon { font-size: 14px; color: var(--color-text-secondary); opacity: 0; transition: opacity 0.1s ease; }
    .added-cell:hover .added-trigger-icon, .added-cell:focus-visible .added-trigger-icon { opacity: 1; }

    .uploader-popover {
      position: absolute; top: calc(100% + 4px); left: 0; z-index: 10;
      width: 260px; background: var(--color-stone-0); border: 1px solid var(--color-stone-200);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-popover);
      padding: 0 var(--space-4);
    }
    .pv-line { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) 0; }
    .pv-line + .pv-line { border-top: 1px solid var(--color-divider); }
    .pv-text { flex: 1; min-width: 0; font-size: var(--font-size-base); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pv-name { font-weight: 600; }
    .icon-btn {
      width: 24px; height: 24px; flex-shrink: 0; border: none; background: transparent;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: var(--color-text-secondary); border-radius: var(--radius-sm); font-size: 15px; padding: 0;
    }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-primary-600); }

    /* ── User card modal ── */
    .user-card__head { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
    .user-card__name { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); margin: 0; }
    .user-card__role { font-size: var(--text-caption1-size); color: var(--color-text-secondary); margin: 2px 0 0; }
    .user-card__row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-base); color: var(--color-text-secondary); padding: var(--space-2) 0; border-top: 1px solid var(--color-divider); }

    /* ── Toast ── */
    .toast {
      position: fixed; left: 50%; bottom: 32px; transform: translate(-50%, 8px);
      background: var(--color-stone-900); color: #fff; padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-sm); font-size: var(--font-size-base);
      opacity: 0; pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease; z-index: 100;
    }
    .toast--show { opacity: 1; transform: translate(-50%, 0); }
  `],
})
export class AddedColumnHoverComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  sidebarCollapsed = true;

  breadcrumbItems = [
    { id: 'docs', label: 'Documents' },
    { id: 'all', label: 'All' },
  ];

  navItems: SidebarNavItem[] = [
    { id: 'overview', icon: 'nav-overview', iconActive: 'nav-overview-active', label: 'Dashboard', active: false },
    { id: 'projects', icon: 'nav-projects', iconActive: 'nav-projects-active', label: 'Documents', active: true },
    { id: 'reports', icon: 'nav-reports', iconActive: 'nav-reports-active', label: 'Reports', active: false },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'api', icon: 'nav-api', iconActive: 'nav-api-active', label: 'Q&A', active: false },
    { id: 'settings', icon: 'nav-settings', iconActive: 'nav-settings-active', label: 'Settings', active: false },
  ];

  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'help', icon: 'help' },
  ];

  onNavClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => (n.active = false));
    item.active = true;
  }

  private readonly brianChen: Uploader = { name: 'Brian Chen', email: 'brian.chen@acme-corp.com', initials: 'BC', role: 'Bidder' };
  private readonly aliceJohnson: Uploader = { name: 'Alice Johnson', email: 'alice.johnson@acme-corp.com', initials: 'AJ', role: 'Bidder' };
  private readonly michaelSmith: Uploader = { name: 'Michael Smith', email: 'michael.smith@acme-corp.com', initials: 'MS', role: 'Bidder' };
  private readonly aliseLee: Uploader = { name: 'Alise Lee', email: 'alise.lee@ideals-team.com', initials: 'AL', role: 'Project admin' };
  private readonly sarahJohnson: Uploader = { name: 'Sarah Johnson', email: 'sarah.johnson@acme-corp.com', initials: 'SJ', role: 'Contributor' };
  private readonly davidBrown: Uploader = { name: 'David Brown', email: 'david.brown@acme-corp.com', initials: 'DB', role: 'Bidder' };
  private readonly emilyDavis: Uploader = { name: 'Emily Davis', email: 'emily.davis@acme-corp.com', initials: 'ED', role: 'Bidder' };

  rows: DocRow[] = [
    { id: '1', fileType: 'folder', name: 'Alpha Division', index: 1, published: true, addedDate: 'Jul 11, 2026', addedBy: this.brianChen, notes: 0, sizeMain: '0 subfolders', sizeSub: '0 files', redaction: 'none' },
    { id: '2', fileType: 'folder', name: 'Beta Sector', index: 2, published: true, addedDate: 'Jul 12, 2026', addedBy: this.aliceJohnson, notes: 0, sizeMain: '0 subfolders', sizeSub: '0 files', redaction: 'none' },
    { id: '3', fileType: 'folder', name: 'Gamma Quadrant', index: 3, published: true, addedDate: 'Jul 13, 2026', addedBy: this.michaelSmith, notes: 0, sizeMain: '0 subfolders', sizeSub: '0 files', redaction: 'none' },
    { id: '4', fileType: 'folder', name: 'Zeta Complex', index: 4, published: false, addedDate: 'Feb 23, 2026', addedBy: this.aliseLee, notes: 2, sizeMain: '5 subfolders', sizeSub: '10 files', redaction: 'none' },
    { id: '5', fileType: 'folder', name: 'Delta Labs', index: 5, published: false, addedDate: 'Aug 21, 2026', addedBy: this.sarahJohnson, notes: 2, sizeMain: '12 subfolders', sizeSub: '89 files', redaction: 'none' },
    { id: '6', fileType: 'doc', name: 'Uni Labs', index: 6, published: false, addedDate: 'Feb 23, 2026', addedBy: this.aliseLee, notes: 2, sizeMain: '4.9 KB', sizeSub: '4 pages', redaction: 'none' },
    { id: '7', fileType: 'pdf', name: 'Elipson Project', index: 7, published: false, addedDate: 'Sep 15, 2026', addedBy: this.davidBrown, notes: 0, sizeMain: '1.2 MB', sizeSub: '12 pages', redaction: 'applied' },
    { id: '9', fileType: 'xls', name: 'Elipson Project', index: 9, published: false, addedDate: 'Oct 30, 2026', addedBy: this.emilyDavis, notes: 0, sizeMain: '2.4 MB', sizeSub: '34 pages', redaction: 'none' },
  ];

  activeRow: DocRow | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  openPopover(row: DocRow): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.activeRow = row;
  }

  scheduleClosePopover(): void {
    this.closeTimer = setTimeout(() => { this.activeRow = null; }, 200);
  }

  cancelClosePopover(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  copyText(value: string, label: string): void {
    navigator.clipboard?.writeText(value);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = `${label} copied`;
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 1400);
  }

  cardModalOpen = false;
  selectedUser: Uploader | null = null;

  openUserCard(user: Uploader): void {
    this.selectedUser = user;
    this.cardModalOpen = true;
    this.activeRow = null;
    this.tracker.trackTask('added-column-hover', 'task_complete');
  }

  filesAddedBy(user: Uploader): number {
    return this.rows.filter(r => r.addedBy.email === user.email).length;
  }

  ngOnInit(): void {
    this.tracker.trackPageView('added-column-hover');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
