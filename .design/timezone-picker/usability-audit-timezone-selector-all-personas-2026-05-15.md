# Usability Audit — Timezone Selector (fvdr-dropdown timezone mode)

**Screen:** Timezone Selector — `fvdr-dropdown` with timezone extensions  
**URL:** https://prototypes-psi-ochre.vercel.app/timezone-picker  
**Date:** 2026-05-15  
**Heuristics:** All 10 (Nielsen) — iDeals Checklist  
**Personas:** All 5 — Chris, Jim, Catarina, Paul, Michael  
**Scope:** Single component — timezone selector field in a settings context  

---

## What was evaluated

A settings field for selecting a user's timezone, built as `fvdr-dropdown` with timezone extensions. Three states reviewed:

1. **Closed / default** — trigger shows `Kyiv · UTC+2` · `Auto` badge · `🕐 09:31 Kyiv` · chevron. Helper text below.
2. **Open** — search field at top; `Kyiv · UTC+2 | Auto` row (highlighted, selected); continent-grouped list (AMERICAS / EUROPE / ASIA / AFRICA) with city + UTC offset right-aligned.
3. **Search active** — typing `UTC-7` filters to Denver; "Detect automatically" row remains pinned.

---

## Heuristic Evaluation — Base (persona-neutral)

### H1 — Visibility of System Status

| # | Item | Result | Severity |
|---|------|--------|----------|
| 1.1 | Terminology user-friendly? | ✅ Yes | — |
| 1.2 | Loader shown for >3s operations? | N/A | — |
| 1.3 | Screen starts with descriptive title? | ✅ Yes | — |
| 1.4 | Multiple selections shown visually? | ✅ Yes | — |
| 1.5 | Clear which page user is on? | N/A | — |
| 1.6 | Icons indicate status? | ✅ Yes | — |
| 1.7 | User changes reflected immediately? | ✅ Yes | — |
| 1.8 | Clickable elements have hover state? | ✅ Yes | — |
| 1.9 | Loader shown if loading >2s? | N/A | — |

**ESQ(H1) = 6/6 × 100 = 100**

> All states — closed, open, searching — clearly reflect current selection. Live time updates correctly. Hover states on all options.

---

### H2 — Match Between System and the Real World

| # | Item | Result | Severity |
|---|------|--------|----------|
| 2.1 | Designed with users' habits in mind? | ✅ Yes | — |
| 2.2 | Navigation in familiar place? | N/A | — |
| 2.3 | Speaks users' language? | ✅ Yes | — |
| 2.4 | Questions concise and unambiguous? | ✅ Yes | — |
| 2.5 | Metaphors reveal meaning? | ❌ No | S2 |
| 2.6 | Icons clearly represent meaning? | ✅ Yes | — |
| 2.7 | Hints help perform actions? | ✅ Yes | — |
| 2.8 | Abbreviations/acronyms explained? | ❌ No | S1 |
| 2.9 | System does work for users? | ✅ Yes | — |

**Issues:**
- **2.5 S2** — The `Auto` badge in the trigger uses a different term than `Detect automatically` in the panel. "Auto" is compact but abstract — users may not immediately understand it means "your location was detected automatically."
- **2.8 S1** — `UTC+2`, `UTC−7` etc. are shown without explanation. For most users familiar with timezone pickers this is acceptable, but the meaning is never surfaced in-context.

**ESQ(H2) = (6×4 + 2 + 3) / 32 = 29/32 × 100 = 90.6**

---

### H3 — User Control and Freedom

| # | Item | Result | Severity |
|---|------|--------|----------|
| 3.1 | System skips unnecessary steps? | ✅ Yes | — |
| 3.2 | Users can delete account? | N/A | — |
| 3.3 | Cancellation feature available? | ❌ No | S2 |
| 3.4 | Can cancel/dismiss process? | ✅ Yes | — |
| 3.5 | Can edit personal info? | N/A | — |
| 3.6 | Breadcrumbs for multilevel? | N/A | — |
| 3.7 | Users can overcome system issues? | ✅ Yes | — |
| 3.8 | Backup of current state? | N/A | — |

**Issues:**
- **3.3 S2** — After switching from auto to a manual city, there is no undo. The user must remember their previous timezone and re-find it manually. Clicking outside the panel discards changes (good), but once a city is clicked there is no revert short of re-opening and re-searching.

**ESQ(H3) = (3×4 + 2) / 16 = 14/16 × 100 = 87.5**

---

### H4 — Consistency and Standards

