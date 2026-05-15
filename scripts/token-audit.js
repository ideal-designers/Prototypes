#!/usr/bin/env node
/**
 * token-audit.js — FVDR Design Token Audit Script
 *
 * Scans src/**\/*.{css,scss,ts} for hardcoded design values and suggests token replacements.
 *
 * Exit codes:
 *   0 — no errors (warnings OK)
 *   1 — errors found (hardcoded colors, etc.)
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const SRC_DIR = path.resolve(__dirname, '../src');
const IGNORE_PATHS = [
  'tokens.css',
  path.join('src', 'styles.css'), // global dark-background styles intentionally hardcoded
];
const IGNORE_PATH_PATTERNS = [
  /specs\//,
  /\.spec\./,
  /node_modules/,
];

// Files whose dark-theme overrides are intentionally un-tokenized
const ALLOW_DARK_THEME_PATTERNS = [
  /dark-theme/,
];

// Color → token mapping (in order of specificity — longest hex first)
const COLOR_TOKEN_MAP = {
  '#1f2129': '--color-text-primary',
  '#1F2129': '--color-text-primary',
  '#5f616a': '--color-icon',
  '#5F616A': '--color-icon',
  '#dee0eb': '--color-border',
  '#DEE0EB': '--color-border',
  '#f7f7f7': '--color-bg-surface',
  '#F7F7F7': '--color-bg-surface',
  '#fbfbfb': '--color-bg-subtle',
  '#FBFBFB': '--color-bg-subtle',
  '#2c9c74': '--color-interactive-primary',
  '#2C9C74': '--color-interactive-primary',
  '#e54430': '--color-danger',
  '#E54430': '--color-danger',
  '#bbbdc8': '--color-border-input',
  '#BBBDC8': '--color-border-input',
  '#b0b3c0': '--color-text-placeholder',
  '#B0B3C0': '--color-text-placeholder',
  '#73757f': '--color-text-muted',
  '#73757F': '--color-text-muted',
  '#40424b': '--color-interactive-secondary',
  '#40424B': '--color-interactive-secondary',
  '#eceef9': '--color-selection-bg',
  '#ECEEF9': '--color-selection-bg',
  '#f4640c': '--color-brand-orange',
  '#F4640C': '--color-brand-orange',
  '#eef0f8': '--color-hover-bg',
  '#EEF0F8': '--color-hover-bg',
  '#9b9da6': '--color-text-disabled',
  '#9B9DA6': '--color-text-disabled',
  '#9c9ea8': '--color-text-subtle',
  '#9C9EA8': '--color-text-subtle',
  '#efefef': '--color-hover-light',
  '#EFEFEF': '--color-hover-light',
  '#ffffff': '--color-bg-page',
  '#FFFFFF': '--color-bg-page',
  '#fff': '--color-bg-page',
  '#FFF': '--color-bg-page',
  '#268a65': '--color-interactive-hover',
  '#268A65': '--color-interactive-hover',
  '#f0faf5': '--color-active-nav-bg',
  '#F0FAF5': '--color-active-nav-bg',
  '#ebf8ef': '--color-selected-row',
  '#EBF8EF': '--color-selected-row',
  '#dff4e8': '--color-selected-row-hover',
  '#DFF4E8': '--color-selected-row-hover',
  '#cc3926': '--color-danger-hover',
  '#CC3926': '--color-danger-hover',
  '#ed7c6e': '--color-danger-border',
  '#ED7C6E': '--color-danger-border',
  '#fff5f4': '--color-danger-surface',
  '#FFF5F4': '--color-danger-surface',
  '#ebf4fd': '--color-feature-bg',
  '#EBF4FD': '--color-feature-bg',
};

// Font-size → token mapping
const FONT_SIZE_TOKEN_MAP = {
  '12px': '--font-size-xs',
  '13px': '--font-size-sm',
  '14px': '--font-size-base',
  '15px': '--font-size-md',
  '16px': '--font-size-lg',
  '18px': '--font-size-xl',
  '20px': '--font-size-2xl',
};

// ─── Regexes ──────────────────────────────────────────────────────────────────

const REGEXES = {
  // Hex colors NOT inside var(...) and NOT SVG fill/stroke attributes
  hex: /(?<!var\([^)]*)(#[0-9a-fA-F]{3,8})(?![0-9a-fA-F])/g,

  // Raw rgba/rgb (not in token file)
  rgba: /(?<!var\([^)]*)\brgba?\s*\(/g,

  // Font-size with raw px (not already using var())
  fontSize: /font-size\s*:\s*(\d+px)(?!\s*\/\*)/g,

  // Font-weight with raw number (not using var())
  fontWeight: /font-weight\s*:\s*(\d{3})(?!\s*\/\*)/g,

  // Box-shadow with hardcoded values (not using var())
  boxShadow: /box-shadow\s*:\s*(?!var\()[^;{]+(?:\d+px|rgba)/g,

  // Transition with raw ms (not using var())
  transitionMs: /transition\s*:[^;{]*\d+ms/g,
};

// Lines to skip (SVG, HTML attributes on component props, comments, already tokenized)
const SKIP_LINE_PATTERNS = [
  /fill="[^"]*#/,                   // SVG fill attribute
  /stroke="[^"]*#/,                 // SVG stroke attribute
  /stop-color=/,                    // SVG gradient stop colors (logo/illustration SVGs)
  /stop-opacity=/,                  // SVG gradient stop opacity
  /<stop\s/,                        // SVG gradient stop element
  /<linearGradient/,                // SVG gradient definition
  /<radialGradient/,                // SVG radial gradient definition
  /<path\s/,                        // SVG path element
  /<rect\s/,                        // SVG rect element
  /<circle\s/,                      // SVG circle element
  /<polygon\s/,                     // SVG polygon
  /<ellipse\s/,                     // SVG ellipse
  /d="[Mm]/,                        // SVG path data
  /clip-path/,                      // SVG clip-path
  /var\(--/,                        // Already uses a var()
  /\/\/.*(#[0-9a-fA-F]{3,8})/,     // Comment line with hex
  /logoColor\s*:/,                  // logoColor data property
  /logoColor.*#/,                   // logoColor value
  /\[style\.color\]="item\.logoColor"/, // Dynamic logo color binding
  /color="#[0-9a-fA-F]".*fvdr-avatar/, // Avatar color prop (DS component prop)
  /textColor="#[0-9a-fA-F]{3,8}"/, // Avatar textColor prop (DS component prop)
];

// These hex values are intentionally not in the token map (dark theme, SVG brand colors, etc.)
const KNOWN_INTENTIONAL = new Set([
  '#084D4B', '#8CEAA7', // CA logo SVG
  '#8B5CF6', '#4862D3', '#358CEB', '#FF4A00', // Integration logo colors (logoColor prop)
  '#0B1410', '#101A16', '#e8f5f0', '#9bbfb0', '#1e2e28', // Global dark bg (styles.css)
  '#3FB67D', // styles.css primary hover
  '#EF5350', // styles.css red
  '#8b949a', '#33383b', '#2d3235', '#212426', '#292d2f', // dark theme values
  '#50575c', '#b5bbbf', '#1e3028', '#6f7980', '#40464a',
  '#e8e8e8', '#f0f0f0', // one-off hover colors close to tokens
  '#24845f', // older hover variant
  '#1c8269', '#268a65', // hover variants
  '#1e2d3f', '#3a2220', // dark theme specific bg colors
  '#c62c19', // danger darker variant
  '#3a5a50', '#2a3d36', '#0f201a', // home/login screen dark bg variants
  '#fff', '#FFF', // shorthand white used in non-prototype DS components
  '#0f1f19', // docs.component.ts dark background (table row divider)
  '#0d1820', // home.component.ts dark background (docs card gradient)
  '#1a1d21', // doc-block.component.ts dark background (prompt block)
  '#e5e7eb', // doc-block.component.ts light border (prompt text color)
  '#1a2e4a', // project-archive component dark background (logo bg)
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function walkDir(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...walkDir(fullPath, exts));
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function isIgnored(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  if (IGNORE_PATHS.some(p => rel.endsWith(p) || rel.includes(p))) return true;
  if (IGNORE_PATH_PATTERNS.some(r => r.test(rel))) return true;
  return false;
}

function shouldSkipLine(line) {
  // Also skip CSS block comment lines (/* ... */ or * ...)
  const trimmed = line.trim();
  if (trimmed.startsWith('/*') || trimmed.startsWith('* ') || trimmed === '*/' || trimmed.startsWith('//')) {
    return true;
  }
  return SKIP_LINE_PATTERNS.some(r => r.test(line));
}

