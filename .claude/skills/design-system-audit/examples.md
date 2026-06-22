# FVDR Design System — Fix Examples (before → after)

Concrete before→after for each violation class. Always cite the exact token/component.

## Color
```css
/* ❌ before */            /* ✅ after */
color: #1F2129;            color: var(--color-text-primary);
background: #2C9C74;       background: var(--color-primary-500);
border: 1px solid #DEE0EB; border: 1px solid var(--color-divider);
background: #FAFAFA;       background: var(--color-stone-100);
color: #E54430;            color: var(--color-error-600);
```

## Spacing (4px grid)
```css
/* ❌ */ padding: 16px 24px;   /* ✅ */ padding: var(--space-4) var(--space-6);
/* ❌ */ gap: 8px;             /* ✅ */ gap: var(--space-2);
/* ❌ */ margin-top: 12px;     /* ✅ */ margin-top: var(--space-3);
```

## Radius / shadow / type
```css
/* ❌ */ border-radius: 8px;                       /* ✅ */ border-radius: var(--radius-md);
/* ❌ */ box-shadow: 0 4px 16px rgba(0,0,0,.12);   /* ✅ */ box-shadow: var(--shadow-popover);
/* ❌ */ font-size: 15px;                          /* ✅ */ font-size: var(--font-size-md, 15px);
/*       note the px fallback — font tokens aren't global */
```

## Icons
```html
<!-- ❌ inline SVG for an icon that exists -->
<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 6h18..."/></svg>

<!-- ✅ -->
<fvdr-icon name="trash" />

<!-- ✅ sizing/coloring: via font-size + color, never width/fill -->
<span style="color: var(--color-error-600); font-size: 20px">
  <fvdr-icon name="error" />
</span>
```

## Component reuse
```html
<!-- ❌ hand-rolled button -->
<button class="my-btn" (click)="save()">Save</button>
<style>.my-btn { background:#2C9C74; color:#fff; height:40px; border-radius:8px; }</style>

<!-- ✅ use the DS component -->
<fvdr-btn label="Save" variant="primary" size="m" (clicked)="save()" />
```
```html
<!-- ❌ custom select -->          <!-- ✅ -->
<select>...</select>               <fvdr-dropdown [options]="opts" [(ngModel)]="val" />
<input class="search">             <fvdr-search placeholder="Search..." (search)="onSearch($event)" />
```

## Form control needs ControlValueAccessor
```ts
// ✅ a DS form control implements CVA so [(ngModel)] works
export class FvdrXComponent implements ControlValueAccessor {
  writeValue(v: T) { ... }
  registerOnChange(fn: (v: T) => void) { ... }
  registerOnTouched(fn: () => void) { ... }
}
```

## Showcase entry for a new DS component (required, per CLAUDE.md)
```ts
// in the /ds showcase, inside the right ds-category:
{
  name: 'Multiselect',
  description: 'Pick multiple options with chips.',
  figmaNode: '15032-XXXX',
  whenToUse: ['Selecting many tags', 'Assigning multiple groups'],
  whenNotToUse: ['Single choice → use Dropdown', 'Binary → use Toggle'],
  aiPrompt: 'Add an <fvdr-multiselect> with [(values)] and showChips.',
}
// + add to navCategories, + bump the count in showcase__stats,
// + export from index.ts and add to DS_COMPONENTS.
```

## Accessibility quick fixes
```html
<!-- ❌ icon-only button, no label -->
<button (click)="close()"><fvdr-icon name="close" /></button>
<!-- ✅ -->
<button aria-label="Close" (click)="close()"><fvdr-icon name="close" /></button>
```
```css
/* ❌ */ button:focus { outline: none; }
/* ✅ keep a visible focus ring */
button:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
```
```
Contrast: --color-text-placeholder (#9C9EA8) on white ≈ 2.5:1 — OK for placeholder,
FAILS as real body text. Use --color-text-secondary (#5F616A, ~5.9:1) for readable text.
```
