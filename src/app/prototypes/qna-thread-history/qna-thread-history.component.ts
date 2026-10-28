import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SegmentItem } from '../../shared/ds';

/**
 * Replica of Figma "Q&A set up" → "Coordinator" (node 8402:345029).
 * The question thread keeps the Figma layout; the centred "Activity" toggle
 * that opens under the question is replaced by one History that also carries
 * the workflow. Four placements are shown, switchable in the control bar.
 */

type Variant = 'drawer' | 'inline' | 'tabs' | 'grouped';
type Role = 'submitter' | 'expert' | 'approver';
type StageState = 'done' | 'current' | 'pending';

interface Stage { id: string; label: string; state: StageState; meta: string; }
interface QEvent { stage: string; time: string; actor: string; text: string; }
interface QMessage { stage: string; kind: 'question' | 'answer' | 'note'; author: string; initials: string; time: string; text: string; }

const STAGES: Stage[] = [
  { id: 'submitted', label: 'Submitted', state: 'done', meta: 'Tasha Song · Jun 22' },
  { id: 'assigned', label: 'Assigned', state: 'done', meta: 'Abner Sheldon → John Doe' },
  { id: 'drafted', label: 'Answer drafted', state: 'done', meta: 'John Doe · Jun 24' },
  { id: 'approval', label: 'Approval', state: 'current', meta: 'Anna Camp · in review' },
  { id: 'answered', label: 'Answered', state: 'pending', meta: 'Visible to the question team' },
];

const EVENTS: QEvent[] = [
  { stage: 'submitted', time: 'Jun 22, 12:40 PM', actor: 'Tasha Song', text: 'submitted the question' },
  { stage: 'assigned', time: 'Jun 22, 2:10 PM', actor: 'Abner Sheldon', text: 'assigned it to John Doe' },
  { stage: 'drafted', time: 'Jun 24, 9:40 AM', actor: 'John Doe', text: 'proposed an answer' },
  { stage: 'approval', time: 'Jun 24, 10:05 AM', actor: 'John Doe', text: 'sent the answer for approval' },
];

const MESSAGES: QMessage[] = [
  {
    stage: 'submitted', kind: 'question', author: 'Tasha Song', initials: 'TS', time: 'Jun 22, 12:40 PM',
    text: 'Hi team, We have 15 active patents, 8 pending patents, and 12 registered trademarks. A detailed list of these assets, along with expiration dates and renewal statuses, has been provided in the IP due diligence folder.',
  },
  {
    stage: 'drafted', kind: 'answer', author: 'John Doe', initials: 'JD', time: 'Jun 24, 9:40 AM',
    text: 'The portfolio is listed in the IP folder: 15 active patents, 8 pending and 12 registered trademarks, with renewal dates for each.',
  },
  {
    stage: 'approval', kind: 'note', author: 'Anna Camp', initials: 'AC', time: 'Mar 25, 1:10 PM',
    text: 'please take a look',
  },
];

