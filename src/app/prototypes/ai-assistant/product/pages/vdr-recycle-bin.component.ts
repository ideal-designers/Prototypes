import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Recycle bin — replica of `.design/real-product-spec.md` section 2.13.
 * A single empty state; the illustration is decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-recycle-bin',
  standalone: true,
  imports: [CommonModule, VdrEmptyStateComponent],
  template: `
<div class="page">
  <fvdr-vdr-empty-state
    title="Recycle bin is empty"
    [subtitle]="['All deleted files and folders will appear here']"
  >
    <!-- Flat trash-can artwork (decorative, not an icon) -->
    <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <ellipse cx="75" cy="104" rx="46" ry="8" class="art__bg" />
      <rect x="42" y="34" width="66" height="12" rx="3" class="art__shape2" />
      <rect x="64" y="24" width="22" height="8" rx="3" class="art__shape2" />
      <path d="M48 48H102L96 100C95.6 103.4 92.8 106 89.4 106H60.6C57.2 106 54.4 103.4 54 100L48 48Z" class="art__shape" />
      <rect x="62" y="58" width="5" height="36" rx="2.5" class="art__on-accent" />
      <rect x="83" y="58" width="5" height="36" rx="2.5" class="art__on-accent" />
      <circle cx="110" cy="30" r="14" class="art__accent" />
      <rect x="103" y="28" width="14" height="4" rx="2" class="art__on-accent" />
    </svg>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`:host { display: block; }`],
})
export class VdrRecycleBinComponent {}
