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
 * MetalForge "thinking-orbs" presets, ported from the designer's source
 * (see .design/thinking-orbs-reference.md). Rasterised with Canvas 2D instead of
 * their WebGPU path — the dot generation below is their maths, unchanged.
 *
 *   vortex  (loop 3, default) — every dot slides up its meridian to the north pole,
 *           fading out at the top and re-entering at the bottom, while the ball
 *           spins the other way. The designer's pick for every AI "thinking" state.
 *   twinkle (loop 2) — a turning ball whose dots blink on private clocks.
 */
const TAU  = Math.PI * 2;
const TILT = 0.36;       // fixed tilt inside every draw, on top of the pitch knob

export type ThinkingOrbsVariant = 'vortex' | 'twinkle';

interface Preset {
  period: number;        // seconds per loop at speed 1
  speed: number;
  dotScale: number;      // multiplier on the size ramp
  n: number; sp: number; pv: number; dz: number; df: number; op: number;
  sn: number; yw: number; pc: number;
}

const PRESETS: Record<ThinkingOrbsVariant, Preset> = {
  // `ThinkingOrbsPill` defaults from the designer's hand-off.
  vortex:  { period: 4.4, speed: 0.95, dotScale: 1.55, n: 1.35, sp: 0.82, pv: 1,   dz: 1.1, df: 1, op: 1, sn: 0,  yw: 0,                   pc: 0 },
  // `effect=thinking-orbs style=twinkle` from the designer's URL.
  twinkle: { period: 4.6, speed: 1,    dotScale: 1,    n: 2.6,  sp: 1,    pv: 3.2, dz: 1,   df: 1, op: 1, sn: -3, yw: (-169 * Math.PI) / 180, pc: (-15 * Math.PI) / 180 },
};

const MAX_DT = 0.1;   // clamp the first frame after a tab-away
const MAX_DPR = 2;   // the designer caps the backing store at 2x

/** Per-dot seeds. `x/y/z` — Fibonacci sphere (twinkle); `h1/h2` — golden-ratio
 *  hashes (vortex: meridian phase and azimuth). Deterministic, built once per count. */
interface Sphere { x: Float64Array; y: Float64Array; z: Float64Array; h1: Float64Array; h2: Float64Array; }

