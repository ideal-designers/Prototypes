import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, BreadcrumbItem, TabItem, DropdownOption, ChipVariant, FvdrFileType, SegmentItem } from '../../shared/ds';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import { DIAMOND, Req, DocInfo, Rec, ChangeKind, SrcRow, Scenario, MatchState } from './checklist-matching.data';
import { LIGHTHOUSE } from './lighthouse.data';

type Phase = 'empty' | 'uploading' | 'none' | 'reading' | 'structure' | 'matching' | 'results';
type Screen = 'upload' | 'source' | 'structure' | 'matching' | 'results' | 'complete' | 'returning';
type Filter = 'all' | 'review' | 'gap' | 'covered';
type DrawerMode = 'none' | 'row' | 'read';

const SCENARIOS: Record<string, Scenario> = { lighthouse: LIGHTHOUSE, diamond: DIAMOND };
const PILL: Record<string, { label: string; variant: ChipVariant }> = {
  pending: { label: 'Request', variant: 'blue' }, question: { label: 'Question', variant: 'purple' },
  searching: { label: 'Searching', variant: 'default' }, found: { label: 'Found', variant: 'indigo' },
  covered: { label: 'Covered', variant: 'green' }, partial: { label: 'Partial', variant: 'teal' },
  review: { label: 'To review', variant: 'yellow' }, gap: { label: 'Gap', variant: 'danger' }, na: { label: 'N/A', variant: 'grey' },
};

/**
 * Due diligence checklist — AI matching, inline (concept v3).
 * No separate Requests view: AI marks requests and results right in the source spreadsheet,
 * and a row opens a drawer with the finding and the confirmation.
 */
