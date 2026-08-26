import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * MetalForge "thinking-orbs / twinkle" preset, ported from the designer's source
 * (see .design/thinking-orbs-reference.md). Rasterised with Canvas 2D instead of
 * their WebGPU path — the dot generation below is their maths, unchanged.
 */
const TAU    = Math.PI * 2;
const PERIOD = 4.6;      // style index 2 (twinkle)
const TILT   = 0.36;     // fixed tilt inside the draw, on top of the pitch knob

/** Preset knobs — `effect=thinking-orbs style=twinkle` from the designer's URL. */
const KNOBS = {
  n:  2.6,                        // dots  → NC(150, 2.6) = 390
  sp: 1,                          // spread
  pv: 3.2,                        // perspective → f = 3.5 * pv
  dz: 1,                          // depth → dot radius
  df: 1,                          // depth → alpha
  op: 1,                          // dot opacity
  sn: -3,                         // spin, extra yaw turns per period
  yw: (-169 * Math.PI) / 180,     // yaw
  pc: (-15 * Math.PI) / 180,      // pitch
};

const MAX_DT = 0.1;   // clamp the first frame after a tab-away

interface Sphere { x: Float64Array; y: Float64Array; z: Float64Array; phase: Float64Array; }

/** Fibonacci sphere + golden-ratio phase — deterministic, so it is built once per count. */
const SPHERES = new Map<number, Sphere>();
function buildSphere(count: number): Sphere {
  const cached = SPHERES.get(count);
  if (cached) return cached;

  const s: Sphere = {
    x: new Float64Array(count), y: new Float64Array(count),
    z: new Float64Array(count), phase: new Float64Array(count),
  };
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963;                    // golden angle
    s.x[i] = Math.cos(th) * r;
    s.y[i] = y;
    s.z[i] = Math.sin(th) * r;
    s.phase[i] = (i * 0.61803398875) % 1;       // h1(i)
  }
  SPHERES.set(count, s);
  return s;
}

/** Fit-to-box factors are 20 full draws each — cache by box size + dot count. */
const FIT_CACHE = new Map<string, number>();

/** Their size ramp: a 46px orb draws much smaller dots than a 340px one. */
function sizeDotScale(s: number): number {
  if (s <= 46)  return 0.4;
  if (s <= 190) return 0.4 + ((s - 46) / 144) * 0.6;
  if (s <= 340) return 1 + ((s - 190) / 150) * 0.55;
  return 1.55;
}

/** Phase 0..1 through one period. */
function orbPhase(seconds: number, speed: number): number {
  const span = PERIOD / Math.max(0.0001, speed);
  const u = (Math.max(0, seconds) % span) / span;
  return u < 0 ? u + 1 : u;
}

/**
 * fvdr-thinking-orbs — waiting indicator for a streaming / thinking state.
 *
 * Dots spread over a sphere by a golden-angle spiral (390 at the preset's
 * density) rotate in 3D behind a
 * pill carrying the label. Every frame runs two composed rotations (the draw's
 * own turn plus the yaw/spin knobs), a perspective divide, and a depth term
 * that drives both dot radius and alpha, then paints back-to-front. The
 * "twinkle" is a per-dot golden-ratio phase raised to the 6th power, so each
 * dot blinks sharply and the surface shimmers instead of pulsing in unison.
 *
 * Canvas, not CSS 3D: `preserve-3d` cannot scale or fade by depth, and depth is
 * the whole character of the effect.
 *
 * The loop stops when `running` is false, on destroy, and under
 * `prefers-reduced-motion: reduce` (one static frame is drawn instead) — a chat
 * mounts and unmounts these constantly, so no frame may leak.
 *
 * Usage:
 *   <fvdr-thinking-orbs label="Thinking…" [running]="streaming" />
 *   <fvdr-thinking-orbs [showPill]="false" [showLabel]="false" [size]="24" />
 *   <fvdr-thinking-orbs [size]="28" [dots]="0.8" />   thinner field for a small orb
 */
