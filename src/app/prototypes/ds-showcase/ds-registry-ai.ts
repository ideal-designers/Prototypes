/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI ASSISTANT — design-system section
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every component of the FVDR AI chat lives here. Code lives in
 * `src/app/shared/ds/components/ai/*`, docs render at `/ds/<id>`.
 *
 * `status: 'planned'` entries are specs, not code — the roadmap is kept inside
 * the design system so design and build stay on the same list. When a planned
 * component ships: build it under components/ai/, register it in ds/index.ts,
 * flip status to 'beta', and fill in anatomy + tokens.
 *
 * Reference: Claude's chat UI, re-read through iDeals VDR constraints —
 * every answer must be traceable to a document, and permission-filtered.
 */

import type { ComponentDocEntry } from './ds-registry';

// ─────────────────────────────────────────────────────────────────────────────
// SHIPPED · Conversation core
// ─────────────────────────────────────────────────────────────────────────────

const aiComposer: ComponentDocEntry = {
  id: 'ai-composer',
  name: 'AI Composer',
  selector: 'fvdr-ai-composer',
  category: 'ai',
  status: 'beta',
  description:
    'The prompt input. Auto-grows with the typed text, submits on Enter (Shift+Enter for a newline) and exposes add-context, voice and send affordances. Fluid — it fills whatever shell it is dropped into: full-screen, right sidebar or floating panel.',
  whenToUse: [
    'The single entry field of any AI conversation surface',
    'Docked at the bottom of an active transcript',
    'Centred under the greeting in the empty state',
  ],
  whenNotToUse: [
    'Plain multi-line text entry in a form (use Textarea)',
    'Document or participant search (use Search)',
    'Anything that is not sent to the assistant',
  ],
  anatomy: [
    { index: 1, part: 'Container',   spec: 'radius 12px · 1px --color-divider · padding 12px · focus-within → primary border' },
    { index: 2, part: 'Textarea',    spec: 'font-size 15px · line-height 22px · rows 1 → auto-grow to max-height 160px' },
    { index: 3, part: 'Add context', spec: '32×32 ghost button · plus icon · opens the doc/folder picker' },
    { index: 4, part: 'Voice',       spec: '32×32 ghost button · mic icon' },
    { index: 5, part: 'Send',        spec: '32×32 · --color-primary-500 · radius 8px · muted to primary-200 when empty or streaming' },
  ],
  states: [
    { name: 'Empty',    description: 'Placeholder visible, send button muted (--color-primary-200) and inert.' },
    { name: 'Typing',   description: 'Textarea grows one line at a time up to 160px, then scrolls internally. Send turns full primary.' },
    { name: 'Focused',  description: 'Container border switches to --color-primary-500 via :focus-within.' },
    { name: 'Busy',     description: 'A response is streaming — send stays muted so a second prompt cannot be queued. Stop lives in AI Steps.' },
    { name: 'Disabled', description: 'AI unavailable (no permission, quota spent). Grey surface, every control inert.' },
  ],
  tokens: [
    { token: '--color-divider',        value: '#DEE0EB', usage: 'Container border' },
    { token: '--color-primary-500',    value: '#2C9C74', usage: 'Send background · focus border' },
    { token: '--color-primary-600',    value: '#1C8269', usage: 'Send hover' },
    { token: '--color-primary-200',    value: '#95DBA9', usage: 'Send background when empty or busy' },
    { token: '--radius-lg',            value: '12px',    usage: 'Container radius' },
    { token: '--radius-md',            value: '8px',     usage: 'Send button radius' },
    { token: '--space-3',              value: '12px',    usage: 'Container padding' },
    { token: '--color-text-placeholder', value: '#9C9EA8', usage: 'Placeholder text' },
  ],
  usedIn: ['AI Assistant (full screen)', 'AI Assistant (sidebar)', 'AI Assistant (floating)'],
  relatedComponents: ['ai-suggestions', 'ai-attachment', 'ai-steps', 'textarea'],
  codeSnippet: `<!-- Docked composer -->
<fvdr-ai-composer
  [busy]="engine.streaming()"
  (submitted)="send($event)"
  (contextRequested)="openDocPicker()"
  (voiceRequested)="startDictation()"
></fvdr-ai-composer>

<!-- Pre-filled from a suggestion chip (two-way value) -->
<fvdr-ai-composer [(value)]="prompt" (submitted)="send($event)"></fvdr-ai-composer>

<!-- Minimal: no add-context, no voice -->
<fvdr-ai-composer
  placeholder="Ask about this document…"
  [showAddContext]="false"
  [showVoice]="false"
  (submitted)="send($event)"
></fvdr-ai-composer>

<!-- AI unavailable -->
<fvdr-ai-composer [disabled]="true" placeholder="AI assistant is disabled for this data room"></fvdr-ai-composer>`,
  claudePrompt:
    'Implement fvdr-ai-composer (FVDR DS, AI Assistant section). Inputs: placeholder (default "Ask AI assistant anything ..."), busy:boolean (streaming — disables send), disabled:boolean (whole composer inert), showAddContext:boolean=true, showVoice:boolean=true, value:string (two-way with valueChange). Outputs: submitted:string (trimmed, clears the field), contextRequested, voiceRequested. Public focus() method puts the caret in the textarea. Enter submits, Shift+Enter inserts a newline. The textarea starts at rows=1 and auto-grows to max-height 160px, then scrolls. Container: --radius-lg, 1px --color-divider, --space-3 padding, border turns --color-primary-500 on :focus-within. Send button 32×32, --radius-md, background --color-primary-500 → --color-primary-600 on hover, muted to --color-primary-200 when it cannot send. Ghost buttons are 32×32 with --radius-sm and --color-hover-bg on hover. Use fvdr-icon (plus / mic / send) — never inline SVG.',
};

