# Thinking Orbs — authoritative reference

The designer supplied MetalForge's own SwiftUI and React/WebGPU sources. This is
the extracted algorithm for the **`twinkle`** preset. Port it exactly; do not
re-derive the maths.

> **Render with Canvas 2D, not WebGPU.** The React original uses WebGPU only to
> rasterise the dots — dot *generation* is plain JS. WebGPU has real support gaps
> (their own code ships a "browser doesn't support WebGPU" error path). For a 46px
> pill with a few hundred dots, Canvas 2D is ample and has no caveats.

## Preset (from the designer's URL)

`effect=thinking-orbs style=twinkle` → **style index 2**, `PERIOD = 4.6` seconds.

| knob | value | meaning |
|---|---|---|
| `speed` | 1 | phase multiplier |
| `reverse` | 0 | |
| `startAt` (phase) | 0 | |
| `n` (dots) | **2.6** | dot-count multiplier → `NC(150, 2.6)` = 390 dots |
| `sp` (spread) | 1 | radius multiplier |
| `pv` (perspective) | **3.2** | `f = 3.5 * pv` |
| `dz` (depthSize) | 1 | depth → dot radius |
| `df` (depthFade) | 1 | depth → alpha |
| `op` (dotOpacity) | 1 | |
| `sn` (spin) | **-3** | extra yaw turns per period |
| `yw` (turn/yaw) | **-169°** | → radians |
| `pc` (tilt/pitch) | **-15°** | → radians |
| `dotScale` | 1 | |

## Maths

```js
const TAU = Math.PI * 2;
const NC = (c, n) => Math.max(1, Math.round(c * n));
const cl = u => u < 0 ? 0 : u > 1 ? 1 : u;

// per-dot phase offset — golden ratio, deterministic (NOT random)
const h1 = i => (i * 0.61803398875) % 1;

// even distribution on a sphere — golden angle spiral
const fib = (i, N) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const th = i * 2.399963;
  return [Math.cos(th) * r, y, Math.sin(th) * r];
};

// rotate yaw then pitch; p = [x, y, z, radiusMul, alphaMul, colour?]
const rot = (p, ay, ax) => {
  const ca = Math.cos(ay), sa = Math.sin(ay);
  const X = p[0] * ca - p[2] * sa;  let Z = p[0] * sa + p[2] * ca;
  const cb = Math.cos(ax), sb = Math.sin(ax);
  const Y = p[1] * cb - Z * sb;         Z = p[1] * sb + Z * cb;
  return [X, Y, Z, p[3], p[4], p[5]];
};

// view transform — applies the yaw knob plus the accumulating spin
const VIEW = (p, K) => rot(p, K.yw + TAU * K.sn * K.t, K.pc);
```

### The twinkle draw (style 2)

```js
function drawTwinkle(t, S, K) {          // t = phase 0..1, S = box size in px
  const N = NC(150, K.n);
  const pts = [];
  for (let i = 0; i < N; i++) {
    const p = fib(i, N);
    // sharp blink: ^6 keeps each dot dark most of the cycle, so the surface
    // shimmers rather than pulsing in unison. 2*t = two blinks per turn.
    const b = Math.pow(0.5 + 0.5 * Math.sin(TAU * (2 * t + h1(i))), 6);
    pts.push(rot([p[0], p[1], p[2], 0.55 + 1.5 * b, 0.2 + 0.8 * b], TAU * t, 0.36));
  }
  P3(pts, S, K, 0.3);
}
```

Note the draw itself spins a full turn per period (`TAU * t`) with a fixed 0.36 rad
tilt, *and* `VIEW` adds the `yw`/`sn` knobs on top. Both are needed.

### Projection (P3)

```js
function P3(pts, S, K, RF) {
  const cx = S / 2, cy = S / 2;
  const R = S * (RF || 0.3) * K.sp;
  const f = 3.5 * K.pv;
  const out = [];
  for (const p0 of pts) {
    const p = VIEW(p0, K);
    const z = p[2];
    const per = f / (f - z);               // perspective divide
    const d = cl((z + 1.1) / 2.2);         // 0 = far, 1 = near
    out.push([
      cx + p[0] * R * per,
      cy + p[1] * R * per,
      K.ds * (0.4 + 1.6 * K.dz * d) * per * (p[3] ?? 1),          // radius
      (0.07 + 0.93 * Math.pow(d, 1.55 * K.df)) * (p[4] ?? 1),     // alpha
      p[5] || K.dot,                                              // colour
      z,
    ]);
  }
  out.sort((a, b) => a[5] - b[5]);   // back to front — index 5 is z here
  for (const o of out) K.d(o[0], o[1], o[2], o[3], o[4]);
}
```

Careful: in `P3` the pushed tuple is `[x, y, r, a, colour, z]`, so the sort key is
index **5** (`z`). (The upstream file has three near-duplicate `P3` variants sorting
on 5, 6 and `5+1`; only this one matters.)

### Fit-to-box pass

Before drawing, the original probes 20 evenly spaced frames with a no-op sink to
find the widest extent, then scales so the animation never clips:

```js
function fitFactor(S, K) {                    // cache by size + knobs
  const h = S / 2;
  let ext = 0;
  const probe = { ...K, ds: 1, t: 0, d: (x, y, r, a) => {
    if (a <= 0.05 || r <= 0.15) return;
    ext = Math.max(ext, Math.abs(x - h) + r * 0.5, Math.abs(y - h) + r * 0.5);
  }};
  for (let k = 0; k < 20; k++) { probe.t = k / 20; drawTwinkle(k / 20, S, probe); }
  return ext > 1 ? Math.max(0.55, Math.min(1.7, (S * 0.415) / ext)) : 1;
}
```

Applied per dot when emitting:
`fx = h + (x - h) * f`, `fy = h + (y - h) * f`, `fr = r * (0.55 + 0.45 * f)`,
`fa = a * K.op`; skip when `fr <= 0.05` or `fa <= 0.004`.

**Cache the fit factor** keyed by size + knobs — it runs 20 full draws and must not
happen every frame.

### Size-dependent dot scale

```js
const sizeDotScale = S =>
  S <= 46  ? 0.4
: S <= 190 ? 0.4 + ((S - 46)  / 144) * 0.6
: S <= 340 ? 1   + ((S - 190) / 150) * 0.55
:            1.55;
```

### Phase

```js
function orbPhase(period, speed, seconds, reverse, startAt) {
  const span = period / Math.max(0.0001, speed);
  let u = (Math.max(0, seconds) % span) / span;
  if (u < 0) u += 1;
  if (reverse) u = 1 - u;
  u = (u + (startAt ?? 0)) % 1;
  return u < 0 ? u + 1 : u;
}
```

## Pill geometry (from the SwiftUI/React source)

- orb box **46×46**, gap to label **9px**
- pill padding: top 7, bottom 7, **left 8, right 22** (with a label);
  7 on all sides when the label is hidden
- `border-radius: 999px`
- label: **14px monospace**, opacity **0.74**, `white-space: nowrap`
- no pill → no background, no padding

## Our adaptation

- **Colours come from FVDR tokens, not their hex.** Dots default to
  `--color-primary-500`; pill and label use existing surface/text tokens and must
  work in light and dark. Canvas can't read `var()` — resolve the computed value
  and re-resolve on theme change.
- The upstream `accent` colour is unused by the twinkle style (no dot ever sets
  index 5), so a single dot colour is enough. Keep an `accent` input only if a
  future style needs it.
- Monospace for the label is their house style; use the FVDR font unless the
  designer asks otherwise.
