# Typography — Foundation Spec

Source: `src/tokens.css` — `--font-size-*`, `--font-weight-*`, `--line-height-*`
Font family: `'Open Sans', sans-serif` → `var(--font-family)`

---

## Font Sizes

| Name | Alias Token | Primitive | px Value | Usage |
|------|-------------|-----------|----------|-------|
| XS | `--font-size-xs` | `--primitive-font-size-xs` | 12px | Hints, captions, char count, domain labels, badges |
| SM | `--font-size-sm` | `--primitive-font-size-sm` | 13px | — (reserved) |
| Base | `--font-size-base` | `--primitive-font-size-base` | 14px | Body text, table rows, sub-items, card rows |
| MD | `--font-size-md` | `--primitive-font-size-md` | 15px | Labels, breadcrumbs, action buttons, modal text |
| LG | `--font-size-lg` | `--primitive-font-size-lg` | 16px | Section titles, account name, nav items, icon sizes |
| XL | `--font-size-xl` | `--primitive-font-size-xl` | 18px | Archive card title, recipient name |
| 2XL | `--font-size-2xl` | `--primitive-font-size-2xl` | 20px | Larger headings |

---

## Font Weights

| Name | Alias Token | Value | Usage |
|------|-------------|-------|-------|
| Regular | `--font-weight-regular` | 400 | Body text, normal labels |
| Semi-bold | `--font-weight-semi` | 600 | Titles, active nav, form labels, bold emphasis |
| Bold | `--font-weight-bold` | 700 | Logo initials, special emphasis |

---

## Line Heights

| Name | Alias Token | px Value | Usage |
|------|-------------|----------|-------|
| XS | `--line-height-xs` | 14px | Hint text |
| SM | `--line-height-sm` | 16px | Field hints |
| Base | `--line-height-base` | 20px | Body text, breadcrumbs |
| LG | `--line-height-lg` | 24px | Section titles, banner text |

---

## Text Style Combinations

| Style Name | font-size | font-weight | line-height | Usage |
|------------|-----------|-------------|-------------|-------|
| Heading/Section | `--font-size-lg` (16px) | `--font-weight-semi` (600) | `--line-height-lg` (24px) | `.sec-title`, `.modal-title`, `.arch-form__title` |
| Heading/Card | `--font-size-xl` (18px) | `--font-weight-semi` (600) | `--line-height-lg` (24px) | `.arch-card__title`, recipient name |
| Label/Default | `--font-size-md` (15px) | `--font-weight-semi` (600) | `--line-height-base` (20px) | `.field-lbl`, `.bc-item`, `.btn-cancel` |
| Body/Default | `--font-size-base` (14px) | `--font-weight-regular` (400) | `--line-height-base` (20px) | Card rows, sub-items, nav sub-items |
| Body/Large | `--font-size-md` (15px) | `--font-weight-regular` (400) | `--line-height-lg` (24px) | Banner text, bullet list |
| Caption/Hint | `--font-size-xs` (12px) | `--font-weight-regular` (400) | `--line-height-xs` (14px) | `.field-hint`, `.char-count` |
| Nav/Default | `--font-size-lg` (16px) | `--font-weight-regular` (400) | — | `.nav-item` |
| Nav/Active | `--font-size-lg` (16px) | `--font-weight-semi` (600) | — | `.nav-item--active` |
| Nav/Sub | `--font-size-base` (14px) | `--font-weight-regular` (400) | — | `.nav-subitem` |
| Account Name | `--font-size-lg` (16px) | `--font-weight-semi` (600) | — | `.account-name` |

---

## Font Family

```css
--font-family: 'Open Sans', sans-serif;
```

Always use `var(--font-family)` in component styles. Never hard-code the family name directly.