const aiSteps: ComponentDocEntry = {
  id: 'ai-steps',
  name: 'AI Steps',
  selector: 'fvdr-ai-steps',
  category: 'ai',
  status: 'beta',
  description:
    'The reasoning trace of an assistant turn. While streaming it shows the Thinking Orbs pill carrying the live step label plus a Stop button; when the turn finishes it collapses to a single "Thought for Ns" row that expands back into the full step list — the audit trail a data room needs.',
  whenToUse: [
    'Above every assistant answer that involved search, retrieval or multi-step work',
    'Whenever the user must be able to audit how an answer was reached',
    'To host the Stop control while a response streams',
  ],
  whenNotToUse: [
    'Instant answers with no intermediate work (show the answer alone)',
    'Generic page or file loading (use Progress or the spinner icon)',
    'Background jobs the user did not trigger from the chat',
  ],
  anatomy: [
    { index: 1, part: 'Live header',    spec: 'fvdr-thinking-orbs (size 32, dots 1.2) with the newest step label + Stop' },
    { index: 2, part: 'Stop button',    spec: 'height 24px · 1px --color-divider · radius 4px · font-size 12px' },
    { index: 3, part: 'Summary row',    spec: '"Thought for Ns" · 14px --color-text-secondary · underline on hover' },
    { index: 4, part: 'Step list',      spec: 'left rule 1px --color-divider · padding-left 20px · gap 4px' },
    { index: 5, part: 'Step row',       spec: 'label ▸ detail · 13px · result rows bold in --color-text-primary' },
  ],
  states: [
    { name: 'Streaming',  description: 'Orbs pill spins with the live label; rows fade in one by one (200ms translateY); Stop is available.' },
    { name: 'Collapsed',  description: 'Default once done — one "Thought for Ns" row. Never reports 0s; rounds up to 1s.' },
    { name: 'Expanded',   description: 'Full step list revealed under the summary for auditing.' },
    { name: 'Cancelled',  description: 'User hit Stop — the summary reads "Stopped after N steps" and keeps the partial trace.' },
  ],
  tokens: [
    { token: '--color-divider',        value: '#DEE0EB', usage: 'Left rule of the step list · Stop border' },
    { token: '--color-text-secondary', value: '#5F616A', usage: 'Summary row · step labels' },
    { token: '--color-text-primary',   value: '#1F2129', usage: 'Result-row labels (semibold)' },
    { token: '--color-stone-500',      value: '#BBBDC8', usage: '▸ separator' },
    { token: '--space-5',              value: '20px',    usage: 'Step-list indent' },
  ],
  usedIn: ['AI Assistant (full screen)', 'AI Assistant (sidebar)', 'AI Assistant (floating)'],
  relatedComponents: ['thinking-orbs', 'ai-tool-call', 'ai-bubble'],
  codeSnippet: `<fvdr-ai-steps
  [steps]="message.steps"
  [streaming]="message.streaming"
  [expanded]="message.stepsExpanded"
  [cancelled]="message.cancelled"
  [thoughtMs]="message.thoughtMs"
  (toggled)="toggleSteps(message.id)"
  (stopped)="engine.stop()"
></fvdr-ai-steps>

<!-- AiStep shape -->
const step: AiStep = {
  id: 's1',
  label: 'Found 6 results',
  kind: 'result',            // 'thought' | 'result'
  detail: 'in /Financials',
  done: true,
};`,
  claudePrompt:
    'Implement fvdr-ai-steps (FVDR DS, AI Assistant section). Inputs: steps:AiStep[], streaming:boolean, expanded:boolean, cancelled:boolean, thoughtMs:number. Outputs: toggled, stopped. AiStep = { id, label, kind: "thought"|"result", detail?, done }. While streaming: render fvdr-thinking-orbs [label]=last step label [size]=32 [dots]=1.2 next to a small Stop button, and show every step row. When not streaming: render one summary button — "Thought for Ns" where N = max(1, round(thoughtMs/1000)), or "Stopped after N steps" when cancelled — which toggles the row list. Rows sit in a ul with a 1px --color-divider left rule, 20px indent, "label ▸ detail" layout, 13px, result rows bold in --color-text-primary. Rows animate in with a 0.2s opacity + translateY(-2px). Tokens only, no raw hex.',
};

const aiBubble: ComponentDocEntry = {
  id: 'ai-bubble',
  name: 'AI Bubble',
  selector: 'fvdr-ai-bubble',
  category: 'ai',
  status: 'beta',
  description:
    'The container of a single conversation turn. A user turn is a right-aligned grey bubble capped at 70% of the column; an assistant turn is the full-width reading column with no tint, so answer blocks and reports can carry their own structure.',
  whenToUse: [
    'Wrapping every turn in a transcript',
    'Rendering a user prompt (text) or an assistant answer (projected content)',
    'Keeping the same turn rhythm across full-screen, sidebar and floating shells',
  ],
  whenNotToUse: [
    'System notices or errors (use AI Error or Inline Message)',
    'Q&A threads between participants — that is the Q&A module, not the assistant',
    'Toast-style transient feedback (use Toast)',
  ],
  anatomy: [
    { index: 1, part: 'Turn wrapper',      spec: 'flex column · gap 12px · align-items flex-end for user turns' },
    { index: 2, part: 'User bubble',       spec: 'max-width 70% (85% ≤768px) · --color-stone-200 · radius 12px · padding 12/16px' },
    { index: 3, part: 'Text',              spec: 'font-size 15px · line-height 22px · white-space pre-wrap' },
    { index: 4, part: 'Assistant column',  spec: 'max-width 100% · transparent · no padding — projected content only' },
  ],
  states: [
    { name: 'User',      description: 'Right-aligned, grey surface, capped width — reads as "what I asked".' },
    { name: 'Assistant', description: 'Full-width transparent column — reads as "the room answering", and lets tables and reports breathe.' },
  ],
  tokens: [
    { token: '--color-stone-200',    value: '#F7F7F7', usage: 'User bubble background' },
    { token: '--color-text-primary', value: '#1F2129', usage: 'Bubble text' },
    { token: '--radius-lg',          value: '12px',    usage: 'Bubble radius' },
    { token: '--space-3',            value: '12px',    usage: 'Vertical padding · turn gap' },
    { token: '--space-4',            value: '16px',    usage: 'Horizontal padding' },
  ],
  usedIn: ['AI Assistant (full screen)', 'AI Assistant (sidebar)', 'AI Assistant (floating)'],
  relatedComponents: ['ai-steps', 'ai-actions', 'ai-citation'],
  codeSnippet: `<!-- User turn -->
<fvdr-ai-bubble role="user" [text]="message.text"></fvdr-ai-bubble>

<!-- Assistant turn — steps, answer and actions projected in -->
<fvdr-ai-bubble role="assistant">
  <fvdr-ai-steps [steps]="message.steps" [streaming]="message.streaming"></fvdr-ai-steps>
  <p>{{ message.answer.text }}</p>
  <fvdr-ai-actions (copyRequested)="copy(message)"></fvdr-ai-actions>
</fvdr-ai-bubble>`,
  claudePrompt:
    'Implement fvdr-ai-bubble (FVDR DS, AI Assistant section). Inputs: role:"user"|"assistant" (default "user"), text:string (convenience for plain-text turns). Content is projected via ng-content so richer turns compose. User turns: flex column aligned flex-end, bubble max-width 70% (85% under 768px), background --color-stone-200, --radius-lg, padding --space-3 --space-4, font-size 15px/22px, white-space pre-wrap. Assistant turns: max-width 100%, transparent background, no radius, no padding. Tokens only.',
};

