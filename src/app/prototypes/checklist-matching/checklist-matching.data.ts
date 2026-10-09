// Data for the checklist-matching prototype — ported 1:1 from the design reference
// ("Checklist matching — clickable prototype, from upload to results").

export type ReqCls = 'document_request' | 'question' | 'instruction' | 'note';
export type MatchState = 'pending' | 'searching' | 'found' | 'covered' | 'partial' | 'review' | 'gap' | 'na';

export interface Candidate {
  name: string; why: string; verdict: string; missing: string;
  /** Requested vs found period — set when the document is for the wrong date or range. */
  period?: { requested: string; found: string };
  /** The suggestion includes a draft / unexecuted document. */
  draft?: boolean;
  /** Where in the document the match was found. */
  evidence?: { quote: string; page: string };
}
export interface Req {
  id: string; label?: string; sec: string; row: number; text: string; ftype?: string; cls: ReqCls;
  status?: string; final?: 'covered' | 'review' | 'gap'; foundAt?: number; docs?: string[]; why?: string;
  cand?: Candidate; note?: string; near?: { name: string; why: string; evidence?: { quote: string; page: string } }; flag?: boolean; readAs?: string;
  priority?: 'High' | 'Medium' | 'Low'; asAt?: string;
}
export interface DocInfo { path: string; summary: string; folder?: boolean; label?: string; files?: string[]; count?: number; }
export interface FolderNode { id: string; name: string; depth: number; parent?: string; files: string[]; count?: number; link?: string; }

export type ChangeKind = 'reopened' | 'closed' | 'suggested';
export interface Rec {
  s: MatchState | ReqCls;
  docs?: string[]; why?: string; missing?: string;
  change?: { kind: ChangeKind; reason: string };
  reopened?: boolean; rejected?: boolean; requested?: boolean; isNew?: boolean;
  prev?: Rec; reading?: string;
  /** Human decisions on this request — the audit trail shown in the panel. */
  history?: { what: string; who: string; at: string }[];
}

/** One row of the source spreadsheet as the viewer renders it (cells are columns A..H). */
export interface SrcRow { n: number; kind: 'title' | 'meta' | 'header' | 'section' | 'item' | 'blank' | 'legend'; cells: string[]; reqId?: string; }

export interface Scenario {
  id: 'diamond' | 'lighthouse';
  room: string; totalDocs: number; matchedAt: string; extractedOn: string; lastVisit: string;
  fileName: string; tabLabel: string; fileMeta: string;
  sheets: { name: string; rows: number }[];
  side: 'sell' | 'buy';
  hasPriority: boolean;
  sections: { id: string; name: string; src: string; row: number }[];
  reqs: Req[]; docs: Record<string, DocInfo>; folderTree: FolderNode[];
  defaultFolderReq: string; gapsFocus: string;
  /** What AI read around the requests: document details, header row, result columns already in the file. */
  details?: { headerRow: number; metaRows: string; fields: { label: string; value: string }[]; columnsUsed: string[]; resultCols?: string[] };
  /** The file's own Status values, used when results are written back into the file. */
  statusMap?: Record<'covered' | 'partial' | 'review' | 'gap' | 'na', string>;
  source: { cols: string[]; widths: (number | 'fill')[]; selectCols: number[]; resultCols: number[]; build: (reqs: Req[]) => SrcRow[] };
  /** Source file edits made after extraction (Diamond only). */
  edits?: { apply: (list: Req[]) => Req[]; editedBy: string; added: { row: number; text: string }; changed: { row: number; id: string; from: string; to: string } };
  returning: {
    since: string; cands: Record<string, Candidate>; laterFiles: string[]; deleted: string[];
    reopened: { id: string; file: string; by: string; on: string };
    apply: (m: Record<string, Rec>) => void;
  };
}

const D = 'File Upload', L = 'Itemized List', T = 'Short Text', W = 'Workshop';
const R: ReqCls = 'document_request', Q: ReqCls = 'question', I: ReqCls = 'instruction', N: ReqCls = 'note';

