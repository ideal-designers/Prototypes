import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { BrTagInputComponent } from './br-tag-input.component';
import { BrStore } from './br-store.service';
import { PII_ICON_SVG } from './br-icons';
import { PII_CATEGORIES, PiiCategory, RuleSet, RuleTemplate, cloneRules, emptyRules, sameRules, CATEGORY_LABEL } from './bulk-redaction.data';

/**
 * The redaction rule editor — Figma "Bulk redaction / Concept 2" modal frames.
 * Used by "Add redaction rules" (concept 1), "Redact N items" (concept 2) and the viewer's
 * "Redaction templates" tool, so PII categories (incl. Signatures), exceptions, custom terms
 * and templates are identical everywhere. `picker` is the only thing that differs: template cards
 * on a page, a dropdown in a modal — in the dropdown, rename / delete live on the row itself.
 */
@Component({
  selector: 'fvdr-br-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, BrTagInputComponent],
  template: `
    <!-- Template picker: cards (page) -->
    <div class="cards" *ngIf="picker === 'cards'">
      <button type="button" class="card" [class.card--on]="!templateId" (click)="pick(null)">
        <span class="card__plus"><fvdr-icon name="plus"></fvdr-icon></span>
        <span class="card__txt"><b>Start from scratch</b><small>Configure rules manually</small></span>
        <fvdr-icon *ngIf="!templateId" name="check" class="card__check"></fvdr-icon>
      </button>
      <button type="button" class="card card--tpl" *ngFor="let t of store.templates" [class.card--on]="t.id === templateId"
              (click)="pick(t.id)">
        <span class="card__head">
          <b *ngIf="renamingId !== t.id">{{ t.name }}</b>
          <input *ngIf="renamingId === t.id" class="rin" [(ngModel)]="renameValue" (click)="$event.stopPropagation()"
                 (keydown.enter)="commitRename(t)" (keydown.escape)="renamingId = null" (blur)="commitRename(t)" aria-label="Template name" />
          <span class="card__tools" *ngIf="renamingId !== t.id">
            <span class="card__hov">
              <span class="card__act" role="button" tabindex="0" fvdrTooltip="Rename" (click)="startRename(t, $event)"><fvdr-icon name="edit"></fvdr-icon></span>
              <span class="card__act card__act--del" role="button" tabindex="0" fvdrTooltip="Delete" (click)="removeClick(t, $event)"><fvdr-icon name="trash"></fvdr-icon></span>
            </span>
            <span *ngIf="t.id === templateId && modified" class="card__act" role="button" tabindex="0"
                  fvdrTooltip="Reset to default" (click)="$event.stopPropagation(); reset()"
                  (keydown.enter)="$event.stopPropagation(); reset()"><fvdr-icon name="refresh"></fvdr-icon></span>
            <fvdr-icon *ngIf="t.id === templateId" name="check" class="card__check"></fvdr-icon>
          </span>
        </span>
        <span class="card__chips">
          <fvdr-chip *ngFor="let c of summary(t)" [label]="c" variant="indigo" size="xs"></fvdr-chip>
        </span>
      </button>
    </div>

    <!-- Template picker: dropdown (modal). Naming a new template happens in the footer, so there is never a second modal -->
    <div class="tpl" *ngIf="picker === 'dropdown' && store.templates.length" (click)="$event.stopPropagation()">
      <label class="tpl__label" *ngIf="label">{{ label }}</label>
      <button type="button" class="tpl__btn" [class.tpl__btn--open]="open" aria-haspopup="listbox" [attr.aria-expanded]="open"
              (click)="open = !open">
        <span class="tpl__val">{{ selectedTemplate?.name || 'From scratch' }}</span>
        <span class="tpl__end">
          <span *ngIf="modified" class="tpl__reset" role="button" tabindex="0" fvdrTooltip="Reset to default" tooltipPosition="bottom"
                (click)="$event.stopPropagation(); reset()" (keydown.enter)="$event.stopPropagation(); reset()"><fvdr-icon name="refresh"></fvdr-icon></span>
          <fvdr-icon name="chevron-down"></fvdr-icon>
        </span>
      </button>
      <div class="tpl__panel" *ngIf="open" role="listbox">
        <div class="tpl__opt" [class.tpl__opt--on]="!templateId" role="option" tabindex="0"
             (click)="pick(null); open = false" (keydown.enter)="pick(null); open = false">From scratch</div>
        <div class="tpl__opt" *ngFor="let t of store.templates" [class.tpl__opt--on]="t.id === templateId" role="option"
             tabindex="0" (click)="selectTemplate(t.id)">
          <span class="tpl__oname" *ngIf="renamingId !== t.id">{{ t.name }}</span>
          <span class="tpl__acts" *ngIf="renamingId !== t.id">
            <button type="button" class="tpl__act" fvdrTooltip="Rename" (click)="startRename(t, $event)"><fvdr-icon name="edit"></fvdr-icon></button>
            <button type="button" class="tpl__act tpl__act--del" fvdrTooltip="Delete" (click)="removeClick(t, $event)"><fvdr-icon name="trash"></fvdr-icon></button>
          </span>
          <input *ngIf="renamingId === t.id" class="rin" [(ngModel)]="renameValue" (click)="$event.stopPropagation()"
                 (keydown.enter)="commitRename(t)" (keydown.escape)="renamingId = null" (blur)="commitRename(t)" aria-label="Template name" />
        </div>
      </div>
    </div>

    <!-- PII categories (#2 — signatures are a category of their own) -->
    <section class="sec">
      <h3 class="sec__title">PII categories</h3>
      <p class="sec__hint">Select the types of information to detect and mark for redaction</p>
      <div class="pii">
        <fvdr-filter-btn label="All" [size]="chipSize" [showIcon]="false" [selected]="allOn" (clicked)="toggleAll()"></fvdr-filter-btn>
        <fvdr-filter-btn *ngFor="let c of cats" [label]="c.label" [size]="chipSize" [icon]="svg[c.id] ? undefined : c.icon" [iconHtml]="svg[c.id] || null"
                         [selected]="rules.categories.includes(c.id)" (clicked)="toggleCat(c.id)"></fvdr-filter-btn>
      </div>
    </section>

    <!-- Exceptions (#4) -->
    <section class="sec sec--tight">
      <fvdr-checkbox label="Add exceptions" [checked]="exceptionsOn" (checkedChange)="toggleExceptions($event)"></fvdr-checkbox>
      <ng-container *ngIf="exceptionsOn">
        <fvdr-br-tag-input class="exc" [items]="rules.doNotRedact" ariaLabel="Exceptions" placeholder="Add term"
                           (itemsChange)="set('doNotRedact', $event)"></fvdr-br-tag-input>
        <fvdr-inline-message class="note" variant="info" size="s" text="Exceptions apply only to new finds. All existing marks remain."></fvdr-inline-message>
      </ng-container>
    </section>

    <!-- Custom terms (#3) -->
    <section class="sec">
      <h3 class="sec__title">Custom terms</h3>
      <p class="sec__hint">Add words or phrases to detect and mark for redaction</p>
      <fvdr-br-tag-input [items]="rules.keywords" ariaLabel="Custom terms" placeholder="Add term"
                         (itemsChange)="set('keywords', $event)"></fvdr-br-tag-input>
    </section>

    <!-- Concept 1 only: a modal over a page, never a modal over a modal -->
    <fvdr-modal *ngIf="saveMode === 'modal'" [visible]="saveOpen" title="Save as template" size="m" (closed)="saveOpen = false">
      <fvdr-input placeholder="Enter template name" [(ngModel)]="saveName" (keydown.enter)="doSave()"></fvdr-input>
      <div class="dlg-foot">
        <fvdr-btn label="Cancel" variant="secondary" (clicked)="saveOpen = false"></fvdr-btn>
        <fvdr-btn label="Save" variant="primary" [disabled]="!saveName.trim()" (clicked)="doSave()"></fvdr-btn>
      </div>
    </fvdr-modal>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); color: var(--color-text-primary); }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6); }
    .card { position: relative; display: flex; flex-direction: column; gap: var(--space-2); text-align: left; min-height: 88px;
      padding: var(--space-4); background: var(--color-stone-0); border: 1px solid var(--color-divider);
      border-radius: var(--radius-md); cursor: pointer; font-family: inherit; color: inherit; }
    .card:hover { border-color: var(--color-stone-500); }
    .card--on { border-color: var(--color-primary-500); box-shadow: inset 0 0 0 1px var(--color-primary-500); }
    .card:first-child { flex-direction: row; align-items: center; gap: var(--space-3); border-style: dashed; }
    .card__plus { color: var(--color-text-secondary); font-size: var(--font-size-xl); }
    .card__txt { display: flex; flex-direction: column; gap: 2px; }
    .card__txt b, .card__head b { font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .card__txt small { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .card__tools { display: inline-flex; align-items: center; gap: var(--space-2); }
    .card__check { color: var(--color-primary-500); }
    .card__hov { display: none; align-items: center; gap: 2px; }
    .card:hover .card__hov { display: inline-flex; }
    .card__act { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary); }
    .card__act:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .card__act--del { color: var(--color-error-600); }
    .card:first-child .card__check { position: absolute; top: var(--space-3); right: var(--space-3); }
    .card__chips { display: flex; flex-wrap: wrap; gap: var(--space-1); pointer-events: none; }
    .rin { flex: 1; min-width: 0; height: 28px; padding: 0 var(--space-2); border: 1px solid var(--color-primary-500); border-radius: var(--radius-sm); outline: none;
      font-family: inherit; font-size: var(--font-size-base); color: var(--color-text-primary); background: var(--color-stone-0); }

    /* Template dropdown — 40px field, 40px rows */
    .tpl { position: relative; margin-bottom: var(--space-5); }
    .tpl__label { display: block; margin-bottom: var(--space-1); font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .tpl__btn { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); width: 100%; height: 40px;
      padding: 0 var(--space-3); background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-sm);
      cursor: pointer; font-family: inherit; font-size: var(--font-size-base); color: var(--color-text-primary); }
    .tpl__btn:hover { border-color: var(--color-stone-500); }
    .tpl__btn--open { border-color: var(--color-primary-500); }
    .tpl__end { display: inline-flex; align-items: center; gap: var(--space-3); color: var(--color-text-secondary); }
    .tpl__reset { display: inline-flex; cursor: pointer; border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .tpl__reset:hover { color: var(--color-text-primary); }
    .tpl__panel { position: absolute; top: calc(100% + 1px); left: 0; right: 0; z-index: 20; padding: 0;
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-sm); box-shadow: var(--shadow-popup);
      max-height: 280px; overflow-y: auto; }
    .tpl__opt { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); min-height: 40px;
      padding: 0 var(--space-3); cursor: pointer; font-size: var(--font-size-base); color: var(--color-text-primary); }
    .tpl__opt:hover { background: var(--color-stone-200); }
    .tpl__opt--on { background: var(--color-selected-row); }
    .tpl__oname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tpl__acts { display: none; align-items: center; gap: var(--space-1); }
    .tpl__opt:hover .tpl__acts { display: inline-flex; }
    .tpl__act { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: none; background: transparent;
      cursor: pointer; border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .tpl__act:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .tpl__act--del { color: var(--color-error-600); }

    .sec { margin-bottom: var(--space-6); }
    .sec--tight { margin-bottom: var(--space-5); }
    .sec__title { margin: 0 0 var(--space-1); font-size: var(--font-size-base); font-weight: var(--font-weight-semi); }
    .sec__hint { margin: 0 0 var(--space-3); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .exc { display: block; margin-top: var(--space-3); }
    .note { display: block; margin-top: var(--space-3); }
    .note ::ng-deep .im { display: flex; width: 100%; }
    .pii { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .dlg-foot { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-5); }
    @media (max-width: 1200px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  `],
})
export class BrRulesComponent {
  store = inject(BrStore);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  @Input() rules: RuleSet = emptyRules();
  @Output() rulesChange = new EventEmitter<RuleSet>();
  @Input() templateId: string | null = null;
  @Output() templateIdChange = new EventEmitter<string | null>();
  @Input() picker: 'cards' | 'dropdown' | 'none' = 'cards';
  /** PII buttons: S (32px) in modals, M (40px) on the concept-1 page. */
  @Input() chipSize: 'S' | 'M' = 'S';
  /** Optional caption above the template dropdown (the concept-1 page labels it "Templates"). */
  @Input() label = '';
  /** Where "Save as template" asks for a name: inline in the host's footer (inside a modal) or in its own modal (on a page). */
  @Input() saveMode: 'inline' | 'modal' = 'inline';
  @Output() namingChange = new EventEmitter<boolean>();
  /** Fires when a template is saved/updated so a host can react (e.g. re-render a footer). */
  @Output() templatesChanged = new EventEmitter<void>();

