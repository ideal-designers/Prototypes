import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type {
  SidebarNavItem, HeaderAction, BreadcrumbItem, SegmentItem, TabItem, DropdownOption, ChipVariant, FvdrFileType,
} from '../../shared/ds';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import { REQS, DOCS, FOLDER_TREE, Req, ReqCls, MatchState, DocInfo, FolderNode } from './checklist-matching.data';

type Phase = 'empty' | 'uploading' | 'none' | 'reading' | 'structure' | 'matching' | 'results';
type Screen = 'upload' | 'source' | 'structure' | 'matching' | 'triage' | 'gaps' | 'returning';
type Filter = 'all' | 'review' | 'gap' | 'covered' | 'other';
type Layout = 'table' | 'list' | 'folders';
type ChangeKind = 'reopened' | 'closed' | 'suggested';
type Tone = 'default' | 'muted' | 'warn' | 'error' | 'success';

interface Rec {
  s: MatchState | ReqCls;
  docs?: string[];
  why?: string;
  missing?: string;
  change?: { kind: ChangeKind; reason: string };
  reopened?: boolean;
  rejected?: boolean;
  requested?: boolean;
  isNew?: boolean;
  prev?: Rec;
  reading?: string;
}

interface DocChip { name: string; label: string; path: string; type: FvdrFileType; isFolder: boolean; }
interface Pill { label: string; variant: ChipVariant; pulse?: boolean; }

interface RowVm {
  id: string; label: string; row: number; text: string; pill: Pill;
  chips: DocChip[]; allCount: number; hasMore: boolean; expanded: boolean; moreLabel: string;
  prefix: string; note: string; noteTone: Tone;
  next: string; nextTone: Tone; action: string; actionHint: string;
  flagOpen: boolean; isEditing: boolean; canEdit: boolean; isEdited: boolean;
  tag: { label: string; variant: ChipVariant } | null; reason: string; reasonTone: Tone;
  selected: boolean; muted: boolean; changeOrder: number; noFilesText: string;
}
interface GroupVm { id: string; label: string; name: string; meta: string; items: RowVm[]; hasSrc: boolean; row: number; pct: number; hasBar: boolean; }

interface SrcRow { n: number; kind: 'header' | 'section' | 'item' | 'meta' | 'blank'; b?: string; c: string; d?: string; e?: string; f?: string; g?: string; h?: string; }

interface FolderRowVm {
  key: string; isFolder: boolean; name: string; meta: string; depth: number; expanded: boolean; related: boolean;
  linkedHere: boolean; unused: boolean; picked: boolean; tint: string; type: FvdrFileType;
  chips: { id: string; variant: ChipVariant }[]; moreChips: number; folderId?: string; fileName?: string;
}

const SECTIONS = [
  { id: 'A', name: 'General information', src: 'General Information:', row: 3 },
  { id: 'B', name: 'Financial and accounting', src: 'Financial and Accounting:', row: 8 },
  { id: 'C', name: 'Legal', src: 'Legal:', row: 21 },
  { id: 'D', name: 'Human resources', src: 'Human Resources:', row: 27 },
  { id: 'E', name: 'Tax', src: 'Tax:', row: 32 },
  { id: 'F', name: 'Operations', src: 'Operations:', row: 36 },
];

const PILLS: Record<string, Pill> = {
  pending: { label: 'Document request', variant: 'blue' },
  document_request: { label: 'Document request', variant: 'blue' },
  question: { label: 'Question', variant: 'purple' },
  instruction: { label: 'Instruction', variant: 'grey' },
  note: { label: 'Note', variant: 'grey' },
  searching: { label: 'Searching', variant: 'default', pulse: true },
  found: { label: 'Found', variant: 'indigo' },
  covered: { label: 'Covered', variant: 'green' },
  partial: { label: 'Partial', variant: 'teal' },
  review: { label: 'To review', variant: 'yellow' },
  gap: { label: 'Gap', variant: 'danger' },
  na: { label: 'Not applicable', variant: 'grey' },
};

const CHANGE_VARIANT: Record<ChangeKind, ChipVariant> = { reopened: 'danger', closed: 'green', suggested: 'yellow' };
const CHANGE_TONE: Record<ChangeKind, Tone> = { reopened: 'error', closed: 'success', suggested: 'warn' };
const FOLDER_CHIP: Record<string, ChipVariant> = { linked: 'green', partial: 'teal', suggested: 'yellow', closest: 'grey' };
const LATER_FILES = ['Supplier spend FY2025.xlsx', 'Sales by product line YTD 2026.xlsx', 'Equipment lease schedule 2026.xlsx', 'AP aging report Oct 2026.xlsx', 'Business licenses and permits 2026.pdf'];
const TOTAL_DOCS = 1482;

/**
 * Due diligence checklist — AI matching.
 * Upload an Excel checklist → AI extracts requests → user checks the reading →
 * match against the room → triage suggestions, gaps and folders → returning-user deltas.
 */
