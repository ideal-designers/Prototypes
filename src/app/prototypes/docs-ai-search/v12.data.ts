import type { MockDoc, ResultRow } from './docs-ai-search.data';
import { DOC_APA, DOC_FALCON, DOC_SHAREHOLDER } from './docs-ai-search.data';

/**
 * V1.2 · AI Overview with small input field — Figma AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB),
 * section 720:131529 on "↳ Documnets page". Texts are the designer's, verbatim.
 *
 * Answer text uses two inline marks: `**bold**` and `[n]` for a numbered citation that
 * points at `sources[n - 1]`.
 */

export interface V12Source {
  n: number;
  doc: MockDoc;
  version?: string;
  quote: string;
  where: string;        // "Section 1 · Page 22"
  page?: number;
}

export type V12Block =
  | { kind: 'table'; title: string; head: [string, string, string]; rows: { term: string; says: string; cite: number; loc: string }[] }
  | { kind: 'bullets'; title: string; items: string[] }
  | { kind: 'files'; items: { doc: MockDoc; text: string; viewed: boolean; published: boolean }[] }
  | { kind: 'kpis'; items: { label: string; value: string; badge?: string; tone?: 'green' | 'yellow' | 'red' }[] }
  | { kind: 'coverage'; title: string; unit: string; items: { label: string; pct: number }[] }
  | { kind: 'report'; name: string; meta: string }
  | { kind: 'folders'; items: V12FolderGap[] };

/** An empty folder in the chat answer — Figma 655:86495. `note` may end in a link to a cited file. */
export interface V12FolderGap {
  folder: MockDoc;
  missing: string;
  note: string;
  link?: { doc: MockDoc; page?: number; label: string };
  /** The folder is expected for this room type (✓) or only sometimes (×). */
  expected: boolean;
}

export interface V12Answer {
  id: string;
  lead: string;
  blocks: V12Block[];
  sources: V12Source[];
  followUps: string[];
  /** Full-assistant only: the suggested next question under the answer. */
  next?: string;
  /** Result rows under the overview for this answer. */
  rows: ResultRow[];
  /** Steps shown while the full assistant works on it. */
  steps: string[];
  took: string;
  /** Chat breadcrumb when this answer starts a thread. */
  title?: string;
}

// ── Documents behind the answers ─────────────────────────────────────────────

const SPA: MockDoc = { id: 'spa', index: '2.1', name: 'SPA.pdf', type: 'pdf', location: '2 Legal', pages: 48, size: '2.4 Mb', addedOn: 'Sep 26, 2026', docId: '2446102' };
const COC: MockDoc = { id: 'coc', index: '4.3', name: 'Supplier contracts – CoC tracker.xlsx', type: 'xls', location: '4 Commercial', pages: 3, size: '86 Kb', addedOn: 'Sep 18, 2026', docId: '2446117' };
const CONSENTS: MockDoc = { id: 'cons', index: '4.4', name: 'Supplier consents received.pdf', type: 'pdf', location: '4 Commercial', pages: 12, size: '640 Kb', addedOn: 'Sep 24, 2026', docId: '2446120' };
const DDLIST: MockDoc = { id: 'ddl', index: '0.2', name: 'DD checklist.xlsx', type: 'xls', location: '0 Room setup', pages: 4, size: '120 Kb', addedOn: 'Sep 2, 2026', docId: '2446001' };
const FY25: MockDoc = { id: 'fy25', index: '3.1', name: 'FY2025 Annual Report.pdf', type: 'pdf', location: '3 Financials', pages: 86, size: '6.1 Mb', addedOn: 'Aug 12, 2026', docId: '2446044' };
const MGMT: MockDoc = { id: 'mgmt', index: '3.4', name: 'Management accounts FY2024–25.xlsx', type: 'xls', location: '3 Financials', pages: 6, size: '410 Kb', addedOn: 'Aug 30, 2026', docId: '2446051' };
export const REPORT_DOC: MockDoc = { id: 'report', index: '', name: 'DD checklist report · 22–28 Sep', type: 'pdf', pages: 5, size: '320 Kb', addedOn: 'Just now' };