| # | Item | Result | Severity |
|---|------|--------|----------|
| 4.1 | Navigation similar to other pages? | N/A | — |
| 4.2 | Main nav always visible? | N/A | — |
| 4.3 | All needed info visible without memorizing? | ✅ Yes | — |
| 4.4 | Logo on every page? | N/A | — |
| 4.5 | Sub-items visually distinct? | ✅ Yes | — |
| 4.6 | Field title always visible? | ✅ Yes | — |
| 4.7 | Icons intuitive? | ✅ Yes | — |
| 4.8 | Menu items non-generic? | ✅ Yes | — |
| 4.9 | Icons have captions? | ❌ No | S1 |
| 4.10 | Links recognizable? | N/A | — |

**Issues:**
- **4.9 S1** — Clock icon (`🕐`) and green status dot in the trigger have no tooltip or caption. Both are inferrable from context, but are technically unlabelled.

**ESQ(H4) = (5×4 + 3) / 24 = 23/24 × 100 = 95.8**

---

### H5 — Error Prevention

| # | Item | Result | Severity |
|---|------|--------|----------|
| 5.1 | Real-time validation for complex fields? | N/A | — |
| 5.2 | Character limit visible? | N/A | — |
| 5.3 | Fields case-sensitive? | N/A | — |
| 5.4 | Default values provided? | ✅ Yes | — |
| 5.5 | Button inactive until required filled? | N/A | — |
| 5.6 | Validity checked on completion? | N/A | — |
| 5.7 | Field name visible in filled state? | ✅ Yes | — |
| 5.8 | Users can preview changes? | ❌ No | S1 |
| 5.9 | Error messages indicate field? | N/A | — |
| 5.10 | Incorrect data blocked? | N/A | — |

**Issues:**
- **5.8 S1** — When hovering over a new city before clicking, users cannot preview what time notifications would fire at that timezone. The live time only reflects the currently *selected* city, not the *hovered* candidate. Minor because the offset is visible per row.

**ESQ(H5) = (2×4 + 3) / 12 = 11/12 × 100 = 91.7**

---

### H6 — Recognition Rather Than Recall

| # | Item | Result | Severity |
|---|------|--------|----------|
| 6.1 | Formatting standards followed consistently? | ✅ Yes | — |
| 6.2 | No confusing different words for same thing? | ❌ No | S2 |
| 6.3 | Component placement follows mental model? | ✅ Yes | — |
| 6.4 | Size/color of components consistent? | ✅ Yes | — |

**Issues:**
- **6.2 S2** — Two different terms for the same concept: `Detect automatically` (inside panel) and `Auto` (badge in trigger). Users who learn from the open panel will look for "Detect automatically" when reading the closed trigger, but see "Auto" instead.

**ESQ(H6) = (3×4 + 2) / 16 = 14/16 × 100 = 87.5**

---

### H7 — Flexibility and Efficiency of Use

| # | Item | Result | Severity |
|---|------|--------|----------|
| 7.1 | Shortcuts or keyboard customization? | ❌ No | S2 |
| 7.2 | Chain multiple actions automatically? | N/A | — |
| 7.3 | Multiple ways to approach tasks? | ✅ Yes | — |
| 7.4 | Accelerators for common actions? | ✅ Yes | — |

**Issues:**
- **7.1 S2** — No keyboard navigation inside the open panel. Users cannot arrow-key through the list, press Enter to select, or Escape to close. For Catarina and Michael (keyboard-heavy, 12–15h days) this is friction on every timezone change.

**ESQ(H7) = (2×4 + 2) / 12 = 10/12 × 100 = 83.3**

---

### H8 — Aesthetic and Minimalist Design

| # | Item | Result | Severity |
|---|------|--------|----------|
| 8.1 | Essential information for decision making shown? | ✅ Yes | — |
| 8.2 | Signal maximized, noise limited? | ❌ No | S1 |
| 8.3 | Universal visual patterns used? | ✅ Yes | — |

**Issues:**
- **8.2 S1** — Trigger row contains: `Kyiv · UTC+2` · `Auto` · `🕐 09:31 Kyiv` · `˅`. The city name "Kyiv" appears twice — once in the city label and once appended to the live time. Redundant on a small trigger.

**ESQ(H8) = (2×4 + 3) / 12 = 11/12 × 100 = 91.7**

---

### H9 — Help Users Recognize, Diagnose, and Recover from Errors

| # | Item | Result | Severity |
|---|------|--------|----------|
| 9.1 | Required field highlighted when error? | N/A | — |
| 9.2 | Tips avoid user criticism? | ✅ Yes | — |
| 9.3 | Inactive button has hint why? | N/A | — |
| 9.4 | Error pages explain next step? | N/A | — |
| 9.5 | Errors in same style/tone? | N/A | — |
| 9.6 | Error communicates cause and action? | ❌ No | S2 |