const aiCitation: ComponentDocEntry = {
  id: 'ai-citation',
  name: 'AI Citation',
  selector: 'fvdr-ai-citation',
  category: 'ai',
  status: 'beta',
  description:
    'A source reference from an AI answer to the document (and page) it came from. The trust primitive of the whole assistant: in a data room a generated sentence is worthless unless the reader can open the page it was drawn from.',
  whenToUse: [
    'Under or after every generated claim, key point or figure',
    'As a row of sources beneath a paragraph (pill variant)',
    'Alongside a numbered source list (pass index)',
  ],
  whenNotToUse: [
    'Linking to a document outside an AI answer (use a plain link or the document row)',
    'Filters and tags (use Chip)',
    'When the source cannot actually be opened by this user — omit it and show the permission note instead',
  ],
  anatomy: [
    { index: 1, part: 'Index marker', spec: 'optional · min-width 16px · --color-primary-50 bg · 10px semibold --color-primary-700' },
    { index: 2, part: 'File icon',    spec: 'fvdr-file-icon 20×18px · matches the document extension' },
    { index: 3, part: 'Name',         spec: '12px · --color-primary-500 (inline) · ellipsis on overflow' },
    { index: 4, part: 'Page',         spec: '"· p. 12" · --color-text-secondary' },
    { index: 5, part: 'Pill border',  spec: 'pill variant only · 1px --color-divider · radius 9999px' },
  ],
  states: [
    { name: 'Inline',  description: 'Link-styled, no border — sits at the end of a sentence or under a key point.' },
    { name: 'Pill',    description: 'Bordered chip on white — for a row of sources under a paragraph.' },
    { name: 'Hover',   description: 'Inline underlines and darkens; pill fills with --color-hover-bg and darkens its border.' },
  ],
  tokens: [
    { token: '--color-primary-500',    value: '#2C9C74', usage: 'Inline name colour' },
    { token: '--color-primary-600',    value: '#1C8269', usage: 'Hover' },
    { token: '--color-primary-50',     value: '#EBF8EF', usage: 'Index marker background' },
    { token: '--color-primary-700',    value: '#12695C', usage: 'Index marker text' },
    { token: '--color-divider',        value: '#DEE0EB', usage: 'Pill border' },
    { token: '--color-hover-bg',       value: '#ECEEF9', usage: 'Pill hover background' },
    { token: '--radius-full',          value: '9999px',  usage: 'Pill radius' },
    { token: '--font-size-xs',         value: '12px',    usage: 'Label size' },
  ],
  usedIn: ['AI Assistant (answers)', 'AI answer summary', 'AI due-diligence report'],
  relatedComponents: ['ai-source-list', 'ai-permission-note', 'file-icon', 'chip'],
  codeSnippet: `<!-- Inline, end of a sentence -->
<fvdr-ai-citation
  label="Master Services Agreement.pdf"
  [page]="12"
  fileType="pdf"
  (opened)="openDoc(doc)"
></fvdr-ai-citation>

<!-- Numbered, matching a source list -->
<fvdr-ai-citation [index]="3" label="FY23 Audit.xlsx" fileType="xls" (opened)="openDoc(doc)"></fvdr-ai-citation>

<!-- Row of sources under a paragraph -->
<fvdr-ai-citation
  *ngFor="let s of answer.sources"
  variant="pill"
  [label]="s.name"
  [fileType]="s.type"
  (opened)="openDoc(s)"
></fvdr-ai-citation>`,
  claudePrompt:
    'Implement fvdr-ai-citation (FVDR DS, AI Assistant section). Inputs: label:string (required, document name), page?:number|string, index?:number, fileType:FvdrFileType="pdf", showIcon:boolean=true, variant:"inline"|"pill"="inline". Output: opened. Renders a button: optional index marker (min-width 16px, height 16px, --color-primary-50 background, 10px semibold --color-primary-700, --radius-sm), then fvdr-file-icon, then the name (12px, ellipsis, no wrap), then "· p. N" in --color-text-secondary. Inline variant is link-styled in --color-primary-500 and underlines the name on hover. Pill variant adds a 1px --color-divider border, --radius-full, white background, --color-text-secondary text, and fills --color-hover-bg on hover. title/aria-label read "Open <name>, page <n>" / "Source: …". Tokens only.',
};

