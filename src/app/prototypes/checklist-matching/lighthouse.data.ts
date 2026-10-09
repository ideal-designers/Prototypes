// Project Lighthouse — buy-side IRL (test file IRL_Project_Lighthouse.xlsx).
// Header row 5, document details in rows 1–3, result columns F–H filled by the matching system.
import type { Scenario, Req, DocInfo, FolderNode, SrcRow } from './checklist-matching.data';

const R = 'document_request' as const, I = 'instruction' as const, N = 'note' as const;

const REQS: Req[] = [
  { id: '1.1', sec: '1', row: 7, priority: 'High', asAt: 'Current', text: 'Certificate of Incorporation and all amendments thereto, as currently in effect.', cls: R, final: 'covered', foundAt: 0.12, docs: ['Certificate of Incorporation – Delaware.pdf', 'Certificate of Amendment 2023.pdf'], why: 'The Delaware certificate plus the 2023 amendment, the latest one on file.' },
  { id: '1.2', sec: '1', row: 8, priority: 'High', asAt: '31-Aug-2026', text: 'Capitalisation table on a fully diluted basis, showing all classes of shares, options, warrants and convertible instruments.', cls: R, final: 'review', foundAt: 0.3, cand: { name: 'Cap table 30-Jun-2026.xlsx', why: 'Fully diluted, with every share class, option and warrant, but dated 30 Jun 2026.', verdict: 'Partial', evidence: { quote: 'Capitalisation table — fully diluted — as at 30 June 2026', page: 'Sheet “Summary”, A1' }, missing: 'Cap table as at 31-Aug-2026', period: { requested: '31-Aug-2026', found: '30-Jun-2026' } } },
  { id: '1.3', sec: '1', row: 9, priority: 'High', asAt: 'Sep-2024 to Aug-2026', text: 'Minutes of all meetings of the Board of Directors for the 24 months ended 31 August 2026.', cls: R, final: 'review', foundAt: 0.45, cand: { name: 'Board minutes', why: 'Board minutes for Jan 2025 – Jun 2026. Seven months of the requested period are missing.', verdict: 'Partial', evidence: { quote: 'Minutes of a meeting of the Board of Directors held on 14 January 2025', page: 'Board minutes 2025.pdf, p. 1' }, missing: 'Minutes for Sep–Dec 2024 and Jul–Aug 2026', period: { requested: 'Sep-2024 to Aug-2026', found: 'Jan-2025 to Jun-2026' } } },
  { id: '2.1', sec: '2', row: 11, priority: 'High', asAt: 'FY2024-FY2025', text: "Audited financial statements for the two most recently completed fiscal years (FY2024 and FY2025), including auditor's reports and notes.", cls: R, final: 'covered', foundAt: 0.1, docs: ['Audited financial statements FY2025.pdf', 'Audited financial statements FY2024.pdf'], why: "Signed audited statements for both years, each with the auditor's report and notes." },
  { id: '2.2', sec: '2', row: 12, priority: 'High', asAt: 'Jan-Aug 2026', text: 'Monthly management accounts for the current fiscal year to date, including P&L by month against budget.', cls: R, final: 'review', foundAt: 0.38, cand: { name: 'Management accounts Aug 2026 YTD.xlsx', why: 'Monthly P&L for Jan–Aug 2026 with budget and variance columns.', verdict: 'Likely match', missing: '', evidence: { quote: 'P&L by month, Actual vs Budget, Jan–Aug 2026', page: 'Sheet “P&L”, row 1' } } },
  { id: '2.3', sec: '2', row: 13, priority: 'Medium', asAt: '31-Aug-2026', text: 'Accounts receivable ageing schedule, by customer and by ageing bucket.', cls: R, final: 'gap', note: 'No AR ageing as at 31-Aug-2026 in 640 documents.', near: { name: 'AR ageing 30-Jun-2026.xlsx', why: 'Right report, but dated 30 Jun 2026 and without ageing buckets, so it stayed below the match threshold.', evidence: { quote: 'Accounts receivable by customer — as at 30 June 2026', page: 'Sheet “AR”, A1' } } },
  { id: '3.1', sec: '3', row: 15, priority: 'High', asAt: 'Current', text: 'Executed customer agreements with the five largest customers by FY2025 revenue, including all amendments, order forms and side letters.', cls: R, final: 'review', foundAt: 0.6, cand: { name: 'Customer contracts', why: 'Executed agreements for four of the five largest customers. Helios Energy has an MSA but no order forms or side letters.', verdict: 'Partial', missing: 'Order forms and side letters for Helios Energy', evidence: { quote: 'Master Services Agreement between Verdant Grid Technologies, Inc. and Helios Energy LLC', page: 'MSA – Helios Energy.pdf, p. 1' } } },
  { id: '3.2', sec: '3', row: 16, priority: 'Medium', asAt: 'Current', text: 'Standard form of customer master services agreement currently used by the company.', cls: R, final: 'covered', foundAt: 0.2, docs: ['MSA template v4 2026.docx'], why: 'The current customer MSA template, version 4, adopted in 2026.' },
  { id: '3.3', sec: '3', row: 17, priority: 'Medium', asAt: 'Current', text: 'Agreements with suppliers and vendors involving annual spend in excess of $250,000.', cls: R, final: 'gap', note: "No supplier agreements found. The supplier list has no spend figures, so agreements over $250,000 can't be identified." },
  { id: '4.1', sec: '4', row: 19, priority: 'High', asAt: '31-Aug-2026', text: 'Employee census (names may be withheld) listing job title, department, location, start date, FTE status and base salary.', cls: R, final: 'review', foundAt: 0.52, cand: { name: 'Headcount census Aug 2026.xlsx', why: 'Lists title, department, location, start date and FTE status as at 31 Aug 2026. No salary column.', verdict: 'Partial', missing: 'Base salary', evidence: { quote: 'Columns: Job title · Department · Location · Start date · FTE', page: 'Sheet “Census”, row 3' } } },
  { id: '4.2', sec: '4', row: 20, priority: 'High', asAt: 'Current', text: 'Employment agreements for the Chief Executive Officer, Chief Financial Officer, Chief Technology Officer and Chief Revenue Officer.', cls: R, final: 'review', foundAt: 0.7, cand: { name: 'Executive agreements', why: 'Executed CFO agreement found. The CEO agreement is an unsigned draft. Nothing for the CTO or CRO.', verdict: 'Partial', missing: 'Executed CEO agreement; CTO and CRO agreements', draft: true, evidence: { quote: 'DRAFT — subject to board approval — Executive Employment Agreement (Chief Executive Officer)', page: 'CEO employment agreement (draft).docx, p. 1' } } },
  { id: '5.1', sec: '5', row: 22, priority: 'High', asAt: 'Current', text: 'Schedule of all registered intellectual property, including patents, patent applications, trademarks and domain names, with jurisdiction and status.', cls: R, final: 'gap', note: 'No IP schedule found.', near: { name: 'Trademark registrations – USPTO.pdf', why: 'Lists US trademarks only, with no patents or domain names, and is not a schedule.', evidence: { quote: 'United States Patent and Trademark Office — Registration No. 6,214,887 — VERDANT GRID', page: 'p. 1' } } },
  { id: 'L1', label: '—', sec: 'X', row: 25, cls: I, text: 'Yellow columns (Status, Responsive document(s), Notes) are left blank for completion by the matching system or by the disclosing party.' },
  { id: 'L2', label: '—', sec: 'X', row: 26, cls: N, text: 'Permitted Status values: Satisfied | Partially satisfied | Not satisfied | Not applicable.' },
  { id: 'L3', label: '—', sec: 'X', row: 27, cls: I, text: 'Responsive document(s): enter the exact file name(s) of the document(s) relied on; enter one file name per line where several documents together satisfy the request.' },
  { id: 'L4', label: '—', sec: 'X', row: 28, cls: I, text: 'Notes: record any gap, wrong period, draft/unexecuted status, or other reason the request is not fully satisfied.' },
];

