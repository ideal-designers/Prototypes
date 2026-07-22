import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DS_COMPONENTS } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { QNA_EDITOR_ICONS } from './qna-editor-icons';

type QnaTab = 'answer' | 'note';
type FmtKey = 'bold' | 'color' | 'highlight' | 'list' | 'align';

@Component({
  selector: 'fvdr-qna-answer-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">QnA Answer Editor</h1>
        <p class="page-subtitle">
          Модифікований варіант rich-text редактора з Q&amp;A тредів продукту (Answer / Internal note).
          Відступи нижче можна крутити повзунками, щоб підібрати рівний, акуратний вигляд.
        </p>
      </div>

      <!-- ── Product replica ─────────────────────────────────────────── -->
      <div
        class="replica-stage"
        [ngStyle]="{
          '--gap-toolbar': gapToolbar + 'px',
          '--pad-inside': padInside + 'px'
        }"
      >
        <div class="answer-block">
          <div class="tabs">
            <button
              type="button"
              class="tab"
              [class.tab--active]="activeTab === 'answer'"
              (click)="activeTab = 'answer'"
            >Answer</button>
            <button
              type="button"
              class="tab"
              [class.tab--active]="activeTab === 'note'"
              (click)="activeTab = 'note'"
            >Internal note</button>
          </div>

          <div class="editor-card" [class.editor-card--focused]="focused">
            <div class="toolbar toolbar--top">
              <div class="tool-group tool-group--split" *ngFor="let t of splitTools" [class.tool-group--pressed]="fmt[t.key]">
                <button type="button" class="tool-part tool-part--icon" (click)="fmt[t.key] = !fmt[t.key]" [attr.aria-label]="t.label" [attr.title]="t.label">
                  <span class="tool-icon" [innerHTML]="icons[t.icon]"></span>
                </button>
                <button type="button" class="tool-part tool-part--caret" (click)="fmt[t.key] = !fmt[t.key]" [attr.aria-label]="t.label + ' options'" [attr.title]="t.label + ' options'">
                  <span class="tool-caret" [innerHTML]="icons.caret"></span>
                </button>
              </div>
              <span class="tool-divider"></span>
              <div class="tool-group tool-group--plain">
                <button type="button" class="tool-part tool-part--icon" (click)="clearFormatting()" aria-label="Clear formatting" title="Clear formatting">
                  <span class="tool-icon" [innerHTML]="icons.clearFormat"></span>
                </button>
              </div>
            </div>

            <textarea
              class="editor-body"
              rows="4"
              maxlength="5000"
              placeholder="Type your answer"
              [(ngModel)]="text"
              (focus)="focused = true"
              (blur)="focused = false"
            ></textarea>

            <div class="toolbar toolbar--bottom">
              <div class="toolbar-left">
                <div class="tool-group tool-group--plain">
                  <button type="button" class="tool-part tool-part--icon tool-part--text" aria-label="Font size" title="Font size">Aa</button>
                </div>
                <div class="tool-group tool-group--plain">
                  <button type="button" class="tool-part tool-part--icon" aria-label="Emoji" title="Emoji">
                    <span class="tool-icon" [innerHTML]="icons.smiley"></span>
                  </button>
                </div>
                <div class="tool-group tool-group--plain">
                  <button type="button" class="tool-part tool-part--icon" aria-label="Insert link" title="Insert link">
                    <span class="tool-icon" [innerHTML]="icons.link"></span>
                  </button>
                </div>
                <div class="tool-group tool-group--plain">
                  <button type="button" class="tool-part tool-part--icon" aria-label="Attach file" title="Attach file">
                    <span class="tool-icon" [innerHTML]="icons.attachment"></span>
                  </button>
                </div>
              </div>
              <button type="button" class="send-btn" [disabled]="!text.trim()" aria-label="Send">
                <span class="tool-icon" [innerHTML]="icons.send"></span>
              </button>
            </div>
          </div>

          <div class="editor-footer">
            <span class="footer-hint">
              {{ activeTab === 'answer' ? 'Answer will be sent for review' : 'Visible only to your team, not shared with the counterparty' }}
            </span>
            <span class="footer-counter">{{ text.length }}/5000</span>
          </div>
        </div>
      </div>

      <!-- ── Spacing playground ──────────────────────────────────────── -->
      <div class="playground">
        <h2 class="playground-title">Spacing playground</h2>
        <p class="playground-note">
          Кожен toolbar-тул із дропдауном (Bold, Text color, Highlight, List, Align) — це <b>дві окремі кнопки</b>
          (іконка + caret), як і в проді — з тонкою розділювальною лінією між ними. Керування навмисно обмежене
          двома речами, які безпечно можна прибити в реальному коді: гап між елементами тулбара і паддінг
          усередині кожного елемента.
        </p>
        <div class="playground-grid">
          <div class="control">
            <fvdr-range [(ngModel)]="gapToolbar" [min]="0" [max]="16" [label]="'Gap between toolbar elements — ' + gapToolbar + 'px'" [showValue]="false"></fvdr-range>
          </div>
          <div class="control">
            <fvdr-range [(ngModel)]="padInside" [min]="0" [max]="14" [label]="'Padding inside each toolbar element — ' + padInside + 'px'" [showValue]="false"></fvdr-range>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: var(--color-stone-0, #fff);
      padding: var(--space-8, 32px);
      display: flex;
      flex-direction: column;
      gap: var(--space-8, 32px);
      align-items: center;
    }

    .page-header {
      max-width: 720px;
      width: 100%;
      text-align: left;
    }
    .page-title {
      font-family: var(--font-family);
      font-size: var(--font-size-3xl, 22px);
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2, 8px);
    }
    .page-subtitle {
      font-family: var(--font-family);
      font-size: var(--font-size-md, 14px);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Replica stage — dark surface matching product screenshot ── */
    .replica-stage {
      width: 100%;
      max-width: 720px;
      background: var(--primitive-dark-stone-0, #1f2129);
      border-radius: var(--radius-lg, 12px);
      padding: var(--space-8, 32px);
    }

    .answer-block { display: flex; flex-direction: column; }

    .tabs {
      display: flex;
      align-items: flex-end;
      gap: var(--space-6, 24px);
      padding: 0 var(--space-1, 4px);
    }
    .tab {
      appearance: none;
      background: transparent;
      border: 1.5px solid transparent;
      border-bottom: none;
      border-radius: var(--radius-sm, 4px) var(--radius-sm, 4px) 0 0;
      padding: var(--space-2, 8px) var(--space-1, 4px) var(--space-3, 12px);
      margin-bottom: -1.5px;
      font-family: var(--font-family);
      font-size: var(--font-size-md, 14px);
      font-weight: 500;
      color: var(--primitive-dark-stone-700, #8b949a);
      cursor: pointer;
      position: relative;
      z-index: 1;
      transition: color 0.15s ease;
    }
    .tab:hover { color: var(--primitive-dark-stone-900, #b5bbbf); }
    .tab--active {
      color: var(--primitive-dark-stone-1000, #fff);
      font-weight: 600;
      border-color: var(--color-primary-500, #2C9C74);
      background: var(--primitive-dark-stone-0, #1f2129);
    }

    .editor-card {
      border: 1.5px solid var(--primitive-dark-stone-400, #40464a);
      border-radius: var(--radius-sm, 4px);
      background: var(--primitive-dark-stone-0, #1f2129);
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease;
    }
    .editor-card--focused {
      border-color: var(--color-primary-500, #2C9C74);
    }

    /*
     * Toolbar spacing exposes exactly the two levers that are safe to implement
     * against the real (dynamically rendered) toolbar: the gap between toolbar
     * elements, and the padding inside each element — never a one-off offset
     * pinned to one specific button instance or DOM index.
     */
    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--gap-toolbar, 4px);
      padding: var(--space-2, 8px) var(--space-3, 12px);
    }
    .toolbar--top { border-bottom: 1px solid var(--primitive-dark-stone-300, #33383b); }
    .toolbar--bottom {
      border-top: 1px solid var(--primitive-dark-stone-300, #33383b);
      justify-content: space-between;
    }
    .toolbar-left { display: flex; align-items: center; gap: var(--gap-toolbar, 4px); }

    .tool-divider {
      width: 1px;
      align-self: stretch;
      background: var(--primitive-dark-stone-300, #33383b);
      margin: 0 var(--space-1, 4px);
    }

    /* Each toolbar element (a plain button, or an icon+caret split pair) is one
       flex child — the gap above is the only thing controlling space between them. */
    .tool-group {
      display: flex;
      align-items: stretch;
      border-radius: var(--radius-sm, 4px);
      color: var(--primitive-dark-stone-700, #8b949a);
      cursor: pointer;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .tool-group:hover,
    .tool-group:focus-within { background: var(--primitive-dark-stone-300, #33383b); color: var(--primitive-dark-stone-1000, #fff); }
    .tool-group--pressed { background: var(--primitive-dark-stone-300, #33383b); color: var(--color-primary-500, #2C9C74); }

    /* Sub-buttons never carry their own background/radius — the wrapping .tool-group
       renders one continuous pill regardless of which part (icon or caret) is hovered.
       A thin hairline between the two parts is what reads as "split" at rest. */
    .tool-part {
      appearance: none;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      color: inherit;
      cursor: pointer;
      font: inherit;
      padding: var(--pad-inside, 6px);
    }
    .tool-group--split .tool-part--icon {
      border-right: 1px solid var(--primitive-dark-stone-400, #40464a);
    }
    .tool-group--split .tool-part--caret { opacity: 0.7; }
    .tool-part--text {
      font-family: var(--font-family);
      font-size: var(--font-size-sm, 13px);
      font-weight: 600;
    }
    .tool-icon { display: flex; width: 16px; height: 16px; }
    .tool-icon ::ng-deep svg { width: 100%; height: 100%; }
    .tool-caret { display: flex; width: 10px; height: 10px; }
    .tool-caret ::ng-deep svg { width: 100%; height: 100%; }

    .editor-body {
      appearance: none;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      min-height: 96px;
      padding: var(--space-3, 12px);
      font-family: var(--font-family);
      font-size: var(--font-size-md, 14px);
      line-height: 1.5;
      color: var(--primitive-dark-stone-1000, #fff);
    }
    .editor-body::placeholder { color: var(--primitive-dark-stone-600, #6f7980); }

    .send-btn {
      appearance: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary-500, #2C9C74);
      color: #fff;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .send-btn .tool-icon { width: 15px; height: 15px; }
    .send-btn:hover:not(:disabled) { background: var(--color-primary-600, #1C8269); }
    .send-btn:disabled {
      background: var(--primitive-dark-stone-400, #40464a);
      color: var(--primitive-dark-stone-700, #8b949a);
      cursor: default;
    }

    .editor-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--space-2, 8px);
      padding: 0 var(--space-1, 4px);
      font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px);
    }
    .footer-hint { color: var(--primitive-dark-stone-700, #8b949a); }
    .footer-counter { color: var(--primitive-dark-stone-600, #6f7980); }

    /* ── Spacing playground ── */
    .playground {
      width: 100%;
      max-width: 720px;
      border-top: 1px solid var(--color-divider, #DEE0EB);
      padding-top: var(--space-6, 24px);
    }
    .playground-title {
      font-family: var(--font-family);
      font-size: var(--font-size-md, 14px);
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2, 8px);
    }
    .playground-note {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0 0 var(--space-5, 20px);
      max-width: 640px;
    }
    .playground-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-5, 20px) var(--space-6, 24px);
    }
    .control { display: flex; flex-direction: column; gap: var(--space-2, 8px); }

    @media (max-width: 640px) {
      .playground-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class QnaAnswerEditorComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private sanitizer = inject(DomSanitizer);

  icons: Record<keyof typeof QNA_EDITOR_ICONS, SafeHtml> = Object.fromEntries(
    Object.entries(QNA_EDITOR_ICONS).map(([key, svg]) => [key, this.sanitizer.bypassSecurityTrustHtml(svg)]),
  ) as Record<keyof typeof QNA_EDITOR_ICONS, SafeHtml>;

  activeTab: QnaTab = 'answer';
  focused = false;
  text = '';

  fmt: Record<FmtKey, boolean> =
    { bold: false, color: false, highlight: false, list: false, align: false };

  // Every "split" tool = an icon button + a separate caret button, matching the
  // real toolbar's DOM structure (each part is independently hoverable/focusable).
  splitTools: { key: FmtKey; icon: keyof typeof QNA_EDITOR_ICONS; label: string }[] = [
    { key: 'bold', icon: 'bold', label: 'Bold' },
    { key: 'color', icon: 'textColor', label: 'Text color' },
    { key: 'highlight', icon: 'highlight', label: 'Background color' },
    { key: 'list', icon: 'listNum', label: 'Numbered list' },
    { key: 'align', icon: 'alignLeft', label: 'Align' },
  ];

  // Spacing playground state — bound as CSS custom properties on .replica-stage
  gapToolbar = 4;
  padInside = 6;

  ngOnInit(): void {
    this.tracker.trackPageView('qna-answer-editor');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  clearFormatting(): void {
    this.fmt = { bold: false, color: false, highlight: false, list: false, align: false };
  }
}
