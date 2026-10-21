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
 * swings between two poses (A ⇄ B) on its own delay — that is the "action".
 */
export type MorphScene =
  | 'logo' | 'search' | 'folder' | 'read' | 'compare' | 'lock' | 'activity' | 'qa' | 'report' | 'redact';

type Ink = 'line' | 'mint' | 'ink';
interface SlotDef { a: string; b?: string; fill?: number; stroke?: number; ink?: Ink; delay?: number; }
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

// Logo: the sidebar sphere's four ellipses, left-tangent, scaled into the 48 box.
const LOGO: SlotDef[] = [1, 0.75, 0.5, 0.25].map((k, i) => {
  const rx = 20 * k, ry = 20 * [1, 0.875, 0.75, 0.5][i];
  return { a: ellipse(4 + rx, 24, rx, ry), stroke: 1, fill: 0, ink: 'line' as Ink };
});

const PAGE = poly([[12, 5], [30, 5], [38, 13], [38, 43], [12, 43]]);

export const SCENES: Record<Exclude<MorphScene, 'logo'>, SceneDef> = {
  // Lens glides over the lines it is reading
  search: { period: 2.2, slots: [
    { a: ellipse(20, 20, 11), b: ellipse(25, 22, 11), stroke: 1 },
    { a: bar(31.5, 31.5, 12, 4, 45), b: bar(36.5, 33.5, 12, 4, 45), fill: 1, stroke: 0 },
    { a: rect(13.5, 17, 13, 2.6, 1.3), b: rect(18.5, 19, 13, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(13.5, 22, 9, 2.6, 1.3), b: rect(18.5, 24, 9, 2.6, 1.3), fill: 1, stroke: 0 },
  ] },
  // Flap tips open, two sheets rise out of the folder
  folder: { period: 2.4, order: [0, 2, 3, 1], slots: [
    { a: poly([[5, 12], [17, 12], [21, 16], [43, 16], [43, 40], [5, 40]]), stroke: 1 },
    { a: poly([[5, 21], [43, 21], [43, 40], [5, 40]]), b: poly([[9, 26], [47, 26], [43, 40], [5, 40]]), stroke: 1, fill: 0.12 },
    { a: rect(10, 19, 20, 16, 1.5), b: rect(10, 11, 20, 16, 1.5), stroke: 1, delay: 0.05 },
    { a: rect(17, 21, 20, 14, 1.5), b: rect(17, 14, 20, 14, 1.5), stroke: 1, delay: 0.12 },
  ] },
  // Lines fill in one after another, like being read
  read: { period: 2.4, slots: [
    { a: PAGE, stroke: 1 },
    { a: rect(17, 18, 3, 2.6, 1.3), b: rect(17, 18, 16, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(17, 24, 3, 2.6, 1.3), b: rect(17, 24, 12, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint', delay: 0.15 },
    { a: rect(17, 30, 3, 2.6, 1.3), b: rect(17, 30, 16, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint', delay: 0.3 },
  ] },
  // Two versions part, the changed lines light up
  compare: { period: 2.4, slots: [
    { a: rect(7, 9, 17, 30, 2), b: rect(4, 9, 17, 30, 2), stroke: 1 },
    { a: rect(24, 9, 17, 30, 2), b: rect(27, 9, 17, 30, 2), stroke: 1 },
    { a: rect(10.5, 17, 10, 2.6, 1.3), b: rect(7.5, 17, 10, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(27.5, 23, 10, 2.6, 1.3), b: rect(30.5, 23, 10, 2.6, 1.3), fill: 1, stroke: 0, ink: 'mint' },
  ] },
  // Shackle lifts: access checked
  lock: { period: 2.2, slots: [
    { a: rect(11, 21, 26, 20, 3), stroke: 1 },
    { a: 'M16 21V15A8 8 0 0 1 32 15V21H29V15A5 5 0 0 0 19 15V21Z',
      b: 'M16 16V10A8 8 0 0 1 32 10V16H29V10A5 5 0 0 0 19 10V16Z', fill: 1, stroke: 0 },
    { a: ellipse(24, 29, 2.4), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(23, 30, 2, 5, 1), fill: 1, stroke: 0, ink: 'mint' },
  ] },
  // Engagement bars grow in turn
  activity: { period: 2.2, slots: [
    { a: rect(5, 7, 38, 34, 3), stroke: 1 },
    { a: rect(11, 26, 6, 10, 1), b: rect(11, 18, 6, 18, 1), fill: 1, stroke: 0 },
    { a: rect(21, 20, 6, 16, 1), b: rect(21, 26, 6, 10, 1), fill: 1, stroke: 0, ink: 'mint', delay: 0.15 },
    { a: rect(31, 24, 6, 12, 1), b: rect(31, 13, 6, 23, 1), fill: 1, stroke: 0, delay: 0.3 },
  ] },
  // Drafting a Q&A answer: typing dots in a bubble
  qa: { period: 1.3, slots: [
    { a: 'M10 8H38A4 4 0 0 1 42 12V30A4 4 0 0 1 38 34H21L13 41V34H10A4 4 0 0 1 6 30V12A4 4 0 0 1 10 8Z', stroke: 1 },
    { a: ellipse(16, 21, 2.5), b: ellipse(16, 18, 2.5), fill: 1, stroke: 0 },
    { a: ellipse(24, 21, 2.5), b: ellipse(24, 18, 2.5), fill: 1, stroke: 0, ink: 'mint', delay: 0.15 },
    { a: ellipse(32, 21, 2.5), b: ellipse(32, 18, 2.5), fill: 1, stroke: 0, delay: 0.3 },
  ] },
  // Report assembling: the chart fills, the summary line grows
  report: { period: 2.6, slots: [
    { a: rect(10, 5, 28, 38, 3), stroke: 1 },
    { a: ellipse(24, 19, 7.5), stroke: 1 },
    { a: wedge(24, 19, 7.5, 40), b: wedge(24, 19, 7.5, 250), fill: 1, stroke: 0, ink: 'mint' },
    { a: rect(15, 33, 6, 2.6, 1.3), b: rect(15, 33, 18, 2.6, 1.3), fill: 1, stroke: 0, delay: 0.2 },
  ] },
  // Lines blacked out one by one
  redact: { period: 2.4, slots: [
    { a: PAGE, stroke: 1 },
    { a: rect(17, 18, 16, 2, 1), b: rect(16, 16.5, 18, 5, 1), fill: 1, stroke: 0, ink: 'ink' },
    { a: rect(17, 24, 12, 2, 1), b: rect(16, 22.5, 14, 5, 1), fill: 1, stroke: 0, ink: 'ink', delay: 0.15 },
    { a: rect(17, 30, 16, 2, 1), b: rect(16, 28.5, 18, 5, 1), fill: 1, stroke: 0, ink: 'ink', delay: 0.3 },
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

interface Slot {
  cur: Pts; fill: number; stroke: number;          // what is on screen now
  from?: Pts; fromFill: number; fromStroke: number; // transition start
  a: Pts; b: Pts | null; tFill: number; tStroke: number; ink: Ink; delay: number;
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
      const a = sample(d.a);
      return { cur: a, fill: d.fill ?? 0, stroke: d.stroke ?? 1, fromFill: 0, fromStroke: 1,
        a, b: d.b ? align(a, sample(d.b)) : null, tFill: d.fill ?? 0, tStroke: d.stroke ?? 1, ink: d.ink ?? 'line', delay: d.delay ?? 0 };
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
      s.a = align(s.cur, sample(d.a));
      s.b = d.b ? align(s.a, sample(d.b)) : null;
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
      // pose inside the scene: A ⇄ B on this slot's delay
      let pose = s.a;
      if (s.b && !this.reduced) {
        const tau = Math.max(0, (now - this.loopStart) / 1000 / period - s.delay);
        const k = (1 - Math.cos(tau * Math.PI * 2)) / 2;
        const out = new Float32Array(N * 2);
        for (let j = 0; j < N * 2; j++) out[j] = lerp(s.a[j], s.b[j], k);
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