@Component({
  selector: 'fvdr-thinking-orbs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'role': 'status', '[attr.aria-live]': "'polite'", '[attr.aria-label]': 'label' },
  template: `
    <div class="orbs" [class.orbs--pill]="showPill" [class.orbs--labelled]="showLabel">
      <canvas
        #canvas
        class="orbs__canvas"
        aria-hidden="true"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.color]="dotColor"
      ></canvas>
      <span class="orbs__label" *ngIf="showLabel">{{ label }}</span>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; max-width: 100%; font-family: var(--font-family); }

    .orbs {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }
    /* Preset pill: 7px block padding, 8 left / 22 right with a label, 7 all round
       without. Snapped to the FVDR 4px scale. */
    .orbs--pill {
      padding: var(--space-2);
      background: var(--color-stone-300);
      border-radius: var(--radius-full);
    }
    .orbs--pill.orbs--labelled { padding-right: var(--space-5); }

    .orbs__canvas { display: block; flex: none; }

    .orbs__label {
      min-width: 0;
      font-size: var(--font-size-base, 14px);
      line-height: var(--line-height-base, 20px);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class ThinkingOrbsComponent implements AfterViewInit, OnDestroy {
  /** Text inside the pill. */
  @Input() label = 'Thinking…';
  @Input() showLabel = true;
  @Input() showPill = true;
  /** Orb box in CSS pixels — 46 is the preset's own size. */
  @Input() size = 46;
  /** Any CSS colour; resolved through the element, so `var(--token)` works. */
  @Input() dotColor = 'var(--color-primary-500)';

  /**
   * Dot-count multiplier — the preset's `n` knob: `round(150 * dots)`, so 2.6
   * gives the preset's 390. Below ~40px the dots merge into a blob, so thin the
   * field out rather than shrinking it further.
   */
  @Input()
  get dots(): number { return this._dots; }
  set dots(value: number) {
    this._dots = value;
    this.count = Math.max(1, Math.round(150 * value));
    this.sphere = buildSphere(this.count);
    this.allocate();
    if (this.ready && !this.rafId) this.render();
  }
  private _dots = KNOBS.n;

  /** Host switch — false stops the loop and leaves the last frame on screen. */
  @Input()
  get running(): boolean { return this._running; }
  set running(value: boolean) {
    this._running = value;
    if (!this.ready) return;
    value ? this.start() : this.stop();
  }
  private _running = true;

  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private ctx: CanvasRenderingContext2D | null = null;
  private ready = false;
  private rafId = 0;
  private lastNow = 0;
  private seconds = 0;
  private dpr = 1;
  private fill = '';
  private colorDirty = true;
  private frame = 0;
  private themeObserver?: MutationObserver;
  private sizeObserver?: ResizeObserver;
  private reduceMotion?: MediaQueryList;

  private count = Math.max(1, Math.round(150 * KNOBS.n));   // 390 at the preset
  private sphere = buildSphere(this.count);

  /** Projected dots for one frame — preallocated so the loop never allocates. */
  private px = new Float64Array(this.count);
  private py = new Float64Array(this.count);
  private pr = new Float64Array(this.count);
  private pa = new Float64Array(this.count);
  private pz = new Float64Array(this.count);
  private order = new Uint16Array(this.count);

  private allocate(): void {
    if (this.px.length === this.count) return;
    this.px = new Float64Array(this.count);
    this.py = new Float64Array(this.count);
    this.pr = new Float64Array(this.count);
    this.pa = new Float64Array(this.count);
    this.pz = new Float64Array(this.count);
    this.order = new Uint16Array(this.count);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!this.ctx) return;
    this.ready = true;

    // Every observer lives outside Angular: zone.js patches them, and a callback
    // that ticks change detection on each class mutation loops with the renderer.
    this.zone.runOutsideAngular(() => {
      // Theme lives on an ancestor class (.dark-theme), so watch class changes and
      // re-resolve the colour lazily — the callback only flips a flag.
      this.themeObserver = new MutationObserver(this.onThemeChange);
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
        subtree: true,
      });

      // Re-read devicePixelRatio and the CSS box whenever the canvas is resized.
      this.sizeObserver = new ResizeObserver(() => { this.syncSize(); if (!this.rafId) this.render(); });
      this.sizeObserver.observe(this.canvasRef.nativeElement);

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reduceMotion.addEventListener('change', this.onMotionPreferenceChange);
    });

    this.syncSize();
    this._running ? this.start() : this.render();
  }

  ngOnDestroy(): void {
    this.stop();
    this.themeObserver?.disconnect();
    this.sizeObserver?.disconnect();
    this.reduceMotion?.removeEventListener('change', this.onMotionPreferenceChange);
  }

  // ── Loop ───────────────────────────────────────────────────────────────────

  private start(): void {
    if (this.rafId || !this.ready) return;

    // Reduced motion: one static frame, and the loop never starts.
    if (this.reduceMotion?.matches) { this.render(); return; }

    this.lastNow = 0;
    this.zone.runOutsideAngular(() => { this.rafId = requestAnimationFrame(this.tick); });
  }

  private stop(): void {
    if (!this.rafId) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private tick = (now: number): void => {
    this.seconds += this.lastNow ? Math.min((now - this.lastNow) / 1000, MAX_DT) : 0;
    this.lastNow = now;

    // Cheap safety net for a DPR change that resizes nothing (window moved to
    // another display) — once every ~30 frames, not every frame.
    if (++this.frame % 30 === 0 && this.dpr !== (window.devicePixelRatio || 1)) this.syncSize();

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private onThemeChange = (): void => {
    this.colorDirty = true;
    if (!this.rafId) this.render();
  };

  private onMotionPreferenceChange = (): void => {
    this.stop();
    this._running ? this.start() : this.render();
  };

  // ── Canvas ─────────────────────────────────────────────────────────────────

  /** Back the canvas with a devicePixelRatio-sized buffer so dots stay crisp. */
  private syncSize(): void {
    const el = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, el.clientWidth || this.size);
    const h = Math.max(1, el.clientHeight || this.size);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);

    this.dpr = dpr;
    if (el.width !== bw || el.height !== bh) { el.width = bw; el.height = bh; }
  }

  /** One frame: project the sphere at the current phase, then paint it. */
  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const el = ctx.canvas;
    const s = el.width / this.dpr;            // the box is square; S = its side

    if (this.colorDirty) {
      this.fill = getComputedStyle(el).color;
      this.colorDirty = false;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, s, el.height / this.dpr);
    ctx.fillStyle = this.fill;

    // Resolve the fit first: it probes 20 frames through the same buffers.
    const fit = this.fitFactor(s);
    this.project(orbPhase(this.seconds, 1), s, sizeDotScale(s));

    const half = s / 2;
    const pz = this.pz;
    for (let i = 0; i < this.count; i++) this.order[i] = i;
    // Painter's algorithm — back to front, so near dots paint over far ones.
    const order = this.order.sort((a, b) => pz[a] - pz[b]);

    for (let k = 0; k < this.count; k++) {
      const i = order[k];
      const fr = this.pr[i] * (0.55 + 0.45 * fit);
      const fa = this.pa[i] * KNOBS.op;
      if (fr <= 0.05 || fa <= 0.004) continue;
      ctx.globalAlpha = fa > 1 ? 1 : fa;
      ctx.beginPath();
      ctx.arc(half + (this.px[i] - half) * fit, half + (this.py[i] - half) * fit, fr, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * drawTwinkle + P3 from the reference, fused into the preallocated buffers.
   * Per-frame trigonometry is hoisted out of the dot loop; the maths is theirs.
   */
  private project(t: number, s: number, ds: number): void {
    // Rotation 1 — the draw's own turn (TAU * t) at a fixed 0.36 rad tilt.
    const ca1 = Math.cos(TAU * t), sa1 = Math.sin(TAU * t);
    const cb1 = Math.cos(TILT),    sb1 = Math.sin(TILT);
    // Rotation 2 — VIEW: the yaw knob plus the accumulating spin, then pitch.
    const ay2 = KNOBS.yw + TAU * KNOBS.sn * t;
    const ca2 = Math.cos(ay2),     sa2 = Math.sin(ay2);
    const cb2 = Math.cos(KNOBS.pc), sb2 = Math.sin(KNOBS.pc);

    const c = s / 2;
    const r = s * 0.3 * KNOBS.sp;
    const f = 3.5 * KNOBS.pv;
    const fade = 1.55 * KNOBS.df;
    const twinklePhase = TAU * 2 * t;         // two blinks per turn
    const bx = this.sphere.x, by = this.sphere.y, bz = this.sphere.z, ph = this.sphere.phase;

    for (let i = 0; i < this.count; i++) {
      // Sharp blink: ^6 keeps each dot dark most of its cycle.
      const u = 0.5 + 0.5 * Math.sin(twinklePhase + TAU * ph[i]);
      const u2 = u * u;
      const b = u2 * u2 * u2;

      let x = bx[i], y = by[i], z = bz[i];

      let nx = x * ca1 - z * sa1;
      let nz = x * sa1 + z * ca1;
      let ny = y * cb1 - nz * sb1;
      nz = y * sb1 + nz * cb1;

      x = nx * ca2 - nz * sa2;
      z = nx * sa2 + nz * ca2;
      y = ny * cb2 - z * sb2;
      z = ny * sb2 + z * cb2;

      const per = f / (f - z);
      const d = z < -1.1 ? 0 : z > 1.1 ? 1 : (z + 1.1) / 2.2;

      this.px[i] = c + x * r * per;
      this.py[i] = c + y * r * per;
      this.pr[i] = ds * (0.4 + 1.6 * KNOBS.dz * d) * per * (0.55 + 1.5 * b);
      this.pa[i] = (0.07 + 0.93 * Math.pow(d, fade)) * (0.2 + 0.8 * b);
      this.pz[i] = z;
    }
  }

  /**
   * Probe 20 evenly spaced frames for the widest extent and scale so the orb
   * never clips. Cached by box size — the knobs are fixed by the preset.
   */
  private fitFactor(s: number): number {
    const key = `${s}|${this.count}`;
    const cached = FIT_CACHE.get(key);
    if (cached !== undefined) return cached;

    const half = s / 2;
    let ext = 0;
    for (let k = 0; k < 20; k++) {
      this.project(k / 20, s, 1);
      for (let i = 0; i < this.count; i++) {
        if (this.pa[i] <= 0.05 || this.pr[i] <= 0.15) continue;
        ext = Math.max(ext, Math.abs(this.px[i] - half) + this.pr[i] * 0.5,
                            Math.abs(this.py[i] - half) + this.pr[i] * 0.5);
      }
    }
    const fit = ext > 1 ? Math.max(0.55, Math.min(1.7, (s * 0.415) / ext)) : 1;
    FIT_CACHE.set(key, fit);
    return fit;
  }
}
