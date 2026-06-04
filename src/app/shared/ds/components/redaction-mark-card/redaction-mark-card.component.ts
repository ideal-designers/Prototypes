import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * DS Redaction Mark Card — unified component for single mark, group header, and page rows.
 *
 * SINGLE CARD MODE  — `pages` is empty (default)
 *   Renders one mark with icon, title, subtitle, status dot, optional delete button.
 *
 * GROUP CARD MODE   — `pages.length > 0`
 *   Renders a collapsible group with colored header (draft/applied) and expandable page rows.
 *
 * Figma:
 *   Single: node 16955-44749
 *   Group:  node 17274-51560
 *   Page row inside group: node 17274-47404
 *
 * Usage (single):
 *   <fvdr-redaction-mark-card
 *     [type]="'personal-name'" [title]="mark.text" [pageLabel]="'Page 3'"
 *     [status]="mark.status" [groupedBy]="'category'"
 *     (clicked)="select(mark)" (deleted)="delete(mark.id)">
 *   </fvdr-redaction-mark-card>
 *
 * Usage (group):
 *   <fvdr-redaction-mark-card
 *     [type]="'email'" [title]="'Email'" [pages]="markPages"
 *     [(expanded)]="isOpen"
 *     (deleted)="deleteAll()" (pageClicked)="selectById($event)"
 *     (pageDeleted)="deleteById($event)">
 *   </fvdr-redaction-mark-card>
 */

export type RedactionMarkType =
  | 'personal-name'
  | 'address'
  | 'date-time'
  | 'email'
  | 'phone'
  | 'iban'
  | 'ssn'
  | 'passport'
  | 'text-mark'
  | 'redacted-area';

export type RedactionMarkStatus = 'draft' | 'applied';
export type RedactionMarkGroupBy = 'page' | 'category';

export interface RedactionMarkPage {
  id: string;
  pageLabel: string;   // e.g. "Page 3"
  status: RedactionMarkStatus;
  selected?: boolean;
}

