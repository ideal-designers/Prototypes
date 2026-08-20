# iDeals VDR — real product UI spec (captured 2026-08-20)

Source: `app.idealsvdr.com/project/5/test_2_g5r8d/*`, project "test 2", dark theme,
viewport 1512×770. Captured by walking the live app. Purpose: build **static visual
replicas** of every page so we can see what the AI assistant has to fit into. No
functionality — buttons are inert.

> The project's accent is **coral/red**, not FVDR green. The activity log shows
> `Theme color: Ideals Corp → Red`, i.e. this is per-project **branding**, not the
> default palette. Replicas should be able to take an accent as a variable.

---

## 1. Shell (every page shares it)

### Left rail — 72px, icon-only, NOT expandable to labels
Order, top to bottom:

| # | Icon | Route |
|---|------|-------|
| — | project logo (branded, 40×40, top) | — |
| 1 | grid (2×2 tiles) | `/dashboard` |
| 2 | folder with lines | `/documents` → `/documents/all` |
| 3 | list with check | `/due-diligence-checklist` |
| 4 | two people | `/participants` |
| 5 | document with lock | `/permissions/documents` |
| 6 | two speech bubbles | `/qna` |
| 7 | clipboard with bar chart | `/reports` |
| 8 | vertical sliders | `/settings` |
| 9 | archive box | `/archiving` |
| 10 | trash can | `/recycle-bin` |
| — | round brand mark (bottom, green gradient sphere) | marketing link |

- Active item: icon tinted accent (coral). No background fill, no label.
- Rail background is darker than the content area.
- Sub-navigation does **not** live in the rail — it appears as breadcrumb + page tabs.

### Top bar — 64px
- Left: breadcrumb. Parent segments muted, `>` chevron separators, final segment
  bold white. Examples: `Documents > All`, `Reports > Activity log`,
  `Settings > Project > AI tools`, or a single `Dashboard` / `Recycle bin`.
- Right, in order: theme toggle (sun), Help (`?` in circle), Download application
  (tablet glyph), user avatar circle with initials (`DS`).
- Bottom-right of viewport: Intercom launcher bubble (accent circle). Include it —
  it occupies the exact corner a floating assistant would want.

### Dark palette (measured)
- page background `#1F2129`
- panel / card `#262A33`
- table header `#2A2E37`, row hover slightly lighter
- border / divider `#333844`
- text primary `#FFFFFF`, secondary `#9CA3AF`, muted `#6B7280`
- accent (branded) coral `#EE5A52`, accent hover darker
- success green `#3BA776`, chip backgrounds tinted at low alpha

### Common building blocks
- **Action bar**: accent-filled primary button with `+` icon, then outline
  secondary buttons, then `...` overflow; search input right-aligned with a
  leading magnifier and a trailing filter/sliders icon.
- **Table**: header row on `#2A2E37`, right-most header cell is a
  "Customize columns" icon. Rows are tall (~56px) with generous padding.
- **Empty state**: centered flat illustration (~150×120, grey shapes with one
  accent-coloured element), bold ~20px title, 1–2 muted subtitle lines, then a
  button. Multi-step empty states use 3 illustrations in a row joined by dashed
  arcs, each numbered `1 2 3`.

---

## 2. Pages

### 2.1 `/dashboard`
- Two stat cards side by side: **Activity** `3` "sign-ins over the last two weeks"
  (this card is accent-outlined + tinted), **Documents** `0` "views in the last
  two weeks".
- Filter row: date-range input `Aug 14, 2026 – Aug 20, 2026` with clear ✕ and
  calendar icon; then `Activity on` + accent dropdown `All groups`.
- **Participants** panel: `1 Participants` with an external-link icon, a full-width
  stacked progress bar, and a legend: `0 Invited` / `1 Signed in` / `0 Engaged` /
  `0 Deactivated`, each with a coloured dot.
- Bottom row: **Summary** card with a donut chart (`%` / "of actions" in the hole)
  and a **Dynamics of** + accent dropdown `Activity` card with a line/bar toggle
  (two small icon buttons, bar active) and an empty chart with y-axis 0/0.5/1 and
  x-axis Aug 14…Aug 20.

