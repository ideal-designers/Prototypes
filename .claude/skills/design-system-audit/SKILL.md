---
name: design-system-audit
description: Audit FVDR UI code for design-system compliance — tokens, icons, component reuse, showcase completeness, and accessibility basics. Use when checking a diff, a single component, or all of src/ before merge/deploy, or when the user asks to "audit the design system", "check DS compliance", or "is this on-token".
---

# Design System Audit — FVDR

A repeatable, thorough compliance pass for the FVDR design system. This is the richer counterpart to the `/design-system-check` command: the command is the quick entry point, this skill carries the full checklist, examples, and judgment calls.

## When to use
- Before merging a `claude/*` branch or deploying.
- After building a new prototype or DS component.
- When the token audit passes but you want a human-level review (regex can't catch reinvented components or missing showcase entries).

## Inputs & sources of truth
| Thing | Source |
|---|---|
| Tokens | `src/app/shared/ds/tokens.css` + tables in `CLAUDE.md` / `SKILL.md` |
| Components | `src/app/shared/ds/index.ts` → `DS_COMPONENTS` |
| Icons | `src/app/shared/ds/icons/icons.ts` → `FvdrIconName` |
| Automated audit | `node scripts/token-audit.js` (exit 0 = clean, 1 = errors) |
| Showcase | the `/ds` page component (`ds-showcase` / `ds-registry`) |

## Procedure
1. **Run the automated audit first.**
   ```bash
   node scripts/token-audit.js
   ```
   Capture the error/warning count. This is the floor, not the ceiling.
2. **Scope the manual pass.** Default to the diff:
   ```bash
   git diff --name-only HEAD | grep -E '^src/.*\.(ts|css|scss)$'
   ```
   Or audit a single component dir, or all of `src/` if asked.
3. **Walk `checklist.md`** against each in-scope file. The checklist is the authoritative list of what counts as a violation, with severity.
4. **Use `examples.md`** to show the exact before→after fix for each violation class. Always cite the precise token/component name.
5. **Report** grouped by severity (🔴 must-fix / 🟡 warning / ✅ clean), every item with `file:line` and the concrete fix. End with the single highest-priority fix.

## Escalation
For a deep pass, delegate specialized slices to agents:
- token/component/icon depth → **design-system-guardian**
- WCAG depth → **accessibility-reviewer**

## Output template
```
# DS Audit — <scope>
Automated audit: PASS/FAIL (N errors, M warnings)

## 🔴 Must fix
- file:line — <violation> → use `<token/component>`

## 🟡 Warnings
- ...

## ✅ Clean / compliant
- ...

## First fix: <the one to do now>
```
