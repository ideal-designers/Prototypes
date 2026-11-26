import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { FileIconComponent } from '../../file-icon/file-icon.component';
import { SearchComponent } from '../../search/search.component';
import { ButtonComponent } from '../../button/button.component';
import { BadgeComponent } from '../../badge/badge.component';
import { TabsComponent, TabItem } from '../../tabs/tabs.component';
import { DrawerComponent, DrawerMode } from '../../drawer/drawer.component';
import { AiDocRef, AiSourceCitation, AiSourceFolder, AiSourceQuestion } from '../ai.models';

export type AiSourcesView = 'file' | 'question';

/**
 * Sources panel — Figma AI-Assistant "Chat · 1.1 · Sources": By file (2739:61739) and By question (2739:62334).
 *
 * Every citation in the chat, in a drawer next to the conversation.
 *   By file     — grouped by folder; each file lists the citation numbers it backs
 *   By question — grouped by the question asked; a citation opens its quoted passage
 * Footer: export the list, or turn the cited files into the chat scope.
 */
@Component({
  selector: 'fvdr-ai-sources-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, FvdrIconComponent, FileIconComponent, SearchComponent, ButtonComponent, BadgeComponent, TabsComponent, DrawerComponent],
  template: `
    <fvdr-drawer [mode]="mode" [open]="open" ariaLabel="Sources" (closed)="closed.emit()">
      <span drawer-header class="srcp-title">Sources <span class="srcp-total">{{ total }}</span></span>

      <div class="srcp">
        <fvdr-tabs class="srcp-tabs" size="s" [tabs]="tabs" [activeId]="view" (tabChange)="setView($event)"></fvdr-tabs>
        <div class="srcp-search"><fvdr-search size="m" placeholder="Search in sources" [(ngModel)]="query"></fvdr-search></div>

        <div class="srcp-meta">
          <span>{{ metaLine }}</span>
          <button type="button" class="srcp-link" (click)="toggleAll()">{{ allCollapsed ? 'Expand all' : 'Collapse all' }}</button>
        </div>

        <!-- By file -->
        <ng-container *ngIf="view === 'file'">
          <section *ngFor="let f of filteredFolders">
            <button type="button" class="srcp-group" [attr.aria-expanded]="!isCollapsed(f.name)" (click)="toggleGroup(f.name)">
              <fvdr-icon [name]="isCollapsed(f.name) ? 'chevron-right' : 'chevron-down'" class="srcp-caret"></fvdr-icon>
              <fvdr-file-icon type="folder"></fvdr-file-icon>
              <span class="srcp-group__name">{{ f.name }}</span>
              <span class="srcp-group__count">{{ f.files.length }}</span>
            </button>
            <ng-container *ngIf="!isCollapsed(f.name)">
              <div class="srcp-row" *ngFor="let file of f.files">
                <fvdr-file-icon [type]="file.doc.type"></fvdr-file-icon>
                <button type="button" class="srcp-row__text" (click)="docOpened.emit(file.doc)">
                  <span class="srcp-row__name">{{ file.doc.name }}</span>
                  <span class="srcp-row__loc" *ngIf="file.locator">{{ file.locator }}</span>
                </button>
                <fvdr-badge *ngIf="file.version" [label]="file.version" variant="blue" size="xs" [rounded]="true"></fvdr-badge>
                <span class="srcp-cites"><span class="srcp-cite" *ngFor="let n of file.citations">{{ n }}</span></span>
                <fvdr-btn variant="ghost" size="s" iconName="more" [iconOnly]="true" ariaLabel="More actions" (clicked)="moreClicked.emit(file.doc)"></fvdr-btn>
              </div>
            </ng-container>
          </section>
        </ng-container>

        <!-- By question -->
        <ng-container *ngIf="view === 'question'">
          <section *ngFor="let q of filteredQuestions">
            <button type="button" class="srcp-q" [attr.aria-expanded]="!isCollapsed(q.question)" (click)="toggleGroup(q.question)">
              <fvdr-icon [name]="isCollapsed(q.question) ? 'chevron-right' : 'chevron-down'" class="srcp-caret"></fvdr-icon>
              <span class="srcp-q__text">
                <span class="srcp-q__title" [attr.title]="q.question">{{ q.question }}</span>
                <span class="srcp-q__count">{{ q.citations.length }} {{ q.citations.length === 1 ? 'source' : 'sources' }}</span>
              </span>
            </button>
            <ng-container *ngIf="!isCollapsed(q.question)">
              <ng-container *ngFor="let c of q.citations">
                <div class="srcp-row srcp-row--q" [class.srcp-row--active]="activeCitation === c">
                  <button type="button" class="srcp-cite srcp-cite--btn" [class.srcp-cite--on]="activeCitation === c"
                          [attr.aria-label]="'Show citation ' + c.n" (click)="activeCitation = activeCitation === c ? null : c">{{ c.n }}</button>
                  <fvdr-file-icon [type]="c.doc.type"></fvdr-file-icon>
                  <button type="button" class="srcp-row__text" (click)="activeCitation = activeCitation === c ? null : c">
                    <span class="srcp-row__name">{{ c.doc.name }}</span>
                    <span class="srcp-row__loc" *ngIf="c.locator">{{ c.locator }}</span>
                  </button>
                  <fvdr-btn variant="ghost" size="s" iconName="more" [iconOnly]="true" ariaLabel="More actions" (clicked)="moreClicked.emit(c.doc)"></fvdr-btn>
                </div>
                <div class="srcp-quote" *ngIf="activeCitation === c && c.quote">
                  <p class="srcp-quote__text">“{{ c.quote }}”</p>
                  <button type="button" class="srcp-link srcp-link--icon" (click)="docOpened.emit(c.doc)">
                    <fvdr-icon name="link"></fvdr-icon> Open in Documents
                  </button>
                </div>
              </ng-container>
            </ng-container>
          </section>
        </ng-container>

        <p class="srcp-empty" *ngIf="isEmpty">No sources match “{{ query }}”.</p>
      </div>

      <fvdr-btn drawer-footer label="Export list" variant="secondary" size="m" iconName="download" (clicked)="exportRequested.emit()"></fvdr-btn>
      <fvdr-btn drawer-footer label="Use as chat scope" variant="secondary" size="m" iconName="folder" (clicked)="useAsScope.emit()"></fvdr-btn>
    </fvdr-drawer>
  `,
  styles: [`
    :host { display: contents; font-family: var(--font-family); }

    .srcp-title { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-label-l-size); line-height: var(--text-label-l-lh); font-weight: var(--text-label-l-weight); }
    .srcp-total {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: var(--space-5); height: var(--space-5); padding: 0 var(--space-1); box-sizing: border-box;
      border-radius: var(--radius-full); background: var(--color-stone-300);
      font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); font-weight: var(--text-body3-weight);
      color: var(--color-text-secondary);
    }

    /* Full-bleed inside the drawer body (which has 24 padding) */
    .srcp { margin: calc(var(--space-6) * -1); display: flex; flex-direction: column; }
    .srcp-tabs { display: block; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .srcp-search { padding: var(--space-4) var(--space-6) var(--space-3); }
    .srcp-meta {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6) var(--space-2);
      font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary);
    }
    .srcp-link {
      display: inline-flex; align-items: center; gap: var(--space-1);
      border: none; background: transparent; padding: 0; cursor: pointer;
      font-family: var(--font-family); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh);
      color: var(--color-primary-500);
    }
    .srcp-link:hover { color: var(--color-primary-600); text-decoration: underline; }
    .srcp-link--icon { font-size: var(--text-body3-size); }

    .srcp-caret { flex: none; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }

    .srcp-group {
      display: flex; align-items: center; gap: var(--space-2); width: 100%;
      height: var(--space-8); padding: 0 var(--space-6); box-sizing: border-box;
      border: none; background: var(--color-stone-200); cursor: pointer; text-align: left;
      font-family: var(--font-family);
    }
    .srcp-group__name { flex: 1; font-size: var(--text-label-s-size); line-height: var(--text-label-s-lh); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .srcp-group__count { font-size: var(--text-caption1-size); color: var(--color-text-placeholder); }

    .srcp-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-4) var(--space-2) var(--space-6);
    }
    .srcp-row--q { padding-left: var(--space-6); }
    .srcp-row--active { background: var(--color-stone-100); }
    .srcp-row__text {
      flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start;
      border: none; background: transparent; padding: 0; cursor: pointer; text-align: left;
      font-family: var(--font-family);
    }
    .srcp-row__name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-primary); }
    .srcp-row__text:hover .srcp-row__name { color: var(--color-primary-600); }
    .srcp-row__loc { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }

    .srcp-cites { display: inline-flex; gap: var(--space-1); flex: none; }
    .srcp-cite {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: var(--space-5); height: var(--space-5); padding: 0 var(--space-1); box-sizing: border-box;
      border-radius: var(--radius-sm); background: var(--color-stone-300);
      font-family: var(--font-family); font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh);
      color: var(--color-text-primary);
    }
    .srcp-cite--btn { border: none; cursor: pointer; flex: none; }
    .srcp-cite--on { background: var(--color-primary-500); color: var(--badge-fg-on-bold); }

    .srcp-q {
      display: flex; align-items: flex-start; gap: var(--space-2); width: 100%;
      padding: var(--space-2) var(--space-6); box-sizing: border-box;
      border: none; background: transparent; cursor: pointer; text-align: left; font-family: var(--font-family);
    }
    .srcp-q .srcp-caret { margin-top: var(--space-1); }
    .srcp-q__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .srcp-q__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-label-s-size); line-height: var(--text-label-s-lh); font-weight: var(--text-label-s-weight); color: var(--color-text-primary); }
    .srcp-q__count { font-size: var(--text-caption1-size); line-height: var(--text-caption1-lh); color: var(--color-text-secondary); }

    .srcp-quote {
      margin: 0 var(--space-4) var(--space-2) var(--space-6);
      padding: var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .srcp-quote__text { margin: 0; font-size: var(--text-body3-size); line-height: var(--text-body3-lh); color: var(--color-text-primary); }

    .srcp-empty { margin: 0; padding: var(--space-4) var(--space-6); font-size: var(--text-body3-size); color: var(--color-text-secondary); }
  `],
})
export class AiSourcesPanelComponent {
  @Input() folders: AiSourceFolder[] = [];
  @Input() questions: AiSourceQuestion[] = [];
  @Input() view: AiSourcesView = 'file';
  @Input() open = true;
  @Input() mode: DrawerMode = 'auto';

