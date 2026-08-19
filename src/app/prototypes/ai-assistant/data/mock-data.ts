import { MockDataRoom, MockDocument, MockFolder } from '../models/mock-doc.model';
import { RecentChat } from '../models/ai-message.model';

/** Top-level folders of the "Nike" data room. */
export const MOCK_FOLDERS: MockFolder[] = [
  { id: 'f1', index: '1', name: '1 ODM intellectual property' },
  { id: 'f2', index: '2', name: '2 Intellectual property' },
  { id: 'f3', index: '3', name: '3 Trade secrets' },
  { id: 'f4', index: '4', name: '4 ACME Inc.' },
  { id: 'f5', index: '5', name: '5 ACME Cooperative' },
];

/**
 * Mock corpus. Naming matters — the engine keyword-matches on document names:
 *   · exactly 6 permitted documents contain both "financial" and "report" (multi-result table)
 *   · exactly 1 document contains both "q1" and "analysis"      (single-doc answer)
 *   · `restricted` documents are never surfaced, only disclosed via the permission note
 */
export const MOCK_DOCUMENTS: MockDocument[] = [
  // ── 1 ODM intellectual property ──
  {
    id: 'd-1-1-1', index: '1.1.1', name: 'ODM master licensing agreement.pdf', type: 'pdf',
    folderPath: '1 ODM intellectual property', sizeLabel: '412.05 Kb', pages: 24,
    addedOn: 'January 18, 2026', signatureStatus: '0/2 signed',
    gist: 'Grants ACME a 5-year exclusive manufacturing licence, renewable annually.',
  },
  {
    id: 'd-1-2-1', index: '1.2.1', name: 'ODM design specification pack.pdf', type: 'pdf',
    folderPath: '1 ODM intellectual property', sizeLabel: '2.14 Mb', pages: 48,
    addedOn: 'January 22, 2026', signatureStatus: 'signed',
    gist: 'Full technical specification for the 2026 footwear line, incl. tolerances.',
  },
  {
    id: 'd-1-4-2', index: '1.4.2', name: 'ODM licensing financial report.doc', type: 'doc',
    folderPath: '1 ODM intellectual property', sizeLabel: '128.40 Kb', pages: 9,
    addedOn: 'February 2, 2026',
    gist: 'Licensing revenue of €4.1M in 2025, up 12% year over year.',
  },

  // ── 2 Intellectual property ──
  {
    id: 'd-2-12-1', index: '2.12.1', name: 'IP portfolio financial report.xls', type: 'xls',
    folderPath: '2 Intellectual property', sizeLabel: '183.68 Kb', pages: 12,
    addedOn: 'March 12, 2026',
    gist: 'Values the registered IP portfolio at €18.6M across 42 assets.',
  },
  {
    id: 'd-2-3-4', index: '2.3.4', name: 'Patent assignment deed.pdf', type: 'pdf',
    folderPath: '2 Intellectual property', sizeLabel: '96.12 Kb', pages: 6,
    addedOn: 'February 27, 2026', signatureStatus: '1/2 signed',
    gist: 'Assigns three sole-inventor patents to the target; awaits counter-signature.',
  },
  {
    id: 'd-2-5-1', index: '2.5.1', name: 'Trademark registry export.xls', type: 'xls',
    folderPath: '2 Intellectual property', sizeLabel: '74.90 Kb', pages: 4,
    addedOn: 'March 3, 2026',
    gist: 'Lists 31 live trademarks; 4 renewals fall due within 12 months.',
  },

  // ── 3 Trade secrets ──
  {
    id: 'd-3-1-1', index: '3.1.1', name: 'Confidentiality undertaking.doc', type: 'doc',
    folderPath: '3 Trade secrets', sizeLabel: '58.30 Kb', pages: 3,
    addedOn: 'February 11, 2026', signatureStatus: '0/2 signed',
    gist: 'Standard mutual NDA covering the know-how disclosed during diligence.',
  },
  {
    id: 'd-3-2-2', index: '3.2.2', name: 'Know-how transfer memo.doc', type: 'doc',
    folderPath: '3 Trade secrets', sizeLabel: '44.71 Kb', pages: 5,
    addedOn: 'February 14, 2026',
    gist: 'Describes the transfer plan for proprietary sole-moulding processes.',
  },
  {
    id: 'd-3-4-1', index: '3.4.1', name: 'Settlement terms — confidential.pdf', type: 'pdf',
    folderPath: '3 Trade secrets', sizeLabel: '61.20 Kb', pages: 4,
    addedOn: 'February 19, 2026', restricted: true,
    gist: 'Restricted — not visible with the current access rights.',
  },

  // ── 4 ACME Inc. ──
  {
    id: 'd-4-1-1', index: '4.1.1', name: 'Annual financial report 2025.pdf', type: 'pdf',
    folderPath: '4 ACME Inc.', sizeLabel: '512.22 Kb', pages: 34,
    addedOn: 'March 9, 2026',
    gist: 'Revenue of €142M and EBITDA margin of 14.8% for FY2025.',
  },
  {
    id: 'd-4-1-2', index: '4.1.2', name: 'Q1 financial report 2026.xls', type: 'xls',
    folderPath: '4 ACME Inc.', sizeLabel: '221.06 Kb', pages: 11,
    addedOn: 'April 4, 2026',
    gist: 'Q1 2026 revenue of €38.4M, ahead of plan by 3%.',
  },
  {
    id: 'd-4-2-1', index: '4.2.1', name: 'Consolidated financial report FY2025.doc', type: 'doc',
    folderPath: '4 ACME Inc.', sizeLabel: '341.55 Kb', pages: 27,
    addedOn: 'March 18, 2026',
    gist: 'Consolidates the two operating entities; no qualified audit opinion.',
  },
  {
    id: 'd-4-3-1', index: '4.3.1', name: 'Q1 revenue analysis 2026.doc', type: 'doc',
    folderPath: '4 ACME Inc.', sizeLabel: '165.44 Kb', pages: 8,
    addedOn: 'April 7, 2026',
    gist: 'Breaks Q1 revenue down by channel; wholesale grew fastest at 9%.',
  },
  {
    id: 'd-4-4-2', index: '4.4.2', name: 'Board resolution — dividend.pdf', type: 'pdf',
    folderPath: '4 ACME Inc.', sizeLabel: '88.03 Kb', pages: 2,
    addedOn: 'March 21, 2026', signatureStatus: '0/3 signed',
    gist: 'Approves a €2.5M dividend, conditional on board signatures.',
  },
  {
    id: 'd-4-6-1', index: '4.6.1', name: 'Executive compensation financial report.xls', type: 'xls',
    folderPath: '4 ACME Inc.', sizeLabel: '54.60 Kb', pages: 3,
    addedOn: 'March 25, 2026', restricted: true,
    gist: 'Restricted — not visible with the current access rights.',
  },

  // ── 5 ACME Cooperative ──
  {
    id: 'd-5-1-1', index: '5.1.1', name: 'Cooperative financial report 2025.pdf', type: 'pdf',
    folderPath: '5 ACME Cooperative', sizeLabel: '276.19 Kb', pages: 19,
    addedOn: 'March 15, 2026',
    gist: 'Cooperative turnover of €27M with a €1.9M surplus carried forward.',
  },
  {
    id: 'd-5-2-3', index: '5.2.3', name: 'Member register.xls', type: 'xls',
    folderPath: '5 ACME Cooperative', sizeLabel: '132.88 Kb', pages: 7,
    addedOn: 'February 25, 2026', signatureStatus: '2/2 signed',
    gist: 'Register of 214 members; no transfer restrictions recorded.',
  },
];

export const MOCK_DATA_ROOM: MockDataRoom = {
  id: 'room-nike',
  name: 'Nike',
  folders: MOCK_FOLDERS,
  documents: MOCK_DOCUMENTS,
};

/** Documents the current user may actually see. */
export const PERMITTED_DOCUMENTS = MOCK_DOCUMENTS.filter(d => !d.restricted);

/** Existing project / data-room names — drives the create-project collision check. */
export const MOCK_PROJECT_NAMES = ['Nike'];

/** Seeded "Recents" — transcripts are not persisted yet. */
export const MOCK_RECENTS: RecentChat[] = [
  {
    id: 'chat-seed-1',
    title: 'Financial reports overview',
    lastMessagePreview: 'Here is the full list of financial reports found in data room…',
    updatedAt: 'Yesterday',
  },
  {
    id: 'chat-seed-2',
    title: 'Missing signatures check',
    lastMessagePreview: 'Three documents still await signatures.',
    updatedAt: 'March 14',
  },
];