const DOCS: Record<string, DocInfo> = {
  'Certificate of Incorporation – Delaware.pdf': { path: '01 Corporate', summary: 'Delaware certificate of incorporation for Verdant Grid Technologies, Inc., filed 2017.' },
  'Certificate of Amendment 2023.pdf': { path: '01 Corporate', summary: 'Certificate of amendment increasing authorised shares, filed March 2023.' },
  'Bylaws 2022.pdf': { path: '01 Corporate', summary: 'Amended and restated bylaws, adopted 2022.' },
  'Cap table 30-Jun-2026.xlsx': { path: '01 Corporate / Equity', summary: 'Fully diluted capitalisation table as at 30 Jun 2026: common, Series A–C preferred, options, warrants and SAFEs.' },
  'Cap table 31-Aug-2026.xlsx': { path: '01 Corporate / Equity', summary: 'Fully diluted capitalisation table as at 31 Aug 2026.' },
  'Option plan 2021.pdf': { path: '01 Corporate / Equity', summary: '2021 equity incentive plan.' },
  'Board minutes': { folder: true, label: 'Board minutes · 2 documents', path: '01 Corporate / Board', summary: 'Board minutes for 2025 and for Jan–Jun 2026.', files: ['Board minutes 2025.pdf', 'Board minutes Jan–Jun 2026.pdf'], count: 2 },
  'Audited financial statements FY2025.pdf': { path: '02 Finance / Audited', summary: 'Audited FY2025 financial statements with auditor\'s report and notes.' },
  'Audited financial statements FY2024.pdf': { path: '02 Finance / Audited', summary: 'Audited FY2024 financial statements with auditor\'s report and notes.' },
  'Management accounts Aug 2026 YTD.xlsx': { path: '02 Finance / Management accounts', summary: 'Monthly management P&L Jan–Aug 2026 against budget, with variance.' },
  'Budget 2026.xlsx': { path: '02 Finance / Management accounts', summary: 'Board-approved budget for 2026.' },
  'AR ageing 30-Jun-2026.xlsx': { path: '02 Finance / Working capital', summary: 'Receivables by customer as at 30 Jun 2026. No ageing buckets.' },
  'AR ageing 31-Aug-2026.xlsx': { path: '02 Finance / Working capital', summary: 'Receivables by customer and ageing bucket as at 31 Aug 2026.' },
  'Customer contracts': { folder: true, label: 'Customer contracts · 9 documents', path: '03 Commercial / Customer contracts', summary: 'Executed agreements with the largest customers.', files: ['MSA – Northwind Utilities.pdf', 'MSA – Brightwater Power.pdf', 'MSA – Calder Grid.pdf', 'MSA – Orion Renewables.pdf', 'MSA – Helios Energy.pdf'], count: 9 },
  'MSA template v4 2026.docx': { path: '03 Commercial', summary: 'Standard customer master services agreement, version 4 (2026).' },
  'Supplier list 2026.xlsx': { path: '03 Commercial', summary: 'Active suppliers with contacts. No spend figures.' },
  'Headcount census Aug 2026.xlsx': { path: '04 People', summary: 'Employee census as at 31 Aug 2026: title, department, location, start date, FTE status.' },
  'Executive agreements': { folder: true, label: 'Executive agreements · 2 documents', path: '04 People / Executive agreements', summary: 'Executive employment agreements.', files: ['CFO employment agreement (executed).pdf', 'CEO employment agreement (draft).docx'], count: 2 },
  'Trademark registrations – USPTO.pdf': { path: '05 IP', summary: 'US trademark registration certificates for VERDANT GRID and the leaf logo.' },
};

