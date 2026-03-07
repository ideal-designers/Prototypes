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
  icon: string;
}

const MOCK_PROJECTS = ['Project Alpha', 'Project Beta', 'Gamma Due Diligence', 'Delta M&A', 'Epsilon Fund'];

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Left sidebar 72px ── -->
      <nav class="sidebar">
        <div class="sidebar-top">
          <!-- Logo mark -->
          <div class="logo-mark" title="Corporate Account">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="1" fill="#fff"/><rect x="13" y="2" width="9" height="9" rx="1" fill="#fff" opacity=".5"/><rect x="2" y="13" width="9" height="9" rx="1" fill="#fff" opacity=".5"/><rect x="13" y="13" width="9" height="9" rx="1" fill="#fff" opacity=".5"/></svg>
          </div>
          <!-- Nav items — icon-only, 72px collapsed -->
          <div class="nav-list">
            <button *ngFor="let item of navItems" class="nav-item" [class.active]="item.active" [title]="item.label" data-track="nav">
              <span class="nav-icon" [innerHTML]="item.icon"></span>
            </button>
          </div>
        </div>
        <div class="sidebar-bottom">
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
         Figma: 512×433px, bg overlay #000000 60%
    ══════════════════════════════════════════ -->
    <div *ngIf="modalOpen" class="modal-overlay" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- Modal header -->
        <div class="modal-header">
          <span class="modal-title">Allow integration</span>
          <button class="modal-close" (click)="closeModal()" data-track="modal-close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Modal body -->
        <div class="modal-body">
          <!-- Info text -->
          <p class="modal-info-text">
            <strong>{{ modalIntegration?.name }}</strong> will be allowed to be used in the selected projects by authorized users
          </p>

          <!-- Project selector -->
          <div class="field">
            <label class="field-label">Select projects</label>
            <div class="project-selector" (click)="toggleProjectDropdown()">
              <span class="selector-value" [class.placeholder]="selectedProjects.length === 0">
                {{ selectedProjects.length > 0 ? selectedProjects.length + ' selected' : 'Select' }}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" [class.rotated]="projectDropdownOpen">
                <path d="M4 6l4 4 4-4" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="field-hint">Selected projects will have access to integration</span>

            <!-- Dropdown -->
            <div *ngIf="projectDropdownOpen" class="project-dropdown">
              <div class="dropdown-search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#9C9EA8" stroke-width="1.2"/><path d="M10.5 10.5l2.5 2.5" stroke="#9C9EA8" stroke-width="1.2" stroke-linecap="round"/></svg>
                <input [(ngModel)]="projectSearch" placeholder="Search" class="dropdown-search-input" (click)="$event.stopPropagation()" />
              </div>
              <div class="dropdown-option select-all" (click)="toggleAllProjects($event)">
                <fvdr-checkbox [checked]="allProjectsSelected" [indeterminate]="someProjectsSelected" />
                <span class="option-label">Select all</span>
              </div>
              <div class="dropdown-group">
                <span class="group-label">Label</span>
                <div
                  *ngFor="let project of filteredProjects"
                  class="dropdown-option"
                  (click)="toggleProject(project, $event)"
                >
                  <fvdr-checkbox [checked]="selectedProjects.includes(project)" />
                  <span class="option-label">{{ project }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Checkbox -->
          <div class="modal-checkbox-row">
            <fvdr-checkbox
              label="Apply to project template for newly created projects"
              [(checked)]="applyToTemplate"
            />
          </div>

          <!-- Note -->
          <p class="modal-note">
            Project administrators can later manage integrations in the project settings.
            <a href="#" class="link" data-track="learn-more" (click)="$event.preventDefault()">Learn more</a>
          </p>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <fvdr-btn label="Cancel" variant="ghost" size="m" (clicked)="closeModal()" data-track="modal-cancel" />
          <fvdr-btn
            label="Confirm"
            variant="primary"
            size="m"
            [disabled]="selectedProjects.length === 0"
            (clicked)="confirmAllow()"
            data-track="modal-confirm"
          />
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

    /* ── Sidebar — Figma: 72px, bg #f7f7f7, border-right 1px #dee0eb ── */
    .sidebar {
      width: 72px; min-width: 72px;
      background: #f7f7f7;
      border-right: 1px solid #dee0eb;
      display: flex; flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
    }
    .sidebar-top { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
    .sidebar-bottom { padding-bottom: 8px; }

    .logo-mark {
      width: 40px; height: 40px;
      background: #2c9c74;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
    }
    .nav-list { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; padding: 0 12px; }
    .nav-item {
      width: 48px; height: 48px;
      border-radius: 4px;
      border: none; background: transparent;
      color: #5f616a;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item.active { background: #ebf8ef; color: #2c9c74; }
    .nav-item:hover:not(.active) { background: #eeeeee; color: #1f2129; }
    .nav-icon { display: flex; align-items: center; justify-content: center; }

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
       MODAL — Figma: 512px wide, r=4
    ══════════════════════════════════════════ */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      width: 512px;
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.16);
      display: flex; flex-direction: column;
      animation: slideUp 0.2s ease;
      max-height: 90vh;
      overflow: hidden;
    }
    @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Modal header — Figma: h=72, pad 0/24, border-bottom 1px #dee0eb */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      height: 72px; min-height: 72px;
      border-bottom: 1px solid #dee0eb;
    }
    .modal-title { font-size: 16px; font-weight: 600; color: #1f2129; }
    .modal-close {
      width: 32px; height: 32px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 4px;
      color: #5f616a;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #f7f7f7; }

    /* Modal body — pad 24, gap 20 */
    .modal-body {
      padding: 24px;
      display: flex; flex-direction: column; gap: 20px;
      overflow-y: auto;
    }
    .modal-info-text { margin: 0; font-size: 16px; line-height: 24px; color: #1f2129; }

    /* Field */
    .field { display: flex; flex-direction: column; gap: 4px; position: relative; }
    .field-label { font-size: 15px; font-weight: 600; color: #1f2129; }
    .field-hint { font-size: 12px; color: #5f616a; }

    /* Project selector */
    .project-selector {
      height: 40px; padding: 0 12px;
      border: 1px solid #dee0eb;
      border-radius: 4px;
      background: #ffffff;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; transition: border-color 0.15s;
      font-size: 15px; font-family: var(--font-family);
    }
    .project-selector:hover { border-color: #2c9c74; }
    .selector-value { color: #1f2129; }
    .selector-value.placeholder { color: #9c9ea8; }
    .project-selector svg { flex-shrink: 0; transition: transform 0.2s; }
    .project-selector svg.rotated { transform: rotate(180deg); }

    /* Dropdown */
    .project-dropdown {
      position: absolute; top: calc(100% + 2px); left: 0; right: 0;
      background: #ffffff;
      border: 1px solid #dee0eb;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 10; max-height: 240px; overflow-y: auto;
    }
    .dropdown-search {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid #dee0eb;
    }
    .dropdown-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; color: #1f2129; font-family: var(--font-family);
    }
    .dropdown-option {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; cursor: pointer; font-size: 14px;
      transition: background 0.1s;
    }
    .dropdown-option:hover { background: #f7f7f7; }
    .select-all { border-bottom: 1px solid #dee0eb; }
    .dropdown-group { padding: 8px 0; }
    .group-label {
      padding: 4px 12px;
      font-size: 12px; font-weight: 600; color: #5f616a;
      text-transform: uppercase; letter-spacing: 0.5px; display: block;
    }
    .option-label { font-size: 14px; color: #1f2129; }

    .modal-checkbox-row { display: flex; align-items: flex-start; }
    .modal-note { margin: 0; font-size: 14px; color: #5f616a; line-height: 20px; }
    .link { color: #2c9c74; text-decoration: none; }
    .link:hover { text-decoration: underline; }

    /* Modal footer — Figma: h=88, pad 20/24, border-top 1px #dee0eb */
    .modal-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: 12px;
      padding: 24px;
      border-top: 1px solid #dee0eb;
      min-height: 88px;
    }

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
  applyToTemplate = false;
  projectDropdownOpen = false;
  projectSearch = '';
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
    this.applyToTemplate = false;
    this.projectDropdownOpen = false;
    this.projectSearch = '';
    this.modalOpen = true;
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalIntegration = null;
    this.projectDropdownOpen = false;
  }

  toggleProjectDropdown(): void { this.projectDropdownOpen = !this.projectDropdownOpen; }

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
    if (!this.modalIntegration || this.selectedProjects.length === 0) return;
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