const CORPORATE_ROWS: ResultRow[] = [
  { ...DOC_FALCON, index: '1.1', location: '1 Corporate' },
  { ...DOC_SHAREHOLDER, index: '1.2', location: '1 Corporate' },
  { ...DOC_APA, index: '1.3', location: '1 Corporate' },
  { ...DOC_APA, id: 'd14', index: '1.4', location: '1 Corporate', notes: 2 },
];

// ── Answers ──────────────────────────────────────────────────────────────────

/** "asset purchase agreement" / the clarified change-of-control question — Figma 720:133229. */
export const V12_CONSENT: V12Answer = {
  id: 'consent',
  lead: 'Three agreements contain a change of control provision. One of them has to be cleared with the counterparty before closing; the other two only ask for notice.',
  blocks: [{ kind: 'files', items: [
    { doc: DOC_FALCON, text: 'Prior written consent of the counterparty, and it has to be in place before signing, not after. This is the one that can hold up the deal.', viewed: false, published: true },
    { doc: DOC_SHAREHOLDER, text: 'The drag-along right is triggered by any change of control, including an indirect one through the parent.', viewed: true, published: true },
    { doc: DOC_APA, text: 'The seller may terminate with immediate effect once the buyer changes hands.', viewed: true, published: true },
  ] }],
  sources: [
    { n: 1, doc: DOC_FALCON, quote: 'Any direct or indirect change of control of a Party shall require the prior written consent of the other Party, such consent to be obtained before signing.', where: 'Clause 8.2 · Page 14', page: 14 },
    { n: 2, doc: DOC_SHAREHOLDER, quote: 'The drag-along right is triggered by any change of control, including an indirect one through the parent.', where: 'Clause 11.1 · Page 7', page: 7 },
    { n: 3, doc: DOC_APA, quote: 'The Seller may terminate this Agreement with immediate effect once the Buyer undergoes a change of control.', where: 'Clause 17.4 · Page 22', page: 22 },
  ],
  followUps: ['Compare 5.5.1 and 5.5.2 on the earn-out', 'Which of these are unsigned?'],
  rows: [DOC_FALCON, DOC_SHAREHOLDER, DOC_APA],
  steps: ['Searched all files and folders you can open · 1,248 files', 'Found 3 agreements in 5 Legal Agreements', 'Read the change of control clauses'],
  took: '12s',
};

/** "Summarise SPA v4 and flag the terms bidders will push back on" — Figma 720:132262. */
export const V12_SPA: V12Answer = {
  id: 'spa',
  lead: 'SPA v4 is the seller-side draft uploaded on 26 Sep. The escrow and the warranty cap are below market practice, so bidders are most likely to challenge them [1]. Four supplier contracts also need consent on change of control [2].',
  blocks: [
    { kind: 'table', title: 'Key terms', head: ['Term', 'What SPA v4 says', 'Source'], rows: [
      { term: 'Purchase price', says: '$412M enterprise value, locked box at 31 Mar 2026', cite: 1, loc: 'p. 6' },
      { term: 'Escrow', says: '5% of the price for 9 months', cite: 1, loc: 'p. 22' },
      { term: 'Warranty cap', says: '15% of the price, 18-month claim period', cite: 1, loc: 'p. 31' },
      { term: 'Change of control', says: 'Consent needed in 4 supplier contracts', cite: 2, loc: 'sheet CoC' },
      { term: 'Governing law', says: 'English law, LCIA arbitration in London', cite: 1, loc: 'p. 44' },
    ] },
    { kind: 'bullets', title: 'Likely bidder questions', items: [
      '**Escrow:** 9 months is shorter than the usual 12–18 months. Expect a request to extend it.',
      '**Warranty cap:** 15% is below the typical 20–30%. Bidders may ask to raise it.',
      '**Change of control:** bidders will ask which of the 4 suppliers have already agreed [3].',
    ] },
  ],
  sources: [
    { n: 1, doc: SPA, version: 'v4', quote: 'The Escrow Amount shall be five per cent (5%) of the Purchase Price and shall be held for a period of nine months…', where: 'Section 1 · Page 22', page: 22 },
    { n: 2, doc: COC, quote: 'Consent required on change of control: Northwind, Atlas Freight, Brightline Packaging, Corvo Logistics.', where: 'Sheet CoC · Rows 4–7' },
    { n: 3, doc: CONSENTS, quote: 'Written consent received from Northwind Supply Ltd on 19 September 2026.', where: 'Page 2', page: 2 },
  ],
  followUps: ['Save as FAQ for Q&A', 'Compare with SPA v3', 'Summarise the disclosure letter'],
  rows: CORPORATE_ROWS,
  steps: ['Searched all files and folders you can open · 1,248 files', 'Read SPA.pdf v4 and the CoC tracker', 'Compared the terms with market practice'],
  took: '18s',
};

