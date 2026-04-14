import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { DS_COMPONENTS, TabItem, FvdrIconName } from '../../shared/ds';
import type { HeaderAction } from '../../shared/ds';

interface Integration {
  id: string;
  name: string;
  domain: string;
  description: string;
  logoInitial: string;
  logoColor: string;
  allowed: boolean;
  allowedProjects: string[];
  features: { enabledProjects: boolean; availableDocuments: boolean; permissionDownloads: boolean };
}

interface NavItem {
  id: string;
  label: string;
  active?: boolean;
  open?: boolean;
  icon: FvdrIconName;
  iconActive: FvdrIconName;
  children?: { id: string; label: string; active?: boolean }[];
}

const MOCK_PROJECTS = ['Project Alpha', 'Project Beta', 'Gamma Due Diligence', 'Delta M&A', 'Epsilon Fund'];

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout" [class.dark-theme]="isDark">

      <!-- ── Left sidebar ── -->
      <nav class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">

        <!-- Account switcher -->
        <div class="account-switcher">
          <div class="account-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="4" fill="#084D4B"/>
              <g clip-path="url(#ca-clip)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10 20.0001C10 25.5229 14.4772 30 20 30C25.5228 30 30 25.5228 30 20C30 14.4772 25.5228 10 20 10C14.4772 10 10 14.4772 10 20.0001ZM28 20C28 24.4183 24.4183 28 20 28C19.6615 28 19.3279 27.979 19.0005 27.9382C22.9466 27.4459 26 24.0796 26 20.0001C26 15.9203 22.9461 12.5538 18.9995 12.062C19.3273 12.0211 19.6612 12 20 12C24.4183 12 28 15.5817 28 20ZM12 20.0001C11.9999 18.3433 13.3431 17 15 17C16.6569 17 18 18.3431 18 20C18 21.6569 16.6569 23 15 23C13.3432 23 12.0001 21.6569 12 20.0001ZM18 26.0001C16.7661 26.0001 15.6191 25.6276 14.6655 24.989C14.7761 24.9963 14.8876 25 15 25C17.7614 25 20 22.7614 20 20C20 17.2386 17.7614 15 15 15C14.8877 15 14.7763 15.0037 14.6659 15.011C15.6195 14.3725 16.7663 14.0001 18 14.0001C21.3137 14.0001 24 16.6864 24 20.0001C24 23.3138 21.3137 26.0001 18 26.0001Z" fill="#8CEAA7"/>
              </g>
              <defs><clipPath id="ca-clip"><rect width="20" height="20" fill="white" transform="translate(10 10)"/></clipPath></defs>
            </svg>
          </div>
          <span class="account-name" *ngIf="!sidebarCollapsed">ACME</span>
          <fvdr-icon *ngIf="!sidebarCollapsed" name="chevron-down" class="account-chevron"></fvdr-icon>
        </div>

        <!-- Nav list -->
        <div class="nav-list">
          <ng-container *ngFor="let item of navItems">
            <button
              class="nav-item"
              [class.nav-item--active]="item.active"
              [class.nav-item--open]="item.open"
              [title]="sidebarCollapsed ? item.label : ''"
              (click)="toggleNavItem(item)"
              data-track="nav"
            >
              <span class="nav-icon-zone">
                <span class="nav-icon">
                  <fvdr-icon class="icon-default" [name]="item.icon"></fvdr-icon>
                  <fvdr-icon class="icon-active"  [name]="item.iconActive"></fvdr-icon>
                </span>
              </span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
              <fvdr-icon *ngIf="!sidebarCollapsed && item.children" name="chevron-down" class="nav-chevron" [class.nav-chevron--up]="item.open"></fvdr-icon>
            </button>

            <!-- Sub-items -->
            <div *ngIf="!sidebarCollapsed && item.open && item.children" class="nav-subitems">
              <button
                *ngFor="let child of item.children"
                class="nav-subitem"
                [class.nav-subitem--active]="child.active"
                data-track="nav-sub"
              >{{ child.label }}</button>
            </div>
          </ng-container>
        </div>

        <!-- Bottom: logo + collapse -->
        <div class="sidebar-bottom">
          <div class="sidebar-logo" *ngIf="!sidebarCollapsed">
            <!-- ideals. wordmark from Figma -->
            <svg width="87" height="18" viewBox="0 0 117 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.380615 3.0228C0.380615 1.67609 1.47081 0.650024 2.84959 0.650024C4.1963 0.650024 5.25444 1.67609 5.25444 3.0228C5.25444 4.40158 4.1963 5.39558 2.84959 5.39558C1.43875 5.39558 0.380615 4.40158 0.380615 3.0228ZM0.861584 22.967V7.25533H4.67727V22.967H0.861584Z" fill="#1F2129"/>
              <path d="M23.2427 1.00281V22.9991H19.5232V20.947C18.3689 22.3258 16.7336 23.3839 14.457 23.3839C9.93588 23.3839 6.56909 19.8247 6.56909 15.1433C6.56909 10.526 9.96794 6.93476 14.4249 6.93476C16.6694 6.93476 18.2727 7.96083 19.427 9.30754V1.00281H23.2427ZM19.6514 15.1112C19.6514 12.514 17.8238 10.3336 15.0021 10.3336C12.2125 10.3336 10.3848 12.514 10.3848 15.1112C10.3848 17.7726 12.2125 19.9209 15.0021 19.9209C17.7917 19.9209 19.6514 17.7726 19.6514 15.1112Z" fill="#1F2129"/>
              <path d="M40.9744 16.4579H28.886C29.367 18.478 30.8419 20.0812 33.7278 20.0812C35.5234 20.0812 37.5755 19.4078 38.9543 18.4459L40.4613 21.1393C38.9864 22.2295 36.4533 23.3197 33.5674 23.3197C27.6034 23.3197 24.9741 19.2796 24.9741 15.1112C24.9741 10.4298 28.2768 6.90265 33.2147 6.90265C37.6717 6.90265 41.0706 9.82053 41.0706 14.7905C41.1026 15.4318 41.0385 15.9449 40.9744 16.4579ZM28.886 13.6041H37.3511C37.0304 11.3917 35.3951 10.045 33.2147 10.045C31.0343 10.045 29.399 11.4238 28.886 13.6041Z" fill="#1F2129"/>
              <path d="M59.1871 7.28742V22.967H55.5638V21.0431C54.3774 22.3899 52.6779 23.3518 50.4014 23.3518C45.8161 23.3518 42.5455 19.6964 42.5455 15.0471C42.5455 10.3336 45.8803 6.90265 50.4014 6.90265C52.6779 6.90265 54.3453 7.92872 55.5638 9.27543V7.28742H59.1871ZM55.66 15.1112C55.66 12.514 53.7681 10.3336 50.9785 10.3336C48.1889 10.3336 46.3292 12.514 46.3292 15.1112C46.3292 17.7405 48.1889 19.9209 50.9785 19.9209C53.7361 19.9209 55.66 17.7405 55.66 15.1112Z" fill="#1F2129"/>
              <path d="M61.5919 22.9671V1.00281H65.3755V22.9991H61.5919V22.9671Z" fill="#1F2129"/>
              <path d="M66.9468 20.2735L69.0951 17.9649C70.1853 19.3757 71.8206 20.1773 73.3597 20.1773C74.7385 20.1773 75.7004 19.4399 75.7004 18.5421C75.7004 17.8687 75.2515 17.4198 74.514 17.035C73.6162 16.5861 71.5641 15.9128 70.5701 15.3997C68.7745 14.534 67.9087 13.1231 67.9087 11.3916C67.9087 8.69822 70.1532 6.74228 73.6803 6.74228C75.7004 6.74228 77.6884 7.4477 79.1313 9.05093L77.1433 11.4558C76.0211 10.3015 74.6743 9.82048 73.5841 9.82048C72.3657 9.82048 71.6603 10.4938 71.6603 11.2955C71.6603 11.8406 72.013 12.4498 73.0391 12.8346C74.0651 13.2514 75.6042 13.7644 76.8547 14.4057C78.6183 15.3356 79.5482 16.554 79.5482 18.4138C79.5482 21.2034 77.1433 23.3838 73.3918 23.3838C70.8587 23.3838 68.4538 22.3577 66.9468 20.2735Z" fill="#1F2129"/>
              <path d="M80.51 21.1714C80.51 19.9209 81.5361 18.959 82.8187 18.959C84.0371 18.959 85.0311 19.9209 85.0311 21.1714C85.0311 22.4861 84.0371 23.416 82.8187 23.416C81.5361 23.448 80.51 22.4861 80.51 21.1714Z" fill="#1F2129"/>
            </svg>
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed" [title]="sidebarCollapsed ? 'Expand' : 'Collapse'">
            <fvdr-icon *ngIf="!sidebarCollapsed" name="angle-double-left"></fvdr-icon>
            <fvdr-icon *ngIf="sidebarCollapsed"  name="angle-double-right"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ── Main ── -->
      <div class="main-area">

        <!-- ── Header ── -->
        <fvdr-header
          [breadcrumbs]="headerBreadcrumbs"
          [actions]="headerActions"
          [showMenu]="false"
          userName="Test Name"
          (actionClick)="onHeaderAction($event)"
        />

        <!-- ── Content ── -->
        <div class="content-area">

          <fvdr-tabs [tabs]="tabs" [(activeId)]="activeTab" />

          <!-- Banners — Figma: bg #f7f7f7, pad 8/12, gap 8, r=4 -->
          <div class="banners">

            <div class="banner">
              <fvdr-icon name="info" class="banner-icon"></fvdr-icon>
              <span>Only integrations allowed at the corporate account level can be enabled for individual projects. <a href="#" class="info-link">Learn more</a></span>
            </div>
          </div>

          <!-- ── Integration cards grid — Figma: 3 cols, gap 24px ── -->
          <div class="cards-grid">
            <div *ngFor="let item of integrations" class="int-card" [class.int-card--allowed]="item.allowed">

              <!-- Card body — Figma: pad 0/24, gap 12 -->
              <div class="int-card__body">

                <!-- Header row — Figma: gap 12 HORIZONTAL -->
                <div class="int-card__head-row">
                  <!-- Logo — Figma: 40×40, border 1px #dee0eb, r=4, bg #ffffff -->
                  <div class="int-logo">
                    <span class="int-logo-initial" [style.color]="item.logoColor">{{ item.logoInitial }}</span>
                  </div>
                  <div class="int-meta">
                    <span class="int-name">{{ item.name }}</span>
                    <span class="int-domain">{{ item.domain }}</span>
                  </div>
                </div>

                <!-- Description + features — Figma: gap 16 VERTICAL -->
                <div class="int-card__desc-block">
                  <p class="int-desc">{{ item.description }}</p>

                  <!-- Feature badges — Figma: "Order" VERTICAL gap 8 -->
                  <div class="feature-order">
                    <!-- Row 1: Enabled projects + Available documents -->
                    <div class="feature-row">
                      <span class="feature-badge">
                        Enabled projects
                      </span>
                      <span class="feature-badge">
                        Available documents
                      </span>
                    </div>
                    <!-- Row 2: Permission-based downloads -->
                    <div class="feature-row">
                      <span class="feature-badge">
                        Permission-based downloads
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer — Figma: pad 0/24, gap 16 HORIZONTAL -->
              <div class="int-card__footer">
                <ng-container *ngIf="!item.allowed">
                  <fvdr-btn label="Allow" variant="primary" size="m" [dataTrack]="'allow-' + item.id" (clicked)="openModal(item)" />
                </ng-container>
                <ng-container *ngIf="item.allowed">
                  <!-- Forbid — red outline button -->
                  <fvdr-btn label="Forbid" variant="danger" size="m" iconName="cancel" [dataTrack]="'forbid-card-' + item.id" (clicked)="openForbidModal(item)" />
                  <fvdr-btn label="Edit projects" variant="secondary" size="m" iconName="edit" [dataTrack]="'edit-' + item.id" (clicked)="openEditModal(item)" />
                </ng-container>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         MODAL — "Allow integration"
         States: default / dropdown open / error / selected
    ══════════════════════════════════════════ -->
    <div *ngIf="modalOpen" class="modal-overlay" (click)="onOverlayClick()">
      <div class="modal" (click)="$event.stopPropagation(); projectDropdownOpen = false" role="dialog" aria-modal="true">

        <!-- Header — Figma: h=72, pad 24, border-bottom #dee0eb -->
        <div class="modal-header">
          <span class="modal-title">{{ modalMode === 'edit' ? 'Edit projects' : 'Allow integration' }}</span>
          <button class="modal-close" (click)="closeModal()" data-track="modal-close">
            <fvdr-icon name="cancel"></fvdr-icon>
          </button>
        </div>

        <!-- Body — Figma: Frame 576, pad right=24 bottom=8 left=24, gap=16 -->
        <div class="modal-body">

          <!-- Info text — Figma: 16px fw=400 #1f2129 -->
          <p class="modal-info-text">
            <strong>{{ modalIntegration?.name }}</strong> will be allowed to be used in the selected projects by authorized participants.
          </p>

          <!-- Dropdown "Projects" — Figma: 448px wide, label 15px fw=600 -->
          <div class="field" #projectField>
            <span class="field-label">Projects</span>

            <!-- Trigger field — Figma: h=40, border 1px #bbbdc8, r=4, pad 8/16, gap=8 -->
            <div class="trigger-wrapper">
            <div
              class="dropdown-trigger"
              [class.dropdown-trigger--error]="projectError"
              [class.dropdown-trigger--open]="projectDropdownOpen"
              (click)="toggleProjectDropdown(); $event.stopPropagation()"
              data-track="projects-dropdown"
            >
              <span *ngIf="selectedProjects.length === 0" class="trigger-placeholder">Select</span>
              <span *ngIf="selectedProjects.length > 0" class="trigger-value">{{ selectedProjects.length }} selected</span>

              <div class="trigger-icons">
                <!-- Clear × — only when something selected (Figma: Actions 16×16 #5f616a) -->
                <button
                  *ngIf="selectedProjects.length > 0"
                  class="trigger-clear"
                  (click)="clearSelection($event)"
                  data-track="clear-selection"
                >
                  <fvdr-icon name="cancel"></fvdr-icon>
                </button>
                <fvdr-icon name="chevron-down" class="trigger-chevron" [class.rotated]="projectDropdownOpen"></fvdr-icon>
              </div>
            </div>

            <!-- Droplist — Figma: 447×232, bg #ffffff, border 1px #dee0eb -->
            <div *ngIf="projectDropdownOpen" class="droplist" (click)="$event.stopPropagation()">

              <!-- Search area — Figma: bg #fbfbfb, border-bottom 1px #dee0eb, pad 16, gap 16, h=72 -->
              <div class="droplist-search">
                <fvdr-checkbox
                  [checked]="allProjectsSelected"
                  [indeterminate]="someProjectsSelected"
                  (checkedChange)="onSelectAllChange($event)"
                />
                <div class="search-field">
                  <fvdr-icon name="search" class="search-icon"></fvdr-icon>
                  <input
                    [(ngModel)]="projectSearch"
                    placeholder="Search"
                    class="search-input"
                    (click)="$event.stopPropagation()"
                    #searchInput
                  />
                </div>
              </div>

              <!-- List — Figma: Tree items, pad 8/32, h=40 each -->
              <div class="droplist-body">
                <!-- Select all row — Figma: pad 8/16, border-bottom -->
                <div class="tree-item tree-item--select-all" (click)="toggleAllProjects($event)">
                  <fvdr-checkbox [checked]="allProjectsSelected" [indeterminate]="someProjectsSelected" />
                  <span class="tree-label">Select all</span>
                </div>
                <!-- Project rows — pad 8/32, bg #ebf8ef when selected -->
                <div
                  *ngFor="let project of filteredProjects"
                  class="tree-item tree-item--project"
                  [class.tree-item--selected]="selectedProjects.includes(project)"
                  (click)="toggleProject(project, $event)"
                >
                  <fvdr-checkbox [checked]="selectedProjects.includes(project)" />
                  <span class="tree-label">{{ project }}</span>
                </div>
                <div *ngIf="filteredProjects.length === 0" class="tree-empty">No results</div>
              </div>

            </div>
            </div>

            <!-- Hint — normal or error -->
            <span *ngIf="!projectError" class="field-hint">Selected projects will have access to integration</span>
            <span *ngIf="projectError" class="field-hint field-hint--error">Fill in to continue</span>
          </div>

          <!-- Checkbox — Figma: pad 8/8/8/0, gap 12, HORIZONTAL -->
          <div class="modal-checkbox-row">
            <fvdr-checkbox
              [(checked)]="includeNewProjects"
              data-track="include-new-projects"
            />
            <span class="modal-checkbox-label">Include newly created projects to allowed list</span>
          </div>

          <!-- Info banner — Figma: Inline, bg #f7f7f7, pad 8/12, r=4 -->
          <div class="modal-banner">
            <fvdr-icon name="info" class="banner-icon"></fvdr-icon>
            <span>Project administrators can later manage integrations in the project settings. <a href="#" class="modal-link" (click)="$event.preventDefault()">Learn more</a></span>
          </div>

        </div>

        <!-- Footer — Figma: h=88, pad 24, border-top #dee0eb -->
        <!-- Left: Forbid (trash + red text) | Right: Cancel + Confirm -->
        <div class="modal-footer">
          <fvdr-btn *ngIf="modalMode === 'edit'" label="Forbid integration" variant="ghost" size="m" iconName="trash" data-track="modal-forbid" (clicked)="openForbidModal(modalIntegration)" />
          <div class="modal-footer-right">
            <fvdr-btn label="Cancel" variant="secondary" size="m" data-track="modal-cancel" (clicked)="closeModal()" />
            <fvdr-btn label="Confirm" variant="primary" size="m" data-track="modal-confirm" (clicked)="confirmAllow()" />
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════
         FORBID CONFIRMATION MODAL
    ══════════════════════════════════════════ -->
    <div *ngIf="forbidModalOpen" class="modal-overlay" (click)="forbidModalOpen = false">
      <div class="modal modal--forbid" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="modal-header">
          <span class="modal-title">Forbid integration</span>
          <button class="modal-close" (click)="forbidModalOpen = false" data-track="forbid-modal-close">
            <fvdr-icon name="cancel"></fvdr-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body forbid-body">
          <p class="forbid-title">Forbid <strong>{{ forbidTarget?.name }}</strong> for the entire corporate account?</p>
          <p class="forbid-text">This will prevent the integration from being used in any project within this corporate account.</p>
          <p class="forbid-text">Integration will be disabled in all projects, and all active user connections will be terminated.</p>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="modal-footer-right">
            <fvdr-btn label="Cancel" variant="secondary" size="m" data-track="forbid-cancel" (clicked)="forbidModalOpen = false" />
            <fvdr-btn label="Forbid" variant="danger" size="m" data-track="forbid-confirm" (clicked)="confirmForbid()" />
          </div>
        </div>

      </div>
    </div>

    <!-- ── Toast notification ── -->
    <div class="toast" [class.toast--visible]="toastVisible" [class.toast--error]="toastVariant === 'error'">
      <div class="toast-bar"></div>
      <div class="toast-content">
        <fvdr-icon *ngIf="toastVariant === 'success'" name="finished" class="toast-icon toast-icon--success"></fvdr-icon>
        <fvdr-icon *ngIf="toastVariant === 'error'"   name="error"    class="toast-icon toast-icon--error"></fvdr-icon>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-family); display: block; }

    /* ── Layout ── */
    .page-layout { display: flex; height: 100vh; background: var(--color-stone-200); overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px; min-width: 280px;
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      display: flex; flex-direction: column;
      overflow: hidden;
      transition: width 0.22s ease, min-width 0.22s ease;
      flex-shrink: 0;
    }
    .sidebar--collapsed { width: 72px; min-width: 72px; }

    /* Account switcher — Figma: 64px h, pad L=16 R=16 T=12 B=12, itemSpacing=10 */
    .account-switcher {
      height: 64px; min-height: 64px;
      background: var(--color-stone-200);
      border-bottom: 1px solid var(--color-divider);
      display: flex; align-items: center;
      padding: 0 var(--space-4);
      gap: var(--space-3);
      cursor: pointer;
      overflow: hidden;
    }
    .account-switcher:hover { background: var(--color-stone-300); }
    .account-logo {
      width: 40px; height: 40px; min-width: 40px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      display: flex;
    }
    .account-name { font-size: var(--text-label-l-size); font-weight: var(--text-label-l-weight); color: var(--color-text-primary); flex: 1; white-space: nowrap; overflow: hidden; }
    .account-chevron { flex-shrink: 0; font-size: 16px; color: var(--color-text-secondary); }

    /* Nav list */
    .nav-list { display: flex; flex-direction: column; flex: 1; background: var(--color-stone-200); overflow-y: auto; padding: var(--space-6) 0 var(--space-2); gap: var(--space-6); }

    /* Nav item — Figma: 280×32 (or 72×32 collapsed) */
    .nav-item {
      width: 100%;
      height: 32px; min-height: 32px;
      border: none; background: transparent;
      color: var(--color-stone-900);
      cursor: pointer;
      display: flex; align-items: center;
      font-size: var(--text-body1-size); font-weight: var(--text-body1-weight);
      font-family: var(--font-family);
      text-align: left;
      transition: background 0.12s;
      white-space: nowrap;
      overflow: hidden;
    }
    .icon-active { display: none; }
    .nav-item:hover { background: transparent; font-weight: var(--text-label-l-weight); }
    .nav-item:hover .icon-default { display: none; }
    .nav-item:hover .icon-active  { display: inline-flex; }
    .nav-item--active, .nav-item--open { color: var(--color-text-primary); font-weight: var(--text-label-l-weight); }
    .nav-item--active { background: var(--color-primary-50); }
    .nav-item--active:hover { background: var(--color-primary-50); }
    .nav-item--active .icon-default,
    .nav-item--open   .icon-default { display: none; }
    .nav-item--active .icon-active,
    .nav-item--open   .icon-active  { display: inline-flex; }

    /* Icon zone — always 72px wide */
    .nav-icon-zone {
      width: 72px; min-width: 72px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    /* nav-icon: default state uses currentColor, active icon has hardcoded 2-tone colors */
    .nav-icon { display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); font-size: var(--text-h3-size); }

    .nav-label { flex: 1; }
    .nav-chevron { flex-shrink: 0; margin-right: var(--space-4); transition: transform 0.2s; font-size: var(--text-body1-size); color: var(--color-text-secondary); }
    .nav-chevron--up { transform: rotate(180deg); }

    /* Sub-items */
    .nav-subitems { display: flex; flex-direction: column; background: var(--color-stone-200); }
    .nav-subitem {
      height: 32px;
      padding: 0 var(--space-4) 0 72px;
      border: none; background: transparent; cursor: pointer;
      font-size: var(--text-body3-size); font-weight: var(--text-body3-weight); color: var(--color-text-primary);
      font-family: var(--font-family);
      text-align: left;
      white-space: nowrap;
      transition: background 0.12s;
    }
    .nav-subitem:hover { background: transparent; font-weight: var(--text-label-s-weight); }
    .nav-subitem--active { font-weight: var(--text-label-s-weight); color: var(--color-primary-500); background: transparent; }
    .nav-subitem--active:hover { background: transparent; }

    /* Bottom logo + collapse — Figma: 72px h, pad L=24 R=16 */
    .sidebar-bottom {
      height: 72px; min-height: 72px;
      background: var(--color-stone-200);
      border-top: 1px solid var(--color-divider);
      display: flex; align-items: center;
      padding: 0 var(--space-4) 0 var(--space-6);
      justify-content: space-between;
      overflow: hidden;
    }
    .sidebar-logo { display: flex; align-items: center; overflow: hidden; }
    .collapse-btn {
      width: 32px; height: 32px; min-width: 32px;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s;
      margin-left: auto;
      font-size: 16px; color: var(--color-text-secondary);
    }
    .collapse-btn:hover { background: var(--color-hover-bg); }

    /* ── Main ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Header — handled by fvdr-header DS component ── */

    /* ── Content area — Figma: Midgard pad 24/24/24/24 ── */
    .content-area { flex: 1; overflow-y: auto; padding: var(--space-6); background: var(--color-stone-0); }

    /* ── Banners — Figma: Inline bg #f7f7f7, pad 8/12, gap 8, r=4 ── */
    .banners { display: flex; flex-direction: column; gap: var(--space-2); margin: var(--space-5) 0 var(--space-6); }
    .banner {
      display: flex; align-items: flex-start; gap: var(--space-2);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-body2-size); color: var(--color-text-primary); line-height: var(--text-body2-lh);
    }
    .banner-icon { font-size: 16px; flex-shrink: 0; margin-top: 3px; }
    .info-link { color: var(--color-primary-500); text-decoration: none; }
    .info-link:hover { text-decoration: underline; }
    .bc-chevron { font-size: 16px; }
    .bc-chevron--dim { color: var(--color-stone-500); }

    /* ── Cards Grid — Figma: 3 cols, gap 24px ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-6);
    }
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 740px)  { .cards-grid { grid-template-columns: 1fr; } }

    /* ── Integration Card — Figma: bg #fff, border 1px #dee0eb, r=4, pad 24/0, gap 24, VERTICAL ── */
    .int-card {
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      display: flex; flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-6) 0;
      transition: border-color 0.15s;
    }
    .int-card:hover { border-color: var(--color-primary-500); }
    .int-card--allowed { border-color: var(--color-primary-500); }

    /* Card body — Figma: Frame 1000006716, pad 0/24, gap 12 VERTICAL */
    .int-card__body { padding: 0 var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }

    /* Head row — Figma: gap 12 HORIZONTAL */
    .int-card__head-row { display: flex; align-items: flex-start; gap: var(--space-3); }

    /* Logo — Figma: 40×40, border 1px #dee0eb, r=4, bg #ffffff */
    .int-logo {
      width: 40px; height: 40px; min-width: 40px;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: center;
    }
    .int-logo-initial { font-size: var(--text-body1-size); font-weight: var(--text-h3-weight); line-height: 1; }

    /* Meta */
    .int-meta { display: flex; flex-direction: column; gap: 0; }
    .int-name { font-size: var(--text-label-l-size); font-weight: var(--text-label-l-weight); color: var(--color-text-primary); line-height: var(--text-label-l-lh); }
    .int-domain { font-size: var(--text-caption1-size); font-weight: var(--text-caption1-weight); color: var(--color-text-secondary); line-height: var(--text-caption1-lh); }

    /* Desc block — Figma: Frame 1000006709, gap 16 VERTICAL */
    .int-card__desc-block { display: flex; flex-direction: column; gap: var(--space-4); }
    .int-desc { font-size: var(--text-body3-size); font-weight: var(--text-body3-weight); color: var(--color-text-primary); line-height: var(--text-body3-lh); margin: 0; }

    /* Feature order — Figma: "Order", VERTICAL gap 8 */
    .feature-order { display: flex; flex-direction: column; gap: var(--space-2); }
    /* Feature row — HORIZONTAL gap 8 */
    .feature-row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }

    /* Badge — Figma: "Badge Locked", bg #ebf4fd, pad 0/8, r=4, h=20, fs=12 #1f2129, icon 14×14 #2c9c74 */
    .feature-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--color-info-50);
      border-radius: var(--radius-sm);
      padding: 0 var(--space-2);
      height: 20px;
      font-size: var(--text-caption1-size); font-weight: var(--text-caption1-weight); color: var(--color-text-primary);
      white-space: nowrap;
    }
    .badge-icon { font-size: 14px; flex-shrink: 0; color: var(--color-primary-500); }

    /* Card footer — Figma: Frame 37573, pad 0/24, gap 16 HORIZONTAL */
    .int-card__footer {
      padding: 0 var(--space-6);
      display: flex; align-items: center; gap: var(--space-4);
    }

    .btn-icon { font-size: 14px; flex-shrink: 0; }

    /* Forbid card button — red outline */
    /* Card buttons now use fvdr-btn DS component */

    /* ══════════════════════════════════════════
       MODAL
    ══════════════════════════════════════════ */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Figma: 512px wide, r=4 */
    .modal {
      width: 512px;
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      display: flex; flex-direction: column;
      animation: slideUp 0.18s ease;
      max-height: 90vh;
      overflow: visible; /* allow droplist to overflow */
    }
    @keyframes slideUp { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Header — Figma: h=72, pad 24/24, border-bottom 1px #dee0eb */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
      height: 72px; min-height: 72px;
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .modal-title { font-size: var(--text-label-l-size); font-weight: var(--text-label-l-weight); color: var(--color-text-primary); }
    .modal-close {
      width: 24px; height: 24px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm); color: var(--color-text-secondary); font-size: var(--text-body3-size);
      transition: background 0.15s;
    }
    .modal-close:hover { background: var(--color-stone-200); }

    /* Body — Figma: Frame 576, pad right=24 bottom=8 left=24, gap=16 */
    .modal-body {
      padding: var(--space-4) var(--space-6) var(--space-2) var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-4);
      overflow-y: visible;
      flex-shrink: 0;
    }

    /* Info text — Figma: 16px fw=400 #1f2129 */
    .modal-info-text { margin: 0; font-size: var(--text-body1-size); line-height: var(--text-body1-lh); color: var(--color-text-primary); }

    /* Field wrapper */
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .trigger-wrapper { position: relative; }
    .field-label { font-size: var(--text-label-m-size); font-weight: var(--text-label-m-weight); color: var(--color-text-primary); line-height: var(--text-label-m-lh); }
    .field-hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); line-height: var(--text-caption1-lh); }
    .field-hint--error { color: var(--color-error-600); }

    /* Dropdown trigger — Figma: h=40, border 1px #bbbdc8, r=4, pad 8/16, gap=8 */
    .dropdown-trigger {
      height: 40px; padding: var(--space-2) var(--space-4);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; gap: var(--space-2);
      transition: border-color 0.15s;
      font-size: var(--text-body2-size); font-family: var(--font-family);
    }
    .dropdown-trigger:hover:not(.dropdown-trigger--error) { border-color: var(--color-primary-500); }
    .dropdown-trigger--open { border-color: var(--color-primary-500); }
    .dropdown-trigger--error { border-color: var(--color-error-500) !important; }
    .trigger-placeholder { color: var(--color-text-placeholder); flex: 1; }
    .trigger-value { color: var(--color-text-primary); flex: 1; }
    .trigger-icons { display: flex; align-items: center; gap: var(--space-2); }
    .trigger-clear {
      width: 16px; height: 16px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-xs);
      color: var(--color-text-secondary);
    }
    .trigger-clear:hover { background: var(--color-stone-300); }
    .trigger-chevron { flex-shrink: 0; transition: transform 0.2s; font-size: 16px; color: var(--color-text-secondary); }
    .trigger-chevron.rotated { transform: rotate(180deg); }
    .search-icon { font-size: 16px; color: var(--color-text-placeholder); flex-shrink: 0; }

    /* Droplist — Figma: position below trigger, border 1px #dee0eb */
    .droplist {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      width: 100%;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      z-index: 100;
      overflow: hidden;
    }

    /* Search area — Figma: bg #fbfbfb, border-bottom 1px #dee0eb, pad 16, gap 16, h=72 */
    .droplist-search {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4);
      background: var(--color-stone-100);
      border-bottom: 1px solid var(--color-divider);
      height: 72px;
    }
    .search-field {
      flex: 1;
      display: flex; align-items: center; gap: var(--space-2);
      height: 40px; padding: var(--space-2) var(--space-4);
      border: 1px solid var(--color-stone-500);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
    }
    .search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: var(--text-body2-size); color: var(--color-text-primary); font-family: var(--font-family);
    }
    .search-input::placeholder { color: var(--color-text-placeholder); }

    /* List items */
    .droplist-body { max-height: 200px; overflow-y: auto; }

    /* Select all row — Figma: pad 8/16, border-bottom 1px #dee0eb */
    .tree-item {
      display: flex; align-items: center; gap: var(--space-4);
      height: 40px; cursor: pointer;
      transition: background 0.1s;
    }
    .tree-item--select-all {
      padding: var(--space-2) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
    }
    .tree-item--select-all:hover { background: var(--color-stone-200); }

    /* Project rows — Figma: pad 8/32 (indented), bg #ebf8ef when selected */
    .tree-item--project { padding: var(--space-2) var(--space-8); }
    .tree-item--project:hover { background: var(--color-stone-200); }
    .tree-item--selected { background: var(--color-primary-50); }
    .tree-item--selected:hover { background: var(--color-primary-100); }

    .tree-label { font-size: var(--text-body3-size); color: var(--color-text-primary); }
    .tree-empty { padding: var(--space-4); font-size: var(--text-body3-size); color: var(--color-text-placeholder); text-align: center; }

    /* Checkbox row inside modal body */
    .modal-checkbox-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0 var(--space-2) 0; }
    .modal-checkbox-label { font-size: var(--text-body2-size); color: var(--color-text-primary); line-height: var(--text-body2-lh); }

    /* Info banner — Figma: bg #f7f7f7, pad 8/12, r=4, gap=8 */
    .modal-banner {
      display: flex; align-items: flex-start; gap: var(--space-2);
      background: var(--color-stone-200); border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-body2-size); color: var(--color-text-primary); line-height: var(--text-body2-lh);
    }
    .modal-link { color: var(--color-primary-500); text-decoration: none; }
    .modal-link:hover { text-decoration: underline; }

    /* Footer — Figma: h=88, pad 24, border-top #dee0eb, HORIZONTAL space-between */
    .modal-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-6);
      border-top: 1px solid var(--color-divider);
      min-height: 88px;
      flex-shrink: 0;
    }
    .modal-footer-right { display: flex; align-items: center; gap: var(--space-4); margin-left: auto; }

    /* Modal footer buttons now use fvdr-btn DS component */

    /* ── Toast — top-right, slide in from right ── */
    .toast {
      position: fixed; top: var(--space-6); right: var(--space-6);
      transform: translateY(-120%);
      width: 360px; min-height: 56px;
      background: var(--color-stone-100);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-toast);
      display: flex; align-items: stretch;
      overflow: hidden;
      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
      opacity: 0; z-index: 2000; pointer-events: none;
    }
    .toast--visible { transform: translateY(0); opacity: 1; pointer-events: auto; }
    .toast-bar { width: 4px; flex-shrink: 0; background: var(--color-primary-500); }
    .toast--error .toast-bar { background: var(--color-error-600); }
    .toast-content {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-body3-size); color: var(--color-text-primary); flex: 1;
    }
    .toast-icon { font-size: 20px; flex-shrink: 0; }
    .toast-icon--success { color: var(--color-primary-500); }
    .toast-icon--error   { color: var(--color-error-600); }

    /* ── Forbid confirmation modal ── */
    .modal--forbid { width: 480px; }
    .forbid-body { display: flex; flex-direction: column; gap: var(--space-3); }
    .forbid-title { margin: 0; font-size: var(--text-body1-size); font-weight: var(--text-body1-weight); color: var(--color-text-primary); line-height: var(--text-body1-lh); }
    .forbid-text { margin: 0; font-size: var(--text-body2-size); font-weight: var(--text-body2-weight); color: var(--color-text-primary); line-height: var(--text-body2-lh); }

    /* Forbid confirm button now uses fvdr-btn DS component */

    /* ══════════════════════════════════════════
       DARK THEME OVERRIDES
    ══════════════════════════════════════════ */
    .dark-theme.page-layout { background: var(--color-text-primary); }

    .dark-theme .sidebar { background: #212426; border-right-color: #33383b; }
    .dark-theme .account-switcher { background: #212426; border-bottom-color: #33383b; }
    .dark-theme .account-switcher:hover { background: #2d3235; }
    .dark-theme .account-name { color: var(--color-bg-page); }
    .dark-theme .account-chevron { color: #8b949a; }

    .dark-theme .nav-list { background: #212426; }
    .dark-theme .nav-item { color: #b5bbbf; }
    .dark-theme .nav-item:hover { background: transparent; }
    .dark-theme .nav-item--active,
    .dark-theme .nav-item--open { color: var(--color-bg-page); }
    .dark-theme .nav-item--active { background: #1e3028; }
    .dark-theme .nav-item--active:hover { background: #1e3028; }
    .dark-theme .nav-icon { color: #8b949a; }
    .dark-theme .nav-chevron { color: #8b949a; }
    .dark-theme .nav-subitems { background: #212426; }
    .dark-theme .nav-subitem { color: #b5bbbf; }
    .dark-theme .nav-subitem:hover { background: transparent; }
    .dark-theme .nav-subitem--active { color: var(--color-interactive-primary); background: transparent; }
    .dark-theme .nav-subitem--active:hover { background: transparent; }

    .dark-theme .sidebar-bottom { background: #212426; border-top-color: #33383b; }
    .dark-theme .collapse-btn { color: #8b949a; }
    .dark-theme .collapse-btn:hover { background: #33383b; }


    .dark-theme .content-area { background: var(--color-text-primary); }
    .dark-theme .banner { background: #292d2f; color: #b5bbbf; }

    .dark-theme .int-card { background: #292d2f; border-color: #33383b; }
    .dark-theme .int-card:hover { border-color: var(--color-interactive-primary); }
    .dark-theme .int-logo { background: #33383b; border-color: #40464a; }
    .dark-theme .int-name { color: var(--color-bg-page); }
    .dark-theme .int-domain { color: #8b949a; }
    .dark-theme .int-desc { color: #b5bbbf; }
    .dark-theme .feature-badge { background: #1e2d3f; color: #b5bbbf; }

    .dark-theme .btn-card-forbid { background: #292d2f; }
    .dark-theme .btn-card-forbid:hover { background: #3a2220; }
    .dark-theme .btn-card-edit { background: #292d2f; border-color: #50575c; color: #b5bbbf; }
    .dark-theme .btn-card-edit:hover { background: #33383b; border-color: #8b949a; }

    .dark-theme .modal { background: #292d2f; }
    .dark-theme .modal-header { border-bottom-color: #33383b; }
    .dark-theme .modal-title { color: var(--color-bg-page); }
    .dark-theme .modal-close { color: #8b949a; }
    .dark-theme .modal-close:hover { background: #33383b; }
    .dark-theme .modal-info-text { color: #b5bbbf; }
    .dark-theme .field-label { color: var(--color-bg-page); }
    .dark-theme .field-hint { color: #8b949a; }
    .dark-theme .dropdown-trigger { background: #33383b; border-color: #50575c; color: #b5bbbf; }
    .dark-theme .trigger-placeholder { color: #6f7980; }
    .dark-theme .trigger-value { color: var(--color-bg-page); }
    .dark-theme .trigger-chevron { color: #8b949a; }
    .dark-theme .droplist { background: #292d2f; border-color: #33383b; }
  `],
})
export class CaSettingsIntegrationsComponent implements OnInit, OnDestroy {
  tracker = inject(TrackerService);

  tabs: TabItem[] = [
    { id: 'security', label: 'Security' },
    { id: 'integrations', label: 'Integrations' },
  ];
  activeTab = 'integrations';

  sidebarCollapsed = false;
  isDark = false;

  toggleTheme(): void { this.isDark = !this.isDark; }

  headerBreadcrumbs: { id: string; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'integrations', label: 'Integrations' },
  ];
  get headerActions(): HeaderAction[] {
    return [
      { id: 'theme', icon: this.isDark ? 'theme-light' : 'theme-dark' },
      { id: 'help', icon: 'help' },
    ];
  }
  onHeaderAction(id: string): void {
    if (id === 'theme') this.toggleTheme();
  }

  navItems: NavItem[] = [
    { id: 'overview',     label: 'Overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active' },
    { id: 'projects',     label: 'Projects',     icon: 'nav-projects',     iconActive: 'nav-projects-active',     open: true,
      children: [{ id: 'list', label: 'List' }, { id: 'template', label: 'Template' }, { id: 'attributes', label: 'Attributes', active: true }] },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'storage',      label: 'Usage trends', icon: 'nav-reports',      iconActive: 'nav-reports-active' },
    { id: 'billing',      label: 'Subscription', icon: 'nav-billing',      iconActive: 'nav-billing-active' },
    { id: 'settings',     label: 'Settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active' },
    { id: 'apikeys',      label: 'API keys',     icon: 'nav-api',          iconActive: 'nav-api-active' },
  ];

  toggleNavItem(item: NavItem): void {
    if (item.children) {
      item.open = !item.open;
    }
  }

  integrations: Integration[] = [
    {
      id: 'emma', name: 'Emma', domain: 'emma.legal',
      description: 'Accelerate end-to-end M&A due diligence by mapping project documents and surfacing clause-level risks for full deal visibility',
      logoInitial: 'E', logoColor: '#2C9C74', allowed: false, allowedProjects: [],
      features: { enabledProjects: true, availableDocuments: true, permissionDownloads: false },
    },
    {
      id: 'jurimesh', name: 'Jurimesh', domain: 'jurimesh.com',
      description: 'Automate document analysis, identify legal risks, and standardize review outputs at scale to streamline contract-focused due diligence',
      logoInitial: 'J', logoColor: '#4862D3', allowed: false, allowedProjects: [],
      features: { enabledProjects: true, availableDocuments: false, permissionDownloads: false },
    },
    {
      id: 'prudentia', name: 'Prudentia sciences', domain: 'prudentiasciences.com',
      description: 'Support life sciences deal evaluation and investment decisions by transforming scientific, clinical, and financial data into actionable insights',
      logoInitial: 'P', logoColor: '#F4640C', allowed: false, allowedProjects: [],
      features: { enabledProjects: false, availableDocuments: false, permissionDownloads: false },
    },
    {
      id: 'zapier', name: 'Zapier', domain: 'zapier.com',
      description: 'Automate data room processes by connecting your virtual data room to other tools, triggering uploads, notifications, and workflow actions',
      logoInitial: 'Z', logoColor: '#FF4A00', allowed: false, allowedProjects: [],
      features: { enabledProjects: true, availableDocuments: true, permissionDownloads: true },
    },
    {
      id: 'appx', name: 'App X', domain: 'App.com',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi',
      logoInitial: 'A', logoColor: '#358CEB', allowed: false, allowedProjects: [],
      features: { enabledProjects: false, availableDocuments: false, permissionDownloads: false },
    },
    {
      id: 'appx2', name: 'App X2', domain: 'App2.com',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi',
      logoInitial: 'A', logoColor: '#8B5CF6', allowed: false, allowedProjects: [],
      features: { enabledProjects: false, availableDocuments: false, permissionDownloads: false },
    },
  ];

  // Modal state
  modalOpen = false;
  modalMode: 'allow' | 'edit' = 'allow';
  modalIntegration: Integration | null = null;
  selectedProjects: string[] = [];

  // Forbid confirmation modal
  forbidModalOpen = false;
  forbidTarget: Integration | null = null;
  includeNewProjects = false;
  projectDropdownOpen = false;
  projectSearch = '';
  projectError = false;        // State 3: error border + "Fill in to continue"
  projects = MOCK_PROJECTS;

  // Toast state
  toastVisible = false;
  toastMessage = '';
  toastVariant: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  get filteredProjects(): string[] {
    return this.projects.filter(p => p.toLowerCase().includes(this.projectSearch.toLowerCase()));
  }
  get allProjectsSelected(): boolean { return this.selectedProjects.length === this.projects.length; }
  get someProjectsSelected(): boolean { return this.selectedProjects.length > 0 && this.selectedProjects.length < this.projects.length; }

  openModal(item: Integration): void {
    this.modalMode = 'allow';
    this.modalIntegration = item;
    this.selectedProjects = [...item.allowedProjects];
    this.includeNewProjects = false;
    this.projectDropdownOpen = false;
    this.projectSearch = '';
    this.projectError = false;
    this.modalOpen = true;
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  openEditModal(item: Integration): void {
    this.modalMode = 'edit';
    this.modalIntegration = item;
    this.selectedProjects = [...item.allowedProjects];
    this.includeNewProjects = false;
    this.projectDropdownOpen = false;
    this.projectSearch = '';
    this.projectError = false;
    this.modalOpen = true;
  }

  openForbidModal(item: Integration | null): void {
    if (!item) return;
    this.forbidTarget = item;
    this.forbidModalOpen = true;
    this.modalOpen = false;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalIntegration = null;
    this.projectDropdownOpen = false;
    this.projectError = false;
  }

  onOverlayClick(): void {
    if (this.projectDropdownOpen) { this.projectDropdownOpen = false; return; }
    this.closeModal();
  }

  toggleProjectDropdown(): void {
    this.projectDropdownOpen = !this.projectDropdownOpen;
    this.projectError = false;  // clear error when user interacts
    if (this.projectDropdownOpen) {
      // focus search on next tick
      setTimeout(() => {
        const el = document.querySelector('.search-input') as HTMLInputElement;
        if (el) el.focus();
      }, 50);
    }
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedProjects = [];
    this.projectError = false;
  }

  onSelectAllChange(checked: boolean): void {
    this.selectedProjects = checked ? [...this.projects] : [];
  }

  toggleProject(project: string, event: Event): void {
    event.stopPropagation();
    const idx = this.selectedProjects.indexOf(project);
    if (idx === -1) this.selectedProjects = [...this.selectedProjects, project];
    else this.selectedProjects = this.selectedProjects.filter(p => p !== project);
  }

  toggleAllProjects(event: Event): void {
    event.stopPropagation();
    this.selectedProjects = this.allProjectsSelected ? [] : [...this.projects];
  }

  confirmAllow(): void {
    if (!this.modalIntegration) return;
    // State 3: show error if no project selected
    if (this.selectedProjects.length === 0) {
      this.projectError = true;
      this.projectDropdownOpen = false;
      return;
    }
    const item = this.integrations.find(i => i.id === this.modalIntegration!.id);
    if (item) {
      item.allowed = true;
      item.allowedProjects = [...this.selectedProjects];
    }
    const name = this.modalIntegration.name;
    this.closeModal();
    this.showToast(`${name} integration allowed for ${this.selectedProjects.length} project${this.selectedProjects.length !== 1 ? 's' : ''}`, 'success');
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  confirmForbid(): void {
    if (!this.forbidTarget) return;
    const item = this.integrations.find(i => i.id === this.forbidTarget!.id);
    if (item) { item.allowed = false; item.allowedProjects = []; }
    const name = this.forbidTarget.name;
    this.forbidModalOpen = false;
    this.forbidTarget = null;
    this.showToast(`${name} integration forbidden`, 'error');
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  showToast(message: string, variant: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastVariant = variant;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 5000);
  }

  ngOnInit(): void { this.tracker.trackPageView('ca-settings-integrations'); }
  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
