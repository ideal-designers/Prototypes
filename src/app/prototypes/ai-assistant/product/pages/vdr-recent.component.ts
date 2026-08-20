import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrPageId } from '../data/product-nav';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/**
 * Documents › Recently viewed — replica of `.design/real-product-spec.md`
 * section 4.3: the Documents action bar without Add/Download, the shared Quick
 * access pane with "Recently viewed" selected, and an empty state beside it.
 * The illustration is decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-recent',
  standalone: true,
  imports: [CommonModule, VdrActionBarComponent, VdrEmptyStateComponent, VdrQuickAccessComponent],
  template: `
<div class="page page--flush docs">

  <div class="page-bar">
    <fvdr-vdr-action-bar
      [secondaries]="secondaries"
      searchPlaceholder="Search in documents"
    ></fvdr-vdr-action-bar>
  </div>

  <div class="two-pane">
    <aside class="two-pane__side">
      <fvdr-vdr-quick-access selected="recent" (navigate)="navigate.emit($event)"></fvdr-vdr-quick-access>
    </aside>

    <section class="two-pane__main">
      <fvdr-vdr-empty-state
        title="You have no recent documents yet"
        [subtitle]="['Viewed and downloaded documents will appear here']"
      >
        <!-- Stacked documents with a clock badge -->
        <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
          <rect x="26" y="22" width="66" height="80" rx="6" class="art__shape2" />
          <rect x="40" y="14" width="66" height="80" rx="6" class="art__shape" />
          <rect x="52" y="32" width="42" height="5" rx="2.5" class="art__on-accent" />
          <rect x="52" y="46" width="34" height="5" rx="2.5" class="art__on-accent" />
          <rect x="52" y="60" width="26" height="5" rx="2.5" class="art__on-accent" />
          <circle cx="112" cy="88" r="18" class="art__accent" />
          <path d="M112 79V88L118 92" class="art__on-accent-line" stroke-width="2.4" fill="none" stroke-linecap="round" />
        </svg>
      </fvdr-vdr-empty-state>
    </section>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; height: 100%; }

    .docs { height: 100%; }
    .two-pane { min-height: 0; }
    .two-pane__main { overflow: auto; justify-content: center; }

    .art__on-accent-line { stroke: var(--color-text-inverse, #ffffff); }
  `],
})
export class VdrRecentComponent {
  /**
   * Quick access shortcut clicked — Documents › Recently viewed / Newly uploaded
   * / Favorites live in that pane, not in the sidebar, so the page bubbles the
   * request up instead of navigating itself.
   */
  @Output() navigate = new EventEmitter<VdrPageId>();
  readonly secondaries: VdrActionBarButton[] = [{ id: 'index', label: 'Project index' }];
}