/** "Check the project against our DD checklist" — Figma 720:133396. */
export const V12_DD: V12Answer = {
  id: 'dd',
  lead: '**71 of 86** checklist items are covered [1]. **9 items** have no matching file and 6 have a file that looks outdated. Most gaps are in 5. HR and 6. IT.',
  blocks: [
    { kind: 'kpis', items: [
      { label: 'Checklist items', value: '86' },
      { label: 'Covered', value: '71', badge: '83%', tone: 'green' },
      { label: 'Outdated', value: '6', badge: 'Review', tone: 'yellow' },
      { label: 'Missing', value: '9', badge: 'Action', tone: 'red' },
    ] },
    { kind: 'coverage', title: 'Coverage by folder', unit: '% of checklist items', items: [
      { label: '1. Corporate', pct: 100 }, { label: '2. Legal', pct: 94 }, { label: '3. Financials', pct: 91 },
      { label: '4. Commercial', pct: 85 }, { label: '5. HR', pct: 62 }, { label: '6. IT', pct: 48 },
    ] },
  ],
  sources: [
    { n: 1, doc: DDLIST, quote: '86 items across 6 sections; each item maps to a folder and an expected document type.', where: 'Sheet Checklist · Rows 2–87' },
  ],
  followUps: ['Show all gaps in the list', 'Who uploads to 5. HR?', 'Create report'],
  rows: CORPORATE_ROWS,
  steps: ['Read DD checklist.xlsx · 86 items', 'Matched items against 1,248 files', 'Checked upload dates for outdated files'],
  took: '24s',
};

/** After "Create report" — Figma 720:133719. */
export const V12_REPORT: V12Answer = {
  id: 'report',
  lead: 'Your report is ready. It covers folders, bidders, top files and the 12 files nobody opened.',
  blocks: [{ kind: 'report', name: 'DD checklist report · 22–28 Sep', meta: 'PDF · about 5 pages · folders, bidders, top files, unopened files' }],
  sources: V12_DD.sources,
  followUps: ['Show all gaps in the list', 'Who uploads to 5. HR?'],
  rows: CORPORATE_ROWS,
  steps: ['Collected coverage, bidders and top files', 'Built a 5-page PDF'],
  took: '9s',
};

/** Full assistant, second answer — Figma 720:134574. */
export const V12_REVENUE: V12Answer = {
  id: 'revenue',
  lead: 'FY2025 revenue was **$448M**, up **12%** from $400M in FY2024 [1] [2]. Growth came mainly from direct-to-consumer sales (+21%) and price increases in Europe (+4%). Wholesale was flat.',
  blocks: [],
  sources: [
    { n: 1, doc: FY25, quote: 'Revenue for the year ended 31 March 2025 was $448 million (FY2024: $400 million).', where: 'Financial review · Page 12', page: 12 },
    { n: 2, doc: MGMT, quote: 'DTC +21% YoY; EU price increase contributed +4 pts; wholesale flat.', where: 'Sheet Revenue bridge' },
  ],
  followUps: [],
  next: 'Show the full P&L?',
  rows: [],
  steps: ['Searched 3 Financials', 'Read FY2025 Annual Report.pdf', 'Built the revenue bridge'],
  took: '18s',
};

