import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/ds';

/**
 * DsDocBlock — wraps a single DS component's showcase entry.
 * Renders: name + description header · live preview · when-to-use/not · AI prompt.
 */
@Component({
  selector: 'ds-doc-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="doc-block" [id]="id">

      <!-- ── Header ── -->
      <header class="doc-block__header">
        <h3 class="doc-block__name">{{ name }}</h3>
        <p class="doc-block__desc">{{ description }}</p>
        <span *ngIf="figmaNode" class="doc-block__figma">Figma: node {{ figmaNode }}</span>
      </header>

      <!-- ── Live preview ── -->
      <div class="doc-block__preview">
        <ng-content />
      </div>

      <!-- ── Usage: when to / not to ── -->
      <div class="doc-block__usage" *ngIf="whenToUse.length || whenNotToUse.length">
        <div class="doc-block__do" *ngIf="whenToUse.length">
          <p class="usage-label usage-label--do">When to use</p>
          <ul class="usage-list">
            <li *ngFor="let item of whenToUse">{{ item }}</li>
          </ul>
        </div>
        <div class="doc-block__dont" *ngIf="whenNotToUse.length">
          <p class="usage-label usage-label--dont">When not to use</p>
          <ul class="usage-list">
            <li *ngFor="let item of whenNotToUse">{{ item }}</li>
          </ul>
        </div>
      </div>

      <!-- ── AI Prompt ── -->
      <div class="doc-block__prompt-wrap" *ngIf="aiPrompt">
        <div class="doc-block__prompt-hd">
          <span class="doc-block__prompt-label">AI Prompt</span>
          <button class="doc-block__copy" (click)="copy()">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
        <pre class="doc-block__prompt">{{ aiPrompt }}</pre>
      </div>

    </article>
  `,
  styles: [`
    .doc-block {
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 32px;
    }

    /* Header */
    .doc-block__header {
      padding: 20px 24px 0;
    }
    .doc-block__name {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 6px;
    }
    .doc-block__desc {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0 0 8px;
      line-height: 1.5;
    }
    .doc-block__figma {
      display: inline-block;
      font-size: 11px;
      color: var(--color-text-tertiary, var(--color-text-secondary));
      opacity: 0.6;
      margin-bottom: 16px;
      font-family: monospace;
    }

    /* Preview */
    .doc-block__preview {
      padding: 24px;
      border-top: 1px solid var(--color-divider);
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-100, #f8f8f8);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      align-items: flex-start;
    }

    /* Usage */
    .doc-block__usage {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .doc-block__do,
    .doc-block__dont {
      padding: 16px 24px;
    }
    .doc-block__do { border-right: 1px solid var(--color-divider); }
    .usage-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 0 0 8px;
    }
    .usage-label--do  { color: var(--color-success-icon, #2C9C74); }
    .usage-label--dont { color: var(--color-error-600, #E54430); }
    .usage-list {
      margin: 0;
      padding: 0 0 0 16px;
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
    .usage-list li { margin-bottom: 4px; }
    .doc-block__dont .usage-list { border-top: none; }

    /* AI Prompt */
    .doc-block__prompt-wrap {
      border-top: 1px solid var(--color-divider);
    }
    .doc-block__prompt-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px 0;
    }
    .doc-block__prompt-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--color-text-secondary);
    }
    .doc-block__copy {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-primary-500);
      background: none;
      border: 1px solid var(--color-primary-500);
      border-radius: var(--radius-sm);
      padding: 2px 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .doc-block__copy:hover { background: var(--color-primary-50); }
    .doc-block__prompt {
      margin: 8px 0 0;
      padding: 16px 20px;
      background: #1a1d21;
      color: #e5e7eb;
      font-size: 13px;
      font-family: 'Menlo', 'Courier New', monospace;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `],
})
export class DsDocBlockComponent {
  private toastSvc = inject(ToastService);

  @Input() id = '';
  @Input() name = '';
  @Input() description = '';
  @Input() figmaNode = '';
  @Input() whenToUse: string[] = [];
  @Input() whenNotToUse: string[] = [];
  @Input() aiPrompt = '';

  copied = false;

  copy(): void {
    navigator.clipboard.writeText(this.aiPrompt).then(() => {
      this.copied = true;
      this.toastSvc.show({ variant: 'success', title: 'Copied!', message: 'Prompt copied to clipboard.' });
      setTimeout(() => { this.copied = false; }, 2000);
    });
  }
}

/**
 * DsCategory — groups related doc-blocks with a category header.
 */
@Component({
  selector: 'ds-category',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ds-cat" [id]="id">
      <div class="ds-cat__header">
        <h2 class="ds-cat__title">{{ label }}</h2>
        <p class="ds-cat__desc">{{ description }}</p>
      </div>
      <ng-content />
    </section>
  `,
  styles: [`
    .ds-cat { margin-bottom: 48px; }
    .ds-cat__header {
      padding-bottom: 20px;
      border-bottom: 2px solid var(--color-divider);
      margin-bottom: 24px;
    }
    .ds-cat__title {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .ds-cat__desc {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
    }
  `],
})
export class DsCategoryComponent {
  @Input() id = '';
  @Input() label = '';
  @Input() description = '';
}
