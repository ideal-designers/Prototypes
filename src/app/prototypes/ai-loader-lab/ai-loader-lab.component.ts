import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DS_COMPONENTS } from '../../shared/ds';
import { SegmentItem } from '../../shared/ds/components/segment/segment.component';
import { TrackerService } from '../../services/tracker.service';
import { AiMarkComponent, AiMarkMode, AiMarkSkin } from '../ai-motion/ai-mark.component';

type Phase = 'idle' | 'thinking' | 'streaming' | 'done';
type VerbSet = 'vdr' | 'playful' | 'literal';

interface Experiment { id: string; name: string; note: string; }

const VERBS: Record<VerbSet, string[]> = {
  vdr: ['Reading the data room', 'Cross-checking clauses', 'Tracing permissions', 'Comparing SPA versions',
        'Counting bidder visits', 'Checking the DD index', 'Weighing sources', 'Drafting the answer'],
  playful: ['Pondering', 'Shuffling folders', 'Squinting at PDFs', 'Connecting dots', 'Brewing a brief',
            'Untangling clauses', 'Doing due diligence', 'Polishing'],
  literal: ['Picked the most relevant files', 'Reading SPA v4 and 2 more', 'Comparing revenue by quarter',
            'Checking who opened what', 'Writing the answer'],
};

const ANSWER = 'Revenue grew 18% in FY2025, to $412M. Most of it came from the EMEA renewals (+$38M) and the new mid-market tier (+$21M), partly offset by churn in APAC. Sources: Financials / FY2025 Annual Report p. 14, Board Minutes 2025-11.';

