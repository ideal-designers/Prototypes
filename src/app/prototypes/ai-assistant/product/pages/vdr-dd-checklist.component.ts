import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Due diligence checklist — replica of `.design/real-product-spec.md` section 2.4.
 * Single empty state; the checklist artwork is decorative inline SVG.
 */
@Component({
  selector: 'fvdr-vdr-dd-checklist',
  standalone: true,
  imports: [CommonModule, VdrEmptyStateComponent],
  template: `
<div class="page">
  <fvdr-vdr-empty-state
    title="No due diligence checklist uploaded yet"
    [subtitle]="[
      'To share the due diligence checklist with your team',
      'and track your deal progress, upload your file here'
    ]"
    buttonLabel="Choose file"
    buttonIcon="plus"
  >
    <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <rect x="34" y="10" width="82" height="100" rx="6" class="art__shape" />
      <rect x="58" y="4" width="34" height="12" rx="4" class="art__shape2" />
      <rect x="46" y="30" width="10" height="10" rx="2" class="art__shape2" />
      <rect x="62" y="33" width="42" height="4" rx="2" class="art__on-accent" />
      <rect x="46" y="50" width="10" height="10" rx="2" class="art__shape2" />
      <rect x="62" y="53" width="34" height="4" rx="2" class="art__on-accent" />
      <rect x="46" y="70" width="10" height="10" rx="2" class="art__shape2" />
      <rect x="62" y="73" width="38" height="4" rx="2" class="art__on-accent" />
      <circle cx="112" cy="92" r="16" class="art__accent" />
      <path d="M112 84V100M104 92H120" class="art__plus" stroke-width="2.6" stroke-linecap="round" fill="none" />
    </svg>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }
    .art__plus { stroke: var(--color-text-inverse, #ffffff); }
  `],
})
export class VdrDdChecklistComponent {}