export const REQS: Req[] = [
      { id: 'N1', label: '—', sec: 'X', row: 2, text: 'Link to Data Room', cls: N },
      { id: 'A.1', sec: 'A', row: 4, text: 'Business name', ftype: W, cls: R, status: 'In Progress', final: 'covered' as const, foundAt: 0.1, docs: ['Certificate of incorporation.pdf'], why: 'The registered company name is on the certificate of incorporation.' },
      { id: 'A.2', sec: 'A', row: 5, text: 'Legal structure (corporation, LLC, etc.)', ftype: T, cls: R, status: 'Open', final: 'covered' as const, foundAt: 0.14, docs: ['Articles of association 2021.pdf'], why: 'The articles set out the company type: a private company limited by shares.' },
      { id: 'A.3', sec: 'A', row: 6, text: 'Contact information (address, phone, email)', ftype: T, cls: R, status: 'In Progress', final: 'review' as const, foundAt: 0.33, cand: { name: 'Company profile 2026.pdf', why: 'Address and phone match. No email address in the document summary.', verdict: 'Partial', missing: 'Email address' } },
      { id: 'A.4', sec: 'A', row: 7, text: 'Date of establishment', ftype: T, cls: R, status: 'In Progress', final: 'covered' as const, foundAt: 0.1, docs: ['Certificate of incorporation.pdf'], why: 'The incorporation date is on the certificate of incorporation.' },
      { id: 'B.1', sec: 'B', row: 9, text: 'Profit and loss statements (P&L) for the past 3 years + TMM', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.12, docs: ['P&L FY2023–FY2025 audited.pdf', 'P&L TTM Sep 2026.xlsx'], why: 'Audited P&L for FY2023–FY2025 plus a trailing-twelve-month P&L to Sep 2026.' },
      { id: 'B.2', sec: 'B', row: 10, text: 'Balance sheets for the past 3 years + current', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.2, docs: ['Balance sheets FY2023–FY2025.pdf', 'Balance sheet Sep 2026.xlsx'], why: 'Year-end balance sheets for three years and a current one dated Sep 2026.' },
      { id: 'B.3', sec: 'B', row: 11, text: 'Sales YTD broken out by SKU', ftype: D, cls: R, final: 'gap' as const, note: 'No sales report at SKU level in 1,482 documents. Revenue is only reported by customer.' },
      { id: 'B.4', sec: 'B', row: 12, text: 'Payment processor statements (e.g., PayPal, Stripe)', ftype: D, cls: R, final: 'review' as const, foundAt: 0.45, cand: { name: 'Stripe payouts 2025–2026.csv', why: 'Stripe statements match the request. No PayPal statements found.', verdict: 'Partial', missing: 'PayPal statements' } },
      { id: 'B.5', sec: 'B', row: 13, text: "An Excel upload of the company's bank statements for all material bank accounts for the last 24 months", ftype: D, cls: R, final: 'review' as const, foundAt: 0.3, cand: { name: 'Bank statements 2025–2026.xlsx', why: 'Covers one account for 21 of 24 months. Other material accounts not found.', verdict: 'Partial', missing: 'Other material accounts; Oct – Dec 2024' } },
      { id: 'B.6', sec: 'B', row: 14, text: 'Outstanding debts or loans', ftype: L, cls: R, final: 'covered' as const, foundAt: 0.55, docs: ['Debt schedule Sep 2026.xlsx', 'Term loan agreement – HSBC.pdf', 'Revolving credit facility – Barclays.pdf'], why: 'Debt schedule listing all facilities, plus the agreement behind each one.' },
      { id: 'B.7', sec: 'B', row: 15, text: 'business money), with the exact amount and terms for each', ftype: L, cls: R, flag: true, readAs: 'A list of all accounts receivable (people or businesses that owe the business money), with the exact amount and terms for each', final: 'review' as const, foundAt: 0.62, cand: { name: 'AR aging report Sep 2026.xlsx', why: 'Lists receivables by customer with amounts and terms, as requested.', verdict: 'Likely match', missing: '' } },
      { id: 'B.8', sec: 'B', row: 16, text: 'A list of all accounts payable (people or businesses your business owes money) with the exact amount and terms for each customer.', ftype: L, cls: R, final: 'gap' as const, note: 'No accounts payable list or AP aging report found.' },
      { id: 'B.9', sec: 'B', row: 17, text: 'A list of all equipment and other assets that the company leases', ftype: L, cls: R, final: 'gap' as const, note: 'No lease schedule or equipment lease agreements found.' },
      { id: 'B.10', sec: 'B', row: 18, text: "Are there any agreements or operating leases that are not shown in the company's accounts?", ftype: T, cls: Q },
      { id: 'B.11', sec: 'B', row: 19, text: "Are there any major one-off items that have had an impact on the company's performance in the last 3 years?", ftype: T, cls: Q },
      { id: 'B.12', sec: 'B', row: 20, text: 'Have there been any changes in accounting policies in the last 3 years? If so, please list them and give the reasons.', ftype: T, cls: Q },
      { id: 'C.1', sec: 'C', row: 22, text: 'Certificate of incorporation, articles and bylaws', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.08, docs: ['Certificate of incorporation.pdf', 'Articles of association 2021.pdf'], why: 'Incorporation certificate and the current articles of association.' },
      { id: 'C.2', sec: 'C', row: 23, text: 'Material contracts with customers and suppliers', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.35, docs: ['Contracts'], why: 'Every document in this folder is a customer or supplier agreement, so the whole folder is linked.' },
      { id: 'C.3', sec: 'C', row: 24, text: 'Pending or threatened litigation', ftype: L, cls: R, final: 'gap' as const, note: 'No litigation schedule, claims or legal letters found. If there is none, mark it not applicable.' },
      { id: 'C.4', sec: 'C', row: 25, text: 'Intellectual property registrations (trademarks, patents)', ftype: D, cls: R, final: 'review' as const, foundAt: 0.7, cand: { name: 'Trademark certificate – DIAMOND (EUIPO).pdf', why: 'Trademark registration found. No patent documents in the room.', verdict: 'Partial', missing: 'Patents, or confirmation there are none' } },
      { id: 'C.5', sec: 'C', row: 26, text: 'Business licenses and permits', ftype: D, cls: R, final: 'gap' as const, note: 'No licenses or permits found.' },
      { id: 'D.1', sec: 'D', row: 28, text: 'Organizational chart', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.25, docs: ['Org chart Sep 2026.pdf'], why: 'Current company org chart.' },
      { id: 'D.2', sec: 'D', row: 29, text: 'Employee list with titles, start dates and compensation', ftype: L, cls: R, final: 'review' as const, foundAt: 0.5, cand: { name: 'Headcount 2026.xlsx', why: "Titles and start dates match. The document summary doesn't mention compensation.", verdict: 'Partial', missing: 'Compensation' } },
      { id: 'D.3', sec: 'D', row: 30, text: 'Employment agreements for key employees', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.4, docs: ['Key employment agreements'], why: 'The folder holds signed agreements for the CEO, CFO and four senior managers.' },
      { id: 'D.4', sec: 'D', row: 31, text: 'Employee benefit plans', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.66, docs: ['Pension scheme rules.pdf', 'Health insurance plan 2026.pdf', 'Dental plan 2026.pdf', 'Life insurance policy 2026.pdf', '401(k) plan document.pdf', '401(k) summary plan description.pdf', 'Employee stock option plan 2022.pdf', 'Benefits overview for employees 2026.pdf'], why: 'Plan documents for every benefit the company offers: pension, health, dental, life, 401(k) and stock options.' },
      { id: 'E.1', sec: 'E', row: 33, text: 'Federal and state tax returns for the last 3 years', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.15, docs: ['Federal tax return FY2025.pdf', 'Federal tax return FY2024.pdf', 'Federal tax return FY2023.pdf', 'State tax return FY2025.pdf', 'State tax return FY2024.pdf', 'State tax return FY2023.pdf'], why: 'One federal and one state return for each of the last three years.' },
      { id: 'E.2', sec: 'E', row: 34, text: 'Sales tax filings', ftype: D, cls: R, final: 'review' as const, foundAt: 0.58, cand: { name: 'Sales and use tax filings 2024–2025.pdf', why: 'Sales tax returns for two states. Check whether the company files in other states.', verdict: 'Likely match', missing: '' } },
      { id: 'E.3', sec: 'E', row: 35, text: 'Tax audits, notices or open disputes', ftype: D, cls: R, final: 'gap' as const, note: 'No tax audit letters or notices found. If there are none, mark it not applicable.' },
      { id: 'F.1', sec: 'F', row: 37, text: 'Top 10 customers by revenue for FY2025', ftype: L, cls: R, final: 'review' as const, foundAt: 0.78, cand: { name: 'Revenue by customer FY2025.xlsx', why: 'Ranks all customers by FY2025 revenue, so the top 10 can be read directly.', verdict: 'Likely match', missing: '' } },
      { id: 'F.2', sec: 'F', row: 38, text: 'Top 10 suppliers by spend for FY2025', ftype: L, cls: R, final: 'gap' as const, note: 'No supplier spend report found.', near: { name: 'Supplier master list.xlsx', why: 'Lists all suppliers but has no spend figures, so it stayed below the match threshold.' } },
      { id: 'F.3', sec: 'F', row: 39, text: 'Insurance policies currently in force', ftype: D, cls: R, final: 'covered' as const, foundAt: 0.85, docs: ['Insurance schedule 2026.pdf', 'Property and liability policy 2026.pdf', 'D&O policy 2026.pdf', 'Cyber insurance policy 2026.pdf', 'Employers liability policy 2026.pdf'], why: 'The insurance schedule plus every policy it lists, all current.' },
      { id: 'F.4', sec: 'F', row: 40, text: "Describe the company's main operational risks and how they are managed", ftype: T, cls: Q },
      { id: 'I1', label: '—', sec: 'X', row: 42, text: 'All documents should be provided in English. Please put the item # in each file name.', cls: I },
      { id: 'N2', label: '—', sec: 'X', row: 43, text: 'Abbreviations: TMM — trailing twelve months; N/A — not applicable', cls: N }
];

