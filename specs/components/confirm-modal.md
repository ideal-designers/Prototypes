# Confirm Modal — Component Spec

**Status:** Live
**Category:** Overlay / Feedback
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Confirmation modal for placing the USB drive order. Optional textarea for specific requirements. Triggered by the Order Footer's Confirm button.

---

## Anatomy

```
┌──────────────────────────────────┐ w=480px
│ .overlay (rgba(0,0,0,0.45))      │
│  ┌────────────────────────────┐  │
│  │ .modal (r=12, shadow)      │  │
│  │ .modal__hdr                │  │
│  │   "Confirm order"    [✕]   │  │
│  │────────────────────────────│  │
│  │ .modal__body               │  │
│  │   <label> Specific req.    │  │
│  │   <textarea>               │  │
│  │   <span> 0/1000            │  │
│  │────────────────────────────│  │
│  │ .modal__footer             │  │
│  │   [Cancel]         [Order] │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## Tokens Used

| Property | Token |
|----------|-------|
| Overlay bg | `--color-overlay-light` |
| Modal bg | `--color-bg-page` |
| Modal border radius | `--radius-lg` (12px) |
| Modal shadow | `--shadow-modal` |
| Z-index | `--z-modal` |
| Title color | `--color-text-primary` |
| Close icon color | `--color-icon` |
| Textarea border | `--color-border` |
| Textarea focus border | `--color-interactive-primary` |
| Placeholder color | `--color-text-placeholder` |
| Char count color | `--color-text-disabled` |

---

## Behavior

- Closes on overlay click
- Closes on cancel button
- Textarea: maxlength 1000, char count shown
- Order button: calls `placeOrder()` → fires tracker task

---

## DS Components

- `<fvdr-btn variant="ghost" label="Cancel">` 
- `<fvdr-btn label="Order">`
- Custom `<textarea>` (DS fvdr-textarea could be used as refactor)

---

## Cross-references

- `order-footer.md`
- Motion: overlay background uses `--color-overlay-light`
