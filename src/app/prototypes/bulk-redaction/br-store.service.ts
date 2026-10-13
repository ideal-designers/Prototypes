import { Injectable, inject } from '@angular/core';
import {
  DocStatus, Mark, NODES, PdfItem, RuleSet, RuleTemplate, SEED_TEMPLATES, cloneRules, detectMarks, emptyRules, filesUnder, newId, nodeById,
} from './bulk-redaction.data';
import { BrPdfService } from './br-pdf.service';

export type ExistingMarksMode = 'merge' | 'keep' | 'replace';
/** Statuses a person can pick by hand (Draft only resets). */
export type ManualStatus = 'draft' | 'ready' | 'reviewed';

interface DocState { status: DocStatus; marks: Mark[] }

/**
 * Single source of truth for both concepts. The Documents list (concept 2) and the Redaction
 * page (concept 1) only differ in where they *show* this state — the detection, statuses,
 * marks, rules and templates are literally the same objects.
 */
@Injectable()
export class BrStore {
  private pdf = inject(BrPdfService);
  private docs = new Map<string, DocState>();
  templates: RuleTemplate[] = SEED_TEMPLATES.map(t => ({ ...cloneRules(t), id: t.id, name: t.name }));

  /** Rules the current batch was created with — the viewer's Redaction templates tool edits these. */
  batchRules: RuleSet = emptyRules();
  /** Top-level items added to the Redaction page (concept 1 table roots). */
  roots: string[] = [];
  /** Last started batch, used by the progress panel in concept 2. */
  batch: { ids: string[]; startedAt: number } | null = null;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private epoch = 0;

  reset(withTemplates: boolean): void {
    this.epoch++;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.docs.clear();
    this.roots = [];
    this.batch = null;
    this.batchRules = emptyRules();
    this.templates = withTemplates ? SEED_TEMPLATES.map(t => ({ ...cloneRules(t), id: t.id, name: t.name })) : [];
  }

  // ── Reads ────────────────────────────────────────────────────────────────
  status(id: string): DocStatus { return this.docs.get(id)?.status ?? 'none'; }
  marks(id: string): Mark[] { return this.docs.get(id)?.marks ?? []; }
  inRedaction(id: string): boolean { return this.docs.has(id); }
  hasMarks(id: string): boolean { return this.marks(id).length > 0; }
  count(id: string, state: 'draft' | 'applied'): number { return this.marks(id).filter(m => m.state === state).length; }
  pdfItems(): Promise<PdfItem[]> { return this.pdf.items(); }

  /** Files (not folders) under any of the given node ids. */
  files(ids: string[]): string[] {
    return [...new Set(ids.flatMap(i => filesUnder(i).map(n => n.id)))];
  }

