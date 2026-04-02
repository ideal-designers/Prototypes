# Pattern: Dark Theme

> Source: Figma DS `liyNDiFf1piO8SQmHNKoeU`, node `15790-10036`
> CA dark theme reference: Figma `PITzEfwRA26GWSG2MvzmDy`, node `42295-69802`

---

## Activation

Add `.dark-theme` to the root `.page-layout` element (NOT to `<html>`):

```html
<div class="page-layout" [class.dark-theme]="isDark">
```

```typescript
isDark = false;
toggleTheme() { this.isDark = !this.isDark; }
```

---

## Critical Rule: Never Use `var()` in Dark Theme Blocks

`styles.css` globally sets `--color-border: #1e2e28`, breaking all `var(--color-border)` references inside components.

**Always use explicit hex** in `.dark-theme` CSS rules.

In `:host`, always restore the light-mode border token:

```css
:host {
  --color-border: #DEE0EB;
  --color-divider: #DEE0EB;
}
```

---

## Stone Inversion — Complete Reference

Light theme uses stone scale ascending (0=white → 1000=dark).
Dark theme **inverts**: stone-0 is the darkest surface, stone-1000 is white text.

| Stone level | Light hex | Dark hex | Primary use |
|-------------|-----------|----------|-------------|
| 0 | `#FFFFFF` | `#1F2129` | Page bg, content area |
| 100 | `#FBFBFB` | `#212426` | Sidebar, header, sidebar-bottom |
| 200 | `#F7F7F7` | `#292D2F` | Cards, modals, dropdowns |
| 300 | `#ECEEF9` | `#33383B` | Borders, dividers |
| 400 | `#DEE0EB` | `#40464A` | Subtle borders |
| 500 | `#BBBDC8` | `#50575C` | Input borders |
| 600 | `#9C9EA8` | `#6F7980` | Secondary icons |
| 700 | `#73757F` | `#8B949A` | Muted text, icon-muted |
| 800 | `#5F616A` | `#A2A9AF` | Secondary text |
| 900 | `#40424B` | `#B5BBBF` | Body text |
| 1000 | `#1F2129` | `#FFFFFF` | Primary text, titles |

---

## Complete CSS Template

Copy and adapt for each new prototype:

```css
/* ── DARK THEME ───────────────────────────────────── */
.dark-theme.page-layout   { background: #1F2129; }
.dark-theme .content-area { background: #1F2129; }

/* Sidebar */
.dark-theme .sidebar          { background: #212426; border-right-color: #33383B; }
.dark-theme .account-switcher { background: #212426; border-bottom-color: #33383B; }
.dark-theme .account-switcher:hover { background: #2D3235; }
.dark-theme .account-name     { color: #FFFFFF; }
.dark-theme .account-chevron  { color: #8B949A; }
.dark-theme .nav-list         { background: #212426; }
.dark-theme .nav-item         { color: #B5BBBF; }
.dark-theme .nav-item:hover   { background: transparent; }
.dark-theme .nav-item--active { background: #1E3028; color: #FFFFFF; }
.dark-theme .nav-icon         { color: #8B949A; }
.dark-theme .nav-subitems     { background: #212426; }
.dark-theme .nav-subitem      { color: #B5BBBF; }
.dark-theme .nav-subitem--active { color: var(--color-interactive-primary); background: transparent; }
.dark-theme .sidebar-bottom   { background: #212426; border-top-color: #33383B; }
.dark-theme .collapse-btn     { color: #8B949A; }
.dark-theme .collapse-btn:hover { background: #33383B; }

/* Header */
.dark-theme .page-header      { background: #212426; border-bottom-color: #33383B; }
.dark-theme .bc-item--link    { color: #8B949A; }
.dark-theme .bc-item--current { color: #FFFFFF; }
.dark-theme .header-icon      { color: #8B949A; }
.dark-theme .theme-toggle__label { background: #292D2F; border-color: #33383B; color: #FFFFFF; }

/* Cards */
.dark-theme .card             { background: #292D2F; border-color: #33383B; }
.dark-theme .card:hover       { border-color: var(--color-interactive-primary); }
.dark-theme .card-title       { color: #FFFFFF; }
.dark-theme .card-subtitle    { color: #8B949A; }
.dark-theme .card-body        { color: #B5BBBF; }

/* Modals */
.dark-theme .modal            { background: #292D2F; }
.dark-theme .modal-header     { border-bottom-color: #33383B; }
.dark-theme .modal-title      { color: #FFFFFF; }
.dark-theme .modal-close      { color: #8B949A; }
.dark-theme .modal-close:hover { background: #33383B; }

/* Inputs / Dropdowns */
.dark-theme .input            { background: #33383B; border-color: #50575C; color: #B5BBBF; }
.dark-theme .dropdown-trigger { background: #33383B; border-color: #50575C; color: #B5BBBF; }
.dark-theme .droplist         { background: #292D2F; border-color: #33383B; }
.dark-theme .droplist-item:hover { background: #33383B; }

/* Text */
.dark-theme .title            { color: #FFFFFF; }
.dark-theme .secondary-text   { color: #A2A9AF; }
.dark-theme .muted-text       { color: #8B949A; }
.dark-theme .label            { color: #FFFFFF; }
.dark-theme .hint             { color: #8B949A; }

/* Dividers */
.dark-theme .divider          { border-color: #33383B; }
.dark-theme .separator        { background: #33383B; }
```