const FOLDERS: FolderNode[] = [
  { id: 'l01', name: '01 Corporate', depth: 0, files: ['Certificate of Incorporation – Delaware.pdf', 'Certificate of Amendment 2023.pdf', 'Bylaws 2022.pdf'] },
  { id: 'l01b', name: 'Board', depth: 1, parent: 'l01', files: [], count: 2, link: 'Board minutes' },
  { id: 'l01e', name: 'Equity', depth: 1, parent: 'l01', files: ['Cap table 30-Jun-2026.xlsx', 'Cap table 31-Aug-2026.xlsx', 'Option plan 2021.pdf'] },
  { id: 'l02', name: '02 Finance', depth: 0, files: [] },
  { id: 'l02a', name: 'Audited', depth: 1, parent: 'l02', files: ['Audited financial statements FY2025.pdf', 'Audited financial statements FY2024.pdf'] },
  { id: 'l02m', name: 'Management accounts', depth: 1, parent: 'l02', files: ['Management accounts Aug 2026 YTD.xlsx', 'Budget 2026.xlsx'] },
  { id: 'l02w', name: 'Working capital', depth: 1, parent: 'l02', files: ['AR ageing 30-Jun-2026.xlsx', 'AR ageing 31-Aug-2026.xlsx'] },
  { id: 'l03', name: '03 Commercial', depth: 0, files: ['MSA template v4 2026.docx', 'Supplier list 2026.xlsx'] },
  { id: 'l03c', name: 'Customer contracts', depth: 1, parent: 'l03', files: [], count: 9, link: 'Customer contracts' },
  { id: 'l04', name: '04 People', depth: 0, files: ['Headcount census Aug 2026.xlsx'] },
  { id: 'l04e', name: 'Executive agreements', depth: 1, parent: 'l04', files: [], count: 2, link: 'Executive agreements' },
  { id: 'l05', name: '05 IP', depth: 0, files: ['Trademark registrations – USPTO.pdf'] },
  { id: 'l06', name: '06 Tax', depth: 0, files: ['Federal tax return FY2025.pdf'] },
];

const COLS = ['Ref', 'Section', 'Request', 'Priority', 'Requested as at', 'Status', 'Responsive document(s)', 'Notes'];
const SECS = [
  { id: '1', name: 'Corporate & organisational', src: '1. Corporate & organisational', row: 6 },
  { id: '2', name: 'Financial', src: '2. Financial', row: 10 },
  { id: '3', name: 'Commercial contracts', src: '3. Commercial contracts', row: 14 },
  { id: '4', name: 'Human resources', src: '4. Human resources', row: 18 },
  { id: '5', name: 'Intellectual property', src: '5. Intellectual property', row: 21 },
];

