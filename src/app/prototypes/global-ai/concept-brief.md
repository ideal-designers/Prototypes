# Concept Brief — Global AI in VDR (`fvdr-global-ai`)

> Clickable concept prototype for heatmap / click testing. No real generation —
> all responses and the Deep Research report are hard-coded demo content.
> Built **only** on `fvdr-*` DS components and design tokens.

## Current state
- FVDR has **no global AI entry point**. There is no AI action in the room shell
  (header / sidebar), and no single place to ask questions across room documents.
- AI capabilities, where they exist, are scattered and feature-local.

## Problems
- A lawyer / M&A analyst working in a deal room has **no fast way to query the
  room's documents** ("what are the upcoming contract payments?", "summarize the
  financials") without manually opening files.
- A competitor (**Egnyte AI**) already ships this: multi-model assistant, a
  curated due-diligence prompt catalog, agents (Deep Research), and MCP connectors.
- The core **risk**: uncontrolled exposure of confidential deal data to external
  LLMs / the open web. Any AI must stay **inside the room perimeter**.

## Design goals
1. **One global entry point** to AI, reachable from any room screen (header action).
2. **Scoped, in-perimeter sources** — the assistant works only over room documents;
   the user can narrow scope to specific files or folders. No external web by design.
3. **Due-diligence prompts out of the box** — a curated, searchable catalog.
4. **Visible provenance** — every answer/claim links back to its source document &
   page in the room (our differentiator vs Egnyte).
5. **Permissions as an invariant** — the assistant only sees and returns content the
   current user already has access to (document/group-level permissions). Surfaced
   as a persistent, non-intrusive banner.

## Approach
- An **AI Hub** layered over the standard VDR room shell (`fvdr-sidebar-nav` +
  `fvdr-header`), reached via an `AI` header action.
- Hub blocks: permissions banner → hero with **starter prompt chips** → composer
  (model selector, **file/folder scope picker**, prompt catalog launcher) →
  **inline sourced answer** → disclaimer → agents gallery.
- **Scope picker** (`fvdr-modal` + `fvdr-checkbox` tree): defaults to all room
  documents; the user can restrict the assistant to chosen folders or individual
  files. The composer shows the active scope; no external/web source exists.
- **Inline answer**: asking returns a permission-scoped answer where every claim
  carries a clickable source citation, plus an "Open in Deep Research" path — the
  citation provenance is present from the first interaction, not only inside agents.
- **Agents gallery** ships Deep Research live, with Document Summarizer & Risk
  Flagger shown as roadmap ("Soon") and a "Create your own agent" entry.
- **Prompt catalog** as an `fvdr-modal` (l/xl) with `fvdr-tabs`
  (All / By Ideals / Custom / Favorites), `fvdr-search`, and a grid of `fvdr-card`
  DD prompts; inserting a prompt fills the composer.
- **Deep Research** agent opens a chat-style state with the same composer and a
  hard-coded **structured report whose every claim carries a clickable citation**
  to a room document/page.
- **Security-first defaults** throughout: no external/web sources, permissions banner
  always present, copy that reinforces "in-perimeter, access-inherited".

## Out of scope (assumptions to confirm with product)
- Target product is **Ideals VDR** (not Board).
- Real backend / LLMs, real MCP connectors, real permission inheritance are simulated
  with UI states and demo data.
- Model list (Gemini 2.5 Flash / GPT-5.2 / Sonnet 4.6 — default Sonnet) and the DD
  prompt/agent list are starting points taken from competitor UI; finalize with the
  product & DD teams.
