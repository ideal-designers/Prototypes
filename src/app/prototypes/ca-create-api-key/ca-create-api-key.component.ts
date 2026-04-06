import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService, FvdrIconName, DropdownOption, RadioOption } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  access: 'full' | 'read-write' | 'read-only';
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  status: 'active' | 'expiring' | 'expired';
  prefix: string;
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

type ModalStep = 'name' | 'access' | 'expiration' | 'review' | 'success';

interface CreateKeyForm {
  name: string;
  description: string;
  accessLevel: 'full' | 'read-write' | 'read-only';
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
      <nav class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">

        <div class="account-switcher">
          <div class="account-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="4" fill="#084D4B"/>
              <g clip-path="url(#ca-clip2)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10 20.0001C10 25.5229 14.4772 30 20 30C25.5228 30 30 25.5228 30 20C30 14.4772 25.5228 10 20 10C14.4772 10 10 14.4772 10 20.0001ZM28 20C28 24.4183 24.4183 28 20 28C19.6615 28 19.3279 27.979 19.0005 27.9382C22.9466 27.4459 26 24.0796 26 20.0001C26 15.9203 22.9461 12.5538 18.9995 12.062C19.3273 12.0211 19.6612 12 20 12C24.4183 12 28 15.5817 28 20ZM12 20.0001C11.9999 18.3433 13.3431 17 15 17C16.6569 17 18 18.3431 18 20C18 21.6569 16.6569 23 15 23C13.3432 23 12.0001 21.6569 12 20.0001ZM18 26.0001C16.7661 26.0001 15.6191 25.6276 14.6655 24.989C14.7761 24.9963 14.8876 25 15 25C17.7614 25 20 22.7614 20 20C20 17.2386 17.7614 15 15 15C14.8877 15 14.7763 15.0037 14.6659 15.011C15.6195 14.3725 16.7663 14.0001 18 14.0001C21.3137 14.0001 24 16.6864 24 20.0001C24 23.3138 21.3137 26.0001 18 26.0001Z" fill="#8CEAA7"/>
              </g>
              <defs><clipPath id="ca-clip2"><rect width="20" height="20" fill="white" transform="translate(10 10)"/></clipPath></defs>
            </svg>
          </div>
          <span class="account-name" *ngIf="!sidebarCollapsed">ACME</span>
          <fvdr-icon *ngIf="!sidebarCollapsed" name="chevron-down" class="account-chevron"></fvdr-icon>
        </div>

        <div class="nav-list">
          <ng-container *ngFor="let item of navItems">
            <button
              class="nav-item"
              [class.nav-item--active]="item.active"
              [class.nav-item--open]="item.open"
              [title]="sidebarCollapsed ? item.label : ''"
              (click)="toggleNavItem(item)"
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
            <div *ngIf="!sidebarCollapsed && item.open && item.children" class="nav-subitems">
              <button
                *ngFor="let child of item.children"
                class="nav-subitem"
                [class.nav-subitem--active]="child.active"
              >{{ child.label }}</button>
            </div>
          </ng-container>
        </div>

        <div class="sidebar-bottom">
          <div class="sidebar-logo" *ngIf="!sidebarCollapsed">
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
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <fvdr-icon *ngIf="!sidebarCollapsed" name="angle-double-left"></fvdr-icon>
            <fvdr-icon *ngIf="sidebarCollapsed"  name="angle-double-right"></fvdr-icon>
          </button>
        </div>
      </nav>

      <!-- ── Main ────────────────────────────────────────────────── -->
      <div class="main-area">

