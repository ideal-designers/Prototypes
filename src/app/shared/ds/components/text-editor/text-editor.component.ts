import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { environment } from '../../../../../environments/environment';
import { TINYMCE_ICONS } from './editor-icons';

/**
 * DS Text editor — Figma: liyNDiFf1piO8SQmHNKoeU, node 15339-6092
 *
 * Powered by TinyMCE Cloud. API key is set via TINYMCE_API_KEY env var.
 * Falls back to 'no-api-key' (shows a notification banner — fine for dev/staging).
 *
 * Usage:
 *   <fvdr-text-editor label="Description" [(ngModel)]="html" />
 *   <fvdr-text-editor label="Notes" [(ngModel)]="body" [height]="300" [disabled]="true" />
 */
@Component({
  selector: 'fvdr-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextEditorComponent), multi: true },
  ],
  template: `
    <div class="editor-wrap" [class.editor-wrap--disabled]="disabled">
      <label *ngIf="label" class="editor-label">{{ label }}</label>
      <editor
        [apiKey]="apiKey"
        [(ngModel)]="value"
        [disabled]="disabled"
        [init]="editorInit"
        (ngModelChange)="onValueChange($event)"
        (onBlur)="onTouched()"
      ></editor>
      <span *ngIf="helperText" class="editor-helper">{{ helperText }}</span>
    </div>
  `,
  styles: [`
    .editor-wrap {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .editor-wrap--disabled { opacity: 0.45; pointer-events: none; }

    .editor-label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size, 12px);
      font-weight: var(--text-caption2-weight, 500);
      color: var(--color-text-secondary);
    }

    .editor-helper {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size, 12px);
      color: var(--color-text-secondary);
    }

    /* TinyMCE container border — matches fvdr-input */
    :host ::ng-deep .tox-tinymce {
      border: 1.5px solid var(--color-stone-400) !important;
      border-radius: var(--radius-sm, 4px) !important;
      font-family: var(--font-family) !important;
    }
    :host ::ng-deep .tox-tinymce:focus-within {
      border-color: var(--color-primary-500) !important;
    }
    /* Remove inner box-shadow TinyMCE adds */
    :host ::ng-deep .tox-tinymce .tox-edit-area__iframe { border: none !important; }
    /* Toolbar bg */
    :host ::ng-deep .tox .tox-toolbar,
    :host ::ng-deep .tox .tox-toolbar__overflow,
    :host ::ng-deep .tox .tox-toolbar-overlord { background: var(--color-stone-0, #fff) !important; }
    :host ::ng-deep .tox .tox-toolbar__primary { border-bottom: 1px solid var(--color-divider, #DEE0EB) !important; background: var(--color-stone-0, #fff) !important; }
    /* Statusbar */
    :host ::ng-deep .tox .tox-statusbar { border-top: 1px solid var(--color-divider, #DEE0EB) !important; background: var(--color-stone-0, #fff) !important; }
  `],
})
export class TextEditorComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'Enter text…';
  @Input() disabled = false;
  @Input() helperText = '';
  @Input() height = 240;
  /** Toolbar preset: 'basic' (default) | 'full' */
  @Input() toolbar: 'basic' | 'full' = 'basic';

  apiKey = (environment as any).tinymceApiKey || 'no-api-key';
  value = '';
  editorInit: Record<string, unknown> = {};

  ngOnInit(): void {
    this.editorInit = this.buildInit();
  }

  private buildInit(): Record<string, unknown> {
    const toolbarBasic =
      'bold italic underline | bullist numlist | link | removeformat';
    const toolbarFull =
      'bold italic underline strikethrough | fontsize | forecolor backcolor | ' +
      'alignleft aligncenter alignright | bullist numlist | outdent indent | ' +
      'link image | blockquote hr | undo redo | removeformat';

    return {
      height: this.height,
      min_height: 120,
      menubar: false,
      statusbar: false,
      branding: false,
      resize: false,
      placeholder: this.placeholder,
      plugins: this.toolbar === 'full'
        ? 'lists link image table wordcount'
        : 'lists link',
      toolbar: this.toolbar === 'full' ? toolbarFull : toolbarBasic,
      toolbar_location: 'top',
      content_style: `
        body {
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          color: #1F2129;
          line-height: 1.5;
          margin: 12px;
        }
        p { margin: 0 0 8px; }
      `,
      // Keep URLs relative, don't convert
      convert_urls: false,
      // Paste as plain text to avoid junk styles
      paste_as_text: false,
      paste_block_drop: false,
      // Register custom Figma icons
      setup: (editor: any) => {
        Object.entries(TINYMCE_ICONS).forEach(([name, svgContent]) => {
          editor.ui.registry.addIcon(name, svgContent);
        });
      },
    };
  }

  onValueChange(html: string): void {
    this.onChange(html);
  }

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
