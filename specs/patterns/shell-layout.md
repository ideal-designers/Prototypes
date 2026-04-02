# Pattern: Shell Layout (Sidebar + Header)

Reference component: `src/app/prototypes/ca-settings-integrations/ca-settings-integrations.component.ts`

---

## Structure

```
.page-layout                  ← flex row, height: 100vh
├── .sidebar                  ← fixed width, flex column
│   ├── .account-switcher     ← logo + account name
│   ├── .nav-list             ← navigation items
│   │   └── .nav-item         ← each nav row (with sub-items)
│   └── .sidebar-bottom       ← collapse button
└── .main-area                ← flex column, flex: 1
    ├── .page-header          ← breadcrumb + actions, h=64px
    └── .content-area         ← scrollable main content
```

---

## Key Dimensions

| Element | Value |
|---------|-------|
| Sidebar expanded | `280px` |
| Sidebar collapsed | `72px` |
| Sidebar transition | `width 0.22s ease` |
| Nav item height | `32px` |
| Nav icon zone width | `72px` |
| Nav icon size | `24px` |
| Header height | `64px` |
| Sidebar footer height | `72px` |

---

## FVDR Sidebar Nav Rules

- Active/hover state: **no background** — only bold text + icon swap
- `icon-default` hidden on hover/active; `icon-active` shown
- Sub-items: `32px` height, `padding-left: 72px`, no icon
- Active sub-item: `color: var(--color-nav-active)` only — no background

---

## CSS Classes Reference

```
.shell               .sidebar             .sidebar--collapsed
.account-switcher    .nav-list            .nav-item
.nav-item--active    .nav-item--open      .icon-default
.icon-active         .nav-icon-zone       .nav-subitems
.nav-subitem         .nav-subitem--active .sidebar-bottom
.collapse-btn        .main-area           .page-header
.content-area
```

---

## Dark Theme Overrides

```css
.dark-theme.page-layout       { background: #1F2129; }
.dark-theme .sidebar          { background: #212426; border-right-color: #33383B; }
.dark-theme .account-switcher { background: #212426; border-bottom-color: #33383B; }
.dark-theme .nav-list         { background: #212426; }
.dark-theme .nav-item         { color: #B5BBBF; }
.dark-theme .nav-item--active { background: #1E3028; color: #FFFFFF; }
.dark-theme .nav-subitems     { background: #212426; }
.dark-theme .nav-subitem      { color: #B5BBBF; }
.dark-theme .nav-subitem--active { color: var(--color-interactive-primary); }
.dark-theme .sidebar-bottom   { background: #212426; border-top-color: #33383B; }
.dark-theme .page-header      { background: #212426; border-bottom-color: #33383B; }
.dark-theme .content-area     { background: #1F2129; }
```

---

## Tokens Used

| Property | Token |
|----------|-------|
| Sidebar bg | `--color-bg-surface` / dark: `#212426` |
| Border | `--color-border` / dark: `#33383B` |
| Nav item text | `--color-interactive-secondary` |
| Active nav item | `--color-active-nav-bg` (CA) |
| Active sub-item | `--color-nav-active` |
| Header height | `--space-16` (64px) |
| Sidebar footer | `--space-18` (72px) |
