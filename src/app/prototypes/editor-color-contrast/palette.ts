/**
 * TinyMCE default `color_map` — verbatim from
 * node_modules/tinymce/themes/silver/theme.js (v8.5.1, registerOption('color_map')).
 *
 * The DS <fvdr-text-editor> never sets `color_map`, so this is exactly the swatch
 * set a user sees behind the "forecolor" toolbar button in the product.
 */
export const TINYMCE_DEFAULT_COLORS: ReadonlyArray<readonly [string, string]> = [
  ['#BFEDD2', 'Light Green'],
  ['#FBEEB8', 'Light Yellow'],
  ['#F8CAC6', 'Light Red'],
  ['#ECCAFA', 'Light Purple'],
  ['#C2E0F4', 'Light Blue'],
  ['#2DC26B', 'Green'],
  ['#F1C40F', 'Yellow'],
  ['#E03E2D', 'Red'],
  ['#B96AD9', 'Purple'],
  ['#3598DB', 'Blue'],
  ['#169179', 'Dark Turquoise'],
  ['#E67E23', 'Orange'],
  ['#BA372A', 'Dark Red'],
  ['#843FA1', 'Dark Purple'],
  ['#236FA1', 'Dark Blue'],
  ['#ECF0F1', 'Light Gray'],
  ['#CED4D9', 'Medium Gray'],
  ['#95A5A6', 'Gray'],
  ['#7E8C8D', 'Dark Gray'],
  ['#34495E', 'Navy Blue'],
  ['#000000', 'Black'],
  ['#FFFFFF', 'White'],
];

/** Editor content surfaces the same stored HTML can land on. */
export const LIGHT_SURFACE = '#FFFFFF';                 // --color-stone-0
export const DARK_SURFACE  = '#1F2129';                 // --primitive-dark-stone-0

/** WCAG 2.1 thresholds for text. */
export const AA_TEXT  = 4.5;   // normal body text
export const AA_LARGE = 3.0;   // >=18.66px bold / >=24px

/** sRGB channel -> linear, per WCAG 2.1 relative luminance. */
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export type Verdict = 'both' | 'light-only' | 'dark-only' | 'neither';

export interface ColorRow {
  hex: string;
  name: string;
  /** Contrast against the light editor surface. */
  light: number;
  /** Contrast against the dark editor surface. */
  dark: number;
  lightPass: boolean;
  darkPass: boolean;
  /** Clears 3:1 — readable for large/bold text only. */
  lightLarge: boolean;
  darkLarge: boolean;
  verdict: Verdict;
}

export function auditPalette(
  colors: ReadonlyArray<readonly [string, string]> = TINYMCE_DEFAULT_COLORS,
): ColorRow[] {
  return colors.map(([hex, name]) => {
    const light = round2(contrast(hex, LIGHT_SURFACE));
    const dark  = round2(contrast(hex, DARK_SURFACE));
    const lightPass = light >= AA_TEXT;
    const darkPass  = dark  >= AA_TEXT;
    const verdict: Verdict =
      lightPass && darkPass ? 'both'
      : lightPass ? 'light-only'
      : darkPass ? 'dark-only'
      : 'neither';
    return {
      hex, name, light, dark, lightPass, darkPass,
      lightLarge: light >= AA_LARGE,
      darkLarge:  dark  >= AA_LARGE,
      verdict,
    };
  });
}

/**
 * The feasibility window for a single hex that must clear `threshold` on BOTH
 * surfaces. Returns the luminance band, or null when no such colour exists.
 */
export function dualWindow(threshold: number): { min: number; max: number } | null {
  const max = (luminance(LIGHT_SURFACE) + 0.05) / threshold - 0.05;  // vs light
  const min = threshold * (luminance(DARK_SURFACE) + 0.05) - 0.05;   // vs dark
  return min <= max ? { min, max } : null;
}

/** Highest contrast obtainable on the weaker of the two surfaces. */
export function bestDualContrast(): number {
  const lw = luminance(LIGHT_SURFACE);
  const ld = luminance(DARK_SURFACE);
  let best = 0;
  for (let i = 0; i <= 1000; i++) {
    const y = i / 1000;
    best = Math.max(best, Math.min((lw + 0.05) / (y + 0.05), (y + 0.05) / (ld + 0.05)));
  }
  return round2(best);
}

/**
 * Stop-gap palette: for each hue, the colour that maximises the weaker side.
 * Every entry lands at ~4:1 — the mathematical ceiling for a shared palette
 * over these two surfaces. Clears AA for large text, misses AA for body text.
 */
export const DUAL_SAFE_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#DE4C47', 'Red'],
  ['#C7640D', 'Orange'],
  ['#8F7E3D', 'Yellow'],
  ['#388F55', 'Green'],
  ['#3C8B86', 'Turquoise'],
  ['#197FE6', 'Blue'],
  ['#9C6DB0', 'Purple'],
  ['#E03E8F', 'Magenta'],
  ['#7F7F7F', 'Gray'],
];

/**
 * Theme-aware pairs: one semantic name, a hex tuned per surface. This is the
 * only way to clear AA 4.5:1 on both themes — see dualWindow(4.5) === null.
 */
export const THEME_AWARE_PAIRS: ReadonlyArray<{ name: string; onLight: string; onDark: string }> = [
  { name: 'Red',       onLight: '#C0392B', onDark: '#FF8A80' },
  { name: 'Orange',    onLight: '#A55A00', onDark: '#FFB454' },
  { name: 'Yellow',    onLight: '#7A6A00', onDark: '#F5D547' },
  { name: 'Green',     onLight: '#1E7A46', onDark: '#5FD08A' },
  { name: 'Turquoise', onLight: '#0F6F63', onDark: '#4FCFC0' },
  { name: 'Blue',      onLight: '#1668B8', onDark: '#6FB8F5' },
  { name: 'Purple',    onLight: '#7B3FA0', onDark: '#CE9BE8' },
  { name: 'Gray',      onLight: '#5F616A', onDark: '#B5BBBF' },
];
