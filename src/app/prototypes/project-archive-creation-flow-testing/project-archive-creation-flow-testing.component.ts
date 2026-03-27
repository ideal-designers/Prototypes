import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'project-archive-creation-flow-testing';

@Component({
  selector: 'fvdr-project-archive-creation-flow-testing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shell">

      <!-- ── Sidebar ────────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-top">

          <!-- Project switcher -->
          <div class="project-row">
            <div class="project-logo">PA</div>
            <span class="project-name">Project Alpha</span>
            <svg class="chevron" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="#5f616a" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Nav -->
          <nav>
            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="1" stroke="#5f616a" stroke-width="1.5"/>
                  <rect x="13" y="3" width="8" height="8" rx="1" stroke="#5f616a" stroke-width="1.5"/>
                  <rect x="3" y="13" width="8" height="8" rx="1" stroke="#5f616a" stroke-width="1.5"/>
                  <rect x="13" y="13" width="8" height="8" rx="1" stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Dashboard</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                        stroke="#5f616a" stroke-width="1.5"/>
                  <line x1="10" y1="11" x2="18" y2="11" stroke="#5f616a" stroke-width="1.5"/>
                  <line x1="10" y1="15" x2="18" y2="15" stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Documents</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="#5f616a" stroke-width="1.5"/>
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="#5f616a" stroke-width="1.5"/>
                  <path d="M19 8v6M16 11h6" stroke="#5f616a" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="nav-lbl">Participants</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#5f616a" stroke-width="1.5"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Permissions</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                        stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Q&amp;A</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 20V10M12 20V4M6 20v-6" stroke="#5f616a" stroke-width="1.5"
                        stroke-linecap="round"/>
                </svg>
              </span>
              <span class="nav-lbl">Reports</span>
              <svg class="nav-chevron" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#5f616a" stroke-width="1.3"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#5f616a" stroke-width="1.5"/>
                  <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"
                        stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Settings</span>
              <svg class="nav-chevron" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#5f616a" stroke-width="1.3"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>

            <!-- Active item -->
            <a class="nav-item nav-item--active">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 6l9-4 9 4v6c0 5.25-3.75 10.05-9 11.25C6.75 22.05 3 17.25 3 12V6z"
                        stroke="#1f2129" stroke-width="1.5"/>
                  <path d="M12 10v4M12 16.01V16" stroke="#1f2129" stroke-width="1.5"
                        stroke-linecap="round"/>
                </svg>
              </span>
              <span class="nav-lbl nav-lbl--bold">Project archiving</span>
            </a>

            <a class="nav-item">
              <span class="nav-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <polyline points="3 6 5 6 21 6" stroke="#5f616a" stroke-width="1.5"
                            stroke-linecap="round"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#5f616a"
                        stroke-width="1.5"/>
                  <path d="M10 11v6M14 11v6" stroke="#5f616a" stroke-width="1.5"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#5f616a" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="nav-lbl">Recycle bin</span>
            </a>
          </nav>
        </div>

        <!-- Footer -->
        <div class="sidebar-foot">
          <span class="ideals-logo">ideals.</span>
          <button class="collapse-btn" aria-label="Collapse">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M9 4L5 8l4 4" stroke="#5f616a" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 4L9 8l4 4" stroke="#5f616a" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                      stroke="#5f616a" stroke-width="1.5"/>
              </svg>
            </button>
            <button class="ic-btn" aria-label="Help">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#5f616a" stroke-width="1.5"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#5f616a" stroke-width="1.5"
                      stroke-linecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#5f616a" stroke-width="2"
                      stroke-linecap="round"/>
              </svg>
            </button>
            <div class="avatar">IR</div>
          </div>
        </header>

        <!-- Content -->
        <div class="content">

          <!-- USB Drive -->
          <section class="section" data-track="usb-drive-section">
            <div class="sec-hdr">
              <h2 class="sec-title">USB drive</h2>
              <button class="action-btn action-btn--green" data-track="place-order"
                      (click)="onPlaceOrder()">
                <svg viewBox="0 0 16 16" fill="none">
                  <rect x="4" y="1" width="8" height="10" rx="1" stroke="#2c9c74" stroke-width="1.3"/>
                  <path d="M8 11v4M5 15h6" stroke="#2c9c74" stroke-width="1.3"
                        stroke-linecap="round"/>
                  <circle cx="8" cy="5" r="1" fill="#2c9c74"/>
                </svg>
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
              <button class="action-btn action-btn--red" data-track="close-project"
                      (click)="onCloseProject()">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h2"
                        stroke="#e54430" stroke-width="1.3" stroke-linecap="round"
                        stroke-linejoin="round"/>
                </svg>
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
      <div class="chat-bubble" aria-label="Chat">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
        </svg>
      </div>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      display: flex;
      height: 100vh;
      font-family: 'Open Sans', sans-serif;
      background: #fff;
      overflow: hidden;
      position: relative;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 280px;
      min-width: 280px;
      height: 100%;
      background: #f7f7f7;
      border-right: 1px solid #dee0eb;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sidebar-top {
      display: flex;
      flex-direction: column;
      gap: 24px;
      flex: 1;
      overflow-y: auto;
    }

    .project-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      cursor: pointer;
    }
    .project-logo {
      width: 40px; height: 40px;
      background: #1a2e4a;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .project-name {
      flex: 1;
      font-size: 16px; font-weight: 600; color: #1f2129;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .chevron { width: 16px; height: 16px; flex-shrink: 0; }

    nav { display: flex; flex-direction: column; }
    .nav-item {
      display: flex;
      align-items: center;
      height: 48px;
      padding-right: 24px;
      cursor: pointer;
      text-decoration: none;
      color: #40424b;
      transition: background 0.12s;
    }
    .nav-item:hover { background: #eef0f8; }
    .nav-item--active { background: transparent; }
    .nav-ic {
      width: 72px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .nav-ic svg { width: 24px; height: 24px; }
    .nav-lbl {
      flex: 1;
      font-size: 16px; font-weight: 400; line-height: 24px; color: #40424b;
      white-space: nowrap;
    }
    .nav-lbl--bold { font-weight: 600; color: #1f2129; }
    .nav-chevron { width: 16px; height: 16px; flex-shrink: 0; }

    .sidebar-foot {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 16px 24px 24px;
      border-top: 1px solid #dee0eb;
    }
    .ideals-logo {
      font-size: 18px; font-weight: 800; color: #1f2129; font-style: italic;
    }
    .collapse-btn {
      background: none; border: none; cursor: pointer;
      padding: 0; display: flex; align-items: center;
    }
    .collapse-btn svg { width: 16px; height: 16px; }

    /* ── Main ── */
    .main {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
    }

    .top-bar {
      height: 64px; min-height: 64px;
      background: white; border-bottom: 1px solid #dee0eb;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    }
    .breadcrumb { font-size: 16px; font-weight: 600; color: #1f2129; }
    .hdr-actions { display: flex; align-items: center; gap: 24px; }
    .ic-btn {
      background: none; border: none; cursor: pointer;
      width: 24px; height: 24px; padding: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .ic-btn svg { width: 20px; height: 20px; }
    .avatar {
      width: 40px; height: 40px;
      background: #eceef9; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 400; color: #1f2129;
    }

    .content {
      flex: 1; overflow-y: auto;
      padding: 24px;
      display: flex; flex-direction: column; gap: 0;
    }

    .section {
      display: flex; flex-direction: column; gap: 16px;
      padding-bottom: 24px;
      max-width: 632px;
    }
    .sec-hdr {
      display: flex; align-items: center; justify-content: space-between;
    }
    .sec-title { font-size: 16px; font-weight: 600; color: #1f2129; line-height: 24px; }

    .action-btn {
      display: flex; align-items: center; gap: 8px;
      background: none; border: none; cursor: pointer;
      font-size: 15px; font-weight: 400; font-family: inherit;
      padding: 0; line-height: 16px;
      transition: opacity 0.12s;
    }
    .action-btn:hover { opacity: 0.75; }
    .action-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
    .action-btn--green { color: #2c9c74; }
    .action-btn--red   { color: #e54430; }

    .bullet-list {
      padding-left: 22px;
      display: flex; flex-direction: column;
    }
    .bullet-list li {
      font-size: 15px; font-weight: 400; color: #1f2129; line-height: 24px;
      list-style: disc;
    }

    .divider {
      height: 1px; border: none;
      background: #dee0eb;
      max-width: 632px;
      margin-bottom: 24px;
    }

    .sec-desc { font-size: 15px; font-weight: 400; color: #1f2129; line-height: 24px; }

    /* ── Chat bubble ── */
    .chat-bubble {
      position: fixed; bottom: 24px; right: 24px;
      width: 62px; height: 62px;
      background: #2c9c74; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
    }
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
