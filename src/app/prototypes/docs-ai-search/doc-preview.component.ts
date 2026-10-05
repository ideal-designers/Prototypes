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
        <span class="pv__ver" *ngIf="version">{{ version }}</span>
        <span class="pv__spacer"></span>
        <ng-container *ngIf="!isReport">
          <button type="button" class="pv__icon" title="Notes" aria-label="Notes"><fvdr-icon name="comment"></fvdr-icon></button>
          <button type="button" class="pv__icon" title="Print" aria-label="Print"><fvdr-icon name="print"></fvdr-icon></button>
          <fvdr-btn label="Open" variant="secondary" size="m"></fvdr-btn>
        </ng-container>
        <fvdr-btn *ngIf="isReport" label="Download" variant="primary" size="m" iconName="download"></fvdr-btn>
      </header>

      <!-- Figma 720:132036 — step through the passages the answer used -->
      <div class="pv__res" *ngIf="resultList.length">
        <span class="pv__res-label">{{ resultList.length }} {{ resultList.length === 1 ? 'result' : 'results' }} used in answer</span>
        <ng-container *ngIf="resultList.length > 1">
          <button type="button" class="pv__icon pv__icon--s" title="Next result" aria-label="Next result" (click)="step(1)"><fvdr-icon name="chevron-down"></fvdr-icon></button>
          <button type="button" class="pv__icon pv__icon--s" title="Previous result" aria-label="Previous result" (click)="step(-1)"><fvdr-icon name="chevron-up"></fvdr-icon></button>
          <span class="pv__res-pos" aria-live="polite">{{ resultIdx + 1 }} / {{ resultList.length }}</span>
        </ng-container>
      </div>

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
            <!-- Generated report (Figma 720:133852) -->
            <article class="pv__page rp" *ngIf="isReport" data-page="1">
              <div class="rp__top"><span>PROJECT SWOOSH · NIKE</span><span>Confidential</span></div>
              <h3 class="rp__title">DD checklist report</h3>
              <p class="rp__sub">22–28 Sep 2026 · prepared by AI Assistant for Olena Zhyvodorova</p>
              <h4 class="pv__h">Summary</h4>
              <p class="pv__para">71 of 86 checklist items are covered. 9 items have no matching file and 6 have a file that looks outdated. Most gaps are in 5. HR and 6. IT; both folders were last updated more than three weeks ago.</p>
              <div class="rp__kpis">
                <div class="rp__kpi" *ngFor="let k of reportKpis"><span>{{ k.label }}</span><b>{{ k.value }}</b></div>
              </div>
              <h4 class="pv__h">Coverage by folder</h4>
              <div class="rp__bar" *ngFor="let c of reportCoverage">
                <span>{{ c.label }}</span><span class="rp__track"><span class="rp__fill" [class.rp__fill--warn]="c.pct < 80" [style.width.%]="c.pct"></span></span><span>{{ c.pct }}%</span>
              </div>
              <span class="pv__folio">1</span>
            </article>

            <article class="pv__page" *ngFor="let p of pages" [attr.data-page]="p.n">
              <h4 *ngIf="p.heading" class="pv__h">{{ p.heading }}</h4>
              <p class="pv__para pv__para--quote" *ngIf="activeQuote && p.n === activePage"><mark class="pv__hl">{{ activeQuote }}</mark></p>
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
    .pv__spacer { flex: 1; }
    .pv__name { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
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
    .pv__ver { flex: 0 0 auto; padding: 0 var(--space-2); height: 20px; line-height: 20px; border-radius: var(--radius-sm);
      background: var(--color-stone-300); font-size: var(--text-caption1-size, 12px); }
    .pv__res { flex: 0 0 auto; display: flex; align-items: center; gap: var(--space-1); height: 40px; padding: 0 var(--space-4);
      box-sizing: border-box; background: var(--color-stone-0); border-bottom: 1px solid var(--color-divider); }
    .pv__res-label { margin-right: var(--space-2); font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .pv__res-pos { margin-left: var(--space-1); font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .pv__icon--s { width: 24px; height: 24px; }
    .pv__hl { background: var(--ai-cite-highlight) !important; color: inherit; box-shadow: 0 0 0 2px var(--ai-cite-highlight); }
    .rp__top { display: flex; justify-content: space-between; margin-bottom: var(--space-8); font-size: var(--font-size-3xs, 10px);
      letter-spacing: 0.06em; color: var(--color-text-secondary); }
    .rp__title { margin: 0; font-size: var(--font-size-xl, 20px); line-height: 28px; }
    .rp__sub { margin: var(--space-1) 0 var(--space-6); color: var(--color-text-secondary); }
    .rp__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); margin-bottom: var(--space-6); }
    .rp__kpi { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-divider);
      border-radius: var(--radius-sm); }
    .rp__kpi span { color: var(--color-text-secondary); }
    .rp__kpi b { font-size: var(--font-size-lg, 16px); }
    .rp__bar { display: grid; grid-template-columns: 96px 1fr 40px; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
    .rp__track { height: 6px; border-radius: var(--radius-full); background: var(--color-stone-200); overflow: hidden; }
    .rp__fill { display: block; height: 100%; background: var(--color-primary-500); }
    .rp__fill--warn { background: var(--color-warning-500); }
    .pv__folio { position: absolute; bottom: var(--space-3); left: 50%; transform: translateX(-50%); color: var(--color-text-secondary); }
  `],
})
export class VdrDocPreviewComponent implements OnChanges {
  @Input({ required: true }) doc!: MockDoc;
  /** Page to scroll to on open (from a "· p. 14" citation). */
  @Input() page?: number;
  @Input() keyword = '';
  /** V1.2 — the cited quote, marked on `page`. */
  @Input() highlight = '';
  @Input() version = '';
  /** V1.2 — the passages to step through; when set they drive the page and the highlight. */
  @Input() results: { page: number; quote: string }[] = [];
  resultIdx = 0;

  get resultList(): { page: number; quote: string }[] {
    if (this.results.length) return this.results;
    return this.highlight ? [{ page: this.page ?? 1, quote: this.highlight }] : [];
  }
  get activePage(): number { return this.resultList[this.resultIdx]?.page ?? this.page ?? 1; }
  get activeQuote(): string { return this.resultList[this.resultIdx]?.quote ?? ''; }

  step(d: number): void {
    const n = this.resultList.length;
    if (!n) return;
    this.resultIdx = (this.resultIdx + d + n) % n;
    this.currentPage = this.activePage;
    setTimeout(() => this.jumpTo(this.activePage));
  }
  @Output() closed = new EventEmitter<void>();

  @ViewChild('scroller') scroller?: ElementRef<HTMLElement>;

  scale = 75;
  currentPage = 1;
  pages: MockPage[] = [];

  get totalPages(): number { return this.doc.pages ?? this.pages.length; }
  get isReport(): boolean { return this.doc.id === 'report'; }

  readonly reportKpis = [
    { label: 'Checklist items', value: '86' }, { label: 'Covered', value: '71' },
    { label: 'Outdated', value: '6' }, { label: 'Missing', value: '9' },
  ];
  readonly reportCoverage = [
    { label: '1. Corporate', pct: 100 }, { label: '2. Legal', pct: 94 }, { label: '3. Financials', pct: 91 },
    { label: '4. Commercial', pct: 85 }, { label: '5. HR', pct: 62 }, { label: '6. IT', pct: 48 },
  ];

  ngOnChanges(): void {
    this.pages = this.buildPages();
    const hit = this.resultList.findIndex(r => r.page === this.page);
    this.resultIdx = hit >= 0 ? hit : 0;
    this.currentPage = this.resultList.length ? this.activePage : this.page ?? 1;
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

  jumpTo(n: number): void {
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
    if (this.isReport) return [];
    const count = Math.min(Math.max(this.doc.pages ?? 8, this.page ?? 0), 48);
    return Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      heading: i === 0 ? title : i % 4 === 1 ? `Clause ${i + 1}` : undefined,
      paras: [0, 1, 2, 3].map(k => body[(i + k) % body.length]),
    }));
  }
}
