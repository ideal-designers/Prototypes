import { Injectable, inject, signal } from '@angular/core';
import { AiConversationService } from './ai-conversation.service';
import { AiStep } from '../models/ai-step.model';
import {
  AiScenarioId,
  AnswerPayload,
  DdSection,
  SummaryGroup,
} from '../models/ai-scenario.model';
import { MockDocument, docSizeMeta } from '../models/mock-doc.model';
import { MOCK_DATA_ROOM, MOCK_DOCUMENTS, PERMITTED_DOCUMENTS } from '../data/mock-data';
import { AiLlmService, LlmResult } from './ai-llm.service';

interface AiPlan {
  scenario: AiScenarioId;
  steps: AiStep[];
  answer: AnswerPayload;
  /** Ran once the answer is attached — used by Scenario D to open the modal. */
  effect?: () => void;
}

interface ResolvedScope {
  label: string;
  folderName?: string;
  docs: MockDocument[];
  /** Scope contains documents the user may not see. */
  filtered: boolean;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'of', 'for', 'and', 'to', 'is', 'are', 'my', 'our', 'on', 'at',
  'it', 'with', 'please', 'me', 'all', 'this', 'that', 'any', 'from', 'do', 'does', 'can',
  'you', 'i', 'show', 'find', 'list', 'search', 'get', 'give', 'open', 'where', 'look',
  'locate', 'which', 'what', 'there', 'room', 'data', 'file', 'files',
]);

