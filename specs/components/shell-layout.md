# Shell Layout — Component Spec

**Status:** Live
**Category:** Layout
**File:** `src/app/prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component.ts`, `src/app/prototypes/ca-settings-integrations/ca-settings-integrations.component.ts`
**Reference:** `CLAUDE.md` — "Shell layout pattern (sidebar + header)"

---

## Overview

Full-page shell layout with a collapsible left sidebar and a fixed top header. Used across all main prototype screens.

---

## Anatomy

```
┌─────────────────────────────────────────────────────┐
│  .shell / .page-layout                              │
│  ┌──────────┐ ┌───────────────────────────────────┐ │
│  │ .sidebar │ │ .main / .main-area                │ │
│  │          │ │ ┌─────────────────────────────────┐│ │
│  │ account- │ │ │ .top-bar / .page-header (64px)  ││ │
│  │ switcher │ │ └─────────────────────────────────┘│ │
│  │          │ │ ┌─────────────────────────────────┐│ │
│  │ .nav-    │ │ │ .content / .content-area        ││ │
│  │ list     │ │ │ (flex: 1, overflow-y: auto)     ││ │
│  │          │ │ └─────────────────────────────────┘│ │
│  │ sidebar- │ └───────────────────────────────────┘ │
│  │ bottom   │                                       │
│  └──────────┘                                       │
└─────────────────────────────────────────────────────┘
```

---

## Key Dimensions

| Element | Size | Note |
|---------|------|------|
| Sidebar expanded | 280px | `width`, `min-width` |
| Sidebar collapsed | 72px | `width`, `min-width` |
| Sidebar transition | `0.22s ease` | `width` and `min-width` |
| Header | 64px | `height`, `min-height` |
| Sidebar footer | 72px | `height`, `min-height` |
| Nav item | 32px | `height`, `min-height` |
| Nav icon zone | 72px | `width`, `min-width` |
| Nav icon | 24px | `font-size` |

---

## Tokens Used

| Property | Token |
|----------|-------|
| Sidebar bg | `--color-bg-surface` |
| Sidebar border | `--color-border` |
| Header bg | `--color-bg-page` |
| Header border | `--color-border` |
| Account switcher hover | `--color-hover-light` |
| Nav item color | `--color-interactive-secondary` |
| Nav item active color | `--color-text-primary` |
| Nav icon color | `--color-icon` |
| Active nav bg (CA) | `--color-active-nav-bg` |
| Active sub-nav color | `--color-nav-active` |
| Breadcrumb link hover | `--color-interactive-primary` |
| Sidebar footer bg | `--color-bg-surface` |
| Font family | `--font-family` |

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.shell` / `.page-layout` | Root flex container (height: 100vh) |
| `.sidebar` | Left nav (280px, collapsible) |
| `.sidebar--collapsed` | Modifier: collapsed to 72px |
| `.account-switcher` | Top account selector area |
| `.account-logo` | Logo/initials box (40×40) |
| `.account-name` | Account name text |
| `.account-chevron` | Dropdown arrow icon |
| `.nav-list` | Scrollable nav container |
| `.nav-group` | Wrapper for item + subitems |
| `.nav-item` | Nav button (32px height) |
| `.nav-item--active` | Active state |
| `.nav-item--open` | Open (has visible children) |
| `.nav-icon-zone` | 72px icon zone |
| `.nav-icon` | Icon wrapper |
| `.icon-default` | Default icon (hidden on hover/active) |
| `.icon-active` | Active icon (shown on hover/active) |
| `.nav-label` | Item label text |
| `.nav-chevron` | Expand/collapse arrow |
| `.nav-chevron--up` | Rotated 180deg |
| `.nav-subitems` | Sub-item list |
| `.nav-subitem` | Sub-item button (32px, pl: 72px) |
| `.nav-subitem--active` | Active sub-item (green text) |
| `.sidebar-bottom` | Footer (72px, logo + collapse btn) |
| `.sidebar-logo` | ideals. wordmark |
| `.collapse-btn` | Collapse/expand button |
| `.main` / `.main-area` | Content flex column |
| `.top-bar` / `.page-header` | Header bar (64px) |
| `.breadcrumb` | Breadcrumb nav |
| `.bc-item` | Breadcrumb item |
| `.bc-item--link` | Clickable breadcrumb |
| `.bc-item--current` | Current (non-clickable) |

---

## FVDR Sidebar Behavior (differs from CA)

- Active/hover state: **no background fill** — only bold text + icon swap
- `icon-default` hidden on hover/active; `icon-active` shown
- Sub-items: 32px, padding-left 72px, no icon; active = `color: var(--color-nav-active)`

## CA Sidebar Behavior

- Active item gets `background: var(--color-active-nav-bg)` (#f0faf5)
- Dark theme overrides available via `.dark-theme` class on root

---

## Code Example

```html
<div class="shell">
  <nav class="sidebar" [class.sidebar--collapsed]="collapsed">
    <div class="account-switcher">...</div>
    <div class="nav-list">
      <div class="nav-group" *ngFor="let item of navItems">
        <button class="nav-item" [class.nav-item--active]="item.active">
          <span class="nav-icon-zone">
            <span class="nav-icon">
              <fvdr-icon class="icon-default" [name]="item.icon"></fvdr-icon>
              <fvdr-icon class="icon-active" [name]="item.iconActive"></fvdr-icon>
            </span>
          </span>
          <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
        </button>
      </div>
    </div>
    <div class="sidebar-bottom">
      <!-- ideals. logo -->
      <button class="collapse-btn" (click)="collapsed = !collapsed">
        <fvdr-icon [name]="collapsed ? 'angle-double-right' : 'angle-double-left'"></fvdr-icon>
      </button>
    </div>
  </nav>
  <div class="main">
    <header class="top-bar">...</header>
    <div class="content">...</div>
  </div>
</div>
```

---

## Cross-references

- DS Icons: `nav-overview`, `nav-overview-active`, `nav-projects`, `nav-projects-active`, etc.
- Tokens: `--color-bg-surface`, `--color-border`, `--color-nav-active`, `--color-active-nav-bg`
- Figma: FVDR - Design System → Shell / Navigation