@Component({
  selector: 'fvdr-checklist-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent],
  template: `
  <div class="page">
    <fvdr-sidebar-nav variant="vdr" accountName="Diamond" [items]="nav" [(collapsed)]="sidebarCollapsed" />

    <div class="main">
      <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="VO" />

      <div class="content" #content>

        <!-- ═══ Upload ═══ -->
        <section class="upload" *ngIf="phase === 'empty' || phase === 'uploading'" aria-label="Upload checklist">
          <div class="drop" *ngIf="phase === 'empty'">
            <span class="drop__icon"><fvdr-icon name="upload" /></span>
            <h2 class="drop__title">Upload your due diligence checklist</h2>
            <p class="drop__text">Drag an Excel file here or choose one from your computer. You'll be able to view and edit it here and share it with groups.</p>
            <div class="consent" *ngIf="roomAiOn">
              <fvdr-checkbox [checked]="aiConsent" (checkedChange)="aiConsent = $event" label="Extract requests with AI after upload" />
              <p class="consent__hint">AI features are on for this room, turned on by a project admin. Only this checklist's text is processed. No documents are matched until you start matching yourself.</p>
            </div>
            <div class="consent consent--off" *ngIf="!roomAiOn">
              <fvdr-icon name="info" />
              <p class="consent__hint">AI features are off for this room. The checklist works as usual; a project admin can turn on AI in Settings.</p>
            </div>
            <fvdr-btn label="Choose file" iconName="upload" (clicked)="upload()" />
            <span class="drop__caption">Excel files (.xlsx)</span>
          </div>

          <div class="drop drop--uploading" *ngIf="phase === 'uploading'">
            <div class="up-file">
              <fvdr-file-icon type="xls" />
              <div class="up-file__body">
                <span class="up-file__name">Diamond – Due diligence checklist.xlsx</span>
                <span class="up-file__meta">84 KB · 2 sheets · uploading {{ upPct }}%</span>
                <div class="bar"><div class="bar__fill" [style.width.%]="upPct"></div></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Checklist ═══ -->
        <ng-container *ngIf="hasChecklist">
          <div class="tabs-row">
            <fvdr-tabs [tabs]="tabs" activeId="checklist" />
            <fvdr-btn variant="ghost" size="s" iconName="plus" [iconOnly]="true" ariaLabel="Add checklist" />
          </div>

          <div class="toolbar">
            <fvdr-segment [items]="viewItems" [activeId]="view" (activeIdChange)="setView($event)" />
            <span class="spacer"></span>
            <div class="toolbar__actions" *ngIf="view === 'source'">
              <fvdr-btn label="Edit" iconName="edit" size="m" />
              <fvdr-btn label="Upload new version" variant="secondary" size="m" />
              <fvdr-btn label="Download" iconName="download" variant="secondary" size="m" />
              <fvdr-btn label="Delete" variant="danger-secondary" size="m" />
              <fvdr-btn label="Share" variant="secondary" size="m" />
            </div>
            <div class="export" *ngIf="view === 'requests' && phase === 'results'">
              <fvdr-btn label="Export" iconName="download" variant="secondary" size="m" (clicked)="exportOpen = !exportOpen" />
              <div class="menu" *ngIf="exportOpen" role="menu">
                <button class="menu__item" role="menuitem" (click)="doExport('gap')">
                  <span class="menu__title">Gap report (.xlsx)</span>
                  <span class="menu__sub">Gaps and partial requests with their original wording, source rows and what's missing.</span>
                </button>
                <button class="menu__item" role="menuitem" (click)="doExport('full')">
                  <span class="menu__title">Master Checklist with results (.xlsx)</span>
                  <span class="menu__sub">A new copy of your file with Status, Documents and Missing columns added. The file in the room stays unchanged.</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ─── Source file ─── -->
          <ng-container *ngIf="view === 'source'">
            <div class="notice notice--ai" *ngIf="phase === 'none' && highlightRow === null && roomAiOn">
              <span class="ai-mark"><fvdr-icon name="sparkle" /></span>
              <div class="notice__body">
                <span class="notice__title">Turn this checklist into requests</span>
                <span class="notice__text">AI reads the whole file and lists every request, linked to its row. You check the list, then match it against documents in the room. Your file isn't changed.</span>
              </div>
              <fvdr-btn label="Extract requests" (clicked)="extract('source')" />
            </div>
            <div class="notice" *ngIf="phase === 'none' && highlightRow === null && !roomAiOn">
              <fvdr-icon name="info" class="notice__icon" />
              <div class="notice__body">
                <span class="notice__title">AI features are off for this room</span>
                <span class="notice__text">The checklist works as usual. To extract requests and match documents, a project admin needs to turn on AI features in Settings.</span>
              </div>
              <fvdr-btn label="Open AI settings" variant="secondary" (clicked)="toast('Opens AI settings for this project. Only project admins can change them.')" />
            </div>
            <div class="notice notice--ai" *ngIf="phase === 'reading' && highlightRow === null">
              <span class="ai-mark ai-mark--busy"><fvdr-icon name="sparkle" /></span>
              <div class="notice__body">
                <span class="notice__title">AI is reading this checklist</span>
                <span class="notice__text">{{ readSheet }} · row {{ readRowInSheet }} of 43. You can keep working, nothing is matched yet.</span>
                <div class="bar"><div class="bar__fill" [style.width.%]="readPct"></div></div>
              </div>
            </div>
            <div class="notice notice--ai" *ngIf="phase === 'structure' && highlightRow === null">
              <span class="ai-mark"><fvdr-icon name="sparkle" /></span>
              <div class="notice__body">
                <span class="notice__title">{{ foundLine }}</span>
                <span class="notice__text">Check what AI read, then match the document requests against the {{ totalDocs }} documents in Diamond.</span>
              </div>
              <fvdr-btn label="Review requests" (clicked)="setView('requests')" />
            </div>
            <div class="notice" *ngIf="(phase === 'matching' || phase === 'results') && highlightRow === null">
              <fvdr-icon name="info" class="notice__icon" />
              <span class="notice__text notice__text--grow">{{ srcInfoText }}</span>
              <fvdr-btn label="Open requests" variant="secondary" size="s" (clicked)="setView('requests')" />
            </div>
            <div class="notice notice--hl" *ngIf="highlightRow !== null">
              <fvdr-icon name="link" class="notice__icon" />
              <span class="notice__text notice__text--grow">{{ hlText }}</span>
              <fvdr-btn label="Back to request" variant="secondary" size="s" iconName="chevron-left" (clicked)="backToRequest()" />
            </div>

            <div class="sheet">
              <div class="sheet__formula">
                <span class="sheet__ref">{{ highlightRow !== null ? 'C' + highlightRow : 'A1' }}</span>
                <span class="sheet__val">{{ hlCell }}</span>
              </div>
              <div class="sheet__scroll">
                <div class="sheet__grid">
                  <div class="sr sr--cols">
                    <span class="sc sc--n"></span>
                    <span class="sc" *ngFor="let c of sheetCols">{{ c }}</span>
                  </div>
                  <ng-container *ngFor="let r of sourceRows">
                    <div class="sr sr--section" *ngIf="r.kind === 'section'" [class.sr--hl]="highlightRow === r.n">
                      <span class="sc sc--n">{{ r.n }}</span>
                      <span class="sc sc--span">{{ r.c }}</span>
                    </div>
                    <div class="sr" *ngIf="r.kind !== 'section'" [class.sr--head]="r.kind === 'header'" [class.sr--hl]="highlightRow === r.n">
                      <span class="sc sc--n">{{ r.n }}</span>
                      <span class="sc"></span>
                      <span class="sc sc--num">{{ r.b }}</span>
                      <span class="sc sc--text">{{ r.c }}</span>
                      <span class="sc sc--sel">{{ r.d }}<fvdr-icon *ngIf="r.kind === 'item'" name="chevron-down" /></span>
                      <span class="sc">{{ r.e }}</span>
                      <span class="sc sc--sel">{{ r.f }}<fvdr-icon *ngIf="r.kind === 'item'" name="chevron-down" /></span>
                      <span class="sc">{{ r.g }}</span>
                      <span class="sc sc--right">{{ r.h }}</span>
                    </div>
                  </ng-container>
                </div>
              </div>
              <div class="sheet__tabs">
                <span class="sheet__tab sheet__tab--on">Master Checklist</span>
                <span class="sheet__tab">Working copy of the Master Checklist</span>
                <span class="spacer"></span>
                <span class="sheet__zoom">100%</span>
              </div>
            </div>
          </ng-container>

          <!-- ─── Requests ─── -->
          <ng-container *ngIf="view === 'requests'">

            <section class="delta" *ngIf="phase === 'results' && delta" aria-label="Changes since your last visit">
              <span class="delta__title"><fvdr-icon name="history" />Since your visit on Oct 2</span>
              <div class="delta__chips">
                <fvdr-chip *ngFor="let c of changeChips" [label]="c.label" [variant]="c.variant" size="m" [rounded]="true"
                           [clickable]="true" [selected]="changeFilter === c.kind" (clicked)="pickChange(c.kind)" />
                <fvdr-btn *ngIf="changeFilter" label="Back to all requests" variant="link" size="s" (clicked)="changeFilter = null; recompute()" />
                <fvdr-btn *ngIf="!changeFilter" [label]="'Show all ' + changeTotal + ' changes'" variant="link" size="s" (clicked)="pickChange('all')" />
              </div>
              <span class="spacer"></span>
              <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Dismiss changes summary" (clicked)="delta = false; changeFilter = null; recompute()" />
            </section>

            <div class="notice notice--warn" *ngIf="phase === 'results' && stale">
              <fvdr-icon name="warning" class="notice__icon" />
              <span class="notice__text notice__text--grow"><b>The source file was edited after the requests were extracted.</b> 1 request added, 1 changed.</span>
              <fvdr-btn label="Review changes" variant="secondary" size="s" (clicked)="openDiff()" />
            </div>

            <div class="empty" *ngIf="phase === 'none'">
              <span class="ai-mark ai-mark--lg"><fvdr-icon name="sparkle" /></span>
              <h2 class="empty__title">Turn this checklist into requests</h2>
              <p class="empty__text">AI reads the whole file, sorts every item into sections, document requests, questions, instructions and notes, then finds documents for the document requests. Your file isn't changed.</p>
              <fvdr-btn *ngIf="roomAiOn" label="Extract requests" (clicked)="extract()" />
              <div class="notice" *ngIf="!roomAiOn">
                <fvdr-icon name="info" class="notice__icon" />
                <span class="notice__text">AI features are off for this room. A project admin can turn them on in Settings.</span>
                <fvdr-btn label="Open AI settings" variant="secondary" size="s" (clicked)="toast('Opens AI settings for this project. Only project admins can change them.')" />
              </div>
            </div>

            <div class="empty" *ngIf="phase === 'reading'">
              <span class="ai-mark ai-mark--lg ai-mark--busy"><fvdr-icon name="sparkle" /></span>
              <h2 class="empty__title">Reading the whole checklist file</h2>
              <p class="empty__text">{{ readSheet }} · row {{ readRowInSheet }} of 43</p>
              <div class="bar bar--wide"><div class="bar__fill" [style.width.%]="readPct"></div></div>
            </div>

            <!-- Structure check -->
            <section class="summary" *ngIf="phase === 'structure'" aria-label="Extraction summary">
              <div class="summary__main">
                <span class="kicker"><fvdr-icon name="sparkle" />Extracted from the whole file</span>
                <h2 class="summary__title">Check what was read</h2>
                <div class="summary__chips">
                  <fvdr-chip [label]="typeChips.doc" variant="blue" size="s" [rounded]="true" />
                  <fvdr-chip [label]="typeChips.q" variant="purple" size="s" [rounded]="true" />
                  <fvdr-chip [label]="typeChips.i" variant="grey" size="s" [rounded]="true" />
                  <fvdr-chip [label]="typeChips.n" variant="grey" size="s" [rounded]="true" />
                  <fvdr-chip label="6 sections" size="s" [rounded]="true" />
                  <fvdr-chip *ngIf="!flagResolved" label="1 row to confirm below" variant="yellow" size="s" [rounded]="true" />
                </div>
              </div>
              <div class="summary__side">
                <fvdr-dropdown label="Match against" [options]="scopeOptions" [value]="scope" (valueChange)="scope = asString($event)" />
                <fvdr-btn [label]="'Match ' + typeChips.docCount + ' document requests'" size="l" (clicked)="startMatching()" />
                <span class="summary__hint">AI compares the requests with the documents in this scope. The source file stays unchanged.</span>
              </div>
            </section>

            <!-- Matching -->
            <section class="summary" *ngIf="phase === 'matching'" aria-label="Matching progress">
              <div class="summary__main">
                <span class="kicker"><fvdr-icon name="sparkle" />Matching in progress</span>
                <div class="summary__line"><span class="summary__title">{{ docsRead }} of 1,482 documents read</span><span class="summary__hint">Gaps are confirmed once every document has been read.</span></div>
                <div class="bar bar--wide"><div class="bar__fill" [style.width.%]="progress * 100"></div></div>
              </div>
              <div class="stats">
                <div class="stat"><span class="stat__label">Found</span><span class="stat__val stat__val--info">{{ counts['found'] || 0 }}</span></div>
                <div class="stat"><span class="stat__label">Still searching</span><span class="stat__val">{{ counts['searching'] || 0 }}</span></div>
                <fvdr-btn label="Notify me when it's done" variant="secondary" iconName="bell" (clicked)="toast('Done. We\\'ll email you when matching finishes.')" />
              </div>
            </section>

            <!-- Results summary -->
            <section class="summary summary--results" *ngIf="phase === 'results'" aria-label="Coverage summary">
              <div class="cov">
                <div class="cov__line"><span class="cov__pct">{{ pct }}%</span><span class="cov__of">of {{ matchable }} document requests covered</span></div>
                <span class="summary__hint">Matched against 1,482 documents · Oct 5, 22:41</span>
              </div>
              <div class="stats">
                <div class="stat"><span class="stat__label">Covered</span><span class="stat__val stat__val--success">{{ counts['covered'] || 0 }}</span></div>
                <div class="stat"><span class="stat__label">Partial</span><span class="stat__val stat__val--teal">{{ counts['partial'] || 0 }}</span></div>
                <div class="stat"><span class="stat__label">To review</span><span class="stat__val stat__val--warn">{{ counts['review'] || 0 }}</span></div>
                <div class="stat"><span class="stat__label">Gaps</span><span class="stat__val stat__val--error">{{ counts['gap'] || 0 }}</span></div>
              </div>
              <span class="spacer"></span>
              <fvdr-btn *ngIf="(counts['review'] || 0) > 0" [label]="'Review ' + counts['review'] + ' suggestions'" size="l" (clicked)="startReview()" />
              <fvdr-btn *ngIf="!(counts['review'] || 0)" [label]="'View ' + (counts['gap'] || 0) + ' gaps'" size="l" variant="secondary" (clicked)="showGaps()" />
            </section>

            <!-- Workspace -->
            <div class="ws" *ngIf="phase === 'structure' || phase === 'matching' || phase === 'results'">
              <div class="ws__bar" *ngIf="phase === 'results'">
                <div class="filters" role="group" aria-label="Filter requests">
                  <fvdr-chip *ngFor="let f of filters" [label]="f.label" [counter]="f.count" size="l" [rounded]="true"
                             [clickable]="true" [selected]="f.active" (clicked)="pickFilter(f.id)" />
                </div>
                <span class="spacer"></span>
                <fvdr-segment variant="table" size="sm" [items]="layoutItems" [activeId]="layout" (activeIdChange)="pickLayout($event)" />
              </div>

              <div class="ws__body">
                <!-- Folders layout -->
                <div class="folders" *ngIf="phase === 'results' && layout === 'folders'">
                  <div class="folders__reqs">
                    <div class="folders__head"><span class="h-sec">Document requests</span><span class="muted">{{ fv.coveredLabel }}</span></div>
                    <div *ngFor="let g of fv.groups" class="fgroup">
                      <div class="fgroup__name">{{ g.id }} · {{ g.name }}</div>
                      <button *ngFor="let it of g.items" class="freq" [class.freq--sel]="it.isSel" [class.freq--hit]="it.hit" (click)="pickFolderReq(it.id)">
                        <span class="dot" [ngClass]="'dot--' + it.state"></span>
                        <span class="freq__id">{{ it.id }}</span>
                        <span class="freq__text">{{ it.text }}</span>
                        <span class="freq__count" [class.freq__count--gap]="it.state === 'gap'">{{ it.countLabel }}</span>
                      </button>
                    </div>
                  </div>
                  <div class="folders__tree">
                    <div class="fhead">
                      <div class="fhead__text">
                        <span class="kicker kicker--plain">{{ fv.kicker }}</span>
                        <span class="fhead__title">{{ fv.title }}</span>
                        <span class="muted">{{ fv.sub }}</span>
                      </div>
                      <fvdr-btn *ngIf="fv.hasReq" label="Open in table" variant="secondary" size="s" (clicked)="openFolderReqInTable()" />
                      <fvdr-checkbox [checked]="fHideUnused" (checkedChange)="fHideUnused = $event; recompute()" label="Hide folders this checklist doesn't use" />
                    </div>
                    <div class="legend">
                      <span class="legend__item"><span class="sw sw--linked"></span>Linked</span>
                      <span class="legend__item"><span class="sw sw--partial"></span>Partial</span>
                      <span class="legend__item"><span class="sw sw--suggested"></span>Suggested, to review</span>
                      <span class="legend__item"><span class="sw sw--closest"></span>Closest, below threshold</span>
                      <span class="spacer"></span>
                      <span class="muted">Click a file to see every request it answers</span>
                    </div>
                    <div class="ftree">
                      <div *ngFor="let r of fv.rows; trackBy: byKey" class="frow" [ngClass]="'frow--' + r.tint"
                           [class.frow--picked]="r.picked" [class.frow--unused]="r.unused" [style.padding-left]="'calc(var(--space-3) + ' + r.depth + ' * var(--space-5))'"
                           (click)="r.isFolder ? toggleFolder(r.folderId!, r.expanded) : pickFolderFile(r.fileName!)">
                        <fvdr-icon *ngIf="r.isFolder" name="chevron-right" class="frow__chev" [class.frow__chev--open]="r.expanded" />
                        <fvdr-file-icon [type]="r.type" />
                        <span class="frow__name">{{ r.name }}</span>
                        <span class="frow__meta" *ngIf="r.meta">{{ r.meta }}</span>
                        <span class="spacer"></span>
                        <span class="muted" *ngIf="r.unused && r.isFolder">Not used by this checklist</span>
                        <fvdr-chip *ngFor="let c of r.chips" [label]="c.id" [variant]="c.variant" size="xs" [clickable]="true" (clicked)="pickFolderReq(c.id)" />
                        <span class="muted" *ngIf="r.moreChips > 0">+{{ r.moreChips }}</span>
                        <fvdr-btn *ngIf="!r.isFolder" variant="ghost" size="s" iconName="link" [iconOnly]="true" ariaLabel="Open in document viewer"
                                  (clicked)="toast('Opening ' + r.name + ' in the document viewer, in a new tab')" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Table layout -->
                <div class="tbl-wrap" *ngIf="phase === 'results' && layout === 'table'">
                  <div class="tbl" role="table" aria-label="Requests and matched documents" [class.tbl--narrow]="showPanel">
                    <div class="tr tr--head" role="row">
                      <span role="columnheader">Status</span>
                      <span role="columnheader" fvdrTooltip="Item numbers come from your file. The letter stands for the section.">#</span>
                      <span role="columnheader">Request, as written in the source</span>
                      <span role="columnheader">Documents</span>
                      <span role="columnheader" *ngIf="!showPanel">Missing or next step</span>
                      <span role="columnheader">Source</span>
                    </div>
                    <div *ngIf="!groups.length" class="tbl-empty">Nothing here. Try another filter.</div>
                    <ng-container *ngFor="let g of groups; trackBy: byId">
                      <div class="tr tr--group" role="row">
                        <span class="g-label">{{ g.label }}</span>
                        <span class="g-name">{{ g.name }}</span>
                        <span class="spacer"></span>
                        <span class="muted">{{ g.meta }}</span>
                        <div class="mini-bar" *ngIf="g.hasBar"><div class="mini-bar__fill" [style.width.%]="g.pct"></div></div>
                      </div>
                      <div *ngFor="let it of g.items; trackBy: byId" class="tr tr--item" role="row" [class.tr--sel]="it.selected" (click)="select(it.id)">
                        <span role="cell"><fvdr-chip [label]="it.pill.label" [variant]="it.pill.variant" size="s" [class.pulse]="it.pill.pulse" /></span>
                        <div role="cell" class="c-id"><span>{{ it.label }}</span><fvdr-chip *ngIf="it.tag" [label]="it.tag.label" [variant]="it.tag.variant" size="xs" /></div>
                        <div role="cell" class="c-text">
                          <span [class.t-muted]="it.muted">{{ it.text }}</span>
                          <span *ngIf="it.reason" class="t-note" [ngClass]="'tone--' + it.reasonTone">{{ it.reason }}</span>
                        </div>
                        <div role="cell" class="c-docs">
                          <span *ngIf="it.prefix" class="t-prefix">{{ it.prefix }}</span>
                          <div class="doc-list" *ngIf="it.chips.length">
                            <div class="doc" *ngFor="let c of it.chips" [fvdrTooltip]="c.label + ' · ' + c.path">
                              <fvdr-file-icon [type]="c.type" />
                              <span class="doc__name">{{ c.label }}</span>
                              <fvdr-btn variant="ghost" size="s" iconName="link" [iconOnly]="true" [ariaLabel]="c.isFolder ? 'Open folder' : 'Open file'" (clicked)="openPreview(c.name); $event.stopPropagation()" />
                              <fvdr-btn variant="ghost" size="s" iconName="folder" [iconOnly]="true" ariaLabel="Open folder in Documents" (clicked)="openFolder(c.name); $event.stopPropagation()" />
                            </div>
                          </div>
                          <button class="more" *ngIf="it.hasMore" (click)="toggleMore(it.id); $event.stopPropagation()">{{ it.moreLabel }}</button>
                          <span *ngIf="!it.chips.length" class="t-dash">{{ it.noFilesText }}</span>
                          <span *ngIf="showPanel && it.next !== '—'" class="t-note" [ngClass]="'tone--' + it.nextTone">{{ it.next }}</span>
                        </div>
                        <div role="cell" class="c-next" *ngIf="!showPanel">
                          <span class="t-note" [ngClass]="'tone--' + it.nextTone">{{ it.next }}</span>
                          <fvdr-btn *ngIf="it.action" [label]="it.action" variant="secondary" size="s" [fvdrTooltip]="it.actionHint" (clicked)="rowAction(it); $event.stopPropagation()" />
                        </div>
                        <div role="cell" class="c-src">
                          <button class="src-link" (click)="openSrc(it.row, it.id); $event.stopPropagation()" [fvdrTooltip]="'Open row ' + it.row + ' in the source file'">R{{ it.row }}</button>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                </div>

                <!-- List layout (structure, matching, results-list) -->
                <div class="tbl-wrap" *ngIf="phase !== 'results' || layout === 'list'">
                  <div class="tbl tbl--list" role="table" aria-label="Requests">
                    <div class="tr tr--head" role="row">
                      <span role="columnheader">{{ phase === 'structure' ? 'Type' : 'Status' }}</span>
                      <span role="columnheader">#</span>
                      <span role="columnheader">Request, as written in the source file</span>
                      <span role="columnheader" class="c-right">Source file</span>
                    </div>
                    <div *ngIf="!groups.length" class="tbl-empty">Nothing here. Try another filter.</div>
                    <ng-container *ngFor="let g of groups; trackBy: byId">
                      <div class="tr tr--group" role="row">
                        <span class="g-label">{{ g.label }}</span>
                        <span class="g-name">{{ g.name }}</span>
                        <span class="spacer"></span>
                        <button class="src-link src-link--sec" *ngIf="g.hasSrc" (click)="openSrc(g.row, 'section ' + g.id)">Section · Row {{ g.row }}</button>
                        <span class="muted">{{ g.meta }}</span>
                        <div class="mini-bar" *ngIf="g.hasBar"><div class="mini-bar__fill" [style.width.%]="g.pct"></div></div>
                      </div>
                      <div *ngFor="let it of g.items; trackBy: byId" class="tr tr--item" role="row"
                           [class.tr--flag]="it.flagOpen" [class.tr--sel]="it.selected" [class.tr--editing]="it.isEditing" (click)="select(it.id)">
                        <span role="cell"><fvdr-chip [label]="it.pill.label" [variant]="it.pill.variant" size="s" [class.pulse]="it.pill.pulse" /></span>
                        <div role="cell" class="c-id"><span>{{ it.label }}</span><fvdr-chip *ngIf="it.tag" [label]="it.tag.label" [variant]="it.tag.variant" size="xs" /></div>
                        <div role="cell" class="c-text">
                          <ng-container *ngIf="!it.isEditing">
                            <span [class.t-muted]="it.muted">{{ it.text }}</span>
                            <span *ngIf="it.reason" class="t-note" [ngClass]="'tone--' + it.reasonTone">{{ it.reason }}</span>
                            <span *ngIf="it.note" class="t-note" [ngClass]="'tone--' + it.noteTone">{{ it.note }}</span>
                            <div class="row-actions" *ngIf="it.flagOpen">
                              <fvdr-btn label="Keep this reading" variant="secondary" size="s" (clicked)="keepFlag()" />
                              <fvdr-btn label="Edit text" variant="ghost" size="s" (clicked)="startRowEdit(it.id)" />
                            </div>
                            <span *ngIf="it.prefix" class="t-prefix">{{ it.prefix }}</span>
                            <div class="doc-list" *ngIf="it.chips.length">
                              <div class="doc" *ngFor="let c of it.chips">
                                <fvdr-file-icon [type]="c.type" />
                                <span class="doc__name">{{ c.label }}</span>
                                <span class="doc__path">{{ c.path }}</span>
                                <fvdr-btn variant="ghost" size="s" iconName="link" [iconOnly]="true" [ariaLabel]="c.isFolder ? 'Open folder' : 'Open file'" (clicked)="openPreview(c.name); $event.stopPropagation()" />
                                <fvdr-btn variant="ghost" size="s" iconName="folder" [iconOnly]="true" ariaLabel="Open folder in Documents" (clicked)="openFolder(c.name); $event.stopPropagation()" />
                              </div>
                            </div>
                            <button class="more" *ngIf="it.hasMore" (click)="toggleMore(it.id); $event.stopPropagation()">{{ it.moreLabel }}</button>
                          </ng-container>
                          <div class="row-edit" *ngIf="it.isEditing" (click)="$event.stopPropagation()">
                            <fvdr-textarea [(ngModel)]="editRowText" label="Request text" [rows]="3" />
                            <fvdr-dropdown label="Type" [options]="clsOptions" [value]="editCls" (valueChange)="editCls = $any(asString($event))" />
                            <span class="muted">{{ clsHint[editCls] }}</span>
                            <div class="row-actions">
                              <fvdr-btn label="Save" size="s" (clicked)="saveRowEdit()" />
                              <fvdr-btn label="Cancel" variant="ghost" size="s" (clicked)="editRowId = null; recompute()" />
                            </div>
                          </div>
                        </div>
                        <div role="cell" class="c-src c-right">
                          <fvdr-btn *ngIf="it.canEdit" variant="ghost" size="s" iconName="edit" [iconOnly]="true" ariaLabel="Edit request" (clicked)="startRowEdit(it.id); $event.stopPropagation()" />
                          <button class="src-link" (click)="openSrc(it.row, it.id); $event.stopPropagation()">Row {{ it.row }}</button>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                </div>

                <!-- Side panel -->
                <aside class="panel" *ngIf="showPanel" aria-label="Request details">
                  <ng-container *ngIf="panel === 'item' && sel as s">
                    <div class="panel__head">
                      <fvdr-chip [label]="s.pill.label" [variant]="s.pill.variant" size="s" />
                      <span class="panel__id">{{ s.label }}</span>
                      <span class="muted" *ngIf="s.queue">{{ s.queue }}</span>
                      <span class="spacer"></span>
                      <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close details" (clicked)="clearSel()" />
                    </div>
                    <h3 class="panel__title">{{ s.text }}</h3>
                    <div class="panel__src">
                      <span class="muted">{{ s.srcLine }}</span>
                      <fvdr-btn label="Open in source file" variant="link" size="s" (clicked)="openSrc(s.row, s.id)" />
                    </div>
                    <div class="kv" *ngIf="s.original !== s.text && s.hasOriginal"><span class="kv__k">Original row text</span><span>{{ s.original }}</span></div>

                    <!-- Review -->
                    <ng-container *ngIf="s.isReview">
                      <div class="p-block">
                        <span class="kv__k">Suggested document</span>
                        <div class="doc doc--lg">
                          <fvdr-file-icon [type]="fileType(s.docName)" />
                          <div class="doc__col">
                            <button class="doc__link" (click)="openPreview(s.docName)">{{ s.docName }}</button>
                            <button class="doc__pathlink" (click)="openFolder(s.docName)">{{ s.docPath }}</button>
                          </div>
                        </div>
                        <p class="p-text"><b>Document summary:</b> {{ s.summary }}</p>
                        <p class="p-text"><b>Why it was suggested:</b> {{ s.why }}</p>
                        <div class="p-verdict">
                          <fvdr-chip [label]="s.verdict" [variant]="s.verdict === 'Partial' ? 'teal' : 'green'" size="s" />
                          <span class="tone--warn" *ngIf="s.missing">Missing: {{ s.missing }}</span>
                        </div>
                        <div class="row-actions">
                          <fvdr-btn label="Open file" variant="secondary" size="s" iconName="link" (clicked)="openPreview(s.docName)" />
                          <fvdr-btn label="Open folder" variant="secondary" size="s" iconName="folder" (clicked)="openFolder(s.docName)" />
                        </div>
                      </div>
                      <div class="p-cta">
                        <fvdr-btn label="Accept" size="l" (clicked)="accept()" />
                        <fvdr-btn label="Reject" variant="secondary" size="l" (clicked)="reject()" />
                      </div>
                      <div class="p-nav">
                        <fvdr-btn label="Previous" variant="ghost" size="s" iconName="chevron-left" (clicked)="stepReview(-1)" />
                        <fvdr-btn label="Skip for now" variant="ghost" size="s" (clicked)="stepReview(1)" />
                      </div>
                    </ng-container>

                    <!-- Covered / partial -->
                    <ng-container *ngIf="s.isCovered">
                      <div class="p-block">
                        <div class="p-row"><span class="kv__k">Linked documents</span><span class="muted">{{ s.docs.length === 1 ? '1 linked' : s.docs.length + ' linked' }}</span></div>
                        <div class="linked" *ngFor="let d of s.docs">
                          <fvdr-file-icon [type]="d.type" />
                          <div class="doc__col">
                            <span class="doc__name">{{ d.label }}</span>
                            <span class="muted">{{ d.meta }}</span>
                          </div>
                          <fvdr-btn *ngIf="!d.isFolder" variant="ghost" size="s" iconName="link" [iconOnly]="true" ariaLabel="Open file" (clicked)="openPreview(d.name)" />
                          <fvdr-btn variant="ghost" size="s" iconName="folder" [iconOnly]="true" ariaLabel="Open folder" (clicked)="openFolder(d.name)" />
                          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Unlink" (clicked)="unlink(d.name)" />
                        </div>
                        <fvdr-btn label="Link another document" variant="link" size="s" iconName="plus" (clicked)="toast('A document picker opens here to link any file or folder from the room')" />
                        <p class="p-text"><b>Why:</b> {{ s.coverWhy }}</p>
                        <ng-container *ngIf="s.isPartial">
                          <p class="p-text tone--warn"><b>Still missing:</b> {{ s.partialMissing }}. This stays in the gap report as partially covered.</p>
                          <fvdr-btn *ngIf="!s.requested" [label]="isBidder ? 'Ask about the missing part in Q&A' : 'Request the missing part'" variant="secondary" size="s" (clicked)="askSeller()" />
                          <span *ngIf="s.requested" class="muted">{{ reqDoneText }}</span>
                        </ng-container>
                      </div>
                    </ng-container>

                    <!-- Gap -->
                    <ng-container *ngIf="s.isGap">
                      <div class="p-gap">
                        <span class="p-gap__title"><fvdr-icon name="error" />{{ s.gapTitle }}</span>
                        <span>{{ s.gapText }}</span>
                      </div>
                      <div class="p-block" *ngIf="s.hasNear">
                        <span class="kv__k">Closest document, below the match threshold</span>
                        <div class="doc doc--lg">
                          <fvdr-file-icon [type]="fileType(s.nearName)" />
                          <div class="doc__col">
                            <button class="doc__link" (click)="openPreview(s.nearName)">{{ s.nearName }}</button>
                            <button class="doc__pathlink" (click)="openFolder(s.nearName)">{{ s.nearPath }}</button>
                          </div>
                        </div>
                        <p class="p-text">{{ s.nearWhy }}</p>
                        <div class="row-actions">
                          <fvdr-btn label="Open file" variant="secondary" size="s" (clicked)="openPreview(s.nearName)" />
                          <fvdr-btn label="Open folder" variant="secondary" size="s" (clicked)="openFolder(s.nearName)" />
                          <fvdr-btn label="Link it anyway" variant="ghost" size="s" (clicked)="linkNear()" />
                        </div>
                      </div>
                      <div class="p-actions">
                        <fvdr-btn *ngIf="s.isReopened" label="Restore file" (clicked)="restoreFile()" />
                        <fvdr-btn [label]="isBidder ? 'Ask seller in Q&A' : 'Request from seller'" [variant]="s.isReopened ? 'secondary' : 'primary'" (clicked)="askSeller()" />
                        <fvdr-btn label="Link a document" variant="secondary" (clicked)="toast('A document picker opens here to link any file or folder from the room')" />
                        <fvdr-btn label="Mark not applicable" variant="secondary" (clicked)="markNa()" />
                      </div>
                      <span *ngIf="s.requested" class="tone--success p-text">{{ reqDoneText }}</span>
                      <p class="p-hint"><fvdr-icon name="info" />{{ isBidder ? 'Bidder checklist: missing items go to the seller as Q&A questions.' : 'Sell-side data collection: the seller team gets an upload request. For a bidder checklist, this becomes “Ask seller in Q&A”.' }}</p>
                    </ng-container>

                    <ng-container *ngIf="s.isQuestion">
                      <p class="p-text">This is a question. It asks for a written answer, not documents, so it isn't matched and doesn't count toward coverage.</p>
                      <fvdr-btn *ngIf="!s.requested" [label]="isBidder ? 'Send to Q&A' : 'Request answer from seller'" (clicked)="askSeller(true)" />
                      <span *ngIf="s.requested" class="tone--success p-text">{{ isBidder ? 'Added to Q&A on Oct 6.' : 'Answer requested from the seller team on Oct 6.' }}</span>
                    </ng-container>
                    <p class="p-text" *ngIf="s.isInstruction">This is an instruction on how to respond. It isn't matched. It's kept so people uploading documents can see it.</p>
                    <p class="p-text" *ngIf="s.isNote">This is a note, such as a link, legend or definition. It isn't matched and is kept for reference.</p>
                    <div class="p-row" *ngIf="s.isNa">
                      <span class="p-text">Marked not applicable. It won't appear in the gap report.</span>
                      <fvdr-btn label="Undo" variant="ghost" size="s" (clicked)="undoNa()" />
                    </div>

                    <div class="p-reading" *ngIf="s.canEditReading">
                      <div class="p-row">
                        <span class="kv__k">How AI reads this request</span>
                        <fvdr-btn *ngIf="editId !== s.id" label="Correct" variant="secondary" size="s" iconName="edit" (clicked)="startEditReading()" />
                      </div>
                      <ng-container *ngIf="editId !== s.id">
                        <span class="p-text">{{ s.reading }}</span>
                        <span *ngIf="s.readingEdited" class="muted">Corrected by you on Oct 6. The text in your file stays as it is.</span>
                      </ng-container>
                      <ng-container *ngIf="editId === s.id">
                        <fvdr-textarea [(ngModel)]="editText" [rows]="4" helperText="Changes what this request is matched against. The text in your file isn't changed." />
                        <div class="row-actions">
                          <fvdr-btn label="Save and match again" size="s" (clicked)="saveReading()" />
                          <fvdr-btn label="Cancel" variant="ghost" size="s" (clicked)="editId = null" />
                        </div>
                      </ng-container>
                    </div>
                  </ng-container>

                  <!-- Diff -->
                  <ng-container *ngIf="panel === 'diff'">
                    <div class="panel__head">
                      <fvdr-chip label="Source file changed" variant="yellow" size="s" />
                      <span class="spacer"></span>
                      <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="panel = 'none'; recompute()" />
                    </div>
                    <h3 class="panel__title">Changes in Master Checklist</h3>
                    <p class="muted">Edited by Olena K. on Oct 5, 21:10, after the requests were extracted.</p>
                    <div class="diff">
                      <span class="kv__k tone--success">Added · Row 41 · Document request</span>
                      <span>Customer churn analysis for the last 24 months</span>
                    </div>
                    <div class="diff">
                      <span class="kv__k tone--warn">Changed · Row 13 · B.5</span>
                      <span class="diff__old">…bank statements for all material bank accounts for the last 24 months</span>
                      <span class="diff__new">…bank statements for all material bank accounts for the last 36 months</span>
                    </div>
                    <p class="p-text">Confirmed matches on every other request stay as they are. The 2 affected requests will be matched again.</p>
                    <div class="p-cta">
                      <fvdr-btn label="Apply changes" (clicked)="applyDiff()" />
                      <fvdr-btn label="Not now" variant="secondary" (clicked)="panel = 'none'; recompute()" />
                    </div>
                  </ng-container>
                </aside>
              </div>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <fvdr-toast-host />
    <fvdr-vdr-proto-switcher [groups]="protoGroups" (changed)="onProto($event)" (restart)="goScreen(screen)" />
  </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); font-size: var(--font-size-base);
      line-height: var(--line-height-base); color: var(--color-text-primary); }
    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .content { flex: 1; min-height: 0; overflow: auto; background: var(--color-stone-0);
      padding: var(--space-4) var(--space-6) calc(var(--space-16) + var(--space-4)); display: flex; flex-direction: column; gap: var(--space-4); }
    .spacer { flex: 1; }
    .muted { color: var(--color-text-secondary); font-size: var(--font-size-xs); line-height: var(--line-height-sm); }
    b { font-weight: var(--font-weight-semi); }

    /* Tones */
    .tone--default { color: var(--color-text-primary); }
    .tone--muted { color: var(--color-text-secondary); }
    .tone--warn { color: var(--color-warning-text); }
    .tone--error { color: var(--color-error-600); }
    .tone--success { color: var(--color-primary-600); }

    /* Upload */
    .upload { display: flex; flex-direction: column; }
    .drop { border: 1px dashed var(--color-stone-500); border-radius: var(--radius-lg); padding: var(--space-16) var(--space-6);
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; }
    .drop--uploading { padding: var(--space-8) var(--space-6); }
    .drop__icon { width: var(--space-12); height: var(--space-12); border-radius: var(--radius-full); background: var(--color-primary-50);
      color: var(--color-primary-500); display: inline-flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .drop__title { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semi); }
    .drop__text { margin: 0; max-width: 560px; color: var(--color-text-secondary); }
    .drop__caption { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .consent { display: flex; flex-direction: column; gap: var(--space-1); text-align: left; max-width: 560px; margin: var(--space-2) 0; }
    .consent--off { flex-direction: row; gap: var(--space-2); color: var(--color-text-secondary); }
    .consent__hint { margin: 0 0 0 calc(var(--space-6) + var(--space-1)); font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary); }
    .consent--off .consent__hint { margin: 0; }
    .up-file { display: flex; align-items: center; gap: var(--space-3); width: min(420px, 100%); text-align: left; }
    .up-file__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
    .up-file__name { font-weight: var(--font-weight-semi); }
    .up-file__meta { font-size: var(--font-size-xs); color: var(--color-text-secondary); }

    .bar { height: var(--space-1); border-radius: var(--radius-full); background: var(--color-stone-300); overflow: hidden; width: 100%; }
    .bar--wide { max-width: 480px; }
    .bar__fill { height: 100%; background: var(--color-primary-500); transition: width var(--transition-fast, 0.15s) linear; }

    /* Tabs + toolbar */
    .tabs-row { display: flex; align-items: center; gap: var(--space-2); }
    .tabs-row fvdr-tabs { flex: 1; }
    .toolbar { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .toolbar__actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .export { position: relative; }
    .menu { position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 30; width: 340px; background: var(--color-stone-0);
      border-radius: var(--radius-md); box-shadow: var(--shadow-popup); padding: var(--space-1); display: flex; flex-direction: column; }
    .menu__item { all: unset; cursor: pointer; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
    .menu__item:hover { background: var(--color-hover-bg); }
    .menu__title { font-weight: var(--font-weight-semi); }
    .menu__sub { font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary); }

    /* Notices — borderless, icon + text */
    .notice { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider); }
    .notice__icon { color: var(--color-text-secondary); font-size: var(--font-size-lg); flex: none; }
    .notice--warn .notice__icon { color: var(--color-warning-icon); }
    .notice--hl .notice__icon { color: var(--color-primary-500); }
    .notice__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
    .notice__title { font-weight: var(--font-weight-semi); }
    .notice__text { color: var(--color-text-secondary); }
    .notice__text--grow { flex: 1; }
    .ai-mark { flex: none; width: var(--space-8); height: var(--space-8); border-radius: var(--radius-full); background: var(--color-primary-50);
      color: var(--color-primary-500); display: inline-flex; align-items: center; justify-content: center; font-size: var(--font-size-lg); }
    .ai-mark--lg { width: var(--space-12); height: var(--space-12); font-size: var(--font-size-2xl); }
    .ai-mark--busy { animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
    .pulse { animation: pulse 1.4s ease-in-out infinite; }

    /* Spreadsheet */
    .sheet { flex: none; display: flex; flex-direction: column; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; min-height: 0; }
    .sheet__formula { display: flex; gap: var(--space-2); padding: var(--space-2); border-bottom: 1px solid var(--color-divider); }
    .sheet__ref, .sheet__val { height: var(--space-8); display: inline-flex; align-items: center; padding: 0 var(--space-2); border: 1px solid var(--color-divider); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
    .sheet__ref { width: 72px; }
    .sheet__val { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sheet__scroll { overflow: auto; }
    .sheet__grid { min-width: 1040px; font-size: var(--font-size-sm); line-height: var(--line-height-sm); }
    .sr { display: grid; grid-template-columns: 40px 40px 72px minmax(260px, 1fr) 128px 120px 128px 160px 100px; border-bottom: 1px solid var(--color-divider); }
    .sr--section { grid-template-columns: 40px 1fr; background: var(--color-stone-400); font-weight: var(--font-weight-semi); }
    .sr--cols { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; }
    .sr--head { background: var(--color-text-primary); color: var(--color-stone-0); font-weight: var(--font-weight-semi); }
    .sr--hl { background: var(--color-primary-50); outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
    .sr--section.sr--hl { background: var(--color-primary-100); }
    .sc { padding: var(--space-2); border-right: 1px solid var(--color-divider); min-width: 0; overflow-wrap: anywhere; }
    .sc--n { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; font-weight: normal; }
    .sr--head .sc--n { color: var(--color-text-secondary); }
    .sc--num, .sc--right { text-align: right; }
    .sc--sel { display: flex; justify-content: space-between; align-items: center; gap: var(--space-1); color: inherit; }
    .sc--sel fvdr-icon { color: var(--color-text-secondary); }
    .sheet__tabs { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); border-top: 1px solid var(--color-divider); background: var(--color-stone-100); font-size: var(--font-size-xs); }
    .sheet__tab { padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .sheet__tab--on { background: var(--color-stone-0); color: var(--color-primary-600); font-weight: var(--font-weight-semi); box-shadow: var(--shadow-card); }
    .sheet__zoom { color: var(--color-text-secondary); }

    /* Delta */
    .delta { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider); }
    .delta__title { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); }
    .delta__title fvdr-icon { color: var(--color-primary-500); }
    .delta__chips { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }

    /* Empty states */
    .empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-16) var(--space-6); text-align: center; }
    .empty__title { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semi); }
    .empty__text { margin: 0; max-width: 560px; color: var(--color-text-secondary); }

    /* Summary blocks */
    .summary { display: flex; gap: var(--space-8); align-items: center; padding: var(--space-4) 0; border-bottom: 1px solid var(--color-divider); flex-wrap: wrap; }
    .summary__main { flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: var(--space-2); }
    .summary__side { width: 360px; display: flex; flex-direction: column; gap: var(--space-2); }
    .summary__title { margin: 0; font-size: var(--font-size-xl); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi); }
    .summary__line { display: flex; align-items: baseline; gap: var(--space-3); flex-wrap: wrap; }
    .summary__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .summary__hint { font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary); }
    .kicker { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-xs); font-weight: var(--font-weight-semi); color: var(--color-primary-600); }
    .kicker--plain { color: var(--color-text-secondary); font-weight: normal; }
    .stats { display: flex; align-items: center; gap: var(--space-6); }
    .stat { display: flex; flex-direction: column; }
    .stat__label { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .stat__val { font-size: var(--font-size-3xl); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi); }
    .stat__val--info { color: var(--color-info-500); }
    .stat__val--success { color: var(--color-primary-600); }
    .stat__val--teal { color: var(--color-primary-700); }
    .stat__val--warn { color: var(--color-warning-text); }
    .stat__val--error { color: var(--color-error-600); }
    .cov { display: flex; flex-direction: column; gap: var(--space-1); }
    .cov__line { display: flex; align-items: baseline; gap: var(--space-2); }
    .cov__pct { font-size: var(--font-size-5xl); line-height: 1; font-weight: var(--font-weight-semi); }
    .cov__of { color: var(--color-text-secondary); }

    /* Workspace */
    .ws { flex: none; display: flex; flex-direction: column; gap: var(--space-3); }
    .ws__bar { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .ws__body { display: flex; gap: var(--space-6); align-items: flex-start; }
    .tbl-wrap { flex: 1; min-width: 0; overflow-x: auto; }

    .tbl { min-width: 940px; }
    .tbl--narrow { min-width: 640px; }
    .tbl--list { min-width: 640px; }
    .tr { display: grid; grid-template-columns: 112px 56px minmax(240px, 1fr) minmax(240px, 320px) minmax(160px, 220px) 56px;
      gap: var(--space-3); padding: var(--space-3); border-bottom: 1px solid var(--color-divider); align-items: start; }
    .tbl--narrow .tr { grid-template-columns: 112px 48px minmax(200px, 1fr) minmax(200px, 280px) 48px; }
    .tbl--list .tr { grid-template-columns: 136px 56px minmax(0, 1fr) 120px; }
    .tr--head { font-size: var(--font-size-xs); color: var(--color-text-secondary); padding-top: var(--space-2); padding-bottom: var(--space-2); }
    .tr--group { display: flex; align-items: center; gap: var(--space-3); background: var(--color-stone-100); padding: var(--space-2) var(--space-3); }
    .g-label { color: var(--color-text-secondary); font-weight: var(--font-weight-semi); }
    .g-name { font-weight: var(--font-weight-semi); }
    .mini-bar { width: 72px; height: var(--space-1); border-radius: var(--radius-full); background: var(--color-stone-300); overflow: hidden; }
    .mini-bar__fill { height: 100%; background: var(--color-primary-500); }
    .tr--item { cursor: pointer; }
    .tr--item:hover { background: var(--color-stone-100); }
    .tr--sel, .tr--sel:hover { background: var(--color-primary-50); box-shadow: inset 3px 0 0 var(--color-primary-500); }
    .tr--flag, .tr--flag:hover { background: var(--color-warning-bg); }
    .tr--editing { background: var(--color-stone-100); cursor: default; }
    .c-id { display: flex; flex-direction: column; gap: var(--space-1); align-items: flex-start; color: var(--color-text-secondary); padding-top: var(--space-1); }
    .c-text { display: flex; flex-direction: column; gap: var(--space-1); padding-top: var(--space-1); min-width: 0; }
    .c-docs, .c-next { display: flex; flex-direction: column; gap: var(--space-1); align-items: flex-start; min-width: 0; padding-top: var(--space-1); }
    .c-src { display: flex; align-items: center; gap: var(--space-1); }
    .c-right { justify-content: flex-end; text-align: right; }
    .t-muted { color: var(--color-text-secondary); }
    .t-note { font-size: var(--font-size-xs); line-height: var(--line-height-sm); }
    .t-prefix { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .t-dash { color: var(--color-text-placeholder); }
    .tbl-empty { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .doc-list { display: flex; flex-direction: column; width: 100%; }
    .doc { display: flex; align-items: center; gap: var(--space-2); min-width: 0; padding: 0; }
    .doc + .doc { border-top: 1px solid var(--color-stone-300); }
    .doc__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-size-sm); }
    .doc__path { color: var(--color-text-secondary); font-size: var(--font-size-xs); white-space: nowrap; }
    .doc--lg { align-items: flex-start; }
    .doc__col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .doc__link, .doc__pathlink { all: unset; cursor: pointer; }
    .doc__link { font-weight: var(--font-weight-semi); }
    .doc__link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .doc__pathlink { font-size: var(--font-size-xs); color: var(--color-primary-600); }
    .doc__pathlink:hover { text-decoration: underline; }
    .more { all: unset; cursor: pointer; font-size: var(--font-size-xs); color: var(--color-primary-600); }
    .src-link { all: unset; cursor: pointer; font-size: var(--font-size-xs); color: var(--color-primary-600); padding: 2px var(--space-2); border-radius: var(--radius-sm); }
    .src-link:hover { background: var(--color-primary-50); }
    .src-link--sec { color: var(--color-text-secondary); }
    .row-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; margin-top: var(--space-1); }
    .row-edit { display: flex; flex-direction: column; gap: var(--space-2); max-width: 640px; }

    /* Side panel — borderless, divider on the left */
    .panel { width: 380px; flex: none; position: sticky; top: 0; border-left: 1px solid var(--color-divider); padding: 0 0 var(--space-4) var(--space-5);
      display: flex; flex-direction: column; gap: var(--space-3); }
    .panel__head { display: flex; align-items: center; gap: var(--space-2); }
    .panel__id { color: var(--color-text-secondary); font-weight: var(--font-weight-semi); }
    .panel__title { margin: 0; font-size: var(--font-size-lg); line-height: var(--line-height-lg); font-weight: var(--font-weight-semi); }
    .panel__src { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); }
    .kv { display: flex; flex-direction: column; gap: var(--space-1); }
    .kv__k { font-size: var(--font-size-xs); font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .p-block { display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-divider); }
    .p-text { margin: 0; font-size: var(--font-size-sm); line-height: var(--line-height-base); }
    .p-verdict { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); }
    .p-cta { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); padding-top: var(--space-2); }
    .p-cta fvdr-btn { display: block; }
    .p-nav { display: flex; justify-content: space-between; }
    .p-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .p-gap { display: flex; flex-direction: column; gap: var(--space-1); padding-top: var(--space-3); border-top: 1px solid var(--color-divider); font-size: var(--font-size-sm); }
    .p-gap__title { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); color: var(--color-error-600); }
    .p-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .p-hint { margin: 0; display: flex; gap: var(--space-2); font-size: var(--font-size-xs); line-height: var(--line-height-sm); color: var(--color-text-secondary); }
    .p-hint fvdr-icon { flex: none; margin-top: 2px; }
    .p-reading { display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-divider); }
    .linked { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0; }
    .linked + .linked { border-top: 1px solid var(--color-stone-300); }
    .diff { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) 0; border-top: 1px solid var(--color-divider); font-size: var(--font-size-sm); }
    .diff__old { color: var(--color-text-secondary); text-decoration: line-through; }
    .diff__new { color: var(--color-primary-700); }

    /* Folders */
    .folders { flex: 1; display: grid; grid-template-columns: 340px 1fr; gap: var(--space-6); min-width: 0; }
    .folders__reqs { border-right: 1px solid var(--color-divider); padding-right: var(--space-4); }
    .folders__head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .h-sec { font-weight: var(--font-weight-semi); }
    .fgroup__name { font-size: var(--font-size-xs); color: var(--color-text-secondary); padding: var(--space-3) 0 var(--space-1); }
    .freq { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; display: grid; grid-template-columns: 8px 36px minmax(0, 1fr) auto; gap: var(--space-2);
      align-items: center; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
    .freq:hover { background: var(--color-stone-100); }
    .freq--hit { background: var(--color-primary-50); }
    .freq--sel { background: var(--color-primary-50); box-shadow: inset 3px 0 0 var(--color-primary-500); }
    .freq__id { color: var(--color-text-secondary); }
    .freq__text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .freq__count { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .freq__count--gap { color: var(--color-error-600); }
    .dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-stone-500); }
    .dot--covered { background: var(--color-primary-500); }
    .dot--partial { background: var(--color-primary-300); }
    .dot--review { background: var(--color-warning-icon); }
    .dot--gap { background: var(--color-error-600); }
    .folders__tree { min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .fhead { display: flex; align-items: flex-start; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .fhead__text { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 2px; }
    .fhead__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semi); }
    .legend { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .legend__item { display: inline-flex; align-items: center; gap: var(--space-1); }
    .sw { width: 10px; height: 10px; border-radius: var(--radius-xs, 2px); }
    .sw--linked { background: var(--color-primary-100); }
    .sw--partial { background: var(--color-primary-50); border: 1px solid var(--color-primary-300); }
    .sw--suggested { background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); }
    .sw--closest { background: var(--color-stone-300); }
    .ftree { display: flex; flex-direction: column; }
    .frow { display: flex; align-items: center; gap: var(--space-2); min-height: 36px; padding: var(--space-1) var(--space-3); border-bottom: 1px solid var(--color-stone-300); cursor: pointer; font-size: var(--font-size-sm); }
    .frow:hover { background: var(--color-stone-100); }
    .frow--related { background: var(--color-stone-100); }
    .frow--here { background: var(--color-primary-50); }
    .frow--linked { background: var(--color-primary-100); }
    .frow--partial { background: var(--color-primary-50); }
    .frow--suggested { background: var(--color-warning-bg); }
    .frow--closest { background: var(--color-stone-300); }
    .frow--picked { box-shadow: inset 0 0 0 2px var(--color-primary-500); }
    .frow--unused .frow__name { color: var(--color-text-secondary); }
    .frow__chev { color: var(--color-text-secondary); transition: transform var(--transition-fast, 0.15s) ease; }
    .frow__chev--open { transform: rotate(90deg); }
    .frow__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .frow__meta { color: var(--color-text-secondary); font-size: var(--font-size-xs); white-space: nowrap; }
  `],
})
export class ChecklistMatchingComponent implements OnDestroy {
  private toastSvc = inject(ToastService);
  @ViewChild('content') private contentEl?: ElementRef<HTMLElement>;

