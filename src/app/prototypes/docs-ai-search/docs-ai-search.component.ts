import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type {
  BreadcrumbItem, HeaderAction, QuickAccessItem, SegmentItem, SidebarNavItem, SmartSearchResult,
} from '../../shared/ds';
import type { FvdrIconName } from '../../shared/ds/icons/icons';
import { TrackerService } from '../../services/tracker.service';
import { VdrAnswerBodyComponent, DocHoverEvent } from './answer-body.component';
import { VdrDocPreviewComponent } from './doc-preview.component';
import { VdrAssistantChatComponent, VdrChatThread, VdrChatTurn } from '../_shared/assistant-chat.component';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import {
  AI_PROMPTS, ANSWER_CONSENT, ANSWER_KEYWORD, CLARIFY, FOLDER_ROWS, KEYWORD_ROWS, MockAnswer, MockDoc,
  RECENTS_SEED, ResultRow, SEARCH_POOL, TREE_ROWS, answerFor, docsOf, isKeywordQuery, needsClarifying,
} from './docs-ai-search.data';

type Solution = 'v1' | 'v2';
/** V1 sub-options — Figma rows 2112 / 3624 / 5136 of section 136:17314. */
type V1Layout = 'rail' | 'full' | 'composer';
/** V2 sub-options — Figma "List view" / "Table view" (454:50979, 454:50982). */
type V2View = 'list' | 'table';
type AiState = 'loading' | 'clarify' | 'answer';

/**
 * Documents — AI search. Two solutions for putting an AI answer on the Documents page:
 *   V1 · AI Overview + document table — the answer sits above the regular result table
 *   V2 · AI Overview includes documents — the answer *is* the result; close it for the plain list
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB), page "↳ Documnets page" (1:5).
 */
