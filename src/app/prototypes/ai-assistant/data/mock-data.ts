import {
  MockDataRoom,
  MockDocument,
  MockFolder,
  formatSizeKb,
} from '../models/mock-doc.model';
import { RecentChat } from '../models/ai-message.model';

/**
 * One dataset for the whole prototype: the assistant answers from it and the
 * product-replica pages under `product/` render from it, so the table behind the
 * assistant can never disagree with the documents the assistant cites.
 *
 * Conventions copied from the live product (`.design/real-product-spec.md` §4.4):
 * indices nest under their folder (`1`, `1.1`, `1.2`…), sizes read `KB`/`MB`,
 * dates read `Mon D, YYYY`, and files the product does not paginate (video)
 * carry no page count at all.
 */

/** Top-level folders of the "Nike" data room. */
export const MOCK_FOLDERS: MockFolder[] = [
  { id: 'f1', index: '1', name: '1 ODM intellectual property', addedOn: 'Jan 15, 2026', published: true, labels: ['IP', 'Supply chain'] },
  { id: 'f2', index: '2', name: '2 Intellectual property', addedOn: 'Feb 24, 2026', published: true, labels: ['IP'] },
  { id: 'f3', index: '3', name: '3 Trade secrets', addedOn: 'Feb 10, 2026', published: false, labels: ['Legal', 'Confidential', 'Priority'] },
  { id: 'f4', index: '4', name: '4 ACME Inc.', addedOn: 'Mar 6, 2026', published: true, labels: ['Finance', 'Priority'] },
  { id: 'f5', index: '5', name: '5 ACME Cooperative', addedOn: 'Feb 22, 2026', published: true, labels: ['Finance'] },
];

/** A document before `sizeLabel` is derived from `sizeKb`. */
type MockDocSeed = Omit<MockDocument, 'sizeLabel'>;

/**
 * Mock corpus. Naming matters — the engine keyword-matches on document names:
 *   · exactly 6 permitted documents contain both "financial" and "report" (multi-result table)
 *   · exactly 1 document contains both "q1" and "analysis"      (single-doc answer)
 *   · `restricted` documents are never surfaced, only disclosed via the permission note
 *   · the DD-report builder cites documents by name prefix — "Annual", "Trademark", "Know-how"
 *
 * `labels` and `version` are presentation-only — the Documents table renders the
 * folder-level labels, the file listings print "v3" after a name — so they never
 * take part in matching and can be added to any document safely.
 */
