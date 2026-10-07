import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PrototypeService, PrototypeDef } from '../../services/prototype.service';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type { DroplistItem, SegmentItem, StatusVariant } from '../../shared/ds';

type ViewMode = 'list' | 'cards';
type StatusFilter = 'all' | 'live' | 'wip' | 'pending';
const VIEW_MODE_STORAGE_KEY = 'fvdr-home-view-mode';

const STATUS_VIEW: Record<string, { variant: StatusVariant; label: string }> = {
  live:     { variant: 'active',      label: 'Live' },
  wip:      { variant: 'in-progress', label: 'WIP' },
  pending:  { variant: 'draft',       label: 'Pending' },
  archived: { variant: 'inactive',    label: 'Archived' },
};

@Component({
  selector: 'fvdr-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ...DS_COMPONENTS],
  template: `
    <div class="home">
      <div class="home__inner">

        <!-- ── Header ── -->
        <header class="head">
          <div class="head__titles">
            <h1 class="head__title">Prototypes</h1>
            <p class="head__meta" *ngIf="!loading">
              {{ protos.length }} prototypes · {{ countOf('live') }} live
            </p>
          </div>
          <div class="head__actions">
            <fvdr-btn label="Component library" variant="secondary" iconName="grid-view"
                      (clicked)="router.navigate(['/ds'])" />
            <fvdr-btn label="Session guide" variant="secondary" iconName="documents"
                      (clicked)="router.navigate(['/docs'])" />
            <fvdr-btn *ngIf="svc.hasSupabase" label="New prototype" iconName="plus"
                      (clicked)="openCreate()" />
          </div>
        </header>

        <!-- ── Toolbar ── -->
        <div class="toolbar">
          <fvdr-search class="toolbar__search" [(ngModel)]="searchQuery"
                       placeholder="Search by title, description or slug" />
          <fvdr-segment variant="table" size="md" [items]="statusItems"
                        [activeId]="statusFilter" (activeIdChange)="statusFilter = $any($event)" />
          <fvdr-segment variant="table" size="md" [items]="viewItems"
                        [activeId]="viewMode" (activeIdChange)="setViewMode($any($event))" />
        </div>

        <!-- ── Loading skeleton ── -->
        <div *ngIf="loading" class="list" aria-busy="true">
          <div *ngFor="let _ of skeletonRows" class="row row--skeleton">
            <div class="row__main">
              <span class="skel skel--title"></span>
              <span class="skel skel--desc"></span>
            </div>
            <span class="skel skel--pill"></span>
          </div>
        </div>

        <!-- ── List view ── -->
        <div *ngIf="!loading && viewMode === 'list' && filteredProtos.length" class="list" role="list">
          <div class="list__head" aria-hidden="true">
            <span>Name</span><span>Route</span><span>Status</span><span></span>
          </div>
          <div *ngFor="let proto of filteredProtos; trackBy: bySlug"
               class="row" role="listitem"
               [class.row--clickable]="proto.hasComponent"
               (click)="open(proto)">
            <div class="row__main">
              <a *ngIf="proto.hasComponent; else plainTitle" class="row__title"
                 [routerLink]="['/', proto.slug]" (click)="$event.stopPropagation()">{{ proto.title }}</a>
              <ng-template #plainTitle><span class="row__title">{{ proto.title }}</span></ng-template>
              <span *ngIf="proto.description" class="row__desc">{{ proto.description }}</span>
            </div>
            <span class="row__slug">/{{ proto.slug }}</span>
            <span class="row__status">
              <fvdr-status [variant]="statusOf(proto).variant" [label]="statusOf(proto).label" />
            </span>
            <ng-container *ngTemplateOutlet="actions; context: { $implicit: proto }" />
          </div>
        </div>

        <!-- ── Cards view ── -->
        <div *ngIf="!loading && viewMode === 'cards' && filteredProtos.length" class="grid">
          <div *ngFor="let proto of filteredProtos; trackBy: bySlug"
               class="card" [class.card--clickable]="proto.hasComponent"
               (click)="open(proto)">
            <div class="card__top">
              <fvdr-status [variant]="statusOf(proto).variant" [label]="statusOf(proto).label" />
              <ng-container *ngTemplateOutlet="actions; context: { $implicit: proto }" />
            </div>
            <a *ngIf="proto.hasComponent; else plainCardTitle" class="card__title"
               [routerLink]="['/', proto.slug]" (click)="$event.stopPropagation()">{{ proto.title }}</a>
            <ng-template #plainCardTitle><span class="card__title">{{ proto.title }}</span></ng-template>
            <p *ngIf="proto.description" class="card__desc">{{ proto.description }}</p>
            <span class="card__slug">/{{ proto.slug }}</span>
          </div>
        </div>

        <!-- ── Empty states ── -->
        <div *ngIf="!loading && !filteredProtos.length" class="empty">
          <fvdr-icon name="search" class="empty__icon" />
          <ng-container *ngIf="protos.length; else noProtos">
            <p class="empty__title">Nothing matches your filters</p>
            <fvdr-btn label="Reset filters" variant="secondary" size="s" (clicked)="resetFilters()" />
          </ng-container>
          <ng-template #noProtos>
            <p class="empty__title">No prototypes yet</p>
            <code class="empty__code">node scripts/new-proto.js --slug my-flow --title "My Flow"</code>
          </ng-template>
        </div>
      </div>

      <!-- ── Row actions (shared by list + cards) ── -->
      <ng-template #actions let-proto>
        <span class="actions" (click)="$event.stopPropagation()">
          <fvdr-btn *ngIf="!proto.hasComponent" label="Scaffold" variant="ghost" size="s"
                    (clicked)="showScaffold(proto)" />
          <span class="actions__more">
            <fvdr-btn variant="ghost" size="s" iconName="more" [iconOnly]="true" ariaLabel="More actions"
                      (clicked)="toggleMenu($event, proto)" />
            <fvdr-droplist *ngIf="menuFor === proto.slug" class="actions__menu"
                           [items]="menuItems" [minWidth]="200"
                           (itemClick)="onMenu($event, proto)" />
          </span>
        </span>
      </ng-template>

      <!-- ── Archive confirm ── -->
      <fvdr-modal [visible]="!!archiveTarget" title="Archive prototype?" size="s"
                  confirmLabel="Archive" cancelLabel="Cancel" confirmVariant="danger"
                  [confirmDisabled]="saving"
                  (confirmed)="doArchive()" (cancelled)="archiveTarget = null" (closed)="archiveTarget = null">
        <p class="modal-text">
          <strong>{{ archiveTarget?.title }}</strong> will be hidden from this list.
          The component stays in the codebase.
        </p>
      </fvdr-modal>

      <!-- ── Create ── -->
      <fvdr-modal [visible]="createOpen && !scaffoldCmd" title="New prototype" size="m"
                  confirmLabel="Create" cancelLabel="Cancel"
                  [confirmDisabled]="saving || !form.title || !form.slug"
                  (confirmed)="doCreate()" (cancelled)="closeCreate()" (closed)="closeCreate()">
        <div class="form">
          <fvdr-input label="Title" [required]="true" placeholder="e.g. Deal Room Dashboard"
                      [(ngModel)]="form.title" (ngModelChange)="autoSlug($event)" />
          <fvdr-input label="Slug" [required]="true" placeholder="deal-room-dashboard"
                      helperText="Lowercase letters, numbers and hyphens"
                      [ngModel]="form.slug" (ngModelChange)="setSlug($event)" />
          <fvdr-input label="Description" placeholder="Short description of the prototype"
                      [(ngModel)]="form.description" />
          <fvdr-input label="Figma link" placeholder="https://www.figma.com/design/…"
                      [(ngModel)]="form.figma" />
          <fvdr-inline-message *ngIf="createError" variant="error" [message]="createError" />
        </div>
      </fvdr-modal>

      <!-- ── Scaffold command (after create, or for a pending prototype) ── -->
      <fvdr-modal [visible]="!!scaffoldCmd || !!scaffoldTarget"
                  [title]="scaffoldCmd ? 'Prototype created' : 'Scaffold command'" size="l"
                  confirmLabel="Done" (confirmed)="closeScaffold()" (closed)="closeScaffold()">
        <p class="modal-text">Run this in the project root to generate the Angular component:</p>
        <div class="code">
          <code class="code__text">{{ currentCmd }}</code>
          <fvdr-btn variant="ghost" size="s" [iconName]="copied ? 'check' : 'copy'" [iconOnly]="true"
                    ariaLabel="Copy command" (clicked)="copyCmd(currentCmd)" />
        </div>
        <p class="modal-hint">Then commit the files and open a PR.</p>
      </fvdr-modal>

      <fvdr-toast-host />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .home {
      min-height: 100vh;
      background: var(--color-stone-0);
      color: var(--color-text-primary);
      font-family: var(--font-family);
    }
    .home__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-10) var(--space-6) var(--space-16);
    }

    /* ── Header ── */
    .head {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: var(--space-4); flex-wrap: wrap;
      margin-bottom: var(--space-6);
    }
    .head__title {
      margin: 0;
      font-size: var(--text-h1-size);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-lg);
    }
    .head__meta {
      margin: var(--space-1) 0 0;
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
    }
    .head__actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .toolbar__search { flex: 1 1 280px; min-width: 240px; }

    /* ── List ── */
    .list__head, .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 220px) 104px 88px;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-3);
    }
    .list__head {
      height: 40px;
      font-size: var(--text-caption1-size);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-divider);
    }
    .row {
      min-height: 64px;
      padding-top: var(--space-3);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-divider);
      transition: background var(--duration-fast) var(--ease);
    }
    .row--clickable { cursor: pointer; }
    .row--clickable:hover { background: var(--color-hover-bg); }
    .row__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row__title {
      font-size: var(--text-body1-size);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
      text-decoration: none;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    a.row__title:hover { color: var(--color-primary-500); }
    .row__desc {
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .row__slug {
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-text-placeholder);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── Cards ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
      padding-top: var(--space-6);
    }
    .card {
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-4) var(--space-5) var(--space-5);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
      transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
    }
    .card--clickable { cursor: pointer; }
    .card--clickable:hover { border-color: var(--color-primary-500); box-shadow: var(--shadow-card-hover); }
    .card__top { display: flex; align-items: center; justify-content: space-between; min-height: 32px; }
    .card__title {
      font-size: var(--text-sub1-size);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
      text-decoration: none;
    }
    a.card__title:hover { color: var(--color-primary-500); }
    .card__desc {
      margin: 0;
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .card__slug {
      margin-top: auto; padding-top: var(--space-2);
      font-family: var(--font-family-mono);
      font-size: var(--text-caption1-size);
      color: var(--color-text-placeholder);
    }

    /* ── Actions ── */
    .actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-1); }
    .actions__more { position: relative; }
    .actions__menu { position: absolute; top: calc(100% + var(--space-1)); right: 0; z-index: var(--z-dropdown); }

    /* ── Skeleton ── */
    .row--skeleton { cursor: default; }
    .skel {
      display: block;
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--color-stone-200) 0%, var(--color-stone-300) 50%, var(--color-stone-200) 100%);
      background-size: 200% 100%;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .skel--title { width: 40%; height: 14px; }
    .skel--desc  { width: 65%; height: 12px; margin-top: var(--space-2); }
    .skel--pill  { grid-column: 3; width: 56px; height: 22px; border-radius: var(--radius-full); }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

    /* ── Empty ── */
    .empty {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-16) var(--space-4);
      color: var(--color-text-secondary);
      text-align: center;
    }
    .empty__icon { font-size: var(--font-size-3xl); color: var(--color-stone-500); }
    .empty__title { margin: 0; font-size: var(--text-body1-size); font-weight: var(--font-weight-semi); color: var(--color-text-primary); }
    .empty__code, .code__text { font-family: var(--font-family-mono); font-size: var(--text-caption1-size); }
    .empty__code { padding: var(--space-3) var(--space-4); background: var(--color-stone-200); border-radius: var(--radius-sm); }

    /* ── Modals ── */
    .form { display: flex; flex-direction: column; gap: var(--space-4); }
    .modal-text { margin: 0 0 var(--space-3); font-size: var(--text-body2-size); color: var(--color-text-secondary); }
    .modal-hint { margin: var(--space-3) 0 0; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .code {
      display: flex; align-items: flex-start; gap: var(--space-2);
      padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
    }
    .code__text { flex: 1; white-space: pre-wrap; word-break: break-all; color: var(--color-text-primary); padding-top: var(--space-1); }

    @media (max-width: 767px) {
      .home__inner { padding: var(--space-6) var(--space-4) var(--space-10); }
      .list__head { display: none; }
      .row { grid-template-columns: minmax(0, 1fr) auto auto; }
      .row__slug { display: none; }
      .skel--pill { grid-column: 2; }
    }
  `],
})
export class HomeComponent implements OnInit {
  readonly svc = inject(PrototypeService);
  readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protos: PrototypeDef[] = [];
  loading = false;

