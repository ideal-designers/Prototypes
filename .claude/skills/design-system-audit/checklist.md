# FVDR Design System — Audit Checklist

Severity: 🔴 = must fix (blocks merge) · 🟡 = warning (fix soon) · ⚪ = note.

## 1. Color
- 🔴 Any raw `#hex`, `rgb()`, `hsl()`, or CSS named color in `src/**` outside `tokens.css` and intentional `dark-theme` overrides. → map to a `--color-*` token.
- 🔴 Primary/CTA color not `--color-primary-500` (#2C9C74); hover not `-600`; active not `-700`.
- 🟡 Borders/dividers not `--color-divider` / `--color-stone-400`.
- 🟡 Text color not from the `--color-text-*` scale.

## 2. Spacing (4px grid)
- 🔴 Hardcoded `px` for padding/margin/gap that maps to a `--space-*` token (4/8/12/16/20/24/32/40/48).
- 🟡 Off-grid spacing (e.g. 5px, 13px, 18px) with no token — justify or fix.

## 3. Radius / shadow / typography
- 🔴 Hardcoded `border-radius` px → `--radius-*` (2/4/8/12/16/9999).
- 🔴 Hardcoded `box-shadow` → `--shadow-card` / `--shadow-popover` / `--shadow-toast`.
- 🔴 Hardcoded `font-size` → `--text-*` / `--font-size-*` token.
- 🟡 Font-size token used **without** px fallback. Must be `var(--font-size-md, 15px)` — these aren't loaded globally and silently break otherwise.

## 4. Icons
- 🔴 Inline `<svg>` where the name exists in `FvdrIconName` → `<fvdr-icon name="...">`.
- 🟡 Icon color set via `fill`/`stroke` instead of CSS `color`; size set in px instead of `font-size` (icon = 1em).
- ⚪ Needed icon missing from the set → extract from Figma (file `liyNDiFf1piO8SQmHNKoeU`, node `15846-7469`) and add to `icons.ts`. Do not leave inline SVG as a workaround.

## 5. Component reuse
- 🔴 Hand-rolled element duplicating a `DS_COMPONENTS` member (button, input, textarea, search, dropdown, multiselect, modal, table, tabs, chip, badge, avatar, toggle, checkbox, radio, status, etc.) → use the DS component.
- 🟡 A form control built without `ControlValueAccessor` (can't `[(ngModel)]`).
- 🟡 Prototype component not `standalone: true` or not importing `...DS_COMPONENTS`.

## 6. Showcase completeness (new DS components)
Per CLAUDE.md, a new DS component is **incomplete** until all are present:
- 🔴 No `ds-doc-block` on the `/ds` page (name, description, figmaNode, whenToUse, whenNotToUse, aiPrompt, live preview).
- 🔴 Not added to `navCategories`.
- 🟡 Component count in `showcase__stats` not bumped.
- 🟡 Not exported / not in `DS_COMPONENTS` array in `index.ts`.

## 7. Layout conventions
- 🟡 Content area not white + borderless (using cards/borders where dividers belong).
- 🟡 Grey background used outside the left sidebar.
- 🟡 Sidebar behavior not matching the documented desktop/tablet/mobile breakpoints (1440 / 1024).

## 8. Accessibility basics (full pass → accessibility-reviewer)
- 🔴 Icon-only button without `aria-label`.
- 🔴 `outline: none` on a focusable element with no visible replacement.
- 🟡 Input without an associated label.
- 🟡 Token pair below WCAG AA contrast for its use (e.g. placeholder color used as real body text).

## Quick grep starters
```bash
# hardcoded hex (excluding tokens.css)
grep -rnE '#[0-9a-fA-F]{3,8}\b' src --include=*.ts --include=*.css | grep -v tokens.css
# inline svg
grep -rn '<svg' src --include=*.ts
# outline:none
grep -rn 'outline:\s*none' src
# font-size token without fallback
grep -rnE 'var\(--font-size-[a-z]+\)' src
```
