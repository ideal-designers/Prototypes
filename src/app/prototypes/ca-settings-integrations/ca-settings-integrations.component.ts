import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener, ViewChild } from '@angular/core';
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
  icon: string;
}

const MOCK_PROJECTS = ['Project Alpha', 'Project Beta', 'Gamma Due Diligence', 'Delta M&A', 'Epsilon Fund'];

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Left sidebar 64px ── -->
      <nav class="sidebar">
        <div class="sidebar-top">
          <!-- Logo mark -->
          <div class="logo-mark" title="Corporate Account">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="1" fill="#fff"/><rect x="13" y="2" width="9" height="9" rx="1" fill="#fff" opacity=".5"/><rect x="2" y="13" width="9" height="9" rx="1" fill="#fff" opacity=".5"/><rect x="13" y="13" width="9" height="9" rx="1" fill="#fff" opacity=".5"/></svg>
          </div>
          <!-- Nav items — icon-only -->
          <div class="nav-list">
            <button *ngFor="let item of navItems" class="nav-item" [class.active]="item.active" [title]="item.label" data-track="nav">
              <span class="nav-icon" [innerHTML]="item.icon"></span>
            </button>
          </div>
        </div>
        <div class="sidebar-bottom">
          <!-- Product icon — FVDR brand mark -->
          <div class="product-icon" title="FVDR">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.9)"/>
              <rect x="11" y="1" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.9)"/>
              <rect x="1" y="11" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.9)"/>
              <rect x="11" y="11" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>
          <fvdr-avatar initials="TN" size="md" />
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
        <div class="modal-body" (click)="closeDropdownIfOpen()">

          <!-- Info text — Figma: 16px fw=400 #1f2129 -->
          <p class="modal-info-text">
            <strong>{{ modalIntegration?.name }}</strong> will be allowed to be used in the selected projects by authorized participants.
          </p>

          <!-- Dropdown "Projects" — Figma: 448px wide, label 15px fw=600 -->
          <div class="field" #projectField (click)="$event.stopPropagation()">
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

    /* ── Sidebar — FVDR Design System: 64px, dark bg ── */
    .sidebar {
      width: 64px; min-width: 64px;
      background: #1a1c24;
      display: flex; flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0 20px;
    }
    .sidebar-top { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
    .sidebar-bottom { display: flex; flex-direction: column; align-items: center; gap: 0; }

    .logo-mark {
      width: 40px; height: 40px;
      background: #2c9c74;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      margin-bottom: 8px;
    }
    .nav-list { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; padding: 0 8px; }
    .nav-item {
      width: 48px; height: 48px;
      border-radius: 8px;
      border: none; background: transparent;
      color: rgba(255,255,255,0.4);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item.active {
      background: rgba(44,156,116,0.22);
      color: #2c9c74;
    }
    .nav-item:hover:not(.active) { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); }
    .nav-icon { display: flex; align-items: center; justify-content: center; }

    .product-icon {
      width: 32px; height: 32px;
      border-radius: 6px;
      background: rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; margin-bottom: 12px;
      transition: background 0.15s;
    }
    .product-icon:hover { background: rgba(255,255,255,0.14); }

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

    /* Droplist — same width as trigger, position below trigger, border 1px #dee0eb */
    .droplist {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      width: 100%;
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
  private elRef = inject(ElementRef);

  @ViewChild('projectField') projectFieldRef!: ElementRef;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.projectDropdownOpen) return;
    const field = this.projectFieldRef?.nativeElement as HTMLElement | undefined;
    if (field && !field.contains(event.target as Node)) {
      this.projectDropdownOpen = false;
    }
  }

  tabs: TabItem[] = [
    { id: 'security', label: 'Security' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'contract', label: 'Contract #128182' },
  ];
  activeTab = 'integrations';

  navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".35"/><rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".35"/></svg>` },
    { id: 'projects', label: 'Projects', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>` },
    { id: 'participants', label: 'Participants', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="14" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M16 13c1.5.5 2.5 1.5 2.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
    { id: 'storage', label: 'Data storage', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><ellipse cx="10" cy="5" rx="7" ry="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 5v4c0 1.38 3.134 2.5 7 2.5S17 10.38 17 9V5" stroke="currentColor" stroke-width="1.5"/><path d="M3 9v4c0 1.38 3.134 2.5 7 2.5S17 14.38 17 13V9" stroke="currentColor" stroke-width="1.5"/></svg>` },
    { id: 'billing', label: 'Billing', icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.5"/></svg>` },
    { id: 'settings', label: 'Settings', active: true, icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>` },
  ];

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

  closeDropdownIfOpen(): void {
    if (this.projectDropdownOpen) this.projectDropdownOpen = false;
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