export const V12_PL: V12Answer = {
  id: 'pl',
  lead: 'Here is the FY2025 P&L summary [1]. Operating profit rose faster than revenue because marketing spend stayed flat.',
  blocks: [{ kind: 'table', title: 'P&L · FY2025 vs FY2024', head: ['Line', 'FY2025 (FY2024)', 'Source'], rows: [
    { term: 'Revenue', says: '$448M ($400M) · +12%', cite: 1, loc: 'p. 12' },
    { term: 'Gross profit', says: '$197M ($172M) · 44% margin', cite: 1, loc: 'p. 13' },
    { term: 'Operating profit', says: '$61M ($48M) · +27%', cite: 1, loc: 'p. 13' },
    { term: 'Net profit', says: '$43M ($34M)', cite: 1, loc: 'p. 14' },
  ] }],
  sources: [V12_REVENUE.sources[0]],
  followUps: [],
  next: 'Compare margins with FY2023?',
  rows: [],
  steps: ['Read FY2025 Annual Report.pdf · pages 12–14', 'Built the P&L table'],
  took: '11s',
};

// ── Clarifying question — Figma 720:131660 ──────────────────────────────────

export const V12_CLARIFY = {
  question: 'Which contracts do you mean?',
  hint: 'Either way the answer opens here, above the file list.',
  options: ['All agreements in the room', 'Only in 5 Legal Agreements', 'Only documents signed after January 2026'],
};

export const V12_PROMPTS = [
  'Which contracts have a change of control clause?',
  'Summarise SPA v4 and flag the terms bidders will push back on',
  'Check the project against our DD checklist',
];

/** Query → first overview state. */
export function v12For(q: string): { clarify: boolean; answer: V12Answer } {
  const s = q.toLowerCase();
  if (/which contracts|asset purchase|change of control/.test(s)) return { clarify: true, answer: V12_CONSENT };
  if (/spa/.test(s)) return { clarify: false, answer: V12_SPA };
  if (/checklist|dd /.test(s) || s.startsWith('check the project')) return { clarify: false, answer: V12_DD };
  return { clarify: false, answer: V12_CONSENT };
}

// ── General AI chat · V2 (Figma 622:9873) ───────────────────────────────────

const folder = (index: string, name: string, docId: string): MockDoc =>
  ({ id: 'f' + index, index, name, type: 'folder-colored', location: 'Root folder', size: '0 Kb', addedOn: 'Apr 4, 2023', docId });
const F_TAX = folder('7', 'Tax', '2445996');
const F_INS = folder('8', 'Insurance', '2445997');
const F_EHS = folder('9', 'Environmental, health and safety', '2445998');
const F_IT = folder('10', 'IT and data protection', '2445999');
const DDR: MockDoc = { id: 'ddr', index: '4.2', name: 'Due Diligence Report.xlsx', type: 'xls', location: '4 Commercial', pages: 24, size: '1.2 Mb', addedOn: 'Sep 12, 2026', docId: '2446081' };
const APA_553: MockDoc = { ...DOC_APA, index: '5.5.3' };

