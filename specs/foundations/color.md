# Color — Foundation Spec

Source: `src/tokens.css` (Layer 1 primitives + Layer 2 aliases)
Figma: "FVDR - Design System" (liyNDiFf1piO8SQmHNKoeU)

---

## Primitive Color Palette

### Neutral / Stone

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| White | `--primitive-neutral-0` | `#ffffff` | Page background, card bg |
| Subtle | `--primitive-neutral-25` | `#fbfbfb` | Subtle background, toast bg |
| Surface | `--primitive-neutral-50` | `#f7f7f7` | Sidebar, section headers, banners |
| Hover light | `--primitive-neutral-75` | `#efefef` | Account switcher hover |
| Hover | `--primitive-neutral-100` | `#eef0f8` | Card button hover, selection bg |
| Border | `--primitive-neutral-200` | `#dee0eb` | Default borders, dividers |
| Border input | `--primitive-neutral-300` | `#bbbdc8` | Input field borders |
| Placeholder | `--primitive-neutral-350` | `#b0b3c0` | Input placeholder text |
| Disabled | `--primitive-neutral-400` | `#9b9da6` | Disabled text, char count |
| Subtle text | `--primitive-neutral-450` | `#9c9ea8` | Muted sub-labels |
| Secondary | `--primitive-neutral-500` | `#5f616a` | Icon color, secondary text |
| Muted | `--primitive-neutral-600` | `#73757f` | Hint text |
| Interactive secondary | `--primitive-neutral-700` | `#40424b` | Nav item color, cancel buttons |
| Primary text | `--primitive-neutral-800` | `#1f2129` | Primary text, titles |

### Green / Primary

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| Green 50 | `--primitive-green-50` | `#ebf8ef` | Selected row bg |
| Green 400 | `--primitive-green-400` | `#f0faf5` | Active nav background (CA sidebar) |
| Green 500 | `--primitive-green-500` | `#2c9c74` | Primary interactive, links, borders |
| Green 700 | `--primitive-green-700` | `#268a65` | Interactive hover |

### Red / Danger

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| Red 50 | `--primitive-red-50` | `#fff5f4` | Danger surface bg |
| Red 300 | `--primitive-red-300` | `#ed7c6e` | Danger border |
| Red 500 | `--primitive-red-500` | `#e54430` | Danger text, danger actions |
| Red 700 | `--primitive-red-700` | `#cc3926` | Danger button hover |

### Blue / Info

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| Blue 50 | `--primitive-blue-50` | `#eceef9` | Selection bg, avatar bg |
| Blue 100 | `--primitive-blue-100` | `#ebf4fd` | Feature badge bg |
| Blue 500 | `--primitive-blue-500` | `#358ceb` | Info links, info accent |

### Orange / Brand

| Name | Token | Hex | Usage |
|------|-------|-----|-------|
| Orange 500 | `--primitive-orange-500` | `#f4640c` | Brand accent, account logo |

---

## Semantic Aliases (Layer 2)

