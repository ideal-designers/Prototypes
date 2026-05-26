import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, SegmentItem, TreeNode, TableColumn, SidebarNavItem, QuickAccessItem, ToastService, HeaderAction, BreadcrumbItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import lottie, { AnimationItem } from 'lottie-web';

type PageState = 'popup' | 'upload' | 'loading' | 'generated' | 'creating' | 'created';

const FOLDER_TREE_NODES: TreeNode[] = [
  { id: '1', label: '1. Corporate Structure', icon: 'folder', children: [
    { id: '1.1', label: '1.1 Articles of Incorporation', icon: 'folder' },
    { id: '1.2', label: '1.2 Bylaws & Board Resolutions', icon: 'folder' },
  ]},
  { id: '2', label: '2. Financial Information', icon: 'folder', children: [
    { id: '2.1', label: '2.1 Audited Financial Statements', icon: 'folder' },
    { id: '2.2', label: '2.2 Management Accounts', icon: 'folder' },
    { id: '2.3', label: '2.3 Financial Projections', icon: 'folder' },
  ]},
  { id: '3', label: '3. Legal & Compliance', icon: 'folder', children: [
    { id: '3.1', label: '3.1 Material Contracts', icon: 'folder' },
    { id: '3.2', label: '3.2 Litigation & Disputes', icon: 'folder' },
    { id: '3.3', label: '3.3 Regulatory Approvals', icon: 'folder' },
  ]},
  { id: '4', label: '4. Intellectual Property', icon: 'folder', children: [
    { id: '4.1', label: '4.1 Patents & Trademarks', icon: 'folder' },
    { id: '4.2', label: '4.2 Licensing Agreements', icon: 'folder' },
  ]},
  { id: '5', label: '5. Human Resources', icon: 'folder', children: [
    { id: '5.1', label: '5.1 Key Employee Contracts', icon: 'folder' },
    { id: '5.2', label: '5.2 Benefits & Compensation', icon: 'folder' },
  ]},
  { id: '6', label: '6. Tax', icon: 'folder', children: [
    { id: '6.1', label: '6.1 Tax Returns', icon: 'folder' },
    { id: '6.2', label: '6.2 Transfer Pricing Documents', icon: 'folder' },
  ]},
];

/** Flat list of root-level folders for the destination picker */
const DEST_PICKER_NODES: TreeNode[] = [
  { id: 'root', label: 'Documents', icon: 'folder', children: [
    { id: 'p1', label: '1. Corporate Structure', icon: 'folder' },
    { id: 'p2', label: '2. Financial Information', icon: 'folder' },
    { id: 'p3', label: '3. Legal & Compliance', icon: 'folder' },
    { id: 'p4', label: '4. Intellectual Property', icon: 'folder' },
    { id: 'p5', label: '5. Human Resources', icon: 'folder' },
    { id: 'p6', label: '6. Tax', icon: 'folder' },
  ]},
];

const CREATED_COLUMNS: TableColumn[] = [
  { key: 'name',      label: 'Name',       width: '28%' },
  { key: 'notes',     label: 'Notes',      width: '20%' },
  { key: 'labels',    label: 'Labels',     width: '16%' },
  { key: 'pages',     label: 'Pages',      width: '10%' },
  { key: 'createdOn', label: 'Created on', width: '16%' },
];

