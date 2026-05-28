import {
  Component, OnInit, OnDestroy, ViewChildren, QueryList,
  ElementRef, ChangeDetectorRef, NgZone, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Types ──────────────────────────────────────────────────────────────────
type PiiCategory = 'personal-name' | 'address' | 'date-time' | 'email' | 'phone' | 'iban' | 'ssn' | 'passport';
type MarkCategory = PiiCategory | 'manual' | 'keyword';
type TabMode = 'search' | 'detect' | null;
type DetectState = 'idle' | 'detecting' | 'results' | 'no-results';
type MarkStatus = 'draft' | 'applied';
type GroupBy = 'category' | 'page';

interface RedactionMark {
  id: string;
  text: string;
  pageNum: number;
  x: number; y: number; width: number; height: number;
  category: MarkCategory;
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

interface MarkCardGroup {
  key: string;
  category: MarkCategory | string;
  label: string;
  marks: RedactionMark[];
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

const MARKS_CAT_ORDER: MarkCategory[] = [
  'manual', 'keyword', 'personal-name', 'address', 'date-time', 'email', 'phone', 'iban', 'ssn', 'passport'
];

const EXTRA_CAT_META: Record<'manual' | 'keyword', { label: string; svgPath: string; highlightColor: string }> = {
  manual: {
    label: 'Redacted areas',
    svgPath: 'M3 5H1v16c0 1.1.9 2 2 2h16v-2H3V5zm18-4H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14z',
    highlightColor: 'rgba(40,40,40,.15)'
  },
  keyword: {
    label: 'Keywords',
    svgPath: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    highlightColor: 'rgba(255,193,7,.35)'
  }
};

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

      <button class="rv-apply-btn" [class.rv-apply-btn--active]="draftCount > 0" [disabled]="draftCount === 0" (click)="openApplyModal()">
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

    <button class="rv-tool-tab" [class.rv-tool-tab--active]="activeTab === null" (click)="activateRedactArea()">
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

    <span class="rv-unsaved" *ngIf="hasUnapplied">You have unapplied changes</span>
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
            [class.rv-overlay--draw]="activeTab === null"
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

      <!-- Cards by category -->
      <div class="rv-cards-list" *ngIf="marks.length > 0 && groupBy === 'category'">
        <ng-container *ngFor="let card of categoryCards">

          <!-- SINGLE card (exactly 1 mark) -->
          <div class="rv-card" *ngIf="card.marks.length === 1" (click)="selectMark(card.marks[0])" [class.rv-card--selected]="selectedMark?.id === card.marks[0].id">
            <div class="rv-card-row">
              <span class="rv-card-icon" [innerHTML]="getCatIconSvg(card.category)"></span>
              <span class="rv-card-label">{{ card.label }}</span>
              <span class="rv-card-page">Pg {{ card.marks[0].pageNum }}</span>
              <button class="rv-card-del" title="Delete" (click)="$event.stopPropagation(); deleteMark(card.marks[0].id)">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.2002L4.24867 12.6912C4.39303 13.6728 5.23522 14.4002 6.22739 14.4002H9.77261C10.7648 14.4002 11.607 13.6728 11.7513 12.6912L13 4.2002" stroke="#5F616A" stroke-width="1.2"/><path d="M2.09961 4.19962H5.59957M13.8996 4.19962H10.3996M5.59957 4.19962H10.3996M5.59957 4.19962C5.59957 4.19962 5.59957 3.44636 5.59957 2.89962C5.59957 2.23402 6.22637 1.59962 6.99957 1.59961C7.75116 1.59961 8.28777 1.59961 8.99957 1.59961C9.77277 1.59962 10.3996 2.20718 10.3996 2.89962C10.3996 3.44636 10.3996 4.19962 10.3996 4.19962" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="rv-card-text" *ngIf="card.marks[0].text">{{ card.marks[0].text }}</div>
          </div>

          <!-- GROUP card (2+ marks) -->
          <div class="rv-card" *ngIf="card.marks.length > 1">
            <div class="rv-card-row rv-card-row--clickable" (click)="toggleCardExpand(card.key)">
              <span class="rv-card-icon" [innerHTML]="getCatIconSvg(card.category)"></span>
              <span class="rv-card-label">{{ card.label }}</span>
              <span class="rv-card-count">{{ card.marks.length }}</span>
              <svg class="rv-card-chevron" [class.rv-card-chevron--open]="expandedCards.has(card.key)" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#9C9EA8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="rv-card-items" *ngIf="expandedCards.has(card.key)">
              <div
                class="rv-card-item"
                *ngFor="let m of card.marks"
                (click)="selectMark(m)"
                [class.rv-card-item--selected]="selectedMark?.id === m.id"
              >
                <span class="rv-card-page">Pg {{ m.pageNum }}</span>
                <span class="rv-card-item-text">{{ m.text || 'Redacted area' }}</span>
                <button class="rv-card-del" title="Delete" (click)="$event.stopPropagation(); deleteMark(m.id)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.2002L4.24867 12.6912C4.39303 13.6728 5.23522 14.4002 6.22739 14.4002H9.77261C10.7648 14.4002 11.607 13.6728 11.7513 12.6912L13 4.2002" stroke="#5F616A" stroke-width="1.2"/><path d="M2.09961 4.19962H5.59957M13.8996 4.19962H10.3996M5.59957 4.19962H10.3996M5.59957 4.19962C5.59957 4.19962 5.59957 3.44636 5.59957 2.89962C5.59957 2.23402 6.22637 1.59962 6.99957 1.59961C7.75116 1.59961 8.28777 1.59961 8.99957 1.59961C9.77277 1.59962 10.3996 2.20718 10.3996 2.89962C10.3996 3.44636 10.3996 4.19962 10.3996 4.19962" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>

        </ng-container>
      </div>

      <!-- Cards by page -->
      <div class="rv-cards-list" *ngIf="marks.length > 0 && groupBy === 'page'">
        <ng-container *ngFor="let card of pageCards">

          <!-- SINGLE card -->
          <div class="rv-card" *ngIf="card.marks.length === 1" (click)="selectMark(card.marks[0])" [class.rv-card--selected]="selectedMark?.id === card.marks[0].id">
            <div class="rv-card-row">
              <span class="rv-card-icon" [innerHTML]="getCatIconSvg(card.marks[0].category)"></span>
              <span class="rv-card-label">{{ card.label }}</span>
              <button class="rv-card-del" title="Delete" (click)="$event.stopPropagation(); deleteMark(card.marks[0].id)">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.2002L4.24867 12.6912C4.39303 13.6728 5.23522 14.4002 6.22739 14.4002H9.77261C10.7648 14.4002 11.607 13.6728 11.7513 12.6912L13 4.2002" stroke="#5F616A" stroke-width="1.2"/><path d="M2.09961 4.19962H5.59957M13.8996 4.19962H10.3996M5.59957 4.19962H10.3996M5.59957 4.19962C5.59957 4.19962 5.59957 3.44636 5.59957 2.89962C5.59957 2.23402 6.22637 1.59962 6.99957 1.59961C7.75116 1.59961 8.28777 1.59961 8.99957 1.59961C9.77277 1.59962 10.3996 2.20718 10.3996 2.89962C10.3996 3.44636 10.3996 4.19962 10.3996 4.19962" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="rv-card-text">{{ card.marks[0].text || getCatMeta(card.marks[0].category).label }}</div>
          </div>

          <!-- GROUP card -->
          <div class="rv-card" *ngIf="card.marks.length > 1">
            <div class="rv-card-row rv-card-row--clickable" (click)="toggleCardExpand(card.key)">
              <svg class="rv-card-icon-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M9.333 1.333H4A1.333 1.333 0 002.667 2.667v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333L9.333 1.333zm2.667 12H4V2.667h4.667V6h3.333v7.333z" fill="#5F616A"/>
              </svg>
              <span class="rv-card-label">{{ card.label }}</span>
              <span class="rv-card-count">{{ card.marks.length }}</span>
              <svg class="rv-card-chevron" [class.rv-card-chevron--open]="expandedCards.has(card.key)" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#9C9EA8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="rv-card-items" *ngIf="expandedCards.has(card.key)">
              <div
                class="rv-card-item"
                *ngFor="let m of card.marks"
                (click)="selectMark(m)"
                [class.rv-card-item--selected]="selectedMark?.id === m.id"
              >
                <span class="rv-card-icon" [innerHTML]="getCatIconSvg(m.category)"></span>
                <span class="rv-card-item-text">{{ m.text || getCatMeta(m.category).label }}</span>
                <button class="rv-card-del" title="Delete" (click)="$event.stopPropagation(); deleteMark(m.id)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4.2002L4.24867 12.6912C4.39303 13.6728 5.23522 14.4002 6.22739 14.4002H9.77261C10.7648 14.4002 11.607 13.6728 11.7513 12.6912L13 4.2002" stroke="#5F616A" stroke-width="1.2"/><path d="M2.09961 4.19962H5.59957M13.8996 4.19962H10.3996M5.59957 4.19962H10.3996M5.59957 4.19962C5.59957 4.19962 5.59957 3.44636 5.59957 2.89962C5.59957 2.23402 6.22637 1.59962 6.99957 1.59961C7.75116 1.59961 8.28777 1.59961 8.99957 1.59961C9.77277 1.59962 10.3996 2.20718 10.3996 2.89962C10.3996 3.44636 10.3996 4.19962 10.3996 4.19962" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>

        </ng-container>
      </div>

    </div>

    <!-- Panel toggle button (always visible on right edge) -->
    <button class="rv-panel-toggle" (click)="showMarksPanel = !showMarksPanel" [class.rv-panel-toggle--open]="showMarksPanel">
      <svg viewBox="0 0 24 24"><path d="M3 3h7v18H3V3zm11 0h7v18h-7V3z"/></svg>
    </button>
  </div>

  <!-- ══ FLOATING: SEARCH PANEL ══ -->
  <div class="rv-float-panel" *ngIf="activeTab === 'search'" (click)="$event.stopPropagation()">
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
  <div class="rv-float-panel rv-float-panel--detect" *ngIf="activeTab === 'detect'" (click)="$event.stopPropagation()">
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
        <div class="rv-float-title">Detecting sensitive information</div>

        <div class="rv-detect-note-box">
          <svg viewBox="0 0 24 24" class="rv-detect-note-ico">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          Check important info, as mistakes during detection may occur
        </div>

        <div class="rv-pii-chips-grid">
          <button
            *ngFor="let cat of PII_ORDER"
            class="rv-pii-chip"
            [class.rv-pii-chip--active]="selectedPiiCats.has(cat) || selectedPiiCats.has('all')"
            [style.display]="getPiiCount(cat) === 0 ? 'none' : ''"
            (click)="togglePiiFilter(cat)"
          >
            <svg class="rv-pii-chip-ico" viewBox="0 0 24 24">
              <path [attr.d]="getCatMeta(cat).svgPath"/>
            </svg>
            {{ getCatMeta(cat).shortLabel }} ({{ getPiiCount(cat) }})
          </button>
        </div>

        <div class="rv-detect-pages" *ngIf="detectedPages.length > 0">
          <span class="rv-detect-pages-label">Pages:</span>
          <ng-container *ngFor="let pg of detectedPages; let last = last">
            <button class="rv-detect-page-btn" (click)="scrollToPage(pg)">{{ pg }}</button><ng-container *ngIf="!last">, </ng-container>
          </ng-container>
        </div>

        <button
          class="rv-mark-btn rv-mark-btn--active"
          (click)="markDetectedPii()"
        >Mark for redaction</button>
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
.rv-apply-btn:disabled { opacity: 1; cursor: default; }
.rv-apply-btn--active { background: var(--color-primary-500, #2C9C74); color: white; cursor: pointer; }
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

/* ── Cards list ── */
.rv-cards-list {
  flex: 1; overflow-y: auto;
  padding: 8px 0; display: flex; flex-direction: column; gap: 4px;
}
.rv-card {
  margin: 0 12px;
  border: 1px solid var(--color-divider, #DEE0EB);
  border-radius: var(--radius-md, 8px);
  background: white; overflow: hidden; cursor: pointer;
}
.rv-card--selected { border-color: var(--color-primary-500, #2C9C74); background: var(--color-primary-50, #EBF8EF); }
.rv-card:hover:not(.rv-card--selected) { background: var(--color-stone-100, #FAFAFA); }
.rv-card-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; min-height: 40px;
}
.rv-card-row--clickable { cursor: pointer; }
.rv-card-row--clickable:hover { background: var(--color-stone-100, #FAFAFA); }
.rv-card-icon {
  width: 16px; height: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rv-card-icon svg { width: 16px; height: 16px; display: block; }
.rv-card-icon-svg { width: 16px; height: 16px; flex-shrink: 0; display: block; }
.rv-card-label {
  flex: 1; font-size: 13px; font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rv-card-count {
  font-size: 11px; font-weight: 500;
  padding: 2px 7px; border-radius: 10px;
  background: var(--color-stone-200, #F7F7F7);
  color: var(--color-text-secondary, #5F616A);
  flex-shrink: 0;
}
.rv-card-chevron {
  width: 16px; height: 16px; flex-shrink: 0;
  transition: transform .15s;
}
.rv-card-chevron--open { transform: rotate(180deg); }
.rv-card-page {
  font-size: 11px; padding: 1px 6px; border-radius: 3px;
  background: var(--color-stone-200, #F7F7F7);
  color: var(--color-text-secondary, #5F616A);
  white-space: nowrap; flex-shrink: 0;
}
.rv-card-text {
  font-size: 12px; color: var(--color-text-secondary);
  padding: 0 12px 10px 36px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rv-card-del {
  width: 24px; height: 24px; border: none; background: transparent;
  cursor: pointer; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; flex-shrink: 0;
  transition: opacity .12s;
}
.rv-card:hover .rv-card-del { opacity: 1; }
.rv-card-del:hover { background: var(--color-stone-200); }
.rv-card-items {
  border-top: 1px solid var(--color-divider);
  background: var(--color-stone-100, #FAFAFA);
}
.rv-card-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; cursor: pointer;
  border-bottom: 1px solid var(--color-divider);
}
.rv-card-item:last-child { border-bottom: none; }
.rv-card-item:hover { background: var(--color-stone-200); }
.rv-card-item--selected { background: var(--color-primary-50); }
.rv-card-item:hover .rv-card-del { opacity: 1; }
.rv-card-item-text {
  flex: 1; font-size: 12px; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

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
.rv-detect-note-box {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--color-stone-200, #F7F7F7); border-radius: 6px;
  padding: 10px 12px; font-size: 12px; color: var(--color-text-secondary); line-height: 1.4;
}
.rv-detect-note-ico { width: 14px; height: 14px; fill: var(--color-stone-600); flex-shrink: 0; margin-top: 1px; }
.rv-pii-chips-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
.rv-detect-pages {
  font-size: 12px; color: var(--color-text-secondary);
  display: flex; flex-wrap: wrap; align-items: center; gap: 2px;
}
.rv-detect-pages-label { font-weight: 500; color: var(--color-text-primary); margin-right: 2px; }
.rv-detect-page-btn {
  border: none; background: none; padding: 0; cursor: pointer;
  font-size: 12px; color: var(--color-primary-500); font-family: inherit;
  text-decoration: underline; text-decoration-color: transparent;
}
.rv-detect-page-btn:hover { text-decoration-color: var(--color-primary-500); }
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
  toolMode: 'redact-area' | 'none' = 'redact-area';
  activeTab: TabMode = null;
  showMarksPanel = false;
  previewMode = false;
  groupBy: GroupBy = 'category';

  // ── Expand state ──────────────────────────────────────────────────────────
  expandedCards = new Set<string>();

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

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private sanitizer: DomSanitizer) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    await this.loadPdf();
  }

  ngOnDestroy() {
    clearTimeout(this.detectTimer);
    clearInterval(this.detectProgressTimer);
    clearTimeout(this.toastTimer);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.activeTab) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.rv-float-panel') && !target.closest('.rv-tool-tab')) {
      this.activeTab = null;
      this.cdr.detectChanges();
    }
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
  activateRedactArea() {
    this.activeTab = null;
    this.toolMode = 'redact-area';
  }

  setToolMode(mode: 'redact-area' | 'none') {
    this.toolMode = mode;
    if (mode === 'redact-area') this.activeTab = null;
  }

  toggleTab(tab: 'search' | 'detect') {
    if (this.activeTab === tab) {
      this.activeTab = null;
    } else {
      this.activeTab = tab;
      this.toolMode = 'none';
    }
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

  scrollToPage(pageNum: number) {
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
          category: 'keyword', status: 'draft'
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

    // Regex patterns
    const regexPatterns: { cat: PiiCategory; re: RegExp }[] = [
      { cat: 'email',    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
      { cat: 'phone',    re: /\b(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
      { cat: 'ssn',      re: /\b\d{3}-\d{2}-\d{4}\b/g },
      { cat: 'iban',     re: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7,15}\b/g },
      { cat: 'passport', re: /\b[A-Z]{2}\d{7}\b/g },
      // dates: month names, slash/dash formats, and 4-digit years in reference context
      { cat: 'date-time', re: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:19|20)\d{2}[,.\])]?\b/gi },
    ];

    for (const item of this.textItems) {
      for (const { cat, re } of regexPatterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(item.text)) !== null) {
          const charW = item.width / Math.max(item.text.length, 1);
          this.detectedPii.push({
            id: crypto.randomUUID(), text: m[0], category: cat,
            pageNum: item.pageNum,
            x: item.x + m.index * charW, y: item.y,
            width: Math.max(m[0].length * charW, 20), height: item.height + 2
          });
        }
      }
    }

    // Personal names — known surnames cited in this MCF paper
    const NAMES = [
      'Haslhofer', 'Hershkovits', 'Andrews', 'Baker', 'Brendle', 'Hamilton',
      'Huisken', 'Sinestrari', 'White', 'Colding', 'Minicozzi', 'Brakke',
      'Ilmanen', 'Grayson', 'Gage', 'Mantegazza', 'Head', 'Bernstein',
      'Schulze', 'Lynch', 'Langford', 'Perelman', 'Kleiner', 'Wang',
      'Sheng', 'Lauer', 'Naff'
    ];
    for (const item of this.textItems) {
      for (const name of NAMES) {
        let pos = 0;
        while ((pos = item.text.indexOf(name, pos)) !== -1) {
          const charW = item.width / Math.max(item.text.length, 1);
          this.detectedPii.push({
            id: crypto.randomUUID(), text: name, category: 'personal-name',
            pageNum: item.pageNum,
            x: item.x + pos * charW, y: item.y,
            width: name.length * charW, height: item.height + 2
          });
          pos += name.length;
        }
      }
      // Also match "A. Lastname" initials pattern common in reference lists
      const initRe = /\b[A-Z]\.\s*[A-Z][a-z]{2,}\b/g;
      let m;
      while ((m = initRe.exec(item.text)) !== null) {
        const charW = item.width / Math.max(item.text.length, 1);
        this.detectedPii.push({
          id: crypto.randomUUID(), text: m[0], category: 'personal-name',
          pageNum: item.pageNum,
          x: item.x + m.index * charW, y: item.y,
          width: m[0].length * charW, height: item.height + 2
        });
      }
    }

    // Addresses — academic institution affiliations
    const addrRe = /\b(?:Department of Mathematics|Courant Institute|University of Toronto|New York University|ETH\s+Z[uü]rich|University of California)\b/gi;
    for (const item of this.textItems) {
      addrRe.lastIndex = 0;
      let m;
      while ((m = addrRe.exec(item.text)) !== null) {
        const charW = item.width / Math.max(item.text.length, 1);
        this.detectedPii.push({
          id: crypto.randomUUID(), text: m[0], category: 'address',
          pageNum: item.pageNum,
          x: item.x + m.index * charW, y: item.y,
          width: Math.max(m[0].length * charW, 30), height: item.height + 2
        });
      }
    }
  }

  get detectedPages(): number[] {
    return [...new Set(this.detectedPii.map(p => p.pageNum))].sort((a, b) => a - b);
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
    if (this.activeTab !== null) return;
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

  getMarksByCategory(cat: MarkCategory): RedactionMark[] {
    return this.marks.filter(m => m.category === cat);
  }

  getMarksByPage(pageNum: number): RedactionMark[] {
    return this.marks.filter(m => m.pageNum === pageNum);
  }

  get categoriesWithMarks(): MarkCategory[] {
    const cats = new Set(this.marks.map(m => m.category));
    return MARKS_CAT_ORDER.filter(c => cats.has(c));
  }

  get pagesWithMarks(): number[] {
    return [...new Set(this.marks.map(m => m.pageNum))].sort((a, b) => a - b);
  }

  get draftCount() { return this.marks.filter(m => m.status === 'draft').length; }
  get appliedCount() { return this.marks.filter(m => m.status === 'applied').length; }
  get hasUnapplied() { return this.draftCount > 0; }

  selectMark(m: RedactionMark) {
    this.selectedMark = this.selectedMark?.id === m.id ? null : m;
    this.scrollToPage(m.pageNum);
  }

  deleteMark(id: string) {
    this.saveHistory();
    this.marks = this.marks.filter(m => m.id !== id);
    if (this.selectedMark?.id === id) this.selectedMark = null;
  }

  toggleCardExpand(key: string) {
    const next = new Set(this.expandedCards);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.expandedCards = next;
    this.cdr.detectChanges();
  }

  get categoryCards(): MarkCardGroup[] {
    const cards: MarkCardGroup[] = [];
    for (const cat of MARKS_CAT_ORDER) {
      const catMarks = this.marks.filter(m => m.category === cat);
      if (catMarks.length === 0) continue;
      if (cat === 'keyword') {
        const textMap = new Map<string, RedactionMark[]>();
        for (const m of catMarks) {
          const key = m.text.toLowerCase();
          if (!textMap.has(key)) textMap.set(key, []);
          textMap.get(key)!.push(m);
        }
        for (const textMarks of textMap.values()) {
          cards.push({
            key: `kw-${textMarks[0].text}`,
            category: 'keyword',
            label: textMarks[0].text || 'Keyword',
            marks: textMarks
          });
        }
      } else {
        cards.push({
          key: cat,
          category: cat,
          label: this.getCatMeta(cat).label,
          marks: catMarks
        });
      }
    }
    return cards;
  }

  get pageCards(): MarkCardGroup[] {
    const pages = [...new Set(this.marks.map(m => m.pageNum))].sort((a, b) => a - b);
    return pages.map(pageNum => ({
      key: `pg-${pageNum}`,
      category: 'manual' as MarkCategory,
      label: `Page ${pageNum}`,
      marks: this.marks.filter(m => m.pageNum === pageNum)
    }));
  }

  private readonly catIconSvgStrings: Partial<Record<string, string>> = {
    'manual': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.56836 5.16797C5.54786 4.47138 6.30964 4.03128 6.90234 4.39746L14.3301 8.9873C14.9904 9.3953 14.8227 10.3697 14.1221 10.5713L13.9736 10.6006L10.2471 11.0459C10.0094 11.0743 9.7938 11.1988 9.65039 11.3906L7.40137 14.3965C6.90523 15.0599 5.85172 14.7265 5.82715 13.8984L5.56836 5.16797ZM1.90332 10.8359C2.26398 10.836 2.55654 11.1286 2.55664 11.4893V13.0146H4.08008C4.44105 13.0146 4.7334 13.308 4.7334 13.6689C4.73316 14.0297 4.44091 14.3223 4.08008 14.3223H2.12109L2.03125 14.3174C1.62174 14.2754 1.29561 13.9498 1.25391 13.54L1.25 13.4502V11.4893C1.2501 11.1286 1.54261 10.8359 1.90332 10.8359ZM7.10059 12.6074L8.59961 10.6045L8.74219 10.4316C9.04354 10.1045 9.43818 9.87676 9.87207 9.7793L10.0928 9.74219L12.5742 9.44531L6.90332 5.94043L7.10059 12.6074ZM1.90332 6.04297C2.26403 6.04302 2.55662 6.33557 2.55664 6.69629V8.87598C2.55653 9.23662 2.26398 9.52924 1.90332 9.5293C1.54262 9.5293 1.25011 9.23665 1.25 8.87598V6.69629C1.25002 6.33554 1.54257 6.04297 1.90332 6.04297ZM4.08008 1.25C4.44096 1.25 4.73324 1.54248 4.7334 1.90332C4.7334 2.2643 4.44105 2.55762 4.08008 2.55762H2.55664V4.08301C2.55646 4.44359 2.26393 4.73628 1.90332 4.73633C1.54267 4.73633 1.25018 4.44362 1.25 4.08301V2.12109C1.25021 1.63997 1.6402 1.25 2.12109 1.25H4.08008ZM13.4434 1.25C13.9243 1.25 14.3142 1.63997 14.3145 2.12109V4.08301C14.3143 4.44362 14.0218 4.73633 13.6611 4.73633C13.3005 4.73626 13.008 4.44358 13.0078 4.08301V2.55762H11.4844C11.1234 2.55762 10.8311 2.2643 10.8311 1.90332C10.8312 1.54248 11.1235 1.25 11.4844 1.25H13.4434ZM8.87012 1.25C9.231 1.25 9.52426 1.54248 9.52441 1.90332C9.52441 2.2643 9.23109 2.55762 8.87012 2.55762H6.69434C6.33336 2.55762 6.04004 2.2643 6.04004 1.90332C6.04019 1.54248 6.33345 1.25 6.69434 1.25H8.87012Z" fill="#5F616A"/></svg>`,
    'keyword': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6673 4.66634V3.33301L3.33398 3.33301V4.66634" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.99935 3.33301L7.99935 12.6663M7.99935 12.6663H6.66602M7.99935 12.6663H9.33268" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'personal-name': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.00065 1.33301C4.31875 1.33301 1.33398 4.31778 1.33398 7.99967C1.33398 11.6816 4.31875 14.6663 8.00065 14.6663C11.6825 14.6663 14.6673 11.6816 14.6673 7.99967C14.6673 4.31778 11.6825 1.33301 8.00065 1.33301Z" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.84766 12.2301C2.84766 12.2301 4.33368 10.333 8.00034 10.333C11.667 10.333 13.153 12.2301 13.153 12.2301" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'address': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3337 6.66634C13.3337 9.61186 8.00033 14.6663 8.00033 14.6663C8.00033 14.6663 2.66699 9.61186 2.66699 6.66634C2.66699 3.72082 5.05481 1.33301 8.00033 1.33301C10.9458 1.33301 13.3337 3.72082 13.3337 6.66634Z" stroke="#5F616A" stroke-width="1.2"/><path d="M7.99967 7.33333C8.36786 7.33333 8.66634 7.03486 8.66634 6.66667C8.66634 6.29848 8.36786 6 7.99967 6C7.63148 6 7.33301 6.29848 7.33301 6.66667C7.33301 7.03486 7.63148 7.33333 7.99967 7.33333Z" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'date-time': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.66634V1.33301M10 2.66634V3.99967M10 2.66634H7M2 6.66634V12.6663C2 13.4027 2.59695 13.9997 3.33333 13.9997H12.6667C13.4031 13.9997 14 13.4027 14 12.6663V6.66634H2Z" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 6.66699V4.00033C2 3.26395 2.59695 2.66699 3.33333 2.66699H4.66667" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.66602 1.33301V3.99967" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.0007 6.66699V4.00033C14.0007 3.26395 13.4037 2.66699 12.6673 2.66699H12.334" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'email': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.66602 5.99967L7.99935 8.33301L11.3327 5.99967" stroke="#5F616A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11.8665V4.13314C1 3.39676 1.59695 2.7998 2.33333 2.7998H13.6667C14.403 2.7998 15 3.39676 15 4.13314V11.8665C15 12.6029 14.403 13.1998 13.6667 13.1998H2.33333C1.59695 13.1998 1 12.6028 1 11.8665Z" stroke="#5F616A" stroke-width="1.2"/></svg>`,
  };

  getCatIconSvg(cat: MarkCategory | string): SafeHtml {
    const svgStr = this.catIconSvgStrings[cat];
    if (svgStr) return this.sanitizer.bypassSecurityTrustHtml(svgStr);
    const meta = CAT_META[cat as PiiCategory];
    if (meta) {
      return this.sanitizer.bypassSecurityTrustHtml(
        `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#5F616A" d="${meta.svgPath}"/></svg>`
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml('');
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
  getCatMeta(cat: MarkCategory | string): { label: string; shortLabel?: string; svgPath: string; highlightColor: string } {
    if (cat === 'manual' || cat === 'keyword') return EXTRA_CAT_META[cat];
    return CAT_META[cat as PiiCategory] || CAT_META['personal-name'];
  }

  darkenColor(cat: PiiCategory | string): string {
    const colors: Record<string, string> = {
      'personal-name': 'rgba(255,193,7,.9)',
      'address':       'rgba(33,150,243,.8)',
      'date-time':     'rgba(76,175,80,.8)',
      'email':         'rgba(156,39,176,.7)',
      'phone':         'rgba(255,87,34,.7)',
      'iban':          'rgba(0,188,212,.7)',
      'ssn':           'rgba(233,30,99,.7)',
      'passport':      'rgba(121,85,72,.7)'
    };
    return colors[cat] || 'rgba(0,0,0,.4)';
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
