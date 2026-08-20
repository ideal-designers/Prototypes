import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';
import { VdrQuickAccessComponent } from '../vdr-quick-access.component';

/**
 * Documents › Favorites — replica of `.design/real-product-spec.md` section 4.5:
 * same shell as Recently viewed, Quick access with "Favorites" selected, and the
 * folder-with-star empty state. The illustration is decorative inline SVG.
 */
@Component({
  selector: 'fvdr-vdr-favorites',
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
      <fvdr-vdr-quick-access selected="favorites"></fvdr-vdr-quick-access>
    </aside>

    <section class="two-pane__main">
      <fvdr-vdr-empty-state
        title="You have no favorites yet"
        [subtitle]="['All starred files and folders will appear here']"
      >
        <!-- Folder with a star badge -->
        <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
          <path d="M26 26H62L70 38H124V98H26V26Z" class="art__shape" />
          <rect x="26" y="46" width="98" height="52" rx="6" class="art__shape2" />
          <path d="M110 28L115.6 39.4L128 41.2L119 50L121.2 62.4L110 56.6L98.8 62.4L101 50L92 41.2L104.4 39.4L110 28Z" class="art__accent" />
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
  `],
})
export class VdrFavoritesComponent {
  readonly secondaries: VdrActionBarButton[] = [{ id: 'index', label: 'Project index' }];
}
