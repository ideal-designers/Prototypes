import {
  Component, OnInit, OnDestroy, ViewChildren, QueryList,
  ElementRef, ChangeDetectorRef, NgZone, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Types ──────────────────────────────────────────────────────────────────
type PiiCategory = 'personal-name' | 'address' | 'date-time' | 'email' | 'phone' | 'iban' | 'ssn' | 'passport';
type TabMode = 'search' | 'detect' | null;
type DetectState = 'idle' | 'detecting' | 'results' | 'no-results';
type MarkStatus = 'draft' | 'applied';
type GroupBy = 'category' | 'page';

interface RedactionMark {
  id: string;
  text: string;
  pageNum: number;
  x: number; y: number; width: number; height: number;
  category: PiiCategory | 'manual';
  status: MarkStatus;
}

interface PiiMatch {
  id: string;
  text: string;
  pageNum: number;
  x: number; y: number; width: number; height: number;
  category: PiiCategory;
}

interface SearchHighlight {
  id: string;
  text: string;
  pageNum: number;
  x: number; y: number; width: number; height: number;
  isCurrent: boolean;
}

interface PageRender {
  num: number;
  width: number;
  height: number;
  scale: number;
}

interface TextItem {
  text: string;
  pageNum: number;
  x: number; y: number;   // screen pixels (scaled)
  width: number; height: number;
}

// ── PII category meta ──────────────────────────────────────────────────────
const CAT_META: Record<PiiCategory, { label: string; shortLabel: string; svgPath: string; highlightColor: string }> = {
  'personal-name': {
    label: 'Personal name', shortLabel: 'Personal name',
    svgPath: 'M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-2.7 0-8 1.4-8 4v2h16v-2c0-2.6-5.3-4-8-4z',
    highlightColor: 'rgba(255, 193, 7, 0.35)'
  },
  'address': {
    label: 'Address', shortLabel: 'Address',
    svgPath: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z',
    highlightColor: 'rgba(33, 150, 243, 0.3)'
  },
  'date-time': {
    label: 'Date & time', shortLabel: 'Date & time',
    svgPath: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
    highlightColor: 'rgba(76, 175, 80, 0.3)'
  },
  'email': {
    label: 'Email', shortLabel: 'Email',
    svgPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    highlightColor: 'rgba(156, 39, 176, 0.25)'
  },
  'phone': {
    label: 'Phone number', shortLabel: 'Phone',
    svgPath: 'M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    highlightColor: 'rgba(255, 87, 34, 0.25)'
  },
  'iban': {
    label: 'IBAN', shortLabel: 'IBAN',
    svgPath: 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z',
    highlightColor: 'rgba(0, 188, 212, 0.25)'
  },
  'ssn': {
    label: 'SSN', shortLabel: 'SSN',
    svgPath: 'M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    highlightColor: 'rgba(233, 30, 99, 0.25)'
  },
  'passport': {
    label: 'Passport number', shortLabel: 'Passport',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    highlightColor: 'rgba(121, 85, 72, 0.25)'
  }
};

const PII_ORDER: PiiCategory[] = [
  'personal-name', 'address', 'date-time', 'email', 'phone', 'iban', 'ssn', 'passport'
];

// ── Component ──────────────────────────────────────────────────────────────
@Component({
  selector: 'fvdr-redaction-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="rv-root" (mousemove)="onMouseMove($event)" (mouseup)="onMouseUp($event)">

  <!-- ══ HEADER ══ -->
  <header class="rv-header">
    <div class="rv-header-left">
      <button class="rv-icon-btn" (click)="onBack()">
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <svg class="rv-file-icon" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" fill="#358CEB"/>
      </svg>
      <span class="rv-filename">2.2.1 Protocol / Ready for review. pdf</span>

      <div class="rv-mode-chip">
        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        Redacting
        <svg viewBox="0 0 24 24" class="rv-chevron"><path d="M7 10l5 5 5-5z"/></svg>
      </div>

      <div class="rv-marks-chip rv-marks-chip--applied" *ngIf="appliedCount > 0">
        <span class="rv-marks-dot rv-marks-dot--applied"></span>
        Applied {{ appliedCount }}
      </div>
      <div class="rv-marks-chip rv-marks-chip--draft" *ngIf="draftCount > 0">
        <span class="rv-marks-dot rv-marks-dot--draft"></span>
        Marked {{ draftCount }}
      </div>
    </div>

    <div class="rv-header-right">
      <button class="rv-icon-btn" (click)="prevPage()" [disabled]="currentPage <= 1">
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      <span class="rv-page-nav">{{ currentPage }} of {{ totalPages }}</span>
      <button class="rv-icon-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages">
        <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
      </button>

      <div class="rv-divider-v"></div>

      <label class="rv-preview-toggle">
        <input type="checkbox" [(ngModel)]="previewMode" (change)="onPreviewToggle()">
        <span class="rv-toggle-track">
          <span class="rv-toggle-thumb"></span>
        </span>
        Preview
      </label>

      <button class="rv-apply-btn" [class.rv-apply-btn--active]="marks.length > 0" (click)="openApplyModal()">
        Apply
      </button>
    </div>
  </header>

  <!-- ══ TOOLBAR ══ -->
  <div class="rv-toolbar">
    <button class="rv-tool-btn" title="Undo" (click)="undo()">
      <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
    </button>
    <button class="rv-tool-btn" title="Redo" (click)="redo()">
      <svg viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
    </button>

    <div class="rv-tool-separator"></div>

    <button class="rv-tool-tab" [class.rv-tool-tab--active]="toolMode === 'redact-area'" (click)="setToolMode('redact-area')">
      <svg viewBox="0 0 24 24"><path d="M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z"/></svg>
      Redact area
      <svg viewBox="0 0 24 24" class="rv-chevron"><path d="M7 10l5 5 5-5z"/></svg>
    </button>

    <button class="rv-tool-tab" [class.rv-tool-tab--active]="activeTab === 'search'" (click)="toggleTab('search')">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      Search &amp; redact
    </button>

    <button class="rv-tool-tab" [class.rv-tool-tab--active]="activeTab === 'detect'" (click)="toggleTab('detect')">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      Detect sensitive information
    </button>

    <span class="rv-unsaved" *ngIf="hasUnsaved">You have unsaved changes</span>
  </div>

  <!-- ══ MAIN BODY ══ -->
  <div class="rv-body">

    <!-- Left icon bar -->
    <div class="rv-left-icons">
      <button class="rv-icon-btn" title="Thumbnail view">
        <svg viewBox="0 0 24 24"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/></svg>
      </button>
      <button class="rv-icon-btn" title="List view">
        <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
      </button>
    </div>

    <!-- PDF scroll area -->
    <div class="rv-pdf-area" #pdfArea>
      <div class="rv-pages-container">

        <!-- Loading skeleton -->
        <div class="rv-loading" *ngIf="loading">
          <div class="rv-spinner"></div>
          <span>Loading document…</span>
        </div>

        <!-- Page wrappers -->
        <div
          *ngFor="let pg of pages; let i = index; trackBy: trackByPage"
          class="rv-page-wrap"
          [class.rv-page-wrap--current]="currentPage === i + 1"
          [id]="'page-wrap-' + (i+1)"
        >
          <canvas [id]="'rv-canvas-' + (i+1)" class="rv-page-canvas"></canvas>

          <!-- Interactive overlay -->
          <div
            class="rv-page-overlay"
            [style.width.px]="pg.width"
            [style.height.px]="pg.height"
            [class.rv-overlay--draw]="toolMode === 'redact-area'"
            (mousedown)="onOverlayMouseDown($event, i + 1)"
          >
            <!-- Search highlights -->
            <div
              *ngFor="let h of getSearchHighlights(i + 1)"
              class="rv-highlight"
              [class.rv-highlight--current]="h.isCurrent"
              [style.left.px]="h.x"
              [style.top.px]="h.y"
              [style.width.px]="h.width"
              [style.height.px]="h.height"
            ></div>

            <!-- PII highlights (detect results, not yet marked) -->
            <div
              *ngFor="let p of getDetectHighlights(i + 1)"
              class="rv-pii-highlight"
              [style.left.px]="p.x"
              [style.top.px]="p.y"
              [style.width.px]="p.width"
              [style.height.px]="p.height"
              [style.background]="getCatMeta(p.category).highlightColor"
              [style.borderColor]="darkenColor(p.category)"
            ></div>

            <!-- Redaction marks -->
            <div
              *ngFor="let m of getMarksForPage(i + 1)"
              class="rv-mark"
              [class.rv-mark--applied]="m.status === 'applied' || previewMode"
              [class.rv-mark--draft]="m.status === 'draft' && !previewMode"
              [style.left.px]="m.x"
              [style.top.px]="m.y"
              [style.width.px]="m.width"
              [style.height.px]="m.height"
              (click)="selectMark(m)"
            >
              <button *ngIf="m.status === 'draft' && !previewMode" class="rv-mark-del" (click)="$event.stopPropagation(); deleteMark(m.id)">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white"/></svg>
              </button>
            </div>

            <!-- Live draw rect -->
            <div
              *ngIf="drawing && drawing.pageNum === i + 1"
              class="rv-draw-rect"
              [style.left.px]="drawRect.x"
              [style.top.px]="drawRect.y"
              [style.width.px]="drawRect.width"
              [style.height.px]="drawRect.height"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ RIGHT MARKS PANEL ══ -->
    <div class="rv-marks-panel" *ngIf="showMarksPanel">
      <div class="rv-marks-header">
        <span class="rv-marks-title">Redaction marks</span>
        <button class="rv-icon-btn" (click)="showMarksPanel = false">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="rv-marks-tabs">
        <button class="rv-marks-tab" [class.rv-marks-tab--active]="groupBy === 'category'" (click)="groupBy = 'category'">By category</button>
        <button class="rv-marks-tab" [class.rv-marks-tab--active]="groupBy === 'page'" (click)="groupBy = 'page'">By page</button>
      </div>

      <!-- Empty state -->
      <div class="rv-marks-empty" *ngIf="marks.length === 0">
        <svg viewBox="0 0 80 80" class="rv-marks-empty-illu">
          <rect x="15" y="8" width="44" height="56" rx="4" fill="#DEE0EB"/>
          <rect x="21" y="16" width="32" height="4" rx="2" fill="#BBBDC8"/>
          <rect x="21" y="24" width="24" height="4" rx="2" fill="#BBBDC8"/>
          <rect x="21" y="32" width="28" height="4" rx="2" fill="#BBBDC8"/>
          <circle cx="56" cy="56" r="14" fill="#2C9C74"/>
          <path d="M50 56l4 4 8-8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="rv-marks-empty-text">You have no marks yet</p>
      </div>

      <!-- Marks by category -->
      <div class="rv-marks-list" *ngIf="marks.length > 0 && groupBy === 'category'">
        <ng-container *ngFor="let cat of categoriesWithMarks">
          <div class="rv-cat-header" (click)="toggleCatExpand(cat)">
            <svg class="rv-cat-icon" viewBox="0 0 24 24">
              <path [attr.d]="getCatMeta(cat).svgPath"/>
            </svg>
            <span class="rv-cat-label">{{ getCatMeta(cat).label }}</span>
            <span class="rv-cat-count">{{ getMarksByCategory(cat).length }}</span>
            <svg class="rv-cat-chevron" [class.rv-cat-chevron--open]="expandedCats.has(cat)" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          <div *ngIf="expandedCats.has(cat)" class="rv-cat-items">
            <div
              *ngFor="let m of getMarksByCategory(cat)"
              class="rv-mark-card"
              [class.rv-mark-card--selected]="selectedMark?.id === m.id"
              (click)="selectMark(m)"
            >
              <span class="rv-mark-page">Page {{ m.pageNum }}</span>
              <span class="rv-mark-text">{{ m.text || 'Manual redaction' }}</span>
              <button class="rv-mark-card-del" (click)="$event.stopPropagation(); deleteMark(m.id)">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Marks by page -->
      <div class="rv-marks-list" *ngIf="marks.length > 0 && groupBy === 'page'">
        <ng-container *ngFor="let pageNum of pagesWithMarks">
          <div class="rv-cat-header" (click)="togglePageExpand(pageNum)">
            <svg class="rv-cat-icon" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <span class="rv-cat-label">Page {{ pageNum }}</span>
            <span class="rv-cat-count">{{ getMarksByPage(pageNum).length }}</span>
            <svg class="rv-cat-chevron" [class.rv-cat-chevron--open]="expandedPages.has(pageNum)" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          <div *ngIf="expandedPages.has(pageNum)" class="rv-cat-items">
            <div
              *ngFor="let m of getMarksByPage(pageNum)"
              class="rv-mark-card"
              [class.rv-mark-card--selected]="selectedMark?.id === m.id"
              (click)="selectMark(m)"
            >
              <div class="rv-mark-card-top">
                <svg class="rv-cat-icon rv-cat-icon--sm" viewBox="0 0 24 24">
                  <path [attr.d]="getCatMeta(m.category).svgPath"/>
                </svg>
                <span class="rv-mark-text">{{ m.text || 'Manual redaction' }}</span>
                <button class="rv-mark-card-del" (click)="$event.stopPropagation(); deleteMark(m.id)">
                  <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Apply button -->
      <div class="rv-marks-footer" *ngIf="draftCount > 0">
        <button class="rv-marks-apply-btn" (click)="openApplyModal()">
          Apply redactions
        </button>
      </div>
    </div>

    <!-- Panel toggle button (always visible on right edge) -->
    <button class="rv-panel-toggle" (click)="showMarksPanel = !showMarksPanel" [class.rv-panel-toggle--open]="showMarksPanel">
      <svg viewBox="0 0 24 24"><path d="M3 3h7v18H3V3zm11 0h7v18h-7V3z"/></svg>
    </button>
  </div>

  <!-- ══ FLOATING: SEARCH PANEL ══ -->
  <div class="rv-float-panel" *ngIf="activeTab === 'search'">
    <div class="rv-float-panel-inner">
      <div class="rv-float-title">Search &amp; redact</div>

      <div class="rv-search-wrap">
        <svg class="rv-search-ico" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          class="rv-search-input"
          type="text"
          placeholder="Search"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          autofocus
        />
        <button class="rv-search-clear" *ngIf="searchQuery" (click)="clearSearch()">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <div class="rv-search-meta" *ngIf="searchQuery && searchHighlights.length > 0">
        <span>{{ currentSearchIdx + 1 }} of {{ searchHighlights.length }} results · {{ searchPagesCount }} {{ searchPagesCount === 1 ? 'page' : 'pages' }}</span>
        <div class="rv-search-nav">
          <button class="rv-icon-btn rv-icon-btn--sm" (click)="prevMatch()" [disabled]="searchHighlights.length === 0">
            <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
          <button class="rv-icon-btn rv-icon-btn--sm" (click)="nextMatch()" [disabled]="searchHighlights.length === 0">
            <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </button>
        </div>
      </div>

      <div class="rv-search-meta rv-search-meta--empty" *ngIf="searchQuery && searchHighlights.length === 0 && textReady">
        <span>No results found</span>
      </div>

      <button
        class="rv-mark-btn"
        [class.rv-mark-btn--active]="searchHighlights.length > 0"
        [disabled]="searchHighlights.length === 0"
        (click)="markSearchResults()"
      >Mark for redaction</button>
    </div>
  </div>

  <!-- ══ FLOATING: DETECT PANEL ══ -->
  <div class="rv-float-panel rv-float-panel--detect" *ngIf="activeTab === 'detect'">
    <div class="rv-float-panel-inner">

      <!-- Detecting state -->
      <div class="rv-detect-loading" *ngIf="detectState === 'detecting'">
        <svg class="rv-detect-illu" viewBox="0 0 120 100">
          <rect x="20" y="10" width="55" height="70" rx="4" fill="#DEE0EB"/>
          <rect x="28" y="20" width="40" height="5" rx="2" fill="#BBBDC8"/>
          <rect x="28" y="30" width="32" height="5" rx="2" fill="#BBBDC8"/>
          <rect x="28" y="40" width="36" height="5" rx="2" fill="#BBBDC8"/>
          <rect x="28" y="50" width="28" height="5" rx="2" fill="#BBBDC8"/>
          <circle cx="82" cy="68" r="22" fill="none" stroke="#DEE0EB" stroke-width="4"/>
          <circle cx="82" cy="68" r="22" fill="none" stroke="#2C9C74" stroke-width="4" stroke-dasharray="100 40" [style.animation]="'rv-spin 1s linear infinite'"/>
          <circle cx="82" cy="68" r="14" fill="none" stroke="#DEE0EB" stroke-width="3"/>
          <path d="M78 64 L84 70 L94 60" stroke="#2C9C74" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="rv-detect-title">Detecting sensitive information</div>
        <div class="rv-detect-sub">This can take a few moments…</div>
        <div class="rv-detect-progress">
          <div class="rv-detect-bar" [style.width.%]="detectProgress"></div>
        </div>
        <button class="rv-cancel-btn" (click)="cancelDetect()">Cancel</button>
      </div>

      <!-- Results state -->
      <div class="rv-detect-results" *ngIf="detectState === 'results'">
        <div class="rv-float-title">Sensitive information</div>
        <div class="rv-pii-chips">
          <button
            class="rv-pii-chip"
            [class.rv-pii-chip--active]="selectedPiiCats.has('all')"
            (click)="togglePiiFilter('all')"
          >
            All {{ getTotalPiiCount() }}
          </button>
          <button
            *ngFor="let cat of PII_ORDER"
            class="rv-pii-chip"
            [class.rv-pii-chip--active]="selectedPiiCats.has(cat)"
            [style.display]="getPiiCount(cat) === 0 ? 'none' : ''"
            (click)="togglePiiFilter(cat)"
          >
            <svg class="rv-pii-chip-ico" viewBox="0 0 24 24">
              <path [attr.d]="getCatMeta(cat).svgPath"/>
            </svg>
            {{ getCatMeta(cat).label }} {{ getPiiCount(cat) }}
          </button>
        </div>

        <button
          class="rv-mark-btn rv-mark-btn--active"
          (click)="markDetectedPii()"
        >Mark for redaction</button>

        <div class="rv-detect-note">
          <svg viewBox="0 0 24 24" class="rv-detect-note-ico">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          AI-generated – check for accuracy
        </div>
      </div>

      <!-- No results -->
      <div class="rv-detect-noresults" *ngIf="detectState === 'no-results'">
        <div class="rv-float-title">No sensitive information found</div>
        <p class="rv-detect-sub">We couldn't detect any sensitive information in this document.</p>
      </div>

      <!-- Idle — start button -->
      <div class="rv-detect-idle" *ngIf="detectState === 'idle'">
        <div class="rv-float-title">Detect sensitive information</div>
        <p class="rv-detect-sub">Automatically scan the document for personally identifiable information.</p>
        <button class="rv-mark-btn rv-mark-btn--active" (click)="startDetect()">
          Start detection
        </button>
      </div>
    </div>
  </div>

  <!-- ══ ZOOM CONTROLS ══ -->
  <div class="rv-zoom-controls">
    <div class="rv-page-indicator">
      <span class="rv-page-num">{{ currentPage }}</span>
      <span class="rv-page-total">{{ totalPages }}</span>
    </div>
    <button class="rv-zoom-btn" (click)="zoomIn()">
      <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    </button>
    <span class="rv-zoom-pct">{{ Math.round(scale * 100) }}%</span>
    <button class="rv-zoom-btn" (click)="zoomOut()">
      <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
    </button>
    <button class="rv-zoom-btn" (click)="fitToWindow()">
      <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
    </button>
  </div>

  <!-- ══ MODAL: APPLY ══ -->
  <div class="rv-modal-backdrop" *ngIf="showApplyModal" (click)="showApplyModal = false">
    <div class="rv-modal" (click)="$event.stopPropagation()">
      <div class="rv-modal-header">
        <span class="rv-modal-title">Apply changes</span>
        <button class="rv-icon-btn" (click)="showApplyModal = false">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="rv-modal-body">
        <p>Apply changes to the document?</p>
      </div>
      <div class="rv-modal-footer">
        <button class="rv-btn rv-btn--secondary" (click)="showApplyModal = false">Cancel</button>
        <button class="rv-btn rv-btn--primary" (click)="confirmApply()">Apply</button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL: LEAVE ══ -->
  <div class="rv-modal-backdrop" *ngIf="showLeaveModal" (click)="showLeaveModal = false">
    <div class="rv-modal" (click)="$event.stopPropagation()">
      <div class="rv-modal-header">
        <span class="rv-modal-title">Leave without saving</span>
        <button class="rv-icon-btn" (click)="showLeaveModal = false">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="rv-modal-body">
        <p>You have unsaved changes. Leave and discard the changes?</p>
      </div>
      <div class="rv-modal-footer">
        <button class="rv-btn rv-btn--secondary" (click)="showLeaveModal = false">Back</button>
        <button class="rv-btn rv-btn--danger" (click)="confirmLeave()">Leave</button>
      </div>
    </div>
  </div>

  <!-- Toast notification -->
  <div class="rv-toast" *ngIf="toastMsg" [class.rv-toast--visible]="toastVisible">
    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white"/></svg>
    {{ toastMsg }}
  </div>
</div>
  `,
  styles: [`
:host { display: block; height: 100vh; overflow: hidden; }

.rv-root {
  display: flex; flex-direction: column; height: 100vh;
  font-family: 'Inter', sans-serif; font-size: 14px;
  color: var(--color-text-primary, #1F2129);
  background: var(--color-stone-200, #F7F7F7);
  position: relative; overflow: hidden;
  user-select: none;
}

/* ── Header ── */
.rv-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 16px;
  background: white; border-bottom: 1px solid var(--color-divider, #DEE0EB);
  flex-shrink: 0; z-index: 20;
}
.rv-header-left, .rv-header-right { display: flex; align-items: center; gap: 8px; }
.rv-filename { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.rv-file-icon { width: 20px; height: 20px; flex-shrink: 0; }
.rv-mode-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 6px; cursor: pointer;
  background: var(--color-primary-50, #EBF8EF); color: var(--color-primary-600, #1C8269);
  font-weight: 500; font-size: 13px;
}
.rv-mode-chip svg { width: 16px; height: 16px; fill: currentColor; }
.rv-chevron { width: 18px; height: 18px; fill: currentColor; }
.rv-marks-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 500;
}
.rv-marks-chip--applied { background: #EBF8EF; color: #1C8269; }
.rv-marks-chip--draft { background: #FFF8E1; color: #F57C00; }
.rv-marks-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.rv-marks-dot--applied { background: #2C9C74; }
.rv-marks-dot--draft { background: #FF9800; }
.rv-page-nav { font-size: 14px; color: var(--color-text-secondary, #5F616A); white-space: nowrap; }
.rv-divider-v { width: 1px; height: 20px; background: var(--color-divider); margin: 0 4px; }
.rv-preview-toggle {
  display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;
  color: var(--color-text-secondary);
}
.rv-preview-toggle input { display: none; }
.rv-toggle-track {
  width: 36px; height: 20px; border-radius: 10px; background: #DEE0EB;
  position: relative; transition: background 0.2s;
}
.rv-preview-toggle input:checked + .rv-toggle-track { background: var(--color-primary-500, #2C9C74); }
.rv-toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%; background: white;
  transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.rv-preview-toggle input:checked + .rv-toggle-track .rv-toggle-thumb { left: 18px; }
.rv-apply-btn {
  padding: 7px 16px; border-radius: 6px; border: none; cursor: pointer;
  background: #DEE0EB; color: #9C9EA8; font-size: 14px; font-weight: 500;
  transition: background .15s, color .15s;
}
.rv-apply-btn--active { background: var(--color-primary-500, #2C9C74); color: white; }
.rv-apply-btn--active:hover { background: var(--color-primary-600, #1C8269); }

/* ── Toolbar ── */
.rv-toolbar {
  display: flex; align-items: center; gap: 4px;
  height: 48px; padding: 0 16px;
  background: white; border-bottom: 1px solid var(--color-divider);
  flex-shrink: 0; z-index: 20;
}
.rv-tool-separator { width: 1px; height: 24px; background: var(--color-divider); margin: 0 4px; }
.rv-tool-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
}
.rv-tool-btn:hover { background: var(--color-stone-300, #ECEEF9); }
.rv-tool-btn svg { width: 18px; height: 18px; fill: currentColor; }
.rv-tool-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--color-text-secondary); transition: background .12s, color .12s;
}
.rv-tool-tab:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
.rv-tool-tab svg { width: 16px; height: 16px; fill: currentColor; flex-shrink: 0; }
.rv-tool-tab--active {
  background: var(--color-primary-50, #EBF8EF);
  color: var(--color-primary-600, #1C8269);
}
.rv-unsaved { margin-left: auto; font-size: 13px; color: var(--color-text-secondary); }

/* ── Body layout ── */
.rv-body {
  display: flex; flex: 1; overflow: hidden; position: relative;
}
.rv-left-icons {
  width: 48px; background: white; border-right: 1px solid var(--color-divider);
  display: flex; flex-direction: column; align-items: center; padding-top: 12px; gap: 4px;
  flex-shrink: 0;
}

/* ── PDF area ── */
.rv-pdf-area {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  background: var(--color-stone-200, #F7F7F7);
  display: flex; justify-content: center;
  scroll-behavior: smooth;
}
.rv-pages-container {
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 0; gap: 20px; min-height: 100%;
}
.rv-loading {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px 0; color: var(--color-text-secondary);
}
.rv-spinner {
  width: 32px; height: 32px; border: 3px solid #DEE0EB;
  border-top-color: var(--color-primary-500); border-radius: 50%;
  animation: rv-spin 0.8s linear infinite;
}
@keyframes rv-spin { to { transform: rotate(360deg); } }

/* ── Page wrapper ── */
.rv-page-wrap {
  position: relative; display: inline-block;
  box-shadow: 0 2px 12px rgba(0,0,0,.15);
  background: white;
}
.rv-page-canvas { display: block; }
.rv-page-overlay {
  position: absolute; top: 0; left: 0;
  pointer-events: none;
}
.rv-overlay--draw { pointer-events: all; cursor: crosshair; }

/* ── Highlights ── */
.rv-highlight {
  position: absolute; background: rgba(255, 193, 7, 0.4);
  border: 1px solid rgba(255, 193, 7, 0.8);
  pointer-events: none; border-radius: 2px;
}
.rv-highlight--current {
  background: rgba(255, 152, 0, 0.5);
  border-color: rgba(255, 152, 0, 1);
}
.rv-pii-highlight {
  position: absolute; border: 1.5px solid;
  pointer-events: none; border-radius: 2px; opacity: 0.85;
}

/* ── Redaction marks ── */
.rv-mark {
  position: absolute; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 2px;
}
.rv-mark--draft {
  background: rgba(31, 33, 41, 0.7);
  border: 2px dashed rgba(255,255,255,.6);
}
.rv-mark--applied {
  background: #1F2129;
  border: none;
}
.rv-mark-del {
  position: absolute; top: -8px; right: -8px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--color-error-600, #E54430); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s;
}
.rv-mark:hover .rv-mark-del { opacity: 1; }
.rv-mark-del svg { width: 12px; height: 12px; }
.rv-draw-rect {
  position: absolute; background: rgba(31,33,41,.5);
  border: 2px dashed rgba(255,255,255,.7);
  pointer-events: none;
}

/* ── Marks panel ── */
.rv-marks-panel {
  width: 280px; background: white;
  border-left: 1px solid var(--color-divider);
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden;
}
.rv-marks-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px; border-bottom: 1px solid var(--color-divider);
}
.rv-marks-title { font-size: 15px; font-weight: 600; }
.rv-marks-tabs {
  display: flex; padding: 8px 12px; gap: 4px;
  border-bottom: 1px solid var(--color-divider);
}
.rv-marks-tab {
  flex: 1; padding: 6px 8px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; font-size: 13px;
  color: var(--color-text-secondary);
}
.rv-marks-tab--active {
  background: var(--color-stone-200); color: var(--color-text-primary); font-weight: 500;
}
.rv-marks-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; padding: 32px 16px; gap: 12px;
}
.rv-marks-empty-illu { width: 80px; height: 80px; }
.rv-marks-empty-text { color: var(--color-text-secondary); font-size: 13px; text-align: center; }
.rv-marks-list { flex: 1; overflow-y: auto; }
.rv-cat-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; cursor: pointer;
  border-bottom: 1px solid var(--color-divider);
}
.rv-cat-header:hover { background: var(--color-stone-200); }
.rv-cat-icon { width: 16px; height: 16px; fill: var(--color-primary-500, #2C9C74); flex-shrink: 0; }
.rv-cat-icon--sm { width: 14px; height: 14px; }
.rv-cat-label { flex: 1; font-size: 13px; font-weight: 500; }
.rv-cat-count {
  font-size: 12px; color: white; background: var(--color-primary-500);
  border-radius: 10px; padding: 1px 6px;
}
.rv-cat-chevron { width: 18px; height: 18px; fill: var(--color-stone-600); transition: transform .15s; }
.rv-cat-chevron--open { transform: rotate(180deg); }
.rv-cat-items { background: var(--color-stone-100, #FAFAFA); }
.rv-mark-card {
  padding: 8px 16px; cursor: pointer; border-bottom: 1px solid var(--color-divider);
  display: flex; flex-direction: column; gap: 4px;
}
.rv-mark-card:hover { background: var(--color-stone-200); }
.rv-mark-card--selected { background: var(--color-primary-50); }
.rv-mark-card-top { display: flex; align-items: center; gap: 6px; }
.rv-mark-page {
  font-size: 11px; color: white; background: var(--color-stone-700, #73757F);
  border-radius: 10px; padding: 1px 7px; white-space: nowrap; flex-shrink: 0;
}
.rv-mark-text {
  font-size: 12px; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
}
.rv-mark-card-del {
  width: 24px; height: 24px; border: none; background: transparent;
  cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center;
  opacity: 0; flex-shrink: 0;
}
.rv-mark-card-del svg { width: 14px; height: 14px; fill: var(--color-stone-600); }
.rv-mark-card:hover .rv-mark-card-del { opacity: 1; }
.rv-mark-card-del:hover svg { fill: var(--color-error-600, #E54430); }
.rv-marks-footer {
  padding: 12px; border-top: 1px solid var(--color-divider);
}
.rv-marks-apply-btn {
  width: 100%; padding: 9px; border-radius: 6px; border: none;
  background: var(--color-primary-500, #2C9C74); color: white;
  font-size: 14px; font-weight: 500; cursor: pointer;
}
.rv-marks-apply-btn:hover { background: var(--color-primary-600, #1C8269); }

/* Panel toggle */
.rv-panel-toggle {
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  width: 28px; height: 52px; border-radius: 6px 0 0 6px;
  background: white; border: 1px solid var(--color-divider); border-right: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: -2px 0 6px rgba(0,0,0,.06); z-index: 10;
  color: var(--color-stone-600);
}
.rv-panel-toggle--open { right: 280px; }
.rv-panel-toggle svg { width: 14px; height: 14px; fill: currentColor; }

/* ── Zoom controls ── */
.rv-zoom-controls {
  position: absolute; bottom: 20px; left: 64px;
  display: flex; align-items: center; gap: 6px;
  background: white; border: 1px solid var(--color-divider);
  border-radius: 8px; padding: 6px 10px; z-index: 15;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
}
.rv-page-indicator {
  display: flex; flex-direction: column; align-items: center;
  padding-right: 8px; border-right: 1px solid var(--color-divider);
  margin-right: 4px;
}
.rv-page-num {
  font-size: 14px; font-weight: 600; line-height: 1;
  background: var(--color-stone-200); padding: 2px 6px; border-radius: 4px;
}
.rv-page-total { font-size: 11px; color: var(--color-text-secondary); }
.rv-zoom-btn {
  width: 28px; height: 28px; border: none; background: transparent;
  cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center;
}
.rv-zoom-btn:hover { background: var(--color-stone-200); }
.rv-zoom-btn svg { width: 18px; height: 18px; fill: var(--color-text-secondary); }
.rv-zoom-pct { font-size: 13px; color: var(--color-text-secondary); min-width: 38px; text-align: center; }

/* ── Floating panels ── */
.rv-float-panel {
  position: absolute; top: 108px; left: 64px; z-index: 30;
  background: white; border-radius: 8px; border: 1px solid var(--color-divider);
  box-shadow: 0 4px 16px rgba(0,0,0,.12); min-width: 300px;
}
.rv-float-panel--detect { min-width: 320px; }
.rv-float-panel-inner { padding: 16px; }
.rv-float-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.rv-search-wrap {
  display: flex; align-items: center;
  border: 1.5px solid var(--color-primary-500, #2C9C74);
  border-radius: 6px; padding: 0 10px; gap: 8px;
  margin-bottom: 8px;
}
.rv-search-ico { width: 16px; height: 16px; fill: var(--color-primary-500); flex-shrink: 0; }
.rv-search-input {
  flex: 1; border: none; outline: none; padding: 8px 0;
  font-size: 14px; font-family: inherit;
}
.rv-search-clear {
  border: none; background: transparent; cursor: pointer; padding: 0;
  display: flex; align-items: center;
}
.rv-search-clear svg { width: 16px; height: 16px; fill: var(--color-stone-600); }
.rv-search-meta {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: var(--color-text-secondary); margin-bottom: 8px;
}
.rv-search-meta--empty { color: var(--color-stone-600); justify-content: center; }
.rv-search-nav { display: flex; gap: 2px; }
.rv-mark-btn {
  width: 100%; padding: 9px; border-radius: 6px; border: none;
  background: #DEE0EB; color: #9C9EA8; font-size: 14px; font-weight: 500; cursor: not-allowed;
  transition: background .15s, color .15s;
}
.rv-mark-btn--active {
  background: var(--color-primary-500, #2C9C74); color: white; cursor: pointer;
}
.rv-mark-btn--active:hover { background: var(--color-primary-600, #1C8269); }

/* Detect panel states */
.rv-detect-loading {
  display: flex; flex-direction: column; align-items: center; padding: 8px 0 4px; gap: 10px;
}
.rv-detect-illu { width: 120px; height: 90px; }
.rv-detect-title { font-size: 15px; font-weight: 600; text-align: center; }
.rv-detect-sub { font-size: 13px; color: var(--color-text-secondary); text-align: center; margin: 0; }
.rv-detect-progress {
  width: 100%; height: 4px; background: #DEE0EB; border-radius: 2px; overflow: hidden;
}
.rv-detect-bar {
  height: 100%; background: var(--color-primary-500); border-radius: 2px;
  transition: width 0.3s ease;
}
.rv-cancel-btn {
  width: 100%; padding: 9px; border-radius: 6px; border: 1.5px solid var(--color-divider);
  background: white; font-size: 14px; font-weight: 500; cursor: pointer;
}
.rv-cancel-btn:hover { background: var(--color-stone-200); }
.rv-detect-results { display: flex; flex-direction: column; gap: 12px; }
.rv-pii-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.rv-pii-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px; border: 1px solid var(--color-divider);
  background: white; font-size: 12px; cursor: pointer; font-family: inherit;
  color: var(--color-text-secondary);
  transition: background .12s, color .12s, border-color .12s;
}
.rv-pii-chip--active {
  background: var(--color-primary-50); color: var(--color-primary-600);
  border-color: var(--color-primary-500);
}
.rv-pii-chip-ico { width: 13px; height: 13px; fill: currentColor; }
.rv-detect-note {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary);
}
.rv-detect-note-ico { width: 14px; height: 14px; fill: var(--color-stone-600); }
.rv-detect-idle { display: flex; flex-direction: column; gap: 10px; }
.rv-detect-noresults { display: flex; flex-direction: column; gap: 8px; }

/* ── Icon button ── */
.rv-icon-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-stone-700, #73757F);
}
.rv-icon-btn:hover { background: var(--color-stone-300, #ECEEF9); }
.rv-icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
.rv-icon-btn--sm { width: 26px; height: 26px; }
.rv-icon-btn--sm svg { width: 14px; height: 14px; }
.rv-icon-btn:disabled { opacity: .4; cursor: default; }
.rv-icon-btn:disabled:hover { background: transparent; }

/* ── Modals ── */
.rv-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.rv-modal {
  background: white; border-radius: 12px; min-width: 380px; max-width: 500px;
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
}
.rv-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 0;
}
.rv-modal-title { font-size: 16px; font-weight: 600; }
.rv-modal-body { padding: 16px 20px; }
.rv-modal-body p { margin: 0; color: var(--color-text-secondary); font-size: 14px; }
.rv-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 0 20px 20px;
}
.rv-btn {
  padding: 8px 20px; border-radius: 6px; border: none; cursor: pointer;
  font-size: 14px; font-weight: 500; font-family: inherit;
}
.rv-btn--secondary {
  background: white; color: var(--color-text-primary);
  border: 1.5px solid var(--color-divider);
}
.rv-btn--secondary:hover { background: var(--color-stone-200); }
.rv-btn--primary {
  background: var(--color-primary-500, #2C9C74); color: white;
}
.rv-btn--primary:hover { background: var(--color-primary-600, #1C8269); }
.rv-btn--danger { background: var(--color-error-600, #E54430); color: white; }
.rv-btn--danger:hover { background: #c0392b; }

/* ── Toast ── */
.rv-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(20px);
  background: var(--color-stone-900, #40424B); color: white;
  padding: 10px 20px; border-radius: 8px; font-size: 14px;
  display: flex; align-items: center; gap: 8px;
  opacity: 0; transition: opacity .3s, transform .3s; z-index: 200;
}
.rv-toast svg { width: 16px; height: 16px; fill: white; }
.rv-toast--visible { opacity: 1; transform: translateX(-50%) translateY(0); }
  `]
})
export class RedactionViewerComponent implements OnInit, OnDestroy {

  // ── PDF state ─────────────────────────────────────────────────────────────
  pages: PageRender[] = [];
  loading = true;
  textReady = false;
  scale = 1.0;
  currentPage = 1;
  totalPages = 3;
  private pdfDoc: any = null;
  private textItems: TextItem[] = [];

  // ── UI state ──────────────────────────────────────────────────────────────
  toolMode: 'redact-area' | 'none' = 'none';
  activeTab: TabMode = null;
  showMarksPanel = false;
  previewMode = false;
  groupBy: GroupBy = 'category';

  // ── Expand state ──────────────────────────────────────────────────────────
  expandedCats = new Set<string>(['personal-name', 'address', 'date-time']);
  expandedPages = new Set<number>([1, 2, 3]);

  // ── Search ────────────────────────────────────────────────────────────────
  searchQuery = '';
  searchHighlights: SearchHighlight[] = [];
  currentSearchIdx = 0;

  // ── Detect ────────────────────────────────────────────────────────────────
  detectState: DetectState = 'idle';
  detectProgress = 0;
  private detectTimer: any;
  private detectProgressTimer: any;
  detectedPii: PiiMatch[] = [];
  selectedPiiCats = new Set<string>(['all']);
  PII_ORDER = PII_ORDER;

  // ── Marks ─────────────────────────────────────────────────────────────────
  marks: RedactionMark[] = [];
  selectedMark: RedactionMark | null = null;

  // ── Draw state ────────────────────────────────────────────────────────────
  drawing: { pageNum: number; startX: number; startY: number } | null = null;
  drawRect = { x: 0, y: 0, width: 0, height: 0 };

  // ── Modals ────────────────────────────────────────────────────────────────
  showApplyModal = false;
  showLeaveModal = false;

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastMsg = '';
  toastVisible = false;
  private toastTimer: any;

  // ── History (for undo/redo) ───────────────────────────────────────────────
  private history: RedactionMark[][] = [];
  private historyIdx = -1;

  Math = Math;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    await this.loadPdf();
  }

  ngOnDestroy() {
    clearTimeout(this.detectTimer);
    clearInterval(this.detectProgressTimer);
    clearTimeout(this.toastTimer);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.activeTab = null;
      this.drawing = null;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); this.undo(); }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Z') { e.preventDefault(); this.redo(); }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { this.nextPage(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { this.prevPage(); }
  }

  trackByPage(_: number, pg: PageRender): number { return pg.num; }

  // ── PDF loading ───────────────────────────────────────────────────────────
  async loadPdf() {
    try {
      this.loading = true;
      const loadingTask = pdfjsLib.getDocument('/assets/pdfs/protocol.pdf');
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;

      // Phase 1: wait for container to be in DOM, then calculate scale
      await new Promise<void>(res => setTimeout(res, 60));
      const BASE_WIDTH = 595;
      this.scale = this.calculateScale(BASE_WIDTH);

      // Phase 2: build pages[] with final dimensions
      for (let i = 1; i <= this.totalPages; i++) {
        const page = await this.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: this.scale });
        this.pages.push({ num: i, width: viewport.width, height: viewport.height, scale: this.scale });
      }
      this.loading = false;
      this.cdr.detectChanges();

      // Phase 3: wait for *ngFor to stamp canvases
      await new Promise<void>(res => setTimeout(res, 80));

      // Render first 3 pages immediately for fast UI, rest + text extraction in background
      const PRIORITY = Math.min(3, this.totalPages);
      for (let i = 1; i <= PRIORITY; i++) {
        await this.renderPageToCanvas(i);
      }
      // Start text extraction early (only first 3 pages) so search is usable quickly
      await this.extractAllText(PRIORITY);

      // Background: render remaining pages + re-extract full text
      (async () => {
        for (let i = PRIORITY + 1; i <= this.totalPages; i++) {
          await this.renderPageToCanvas(i);
        }
        await this.extractAllText();
      })();
    } catch (err) {
      console.error('PDF load error', err);
      this.loading = false;
    }
  }

  async renderPageToCanvas(pageNum: number): Promise<void> {
    const canvas = document.getElementById(`rv-canvas-${pageNum}`) as HTMLCanvasElement;
    if (!canvas) { return; }

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    // No detectChanges here — avoids Angular recreating the canvas element
  }

  // Re-renders all pages at new scale (zoom)
  async renderPage(pageNum: number): Promise<void> {
    return this.renderPageToCanvas(pageNum);
  }

  private calculateScale(baseWidth: number): number {
    const container = document.querySelector('.rv-pdf-area');
    const available = (container?.clientWidth || 800) - 80;
    const target = Math.min(available, 760);
    return target / baseWidth;
  }

  async extractAllText(upToPage?: number) {
    const limit = upToPage ?? this.totalPages;
    if (!upToPage) this.textItems = []; // full reset only for full extraction
    for (let i = 1; i <= limit; i++) {
      await this.extractPageText(i);
    }
    this.textReady = true;
    // Re-run pending search now that text is ready
    if (this.searchQuery) this.runSearch(this.searchQuery);
    this.cdr.detectChanges();
  }

  async extractPageText(pageNum: number) {
    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.scale });
    const content = await page.getTextContent();

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const x = tx[4];
      const y = tx[5] - item.height * this.scale;
      const w = item.width * this.scale;
      const h = item.height * this.scale;

      this.textItems.push({
        text: item.str, pageNum,
        x: Math.max(0, x), y: Math.max(0, y),
        width: Math.max(w, 4), height: Math.max(h, 8)
      });
    }
  }

  // ── Tool modes ────────────────────────────────────────────────────────────
  setToolMode(mode: 'redact-area' | 'none') {
    this.toolMode = this.toolMode === mode ? 'none' : mode;
    if (this.toolMode === 'redact-area') {
      this.activeTab = null;
      this.showMarksPanel = true;
    }
  }

  toggleTab(tab: 'search' | 'detect') {
    this.activeTab = this.activeTab === tab ? null : tab;
    if (this.activeTab) this.toolMode = 'none';
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToPage(this.currentPage);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToPage(this.currentPage);
    }
  }

  private scrollToPage(pageNum: number) {
    const el = document.getElementById(`page-wrap-${pageNum}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  zoomIn() {
    this.scale = Math.min(this.scale + 0.15, 3.0);
    this.reRenderAll();
  }

  zoomOut() {
    this.scale = Math.max(this.scale - 0.15, 0.4);
    this.reRenderAll();
  }

  fitToWindow() {
    this.scale = this.calculateScale(595);
    this.reRenderAll();
  }

  private async reRenderAll() {
    // Update pages array dimensions at new scale, then re-render canvases
    const newPages: PageRender[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      const page = await this.pdfDoc.getPage(i);
      const vp = page.getViewport({ scale: this.scale });
      newPages.push({ num: i, width: vp.width, height: vp.height, scale: this.scale });
    }
    this.pages = newPages;
    this.cdr.detectChanges();
    await new Promise<void>(res => setTimeout(res, 60));
    for (let i = 1; i <= this.totalPages; i++) {
      await this.renderPageToCanvas(i);
    }
    await this.extractAllText();
    if (this.searchQuery) this.runSearch(this.searchQuery);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchChange(q: string) {
    this.currentSearchIdx = 0;
    if (!q.trim()) { this.searchHighlights = []; return; }
    if (this.textReady) this.runSearch(q);
  }

  private runSearch(q: string) {
    const lower = q.toLowerCase();
    const results: SearchHighlight[] = [];
    for (const item of this.textItems) {
      const idx = item.text.toLowerCase().indexOf(lower);
      if (idx === -1) continue;
      // Approximate width for the matched portion
      const charW = item.width / Math.max(item.text.length, 1);
      const matchW = lower.length * charW;
      const matchX = item.x + idx * charW;
      results.push({
        id: crypto.randomUUID(),
        text: item.text.substring(idx, idx + q.length),
        pageNum: item.pageNum,
        x: matchX, y: item.y,
        width: matchW, height: item.height + 2,
        isCurrent: false
      });
    }
    this.searchHighlights = results;
    if (results.length > 0) {
      this.currentSearchIdx = 0;
      this.searchHighlights[0].isCurrent = true;
      this.scrollToPage(results[0].pageNum);
    }
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchHighlights = [];
  }

  nextMatch() {
    if (!this.searchHighlights.length) return;
    this.searchHighlights[this.currentSearchIdx].isCurrent = false;
    this.currentSearchIdx = (this.currentSearchIdx + 1) % this.searchHighlights.length;
    this.searchHighlights[this.currentSearchIdx].isCurrent = true;
    this.scrollToPage(this.searchHighlights[this.currentSearchIdx].pageNum);
  }

  prevMatch() {
    if (!this.searchHighlights.length) return;
    this.searchHighlights[this.currentSearchIdx].isCurrent = false;
    this.currentSearchIdx = (this.currentSearchIdx - 1 + this.searchHighlights.length) % this.searchHighlights.length;
    this.searchHighlights[this.currentSearchIdx].isCurrent = true;
    this.scrollToPage(this.searchHighlights[this.currentSearchIdx].pageNum);
  }

  markSearchResults() {
    if (!this.searchHighlights.length) return;
    this.saveHistory();
    for (const h of this.searchHighlights) {
      if (!this.marks.find(m => m.x === h.x && m.y === h.y && m.pageNum === h.pageNum)) {
        this.marks.push({
          id: crypto.randomUUID(), text: h.text,
          pageNum: h.pageNum, x: h.x, y: h.y, width: h.width, height: h.height,
          category: 'personal-name', status: 'draft'
        });
      }
    }
    this.clearSearch();
    this.activeTab = null;
    this.showMarksPanel = true;
    this.showToast(`${this.marks.filter(m => m.status === 'draft').length} marks added`);
  }

  get searchPagesCount() {
    return new Set(this.searchHighlights.map(h => h.pageNum)).size;
  }

  // ── Detect PII ────────────────────────────────────────────────────────────
  startDetect() {
    this.detectState = 'detecting';
    this.detectProgress = 0;
    this.detectProgressTimer = setInterval(() => {
      this.detectProgress += Math.random() * 15 + 5;
      if (this.detectProgress >= 100) {
        this.detectProgress = 100;
        clearInterval(this.detectProgressTimer);
      }
      this.cdr.detectChanges();
    }, 220);

    this.detectTimer = setTimeout(async () => {
      clearInterval(this.detectProgressTimer);
      this.detectProgress = 100;
      await this.runPiiDetection();
      this.detectState = this.detectedPii.length > 0 ? 'results' : 'no-results';
      this.selectedPiiCats = new Set(['all']);
      this.cdr.detectChanges();
    }, 2800);
  }

  cancelDetect() {
    clearTimeout(this.detectTimer);
    clearInterval(this.detectProgressTimer);
    this.detectState = 'idle';
    this.detectedPii = [];
  }

  private async runPiiDetection() {
    this.detectedPii = [];
    if (!this.textReady) return;

    const patterns: { cat: PiiCategory; re: RegExp }[] = [
      { cat: 'email', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
      { cat: 'phone', re: /\b(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
      { cat: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/g },
      { cat: 'iban', re: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7,15}\b/g },
      { cat: 'date-time', re: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/gi },
    ];

    for (const item of this.textItems) {
      for (const { cat, re } of patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(item.text)) !== null) {
          const charW = item.width / Math.max(item.text.length, 1);
          const matchX = item.x + m.index * charW;
          const matchW = m[0].length * charW;
          this.detectedPii.push({
            id: crypto.randomUUID(), text: m[0], category: cat,
            pageNum: item.pageNum,
            x: matchX, y: item.y,
            width: Math.max(matchW, 20), height: item.height + 2
          });
        }
      }
    }

    // Add hardcoded realistic PII for categories hard to detect with regex
    this.addHardcodedPii();
  }

  private addHardcodedPii() {
    // Personal names — find items that look like name patterns in study context
    const namePatterns = ['WILLIAM C', 'KATHRIN U', 'ANN R', 'UGUR S', 'OZLEM T'];
    for (const item of this.textItems) {
      for (const np of namePatterns) {
        if (item.text.toUpperCase().includes(np)) {
          this.detectedPii.push({
            id: crypto.randomUUID(), text: item.text.trim(), category: 'personal-name',
            pageNum: item.pageNum,
            x: item.x, y: item.y, width: item.width, height: item.height + 2
          });
        }
      }
    }

    // Find address-like patterns
    for (const item of this.textItems) {
      if (/\b(Street|Avenue|Boulevard|Road|Lane|Drive|Pfizer|BioNTech|Mainz|New York)\b/i.test(item.text)) {
        this.detectedPii.push({
          id: crypto.randomUUID(), text: item.text.trim(), category: 'address',
          pageNum: item.pageNum,
          x: item.x, y: item.y, width: item.width, height: item.height + 2
        });
      }
    }

    // Passport — look for mixed alphanumeric patterns that look like passport numbers
    for (const item of this.textItems) {
      if (/\b[A-Z]{2}\d{7}\b/.test(item.text)) {
        const m = item.text.match(/\b[A-Z]{2}\d{7}\b/)!;
        const charW = item.width / Math.max(item.text.length, 1);
        const idx = item.text.indexOf(m[0]);
        this.detectedPii.push({
          id: crypto.randomUUID(), text: m[0], category: 'passport',
          pageNum: item.pageNum,
          x: item.x + idx * charW, y: item.y,
          width: m[0].length * charW, height: item.height + 2
        });
      }
    }

    // IBAN — look for long alphanumeric with country prefix
    for (const item of this.textItems) {
      if (/\b(DE|GB|FR|US)[A-Z0-9]{16,}\b/.test(item.text)) {
        const m = item.text.match(/\b(DE|GB|FR|US)[A-Z0-9]{16,}\b/)!;
        this.detectedPii.push({
          id: crypto.randomUUID(), text: m[0], category: 'iban',
          pageNum: item.pageNum,
          x: item.x, y: item.y, width: item.width, height: item.height + 2
        });
      }
    }

    // SSN patterns (US format)
    for (const item of this.textItems) {
      const m = item.text.match(/\b\d{3}-\d{2}-\d{4}\b/);
      if (m) {
        this.detectedPii.push({
          id: crypto.randomUUID(), text: m[0], category: 'ssn',
          pageNum: item.pageNum, x: item.x, y: item.y,
          width: item.width, height: item.height + 2
        });
      }
    }
  }

  togglePiiFilter(key: string) {
    if (key === 'all') {
      this.selectedPiiCats = new Set(['all']);
      return;
    }
    this.selectedPiiCats.delete('all');
    if (this.selectedPiiCats.has(key)) {
      this.selectedPiiCats.delete(key);
      if (this.selectedPiiCats.size === 0) this.selectedPiiCats.add('all');
    } else {
      this.selectedPiiCats.add(key);
    }
  }

  getPiiCount(cat: PiiCategory): number {
    return this.detectedPii.filter(p => p.category === cat).length;
  }

  getTotalPiiCount(): number {
    return this.detectedPii.length;
  }

  markDetectedPii() {
    const toMark = this.selectedPiiCats.has('all')
      ? this.detectedPii
      : this.detectedPii.filter(p => this.selectedPiiCats.has(p.category));

    this.saveHistory();
    for (const p of toMark) {
      if (!this.marks.find(m => m.x === p.x && m.y === p.y && m.pageNum === p.pageNum)) {
        this.marks.push({
          id: crypto.randomUUID(), text: p.text,
          pageNum: p.pageNum, x: p.x, y: p.y, width: p.width, height: p.height,
          category: p.category, status: 'draft'
        });
      }
    }
    this.detectedPii = [];
    this.detectState = 'idle';
    this.activeTab = null;
    this.showMarksPanel = true;
    this.expandedCats = new Set<string>(this.categoriesWithMarks);
    this.showToast(`${toMark.length} marks added`);
  }

  // ── Detected highlights on page ───────────────────────────────────────────
  getDetectHighlights(pageNum: number): PiiMatch[] {
    if (this.detectState !== 'results') return [];
    return this.detectedPii.filter(p => {
      if (p.pageNum !== pageNum) return false;
      if (this.selectedPiiCats.has('all')) return true;
      return this.selectedPiiCats.has(p.category);
    });
  }

  // ── Manual draw (redact area) ─────────────────────────────────────────────
  onOverlayMouseDown(e: MouseEvent, pageNum: number) {
    if (this.toolMode !== 'redact-area') return;
    const overlay = e.currentTarget as HTMLElement;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.drawing = { pageNum, startX: x, startY: y };
    this.drawRect = { x, y, width: 0, height: 0 };
    e.preventDefault();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.drawing) return;
    const overlay = document.querySelector(`#page-wrap-${this.drawing.pageNum} .rv-page-overlay`) as HTMLElement;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.drawRect = {
      x: Math.min(x, this.drawing.startX),
      y: Math.min(y, this.drawing.startY),
      width: Math.abs(x - this.drawing.startX),
      height: Math.abs(y - this.drawing.startY)
    };
  }

  onMouseUp(e: MouseEvent) {
    if (!this.drawing) return;
    if (this.drawRect.width > 8 && this.drawRect.height > 8) {
      this.saveHistory();
      this.marks.push({
        id: crypto.randomUUID(), text: '',
        pageNum: this.drawing.pageNum,
        x: this.drawRect.x, y: this.drawRect.y,
        width: this.drawRect.width, height: this.drawRect.height,
        category: 'manual' as any, status: 'draft'
      });
      this.showMarksPanel = true;
    }
    this.drawing = null;
    this.drawRect = { x: 0, y: 0, width: 0, height: 0 };
  }

  // ── Marks helpers ─────────────────────────────────────────────────────────
  getSearchHighlights(pageNum: number): SearchHighlight[] {
    return this.searchHighlights.filter(h => h.pageNum === pageNum);
  }

  getMarksForPage(pageNum: number): RedactionMark[] {
    return this.marks.filter(m => m.pageNum === pageNum);
  }

  getMarksByCategory(cat: PiiCategory | 'manual'): RedactionMark[] {
    return this.marks.filter(m => m.category === cat);
  }

  getMarksByPage(pageNum: number): RedactionMark[] {
    return this.marks.filter(m => m.pageNum === pageNum);
  }

  get categoriesWithMarks(): (PiiCategory | 'manual')[] {
    const cats = new Set(this.marks.map(m => m.category));
    const order: (PiiCategory | 'manual')[] = [...PII_ORDER, 'manual' as const];
    return order.filter(c => cats.has(c));
  }

  get pagesWithMarks(): number[] {
    return [...new Set(this.marks.map(m => m.pageNum))].sort((a, b) => a - b);
  }

  get draftCount() { return this.marks.filter(m => m.status === 'draft').length; }
  get appliedCount() { return this.marks.filter(m => m.status === 'applied').length; }
  get hasUnsaved() { return this.draftCount > 0 || this.appliedCount > 0; }

  selectMark(m: RedactionMark) {
    this.selectedMark = this.selectedMark?.id === m.id ? null : m;
    this.scrollToPage(m.pageNum);
  }

  deleteMark(id: string) {
    this.saveHistory();
    this.marks = this.marks.filter(m => m.id !== id);
    if (this.selectedMark?.id === id) this.selectedMark = null;
  }

  toggleCatExpand(cat: string) {
    if (this.expandedCats.has(cat)) this.expandedCats.delete(cat);
    else this.expandedCats.add(cat);
  }

  togglePageExpand(page: number) {
    if (this.expandedPages.has(page)) this.expandedPages.delete(page);
    else this.expandedPages.add(page);
  }

  // ── Apply / Leave ─────────────────────────────────────────────────────────
  openApplyModal() {
    if (this.marks.length === 0) return;
    this.showApplyModal = true;
  }

  confirmApply() {
    this.saveHistory();
    this.marks = this.marks.map(m => ({ ...m, status: 'applied' }));
    this.showApplyModal = false;
    this.showToast('Redactions applied successfully');
  }

  confirmLeave() {
    this.showLeaveModal = false;
    // In prototype context, just clear marks
    this.marks = [];
    this.selectedMark = null;
  }

  onBack() {
    if (this.marks.length > 0) {
      this.showLeaveModal = true;
    }
  }

  onPreviewToggle() {
    // Preview mode shows applied appearance for draft marks
  }

  // ── History (undo/redo) ───────────────────────────────────────────────────
  private saveHistory() {
    this.history = this.history.slice(0, this.historyIdx + 1);
    this.history.push(JSON.parse(JSON.stringify(this.marks)));
    this.historyIdx = this.history.length - 1;
  }

  undo() {
    if (this.historyIdx <= 0) return;
    this.historyIdx--;
    this.marks = JSON.parse(JSON.stringify(this.history[this.historyIdx]));
  }

  redo() {
    if (this.historyIdx >= this.history.length - 1) return;
    this.historyIdx++;
    this.marks = JSON.parse(JSON.stringify(this.history[this.historyIdx]));
  }

  // ── PII category helpers ──────────────────────────────────────────────────
  getCatMeta(cat: PiiCategory | string) {
    return CAT_META[cat as PiiCategory] || CAT_META['personal-name'];
  }

  darkenColor(cat: PiiCategory): string {
    const colors: Record<PiiCategory, string> = {
      'personal-name': 'rgba(255, 193, 7, 0.9)',
      'address': 'rgba(33, 150, 243, 0.8)',
      'date-time': 'rgba(76, 175, 80, 0.8)',
      'email': 'rgba(156, 39, 176, 0.7)',
      'phone': 'rgba(255, 87, 34, 0.7)',
      'iban': 'rgba(0, 188, 212, 0.7)',
      'ssn': 'rgba(233, 30, 99, 0.7)',
      'passport': 'rgba(121, 85, 72, 0.7)'
    };
    return colors[cat] || 'rgba(0,0,0,0.4)';
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  private showToast(msg: string) {
    this.toastMsg = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      setTimeout(() => { this.toastMsg = ''; this.cdr.detectChanges(); }, 350);
      this.cdr.detectChanges();
    }, 3000);
  }
}