**Issues:**
- **9.6 S2** — When a search yields no results, the panel shows generic "No options" text. There is no guidance to help the user recover: no suggestion to try a different spelling, no nudge to search by UTC offset instead, no "clear search" affordance.

**ESQ(H9) = (1×4 + 2) / 8 = 6/8 × 100 = 75.0**

---

### H10 — Help and Documentation

| # | Item | Result | Severity |
|---|------|--------|----------|
| 10.1 | Onboarding skippable? | N/A | — |
| 10.2 | Live chat on every page? | N/A | — |
| 10.3 | FAQ user-friendly? | N/A | — |
| 10.4 | Resume work after help? | N/A | — |
| 10.5 | Explanations remain visible as long as needed? | ✅ Yes | — |
| 10.6 | Option to ask question if answer not found? | N/A | — |
| 10.7 | Dangerous actions require confirmation? | N/A | — |

**ESQ(H10) = 4/4 × 100 = 100**

> The helper text ("Determines when email notifications…") is always visible below the trigger and never disappears on interaction.

---

## Per-Persona ESQ Scores

Severity adjustments applied per ESQ methodology:  
→ **Novice (Jim, Chris):** increase severity +1 for feedback, status, help issues  
→ **Expert (Catarina, Michael):** decrease severity −1 for S1–S2 cosmetic/minor issues  

### Issue severity by persona

| Issue | Base | Jim | Chris | Catarina | Paul | Michael |
|-------|------|-----|-------|----------|------|---------|
| 2.5 "Auto" badge unclear | S2 | **S3** | **S3** | S1 | S1 | S1 |
| 2.8 UTC abbreviation | S1 | **S2** | S1 | S1 | S1 | S1 |
| 3.3 No undo after change | S2 | S2 | S2 | **S1** | S2 | **S1** |
| 4.9 Icons without labels | S1 | **S2** | S1 | S1 | S1 | S1 |
| 6.2 "Detect auto" vs "Auto" | S2 | **S3** | S2 | **S1** | **S1** | **S1** |
| 7.1 No keyboard nav | S2 | S2 | S2 | S2 | S2 | S2 |
| 8.2 City name repeated | S1 | **S2** | S1 | S1 | S1 | S1 |
| 9.6 "No options" empty state | S2 | **S3** | S2 | **S1** | **S1** | **S1** |

### Per-heuristic ESQ breakdown by persona

| Heuristic | Base | Jim | Chris | Catarina | Paul | Michael |
|-----------|------|-----|-------|----------|------|---------|
| H1 Visibility | 100 | 100 | 100 | 100 | 100 | 100 |
| H2 Real world | 90.6 | 84.4 | 84.4 | 93.8 | 93.8 | 93.8 |
| H3 Control | 87.5 | 87.5 | 87.5 | 93.8 | 87.5 | 93.8 |
| H4 Consistency | 95.8 | 91.7 | 95.8 | 95.8 | 95.8 | 95.8 |
| H5 Error prev. | 91.7 | 91.7 | 91.7 | 91.7 | 91.7 | 91.7 |
| H6 Recognition | 87.5 | 81.3 | 87.5 | 93.8 | 93.8 | 93.8 |
| H7 Flexibility | 83.3 | 83.3 | 83.3 | 83.3 | 83.3 | 83.3 |
| H8 Aesthetics | 91.7 | 83.3 | 91.7 | 91.7 | 91.7 | 91.7 |
| H9 Recovery | 75.0 | 62.5 | 75.0 | 87.5 | 87.5 | 87.5 |
| H10 Help/docs | 100 | 100 | 100 | 100 | 100 | 100 |

### Overall ESQ

| Persona | Unweighted ESQ | Band |
|---------|---------------|------|
| Jim (SME CEO, Novice) | **86.6** | 🟡 Good |
| Chris (IB Partner, Basic) | **89.7** | 🟡 Good |
| Catarina (M&A Associate, Expert) | **93.1** | 🟢 Excellent |
| Paul (CorpDev Manager, Experienced) | **92.5** | 🟢 Excellent |
| Michael (M&A Analyst, Expert) | **93.1** | 🟢 Excellent |
| **Average across all personas** | **91.0** | 🟢 **Excellent** |

---

## Issue Log (sorted S3 → S1)

### S3 — Major (Jim only)

**[J-1] "Auto" badge meaning unclear — H2.5**  
Jim opens the settings page and sees `Kyiv · UTC+2 · Auto`. He doesn't understand what "Auto" means — is this some kind of automatic mode? Is there something processing? He may click it to investigate and accidentally dismiss the panel without knowing what happened. The concept of automatic browser-based timezone detection is not something Jim has a mental model for.  
_Fix: Replace `Auto` badge with `Auto-detected` or add a tooltip on hover: "Your timezone was detected automatically based on your device."_