export const DOCS: Record<string, DocInfo> = {
      'Certificate of incorporation.pdf': { path: '01 Corporate', summary: 'Certificate of incorporation with the registered company name, company number and incorporation date (12 May 2014).' },
      'Articles of association 2021.pdf': { path: '01 Corporate', summary: 'Current articles of association, adopted in 2021. Sets out the company type and share classes.' },
      'Company profile 2026.pdf': { path: '01 Corporate', summary: 'Two-page company overview with the registered office address and main phone number.' },
      'Business licenses and permits 2026.pdf': { path: '01 Corporate', summary: 'Current business licenses and operating permits.' },
      'Trademark certificate – DIAMOND (EUIPO).pdf': { path: '01 Corporate / IP', summary: 'EU trademark registration certificate for the DIAMOND word mark.' },
      'Contracts': { folder: true, label: 'Contracts · 14 documents', path: '03 Commercial / Contracts', summary: 'Customer and supplier agreements, all signed.', files: ['MSA – Northwind Retail.pdf', 'Supply agreement – Kestrel Components.pdf', 'Distribution agreement – Alto Group.pdf', 'MSA – Brightline Foods.pdf', 'Framework agreement – Orbis Logistics.pdf'], count: 14 },
      'Supplier master list.xlsx': { path: '03 Commercial', summary: 'List of all active suppliers with contact details. No spend figures.' },
      'P&L FY2023–FY2025 audited.pdf': { path: '04 Finance / Financial statements', summary: 'Audited profit and loss statements for FY2023, FY2024 and FY2025.' },
      'P&L TTM Sep 2026.xlsx': { path: '04 Finance / Financial statements', summary: 'Management P&L for the twelve months to Sep 2026.' },
      'Balance sheets FY2023–FY2025.pdf': { path: '04 Finance / Financial statements', summary: 'Year-end balance sheets for the last three financial years.' },
      'Balance sheet Sep 2026.xlsx': { path: '04 Finance / Financial statements', summary: 'Management balance sheet as of 30 Sep 2026.' },
      'Stripe payouts 2025–2026.csv': { path: '04 Finance / Banking', summary: 'Monthly Stripe payout statements, Jan 2025 – Sep 2026.' },
      'Bank statements 2025–2026.xlsx': { path: '04 Finance / Banking', summary: 'Monthly statements for the operating account at Santander, Jan 2025 – Sep 2026.' },
      'Debt schedule Sep 2026.xlsx': { path: '04 Finance / Debt', summary: 'Schedule of all loans and credit facilities with balances, rates and maturities.' },
      'Term loan agreement – HSBC.pdf': { path: '04 Finance / Debt', summary: 'Five-year term loan agreement with HSBC, signed March 2024.' },
      'AR aging report Sep 2026.xlsx': { path: '04 Finance / Working capital', summary: 'Accounts receivable aging by customer, with balances and payment terms.' },
      'AP aging report Oct 2026.xlsx': { path: '04 Finance / Working capital', summary: 'Accounts payable by supplier, with amounts and payment terms.' },
      'Revenue by customer FY2025.xlsx': { path: '04 Finance / Revenue', summary: 'FY2025 revenue by customer, sorted from highest to lowest.' },
      'Org chart Sep 2026.pdf': { path: '05 HR', summary: 'Current company org chart.' },
      'Headcount 2026.xlsx': { path: '05 HR', summary: 'Employee list with job titles, departments and start dates.' },
      'Key employment agreements': { folder: true, label: 'Key employment agreements · 6 documents', path: '05 HR / Key employment agreements', summary: 'Signed employment agreements for senior staff.', files: ['Employment agreement – CEO.pdf', 'Employment agreement – CFO.pdf', 'Employment agreement – COO.pdf', 'Employment agreement – Head of Sales.pdf', 'Employment agreement – Head of Product.pdf'], count: 6 },
      'Revolving credit facility – Barclays.pdf': { path: '04 Finance / Debt', summary: 'Revolving credit facility agreement with Barclays.' },
      'Equipment lease schedule 2026.xlsx': { path: '07 Operations', summary: 'Schedule of leased equipment with lessor, term and monthly cost.' },
      'Sales by product line YTD 2026.xlsx': { path: '04 Finance / Revenue', summary: 'Year-to-date 2026 sales by product line.' },
      'Supplier spend FY2025.xlsx': { path: '03 Commercial', summary: 'FY2025 spend by supplier, sorted from highest to lowest.' },
      'Dental plan 2026.pdf': { path: '05 HR / Benefits', summary: 'Employee dental plan for 2026.' },
      'Life insurance policy 2026.pdf': { path: '05 HR / Benefits', summary: 'Group life insurance policy for employees.' },
      '401(k) plan document.pdf': { path: '05 HR / Benefits / 401(k)', summary: '401(k) plan document.' },
      '401(k) summary plan description.pdf': { path: '05 HR / Benefits / 401(k)', summary: 'Summary plan description for the 401(k).' },
      'Employee stock option plan 2022.pdf': { path: '05 HR / Equity', summary: 'Employee stock option plan adopted in 2022.' },
      'Benefits overview for employees 2026.pdf': { path: '05 HR / Benefits', summary: 'One-page overview of all employee benefits.' },
      'Federal tax return FY2025.pdf': { path: '06 Tax / Federal', summary: 'Federal corporate tax return for FY2025.' },
      'Federal tax return FY2024.pdf': { path: '06 Tax / Federal', summary: 'Federal corporate tax return for FY2024.' },
      'Federal tax return FY2023.pdf': { path: '06 Tax / Federal', summary: 'Federal corporate tax return for FY2023.' },
      'State tax return FY2025.pdf': { path: '06 Tax / State', summary: 'State corporate tax return for FY2025.' },
      'State tax return FY2024.pdf': { path: '06 Tax / State', summary: 'State corporate tax return for FY2024.' },
      'State tax return FY2023.pdf': { path: '06 Tax / State', summary: 'State corporate tax return for FY2023.' },
      'D&O policy 2026.pdf': { path: '07 Operations / Insurance', summary: 'Directors and officers liability policy for 2026.' },
      'Cyber insurance policy 2026.pdf': { path: '07 Operations / Insurance', summary: 'Cyber insurance policy for 2026.' },
      'Employers liability policy 2026.pdf': { path: '07 Operations / Insurance', summary: 'Employers liability policy for 2026.' },
      'Pension scheme rules.pdf': { path: '05 HR / Benefits', summary: 'Rules of the company pension scheme.' },
      'Health insurance plan 2026.pdf': { path: '05 HR / Benefits', summary: 'Employee health insurance plan for 2026.' },
      'Federal tax returns FY2023–FY2025.pdf': { path: '06 Tax', summary: 'Federal corporate tax returns for FY2023 to FY2025.' },
      'State tax returns FY2023–FY2025.pdf': { path: '06 Tax', summary: 'State corporate tax returns for FY2023 to FY2025.' },
      'Sales and use tax filings 2024–2025.pdf': { path: '06 Tax', summary: 'Quarterly sales and use tax returns for Texas and California, 2024–2025.' },
      'Insurance schedule 2026.pdf': { path: '07 Operations / Insurance', summary: 'Schedule of all insurance policies in force, with insurers and limits.' },
      'Property and liability policy 2026.pdf': { path: '07 Operations / Insurance', summary: 'Combined property and general liability policy for 2026.' }
};

