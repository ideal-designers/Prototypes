import type { FvdrIconName } from '../../shared/ds/icons/icons';
import type { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';
import type { RedactionMarkType } from '../../shared/ds';

/**
 * Bulk redaction — shared model + mock data used by BOTH concepts, so every
 * decision that is the same in the two flows (PII categories, custom terms,
 * do-not-redact terms, templates, statuses, marks) lives here exactly once.
 */

// ── PII categories (PRD #2: signature is its own category) ──────────────────
export type PiiCategory =
  | 'personal-name' | 'address' | 'date-time' | 'email' | 'phone' | 'iban' | 'ssn' | 'passport' | 'signature';

export interface PiiCategoryMeta { id: PiiCategory; label: string; icon: FvdrIconName; card: RedactionMarkType }

export const PII_CATEGORIES: PiiCategoryMeta[] = [
  { id: 'personal-name', label: 'Personal name',   icon: 'user',          card: 'personal-name' },
  { id: 'address',       label: 'Address',         icon: 'location',      card: 'address' },
  { id: 'date-time',     label: 'Date & time',     icon: 'calendar-date', card: 'date-time' },
  { id: 'email',         label: 'Email',           icon: 'mail',          card: 'email' },
  { id: 'phone',         label: 'Phone number',    icon: 'phone',         card: 'phone' },
  { id: 'iban',          label: 'IBAN',            icon: 'bank',          card: 'iban' },
  { id: 'ssn',           label: 'SSN',             icon: 'card-security', card: 'ssn' },
  { id: 'passport',      label: 'Passport number', icon: 'passport',      card: 'passport' },
  { id: 'signature',     label: 'Signatures',      icon: 'edit',          card: 'redacted-area' },
];

export const CATEGORY_LABEL: Record<string, string> = {
  ...Object.fromEntries(PII_CATEGORIES.map(c => [c.id, c.label])),
  keyword: 'Custom term',
  manual: 'Manual',
};

// ── Rules ───────────────────────────────────────────────────────────────────
export interface RuleSet { categories: PiiCategory[]; keywords: string[]; doNotRedact: string[] }
export interface RuleTemplate extends RuleSet { id: string; name: string }

export const emptyRules = (): RuleSet => ({ categories: [], keywords: [], doNotRedact: [] });
export const cloneRules = (r: RuleSet): RuleSet => ({
  categories: [...r.categories], keywords: [...r.keywords], doNotRedact: [...r.doNotRedact],
});
export const sameRules = (a: RuleSet, b: RuleSet): boolean =>
  JSON.stringify([[...a.categories].sort(), a.keywords, a.doNotRedact]) ===
  JSON.stringify([[...b.categories].sort(), b.keywords, b.doNotRedact]);

export const SEED_TEMPLATES: RuleTemplate[] = [
  { id: 'tpl-ma', name: 'M&A Due Diligence',
    categories: ['date-time', 'phone', 'passport'], keywords: ['Confidential', 'LLC', 'Keyword'], doNotRedact: ['Kyiv'] },
  { id: 'tpl-nda', name: 'Standard NDA review',
    categories: ['personal-name', 'address', 'date-time', 'iban', 'ssn'], keywords: [], doNotRedact: [] },
  { id: 'tpl-pii', name: 'Full PII sweep',
    categories: ['address', 'email', 'phone', 'signature'], keywords: ['Confidential', 'Internal', 'Draft', 'LLC', 'Keyword'], doNotRedact: [] },
];

// ── Statuses (PRD #8–#10) ───────────────────────────────────────────────────
export type DocStatus = 'none' | 'detecting' | 'draft' | 'ready' | 'reviewed' | 'applied';

export const STATUS_LABEL: Record<DocStatus, string> = {
  none: 'No marks', detecting: 'Drafting...', draft: 'Draft',
  ready: 'Ready for review', reviewed: 'Reviewed', applied: 'Applied',
};
/** Ready for review / Reviewed can only be set by hand (viewer or document list, single and bulk). */
export const MANUAL_STATUSES: DocStatus[] = ['ready', 'reviewed'];

// ── Document tree (shared by the Add files step and the Documents list) ─────
export type DocContent = 'rich' | 'finance' | 'plain';

export interface DocNode {
  id: string;
  index: string;
  name: string;
  kind: 'folder' | 'file';
  parent: string | null;
  ext?: 'docx' | 'pdf';
  content?: DocContent;
  updated: string;
}

const f = (id: string, index: string, name: string, parent: string | null, updated: string): DocNode =>
  ({ id, index, name, kind: 'folder', parent, updated });
const d = (id: string, index: string, name: string, parent: string | null, ext: 'docx' | 'pdf',
           content: DocContent, updated: string): DocNode =>
  ({ id, index, name, kind: 'file', parent, ext, content, updated });

export const NODES: DocNode[] = [
  f('f1', '1', 'ODM intellectual property', null, 'Apr 25, 2026'),
  d('d1-1', '1.1', 'Patent application.docx', 'f1', 'docx', 'rich', 'Apr 25, 2026'),
  d('d1-2', '1.2', 'License agreement.pdf', 'f1', 'pdf', 'finance', 'Apr 20, 2026'),
  f('f2', '2', 'Intellectual property', null, 'Apr 25, 2026'),
  d('d2-1', '2.1', 'Protocol.docx', 'f2', 'docx', 'rich', 'Mar 8, 2026'),
  d('d2-2', '2.2', 'Protocol.pdf', 'f2', 'pdf', 'rich', 'Mar 4, 2026'),
  f('f3', '3', 'Trade secrets', null, 'Mar 8, 2026'),
  d('d3-1', '3.1', 'Protocol.docx', 'f3', 'docx', 'rich', 'Feb 28, 2026'),
  f('f4', '4', 'ACME Inc.', null, 'Mar 4, 2026'),
  f('f4-1', '4.1', 'ACME Inc.', 'f4', 'Mar 4, 2026'),
  d('d4-1-1', '4.1.1', 'Protocol.docx', 'f4-1', 'docx', 'rich', 'Mar 4, 2026'),
  d('d4-2', '4.2', 'Protocol.docx', 'f4', 'docx', 'finance', 'Feb 17, 2026'),
  d('d4-3', '4.3', 'Protocol.docx', 'f4', 'docx', 'rich', 'Feb 17, 2026'),
  f('f5', '5', 'ACME Cooperative', null, 'Mar 4, 2026'),
  d('d5-1', '5.1', 'Protocol.docx', 'f5', 'docx', 'plain', 'Feb 17, 2026'),
  d('d5-2', '5.2', 'Protocol.pdf', 'f5', 'pdf', 'plain', 'Feb 17, 2026'),
  f('f6', '6', 'Draft folder', null, 'Feb 10, 2026'),
  d('d6-1', '6.1', 'Draft memo.docx', 'f6', 'docx', 'finance', 'Feb 10, 2026'),
  d('d7', '7', 'Protocol.docx', null, 'docx', 'rich', 'Apr 29, 2026'),
  d('d8', '8', 'Tax report.pdf', null, 'pdf', 'finance', 'Feb 28, 2026'),
  d('d9', '9', 'Annual report.docx', null, 'docx', 'plain', 'Feb 17, 2026'),
];

export const nodeById = (id: string): DocNode => NODES.find(n => n.id === id)!;
export const childrenOf = (id: string | null): DocNode[] => NODES.filter(n => n.parent === id);
export function filesUnder(id: string): DocNode[] {
  const n = nodeById(id);
  return n.kind === 'file' ? [n] : childrenOf(id).flatMap(c => filesUnder(c.id));
}
export const fileIconOf = (n: DocNode): FvdrFileType =>
  n.kind === 'folder' ? 'folder-colored' : n.ext === 'pdf' ? 'pdf' : 'doc';
export function pathOf(id: string): string {
  const n = nodeById(id);
  return n.parent ? `${pathOf(n.parent)} / ${n.name}` : n.name;
}

// ── Detection over the real PDF text (same document and patterns as /redaction-viewer) ──
export interface PdfItem { text: string; page: number; x: number; y: number; w: number; h: number }

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const PATTERNS: { cat: PiiCategory; re: RegExp }[] = [
  { cat: 'email',    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { cat: 'phone',    re: /\b(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
  { cat: 'ssn',      re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { cat: 'iban',     re: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7,15}\b/g },
  { cat: 'passport', re: /\b[A-Z]{2}\d{7}\b/g },
  { cat: 'date-time', re: new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2},?\\s+\\d{4}\\b|\\b\\d{1,2}/\\d{1,2}/\\d{4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b(?:19|20)\\d{2}[,.\\])]?\\b`, 'gi') },
  { cat: 'personal-name', re: /\b(?:Haslhofer|Hershkovits|Andrews|Baker|Brendle|Hamilton|Huisken|Sinestrari|White|Colding|Minicozzi|Brakke|Ilmanen|Grayson|Gage|Mantegazza|Head|Bernstein|Schulze|Lynch|Langford|Perelman|Kleiner|Wang|Sheng|Lauer|Naff)\b|\b[A-Z]\.\s*[A-Z][a-z]{2,}\b/g },
  { cat: 'address', re: /\b(?:Department of Mathematics|Courant Institute|University of Toronto|New York University|ETH\s+Z[uü]rich|University of California)\b/gi },
  { cat: 'signature', re: /\bsignature\b/gi },
];

export type MarkKind = PiiCategory | 'keyword' | 'manual';
export type MarkState = 'draft' | 'applied';

/** Coordinates are in PDF points at scale 1 (page 1 = 595 wide); the viewer multiplies by its scale. */
export interface Mark {
  id: string;
  docId: string;
  text: string;
  kind: MarkKind;
  page: number;
  x: number; y: number; w: number; h: number;
  state: MarkState;
}

let markSeq = 0;
export const newId = (p: string) => `${p}${++markSeq}`;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How much of the shared mock PDF each mock file "contains", so some files come out with no matches. */
const visible = (content: DocContent, it: PdfItem): boolean =>
  content === 'plain' ? false : content === 'finance' ? it.page <= 2 : true;

/** Per-category match counts, ignoring exceptions — what "Detect sensitive information" shows. */
export function countByCategory(content: DocContent, items: PdfItem[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of detectMarks('', content, items, { categories: PII_CATEGORIES.map(c => c.id), keywords: [], doNotRedact: [] })) {
    out[m.kind] = (out[m.kind] ?? 0) + 1;
  }
  return out;
}

/** Runs the rule set over the PDF text items. Exceptions ("Do not redact") always win. */
export function detectMarks(docId: string, content: DocContent, items: PdfItem[], rules: RuleSet): Mark[] {
  const out: Mark[] = [];
  const dnr = rules.doNotRedact.map(t => t.toLowerCase()).filter(Boolean);
  const skip = (txt: string) => {
    const l = txt.toLowerCase();
    return dnr.some(t => l.includes(t) || t.includes(l));
  };
  for (const it of items) {
    if (!visible(content, it)) continue;
    const charW = it.w / Math.max(it.text.length, 1);
    const found: { start: number; end: number; kind: MarkKind }[] = [];
    for (const { cat, re } of PATTERNS) {
      if (!rules.categories.includes(cat)) continue;
      const r = new RegExp(re.source, re.flags);
      for (const m of it.text.matchAll(r)) found.push({ start: m.index!, end: m.index! + m[0].length, kind: cat });
    }
    for (const kw of rules.keywords.filter(Boolean)) {
      for (const m of it.text.matchAll(new RegExp(`\\b${escapeRe(kw)}\\b`, 'gi'))) {
        found.push({ start: m.index!, end: m.index! + m[0].length, kind: 'keyword' });
      }
    }
    found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    let cursor = -1;
    for (const f of found) {
      if (f.start < cursor) continue;
      const txt = it.text.slice(f.start, f.end);
      if (skip(txt)) continue;
      cursor = f.end;
      out.push({ id: newId('m'), docId, text: txt, kind: f.kind, page: it.page,
        x: it.x + f.start * charW, y: it.y, w: Math.max(txt.length * charW, 20), h: it.h + 2, state: 'draft' });
    }
  }
  return out;
}
