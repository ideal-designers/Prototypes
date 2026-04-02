# Token Reference — Master Table

All tokens defined in `src/tokens.css`. Import via `<link rel="stylesheet" href="tokens.css">` (already done in `src/index.html`).

---

## Layer 1: Primitives

### Colors — Neutral
| Token | Value | Semantic Meaning | When to Use |
|-------|-------|-----------------|-------------|
| `--primitive-neutral-0` | `#ffffff` | Pure white | Base for white surfaces |
| `--primitive-neutral-25` | `#fbfbfb` | Near-white | Subtle off-white surfaces |
| `--primitive-neutral-50` | `#f7f7f7` | Light gray | Section backgrounds |
| `--primitive-neutral-75` | `#efefef` | Hover gray | Hover states on surfaces |
| `--primitive-neutral-100` | `#eef0f8` | Blue-tinted gray | Interactive hover bg |
| `--primitive-neutral-200` | `#dee0eb` | Border gray | Default borders |
| `--primitive-neutral-300` | `#bbbdc8` | Medium gray | Input borders |
| `--primitive-neutral-350` | `#b0b3c0` | Placeholder | Input placeholder text |
| `--primitive-neutral-400` | `#9b9da6` | Disabled | Disabled/inactive text |
| `--primitive-neutral-450` | `#9c9ea8` | Subtle text | Secondary muted labels |
| `--primitive-neutral-500` | `#5f616a` | Icon gray | Icon default color |
| `--primitive-neutral-600` | `#73757f` | Hint text | Hint/caption text |
| `--primitive-neutral-700` | `#40424b` | Secondary text | Nav items, secondary labels |
| `--primitive-neutral-800` | `#1f2129` | Primary text | Main body text, headings |

### Colors — Green/Primary
| Token | Value | Semantic Meaning | When to Use |
|-------|-------|-----------------|-------------|
| `--primitive-green-50` | `#ebf8ef` | Light green | Selected row backgrounds |
| `--primitive-green-200` | `#dff4e8` | Medium light green | Hover on selected rows |
| `--primitive-green-400` | `#f0faf5` | Very light green | Active nav bg (CA) |
| `--primitive-green-500` | `#2c9c74` | Brand green | Primary actions, links |
| `--primitive-green-700` | `#268a65` | Dark green | Hover on primary actions |

### Colors — Red/Danger
| Token | Value | Semantic Meaning | When to Use |
|-------|-------|-----------------|-------------|
| `--primitive-red-50` | `#fff5f4` | Light red | Error/danger surface |
| `--primitive-red-300` | `#ed7c6e` | Medium red | Error borders |
| `--primitive-red-500` | `#e54430` | Brand red | Danger actions, errors |
| `--primitive-red-700` | `#cc3926` | Dark red | Danger hover |

### Colors — Blue/Info
| Token | Value | Semantic Meaning | When to Use |
|-------|-------|-----------------|-------------|
| `--primitive-blue-50` | `#eceef9` | Light blue | Selection backgrounds |
| `--primitive-blue-100` | `#ebf4fd` | Feature blue | Feature badge backgrounds |
| `--primitive-blue-500` | `#358ceb` | Info blue | Info links/accents |

### Colors — Orange/Brand
| Token | Value | Semantic Meaning | When to Use |
|-------|-------|-----------------|-------------|
| `--primitive-orange-500` | `#f4640c` | Brand orange | Account logo, brand accents |

### Spacing
| Token | Value | When to Use |
|-------|-------|-------------|
| `--primitive-space-1` | `4px` | Tiny gaps, icon padding |
| `--primitive-space-2` | `8px` | Small inner padding |
| `--primitive-space-3` | `12px` | Banner, modal padding |
| `--primitive-space-4` | `16px` | Standard padding |
| `--primitive-space-5` | `20px` | Section margins |
| `--primitive-space-6` | `24px` | Page padding, headers |
| `--primitive-space-8` | `32px` | Column gaps |
| `--primitive-space-10` | `40px` | Large sections |
| `--primitive-space-12` | `48px` | Column headers |
| `--primitive-space-16` | `64px` | Fixed heights (header) |
| `--primitive-space-18` | `72px` | Sidebar footer, icon zone |

