import {
  AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { AiRating, AiStep } from '../../shared/ds';
import type { FvdrIconName } from '../../shared/ds/icons/icons';

/** One turn of the full assistant. The assistant body is rendered by the host's template. */
export interface VdrChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Pre-formatted, e.g. "2 minutes ago". */
  at?: string;
  steps?: AiStep[];
  streaming?: boolean;
  done?: boolean;
  /** "1min" — shown as "Completed N steps for 1min". */
  took?: string;
  stepsOpen?: boolean;
  rating?: AiRating;
}

export interface VdrChatThread { id: string; title: string; pinned?: boolean }
export interface VdrChatCategory { id: string; label: string; icon: FvdrIconName; examples: string[] }

/**
 * Full-page AI Assistant, as designed in Figma AI-Assistant (Vhy3jLaJ9nasbzTtqbu3qB),
 * page "✨ General AI chat" (1:4, section 92:11085):
 *   · empty      115:9784 — 80px vortex orb, greeting, category chips → example queries (129:14597)
 *   · streaming  117:10744 / 117:11997 — "Thinking…" orb, then step rows with the live one on an orb
 *   · answered   117:11612 — "Completed N steps for 1min ›", body, copy / rate / regenerate · time
 *   · user hover 117:12255 — time + regenerate / edit / copy under the bubble
 *   · history    129:16236 — Pinned / Chats flyout
 * The composer docks at the bottom: scope chip in a grey tray over a white field, + · mic · send,
 * and Stop while streaming. Prototype-level composition of DS parts, hence `fvdr-vdr-*`.
 */