export const FOLDER_TREE: FolderNode[] = [
      { id: 'f01', name: '01 Corporate', depth: 0, files: ['Certificate of incorporation.pdf', 'Articles of association 2021.pdf', 'Company profile 2026.pdf', 'Business licenses and permits 2026.pdf', 'Board minutes 2025.pdf'] },
      { id: 'f01ip', name: 'IP', depth: 1, parent: 'f01', files: ['Trademark certificate – DIAMOND (EUIPO).pdf'] },
      { id: 'f02', name: '02 Real estate', depth: 0, files: ['Property valuation 2024.pdf', 'Site plans 2023.pdf'] },
      { id: 'f03', name: '03 Commercial', depth: 0, files: ['Supplier master list.xlsx', 'Supplier spend FY2025.xlsx'] },
      { id: 'f03c', name: 'Contracts', depth: 1, parent: 'f03', files: [], count: 14, link: 'Contracts' },
      { id: 'f04', name: '04 Finance', depth: 0, files: [] },
      { id: 'f04fs', name: 'Financial statements', depth: 1, parent: 'f04', files: ['P&L FY2023–FY2025 audited.pdf', 'P&L TTM Sep 2026.xlsx', 'Balance sheets FY2023–FY2025.pdf', 'Balance sheet Sep 2026.xlsx'] },
      { id: 'f04b', name: 'Banking', depth: 1, parent: 'f04', files: ['Stripe payouts 2025–2026.csv', 'Bank statements 2025–2026.xlsx'] },
      { id: 'f04d', name: 'Debt', depth: 1, parent: 'f04', files: ['Debt schedule Sep 2026.xlsx', 'Term loan agreement – HSBC.pdf', 'Revolving credit facility – Barclays.pdf'] },
      { id: 'f04w', name: 'Working capital', depth: 1, parent: 'f04', files: ['AR aging report Sep 2026.xlsx', 'AP aging report Oct 2026.xlsx'] },
      { id: 'f04r', name: 'Revenue', depth: 1, parent: 'f04', files: ['Revenue by customer FY2025.xlsx', 'Sales by product line YTD 2026.xlsx', 'Budget 2027.xlsx'] },
      { id: 'f05', name: '05 HR', depth: 0, files: ['Org chart Sep 2026.pdf', 'Headcount 2026.xlsx'] },
      { id: 'f05b', name: 'Benefits', depth: 1, parent: 'f05', files: ['Pension scheme rules.pdf', 'Health insurance plan 2026.pdf', 'Dental plan 2026.pdf', 'Life insurance policy 2026.pdf', 'Benefits overview for employees 2026.pdf'] },
      { id: 'f05k', name: '401(k)', depth: 2, parent: 'f05b', files: ['401(k) plan document.pdf', '401(k) summary plan description.pdf'] },
      { id: 'f05e', name: 'Equity', depth: 1, parent: 'f05', files: ['Employee stock option plan 2022.pdf'] },
      { id: 'f05a', name: 'Key employment agreements', depth: 1, parent: 'f05', files: [], count: 6, link: 'Key employment agreements' },
      { id: 'f06', name: '06 Tax', depth: 0, files: ['Sales and use tax filings 2024–2025.pdf'] },
      { id: 'f06f', name: 'Federal', depth: 1, parent: 'f06', files: ['Federal tax return FY2025.pdf', 'Federal tax return FY2024.pdf', 'Federal tax return FY2023.pdf'] },
      { id: 'f06s', name: 'State', depth: 1, parent: 'f06', files: ['State tax return FY2025.pdf', 'State tax return FY2024.pdf', 'State tax return FY2023.pdf'] },
      { id: 'f07', name: '07 Operations', depth: 0, files: ['Equipment lease schedule 2026.xlsx'] },
      { id: 'f07i', name: 'Insurance', depth: 1, parent: 'f07', files: ['Insurance schedule 2026.pdf', 'Property and liability policy 2026.pdf', 'D&O policy 2026.pdf', 'Cyber insurance policy 2026.pdf', 'Employers liability policy 2026.pdf'] },
      { id: 'f08', name: '08 IT', depth: 0, files: ['IT security policy.pdf', 'Systems overview 2026.pdf'] }
];

