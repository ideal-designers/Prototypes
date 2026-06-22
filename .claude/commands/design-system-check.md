---
description: Run the FVDR design-system compliance audit on the current diff (or whole src)
argument-hint: [optional path or "all"]
---

Audit design-system compliance for: **$ARGUMENTS** (default: the current git diff; pass `all` to scan all of `src/`).

Steps:

1. Run the token audit:
   ```bash
   node scripts/token-audit.js
   ```
2. Determine scope: if no argument, use `git diff --name-only` (staged + unstaged) limited to `src/**`. If `all`, scan everything the audit covers. If a path is given, focus there.
3. For the in-scope files, go beyond the regex audit — read them and check for:
   - Hardcoded color / px / radius / font-size / shadow instead of `--tokens`.
   - Inline `<svg>` where the icon exists in `FvdrIconName` → must be `<fvdr-icon>`.
   - Hand-rolled components duplicating a `DS_COMPONENTS` member.
   - New DS component missing its `ds-doc-block` + `navCategories` entry + count bump.
   - Content area not white/borderless; grey used outside the sidebar.
   - Font tokens used without px fallback (`var(--font-size-md, 15px)`).

For anything non-trivial, delegate to the **design-system-guardian** agent.

Output:
```
# DS Check — <scope>
Audit: PASS/FAIL (N errors, M warnings)

## ❌ Must fix   (file:line → token/component)
## ⚠️ Warnings
## ✅ Clean
```
End with the single most important fix to make first.