  readonly cats = PII_CATEGORIES;
  readonly svg: Record<string, SafeHtml> = Object.fromEntries(
    Object.entries(PII_ICON_SVG).map(([k, v]) => [k, this.sanitizer.bypassSecurityTrustHtml(v)]));
  saveOpen = false;
  /** Dropdown variant: the host swaps its footer for a name field while this is true. */
  naming = false;
  saveName = '';
  open = false;
  renamingId: string | null = null;
  renameValue = '';
  private exceptionsChecked = false;

  @HostListener('document:click') closePanel(): void { this.open = false; }

  get allOn(): boolean { return this.rules.categories.length === this.cats.length; }
  get selectedTemplate(): RuleTemplate | undefined { return this.store.template(this.templateId); }
  /** Rules differ from the template they were loaded from → Update / Reset appear (Figma "Template changed"). */
  get modified(): boolean {
    const t = this.selectedTemplate;
    return !!t && !sameRules(this.rules, t);
  }
  /** Exceptions are shown once the checkbox is ticked, or when a template brings its own. */
  get exceptionsOn(): boolean { return this.exceptionsChecked || this.rules.doNotRedact.length > 0; }
  toggleExceptions(on: boolean): void {
    this.exceptionsChecked = on;
    if (!on) this.set('doNotRedact', []);
  }

