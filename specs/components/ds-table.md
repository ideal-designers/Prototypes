# Component: fvdr-table

Category: Organism
Status: stable
Figma: "FVDR - Design System" (file `liyNDiFf1piO8SQmHNKoeU`)

---

## Overview

Data table with sortable columns, optional row selection, and customizable cell rendering. Use for listing structured data with more than 3 columns.

---

## API

```html
<fvdr-table
  [columns]="columns"
  [data]="rows"
  [selectable]="true"
  [(selectedIds)]="selectedIds"
  (sortChanged)="onSort($event)"
/>
```

```typescript
// TableColumn = { key: string; label: string; sortable?: boolean; width?: string }

columns: TableColumn[] = [
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'date',   label: 'Date',   sortable: true, width: '140px' },
];

rows = [
  { id: '1', name: 'Project Alpha', status: 'Active', date: '2026-01-01' },
];

selectedIds: string[] = [];

onSort(e: { key: string; direction: 'asc' | 'desc' }) { ... }
```

---

## Tokens Used

| Property | Token |
|----------|-------|
| Header bg | `--color-bg-surface` |
| Header text | `--color-text-secondary` |
| Row border | `--color-border` |
| Row hover | `--color-hover-bg` |
| Selected row | `--color-selected-row` |
| Selected hover | `--color-selected-row-hover` |
| Font size | `--font-size-base` (14px) |

---

## States

- **Default**: striped or flat rows
- **Selectable**: checkbox column on left, `selectedIds` two-way bound
- **Sortable**: click column header emits `sortChanged`
- **Empty**: shows empty state slot if `data.length === 0`
- **Loading**: pass `[loading]="true"` to show skeleton rows
