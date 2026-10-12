import { Router } from '@angular/router';
import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type {
  SidebarNavItem, HeaderAction, BreadcrumbItem, SegmentItem, TabItem, DropdownOption, ChipVariant, FvdrFileType,
} from '../../shared/ds';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import { DIAMOND, Req, ReqCls, MatchState, DocInfo, FolderNode, Rec, ChangeKind, SrcRow, Scenario } from './checklist-matching.data';
import { LIGHTHOUSE } from './lighthouse.data';

type Phase = 'empty' | 'uploading' | 'none' | 'reading' | 'failed' | 'structure' | 'matching' | 'results';
type Screen = 'upload' | 'source' | 'structure' | 'readfail' | 'matching' | 'triage' | 'gaps' | 'returning';
type Filter = 'all' | 'review' | 'gap' | 'covered' | 'other';
type Layout = 'table' | 'list' | 'folders';
type Tone = 'default' | 'muted' | 'warn' | 'error' | 'success';

interface DocChip { name: string; label: string; path: string; type: FvdrFileType; isFolder: boolean; }
interface Pill { label: string; variant: ChipVariant; pulse?: boolean; }

interface RowVm {
  id: string; label: string; row: number; text: string; pill: Pill; priority: string; asAt: string;
  chips: DocChip[]; allCount: number; hasMore: boolean; expanded: boolean; moreLabel: string;
  prefix: string; note: string; noteTone: Tone;
  next: string; nextTone: Tone; action: string; actionHint: string; issue: string; line: string; lineTone: Tone;
  flagOpen: boolean; isEditing: boolean; canEdit: boolean; isEdited: boolean;
  tag: { label: string; variant: ChipVariant } | null; reason: string; reasonTone: Tone;
  selected: boolean; muted: boolean; changeOrder: number; noFilesText: string;
}
interface GroupVm { id: string; label: string; name: string; meta: string; items: RowVm[]; hasSrc: boolean; row: number; pct: number; hasBar: boolean; }

interface FolderRowVm {
  key: string; isFolder: boolean; name: string; meta: string; depth: number; expanded: boolean; related: boolean;
  linkedHere: boolean; unused: boolean; picked: boolean; tint: string; type: FvdrFileType;
  chips: { id: string; variant: ChipVariant }[]; moreChips: number; folderId?: string; fileName?: string;
}

const SCENARIOS: Record<string, Scenario> = { lighthouse: LIGHTHOUSE, diamond: DIAMOND };

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

/**
 * Due diligence checklist — AI matching.
 * Upload an Excel checklist → AI extracts requests (and the checklist's own details) → user checks the reading →
 * match against the room → triage suggestions, gaps and folders → write results back into the file's columns.
 * Two scenarios: Lighthouse (buy-side IRL, header row 5, result columns in the file) and Diamond (sell-side master checklist).
 */