/** "Which 4 folders are empty…" — Figma 655:86495. */
export const V12_EMPTY_FOLDERS: V12Answer = {
  id: 'empty',
  title: 'Empty folders vs the DD index',
  lead: 'Four of the twelve folders have nothing in them. Three of the four are standard for a sell-side room at this stage, and two are already promised by documents that are in the room — so a buyer will ask for them by name.',
  blocks: [{ kind: 'folders', items: [
    { folder: F_TAX, expected: true, missing: 'Corporate tax returns for the last three years, VAT filings, the transfer pricing file, and correspondence on any open dispute',
      note: 'Asked for in the first week of diligence. Nothing anywhere in the room covers tax.' },
    { folder: F_INS, expected: false, missing: 'Policies in force, certificates of insurance, claims history for three years, and any run-off cover.',
      note: 'Already promised: Annex 4 of ', link: { doc: APA_553, page: 31, label: '5.5.3 Asset Purchase Agreement, p. 31.' } },
    { folder: F_EHS, expected: true, missing: 'Permits and licences, audit reports, the incident log, and any remediation obligations.',
      note: 'Only if the target has sites or manufacturing. Confirm before requesting.' },
    { folder: F_IT, expected: false, missing: 'System inventory, licence list, data-processing agreements, security policy, and the breach log.',
      note: 'Listed as outstanding in ', link: { doc: DDR, page: 22, label: '4.2 Due Diligence Report, p. 22.' } },
  ] }],
  sources: [
    { n: 1, doc: F_TAX, quote: '', where: 'Folder · 0 files' },
    { n: 2, doc: F_INS, quote: '', where: 'Folder · 0 files' },
    { n: 3, doc: F_EHS, quote: '', where: 'Folder · 0 files' },
    { n: 4, doc: F_IT, quote: '', where: 'Folder · 0 files' },
    { n: 5, doc: APA_553, quote: 'Annex 4 — Insurance: the Seller shall make available all policies in force and the claims history for the last three years.', where: 'Annex 4 · Page 31', page: 31 },
    { n: 6, doc: DDR, quote: 'IT and data protection — outstanding: system inventory, DPAs, breach log.', where: 'Sheet Outstanding · Page 22', page: 22 },
  ],
  followUps: ['Draft the request list for the seller', 'What else is missing vs the index?'],
  next: 'Draft the request list for the seller?',
  rows: [],
  steps: ['Selected folders', 'Compared them with a standard DD index', 'Checked the documents that mention them'],
  took: '18s',
};

export const V12_REQUEST_LIST: V12Answer = {
  id: 'request',
  title: 'Request list for the seller',
  lead: 'Here is a request list for the seller, ordered by what buyers ask for first. Insurance and IT are already promised in the room, so the request points at those documents [1] [2].',
  blocks: [{ kind: 'table', title: 'Request list', head: ['Folder', 'What to request', 'Source'], rows: [
    { term: '7 Tax', says: 'Tax returns FY2023–25, VAT filings, transfer pricing file, open dispute correspondence', cite: 0, loc: 'DD index' },
    { term: '8 Insurance', says: 'Policies in force, certificates, 3-year claims history, run-off cover', cite: 1, loc: 'p. 31' },
    { term: '10 IT and data protection', says: 'System inventory, licence list, DPAs, security policy, breach log', cite: 2, loc: 'p. 22' },
    { term: '9 EHS', says: 'Permits, audit reports, incident log — only if the target has sites', cite: 0, loc: 'DD index' },
  ] }],
  sources: [
    { n: 1, doc: APA_553, quote: 'Annex 4 — Insurance: the Seller shall make available all policies in force and the claims history for the last three years.', where: 'Annex 4 · Page 31', page: 31 },
    { n: 2, doc: DDR, quote: 'IT and data protection — outstanding: system inventory, DPAs, breach log.', where: 'Sheet Outstanding · Page 22', page: 22 },
  ],
  followUps: ['What else is missing vs the index?', 'Who uploads to 7 Tax?'],
  next: 'Send it to the seller as a Q&A question?',
  rows: [],
  steps: ['Read the four empty folders', 'Matched them with the DD index', 'Drafted the request list'],
  took: '9s',
};

const V12_TEXT = (id: string, title: string, lead: string, items: string[], followUps: string[], next?: string): V12Answer => ({
  id, title, lead, blocks: [{ kind: 'bullets', title: '', items }], sources: [], followUps, next, rows: [],
  steps: ['Read the project settings', 'Checked the room against a standard sell-side setup'], took: '6s',
});

export const V12_READINESS = V12_TEXT('ready', 'Room readiness',
  'The room is not ready for bidders yet. Three things block the launch:',
  ['**Structure:** 4 of 12 folders are empty — Tax, Insurance, EHS and IT.', '**Participants:** no user groups yet, so bidders can’t be invited.', '**Permissions:** all files are open to everyone. Set up group permissions before inviting anyone.'],
  ['Which 4 folders are empty, and what does a standard DD index put in them?', 'Suggest user groups for the bidders'], 'Fix the empty folders first?');

