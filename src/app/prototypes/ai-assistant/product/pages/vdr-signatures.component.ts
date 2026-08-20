import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Documents › Signatures — replica of `.design/real-product-spec.md` section 2.3.
 *
 * The product's three-step empty state: numbered illustrations joined by dashed
 * arcs, with the call to action attached to step 1. Illustrations and the arcs
 * are decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-signatures',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrEmptyStateComponent],
  template: `
<div class="page">
  <fvdr-vdr-empty-state
    [wide]="true"
    title="You have sent no documents for signature yet"
    [subtitle]="['To send documents for signature, follow the below steps']"
  >
    <div empty-footer class="steps">

      <div class="steps__item">
        <svg class="art" width="120" height="88" viewBox="0 0 120 88" aria-hidden="true">
          <rect x="24" y="10" width="56" height="66" rx="4" class="art__shape" />
          <rect x="36" y="18" width="56" height="66" rx="4" class="art__shape2" />
          <rect x="46" y="30" width="36" height="4" rx="2" class="art__on-accent" />
          <rect x="46" y="42" width="30" height="4" rx="2" class="art__on-accent" />
          <rect x="46" y="54" width="24" height="4" rx="2" class="art__on-accent" />
          <circle cx="94" cy="22" r="12" class="art__accent" />
          <path d="M88 22L92.5 26.5L100 18" class="art__accent-arrow" stroke-width="2.4" fill="none" stroke-linecap="round" />
        </svg>
        <span class="steps__num">1</span>
        <span class="steps__label">Go to all documents</span>
        <fvdr-btn size="s" variant="secondary" label="Go to all documents"></fvdr-btn>
      </div>

      <svg class="steps__arc" width="80" height="40" viewBox="0 0 80 40" aria-hidden="true">
        <path d="M4 30C24 4 56 4 76 30" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5" fill="none" />
        <path d="M70 26L76 30L70 34" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>

      <div class="steps__item">
        <svg class="art" width="120" height="88" viewBox="0 0 120 88" aria-hidden="true">
          <rect x="20" y="16" width="80" height="58" rx="6" class="art__shape" />
          <circle cx="44" cy="38" r="9" class="art__shape2" />
          <path d="M32 58C32 51 37 47 44 47C51 47 56 51 56 58H32Z" class="art__shape2" />
          <rect x="64" y="34" width="26" height="4" rx="2" class="art__on-accent" />
          <rect x="64" y="46" width="20" height="4" rx="2" class="art__on-accent" />
          <circle cx="92" cy="66" r="12" class="art__accent" />
          <path d="M86 66L90.5 70.5L98 62" class="art__accent-arrow" stroke-width="2.4" fill="none" stroke-linecap="round" />
        </svg>
        <span class="steps__num">2</span>
        <span class="steps__label">Select signers</span>
      </div>

      <svg class="steps__arc" width="80" height="40" viewBox="0 0 80 40" aria-hidden="true">
        <path d="M4 30C24 4 56 4 76 30" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5" fill="none" />
        <path d="M70 26L76 30L70 34" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>

      <div class="steps__item">
        <svg class="art" width="120" height="88" viewBox="0 0 120 88" aria-hidden="true">
          <rect x="20" y="14" width="80" height="60" rx="6" class="art__shape" />
          <rect x="32" y="46" width="10" height="16" rx="2" class="art__shape2" />
          <rect x="48" y="36" width="10" height="26" rx="2" class="art__shape2" />
          <rect x="64" y="26" width="10" height="36" rx="2" class="art__accent" />
          <rect x="80" y="40" width="10" height="22" rx="2" class="art__shape2" />
        </svg>
        <span class="steps__num">3</span>
        <span class="steps__label">Monitor progress</span>
      </div>
    </div>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }
    .art__accent-arrow { stroke: var(--color-text-inverse, #ffffff); }
  `],
})
export class VdrSignaturesComponent {}
