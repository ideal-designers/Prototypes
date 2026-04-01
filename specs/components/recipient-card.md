# Recipient Card — Component Spec

**Status:** Live
**Category:** Data Display
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Card displaying a recipient with USB drive count stepper per archive. Appears in the "Recipients" column of the order view.

---

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ .recip-card__icon-wrap  │ .recip-card__body       │
│  (bg=surface, 8px pad)  │  .recip-card__info      │
│  .recip-card__icon-btn  │   <strong> Name         │
│  (40×40, r=4)           │   <span> Est. delivery  │
│  participants icon      │  .recip-card__details   │
│                         │   .recip-arch-row ×N    │
│                         │    [arch name] [usb ste │
└──────────────────────────────────────────────────┘
```

---

## USB Stepper

Custom stepper (not using fvdr-number-stepper):
- Left/right chevron buttons
- Value display in 40×32 bordered box
- Min 1 per archive per recipient

---

## Tokens Used

| Property | Token |
|----------|-------|
| Border | `--color-border` |
| Border radius | `--radius-sm` |
| Icon wrap bg | `--color-bg-surface` |
| Name color | `--color-text-primary` |
| Sub text color | `--color-text-primary` |
| Arch row bg | `--color-bg-subtle` |
| Arch row border-radius | `--radius-sm` |
| USB input border | `--color-border-input` |
| USB icon color | `--color-icon` |
| Stepper btn color | `--color-icon` |
| Stepper btn hover | `--color-text-primary` |

---

## Cross-references

- `recipient-form.md` — Form for adding/editing recipients
- Icons: `participants`, `storage`, `chevron-left`, `chevron-right`
