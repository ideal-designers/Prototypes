import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DS_COMPONENTS } from '../../shared/ds';
import { SegmentItem } from '../../shared/ds/components/segment/segment.component';
import { TrackerService } from '../../services/tracker.service';
import { MorphMarkComponent, MorphScene } from './morph-mark.component';

interface Step { scene: MorphScene; label: string; detail: string; ms: number; }
interface Card { scene: Exclude<MorphScene, 'logo'>; name: string; what: string; when: string; }

/** One answer, step by step — the mark becomes each action as the label changes. */
const RUN: Step[] = [
  { scene: 'logo',     label: 'Thinking…',                               detail: '',                         ms: 1200 },
  { scene: 'search',   label: 'Searching all files you can open',        detail: '1,248 files',              ms: 2600 },
  { scene: 'folder',   label: 'Opening 5 Legal Agreements',              detail: '3 agreements',             ms: 2600 },
  { scene: 'read',     label: 'Reading SPA v4 and 2 more',               detail: 'change of control clauses', ms: 2800 },
  { scene: 'compare',  label: 'Comparing SPA v3 and v4',                 detail: '4 changed clauses',        ms: 2600 },
  { scene: 'qa',       label: 'Writing the answer',                      detail: '',                         ms: 2400 },
];

@Component({
  selector: 'fvdr-ai-action-morphs',
  standalone: true,
  imports: [CommonModule, RouterLink, ...DS_COMPONENTS, MorphMarkComponent],
  template: `
  <div class="page" [class.dark-theme]="theme === 'dark'">
    <header class="top">
      <div class="top__title">
        <vdr-morph-mark [scene]="RUN[step].scene" [size]="32" [speed]="speed"></vdr-morph-mark>
        <div>
          <h1>AI action morphs</h1>
          <p class="sub">The AI mark turns into what the assistant is doing in the data room, acts it out, and folds back into the logo. Every shape is one of the logo's four rings, so it never stops being our mark.</p>
        </div>
      </div>
      <div class="top__ctrl">
        <fvdr-segment [items]="themeItems" [activeId]="theme" (activeIdChange)="theme = $any($event)"></fvdr-segment>
        <fvdr-segment [items]="speedItems" [activeId]="speed + ''" (activeIdChange)="speed = +$event"></fvdr-segment>
        <a class="link" routerLink="/ai-loader-lab">Loader lab <fvdr-icon name="chevron-right"></fvdr-icon></a>
      </div>
    </header>

    <!-- 1. Live answer -->
    <section class="sec">
      <div class="sec__head">
        <div>
          <h2>1 · In an answer</h2>
          <p>The thinking line steps through the job. Mark and label change together, finished steps get a check.</p>
        </div>
        <fvdr-btn [label]="playing ? 'Pause' : 'Play'" size="s" variant="secondary" (clicked)="playing = !playing"></fvdr-btn>
      </div>

      <div class="run">
        <div class="chat">
          <div class="chat__q">Which agreements need consent on a change of control, and what changed in SPA v4?</div>

          <div class="status" role="status" aria-live="polite">
            <vdr-morph-mark [scene]="done ? 'logo' : RUN[step].scene" [size]="20" [speed]="speed" [label]="RUN[step].label"></vdr-morph-mark>
            <span class="status__label" [class.shimmer]="!done">{{ done ? 'Analysed 3 files · 5 steps · 14 s' : RUN[step].label + (step ? '…' : '') }}</span>
          </div>

          <ul class="steps">
            <li *ngFor="let s of RUN.slice(1); let i = index" class="steps__row"
                [class.steps__row--done]="done || i + 1 < step" [class.steps__row--live]="!done && i + 1 === step"
                [class.steps__row--todo]="!done && i + 1 > step">
              <span class="steps__ico">
                <fvdr-icon *ngIf="done || i + 1 < step" name="check"></fvdr-icon>
                <vdr-morph-mark *ngIf="!done && i + 1 === step" [scene]="s.scene" [size]="16" [speed]="speed"></vdr-morph-mark>
                <i *ngIf="!done && i + 1 > step" class="todo"></i>
              </span>
              <span>{{ s.label }}</span>
              <span class="muted" *ngIf="s.detail && (done || i + 1 <= step)">· {{ s.detail }}</span>
            </li>
          </ul>
        </div>

        <div class="hero">
          <div class="hero__halo"></div>
          <vdr-morph-mark [scene]="done ? 'logo' : RUN[step].scene" [size]="132" [speed]="speed"></vdr-morph-mark>
          <span class="hero__label">{{ done ? 'Answer ready' : RUN[step].label }}</span>
        </div>
      </div>
    </section>

    <!-- 2. Library -->
    <section class="sec">
      <div class="sec__head">
        <div>
          <h2>2 · Library</h2>
          <p>Each morph on its own: logo → action → logo. Hover a card to hold the action.</p>
        </div>
      </div>
      <div class="grid">
        <article class="card" *ngFor="let c of cards; let i = index" (mouseenter)="hold = c.scene" (mouseleave)="hold = null">
          <div class="card__stage">
            <vdr-morph-mark [scene]="cardScene(c.scene, i)" [size]="96" [speed]="speed" [label]="c.name"></vdr-morph-mark>
          </div>
          <div class="card__inline">
            <vdr-morph-mark [scene]="cardScene(c.scene, i)" [size]="18" [speed]="speed"></vdr-morph-mark>
            <span class="status__label">{{ c.when }}…</span>
          </div>
          <b>{{ c.name }}</b>
          <p class="muted">{{ c.what }}</p>
        </article>
      </div>
    </section>

    <!-- 3. Small sizes -->
    <section class="sec">
      <div class="sec__head"><div><h2>3 · At status-line size</h2><p>16 and 20px, where they will mostly live. Shapes are kept chunky so they still read.</p></div></div>
      <div class="tiny">
        <div class="tiny__row" *ngFor="let c of cards">
          <vdr-morph-mark [scene]="c.scene" [size]="16" [speed]="speed"></vdr-morph-mark>
          <vdr-morph-mark [scene]="c.scene" [size]="20" [speed]="speed"></vdr-morph-mark>
          <span class="muted">{{ c.name }}</span>
        </div>
      </div>
    </section>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page { min-height: 100vh; background: var(--color-stone-0); color: var(--color-text-primary); font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); padding: var(--space-8) var(--space-10) var(--space-12); }
    @media (max-width: 767px) { .page { padding: var(--space-6) var(--space-4) var(--space-10); } }
    h1 { margin: 0; font-size: var(--font-size-4xl, 24px); font-weight: var(--font-weight-bold, 700); line-height: 32px; }
    h2 { margin: 0; font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: 24px; }
    p { margin: 0; line-height: 20px; }
    a { color: var(--color-primary-500); text-decoration: none; }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); font-weight: var(--font-weight-semi, 600); }
    .muted { color: var(--color-text-secondary); }

    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-6); flex-wrap: wrap;
      padding-bottom: var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .top__title { display: flex; gap: var(--space-4); align-items: flex-start; max-width: 760px; }
    .sub { color: var(--color-text-secondary); margin-top: var(--space-1); }
    .top__ctrl { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }

    .sec { padding: var(--space-8) 0; border-bottom: 1px solid var(--color-divider); }
    .sec:last-child { border-bottom: none; }
    .sec__head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); }
    .sec__head p { color: var(--color-text-secondary); margin-top: var(--space-1); }

    .shimmer { background: linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-secondary) 40%,
        var(--ai-mark-shimmer) 50%, var(--color-text-secondary) 60%, var(--color-text-secondary) 100%);
      background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: shimmer 2s linear infinite; }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -150% 0; } }

    .run { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: var(--space-6); }
    @media (max-width: 1023px) { .run { grid-template-columns: 1fr; } }
    .chat { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5); border-radius: var(--radius-lg);
      background: var(--color-stone-100); min-height: 320px; }
    .chat__q { align-self: flex-end; max-width: 85%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-lg); background: var(--color-stone-300); }
    .status { display: flex; align-items: center; gap: var(--space-2); min-height: 24px; }
    .status__label { color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .steps { list-style: none; margin: 0; padding: 0 0 0 var(--space-1); display: flex; flex-direction: column; gap: var(--space-2); }
    .steps__row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm, 13px); line-height: 20px;
      transition: opacity var(--duration-base, 150ms) ease; }
    .steps__row--live { font-weight: var(--font-weight-semi, 600); }
    .steps__row--todo { opacity: 0.45; }
    .steps__ico { width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
    .steps__row--done .steps__ico { color: var(--color-primary-500); font-size: var(--font-size-sm, 13px); }
    .todo { width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--color-stone-500); }

    .hero { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-5);
      min-height: 320px; border-radius: var(--radius-lg); background: var(--color-stone-100); overflow: hidden; }
    .hero__halo { position: absolute; left: 50%; top: 44%; width: 240px; height: 240px; transform: translate(-50%, -50%);
      border-radius: 50%; background: var(--ai-wash); filter: blur(30px); opacity: 0.7; }
    .hero vdr-morph-mark, .hero__label { position: relative; }
    .hero__label { font-weight: var(--font-weight-semi, 600); color: var(--color-text-secondary); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-6) var(--space-5); }
    .card { display: flex; flex-direction: column; gap: var(--space-2); }
    .card__stage { height: 150px; border-radius: var(--radius-md); background: var(--color-stone-100); display: flex;
      align-items: center; justify-content: center; margin-bottom: var(--space-1); }
    .card__inline { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); font-size: var(--font-size-sm, 13px); }
    .card p { font-size: var(--font-size-sm, 13px); }

    .tiny { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-3) var(--space-6); }
    .tiny__row { display: flex; align-items: center; gap: var(--space-3); }

    @media (prefers-reduced-motion: reduce) { .shimmer { animation: none; background: none; color: var(--color-text-secondary); } }
  `],
})
export class AiActionMorphsComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  readonly RUN = RUN;
  theme: 'light' | 'dark' = 'light';
  speed = 1;
  playing = true;
  step = 0;
  done = false;
  hold: MorphScene | null = null;
  private tick = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ticker?: ReturnType<typeof setInterval>;

  readonly themeItems: SegmentItem[] = [{ id: 'light', icon: 'theme-light', label: 'Light' }, { id: 'dark', icon: 'theme-dark', label: 'Dark' }];
  readonly speedItems: SegmentItem[] = [{ id: '0.5', label: '0.5×' }, { id: '1', label: '1×' }, { id: '1.5', label: '1.5×' }];

  readonly cards: Card[] = [
    { scene: 'search',    name: 'Search the room',    when: 'Searching 1,248 files',
      what: 'The outer ring becomes a lens; a dot flies round inside it with a smaller one trailing.' },
    { scene: 'searchEye', name: 'Search · eye in the lens', when: 'Looking through 5 Legal Agreements',
      what: 'An eye inside the lens looks left, right, blinks and looks up, as if reading what it found.' },
    { scene: 'folder',    name: 'Open a folder',      when: 'Opening 5 Legal Agreements',
      what: 'The flap tips open and two circles bubble up out of the folder.' },
    { scene: 'read',      name: 'Analyse a document', when: 'Reading SPA v4',
      what: 'A round reading lens works down the page, line by line.' },
    { scene: 'compare',   name: 'Compare versions · lens', when: 'Comparing SPA v3 and v4',
      what: 'Two pages side by side; a round lens hops from a line on one to the same line on the other and the change lights up.' },
    { scene: 'compareStack', name: 'Compare versions · stack', when: 'Comparing SPA v3 and v4',
      what: 'v4 slides aside to show the changed line on v3 underneath; a dot on its corner pulses "changed".' },
    { scene: 'lock',      name: 'Check permissions',  when: 'Checking who can see this',
      what: 'A round padlock; the shackle lifts and the keyhole glows.' },
    { scene: 'activity',  name: 'Count activity',     when: 'Counting bidder visits',
      what: 'Engagement as a bubble chart: four circles swell in turn.' },
    { scene: 'qa',        name: 'Draft a Q&A answer', when: 'Drafting the answer',
      what: 'Typing dots in a round speech bubble.' },
    { scene: 'report',    name: 'Build a report',     when: 'Building the weekly report',
      what: 'A pie chart is drawn: the slice sweeps round while a dot pens its edge, then it starts again.' },
    { scene: 'redact',    name: 'Redact',             when: 'Redacting personal data',
      what: 'A round marker runs along the lines and blacks them out.' },
  ];

  /** Cards breathe: ~1 s as the logo, then the action, staggered so they don't move in lockstep. */
  cardScene(scene: MorphScene, i: number): MorphScene {
    if (this.hold === scene) return scene;
    return (this.tick + i * 3) % 10 < 2 ? 'logo' : scene;
  }

  ngOnInit(): void {
    this.tracker.trackPageView('ai-action-morphs');
    this.ticker = setInterval(() => this.tick++, 500);
    this.next(0);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    clearInterval(this.ticker);
    this.tracker.destroyListeners();
  }

  /** Walk the answer: each step for its time, then "Answer ready" as the logo, then again. */
  private next(i: number): void {
    const wait = (ms: number, fn: () => void) => {
      const go = (): void => { if (this.playing) fn(); else this.timers.push(setTimeout(go, 300)); };
      this.timers.push(setTimeout(go, ms / this.speed));
    };
    if (i >= RUN.length) {
      this.done = true;
      wait(2600, () => { this.done = false; this.next(0); });
      return;
    }
    this.step = i;
    wait(RUN[i].ms, () => this.next(i + 1));
  }
}