@Component({
  selector: 'fvdr-ai-loader-lab',
  standalone: true,
  imports: [CommonModule, RouterLink, ...DS_COMPONENTS, AiMarkComponent],
  template: `
  <div class="lab" [class.dark-theme]="theme === 'dark'">
    <header class="top">
      <div>
        <h1>AI loader lab</h1>
        <p class="sub">Experiments with thinking states, spinners and loaders in the spirit of Claude, built from the ideals. sphere and brand greens. Every control applies to every experiment.</p>
      </div>
      <a class="link" routerLink="/ai-motion">Motion system <fvdr-icon name="chevron-right"></fvdr-icon></a>
    </header>

    <!-- Controls -->
    <div class="ctrl">
      <div class="ctrl__g"><span class="ctrl__l">Mark</span>
        <fvdr-segment [items]="modeItems" [activeId]="mode" (activeIdChange)="mode = $any($event)"></fvdr-segment></div>
      <div class="ctrl__g"><span class="ctrl__l">Skin</span>
        <fvdr-segment [items]="skinItems" [activeId]="skin" (activeIdChange)="skin = $any($event)"></fvdr-segment></div>
      <div class="ctrl__g"><span class="ctrl__l">Speed</span>
        <fvdr-segment [items]="speedItems" [activeId]="speed + ''" (activeIdChange)="speed = +$event"></fvdr-segment></div>
      <div class="ctrl__g"><span class="ctrl__l">Verbs</span>
        <fvdr-segment [items]="verbItems" [activeId]="verbSet" (activeIdChange)="setVerbs($any($event))"></fvdr-segment></div>
      <div class="ctrl__g"><span class="ctrl__l">Theme</span>
        <fvdr-segment [items]="themeItems" [activeId]="theme" (activeIdChange)="theme = $any($event)"></fvdr-segment></div>
      <div class="ctrl__g ctrl__g--toggles">
        <fvdr-toggle label="Shimmer" [checked]="shimmer" (checkedChange)="shimmer = $event"></fvdr-toggle>
        <fvdr-toggle label="Timer" [checked]="timer" (checkedChange)="timer = $event"></fvdr-toggle>
      </div>
    </div>

    <!-- 1. Live run -->
    <section class="sec">
      <div class="sec__head">
        <h2>1 · A full answer, live</h2>
        <fvdr-btn [label]="phase === 'idle' || phase === 'done' ? 'Ask again' : 'Stop'" size="s"
                  [variant]="phase === 'idle' || phase === 'done' ? 'primary' : 'secondary'" (clicked)="toggleRun()"></fvdr-btn>
      </div>
      <div class="runs">
        <!-- Chat (claude.ai style) -->
        <div class="chat">
          <div class="chat__q">What was our revenue growth in FY2025 and what drove it?</div>
          <div class="chat__status" [class.chat__status--done]="phase === 'done' || phase === 'idle'">
            <ai-motion-mark [mode]="mode" [skin]="skin" [size]="18" [speed]="speed" [active]="phase === 'thinking' || phase === 'streaming'"></ai-motion-mark>
            <span class="verb" [class.shimmer]="shimmer && phase === 'thinking'">{{ statusText }}</span>
            <span class="meta" *ngIf="timer && busy">{{ elapsed }}s</span>
            <fvdr-icon name="chevron-right" class="dim" *ngIf="phase === 'done'"></fvdr-icon>
          </div>
          <p class="chat__a" *ngIf="streamed">{{ streamed }}<ai-motion-mark *ngIf="phase === 'streaming'" class="caret" mode="wave" [skin]="skin" [size]="11" [speed]="speed"></ai-motion-mark></p>
          <div class="composer">
            <span class="composer__ph">Ask about this project or describe a task</span>
            <button class="sendbtn" type="button" (click)="toggleRun()"
                    [attr.aria-label]="busy ? 'Stop generating' : 'Send'" [class.sendbtn--busy]="busy">
              <ai-motion-mark *ngIf="busy" mode="spin" skin="outline" [size]="20" [speed]="speed"></ai-motion-mark>
              <i class="sq" *ngIf="busy"></i>
              <fvdr-icon *ngIf="!busy" name="chevron-up"></fvdr-icon>
            </button>
          </div>
        </div>

        <!-- Terminal (Claude Code style) -->
        <div class="term" aria-label="Compact status, terminal style">
          <div class="term__line"><span class="term__p">&gt;</span> what was our revenue growth in FY2025?</div>
          <div class="term__line term__status" *ngIf="phase !== 'idle'">
            <ai-motion-mark [mode]="phase === 'done' ? 'static' : 'cascade'" [skin]="skin" [size]="13" [speed]="speed" [active]="busy"></ai-motion-mark>
            <span [class.shimmer]="shimmer && busy" class="term__verb">{{ busy ? verb + '…' : 'Done' }}</span>
            <span class="term__meta">({{ elapsed }}s · ↓ {{ tokens }} tokens{{ busy ? ' · esc to interrupt' : '' }})</span>
          </div>
          <div class="term__line term__dim" *ngIf="phase === 'done'">⎿ Answer ready · 3 sources</div>
        </div>
      </div>
    </section>

    <!-- 2. Experiments grid -->
    <section class="sec">
      <div class="sec__head"><h2>2 · Spinner &amp; loader experiments</h2></div>
      <div class="grid">
        <article class="exp" *ngFor="let e of experiments">
          <div class="exp__stage" [ngSwitch]="e.id">

            <ai-motion-mark *ngSwitchCase="'current'" [mode]="mode" [skin]="skin" [size]="48" [speed]="speed"></ai-motion-mark>

            <span *ngSwitchCase="'glyph'" class="glyph">
              <ai-motion-mark mode="cascade" [skin]="skin" [size]="20" [speed]="speed"></ai-motion-mark>
              <span [class.shimmer]="shimmer" class="verb">{{ verb }}…</span>
            </span>

            <ai-motion-mark *ngSwitchCase="'morph'" mode="morph" [skin]="skin" [size]="48" [speed]="speed"></ai-motion-mark>
            <ai-motion-mark *ngSwitchCase="'flow'" mode="flow" [skin]="skin" [size]="48" [speed]="speed"></ai-motion-mark>
            <ai-motion-mark *ngSwitchCase="'orbit'" mode="orbit" skin="outline" [size]="48" [speed]="speed"></ai-motion-mark>
            <ai-motion-mark *ngSwitchCase="'iris'" mode="orbit" skin="iris" [size]="56" [speed]="speed * 0.6"></ai-motion-mark>
            <ai-motion-mark *ngSwitchCase="'sonar'" mode="sonar" [skin]="skin" [size]="36" [speed]="speed"></ai-motion-mark>

            <span *ngSwitchCase="'dots'" class="dots" [style.--sp]="speed">
              <i></i><i></i><i></i>
            </span>

            <span *ngSwitchCase="'progress'" class="prog">
              <svg viewBox="0 0 48 48" class="prog__ring" aria-hidden="true">
                <circle cx="24" cy="24" r="21" class="prog__track"></circle>
                <circle cx="24" cy="24" r="21" class="prog__val" pathLength="100" [style.stroke-dashoffset]="100 - progress"></circle>
              </svg>
              <ai-motion-mark mode="static" [skin]="skin" [size]="30"></ai-motion-mark>
              <span class="prog__pct">{{ progress }}%</span>
            </span>

            <span *ngSwitchCase="'comet'" class="comet" [style.--sp]="speed">
              <ai-motion-mark mode="wave" [skin]="skin" [size]="40" [speed]="speed"></ai-motion-mark>
              <i class="comet__sat"></i>
            </span>

            <span *ngSwitchCase="'shimmer'" class="big-shimmer shimmer">{{ verb }}…</span>

            <span *ngSwitchCase="'skeleton'" class="skel">
              <span class="skel__head"><ai-motion-mark mode="turn" [skin]="skin" [size]="16" [speed]="speed"></ai-motion-mark><i></i></span>
              <i></i><i></i><i class="short"></i>
            </span>

            <span *ngSwitchCase="'pill'" class="pill">
              <ai-motion-mark [mode]="mode" [skin]="skin" [size]="16" [speed]="speed"></ai-motion-mark>
              <span [class.shimmer]="shimmer">Catching you up…</span>
            </span>

            <span *ngSwitchCase="'edge'" class="edge">
              <span class="edge__field">Ask about this room…</span>
            </span>
          </div>
          <div class="exp__body">
            <b>{{ e.name }}</b>
            <p>{{ e.note }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- 3. Sizes -->
    <section class="sec">
      <div class="sec__head"><h2>3 · Current mark at every size</h2></div>
      <div class="sizes">
        <div class="size" *ngFor="let s of sizes">
          <ai-motion-mark [mode]="mode" [skin]="skin" [size]="s" [speed]="speed" [glow]="s >= 64"></ai-motion-mark>
          <span class="mono">{{ s }}px</span>
        </div>
      </div>
    </section>
  </div>
  `,
  styles: [`
    :host { display: block; }
    .lab { min-height: 100vh; background: var(--color-stone-0); color: var(--color-text-primary); font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); padding: var(--space-8) var(--space-10) var(--space-12); }
    @media (max-width: 767px) { .lab { padding: var(--space-6) var(--space-4) var(--space-10); } }
    h1 { margin: 0; font-size: var(--font-size-4xl, 24px); font-weight: var(--font-weight-bold, 700); line-height: 32px; }
    h2 { margin: 0; font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: 24px; }
    p { margin: 0; line-height: 20px; }
    a { color: var(--color-primary-500); text-decoration: none; }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); font-weight: var(--font-weight-semi, 600); }
    .dim { color: var(--color-text-placeholder); }
    .mono { font-family: var(--font-family-mono); font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }

    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-6); flex-wrap: wrap; }
    .sub { color: var(--color-text-secondary); margin-top: var(--space-1); max-width: 720px; }

    .ctrl { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-6); align-items: center;
      padding: var(--space-4) 0; margin-top: var(--space-4); background: var(--color-stone-0); border-bottom: 1px solid var(--color-divider); }
    .ctrl__g { display: flex; align-items: center; gap: var(--space-2); }
    .ctrl__g--toggles { gap: var(--space-5); }
    .ctrl__l { font-size: var(--font-size-xs, 12px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-secondary); }

    .sec { padding: var(--space-8) 0; border-bottom: 1px solid var(--color-divider); }
    .sec:last-child { border-bottom: none; }
    .sec__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-5); }

    .shimmer { background: linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-secondary) 40%,
        var(--ai-mark-shimmer) 50%, var(--color-text-secondary) 60%, var(--color-text-secondary) 100%);
      background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: shimmer 2s linear infinite; }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -150% 0; } }

    .runs { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: var(--space-6); }
    @media (max-width: 1023px) { .runs { grid-template-columns: 1fr; } }
    .chat { display: flex; flex-direction: column; gap: var(--space-4); min-height: 300px; padding: var(--space-5);
      border-radius: var(--radius-lg); background: var(--color-stone-100); }
    .chat__q { align-self: flex-end; max-width: 80%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-lg);
      background: var(--color-stone-300); }
    .chat__status { display: flex; align-items: center; gap: var(--space-2); min-height: 24px; }
    .verb { color: var(--color-text-secondary); }
    .chat__status--done .verb { color: var(--color-text-secondary); }
    .meta { color: var(--color-text-placeholder); font-size: var(--font-size-xs, 12px); font-variant-numeric: tabular-nums; }
    .chat__a { line-height: 22px; animation: fade-in 0.3s ease; }
    .caret { margin-left: 3px; vertical-align: -1px; }
    @keyframes fade-in { from { opacity: 0; } }
    .composer { margin-top: auto; display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-1) var(--space-1) var(--space-3);
      border-radius: var(--radius-md); background: var(--color-stone-0); box-shadow: inset 0 0 0 1px var(--color-stone-400); }
    .composer__ph { flex: 1; color: var(--color-text-placeholder); }
    .sendbtn { position: relative; width: 32px; height: 32px; border: none; border-radius: var(--radius-sm); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary-500); color: var(--color-stone-0); }
    .sendbtn--busy { background: transparent; color: var(--color-text-primary); }
    .sendbtn--busy:hover { background: var(--color-hover-bg); }
    .sq { position: absolute; width: 8px; height: 8px; border-radius: 1px; background: var(--color-text-primary); }

    .term { padding: var(--space-5); border-radius: var(--radius-lg); background: var(--color-stone-1000); color: var(--color-stone-0);
      font-family: var(--font-family-mono); font-size: var(--font-size-sm, 13px); line-height: 22px; display: flex; flex-direction: column; gap: var(--space-2); }
    .dark-theme .term { background: var(--color-stone-100); color: var(--color-text-primary); }
    .term__p { color: var(--ai-mark-low-3); }
    .term__status { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .term__verb { color: var(--ai-mark-low-2); }
    .term__verb.shimmer { background-image: linear-gradient(90deg, var(--ai-mark-low-1) 0%, var(--ai-mark-low-1) 40%,
        var(--color-stone-0) 50%, var(--ai-mark-low-1) 60%, var(--ai-mark-low-1) 100%); }
    .term__meta, .term__dim { color: var(--color-stone-600); }
    .dark-theme .term__verb.shimmer { background-image: linear-gradient(90deg, var(--ai-mark-low-1) 0%, var(--ai-mark-low-1) 40%,
        var(--color-text-primary) 50%, var(--ai-mark-low-1) 60%, var(--ai-mark-low-1) 100%); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-6) var(--space-5); }
    .exp { display: flex; flex-direction: column; gap: var(--space-3); }
    .exp__stage { height: 150px; border-radius: var(--radius-md); background: var(--color-stone-100); display: flex;
      align-items: center; justify-content: center; overflow: hidden; padding: var(--space-4); }
    .exp__body b { display: block; margin-bottom: 2px; }
    .exp__body p { color: var(--color-text-secondary); font-size: var(--font-size-sm, 13px); }

    .glyph, .pill { display: inline-flex; align-items: center; gap: var(--space-2); }
    .pill { padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); background: var(--color-stone-0);
      box-shadow: var(--shadow-popover); }
    .big-shimmer { font-size: var(--font-size-2xl, 20px); font-weight: var(--font-weight-semi, 600); }

    /* Three balls = the logo's three inner layers, hopping in turn */
    .dots { display: inline-flex; gap: var(--space-2); align-items: flex-end; height: 32px; }
    .dots i { width: 12px; height: 12px; border-radius: 50%; animation: hop calc(1.1s / var(--sp, 1)) ease-in-out infinite; }
    .dots i:nth-child(1) { background: linear-gradient(var(--ai-mark-top), var(--ai-mark-low-1)); }
    .dots i:nth-child(2) { background: linear-gradient(var(--ai-mark-top), var(--ai-mark-low-2)); animation-delay: calc(0.15s / var(--sp, 1)); }
    .dots i:nth-child(3) { background: linear-gradient(var(--ai-mark-top), var(--ai-mark-low-3)); animation-delay: calc(0.3s / var(--sp, 1)); }
    @keyframes hop { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-12px); } }

    .prog { position: relative; width: 72px; height: 72px; display: inline-flex; align-items: center; justify-content: center; }
    .prog__ring { position: absolute; inset: 0; transform: rotate(-90deg); }
    .prog__track { fill: none; stroke: var(--color-stone-300); stroke-width: 3; }
    .prog__val { fill: none; stroke: var(--ai-mark-line); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 100;
      transition: stroke-dashoffset 0.4s ease; }
    .prog__pct { position: absolute; bottom: -20px; font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary);
      font-variant-numeric: tabular-nums; }

    .comet { position: relative; width: 72px; height: 72px; display: inline-flex; align-items: center; justify-content: center; }
    .comet__sat { position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; margin: -4px; border-radius: 50%;
      background: var(--ai-mark-low-3); box-shadow: 0 0 8px var(--ai-mark-glow);
      animation: sat calc(1.6s / var(--sp, 1)) linear infinite; }
    @keyframes sat { from { transform: rotate(0deg) translateX(32px); } to { transform: rotate(360deg) translateX(32px); } }

    .skel { width: 100%; display: flex; flex-direction: column; gap: var(--space-2); }
    .skel__head { display: flex; align-items: center; gap: var(--space-2); }
    .skel i { display: block; height: 10px; border-radius: var(--radius-sm); position: relative; overflow: hidden; background: var(--color-stone-300); flex: 1; }
    .skel i.short { width: 55%; flex: none; }
    .skel i::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, var(--ai-mark-glow), transparent); animation: skel 1.4s ease-in-out infinite; }
    @keyframes skel { to { transform: translateX(100%); } }

    .edge { width: 100%; padding: 1.5px; border-radius: var(--radius-md); background: var(--ai-edge); background-size: 300% 100%;
      animation: edge 3s linear infinite; }
    .edge__field { display: block; padding: var(--space-3); border-radius: calc(var(--radius-md) - 1px); background: var(--color-stone-0);
      color: var(--color-text-placeholder); }
    @keyframes edge { to { background-position: -300% 0; } }

    .sizes { display: flex; align-items: flex-end; gap: var(--space-10); flex-wrap: wrap; }
    .size { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

    @media (prefers-reduced-motion: reduce) {
      .shimmer, .dots i, .comet__sat, .skel i::after, .edge { animation: none; }
      .shimmer { color: var(--color-text-secondary); background: none; }
    }
  `],
})
export class AiLoaderLabComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  mode: AiMarkMode = 'turn';
  skin: AiMarkSkin = 'brand';
  speed = 1;
  theme: 'light' | 'dark' = 'light';
  verbSet: VerbSet = 'vdr';
  shimmer = true;
  timer = true;

  phase: Phase = 'idle';
  verb = VERBS.vdr[0];
  streamed = '';
  elapsed = 0;
  tokens = '0';
  progress = 0;
  private verbIdx = 0;
  private t0 = 0;
  private timers: ReturnType<typeof setInterval>[] = [];
  private runTimers: ReturnType<typeof setTimeout | typeof setInterval>[] = [];

  readonly sizes = [12, 14, 16, 20, 24, 32, 48, 64, 120];
  readonly modeItems: SegmentItem[] = [
    { id: 'turn', label: 'Turn' }, { id: 'morph', label: 'Spark' }, { id: 'flow', label: 'Flow' }, { id: 'cascade', label: 'Cascade' },
    { id: 'wave', label: 'Wave' }, { id: 'orbit', label: 'Orbit' }, { id: 'liquid', label: 'Liquid' }, { id: 'spin', label: 'Ring' },
  ];
  readonly skinItems: SegmentItem[] = [{ id: 'brand', label: 'Brand' }, { id: 'outline', label: 'Outline' }, { id: 'iris', label: 'Iris' }, { id: 'mono', label: 'Mono' }];
  readonly speedItems: SegmentItem[] = [{ id: '0.5', label: '0.5×' }, { id: '1', label: '1×' }, { id: '1.5', label: '1.5×' }, { id: '2', label: '2×' }];
  readonly verbItems: SegmentItem[] = [{ id: 'vdr', label: 'Data room' }, { id: 'playful', label: 'Playful' }, { id: 'literal', label: 'Steps' }];
  readonly themeItems: SegmentItem[] = [{ id: 'light', icon: 'theme-light' }, { id: 'dark', icon: 'theme-dark' }];

  readonly experiments: Experiment[] = [
    { id: 'current', name: 'Selected mark', note: 'Whatever is picked above, large, so you can judge the motion itself.' },
    { id: 'glyph', name: 'Glyph + verb', note: 'Claude\'s pattern: stepped mark frames, a rotating verb and a shimmer. Verbs come from the set above.' },
    { id: 'morph', name: 'Logo ⇄ spark', note: 'The sphere folds into the four-point spark and back. Our answer to Gemini\'s living logo.' },
    { id: 'flow', name: 'Endless flow', note: 'Layers keep shrinking into the left edge. No loop point, so it suits long jobs.' },
    { id: 'orbit', name: 'Outline orbit', note: 'Single colour, so it fits inside buttons, chips and dark surfaces.' },
    { id: 'iris', name: 'Iridescent', note: 'The AI field edge palette turning behind white contours. For brand moments only.' },
    { id: 'sonar', name: 'Sonar', note: 'Rings ripple out from a resting logo while we wait on something external, like indexing.' },
    { id: 'dots', name: 'Layer dots', note: 'The three inner layers as typing dots. A familiar chat read in brand colour.' },
    { id: 'progress', name: 'Determinate ring', note: 'When we know how far along we are (report 3 of 5), the ring fills instead of spinning.' },
    { id: 'comet', name: 'Satellite', note: 'A breathing mark with one layer escaped into orbit. Playful and readable at 24px+.' },
    { id: 'shimmer', name: 'Shimmer only', note: 'No icon at all, like ChatGPT\'s "Thinking". Quietest for dense UI.' },
    { id: 'skeleton', name: 'Branded skeleton', note: 'Green-tinted shimmer on placeholders while a brief or table assembles.' },
    { id: 'pill', name: 'Floating pill', note: 'Status chip for background work you can leave: "Catching you up…" on Home.' },
    { id: 'edge', name: 'Living field edge', note: 'The AI input\'s gradient hairline flowing while it works, Apple Intelligence style.' },
  ];

  get busy(): boolean { return this.phase === 'thinking' || this.phase === 'streaming'; }
  get statusText(): string {
    switch (this.phase) {
      case 'thinking': return this.verb + '…';
      case 'streaming': return 'Writing the answer…';
      case 'done': return `Analysed 3 files · ${this.verbIdx + 1} steps · ${this.elapsed} s`;
      default: return 'Ready';
    }
  }

  ngOnInit(): void {
    this.tracker.trackPageView('ai-loader-lab');
    // Grid experiments run forever: rotate their verb and nudge the determinate ring.
    this.timers.push(setInterval(() => { if (!this.busy) this.nextVerb(); }, 2400));
    this.timers.push(setInterval(() => { this.progress = this.progress >= 100 ? 0 : this.progress + 4; }, 240));
    setTimeout(() => this.run(), 600);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearInterval);
    this.clearRun();
    this.tracker.destroyListeners();
  }

  setVerbs(s: VerbSet): void { this.verbSet = s; this.verbIdx = 0; this.verb = VERBS[s][0]; }

  toggleRun(): void {
    if (this.busy) { this.finish(); this.tracker.trackTask('ai-loader-lab', 'task_fail'); }
    else { this.run(); }
  }

  private nextVerb(): void {
    const list = VERBS[this.verbSet];
    this.verbIdx = (this.verbIdx + 1) % list.length;
    this.verb = list[this.verbIdx];
  }

  private run(): void {
    this.clearRun();
    this.phase = 'thinking';
    this.streamed = '';
    this.verbIdx = 0;
    this.verb = VERBS[this.verbSet][0];
    this.t0 = Date.now();
    this.elapsed = 0;
    let tok = 0;
    this.runTimers.push(setInterval(() => {
      this.elapsed = Math.round((Date.now() - this.t0) / 1000);
      tok += Math.round(40 + Math.random() * 90);
      this.tokens = tok >= 1000 ? (tok / 1000).toFixed(1) + 'k' : String(tok);
    }, 200));
    this.runTimers.push(setInterval(() => { if (this.phase === 'thinking') this.nextVerb(); }, 1700));
    this.runTimers.push(setTimeout(() => this.stream(), 6200));
  }

  private stream(): void {
    this.phase = 'streaming';
    const words = ANSWER.split(' ');
    let i = 0;
    this.runTimers.push(setInterval(() => {
      i += 1 + Math.floor(Math.random() * 2);
      this.streamed = words.slice(0, i).join(' ');
      if (i >= words.length) { this.finish(); this.tracker.trackTask('ai-loader-lab', 'task_complete'); }
    }, 90));
  }

  private finish(): void {
    this.clearRun();
    this.phase = 'done';
    this.elapsed = Math.max(1, Math.round((Date.now() - this.t0) / 1000));
  }

  private clearRun(): void {
    this.runTimers.forEach(t => { clearInterval(t as ReturnType<typeof setInterval>); clearTimeout(t as ReturnType<typeof setTimeout>); });
    this.runTimers = [];
  }
}
