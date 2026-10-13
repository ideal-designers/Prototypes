import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../shared/ds/icons/icon.component';
import { TooltipDirective } from '../../shared/ds';
import { DocStatus, STATUS_LABEL } from './bulk-redaction.data';

export type BrStatusPick = 'draft' | 'ready' | 'reviewed';

/**
 * Redaction status chip — Figma "Components → Chips" (124:2197): 28px, 4px radius, 8px padding, 14px label,
 * an 8px status square, optional counter and an arrow when the status can be changed by hand.
 * Colours per status come from that chip set (Grey / Default / Orange / Purple / Green).
 * Local to this prototype for now; promote to the DS (with all states) once the design is signed off.
 *
 *   <fvdr-br-status status="ready" [menu]="true" (picked)="set($event)"></fvdr-br-status>
 *   <fvdr-br-status status="draft" label="Draft marks" [counter]="10" [menu]="true"></fvdr-br-status>
 */
@Component({
  selector: 'fvdr-br-status',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, TooltipDirective],
  template: `
    <span class="wrap">
      <button type="button" class="st" [ngClass]="'st--' + status" [class.st--btn]="menu" [disabled]="!menu"
              [fvdrTooltip]="status === 'detecting' ? 'Detection in progress' : ''" [tooltipDisabled]="status !== 'detecting'"
              aria-haspopup="listbox" [attr.aria-expanded]="menu ? open : null" (click)="toggle($event)">
        <span class="dot"></span>
        <span class="lbl">{{ text }}</span>
        <span class="cnt" *ngIf="counter != null">{{ counter }}</span>
        <fvdr-icon *ngIf="menu" class="arrow" name="chevron-down"></fvdr-icon>
      </button>
      <div class="panel" *ngIf="open" role="listbox" (click)="$event.stopPropagation()">
        <div class="opt" *ngFor="let o of options" role="option" tabindex="0" [class.opt--on]="o === status"
             (click)="pick(o)" (keydown.enter)="pick(o)">
          <span class="dot dot--{{ o }}"></span>{{ labels[o] }}
        </div>
      </div>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; font-family: var(--font-family); }
    .wrap { position: relative; display: inline-flex; }
    .st { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 var(--space-2); border: none; border-radius: var(--radius-sm);
      font-family: inherit; font-size: var(--font-size-base); line-height: 20px; color: var(--color-text-primary); white-space: nowrap;
      cursor: default; max-width: 100%; }
    .st:disabled { opacity: 1; }
    .st--btn { cursor: pointer; }
    .st--btn:hover { filter: brightness(0.96); }
    .st:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .lbl { overflow: hidden; text-overflow: ellipsis; }
    .cnt { flex-shrink: 0; }
    .dot { width: 8px; height: 8px; margin: 0 4px; border-radius: 2px; flex-shrink: 0; background: var(--color-stone-500); }
    .arrow { font-size: var(--font-size-xs); flex-shrink: 0; }

    /* Colour per status — Chips: Grey / Default / Orange / Purple / Green */
    .st--draft { background: var(--chip-bg-grey, #f7f7f7); }
    .st--none { background: var(--chip-bg-default, #eceef9); height: 24px; font-size: var(--font-size-xs); line-height: 16px; }
    .st--detecting { background: var(--chip-bg-default, #eceef9); }
    .st--ready { background: var(--chip-bg-orange, #ffede1); }
    .st--reviewed { background: var(--chip-bg-purple, #f9f1ff); }
    .st--applied { background: var(--chip-bg-green, #eaf6ed); }
    .st--none .dot, .st--draft .dot, .st--detecting .dot, .dot--draft { background: var(--color-stone-500); }
    .st--ready .dot, .dot--ready { background: var(--chip-dot-orange, #ffc694); }
    .st--reviewed .dot, .dot--reviewed { background: var(--chip-dot-purple, #ebd5ff); }
    .st--applied .dot { background: var(--chip-dot-green, #b1eac2); }
    .st--none .arrow, .st--draft .arrow, .st--detecting .arrow { color: var(--color-text-secondary); }
    .st--ready .arrow { color: var(--chip-icon-orange, #df6d00); }
    .st--reviewed .arrow { color: var(--chip-icon-purple, #a964f7); }
    .st--applied .arrow { color: var(--chip-icon-green, #2c9c74); }

    /* Statuses dropdown — 160px, 32px rows, dot + label */
    .panel { position: absolute; top: calc(100% + var(--space-1)); left: 0; z-index: 60; min-width: 160px; padding: 0;
      background: var(--color-stone-0); border-radius: var(--radius-sm); box-shadow: var(--shadow-popup); }
    .opt { display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 var(--space-4) 0 var(--space-3); cursor: pointer;
      font-size: var(--font-size-base); color: var(--color-text-primary); white-space: nowrap; }
    .opt:hover, .opt--on { background: var(--color-stone-200); }
  `],
})
export class BrStatusComponent {
  @Input() status: DocStatus = 'draft';
  /** Overrides the status name, e.g. "Draft marks" in the viewer header. */
  @Input() label = '';
  @Input() counter: number | null = null;
  /** Interactive: shows the arrow and opens the statuses dropdown. */
  @Input() menu = false;
  @Output() picked = new EventEmitter<BrStatusPick>();

  readonly labels = STATUS_LABEL;
  readonly options: BrStatusPick[] = ['draft', 'ready', 'reviewed'];
  open = false;

  get text(): string { return this.label || STATUS_LABEL[this.status]; }

  @HostListener('document:click') close(): void { this.open = false; }

  toggle(e: Event): void {
    if (!this.menu) return;
    e.stopPropagation();
    this.open = !this.open;
  }
  pick(o: BrStatusPick): void {
    this.open = false;
    if (o !== this.status) this.picked.emit(o);
  }
}
