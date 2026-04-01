# Archive Card — Component Spec

**Status:** Live
**Category:** Data Display
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`

---

## Overview

Card component showing a configured archive (name, document scope, recycle bin, reports, Q&A). Appears in the "Archives" column of the order view. Has hover-revealed action buttons.

---

## Anatomy

```
┌──────────────────────────────────────────────┐ h=168px
│ .arch-card__icon-wrap (56px) │ .arch-card__body │
│ [icon-zone bg=surface]       │  .arch-card__title │
│  fvdr-icon(nav-archiving)    │  .arch-card__rows  │
│                              │   ┌ Documents: ... │
│                              │   ├ Recycle bin: ..│
│                              │   ├ Reports: ...   │
│                              │   └ Q&A: ...       │
│  ← hover reveals .arch-card__actions (top-right) → │
└──────────────────────────────────────────────┘
```

---

## Tokens Used

| Property | Token |
|----------|-------|
| Border | `--color-border` |
| Border radius | `--radius-sm` (4px) |
| Icon zone bg | `--color-bg-surface` |
| Icon color | `--color-icon` |
| Title color | `--color-text-primary` |
| Row text color | `--color-text-primary` |
| Actions hover bg | `--color-hover-bg` |
| Action btn color | `--color-icon` |
| Action btn hover color | `--color-text-primary` |
| Background | `--color-bg-page` |

---

## Props / Data

The card renders from an `Archive` interface:

```typescript
interface Archive {
  id: number;
  name: string;
  documents: string;      // 'all' | 'viewpoint' | 'selected'
  includeRecycleBin: boolean;
  reports: string;        // 'all' | 'history' | 'custom'
  includeQA: boolean;
}
```

---

## States

| State | Visual |
|-------|--------|
| Default | White bg, border `--color-border`, actions hidden |
| Hover | Actions fade in (opacity: 0 → 1) |

---

## Code Example

```html
<div class="arch-card" *ngFor="let arch of archives">
  <div class="arch-card__icon-wrap">
    <fvdr-icon name="nav-archiving" class="arch-card__icon"></fvdr-icon>
  </div>
  <div class="arch-card__body">
    <div class="arch-card__title">{{ arch.name }}</div>
    <div class="arch-card__rows">
      <div class="arch-card__row"><b>Documents:</b> {{ docLabel(arch.documents) }}</div>
      <div class="arch-card__row"><b>Recycle bin:</b> {{ arch.includeRecycleBin ? 'Include' : 'Exclude' }}</div>
      <div class="arch-card__row"><b>Reports:</b> {{ reportsLabel(arch.reports) }}</div>
      <div class="arch-card__row"><b>Q&A contents:</b> {{ arch.includeQA ? 'Include' : 'Exclude' }}</div>
    </div>
  </div>
  <div class="arch-card__actions">
    <button class="card-ic-btn" (click)="deleteArchive(arch.id)"><fvdr-icon name="trash"></fvdr-icon></button>
    <button class="card-ic-btn" (click)="duplicateArchive(arch)"><fvdr-icon name="copy"></fvdr-icon></button>
    <button class="card-ic-btn" (click)="editArchive(arch)"><fvdr-icon name="edit"></fvdr-icon></button>
  </div>
</div>
```

---

## Cross-references

- `archive-form.md` — Editing an archive card opens the archive form
- Icons used: `nav-archiving`, `trash`, `copy`, `edit`
