import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { DS_COMPONENTS, SegmentItem } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import {
  TINYMCE_DEFAULT_COLORS,
  DUAL_SAFE_PALETTE,
  THEME_AWARE_PAIRS,
  LIGHT_SURFACE,
  DARK_SURFACE,
  AA_TEXT,
  AA_LARGE,
  auditPalette,
  contrast,
  luminance,
  dualWindow,
  bestDualContrast,
  round2,
  ColorRow,
  Verdict,
} from './palette';

const SLUG = 'editor-color-contrast';

/** The colour the customer actually used — TinyMCE "Gray". */
const REPORTED_HEX = '#95A5A6';

type FilterId = 'all' | 'light-only' | 'dark-only' | 'neither' | 'both';
type ThemeId = 'light' | 'dark';

const VERDICT_LABEL: Record<Verdict, string> = {
  'both':       'Both themes',
  'light-only': 'Light only',
  'dark-only':  'Dark only',
  'neither':    'Fails both',
};

const VERDICT_VARIANT: Record<Verdict, 'success' | 'warning' | 'error'> = {
  'both':       'success',
  'light-only': 'warning',
  'dark-only':  'warning',
  'neither':    'error',
};

@Component({
  selector: 'fvdr-editor-color-contrast',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule, ...DS_COMPONENTS],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
  template: `
    <div class="page">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <header class="head">
        <div class="head__text">
          <h1 class="head__title">Editor colours — theme contrast audit</h1>
          <p class="head__sub">
            Every colour in the TinyMCE text-colour picker, measured against both editor
            surfaces: light <code>{{ lightSurface }}</code> and dark <code>{{ darkSurface }}</code>.
          </p>
        </div>
        <div class="head__score">
          <div class="score">
            <span class="score__num score__num--bad">{{ countBoth }}</span>
            <span class="score__lbl">of {{ rows.length }} colours<br />readable on both themes</span>
          </div>
        </div>
      </header>

      <!-- ── 1. The reported bug ────────────────────────────────── -->
      <section class="sec">
        <h2 class="sec__title"><span class="sec__num">1</span> The reported case</h2>
        <p class="sec__lead">
          The customer set body text to <strong>Gray {{ reportedHex }}</strong> while working on
          the dark theme, where it reads at <strong>{{ reportedDark }}:1</strong>. A colleague
          opens the same content on the light theme and gets
          <strong>{{ reportedLight }}:1</strong> — below the {{ aaText }}:1 minimum, and close to
          invisible on white.
        </p>

        <div class="split">
          <div class="pane pane--light">
            <div class="pane__bar">
              <span class="pane__name">Light theme</span>
              <span class="pane__hex">{{ lightSurface }}</span>
            </div>
            <div class="pane__body">
              <p class="demo-line">Quarterly results are
                <span [style.color]="reportedHex">below the agreed threshold</span>
                and need review.</p>
            </div>
            <div class="pane__foot pane__foot--fail">
              <fvdr-icon name="error"></fvdr-icon>
              {{ reportedLight }}:1 — fails AA ({{ aaText }}:1)
            </div>
          </div>

          <div class="pane pane--dark">
            <div class="pane__bar">
              <span class="pane__name">Dark theme</span>
              <span class="pane__hex">{{ darkSurface }}</span>
            </div>
            <div class="pane__body">
              <p class="demo-line">Quarterly results are
                <span [style.color]="reportedHex">below the agreed threshold</span>
                and need review.</p>
            </div>
            <div class="pane__foot pane__foot--pass">
              <fvdr-icon name="check"></fvdr-icon>
              {{ reportedDark }}:1 — passes AA
            </div>
          </div>
        </div>

        <fvdr-info-banner
          variant="warning"
          title="Why it cannot self-correct"
          [message]="rootCauseMessage">
        </fvdr-info-banner>
      </section>

      <!-- ── 2. Live editor ─────────────────────────────────────── -->
      <section class="sec">
        <h2 class="sec__title"><span class="sec__num">2</span> Try it live</h2>
        <p class="sec__lead">
          A real TinyMCE instance with the stock colour picker. Colour some text, then watch
          the two reader panes below — they render the identical stored HTML on each surface.
        </p>

        <div class="ctl">
          <span class="ctl__lbl">Author is working in</span>
          <fvdr-segment
            [items]="themeItems"
            [(activeId)]="authorTheme"
            size="sm">
          </fvdr-segment>
        </div>

        <div class="editor-host" [class.editor-host--dark]="authorTheme === 'dark'">
          <editor *ngIf="authorTheme === 'light'"
            [init]="lightInit"
            [(ngModel)]="html"
            (ngModelChange)="onHtmlChange($event)"></editor>
          <editor *ngIf="authorTheme === 'dark'"
            [init]="darkInit"
            [(ngModel)]="html"
            (ngModelChange)="onHtmlChange($event)"></editor>
        </div>

        <p class="mirror-label">The same stored HTML, seen by two readers:</p>
        <div class="split">
          <div class="pane pane--light">
            <div class="pane__bar">
              <span class="pane__name">Reader on light</span>
              <span class="pane__hex">{{ lightSurface }}</span>
            </div>
            <div class="pane__body pane__body--rich" [innerHTML]="safeHtml"></div>
          </div>
          <div class="pane pane--dark">
            <div class="pane__bar">
              <span class="pane__name">Reader on dark</span>
              <span class="pane__hex">{{ darkSurface }}</span>
            </div>
            <div class="pane__body pane__body--rich" [innerHTML]="safeHtml"></div>
          </div>
        </div>
      </section>

      <!-- ── 3. Audit table ─────────────────────────────────────── -->
      <section class="sec">
        <h2 class="sec__title"><span class="sec__num">3</span> Full palette audit</h2>
        <p class="sec__lead">
          All {{ rows.length }} colours of the stock <code>color_map</code>, as shipped by
          TinyMCE {{ tinymceVersion }}. Ratios are WCAG 2.1; the bar shows how each colour
          actually looks on that surface.
        </p>

        <fvdr-segment
          [items]="filterItems"
          [(activeId)]="filter"
          size="sm">
        </fvdr-segment>

        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th class="tbl__th tbl__th--name">Colour</th>
                <th class="tbl__th">Hex</th>
                <th class="tbl__th tbl__th--sample">On light {{ lightSurface }}</th>
                <th class="tbl__th tbl__th--num">Ratio</th>
                <th class="tbl__th tbl__th--sample">On dark {{ darkSurface }}</th>
                <th class="tbl__th tbl__th--num">Ratio</th>
                <th class="tbl__th">Verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of visibleRows" class="tbl__row">
                <td class="tbl__td tbl__td--name">
                  <span class="chip-sw" [style.background]="r.hex"></span>
                  {{ r.name }}
                </td>
                <td class="tbl__td tbl__td--hex">{{ r.hex }}</td>

                <td class="tbl__td tbl__td--sample">
                  <span class="sample sample--light" [style.color]="r.hex">Sample text</span>
                </td>
                <td class="tbl__td tbl__td--num"
                    [class.is-pass]="r.lightPass"
                    [class.is-large]="!r.lightPass && r.lightLarge"
                    [class.is-fail]="!r.lightLarge">
                  {{ r.light }}:1
                  <span class="tbl__hint">{{ level(r.lightPass, r.lightLarge) }}</span>
                </td>

                <td class="tbl__td tbl__td--sample">
                  <span class="sample sample--dark" [style.color]="r.hex">Sample text</span>
                </td>
                <td class="tbl__td tbl__td--num"
                    [class.is-pass]="r.darkPass"
                    [class.is-large]="!r.darkPass && r.darkLarge"
                    [class.is-fail]="!r.darkLarge">
                  {{ r.dark }}:1
                  <span class="tbl__hint">{{ level(r.darkPass, r.darkLarge) }}</span>
                </td>

                <td class="tbl__td">
                  <fvdr-status
                    [variant]="verdictVariant(r.verdict)"
                    [label]="verdictLabel(r.verdict)">
                  </fvdr-status>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="tbl__legend">
          <strong>AA</strong> = {{ aaText }}:1, the minimum for body text ·
          <strong>AA large</strong> = {{ aaLarge }}:1, only valid at 24px or 18.66px bold ·
          <strong>Fail</strong> = under {{ aaLarge }}:1
        </p>

        <fvdr-inline-message
          variant="warning"
          [message]="customColorsNote">
        </fvdr-inline-message>
      </section>

      <!-- ── 4. Why a shared palette cannot work ────────────────── -->
      <section class="sec">
        <h2 class="sec__title"><span class="sec__num">4</span> No shared palette can pass AA</h2>
        <p class="sec__lead">
          This is not a case of a few badly chosen swatches — the constraint is arithmetic.
          A colour with relative luminance <em>Y</em> must be dark enough for white and light
          enough for {{ darkSurface }} at the same time:
        </p>

        <div class="proof">
          <div class="proof__row">
            <span class="proof__k">To clear {{ aaText }}:1 on light {{ lightSurface }}</span>
            <span class="proof__v">Y ≤ {{ maxY }}</span>
          </div>
          <div class="proof__row">
            <span class="proof__k">To clear {{ aaText }}:1 on dark {{ darkSurface }}</span>
            <span class="proof__v">Y ≥ {{ minY }}</span>
          </div>
          <div class="proof__row proof__row--result">
            <span class="proof__k">Overlap</span>
            <span class="proof__v" [class.proof__v--bad]="aaWindowEmpty">{{
              aaWindowEmpty ? 'none — the window is empty' : 'a window exists'
            }}</span>
          </div>
        </div>

        <p class="sec__lead">
          The best any single hex can do is <strong>{{ ceiling }}:1</strong> on its weaker
          surface. That clears {{ aaLarge }}:1 for large text but misses {{ aaText }}:1 for body
          text, so a shared palette is a compromise by construction — never a fix.
        </p>
      </section>

      <!-- ── 5. Options ─────────────────────────────────────────── -->
      <section class="sec">
        <h2 class="sec__title"><span class="sec__num">5</span> Two ways out</h2>

        <h3 class="sub">Option A — theme-aware colours <span class="tag tag--rec">recommended</span></h3>
        <p class="sec__lead">
          Store a semantic name instead of a hex, and let each theme resolve its own value.
          Every pair below clears AA {{ aaText }}:1 on its own surface.
        </p>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th class="tbl__th tbl__th--name">Name</th>
                <th class="tbl__th tbl__th--sample">On light</th>
                <th class="tbl__th tbl__th--num">Ratio</th>
                <th class="tbl__th tbl__th--sample">On dark</th>
                <th class="tbl__th tbl__th--num">Ratio</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pairs" class="tbl__row">
                <td class="tbl__td tbl__td--name">{{ p.name }}</td>
                <td class="tbl__td tbl__td--sample">
                  <span class="sample sample--light" [style.color]="p.onLight">{{ p.onLight }}</span>
                </td>
                <td class="tbl__td tbl__td--num is-pass">{{ p.lightRatio }}:1</td>
                <td class="tbl__td tbl__td--sample">
                  <span class="sample sample--dark" [style.color]="p.onDark">{{ p.onDark }}</span>
                </td>
                <td class="tbl__td tbl__td--num is-pass">{{ p.darkRatio }}:1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre class="code"><code>{{ codeSnippet }}</code></pre>

        <h3 class="sub">Option B — one trimmed shared palette <span class="tag">stop-gap</span></h3>
        <p class="sec__lead">
          If the stored format has to stay a raw hex, this is the best a single palette can do:
          every swatch sits at the {{ ceiling }}:1 ceiling on both surfaces. Safe for headings
          and emphasis, still short of AA for body text.
        </p>
        <div class="safe-grid">
          <div class="safe" *ngFor="let s of safePalette">
            <div class="safe__pair">
              <span class="safe__half safe__half--light" [style.color]="s.hex">Aa</span>
              <span class="safe__half safe__half--dark" [style.color]="s.hex">Aa</span>
            </div>
            <span class="safe__name">{{ s.name }}</span>
            <span class="safe__hex">{{ s.hex }}</span>
            <span class="safe__num">{{ s.light }}:1 / {{ s.dark }}:1</span>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; background: var(--color-stone-0, #fff); }

    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: var(--space-8, 32px) var(--space-6, 24px) var(--space-10, 40px);
      font-family: var(--font-family, 'Inter', sans-serif);
      color: var(--color-text-primary, #1F2129);
    }

    /* ── Header ── */
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-6, 24px);
      padding-bottom: var(--space-6, 24px);
      border-bottom: 1px solid var(--color-divider, #DEE0EB);
    }
    .head__title {
      margin: 0 0 var(--space-2, 8px);
      font-size: var(--font-size-4xl, 24px);
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .head__sub {
      margin: 0;
      max-width: 62ch;
      font-size: var(--font-size-base, 14px);
      line-height: 1.55;
      color: var(--color-text-secondary, #5F616A);
    }
    .score { display: flex; align-items: center; gap: var(--space-3, 12px); white-space: nowrap; }
    .score__num { font-size: 40px; font-weight: 700; line-height: 1; }
    .score__num--bad { color: var(--color-error-600, #E54430); }
    .score__lbl {
      font-size: var(--text-caption1-size, 12px);
      line-height: 1.4;
      color: var(--color-text-secondary, #5F616A);
    }

    /* ── Sections ── */
    .sec { padding: var(--space-8, 32px) 0; border-bottom: 1px solid var(--color-divider, #DEE0EB); }
    .sec:last-child { border-bottom: none; }
    .sec__title {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      margin: 0 0 var(--space-3, 12px);
      font-size: var(--font-size-xl, 18px);
      font-weight: 600;
    }
    .sec__num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px; height: 24px;
      border-radius: var(--radius-sm, 4px);
      background: var(--color-primary-50, #EBF8EF);
      color: var(--color-primary-600, #1C8269);
      font-size: var(--text-caption1-size, 12px);
      font-weight: 700;
    }
    .sec__lead {
      margin: 0 0 var(--space-5, 20px);
      max-width: 78ch;
      font-size: var(--font-size-base, 14px);
      line-height: 1.6;
      color: var(--color-text-secondary, #5F616A);
    }
    .sec__lead strong { color: var(--color-text-primary, #1F2129); font-weight: 600; }
    .sub {
      margin: var(--space-8, 32px) 0 var(--space-2, 8px);
      display: flex; align-items: center; gap: var(--space-2, 8px);
      font-size: var(--font-size-base, 14px); font-weight: 600;
    }
    .sub:first-of-type { margin-top: 0; }
    .tag {
      padding: 2px var(--space-2, 8px);
      border-radius: var(--radius-sm, 4px);
      background: var(--color-stone-200, #F7F7F7);
      color: var(--color-text-secondary, #5F616A);
      font-size: var(--font-size-2xs, 11px); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .tag--rec { background: var(--color-primary-50, #EBF8EF); color: var(--color-primary-600, #1C8269); }

    code {
      padding: 1px 5px;
      border-radius: var(--radius-sm, 4px);
      background: var(--color-stone-200, #F7F7F7);
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.92em;
    }

    /* ── Two-surface panes ── */
    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4, 16px);
      margin-bottom: var(--space-5, 20px);
    }
    .pane {
      border: 1px solid var(--color-divider, #DEE0EB);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }
    .pane__bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-divider, #DEE0EB);
      background: var(--color-stone-200, #F7F7F7);
      font-size: var(--text-caption1-size, 12px);
      font-weight: 600;
    }
    .pane__hex { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 400; color: var(--color-text-secondary, #5F616A); }
    .pane__body {
      min-height: 84px;
      padding: var(--space-4, 16px);
      font-size: var(--font-size-base, 14px);
      line-height: 1.6;
    }
    .pane--light .pane__body { background: var(--primitive-neutral-0, #ffffff); color: var(--color-text-primary, #1F2129); }
    .pane--dark  .pane__body { background: var(--primitive-dark-stone-0, #1f2129); color: var(--primitive-dark-stone-1000, #ffffff); }
    .pane--dark  .pane__bar  { background: var(--primitive-dark-stone-200, #292d2f); color: var(--primitive-dark-stone-1000, #ffffff); border-bottom-color: var(--primitive-dark-stone-400, #40464a); }
    .pane--dark  .pane__hex  { color: var(--primitive-dark-stone-800, #a2a9af); }
    .demo-line { margin: 0; }
    .pane__body--rich { overflow-wrap: anywhere; }
    .pane__body--rich ::ng-deep p { margin: 0 0 var(--space-2, 8px); }
    .pane__body--rich ::ng-deep p:last-child { margin-bottom: 0; }

    .pane__foot {
      display: flex; align-items: center; gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-top: 1px solid var(--color-divider, #DEE0EB);
      font-size: var(--text-caption1-size, 12px);
      font-weight: 600;
    }
    .pane__foot--fail { background: var(--primitive-red-100, #fdf0ee); color: var(--color-error-600, #E54430); }
    .pane__foot--pass { background: var(--color-primary-50, #EBF8EF); color: var(--color-primary-600, #1C8269); }

    /* ── Live editor ── */
    .ctl {
      display: flex; align-items: center; gap: var(--space-3, 12px);
      margin-bottom: var(--space-4, 16px);
    }
    .ctl__lbl {
      font-size: var(--text-caption1-size, 12px);
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
    }
    .editor-host { margin-bottom: var(--space-5, 20px); }
    .editor-host ::ng-deep .tox-tinymce {
      border: 1px solid var(--color-divider, #DEE0EB) !important;
      border-radius: var(--radius-md, 8px) !important;
    }
    .editor-host--dark ::ng-deep .tox-tinymce {
      border-color: var(--primitive-dark-stone-400, #40464a) !important;
    }
    .mirror-label {
      margin: 0 0 var(--space-2, 8px);
      font-size: var(--text-caption1-size, 12px);
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
    }

    /* ── Table ── */
    .tbl-wrap { margin: var(--space-4, 16px) 0 var(--space-3, 12px); overflow-x: auto; }
    .tbl { width: 100%; border-collapse: collapse; font-size: var(--font-size-base, 14px); }
    .tbl__th {
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-bottom: 1px solid var(--color-divider, #DEE0EB);
      text-align: left;
      font-size: var(--text-caption1-size, 12px);
      font-weight: 600;
      color: var(--color-text-secondary, #5F616A);
      white-space: nowrap;
    }
    .tbl__th--num, .tbl__td--num { text-align: right; white-space: nowrap; }
    .tbl__row { border-bottom: 1px solid var(--color-divider, #DEE0EB); }
    .tbl__row:hover { background: var(--color-stone-100, #FAFAFA); }
    .tbl__td { padding: var(--space-3, 12px); vertical-align: middle; }
    .tbl__td--name { display: flex; align-items: center; gap: var(--space-2, 8px); font-weight: 500; white-space: nowrap; }
    .tbl__td--hex, .tbl__td--num { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: var(--font-size-sm, 13px); }
    .tbl__td--hex { color: var(--color-text-secondary, #5F616A); }
    .tbl__td--sample { width: 150px; }
    .chip-sw {
      width: 16px; height: 16px; flex: none;
      border-radius: var(--radius-sm, 4px);
      border: 1px solid var(--color-stone-400, #DEE0EB);
    }
    .sample {
      display: block;
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--font-size-base, 14px);
      white-space: nowrap;
    }
    .sample--light { background: var(--primitive-neutral-0, #ffffff); box-shadow: inset 0 0 0 1px var(--color-divider, #DEE0EB); }
    .sample--dark  { background: var(--primitive-dark-stone-0, #1f2129); }

    .tbl__hint { display: block; font-size: var(--font-size-3xs, 10px); font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; opacity: 0.8; }
    .is-pass { color: var(--color-primary-600, #1C8269); }
    .is-large { color: var(--color-notice-text, #7a5c00); }
    .is-fail { color: var(--color-error-600, #E54430); }

    .tbl__legend {
      margin: 0;
      font-size: var(--text-caption1-size, 12px);
      line-height: 1.6;
      color: var(--color-text-secondary, #5F616A);
    }
    .tbl__legend strong { color: var(--color-text-primary, #1F2129); }

    /* ── Proof block ── */
    .proof {
      margin: 0 0 var(--space-5, 20px);
      border: 1px solid var(--color-divider, #DEE0EB);
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
    }
    .proof__row {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-4, 16px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-bottom: 1px solid var(--color-divider, #DEE0EB);
      font-size: var(--font-size-base, 14px);
    }
    .proof__row:last-child { border-bottom: none; }
    .proof__row--result { background: var(--color-stone-200, #F7F7F7); font-weight: 600; }
    .proof__k { color: var(--color-text-secondary, #5F616A); }
    .proof__row--result .proof__k { color: var(--color-text-primary, #1F2129); }
    .proof__v { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-weight: 600; }
    .proof__v--bad { color: var(--color-error-600, #E54430); }

    /* ── Code ── */
    .code {
      margin: var(--space-4, 16px) 0 0;
      padding: var(--space-4, 16px);
      border-radius: var(--radius-md, 8px);
      background: var(--primitive-dark-stone-0, #1f2129);
      color: var(--primitive-dark-stone-900, #b5bbbf);
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 12.5px;
      line-height: 1.65;
      overflow-x: auto;
    }
    .code code { background: none; padding: 0; font-size: inherit; color: inherit; }

    /* ── Safe palette grid ── */
    .safe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: var(--space-3, 12px);
    }
    .safe {
      display: flex; flex-direction: column; gap: var(--space-1, 4px);
      padding: var(--space-3, 12px);
      border: 1px solid var(--color-divider, #DEE0EB);
      border-radius: var(--radius-md, 8px);
    }
    .safe__pair { display: flex; border-radius: var(--radius-sm, 4px); overflow: hidden; }
    .safe__half {
      flex: 1;
      padding: var(--space-3, 12px);
      text-align: center;
      font-size: var(--font-size-md, 15px); font-weight: 600;
    }
    .safe__half--light { background: var(--primitive-neutral-0, #ffffff); box-shadow: inset 0 0 0 1px var(--color-divider, #DEE0EB); }
    .safe__half--dark  { background: var(--primitive-dark-stone-0, #1f2129); }
    .safe__name { margin-top: var(--space-1, 4px); font-size: var(--font-size-base, 14px); font-weight: 600; }
    .safe__hex, .safe__num {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary, #5F616A);
    }

    @media (max-width: 860px) {
      .head { flex-direction: column; }
      .split { grid-template-columns: 1fr; }
    }
  `],
})
export class EditorColorContrastComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private sanitizer = inject(DomSanitizer);

  readonly lightSurface = LIGHT_SURFACE;
  readonly darkSurface = DARK_SURFACE;
  readonly aaText = AA_TEXT;
  readonly aaLarge = AA_LARGE;
  readonly reportedHex = REPORTED_HEX;
  readonly tinymceVersion = '8.5.1';

  readonly reportedLight = round2(contrast(REPORTED_HEX, LIGHT_SURFACE));
  readonly reportedDark = round2(contrast(REPORTED_HEX, DARK_SURFACE));

  readonly rows: ColorRow[] = auditPalette(TINYMCE_DEFAULT_COLORS);

  /**
   * custom_colors defaults to true in TinyMCE, so the 22 presets are a floor,
   * not a ceiling — trimming color_map alone does not close the hole.
   */
  readonly customColorsNote =
    'These 22 swatches are only the presets. The picker also has a "Custom colour" ' +
    'field, and custom_colors defaults to true — so a user can enter any hex at all. ' +
    'Restricting color_map has to be paired with custom_colors: false, or the audit ' +
    'above only covers the shortcuts.';

  readonly rootCauseMessage =
    'The colour picker writes an absolute value into the saved content — ' +
    '<span style="color: ' + REPORTED_HEX + '">…</span>. That hex travels with the document, ' +
    'so it stays the same no matter which theme the reader has on. Nothing in the editor, ' +
    'the theme or the design tokens can correct it after the fact.';

  readonly codeSnippet = [
    '// tinymce init — store a semantic class instead of a raw hex',
    'formats: {',
    "  forecolor: { inline: 'span', classes: ['fvdr-fc-%value'] },",
    '},',
    "color_map: ['red', 'Red', 'green', 'Green', 'blue', 'Blue', /* … */],",
    '',
    '/* content CSS — each theme resolves the same class to its own value */',
    '.fvdr-fc-red   { color: #C0392B; }',
    '.theme-dark .fvdr-fc-red { color: #FF8A80; }',
  ].join('\n');

  /**
   * WCAG feasibility window for a single shared hex, expressed in relative
   * luminance Y. dualWindow(4.5) is null — the two bounds do not overlap.
   */
  readonly maxY = ((luminance(LIGHT_SURFACE) + 0.05) / AA_TEXT - 0.05).toFixed(3);
  readonly minY = (AA_TEXT * (luminance(DARK_SURFACE) + 0.05) - 0.05).toFixed(3);
  readonly aaWindowEmpty = dualWindow(AA_TEXT) === null;
  readonly ceiling = bestDualContrast();

  readonly pairs = THEME_AWARE_PAIRS.map(p => ({
    ...p,
    lightRatio: round2(contrast(p.onLight, LIGHT_SURFACE)),
    darkRatio: round2(contrast(p.onDark, DARK_SURFACE)),
  }));

  readonly safePalette = DUAL_SAFE_PALETTE.map(([hex, name]) => ({
    hex, name,
    light: round2(contrast(hex, LIGHT_SURFACE)),
    dark: round2(contrast(hex, DARK_SURFACE)),
  }));

  // ── Controls ──────────────────────────────────────────────────
  authorTheme: ThemeId = 'dark';
  filter: FilterId = 'all';

  readonly themeItems: SegmentItem[] = [
    { id: 'light', label: 'Light theme' },
    { id: 'dark', label: 'Dark theme' },
  ];

  get filterItems(): SegmentItem[] {
    return [
      { id: 'all', label: 'All', count: this.rows.length },
      { id: 'light-only', label: 'Breaks on dark', count: this.countOf('light-only') },
      { id: 'dark-only', label: 'Breaks on light', count: this.countOf('dark-only') },
      { id: 'neither', label: 'Fails both', count: this.countOf('neither') },
      { id: 'both', label: 'Safe on both', count: this.countOf('both') },
    ];
  }

  get visibleRows(): ColorRow[] {
    return this.filter === 'all' ? this.rows : this.rows.filter(r => r.verdict === this.filter);
  }

  get countBoth(): number { return this.countOf('both'); }

  private countOf(v: Verdict): number {
    return this.rows.filter(r => r.verdict === v).length;
  }

  // ── Live editor ───────────────────────────────────────────────
  /**
   * Self-hosted from node_modules/tinymce (copied to /tinymce by angular.json
   * assets). The cloud build needs an API key it cannot validate here, and falls
   * back to a read-only "add your API key" panel — useless for a colour test.
   */

  html =
    '<p>Quarterly results are <span style="color: ' + REPORTED_HEX + '">' +
    'below the agreed threshold</span> and need review before Friday.</p>' +
    '<p>Pick any colour from the toolbar and watch both panes.</p>';

  safeHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.html);

  readonly lightInit = this.buildInit('light');
  readonly darkInit = this.buildInit('dark');

  private buildInit(theme: ThemeId): Record<string, unknown> {
    const bg = theme === 'dark' ? DARK_SURFACE : LIGHT_SURFACE;
    const fg = theme === 'dark' ? '#FFFFFF' : '#1F2129';
    return {
      height: 240,
      menubar: false,
      statusbar: false,
      branding: false,
      resize: false,
      license_key: 'gpl',
      plugins: 'lists link',
      toolbar: 'bold italic underline | forecolor backcolor | bullist numlist | removeformat',
      skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
      content_css: theme === 'dark' ? 'dark' : 'default',
      content_style:
        'body { font-family: Inter, sans-serif; font-size: 14px; line-height: 1.6; margin: 12px; ' +
        'background: ' + bg + '; color: ' + fg + '; } p { margin: 0 0 8px; }',
      convert_urls: false,
    };
  }

  onHtmlChange(html: string): void {
    this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }

  // ── Presentation helpers ──────────────────────────────────────
  level(pass: boolean, large: boolean): string {
    return pass ? 'AA' : large ? 'AA large' : 'fail';
  }

  verdictLabel(v: Verdict): string { return VERDICT_LABEL[v]; }
  verdictVariant(v: Verdict): 'success' | 'warning' | 'error' { return VERDICT_VARIANT[v]; }

  ngOnInit(): void {
    this.tracker.trackPageView(SLUG);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }
}
