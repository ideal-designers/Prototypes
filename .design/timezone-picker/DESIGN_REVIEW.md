# Design Review: Timezone Picker Prototype

Reviewed against: timezone-picker prototype at `/prototypes/timezone-picker`  
Constraint: **"Компонент повинен бути частиною нашого Дропдауну звичайного"**  
Date: 2026-05-14

---

## Screenshots Captured

| Screenshot | Breakpoint | Description |
|---|---|---|
| `screenshots/review-timezone-desktop-1280.png` | Desktop (~720px viewport) | Before/After side-by-side comparison |

> All screenshots in `.design/timezone-picker/screenshots/`.

---

## Summary

The prototype successfully illustrates all 7 UX improvements over the original timezone dropdown and the "After" panel direction is correct. However, the implementation exists as a fully custom standalone component with its own HTML/CSS, completely disconnected from `fvdr-dropdown`. The work must now be translated back into `fvdr-dropdown` API extensions — the prototype served as a design proof-of-concept, not the final implementation.

---

## Must Fix

### 1. Not part of `fvdr-dropdown` — entire purpose of the review
The timezone UX lives in `timezone-picker.component.ts` as a bespoke component with its own dropdown markup and styles. This duplicates the dropdown rendering logic and creates two separate codebases to maintain.

**Fix: Extend `fvdr-dropdown` with the following API additions (see Proposed API section below). Delete the standalone prototype component once integrated.**

---

### 2. `DropdownOption.sublabel` is missing
The "After" panel shows UTC offset (e.g. `UTC-5`) right-aligned per row. The current `DropdownOption` interface only has `label`. There is no way to render a secondary value in the current component.

**Fix: Add `sublabel?: string` to `DropdownOption`. Render it right-aligned inside `.dropdown__option` with `color: var(--color-text-secondary); margin-left: auto; font-size: var(--text-caption1-size)`.**

---

### 3. Search doesn't match aliases
The prototype searches `city`, `region`, `offset`, and `aliases` (e.g. "Kyiv" also matches "Kiev"). The current `fvdr-dropdown` `onSearch()` only checks `opt.label`. Timezone aliases will silently fail to match.

**Fix: Add `aliases?: string[]` to `DropdownOption`. Update `onSearch()` to also check aliases.**

---

### 4. "Detect automatically" card is not renderable
The "Detect automatically" card (with detected city + UTC offset) is a unique first-item affordance that doesn't fit any current `DropdownOption` shape. It has special styling (green dot, two lines, bold/secondary text) that can't be expressed by a plain option.

**Fix: Add `detectAutoLabel?: string` and `detectAutoSublabel?: string` inputs to `fvdr-dropdown`. When set, render a special card above the search field inside the panel. Selecting it emits a sentinal value of `'__auto__'` or fires a separate `(autoDetected)` event.**

---

### 5. Live time display missing from trigger
The "After" panel shows current local time in the top-right of the "Time zone" block (`🕐 10:33 Paris`). The trigger currently only shows the selected label. A live clock ticking in the trigger is outside any existing `fvdr-dropdown` Input.

**Fix: Add `showCurrentTime?: boolean` input. When true and a timezone value is selected, inject an `interval(60_000)` and display formatted time next to the chevron using `Intl.DateTimeFormat` with the selected timezone.**

---

## Should Fix

### 6. Search placeholder should say "Search by city or timezone…" not "Search..."
The generic `"Search..."` placeholder string is hardcoded in `dropdown.component.ts`. For timezone mode — and for any dropdown — the placeholder should be configurable.

**Fix: Add `searchPlaceholder?: string` input. Default to `"Search..."`. The timezone consumer passes `"Search by city or timezone…"`.**

---

### 7. Badge/tag on option ("Your location") not supported
The prototype shows a `"Your location"` chip next to the detected city row. No current option shape supports an inline badge.

**Fix: Add `badge?: string` to `DropdownOption`. Render it as a small pill (matching `<fvdr-badge>` styling) after the label when present.**

---

