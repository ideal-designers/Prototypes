/**
 * FVDR Design System — Viewport Breakpoints
 *
 * Single source of truth for responsive breakpoints (mirrors the --bp-* tokens
 * in src/tokens.css). Mobile-first min-width thresholds.
 *
 * We do NOT use a column grid — only the 4px spacing grid + these breakpoints.
 *
 * Use these constants in TS (matchMedia, resize logic) and the literal px in
 * CSS @media rules — CSS var() does not work inside @media conditions.
 */

export const BREAKPOINTS = {
  /** ≥375  — mobile (base)          */ mobile: 375,
  /** ≥768  — tablet                 */ tablet: 768,
  /** ≥1024 — laptop / small desktop */ laptop: 1024,
  /** ≥1440 — desktop (large)        */ desktop: 1440,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/** Ready-to-use min-width media query strings, e.g. `(min-width: 768px)`. */
export const MEDIA_UP: Record<BreakpointName, string> = {
  mobile:  `(min-width: ${BREAKPOINTS.mobile}px)`,
  tablet:  `(min-width: ${BREAKPOINTS.tablet}px)`,
  laptop:  `(min-width: ${BREAKPOINTS.laptop}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
};
