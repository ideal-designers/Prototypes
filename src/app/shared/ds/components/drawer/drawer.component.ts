import {
  Component, Input, Output, EventEmitter, HostBinding, HostListener,
  ElementRef, AfterViewInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';

/** The three DS widths: 440 details/forms/lists · 564 Q&A conversation · 640 document preview. */
export type DrawerWidth = 440 | 564 | 640;
/** Title — one object. Item — one of a list: status badge + ref, "n of N", ↑↓. */
export type DrawerHeader = 'title' | 'item';
/** push — in the layout, the page reflows · overlay — floats over the page with a shadow · auto — by viewport. */
export type DrawerMode = 'auto' | 'push' | 'overlay';

/**
 * DS Drawer — Figma: liyNDiFf1piO8SQmHNKoeU, "↳ Drawers organisms" page 40058:1165, component set 40068:1409
 *
 * The details of one item (a row, a request, a file) next to the list it came from.
 * Full height on the right, divider on the left, no shadow and no scrim when it pushes the page.
 *
 * Place it as the last child of a horizontal flex row (list + drawer); in push mode it takes
 * its width from the row and the list reflows. Below the viewport rule (auto) it overlays instead.
 *
 * Slots:
 *   [drawer-header]      replaces the title / item header content (the close button stays first)
 *   [drawer-actions]     icon actions on the object, right side of the header (each with fvdrTooltip)
 *   default              the sections — padding 24, 24 between sections, space instead of dividers
 *   [drawer-footer]      actions that save or send: Primary on the left, Secondary next to it
 *   [drawer-footer-end]  an action that ends the flow, pinned right (e.g. "Close question")
 *
 * Read-only drawers have no footer: leave the footer slots empty, or set [showFooter]="false".
 *
 * Usage:
 *   <fvdr-drawer header="item" status="To review" statusVariant="warning" ref="1.2"
 *                [index]="i" [total]="items.length" (prev)="go(-1)" (next)="go(1)" (closed)="close()">
 *     <section>…</section>
 *     <fvdr-btn drawer-footer label="Save" variant="primary" />
 *     <fvdr-btn drawer-footer label="Cancel" variant="secondary" />
 *   </fvdr-drawer>
 */
@Component({
  selector: 'fvdr-drawer',
  standalone: true,
  imports: [CommonModule, ButtonComponent, BadgeComponent],
  template: `
    <header class="dr-head">
      <span class="dr-close">
        <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Close" (clicked)="close()"></fvdr-btn>
      </span>

      <div class="dr-head__content">
        <ng-content select="[drawer-header]"></ng-content>

        <ng-container *ngIf="header === 'title' && title">
          <h2 class="dr-title">{{ title }}</h2>
        </ng-container>

        <ng-container *ngIf="header === 'item'">
          <fvdr-badge *ngIf="status" [label]="status" [variant]="statusVariant"></fvdr-badge>
          <span class="dr-ref" *ngIf="ref">{{ ref }}</span>
          <span class="dr-item-title" *ngIf="title">{{ title }}</span>
        </ng-container>
      </div>

      <div class="dr-head__end">
        <ng-content select="[drawer-actions]"></ng-content>
        <ng-container *ngIf="header === 'item' && total > 0">
          <span class="dr-counter">{{ index + 1 }} of {{ total }}</span>
          <span class="dr-nav">
            <fvdr-btn variant="ghost" size="s" iconName="chevron-up" [iconOnly]="true" ariaLabel="Previous"
                      [disabled]="index <= 0" (clicked)="prev.emit()"></fvdr-btn>
            <fvdr-btn variant="ghost" size="s" iconName="chevron-down" [iconOnly]="true" ariaLabel="Next"
                      [disabled]="index >= total - 1" (clicked)="next.emit()"></fvdr-btn>
          </span>
        </ng-container>
      </div>
    </header>

    <div class="dr-body">
      <ng-content></ng-content>
    </div>

    <footer class="dr-foot" *ngIf="showFooter">
      <ng-content select="[drawer-footer]"></ng-content>
      <span class="dr-foot__end"><ng-content select="[drawer-footer-end]"></ng-content></span>
    </footer>
  `,
  styles: [`
    :host {
      flex: none;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
      background: var(--color-stone-0);
      border-left: 1px solid var(--color-divider);
      font-family: var(--font-family);
      color: var(--color-text-primary);
    }
    :host(.dr--overlay) {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      height: auto;
      z-index: var(--z-dropdown);
      box-shadow: var(--shadow-modal);
    }
    :host(.dr--closed) { display: none; }
    :host(:focus) { outline: none; }

    /* Header — 64 high, padding 16 left/right, 8 between elements */
    .dr-head {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      height: var(--space-16);
      padding: 0 var(--space-4);
      box-sizing: border-box;
      border-bottom: 1px solid var(--color-divider);
    }
    .dr-close { display: inline-flex; flex: none; }
    .dr-head__content {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .dr-head__end {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .dr-head__end:empty { display: none; }

    /* Title — Label L */
    .dr-title {
      margin: 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--text-label-l-size);
      line-height: var(--text-label-l-lh);
      font-weight: var(--text-label-l-weight);
    }
    .dr-ref {
      flex: none;
      font-size: var(--text-label-m-size);
      line-height: var(--text-label-m-lh);
      font-weight: var(--text-label-m-weight);
    }
    .dr-item-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--text-body3-size);
      line-height: var(--text-body3-lh);
      color: var(--color-text-secondary);
    }
    .dr-counter {
      font-size: var(--text-caption1-size);
      line-height: var(--text-caption1-lh);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .dr-nav { display: inline-flex; }

    /* Content — padding 24, 24 between sections, scrolls on its own */
    .dr-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* Footer — padding 16/24, 12 between buttons */
    .dr-foot {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
    .dr-foot:not(:has(> :not(.dr-foot__end))):has(> .dr-foot__end:empty) { display: none; }
    .dr-foot__end { margin-left: auto; display: inline-flex; align-items: center; gap: var(--space-3); }
    .dr-foot__end:empty { display: none; }
  `],
})
export class DrawerComponent implements AfterViewInit, OnChanges {
  /** Rendered and listening for Esc while true. Use it, or wrap the drawer in *ngIf. */
  @Input() open = true;
  @Input() width: DrawerWidth = 440;
  @Input() header: DrawerHeader = 'title';
  /** Title header: the drawer title. Item header: optional secondary text after the ref. */
  @Input() title = '';
  /** Item header: status badge text, e.g. "To review". */
  @Input() status = '';
  @Input() statusVariant: BadgeVariant = 'warning';
  /** Item header: the item reference, e.g. "1.2". */
  @Input() ref = '';
  /** Item header: zero-based position of the item in the list. */
  @Input() index = 0;
  /** Item header: list length. 0 hides the counter and ↑↓. */
  @Input() total = 0;
  @Input() showFooter = true;
  @Input() mode: DrawerMode = 'auto';
  /** Esc closes the drawer. Turn off when the screen already handles Esc itself (e.g. layered panels). */
  @Input() closeOnEsc = true;
  /** Aria label for the region when the header has no plain title. */
  @Input() ariaLabel = '';

  @Output() closed = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  constructor(private host: ElementRef<HTMLElement>) {}

  private viewport = typeof window !== 'undefined' ? window.innerWidth : 1440;

  @HostBinding('attr.role') readonly role = 'region';
  /** Focus target on open: the region itself, so keyboard users land in the drawer without popping the close tooltip. */
  @HostBinding('attr.tabindex') readonly tabindex = -1;
  @HostBinding('attr.aria-label') get label() { return this.ariaLabel || this.title || this.ref || 'Details'; }
  @HostBinding('style.width.px') get w() { return this.width; }
  @HostBinding('class.dr--overlay') get overlay() { return this.resolvedMode === 'overlay'; }
  @HostBinding('class.dr--closed') get isClosed() { return !this.open; }

  /** Push at ≥ 1280 for 440, at ≥ 1440 for 564 and 640; overlay below (DS drawer rule). */
  get resolvedMode(): 'push' | 'overlay' {
    if (this.mode !== 'auto') return this.mode;
    return this.viewport >= (this.width === 440 ? 1280 : 1440) ? 'push' : 'overlay';
  }

  ngAfterViewInit(): void { this.focusRegion(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && !changes['open'].firstChange) setTimeout(() => this.focusRegion());
  }

  @HostListener('window:resize')
  onResize(): void { this.viewport = window.innerWidth; }

  @HostListener('document:keydown.escape', ['$event'])
  onEsc(e: KeyboardEvent): void {
    if (!this.open || !this.closeOnEsc || e.defaultPrevented) return;
    // Esc while typing clears the field, not the drawer
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    this.close();
  }

  close(): void { this.closed.emit(); }

  private focusRegion(): void {
    if (this.open) this.host.nativeElement.focus({ preventScroll: true });
  }
}