@Component({
  selector: 'fvdr-docs-ai-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrAnswerBodyComponent, VdrDocPreviewComponent, VdrAssistantChatComponent, VdrProtoSwitcherComponent],
  template: `
    <div class="page">
      <fvdr-sidebar-nav
        variant="vdr"
        accountName="Nike"
        accountMark="N"
        [items]="navItems"
        [collapsed]="sidebarCollapsed || !!preview"
        (collapsedChange)="sidebarCollapsed = $event"
        (itemClick)="onNav($event)"
      ></fvdr-sidebar-nav>

      <div class="main">
        <div class="work">
          <fvdr-header
            [breadcrumbs]="crumbs"
            [actions]="headerActions"
            [userName]="view === 'chat' ? 'AI' : 'TN'"
            (breadcrumbClick)="onCrumb($event)"
          ></fvdr-header>

          <!-- ═══════════════ Documents ═══════════════ -->
          <div class="docs" *ngIf="view === 'docs'">
            <div class="toolbar">
              <div class="toolbar__group">
                <fvdr-btn *ngIf="mode === 'folder'" label="New" variant="primary" iconName="plus" [iconOnly]="narrow" ariaLabel="New"></fvdr-btn>
                <fvdr-btn label="Download" variant="secondary" iconName="download" [iconOnly]="narrow" ariaLabel="Download"></fvdr-btn>
                <fvdr-btn label="Project index" variant="secondary" iconName="action-list" [iconOnly]="narrow" ariaLabel="Project index"></fvdr-btn>
                <fvdr-btn variant="secondary" iconName="more" [iconOnly]="true" ariaLabel="More actions"></fvdr-btn>
              </div>
              <div class="toolbar__group toolbar__group--end">
                <fvdr-btn label="View as" variant="secondary" iconName="view-as" [iconOnly]="narrow" ariaLabel="View as"></fvdr-btn>
                <fvdr-smart-search
                  class="toolbar__search"
                  [(ngModel)]="query"
                  [recents]="recents"
                  [aiSuggestions]="aiPrompts"
                  [results]="liveMatches"
                  [resultsTotal]="liveMatches.length"
                  (submitted)="runSearch($event)"
                  (showMore)="runSearch($event)"
                  (resultPicked)="openMatch($event)"
                  (cleared)="backToFolder()"
                ></fvdr-smart-search>
              </div>
            </div>

            <div class="content">
              <!-- Quick access: full panel in the folder, icon rail in V1 "rail" results -->
              <aside class="qa" *ngIf="mode === 'folder' && !qaCollapsed">
                <fvdr-quick-access-menu
                  [items]="shortcuts"
                  [(collapsed)]="shortcutsCollapsed"
                  [showCollapseAll]="true"
                  [width]="320"
                  (collapseAllClick)="qaCollapsed = true"
                ></fvdr-quick-access-menu>
                <div class="tree">
                  <div class="tree__row" *ngFor="let n of tree" [class.tree__row--active]="n.active"
                       [style.padding-left.px]="16 + n.level * 16" (click)="backToFolder()">
                    <span class="tree__chev"><fvdr-icon *ngIf="n.hasChildren" name="chevron-right"></fvdr-icon></span>
                    <span *ngIf="n.level === 0" class="tree__badge">RN</span>
                    <fvdr-file-icon *ngIf="n.level > 0" [type]="n.id === 'qa' ? 'folder-qa' : 'folder-colored'"></fvdr-file-icon>
                    <span class="tree__idx" *ngIf="n.index">{{ n.index }}</span>
                    <span class="tree__lbl">{{ n.label }}</span>
                  </div>
                </div>
              </aside>
              <aside class="rail" *ngIf="showRail">
                <button type="button" class="rail__btn rail__btn--head" title="Expand quick access"
                        aria-label="Expand quick access" (click)="qaCollapsed = false; backToFolder()">
                  <fvdr-icon name="chevron-right"></fvdr-icon>
                </button>
                <button type="button" class="rail__btn" *ngFor="let s of shortcuts" [title]="s.label" [attr.aria-label]="s.label">
                  <fvdr-icon [name]="s.icon!"></fvdr-icon>
                </button>
                <span class="tree__badge" title="Room name">RN</span>
              </aside>

              <div class="results">
                <!-- ── AI Overview ── -->
                <fvdr-ai-overview
                  *ngIf="mode === 'results' && !overviewDismissed"
                  [headerMode]="solution === 'v1' ? 'collapse' : 'dismiss'"
                  [(collapsed)]="overviewCollapsed"
                  [loading]="aiState === 'loading'"
                  [showActions]="aiState !== 'loading'"
                  [continueLabel]="showContinueLink ? 'Continue in AI Assistant' : ''"
                  [followUps]="aiState === 'answer' ? answer.followUps : []"
                  [showComposer]="showComposer && aiState === 'answer'"
                  [(composerValue)]="composerValue"
                  (openInAssistant)="openChat()"
                  (dismissed)="overviewDismissed = true"
                  (followUpChosen)="onFollowUp($event)"
                  (promptSubmitted)="openChat($event)"
                >
                  <div *ngIf="aiState === 'clarify'" class="clarify">
                    <p class="clarify__q">{{ clarify.question }}</p>
                    <p class="clarify__hint">{{ clarify.hint }}</p>
                    <fvdr-ai-suggestions [items]="clarify.options" (chosen)="resolveClarify($event)"></fvdr-ai-suggestions>
                  </div>
                  <fvdr-vdr-answer-body
                    *ngIf="aiState === 'answer'"
                    [answer]="answer"
                    [asTable]="solution === 'v2' && v2View === 'table'"
                    (docOpened)="openPreview($event)"
                    (docHover)="onDocHover($event)"
                  ></fvdr-vdr-answer-body>
                </fvdr-ai-overview>

                <!-- ── Table: folder contents, or search results (V1 always, V2 once the overview is closed) ── -->
                <div class="tbl" *ngIf="showTable" role="table" [attr.aria-label]="mode === 'folder' ? 'Folder contents' : 'Search results'">
                  <div class="tr tr--head" role="row" [style.grid-template-columns]="gridCols">
                    <span *ngIf="preview" class="td-chk" role="columnheader">
                      <fvdr-checkbox [checked]="!!selectedId" [indeterminate]="!!selectedId"></fvdr-checkbox>
                    </span>
                    <span role="columnheader">Index</span>
                    <span role="columnheader">Name</span>
                    <span *ngIf="mode === 'results'" role="columnheader">Location</span>
                    <span role="columnheader">Notes</span>
                    <ng-container *ngIf="!preview">
                      <span role="columnheader">Labels</span>
                      <span role="columnheader">Pages</span>
                      <span role="columnheader">Size</span>
                      <span class="td-cols" role="columnheader">
                        <button type="button" class="icon-btn" title="Columns" aria-label="Columns"><fvdr-icon name="table-view"></fvdr-icon></button>
                      </span>
                    </ng-container>
                  </div>

                  <div class="tr" role="row" *ngFor="let r of tableRows"
                       [class.tr--selected]="selectedId === r.id"
                       [style.grid-template-columns]="gridCols"
                       (click)="openPreview(r)">
                    <span *ngIf="preview" class="td-chk" role="cell" (click)="$event.stopPropagation()">
                      <fvdr-checkbox [checked]="selectedId === r.id" (checkedChange)="selectedId = $event ? r.id : null"></fvdr-checkbox>
                    </span>
                    <span class="td-idx" role="cell"><fvdr-file-icon [type]="r.type"></fvdr-file-icon>{{ r.index }}</span>
                    <span class="td-name" role="cell">
                      <span class="td-name__main" (mouseenter)="onRowHover(r, $event)" (mouseleave)="onDocHover(null)">
                        <ng-container *ngFor="let p of mark(r.name)">
                          <mark *ngIf="p.hit; else plainName">{{ p.text }}</mark><ng-template #plainName>{{ p.text }}</ng-template>
                        </ng-container>
                      </span>
                      <span class="td-name__snip" *ngIf="r.snippet">
                        <ng-container *ngFor="let p of mark(r.snippet)">
                          <mark *ngIf="p.hit; else plainSnip">{{ p.text }}</mark><ng-template #plainSnip>{{ p.text }}</ng-template>
                        </ng-container>
                        <span class="badge badge--hits">{{ r.hits }}</span>
                      </span>
                    </span>
                    <span *ngIf="mode === 'results'" class="td-loc" role="cell"><fvdr-icon name="folder"></fvdr-icon><span>{{ r.location }}</span></span>
                    <span role="cell"><span class="badge" *ngIf="r.notes">{{ r.notes }}</span></span>
                    <ng-container *ngIf="!preview">
                      <span role="cell"><span class="badge" *ngIf="r.labels">{{ r.labels }}</span></span>
                      <span role="cell">{{ r.pages ?? '—' }}</span>
                      <span role="cell">{{ r.size ?? '—' }}</span>
                      <span role="cell"></span>
                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════ Full AI Assistant ═══════════════ -->
          <div class="chat" *ngIf="view === 'chat'">
            <fvdr-vdr-assistant-chat
              [turns]="chatMessages"
              [busy]="chatStreaming"
              [answerTemplate]="answerTpl"
              [threads]="chatThreads"
              activeThreadId="current"
              [scopeLabel]="chatScopeDocs ? chatScopeDocs + ' files' : 'All files and folders'"
              (submitted)="askInChat($event)"
              (stop)="stopChat()"
              (newChat)="newChat()"
              (regenerate)="askInChat(lastUserPrompt)"
            ></fvdr-vdr-assistant-chat>

            <ng-template #answerTpl let-m>
              <ng-container *ngIf="chatAnswers[m.id] as a; else plainMsg">
                <fvdr-vdr-answer-body [answer]="a"
                  (docOpened)="openPreview($event)" (docHover)="onDocHover($event)"></fvdr-vdr-answer-body>
                <div class="chat__next" *ngIf="m.done && a.followUps.length && m.id === lastAssistantId">
                  <span class="chat__next-label">What next?</span>
                  <fvdr-ai-suggestions [items]="a.followUps" (chosen)="askInChat($event)"></fvdr-ai-suggestions>
                </div>
              </ng-container>
              <ng-template #plainMsg><p class="chat__plain">{{ m.text }}</p></ng-template>
            </ng-template>
          </div>
        </div>

        <fvdr-vdr-doc-preview
          *ngIf="preview"
          class="preview"
          [doc]="preview.doc"
          [page]="preview.page"
          [keyword]="answer.keyword || ''"
          (closed)="closePreview()"
        ></fvdr-vdr-doc-preview>
      </div>
    </div>

    <!-- File hover card -->
    <fvdr-doc-info-card
      *ngIf="hover"
      class="hovercard"
      [style.left.px]="hover.x"
      [style.top.px]="hover.y"
      [name]="hover.doc.index + ' ' + hover.doc.name"
      [type]="hover.doc.type"
      [fields]="hoverFields"
      (mouseenter)="keepHover()"
      (mouseleave)="onDocHover(null)"
    ></fvdr-doc-info-card>

    <!-- Prototype controls -->
    <fvdr-vdr-proto-switcher [groups]="switcherGroups" (changed)="onOption($event)" (restart)="reset()"></fvdr-vdr-proto-switcher>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }

    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; }
    .work { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .preview { flex: 0 0 44%; max-width: 640px; min-width: 420px; }

    /* ── Documents ── */
    .docs { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-6); }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex: 0 0 auto; }
    .toolbar__group { display: flex; align-items: center; gap: var(--space-4); min-width: 0; }
    .toolbar__group--end { flex: 1; justify-content: flex-end; }
    .toolbar__search { flex: 0 1 380px; min-width: 240px; }

    .content { flex: 1; min-height: 0; display: flex; gap: var(--space-6); }
    .results { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); overflow-y: auto;
      padding-bottom: 56px; /* room for the prototype switcher */ }

    /* Quick access */
    .qa { flex: 0 0 320px; display: flex; flex-direction: column; min-height: 0; }
    .tree { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }
    .tree__row { display: flex; align-items: center; gap: var(--space-2); height: 40px; padding-right: var(--space-4);
      cursor: pointer; border-radius: var(--radius-sm); }
    .tree__row:hover { background: var(--color-hover-bg); }
    .tree__row--active { background: var(--color-primary-50); }
    .tree__chev { flex: 0 0 16px; display: inline-flex; justify-content: center; color: var(--color-text-secondary); }
    .tree__badge { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
      border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0);
      font-size: var(--text-caption1-size, 12px); font-weight: var(--font-weight-semi, 600); }
    .tree__idx { color: var(--color-text-primary); }
    .tree__lbl { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .rail { flex: 0 0 48px; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
    .rail__btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0;
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-base, 14px); }
    .rail__btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .rail__btn--head { width: 48px; height: 48px; margin-bottom: var(--space-2); background: var(--color-stone-200); }

    /* Clarifying question */
    .clarify { display: flex; flex-direction: column; gap: var(--space-2); }
    .clarify__q { margin: 0; font-size: var(--font-size-base, 14px); line-height: 20px; }
    .clarify__hint { margin: 0; font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }

    /* Table */
    .tbl { display: flex; flex-direction: column; min-width: 0; }
    .tr { display: grid; align-items: center; min-height: 40px; column-gap: var(--space-4); padding: 0 var(--space-4);
      border-radius: var(--radius-sm); cursor: pointer; }
    .tr:not(.tr--head):hover { background: var(--color-hover-bg); }
    .tr--head { min-height: 48px; background: var(--color-stone-200); cursor: default; font-weight: var(--font-weight-semi, 600); }
    .tr--selected, .tr--selected:hover { background: var(--color-primary-50); }
    .tr > span { min-width: 0; }
    .td-idx { display: inline-flex; align-items: center; gap: var(--space-4); }
    .td-name { display: flex; flex-direction: column; gap: 2px; padding: var(--space-2) 0; }
    .td-name__main { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-name__snip { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .td-loc { display: inline-flex; align-items: center; gap: var(--space-2); overflow: hidden; }
    .td-loc span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-loc fvdr-icon { flex: 0 0 auto; color: var(--color-text-secondary); }
    .td-cols { display: flex; justify-content: flex-end; }
    mark { background: var(--color-highlight-mark, #FFDA07); color: inherit; padding: 0; }
    .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 var(--space-2);
      box-sizing: border-box; border-radius: var(--radius-full); background: var(--color-stone-300); font-size: var(--font-size-base, 14px); }
    .badge--hits { min-width: 16px; height: 16px; padding: 0 var(--space-1); margin-left: var(--space-1);
      font-size: var(--font-size-3xs, 10px); vertical-align: middle; }

    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Chat ── */
    .chat { flex: 1; min-height: 0; display: flex; flex-direction: column; padding-bottom: 40px; /* clears the prototype switcher */ }
    .chat__plain { margin: 0; }
    .chat__next { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
    .chat__next-label { font-weight: var(--font-weight-semi, 600); }

    /* ── Hover card ── */
    .hovercard { position: fixed; z-index: 400; }

  `],
})
export class DocsAiSearchComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  // ── Prototype options ──
  solution: Solution = 'v1';
  v1Layout: V1Layout = 'rail';
  v2View: V2View = 'list';
  /** Cached — rebuilt only when an option changes, so the switcher's buttons stay put under the pointer. */
  switcherGroups: ProtoGroup[] = [];
  private syncSwitcher(): void {
    this.switcherGroups = [
      { id: 'solution', label: 'Solution', value: this.solution, options: [
        { id: 'v1', label: 'V1 · Overview + table' }, { id: 'v2', label: 'V2 · Overview with docs' } ] },
      this.solution === 'v1'
        ? { id: 'v1Layout', label: 'Layout', value: this.v1Layout, options: [
            { id: 'rail', label: 'Tree rail' }, { id: 'full', label: 'Full width' }, { id: 'composer', label: 'Prompt field' } ] }
        : { id: 'v2View', label: 'Answer', value: this.v2View, options: [
            { id: 'list', label: 'List' }, { id: 'table', label: 'Table' } ] },
    ];
  }

  onOption(e: { group: string; value: string }): void {
    if (e.group === 'solution') this.setSolution(e.value);
    if (e.group === 'v1Layout') this.v1Layout = e.value as V1Layout;
    if (e.group === 'v2View') this.v2View = e.value as V2View;
    this.syncSwitcher();
  }

  // ── Shell ──
  sidebarCollapsed = false;
  view: 'docs' | 'chat' = 'docs';
  readonly headerActions: HeaderAction[] = [
    { id: 'help', icon: 'help', label: 'Help' },
    { id: 'app', icon: 'app-download', label: 'Download application' },
  ];
  navItems: SidebarNavItem[] = [
    { id: 'ai', label: 'AI Assistant', icon: 'ai-assistant', iconActive: 'ai-assistant' },
    { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', active: true },
    { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
    { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
    { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
    { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
    { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    { id: 'recycle-bin', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
  ];

  // ── Documents ──
  mode: 'folder' | 'results' = 'folder';
  qaCollapsed = false;
  shortcutsCollapsed = false;
  readonly shortcuts: QuickAccessItem[] = [
    { id: 'recent', label: 'Recently viewed', icon: 'history' as FvdrIconName },
    { id: 'uploaded', label: 'Newly uploaded', icon: 'upload' as FvdrIconName },
    { id: 'unpublished', label: 'Unpublished', icon: 'cross-circle' as FvdrIconName },
    { id: 'favorites', label: 'Favorites', icon: 'star' as FvdrIconName },
  ];
  readonly tree = TREE_ROWS;

  // ── Search + AI ──
  query = '';
  activeQuery = '';
  recents = [...RECENTS_SEED];
  readonly aiPrompts = AI_PROMPTS;
  readonly clarify = CLARIFY;
  aiState: AiState = 'answer';
  answer: MockAnswer = ANSWER_CONSENT;
  overviewCollapsed = false;
  overviewDismissed = false;
  composerValue = '';
  private aiTimer?: ReturnType<typeof setTimeout>;

  // ── Preview + hover ──
  preview: { doc: MockDoc; page?: number } | null = null;
  selectedId: string | null = null;
  hover: { doc: MockDoc; x: number; y: number } | null = null;
  private hoverTimer?: ReturnType<typeof setTimeout>;

  // ── Chat ──
  chatMessages: VdrChatTurn[] = [];
  readonly chatThreads: VdrChatThread[] = [
    { id: 'qna', title: 'Q&A questions', pinned: true },
    { id: 'current', title: 'Current chat' },
    { id: 'qna-2', title: 'Q&A questions' },
    { id: 'fin', title: 'Key Financial Highlights' },
  ];
  chatAnswers: Record<string, MockAnswer> = {};
  chatStreaming = false;
  chatTitle = '';
  chatScopeDocs = 0;
  private chatTimers: ReturnType<typeof setTimeout>[] = [];
  private seq = 0;

  ngOnInit(): void { this.tracker.trackPageView('docs-ai-search'); this.syncSwitcher(); }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    clearTimeout(this.aiTimer);
    clearTimeout(this.hoverTimer);
    this.chatTimers.forEach(clearTimeout);
  }

  // ── Derived ──
  /** Follow-up chips belong to the newest answer only. */
  get lastAssistantId(): string | undefined {
    for (let i = this.chatMessages.length - 1; i >= 0; i--) if (this.chatMessages[i].role === 'assistant') return this.chatMessages[i].id;
    return undefined;
  }

  get narrow(): boolean { return !!this.preview; }

  /** Cached by content — a fresh array per change-detection pass would re-create the crumbs under the pointer. */
  get crumbs(): BreadcrumbItem[] {
    const next = this.buildCrumbs();
    const key = next.map(c => c.id + ':' + c.label).join('|');
    if (key !== this.crumbKey) { this.crumbKey = key; this.crumbCache = next; }
    return this.crumbCache;
  }
  private crumbKey = '';
  private crumbCache: BreadcrumbItem[] = [];

  private buildCrumbs(): BreadcrumbItem[] {
    if (this.view === 'chat') return this.chatMessages.length ? [{ id: 'ai', label: 'AI Assistant' }, { id: 'thread', label: this.chatTitle }] : [{ id: 'ai', label: 'AI Assistant' }];
    const base = [{ id: 'docs', label: 'Documents' }, { id: 'all', label: 'All' }];
    if (this.mode === 'folder') return [...base, { id: 'folder', label: '5 Legal Agreements' }];
    // V2 keeps the answer as the page, so the crumb stays on the folder level until it is closed.
    if (this.solution === 'v2' && !this.overviewDismissed) return base;
    return [...base, { id: 'results', label: `Search results: ${this.resultRows.length}` }];
  }

  get keyword(): string | null { return this.mode === 'results' ? isKeywordQuery(this.activeQuery) : null; }

  get resultRows(): ResultRow[] {
    return this.keyword ? KEYWORD_ROWS : docsOf(ANSWER_CONSENT);
  }

  get tableRows(): ResultRow[] { return this.mode === 'folder' ? FOLDER_ROWS : this.resultRows; }

  get showTable(): boolean {
    if (this.mode === 'folder') return true;
    return this.solution === 'v1' || this.overviewDismissed;
  }

  get showRail(): boolean {
    if (this.mode === 'folder') return this.qaCollapsed;
    return this.solution === 'v1' && this.v1Layout === 'rail';
  }

  get showComposer(): boolean { return this.solution === 'v2' || this.v1Layout === 'composer'; }
  get showContinueLink(): boolean { return this.solution === 'v1' && this.v1Layout !== 'composer'; }

  get gridCols(): string {
    const chk = this.preview ? '24px ' : '';
    const loc = this.mode === 'results' ? ' minmax(140px, 0.9fr)' : '';
    const tail = this.preview ? ' 56px' : ' 56px 56px 72px 96px 32px';
    return `${chk}80px minmax(180px, 1.6fr)${loc}${tail}`;
  }

  get liveMatches(): SmartSearchResult[] {
    const q = this.query.trim().toLowerCase();
    if (!q || isKeywordQuery(q)) return [];
    let hits = SEARCH_POOL.filter(d => d.name.toLowerCase().includes(q));
    if (!hits.length) {
      const words = q.split(/\s+/).filter(w => w.length > 3);
      hits = SEARCH_POOL.filter(d => words.some(w => d.name.toLowerCase().includes(w)));
    }
    return hits.map(d => ({ id: d.id, name: d.name, type: d.type, index: d.index }));
  }

  get hoverFields() {
    const d = this.hover?.doc;
    if (!d) return [];
    if (this.hoverFieldsFor === d) return this.hoverFieldsCache;
    this.hoverFieldsFor = d;
    return this.hoverFieldsCache = [
      { label: 'Added on:', value: d.addedOn ?? '—' },
      { label: 'Size:', value: d.size ?? '—' },
      { label: 'Pages:', value: d.pages != null ? String(d.pages) : '—' },
      { label: 'ID:', value: d.docId ?? '—' },
    ].filter(f => f.value !== '—' || d.type === 'pdf');
  }

  private hoverFieldsFor?: MockDoc;
  private hoverFieldsCache: { label: string; value: string }[] = [];

  mark(text: string): { text: string; hit: boolean }[] {
    const q = this.keyword;
    if (!q) return [{ text, hit: false }];
    return text.split(new RegExp(`(${q})`, 'ig')).filter(Boolean).map(t => ({ text: t, hit: t.toLowerCase() === q.toLowerCase() }));
  }

  // ── Options ──
  setSolution(id: string): void {
    this.solution = id as Solution;
    this.syncSwitcher();
    this.overviewDismissed = false;
    this.overviewCollapsed = false;
  }

  reset(): void {
    clearTimeout(this.aiTimer);
    this.chatTimers.forEach(clearTimeout);
    this.view = 'docs';
    this.backToFolder();
    this.recents = [...RECENTS_SEED];
    this.chatMessages = [];
    this.chatAnswers = {};
    this.chatStreaming = false;
    this.qaCollapsed = false;
    this.sidebarCollapsed = false;
    this.setNav('documents');
  }

  // ── Search flow ──
  runSearch(q: string): void {
    const text = q.trim();
    if (!text) return;
    this.query = text;
    this.activeQuery = text;
    this.recents = [text, ...this.recents.filter(r => r !== text)].slice(0, 3);
    this.mode = 'results';
    this.view = 'docs';
    this.setNav('documents');
    this.overviewCollapsed = false;
    this.overviewDismissed = false;
    this.composerValue = '';
    this.closePreview();
    this.answer = isKeywordQuery(text) ? ANSWER_KEYWORD : ANSWER_CONSENT;
    this.think(needsClarifying(text) ? 'clarify' : 'answer');
  }

  resolveClarify(_option: string): void {
    this.answer = ANSWER_CONSENT;
    this.think('answer');
  }

  private think(next: AiState): void {
    clearTimeout(this.aiTimer);
    this.aiState = 'loading';
    this.aiTimer = setTimeout(() => (this.aiState = next), 1400);
  }

  backToFolder(): void {
    clearTimeout(this.aiTimer);
    this.mode = 'folder';
    this.query = '';
    this.activeQuery = '';
    this.closePreview();
  }

  openMatch(m: SmartSearchResult): void {
    const doc = SEARCH_POOL.find(d => d.id === m.id);
    if (doc && doc.type !== 'folder-colored') this.openPreview(doc);
  }

  /** V1 without a prompt field hands a follow-up straight to the assistant; elsewhere it pre-fills the field. */
  onFollowUp(prompt: string): void {
    if (this.showComposer) this.composerValue = prompt;
    else this.openChat(prompt);
  }

  // ── Preview + hover ──
  openPreview(doc: MockDoc): void {
    if (doc.type.startsWith('folder')) return;
    const cited = this.answer.groups.flatMap(g => g.items).find(i => i.doc.id === doc.id);
    this.preview = { doc, page: cited?.page };
    this.selectedId = doc.id;
    this.hover = null;
  }

  closePreview(): void {
    this.preview = null;
    this.selectedId = null;
  }

  onDocHover(e: DocHoverEvent | null): void {
    clearTimeout(this.hoverTimer);
    if (!e) {
      this.hoverTimer = setTimeout(() => (this.hover = null), 150);
      return;
    }
    const x = Math.min(e.rect.left, window.innerWidth - 336);
    const below = e.rect.bottom + 4;
    const y = below + 290 > window.innerHeight ? Math.max(8, e.rect.top - 290) : below;
    this.hoverTimer = setTimeout(() => (this.hover = { doc: e.doc, x, y }), 250);
  }

  onRowHover(doc: MockDoc, ev: MouseEvent): void {
    if (doc.type.startsWith('folder')) return;
    this.onDocHover({ doc, rect: (ev.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  keepHover(): void { clearTimeout(this.hoverTimer); }

  // ── Full assistant ──
  /** Hands the overview thread to the full assistant, optionally with a follow-up already asked. */
  openChat(prompt?: string): void {
    this.chatTimers.forEach(clearTimeout);
    const title = this.activeQuery.replace(/^find keywords?:\s*/i, '');
    this.chatTitle = title.charAt(0).toUpperCase() + title.slice(1);
    this.chatScopeDocs = docsOf(this.answer).length;
    const u = this.msgId(), a = this.msgId();
    this.chatAnswers = { [a]: this.answer };
    this.chatMessages = [
      { id: u, role: 'user', text: this.activeQuery, at: 'just now' },
      { id: a, role: 'assistant', text: '', done: true, steps: this.steps(true), took: '1min', at: 'just now' },
    ];
    this.composerValue = '';
    this.closePreview();
    this.view = 'chat';
    this.setNav('ai');
    if (prompt) this.askInChat(prompt);
  }

  askInChat(prompt: string): void {
    if (this.chatStreaming) return;
    if (!this.chatMessages.length) this.chatTitle = prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt;
    const u = this.msgId(), a = this.msgId();
    const reply = answerFor(prompt);
    const msg: VdrChatTurn = { id: a, role: 'assistant', text: '', streaming: true, steps: [] };
    this.lastUserPrompt = prompt;
    this.chatMessages = [...this.chatMessages, { id: u, role: 'user', text: prompt, at: 'just now' }, msg];
    this.chatAnswers = { ...this.chatAnswers, [a]: reply };
    this.chatStreaming = true;
    const all = this.steps(true);
    all.forEach((s, i) => this.chatTimers.push(setTimeout(() => {
      msg.steps = all.slice(0, i + 1).map((st, k) => ({ ...st, done: k < i }));
      this.chatMessages = [...this.chatMessages];
    }, 400 + i * 450)));
    this.chatTimers.push(setTimeout(() => {
      msg.steps = all;
      msg.streaming = false;
      msg.done = true;
      msg.took = '2s';
      msg.at = 'just now';
      this.chatStreaming = false;
      this.chatMessages = [...this.chatMessages];
    }, 400 + all.length * 450 + 300));
  }

  lastUserPrompt = '';

  /** Stop: keep what the steps found, drop the unfinished answer. */
  stopChat(): void {
    this.chatTimers.forEach(clearTimeout);
    const last = this.chatMessages[this.chatMessages.length - 1];
    if (last?.streaming) {
      last.streaming = false;
      last.done = true;
      last.text = 'Response stopped.';
      last.steps = (last.steps ?? []).filter(st => st.done);
      delete this.chatAnswers[last.id];
      this.chatMessages = [...this.chatMessages];
    }
    this.chatStreaming = false;
  }

  newChat(): void {
    this.chatTimers.forEach(clearTimeout);
    this.chatMessages = [];
    this.chatAnswers = {};
    this.chatStreaming = false;
    this.chatTitle = 'New chat';
    this.chatScopeDocs = 0;
  }

  private steps(done: boolean) {
    return [
      { id: 's1', kind: 'result' as const, label: 'Searched all files and folders you can open', detail: '1,248 files', done },
      { id: 's2', kind: 'result' as const, label: 'Found 3 agreements in 5 Legal Agreements', done },
      { id: 's3', kind: 'result' as const, label: 'Reading 5.5.1 Merger Agreement – Project Falcon.pdf', done },
      { id: 's4', kind: 'thought' as const, label: 'Checked the answer against your access', done },
    ];
  }

  private msgId(): string { return `m${++this.seq}`; }

  // ── Nav ──
  onNav(item: SidebarNavItem): void {
    if (item.id === 'ai') {
      if (this.view !== 'chat') { this.newChat(); this.view = 'chat'; this.closePreview(); }
      this.setNav('ai');
    } else if (item.id === 'documents') {
      this.view = 'docs';
      this.setNav('documents');
    }
  }

  onCrumb(id: string): void {
    if (id === 'docs' || id === 'all') { this.view = 'docs'; this.backToFolder(); this.setNav('documents'); }
    if (id === 'ai') this.newChat();
  }

  private setNav(id: string): void {
    this.navItems = this.navItems.map(n => ({ ...n, active: n.id === id }));
  }
}
