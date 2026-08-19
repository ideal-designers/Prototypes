/** A single streamed reasoning/result row inside an assistant turn. */

export type AiStepKind = 'thought' | 'result';

export interface AiStep {
  id: string;
  /** Short row label, e.g. "Thought" or "Found 6 results" */
  label: string;
  kind: AiStepKind;
  /** Optional detail shown after the ▸ separator */
  detail?: string;
  done: boolean;
}
