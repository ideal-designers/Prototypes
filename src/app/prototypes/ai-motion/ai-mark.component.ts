import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, Input, NgZone, OnChanges,
  OnDestroy, QueryList, ViewChildren, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * The ideals. sphere, animated. Geometry is the sidebar logo (DS Figma 15032:7628):
 * a 33×33 disc plus three ellipses nested against its left edge, each a quarter
 * narrower than the last. Every mode below only moves those four shapes, so any
 * frame is still recognisably the logo.
 *
 *   <ai-motion-mark mode="turn" [active]="busy" [size]="16"></ai-motion-mark>
 *
 * `active` eases between the resting logo and the animation (≈350ms both ways), so a
 * finished answer settles back to the mark instead of freezing mid-frame.
 */
export type AiMarkMode =
  | 'static'
  | 'turn'      // inner layers slide edge-to-edge: the sphere turning
  | 'flow'      // layers are born at the rim and shrink into the left edge, forever
  | 'cascade'   // layers step in one by one, then out (Claude-style glyph frames)
  | 'wave'      // inner layers breathe in a travelling wave
  | 'morph'     // logo ⇄ four-point spark (the Figma "Thinking…" icon)
  | 'orbit'     // inner layers roll around the inside of the rim (gyroscope)
  | 'liquid'    // slow organic wobble, for the large placeholder
  | 'sonar'     // resting logo, rings ripple out from it
  | 'spin'      // arc spinner around a breathing logo
  | 'eye'       // inner rings become an eye that follows the pointer and blinks
  | 'atom';     // inner rings swing out into electron orbits round a nucleus, then fold back into the logo

export type AiMarkSkin = 'brand' | 'outline' | 'iris' | 'mono';

const W = 32.92, H = 32.68;
const CX = W / 2, CY = H / 2;
const RX = [16.46, 12.35, 8.23, 4.115];
const RY = [16.34, 14.30, 12.25, 8.17];
const K = 0.5523;          // cubic-bezier circle constant
const STAR_IN = 0.17;      // how close the spark's edges pull to its centre

interface Layer { cx: number; cy: number; rx: number; ry: number; pinch: number; rot: number; op: number; lens?: number; }
interface Ring { r: number; op: number; }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** ry for a layer of a given width — the logo's own width→height ratio, interpolated. */
function ryFor(rx: number): number {
  const f = rx / RX[0];
  const tbl = [[0, 0.3], [0.25, 0.5], [0.5, 0.75], [0.75, 0.875], [1, 1]];
  for (let i = 1; i < tbl.length; i++) {
    if (f <= tbl[i][0]) {
      const [x0, y0] = tbl[i - 1], [x1, y1] = tbl[i];
      return RY[0] * lerp(y0, y1, (f - x0) / (x1 - x0));
    }
  }
  return RY[0];
}

/** Four cubic segments — an ellipse at pinch 0, a concave four-point spark at pinch 1.
 *  Same command list either way, so any two frames interpolate cleanly. */
function shapePath(l: Layer): string {
  const { cx, cy, rx, ry, pinch: p } = l;
  const lens = l.lens ?? 0;            // 1 = almond: vertical handles at the side tips collapse
  const kx = K * (1 + 0.3 * lens), ky = K * (1 - lens);
  const pt = (x: number, y: number) => `${x.toFixed(3)} ${y.toFixed(3)}`;
  const quad = (sx: number, sy: number, from: 'v' | 'h') => {
    // ellipse handles
    const e1 = from === 'v' ? [cx + sx * kx * rx, cy + sy * ry] : [cx + sx * rx, cy + sy * ky * ry];
    const e2 = from === 'v' ? [cx + sx * rx, cy + sy * ky * ry] : [cx + sx * kx * rx, cy + sy * ry];
    const s = [cx + sx * STAR_IN * rx, cy + sy * STAR_IN * ry];
    return [lerp(e1[0], s[0], p), lerp(e1[1], s[1], p), lerp(e2[0], s[0], p), lerp(e2[1], s[1], p)];
  };
  const a = quad(1, -1, 'v'), b = quad(1, 1, 'h'), c = quad(-1, 1, 'v'), d = quad(-1, -1, 'h');
  return `M${pt(cx, cy - ry)}`
    + `C${pt(a[0], a[1])} ${pt(a[2], a[3])} ${pt(cx + rx, cy)}`
    + `C${pt(b[0], b[1])} ${pt(b[2], b[3])} ${pt(cx, cy + ry)}`
    + `C${pt(c[0], c[1])} ${pt(c[2], c[3])} ${pt(cx - rx, cy)}`
    + `C${pt(d[0], d[1])} ${pt(d[2], d[3])} ${pt(cx, cy - ry)}Z`;
}

