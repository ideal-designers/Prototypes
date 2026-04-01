# Order Footer — Component Spec

**Status:** Live
**Category:** Layout / Actions
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Fixed footer bar at the bottom of the order view. Contains Cancel and Confirm action buttons. Confirm is disabled until at least one archive and one recipient exist.

---

## Anatomy

```
┌──────────────────────────────────────────────┐ h=auto
│ .order-footer (padding: 16px 24px)           │
│  border-top: 1px solid --color-border         │
│  bg: --color-bg-page                          │
│                                               │
│  [Cancel (ghost)]  [Confirm (primary, *)]     │
└──────────────────────────────────────────────┘
```

*Confirm disabled when `archives.length === 0 || recipients.length === 0`

---

## Tokens Used

| Property | Token |
|----------|-------|
| Border top | `--color-border` |
| Background | `--color-bg-page` |
| Gap | `--space-4` (16px) |
| Padding | `--space-4` `--space-6` (16px 24px) |

---

## DS Components

- `<fvdr-btn variant="ghost" label="Cancel">` — Cancel navigation
- `<fvdr-btn label="Confirm" [disabled]="...">` — Opens confirm modal

---

## Cross-references

- `confirm-modal.md` — Confirm button opens the modal
- `archive-form.md`, `recipient-form.md`
