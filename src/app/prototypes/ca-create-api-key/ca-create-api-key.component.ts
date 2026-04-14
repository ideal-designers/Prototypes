import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService, DropdownOption, RadioOption } from '../../shared/ds';
import type { HeaderAction, TableColumn, SidebarNavItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  expiresAt: string | null;
  status: 'active' | 'expiring' | 'expired';
  prefix: string;
}

type ModalStep = 'create' | 'success';

interface CreateKeyForm {
  name: string;
  expiration: '30d' | '90d' | '1y' | 'never' | 'custom';
  customDate: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'fvdr-ca-create-api-key',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <fvdr-toast-host />

    <div class="page-layout" [class.dark-theme]="isDark">

      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <fvdr-sidebar-nav
        variant="ca"
        accountName="ACME"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="toggleNavItem($event)"
      />

      <!-- ── Main ────────────────────────────────────────────────── -->
      <div class="main-area">

        <!-- Header -->
        <fvdr-header
          [breadcrumbs]="headerBreadcrumbs"
          [actions]="headerActions"
          [showMenu]="false"
          userName="Test Name"
          (actionClick)="onHeaderAction($event)"
        />

        <!-- Content -->
        <div class="content-area">

          <!-- Page heading -->
          <div class="page-heading">
            <fvdr-btn
              label="Create API key"
              variant="primary"
              size="m"
              data-track="create-api-key-open"
              (clicked)="openModal()"
            />
          </div>

          <!-- API Keys table -->
          <fvdr-table
            [columns]="apiKeyColumns"
            [data]="apiKeys"
            emptyText="No API keys yet"
          >
            <ng-template fvdrCell="prefix" let-value>
              <span class="key-mono">{{ value }}</span>
            </ng-template>
            <ng-template fvdrCell="status" let-value>
              <fvdr-status [label]="statusLabel(value)" [variant]="statusVariant(value)" />
            </ng-template>
            <ng-template fvdrCell="expiresAt" let-value>
              {{ value ?? 'Never' }}
            </ng-template>
            <ng-template fvdrCell="_actions" let-row="row">
              <fvdr-btn variant="ghost" iconName="trash" size="s" (clicked)="openDeleteConfirm(row)" />
            </ng-template>
          </fvdr-table>

        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         MODAL — Create API key
    ════════════════════════════════════════════ -->
    <div *ngIf="modalOpen" class="modal-overlay" (click)="onOverlayClick()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- Modal header -->
        <div class="modal-header">
          <span class="modal-title">
            {{ currentStep === 'success' ? 'API key' : 'Create API key' }}
          </span>
          <button class="modal-close" (click)="closeModal()" data-track="modal-close">
            <fvdr-icon name="cancel"></fvdr-icon>
          </button>
        </div>

        <!-- ── Create form ── -->
        <div class="modal-body" *ngIf="currentStep === 'create'">
          <div class="field">
            <fvdr-input
              label="Name"
              placeholder="e.g. Production backend, CI/CD pipeline"
              [(ngModel)]="form.name"
              [state]="nameError ? 'error' : 'default'"
            />
            <fvdr-inline-message *ngIf="nameError" variant="error" message="Name is required" />
          </div>

          <div class="field">
            <label class="field-label">Expires on</label>
            <fvdr-dropdown
              [options]="expirationDropdownOptions"
              [value]="form.expiration"
              (valueChange)="setExpiration($event)"
            />
          </div>

          <div class="field" *ngIf="form.expiration === 'custom'">
            <fvdr-datepicker label="Custom expiration date" [(ngModel)]="form.customDate" />
          </div>
        </div>

        <!-- ── Success ── -->
        <div class="modal-body modal-body--success" *ngIf="currentStep === 'success'">
          <div class="success-banner">
            <fvdr-icon name="check" class="success-banner__icon"></fvdr-icon>
            <span>Secret key created</span>
          </div>
          <p class="success-desc">Make sure you save or copy this secret key for your API setup</p>

          <div class="key-card">
            <div class="key-card__row">
              <div class="key-card__label">Name</div>
              <div class="key-card__value">{{ form.name }}</div>
            </div>
            <div class="key-card__row">
              <div class="key-card__label">Secret key</div>
              <div class="key-card__value key-card__value--key">
                <span class="key-card__key-text">{{ generatedKey }}</span>
                <button class="key-copy-btn" (click)="copyKey()" [class.key-copy-btn--copied]="keyCopied" data-track="copy-generated-key">
                  <fvdr-icon [name]="keyCopied ? 'check' : 'link'"></fvdr-icon>
                </button>
              </div>
            </div>
            <div class="key-card__row key-card__row--last">
              <div class="key-card__label">Expires on</div>
              <div class="key-card__value">{{ expirationDateOnly }}</div>
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <ng-container *ngIf="currentStep === 'create'">
            <div class="footer-right">
              <fvdr-btn label="Cancel" variant="secondary" size="m" (clicked)="closeModal()" data-track="modal-cancel" />
              <fvdr-btn label="Create key" variant="primary" size="m" (clicked)="nextStep()" data-track="modal-create" />
            </div>
          </ng-container>
          <ng-container *ngIf="currentStep === 'success'">
            <div class="footer-right">
              <fvdr-btn label="Download" variant="primary" size="m" iconName="download" (clicked)="downloadKey()" data-track="modal-download" />
            </div>
          </ng-container>
        </div>