@Component({
  selector: 'fvdr-checklist-matching',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent],
  template: `
  <div class="page">
    <fvdr-sidebar-nav variant="vdr" [accountName]="sc.room" [items]="nav" [(collapsed)]="sidebarCollapsed" />

    <div class="main">
      <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="VO" />

      <div class="content" #content [class.content--drawer]="drawerOpen">

        <!-- ═══ Upload ═══ -->
        <section class="upload" *ngIf="phase === 'empty' || phase === 'uploading'" aria-label="Upload checklist">
          <div class="drop" *ngIf="phase === 'empty'">
            <span class="drop__icon"><fvdr-icon name="upload" /></span>
            <h2 class="drop__title">Upload your due diligence checklist</h2>
            <p class="drop__text">Drag an Excel file here or choose one from your computer.</p>
            <div class="consent" *ngIf="roomAiOn">
              <fvdr-checkbox [checked]="aiConsent" (checkedChange)="aiConsent = $event" label="Extract requests with AI after upload" />
              <p class="consent__hint">Only the checklist's text is read. Nothing is matched until you start it.</p>
            </div>
            <div class="consent consent--off" *ngIf="!roomAiOn">
              <p class="consent__hint">AI is off for this room. A project admin can turn it on in Settings.</p>
            </div>
            <fvdr-btn label="Choose file" (clicked)="upload()" />
            <span class="drop__caption">Excel files (.xlsx)</span>
          </div>

          <div class="drop drop--uploading" *ngIf="phase === 'uploading'">
            <div class="up-file">
              <fvdr-file-icon type="xls" />
              <div class="up-file__body">
                <span class="up-file__name">{{ sc.fileName }}</span>
                <span class="up-file__meta">{{ sc.fileMeta }} · uploading {{ upPct }}%</span>
                <div class="bar"><div class="bar__fill" [style.width.%]="upPct"></div></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Checklist ═══ -->
        <ng-container *ngIf="hasChecklist">
          <div class="tabs-row">
            <fvdr-tabs [tabs]="tabs" [activeId]="sc.id" />
            <fvdr-btn variant="ghost" size="s" iconName="plus" [iconOnly]="true" ariaLabel="Add checklist" />
          </div>

          <div class="toolbar">
            <fvdr-segment [items]="viewItems" [activeId]="view" (activeIdChange)="setView($event)" />
            <span class="spacer"></span>
            <div class="export" *ngIf="view === 'requests' && phase === 'results'">
              <fvdr-btn label="Export" iconName="download" variant="secondary" size="m" (clicked)="exportOpen = !exportOpen" />
              <div class="menu" *ngIf="exportOpen" role="menu">
                <div class="menu__warn" *ngIf="(counts['review'] || 0) > 0">
                  <fvdr-icon name="warning" />
                  <div class="menu__warn-body">
                    <span><b>{{ counts['review'] }} suggestions not reviewed.</b> They're exported as notes, not as matches.</span>
                    <span class="menu__warn-links">
                      <button class="lnk" (click)="exportOpen = false; startReview()">Review first</button>
                      <button class="lnk" *ngIf="hasResultCols" (click)="exportOpen = false; previewResults = true; setView('source')">Preview in file</button>
                    </span>
                  </div>
                </div>
                <button class="menu__item" role="menuitem" (click)="doExport('file')">
                  <span class="menu__title">{{ sc.tabLabel }} with results (.xlsx)</span>
                  <span class="menu__sub" *ngIf="sc.details?.resultCols">Fills the file's own {{ sc.details!.resultCols!.join(', ') }} columns, using its Status values. Unreviewed suggestions are left as notes.</span>
                  <span class="menu__sub" *ngIf="!sc.details?.resultCols">A copy of your file with Status, Documents and Missing columns added.</span>
                </button>
                <button class="menu__item" role="menuitem" (click)="doExport('gap')">
                  <span class="menu__title">Gap report (.xlsx)</span>
                  <span class="menu__sub">Gaps and partial requests with their original wording, source rows and what's missing.</span>
                </button>
                <span class="menu__foot">The file in the room stays unchanged.</span>
              </div>
            </div>
            <span class="owner" fvdrTooltip="Only people who can edit this checklist see the requests and AI results" tooltipPosition="bottom"><fvdr-avatar initials="VO" size="sm" /> Only you</span>
            <fvdr-btn label="Share" iconName="share" variant="secondary" size="m" />
          </div>

          <!-- File actions belong to the Source file mode, so they sit under the mode switch -->
          <div class="toolbar__actions" *ngIf="view === 'source'">
            <fvdr-btn label="Edit" iconName="edit" size="m" />
            <fvdr-btn label="Upload new version" iconName="refresh" variant="secondary" size="m" />
            <fvdr-btn label="Download" iconName="download" variant="secondary" size="m" />
            <fvdr-btn label="Delete" iconName="trash" variant="danger-secondary" size="m" />
          </div>

          <!-- ─── Source file ─── -->
          <ng-container *ngIf="view === 'source'">
            <div class="aibar" *ngIf="highlightRow === null && phase !== 'empty' && phase !== 'uploading'">
              <ng-container *ngIf="phase === 'none' && roomAiOn">
                <fvdr-btn label="Extract requests" (clicked)="extract('source')" />
                <span class="aibar__text"><b>Turn this checklist into requests.</b> AI lists every request in the file, linked to its row. The file isn't changed.</span>
              </ng-container>
              <span class="aibar__text" *ngIf="phase === 'none' && !roomAiOn">AI is off for this room. A project admin can turn it on in Settings.</span>
              <ng-container *ngIf="phase === 'reading'">
                <span class="ring ring--bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="readPct" [style.--p]="readPct"></span>
                <span class="aibar__text"><b>Reading the checklist…</b> {{ readSheet }} · row {{ readRowInSheet }} of {{ readSheetRows }}</span>
              </ng-container>
              <ng-container *ngIf="phase === 'structure'">
                <fvdr-btn label="Review requests" (clicked)="setView('requests')" />
                <span class="aibar__text"><b>{{ foundLine }}.</b> Check what AI read, then match them to documents.</span>
              </ng-container>
              <ng-container *ngIf="phase === 'matching'">
                <span class="ring ring--bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="progress * 100" [style.--p]="progress * 100"></span>
                <span class="aibar__text"><b>Matching…</b> {{ docsRead }} of {{ totalDocsLabel }} documents · {{ etaLabel }}</span>
              </ng-container>
              <ng-container *ngIf="phase === 'results'">
                <span class="aibar__text aibar__grow">{{ srcInfoText }}</span>
                <fvdr-toggle *ngIf="hasResultCols" [(checked)]="previewResults" label="Show results in the file" (checkedChange)="recompute()" />
              </ng-container>
            </div>
            <div class="aibar" *ngIf="highlightRow !== null">
              <fvdr-btn label="Back to request" variant="secondary" (clicked)="backToRequest()" />
              <span class="aibar__text aibar__grow">{{ hlText }}</span>
            </div>

            <div class="sheet">
              <div class="sheet__formula">
                <fvdr-icon name="search" class="sheet__search" />
                <span class="sheet__ref">{{ highlightRow !== null ? 'C' + highlightRow : 'A1' }}</span>
                <span class="sheet__val">{{ hlCell || sourceRows[0]?.cells?.[0] }}</span>
              </div>
              <div class="sheet__scroll">
                <div class="sheet__grid">
                  <div class="sr sr--cols" [style.grid-template-columns]="gridCols">
                    <span class="sc sc--n"></span>
                    <span class="sc" *ngFor="let c of sheetCols">{{ c }}</span>
                  </div>
                  <div *ngFor="let r of sourceRows" class="sr" [ngClass]="'sr--' + r.kind" [class.sr--hl]="highlightRow === r.n"
                       [style.grid-template-columns]="gridCols">
                    <span class="sc sc--n">{{ r.n }}</span>
                    <span class="sc sc--span" *ngIf="isSpanRow(r)">{{ r.cells[0] }}</span>
                    <ng-container *ngIf="!isSpanRow(r)">
                      <span class="sc" *ngFor="let i of colIdx" [class.sc--sel]="r.kind === 'item' && sc.source.selectCols.includes(i)"
                            [class.sc--yellow]="r.kind === 'item' && sc.source.resultCols.includes(i)"
                            [class.sc--filled]="r.kind === 'item' && sc.source.resultCols.includes(i) && !!cellText(r, i)"
                            [class.sc--right]="i === 1 && sc.id === 'diamond'">{{ cellText(r, i) }}<fvdr-icon *ngIf="r.kind === 'item' && sc.source.selectCols.includes(i)" name="chevron-down" /></span>
                    </ng-container>
                  </div>
                </div>
              </div>
              <div class="sheet__tabs">
                <span class="sheet__tab" *ngFor="let s of sc.sheets; let first = first" [class.sheet__tab--on]="first">{{ s.name }}</span>
                <span class="spacer"></span>
                <span class="sheet__zoom">100%</span>
              </div>
            </div>
          </ng-container>

          <!-- ─── Requests ─── -->
          <ng-container *ngIf="view === 'requests'">

            <!-- Returning user: what changed, one line -->
            <section class="delta" *ngIf="phase === 'results' && delta" aria-label="Changes since your last visit">
              <span class="delta__title">Since {{ sc.returning.since }}</span>
              <fvdr-chip *ngFor="let c of changeChips" [label]="c.label" [variant]="c.variant" size="s" [rounded]="true"
                         [clickable]="true" [selected]="changeFilter === c.kind" (clicked)="pickChange(c.kind)" />
              <fvdr-btn *ngIf="changeFilter" label="Show all requests" variant="link" size="s" (clicked)="changeFilter = null; recompute()" />
              <span class="spacer"></span>
              <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Dismiss" (clicked)="delta = false; changeFilter = null; recompute()" />
            </section>

            <div class="aibar" *ngIf="phase === 'results' && stale">
              <fvdr-btn label="Review changes" variant="secondary" (clicked)="openDiff()" />
              <span class="aibar__text"><b>The file was edited after extraction.</b> 1 request added, 1 changed.</span>
            </div>

            <!-- Before results: one grey bar, primary action first -->
            <div class="aibar" *ngIf="phase === 'none' || phase === 'reading' || phase === 'structure' || phase === 'matching'">
              <ng-container *ngIf="phase === 'none'">
                <fvdr-btn *ngIf="roomAiOn" label="Extract requests" (clicked)="extract()" />
                <span class="aibar__text" *ngIf="roomAiOn"><b>Turn this checklist into requests.</b> AI lists every request in the file, linked to its row. The file isn't changed.</span>
                <span class="aibar__text" *ngIf="!roomAiOn">AI is off for this room. A project admin can turn it on in Settings.</span>
              </ng-container>
              <ng-container *ngIf="phase === 'reading'">
                <span class="ring ring--bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="readPct" [style.--p]="readPct"></span>
                <span class="aibar__text"><b>Reading the checklist…</b> {{ readSheet }} · row {{ readRowInSheet }} of {{ readSheetRows }}</span>
              </ng-container>
              <ng-container *ngIf="phase === 'structure'">
                <fvdr-dropdown class="scope" [options]="scopeOptions" [value]="scope" (valueChange)="scope = asString($event)" />
                <fvdr-btn [label]="'Match ' + typeChips.docCount + ' requests'" (clicked)="startMatching()" />
                <span class="aibar__text aibar__grow">{{ structLine }}</span>
                <button class="lnk" (click)="openRead()">What AI read</button>
              </ng-container>
              <ng-container *ngIf="phase === 'matching'">
                <span class="ring ring--bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="progress * 100" [style.--p]="progress * 100"></span>
                <span class="aibar__text aibar__grow"><b>Matching…</b> {{ docsRead }} of {{ totalDocsLabel }} documents · {{ etaLabel }}</span>
                <fvdr-btn label="Stop" variant="secondary" (clicked)="stopMatching()" />
              </ng-container>
            </div>

            <div class="empty" *ngIf="phase === 'failed'">
              <h2 class="empty__title">AI couldn't find requests in this file</h2>
              <p class="empty__text">No header row with a request column was found. Pick the header row and read again, or upload another file.</p>
              <div class="fail-actions">
                <fvdr-dropdown label="Header row" size="m" [options]="headerRowOptions" [value]="'' + headerRow" (valueChange)="headerRow = +asString($event)" />
                <fvdr-btn label="Read again" (clicked)="extract()" />
                <fvdr-btn label="Upload another file" variant="secondary" (clicked)="goScreen('upload')" />
              </div>
            </div>

            <!-- Results: filters, coverage, next step — no background -->
            <div class="rbar" *ngIf="phase === 'results'">
              <fvdr-segment variant="table" size="md" [items]="filterItems" [activeId]="changeFilter ? '' : filter" (activeIdChange)="pickFilter($any($event))" />
              <div class="covp">
                <span class="covp__val" [attr.aria-label]="pct + '% of document requests covered'">
                  <span class="ring" [style.--p]="pct" aria-hidden="true"></span>
                  <span><b>{{ pct }}%</b> covered</span>
                </span>
                <button class="lnk" (click)="openRead()">What AI read</button>
              </div>
              <div class="rbar__r">
                <fvdr-btn *ngIf="filter !== 'gap' && (counts['review'] || 0) > 0 && !showPanel" [label]="'Review ' + counts['review'] + ' suggestions'" (clicked)="startReview()" />
                <fvdr-btn *ngIf="filter === 'gap' && askableGaps.length" [label]="(isBidder ? 'Ask about ' : 'Request ') + askableGaps.length + ' gaps'" (clicked)="openBulkAsk()" />
                <fvdr-segment variant="table" size="md" [items]="layoutItems" [activeId]="layout" (activeIdChange)="pickLayout($event)" />
              </div>
            </div>

            <div class="ws" *ngIf="phase === 'structure' || phase === 'matching' || phase === 'results'">

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

                <!-- Table layout: status, ref, priority, request, documents — one note per row -->
                <div class="tbl-wrap" *ngIf="phase === 'results' && layout === 'table'">
                  <div class="tbl" role="table" aria-label="Requests and matched documents" [class.tbl--narrow]="drawerOpen">
                    <div class="tr tr--head" role="row" [style.grid-template-columns]="tblCols">
                      <span role="columnheader">Status</span>
                      <span role="columnheader">Ref</span>
                      <span role="columnheader" *ngIf="sc.hasPriority && !drawerOpen">Priority</span>
                      <span role="columnheader">Request</span>
                      <span role="columnheader">Documents</span>
                    </div>
                    <div *ngIf="!groups.length" class="tbl-empty">Nothing here. Try another filter.</div>
                    <ng-container *ngFor="let g of groups; trackBy: byId">
                      <div class="tr tr--group" role="row">
                        <span class="g-label">{{ g.label }}</span>
                        <span class="g-name">{{ g.name }}</span>
                        <span class="spacer"></span>
                        <span class="muted">{{ g.meta }}</span>
                      </div>
                      <div *ngFor="let it of g.items; trackBy: byId" class="tr tr--item" role="row" [class.tr--sel]="it.selected"
                           [style.grid-template-columns]="tblCols" (click)="select(it.id)">
                        <span role="cell"><fvdr-chip [label]="it.pill.label" [variant]="it.pill.variant" size="s" [class.pulse]="it.pill.pulse" /></span>
                        <div role="cell" class="c-id"><span>{{ it.label }}</span><fvdr-chip *ngIf="it.tag" [label]="it.tag.label" [variant]="it.tag.variant" size="xs" /></div>
                        <div role="cell" *ngIf="sc.hasPriority && !drawerOpen">{{ it.priority || '—' }}</div>
                        <div role="cell" class="c-text">
                          <span [class.t-muted]="it.muted">{{ it.text }}</span>
                          <span class="t-asat" *ngIf="it.asAt">As at {{ it.asAt }}</span>
                          <span *ngIf="it.reason" class="t-note" [ngClass]="'tone--' + it.reasonTone">{{ it.reason }}</span>
                        </div>
                        <div role="cell" class="c-docs">
                          <div class="doc-list" *ngIf="it.chips.length">
                            <div class="tdoc" *ngFor="let c of it.chips"><fvdr-file-icon [type]="c.type" /><span class="tdoc__name">{{ c.label }}</span></div>
                          </div>
                          <button class="more" *ngIf="it.hasMore" (click)="toggleMore(it.id); $event.stopPropagation()">{{ it.moreLabel }}</button>
                          <span *ngIf="it.line" class="t-note" [ngClass]="'tone--' + it.lineTone">{{ it.line }}</span>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                </div>

                <!-- List: structure check and matching -->
                <div class="tbl-wrap" *ngIf="phase !== 'results'">
                  <div class="tbl tbl--list" role="table" aria-label="Requests">
                    <div class="tr tr--head" role="row" [style.grid-template-columns]="listCols">
                      <span role="columnheader">{{ phase === 'structure' ? 'Type' : 'Status' }}</span>
                      <span role="columnheader">Ref</span>
                      <span role="columnheader" *ngIf="sc.hasPriority">Priority</span>
                      <span role="columnheader">Request</span>
                      <span role="columnheader" class="c-right">Row</span>
                    </div>
                    <ng-container *ngFor="let g of groups; trackBy: byId">
                      <div class="tr tr--group" role="row">
                        <span class="g-label">{{ g.label }}</span>
                        <span class="g-name">{{ g.name }}</span>
                        <span class="spacer"></span>
                        <span class="muted">{{ g.meta }}</span>
                      </div>
                      <div *ngFor="let it of g.items; trackBy: byId" class="tr tr--item" role="row" [style.grid-template-columns]="listCols"
                           [class.tr--flag]="it.flagOpen" [class.tr--editing]="it.isEditing">
                        <span role="cell"><fvdr-chip [label]="it.pill.label" [variant]="it.pill.variant" size="s" [class.pulse]="it.pill.pulse" /></span>
                        <div role="cell" class="c-id"><span>{{ it.label }}</span><fvdr-chip *ngIf="it.tag" [label]="it.tag.label" [variant]="it.tag.variant" size="xs" /></div>
                        <div role="cell" *ngIf="sc.hasPriority">{{ it.priority || '—' }}</div>
                        <div role="cell" class="c-text">
                          <ng-container *ngIf="!it.isEditing">
                            <span [class.t-muted]="it.muted">{{ it.text }}</span>
                            <span class="t-asat" *ngIf="it.asAt">As at {{ it.asAt }}</span>
                            <span *ngIf="it.reason" class="t-note" [ngClass]="'tone--' + it.reasonTone">{{ it.reason }}</span>
                            <span *ngIf="it.note" class="t-note" [ngClass]="'tone--' + it.noteTone">{{ it.note }}</span>
                            <div class="row-actions" *ngIf="it.flagOpen">
                              <fvdr-btn label="Keep this reading" variant="secondary" size="s" (clicked)="keepFlag()" />
                              <fvdr-btn label="Edit text" variant="secondary" size="s" (clicked)="startRowEdit(it.id)" />
                            </div>
                            <div class="doc-list" *ngIf="it.chips.length">
                              <div class="tdoc" *ngFor="let c of it.chips"><fvdr-file-icon [type]="c.type" /><span class="tdoc__name">{{ c.label }}</span></div>
                            </div>
                          </ng-container>
                          <div class="row-edit" *ngIf="it.isEditing" (click)="$event.stopPropagation()">
                            <fvdr-textarea [(ngModel)]="editRowText" label="Request text" [rows]="3" />
                            <fvdr-dropdown label="Type" [options]="clsOptions" [value]="editCls" (valueChange)="editCls = $any(asString($event))" />
                            <span class="muted">{{ clsHint[editCls] }}</span>
                            <div class="row-actions">
                              <fvdr-btn label="Save" size="s" (clicked)="saveRowEdit()" />
                              <fvdr-btn label="Cancel" variant="secondary" size="s" (clicked)="editRowId = null; recompute()" />
                            </div>
                          </div>
                        </div>
                        <div role="cell" class="c-src c-right">
                          <fvdr-btn *ngIf="it.canEdit" variant="ghost" size="s" iconName="edit" [iconOnly]="true" ariaLabel="Edit request" (clicked)="startRowEdit(it.id); $event.stopPropagation()" />
                          <button class="src-link" (click)="openSrc(it.row, it.id); $event.stopPropagation()" [fvdrTooltip]="'Open row ' + it.row + ' in the source file'">{{ it.row }}</button>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                </div>

              </div>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <!-- ── Drawer (same anatomy as v3): header · sections separated by space · actions in the footer ── -->
    <aside class="drawer" *ngIf="drawerOpen" role="dialog" aria-label="Details">
      <!-- What AI read -->
      <ng-container *ngIf="readOpen">
        <header class="dh">
          <span class="dh__title">What AI read</span>
          <span class="spacer"></span>
          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="closeRead()" />
        </header>
        <div class="db">
          <section class="ds" *ngIf="sc.details?.fields?.length">
            <h3 class="ds__h">Checklist details <span class="ds__sub" *ngIf="sc.details?.metaRows">{{ sc.details?.metaRows }}</span></h3>
            <dl class="kv"><ng-container *ngFor="let f of sc.details?.fields"><dt>{{ f.label }}</dt><dd>{{ f.value }}</dd></ng-container></dl>
          </section>
          <section class="ds">
            <h3 class="ds__h">Requests</h3>
            <dl class="kvs">
              <div><dt>Header row</dt><dd><fvdr-dropdown [options]="headerRowOptions" [value]="'' + headerRow" (valueChange)="changeHeaderRow(asString($event))" /></dd></div>
              <div><dt>Found</dt><dd>{{ structLine }}</dd></div>
              <div *ngIf="sc.details?.columnsUsed"><dt>Read from</dt><dd>{{ sc.details?.columnsUsed?.join(', ') }}</dd></div>
            </dl>
          </section>
          <section class="ds">
            <h3 class="ds__h">Where results go</h3>
            <dl class="kvs">
              <div><dt>Columns</dt><dd>{{ hasResultCols ? sc.details?.resultCols?.join(', ') : 'New columns in the export' }}</dd></div>
              <div *ngIf="sc.statusMap"><dt>Status values</dt><dd>{{ sc.statusMap.covered }}, {{ sc.statusMap.partial }}, {{ sc.statusMap.gap }}, {{ sc.statusMap.na }}</dd></div>
            </dl>
          </section>
          <section class="ds">
            <h3 class="ds__h">Deal side</h3>
            <fvdr-segment variant="table" size="md" [items]="sideItems" [activeId]="isBidder ? 'buy' : 'sell'" (activeIdChange)="setSide($event)" />
            <p class="ds__p">{{ isBidder ? 'Missing items become questions to the seller in Q&A.' : 'Missing items become upload requests to the seller team.' }}</p>
          </section>
          <section class="ds ds--quiet">
            <h3 class="ds__h">How matching works</h3>
            <p class="ds__p">AI reads the checklist and the documents in the scope you pick, nothing else. It never changes your file, never accepts for you and never messages the seller without your click. Every decision is logged in the Activity log.</p>
          </section>
        </div>
        <footer class="df"><fvdr-btn label="Done" (clicked)="closeRead()" /></footer>
      </ng-container>

      <!-- A request -->
      <ng-container *ngIf="!readOpen && panel === 'item' && sel as s">
        <header class="dh">
          <fvdr-chip [label]="s.pill.label" [variant]="s.pill.variant" size="s" />
          <span class="dh__ref">{{ s.label }}</span>
          <span class="spacer"></span>
          <span class="dh__pos" *ngIf="s.queue">{{ s.queue }}</span>
          <fvdr-btn variant="ghost" size="s" iconName="chevron-up" [iconOnly]="true" ariaLabel="Previous (K)" (clicked)="stepAny(-1)" />
          <fvdr-btn variant="ghost" size="s" iconName="chevron-down" [iconOnly]="true" ariaLabel="Next (J)" (clicked)="stepAny(1)" />
          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close (Esc)" (clicked)="clearSel()" />
        </header>
        <div class="db">
          <section class="ds ds--req">
            <p class="req">{{ s.text }}</p>
            <ul class="meta">
              <li><span class="meta__k">Row</span><button class="lnk" (click)="openSrc(s.row, s.id)" [fvdrTooltip]="'Open row ' + s.row + ' in the source file'">{{ s.row }}</button></li>
              <li *ngIf="s.priority"><span class="meta__k">Priority</span>{{ s.priority }}</li>
              <li *ngIf="s.asAt"><span class="meta__k">As at</span>{{ s.asAt }}</li>
            </ul>
          </section>

          <section class="ds" *ngIf="s.isReview">
            <div class="ds__row">
              <h3 class="ds__h">Suggested document</h3>
              <span class="strength" [ngClass]="'strength--' + s.strength.toLowerCase()" [fvdrTooltip]="strengthHint[s.strength]"><i></i><i></i><i></i>{{ s.strength }} match</span>
            </div>
            <div class="doc">
              <fvdr-file-icon [type]="fileType(s.docName)" />
              <div class="doc__b">
                <button class="doc__name" (click)="openPreview(s.docName)">{{ s.docLabel }}</button>
                <button class="doc__path doc__path--btn" (click)="openFolder(s.docName)">{{ s.docPath }}</button>
              </div>
            </div>
            <figure class="quote" *ngIf="s.evidence">
              <blockquote>{{ s.evidence.quote }}</blockquote>
              <figcaption>{{ s.evidence.page }}</figcaption>
            </figure>
          </section>

          <section class="ds" *ngIf="s.isCovered">
            <h3 class="ds__h">Linked documents</h3>
            <div class="doc" *ngFor="let d of s.docs">
              <fvdr-file-icon [type]="d.type" />
              <div class="doc__b">
                <button class="doc__name" (click)="openPreview(d.name)">{{ d.label }}</button>
                <span class="doc__path">{{ d.meta }}</span>
              </div>
              <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Unlink" (clicked)="unlink(d.name)" />
            </div>
            <button class="lnk lnk--start" (click)="toast('A document picker opens here to link any file or folder from the room')">Link another document</button>
          </section>

          <section class="ds" *ngIf="s.isGap">
            <h3 class="ds__h">{{ s.gapTitle }}</h3>
            <p class="ds__p" *ngIf="s.gapText">{{ s.gapText }}</p>
            <div class="doc doc--muted" *ngIf="s.hasNear">
              <fvdr-file-icon [type]="fileType(s.nearName)" />
              <div class="doc__b">
                <button class="doc__name" (click)="openPreview(s.nearName)">{{ s.nearName }}</button>
                <span class="doc__path">Closest document, below the match threshold</span>
              </div>
              <fvdr-btn label="Link anyway" variant="ghost" size="s" (clicked)="linkNear()" />
            </div>
          </section>

          <section class="ds" *ngIf="s.isQuestion || s.isInstruction || s.isNote || s.isNa">
            <p class="ds__p" *ngIf="s.isQuestion">A question asks for a written answer, not documents. It isn't matched and doesn't count toward coverage.</p>
            <p class="ds__p" *ngIf="s.isInstruction">An instruction on how to respond. It isn't matched and stays visible to people uploading documents.</p>
            <p class="ds__p" *ngIf="s.isNote">A note, such as a link, legend or definition. It isn't matched.</p>
            <p class="ds__p" *ngIf="s.isNa">Marked not applicable. It won't appear in the gap report.</p>
          </section>

          <section class="ds" *ngIf="s.issues.length">
            <h3 class="ds__h">Needs attention</h3>
            <ul class="issues">
              <li *ngFor="let i of s.issues"><fvdr-icon [name]="i.icon" /><span><b>{{ i.title }}</b> {{ i.text }}</span></li>
            </ul>
          </section>

          <section class="ds" *ngIf="composeOpen">
            <h3 class="ds__h">{{ isBidder ? 'Question to the seller' : 'Upload request to the seller' }}</h3>
            <fvdr-textarea [(ngModel)]="composeText" [rows]="6" />
            <p class="ds__p">Goes to {{ isBidder ? 'Q&A' : 'the seller team' }} only when you click Send. You can edit it first.</p>
          </section>

          <section class="ds" *ngIf="s.writes">
            <h3 class="ds__h">{{ s.isReview ? 'If you accept, your file gets' : 'In your file' }}</h3>
            <dl class="kvs">
              <div *ngFor="let w of s.writes"><dt>{{ w.col }}</dt><dd [class.kv__empty]="!w.val">{{ w.val || 'Empty' }}</dd></div>
            </dl>
          </section>

          <details class="ds ds--quiet hist" *ngIf="s.history.length">
            <summary class="ds__h">History <span class="ds__sub">{{ s.history.length }}</span></summary>
            <ol><li *ngFor="let h of s.history"><span>{{ h.what }}</span><span class="hist__who">{{ h.who }} · {{ h.at }}</span></li></ol>
          </details>
        </div>
        <footer class="df">
          <ng-container *ngIf="s.isReview">
            <fvdr-btn [label]="s.verdict === 'Partial' ? 'Accept as partial' : 'Accept'" fvdrTooltip="A" (clicked)="accept()" />
            <fvdr-btn label="Reject" variant="secondary" fvdrTooltip="R" (clicked)="reject()" />
          </ng-container>
          <ng-container *ngIf="composeOpen">
            <fvdr-btn [label]="isBidder ? 'Send to Q&A' : 'Send request'" (clicked)="sendCompose()" />
            <fvdr-btn label="Cancel" variant="secondary" (clicked)="composeOpen = false" />
          </ng-container>
          <ng-container *ngIf="!composeOpen && !s.requested && !s.isReview">
            <fvdr-btn *ngIf="s.isReopened" label="Restore file" (clicked)="restoreFile()" />
            <fvdr-btn *ngIf="s.isGap || s.isPartial || s.isQuestion" [label]="isBidder ? (s.isQuestion ? 'Send to Q&A' : 'Ask in Q&A') : 'Request from seller'" [variant]="s.isReopened ? 'secondary' : 'primary'" (clicked)="openCompose()" />
            <fvdr-btn *ngIf="s.isGap" label="Mark N/A" variant="secondary" (clicked)="markNa()" />
            <fvdr-btn *ngIf="s.isNa" label="Undo N/A" variant="secondary" (clicked)="undoNa()" />
          </ng-container>
          <span class="df__done" *ngIf="s.requested && !composeOpen">{{ isBidder ? 'Asked in Q&A' : 'Requested from the seller' }}</span>
        </footer>
      </ng-container>

      <!-- Changes in the source file -->
      <ng-container *ngIf="!readOpen && panel === 'diff' && sc.edits as e">
        <header class="dh">
          <span class="dh__title">Changes in {{ sc.sheets[0].name }}</span>
          <span class="spacer"></span>
          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="panel = 'none'; recompute()" />
        </header>
        <div class="db">
          <p class="ds__p">Edited by {{ e.editedBy }} after the requests were extracted. Confirmed matches on other requests stay as they are.</p>
          <section class="ds">
            <h3 class="ds__h">Added · row {{ e.added.row }}</h3>
            <p class="ds__p ds__p--strong">{{ e.added.text }}</p>
          </section>
          <section class="ds">
            <h3 class="ds__h">Changed · row {{ e.changed.row }} · {{ e.changed.id }}</h3>
            <span class="diff__old">{{ e.changed.from }}</span>
            <span class="diff__new">{{ e.changed.to }}</span>
          </section>
        </div>
        <footer class="df">
          <fvdr-btn label="Apply and match 2 requests" (clicked)="applyDiff()" />
          <fvdr-btn label="Not now" variant="secondary" (clicked)="panel = 'none'; recompute()" />
        </footer>
      </ng-container>
    </aside>

    <fvdr-modal [visible]="bulkOpen" size="m" [title]="isBidder ? 'Ask the seller about ' + bulkItems.length + ' gaps' : 'Request ' + bulkItems.length + ' missing documents'"
                [confirmLabel]="'Send ' + bulkSelected + (bulkSelected === 1 ? ' question' : ' questions')" cancelLabel="Cancel" [confirmDisabled]="!bulkSelected"
                (confirmed)="sendBulk()" (cancelled)="bulkOpen = false" (closed)="bulkOpen = false">
      <p class="muted">Each gap becomes its own {{ isBidder ? 'Q&A question' : 'upload request' }}, linked to its request. Edit the wording before sending.</p>
      <div class="bulk">
        <div class="bulk__item" *ngFor="let b of bulkItems">
          <fvdr-checkbox [checked]="b.on" (checkedChange)="b.on = $event; countBulk()" [label]="b.ref + ' · ' + b.title" />
          <fvdr-textarea *ngIf="b.on" [(ngModel)]="b.text" [rows]="3" />
        </div>
      </div>
    </fvdr-modal>

    <fvdr-modal [visible]="howOpen" size="m" title="How matching works" confirmLabel="Got it" (confirmed)="howOpen = false" (closed)="howOpen = false">
      <ul class="how">
        <li><b>What AI reads.</b> The checklist's text, then the text of documents in the scope you pick. Nothing outside that scope, nothing other groups can't see.</li>
        <li><b>What it never does.</b> It doesn't change your file, accept matches for you, or send anything to the seller without your click.</li>
        <li><b>Match strength.</b> Strong: the document covers the request, including the period. Medium: it covers part of it, or the wrong period. Weak: related, but below the threshold. Weak matches are shown as "closest" so you can link them anyway.</li>
        <li><b>Who sees results.</b> Only people who can edit this checklist. Every accept, reject and request is logged with your name in the Activity log.</li>
      </ul>
    </fvdr-modal>

    <fvdr-toast-host />
    <fvdr-vdr-proto-switcher [groups]="protoGroups" (changed)="onProto($event)" [showRestart]="false" />
  </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); font-size: var(--text-body3-size);
      line-height: var(--text-body3-lh); color: var(--color-text-primary); }
    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .content { flex: 1; min-height: 0; overflow: auto; background: var(--color-stone-0);
      padding: var(--space-3) var(--space-6) calc(var(--space-16) + var(--space-4)); display: flex; flex-direction: column; gap: var(--space-4); }
    .spacer { flex: 1; }
    .muted { color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    b { font-weight: var(--font-weight-semi); }

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
    .drop__title { margin: 0; font-size: var(--text-sub2-size); line-height: var(--text-sub2-lh); font-weight: var(--text-sub2-weight); }
    .drop__text { margin: 0; max-width: 560px; color: var(--color-text-secondary); }
    .drop__caption { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .consent { display: flex; flex-direction: column; gap: var(--space-1); text-align: left; max-width: 560px; margin: var(--space-2) 0; }
    .consent--off { flex-direction: row; gap: var(--space-2); color: var(--color-text-secondary); }
    .consent__hint { margin: 0 0 0 calc(var(--space-6) + var(--space-1)); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .consent--off .consent__hint { margin: 0; }
    .up-file { display: flex; align-items: center; gap: var(--space-3); width: min(420px, 100%); text-align: left; }
    .up-file__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
    .up-file__name { font-weight: var(--font-weight-semi); }
    .up-file__meta { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }

    .bar { height: var(--space-1); border-radius: var(--radius-full); background: var(--color-stone-300); overflow: hidden; width: 100%; }
    .bar__fill { height: 100%; background: var(--color-primary-500); transition: width var(--transition-fast, 0.15s) linear; }

    /* Tabs + toolbar */
    .tabs-row { display: flex; align-items: center; gap: var(--space-2); }
    .tabs-row fvdr-tabs { flex: 1; }
    .toolbar { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .toolbar__actions { display: flex; gap: var(--space-4); flex-wrap: wrap; }
    .owner { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-body3-size); color: var(--color-text-secondary); }
    .export { position: relative; }
    .menu { position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 30; width: 360px; background: var(--color-stone-0);
      border-radius: var(--radius-md); box-shadow: var(--shadow-popup); padding: var(--space-1); display: flex; flex-direction: column; }
    .menu__item { all: unset; cursor: pointer; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
    .menu__item:hover, .menu__item:focus-visible { background: var(--color-hover-bg); }
    .menu__title { font-weight: var(--font-weight-semi); }
    .menu__sub { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .menu__foot { padding: var(--space-2) var(--space-3); border-top: 1px solid var(--color-divider); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }

    /* Notices */
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
    .pulse { animation: pulse 1.4s ease-in-out infinite; }

    /* Spreadsheet */
    .sheet { flex: none; display: flex; flex-direction: column; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; }
    .sheet__formula { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .sheet__search { color: var(--color-text-secondary); }
    .sheet__ref, .sheet__val { height: var(--space-8); display: inline-flex; align-items: center; padding: 0 var(--space-2); border: 1px solid var(--color-divider); border-radius: var(--radius-sm); font-size: var(--text-body3-size); }
    .sheet__ref { width: 72px; }
    .sheet__val { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sheet__scroll { overflow: auto; }
    .sheet__grid { min-width: 1100px; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .sr { display: grid; border-bottom: 1px solid var(--color-divider); }
    .sr--cols { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; }
    .sr--header { background: var(--color-text-primary); color: var(--color-stone-0); font-weight: var(--font-weight-semi); }
    .sr--section { background: var(--color-stone-400); font-weight: var(--font-weight-semi); }
    .sr--title .sc--span { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .sr--meta .sc--span { font-style: italic; }
    .sr--legend .sc--span { font-weight: var(--text-label-s-weight); }
    .sr--hl { background: var(--color-primary-50); outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
    .sc { padding: var(--space-2); border-right: 1px solid var(--color-divider); min-width: 0; overflow-wrap: anywhere; white-space: pre-line; }
    .sc--span { grid-column: 2 / -1; }
    .sc--n { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; font-weight: var(--text-body3-weight); font-style: normal; }
    .sr--header .sc--n { color: var(--color-text-secondary); }
    .sc--right { text-align: right; }
    .sc--sel { display: flex; justify-content: space-between; align-items: center; gap: var(--space-1); }
    .sc--sel fvdr-icon { color: var(--color-text-secondary); }
    .sc--yellow { background: var(--color-warning-bg); }
    .sc--filled { background: var(--color-primary-50); box-shadow: inset 0 0 0 1px var(--color-primary-100); }
    .sheet__tabs { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); border-top: 1px solid var(--color-divider); background: var(--color-stone-100); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .sheet__tab { padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .sheet__tab--on { background: var(--color-stone-0); color: var(--color-primary-600); font-weight: var(--font-weight-semi); box-shadow: var(--shadow-card); }
    .sheet__zoom { color: var(--color-text-secondary); }

    /* Delta */
    .delta { flex: none; display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider); }
    .delta__title { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); }
    .delta__title fvdr-icon { color: var(--color-primary-500); }

    /* Empty states */
    .empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-16) var(--space-6); text-align: center; }
    .empty__title { margin: 0; font-size: var(--text-sub2-size); line-height: var(--text-sub2-lh); font-weight: var(--text-sub2-weight); }
    .empty__text { margin: 0; max-width: 560px; color: var(--color-text-secondary); }

    /* Summary blocks */

    /* Checklist details */
    .kvs { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--space-1) var(--space-4); margin: 0; font-size: var(--text-body3-size); }
    .kvs dt { color: var(--color-text-secondary); }
    .kvs dd { margin: 0; }

    /* Workspace */
    .ws { flex: none; display: flex; flex-direction: column; gap: var(--space-3); }
    .ws__body { display: flex; gap: var(--space-6); align-items: flex-start; }
    .tbl-wrap { flex: 1; min-width: 0; overflow-x: auto; }

    .tbl { min-width: 820px; }
    .tbl--narrow { min-width: 0; }
    .tbl--list { min-width: 660px; }
    .tr { display: grid; gap: var(--space-3); padding: var(--space-3); border-bottom: 1px solid var(--color-divider); align-items: start; }
    .tr--head { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); padding-top: var(--space-2); padding-bottom: var(--space-2); }
    .tr--group { display: flex; align-items: center; gap: var(--space-3); background: var(--color-stone-100); padding: var(--space-2) var(--space-3); }
    .g-label { color: var(--color-text-secondary); font-weight: var(--font-weight-semi); }
    .g-name { font-weight: var(--font-weight-semi); }
    .tr--item { cursor: pointer; }
    .tr--item:hover { background: var(--color-stone-100); }
    .tr--sel, .tr--sel:hover { background: var(--color-primary-50); box-shadow: inset 3px 0 0 var(--color-primary-500); }
    .tr--flag, .tr--flag:hover { background: var(--color-warning-bg); }
    .tr--editing { background: var(--color-stone-100); cursor: default; }
    .c-id { display: flex; flex-direction: column; gap: var(--space-1); align-items: flex-start; color: var(--color-text-secondary); padding-top: var(--space-1); }
    .c-text { display: flex; flex-direction: column; gap: var(--space-1); padding-top: var(--space-1); min-width: 0; }
    .t-asat { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .c-docs, .c-next { display: flex; flex-direction: column; gap: var(--space-1); align-items: flex-start; min-width: 0; padding-top: var(--space-1); }
    .c-src { display: flex; align-items: center; gap: var(--space-1); }
    .c-right { justify-content: flex-end; text-align: right; }
    .t-muted { color: var(--color-text-secondary); }
    .t-note { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .tbl-empty { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .doc-list { display: flex; flex-direction: column; width: 100%; }
    .doc { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .doc + .doc { border-top: 1px solid var(--color-stone-300); }
    .doc__name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--text-body3-size); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
    .doc__path { color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); white-space: nowrap; }
    .more { all: unset; cursor: pointer; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-primary-600); }
    .src-link { all: unset; cursor: pointer; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-primary-600); padding: 2px var(--space-2); border-radius: var(--radius-sm); }
    .src-link:hover { background: var(--color-primary-50); }
    .src-link:focus-visible, .more:focus-visible, .doc__link:focus-visible, .doc__pathlink:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .row-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; margin-top: var(--space-1); }
    .row-edit { display: flex; flex-direction: column; gap: var(--space-2); max-width: 640px; }

    /* Side panel */
    /* Sticks to the bottom of the visible area while the panel is taller than it. Offset clears the prototype switcher. */
    .strength { display: inline-flex; align-items: center; gap: 2px; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .strength i { width: 4px; height: var(--space-3); border-radius: 1px; background: var(--color-stone-400); }
    .strength i:last-of-type { margin-right: var(--space-1); }
    .strength--strong i { background: var(--color-primary-500); }
    .strength--medium i:nth-of-type(-n+2) { background: var(--color-warning-icon); }
    .strength--weak i:first-of-type { background: var(--color-stone-600); }
    .bulk { display: flex; flex-direction: column; gap: var(--space-3); max-height: 50vh; overflow-y: auto; padding-right: var(--space-1); }
    .bulk__item { display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-divider); }
    .how { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .lnk { all: unset; cursor: pointer; color: var(--color-primary-600); font-weight: var(--font-weight-semi); }
    .lnk:hover { text-decoration: underline; }
    .lnk:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; border-radius: var(--radius-sm); }
    .menu__warn { display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-3); margin-bottom: var(--space-1); background: var(--color-warning-bg); border-radius: var(--radius-sm); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .menu__warn fvdr-icon { color: var(--color-warning-icon); flex: none; margin-top: 2px; }
    .menu__warn-body { display: flex; flex-direction: column; gap: var(--space-1); }
    .menu__warn-links { display: flex; gap: var(--space-3); }
    .fail-actions { display: flex; align-items: flex-end; gap: var(--space-3); }
    .kv { display: flex; flex-direction: column; gap: var(--space-1); }
    .diff__old { color: var(--color-text-secondary); text-decoration: line-through; }
    .diff__new { color: var(--color-primary-700); }

    /* Folders */
    .folders { flex: 1; display: grid; grid-template-columns: 340px 1fr; gap: var(--space-6); min-width: 0; }
    .folders__reqs { border-right: 1px solid var(--color-divider); padding-right: var(--space-4); }
    .folders__head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .h-sec { font-weight: var(--font-weight-semi); }
    .fgroup__name { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); padding: var(--space-3) 0 var(--space-1); }
    .freq { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; display: grid; grid-template-columns: 8px 36px minmax(0, 1fr) auto; gap: var(--space-2);
      align-items: center; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: var(--text-body3-size); }
    .freq:hover { background: var(--color-stone-100); }
    .freq:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
    .freq--hit { background: var(--color-primary-50); }
    .freq--sel { background: var(--color-primary-50); box-shadow: inset 3px 0 0 var(--color-primary-500); }
    .freq__id { color: var(--color-text-secondary); }
    .freq__text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .freq__count { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .freq__count--gap { color: var(--color-error-600); }
    .dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-stone-500); }
    .dot--covered { background: var(--color-primary-500); }
    .dot--partial { background: var(--color-primary-300); }
    .dot--review { background: var(--color-warning-icon); }
    .dot--gap { background: var(--color-error-600); }
    .folders__tree { min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .fhead { display: flex; align-items: flex-start; gap: var(--space-3); flex-wrap: wrap; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .fhead__text { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 2px; }
    .fhead__title { font-size: var(--text-label-s-size); line-height: var(--text-label-s-lh); font-weight: var(--text-label-s-weight); }
    .legend { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .legend__item { display: inline-flex; align-items: center; gap: var(--space-1); }
    .sw { width: 10px; height: 10px; border-radius: var(--radius-xs, 2px); }
    .sw--linked { background: var(--color-primary-100); }
    .sw--partial { background: var(--color-primary-50); border: 1px solid var(--color-primary-300); }
    .sw--suggested { background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); }
    .sw--closest { background: var(--color-stone-300); }
    .ftree { display: flex; flex-direction: column; }
    .frow { display: flex; align-items: center; gap: var(--space-2); min-height: 36px; padding: var(--space-1) var(--space-3); border-bottom: 1px solid var(--color-stone-300); cursor: pointer; font-size: var(--text-body3-size); }
    .frow:hover { background: var(--color-stone-100); }
    .frow--related { background: var(--color-stone-100); }
    .frow--linked { background: var(--color-primary-100); }
    .frow--partial { background: var(--color-primary-50); }
    .frow--suggested { background: var(--color-warning-bg); }
    .frow--closest { background: var(--color-stone-300); }
    .frow--picked { box-shadow: inset 0 0 0 2px var(--color-primary-500); }
    .frow--unused .frow__name { color: var(--color-text-secondary); }
    .frow__chev { color: var(--color-text-secondary); transition: transform var(--transition-fast, 0.15s) ease; }
    .frow__chev--open { transform: rotate(90deg); }
    .frow__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .frow__meta { color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); white-space: nowrap; }
    /* ── v2 simplification: one grey bar before results, a plain row after ── */
    .content--drawer { padding-right: var(--space-6); }
    .aibar { flex: none; display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; min-height: var(--space-10);
      padding: var(--space-4); border-radius: var(--radius-md); background: var(--color-stone-300); }
    .aibar__text { font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .aibar__text b { font-weight: var(--font-weight-semi); }
    .aibar__grow { flex: 1; min-width: 0; }
    .aibar .scope { width: 320px; }
    .rbar { flex: none; display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; min-height: var(--space-10); }
    .rbar__r { display: flex; align-items: center; gap: var(--space-4); }
    .covp { display: inline-flex; align-items: center; gap: var(--space-6); height: var(--space-10); padding: 0 var(--space-4) 0 var(--space-3); box-sizing: border-box;
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-full); font-size: var(--text-body3-size); }
    .covp__val { display: inline-flex; align-items: center; gap: var(--space-2); }
    .covp b { font-weight: var(--font-weight-semi); }
    /* Donut for coverage and AI progress */
    .ring { width: 20px; height: 20px; border-radius: var(--radius-full); flex: none;
      background: conic-gradient(var(--color-primary-500) calc(var(--p, 0) * 1%), var(--ring-track, var(--color-stone-300)) 0);
      -webkit-mask: radial-gradient(circle, transparent 5.5px, var(--color-text-primary) 6px); mask: radial-gradient(circle, transparent 5.5px, var(--color-text-primary) 6px); }
    .ring--bar { --ring-track: var(--color-stone-400); }
    .tdoc { display: flex; align-items: flex-start; gap: var(--space-2); }
    .tdoc > fvdr-file-icon { flex: none; display: flex; align-items: center; height: var(--text-body3-lh); }
    .tdoc__name { overflow-wrap: anywhere; }

    /* ── Drawer, same anatomy as v3 ── */
    .drawer { flex: none; width: 440px; height: 100%; display: flex; flex-direction: column; background: var(--color-stone-0); border-left: 1px solid var(--color-divider);
      font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-primary); }
    .drawer .dh { flex: none; display: flex; align-items: center; gap: var(--space-2); height: var(--space-16); box-sizing: border-box; padding: 0 var(--space-4) 0 var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .drawer .dh__title { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .drawer .dh__ref { font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .drawer .dh__pos { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); margin-right: var(--space-1); }
    .drawer .db { flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-8); }
    .drawer .ds { display: flex; flex-direction: column; gap: var(--space-3); }
    .drawer .ds__h { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); font-weight: var(--font-weight-semi); }
    .drawer .ds__sub { margin-left: var(--space-1); font-weight: var(--text-body3-weight); color: var(--color-text-secondary); }
    .drawer .ds__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
    .drawer .ds__p { margin: 0; color: var(--color-text-secondary); }
    .drawer .ds__p--strong { color: var(--color-text-primary); }
    .drawer .ds--quiet .ds__h { color: var(--color-text-secondary); }
    .drawer .ds--req { gap: var(--space-4); }
    .drawer .req { margin: 0; font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .drawer .meta { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); }
    .drawer .meta li { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; }
    .drawer .meta__k { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .drawer .doc { display: flex; align-items: flex-start; gap: var(--space-3); }
    .drawer .doc > fvdr-file-icon { flex: none; display: flex; align-items: center; height: var(--text-body3-lh); }
    .drawer .doc > fvdr-btn { flex: none; }
    .drawer .doc__b { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; align-items: flex-start; }
    .drawer .doc__name { all: unset; cursor: pointer; font-weight: var(--font-weight-semi); overflow-wrap: anywhere; }
    .drawer .doc__name:hover { color: var(--color-primary-600); text-decoration: underline; }
    .drawer .doc__name:focus-visible, .drawer .doc__path--btn:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .drawer .doc__path { all: unset; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .drawer .doc__path--btn { cursor: pointer; }
    .drawer .doc__path--btn:hover { color: var(--color-primary-600); text-decoration: underline; }
    .drawer .doc--muted .doc__name { font-weight: var(--text-body3-weight); }
    .drawer .lnk--start { align-self: flex-start; }
    .drawer .quote { margin: 0; padding-left: var(--space-4); border-left: 2px solid var(--color-primary-300); display: flex; flex-direction: column; gap: var(--space-1); }
    .drawer .quote blockquote { margin: 0; font-style: italic; }
    .drawer .quote figcaption { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .drawer .issues { list-style: none; margin: 0; padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);
      background: var(--color-warning-bg); border-radius: var(--radius-md); }
    .drawer .issues li { display: flex; gap: var(--space-2); }
    .drawer .issues fvdr-icon { color: var(--color-warning-icon); flex: none; margin-top: 2px; }
    .drawer .issues b { font-weight: var(--font-weight-semi); }
    .drawer .kv { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: var(--space-3) var(--space-4); margin: 0; }
    .drawer .kv dt { color: var(--color-text-secondary); }
    .drawer .kv dd { margin: 0; overflow-wrap: anywhere; }
    .drawer .kvs { margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .drawer .kvs > div { display: flex; flex-direction: column; gap: var(--space-1); }
    .drawer .kvs dt { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); font-weight: var(--font-weight-semi); }
    .drawer .kvs dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
    .drawer .kv__empty { color: var(--color-text-placeholder); }
    .drawer .hist summary { cursor: pointer; list-style: none; }
    .drawer .hist summary::-webkit-details-marker { display: none; }
    .drawer .hist ol { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
    .drawer .hist li { display: flex; flex-direction: column; gap: 2px; }
    .drawer .hist__who { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .drawer .df { flex: none; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-divider); }
    .drawer .df__done { color: var(--color-primary-600); }
  `],
})
export class ChecklistMatchingComponent implements OnDestroy {
  private router = inject(Router);
  private toastSvc = inject(ToastService);
  @ViewChild('content') private contentEl?: ElementRef<HTMLElement>;

