import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, FvdrIconName } from '../../../shared/ds';

export interface VdrActionBarButton {
  id: string;
  label: string;
  icon?: FvdrIconName;
}

/**
 * Action bar shared by every list page of the live product
 * (`.design/real-product-spec.md` section 1, "Common building blocks"):
 * primary button with a leading icon, outline secondaries, `...` overflow, and
 * a right-aligned search with a leading magnifier and a trailing filter icon.
 *
 * Every control is inert — this is a visual replica.
 *
 *   <fvdr-vdr-action-bar
 *     [primary]="{ id: 'add', label: 'Add', icon: 'plus' }"
 *     [secondaries]="[{ id: 'download', label: 'Download' }]"
 *   ></fvdr-vdr-action-bar>
 *
 * Slots: default content sits after the buttons (left group), `[bar-end]` sits
 * right-aligned before the search field.
 */
@Component({
  selector: 'fvdr-vdr-action-bar',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
<div class="bar">
  <fvdr-btn
    *ngIf="primary"
    class="bar__primary"
    size="m"
    variant="primary"
    [label]="primary.label"
    [iconName]="primary.icon"
  ></fvdr-btn>

  <fvdr-btn
    *ngFor="let b of secondaries"
    size="m"
    variant="secondary"
    [label]="b.label"
    [iconName]="b.icon"
  ></fvdr-btn>

  <fvdr-btn
    *ngIf="overflow"
    size="m"
    variant="secondary"
    iconName="more"
    [iconOnly]="true"
    ariaLabel="More actions"
  ></fvdr-btn>

  <ng-content></ng-content>

  <span class="bar__spacer"></span>

  <ng-content select="[bar-end]"></ng-content>

  <div class="bar__search" *ngIf="search" [style.width]="searchWidth">
    <fvdr-search [placeholder]="searchPlaceholder" size="m" [filter]="true"></fvdr-search>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }

    .bar {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: nowrap;
    }
    .bar__spacer { flex: 1 1 auto; }
    .bar__search { flex: none; }
  `],
})
export class VdrActionBarComponent {
  @Input() primary?: VdrActionBarButton;
  @Input() secondaries: VdrActionBarButton[] = [];
  /** The `...` overflow button at the end of the left group. */
  @Input() overflow = true;
  @Input() search = true;
  @Input() searchPlaceholder = 'Search';
  @Input() searchWidth = '260px';
}