const MOCK_DOCUMENT_SEEDS: MockDocSeed[] = [
  // ── 1 ODM intellectual property ──
  {
    id: 'd-1-1', index: '1.1', name: 'ODM master licensing agreement.pdf', type: 'pdf',
    folderPath: '1 ODM intellectual property', sizeKb: 412.05, pages: 24,
    addedOn: 'Jan 18, 2026', signatureStatus: '0/2 signed',
    version: 2, labels: ['IP', 'Legal'],
    gist: 'Grants ACME a 5-year exclusive manufacturing licence, renewable annually.',
  },
  {
    id: 'd-1-2', index: '1.2', name: 'ODM design specification pack.pdf', type: 'pdf',
    folderPath: '1 ODM intellectual property', sizeKb: 2190, pages: 48,
    addedOn: 'Jan 22, 2026', signatureStatus: 'signed',
    gist: 'Full technical specification for the 2026 footwear line, incl. tolerances.',
  },
  {
    id: 'd-1-3', index: '1.3', name: 'ODM licensing financial report.docx', type: 'docx',
    folderPath: '1 ODM intellectual property', sizeKb: 128.4, pages: 9,
    addedOn: 'Feb 2, 2026',
    gist: 'Licensing revenue of €4.1M in 2025, up 12% year over year.',
  },
  {
    // Scanned image — the Scenario B edge case for an unsupported file type.
    id: 'd-1-4', index: '1.4', name: 'ODM factory audit certificate.jpg', type: 'jpg',
    folderPath: '1 ODM intellectual property', sizeKb: 1148, pages: 1,
    addedOn: 'Feb 5, 2026',
    gist: 'Scanned certificate — image only, no text layer, so it cannot be summarized.',
  },
  {
    id: 'd-1-5', index: '1.5', name: 'ODM supplier call notes.txt', type: 'txt',
    folderPath: '1 ODM intellectual property', sizeKb: 2.21, pages: 1,
    addedOn: 'Feb 6, 2026',
    gist: 'Notes from three supplier calls; two tooling lead times are still open.',
  },

  // ── 2 Intellectual property ──
  {
    id: 'd-2-1', index: '2.1', name: 'IP portfolio financial report.xlsx', type: 'xlsx',
    folderPath: '2 Intellectual property', sizeKb: 183.68, pages: 12,
    addedOn: 'Mar 12, 2026',
    gist: 'Values the registered IP portfolio at €18.6M across 42 assets.',
  },
  {
    id: 'd-2-2', index: '2.2', name: 'Patent assignment deed.pdf', type: 'pdf',
    folderPath: '2 Intellectual property', sizeKb: 96.12, pages: 6,
    addedOn: 'Feb 27, 2026', signatureStatus: '1/2 signed',
    gist: 'Assigns three sole-inventor patents to the target; awaits counter-signature.',
  },
  {
    id: 'd-2-3', index: '2.3', name: 'Trademark registry export.xlsx', type: 'xlsx',
    folderPath: '2 Intellectual property', sizeKb: 74.9, pages: 4,
    addedOn: 'Mar 3, 2026', labels: ['IP', 'Priority'],
    gist: 'Lists 31 live trademarks; 4 renewals fall due within 12 months.',
  },
  {
    id: 'd-2-4', index: '2.4', name: 'Patent family overview.docx', type: 'docx',
    folderPath: '2 Intellectual property', sizeKb: 52.53, pages: 7,
    addedOn: 'Mar 5, 2026',
    gist: 'Maps 42 patents onto 11 families with their territorial coverage.',
  },

  // ── 3 Trade secrets ──
  {
    id: 'd-3-1', index: '3.1', name: 'Confidentiality undertaking.docx', type: 'docx',
    folderPath: '3 Trade secrets', sizeKb: 58.3, pages: 3,
    addedOn: 'Feb 11, 2026', signatureStatus: '0/2 signed',
    gist: 'Standard mutual NDA covering the know-how disclosed during diligence.',
  },
  {
    id: 'd-3-2', index: '3.2', name: 'Know-how transfer memo.docx', type: 'docx',
    folderPath: '3 Trade secrets', sizeKb: 44.71, pages: 5,
    addedOn: 'Feb 14, 2026',
    gist: 'Describes the transfer plan for proprietary sole-moulding processes.',
  },
  {
    id: 'd-3-3', index: '3.3', name: 'Process handover notes.txt', type: 'txt',
    folderPath: '3 Trade secrets', sizeKb: 6.8, pages: 2,
    addedOn: 'Feb 17, 2026',
    gist: 'Shop-floor handover checklist for the two protected moulding lines.',
  },
  {
    id: 'd-3-4', index: '3.4', name: 'Settlement terms — confidential.pdf', type: 'pdf',
    folderPath: '3 Trade secrets', sizeKb: 61.2, pages: 4,
    addedOn: 'Feb 19, 2026', restricted: true,
    gist: 'Restricted — not visible with the current access rights.',
  },

  // ── 4 ACME Inc. ──
  {
    id: 'd-4-1', index: '4.1', name: 'Annual financial report 2025.pdf', type: 'pdf',
    folderPath: '4 ACME Inc.', sizeKb: 3604, pages: 34,
    addedOn: 'Mar 9, 2026', version: 3, labels: ['Finance'],
    gist: 'Revenue of €142M and EBITDA margin of 14.8% for FY2025.',
  },
  {
    id: 'd-4-2', index: '4.2', name: 'Q1 financial report 2026.xlsx', type: 'xlsx',
    folderPath: '4 ACME Inc.', sizeKb: 221.06, pages: 11,
    addedOn: 'Apr 4, 2026',
    gist: 'Q1 2026 revenue of €38.4M, ahead of plan by 3%.',
  },
  {
    id: 'd-4-3', index: '4.3', name: 'Consolidated financial report FY2025.docx', type: 'docx',
    folderPath: '4 ACME Inc.', sizeKb: 1372, pages: 27,
    addedOn: 'Mar 18, 2026',
    gist: 'Consolidates the two operating entities; no qualified audit opinion.',
  },
  {
    id: 'd-4-4', index: '4.4', name: 'Q1 revenue analysis 2026.docx', type: 'docx',
    folderPath: '4 ACME Inc.', sizeKb: 165.44, pages: 8,
    addedOn: 'Apr 7, 2026',
    gist: 'Breaks Q1 revenue down by channel; wholesale grew fastest at 9%.',
  },
  {
    id: 'd-4-5', index: '4.5', name: 'Board resolution — dividend.pdf', type: 'pdf',
    folderPath: '4 ACME Inc.', sizeKb: 88.03, pages: 2,
    addedOn: 'Mar 21, 2026', signatureStatus: '0/3 signed',
    gist: 'Approves a €2.5M dividend, conditional on board signatures.',
  },
  {
    // Video — the product paginates nothing here, so `pages` stays unset.
    id: 'd-4-6', index: '4.6', name: 'Management presentation recording.mp4', type: 'mp4',
    folderPath: '4 ACME Inc.', sizeKb: 2918,
    addedOn: 'Apr 10, 2026',
    gist: 'Recorded management presentation — video, so it cannot be summarized.',
  },
  {
    id: 'd-4-7', index: '4.7', name: 'Executive compensation financial report.xlsx', type: 'xlsx',
    folderPath: '4 ACME Inc.', sizeKb: 54.6, pages: 3,
    addedOn: 'Mar 25, 2026', restricted: true,
    gist: 'Restricted — not visible with the current access rights.',
  },

  // ── 5 ACME Cooperative ──
  {
    id: 'd-5-1', index: '5.1', name: 'Cooperative financial report 2025.pdf', type: 'pdf',
    folderPath: '5 ACME Cooperative', sizeKb: 474.7, pages: 19,
    addedOn: 'Mar 15, 2026',
    gist: 'Cooperative turnover of €27M with a €1.9M surplus carried forward.',
  },
  {
    id: 'd-5-2', index: '5.2', name: 'Member register.xls', type: 'xls',
    folderPath: '5 ACME Cooperative', sizeKb: 132.88, pages: 7,
    addedOn: 'Feb 25, 2026', signatureStatus: '2/2 signed',
    gist: 'Register of 214 members; no transfer restrictions recorded.',
  },
  {
    id: 'd-5-3', index: '5.3', name: 'Cooperative bylaws.pdf', type: 'pdf',
    folderPath: '5 ACME Cooperative', sizeKb: 986.42, pages: 22,
    addedOn: 'Mar 2, 2026', signatureStatus: '0/2 signed',
    gist: 'Restated bylaws adopted in 2024; the signature packet is still open.',
  },
];

