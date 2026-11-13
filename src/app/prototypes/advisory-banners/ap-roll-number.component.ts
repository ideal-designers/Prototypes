import { AfterViewInit, Component, ElementRef, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Odometer-style number: every digit is a column of 0–9 that rolls up to its value.
 * Plays on first render and again whenever `replay` changes (ignored while it is still rolling).
 */
@Component({
  selector: 'ap-roll-number',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="roll" [attr.aria-label]="value" role="text">
      <ng-container *ngFor="let ch of chars; trackBy: byIdx">
        <span class="roll__d" *ngIf="ch.digit !== null" aria-hidden="true">
          <span class="roll__col" #col [attr.data-digit]="ch.digit" [style.transform]="rest(ch.digit)">
            <span *ngFor="let n of ladder">{{ n }}</span>
          </span>
        </span>
        <span *ngIf="ch.digit === null" aria-hidden="true">{{ ch.text }}</span>
      </ng-container>
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
    .roll { display: inline-flex; height: var(--roll-h, 1.4em); line-height: var(--roll-h, 1.4em); overflow: hidden; font-variant-numeric: tabular-nums; }
    .roll__d { display: inline-block; height: var(--roll-h, 1.4em); overflow: hidden; }
    .roll__col { display: flex; flex-direction: column; will-change: transform; }
    .roll__col > span { display: block; height: var(--roll-h, 1.4em); }
  `],
})
export class RollNumberComponent implements AfterViewInit, OnChanges {
  @Input() value = 0;
  /** Roll time of the first digit in ms; later digits start a little after it. */
  @Input() duration = 500;
  @Input() stagger = 70;
  /** Change this value to roll the number again. */
  @Input() replay = 0;

  @ViewChildren('col') cols!: QueryList<ElementRef<HTMLElement>>;
  readonly ladder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  private playing = false;
  private ready = false;

  chars: { text: string; digit: number | null }[] = [];
  byIdx = (i: number) => i;
  /** Resting position of a column (also what you see with reduced motion). */
  rest(d: number): string { return `translateY(calc(${-(d === 0 ? 10 : d)} * var(--roll-h, 1.4em)))`; }

  ngAfterViewInit(): void { this.ready = true; this.play(); }

  ngOnChanges(c: SimpleChanges): void {
    if (c['value'] || !this.chars.length) this.chars = String(this.value).split('').map(ch => ({ text: ch, digit: /\d/.test(ch) ? Number(ch) : null }));
    if (this.ready && c['replay'] && !c['replay'].firstChange) this.play();
  }

  play(): void {
    if (this.playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = this.cols.toArray();
    if (!cols.length) return;
    this.playing = true;
    let last: Animation | null = null;
    cols.forEach((ref, i) => {
      const el = ref.nativeElement;
      const d = Number(el.dataset['digit']);
      const target = d === 0 ? 10 : d;                 // 0 spins a full lap and lands on the bottom 0
      const h = el.firstElementChild!.getBoundingClientRect().height;
      last = el.animate(
        [{ transform: 'translateY(0)' }, { transform: `translateY(${-target * h}px)` }],
        { duration: this.duration + i * this.stagger, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)', fill: 'both' },
      );
    });
    (last as Animation | null)?.finished.then(() => (this.playing = false)).catch(() => (this.playing = false));
  }
}