---

## Layer 2: Aliases

### Text Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-text-primary` | `#1f2129` | Default text, titles, labels |
| `--color-text-secondary` | `#5f616a` | Secondary/dimmer text |
| `--color-text-muted` | `#73757f` | Hints, captions |
| `--color-text-placeholder` | `#b0b3c0` | Placeholder in inputs |
| `--color-text-disabled` | `#9b9da6` | Disabled state text |
| `--color-text-subtle` | `#9c9ea8` | Sub-labels, empty states |
| `--color-text-inverse` | `#ffffff` | Text on colored/dark bg |

### Background Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-bg-page` | `#ffffff` | Page/content background |
| `--color-bg-surface` | `#f7f7f7` | Sidebar, banners, headers |
| `--color-bg-subtle` | `#fbfbfb` | Toast, search area bg |
| `--color-hover-bg` | `#eef0f8` | Hover on interactive elements |
| `--color-hover-light` | `#efefef` | Hover on surfaces |
| `--color-active-nav-bg` | `#f0faf5` | CA sidebar active nav |

### Border Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-border` | `#dee0eb` | Default borders everywhere |
| `--color-border-input` | `#bbbdc8` | Input/trigger borders |

### Interactive Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-interactive-primary` | `#2c9c74` | CTAs, links, active indicators |
| `--color-interactive-hover` | `#268a65` | Hover on primary interactive |
| `--color-interactive-secondary` | `#40424b` | Secondary buttons, nav items |
| `--color-nav-active` | `#2c9c74` | Active sub-nav items |
| `--color-selection-bg` | `#eceef9` | Avatar bg, selection highlight |
| `--color-selected-row` | `#ebf8ef` | Selected list item bg |
| `--color-selected-row-hover` | `#dff4e8` | Hover on selected row |

### Danger Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-danger` | `#e54430` | Delete/error text, danger buttons |
| `--color-danger-hover` | `#cc3926` | Hover on danger buttons |
| `--color-danger-border` | `#ed7c6e` | Error state input borders |
| `--color-danger-surface` | `#fff5f4` | Error row background |

### Icon Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-icon` | `#5f616a` | Default icon color |
| `--color-icon-muted` | `#73757f` | Dimmed/secondary icons |

### Brand Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-brand-orange` | `#f4640c` | FVDR brand orange accent |
| `--color-info-primary` | `#358ceb` | Info links, info accents |
| `--color-feature-bg` | `#ebf4fd` | Feature badge background |

### Overlay Colors
| Token | Resolves To | When to Use |
|-------|-------------|-------------|
| `--color-overlay-light` | `rgba(0,0,0,0.45)` | Light modal overlay |
| `--color-overlay-dark` | `rgba(0,0,0,0.6)` | Dark modal overlay |

---

## Layer 3: Dark Theme Explicit Values

> **Source:** Figma DS `liyNDiFf1piO8SQmHNKoeU`, node `15790-10036`
> **Rule:** Use explicit hex — never `var()` — in `.dark-theme` CSS blocks.
> `styles.css` sets `--color-border: #1e2e28` globally, which breaks `var()` in prototypes.

### Dark Stone Scale (inverted from light)

| Figma name | Light | Dark | CSS class target |
|------------|-------|------|-----------------|
| `stone-0` | `#FFFFFF` | `#1F2129` | `.page-layout`, `.content-area` |
| `stone-100` | `#FBFBFB` | `#212426` | `.sidebar`, `.page-header`, `.sidebar-bottom` |
| `stone-200` | `#F7F7F7` | `#292D2F` | `.card`, `.modal`, `.droplist` |
| `stone-300` | `#ECEEF9` | `#33383B` | borders, dividers, `border-*-color` |
| `stone-400` | `#DEE0EB` | `#40464A` | subtle borders |
| `stone-500` | `#BBBDC8` | `#50575C` | input borders |
| `stone-600` | `#9C9EA8` | `#6F7980` | secondary icons |
| `stone-700` | `#73757F` | `#8B949A` | `.muted`, icon-muted |
| `stone-800` | `#5F616A` | `#A2A9AF` | `.secondary` text |
| `stone-900` | `#40424B` | `#B5BBBF` | body secondary text |
| `stone-1000` | `#1F2129` | `#FFFFFF` | primary text, titles |