@Component({
  selector: 'fvdr-checklist-inline',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent],
  template: `
  <div class="page">
    <fvdr-sidebar-nav variant="vdr" [accountName]="sc.room" [items]="nav" [(collapsed)]="sidebarCollapsed" />
    <div class="main">
      <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="VO" />
      <div class="content" #content [class.content--drawer]="drawer !== 'none'">

        <!-- Upload -->
        <section class="drop" *ngIf="phase === 'empty' || phase === 'uploading'">
          <ng-container *ngIf="phase === 'empty'">
            <span class="drop__icon"><fvdr-icon name="upload" /></span>
            <h2 class="drop__title">Upload your due diligence checklist</h2>
            <p class="drop__text">Drag an Excel file here or choose one from your computer. You'll be able to view and edit it here and share it with groups.</p>
            <fvdr-btn label="Choose file" iconName="upload" (clicked)="upload()" />
            <span class="muted">Excel files (.xlsx)</span>
          </ng-container>
          <div class="up-file" *ngIf="phase === 'uploading'">
            <fvdr-file-icon type="xls" />
            <div class="up-file__body">
              <span class="b">{{ sc.fileName }}</span>
              <span class="muted">{{ sc.fileMeta }} · uploading {{ upPct }}%</span>
              <div class="bar"><div class="bar__fill" [style.width.%]="upPct"></div></div>
            </div>
          </div>
        </section>

        <ng-container *ngIf="hasFile">
          <div class="tabs-row">
            <fvdr-tabs [tabs]="tabs" [activeId]="sc.id" />
            <fvdr-btn variant="ghost" size="s" iconName="plus" [iconOnly]="true" ariaLabel="Add checklist" />
          </div>
          <div class="toolbar">
            <fvdr-btn label="Edit" iconName="edit" />
            <fvdr-btn label="Upload new version" iconName="refresh" variant="secondary" />
            <fvdr-btn label="Download" iconName="download" variant="secondary" />
            <fvdr-btn label="Delete" iconName="trash" variant="danger-secondary" />
            <span class="spacer"></span>
            <span class="owner" fvdrTooltip="Only people who can edit this checklist see it and its AI results" tooltipPosition="bottom"><fvdr-avatar initials="VO" size="sm" /> Only you</span>
            <fvdr-btn label="Share" iconName="share" variant="secondary" />
          </div>

          <div class="work">
          <!-- ── AI bar: message group on the left, controls on the right ── -->
          <div class="aibar" [class.aibar--busy]="phase === 'reading' || phase === 'matching'" [class.aibar--start]="phase === 'none'" [class.aibar--results]="phase === 'results'">
            <!-- Analyze checklist leads the bar, like primary actions elsewhere in the product -->
            <fvdr-btn *ngIf="phase === 'none' && roomAiOn" label="Analyze checklist" (clicked)="read()" />
            <div class="aibar__l">
              <span class="aibar__mark" *ngIf="phase === 'none' || phase === 'structure'"><fvdr-icon name="sparkle" /></span>
              <!-- While AI is working, a progress ring takes the icon's place -->
              <span class="ring" *ngIf="phase === 'reading' || phase === 'matching'" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                [attr.aria-valuenow]="busyPct" [style.--p]="busyPct"></span>
              <ng-container *ngIf="phase === 'none'">
                <span class="aibar__text"><b>Find documents for this checklist.</b> AI marks every request in the file, then matches it to documents in {{ sc.room }}. The file isn't changed.</span>
              </ng-container>
              <ng-container *ngIf="phase === 'reading'">
                <span class="aibar__text"><b>Reading the checklist…</b> {{ sc.sheets[0].name }} · row {{ readRow }} of {{ sc.sheets[0].rows }}</span>
              </ng-container>
              <ng-container *ngIf="phase === 'structure'">
                <span class="aibar__text"><b>{{ docCount }} requests marked in the file.</b> Click a row to check it.</span>
                <button class="lnk" (click)="openRead()">What AI read</button>
              </ng-container>
              <ng-container *ngIf="phase === 'matching'">
                <span class="aibar__text"><b>Matching…</b> {{ docsRead }} of {{ totalDocsLabel }} documents · {{ eta }}</span>
              </ng-container>
              <ng-container *ngIf="phase === 'results' && !complete">
                <fvdr-segment variant="table" size="md" [items]="filterItems" [activeId]="filter" (activeIdChange)="setFilter($any($event))" />
                <span class="muted" *ngIf="delta">since {{ sc.returning.since }}: {{ deltaText }}</span>
              </ng-container>
              <!-- 100%: nothing left to filter or review, so the filters give way to the outcome -->
              <span class="done" *ngIf="phase === 'results' && complete">
                <fvdr-icon name="finished" />
                <span><b>Every request has a document.</b> {{ doneText }}</span>
              </span>
            </div>

            <!-- Results: coverage pill sits between the filters and the actions -->
            <div class="cov" *ngIf="phase === 'results'">
              <span class="cov__val" [attr.aria-label]="pct + '% of document requests covered'">
                <span class="ring" [style.--p]="pct" aria-hidden="true"></span>
                <span><b>{{ pct }}%</b> covered</span>
              </span>
              <button class="lnk" (click)="openRead()">What AI read</button>
            </div>

            <div class="aibar__r">
              <ng-container *ngIf="phase === 'none'">
                <span *ngIf="!roomAiOn" class="muted">AI is off for this room. A project admin can turn it on in Settings.</span>
              </ng-container>
              <ng-container *ngIf="phase === 'structure'">
                <fvdr-dropdown class="scope" [options]="scopeOptions" [value]="scope" (valueChange)="scope = asString($event)" />
                <fvdr-btn label="Match documents" (clicked)="startMatching()" />
              </ng-container>
              <fvdr-btn *ngIf="phase === 'matching'" label="Stop" variant="ghost" (clicked)="stopMatching()" />
              <ng-container *ngIf="phase === 'results'">
                <!-- With the drawer open, its own ↑↓ "n of N to review" replaces Review next -->
                <fvdr-btn *ngIf="reviewIds.length && drawer === 'none'" [label]="'Review next (' + reviewIds.length + ')'" (clicked)="reviewNext()" />
                <div class="export">
                  <fvdr-btn label="Export" iconName="download" [variant]="complete ? 'primary' : 'secondary'" (clicked)="exportOpen = !exportOpen" />
                  <div class="menu" *ngIf="exportOpen">
                    <span class="menu__warn" *ngIf="reviewIds.length"><fvdr-icon name="warning" />{{ reviewIds.length }} suggestions not reviewed are exported as notes.</span>
                    <button class="menu__item" (click)="doExport('file')"><b>{{ sc.tabLabel }} with results</b><span class="muted">{{ hasResultCols ? 'Exactly what you see in the file now.' : 'Adds Status, Documents and Missing columns.' }}</span></button>
                    <button class="menu__item" *ngIf="!complete || partialCount" (click)="doExport('gap')"><b>Gap report</b><span class="muted">Only gaps and partial requests.</span></button>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- ── The file itself ── -->
          <div class="sheet" [class.sheet--noai]="!showAiCol">
            <div class="sheet__formula">
              <fvdr-icon name="search" class="muted-i" />
              <span class="sheet__ref">{{ selRow ? 'C' + selRow.n : 'A1' }}</span>
              <span class="sheet__val">{{ selRow ? (selRow.cells[2] || selRow.cells[0]) : sourceRows[0]?.cells?.[0] }}</span>
            </div>
            <div class="sheet__scroll">
              <div class="sheet__grid">
                <div class="sr sr--cols" [style.grid-template-columns]="gridCols">
                  <span class="sc sc--n"></span>
                  <span class="sc sc--ai" *ngIf="showAiCol"><fvdr-icon name="sparkle" /> AI</span>
                  <span class="sc" *ngFor="let c of colLetters">{{ c }}</span>
                </div>
                <div *ngFor="let r of sourceRows; trackBy: byN" class="sr" [ngClass]="'sr--' + r.kind" [attr.id]="'row-' + r.n"
                     [class.sr--req]="!!r.reqId && showAiCol" [class.sr--sel]="!!r.reqId && r.reqId === selected"
                     [class.sr--dim]="isDim(r)" [style.grid-template-columns]="gridCols"
                     (click)="r.reqId && showAiCol && openRow(r.reqId)">
                  <span class="sc sc--n">{{ r.n }}</span>
                  <span class="sc sc--ai" *ngIf="showAiCol">
                    <ng-container *ngIf="r.reqId && pillFor(r.reqId) as p">
                      <fvdr-chip [label]="p.label" [variant]="p.variant" size="xs" [class.pulse]="p.label === 'Searching'" />
                      <span class="chg" *ngIf="changeOf(r.reqId) as c" [ngClass]="'chg--' + c" [fvdrTooltip]="changeReason(r.reqId)"></span>
                    </ng-container>
                  </span>
                  <span class="sc sc--span" *ngIf="isSpan(r)">{{ r.cells[0] }}</span>
                  <ng-container *ngIf="!isSpan(r)">
                    <span class="sc" *ngFor="let i of colIdx" [ngClass]="cellClass(r, i)">{{ cellText(r, i) }}<fvdr-icon *ngIf="r.kind === 'item' && sc.source.selectCols.includes(i)" name="chevron-down" /></span>
                  </ng-container>
                </div>
              </div>
            </div>
            <div class="sheet__tabs">
              <span class="sheet__tab" *ngFor="let s of sc.sheets; let first = first" [class.sheet__tab--on]="first">{{ s.name }}</span>
              <span class="spacer"></span><span class="muted">100%</span>
            </div>
          </div>
          </div>
        </ng-container>
      </div>
    </div>

    <!-- ── Drawer ── -->
    <aside class="drawer" *ngIf="drawer !== 'none'" role="dialog" aria-label="Request details">
      <!-- What AI read -->
      <ng-container *ngIf="drawer === 'read'">
        <header class="dh">
          <span class="dh__title">What AI read</span>
          <span class="spacer"></span>
          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="closeDrawer()" />
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
              <div><dt>Found</dt><dd>{{ docCount }} document requests<ng-container *ngIf="otherCount"> · {{ otherCount }} instructions and notes, kept but not matched</ng-container></dd></div>
              <div><dt>Read from</dt><dd>{{ sc.details?.columnsUsed?.join(', ') }}</dd></div>
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
            <fvdr-segment variant="table" size="md" [items]="sideItems" [activeId]="isBidder ? 'buy' : 'sell'" (activeIdChange)="isBidder = $event === 'buy'" />
            <p class="ds__p">{{ isBidder ? 'Missing items become questions to the seller in Q&A.' : 'Missing items become upload requests to the seller team.' }}</p>
          </section>
          <section class="ds ds--quiet">
            <h3 class="ds__h">How matching works</h3>
            <p class="ds__p">AI reads the checklist and the documents in the scope you pick, nothing else. It never changes your file, never accepts for you and never messages the seller without your click. Every decision is logged in the Activity log.</p>
          </section>
        </div>
      </ng-container>

      <!-- Row -->
      <ng-container *ngIf="drawer === 'row' && d as s">
        <header class="dh">
          <fvdr-chip [label]="s.pill.label" [variant]="s.pill.variant" size="s" />
          <span class="dh__ref">{{ s.ref }}</span>
          <span class="spacer"></span>
          <span class="dh__pos" *ngIf="s.pos">{{ s.pos }}</span>
          <fvdr-btn variant="ghost" size="s" iconName="chevron-up" [iconOnly]="true" ariaLabel="Previous (K)" (clicked)="step(-1)" />
          <fvdr-btn variant="ghost" size="s" iconName="chevron-down" [iconOnly]="true" ariaLabel="Next (J)" (clicked)="step(1)" />
          <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close (Esc)" (clicked)="closeDrawer()" />
        </header>

        <div class="db">
          <!-- 1 · The request -->
          <section class="ds ds--req">
            <p class="req">{{ s.text }}</p>
            <ul class="meta">
              <li><span class="meta__k">Row</span>{{ s.row }}</li>
              <li *ngIf="s.priority"><span class="meta__k">Priority</span>{{ s.priority }}</li>
              <li *ngIf="s.asAt"><span class="meta__k">As at</span>{{ s.asAt }}</li>
            </ul>
          </section>

          <!-- 2 · What AI found -->
          <section class="ds" *ngIf="s.isPending">
            <h3 class="ds__h">How AI reads this row</h3>
            <fvdr-dropdown size="s" [options]="clsOptions" value="document_request" />
            <p class="ds__p">Document requests are matched to documents. Questions, instructions and notes are kept, not matched.</p>
          </section>

          <section class="ds" *ngIf="s.isReview">
            <div class="ds__row">
              <h3 class="ds__h">Suggested document</h3>
              <span class="strength" [ngClass]="'strength--' + s.strength.toLowerCase()" [fvdrTooltip]="s.strength + ' match'"><i></i><i></i><i></i>{{ s.strength }} match</span>
            </div>
            <div class="doc">
              <fvdr-file-icon [type]="s.candType" />
              <div class="doc__b">
                <button class="doc__name" (click)="openDoc(s.candName)">{{ s.candLabel }}</button>
                <span class="doc__path">{{ s.candPath }}</span>
              </div>
            </div>
            <figure class="quote" *ngIf="s.evidence">
              <blockquote>{{ s.evidence.quote }}</blockquote>
              <figcaption>{{ s.evidence.page }}</figcaption>
            </figure>
          </section>

          <section class="ds" *ngIf="s.isCovered">
            <h3 class="ds__h">Linked documents</h3>
            <div class="doc" *ngFor="let doc of s.docs">
              <fvdr-file-icon [type]="doc.type" />
              <div class="doc__b">
                <button class="doc__name" (click)="openDoc(doc.name)">{{ doc.label }}</button>
                <span class="doc__path">{{ doc.path }}</span>
              </div>
              <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Unlink" (clicked)="unlink(doc.name)" />
            </div>
          </section>

          <section class="ds" *ngIf="s.isGap">
            <h3 class="ds__h">{{ s.gapTitle }}</h3>
            <p class="ds__p">{{ s.note }}</p>
            <div class="doc doc--muted" *ngIf="s.nearName">
              <fvdr-file-icon [type]="s.nearType" />
              <div class="doc__b">
                <button class="doc__name" (click)="openDoc(s.nearName)">{{ s.nearName }}</button>
                <span class="doc__path">Closest document, below the match threshold</span>
              </div>
              <fvdr-btn label="Link anyway" variant="ghost" size="s" (clicked)="linkNear()" />
            </div>
          </section>

          <!-- 3 · Needs attention (all warnings in one place) -->
          <section class="ds" *ngIf="s.issues.length">
            <h3 class="ds__h">Needs attention</h3>
            <ul class="issues">
              <li *ngFor="let i of s.issues"><fvdr-icon [name]="i.icon" /><span><b>{{ i.title }}</b> {{ i.text }}</span></li>
            </ul>
          </section>

          <!-- Draft to the seller -->
          <section class="ds" *ngIf="composeOpen">
            <h3 class="ds__h">{{ isBidder ? 'Question to the seller' : 'Upload request to the seller' }}</h3>
            <fvdr-textarea [(ngModel)]="composeText" [rows]="6" />
            <p class="ds__p">Goes to {{ isBidder ? 'Q&A' : 'the seller team' }} only when you click Send. You can edit it first.</p>
          </section>

          <!-- 4 · In your file -->
          <section class="ds" *ngIf="s.writes">
            <h3 class="ds__h">{{ s.isReview ? 'If you accept, your file gets' : 'In your file' }}</h3>
            <dl class="kvs">
              <div *ngFor="let w of s.writes"><dt>{{ w.col }}</dt><dd [class.kv__empty]="!w.val">{{ w.val || 'Empty' }}</dd></div>
            </dl>
          </section>

          <!-- 5 · History -->
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
          <ng-container *ngIf="(s.isGap || s.isPartial) && !composeOpen && !s.requested">
            <fvdr-btn [label]="isBidder ? 'Ask in Q&A' : 'Request from seller'" (clicked)="openCompose()" />
            <fvdr-btn *ngIf="s.isGap" label="Mark N/A" variant="secondary" (clicked)="markNa()" />
          </ng-container>
          <ng-container *ngIf="composeOpen">
            <fvdr-btn [label]="isBidder ? 'Send to Q&A' : 'Send request'" iconName="send" (clicked)="sendCompose()" />
            <fvdr-btn label="Cancel" variant="secondary" (clicked)="composeOpen = false" />
          </ng-container>
          <span class="df__done" *ngIf="s.requested"><fvdr-icon name="check" />{{ isBidder ? 'Asked in Q&A' : 'Requested from the seller' }}</span>
          <ng-container *ngIf="s.isPending">
            <fvdr-btn label="Looks right" (clicked)="step(1)" />
            <fvdr-btn label="Edit text" variant="secondary" />
          </ng-container>
        </footer>
      </ng-container>
    </aside>

    <fvdr-toast-host />
    <fvdr-vdr-proto-switcher [style.left]="drawer !== 'none' ? 'calc((100% - 440px) / 2)' : null" [groups]="protoGroups" (changed)="onProto($event)" (restart)="go(screen)" />
  </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-primary); }
    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .content { flex: 1; min-height: 0; overflow: auto; padding: var(--space-3) var(--space-6) calc(var(--space-16) + var(--space-4)); display: flex; flex-direction: column; gap: var(--space-6); }
    /* AI bar and the sheet read as one block */
    .work { display: flex; flex-direction: column; gap: var(--space-4); }
    .content--drawer { padding-right: var(--space-6); }
    .spacer { flex: 1; }
    .b { font-weight: var(--font-weight-semi); }
    .muted { color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .muted-strong { color: var(--color-text-secondary); }
    .muted-i { color: var(--color-text-secondary); }
    .tone-err { color: var(--color-error-600); }
    .tone-ok { color: var(--color-primary-600); font-size: var(--text-body3-size); }
    .p { margin: 0; font-size: var(--text-body3-size); }
    .lnk { all: unset; cursor: pointer; color: var(--color-primary-600); font-weight: var(--font-weight-semi); font-size: var(--text-body3-size); }
    .lnk:hover { text-decoration: underline; }
    .lnk:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }

    .drop { border: 1px dashed var(--color-stone-500); border-radius: var(--radius-lg); padding: var(--space-16) var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; }
    .drop__icon { width: var(--space-12); height: var(--space-12); border-radius: var(--radius-full); background: var(--color-primary-50); color: var(--color-primary-500); display: inline-flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .drop__title { margin: 0; font-size: var(--text-sub2-size); line-height: var(--text-sub2-lh); font-weight: var(--text-sub2-weight); }
    .drop__text { margin: 0; max-width: 560px; color: var(--color-text-secondary); }
    .up-file { display: flex; gap: var(--space-3); align-items: center; width: min(420px, 100%); text-align: left; }
    .up-file__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
    .bar { height: var(--space-1); border-radius: var(--radius-full); background: var(--color-stone-300); overflow: hidden; width: 100%; }
    .bar__fill { height: 100%; background: var(--color-primary-500); transition: width var(--transition-fast, 0.15s) linear; }

    .tabs-row { display: flex; align-items: center; gap: var(--space-2); }
    .tabs-row fvdr-tabs { flex: 1; }
    .toolbar { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .owner { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-body3-size); color: var(--color-text-secondary); margin-right: var(--space-2); }

    /* AI bar */
    .aibar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--space-10); flex-wrap: wrap;
      padding: var(--space-4); border-radius: var(--radius-md); background: var(--color-stone-300); }
    /* Once results and filters are in, the block dissolves: no background, no side padding */
    .aibar--results { background: none; padding: 0; border-radius: 0; }
    .done { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .done fvdr-icon { color: var(--color-primary-500); font-size: var(--text-body1-size); flex: none; }
    .done b { font-weight: var(--text-label-s-weight); }
    .aibar--start { justify-content: flex-start; gap: var(--space-4); }
    .aibar__l { display: flex; align-items: center; gap: var(--space-4); min-width: 0; flex-wrap: wrap; }
    .aibar__r { display: flex; align-items: center; gap: var(--space-4); }
    .aibar__mark { color: var(--color-primary-500); display: inline-flex; font-size: var(--font-size-lg); }
    .aibar--busy .aibar__mark { animation: pulse 1.4s ease-in-out infinite; }
    .aibar__text { font-size: var(--text-body3-size); }
    .aibar__text b, .aibar__cov b { font-weight: var(--font-weight-semi); }
    .aibar__cov { font-size: var(--text-body3-size); }
    .cov { display: inline-flex; align-items: center; gap: var(--space-6); height: var(--space-10); padding: 0 var(--space-4) 0 var(--space-3); box-sizing: border-box;
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-full); font-size: var(--text-body3-size); }
    .cov__val { display: inline-flex; align-items: center; gap: var(--space-2); }
    .cov b { font-weight: var(--font-weight-semi); }
    /* Donut (coverage and AI progress): conic fill for the share, inner circle cut out with a radial mask */
    .ring { width: 20px; height: 20px; border-radius: var(--radius-full); flex: none;
      background: conic-gradient(var(--color-primary-500) calc(var(--p, 0) * 1%), var(--ring-track, var(--color-stone-300)) 0);
      -webkit-mask: radial-gradient(circle, transparent 5.5px, var(--color-text-primary) 6px); mask: radial-gradient(circle, transparent 5.5px, var(--color-text-primary) 6px); }
    .aibar > .aibar__l > .ring { --ring-track: var(--color-stone-400); }
    .aibar__chips { display: flex; gap: var(--space-1); }
    .fchip { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2); border-radius: var(--radius-full); font-size: var(--text-body3-size); border: 1px solid transparent; }
    .fchip:hover { background: var(--color-stone-0); }
    .fchip--on { background: var(--color-stone-0); border-color: var(--color-primary-500); font-weight: var(--font-weight-semi); }
    .fchip:focus-visible { outline: 2px solid var(--color-primary-500); }
    .dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-stone-500); }
    .dot--covered { background: var(--color-primary-500); } .dot--review { background: var(--color-warning-icon); } .dot--gap { background: var(--color-error-600); } .dot--all { background: var(--color-text-secondary); }
    .scope { width: 370px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
    .pulse { animation: pulse 1.4s ease-in-out infinite; }
    .export { position: relative; }
    .menu { position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 30; width: 320px; background: var(--color-stone-0); border-radius: var(--radius-md); box-shadow: var(--shadow-popup); padding: var(--space-1); display: flex; flex-direction: column; }
    .menu__item { all: unset; cursor: pointer; display: flex; flex-direction: column; gap: 2px; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); }
    .menu__item:hover { background: var(--color-hover-bg); }
    .menu__warn { display: flex; gap: var(--space-2); align-items: center; padding: var(--space-2) var(--space-3); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-warning-text); background: var(--color-warning-bg); border-radius: var(--radius-sm); }

    /* Sheet */
    .sheet { flex: none; display: flex; flex-direction: column; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; }
    .sheet__formula { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .sheet__ref, .sheet__val { height: var(--space-8); display: inline-flex; align-items: center; padding: 0 var(--space-2); border: 1px solid var(--color-divider); border-radius: var(--radius-sm); font-size: var(--text-body3-size); }
    .sheet__ref { width: 72px; }
    .sheet__val { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .sheet__scroll { overflow: auto; }
    .sheet__grid { min-width: 1180px; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .sr { display: grid; border-bottom: 1px solid var(--color-divider); transition: opacity var(--transition-fast, 0.15s); }
    .sr--cols { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; }
    .sr--header { background: var(--color-text-primary); color: var(--color-stone-0); font-weight: var(--font-weight-semi); }
    .sr--section { background: var(--color-stone-400); font-weight: var(--font-weight-semi); }
    .sr--title .sc--span { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .sr--meta .sc--span { font-style: italic; }
    .sr--legend .sc--span { font-weight: var(--text-caption2-weight); }
    .sr--req { cursor: pointer; }
    .sr--req:hover { background: var(--color-stone-100); }
    .sr--sel, .sr--sel:hover { background: var(--color-primary-50); outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
    .sr--dim { opacity: .35; }
    .sc { padding: var(--space-2); border-right: 1px solid var(--color-divider); min-width: 0; overflow-wrap: anywhere; white-space: pre-line; }
    .sc--n { background: var(--color-stone-200); color: var(--color-text-secondary); text-align: center; font-style: normal; font-weight: var(--text-body3-weight); }
    .sc--ai { display: flex; align-items: flex-start; gap: var(--space-1); background: var(--color-stone-100); color: var(--color-primary-600); font-style: normal; font-weight: var(--text-body3-weight); }
    .sr--cols .sc--ai { justify-content: center; align-items: center; background: var(--color-primary-50); font-weight: var(--font-weight-semi); }
    .sr--header .sc--ai { background: var(--color-text-primary); }
    .sc--span { grid-column: 3 / -1; }
    .sheet--noai .sc--span { grid-column: 2 / -1; }
    .sc--sel { display: flex; justify-content: space-between; gap: var(--space-1); }
    .sc--yellow { background: var(--color-warning-bg); }
    .sc--filled { background: var(--color-primary-50); }
    .sc--suggested { color: var(--color-text-secondary); font-style: italic; background: var(--color-warning-bg); }
    .sc--gapval { color: var(--color-error-600); background: var(--color-error-bg, var(--color-warning-bg)); }
    .chg { width: 8px; height: 8px; border-radius: var(--radius-full); margin-top: 6px; }
    .chg--closed { background: var(--color-primary-500); } .chg--suggested { background: var(--color-warning-icon); } .chg--reopened { background: var(--color-error-600); }
    .sheet__tabs { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); border-top: 1px solid var(--color-divider); background: var(--color-stone-100); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); }
    .sheet__tab { padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .sheet__tab--on { background: var(--color-stone-0); color: var(--color-primary-600); font-weight: var(--font-weight-semi); box-shadow: var(--shadow-card); }

    /* Drawer — header · sections · footer. Sections share one rhythm: 24px apart, divider between, 12px inside. */
    .drawer { flex: none; width: 440px; height: 100%; background: var(--color-stone-0); border-left: 1px solid var(--color-divider);
      display: flex; flex-direction: column; animation: slide .18s ease-out; }
    @keyframes slide { from { transform: translateX(var(--space-6)); opacity: 0; } to { transform: none; opacity: 1; } }
    .dh { flex: none; display: flex; align-items: center; gap: var(--space-2); height: var(--space-16); box-sizing: border-box; padding: 0 var(--space-4) 0 var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .dh__title { font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .dh__ref { font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .dh__pos { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); margin-right: var(--space-1); }
    /* Groups are separated by space, not dividers */
    .db { flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-8); }
    .ds { display: flex; flex-direction: column; gap: var(--space-3); }
    .ds__h { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); font-weight: var(--font-weight-semi); color: var(--color-text-primary); }
    .ds__sub { margin-left: var(--space-1); font-weight: var(--text-body3-weight); color: var(--color-text-secondary); font-size: var(--text-body3-size); }
    .ds__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
    .ds__p { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-secondary); }
    .ds--quiet .ds__h { font-size: var(--text-body3-size); color: var(--color-text-secondary); }
    .ds--req { gap: var(--space-4); }
    .req { margin: 0; font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .meta { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-6); font-size: var(--text-body3-size); }
    .meta li { display: flex; flex-direction: column; gap: 2px; }
    .meta__k { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .doc { display: flex; align-items: flex-start; gap: var(--space-3); }
    .doc > fvdr-file-icon { flex: none; display: flex; align-items: center; height: var(--text-body3-lh); }
    .doc > fvdr-btn { flex: none; }
    .doc__b { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .doc__name { all: unset; cursor: pointer; font-weight: var(--font-weight-semi); overflow-wrap: anywhere; }
    .doc__name:hover { color: var(--color-primary-600); text-decoration: underline; }
    .doc__name:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .doc__path { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .doc--muted .doc__name { font-weight: var(--text-body3-weight); }
    .quote { margin: 0; padding-left: var(--space-4); border-left: 2px solid var(--color-primary-300); display: flex; flex-direction: column; gap: var(--space-1); }
    .quote blockquote { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); font-style: italic; }
    .quote figcaption { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .issues { list-style: none; margin: 0; padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);
      background: var(--color-warning-bg); border-radius: var(--radius-md); font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .issues li { display: flex; gap: var(--space-2); }
    .issues fvdr-icon { color: var(--color-warning-icon); flex: none; margin-top: 2px; }
    .issues b { font-weight: var(--font-weight-semi); }
    .strength { display: inline-flex; align-items: center; gap: 2px; font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); white-space: nowrap; }
    .strength i { width: 4px; height: var(--space-3); border-radius: 1px; background: var(--color-stone-400); }
    .strength i:last-of-type { margin-right: var(--space-1); }
    .strength--strong i { background: var(--color-primary-500); }
    .strength--medium i:nth-of-type(-n+2) { background: var(--color-warning-icon); }
    .kv { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: var(--space-3) var(--space-4); margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .kv dt { color: var(--color-text-secondary); }
    .kv dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
    .kv__empty { color: var(--color-text-placeholder); }
    /* Stacked pairs — label above value, for long values and controls */
    .kvs { margin: 0; display: flex; flex-direction: column; gap: var(--space-3); font-size: var(--text-body3-size); line-height: var(--text-body3-lh); }
    .kvs > div { display: flex; flex-direction: column; gap: var(--space-1); }
    .kvs dt { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); font-weight: var(--font-weight-semi); color: var(--color-text-primary); }
    .kvs dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
    .hist summary { cursor: pointer; list-style: none; }
    .hist summary::-webkit-details-marker { display: none; }
    .hist ol { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); font-size: var(--text-body3-size); }
    .hist li { display: flex; flex-direction: column; gap: 2px; }
    .hist__who { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }
    .df { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-divider); }
    .df__done { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-primary-600); font-size: var(--text-body3-size); }
  `],
})
export class ChecklistInlineComponent implements OnDestroy {
  private toastSvc = inject(ToastService);
  @ViewChild('content') private contentEl?: ElementRef<HTMLElement>;

