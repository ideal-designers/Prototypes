#!/usr/bin/env node
/**
 * drift-detect.js — FVDR Design System Drift Detector
 *
 * Compares color tokens in src/tokens.css against
 * the canonical values documented in specs/foundations/color.md.
 * Flags any mismatch so specs stay in sync with the token file.
 *
 * Usage:
 *   node scripts/drift-detect.js
 *
 * Exit codes:
 *   0 — in sync
 *   1 — drift detected (specs out of date)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_CSS = path.join(ROOT, 'src', 'tokens.css');
const COLOR_SPEC  = path.join(ROOT, 'specs', 'foundations', 'color.md');
const TOKEN_REF   = path.join(ROOT, 'specs', 'tokens', 'token-reference.md');

// ─── Extract hex values from tokens.css ──────────────────────────────────────

function extractTokensFromCss(css) {
  const map = {};
  const re = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    map[`--${m[1]}`] = m[2].toLowerCase();
  }
  return map;
}

// ─── Extract hex values mentioned in a markdown file ─────────────────────────

function extractHexFromMd(md) {
  const re = /`(--[\w-]+)`[^`\n]*`(#[0-9a-fA-F]{3,8})`/g;
  const pairs = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    pairs.push({ token: m[1], hex: m[2].toLowerCase() });
  }
  return pairs;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const cssTokens = extractTokensFromCss(fs.readFileSync(TOKENS_CSS, 'utf8'));
const specPairs = [
  ...extractHexFromMd(fs.readFileSync(COLOR_SPEC, 'utf8')),
  ...extractHexFromMd(fs.readFileSync(TOKEN_REF, 'utf8')),
];

let drifts = 0;

console.log('\n=== FVDR Drift Detection ===\n');

for (const { token, hex } of specPairs) {
  const actual = cssTokens[token];
  if (!actual) {
    console.log(`  MISSING  ${token} — documented as ${hex} but not in tokens.css`);
    drifts++;
  } else if (actual !== hex) {
    console.log(`  DRIFT    ${token}`);
    console.log(`           spec says: ${hex}`);
    console.log(`           css says:  ${actual}`);
    drifts++;
  }
}

console.log('\n───────────────────────────────────────');

if (drifts === 0) {
  console.log('PASSED — specs and tokens.css are in sync.\n');
  process.exit(0);
} else {
  console.log(`FAILED — ${drifts} drift(s) found. Update specs/ or tokens.css.\n`);
  process.exit(1);
}
