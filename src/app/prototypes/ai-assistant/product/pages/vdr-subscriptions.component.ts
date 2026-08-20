import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Reports › Subscriptions — replica of `.design/real-product-spec.md` section
 * 4.9: no filter row, a single empty state pointing back at the Activity log.
 * The illustration is decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-subscriptions',
  standalone: true,
  imports: [CommonModule, VdrEmptyStateComponent],
  template: `
<div class="page">
  <fvdr-vdr-empty-state
    title="You have no subscriptions yet"
    [subtitle]="['To add subscriptions, create new report in Activity log']"
    buttonLabel="Go to activity log"
  >
    <!-- Open envelope with a bell badge -->
    <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <path d="M26 46L75 18L124 46V98H26V46Z" class="art__shape" />
      <rect x="44" y="30" width="62" height="46" rx="5" class="art__on-accent" />
      <rect x="56" y="42" width="38" height="5" rx="2.5" class="art__shape2" />
      <rect x="56" y="54" width="28" height="5" rx="2.5" class="art__shape2" />
      <path d="M26 46L75 82L124 46V98H26V46Z" class="art__shape2" />
      <circle cx="118" cy="34" r="17" class="art__accent" />
      <path d="M118 24C114.7 24 112 26.7 112 30V36L110 39H126L124 36V30C124 26.7 121.3 24 118 24Z" class="art__on-accent" />
      <rect x="115" y="40" width="6" height="3" rx="1.5" class="art__on-accent" />
    </svg>
  </fvdr-vdr-empty-state>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`:host { display: block; }`],
})
export class VdrSubscriptionsComponent {}