const SPHERES = new Map<number, Sphere>();
function buildSphere(count: number): Sphere {
  const cached = SPHERES.get(count);
  if (cached) return cached;

  const s: Sphere = {
    x: new Float64Array(count), y: new Float64Array(count), z: new Float64Array(count),
    h1: new Float64Array(count), h2: new Float64Array(count),
  };
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963;                    // golden angle
    s.x[i] = Math.cos(th) * r;
    s.y[i] = y;
    s.z[i] = Math.sin(th) * r;
    s.h1[i] = (i * 0.61803398875) % 1;
    s.h2[i] = (i * 0.7548776662) % 1;
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
function orbPhase(seconds: number, period: number, speed: number): number {
  const span = period / Math.max(0.0001, speed);
  const u = (Math.max(0, seconds) % span) / span;
  return u < 0 ? u + 1 : u;
}

/**
 * fvdr-thinking-orbs — waiting indicator for a streaming / thinking state.
 *
 * Default preset "vortex": ~200 dots flow up their meridians to the north pole,
 * fading at both poles (sin^0.4), while the whole ball turns the other way at a
 * 0.36 rad tilt. Every frame runs the draw's rotation plus the view knobs, a
 * perspective divide, and a depth term that drives both dot radius and alpha,
 * then paints back-to-front. `variant="twinkle"` keeps the earlier blinking ball.
 * Pill, dot and label ink come from --ai-orb-* tokens (white pill + #3BAE5B dots
 * in light, black pill + #3DFF74 dots in dark); the label is monospace at 74%.
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
 *   <fvdr-thinking-orbs variant="twinkle" />            the earlier blinking preset
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
      background: var(--ai-orb-pill, #FFFFFF);
      border-radius: var(--radius-full);
    }
    .orbs--pill.orbs--labelled { padding-right: var(--space-5); }

    .orbs__canvas { display: block; flex: none; }

    .orbs__label {
      min-width: 0;
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: var(--font-size-base, 14px);
      line-height: 1;
      color: var(--ai-orb-label, #25242A);
      opacity: 0.74;
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
  @Input() dotColor = 'var(--ai-orb-dot, #3BAE5B)';

  /** Motion preset — `vortex` is the designer's default for every thinking state. */
  @Input()
  get variant(): ThinkingOrbsVariant { return this._variant; }
  set variant(value: ThinkingOrbsVariant) {
    this._variant = PRESETS[value] ? value : 'vortex';
    this.preset = PRESETS[this._variant];
    this.resize(this._dots ?? this.preset.n);
  }
  private _variant: ThinkingOrbsVariant = 'vortex';
  private preset: Preset = PRESETS.vortex;

  /**
   * Dot-count multiplier — the preset's `n` knob: `round(150 * dots)`; vortex
   * defaults to 1.35 (203 dots), twinkle to 2.6 (390). Below ~40px the dots merge into a blob, so thin the
   * field out rather than shrinking it further.
   */
  @Input()
  get dots(): number { return this._dots ?? this.preset.n; }
  set dots(value: number) {
    this._dots = value;
    this.resize(value);
  }
  private _dots?: number;

  private resize(n: number): void {
    this.count = Math.max(1, Math.round(150 * n));
    this.sphere = buildSphere(this.count);
    this.allocate();
    if (this.ready && !this.rafId) this.render();
  }

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

  private count = Math.max(1, Math.round(150 * PRESETS.vortex.n));   // 203 at the vortex preset
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

    // Paint immediately rather than waiting for the first tick: requestAnimationFrame
    // does not fire while the document is hidden, so a component that mounts in a
    // background tab would otherwise show an empty pill until the tab is focused.
    this.render();

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
    if (++this.frame % 30 === 0 && this.dpr !== Math.min(MAX_DPR, window.devicePixelRatio || 1)) this.syncSize();

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
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
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
    const P = this.preset;
    this.project(orbPhase(this.seconds, P.period, P.speed), s, sizeDotScale(s) * P.dotScale);

    const half = s / 2;
    const pz = this.pz;
    for (let i = 0; i < this.count; i++) this.order[i] = i;
    // Painter's algorithm — back to front, so near dots paint over far ones.
    const order = this.order.sort((a, b) => pz[a] - pz[b]);

    for (let k = 0; k < this.count; k++) {
      const i = order[k];
      const fr = this.pr[i] * (0.55 + 0.45 * fit);
      const fa = this.pa[i] * P.op;
      if (fr <= 0.05 || fa <= 0.004) continue;
      ctx.globalAlpha = fa > 1 ? 1 : fa;
      ctx.beginPath();
      ctx.arc(half + (this.px[i] - half) * fit, half + (this.py[i] - half) * fit, fr, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private project(t: number, s: number, ds: number): void {
    this._variant === 'twinkle' ? this.projectTwinkle(t, s, ds) : this.projectVortex(t, s, ds);
  }

  /**
   * draw3 ("vortex") + P3 from the reference, fused into the preallocated buffers.
   * Each dot rides its own meridian: phase u = h1(i) + t runs pole → pole, azimuth
   * h2(i)·τ + 2τt winds it around, and sin(πu)^0.4 fades it in and out at the poles.
   */
  private projectVortex(t: number, s: number, ds: number): void {
    const K = this.preset;
    // Rotation 1 — the draw's own turn (−τt, against the flow) at the fixed tilt.
    const ca1 = Math.cos(-TAU * t), sa1 = Math.sin(-TAU * t);
    const cb1 = Math.cos(TILT),     sb1 = Math.sin(TILT);
    // Rotation 2 — VIEW: yaw + spin, then pitch (identity at the preset).
    const ay2 = K.yw + TAU * K.sn * t;
    const ca2 = Math.cos(ay2),  sa2 = Math.sin(ay2);
    const cb2 = Math.cos(K.pc), sb2 = Math.sin(K.pc);

    const c = s / 2;
    const r = s * 0.3 * K.sp;
    const f = 3.5 * K.pv;
    const fade = 1.55 * K.df;
    const wind = TAU * 2 * t;
    const h1 = this.sphere.h1, h2 = this.sphere.h2;

    for (let i = 0; i < this.count; i++) {
      const u = (h1[i] + t) % 1;
      const pol = Math.PI * u;
      const ring = Math.sin(pol);
      const az = h2[i] * TAU + wind;
      const life = Math.pow(ring, 0.4);

      let x = Math.cos(az) * ring, y = Math.cos(pol), z = Math.sin(az) * ring;

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
      this.pr[i] = ds * (0.4 + 1.6 * K.dz * d) * per * 0.8;
      this.pa[i] = (0.07 + 0.93 * Math.pow(d, fade)) * life;
      this.pz[i] = z;
    }
  }

  /**
   * drawTwinkle + P3 from the reference, fused into the preallocated buffers.
   * Per-frame trigonometry is hoisted out of the dot loop; the maths is theirs.
   */
  private projectTwinkle(t: number, s: number, ds: number): void {
    const K = this.preset;
    // Rotation 1 — the draw's own turn (TAU * t) at a fixed 0.36 rad tilt.
    const ca1 = Math.cos(TAU * t), sa1 = Math.sin(TAU * t);
    const cb1 = Math.cos(TILT),    sb1 = Math.sin(TILT);
    // Rotation 2 — VIEW: the yaw knob plus the accumulating spin, then pitch.
    const ay2 = K.yw + TAU * K.sn * t;
    const ca2 = Math.cos(ay2),  sa2 = Math.sin(ay2);
    const cb2 = Math.cos(K.pc), sb2 = Math.sin(K.pc);

    const c = s / 2;
    const r = s * 0.3 * K.sp;
    const f = 3.5 * K.pv;
    const fade = 1.55 * K.df;
    const twinklePhase = TAU * 2 * t;         // two blinks per turn
    const bx = this.sphere.x, by = this.sphere.y, bz = this.sphere.z, ph = this.sphere.h1;

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
      this.pr[i] = ds * (0.4 + 1.6 * K.dz * d) * per * (0.55 + 1.5 * b);
      this.pa[i] = (0.07 + 0.93 * Math.pow(d, fade)) * (0.2 + 0.8 * b);
      this.pz[i] = z;
    }
  }

  /**
   * Probe 20 evenly spaced frames for the widest extent and scale so the orb
   * never clips. Cached by preset + box size + dot count.
   */
  private fitFactor(s: number): number {
    const key = `${this._variant}|${s}|${this.count}`;
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