function buildSource(reqs: Req[]): SrcRow[] {
  const rows: SrcRow[] = [
    { n: 1, kind: 'title', cells: ['PROJECT LIGHTHOUSE - INFORMATION REQUEST LIST (EXTRACT)'] },
    { n: 2, kind: 'meta', cells: ['Target: Verdant Grid Technologies, Inc.  |  Requesting party: Aureus Capital Partners LLC (buy-side)  |  Counsel: Harrow & Finch LLP  |  Issued: 3 September 2026'] },
    { n: 3, kind: 'meta', cells: ['Extract covering Sections 1-5 only. All requests are as at the most recent month-end (31 August 2026) unless stated otherwise.'] },
    { n: 4, kind: 'blank', cells: [] },
    { n: 5, kind: 'header', cells: COLS },
  ];
  SECS.forEach(s => {
    rows.push({ n: s.row, kind: 'section', cells: [s.src] });
    reqs.filter(r => r.sec === s.id).forEach(r => rows.push({ n: r.row, kind: 'item', reqId: r.id, cells: [r.id, s.name, r.text, r.priority || '', r.asAt || '', '', '', ''] }));
  });
  rows.push({ n: 23, kind: 'blank', cells: [] });
  rows.push({ n: 24, kind: 'legend', cells: ['LEGEND'] });
  reqs.filter(r => r.sec === 'X').forEach(r => rows.push({ n: r.row, kind: 'meta', cells: [r.text] }));
  return rows.sort((a, b) => a.n - b.n);
}

export const LIGHTHOUSE: Scenario = {
  id: 'lighthouse',
  room: 'Lighthouse', totalDocs: 640, matchedAt: 'Sep 9, 14:20', extractedOn: 'Sep 9', lastVisit: 'Sep 9',
  fileName: 'IRL_Project_Lighthouse.xlsx', tabLabel: 'IRL_Project_Lighthouse', fileMeta: '9 KB · 1 sheet',
  sheets: [{ name: 'IRL', rows: 28 }],
  side: 'buy', hasPriority: true,
  sections: SECS, reqs: REQS, docs: DOCS, folderTree: FOLDERS,
  defaultFolderReq: '4.2', gapsFocus: '2.3',
  details: {
    headerRow: 5, metaRows: 'rows 1–3',
    fields: [
      { label: 'Checklist', value: 'Project Lighthouse – Information request list (extract)' },
      { label: 'Target', value: 'Verdant Grid Technologies, Inc.' },
      { label: 'Requesting party', value: 'Aureus Capital Partners LLC (buy-side)' },
      { label: 'Counsel', value: 'Harrow & Finch LLP' },
      { label: 'Issued', value: '3 Sep 2026' },
      { label: 'Default period', value: 'As at 31 Aug 2026, unless a request says otherwise' },
    ],
    columnsUsed: ['Ref', 'Section', 'Request', 'Priority', 'Requested as at'],
    resultCols: ['Status', 'Responsive document(s)', 'Notes'],
  },
  statusMap: { covered: 'Satisfied', partial: 'Partially satisfied', review: '', gap: 'Not satisfied', na: 'Not applicable' },
  source: { cols: COLS, widths: [56, 150, 'fill', 80, 130, 130, 220, 200], selectCols: [], resultCols: [5, 6, 7], build: buildSource },
  returning: {
    since: 'Sep 9',
    cands: { '1.2': { name: 'Cap table 31-Aug-2026.xlsx', why: 'Fully diluted cap table as at 31 Aug 2026, as requested.', verdict: 'Likely match', missing: '' } },
    laterFiles: ['AR ageing 31-Aug-2026.xlsx', 'Cap table 31-Aug-2026.xlsx'],
    deleted: ['MSA template v4 2026.docx'],
    reopened: { id: '3.2', file: 'MSA template v4 2026.docx', by: 'Mark T.', on: 'Sep 12' },
    apply: (m) => {
      m['2.3'] = { s: 'covered', docs: ['AR ageing 31-Aug-2026.xlsx'], why: 'Uploaded on Sep 11. Receivables by customer and ageing bucket as at 31 Aug 2026.', change: { kind: 'closed', reason: 'Gap closed by a new upload: AR ageing 31-Aug-2026.xlsx, uploaded by the seller on Sep 11' } };
      m['1.2'] = { s: 'review', change: { kind: 'suggested', reason: 'New suggestion from a file uploaded on Sep 11' } };
      m['3.2'] = { s: 'gap', reopened: true, change: { kind: 'reopened', reason: 'Reopened: the linked file was deleted by Mark T. on Sep 12' } };
      m['2.2'] = { s: 'covered', docs: ['Management accounts Aug 2026 YTD.xlsx'] };
      m['4.1'] = { s: 'partial', docs: ['Headcount census Aug 2026.xlsx'], missing: 'Base salary' };
    },
  },
};