### Dark Theme — Primary Text & Secondary Text
| Role | Light | Dark |
|------|-------|------|
| Primary text | `#1F2129` | `#FFFFFF` |
| Secondary text | `#5F616A` | `#A2A9AF` |

### Spacing Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--space-1` | `4px` | Tiny gaps |
| `--space-2` | `8px` | Small padding |
| `--space-3` | `12px` | Medium padding |
| `--space-4` | `16px` | Standard padding |
| `--space-5` | `20px` | Section margin |
| `--space-6` | `24px` | Page/section padding |
| `--space-8` | `32px` | Column gaps |
| `--space-10` | `40px` | Large padding |
| `--space-12` | `48px` | Column headers |
| `--space-16` | `64px` | Header height |
| `--space-18` | `72px` | Sidebar footer/icon zone |

### Font Size Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--font-size-xs` | `12px` | Hints, captions, badges |
| `--font-size-sm` | `13px` | Reserved |
| `--font-size-base` | `14px` | Body text, nav sub-items |
| `--font-size-md` | `15px` | Labels, breadcrumbs |
| `--font-size-lg` | `16px` | Section titles, nav items |
| `--font-size-xl` | `18px` | Card titles |
| `--font-size-2xl` | `20px` | Larger headings |

### Font Weight Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--font-weight-regular` | `400` | Normal text |
| `--font-weight-semi` | `600` | Titles, active states |
| `--font-weight-bold` | `700` | Logo initials, emphasis |

### Line Height Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--line-height-xs` | `14px` | Hint/caption text |
| `--line-height-sm` | `16px` | Field hints |
| `--line-height-base` | `20px` | Body text |
| `--line-height-lg` | `24px` | Section titles, banners |

### Border Radius Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--radius-xs` | `2px` | Tiny inline elements |
| `--radius-sm` | `4px` | Cards, inputs, buttons |
| `--radius-md` | `8px` | Forms, larger cards |
| `--radius-lg` | `12px` | Modals (archive flow) |
| `--radius-full` | `9999px` | Pill/circular elements |

### Shadow Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--shadow-none` | `none` | No shadow |
| `--shadow-card` | `0 1px 4px rgba(0,0,0,0.08)` | Subtle card |
| `--shadow-hover` | `0 4px 12px rgba(44,156,116,0.12)` | Card on hover |
| `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.2)` | Modals |
| `--shadow-toast` | `0 4px 16px rgba(0,0,0,0.14)` | Toasts |
| `--shadow-popup` | `0 4px 16px rgba(0,0,0,0.12)` | Dropdowns |

### Z-Index Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--z-tooltip` | `10` | Tooltips |
| `--z-sticky` | `20` | Sticky headers |
| `--z-dropdown` | `100` | Dropdowns, droplists |
| `--z-modal` | `1000` | Modal overlays |
| `--z-toast` | `2000` | Toast notifications |

### Transition Aliases
| Token | Resolves To | Typical Usage |
|-------|-------------|---------------|
| `--duration-fast` | `120ms` | Color/opacity hover transitions |
| `--duration-base` | `150ms` | General transitions |
| `--duration-slow` | `200ms` | Rotate transforms |
| `--duration-xslow` | `220ms` | Sidebar width |
| `--ease` | `ease` | Default easing |
| `--ease-in-out` | `ease-in-out` | Toast slide |

### Misc
| Token | Value | Typical Usage |
|-------|-------|---------------|
| `--font-family` | `'Open Sans', sans-serif` | All component text |