  sc: Scenario = LIGHTHOUSE;
  sidebarCollapsed = true;
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
    { id: 'trash', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];
  crumbs: BreadcrumbItem[] = [{ id: 'dd', label: 'Due diligence checklist' }];
  headerActions: HeaderAction[] = [{ id: 'help', icon: 'help', label: 'Help' }];
  sideItems: SegmentItem[] = [{ id: 'sell', label: 'Sell-side' }, { id: 'buy', label: 'Buy-side' }];
  clsOptions: DropdownOption[] = [
    { value: 'document_request', label: 'Document request' }, { value: 'question', label: 'Question' },
    { value: 'instruction', label: 'Instruction' }, { value: 'note', label: 'Note' },
  ];
  colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  colIdx = [0, 1, 2, 3, 4, 5, 6, 7];

  screen: Screen = 'source';
  roomAiOn = true;
  isBidder = true;
  phase: Phase = 'none';
  upPct = 0; readRow = 0; progress = 0;
  st: Record<string, Rec> = {};
  filter: Filter = 'all';
  drawer: DrawerMode = 'none';
  selected: string | null = null;
  scope = 'all';
  exportOpen = false;
  composeOpen = false; composeText = '';
  delta = false; returning = false;
  headerRow = 5;

  // view model
  sourceRows: SrcRow[] = [];
  gridCols = '';
  tabs: TabItem[] = [];
  scopeOptions: DropdownOption[] = [];
  headerRowOptions: DropdownOption[] = [];
  filters: { id: Filter; label: string; count: number }[] = [];
  filterItems: SegmentItem[] = [];
  reviewIds: string[] = [];
  pct = 0; docCount = 0; otherCount = 0;
  complete = false; partialCount = 0; private doneShown = false;
  get doneText() {
    const n = this.partialCount;
    if (!n) return this.isBidder ? 'Nothing to ask the seller.' : 'The checklist is ready to send back.';
    const part = `${n} ${n === 1 ? 'is' : 'are'} partial`;
    return this.isBidder ? `${part}, so ask the seller for what's missing.` : `${part}, and the file notes what's missing.`;
  }
  d: any = null;
  deltaText = '';

