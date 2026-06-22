# Accessibility — FVDR Foundations

Target: **WCAG 2.1 Level AA**. These rules apply to every FVDR DS component and prototype. The `accessibility-reviewer` agent and `/page-review` audit against this file.

---

## 1. Color & contrast (WCAG 1.4.3 / 1.4.11)

- **Body text:** ≥ **4.5:1** against its background.
- **Large text** (≥ 18px regular / 14px bold) and **UI components / icons / borders:** ≥ **3:1**.
- Never convey meaning by color alone (1.4.1) — pair status color with an icon or text (e.g. error = red **+** `error` icon **+** message).

### Token contrast reference (on white #FFFFFF)
| Token | Hex | Ratio | Safe for |
|---|---|---|---|
| `--color-text-primary` | #1F2129 | ~16:1 | any text ✅ |
| `--color-text-secondary` | #5F616A | ~5.9:1 | body text ✅ |
| `--color-stone-700` | #73757F | ~4.6:1 | body text ✅ (borderline) |
| `--color-text-placeholder` / `--color-stone-600` | #9C9EA8 | ~2.5:1 | **placeholder only** — ❌ as real text |
| `--color-stone-500` | #BBBDC8 | ~1.8:1 | disabled / decorative only |
| `--color-primary-500` | #2C9C74 | ~3.1:1 | large text / UI accent ✅; ❌ small body text |
| `--color-primary-700` | #12695C | ~5.4:1 | text on white ✅ |
| `--color-error-600` | #E54430 | ~3.9:1 | large/UI ✅; small error text use with care |

Rule of thumb: **small text → `--color-text-primary` / `-secondary` / `primary-700`**. Lighter stones are for placeholders, disabled, borders, and decoration only.

---

## 2. Keyboard (2.1.1 / 2.1.2)

- Every interactive element reachable and operable by keyboard (Tab, Enter/Space, Esc, arrows where relevant).
- **No traps.** Modal/bottom-sheet/droplist must trap focus *while open* and **restore focus** to the trigger on close.
- Esc closes overlays (modal, droplist, side panel).
- Custom interactive elements must be a real `<button>`/`<a>` or have `tabindex="0"` + key handlers.

---

## 3. Focus visibility & order (2.4.7 / 2.4.3)

- Visible focus indicator on every focusable element. Standard:
  ```css
  :focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
  ```
- **Never** `outline: none` without an equivalent visible replacement.
- DOM/tab order matches the visual reading order.
- On overlay open, move focus into it; on close, return focus to the trigger.

---

## 4. Names, roles, values (4.1.2)

- **Icon-only buttons require `aria-label`** (e.g. close, more, edit). An `<fvdr-icon>` is decorative — it carries no accessible name.
- Inputs have an associated `<label>` (or `aria-label`/`aria-labelledby`). `placeholder` is **not** a label.
- Custom controls expose correct `role` + state: `aria-expanded` (dropdown/accordion), `aria-checked` (toggle/checkbox), `aria-selected` (tabs/options), `aria-disabled`.
- Tabs: `role="tablist"`/`tab`/`tabpanel` with `aria-selected` and arrow-key navigation.

---

## 5. Target size (2.5.8)

- Interactive targets ≥ **24×24 CSS px**. FVDR button heights: `s` 32 / `m` 40 / `l` 48 — all pass. Audit **icon buttons** and dense table-row actions specifically.

---

## 6. Status messages (4.1.3)

- Toasts and inline messages must be announced without focus change:
  - Toasts: `role="status"` (polite) — or `role="alert"` for errors.
  - Form validation: associate the error with the field (`aria-describedby`) and set `aria-invalid="true"`.

---

## 7. Motion & preferences (2.3.3)

- Honor `prefers-reduced-motion`: disable/soften non-essential transitions.
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
  ```
- No content flashing more than 3×/second (2.3.1).

---

## 8. Dark theme

All contrast minimums apply in `.dark-theme` too. Verify token pairs against the **dark** background, not just light — a pair that passes on white may fail on a dark surface.

---

## Component a11y quick map
| Component | Must have |
|---|---|
| `fvdr-btn` | accessible label (text or `aria-label` for icon-only); focus ring; `disabled` state |
| `fvdr-input` / `textarea` | associated label; `aria-invalid` + described error on error state |
| `fvdr-dropdown` / `multiselect` | `aria-expanded`, keyboard open/arrow/select, focus trap in panel |
| `fvdr-modal` / `bottom-sheet` | focus trap, Esc to close, focus restore, labelled by title |
| `fvdr-toast` | `role="status"` / `alert` |
| `fvdr-tabs` | `tablist`/`tab`/`tabpanel`, `aria-selected`, arrow keys |
| `fvdr-toggle` / `checkbox` | `aria-checked`, label, keyboard toggle |
| icon-only controls | `aria-label` |