  summary(t: RuleTemplate): string[] {
    const labels = t.categories.map(c => CATEGORY_LABEL[c]);
    const out = labels.slice(0, 3);
    if (labels.length > 3) out.push(`+${labels.length - 3}`);
    if (t.keywords.length) out.push(`${t.keywords.length} term${t.keywords.length === 1 ? '' : 's'}`);
    if (t.doNotRedact.length) out.push(`${t.doNotRedact.length} excluded`);
    return out;
  }

  selectTemplate(id: string): void {
    if (this.renamingId === id) return;
    this.pick(id);
    this.open = false;
  }

  pick(id: string | null): void {
    this.templateId = id;
    this.templateIdChange.emit(id);
    const t = this.store.template(id);
    this.emit(t ? cloneRules(t) : emptyRules());
  }

  reset(): void {
    const t = this.selectedTemplate;
    this.emit(t ? cloneRules(t) : emptyRules());
  }

  toggleAll(): void { this.emit({ ...this.rules, categories: this.allOn ? [] : this.cats.map(c => c.id) }); }
  toggleCat(id: PiiCategory): void {
    const has = this.rules.categories.includes(id);
    this.emit({ ...this.rules, categories: has ? this.rules.categories.filter(c => c !== id) : [...this.rules.categories, id] });
  }
  set(key: 'keywords' | 'doNotRedact', v: string[]): void { this.emit({ ...this.rules, [key]: v }); }