  private timer: any;

  get hasFile() { return this.phase !== 'empty' && this.phase !== 'uploading'; }
  get busyPct(): number {
    return Math.round(this.phase === 'reading' ? 100 * this.readRow / this.sc.sheets[0].rows : 100 * this.progress);
  }
  get showAiCol() { return ['structure', 'matching', 'results'].includes(this.phase); }
  get hasResultCols() { return !!this.sc.details?.resultCols; }
  get totalDocsLabel() { return this.sc.totalDocs.toLocaleString('en-US'); }
  get docsRead() { return Math.round(this.progress * this.sc.totalDocs).toLocaleString('en-US'); }
  get eta() { const m = Math.ceil((1 - this.progress) * 3); return m <= 0 ? 'finishing' : `about ${m} min left`; }
  get selRow() { return this.selected ? this.sourceRows.find(r => r.reqId === this.selected) : undefined; }
  get protoGroups(): ProtoGroup[] {
    return [
      { id: 'scenario', label: 'Checklist', value: this.sc.id, options: [{ id: 'lighthouse', label: 'Lighthouse IRL' }, { id: 'diamond', label: 'Diamond master' }] },
      { id: 'screen', label: 'Screen', value: this.screen, options: [
        { id: 'upload', label: 'Upload' }, { id: 'source', label: 'File' }, { id: 'structure', label: 'Requests marked' },
        { id: 'matching', label: 'Matching' }, { id: 'results', label: 'Results' }, { id: 'complete', label: 'All covered' }, { id: 'returning', label: 'Returning user' },
      ] },
      { id: 'ai', label: 'Room AI', value: this.roomAiOn ? 'on' : 'off', options: [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }] },
    ];
  }

  constructor() { this.go('source'); }
  ngOnDestroy() { clearInterval(this.timer); }

  // ── helpers ──
  asString(v: string | string[]) { return Array.isArray(v) ? v[0] : v; }
  byN = (_: number, r: SrcRow) => r.n;
  isDoc(r: Req) { return r.cls === 'document_request'; }
  doc(n: string): DocInfo { return this.sc.docs[n] || { path: '', summary: '' }; }
  fileType(n: string): FvdrFileType { const d = this.doc(n); if (d.folder) return 'folder'; if (/\.(xlsx|csv)$/i.test(n)) return 'xls'; if (/\.docx?$/i.test(n)) return 'doc'; return 'pdf'; }
  isSpan(r: SrcRow) { return ['section', 'title', 'meta', 'legend', 'blank'].includes(r.kind); }
  private reqs(): Req[] {
    if (!this.returning) return this.sc.reqs;
    const P = this.sc.returning.cands;
    return this.sc.reqs.map(r => P[r.id] ? { ...r, cand: P[r.id] } : r);
  }
  req(id: string | null) { return id ? this.reqs().find(r => r.id === id) : undefined; }
  toast(message: string) { this.toastSvc.show({ variant: 'info', message, duration: 3000 }); }
  private toastUndo(message: string, prev: Record<string, Rec>, focus?: string) {
    this.toastSvc.show({ variant: 'success', message, duration: 6000, actions: [{ label: 'Undo', onClick: () => { this.st = prev; if (focus) this.openRow(focus); this.recompute(); } }] });
  }
  /** The decision that closes the last open request ends the review: drawer closes, success toast offers Export. */
  private settle(): boolean {
    if (!this.complete || this.doneShown) return false;
    this.doneShown = true; this.closeDrawer();
    this.toastSvc.show({ variant: 'success', title: 'Every request has a document', message: this.doneText, duration: 8000, actions: [{ label: 'Export', onClick: () => { this.exportOpen = true; } }] });
    return true;
  }
  /** The checklist once every gap is closed: each request linked to a document in the room. */
  private allCovered(): Record<string, Rec> {
    const m: Record<string, Rec> = {};
    this.reqs().forEach(r => {
      if (!this.isDoc(r)) { m[r.id] = { s: r.cls as MatchState }; return; }
      const name = r.docs?.[0] || r.cand?.name || r.near?.name || r.text.split(/[,(]/)[0].split(' ').slice(0, 4).join(' ') + '.pdf';
      m[r.id] = { s: 'covered', docs: r.docs || [name] };
    });
    return m;
  }
  private hist(rec: Rec, what: string): Rec { return { ...rec, history: [...(rec.history || []), { what, who: 'You (Vlad O.)', at: 'just now' }] }; }

  pillFor(id: string) {
    const r = this.req(id); if (!r) return null;
    const s = (this.st[id] || { s: 'pending' }).s;
    if (this.phase === 'structure') return r.cls === 'question' ? PILL['question'] : (this.isDoc(r) ? PILL['pending'] : null);
    if (!this.isDoc(r)) return r.cls === 'question' ? PILL['question'] : null;
    return PILL[s] || null;
  }
  changeOf(id: string) { return this.st[id]?.change?.kind || null; }
  changeReason(id: string) { return this.st[id]?.change?.reason || ''; }

  isDim(r: SrcRow) {
    if (this.phase !== 'results' || this.filter === 'all') return false;
    if (!r.reqId) return r.kind !== 'header';
    const s = this.st[r.reqId]?.s;
    if (this.filter === 'covered') return !(s === 'covered' || s === 'partial');
    return s !== this.filter;
  }

  /** What the file's result columns hold for a request row right now. */
  private fileCells(r: Req): { vals: [string, string, string]; kind: 'filled' | 'suggested' | 'gap' | 'none' } {
    const rec = this.st[r.id]; const map = this.sc.statusMap;
    if (!rec || this.phase !== 'results' || !map) return { vals: ['', '', ''], kind: 'none' };
    const s = rec.s;
    if (s === 'covered') return { vals: [map.covered, (rec.docs || r.docs || []).join('\n'), ''], kind: 'filled' };
    if (s === 'partial') return { vals: [map.partial, (rec.docs || []).join('\n'), 'Missing: ' + (rec.missing || r.cand?.missing || '')], kind: 'filled' };
    if (s === 'review') return { vals: ['', 'Suggested: ' + (this.doc(r.cand!.name).label || r.cand!.name), ''], kind: 'suggested' };
    if (s === 'gap') return { vals: [map.gap, '', rec.requested ? (this.isBidder ? 'Asked in Q&A' : 'Requested from seller') : (rec.reopened ? 'Linked file deleted' : (r.note || 'Nothing found'))], kind: 'gap' };
    if (s === 'na') return { vals: [map.na, '', ''], kind: 'filled' };
    return { vals: ['', '', ''], kind: 'none' };
  }
  cellText(row: SrcRow, i: number) {
    const rc = this.sc.source.resultCols;
    if (row.kind === 'item' && row.reqId && rc.includes(i)) { const r = this.req(row.reqId); if (r) { const v = this.fileCells(r).vals[rc.indexOf(i)]; if (v) return v; } }
    return row.cells[i] || '';
  }
  cellClass(row: SrcRow, i: number) {
    const rc = this.sc.source.resultCols;
    const cls: Record<string, boolean> = { 'sc--sel': row.kind === 'item' && this.sc.source.selectCols.includes(i) };
    if (row.kind === 'item' && rc.includes(i)) {
      const r = row.reqId ? this.req(row.reqId) : undefined; const fc = r ? this.fileCells(r) : null; const v = fc?.vals[rc.indexOf(i)];
      cls['sc--yellow'] = !v; cls['sc--filled'] = !!v && fc!.kind === 'filled'; cls['sc--suggested'] = !!v && fc!.kind === 'suggested'; cls['sc--gapval'] = !!v && fc!.kind === 'gap';
    }
    return cls;
  }

  // ── screens ──
  onProto(e: { group: string; value: string }) {
    if (e.group === 'scenario') { this.sc = SCENARIOS[e.value]; this.isBidder = this.sc.side === 'buy'; }
    if (e.group === 'ai') this.roomAiOn = e.value === 'on';
    this.go(e.group === 'screen' ? e.value as Screen : this.screen);
  }
  go(screen: Screen) {
    clearInterval(this.timer);
    this.screen = screen; this.contentEl?.nativeElement.scrollTo({ top: 0 });
    Object.assign(this, { drawer: 'none', selected: null, filter: 'all', exportOpen: false, composeOpen: false, delta: false, returning: false, progress: 0, readRow: 0, upPct: 0 });
    this.headerRow = this.sc.details?.headerRow || 1;
    this.isBidder = this.sc.side === 'buy';
    const base = (fn: (r: Req) => MatchState) => { const m: Record<string, Rec> = {}; this.reqs().forEach(r => m[r.id] = { s: this.isDoc(r) ? fn(r) : r.cls }); return m; };
    if (screen === 'upload') { this.phase = 'empty'; this.st = base(() => 'pending'); }
    else if (screen === 'source') { this.phase = 'none'; this.st = base(() => 'pending'); }
    else if (screen === 'structure') { this.phase = 'structure'; this.st = base(() => 'pending'); }
    else if (screen === 'matching') { this.phase = 'matching'; this.st = base(() => 'searching'); this.runMatching(); }
    else if (screen === 'results') { this.phase = 'results'; this.st = base(r => r.final || 'gap'); }
    else if (screen === 'complete') { this.phase = 'results'; this.st = this.allCovered(); }
    else if (screen === 'returning') { this.returning = true; this.phase = 'results'; this.st = base(r => r.final || 'gap'); this.sc.returning.apply(this.st); this.delta = true; }
    this.recompute(); this.doneShown = this.complete;
  }
  upload() {
    this.phase = 'uploading'; this.upPct = 0;
    this.timer = setInterval(() => { this.upPct = Math.min(100, this.upPct + 10); if (this.upPct >= 100) { clearInterval(this.timer); this.phase = 'none'; this.recompute(); this.toast('Checklist uploaded'); } }, 70);
  }
  read() {
    this.phase = 'reading'; this.readRow = 0; this.recompute();
    const total = this.sc.sheets[0].rows;
    this.timer = setInterval(() => { this.readRow = Math.min(total, this.readRow + 2); if (this.readRow >= total) { clearInterval(this.timer); this.phase = 'structure'; this.recompute(); } }, 60);
  }
  startMatching() {
    this.phase = 'matching'; this.progress = 0; this.closeDrawer();
    this.reqs().forEach(r => { if (this.isDoc(r)) this.st[r.id] = { s: 'searching' }; });
    this.recompute(); this.runMatching();
  }
  private runMatching() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const p = Math.min(1, this.progress + 0.02); const st = { ...this.st };
      this.reqs().forEach(r => { if (this.isDoc(r) && st[r.id]?.s === 'searching' && r.foundAt && r.foundAt <= p) st[r.id] = { s: 'found' }; });
      if (p >= 1) { clearInterval(this.timer); this.reqs().forEach(r => { if (this.isDoc(r)) st[r.id] = { s: r.final || 'gap' }; }); this.phase = 'results'; this.screen = 'results'; this.toast('Matching done. Results are in the file.'); }
      this.progress = p; this.st = st; this.recompute();
    }, 100);
  }
  stopMatching() { clearInterval(this.timer); this.go('structure'); this.toast('Matching stopped. Nothing was saved.'); }
  changeHeaderRow(v: string) { this.headerRow = +v; this.toast(`Read again from row ${v}.`); }
  setFilter(f: Filter) { this.filter = f; this.recompute(); }
  doExport(k: 'file' | 'gap') { this.exportOpen = false; this.toast(k === 'gap' ? 'Gap report downloaded' : `${this.sc.tabLabel} with results downloaded. The file in the room is unchanged.`); }
  openDoc(n: string) { this.toast(`Opening ${n} in the document viewer, in a new tab`); }

  // ── drawer ──
  openRead() { this.drawer = 'read'; this.selected = null; this.recompute(); }
  closeDrawer() { this.drawer = 'none'; this.selected = null; this.composeOpen = false; this.recompute(); }
  openRow(id: string) {
    this.selected = id; this.drawer = 'row'; this.composeOpen = false; this.exportOpen = false; this.recompute();
    setTimeout(() => document.getElementById('row-' + this.req(id)?.row)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  private navIds(): string[] {
    const all = this.reqs().filter(r => this.isDoc(r));
    if (this.phase === 'results' && this.filter !== 'all') return all.filter(r => !this.isDim({ n: r.row, kind: 'item', cells: [], reqId: r.id })).map(r => r.id);
    return all.map(r => r.id);
  }
  step(dir: 1 | -1) {
    const ids = this.navIds(); if (!ids.length) return;
    const i = this.selected ? ids.indexOf(this.selected) : -1;
    this.openRow(ids[(i + dir + ids.length) % ids.length]);
  }
  reviewNext() {
    const ids = this.reviewIds; if (!ids.length) return;
    const order = this.reqs().map(r => r.id); const cur = this.selected ? order.indexOf(this.selected) : -1;
    const next = ids.find(id => order.indexOf(id) > cur) || ids[0];
    this.openRow(next);
  }
  private afterDecision(id: string, prev: Record<string, Rec>, msg: string) {
    this.recompute();
    this.toastUndo(msg, prev, id);
    if (this.settle()) return;
    if (this.reviewIds.length) this.reviewNext(); else { this.closeDrawer(); this.toast('All suggestions reviewed'); }
  }
  accept() {
    const id = this.selected!; const r = this.req(id)!; const prev = this.st; const partial = r.cand!.verdict === 'Partial';
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: partial ? 'partial' : 'covered', docs: [r.cand!.name], missing: r.cand!.missing }, partial ? 'Accepted as partial' : 'Accepted') };
    this.afterDecision(id, prev, `${id} ${partial ? 'accepted as partial' : 'accepted'}. Written to the file.`);
  }
  reject() {
    const id = this.selected!; const prev = this.st;
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: 'gap', rejected: true }, 'Rejected the suggestion') };
    this.afterDecision(id, prev, `${id} rejected. It's now a gap.`);
  }
  unlink(n: string) {
    const id = this.selected!; const prev = this.st; const cur = this.st[id]; const r = this.req(id)!;
    const left = (cur.docs || r.docs || []).filter(x => x !== n);
    this.st = { ...this.st, [id]: this.hist(left.length ? { ...cur, docs: left } : { ...cur, s: 'gap', rejected: true, docs: undefined }, 'Unlinked ' + n) };
    this.recompute(); this.toastUndo('Unlinked ' + n, prev, id);
  }
  linkNear() {
    const id = this.selected!; const r = this.req(id)!; const prev = this.st;
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: 'partial', docs: [r.near!.name], missing: 'Check the document, it was below the threshold' }, 'Linked ' + r.near!.name) };
    this.recompute(); this.toastUndo('Linked as partial', prev, id); this.settle();
  }
  markNa() { const id = this.selected!; const prev = this.st; this.st = { ...this.st, [id]: this.hist({ ...this.st[id], s: 'na' }, 'Marked not applicable') }; this.recompute(); this.toastUndo(id + ' marked not applicable', prev, id); this.settle(); }
  openCompose() {
    const r = this.req(this.selected)!; const rec = this.st[r.id];
    const asAt = r.asAt && r.asAt !== 'Current' ? `, as at ${r.asAt}` : '';
    this.composeText = rec.s === 'partial'
      ? `Ref ${r.label || r.id}: ${r.text}\nWe have ${(rec.docs || []).join(', ')}, but it doesn't include: ${rec.missing}. Please upload the missing part${asAt}.`
      : `Ref ${r.label || r.id}: ${r.text}\nWe couldn't find this in the data room.${r.near ? ` The closest document is ${r.near.name}, which doesn't cover it.` : ''} Please upload it${asAt}, or confirm it doesn't exist.`;
    this.composeOpen = true;
  }
  sendCompose() {
    const id = this.selected!; const prev = this.st;
    this.st = { ...this.st, [id]: this.hist({ ...this.st[id], requested: true }, this.isBidder ? 'Asked the seller in Q&A' : 'Requested from the seller team') };
    this.composeOpen = false; this.recompute();
    this.toastUndo(this.isBidder ? `Question for ${id} posted to Q&A` : `Request for ${id} sent to the seller team`, prev, id);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.drawer === 'none') return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') this.closeDrawer();
    else if (k === 'j') this.step(1);
    else if (k === 'k') this.step(-1);
    else if (this.d?.isReview && k === 'a') this.accept();
    else if (this.d?.isReview && k === 'r') this.reject();
  }

  // ── view model ──
  recompute() {
    const sc = this.sc; const reqs = this.reqs(); const st = this.st;
    this.tabs = [{ id: sc.id, label: sc.tabLabel }];
    this.scopeOptions = [{ value: 'all', label: `All documents in ${sc.room} (${this.totalDocsLabel})` }, { value: 'g', label: 'Documents a group can see…' }];
    this.sourceRows = sc.source.build(reqs);
    this.headerRowOptions = Array.from({ length: 8 }, (_, k) => k + 1).map(n => { const r = this.sourceRows.find(x => x.n === n); const t = r ? (r.cells.filter(Boolean).join(' · ') || '(empty)') : '(empty)'; return { value: String(n), label: `Row ${n} — ${t.length > 34 ? t.slice(0, 32) + '…' : t}` }; });
    const w = (x: number | 'fill') => x === 'fill' ? 'minmax(240px, 1fr)' : x + 'px';
    this.gridCols = '40px ' + (this.showAiCol ? '112px ' : '') + sc.source.widths.map(w).join(' ');
    const docs = reqs.filter(r => this.isDoc(r));
    this.docCount = docs.length; this.otherCount = reqs.length - docs.length;
    const c = (fn: (s: string) => boolean) => docs.filter(r => fn((st[r.id] || { s: '' }).s as string)).length;
    const covered = c(s => s === 'covered' || s === 'partial');
    const matchable = docs.filter(r => st[r.id]?.s !== 'na').length;
    this.pct = matchable ? Math.round(100 * covered / matchable) : 0;
    this.filters = [
      { id: 'covered', label: 'covered', count: covered },
      { id: 'review', label: 'to review', count: c(s => s === 'review') },
      { id: 'gap', label: 'gaps', count: c(s => s === 'gap') },
    ];
    this.reviewIds = docs.filter(r => st[r.id]?.s === 'review').map(r => r.id);
    this.partialCount = c(s => s === 'partial');
    this.complete = this.phase === 'results' && matchable > 0 && covered === matchable && !this.reviewIds.length;
    if (!this.complete) this.doneShown = false;
    this.filterItems = [
      { id: 'all', label: 'All', count: docs.length },
      { id: 'covered', label: 'Covered', count: this.filters[0].count },
      { id: 'review', label: 'To review', count: this.filters[1].count },
      { id: 'gap', label: 'Gaps', count: this.filters[2].count },
    ];
    const chg: Record<ChangeKind, number> = { closed: 0, suggested: 0, reopened: 0 };
    reqs.forEach(r => { const k = st[r.id]?.change?.kind; if (k) chg[k]++; });
    this.deltaText = [chg.closed && `${chg.closed} gap closed`, chg.suggested && `${chg.suggested} new suggestion`, chg.reopened && `${chg.reopened} reopened`].filter(Boolean).join(', ');
    this.d = this.drawerVm();
  }

  private drawerVm() {
    const r = this.req(this.selected); if (!r || this.drawer !== 'row') return null;
    const rec = this.st[r.id] || { s: 'pending' } as Rec;
    const s = this.phase === 'structure' ? 'pending' : rec.s;
    const cand = r.cand; const cd = cand ? this.doc(cand.name) : null;
    const ids = this.navIds(); const reviewPos = this.reviewIds.indexOf(r.id);
    const fc = this.fileCells(r);
    const cols = this.sc.details?.resultCols;
    const writes = this.hasResultCols && this.phase === 'results' && ['review', 'covered', 'partial', 'gap', 'na'].includes(s as string)
      ? (s === 'review'
        ? [{ col: cols![0], val: cand!.verdict === 'Partial' ? this.sc.statusMap!.partial : this.sc.statusMap!.covered }, { col: cols![1], val: cd?.label || cand!.name }, { col: cols![2], val: cand!.missing ? 'Missing: ' + cand!.missing : '' }]
        : cols!.map((col, i) => ({ col, val: fc.vals[i] })))
      : null;
    return {
      ref: r.label && r.label !== '—' ? r.label : r.id, row: r.row, text: r.readAs || r.text, priority: r.priority || '', asAt: r.asAt && r.asAt !== 'Current' ? r.asAt : '',
      pill: PILL[s as string] || PILL['pending'],
      pos: reviewPos >= 0 ? `${reviewPos + 1} of ${this.reviewIds.length} to review` : `${ids.indexOf(r.id) + 1} of ${ids.length}`,
      isPending: s === 'pending', isReview: s === 'review', isCovered: s === 'covered' || s === 'partial', isPartial: s === 'partial', isGap: s === 'gap',
      candName: cand?.name || '', candLabel: cd?.label || cand?.name || '', candPath: cd?.path || '', candType: cand ? this.fileType(cand.name) : 'pdf',
      strength: cand?.verdict === 'Likely match' ? 'Strong' : 'Medium', verdict: cand?.verdict || '',
      evidence: cand?.evidence || null, period: cand?.period || null, draft: !!cand?.draft,
      missing: rec.missing || cand?.missing || '',
      docs: (rec.docs || r.docs || []).map(n => ({ name: n, label: this.doc(n).label || n, path: this.doc(n).path, type: this.fileType(n) })),
      gapTitle: rec.reopened ? 'Reopened: the linked file was deleted' : rec.rejected ? 'Suggestion rejected' : 'Nothing found',
      note: rec.reopened ? `${this.sc.returning.reopened.file} was deleted by ${this.sc.returning.reopened.by} on ${this.sc.returning.reopened.on}.` : (r.note || ''),
      nearName: r.near && !rec.rejected ? r.near.name : '', nearType: r.near ? this.fileType(r.near.name) : 'pdf',
      requested: !!rec.requested, writes,
      issues: [
        ...(s === 'review' && cand?.period ? [{ icon: 'calendar', title: 'Wrong period.', text: `The document covers ${cand.period.found}; the request asks for ${cand.period.requested}.` }] : []),
        ...(s === 'review' && cand?.draft ? [{ icon: 'warning', title: 'Draft, not executed.', text: 'At least one document in the suggestion is an unsigned draft.' }] : []),
        ...((s === 'review' || s === 'partial') && (rec.missing || cand?.missing) ? [{ icon: 'info', title: 'Missing:', text: rec.missing || cand!.missing }] : []),
      ],
      history: [
        ...(this.phase === 'results' ? [{ what: cand ? `AI suggested ${cd?.label || cand.name}` : r.docs ? 'AI linked ' + r.docs.length + (r.docs.length === 1 ? ' document' : ' documents') : 'AI found nothing above the threshold', who: 'AI matching', at: this.sc.matchedAt }] : []),
        ...(rec.change ? [{ what: rec.change.reason, who: 'System', at: 'since your last visit' }] : []),
        ...(rec.history || []),
      ],
    };
  }
}
