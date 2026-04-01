# Recipient Form — Component Spec

**Status:** Live
**Category:** Forms
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Inline form for adding a USB delivery recipient. Collects contact and shipping information. Opens within the Recipients column.

---

## Fields

| Field | Component | Notes |
|-------|-----------|-------|
| Email | `<fvdr-input type="email">` | — |
| Full name | `<fvdr-input iconLeft="participants">` | — |
| Phone number | `<fvdr-phone-input>` | — |
| Company | `<fvdr-input>` | — |
| Country | `<fvdr-dropdown>` | Luxembourg, Germany, France, UK |
| Estimated delivery | Static date display | Sep 20, 2023 |
| City | `<fvdr-input>` | — |
| Postal/ZIP code | `<fvdr-input>` | — |
| Address | `<fvdr-input>` | Hint: "Indicate a physical address, not PO box" |

---

## Tokens Used

| Property | Token |
|----------|-------|
| Border | `--color-border` |
| Border radius | `--radius-md` (8px — differs from archive form) |
| Label color | `--color-text-primary` |
| Hint color | `--color-text-muted` |
| Estimated date color | `--color-text-primary` |
| Delete btn color | `--color-danger` |

---

## Footer

- Left: Delete button (link-btn--red, trash icon)
- Right: `<fvdr-btn label="Add">` (primary, size m)

---

## Cross-references

- `recipient-card.md`
- `order-footer.md`
