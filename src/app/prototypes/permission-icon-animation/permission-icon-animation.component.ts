import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  SidebarNavItem,
  SegmentItem,
  FvdrFileType,
  FvdrIconName,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permission-icon-animation';

/** Publish state of a document — drives the chip's colours and its hover label. */
type PubState = 'published' | 'partial' | 'unpublished';

interface DocRow {
  id: number;
  index: string;
  name: string;
  type: FvdrFileType;
  state: PubState;
  level: number;        // 0–7, highest permission granted to the selected group
  expandable?: boolean;
  room?: boolean;       // the root "Room name" row has no chip
}

interface GroupRow {
  id: number;
  name: string;
  color: string;
  icon: FvdrIconName;
}

/** Figma "Component 1": Property 1 = Published | Unpublished | Partially published */
const STATE_LABEL: Record<PubState, string> = {
  published:   'Published',
  partial:     'Unpublished documents inside',
  unpublished: 'Unpublished',
};

const PERM_COLS: { label: string; icon: FvdrIconName }[] = [
  { label: 'Fence',     icon: 'perm-fence'     },
  { label: 'View',      icon: 'perm-view'      },
  { label: 'Encrypted', icon: 'perm-encrypted' },
  { label: 'PDF',       icon: 'perm-pdf'       },
  { label: 'Original',  icon: 'perm-original'  },
  { label: 'Upload',    icon: 'perm-upload'    },
  { label: 'Manage',    icon: 'perm-manage'    },
];

