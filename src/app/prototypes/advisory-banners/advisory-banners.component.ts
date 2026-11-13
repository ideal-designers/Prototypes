import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbItem, DS_COMPONENTS, HeaderAction, SidebarNavItem, TabItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { ProtoGroup, VdrProtoSwitcherComponent } from '../_shared/proto-switcher.component';
import { RollNumberComponent } from './ap-roll-number.component';

type Page = 'projects' | 'documents';
interface DocRow { index: number; name: string; kind: 'folder' | 'pdf' | 'doc'; comments: number; labels: number; pages: number | null; added: string; selected?: boolean }

/**
 * Advisory rewards banners — Figma "Advisory programs" › Dashboard + Promotion (2988:46204)
 *
 *  · All projects: large banner (168px) with a counter roll-up on first visit and on hover,
 *    plus a shine sweeping over "Explore rewards" until the button is hovered.
 *  · Documents: compact banner in the header (341×40) that expands on hover (377×142)
 *    in 300ms with a small bounce at the end; its counter rolls on entry and on hover too.
 */
@Component({
  selector: 'fvdr-advisory-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent, RollNumberComponent],
  template: `
    <div class="app">
      <fvdr-sidebar-nav *ngIf="page === 'projects'" variant="ca" accountName="Account" accountMark="TN" [items]="caNav" [collapsed]="true"></fvdr-sidebar-nav>
      <fvdr-sidebar-nav *ngIf="page === 'documents'" variant="vdr" accountName="Project Cerato" accountMark="PA" [items]="vdrNav" [collapsed]="true"></fvdr-sidebar-nav>

      <div class="main">
        <fvdr-header [breadcrumbs]="page === 'projects' ? crumbsProjects : crumbsDocs" [actions]="headerActions" userName="TN"></fvdr-header>

        <!-- ───────── Page 1 · All projects ───────── -->
        <div class="content" *ngIf="page === 'projects'">
          <section class="big" *ngIf="bigOpen" (mouseenter)="bigTick = bigTick + 1" aria-label="Rewards">
            <img class="big__art" src="assets/advisory/discs.png" alt="" />
            <div class="big__body">
              <h2 class="big__title">
                <fvdr-icon name="trophy-gradient"></fvdr-icon>
                <span><ap-roll-number [value]="points" [duration]="rollMs" [firstDuration]="firstRollMs" [replay]="bigTick"></ap-roll-number> Ideals points ready to use</span>
              </h2>
              <p class="big__text">Every project pays off – put your team's points toward exclusive rewards in the advisory suite</p>
              <button type="button" class="cta"><span class="cta__label">Explore rewards<fvdr-icon name="arrow-right"></fvdr-icon></span></button>
            </div>
            <button type="button" class="x" aria-label="Close" fvdrTooltip="Close" tooltipPosition="left" (click)="bigOpen = false"><fvdr-icon name="close-banner"></fvdr-icon></button>
          </section>

          <fvdr-tabs [tabs]="tabs" [(activeId)]="tab"></fvdr-tabs>

          <div class="bar">
            <fvdr-btn label="Create new project" iconName="plus" variant="primary"></fvdr-btn>
            <span class="grow"></span>
            <fvdr-btn [iconOnly]="true" iconName="grid-view" variant="secondary" ariaLabel="Change view"></fvdr-btn>
            <div class="search"><fvdr-search placeholder="Search for project"></fvdr-search></div>
          </div>

          <div class="cards">
            <article class="card" *ngFor="let p of projects">
              <span class="card__mark">NZ</span>
              <span class="card__txt"><strong>{{ p }}</strong><span>Updated 2 hours ago</span></span>
              <fvdr-icon name="star" class="card__star"></fvdr-icon>
            </article>
          </div>
        </div>

        <!-- ───────── Page 2 · Documents ───────── -->
        <ng-container *ngIf="page === 'documents'">
          <aside class="mini" *ngIf="miniOpen" (mouseenter)="miniTick = miniTick + 1" aria-label="Rewards">
            <div class="mini__head">
              <fvdr-icon name="trophy-gradient"></fvdr-icon>
              <span class="mini__title"><ap-roll-number [value]="points" [duration]="rollMs" [firstDuration]="firstRollMs" [replay]="miniTick" style="--roll-h: 20px"></ap-roll-number> Ideals points ready to use</span>
              <button type="button" class="x x--mini" aria-label="Close" (click)="miniOpen = false"><fvdr-icon name="close-banner"></fvdr-icon></button>
            </div>
            <div class="mini__more">
              <div class="mini__more-in">
                <p>Every project pays off – put your team's points toward exclusive rewards in the advisory suite</p>
                <button type="button" class="cta cta--s"><span class="cta__label">Explore rewards<fvdr-icon name="arrow-right"></fvdr-icon></span></button>
              </div>
            </div>
          </aside>

          <div class="content">
            <div class="bar">
              <fvdr-btn label="Upload" iconName="upload" variant="primary"></fvdr-btn>
              <fvdr-btn label="Download" iconName="download" variant="secondary"></fvdr-btn>
              <fvdr-btn [iconOnly]="true" iconName="export" variant="secondary" ariaLabel="Export index"></fvdr-btn>
              <fvdr-btn [iconOnly]="true" iconName="more" variant="secondary" ariaLabel="More"></fvdr-btn>
              <span class="grow"></span>
              <div class="search"><fvdr-search placeholder="Search" [filter]="true"></fvdr-search></div>
            </div>

            <div class="docs">
              <nav class="quick" aria-label="Quick access">
                <div class="quick__head">Quick access<fvdr-icon name="chevron-left"></fvdr-icon></div>
                <a class="quick__i"><fvdr-icon name="history"></fvdr-icon>Recent</a>
                <a class="quick__i"><fvdr-icon name="star"></fvdr-icon>Favorites</a>
                <a class="quick__i"><fvdr-icon name="upload"></fvdr-icon>New</a>
                <a class="quick__i"><fvdr-icon name="note"></fvdr-icon>Notes</a>
                <a class="quick__i quick__i--on"><span class="quick__mark">PC</span>Project Cerato</a>
              </nav>

              <div class="tbl" role="table">
                <div class="tr tr--h" role="row">
                  <span><fvdr-checkbox [ngModel]="false"></fvdr-checkbox></span><span></span><span>Index</span><span>Name</span><span>Comments</span><span>Labels</span><span>Pages</span>
                  <span class="sortcol">Added on<fvdr-icon name="sort-down"></fvdr-icon></span>
                </div>
                <div class="tr" *ngFor="let r of rows" role="row" [class.tr--sel]="r.selected">
                  <span><fvdr-checkbox [ngModel]="!!r.selected"></fvdr-checkbox></span>
                  <span><fvdr-file-icon [type]="r.kind === 'folder' ? 'folder-colored' : r.kind"></fvdr-file-icon></span>
                  <span>{{ r.index }}</span><span>{{ r.name }}</span>
                  <span><fvdr-counter [value]="r.comments"></fvdr-counter></span>
                  <span><fvdr-counter [value]="r.labels"></fvdr-counter></span>
                  <span>{{ r.pages ?? '—' }}</span><span>{{ r.added }}</span>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <fvdr-vdr-proto-switcher [groups]="groups" [showRestart]="true" (changed)="onOption($event)" (restart)="restart()"></fvdr-vdr-proto-switcher>
    </div>
  `,
  styles: [`
    :host {
      display: block; height: 100vh;
      /* banner gradient ≈ Figma #022E34 → #106156 (no such tokens yet, so derived from green-800) */
      --ap-from: color-mix(in srgb, var(--primitive-green-800) 36%, black); --ap-to: color-mix(in srgb, var(--primitive-green-800) 76%, black);
      --roll-ms: 500ms;
      --ap-open: 300ms;
      /* ease-out that overshoots to ~1.05 (≈5px, 3.6% of 142) at ~70% and settles: a gentle bounce */
      --ap-bounce: linear(0, 0.34 14%, 0.68 32%, 0.92 50%, 1.05 70%, 1.025 82%, 1.006 92%, 1);
    }
    .app { display: flex; height: 100%; background: var(--color-bg-page); color: var(--color-text-primary); font-family: var(--font-family); font-size: var(--font-size-base); }
    .main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: auto; }
    .grow { flex: 1; }
    .content { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-6); }

    /* ── Large banner ── */
    .big { position: relative; flex: 0 0 168px; height: 168px; border-radius: var(--radius-md); overflow: hidden; color: var(--color-stone-0);
      /* Figma gradient transform → 187.6deg, light bottom-left / dark top-right */
      background: linear-gradient(187.6deg, var(--ap-from) -20.3%, var(--ap-to) 93.2%); }
    .big__art { position: absolute; left: 0; top: 0; height: 168px; width: auto; pointer-events: none; }
    .big__body { position: absolute; left: 208px; top: var(--space-6); right: 80px; display: flex; flex-direction: column; align-items: flex-start; }
    .big__title { display: flex; align-items: center; gap: var(--space-2); margin: 0; font-size: var(--font-size-2xl); line-height: 28px; font-weight: var(--font-weight-semi); }
    .big__title fvdr-icon { font-size: var(--font-size-4xl); flex-shrink: 0; }
    .big__title ap-roll-number { --roll-h: 28px; }
    .big__text { margin: var(--space-3) 0 var(--space-5); font-size: var(--font-size-base); line-height: 20px; }
    .x { position: absolute; top: var(--space-6); right: var(--space-6); display: grid; place-items: center; width: var(--space-5); height: var(--space-5);
      padding: 0; border: 0; background: transparent; color: inherit; font-size: var(--font-size-2xl); cursor: pointer; opacity: 0.85; }
    .x:hover { opacity: 1; }

    /* CTA: DS primary look */
    .cta { position: relative; display: inline-flex; height: 40px; padding: 0 var(--space-4); border: 0; border-radius: var(--radius-sm);
      background: var(--color-primary-500); color: var(--color-stone-0); font: inherit; font-size: 15px; cursor: pointer; overflow: hidden; transition: background 0.15s; }
    .cta:hover { background: var(--color-primary-600); }
    .cta:active { background: var(--color-primary-700); }
    .cta__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: var(--space-2); }

    /* ── Page 1 body ── */
    .bar { display: flex; align-items: center; gap: var(--space-2); }
    .search { width: 320px; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
    .card { display: flex; align-items: flex-start; gap: var(--space-3); height: 76px; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
    .card__mark { display: grid; place-items: center; flex: 0 0 40px; height: 40px; border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0); }
    .card__txt { display: flex; flex-direction: column; flex: 1; gap: var(--space-1); }
    .card__txt span { color: var(--color-text-secondary); font-size: 12px; }
    .card__star { color: var(--color-icon); }

    /* ── Compact banner in the header (Figma 341×40 → 341×142) ──
       Only the box grows: its bottom edge overshoots ~3.5% (5px of 142) and settles back. The text never moves —
       it is pinned to the top and just fades in while the background slides out underneath it. */
    .mini { position: absolute; z-index: 150; top: var(--space-3); right: 200px; width: 341px; height: 40px; overflow: hidden;
      border-radius: var(--radius-sm); color: var(--color-stone-0); background: var(--ap-to);
      transition: height 200ms ease-out, box-shadow 200ms ease-out; }
    .mini:hover, .mini:focus-within { height: 142px; box-shadow: var(--shadow-popup);
      transition: height var(--ap-open) var(--ap-bounce), box-shadow var(--ap-open) ease-out; }
    /* gradient layer is fixed at the expanded size so it never morphs while the box grows (Figma: light bottom-left, dark top-right) */
    .mini::before { content: ''; position: absolute; left: 0; top: 0; width: 341px; height: 150px; pointer-events: none;
      background: linear-gradient(207.8deg, var(--ap-from) -29.6%, var(--ap-to) 92.8%); }
    .mini__head { position: relative; display: flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-4); }
    .mini__head > fvdr-icon { font-size: var(--font-size-2xl); flex-shrink: 0; }
    .mini__title { flex: 1; white-space: nowrap; font-weight: var(--font-weight-semi); line-height: 20px; }
    .x--mini { position: static; flex-shrink: 0; }
    /* lower part: clipped under the title row; its content rides the same bounce as the box edge
       (starts one box-growth above its place, so it overshoots ~5px down and comes back together with the background) */
    .mini__more { position: absolute; left: 0; right: 0; top: 40px; bottom: 0; overflow: hidden; z-index: 1; }
    .mini__more-in { padding: 2px var(--space-4) 0; transform: translateY(-102px); transition: transform 200ms ease-out; }
    .mini:hover .mini__more-in, .mini:focus-within .mini__more-in { transform: none; transition: transform var(--ap-open) var(--ap-bounce); }
    .mini__more p { width: 309px; margin: 0 0 var(--space-3); line-height: 20px; }
    .cta--s { height: 32px; padding: 0 var(--space-3); font-size: var(--font-size-base); }

    /* ── Page 2 body ── */
    .docs { display: flex; gap: var(--space-6); align-items: flex-start; }
    .quick { flex: 0 0 320px; display: flex; flex-direction: column; gap: var(--space-1); }
    .quick__head { display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 var(--space-4); border-radius: var(--radius-sm);
      background: var(--color-bg-surface); font-weight: var(--font-weight-semi); }
    .quick__i { display: flex; align-items: center; gap: var(--space-3); height: 40px; padding: 0 var(--space-4); border-radius: var(--radius-sm); color: var(--color-text-primary); }
    .quick__i fvdr-icon { color: var(--color-icon); }
    .quick__i--on { margin-top: var(--space-4); background: var(--color-primary-50); }
    .quick__mark { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0); font-size: 10px; }
    .tbl { flex: 1; min-width: 0; }
    .tr { display: grid; grid-template-columns: 32px 32px 56px minmax(160px, 1fr) 130px 100px 96px 150px; align-items: center; height: 40px; padding: 0 var(--space-4) 0 var(--space-4); }
    .tr--h { height: 48px; border-radius: var(--radius-sm); background: var(--color-bg-surface); font-weight: var(--font-weight-semi); }
    .tr--sel { background: var(--color-primary-50); }
    .sortcol { display: inline-flex; align-items: center; gap: var(--space-2); }
    @media (prefers-reduced-motion: reduce) {
      .mini { transition: none; }
    }
  `],
})
export class AdvisoryBannersComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  page: Page = 'projects';
  tab = 'projects';
  bigOpen = true;
  miniOpen = true;
  readonly points = '1,700';
  /** Counter roll time in ms — hover replay 500, first show 1000 (the feel is tuned here). */
  rollMs = 500;
  firstRollMs = 1000;
  bigTick = 0;
  miniTick = 0;

  readonly tabs: TabItem[] = [{ id: 'projects', label: 'Projects' }, { id: 'hub', label: 'Staging hub' }];
  readonly projects = Array.from({ length: 15 }, () => 'Project name');
  readonly crumbsProjects: BreadcrumbItem[] = [{ id: 'all', label: 'All projects' }];
  readonly crumbsDocs: BreadcrumbItem[] = [{ id: 'docs', label: 'Documents' }];
  readonly headerActions: HeaderAction[] = [{ id: 'theme', icon: 'theme-dark', label: 'Dark mode' }, { id: 'help', icon: 'help', label: 'Help' }];
  readonly caNav: SidebarNavItem[] = [
    { id: 'projects', label: 'All projects', icon: 'nav-projects', iconActive: 'nav-projects-active', active: true },
    { id: 'overview', label: 'Overview', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'rewards', label: 'Rewards', icon: 'trophy', iconActive: 'trophy' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
  ];
  readonly vdrNav: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', active: true },
    { id: 'checklist', label: 'Due diligence checklist', icon: 'nav-checklist', iconActive: 'nav-checklist' },
    { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
  ];
  readonly rows: DocRow[] = [
    { index: 1, name: 'ODM intellectual property', kind: 'folder', comments: 1, labels: 1, pages: null, added: 'Nov 16, 2021' },
    { index: 2, name: 'Intellectual property', kind: 'folder', comments: 4, labels: 3, pages: null, added: 'Nov 16, 2021' },
    { index: 3, name: 'Trade secrets', kind: 'folder', comments: 2, labels: 2, pages: null, added: 'Nov 16, 2021' },
    { index: 4, name: 'ACME Inc.', kind: 'folder', comments: 2, labels: 4, pages: null, added: 'Nov 16, 2021' },
    { index: 5, name: 'ACME Cooperative', kind: 'folder', comments: 2, labels: 2, pages: null, added: 'Nov 16, 2021' },
    { index: 6, name: 'Other', kind: 'folder', comments: 2, labels: 2, pages: null, added: 'Nov 16, 2021' },
    { index: 7, name: 'Protocol.pdf', kind: 'pdf', comments: 5, labels: 2, pages: 225, added: 'Nov 16, 2021', selected: true },
    { index: 8, name: 'Summary.docx', kind: 'doc', comments: 4, labels: 2, pages: 123, added: 'Nov 16, 2021' },
  ];

  get groups(): ProtoGroup[] {
    return [{ id: 'page', label: 'Page', value: this.page, options: [{ id: 'projects', label: 'All projects · large banner' }, { id: 'documents', label: 'Documents · compact banner' }] }];
  }

  ngOnInit(): void { this.tracker.trackPageView('advisory-banners'); }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  onOption(e: { group: string; value: string }): void { if (e.group === 'page') this.page = e.value as Page; }

  /** Brings the closed banners back and rolls the numbers again. */
  restart(): void { this.bigOpen = true; this.miniOpen = true; this.bigTick++; this.miniTick++; }
}
