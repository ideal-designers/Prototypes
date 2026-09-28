import type { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';

/** A row in the Documents table, a search match, or a cited source. */
export interface MockDoc {
  id: string;
  index: string;
  name: string;
  type: FvdrFileType;
  location?: string;
  notes?: number;
  labels?: number;
  pages?: number;
  size?: string;
  addedOn?: string;
  docId?: string;
}

/** A sentence in an answer that points at one document. */
export interface AnswerItem {
  doc: MockDoc;
  page?: number;
  text: string;
}

export interface AnswerGroup {
  title?: string;
  items: AnswerItem[];
}

/** Side-by-side clause cards (the "compare" answer in the full assistant). */
export interface CompareCard {
  doc: MockDoc;
  quote: string;
  tags: string[];
}

/** One AI answer — rendered identically in the overview card and the chat. */
export interface MockAnswer {
  /** Lead paragraph. `**x**` marks bold. */
  intro: string;
  groups: AnswerGroup[];
  compare?: CompareCard[];
  outro?: string;
  followUps: string[];
  /** Keyword searches mark this term in chips, names and snippets. */
  keyword?: string;
}

export interface ResultRow extends MockDoc {
  /** Keyword search — the matching sentence and how many times the term appears. */
  snippet?: string;
  hits?: number;
}

// ── Documents ────────────────────────────────────────────────────────────────

export const DOC_FALCON: MockDoc = {
  id: 'd551', index: '5.5.1', name: 'Merger Agreement – Project Falcon.pdf', type: 'pdf',
  location: '5.5 Agreement', notes: 2, labels: 3, pages: 40, size: '183.68 Kb', addedOn: 'Mar 27, 2026', docId: '2445991',
};
export const DOC_SHAREHOLDER: MockDoc = {
  id: 'd552', index: '5.5.2', name: 'Shareholder Agreement.pdf', type: 'pdf',
  location: '5.5 Agreement', pages: 40, size: '183.68 Kb', addedOn: 'Apr 3, 2026', docId: '2445994',
};
export const DOC_APA: MockDoc = {
  id: 'd553', index: '5.5.3', name: 'Asset Purchase Agreement.pdf', type: 'pdf',
  location: '5.5 Agreement', notes: 2, pages: 40, size: '183.68 Kb', addedOn: 'Apr 4, 2023', docId: '2445996',
};
export const FOLDER_APA: MockDoc = {
  id: 'f55', index: '5.5', name: 'Asset Purchase Agreements', type: 'folder-colored',
  location: '5 Legal Agreements', notes: 2, labels: 3,
};

/** Contents of "5 Legal Agreements" — the page the user starts on. */
export const FOLDER_ROWS: MockDoc[] = [
  { id: 'f51', index: '5.1', name: 'Confidentiality Agreements', type: 'folder-colored', notes: 1, labels: 3 },
  { id: 'f52', index: '5.2', name: 'Merger Agreements', type: 'folder-colored', notes: 4 },
  { id: 'f53', index: '5.3', name: 'Acquisition Proposals', type: 'folder-colored', notes: 2 },
  { id: 'f54', index: '5.4', name: 'Shareholder Agreements', type: 'folder-colored', notes: 2 },
  { ...FOLDER_APA, location: undefined, notes: undefined, labels: undefined },
  { id: 'd56', index: '5.6', name: 'Regulatory Filings', type: 'pdf', notes: 2, pages: 40, size: '183.68 Kb', addedOn: 'Feb 12, 2026', docId: '2445970' },
];

/** Everything the live name-match looks through while the user types. */
export const SEARCH_POOL: MockDoc[] = [
  FOLDER_APA,
  { id: 'f255', index: '2.5.5', name: 'Asset Purchase Agreements 2', type: 'folder-colored' },
  { ...DOC_FALCON, name: 'Merger Agreement – Project Falcon.pdf' },
  { ...DOC_SHAREHOLDER },
  { ...DOC_APA },
  { id: 'd554', index: '5.5.4', name: 'Asset Purchase Agreement – Annex A.pdf', type: 'pdf' },
  { id: 'd555', index: '5.5.5', name: 'Asset Purchase Agreement – Annex B.pdf', type: 'pdf' },
  { id: 'd211', index: '2.1.1', name: 'Purchase Agreement Draft v2.docx', type: 'doc' },
  { id: 'd212', index: '2.1.2', name: 'Purchase Agreement Draft v1.docx', type: 'doc' },
  { id: 'd413', index: '4.1.3', name: 'Agreement Review Notes.pdf', type: 'pdf' },
  { id: 'f51', index: '5.1', name: 'Confidentiality Agreements', type: 'folder-colored' },
  { id: 'f54', index: '5.4', name: 'Shareholder Agreements', type: 'folder-colored' },
  { id: 'f52', index: '5.2', name: 'Merger Agreements', type: 'folder-colored' },
  { id: 'd56', index: '5.6', name: 'Regulatory Filings', type: 'pdf' },
  { id: 'f3', index: '3', name: 'Financial Projections', type: 'folder-colored' },
];

// ── Quick access tree ────────────────────────────────────────────────────────

export interface TreeRow { id: string; index: string; label: string; level: number; hasChildren?: boolean; active?: boolean }

export const TREE_ROWS: TreeRow[] = [
  { id: 'room', index: '', label: 'Room name', level: 0 },
  { id: '1', index: '1', label: 'Integration Plans', level: 1 },
  { id: '2', index: '2', label: 'Acquisition Documents', level: 1 },
  { id: '3', index: '3', label: 'Financial Projections', level: 1 },
  { id: '4', index: '4', label: 'Due Diligence Reports', level: 1, hasChildren: true },
  { id: '5', index: '5', label: 'Legal Agreements', level: 1, hasChildren: true, active: true },
  { id: '6', index: '6', label: 'Financial Projections', level: 1 },
  { id: 'qa', index: '', label: 'Q&A attachments', level: 1 },
];

// ── Answers ──────────────────────────────────────────────────────────────────

export const ANSWER_CONSENT: MockAnswer = {
  intro: 'Five agreements contain a change of control provision. Three of them have to be cleared with the counterparty before closing; the other two only ask for notice.',
  groups: [{
    title: 'Consent needed before closing',
    items: [
      { doc: DOC_FALCON, text: 'Prior written consent of the counterparty, and it has to be in place before signing, not after. This is the one that can hold up the deal.' },
      { doc: DOC_SHAREHOLDER, text: 'The drag-along right is triggered by any change of control, including an indirect one through the parent.' },
      { doc: DOC_APA, text: 'The seller may terminate with immediate effect once the buyer changes hands.' },
    ],
  }],
  followUps: ['Which of these are unsigned?', 'Compare 5.5.1 and 5.5.2 on the earn-out'],
};

export const ANSWER_KEYWORD: MockAnswer = {
  keyword: 'Agreement',
  intro: 'Four results mention an “**Agreement**”. Three of them are the agreement itself and its earlier drafts; two are other contracts that point at it.',
  groups: [
    {
      title: 'The agreement itself',
      items: [
        { doc: DOC_APA, page: 1, text: 'Signed on 27 March 2026, 44 pages. This is the version the room treats as current.' },
        { doc: FOLDER_APA, text: 'The folder that holds the signed file and its two annexes.' },
      ],
    },
    {
      title: 'Documents that only reference it',
      items: [
        { doc: { ...DOC_FALCON, name: 'Merger Agreement.pdf' }, page: 14, text: 'Keeps the buyer’s remedies under the asset purchase agreement intact.' },
        { doc: DOC_SHAREHOLDER, page: 7, text: 'Says the asset purchase agreement prevails if the two ever conflict.' },
      ],
    },
  ],
  followUps: ['Which of these are unsigned?', 'Compare 5.5.1 and 5.5.2 on the earn-out'],
};

export const ANSWER_UNSIGNED: MockAnswer = {
  intro: 'Two of the three are still unsigned. Only the merger agreement carries both signatures.',
  groups: [{
    title: 'Waiting for signatures',
    items: [
      { doc: DOC_SHAREHOLDER, text: 'Signed by the seller on 3 April 2026; the buyer’s signature block is still empty.' },
      { doc: DOC_APA, text: 'Execution version uploaded, no signatures yet. It is also the one the seller can terminate on a change of control.' },
    ],
  }, {
    title: 'Signed',
    items: [
      { doc: DOC_FALCON, text: 'Signed by both parties on 12 May 2026.' },
    ],
  }],
  followUps: ['Who still has to sign 5.5.2?', 'Draft a reminder to the buyer'],
};

export const ANSWER_COMPARE: MockAnswer = {
  intro: 'The two documents define the earn-out differently, and the difference changes what the seller is owed. Both clauses are quoted below, exactly as they appear in the room.',
  groups: [],
  compare: [
    { doc: { ...DOC_FALCON, name: 'Merger Agreement.pdf' }, quote: 'The Earn-Out Payment shall be calculated on EBITDA for the twelve months ending 31 December 2026.', tags: ['EBITDA', 'financial year', 'signed 12 May 2026'] },
    { doc: DOC_SHAREHOLDER, quote: 'The Earn-Out Payment shall be based on revenue for the financial year ending 30 June 2026.', tags: ['Revenue', 'financial year', 'signed 3 Apr 2026'] },
  ],
  outro: 'Same payment, different metric and different period. 5.5.1 was signed later, so it most likely governs — but 5.5.2 carries no superseding clause, so a lawyer has to confirm which one wins before this goes into a Q&A reply.',
  followUps: ['Which version was signed last?', 'Draft the Q&A answer for question 114'],
};

/** Clarifying step — the question was too broad to answer in one go. */
export const CLARIFY = {
  question: 'Which contracts do you mean?',
  hint: 'Either way the answer opens here, above the file list.',
  options: ['All agreements in the room', 'Only in 5 Legal Agreements', 'Only documents signed after January 2026'],
};

export const RECENTS_SEED = ['Which NDAs expire before closing?', 'asset purchase agreement'];

export const AI_PROMPTS = [
  'Which contracts have a change of control clause?',
  'What is missing before we open the room to bidders?',
  'find keywords: Agreement',
];

/** Queries that are too broad and get a clarifying question first. */
export function needsClarifying(q: string): boolean {
  return /which contracts/i.test(q);
}

export function isKeywordQuery(q: string): string | null {
  const m = q.match(/^find keywords?:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

/** Follow-up → answer. Anything unknown falls back to the unsigned summary. */
export function answerFor(prompt: string): MockAnswer {
  if (/compare|earn-?out/i.test(prompt)) return ANSWER_COMPARE;
  if (/unsigned|sign/i.test(prompt)) return ANSWER_UNSIGNED;
  if (isKeywordQuery(prompt)) return ANSWER_KEYWORD;
  return ANSWER_CONSENT;
}

/** Documents behind an answer, in order, de-duplicated — they become the result table. */
export function docsOf(a: MockAnswer): MockDoc[] {
  const seen = new Set<string>();
  const out: MockDoc[] = [];
  for (const d of [...a.groups.flatMap(g => g.items.map(i => i.doc)), ...(a.compare ?? []).map(c => c.doc)]) {
    if (!seen.has(d.id)) { seen.add(d.id); out.push(d); }
  }
  return out;
}

/** Result rows for a keyword search — Figma 446:38385. */
export const KEYWORD_ROWS: ResultRow[] = [
  { ...FOLDER_APA, index: '5.5', name: 'Merger Agreement – Project Falcon.pdf', location: '5 Acquisition Documents' },
  { ...DOC_FALCON, name: 'Merger Agreement.pdf', location: '5.5 Asset Purchase Agreements', labels: 3,
    snippet: 'Nothing in this Asset Purchase Agreement limits the remedies available to the Purchaser under the Merger Agreement', hits: 12 },
  { ...DOC_SHAREHOLDER, location: '5.5 Asset Purchase Agreements',
    snippet: 'In the event of a conflict between this Agreement and the Asset Purchase Agreement, the latter prevails.', hits: 5 },
  { ...DOC_APA, location: '5.5 Asset Purchase Agreements',
    snippet: 'This Asset Purchase Agreement is made on 27 March 2026 between the Seller and the Purchaser.', hits: 2 },
];
