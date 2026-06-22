---
description: Review a single DS component for API quality, token compliance, a11y, and showcase completeness
argument-hint: <component name or path, e.g. fvdr-multiselect>
---

Review the DS component: **$ARGUMENTS**

If no component was named, list the members of `DS_COMPONENTS` (`src/app/shared/ds/index.ts`) and ask which one.

Locate the component under `src/app/shared/ds/components/` and check:

1. **API design** — inputs/outputs named and typed consistently with sibling components (size `s|m|l`, variant naming, `(valueChange)`/`ngModel` conventions). `ControlValueAccessor` implemented if it's a form control.
2. **Token compliance** — run `node scripts/token-audit.js`; confirm only `var(--token)` in CSS, `<fvdr-icon>` not inline SVG. Delegate depth to **design-system-guardian** if violations look non-trivial.
3. **States** — default, hover, focus, active, disabled, error/success where relevant. Dark-theme correct.
4. **Accessibility** — keyboard operable, focus visible, ARIA/labels. Delegate to **accessibility-reviewer** for a full WCAG pass.
5. **Showcase completeness** (per CLAUDE.md) — there must be a `ds-doc-block` with `whenToUse`, `whenNotToUse`, `aiPrompt`, a live preview, and a `navCategories` entry. Flag if missing or stale.

Output: a findings list grouped 🔴/🟡/🟢 with `file:line` and the exact fix. State clearly whether the component is showcase-complete.
