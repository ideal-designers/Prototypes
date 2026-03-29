import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'project-archive-creation-flow-testing';

@Component({
  selector: 'fvdr-project-archive-creation-flow-testing',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">

      <!-- ── Sidebar ────────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-top">

          <!-- Project switcher -->
          <div class="project-row">
            <div class="project-logo">PA</div>
            <span class="project-name">Project Alpha</span>
            <span class="nav-ic-sm"><fvdr-icon name="chevron-down" /></span>
          </div>

          <!-- Nav -->
          <nav>
            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="overview" /></span>
              <span class="nav-lbl">Dashboard</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                        stroke="currentColor" stroke-width="1.5"/>
                  <line x1="10" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="10" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Documents</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="participants" /></span>
              <span class="nav-lbl">Participants</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="lock-close" /></span>
              <span class="nav-lbl">Permissions</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                        stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Q&amp;A</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="reports" /></span>
              <span class="nav-lbl">Reports</span>
              <span class="nav-ic-sm"><fvdr-icon name="chevron-down" /></span>
            </a>

            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="settings" /></span>
              <span class="nav-lbl">Settings</span>
              <span class="nav-ic-sm"><fvdr-icon name="chevron-down" /></span>
            </a>

            <!-- Active item -->
            <a class="nav-item nav-item--active">
              <span class="nav-ic nav-ic--active">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6l9-4 9 4v6c0 5.25-3.75 10.05-9 11.25C6.75 22.05 3 17.25 3 12V6z"
                        stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 10v4M12 16.01V16" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round"/>
                </svg>
              </span>
              <span class="nav-lbl nav-lbl--active">Project archiving</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic"><fvdr-icon name="trash" /></span>
              <span class="nav-lbl">Recycle bin</span>
            </a>
          </nav>
        </div>

        <!-- Footer -->
        <div class="sidebar-foot">
          <span class="ideals-logo">ideals.</span>
          <button class="collapse-btn" aria-label="Collapse">
            <fvdr-icon name="angle-double-left" />
          </button>
        </div>
      </aside>

      <!-- ── Main ────────────────────────────────────────────────── -->
      <div class="main">

        <!-- Header -->
        <header class="top-bar">
          <span class="breadcrumb">Project archiving</span>
          <div class="hdr-actions">
            <button class="ic-btn" aria-label="Dark mode">
              <fvdr-icon name="theme-dark" />
            </button>
            <button class="ic-btn" aria-label="Help">
              <fvdr-icon name="help" />
            </button>
            <fvdr-avatar initials="IR" size="md" />
          </div>
        </header>

        <!-- Content -->
        <div class="content">

          <!-- USB Drive -->
          <section class="section" data-track="usb-drive-section">
            <div class="sec-hdr">
              <h2 class="sec-title">USB drive</h2>
              <button class="action-btn action-btn--primary" data-track="place-order"
                      (click)="onPlaceOrder()">
                <fvdr-icon name="storage" />
                Place order
              </button>
            </div>
            <ul class="bullet-list">
              <li>Each USB drive is encrypted, password- and write-protected.</li>
              <li>Comfort letter is provided for each recipient.</li>
              <li>Estimated delivery date to Luxembourg: Sep 20, 2023</li>
            </ul>
          </section>

          <hr class="divider"/>

          <!-- Project closure -->
          <section class="section" data-track="project-closure-section">
            <div class="sec-hdr">
              <h2 class="sec-title">Project closure</h2>
              <button class="action-btn action-btn--danger" data-track="close-project"
                      (click)="onCloseProject()">
                <fvdr-icon name="cancel" />
                Close project
              </button>
            </div>
            <p class="sec-desc">
              Access will be terminated on the selected time for all participants,
              including administrators
            </p>
          </section>

        </div><!-- /content -->
      </div><!-- /main -->

      <!-- Chat bubble -->
      <button class="chat-bubble" aria-label="Chat">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
        </svg>
      </button>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      display: flex;
      height: 100vh;
      font-family: var(--font-family);
      background: var(--color-stone-0);
      overflow: hidden;
      position: relative;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px;
      min-width: 280px;
      height: 100%;
      background: var(--color-stone-200);
      border-right: 1px solid var(--color-divider);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sidebar-top {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      flex: 1;
      overflow-y: auto;
    }

    .project-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
    }
    .project-logo {
      width: 40px; height: 40px;
      background: #1a2e4a;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--color-stone-0);
      flex-shrink: 0;
    }
    .project-name {
      flex: 1;
      font-size: var(--text-label-l-size);
      font-weight: var(--text-label-l-weight);
      color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    nav { display: flex; flex-direction: column; }
    .nav-item {
      display: flex;
      align-items: center;
      height: var(--tab-height);
      padding-right: var(--space-6);
      cursor: pointer;
      text-decoration: none;
      color: var(--color-stone-700);
      font-size: 20px;
      transition: background 0.12s;
    }
    .nav-item:hover { background: var(--color-hover-bg); }
    .nav-ic {
      width: 72px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: 20px;
    }
    .nav-ic svg { width: 24px; height: 24px; }
    .nav-ic--active { color: var(--color-text-primary); }
    .nav-ic-sm {
      display: flex; align-items: center;
      font-size: 16px;
      color: var(--color-stone-600);
    }
    .nav-lbl {
      flex: 1;
      font-size: var(--text-base-l-size);
      font-weight: var(--text-base-l-weight);
      line-height: var(--text-base-l-lh);
      color: var(--color-stone-900);
      white-space: nowrap;
    }
    .nav-lbl--active {
      font-weight: var(--text-base-l-sb-weight);
      color: var(--color-text-primary);
    }
    .nav-item--active { background: transparent; }

    .sidebar-foot {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-6) var(--space-4) var(--space-6) var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
    .ideals-logo {
      font-size: var(--text-sub2-size);
      font-weight: 800;
      color: var(--color-text-primary);
      font-style: italic;
    }
    .collapse-btn {
      display: flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer;
      width: 32px; height: 32px;
      border-radius: var(--radius-sm);
      color: var(--color-stone-600);
      font-size: 18px;
      transition: background 0.12s, color 0.12s;
    }
    .collapse-btn:hover {
      background: var(--color-hover-bg);
      color: var(--color-text-primary);
    }

    /* ── Main ── */
    .main {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
    }

    .top-bar {
      height: 64px; min-height: 64px;
      background: var(--color-stone-0);
      border-bottom: 1px solid var(--color-divider);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6);
      flex-shrink: 0;
    }
    .breadcrumb {
      font-size: var(--text-label-l-size);
      font-weight: var(--text-label-l-weight);
      color: var(--color-text-primary);
    }
    .hdr-actions { display: flex; align-items: center; gap: var(--space-6); }
    .ic-btn {
      background: none; border: none; cursor: pointer;
      width: 24px; height: 24px; padding: 0;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-stone-600);
      font-size: 20px;
      border-radius: var(--radius-sm);
      transition: color 0.12s;
    }
    .ic-btn:hover { color: var(--color-text-primary); }

    .content {
      flex: 1; overflow-y: auto;
      padding: var(--space-6);
      display: flex; flex-direction: column; gap: 0;
    }

    .section {
      display: flex; flex-direction: column; gap: var(--space-4);
      padding-bottom: var(--space-6);
      max-width: 632px;
    }
    .sec-hdr {
      display: flex; align-items: center; justify-content: space-between;
    }
    .sec-title {
      font-size: var(--text-label-l-size);
      font-weight: var(--text-label-l-weight);
      color: var(--color-text-primary);
      line-height: var(--text-label-l-lh);
    }

    .action-btn {
      display: flex; align-items: center; gap: var(--space-2);
      background: none; border: none; cursor: pointer;
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      font-family: var(--font-family);
      padding: 0; line-height: 1;
      transition: opacity 0.12s;
      font-size: 16px;
    }
    .action-btn:hover { opacity: 0.75; }
    .action-btn--primary { color: var(--color-primary-500); }
    .action-btn--danger   { color: var(--color-error-600); }

    .bullet-list {
      padding-left: 22px;
      display: flex; flex-direction: column;
    }
    .bullet-list li {
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      color: var(--color-text-primary);
      line-height: var(--text-base-m-lh);
      list-style: disc;
    }

    .divider {
      height: 1px; border: none;
      background: var(--color-divider);
      max-width: 632px;
      margin-bottom: var(--space-6);
    }

    .sec-desc {
      font-size: var(--text-base-m-size);
      font-weight: var(--text-base-m-weight);
      color: var(--color-text-primary);
      line-height: var(--text-base-m-lh);
    }

    /* ── Chat bubble ── */
    .chat-bubble {
      position: fixed; bottom: var(--space-6); right: var(--space-6);
      width: 62px; height: 62px;
      background: var(--color-primary-500);
      border: none; border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-popover);
      transition: background 0.15s;
    }
    .chat-bubble:hover { background: var(--color-primary-600); }
    .chat-bubble svg { width: 28px; height: 28px; }
  `],
})
export class ProjectArchiveCreationFlowTestingComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit(): void {
    this.tracker.trackPageView(SLUG);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  onPlaceOrder(): void {
    this.tracker.trackTask(SLUG, 'task_complete', 'place_order');
  }

  onCloseProject(): void {
    this.tracker.trackTask(SLUG, 'task_fail', 'close_project');
  }
}
