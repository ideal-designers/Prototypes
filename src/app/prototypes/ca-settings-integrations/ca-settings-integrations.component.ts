import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { DS_COMPONENTS, TabItem } from '../../shared/ds';

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
  icon: string;
  children?: { id: string; label: string; active?: boolean }[];
}

const MOCK_PROJECTS = ['Project Alpha', 'Project Beta', 'Gamma Due Diligence', 'Delta M&A', 'Epsilon Fund'];

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

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
          <svg *ngIf="!sidebarCollapsed" class="account-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
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
                <span class="nav-icon" [innerHTML]="item.icon | safeHtml"></span>
              </span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
              <svg *ngIf="!sidebarCollapsed && item.children" class="nav-chevron" [class.nav-chevron--up]="item.open" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
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
            <!-- angle-double-left (Figma) for collapse; mirrored for expand -->
            <svg *ngIf="!sidebarCollapsed" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.032 11.999a1 1 0 01-.507-.163L3.21 8.444A.931.931 0 013 7.938c0-.19.075-.372.21-.507L6.525 4.115a.78.78 0 011.03.08.78.78 0 01.068 1.036L4.672 7.938l2.951 2.867a.781.781 0 01-.591 1.194z" fill="#5F616A"/>
              <path d="M12.288 12a.78.78 0 01-.478-.24L8.466 8.416A.931.931 0 018.256 7.91c0-.19.075-.372.21-.507L11.81 4.116a.78.78 0 011.072.14.78.78 0 01-.074 1.07L9.899 7.938l2.867 2.867a.781.781 0 01-.478 1.195z" fill="#5F616A"/>
            </svg>
            <svg *ngIf="sidebarCollapsed" width="16" height="16" viewBox="0 0 16 16" fill="none" style="transform:scaleX(-1)">
              <path d="M7.032 11.999a1 1 0 01-.507-.163L3.21 8.444A.931.931 0 013 7.938c0-.19.075-.372.21-.507L6.525 4.115a.78.78 0 011.03.08.78.78 0 01.068 1.036L4.672 7.938l2.951 2.867a.781.781 0 01-.591 1.194z" fill="#5F616A"/>
              <path d="M12.288 12a.78.78 0 01-.478-.24L8.466 8.416A.931.931 0 018.256 7.91c0-.19.075-.372.21-.507L11.81 4.116a.78.78 0 011.072.14.78.78 0 01-.074 1.07L9.899 7.938l2.867 2.867a.781.781 0 01-.478 1.195z" fill="#5F616A"/>
            </svg>
          </button>
        </div>
      </nav>

      <!-- ── Main ── -->
      <div class="main-area">

        <!-- ── Header 64px — Figma: pad 12/24/12/24, border-bottom 1px #dee0eb ── -->
        <header class="page-header">
          <nav class="breadcrumb" aria-label="breadcrumb">
            <button class="bc-item bc-item--link">
              Settings
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#BBBDC8" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
            <button class="bc-item bc-item--current">
              Integrations
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
            <span class="bc-item bc-item--sub">6.1 Patents and trademarks</span>
          </nav>
          <div class="header-right">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <fvdr-avatar initials="TN" size="md" />
          </div>
        </header>

        <!-- ── Content ── -->
        <div class="content-area">

          <fvdr-tabs [tabs]="tabs" [(activeId)]="activeTab" />

          <!-- Banners — Figma: bg #f7f7f7, pad 8/12, gap 8, r=4 -->
          <div class="banners">
            <div class="banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#5F616A" stroke-width="1.2"/><path d="M8 7v4M8 5.5v.5" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
              <span>This applies to new projects only and doesn't affect the ones created before the settings update.</span>
            </div>
            <div class="banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#5F616A" stroke-width="1.2"/><path d="M8 7v4M8 5.5v.5" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
              <span>Only integrations allowed at the corporate account level can be enabled for individual projects.</span>
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
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="7" rx="1" stroke="#2C9C74" stroke-width="1.2"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="#2C9C74" stroke-width="1.2" stroke-linecap="round"/></svg>
                      </span>
                      <span class="feature-badge">
                        Available documents
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="7" rx="1" stroke="#2C9C74" stroke-width="1.2"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="#2C9C74" stroke-width="1.2" stroke-linecap="round"/></svg>
                      </span>
                    </div>
                    <!-- Row 2: Permission-based downloads -->
                    <div class="feature-row">
                      <span class="feature-badge">
                        Permission-based downloads
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="7" rx="1" stroke="#2C9C74" stroke-width="1.2"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="#2C9C74" stroke-width="1.2" stroke-linecap="round"/></svg>
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
                  <fvdr-btn label="Manage" variant="ghost" size="m" [dataTrack]="'manage-' + item.id" (clicked)="openModal(item)" />
                  <div class="allowed-info">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#2C9C74" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>{{ item.allowedProjects.length }} project{{ item.allowedProjects.length !== 1 ? 's' : '' }}</span>
                  </div>
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
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- Header — Figma: h=72, pad 24, border-bottom #dee0eb -->
        <div class="modal-header">
          <span class="modal-title">Allow integration</span>
          <button class="modal-close" (click)="closeModal()" data-track="modal-close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
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
            <div
              class="dropdown-trigger"
              [class.dropdown-trigger--error]="projectError"
              [class.dropdown-trigger--open]="projectDropdownOpen"
              (click)="toggleProjectDropdown()"
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
                <!-- Chevron — Figma: chevron-down 10×5.6, #5f616a -->
                <svg class="trigger-chevron" [class.rotated]="projectDropdownOpen" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>

            <!-- Hint — normal or error -->
            <span *ngIf="!projectError" class="field-hint">Selected projects will have access to integration</span>
            <span *ngIf="projectError" class="field-hint field-hint--error">Fill in to continue</span>

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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#9C9EA8" stroke-width="1.2"/><path d="M10.5 10.5l2.5 2.5" stroke="#9C9EA8" stroke-width="1.2" stroke-linecap="round"/></svg>
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;margin-top:2px"><circle cx="8" cy="8" r="7" stroke="#5F616A" stroke-width="1.2"/><path d="M8 7v4M8 5.5v.5" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
            <span>Project administrators can later manage integrations in the project settings. <a href="#" class="modal-link" (click)="$event.preventDefault()">Learn more</a></span>
          </div>

        </div>

        <!-- Footer — Figma: h=88, pad 24, border-top #dee0eb -->
        <!-- Left: Forbid (trash + red text) | Right: Cancel + Confirm -->
        <div class="modal-footer">
          <button *ngIf="modalIntegration?.allowed" class="btn-forbid" (click)="forbidIntegration()" data-track="modal-forbid">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="#ED7C6E" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Forbid integration</span>
          </button>
          <div class="modal-footer-right">
            <!-- Cancel — Figma: bg #fff, border 1px #bbbdc8, pad 16, r=4, text "Cancel" #40424b 15px -->
            <button class="btn-cancel" (click)="closeModal()" data-track="modal-cancel">Cancel</button>
            <!-- Confirm — Figma: bg #2c9c74, pad 16, r=4, text "Confirm" #fff 15px -->
            <button
              class="btn-confirm"
              [class.btn-confirm--disabled]="selectedProjects.length === 0"
              (click)="confirmAllow()"
              data-track="modal-confirm"
            >Confirm</button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Toast notification ── -->
    <div class="toast" [class.toast--visible]="toastVisible">
      <div class="toast-bar"></div>
      <div class="toast-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#2C9C74" stroke-width="1.5"/><path d="M6 10l3 3 5-6" stroke="#2C9C74" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-family); display: block; }

    /* ── Layout ── */
    .page-layout { display: flex; height: 100vh; background: #f7f7f7; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px; min-width: 280px;
      background: #f7f7f7;
      border-right: 1px solid #dee0eb;
      display: flex; flex-direction: column;
      overflow: hidden;
      transition: width 0.22s ease, min-width 0.22s ease;
      flex-shrink: 0;
    }
    .sidebar--collapsed { width: 72px; min-width: 72px; }

    /* Account switcher — Figma: 64px h, pad L=16 R=16 T=12 B=12, itemSpacing=10 */
    .account-switcher {
      height: 64px; min-height: 64px;
      background: #f7f7f7;
      border-bottom: 1px solid #dee0eb;
      display: flex; align-items: center;
      padding: 0 16px;
      gap: 10px;
      cursor: pointer;
      overflow: hidden;
    }
    .account-switcher:hover { background: #efefef; }
    .account-logo {
      width: 40px; height: 40px; min-width: 40px;
      border-radius: 4px;
      flex-shrink: 0;
      display: flex;
    }
    .account-name { font-size: 16px; font-weight: 600; color: #1f2129; flex: 1; white-space: nowrap; overflow: hidden; }
    .account-chevron { flex-shrink: 0; }

    /* Nav list */
    .nav-list { display: flex; flex-direction: column; flex: 1; background: #f7f7f7; overflow-y: auto; padding: 24px 0 8px; gap: 24px; }

    /* Nav item — Figma: 280×32 (or 72×32 collapsed) */
    .nav-item {
      width: 100%;
      height: 32px; min-height: 32px;
      border: none; background: transparent;
      color: #40424b;
      cursor: pointer;
      display: flex; align-items: center;
      font-size: 16px; font-weight: 400;
      font-family: var(--font-family);
      text-align: left;
      transition: background 0.12s;
      white-space: nowrap;
      overflow: hidden;
    }
    .nav-item:hover { background: #ebebeb; }
    .nav-item:hover .nav-icon { color: #40424b; }
    .nav-item--active, .nav-item--open { color: #1f2129; font-weight: 600; }
    .nav-item--active { background: #f0faf5; }
    .nav-item--active:hover { background: #e4f5ed; }

    /* Icon zone — always 72px wide */
    .nav-icon-zone {
      width: 72px; min-width: 72px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .nav-icon { display: flex; align-items: center; justify-content: center; color: #5f616a; }
    .nav-item--active .nav-icon, .nav-item--open .nav-icon { color: #2c9c74; }

    .nav-label { flex: 1; }
    .nav-chevron { flex-shrink: 0; margin-right: 16px; transition: transform 0.2s; }
    .nav-chevron--up { transform: rotate(180deg); }

    /* Sub-items */
    .nav-subitems { display: flex; flex-direction: column; background: #f7f7f7; }
    .nav-subitem {
      height: 32px;
      padding: 0 16px 0 72px;
      border: none; background: transparent; cursor: pointer;
      font-size: 14px; font-weight: 400; color: #1f2129;
      font-family: var(--font-family);
      text-align: left;
      white-space: nowrap;
      transition: background 0.12s;
    }
    .nav-subitem:hover { background: #ebebeb; }
    .nav-subitem--active { font-weight: 600; color: #2c9c74; background: #ebf8ef; }
    .nav-subitem--active:hover { background: #dff4e8; }

    /* Bottom logo + collapse — Figma: 72px h, pad L=24 R=16 */
    .sidebar-bottom {
      height: 72px; min-height: 72px;
      background: #f7f7f7;
      border-top: 1px solid #dee0eb;
      display: flex; align-items: center;
      padding: 0 16px 0 24px;
      justify-content: space-between;
      overflow: hidden;
    }
    .sidebar-logo { display: flex; align-items: center; overflow: hidden; }
    .collapse-btn {
      width: 32px; height: 32px; min-width: 32px;
      border: none; background: transparent; cursor: pointer;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s;
      margin-left: auto;
    }
    .collapse-btn:hover { background: #e8e8e8; }

    /* ── Main ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Header — Figma: h=64, pad 12/24/12/24, border-bottom 1px #dee0eb ── */
    .page-header {
      height: 64px; min-height: 64px;
      padding: 12px 24px;
      border-bottom: 1px solid #dee0eb;
      background: #ffffff;
      display: flex; align-items: center; justify-content: space-between;
    }
    /* Breadcrumb — Figma: gap 0 between items, each item has internal pad 8/8 */
    .breadcrumb { display: flex; align-items: center; gap: 0; }
    .bc-item {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 8px;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family);
      font-size: 15px; line-height: 20px;
    }
    .bc-item--link { font-weight: 600; color: #5f616a; }
    .bc-item--link:hover { color: #2c9c74; }
    .bc-item--current { font-weight: 600; color: #1f2129; }
    .bc-item--sub { font-size: 14px; font-weight: 400; color: #9c9ea8; cursor: default; }
    .header-right { display: flex; align-items: center; gap: 24px; }

    /* ── Content area — Figma: Midgard pad 24/24/24/24 ── */
    .content-area { flex: 1; overflow-y: auto; padding: 24px; background: #ffffff; }

    /* ── Banners — Figma: Inline bg #f7f7f7, pad 8/12, gap 8, r=4 ── */
    .banners { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 24px; }
    .banner {
      display: flex; align-items: flex-start; gap: 8px;
      background: #f7f7f7;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 15px; color: #1f2129; line-height: 24px;
    }
    .banner svg { flex-shrink: 0; margin-top: 4px; }

    /* ── Cards Grid — Figma: 3 cols, gap 24px ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 740px)  { .cards-grid { grid-template-columns: 1fr; } }

    /* ── Integration Card — Figma: bg #fff, border 1px #dee0eb, r=4, pad 24/0, gap 24, VERTICAL ── */
    .int-card {
      border: 1px solid #dee0eb;
      border-radius: 4px;
      background: #ffffff;
      display: flex; flex-direction: column;
      gap: 24px;
      padding: 24px 0;
      transition: border-color 0.15s;
    }
    .int-card:hover { border-color: #2c9c74; }
    .int-card--allowed { border-color: #2c9c74; }

    /* Card body — Figma: Frame 1000006716, pad 0/24, gap 12 VERTICAL */
    .int-card__body { padding: 0 24px; display: flex; flex-direction: column; gap: 12px; }

    /* Head row — Figma: gap 12 HORIZONTAL */
    .int-card__head-row { display: flex; align-items: flex-start; gap: 12px; }

    /* Logo — Figma: 40×40, border 1px #dee0eb, r=4, bg #ffffff */
    .int-logo {
      width: 40px; height: 40px; min-width: 40px;
      border: 1px solid #dee0eb;
      border-radius: 4px;
      background: #ffffff;
      display: flex; align-items: center; justify-content: center;
    }
    .int-logo-initial { font-size: 16px; font-weight: 700; line-height: 1; }

    /* Meta */
    .int-meta { display: flex; flex-direction: column; gap: 0; }
    .int-name { font-size: 16px; font-weight: 600; color: #1f2129; line-height: 24px; }
    .int-domain { font-size: 12px; font-weight: 400; color: #5f616a; line-height: 16px; }

    /* Desc block — Figma: Frame 1000006709, gap 16 VERTICAL */
    .int-card__desc-block { display: flex; flex-direction: column; gap: 16px; }
    .int-desc { font-size: 14px; font-weight: 400; color: #1f2129; line-height: 20px; margin: 0; }

    /* Feature order — Figma: "Order", VERTICAL gap 8 */
    .feature-order { display: flex; flex-direction: column; gap: 8px; }
    /* Feature row — HORIZONTAL gap 8 */
    .feature-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    /* Badge — Figma: "Badge Locked", bg #ebf4fd, pad 0/8, r=4, h=20, fs=12 #1f2129, icon 14×14 #2c9c74 */
    .feature-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: #ebf4fd;
      border-radius: 4px;
      padding: 0 8px;
      height: 20px;
      font-size: 12px; font-weight: 400; color: #1f2129;
      white-space: nowrap;
    }
    .feature-badge svg { flex-shrink: 0; }

    /* Card footer — Figma: Frame 37573, pad 0/24, gap 16 HORIZONTAL */
    .int-card__footer {
      padding: 0 24px;
      display: flex; align-items: center; gap: 16px;
    }
    .allowed-info {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 400; color: #2c9c74;
    }

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
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: flex; flex-direction: column;
      animation: slideUp 0.18s ease;
      max-height: 90vh;
      overflow: visible; /* allow droplist to overflow */
    }
    @keyframes slideUp { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Header — Figma: h=72, pad 24/24, border-bottom 1px #dee0eb */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      height: 72px; min-height: 72px;
      border-bottom: 1px solid #dee0eb;
      flex-shrink: 0;
    }
    .modal-title { font-size: 16px; font-weight: 600; color: #1f2129; }
    .modal-close {
      width: 24px; height: 24px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 4px; color: #5f616a;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #f7f7f7; }

    /* Body — Figma: Frame 576, pad right=24 bottom=8 left=24, gap=16 */
    .modal-body {
      padding: 16px 24px 8px 24px;
      display: flex; flex-direction: column; gap: 16px;
      overflow-y: visible;
      flex-shrink: 0;
    }

    /* Info text — Figma: 16px fw=400 #1f2129 */
    .modal-info-text { margin: 0; font-size: 16px; line-height: 24px; color: #1f2129; }

    /* Field wrapper */
    .field { display: flex; flex-direction: column; gap: 4px; position: relative; }
    .field-label { font-size: 15px; font-weight: 600; color: #1f2129; line-height: 20px; }
    .field-hint { font-size: 12px; color: #5f616a; line-height: 16px; }
    .field-hint--error { color: #e54430; }

    /* Dropdown trigger — Figma: h=40, border 1px #bbbdc8, r=4, pad 8/16, gap=8 */
    .dropdown-trigger {
      height: 40px; padding: 8px 16px;
      border: 1px solid #bbbdc8;
      border-radius: 4px;
      background: #ffffff;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; gap: 8px;
      transition: border-color 0.15s;
      font-size: 15px; font-family: var(--font-family);
    }
    .dropdown-trigger:hover:not(.dropdown-trigger--error) { border-color: #2c9c74; }
    .dropdown-trigger--open { border-color: #2c9c74; }
    .dropdown-trigger--error { border-color: #ed7c6e !important; }
    .trigger-placeholder { color: #9c9ea8; flex: 1; }
    .trigger-value { color: #1f2129; flex: 1; }
    .trigger-icons { display: flex; align-items: center; gap: 8px; }
    .trigger-clear {
      width: 16px; height: 16px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 2px;
      color: #5f616a;
    }
    .trigger-clear:hover { background: #f0f0f0; }
    .trigger-chevron { flex-shrink: 0; transition: transform 0.2s; }
    .trigger-chevron.rotated { transform: rotate(180deg); }

    /* Droplist — Figma: 447×232, position below trigger, border 1px #dee0eb */
    .droplist {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      width: 447px;
      background: #ffffff;
      border: 1px solid #dee0eb;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 100;
      overflow: hidden;
    }

    /* Search area — Figma: bg #fbfbfb, border-bottom 1px #dee0eb, pad 16, gap 16, h=72 */
    .droplist-search {
      display: flex; align-items: center; gap: 16px;
      padding: 16px;
      background: #fbfbfb;
      border-bottom: 1px solid #dee0eb;
      height: 72px;
    }
    .search-field {
      flex: 1;
      display: flex; align-items: center; gap: 8px;
      height: 40px; padding: 8px 16px;
      border: 1px solid #bbbdc8;
      border-radius: 4px;
      background: #ffffff;
    }
    .search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 15px; color: #1f2129; font-family: var(--font-family);
    }
    .search-input::placeholder { color: #9c9ea8; }

    /* List items */
    .droplist-body { max-height: 200px; overflow-y: auto; }

    /* Select all row — Figma: pad 8/16, border-bottom 1px #dee0eb */
    .tree-item {
      display: flex; align-items: center; gap: 16px;
      height: 40px; cursor: pointer;
      transition: background 0.1s;
    }
    .tree-item--select-all {
      padding: 8px 16px;
      border-bottom: 1px solid #dee0eb;
    }
    .tree-item--select-all:hover { background: #f7f7f7; }

    /* Project rows — Figma: pad 8/32 (indented), bg #ebf8ef when selected */
    .tree-item--project { padding: 8px 32px; }
    .tree-item--project:hover { background: #f7f7f7; }
    .tree-item--selected { background: #ebf8ef; }
    .tree-item--selected:hover { background: #dff4e8; }

    .tree-label { font-size: 14px; color: #1f2129; }
    .tree-empty { padding: 16px; font-size: 14px; color: #9c9ea8; text-align: center; }

    /* Checkbox row inside modal body */
    .modal-checkbox-row { display: flex; align-items: center; gap: 12px; padding: 8px 0 8px 0; }
    .modal-checkbox-label { font-size: 15px; color: #1f2129; line-height: 24px; }

    /* Info banner — Figma: bg #f7f7f7, pad 8/12, r=4, gap=8 */
    .modal-banner {
      display: flex; align-items: flex-start; gap: 8px;
      background: #f7f7f7; border-radius: 4px;
      padding: 8px 12px;
      font-size: 15px; color: #1f2129; line-height: 24px;
    }
    .modal-link { color: #2c9c74; text-decoration: none; }
    .modal-link:hover { text-decoration: underline; }

    /* Footer — Figma: h=88, pad 24, border-top #dee0eb, HORIZONTAL space-between */
    .modal-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px;
      border-top: 1px solid #dee0eb;
      min-height: 88px;
      flex-shrink: 0;
    }
    .modal-footer-right { display: flex; align-items: center; gap: 16px; margin-left: auto; }

    /* Forbid button — Figma: trash icon #ed7c6e + text "Delete report" #e54430, 16px */
    .btn-forbid {
      display: flex; align-items: center; gap: 8px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      font-size: 16px; color: #e54430; font-family: var(--font-family);
    }
    .btn-forbid:hover { opacity: 0.8; }

    /* Cancel — Figma: bg #fff, border 1px #bbbdc8, pad 16, r=4, text "Cancel" #40424b 15px */
    .btn-cancel {
      height: 40px; padding: 0 16px;
      border: 1px solid #bbbdc8; border-radius: 4px;
      background: #ffffff; cursor: pointer;
      font-size: 15px; color: #40424b; font-family: var(--font-family);
      transition: border-color 0.15s;
    }
    .btn-cancel:hover { border-color: #5f616a; }

    /* Confirm — Figma: bg #2c9c74, pad 16, r=4, text "Confirm" #fff 15px */
    .btn-confirm {
      height: 40px; padding: 0 16px;
      border: none; border-radius: 4px;
      background: #2c9c74; cursor: pointer;
      font-size: 15px; color: #ffffff; font-family: var(--font-family);
      transition: background 0.15s;
    }
    .btn-confirm:hover:not(.btn-confirm--disabled) { background: #268a65; }
    .btn-confirm--disabled { background: #bbbdc8; cursor: not-allowed; }

    /* ── Toast — Figma: 400×56, bg #fbfbfb, left bar 4px #2c9c74 ── */
    .toast {
      position: fixed; bottom: 24px;
      left: 50%; transform: translateX(-50%) translateY(80px);
      width: 400px; height: 56px;
      background: #fbfbfb;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      display: flex; align-items: center;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
      opacity: 0; z-index: 2000; pointer-events: none;
    }
    .toast--visible { transform: translateX(-50%) translateY(0); opacity: 1; }
    .toast-bar { width: 4px; height: 100%; background: #2c9c74; flex-shrink: 0; }
    .toast-content {
      display: flex; align-items: center; gap: 12px;
      padding: 0 16px;
      font-size: 14px; color: #1f2129;
    }
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

  navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 5V7H15V5H19ZM9 5V11H5V5H9ZM19 13V19H15V13H19ZM9 17V19H5V17H9ZM21 3H13V9H21V3ZM11 3H3V13H11V3ZM21 11H13V21H21V11ZM11 15H3V21H11V15Z" fill="currentColor"/></svg>` },
    {
      id: 'projects', label: 'Projects', open: true,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 3H14.4281L16.0281 5.16667H22V16H6V3ZM8 5V14H20V7H15.1719L13.5719 5H8Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4 7H2V18V20H4L19 20V18L4 18V7Z" fill="currentColor" opacity="0.4"/></svg>`,
      children: [{ id: 'list', label: 'List' }, { id: 'template', label: 'Template' }, { id: 'attributes', label: 'Attributes', active: true }],
    },
    { id: 'participants', label: 'Participants', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 16C20.2091 16 22 17.7909 22 20V23H20V20C20 18.8954 19.1046 18 18 18H16C14.8954 18 14 18.8954 14 20V23H12V20C12 17.7909 13.7909 16 16 16H18ZM8 10C10.2091 10 12 11.7909 12 14V17H10V14C10 12.8954 9.10457 12 8 12H6C4.89543 12 4 12.8954 4 14V17H2V14C2 11.7909 3.79086 10 6 10H8ZM17 7C19.2091 7 21 8.79086 21 11C21 13.2091 19.2091 15 17 15C14.7909 15 13 13.2091 13 11C13 8.79086 14.7909 7 17 7ZM17 9C15.8954 9 15 9.89543 15 11C15 12.1046 15.8954 13 17 13C18.1046 13 19 12.1046 19 11C19 9.89543 18.1046 9 17 9ZM7 1C9.20914 1 11 2.79086 11 5C11 7.20914 9.20914 9 7 9C4.79086 9 3 7.20914 3 5C3 2.79086 4.79086 1 7 1ZM7 3C5.89543 3 5 3.89543 5 5C5 6.10457 5.89543 7 7 7C8.10457 7 9 6.10457 9 5C9 3.89543 8.10457 3 7 3Z" fill="currentColor"/></svg>` },
    { id: 'storage', label: 'Usage trends', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 3H21V23H3V3H7V1H17V3ZM5 5V21H19V5H17V7H7V5H5ZM9 5H15V3H9V5Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9 9V19H7V9H9ZM17 11V19H15V11H17ZM13 13V19H11V13H13Z" fill="currentColor"/></svg>` },
    { id: 'billing', label: 'Subscription', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.5 20H2.5V22H21.5V20ZM12 4.26L17.21 7H6.79L12 4.26ZM12 2L2.5 7V9H21.5V7L12 2Z" fill="currentColor"/><path d="M5 11H7V18H5V11Z" fill="currentColor"/><path d="M11 11H13V18H11V11Z" fill="currentColor"/><path d="M17 11H19V18H17V11Z" fill="currentColor"/></svg>` },
    {
      id: 'settings', label: 'Settings',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 17H7V19H5V22H3V19H1V17H3V2H5V17ZM13 5H15V7H13V22H11V7H9V5H11V2H13V5ZM21 10H23V12H21V22H19V12H17V10H19V2H21V10Z" fill="currentColor"/></svg>`,
    },
    { id: 'apikeys', label: 'API keys', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19.287 9.50875C19.0941 10.3272 18.6557 11.0671 18.0305 11.6294C17.4053 12.1917 16.6232 12.5495 15.7889 12.6548V19.5933C15.7887 20.1813 15.6001 20.7538 15.2507 21.2267C14.9012 21.6997 14.8082 22.0481 13.8474 22.221L10.8223 22.9072C10.5096 23.0036 10.1786 23.0253 9.85596 22.9704C9.53334 22.9156 9.2281 22.7857 8.96484 22.5914C8.70157 22.397 8.48762 22.1435 8.34022 21.8513C8.19282 21.5592 8.11609 21.2365 8.1162 20.9092V12.6562C7.28161 12.5507 6.49924 12.1925 5.874 11.6296C5.24876 11.0668 4.81054 10.3263 4.61809 9.50738L3.80957 6.06978C3.66713 5.4643 3.66346 4.83446 3.79883 4.22736C3.93419 3.62027 4.2051 3.05165 4.59127 2.56404C4.97744 2.07643 5.46888 1.68247 6.02881 1.41162C6.58875 1.14077 7.20269 1.00006 7.82469 1H16.0804C17.1012 1.00006 17.3164 1.14077 17.8763 1.41162C18.4362 1.68247 18.9277 2.07643 19.3139 2.56404C19.7 3.05165 19.9709 3.62027 20.1063 4.22736C20.2417 4.83446 20.238 5.4643 20.0956 6.06978L19.287 9.50875Z" fill="currentColor"/><path d="M9.2028 6.12512C9.2028 5.57284 9.65052 5.12512 10.2028 5.12512H13.703C14.2552 5.12512 14.703 5.57284 14.703 6.12512V6.18768C14.703 6.73997 14.2552 7.18768 13.703 7.18768H10.2028C9.65052 7.18768 9.2028 6.73997 9.2028 6.18768V6.12512Z" fill="currentColor"/></svg>` },
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
  modalIntegration: Integration | null = null;
  selectedProjects: string[] = [];
  includeNewProjects = false;
  projectDropdownOpen = false;
  projectSearch = '';
  projectError = false;        // State 3: error border + "Fill in to continue"
  projects = MOCK_PROJECTS;

  // Toast state
  toastVisible = false;
  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  get filteredProjects(): string[] {
    return this.projects.filter(p => p.toLowerCase().includes(this.projectSearch.toLowerCase()));
  }
  get allProjectsSelected(): boolean { return this.selectedProjects.length === this.projects.length; }
  get someProjectsSelected(): boolean { return this.selectedProjects.length > 0 && this.selectedProjects.length < this.projects.length; }

  openModal(item: Integration): void {
    this.modalIntegration = item;
    this.selectedProjects = [...item.allowedProjects];
    this.includeNewProjects = false;
    this.projectDropdownOpen = false;
    this.projectSearch = '';
    this.projectError = false;
    this.modalOpen = true;
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
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
    this.showToast(`${name} integration allowed for ${this.selectedProjects.length} project${this.selectedProjects.length !== 1 ? 's' : ''}`);
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  forbidIntegration(): void {
    if (!this.modalIntegration) return;
    const item = this.integrations.find(i => i.id === this.modalIntegration!.id);
    if (item) { item.allowed = false; item.allowedProjects = []; }
    const name = this.modalIntegration.name;
    this.closeModal();
    this.showToast(`${name} integration forbidden`);
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3500);
  }

  ngOnInit(): void { this.tracker.trackPageView('ca-settings-integrations'); }
  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