  @Output() viewChange = new EventEmitter<AiSourcesView>();
  @Output() closed = new EventEmitter<void>();
  @Output() docOpened = new EventEmitter<AiDocRef>();
  @Output() moreClicked = new EventEmitter<AiDocRef>();
  @Output() exportRequested = new EventEmitter<void>();
  @Output() useAsScope = new EventEmitter<void>();

  readonly tabs: TabItem[] = [{ id: 'file', label: 'By file' }, { id: 'question', label: 'By question' }];
  query = '';
  activeCitation: AiSourceCitation | null = null;
  private collapsed = new Set<string>();

  get total(): number {
    return this.folders.reduce((a, f) => a + f.files.reduce((b, x) => b + x.citations.length, 0), 0)
      || this.questions.reduce((a, q) => a + q.citations.length, 0);
  }
  get fileCount(): number { return this.folders.reduce((a, f) => a + f.files.length, 0); }

  get metaLine(): string {
    return this.view === 'file'
      ? `${this.total} citations from ${this.fileCount} files`
      : `${this.questions.length} questions · ${this.total} citations`;
  }

  setView(id: string): void {
    this.view = id as AiSourcesView;
    this.viewChange.emit(this.view);
  }

  private get groupKeys(): string[] {
    return this.view === 'file' ? this.folders.map(f => f.name) : this.questions.map(q => q.question);
  }
  get allCollapsed(): boolean { return this.groupKeys.every(k => this.collapsed.has(k)); }
  toggleAll(): void {
    const collapse = !this.allCollapsed;
    this.groupKeys.forEach(k => collapse ? this.collapsed.add(k) : this.collapsed.delete(k));
  }
  isCollapsed(k: string): boolean { return this.collapsed.has(k); }
  toggleGroup(k: string): void { this.collapsed.has(k) ? this.collapsed.delete(k) : this.collapsed.add(k); }

