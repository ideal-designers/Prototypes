# Component: fvdr-modal

Category: Organism
Status: stable
Figma: node `15032-15799` (file `liyNDiFf1piO8SQmHNKoeU`)

---

## Overview

Full-screen overlay dialog. Use for confirmations, forms, and destructive actions. Always requires explicit user action to dismiss.

---

## Anatomy

```
.overlay          ← rgba(0,0,0,0.48), z-index: 1000
└── .modal        ← white card, border-radius: 8px, shadow-popover
    ├── .modal-header   ← title (Sub2 18px/600) + close button
    ├── .modal-body     ← scrollable content slot
    └── .modal-footer   ← right-aligned action buttons, gap: 8px
```

---

## Sizes

| size | width |
|------|-------|
| `s`  | 400px |
| `m`  | 520px |
| `l`  | 640px |
| `xl` | 800px |

---

## API

```html
<fvdr-modal
  [visible]="show"
  title="Confirm Delete"
  size="m"
  confirmLabel="Delete"
  confirmVariant="danger"
  cancelLabel="Cancel"
  [closeOnOverlay]="true"
  (confirmed)="onConfirm()"
  (cancelled)="show = false"
  (closed)="show = false"
>
  <p>Are you sure?</p>
</fvdr-modal>
```

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `visible` | `boolean` | `false` | Show/hide modal |
| `title` | `string` | — | Header title |
| `size` | `s\|m\|l\|xl` | `m` | Modal width |
| `confirmLabel` | `string` | `'Confirm'` | Primary button label |
| `confirmVariant` | `primary\|danger` | `primary` | Primary button style |
| `cancelLabel` | `string` | `'Cancel'` | Cancel button label |
| `closeOnOverlay` | `boolean` | `true` | Click overlay to close |

| Output | Payload | When |
|--------|---------|------|
| `(confirmed)` | — | Primary button clicked |
| `(cancelled)` | — | Cancel button clicked |
| `(closed)` | — | Any dismiss (overlay, X, cancel) |

---

## States

- **Default**: visible with fade+scale animation (0.15s ease)
- **Loading**: set `[loading]="true"` on confirm button
- **Custom footer**: omit confirmLabel/cancelLabel and place buttons inside slot

---

## Tokens Used

| Property | Token |
|----------|-------|
| Overlay bg | `rgba(0,0,0,0.48)` |
| Modal bg | `--color-bg-page` |
| Border radius | `--radius-md` (8px) |
| Shadow | `--shadow-popover` |
| Title font | Sub2 — `18px / 600` |
| Footer gap | `--space-2` (8px) |
| z-index | `1000` |

---

## Dark Theme

```css
.dark-theme .modal        { background: #292D2F; }
.dark-theme .modal-header { border-bottom-color: #33383B; }
.dark-theme .modal-title  { color: #FFFFFF; }
.dark-theme .modal-close  { color: #8B949A; }
.dark-theme .modal-close:hover { background: #33383B; }
```
