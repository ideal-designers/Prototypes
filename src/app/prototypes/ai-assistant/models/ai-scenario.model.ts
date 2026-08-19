import { MockDocument } from './mock-doc.model';

/**
 * Mock scenarios the engine can answer.
 *   A  — find / search documents
 *   B  — summarize documents
 *   C1 — compliance: missing signatures
 *   C2 — compliance: due-diligence report draft
 *   D  — create project
 */
export type AiScenarioId = 'A' | 'B' | 'C1' | 'C2' | 'D' | 'fallback';

export type AnswerKind = 'prose' | 'singleDoc' | 'table' | 'summary' | 'ddReport' | 'project';

/** Shared by every answer — set when results were trimmed by permissions. */
interface AnswerBase {
  /** e.g. "Results filtered by permissions — some items may be hidden…" */
  permissionNote?: string;
}

export interface ProseAnswer extends AnswerBase {
  kind: 'prose';
  text: string;
  followUp?: string;
}

export interface SingleDocAnswer extends AnswerBase {
  kind: 'singleDoc';
  intro?: string;
  doc: MockDocument;
  followUp?: string;
}

export interface TableAnswer extends AnswerBase {
  kind: 'table';
  /** One-line lead-in, e.g. "Here is the full list … (6 total):" */
  summary: string;
  docs: MockDocument[];
  /** `signatures` swaps Index/Size for a Signature status column (Scenario C1). */
  variant?: 'default' | 'signatures';
  followUp?: string;
}

/** One cited key point inside a summary. */
export interface SummaryPoint {
  text: string;
  source: MockDocument;
}

export interface SummaryGroup {
  /** Folder name, or document name when the scope is a single folder. */
  title: string;
  /** Set when the group heading itself is a document citation. */
  titleDoc?: MockDocument;
  points: SummaryPoint[];
}

export interface SummaryAnswer extends AnswerBase {
  kind: 'summary';
  scopeLabel: string;
  overview: string;
  groups: SummaryGroup[];
  followUp?: string;
}

export interface DdClaim {
  text: string;
  sourceDoc?: MockDocument;
  sourceFolder?: string;
}

export interface DdSection {
  heading: string;
  claims: DdClaim[];
}

export interface DdReportAnswer extends AnswerBase {
  kind: 'ddReport';
  title: string;
  scopeLabel: string;
  /** Set when the scope could not cover the whole project. */
  partialNote?: string;
  sections: DdSection[];
  followUp?: string;
}

export interface ProjectAnswer extends AnswerBase {
  kind: 'project';
  text: string;
  projectName: string;
  nextSteps: string[];
  followUp?: string;
}

export type AnswerPayload =
  | ProseAnswer
  | SingleDocAnswer
  | TableAnswer
  | SummaryAnswer
  | DdReportAnswer
  | ProjectAnswer;