// ── Diamond — sell-side master checklist (the original design reference) ──
const D_SECS = [
  { id: 'A', name: 'General information', src: 'General Information:', row: 3 },
  { id: 'B', name: 'Financial and accounting', src: 'Financial and Accounting:', row: 8 },
  { id: 'C', name: 'Legal', src: 'Legal:', row: 21 },
  { id: 'D', name: 'Human resources', src: 'Human Resources:', row: 27 },
  { id: 'E', name: 'Tax', src: 'Tax:', row: 32 },
  { id: 'F', name: 'Operations', src: 'Operations:', row: 36 },
];
const D_COLS = ['', 'Item #', 'Due Diligence Checklist', 'File Type', 'Date Requested', 'Status', 'Notes to Seller', 'Delivered'];

function diamondSource(reqs: Req[]): SrcRow[] {
  const rows: SrcRow[] = [{ n: 1, kind: 'header', cells: D_COLS }];
  D_SECS.forEach(sec => {
    rows.push({ n: sec.row, kind: 'section', cells: [sec.src] });
    let i = 0;
    reqs.filter(q => q.sec === sec.id).forEach(q => { i += 1; rows.push({ n: q.row, kind: 'item', reqId: q.id, cells: ['', String(i), q.text, q.ftype || '', '', q.status || 'Open', '', q.sec === 'A' ? 'FALSE' : ''] }); });
  });
  reqs.filter(q => q.sec === 'X').forEach(q => rows.push({ n: q.row, kind: 'meta', cells: [q.text] }));
  if (!reqs.find(q => q.row === 41)) rows.push({ n: 41, kind: 'blank', cells: [] });
  return rows.sort((a, b) => a.n - b.n);
}

