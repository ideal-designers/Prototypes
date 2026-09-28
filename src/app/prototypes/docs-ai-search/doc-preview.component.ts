import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { MockDoc } from './docs-ai-search.data';

interface MockPage { n: number; heading?: string; paras: string[] }

/**
 * Right-hand file preview opened from a citation or a result row (Figma 422:18763).
 * A drawn contract, not a real PDF — enough to show the page jump, zoom and keyword marks.
 */
@Component({
  selector: 'fvdr-vdr-doc-preview',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <aside class="pv" aria-label="File preview">
      <header class="pv__head">
        <button type="button" class="pv__icon" title="Close preview" aria-label="Close preview" (click)="closed.emit()">
          <fvdr-icon name="close"></fvdr-icon>
        </button>
        <fvdr-file-icon [type]="doc.type"></fvdr-file-icon>
        <span class="pv__name" [title]="doc.name">{{ doc.index }}&nbsp; {{ doc.name }}</span>
        <button type="button" class="pv__icon" title="Notes" aria-label="Notes"><fvdr-icon name="comment"></fvdr-icon></button>
        <button type="button" class="pv__icon" title="Print" aria-label="Print"><fvdr-icon name="print"></fvdr-icon></button>
        <fvdr-btn label="Open" variant="secondary" size="m"></fvdr-btn>
      </header>

      <div class="pv__body">
        <div class="pv__rail">
          <span class="pv__page-no">{{ currentPage }}</span>
          <span class="pv__page-total">{{ totalPages }}</span>
          <span class="pv__sep"></span>
          <button type="button" class="pv__icon" title="Zoom in" aria-label="Zoom in" (click)="zoom(10)"><fvdr-icon name="plus"></fvdr-icon></button>
          <span class="pv__zoom">{{ scale }}%</span>
          <button type="button" class="pv__icon" title="Zoom out" aria-label="Zoom out" (click)="zoom(-10)"><fvdr-icon name="minus"></fvdr-icon></button>
        </div>

        <div class="pv__scroll" #scroller (scroll)="onScroll()">
          <div class="pv__pages" [style.zoom]="scale / 75">
            <article class="pv__page" *ngFor="let p of pages" [attr.data-page]="p.n">
              <h4 *ngIf="p.heading" class="pv__h">{{ p.heading }}</h4>
              <p *ngFor="let para of p.paras" class="pv__para">
                <ng-container *ngFor="let part of marked(para)">
                  <mark *ngIf="part.hit; else plain">{{ part.text }}</mark>
                  <ng-template #plain>{{ part.text }}</ng-template>
                </ng-container>
              </p>
              <span class="pv__folio">{{ p.n }}</span>
            </article>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: flex; min-width: 0; height: 100%; font-family: var(--font-family); }
    .pv { display: flex; flex-direction: column; width: 100%; height: 100%; background: var(--color-stone-0);
      border-left: 1px solid var(--color-divider); }
    .pv__head { display: flex; align-items: center; gap: var(--space-3); height: 64px; flex: 0 0 64px;
      padding: 0 var(--space-4); box-sizing: border-box; border-bottom: 1px solid var(--color-divider); }
    .pv__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-primary); }
    .pv__icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;
      padding: 0; border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer;
      color: var(--color-text-secondary); font-size: var(--font-size-base, 14px); }
    .pv__icon:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .pv__body { flex: 1; min-height: 0; display: flex; background: var(--color-stone-200); }
    .pv__rail { flex: 0 0 48px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      gap: var(--space-2); padding: var(--space-4) 0; }
    .pv__page-no { min-width: 28px; padding: var(--space-1) 0; text-align: center; background: var(--color-stone-0);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); font-size: var(--text-caption1-size, 12px); }
    .pv__page-total, .pv__zoom { font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .pv__sep { width: 20px; height: 1px; background: var(--color-divider); }

    .pv__scroll { flex: 1; min-width: 0; overflow: auto; padding: var(--space-4) var(--space-4) var(--space-4) 0; }
    .pv__pages { display: flex; flex-direction: column; gap: var(--space-4); }
    .pv__page { position: relative; padding: var(--space-10) var(--space-10) var(--space-8); background: var(--color-stone-0);
      box-shadow: var(--shadow-card); min-height: 640px; box-sizing: border-box;
      font-size: var(--text-caption1-size, 12px); line-height: 18px; color: var(--color-text-primary); }
    .pv__h { margin: 0 0 var(--space-3); font-size: var(--font-size-base, 14px); font-weight: var(--font-weight-bold, 700); text-transform: uppercase; }
    .pv__para { margin: 0 0 var(--space-3); }
    .pv__para mark { background: var(--color-highlight-mark, #FFDA07); color: inherit; }
    .pv__folio { position: absolute; bottom: var(--space-3); left: 50%; transform: translateX(-50%); color: var(--color-text-secondary); }
  `],
})
export class VdrDocPreviewComponent implements OnChanges {
  @Input({ required: true }) doc!: MockDoc;
  /** Page to scroll to on open (from a "· p. 14" citation). */
  @Input() page?: number;
  @Input() keyword = '';
  @Output() closed = new EventEmitter<void>();

  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  scale = 75;
  currentPage = 1;
  pages: MockPage[] = [];

  get totalPages(): number { return this.doc.pages ?? this.pages.length; }

  ngOnChanges(): void {
    this.pages = this.buildPages();
    this.currentPage = this.page ?? 1;
    setTimeout(() => this.jumpTo(this.currentPage));
  }

  zoom(delta: number): void {
    this.scale = Math.min(150, Math.max(50, this.scale + delta));
  }

  onScroll(): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    const pages = Array.from(el.querySelectorAll<HTMLElement>('.pv__page'));
    const top = el.getBoundingClientRect().top;
    const hit = pages.find(p => p.getBoundingClientRect().bottom > top + 80);
    if (hit) this.currentPage = Number(hit.dataset['page']);
  }

  marked(text: string): { text: string; hit: boolean }[] {
    const q = this.keyword.trim();
    if (!q) return [{ text, hit: false }];
    return text.split(new RegExp(`(${q})`, 'ig')).filter(Boolean)
      .map(t => ({ text: t, hit: t.toLowerCase() === q.toLowerCase() }));
  }

  private jumpTo(n: number): void {
    const el = this.scroller?.nativeElement;
    const target = el?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    if (el && target) el.scrollTop = target.offsetTop - el.offsetTop;
  }

  private buildPages(): MockPage[] {
    const title = this.doc.name.replace(/\.(pdf|docx?)$/i, '');
    const body = [
      'This Agreement is entered into by and between the Seller and the Purchaser (each a “Party”, together the “Parties”) and sets out the terms on which the Business is transferred.',
      'Change of Control. Any direct or indirect change of control of a Party, including through its ultimate parent, shall require the prior written consent of the other Party, such consent to be obtained before signing.',
      'Termination. The Seller may terminate this Agreement with immediate effect by written notice if the Purchaser undergoes a change of control without such consent.',
      'Earn-Out. The Earn-Out Payment shall be calculated in accordance with Schedule 4 and paid within thirty (30) Business Days of the Accounts being agreed.',
      'Conflict. In the event of a conflict between this Agreement and the Asset Purchase Agreement, the latter prevails.',
    ];
    const count = Math.min(this.doc.pages ?? 8, 16);
    return Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      heading: i === 0 ? title : i % 4 === 1 ? `Clause ${i + 1}` : undefined,
      paras: [0, 1, 2, 3].map(k => body[(i + k) % body.length]),
    }));
  }
}
