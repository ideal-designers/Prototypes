---
description: Map the user flow / screen-and-state graph for a feature or existing prototype
argument-hint: <feature name, prototype slug, or flow description>
---

Map the user flow for: **$ARGUMENTS**

Goal: a clear screen-and-state map before (or instead of) building — to expose missing states, dead ends, and decision points early.

Steps:

1. **Scope** — if this is an existing prototype, read its component(s) under `src/app/prototypes/{slug}/` to extract real states and transitions. If it's a new feature, work from the description (ask 1–2 questions only if the core task is ambiguous).
2. **Identify the actor** — which FVDR persona drives this flow and what's their goal.
3. **Enumerate**:
   - **Entry points** — how the user arrives.
   - **Screens / steps** — each distinct view.
   - **States per screen** — default, empty, loading, error, success, no-permission.
   - **Transitions** — what action moves between them; mark decision branches.
   - **Exits** — completion, cancel, dead ends (flag dead ends as problems).
4. **Render the map** as a Mermaid `flowchart` (states as nodes, actions as edge labels). Use subgraphs per screen.

Output:
```
# Flow Map — <feature>
Actor: <persona> · Goal: <one line>

```mermaid
flowchart TD
  ...
```

## Coverage gaps
- missing states / unhandled transitions / dead ends

## Build notes
- which DS_COMPONENTS each screen needs
```
Be explicit about every state that isn't yet handled — that list is the real value.