export const DIAMOND: Scenario = {
  id: 'diamond',
  room: 'Diamond', totalDocs: 1482, matchedAt: 'Oct 5, 22:41', extractedOn: 'Oct 5', lastVisit: 'Oct 2',
  fileName: 'Diamond – Due diligence checklist.xlsx', tabLabel: 'Diamond_DD_checklist', fileMeta: '84 KB · 2 sheets',
  sheets: [{ name: 'Master Checklist', rows: 43 }, { name: 'Working copy of the Master Checklist', rows: 43 }],
  side: 'sell', hasPriority: false,
  sections: D_SECS, reqs: REQS, docs: DOCS, folderTree: FOLDER_TREE,
  defaultFolderReq: 'D.4', gapsFocus: 'F.2',
  details: {
    headerRow: 1, metaRows: '',
    fields: [{ label: 'Checklist', value: 'Master Checklist (2 sheets, the second is a working copy)' }],
    columnsUsed: ['Item #', 'Due Diligence Checklist', 'File Type'],
  },
  source: { cols: D_COLS, widths: [40, 72, 'fill', 128, 120, 128, 160, 100], selectCols: [3, 5], resultCols: [], build: diamondSource },
  edits: {
    editedBy: 'Olena K. on Oct 5, 21:10',
    added: { row: 41, text: 'Customer churn analysis for the last 24 months' },
    changed: { row: 13, id: 'B.5', from: '…bank statements for all material bank accounts for the last 24 months', to: '…bank statements for all material bank accounts for the last 36 months' },
    apply: (src) => {
      const list = src.map(r => r.id !== 'B.5' ? r : {
        ...r,
        text: "An Excel upload of the company's bank statements for all material bank accounts for the last 36 months",
        cand: { ...r.cand!, why: 'Covers one account for 21 of 36 months. Other material accounts not found.', missing: 'Other material accounts; Oct 2023 – Dec 2024' },
      });
      const idx = list.findIndex(r => r.id === 'F.4');
      list.splice(idx + 1, 0, { id: 'F.5', sec: 'F', row: 41, text: 'Customer churn analysis for the last 24 months', ftype: 'Itemized List', cls: 'document_request', final: 'gap', note: 'No churn analysis found in 1,482 documents.' });
      return list;
    },
  },
  returning: {
    since: 'Oct 2',
    cands: {
      'B.3': { name: 'Sales by product line YTD 2026.xlsx', why: 'Breaks year-to-date sales down by product line, not by SKU.', verdict: 'Partial', missing: 'SKU-level breakdown' },
      'F.2': { name: 'Supplier spend FY2025.xlsx', why: 'Ranks suppliers by FY2025 spend, so the top 10 can be read directly.', verdict: 'Likely match', missing: '' },
    },
    laterFiles: ['Supplier spend FY2025.xlsx', 'Sales by product line YTD 2026.xlsx', 'Equipment lease schedule 2026.xlsx', 'AP aging report Oct 2026.xlsx', 'Business licenses and permits 2026.pdf'],
    deleted: ['Org chart Sep 2026.pdf'],
    reopened: { id: 'D.1', file: 'Org chart Sep 2026.pdf', by: 'Olena K.', on: 'Oct 6' },
    apply: (m) => {
      m['B.8'] = { s: 'covered', docs: ['AP aging report Oct 2026.xlsx'], why: 'Uploaded on Oct 4. Lists payables by supplier with amounts and terms.', change: { kind: 'closed', reason: 'Gap closed by a new upload: AP aging report Oct 2026.xlsx, uploaded by the seller team on Oct 4' } };
      m['C.5'] = { s: 'covered', docs: ['Business licenses and permits 2026.pdf'], why: 'Uploaded on Oct 3. Current business licenses and operating permits.', change: { kind: 'closed', reason: 'Gap closed by a new upload: Business licenses and permits 2026.pdf, Oct 3' } };
      m['B.9'] = { s: 'covered', docs: ['Equipment lease schedule 2026.xlsx'], why: 'Uploaded on Oct 5. Lists every leased asset with lessor, term and monthly cost.', change: { kind: 'closed', reason: 'Gap closed by a new upload: Equipment lease schedule 2026.xlsx, Oct 5' } };
      m['B.3'] = { s: 'review', change: { kind: 'suggested', reason: 'New suggestion from a file uploaded on Oct 5' } };
      m['F.2'] = { s: 'review', change: { kind: 'suggested', reason: 'New suggestion from a file uploaded on Oct 6' } };
      m['D.1'] = { s: 'gap', reopened: true, change: { kind: 'reopened', reason: 'Reopened: the linked file was deleted by Olena K. on Oct 6' } };
      m['B.7'] = { s: 'covered', docs: ['AR aging report Sep 2026.xlsx'] };
      m['F.1'] = { s: 'covered', docs: ['Revenue by customer FY2025.xlsx'] };
      m['E.2'] = { s: 'covered', docs: ['Sales and use tax filings 2024–2025.pdf'] };
      m['B.4'] = { s: 'partial', docs: ['Stripe payouts 2025–2026.csv'] };
      m['B.5'] = { s: 'partial', docs: ['Bank statements 2025–2026.xlsx'] };
    },
  },
};
