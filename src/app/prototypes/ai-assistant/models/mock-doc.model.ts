/** Mock data-room primitives for the AI Assistant prototype (front-end only). */

export type MockDocType = 'pdf' | 'doc' | 'xls';

export interface MockDocument {
  id: string;
  /** Data-room index, e.g. "2.12.1" */
  index: string;
  name: string;
  type: MockDocType;
  /** Human path of the containing folder, e.g. "2 Intellectual property" */
  folderPath: string;
  /** Pre-formatted size, e.g. "183.68 Kb" */
  sizeLabel: string;
  pages: number;
  /** Pre-formatted date, e.g. "March 12, 2026" */
  addedOn: string;
  /** e.g. "0/2 signed" | "1/2 signed" | "signed". Undefined = no signature flow. */
  signatureStatus?: string;
  /** One-line gist used by the summary renderer. */
  gist?: string;
  /** Outside the current user's permissions — never surfaced, only disclosed as "filtered". */
  restricted?: boolean;
}

export interface MockFolder {
  id: string;
  /** Data-room index, e.g. "2" */
  index: string;
  name: string;
}

export interface MockDataRoom {
  id: string;
  name: string;
  folders: MockFolder[];
  documents: MockDocument[];
}