  /** Aggregate for a folder row: counts + the least-advanced status of its tracked files. */
  aggregate(id: string): { applied: number; draft: number; status: DocStatus; tracked: number } {
    const tracked = filesUnder(id).map(n => n.id).filter(i => this.inRedaction(i));
    const applied = tracked.reduce((n, i) => n + this.count(i, 'applied'), 0);
    const draft = tracked.reduce((n, i) => n + this.count(i, 'draft'), 0);
    const order: DocStatus[] = ['detecting', 'draft', 'ready', 'reviewed', 'applied', 'none'];
    const status = tracked.map(i => this.status(i)).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] ?? 'none';
    return { applied, draft, status, tracked: tracked.length };
  }

  // ── Detection ────────────────────────────────────────────────────────────
  /** PRD #1: detection starts immediately when the settings are confirmed. */
  startDetection(nodeIds: string[], rules: RuleSet, mode: ExistingMarksMode): string[] {
    this.batchRules = cloneRules(rules);
    nodeIds.forEach(i => { if (!this.roots.includes(i)) this.roots.push(i); });
    const ids = this.files(nodeIds);
    this.batch = { ids, startedAt: Date.now() };
    this.pdf.items(); // warm the cache while the "Drafting…" statuses are showing

    const epoch = this.epoch;
    let n = 0;
    for (const id of ids) {
      const had = this.hasMarks(id);
      if (!this.docs.has(id)) this.docs.set(id, { status: 'none', marks: [] });
      if (had && mode === 'keep') continue;
      this.docs.get(id)!.status = 'detecting';
      const delay = 1100 + n++ * 650;
      this.timers.push(setTimeout(async () => {
        const items = await this.pdf.items();
        if (epoch === this.epoch) this.finishDetection(id, rules, items, had ? mode : 'replace');
      }, delay));
    }
    return ids;
  }

  /** Viewer: "Mark for redaction" / "Redaction templates" run detection on the open document. Exceptions only affect new finds. */
  async detectNow(id: string, rules: RuleSet): Promise<number> {
    const items = await this.pdf.items();
    if (!this.docs.has(id)) this.docs.set(id, { status: 'none', marks: [] });
    const added = this.merge(id, detectMarks(id, nodeById(id).content ?? 'plain', items, rules));
    const doc = this.docs.get(id)!;
    if (doc.marks.length && (doc.status === 'none' || doc.status === 'applied')) doc.status = 'draft';
    return added;
  }

  private finishDetection(id: string, rules: RuleSet, items: PdfItem[], mode: ExistingMarksMode): void {
    const doc = this.docs.get(id)!;
    const found = detectMarks(id, nodeById(id).content ?? 'plain', items, rules);
    if (mode === 'replace') doc.marks = found; else this.merge(id, found);
    doc.status = doc.marks.length ? 'draft' : 'none';
  }

  private merge(id: string, found: Mark[]): number {
    const doc = this.docs.get(id)!;
    let added = 0;
    for (const m of found) {
      const clash = doc.marks.some(o => o.page === m.page && Math.abs(o.y - m.y) < 2 && o.x < m.x + m.w && m.x < o.x + o.w);
      if (!clash) { doc.marks.push(m); added++; }
    }
    return added;
  }

  // ── Statuses (PRD #9, #10 — manual only) ─────────────────────────────────
  canSetStatus(id: string): boolean {
    const s = this.status(id);
    return this.hasMarks(id) && (s === 'draft' || s === 'ready' || s === 'reviewed');
  }

  setStatus(ids: string[], status: ManualStatus): number {
    let n = 0;
    for (const id of ids) if (this.canSetStatus(id)) { this.docs.get(id)!.status = status; n++; }
    return n;
  }

  apply(ids: string[]): number {
    let n = 0;
    for (const id of ids) {
      const doc = this.docs.get(id);
      if (!doc || !doc.marks.length || doc.status === 'detecting') continue;
      doc.marks.forEach(m => (m.state = 'applied'));
      doc.status = 'applied';
      n++;
    }
    return n;
  }

  /** Takes applied redaction back to draft marks so it can be reviewed or changed again. */
  unredact(ids: string[]): number {
    let n = 0;
    for (const id of ids) {
      const doc = this.docs.get(id);
      if (!doc || doc.status !== 'applied') continue;
      doc.marks.forEach(m => (m.state = 'draft'));
      doc.status = 'draft';
      n++;
    }
    return n;
  }

  /** Removes every mark in the document with the same text as the given one ("Delete from all pages"). */
  removeSame(id: string, markId: string): number {
    const doc = this.docs.get(id);
    const m = doc?.marks.find(x => x.id === markId);
    if (!doc || !m) return 0;
    const before = doc.marks.length;
    doc.marks = doc.marks.filter(x => x.text.toLowerCase() !== m.text.toLowerCase() || x.kind !== m.kind);
    if (!doc.marks.length) doc.status = 'none';
    return before - doc.marks.length;
  }

  removeMark(id: string, markId: string): void {
    const doc = this.docs.get(id);
    if (!doc) return;
    doc.marks = doc.marks.filter(m => m.id !== markId);
    if (!doc.marks.length) doc.status = 'none';
  }

  // ── Templates (PRD #5, #6) ───────────────────────────────────────────────
  saveTemplate(name: string, rules: RuleSet): RuleTemplate {
    const t: RuleTemplate = { ...cloneRules(rules), id: newId('tpl'), name };
    this.templates = [...this.templates, t];
    return t;
  }
  updateTemplate(id: string, rules: RuleSet): void {
    this.templates = this.templates.map(t => (t.id === id ? { ...t, ...cloneRules(rules) } : t));
  }
  renameTemplate(id: string, name: string): void { this.templates = this.templates.map(t => (t.id === id ? { ...t, name } : t)); }
  /** Returns the removed template and its position so the toast's Undo can put it back. */
  deleteTemplate(id: string): { t: RuleTemplate; index: number } | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index < 0) return null;
    const t = this.templates[index];
    this.templates = this.templates.filter(x => x.id !== id);
    return { t, index };
  }
  restoreTemplate(t: RuleTemplate, index: number): void {
    const next = [...this.templates];
    next.splice(Math.min(index, next.length), 0, t);
    this.templates = next;
  }
  template(id: string | null): RuleTemplate | undefined { return this.templates.find(t => t.id === id); }

  /** Everything in the project, used by "Apply all marks". */
  allTracked(): string[] { return NODES.filter(n => n.kind === 'file' && this.inRedaction(n.id)).map(n => n.id); }
}
