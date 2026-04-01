# Archive Form — Component Spec

**Status:** Live
**Category:** Forms
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Inline form for creating or editing an archive. Opens within the Archives column. Contains name input, document scope radio, recycle bin toggle, reports dropdown, Q&A toggle.

---

## Anatomy

```
┌────────────────────────────────────────┐
│ .arch-form (border, r=4, pad=16)       │
│ .arch-form__title                      │
│ .field > label + <fvdr-input>          │
│ .field > label + <fvdr-radio>          │
│ .field.field--row > label + <toggle>   │
│ .field > label + <fvdr-dropdown>       │
│ .field.field--row > label + <toggle>   │
│ ─────────────────────────────────────  │
│ .arch-form__footer                     │
│  [trash Delete]   [Add & Dup] [Add]    │
└────────────────────────────────────────┘
```

---

## Tokens Used

| Property | Token |
|----------|-------|
| Border | `--color-border` |
| Border radius | `--radius-sm` |
| Title color | `--color-text-primary` |
| Label color | `--color-text-primary` |
| Hint color | `--color-text-muted` |
| Delete btn color | `--color-danger` |

---

## DS Components Used

- `<fvdr-input>` — Archive name
- `<fvdr-radio>` — Document scope (horizontal)
- `<fvdr-toggle>` — Include recycle bin / Include Q&A
- `<fvdr-dropdown>` — Reports scope
- `<fvdr-btn>` — Add and duplicate (secondary), Add (primary), Delete (link-btn--red)

---

## States

| State | Description |
|-------|-------------|
| New archive | Title shows "Archive N" |
| Edit mode | Title shows archive name, form pre-populated |

---

## Cross-references

- `archive-card.md`
- `order-footer.md`