const aiActions: ComponentDocEntry = {
  id: 'ai-actions',
  name: 'AI Actions',
  selector: 'fvdr-ai-actions',
  category: 'ai',
  status: 'beta',
  description:
    'The action row under a finished assistant turn — regenerate, copy, and thumbs up/down. Copy confirms itself with a transient check; the rating is a toggle, so clicking the active thumb clears it. This is the feedback loop that tells us whether the assistant is trusted.',
  whenToUse: [
    'Under every completed assistant answer',
    'Wherever answer-level feedback should be collected',
    'As the host for extra answer actions (Export, Save to Q&A) via content projection',
  ],
  whenNotToUse: [
    'While the answer is still streaming (wait for done)',
    'Under a user turn',
    'For document-level actions — those belong on the document row or the action bar',
  ],
  anatomy: [
    { index: 1, part: 'Row',        spec: 'flex · gap 4px' },
    { index: 2, part: 'Regenerate', spec: '28×28 ghost · refresh icon' },
    { index: 3, part: 'Copy',       spec: '28×28 ghost · copy icon → check icon in primary for 1.6s' },
    { index: 4, part: 'Thumbs',     spec: '2 × 28×28 ghost · thumbs-up / thumbs-down · active in --color-primary-500' },
    { index: 5, part: 'Slot',       spec: 'ng-content — extra actions (Export, Save to Q&A)' },
  ],
  states: [
    { name: 'Default',  description: 'All icons in --color-text-secondary; hover fills --color-hover-bg.' },
    { name: 'Copied',   description: 'Copy swaps to the check icon in --color-primary-500 for copiedTimeout ms (default 1600).' },
    { name: 'Rated',    description: 'The chosen thumb stays --color-primary-500 with aria-pressed="true"; clicking it again clears the rating.' },
  ],
  tokens: [
    { token: '--color-text-secondary', value: '#5F616A', usage: 'Resting icon colour' },
    { token: '--color-text-primary',   value: '#1F2129', usage: 'Hover icon colour' },
    { token: '--color-hover-bg',       value: '#ECEEF9', usage: 'Hover background' },
    { token: '--color-primary-500',    value: '#2C9C74', usage: 'Active rating · copied confirmation' },
    { token: '--radius-sm',            value: '4px',     usage: 'Button radius' },
  ],
  usedIn: ['AI Assistant (full screen)', 'AI Assistant (sidebar)', 'AI Assistant (floating)'],
  relatedComponents: ['ai-bubble', 'ai-feedback-modal', 'ghost-btn'],
  codeSnippet: `<fvdr-ai-actions
  *ngIf="message.done"
  [rating]="message.rating"
  (regenerated)="regenerate(message)"
  (copyRequested)="copyAnswer(message)"
  (rated)="saveRating(message, $event)"
></fvdr-ai-actions>

<!-- Copy only, plus a projected export action -->
<fvdr-ai-actions [showRegenerate]="false" [showRating]="false" (copyRequested)="copy()">
  <fvdr-btn variant="link" size="s" label="Export report" (clicked)="export()"></fvdr-btn>
</fvdr-ai-actions>`,
  claudePrompt:
    'Implement fvdr-ai-actions (FVDR DS, AI Assistant section). Inputs: showRegenerate:boolean=true, showCopy:boolean=true, showRating:boolean=true, rating:"up"|"down"|null=null, copiedTimeout:number=1600. Outputs: regenerated, copyRequested, rated:("up"|"down"|null). Row of 28×28 ghost icon buttons (--radius-sm, --color-text-secondary, hover --color-hover-bg + --color-text-primary) using fvdr-icon: refresh, copy, thumbs-up, thumbs-down. On copy: emit copyRequested, swap the icon to "check" in --color-primary-500 for copiedTimeout ms. Rating is a toggle — clicking the active thumb sets it back to null; the active thumb is --color-primary-500 with aria-pressed. Ends with an ng-content slot for extra answer actions. Tokens only, no raw hex.',
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANNED · Conversation core
// ─────────────────────────────────────────────────────────────────────────────

/** Keeps planned specs short — anatomy and tokens are filled in when they ship. */
const planned = (e: Omit<ComponentDocEntry, 'category' | 'status' | 'anatomy' | 'tokens' | 'usedIn'> &
  Partial<Pick<ComponentDocEntry, 'usedIn'>>): ComponentDocEntry => ({
  category: 'ai',
  status: 'planned',
  anatomy: [],
  tokens: [],
  usedIn: [],
  ...e,
});

const aiConversation = planned({
  id: 'ai-conversation',
  name: 'AI Conversation',
  selector: 'fvdr-ai-conversation',
  description:
    'The transcript itself: scrollable turn list, auto-scroll to the newest turn, a docked composer, and the swap to the empty state when there are no messages. Owns scroll behaviour — including the "jump to latest" affordance when the user has scrolled up mid-stream.',
  whenToUse: [
    'Any surface that hosts a full assistant conversation',
    'Inside all three shells — full screen, right sidebar, floating panel',
  ],
  whenNotToUse: [
    'A one-shot inline prompt with a single answer (use AI Inline Prompt)',
    'Q&A threads between participants',
  ],
  relatedComponents: ['ai-bubble', 'ai-composer', 'ai-empty-state', 'ai-panel'],
  codeSnippet: `<fvdr-ai-conversation
  [messages]="conv.messages()"
  [streaming]="engine.streaming()"
  [compact]="mode !== 'fullscreen'"
  (promptSubmitted)="engine.send($event)"
  (stopRequested)="engine.stop()"
></fvdr-ai-conversation>`,
  claudePrompt:
    'Build fvdr-ai-conversation: messages:ChatMessage[], streaming:boolean, compact:boolean; outputs promptSubmitted:string, stopRequested. Renders fvdr-ai-empty-state when messages are empty, otherwise a scroll container of fvdr-ai-bubble turns with fvdr-ai-composer docked at the bottom. Auto-scrolls to the newest turn unless the user has scrolled up — then show a "jump to latest" button instead. compact stacks the suggestion chips for narrow shells.',
});

const aiEmptyState = planned({
  id: 'ai-empty-state',
  name: 'AI Empty State',
  selector: 'fvdr-ai-empty-state',
  description:
    'The zero-message screen: Ideon mark, greeting, the composer, and scope-aware starter prompts. This is where the assistant teaches what it can do, so the starters must change with the scope the chat was opened from (data room vs folder vs single document).',
  whenToUse: [
    'First open of the assistant, or after starting a new chat',
    'Teaching the three or four things worth asking in this scope',
  ],
  whenNotToUse: [
    'Error or unavailable states (use AI Error / AI Consent Banner)',
    'An active transcript',
  ],
  relatedComponents: ['ai-suggestions', 'ai-composer', 'ai-conversation'],
  codeSnippet: `<fvdr-ai-empty-state
  greeting="How can I help you today?"
  [suggestions]="scopedSuggestions()"
  (promptSubmitted)="send($event)"
></fvdr-ai-empty-state>`,
  claudePrompt:
    'Build fvdr-ai-empty-state: greeting:string, suggestions:string[], compact:boolean; output promptSubmitted:string. Centred column — fvdr-icon "ideon" mark, greeting heading, fvdr-ai-composer, then fvdr-ai-suggestions. Composer and suggestions travel together so compact shells can dock the pair.',
});

const aiSuggestions = planned({
  id: 'ai-suggestions',
  name: 'AI Suggestions',
  selector: 'fvdr-ai-suggestions',
  description:
    'Starter and follow-up prompt chips. Two behaviours worth separating: a starter sends immediately, while a follow-up may instead pre-fill the composer so the user can edit it before sending.',
  whenToUse: [
    'Under the greeting in the empty state',
    'After an answer, to offer the obvious next question',
    'To surface scope-specific actions ("Summarize this folder")',
  ],
  whenNotToUse: [
    'Filtering a list (use Filter Button or Chip)',
    'More than four suggestions — the point is to narrow, not to browse',
  ],
  relatedComponents: ['ai-empty-state', 'ai-composer', 'chip'],
  codeSnippet: `<fvdr-ai-suggestions
  [items]="['Summarize the documents in this folder', 'Show all documents missing signatures']"
  layout="wrap"
  behaviour="send"
  (chosen)="send($event)"
></fvdr-ai-suggestions>`,
  claudePrompt:
    'Build fvdr-ai-suggestions: items:string[], layout:"wrap"|"stack"="wrap", behaviour:"send"|"prefill"="send", max:number=4; output chosen:string. Renders fvdr-chip variant="grey" size="l" [clickable]="true" per item. layout="stack" for narrow shells. Keyboard: each chip is a real button in tab order.',
});

const aiMarkdown = planned({
  id: 'ai-markdown',
  name: 'AI Markdown',
  selector: 'fvdr-ai-markdown',
  description:
    'The prose renderer for assistant answers — headings, paragraphs, ordered and bulleted lists, bold, tables, blockquotes and code, all mapped onto FVDR type and spacing tokens. Handles partial markdown while streaming (an unclosed list or table must not flash broken layout) and shows the caret at the end of the streamed text.',
  whenToUse: [
    'Any free-text assistant answer longer than a sentence',
    'Streaming text, where the markup arrives incomplete',
  ],
  whenNotToUse: [
    'Structured results that deserve a real component (use the AI Answer blocks)',
    'User-authored rich text (use Text Editor)',
  ],
  relatedComponents: ['ai-bubble', 'ai-citation', 'text-editor'],
  codeSnippet: `<fvdr-ai-markdown [source]="answer.text" [streaming]="message.streaming"></fvdr-ai-markdown>`,
  claudePrompt:
    'Build fvdr-ai-markdown: source:string, streaming:boolean. Renders a safe markdown subset — h2/h3, p, ul/ol, strong/em, inline code, fenced code with a copy button, tables, blockquote, links. Sanitize all HTML; never render raw user/model HTML. While streaming, tolerate unterminated blocks and render a blinking 2px caret after the last character. Type comes from --font-size-md/15px, line-height --line-height-relaxed/24px; block spacing from --space-3/--space-4.',
});

const aiToolCall = planned({
  id: 'ai-tool-call',
  name: 'AI Tool Call',
  selector: 'fvdr-ai-tool-call',
  description:
    'A collapsible card for one action the assistant took on the room — searched documents, read a file, drafted a Q&A answer, created a folder. Distinct from AI Steps: steps narrate, a tool call is an auditable operation with a target, a result and a status.',
  whenToUse: [
    'The assistant performed a real operation on the data room',
    'The operation has a target the user may want to inspect',
    'Write operations that need an explicit confirm-before-run',
  ],
  whenNotToUse: [
    'Plain reasoning narration (use AI Steps)',
    'Final answers (use the AI Answer blocks)',
  ],
  relatedComponents: ['ai-steps', 'ai-citation', 'card'],
  codeSnippet: `<fvdr-ai-tool-call
  icon="search"
  title="Searched documents"
  target="/Financials/FY23"
  status="done"
  [resultCount]="6"
  [expanded]="false"
  (toggled)="expanded = !expanded"
  (confirmed)="runWrite()"
></fvdr-ai-tool-call>`,
  claudePrompt:
    'Build fvdr-ai-tool-call: icon:FvdrIconName, title:string, target?:string, status:"running"|"done"|"error"|"needs-confirm", resultCount?:number, expanded:boolean; outputs toggled, confirmed, cancelled. Collapsed row: icon, title, target in --color-text-secondary, status affordance on the right (spinner icon / check / error / Confirm+Cancel buttons). Expanded reveals the projected result. Border 1px --color-divider, --radius-md. needs-confirm is required for any write operation — it must never run without an explicit click.',
});

const aiAttachment = planned({
  id: 'ai-attachment',
  name: 'AI Attachment',
  selector: 'fvdr-ai-attachment',
  description:
    'A context chip inside the composer: the documents or folders this prompt is pinned to. In a VDR the attachment is a reference to something already in the room, not an upload — so it carries the file icon, the name, and a remove affordance.',
  whenToUse: [
    'The user added explicit context via the composer\'s add-context button',
    'A chat opened from a document or folder, which seeds the first attachment',
  ],
  whenNotToUse: [
    'Sources of an answer (use AI Citation)',
    'Uploading new files into the room (use Drop Area)',
  ],
  relatedComponents: ['ai-composer', 'ai-scope-bar', 'chip', 'file-icon'],
  codeSnippet: `<fvdr-ai-attachment
  label="Master Services Agreement.pdf"
  fileType="pdf"
  [removable]="true"
  (removed)="detach(doc)"
></fvdr-ai-attachment>`,
  claudePrompt:
    'Build fvdr-ai-attachment: label:string, fileType:FvdrFileType, meta?:string (e.g. "24 docs"), removable:boolean=true, state:"ready"|"indexing"|"error"="ready"; output removed. Compact chip with fvdr-file-icon, ellipsised name, optional meta, and a close icon button. indexing shows the spinner icon; error shows the attention icon in --color-error-600. Sits in a wrapping row above the composer textarea.',
});

const aiError = planned({
  id: 'ai-error',
  name: 'AI Error',
  selector: 'fvdr-ai-error',
  description:
    'The failure state of a turn — timeout, rate limit, model unavailable, or a permission refusal. Says what happened in one line, keeps the prompt recoverable, and offers exactly one primary way forward (Retry). Never blames the user, never dumps a stack trace.',
  whenToUse: [
    'A turn failed and the user must decide whether to retry',
    'The assistant refused because of permissions or policy',
    'Quota or rate limits were hit',
  ],
  whenNotToUse: [
    'Form validation (use Inline Message)',
    'Transient success or info feedback (use Toast)',
  ],
  relatedComponents: ['inline-message', 'info-banner', 'ai-actions'],
  codeSnippet: `<fvdr-ai-error
  variant="timeout"
  message="The assistant took too long to answer."
  [retryable]="true"
  (retried)="regenerate()"
></fvdr-ai-error>`,
  claudePrompt:
    'Build fvdr-ai-error: variant:"timeout"|"rate-limit"|"unavailable"|"permission"|"generic", message:string, hint?:string, retryable:boolean=true; output retried. Renders inside the assistant turn, not as a toast: attention icon, message in --color-text-primary, hint in --color-text-secondary, and a single secondary Retry button. Surface --color-stone-100 with a 1px --color-divider border and --radius-md; use --color-error-600 for the icon only. The failed prompt must remain in the transcript so it can be re-sent.',
});

// ─────────────────────────────────────────────────────────────────────────────
// PLANNED · VDR answer blocks (what makes this assistant a data-room assistant)
// ─────────────────────────────────────────────────────────────────────────────

const aiAnswerDocList = planned({
  id: 'ai-answer-doc-list',
  name: 'AI Answer · Document List',
  selector: 'fvdr-ai-answer-doc-list',
  description:
    'Numbered document results for narrow shells: index, file icon, name, folder path, each row opening the document or its folder. The compact counterpart of AI Answer · Table.',
  whenToUse: [
    'A find/search answer rendered in the sidebar or floating panel',
    'Fewer than ~10 results where a table would be too heavy',
  ],
  whenNotToUse: [
    'Full-screen results with comparable columns (use AI Answer · Table)',
    'Browsing the whole room (that is the Documents module)',
  ],
  relatedComponents: ['ai-answer-table', 'ai-citation', 'file-icon'],
  codeSnippet: `<fvdr-ai-answer-doc-list
  [intro]="answer.summary"
  [docs]="answer.docs"
  (docOpened)="openDoc($event)"
  (folderOpened)="openFolder($event)"
></fvdr-ai-answer-doc-list>`,
  claudePrompt:
    'Build fvdr-ai-answer-doc-list: intro?:string, docs:AiDocRef[], followUp?:string; outputs docOpened, folderOpened. AiDocRef = { id, name, type, folderPath, index?, size? }. Numbered rows: ordinal in --color-text-secondary, fvdr-file-icon, name as a primary-coloured button, folder path on a second line in 12px --color-text-secondary. Rows separated by 1px --color-divider, no card.',
});

const aiAnswerTable = planned({
  id: 'ai-answer-table',
  name: 'AI Answer · Table',
  selector: 'fvdr-ai-answer-table',
  description:
    'Tabular results inside an answer — documents against comparable columns (index, size, signature status, expiry). Scrolls horizontally inside its own container so a wide result never breaks the transcript.',
  whenToUse: [
    'Full-screen answers comparing many documents on the same attributes',
    'Compliance sweeps ("which contracts are unsigned")',
  ],
  whenNotToUse: [
    'Narrow shells (use AI Answer · Document List)',
    'Prose answers with a handful of sources (use citations)',
  ],
  relatedComponents: ['table', 'ai-answer-doc-list', 'ai-citation'],
  codeSnippet: `<fvdr-ai-answer-table
  [summary]="answer.summary"
  [docs]="answer.docs"
  variant="signatures"
  (docOpened)="openDoc($event)"
></fvdr-ai-answer-table>`,
  claudePrompt:
    'Build fvdr-ai-answer-table: summary?:string, docs:AiDocRef[], variant:"default"|"signatures"="default", followUp?:string; outputs docOpened, folderOpened. Wraps fvdr-table. default columns Name / Index / Size / Folder; signatures swaps Index+Size for a Signature status column using fvdr-status. The table lives in an overflow-x:auto container — the transcript must never scroll sideways.',
});

const aiAnswerSummary = planned({
  id: 'ai-answer-summary',
  name: 'AI Answer · Summary',
  selector: 'fvdr-ai-answer-summary',
  description:
    'A grouped summary: overview paragraph, then key points grouped by folder or document, every point citing its source. The default shape for "summarize this folder / this data room" and the block where citations matter most.',
  whenToUse: [
    'Summarizing a folder, a data room, or a set of documents',
    'Any answer that condenses many sources into key points',
  ],
  whenNotToUse: [
    'Single-document answers (use the single-doc answer)',
    'Lists of results (use the doc list or table)',
  ],
  relatedComponents: ['ai-citation', 'ai-answer-report', 'ai-permission-note'],
  codeSnippet: `<fvdr-ai-answer-summary
  [overview]="answer.overview"
  [groups]="answer.groups"
  [scopeLabel]="answer.scopeLabel"
  (docOpened)="openDoc($event)"
  (exported)="exportSummary()"
></fvdr-ai-answer-summary>`,
  claudePrompt:
    'Build fvdr-ai-answer-summary: overview:string, groups:AiSummaryGroup[], scopeLabel?:string, followUp?:string; outputs docOpened, folderOpened, exported. AiSummaryGroup = { title, titleDoc?, points: { text, source }[] }. Group heading: fvdr-file-icon + title button (semibold, primary). Points sit in a ul with a 1px --color-divider left rule, each with the text on one line and an fvdr-ai-citation under it. Ends with the follow-up line plus an Export action.',
});

const aiAnswerReport = planned({
  id: 'ai-answer-report',
  name: 'AI Answer · Report',
  selector: 'fvdr-ai-answer-report',
  description:
    'A long generated artifact — a due-diligence report draft, a red-flag list, a disclosure schedule — presented as a titled document with sections, findings and severities, plus export and save-to-room actions. The VDR equivalent of a Claude artifact.',
  whenToUse: [
    'The answer is a deliverable the user will export or share',
    'Multi-section output with findings and severities',
    'Anything a user would want saved back into the room as a document',
  ],
  whenNotToUse: [
    'Short answers (keep them in the transcript)',
    'Results better read as a table',
  ],
  relatedComponents: ['ai-answer-summary', 'ai-citation', 'ai-actions', 'card'],
  codeSnippet: `<fvdr-ai-answer-report
  title="Due diligence report — draft"
  [sections]="answer.sections"
  [severityLegend]="true"
  (exported)="exportPdf()"
  (savedToRoom)="saveAsDocument()"
></fvdr-ai-answer-report>`,
  claudePrompt:
    'Build fvdr-ai-answer-report: title:string, subtitle?:string, sections:AiReportSection[], severityLegend:boolean=false, draft:boolean=true; outputs exported, savedToRoom, docOpened. AiReportSection = { heading, findings: { text, severity?: "high"|"medium"|"low", sources: AiDocRef[] }[] }. Renders as a bordered document surface (--color-stone-0, 1px --color-divider, --radius-lg): sticky-ish title row with a "Draft" fvdr-badge and the export/save actions, then sections with findings, severity via fvdr-status, and fvdr-ai-citation per source. Long reports scroll inside their own container with a max-height.',
});

const aiSourceList = planned({
  id: 'ai-source-list',
  name: 'AI Source List',
  selector: 'fvdr-ai-source-list',
  description:
    'The collected sources of one answer, numbered to match the inline citation markers, collapsed by default ("6 sources"). Gives a reviewer one place to check everything the answer stood on.',
  whenToUse: [
    'Answers drawing on more than two or three documents',
    'When inline citations use numbered markers',
  ],
  whenNotToUse: [
    'One or two sources (inline citations are enough)',
    'Sources of a different turn',
  ],
  relatedComponents: ['ai-citation', 'ai-permission-note'],
  codeSnippet: `<fvdr-ai-source-list [sources]="answer.sources" [expanded]="false" (docOpened)="openDoc($event)"></fvdr-ai-source-list>`,
  claudePrompt:
    'Build fvdr-ai-source-list: sources:AiDocRef[], expanded:boolean=false; outputs toggled, docOpened. Collapsed: a text button "N sources" in --color-text-secondary. Expanded: numbered fvdr-ai-citation rows whose indexes match the inline markers in the answer.',
});

const aiPermissionNote = planned({
  id: 'ai-permission-note',
  name: 'AI Permission Note',
  selector: 'fvdr-ai-permission-note',
  description:
    'The line that tells the reader an answer is permission-filtered — "Results filtered by your access; some documents are hidden." Non-negotiable in a data room: an incomplete answer that looks complete is a liability, and this is what keeps the assistant honest.',
  whenToUse: [
    'Retrieval hit documents the current user cannot see',
    'Answers rendered under View-As or a restricted group',
    'Any scope where results were trimmed before generation',
  ],
  whenNotToUse: [
    'Hard permission refusals (use AI Error, variant="permission")',
    'General AI disclaimers (use AI Consent Banner)',
  ],
  relatedComponents: ['ai-citation', 'ai-error', 'inline-message'],
  codeSnippet: `<fvdr-ai-permission-note
  [hiddenCount]="3"
  message="Results filtered by your access — 3 documents are hidden."
></fvdr-ai-permission-note>`,
  claudePrompt:
    'Build fvdr-ai-permission-note: message:string, hiddenCount?:number, tone:"info"|"warning"="info". One quiet line under the answer: fvdr-icon "lock-close" plus 12px --color-text-secondary text. No card, no colour fill — it must inform without looking like an error.',
});

const aiScopeBar = planned({
  id: 'ai-scope-bar',
  name: 'AI Scope Bar',
  selector: 'fvdr-ai-scope-bar',
  description:
    'What the assistant is currently allowed to look at — "Data room · Project Atlas" or "/Financials/FY23 · 24 documents" — and the control to change it. Scope is the single biggest driver of answer quality in a VDR, so it must be visible before the user types, not buried in a menu.',
  whenToUse: [
    'Above the composer in every shell',
    'When a chat is opened from a folder or document context',
    'Where the user should be able to narrow or widen retrieval',
  ],
  whenNotToUse: [
    'Per-prompt context pins (use AI Attachment)',
    'Navigation (use Breadcrumbs)',
  ],
  relatedComponents: ['ai-attachment', 'breadcrumbs', 'ai-composer'],
  codeSnippet: `<fvdr-ai-scope-bar
  kind="folder"
  label="/Financials/FY23"
  [docCount]="24"
  [editable]="true"
  (changeRequested)="openScopePicker()"
></fvdr-ai-scope-bar>`,
  claudePrompt:
    'Build fvdr-ai-scope-bar: kind:"room"|"folder"|"document"|"selection", label:string, docCount?:number, editable:boolean=true; output changeRequested. A single quiet row: fvdr-file-icon for the kind, the label (ellipsised, 13px --color-text-secondary), "· N documents", and a "Change" text button on the right. Height 32px, no border — it reads as a caption, not a toolbar.',
});

const aiInlinePrompt = planned({
  id: 'ai-inline-prompt',
  name: 'AI Inline Prompt',
  selector: 'fvdr-ai-inline-prompt',
  description:
    'The one-shot assistant, embedded in a product surface — "Ask about this document" in the viewer, "Draft an answer" in Q&A, "Explain this activity" in the log. Prompt in, one answer out, with a link into the full conversation if the user wants to keep going.',
  whenToUse: [
    'Document viewer, Q&A answer editor, activity log, permission review',
    'Where the answer is needed in place, without leaving the task',
  ],
  whenNotToUse: [
    'Multi-turn work (open the full assistant)',
    'The main assistant surface (use AI Conversation)',
  ],
  relatedComponents: ['ai-composer', 'ai-panel', 'ask-ideon'],
  codeSnippet: `<fvdr-ai-inline-prompt
  placeholder="Ask about this document…"
  [scopeLabel]="doc.name"
  [suggestions]="['Summarize', 'List obligations', 'Find dates']"
  (promptSubmitted)="askInline($event)"
  (expandRequested)="openFullAssistant()"
></fvdr-ai-inline-prompt>`,
  claudePrompt:
    'Build fvdr-ai-inline-prompt: placeholder:string, scopeLabel:string, suggestions:string[], answer?:string, streaming:boolean; outputs promptSubmitted, expandRequested, dismissed. A compact popover-sized column: scope caption, composer with showAddContext=false, suggestion chips, then the streamed answer with fvdr-ai-actions and a "Continue in assistant" link. Max-width 420px.',
});

// ─────────────────────────────────────────────────────────────────────────────
// PLANNED · Shells, history & governance
// ─────────────────────────────────────────────────────────────────────────────

const aiPanel = planned({
  id: 'ai-panel',
  name: 'AI Panel',
  selector: 'fvdr-ai-panel',
  description:
    'The shell the conversation lives in, in three modes — full screen, right sidebar (resizable, pushes the layout) and floating (draggable card over the content) — plus the header that switches between them. One conversation, three containers: the mode must never reset the thread.',
  whenToUse: [
    'Hosting the assistant anywhere in the product',
    'Letting the user keep the chat open while working in the room',
  ],
  whenNotToUse: [
    'One-shot in-place answers (use AI Inline Prompt)',
    'Modal confirmations (use Modal)',
  ],
  relatedComponents: ['ai-conversation', 'ai-thread-list', 'modal'],
  codeSnippet: `<fvdr-ai-panel
  [(mode)]="aiMode"
  [(open)]="aiOpen"
  title="AI assistant"
  [showHistory]="true"
  (newChat)="conv.start()"
>
  <fvdr-ai-conversation [messages]="conv.messages()"></fvdr-ai-conversation>
</fvdr-ai-panel>`,
  claudePrompt:
    'Build fvdr-ai-panel: mode:"fullscreen"|"sidebar"|"floating" (two-way), open:boolean (two-way), title:string, showHistory:boolean; outputs newChat, closed, modeChange. Header: title, new-chat (fvdr-icon "new-session"), history toggle, mode switcher (fvdr-icon "panel-window" / "sidebar-mode" / "floating-mode"), close. Sidebar mode is a 400–560px resizable right rail that pushes the layout; floating is a draggable 380×560 card with a shadow; fullscreen takes the content area. Content is projected. Switching mode must preserve the thread and scroll position.',
});

const aiThreadList = planned({
  id: 'ai-thread-list',
  name: 'AI Thread List',
  selector: 'fvdr-ai-thread-list',
  description:
    'Recent conversations: title, preview, relative time, grouped by day, with rename, pin and delete. In a VDR a thread is also a record of what was asked about the room, so deletion needs a confirm and pinning matters for long deals.',
  whenToUse: [
    'The assistant\'s left rail or history drawer',
    'Resuming a conversation from earlier in a deal',
  ],
  whenNotToUse: [
    'Q&A threads between participants',
    'Activity or audit logs',
  ],
  relatedComponents: ['ai-panel', 'droplist', 'tree'],
  codeSnippet: `<fvdr-ai-thread-list
  [threads]="conv.recents()"
  [activeId]="conv.activeId()"
  (opened)="conv.open($event)"
  (renamed)="conv.rename($event)"
  (deleted)="confirmDelete($event)"
></fvdr-ai-thread-list>`,
  claudePrompt:
    'Build fvdr-ai-thread-list: threads:AiThread[], activeId?:string, groupByDay:boolean=true; outputs opened, renamed, pinned, deleted. AiThread = { id, title, lastMessagePreview, updatedAt, pinned? }. Rows are 2-line buttons (title 14px --color-text-primary, preview 12px --color-text-secondary ellipsised) with a "more" fvdr-droplist on hover. Day group headings in 12px uppercase --color-text-secondary. Active row: bold title, no background fill (FVDR sidebar rule).',
});

const aiFeedbackModal = planned({
  id: 'ai-feedback-modal',
  name: 'AI Feedback Modal',
  selector: 'fvdr-ai-feedback-modal',
  description:
    'What opens after a thumbs-down: pick a reason (wrong, incomplete, missed a document, permission leak), add a comment, and choose whether to attach the transcript. The permission-leak reason routes differently from ordinary quality feedback — that one is a security report.',
  whenToUse: [
    'After a negative rating on an answer',
    'Collecting structured quality signal from a pilot data room',
  ],
  whenNotToUse: [
    'Positive ratings (record and move on)',
    'Product-wide NPS surveys',
  ],
  relatedComponents: ['ai-actions', 'modal', 'radio', 'textarea'],
  codeSnippet: `<fvdr-ai-feedback-modal
  [visible]="feedbackOpen"
  [reasons]="['Incorrect', 'Incomplete', 'Missed a document', 'Showed something I should not see']"
  (submitted)="sendFeedback($event)"
  (cancelled)="feedbackOpen = false"
></fvdr-ai-feedback-modal>`,
  claudePrompt:
    'Build fvdr-ai-feedback-modal: visible:boolean, reasons:string[], allowTranscript:boolean=true; outputs submitted:{reason,comment,includeTranscript}, cancelled. Wraps fvdr-modal size="m": fvdr-radio reason list, fvdr-textarea comment, fvdr-checkbox "Include this conversation". The "showed something I should not see" reason must be flagged as a security report, not quality feedback.',
});

const aiConsentBanner = planned({
  id: 'ai-consent-banner',
  name: 'AI Consent Banner',
  selector: 'fvdr-ai-consent-banner',
  description:
    'The first-run notice explaining what the assistant does with room content, where it is processed, and that answers may be wrong and must be verified against the source. Also the surface for an admin having disabled AI for a data room. Legal and enterprise buyers gate on this screen.',
  whenToUse: [
    'First use of the assistant by a user, or after the terms change',
    'Telling a user AI is disabled for this room and who can enable it',
  ],
  whenNotToUse: [
    'Per-answer caveats (use AI Permission Note)',
    'Runtime errors (use AI Error)',
  ],
  relatedComponents: ['info-banner', 'modal', 'ai-error'],
  codeSnippet: `<fvdr-ai-consent-banner
  variant="first-run"
  [terms]="aiTerms"
  (accepted)="enableAssistant()"
  (declined)="closeAssistant()"
></fvdr-ai-consent-banner>`,
  claudePrompt:
    'Build fvdr-ai-consent-banner: variant:"first-run"|"disabled"|"updated-terms", terms:{ processing:string, retention:string, docsUrl:string }, dismissible:boolean; outputs accepted, declined, learnMore. first-run is a centred card with the Ideon mark, three short bullets (what it reads, where it is processed, verify against sources), a link to the docs and Accept/Not now. disabled is a quiet full-height empty state naming the admin who can turn it on. Never auto-accept.',
});

const aiUsageMeter = planned({
  id: 'ai-usage-meter',
  name: 'AI Usage Meter',
  selector: 'fvdr-ai-usage-meter',
  description:
    'AI consumption against the plan\'s allowance — questions or credits used this period, with a warning threshold and an upgrade path. Lives in billing and, compactly, in the assistant header once the allowance runs low.',
  whenToUse: [
    'Billing and subscription screens',
    'The assistant header when usage crosses the warning threshold',
    'Explaining why the composer is disabled',
  ],
  whenNotToUse: [
    'Storage usage (that has its own meter)',
    'Per-answer latency or token counts — not the user\'s concern',
  ],
  relatedComponents: ['progress', 'ai-composer', 'ai-error'],
  codeSnippet: `<fvdr-ai-usage-meter
  [used]="820"
  [limit]="1000"
  unit="questions"
  periodLabel="this month"
  [warnAt]="0.8"
  (upgradeRequested)="openBilling()"
></fvdr-ai-usage-meter>`,
  claudePrompt:
    'Build fvdr-ai-usage-meter: used:number, limit:number, unit:string="questions", periodLabel:string, warnAt:number=0.8, compact:boolean=false; output upgradeRequested. Wraps fvdr-progress: "820 of 1,000 questions this month", bar turns --color-warning-600 past warnAt and --color-error-600 at the limit, with an Upgrade link. compact renders a single 12px line with no bar for the assistant header.',
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION EXPORT — order is the order shown in the /ds sidebar
// ─────────────────────────────────────────────────────────────────────────────

/** Built and usable today. */
export const DS_AI_SHIPPED: ComponentDocEntry[] = [
  aiComposer,
  aiSteps,
  aiBubble,
  aiCitation,
  aiActions,
];

/** Specced, not built — the AI chat roadmap. */
export const DS_AI_PLANNED: ComponentDocEntry[] = [
  // Conversation core
  aiConversation,
  aiEmptyState,
  aiSuggestions,
  aiMarkdown,
  aiToolCall,
  aiAttachment,
  aiError,
  // VDR answer blocks
  aiAnswerDocList,
  aiAnswerTable,
  aiAnswerSummary,
  aiAnswerReport,
  aiSourceList,
  aiPermissionNote,
  aiScopeBar,
  aiInlinePrompt,
  // Shells, history & governance
  aiPanel,
  aiThreadList,
  aiFeedbackModal,
  aiConsentBanner,
  aiUsageMeter,
];

export const DS_AI_REGISTRY: ComponentDocEntry[] = [...DS_AI_SHIPPED, ...DS_AI_PLANNED];