| Alias | Token | Resolves To | Usage |
|-------|-------|-------------|-------|
| Primary text | `--color-text-primary` | `#1f2129` | All main body text, titles, labels |
| Secondary text | `--color-text-secondary` | `#5f616a` | Secondary labels, nav items |
| Muted text | `--color-text-muted` | `#73757f` | Hints, captions |
| Placeholder | `--color-text-placeholder` | `#b0b3c0` | Input placeholder |
| Disabled | `--color-text-disabled` | `#9b9da6` | Disabled state text |
| Page bg | `--color-bg-page` | `#ffffff` | Main content area bg |
| Surface bg | `--color-bg-surface` | `#f7f7f7` | Sidebar, section headers, banners |
| Subtle bg | `--color-bg-subtle` | `#fbfbfb` | Toast bg, droplist search area |
| Hover bg | `--color-hover-bg` | `#eef0f8` | Card button hover, row hover |
| Hover light | `--color-hover-light` | `#efefef` | Account switcher hover |
| Active nav bg | `--color-active-nav-bg` | `#f0faf5` | CA sidebar active nav item |
| Default border | `--color-border` | `#dee0eb` | Cards, sections, dividers |
| Input border | `--color-border-input` | `#bbbdc8` | Input fields, triggers |
| Primary interactive | `--color-interactive-primary` | `#2c9c74` | Buttons, links, active states |
| Interactive hover | `--color-interactive-hover` | `#268a65` | Primary button hover |
| Secondary interactive | `--color-interactive-secondary` | `#40424b` | Secondary text, cancel btn |
| Nav active | `--color-nav-active` | `#2c9c74` | Active sub-nav item |
| Selection bg | `--color-selection-bg` | `#eceef9` | Avatar bg, row selection |
| Selected row | `--color-selected-row` | `#ebf8ef` | Dropdown selected row |
| Danger | `--color-danger` | `#e54430` | Delete, error text |
| Danger hover | `--color-danger-hover` | `#cc3926` | Danger button hover |
| Danger border | `--color-danger-border` | `#ed7c6e` | Error input border |
| Danger surface | `--color-danger-surface` | `#fff5f4` | Error row bg |
| Icon | `--color-icon` | `#5f616a` | Default icon color |
| Brand orange | `--color-brand-orange` | `#f4640c` | Account logo bg, brand accents |
| Feature bg | `--color-feature-bg` | `#ebf4fd` | Feature badge background |
| Overlay light | `--color-overlay-light` | `rgba(0,0,0,0.45)` | Archive modal overlay |
| Overlay dark | `--color-overlay-dark` | `rgba(0,0,0,0.6)` | CA modal overlay |

---

## Dark Theme — Stone Inversion System

> Source: Figma DS node `15790-10036` (file `liyNDiFf1piO8SQmHNKoeU`)

The dark theme **inverts the stone scale** — stone-0 becomes the darkest surface, stone-1000 becomes white text. Every prototype uses explicit hex values in `.dark-theme` CSS blocks (global `styles.css` overrides `var()` references).

Activate by adding `.dark-theme` class to the root `.page-layout` element.

### Dark Stone Scale

| Figma Token | Light Value | Dark Value | Role in Dark Theme |
|-------------|-------------|------------|-------------------|
| `stone-0` | `#FFFFFF` | `#1F2129` | Page background, content area |
| `stone-100` | `#FBFBFB` | `#212426` | Sidebar, header, sidebar-bottom |
| `stone-200` | `#F7F7F7` | `#292D2F` | Cards, modals, dropdowns |
| `stone-300` | `#ECEEF9` | `#33383B` | Borders, dividers, separators |
| `stone-400` | `#DEE0EB` | `#40464A` | Subtle borders |
| `stone-500` | `#BBBDC8` | `#50575C` | Input borders |
| `stone-600` | `#9C9EA8` | `#6F7980` | Secondary icons |
| `stone-700` | `#73757F` | `#8B949A` | Muted text, icon muted |
| `stone-800` | `#5F616A` | `#A2A9AF` | Secondary text |
| `stone-900` | `#40424B` | `#B5BBBF` | Body text secondary |
| `stone-1000` | `#1F2129` | `#FFFFFF` | Primary text |

### Dark Theme CSS Pattern (per-component)

```css
/* RULE: always use explicit hex in .dark-theme blocks */
/* styles.css overrides --color-border globally — never rely on var() in dark mode */

:host {
  --color-border: #DEE0EB;   /* restore light-mode divider */
  --color-divider: #DEE0EB;
}

.dark-theme.page-layout   { background: #1F2129; }   /* stone-0 dark */
.dark-theme .content-area { background: #1F2129; }
.dark-theme .sidebar      { background: #212426; border-right-color: #33383B; }
.dark-theme .page-header  { background: #212426; border-bottom-color: #33383B; }
.dark-theme .sidebar-bottom { background: #212426; border-top-color: #33383B; }
.dark-theme .card         { background: #292D2F; border-color: #33383B; }
.dark-theme .modal        { background: #292D2F; }
.dark-theme .modal-header { border-bottom-color: #33383B; }
.dark-theme .title        { color: #FFFFFF; }         /* stone-1000 dark */
.dark-theme .secondary    { color: #A2A9AF; }         /* stone-800 dark */
.dark-theme .muted        { color: #8B949A; }         /* stone-700 dark */
.dark-theme .divider      { border-color: #33383B; }  /* stone-300 dark */
.dark-theme .input        { background: #33383B; border-color: #50575C; color: #B5BBBF; }
```