### 2.2 `/documents/all`  ← the assistant's main context
- Action bar: `+ Add` (accent), `Download`, `Project index`, `...`, search.
- **Two-pane body.** Left pane ~325px titled **Quick access** with a ✕ and a
  collapse `<` in its header, then rows: `Recently viewed`, `Newly uploaded`,
  `Favorites` (each with a leading icon), then the project tree — project row
  `test 2` (selected, tinted) with the branded logo, and a child folder row
  `1 Get to know VDR`.
- Right pane: table `Index · Name · Size · Added on · Notes · Labels` + customize
  icon. One row: folder icon, `1`, `Get to know VDR`, `3.52 MB / 7 files`
  (two lines), `Aug 14, 2026`.
- Sub-pages sharing this shell: `/documents/notes`, `/documents/shared-links`,
  `/documents/signatures`, `/documents/recent`, `/documents/uploads`,
  `/documents/favorites`.

### 2.3 `/documents/signatures`
Three-step empty state: title "You have sent no documents for signature yet",
subtitle "To send documents for signature, follow the below steps", then
`1 Go to all documents` (+ button "Go to all documents"), `2 Select signers`,
`3 Monitor progress`, joined by dashed arcs.

### 2.4 `/due-diligence-checklist`
Single empty state: checklist illustration with accent `+` badge, title "No due
diligence checklist uploaded yet", subtitle "To share the due diligence checklist
with your team / and track your deal progress, upload your file here", accent
button `+ Choose file`.

### 2.5 `/participants`
- Action bar: `Add participants` (accent, person icon), `Create group`, `Import`,
  `Export`, `View reports`, search.
- Table `Group · Role · Project access · Invitation status · Last sign-in · Users`
  with a sort glyph in the first header cell. One row: expand chevron `>`, group
  icon, `Administrators (your group)` (bold suffix), `Administrator`,
  green-check chip `Enabled`, grey-✕ chip `Not sent`, `Today, 12:33`, count
  badge `1`.

### 2.6 `/permissions/documents`
Empty state: people-and-card illustration, title "You have no groups to assign
permissions yet", subtitle "Create at least one non-administrator group / to
manage their document permissions", accent button `+ Create group`.

### 2.7 `/qna`
Breadcrumb `Q&A > Setup`. **Onboarding overlay over live-looking content** — worth
replicating exactly because it shows how the product introduces a new capability:
- Behind: left `Quick access` panel (`All 20`, `Action required 2`, `Assigned 6`,
  `Unanswered 10` with counts) and a table `# · Subject · Status · Author ·
  Priority · Category` with rows B100/B101/B102, status chips (`Answered` green,
  `Assigned` amber, `Rejected` grey), author avatars, priority arrows, category
  chips. The lower rows fade out under the overlay.
- Overlay: title "Welcome to Q&A", subtitle "A single place to coordinate
  questions, answers, and ownership across teams", three numbered illustrations
  (`1 Structured communication`, `2 Faster responses`, `3 Secure access`) with
  captions, then accent button `Set up Q&A` and a `Learn more ↗` link.

### 2.8 `/reports/activity-log`
- `Report on` + accent dropdown `All actions`.
- Filter row: date range, `Action` select, `Author` select, `Clear all` (funnel
  icon), then right-aligned `Export` and `Subscribe` (bell) outline buttons.
- Table `Date and time · Author · Action · Description` + customize icon, with
  **date group header rows** (`Today`, `Aug 18, 2026`) spanning the table.
- Rows: time, avatar + name + email (two lines), action label, description with
  bold key (`Session duration: Not finished`, `Theme color: Ideals Corp → Red`,
  `Project status: Preparation → Active`).

### 2.9 `/reports/documents-overview`
- Filter row: `Period` date input, `Overview on` + accent dropdown
  `All participants`, right-aligned `Export` + `Subscribe`.
- Three panels: **Documents** (search + project tree), **Summary**
  (2×2 metric grid: `0m` total viewing time, `0m` avg viewing time, `0` total
  views, `0` participants engaged), **Dynamics of viewing time** (empty line chart,
  y 0m/0.5m/1m, x Aug 14…Aug 20).
- Below: empty state "No participant data found" + "Participants who have viewed
  the document will display here".
- Siblings, same shell: `/reports/engagement-matrix`, `/reports/data-storage`,
  `/reports/permissions`, `/reports/subscriptions`.

### 2.10 `/settings/project/general`
- Page **tabs** (accent underline on active): `General`, `Branding`, `Documents`,
  `Labels`, `Terms of access`, `Watermarks`, `Security`, `AI tools`, `Integrations`.
  Routes are `/settings/project/<tab-slug>`.