### 8. Panel max-height too short for continent-grouped lists
Current `max-height: 240px` fits ~6 options. Timezone lists have 20+ items across 4 continents. Users will need to scroll heavily without seeing group headers as anchors.

**Fix: Allow overriding panel max-height via `panelMaxHeight?: number` input (default 240, timezone uses 360). Or promote the default to 320px globally.**

---

## Could Improve

### 9. "Detect automatically" toggle
The prototype shows a radio-style button to toggle between detected and manual. This could be simplified to just a special first row — clicking it selects auto, clicking any city row switches to manual. No separate toggle needed.

### 10. Group header sticky positioning
As users scroll through a long timezone list, the group headers (AMERICAS, EUROPE, ASIA, AFRICA) disappear. Making them `position: sticky; top: 0` inside the scroll container would help orientation.

### 11. Offset display format consistency
The prototype uses `UTC-5`, `UTC+2` etc. right-aligned. This is the right pattern. Ensure the `sublabel` value comes pre-formatted from the consumer — `fvdr-dropdown` should not compute offsets itself.

---

## What Works Well

- The Before/After side-by-side structure of the prototype is an excellent communication tool — it clearly shows each pain point and its fix.
- "Detect automatically" as the first item (not buried at the bottom) is the right hierarchy decision.
- Grouping by continent with REGION in uppercase as a separator matches the existing `dropdown__group-label` styling already in `fvdr-dropdown` — minimal style work needed.
- City as primary label + UTC offset as sublabel is a strong information hierarchy.
- All 7 identified issues are real and worth fixing.

---

## Proposed API

### `DropdownOption` interface changes

```typescript
export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;       // Right-aligned secondary text (e.g. "UTC-5")
  icon?: string;
  disabled?: boolean;
  group?: string;
  aliases?: string[];      // Extra search terms (e.g. ["Kiev", "Kyiv"])
  badge?: string;          // Inline chip label (e.g. "Your location")
}
```

### `fvdr-dropdown` new inputs

```typescript
@Input() searchPlaceholder = 'Search...';
@Input() detectAutoLabel = '';        // If set, shows detect-auto card
@Input() detectAutoSublabel = '';     // E.g. detected city + offset
@Input() showCurrentTime = false;     // Live time display in trigger
@Input() panelMaxHeight = 240;        // Override panel max-height (px)
@Output() autoDetected = new EventEmitter<void>(); // User clicked detect-auto
```

### Consumer usage (timezone context)

```html
<fvdr-dropdown
  label="Time zone"
  [options]="timezoneOptions"
  [(ngModel)]="selectedTimezone"
  [searchable]="true"
  searchPlaceholder="Search by city or timezone…"
  detectAutoLabel="Detect automatically"
  detectAutoSublabel="Kyiv · UTC+2"
  [showCurrentTime]="true"
  [panelMaxHeight]="360"
  (autoDetected)="setAutoTimezone()"
/>
```

Where `timezoneOptions` is a flat array with `group`, `sublabel`, `aliases`, `badge` fields populated:

```typescript
{ value: 'America/New_York', label: 'New York',      sublabel: 'UTC-5',  group: 'Americas' },
{ value: 'Europe/Kyiv',      label: 'Kyiv',           sublabel: 'UTC+2',  group: 'Europe',   aliases: ['Kiev'] },
{ value: 'Europe/Paris',     label: 'Paris',          sublabel: 'UTC+1',  group: 'Europe',   badge: 'Your location' },
```

---

## Implementation Order

1. Add `sublabel`, `aliases`, `badge` to `DropdownOption` — render changes only, no logic
2. Add `searchPlaceholder` input — trivial
3. Update `onSearch()` to include aliases
4. Add `detectAutoLabel`/`detectAutoSublabel` inputs + auto card in panel template
5. Add `showCurrentTime` + `Intl.DateTimeFormat` live clock
6. Add `panelMaxHeight` input
7. Wire up `(autoDetected)` output
8. Delete `timezone-picker.component.ts` + its route once integrated