export const V12_STRUCTURE = V12_TEXT('structure', 'Folder structure',
  'For a sell-side room this size, a standard DD index uses 12 top-level folders. You already have them all; four are empty.',
  ['1 Corporate · 2 Legal · 3 Financials · 4 Commercial', '5 HR · 6 IT · 7 Tax · 8 Insurance', '9 Environmental, health and safety · 10 IT and data protection · 11 Real estate · 12 Q&A'],
  ['Which 4 folders are empty, and what does a standard DD index put in them?', 'Check room readiness']);

export const V12_ABILITIES = V12_TEXT('abilities', 'What the assistant can do',
  'I work only with files and settings you can already see in this project. I can:',
  ['Find documents and summarise them, with sources you can open.', 'Check the room against a DD checklist and show what’s missing.', 'Draft Q&A answers, request lists and reports.'],
  ['Check room readiness', 'Suggest a folder structure']);

export const V12_GROUPS = V12_TEXT('groups', 'User groups for bidders',
  'Create one group per bidder so permissions and Q&A stay separate. A typical sell-side setup:',
  ['**Seller team** — full access, can upload.', '**Advisors** — view and download, Q&A experts.', '**Bidder A / B / C** — view only, watermark on, no download for 2 Legal.'],
  ['Which files should be restricted before bidders join?', 'Check room readiness']);

export const V12_RESTRICT = V12_TEXT('restrict', 'Files to restrict',
  'All 1,248 files are open to everyone. Restrict these before inviting bidders:',
  ['**5 HR** — employee contracts and salaries (personal data).', '**2.1 SPA.pdf** drafts — keep v3 and older seller-only.', '**4.3 CoC tracker** — supplier names are commercially sensitive.'],
  ['Suggest user groups for the bidders', 'Check room readiness']);

/** Project brief on the empty state — Figma 622:10383. Hover previews the question, click puts it in the field. */
export const CHAT_BRIEF = [
  { id: 'structure', icon: 'add-folder', title: 'Structure', value: '4 of 12 folders are empty', hint: 'Vs. a standard DD index',
    prompt: 'Which 4 folders are empty, and what does a standard DD index put in them?' },
  { id: 'participants', icon: 'users-groups', title: 'Participants', value: 'No user groups yet', hint: 'Invite bidders when ready',
    prompt: 'Which user groups should I set up for the bidders?' },
  { id: 'permissions', icon: 'nav-permissions', title: 'Permissions', value: 'All files open to everyone', hint: 'Setup permissions',
    prompt: 'Which files should be restricted before bidders join?' },
] as const;

export const CHAT_STARTERS = ['Suggest a folder structure', 'Check room readiness', 'What can the assistant do?'];

/** Follow-up asked in the full assistant → reply. */
export function v12ChatReply(q: string): V12Answer {
  const s = q.toLowerCase();
  if (/empty|missing vs the index|fix the empty/.test(s)) return /else is missing/.test(s) ? V12_READINESS : V12_EMPTY_FOLDERS;
  if (/request list/.test(s)) return V12_REQUEST_LIST;
  if (/readiness|ready/.test(s)) return V12_READINESS;
  if (/folder structure/.test(s)) return V12_STRUCTURE;
  if (/what can the assistant/.test(s)) return V12_ABILITIES;
  if (/user groups|bidders\?$|groups for/.test(s)) return V12_GROUPS;
  if (/restrict|permission/.test(s)) return V12_RESTRICT;
  if (/p&l|p & l|profit/.test(s)) return V12_PL;
  if (/spa/.test(s)) return V12_SPA;
  if (/checklist|gaps/.test(s)) return V12_DD;
  if (/contract|change of control|unsigned|agreement/.test(s)) return V12_CONSENT;
  return V12_REVENUE;
}

/** Split answer text into plain / bold / citation runs. */
export type V12Run = { t: 'text' | 'bold'; s: string } | { t: 'cite'; n: number };
export function runs(text: string): V12Run[] {
  const out: V12Run[] = [];
  const re = /(\*\*[^*]+\*\*|\[\d+\])/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: 'text', s: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ t: 'bold', s: tok.slice(2, -2) });
    else out.push({ t: 'cite', n: Number(tok.slice(1, -1)) });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ t: 'text', s: text.slice(last) });
  return out;
}