// ─── Main audit ───────────────────────────────────────────────────────────────

const files = walkDir(SRC_DIR, ['.css', '.scss', '.ts']);

let totalErrors = 0;
let totalWarnings = 0;
const violations = []; // { file, line, col, level, message, suggestion }

for (const filePath of files) {
  if (isIgnored(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(path.resolve(__dirname, '..'), filePath);

  // Only audit styles sections in .ts files (between backtick style arrays)
  // For .css/.scss audit entire file
  const isTs = filePath.endsWith('.ts');

  let inStyleBlock = false;
  let styleDepth = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Track style block in TS files
    if (isTs) {
      if (/styles\s*:\s*\[/.test(line)) inStyleBlock = true;
      if (inStyleBlock) {
        if (/`/.test(line)) styleDepth += (line.match(/`/g) || []).length;
        // Exit style block after closing backtick + bracket
        if (styleDepth >= 2 && /\]/.test(line)) {
          inStyleBlock = false;
          styleDepth = 0;
        }
      }
      // For template strings (color attribute on components), check inline styles too
      if (!inStyleBlock && !/style="|style='|\[style/.test(line)) {
        if (!/color="#|textColor="#/.test(line)) return;
      }
    }

    if (shouldSkipLine(line)) return;

    // 1. Check hex colors
    const hexMatches = [...line.matchAll(/(?<![\w-])(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)];
    for (const m of hexMatches) {
      const hex = m[0];
      const normalized = hex.toLowerCase();
      if (KNOWN_INTENTIONAL.has(hex) || KNOWN_INTENTIONAL.has(hex.toUpperCase())) continue;
      // Skip 0-length, already var()
      if (line.includes(`var(${hex})`)) continue;

      const suggestion = COLOR_TOKEN_MAP[hex] || COLOR_TOKEN_MAP[normalized] || '(no token — add to tokens.css)';
      violations.push({
        file: rel,
        line: lineNum,
        level: 'ERROR',
        message: `Hardcoded color ${hex}`,
        suggestion: suggestion !== '(no token — add to tokens.css)'
          ? `use var(${suggestion})`
          : suggestion,
      });
      totalErrors++;
    }

    // 2. Check rgba() (warnings unless it's an overlay/shadow token value)
    if (/rgba?\s*\(/.test(line) && !line.includes('var(--')) {
      const isKnownShadow = /rgba\(0,\s*0,\s*0/.test(line) && /box-shadow|shadow/.test(line);
      const isOverlay = /rgba\(0,\s*0,\s*0/.test(line) && /background/.test(line);
      if (!isKnownShadow && !isOverlay) {
        violations.push({
          file: rel,
          line: lineNum,
          level: 'WARNING',
          message: 'Hardcoded rgba() color',
          suggestion: 'use a semantic token from --color-overlay-* or --shadow-*',
        });
        totalWarnings++;
      }
    }

    // 3. Check font-size (warnings)
    const fsPat = /font-size\s*:\s*(\d+px)/g;
    let fsM;
    while ((fsM = fsPat.exec(line)) !== null) {
      if (line.includes('var(--font-size')) continue;
      const px = fsM[1];
      const token = FONT_SIZE_TOKEN_MAP[px];
      violations.push({
        file: rel,
        line: lineNum,
        level: 'WARNING',
        message: `Hardcoded font-size: ${px}`,
        suggestion: token ? `use var(${token})` : '(no token)',
      });
      totalWarnings++;
    }

    // 4. Transitions with raw ms (warnings)
    if (/transition\s*:[^;{]*\d+ms/.test(line) && !line.includes('var(--duration')) {
      violations.push({
        file: rel,
        line: lineNum,
        level: 'WARNING',
        message: 'Hardcoded transition duration (raw ms)',
        suggestion: 'use var(--duration-fast|base|slow|xslow)',
      });
      totalWarnings++;
    }
  });
}

// ─── Output ───────────────────────────────────────────────────────────────────

// Group by file
const byFile = {};
for (const v of violations) {
  if (!byFile[v.file]) byFile[v.file] = [];
  byFile[v.file].push(v);
}

console.log('\n=== FVDR Token Audit ===\n');

const sortedFiles = Object.keys(byFile).sort();
for (const file of sortedFiles) {
  const fileViolations = byFile[file];
  const errors = fileViolations.filter(v => v.level === 'ERROR').length;
  const warnings = fileViolations.filter(v => v.level === 'WARNING').length;
  console.log(`\n${file} (${errors} errors, ${warnings} warnings)`);
  for (const v of fileViolations) {
    const prefix = v.level === 'ERROR' ? '  ERROR' : '  WARN ';
    console.log(`  ${prefix}  line ${v.line}: ${v.message} → ${v.suggestion}`);
  }
}

console.log('\n───────────────────────────────────────');
console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
console.log('───────────────────────────────────────\n');

if (totalErrors > 0) {
  console.log('FAILED — fix all errors before committing.\n');
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log('PASSED with warnings — errors are required to be zero.\n');
  process.exit(0);
} else {
  console.log('PASSED — zero errors and zero warnings.\n');
  process.exit(0);
}
