import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GhostBtnComponent } from '../ghost-btn/ghost-btn.component';

/**
 * fvdr-floating-panel — Organism: floating toolbar of ghost buttons.
 *
 * Figma: FVDR - Viewers (02e4Sm7wmZioAEV6imoNR7)
 *   node 11255:9878
 *
 * ── Orientation ──────────────────────────────────────────────
 *   vertical   → buttons stacked top-to-bottom  (default)
 *   horizontal → buttons in a row
 *
 * ── Size ─────────────────────────────────────────────────────
 *   big   → 8px padding, 4px gap, radius 8px (vertical) / 4px (horizontal)
 *   small → 4px padding, no gap, radius 4px
 *
 * ── Items ────────────────────────────────────────────────────
 *   Each item has id, iconPath (SVG <path d> value), optional
 *   tooltip, selected, disabled flags.
 *   itemClicked emits the item's id on click.
 *
 * ── Usage ────────────────────────────────────────────────────
 *   <fvdr-floating-panel
 *     [items]="toolbarItems"
 *     orientation="vertical"
 *     size="big"
 *     (itemClicked)="onTool($event)">
 *   </fvdr-floating-panel>
 */

export interface FloatingPanelItem {
  /** Unique identifier — emitted by (itemClicked). */
  id: string;
  /** SVG <path d="..."> value for the icon (16×16 viewBox). */
  iconPath: string;
  /** Native tooltip shown on hover. */
  tooltip?: string;
  /** Green selected state. */
  selected?: boolean;
  /** Disabled state. */
  disabled?: boolean;
}

export type FloatingPanelOrientation = 'vertical' | 'horizontal';
export type FloatingPanelSize = 'big' | 'small';

@Component({
  selector: 'fvdr-floating-panel',
  standalone: true,
  imports: [CommonModule, GhostBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fp"
         [class.fp--vertical]="orientation === 'vertical'"
         [class.fp--horizontal]="orientation === 'horizontal'"
         [class.fp--big]="size === 'big'"
         [class.fp--small]="size === 'small'">
      <fvdr-ghost-btn
        *ngFor="let item of items"
        size="small"
        [iconPath]="item.iconPath"
        [selected]="!!item.selected"
        [disabled]="!!item.disabled"
        [attr.title]="item.tooltip || null"
        (clicked)="itemClicked.emit(item.id)">
      </fvdr-ghost-btn>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }

    .fp {
      display: inline-flex;
      background: var(--color-stone-0, #FFFFFF);
      /* Figma: Floating comment shadow — DROP_SHADOW rgba(52,58,64,0.08) 0 0 4px */
      box-shadow: 0 0 4px 0 rgba(52, 58, 64, 0.08);
      overflow: hidden;
    }

    /* ── Vertical ── */
    .fp--vertical { flex-direction: column; align-items: flex-start; }
    .fp--vertical.fp--big   { gap: 4px; padding: 8px; border-radius: 8px; }
    .fp--vertical.fp--small { padding: 4px; border-radius: 4px; }

    /* ── Horizontal ── */
    .fp--horizontal { flex-direction: row; align-items: center; }
    .fp--horizontal.fp--big   { gap: 4px; padding: 8px; border-radius: 4px; }
    .fp--horizontal.fp--small { height: 40px; padding: 4px; border-radius: 4px; }
  `]
})
export class FloatingPanelComponent {
  /** Array of toolbar items. Each becomes one ghost button. */
  @Input() items: FloatingPanelItem[] = [];

  /** Layout direction: 'vertical' (default) or 'horizontal'. */
  @Input() orientation: FloatingPanelOrientation = 'vertical';

  /** Panel size: 'big' (8px padding, 4px gap) or 'small' (4px padding, no gap). */
  @Input() size: FloatingPanelSize = 'big';

  /** Emits the clicked item's `id`. */
  @Output() itemClicked = new EventEmitter<string>();
}