// ── Icon library (all converted to currentColor) ──────────────────────────────
const TYPE_META: Record<RedactionMarkType, { label: string; icon: string }> = {
  'personal-name': {
    label: 'Personal name',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.99992 1.33301C4.31802 1.33301 1.33325 4.31778 1.33325 7.99967C1.33325 11.6816 4.31802 14.6663 7.99992 14.6663C11.6818 14.6663 14.6666 11.6816 14.6666 7.99967C14.6666 4.31778 11.6818 1.33301 7.99992 1.33301Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2.84766 12.2301C2.84766 12.2301 4.33368 10.333 8.00034 10.333C11.667 10.333 13.153 12.2301 13.153 12.2301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'address': {
    label: 'Address',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13.3334 6.66634C13.3334 9.61186 8.00008 14.6663 8.00008 14.6663C8.00008 14.6663 2.66675 9.61186 2.66675 6.66634C2.66675 3.72082 5.05456 1.33301 8.00008 1.33301C10.9456 1.33301 13.3334 3.72082 13.3334 6.66634Z" stroke="currentColor" stroke-width="1.2"/>
      <path d="M7.99992 7.33333C8.36811 7.33333 8.66659 7.03486 8.66659 6.66667C8.66659 6.29848 8.36811 6 7.99992 6C7.63173 6 7.33325 6.29848 7.33325 6.66667C7.33325 7.03486 7.63173 7.33333 7.99992 7.33333Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'date-time': {
    label: 'Date & time',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 2.66634V1.33301M10 2.66634V3.99967M10 2.66634H7M2 6.66634V12.6663C2 13.4027 2.59695 13.9997 3.33333 13.9997H12.6667C13.4031 13.9997 14 13.4027 14 12.6663V6.66634H2Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 6.66699V4.00033C2 3.26395 2.59695 2.66699 3.33333 2.66699H4.66667" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4.66675 1.33301V3.99967" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.9999 6.66699V4.00033C13.9999 3.26395 13.403 2.66699 12.6666 2.66699H12.3333" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'email': {
    label: 'Email',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4.66675 5.99967L8.00008 8.33301L11.3334 5.99967" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M1 11.8665V4.13314C1 3.39676 1.59695 2.7998 2.33333 2.7998H13.6667C14.403 2.7998 15 3.39676 15 4.13314V11.8665C15 12.6029 14.403 13.1998 13.6667 13.1998H2.33333C1.59695 13.1998 1 12.6028 1 11.8665Z" stroke="currentColor" stroke-width="1.2"/>
    </svg>`
  },
  'phone': {
    label: 'Phone number',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12.0787 9.80101L9.33323 10.333C7.47876 9.40221 6.33323 8.33301 5.66657 6.66634L6.17987 3.91294L5.20958 1.33301L2.70896 1.33301C1.95726 1.33301 1.36533 1.95419 1.47759 2.69746C1.75786 4.55301 2.58425 7.91736 4.9999 10.333C7.5367 12.8698 11.1904 13.9706 13.2012 14.4082C13.9777 14.5771 14.6666 13.9713 14.6666 13.1767L14.6666 10.7872L12.0787 9.80101Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'iban': {
    label: 'IBAN',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.33301L8 2.66634L14 6.33301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 13.333H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.66675 6L9.33341 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4 11.3333L4 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.66675 11.3333L6.66675 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.33325 11.3333L9.33325 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 11.3333L12 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'ssn': {
    label: 'SSN',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14.6666 5.99967V4.66634C14.6666 3.92996 14.0696 3.33301 13.3333 3.33301H2.66658C1.9302 3.33301 1.33325 3.92996 1.33325 4.66634V11.333C1.33325 12.0694 1.93021 12.6663 2.66659 12.6663H7.99992M14.6666 5.99967H3.99992M14.6666 5.99967V7.33301" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.6615 9.41636L14.3651 9.84902C14.5425 9.89406 14.6675 10.0552 14.6621 10.2381C14.5476 14.077 12.3333 14.6663 12.3333 14.6663C12.3333 14.6663 10.1191 14.077 10.0046 10.2381C9.99914 10.0552 10.1242 9.89406 10.3015 9.84902L12.0051 9.41636C12.2205 9.36166 12.4462 9.36166 12.6615 9.41636Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'passport': {
    label: 'Passport',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="7.5" y="3.7002" width="3" height="1.2" rx="0.6" fill="currentColor"/>
      <rect x="7.5" y="6.09961" width="4" height="1.2" rx="0.6" fill="currentColor"/>
      <path d="M13 1C13.5523 1 14 1.44772 14 2V6.89941C14 7.23068 13.7316 7.49974 13.4004 7.5C13.0691 7.5 12.8001 7.23159 12.7998 6.90039V2.2002H6.2002V11.4004C6.19993 11.7314 5.93162 11.9997 5.60059 12C5.26932 12 5.00026 11.7316 5 11.4004V2.2002C4.00589 2.2002 3.2002 3.00589 3.2002 4V12C3.2002 12.9941 4.00589 13.7998 5 13.7998H8.39941C8.73084 13.7998 9 14.069 9 14.4004C8.99974 14.7314 8.73143 14.9997 8.40039 15H5C3.39489 15 2.08421 13.7394 2.00391 12.1543L2 12V4C2 2.34315 3.34315 1 5 1H13Z" fill="currentColor"/>
      <path d="M12.6615 9.41636L14.3651 9.84902C14.5425 9.89406 14.6675 10.0552 14.6621 10.2381C14.5476 14.077 12.3333 14.6663 12.3333 14.6663C12.3333 14.6663 10.1191 14.077 10.0046 10.2381C9.99914 10.0552 10.1242 9.89406 10.3015 9.84902L12.0051 9.41636C12.2205 9.36166 12.4462 9.36166 12.6615 9.41636Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'text-mark': {
    label: 'Text mark',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12.667 4.667V3.333H3.333v1.334" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 3.333V12.667M8 12.667H6.667M8 12.667H9.333" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  'redacted-area': {
    label: 'Redacted area',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.568 5.168c-.02-.696.742-1.137 1.334-.77l7.428 4.59c.66.408.492 1.382-.208 1.584l-.15.029-3.726.446a1.333 1.333 0 0 0-.994.586l-2.249 3.006c-.496.663-1.55.33-1.574-.498L5.568 5.168ZM1.903 10.836a.654.654 0 0 1 .653.653v1.525H4.08a.654.654 0 1 1 0 1.308H2.121a.872.872 0 0 1-.871-.87v-1.963a.654.654 0 0 1 .653-.653ZM7.1 12.607l1.499-2.002.142-.173a1.994 1.994 0 0 1 1.231-.566l.22-.037 2.482-.297-5.671-3.505.097 6.58ZM1.903 6.043a.654.654 0 0 1 .654.653v2.18a.654.654 0 0 1-1.307 0V6.696a.654.654 0 0 1 .653-.653ZM4.08 1.25a.654.654 0 0 1 .001 1.308H2.557v1.525a.654.654 0 0 1-1.307 0V2.121C1.25 1.64 1.64 1.25 2.121 1.25H4.08ZM13.443 1.25c.481 0 .871.39.871.871V4.083a.654.654 0 0 1-1.307 0V2.558h-1.524a.654.654 0 0 1 0-1.308h1.96ZM8.87 1.25a.654.654 0 1 1 0 1.308H6.694a.654.654 0 0 1 0-1.308H8.87Z" fill="currentColor"/>
    </svg>`
  }
};

@Component({
  selector: 'fvdr-redaction-mark-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══ SINGLE CARD MODE ══ -->
    <div *ngIf="!isGroup"
         class="rmc"
         [class.rmc--selected]="selected"
         [class.rmc--hovered]="hovered && !selected"
         [class.rmc--draft]="status === 'draft'"
         [class.rmc--applied]="status === 'applied'"
         (click)="clicked.emit()">

      <span class="rmc-icon" [innerHTML]="safeIcon"></span>

      <div class="rmc-info">
        <span class="rmc-title">{{ displayTitle }}</span>
        <span class="rmc-sub">{{ displaySubtitle }}</span>
      </div>

      <!-- Right side: status dot + delete (hidden by default, shows on hover) -->
      <div class="rmc-right">
        <span class="rmc-dot"
              [class.rmc-dot--draft]="status === 'draft'"
              [class.rmc-dot--applied]="status === 'applied'"></span>
        <button *ngIf="deletable" class="rmc-del" title="Delete"
                (click)="$event.stopPropagation(); deleted.emit()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4.19922L4.24867 12.6902C4.39303 13.6718 5.23522 14.3992 6.22739 14.3992H9.77261C10.7648 14.3992 11.607 13.6718 11.7513 12.6902L13 4.19922" stroke="currentColor" stroke-width="1.2"/>
            <path d="M2.1001 4.19962H5.60006M13.9001 4.19962H10.4001M5.60006 4.19962H10.4001M5.60006 4.19962C5.60006 4.19962 5.60006 3.44636 5.60006 2.89962C5.60006 2.23402 6.22686 1.59962 7.00006 1.59961C7.75165 1.59961 8.28826 1.59961 9.00006 1.59961C9.77326 1.59962 10.4001 2.20718 10.4001 2.89962C10.4001 3.44636 10.4001 4.19962 10.4001 4.19962" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ══ GROUP CARD MODE ══ -->
    <div *ngIf="isGroup"
         class="rmc rmc--group"
         [class.rmc--group-draft]="groupStatus === 'draft'"
         [class.rmc--group-applied]="groupStatus === 'applied'"
         [class.rmc--group-selected]="isGroupSelected">

      <!-- Group header -->
      <div class="rmc-group-head" (click)="onToggleExpanded()">

        <span class="rmc-icon" [innerHTML]="safeIcon"></span>

        <div class="rmc-info">
          <span class="rmc-title">{{ displayTitle }}</span>
          <div class="rmc-meta">
            <span class="rmc-count">{{ pages.length }} marks</span>
            <svg class="rmc-chevron" [class.rmc-chevron--open]="expanded"
                 width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9.96973 3.46984C10.2626 3.17695 10.7374 3.17695 11.0303 3.46984C11.3232 3.76274 11.3232 4.2375 11.0303 4.53039L6.67188 8.88879C6.30088 9.25979 5.69913 9.25979 5.32813 8.88879L0.969729 4.53039L0.917971 4.47375C0.677662 4.17917 0.695125 3.74445 0.969729 3.46984C1.24433 3.19524 1.67905 3.17778 1.97364 3.41809L2.03028 3.46984L6 7.43957L9.96973 3.46984Z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        <div class="rmc-right">
          <span class="rmc-dot"
                [class.rmc-dot--draft]="groupStatus === 'draft'"
                [class.rmc-dot--applied]="groupStatus === 'applied'"></span>
          <button *ngIf="deletable" class="rmc-del" title="Delete all"
                  (click)="onDeleteGroup($event)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 4.19922L4.24867 12.6902C4.39303 13.6718 5.23522 14.3992 6.22739 14.3992H9.77261C10.7648 14.3992 11.607 13.6718 11.7513 12.6902L13 4.19922" stroke="currentColor" stroke-width="1.2"/>
              <path d="M2.1001 4.19962H5.60006M13.9001 4.19962H10.4001M5.60006 4.19962H10.4001M5.60006 4.19962C5.60006 4.19962 5.60006 3.44636 5.60006 2.89962C5.60006 2.23402 6.22686 1.59962 7.00006 1.59961C7.75165 1.59961 8.28826 1.59961 9.00006 1.59961C9.77326 1.59962 10.4001 2.20718 10.4001 2.89962C10.4001 3.44636 10.4001 4.19962 10.4001 4.19962" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div><!-- /group-head -->

      <!-- Page rows — [hidden] keeps DOM alive so scroll position survives collapse -->
      <div class="rmc-pages" [hidden]="!expanded">
        <div *ngFor="let page of pages; trackBy: trackByPageId"
             class="rmc-page-row"
             [class.rmc-page-row--selected]="page.selected"
             (click)="onPageClick(page.id)">

          <svg class="rmc-page-bar" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="7" y="0" width="2" height="16" rx="1" fill="currentColor"/>
          </svg>

          <span class="rmc-page-name">{{ page.pageLabel }}</span>

          <div class="rmc-right">
            <span class="rmc-dot"
                  [class.rmc-dot--draft]="page.status === 'draft'"
                  [class.rmc-dot--applied]="page.status === 'applied'"></span>
            <button *ngIf="deletable" class="rmc-del" title="Delete"
                    (click)="onDeletePage($event, page.id)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 4.19922L4.24867 12.6902C4.39303 13.6718 5.23522 14.3992 6.22739 14.3992H9.77261C10.7648 14.3992 11.607 13.6718 11.7513 12.6902L13 4.19922" stroke="currentColor" stroke-width="1.2"/>
                <path d="M2.1001 4.19962H5.60006M13.9001 4.19962H10.4001M5.60006 4.19962H10.4001M5.60006 4.19962C5.60006 4.19962 5.60006 3.44636 5.60006 2.89962C5.60006 2.23402 6.22686 1.59962 7.00006 1.59961C7.75165 1.59961 8.28826 1.59961 9.00006 1.59961C9.77326 1.59962 10.4001 2.20718 10.4001 2.89962C10.4001 3.44636 10.4001 4.19962 10.4001 4.19962" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div><!-- /rmc-pages -->

    </div><!-- /group card -->
  `,
  styles: [`
    /* ── Base single card ──────────────────────────────────── */
    .rmc {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      min-height: 64px;
      border: 1px solid var(--color-divider, #DEE0EB);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-stone-0, #FFFFFF);
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.12s;
      user-select: none;
    }

    /* Hover */
    .rmc:not(.rmc--group):hover { background: var(--color-stone-100, #FAFAFA); }

    /* Selected — draft (orange) */
    .rmc--selected.rmc--draft:not(.rmc--group) { background: var(--redaction-selected-bg); border-color: var(--redaction-selected-border); }
    .rmc--selected.rmc--draft:not(.rmc--group):hover { background: var(--redaction-selected-bg); }

    /* Selected — applied (green) */
    .rmc--selected.rmc--applied:not(.rmc--group) { background: var(--color-status-stable-bg); border-color: var(--color-interactive-primary); }
    .rmc--selected.rmc--applied:not(.rmc--group):hover { background: var(--color-status-stable-bg); }

    /* Hovered — gray (same as CSS :hover) */
    .rmc--hovered:not(.rmc--group) { background: var(--color-stone-100, #FAFAFA); }

    /* ── Icon ──────────────────────────────────────────────── */
    .rmc-icon {
      width: 16px; height: 16px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-secondary, #5F616A);
    }
    .rmc-icon ::ng-deep svg { width: 16px; height: 16px; display: block; }

    /* Icon tints in selected state only */
    .rmc--selected.rmc--draft   .rmc-icon { color: var(--redaction-selected-border); }
    .rmc--selected.rmc--applied .rmc-icon { color: var(--color-interactive-primary); }

    /* Icon tints in selected group card header */
    .rmc--group-selected.rmc--group-draft   .rmc-group-head .rmc-icon { color: var(--redaction-selected-border); }
    .rmc--group-selected.rmc--group-applied .rmc-group-head .rmc-icon { color: var(--color-interactive-primary); }

    /* ── Info column ───────────────────────────────────────── */
    .rmc-info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column;
      gap: 4px;
    }
    .rmc-title {
      font-family: 'Open Sans', sans-serif;
      font-size: 14px; font-weight: 400;
      color: var(--color-text-primary, #1F2129);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      line-height: 20px;
    }
    .rmc-sub {
      font-family: 'Open Sans', sans-serif;
      font-size: 12px;
      color: var(--color-text-secondary, #5F616A);
      line-height: 16px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* ── Right wrapper (del + dot) ─────────────────────────── */
    .rmc-right {
      display: flex; align-items: center; gap: 8px;
      flex-shrink: 0;
    }

    /* ── Status dot ────────────────────────────────────────── */
    .rmc-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .rmc-dot--draft   { background: var(--redaction-status-draft); }
    .rmc-dot--applied { background: var(--redaction-status-applied); }

    /* ── Delete button — hidden by default, appears on hover ─ */
    .rmc-del {
      display: none;
      width: 24px; height: 24px;
      padding: 0; border: none; background: transparent;
      cursor: pointer;
      border-radius: var(--radius-sm, 4px);
      flex-shrink: 0;
      align-items: center; justify-content: center;
      color: var(--color-text-secondary, #5F616A);
      transition: color 0.12s;
    }
    .rmc-del:hover { color: var(--color-text-primary, #1F2129); background: none; }
    /* Show on hover of the respective container */
    .rmc:not(.rmc--group):hover .rmc-del { display: flex; }
    .rmc-group-head:hover .rmc-del       { display: flex; }
    .rmc-page-row:hover .rmc-del         { display: flex; }

    /* ── Group card container ──────────────────────────────── */
    .rmc--group {
      flex-direction: column; align-items: stretch;
      padding: 0; gap: 0; min-height: 0;
      overflow: hidden; cursor: default;
      /* Default: white bg, grey border — same as single card */
    }

    /* Selected group: colored border based on status */
    .rmc--group.rmc--group-selected.rmc--group-draft   { border-color: var(--redaction-selected-border); }
    .rmc--group.rmc--group-selected.rmc--group-applied { border-color: var(--color-interactive-primary); }

    /* ── Group header ──────────────────────────────────────── */
    .rmc-group-head {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      cursor: pointer; user-select: none;
      background: white; /* Default: white */
    }
    .rmc-group-head:hover { background: var(--color-stone-100, #FAFAFA); }

    /* Selected group header: colored bg */
    .rmc--group-selected.rmc--group-draft   .rmc-group-head { background: var(--redaction-selected-bg); }
    .rmc--group-selected.rmc--group-applied .rmc-group-head { background: var(--color-status-stable-bg); }
    .rmc--group-selected .rmc-group-head:hover { filter: brightness(0.97); }

    /* ── Group meta (count + chevron) ─────────────────────── */
    .rmc-meta { display: flex; align-items: center; gap: 4px; }
    .rmc-count {
      font-family: 'Open Sans', sans-serif;
      font-size: 12px;
      color: var(--color-text-secondary, #5F616A);
      line-height: 16px;
    }
    .rmc-chevron {
      width: 12px; height: 12px; flex-shrink: 0;
      transition: transform 0.18s;
      color: var(--color-text-secondary, #5F616A);
    }
    .rmc-chevron--open { transform: rotate(180deg); }

    /* ── Page rows ─────────────────────────────────────────── */
    /* Divider between header and pages — grey by default */
    /* max 8 rows × 40px = 320px, scroll inside when more */
    .rmc-pages {
      border-top: 1px solid var(--color-divider, #DEE0EB);
      max-height: 320px;
      overflow-y: auto;
    }
    /* Colored divider when group is selected */
    .rmc--group-selected.rmc--group-draft   .rmc-pages { border-top-color: var(--redaction-selected-border); }
    .rmc--group-selected.rmc--group-applied .rmc-pages { border-top-color: var(--color-interactive-primary); }

    .rmc-page-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; height: 40px;
      cursor: pointer; box-sizing: border-box;
      background: white;
      /* color prop controls vertical bar indicator via fill=currentColor */
      color: var(--color-selection-bg);
      transition: background 0.1s;
    }
    .rmc-page-row:hover:not(.rmc-page-row--selected) {
      background: var(--color-bg-surface);
      color: var(--color-selection-bg);
    }

    /* Selected page row — bg matches group header; bar color per group status */
    .rmc--group-draft   .rmc-page-row--selected { background: var(--redaction-selected-bg); color: var(--redaction-draft-bar); }
    .rmc--group-applied .rmc-page-row--selected { background: var(--color-status-stable-bg); color: var(--redaction-applied-bar); }

    .rmc-page-bar { width: 16px; height: 16px; flex-shrink: 0; }

    .rmc-page-name {
      flex: 1;
      font-family: 'Open Sans', sans-serif;
      font-size: 14px;
      color: var(--color-text-primary, #1F2129);
      line-height: 20px;
    }
  `]
})
export class RedactionMarkCardComponent {
  // ── Common inputs ───────────────────────────────────────────────────────────
  @Input() type: RedactionMarkType = 'personal-name';
  @Input() title = '';
  @Input() status: RedactionMarkStatus = 'draft';
  @Input() selected = false;
  @Input() hovered = false;
  @Input() deletable = true;

  // ── Single card extras ──────────────────────────────────────────────────────
  @Input() pageLabel = '';
  /** groupedBy='page' → subtitle shows type label; 'category' → shows pageLabel */
  @Input() groupedBy: RedactionMarkGroupBy = 'page';

  // ── Group card mode ─────────────────────────────────────────────────────────
  /** Non-empty array activates group card mode */
  @Input() pages: RedactionMarkPage[] = [];
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  // ── Events ──────────────────────────────────────────────────────────────────
  @Output() clicked     = new EventEmitter<void>();
  @Output() deleted     = new EventEmitter<void>();
  @Output() pageClicked = new EventEmitter<string>(); // emits page.id
  @Output() pageDeleted = new EventEmitter<string>(); // emits page.id

  private sanitizer = inject(DomSanitizer);

  // ── Computed ────────────────────────────────────────────────────────────────
  get isGroup(): boolean { return this.pages.length > 0; }

  /** True when at least one page inside the group is selected */
  get isGroupSelected(): boolean { return this.pages.some(p => p.selected); }

  get groupStatus(): RedactionMarkStatus {
    return this.pages.some(p => p.status === 'draft') ? 'draft' : 'applied';
  }

  get meta() { return TYPE_META[this.type] ?? TYPE_META['personal-name']; }

  get typeIcon(): string { return this.meta.icon; }

  get safeIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.meta.icon);
  }

  get displayTitle(): string { return this.title || this.meta.label; }

  get displaySubtitle(): string {
    if (this.groupedBy === 'category') return this.pageLabel || '';
    return this.meta.label;
  }

  onToggleExpanded(): void {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
    // Only notify parent to select first mark when EXPANDING, not collapsing
    if (this.expanded) {
      this.clicked.emit();
    }
  }

  onPageClick(id: string): void {
    this.pageClicked.emit(id);
  }

  onDeleteGroup(event: MouseEvent): void {
    event.stopPropagation();
    this.deleted.emit();
  }

  onDeletePage(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.pageDeleted.emit(id);
  }

  trackByPageId(_: number, page: RedactionMarkPage): string {
    return page.id;
  }
}