  // ── Scenario ──
  sc: Scenario = LIGHTHOUSE;

  // ── Shell ──
  sidebarCollapsed = false;
  nav: SidebarNavItem[] = [
    { id: 'ai', label: 'AI Assistant', icon: 'ai-search', iconActive: 'ai-search' },
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
  layoutItems: SegmentItem[] = [{ id: 'table', label: 'Table' }, { id: 'folders', label: 'Folders' }];
  sideItems: SegmentItem[] = [{ id: 'sell', label: 'Sell-side' }, { id: 'buy', label: 'Buy-side' }];
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
  colIdx = [0, 1, 2, 3, 4, 5, 6, 7];

  // ── Prototype controls ──
  screen: Screen = 'upload';
  roomAiOn = true;
  isBidder = true;

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
  highOnly = false;
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
  previewResults = true;
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
  howOpen = false;
  hdrEdit = false;
  headerRow = 1;
  composeOpen = false;
  composeText = '';
  bulkOpen = false;
  bulkItems: { id: string; ref: string; title: string; text: string; on: boolean }[] = [];
  bulkSelected = 0;
  strengthHint: Record<string, string> = {
    Strong: 'The document covers the request, including the requested period.',
    Medium: 'The document covers part of the request, or a different period.',
    Weak: 'Related, but below the match threshold. Shown so you can link it anyway.',
  };

  // ── View model (recomputed after every change) ──
  groups: GroupVm[] = [];
  counts: Record<string, number> = {};
  matchable = 0;
  pct = 0;
  highCount = 0;
  sel: any = null;
  filterItems: SegmentItem[] = [];
  readOpen = false;
  get drawerOpen() { return (this.readOpen && this.view === 'requests') || this.showPanel; }
  get structLine() {
    const t = this.typeChips; if (!t) return '';
    const parts = [t.doc, t.qCount ? t.q : '', t.iCount ? t.i : '', t.nCount ? t.n : ''].filter(Boolean);
    return `${parts.join(', ')} in ${this.sc.sections.length} sections`;
  }
  openRead() { this.readOpen = true; this.exportOpen = false; this.recompute(); }
  closeRead() { this.readOpen = false; this.recompute(); }
  /** Drawer arrows: through the review queue while reviewing, otherwise through the rows on screen. */
  stepAny(dir: 1 | -1) {
    if (this.sel?.isReview) { this.stepReview(dir); return; }
    const ids = this.groups.flatMap(g => g.items.map(i => i.id)); if (!ids.length) return;
    const i = this.selected ? ids.indexOf(this.selected) : -1;
    this.selected = ids[(i + dir + ids.length) % ids.length]; this.composeOpen = false; this.recompute();
  }
  showPanel = false;
  changeChips: { kind: ChangeKind; label: string; variant: ChipVariant }[] = [];
  changeTotal = 0;
  filters: { id: Filter; label: string; count: number; active: boolean }[] = [];
  viewItems: SegmentItem[] = [];
  tabs: TabItem[] = [];
  scopeOptions: DropdownOption[] = [];
  sourceRows: SrcRow[] = [];
  gridCols = '';
  tblCols = '';
  listCols = '';
  hlCell = '';
  hlText = '';
  fv: any = { groups: [], rows: [], kicker: '', title: '', sub: '', coveredLabel: '', hasReq: false };
  typeChips = { doc: '', q: '', i: '', n: '', docCount: 0, qCount: 0, iCount: 0, nCount: 0 };
  foundLine = '';
  hasFlag = false;
  likelyIds: string[] = [];
  askableGaps: string[] = [];
  headerRowOptions: DropdownOption[] = [];

  private ut: any; private rt: any; private mt: any;

  /** The prototype panel only switches between the two concept versions. */
  protoGroups: ProtoGroup[] = [{ id: 'version', label: 'Version', value: 'v2', options: [{ id: 'v3', label: 'Version 3' }, { id: 'v2', label: 'Version 2' }] }];

  get hasChecklist() { return this.phase !== 'empty' && this.phase !== 'uploading'; }
  get totalRows() { return this.sc.sheets.reduce((a, s) => a + s.rows, 0); }
  get readSheetIdx() { return this.readRow <= this.sc.sheets[0].rows ? 0 : 1; }
  get readSheet() { return this.sc.sheets[this.readSheetIdx].name; }
  get readSheetRows() { return this.sc.sheets[this.readSheetIdx].rows; }
  get readRowInSheet() { return this.readSheetIdx === 0 ? this.readRow : this.readRow - this.sc.sheets[0].rows; }
  get readPct() { return Math.round(100 * this.readRow / this.totalRows); }
  get totalDocsLabel() { return this.sc.totalDocs.toLocaleString('en-US'); }
  get docsRead() { return Math.round(this.progress * this.sc.totalDocs).toLocaleString('en-US'); }
  get hasResultCols() { return !!this.sc.details?.resultCols; }
  get etaLabel() { const m = Math.ceil((1 - this.progress) * 3); return m <= 0 ? 'finishing' : `about ${m} min left`; }
  get sideHint() {
    return this.isBidder
      ? 'Buy-side checklist: missing items become questions to the seller in Q&A.'
      : 'Sell-side data collection: the seller team gets an upload request for missing items.';
  }
  get reqDoneText() {
    return this.isBidder ? 'Asked in Q&A today. It stays open until a document arrives.'
      : 'Requested from the seller team today. It stays open until a document is uploaded.';
  }
  get srcInfoText() {
    if (this.stale) return 'This file changed after the requests were extracted. Review the changes in Requests.';
    if (this.phase === 'results') {
      return this.hasResultCols && this.previewResults ? 'Results are shown in the file\'s own columns. The file in the room changes only when you export.' : `Requests extracted on ${this.sc.extractedOn}.`;
    }
    return `Matching ${this.matchable} document requests from this file against ${this.totalDocsLabel} documents.`;
  }

  constructor() { this.goScreen('upload'); }
  ngOnDestroy(): void { this.stopTimers(); }

  // ══════════ Data helpers ══════════
  isDoc(r: Req) { return r.cls === 'document_request'; }
  lbl(r: Req) { return r.label || r.id; }
  doc(n: string): DocInfo { return this.sc.docs[n] || { path: '', summary: '' }; }
  asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }
  byId = (_: number, x: { id: string }) => x.id;
  byKey = (_: number, x: { key: string }) => x.key;
  isSpanRow(r: SrcRow) { return r.kind === 'section' || r.kind === 'title' || r.kind === 'meta' || r.kind === 'legend' || r.kind === 'blank'; }

