# Breakpoints — Foundation Spec

Source:
- `src/tokens.css` — `--bp-*` CSS custom properties (reference / JS / container queries)
- `src/app/shared/ds/breakpoints.ts` — `BREAKPOINTS`, `MEDIA_UP` (functional source for TS + CSS literals)

Strategy: **mobile-first**, min-width thresholds.

> We do **not** use a column grid. Layout follows the **4px spacing grid**
> (see [`spacing.md`](./spacing.md)) plus the viewport breakpoints below.

---

## Breakpoint Scale

| Name | Token | px | Range it opens | Target |
|------|-------|----|----------------|--------|
| Mobile | `--bp-mobile` | 375px | 375 – 767 | Phones (base) |
| Tablet | `--bp-tablet` | 768px | 768 – 1023 | Tablets |
| Laptop | `--bp-laptop` | 1024px | 1024 – 1439 | Laptops / small desktop |
| Desktop | `--bp-desktop` | 1440px | ≥ 1440 | Large desktop |

375px is the smallest supported width (mobile baseline). Below 375px the mobile layout simply scales / scrolls — it is not a separate breakpoint.

---

## Usage

**CSS `@media`** — `var()` does **not** work inside `@media` conditions, so use the literal px (kept in sync with the tokens):

```css
/* mobile-first: base styles target mobile, layer up */
.card { ... }                              /* 375+ */
@media (min-width: 768px)  { .card { ... } }   /* tablet+  */
@media (min-width: 1024px) { .card { ... } }   /* laptop+  */
@media (min-width: 1440px) { .card { ... } }   /* desktop+ */
```

**TypeScript** — import the single source of truth:

```ts
import { BREAKPOINTS, MEDIA_UP } from '../../shared/ds';

if (window.matchMedia(MEDIA_UP.laptop).matches) { /* ≥1024 */ }
const isDesktop = window.innerWidth >= BREAKPOINTS.desktop; // ≥1440
```

---

## Notes

- **`<fvdr-sidebar-nav>`** predates this spec and uses a coarser 3-tier model
  (`BP_DESKTOP = 1440`, `BP_TABLET = 1024`, mobile `< 1024`) in
  `sidebar-nav.component.ts`. Its `desktop`/`laptop` thresholds match this scale;
  it just doesn't split tablet/mobile at 768. Leave as-is unless redesigned.
- Existing prototypes contain ad-hoc `@media` values (600, 700, 740, 760, 900,
  1080, 1100px). New work should snap to the four breakpoints above; migrate
  legacy values opportunistically, not in a big-bang pass.
