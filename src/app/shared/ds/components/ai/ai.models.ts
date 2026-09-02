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
