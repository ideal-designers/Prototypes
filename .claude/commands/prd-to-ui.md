---
description: Turn a PRD / feature description into a working FVDR prototype screen
argument-hint: <PRD text, file path, or feature description>
---

Turn this into a working FVDR prototype: **$ARGUMENTS**

If the input is thin, ask 2–3 sharp scoping questions first (primary user, core task, success state). Don't over-ask — pick sensible defaults and note them.

Steps:

1. **Extract the spec** — primary user/persona, the one core task, screens/states needed (incl. empty/loading/error/success), and the success criterion. Keep it tight; this is a prototype, not production.
2. **Map to the design system** — for each UI need, name the `DS_COMPONENTS` member that covers it (button, input, table, modal, dropdown…). List anything the DS lacks; prefer the established patterns in `SKILL.md` (side-panel, context menu) over inventing.
3. **Plan the layout** — shell/sidebar per CLAUDE.md, content area white + borderless.
4. **Build it** — hand off to the **frontend-implementer** agent: create `src/app/prototypes/{slug}/`, register route in `app.routes.ts` + `proto-registry.ts`, wire `TrackerService`.
5. **Verify** — `node scripts/token-audit.js` (0 errors), start the preview, load the route, screenshot, check console. Share the screenshot.

Output: the extracted spec (so the designer can sanity-check intent), the component mapping, and links to the created files + preview screenshot. Don't deploy unless asked.
