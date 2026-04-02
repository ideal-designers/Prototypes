# Claude Code — Workflow Notes

> **ВАЖЛИВО:** На початку кожної сесії **прочитай [`SKILL.md`](./SKILL.md)** — там вся база знань: DS токени, компоненти, шаблони організмів, патерни прототипів.

## Icons

- Завжди використовуй `<fvdr-icon name="...">` з DS замість inline SVG.
- Доступні іконки: `src/app/shared/ds/icons/icons.ts` (тип `FvdrIconName`).
- Джерело: Figma "FVDR - Design System" → Icons (node 15846-7469, file liyNDiFf1piO8SQmHNKoeU).
- **НЕ створюй нову inline SVG іконку, якщо вона вже є в наборі.**
- Якщо потрібна іконка якої немає — витягни її з Figma через API і додай до `icons.ts`.
- Колір іконки — через CSS `color` на батьківському елементі або через клас.
- Розмір — через CSS `font-size` (іконка = `1em`).

## Git Push

- `origin` (local proxy) дозволяє push лише в гілки `claude/*`
- Для push в `main` використовувати remote `gitlab` напряму:

```bash
git push gitlab merge-to-main:main
```

- Токен зберігається в remote `gitlab` (glpat)

## Shell layout pattern (sidebar + header)

Референс: `src/app/prototypes/ca-settings-integrations/ca-settings-integrations.component.ts`

Ключові розміри:
- Sidebar: `280px` (expanded) / `72px` (collapsed), transition `width 0.22s ease`
- Nav item: `height: 32px`, icon-zone `72px` wide, icon `24px`
- Header: `64px`
- Sidebar footer: `72px`

**FVDR sidebar** (відрізняється від CA):
- Active/hover state: **без background** — тільки bold text + перемикання іконки
- `icon-default` прихований при hover/active, `icon-active` показується
- Sub-items: 32px, padding-left 72px, без іконки; active = `color: var(--color-nav-active)`

CSS-класи: `.shell`, `.sidebar`, `.sidebar--collapsed`, `.account-switcher`, `.nav-list`, `.nav-item`, `.nav-item--active`, `.nav-item--open`, `.icon-default`, `.icon-active`, `.nav-icon-zone`, `.nav-subitems`, `.nav-subitem`, `.sidebar-bottom`, `.collapse-btn`

## DS Components — key APIs

Імпорт: `import { DS_COMPONENTS } from '../../shared/ds'` → `imports: [...DS_COMPONENTS]`

```
<fvdr-btn>             label, size (s/m/l), variant (primary/ghost/danger), disabled, (clicked)
<fvdr-input>           [(ngModel)], label, placeholder, type, iconLeft, iconRight, state (default/error/success/disabled)
<fvdr-textarea>        [(ngModel)], label, placeholder, maxLength
<fvdr-search>          [(ngModel)], placeholder
<fvdr-radio>           [options]="RadioOption[]", [value], (valueChange), layout (horizontal|vertical)
<fvdr-toggle>          [(checked)], label, disabled
<fvdr-dropdown>        [options]="DropdownOption[]", [value], (valueChange)→string|string[], searchable, multi, size
<fvdr-droplist>        [items]="DroplistItem[]", [value], (valueChange)
<fvdr-phone-input>     [(ngModel)]
<fvdr-datepicker>      [(ngModel)]
<fvdr-timepicker>      [(ngModel)]
<fvdr-calendar>        [(ngModel)]
<fvdr-segment>         [items]="SegmentItem[]", [(value)]
<fvdr-chip>            label, variant, removable, (removed)
<fvdr-avatar>          initials, size (sm/md/lg), color, textColor, imgSrc
<fvdr-badge>           label, variant
<fvdr-counter>         [value], variant, size
<fvdr-status>          label, variant
<fvdr-inline-message>  message, variant (info/success/warning/error)
<fvdr-info-banner>     message, variant, dismissible
<fvdr-modal>           visible, title, confirmLabel, cancelLabel, size (s/m/l/xl), confirmVariant, closeOnOverlay, (confirmed), (cancelled), (closed)
<fvdr-bottom-sheet>    visible, title, confirmLabel, cancelLabel, (confirmed), (cancelled)
<fvdr-number-stepper>  [(ngModel)], min, max
<fvdr-progress>        [value] (0–100)
<fvdr-range>           [(ngModel)], min, max
<fvdr-table>           [columns]="TableColumn[]", [rows], [sortable]
<fvdr-tree>            [nodes]="TreeNode[]"
<fvdr-drop-area>       (filesDropped)
<fvdr-icon>            [name]="FvdrIconName" — розмір через font-size CSS, колір через color CSS
ToastService           inject(ToastService).show({ variant: 'success'|'error'|'warning'|'info', message, title?, duration? })
```

Важливо: `valueChange` у `<fvdr-dropdown>` емітить `string | string[]`.
Хелпер: `asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }`

## Icons — повний список FvdrIconName

```
Standard: angle-double-left, angle-double-right, api, attention, bell, billing, cancel, check,
  chevron-down, chevron-left, chevron-right, chevron-up, close, download, drag, edit, error,
  filter, finished, folder, info, link, lock-close, lock-open, minus, more, move, overview,
  participants, plus, reports, search, settings, share, sort, spinner, storage, trash, upload, warning

Extended: calendar, clock, help, theme-dark, theme-light

Nav (з active-варіантом): nav-api, nav-api-active, nav-billing, nav-billing-active,
  nav-overview, nav-overview-active, nav-participants, nav-participants-active,
  nav-projects, nav-projects-active, nav-reports, nav-reports-active,
  nav-settings, nav-settings-active
```

Файл: `src/app/shared/ds/icons/icons.ts` (тип `FvdrIconName`)
Figma: "FVDR - Design System" → Icons (file `liyNDiFf1piO8SQmHNKoeU`, node `15846-7469`)

## Design Tokens & Specs

Before writing or modifying any UI code, read the relevant spec file in `specs/`:

```
specs/foundations/   → color (incl. dark theme), typography, spacing, radius, elevation, motion
specs/tokens/        → token-reference.md (master map, dark theme values)
specs/components/    → shell-layout, modal, table, droplist, confirm-modal, …
specs/patterns/      → shell-layout, dark-theme (full CSS template)
```

Use only tokens from `src/tokens.css`. Run both scripts before committing:

```bash
node scripts/token-audit.js    # zero errors required
node scripts/drift-detect.js   # specs must match tokens.css
```

Zero errors required (warnings allowed). Never write raw hex colors, px spacing,
or font-size values directly in CSS — always use a `var(--token)`.

**CI:** `.github/workflows/token-audit.yml` runs `token-audit.js` on every push to `main` / `proto/*` / `claude/*`.

### Quick token reference
| Category | Example token | Value |
|---|---|---|
| Text primary | `--color-text-primary` | #1f2129 |
| Border | `--color-border` | #dee0eb |
| Surface | `--color-bg-surface` | #f7f7f7 |
| Interactive | `--color-interactive-primary` | #2c9c74 |
| Danger | `--color-danger` | #e54430 |
| Spacing base | `--space-4` | 16px |
| Font base | `--font-size-base` | 14px |
