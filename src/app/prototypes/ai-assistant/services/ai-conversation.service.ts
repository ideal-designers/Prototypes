import { Injectable, computed, signal } from '@angular/core';
import { ChatMessage, RecentChat } from '../models/ai-message.model';
import { AiStep } from '../models/ai-step.model';
import { AnswerPayload } from '../models/ai-scenario.model';
import { MOCK_DATA_ROOM, MOCK_RECENTS } from '../data/mock-data';

let seq = 0;
const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${++seq}`;

/** Which shell is currently rendered. `documents` = mock host page with no assistant open. */
export type AiShell = 'fullscreen' | 'documents' | 'sidebar' | 'floating';

/** Retrieval scope of the active chat. */
export interface AiScope {
  kind: 'room' | 'folder';
  label: string;
  /** Set when `kind === 'folder'`. */
  folderName?: string;
}

/**
 * Signal-based conversation store. Hosted once by the routed component and shared
 * by every shell, so promoting a chat between shells never loses history.
 */
@Injectable()
export class AiConversationService {
  /** Transcript of the active chat. */
  readonly messages = signal<ChatMessage[]>([]);
  /** Scope the assistant answers within — whole room, or a seeded folder. */
  readonly scope = signal<AiScope>({ kind: 'room', label: MOCK_DATA_ROOM.name });
  /** Convenience label used in step details and shell headers. */
  readonly currentScope = computed(() => this.scope().label);
  readonly recents = signal<RecentChat[]>([...MOCK_RECENTS]);
  readonly activeChatId = signal<string | null>(null);

  /** Presentation mode — the mode-promotion switcher reads this. */
  readonly shell = signal<AiShell>('fullscreen');
  /** Title shown by the floating window, seeded from the context it was opened from. */
  readonly seededTitle = signal<string>('New AI chat');
  readonly isDark = signal(false);

  /** Non-null while the Create project modal is open (Scenario D). */
  readonly createProjectRequest = signal<string | null>(null);

  readonly isEmpty = computed(() => this.messages().length === 0);

  // ── Shell / theme ──

  setShell(shell: AiShell): void {
    this.shell.set(shell);
  }

  toggleDark(): void {
    this.isDark.update(v => !v);
  }

  // ── Scope ──

  setScope(scope: AiScope): void {
    this.scope.set(scope);
  }

  resetScope(): void {
    this.scope.set({ kind: 'room', label: MOCK_DATA_ROOM.name });
  }

  // ── Chat lifecycle ──

  newChat(): void {
    this.messages.set([]);
    this.activeChatId.set(null);
    this.seededTitle.set('New AI chat');
    this.resetScope();
  }

  /**
   * Transcripts aren't persisted, so opening a recent just marks it active
   * and shows its (empty) transcript.
   */
  openRecent(id: string): void {
    this.activeChatId.set(id);
    this.messages.set([]);
  }

  // ── Messages ──

  addMessage(message: ChatMessage): ChatMessage {
    this.messages.update(list => [...list, message]);
    return message;
  }

  addUserMessage(text: string): ChatMessage {
    return this.addMessage({
      id: uid('u'),
      role: 'user',
      text,
      createdAt: Date.now(),
    });
  }

  addAssistantMessage(): ChatMessage {
    return this.addMessage({
      id: uid('a'),
      role: 'assistant',
      text: '',
      createdAt: Date.now(),
      steps: [],
      streaming: true,
      done: false,
      stepsExpanded: true,
    });
  }

  /** Assistant turn with no streaming phase — used for post-confirmation replies. */
  addAssistantAnswer(answer: AnswerPayload, text: string): ChatMessage {
    return this.addMessage({
      id: uid('a'),
      role: 'assistant',
      text,
      createdAt: Date.now(),
      steps: [],
      answer,
      streaming: false,
      done: true,
      stepsExpanded: false,
    });
  }

  patchMessage(id: string, patch: Partial<ChatMessage>): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  appendStep(id: string, step: AiStep): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, steps: [...(m.steps ?? []), step] } : m)),
    );
  }

  completeMessage(id: string, answer: AnswerPayload, text: string): void {
    this.patchMessage(id, { answer, text, streaming: false, done: true, stepsExpanded: false });
  }

  cancelMessage(id: string): void {
    this.patchMessage(id, { streaming: false, done: true, cancelled: true, stepsExpanded: false });
  }

  toggleSteps(id: string): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, stepsExpanded: !m.stepsExpanded } : m)),
    );
  }

  // ── Scenario D ──

  /** Opens the Create project modal, prefilled with `name`. */
  requestCreateProject(name = ''): void {
    this.createProjectRequest.set(name);
  }

  dismissCreateProject(): void {
    this.createProjectRequest.set(null);
  }
}