  // ── Templates (PRD #5, #6) ─────────────────────────────────────────────
  openSave(): void {
    this.saveName = '';
    if (this.saveMode === 'inline') this.setNaming(true); else this.saveOpen = true;
  }
  setNaming(v: boolean): void { this.naming = v; this.namingChange.emit(v); }
  doSave(): void {
    const name = this.saveName.trim();
    if (!name) return;
    const t = this.store.saveTemplate(name, this.rules);
    this.saveOpen = false;
    this.setNaming(false);
    this.templateId = t.id;
    this.templateIdChange.emit(t.id);
    this.templatesChanged.emit();
    this.toast.show({ variant: 'success', message: 'Template saved', duration: 5000 });
  }
  updateTemplate(): void {
    if (!this.templateId) return;
    this.store.updateTemplate(this.templateId, this.rules);
    this.templatesChanged.emit();
    this.toast.show({ variant: 'success', message: 'Template updated', duration: 5000 });
  }

  // Rename / delete live on the template row itself (hover), in the dropdown and on the cards
  startRename(t: RuleTemplate, e: Event): void { e.stopPropagation(); this.renamingId = t.id; this.renameValue = t.name; }
  commitRename(t: RuleTemplate): void {
    if (this.renamingId !== t.id) return;
    const name = this.renameValue.trim();
    this.renamingId = null;
    if (!name || name === t.name) return;
    this.store.renameTemplate(t.id, name);
    this.templatesChanged.emit();
    this.toast.show({ variant: 'success', message: 'Template updated', duration: 5000 });
  }
  removeClick(t: RuleTemplate, e: Event): void { e.stopPropagation(); this.remove(t); }
  remove(t: RuleTemplate): void {
    const removed = this.store.deleteTemplate(t.id);
    if (!removed) return;
    const wasSelected = this.templateId === t.id;
    if (wasSelected) { this.templateId = null; this.templateIdChange.emit(null); }
    this.templatesChanged.emit();
    this.toast.show({ variant: 'success', message: 'Template deleted', duration: 6000, actions: [{ label: 'Undo', onClick: () => {
      this.store.restoreTemplate(removed.t, removed.index);
      if (wasSelected) { this.templateId = removed.t.id; this.templateIdChange.emit(removed.t.id); }
      this.templatesChanged.emit();
    } }] });
  }

  private emit(r: RuleSet): void { this.rules = r; this.rulesChange.emit(r); }
}