/** Size labels are derived, never written by hand, so they cannot drift. */
export const MOCK_DOCUMENTS: MockDocument[] = MOCK_DOCUMENT_SEEDS.map(d => ({
  ...d,
  sizeLabel: formatSizeKb(d.sizeKb),
}));

export const MOCK_DATA_ROOM: MockDataRoom = {
  id: 'room-nike',
  name: 'Nike',
  folders: MOCK_FOLDERS,
  documents: MOCK_DOCUMENTS,
};

/** Documents the current user may actually see. */
export const PERMITTED_DOCUMENTS = MOCK_DOCUMENTS.filter(d => !d.restricted);

/** Two-letter project mark, derived the way the product derives its branded logo. */
export const MOCK_PROJECT_MARK = MOCK_DATA_ROOM.name.slice(0, 2).toUpperCase();

/** Existing project / data-room names — drives the create-project collision check. */
export const MOCK_PROJECT_NAMES = ['Nike'];

/** Per-folder totals — the Documents and Data storage tables both read these. */
export interface FolderRollup {
  folder: MockFolder;
  documents: MockDocument[];
  files: number;
  sizeKb: number;
}

export const FOLDER_ROLLUPS: FolderRollup[] = MOCK_FOLDERS.map(folder => {
  const documents = PERMITTED_DOCUMENTS.filter(d => d.folderPath === folder.name);
  return {
    folder,
    documents,
    files: documents.length,
    sizeKb: documents.reduce((acc, d) => acc + d.sizeKb, 0),
  };
});

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
    lastMessagePreview: 'Five documents still await signatures.',
    updatedAt: 'March 14',
  },
];
