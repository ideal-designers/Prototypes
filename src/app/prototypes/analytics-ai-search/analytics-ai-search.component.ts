import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DS_COMPONENTS } from '../../shared/ds';
import type { BreadcrumbItem, HeaderAction, SegmentItem, SidebarNavItem, SidebarNavSubItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { AnswerShape, VdrAnalyticsAnswerComponent } from './analytics-answer.component';
import { VdrAnalyticsDashboardComponent } from './analytics-dashboard.component';
import { VdrActivityLogTableComponent } from './activity-log-table.component';
import { VdrAssistantChatComponent, VdrChatThread, VdrChatTurn } from '../_shared/assistant-chat.component';
import { VdrProtoSwitcherComponent, ProtoGroup } from '../_shared/proto-switcher.component';
import { AnalyticsAnswer, AnalyticsPage, PROMPTS, RECENTS, answerFor, logFor } from './analytics-ai-search.data';

type Solution = 'v1' | 'v2';
type V1Layout = 'link' | 'composer';

/**
 * Dashboard & Activity log — AI search. Smart search on analytics pages answers with an
 * AI Overview built from a data block (stat list · ranked bars · people table).
 *   V1 · the overview sits above the page (dashboard stays; the log gets the AI's filters)
 *   V2 · the overview replaces the page content, with a prompt field to keep asking
 * Figma: AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB), pages "↳ Dashboards" (7:2) and "↳ Reports" (7:3).
 */
@Component({
  selector: 'fvdr-analytics-ai-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, VdrAnalyticsAnswerComponent, VdrAnalyticsDashboardComponent, VdrActivityLogTableComponent, VdrAssistantChatComponent, VdrProtoSwitcherComponent],
  template: `
    <div class="page">
      <fvdr-sidebar-nav variant="vdr" accountName="Nike" accountMark="N" [items]="navItems"
        [collapsed]="sidebarCollapsed" (collapsedChange)="sidebarCollapsed = $event"
        (itemClick)="onNav($event)" (subItemClick)="onSubNav($event)"></fvdr-sidebar-nav>

      <div class="main">
        <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" [userName]="view === 'chat' ? 'AI' : 'TN'"
          (breadcrumbClick)="onCrumb($event)"></fvdr-header>

        <!-- ═══════════ Analytics page ═══════════ -->
        <div class="body" *ngIf="view === 'page'">
          <!-- Toolbar -->
          <div class="toolbar" *ngIf="page === 'dashboard'">
            <fvdr-segment variant="table" [items]="dashTabs" [activeId]="dashTab" (activeIdChange)="dashTab = $event"></fvdr-segment>
            <span class="toolbar__spacer"></span>
            <fvdr-btn label="10 groups" variant="secondary" iconName="filter"></fvdr-btn>
            <fvdr-btn label="Export" variant="secondary"></fvdr-btn>
            <ng-container *ngTemplateOutlet="search"></ng-container>
          </div>
          <div class="toolbar" *ngIf="page === 'activity-log'">
            <ng-container *ngTemplateOutlet="search"></ng-container>
            <span class="toolbar__spacer"></span>
            <fvdr-btn label="Export" variant="secondary" iconName="download"></fvdr-btn>
            <fvdr-btn label="Subscribe" variant="secondary" iconName="bell"></fvdr-btn>
          </div>

          <ng-template #search>
            <fvdr-smart-search class="toolbar__search" [(ngModel)]="query" [recents]="recents" [aiSuggestions]="prompts"
              [results]="[]" (submitted)="runSearch($event)" (cleared)="clear()"></fvdr-smart-search>
          </ng-template>

          <!-- AI Overview -->
          <fvdr-ai-overview *ngIf="answer"
            headerMode="collapse"
            [(collapsed)]="overviewCollapsed"
            [loading]="loading"
            [showActions]="!loading"
            [continueLabel]="showContinueLink ? 'Continue in AI Assistant' : ''"
            [followUps]="loading ? [] : answer.followUps"
            [showComposer]="showComposer && !loading"
            [(composerValue)]="composerValue"
            [loadingLabel]="page === 'dashboard' ? 'Reading the room activity…' : 'Reading the activity log…'"
            (openInAssistant)="openChat()"
            (followUpChosen)="onFollowUp($event)"
            (promptSubmitted)="openChat($event)">
            <fvdr-vdr-analytics-answer [answer]="answer" [shape]="shape" (reportRequested)="goTo('activity-log')"></fvdr-vdr-analytics-answer>
          </fvdr-ai-overview>

          <!-- Page content: always without an answer; in V1 also under it -->
          <ng-container *ngIf="!answer || solution === 'v1'">
            <fvdr-vdr-analytics-dashboard *ngIf="page === 'dashboard'"></fvdr-vdr-analytics-dashboard>

            <ng-container *ngIf="page === 'activity-log'">
              <div class="report-on">Report on <button type="button" class="linkish">All actions <fvdr-icon name="chevron-down"></fvdr-icon></button></div>
              <div class="filters">
                <span class="fbox fbox--period" [class.fbox--set]="appliedFilters">
                  <span class="fbox__txt">{{ appliedFilters?.period || 'Period' }}</span>
                  <button *ngIf="appliedFilters" type="button" class="fbox__x" aria-label="Clear period" (click)="clear()"><fvdr-icon name="close"></fvdr-icon></button>
                  <fvdr-icon name="calendar"></fvdr-icon>
                </span>
                <span class="fbox" [class.fbox--set]="appliedFilters">
                  <span class="fbox__txt">{{ appliedFilters?.action || 'Action' }}</span>
                  <button *ngIf="appliedFilters" type="button" class="fbox__x" aria-label="Clear action" (click)="clear()"><fvdr-icon name="close"></fvdr-icon></button>
                  <fvdr-icon name="chevron-down"></fvdr-icon>
                </span>
                <span class="fbox"><span class="fbox__txt">Author</span><fvdr-icon name="chevron-down"></fvdr-icon></span>
                <span class="filters__note" *ngIf="appliedFilters"><fvdr-icon name="sparkle"></fvdr-icon>Filters set by AI from your question</span>
              </div>
              <fvdr-vdr-activity-log-table [days]="logDays" [highlight]="highlightAuthor"></fvdr-vdr-activity-log-table>
            </ng-container>
          </ng-container>
        </div>

        <!-- ═══════════ Full AI Assistant ═══════════ -->
        <div class="chat" *ngIf="view === 'chat'">
          <fvdr-vdr-assistant-chat [turns]="chatMessages" [busy]="chatStreaming" [answerTemplate]="answerTpl"
            [threads]="chatThreads" activeThreadId="current"
            (submitted)="ask($event)" (stop)="stopChat()" (newChat)="newChat()" (regenerate)="ask(lastUserPrompt)"></fvdr-vdr-assistant-chat>

          <ng-template #answerTpl let-m>
            <ng-container *ngIf="chatAnswers[m.id] as a; else plainMsg">
              <fvdr-vdr-analytics-answer [answer]="a" shape="text-block-text" (reportRequested)="goTo('activity-log')"></fvdr-vdr-analytics-answer>
              <div class="chat__next" *ngIf="m.done && m.id === lastAssistantId">
                <span class="chat__next-label">What next?</span>
                <fvdr-ai-suggestions [items]="a.followUps" (chosen)="ask($event)"></fvdr-ai-suggestions>
              </div>
            </ng-container>
            <ng-template #plainMsg><p class="chat__plain">{{ m.text }}</p></ng-template>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Prototype controls -->
    <fvdr-vdr-proto-switcher [groups]="switcherGroups" (changed)="onOption($event)" (restart)="reset()"></fvdr-vdr-proto-switcher>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

    .body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-6);
      padding: var(--space-6) var(--space-6) 64px; /* clears the prototype switcher */ }
    .toolbar { display: flex; align-items: center; gap: var(--space-4); flex: 0 0 auto; }
    .toolbar__spacer { flex: 1; }
    .toolbar__search { flex: 0 1 380px; min-width: 240px; }

    .report-on { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi, 600); margin-bottom: calc(var(--space-4) * -1); }
    .linkish { display: inline-flex; align-items: center; gap: var(--space-1); padding: 0; border: none; background: transparent;
      cursor: pointer; font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-primary-500); }
    .filters { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; margin-bottom: calc(var(--space-2) * -1); }
    .fbox { display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; min-width: 186px; padding: 0 var(--space-3);
      box-sizing: border-box; border: 1px solid var(--color-stone-500); border-radius: var(--radius-sm); color: var(--color-text-placeholder); }
    .fbox--period { min-width: 176px; }
    .fbox--set { color: var(--color-text-primary); border-color: var(--color-primary-500); }
    .fbox__txt { flex: 1; white-space: nowrap; }
    .fbox fvdr-icon { color: var(--color-text-secondary); }
    .fbox__x { display: inline-flex; padding: 0; border: none; background: transparent; cursor: pointer; font-size: var(--text-caption1-size, 12px); }
    .filters__note { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .filters__note fvdr-icon { color: var(--color-primary-500); }

    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-lg, 16px); }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .chat { flex: 1; min-height: 0; display: flex; flex-direction: column; padding-bottom: 40px; /* clears the prototype switcher */ }
    .chat__plain { margin: 0; }
    .chat__next { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
    .chat__next-label { font-weight: var(--font-weight-semi, 600); }

  `],
})
export class AnalyticsAiSearchComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── Prototype options ──
  page: AnalyticsPage = 'dashboard';
  solution: Solution = 'v1';
  v1Layout: V1Layout = 'link';
  shape: AnswerShape = 'text-block-text';
  /** Cached — rebuilt only when an option changes, so the switcher's buttons stay put under the pointer. */
  switcherGroups: ProtoGroup[] = [];
  private syncSwitcher(): void {
    this.switcherGroups = [
      { id: 'page', label: 'Page', value: this.page, options: [{ id: 'dashboard', label: 'Dashboard' }, { id: 'activity-log', label: 'Activity log' }] },
      { id: 'solution', label: 'Solution', value: this.solution, options: [{ id: 'v1', label: 'V1 · Above the page' }, { id: 'v2', label: 'V2 · Instead of the page' }] },
      ...(this.solution === 'v1' ? [{ id: 'v1Layout', value: this.v1Layout, options: [{ id: 'link', label: 'Continue link' }, { id: 'composer', label: 'Prompt field' }] }] : []),
      { id: 'shape', label: 'Answer', value: this.shape, options: [
        { id: 'block', label: 'Block' }, { id: 'text-block', label: 'Text + block' }, { id: 'text-block-text', label: 'Text + block + text' }] },
    ];
  }

  onOption(e: { group: string; value: string }): void {
    if (e.group === 'page') this.goTo(e.value as AnalyticsPage);
    if (e.group === 'solution') this.solution = e.value as Solution;
    if (e.group === 'v1Layout') this.v1Layout = e.value as V1Layout;
    if (e.group === 'shape') this.shape = e.value as AnswerShape;
    this.syncSwitcher();
  }

  // ── Shell ──
  sidebarCollapsed = false;
  view: 'page' | 'chat' = 'page';
  dashTab = 'activity';
  readonly dashTabs: SegmentItem[] = [
    { id: 'activity', label: 'Activity', icon: 'chart-bar' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'qna', label: 'Q&A', icon: 'nav-qa' },
  ];
  readonly headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark', label: 'Theme' },
    { id: 'help', icon: 'help', label: 'Help' },
  ];
  navItems: SidebarNavItem[] = [];

  // ── Search + AI ──
  query = '';
  activeQuery = '';
  recents: string[] = [];
  answer: AnalyticsAnswer | null = null;
  loading = false;
  overviewCollapsed = false;
  composerValue = '';
  private aiTimer?: ReturnType<typeof setTimeout>;

  // ── Chat ──
  chatMessages: VdrChatTurn[] = [];
  lastUserPrompt = '';
  readonly chatThreads: VdrChatThread[] = [
    { id: 'qna', title: 'Q&A questions', pinned: true },
    { id: 'current', title: 'Current chat' },
    { id: 'eng', title: 'Buyer engagement this week' },
    { id: 'fin', title: 'Key Financial Highlights' },
  ];
  chatAnswers: Record<string, AnalyticsAnswer> = {};
  chatStreaming = false;
  chatTitle = '';
  private chatTimers: ReturnType<typeof setTimeout>[] = [];
  private seq = 0;
  private crumbKey = '';
  private crumbCache: BreadcrumbItem[] = [];

  ngOnInit(): void {
    this.page = (this.route.snapshot.data['page'] as AnalyticsPage) ?? 'dashboard';
    this.recents = [...RECENTS[this.page]];
    this.buildNav();
    this.syncSwitcher();
    this.tracker.trackPageView(this.page === 'dashboard' ? 'dashboard-ai-search' : 'reports-ai-search');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    clearTimeout(this.aiTimer);
    this.chatTimers.forEach(clearTimeout);
  }

  // ── Derived ──
  get prompts(): string[] { return PROMPTS[this.page]; }
  get showComposer(): boolean { return this.solution === 'v2' || this.v1Layout === 'composer'; }
  get showContinueLink(): boolean { return this.solution === 'v1' && this.v1Layout === 'link'; }
  /** V1 on the log: the AI also sets the report filters to match the question. */
  get appliedFilters() { return this.page === 'activity-log' && this.solution === 'v1' && this.answer && !this.loading ? this.answer.filters ?? null : null; }
  get logDays() { return logFor(this.appliedFilters ? this.answer : null); }
  get highlightAuthor(): string { return this.appliedFilters?.action === 'File download' ? 'Floyd Miles' : ''; }

  get lastAssistantId(): string | undefined {
    for (let i = this.chatMessages.length - 1; i >= 0; i--) if (this.chatMessages[i].role === 'assistant') return this.chatMessages[i].id;
    return undefined;
  }

  /** Cached by content so the header doesn't rebuild its crumbs under the pointer. */
  get crumbs(): BreadcrumbItem[] {
    const next = this.buildCrumbs();
    const key = next.map(c => c.id + ':' + c.label).join('|');
    if (key !== this.crumbKey) { this.crumbKey = key; this.crumbCache = next; }
    return this.crumbCache;
  }

  private buildCrumbs(): BreadcrumbItem[] {
    if (this.view === 'chat') return this.chatMessages.length ? [{ id: 'ai', label: 'AI Assistant' }, { id: 'thread', label: this.chatTitle }] : [{ id: 'ai', label: 'AI Assistant' }];
    const base = this.page === 'dashboard'
      ? [{ id: 'dashboard', label: 'Dashboard' }]
      : [{ id: 'reports', label: 'Reports' }, { id: 'activity-log', label: 'Activity log' }];
    if (!this.answer) return base;
    const n = this.page === 'activity-log' && this.answer.matches ? this.answer.matches : 1;
    return [...base, { id: 'results', label: `Search results: ${n}` }];
  }

  // ── Flow ──
  runSearch(q: string): void {
    const text = q.trim();
    if (!text) return;
    this.query = text;
    this.activeQuery = text;
    this.recents = [text, ...this.recents.filter(r => r !== text)].slice(0, 3);
    this.answer = answerFor(text);
    this.overviewCollapsed = false;
    this.composerValue = '';
    this.view = 'page';
    clearTimeout(this.aiTimer);
    this.loading = true;
    this.aiTimer = setTimeout(() => (this.loading = false), 1400);
  }

  clear(): void {
    clearTimeout(this.aiTimer);
    this.answer = null;
    this.loading = false;
    this.query = '';
    this.activeQuery = '';
  }

  onFollowUp(prompt: string): void {
    if (this.showComposer) this.composerValue = prompt;
    else this.openChat(prompt);
  }

  goTo(page: AnalyticsPage): void {
    if (page === this.page && this.view === 'page') return;
    this.page = page;
    this.view = 'page';
    this.clear();
    this.recents = [...RECENTS[page]];
    this.buildNav();
    this.syncSwitcher();
    this.router.navigate([page === 'dashboard' ? '/dashboard-ai-search' : '/reports-ai-search'], { replaceUrl: true });
  }

  reset(): void {
    this.chatTimers.forEach(clearTimeout);
    this.chatMessages = [];
    this.chatAnswers = {};
    this.chatStreaming = false;
    this.view = 'page';
    this.clear();
    this.recents = [...RECENTS[this.page]];
    this.buildNav();
  }

  // ── Full assistant ──
  openChat(prompt?: string): void {
    if (!this.answer) return;
    this.chatTimers.forEach(clearTimeout);
    const t = this.activeQuery.replace(/[?.]$/, '');
    this.chatTitle = t.length > 40 ? t.slice(0, 40) + '…' : t;
    const u = this.msgId(), a = this.msgId();
    this.chatAnswers = { [a]: this.answer };
    this.chatMessages = [
      { id: u, role: 'user', text: this.activeQuery, at: 'just now' },
      { id: a, role: 'assistant', text: '', done: true, steps: this.steps(), took: '1min', at: 'just now' },
    ];
    this.chatStreaming = false;
    this.composerValue = '';
    this.view = 'chat';
    this.setNav('ai');
    if (prompt) this.ask(prompt);
  }

  ask(prompt: string): void {
    if (this.chatStreaming) return;
    if (!this.chatMessages.length) this.chatTitle = prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt;
    const u = this.msgId(), a = this.msgId();
    const msg: VdrChatTurn = { id: a, role: 'assistant', text: '', streaming: true, steps: [] };
    this.lastUserPrompt = prompt;
    this.chatMessages = [...this.chatMessages, { id: u, role: 'user', text: prompt, at: 'just now' }, msg];
    this.chatAnswers = { ...this.chatAnswers, [a]: answerFor(prompt) };
    this.chatStreaming = true;
    const all = this.steps();
    all.forEach((_, i) => this.chatTimers.push(setTimeout(() => {
      msg.steps = all.slice(0, i + 1).map((st, k) => ({ ...st, done: k < i }));
      this.chatMessages = [...this.chatMessages];
    }, 400 + i * 450)));
    this.chatTimers.push(setTimeout(() => {
      msg.steps = all; msg.streaming = false; msg.done = true; msg.took = '2s'; msg.at = 'just now';
      this.chatStreaming = false;
      this.chatMessages = [...this.chatMessages];
    }, 400 + all.length * 450 + 300));
  }

  /** Stop: keep the finished steps, drop the unfinished answer. */
  stopChat(): void {
    this.chatTimers.forEach(clearTimeout);
    const last = this.chatMessages[this.chatMessages.length - 1];
    if (last?.streaming) {
      last.streaming = false; last.done = true; last.text = 'Response stopped.';
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
  }

  private steps() {
    return [
      { id: 's1', kind: 'result' as const, label: 'Read the activity log', detail: 'last 7 days · 2,406 events', done: true },
      { id: 's2', kind: 'result' as const, label: 'Grouped events by participant and group', done: true },
      { id: 's3', kind: 'result' as const, label: 'Comparing with last week', done: true },
      { id: 's4', kind: 'thought' as const, label: 'Checked the answer against your access', done: true },
    ];
  }

  private msgId(): string { return `m${++this.seq}`; }

  // ── Nav ──
  onNav(item: SidebarNavItem): void {
    if (item.id === 'dashboard') this.goTo('dashboard');
    else if (item.id === 'ai') { this.newChat(); this.view = 'chat'; this.setNav('ai'); }
  }

  onSubNav(e: { item: SidebarNavItem; subItem: SidebarNavSubItem }): void {
    if (e.subItem.id === 'activity-log') this.goTo('activity-log');
  }

  onCrumb(id: string): void {
    if (id === 'dashboard') { this.view = 'page'; this.goTo('dashboard'); this.clear(); }
    if (id === 'activity-log' || id === 'reports') { this.view = 'page'; this.goTo('activity-log'); this.clear(); }
    if (id === 'ai') this.newChat();
  }

  private buildNav(): void {
    const onLog = this.page === 'activity-log';
    this.navItems = [
      { id: 'ai', label: 'AI Assistant', icon: 'ai-assistant', iconActive: 'ai-assistant' },
      { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active', active: !onLog },
      { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', children: [{ id: 'all', label: 'All' }] },
      { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
      { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
      { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
      {
        id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active', active: onLog, open: onLog,
        children: [
          { id: 'activity-log', label: 'Activity log', active: onLog },
          { id: 'engagement-matrix', label: 'Engagement matrix' },
          { id: 'data-storage', label: 'Data storage' },
          { id: 'permissions-log', label: 'Permission log' },
          { id: 'subscriptions', label: 'Subscription' },
        ],
      },
      { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active', children: [{ id: 'project', label: 'Project' }] },
      { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
      { id: 'recycle-bin', label: 'Recycle bin', icon: 'recycle-bin', iconActive: 'recycle-bin-active' },
    ];
  }

  private setNav(id: string): void {
    this.navItems = this.navItems.map(n => ({ ...n, active: n.id === id }));
  }
}