const FIND_INTENT = /\b(find|show|search|locate|where|list|open|give me|get me|look for)\b/;
const SUMMARIZE_INTENT = /\bsummari[sz]e|\bsummary\b|\bwhat('s| is) in\b/;
const SIGNATURE_INTENT = /missing signature|needs? signing|need to be signed|unsigned|awaiting signature|not signed/;
const DD_INTENT = /due diligence|\bdd report\b|diligence report/;
const CREATE_PROJECT_INTENT = /create (a |the )?(new )?(project|data ?room)|set up a data ?room|add (a )?(new )?project/;
const CREATE_PROJECT_NAME = /(?:called|named|for)\s+["“']?([^"”']+?)["”']?\s*$/i;
const WHOLE_ROOM_HINT = /\bdata ?room\b|\bwhole (room|project)\b|\bentire (room|project)\b/;

const PERMISSION_NOTE =
  'Results filtered by permissions — some items may be hidden due to access rights.';

let stepSeq = 0;
const step = (label: string, kind: AiStep['kind'], detail?: string): AiStep =>
  ({ id: `s-${++stepSeq}`, label, kind, detail, done: true });

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
/** 300–600 ms between streamed steps. */
const streamDelay = () => delay(300 + Math.round(Math.random() * 300));

function stem(word: string): string {
  return word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
    .map(stem);
}

/** "1 ODM intellectual property" → "odm intellectual property" */
function folderCore(name: string): string {
  return name.replace(/^\d+\s+/, '').toLowerCase();
}

/** "0/2 signed" → still pending; "signed" / "2/2 signed" → complete. */
function isPendingSignature(status?: string): boolean {
  if (!status) return false;
  const m = status.match(/(\d+)\s*\/\s*(\d+)/);
  return m ? Number(m[1]) < Number(m[2]) : false;
}

/**
 * Mock intent engine. Keyword matching only — no model, no backend.
 * Scenarios plug in via `plan()`; the streaming/stop machinery is scenario-agnostic.
 */
@Injectable()
export class AiEngineService {
  private conv = inject(AiConversationService);
  private llm = inject(AiLlmService);

  readonly streaming = signal(false);
  private stoppedFor: string | null = null;

  /** Submit a user query and stream the assistant turn. */
  async send(rawText: string): Promise<void> {
    const text = rawText.trim();
    if (!text || this.streaming()) return;

    this.conv.addUserMessage(text);
    const assistant = this.conv.addAssistantMessage();
    let plan = this.plan(text);

    // Hybrid: the four demo scenarios stay scripted so a demo can't drift. Only
    // off-script questions reach the model, and the request runs while the steps
    // stream so the model's latency hides inside the existing animation.
    const pending =
      plan.scenario === 'fallback'
        ? this.llm.ask(text, this.scopeDocuments(), this.conv.currentScope())
        : null;

    this.conv.patchMessage(assistant.id, { scenario: plan.scenario });

    this.stoppedFor = null;
    this.streaming.set(true);
    const startedAt = Date.now();

    for (const s of plan.steps) {
      await streamDelay();
      if (this.stoppedFor === assistant.id) break;
      this.conv.appendStep(assistant.id, s);
    }

    if (this.stoppedFor === assistant.id) {
      this.conv.cancelMessage(assistant.id);
    } else {
      // A null result (no key, offline, rate limit) leaves the scripted plan in
      // place, so the prototype degrades instead of showing an error.
      const live = pending ? await pending : null;
      if (live) plan = this.livePlan(live, plan);

      await streamDelay();
      this.conv.patchMessage(assistant.id, { scenario: plan.scenario });
      this.conv.completeMessage(
        assistant.id,
        plan.answer,
        this.toPlainText(plan.answer),
        Date.now() - startedAt,
      );
      plan.effect?.();
    }

    this.streaming.set(false);
  }

  /** Halt the in-flight message — emitted steps stay, nothing further appends. */
  stop(): void {
    const last = this.conv.messages().at(-1);
    if (last?.role === 'assistant' && last.streaming) {
      this.stoppedFor = last.id;
    }
  }

  /** Plain-text projection of an answer — used by the copy action. */
  toPlainText(answer: AnswerPayload): string {
    const lines: string[] = [];
    switch (answer.kind) {
      case 'prose':
        lines.push(answer.text, answer.followUp ?? '');
        break;
      case 'singleDoc': {
        const d = answer.doc;
        lines.push(
          answer.intro ?? '',
          `${d.index} ${d.name}`,
          `Location: ${d.folderPath}`,
          `Size: ${docSizeMeta(d)}`,
          `Added on: ${d.addedOn}`,
          answer.followUp ?? '',
        );
        break;
      }
      case 'table':
        lines.push(answer.summary);
        for (const d of answer.docs) {
          lines.push(answer.variant === 'signatures'
            ? `${d.name}\t${d.folderPath}\t${d.signatureStatus}\t${d.addedOn}`
            : `${d.index}\t${d.name}\t${d.folderPath}\t${docSizeMeta(d)}\t${d.addedOn}`);
        }
        lines.push(answer.followUp ?? '');
        break;
      case 'summary':
        lines.push(answer.overview);
        for (const g of answer.groups) {
          lines.push(g.title);
          for (const p of g.points) lines.push(`· ${p.text} (${p.source.name})`);
        }
        lines.push(answer.followUp ?? '');
        break;
      case 'ddReport':
        lines.push(`${answer.title} — draft for review`, answer.partialNote ?? '');
        for (const s of answer.sections) {
          lines.push(s.heading);
          for (const c of s.claims) {
            lines.push(`· ${c.text}${c.sourceDoc ? ` (${c.sourceDoc.name})` : c.sourceFolder ? ` (${c.sourceFolder})` : ''}`);
          }
        }
        lines.push(answer.followUp ?? '');
        break;
      case 'project':
        lines.push(answer.text, `Project: ${answer.projectName}`, ...answer.nextSteps.map(s => `· ${s}`));
        break;
    }
    if (answer.permissionNote) lines.push(answer.permissionNote);
    return lines.filter(Boolean).join('\n');
  }

  // ── Intent routing ────────────────────────────────────────────────────────

  private plan(query: string): AiPlan {
    const q = query.toLowerCase();

    if (CREATE_PROJECT_INTENT.test(q)) return this.createProjectPlan(query);
    if (SIGNATURE_INTENT.test(q)) return this.signaturesPlan();
    if (DD_INTENT.test(q)) return this.ddReportPlan(query);
    if (SUMMARIZE_INTENT.test(q)) return this.summaryPlan(query);

    const { matches, filtered } = this.matchDocuments(query);
    if (matches.length === 1) return this.singleDocPlan(matches[0], filtered);
    if (matches.length > 1) return this.tablePlan(query, matches, filtered);
    if (FIND_INTENT.test(q) || filtered) return this.zeroResultPlan(query, filtered);
    return this.fallbackPlan();
  }

  // ── Scenario A — find / search ────────────────────────────────────────────

  /** Keyword match against document names, permission-filtered. */
  private matchDocuments(query: string): { matches: MockDocument[]; filtered: boolean } {
    const tokens = tokenize(query);
    if (!tokens.length) return { matches: [], filtered: false };

    const findIntent = FIND_INTENT.test(query.toLowerCase());
    let best = 0;
    const scored = this.scopeDocuments(true).map(doc => {
      const nameTokens = new Set(tokenize(doc.name));
      const score = tokens.reduce((acc, t) => acc + (nameTokens.has(t) ? 1 : 0), 0);
      best = Math.max(best, score);
      return { doc, score };
    });

    if (!(best >= 2 || (findIntent && best >= 1))) return { matches: [], filtered: false };

    const candidates = scored.filter(s => s.score === best).map(s => s.doc);
    const matches = candidates.filter(d => !d.restricted);
    return { matches, filtered: matches.length !== candidates.length };
  }

  private singleDocPlan(doc: MockDocument, filtered: boolean): AiPlan {
    return {
      scenario: 'A',
      steps: [
        step('Thought', 'thought', 'interpreting your query'),
        step('Searching data room', 'thought', this.conv.currentScope()),
        step('Found 1 result', 'result', doc.name),
      ],
      answer: {
        kind: 'singleDoc',
        intro: 'I found one document matching your request:',
        doc,
        followUp: 'Would you like me to summarize it or check its signature status?',
        permissionNote: filtered ? PERMISSION_NOTE : undefined,
      },
    };
  }

  private tablePlan(query: string, docs: MockDocument[], filtered: boolean): AiPlan {
    const label = this.matchLabel(query);
    return {
      scenario: 'A',
      steps: [
        step('Thought', 'thought', 'interpreting your query'),
        step('Searching data room', 'thought', this.conv.currentScope()),
        step('Scanning folders', 'thought', `${MOCK_DATA_ROOM.folders.length} folders · ${PERMITTED_DOCUMENTS.length} documents`),
        step(`Found ${docs.length} results`, 'result', label),
      ],
      answer: {
        kind: 'table',
        summary: `Here is the full list of ${label} found in ${this.conv.currentScope()} (${docs.length} total):`,
        docs,
        followUp: 'Let me know if you’d like me to summarize, compare, or open any of these documents.',
        permissionNote: filtered ? PERMISSION_NOTE : undefined,
      },
    };
  }

  private zeroResultPlan(query: string, filtered: boolean): AiPlan {
    return {
      scenario: 'A',
      steps: [
        step('Thought', 'thought', 'interpreting your query'),
        step('Searching data room', 'thought', this.conv.currentScope()),
        step('Found 0 results', 'result', 'no matching documents'),
      ],
      answer: {
        kind: 'prose',
        text: `I couldn't find any documents matching “${query.trim()}” in ${this.conv.currentScope()}.`,
        followUp: 'Would you like me to broaden the search to the whole data room, or check a different project?',
        permissionNote: filtered ? PERMISSION_NOTE : undefined,
      },
    };
  }

  /**
   * Maps a model result onto the existing renderers. The model only chooses the
   * intent and which documents apply — the citations, table and metadata are still
   * drawn from mock data, so an answer can never cite a document that isn't there.
   */
  private livePlan(live: LlmResult, scripted: AiPlan): AiPlan {
    const byId = new Map(this.scopeDocuments().map((d) => [d.id, d]));
    const docs = live.documentIds.map((id) => byId.get(id)).filter((d): d is MockDocument => !!d);
    const followUp = live.followUp || undefined;

    // Reuse the scripted builders wherever the intent has a richer renderer, so
    // the model can't produce a shape the UI doesn't know how to draw.
    if (live.intent === 'signatures') return this.signaturesPlan();
    if (live.intent === 'report') return this.ddReportPlan(live.text);

    if (live.intent === 'summarize' && docs.length) {
      return {
        scenario: 'B',
        steps: scripted.steps,
        answer: {
          kind: 'summary',
          scopeLabel: this.conv.currentScope(),
          overview: live.text,
          groups: [
            {
              title: this.conv.currentScope(),
              points: docs.map((d) => ({ text: d.gist || d.name, source: d })),
            },
          ],
          followUp,
        },
      };
    }

    if (live.intent === 'find' && docs.length === 1) {
      return { ...this.singleDocPlan(docs[0], false), steps: scripted.steps };
    }
    if (live.intent === 'find' && docs.length > 1) {
      return { ...this.tablePlan(live.text, docs, false), steps: scripted.steps };
    }

    return {
      scenario: live.intent === 'none' ? 'fallback' : 'A',
      steps: scripted.steps,
      answer: { kind: 'prose', text: live.text, followUp },
    };
  }

  private fallbackPlan(): AiPlan {
    return {
      scenario: 'fallback',
      steps: [
        step('Thought', 'thought', 'interpreting your query'),
        step('Checking capabilities', 'result', 'find · summarize · compliance · projects'),
      ],
      answer: {
        kind: 'prose',
        text: 'I can help find, summarize, or check compliance on documents in this data room.',
        followUp: 'Try asking me to find the financial reports, summarize a folder, or draft a due diligence report.',
      },
    };
  }

  // ── Scenario B — summarize ────────────────────────────────────────────────

  private summaryPlan(query: string): AiPlan {
    const scope = this.resolveScope(query);
    const groups: SummaryGroup[] = scope.folderName
      ? [{
          title: scope.folderName,
          points: scope.docs.map(d => ({ text: d.gist ?? d.name, source: d })),
        }]
      : MOCK_DATA_ROOM.folders
          .map(f => ({
            title: f.name,
            points: scope.docs
              .filter(d => d.folderPath === f.name)
              .map(d => ({ text: d.gist ?? d.name, source: d })),
          }))
          .filter(g => g.points.length > 0);

    return {
      scenario: 'B',
      steps: [
        step('Thought', 'thought', 'resolving the scope of your request'),
        step('Scope resolved', 'thought', scope.label),
        step('Reading documents', 'thought', `${scope.docs.length} documents`),
        step(`Summarized ${scope.docs.length} documents`, 'result', scope.label),
      ],
      answer: {
        kind: 'summary',
        scopeLabel: scope.label,
        overview: scope.folderName
          ? `${scope.folderName} holds ${scope.docs.length} documents. Here is what they cover.`
          : `The ${MOCK_DATA_ROOM.name} data room holds ${scope.docs.length} documents across ${groups.length} folders. Here is what each folder covers.`,
        groups,
        followUp: 'I can go deeper on any item, or export this summary.',
        permissionNote: scope.filtered ? PERMISSION_NOTE : undefined,
      },
    };
  }

  // ── Scenario C1 — documents missing signatures ────────────────────────────

  private signaturesPlan(): AiPlan {
    const scope = this.resolveScope('');
    const pending = scope.docs.filter(d => isPendingSignature(d.signatureStatus));

    return {
      scenario: 'C1',
      steps: [
        step('Thought', 'thought', 'checking e-signature status'),
        step('Querying document status', 'thought', scope.label),
        step(`Found ${pending.length} results`, 'result', 'unsigned or partially signed'),
      ],
      answer: {
        kind: 'table',
        variant: 'signatures',
        summary: `${pending.length} documents in ${scope.label} are still missing signatures:`,
        docs: pending,
        followUp: 'I can open any of these documents so you can review who still needs to sign.',
        permissionNote: scope.filtered ? PERMISSION_NOTE : undefined,
      },
    };
  }

  // ── Scenario C2 — due diligence report draft ──────────────────────────────

  private ddReportPlan(query: string): AiPlan {
    const scope = this.resolveScope(query);
    const pending = PERMITTED_DOCUMENTS.filter(d => isPendingSignature(d.signatureStatus));
    const byFolder = MOCK_DATA_ROOM.folders
      .map(f => ({ folder: f.name, docs: PERMITTED_DOCUMENTS.filter(d => d.folderPath === f.name) }))
      .filter(g => g.docs.length > 0);

    const financials = PERMITTED_DOCUMENTS.filter(d => /financial report/i.test(d.name));

    const sections: DdSection[] = [
      {
        heading: 'Executive summary',
        claims: [
          {
            text: `${MOCK_DATA_ROOM.name} contains ${PERMITTED_DOCUMENTS.length} documents across ${byFolder.length} folders, covering intellectual property, trade secrets and two operating entities.`,
            sourceFolder: MOCK_DATA_ROOM.name,
          },
          {
            text: 'FY2025 revenue was €142M with an EBITDA margin of 14.8%; Q1 2026 is tracking 3% ahead of plan.',
            sourceDoc: financials.find(d => d.name.startsWith('Annual')),
          },
        ],
      },
      {
        heading: 'Document inventory by category',
        claims: byFolder.map(g => ({
          text: `${g.folder} — ${g.docs.length} documents.`,
          sourceFolder: g.folder,
        })),
      },
      {
        heading: 'Gaps & risks',
        claims: [
          ...pending.map(d => ({
            text: `${d.name} is ${d.signatureStatus} and cannot be relied on until execution completes.`,
            sourceDoc: d,
          })),
          {
            text: 'Four trademarks fall due for renewal within 12 months and should be diarised before closing.',
            sourceDoc: PERMITTED_DOCUMENTS.find(d => d.name.startsWith('Trademark')),
          },
        ],
      },
      {
        heading: 'Recommended next steps',
        claims: [
          { text: `Chase the ${pending.length} outstanding signature packets before the confirmatory diligence deadline.` },
          { text: 'Request the FY2024 comparatives to complete the three-year financial picture.' },
          { text: 'Confirm the know-how transfer plan is reflected in the sale and purchase agreement.', sourceDoc: PERMITTED_DOCUMENTS.find(d => d.name.startsWith('Know-how')) },
        ],
      },
    ];

    return {
      scenario: 'C2',
      steps: [
        step('Thought', 'thought', 'resolving the project scope'),
        step('Gathering structure', 'thought', `${byFolder.length} folders · ${PERMITTED_DOCUMENTS.length} documents`),
        step('Checking gaps', 'thought', `${pending.length} unsigned documents`),
        step('Assembled report draft', 'result', `${sections.length} sections`),
      ],
      answer: {
        kind: 'ddReport',
        title: `Due diligence report — ${MOCK_DATA_ROOM.name}`,
        scopeLabel: scope.label,
        // The report cites documents outside a folder-limited scope.
        partialNote: scope.folderName
          ? `This chat is scoped to ${scope.folderName}, so parts of the report draw on documents outside that scope. Widen the scope to the whole data room for a complete draft.`
          : undefined,
        sections,
        followUp: 'I can refine any section, or export the draft.',
        permissionNote: MOCK_DOCUMENTS.some(d => d.restricted) ? PERMISSION_NOTE : undefined,
      },
    };
  }

  // ── Scenario D — create project ───────────────────────────────────────────

  private createProjectPlan(query: string): AiPlan {
    const parsed = (query.match(CREATE_PROJECT_NAME)?.[1] ?? '')
      .trim()
      .replace(/^(the|a|an)\s+/i, '');
    return {
      scenario: 'D',
      steps: [
        step('Thought', 'thought', 'preparing a new project'),
        step('Confirmation required', 'result', 'creating a project changes data'),
      ],
      answer: {
        kind: 'prose',
        text: parsed
          ? `I can create a project called “${parsed}”. Confirm the details in the dialog to continue.`
          : 'I can create a new project. Confirm the details in the dialog to continue.',
      },
      effect: () => this.conv.requestCreateProject(parsed),
    };
  }

  // ── Scope resolution ──────────────────────────────────────────────────────

  /** Precedence: explicit whole-room hint → seeded folder → folder named in the query → whole room. */
  private resolveScope(query: string): ResolvedScope {
    const q = query.toLowerCase();
    const seeded = this.conv.scope();

    let folderName: string | undefined;
    if (!WHOLE_ROOM_HINT.test(q)) {
      if (seeded.kind === 'folder') {
        folderName = seeded.folderName;
      } else {
        folderName = MOCK_DATA_ROOM.folders.find(f => q.includes(folderCore(f.name)))?.name;
      }
    }

    const all = folderName
      ? MOCK_DOCUMENTS.filter(d => d.folderPath === folderName)
      : MOCK_DOCUMENTS;
    const docs = all.filter(d => !d.restricted);

    return {
      label: folderName ?? MOCK_DATA_ROOM.name,
      folderName,
      docs,
      filtered: docs.length !== all.length,
    };
  }

  /** Documents visible in the current scope. `includeRestricted` is used for filter detection. */
  private scopeDocuments(includeRestricted = false): MockDocument[] {
    const seeded = this.conv.scope();
    const base = seeded.kind === 'folder'
      ? MOCK_DOCUMENTS.filter(d => d.folderPath === seeded.folderName)
      : MOCK_DOCUMENTS;
    return includeRestricted ? base : base.filter(d => !d.restricted);
  }

  /** Human label for the matched set, e.g. "financial reports". */
  private matchLabel(query: string): string {
    const tokens = tokenize(query);
    if (tokens.includes('financial') && tokens.includes('report')) return 'financial reports';
    return tokens.length ? `${tokens.join(' ')} documents` : 'documents';
  }
}
