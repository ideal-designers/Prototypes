import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../shared/ds/icons/icon.component';
import { TooltipDirective } from '../../shared/ds';
import { BrPdfService, PdfPageSize } from './br-pdf.service';
import { Mark } from './bulk-redaction.data';

/**
 * The shared mock document (real PDF rendered with pdf.js) with redaction marks on top.
 * Used by the full-screen viewer and by the concept-1 preview drawer, so a mark looks the same everywhere.
 * Mark colours are the same tokens /redaction-viewer uses: draft = orange, applied = green, preview = black.
 */
@Component({
  selector: 'fvdr-br-pdf',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent, TooltipDirective],
  template: `
    <div class="loading" *ngIf="!sizes.length"><span class="spin"></span>Loading document…</div>
    <div class="pg" *ngFor="let p of sizes; let i = index" [style.width.px]="p.w * scale" [style.height.px]="p.h * scale" [attr.data-page]="i + 1">
      <canvas #cv class="cv"></canvas>
      <div class="ov">
        <div *ngFor="let m of marksOn(i + 1); trackBy: byId" class="mk"
             [class.mk--draft]="m.state === 'draft' && !preview" [class.mk--applied]="m.state === 'applied' && !preview"
             [class.mk--prev]="preview" [class.mk--sel]="m.id === selectedId" [class.mk--pick]="pick" [attr.data-mark]="m.id"
             [style.left.px]="m.x * scale" [style.top.px]="m.y * scale" [style.width.px]="m.w * scale" [style.height.px]="m.h * scale"
             (click)="markClick.emit(m)"></div>
        <!-- Selected mark: delete it, or every occurrence of it in the document -->
        <div class="bar" *ngIf="deletable && !preview && selectedMark(i + 1) as sm" [style.left.px]="(sm.x + sm.w / 2) * scale" [style.top.px]="(sm.y + sm.h) * scale + 8"
             (click)="$event.stopPropagation()">
          <button type="button" class="bar__btn" fvdrTooltip="Delete" (click)="deleteOne.emit(sm)"><fvdr-icon name="delete-mark"></fvdr-icon></button>
          <button type="button" class="bar__btn" fvdrTooltip="Delete from all pages" (click)="deleteAll.emit(sm)"><fvdr-icon name="delete-all-pages"></fvdr-icon></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); }
    .pg { position: relative; background: var(--color-stone-0); box-shadow: 0 0 4px 0 rgba(52, 58, 64, 0.08); flex-shrink: 0; }
    .cv { display: block; width: 100%; height: 100%; }
    .ov { position: absolute; inset: 0; pointer-events: none; }
    .mk { position: absolute; box-sizing: border-box; border: 1px solid transparent; border-radius: 2px; pointer-events: all; cursor: pointer; }
    .mk--draft { background: rgba(115, 117, 127, 0.2); }
    .mk--applied { background: rgba(44, 156, 116, 0.16); }
    .mk--prev { background: var(--redaction-preview-fill); cursor: default; }
    .mk--sel.mk--draft { background: rgba(44, 156, 116, 0.24); border-color: var(--color-primary-500); }
    .mk--sel.mk--applied { background: rgba(44, 156, 116, 0.24); border-color: var(--color-primary-500); }
    .mk--pick:hover { border-color: var(--color-stone-500); }
    .bar { position: absolute; z-index: 5; display: flex; gap: var(--space-1); padding: var(--space-1); transform: translateX(-50%); pointer-events: all;
      background: var(--color-stone-0); border-radius: var(--radius-sm); box-shadow: var(--shadow-popup); }
    .bar__btn { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: none; background: transparent;
      cursor: pointer; border-radius: var(--radius-sm); color: var(--color-error-600); }
    .bar__btn:hover { background: var(--color-hover-bg); }
    .loading { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-16) 0; color: var(--color-text-secondary); }
    .spin { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary-500); border-radius: 50%; animation: br-pdf-spin 0.8s linear infinite; }
    @keyframes br-pdf-spin { to { transform: rotate(360deg); } }
  `],
})
export class BrPdfComponent implements OnInit, OnChanges {
  private pdf = inject(BrPdfService);

  @Input() marks: Mark[] = [];
  @Input() preview = false;
  @Input() scale = 1;
  @Input() selectedId: string | null = null;
  /** Marks react to hover (e.g. while the "Do not redact" idea of clicking a mark is on). */
  @Input() pick = false;
  /** Show the delete toolbar under the selected mark. */
  @Input() deletable = false;
  @Output() markClick = new EventEmitter<Mark>();
  @Output() deleteOne = new EventEmitter<Mark>();
  @Output() deleteAll = new EventEmitter<Mark>();
  @ViewChildren('cv') canvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  sizes: PdfPageSize[] = [];
  private renderedAt = 0;
  private busy = false;

  byId = (_: number, m: Mark) => m.id;
  selectedMark(page: number): Mark | undefined { return this.marks.find(m => m.id === this.selectedId && m.page === page); }
  marksOn(page: number): Mark[] { return this.marks.filter(m => m.page === page); }

  async ngOnInit(): Promise<void> {
    this.sizes = await this.pdf.pageSizes();
    setTimeout(() => this.render());
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['scale'] && this.sizes.length) setTimeout(() => this.render());
  }

  private async render(): Promise<void> {
    if (this.busy || this.renderedAt === this.scale || !this.canvases) return;
    this.busy = true;
    const target = this.scale;
    const doc = await this.pdf.doc();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let i = 1;
    for (const ref of this.canvases.toArray()) {
      const page = await doc.getPage(i++);
      const viewport = page.getViewport({ scale: target * dpr });
      const cv = ref.nativeElement;
      cv.width = viewport.width;
      cv.height = viewport.height;
      await page.render({ canvasContext: cv.getContext('2d')!, viewport }).promise;
    }
    this.renderedAt = target;
    this.busy = false;
    if (target !== this.scale) setTimeout(() => this.render());
  }
}
