/**
 * Shared shapes for the AI Assistant section.
 * Kept product-agnostic: a doc reference, a summary, a report, a turn, a thread —
 * nothing that ties the components to one mock scenario.
 */

import type { FvdrFileType } from '../file-icon/file-icon.component';
import type { AiStep } from './ai-steps/ai-step.model';
import type { AiRating } from './ai-actions/ai-actions.component';

/** A document or folder the assistant referenced or returned. */
export interface AiDocRef {
  id: string;
  name: string;
  type: FvdrFileType;
  /** e.g. "/Financials/FY23" */
  folderPath?: string;
  /** Document index as shown in the room, e.g. "4.5" */
  index?: string | number;
  size?: string;
  /** Page the claim was drawn from. */
  page?: number;
  /** Free-form column value, e.g. "0/2 signed". */
  status?: string;
  /** Colour hint for the status pill. */
  statusVariant?: 'success' | 'warning' | 'error' | 'neutral';
  /** ISO or pre-formatted date, shown in table variants. */
  modified?: string;
}

export interface AiSummaryPoint {
  text: string;
  source?: AiDocRef;
}

export interface AiSummaryGroup {
  /** Folder name, or the document name when the group heading is itself a citation. */
  title: string;
  titleDoc?: AiDocRef;
  points: AiSummaryPoint[];
}

export type AiSeverity = 'high' | 'medium' | 'low';

export interface AiFinding {
  text: string;
  severity?: AiSeverity;
  sources?: AiDocRef[];
}

export interface AiReportSection {
  heading: string;
  findings: AiFinding[];
}

export type AiChatRole = 'user' | 'assistant';

/** One turn in a transcript. */
export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  /** User prompt, or the assistant's markdown answer. */
  text: string;
  createdAt?: number;
  /** Assistant only — streamed reasoning rows. */
  steps?: AiStep[];
  streaming?: boolean;
  done?: boolean;
  cancelled?: boolean;
  stepsExpanded?: boolean;
  /** Wall-clock time the reasoning took, for "Thought for Ns". */
  thoughtMs?: number;
  rating?: AiRating;
  /** Sources behind the answer. */
  sources?: AiDocRef[];
  /** Set when retrieval was trimmed by the reader's access. */
  permissionNote?: string;
  hiddenCount?: number;
  /** Set when the turn failed. */
  error?: string;
  errorVariant?: 'timeout' | 'rate-limit' | 'unavailable' | 'permission' | 'generic';
}

/** Entry in the assistant's history rail. */
export interface AiThread {
  id: string;
  title: string;
  lastMessagePreview?: string;
  /** Pre-formatted, e.g. "Yesterday" or "2 Mar". */
  updatedAt: string;
  pinned?: boolean;
}

/** What the assistant is currently allowed to look at. */
export type AiScopeKind = 'room' | 'folder' | 'document' | 'selection';

export const AI_SCOPE_ICON: Record<AiScopeKind, FvdrFileType> = {
  room: 'folder-files',
  folder: 'folder',
  document: 'pdf',
  selection: 'placeholder',
};

// ── V1.1: chat scope, sources panel, answer coverage ─────────────────────────

/** A folder or file in the scope picker tree. Folders carry children; files are leaves. */
export interface AiScopeNode {
  id: string;
  name: string;
  type: FvdrFileType;
  /** Parent path shown under a file in the dialog's Selected list, e.g. "3. Commercial". */
  path?: string;
  children?: AiScopeNode[];
}

/** One file in the Sources panel "By file" view, with the citation numbers it backs. */
export interface AiSourceFile {
  doc: AiDocRef;
  /** Where in the file: "Page 14, 18", "Sheet “Revenue”", "Section 2 · Pages 9–10". */
  locator?: string;
  citations: number[];
  /** Version marker when the cited version is not the latest, e.g. "v2". */
  version?: string;
}

export interface AiSourceFolder {
  name: string;
  files: AiSourceFile[];
}

/** One citation in the "By question" view. */
export interface AiSourceCitation {
  n: number;
  doc: AiDocRef;
  locator?: string;
  /** The quoted passage, shown when the citation is opened. */
  quote?: string;
}

export interface AiSourceQuestion {
  question: string;
  citations: AiSourceCitation[];
}

/**
 * How much of the question the answer could cover inside the chat's scope.
 *  complete  — all requested data found in the whole-project scope
 *  narrowed  — all data found, but the user narrowed the scope (folders / files)
 *  partial   — some data was not found in scope
 *  not-found — nothing in scope; the assistant does not guess
 */
export type AiCoverageState = 'complete' | 'narrowed' | 'partial' | 'not-found';