  fileType(name: string): FvdrFileType {
    const d = this.doc(name);
    if (d.folder) return 'folder';
    if (/\.(xlsx|csv)$/i.test(name)) return 'xls';
    if (/\.docx?$/i.test(name)) return 'doc';
    return 'pdf';
  }

  private chip(n: string): DocChip {
    const d = this.doc(n);
    return { name: n, label: d.label || n, path: d.path, type: this.fileType(n), isFolder: !!d.folder };
  }

  private withEdits(on: boolean): Req[] { return on && this.sc.edits ? this.sc.edits.apply(this.sc.reqs) : this.sc.reqs; }

  private patchReturning(list: Req[]): Req[] {
    if (!this.returningCands) return list;
    const P = this.sc.returning.cands;
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
  private mapReturning() { const m = this.mapFinal(); this.sc.returning.apply(m); return m; }

  /** What the export writes into the file's own result columns for one request. */
  private resultCells(r: Req): [string, string, string] {
    const rec = this.st[r.id] || { s: 'pending' } as Rec;
    const map = this.sc.statusMap; if (!map) return ['', '', ''];
    const s = rec.s;
    if (s === 'covered') return [map.covered, (rec.docs || r.docs || []).join('\n'), ''];
    if (s === 'partial') return [map.partial, (rec.docs || []).join('\n'), 'Missing: ' + (rec.missing || r.cand?.missing || '')];
    if (s === 'review') return ['', '', `AI suggestion not reviewed: ${r.cand?.name || ''}`];
    if (s === 'gap') return [map.gap, '', rec.reopened ? 'Linked file deleted' : (r.note || 'Nothing found')];
    if (s === 'na') return [map.na, '', ''];
    return ['', '', ''];
  }

  cellText(row: SrcRow, i: number): string {
    if (row.kind === 'item' && this.phase === 'results' && this.previewResults && this.sc.source.resultCols.includes(i) && row.reqId) {
      const r = this.findReq(row.reqId); if (r) return this.resultCells(r)[this.sc.source.resultCols.indexOf(i)];
    }
    return row.cells[i] || '';
  }

  // ══════════ Screens ══════════
  onProto(e: { group: string; value: string }) {
    if (e.group === 'version') { this.router.navigateByUrl('/checklist-matching-inline'); return; }
    if (e.group === 'scenario') { this.sc = SCENARIOS[e.value]; this.isBidder = this.sc.side === 'buy'; this.goScreen(this.screen); }
    if (e.group === 'screen') this.goScreen(e.value as Screen);
    if (e.group === 'ai') { this.roomAiOn = e.value === 'on'; this.goScreen(this.screen); }
  }

  setSide(v: string) { this.isBidder = v === 'buy'; this.recompute(); }

  goScreen(screen: Screen) {
    this.stopTimers();
    this.screen = screen;
    this.contentEl?.nativeElement.scrollTo({ top: 0 });
    Object.assign(this, {
      view: 'requests', phase: 'results', readRow: 0, progress: 0, flagResolved: true, filter: 'all', highOnly: false, layout: 'table',
      selected: null, panel: 'none', exportOpen: false, stale: false, delta: false, sourceEdited: false, applied: false,
      returningCands: false, deletedFiles: [], highlightRow: null, backTo: null, expanded: {}, changeFilter: null,
      overrides: {}, editRowId: null, editId: null, fSelReq: null, fSelFile: null, fOpen: {}, fHideUnused: false, upPct: 0, previewResults: true,
      hdrEdit: false, composeOpen: false, bulkOpen: false, howOpen: false,
    });
    this.headerRow = this.sc.details?.headerRow || 1;
    const pending = () => this.baseMap(() => 'pending');
    if (screen === 'upload') { this.view = 'source'; this.phase = 'empty'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'source') { this.view = 'source'; this.phase = 'none'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'structure') { this.phase = 'structure'; this.flagResolved = false; this.st = pending(); }
    else if (screen === 'readfail') { this.phase = 'failed'; this.st = pending(); this.headerRow = 1; }
    else if (screen === 'matching') { this.phase = 'matching'; this.st = this.baseMap(() => 'searching'); this.runMatching(); }
    else if (screen === 'triage') { this.st = this.mapFinal(); }
    else if (screen === 'gaps') { this.st = this.mapFinal(); this.filter = 'gap'; this.selected = this.sc.gapsFocus; this.panel = 'item'; }
    else if (screen === 'returning') {
      this.returningCands = true; this.st = this.mapReturning(); this.delta = true;
      this.stale = !!this.sc.edits; this.sourceEdited = !!this.sc.edits;
      this.deletedFiles = [...this.sc.returning.deleted];
    }
    this.recompute();
  }

  private stopTimers() { clearInterval(this.ut); clearInterval(this.rt); clearInterval(this.mt); }

  toast(message: string) { this.toastSvc.show({ variant: 'info', message, duration: 3000 }); }

  /** Toast with an Undo link that restores the state captured before the action. */
  private toastUndo(message: string, prev: Record<string, Rec>, focus?: string | null) {
    this.toastSvc.show({ variant: 'success', message, duration: 6000, actions: [{ label: 'Undo', onClick: () => {
      this.st = prev;
      if (focus) { this.selected = focus; this.panel = 'item'; }
      this.recompute();
      this.toast('Undone');
    } }] });
  }

  private hist(rec: Rec, what: string): Rec {
    return { ...rec, history: [...(rec.history || []), { what, who: 'You (Vlad O.)', at: 'just now' }] };
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.drawerOpen || this.bulkOpen || this.howOpen) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') { if (this.readOpen) this.closeRead(); else this.clearSel(); }
    else if (this.readOpen) return;
    else if (k === 'j') { e.preventDefault(); this.stepAny(1); }
    else if (k === 'k') { e.preventDefault(); this.stepAny(-1); }
    else if (this.sel?.isReview && k === 'a') { e.preventDefault(); this.accept(); }
    else if (this.sel?.isReview && k === 'r') { e.preventDefault(); this.reject(); }
  }

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
    const total = this.totalRows;
    const step = Math.max(1, Math.round(total / 30));
    this.rt = setInterval(() => {
      const n = this.readRow + step;
      if (n >= total) { clearInterval(this.rt); this.readRow = total; this.phase = 'structure'; this.isBidder = this.sc.side === 'buy'; this.recompute(); return; }
      this.readRow = n;
    }, 60);
  }

  stopMatching() {
    this.stopTimers();
    Object.assign(this, { phase: 'structure', progress: 0 });
    this.st = this.baseMap(() => 'pending');
    this.recompute();
    this.toast('Matching stopped. Nothing was saved. Change the scope and start again.');
  }

  changeHeaderRow(v: string) {
    const row = +v; this.headerRow = row; this.hdrEdit = false;
    this.toast(row === (this.sc.details?.headerRow || 1) ? `Read again from row ${row}. Same ${this.typeChips.docCount} requests found.` : `Read again from row ${row}. Check the requests below.`);
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
  doExport(kind: 'gap' | 'file') {
    this.exportOpen = false;
    if (kind === 'gap') { this.toast('Gap report downloaded'); return; }
    this.toast(this.hasResultCols
      ? `${this.sc.tabLabel} with results downloaded. Status, Responsive document(s) and Notes are filled in. The file in the room is unchanged.`
      : `${this.sc.tabLabel} with results downloaded. The file in the room is unchanged.`);
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
  select(id: string) { if (this.phase !== 'results') return; Object.assign(this, { selected: id, panel: 'item', exportOpen: false, editId: null, readOpen: false, composeOpen: false }); this.recompute(); }
  clearSel() { Object.assign(this, { selected: null, panel: 'none', editId: null, composeOpen: false }); this.recompute(); }
  toggleMore(id: string) { this.expanded = { ...this.expanded, [id]: !this.expanded[id] }; this.recompute(); }
  rowAction(it: RowVm) {
    this.select(it.id);
    if (it.action !== 'Review') this.askSeller(it.pill.label === 'Question');
  }
  keepFlag() { this.flagResolved = true; this.recompute(); this.toast('Row confirmed'); }
  startRowEdit(id: string) {
    const r = this.findReq(id)!;
    Object.assign(this, { editRowId: id, editRowText: r.readAs || r.text, editCls: r.cls });
    this.recompute();
  }
  saveRowEdit() {
    const id = this.editRowId!; const txt = this.editRowText.trim(); const cls = this.editCls;
    if (!txt) { this.toast('The request text can’t be empty'); return; }
    const base = this.sc.reqs.find(x => x.id === id);
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
    const prev = this.st;
    const order = this.getReqs().map(r => r.id);
    const idx = order.indexOf(id);
    let next: string | null = null;
    for (let i = 1; i <= order.length; i++) { const k = order[(idx + i) % order.length]; if (st[k]?.s === 'review') { next = k; break; } }
    this.st = st; this.composeOpen = false;
    if (next) { this.selected = next; this.panel = 'item'; this.toastUndo(msg, prev, id); }
    else { Object.assign(this, { selected: null, panel: 'none', filter: 'all' }); this.toastUndo(msg + ' All suggestions reviewed.', prev, id); }
    this.recompute();
  }
  accept() {
    const id = this.selected!; const r = this.findReq(id)!; const cur = this.st[id] || {} as Rec;
    const partial = r.cand!.verdict === 'Partial';
    const next = this.hist({ ...cur, s: partial ? 'partial' : 'covered', docs: [r.cand!.name], missing: r.cand!.missing }, partial ? 'Accepted as partial' : 'Accepted');
    this.advance({ ...this.st, [id]: next }, id, partial ? `${id} accepted as partial. The missing part stays in the gap report.` : `${id} accepted.`);
  }
  reject() {
    const id = this.selected!; const cur = this.st[id] || {} as Rec;
    this.advance({ ...this.st, [id]: this.hist({ ...cur, s: 'gap', rejected: true, docs: undefined }, 'Rejected the suggestion') }, id, `${id} rejected. It's now a gap.`);
  }
  unlink(n: string) {
    const id = this.selected!; const r = this.findReq(id)!; const cur = this.st[id] || {} as Rec;
    const left = (cur.docs || r.docs || []).filter(x => x !== n);
    const prev = this.st;
    this.st = { ...this.st, [id]: this.hist(left.length ? { ...cur, docs: left } : { ...cur, s: 'gap', rejected: true, docs: undefined }, `Unlinked ${n}`) };
    this.recompute();
    this.toastUndo(left.length ? `Unlinked. ${left.length} document still linked.` : `Unlinked. ${id} is now a gap.`, prev, id);
  }
  linkNear() {
    const id = this.selected!; const r = this.findReq(id)!;
    const prev = this.st;
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: 'partial', docs: [r.near!.name], why: 'Linked by you. ' + r.near!.why, missing: 'Below the match threshold, check the document', rejected: false }, `Linked ${r.near!.name} as partial`) };
    this.recompute(); this.toastUndo('Linked as partial coverage', prev, id);
  }
  askSeller(question = false) {
    const id = this.selected!;
    this.st = { ...this.st, [id]: { ...this.st[id], requested: true } };
    this.recompute();
    if (question) this.toast(this.isBidder ? 'Question added to Q&A' : 'Answer requested from the seller team');
    else this.toast(this.isBidder ? 'Question sent to the seller in Q&A' : 'Upload request sent to the seller team');
  }
  private draftFor(r: Req, rec: Rec): string {
    const asAt = r.asAt && r.asAt !== 'Current' ? `, as at ${r.asAt}` : '';
    if (r.cls === 'question') return r.text;
    if (rec.s === 'partial') {
      const have = (rec.docs || []).join(', ');
      return this.isBidder
        ? `Ref ${this.lbl(r)}: ${r.text}\nWe have ${have}, but it doesn't include: ${rec.missing || r.cand?.missing}. Please upload the missing part${asAt}.`
        : `Please upload the missing part of ${this.lbl(r)}: ${rec.missing || r.cand?.missing}.`;
    }
    const near = r.near && !rec.rejected ? ` The closest document is ${r.near.name}, which doesn't cover it.` : '';
    return this.isBidder
      ? `Ref ${this.lbl(r)}: ${r.text}\nWe couldn't find this in the data room.${near} Please upload it${asAt}, or confirm it doesn't exist.`
      : `Please upload documents for ${this.lbl(r)}: ${r.text}${asAt}.`;
  }
  openCompose() {
    const r = this.findReq(this.selected)!;
    this.composeText = this.draftFor(r, this.st[r.id] || { s: 'gap' });
    this.composeOpen = true;
  }
  sendCompose() {
    const id = this.selected!; const prev = this.st;
    if (!this.composeText.trim()) { this.toast('The message can’t be empty'); return; }
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], requested: true }, this.isBidder ? 'Asked the seller in Q&A' : 'Requested from the seller team') };
    this.composeOpen = false; this.recompute();
    this.toastUndo(this.isBidder ? `Question for ${id} posted to Q&A` : `Upload request for ${id} sent to the seller team`, prev, id);
  }
  openBulkAsk() {
    this.bulkItems = this.askableGaps.map(id => { const r = this.findReq(id)!; return { id, ref: this.lbl(r), title: r.text.length > 70 ? r.text.slice(0, 68) + '…' : r.text, text: this.draftFor(r, this.st[id]), on: true }; });
    this.countBulk(); this.bulkOpen = true;
  }
  countBulk() { this.bulkSelected = this.bulkItems.filter(b => b.on).length; }
  sendBulk() {
    const prev = this.st; const st = { ...this.st };
    const on = this.bulkItems.filter(b => b.on);
    on.forEach(b => { st[b.id] = this.hist({ ...st[b.id], requested: true }, this.isBidder ? 'Asked the seller in Q&A (batch)' : 'Requested from the seller team (batch)'); });
    this.st = st; this.bulkOpen = false; this.recompute();
    this.toastUndo(this.isBidder ? `${on.length} questions posted to Q&A` : `${on.length} upload requests sent to the seller team`, prev);
  }
  acceptLikely() {
    const prev = this.st; const st = { ...this.st }; const ids = [...this.likelyIds];
    ids.forEach(id => { const r = this.findReq(id)!; st[id] = this.hist({ ...st[id], s: 'covered', docs: [r.cand!.name] }, 'Accepted (likely match, in bulk)'); });
    this.st = st;
    if (this.selected && ids.includes(this.selected)) { this.selected = null; this.panel = 'none'; }
    this.recompute();
    this.toastUndo(`${ids.length} likely ${ids.length === 1 ? 'match' : 'matches'} accepted: ${ids.join(', ')}`, prev);
  }

  markNa() { const id = this.selected!; const prev = this.st; this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: 'na', prev: this.st[id] }, 'Marked not applicable') }; this.recompute(); this.toastUndo(id + ' marked not applicable', prev, id); }
  undoNa() { const id = this.selected!; this.st = { ...this.st, [id]: this.st[id]?.prev || { s: 'gap' } }; this.recompute(); }
  restoreFile() {
    const ro = this.sc.returning.reopened;
    this.st = { ...this.st, [ro.id]: { s: 'covered', docs: [ro.file], why: 'Restored from the recycle bin.' } };
    this.deletedFiles = this.deletedFiles.filter(n => n !== ro.file);
    this.recompute();
    this.toast(`${ro.file} restored from the recycle bin. ${ro.id} is covered again.`);
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
    const sc = this.sc;

    const counts: Record<string, number> = {};
    reqs.forEach(r => { const s = (st[r.id] || { s: 'pending' }).s; counts[s] = (counts[s] || 0) + 1; });
    this.counts = counts;
    this.matchable = reqs.filter(r => this.isDoc(r) && st[r.id]?.s !== 'na').length;
    this.pct = this.matchable ? Math.round(100 * ((counts['covered'] || 0) + (counts['partial'] || 0)) / this.matchable) : 0;
    this.highCount = reqs.filter(r => r.priority === 'High').length;
    this.hasFlag = reqs.some(r => r.flag);
    this.likelyIds = reqs.filter(r => st[r.id]?.s === 'review' && r.cand?.verdict === 'Likely match').map(r => r.id);
    this.askableGaps = reqs.filter(r => this.isDoc(r) && st[r.id]?.s === 'gap' && !st[r.id]?.requested).map(r => r.id);

    const n = (c: ReqCls) => reqs.filter(r => r.cls === c).length;
    const pl = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    const d = n('document_request'), q = n('question'), i = n('instruction'), no = n('note');
    this.typeChips = { doc: pl(d, 'document request', 'document requests'), q: pl(q, 'question', 'questions'), i: pl(i, 'instruction', 'instructions'), n: pl(no, 'note', 'notes'), docCount: d, qCount: q, iCount: i, nCount: no };
    this.foundLine = q ? `${pl(d, 'document request', 'document requests')} and ${pl(q, 'question', 'questions')} found` : `${pl(d, 'document request', 'document requests')} found`;

    this.tabs = [{ id: sc.id, label: sc.tabLabel }];
    const rowsPreview = sc.source.build(sc.reqs);
    this.headerRowOptions = Array.from({ length: 8 }, (_, k) => k + 1).map(n => {
      const r = rowsPreview.find(x => x.n === n); const t = r ? (r.cells.filter(Boolean).join(' · ') || '(empty)') : '(empty)';
      return { value: String(n), label: `Row ${n} — ${t.length > 48 ? t.slice(0, 46) + '…' : t}` };
    });
    this.scopeOptions = [
      { value: 'all', label: `All documents in ${sc.room} (${this.totalDocsLabel})` },
      { value: 'a', label: 'Documents a group can see…' },
    ];
    this.viewItems = [
      { id: 'source', label: 'Source file' },
      { id: 'requests', label: 'Requests', count: isResults && counts['review'] ? counts['review'] : undefined },
    ];

    // Grid templates
    const w = (x: number | 'fill') => x === 'fill' ? 'minmax(260px, 1fr)' : x + 'px';
    this.gridCols = '40px ' + sc.source.widths.map(w).join(' ');
    const prio = sc.hasPriority ? ' 72px' : '';
    this.listCols = `136px 56px${prio} minmax(0, 1fr) 88px`;

    // Filters
    const inFolders = this.layout === 'folders';
    const fdef: [Filter, string, number][] = [
      ['all', 'All', inFolders ? reqs.filter(r => this.isDoc(r)).length : reqs.length],
      ['covered', 'Covered', (counts['covered'] || 0) + (counts['partial'] || 0)],
      ['review', 'To review', counts['review'] || 0],
      ['gap', 'Gaps', counts['gap'] || 0],
    ];
    this.filters = fdef.filter(f => !(inFolders && f[0] === 'other')).map(([id, label, count]) => ({
      id, label, count, active: (this.filter === id || (inFolders && id === 'all' && this.filter === 'other')) && !this.changeFilter,
    }));
    this.filterItems = this.filters.map(f => ({ id: f.id, label: f.label, count: f.count }));

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
    const pass = (s: string, r: Req, rec?: Rec) => {
      if (isResults && this.highOnly && r.priority !== 'High') return false;
      if (isResults && this.changeFilter) { const ch = rec?.change; return !!ch && (this.changeFilter === 'all' || ch.kind === this.changeFilter); }
      if (!isResults || this.filter === 'all') return true;
      if (this.filter === 'covered') return s === 'covered' || s === 'partial';
      if (this.filter === 'other') return s === 'question' || s === 'instruction' || s === 'note';
      return s === this.filter;
    };
    const secs = [...sc.sections, { id: 'X', name: 'Instructions and notes', src: '', row: 0 }];
    let groups: GroupVm[] = [];
    secs.forEach(sec => {
      const inSec = reqs.filter(r => r.sec === sec.id);
      const m = inSec.filter(r => this.isDoc(r) && st[r.id] && st[r.id].s !== 'na').length;
      const cov = inSec.filter(r => st[r.id]?.s === 'covered' || st[r.id]?.s === 'partial').length;
      const fnd = inSec.filter(r => st[r.id]?.s === 'found').length;
      const items = inSec.filter(r => pass((st[r.id] || { s: 'pending' }).s, r, st[r.id])).map(r => this.rowVm(r, st[r.id] || { s: 'pending' }));
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
      groups = flat.length ? [{ id: 'chg', label: '', name: `Changes since your visit on ${sc.returning.since}`, meta: `${flat.length} ${flat.length === 1 ? 'request' : 'requests'} · reopened first`, items: flat, hasSrc: false, row: 0, hasBar: false, pct: 0 }] : [];
    }
    this.groups = groups;

    // Selected
    this.sel = this.selVm(reqs);
    this.showPanel = isResults && this.view === 'requests' && this.layout !== 'folders' && ((this.panel === 'item' && !!this.sel) || this.panel === 'diff');
    // With the drawer open, Priority lives in the drawer; the table keeps room for documents
    this.tblCols = this.drawerOpen ? `112px 48px minmax(200px, 1fr) minmax(180px, 260px)` : `112px 56px${prio} minmax(240px, 1fr) minmax(220px, 340px)`;

    this.buildSource();
    if (isResults && this.layout === 'folders') this.fv = this.foldersView(reqs);
  }

  /** The one thing worth reading under a row's documents, if anything. */
  private lineFor(r: Req, rec: Rec): { line: string; lineTone: Tone } {
    const s = rec.s; const miss = rec.missing || r.cand?.missing || '';
    const asked = rec.requested ? (this.isBidder ? ' · asked in Q&A' : ' · requested from seller') : '';
    if (s === 'review') {
      if (r.cand?.period) return { line: `Wrong period: document covers ${r.cand.period.found}`, lineTone: 'warn' };
      if (r.cand?.draft) return { line: 'Includes an unsigned draft', lineTone: 'warn' };
      return { line: miss ? 'Missing: ' + miss : '', lineTone: 'warn' };
    }
    if (s === 'partial') return { line: 'Missing: ' + miss + asked, lineTone: 'warn' };
    if (s === 'gap') return { line: (rec.reopened ? 'Linked file deleted' : rec.rejected ? 'Suggestion rejected' : 'Nothing found') + asked, lineTone: 'error' };
    if (s === 'na') return { line: 'Not applicable', lineTone: 'muted' };
    if (s === 'question') return { line: rec.requested ? (this.isBidder ? 'Added to Q&A' : 'Answer requested') : 'Needs a written answer', lineTone: 'muted' };
    if (s === 'instruction' || s === 'note') return { line: 'Not matched', lineTone: 'muted' };
    return { line: '', lineTone: 'muted' };
  }

  private issueFor(r: Req, s: string): string {
    if (s !== 'review' || !r.cand) return '';
    if (r.cand.period) return `Wrong period · document covers ${r.cand.period.found}`;
    if (r.cand.draft) return 'Includes a draft, not executed';
    return '';
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
    const srcOrig = (this.sc.reqs.find(x => x.id === r.id) || r).text;
    const ch = rec.change;
    let tag: RowVm['tag'] = null;
    if (ch) tag = { label: ch.kind === 'reopened' ? 'Changed' : 'New', variant: CHANGE_VARIANT[ch.kind] };
    else if (rec.isNew) tag = { label: 'New', variant: 'green' };
    else if (r.edited) tag = { label: 'Edited', variant: 'grey' };
    const reason = isResults && ch ? ch.reason : (r.edited && !isEditing ? `Edited by you. Original in your file: “${r.origText || srcOrig}”` : '');

    return {
      id: r.id, label: this.lbl(r), row: r.row, text: (showReadAs ? r.readAs : r.text) as string, pill: this.pill(s),
      priority: r.priority || '', asAt: r.asAt && r.asAt !== 'Current' ? r.asAt : '',
      chips: all.length > LIMIT && !exp ? all.slice(0, LIMIT) : all, allCount: all.length,
      hasMore: all.length > LIMIT, expanded: exp, moreLabel: exp ? 'Show fewer' : `Show ${all.length - LIMIT} more`,
      prefix, note, noteTone, next, nextTone, action, issue: isResults ? this.issueFor(r, s) : '',
      ...this.lineFor(r, rec),
      actionHint: action === 'Review' ? 'Open the suggestion to accept or reject it' : this.sideHint,
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
    const cd = r.cand ? this.doc(r.cand.name) : { path: '', summary: '' } as DocInfo;
    const nd = r.near ? this.doc(r.near.name) : { path: '' } as DocInfo;
    const linked = rec.docs || r.docs || [];
    const sec = this.sc.sections.find(x => x.id === r.sec);
    const ro = this.sc.returning.reopened;
    const statusOut = this.sc.statusMap && (rec.s === 'covered' || rec.s === 'partial') ? this.sc.statusMap[rec.s] : '';
    return {
      id: r.id, label: this.lbl(r), row: r.row, text: r.readAs || r.text, original: r.text, hasOriginal: !!r.readAs,
      pill: this.pill(rec.s), priority: r.priority || '', asAt: r.asAt || '',
      isReview: rec.s === 'review', isCovered: rec.s === 'covered' || rec.s === 'partial', isPartial: rec.s === 'partial',
      isGap: rec.s === 'gap', isQuestion: rec.s === 'question', isInstruction: rec.s === 'instruction', isNote: rec.s === 'note', isNa: rec.s === 'na',
      queue: qi >= 0 ? `${qi + 1} of ${rids.length} to review` : '', queueShort: qi >= 0 ? `${qi + 1} of ${rids.length}` : '',
      docName: r.cand?.name || '', docLabel: cd.label || r.cand?.name || '', docPath: cd.path, summary: cd.summary, why: r.cand?.why || '',
      docFiles: (cd.files || []).map(f => ({ name: f, draft: /draft/i.test(f) })),
      period: r.cand?.period || null,
      evidence: r.cand?.evidence || null, nearEvidence: r.near?.evidence || null,
      strength: r.cand?.verdict === 'Likely match' ? 'Strong' : 'Medium',
      ifAccepted: this.sc.statusMap && rec.s === 'review' ? (r.cand?.verdict === 'Partial' ? this.sc.statusMap.partial : this.sc.statusMap.covered) : '',
      history: [
        ...(rec.s === 'question' || rec.s === 'instruction' || rec.s === 'note' ? [] : [{ what: r.cand ? `AI suggested ${this.doc(r.cand.name).label || r.cand.name}` : (r.docs ? 'AI matched ' + r.docs.length + (r.docs.length === 1 ? ' document' : ' documents') : 'AI found nothing above the threshold'), who: 'AI matching', at: this.sc.matchedAt }]),
        ...(rec.history || []),
      ],
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
      exportStatus: statusOut,
      gapTitle: rec.reopened ? 'Reopened: the linked file was deleted' : rec.rejected ? 'Suggestion rejected' : r.near ? 'Nothing above the match threshold' : 'Nothing found',
      gapText: rec.reopened ? `${ro.file} was deleted by ${ro.by} on ${ro.on} and is in the recycle bin. Restore it, or ask the seller for a current version.`
        : rec.rejected ? 'The suggested document was rejected. Ask the seller for it, link another document, or mark the request not applicable.' : (r.note || ''),
      hasNear: !!(r.near && !rec.rejected), nearName: r.near?.name || '', nearPath: nd.path, nearWhy: r.near?.why || '',
      requested: !!rec.requested, isReopened: !!rec.reopened,
      srcLine: r.sec === 'X' ? `Source: ${this.sc.sheets[0].name}, row ${r.row} · outside any section`
        : `Source: ${this.sc.sheets[0].name}, row ${r.row} · ${this.lbl(r)} under “${sec?.src.replace(/:$/, '')}”`,
      canEditReading: r.cls === 'document_request' || r.cls === 'question',
      reading: rec.reading || r.readAs || r.text, readingEdited: !!rec.reading,
      issues: [
        ...(rec.s === 'review' && r.cand?.period ? [{ icon: 'calendar', title: 'Wrong period.', text: `The document covers ${r.cand.period.found}; the request asks for ${r.cand.period.requested}.` }] : []),
        ...(rec.s === 'review' && r.cand?.draft ? [{ icon: 'warning', title: 'Draft, not executed.', text: 'At least one document in the suggestion is an unsigned draft.' }] : []),
        ...((rec.s === 'review' || rec.s === 'partial') && (rec.missing || r.cand?.missing) ? [{ icon: 'info', title: 'Missing:', text: rec.missing || r.cand!.missing }] : []),
      ],
      writes: this.writesFor(r, rec),
    };
  }

  /** What the file's own result columns hold (or will hold after Accept) for this request. */
  private writesFor(r: Req, rec: Rec): { col: string; val: string }[] | null {
    const cols = this.sc.details?.resultCols; const map = this.sc.statusMap;
    if (!cols || !map || cols.length < 3) return null;
    const s = rec.s; const miss = rec.missing || r.cand?.missing || '';
    if (s === 'review') return [{ col: cols[0], val: r.cand!.verdict === 'Partial' ? map.partial : map.covered }, { col: cols[1], val: this.doc(r.cand!.name).label || r.cand!.name }, { col: cols[2], val: miss ? 'Missing: ' + miss : '' }];
    if (s === 'covered' || s === 'partial') return [{ col: cols[0], val: map[s] }, { col: cols[1], val: (rec.docs || r.docs || []).map(n => this.doc(n).label || n).join('\n') }, { col: cols[2], val: s === 'partial' ? 'Missing: ' + miss : '' }];
    return null;
  }

  private buildSource() {
    const rows = this.sc.source.build(this.withEdits(this.sourceEdited));
    this.sourceRows = rows;
    const hl = this.highlightRow;
    const hr = hl !== null ? rows.find(x => x.n === hl) : undefined;
    this.hlCell = hr ? (hr.kind === 'item' ? hr.cells[2] : hr.cells[0]) || '' : '';
    const hlReq = this.findReq(this.backTo);
    const what = hlReq ? (hlReq.label ? 'this ' + hlReq.cls.replace('_', ' ') : 'request ' + hlReq.id) : (this.backTo || 'this item');
    this.hlText = `Row ${hl} is the source of ${what}.`;
  }

  private foldersView(reqs: Req[]) {
    const gone = this.deletedFiles;
    const later = this.sc.returning.laterFiles;
    const tree: FolderNode[] = this.sc.folderTree.map(f => ({ ...f, files: f.files.filter(n => !gone.includes(n) && (this.returningCands || !later.includes(n))) }));
    const byId: Record<string, FolderNode> = {}; tree.forEach(f => byId[f.id] = f);
    const linkToFolder: Record<string, string> = {}; tree.forEach(f => { if (f.link) linkToFolder[f.link] = f.id; });
    const fpass = (s?: string) => {
      const f = this.filter;
      if (f === 'all' || f === 'other') return true;
      if (f === 'covered') return s === 'covered' || s === 'partial';
      return s === f;
    };
    const allDocReqs = reqs.filter(r => this.isDoc(r));
    const docReqs = allDocReqs.filter(r => fpass(this.st[r.id]?.s) && (!this.highOnly || r.priority === 'High'));
    type Use = { id: string; type: string };
    const fileUse: Record<string, Use[]> = {}, folderUse: Record<string, Use[]> = {}, reqFiles: Record<string, string[]> = {}, reqFolder: Record<string, string> = {};
    const add = (map: Record<string, Use[]>, k: string, id: string, type: string) => { (map[k] = map[k] || []).push({ id, type }); };
    const place = (map: string, r: Req, type: string, files: string[]) => {
      if (linkToFolder[map]) { add(folderUse, linkToFolder[map], r.id, type); reqFolder[r.id] = linkToFolder[map]; }
      else { add(fileUse, map, r.id, type); files.push(map); }
    };
    docReqs.forEach(r => {
      const rec = this.st[r.id] || { s: 'pending' };
      const type = rec.s === 'covered' ? 'linked' : rec.s === 'partial' ? 'partial' : null;
      const files: string[] = [];
      if (type) (rec.docs || r.docs || []).forEach(dn => place(dn, r, type, files));
      if (rec.s === 'review' && r.cand) place(r.cand.name, r, 'suggested', files);
      if (rec.s === 'gap' && r.near && !rec.rejected) place(r.near.name, r, 'closest', files);
      reqFiles[r.id] = files;
    });
    const desc = (fid: string): string[] => { let out = [fid]; tree.forEach(f => { if (f.parent === fid) out = out.concat(desc(f.id)); }); return out; };
    const subUses = (fid: string) => { const u: Use[] = []; desc(fid).forEach(id => { byId[id].files.forEach(nm => (fileUse[nm] || []).forEach(x => u.push(x))); (folderUse[id] || []).forEach(x => u.push(x)); }); return u; };
    const subFiles = (fid: string) => desc(fid).flatMap(id => byId[id].files);
    let selId: string | null = this.fSelFile ? null : (this.fSelReq || this.sc.defaultFolderReq);
    if (selId && !docReqs.find(r => r.id === selId)) selId = docReqs.length ? docReqs[0].id : null;
    const sel = selId ? docReqs.find(r => r.id === selId) : undefined;
    const selFiles = sel ? (reqFiles[sel.id] || []) : [];
    const selFolder = sel ? reqFolder[sel.id] : undefined;
    const related = (fid: string) => {
      if (selFolder && (desc(selFolder).includes(fid) || desc(fid).includes(selFolder))) return true;
      const files = subFiles(fid);
      if (this.fSelFile) return files.includes(this.fSelFile);
      return selFiles.some(nm => files.includes(nm));
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
      const used = f.files.filter(nm => fileUse[nm]).length;
      let meta = f.count ? `${f.count} documents` : (f.files.length ? `${used} of ${f.files.length} files used` : '');
      if (linkedHere) meta = `Linked as a whole folder, ${f.count} documents`;
      rows.push({ key: 'f-' + f.id, isFolder: true, name: f.name, meta, depth: f.depth, expanded: op, related: rel, linkedHere, unused: uses.length === 0, picked: false,
        tint: linkedHere ? 'linked' : rel ? 'related' : 'none', type: rel ? 'folder-open' : 'folder', chips: all.slice(0, 6), moreChips: all.length - 6, folderId: f.id });
      if (!op) return;
      f.files.forEach(nm => {
        const u = fileUse[nm] || [];
        const mine = sel ? u.find(x => x.id === sel.id) : undefined;
        const picked = this.fSelFile === nm;
        rows.push({ key: 'x-' + f.id + nm, isFolder: false, name: nm, meta: '', depth: f.depth + 1, expanded: false, related: false, linkedHere: false,
          unused: u.length === 0, picked, tint: mine ? mine.type : 'none', type: this.fileType(nm), chips: chipsFor(u), moreChips: 0, fileName: nm });
      });
    });

    const fileReqs = this.fSelFile ? (fileUse[this.fSelFile] || []).map(u => u.id) : [];
    const groups = this.sc.sections.filter(s => docReqs.some(r => r.sec === s.id)).map(s => ({
      id: s.id, name: s.name,
      items: docReqs.filter(r => r.sec === s.id).map(r => {
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
      selFiles.forEach(nm => tree.forEach(f => { if (f.files.includes(nm)) fset[f.id] = 1; }));
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