  // ── Shell ──
  sidebarCollapsed = false;
  nav: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'nav-projects', iconActive: 'nav-projects-active' },
    { id: 'checklist', label: 'Due diligence checklist', icon: 'nav-checklist', iconActive: 'nav-checklist', active: true },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
    { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    { id: 'trash', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];
  crumbs: BreadcrumbItem[] = [{ id: 'dd', label: 'Due diligence checklist' }];
  headerActions: HeaderAction[] = [{ id: 'help', icon: 'help', label: 'Help' }];
  tabs: TabItem[] = [{ id: 'checklist', label: 'Checklist' }];
  layoutItems: SegmentItem[] = [
    { id: 'table', label: 'Table', icon: 'table-view' },
    { id: 'list', label: 'List', icon: 'list-view' },
    { id: 'folders', label: 'Folders', icon: 'folder' },
  ];
  scopeOptions: DropdownOption[] = [
    { value: 'all', label: 'All documents in Diamond (1,482)' },
    { value: 'a', label: 'Documents Bidder A — Northbridge Capital can see (936)' },
    { value: 'b', label: 'Documents Bidder B — Halden Partners can see (902)' },
  ];
  clsOptions: DropdownOption[] = [
    { value: 'document_request', label: 'Document request' },
    { value: 'question', label: 'Question' },
    { value: 'instruction', label: 'Instruction' },
    { value: 'note', label: 'Note' },
  ];
  clsHint: Record<ReqCls, string> = {
    document_request: 'Matched to documents', question: 'Answered in writing, not matched',
    instruction: 'Kept for reference, not matched', note: 'Kept for reference, not matched',
  };
  sheetCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  totalDocs = '1,482';

  // ── Prototype controls ──
  screen: Screen = 'upload';
  roomAiOn = true;
  isBidder = false;

  // ── State ──
  phase: Phase = 'empty';
  view: 'source' | 'requests' = 'source';
  upPct = 0;
  aiConsent = true;
  readRow = 0;
  progress = 0;
  st: Record<string, Rec> = {};
  flagResolved = false;
  filter: Filter = 'all';
  layout: Layout = 'table';
  selected: string | null = null;
  panel: 'none' | 'item' | 'diff' = 'none';
  exportOpen = false;
  stale = false;
  delta = false;
  sourceEdited = false;
  applied = false;
  returningCands = false;
  deletedFiles: string[] = [];
  highlightRow: number | null = null;
  backTo: string | null = null;
  scope = 'all';
  expanded: Record<string, boolean> = {};
  changeFilter: ChangeKind | 'all' | null = null;
  overrides: Record<string, { text: string; cls: ReqCls }> = {};
  editRowId: string | null = null;
  editRowText = '';
  editCls: ReqCls = 'document_request';
  editId: string | null = null;
  editText = '';
  fSelReq: string | null = null;
  fSelFile: string | null = null;
  fOpen: Record<string, boolean> = {};
  fHideUnused = false;

  // ── View model (recomputed after every change) ──
  groups: GroupVm[] = [];
  counts: Record<string, number> = {};
  matchable = 0;
  pct = 0;
  sel: any = null;
  showPanel = false;
  changeChips: { kind: ChangeKind; label: string; variant: ChipVariant }[] = [];
  changeTotal = 0;
  filters: { id: Filter; label: string; count: number; active: boolean }[] = [];
  viewItems: SegmentItem[] = [];
  sourceRows: SrcRow[] = [];
  hlCell = '';
  hlText = '';
  fv: any = { groups: [], rows: [], kicker: '', title: '', sub: '', coveredLabel: '', hasReq: false };
  typeChips = { doc: '', q: '', i: '', n: '', docCount: 0 };
  foundLine = '';

  private ut: any; private rt: any; private mt: any;

  get protoGroups(): ProtoGroup[] {
    return [
      { id: 'screen', label: 'Screen', value: this.screen, options: [
        { id: 'upload', label: 'Upload' }, { id: 'source', label: 'Source file' }, { id: 'structure', label: 'Structure check' },
        { id: 'matching', label: 'Matching' }, { id: 'triage', label: 'Triage' }, { id: 'gaps', label: 'Gaps' }, { id: 'returning', label: 'Returning user' },
      ] },
      { id: 'side', label: 'Deal', value: this.isBidder ? 'bidder' : 'sell', options: [{ id: 'sell', label: 'Sell-side' }, { id: 'bidder', label: 'Bidder' }] },
      { id: 'ai', label: 'Room AI', value: this.roomAiOn ? 'on' : 'off', options: [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }] },
    ];
  }

  get hasChecklist() { return this.phase !== 'empty' && this.phase !== 'uploading'; }
  get readInFirst() { return this.readRow <= 43; }
  get readSheet() { return this.readInFirst ? 'Master Checklist' : 'Working copy of the Master Checklist'; }
  get readRowInSheet() { return this.readInFirst ? this.readRow : this.readRow - 43; }
  get readPct() { return Math.round(100 * this.readRow / 86); }
  get docsRead() { return Math.round(this.progress * TOTAL_DOCS).toLocaleString('en-US'); }
  get reqDoneText() {
    return this.isBidder ? 'Asked in Q&A on Oct 6. It stays open until a document arrives.'
      : 'Requested from the seller team on Oct 6. It stays open until a document is uploaded.';
  }
  get srcInfoText() {
    if (this.stale) return 'This file changed after the requests were extracted. Review the changes in Requests.';
    return this.phase === 'results'
      ? `${this.matchable} document requests and ${this.counts['question'] || 0} questions extracted on Oct 5 · ${this.counts['review'] || 0} to review, ${this.counts['gap'] || 0} gaps`
      : `Matching ${this.matchable} document requests from this file against 1,482 documents.`;
  }

  constructor() { this.goScreen('upload'); }
  ngOnDestroy(): void { this.stopTimers(); }

  // ══════════ Data helpers ══════════
  isDoc(r: Req) { return r.cls === 'document_request'; }
  lbl(r: Req) { return r.label || r.id; }
  doc(n: string): DocInfo { return DOCS[n] || { path: '', summary: '' }; }
  asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }
  byId = (_: number, x: { id: string }) => x.id;
  byKey = (_: number, x: { key: string }) => x.key;

  fileType(name: string): FvdrFileType {
    const d = this.doc(name);
    if (d.folder) return 'folder';
    if (/\.(xlsx|csv)$/i.test(name)) return 'xls';
    return 'pdf';
  }

  private chip(n: string): DocChip {
    const d = this.doc(n);
    return { name: n, label: d.label || n, path: d.path, type: this.fileType(n), isFolder: !!d.folder };
  }

  private withEdits(on: boolean): Req[] {
    if (!on) return REQS;
    const list = REQS.map(r => r.id !== 'B.5' ? r : {
      ...r,
      text: "An Excel upload of the company's bank statements for all material bank accounts for the last 36 months",
      cand: { ...r.cand!, why: 'Covers one account for 21 of 36 months. Other material accounts not found.', missing: 'Other material accounts; Oct 2023 – Dec 2024' },
    });
    const idx = list.findIndex(r => r.id === 'F.4');
    list.splice(idx + 1, 0, { id: 'F.5', sec: 'F', row: 41, text: 'Customer churn analysis for the last 24 months', ftype: 'Itemized List', cls: 'document_request', final: 'gap', note: 'No churn analysis found in 1,482 documents.' });
    return list;
  }

  private patchReturning(list: Req[]): Req[] {
    if (!this.returningCands) return list;
    const P: Record<string, Req['cand']> = {
      'B.3': { name: 'Sales by product line YTD 2026.xlsx', why: 'Breaks year-to-date sales down by product line, not by SKU.', verdict: 'Partial', missing: 'SKU-level breakdown' },
      'F.2': { name: 'Supplier spend FY2025.xlsx', why: 'Ranks suppliers by FY2025 spend, so the top 10 can be read directly.', verdict: 'Likely match', missing: '' },
    };
    return list.map(r => P[r.id] ? { ...r, cand: P[r.id] } : r);
  }

  private applyOverrides(list: Req[]): (Req & { origText?: string; edited?: boolean })[] {
    return list.map(r => this.overrides[r.id]
      ? { ...r, text: this.overrides[r.id].text, cls: this.overrides[r.id].cls, origText: r.text, edited: true, readAs: undefined, flag: false }
      : r);
  }

  getReqs() { return this.applyOverrides(this.patchReturning(this.withEdits(this.applied))); }
  findReq(id: string | null) { return id ? this.getReqs().find(r => r.id === id) : undefined; }

  private baseMap(docState: (r: Req) => MatchState): Record<string, Rec> {
    const m: Record<string, Rec> = {};
    this.getReqs().forEach(r => { m[r.id] = { s: this.isDoc(r) ? docState(r) : r.cls }; });
    return m;
  }
  private mapFinal() { return this.baseMap(r => r.final || 'gap'); }
  private mapReturning() {
    const m = this.mapFinal();
    m['B.8'] = { s: 'covered', docs: ['AP aging report Oct 2026.xlsx'], why: 'Uploaded on Oct 4. Lists payables by supplier with amounts and terms.', change: { kind: 'closed', reason: 'Gap closed by a new upload: AP aging report Oct 2026.xlsx, uploaded by the seller team on Oct 4' } };
    m['C.5'] = { s: 'covered', docs: ['Business licenses and permits 2026.pdf'], why: 'Uploaded on Oct 3. Current business licenses and operating permits.', change: { kind: 'closed', reason: 'Gap closed by a new upload: Business licenses and permits 2026.pdf, Oct 3' } };
    m['B.9'] = { s: 'covered', docs: ['Equipment lease schedule 2026.xlsx'], why: 'Uploaded on Oct 5. Lists every leased asset with lessor, term and monthly cost.', change: { kind: 'closed', reason: 'Gap closed by a new upload: Equipment lease schedule 2026.xlsx, Oct 5' } };
    m['B.3'] = { s: 'review', change: { kind: 'suggested', reason: 'New suggestion from a file uploaded on Oct 5' } };
    m['F.2'] = { s: 'review', change: { kind: 'suggested', reason: 'New suggestion from a file uploaded on Oct 6' } };
    m['D.1'] = { s: 'gap', reopened: true, change: { kind: 'reopened', reason: 'Reopened: the linked file was deleted by Olena K. on Oct 6' } };
    m['B.7'] = { s: 'covered', docs: ['AR aging report Sep 2026.xlsx'] };
    m['F.1'] = { s: 'covered', docs: ['Revenue by customer FY2025.xlsx'] };
    m['E.2'] = { s: 'covered', docs: ['Sales and use tax filings 2024–2025.pdf'] };
    m['B.4'] = { s: 'partial', docs: ['Stripe payouts 2025–2026.csv'] };
    m['B.5'] = { s: 'partial', docs: ['Bank statements 2025–2026.xlsx'] };
    return m;
  }

  // ══════════ Screens ══════════
  onProto(e: { group: string; value: string }) {
    if (e.group === 'screen') this.goScreen(e.value as Screen);
    if (e.group === 'side') { this.isBidder = e.value === 'bidder'; this.recompute(); }
    if (e.group === 'ai') { this.roomAiOn = e.value === 'on'; this.goScreen(this.screen); }
  }

  goScreen(screen: Screen) {
    this.stopTimers();
    this.screen = screen;
    this.contentEl?.nativeElement.scrollTo({ top: 0 });
    Object.assign(this, {
      view: 'requests', phase: 'results', readRow: 0, progress: 0, flagResolved: true, filter: 'all', layout: 'table',
      selected: null, panel: 'none', exportOpen: false, stale: false, delta: false, sourceEdited: false, applied: false,
      returningCands: false, deletedFiles: [], highlightRow: null, backTo: null, expanded: {}, changeFilter: null,
      overrides: {}, editRowId: null, editId: null, fSelReq: null, fSelFile: null, fOpen: {}, fHideUnused: false, upPct: 0,
    });
    const pending = () => this.baseMap(() => 'pending');
    if (screen === 'upload') { this.view = 'source'; this.phase = 'empty'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'source') { this.view = 'source'; this.phase = 'none'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'structure') { this.phase = 'structure'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'matching') { this.phase = 'matching'; this.st = this.baseMap(() => 'searching'); this.runMatching(); }
    else if (screen === 'triage') { this.st = this.mapFinal(); }
    else if (screen === 'gaps') { this.st = this.mapFinal(); this.filter = 'gap'; this.selected = 'F.2'; this.panel = 'item'; }
    else if (screen === 'returning') {
      this.returningCands = true; this.st = this.mapReturning(); this.stale = true; this.delta = true; this.sourceEdited = true;
      this.deletedFiles = ['Org chart Sep 2026.pdf'];
    }
    this.recompute();
  }

  private stopTimers() { clearInterval(this.ut); clearInterval(this.rt); clearInterval(this.mt); }

  toast(message: string) { this.toastSvc.show({ variant: 'info', message, duration: 3000 }); }

  upload() {
    clearInterval(this.ut);
    this.phase = 'uploading'; this.upPct = 0;
    this.ut = setInterval(() => {
      this.upPct = Math.min(100, this.upPct + 9);
      if (this.upPct >= 100) {
        clearInterval(this.ut);
        if (this.roomAiOn && this.aiConsent) { this.extract('source'); this.toast('Checklist uploaded. AI is reading it now.'); }
        else { this.phase = 'none'; this.view = 'source'; this.recompute(); this.toast('Checklist uploaded'); }
      }
    }, 70);
  }

  extract(view: 'source' | 'requests' = 'requests') {
    clearInterval(this.rt);
    Object.assign(this, { view, phase: 'reading', readRow: 0, flagResolved: false, highlightRow: null, selected: null, panel: 'none' });
    this.st = this.baseMap(() => 'pending');
    this.recompute();
    const step = view === 'source' ? 2 : 3;
    this.rt = setInterval(() => {
      const n = this.readRow + step;
      if (n >= 86) { clearInterval(this.rt); this.readRow = 86; this.phase = 'structure'; this.recompute(); return; }
      this.readRow = n;
    }, 60);
  }

  startMatching() {
    Object.assign(this, { phase: 'matching', progress: 0, selected: null, panel: 'none', filter: 'all' });
    this.st = this.baseMap(() => 'searching');
    this.recompute();
    this.runMatching();
  }

  private runMatching() {
    clearInterval(this.mt);
    this.mt = setInterval(() => {
      const p = Math.min(1, this.progress + 0.0175);
      const st = { ...this.st };
      const reqs = this.getReqs();
      if (p >= 1) {
        clearInterval(this.mt);
        const c: Record<string, number> = { covered: 0, review: 0, gap: 0 };
        reqs.forEach(r => { if (this.isDoc(r)) { const fin = r.final || 'gap'; st[r.id] = { s: fin }; c[fin] += 1; } });
        Object.assign(this, { progress: 1, st, phase: 'results', panel: 'none', selected: null });
        this.recompute();
        this.toast(`Matching done: ${c['covered']} covered, ${c['review']} to review, ${c['gap']} gaps`);
        return;
      }
      reqs.forEach(r => { if (this.isDoc(r) && st[r.id]?.s === 'searching' && r.foundAt && r.foundAt <= p) st[r.id] = { s: 'found' }; });
      this.progress = p; this.st = st;
      this.recompute();
    }, 110);
  }

  // ══════════ Interactions ══════════
  setView(v: string) {
    this.view = v as 'source' | 'requests';
    if (v === 'requests') this.highlightRow = null;
    this.exportOpen = false;
    this.recompute();
  }
  doExport(kind: 'gap' | 'full') {
    this.exportOpen = false;
    this.toast(kind === 'gap' ? 'Gap report downloaded' : 'Master Checklist with results downloaded. The file in the room is unchanged.');
  }
  openPreview(n: string) { const d = this.doc(n); if (d.folder) { this.openFolder(n); return; } this.toast(`Opening ${n} in the document viewer, in a new tab`); }
  openFolder(n: string) { const d = this.doc(n); this.toast(d.folder ? `Opening folder ${d.path} in Documents` : `Opening folder ${d.path} in Documents, with the file highlighted`); }
  openSrc(row: number, backTo: string) { Object.assign(this, { view: 'source', highlightRow: row, backTo, exportOpen: false }); this.recompute(); }
  backToRequest() {
    const isReq = !!this.findReq(this.backTo);
    const res = this.phase === 'results';
    this.view = 'requests'; this.highlightRow = null;
    if (res && isReq) { this.selected = this.backTo; this.panel = 'item'; }
    this.recompute();
  }
  pickFilter(f: Filter) { this.filter = f; this.changeFilter = null; this.recompute(); }
  pickLayout(l: string) { this.layout = l as Layout; this.exportOpen = false; this.recompute(); }
  pickChange(kind: ChangeKind | 'all') {
    this.changeFilter = this.changeFilter === kind ? null : kind;
    Object.assign(this, { filter: 'all', selected: null, panel: 'none' });
    if (this.layout === 'folders') this.layout = 'table';
    this.recompute();
  }
  select(id: string) { if (this.phase !== 'results') return; Object.assign(this, { selected: id, panel: 'item', exportOpen: false, editId: null }); this.recompute(); }
  clearSel() { Object.assign(this, { selected: null, panel: 'none', editId: null }); this.recompute(); }
  toggleMore(id: string) { this.expanded = { ...this.expanded, [id]: !this.expanded[id] }; this.recompute(); }
  rowAction(it: RowVm) {
    this.select(it.id);
    if (it.action !== 'Review') this.askSeller(it.pill.label === 'Question');
  }
  keepFlag() { this.flagResolved = true; this.recompute(); this.toast('Row 15 confirmed'); }
  startRowEdit(id: string) {
    const r = this.findReq(id)!;
    Object.assign(this, { editRowId: id, editRowText: r.readAs || r.text, editCls: r.cls });
    this.recompute();
  }
  saveRowEdit() {
    const id = this.editRowId!; const txt = this.editRowText.trim(); const cls = this.editCls;
    if (!txt) { this.toast('The request text can’t be empty'); return; }
    const base = REQS.find(x => x.id === id);
    const ov = { ...this.overrides };
    if (base && txt === (base.readAs || base.text) && cls === base.cls) delete ov[id]; else ov[id] = { text: txt, cls };
    this.overrides = ov;
    this.st = { ...this.st, [id]: { s: cls === 'document_request' ? 'pending' : cls } };
    if (base?.flag) this.flagResolved = true;
    this.editRowId = null;
    this.recompute();
    const names: Record<ReqCls, string> = { document_request: 'a document request', question: 'a question', instruction: 'an instruction', note: 'a note' };
    this.toast(id + ' saved' + (base && cls !== base.cls ? ' as ' + names[cls] : ''));
  }

  private reviewIds(st = this.st) { return this.getReqs().filter(r => st[r.id]?.s === 'review').map(r => r.id); }
  startReview() {
    const ids = this.reviewIds();
    if (!ids.length) return;
    Object.assign(this, { selected: ids[0], panel: 'item', filter: 'review', changeFilter: null });
    if (this.layout === 'folders') this.layout = 'table';
    this.recompute();
  }
  showGaps() {
    const g = this.getReqs().find(q => this.st[q.id]?.s === 'gap');
    Object.assign(this, { filter: 'gap', selected: g ? g.id : null, panel: g ? 'item' : 'none' });
    if (this.layout === 'folders') this.layout = 'table';
    this.recompute();
  }
  stepReview(dir: 1 | -1) {
    const ids = this.reviewIds(); const i = ids.indexOf(this.selected!);
    if (ids.length) { this.selected = ids[(i + dir + ids.length) % ids.length]; this.recompute(); }
  }
  private advance(st: Record<string, Rec>, id: string, msg: string) {
    const order = this.getReqs().map(r => r.id);
    const idx = order.indexOf(id);
    let next: string | null = null;
    for (let i = 1; i <= order.length; i++) { const k = order[(idx + i) % order.length]; if (st[k]?.s === 'review') { next = k; break; } }
    this.st = st;
    if (next) { this.selected = next; this.panel = 'item'; this.toast(msg); }
    else { Object.assign(this, { selected: null, panel: 'none', filter: 'all' }); this.toast('All suggestions reviewed'); }
    this.recompute();
  }
  accept() {
    const id = this.selected!; const r = this.findReq(id)!; const cur = this.st[id] || {} as Rec;
    const partial = r.cand!.verdict === 'Partial';
    this.advance({ ...this.st, [id]: { s: partial ? 'partial' : 'covered', docs: [r.cand!.name], change: cur.change, reading: cur.reading } }, id,
      partial ? 'Accepted as partial. The missing part stays in the gap report.' : 'Accepted');
  }
  reject() {
    const id = this.selected!; const cur = this.st[id] || {} as Rec;
    this.advance({ ...this.st, [id]: { s: 'gap', rejected: true, change: cur.change, reading: cur.reading } }, id, `Rejected. ${id} is now a gap.`);
  }
  unlink(n: string) {
    const id = this.selected!; const r = this.findReq(id)!; const cur = this.st[id] || {} as Rec;
    const left = (cur.docs || r.docs || []).filter(x => x !== n);
    this.st = { ...this.st, [id]: left.length ? { ...cur, docs: left } : { s: 'gap', rejected: true } };
    this.recompute();
    this.toast(left.length ? `Unlinked. ${left.length} document still linked.` : `Unlinked. ${id} is now a gap.`);
  }
  linkNear() {
    const id = this.selected!; const r = this.findReq(id)!;
    this.st = { ...this.st, [id]: { s: 'partial', docs: [r.near!.name], why: 'Linked by you. ' + r.near!.why, missing: 'Spend figures' } };
    this.recompute(); this.toast('Linked as partial coverage');
  }
  askSeller(question = false) {
    const id = this.selected!;
    this.st = { ...this.st, [id]: { ...this.st[id], requested: true } };
    this.recompute();
    if (question) this.toast(this.isBidder ? 'Question added to Q&A' : 'Answer requested from the seller team');
    else this.toast(this.isBidder ? 'Question sent to the seller in Q&A' : 'Upload request sent to the seller team');
  }
  markNa() { const id = this.selected!; this.st = { ...this.st, [id]: { s: 'na', prev: this.st[id] } }; this.recompute(); this.toast(id + ' marked not applicable'); }
  undoNa() { const id = this.selected!; this.st = { ...this.st, [id]: this.st[id]?.prev || { s: 'gap' } }; this.recompute(); }
  restoreFile() {
    this.st = { ...this.st, 'D.1': { s: 'covered', docs: ['Org chart Sep 2026.pdf'], why: 'Restored from the recycle bin. Current company org chart.' } };
    this.deletedFiles = this.deletedFiles.filter(n => n !== 'Org chart Sep 2026.pdf');
    this.recompute();
    this.toast('Org chart Sep 2026.pdf restored from the recycle bin. D.1 is covered again.');
  }
  startEditReading() { const r = this.findReq(this.selected)!; this.editId = r.id; this.editText = this.st[r.id]?.reading || r.readAs || r.text; }
  saveReading() {
    const id = this.selected!; const txt = this.editText.trim();
    if (!txt) { this.toast('The reading can’t be empty'); return; }
    this.st = { ...this.st, [id]: { ...this.st[id], reading: txt } };
    this.editId = null; this.recompute();
    this.toast(`Saved. ${id} is being matched again with the corrected reading.`);
  }
  openDiff() { Object.assign(this, { panel: 'diff', selected: null }); if (this.layout === 'folders') this.layout = 'table'; this.recompute(); }
  applyDiff() {
    Object.assign(this, { applied: true, sourceEdited: true, stale: false, panel: 'none', selected: null });
    this.st = { ...this.st, 'F.5': { s: 'gap', isNew: true }, 'B.5': { s: 'review' } };
    this.recompute();
    this.toast('Requests updated: 1 added, 1 matched again. Other confirmed matches kept.');
  }

  // Folders
  pickFolderReq(id: string) { Object.assign(this, { fSelReq: id, fSelFile: null, fOpen: {} }); this.recompute(); }
  pickFolderFile(n: string) { Object.assign(this, { fSelFile: n, fSelReq: null }); this.recompute(); }
  toggleFolder(id: string, open: boolean) { this.fOpen = { ...this.fOpen, [id]: !open }; this.recompute(); }
  openFolderReqInTable() { const id = this.fv.selId; if (id) { Object.assign(this, { layout: 'table', selected: id, panel: 'item', filter: 'all' }); this.recompute(); } }

  // ══════════ View model ══════════
  pill(s: string): Pill { return PILLS[s] || PILLS['pending']; }

  recompute() {
    const reqs = this.getReqs();
    const phase = this.phase;
    const isResults = phase === 'results';
    const st = this.st;

    const counts: Record<string, number> = {};
    reqs.forEach(r => { const s = (st[r.id] || { s: 'pending' }).s; counts[s] = (counts[s] || 0) + 1; });
    this.counts = counts;
    this.matchable = reqs.filter(r => this.isDoc(r) && st[r.id]?.s !== 'na').length;
    this.pct = this.matchable ? Math.round(100 * ((counts['covered'] || 0) + (counts['partial'] || 0)) / this.matchable) : 0;

    const n = (c: ReqCls) => reqs.filter(r => r.cls === c).length;
    const pl = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    const d = n('document_request'), q = n('question');
    this.typeChips = { doc: pl(d, 'document request', 'document requests'), q: pl(q, 'question', 'questions'), i: pl(n('instruction'), 'instruction', 'instructions'), n: pl(n('note'), 'note', 'notes'), docCount: d };
    this.foundLine = `${pl(d, 'document request', 'document requests')} and ${pl(q, 'question', 'questions')} found`;

    this.viewItems = [
      { id: 'source', label: 'Source file', icon: 'documents' },
      { id: 'requests', label: 'Requests', icon: 'sparkle', count: isResults && counts['review'] ? counts['review'] : undefined },
    ];

    // Filters
    const inFolders = this.layout === 'folders';
    const fdef: [Filter, string, number][] = [
      ['all', 'All', inFolders ? reqs.filter(r => this.isDoc(r)).length : reqs.length],
      ['review', 'To review', counts['review'] || 0],
      ['gap', 'Gaps', counts['gap'] || 0],
      ['covered', 'Covered', (counts['covered'] || 0) + (counts['partial'] || 0)],
      ['other', 'Questions and notes', (counts['question'] || 0) + (counts['instruction'] || 0) + (counts['note'] || 0)],
    ];
    this.filters = fdef.filter(f => !(inFolders && f[0] === 'other')).map(([id, label, count]) => ({
      id, label, count, active: (this.filter === id || (inFolders && id === 'all' && this.filter === 'other')) && !this.changeFilter,
    }));

    // Change chips
    const chg: Record<ChangeKind, number> = { reopened: 0, closed: 0, suggested: 0 };
    reqs.forEach(r => { const c = st[r.id]?.change; if (c) chg[c.kind] += 1; });
    this.changeChips = ([
      ['reopened', `${chg.reopened} reopened`],
      ['closed', `${chg.closed} ${chg.closed === 1 ? 'gap closed' : 'gaps closed'}`],
      ['suggested', `${chg.suggested} ${chg.suggested === 1 ? 'new suggestion' : 'new suggestions'}`],
    ] as [ChangeKind, string][]).filter(([k]) => chg[k] > 0).map(([kind, label]) => ({ kind, label, variant: CHANGE_VARIANT[kind] }));
    this.changeTotal = chg.reopened + chg.closed + chg.suggested;

    // Groups
    const pass = (s: string, rec?: Rec) => {
      if (isResults && this.changeFilter) { const ch = rec?.change; return !!ch && (this.changeFilter === 'all' || ch.kind === this.changeFilter); }
      if (!isResults || this.filter === 'all') return true;
      if (this.filter === 'covered') return s === 'covered' || s === 'partial';
      if (this.filter === 'other') return s === 'question' || s === 'instruction' || s === 'note';
      return s === this.filter;
    };
    const secs = [...SECTIONS, { id: 'X', name: 'Instructions and notes', src: '', row: 0 }];
    let groups: GroupVm[] = [];
    secs.forEach(sec => {
      const inSec = reqs.filter(r => r.sec === sec.id);
      const m = inSec.filter(r => this.isDoc(r) && st[r.id] && st[r.id].s !== 'na').length;
      const cov = inSec.filter(r => st[r.id]?.s === 'covered' || st[r.id]?.s === 'partial').length;
      const fnd = inSec.filter(r => st[r.id]?.s === 'found').length;
      const items = inSec.filter(r => pass((st[r.id] || { s: 'pending' }).s, st[r.id])).map(r => this.rowVm(r, st[r.id] || { s: 'pending' }));
      if (!items.length) return;
      let meta: string;
      if (sec.id === 'X') meta = phase === 'structure' ? `${inSec.length} items outside sections` : 'Not matched, kept for reference';
      else if (phase === 'structure') meta = `${inSec.length} items`;
      else if (phase === 'matching') meta = m ? `${fnd} of ${m} found so far` : 'Nothing to match';
      else meta = m ? `${cov} of ${m} covered` : 'Nothing to match';
      groups.push({ id: sec.id, label: sec.id === 'X' ? '—' : sec.id, name: sec.name, meta, items, hasSrc: sec.id !== 'X', row: sec.row, hasBar: isResults && m > 0, pct: m ? Math.round(100 * cov / m) : 0 });
    });
    if (isResults && this.changeFilter) {
      const flat = groups.flatMap(g => g.items).sort((a, b) => a.changeOrder - b.changeOrder);
      groups = flat.length ? [{ id: 'chg', label: '', name: 'Changes since your visit on Oct 2', meta: `${flat.length} ${flat.length === 1 ? 'request' : 'requests'} · reopened first`, items: flat, hasSrc: false, row: 0, hasBar: false, pct: 0 }] : [];
    }
    this.groups = groups;

    // Selected
    this.sel = this.selVm(reqs);
    this.showPanel = isResults && this.layout !== 'folders' && ((this.panel === 'item' && !!this.sel) || this.panel === 'diff');

    // Source sheet
    this.buildSource();

    // Folders
    if (isResults && this.layout === 'folders') this.fv = this.foldersView(reqs);
  }

  private rowVm(r: Req & { origText?: string; edited?: boolean }, rec: Rec): RowVm {
    const phase = this.phase; const isResults = phase === 'results';
    const s = rec.s;
    let prefix = '', note = '', noteTone: Tone = 'muted';
    let chipNames: string[] = [];
    if (phase === 'structure') {
      if (r.flag && !this.flagResolved) { note = `Text looks cut off in the source. Read as: “${r.readAs}”`; noteTone = 'warn'; }
    } else if (phase === 'matching') {
      if (s === 'found') chipNames = r.docs ? [r.docs[0]] : [r.cand!.name];
    } else {
      if (s === 'covered') chipNames = rec.docs || r.docs || [];
      else if (s === 'partial') { chipNames = rec.docs || []; note = 'Missing: ' + (rec.missing || r.cand?.missing || '') + (rec.requested ? (this.isBidder ? '  ·  asked in Q&A' : '  ·  requested from seller') : ''); noteTone = 'warn'; }
      else if (s === 'review') { prefix = 'Suggested'; chipNames = [r.cand!.name]; }
      else if (s === 'gap') {
        if (rec.reopened) note = 'Linked file deleted, now in the recycle bin';
        else if (rec.rejected) note = 'Suggestion rejected';
        else if (r.near) { prefix = 'Closest, below threshold'; chipNames = [r.near.name]; }
        else note = 'Nothing found';
        noteTone = 'error';
      }
      else if (s === 'na') note = 'Marked not applicable';
    }
    const all = chipNames.map(c => this.chip(c));
    const LIMIT = 3; const exp = !!this.expanded[r.id];
    if (!prefix && all.length > 1 && (s === 'covered' || s === 'partial')) prefix = `${all.length} files linked`;

    const miss = rec.missing || r.cand?.missing || '';
    const reqA = this.isBidder ? 'Ask in Q&A' : 'Request from seller';
    const reqDone = this.isBidder ? ' · asked in Q&A' : ' · requested from seller';
    let next = '—', nextTone: Tone = 'muted', action = '';
    if (s === 'partial') { next = 'Missing: ' + miss + (rec.requested ? reqDone : ''); nextTone = 'warn'; action = rec.requested ? '' : reqA; }
    else if (s === 'review') { next = r.cand?.verdict === 'Partial' ? 'Partial · missing ' + miss.charAt(0).toLowerCase() + miss.slice(1) : 'Likely match'; nextTone = 'warn'; action = 'Review'; }
    else if (s === 'gap') { next = rec.reopened ? 'Linked file deleted' : rec.rejected ? 'Suggestion rejected' : r.near ? 'Nothing above threshold' : 'Nothing found'; if (rec.requested) next += reqDone; nextTone = 'error'; action = rec.requested ? '' : reqA; }
    else if (s === 'na') next = 'Not applicable';
    else if (s === 'question') { next = rec.requested ? (this.isBidder ? 'Added to Q&A' : 'Answer requested from seller') : 'Needs a written answer'; action = rec.requested ? '' : (this.isBidder ? 'Send to Q&A' : 'Request answer'); }
    else if (s === 'instruction' || s === 'note') next = 'Kept for reference';

    const showReadAs = r.readAs && (this.flagResolved || isResults || phase === 'matching');
    const isEditing = phase === 'structure' && this.editRowId === r.id;
    const srcOrig = (REQS.find(x => x.id === r.id) || r).text;
    const ch = rec.change;
    let tag: RowVm['tag'] = null;
    if (ch) tag = { label: ch.kind === 'reopened' ? 'Changed' : 'New', variant: CHANGE_VARIANT[ch.kind] };
    else if (rec.isNew) tag = { label: 'New', variant: 'green' };
    else if (r.edited) tag = { label: 'Edited', variant: 'grey' };
    const reason = isResults && ch ? ch.reason : (r.edited && !isEditing ? `Edited by you. Original in your file: “${r.origText || srcOrig}”` : '');

    return {
      id: r.id, label: this.lbl(r), row: r.row, text: (showReadAs ? r.readAs : r.text) as string, pill: this.pill(s),
      chips: all.length > LIMIT && !exp ? all.slice(0, LIMIT) : all, allCount: all.length,
      hasMore: all.length > LIMIT, expanded: exp, moreLabel: exp ? 'Show fewer' : `Show ${all.length - LIMIT} more`,
      prefix, note, noteTone, next, nextTone, action,
      actionHint: action === 'Review' ? 'Open the suggestion to accept or reject it'
        : this.isBidder ? 'Bidder checklist: missing items become questions to the seller in Q&A'
        : 'Sell-side data collection: ask the seller team to upload it. Bidder checklists use Q&A here instead.',
      flagOpen: !!(r.flag && phase === 'structure' && !this.flagResolved), isEditing, canEdit: phase === 'structure' && !isEditing,
      isEdited: !!r.edited, tag, reason, reasonTone: isResults && ch ? CHANGE_TONE[ch.kind] : 'muted',
      selected: isResults && this.selected === r.id, muted: s === 'na' || s === 'note' || s === 'instruction',
      changeOrder: ch ? ({ reopened: 0, closed: 1, suggested: 2 })[ch.kind] : 9,
      noFilesText: s === 'question' ? 'Answered in writing' : (s === 'instruction' || s === 'note' ? 'Not matched' : '—'),
    };
  }

  private selVm(reqs: Req[]) {
    const r = this.selected ? reqs.find(x => x.id === this.selected) : undefined;
    if (!r || this.phase !== 'results') return null;
    const rec = this.st[r.id] || { s: 'pending' };
    const rids = this.reviewIds();
    const qi = rids.indexOf(r.id);
    const cd = r.cand ? this.doc(r.cand.name) : { path: '', summary: '' };
    const nd = r.near ? this.doc(r.near.name) : { path: '' };
    const linked = rec.docs || r.docs || [];
    const sec = SECTIONS.find(x => x.id === r.sec);
    return {
      id: r.id, label: this.lbl(r), row: r.row, text: r.readAs || r.text, original: r.text, hasOriginal: !!r.readAs,
      pill: this.pill(rec.s),
      isReview: rec.s === 'review', isCovered: rec.s === 'covered' || rec.s === 'partial', isPartial: rec.s === 'partial',
      isGap: rec.s === 'gap', isQuestion: rec.s === 'question', isInstruction: rec.s === 'instruction', isNote: rec.s === 'note', isNa: rec.s === 'na',
      queue: qi >= 0 ? `${qi + 1} of ${rids.length} to review` : '',
      docName: r.cand?.name || '', docPath: cd.path, summary: cd.summary, why: r.cand?.why || '',
      verdict: r.cand?.verdict || '', missing: r.cand?.missing || '',
      docs: linked.map(n => {
        const d = this.doc(n);
        const others = reqs.filter(q => {
          if (q.id === r.id) return false;
          const rc = this.st[q.id];
          if (!rc || (rc.s !== 'covered' && rc.s !== 'partial')) return false;
          return (rc.docs || q.docs || []).includes(n);
        }).map(q => q.id);
        return { name: n, label: d.label || n, type: this.fileType(n), isFolder: !!d.folder, meta: d.path + (others.length ? '  ·  also linked to ' + others.join(', ') : '') };
      }),
      coverWhy: rec.why || r.why || r.cand?.why || '',
      partialMissing: rec.missing || r.cand?.missing || '',
      gapTitle: rec.reopened ? 'Reopened: the linked file was deleted' : rec.rejected ? 'Suggestion rejected' : r.near ? 'Nothing above the match threshold' : 'Nothing found',
      gapText: rec.reopened ? 'Org chart Sep 2026.pdf was deleted by Olena K. on Oct 6 and is in the recycle bin. Restore it, or ask the seller for a current version.'
        : rec.rejected ? 'The suggested document was rejected. Ask the seller for it, link another document, or mark the request not applicable.' : (r.note || ''),
      hasNear: !!(r.near && !rec.rejected), nearName: r.near?.name || '', nearPath: nd.path, nearWhy: r.near?.why || '',
      requested: !!rec.requested, isReopened: !!rec.reopened,
      srcLine: r.sec === 'X' ? `Source: Master Checklist, row ${r.row} · outside any section`
        : `Source: Master Checklist, row ${r.row} · item ${r.id.split('.')[1]} under “${sec?.src.replace(/:$/, '')}”`,
      canEditReading: r.cls === 'document_request' || r.cls === 'question',
      reading: rec.reading || r.readAs || r.text, readingEdited: !!rec.reading,
    };
  }

  private buildSource() {
    const sreqs = this.withEdits(this.sourceEdited);
    const rows: SrcRow[] = [{ n: 1, kind: 'header', b: 'Item #', c: 'Due Diligence Checklist', d: 'File Type', e: 'Date Requested', f: 'Status', g: 'Notes to Seller', h: 'Delivered' }];
    SECTIONS.forEach(sec => {
      rows.push({ n: sec.row, kind: 'section', c: sec.src });
      let i = 0;
      sreqs.filter(q => q.sec === sec.id).forEach(q => { i += 1; rows.push({ n: q.row, kind: 'item', b: String(i), c: q.text, d: q.ftype, e: '', f: q.status || 'Open', g: '', h: q.sec === 'A' ? 'FALSE' : '' }); });
    });
    sreqs.filter(q => q.sec === 'X').forEach(q => rows.push({ n: q.row, kind: 'meta', c: q.text }));
    if (!sreqs.find(q => q.row === 41)) rows.push({ n: 41, kind: 'blank', c: '' });
    rows.sort((a, b) => a.n - b.n);
    this.sourceRows = rows;
    const hl = this.highlightRow;
    this.hlCell = hl !== null ? (rows.find(x => x.n === hl)?.c || '') : '';
    const hlReq = this.findReq(this.backTo);
    const what = hlReq ? (hlReq.label ? 'this ' + hlReq.cls : 'request ' + hlReq.id) : (this.backTo || 'this item');
    this.hlText = `Row ${hl} of Master Checklist is the source of ${what}. The file is shown as it is, nothing is drawn over it.`;
  }

  private foldersView(reqs: Req[]) {
    const gone = this.deletedFiles;
    const tree: FolderNode[] = FOLDER_TREE.map(f => ({ ...f, files: f.files.filter(n => !gone.includes(n) && (this.returningCands || !LATER_FILES.includes(n))) }));
    const byId: Record<string, FolderNode> = {}; tree.forEach(f => byId[f.id] = f);
    const linkToFolder: Record<string, string> = {}; tree.forEach(f => { if (f.link) linkToFolder[f.link] = f.id; });
    const fpass = (s?: string) => {
      const f = this.filter;
      if (f === 'all' || f === 'other') return true;
      if (f === 'covered') return s === 'covered' || s === 'partial';
      return s === f;
    };
    const allDocReqs = reqs.filter(r => this.isDoc(r));
    const docReqs = allDocReqs.filter(r => fpass(this.st[r.id]?.s));
    type Use = { id: string; type: string };
    const fileUse: Record<string, Use[]> = {}, folderUse: Record<string, Use[]> = {}, reqFiles: Record<string, string[]> = {}, reqFolder: Record<string, string> = {};
    const add = (map: Record<string, Use[]>, k: string, id: string, type: string) => { (map[k] = map[k] || []).push({ id, type }); };
    docReqs.forEach(r => {
      const rec = this.st[r.id] || { s: 'pending' };
      const type = rec.s === 'covered' ? 'linked' : rec.s === 'partial' ? 'partial' : null;
      const files: string[] = [];
      if (type) (rec.docs || r.docs || []).forEach(d => { if (linkToFolder[d]) { add(folderUse, linkToFolder[d], r.id, type); reqFolder[r.id] = linkToFolder[d]; } else { add(fileUse, d, r.id, type); files.push(d); } });
      if (rec.s === 'review' && r.cand) { add(fileUse, r.cand.name, r.id, 'suggested'); files.push(r.cand.name); }
      if (rec.s === 'gap' && r.near && !rec.rejected) { add(fileUse, r.near.name, r.id, 'closest'); files.push(r.near.name); }
      reqFiles[r.id] = files;
    });
    const desc = (fid: string): string[] => { let out = [fid]; tree.forEach(f => { if (f.parent === fid) out = out.concat(desc(f.id)); }); return out; };
    const subUses = (fid: string) => { const u: Use[] = []; desc(fid).forEach(id => { byId[id].files.forEach(n => (fileUse[n] || []).forEach(x => u.push(x))); (folderUse[id] || []).forEach(x => u.push(x)); }); return u; };
    const subFiles = (fid: string) => desc(fid).flatMap(id => byId[id].files);
    let selId: string | null = this.fSelFile ? null : (this.fSelReq || 'D.4');
    if (selId && !docReqs.find(r => r.id === selId)) selId = docReqs.length ? docReqs[0].id : null;
    const sel = selId ? docReqs.find(r => r.id === selId) : undefined;
    const selFiles = sel ? (reqFiles[sel.id] || []) : [];
    const selFolder = sel ? reqFolder[sel.id] : undefined;
    const related = (fid: string) => {
      if (selFolder && (desc(selFolder).includes(fid) || desc(fid).includes(selFolder))) return true;
      const files = subFiles(fid);
      if (this.fSelFile) return files.includes(this.fSelFile);
      return selFiles.some(n => files.includes(n));
    };
    const isOpen = (f: FolderNode) => this.fOpen[f.id] !== undefined ? this.fOpen[f.id] : related(f.id);
    const visible = (f: FolderNode): boolean => { if (!f.parent) return true; const p = byId[f.parent]; return visible(p) && isOpen(p); };
    const chipsFor = (uses: Use[]) => { const seen: Record<string, 1> = {}; const list: Use[] = []; uses.forEach(u => { if (!seen[u.id]) { seen[u.id] = 1; list.push(u); } }); return list.map(u => ({ id: u.id, variant: FOLDER_CHIP[u.type] })); };

    const rows: FolderRowVm[] = [];
    tree.forEach(f => {
      const uses = subUses(f.id);
      if (this.fHideUnused && !f.parent && uses.length === 0) return;
      if (!visible(f)) return;
      const op = isOpen(f), rel = related(f.id), all = chipsFor(uses);
      const linkedHere = selFolder === f.id;
      const used = f.files.filter(n => fileUse[n]).length;
      let meta = f.count ? `${f.count} documents` : (f.files.length ? `${used} of ${f.files.length} files used` : '');
      if (linkedHere) meta = `Linked as a whole folder, ${f.count} documents`;
      rows.push({ key: 'f-' + f.id, isFolder: true, name: f.name, meta, depth: f.depth, expanded: op, related: rel, linkedHere, unused: uses.length === 0, picked: false,
        tint: linkedHere ? 'linked' : rel ? 'related' : 'none', type: rel ? 'folder-open' : 'folder', chips: all.slice(0, 6), moreChips: all.length - 6, folderId: f.id });
      if (!op) return;
      f.files.forEach(n => {
        const u = fileUse[n] || [];
        const mine = sel ? u.find(x => x.id === sel.id) : undefined;
        const picked = this.fSelFile === n;
        rows.push({ key: 'x-' + f.id + n, isFolder: false, name: n, meta: '', depth: f.depth + 1, expanded: false, related: false, linkedHere: false,
          unused: u.length === 0, picked, tint: mine ? mine.type : 'none', type: this.fileType(n), chips: chipsFor(u), moreChips: 0, fileName: n });
      });
    });

    const names: Record<string, string> = { A: 'General information', B: 'Financial and accounting', C: 'Legal', D: 'Human resources', E: 'Tax', F: 'Operations' };
    const fileReqs = this.fSelFile ? (fileUse[this.fSelFile] || []).map(u => u.id) : [];
    const groups = ['A', 'B', 'C', 'D', 'E', 'F'].filter(sid => docReqs.some(r => r.sec === sid)).map(sid => ({
      id: sid, name: names[sid],
      items: docReqs.filter(r => r.sec === sid).map(r => {
        const rec = this.st[r.id] || { s: 'pending' };
        const cnt = (reqFiles[r.id] || []).length;
        const label = reqFolder[r.id] ? 'Folder' : cnt ? (rec.s === 'review' ? 'Suggested' : rec.s === 'gap' ? 'Closest only' : `${cnt} ${cnt === 1 ? 'file' : 'files'}`) : (rec.s === 'na' ? 'N/A' : 'Nothing found');
        return { id: r.id, text: r.readAs || r.text, state: rec.s, countLabel: label, isSel: selId === r.id, hit: fileReqs.includes(r.id) };
      }),
    }));

    let kicker = '', title = '', sub = '';
    if (sel) {
      const rec2 = this.st[sel.id] || { s: 'pending' };
      const fset: Record<string, 1> = {};
      selFiles.forEach(n => tree.forEach(f => { if (f.files.includes(n)) fset[f.id] = 1; }));
      const fc = Object.keys(fset).length;
      kicker = 'Selected request · ' + sel.id; title = sel.readAs || sel.text;
      if (selFolder) sub = `Linked to a whole folder: ${byId[selFolder].name}, ${byId[selFolder].count} documents.`;
      else if (rec2.s === 'review') sub = 'One suggested file, waiting for review.';
      else if (rec2.s === 'gap') sub = selFiles.length ? 'Nothing above the match threshold. The closest file is highlighted.' : 'No file in the room matches this request.';
      else if (rec2.s === 'na') sub = 'Marked not applicable.';
      else sub = `${selFiles.length} ${selFiles.length === 1 ? 'file' : 'files'} in ${fc} ${fc === 1 ? 'folder' : 'folders'}, highlighted below.`;
    } else if (this.fSelFile) {
      kicker = 'Selected file'; title = this.fSelFile;
      sub = fileReqs.length ? `Used by ${fileReqs.join(', ')}. These requests are highlighted on the left.` : 'Not used by any request in this checklist.';
    }
    const cov = allDocReqs.filter(r => this.st[r.id]?.s === 'covered' || this.st[r.id]?.s === 'partial').length;
    return {
      groups, rows, kicker, title, sub, hasReq: !!sel, selId: sel?.id,
      coveredLabel: this.filter !== 'all' && this.filter !== 'other' ? `${docReqs.length} of ${allDocReqs.length} shown` : `${cov} of ${allDocReqs.length} covered`,
    };
  }
}
