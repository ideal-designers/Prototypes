/** Mock data-room primitives for the AI Assistant prototype (front-end only). */

import type { FvdrFileType, FvdrIconName } from '../../../shared/ds';

/**
 * Extensions the live product room actually holds
 * (`.design/real-product-spec.md` §4.4: txt, docx, pdf, xls, xlsx, mp4, jpg).
 */
export type MockDocType = 'txt' | 'docx' | 'pdf' | 'xls' | 'xlsx' | 'mp4' | 'jpg';

/**
 * DS file-icon glyph per extension. The DS set has no docx/xlsx/mp4/jpg entries,
 * so those fall back to the closest sibling (doc / xls / video / image).
 */
export const DOC_FILE_ICON: Record<MockDocType, FvdrFileType> = {
  txt: 'txt',
  docx: 'doc',
  pdf: 'pdf',
  xls: 'xls',
  xlsx: 'xls',
  mp4: 'video',
  jpg: 'image',
};

/** Icon-font glyph per extension, used by the product-replica tables. */
export const DOC_ROW_ICON: Record<MockDocType, FvdrIconName> = {
  txt: 'note',
  docx: 'documents',
  pdf: 'perm-pdf',
  xls: 'table-view',
  xlsx: 'table-view',
  mp4: 'video',
  jpg: 'image',
};

export interface MockDocument {
  id: string;
  /** Data-room index — folder number plus child position, e.g. "2.3" */
  index: string;
  name: string;
  type: MockDocType;
  /** Human path of the containing folder, e.g. "2 Intellectual property" */
  folderPath: string;
  /** Raw size in KB — the single source the labels and storage totals derive from. */
  sizeKb: number;
  /** Size in the product's own formatting, e.g. "474.7 KB" / "3.52 MB". */
  sizeLabel: string;
  /** Absent for files the product does not paginate (video). */
  pages?: number;
  /** Pre-formatted date in the product's form, e.g. "Mar 12, 2026" */
  addedOn: string;
  /** e.g. "0/2 signed" | "1/2 signed" | "signed". Undefined = no signature flow. */
  signatureStatus?: string;
  /** One-line gist used by the summary renderer. */
  gist?: string;
  /** Outside the current user's permissions — never surfaced, only disclosed as "filtered". */
  restricted?: boolean;
  /**
   * Publishing state shown by the Documents table's Publishing column. Only set
   * on documents a replica table actually lists (the room-root files).
   */
  published?: boolean;
  /** Labels the room's admins pinned on the file, e.g. ["Legal", "Priority"]. */
  labels?: string[];
  /** Current version number — the product prints "v3" after the name from v2 up. */
  version?: number;
}

export interface MockFolder {
  id: string;
  /** Data-room index, e.g. "2" */
  index: string;
  /** Full name including the index prefix, e.g. "2 Intellectual property" */
  name: string;
  /** Pre-formatted creation date, e.g. "Feb 24, 2026" */
  addedOn: string;
  /** Publishing state — the Documents table renders a glyph per row. */
  published: boolean;
  /** Labels pinned on the folder, e.g. ["IP", "Priority"]. */
  labels?: string[];
}

export interface MockDataRoom {
  id: string;
  name: string;
  folders: MockFolder[];
  documents: MockDocument[];
}

/** "412.05" → "412.05", "128.40" → "128.4" — the product trims trailing zeros. */
const trim2 = (n: number): string => n.toFixed(2).replace(/\.?0+$/, '');

/** Product size formatting: KB below 1 MB, MB above, two decimals, zeros trimmed. */
export function formatSizeKb(kb: number): string {
  return kb < 1024 ? `${trim2(kb)} KB` : `${trim2(kb / 1024)} MB`;
}

/** Reports pages always show MB with two decimals, e.g. "0.60 MB". */
export function formatSizeMb(kb: number): string {
  return `${(kb / 1024).toFixed(2)} MB`;
}

/** "1 page" / "4 pages". */
export function pagesLabel(pages: number): string {
  return `${pages} ${pages === 1 ? 'page' : 'pages'}`;
}

/**
 * "412.05 KB · 24 pages", or just the size for files with no page count.
 * Every renderer goes through this so a page-less file never shows a bare "·".
 */
export function docSizeMeta(doc: MockDocument): string {
  return doc.pages ? `${doc.sizeLabel} · ${pagesLabel(doc.pages)}` : doc.sizeLabel;
}

/** "2 Intellectual property" → "Intellectual property" (the Name column drops the index). */
export function folderDisplayName(name: string): string {
  return name.replace(/^\d+\s+/, '');
}
