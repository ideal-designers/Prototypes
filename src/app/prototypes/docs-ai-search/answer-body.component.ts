import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { MockAnswer, MockDoc } from './docs-ai-search.data';

export interface DocHoverEvent { doc: MockDoc; rect: DOMRect }

/**
 * Body of one AI answer — lead paragraph, cited bullet groups, optional compare cards.
 * Shared by the AI Overview card and the full-assistant transcript so an answer reads
 * the same in both places. Prototype-only composition, hence `fvdr-vdr-*`.
 */
@Component({
  selector: 'fvdr-vdr-answer-body',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="ab" [class.ab--table]="asTable">
      <p class="ab__p">
        <ng-container *ngFor="let part of boldParts(answer.intro)">
          <strong *ngIf="part.bold; else plainTxt">{{ part.text }}</strong>
          <ng-template #plainTxt>{{ part.text }}</ng-template>
        </ng-container>
      </p>

      <!-- List form: heading + bullets, a citation chip leading each bullet -->
      <ng-container *ngIf="!asTable">
        <section class="ab__group" *ngFor="let g of answer.groups">
          <h3 class="ab__h" *ngIf="g.title">{{ g.title }}</h3>
          <ul class="ab__list">
            <li *ngFor="let it of g.items">
              <span class="ab__cite"
                    (mouseenter)="onHover(it.doc, $event)" (mouseleave)="docHover.emit(null)">
                <fvdr-ai-citation variant="chip"
                  [label]="it.doc.index + ' ' + it.doc.name" [page]="it.page"
                  [fileType]="it.doc.type" [highlight]="answer.keyword || ''"
                  (opened)="docOpened.emit(it.doc)"></fvdr-ai-citation>
              </span>
              <span class="ab__dash">–</span>
              <ng-container *ngFor="let part of marked(it.text)">
                <mark *ngIf="part.hit; else plainItem" class="ab__mark">{{ part.text }}</mark>
                <ng-template #plainItem>{{ part.text }}</ng-template>
              </ng-container>
            </li>
          </ul>
        </section>
      </ng-container>

      <!-- Table form (V2 "Table view"): one row per cited document -->
      <div class="ab__table" *ngIf="asTable" role="table">
        <div class="ab__tr ab__tr--head" role="row">
          <span role="columnheader">Index</span><span role="columnheader">Name</span>
          <span role="columnheader">Location</span><span role="columnheader">Overview</span>
        </div>
        <ng-container *ngFor="let g of answer.groups">
          <div class="ab__tr" role="row" *ngFor="let it of g.items" (click)="docOpened.emit(it.doc)">
            <span class="ab__idx" role="cell"><fvdr-file-icon [type]="it.doc.type"></fvdr-file-icon>{{ it.doc.index }}</span>
            <span class="ab__name" role="cell"
                  (mouseenter)="onHover(it.doc, $event)" (mouseleave)="docHover.emit(null)">
              <ng-container *ngFor="let part of marked(it.doc.name)">
                <mark *ngIf="part.hit; else plainName" class="ab__mark">{{ part.text }}</mark>
                <ng-template #plainName>{{ part.text }}</ng-template>
              </ng-container>
            </span>
            <span class="ab__loc" role="cell"><fvdr-icon name="folder"></fvdr-icon>{{ it.doc.location || '—' }}</span>
            <span role="cell">
              <ng-container *ngFor="let part of marked(it.text)">
                <mark *ngIf="part.hit; else plainOv" class="ab__mark">{{ part.text }}</mark>
                <ng-template #plainOv>{{ part.text }}</ng-template>
              </ng-container>
            </span>
          </div>
        </ng-container>
      </div>

      <div class="ab__compare" *ngIf="answer.compare?.length">
        <article class="ab__card" *ngFor="let c of answer.compare">
          <button type="button" class="ab__card-head" (click)="docOpened.emit(c.doc)"
                  (mouseenter)="onHover(c.doc, $event)" (mouseleave)="docHover.emit(null)">
            <fvdr-file-icon [type]="c.doc.type"></fvdr-file-icon>
            <span class="ab__card-name">{{ c.doc.index }} {{ c.doc.name }}</span>
          </button>
          <div class="ab__card-meta">
            <fvdr-icon name="folder"></fvdr-icon>{{ c.doc.location }} · {{ c.doc.size }} · {{ c.doc.pages }} pages
          </div>
          <p class="ab__quote">{{ c.quote }}</p>
          <div class="ab__tags"><span class="ab__tag" *ngFor="let t of c.tags">{{ t }}</span></div>
        </article>
      </div>

      <p class="ab__p" *ngIf="answer.outro">{{ answer.outro }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }
    .ab { display: flex; flex-direction: column; gap: var(--space-3);
      font-size: var(--font-size-base, 14px); line-height: 20px; color: var(--color-text-primary); }
    .ab__p { margin: 0; }
    .ab__group { display: flex; flex-direction: column; gap: var(--space-3); }
    .ab__h { margin: 0; font-size: var(--font-size-base, 14px); line-height: 20px; font-weight: var(--font-weight-semi, 600); }
    .ab__list { margin: 0; padding-left: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .ab__list li { line-height: 24px; }
    .ab__cite { display: inline-flex; vertical-align: middle; max-width: 100%; }
    .ab__dash { margin: 0 var(--space-2); }
    .ab__mark { background: var(--color-highlight-mark, #FFDA07); color: inherit; padding: 0; }

    .ab__table { border: 1px solid var(--color-stone-300); border-radius: var(--radius-sm); overflow: hidden; }
    .ab__tr { display: grid; grid-template-columns: 88px minmax(160px, 1.2fr) minmax(120px, 0.8fr) minmax(200px, 1.6fr);
      gap: var(--space-4); align-items: start; padding: var(--space-3) var(--space-4); cursor: pointer; }
    .ab__tr:nth-child(odd):not(.ab__tr--head) { background: var(--color-stone-100); }
    .ab__tr:not(.ab__tr--head):hover { background: var(--color-hover-bg); }
    .ab__tr--head { cursor: default; background: var(--color-stone-200); font-weight: var(--font-weight-semi, 600); }
    .ab__idx, .ab__loc { display: inline-flex; align-items: center; gap: var(--space-2); }
    .ab__loc fvdr-icon { color: var(--color-text-secondary); }
    .ab__name { min-width: 0; }

    .ab__compare { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
    .ab__card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm); }
    .ab__card-head { display: inline-flex; align-items: center; gap: var(--space-2); padding: 0; border: none;
      background: transparent; cursor: pointer; font-family: var(--font-family); text-align: left;
      font-size: var(--font-size-base, 14px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-primary); }
    .ab__card-head:hover .ab__card-name { text-decoration: underline; }
    .ab__card-meta { display: inline-flex; align-items: center; gap: var(--space-1);
      font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .ab__quote { margin: var(--space-2) 0 0; }
    .ab__tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .ab__tag { padding: 2px var(--space-2); border-radius: var(--radius-sm); background: var(--chip-bg-yellow);
      font-size: var(--text-caption1-size, 12px); line-height: 16px; }
  `],
})
export class VdrAnswerBodyComponent {
  @Input({ required: true }) answer!: MockAnswer;
  /** V2 "Table view" — one row per cited document instead of bullets. */
  @Input() asTable = false;

  @Output() docOpened = new EventEmitter<MockDoc>();
  @Output() docHover = new EventEmitter<DocHoverEvent | null>();

  onHover(doc: MockDoc, e: MouseEvent): void {
    this.docHover.emit({ doc, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  }

  boldParts(text: string): { text: string; bold: boolean }[] {
    return text.split('**').map((t, i) => ({ text: t, bold: i % 2 === 1 })).filter(p => p.text);
  }

  marked(text: string): { text: string; hit: boolean }[] {
    const q = this.answer.keyword?.trim();
    if (!q) return [{ text, hit: false }];
    return text.split(new RegExp(`(${q})`, 'ig')).filter(Boolean)
      .map(t => ({ text: t, hit: t.toLowerCase() === q.toLowerCase() }));
  }
}