- Left column card: project name `test 2` + pencil, path `../project/5/test_2_g5r8d`,
  a **green** status button `⚡ Live ⌄`, info note "Project is ready for
  collaboration with external participants / Learn more", `Status history`
  (Project launched / Project created with dates and authors), `General info`
  rows (Project ID `5_77641`, Project type `M&A sell side`, Storage location
  `Frankfurt`) each with a leading icon chip.
- Right column stacked cards, each with text left and an illustration right:
  **Locking** (`Lock project`), **Archiving** (`Downloadable archive` + `Free`
  badge, `USB archive`, both expandable), **Closure** (`Close project`).

### 2.11 `/settings/project/ai-tools`  ← most relevant page for us
- Master row: **AI tools** + accent toggle **on**, subtitle "All tools work
  internally with no training on your data".
- Indented children, each name + toggle + description:
  - **AI redaction** — on — "Detect sensitive information such as names, emails,
    phone numbers, and more"
  - **AI search** — off, with a green entitlement glyph — "Get quick summary and
    answers with relevant content in document viewer"
  - **AI translation** — off, green glyph — "Translate documents into 100+ languages"
- Note panel: green glyph + "Features available only with a **Premier** or higher
  subscription after trial. Learn more".

### 2.12 `/archiving`
Three stacked cards, text left / illustration right: **Online archive** (trial
notice + `Learn more ↗`), **Offline backup** (`Downloadable archive` + `Free`
badge, `USB archive`, expandable rows), **Project closure** (`Close project`).

### 2.13 `/recycle-bin`
Empty state: trash illustration, "Recycle bin is empty", "All deleted files and
folders will appear here".

### 2.14 `/settings/personal`
Not captured. Build as a tabbed settings page matching 2.10's chrome.

---

## 3. What this means for the assistant (the reason for the exercise)

1. **The rail is 72px and icon-only.** Our prototype assumed a 280px labelled nav.
   An assistant entry point in the rail gets an icon and nothing else.
2. **`AI tools` already exists in project settings**, with a master switch, per-tool
   toggles and a Premier entitlement gate. The assistant belongs in that surface —
   and inherits "off by default until entitled".
3. **`AI search` already ships** ("summary and answers in document viewer"). We must
   position the assistant against it or absorb it, not duplicate it.
4. **The bottom-right corner is taken by Intercom.** A floating assistant window
   collides with it.
5. **Quick access already owns the left pane** on Documents and Q&A. A docked
   assistant panel has to go right, or displace Quick access.
6. **Branding recolours the accent per project.** The assistant's own accent and
   the Ideon gradient must survive an arbitrary brand colour.
7. **Q&A's "Welcome to" overlay is the product's established pattern** for
   introducing a new capability — the assistant should reuse it rather than invent
   an onboarding.
8. **Every list page is a table with Customize columns**, and Reports pages carry
   Export/Subscribe. Assistant answers that produce lists should offer the same
   affordances to feel native.

---

## 4. Sub-pages (captured 2026-08-20, second pass)

All share the shell from §1. Where a page shows the Quick access pane, it is the
same component as §2.2 with a different row selected (tinted).

### 4.1 `/documents/notes` — breadcrumb `Documents > Notes`
No action bar, only the right-aligned search. Empty state: clipboard-with-pencil
illustration, **"You have no notes"**, "All notes to files and folders will appear here".
No button.

### 4.2 `/documents/shared-links` — breadcrumb `Documents > External links`
Note the label: **External links**, not "Shared links".
Table header is rendered but **greyed/disabled**: `Index · Name · Access type ·
Notifications · Visits · Feedback · Created on · Status` + customize icon, with no rows.
Below it a three-column feature pitch (no numbers, unlike §2.3): **Share securely**
/ **Track engagement** / **Manage shared links**, each an illustration + bold title +
2–3 muted lines. Then an entitlement panel: green glyph + "This feature is available
only with a **Premier** or higher subscription. Learn more".

### 4.3 `/documents/recent` — breadcrumb `Documents > Recently viewed`
Action bar: `Project index`, `...`, search (no `+ Add`, no `Download`).
Quick access pane with **Recently viewed** selected. Empty state right of it:
stacked-documents illustration with a clock badge, **"You have no recent documents
yet"**, "Viewed and downloaded documents will appear here".