const CREATED_ROWS: Record<string, string>[] = [
  { name: '1. Corporate Structure',  notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
  { name: '2. Financial Information', notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
  { name: '3. Legal & Compliance',   notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
  { name: '4. Intellectual Property', notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
  { name: '5. Human Resources',      notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
  { name: '6. Tax',                  notes: '', labels: '', pages: '', createdOn: 'May 25, 2026' },
];

@Component({
  selector: 'fvdr-ifs-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page-host">

      <!-- ══════════════════════════════════════
           POPUP: Empty docs page + modal
      ══════════════════════════════════════ -->
      <ng-container *ngIf="state === 'popup'">

        <!-- Background page -->
        <div class="bg-page" [class.bg-page--dim]="showModal">
          <fvdr-sidebar-nav
            variant="vdr"
            [accountName]="accountName"
            [items]="navItems"
            [(collapsed)]="sidebarCollapsed"
            (itemClick)="onNavItemClick($event)"
            (accountClick)="onAccountClick()"
          ></fvdr-sidebar-nav>

          <div class="bg-main">
            <fvdr-header
              [breadcrumbs]="docsBreadcrumbs"
              [actions]="headerActions"
              [showMenu]="false"
              userName="IR"
              (actionClick)="onHeaderAction($event)"
            ></fvdr-header>

            <div class="docs-toolbar">
              <div class="add-btn-wrap" (click)="$event.stopPropagation()">
                <fvdr-btn label="Add" variant="primary" size="m" [iconName]="'plus'" (clicked)="toggleAddMenu()" [dataTrack]="'add-btn'"></fvdr-btn>
                <div *ngIf="showAddMenu" class="add-menu" role="menu">
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-create-folder"></fvdr-icon></span>
                    <span class="add-menu-label">Create folder</span>
                    <span class="add-menu-shortcut">Shift + F</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="onCreateFolderStructure()">
                    <span class="add-menu-icon"><fvdr-icon name="icon-create-folder-structure"></fvdr-icon></span>
                    <span class="add-menu-label">Create folder structure</span>
                  </div>
                  <div class="add-menu-divider"></div>
                  <div class="add-menu-section">Upload from computer</div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-add-files"></fvdr-icon></span>
                    <span class="add-menu-label">Files</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-add-folder"></fvdr-icon></span>
                    <span class="add-menu-label">Folder</span>
                  </div>
                  <div class="add-menu-divider"></div>
                  <div class="add-menu-section">Upload from external storage</div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 5.5c-.4-1.5-1.8-2.5-3.4-2.5C3.8 3 2.3 4.2 2 5.8A2.5 2.5 0 0 0 0 8.2C0 9.75 1.25 11 2.8 11H13.2C14.75 11 16 9.75 16 8.2c0-1.3-.85-2.35-2-2.65A3 3 0 0 0 9 5.5Z" fill="#0078D4"/></svg></span>
                    <span class="add-menu-label">OneDrive &amp; SharePoint</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.2 2L1 11.5H5.5L10.7 2H6.2Z" fill="#0F9D58"/><path d="M10.7 2L15.9 11.5H11.4L6.2 2H10.7Z" fill="#4285F4"/><path d="M1 11.5H15.9L14.1 14.5H2.8L1 11.5Z" fill="#FBBC04"/></svg></span>
                    <span class="add-menu-label">Google Drive</span>
                  </div>
                </div>
              </div>
              <fvdr-btn label="Download" variant="secondary" size="m" [iconName]="'download'"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m" [iconName]="'action-list'"></fvdr-btn>
              <fvdr-btn [iconName]="'more'" variant="secondary" size="m" class="btn-icon-square"></fvdr-btn>
              <fvdr-search [(ngModel)]="searchText" placeholder="Search" size="m" class="toolbar-search"></fvdr-search>
            </div>

            <div class="docs-area">
              <div class="qa-wrapper">
                <fvdr-quick-access-menu [items]="quickAccessItems" [(collapsed)]="quickAccessCollapsed"></fvdr-quick-access-menu>
              </div>
              <div class="docs-content">
                <div class="docs-empty">
                  <div class="docs-empty-illustration">
                    <svg width="176" height="120" viewBox="0 0 176 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="88" cy="112" rx="72" ry="8" fill="#F7F7F7"/>
                      <path d="M48 34C48 32.8954 48.8954 32 50 32H63.1716C63.702 32 64.2107 32.2107 64.5858 32.5858L71.4142 39.4142C71.7893 39.7893 72.298 40 72.8284 40H126C127.105 40 128 40.8954 128 42V59L48 58.8077V34Z" fill="#5AC778"/>
                      <g filter="url(#nd-filter-a)">
                        <path d="M54.6528 59.3975C54.5672 58.3347 55.3304 57.3917 56.3877 57.2538L65.6727 56.0427C65.8894 56.0144 66.1093 56.0219 66.3236 56.0647L75.0512 57.8102C76.5724 58.1145 77.8457 56.6463 77.3295 55.1834L76.4408 52.6656C75.9816 51.3644 76.9469 50 78.3268 50H132.716C133.925 50 134.858 51.0654 134.698 52.2643L131 80L56 76.129L54.6528 59.3975Z" fill="#5AC778"/>
                      </g>
                      <mask id="nd-mask-a" fill="white">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M127.779 92.408C129.797 93.3065 132.161 92.3989 133.06 90.3807L161.532 26.4326C162.43 24.4144 161.523 22.05 159.504 21.1514L115.654 1.62806C113.636 0.729527 111.272 1.63715 110.373 3.6553L105.767 14.0011H66C63.7909 14.0011 62 15.792 62 18.0011V66.0011C62 68.2103 63.7909 70.0011 66 70.0011H81.6303C81.8736 71.2345 82.6929 72.3344 83.9287 72.8846L127.779 92.408Z"/>
                      </mask>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M127.779 92.408C129.797 93.3065 132.161 92.3989 133.06 90.3807L161.532 26.4326C162.43 24.4144 161.523 22.05 159.504 21.1514L115.654 1.62806C113.636 0.729527 111.272 1.63715 110.373 3.6553L105.767 14.0011H66C63.7909 14.0011 62 15.792 62 18.0011V66.0011C62 68.2103 63.7909 70.0011 66 70.0011H81.6303C81.8736 71.2345 82.6929 72.3344 83.9287 72.8846L127.779 92.408Z" fill="white" fill-opacity="0.4"/>
                      <path d="M133.06 90.3807L131.233 89.5673C131.098 89.8692 130.902 90.1171 130.666 90.3077L131.924 91.863L133.181 93.4183C133.897 92.8394 134.49 92.0871 134.887 91.1942L133.06 90.3807ZM127.779 92.408L128.592 90.5809L125.961 89.4095L125.148 91.2366L124.334 93.0637L126.965 94.2351L127.779 92.408ZM161.532 26.4326L159.705 25.6191L158.484 28.3597L160.311 29.1732L162.138 29.9867L163.359 27.246L161.532 26.4326ZM159.504 21.1514L158.691 22.9785L160.518 23.7919L161.331 21.9648L159.504 21.1514ZM115.654 1.62806L114.841 3.45516L116.668 4.26863L117.481 2.44153L115.654 1.62806ZM110.373 3.6553L112.2 4.46877L113.013 2.6417L111.186 1.82823L110.373 3.6553ZM105.767 14.0011L107.594 14.8146L108.407 12.9875L106.58 12.174L105.767 14.0011ZM81.6303 70.0011L79.6681 70.3881C80.0318 72.2325 81.2601 73.8857 83.1152 74.7117L83.9287 72.8846L84.7422 71.0575C84.1258 70.7831 83.7153 70.2366 83.5925 69.6141L81.6303 70.0011ZM83.9287 72.8846L83.1153 74.7117L85.7463 75.8831L86.5597 74.056L87.3732 72.2289L84.7422 71.0575L83.9287 72.8846Z" fill="#DEE0EB" mask="url(#nd-mask-a)"/>
                      <rect x="130.927" y="92.7149" width="54" height="76" rx="3" transform="rotate(-156 130.927 92.7149)" stroke="#DEE0EB" stroke-width="2" stroke-linejoin="round" stroke-dasharray="6 4"/>
                      <path d="M41.2723 58.1785C41.1262 57.0096 42.017 55.9682 43.1944 55.9314L71.3202 55.0525C72.2914 55.0221 73.1003 54.2982 73.2377 53.3363L73.7547 49.7172C73.8955 48.7319 74.7393 48 75.7346 48H88H133.734C134.937 48 135.868 49.0544 135.719 50.2481L128.219 110.248C128.094 111.249 127.243 112 126.234 112H49.7656C48.7569 112 47.9061 111.249 47.781 110.248L44 80L41.2723 58.1785Z" fill="#95DBA9"/>
                      <defs>
                        <filter id="nd-filter-a" x="34.6465" y="38" width="104.07" height="54" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                          <feOffset dx="-8"/>
                          <feGaussianBlur stdDeviation="6"/>
                          <feComposite in2="hardAlpha" operator="out"/>
                          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <p class="docs-empty-title">You have no documents yet</p>
                  <p class="docs-empty-sub">Drag and drop files here or start by creating folder structure</p>
                  <fvdr-btn label="Add" variant="primary" size="m" [iconName]="'plus'" (clicked)="openModal()" [dataTrack]="'empty-add-btn'" class="docs-empty-btn"></fvdr-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Import modal (DS fvdr-modal) -->
        <fvdr-modal
          [visible]="showModal"
          title="Create folder structure"
          size="l"
          confirmLabel="Next"
          cancelLabel="Cancel"
          [confirmDisabled]="selectedOption !== 'ai'"
          (confirmed)="goToWizard()"
          (cancelled)="closeModal()"
          (closed)="closeModal()"
        >
          <p class="modal-desc">Choose how you want to create the folder structure</p>

          <div class="modal-options">
            <button class="opt-card" [class.opt-card--active]="selectedOption === 'ai'"
              (click)="selectedOption = 'ai'" data-track="opt-ai">
              <img src="/assets/illustrations/ai-assistant.svg" class="opt-card-img" alt="" aria-hidden="true">
              <span class="opt-card-title">Use AI assistant</span>
              <span class="opt-card-desc">Describe your need to generate structure</span>
            </button>
            <button class="opt-card" [class.opt-card--active]="selectedOption === 'xlsx'"
              (click)="selectedOption = 'xlsx'" data-track="opt-xlsx">
              <img src="/assets/illustrations/xlsx-template.svg" class="opt-card-img" alt="" aria-hidden="true">
              <span class="opt-card-title">Import XLSX template</span>
              <span class="opt-card-desc">Use spreadsheet to define structure</span>
            </button>
            <button class="opt-card" [class.opt-card--active]="selectedOption === 'copy'"
              (click)="selectedOption = 'copy'" data-track="opt-copy">
              <img src="/assets/illustrations/copy-from-project.svg" class="opt-card-img" alt="" aria-hidden="true">
              <span class="opt-card-title">Copy from project</span>
              <span class="opt-card-desc">Reuse structure from another project</span>
            </button>
            <button class="opt-card" [class.opt-card--active]="selectedOption === 'info'"
              (click)="selectedOption = 'info'" data-track="opt-info">
              <img src="/assets/illustrations/info-request-list.svg" class="opt-card-img" alt="" aria-hidden="true">
              <span class="opt-card-title">Info request list</span>
              <span class="opt-card-desc">Build from an info request template</span>
            </button>
          </div>
        </fvdr-modal>

      </ng-container>


      <!-- ══════════════════════════════════════
           WIZARD: upload | loading | generated
      ══════════════════════════════════════ -->
      <ng-container *ngIf="state === 'upload' || state === 'loading' || state === 'generated'">
        <div class="wiz-layout">

          <fvdr-sidebar-nav
            variant="vdr"
            [accountName]="accountName"
            [items]="navItems"
            [(collapsed)]="sidebarCollapsed"
            (itemClick)="onNavItemClick($event)"
            (accountClick)="onAccountClick()"
          ></fvdr-sidebar-nav>

          <div class="wiz-main">
            <!-- Page header -->
            <fvdr-header
              [breadcrumbs]="wizardBreadcrumbs"
              [actions]="headerActions"
              [showMenu]="false"
              userName="IR"
              (actionClick)="onHeaderAction($event)"
            ></fvdr-header>

            <!-- Stepper -->
            <div class="stepper">
              <div class="stepper-steps">
                <div class="step" [class.step--done]="state === 'generated'" [class.step--active]="state === 'upload' || state === 'loading'">
                  <div class="step-circle">
                    <fvdr-icon *ngIf="state === 'generated'" name="check" class="step-check-icon"></fvdr-icon>
                    <span *ngIf="state !== 'generated'">1</span>
                  </div>
                  <span class="step-label">Provide input</span>
                </div>
                <div class="step-line" [class.step-line--done]="state === 'generated'"></div>
                <div class="step" [class.step--active]="state === 'generated'">
                  <div class="step-circle"><span>2</span></div>
                  <span class="step-label">Preview your structure</span>
                </div>
              </div>
              <fvdr-btn label="Learn more" variant="link" size="s" [iconName]="'link'" [dataTrack]="'learn-more'"></fvdr-btn>
            </div>

            <!-- ── Step 1: Upload ── -->
            <div *ngIf="state === 'upload'" class="wiz-body wiz-body--centered">
              <div class="wiz-brand-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#E8F7F2"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10C14.477 10 10 14.477 10 20ZM28 20C28 24.418 24.418 28 20 28C19.662 28 19.328 27.979 19 27.938C22.947 27.446 26 24.08 26 20C26 15.92 22.946 12.554 19 12.062C19.328 12.021 19.662 12 20 12C24.418 12 28 15.582 28 20ZM12 20C12 18.343 13.343 17 15 17C16.657 17 18 18.343 18 20C18 21.657 16.657 23 15 23C13.343 23 12 21.657 12 20ZM18 26C16.766 26 15.619 25.628 14.666 24.989C14.776 24.996 14.888 25 15 25C17.761 25 20 22.761 20 20C20 17.239 17.761 15 15 15C14.888 15 14.776 15.004 14.666 15.011C15.619 14.373 16.766 14 18 14C21.314 14 24 16.686 24 20C24 23.314 21.314 26 18 26Z" fill="#2C9C74"/>
                </svg>
              </div>
              <h2 class="wiz-heading">Build your folder structure in seconds</h2>
              <p class="wiz-subheading">Upload a reference file or describe what you need – get a ready-to-review result</p>

              <div class="segment-wrap">
                <fvdr-segment
                  [items]="segmentItems"
                  [activeId]="activeSegment"
                  (activeIdChange)="onSegmentChange($event)"
                ></fvdr-segment>
              </div>

              <!-- Upload mode -->
              <ng-container *ngIf="activeSegment === 'upload'">
                <!-- Destination folder picker -->
                <div class="dest-field">
                  <label class="dest-label">Destination folder</label>
                  <div class="dest-picker" (click)="folderPickerOpen = !folderPickerOpen">
                    <fvdr-icon name="folder" class="dest-folder-icon"></fvdr-icon>
                    <span class="dest-folder-name">{{ selectedFolderLabel }}</span>
                    <fvdr-icon name="chevron-down" class="dest-chevron" [class.dest-chevron--open]="folderPickerOpen"></fvdr-icon>
                  </div>
                  <div *ngIf="folderPickerOpen" class="dest-tree-panel">
                    <fvdr-tree [nodes]="destPickerNodes" (nodeSelect)="onFolderSelect($event)"></fvdr-tree>
                  </div>
                </div>

                <!-- Drop area (no file) -->
                <fvdr-drop-area
                  *ngIf="!hasFile"
                  title="Drop your file in any format or layout"
                  subtitle="or click to choose a file"
                  (filesDropped)="simulateUpload()"
                  class="wiz-drop-area"
                ></fvdr-drop-area>

                <!-- File row (file uploaded) -->
                <div *ngIf="hasFile" class="file-row">
                  <span class="file-row-icon">
                    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="28" height="32" rx="3" fill="#FEE8E5"/>
                      <path d="M7 21V11H17L21 15V21C21 21.552 20.552 22 20 22H8C7.448 22 7 21.552 7 21Z" fill="#E54430" opacity="0.15"/>
                      <path d="M16 11V15H21" stroke="#E54430" stroke-width="1.2" stroke-linejoin="round"/>
                      <path d="M7 11L7 21C7 21.552 7.448 22 8 22H20C20.552 22 21 21.552 21 21V15L16 11H7Z" stroke="#E54430" stroke-width="1.2" stroke-linejoin="round"/>
                      <text x="14" y="19.5" text-anchor="middle" fill="#E54430" style="font-size:5px;font-weight:700;font-family:sans-serif;">PDF</text>
                    </svg>
                  </span>
                  <span class="file-row-info">
                    <span class="file-row-name">ACME Cooperative.pdf</span>
                    <span class="file-row-size">123.4 KB</span>
                  </span>
                  <fvdr-btn label="Upload another file" variant="secondary" size="m" [iconName]="'upload'" (clicked)="removeFile()" [dataTrack]="'upload-another'"></fvdr-btn>
                </div>
              </ng-container>

              <!-- Describe mode -->
              <ng-container *ngIf="activeSegment === 'describe'">
                <!-- Destination folder picker -->
                <div class="dest-field">
                  <label class="dest-label">Destination folder</label>
                  <div class="dest-picker" (click)="folderPickerOpen = !folderPickerOpen">
                    <fvdr-icon name="folder" class="dest-folder-icon"></fvdr-icon>
                    <span class="dest-folder-name">{{ selectedFolderLabel }}</span>
                    <fvdr-icon name="chevron-down" class="dest-chevron" [class.dest-chevron--open]="folderPickerOpen"></fvdr-icon>
                  </div>
                  <div *ngIf="folderPickerOpen" class="dest-tree-panel">
                    <fvdr-tree [nodes]="destPickerNodes" (nodeSelect)="onFolderSelect($event)"></fvdr-tree>
                  </div>
                </div>
                <div class="textarea-wrap">
                  <fvdr-textarea
                    [(ngModel)]="describeText"
                    placeholder="E.g., Create a due diligence structure for an M&A deal with sections for Finance, Legal, HR, and Commercial."
                    [maxlength]="1000"
                    [rows]="3"
                  ></fvdr-textarea>
                </div>
              </ng-container>
            </div>

            <!-- ── Step 1: Loading (Lottie) ── -->
            <div *ngIf="state === 'loading'" class="wiz-body wiz-body--loading">
              <div #lottieContainer class="lottie-wrap"></div>
              <p class="loading-title">Building your folder structure with AI…</p>
              <p class="loading-sub">This usually takes a few seconds</p>
            </div>

            <!-- ── Step 2: Generated ── -->
            <div *ngIf="state === 'generated'" class="wiz-body wiz-body--generated">

              <!-- Upload flow: show "Upload another file" button -->
              <fvdr-btn *ngIf="sourceSegment === 'upload'"
                label="Upload another file" variant="secondary" size="m" [iconName]="'upload'"
                (clicked)="onUploadAnother()" [dataTrack]="'upload-another'"
                class="upload-standalone-btn">
              </fvdr-btn>

              <!-- Describe flow: show the prompt field (read-only) -->
              <div *ngIf="sourceSegment === 'describe'" class="prompt-field">
                <span class="prompt-field__text">{{ describeText }}</span>
                <button class="prompt-field__edit" (click)="editPrompt()" title="Edit prompt">
                  <fvdr-icon name="edit"></fvdr-icon>
                </button>
              </div>

              <div class="folder-tree-wrap">
                <fvdr-tree [nodes]="folderTreeNodes"></fvdr-tree>
              </div>
            </div>

            <!-- Footer -->
            <div class="wiz-footer">
              <ng-container *ngIf="state === 'upload'">
                <fvdr-btn label="Cancel" variant="ghost" (clicked)="onCancel()" data-track="cancel"></fvdr-btn>
                <fvdr-btn label="Continue" variant="primary" [disabled]="!canProceed" (clicked)="onNext()" data-track="continue"></fvdr-btn>
              </ng-container>

              <ng-container *ngIf="state === 'generated'">
                <fvdr-btn label="Back" variant="ghost" (clicked)="onBack()" data-track="back"></fvdr-btn>
                <fvdr-btn label="Create" variant="primary" (clicked)="onCreate()" data-track="create"></fvdr-btn>
                <fvdr-inline-message variant="info" text="20 new folders"></fvdr-inline-message>
                <div class="footer-spacer"></div>
              </ng-container>
            </div>

          </div>
        </div>
      </ng-container>


      <!-- ══════════════════════════════════════
           CREATING / CREATED: docs page + toast
      ══════════════════════════════════════ -->
      <ng-container *ngIf="state === 'creating' || state === 'created'">
        <div class="bg-page">
          <fvdr-sidebar-nav
            variant="vdr"
            [accountName]="accountName"
            [items]="navItems"
            [(collapsed)]="sidebarCollapsed"
            (itemClick)="onNavItemClick($event)"
            (accountClick)="onAccountClick()"
          ></fvdr-sidebar-nav>

          <div class="bg-main">
            <fvdr-header
              [breadcrumbs]="docsBreadcrumbs"
              [actions]="headerActions"
              [showMenu]="false"
              userName="IR"
              (actionClick)="onHeaderAction($event)"
            ></fvdr-header>

            <div class="docs-toolbar">
              <div class="add-btn-wrap" (click)="$event.stopPropagation()">
                <fvdr-btn label="Add" variant="primary" size="m" [iconName]="'plus'" (clicked)="toggleAddMenu()"></fvdr-btn>
                <div *ngIf="showAddMenu" class="add-menu" role="menu">
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-create-folder"></fvdr-icon></span>
                    <span class="add-menu-label">Create folder</span>
                    <span class="add-menu-shortcut">Shift + F</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="onCreateFolderStructure()">
                    <span class="add-menu-icon"><fvdr-icon name="icon-create-folder-structure"></fvdr-icon></span>
                    <span class="add-menu-label">Create folder structure</span>
                  </div>
                  <div class="add-menu-divider"></div>
                  <div class="add-menu-section">Upload from computer</div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-add-files"></fvdr-icon></span>
                    <span class="add-menu-label">Files</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><fvdr-icon name="icon-add-folder"></fvdr-icon></span>
                    <span class="add-menu-label">Folder</span>
                  </div>
                  <div class="add-menu-divider"></div>
                  <div class="add-menu-section">Upload from external storage</div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 5.5c-.4-1.5-1.8-2.5-3.4-2.5C3.8 3 2.3 4.2 2 5.8A2.5 2.5 0 0 0 0 8.2C0 9.75 1.25 11 2.8 11H13.2C14.75 11 16 9.75 16 8.2c0-1.3-.85-2.35-2-2.65A3 3 0 0 0 9 5.5Z" fill="#0078D4"/></svg></span>
                    <span class="add-menu-label">OneDrive &amp; SharePoint</span>
                  </div>
                  <div class="add-menu-item" role="menuitem" (click)="showAddMenu = false">
                    <span class="add-menu-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.2 2L1 11.5H5.5L10.7 2H6.2Z" fill="#0F9D58"/><path d="M10.7 2L15.9 11.5H11.4L6.2 2H10.7Z" fill="#4285F4"/><path d="M1 11.5H15.9L14.1 14.5H2.8L1 11.5Z" fill="#FBBC04"/></svg></span>
                    <span class="add-menu-label">Google Drive</span>
                  </div>
                </div>
              </div>
              <fvdr-btn label="Download" variant="secondary" size="m" [iconName]="'download'"></fvdr-btn>
              <fvdr-btn label="Project index" variant="secondary" size="m" [iconName]="'action-list'"></fvdr-btn>
              <fvdr-btn [iconName]="'more'" variant="secondary" size="m" class="btn-icon-square"></fvdr-btn>
              <fvdr-search [(ngModel)]="searchText" placeholder="Search" size="m" class="toolbar-search"></fvdr-search>
            </div>

            <div class="docs-area">
              <div class="qa-wrapper">
                <fvdr-quick-access-menu [items]="quickAccessItems" [(collapsed)]="quickAccessCollapsed"></fvdr-quick-access-menu>
              </div>
              <div class="docs-content">
                <!-- Creating: empty state; Created: table with folders -->
                <ng-container *ngIf="state === 'creating'">
                  <div class="docs-empty">
                    <div class="docs-empty-illustration">
                      <svg width="176" height="120" viewBox="0 0 176 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="88" cy="112" rx="72" ry="8" fill="#F7F7F7"/>
                        <path d="M48 34C48 32.8954 48.8954 32 50 32H63.1716C63.702 32 64.2107 32.2107 64.5858 32.5858L71.4142 39.4142C71.7893 39.7893 72.298 40 72.8284 40H126C127.105 40 128 40.8954 128 42V59L48 58.8077V34Z" fill="#5AC778"/>
                        <g filter="url(#nd-filter-b)">
                          <path d="M54.6528 59.3975C54.5672 58.3347 55.3304 57.3917 56.3877 57.2538L65.6727 56.0427C65.8894 56.0144 66.1093 56.0219 66.3236 56.0647L75.0512 57.8102C76.5724 58.1145 77.8457 56.6463 77.3295 55.1834L76.4408 52.6656C75.9816 51.3644 76.9469 50 78.3268 50H132.716C133.925 50 134.858 51.0654 134.698 52.2643L131 80L56 76.129L54.6528 59.3975Z" fill="#5AC778"/>
                        </g>
                        <mask id="nd-mask-b" fill="white">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M127.779 92.408C129.797 93.3065 132.161 92.3989 133.06 90.3807L161.532 26.4326C162.43 24.4144 161.523 22.05 159.504 21.1514L115.654 1.62806C113.636 0.729527 111.272 1.63715 110.373 3.6553L105.767 14.0011H66C63.7909 14.0011 62 15.792 62 18.0011V66.0011C62 68.2103 63.7909 70.0011 66 70.0011H81.6303C81.8736 71.2345 82.6929 72.3344 83.9287 72.8846L127.779 92.408Z"/>
                        </mask>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M127.779 92.408C129.797 93.3065 132.161 92.3989 133.06 90.3807L161.532 26.4326C162.43 24.4144 161.523 22.05 159.504 21.1514L115.654 1.62806C113.636 0.729527 111.272 1.63715 110.373 3.6553L105.767 14.0011H66C63.7909 14.0011 62 15.792 62 18.0011V66.0011C62 68.2103 63.7909 70.0011 66 70.0011H81.6303C81.8736 71.2345 82.6929 72.3344 83.9287 72.8846L127.779 92.408Z" fill="white" fill-opacity="0.4"/>
                        <path d="M133.06 90.3807L131.233 89.5673C131.098 89.8692 130.902 90.1171 130.666 90.3077L131.924 91.863L133.181 93.4183C133.897 92.8394 134.49 92.0871 134.887 91.1942L133.06 90.3807ZM127.779 92.408L128.592 90.5809L125.961 89.4095L125.148 91.2366L124.334 93.0637L126.965 94.2351L127.779 92.408ZM161.532 26.4326L159.705 25.6191L158.484 28.3597L160.311 29.1732L162.138 29.9867L163.359 27.246L161.532 26.4326ZM159.504 21.1514L158.691 22.9785L160.518 23.7919L161.331 21.9648L159.504 21.1514ZM115.654 1.62806L114.841 3.45516L116.668 4.26863L117.481 2.44153L115.654 1.62806ZM110.373 3.6553L112.2 4.46877L113.013 2.6417L111.186 1.82823L110.373 3.6553ZM105.767 14.0011L107.594 14.8146L108.407 12.9875L106.58 12.174L105.767 14.0011ZM81.6303 70.0011L79.6681 70.3881C80.0318 72.2325 81.2601 73.8857 83.1152 74.7117L83.9287 72.8846L84.7422 71.0575C84.1258 70.7831 83.7153 70.2366 83.5925 69.6141L81.6303 70.0011ZM83.9287 72.8846L83.1153 74.7117L85.7463 75.8831L86.5597 74.056L87.3732 72.2289L84.7422 71.0575L83.9287 72.8846Z" fill="#DEE0EB" mask="url(#nd-mask-b)"/>
                        <rect x="130.927" y="92.7149" width="54" height="76" rx="3" transform="rotate(-156 130.927 92.7149)" stroke="#DEE0EB" stroke-width="2" stroke-linejoin="round" stroke-dasharray="6 4"/>
                        <path d="M41.2723 58.1785C41.1262 57.0096 42.017 55.9682 43.1944 55.9314L71.3202 55.0525C72.2914 55.0221 73.1003 54.2982 73.2377 53.3363L73.7547 49.7172C73.8955 48.7319 74.7393 48 75.7346 48H88H133.734C134.937 48 135.868 49.0544 135.719 50.2481L128.219 110.248C128.094 111.249 127.243 112 126.234 112H49.7656C48.7569 112 47.9061 111.249 47.781 110.248L44 80L41.2723 58.1785Z" fill="#95DBA9"/>
                        <defs>
                          <filter id="nd-filter-b" x="34.6465" y="38" width="104.07" height="54" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                            <feOffset dx="-8"/>
                            <feGaussianBlur stdDeviation="6"/>
                            <feComposite in2="hardAlpha" operator="out"/>
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                          </filter>
                        </defs>
                      </svg>
                    </div>
                    <p class="docs-empty-title">You have no documents yet</p>
                    <p class="docs-empty-sub">Drag and drop files here or start by creating folder structure</p>
                  </div>
                </ng-container>
                <ng-container *ngIf="state === 'created'">
                  <!-- Table style — match /search-results-pagination/view (без search state, без snippets) -->
                  <div class="docs-tbl-scroll">
                    <div class="docs-tbl">
                      <!-- Header -->
                      <div class="docs-tbl-row docs-tbl-row--head">
                        <div class="docs-col-check">
                          <label class="docs-check-wrap">
                            <input type="checkbox" class="docs-native-check"
                              [checked]="docsAllSelected"
                              [indeterminate]="docsSomeSelected && !docsAllSelected"
                              (change)="toggleAllDocs($event)" />
                            <span class="docs-check-box"
                              [class.docs-check-box--checked]="docsAllSelected"
                              [class.docs-check-box--indeterminate]="docsSomeSelected && !docsAllSelected">
                              <svg *ngIf="docsAllSelected" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                              <svg *ngIf="docsSomeSelected && !docsAllSelected" width="10" height="2" viewBox="0 0 10 2" fill="none"><path d="M1 1H9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
                            </span>
                          </label>
                        </div>
                        <div class="docs-col-name"><span class="docs-th">Name</span></div>
                        <div class="docs-col-act">
                          <button class="docs-hdr-btn"><fvdr-icon name="settings"></fvdr-icon></button>
                        </div>
                      </div>

                      <!-- Data rows -->
                      <div *ngFor="let row of createdDocsRows"
                        class="docs-tbl-row docs-tbl-row--data"
                        [class.docs-tbl-row--selected]="row.selected">
                        <div class="docs-col-check">
                          <label class="docs-check-wrap">
                            <input type="checkbox" class="docs-native-check"
                              [checked]="row.selected"
                              (change)="toggleDocRow(row, $event)" />
                            <span class="docs-check-box" [class.docs-check-box--checked]="row.selected">
                              <svg *ngIf="row.selected" width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </span>
                          </label>
                        </div>
                        <div class="docs-col-name">
                          <fvdr-file-icon [type]="row.type"></fvdr-file-icon>
                          <span class="docs-td-name">{{ row.name }}</span>
                        </div>
                        <div class="docs-col-act">
                          <button class="docs-hdr-btn docs-row-more"><fvdr-icon name="more"></fvdr-icon></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- DS Toast host (global) -->
      <fvdr-toast-host></fvdr-toast-host>


    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-family);
      color: var(--color-text-primary);
      --color-border: var(--color-stone-400);
      --color-divider: var(--color-stone-400);
    }

    /* ─── Page host ─── */
    .page-host {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--color-stone-0);
    }



    /* ─── Shared background page ─── */
    .bg-page {
      width: 100vw;
      height: 100vh;
      display: flex;
      background: var(--color-stone-0);
    }

    .bg-page--dim {
      filter: blur(2px);
      pointer-events: none;
      user-select: none;
    }

    .bg-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ─── Docs toolbar ─── */
    .docs-toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-6);
      flex-shrink: 0;
    }

    /* Icon-only secondary button — square 40×40 (Дмитро: more-кнопка має бути 40×40) */
    .btn-icon-square ::ng-deep .btn--m {
      width: 40px;
      padding: 0;
    }

    /* ─── Docs area (quick access + content) ─── */
    .docs-area {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .docs-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    /* ─── Quick access wrapper ─── */
    .qa-wrapper {
      flex-shrink: 0;
      padding-left: var(--space-6);
      padding-top: var(--space-3);
      overflow: hidden;
    }

    .toolbar-search {
      width: 320px;
      flex-shrink: 0;
      margin-left: auto;
    }

    /* ─── Empty state ─── */
    .docs-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-8);
    }

    .docs-empty-illustration { flex-shrink: 0; }

    .docs-empty-title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
    }

    .docs-empty-sub {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-align: center;
    }

    .docs-empty-btn { margin-top: var(--space-2); }
    .upload-standalone-btn { align-self: flex-start; margin-bottom: var(--space-4); }

    /* ─── Import modal content (inside fvdr-modal body) ─── */
    .modal-desc {
      margin: 0 0 var(--space-4);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .modal-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    }

    .opt-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-align: left;
      font-family: var(--font-family);
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .opt-card:hover {
      background: var(--color-primary-50);
      border-color: var(--color-primary-500);
    }

    .opt-card--active {
      background: var(--color-primary-50);
      border: 1.5px solid var(--color-primary-500);
      box-shadow: 0 0 0 1px var(--color-primary-500);
    }

    .opt-card-img {
      width: 96px;
      height: 72px;
      display: block;
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-1);
    }

    .opt-card-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
    }

    .opt-card-desc {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    /* ─── Wizard layout ─── */
    .wiz-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: var(--color-stone-0);
    }

    .wiz-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      background: var(--color-stone-0);
    }


    /* ─── Stepper ─── */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-8);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .stepper-steps {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-circle {
      width: 20px;
      height: 20px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: var(--font-weight-semi);
      flex-shrink: 0;
      background: var(--color-stone-300);
      border: none;
      color: var(--color-text-secondary);
    }

    .step--active .step-circle {
      background: var(--color-primary-500);
      color: var(--color-stone-0);
    }

    .step--done .step-circle {
      background: var(--color-primary-500);
      color: var(--color-stone-0);
    }

    .step-check-icon { font-size: 12px; }

    .step-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .step--active .step-label { color: var(--color-text-primary); }
    .step--done .step-label { color: var(--color-text-secondary); }

    .step-line {
      flex: none;
      width: 16px;
      height: 1px;
      background: var(--color-text-secondary);
    }

    .step-line--done { background: var(--color-primary-500); }

    /* ─── Wizard body ─── */
    .wiz-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6) var(--space-8);
    }

    .wiz-body--centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-top: var(--space-10);
    }

    .wiz-body--loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .wiz-body--generated {
      display: flex;
      flex-direction: column;
      padding: var(--space-5) var(--space-8);
    }

    .wiz-brand-icon {
      margin-bottom: var(--space-4);
      flex-shrink: 0;
    }

    .wiz-heading {
      margin: 0 0 var(--space-2);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
    }

    .wiz-subheading {
      margin: 0 0 var(--space-5);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      max-width: 480px;
    }

    .segment-wrap {
      width: 100%;
      max-width: 480px;
      margin-bottom: var(--space-5);
    }

    /* ─── Destination folder picker ─── */
    .dest-field {
      width: 100%;
      max-width: 480px;
      margin-bottom: var(--space-3);
      text-align: left;
      position: relative;
    }

    .dest-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
      margin-bottom: var(--space-1);
    }

    .dest-picker {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: 36px;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      cursor: pointer;
      user-select: none;
      transition: border-color 0.15s;
    }
    .dest-picker:hover { border-color: var(--color-primary-500); }

    .dest-folder-icon {
      font-size: 14px;
      color: var(--color-primary-500);
      flex-shrink: 0;
    }

    .dest-folder-name {
      flex: 1;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .dest-chevron {
      font-size: 12px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      transition: transform 0.2s;
    }
    .dest-chevron--open { transform: rotate(180deg); }

    .dest-tree-panel {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--color-stone-0);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-popover);
      z-index: 50;
      max-height: 240px;
      overflow-y: auto;
    }

    /* ─── Drop area ─── */
    .wiz-drop-area {
      width: 100%;
      max-width: 480px;
    }

    /* ─── File row (uploaded state) ─── */
    .file-row {
      width: 100%;
      max-width: 480px;
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
    }

    .file-row-icon { flex-shrink: 0; }

    .file-row-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    .file-row-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
    }

    .file-row-size {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    /* ─── Prompt field (describe flow, generated state) ─── */
    .prompt-field {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: 40px;
      padding: 0 var(--space-4);
      border: 1px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      background: var(--color-stone-0);
      width: 640px;
      max-width: 100%;
      flex-shrink: 0;
      margin-bottom: var(--space-4);
    }
    .prompt-field__text {
      flex: 1;
      font-size: var(--font-size-md);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .prompt-field__edit {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 16px;
      padding: 0;
      flex-shrink: 0;
      transition: color 0.12s;
    }
    .prompt-field__edit:hover { color: var(--color-text-primary); }
    .prompt-field__edit:focus { outline: none; color: var(--color-primary-500); }

    /* ─── Loading ─── */
    .lottie-wrap {
      width: 176px;
      height: 224px;
      flex-shrink: 0;
    }

    .loading-title {
      margin: var(--space-4) 0 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semi);
      color: var(--color-text-primary);
      text-align: center;
    }

    .loading-sub {
      margin: var(--space-2) 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-align: center;
    }

    /* ─── Textarea (describe mode) ─── */
    .textarea-wrap {
      width: 100%;
      max-width: 480px;
      text-align: left;
    }

    /* ─── Folder tree (generated) ─── */
    .folder-tree-wrap {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    /* ─── Created folders table (style: /search-results-pagination/view) ─── */
    .docs-tbl-scroll {
      flex: 1;
      overflow: auto;
    }
    .docs-tbl { display: flex; flex-direction: column; min-width: 480px; }

    .docs-tbl-row {
      display: grid;
      grid-template-columns: 40px 1fr 48px;
      align-items: center;
    }
    .docs-tbl-row--head {
      background: var(--color-stone-200);
      position: sticky; top: 0; z-index: 2;
      min-height: 48px;
    }
    .docs-tbl-row--data {
      min-height: 52px;
      cursor: pointer;
      border-bottom: 1px solid var(--color-divider);
    }
    .docs-tbl-row--data:hover    { background: var(--color-hover-bg); }
    .docs-tbl-row--selected      { background: var(--color-primary-50) !important; }

    .docs-tbl-row--head > div,
    .docs-tbl-row--data > div {
      display: flex;
      align-items: center;
      padding: 0 var(--space-3);
    }
    .docs-th {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .docs-col-check { justify-content: center; }
    .docs-check-wrap { display: flex; align-items: center; cursor: pointer; }
    .docs-native-check { position: absolute; opacity: 0; width: 0; height: 0; }
    .docs-check-box {
      width: 16px; height: 16px;
      border: 1.5px solid var(--color-stone-500);
      border-radius: 3px;
      background: var(--color-stone-0);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.15s, background 0.15s;
    }
    .docs-check-box--checked,
    .docs-check-box--indeterminate {
      background: var(--color-primary-500);
      border-color: var(--color-primary-500);
    }
    .docs-check-wrap:hover .docs-check-box { border-color: var(--color-primary-500); }

    .docs-col-name {
      gap: var(--space-2);
      overflow: hidden;
    }
    .docs-td-name {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .docs-col-act { justify-content: center; }
    .docs-hdr-btn {
      width: 32px; height: 32px;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary);
      font-size: var(--font-size-lg, 16px);
    }
    .docs-hdr-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .docs-row-more { opacity: 0; }
    .docs-tbl-row--data:hover .docs-row-more { opacity: 1; }

    /* ─── Wizard footer ─── */
    .wiz-footer {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-8);
      border-top: 1px solid var(--color-divider);
      flex-shrink: 0;
    }

    .footer-spacer { flex: 1; }

    /* ─── Add button dropdown ─── */
    .add-btn-wrap {
      position: relative;
      z-index: 100;
    }

    .add-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 280px;
      background: var(--color-stone-0);
      border-radius: var(--radius-sm);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      z-index: 300;
      padding: var(--space-1) 0;
      overflow: hidden;
    }

    .add-menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: 32px;
      padding: var(--space-2) var(--space-4);
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: 14px;
      font-weight: 400;
      font-family: var(--font-family);
      white-space: nowrap;
      transition: background 0.1s;
      user-select: none;
    }
    .add-menu-item:hover { background: var(--color-hover-bg); }

    .add-menu-icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: 16px;
    }

    .add-menu-label { flex: 1; }

    .add-menu-shortcut {
      color: var(--color-stone-600);
      font-size: 14px;
      font-family: var(--font-family);
    }

    .add-menu-divider {
      height: 1px;
      background: var(--color-divider);
      margin: var(--space-1) 0;
    }

    .add-menu-section {
      display: flex;
      align-items: center;
      height: 32px;
      padding: var(--space-2) var(--space-4);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      font-family: var(--font-family);
      pointer-events: none;
    }

  `],
})
export class IfsAiComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private toastService = inject(ToastService);

  @ViewChild('lottieContainer') lottieContainer?: ElementRef<HTMLElement>;

  state: PageState = 'popup';
  showModal = false;
  selectedOption: 'ai' | 'xlsx' | 'copy' | 'info' = 'ai';

  accountName = 'Project Alpha';
  sidebarCollapsed = false;

  /** Add button dropdown */
  showAddMenu = false;

  /** Destination folder picker */
  folderPickerOpen = false;
  selectedFolderLabel = 'Documents';
  destPickerNodes = DEST_PICKER_NODES;

  /** Search text */
  searchText = '';

  /** Header breadcrumbs — match canonical fvdr-header usage from other prototypes */
  isDark = false;
  docsBreadcrumbs: BreadcrumbItem[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'ip', label: '2 Intellectual property' },
  ];
  wizardBreadcrumbs: BreadcrumbItem[] = [
    { id: 'documents', label: 'Documents' },
    { id: 'create', label: 'Create folder structure' },
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

  navItems: SidebarNavItem[] = [
    { id: 'overview',     label: 'Overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active' },
    { id: 'documents',    label: 'Documents',    icon: 'nav-projects',     iconActive: 'nav-projects-active',  active: true, open: true },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'reports',      label: 'Reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',    children: [{ id: 'reports-sub', label: 'Analytics' }] },
    { id: 'billing',      label: 'Billing',      icon: 'nav-billing',      iconActive: 'nav-billing-active' },
    { id: 'settings',     label: 'Settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',   children: [{ id: 'settings-sub', label: 'General' }] },
    { id: 'recycle',      label: 'Recycle bin',  icon: 'trash',            iconActive: 'trash' },
  ];

  quickAccessCollapsed = false;
  quickAccessItems: QuickAccessItem[] = [
    { id: 'recent',    label: 'Recent',    icon: 'clock'  },
    { id: 'favorites', label: 'Favorites', icon: 'sort'   },
    { id: 'new',       label: 'New',       icon: 'upload' },
  ];
  activeSegment = 'upload';
  sourceSegment: 'upload' | 'describe' = 'upload';
  hasFile = false;
  describeText = '';

  folderTreeNodes = FOLDER_TREE_NODES;
  createdTableColumns = CREATED_COLUMNS;
  createdTableRows = CREATED_ROWS;

  /** Created folders — table model in /search-results-pagination/view style */
  createdDocsRows: { name: string; type: 'folder-colored'; selected: boolean }[] = CREATED_ROWS.map(r => ({
    name: r['name'],
    type: 'folder-colored',
    selected: false,
  }));
  get docsAllSelected(): boolean {
    return this.createdDocsRows.length > 0 && this.createdDocsRows.every(r => r.selected);
  }
  get docsSomeSelected(): boolean {
    return this.createdDocsRows.some(r => r.selected);
  }
  toggleAllDocs(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.createdDocsRows.forEach(r => r.selected = checked);
  }
  toggleDocRow(row: { selected: boolean }, ev: Event): void {
    row.selected = (ev.target as HTMLInputElement).checked;
  }

  segmentItems: SegmentItem[] = [
    { id: 'upload',   label: 'Upload file' },
    { id: 'describe', label: 'Describe structure' },
  ];

  private lottieAnim?: AnimationItem;
  private loadingTimer?: ReturnType<typeof setTimeout>;
  private creatingTimer?: ReturnType<typeof setTimeout>;

  get canProceed(): boolean {
    if (this.activeSegment === 'upload') return this.hasFile;
    return this.describeText.trim().length > 0;
  }

  onNavItemClick(item: SidebarNavItem): void {
    this.navItems = this.navItems.map(i => ({
      ...i,
      open: i.id === item.id ? !i.open : i.open,
    }));
  }

  onAccountClick(): void {}

  ngOnInit(): void {
    this.tracker.trackPageView('ifs-ai');
  }

  ngOnDestroy(): void {
    this.lottieAnim?.destroy();
    if (this.loadingTimer) clearTimeout(this.loadingTimer);
    if (this.creatingTimer) clearTimeout(this.creatingTimer);
    this.tracker.destroyListeners();
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.showAddMenu = false;
  }

  toggleAddMenu(): void {
    this.showAddMenu = !this.showAddMenu;
  }

  onCreateFolderStructure(): void {
    this.showAddMenu = false;
    this.showModal = true;
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.tracker.trackTask('ifs-ai', 'task_fail');
  }

  goToWizard(): void {
    this.showModal = false;
    this.state = 'upload';
    this.hasFile = false;
    this.activeSegment = 'upload';
  }

  onSegmentChange(id: string): void {
    this.activeSegment = id;
  }

  simulateUpload(): void {
    this.hasFile = true;
  }

  removeFile(): void {
    this.hasFile = false;
  }

  onUploadAnother(): void {
    this.state = 'upload';
    this.hasFile = false;
  }

  onCancel(): void {
    this.state = 'popup';
    this.showModal = false;
  }

  onBack(): void {
    this.state = 'upload';
  }

  onNext(): void {
    this.sourceSegment = this.activeSegment as 'upload' | 'describe';
    this.state = 'loading';
    this.cdr.detectChanges();

    setTimeout(() => this.loadLottie(), 50);

    this.loadingTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.state = 'generated';
        this.lottieAnim?.destroy();
        this.lottieAnim = undefined;
      });
    }, 10000);
  }

  editPrompt(): void {
    this.state = 'upload';
    this.activeSegment = 'describe';
  }

  onCreate(): void {
    this.state = 'creating';
    this.tracker.trackTask('ifs-ai', 'task_complete');

    const creatingId = this.toastService.show({
      variant: 'info',
      message: 'Creating 20 new folders...',
      duration: 0,
    });

    this.creatingTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.state = 'created';
        this.toastService.remove(creatingId);
        this.toastService.show({
          variant: 'success',
          message: '20 folders created',
          duration: 5000,
        });
      });
    }, 2500);
  }

  onToastClose(): void {
    this.state = 'popup';
    this.showModal = false;
    this.hasFile = false;
    this.describeText = '';
    this.activeSegment = 'upload';
    this.selectedOption = 'ai';
  }

  onFolderSelect(node: TreeNode): void {
    this.selectedFolderLabel = node.label;
    this.folderPickerOpen = false;
  }

  private loadLottie(): void {
    if (!this.lottieContainer?.nativeElement) return;
    this.lottieAnim?.destroy();
    this.lottieAnim = lottie.loadAnimation({
      container: this.lottieContainer.nativeElement,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/lottie/ifs-loader.json',
    });
  }
}
