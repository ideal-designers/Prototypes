import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PrototypeService, PrototypeDef } from '../../services/prototype.service';
import { PROTO_MODULES, ProtoModule } from '../../proto-registry';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type { DropdownOption, DroplistItem, SegmentItem } from '../../shared/ds';

type ViewMode = 'list' | 'cards';
type SortMode = 'updated' | 'name';
const VIEW_MODE_STORAGE_KEY = 'fvdr-home-view-mode';
const SORT_STORAGE_KEY = 'fvdr-home-sort';
const COLLAPSED_STORAGE_KEY = 'fvdr-home-collapsed-modules';
const DAY_MS = 24 * 60 * 60 * 1000;

interface ModuleGroup { module: ProtoModule; protos: PrototypeDef[]; }

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
              {{ protos.length }} prototypes
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
          <fvdr-dropdown class="toolbar__sort" size="m" iconLeft="sort"
                         [options]="sortOptions" [value]="sortMode"
                         (valueChange)="setSortMode($any(asString($event)))" />
          <fvdr-segment variant="table" size="md" [items]="viewItems"
                        [activeId]="viewMode" (activeIdChange)="setViewMode($any($event))" />
        </div>

        <!-- ── Loading skeleton ── -->
        <div *ngIf="loading" class="list" aria-busy="true">
          <div *ngFor="let _ of skeletonRows" class="row row--skeleton">
            <span></span>
            <div class="row__main">
              <span class="skel skel--title"></span>
              <span class="skel skel--desc"></span>
            </div>
            <span class="skel skel--meta"></span>
          </div>
        </div>

        <!-- ── List view (grouped by module) ── -->
        <div *ngIf="!loading && viewMode === 'list' && filteredProtos.length" class="list">
          <div class="list__head" aria-hidden="true">
            <span></span><span>Name</span><span>Route</span><span>Last updated</span><span></span>
          </div>
          <section *ngFor="let group of groups; trackBy: byModule" class="group"
                   [class.group--drop]="dropTarget === group.module"
                   [class.group--empty]="!group.protos.length"
                   (dragover)="onDragOver($event, group.module)"
                   (dragleave)="onDragLeave($event, group.module)"
                   (drop)="onDrop($event, group.module)">
            <ng-container *ngTemplateOutlet="groupHead; context: { $implicit: group, view: viewMode }" />
            <div *ngIf="!isCollapsed(group.module)" role="list" [id]="groupBodyId(group.module, 'list')">
              <div *ngFor="let proto of group.protos; trackBy: bySlug"
                   class="row" role="listitem"
                   [class.row--clickable]="proto.hasComponent"
                   [class.is-dragging]="dragging?.slug === proto.slug"
                   [attr.draggable]="canMove"
                   (dragstart)="onDragStart($event, proto)" (dragend)="onDragEnd()"
                   (click)="open(proto)">
                <span class="row__handle" aria-hidden="true">
                  <fvdr-icon *ngIf="canMove" name="drag" />
                </span>
                <div class="row__main">
                  <a *ngIf="proto.hasComponent; else plainTitle" class="row__title" draggable="false"
                     [routerLink]="['/', proto.slug]" (click)="$event.stopPropagation()">{{ proto.title }}</a>
                  <ng-template #plainTitle><span class="row__title">{{ proto.title }}</span></ng-template>
                  <span *ngIf="proto.description" class="row__desc">{{ proto.description }}</span>
                </div>
                <span class="row__slug">/{{ proto.slug }}</span>
                <span class="row__updated" [attr.title]="updatedTitle(proto)">
                  <span class="row__date">{{ relativeDate(proto.updated_at) }}</span>
                  <span *ngIf="proto.author" class="row__author">{{ proto.author }}</span>
                </span>
                <ng-container *ngTemplateOutlet="actions; context: { $implicit: proto }" />
              </div>
            </div>
            <p *ngIf="!group.protos.length && !isCollapsed(group.module)" class="group__hint">Drop here to move to {{ group.module }}</p>
          </section>
        </div>

        <!-- ── Cards view (grouped by module) ── -->
        <div *ngIf="!loading && viewMode === 'cards' && filteredProtos.length" class="groups">
          <section *ngFor="let group of groups; trackBy: byModule" class="group"
                   [class.group--drop]="dropTarget === group.module"
                   [class.group--empty]="!group.protos.length"
                   (dragover)="onDragOver($event, group.module)"
                   (dragleave)="onDragLeave($event, group.module)"
                   (drop)="onDrop($event, group.module)">
            <ng-container *ngTemplateOutlet="groupHead; context: { $implicit: group, view: viewMode }" />
            <div *ngIf="!isCollapsed(group.module)" class="grid" [id]="groupBodyId(group.module, 'cards')">
              <div *ngFor="let proto of group.protos; trackBy: bySlug"
                   class="card" [class.card--clickable]="proto.hasComponent"
                   [class.is-dragging]="dragging?.slug === proto.slug"
                   [attr.draggable]="canMove"
                   (dragstart)="onDragStart($event, proto)" (dragend)="onDragEnd()"
                   (click)="open(proto)">
                <div class="card__thumb">
                  <img *ngIf="proto.previewUrl && !brokenPreviews.has(proto.slug); else thumbPlaceholder"
                       class="card__img" [src]="proto.previewUrl" alt="" loading="lazy" draggable="false"
                       (error)="brokenPreviews.add(proto.slug)" />
                  <ng-template #thumbPlaceholder>
                    <span class="card__placeholder"><fvdr-icon name="image" /></span>
                  </ng-template>
                </div>
                <div class="card__body">
                  <div class="card__top">
                    <a *ngIf="proto.hasComponent; else plainCardTitle" class="card__title" draggable="false"
                       [routerLink]="['/', proto.slug]" (click)="$event.stopPropagation()">{{ proto.title }}</a>
                    <ng-template #plainCardTitle><span class="card__title">{{ proto.title }}</span></ng-template>
                    <ng-container *ngTemplateOutlet="actions; context: { $implicit: proto }" />
                  </div>
                  <p *ngIf="proto.description" class="card__desc">{{ proto.description }}</p>
                  <div class="card__foot">
                    <span class="card__slug">/{{ proto.slug }}</span>
                    <span *ngIf="proto.updated_at" class="card__updated" [attr.title]="updatedTitle(proto)">
                      {{ relativeDate(proto.updated_at) }}<ng-container *ngIf="proto.author"> · {{ proto.author }}</ng-container>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p *ngIf="!group.protos.length && !isCollapsed(group.module)" class="group__hint">Drop here to move to {{ group.module }}</p>
          </section>
        </div>

        <!-- ── Empty states ── -->
        <div *ngIf="!loading && !filteredProtos.length" class="empty">
          <fvdr-icon name="search" class="empty__icon" />
          <ng-container *ngIf="protos.length; else noProtos">
            <p class="empty__title">Nothing matches your search</p>
            <fvdr-btn label="Clear search" variant="secondary" size="s" (clicked)="resetFilters()" />
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

      <!-- ── Module group header (shared by list + cards) ── -->
      <ng-template #groupHead let-group let-view="view">
        <h2 class="group__head">
          <button type="button" class="group__toggle"
                  [attr.aria-expanded]="!isCollapsed(group.module)"
                  [attr.aria-controls]="groupBodyId(group.module, view)"
                  (click)="toggleGroup(group.module)">
            <fvdr-icon [name]="isCollapsed(group.module) ? 'chevron-right' : 'chevron-down'" class="group__chevron" />
            <span class="group__title">{{ group.module }}</span>
            <span class="group__count">{{ group.protos.length }}</span>
          </button>
        </h2>
      </ng-template>

      <!-- ── Move to module (keyboard alternative to drag & drop) ── -->
      <fvdr-modal [visible]="!!moveTarget" title="Move to module" size="s"
                  confirmLabel="Move" cancelLabel="Cancel"
                  [confirmDisabled]="saving || moveModule === moveTarget?.module"
                  (confirmed)="doMoveFromModal()" (cancelled)="moveTarget = null" (closed)="moveTarget = null">
        <div class="form">
          <p class="modal-text"><strong>{{ moveTarget?.title }}</strong> will be listed under the selected module.</p>
          <fvdr-dropdown label="Module" [options]="moduleOptions" [value]="moveModule"
                         (valueChange)="moveModule = $any(asString($event))" />
        </div>
      </fvdr-modal>

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
    .toolbar__sort { flex: 0 0 200px; }

    /* ── Module groups ── */
    .group {
      padding-bottom: var(--space-2);
      border-radius: var(--radius-md);
      transition: background var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
    }
    .group--drop {
      background: var(--color-primary-50);
      box-shadow: inset 0 0 0 1px var(--color-primary-500);
    }
    .group__head {
      display: flex; align-items: center;
      margin: 0;
      padding: var(--space-6) var(--space-3) var(--space-2) var(--space-1);
      font-size: var(--text-sub1-size);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
    }
    .group__toggle {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-1) var(--space-2) var(--space-1) 0;
      border: 0; border-radius: var(--radius-sm);
      background: none;
      font: inherit; color: inherit;
      cursor: pointer;
    }
    .group__toggle:hover .group__title { color: var(--color-primary-500); }
    .group__toggle:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
    .group__chevron { font-size: var(--font-size-base); color: var(--color-stone-600); width: 16px; }
    .group__count {
      font-size: var(--text-caption1-size);
      font-weight: var(--font-weight-regular);
      color: var(--color-text-secondary);
    }
    .group__hint {
      margin: 0;
      padding: var(--space-3);
      font-size: var(--text-body2-size);
      color: var(--color-text-secondary);
    }
    .is-dragging { opacity: 0.4; }

    /* ── List ── */
    .list__head, .row {
      display: grid;
      grid-template-columns: 16px minmax(0, 1fr) minmax(0, 220px) 160px 88px;
      align-items: center;
      gap: var(--space-3);
      padding: 0 var(--space-3) 0 var(--space-1);
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
    .row[draggable="true"] { cursor: grab; }
    .row__handle { display: flex; color: var(--color-stone-500); font-size: var(--font-size-base); opacity: 0; }
    .row:hover .row__handle { opacity: 1; }
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

    .row__updated { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .row__date { font-size: var(--text-body2-size); color: var(--color-text-primary); }
    .row__author {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── Cards ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
    }
    .groups .grid { padding: 0 var(--space-3) var(--space-2); }
    .card {
      display: flex; flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      background: var(--color-stone-0);
      transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
    }
    .card--clickable { cursor: pointer; }
    .card[draggable="true"] { cursor: grab; }
    .card--clickable:hover { border-color: var(--color-primary-500); box-shadow: var(--shadow-card-hover); }
    .card__thumb {
      aspect-ratio: 16 / 10;
      background: var(--color-stone-100);
      border-bottom: 1px solid var(--color-divider);
      overflow: hidden;
    }
    .card__img {
      display: block; width: 100%; height: 100%;
      object-fit: cover; object-position: top left;
    }
    .card__placeholder {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%;
      font-size: var(--font-size-3xl);
      color: var(--color-stone-500);
    }
    .card__body {
      flex: 1;
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-3) var(--space-5) var(--space-5);
    }
    .card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); min-height: 32px; }
    .card__top .card__title { padding-top: var(--space-1); }
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
    .card__foot {
      margin-top: auto; padding-top: var(--space-2);
      display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3);
      font-size: var(--text-caption1-size);
      min-width: 0;
    }
    .card__slug {
      font-family: var(--font-family-mono);
      color: var(--color-text-placeholder);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .card__updated { flex-shrink: 0; color: var(--color-text-secondary); }

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
    .skel--meta  { grid-column: 4; width: 72%; height: 12px; }
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
      .row { grid-template-columns: 16px minmax(0, 1fr) auto; }
      .row__slug, .row__updated, .skel--meta { display: none; }
      .toolbar__sort { flex: 1 1 200px; }
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
  sortMode: SortMode = 'updated';
  searchQuery = '';

  readonly sortOptions: DropdownOption[] = [
    { value: 'updated', label: 'Recently updated' },
    { value: 'name',    label: 'Name A–Z' },
  ];
  readonly moduleOptions: DropdownOption[] = PROTO_MODULES.map(m => ({ value: m, label: m }));

  /** Modules the user collapsed — remembered in localStorage */
  collapsed = new Set<ProtoModule>();

  // Drag & drop between module groups
  dragging: PrototypeDef | null = null;
  dropTarget: ProtoModule | null = null;
  // "Move to module" modal
  moveTarget: PrototypeDef | null = null;
  moveModule: ProtoModule = PROTO_MODULES[0];

  /** Slugs whose thumbnail failed to load — show the placeholder instead */
  readonly brokenPreviews = new Set<string>();

  readonly skeletonRows = Array.from({ length: 8 });
  readonly viewItems: SegmentItem[] = [
    { id: 'list',  icon: 'list-view', label: 'List' },
    { id: 'cards', icon: 'grid-view', label: 'Cards' },
  ];

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
    this.sortMode = this.readSortMode();
    this.collapsed = this.readCollapsed();
    this.loading = true;
    this.protos = await this.svc.list();
    this.loading = false;
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

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    try { localStorage.setItem(SORT_STORAGE_KEY, mode); } catch {}
  }

  private readSortMode(): SortMode {
    try {
      return localStorage.getItem(SORT_STORAGE_KEY) === 'name' ? 'name' : 'updated';
    } catch {
      return 'updated';
    }
  }

  asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }

  get filteredProtos(): PrototypeDef[] {
    const q = this.searchQuery.trim().toLowerCase();
    const filtered = this.protos.filter(p =>
      !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
    const byName = (a: PrototypeDef, b: PrototypeDef) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    return this.sortMode === 'name'
      ? filtered.sort(byName)
      : filtered.sort((a, b) => (this.timeOf(b) - this.timeOf(a)) || byName(a, b));
  }

  /** Filtered protos bucketed by module in PROTO_MODULES order. Empty modules are
   *  hidden, except while dragging (so every module is a drop target) when not searching. */
  get groups(): ModuleGroup[] {
    const protos = this.filteredProtos;
    const showEmpty = !!this.dragging && !this.searchQuery.trim();
    return PROTO_MODULES
      .map(module => ({ module, protos: protos.filter(p => p.module === module) }))
      .filter(g => g.protos.length || showEmpty);
  }

  byModule(_: number, g: ModuleGroup): string { return g.module; }

  /** Search results are never hidden inside a collapsed group */
  isCollapsed(module: ProtoModule): boolean {
    return this.collapsed.has(module) && !this.searchQuery.trim();
  }

  toggleGroup(module: ProtoModule): void {
    const next = new Set(this.collapsed);
    next.has(module) ? next.delete(module) : next.add(module);
    this.collapsed = next;
    try { localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...next])); } catch {}
  }

  private readCollapsed(): Set<ProtoModule> {
    try {
      const saved = JSON.parse(localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? '[]');
      return new Set((Array.isArray(saved) ? saved : []).filter(m => PROTO_MODULES.includes(m)));
    } catch {
      return new Set();
    }
  }

  groupBodyId(module: ProtoModule, view: ViewMode): string {
    return `group-${view}-${module.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  }

  private timeOf(p: PrototypeDef): number {
    const t = p.updated_at ? Date.parse(p.updated_at) : NaN;
    return Number.isNaN(t) ? 0 : t;
  }

  // ── Freshness ─────────────────────────────────────────────────────────────

  /** "Today", "3 days ago", "2 weeks ago", then "12 Mar" / "12 Mar 2025" */
  relativeDate(iso?: string): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
  }

  updatedTitle(p: PrototypeDef): string | null {
    if (!p.updated_at) return null;
    const full = new Date(p.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    return p.author ? `Updated ${full} by ${p.author}` : `Updated ${full}`;
  }

  resetFilters(): void {
    this.searchQuery = '';
  }

  bySlug(_: number, p: PrototypeDef): string { return p.slug; }

  open(proto: PrototypeDef): void {
    if (proto.hasComponent) this.router.navigate(['/', proto.slug]);
  }

  // ── Move between modules ──────────────────────────────────────────────────

  /** Moving needs Supabase — the module override lives in the `module` column */
  get canMove(): boolean { return this.svc.hasSupabase; }

  onDragStart(event: DragEvent, proto: PrototypeDef): void {
    if (!this.canMove) return;
    this.menuFor = null;
    event.dataTransfer?.setData('text/plain', proto.slug);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    // Defer so the browser snapshots the drag image before empty groups render
    setTimeout(() => (this.dragging = proto));
  }

  onDragOver(event: DragEvent, module: ProtoModule): void {
    if (!this.dragging || this.dragging.module === module) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTarget = module;
  }

  onDragLeave(event: DragEvent, module: ProtoModule): void {
    const section = event.currentTarget as HTMLElement;
    if (this.dropTarget === module && !section.contains(event.relatedTarget as Node | null)) {
      this.dropTarget = null;
    }
  }

  onDrop(event: DragEvent, module: ProtoModule): void {
    event.preventDefault();
    const proto = this.dragging;
    this.onDragEnd();
    if (proto) this.moveTo(proto, module);
  }

  onDragEnd(): void {
    this.dragging = null;
    this.dropTarget = null;
  }

  openMove(proto: PrototypeDef): void {
    this.moveTarget = proto;
    this.moveModule = proto.module;
  }

  async doMoveFromModal(): Promise<void> {
    const proto = this.moveTarget;
    if (!proto) return;
    this.saving = true;
    await this.moveTo(proto, this.moveModule);
    this.saving = false;
    this.moveTarget = null;
  }

  /** Optimistic move; reverts with an error toast if Supabase rejects it. */
  async moveTo(proto: PrototypeDef, module: ProtoModule): Promise<void> {
    const from = proto.module;
    if (from === module) return;
    this.replace(proto.slug, { module });
    try {
      const updated = await this.svc.setModule(proto, module);
      this.replace(proto.slug, updated);
      this.toast.show({ variant: 'success', message: `${proto.title} moved to ${module}` });
    } catch (err: any) {
      console.error('[moveTo]', err);
      this.replace(proto.slug, { module: from });
      this.toast.show({ variant: 'error', message: `Failed to move: ${err?.message ?? err}` });
    }
  }

  private replace(slug: string, patch: Partial<PrototypeDef>): void {
    this.protos = this.protos.map(p => p.slug === slug ? { ...p, ...patch } : p);
  }

  // ── More menu ─────────────────────────────────────────────────────────────

  toggleMenu(event: MouseEvent, proto: PrototypeDef): void {
    event.stopPropagation();
    if (this.menuFor === proto.slug) { this.menuFor = null; return; }
    const items: DroplistItem[] = [];
    if (proto.hasComponent) items.push({ id: 'copy', label: 'Copy link', icon: 'copy' });
    if (proto.figma) items.push({ id: 'figma', label: 'Open in Figma', icon: 'link' });
    if (this.canMove) items.push({ id: 'move', label: 'Move to module…', icon: 'move' });
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
      case 'move':
        this.openMove(proto);
        break;
      case 'scaffold':
        this.showScaffold(proto);
        break;
      case 'archive':
        this.archiveTarget = proto;
        break;
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