        <!-- Header -->
        <header class="page-header">
          <nav class="breadcrumb">
            <button class="bc-item bc-item--link">
              Settings
              <fvdr-icon name="chevron-right" class="bc-chevron bc-chevron--dim"></fvdr-icon>
            </button>
            <button class="bc-item bc-item--current">
              API Keys
              <fvdr-icon name="chevron-down" class="bc-chevron"></fvdr-icon>
            </button>
          </nav>
          <div class="header-right">
            <button class="theme-toggle" (click)="isDark = !isDark">
              <fvdr-icon [name]="isDark ? 'theme-light' : 'theme-dark'" class="theme-toggle__icon"></fvdr-icon>
              <span class="theme-toggle__label">{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
            </button>
            <fvdr-icon name="help" class="header-icon"></fvdr-icon>
            <fvdr-avatar initials="TN" size="lg" color="var(--color-primary-50)" textColor="var(--color-text-primary)" />
          </div>
        </header>

        <!-- Content -->
        <div class="content-area">

          <!-- Page heading -->
          <div class="page-heading">
            <div class="page-heading__left">
              <h1 class="page-title">API Keys</h1>
              <p class="page-subtitle">Manage API keys for programmatic access to your account</p>
            </div>
            <fvdr-btn
              label="Create API key"
              variant="primary"
              size="m"
              data-track="create-api-key-open"
              (clicked)="openModal()"
            />
          </div>

          <!-- Stats row -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-value">{{ apiKeys.length }}</span>
              <span class="stat-label">Total keys</span>
            </div>
            <div class="stat-card stat-card--success">
              <span class="stat-value">{{ activeCount }}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-card stat-card--warning">
              <span class="stat-value">{{ expiringCount }}</span>
              <span class="stat-label">Expiring soon</span>
            </div>
          </div>

          <!-- API Keys table -->
          <div class="table-container">
            <div class="table-header">
              <fvdr-search placeholder="Search keys..." (search)="onSearch($event)" />
            </div>

            <table class="keys-table">
              <thead>
                <tr>
                  <th>Key name</th>
                  <th>Access level</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let key of filteredKeys" class="keys-table__row">
                  <td>
                    <div class="key-name-cell">
                      <span class="key-name">{{ key.name }}</span>
                      <span class="key-prefix">{{ key.prefix }}</span>
                    </div>
                  </td>
                  <td>
                    <fvdr-badge [label]="accessLabel(key.access)" [variant]="accessVariant(key.access)" />
                  </td>
                  <td class="td--muted">{{ key.createdAt }}</td>
                  <td class="td--muted">{{ key.expiresAt ?? 'Never' }}</td>
                  <td class="td--muted">{{ key.lastUsed ?? '—' }}</td>
                  <td>
                    <fvdr-status [label]="statusLabel(key.status)" [variant]="statusVariant(key.status)" />
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" title="Copy key" (click)="copyKeyPrefix(key)" data-track="copy-key">
                        <fvdr-icon name="link"></fvdr-icon>
                      </button>
                      <button class="icon-btn icon-btn--danger" title="Delete key" (click)="openDeleteConfirm(key)" data-track="delete-key">
                        <fvdr-icon name="trash"></fvdr-icon>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredKeys.length === 0" class="empty-row">
                  <td colspan="7">
                    <div class="empty-state">
                      <fvdr-icon name="api" class="empty-icon"></fvdr-icon>
                      <p class="empty-text">No API keys found</p>
                      <fvdr-btn label="Create API key" variant="primary" size="s" (clicked)="openModal()" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         MODAL — Create API key (4 steps + success)
    ════════════════════════════════════════════ -->
    <div *ngIf="modalOpen" class="modal-overlay" (click)="onOverlayClick()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

        <!-- Modal header -->
        <div class="modal-header">
          <span class="modal-title">
            {{ currentStep === 'success' ? 'API key created' : 'Create API key' }}
          </span>
          <button class="modal-close" (click)="closeModal()" data-track="modal-close">
            <fvdr-icon name="cancel"></fvdr-icon>
          </button>
        </div>

        <!-- Step indicator (hidden on success) -->
        <div class="step-indicator" *ngIf="currentStep !== 'success'">
          <ng-container *ngFor="let s of steps; let i = index">
            <div class="step-dot-wrap">
              <div
                class="step-dot"
                [class.step-dot--done]="stepIndex > i"
                [class.step-dot--active]="stepIndex === i"
              >
                <fvdr-icon *ngIf="stepIndex > i" name="check" class="step-check"></fvdr-icon>
                <span *ngIf="stepIndex <= i">{{ i + 1 }}</span>
              </div>
              <span class="step-label">{{ stepLabels[i] }}</span>
            </div>
            <div class="step-line" *ngIf="i < steps.length - 1" [class.step-line--done]="stepIndex > i"></div>
          </ng-container>
        </div>

        <!-- ── Step 1: Key name ── -->
        <div class="modal-body" *ngIf="currentStep === 'name'">
          <p class="step-description">Give your API key a name that helps you identify its purpose.</p>

          <div class="field">
            <fvdr-input
              label="Key name"
              placeholder="e.g. Production backend, CI/CD pipeline"
              [(ngModel)]="form.name"
              [state]="nameError ? 'error' : 'default'"
            />
            <fvdr-inline-message *ngIf="nameError" variant="error" message="Key name is required" />
          </div>

          <div class="field">
            <fvdr-textarea
              label="Description (optional)"
              placeholder="What is this key used for?"
              [(ngModel)]="form.description"
              [maxLength]="200"
            />
          </div>
        </div>

        <!-- ── Step 2: Access level ── -->
        <div class="modal-body" *ngIf="currentStep === 'access'">
          <p class="step-description">Choose what this API key is allowed to do.</p>

          <div class="access-options">
            <label
              *ngFor="let opt of accessOptions"
              class="access-option"
              [class.access-option--selected]="form.accessLevel === opt.value"
              (click)="form.accessLevel = opt.value"
            >
              <div class="access-option__radio">
                <div class="radio-outer" [class.radio-outer--selected]="form.accessLevel === opt.value">
                  <div class="radio-inner" *ngIf="form.accessLevel === opt.value"></div>
                </div>
              </div>
              <div class="access-option__content">
                <div class="access-option__header">
                  <span class="access-option__title">{{ opt.label }}</span>
                  <fvdr-badge [label]="opt.badge" [variant]="opt.badgeVariant" />
                </div>
                <p class="access-option__desc">{{ opt.description }}</p>
                <div class="access-option__perms">
                  <span class="perm-tag" *ngFor="let p of opt.perms">{{ p }}</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- ── Step 3: Expiration ── -->
        <div class="modal-body" *ngIf="currentStep === 'expiration'">
          <p class="step-description">Set when this key should expire. Keys with expiration dates are more secure.</p>

          <div class="expiration-options">
            <label
              *ngFor="let opt of expirationOptions"
              class="exp-option"
              [class.exp-option--selected]="form.expiration === opt.value"
              (click)="form.expiration = opt.value"
            >
              <div class="radio-outer" [class.radio-outer--selected]="form.expiration === opt.value">
                <div class="radio-inner" *ngIf="form.expiration === opt.value"></div>
              </div>
              <div class="exp-option__content">
                <span class="exp-option__label">{{ opt.label }}</span>
                <span class="exp-option__hint" *ngIf="opt.hint">{{ opt.hint }}</span>
              </div>
              <fvdr-badge *ngIf="opt.recommended" label="Recommended" variant="success" />
            </label>

            <!-- Custom date row -->
            <div class="exp-custom" *ngIf="form.expiration === 'custom'">
              <fvdr-datepicker label="Custom expiration date" [(ngModel)]="form.customDate" />
            </div>
          </div>

          <fvdr-info-banner
            variant="info"
            message="We'll notify you 7 days before the key expires so you can rotate it in time."
          />
        </div>

        <!-- ── Step 4: Review ── -->
        <div class="modal-body" *ngIf="currentStep === 'review'">
          <p class="step-description">Review your settings before creating the key.</p>

          <div class="review-card">
            <div class="review-row">
              <span class="review-label">Key name</span>
              <span class="review-value">{{ form.name }}</span>
            </div>
            <div class="review-row" *ngIf="form.description">
              <span class="review-label">Description</span>
              <span class="review-value review-value--muted">{{ form.description }}</span>
            </div>
            <div class="review-row">
              <span class="review-label">Access level</span>
              <fvdr-badge [label]="accessLabelForValue(form.accessLevel)" [variant]="accessVariant(form.accessLevel)" />
            </div>
            <div class="review-row">
              <span class="review-label">Expires</span>
              <span class="review-value">{{ expirationLabel }}</span>
            </div>
          </div>

          <fvdr-info-banner
            variant="warning"
            message="Make sure to copy the key after creation. You won't be able to see it again."
          />
        </div>

        <!-- ── Success ── -->
        <div class="modal-body modal-body--success" *ngIf="currentStep === 'success'">
          <div class="success-icon">
            <fvdr-icon name="check" class="success-check"></fvdr-icon>
          </div>
          <h3 class="success-title">{{ form.name }} created</h3>
          <p class="success-desc">Copy your API key now. For security reasons, it won't be shown again.</p>

          <div class="key-display">
            <div class="key-display__label">Your API key</div>
            <div class="key-display__row">
              <span class="key-display__value">{{ generatedKey }}</span>
              <button class="copy-btn" (click)="copyKey()" [class.copy-btn--copied]="keyCopied" data-track="copy-generated-key">
                <fvdr-icon [name]="keyCopied ? 'check' : 'link'"></fvdr-icon>
                <span>{{ keyCopied ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <fvdr-info-banner
            variant="warning"
            message="Store this key securely. It won't be displayed again and cannot be recovered."
          />

          <div class="success-meta">
            <div class="success-meta__row">
              <fvdr-icon name="settings" class="meta-icon"></fvdr-icon>
              <span>Access: <strong>{{ accessLabelForValue(form.accessLevel) }}</strong></span>
            </div>
            <div class="success-meta__row">
              <fvdr-icon name="calendar" class="meta-icon"></fvdr-icon>
              <span>Expires: <strong>{{ expirationLabel }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="modal-footer">
          <ng-container *ngIf="currentStep !== 'success'">
            <fvdr-btn
              *ngIf="currentStep !== 'name'"
              label="Back"
              variant="ghost"
              size="m"
              (clicked)="prevStep()"
              data-track="modal-back"
            />
            <div class="footer-right">
              <fvdr-btn label="Cancel" variant="secondary" size="m" (clicked)="closeModal()" data-track="modal-cancel" />
              <fvdr-btn
                [label]="currentStep === 'review' ? 'Create key' : 'Continue'"
                variant="primary"
                size="m"
                (clicked)="nextStep()"
                data-track="modal-next"
              />
            </div>
          </ng-container>
          <ng-container *ngIf="currentStep === 'success'">
            <div class="footer-right">
              <fvdr-btn label="Done" variant="primary" size="m" (clicked)="closeModal()" data-track="modal-done" />
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
      --color-divider: #DEE0EB;
    }

    /* ── Shell ──────────────────────────────────────────────────── */
    .page-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-100);
    }

    /* ── Sidebar ─────────────────────────────────────────────────── */
    .sidebar {
      width: 280px;
      min-width: 280px;
      background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      display: flex;
      flex-direction: column;
      transition: width 0.22s ease, min-width 0.22s ease;
      overflow: hidden;
    }
    .sidebar--collapsed { width: 72px; min-width: 72px; }

    .account-switcher {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-4) var(--space-3);
      border-bottom: 1px solid var(--color-divider);
      cursor: pointer;
      min-height: 64px;
    }
    .account-logo { flex-shrink: 0; }
    .account-name {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-chevron { color: var(--color-stone-600); font-size: 16px; flex-shrink: 0; }

    .nav-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-2) 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      width: 100%;
      height: 32px;
      padding: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 14px;
      font-family: var(--font-family);
      text-align: left;
      gap: 0;
      position: relative;
    }
    .nav-item:hover { color: var(--color-text-primary); }
    .nav-item:hover .icon-default { display: none; }
    .nav-item:hover .icon-active { display: flex; }
    .nav-item--active { color: var(--color-text-primary); font-weight: 600; }
    .nav-item--active .icon-default { display: none; }
    .nav-item--active .icon-active  { display: flex; }

    .nav-icon-zone {
      width: 72px;
      min-width: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .nav-icon { position: relative; display: flex; align-items: center; justify-content: center; }
    .icon-default { display: flex; }
    .icon-active  { display: none; }
    .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-chevron { font-size: 16px; margin-right: var(--space-4); color: var(--color-stone-600); transition: transform 0.2s; }
    .nav-chevron--up { transform: rotate(180deg); }

    .nav-subitems { display: flex; flex-direction: column; }
    .nav-subitem {
      height: 32px;
      padding: 0 var(--space-4) 0 72px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--font-family);
      color: var(--color-text-secondary);
      text-align: left;
    }
    .nav-subitem:hover { color: var(--color-text-primary); background: var(--color-hover-bg); }
    .nav-subitem--active { color: var(--color-text-primary); font-weight: 600; }

    .sidebar-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-4);
      height: 72px;
      border-top: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: none;
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-stone-600);
      font-size: 16px;
      flex-shrink: 0;
    }
    .collapse-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Main area ───────────────────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Header ──────────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--space-6);
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .breadcrumb { display: flex; align-items: center; gap: var(--space-1); }
    .bc-item {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-family);
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-primary);
      padding: 4px 6px;
      border-radius: var(--radius-sm);
    }
    .bc-item--link { color: var(--color-text-secondary); font-weight: 400; }
    .bc-item--link:hover { color: var(--color-text-primary); background: var(--color-hover-bg); }
    .bc-chevron { font-size: 14px; color: var(--color-stone-600); }
    .bc-chevron--dim { opacity: 0.5; }

    .header-right { display: flex; align-items: center; gap: var(--space-3); }
    .theme-toggle {
      display: flex; align-items: center; gap: var(--space-2);
      background: none; border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-3);
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      font-family: var(--font-family);
    }
    .theme-toggle:hover { border-color: var(--color-stone-500); color: var(--color-text-primary); }
    .theme-toggle__icon { font-size: 16px; }
    .header-icon { font-size: 20px; color: var(--color-stone-600); cursor: pointer; }

    /* ── Content ─────────────────────────────────────────────────── */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .page-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1);
    }
    .page-subtitle {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* ── Stats row ───────────────────────────────────────────────── */
    .stats-row {
      display: flex;
      gap: var(--space-4);
    }
    .stat-card {
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 120px;
    }
    .stat-card--success { border-left: 3px solid var(--color-primary-500); }
    .stat-card--warning { border-left: 3px solid var(--color-warning-600); }
    .stat-value { font-size: 24px; font-weight: 700; color: var(--color-text-primary); }
    .stat-label { font-size: 12px; color: var(--color-text-secondary); }

    /* ── Table ───────────────────────────────────────────────────── */
    .table-container {
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .table-header {
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-divider);
    }
    .keys-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .keys-table th {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: var(--color-stone-100);
      border-bottom: 1px solid var(--color-divider);
      white-space: nowrap;
    }
    .keys-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      vertical-align: middle;
    }
    .keys-table__row:last-child td { border-bottom: none; }
    .keys-table__row:hover td { background: var(--color-stone-100); }

    .key-name-cell { display: flex; flex-direction: column; gap: 2px; }
    .key-name { font-weight: 500; color: var(--color-text-primary); font-size: 13px; }
    .key-prefix { font-size: 11px; color: var(--color-text-secondary); font-family: monospace; }
    .td--muted { color: var(--color-text-secondary); }

    .row-actions { display: flex; gap: var(--space-1); }
    .icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-stone-600);
      font-size: 14px;
    }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .icon-btn--danger:hover { background: #FFF0EE; color: var(--color-error-600); }

    .empty-row td { padding: var(--space-10); }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      text-align: center;
    }
    .empty-icon { font-size: 32px; color: var(--color-stone-500); }
    .empty-text { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

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
      border-bottom: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .modal-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
    .modal-close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      background: none; border: none; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: 16px;
    }
    .modal-close:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Step indicator ──────────────────────────────────────────── */
    .step-indicator {
      display: flex;
      align-items: center;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-100);
      flex-shrink: 0;
    }
    .step-dot-wrap {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
    }
    .step-dot {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
      border: 2px solid var(--color-stone-400);
      color: var(--color-stone-600);
      background: var(--color-stone-0);
      transition: all 0.2s;
    }
    .step-dot--active {
      border-color: var(--color-primary-500);
      color: var(--color-primary-500);
      background: var(--color-primary-50);
    }
    .step-dot--done {
      border-color: var(--color-primary-500);
      background: var(--color-primary-500);
      color: #fff;
    }
    .step-check { font-size: 14px; }
    .step-label { font-size: 11px; color: var(--color-text-secondary); white-space: nowrap; }
    .step-line {
      flex: 1;
      height: 2px;
      background: var(--color-stone-400);
      margin: 0 var(--space-2);
      margin-bottom: 16px;
      transition: background 0.2s;
    }
    .step-line--done { background: var(--color-primary-500); }

    /* ── Modal body ──────────────────────────────────────────────── */
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
    .step-description {
      font-size: 14px;
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
    .access-option__title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
    .access-option__desc { font-size: 13px; color: var(--color-text-secondary); margin: 0; }
    .access-option__perms { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .perm-tag {
      font-size: 11px;
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
    .exp-option__label { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
    .exp-option__hint { font-size: 12px; color: var(--color-text-secondary); }
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
    .review-label { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }
    .review-value { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
    .review-value--muted { font-weight: 400; color: var(--color-text-secondary); }

    /* Success */
    .modal-body--success { align-items: center; text-align: center; }
    .success-icon {
      width: 56px; height: 56px;
      background: var(--color-primary-50);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-1);
    }
    .success-check { font-size: 24px; color: var(--color-primary-500); }
    .success-title { font-size: 18px; font-weight: 600; margin: 0 0 var(--space-1); }
    .success-desc { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

    .key-display {
      width: 100%;
      background: var(--color-stone-100);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      text-align: left;
    }
    .key-display__label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-2); }
    .key-display__row { display: flex; align-items: center; gap: var(--space-3); }
    .key-display__value {
      flex: 1;
      font-family: monospace;
      font-size: 13px;
      color: var(--color-text-primary);
      word-break: break-all;
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
    }
    .copy-btn {
      display: flex; align-items: center; gap: var(--space-1);
      height: 36px; padding: 0 var(--space-3);
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 13px;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .copy-btn:hover { border-color: var(--color-primary-500); color: var(--color-primary-500); }
    .copy-btn--copied { border-color: var(--color-primary-500); color: var(--color-primary-500); background: var(--color-primary-50); }

    .success-meta {
      display: flex;
      gap: var(--space-6);
      background: var(--color-stone-100);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      width: 100%;
      justify-content: center;
    }
    .success-meta__row { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; color: var(--color-text-secondary); }
    .meta-icon { font-size: 14px; }

    /* Modal footer */
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-divider);
      flex-shrink: 0;
    }
    .footer-right { display: flex; gap: var(--space-3); margin-left: auto; }

    /* Delete confirm */
    .delete-confirm-text { font-size: 14px; color: var(--color-text-primary); margin: 0; line-height: 1.6; }

    /* ── Dark theme ──────────────────────────────────────────────── */
    .dark-theme.page-layout   { background: #1F2129; }
    .dark-theme .sidebar      { background: #212426; border-right-color: #33383B; }
    .dark-theme .account-switcher { border-bottom-color: #33383B; }
    .dark-theme .account-name { color: #FFFFFF; }
    .dark-theme .page-header  { background: #212426; border-bottom-color: #33383B; }
    .dark-theme .content-area { background: #1F2129; }
    .dark-theme .page-title   { color: #FFFFFF; }
    .dark-theme .stat-card    { background: #292D2F; border-color: #33383B; }
    .dark-theme .stat-value   { color: #FFFFFF; }
    .dark-theme .table-container { background: #292D2F; border-color: #33383B; }
    .dark-theme .keys-table th { background: #212426; border-bottom-color: #33383B; }
    .dark-theme .keys-table td { border-bottom-color: #33383B; }
    .dark-theme .keys-table__row:hover td { background: #33383B; }
    .dark-theme .sidebar-bottom { border-top-color: #33383B; }
    .dark-theme .step-indicator { background: #212426; border-bottom-color: #33383B; }
    .dark-theme .modal         { background: #292D2F; }
    .dark-theme .modal-header  { border-bottom-color: #33383B; }
    .dark-theme .modal-footer  { border-top-color: #33383B; }
    .dark-theme .access-option { border-color: #40464A; }
    .dark-theme .access-option:hover { background: #33383B; }
    .dark-theme .access-option--selected { background: rgba(44,156,116,0.12); }
    .dark-theme .exp-option { border-color: #40464A; }
    .dark-theme .exp-option--selected { background: rgba(44,156,116,0.12); }
    .dark-theme .review-card  { background: #212426; border-color: #33383B; }
    .dark-theme .review-row   { border-bottom-color: #33383B; }
    .dark-theme .key-display  { background: #212426; border-color: #33383B; }
    .dark-theme .key-display__value { background: #292D2F; border-color: #33383B; color: #B5BBBF; }
    .dark-theme .copy-btn     { background: #292D2F; border-color: #40464A; color: #B5BBBF; }
    .dark-theme .success-meta { background: #212426; border-color: #33383B; }
    .dark-theme .table-header { border-bottom-color: #33383B; }
    .dark-theme .perm-tag     { background: #33383B; color: #8B949A; }
  `],
})
export class CaCreateApiKeyComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast    = inject(ToastService);

  // ── Shell state ──────────────────────────────────────────────────────────
  sidebarCollapsed = false;
  isDark = false;

  // ── Nav ──────────────────────────────────────────────────────────────────
  navItems: NavItem[] = [
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

  toggleNavItem(item: NavItem) {
    if (item.children) {
      item.open = !item.open;
    }
    this.navItems.forEach(n => n.active = n.id === item.id);
  }

  // ── API Keys data ────────────────────────────────────────────────────────
  apiKeys: ApiKey[] = [
    {
      id: '1', name: 'Production backend', access: 'full',
      createdAt: 'Jan 12, 2025', expiresAt: 'Dec 31, 2025', lastUsed: '2 hours ago',
      status: 'active', prefix: 'sk_live_xK3m...R7pQ',
    },
    {
      id: '2', name: 'CI/CD pipeline', access: 'read-write',
      createdAt: 'Feb 3, 2025', expiresAt: 'Apr 10, 2025', lastUsed: '5 min ago',
      status: 'expiring', prefix: 'sk_live_9Bns...T1vW',
    },
    {
      id: '3', name: 'Analytics service', access: 'read-only',
      createdAt: 'Nov 20, 2024', expiresAt: null, lastUsed: 'Yesterday',
      status: 'active', prefix: 'sk_live_Lp2x...K0dM',
    },
    {
      id: '4', name: 'Legacy integration', access: 'read-only',
      createdAt: 'Aug 1, 2024', expiresAt: 'Jan 1, 2025', lastUsed: '45 days ago',
      status: 'expired', prefix: 'sk_live_m8Hq...A5jY',
    },
  ];

  searchQuery = '';
  get filteredKeys(): ApiKey[] {
    if (!this.searchQuery) return this.apiKeys;
    const q = this.searchQuery.toLowerCase();
    return this.apiKeys.filter(k => k.name.toLowerCase().includes(q) || k.prefix.toLowerCase().includes(q));
  }

  get activeCount()   { return this.apiKeys.filter(k => k.status === 'active').length; }
  get expiringCount() { return this.apiKeys.filter(k => k.status === 'expiring').length; }

  onSearch(q: string) { this.searchQuery = q; }

  accessLabel(access: ApiKey['access']): string {
    return { 'full': 'Full access', 'read-write': 'Read & Write', 'read-only': 'Read only' }[access] ?? access;
  }
  accessVariant(access: string): 'primary' | 'info' | 'neutral' {
    return { 'full': 'primary', 'read-write': 'info', 'read-only': 'neutral' }[access] as any ?? 'neutral';
  }
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
  currentStep: ModalStep = 'name';
  nameError = false;
  keyCopied = false;
  generatedKey = '';

  form: CreateKeyForm = {
    name: '',
    description: '',
    accessLevel: 'read-only',
    expiration: '90d',
    customDate: '',
  };

  steps: ModalStep[] = ['name', 'access', 'expiration', 'review'];
  stepLabels = ['Name', 'Access', 'Expiration', 'Review'];

  get stepIndex(): number {
    return this.steps.indexOf(this.currentStep as any);
  }

  accessOptions = [
    {
      value: 'read-only' as const,
      label: 'Read only',
      badge: 'Safe',
      badgeVariant: 'success' as const,
      description: 'Can read data but cannot make any changes.',
      perms: ['GET /projects', 'GET /participants', 'GET /reports'],
    },
    {
      value: 'read-write' as const,
      label: 'Read & Write',
      badge: 'Standard',
      badgeVariant: 'info' as const,
      description: 'Can read and modify data, but cannot delete resources or manage settings.',
      perms: ['GET /projects', 'POST /projects', 'PUT /projects', 'GET /participants'],
    },
    {
      value: 'full' as const,
      label: 'Full access',
      badge: 'Admin',
      badgeVariant: 'primary' as const,
      description: 'Full control over all resources. Use only for trusted internal services.',
      perms: ['GET/*', 'POST/*', 'PUT/*', 'DELETE/*'],
    },
  ];

  expirationOptions = [
    { value: '30d' as const,    label: '30 days',  hint: 'Expires ' + this.dateAfterDays(30) },
    { value: '90d' as const,    label: '90 days',  hint: 'Expires ' + this.dateAfterDays(90), recommended: true },
    { value: '1y'  as const,    label: '1 year',   hint: 'Expires ' + this.dateAfterDays(365) },
    { value: 'never' as const,  label: 'No expiration', hint: 'Key will never expire automatically' },
    { value: 'custom' as const, label: 'Custom date', hint: 'Choose a specific expiration date' },
  ];

  get expirationLabel(): string {
    const map: Record<string, string> = {
      '30d':   '30 days (' + this.dateAfterDays(30) + ')',
      '90d':   '90 days (' + this.dateAfterDays(90) + ')',
      '1y':    '1 year (' + this.dateAfterDays(365) + ')',
      'never': 'Never',
      'custom': this.form.customDate || 'Not set',
    };
    return map[this.form.expiration] ?? this.form.expiration;
  }

  private dateAfterDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  accessLabelForValue(v: string): string {
    return this.accessLabel(v as any);
  }

  openModal() {
    this.form = { name: '', description: '', accessLevel: 'read-only', expiration: '90d', customDate: '' };
    this.currentStep = 'name';
    this.nameError = false;
    this.keyCopied = false;
    this.generatedKey = '';
    this.modalOpen = true;
    this.tracker.trackTask('ca-create-api-key', 'task_complete');
  }

  closeModal() {
    this.modalOpen = false;
  }

  onOverlayClick() {
    if (this.currentStep !== 'success') {
      this.closeModal();
    }
  }

  nextStep() {
    if (this.currentStep === 'name') {
      if (!this.form.name.trim()) { this.nameError = true; return; }
      this.nameError = false;
      this.currentStep = 'access';
    } else if (this.currentStep === 'access') {
      this.currentStep = 'expiration';
    } else if (this.currentStep === 'expiration') {
      this.currentStep = 'review';
    } else if (this.currentStep === 'review') {
      this.createKey();
    }
  }

  prevStep() {
    if (this.currentStep === 'access')     this.currentStep = 'name';
    else if (this.currentStep === 'expiration') this.currentStep = 'access';
    else if (this.currentStep === 'review')     this.currentStep = 'expiration';
  }

  createKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const rand = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.generatedKey = `sk_live_${rand(8)}_${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`;
    this.currentStep = 'success';

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: this.form.name,
      access: this.form.accessLevel,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expiresAt: this.form.expiration === 'never' ? null : this.expirationLabel,
      lastUsed: null,
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
