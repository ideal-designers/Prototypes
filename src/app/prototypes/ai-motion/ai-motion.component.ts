import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DS_COMPONENTS } from '../../shared/ds';
import { SegmentItem } from '../../shared/ds/components/segment/segment.component';
import { TrackerService } from '../../services/tracker.service';
import { AiMarkComponent, AiMarkMode, AiMarkSkin } from './ai-mark.component';

const FIGMA = 'https://www.figma.com/design/Vhy3jLaJ9nasbzTtqbu3qB/AI-Assistant?node-id=';

interface Candidate {
  id: string; name: string; mode: AiMarkMode; skin?: AiMarkSkin; verdict: 'pick' | 'alt' | 'try';
  what: string; why: string; use: string; speed?: number;
}
interface Placement {
  id: string; where: string; node: string; size: string; pick: string; note: string;
}

type HeroState = 'idle' | 'working' | 'done';

@Component({
  selector: 'fvdr-ai-motion',
  standalone: true,
  imports: [CommonModule, RouterLink, ...DS_COMPONENTS, AiMarkComponent],
  template: `
  <div class="page" [class.dark-theme]="theme === 'dark'">
    <header class="top">
      <div class="top__title">
        <ai-motion-mark mode="turn" [size]="28" [active]="true" [speed]="0.7"></ai-motion-mark>
        <div>
          <h1>AI motion</h1>
          <p class="sub">The working symbol and the large placeholder, built from the ideals. sphere. Every frame keeps the logo's four layers, so motion never turns into a generic spinner.</p>
        </div>
      </div>
      <div class="top__ctrl">
        <fvdr-segment [items]="themeItems" [activeId]="theme" (activeIdChange)="theme = $any($event)"></fvdr-segment>
        <fvdr-segment [items]="runItems" [activeId]="running ? 'run' : 'done'" (activeIdChange)="running = $event === 'run'"></fvdr-segment>
        <a class="link" routerLink="/ai-loader-lab">Loader lab <fvdr-icon name="chevron-right"></fvdr-icon></a>
      </div>
    </header>

    <!-- ── 1. Working symbol ─────────────────────────────────────────────── -->
    <section class="sec">
      <div class="sec__head">
        <span class="sec__num">1</span>
        <div>
          <h2>Working symbol</h2>
          <p>Sits next to the status text while the assistant thinks, runs steps or writes. 14–20px. Replaces the static sparkle in Figma "Thinking…".</p>
        </div>
      </div>
      <div class="grid">
        <article class="card" *ngFor="let c of symbols" [class.card--pick]="c.verdict === 'pick'">
          <div class="card__stage">
            <ai-motion-mark [mode]="c.mode" [skin]="c.skin || 'brand'" [size]="56" [active]="running" [speed]="c.speed || 1"></ai-motion-mark>
          </div>
          <div class="card__inline">
            <ai-motion-mark [mode]="c.mode" [skin]="c.skin || 'brand'" [size]="16" [active]="running" [speed]="c.speed || 1"></ai-motion-mark>
            <span class="status" [class.shimmer]="running">{{ running ? 'Thinking…' : 'Analysed 3 files · 8 s' }}</span>
          </div>
          <div class="card__body">
            <div class="card__name">
              <span>{{ c.name }}</span>
              <span class="verdict" [attr.data-v]="c.verdict">{{ verdictLabel[c.verdict] }}</span>
            </div>
            <p>{{ c.what }}</p>
            <p class="muted"><b>Why:</b> {{ c.why }}</p>
            <p class="muted"><b>Use for:</b> {{ c.use }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- ── 2. Large placeholder ──────────────────────────────────────────── -->
    <section class="sec">
      <div class="sec__head">
        <span class="sec__num">2</span>
        <div>
          <h2>Large placeholder</h2>
          <p>The 120px mark on the empty state and on "Catching you up…" (Figma <a [href]="figma('1380-109417')" target="_blank">1380:109417</a>, <a [href]="figma('613-37723')" target="_blank">613:37723</a>). Same mark, three states: idle breathes slowly, working runs at full tempo, done settles.</p>
        </div>
        <fvdr-segment class="sec__ctrl" [items]="heroItems" [activeId]="hero" (activeIdChange)="hero = $any($event)"></fvdr-segment>
      </div>
      <div class="grid grid--hero">
        <article class="card" *ngFor="let c of heroes" [class.card--pick]="c.verdict === 'pick'">
          <div class="card__stage card__stage--hero">
            <div class="halo" [class.halo--on]="hero === 'working'" [class.halo--idle]="hero === 'idle'"></div>
            <ai-motion-mark [mode]="c.mode" [skin]="c.skin || 'brand'" [size]="112" glow
                            [active]="hero !== 'done' && running" [speed]="(c.speed || 1) * (hero === 'idle' ? 0.35 : 1)"></ai-motion-mark>
            <p class="hero-copy"><b>Good morning, Olena.</b> <span [class.shimmer-accent]="hero === 'working'" class="hero-copy__s">{{ hero === 'working' ? 'Catching you up…' : hero === 'done' ? 'Here is your brief.' : "Let's get the project ready." }}</span></p>
          </div>
          <div class="card__body">
            <div class="card__name">
              <span>{{ c.name }}</span>
              <span class="verdict" [attr.data-v]="c.verdict">{{ verdictLabel[c.verdict] }}</span>
            </div>
            <p>{{ c.what }}</p>
            <p class="muted"><b>Use for:</b> {{ c.use }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- ── 3. Where it goes ──────────────────────────────────────────────── -->
    <section class="sec">
      <div class="sec__head">
        <span class="sec__num">3</span>
        <div>
          <h2>Where it goes</h2>
          <p>Every place in the AI Assistant flows (Figma "✨ General AI chat", Chat V1 / Home V2 / Answers V2) where the user waits on the assistant, and the motion each one gets.</p>
        </div>
      </div>
      <div class="map">
        <div class="map__row map__row--head">
          <span>Place</span><span>Size</span><span>Motion</span><span>Preview</span>
        </div>
        <div class="map__row" *ngFor="let p of placements">
          <span class="map__where">
            <b>{{ p.where }}</b>
            <a [href]="figma(p.node)" target="_blank" class="node">Figma {{ p.node.replace('-', ':') }} <fvdr-icon name="link"></fvdr-icon></a>
          </span>
          <span class="mono">{{ p.size }}</span>
          <span><b>{{ p.pick }}</b><br><span class="muted">{{ p.note }}</span></span>
          <span class="map__mock" [ngSwitch]="p.id">

            <span *ngSwitchCase="'thinking'" class="mock-line">
              <ai-motion-mark mode="turn" [size]="16" [active]="running"></ai-motion-mark>
              <span class="status" [class.shimmer]="running">Thinking…</span>
            </span>

            <span *ngSwitchCase="'steps'" class="mock-line">
              <ai-motion-mark mode="turn" [size]="16" [active]="running"></ai-motion-mark>
              <span class="status" [class.shimmer]="running">{{ stepLabels[stepIdx] }}</span>
              <fvdr-icon name="chevron-right" class="dim"></fvdr-icon>
            </span>

            <span *ngSwitchCase="'done'" class="mock-line">
              <ai-motion-mark mode="turn" [size]="16" [active]="false"></ai-motion-mark>
              <span class="status">Analysed Activity log · 2 steps · 8 s</span>
              <fvdr-icon name="chevron-right" class="dim"></fvdr-icon>
            </span>

            <span *ngSwitchCase="'empty'" class="mock-hero">
              <ai-motion-mark mode="liquid" [size]="44" glow [active]="running" [speed]="0.35"></ai-motion-mark>
            </span>

            <span *ngSwitchCase="'brief'" class="mock-hero mock-hero--brief">
              <ai-motion-mark mode="liquid" [size]="36" glow [active]="running"></ai-motion-mark>
              <span class="skel-row"><i class="skel" [class.skel--run]="running"></i><i class="skel" [class.skel--run]="running"></i><i class="skel" [class.skel--run]="running"></i></span>
            </span>

            <span *ngSwitchCase="'report'" class="mock-report">
              <ai-motion-mark mode="flow" [size]="22" [active]="running"></ai-motion-mark>
              <span class="mock-report__txt">
                <b>Document activity report</b>
                <span class="muted">Building chart 3 of 5</span>
                <span class="bar"><i [class.bar--run]="running"></i></span>
              </span>
            </span>

            <span *ngSwitchCase="'stepdot'" class="mock-steps">
              <span><fvdr-icon name="check" class="ok"></fvdr-icon> Grouped by folder</span>
              <span class="cur"><ai-motion-mark mode="cascade" [size]="12" [active]="running"></ai-motion-mark> Building charts</span>
              <span class="dim"><i class="todo"></i> Writing the summary</span>
            </span>

            <span *ngSwitchCase="'stop'" class="mock-stop">
              <span class="field">Ask about this project…</span>
              <button class="stopbtn" type="button" [attr.aria-label]="running ? 'Stop generating' : 'Send'">
                <ai-motion-mark mode="spin" skin="outline" [size]="18" [active]="running"></ai-motion-mark>
                <i class="stopbtn__sq" *ngIf="running"></i>
              </button>
            </span>

            <span *ngSwitchCase="'stream'" class="mock-stream">
              Bidders opened 1,284 documents this week, 18% more than last
              <ai-motion-mark mode="wave" [size]="10" [active]="running"></ai-motion-mark>
            </span>

            <span *ngSwitchCase="'entry'" class="mock-line mock-entry" (mouseenter)="entryHover = true" (mouseleave)="entryHover = false">
              <ai-motion-mark mode="morph" [size]="20" [active]="entryHover" [speed]="1.6"></ai-motion-mark>
              <span class="status">AI Assistant <span class="muted">(hover)</span></span>
            </span>
          </span>
        </div>
      </div>
    </section>

    <!-- ── 4. Motion rules ───────────────────────────────────────────────── -->
    <section class="sec">
      <div class="sec__head">
        <span class="sec__num">4</span>
        <div><h2>Motion rules</h2><p>What engineering needs to ship this consistently.</p></div>
      </div>
      <div class="rules">
        <div class="rule" *ngFor="let r of rules"><b>{{ r.t }}</b><p>{{ r.d }}</p></div>
      </div>
    </section>

    <!-- ── 5. References ─────────────────────────────────────────────────── -->
    <section class="sec">
      <div class="sec__head">
        <span class="sec__num">5</span>
        <div><h2>How other assistants do it</h2><p>Patterns from current AI products and what we take from each. Our version always draws with the logo instead of a generic glyph.</p></div>
      </div>
      <div class="refs">
        <div class="ref" *ngFor="let r of refs">
          <b>{{ r.name }}</b>
          <p>{{ r.pattern }}</p>
          <p class="take"><fvdr-icon name="check"></fvdr-icon> {{ r.take }}</p>
        </div>
      </div>
    </section>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page { min-height: 100vh; background: var(--color-stone-0); color: var(--color-text-primary);
      font-family: var(--font-family); font-size: var(--font-size-base, 14px); padding: var(--space-8) var(--space-10) var(--space-12);
      transition: background var(--duration-slow, 200ms) ease; }
    @media (max-width: 767px) { .page { padding: var(--space-6) var(--space-4) var(--space-10); } }

    h1 { margin: 0; font-size: var(--font-size-4xl, 24px); font-weight: var(--font-weight-bold, 700); line-height: 32px; }
    h2 { margin: 0; font-size: var(--font-size-xl, 18px); font-weight: var(--font-weight-semi, 600); line-height: 24px; }
    p { margin: 0; line-height: 20px; }
    a { color: var(--color-primary-500); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .muted { color: var(--color-text-secondary); }
    .dim { color: var(--color-text-placeholder); }
    .mono { font-family: var(--font-family-mono); font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }

    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-6); flex-wrap: wrap;
      padding-bottom: var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .top__title { display: flex; gap: var(--space-4); align-items: flex-start; max-width: 720px; }
    .top__title ai-motion-mark { margin-top: 2px; }
    .sub { color: var(--color-text-secondary); margin-top: var(--space-1); }
    .top__ctrl { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); font-weight: var(--font-weight-semi, 600); }

    .sec { padding: var(--space-8) 0; border-bottom: 1px solid var(--color-divider); }
    .sec:last-child { border-bottom: none; }
    .sec__head { display: flex; gap: var(--space-3); align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; }
    .sec__head > div { flex: 1 1 420px; max-width: 760px; }
    .sec__head p { color: var(--color-text-secondary); margin-top: var(--space-1); }
    .sec__num { flex: 0 0 auto; width: 24px; height: 24px; border-radius: var(--radius-full); background: var(--color-primary-50);
      color: var(--color-primary-600); font-weight: var(--font-weight-semi, 600); font-size: var(--font-size-xs, 12px);
      display: inline-flex; align-items: center; justify-content: center; margin-top: 0; }
    .sec__ctrl { margin-left: auto; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-6) var(--space-5); }
    .grid--hero { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { display: flex; flex-direction: column; gap: var(--space-3); }
    .card__stage { position: relative; height: 136px; border-radius: var(--radius-md); background: var(--color-stone-100);
      display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .card--pick .card__stage { box-shadow: inset 0 0 0 1.5px var(--color-primary-500); }
    .card__stage--hero { height: 260px; flex-direction: column; gap: var(--space-6); }
    .card__inline { display: flex; align-items: center; gap: var(--space-2); min-height: 20px; }
    .card__body { display: flex; flex-direction: column; gap: var(--space-2); }
    .card__body p { font-size: var(--font-size-sm, 13px); }
    .card__name { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi, 600);
      font-size: var(--font-size-md, 15px); }
    .verdict { font-size: var(--font-size-xs, 12px); font-weight: var(--font-weight-semi, 600); line-height: 20px;
      padding: 0 var(--space-2); border-radius: var(--radius-sm); background: var(--chip-bg-grey); color: var(--color-text-secondary); }
    .verdict[data-v='pick'] { background: var(--chip-bg-green); color: var(--color-primary-600); }
    .verdict[data-v='alt']  { background: var(--chip-bg-blue); color: var(--color-info-500); }

    .status { color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Thinking text: a soft brand-green highlight sweeping left → right */
    .shimmer, .shimmer-accent {
      background: linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-secondary) 40%,
        var(--ai-mark-shimmer) 50%, var(--color-text-secondary) 60%, var(--color-text-secondary) 100%);
      background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: shimmer 2s linear infinite; }
    .shimmer-accent { background-image: linear-gradient(90deg, var(--color-info-500) 0%, var(--color-info-500) 35%,
        var(--ai-mark-shimmer) 50%, var(--color-info-500) 65%, var(--color-info-500) 100%); }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -150% 0; } }

    .halo { position: absolute; left: 50%; top: 42%; width: 220px; height: 220px; transform: translate(-50%, -50%) scale(0.85);
      border-radius: 50%; background: var(--ai-wash); filter: blur(28px); opacity: 0.45;
      transition: opacity 0.6s ease, transform 0.6s ease; }
    .halo--idle { animation: halo-breathe 5s ease-in-out infinite; }
    .halo--on { opacity: 0.95; transform: translate(-50%, -50%) scale(1.1); animation: halo-breathe 2s ease-in-out infinite; }
    @keyframes halo-breathe { 50% { transform: translate(-50%, -50%) scale(1.18); } }
    .hero-copy { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; padding: 0 var(--space-4); }
    .hero-copy b { font-weight: var(--font-weight-semi, 600); font-size: var(--font-size-md, 15px); }
    .hero-copy__s { color: var(--color-info-500); font-weight: var(--font-weight-semi, 600); }

    .map { display: flex; flex-direction: column; }
    .map__row { display: grid; grid-template-columns: minmax(200px, 1.3fr) 90px minmax(200px, 1.4fr) minmax(260px, 1.6fr);
      gap: var(--space-4); padding: var(--space-4) 0; border-bottom: 1px solid var(--color-divider); align-items: center; }
    .map__row--head { padding: var(--space-2) 0; font-size: var(--font-size-xs, 12px); font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .map__row > span { font-size: var(--font-size-sm, 13px); line-height: 20px; }
    .map__where { display: flex; flex-direction: column; gap: 2px; }
    .node { font-size: var(--font-size-xs, 12px); display: inline-flex; align-items: center; gap: var(--space-1); }
    .map__mock { min-height: 56px; display: flex; align-items: center; padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md); background: var(--color-stone-100); }
    @media (max-width: 1023px) {
      .map__row { grid-template-columns: 1fr 1fr; }
      .map__row--head { display: none; }
      .map__mock { grid-column: 1 / -1; }
    }

    .mock-line { display: inline-flex; align-items: center; gap: var(--space-2); min-width: 0; }
    .mock-entry { cursor: pointer; }
    .mock-hero { display: flex; align-items: center; gap: var(--space-4); width: 100%; justify-content: center; }
    .mock-hero--brief { justify-content: flex-start; }
    .skel-row { display: flex; gap: var(--space-2); flex: 1; }
    .skel { flex: 1; height: 28px; border-radius: var(--radius-sm); background: var(--color-stone-300); position: relative; overflow: hidden; }
    .skel--run::after { content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, var(--ai-mark-glow), transparent); animation: skel 1.4s ease-in-out infinite; transform: translateX(-100%); }
    @keyframes skel { to { transform: translateX(100%); } }

    .mock-report { display: flex; gap: var(--space-3); align-items: center; width: 100%; }
    .mock-report__txt { display: flex; flex-direction: column; gap: 2px; flex: 1; font-size: var(--font-size-xs, 12px); line-height: 16px; }
    .bar { height: 4px; border-radius: var(--radius-full); background: var(--color-stone-300); overflow: hidden; margin-top: var(--space-1); }
    .bar i { display: block; height: 100%; width: 60%; border-radius: inherit;
      background: linear-gradient(90deg, var(--ai-mark-top), var(--ai-mark-low-3), var(--color-info-500)); background-size: 200% 100%; }
    .bar--run { animation: bar 1.6s linear infinite; }
    @keyframes bar { to { background-position: -200% 0; } }

    .mock-steps { display: flex; flex-direction: column; gap: 2px; font-size: var(--font-size-xs, 12px); line-height: 18px; }
    .mock-steps > span { display: inline-flex; align-items: center; gap: var(--space-2); }
    .mock-steps .ok { color: var(--color-primary-500); font-size: var(--font-size-xs, 12px); }
    .mock-steps .cur { font-weight: var(--font-weight-semi, 600); }
    .todo { width: 8px; height: 8px; margin: 0 2px; border-radius: 50%; border: 1px solid var(--color-stone-500); display: inline-block; }

    .mock-stop { display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: var(--space-1) var(--space-1) var(--space-1) var(--space-3);
      border-radius: var(--radius-sm); background: var(--color-stone-0); box-shadow: inset 0 0 0 1px var(--color-stone-400); }
    .field { flex: 1; color: var(--color-text-placeholder); }
    .stopbtn { position: relative; width: 32px; height: 32px; border: none; border-radius: var(--radius-sm); background: transparent;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-primary); }
    .stopbtn:hover { background: var(--color-hover-bg); }
    .stopbtn__sq { position: absolute; width: 7px; height: 7px; border-radius: 1px; background: var(--color-text-primary); }

    .mock-stream { font-size: var(--font-size-sm, 13px); line-height: 20px; }
    .mock-stream ai-motion-mark { margin-left: 2px; }

    .rules { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-5) var(--space-8); }
    .rule b { display: block; margin-bottom: var(--space-1); }
    .rule p { color: var(--color-text-secondary); font-size: var(--font-size-sm, 13px); }

    .refs { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-5) var(--space-8); }
    .ref { display: flex; flex-direction: column; gap: var(--space-1); }
    .ref p { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); }
    .ref .take { color: var(--color-text-primary); display: flex; gap: var(--space-1); align-items: flex-start; }
    .ref .take fvdr-icon { color: var(--color-primary-500); margin-top: 3px; }

    @media (prefers-reduced-motion: reduce) {
      .shimmer, .shimmer-accent, .halo, .skel--run::after, .bar--run { animation: none; }
      .shimmer, .shimmer-accent { color: var(--color-text-secondary); background: none; }
    }
  `],
})
export class AiMotionComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  theme: 'light' | 'dark' = 'light';
  running = true;
  hero: HeroState = 'working';
  entryHover = false;
  stepIdx = 0;
  private stepTimer?: ReturnType<typeof setInterval>;

  readonly themeItems: SegmentItem[] = [{ id: 'light', icon: 'theme-light', label: 'Light' }, { id: 'dark', icon: 'theme-dark', label: 'Dark' }];
  readonly runItems: SegmentItem[] = [{ id: 'run', label: 'Working' }, { id: 'done', label: 'Done' }];
  readonly heroItems: SegmentItem[] = [{ id: 'idle', label: 'Idle' }, { id: 'working', label: 'Working' }, { id: 'done', label: 'Done' }];
  readonly verdictLabel = { pick: 'Recommended', alt: 'Alternative', try: 'Experiment' };
  readonly stepLabels = ['Picked the most relevant files…', 'Reading SPA v4 and 2 more…', 'Comparing revenue by quarter…', 'Writing the answer…'];

  readonly symbols: Candidate[] = [
    { id: 'turn', name: 'Turn', mode: 'turn', verdict: 'pick',
      what: 'The sphere turns: the light layers swing from the left edge to the right and back, slightly out of step.',
      why: 'Reads as busy even at 14px, and every frame is still the logo. Calm enough to run for minutes.',
      use: 'Default: "Thinking…", live steps, side panel, Ask Ideon.' },
    { id: 'morph', name: 'Logo ⇄ spark', mode: 'morph', verdict: 'alt',
      what: 'The layers gather into the four-point spark from the Figma "Thinking…" line, twinkle, and open back into the sphere.',
      why: 'Bridges the sparkle the designs use today and the brand mark, so neither has to go.',
      use: 'Start of a request (first 1–2 s), hover on AI entry points.' },
    { id: 'flow', name: 'Flow', mode: 'flow', verdict: 'alt',
      what: 'New layers keep appearing at the rim and shrinking into the left edge, like zooming into the logo forever.',
      why: 'Has no visible start or end, so it fits long jobs where a looping swing would feel repetitive.',
      use: 'Report building, bulk analysis, anything over ~10 s.' },
    { id: 'cascade', name: 'Cascade', mode: 'cascade', verdict: 'try',
      what: 'Layers step in one at a time and back out. Discrete frames, like Claude\'s cycling glyph.',
      why: 'Crisp at 10–12px where smooth motion turns to mush.',
      use: 'Current step in a step list, tight chrome.' },
    { id: 'wave', name: 'Wave', mode: 'wave', verdict: 'try',
      what: 'The inner layers swell and settle in a travelling wave. The rim never moves.',
      why: 'The quietest option. Signals "still going" without pulling focus from text that is appearing.',
      use: 'Streaming caret at the end of the answer.' },
    { id: 'orbit', name: 'Orbit', mode: 'orbit', skin: 'outline', verdict: 'try',
      what: 'Outline version: the inner rings roll around the inside of the rim at different speeds.',
      why: 'Works in one colour, so it sits inside buttons and on coloured surfaces.',
      use: 'Stop button, monochrome contexts, toasts.' },
    { id: 'spin', name: 'Ring', mode: 'spin', verdict: 'try',
      what: 'A gradient arc circles a softly breathing logo. The conventional spinner, branded.',
      why: 'The most familiar "loading" read. Matches the ring already on fvdr-ai-orb.',
      use: 'Fallback when the turn is too subtle (e.g. slow network).' },
    { id: 'mandala', name: 'Mandala', mode: 'mandala', skin: 'outline', verdict: 'try',
      what: 'The rings bloom into concentric petal patterns that turn in opposite directions and morph from one mandala to the next (3 in a loop).',
      why: 'Rich and calm at the same time. Reads as "composing" rather than "loading", and still folds back into the logo.',
      use: 'Thinking on longer answers, report or brief generation. At 18px and up, since petals blur below that.' },
    { id: 'eye', name: 'Watching eye', mode: 'eye', skin: 'outline', verdict: 'try',
      what: 'In the line logo the inner rings fold into an eye: an almond lid, iris and pupil that follow your cursor and blink every few seconds. Without a pointer it glances around.',
      why: 'Gives the assistant attention and character: "I see what you are pointing at". Morphs back into the logo when it stops.',
      use: 'Waiting for your input, voice listening, "looking at" a selected file. Use sparingly. It is a character moment, not a loader.' },
  ];

  readonly heroes: Candidate[] = [
    { id: 'liquid', name: 'Liquid sphere', mode: 'liquid', verdict: 'pick', speed: 1,
      what: 'The layers drift and swell inside the disc on a soft green-to-lilac glow. Slow when idle, faster and brighter while working.',
      why: '', use: 'Empty state (idle) and "Catching you up…" (working) — one component, two tempos.' },
    { id: 'iris', name: 'Iridescent', mode: 'orbit', skin: 'iris', verdict: 'alt', speed: 0.6,
      what: 'The pastel AI field edge palette turns behind white logo contours that roll around the rim (Figma iris variant of the logo).',
      why: '', use: 'Brand moments: first-time use, onboarding, release notes.' },
    { id: 'sonar', name: 'Sonar', mode: 'sonar', verdict: 'try', speed: 1,
      what: 'The resting logo with rings rippling out from its rim.',
      why: '', use: 'Waiting on something external: indexing new uploads, a large room.' },
    { id: 'mandalahero', name: 'Mandala, large', mode: 'mandala', verdict: 'try', speed: 0.8,
      what: 'The brand sphere blooms into petalled mandalas that slowly morph into each other.',
      why: '', use: '"Catching you up…", report building, any wait where the screen has room to breathe.' },
    { id: 'eyehero', name: 'Watching eye, large', mode: 'eye', verdict: 'try', speed: 1,
      what: 'The brand sphere opens into an eye that follows the cursor across the page and blinks. Move the mouse around to try it.',
      why: '', use: 'Empty state that waits for the first question, onboarding "I can look at your room".' },
    { id: 'turnhero', name: 'Turn, large', mode: 'turn', verdict: 'try', speed: 0.7,
      what: 'The inline Turn scaled up, so the small and large marks share one motion.',
      why: '', use: 'If one motion everywhere matters more than a richer hero.' },
  ];

  readonly placements: Placement[] = [
    { id: 'thinking', where: 'Chat · Thinking', node: '1380-109797', size: '16px', pick: 'Turn + shimmer text',
      note: 'Replaces the static sparkle. Text shimmer carries the activity when the mark is small.' },
    { id: 'steps', where: 'Chat · Thinking steps', node: '1380-109824', size: '16px', pick: 'Turn, label crossfades',
      note: 'The mark keeps running while step labels change. No restart per step.' },
    { id: 'done', where: 'Chat · Thinking completed', node: '1380-109851', size: '16px', pick: 'Settle to static logo',
      note: 'Eases back to the resting logo in ~350 ms. Never freezes mid-frame.' },
    { id: 'empty', where: 'Chat · Empty state', node: '1380-109417', size: '120px', pick: 'Liquid sphere, idle tempo',
      note: 'Slow breathing (0.35×). The assistant is ready, not busy.' },
    { id: 'brief', where: 'Home · Brief loading', node: '613-37723', size: '120px', pick: 'Liquid, working tempo',
      note: 'Same mark at full tempo with the glow lifted, plus green-tinted skeleton shimmer.' },
    { id: 'report', where: 'Answer · Report building', node: '626-75537', size: '20px', pick: 'Flow',
      note: 'Long job, so a motion with no visible loop. Sits on the PDF card next to the progress bar.' },
    { id: 'stepdot', where: 'Answer · Step list, current step', node: '626-75537', size: '10–12px', pick: 'Cascade',
      note: 'Replaces the teal dot on the running step. Stepped frames stay crisp this small.' },
    { id: 'stop', where: 'Composer · While answering', node: '1380-109797', size: '18px', pick: 'Ring (outline) around stop',
      note: 'Shows the stop button belongs to a running job. Ring disappears when the answer lands.' },
    { id: 'stream', where: 'Answer · Text streaming in', node: '616-39240', size: '10px', pick: 'Wave as caret',
      note: 'A tiny mark at the end of the last word while tokens arrive.' },
    { id: 'entry', where: 'Nav · AI Assistant / Ask Ideon', node: '1380-109417', size: '20px', pick: 'Static, morph on hover',
      note: 'Entry points stay still. One logo → spark morph on hover invites a click.' },
  ];

  readonly rules = [
    { t: 'One mark, many tempos', d: 'Idle 0.35×, working 1×, urgent never. Speed changes ease over ~400 ms. Don\'t swap animations to show a state change.' },
    { t: 'Always settle', d: 'When work ends, ease back to the resting logo (≈350 ms, ease-out). The last frame is always the real logo.' },
    { t: 'Show it after 400 ms', d: 'Anything faster than 400 ms gets no indicator, so quick answers don\'t flash.' },
    { t: 'Text carries meaning', d: 'The mark says "working", the label says what is happening. Under 20px, add the shimmer so the line still reads as live.' },
    { t: 'Size floors', d: '≥14px for smooth modes (Turn, Wave). Use Cascade below 14px. Hero 96–160px with glow.' },
    { t: 'Reduced motion', d: 'prefers-reduced-motion: static logo + text, no shimmer, no halo pulse. Status still announced via role="status".' },
    { t: 'Colour', d: 'Brand ink in both themes (tokens --ai-mark-*). In dark only the line and glow lift. Iridescent is for brand moments, not everyday loading.' },
    { t: 'Performance', d: 'SVG paths updated per frame outside Angular, paused offscreen (IntersectionObserver). No canvas, no WebGL.' },
  ];

  readonly refs = [
    { name: 'Claude', pattern: 'A small spark glyph that cycles through frames next to a rotating verb ("Pondering…", "Brewing…") with a shimmer sweep, plus elapsed time.',
      take: 'Status line = animated mark + changing verb + shimmer. See the Loader lab.' },
    { name: 'ChatGPT', pattern: 'A single pulsing dot while waiting, then "Thinking" as shimmering text with an expandable reasoning trace.',
      take: 'Shimmer on the label instead of a busy icon. Steps fold away when done.' },
    { name: 'Gemini', pattern: 'The four-point spark turns and morphs, with a gradient that flows through it. The mark itself is the loader.',
      take: 'Logo-as-loader. Our Logo ⇄ spark morph follows this.' },
    { name: 'Perplexity', pattern: 'Explicit search steps ("Searching", "Reading 8 sources") with the logo animating beside the current step.',
      take: 'The mark runs on the current step only, finished steps get a check.' },
    { name: 'Microsoft Copilot', pattern: 'The ribbon logo animates its own shapes when thinking and speaking, from small chips to full-screen.',
      take: 'Same logo motion scaled from chip to hero (Turn small / large).' },
    { name: 'Apple Intelligence / Siri', pattern: 'A soft multi-colour glow on the edge of the screen or field while it listens or works.',
      take: 'The halo behind the hero and the AI field edge glow, not a spinner.' },
    { name: 'Notion AI', pattern: 'A small character with ink/dot frames next to "Thinking…" inside the document.',
      take: 'Stepped frames read well at tiny sizes (Cascade).' },
  ];

  figma(node: string): string { return FIGMA + node; }

  ngOnInit(): void {
    this.tracker.trackPageView('ai-motion');
    this.stepTimer = setInterval(() => { if (this.running) this.stepIdx = (this.stepIdx + 1) % this.stepLabels.length; }, 2200);
  }

  ngOnDestroy(): void {
    clearInterval(this.stepTimer);
    this.tracker.destroyListeners();
  }
}
