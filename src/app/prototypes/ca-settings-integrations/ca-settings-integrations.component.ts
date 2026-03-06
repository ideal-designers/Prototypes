import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

interface Integration {
  id: string;
  name: string;
  domain: string;
  description: string;
  logoInitial: string;
  logoColor: string;
  allowed: boolean;
  features: {
    enabledProjects: boolean;
    availableDocuments: boolean;
    permissionDownloads: boolean;
  };
}

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Layout: left sidebar 72px + main content -->
    <div class="page-layout">

      <!-- Left sidebar — storybook: no direct component, use nav icons -->
      <nav class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">CA</div>
        </div>
        <div class="sidebar-nav">
          <button class="nav-item active" data-track="nav-overview" title="Overview">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/><rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/></svg>
          </button>
          <button class="nav-item" data-track="nav-projects" title="Projects">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
          <button class="nav-item" data-track="nav-settings" title="Settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>
      </nav>

      <!-- Main area -->
      <div class="main-area">

        <!-- Header — storybook: Avatar component for user icon -->
        <header class="page-header">
          <div class="breadcrumb">
            <span class="breadcrumb-item muted">Corporate account</span>
            <span class="breadcrumb-sep">›</span>
            <span class="breadcrumb-item muted">Settings</span>
            <span class="breadcrumb-sep">›</span>
            <span class="breadcrumb-item active">Integrations</span>
          </div>
          <!-- storybook: <fvdr-avatar> -->
          <div class="header-actions">
            <div class="avatar" data-track="header-avatar">PA</div>
          </div>
        </header>

        <!-- Content area -->
        <div class="content-area">

          <!-- Tabs — storybook: Tabs component -->
          <div class="tabs-bar">
            <button
              *ngFor="let tab of tabs"
              class="tab-item"
              [class.active]="activeTab === tab.id"
              (click)="setTab(tab.id)"
              [attr.data-track]="'tab-' + tab.id"
            >{{ tab.label }}</button>
          </div>

          <!-- Info banners — storybook: Message component -->
          <div class="info-banners">
            <div class="info-banner">
              <svg class="info-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#5F6168" stroke-width="1.3"/><path d="M8 7v4M8 5v.5" stroke="#5F6168" stroke-width="1.3" stroke-linecap="round"/></svg>
              <p>Only integrations allowed at the corporate account level can be enabled for individual projects. <a href="#" class="link" data-track="learn-more">Learn more</a></p>
            </div>
            <div class="info-banner">
              <svg class="info-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#5F6168" stroke-width="1.3"/><path d="M8 7v4M8 5v.5" stroke="#5F6168" stroke-width="1.3" stroke-linecap="round"/></svg>
              <p>This applies to new projects only and doesn't affect the ones created before the settings update</p>
            </div>
          </div>

          <!-- Integration cards grid — storybook: Card component -->
          <div class="cards-grid">
            <div
              *ngFor="let item of integrations"
              class="integration-card"
              [class.allowed]="item.allowed"
            >
              <!-- Card header: logo + name + domain -->
              <div class="card-header">
                <!-- storybook: Logo or Avatar component for integration icon -->
                <div class="integration-logo" [style.background]="item.logoColor + '20'" [style.color]="item.logoColor">
                  {{ item.logoInitial }}
                </div>
                <div class="integration-meta">
                  <span class="integration-name">{{ item.name }}</span>
                  <span class="integration-domain">{{ item.domain }}</span>
                </div>
              </div>

              <!-- Description -->
              <p class="card-description">{{ item.description }}</p>

              <!-- Features — storybook: Checkbox component -->
              <div class="feature-list">
                <label class="feature-item" [class.checked]="item.features.enabledProjects">
                  <!-- storybook: <fvdr-checkbox [(ngModel)]="item.features.enabledProjects"> -->
                  <span class="checkbox" [class.checked]="item.features.enabledProjects">
                    <svg *ngIf="item.features.enabledProjects" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span>Enabled projects</span>
                </label>
                <label class="feature-item" [class.checked]="item.features.availableDocuments">
                  <span class="checkbox" [class.checked]="item.features.availableDocuments">
                    <svg *ngIf="item.features.availableDocuments" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span>Available documents</span>
                </label>
                <label class="feature-item" [class.checked]="item.features.permissionDownloads">
                  <span class="checkbox" [class.checked]="item.features.permissionDownloads">
                    <svg *ngIf="item.features.permissionDownloads" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span>Permission-based downloads</span>
                </label>
              </div>

              <!-- Allow button — storybook: Button component -->
              <div class="card-footer">
                <button
                  class="btn-allow"
                  [class.allowed]="item.allowed"
                  (click)="toggleAllow(item)"
                  [attr.data-track]="'allow-' + item.id"
                >
                  {{ item.allowed ? 'Allowed' : 'Allow' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Design tokens from Figma ── */
    :host {
      --green-500: #2C9C74;
      --green-400: #3FB67D;
      --green-50:  #EBF7EF;
      --text-primary: #1F2028;
      --text-secondary: #5F6168;
      --text-disabled: #BBBDC7;
      --surface: #F7F7F7;
      --white: #FFFFFF;
      --border: #E8E8EC;
      font-family: 'Open Sans', sans-serif;
      display: block;
    }

    /* ── Layout ── */
    .page-layout {
      display: flex;
      height: 100vh;
      background: var(--white);
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 72px;
      min-width: 72px;
      background: var(--white);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      gap: 8px;
    }
    .sidebar-logo { padding: 8px 0 16px; }
    .logo-mark {
      width: 36px; height: 36px;
      background: var(--green-500);
      color: #fff;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      width: 44px; height: 44px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item.active, .nav-item:hover { background: var(--green-50); color: var(--green-500); }

    /* ── Main area ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Header ── */
    .page-header {
      height: 64px; min-height: 64px;
      padding: 0 32px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: var(--white);
    }
    .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .breadcrumb-item.muted { color: var(--text-secondary); }
    .breadcrumb-item.active { color: var(--text-primary); font-weight: 600; }
    .breadcrumb-sep { color: var(--text-disabled); }
    .avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--green-500);
      color: #fff;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }

    /* ── Content ── */
    .content-area { flex: 1; overflow-y: auto; padding: 24px 32px; background: var(--white); }

    /* ── Tabs — map to storybook Tabs ── */
    .tabs-bar {
      display: flex; gap: 2px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .tab-item {
      padding: 10px 16px;
      border: none; background: transparent;
      font-size: 14px; font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-item.active {
      color: var(--text-primary);
      border-bottom-color: var(--green-500);
    }
    .tab-item:hover:not(.active) { color: var(--text-primary); }

    /* ── Info banners — map to storybook Message ── */
    .info-banners { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .info-banner {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 12px 16px;
      background: var(--surface);
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-primary);
      line-height: 1.5;
    }
    .info-icon { flex-shrink: 0; margin-top: 2px; }
    .info-banner p { margin: 0; }
    .link { color: var(--green-500); text-decoration: none; }
    .link:hover { text-decoration: underline; }

    /* ── Cards grid — map to storybook Card ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .integration-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      background: var(--white);
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .integration-card:hover { border-color: #C8E8DC; box-shadow: 0 2px 12px rgba(44,156,116,.08); }
    .integration-card.allowed { border-color: var(--green-500); }

    /* Card header */
    .card-header { display: flex; align-items: center; gap: 12px; }
    .integration-logo {
      width: 44px; height: 44px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700;
      flex-shrink: 0;
    }
    .integration-meta { display: flex; flex-direction: column; gap: 2px; }
    .integration-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .integration-domain { font-size: 12px; color: var(--text-secondary); }

    /* Description */
    .card-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.55;
      margin: 0;
    }

    /* Features — map to storybook Checkbox ── */
    .feature-list { display: flex; flex-direction: column; gap: 8px; }
    .feature-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--text-secondary);
      cursor: default;
    }
    .feature-item.checked { color: var(--text-primary); }
    .checkbox {
      width: 16px; height: 16px;
      border-radius: 4px;
      border: 1.5px solid var(--border);
      background: var(--white);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .checkbox.checked { background: var(--green-500); border-color: var(--green-500); }

    /* Card footer */
    .card-footer { margin-top: auto; padding-top: 4px; }

    /* Button — map to storybook Button ── */
    .btn-allow {
      width: 100%;
      padding: 9px 16px;
      border-radius: 8px;
      border: 1.5px solid var(--green-500);
      background: var(--green-500);
      color: #fff;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-allow:hover { background: var(--green-400); border-color: var(--green-400); }
    .btn-allow.allowed {
      background: var(--green-50);
      border-color: var(--green-500);
      color: var(--green-500);
    }
    .btn-allow.allowed:hover { background: #d6f0e4; }
  `],
})
export class CaSettingsIntegrationsComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  tabs = [
    { id: 'security', label: 'Security' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'contract', label: 'Contract #128182' },
  ];
  activeTab = 'integrations';

  integrations: Integration[] = [
    {
      id: 'emma',
      name: 'Emma',
      domain: 'emma.legal',
      description: 'Accelerate end-to-end M&A due diligence by mapping project documents and surfacing clause-level risks for full deal visibility',
      logoInitial: 'E',
      logoColor: '#2C9C74',
      allowed: false,
      features: { enabledProjects: true, availableDocuments: true, permissionDownloads: false },
    },
    {
      id: 'jurimesh',
      name: 'Jurimesh',
      domain: 'jurimesh.com',
      description: 'Automate document analysis, identify legal risks, and standardize review outputs at scale to streamline contract-focused due diligence',
      logoInitial: 'J',
      logoColor: '#4862D3',
      allowed: false,
      features: { enabledProjects: true, availableDocuments: false, permissionDownloads: false },
    },
    {
      id: 'prudentia',
      name: 'Prudentia sciences',
      domain: 'prudentiasciences.com',
      description: 'Support life sciences deal evaluation and investment decisions by transforming scientific, clinical, and financial data into actionable insights',
      logoInitial: 'P',
      logoColor: '#F4640C',
      allowed: false,
      features: { enabledProjects: false, availableDocuments: false, permissionDownloads: false },
    },
    {
      id: 'zapier',
      name: 'Zapier',
      domain: 'zapier.com',
      description: 'Automate data room processes by connecting your virtual data room to other tools, triggering uploads, notifications, and workflow actions',
      logoInitial: 'Z',
      logoColor: '#FF4A00',
      allowed: false,
      features: { enabledProjects: true, availableDocuments: true, permissionDownloads: true },
    },
  ];

  ngOnInit(): void {
    this.tracker.trackPageView('ca-settings-integrations');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  setTab(id: string): void {
    this.activeTab = id;
    this.tracker.trackTask('ca-settings-integrations', 'task_complete');
  }

  toggleAllow(item: Integration): void {
    item.allowed = !item.allowed;
    this.tracker.trackTask('ca-settings-integrations', item.allowed ? 'task_complete' : 'task_fail');
  }
}
