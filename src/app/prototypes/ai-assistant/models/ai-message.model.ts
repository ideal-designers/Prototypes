import { AiStep } from './ai-step.model';
import { AnswerPayload, AiScenarioId } from './ai-scenario.model';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** User prompt, or the assistant's plain-text lead-in (kept for copy/aria). */
  text: string;
  createdAt: number;
  /** Assistant only — streamed reasoning rows. */
  steps?: AiStep[];
  /** Assistant only — final rendered payload. */
  answer?: AnswerPayload;
  scenario?: AiScenarioId;
  /** Assistant only — true while steps are still arriving. */
  streaming?: boolean;
  done?: boolean;
  /** True when the user hit Stop mid-stream. */
  cancelled?: boolean;
  /** Steps block expanded/collapsed (auto-collapses when done). */
  stepsExpanded?: boolean;
  /** Assistant only — wall-clock time the streamed reasoning took, for "Thought for Ns". */
  thoughtMs?: number;
}

/** Entry in the left rail's "Recents" list. */
export interface RecentChat {
  id: string;
  title: string;
  lastMessagePreview: string;
  /** Pre-formatted, e.g. "Yesterday" */
  updatedAt: string;
}
