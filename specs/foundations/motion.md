# Motion — Foundation Spec

Source: `src/tokens.css` — `--duration-*` and `--ease*` aliases

---

## Duration Scale

| Name | Alias Token | Primitive | Value | Usage |
|------|-------------|-----------|-------|-------|
| Fast | `--duration-fast` | `--primitive-duration-fast` | 120ms | Color transitions (hover, focus), icon opacity |
| Base | `--duration-base` | `--primitive-duration-base` | 150ms | General transitions (border-color, opacity), animation fadeIn |
| Slow | `--duration-slow` | `--primitive-duration-slow` | 200ms | Nav chevron rotate, trigger chevron rotate |
| X-Slow | `--duration-xslow` | `--primitive-duration-xslow` | 220ms | Sidebar width collapse/expand |

---

## Easing Functions

| Name | Alias Token | Value | Usage |
|------|-------------|-------|-------|
| Ease | `--ease` | `ease` | Sidebar transition, button hover |
| Ease in-out | `--ease-in-out` | `ease-in-out` | Toast slide in/out |

---

## Common Transition Patterns

| Pattern | CSS | Tokens |
|---------|-----|--------|
| Sidebar collapse | `width 0.22s ease, min-width 0.22s ease` | `var(--duration-xslow) var(--ease)` |
| Color/border hover | `color 0.12s` / `border-color 0.15s` | `var(--duration-fast)` / `var(--duration-base)` |
| Opacity | `opacity 0.12s` | `var(--duration-fast)` |
| Background | `background 0.12s` | `var(--duration-fast)` |
| Transform (rotate) | `transform 0.2s` | `var(--duration-slow)` |
| Toast slide | `transform 0.3s ease-in-out, opacity 0.3s ease-in-out` | 300ms (custom, close to `--duration-slow`) |

---

## Animation Keyframes Found in Codebase

| Name | Used In | Description |
|------|---------|-------------|
| `fadeIn` | CA modal overlay | `opacity 0 → 1` over 150ms |
| `slideUp` | CA modal | `translateY(6px) → 0` + opacity over 180ms |

---

## Notes

- Always prefer tokens over raw millisecond values.
- 300ms toast animation slightly exceeds the scale; this is acceptable as it's an intentional UX duration.
- Dark theme overrides do not alter transitions — same durations apply.
