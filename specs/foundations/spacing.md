# Spacing — Foundation Spec

Source: `src/tokens.css` — `--space-N` aliases → `--primitive-space-N`
Grid: 4px base unit

---

## Spacing Scale

| Name | Alias Token | Primitive | px Value | Typical Usage |
|------|-------------|-----------|----------|---------------|
| Space 1 | `--space-1` | `--primitive-space-1` | 4px | Icon padding, tiny gaps |
| Space 2 | `--space-2` | `--primitive-space-2` | 8px | Inner padding, small gaps, breadcrumb pad |
| Space 3 | `--space-3` | `--primitive-space-3` | 12px | Banner padding, modal body pad |
| Space 4 | `--space-4` | `--primitive-space-4` | 16px | Standard padding, list items, card inner |
| Space 5 | `--space-5` | `--primitive-space-5` | 20px | Section margins, banner margin |
| Space 6 | `--space-6` | `--primitive-space-6` | 24px | Page padding, section padding, header padding |
| Space 8 | `--space-8` | `--primitive-space-8` | 32px | Column gap in order view |
| Space 10 | `--space-10` | `--primitive-space-10` | 40px | — |
| Space 12 | `--space-12` | `--primitive-space-12` | 48px | Column header height |
| Space 16 | `--space-16` | `--primitive-space-16` | 64px | Header height (fixed component size) |
| Space 18 | `--space-18` | `--primitive-space-18` | 72px | Sidebar footer height, icon zone width |

---

## Fixed Component Sizes (not spacing tokens)

These are structural/component-specific dimensions that should NOT be replaced with spacing tokens:

| Component | Value | Property |
|-----------|-------|----------|
| Sidebar expanded | 280px | `width` |
| Sidebar collapsed | 72px | `width` |
| Header | 64px | `height` |
| Sidebar footer | 72px | `height` |
| Nav item | 32px | `height` |
| Nav icon zone | 72px | `width` |
| Nav icon | 24px | `font-size` |
| Column recipients | 544px | `width` |
| Modal default | 480–512px | `width` |

---

## Usage Rules

1. Always use `var(--space-N)` for padding, margin, gap values in UI components.
2. Never write raw `16px`, `24px`, etc. in CSS — always reference the token.
3. Exceptions: `1px` borders, `100%`, `0`, and fixed component structural sizes listed above.
4. For inline Angular styles in the `styles: [...]` array, same rules apply.
