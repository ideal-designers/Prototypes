import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrActionBarComponent } from '../vdr-action-bar.component';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Documents › Notes — replica of `.design/real-product-spec.md` section 4.1.
 *
 * No action buttons at all, only the right-aligned search, then a buttonless
 * empty state. The illustration is decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-notes',
  standalone: true,
  imports: [CommonModule, VdrActionBarComponent, VdrEmptyStateComponent],
  template: `
<div class="page page--flush">

  <div class="page-bar">
    <fvdr-vdr-action-bar [overflow]="false" searchPlaceholder="Search in notes"></fvdr-vdr-action-bar>
  </div>

  <fvdr-vdr-empty-state
    title="You have no notes"
    [subtitle]="['All notes to files and folders will appear here']"
  >
    <!-- Clipboard with a pencil -->
    <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <rect x="34" y="16" width="76" height="92" rx="8" class="art__shape" />
      <rect x="58" y="8" width="28" height="14" rx="5" class="art__shape2" />
      <rect x="48" y="40" width="48" height="5" rx="2.5" class="art__on-accent" />
      <rect x="48" y="54" width="38" height="5" rx="2.5" class="art__on-accent" />
      <rect x="48" y="68" width="30" height="5" rx="2.5" class="art__on-accent" />
      <path d="M96 84L112 68L122 78L106 94L94 96L96 84Z" class="art__accent" />
      <path d="M112 68L122 78" class="art__line" stroke-width="2" />
    </svg>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`:host { display: block; }`],
})
export class VdrNotesComponent {}
