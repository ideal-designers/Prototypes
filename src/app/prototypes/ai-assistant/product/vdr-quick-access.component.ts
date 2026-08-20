import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName } from '../../../shared/ds';

/** Row of the Quick access pane that renders as selected (tinted). */
export type VdrQuickAccessRow = 'project' | 'recent' | 'uploads' | 'favorites';

/**
 * Quick access pane of the Documents pages (`.design/real-product-spec.md`
 * sections 2.2 and 4.3–4.5).
 *
 * The live product shows the same 325px pane on Documents › All, Recently
 * viewed, Newly uploaded and Favorites, with a different row tinted, so it is
 * one component with a [selected] input instead of four copies.
 *
 *   <fvdr-vdr-quick-access selected="uploads"></fvdr-vdr-quick-access>
 *
 * Every control is inert — this is a visual replica.
 */
@Component({
  selector: 'fvdr-vdr-quick-access',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="qa-panel__head">
  <span class="qa-panel__title">Quick access</span>
  <button type="button" class="icon-btn" title="Close"><fvdr-icon name="close"></fvdr-icon></button>
  <button type="button" class="icon-btn" title="Collapse"><fvdr-icon name="angle-double-left"></fvdr-icon></button>
</div>

<button
  type="button"
  class="qa-row"
  *ngFor="let s of shortcuts"
  [class.qa-row--selected]="s.id === selected"
>
  <span class="qa-row__icon"><fvdr-icon [name]="s.icon"></fvdr-icon></span>
  <span>{{ s.label }}</span>
</button>

<hr class="divider" />

<!-- Project tree: project row + one child folder -->
<button type="button" class="qa-row" [class.qa-row--selected]="selected === 'project'">
  <fvdr-icon name="chevron-down" class="qa-row__icon"></fvdr-icon>
  <span class="proj-mark">{{ projectMark }}</span>
  <span>{{ projectName }}</span>
</button>
<button type="button" class="qa-row qa-row--child">
  <fvdr-icon name="chevron-right" class="qa-row__icon"></fvdr-icon>
  <span class="qa-row__icon"><fvdr-icon name="folder"></fvdr-icon></span>
  <span>{{ folderName }}</span>
</button>
  `,
  styleUrls: ['./pages/vdr-page.css'],
  styles: [`
    :host { display: block; }
  `],
})
export class VdrQuickAccessComponent {
  @Input() selected: VdrQuickAccessRow = 'project';
  @Input() projectName = 'test 2';
  @Input() projectMark = 'T2';
  @Input() folderName = '1 Get to know VDR';

  readonly shortcuts: { id: VdrQuickAccessRow; icon: FvdrIconName; label: string }[] = [
    { id: 'recent', icon: 'history', label: 'Recently viewed' },
    { id: 'uploads', icon: 'upload', label: 'Newly uploaded' },
    { id: 'favorites', icon: 'star', label: 'Favorites' },
  ];
}
