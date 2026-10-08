import { Directive, ElementRef, HostListener, Input, OnChanges, OnDestroy, inject } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * DS Tooltip — Figma: "Tooltip" component set (⚙️ FVDR - Design System)
 *
 * Dark label that explains an icon-only control. Every icon button must have one.
 *
 * Specs:
 *   bg --color-stone-1000, text --color-text-inverse, 12px / 16px
 *   padding 4px 8px, radius --radius-sm, 6px arrow, 8px gap from the target
 *   shows after 300ms on hover, immediately on keyboard focus; hides on leave / blur / Esc / click
 *
 * Usage:
 *   <button fvdrTooltip="Zoom in" (click)="zoomIn()"><fvdr-icon name="plus" /></button>
 *   <button fvdrTooltip="Delete connection" tooltipPosition="bottom">…</button>
 *
 * The host gets aria-label from the tooltip text when it has no visible text of its own.
 * The tooltip is appended to <body>, so it never gets clipped by overflow or transforms.
 */
@Directive({
  selector: '[fvdrTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnChanges, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private tip: HTMLDivElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  @Input('fvdrTooltip') text = '';
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipDisabled = false;

  ngOnChanges(): void {
    const el = this.host.nativeElement as HTMLElement;
    if (this.text && !el.textContent?.trim()) el.setAttribute('aria-label', this.text);
    if (this.tip) this.tip.querySelector('span')!.textContent = this.text;
  }

  @HostListener('mouseenter') onEnter() { this.schedule(300); }
  @HostListener('focusin') onFocus() { this.schedule(0); }
  @HostListener('mouseleave') onLeave() { this.hide(); }
  @HostListener('focusout') onBlur() { this.hide(); }
  @HostListener('mousedown') onDown() { this.hide(); }
  @HostListener('document:keydown.escape') onEsc() { this.hide(); }

  ngOnDestroy(): void { this.hide(); }

  private schedule(delay: number) {
    if (!this.text || this.tooltipDisabled) return;
    this.clearTimer();
    this.timer = setTimeout(() => this.show(), delay);
  }

  private show() {
    this.hide();
    const tip = document.createElement('div');
    tip.setAttribute('role', 'tooltip');
    tip.className = `fvdr-tooltip fvdr-tooltip--${this.tooltipPosition}`;
    const label = document.createElement('span');
    label.textContent = this.text;
    tip.appendChild(label);
    ensureStyles();
    document.body.appendChild(tip);
    this.tip = tip;
    this.place();
  }

  private place() {
    if (!this.tip) return;
    const r = (this.host.nativeElement as HTMLElement).getBoundingClientRect();
    const t = this.tip.getBoundingClientRect();
    const GAP = 8;
    let pos = this.tooltipPosition;
    // flip when there is no room
    if (pos === 'top' && r.top - t.height - GAP < 0) pos = 'bottom';
    if (pos === 'bottom' && r.bottom + t.height + GAP > window.innerHeight) pos = 'top';
    if (pos === 'left' && r.left - t.width - GAP < 0) pos = 'right';
    if (pos === 'right' && r.right + t.width + GAP > window.innerWidth) pos = 'left';
    this.tip.className = `fvdr-tooltip fvdr-tooltip--${pos}`;

    let x = 0, y = 0;
    if (pos === 'top' || pos === 'bottom') {
      x = r.left + r.width / 2 - t.width / 2;
      y = pos === 'top' ? r.top - t.height - GAP : r.bottom + GAP;
    } else {
      y = r.top + r.height / 2 - t.height / 2;
      x = pos === 'left' ? r.left - t.width - GAP : r.right + GAP;
    }
    x = Math.max(4, Math.min(x, window.innerWidth - t.width - 4));
    this.tip.style.left = `${Math.round(x + window.scrollX)}px`;
    this.tip.style.top = `${Math.round(y + window.scrollY)}px`;
    // keep the arrow pointing at the target even after clamping
    const arrowX = r.left + r.width / 2 - x;
    this.tip.style.setProperty('--fvdr-tooltip-arrow-x', `${Math.round(arrowX)}px`);
  }

  private hide() {
    this.clearTimer();
    this.tip?.remove();
    this.tip = null;
  }

  private clearTimer() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
}

/** Tooltip lives in <body>, outside any component, so its styles are injected once globally. */
function ensureStyles() {
  if (document.getElementById('fvdr-tooltip-styles')) return;
  const style = document.createElement('style');
  style.id = 'fvdr-tooltip-styles';
  style.textContent = `
    .fvdr-tooltip {
      position: absolute; z-index: 10000; pointer-events: none;
      max-width: 240px; padding: var(--space-1) var(--space-2);
      background: var(--color-stone-1000); color: var(--color-text-inverse);
      border-radius: var(--radius-sm);
      font-family: var(--font-family); font-size: var(--text-caption1-size); line-height: 16px;
      box-shadow: var(--shadow-popover);
      animation: fvdr-tooltip-in 0.12s ease-out;
    }
    .fvdr-tooltip::after {
      content: ''; position: absolute; width: 0; height: 0; border: 5px solid transparent;
    }
    .fvdr-tooltip--top::after    { top: 100%;    left: var(--fvdr-tooltip-arrow-x, 50%); margin-left: -5px; border-top-color: var(--color-stone-1000); }
    .fvdr-tooltip--bottom::after { bottom: 100%; left: var(--fvdr-tooltip-arrow-x, 50%); margin-left: -5px; border-bottom-color: var(--color-stone-1000); }
    .fvdr-tooltip--left::after   { left: 100%;   top: 50%; margin-top: -5px; border-left-color: var(--color-stone-1000); }
    .fvdr-tooltip--right::after  { right: 100%;  top: 50%; margin-top: -5px; border-right-color: var(--color-stone-1000); }
    @keyframes fvdr-tooltip-in { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .fvdr-tooltip { animation: none; } }
  `;
  document.head.appendChild(style);
}
