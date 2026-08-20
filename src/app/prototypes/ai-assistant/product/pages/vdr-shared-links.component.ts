import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { VdrActionBarComponent } from '../vdr-action-bar.component';

/**
 * Documents › External links — replica of `.design/real-product-spec.md`
 * section 4.2. Labelled "External links" in the product even though the route
 * says shared-links.
 *
 * The un-entitled state: the table header renders greyed out with no rows, then
 * a three-column feature pitch (no step numbers, unlike Signatures) and the
 * Premier entitlement note. Illustrations are decorative inline SVG.
 */
@Component({
  selector: 'fvdr-vdr-shared-links',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrActionBarComponent],
  template: `
<div class="page page--flush">

  <div class="page-bar">
    <fvdr-vdr-action-bar [overflow]="false" searchPlaceholder="Search in external links"></fvdr-vdr-action-bar>
  </div>

  <div class="links">

    <!-- ── Header only: the feature is not entitled, so there are no rows ── -->
    <table class="dtable dtable--disabled">
      <thead>
        <tr>
          <th class="dtable__th" *ngFor="let c of columns" [style.width]="c.width">{{ c.label }}</th>
          <th class="dtable__th dtable__th--tools">
            <span class="icon-btn" title="Customize columns"><fvdr-icon name="table-view"></fvdr-icon></span>
          </th>
        </tr>
      </thead>
    </table>

    <!-- ── Feature pitch ─────────────────────────────────────────────── -->
    <div class="pitch">

      <div class="pitch__item">
        <svg class="art" width="140" height="100" viewBox="0 0 140 100" aria-hidden="true">
          <rect x="30" y="24" width="80" height="60" rx="8" class="art__shape" />
          <rect x="44" y="40" width="52" height="5" rx="2.5" class="art__on-accent" />
          <rect x="44" y="52" width="38" height="5" rx="2.5" class="art__on-accent" />
          <circle cx="106" cy="30" r="14" class="art__accent" />
          <path d="M101 30V27a5 5 0 0110 0v3" class="art__on-accent-line" stroke-width="2" fill="none" />
          <rect x="100" y="30" width="12" height="9" rx="2" class="art__on-accent" />
        </svg>
        <span class="pitch__title">Share securely</span>
        <p class="pitch__text">
          Send documents outside the room with an expiring link.
          Set a password, an expiry date and a download limit.
        </p>
      </div>

      <div class="pitch__item">
        <svg class="art" width="140" height="100" viewBox="0 0 140 100" aria-hidden="true">
          <rect x="26" y="20" width="88" height="64" rx="8" class="art__shape" />
          <rect x="40" y="56" width="12" height="16" rx="3" class="art__shape2" />
          <rect x="58" y="46" width="12" height="26" rx="3" class="art__shape2" />
          <rect x="76" y="34" width="12" height="38" rx="3" class="art__accent" />
          <rect x="94" y="50" width="12" height="22" rx="3" class="art__shape2" />
        </svg>
        <span class="pitch__title">Track engagement</span>
        <p class="pitch__text">
          See every visit, who opened the link and what they looked at.
          Get notified on the first open.
        </p>
      </div>

      <div class="pitch__item">
        <svg class="art" width="140" height="100" viewBox="0 0 140 100" aria-hidden="true">
          <rect x="26" y="22" width="88" height="18" rx="5" class="art__shape2" />
          <rect x="26" y="46" width="88" height="18" rx="5" class="art__shape" />
          <rect x="26" y="70" width="88" height="18" rx="5" class="art__shape" />
          <circle cx="102" cy="31" r="6" class="art__accent" />
        </svg>
        <span class="pitch__title">Manage shared links</span>
        <p class="pitch__text">
          Keep every link in one list. Revoke access at any time
          and review the feedback recipients left.
        </p>
      </div>
    </div>

    <!-- ── Entitlement ───────────────────────────────────────────────── -->
    <div class="panel gate">
      <span class="gate__glyph"><fvdr-icon name="finished"></fvdr-icon></span>
      <p class="gate__text">
        This feature is available only with a <strong>Premier</strong> or higher subscription.
        <button type="button" class="link gate__link">Learn more</button>
      </p>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .links { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-5) var(--space-6) var(--space-8); }

    .pitch { display: flex; align-items: flex-start; justify-content: center; gap: var(--space-8); }
    .pitch__item { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); width: 280px; }
    .pitch__title { font-size: var(--font-size-md, 15px); font-weight: 600; color: var(--color-text-primary); }
    .pitch__text {
      margin: 0;
      text-align: center;
      font-size: var(--font-size-sm, 13px);
      line-height: 20px;
      color: var(--color-text-secondary);
    }

    .gate { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-4); }
    .gate__glyph { display: inline-flex; color: var(--color-primary-500); font-size: var(--font-size-lg, 16px); }
    .gate__text {
      margin: 0;
      font-size: var(--font-size-base, 14px);
      line-height: 20px;
      color: var(--color-text-secondary);
    }
    .gate__link { vertical-align: baseline; }

    .art__on-accent-line { stroke: var(--color-text-inverse, #ffffff); }
  `],
})
export class VdrSharedLinksComponent {
  readonly columns = [
    { label: 'Index', width: '80px' },
    { label: 'Name', width: '' },
    { label: 'Access type', width: '140px' },
    { label: 'Notifications', width: '130px' },
    { label: 'Visits', width: '90px' },
    { label: 'Feedback', width: '110px' },
    { label: 'Created on', width: '130px' },
    { label: 'Status', width: '110px' },
  ];
}
