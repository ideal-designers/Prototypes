import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { MockDoc } from './docs-ai-search.data';
import type { DocHoverEvent } from './answer-body.component';
import { V12Answer, V12Block, V12Run, V12Source, runs } from './v12.data';

export interface V12DocOpen { doc: MockDoc; page?: number; source?: V12Source }

/**
 * V1.2 answer body — Figma 720:131529. One renderer for the overview card and the full
 * assistant: lead with numbered citations, key-terms table, bullets, per-file cards,
 * KPI tiles, coverage bars and a generated-report card, then "N sources" + actions.
 * Hovering a citation opens a quote popover (720:132616) with "Open preview ›".
 */
@Component({
  selector: 'fvdr-vdr-v12-answer',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="ans">
      <p class="ans__lead"><ng-container *ngTemplateOutlet="rich; context: { $implicit: answer.lead }"></ng-container></p>

      <ng-container *ngFor="let b of answer.blocks; trackBy: byIdx">
        <!-- Key terms table -->
        <section class="blk" *ngIf="b.kind === 'table'">
          <h3 class="blk__h">{{ b.title }}</h3>
          <div class="kt" role="table" [attr.aria-label]="b.title">
            <div class="kt__row kt__row--head" role="row">
              <span role="columnheader" *ngFor="let h of b.head">{{ h }}</span>
            </div>
            <div class="kt__row" role="row" *ngFor="let r of b.rows">
              <span role="cell" class="kt__term">{{ r.term }}</span>
              <span role="cell">{{ r.says }}</span>
              <span role="cell" class="kt__src">
                <ng-container *ngTemplateOutlet="cite; context: { $implicit: r.cite, key: 't' + r.term, page: pageOf(r.loc) }"></ng-container>{{ r.loc }}
              </span>
            </div>
          </div>
        </section>

        <!-- Bullets -->
        <section class="blk" *ngIf="b.kind === 'bullets'">
          <h3 class="blk__h" *ngIf="b.title">{{ b.title }}</h3>
          <ul class="bul">
            <li *ngFor="let it of b.items"><ng-container *ngTemplateOutlet="rich; context: { $implicit: it }"></ng-container></li>
          </ul>
        </section>

        <!-- Per-file cards -->
        <div class="files" *ngIf="b.kind === 'files'">
          <div class="fc" *ngFor="let f of b.items; let i = index" role="button" tabindex="0"
               [class.fc--on]="selectedDocId === f.doc.id"
               (click)="openDoc(f.doc, i + 1)" (keydown.enter)="openDoc(f.doc, i + 1)">
            <div class="fc__top">
              <fvdr-file-icon [type]="f.doc.type"></fvdr-file-icon>
              <span class="fc__name" (mouseenter)="hoverDoc(f.doc, $event)" (mouseleave)="docHover.emit(null)">
                <span class="fc__idx">{{ f.doc.index }}</span>{{ f.doc.name }}
              </span>
              <span class="fc__acts">
                <button type="button" class="ib" title="Copy link" aria-label="Copy link" (click)="$event.stopPropagation()"><fvdr-icon name="copy"></fvdr-icon></button>
                <button type="button" class="ib" title="Open file" aria-label="Open file" (click)="$event.stopPropagation(); openDoc(f.doc, i + 1)"><fvdr-icon name="share"></fvdr-icon></button>
                <button type="button" class="ib" title="More" aria-label="More" (click)="$event.stopPropagation()"><fvdr-icon name="more"></fvdr-icon></button>
              </span>
              <span class="tag" [class.tag--green]="f.viewed" [class.tag--yellow]="!f.viewed">{{ f.viewed ? 'Viewed' : 'Not viewed' }}</span>
            </div>
            <p class="fc__txt">{{ f.text }}</p>
          </div>
        </div>

        <!-- KPI tiles -->
        <div class="kpis" *ngIf="b.kind === 'kpis'">
          <div class="kpi" *ngFor="let k of b.items">
            <span class="kpi__label">{{ k.label }}</span>
            <span class="kpi__val">{{ k.value }}
              <span *ngIf="k.badge" class="tag" [ngClass]="'tag--' + k.tone">{{ k.badge }}</span>
            </span>
          </div>
        </div>

        <!-- Coverage bars -->
        <section class="cov" *ngIf="b.kind === 'coverage'">
          <div class="cov__head"><h3 class="blk__h">{{ b.title }}</h3><span class="cov__unit">{{ b.unit }}</span></div>
          <div class="cov__row" *ngFor="let c of b.items">
            <span class="cov__label">{{ c.label }}</span>
            <span class="cov__track" role="progressbar" [attr.aria-valuenow]="c.pct" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="c.label">
              <span class="cov__fill" [ngClass]="'cov__fill--' + tone(c.pct)" [style.width.%]="c.pct"></span>
            </span>
            <span class="cov__pct">{{ c.pct }}%</span>
          </div>
        </section>

        <!-- Empty folders (chat V2, Figma 655:86495) -->
        <div class="files" *ngIf="b.kind === 'folders'">
          <div class="fc fc--folder" *ngFor="let f of b.items" role="button" tabindex="0"
               [class.fc--on]="selectedDocId === f.folder.id"
               (click)="folderOpened.emit(f.folder)" (keydown.enter)="folderOpened.emit(f.folder)">
            <div class="fc__top">
              <span class="fc__ico">
                <fvdr-file-icon type="folder-colored"></fvdr-file-icon>
                <fvdr-icon [name]="f.expected ? 'check' : 'close'" class="fc__mark"
                           [attr.title]="f.expected ? 'Standard for this room' : 'Not always needed'"></fvdr-icon>
              </span>
              <span class="fc__name" (mouseenter)="hoverDoc(f.folder, $event)" (mouseleave)="docHover.emit(null)">
                <span class="fc__idx">{{ f.folder.index }}</span>{{ f.folder.name }}
              </span>
              <span class="fc__acts">
                <button type="button" class="ib" title="Copy link" aria-label="Copy link" (click)="$event.stopPropagation()"><fvdr-icon name="copy"></fvdr-icon></button>
                <button type="button" class="ib" title="Open folder" aria-label="Open folder" (click)="$event.stopPropagation(); folderOpened.emit(f.folder)"><fvdr-icon name="share"></fvdr-icon></button>
                <button type="button" class="ib" title="More" aria-label="More" (click)="$event.stopPropagation()"><fvdr-icon name="more"></fvdr-icon></button>
              </span>
              <span class="tag tag--grey">Empty</span>
            </div>
            <p class="fc__txt fc__txt--plain"><span class="fc__lbl">What can missed:</span> {{ f.missing }}</p>
            <p class="fc__note">{{ f.note }}<button *ngIf="f.link" type="button" class="lnk"
                 (click)="$event.stopPropagation(); docOpened.emit({ doc: f.link.doc, page: f.link.page, source: linkSource(f.link.doc) })">{{ f.link.label }}</button></p>
          </div>
        </div>

        <!-- Generated report -->
        <div class="rep" *ngIf="b.kind === 'report'" role="button" tabindex="0"
             [class.fc--on]="selectedDocId === 'report'"
             (click)="reportOpened.emit()" (keydown.enter)="reportOpened.emit()">
          <fvdr-file-icon type="pdf"></fvdr-file-icon>
          <span class="rep__txt">
            <span class="rep__name">{{ b.name }}</span>
            <span class="rep__meta">{{ b.meta }}</span>
          </span>
          <span class="fc__acts">
            <button type="button" class="ib" title="Download" aria-label="Download report" (click)="$event.stopPropagation()"><fvdr-icon name="download"></fvdr-icon></button>
            <button type="button" class="ib" title="Open" aria-label="Open report" (click)="$event.stopPropagation(); reportOpened.emit()"><fvdr-icon name="share"></fvdr-icon></button>
            <button type="button" class="ib" title="More" aria-label="More" (click)="$event.stopPropagation()"><fvdr-icon name="more"></fvdr-icon></button>
          </span>
        </div>
      </ng-container>

      <!-- Footer -->
      <div class="foot" *ngIf="footer !== 'none'">
        <button type="button" class="srcs" [attr.aria-expanded]="sourcesPanel ? null : sourcesOpen"
                (click)="sourcesPanel ? sourcesRequested.emit() : (sourcesOpen = !sourcesOpen)">
          <fvdr-icon name="link"></fvdr-icon>{{ answer.sources.length }} {{ answer.sources.length === 1 ? 'source' : 'sources' }}
        </button>
        <ng-container *ngIf="footer === 'full'">
          <fvdr-ai-actions [rating]="rating" (rated)="rating = $event" (regenerated)="regenerated.emit()"></fvdr-ai-actions>
          <span class="foot__time">Now</span>
        </ng-container>
      </div>
      <ol class="srclist" *ngIf="sourcesOpen">
        <li *ngFor="let s of answer.sources">
          <button type="button" class="srclist__btn" (click)="openSource(s)">
            <span class="cite">{{ s.n }}</span>
            <fvdr-file-icon [type]="s.doc.type"></fvdr-file-icon>
            <span class="srclist__name">{{ s.doc.index }} {{ s.doc.name }}</span>
            <span class="srclist__where">{{ s.where }}</span>
          </button>
        </li>
      </ol>
    </div>

    <!-- Rich text: **bold** + [n] citations -->
    <ng-template #rich let-text>
      <ng-container *ngFor="let r of parse(text)">
        <ng-container [ngSwitch]="r.t">
          <strong *ngSwitchCase="'bold'">{{ $any(r).s }}</strong>
          <ng-container *ngSwitchCase="'cite'"><ng-container *ngTemplateOutlet="cite; context: { $implicit: $any(r).n, key: text + $any(r).n }"></ng-container></ng-container>
          <ng-container *ngSwitchDefault>{{ $any(r).s }}</ng-container>
        </ng-container>
      </ng-container>
    </ng-template>

    <ng-template #cite let-n let-key="key" let-page="page">
      <button *ngIf="n > 0" type="button" class="cite" [class.cite--hover]="pop?.key === key"
              [class.cite--active]="!!openDocId && activeKey === key"
              [attr.aria-label]="'Source ' + n"
              (mouseenter)="showPop(n, $event, key, page)" (mouseleave)="hidePop()" (focus)="showPop(n, $event, key, page)" (blur)="hidePop()"
              (click)="openSource(sourceOf(n), page, key)">{{ n }}</button>
    </ng-template>

    <!-- Citation popover -->
    <div class="pop" *ngIf="pop && pop.s" role="tooltip" [style.left.px]="pop.x" [style.top.px]="pop.y"
         (mouseenter)="keepPop()" (mouseleave)="hidePop()">
      <div class="pop__head">
        <fvdr-file-icon [type]="pop.s.doc.type"></fvdr-file-icon>
        <span class="pop__name">{{ pop.s.doc.index }} {{ pop.s.doc.name }}</span>
        <span class="tag tag--grey" *ngIf="pop.s.version">{{ pop.s.version }}</span>
        <button type="button" class="ib" title="More" aria-label="More"><fvdr-icon name="more"></fvdr-icon></button>
      </div>
      <div class="pop__excerpt">
        <p class="pop__quote" *ngIf="quoteFor(pop) as q">“{{ q }}”</p>
        <span class="pop__where">{{ whereFor(pop) }}</span>
      </div>
      <button type="button" class="pop__open" (click)="openSource(pop.s, pop.page, pop.key)">Open preview<fvdr-icon name="chevron-right"></fvdr-icon></button>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); font-size: var(--font-size-base, 14px); line-height: 20px; color: var(--color-text-primary); }
    .ans { display: flex; flex-direction: column; gap: var(--space-3); }
    .ans__lead { margin: 0; }
    strong { font-weight: var(--font-weight-semi, 600); }

    /* Figma 720:132036 — grey chip, darker on hover, amber while its passage is open in the preview */
    .cite { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; margin: 0 var(--space-1);
      padding: 0 var(--space-1); box-sizing: border-box; border: none; border-radius: var(--radius-sm); background: var(--color-stone-300);
      cursor: pointer; font-family: var(--font-family); font-size: var(--text-caption1-size, 12px); line-height: 16px;
      color: var(--color-text-secondary); vertical-align: 1px; transition: background 0.12s ease, color 0.12s ease; }
    .cite:hover, .cite--hover { background: var(--color-stone-400); color: var(--color-text-primary); }
    .cite:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .cite--active, .cite--active:hover { background: var(--ai-cite-active-bg); color: var(--ai-cite-active-text); }

    .blk { display: flex; flex-direction: column; gap: var(--space-2); }
    .blk__h { margin: 0; font-size: var(--font-size-base, 14px); line-height: 20px; font-weight: var(--font-weight-semi, 600); }

    .kt { display: flex; flex-direction: column; border: 1px solid var(--color-divider); border-radius: var(--radius-sm); overflow: hidden; }
    .kt__row { display: grid; grid-template-columns: minmax(120px, 0.8fr) minmax(200px, 2.6fr) minmax(96px, 0.6fr);
      column-gap: var(--space-4); align-items: center; min-height: 40px; padding: var(--space-2) var(--space-3); box-sizing: border-box;
      border-top: 1px solid var(--color-divider); font-size: var(--text-caption1-size, 12px); line-height: 16px; }
    .kt__row--head { border-top: none; background: var(--color-stone-200); color: var(--color-text-secondary); }
    .kt__term { font-weight: var(--font-weight-semi, 600); }
    .kt__src { display: inline-flex; align-items: center; white-space: nowrap; }
    .kt__src .cite { margin-left: 0; }

    .bul { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-1); }

    .files { display: flex; flex-direction: column; gap: var(--space-2); }
    .fc, .rep { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); cursor: pointer; transition: background 0.12s ease, border-color 0.12s ease; }
    .fc:hover, .rep:hover { background: var(--color-stone-200); }
    .fc:focus-visible, .rep:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .fc--on, .fc--on:hover { background: var(--color-primary-50); border-color: var(--color-primary-500); }
    .fc__top { display: flex; align-items: center; gap: var(--space-2); min-height: 28px; }
    .fc__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--font-weight-semi, 600); }
    .fc__idx { margin-right: var(--space-2); }
    .fc__acts { display: none; align-items: center; gap: var(--space-1); }
    .fc:hover .fc__acts, .fc:focus-within .fc__acts, .rep:hover .fc__acts, .rep:focus-within .fc__acts { display: inline-flex; }
    .fc:hover .tag, .fc:focus-within .tag { display: none; }
    .fc__txt { margin: 0; padding-left: var(--space-8); color: var(--color-text-secondary); }
    .fc--folder .fc__txt, .fc__note { padding-left: var(--space-1); }
    .fc__txt--plain { color: var(--color-text-primary); font-size: var(--text-caption1-size, 12px); line-height: 18px; }
    .fc__lbl { color: var(--color-text-secondary); }
    .fc__note { margin: var(--space-1) 0 0; padding: 0 0 0 var(--space-2); border-left: 2px solid var(--color-divider);
      font-size: var(--text-caption1-size, 12px); line-height: 18px; }
    .fc--folder .fc__note { margin-left: var(--space-1); }
    .fc__ico { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 2px; padding: 2px var(--space-1);
      border-radius: var(--radius-sm); background: var(--color-primary-50); }
    .fc__mark { font-size: var(--font-size-3xs, 10px); color: var(--color-text-secondary); }
    .lnk { padding: 0; border: none; background: transparent; cursor: pointer; font-family: var(--font-family); font-size: inherit;
      line-height: inherit; color: var(--color-primary-600); }
    .lnk:hover { text-decoration: underline; }

    .ib { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: none;
      background: transparent; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary); font-size: var(--font-size-base, 14px); }
    .ib:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    .tag { display: inline-flex; align-items: center; height: 20px; padding: 0 var(--space-2); border-radius: var(--radius-sm);
      font-size: var(--text-caption1-size, 12px); line-height: 16px; font-weight: var(--font-weight-regular, 400); white-space: nowrap; }
    .tag--green { background: var(--color-success-bg); color: var(--color-success-text); }
    .tag--yellow { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .tag--red { background: var(--color-error-bg); color: var(--color-error-text); }
    .tag--grey { background: var(--color-stone-300); color: var(--color-text-primary); }

    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-2); }
    .kpi { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .kpi__label { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .kpi__val { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xl, 20px); line-height: 28px;
      font-weight: var(--font-weight-semi, 600); }

    .cov { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .cov__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
    .cov__unit { font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .cov__row { display: grid; grid-template-columns: 120px 1fr 48px; align-items: center; gap: var(--space-4);
      font-size: var(--text-caption1-size, 12px); line-height: 16px; }
    .cov__track { height: 8px; border-radius: var(--radius-full); background: var(--color-stone-200); overflow: hidden; }
    .cov__fill { display: block; height: 100%; border-radius: inherit; transition: width 0.6s ease; }
    .cov__fill--high { background: var(--color-primary-500); }
    .cov__fill--mid { background: var(--color-primary-300); }
    .cov__fill--low { background: var(--color-warning-500); }
    .cov__fill--bad { background: var(--color-error-500); }
    .cov__pct { font-weight: var(--font-weight-semi, 600); }

    .rep { flex-direction: row; align-items: center; gap: var(--space-3); padding: var(--space-3); }
    .rep__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .rep__name { font-weight: var(--font-weight-semi, 600); }
    .rep__meta { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }

    .foot { display: flex; align-items: center; gap: var(--space-3); }
    .srcs { display: inline-flex; align-items: center; gap: var(--space-2); height: 24px; padding: 0 var(--space-2); border: none;
      border-radius: var(--radius-full); background: var(--color-stone-200); cursor: pointer; font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px); color: var(--color-text-primary); }
    .srcs:hover { background: var(--color-hover-bg); }
    .foot__time { font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }

    .srclist { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
    .srclist__btn { display: flex; align-items: center; gap: var(--space-2); width: 100%; min-height: 32px; padding: 0 var(--space-2);
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer; text-align: left;
      font-family: var(--font-family); font-size: var(--text-caption1-size, 12px); color: var(--color-text-primary); }
    .srclist__btn:hover { background: var(--color-hover-bg); }
    .srclist__btn .cite { margin: 0; }
    .srclist__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .srclist__where { color: var(--color-text-secondary); }

    .pop { position: fixed; z-index: 450; width: 360px; display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      box-sizing: border-box; background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md);
      box-shadow: var(--shadow-popup, 0 4px 16px rgba(0, 0, 0, 0.12)); }
    .pop__head { display: flex; align-items: center; gap: var(--space-2); }
    .pop__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--font-weight-semi, 600); }
    .pop__excerpt { display: flex; flex-direction: column; gap: var(--space-2); padding-left: var(--space-3); border-left: 1px solid var(--color-stone-400); }
    .pop__quote { margin: 0; line-height: 20px; }
    .pop__where { font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .pop__open { align-self: flex-start; display: inline-flex; align-items: center; gap: var(--space-1); padding: 0; border: none; background: transparent;
      cursor: pointer; font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-primary-500); }
    .pop__open:hover { color: var(--color-primary-600); }
    .pop__open:hover { text-decoration: underline; }
  `],
})
export class VdrV12AnswerComponent implements OnDestroy {
  @Input({ required: true }) answer!: V12Answer;
  @Input() selectedDocId: string | null = null;
  /** `full` — sources + copy/rate/regenerate + time (overview); `sources` — chat has its own actions. */
  @Input() footer: 'full' | 'sources' | 'none' = 'full';
  @Output() docOpened = new EventEmitter<V12DocOpen>();
  @Output() docHover = new EventEmitter<DocHoverEvent | null>();
  @Output() reportOpened = new EventEmitter<void>();
  @Output() regenerated = new EventEmitter<void>();
  /** Chat V2 — "N sources" opens the right-hand Sources panel instead of the inline list. */
  @Input() sourcesPanel = false;
  @Output() sourcesRequested = new EventEmitter<void>();
  @Output() folderOpened = new EventEmitter<MockDoc>();
  /** Id of the file open in the preview — the chip that opened it turns amber until it closes. */
  @Input() openDocId: string | null = null;
  activeKey = '';

  rating: 'up' | 'down' | null = null;
  sourcesOpen = false;
  pop: { s?: V12Source; x: number; y: number; key?: string; page?: number } | null = null;
  private popTimer?: ReturnType<typeof setTimeout>;
  private parsed = new Map<string, V12Run[]>();

  byIdx = (i: number, _b: V12Block) => i;

  ngOnDestroy(): void { clearTimeout(this.popTimer); }

  parse(text: string): V12Run[] {
    let r = this.parsed.get(text);
    if (!r) { r = runs(text); this.parsed.set(text, r); }
    return r;
  }

  sourceOf(n: number): V12Source | undefined { return this.answer.sources.find(s => s.n === n); }

  tone(pct: number): 'high' | 'mid' | 'low' | 'bad' {
    return pct >= 94 ? 'high' : pct >= 80 ? 'mid' : pct >= 55 ? 'low' : 'bad';
  }

  /** "p. 22" → 22; "sheet CoC" → undefined. */
  pageOf(loc: string): number | undefined {
    const m = /p\.\s*(\d+)/.exec(loc);
    return m ? Number(m[1]) : undefined;
  }

  showPop(n: number, ev: Event, key?: string, page?: number): void {
    clearTimeout(this.popTimer);
    const s = this.sourceOf(n);
    if (!s) return;
    const r = (ev.target as HTMLElement).getBoundingClientRect();
    const x = Math.max(8, Math.min(r.left - 16, window.innerWidth - 368));
    const below = r.bottom + 6;
    const y = below + 190 > window.innerHeight ? Math.max(8, r.top - 196) : below;
    this.popTimer = setTimeout(() => (this.pop = { s, x, y, key, page }), 120);
  }

  keepPop(): void { clearTimeout(this.popTimer); }

  hidePop(): void {
    clearTimeout(this.popTimer);
    this.popTimer = setTimeout(() => (this.pop = null), 180);
  }

  /** The passage behind a chip: its page's result if the file lists several, else the source quote. */
  quoteFor(p: { s?: V12Source; page?: number }): string {
    const r = p.s?.results?.find(x => x.page === (p.page ?? p.s?.page));
    if (r) return r.quote;
    return !p.page || p.page === p.s?.page ? p.s?.quote ?? '' : '';
  }

  whereFor(p: { s?: V12Source; page?: number }): string {
    if (!p.page || p.page === p.s?.page) return p.s?.where ?? '';
    const section = p.s?.where.split(' · ')[0];
    return section && /^Section/.test(section) ? `${section} · Page ${p.page}` : `Page ${p.page}`;
  }

  openSource(s?: V12Source, page?: number, key = ''): void {
    if (!s) return;
    this.pop = null;
    this.activeKey = key;
    // A table row may cite another page of the same source — the quote only belongs on its own page.
    const p = page ?? s.page;
    this.docOpened.emit({ doc: s.doc, page: p, source: s });
  }

  openDoc(doc: MockDoc, n: number): void {
    this.activeKey = '';
    this.docOpened.emit({ doc, page: this.sourceOf(n)?.page, source: this.sourceOf(n) });
  }

  linkSource(doc: MockDoc): V12Source | undefined { return this.answer.sources.find(s => s.doc.id === doc.id); }

  hoverDoc(doc: MockDoc, ev: MouseEvent): void {
    this.docHover.emit({ doc, rect: (ev.currentTarget as HTMLElement).getBoundingClientRect() });
  }
}
