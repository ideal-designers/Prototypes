---
description: Full review of a prototype screen — UX, design-system compliance, accessibility, and QA in one pass
argument-hint: <route, component path, or Figma node>
---

Run a complete review of the screen: **$ARGUMENTS**

If no target was given, ask which route/component/Figma node to review, then proceed.

Orchestrate four specialized agents **in parallel** (single message, multiple Agent calls), each scoped to this target:

1. **ux-reviewer** — usability, hierarchy, state coverage, copy (persona-grounded).
2. **design-system-guardian** — token/component/icon compliance.
3. **accessibility-reviewer** — WCAG 2.1 AA.
4. **qa-tester** — build, token audit, runtime errors, core interactions, responsive + dark theme.

Then synthesize into one report:

```
# Page Review — <target>

## Verdict: 🟢 Ship / 🟡 Fix-then-ship / 🔴 Blocked

## 🔴 Blockers (merged, deduped, by severity)
## 🟡 Should-fix
## 🟢 Polish

## What's solid
```

Deduplicate findings that multiple agents raised. Reference `file:line`. Quote the exact token/component/SC for each fix. End with a one-line recommendation.
