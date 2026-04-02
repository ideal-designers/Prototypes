# Component: fvdr-droplist

Category: Organism
Status: stable
Figma: node `15032-13916` (file `liyNDiFf1piO8SQmHNKoeU`)

---

## Overview

Context menu / action list. Positioned absolutely relative to a trigger. Use for action menus, inline dropdowns, and option lists.

---

## Anatomy

```
.droplist                  ← white card, border, shadow-popover, radius-md
├── .search-row            ← optional search input (searchable=true)
└── .droplist-item × N     ← 36px row, icon? + label + rightText? + badge?
    └── .divider           ← optional separator after item
```

---

## API

```html
<div style="position: relative">
  <fvdr-btn label="Actions" variant="ghost" (clicked)="open = !open" />

  <fvdr-droplist
    *ngIf="open"
    [items]="items"
    style="position: absolute; top: 44px; right: 0; z-index: 100"
    (itemClicked)="onAction($event)"
    (closed)="open = false"
  />
</div>
```

```typescript
// DroplistItem = {
//   id: string
//   label: string
//   icon?: FvdrIconName
//   rightText?: string
//   badge?: string
//   disabled?: boolean
//   dividerAfter?: boolean
//   variant?: 'default' | 'danger'
// }

items: DroplistItem[] = [
  { id: 'edit',   label: 'Edit',   icon: 'edit' },
  { id: 'share',  label: 'Share',  icon: 'share', dividerAfter: true },
  { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
];
```

| Input | Type | Description |
|-------|------|-------------|
| `items` | `DroplistItem[]` | Menu items |
| `value` | `string` | Currently selected id (highlights row) |
| `searchable` | `boolean` | Shows search input at top |

| Output | Payload | When |
|--------|---------|------|
| `(itemClicked)` | `DroplistItem` | Item clicked |
| `(closed)` | — | Click outside |

---

## Tokens Used

| Property | Token |
|----------|-------|
| Background | `--color-bg-page` |
| Border | `--color-border` |
| Shadow | `--shadow-popover` |
| Border radius | `--radius-md` (8px) |
| Item height | `36px` |
| Item padding | `0 --space-3` (0 12px) |
| Item hover | `--color-hover-bg` |
| Danger item | `--color-danger` |

---

## Dark Theme

```css
.dark-theme .droplist          { background: #292D2F; border-color: #33383B; }
.dark-theme .droplist-item:hover { background: #33383B; }
.dark-theme .droplist-item--danger { color: var(--color-danger); }
```
