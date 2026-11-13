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
                <span><ap-roll-number [value]="points" [duration]="rollMs" [replay]="bigTick"></ap-roll-number> Ideals points ready to use</span>
              </h2>
              <p class="big__text">Every project pays off – put your team's points toward exclusive rewards in the advisory suite</p>
              <button type="button" class="cta"><span class="cta__label">Explore rewards<fvdr-icon name="arrow-right"></fvdr-icon></span><span class="cta__shine" aria-hidden="true"></span></button>
            </div>
            <button type="button" class="x" aria-label="Close" fvdrTooltip="Close" tooltipPosition="left" (click)="bigOpen = false"><fvdr-icon name="close"></fvdr-icon></button>
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
              <span class="mini__title"><ap-roll-number [value]="points" [duration]="rollMs" [replay]="miniTick" style="--roll-h: 20px"></ap-roll-number> Ideals points ready to use</span>
              <button type="button" class="x x--mini" aria-label="Close" (click)="miniOpen = false"><fvdr-icon name="close"></fvdr-icon></button>
            </div>
            <div class="mini__more">
              <p>Every project pays off – put your team's points toward exclusive rewards in the advisory suite</p>
              <button type="button" class="cta cta--s"><span class="cta__label">Explore rewards<fvdr-icon name="arrow-right"></fvdr-icon></span><span class="cta__shine" aria-hidden="true"></span></button>
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
      --ap-bounce: cubic-bezier(0.34, 1.3, 0.64, 1);
    }
    .app { display: flex; height: 100%; background: var(--color-bg-page); color: var(--color-text-primary); font-family: var(--font-family); font-size: var(--font-size-base); }
    .main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: auto; }
    .grow { flex: 1; }
    .content { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-6); }

    /* ── Large banner ── */
    .big { position: relative; flex: 0 0 168px; height: 168px; border-radius: var(--radius-md); overflow: hidden; color: var(--color-stone-0);
      background: linear-gradient(100deg, var(--ap-from) 8%, var(--ap-to) 84%); }
    .big__art { position: absolute; left: 0; top: 0; height: 168px; width: auto; pointer-events: none; }
    .big__body { position: absolute; left: 208px; top: var(--space-6); right: 80px; display: flex; flex-direction: column; align-items: flex-start; }
    .big__title { display: flex; align-items: center; gap: var(--space-2); margin: 0; font-size: var(--font-size-2xl); line-height: 28px; font-weight: var(--font-weight-semi); }
    .big__title fvdr-icon { font-size: var(--font-size-4xl); flex-shrink: 0; }
    .big__title ap-roll-number { --roll-h: 28px; }
    .big__text { margin: var(--space-3) 0 var(--space-5); font-size: var(--font-size-base); line-height: 20px; }
    .x { position: absolute; top: var(--space-6); right: var(--space-6); display: grid; place-items: center; width: var(--space-5); height: var(--space-5);
      padding: 0; border: 0; background: transparent; color: inherit; font-size: var(--font-size-lg, 16px); cursor: pointer; opacity: 0.85; }
    .x:hover { opacity: 1; }

    /* CTA: DS primary look + a shine that sweeps until the pointer is on the button */
    .cta { position: relative; display: inline-flex; height: 40px; padding: 0 var(--space-4); border: 0; border-radius: var(--radius-sm);
      background: var(--color-primary-500); color: var(--color-stone-0); font: inherit; font-size: 15px; cursor: pointer; overflow: hidden; transition: background 0.15s; }
    .cta:hover { background: var(--color-primary-600); }
    .cta:active { background: var(--color-primary-700); }
    .cta__label { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: var(--space-2); }
    .cta__shine { position: absolute; top: 0; bottom: 0; left: 0; width: 45%; pointer-events: none; opacity: 0;
      background: linear-gradient(100deg, transparent 0%, color-mix(in srgb, var(--color-stone-0) 55%, transparent) 50%, transparent 100%);
      transform: translateX(-160%) skewX(-18deg); animation: ap-shine 3.2s ease-in-out 0.8s infinite; }
    .cta:hover .cta__shine, .cta:focus-visible .cta__shine { animation: none; opacity: 0; }
    @keyframes ap-shine { 0% { transform: translateX(-160%) skewX(-18deg); opacity: 0; } 4% { opacity: 1; } 24% { transform: translateX(330%) skewX(-18deg); opacity: 1; } 28%, 100% { transform: translateX(330%) skewX(-18deg); opacity: 0; } }

    /* ── Page 1 body ── */
    .bar { display: flex; align-items: center; gap: var(--space-2); }
    .search { width: 320px; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
    .card { display: flex; align-items: flex-start; gap: var(--space-3); height: 76px; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
    .card__mark { display: grid; place-items: center; flex: 0 0 40px; height: 40px; border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0); }
    .card__txt { display: flex; flex-direction: column; flex: 1; gap: var(--space-1); }
    .card__txt span { color: var(--color-text-secondary); font-size: 12px; }
    .card__star { color: var(--color-icon); }

    /* ── Compact banner in the header ── */
    .mini { position: absolute; z-index: 150; top: var(--space-3); right: 304px; width: 341px; height: 40px; overflow: hidden;
      border-radius: var(--radius-sm); color: var(--color-stone-0); background: linear-gradient(90deg, var(--ap-from) 0%, var(--ap-to) 84%);
      transition: width var(--ap-open) var(--ap-bounce), height var(--ap-open) var(--ap-bounce), box-shadow var(--ap-open) ease-out; }
    .mini:hover, .mini:focus-within { width: 377px; height: 142px; box-shadow: var(--shadow-popup); }
    .mini__head { display: flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-4); }
    .mini__head fvdr-icon { font-size: var(--font-size-2xl); flex-shrink: 0; }
    .mini__title { flex: 1; white-space: nowrap; font-weight: var(--font-weight-semi); line-height: 20px; }
    .x--mini { position: static; flex-shrink: 0; }
    .mini__more { padding: 0 var(--space-4); opacity: 0; transform: translateY(calc(var(--space-2) * -1));
      transition: opacity var(--ap-open) ease-out, transform var(--ap-open) ease-out; }
    .mini:hover .mini__more, .mini:focus-within .mini__more { opacity: 1; transform: none; transition-delay: 60ms; }
    .mini__more p { width: 345px; margin: 0 0 var(--space-3); line-height: 20px; }
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
      .cta__shine { animation: none; }
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
  readonly points = 700;
  /** Counter roll time in ms — the whole feel is tuned here (brief: ~500ms, may go a bit longer). */
  rollMs = 500;
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
    { id: 'rewards', label: 'Rewards', icon: 'trophy-gradient', iconActive: 'trophy-gradient' },
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