**[J-2] "Detect automatically" vs "Auto" inconsistent — H6.2**  
Jim sees "Detect automatically" written in full inside the panel, then sees only "Auto" in the trigger after closing. He may not recognize these refer to the same thing and assume a different state is now active.  
_Fix: Use consistent label. Either `Auto` everywhere (with tooltip), or `Auto-detected` everywhere._

**[J-3] "No options" empty state — H9.6**  
Jim types his city name in a slightly unusual spelling and gets "No options." He does not know whether the city exists in the list, whether he made a typo, or whether there's a bug. He's stuck with no guidance.  
_Fix: Replace "No options" with "No results for '[query]'. Try searching by city name, country, or UTC offset." Add a "Clear search" link._

---

### S2 — Minor (all personas)

**[ALL-1] No keyboard navigation in panel — H7.1**  
Power users (Catarina, Michael) work heavily with keyboard and lose flow when forced to use the mouse to scroll and click 30+ city items. Arrow keys do not navigate the list, Enter does not select, Escape does not close.  
_Fix: Implement standard combobox keyboard pattern: ↑↓ navigate options, Enter selects, Escape closes and reverts._

**[ALL-2] No undo after manual selection — H3.3**  
Once a user clicks a city, the selection is committed with no revert path (other than re-opening and manually finding the original timezone). For accidental clicks this is recoverable but requires extra effort.  
_Fix: Show a brief toast: "Timezone changed to Paris — Undo" with a 5-second window. Or restore on Escape if pressed within 2s of selection._

**[ALL-3] Empty search state "No options" — H9.6** _(S2 for Chris, Catarina, Paul, Michael)_  
See J-3 above. Even expert users benefit from a more informative empty state.  
_Fix: Same as J-3._

---

### S1 — Cosmetic

**[ALL-4] City name repeated in trigger — H8.2**  
`Kyiv · UTC+2 | Auto | 🕐 09:31 Kyiv | ˅` — "Kyiv" appears twice. In the live time display, the city name suffix adds no value since the city is already shown as the primary label.  
_Fix: Show only time in the clock area: `🕐 09:31` without repeating the city._

**[ALL-5] "UTC+2" abbreviation unexplained — H2.8**  
UTC is an industry-standard acronym, but it is never explained. Helps Jim if we surfaced "2 hours ahead of London" or similar on hover.  
_Fix: Optional tooltip on offset: `UTC+2 — 2 hours ahead of London (UTC±0)`. Low priority._

**[ALL-6] Clock and dot icons have no accessible labels — H4.9**  
Screen reader users and users who inspect the UI carefully will not find text labels for the clock icon or the green status dot in the trigger.  
_Fix: Add `aria-label="Current time"` to the clock and `aria-label="Auto-detected"` to the dot._

**[ALL-7] Preview on hover missing — H5.8**  
Hovering over a city before clicking does not update the live time in the trigger. The time preview only reflects the committed selection, not the candidate being considered.  
_Fix: On mouseenter of an option, temporarily update `currentTimeDisplay` with that timezone's time. Reset on mouseleave._

---

## Top 5 Recommendations

| Priority | Action | Personas most impacted |
|----------|--------|----------------------|
| 1 | **Unify terminology: "Auto-detected" everywhere** — kill the "Auto" / "Detect automatically" split | Jim (S3), Chris (S3), all |
| 2 | **Fix empty search state** — "No results for '[query]'" + "Clear" link | Jim (S3), Chris (S2), all |
| 3 | **Keyboard navigation** — arrow keys, Enter, Escape in the open panel | Catarina, Michael (S2 both) |
| 4 | **Remove city from clock display** — `🕐 09:31` not `🕐 09:31 Kyiv` | All (S1 cleanup) |
| 5 | **Hover time preview** — show time for hovered city before committing | Catarina, Paul, Michael (S1) |

---

## ESQ Summary

```
Overall ESQ (avg across personas): 91.0 — Excellent
─────────────────────────────────────────────────
Jim      86.6  Good       → primary drag: unclear "Auto" badge, empty state
Chris    89.7  Good       → "Auto" badge, keyboard nav
Catarina 93.1  Excellent  → keyboard nav the only notable issue
Paul     92.5  Excellent  → keyboard nav, no undo
Michael  93.1  Excellent  → keyboard nav the only notable issue

Issue count:  S1 × 4  |  S2 × 3  |  S3 × 3 (Jim only)  |  S4 × 0
```

> The component scores **Excellent** for expert VDR users. It scores **Good** for novice personas (Jim, Chris), dragged down by one core terminology problem — "Auto" badge — and a weak empty-search state. Both are 1–2 line fixes that would push Jim and Chris into Excellent territory.