  viewMode: ViewMode = 'list';
  statusFilter: StatusFilter = 'all';
  searchQuery = '';

  readonly skeletonRows = Array.from({ length: 8 });
  readonly viewItems: SegmentItem[] = [
    { id: 'list',  icon: 'list-view', label: 'List' },
    { id: 'cards', icon: 'grid-view', label: 'Cards' },
  ];
  statusItems: SegmentItem[] = [];

  // Create modal
  createOpen = false;
  form = { title: '', slug: '', description: '', figma: '' };
  scaffoldCmd: string | null = null;
  createError = '';
  saving = false;
  copied = false;

  archiveTarget: PrototypeDef | null = null;
  scaffoldTarget: PrototypeDef | null = null;

  // Row "more" menu — one open at a time
  menuFor: string | null = null;
  menuItems: DroplistItem[] = [];

  async ngOnInit(): Promise<void> {
    this.viewMode = this.readViewMode();
    this.loading = true;
    this.protos = await this.svc.list();
    this.loading = false;
    this.refreshStatusItems();
  }

  @HostListener('document:click') closeMenu(): void { this.menuFor = null; }
  @HostListener('document:keydown.escape') onEsc(): void { this.menuFor = null; }

  // ── View / filter ─────────────────────────────────────────────────────────

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    try { localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode); } catch {}
  }

  private readViewMode(): ViewMode {
    try {
      return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'cards' ? 'cards' : 'list';
    } catch {
      return 'list';
    }
  }

  private effectiveStatus(p: PrototypeDef): PrototypeDef['status'] {
    return p.hasComponent ? p.status : 'pending';
  }

  countOf(status: StatusFilter): number {
    return status === 'all'
      ? this.protos.length
      : this.protos.filter(p => this.effectiveStatus(p) === status).length;
  }

  private refreshStatusItems(): void {
    const items: SegmentItem[] = [
      { id: 'all',  label: 'All',  count: this.countOf('all') },
      { id: 'live', label: 'Live', count: this.countOf('live') },
      { id: 'wip',  label: 'WIP',  count: this.countOf('wip') },
    ];
    if (this.countOf('pending')) items.push({ id: 'pending', label: 'Pending', count: this.countOf('pending') });
    this.statusItems = items;
  }

  get filteredProtos(): PrototypeDef[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.protos.filter(p =>
      (this.statusFilter === 'all' || this.effectiveStatus(p) === this.statusFilter) &&
      (!q ||
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q))
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
  }

  statusOf(p: PrototypeDef) { return STATUS_VIEW[this.effectiveStatus(p)]; }
  bySlug(_: number, p: PrototypeDef): string { return p.slug; }

  open(proto: PrototypeDef): void {
    if (proto.hasComponent) this.router.navigate(['/', proto.slug]);
  }

  // ── More menu ─────────────────────────────────────────────────────────────

  toggleMenu(event: MouseEvent, proto: PrototypeDef): void {
    event.stopPropagation();
    if (this.menuFor === proto.slug) { this.menuFor = null; return; }
    const items: DroplistItem[] = [];
    if (proto.hasComponent) items.push({ id: 'copy', label: 'Copy link', icon: 'copy' });
    if (proto.figma) items.push({ id: 'figma', label: 'Open in Figma', icon: 'link' });
    if (this.canToggleStatus(proto)) {
      items.push(proto.status === 'wip'
        ? { id: 'status', label: 'Mark as Live', icon: 'check' }
        : { id: 'status', label: 'Move back to WIP', icon: 'undo' });
    }
    if (!proto.hasComponent) items.push({ id: 'scaffold', label: 'Scaffold command', icon: 'copy' });
    if (items.length) items[items.length - 1] = { ...items[items.length - 1], dividerAfter: true };
    items.push({ id: 'archive', label: 'Archive', icon: 'trash', variant: 'danger' });
    this.menuItems = items;
    this.menuFor = proto.slug;
  }

  onMenu(item: DroplistItem, proto: PrototypeDef): void {
    this.menuFor = null;
    switch (item.id) {
      case 'copy':
        this.copyText(`${location.origin}/${proto.slug}`, 'Link copied');
        break;
      case 'figma':
        window.open(proto.figma, '_blank', 'noopener');
        break;
      case 'status':
        this.toggleStatus(proto);
        break;
      case 'scaffold':
        this.showScaffold(proto);
        break;
      case 'archive':
        this.archiveTarget = proto;
        break;
    }
  }

  // ── Status (WIP ↔ Live) ───────────────────────────────────────────────────

  canToggleStatus(proto: PrototypeDef): boolean {
    return (
      this.svc.hasSupabase &&
      proto.hasComponent &&
      (proto.status === 'wip' || proto.status === 'live')
    );
  }

  async toggleStatus(proto: PrototypeDef): Promise<void> {
    if (!this.canToggleStatus(proto)) return;
    const next: PrototypeDef['status'] = proto.status === 'wip' ? 'live' : 'wip';
    try {
      const updated = await this.svc.setStatus(proto, next);
      this.protos = this.protos.map(p => p.slug === proto.slug ? { ...p, ...updated } : p);
      this.refreshStatusItems();
      this.toast.show({ variant: 'success', message: `${proto.title} is now ${STATUS_VIEW[next].label}` });
    } catch (err: any) {
      console.error('[toggleStatus]', err);
      this.toast.show({ variant: 'error', message: `Failed to update status: ${err?.message ?? err}` });
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.form = { title: '', slug: '', description: '', figma: '' };
    this.scaffoldCmd = null;
    this.createError = '';
    this.createOpen = true;
  }

  closeCreate(): void {
    this.createOpen = false;
  }

  autoSlug(title: string): void {
    this.form.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  setSlug(value: string): void {
    this.form.slug = (value ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async doCreate(): Promise<void> {
    if (!this.form.title || !this.form.slug) return;
    this.createError = '';
    this.saving = true;
    try {
      const created = await this.svc.create(this.form);
      this.protos = [created, ...this.protos];
      this.refreshStatusItems();
      this.createOpen = false;
      this.copied = false;
      this.scaffoldCmd = this.buildCmd(created);
    } catch (err: any) {
      this.createError = err?.message ?? 'Failed to create prototype.';
    } finally {
      this.saving = false;
    }
  }

  buildCmd(proto: PrototypeDef): string {
    let cmd = `node scripts/new-proto.js --slug "${proto.slug}" --title "${proto.title}"`;
    if (proto.description) cmd += ` --description "${proto.description}"`;
    if (proto.figma)       cmd += ` --figma "${proto.figma}"`;
    return cmd;
  }

  // ── Archive ───────────────────────────────────────────────────────────────

  async doArchive(): Promise<void> {
    const target = this.archiveTarget;
    if (!target) return;
    this.saving = true;
    try {
      await this.svc.archive(target);
      this.protos = this.protos.filter(p => p.slug !== target.slug);
      this.refreshStatusItems();
      this.archiveTarget = null;
      this.toast.show({ variant: 'success', message: `${target.title} archived` });
    } catch (err: any) {
      console.error('[Archive]', err);
      this.toast.show({ variant: 'error', message: `Failed to archive: ${err?.message ?? err}` });
    } finally {
      this.saving = false;
    }
  }

  // ── Scaffold command ──────────────────────────────────────────────────────

  get currentCmd(): string {
    return this.scaffoldCmd ?? (this.scaffoldTarget ? this.buildCmd(this.scaffoldTarget) : '');
  }

  showScaffold(proto: PrototypeDef): void {
    this.scaffoldTarget = proto;
    this.copied = false;
  }

  closeScaffold(): void {
    this.scaffoldCmd = null;
    this.scaffoldTarget = null;
  }

  async copyCmd(cmd: string): Promise<void> {
    await this.copyText(cmd);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  private async copyText(text: string, toastMsg?: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      if (toastMsg) this.toast.show({ variant: 'success', message: toastMsg });
    } catch {
      this.toast.show({ variant: 'error', message: 'Could not access the clipboard' });
    }
  }
}
