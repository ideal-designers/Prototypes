import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { MdBlock, parseMarkdown } from './markdown';

/**
 * The prose renderer for assistant answers.
 * Renders a safe markdown subset onto FVDR type and spacing — no innerHTML, so
 * model output can never become markup. Tolerates partial markup mid-stream and
 * shows a caret at the end of the streamed text.
 */
@Component({
  selector: 'fvdr-ai-markdown',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="md" [class.md--streaming]="streaming">
      <ng-container *ngFor="let b of blocks">
        <ng-container [ngSwitch]="b.kind">

          <h2 class="md__h2" *ngSwitchCase="'heading'" [class.md__h3]="b.level === 3">
            <ng-container *ngTemplateOutlet="inline; context: { spans: b.spans }"></ng-container>
          </h2>

          <p class="md__p" *ngSwitchCase="'paragraph'">
            <ng-container *ngTemplateOutlet="inline; context: { spans: b.spans }"></ng-container>
          </p>

          <ng-container *ngSwitchCase="'list'">
            <ol class="md__list" *ngIf="b.ordered">
              <li *ngFor="let item of b.items">
                <ng-container *ngTemplateOutlet="inline; context: { spans: item }"></ng-container>
              </li>
            </ol>
            <ul class="md__list" *ngIf="!b.ordered">
              <li *ngFor="let item of b.items">
                <ng-container *ngTemplateOutlet="inline; context: { spans: item }"></ng-container>
              </li>
            </ul>
          </ng-container>

          <div class="md__code" *ngSwitchCase="'code'">
            <div class="md__code-bar">
              <span class="md__code-lang">{{ b.lang || 'text' }}</span>
              <button type="button" class="md__code-copy" [title]="copiedCode === b.text ? 'Copied' : 'Copy'" (click)="copyCode(b.text || '')">
                <fvdr-icon [name]="copiedCode === b.text ? 'check' : 'copy'"></fvdr-icon>
              </button>
            </div>
            <pre class="md__pre"><code>{{ b.text }}</code></pre>
          </div>

          <div class="md__table-wrap" *ngSwitchCase="'table'">
            <table class="md__table">
              <thead>
                <tr>
                  <th *ngFor="let cell of b.head">
                    <ng-container *ngTemplateOutlet="inline; context: { spans: cell }"></ng-container>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of b.rows">
                  <td *ngFor="let cell of row">
                    <ng-container *ngTemplateOutlet="inline; context: { spans: cell }"></ng-container>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <blockquote class="md__quote" *ngSwitchCase="'quote'">
            <ng-container *ngTemplateOutlet="inline; context: { spans: b.spans }"></ng-container>
          </blockquote>

          <hr class="md__rule" *ngSwitchCase="'rule'" />

        </ng-container>
      </ng-container>
    </div>

    <!-- Inline spans — bold / italic / code / link, else plain text -->
    <ng-template #inline let-spans="spans">
      <ng-container *ngFor="let s of spans">
        <a *ngIf="s.href; else noLink" class="md__link" [href]="s.href" target="_blank" rel="noopener noreferrer">{{ s.text }}</a>
        <ng-template #noLink>
          <code class="md__inline-code" *ngIf="s.code">{{ s.text }}</code>
          <strong *ngIf="s.bold && !s.code">{{ s.text }}</strong>
          <em *ngIf="s.italic && !s.code && !s.bold">{{ s.text }}</em>
          <span *ngIf="!s.code && !s.bold && !s.italic">{{ s.text }}</span>
        </ng-template>
      </ng-container>
    </ng-template>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .md {
      display: flex; flex-direction: column; gap: var(--space-3);
      font-size: var(--font-size-md, 15px);
      line-height: var(--line-height-relaxed, 24px);
      color: var(--color-text-primary);
    }
    .md > *:first-child { margin-top: 0; }

    .md__h2, .md__h3 {
      margin: var(--space-2) 0 0;
      font-size: var(--font-size-lg, 16px);
      font-weight: var(--font-weight-semi, 600);
      line-height: var(--line-height-normal, 22px);
      color: var(--color-text-primary);
    }
    .md__h3 { font-size: var(--font-size-md, 15px); }

    .md__p { margin: 0; }

    .md__list { margin: 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: var(--space-1); }
    .md__list li { padding-left: var(--space-1); }

    .md__link { color: var(--color-primary-500); text-decoration: none; }
    .md__link:hover { color: var(--color-primary-600); text-decoration: underline; }

    .md__inline-code {
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: var(--font-size-sm, 13px);
      background: var(--color-stone-200);
      border-radius: var(--radius-sm);
      padding: 1px 4px;
    }

    .md__code {
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--color-stone-100);
    }
    .md__code-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-1) var(--space-1) var(--space-1) var(--space-3);
      border-bottom: 1px solid var(--color-divider);
    }
    .md__code-lang {
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .md__code-copy {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm, 13px);
    }
    .md__code-copy:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .md__pre {
      margin: 0; padding: var(--space-3);
      overflow-x: auto;
      font-family: 'Menlo', 'Courier New', monospace;
      font-size: var(--font-size-sm, 13px);
      line-height: var(--line-height-normal, 20px);
      color: var(--color-text-primary);
    }

    /* Wide content scrolls inside its own box — the transcript never scrolls sideways. */
    .md__table-wrap { overflow-x: auto; border: 1px solid var(--color-divider); border-radius: var(--radius-md); }
    .md__table { width: 100%; border-collapse: collapse; font-size: var(--font-size-base, 14px); }
    .md__table th, .md__table td {
      text-align: left;
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--color-divider);
      white-space: nowrap;
    }
    .md__table th { font-weight: var(--font-weight-semi, 600); background: var(--color-stone-100); }
    .md__table tbody tr:last-child td { border-bottom: none; }

    .md__quote {
      margin: 0;
      padding-left: var(--space-3);
      border-left: 2px solid var(--color-divider);
      color: var(--color-text-secondary);
    }

    .md__rule { border: none; border-top: 1px solid var(--color-divider); margin: var(--space-2) 0; }

    /* Streaming caret — sits at the end of the last block. */
    .md--streaming > *:last-child::after {
      content: '';
      display: inline-block;
      width: 2px; height: 1em;
      margin-left: 2px;
      vertical-align: text-bottom;
      background: var(--color-text-primary);
      animation: md-caret 1s steps(1) infinite;
    }
    @keyframes md-caret { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
      .md--streaming > *:last-child::after { animation: none; }
    }
  `],
})
export class AiMarkdownComponent {
  private _source = '';
  blocks: MdBlock[] = [];

  @Input()
  set source(value: string) {
    this._source = value ?? '';
    this.blocks = parseMarkdown(this._source);
  }
  get source(): string { return this._source; }

  /** Shows the caret and keeps partial markup from flashing broken layout. */
  @Input() streaming = false;

  copiedCode: string | null = null;

  copyCode(text: string): void {
    void navigator.clipboard?.writeText(text);
    this.copiedCode = text;
    setTimeout(() => (this.copiedCode = null), 1600);
  }
}