@Component({
  selector: 'app-qna-thread-history',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="page">
      <div class="controls">
        <div class="controls__row">
          <span class="controls__title">Q&amp;A thread · Figma 8402:345029</span>
          <fvdr-segment [items]="roleItems" [activeId]="role()" (activeIdChange)="role.set($any($event))"></fvdr-segment>
        </div>
        <div class="vtabs" role="tablist">
          @for (v of variants; track v.id) {
            <button class="vtab" role="tab" [attr.aria-selected]="variant() === v.id"
                    [class.vtab--on]="variant() === v.id" (click)="setVariant(v.id)">{{ v.title }}</button>
          }
        </div>
        <p class="hint"><b>{{ current().title }}.</b> {{ current().description }}</p>
        <p class="pc"><b class="pc__plus">+</b> {{ current().pros }} <b class="pc__minus">−</b> {{ current().cons }}</p>
      </div>

      <div class="app">
        <header class="app__bar">
          <span class="crumb">Q&amp;A <fvdr-icon name="chevron-right"></fvdr-icon> <b>All</b></span>
          <span class="spacer"></span>
          <span class="avatar-me">TN</span>
        </header>

        <div class="app__body">
          <div class="toolbar">
            <fvdr-btn variant="primary" size="m" label="New question"></fvdr-btn>
            <fvdr-btn variant="danger" size="m" label="Delete" [disabled]="true"></fvdr-btn>
            <fvdr-btn variant="secondary" size="m" label="Export"></fvdr-btn>
            <fvdr-btn variant="secondary" size="m" label="Import"></fvdr-btn>
            <span class="spacer"></span>
            <div class="search"><fvdr-icon name="search"></fvdr-icon><span>Search</span></div>
          </div>

          <div class="cols">
            <!-- Figma: Quick access + category filter + questions table -->
            <aside class="side">
              <div class="side__title">Quick access</div>
              <div class="qa-item"><span>All</span><span class="count">42</span></div>
              <div class="qa-item qa-item--sub"><span>Action required</span><span class="count">10</span></div>
              <div class="qa-item qa-item--sub"><span>Assigned</span><span class="count">10</span></div>
              <div class="qa-item qa-item--sub qa-item--on"><span>Unanswered</span><span class="count">10</span></div>
              <div class="qa-item qa-item--sub"><span>Answered</span><span class="count">12</span></div>
              <div class="qa-item qa-item--sub"><span>Mentions</span><span class="count">1</span></div>
              <div class="qa-item"><span>FAQ</span><span class="count">22</span></div>
              <div class="side__title side__title--gap">Category</div>
              @for (c of categories; track c.name) {
                <div class="cat-item"><span class="cat-dot" [style.background]="c.color"></span>{{ c.name }}</div>
              }
            </aside>

            <section class="table">
              <div class="tr tr--head"><span>#</span><span>Subject</span><span>Status</span></div>
              @for (r of rows; track r.id) {
                <div class="tr" [class.tr--sel]="r.id === 'B100'">
                  <span class="tr__id">{{ r.id }}</span>
                  <span class="tr__subj">
                    <b>{{ r.subject }}</b>
                    <span class="tr__sub">{{ r.preview }}</span>
                  </span>
                  <span class="tag" [attr.data-tone]="r.tone">{{ r.status }}</span>
                </div>
              }
            </section>

            <!-- Figma: Right panel — question thread -->
            <section class="thread">
              <div class="thread__bar">
                <span class="qid">#FDF904</span>
                <span class="cat-tag"><span class="cat-dot" style="background: var(--color-info-500)"></span>HR</span>
                <span class="tag" data-tone="progress">{{ currentStage().label }}</span>
                <span class="spacer"></span>
                @if (variant() === 'drawer') {
                  <button class="link-btn" (click)="historyOpen.set(true)">
                    <fvdr-icon name="clock"></fvdr-icon> Activity
                  </button>
                }
                <button class="x" aria-label="Close thread"><fvdr-icon name="close"></fvdr-icon></button>
              </div>

              <div class="thread__body">
                <h2 class="qtitle">Intellectual Property (IP) Due Diligence</h2>

                <!-- A · stage bar stays under the title; Activity opens a drawer -->
                @if (variant() === 'drawer') {
                  <ng-container *ngTemplateOutlet="stepBar"></ng-container>
                  <ng-container *ngTemplateOutlet="turnLine"></ng-container>
                }

                <!-- B · one History row in place of the centred Activity toggle -->
                @if (variant() === 'inline') {
                  <div class="hist">
                    <button class="hist__toggle" [attr.aria-expanded]="inlineOpen()" (click)="inlineOpen.set(!inlineOpen())">
                      <fvdr-icon name="clock"></fvdr-icon>
                      <span class="hist__label">History</span>
                      <span class="hist__stage">{{ currentStage().label }} · {{ doneCount() }}/{{ stages.length }}</span>
                      <span class="spacer"></span>
                      <fvdr-icon [name]="inlineOpen() ? 'chevron-up' : 'chevron-down'"></fvdr-icon>
                    </button>
                    @if (inlineOpen()) {
                      <div class="hist__body"><ng-container *ngTemplateOutlet="timeline"></ng-container></div>
                    }
                  </div>
                  <ng-container *ngTemplateOutlet="turnLine"></ng-container>
                }

                <!-- C · Thread / History tabs -->
                @if (variant() === 'tabs') {
                  <div class="tabs">
                    <button class="tab" [class.tab--on]="tab() === 'thread'" (click)="tab.set('thread')">Thread</button>
                    <button class="tab" [class.tab--on]="tab() === 'history'" (click)="tab.set('history')">
                      History <span class="tab__count">{{ doneCount() }}/{{ stages.length }}</span>
                    </button>
                  </div>
                  <ng-container *ngTemplateOutlet="turnLine"></ng-container>
                }

                @if (variant() === 'tabs' && tab() === 'history') {
                  <ng-container *ngTemplateOutlet="stepBar"></ng-container>
                  <ng-container *ngTemplateOutlet="timeline"></ng-container>
                } @else if (variant() === 'grouped') {
                  <!-- D · one stream grouped by stage; the stage bar sticks to the top -->
                  <div class="sticky">
                    <ng-container *ngTemplateOutlet="stepBar"></ng-container>
                    <ng-container *ngTemplateOutlet="turnLine"></ng-container>
                  </div>
                  <div class="grp-tools">
                    <button class="chip" [class.chip--on]="showSystem()" (click)="showSystem.set(!showSystem())">
                      <fvdr-icon name="info"></fvdr-icon> System events
                    </button>
                  </div>
                  @for (st of stages; track st.id) {
                    <section class="grp" [attr.data-state]="st.state">
                      <div class="grp__head">
                        <span class="grp__dot"></span>
                        <span class="grp__label">{{ st.label }}</span>
                        @if (st.state === 'current') { <span class="tag" data-tone="progress">Now</span> }
                        @if (st.state === 'pending') { <span class="grp__pending">Pending</span> }
                      </div>
                      @for (m of messagesFor(st.id); track $index) {
                        <ng-container *ngTemplateOutlet="message; context: { $implicit: m }"></ng-container>
                      }
                      @if (showSystem()) {
                        @for (e of eventsFor(st.id); track $index) {
                          <div class="sys"><fvdr-icon name="info"></fvdr-icon> <b>{{ e.actor }}</b> {{ e.text }} · {{ e.time }}</div>
                        }
                      }
                    </section>
                  }
                } @else {
                  <!-- Figma thread content -->
                  <!-- Figma's centred Activity toggle is gone: History above carries it -->
                  @for (m of threadMessages(); track $index) {
                    <ng-container *ngTemplateOutlet="message; context: { $implicit: m }"></ng-container>
                  }
                }

                @if (role() === 'expert') {
                  <div class="editor">
                    <div class="editor__tabs"><span class="editor__tab editor__tab--on">Answer</span><span class="editor__tab">Internal note</span></div>
                    <div class="editor__box">
                      <div class="editor__placeholder">Type your answer</div>
                      <div class="editor__send"><fvdr-icon name="upload"></fvdr-icon></div>
                    </div>
                    <div class="editor__foot"><span>Answer will be sent for approval</span><span>0/5000</span></div>
                  </div>
                } @else if (role() === 'approver') {
                  <div class="decide">
                    <fvdr-btn variant="secondary" size="s" label="Request changes"></fvdr-btn>
                    <fvdr-btn variant="primary" size="s" label="Approve"></fvdr-btn>
                  </div>
                } @else {
                  <div class="decide">
                    <fvdr-btn variant="secondary" size="s" label="Add follow-up"></fvdr-btn>
                  </div>
                }
              </div>

              <!-- A · history drawer -->
              @if (historyOpen()) {
                <div class="scrim" (click)="historyOpen.set(false)"></div>
                <aside class="drawer" aria-label="History">
                  <div class="drawer__head">
                    <span class="drawer__title">History</span>
                    <span class="spacer"></span>
                    <button class="x" aria-label="Close history" (click)="historyOpen.set(false)"><fvdr-icon name="close"></fvdr-icon></button>
                  </div>
                  <ng-container *ngTemplateOutlet="timeline"></ng-container>
                </aside>
              }
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared fragments -->
    <ng-template #stepBar>
      <div class="steps">
        @for (st of stages; track st.id; let last = $last) {
          <div class="step" [attr.data-state]="st.state">
            <span class="step__dot">@if (st.state === 'done') { <fvdr-icon name="check"></fvdr-icon> }</span>
            <span class="step__label">{{ st.label }}</span>
          </div>
          @if (!last) { <span class="step__bar" [attr.data-state]="st.state"></span> }
        }
      </div>
    </ng-template>

    <ng-template #turnLine>
      <div class="turn" [attr.data-mine]="isMyTurn()">
        <fvdr-icon [name]="isMyTurn() ? 'attention' : 'clock'"></fvdr-icon>
        <span><b>{{ isMyTurn() ? 'Your turn.' : '' }}</b> {{ waiting() }}</span>
      </div>
    </ng-template>

    <ng-template #timeline>
      <ol class="tl">
        @for (st of stages; track st.id) {
          <li class="tl__item" [attr.data-state]="st.state">
            <span class="tl__dot">@if (st.state === 'done') { <fvdr-icon name="check"></fvdr-icon> }</span>
            <div class="tl__body">
              <div class="tl__label">{{ st.label }} @if (st.state === 'current') { <span class="tag" data-tone="progress">Now</span> }</div>
              <div class="tl__meta">{{ st.meta }}</div>
              @for (e of eventsFor(st.id); track $index) {
                <div class="tl__ev"><span class="tl__time">{{ e.time }}</span> <b>{{ e.actor }}</b> {{ e.text }}</div>
              }
            </div>
          </li>
        }
      </ol>
    </ng-template>

    <ng-template #message let-m>
      @if (m.kind === 'question') {
        <div class="bubble bubble--q">
          <div class="bubble__head"><fvdr-avatar [initials]="m.initials" size="sm"></fvdr-avatar><b>{{ m.author }}</b><span class="spacer"></span><span class="muted">{{ m.time }}</span></div>
          <div class="bubble__text">{{ m.text }}</div>
        </div>
      } @else if (m.kind === 'note') {
        <div class="bubble bubble--note">
          <div class="bubble__head"><fvdr-avatar [initials]="m.initials" size="sm"></fvdr-avatar><b>{{ m.author }}</b><span class="spacer"></span><span class="muted">{{ m.time }}</span></div>
          <div class="bubble__text">{{ m.text }}</div>
          <div class="note__foot"><fvdr-icon name="lock-close"></fvdr-icon> Not visible to the question team</div>
        </div>
      } @else {
        <div class="bubble">
          <div class="bubble__head"><fvdr-avatar [initials]="m.initials" size="sm"></fvdr-avatar><b>{{ m.author }}</b><span class="spacer"></span><span class="muted">{{ m.time }}</span></div>
          <div class="bubble__text">{{ m.text }}</div>
        </div>
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .page { min-height: 100vh; padding: var(--space-6); background: var(--color-stone-100); color: var(--color-text-primary); font-family: var(--font-family); font-size: var(--font-size-base); box-sizing: border-box; }
    .spacer { flex: 1; }
    .muted { color: var(--color-text-secondary); font-size: var(--font-size-xs); }

    /* Prototype control bar (outside the app mock) */
    .controls { margin-bottom: var(--space-4); }
    .controls__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-3); }
    .controls__title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semi); }
    .vtabs { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2); }
    .vtab { border: 1px solid var(--color-stone-400); background: var(--color-stone-0); color: var(--color-text-secondary); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); font: inherit; font-size: var(--font-size-sm); cursor: pointer; }
    .vtab--on { border-color: var(--color-primary-500); color: var(--color-primary-700); background: var(--color-primary-50); font-weight: var(--font-weight-semi); }
    .hint { margin: 0 0 var(--space-1); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .pc { margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .pc__plus { color: var(--color-primary-600); }
    .pc__minus { color: var(--color-error-600); margin-left: var(--space-2); }

    /* App mock — follows Figma 8402:345029 */
    .app { width: 100%; max-width: 1440px; min-height: 912px; background: var(--color-stone-0); border: 1px solid var(--color-stone-400); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
    .app__bar { height: 64px; display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); border-bottom: 1px solid var(--color-divider); flex: none; }
    .crumb { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-lg); }
    .crumb b { color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .avatar-me { width: 40px; height: 40px; border-radius: 50%; background: var(--color-stone-200); display: inline-flex; align-items: center; justify-content: center; font-size: var(--font-size-sm); font-weight: var(--font-weight-semi); }
    .app__body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); flex: 1; min-width: 0; }
    .toolbar { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .search { width: 345px; height: 40px; display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); border: 1px solid var(--color-stone-400); border-radius: var(--radius-md); color: var(--color-text-placeholder); box-sizing: border-box; }

    .cols { display: flex; gap: var(--space-4); align-items: stretch; min-height: 780px; }
    .side { width: 208px; flex: none; }
    .side__title { font-size: var(--font-size-md); font-weight: var(--font-weight-semi); padding: var(--space-2) 0 var(--space-3); }
    .side__title--gap { margin-top: var(--space-6); }
    .qa-item { display: flex; justify-content: space-between; align-items: center; height: 40px; padding: 0 var(--space-2); border-radius: var(--radius-md); font-size: var(--font-size-base); }
    .qa-item--sub { padding-left: var(--space-6); }
    .qa-item--on { background: var(--color-primary-50); color: var(--color-primary-700); font-weight: var(--font-weight-semi); }
    .count { font-size: var(--font-size-xs); background: var(--color-stone-200); border-radius: 10px; padding: 0 var(--space-2); }
    .cat-item { display: flex; align-items: center; gap: var(--space-2); height: 36px; font-size: var(--font-size-base); }
    .cat-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; flex: none; }

    .table { width: 500px; flex: none; border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; }
    .tr { display: grid; grid-template-columns: 56px 1fr auto; align-items: center; gap: var(--space-2); min-height: 56px; padding: 0 var(--space-3); border-bottom: 1px solid var(--color-divider); font-size: var(--font-size-sm); }
    .tr--head { min-height: 40px; background: var(--color-stone-100); color: var(--color-text-secondary); font-size: var(--font-size-xs); font-weight: var(--font-weight-semi); }
    .tr--sel { background: var(--color-primary-highlight, #eaf6ed); }
    .tr__id { color: var(--color-text-secondary); }
    .tr__subj { min-width: 0; display: flex; flex-direction: column; }
    .tr__subj b { font-weight: var(--font-weight-semi); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tr__sub { color: var(--color-text-secondary); font-size: var(--font-size-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .tag { display: inline-flex; align-items: center; padding: 2px var(--space-2); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: var(--font-weight-semi); background: var(--color-stone-200); color: var(--color-stone-900); white-space: nowrap; }
    .tag[data-tone='progress'], .tag[data-tone='assigned'] { background: var(--color-warning-50, #fffae0); color: var(--color-stone-900); }
    .tag[data-tone='answered'] { background: #ddffda; color: var(--color-primary-700); }
    .tag[data-tone='rejected'] { background: #ffede1; color: var(--color-stone-900); }

    /* Thread panel — Figma right panel (532px) */
    .thread { position: relative; width: 532px; flex: none; border: 1px solid var(--color-divider); border-radius: var(--radius-md); display: flex; flex-direction: column; overflow: hidden; }
    .thread__bar { height: 48px; display: flex; align-items: center; gap: var(--space-2); padding: 0 var(--space-3); background: var(--color-stone-200); flex: none; }
    .qid { font-weight: var(--font-weight-semi); }
    .cat-tag { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); }
    .x { border: 0; background: transparent; cursor: pointer; color: var(--color-stone-700); padding: var(--space-1); border-radius: var(--radius-sm); display: inline-flex; }
    .link-btn { display: inline-flex; align-items: center; gap: var(--space-1); border: 1px solid var(--color-stone-400); background: var(--color-stone-0); border-radius: var(--radius-md); padding: var(--space-1) var(--space-3); font: inherit; font-size: var(--font-size-sm); cursor: pointer; color: var(--color-text-primary); }
    .thread__body { padding: var(--space-4); overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: var(--space-3); }
    .qtitle { margin: 0; font-size: var(--font-size-xl); font-weight: var(--font-weight-semi); }

    .bubble { background: var(--color-stone-0); border-radius: var(--radius-md); padding: var(--space-3); border: 1px solid var(--color-divider); }
    .bubble--q { background: var(--color-primary-highlight, #eaf6ed); border-color: transparent; }
    .bubble--note { background: var(--color-notice-bg); border-color: var(--color-notice-border); }
    .bubble__head { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
    .bubble__text { font-size: var(--font-size-base); line-height: 20px; }
    .note__foot { display: flex; align-items: center; gap: var(--space-1); margin-top: var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-xs); }

    .editor { border: 1px solid var(--color-stone-400); border-radius: var(--radius-md); margin-top: auto; }
    .editor__tabs { display: flex; gap: 0; }
    .editor__tab { padding: var(--space-2) var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-secondary); border-bottom: 2px solid transparent; }
    .editor__tab--on { color: var(--color-text-primary); font-weight: var(--font-weight-semi); border-bottom-color: var(--color-primary-500); }
    .editor__box { position: relative; min-height: 96px; padding: var(--space-3); }
    .editor__placeholder { color: var(--color-text-placeholder); }
    .editor__send { position: absolute; right: var(--space-3); bottom: var(--space-3); width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--color-primary-500); color: var(--color-stone-0); display: inline-flex; align-items: center; justify-content: center; }
    .editor__foot { display: flex; justify-content: space-between; padding: var(--space-2) var(--space-3); color: var(--color-text-secondary); font-size: var(--font-size-xs); border-top: 1px solid var(--color-divider); }
    .decide { display: flex; justify-content: flex-end; gap: var(--space-2); }

    /* Workflow stepper */
    .steps { display: flex; align-items: flex-start; }
    .step { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); width: 84px; flex: none; text-align: center; }
    .step__dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--color-stone-400); background: var(--color-stone-0); display: inline-flex; align-items: center; justify-content: center; color: var(--color-stone-0); font-size: var(--font-size-xs); box-sizing: border-box; }
    .step[data-state='done'] .step__dot { background: var(--color-primary-500); border-color: var(--color-primary-500); }
    .step[data-state='current'] .step__dot { border-color: var(--color-primary-500); box-shadow: inset 0 0 0 4px var(--color-stone-0), inset 0 0 0 9px var(--color-primary-500); }
    .step__label { font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.3; }
    .step[data-state='current'] .step__label { color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .step__bar { flex: 1; height: 2px; margin-top: 8px; background: var(--color-stone-400); min-width: 10px; }
    .step__bar[data-state='done'] { background: var(--color-primary-500); }
    .turn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--color-stone-200); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .turn[data-mine='true'] { background: var(--color-primary-50); color: var(--color-primary-700); }

    /* A · drawer */
    .scrim { position: absolute; inset: 0; background: rgba(31, 33, 41, 0.12); z-index: 5; }
    .drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 300px; background: var(--color-stone-0); border-left: 1px solid var(--color-stone-400); padding: var(--space-4); overflow-y: auto; z-index: 6; box-sizing: border-box; }
    .drawer__head { display: flex; align-items: center; margin-bottom: var(--space-4); }
    .drawer__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semi); }

    /* B · inline row */
    .hist { border: 1px solid var(--color-stone-400); border-radius: var(--radius-md); }
    .hist__toggle { width: 100%; display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 0; background: transparent; cursor: pointer; font: inherit; color: var(--color-text-primary); text-align: left; }
    .hist__label { font-weight: var(--font-weight-semi); }
    .hist__stage { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .hist__body { max-height: 240px; overflow-y: auto; padding: var(--space-3); border-top: 1px solid var(--color-divider); }

    /* C · tabs */
    .tabs { display: flex; gap: var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .tab { border: 0; background: transparent; padding: var(--space-2) 0; margin-bottom: -1px; font: inherit; color: var(--color-text-secondary); cursor: pointer; border-bottom: 2px solid transparent; }
    .tab--on { color: var(--color-text-primary); font-weight: var(--font-weight-semi); border-bottom-color: var(--color-primary-500); }
    .tab__count { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-left: var(--space-1); }

    /* D · grouped */
    .sticky { position: sticky; top: 0; background: var(--color-stone-0); z-index: 2; display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-2); }
    .grp-tools { display: flex; justify-content: flex-end; }
    .chip { display: inline-flex; align-items: center; gap: var(--space-1); border: 1px solid var(--color-stone-400); background: var(--color-stone-0); border-radius: 999px; padding: 2px var(--space-3); font: inherit; font-size: var(--font-size-xs); color: var(--color-text-secondary); cursor: pointer; }
    .chip--on { border-color: var(--color-primary-500); color: var(--color-primary-700); background: var(--color-primary-50); }
    .grp { border-left: 2px solid var(--color-stone-400); padding: 0 0 var(--space-3) var(--space-4); margin-left: 8px; display: flex; flex-direction: column; gap: var(--space-2); }
    .grp[data-state='done'], .grp[data-state='current'] { border-left-color: var(--color-primary-500); }
    .grp[data-state='pending'] { opacity: 0.6; }
    .grp__head { display: flex; align-items: center; gap: var(--space-2); margin-left: -23px; }
    .grp__dot { width: 12px; height: 12px; border-radius: 50%; background: var(--color-stone-400); border: 2px solid var(--color-stone-0); box-sizing: content-box; }
    .grp[data-state='done'] .grp__dot, .grp[data-state='current'] .grp__dot { background: var(--color-primary-500); }
    .grp__label { font-weight: var(--font-weight-semi); }
    .grp__pending { font-size: var(--font-size-xs); color: var(--color-text-disabled); }
    .sys { display: flex; align-items: center; gap: var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-sm); }

    /* Timeline (drawer, inline, tabs) */
    .tl { list-style: none; margin: 0; padding: 0; }
    .tl__item { display: flex; gap: var(--space-3); position: relative; padding-bottom: var(--space-4); }
    .tl__item:not(:last-child)::before { content: ''; position: absolute; left: 8px; top: 18px; bottom: 0; width: 2px; background: var(--color-stone-400); }
    .tl__item[data-state='done']::before { background: var(--color-primary-500); }
    .tl__item[data-state='pending'] { opacity: 0.6; }
    .tl__dot { width: 18px; height: 18px; flex: none; border-radius: 50%; border: 2px solid var(--color-stone-400); background: var(--color-stone-0); display: inline-flex; align-items: center; justify-content: center; color: var(--color-stone-0); box-sizing: border-box; font-size: var(--font-size-xs); }
    .tl__item[data-state='done'] .tl__dot { background: var(--color-primary-500); border-color: var(--color-primary-500); }
    .tl__item[data-state='current'] .tl__dot { border-color: var(--color-primary-500); box-shadow: inset 0 0 0 4px var(--color-stone-0), inset 0 0 0 9px var(--color-primary-500); }
    .tl__body { min-width: 0; }
    .tl__label { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); }
    .tl__meta { color: var(--color-text-secondary); font-size: var(--font-size-xs); margin-bottom: var(--space-1); }
    .tl__ev { font-size: var(--font-size-sm); color: var(--color-text-secondary); padding: 2px 0; }
    .tl__time { font-size: var(--font-size-xs); margin-right: var(--space-1); }

    @media (max-width: 1280px) {
      .cols { flex-wrap: wrap; min-height: 0; }
      .thread { width: 100%; }
      .table { width: auto; flex: 1; }
    }
  `],
})
export class QnaThreadHistoryComponent {
  readonly stages = STAGES;

  readonly roleItems: SegmentItem[] = [
    { id: 'submitter', label: 'Submitter' },
    { id: 'expert', label: 'Expert' },
    { id: 'approver', label: 'Approver' },
  ];

  readonly categories = [
    { name: 'Finance', color: 'var(--color-warning-600, #ffda07)' },
    { name: 'Accounting', color: '#bcb6f2' },
    { name: 'HR', color: '#8fd9cb' },
    { name: 'Legal', color: '#a5e29c' },
    { name: 'Tax', color: '#ffc38a' },
  ];

  readonly rows: { id: string; subject: string; preview: string; status: string; tone: string }[] = [
    { id: 'B100', subject: 'M&A questions', preview: 'What specific synergies do you anticipate from c…', status: 'Assigned', tone: 'assigned' },
    { id: 'B101', subject: 'Integration questions', preview: 'How will the integration of our technologies enh…', status: 'Rejected', tone: 'rejected' },
    { id: 'B102', subject: 'How does the company plan to mi… Draft', preview: 'What specific synergies do you anticipate from c…', status: 'Assigned', tone: 'assigned' },
    { id: 'B103', subject: 'How does the company plan to manage t…', preview: 'How will the company ensure the protection of i…', status: 'Answered', tone: 'answered' },
    { id: 'B104', subject: 'Communicating question', preview: 'What are the plans for communicating the bene…', status: 'Answered', tone: 'answered' },
    { id: 'B105', subject: 'How does the company plan to respond t…', preview: 'How will the company ensure the retention of k…', status: 'Assigned', tone: 'assigned' },
  ];

  readonly variants: { id: Variant; title: string; description: string; pros: string; cons: string }[] = [
    {
      id: 'drawer', title: 'A · Stage bar + Activity drawer',
      description: 'Степер і рядок «хід за ким» лежать під заголовком. Activity відкривається панеллю поверх треду; сам тред не зсувається.',
      pros: 'статус видно без кліків; тред не зсувається; workflow і activity в одній історії.',
      cons: 'панель перекриває тред; на мобільному стає bottom sheet.',
    },
    {
      id: 'inline', title: 'B · History row',
      description: 'Замість центральної кнопки «Activity» — один рядок «History · Approval · 4/5». Розгортається на місці з обмеженою висотою і скролом.',
      pros: 'замінює окремий блок одним рядком; у згорнутому стані майже не займає місця.',
      cons: 'розгорнутий знову тисне тред; етап видно лише в рядку.',
    },
    {
      id: 'tabs', title: 'C · Thread / History tabs',
      description: 'Таби Thread і History над тредом. Рядок «хід за ким» лишається в обох режимах.',
      pros: 'чіткі режими; повна історія без обмеження висоти.',
      cons: 'history не видно, поки пишеш відповідь.',
    },
    {
      id: 'grouped', title: 'D · Stage-grouped thread',
      description: 'Повідомлення і системні події згруповані по етапах в одному потоці; степер прилипає зверху. «System events» ховає події.',
      pros: 'хронологія і етапи в одному місці; нічого не ховається.',
      cons: 'довгий тред шумить (його знімає «System events»); складніша верстка.',
    },
  ];

  readonly variant = signal<Variant>('drawer');
  readonly role = signal<Role>('expert');
  readonly tab = signal<'thread' | 'history'>('thread');
  readonly historyOpen = signal(false);
  readonly inlineOpen = signal(false);
  readonly showSystem = signal(true);

  readonly current = computed(() => this.variants.find(v => v.id === this.variant())!);
  readonly currentStage = computed(() => this.stages.find(s => s.state === 'current')!);
  readonly doneCount = computed(() => this.stages.filter(s => s.state === 'done').length);

  readonly isMyTurn = computed(() => this.role() === 'approver');

  readonly waiting = computed<string>(() => ({
    submitter: 'Waiting on Anna Camp to approve the answer.',
    expert: 'Answer is with Anna Camp for approval.',
    approver: 'Review John Doe’s answer, then approve or request changes.',
  }[this.role()]));

  readonly threadMessages = computed(() => MESSAGES.filter(m => m.kind !== 'note' || this.role() !== 'submitter'));

  setVariant(id: Variant): void {
    this.variant.set(id);
    this.historyOpen.set(false);
    this.tab.set('thread');
  }

  eventsFor(stageId: string): QEvent[] {
    return EVENTS.filter(e => e.stage === stageId);
  }

  messagesFor(stageId: string): QMessage[] {
    return this.threadMessages().filter(m => m.stage === stageId);
  }
}