### 4.4 `/documents/uploads` — breadcrumb `Documents > Newly uploaded`
Richest page captured — good reference for a populated table.
Action bar: `Project index`, `...`, search. Quick access with **Newly uploaded**
selected. Table `Index · Name · Size · Location · Added on · Notes` + customize icon,
with a full-width group header row **`Last 7 days`**, then rows:

| Index | Name | Size | Location | Added on |
|---|---|---|---|---|
| 1 | Get to know VDR (folder) | 3.52 MB / 7 files | test 2 | Aug 14, 2026 |
| 1.1 | Advantages of using VDR.txt | 2.21 KB / 1 page | 1 Get to know VDR | Aug 14, 2026 |
| 1.2 | Available document permissions.docx | 52.53 KB / 4 pages | 1 Get to know VDR | Aug 14, 2026 |
| 1.3 | Guidelines on using VDR efficiently.pdf | 474.7 KB / 5 pages | 1 Get to know VDR | Aug 14, 2026 |
| 1.4 | Sample balance sheet.xls | 44.5 KB / 12 pages | 1 Get to know VDR | Aug 14, 2026 |
| 1.5 | Sample financial model.xlsx | 41.3 KB / 8 pages | 1 Get to know VDR | Aug 14, 2026 |
| 1.6 | Sensitive data redaction.mp4 | 2.85 MB | 1 Get to know VDR | Aug 14, 2026 |
| 1.7 | The five steps to start with iDeals VDR.jpg | 70.94 KB / 1 page | 1 Get to know VDR | Aug 14, 2026 |

Size is a two-line cell (bytes over page/file count). Location cells carry a small
folder icon before the name. Each row leads with a file-type icon matched to the
extension (txt/docx/pdf/xls/xlsx/mp4/jpg).

### 4.5 `/documents/favorites` — breadcrumb `Documents > Favorites`
Action bar: `Project index`, `...`, search. Quick access with **Favorites** selected.
Empty state: folder-with-star illustration, **"You have no favorites yet"**,
"All starred files and folders will appear here".

### 4.6 `/reports/engagement-matrix` — breadcrumb `Reports > Engagement matrix`
Filter row: `Period` date input, then label `Include deleted groups` + a toggle
(**on**), right-aligned `Export` + `Subscribe`.
Left pane **Groups** with an accent text-link `By documents` in its header (a
pivot switch), a search field, and one tree row: chevron, checkbox, group icon,
`Administrators`.
Right: table with a leading folder-dropdown header cell, then `Index · Name · Files ·
% engaged · Total · Views · Downloads` + customize icon. No rows.

### 4.7 `/reports/data-storage` — breadcrumb `Reports > Data storage`
Filter row: `Unit:` with two radios `GB` / **`MB`** (MB selected), right-aligned
`Export` + `Subscribe`.
Left **Summary** panel: donut chart with `3.52 MB` / `Total` in the hole, segments
coloured per type, then a legend list — icon + name + file count on the left, size
right-aligned: Video `1 files` 2.85 MB · PDF `1 files` 0.46 MB · Spreadsheets
`2 files` 0.08 MB · Images `1 files` 0.07 MB · Documents `2 files` 0.05 MB.
Right: **Over the period** + accent dropdown `All time`, a flat line chart (y axis
0–4 MB in 1 MB steps, x Aug 14…Aug 20, a single accent line with point markers),
and below it a table `Index · Name · # Files · Size` with a leading folder-dropdown
header cell. Rows: `1 Get to know VDR` / 7 / 3.52 MB, and `test 2` / 0 / `< 0.01 MB`.

### 4.8 `/reports/permissions` — breadcrumb `Reports > Permissions log`
Label is **Permissions log**.
Filter row: `Period`, `Target group` select, `Author` select, right-aligned `Export`
+ `Subscribe`. Left pane **Documents**: search + project tree (`test 2` selected,
child `1 Get to know VDR`). Right: empty state — folder-with-magnifier illustration,
**"No matching results"**, "Try adjusting the filters or using another search query".

### 4.9 `/reports/subscriptions` — breadcrumb `Reports > Subscriptions`
No filter row. Empty state: open-envelope illustration with a bell badge,
**"You have no subscriptions yet"**, "To add subscriptions, create new report in
Activity log", accent button `Go to activity log`.
