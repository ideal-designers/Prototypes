# Claude Code — FVDR Prototype Platform

> Прочитай також [`SKILL.md`](./SKILL.md) на початку кожної сесії — там DS-токени, компоненти, патерни.

---

## Figma → Код: автоматичний протокол

Коли користувач надсилає **Figma-посилання** (`figma.com/design/...`, `figma.com/file/...`, або вузол `?node-id=...`) — **негайно** запускай цей протокол без зайвих запитань:

### Крок 1 — Отримай дизайн
Використай Figma MCP:
```
get_design_context(fileKey, nodeId)   ← основний контекст, розміри, токени
get_screenshot(fileKey, nodeId)       ← візуальна перевірка
get_variable_defs(fileKey)            ← кольори/токени якщо потрібно
```
З URL витягуй: `fileKey` = між `/design/` і `/`, `nodeId` = параметр `node-id` (замінюй `-` на `:`).

### Крок 2 — Визнач що реалізовувати
| Що отримав | Що робити |
|---|---|
| Новий DS-компонент (атом/молекула) | Крок 3A |
| Екран / прототип | Крок 3B |
| Оновлення існуючого компонента | Оновити файл компонента, пропусти 3A |

### Крок 3A — Новий DS-компонент
1. Створи `src/app/shared/ds/components/{name}/{name}.component.ts`
   - `standalone: true`, тільки `var(--token)` для CSS, жодного raw hex/px
   - `ControlValueAccessor` якщо це форм-контрол
2. Додай у `src/app/shared/ds/index.ts`:
   - `import { XxxComponent } from './components/xxx/xxx.component'`
   - `export { XxxComponent }` (і тип якщо є)
   - `XxxComponent` у масив `DS_COMPONENTS`
3. Додай `ds-doc-block` у `/ds` сторінку (`ds-showcase.component.ts`):
   - Знайди потрібну `ds-category` (Action / Form / Navigation / Data Display / Feedback)
   - Додай блок з `name`, `description`, `figmaNode`, `whenToUse[]`, `whenNotToUse[]`, `aiPrompt`, живий приклад у `ng-content`
   - Додай пункт у `navCategories` у тому самому файлі
   - Оновіть лічильник компонентів у `showcase__stats` (+1)

### Крок 3B — Екран / прототип
1. Створи `src/app/prototypes/{name}/{name}.component.ts`
2. Додай маршрут у `app.routes.ts`
3. Додай картку на дашборді якщо потрібно

### Крок 4 — Збери і задеплой
```bash
# Build
~/.nvm/versions/node/v24.14.0/bin/node \
  ~/.nvm/versions/node/v24.14.0/bin/ng build --configuration production

# Deploy → production
~/.nvm/versions/node/v24.14.0/bin/node \
  ~/.nvm/versions/node/v24.14.0/bin/vercel --prod
```

### Крок 5 — Перевір
- Відкрий https://prototypes-psi-ochre.vercel.app і переконайся що все виглядає правильно
- DS-компоненти: https://prototypes-psi-ochre.vercel.app/ds
- Якщо є помилки — виправ і задеплой знову

**Важливо:** Ніколи не питай дизайнера про Angular, TypeScript, imports — все роби сам.

---

## DS Showcase — правило оновлення

> **Завжди** перевіряй https://prototypes-psi-ochre.vercel.app/ds після будь-яких змін у DS-компонентах.

Кожен новий DS-компонент **обов'язково** має:
- `ds-doc-block` з описом, `whenToUse`, `whenNotToUse`, `aiPrompt`
- живий preview у `ng-content`
- посилання у sidebar (`navCategories`)

---

## Команди

```bash
NODE=~/.nvm/versions/node/v24.14.0/bin/node
NG=$NODE ~/.nvm/versions/node/v24.14.0/bin/ng
VERCEL=$NODE ~/.nvm/versions/node/v24.14.0/bin/vercel

# Dev server
$NODE ~/.nvm/versions/node/v24.14.0/bin/ng serve

# Production build
$NODE ~/.nvm/versions/node/v24.14.0/bin/ng build --configuration production

# Deploy
$NODE ~/.nvm/versions/node/v24.14.0/bin/vercel --prod

# Token audit (запусти перед деплоєм)
node scripts/token-audit.js
```

---

## Git Push

- `origin` (local proxy) — push тільки у `claude/*` гілки
- Для `main` — використовуй remote `gitlab`:
  ```bash
  git push gitlab merge-to-main:main
  ```

---

## Іконки

- Завжди `<fvdr-icon name="...">` — ніколи inline SVG
- Список: `src/app/shared/ds/icons/icons.ts` (тип `FvdrIconName`)
- Figma: file `liyNDiFf1piO8SQmHNKoeU`, node `15846-7469`
- Колір через CSS `color`, розмір через `font-size` (іконка = `1em`)

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

---

## DS Components — API

Імпорт: `import { DS_COMPONENTS } from '../../shared/ds'` → `imports: [...DS_COMPONENTS]`

