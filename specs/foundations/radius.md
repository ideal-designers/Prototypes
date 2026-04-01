# Border Radius — Foundation Spec

Source: `src/tokens.css` — `--radius-*` aliases → `--primitive-radius-*`

---

## Border Radius Scale

| Name | Alias Token | Primitive | px Value | Usage |
|------|-------------|-----------|----------|-------|
| XS | `--radius-xs` | `--primitive-radius-1` | 2px | Small inline elements (trigger-clear) |
| SM | `--radius-sm` | `--primitive-radius-2` | 4px | Cards, inputs, buttons, badges, dropdowns, collapse btn |
| MD | `--radius-md` | `--primitive-radius-4` | 8px | Recipient form, larger cards |
| LG | `--radius-lg` | `--primitive-radius-5` | 12px | Modals (archive flow confirm modal) |
| Full | `--radius-full` | `--primitive-radius-full` | 9999px | Circular elements (chat bubble uses `50%`) |

---

## Component-specific Usage

| Component | Radius | Token |
|-----------|--------|-------|
| Archive card | 4px | `--radius-sm` |
| Archive form | 4px | `--radius-sm` |
| Recipient form | 8px | `--radius-md` |
| Column header | 4px 4px 0 0 | `--radius-sm` top only |
| Card icon btn | 4px | `--radius-sm` |
| Collapse btn | 4px | `--radius-sm` |
| Confirm modal | 12px | `--radius-lg` |
| CA modal | 4px | `--radius-sm` |
| Dropdown trigger | 4px | `--radius-sm` |
| Droplist | 4px | `--radius-sm` |
| Feature badge | 4px | `--radius-sm` |
| Integration card | 4px | `--radius-sm` |
| Account logo | 4px | `--radius-sm` |
| Toast | 4px | `--radius-sm` |
| Chat bubble | 50% | `border-radius: 50%` |
