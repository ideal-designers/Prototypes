import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  features: {
    enabledProjects: boolean;
    availableDocuments: boolean;
    permissionDownloads: boolean;
  };
}

@Component({
  selector: 'fvdr-ca-settings-integrations',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <!-- tokens.css loaded globally via angular.json styles[] -->
    <div class="page-layout">

      <!-- Left sidebar 72px -->
      <nav class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">CA</div>
        </div>
        <div class="sidebar-nav">
          <button class="nav-item active" data-track="nav-overview" title="Overview">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".4"/>
            </svg>
          </button>
          <button class="nav-item" data-track="nav-projects" title="Projects">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M7 9h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="nav-item" data-track="nav-settings" title="Settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </nav>

      <!-- Main area -->
      <div class="main-area">

        <!-- Header 64px -->
        <header class="page-header">
          <div class="breadcrumb">
            <span class="bc-item muted">Corporate account</span>
            <span class="bc-sep">›</span>
            <span class="bc-item muted">Settings</span>
            <span class="bc-sep">›</span>
            <span class="bc-item active">Integrations</span>
          </div>
          <!-- DS: <fvdr-avatar> -->
          <fvdr-avatar initials="PA" size="md" data-track="header-avatar" />
        </header>

        <!-- Content -->
        <div class="content-area">

          <!-- DS: <fvdr-tabs> -->
          <fvdr-tabs
            [tabs]="tabs"
            [(activeId)]="activeTab"
            (tabChange)="tracker.trackTask('ca-settings-integrations', 'task_complete')"
          />

          <!-- DS: <fvdr-info-banner> -->
          <div class="banners">
            <fvdr-info-banner
              message="Only integrations allowed at the corporate account level can be enabled for individual projects."
            />
            <fvdr-info-banner
              message="This applies to new projects only and doesn't affect the ones created before the settings update."
            />
          </div>

          <!-- Cards grid — DS: <fvdr-card> -->
          <div class="cards-grid">
            <fvdr-card
              *ngFor="let item of integrations"
              [active]="item.allowed"
              [hoverable]="true"
            >
              <!-- card-header-actions slot -->
              <ng-container card-header-actions></ng-container>

              <!-- Card content -->
              <div class="integration-header">
                <div class="integration-logo" [style.background]="item.logoColor + '18'" [style.color]="item.logoColor">
                  {{ item.logoInitial }}
                </div>
                <div class="integration-meta">
                  <span class="integration-name">{{ item.name }}</span>
                  <span class="integration-domain">{{ item.domain }}</span>
                </div>
              </div>

              <p class="integration-desc">{{ item.description }}</p>

              <!-- DS: <fvdr-checkbox> × 3 -->
              <div class="feature-list">
                <fvdr-checkbox label="Enabled projects"            [checked]="item.features.enabledProjects" [disabled]="true" />
                <fvdr-checkbox label="Available documents"         [checked]="item.features.availableDocuments" [disabled]="true" />
                <fvdr-checkbox label="Permission-based downloads"  [checked]="item.features.permissionDownloads" [disabled]="true" />
              </div>

              <!-- DS: <fvdr-btn> -->
              <fvdr-btn
                [label]="item.allowed ? 'Allowed' : 'Allow'"
                [variant]="item.allowed ? 'secondary' : 'primary'"
                size="m"
                style="width:100%"
                [dataTrack]="'allow-' + item.id"
                (clicked)="toggleAllow(item)"
              />
            </fvdr-card>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      font-family: var(--font-family);
      display: block;
    }

    /* ── Layout ── */
    .page-layout {
      display: flex;
      height: 100vh;
      background: var(--color-stone-0);
      overflow: hidden;
    }

    /* ── Sidebar 72px ── */
    .sidebar {
      width: 72px; min-width: 72px;
      background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      display: flex; flex-direction: column; align-items: center;
      padding: var(--space-4) 0;
      gap: var(--space-2);
    }
    .sidebar-logo { padding: var(--space-2) 0 var(--space-4); }
    .logo-mark {
      width: 36px; height: 36px;
      background: var(--color-primary-500);
      color: #fff;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .sidebar-nav { display: flex; flex-direction: column; gap: var(--space-1); }
    .nav-item {
      width: 44px; height: 44px;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item.active, .nav-item:hover {
      background: var(--color-primary-50);
      color: var(--color-primary-500);
    }

    /* ── Main area ── */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Header 64px ── */
    .page-header {
      height: 64px; min-height: 64px;
      padding: 0 var(--space-8);
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .breadcrumb { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-base-s-size); }
    .bc-item.muted { color: var(--color-text-secondary); }
    .bc-item.active { color: var(--color-text-primary); font-weight: 600; }
    .bc-sep { color: var(--color-text-disabled); }

    /* ── Content ── */
    .content-area { flex: 1; overflow-y: auto; padding: var(--space-6) var(--space-8); }

    /* ── Banners ── */
    .banners { display: flex; flex-direction: column; gap: var(--space-2); margin: var(--space-5) 0 var(--space-6); }

    /* ── Cards grid ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
    }

    /* ── Card internals ── */
    .integration-header { display: flex; align-items: center; gap: var(--space-3); }
    .integration-logo {
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-label-l-size); font-weight: 600;
      flex-shrink: 0;
    }
    .integration-meta { display: flex; flex-direction: column; gap: 2px; }
    .integration-name { font-size: var(--text-label-l-size); font-weight: 600; color: var(--color-text-primary); }
    .integration-domain { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }

    .integration-desc {
      font-size: var(--text-base-s-size);
      color: var(--color-text-secondary);
      line-height: var(--text-base-s-lh);
      margin: 0;
    }

    .feature-list { display: flex; flex-direction: column; gap: var(--space-2); }
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

  toggleAllow(item: Integration): void {
    item.allowed = !item.allowed;
    this.tracker.trackTask('ca-settings-integrations', item.allowed ? 'task_complete' : 'task_fail');
  }
}
