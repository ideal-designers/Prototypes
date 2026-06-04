import {
  Component, OnInit, OnDestroy, ViewChildren, QueryList,
  ElementRef, ChangeDetectorRef, NgZone, HostListener, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { DS_COMPONENTS, ToastService, RedactionMarkType, SegmentItem, FloatingPanelItem, RedactionMarkPage, FilterBtnColor } from '../../shared/ds';

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

interface CategorySection {
  key: string;
  category: MarkCategory;
  label: string;
  totalCount: number;
  groups: MarkCardGroup[];
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

const PII_ICONS: Record<PiiCategory, string> = {
  'personal-name': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7.99992 1.33301C4.31802 1.33301 1.33325 4.31778 1.33325 7.99967C1.33325 11.6816 4.31802 14.6663 7.99992 14.6663C11.6818 14.6663 14.6666 11.6816 14.6666 7.99967C14.6666 4.31778 11.6818 1.33301 7.99992 1.33301Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.84766 12.2301C2.84766 12.2301 4.33368 10.333 8.00034 10.333C11.667 10.333 13.153 12.2301 13.153 12.2301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'address': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3334 6.66634C13.3334 9.61186 8.00008 14.6663 8.00008 14.6663C8.00008 14.6663 2.66675 9.61186 2.66675 6.66634C2.66675 3.72082 5.05456 1.33301 8.00008 1.33301C10.9456 1.33301 13.3334 3.72082 13.3334 6.66634Z" stroke="currentColor" stroke-width="1.2"/><path d="M7.99992 7.33333C8.36811 7.33333 8.66659 7.03486 8.66659 6.66667C8.66659 6.29848 8.36811 6 7.99992 6C7.63173 6 7.33325 6.29848 7.33325 6.66667C7.33325 7.03486 7.63173 7.33333 7.99992 7.33333Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'date-time': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 2.66634V1.33301M10 2.66634V3.99967M10 2.66634H7M2 6.66634V12.6663C2 13.4027 2.59695 13.9997 3.33333 13.9997H12.6667C13.4031 13.9997 14 13.4027 14 12.6663V6.66634H2Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 6.66699V4.00033C2 3.26395 2.59695 2.66699 3.33333 2.66699H4.66667" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.66675 1.33301V3.99967" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.9999 6.66699V4.00033C13.9999 3.26395 13.403 2.66699 12.6666 2.66699H12.3333" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'email': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.66675 5.99967L8.00008 8.33301L11.3334 5.99967" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11.8665V4.13314C1 3.39676 1.59695 2.7998 2.33333 2.7998H13.6667C14.403 2.7998 15 3.39676 15 4.13314V11.8665C15 12.6029 14.403 13.1998 13.6667 13.1998H2.33333C1.59695 13.1998 1 12.6028 1 11.8665Z" stroke="currentColor" stroke-width="1.2"/></svg>`,
  'phone': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.0787 9.80101L9.33323 10.333C7.47876 9.40221 6.33323 8.33301 5.66657 6.66634L6.17987 3.91294L5.20958 1.33301L2.70896 1.33301C1.95726 1.33301 1.36533 1.95419 1.47759 2.69746C1.75786 4.55301 2.58425 7.91736 4.9999 10.333C7.5367 12.8698 11.1904 13.9706 13.2012 14.4082C13.9777 14.5771 14.6666 13.9713 14.6666 13.1767L14.6666 10.7872L12.0787 9.80101Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'iban': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.33301L8 2.66634L14 6.33301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 13.333H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66675 6L9.33341 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11.3333L4 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66675 11.3333L6.66675 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.33325 11.3333L9.33325 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11.3333L12 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'ssn': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14.6666 5.99967V4.66634C14.6666 3.92996 14.0696 3.33301 13.3333 3.33301H2.66658C1.9302 3.33301 1.33325 3.92996 1.33325 4.66634V11.333C1.33325 12.0694 1.93021 12.6663 2.66659 12.6663H7.99992M14.6666 5.99967H3.99992M14.6666 5.99967V7.33301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.6615 9.41636L14.3651 9.84902C14.5425 9.89406 14.6675 10.0552 14.6621 10.2381C14.5476 14.077 12.3333 14.6663 12.3333 14.6663C12.3333 14.6663 10.1191 14.077 10.0046 10.2381C9.99914 10.0552 10.1242 9.89406 10.3015 9.84902L12.0051 9.41636C12.2205 9.36166 12.4462 9.36166 12.6615 9.41636Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'passport': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="7.5" y="3.7002" width="3" height="1.2" rx="0.6" fill="currentColor"/><rect x="7.5" y="6.09961" width="4" height="1.2" rx="0.6" fill="currentColor"/><path d="M13 1C13.5523 1 14 1.44772 14 2V6.89941C14 7.23068 13.7316 7.49974 13.4004 7.5C13.0691 7.5 12.8001 7.23159 12.7998 6.90039V2.2002H6.2002V11.4004C6.19993 11.7314 5.93162 11.9997 5.60059 12C5.26932 12 5.00026 11.7316 5 11.4004V2.2002C4.00589 2.2002 3.2002 3.00589 3.2002 4V12C3.2002 12.9941 4.00589 13.7998 5 13.7998H8.39941C8.73084 13.7998 9 14.069 9 14.4004C8.99974 14.7314 8.73143 14.9997 8.40039 15H5C3.39489 15 2.08421 13.7394 2.00391 12.1543L2 12V4C2 2.34315 3.34315 1 5 1H13Z" fill="currentColor"/><path d="M12.6615 9.41636L14.3651 9.84902C14.5425 9.89406 14.6675 10.0552 14.6621 10.2381C14.5476 14.077 12.3333 14.6663 12.3333 14.6663C12.3333 14.6663 10.1191 14.077 10.0046 10.2381C9.99914 10.0552 10.1242 9.89406 10.3015 9.84902L12.0051 9.41636C12.2205 9.36166 12.4462 9.36166 12.6615 9.41636Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

const PII_FILTER_COLORS: Record<PiiCategory, FilterBtnColor> = {
  'personal-name': 'default',
  'address':       'default',
  'date-time':     'default',
  'email':         'default',
  'phone':         'default',
  'iban':          'default',
  'ssn':           'default',
  'passport':      'default'
};

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
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="rv-root" (mousemove)="onMouseMove($event)" (mouseup)="onMouseUp($event)">

  <!-- ══ HEADER ══ -->
  <header class="rv-header">
    <div class="rv-header-left">
      <fvdr-ghost-btn
        size="small"
        [iconPath]="ICON_CLOSE_VIEWER"
        (clicked)="onBack()">
      </fvdr-ghost-btn>
      <svg class="rv-file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#0F81C0"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M19 7H5V8.42857H19V7ZM19 9.85714H5V11.2857H19V9.85714ZM5 12.7143H19V14.1429H5V12.7143ZM14.3333 15.5714H5V17H14.3333V15.5714Z" fill="white"/>
      </svg>
      <span class="rv-filename">2.2.1 Protocol / Ready for review. pdf</span>

      <div class="rv-mode-chip">
        <!-- Redaction icon 14×14 -->
        <svg class="rv-mode-chip-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M12.9062 12.25C13.2687 12.25 13.5624 12.5439 13.5625 12.9063C13.5625 13.2687 13.2687 13.5625 12.9062 13.5625H1.09375C0.731313 13.5625 0.4375 13.2687 0.4375 12.9063C0.437556 12.5439 0.731348 12.25 1.09375 12.25H12.9062ZM9.3623 0.673842C9.73551 0.398027 10.246 0.417058 10.5967 0.708999L10.6641 0.770522L11.915 2.02248L11.9775 2.08986C12.2689 2.44048 12.2873 2.95027 12.0117 3.32326L7.51758 9.40431C7.36329 9.61256 7.1336 9.7533 6.87793 9.79591L4.08105 10.2627L3.96094 10.2744C3.78315 10.2822 3.60777 10.2412 3.45215 10.1592L2.84766 10.7647C2.6525 10.9595 2.3358 10.9594 2.14062 10.7647L1.92188 10.5459C1.72705 10.3507 1.72707 10.0341 1.92188 9.83888L2.52637 9.23537C2.44408 9.07946 2.40329 8.90277 2.41113 8.72462L2.42383 8.60451L2.89062 5.80763C2.93331 5.55188 3.07384 5.32223 3.28223 5.16798L9.3623 0.673842ZM4.33594 6.25197L3.94531 8.59767L4.08789 8.74025L6.43164 8.34962L6.4668 8.30177L4.38281 6.21779L4.33594 6.25197ZM5.44824 5.43068L7.25391 7.23732L10.5498 2.77736L9.9082 2.13576L5.44824 5.43068Z" fill="currentColor"/>
        </svg>
        <span class="rv-mode-chip-text">Redacting</span>
        <!-- Arrow down 14×14 -->
        <svg class="rv-mode-chip-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7.01271 9.3304C6.93634 9.33076 6.86065 9.31586 6.79011 9.28658C6.71957 9.2573 6.65558 9.21422 6.60191 9.15988L2.7264 5.28437C2.64911 5.17128 2.61422 5.03454 2.62791 4.89824C2.6416 4.76195 2.70297 4.63487 2.80121 4.53941C2.89945 4.44395 3.02824 4.38625 3.16487 4.37648C3.3015 4.36671 3.43719 4.4055 3.54801 4.48602L7.01271 7.92747L10.4774 4.48602C10.5867 4.41518 10.7166 4.38307 10.8462 4.39484C10.9759 4.40662 11.0979 4.46158 11.1926 4.55094C11.2873 4.64029 11.3493 4.75885 11.3686 4.88763C11.3879 5.0164 11.3634 5.14792 11.299 5.26112L7.42352 9.13663C7.37185 9.19519 7.30876 9.24259 7.23812 9.27591C7.16748 9.30923 7.09077 9.32777 7.01271 9.3304Z" fill="currentColor"/>
        </svg>
      </div>

      <div class="rv-marks-chip rv-marks-chip--applied" *ngIf="appliedCount > 0">
        <span class="rv-marks-dot rv-marks-dot--applied"></span>
        <span class="rv-marks-chip-label">Applied</span>
        <span class="rv-marks-chip-count">{{ appliedCount }}</span>
      </div>
      <div class="rv-marks-chip rv-marks-chip--draft" *ngIf="draftCount > 0">
        <span class="rv-marks-dot rv-marks-dot--draft"></span>
        <span class="rv-marks-chip-label">Draft</span>
        <span class="rv-marks-chip-count">{{ draftCount }}</span>
      </div>
    </div>

    <div class="rv-header-right">
      <fvdr-toggle [(checked)]="previewMode" label="Preview"></fvdr-toggle>

      <fvdr-btn label="Apply" variant="primary" size="m" [disabled]="draftCount === 0" (clicked)="openApplyModal()"></fvdr-btn>
    </div>
  </header>

  <!-- ══ TOOLBAR ══ -->
  <div class="rv-toolbar">
    <fvdr-ghost-btn
      size="small"
      [iconPath]="ICON_UNDO"
      [disabled]="!canUndo"
      (clicked)="undo()">
    </fvdr-ghost-btn>
    <fvdr-ghost-btn
      size="small"
      [iconPath]="ICON_REDO"
      [disabled]="!canRedo"
      (clicked)="redo()">
    </fvdr-ghost-btn>

    <div class="rv-tool-separator"></div>

    <!-- Redact area -->
    <fvdr-ghost-btn
      class="rv-tool-tab"
      label="Redact area"
      size="small"
      [selected]="activeTab === null"
      [iconPath]="ICON_REDACT_AREA"
      (clicked)="activateRedactArea()">
    </fvdr-ghost-btn>

    <!-- Search & redact -->
    <div class="rv-tab-wrap">
      <fvdr-ghost-btn
        class="rv-tool-tab"
        label="Search & redact"
        size="small"
        [arrow]="false"
        [selected]="activeTab === 'search'"
        [iconPath]="ICON_SEARCH"
        (clicked)="toggleTab('search')">
      </fvdr-ghost-btn>

      <div class="rv-float-panel" *ngIf="activeTab === 'search'" (click)="$event.stopPropagation()">
        <div class="rv-float-panel-inner rv-search-panel">
          <div class="rv-float-title">Search &amp; redact</div>

          <fvdr-search
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search"
            style="display:block;">
          </fvdr-search>

          <div class="rv-search-meta" *ngIf="searchQuery && searchHighlights.length > 0">
            <span>{{ currentSearchIdx + 1 }} of {{ searchHighlights.length }} results · {{ searchPagesCount }} {{ searchPagesCount === 1 ? 'page' : 'pages' }}</span>
            <div class="rv-search-nav">
              <button class="rv-search-nav-btn" (click)="prevMatch()" [disabled]="searchHighlights.length === 0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7.98547 4.99977C8.07276 4.99936 8.15925 5.01638 8.23987 5.04985C8.3205 5.08331 8.39362 5.13255 8.45496 5.19465L12.8841 9.62381C12.9725 9.75305 13.0123 9.90933 12.9967 10.0651C12.981 10.2209 12.9109 10.3661 12.7986 10.4752C12.6863 10.5843 12.5392 10.6502 12.383 10.6614C12.2269 10.6726 12.0718 10.6282 11.9451 10.5362L7.98547 6.60312L4.02581 10.5362C3.90094 10.6172 3.75251 10.6539 3.60431 10.6404C3.45611 10.627 3.31671 10.5641 3.20847 10.462C3.10022 10.3599 3.0294 10.2244 3.00734 10.0772C2.98528 9.93006 3.01327 9.77974 3.08682 9.65038L7.51598 5.22123C7.57503 5.15429 7.64714 5.10013 7.72787 5.06205C7.8086 5.02396 7.89626 5.00277 7.98547 4.99977Z" fill="currentColor"/>
                </svg>
              </button>
              <button class="rv-search-nav-btn" (click)="nextMatch()" [disabled]="searchHighlights.length === 0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8.01453 10.6633C7.92724 10.6637 7.84075 10.6467 7.76013 10.6132C7.67951 10.5798 7.60638 10.5305 7.54504 10.4684L3.11589 6.03928C3.02755 5.91004 2.98768 5.75376 3.00333 5.59799C3.01897 5.44223 3.08911 5.29699 3.20138 5.1879C3.31366 5.0788 3.46085 5.01286 3.61699 5.00169C3.77314 4.99053 3.92822 5.03486 4.05487 5.12687L8.01453 9.05996L11.9742 5.12687C12.0991 5.04592 12.2475 5.00923 12.3957 5.02268C12.5439 5.03613 12.6833 5.09895 12.7915 5.20107C12.8998 5.30319 12.9706 5.43869 12.9927 5.58586C13.0147 5.73303 12.9867 5.88334 12.9132 6.01271L8.48402 10.4419C8.42497 10.5088 8.35286 10.563 8.27213 10.601C8.1914 10.6391 8.10374 10.6603 8.01453 10.6633Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="rv-search-meta rv-search-meta--empty" *ngIf="searchQuery && searchHighlights.length === 0 && textReady">
            <span>No results found</span>
          </div>

          <fvdr-btn
            label="Mark for redaction"
            variant="primary"
            size="s"
            [disabled]="searchHighlights.length === 0"
            (clicked)="markSearchResults()">
          </fvdr-btn>
        </div>
      </div>
    </div>

    <!-- Detect sensitive information -->
    <div class="rv-tab-wrap">
      <fvdr-ghost-btn
        class="rv-tool-tab"
        label="Detect sensitive information"
        size="small"
        [arrow]="false"
        [selected]="activeTab === 'detect'"
        [iconPath]="ICON_PII"
        (clicked)="toggleTab('detect')">
      </fvdr-ghost-btn>

      <div class="rv-float-panel rv-float-panel--detect" *ngIf="activeTab === 'detect'" (click)="$event.stopPropagation()">
        <div class="rv-float-panel-inner">

          <!-- Detecting state -->
          <div class="rv-detect-loading" *ngIf="detectState === 'detecting'">
            <svg class="rv-detect-illu" width="176" height="120" viewBox="0 0 176 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#dp-clip)">
                <ellipse cx="88" cy="112" rx="72" ry="8" fill="#F7F7F7"/>
                <g filter="url(#dp-f0)">
                  <path d="M52 26C52 24.8954 52.8954 24 54 24H122C123.105 24 124 24.8954 124 26V110C124 111.105 123.105 112 122 112H54C52.8954 112 52 111.105 52 110V26Z" fill="white"/>
                </g>
                <rect x="64" y="36" width="16" height="2" rx="1" fill="#3B85CC"/>
                <rect opacity="0.4" x="64" y="48" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect opacity="0.4" x="64" y="70" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect opacity="0.4" x="64" y="54" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect x="64" y="76" width="48" height="2" rx="1" fill="#2C9C74"/>
                <rect opacity="0.4" x="64" y="98" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect opacity="0.4" x="64" y="42" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect x="64" y="64" width="48" height="2" rx="1" fill="#DF6D00"/>
                <rect opacity="0.4" x="64" y="86" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <rect opacity="0.4" x="64" y="92" width="48" height="2" rx="1" fill="#BBBDC8"/>
                <g opacity="0.24" filter="url(#dp-f1)">
                  <circle cx="118" cy="70" r="21" fill="#2C9C74"/>
                </g>
                <g filter="url(#dp-f2)">
                  <rect x="131" y="88.1396" width="8" height="33.1013" rx="4" transform="rotate(-44.3129 131 88.1396)" fill="#2C9C74"/>
                </g>
                <g filter="url(#dp-f3)">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M118 96C132.359 96 144 84.3594 144 70C144 55.6406 132.359 44 118 44C103.641 44 92 55.6406 92 70C92 84.3594 103.641 96 118 96ZM118 91C129.598 91 139 81.598 139 70C139 58.402 129.598 49 118 49C106.402 49 97 58.402 97 70C97 81.598 106.402 91 118 91Z" fill="#2C9C74"/>
                </g>
              </g>
              <defs>
                <filter id="dp-f0" x="48" y="21" width="80" height="96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="1"/><feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0.436 0 0 0 0 0.392 0 0 0 0 0.392 0 0 0 0.2 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
                <filter id="dp-f1" x="95" y="47" width="44" height="44" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dx="-2" dy="-2"/><feGaussianBlur stdDeviation="4"/>
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                  <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                </filter>
                <filter id="dp-f2" x="131.656" y="84.207" width="27.535" height="27.961" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
                <filter id="dp-f3" x="91" y="43" width="56" height="56" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dx="1" dy="1"/><feGaussianBlur stdDeviation="1"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
                <clipPath id="dp-clip"><rect width="176" height="120" fill="white"/></clipPath>
              </defs>
            </svg>
            <div class="rv-detect-text">
              <div class="rv-detect-title">Detecting sensitive information</div>
              <div class="rv-detect-sub">This can take a few moments…</div>
            </div>
            <fvdr-progress [value]="detectProgress" style="display:block; width:100%;"></fvdr-progress>
            <fvdr-btn label="Cancel" variant="secondary" size="s" (clicked)="cancelDetect()"></fvdr-btn>
          </div>

          <!-- Results state -->
          <div class="rv-detect-results" *ngIf="detectState === 'results'">
            <div class="rv-float-title">Sensitive information</div>

            <div class="rv-pii-filter-grid">
              <fvdr-filter-btn
                label="All"
                size="S"
                color="default"
                [selected]="allPiiCatsSelected"
                [showIcon]="false"
                [showCounter]="true"
                [counter]="getTotalPiiCount().toString()"
                (clicked)="selectAllPii()">
              </fvdr-filter-btn>
              <fvdr-filter-btn
                *ngFor="let cat of PII_ORDER"
                [label]="getCatMeta(cat).shortLabel || getCatMeta(cat).label"
                size="S"
                color="default"
                [selected]="selectedPiiCats.has(cat)"
                [showIcon]="true"
                [iconHtml]="getPiiIconHtml(cat)"
                [showCounter]="true"
                [counter]="getPiiCount(cat).toString()"
                [style.display]="getPiiCount(cat) === 0 ? 'none' : 'inline-flex'"
                (clicked)="togglePiiFilter(cat)">
              </fvdr-filter-btn>
            </div>

            <fvdr-btn label="Mark for redaction" variant="primary" size="s" (clicked)="markDetectedPii()"></fvdr-btn>

            <div class="rv-detect-info-bar">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <circle cx="7.99961" cy="9.99961" r="6.4" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="8.00039" cy="7.3002" r="0.6" fill="currentColor"/>
                <path d="M8 9.7002V12.7002" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              AI-generated – check for accuracy
            </div>
          </div>

          <!-- No results -->
          <div class="rv-detect-noresults" *ngIf="detectState === 'no-results'">
            <div class="rv-float-title">No sensitive information found</div>
            <p class="rv-detect-sub">We couldn't detect any sensitive information in this document.</p>
          </div>

        </div>
      </div>
    </div>

    <span class="rv-unsaved" *ngIf="hasUnapplied">You have unapplied changes</span>
  </div>

  <!-- ══ MAIN BODY ══ -->
  <div class="rv-body">

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
              [class.rv-mark--applied]="m.status === 'applied' && !previewMode"
              [class.rv-mark--draft]="m.status === 'draft' && !previewMode"
              [class.rv-mark--preview]="previewMode"
              [class.rv-mark--selected]="selectedMark?.id === m.id"
              [class.rv-mark--hover]="hoveredMarkIds.has(m.id) && selectedMark?.id !== m.id"
              [class.rv-mark--dragging]="dragState?.markId === m.id"
              [style.left.px]="m.x"
              [style.top.px]="m.y"
              [style.width.px]="m.width"
              [style.height.px]="m.height"
              (mousedown)="onMarkMouseDown($event, m)"
              (mouseenter)="onMarkMouseEnter(m)"
              (mouseleave)="onMarkMouseLeave()"
              (click)="onMarkClick(m)"
            >
              <button *ngIf="!previewMode" class="rv-mark-del"
                (mousedown)="$event.stopPropagation()"
                (click)="$event.stopPropagation(); deleteMark(m.id)">
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
        <div class="rv-marks-header-actions">
          <button *ngIf="marks.length > 0" class="rv-icon-btn" (click)="showDeleteAllModal = true" title="Delete all marks">
            <svg width="16" height="16" viewBox="0 0 16 16" style="fill:none">
              <path d="M3 4.19922L4.24867 12.6902C4.39303 13.6718 5.23522 14.3992 6.22739 14.3992H9.77261C10.7648 14.3992 11.607 13.6718 11.7513 12.6902L13 4.19922" stroke="currentColor" stroke-width="1.2"/>
              <path d="M2.1001 4.19962H5.60006M13.9001 4.19962H10.4001M5.60006 4.19962H10.4001M5.60006 4.19962C5.60006 4.19962 5.60006 3.44636 5.60006 2.89962C5.60006 2.23402 6.22686 1.59962 7.00006 1.59961C7.75165 1.59961 8.28826 1.59961 9.00006 1.59961C9.77326 1.59962 10.4001 2.20718 10.4001 2.89962C10.4001 3.44636 10.4001 4.19962 10.4001 4.19962" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="rv-icon-btn" (click)="showMarksPanel = false">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <!-- Tabs — DS table segment Mobile 32px -->
      <div class="rv-marks-tabs">
        <fvdr-segment
          variant="table"
          size="mobile"
          [items]="groupByItems"
          [activeId]="groupBy"
          (activeIdChange)="groupBy = $any($event)">
        </fvdr-segment>
      </div>

      <!-- Status filters (only when both statuses exist) -->
      <div class="rv-marks-status-filter" *ngIf="appliedCount > 0">
        <fvdr-filter-btn
          label="All"
          size="S"
          color="default"
          [showIcon]="false"
          [showCounter]="false"
          [selected]="markStatusFilter === 'all'"
          (clicked)="markStatusFilter = 'all'">
        </fvdr-filter-btn>
        <fvdr-filter-btn
          label="Applied"
          size="S"
          color="default"
          [showIcon]="false"
          [showStatus]="true"
          [showCounter]="true"
          [counter]="appliedCount.toString()"
          [selected]="markStatusFilter === 'applied'"
          (clicked)="markStatusFilter = 'applied'">
        </fvdr-filter-btn>
        <fvdr-filter-btn
          label="Draft"
          size="S"
          color="orange"
          [showIcon]="false"
          [showStatus]="true"
          [showCounter]="true"
          [counter]="draftCount.toString()"
          [selected]="markStatusFilter === 'draft'"
          (clicked)="markStatusFilter = 'draft'">
        </fvdr-filter-btn>
      </div>

      <!-- Empty state -->
      <div class="rv-marks-empty" *ngIf="marks.length === 0">
        <svg width="176" height="120" viewBox="0 0 176 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="rv-marks-empty-illu">
          <defs>
            <filter id="rv-es-f0" x="48" y="21" width="80" height="96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="1"/>
              <feGaussianBlur stdDeviation="2"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.436 0 0 0 0 0.392 0 0 0 0 0.392 0 0 0 0.2 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
            </filter>
            <filter id="rv-es-f1" x="105" y="76" width="40" height="42" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="2" dy="2"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="-2" dy="-4"/>
              <feGaussianBlur stdDeviation="4"/>
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
              <feBlend mode="normal" in2="shape" result="effect2_innerShadow"/>
            </filter>
            <clipPath id="rv-es-cp">
              <rect width="18" height="18" fill="white" transform="translate(116 90)"/>
            </clipPath>
          </defs>
          <!-- Shadow -->
          <ellipse cx="88" cy="112" rx="72" ry="8" fill="#F7F7F7"/>
          <!-- Document card -->
          <g filter="url(#rv-es-f0)">
            <path d="M52 26C52 24.8954 52.8954 24 54 24H122C123.105 24 124 24.8954 124 26V110C124 111.105 123.105 112 122 112H54C52.8954 112 52 111.105 52 110V26Z" fill="white"/>
          </g>
          <!-- Pie chart placeholder -->
          <path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd" d="M86.6087 68.3643L76.0877 70.3598L76.2827 59.9956C76.0382 59.9798 75.7916 59.9714 75.5431 59.9705C69.2375 59.9497 64.1096 64.8401 64.0896 70.8934C64.0697 76.9468 69.1651 81.8709 75.4707 81.8917C81.7763 81.9125 86.9042 77.0222 86.9242 70.9688C86.9271 70.0717 86.8177 69.1995 86.6087 68.3643Z" fill="#BBBDC8"/>
          <path opacity="0.4" d="M89.6373 66.1196C89.1494 63.5468 87.7377 61.2316 85.6428 59.5687C83.5479 57.9057 80.8996 56.9978 78.1489 56.9997L77.9356 68.3391L89.6373 66.1196Z" fill="#2C9C74"/>
          <!-- Text lines -->
          <rect opacity="0.4" x="64" y="36" width="16" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="96" y="64" width="9" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="64" y="48" width="48" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="96" y="76" width="16" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="64" y="42" width="48" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="96" y="70" width="16" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="64" y="92" width="53" height="2" rx="1" fill="#BBBDC8"/>
          <rect opacity="0.4" x="64" y="98" width="48" height="2" rx="1" fill="#BBBDC8"/>
          <!-- Redaction highlight -->
          <rect x="62" y="55" width="30" height="30" rx="1" fill="#2C9C74" fill-opacity="0.24"/>
          <rect x="62" y="55" width="30" height="30" rx="1" stroke="#2C9C74" stroke-width="1.5"/>
          <!-- Green circle with cursor icon -->
          <g filter="url(#rv-es-f1)">
            <circle cx="125" cy="98" r="18" fill="#2C9C74"/>
          </g>
          <g clip-path="url(#rv-es-cp)">
            <path d="M116.709 103.125V104.625C116.709 105.246 117.212 105.75 117.834 105.75H120.084V104.062H118.396V103.125H116.709Z" fill="white"/>
            <path d="M119.334 90H117.834C117.212 90 116.709 90.5037 116.709 91.125V92.625H118.396V91.6875H119.334V90Z" fill="white"/>
            <path d="M116.709 101.625H118.396V98.625H116.709V101.625Z" fill="white"/>
            <path d="M116.709 97.125H118.396V94.125H116.709V97.125Z" fill="white"/>
            <path d="M120.834 90V91.6875H123.834V90H120.834Z" fill="white"/>
            <path d="M125.334 90V91.6875H128.334V90H125.334Z" fill="white"/>
            <path d="M129.834 90V91.6875H130.771V92.625H132.459V91.125C132.459 90.5037 131.955 90 131.334 90H129.834Z" fill="white"/>
            <path d="M132.459 94.125H130.771V97.125H132.459V94.125Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M123.824 94.4234C123.083 93.8664 122.024 94.3943 122.023 95.3214L122.011 106.597C122.009 107.631 123.287 108.119 123.976 107.347L127.289 103.628L132.253 103.22C133.284 103.135 133.664 101.821 132.837 101.199L123.824 94.4234ZM123.7 105.119L123.71 96.4483L130.641 101.659L126.927 101.964C126.639 101.988 126.371 102.121 126.179 102.337L123.7 105.119Z" fill="white"/>
          </g>
        </svg>
        <p class="rv-marks-empty-text">You have no marks yet</p>
      </div>

      <!-- Sections list (category & page share one template) -->
      <div class="rv-sections-list" *ngIf="marks.length > 0">
        <div class="rv-sec-wrap" *ngFor="let sec of displayedSections; trackBy: trackBySec">

          <!-- Section header -->
          <div class="rv-sec-head" (click)="toggleSection(sec.key)">
            <div class="rv-sec-left">
              <svg class="rv-sec-chevron" [class.rv-sec-chevron--open]="expandedSections[sec.key]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="rv-sec-label">{{ sec.label }}</span>
            </div>
            <div class="rv-sec-right">
              <span class="rv-sec-count">{{ sec.totalCount }}</span>
              <button class="rv-sec-del" (click)="$event.stopPropagation(); deleteSectionMarks(sec.key)" title="Delete all">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4.19922L4.24867 12.6902C4.39303 13.6718 5.23522 14.3992 6.22739 14.3992H9.77261C10.7648 14.3992 11.607 13.6718 11.7513 12.6902L13 4.19922" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M2.1001 4.19962H5.60006M13.9001 4.19962H10.4001M5.60006 4.19962H10.4001M5.60006 4.19962C5.60006 4.19962 5.60006 3.44636 5.60006 2.89962C5.60006 2.23402 6.22686 1.59962 7.00006 1.59961C7.75165 1.59961 8.28826 1.59961 9.00006 1.59961C9.77326 1.59962 10.4001 2.20718 10.4001 2.89962C10.4001 3.44636 10.4001 4.19962 10.4001 4.19962" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Cards (visible when section expanded) -->
          <div class="rv-sec-body" *ngIf="expandedSections[sec.key]">
            <div *ngFor="let grp of sec.groups; trackBy: trackByGrp">

              <!-- ── SINGLE card (1 occurrence) ── -->
              <fvdr-redaction-mark-card
                *ngIf="grp.marks.length === 1"
                [type]="asMarkType(grp.marks[0].category)"
                [title]="grp.label"
                [pageLabel]="'Page ' + grp.marks[0].pageNum"
                [status]="grp.marks[0].status"
                [groupedBy]="groupBy"
                [selected]="selectedMark?.id === grp.marks[0].id"
                [hovered]="hoveredMarkIds.has(grp.marks[0].id)"
                style="display:block;"
                (mouseenter)="onCardMouseEnter(grp)"
                (mouseleave)="onCardMouseLeave()"
                (clicked)="selectMark(grp.marks[0])"
                (deleted)="deleteMark(grp.marks[0].id)">
              </fvdr-redaction-mark-card>

              <!-- ── GROUP card (2+ occurrences) ── -->
              <fvdr-redaction-mark-card
                *ngIf="grp.marks.length > 1"
                [type]="asMarkType(grp.marks[0].category)"
                [title]="grp.label"
                [pages]="buildMarkPages(grp)"
                [(expanded)]="expandedGroups[grp.key]"
                [hovered]="isGroupHovered(grp)"
                style="display:block;"
                (mouseenter)="onCardMouseEnter(grp)"
                (mouseleave)="onCardMouseLeave()"
                (clicked)="onGroupClicked(grp)"
                (deleted)="deleteGroupMarks(grp.key)"
                (pageClicked)="onGroupPageClicked($event)"
                (pageDeleted)="deleteMark($event)">
              </fvdr-redaction-mark-card>

            </div>
          </div><!-- /sec-body -->

        </div><!-- /sec-wrap -->
      </div>

    </div>

  </div>

  <!-- ══ LEFT NAV FLOATING PANEL (Page thumbnails / Outline) ══ -->
  <fvdr-floating-panel
    class="rv-nav-panel"
    [items]="navPanelItems"
    orientation="vertical"
    size="big"
    (itemClicked)="onNavToolClick($event)">
  </fvdr-floating-panel>

  <!-- ══ RIGHT ASIDE FLOATING PANEL ══ -->
  <fvdr-floating-panel
    *ngIf="!showMarksPanel"
    class="rv-right-panel"
    [items]="rightPanelItems"
    orientation="vertical"
    size="big"
    (itemClicked)="showMarksPanel = true">
  </fvdr-floating-panel>


  <!-- ══ MODAL: APPLY ══ -->
  <fvdr-modal
    [visible]="showApplyModal"
    title="Apply changes"
    confirmLabel="Apply"
    cancelLabel="Cancel"
    size="s"
    [closeOnOverlay]="true"
    (confirmed)="confirmApply()"
    (cancelled)="showApplyModal = false"
    (closed)="showApplyModal = false">
    <p style="margin:0; font-size:14px; color:var(--color-text-primary)">Apply redaction marks to the document? This cannot be undone.</p>
  </fvdr-modal>

  <!-- ══ MODAL: LEAVE ══ -->
  <fvdr-modal
    [visible]="showLeaveModal"
    title="Leave without saving"
    confirmLabel="Leave"
    cancelLabel="Back"
    confirmVariant="danger"
    size="s"
    [closeOnOverlay]="true"
    (confirmed)="confirmLeave()"
    (cancelled)="showLeaveModal = false"
    (closed)="showLeaveModal = false">
    <p style="margin:0; font-size:14px; color:var(--color-text-primary)">You have unsaved changes. Leave and discard all marks?</p>
  </fvdr-modal>

  <!-- ══ MODAL: DELETE ALL ══ -->
  <fvdr-modal
    [visible]="showDeleteAllModal"
    title="Delete all marks"
    confirmLabel="Delete"
    cancelLabel="Cancel"
    confirmVariant="danger"
    size="s"
    [closeOnOverlay]="true"
    (confirmed)="confirmDeleteAll()"
    (cancelled)="showDeleteAllModal = false"
    (closed)="showDeleteAllModal = false">
    <p style="margin:0; font-size:14px; color:var(--color-text-primary)">Are you sure you want to delete all marks?</p>
  </fvdr-modal>

  <!-- Toast host (DS) -->
  <fvdr-toast-host></fvdr-toast-host>
</div>
  `,
  styles: [`
:host { display: block; height: 100vh; overflow: hidden; }

.rv-root {
  display: flex; flex-direction: column; height: 100vh;
  font-family: var(--font-family); font-size: 14px;
  color: var(--color-text-primary, #1F2129);
  background: var(--color-stone-200, #F7F7F7);
  position: relative; overflow: hidden;
  user-select: none;
}

/* ── Header ── */
.rv-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 0;
  background: white;
  flex-shrink: 0; z-index: 20;
}
.rv-header-left { display: flex; align-items: center; gap: 8px; }
.rv-header-right { display: flex; align-items: center; gap: 16px; }
.rv-filename { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.rv-file-icon { width: 24px; height: 24px; flex-shrink: 0; border-radius: 4px; }
.rv-mode-chip {
  display: inline-flex; align-items: center; gap: 8px;
  height: 28px; padding: 0 12px; border-radius: 16px; cursor: pointer;
  background: var(--color-hover-bg, #ECEEF9);
  font-size: 14px; font-weight: 400; line-height: 20px;
  color: var(--color-text-primary, #1F2129);
}
.rv-mode-chip svg { flex-shrink: 0; }
.rv-mode-chip-icon,
.rv-mode-chip-arrow { color: var(--color-text-secondary, #5F616A); }
.rv-mode-chip-text { white-space: nowrap; }
.rv-marks-chip {
  display: inline-flex; align-items: center; gap: 4px;
  height: 28px; padding: 0 8px; border-radius: var(--radius-sm, 4px);
  font-size: 14px; font-weight: 400; color: var(--color-text-primary, #1F2129);
  white-space: nowrap;
}
.rv-marks-chip--applied { background: var(--color-status-stable-bg); }
.rv-marks-chip--draft   { background: var(--redaction-selected-bg); }
.rv-marks-chip-label { padding: 0 4px; line-height: 20px; }
.rv-marks-chip-count { line-height: 20px; }
.rv-marks-dot {
  width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
}
.rv-marks-dot--applied { background: var(--redaction-status-applied); }
.rv-marks-dot--draft   { background: var(--redaction-status-draft); }
.rv-page-nav { font-size: 14px; color: var(--color-text-secondary, #5F616A); white-space: nowrap; }
.rv-divider-v { width: 1px; height: 20px; background: var(--color-divider); margin: 0 4px; }
/* ── Toolbar ── */
.rv-toolbar {
  display: flex; align-items: center; gap: 4px;
  padding: 12px 16px 16px;
  background: white; border-bottom: 1px solid var(--color-divider);
  flex-shrink: 0; position: relative; z-index: 20; overflow: visible;
}
.rv-tab-wrap { position: relative; }
.rv-tool-separator { width: 1px; height: 16px; background: var(--color-divider); margin: 0 4px; }
.rv-tool-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
}
.rv-tool-btn:hover { background: var(--color-stone-300, #ECEEF9); }
.rv-tool-btn svg { width: 18px; height: 18px; fill: currentColor; }
/* ghost-btn wrapper in toolbar — no extra spacing needed */
.rv-tool-tab { display: inline-flex; }
.rv-unsaved { margin-left: auto; font-size: 14px; color: var(--color-text-secondary); }
/* Override toggle label font size to 15px + fix vertical alignment */
fvdr-toggle { display: inline-flex; align-items: center; }
fvdr-toggle ::ng-deep .toggle__label { font-size: 15px; }

/* ── Body layout ── */
.rv-body {
  display: flex; flex: 1; overflow: hidden; position: relative;
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
  padding: 16px 0 24px; gap: 20px; min-height: 100%;
}
.rv-loading {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px 0; color: var(--color-text-secondary);
}
.rv-spinner {
  width: 32px; height: 32px; border: 3px solid var(--color-border);
  border-top-color: var(--color-primary-500); border-radius: 50%;
  animation: rv-spin 0.8s linear infinite;
}
@keyframes rv-spin { to { transform: rotate(360deg); } }

/* ── Page wrapper ── */
.rv-page-wrap {
  position: relative; display: inline-block;
  box-shadow: 0 0 4px 0 rgba(52, 58, 64, 0.08);
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
  position: absolute; cursor: grab;
  display: flex; align-items: center; justify-content: center;
  border-radius: 2px;
  border: 1px solid transparent;
  box-sizing: border-box;
}
.rv-mark--dragging { cursor: grabbing; }
.rv-mark--draft  { background: rgba(223, 109, 0, 0.16); }
.rv-mark--applied { background: rgba(44, 156, 116, 0.16); }
.rv-mark--preview { background: var(--redaction-preview-fill); border-color: transparent; cursor: default; }
.rv-mark--selected.rv-mark--draft { background: rgba(223, 109, 0, 0.24); border-color: var(--redaction-selected-border); }
.rv-mark--selected.rv-mark--applied { background: rgba(44, 156, 116, 0.24); border-color: var(--color-interactive-primary); }
.rv-mark--hover.rv-mark--draft { border-color: rgba(223, 109, 0, 0.5); }
.rv-mark--hover.rv-mark--applied { border-color: rgba(44, 156, 116, 0.5); }
.rv-mark-del {
  position: absolute; top: -8px; right: -8px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--color-error-600, #E54430); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s;
}
.rv-mark:hover .rv-mark-del,
.rv-mark--selected .rv-mark-del { opacity: 1; }
.rv-mark-del svg { width: 12px; height: 12px; }
.rv-draw-rect {
  position: absolute; background: rgba(31,33,41,.5);
  border: 2px dashed rgba(255,255,255,.7);
  pointer-events: none;
}

/* ── Marks panel ── */
.rv-marks-panel {
  width: 320px; background: white;
  border-left: 1px solid var(--color-divider);
  display: flex; flex-direction: column;
  flex-shrink: 0; overflow: hidden;
}
.rv-marks-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 8px;
}
.rv-marks-header-actions { display: flex; align-items: center; gap: 16px; }
.rv-marks-title { font-size: 16px; font-weight: 600; }
.rv-marks-tabs {
  padding: 8px 16px;
}
/* Stretch DS segment full-width */
.rv-marks-tabs fvdr-segment { display: block; }
.rv-marks-tabs fvdr-segment ::ng-deep .seg-table { display: flex; width: 100%; }
.rv-marks-tabs fvdr-segment ::ng-deep .seg-table__item { flex: 1; }
.rv-marks-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; padding: 32px 16px; gap: 12px;
}
.rv-marks-empty-illu { width: 176px; height: 120px; }
.rv-marks-empty-text { color: var(--color-text-secondary); font-size: 14px; text-align: center; }

/* ── Status filter ── */
.rv-marks-status-filter {
  display: flex; gap: 8px; padding: 8px 16px 8px;
  flex-shrink: 0;
}
.rv-marks-status-filter fvdr-filter-btn { flex: 1; display: flex !important; }
.rv-marks-status-filter fvdr-filter-btn ::ng-deep .fb { width: 100%; justify-content: center; }

/* ── Sections list ── */
.rv-sections-list { flex: 1; overflow-y: auto; padding-bottom: 8px; }
.rv-sec-wrap { /* each section wrapper */ }

/* Section header */
.rv-sec-head {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 16px;
  cursor: pointer; user-select: none;
  color: var(--color-stone-600, #9C9EA8);
}
.rv-sec-head:hover { background: none; }
.rv-sec-left { display: flex; align-items: center; gap: 8px; }
.rv-sec-right { display: flex; align-items: center; gap: 16px; }
.rv-sec-chevron { width: 16px; height: 16px; flex-shrink: 0; transition: transform .18s; color: var(--color-stone-600, #9C9EA8); }
.rv-sec-chevron--open { transform: rotate(180deg); }
.rv-sec-label {
  font-size: 14px; font-weight: 600;
  color: var(--color-text-primary);
}
.rv-sec-count { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
.rv-sec-del {
  width: 16px; height: 16px; border: none; background: none;
  cursor: pointer; padding: 0; display: none; align-items: center; justify-content: center;
  color: var(--color-text-secondary, #5F616A); transition: color 0.12s; flex-shrink: 0;
  outline: none;
}
.rv-sec-head:hover .rv-sec-del { display: flex; }
.rv-sec-del:hover { color: var(--color-text-primary, #1F2129); background: none; }
.rv-sec-body {
  display: flex; flex-direction: column; gap: 12px;
  padding: 4px 16px 16px;
}

/* ── Left nav floating panel ── */
.rv-nav-panel {
  position: absolute; top: 124px; left: 16px; z-index: 25;
}

/* ── Right aside floating panel ── */
.rv-right-panel {
  position: absolute; top: 124px; right: 16px; z-index: 25;
}

/* ── Floating panels ── */
.rv-float-panel {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
  background: white; border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.10); width: 320px;
}
.rv-float-panel-inner { padding: 16px; }
/* Search panel inner — flex column with 16px gap */
.rv-search-panel { display: flex; flex-direction: column; gap: 16px; }
/* Search input 1px border override */
.rv-search-panel fvdr-search ::ng-deep .search__field { border-width: 1px; }
.rv-float-title { font-size: 14px; font-weight: 600; }
/* Detect panel — gradient border */
.rv-float-panel--detect {
  border: 1px solid transparent;
  box-shadow: none;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg,
      hsla(238, 45%, 84%, 1) 0%,
      hsla(233, 47%, 90%, 1) 33%,
      hsla(53, 94%, 75%, 1) 66%,
      hsla(130, 85%, 77%, 1) 100%
    ) border-box;
}
/* Detect panel — progress bar 6px */
.rv-float-panel--detect fvdr-progress ::ng-deep .progress__track { height: 6px; border-radius: 4px; }
.rv-float-panel--detect fvdr-progress ::ng-deep .progress__fill { border-radius: 4px; }
/* Detect panel — cancel button 1px border */
.rv-float-panel--detect fvdr-btn ::ng-deep .btn { border-width: 1px; }
/* Keep margin for detect panel inner states */
.rv-float-panel--detect .rv-float-title { margin-bottom: 12px; }
.rv-search-meta {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 14px; color: var(--color-text-secondary);
}
.rv-search-meta--empty { color: var(--color-stone-600); justify-content: center; }
.rv-search-nav { display: flex; gap: 16px; }
.rv-search-nav-btn {
  width: 16px; height: 16px; border: none; background: none;
  cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--color-text-secondary, #5F616A); transition: color 0.12s;
}
.rv-search-nav-btn:hover:not(:disabled) { color: var(--color-text-primary, #1F2129); }
.rv-search-nav-btn svg path { fill: currentColor; }
.rv-search-nav-btn:disabled { opacity: 0.4; cursor: default; }
.rv-detect-loading {
  display: flex; flex-direction: column; align-items: center; gap: 24px;
}
.rv-detect-illu { width: 176px; height: 120px; flex-shrink: 0; }
.rv-detect-text { display: flex; flex-direction: column; gap: 8px; text-align: center; width: 100%; }
.rv-detect-title { font-size: 14px; font-weight: 600; text-align: center; color: var(--color-text-primary); }
.rv-detect-sub { font-size: 14px; color: var(--color-text-secondary); text-align: center; margin: 0; }
.rv-detect-results { display: flex; flex-direction: column; gap: 12px; }
.rv-pii-filter-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.rv-detect-info-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--color-stone-200, #F7F7F7); border-radius: 6px;
  padding: 0 12px; height: 32px; font-size: 14px; color: var(--color-text-secondary);
  flex-shrink: 0;
}
.rv-detect-info-bar svg { flex-shrink: 0; }
.rv-detect-idle { display: flex; flex-direction: column; gap: 10px; }
.rv-detect-noresults { display: flex; flex-direction: column; gap: 8px; }

/* ── Icon button ── */
.rv-icon-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--color-stone-700, #73757F);
}
.rv-icon-btn:hover { background: var(--color-stone-300, #ECEEF9); }
/* Close button in marks header — no bg, just darken icon */
.rv-marks-header .rv-icon-btn:hover { background: transparent; color: var(--color-text-primary, #1F2129); }
.rv-icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
.rv-icon-btn--sm { width: 26px; height: 26px; }
.rv-icon-btn--sm svg { width: 14px; height: 14px; }
.rv-icon-btn:disabled { opacity: .4; cursor: default; }
.rv-icon-btn:disabled:hover { background: transparent; }

/* fvdr-btn full width in floating panels */
.rv-float-panel-inner fvdr-btn { display: block; width: 100%; }
.rv-float-panel-inner fvdr-btn ::ng-deep button { width: 100%; }
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
  groupByItems: SegmentItem[] = [
    { id: 'category', icon: 'group-by-category', label: 'By category' },
    { id: 'page',     icon: 'group-by-page',     label: 'By page' }
  ];

  // ── Sections (recomputed when marks change) ───────────────────────────────
  _categorySections: CategorySection[] = [];
  _pageSections: CategorySection[] = [];
  expandedSections: Record<string, boolean> = {};
  expandedGroups: Record<string, boolean> = {};
  trackBySec = (_: number, s: CategorySection) => s.key;
  trackByGrp = (_: number, g: MarkCardGroup) => g.key;

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
  selectedPiiCats = new Set<string>();
  PII_ORDER = PII_ORDER;

  // ── Marks ─────────────────────────────────────────────────────────────────
  marks: RedactionMark[] = [];
  selectedMark: RedactionMark | null = null;
  hoveredMarkIds = new Set<string>();
  markStatusFilter: 'all' | 'applied' | 'draft' = 'all';

  // ── Drag state ────────────────────────────────────────────────────────────
  dragState: { markId: string; pageNum: number; startClientX: number; startClientY: number; origMarkX: number; origMarkY: number } | null = null;
  private wasDragging = false;

  // ── Draw state ────────────────────────────────────────────────────────────
  drawing: { pageNum: number; startX: number; startY: number } | null = null;
  drawRect = { x: 0, y: 0, width: 0, height: 0 };

  // ── Modals ────────────────────────────────────────────────────────────────
  showApplyModal = false;
  showLeaveModal = false;
  showDeleteAllModal = false;

  // ── Toast (DS ToastService) ───────────────────────────────────────────────
  private toastService = inject(ToastService);

  // ── History (for undo/redo) ───────────────────────────────────────────────
  private history: RedactionMark[][] = [];
  private historyIdx = -1;

  Math = Math;

  // ── Toolbar icon paths (SVG path d= values, 16×16 viewBox) ──────────────
  readonly ICON_REDACT_AREA =
    'M5.45703 4.98633C5.43354 4.19043 6.3049 3.68718 6.98242 4.10547L15.5283 9.38379C16.2828 9.85032 16.0904 10.9636 15.2891 11.1934L15.1211 11.2275L10.8271 11.7402C10.5557 11.7728 10.3094 11.9149 10.1455 12.1338L7.55469 15.5957L7.44238 15.7236C6.84276 16.3032 5.78153 15.9133 5.75488 15.0264L5.45703 4.98633Z' +
    'M1.25 11.5C1.66421 11.5 2 11.8358 2 12.25V14H3.75C4.16421 14 4.5 14.3358 4.5 14.75C4.5 15.1642 4.16421 15.5 3.75 15.5H1.5L1.39746 15.4951C0.927034 15.4472 0.552783 15.073 0.504883 14.6025L0.5 14.5V12.25C0.5 11.8358 0.835786 11.5 1.25 11.5Z' +
    'M7.21094 13.5498L8.94434 11.2344L9.10742 11.0391C9.50916 10.603 10.0552 10.321 10.6494 10.25L13.5205 9.90723L6.98438 5.87012L7.21094 13.5498Z' +
    'M1.25 6C1.66421 6 2 6.33579 2 6.75V9.25C2 9.66421 1.66421 10 1.25 10C0.835786 10 0.5 9.66421 0.5 9.25V6.75C0.5 6.33579 0.835786 6 1.25 6Z' +
    'M3.75 0.5C4.16421 0.5 4.5 0.835786 4.5 1.25C4.5 1.66421 4.16421 2 3.75 2H2V3.75C2 4.16421 1.66421 4.5 1.25 4.5C0.835786 4.5 0.5 4.16421 0.5 3.75V1.5C0.5 0.947715 0.947715 0.5 1.5 0.5H3.75Z' +
    'M14.5 0.5C15.0523 0.5 15.5 0.947715 15.5 1.5V3.75C15.5 4.16421 15.1642 4.5 14.75 4.5C14.3358 4.5 14 4.16421 14 3.75V2H12.25C11.8358 2 11.5 1.66421 11.5 1.25C11.5 0.835786 11.8358 0.5 12.25 0.5H14.5Z' +
    'M9.25 0.5C9.66421 0.5 10 0.835786 10 1.25C10 1.66421 9.66421 2 9.25 2H6.75C6.33579 2 6 1.66421 6 1.25C6 0.835786 6.33579 0.5 6.75 0.5H9.25Z';

  readonly ICON_CHEVRON_LEFT =
    'M10.0076 13C9.92174 13.0004 9.8367 12.9837 9.75743 12.9508C9.67816 12.9178 9.60626 12.8694 9.54595 12.8084L5.19104 8.45347C5.06871 8.33099 5 8.16496 5 7.99185C5 7.81874 5.06871 7.65271 5.19104 7.53023L9.54595 3.17532C9.66978 3.05993 9.83357 2.99712 10.0028 3.0001C10.172 3.00309 10.3335 3.07164 10.4532 3.19133C10.5729 3.31101 10.6414 3.47248 10.6444 3.64171C10.6474 3.81094 10.5846 3.97473 10.4692 4.09856L6.5759 7.99185L10.4692 11.8851C10.5915 12.0076 10.6602 12.1736 10.6602 12.3468C10.6602 12.5199 10.5915 12.6859 10.4692 12.8084C10.4089 12.8694 10.337 12.9178 10.2577 12.9508C10.1784 12.9837 10.0934 13.0004 10.0076 13Z';

  readonly ICON_CHEVRON_RIGHT =
    'M5.98842 3.00178C6.07424 3.00134 6.15929 3.01804 6.23858 3.05091C6.31786 3.08379 6.38978 3.13216 6.45011 3.1932L10.8068 7.54636C10.9291 7.6688 10.9979 7.8348 10.998 8.00791C10.9981 8.18102 10.9294 8.34707 10.8071 8.4696L6.45398 12.8263C6.3302 12.9417 6.16644 13.0046 5.9972 13.0017C5.82797 12.9987 5.66647 12.9303 5.54674 12.8106C5.42701 12.691 5.35839 12.5295 5.35533 12.3603C5.35228 12.1911 5.41503 12.0273 5.53037 11.9034L9.42209 8.00854L5.52724 4.11682C5.40486 3.99438 5.33609 3.82838 5.33602 3.65527C5.33595 3.48217 5.40459 3.31611 5.52687 3.19358C5.58716 3.13249 5.65904 3.08405 5.7383 3.05112C5.81755 3.01818 5.90259 3.0014 5.98842 3.00178Z';

  readonly ICON_CLOSE_VIEWER =
    'M14 3.20857L12.7914 2L8 6.79143L3.20857 2L2 3.20857L6.79143 8L2 12.7914L3.20857 14L8 9.20857L12.7914 14L14 12.7914L9.20857 8L14 3.20857Z';

  readonly ICON_UNDO =
    'M0.748037 4.5C0.334999 4.50025 1.90735e-05 4.83496 -9.53674e-06 5.24805V10.4795C1.23978e-05 11.0592 0.470102 11.5291 1.0498 11.5293H6.28124C6.69463 11.5293 7.03076 11.1946 7.03222 10.7812C7.03343 10.366 6.69655 10.0283 6.28124 10.0283H2.46093L2.45897 10.0264C4.02718 8.23369 6.12119 7.19904 8.17187 7.10156L8.57226 7.09473C10.5762 7.11945 12.5707 8.05345 14.043 10.1963C14.2908 10.5569 14.7759 10.692 15.1592 10.4707C15.5407 10.2501 15.6758 9.7574 15.4277 9.3877C13.6098 6.67958 11.0067 5.45079 8.35253 5.49512L8.09569 5.50293C5.67855 5.61785 3.30082 6.77728 1.49901 8.70508L1.49608 5.24707C1.49552 4.83422 1.16092 4.5 0.748037 4.5Z';

  readonly ICON_REDO =
    'M15.2554 4.5C15.6685 4.50025 16.0035 4.83496 16.0035 5.24805V10.4795C16.0035 11.0592 15.5334 11.5291 14.9537 11.5293H9.72224C9.30885 11.5293 8.97272 11.1946 8.97126 10.7812C8.97005 10.366 9.30693 10.0283 9.72224 10.0283H13.5426L13.5445 10.0264C11.9763 8.23369 9.88229 7.19904 7.83161 7.10156L7.43122 7.09473C5.42725 7.11945 3.43277 8.05345 1.96052 10.1963C1.71269 10.5569 1.22763 10.692 0.844308 10.4707C0.462795 10.2501 0.327653 9.7574 0.575754 9.3877C2.39371 6.67958 4.9968 5.45079 7.65095 5.49512L7.90778 5.50293C10.3249 5.61785 12.7027 6.77728 14.5045 8.70508L14.5074 5.24707C14.508 4.83422 14.8426 4.5 15.2554 4.5Z';

  readonly ICON_SEARCH =
    'M2.46369 2.46332C4.4162 0.510813 7.58233 0.511035 9.53498 2.46332C11.3073 4.23567 11.4703 7.00739 10.0252 8.9643L14.4852 13.4243C14.7778 13.7172 14.778 14.192 14.4852 14.4848C14.1924 14.7776 13.7175 14.7774 13.4246 14.4848L8.96467 10.0248C7.00776 11.4699 4.23604 11.307 2.46369 9.53461C0.511401 7.58196 0.511179 4.41583 2.46369 2.46332Z' +
    'M8.47443 3.52485C7.1076 2.15801 4.89205 2.15801 3.52521 3.52485C2.15838 4.89168 2.15838 7.10723 3.52521 8.47406C4.89206 9.84075 7.10765 9.84085 8.47443 8.47406C9.84121 7.10728 9.84111 4.89169 8.47443 3.52485Z';

  readonly ICON_PII =
    'M2.50595 11.749C2.57033 11.5693 2.81555 11.5693 2.87998 11.749L3.36728 13.1094L4.68466 13.6133C4.85813 13.68 4.85816 13.9343 4.68466 14.001L3.36728 14.5039L2.87998 15.8652C2.81549 16.0447 2.57039 16.0448 2.50595 15.8652L2.01865 14.5039L0.702241 14.001C0.528289 13.9344 0.528289 13.6798 0.702241 13.6133L2.01865 13.1094L2.50595 11.749Z' +
    'M7.72763 0.951162C7.90204 0.538143 8.46924 0.538143 8.64365 0.951162L10.1436 4.5039C10.446 5.21973 10.999 5.79102 11.6915 6.10351L15.129 7.65429C15.5285 7.83457 15.5285 8.42026 15.129 8.60058L11.6915 10.1514C10.999 10.4638 10.446 11.0352 10.1436 11.751L8.64365 15.3037C8.46924 15.7167 7.90204 15.7167 7.72763 15.3037L6.22763 11.751C5.92527 11.0352 5.37234 10.4638 4.67978 10.1514L1.24228 8.60058C0.842902 8.42023 0.842874 7.8346 1.24228 7.65429L4.67978 6.10351C5.37235 5.79103 5.92529 5.21974 6.22763 4.5039L7.72763 0.951162Z' +
    'M7.69248 5.16503C7.22887 6.2626 6.38134 7.13904 5.31943 7.61815L4.18955 8.12792L5.31943 8.63769C6.38132 9.11689 7.22896 9.99315 7.69248 11.0908L8.18564 12.2578L8.6788 11.0908C9.14231 9.99318 9.98999 9.1169 11.0519 8.63769L12.1817 8.12792L11.0519 7.61815C9.98996 7.13903 9.1424 6.26259 8.6788 5.16503L8.18564 3.99706L7.69248 5.16503Z' +
    'M3.5372 0.0673727C3.56944 -0.0224227 3.69253 -0.0224925 3.7247 0.0673727L4.30478 1.69042L5.87509 2.29003C5.96204 2.32331 5.96204 2.45109 5.87509 2.48436L4.30478 3.08397L3.7247 4.70702C3.69253 4.79687 3.56946 4.79678 3.5372 4.70702L2.95615 3.08397L1.38583 2.48436C1.29923 2.45097 1.29924 2.32343 1.38583 2.29003L2.95615 1.69042L3.5372 0.0673727Z';

  // ── Right aside floating panel ───────────────────────────────────────────
  private readonly ICON_RIGHT_ASIDE =
    'M14.5 15.5C15.0523 15.5 15.5 15.0523 15.5 14.5V1.5C15.5 0.947715 15.0523 0.5 14.5 0.5H1.5C0.947715 0.5 0.5 0.947715 0.5 1.5V14.5C0.5 15.0523 0.947715 15.5 1.5 15.5H14.5ZM2 14V2H9.25V14H2ZM10.75 14V2H14V14H10.75Z';

  readonly rightPanelItems: FloatingPanelItem[] = [
    { id: 'marks', iconPath: this.ICON_RIGHT_ASIDE, tooltip: 'Redaction marks' },
  ];

  // ── Left nav floating panel ───────────────────────────────────────────────
  private readonly NAV_THUMBNAILS_PATH =
    'M14 3.5C14.5523 3.5 15 3.94772 15 4.5V14.5C15 15.0177 14.6067 15.4438 14.1025 15.4951L14 15.5H5L4.89746 15.4951C4.42703 15.4472 4.05278 15.073 4.00488 14.6025L4 14.5V4.5C4 3.94772 4.44772 3.5 5 3.5H14ZM5.5 14H13.5V5H5.5V14ZM11.1025 0.504883C11.6067 0.556214 12 0.982323 12 1.5V2H2.5V12.5H2L1.89746 12.4951C1.42703 12.4472 1.05278 12.073 1.00488 11.6025L1 11.5V1.5C1 0.982323 1.39333 0.556214 1.89746 0.504883L2 0.5H11L11.1025 0.504883ZM10.75 10.25C11.1642 10.25 11.5 10.5858 11.5 11C11.5 11.4142 11.1642 11.75 10.75 11.75H7.25C6.83579 11.75 6.5 11.4142 6.5 11C6.5 10.5858 6.83579 10.25 7.25 10.25H10.75ZM11.75 7.25C12.1642 7.25 12.5 7.58579 12.5 8C12.5 8.41421 11.1642 8.75 11.75 8.75H7.25C6.83579 8.75 6.5 8.41421 6.5 8C6.5 7.58579 6.83579 7.25 7.25 7.25H11.75Z';

  private readonly NAV_OUTLINE_PATH =
    // Lines (path 1)
    'M14.75 12.25C15.1642 12.25 15.5 12.5858 15.5 13C15.5 13.4142 15.1642 13.75 14.75 13.75H4.75C4.33579 13.75 4 13.4142 4 13C4 12.5858 4.33579 12.25 4.75 12.25H14.75Z' +
    'M14.75 7.25C15.1642 7.25 15.5 7.58579 15.5 8C15.5 8.41421 15.1642 8.75 14.75 8.75H4.75C4.33579 8.75 4 8.41421 4 8C4 7.58579 4.33579 7.25 4.75 7.25H14.75Z' +
    'M14.75 2.25C15.1642 2.25 15.5 2.58579 15.5 3C15.5 3.41421 15.1642 3.75 14.75 3.75H4.75C4.33579 3.75 4 3.41421 4 3C4 2.58579 4.33579 2.25 4.75 2.25H14.75Z' +
    // Dots (path 2)
    'M2 12C2.27614 12 2.5 12.2239 2.5 12.5V13.5C2.5 13.7761 2.27614 14 2 14H1C0.723858 14 0.5 13.7761 0.5 13.5V12.5C0.5 12.2239 0.723858 12 1 12H2Z' +
    'M2 7C2.27614 7 2.5 7.22386 2.5 7.5V8.5C2.5 8.77614 2.27614 9 2 9H1C0.723858 9 0.5 8.77614 0.5 8.5V7.5C0.5 7.22386 0.723858 7 1 7H2Z' +
    'M2 2C2.27614 2 2.5 2.22386 2.5 2.5V3.5C2.5 3.77614 2.27614 4 2 4H1C0.723858 4 0.5 3.77614 0.5 3.5V2.5C0.5 2.22386 0.723858 2 1 2H2Z';

  navPanelItems: FloatingPanelItem[] = [];
  activeNavTool = '';

  onNavToolClick(id: string): void {
    this.activeNavTool = this.activeNavTool === id ? '' : id;
    this.navPanelItems = this.navPanelItems.map(item => ({
      ...item,
      selected: item.id === this.activeNavTool,
    }));
  }

  private initNavPanel(): void {
    this.navPanelItems = [
      { id: 'thumbnails', iconPath: this.NAV_THUMBNAILS_PATH, tooltip: 'Page thumbnails' },
      { id: 'outline',    iconPath: this.NAV_OUTLINE_PATH,    tooltip: 'Outline' },
    ];
  }

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private sanitizer: DomSanitizer) {}

  // Maps internal MarkCategory → RedactionMarkType used by fvdr-redaction-mark-card
  asMarkType(cat: string): RedactionMarkType {
    if (cat === 'manual')   return 'redacted-area';
    if (cat === 'keyword')  return 'text-mark';
    return cat as RedactionMarkType;
  }

  // Builds RedactionMarkPage[] for group card mode
  buildMarkPages(grp: MarkCardGroup): RedactionMarkPage[] {
    return grp.marks.map(m => ({
      id: m.id,
      pageLabel: 'Page ' + m.pageNum,
      status: m.status,
      selected: this.selectedMark?.id === m.id
    }));
  }

  // Called when the group card header is clicked to EXPAND — selects first mark
  // only if nothing in this group is currently selected
  onGroupClicked(grp: MarkCardGroup): void {
    const firstMark = grp.marks[0];
    if (!firstMark) return;
    // Always expand
    this.expandedGroups = { ...this.expandedGroups, [grp.key]: true };
    // Preserve current selection if something in this group is already selected
    const alreadySelected = grp.marks.find(m => m.id === this.selectedMark?.id);
    if (!alreadySelected) {
      this.selectedMark = firstMark;
      this.scrollToMark(firstMark);
    }
    this.cdr.detectChanges();
  }

  // Called when a page row is clicked inside a group card
  // Always selects the mark and scrolls to it (no toggle)
  onGroupPageClicked(markId: string): void {
    const m = this.marks.find(mark => mark.id === markId);
    if (!m) return;
    this.selectedMark = m;
    this.scrollToMark(m);
    this.cdr.detectChanges();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit() {
    this.initNavPanel();
    await this.loadPdf();
    this.recomputeSections(); // initialize stored section arrays
  }

  ngOnDestroy() {
    clearTimeout(this.detectTimer);
    clearInterval(this.detectProgressTimer);
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
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this.redo(); }
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
      if (tab === 'detect' && this.detectState === 'detecting') {
        this.cancelDetect();
      }
    } else {
      this.activeTab = tab;
      this.toolMode = 'none';
      if (tab === 'detect' && this.detectState === 'idle') {
        this.startDetect();
      }
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
    if (q.trim().length < 2) { this.searchHighlights = []; return; }
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
    this.recomputeSections();
    this.toastService.show({ variant: 'success', message: `${this.marks.filter(m => m.status === 'draft').length} marks added` });
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
      this.selectedPiiCats = new Set();
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

  get allPiiCatsSelected(): boolean {
    const visible = PII_ORDER.filter(cat => this.getPiiCount(cat) > 0);
    return visible.length > 0 && visible.every(cat => this.selectedPiiCats.has(cat));
  }

  selectAllPii() {
    if (this.allPiiCatsSelected) {
      this.selectedPiiCats = new Set();
    } else {
      this.selectedPiiCats = new Set(PII_ORDER.filter(cat => this.getPiiCount(cat) > 0));
    }
  }

  togglePiiFilter(key: string) {
    if (this.selectedPiiCats.has(key)) {
      this.selectedPiiCats.delete(key);
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
    const toMark = this.selectedPiiCats.size === 0
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
    this.recomputeSections();
    this.toastService.show({ variant: 'success', message: `${toMark.length} marks added` });
  }

  // ── Detected highlights on page ───────────────────────────────────────────
  getDetectHighlights(pageNum: number): PiiMatch[] {
    if (this.activeTab !== 'detect' || this.detectState !== 'results') return [];
    return this.detectedPii.filter(p => {
      if (p.pageNum !== pageNum) return false;
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
    if (this.dragState) {
      const dx = e.clientX - this.dragState.startClientX;
      const dy = e.clientY - this.dragState.startClientY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        if (!this.wasDragging) {
          const dragged = this.marks.find(m => m.id === this.dragState!.markId);
          if (dragged) this.selectedMark = dragged;
        }
        this.wasDragging = true;
      }
      const mark = this.marks.find(m => m.id === this.dragState!.markId);
      if (mark) {
        const pageEl = document.getElementById(`page-wrap-${this.dragState.pageNum}`);
        if (pageEl) {
          mark.x = Math.max(0, Math.min(this.dragState.origMarkX + dx, pageEl.clientWidth - mark.width));
          mark.y = Math.max(0, Math.min(this.dragState.origMarkY + dy, pageEl.clientHeight - mark.height));
          this.cdr.detectChanges();
        }
      }
      return;
    }
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
    if (this.dragState) {
      this.dragState = null;
      this.cdr.detectChanges();
      return;
    }
    if (!this.drawing) return;
    if (this.drawRect.width > 8 && this.drawRect.height > 8) {
      this.saveHistory();
      const newMark: RedactionMark = {
        id: crypto.randomUUID(), text: '',
        pageNum: this.drawing.pageNum,
        x: this.drawRect.x, y: this.drawRect.y,
        width: this.drawRect.width, height: this.drawRect.height,
        category: 'manual' as any, status: 'draft'
      };
      this.marks.push(newMark);
      this.selectedMark = newMark;
      this.showMarksPanel = true;
      this.recomputeSections();
      this.expandSectionForMark(newMark);
      setTimeout(() => {
        const panel = document.querySelector('.rv-marks-panel');
        const selected = panel?.querySelector('.rmc--selected');
        selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
    this.drawing = null;
    this.drawRect = { x: 0, y: 0, width: 0, height: 0 };
  }

  // ── Marks helpers ─────────────────────────────────────────────────────────
  getSearchHighlights(pageNum: number): SearchHighlight[] {
    if (this.activeTab !== 'search') return [];
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

  get displayedSections(): CategorySection[] {
    const base = this.groupBy === 'category' ? this._categorySections : this._pageSections;
    const filter = this.appliedCount > 0 ? this.markStatusFilter : 'all';
    if (filter === 'all') return base;
    return base
      .map(sec => {
        const filteredGroups = sec.groups
          .map(grp => ({ ...grp, marks: grp.marks.filter(m => m.status === filter) }))
          .filter(grp => grp.marks.length > 0);
        return { ...sec, groups: filteredGroups, totalCount: filteredGroups.reduce((a, g) => a + g.marks.length, 0) };
      })
      .filter(sec => sec.groups.length > 0);
  }
  get canUndo() { return this.historyIdx > 0; }
  get canRedo() { return this.historyIdx < this.history.length - 1; }

  selectMark(m: RedactionMark) {
    this.selectedMark = this.selectedMark?.id === m.id ? null : m;
    if (this.selectedMark) {
      this.scrollToMark(m);
      this.expandSectionForMark(m);
    }
    this.cdr.detectChanges();
  }

  onMarkClick(m: RedactionMark): void {
    if (this.wasDragging) { this.wasDragging = false; return; }
    this.showMarksPanel = true;
    this.selectMark(m);
    setTimeout(() => {
      const panel = document.querySelector('.rv-marks-panel');
      const selected = panel?.querySelector('.rmc--selected');
      selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  onMarkMouseDown(e: MouseEvent, m: RedactionMark): void {
    e.stopPropagation();
    e.preventDefault();
    this.dragState = {
      markId: m.id, pageNum: m.pageNum,
      startClientX: e.clientX, startClientY: e.clientY,
      origMarkX: m.x, origMarkY: m.y
    };
    this.wasDragging = false;
    this.cdr.detectChanges();
  }

  onMarkMouseEnter(m: RedactionMark): void {
    this.hoveredMarkIds = new Set([m.id]);
    this.cdr.detectChanges();
  }

  onMarkMouseLeave(): void {
    this.hoveredMarkIds = new Set();
    this.cdr.detectChanges();
  }

  onCardMouseEnter(grp: MarkCardGroup): void {
    this.hoveredMarkIds = new Set(grp.marks.map(m => m.id));
    this.cdr.detectChanges();
  }

  onCardMouseLeave(): void {
    this.hoveredMarkIds = new Set();
    this.cdr.detectChanges();
  }

  isGroupHovered(grp: MarkCardGroup): boolean {
    return grp.marks.some(m => this.hoveredMarkIds.has(m.id));
  }

  /** Scroll the PDF area to bring the mark rectangle into view (centered). */
  expandSectionForMark(m: RedactionMark): void {
    const allSections = [...this._categorySections, ...this._pageSections];
    for (const sec of allSections) {
      for (const grp of sec.groups) {
        if (grp.marks.some((gm: RedactionMark) => gm.id === m.id)) {
          this.expandedSections = { ...this.expandedSections, [sec.key]: true };
          if (grp.marks.length > 1) {
            this.expandedGroups = { ...this.expandedGroups, [grp.key]: true };
          }
          return;
        }
      }
    }
  }

  scrollToMark(m: RedactionMark): void {
    const pageEl = document.getElementById(`page-wrap-${m.pageNum}`);
    const pdfArea = document.querySelector('.rv-pdf-area') as HTMLElement;
    if (!pageEl || !pdfArea) { this.scrollToPage(m.pageNum); return; }
    // Use getBoundingClientRect to get positions regardless of offset parent
    const pdfAreaRect = pdfArea.getBoundingClientRect();
    const pageRect    = pageEl.getBoundingClientRect();
    const markCenterInPage = m.y + m.height / 2;
    const currentScrollTop = pdfArea.scrollTop;
    const pageTopInScroll  = pageRect.top - pdfAreaRect.top + currentScrollTop;
    const targetScrollTop  = pageTopInScroll + markCenterInPage - pdfArea.clientHeight / 2;
    pdfArea.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  }

  deleteMark(id: string) {
    this.saveHistory();
    this.marks = this.marks.filter(m => m.id !== id);
    if (this.selectedMark?.id === id) this.selectedMark = null;
    this.recomputeSections();
  }

  toggleSection(key: string) {
    this.expandedSections = { ...this.expandedSections, [key]: !this.expandedSections[key] };
    this.cdr.detectChanges();
  }

  toggleGroup(key: string) {
    this.expandedGroups = { ...this.expandedGroups, [key]: !this.expandedGroups[key] };
    this.cdr.detectChanges();
  }

  hasDrafts(grp: MarkCardGroup): boolean {
    return grp.marks.some(m => m.status === 'draft');
  }

  recomputeSections() {
    const catSecs = this.buildCategorySections();
    const pgSecs  = this.buildPageSections();

    // New sections start expanded; new groups start collapsed
    for (const sec of [...catSecs, ...pgSecs]) {
      if (!(sec.key in this.expandedSections)) {
        this.expandedSections = { ...this.expandedSections, [sec.key]: true };
      }
      for (const grp of sec.groups) {
        if (!(grp.key in this.expandedGroups)) {
          this.expandedGroups = { ...this.expandedGroups, [grp.key]: false };
        }
      }
    }

    this._categorySections = catSecs;
    this._pageSections     = pgSecs;
    this.cdr.detectChanges();
  }

  deleteSectionMarks(sectionKey: string) {
    this.saveHistory();
    if (sectionKey.startsWith('pg-')) {
      const pageNum = parseInt(sectionKey.replace('pg-', ''), 10);
      const ids = new Set(this.marks.filter(m => m.pageNum === pageNum).map(m => m.id));
      this.marks = this.marks.filter(m => !ids.has(m.id));
      if (this.selectedMark && ids.has(this.selectedMark.id)) this.selectedMark = null;
    } else {
      const cat = sectionKey as MarkCategory;
      this.marks = this.marks.filter(m => m.category !== cat);
      if (this.selectedMark?.category === cat) this.selectedMark = null;
    }
    this.recomputeSections();
  }

  deleteGroupMarks(groupKey: string) {
    const allSections = [...this._categorySections, ...this._pageSections];
    for (const sec of allSections) {
      const grp = sec.groups.find(g => g.key === groupKey);
      if (grp) {
        this.saveHistory();
        const ids = new Set(grp.marks.map(m => m.id));
        this.marks = this.marks.filter(m => !ids.has(m.id));
        if (this.selectedMark && ids.has(this.selectedMark.id)) this.selectedMark = null;
        this.recomputeSections();
        return;
      }
    }
  }

  private buildCategorySections(): CategorySection[] {
    const sections: CategorySection[] = [];
    for (const cat of MARKS_CAT_ORDER) {
      const catMarks = this.marks.filter(m => m.category === cat);
      if (catMarks.length === 0) continue;

      const groups: MarkCardGroup[] = [];

      if (cat === 'manual') {
        for (const m of catMarks) {
          groups.push({ key: `manual-${m.id}`, category: 'manual', label: 'Redacted area', marks: [m] });
        }
      } else {
        const textMap = new Map<string, RedactionMark[]>();
        for (const m of catMarks) {
          const k = (m.text || '').toLowerCase();
          if (!textMap.has(k)) textMap.set(k, []);
          textMap.get(k)!.push(m);
        }
        for (const textMarks of textMap.values()) {
          const textKey = (textMarks[0].text || '').toLowerCase();
          groups.push({
            key: `${cat}-${textKey}`,
            category: cat,
            label: textMarks[0].text || this.getCatMeta(cat).label,
            marks: textMarks
          });
        }
      }

      sections.push({ key: cat, category: cat, label: this.getCatMeta(cat).label, totalCount: catMarks.length, groups });
    }
    return sections;
  }

  private buildPageSections(): CategorySection[] {
    const pages = [...new Set(this.marks.map(m => m.pageNum))].sort((a, b) => a - b);
    return pages.map(pageNum => {
      const pageMarks = this.marks.filter(m => m.pageNum === pageNum);
      const groups: MarkCardGroup[] = pageMarks.map(m => ({
        key: `pg-${pageNum}-${m.id}`,
        category: m.category,
        label: m.text || this.getCatMeta(m.category).label,
        marks: [m]
      }));
      return { key: `pg-${pageNum}`, category: 'manual' as MarkCategory, label: `Page ${pageNum}`, totalCount: pageMarks.length, groups };
    });
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
    this.marks = this.marks.map(m => ({ ...m, status: 'applied' as MarkStatus }));
    this.showApplyModal = false;
    this.recomputeSections();
    this.toastService.show({ variant: 'success', message: 'Redactions applied successfully' });
  }

  confirmLeave() {
    this.showLeaveModal = false;
    this.marks = [];
    this.selectedMark = null;
    this.recomputeSections();
  }

  confirmDeleteAll() {
    this.saveHistory();
    this.marks = [];
    this.selectedMark = null;
    this.showDeleteAllModal = false;
    this.recomputeSections();
    this.toastService.show({ variant: 'success', message: 'All marks deleted' });
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
    this.recomputeSections();
  }

  redo() {
    if (this.historyIdx >= this.history.length - 1) return;
    this.historyIdx++;
    this.marks = JSON.parse(JSON.stringify(this.history[this.historyIdx]));
    this.recomputeSections();
  }

  getPiiIconHtml(cat: PiiCategory): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(PII_ICONS[cat] || '');
  }

  getPiiFilterColor(cat: PiiCategory): FilterBtnColor {
    return PII_FILTER_COLORS[cat] || 'stone';
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

}