function restLayers(): Layer[] {
  return RX.map((rx, i) => ({ cx: rx, cy: CY, rx, ry: RY[i], pinch: 0, rot: 0, op: 1 }));
}

let uid = 0;

/** One shared pointer listener for every eye on the page. */
const pointer = { x: 0, y: 0, at: -1e9, bound: false };
function watchPointer(): void {
  if (pointer.bound || typeof document === 'undefined') return;
  pointer.bound = true;
  document.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.at = performance.now(); },
    { passive: true });
}

@Component({
  selector: 'ai-motion-mark',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mark" [class.mark--iris]="skin === 'iris'" [class.mark--glow]="glow"
          [style.width.px]="size" [style.height.px]="size"
          [attr.role]="label ? 'img' : null" [attr.aria-label]="label || null" [attr.aria-hidden]="label ? null : 'true'">
      <span class="mark__iris" *ngIf="skin === 'iris'"></span>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="mark__svg" overflow="visible">
        <defs>
          <!-- Shading and ramps ported from the logo SVG, in bounding-box units so they follow the layer as it moves -->
          <radialGradient #shadeGrad *ngFor="let g of shadeGeo; let i = index" [attr.id]="id + 'sh' + i" cx="0" cy="0" r="1"
                          [attr.gradientTransform]="'translate(' + g.cx + ' ' + g.cy + ') scale(' + g.rx + ' ' + g.ry + ')'">
            <stop [attr.offset]="g.a" class="st-shade"></stop>
            <stop [attr.offset]="g.b" class="st-shade" stop-opacity="0"></stop>
          </radialGradient>
          <linearGradient *ngFor="let g of rampGeo; let i = index" [attr.id]="id + 'l' + i" x1="0" [attr.y1]="g.y1" x2="0" y2="1">
            <stop offset="0" class="st-top"></stop>
            <stop offset="1" [ngClass]="g.low"></stop>
          </linearGradient>
          <linearGradient [attr.id]="id + 'arc'" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" class="st-arc" stop-opacity="0"></stop>
            <stop offset="1" class="st-arc"></stop>
          </linearGradient>
        </defs>

        <g class="rings">
          <circle #ring *ngFor="let r of ringSlots" [attr.cx]="CX" [attr.cy]="CY" r="16" class="ring"></circle>
        </g>
        <circle *ngIf="mode === 'spin'" #arc class="arc" [attr.cx]="CX" [attr.cy]="CY" r="19.5"
                [attr.stroke]="'url(#' + id + 'arc)'" pathLength="100"></circle>

        <g #layers class="layers" [attr.data-skin]="skin" [attr.data-mode]="mode">
          <ng-container *ngFor="let l of slots; let i = index">
            <path #fill class="fill" [attr.data-i]="i"
                  [attr.fill]="skin === 'brand' && (i === 1 || i === 2) ? 'url(#' + id + 'l' + (i - 1) + ')' : null"></path>
            <path #shade class="shade" *ngIf="skin === 'brand'" [attr.data-i]="i"
                  [attr.fill]="'url(#' + id + (i < 3 ? 'sh' + i : 'l2') + ')'" [attr.fill-opacity]="overlayOpacity[i]"></path>
          </ng-container>
        </g>

        <!-- Atom: nucleus + one electron per orbit (fade in as the orbits open) -->
        <g class="atom" *ngIf="mode === 'atom'" [attr.data-skin]="skin">
          <circle #nucleus [attr.cx]="CX" [attr.cy]="CY" r="2.6" class="atom__dot"></circle>
          <circle #electron *ngFor="let e of electronSlots" r="1.5" class="atom__dot"></circle>
        </g>
      </svg>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; vertical-align: middle; line-height: 0; }
    .mark { position: relative; display: inline-block; flex: 0 0 auto; }
    .mark__svg { position: relative; width: 100%; height: 100%; overflow: visible; display: block; }
    .mark--glow .mark__svg { filter: drop-shadow(0 0 calc(var(--mark-size, 16px) * 0.18) var(--ai-mark-glow)); }

    .st-shade { stop-color: var(--ai-mark-shade); }
    .st-top   { stop-color: var(--ai-mark-top); }
    .st-low1  { stop-color: var(--ai-mark-low-1); }
    .st-low2  { stop-color: var(--ai-mark-low-2); }
    .st-low3  { stop-color: var(--ai-mark-low-3); }
    .st-arc   { stop-color: var(--ai-mark-line); }

    [data-skin='brand'] .fill[data-i='0'] { fill: var(--ai-mark-base); }
    [data-skin='brand'] .fill[data-i='3'] { fill: var(--ai-mark-low-2); }
    [data-skin='outline'] .fill,
    [data-skin='iris'] .fill { fill: none; stroke: var(--ai-mark-line); stroke-width: 1.1; vector-effect: non-scaling-stroke; }
    [data-skin='iris'] .fill { stroke: var(--ai-mark-iris-line); stroke-width: 1.6; }
    [data-skin='mono'] .fill { fill: var(--color-text-primary); fill-opacity: 0.28; }
    [data-skin='mono'] .fill[data-i='0'] { fill-opacity: 0.9; }
    /* Eye: the smallest ring becomes the pupil — filled; its opacity follows the morph (JS) */
    [data-mode='eye'] .shade[data-i='3'] { fill: var(--ai-mark-shade); }
    /* Brand eye: the lid fills with the logo's lightest green (eye white), iris keeps its ramp */
    [data-mode='eye'][data-skin='brand'] .fill[data-i='1'] { fill: var(--ai-mark-low-3); }
    [data-mode='eye'][data-skin='outline'] .fill[data-i='3'],
    [data-mode='eye'][data-skin='iris'] .fill[data-i='3'] { fill: var(--ai-mark-line); }
    [data-mode='eye'][data-skin='iris'] .fill[data-i='3'] { fill: var(--ai-mark-iris-line); }
    [data-mode='eye'][data-skin='mono'] .fill[data-i='3'] { fill-opacity: 0.9; }

    .atom__dot { fill: var(--ai-mark-line); opacity: 0; }
    .atom[data-skin='iris'] .atom__dot { fill: var(--ai-mark-iris-line); }
    .atom[data-skin='brand'] .atom__dot { fill: var(--ai-mark-low-3); }
    .ring { fill: none; stroke: var(--ai-mark-line); stroke-width: 1; vector-effect: non-scaling-stroke; opacity: 0; }
    .arc  { fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 32 68; vector-effect: non-scaling-stroke;
            transform-origin: ${CX}px ${CY}px; }

    /* Iridescent skin — the pastel AI edge palette turning behind white contours (Figma iris variant) */
    .mark__iris { position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--ai-mark-iris-1), var(--ai-mark-iris-2), var(--ai-mark-iris-3), var(--ai-mark-iris-4), var(--ai-mark-iris-1));
      animation: iris-turn var(--iris-period, 6s) linear infinite; }
    @keyframes iris-turn { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .mark__iris { animation: none; } }
  `],
})
export class AiMarkComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() mode: AiMarkMode = 'turn';
  @Input() skin: AiMarkSkin = 'brand';
  @Input() size = 16;
  /** Animation running. false eases back to the resting logo. */
  @Input() active = true;
  /** 1 = default tempo; 2 = twice as fast. */
  @Input() speed = 1;
  @Input({ transform: booleanAttribute }) glow = false;
  @Input() label = '';

  readonly W = W; readonly H = H; readonly CX = CX; readonly CY = CY;
  readonly slots = [0, 1, 2, 3];
  readonly ringSlots = [0, 1, 2];
  readonly electronSlots = [1, 2, 3];
  /** Logo SVG gradients re-expressed per layer bbox (0..1): centre, radii, dark → clear stops. */
  readonly shadeGeo = [
    { cx: 0.375, cy: 0.617, rx: 0.471, ry: 0.555, a: 0.585, b: 1 },
    { cx: 0.333, cy: 0.637, rx: 0.433, ry: 0.560, a: 0.485, b: 1 },
    { cx: 0.229, cy: 0.611, rx: 0.366, ry: 0.467, a: 0.35,  b: 0.95 },
  ];
  /** Vertical ramps start above the layer (y1 < 0), so the top is lighter than the start colour. */
  readonly rampGeo = [{ y1: -0.434, low: 'st-low1' }, { y1: -0.396, low: 'st-low2' }, { y1: -0.917, low: 'st-low3' }];
  /** Over the disc and the two middle layers: shade. Over the smallest: its light ramp. */
  readonly overlayOpacity = [0.9, 0.9, 1, 0.85];
  readonly id = `aim${++uid}-`;

  @ViewChildren('fill') private fills!: QueryList<ElementRef<SVGPathElement>>;
  @ViewChildren('shade') private shades!: QueryList<ElementRef<SVGPathElement>>;
  @ViewChildren('ring') private rings!: QueryList<ElementRef<SVGCircleElement>>;
  @ViewChildren('arc') private arcs!: QueryList<ElementRef<SVGCircleElement>>;
  @ViewChildren('nucleus') private nuclei!: QueryList<ElementRef<SVGCircleElement>>;
  @ViewChildren('electron') private electrons!: QueryList<ElementRef<SVGCircleElement>>;
  @ViewChildren('shadeGrad') private shadeGrads!: QueryList<ElementRef<SVGRadialGradientElement>>;
  @ViewChildren('layers') private layerGroups!: QueryList<ElementRef<SVGGElement>>;

  private zone = inject(NgZone);
  private host = inject(ElementRef<HTMLElement>);
  private raf = 0;
  private t = 0;          // animation clock, seconds × speed
  private last = 0;
  private w = 0;          // eased "working" weight 0..1
  private visible = true;
  private io?: IntersectionObserver;
  private atomM = 0;               // atom: how far the logo has opened into orbits, 0..1
  private atomWrap = [0, 0, 0, 0]; // atom: half-turns dropped per orbit — electrons add them back so they don't jump
  private gx = 0; private gy = 0;   // eye gaze, -1..1, eased
  private dt = 0;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    watchPointer();
    this.w = this.active ? 1 : 0;
    this.host.nativeElement.style.setProperty('--mark-size', `${this.size}px`);
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); });
      this.io.observe(this.host.nativeElement);
    }
    this.draw();
    this.kick();
  }

  ngOnChanges(): void {
    this.host.nativeElement.style.setProperty('--mark-size', `${this.size}px`);
    this.host.nativeElement.style.setProperty('--iris-period', `${6 / Math.max(0.2, this.speed)}s`);
    // the template re-renders slots when mode/skin flip — draw once the DOM settles
    queueMicrotask(() => { this.draw(); this.kick(); });
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.io?.disconnect(); }

  private kick(): void {
    if (this.raf || !this.visible) return;
    this.zone.runOutsideAngular(() => {
      this.last = performance.now();
      const loop = (now: number) => {
        const dt = Math.min(0.1, (now - this.last) / 1000);
        this.last = now;
        this.dt = dt;
        const target = this.active && !this.reduced ? 1 : 0;
        this.w += (target - this.w) * Math.min(1, dt * 9);
        if (Math.abs(target - this.w) < 0.002) this.w = target;
        this.t += dt * this.speed * (0.25 + 0.75 * this.w);
        this.draw();
        const idle = this.w === 0 && !this.active;
        if (!this.visible || idle || this.reduced) { this.raf = 0; return; }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    });
  }

  /** Frame for the current mode at time t, before blending with the resting logo. */
  private frame(t: number): { layers: Layer[]; rings: Ring[]; arc: number } {
    const L = restLayers();
    const rings: Ring[] = [];
    let arc = 0;
    switch (this.mode) {
      case 'turn': {
        for (let i = 1; i < 4; i++) {
          const s = Math.sin(t * Math.PI * 2 / 2.6 - i * 0.32);
          const e = (1 - Math.cos((s + 1) * Math.PI / 2)) / 2 * 2 - 1; // ease the swing at both ends
          L[i].cx = RX[i] + (RX[0] - RX[i]) * (1 + e);
        }
        break;
      }
      case 'flow': {
        const P = 2.4;
        for (let i = 1; i < 4; i++) {
          const ph = ((t / P) + (i - 1) / 3) % 1;
          const rx = RX[0] * (1 - ph);
          L[i].rx = rx; L[i].cx = rx; L[i].ry = ryFor(rx);
          L[i].op = clamp01(ph / 0.12) * clamp01((1 - ph) / 0.12);
        }
        break;
      }
      case 'cascade': {
        const step = Math.floor(t / 0.16) % 8;           // 0..7 → layers visible 0,1,2,3,3,2,1,0
        const n = [0, 1, 2, 3, 3, 2, 1, 0][step];
        for (let i = 1; i < 4; i++) L[i].op = i <= n ? 1 : 0;
        break;
      }
      case 'wave': {
        for (let i = 1; i < 4; i++) {
          const k = 1 + 0.2 * Math.sin(t * Math.PI * 2 / 1.8 - i * 1.1);
          const rx = Math.min(RX[i - 1] - 0.6, RX[i] * k);
          L[i].rx = rx; L[i].cx = rx; L[i].ry = Math.min(RY[i - 1] - 0.4, RY[i] * (1 + (k - 1) * 0.4));
        }
        break;
      }
      case 'morph': {
        const P = 3.2;
        const u = (t / P) % 1;
        // hold logo → morph → hold spark (twinkling) → back
        const m = u < 0.3 ? 0 : u < 0.45 ? ease((u - 0.3) / 0.15) : u < 0.85 ? 1 : 1 - ease((u - 0.85) / 0.15);
        const twinkle = u >= 0.45 && u < 0.85 ? 1 + 0.06 * Math.sin((u - 0.45) * Math.PI * 2 / 0.2) : 1;
        for (let i = 0; i < 4; i++) {
          const sr = RX[0] * (1.16 - i * 0.25) * twinkle;
          L[i].cx = lerp(L[i].cx, CX, m);
          L[i].rx = lerp(L[i].rx, sr, m);
          L[i].ry = lerp(L[i].ry, sr, m);
          L[i].pinch = m;
        }
        break;
      }
      case 'orbit': {
        for (let i = 1; i < 4; i++) L[i].rot = (t * (110 + i * 55) + i * 40) % 360;
        break;
      }
      case 'liquid': {
        for (let i = 1; i < 4; i++) {
          const a = t * 0.9 + i * 1.7;
          const k = 1 + 0.12 * Math.sin(a) + 0.06 * Math.sin(a * 2.3 + 1);
          const rx = Math.min(RX[i - 1] - 0.5, RX[i] * k);
          L[i].rx = rx; L[i].ry = Math.min(RY[i - 1] - 0.5, RY[i] * (1 + 0.05 * Math.sin(a * 1.4)));
          L[i].cx = rx + (RX[0] - rx) * 0.35 * (1 + Math.sin(t * 0.7 + i));
        }
        break;
      }
      case 'sonar': {
        for (let j = 0; j < 3; j++) {
          const ph = ((t / 2.4) + j / 3) % 1;
          rings.push({ r: lerp(RX[0], RX[0] * 1.55, ease(ph)), op: (1 - ph) * 0.7 });
        }
        break;
      }
      case 'eye': {
        // Gaze: towards the pointer while it moves; after 2.5 s of stillness (or on touch) look around.
        let tx: number, ty: number;
        if (performance.now() - pointer.at < 2500) {
          const r = this.host.nativeElement.getBoundingClientRect();
          const dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
          const d = Math.hypot(dx, dy) || 1, reach = Math.min(1, d / 180);
          tx = (dx / d) * reach; ty = (dy / d) * reach;
        } else {
          const seg = Math.floor(t / 1.6);                    // hold a glance, then dart to the next one
          const h = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1;
          tx = h(seg) * 0.9; ty = h(seg + 7.1) * 0.7;
        }
        const k = Math.min(1, this.dt * 12);
        this.gx += (tx - this.gx) * k; this.gy += (ty - this.gy) * k;
        // Blink every ~4 s: lids close and open in 180 ms
        const b = t % 4.2, open = b < 0.18 ? 1 - Math.sin(Math.PI * b / 0.18) * 0.92 : 1;
        L[1] = { cx: CX, cy: CY, rx: 12.6, ry: 7.4 * open, pinch: 0, rot: 0, op: 1, lens: 1 };
        const ix = CX + this.gx * 4.6, iy = CY + this.gy * 2.2 * open;
        L[2] = { cx: ix, cy: iy, rx: 5.6, ry: Math.min(5.6, 7.4 * open), pinch: 0, rot: 0, op: 1 };
        L[3] = { cx: ix + this.gx * 0.6, cy: iy + this.gy * 0.4, rx: 2.5, ry: Math.min(2.5, 6.6 * open), pinch: 0, rot: 0, op: 1 };
        break;
      }
      case 'atom': {
        // logo → atom (hold, electrons running) → back to the logo, on a loop
        const u = (t / 4.2) % 1;
        const m = u < 0.14 ? ease(u / 0.14) : u < 0.76 ? 1 : u < 0.9 ? 1 - ease((u - 0.76) / 0.14) : 0;
        this.atomM = m;
        const precess = t * 18;                       // the whole atom turns slowly
        for (let i = 1; i < 4; i++) {
          L[i].cx = lerp(L[i].cx, CX, m);
          L[i].rx = lerp(L[i].rx, 14.4, m);
          L[i].ry = lerp(L[i].ry, 5.2, m);
          // An ellipse looks the same turned 180°, so keep the angle in (−90°, 90°]: folding back
          // into the logo then unwinds at most 90° instead of spinning back through every turn.
          // Only re-wrap while fully open (180° is invisible) or fully closed (angle × 0); mid-morph
          // a wrap would show as a jump, so the count stays frozen there.
          const raw = (i - 1) * 60 + precess;
          if (m === 1 || m === 0) this.atomWrap[i] = Math.floor((raw + 90) / 180);
          L[i].rot = (raw - this.atomWrap[i] * 180) * m;
        }
        break;
      }
      case 'spin': {
        arc = (t * 360 / 1.1) % 360;
        const k = 1 + 0.04 * Math.sin(t * Math.PI * 2 / 1.6);
        for (const l of L) { l.rx *= k; l.ry *= k; l.cx = CX + (l.cx - CX) * k; }
        break;
      }
    }
    return { layers: L, rings, arc };
  }

  private draw(): void {
    if (!this.fills) return;
    const rest = restLayers();
    const f = this.mode === 'static' ? { layers: rest, rings: [] as Ring[], arc: 0 } : this.frame(this.t);
    const w = this.w;
    const fills = this.fills.toArray();
    const shades = this.shades?.toArray() ?? [];
    const blended: Layer[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rest[i], b = f.layers[i];
      const l: Layer = {
        cx: lerp(a.cx, b.cx, w), cy: lerp(a.cy, b.cy, w), rx: lerp(a.rx, b.rx, w), ry: lerp(a.ry, b.ry, w),
        pinch: lerp(a.pinch, b.pinch, w), rot: b.rot * w, op: lerp(a.op, b.op, w), lens: (b.lens ?? 0) * w,
      };
      blended.push(l);
      const d = shapePath(l);
      const tr = l.rot ? `rotate(${l.rot.toFixed(2)} ${CX} ${CY})` : '';
      const el = fills[i]?.nativeElement;
      const eye = this.mode === 'eye';
      if (el) {
        el.setAttribute('d', d); el.setAttribute('transform', tr); el.style.opacity = String(l.op);
        // the pupil fills in as the ring becomes an eye (outline / iris skins)
        el.style.fillOpacity = eye && i === 3 && this.skin !== 'brand' ? String(w) : '';
      }
      const sh = shades[i]?.nativeElement;
      // the spark is lit flat — shading fades out as it morphs; the eye's pupil darkens in
      if (sh) {
        sh.setAttribute('d', d); sh.setAttribute('transform', tr);
        const lit = eye && (i === 1 || i === 2) ? 1 - 0.9 * w : 1;   // eye: lid and iris lit flat so the pupil reads
        sh.style.opacity = String(eye && i === 3 ? w : l.op * (1 - 0.85 * l.pinch) * lit);
      }
    }

    // Keep each layer's dark core under the next layer: as the next one slides right
    // (turn), the shading centre slides with it, so the lit rim stays on the open side.
    const grads = this.shadeGrads?.toArray() ?? [];
    for (let i = 0; i < 3 && i < grads.length; i++) {
      const outer = blended[i], inner = blended[i + 1], g = this.shadeGeo[i];
      const travel = 2 * Math.max(0.001, outer.rx - inner.rx);
      const fr = this.mode === 'turn' || this.mode === 'liquid'
        ? clamp01(((inner.cx - inner.rx) - (outer.cx - outer.rx)) / travel) : 0;
      grads[i].nativeElement.setAttribute('gradientTransform',
        `translate(${lerp(g.cx, 1 - g.cx, fr).toFixed(3)} ${g.cy}) scale(${g.rx} ${g.ry})`);
    }

    // Flow grows new layers from the rim: paint largest first so smaller ones stay on top
    // (other modes keep template order, which also restores it after leaving flow).
    const group = this.layerGroups?.first?.nativeElement;
    if (group) {
      const order = this.mode === 'flow' ? [1, 2, 3].sort((x, y) => blended[y].rx - blended[x].rx) : [1, 2, 3];
      for (const i of order) {
        const fe = fills[i]?.nativeElement, se = shades[i]?.nativeElement;
        if (fe) group.appendChild(fe);
        if (se) group.appendChild(se);
      }
    }
    const rings = this.rings?.toArray() ?? [];
    rings.forEach((r, j) => {
      const ring = f.rings[j];
      r.nativeElement.setAttribute('r', String(ring ? ring.r : RX[0]));
      r.nativeElement.style.opacity = String(ring ? ring.op * w : 0);
    });
    // Atom: electrons travel along the drawn (blended) orbits, so they sit on the lines mid-morph too
    if (this.mode === 'atom') {
      const on = w * this.atomM;
      const nuc = this.nuclei?.first?.nativeElement;
      if (nuc) nuc.style.opacity = String(on);
      (this.electrons?.toArray() ?? []).forEach((e, j) => {
        const l = blended[j + 1];
        const ph = this.t * (2.4 + j * 0.7) + j * 2.1 + Math.PI * this.atomWrap[j + 1];
        const lx = l.rx * Math.cos(ph), ly = l.ry * Math.sin(ph);
        const r = (l.rot * Math.PI) / 180;
        e.nativeElement.setAttribute('cx', (l.cx + lx * Math.cos(r) - ly * Math.sin(r)).toFixed(3));
        e.nativeElement.setAttribute('cy', (l.cy + lx * Math.sin(r) + ly * Math.cos(r)).toFixed(3));
        e.nativeElement.style.opacity = String(on);
      });
    }
    const arc = this.arcs?.first?.nativeElement;
    if (arc) { arc.style.transform = `rotate(${f.arc}deg)`; arc.style.opacity = String(w); }
  }
}
