import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, DropdownOption, TreeNode } from '../../../../shared/ds';
import { PROJECT_NODE_ID, projectTree } from '../data/project-tree';
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
    <fvdr-filter-btn size="S" icon="calendar" label="Aug 14, 2026 – Aug 20, 2026" [clearable]="true"></fvdr-filter-btn>

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

    <fvdr-card title="Documents" class="perm__docs">
      <div class="perm__docs-body">
        <fvdr-search placeholder="Search" size="s"></fvdr-search>
        <div class="perm__tree">
          <fvdr-tree [nodes]="tree" [selectedId]="selectedNode"></fvdr-tree>
        </div>
      </div>
    </fvdr-card>

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
    .perm__docs { flex: 0 0 340px; }
    .perm__main { flex: 1; min-width: 0; }

    .perm__docs-body { display: flex; flex-direction: column; gap: var(--space-3); }
    /* The tree rows run to the card's edges, as the product's pane does. */
    .perm__tree { margin: 0 calc(var(--space-4) * -1); }
  `],
})
export class VdrPermissionsLogComponent {
  /** Project tree — the same room the assistant answers from. */
  readonly tree: TreeNode[] = projectTree();
  readonly selectedNode = PROJECT_NODE_ID;

  readonly groupOptions: DropdownOption[] = [
    { value: 'admins', label: 'Administrators' },
  ];

  readonly authorOptions: DropdownOption[] = [
    { value: 'ds', label: 'Dmytro Siniehin' },
  ];
}
