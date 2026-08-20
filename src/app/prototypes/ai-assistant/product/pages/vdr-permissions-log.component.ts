import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, DropdownOption } from '../../../../shared/ds';
import { VdrEmptyStateComponent } from '../vdr-empty-state.component';

/**
 * Reports › Permissions log — replica of `.design/real-product-spec.md`
 * section 4.8. Labelled "Permissions log" in the product.
 *
 * Period + target group + author filters with Export/Subscribe, the Documents
 * tree pane, and the "No matching results" empty state beside it. The
 * illustration is decorative inline SVG artwork.
 */
@Component({
  selector: 'fvdr-vdr-permissions-log',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrEmptyStateComponent],
  template: `
<div class="page">

  <!-- ── Filters ─────────────────────────────────────────────────────── -->
  <div class="row row--wrap">
    <span class="label">Period</span>
    <span class="field">
      <span>Aug 14, 2026 – Aug 20, 2026</span>
      <button type="button" class="field__icon-btn" title="Clear"><fvdr-icon name="close"></fvdr-icon></button>
      <span class="field__icon"><fvdr-icon name="calendar"></fvdr-icon></span>
    </span>

    <div class="filter-select">
      <fvdr-dropdown [options]="groupOptions" placeholder="Target group" size="s"></fvdr-dropdown>
    </div>
    <div class="filter-select">
      <fvdr-dropdown [options]="authorOptions" placeholder="Author" size="s"></fvdr-dropdown>
    </div>

    <span class="spacer"></span>

    <fvdr-btn size="s" variant="secondary" label="Export" iconName="download"></fvdr-btn>
    <fvdr-btn size="s" variant="secondary" label="Subscribe" iconName="bell"></fvdr-btn>
  </div>

  <!-- ── Documents pane + results ────────────────────────────────────── -->
  <div class="perm">

    <div class="panel perm__docs">
      <div class="panel__head"><span class="panel__title">Documents</span></div>
      <div class="panel__body perm__docs-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="perm__tree">
          <button type="button" class="qa-row qa-row--selected">
            <fvdr-icon name="chevron-down" class="qa-row__icon"></fvdr-icon>
            <span class="proj-mark">T2</span>
            <span>test 2</span>
          </button>
          <button type="button" class="qa-row qa-row--child">
            <fvdr-icon name="chevron-right" class="qa-row__icon"></fvdr-icon>
            <span class="qa-row__icon"><fvdr-icon name="folder"></fvdr-icon></span>
            <span>1 Get to know VDR</span>
          </button>
        </div>
      </div>
    </div>

    <div class="perm__main">
      <fvdr-vdr-empty-state
        title="No matching results"
        [subtitle]="['Try adjusting the filters or using another search query']"
      >
        <!-- Folder with a magnifier -->
        <svg class="art" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
          <path d="M22 24H58L66 36H120V96H22V24Z" class="art__shape" />
          <rect x="22" y="44" width="98" height="52" rx="6" class="art__shape2" />
          <circle cx="104" cy="42" r="18" fill="none" class="art__accent-line" stroke-width="4" />
          <path d="M117 55L130 68" class="art__accent-line" stroke-width="5" stroke-linecap="round" />
        </svg>
      </fvdr-vdr-empty-state>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }

    .filter-select { width: 180px; }

    .perm { display: flex; gap: var(--space-4); align-items: flex-start; }
    .perm__docs { flex: 0 0 325px; }
    .perm__main { flex: 1; min-width: 0; }

    .perm__docs-body { display: flex; flex-direction: column; gap: var(--space-3); }
    .perm__tree { margin: 0 calc(var(--space-4) * -1); }
  `],
})
export class VdrPermissionsLogComponent {
  readonly groupOptions: DropdownOption[] = [
    { value: 'admins', label: 'Administrators' },
  ];

  readonly authorOptions: DropdownOption[] = [
    { value: 'ds', label: 'Dmytro Siniehin' },
  ];
}