@Component({
  selector: 'fvdr-permission-icon-animation',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell"
         [style.--chip-dur.ms]="duration"
         [style.--chip-ease]="easingValue">

      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Nova Z"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
      />

      <div class="main">

        <header class="top-bar">
          <fvdr-breadcrumbs [items]="breadcrumbs" />
          <div class="hdr-actions">
            <button class="ic-btn" aria-label="Help"><fvdr-icon name="help" /></button>
            <fvdr-avatar initials="JD" size="md" />
          </div>
        </header>

        <div class="content">

          <!-- ── Animation controls (prototype-only) ───────────── -->
          <div class="lab">
            <div class="lab-group">
              <span class="lab-label">Expand</span>
              <fvdr-segment [items]="behaviourItems" [activeId]="behaviour"
                            (activeIdChange)="setBehaviour($any($event))" />
            </div>
            <div class="lab-group">
              <span class="lab-label">Duration</span>
              <fvdr-segment [items]="durationItems" [activeId]="String(duration)"
                            (activeIdChange)="setDuration($any($event))" />
            </div>
            <div class="lab-group">
              <span class="lab-label">Easing</span>
              <fvdr-segment [items]="easingItems" [activeId]="easing"
                            (activeIdChange)="setEasing($any($event))" />
            </div>
            <p class="lab-note">
              {{ behaviour === 'push'
                 ? 'Per Figma: the chip sits in the row flow, so the label pushes the document name aside.'
                 : 'Alternative: the chip floats over the row — nothing shifts, but the label covers the start of the name.' }}
            </p>
          </div>

          <!-- ── Toolbar ───────────────────────────────────────── -->
          <div class="toolbar">
            <button class="tool-btn"><fvdr-icon name="copy" /> Copy from another group</button>
            <button class="tool-btn"><fvdr-icon name="download" /> Export</button>
            <button class="tool-btn"><fvdr-icon name="settings-filter" /> Set permissions by file type</button>
            <div class="toolbar-spacer"></div>
            <div class="search-wrap"><fvdr-search [(ngModel)]="searchQuery" placeholder="Search" /></div>
          </div>

          <!-- ── Panels ────────────────────────────────────────── -->
          <div class="panels">

            <aside class="groups-panel">
              <div class="panel-hdr">
                <span class="panel-title">Groups</span>
                <button class="tool-link tool-link--sm">
                  <fvdr-icon name="documents" /> By documents
                </button>
              </div>
              <div class="group-list">
                <div *ngFor="let g of groups"
                     class="group-item"
                     [class.group-item--selected]="g.id === selectedGroupId"
                     (click)="selectedGroupId = g.id">
                  <fvdr-icon name="chevron-right" class="group-chevron" />
                  <fvdr-icon [name]="g.icon" [style.color]="g.color" />
                  <span class="group-name">{{ g.name }}</span>
                </div>
              </div>
            </aside>

            <section class="docs-panel">

              <div class="docs-hdr">
                <span class="docs-title">Documents</span>
                <div class="perm-hdr">
                  <div *ngFor="let col of permCols" class="perm-th">
                    <fvdr-icon [name]="col.icon" />
                    <span>{{ col.label }}</span>
                  </div>
                </div>
              </div>

              <div class="docs-rows">
                <div *ngFor="let row of rows" class="doc-row">

                  <span class="row-expand">
                    <fvdr-icon *ngIf="row.expandable" name="chevron-right" />
                  </span>

                  <!-- ── The permission icon ─────────────────── -->
                  <span class="chip-slot" [class.chip-slot--fixed]="behaviour === 'overlay'">
                    <fvdr-avatar *ngIf="row.room" initials="RN" size="sm"
                                 color="var(--color-primary-500)" textColor="#fff" />
                    <span *ngIf="!row.room"
                          class="chip"
                          [ngClass]="'chip--' + row.state"
                          data-track="permission-chip"
                          tabindex="0"
                          [attr.aria-label]="stateLabel(row.state)"
                          (mouseenter)="onChipHover()"
                          (focus)="onChipHover()">
                      <fvdr-file-icon [type]="row.type" />
                      <span class="chip-badge">
                        <fvdr-icon [name]="row.state === 'unpublished' ? 'close' : 'check'" />
                      </span>
                      <span class="chip-label">
                        <span class="chip-label-in"><span class="chip-text">{{ stateLabel(row.state) }}</span></span>
                      </span>
                    </span>
                  </span>

                  <span class="row-idx">{{ row.index }}</span>
                  <span class="row-name">{{ row.name }}</span>

                  <span class="row-perms">
                    <fvdr-icon *ngIf="row.level === 0" name="cancel" class="perm-none-mark" />
                    <span class="slider-track">
                      <span *ngFor="let pos of sliderRange"
                            class="slider-block"
                            [class.s-light]="pos < row.level"
                            [class.s-active]="pos === row.level"></span>
                    </span>
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-family);
      background: var(--color-stone-0);
      --chip-dur: 180ms;
      --chip-ease: cubic-bezier(.2,.8,.2,1);
    }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

    .top-bar {
      height: 64px; min-height: 64px;
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
    }
    .hdr-actions { display: flex; align-items: center; gap: var(--space-4); }
    .ic-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; background: none; cursor: pointer;
      color: var(--color-text-secondary); border-radius: var(--radius-sm);
    }
    .ic-btn:hover { background: var(--color-hover-bg); }

    .content {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
      padding: var(--space-6); gap: var(--space-5);
      background: var(--color-stone-0);
    }

    /* ── Controls ─────────────────────────────────────────────── */
    .lab {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: var(--space-5);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-sm);
      background: var(--color-stone-100);
      flex-shrink: 0;
    }
    .lab-group { display: flex; align-items: center; gap: var(--space-2); }
    .lab-label {
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .lab-note {
      margin: 0; flex: 1 1 100%;
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
    }

    /* ── Toolbar ──────────────────────────────────────────────── */
    .toolbar { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
    .toolbar-spacer { flex: 1; }
    .search-wrap { width: 320px; }
    .tool-btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      height: 36px; padding: 0 var(--space-4);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      color: var(--color-text-primary);
      font-family: inherit; font-size: var(--text-body3-size, 14px);
      cursor: pointer;
    }
    .tool-btn fvdr-icon { font-size: var(--text-body1-size, 16px); color: var(--color-text-secondary); }
    .tool-btn:hover { border-color: var(--color-primary-500); }
    .tool-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      border: none; background: none; cursor: pointer;
      color: var(--color-primary-500);
      font-family: inherit; font-size: var(--text-body3-size, 14px);
    }
    .tool-link fvdr-icon { font-size: var(--text-body1-size, 16px); }

    /* ── Panels ───────────────────────────────────────────────── */
    .panels { flex: 1; display: flex; gap: var(--space-5); overflow: hidden; }

    .groups-panel {
      width: 306px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: var(--space-2); overflow: hidden;
    }
    .panel-hdr {
      display: flex; align-items: center; justify-content: space-between;
      height: 48px; padding: 0 var(--space-4); flex-shrink: 0;
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
    }
    .panel-title { font-size: var(--text-body3-size, 14px); font-weight: var(--text-label-s-weight, 600); }
    .group-list { flex: 1; overflow: auto; padding: var(--space-2) 0; }
    .group-item {
      display: flex; align-items: center; gap: var(--space-2);
      height: 40px; padding: 0 var(--space-4); cursor: pointer;
      font-size: var(--text-body3-size, 14px);
    }
    .group-item:hover { background: var(--color-hover-bg); }
    .group-item--selected { background: var(--color-primary-50); }
    .group-chevron { font-size: 16px; color: var(--color-text-secondary); }
    .group-name { color: var(--color-text-primary); }

    .docs-panel {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: var(--space-2); overflow: hidden;
    }
    .docs-hdr {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 56px; padding: 0 var(--space-4); flex-shrink: 0;
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
    }
    .docs-title { font-size: var(--text-body3-size, 14px); font-weight: var(--text-label-s-weight, 600); }
    .perm-hdr { display: flex; }
    .perm-th {
      width: 62px; display: flex; flex-direction: column; align-items: center; gap: 2px;
      font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary);
    }
    .perm-th fvdr-icon { font-size: 16px; color: var(--color-text-secondary); }

    .docs-rows { flex: 1; overflow: auto; }
    .doc-row {
      display: flex; align-items: center; gap: var(--space-2);
      min-height: 40px; padding: 0 var(--space-4);
    }
    .doc-row:hover { background: var(--color-stone-100); }
    .row-expand { width: 20px; flex-shrink: 0; color: var(--color-text-secondary); font-size: 16px; }
    .row-idx { color: var(--color-text-secondary); font-size: var(--text-body3-size, 14px); flex-shrink: 0; }
    .row-name {
      flex: 1; min-width: 0;
      font-size: var(--text-body3-size, 14px); color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .row-perms { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
    .perm-none-mark { color: var(--color-error-600); font-size: 16px; }
    .slider-track { display: flex; height: 16px; }
    .slider-block {
      width: 62px; height: 16px;
      border: 1px solid var(--color-stone-500);
      border-left: none;
      background: var(--color-stone-300);
      flex-shrink: 0;
    }
    .slider-block:first-child {
      border-left: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    }
    .slider-block:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
    .s-light  { background: var(--color-primary-100); }
    .s-active { background: var(--color-primary-500); }

    /* ── The permission chip ──────────────────────────────────── */
    .chip-slot {
      display: inline-flex; align-items: center;
      flex-shrink: 0; position: relative;
    }
    /* Overlay mode: the slot keeps the collapsed 47px footprint and the chip
       simply overflows it. Absolute positioning would collapse the grid track
       (an abspos shrink-to-fit box resolves the label.s 1fr to 0). */
    .chip-slot--fixed { width: 47px; }
    .chip-slot--fixed .chip { flex: 0 0 auto; }

    .chip {
      display: inline-flex; align-items: center;
      position: relative;
      height: 30px;
      padding: 4px 1px 4px 4px;
      box-sizing: border-box;
      border: 1px solid;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background-color var(--chip-dur) var(--chip-ease),
                  border-color     var(--chip-dur) var(--chip-ease),
                  padding-right    var(--chip-dur) var(--chip-ease);
    }
    .chip:hover, .chip:focus-visible { padding-right: 4px; z-index: 2; outline: none; }
    .chip--published   { background: var(--color-primary-50); border-color: var(--color-primary-100); }
    .chip--partial     { background: var(--color-primary-50); border-color: var(--color-primary-500); border-style: dashed; }
    .chip--unpublished { background: var(--color-stone-200);   border-color: var(--color-stone-300); }

    .chip-badge {
      width: 20px; height: 20px; flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .chip-badge fvdr-icon { font-size: var(--text-caption1-size, 12px); }
    .chip--published .chip-badge,
    .chip--partial   .chip-badge { color: var(--color-primary-500); }
    .chip--unpublished .chip-badge { color: var(--color-text-secondary); }

    /* 0fr → 1fr animates to the label's natural width, so nothing is hard-coded. */
    .chip-label {
      display: inline-grid;
      grid-template-columns: 0fr;
      opacity: 0;
      transition: grid-template-columns var(--chip-dur) var(--chip-ease),
                  opacity               var(--chip-dur) var(--chip-ease);
    }
    .chip:hover .chip-label,
    .chip:focus-visible .chip-label { grid-template-columns: 1fr; opacity: 1; }
    /* The inner wrapper clips; its padding must live on a child, or a 0fr
       column still leaks the padding width into the collapsed chip. */
    .chip-label-in { overflow: hidden; }
    .chip-text {
      display: block;
      white-space: nowrap;
      padding-left: 2px;
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-primary);
    }

    @media (prefers-reduced-motion: reduce) {
      .chip, .chip-label { transition-duration: 1ms; }
    }
  `],
})
export class PermissionIconAnimationComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  sidebarCollapsed = true;
  searchQuery = '';
  selectedGroupId = 1;
  private hovered = false;

  // Animation controls
  behaviour: 'push' | 'overlay' = 'push';
  duration = 180;
  easing: 'ease-out' | 'spring' = 'spring';

  readonly String = String;
  readonly permCols = PERM_COLS;
  readonly sliderRange = [1, 2, 3, 4, 5, 6, 7];

  readonly behaviourItems: SegmentItem[] = [
    { id: 'push',    label: 'Push (Figma)' },
    { id: 'overlay', label: 'Overlay' },
  ];
  readonly durationItems: SegmentItem[] = [
    { id: '120', label: '120 ms' },
    { id: '180', label: '180 ms' },
    { id: '260', label: '260 ms' },
  ];
  readonly easingItems: SegmentItem[] = [
    { id: 'ease-out', label: 'Ease out' },
    { id: 'spring',   label: 'Spring' },
  ];

  readonly navItems: SidebarNavItem[] = [
    { id: 'documents',   label: 'Documents',   icon: 'documents',       iconActive: 'documents-active'       },
    { id: 'users',       label: 'Users',       icon: 'users-groups',    iconActive: 'users-groups-active'    },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active', active: true },
    { id: 'settings',    label: 'Settings',    icon: 'nav-settings',    iconActive: 'nav-settings-active'    },
    { id: 'activity',    label: 'Activity',    icon: 'activities',      iconActive: 'activities-active'      },
  ];

  readonly breadcrumbs = [
    { id: 'permissions', label: 'Permissions' },
    { id: 'documents',   label: 'Documents'   },
  ];

  readonly groups: GroupRow[] = [
    { id: 1, name: 'Yellow Co.', color: '#D1B200', icon: 'user'            },
    { id: 2, name: 'Red Co.',    color: '#E54430', icon: 'users-groups'    },
    { id: 3, name: 'Green Co.',  color: '#2C9C74', icon: 'users-groups'    },
    { id: 4, name: 'Blue Co.',   color: '#358CEB', icon: 'user-check'      },
    { id: 5, name: 'White team', color: '#9C9EA8', icon: 'user'            },
  ];

  readonly rows: DocRow[] = [
    { id: 0, index: '',  name: 'Room name',                           type: 'folder', state: 'published',   level: 5, room: true },
    { id: 1, index: '1', name: 'Stage folder',                        type: 'folder', state: 'published',   level: 2, expandable: true },
    { id: 2, index: '2', name: 'Organizational chart and manage',     type: 'folder', state: 'published',   level: 7, expandable: true },
    { id: 3, index: '3', name: 'Corporate DD - Product and Services', type: 'folder', state: 'partial',     level: 2, expandable: true },
    { id: 4, index: '4', name: 'Financial DD - Accounts Receivables', type: 'folder', state: 'unpublished', level: 2, expandable: true },
    { id: 5, index: '5', name: 'Key contacts by function',            type: 'doc',    state: 'unpublished', level: 2 },
    { id: 6, index: '6', name: 'Tax accounting.xlsx',                 type: 'xls',    state: 'unpublished', level: 2 },
    { id: 7, index: '7', name: 'Tax returns.pdf',                     type: 'pdf',    state: 'unpublished', level: 2 },
    { id: 8, index: '8', name: 'Registration with tax authorities',   type: 'pdf',    state: 'published',   level: 0 },
  ];

  get easingValue(): string {
    return this.easing === 'spring' ? 'cubic-bezier(.2,.8,.2,1)' : 'cubic-bezier(.33,1,.68,1)';
  }

  stateLabel(s: PubState): string {
    return STATE_LABEL[s];
  }

  setBehaviour(id: string): void {
    this.behaviour = id === 'overlay' ? 'overlay' : 'push';
  }

  setDuration(id: string): void {
    this.duration = Number(id) || 180;
  }

  setEasing(id: string): void {
    this.easing = id === 'ease-out' ? 'ease-out' : 'spring';
  }

  onChipHover(): void {
    if (this.hovered) return;
    this.hovered = true;
    this.tracker.trackTask(SLUG, 'task_complete', 'chip_hovered');
  }

  ngOnInit(): void {
    this.tracker.trackPageView(SLUG);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }
}
