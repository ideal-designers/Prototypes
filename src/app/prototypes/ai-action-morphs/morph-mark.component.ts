import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy,
  QueryList, ViewChildren, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * The AI mark acting out what the assistant is doing in the data room.
 *
 *   <vdr-morph-mark scene="folder" [size]="20"></vdr-morph-mark>
 *
 * Four shapes, always: at rest they are the outline ideals. logo (four ellipses against the
 * left edge); in a scene they become the parts of a pictogram — folder back + flap + two
 * papers, page + three text lines, lens + handle + two found lines… Every shape is a path
 * resampled to the same number of points, so any shape can morph into any other (logo →
 * folder → document → logo) with a plain point-by-point blend. Inside a scene each shape
 * moves through its poses (A ⇄ B, or a loop of keyframes) on its own delay — that is the "action".
 * Scenes lean on circles on purpose: the logo is four circles, so the lens, the pie, the
 * Venn pair, the bubbles and the flying dot all read as the mark doing something.
 */
export type MorphScene =
  | 'logo' | 'search' | 'searchEye' | 'folder' | 'read' | 'compare' | 'lock' | 'activity' | 'qa' | 'report' | 'redact';

type Ink = 'line' | 'mint' | 'ink';
/** `a` alone = still; `a` + `b` = swing A ⇄ B; `keys` = loop through every pose in turn (a circle flying round a lens). */
interface SlotDef { a: string; b?: string; keys?: string[]; linear?: boolean; fill?: number; stroke?: number; ink?: Ink; delay?: number; }
interface SceneDef { slots: SlotDef[]; order?: number[]; period?: number; }

const N = 84;             // points per shape
const MORPH_MS = 520;     // scene ⇄ scene / logo transition

