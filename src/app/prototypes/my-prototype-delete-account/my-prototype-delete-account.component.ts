import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'fvdr-my-prototype-delete-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Left sidebar 280px ── -->
      <nav class="sidebar">
        <div class="sidebar-divider"></div>

        <div class="sidebar-inner">
          <div class="sidebar-top">

            <!-- Account switcher -->
            <div class="account-switcher">
              <div class="account-icon">
                <!-- Ideals mark -->
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="5" cy="10" r="3" fill="white" opacity="0.9"/>
                  <circle cx="10" cy="10" r="5" stroke="white" stroke-width="1.5" fill="none" opacity="0.9"/>
                  <circle cx="15" cy="10" r="2" fill="white" opacity="0.6"/>
                </svg>
              </div>
              <span class="account-name">My account</span>
            </div>

            <!-- Nav -->
            <nav class="nav-list">
              <button class="nav-item" *ngFor="let item of navItems" [class.nav-item--active]="item.active">
                <span class="nav-icon-wrap">
                  <fvdr-icon [name]="item.icon" />
                </span>
                <span class="nav-label">{{ item.label }}</span>
              </button>
            </nav>

          </div>

          <!-- Bottom: ideals. logo + collapse -->
          <div class="sidebar-bottom">
            <svg width="65" height="14" viewBox="0 0 117 24" fill="none" class="ideals-logo">
              <path d="M0.380615 3.0228C0.380615 1.67609 1.47081 0.650024 2.84959 0.650024C4.1963 0.650024 5.25444 1.67609 5.25444 3.0228C5.25444 4.40158 4.1963 5.39558 2.84959 5.39558C1.43875 5.39558 0.380615 4.40158 0.380615 3.0228ZM0.861584 22.967V7.25533H4.67727V22.967H0.861584Z" fill="#73757F"/>
              <path d="M23.2427 1.00281V22.9991H19.5232V20.947C18.3689 22.3258 16.7336 23.3839 14.457 23.3839C9.93588 23.3839 6.56909 19.8247 6.56909 15.1433C6.56909 10.526 9.96794 6.93476 14.4249 6.93476C16.6694 6.93476 18.2727 7.96083 19.427 9.30754V1.00281H23.2427ZM19.6514 15.1112C19.6514 12.514 17.8238 10.3336 15.0021 10.3336C12.2125 10.3336 10.3848 12.514 10.3848 15.1112C10.3848 17.7726 12.2125 19.9209 15.0021 19.9209C17.7917 19.9209 19.6514 17.7405 19.6514 15.1112Z" fill="#73757F"/>
              <path d="M40.9744 16.4579H28.886C29.367 18.478 30.8419 20.0812 33.7278 20.0812C35.5234 20.0812 37.5755 19.4078 38.9543 18.4459L40.4613 21.1393C38.9864 22.2295 36.4533 23.3197 33.5674 23.3197C27.6034 23.3197 24.9741 19.2796 24.9741 15.1112C24.9741 10.4298 28.2768 6.90265 33.2147 6.90265C37.6717 6.90265 41.0706 9.82053 41.0706 14.7905C41.1026 15.4318 41.0385 15.9449 40.9744 16.4579ZM28.886 13.6041H37.3511C37.0304 11.3917 35.3951 10.045 33.2147 10.045C31.0343 10.045 29.399 11.4238 28.886 13.6041Z" fill="#73757F"/>
              <path d="M59.1871 7.28742V22.967H55.5638V21.0431C54.3774 22.3899 52.6779 23.3518 50.4014 23.3518C45.8161 23.3518 42.5455 19.6964 42.5455 15.0471C42.5455 10.3336 45.8803 6.90265 50.4014 6.90265C52.6779 6.90265 54.3453 7.92872 55.5638 9.27543V7.28742H59.1871ZM55.66 15.1112C55.66 12.514 53.7681 10.3336 50.9785 10.3336C48.1889 10.3336 46.3292 12.514 46.3292 15.1112C46.3292 17.7405 48.1889 19.9209 50.9785 19.9209C53.7361 19.9209 55.66 17.7405 55.66 15.1112Z" fill="#73757F"/>
              <path d="M61.5919 22.9671V1.00281H65.3755V22.9991H61.5919V22.9671Z" fill="#73757F"/>
              <path d="M66.9468 20.2735L69.0951 17.9649C70.1853 19.3757 71.8206 20.1773 73.3597 20.1773C74.7385 20.1773 75.7004 19.4399 75.7004 18.5421C75.7004 17.8687 75.2515 17.4198 74.514 17.035C73.6162 16.5861 71.5641 15.9128 70.5701 15.3997C68.7745 14.534 67.9087 13.1231 67.9087 11.3916C67.9087 8.69822 70.1532 6.74228 73.6803 6.74228C75.7004 6.74228 77.6884 7.4477 79.1313 9.05093L77.1433 11.4558C76.0211 10.3015 74.6743 9.82048 73.5841 9.82048C72.3657 9.82048 71.6603 10.4938 71.6603 11.2955C71.6603 11.8406 72.013 12.4498 73.0391 12.8346C74.0651 13.2514 75.6042 13.7644 76.8547 14.4057C78.6183 15.3356 79.5482 16.554 79.5482 18.4138C79.5482 21.2034 77.1433 23.3838 73.3918 23.3838C70.8587 23.3838 68.4538 22.3577 66.9468 20.2735Z" fill="#73757F"/>
              <path d="M80.51 21.1714C80.51 19.9209 81.5361 18.959 82.8187 18.959C84.0371 18.959 85.0311 19.9209 85.0311 21.1714C85.0311 22.4861 84.0371 23.416 82.8187 23.416C81.5361 23.448 80.51 22.4861 80.51 21.1714Z" fill="#73757F"/>
            </svg>
            <button class="collapse-btn" title="Collapse">
              <fvdr-icon name="angle-double-left" />
            </button>
          </div>
        </div>
      </nav>

      <!-- ── Right area ── -->
      <div class="main-area">

        <!-- Header 64px -->
        <header class="page-header">
          <span class="breadcrumb-title">Security settings</span>
          <div class="header-actions">
            <button class="icon-btn" title="Dark theme">
              <fvdr-icon name="theme-dark" />
            </button>
            <button class="icon-btn" title="Help">
              <fvdr-icon name="help" />
            </button>
            <button class="icon-btn" title="Applications">
              <fvdr-icon name="nav-api" />
            </button>
            <div class="avatar-circle">TN</div>
          </div>
        </header>

        <!-- Scrollable content -->
        <div class="content-scroll">
          <div class="content-inner">

            <!-- Password -->
            <section class="section">
              <div class="section-row">
                <span class="section-label">Password</span>
                <div class="link-btn-row">
                  <fvdr-icon name="edit" class="link-icon" />
                  <button class="link-btn">Change</button>
                </div>
              </div>
              <div class="meta-row">
                <fvdr-icon name="clock" class="meta-icon" />
                <span class="meta-text">Last changed on Sep 25, 2022</span>
              </div>
            </section>

            <!-- 2-step verification -->
            <section class="section">
              <div class="section-row">
                <span class="section-label">2-step verification</span>
                <fvdr-toggle [(ngModel)]="twoFactorEnabled" />
              </div>
              <p class="section-desc">Protect your account with an extra layer of security during sign-in</p>

              <div class="device-tile" *ngIf="twoFactorEnabled">
                <div class="device-tile__icon-wrap">
                  <div class="device-tile__icon">
                    <!-- SMS icon -->
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="#5F616A" stroke-width="1.5" fill="none"/>
                      <path d="M1 6h14" stroke="#5F616A" stroke-width="1.5"/>
                      <circle cx="5" cy="10" r="1" fill="#5F616A"/>
                      <circle cx="8" cy="10" r="1" fill="#5F616A"/>
                      <circle cx="11" cy="10" r="1" fill="#5F616A"/>
                    </svg>
                  </div>
                </div>
                <div class="device-tile__info">
                  <span class="device-tile__name">Code by text message</span>
                  <span class="device-tile__meta">+380*****4050</span>
                </div>
              </div>
            </section>

            <!-- Recovery codes -->
            <section class="section">
              <div class="section-row">
                <span class="section-label">Recovery codes</span>
                <div class="link-btn-row">
                  <fvdr-icon name="lock-open" class="link-icon" />
                  <button class="link-btn">View</button>
                </div>
              </div>
              <div class="meta-row">
                <fvdr-icon name="clock" class="meta-icon" />
                <span class="meta-text">Generated on Oct 17, 2023</span>
              </div>
            </section>

            <!-- Sessions -->
            <section class="section">
              <div class="section-col">
                <span class="section-label">Sessions</span>
                <p class="section-desc">You're currently signed in to Ideals on these devices. If you don't recognize a device, sign out to keep your account secure.</p>
              </div>

              <!-- Session: desktop -->
              <div class="device-tile">
                <div class="device-tile__icon-wrap">
                  <div class="device-tile__icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="2" width="14" height="10" rx="1" stroke="#5F616A" stroke-width="1.5" fill="none"/>
                      <path d="M5 14h6M8 12v2" stroke="#5F616A" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>
                <div class="device-tile__info">
                  <div class="device-tile__row">
                    <span class="device-tile__name">macOS X / Chrome</span>
                    <div class="current-chip">Current session</div>
                  </div>
                  <span class="device-tile__meta">Kyiv, Ukraine</span>
                </div>
              </div>

              <!-- Session: mobile -->
              <div class="device-tile">
                <div class="device-tile__icon-wrap">
                  <div class="device-tile__icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="4" y="1" width="8" height="14" rx="1.5" stroke="#5F616A" stroke-width="1.5" fill="none"/>
                      <circle cx="8" cy="12.5" r="0.75" fill="#5F616A"/>
                    </svg>
                  </div>
                </div>
                <div class="device-tile__info">
                  <span class="device-tile__name">iOS / Safari</span>
                  <div class="device-tile__meta-row">
                    <span class="device-tile__meta">Odesa, Ukraine</span>
                    <span class="dot"></span>
                    <span class="device-tile__meta">Today, 12:19 PM</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Delete account -->
            <section class="section">
              <div class="section-col">
                <span class="section-label">Delete account</span>
                <p class="section-desc">If no longer wish to use Ideals, you can permanently delete your account</p>
              </div>
              <fvdr-btn
                label="Delete my account"
                variant="danger"
                size="m"
                (clicked)="openDeleteModal()"
                data-track="delete-account-open"
              />
            </section>

          </div>
        </div>
      </div>

      <!-- Chat FAB -->
      <div class="chat-fab">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z" fill="white" opacity="0.9"/>
        </svg>
      </div>
    </div>

    <!-- ── Delete modal ── -->
    <fvdr-modal
      [visible]="showDeleteModal"
      title="Delete my account"
      size="m"
      confirmLabel="Delete my account"
      confirmVariant="danger"
      cancelLabel="Cancel"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="closeDeleteModal()"
      (closed)="closeDeleteModal()"
    >
      <p class="modal-text">
        You are about to permanently delete your account and all associated data.
        This action cannot be undone. You will immediately lose access to all projects,
        documents, and settings.
      </p>
    </fvdr-modal>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      --color-border:   #DEE0EB;
      --color-divider:  #DEE0EB;
    }

    /* ── Page layout ── */
    .page-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-stone-0);
      position: relative;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px;
      flex-shrink: 0;
      background: var(--color-stone-100);
      position: relative;
    }
    .sidebar-divider {
      position: absolute;
      top: 0; bottom: 0;
      right: 0;
      width: 1px;
      background: var(--color-divider);
    }
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .sidebar-top { display: flex; flex-direction: column; gap: var(--space-6); }

    /* Account switcher */
    .account-switcher {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-100);
    }
    .account-icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-500);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .account-name {
      font-size: var(--text-label-l-size);
      font-weight: var(--text-label-l-weight);
      color: var(--color-text-primary);
    }

    /* Nav list */
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0 0 0 0;
    }
    .nav-item {
      display: flex;
      align-items: center;
      height: 40px;
      padding-right: var(--space-4);
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--text-body1-size);
      color: var(--color-text-primary);
      width: 100%;
      text-align: left;
      gap: 0;
    }
    .nav-item:hover { background: var(--color-hover-bg); }
    .nav-item--active {
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .nav-icon-wrap {
      width: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: 20px;
      flex-shrink: 0;
    }
    .nav-item--active .nav-icon-wrap { color: var(--color-text-primary); }
    .nav-label { flex: 1; }

    /* Sidebar bottom */
    .sidebar-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-6) var(--space-4) var(--space-6) var(--space-6);
    }
    .ideals-logo { display: block; }
    .collapse-btn {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 16px;
    }
    .collapse-btn:hover { color: var(--color-text-primary); }

    /* ── Main area ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Header */
    .page-header {
      height: 64px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }
    .breadcrumb-title {
      font-size: var(--text-label-l-size);
      font-weight: var(--text-label-l-weight);
      color: var(--color-text-primary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }
    .icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px;
      border: none; background: transparent; cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 20px;
      border-radius: var(--radius-sm);
    }
    .icon-btn:hover { color: var(--color-text-primary); }
    .avatar-circle {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--color-stone-300);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-body1-size);
      color: var(--color-text-primary);
    }

    /* Scrollable content */
    .content-scroll {
      flex: 1;
      overflow-y: auto;
    }
    .content-inner {
      width: 520px;
      margin: var(--space-6) var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
      padding-bottom: var(--space-8);
    }

    /* ── Section ── */
    .section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .section-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .section-label {
      font-size: var(--text-label-m-size);
      font-weight: var(--text-label-m-weight);
      color: var(--color-text-primary);
      line-height: 20px;
    }
    .section-desc {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      line-height: 20px;
      margin: 0;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .meta-icon { font-size: 14px; color: var(--color-text-secondary); }
    .meta-text { font-size: var(--text-body3-size); color: var(--color-text-secondary); }

    /* Link button */
    .link-btn-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .link-icon { font-size: 16px; color: var(--color-primary-500); }
    .link-btn {
      border: none; background: transparent; cursor: pointer;
      font-family: var(--font-family);
      font-size: 15px;
      color: var(--color-primary-500);
      padding: 0;
    }
    .link-btn:hover { text-decoration: underline; }

    /* ── Device tile ── */
    .device-tile {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--color-stone-0);
    }
    .device-tile__icon-wrap {
      background: var(--color-stone-200);
      align-self: stretch;
      display: flex;
      align-items: center;
      padding: 0 var(--space-2);
    }
    .device-tile__icon {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-sm);
    }
    .device-tile__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-4) var(--space-4) 0;
    }
    .device-tile__row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .device-tile__name {
      font-size: var(--text-body3-size);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 20px;
    }
    .device-tile__meta {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      line-height: 20px;
    }
    .device-tile__meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .dot {
      width: 2px; height: 2px;
      border-radius: 50%;
      background: var(--color-text-secondary);
      flex-shrink: 0;
    }

    /* Current session chip */
    .current-chip {
      display: flex;
      align-items: center;
      height: 28px;
      padding: 0 var(--space-3);
      background: var(--color-stone-300);
      border-radius: var(--radius-full);
      font-size: var(--text-body3-size);
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* ── Chat FAB ── */
    .chat-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px; height: 48px;
      border-radius: 50%;
      background: var(--color-primary-500);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-toast);
    }
    .chat-fab:hover { background: var(--color-primary-600); }

    /* ── Modal body ── */
    .modal-text {
      font-size: var(--text-body1-size);
      color: var(--color-text-primary);
      line-height: 24px;
      margin: 0;
    }
  `],
})
export class MyPrototypeDeleteAccountComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  twoFactorEnabled = true;
  showDeleteModal = false;

  navItems = [
    { label: 'Corporate account', icon: 'nav-overview' as const,      active: false },
    { label: 'All projects',      icon: 'nav-projects' as const,      active: false },
    { label: 'Personal info',     icon: 'participants' as const,      active: false },
    { label: 'Security settings', icon: 'lock-close' as const,        active: true  },
  ];

  ngOnInit(): void {
    this.tracker.trackPageView('my-prototype-delete-account');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
    // trackTask only supports 'task_complete' | 'task_fail' — opening modal is not a task result
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.tracker.trackTask('my-prototype-delete-account', 'task_fail');
  }

  onDeleteConfirmed(): void {
    this.showDeleteModal = false;
    this.tracker.trackTask('my-prototype-delete-account', 'task_complete');
  }
}
