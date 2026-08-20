import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, QuickAccessItem, TreeNode } from '../../../shared/ds';
import { PROJECT_NODE_ID, projectTree } from './data/project-tree';
import { VdrPageId } from './data/product-nav';

/** Row of the Quick access pane that renders as selected (tinted). */
export type VdrQuickAccessRow = 'project' | 'recent' | 'uploads' | 'favorites';

/**
 * Quick access pane of the Documents pages (`.design/real-product-spec.md`
 * sections 2.2 and 4.3–4.5).
 *
 * `fvdr-quick-access-menu` at its DS width (340px) with the project tree
 * (`fvdr-tree`) projected underneath it — the live product shows the same pane
 * on Documents › All, Recently viewed, Newly uploaded and Favorites with a
 * different row tinted, so it is one component with a [selected] input instead
 * of four copies.
 *
 *   <fvdr-vdr-quick-access selected="uploads"
 *     (navigate)="page.set($event)"></fvdr-vdr-quick-access>
 *
 * Inert except navigation: the three shortcut rows are how the live product
 * reaches Documents › Recently viewed / Newly uploaded / Favorites (they are not
 * in the sidebar's Documents group), so they emit the page. The tree is the DS
 * component's own expand/select behaviour and changes nothing else.
 */
@Component({
  selector: 'fvdr-vdr-quick-access',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<fvdr-quick-access-menu
  [items]="shortcuts"
  [showClose]="true"
  [width]="width"
  (itemClick)="onShortcut($event)"
>
  <fvdr-tree [nodes]="tree" [selectedId]="treeSelection"></fvdr-tree>
</fvdr-quick-access-menu>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class VdrQuickAccessComponent {
  @Input() set selected(value: VdrQuickAccessRow) {
    this.shortcuts.forEach(s => (s.active = s.id === value));
    this.treeSelection = value === 'project' ? PROJECT_NODE_ID : '';
  }

  /** DS spec width of the panel. */
  @Input() width = 340;

  /** Shortcut row clicked — its id is the page id. */
  @Output() navigate = new EventEmitter<VdrPageId>();

  /** Fresh per instance — both the menu and the tree write state back. */
  readonly shortcuts: QuickAccessItem[] = [
    { id: 'recent', icon: 'history', label: 'Recently viewed' },
    { id: 'uploads', icon: 'upload', label: 'Newly uploaded' },
    { id: 'favorites', icon: 'star', label: 'Favorites' },
  ];

  readonly tree: TreeNode[] = projectTree();

  treeSelection = PROJECT_NODE_ID;

  /** Shortcut ids are page ids — Recently viewed / Newly uploaded / Favorites. */
  onShortcut(item: QuickAccessItem): void {
    this.navigate.emit(item.id as VdrPageId);
  }
}