// ── Path builders (48 × 48 box) ──────────────────────────────────────────────
const f = (n: number) => +n.toFixed(2);
function rect(x: number, y: number, w: number, h: number, r = 0): string {
  r = Math.min(r, w / 2, h / 2);
  if (!r) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}`
    + `A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)}`
    + `V${f(y + r)}A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}Z`;
}
function ellipse(cx: number, cy: number, rx: number, ry = rx): string {
  return `M${f(cx)} ${f(cy - ry)}A${rx} ${ry} 0 1 1 ${f(cx)} ${f(cy + ry)}A${rx} ${ry} 0 1 1 ${f(cx)} ${f(cy - ry)}Z`;
}
function poly(pts: [number, number][]): string {
  return 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
}
/** Filled pie wedge from 12 o'clock, clockwise by `deg`. */
function wedge(cx: number, cy: number, r: number, deg: number): string {
  const a = (d: number) => [cx + r * Math.sin((d * Math.PI) / 180), cy - r * Math.cos((d * Math.PI) / 180)];
  const [x1, y1] = a(0), [x2, y2] = a(deg);
  return `M${cx} ${cy}L${f(x1)} ${f(y1)}A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${f(x2)} ${f(y2)}Z`;
}
/** A bar rotated by `deg` around its own centre (magnifier handle). */
function bar(cx: number, cy: number, len: number, th: number, deg: number): string {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const p = (x: number, y: number): [number, number] => [cx + x * c - y * s, cy + x * s + y * c];
  return poly([p(-len / 2, -th / 2), p(len / 2, -th / 2), p(len / 2, th / 2), p(-len / 2, th / 2)]);
}

/** Almond eye outline — sharp corners left and right. */
function almond(cx: number, cy: number, w: number, h: number): string {
  return `M${f(cx - w)} ${cy}C${f(cx - w / 2)} ${f(cy - h)} ${f(cx + w / 2)} ${f(cy - h)} ${f(cx + w)} ${cy}`
    + `C${f(cx + w / 2)} ${f(cy + h)} ${f(cx - w / 2)} ${f(cy + h)} ${f(cx - w)} ${cy}Z`;
}
/** Point on a circle, angle in degrees clockwise from 12 o'clock. */
function on(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}
/** Circles placed round a ring — keyframes for a dot flying an orbit. */
function orbit(cx: number, cy: number, r: number, dot: number, steps: number, from = 0): string[] {
  return Array.from({ length: steps }, (_, i) => { const [x, y] = on(cx, cy, r, from + (i * 360) / steps); return ellipse(x, y, dot); });
}

// Logo: the sidebar sphere's four ellipses, left-tangent, scaled into the 48 box.
const LOGO: SlotDef[] = [1, 0.75, 0.5, 0.25].map((k, i) => {
  const rx = 20 * k, ry = 20 * [1, 0.875, 0.75, 0.5][i];
  return { a: ellipse(4 + rx, 24, rx, ry), stroke: 1, fill: 0, ink: 'line' as Ink };
});

const PAGE = poly([[12, 5], [30, 5], [38, 13], [38, 43], [12, 43]]);
const LENS = ellipse(20, 20, 13);
const HANDLE = bar(33, 33, 11, 4.4, 45);
const [tx1, ty1] = on(24, 24, 17, 225), [tx2, ty2] = on(24, 24, 17, 245);
/** Pie sweep keyframes: 8° → 352° in 12 even steps, then it resets. */
const PIE_DEG = Array.from({ length: 12 }, (_, i) => 8 + (i * 344) / 11);
const BUBBLE = `M24 7A17 17 0 1 1 ${f(tx1)} ${f(ty1)}L6 42L${f(tx2)} ${f(ty2)}A17 17 0 0 1 24 7Z`;

export const SCENES: Record<Exclude<MorphScene, 'logo'>, SceneDef> = {
  // A dot flies round inside the lens, a smaller one trails it
  search: { period: 1.8, slots: [
    { a: LENS, stroke: 1 },
    { a: HANDLE, fill: 1, stroke: 0 },
    { a: ellipse(20, 13.5, 3.4), keys: orbit(20, 20, 6.5, 3.4, 12), linear: true, fill: 1, stroke: 0, ink: 'mint' },
    { a: ellipse(20, 13.5, 1.8), keys: orbit(20, 20, 6.5, 1.8, 12), linear: true, fill: 1, stroke: 0, delay: 0.07 },
  ] },
  // An eye inside the lens looks left, right, up — reading what it finds
  searchEye: { period: 2.6, slots: [
    { a: LENS, stroke: 1 },
    { a: HANDLE, fill: 1, stroke: 0 },
    { a: almond(20, 20, 8.5, 6.5), keys: [almond(20, 20, 8.5, 6.5), almond(20, 20, 8.5, 6.5), almond(20, 20, 8.5, 0.6), almond(20, 20, 8.5, 6.5)], stroke: 1 },
    { a: ellipse(20, 20, 2.8), keys: [ellipse(16, 20, 2.8), ellipse(24, 20, 2.8), ellipse(20, 20, 2.8, 0.4), ellipse(20, 18.5, 2.8)], fill: 1, stroke: 0 },
  ] },
  // The folder opens and circles bubble up out of it
  folder: { period: 2.4, order: [0, 2, 3, 1], slots: [
    { a: poly([[5, 14], [17, 14], [21, 18], [43, 18], [43, 41], [5, 41]]), stroke: 1 },
    { a: poly([[5, 23], [43, 23], [43, 41], [5, 41]]), b: poly([[9, 28], [47, 28], [43, 41], [5, 41]]), stroke: 1, fill: 0.12 },
    { a: ellipse(18, 28, 5), b: ellipse(18, 12, 5), stroke: 1, delay: 0.05 },
    { a: ellipse(30, 30, 3.5), b: ellipse(31, 7, 3.5), fill: 1, stroke: 0, ink: 'mint', delay: 0.14 },
  ] },
  // A round reading lens works down the page line by line
  read: { period: 2.4, slots: [
    { a: PAGE, stroke: 1 },
    { a: ellipse(19, 18, 5), keys: [ellipse(19, 18, 5), ellipse(30, 18, 5), ellipse(19, 26, 5), ellipse(30, 26, 5), ellipse(19, 34, 5), ellipse(30, 34, 5)], stroke: 1 },
    { a: rect(17, 17, 16, 2.4, 1.2), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(17, 25, 13, 2.4, 1.2), fill: 1, stroke: 0, ink: 'mint' },
  ] },
  // Two versions as a Venn pair: they part and overlap, the changes blink
  compare: { period: 2.4, slots: [
    { a: ellipse(18, 24, 12), b: ellipse(15, 24, 12), stroke: 1 },
    { a: ellipse(30, 24, 12), b: ellipse(33, 24, 12), stroke: 1 },
    { a: ellipse(24, 20, 2.6), b: ellipse(24, 20, 0.6), fill: 1, stroke: 0, ink: 'mint' },
    { a: ellipse(24, 28, 0.6), b: ellipse(24, 28, 2.6), fill: 1, stroke: 0, ink: 'mint' },
  ] },
  // A round padlock: the shackle lifts
  lock: { period: 2.2, slots: [
    { a: ellipse(24, 30, 12), stroke: 1 },
    { a: 'M16 22V16A8 8 0 0 1 32 16V22H29V16A5 5 0 0 0 19 16V22Z',
      b: 'M16 17V11A8 8 0 0 1 32 11V17H29V11A5 5 0 0 0 19 11V17Z', fill: 1, stroke: 0 },
    { a: ellipse(24, 29, 3), fill: 1, stroke: 0, ink: 'mint' },
    { a: ellipse(24, 35, 1.4), b: ellipse(24, 35, 2.2), fill: 1, stroke: 0, ink: 'mint' },
  ] },
  // Engagement as a bubble chart: bubbles swell in turn
  activity: { period: 2.4, slots: [
    { a: ellipse(18, 28, 11), b: ellipse(18, 28, 8), stroke: 1 },
    { a: ellipse(33, 17, 6), b: ellipse(33, 17, 9), stroke: 1, delay: 0.12 },
    { a: ellipse(34, 34, 4.5), b: ellipse(34, 34, 6.5), fill: 1, stroke: 0, ink: 'mint', delay: 0.24 },
    { a: ellipse(13, 12, 3), b: ellipse(13, 12, 4.5), fill: 1, stroke: 0, delay: 0.36 },
  ] },
  // Drafting an answer: typing dots in a round speech bubble
  qa: { period: 1.3, slots: [
    { a: BUBBLE, stroke: 1 },
    { a: ellipse(16, 24, 2.8), b: ellipse(16, 20.5, 2.8), fill: 1, stroke: 0 },
    { a: ellipse(24, 24, 2.8), b: ellipse(24, 20.5, 2.8), fill: 1, stroke: 0, ink: 'mint', delay: 0.15 },
    { a: ellipse(32, 24, 2.8), b: ellipse(32, 20.5, 2.8), fill: 1, stroke: 0, delay: 0.3 },
  ] },
  // A pie being drawn: the slice sweeps round while a dot pens its edge
  report: { period: 3, slots: [
    { a: ellipse(24, 24, 17), stroke: 1 },
    { a: wedge(24, 24, 17, 8), keys: PIE_DEG.map(d => wedge(24, 24, 17, d)), linear: true, fill: 1, stroke: 0, ink: 'mint' },
    { a: ellipse(24, 24, 3.6), fill: 1, stroke: 0 },
    { a: ellipse(...on(24, 24, 17, 8), 2.6), keys: PIE_DEG.map(d => ellipse(...on(24, 24, 17, d), 2.6)), linear: true, fill: 1, stroke: 0 },
  ] },
  // A round marker runs along the lines and blacks them out
  redact: { period: 2.4, slots: [
    { a: PAGE, stroke: 1 },
    { a: rect(17, 17, 3, 4, 1), b: rect(17, 17, 16, 4, 1), fill: 1, stroke: 0, ink: 'ink' },
    { a: rect(17, 26, 3, 4, 1), b: rect(17, 26, 14, 4, 1), fill: 1, stroke: 0, ink: 'ink', delay: 0.25 },
    { a: ellipse(20, 19, 3), keys: [ellipse(20, 19, 3), ellipse(33, 19, 3), ellipse(20, 28, 3), ellipse(31, 28, 3)], stroke: 1 },
  ] },
};

// ── Sampling & alignment ─────────────────────────────────────────────────────
type Pts = Float32Array;   // x0 y0 x1 y1 …
const SAMPLED = new Map<string, Pts>();
let probe: SVGPathElement | null = null;

function sample(d: string): Pts {
  const hit = SAMPLED.get(d);
  if (hit) return hit;
  if (!probe) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.visibility = 'hidden';
    probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(probe); document.body.appendChild(svg);
  }
  probe.setAttribute('d', d);
  const len = probe.getTotalLength(), out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    const p = probe.getPointAtLength((i / N) * len);
    out[i * 2] = p.x; out[i * 2 + 1] = p.y;
  }
  // one winding direction for every shape, so blends never turn inside out
  let area = 0;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    area += out[i * 2] * out[j * 2 + 1] - out[j * 2] * out[i * 2 + 1];
  }
  if (area < 0) {
    for (let i = 1, j = N - 1; i < j; i++, j--) {
      [out[i * 2], out[j * 2]] = [out[j * 2], out[i * 2]];
      [out[i * 2 + 1], out[j * 2 + 1]] = [out[j * 2 + 1], out[i * 2 + 1]];
    }
  }
  SAMPLED.set(d, out);
  return out;
}

/** `to` with its start point rotated to sit closest to `from` — keeps the morph from twisting. */
function align(from: Pts, to: Pts): Pts {
  let best = 0, bestErr = Infinity;
  for (let s = 0; s < N; s += 2) {
    let err = 0;
    for (let i = 0; i < N; i += 3) {
      const j = ((i + s) % N) * 2;
      const dx = from[i * 2] - to[j], dy = from[i * 2 + 1] - to[j + 1];
      err += dx * dx + dy * dy;
    }
    if (err < bestErr) { bestErr = err; best = s; }
  }
  if (!best) return to;
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) { const j = ((i + best) % N) * 2; out[i * 2] = to[j]; out[i * 2 + 1] = to[j + 1]; }
  return out;
}

function toPath(p: Pts): string {
  let d = `M${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  for (let i = 1; i < N; i++) d += `L${p[i * 2].toFixed(2)} ${p[i * 2 + 1].toFixed(2)}`;
  return d + 'Z';
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A slot's loop: [A] still, [A, B] swing, or every keyframe — all aligned to A so the loop never twists. */
function posesFor(a: Pts, d: SlotDef): Pts[] {
  if (d.keys?.length) return d.keys.map((k, i) => (i === 0 ? a : align(a, sample(k))));  // a = keys[0]
  return d.b ? [a, align(a, sample(d.b))] : [a];
}

interface Slot {
  cur: Pts; fill: number; stroke: number;          // what is on screen now
  from?: Pts; fromFill: number; fromStroke: number; // transition start
  a: Pts; poses: Pts[]; linear: boolean; tFill: number; tStroke: number; ink: Ink; delay: number;
}

@Component({
  selector: 'vdr-morph-mark',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 48 48" [style.width.px]="size" [style.height.px]="size" class="mm"
         [attr.role]="label ? 'img' : null" [attr.aria-label]="label || null" [attr.aria-hidden]="label ? null : 'true'">
      <g #group><path #p *ngFor="let i of slotIdx" class="mm__s" [attr.stroke-width]="strokeW"></path></g>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; vertical-align: middle; }
    .mm { overflow: visible; display: block; }
    .mm__s { stroke: var(--ai-mark-line); fill: var(--ai-mark-line); stroke-linejoin: round; vector-effect: non-scaling-stroke; }
    .mm__s[data-ink='mint'] { fill: var(--ai-mark-low-2); }
    .mm__s[data-ink='ink']  { fill: var(--color-text-primary); }
  `],
})
export class MorphMarkComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() scene: MorphScene = 'logo';
  @Input() size = 48;
  @Input() speed = 1;
  @Input() label = '';

  readonly slotIdx = [0, 1, 2, 3];
  get strokeW(): number { return Math.max(1, Math.min(2, this.size / 30)); }

  @ViewChildren('p') private paths!: QueryList<ElementRef<SVGPathElement>>;
  @ViewChildren('group') private groups!: QueryList<ElementRef<SVGGElement>>;
  private zone = inject(NgZone);
  private host = inject(ElementRef<HTMLElement>);
  private slots: Slot[] = [];
  private tStart = 0;        // transition start (ms)
  private loopStart = 0;     // scene loop start (ms)
  private raf = 0;
  private visible = true;
  private io?: IntersectionObserver;
  private ready = false;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    const defs = this.defs(this.scene);
    this.slots = defs.map(d => {
      const a = sample(d.keys?.[0] ?? d.a);
      return { cur: a, fill: d.fill ?? 0, stroke: d.stroke ?? 1, fromFill: 0, fromStroke: 1,
        a, poses: posesFor(a, d), linear: !!d.linear, tFill: d.fill ?? 0, tStroke: d.stroke ?? 1, ink: d.ink ?? 'line', delay: d.delay ?? 0 };
    });
    this.loopStart = performance.now();
    this.ready = true;
    this.applyOrder();
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); });
      this.io.observe(this.host.nativeElement);
    }
    this.render(performance.now());
    this.kick();
  }

  ngOnChanges(): void {
    if (!this.ready) return;
    this.retarget();
    this.kick();
  }

  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.io?.disconnect(); }

  private defs(scene: MorphScene): SlotDef[] { return scene === 'logo' ? LOGO : SCENES[scene].slots; }

  /** Start a morph from whatever is on screen to the new scene's pose A. */
  private retarget(): void {
    const defs = this.defs(this.scene);
    this.slots.forEach((s, i) => {
      const d = defs[i];
      s.from = s.cur; s.fromFill = s.fill; s.fromStroke = s.stroke;
      s.a = align(s.cur, sample(d.keys?.[0] ?? d.a));
      s.poses = posesFor(s.a, d); s.linear = !!d.linear;
      s.tFill = d.fill ?? 0; s.tStroke = d.stroke ?? 1; s.ink = d.ink ?? 'line'; s.delay = d.delay ?? 0;
    });
    this.tStart = performance.now();
    this.loopStart = this.tStart + MORPH_MS;
    this.applyOrder();
  }

  private applyOrder(): void {
    const g = this.groups?.first?.nativeElement, ps = this.paths?.toArray();
    if (!g || !ps) return;
    const order = this.scene === 'logo' ? [0, 1, 2, 3] : SCENES[this.scene].order ?? [0, 1, 2, 3];
    for (const i of order) g.appendChild(ps[i].nativeElement);
  }

  private kick(): void {
    if (this.raf || !this.visible) return;
    this.zone.runOutsideAngular(() => {
      const loop = (now: number) => {
        const busy = this.render(now);
        if (!busy || !this.visible) { this.raf = 0; return; }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    });
  }

  /** Draw one frame. Returns whether anything is still moving. */
  private render(now: number): boolean {
    const ps = this.paths?.toArray();
    if (!ps) return false;
    const m = this.reduced ? 1 : Math.min(1, (now - this.tStart) / MORPH_MS);
    const em = ease(m);
    const period = (this.scene === 'logo' ? 1 : SCENES[this.scene].period ?? 2.4) / Math.max(0.2, this.speed);
    let moving = m < 1;

    this.slots.forEach((s, i) => {
      // pose inside the scene: walk the poses in a loop (A → B → A for a swing) on this slot's delay
      let pose = s.a;
      const K = s.poses.length;
      if (K > 1 && !this.reduced) {
        const tau = Math.max(0, (now - this.loopStart) / 1000 / period - s.delay);
        const u = (tau % 1) * K, k = Math.floor(u), e = s.linear ? u - k : ease(u - k);
        const p0 = s.poses[k % K], p1 = s.poses[(k + 1) % K];
        const out = new Float32Array(N * 2);
        for (let j = 0; j < N * 2; j++) out[j] = lerp(p0[j], p1[j], e);
        pose = out;
        moving = true;
      }
      if (m < 1 && s.from) {
        const out = new Float32Array(N * 2);
        for (let j = 0; j < N * 2; j++) out[j] = lerp(s.from[j], pose[j], em);
        s.cur = out;
        s.fill = lerp(s.fromFill, s.tFill, em); s.stroke = lerp(s.fromStroke, s.tStroke, em);
      } else {
        s.cur = pose; s.fill = s.tFill; s.stroke = s.tStroke;
      }
      const el = ps[i].nativeElement;
      el.setAttribute('d', toPath(s.cur));
      el.style.fillOpacity = s.fill.toFixed(3);
      el.style.strokeOpacity = s.stroke.toFixed(3);
      el.setAttribute('data-ink', s.ink);
    });
    return moving;
  }
}
