import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Permissions › Documents — replica of `.design/real-product-spec.md` section 2.6.
 * Single empty state; the people-and-card artwork is decorative inline SVG.
 */
@Component({
  selector: 'fvdr-vdr-permissions',
  standalone: true,
  imports: [CommonModule, VdrEmptyStateComponent],
  template: `
<div class="page">
  <fvdr-vdr-empty-state
    title="You have no groups to assign permissions yet"
    [subtitle]="[
      'Create at least one non-administrator group',
      'to manage their document permissions'
    ]"
    buttonLabel="Create group"
    buttonIcon="plus"
  >
    <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <rect x="20" y="40" width="110" height="64" rx="8" class="art__shape" />
      <rect x="20" y="52" width="110" height="10" class="art__shape2" />
      <rect x="32" y="76" width="40" height="5" rx="2.5" class="art__on-accent" />
      <rect x="32" y="88" width="26" height="5" rx="2.5" class="art__on-accent" />
      <circle cx="48" cy="24" r="12" class="art__shape2" />
      <path d="M30 40C30 30 38 24 48 24C58 24 66 30 66 40H30Z" class="art__shape2" />
      <circle cx="78" cy="28" r="9" class="art__shape" />
      <path d="M64 40C64 33 70 28 78 28C86 28 92 33 92 40H64Z" class="art__shape" />
      <circle cx="108" cy="86" r="16" class="art__accent" />
      <path d="M108 78V94M100 86H116" class="art__plus" stroke-width="2.6" stroke-linecap="round" fill="none" />
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
export class VdrPermissionsComponent {}