@Component({
  selector: 'fvdr-vdr-assistant-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="ac">
      <!-- History flyout -->
      <aside class="hist" *ngIf="historyOpen" aria-label="Chat history">
        <div class="hist__top">
          <button type="button" class="ibtn" title="Hide chat history" aria-label="Hide chat history" (click)="historyOpen = false">
            <fvdr-icon name="sidebar-mode"></fvdr-icon>
          </button>
        </div>
        <section class="hist__group" *ngIf="pinned.length">
          <h3 class="hist__h">Pinned</h3>
          <button type="button" class="hist__item" *ngFor="let t of pinned" [class.hist__item--on]="t.id === activeThreadId"
                  (click)="threadSelected.emit(t.id)">{{ t.title }}</button>
        </section>
        <section class="hist__group">
          <h3 class="hist__h">Chats</h3>
          <button type="button" class="hist__item" *ngFor="let t of recent" [class.hist__item--on]="t.id === activeThreadId"
                  (click)="threadSelected.emit(t.id)">{{ t.title }}</button>
        </section>
      </aside>

      <div class="main">
        <!-- Actions top -->
        <div class="bar" *ngIf="turns.length || historyOpen">
          <ng-container *ngIf="!historyOpen">
            <button type="button" class="ibtn" title="Show chat history" aria-label="Show chat history" (click)="historyOpen = true">
              <fvdr-icon name="sidebar-mode"></fvdr-icon>
            </button>
            <button type="button" class="bar__new" (click)="newChat.emit()"><fvdr-icon name="new-session"></fvdr-icon>New chat</button>
          </ng-container>
          <span class="bar__spacer"></span>
          <button type="button" class="bar__back" *ngIf="backLabel" (click)="back.emit()">
            <fvdr-icon name="chevron-left"></fvdr-icon>{{ backLabel }}
          </button>
          <span class="bar__spacer" *ngIf="backLabel"></span>
          <button type="button" class="ibtn" title="Sources" aria-label="Sources"><fvdr-icon name="note"></fvdr-icon></button>
          <button type="button" class="ibtn" title="Export" aria-label="Export"><fvdr-icon name="share"></fvdr-icon></button>
        </div>

        <div class="content">
          <div class="scroll" #scroll>
            <!-- ── Empty state ── -->
            <div class="empty" *ngIf="!turns.length">
              <fvdr-thinking-orbs label="AI Assistant" [size]="80" [showPill]="false" [showLabel]="false"></fvdr-thinking-orbs>
              <div class="empty__txt">
                <h2 class="empty__title">{{ greeting }}</h2>
                <p class="empty__sub">{{ subtitle }}</p>
              </div>
              <div class="cats" role="tablist" aria-label="What do you want to do?">
                <button type="button" class="cat" *ngFor="let c of categories" role="tab"
                        [class.cat--on]="c.id === activeCategory" [attr.aria-selected]="c.id === activeCategory"
                        (click)="activeCategory = activeCategory === c.id ? '' : c.id">
                  <fvdr-icon [name]="c.icon"></fvdr-icon>{{ c.label }}
                </button>
              </div>
              <div class="examples" *ngIf="currentCategory as c">
                <p class="examples__h">Example queries</p>
                <button type="button" class="ex" *ngFor="let q of c.examples"
                        (mouseenter)="preview = q" (mouseleave)="preview = ''" (focus)="preview = q" (blur)="preview = ''"
                        (click)="send(q)">
                  <fvdr-icon name="sparkle"></fvdr-icon><span>{{ q }}</span>
                </button>
              </div>
            </div>

            <!-- ── Transcript ── -->
            <div class="turns" *ngIf="turns.length">
              <ng-container *ngFor="let t of turns; trackBy: byId">
                <div class="q" *ngIf="t.role === 'user'">
                  <div class="q__bubble">{{ t.text }}</div>
                  <div class="q__meta">
                    <span *ngIf="t.at">{{ t.at }}</span>
                    <button type="button" class="ibtn ibtn--s" title="Ask again" aria-label="Ask again" (click)="send(t.text)"><fvdr-icon name="refresh"></fvdr-icon></button>
                    <button type="button" class="ibtn ibtn--s" title="Edit" aria-label="Edit" (click)="draft = t.text"><fvdr-icon name="edit"></fvdr-icon></button>
                    <button type="button" class="ibtn ibtn--s" title="Copy" aria-label="Copy"><fvdr-icon name="copy"></fvdr-icon></button>
                  </div>
                </div>

                <div class="a" *ngIf="t.role === 'assistant'">
                  <!-- Thinking, no steps yet -->
                  <fvdr-thinking-orbs *ngIf="t.streaming && !t.steps?.length" class="a__think" label="Thinking..." [size]="20" [showPill]="false"></fvdr-thinking-orbs>

                  <!-- Live steps -->
                  <ul class="steps" *ngIf="t.streaming && t.steps?.length">
                    <li class="step" *ngFor="let s of t.steps; let last = last" [class.step--live]="!s.done">
                      <fvdr-thinking-orbs *ngIf="!s.done" [size]="16" [showPill]="false" [showLabel]="false" label="Working"></fvdr-thinking-orbs>
                      <fvdr-icon *ngIf="s.done" name="check" class="step__ok"></fvdr-icon>
                      <span class="step__label">{{ s.label }}</span>
                      <span class="step__meta" *ngIf="s.detail">{{ s.detail }}</span>
                    </li>
                  </ul>

                  <!-- Finished -->
                  <ng-container *ngIf="!t.streaming">
                    <button type="button" class="done" *ngIf="t.steps?.length" [attr.aria-expanded]="!!t.stepsOpen" (click)="t.stepsOpen = !t.stepsOpen">
                      Completed {{ t.steps!.length }} steps{{ t.took ? ' for ' + t.took : '' }}
                      <fvdr-icon [name]="t.stepsOpen ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                    </button>
                    <ul class="steps steps--audit" *ngIf="t.stepsOpen">
                      <li class="step" *ngFor="let s of t.steps">
                        <fvdr-icon name="check" class="step__ok"></fvdr-icon>
                        <span class="step__label">{{ s.label }}</span>
                        <span class="step__meta" *ngIf="s.detail">{{ s.detail }}</span>
                      </li>
                    </ul>
                    <div class="a__body">
                      <ng-container *ngIf="answerTemplate; else plain">
                        <ng-container *ngTemplateOutlet="answerTemplate; context: { $implicit: t }"></ng-container>
                      </ng-container>
                      <ng-template #plain><p class="a__p">{{ t.text }}</p></ng-template>
                    </div>
                    <div class="a__actions">
                      <button type="button" class="ibtn ibtn--s" title="Copy" aria-label="Copy answer"><fvdr-icon name="copy"></fvdr-icon></button>
                      <button type="button" class="ibtn ibtn--s" [class.ibtn--on]="t.rating === 'up'" title="Good answer" aria-label="Good answer"
                              (click)="t.rating = t.rating === 'up' ? null : 'up'"><fvdr-icon name="thumbs-up"></fvdr-icon></button>
                      <button type="button" class="ibtn ibtn--s" [class.ibtn--on]="t.rating === 'down'" title="Bad answer" aria-label="Bad answer"
                              (click)="t.rating = t.rating === 'down' ? null : 'down'"><fvdr-icon name="thumbs-down"></fvdr-icon></button>
                      <button type="button" class="ibtn ibtn--s" title="Regenerate" aria-label="Regenerate" (click)="regenerate.emit(t)"><fvdr-icon name="refresh"></fvdr-icon></button>
                      <span class="a__time" *ngIf="t.at">{{ t.at }}</span>
                    </div>
                  </ng-container>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- ── Composer ── -->
          <div class="prompt">
            <button type="button" class="scope"><fvdr-icon name="documents"></fvdr-icon>{{ scopeLabel }}<fvdr-icon name="chevron-down" class="scope__caret"></fvdr-icon></button>
            <div class="field" [class.field--focus]="focused">
              <textarea #input class="field__input" rows="2" [placeholder]="preview || placeholder"
                        [(ngModel)]="draft" (focus)="focused = true" (blur)="focused = false"
                        (keydown.enter)="onEnter($event)" aria-label="Message the AI Assistant"></textarea>
              <div class="field__bar">
                <button type="button" class="ibtn ibtn--l" title="Add files" aria-label="Add files"><fvdr-icon name="plus"></fvdr-icon></button>
                <button *ngIf="showTools" type="button" class="tools"><fvdr-icon name="settings-filter"></fvdr-icon>Tools</button>
                <span class="bar__spacer"></span>
                <button type="button" class="ibtn ibtn--l" title="Voice input" aria-label="Voice input"><fvdr-icon name="mic"></fvdr-icon></button>
                <button *ngIf="busy" type="button" class="ibtn ibtn--l ibtn--stop" title="Stop" aria-label="Stop generating" (click)="stop.emit()"><fvdr-icon name="stop"></fvdr-icon></button>
                <button type="button" class="send" [disabled]="!canSend" title="Send" aria-label="Send" (click)="send(draft)"><fvdr-icon name="send"></fvdr-icon></button>
              </div>
            </div>
          </div>
          <p class="note">{{ footnote }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; min-height: 0; font-family: var(--font-family); color: var(--color-text-primary);
      font-size: var(--font-size-base, 14px); }
    .ac { display: flex; height: 100%; min-height: 0; }

    .hist { flex: 0 0 280px; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-2) var(--space-3);
      box-sizing: border-box; border-right: 1px solid var(--color-divider); overflow-y: auto; }
    .hist__group { display: flex; flex-direction: column; gap: var(--space-1); }
    .hist__h { margin: 0 0 var(--space-2); padding: 0 var(--space-1) 0 var(--space-3); font-size: var(--text-caption1-size, 12px);
      line-height: 16px; font-weight: var(--font-weight-semi, 600); }
    .hist__item { height: 32px; padding: 0 var(--space-3); border: none; border-radius: var(--radius-sm); background: transparent;
      cursor: pointer; text-align: left; font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-text-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hist__item:hover { background: var(--color-hover-bg); }
    .hist__item--on, .hist__item--on:hover { background: var(--chip-bg-green); }

    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
    .bar { flex: 0 0 56px; display: flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-3); box-sizing: border-box; }
    .bar__spacer { flex: 1; }
    .bar__new { display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-3); border: none;
      background: transparent; border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-family);
      font-size: var(--font-size-md, 15px); color: var(--color-text-primary); }
    .bar__back { display: inline-flex; align-items: center; gap: var(--space-2); height: 32px; padding: 0 var(--space-3);
      border: 1px solid var(--color-divider); border-radius: var(--radius-full); background: var(--color-stone-0); cursor: pointer;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-text-primary); box-shadow: var(--shadow-card); }
    .bar__back:hover { background: var(--color-stone-200); }
    .tools { display: inline-flex; align-items: center; gap: var(--space-2); height: 32px; padding: 0 var(--space-2); border: none;
      border-radius: var(--radius-sm); background: transparent; cursor: pointer; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); }
    .tools:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .bar__new:hover { background: var(--color-hover-bg); }

    .ibtn { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: none;
      background: transparent; border-radius: var(--radius-sm); cursor: pointer; color: var(--color-text-secondary);
      font-size: var(--font-size-lg, 16px); flex: 0 0 auto; }
    .ibtn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .ibtn--s { width: 24px; height: 24px; font-size: var(--font-size-base, 14px); }
    .ibtn--l { width: 40px; height: 40px; }
    .ibtn--on { color: var(--color-primary-500); }
    .ibtn--stop { border: 1px solid var(--color-stone-500); color: var(--color-text-primary); }

    .content { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4) var(--space-4) var(--space-6); }
    .scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0 var(--space-6); }

    /* Empty state */
    .empty { min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-6);
      text-align: center; padding: var(--space-6) 0; box-sizing: border-box; }
    .empty__txt { display: flex; flex-direction: column; gap: var(--space-2); max-width: 440px; }
    .empty__title { margin: 0; font-size: var(--font-size-lg, 16px); line-height: 24px; font-weight: var(--font-weight-semi, 600); }
    .empty__sub { margin: 0; line-height: 20px; color: var(--color-text-secondary); }
    .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); margin-top: calc(var(--space-3) * -1); }
    .cat { display: inline-flex; align-items: center; gap: var(--space-2); height: 28px; padding: 0 var(--space-2); border: none;
      border-radius: var(--radius-full); background: var(--chip-bg-green); cursor: pointer; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .cat fvdr-icon { color: var(--color-primary-500); }
    .cat:hover { background: var(--color-primary-50); }
    .cat--on, .cat--on:hover { background: var(--color-primary-500); color: var(--color-stone-0); }
    .cat--on fvdr-icon { color: var(--color-stone-0); }
    .examples { width: 100%; max-width: 600px; display: flex; flex-direction: column; text-align: left; }
    .examples__h { margin: 0; padding: 0 var(--space-4) var(--space-2); font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
    .ex { display: flex; align-items: center; gap: var(--space-2); min-height: 36px; padding: var(--space-2) var(--space-3); border: none;
      border-radius: var(--radius-sm); background: transparent; cursor: pointer; text-align: left; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); line-height: 20px; color: var(--color-text-primary); }
    .ex fvdr-icon { flex: 0 0 auto; color: var(--color-primary-500); }
    .ex:hover, .ex:focus-visible { background: var(--color-stone-200); outline: none; }

    /* Transcript */
    .turns { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-2) 0 var(--space-4); }
    .q { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
    .q__bubble { max-width: min(466px, 70%); padding: var(--space-4); border-radius: var(--radius-xl, 16px); background: var(--color-stone-200);
      line-height: 20px; white-space: pre-wrap; }
    .q__meta { display: flex; align-items: center; gap: var(--space-2); min-height: 24px; font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-placeholder); opacity: 0; transition: opacity 0.12s ease; }
    .q:hover .q__meta, .q:focus-within .q__meta { opacity: 1; }

    .a { display: flex; flex-direction: column; gap: var(--space-2); }
    .a__think { align-self: flex-start; }
    .steps { display: flex; flex-direction: column; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
    .steps--audit { padding-left: var(--space-1); margin-bottom: var(--space-2); }
    .step { display: flex; align-items: center; gap: var(--space-2); line-height: 20px; color: var(--color-text-secondary); }
    .step__ok { color: var(--color-primary-500); flex: 0 0 auto; }
    .step--live .step__label { color: var(--color-text-primary); font-weight: var(--font-weight-semi, 600); }
    .step__meta { color: var(--color-text-placeholder); }
    .done { align-self: flex-start; display: inline-flex; align-items: center; gap: var(--space-2); padding: 0; border: none;
      background: transparent; cursor: pointer; font-family: var(--font-family); font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); }
    .done:hover { color: var(--color-text-primary); }
    .a__body { line-height: 20px; }
    .a__p { margin: 0; }
    .a__actions { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-2); }
    .a__time { margin-left: var(--space-2); font-size: var(--text-caption1-size, 12px); color: var(--color-text-placeholder); }

    /* Composer */
    .prompt { flex: 0 0 auto; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-1); margin: 0 var(--space-2);
      background: var(--color-stone-200); border-radius: var(--radius-md); }
    .scope { align-self: flex-start; display: inline-flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-3);
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer; font-family: var(--font-family);
      font-size: var(--font-size-md, 15px); color: var(--color-text-primary); }
    .scope:hover { background: var(--color-hover-bg); }
    .scope__caret { color: var(--color-text-secondary); font-size: var(--text-caption1-size, 12px); }
    .field { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-3) var(--space-2) var(--space-3) var(--space-4);
      background: var(--color-stone-0); border: 1px solid var(--color-stone-300); border-radius: var(--radius-sm); box-shadow: var(--shadow-card);
      transition: border-color 0.15s ease; }
    .field--focus { border-color: var(--color-primary-500); }
    .field__input { min-height: 48px; max-height: 160px; padding: 0 var(--space-2); border: none; outline: none; resize: none; background: transparent;
      font-family: var(--font-family); font-size: var(--font-size-md, 15px); line-height: 24px; color: var(--color-text-primary); }
    .field__input::placeholder { color: var(--color-text-placeholder); }
    .field__bar { display: flex; align-items: center; gap: var(--space-4); }
    .send { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: none;
      border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0); cursor: pointer;
      font-size: var(--font-size-base, 14px); }
    .send:hover { background: var(--color-primary-600); }
    .send:disabled { background: var(--color-primary-200); cursor: not-allowed; }
    .note { margin: 0; text-align: center; font-size: var(--text-caption1-size, 12px); line-height: 16px; color: var(--color-text-secondary); }
  `],
})
export class VdrAssistantChatComponent implements AfterViewChecked {
  @Input() turns: VdrChatTurn[] = [];
  @Input() busy = false;
  @Input() answerTemplate?: TemplateRef<{ $implicit: VdrChatTurn }>;
  @Input() scopeLabel = 'All files and folders';
  @Input() threads: VdrChatThread[] = [];
  @Input() activeThreadId = '';
  @Input() greeting = 'Tap into Ideals AI Assistant';
  @Input() subtitle = 'Get instant answers to your most complex work questions without having to dig through the project.';
  @Input() footnote = 'Every answer comes only from files you’re already allowed to see in this project';
  @Input() categories: VdrChatCategory[] = DEFAULT_CATEGORIES;
  /** Pill centred in the top bar, e.g. "Back to search results" (V1.2). Empty hides it. */
  @Input() backLabel = '';
  @Input() showTools = false;
  @Input() placeholder = 'Write a message...';
  @Output() back = new EventEmitter<void>();

  @Output() submitted = new EventEmitter<string>();
  @Output() stop = new EventEmitter<void>();
  @Output() newChat = new EventEmitter<void>();
  @Output() threadSelected = new EventEmitter<string>();
  @Output() regenerate = new EventEmitter<VdrChatTurn>();

  @ViewChild('scroll') private scrollRef?: ElementRef<HTMLElement>;

  historyOpen = false;
  activeCategory = '';
  preview = '';
  draft = '';
  focused = false;
  private lastCount = 0;
  private lastStepCount = 0;

  get pinned(): VdrChatThread[] { return this.threads.filter(t => t.pinned); }
  get recent(): VdrChatThread[] { return this.threads.filter(t => !t.pinned); }
  get currentCategory(): VdrChatCategory | undefined { return this.categories.find(c => c.id === this.activeCategory); }
  get canSend(): boolean { return !this.busy && this.draft.trim().length > 0; }

  byId = (_: number, t: { id: string }) => t.id;

  onEnter(e: Event): void {
    const k = e as KeyboardEvent;
    if (k.shiftKey) return;
    k.preventDefault();
    this.send(this.draft);
  }

  send(text: string): void {
    const q = text.trim();
    if (!q || this.busy) return;
    this.draft = '';
    this.preview = '';
    this.submitted.emit(q);
  }

  /** Follow the newest turn when a turn or a step is added. */
  ngAfterViewChecked(): void {
    const steps = this.turns.reduce((n, t) => n + (t.steps?.length ?? 0) + (t.streaming ? 0 : 1), 0);
    if (this.turns.length === this.lastCount && steps === this.lastStepCount) return;
    this.lastCount = this.turns.length;
    this.lastStepCount = steps;
    const el = this.scrollRef?.nativeElement;
    if (el) queueMicrotask(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
  }
}

/** Figma 129:14597 — Summarise examples verbatim; the other three written in the same voice. */
export const DEFAULT_CATEGORIES: VdrChatCategory[] = [
  { id: 'summarise', label: 'Summarise', icon: 'finished', examples: [
    'Summarise this week’s buyer activity for the client status update',
    'Summarise what is still missing against our standard diligence index',
    'Summarise the Q&A questions past their due date and who they are waiting on',
    'Summarise who can access 04. HR and flag anyone outside the deal team',
  ] },
  { id: 'find', label: 'Find across files', icon: 'search', examples: [
    'Find every agreement with a change of control clause',
    'Find the latest version of the FY 2023 financial statements',
    'Find documents that mention Project Falcon but aren’t published yet',
  ] },
  { id: 'catch-up', label: 'Catch up', icon: 'trending-up', examples: [
    'What changed in the room since my last sign-in?',
    'Which bidders were most active this week?',
    'What new Q&A questions came in overnight?',
  ] },
  { id: 'draft', label: 'Draft', icon: 'edit', examples: [
    'Draft a reply to the open Q&A question about the earn-out',
    'Draft a reminder to participants who haven’t signed in yet',
    'Draft a status update for the deal lead',
  ] },
];