```
<fvdr-btn>             label, size (s/m/l), variant (primary/secondary/ghost/danger), disabled, loading, (clicked)
<fvdr-input>           [(ngModel)], label, placeholder, type, iconLeft, iconRight, state (default/error/success/disabled)
<fvdr-textarea>        [(ngModel)], label, placeholder, maxLength
<fvdr-search>          [(ngModel)], placeholder
<fvdr-radio>           [options]="RadioOption[]", [value], (valueChange), layout (horizontal|vertical)
<fvdr-checkbox>        [(ngModel)], label, disabled
<fvdr-toggle>          [(checked)], label, disabled
<fvdr-dropdown>        [options]="DropdownOption[]", [value], (valueChange)→string|string[], searchable, multi, size
<fvdr-multiselect>     [options]="MultiselectOption[]", [(values)]="string[]", label, placeholder, searchPlaceholder, showChips, maxChips, disabled, state, errorText, helperText
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
<fvdr-status>          label, variant   ← CA Dashboard pill chip
<fvdr-status-btn>      variant (preparation|live|locked|archived), (clicked)  ← Project status button
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
<fvdr-icon>            [name]="FvdrIconName"
<fvdr-tabs>            [tabs]="TabItem[]", [activeId], (tabChange)
<fvdr-header>          appName, [navItems], activeNavId, [actions], userName
ToastService           inject(ToastService).show({ variant: 'success'|'error'|'warning'|'info', message, title?, duration? })
```

Хелпер для dropdown: `asString(v: string | string[]): string { return Array.isArray(v) ? v[0] : v; }`

---

## Design Tokens

Використовуй **тільки** CSS custom properties з `src/tokens.css`. Ніколи raw hex / px.

```css
/* ── Кольори ── */
--color-primary-50:  #EBF8EF   /* selected bg */
--color-primary-500: #2C9C74   /* CTA, акцент */
--color-primary-600: #1C8269   /* hover */
--color-primary-700: #12695C   /* active */

--color-stone-0:   #FFFFFF    /* white */
--color-stone-100: #FAFAFA    /* subtle bg */
--color-stone-200: #F7F7F7    /* surface, hover bg */
--color-stone-300: #ECEEF9    /* hover bg */
--color-stone-400: #DEE0EB    /* borders */
--color-stone-500: #BBBDC8    /* disabled */
--color-stone-600: #9C9EA8    /* secondary icons */
--color-stone-700: #73757F    /* secondary text */
--color-stone-900: #40424B    /* dark text */

--color-text-primary:     #1F2129
--color-text-secondary:   #5F616A
--color-text-placeholder: #9C9EA8
--color-text-disabled:    #BBBDC8
--color-divider:          #DEE0EB
--color-hover-bg:         #ECEEF9

--color-error-600:   #E54430
--color-warning-600: #FFDA07
--color-info-500:    #358CEB

/* ── Типографіка ── */
--font-family: 'Inter', sans-serif
--font-size-base: 14px
--text-caption1-size: 12px

/* ── Радіуси ── */
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px

/* ── Відстані ── */
--space-1: 4px   --space-2: 8px   --space-3: 12px  --space-4: 16px
--space-5: 20px  --space-6: 24px  --space-8: 32px  --space-10: 40px
```

Специфікації: `specs/` (foundations, tokens, components, patterns)
Аудит: `node scripts/token-audit.js` — zero errors required

---

## Shell Layout

Референс: `src/app/prototypes/ca-settings-integrations/ca-settings-integrations.component.ts`

| Елемент | Розмір |
|---|---|
| Sidebar expanded | 280px |
| Sidebar collapsed | 72px |
| Sidebar transition | `width 0.22s ease` |
| Nav item height | 32px |
| Icon zone | 72px wide |
| Header | 64px |
| Sidebar footer | 72px |

**FVDR sidebar:** active/hover — тільки bold text + зміна іконки, без background.

CSS-класи: `.shell`, `.sidebar`, `.sidebar--collapsed`, `.account-switcher`, `.nav-list`, `.nav-item`, `.nav-item--active`, `.nav-item--open`, `.icon-default`, `.icon-active`, `.nav-icon-zone`, `.nav-subitems`, `.nav-subitem`, `.sidebar-bottom`, `.collapse-btn`

---

## Sidebar Nav — Responsive Behavior

Компонент `<fvdr-sidebar-nav>` має три адаптивні режими (breakpoints у `sidebar-nav.component.ts`):

### DESKTOP (≥ 1440px)
- Sidebar **відкритий за замовчуванням** (280px)
- Зхлопується/розгортається кнопкою-стрілкою внизу (поруч з лого)
- При зхлопуванні — іконки-only (72px), залишається в потоці layout
- Two-way binding: `[(collapsed)]="sidebarCollapsed"`

### TABLET (1024–1439px)
- Sidebar **зхлопнутий за замовчуванням** (72px, іконки-only) — залишається в потоці
- При **ховері** — розгортається до 280px як **overlay** поверх контенту (`position: fixed`, `z-index: 200`) — layout **не рухається**
- При кліку на стрілку — sidebar **пінується** (залишається відкритим, повертається в потік layout)
- Повторний клік стрілки — анпін (back to hover-only mode)

### MOBILE (< 1024px)
- Sidebar **повністю прихований**, замість нього — кнопка-бургер `☰`
- Клік бургера — відкриває sidebar як fixed overlay (280px) + напівпрозорий backdrop
- Клік по backdrop або кнопці `✕` — закриває overlay

### Лого в sidebar
- **Expanded**: повний wordmark `ideals.` (SVG, `width=85, viewBox 0 0 117 24`, `fill=currentColor`)
- **Collapsed**: іконка-кружечок (SVG `24×24`, градієнтна кулька фірмових зелених кольорів)
- Лого в `sidebar-bottom`, ліворуч від кнопки стрілки

### Breakpoint-константи (змінюй тільки тут)
```typescript
// sidebar-nav.component.ts
const BP_DESKTOP = 1440;  // ≥ → desktop mode
const BP_TABLET  = 1024;  // ≥ && < BP_DESKTOP → tablet mode
                          // < BP_TABLET → mobile mode
```
