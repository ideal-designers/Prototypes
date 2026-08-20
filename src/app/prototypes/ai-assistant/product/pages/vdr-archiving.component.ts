import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';

/**
 * Project archiving — replica of `.design/real-product-spec.md` section 2.12:
 * three stacked cards (Online archive, Offline backup, Project closure), each
 * with copy on the left and an illustration on the right, and the two
 * expandable archive rows. Illustrations are decorative inline SVG. Inert.
 */
@Component({
  selector: 'fvdr-vdr-archiving',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="page">

  <!-- ── Online archive ──────────────────────────────────────────────── -->
  <fvdr-card class="card">
    <div class="card__row">
      <div class="card__text">
        <h2 class="section-title">Online archive</h2>
        <p class="card__desc">
          Keep a read-only copy of this project available online after the deal closes.
          Your trial includes the online archive for 30 days.
        </p>
        <button type="button" class="link">
          Learn more
          <fvdr-icon name="link"></fvdr-icon>
        </button>
      </div>
      <svg class="art card__art" width="180" height="120" viewBox="0 0 180 120" aria-hidden="true">
        <rect x="24" y="26" width="132" height="26" rx="6" class="art__shape2" />
        <rect x="24" y="60" width="132" height="26" rx="6" class="art__shape" />
        <rect x="24" y="94" width="132" height="18" rx="6" class="art__shape" />
        <circle cx="140" cy="39" r="6" class="art__accent" />
      </svg>
    </div>
  </fvdr-card>

  <!-- ── Offline backup ──────────────────────────────────────────────── -->
  <fvdr-card class="card">
    <div class="card__row">
      <div class="card__text">
        <h2 class="section-title">Offline backup</h2>
        <p class="card__desc">
          Download the full project, including the index, permissions report and
          activity log, or order it on an encrypted USB drive.
        </p>
  
        <!--
          Expandable rows. Hand-rolled: the DS has no expandable list-row /
          accordion component, and fvdr-card cannot collapse.
        -->
        <div class="rows">
          <button type="button" class="exp-row">
            <span class="exp-row__label">Downloadable archive</span>
            <fvdr-badge label="Free" variant="success"></fvdr-badge>
            <span class="spacer"></span>
            <fvdr-icon name="chevron-down"></fvdr-icon>
          </button>
          <button type="button" class="exp-row">
            <span class="exp-row__label">USB archive</span>
            <span class="spacer"></span>
            <fvdr-icon name="chevron-down"></fvdr-icon>
          </button>
        </div>
      </div>
      <svg class="art card__art" width="180" height="120" viewBox="0 0 180 120" aria-hidden="true">
        <rect x="30" y="20" width="90" height="66" rx="6" class="art__shape" />
        <rect x="44" y="34" width="62" height="5" rx="2.5" class="art__on-accent" />
        <rect x="44" y="46" width="46" height="5" rx="2.5" class="art__on-accent" />
        <rect x="98" y="76" width="52" height="22" rx="5" class="art__shape2" />
        <rect x="140" y="82" width="18" height="10" rx="2" class="art__accent" />
        <path d="M75 96V112M67 104L75 112L83 104" class="art__arrow" stroke-width="3" stroke-linecap="round" fill="none" />
      </svg>
    </div>
  </fvdr-card>

  <!-- ── Project closure ─────────────────────────────────────────────── -->
  <fvdr-card class="card">
    <div class="card__row">
      <div class="card__text">
        <h2 class="section-title">Closure</h2>
        <p class="card__desc">
          Closing the project revokes access for every participant. The project
          stays visible to administrators.
        </p>
        <div class="rows">
          <fvdr-btn size="s" variant="secondary" label="Close project" iconName="lock-close"></fvdr-btn>
        </div>
      </div>
      <svg class="art card__art" width="180" height="120" viewBox="0 0 180 120" aria-hidden="true">
        <rect x="34" y="24" width="112" height="72" rx="8" class="art__shape" />
        <rect x="76" y="54" width="28" height="24" rx="4" class="art__accent" />
        <path d="M82 54V48C82 43 86 39 90 39C94 39 98 43 98 48V54" class="art__accent-line" stroke-width="3" fill="none" />
      </svg>
    </div>
  </fvdr-card>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    /* fvdr-card stacks its body; these cards put the copy beside the
       illustration, so the row lives on the projected content. */
    .card__row { display: flex; align-items: center; gap: var(--space-6); }
    .card__text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; }
    .card__desc {
      margin: 0;
      max-width: 560px;
      font-size: var(--font-size-base, 14px);
      line-height: 20px;
      color: var(--color-text-secondary);
    }
    .card__art { flex: none; }

    .rows { display: flex; flex-direction: column; gap: var(--space-2); width: 100%; margin-top: var(--space-2); }

    .exp-row {
      display: flex; align-items: center; gap: var(--space-2);
      width: 100%; max-width: 560px;
      box-sizing: border-box;
      height: 44px;
      padding: 0 var(--space-4);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm);
      background: transparent;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .exp-row:hover { background: var(--color-hover-bg); }
    .exp-row__label { font-weight: 600; }

    .art__arrow { stroke: var(--color-primary-500); }
  `],
})
export class VdrArchivingComponent {}