  private match(doc: AiDocRef): boolean {
    const q = this.query.trim().toLowerCase();
    return !q || doc.name.toLowerCase().includes(q);
  }
  // Memoised on (query, input refs) so *ngFor gets a stable array between change-detection passes.
  private cache: { key: string; f: AiSourceFolder[]; q: AiSourceQuestion[]; folders?: AiSourceFolder[]; questions?: AiSourceQuestion[] } = { key: '\u0000', f: [], q: [] };
  private filtered(): { f: AiSourceFolder[]; q: AiSourceQuestion[] } {
    const key = this.query.trim().toLowerCase();
    const c = this.cache;
    if (c.key === key && c.folders === this.folders && c.questions === this.questions) return c;
    const f = !key ? this.folders
      : this.folders.map(x => ({ ...x, files: x.files.filter(y => this.match(y.doc)) })).filter(x => x.files.length);
    const q = !key ? this.questions
      : this.questions.map(x => x.question.toLowerCase().includes(key) ? x : { ...x, citations: x.citations.filter(y => this.match(y.doc)) })
          .filter(x => x.citations.length);
    this.cache = { key, f, q, folders: this.folders, questions: this.questions };
    return this.cache;
  }
  get filteredFolders(): AiSourceFolder[] { return this.filtered().f; }
  get filteredQuestions(): AiSourceQuestion[] { return this.filtered().q; }
  get isEmpty(): boolean {
    return this.view === 'file' ? !this.filteredFolders.length : !this.filteredQuestions.length;
  }
}
