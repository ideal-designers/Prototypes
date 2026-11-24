import type { TreeNode } from '../../shared/ds';
import type { FvdrFileType } from '../../shared/ds/components/file-icon/file-icon.component';

/**
 * Project structure the scope picker works on. Names and numbering follow the Figma
 * mockups (AI-Assistant, section "AI assistant - Chat V1.1"): 11 documents in 5 folders.
 */
export const PROJECT_NAME = 'Project Atlas';
export const PROJECT_MARK = 'RN';
export const TOTAL_DOCS = 11;

/** The two documents the revenue example is built from. */
export const REVENUE_AUDIT_ID = 'd-audit';
export const REVENUE_MGMT_ID = 'd-mgmt';

const file = (id: string, label: string, fileType: FvdrFileType): TreeNode => ({ id, label, fileType });
const folder = (id: string, label: string, children: TreeNode[], expanded = false): TreeNode =>
  ({ id, label, fileType: 'folder-colored', children, expanded });

/** Fresh tree per call — fvdr-tree and the picker write node state back. */
export function buildProjectTree(): TreeNode[] {
  return [{
    id: 'root', label: PROJECT_NAME, mark: PROJECT_MARK, expanded: true, children: [
      folder('f1', '1 Financial', [
        file(REVENUE_AUDIT_ID, '1.1 FY2025 audit report.pdf', 'pdf'),
        file('d-budget', '1.2 Budget FY2026.xlsx', 'xls'),
      ]),
      folder('f2', '2 Legal', [
        file('d-spa', '2.1 Share Purchase Agreement.pdf', 'pdf'),
        file('d-litigation', '2.2 Pending litigation register.xlsx', 'xls'),
      ]),
      folder('f3', '3 Commercial', [
        folder('f3-1', '3.1 Customer contracts', [
          folder('f3-1-1', '3.1.1 Framework agreements', [
            file('d-helios', 'Framework Agreement – Helios Retail.pdf', 'pdf'),
          ]),
          file('d-adler', '3.1.2 Supply Agreement – Adler GmbH.pdf', 'pdf'),
          file('d-nordlicht', '3.1.3 Distribution – Nordlicht AG.pdf', 'pdf'),
        ], true),
        folder('f3-2', '3.2 Pricing and discounts', [
          file('d-pricing', 'Pricing policy 2026.xlsx', 'xls'),
        ]),
      ], true),
      folder('f4', '4 HR & employment', [
        file('d-hr', 'Employment agreements register.xlsx', 'xls'),
      ]),
      folder('f5', '5 Management', [
        file('d-board', '5.1 Board minutes Oct 2026.pdf', 'pdf'),
        file(REVENUE_MGMT_ID, '5.2 Management accounts Q4.xlsx', 'xls'),
      ]),
    ],
  }];
}

export const CHAT_THREADS = [
  { id: 'qna', title: 'Open Q&A questions – Project Atlas', pinned: true },
  { id: 'current', title: 'What was our revenue growth in FY2025?' },
  { id: 't1', title: 'Key Financial Highlights' },
  { id: 't2', title: 'Change of control clauses in customer contracts' },
  { id: 't3', title: 'Key financial highlights FY2025' },
  { id: 't4', title: 'Pending litigation and contingent liabilities' },
  { id: 't5', title: 'EBITDA adjustments: FY2023 vs FY2025' },
  { id: 't6', title: 'Which employment agreements have non-competes?' },
  { id: 't7', title: 'IP ownership and license gaps' },
  { id: 't8', title: 'Red flags summary for the IC memo' },
  { id: 't9', title: 'Lease expiry dates for all properties' },
  { id: 't10', title: 'Tax audit findings 2022–2024' },
  { id: 't11', title: 'Top 10 customers by revenue concentration' },
  { id: 't12', title: 'Missing documents in Legal folder' },
  { id: 't13', title: 'GDPR and data privacy compliance review' },
  { id: 't14', title: 'Summarize management presentation' },
];

export const REVENUE_QUESTION = 'What was our revenue growth in FY2025 and what drove it?';