      </div>
    </div>

    <!-- Delete confirm modal -->
    <fvdr-modal
      [visible]="deleteModalOpen"
      title="Delete API key"
      size="s"
      confirmLabel="Delete key"
      confirmVariant="danger"
      cancelLabel="Cancel"
      (confirmed)="confirmDelete()"
      (cancelled)="deleteModalOpen = false"
      (closed)="deleteModalOpen = false"
    >
      <p class="delete-confirm-text">
        Are you sure you want to delete <strong>{{ keyToDelete?.name }}</strong>?
        Any application using this key will lose access immediately.
      </p>
    </fvdr-modal>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      --color-border: var(--color-divider);
      --color-divider: var(--color-stone-400);
    }

    /* ── Shell ──────────────────────────────────────────────────── */
    .page-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-100);
    }

    /* ── Main area ───────────────────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Header — handled by fvdr-header DS component ── */

    /* ── Content ─────────────────────────────────────────────────── */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
      background: var(--color-stone-0);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .page-heading {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }
    .page-title {
      font-size: var(--text-sub1-size);
      font-weight: var(--text-sub1-weight);
      color: var(--color-text-primary);
      margin: 0;
    }

    /* ── Table ───────────────────────────────────────────────────── */
    .field-label {
      font-size: var(--text-label-s-size);
      font-weight: var(--text-label-s-weight);
      color: var(--color-text-primary);
    }
    .key-mono { font-family: monospace; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }

    /* ── Modal overlay ───────────────────────────────────────────── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.48);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: var(--color-stone-0);
      border-radius: var(--radius-lg);
      width: 540px;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-popover);
      animation: slideUp 0.15s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      flex-shrink: 0;
    }
    .modal-title { font-size: var(--text-sub2-size); font-weight: var(--text-sub2-weight); color: var(--color-text-primary); }
    .modal-close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 16px;
    }
    .modal-close:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Modal body ──────────────────────────────────────────────── */
    .modal-body {
      flex: 1;
      overflow-y: visible;
      overflow-x: visible;
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
    .step-description {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .field { display: flex; flex-direction: column; gap: var(--space-2); }

    /* Access options */
    .access-options { display: flex; flex-direction: column; gap: var(--space-3); }
    .access-option {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .access-option:hover { border-color: var(--color-stone-500); background: var(--color-stone-100); }
    .access-option--selected {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }
    .access-option__radio { padding-top: 2px; }
    .radio-outer {
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 2px solid var(--color-stone-500);
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s;
      flex-shrink: 0;
    }
    .radio-outer--selected { border-color: var(--color-primary-500); }
    .radio-inner {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--color-primary-500);
    }
    .access-option__content { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }
    .access-option__header { display: flex; align-items: center; gap: var(--space-2); }
    .access-option__title { font-size: var(--text-label-s-size); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .access-option__desc { font-size: var(--text-body3-size); color: var(--color-text-secondary); margin: 0; }
    .access-option__perms { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .perm-tag {
      font-size: var(--text-caption1-size);
      background: var(--color-stone-200);
      color: var(--color-text-secondary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-family: monospace;
    }

    /* Expiration options */
    .expiration-options { display: flex; flex-direction: column; gap: var(--space-2); }
    .exp-option {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .exp-option:hover { border-color: var(--color-stone-500); background: var(--color-stone-100); }
    .exp-option--selected {
      border-color: var(--color-primary-500);
      background: var(--color-primary-50);
    }
    .exp-option__content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .exp-option__label { font-size: var(--text-body3-size); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .exp-option__hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .exp-custom { padding: var(--space-2) 0 0; }

    /* Review */
    .review-card {
      background: var(--color-stone-100);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .review-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      gap: var(--space-4);
    }
    .review-row:last-child { border-bottom: none; }
    .review-label { font-size: var(--text-body3-size); color: var(--color-text-secondary); white-space: nowrap; }
    .review-value { font-size: var(--text-body3-size); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .review-value--muted { font-weight: 400; color: var(--color-text-secondary); }

    /* Success */
    .modal-body--success { gap: var(--space-4); }
    .success-banner {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary-50);
      border-radius: var(--radius-md);
      color: var(--color-primary-600);
      font-size: var(--text-body3-size); font-weight: var(--text-label-s-weight);
      width: 100%;
    }
    .success-banner__icon { color: var(--color-primary-500); font-size: 16px; }
    .success-desc { font-size: var(--text-body3-size); color: var(--color-text-secondary); margin: 0; }

    .key-card {
      width: 100%;
      background: var(--color-stone-100);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .key-card__row {
      padding: var(--space-3) var(--space-4);
    }
    .key-card__label { font-size: var(--text-body3-size); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); margin-bottom: var(--space-1); }
    .key-card__value { font-size: var(--text-body3-size); color: var(--color-text-secondary); }
    .key-card__value--key { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .key-card__key-text { font-family: monospace; font-size: var(--text-body3-size); word-break: break-all; }
    .key-copy-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; flex-shrink: 0;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 16px;
      transition: all 0.15s;
    }
    .key-copy-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .key-copy-btn--copied { color: var(--color-primary-500); }

    /* Modal footer */
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      flex-shrink: 0;
    }
    .footer-right { display: flex; gap: var(--space-3); margin-left: auto; }

    /* Delete confirm */
    .delete-confirm-text { font-size: var(--text-body3-size); color: var(--color-text-primary); margin: 0; line-height: 1.6; }

    /* ── Dark theme ──────────────────────────────────────────────── */
    .dark-theme.page-layout   { background: var(--color-text-primary); }
    .dark-theme .content-area { background: #292d2f; }
    .dark-theme .modal         { background: #292d2f; }
    .dark-theme .key-card__value { color: #b5bbbf; }
  `],
})
export class CaCreateApiKeyComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast    = inject(ToastService);

  // ── Shell state ──────────────────────────────────────────────────────────
  sidebarCollapsed = false;
  isDark = false;

  headerBreadcrumbs: { id: string; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'api-keys', label: 'API Keys' },
  ];
  get headerActions(): HeaderAction[] {
    return [
      { id: 'theme', icon: this.isDark ? 'theme-light' : 'theme-dark' },
      { id: 'help', icon: 'help' },
    ];
  }
  onHeaderAction(id: string): void {
    if (id === 'theme') this.isDark = !this.isDark;
  }

  // ── Nav ──────────────────────────────────────────────────────────────────
  navItems: SidebarNavItem[] = [
    { id: 'overview',     label: 'Overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active' },
    { id: 'projects',     label: 'Projects',     icon: 'nav-projects',     iconActive: 'nav-projects-active' },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'reports',      label: 'Reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active' },
    {
      id: 'api', label: 'API', icon: 'nav-api', iconActive: 'nav-api-active', active: true, open: true,
      children: [
        { id: 'api-keys', label: 'API Keys', active: true },
        { id: 'features', label: 'Features' },
      ],
    },
    { id: 'billing',  label: 'Billing',  icon: 'nav-billing',  iconActive: 'nav-billing-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
  ];

  toggleNavItem(item: SidebarNavItem) {
    this.navItems.forEach(n => n.active = n.id === item.id);
  }

  // ── API Keys table ───────────────────────────────────────────────────────
  apiKeyColumns: TableColumn[] = [
    { key: 'name',      label: 'Name' },
    { key: 'prefix',    label: 'Secret key' },
    { key: 'status',    label: 'Status' },
    { key: 'createdBy', label: 'Created by' },
    { key: 'createdAt', label: 'Created on' },
    { key: 'expiresAt', label: 'Expires on' },
    { key: '_actions',  label: '', width: '60px' },
  ];

  // ── API Keys data ────────────────────────────────────────────────────────
  apiKeys: ApiKey[] = [
    {
      id: '1', name: 'Production backend',
      createdAt: 'Jan 12, 2025', createdBy: 'Tom Nilsson', expiresAt: 'Dec 31, 2025',
      status: 'active', prefix: 'sk_live_xK3m...R7pQ',
    },
    {
      id: '2', name: 'CI/CD pipeline',
      createdAt: 'Feb 3, 2025', createdBy: 'Tom Nilsson', expiresAt: 'Apr 10, 2025',
      status: 'expiring', prefix: 'sk_live_9Bns...T1vW',
    },
    {
      id: '3', name: 'Analytics service',
      createdAt: 'Nov 20, 2024', createdBy: 'Maria Santos', expiresAt: null,
      status: 'active', prefix: 'sk_live_Lp2x...K0dM',
    },
    {
      id: '4', name: 'Legacy integration',
      createdAt: 'Aug 1, 2024', createdBy: 'Maria Santos', expiresAt: 'Jan 1, 2025',
      status: 'expired', prefix: 'sk_live_m8Hq...A5jY',
    },
  ];

  statusLabel(status: ApiKey['status']): string {
    return { 'active': 'Active', 'expiring': 'Expiring soon', 'expired': 'Expired' }[status] ?? status;
  }
  statusVariant(status: ApiKey['status']): 'success' | 'warning' | 'error' {
    return { 'active': 'success', 'expiring': 'warning', 'expired': 'error' }[status] as any;
  }

  // ── Delete flow ──────────────────────────────────────────────────────────
  deleteModalOpen = false;
  keyToDelete: ApiKey | null = null;

  openDeleteConfirm(key: ApiKey) {
    this.keyToDelete = key;
    this.deleteModalOpen = true;
    this.tracker.trackTask('ca-create-api-key', 'task_fail'); // delete attempt
  }

  confirmDelete() {
    if (!this.keyToDelete) return;
    this.apiKeys = this.apiKeys.filter(k => k.id !== this.keyToDelete!.id);
    this.toast.show({ message: `"${this.keyToDelete.name}" has been deleted`, variant: 'success' });
    this.deleteModalOpen = false;
    this.keyToDelete = null;
  }

  copyKeyPrefix(key: ApiKey) {
    this.toast.show({ message: 'Key prefix copied to clipboard', variant: 'info' });
  }

  // ── Create modal flow ────────────────────────────────────────────────────
  modalOpen = false;
  currentStep: ModalStep = 'create';
  nameError = false;
  keyCopied = false;
  generatedKey = '';

  form: CreateKeyForm = { name: '', expiration: '90d', customDate: '' };

  expirationDropdownOptions = [
    { label: '30 days',        value: '30d' },
    { label: '90 days',        value: '90d' },
    { label: '1 year',         value: '1y' },
    { label: 'No expiration',  value: 'never' },
    { label: 'Custom date…',   value: 'custom' },
  ];

  asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }
  setExpiration(v: string | string[]) { this.form.expiration = this.asString(v) as CreateKeyForm['expiration']; }

  get expirationDateOnly(): string {
    if (this.form.expiration === 'never') return 'Never';
    if (this.form.expiration === 'custom') return this.form.customDate || 'Not set';
    const days = this.form.expiration === '30d' ? 30 : this.form.expiration === '90d' ? 90 : 365;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  downloadKey() {
    const content = `API Key: ${this.generatedKey}\nName: ${this.form.name}\nExpires: ${this.expirationDateOnly}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `api-key-${this.form.name.replace(/\s+/g, '-')}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  get expirationLabel(): string {
    const map: Record<string, string> = {
      '30d':    '30 days (' + this.dateAfterDays(30) + ')',
      '90d':    '90 days (' + this.dateAfterDays(90) + ')',
      '1y':     '1 year (' + this.dateAfterDays(365) + ')',
      'never':  'Never',
      'custom': this.form.customDate || 'Not set',
    };
    return map[this.form.expiration] ?? this.form.expiration;
  }

  private dateAfterDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  openModal() {
    this.form = { name: '', expiration: '90d', customDate: '' };
    this.currentStep = 'create';
    this.nameError = false;
    this.keyCopied = false;
    this.generatedKey = '';
    this.modalOpen = true;
    this.tracker.trackTask('ca-create-api-key', 'task_complete');
  }

  closeModal() { this.modalOpen = false; }

  onOverlayClick() {
    if (this.currentStep !== 'success') this.closeModal();
  }

  nextStep() {
    if (!this.form.name.trim()) { this.nameError = true; return; }
    this.nameError = false;
    this.createKey();
  }

  createKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const rand = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.generatedKey = `sk_live_${rand(8)}_${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`;
    this.currentStep = 'success';

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: this.form.name,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdBy: 'Tom Nilsson',
      expiresAt: this.form.expiration === 'never' ? null : this.dateAfterDays(this.form.expiration === '30d' ? 30 : this.form.expiration === '90d' ? 90 : 365),
      status: 'active',
      prefix: this.generatedKey.slice(0, 18) + '...' + this.generatedKey.slice(-4),
    };
    this.apiKeys = [newKey, ...this.apiKeys];
    this.tracker.trackTask('ca-create-api-key', 'task_complete');
  }

  copyKey() {
    navigator.clipboard.writeText(this.generatedKey).catch(() => {});
    this.keyCopied = true;
    this.toast.show({ message: 'API key copied to clipboard', variant: 'success' });
    setTimeout(() => this.keyCopied = false, 2500);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.tracker.trackPageView('ca-create-api-key');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }
}
