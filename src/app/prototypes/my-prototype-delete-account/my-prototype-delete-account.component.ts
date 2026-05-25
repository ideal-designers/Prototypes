import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, SidebarNavItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'fvdr-my-prototype-delete-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-layout">

      <!-- ── Left sidebar 280px ── -->
      <fvdr-sidebar-nav
        variant="internal"
        accountName="My account"
        [items]="navItems"
        [(collapsed)]="sidebarCollapsed"
        (itemClick)="onNavItemClick($event)"
      ></fvdr-sidebar-nav>

      <!-- ── Right area ── -->
      <div class="main-area">

        <!-- Header 64px -->
        <fvdr-page-header title="Security settings"></fvdr-page-header>

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
    }

    /* ── Page layout ── */
    .page-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-stone-0);
      position: relative;
    }


    /* ── Main area ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
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
      border: 1px solid var(--color-border);
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
  sidebarCollapsed = false;

  navItems: SidebarNavItem[] = [
    { id: 'corporate', label: 'Corporate account', icon: 'nav-overview',     iconActive: 'nav-overview-active',     active: false },
    { id: 'projects',  label: 'All projects',      icon: 'nav-projects',     iconActive: 'nav-projects-active',     active: false },
    { id: 'personal',  label: 'Personal info',     icon: 'nav-participants', iconActive: 'nav-participants-active', active: false },
    { id: 'security',  label: 'Security settings', icon: 'lock-close',       iconActive: 'lock-open',              active: true  },
  ];

  onNavItemClick(item: SidebarNavItem): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
  }

  ngOnInit(): void {
    this.tracker.trackPageView('my-prototype-delete-account');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
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
