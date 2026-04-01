# Elevation — Foundation Spec

Source: `src/tokens.css` — `--shadow-*` and `--z-*` aliases

---

## Box Shadow Scale

| Name | Alias Token | Value | Usage |
|------|-------------|-------|-------|
| None | `--shadow-none` | `none` | No shadow |
| Card | `--shadow-card` | `0 1px 4px rgba(0,0,0,0.08)` | Subtle card elevation |
| Hover | `--shadow-hover` | `0 4px 12px rgba(44,156,116,0.12)` | Card hover with brand tint |
| Modal | `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.2)` | Modal dialogs |
| Toast | `--shadow-toast` | `0 4px 16px rgba(0,0,0,0.14)` | Toast notifications |
| Popup | `--shadow-popup` | `0 4px 16px rgba(0,0,0,0.12)` | Droplist, dropdowns, popups |

---

## Component Shadow Usage

| Component | Token | Notes |
|-----------|-------|-------|
| Confirm modal | `--shadow-modal` | Replaces `0 8px 32px rgba(0,0,0,.18)` |
| CA modal | `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.2)` |
| Droplist | `--shadow-popup` | `0 4px 16px rgba(0,0,0,0.12)` |
| Toast | `--shadow-toast` | `0 4px 16px rgba(0,0,0,0.14)` |
| Chat bubble | `--shadow-toast` | `0 4px 16px rgba(0,0,0,.18)` ≈ toast |
| Theme toggle label | `0 2px 8px rgba(0,0,0,0.10)` | Close to `--shadow-card`, context specific |

---

## Z-Index Scale

| Name | Alias Token | Value | Usage |
|------|-------------|-------|-------|
| Tooltip | `--z-tooltip` | 10 | Tooltips, theme-toggle label |
| Sticky | `--z-sticky` | 20 | Sticky headers |
| Dropdown | `--z-dropdown` | 100 | Dropdowns, droplists |
| Modal | `--z-modal` | 1000 | Modal overlays |
| Toast | `--z-toast` | 2000 | Toast notifications |

---

## Notes

- Never use raw z-index numbers; always reference `var(--z-*)`.
- The overlay background colors are semantic: `var(--color-overlay-light)` (0.45 opacity) for archive modal, `var(--color-overlay-dark)` (0.6 opacity) for CA modals.
