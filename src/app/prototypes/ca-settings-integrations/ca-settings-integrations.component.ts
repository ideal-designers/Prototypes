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
          <!-- Logo -->
          <div class="logo-mark" title="Corporate Account">CA</div>
          <!-- Nav items -->
          <div class="nav-list">
            <button
              *ngFor="let item of navItems"
              class="nav-item"
              [class.active]="item.active"
              [title]="item.label"
              data-track="nav"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
            </button>
          </div>
        </div>
        <!-- User avatar bottom -->
        <div class="sidebar-bottom">
          <fvdr-avatar initials="TN" size="md" />
        </div>
      </nav>

      <!-- ── Main ── -->
      <div class="main-area">

        <!-- ── Header 64px ── -->
        <header class="page-header">
          <nav class="breadcrumb" aria-label="breadcrumb">
            <span class="bc-root">Project Alpha</span>
            <span class="bc-sep">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#BBBDC8" stroke-width="1.5" stroke-linecap="round"/></svg>
            </span>
            <span class="bc-current">Settings</span>
          </nav>
          <div class="header-right">
            <fvdr-avatar initials="PA" size="md" data-track="header-avatar" />
          </div>
        </header>

        <!-- ── Content ── -->
        <div class="content-area">

          <!-- DS: fvdr-tabs -->
          <fvdr-tabs [tabs]="tabs" [(activeId)]="activeTab" />

          <!-- Banners -->
          <div class="banners">
            <fvdr-info-banner
              message="Only integrations allowed at the corporate account level can be enabled for individual projects."
            />
            <fvdr-info-banner
              message="This applies to new projects only and doesn't affect the ones created before the settings update."
            />
          </div>

          <!-- ── Integration cards 3-col grid ── -->
          <div class="cards-grid">
            <div
              *ngFor="let item of integrations"
              class="int-card"
              [class.int-card--allowed]="item.allowed"
            >
              <!-- Card header -->
              <div class="int-card__header">
                <div class="int-logo" [style.background]="item.logoColor + '18'" [style.color]="item.logoColor">
                  {{ item.logoInitial }}
                </div>
                <div class="int-meta">
                  <span class="int-name">{{ item.name }}</span>
                  <span class="int-domain">{{ item.domain }}</span>
                </div>
                <!-- Allowed badge -->
                <fvdr-badge *ngIf="item.allowed" label="Allowed" variant="success" />
              </div>

              <p class="int-desc">{{ item.description }}</p>

              <!-- Features -->
              <div class="feature-list">
                <fvdr-checkbox label="Enabled projects"           [checked]="item.features.enabledProjects"      [disabled]="true" />
                <fvdr-checkbox label="Available documents"        [checked]="item.features.availableDocuments"   [disabled]="true" />
                <fvdr-checkbox label="Permission-based downloads" [checked]="item.features.permissionDownloads"  [disabled]="true" />
              </div>

              <!-- Actions -->
              <div class="int-card__footer">
                <ng-container *ngIf="!item.allowed">
                  <fvdr-btn
                    label="Allow"
                    variant="primary"
                    size="m"
                    style="width:100%"
                    [dataTrack]="'allow-' + item.id"
                    (clicked)="openModal(item)"
                  />
                </ng-container>
                <ng-container *ngIf="item.allowed">
                  <div class="allowed-row">
                    <div class="allowed-projects">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#2C9C74" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      <span>{{ item.allowedProjects.length }} project{{ item.allowedProjects.length !== 1 ? 's' : '' }}</span>
                    </div>
                    <fvdr-btn label="Manage" variant="ghost" size="s" [dataTrack]="'manage-' + item.id" (clicked)="openModal(item)" />
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
    .page-layout { display: flex; height: 100vh; background: var(--color-stone-0); overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: 72px; min-width: 72px;
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      display: flex; flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) 0 var(--space-4);
    }
    .sidebar-top { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); width: 100%; }
    .sidebar-bottom { padding-bottom: var(--space-2); }

    .logo-mark {
      width: 40px; height: 40px;
      background: var(--color-primary-500);
      color: #fff;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
      cursor: pointer;
    }
    .nav-list { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); width: 100%; padding: 0 var(--space-2); }
    .nav-item {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      border: none; background: transparent;
      color: var(--color-stone-700);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item.active { background: var(--color-primary-50); color: var(--color-primary-500); }
    .nav-item:hover:not(.active) { background: var(--color-stone-300); color: var(--color-text-primary); }
    .nav-icon { display: flex; align-items: center; justify-content: center; }
    .nav-icon ::ng-deep svg { display: block; }

    /* ── Main ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Header ── */
    .page-header {
      height: 64px; min-height: 64px;
      padding: 0 var(--space-8);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: space-between;
    }
    .breadcrumb { display: flex; align-items: center; gap: var(--space-1); }
    .bc-root { font-size: var(--text-base-m-size); font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
    .bc-root:hover { color: var(--color-primary-500); }
    .bc-sep { display: flex; align-items: center; }
    .bc-current { font-size: var(--text-base-m-size); color: var(--color-text-secondary); }
    .header-right { display: flex; align-items: center; gap: var(--space-3); }

    /* ── Content ── */
    .content-area { flex: 1; overflow-y: auto; padding: var(--space-6) var(--space-8); }

    /* ── Banners ── */
    .banners { display: flex; flex-direction: column; gap: var(--space-2); margin: var(--space-5) 0 var(--space-6); }

    /* ── Cards Grid — 3 cols ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 720px)  { .cards-grid { grid-template-columns: 1fr; } }

    /* ── Integration Card ── */
    .int-card {
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      padding: var(--space-4);
      background: var(--color-stone-0);
      display: flex; flex-direction: column; gap: var(--space-3);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .int-card:hover { border-color: var(--color-primary-500); box-shadow: var(--shadow-card-hover); }
    .int-card--allowed { border-color: var(--color-primary-500); }

    .int-card__header { display: flex; align-items: flex-start; gap: var(--space-3); }
    .int-logo {
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .int-meta { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .int-name { font-size: var(--text-label-l-size); font-weight: 600; color: var(--color-text-primary); line-height: 1.3; }
    .int-domain { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }

    .int-desc {
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-secondary);
      margin: 0;
      flex: 1;
    }
    .feature-list { display: flex; flex-direction: column; gap: var(--space-2); }

    .int-card__footer { margin-top: auto; }
    .allowed-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2) 0;
    }
    .allowed-projects {
      display: flex; align-items: center; gap: var(--space-1);
      font-size: var(--text-caption2-size); color: var(--color-primary-500); font-weight: 600;
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

    /* Figma: Share default 512×433px */
    .modal {
      width: 512px;
      background: var(--color-stone-0);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-popover);
      display: flex; flex-direction: column;
      animation: slideUp 0.2s ease;
      max-height: 90vh;
      overflow: hidden;
    }
    @keyframes slideUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Modal header — Figma: 512×72px */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
      height: 72px; min-height: 72px;
      border-bottom: 1px solid var(--color-divider);
    }
    .modal-title { font-size: var(--text-label-l-size); font-weight: 600; color: var(--color-text-primary); }
    .modal-close {
      width: 32px; height: 32px;
      border: none; background: transparent; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      transition: background 0.15s;
    }
    .modal-close:hover { background: var(--color-hover-bg); }

    /* Modal body */
    .modal-body {
      padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-5);
      overflow-y: auto;
    }
    .modal-info-text {
      margin: 0;
      font-size: var(--text-body1-size);
      line-height: var(--text-body1-lh);
      color: var(--color-text-primary);
    }

    /* Field */
    .field { display: flex; flex-direction: column; gap: var(--space-1); position: relative; }
    .field-label { font-size: var(--text-base-m-sb-weight); font-weight: 600; color: var(--color-text-primary); font-size: var(--text-label-m-size); }
    .field-hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }

    /* Project selector — dropdown trigger */
    .project-selector {
      height: 40px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer;
      transition: border-color 0.15s;
      font-size: var(--text-base-m-size);
    }
    .project-selector:hover { border-color: var(--color-primary-500); }
    .selector-value { color: var(--color-text-primary); }
    .selector-value.placeholder { color: var(--color-text-placeholder); }
    .project-selector svg { flex-shrink: 0; transition: transform 0.2s; }
    .project-selector svg.rotated { transform: rotate(180deg); }

    /* Dropdown */
    .project-dropdown {
      position: absolute;
      top: calc(100% - 4px);
      left: 0; right: 0;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      z-index: 10;
      max-height: 240px;
      overflow-y: auto;
    }
    .dropdown-search {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--color-stone-400);
    }
    .dropdown-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: var(--text-base-s-size); color: var(--color-text-primary);
      font-family: var(--font-family);
    }
    .dropdown-option {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      cursor: pointer; font-size: var(--text-base-s-size);
      transition: background 0.1s;
    }
    .dropdown-option:hover { background: var(--color-hover-bg); }
    .select-all { border-bottom: 1px solid var(--color-stone-300); }
    .dropdown-group { padding: var(--space-2) 0; }
    .group-label {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-caption2-size);
      font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .option-label { font-size: var(--text-base-s-size); color: var(--color-text-primary); }

    /* Checkbox row */
    .modal-checkbox-row { display: flex; align-items: flex-start; gap: var(--space-2); }

    /* Note */
    .modal-note { margin: 0; font-size: var(--text-base-s-size); color: var(--color-text-secondary); line-height: var(--text-base-s-lh); }
    .link { color: var(--color-primary-500); text-decoration: none; }
    .link:hover { text-decoration: underline; }

    /* Modal footer — Figma: 512×88px */
    .modal-footer {
      display: flex; align-items: center; justify-content: flex-end; gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
      border-top: 1px solid var(--color-divider);
      height: 88px; min-height: 88px;
    }

    /* ══════════════════════════════════════════
       TOAST — Figma: 400×56px, left accent 4px #2C9C74
    ══════════════════════════════════════════ */
    .toast {
      position: fixed;
      bottom: var(--space-6);
      left: 50%; transform: translateX(-50%) translateY(80px);
      width: 400px;
      height: 56px;
      background: #FBFBFB;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-toast);
      display: flex; align-items: center;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
      opacity: 0;
      z-index: 2000;
      pointer-events: none;
    }
    .toast--visible { transform: translateX(-50%) translateY(0); opacity: 1; }
    .toast-bar { width: 4px; height: 100%; background: var(--color-primary-500); flex-shrink: 0; }
    .toast-content {
      display: flex; align-items: center; gap: var(--space-3);
      padding: 0 var(--space-4);
      font-size: var(--text-base-s-size); color: var(--color-text-primary);
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
