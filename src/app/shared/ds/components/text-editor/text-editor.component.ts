import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FvdrIconComponent } from '../../icons/icon.component';

interface EditorAction {
  cmd: string;
  arg?: string;
  icon: string;
  title: string;
  group?: string;
}

/**
 * DS Text editor — Figma: liyNDiFf1piO8SQmHNKoeU, node 15339-6092
 *
 * DS specs:
 *   Toolbar: 40px height, border-bottom
 *   Actions: Bold, Italic, Underline | Ordered list, Unordered list | Link
 *   Content area: contenteditable, min-height 120px
 *   Same border style as Input
 *   Radius: 4px
 *
 * Usage:
 *   <fvdr-text-editor label="Description" [(ngModel)]="html" />
 */
@Component({
  selector: 'fvdr-text-editor',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextEditorComponent), multi: true },
  ],
  template: `
    <div class="editor" [class.editor--focused]="focused" [class.editor--disabled]="disabled">
      <label *ngIf="label" class="editor__label">{{ label }}</label>
      <div class="editor__wrapper">
        <!-- Toolbar -->
        <div class="editor__toolbar">
          <ng-container *ngFor="let action of actions; let i = index">
            <div *ngIf="action.group && isFirstInGroup(i)" class="editor__sep"></div>
            <button
              class="editor__tool"
              type="button"
              [title]="action.title"
              [class.editor__tool--active]="isActive(action.cmd)"
              (mousedown)="$event.preventDefault(); exec(action)"
            >
              <fvdr-icon [name]="action.icon" />
            </button>
          </ng-container>
        </div>
        <!-- Editable area -->
        <div
          #content
          class="editor__content"
          contenteditable="true"
          [attr.contenteditable]="!disabled"
          [attr.data-placeholder]="placeholder"
          (input)="onInput()"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
        ></div>
      </div>
      <span *ngIf="helperText" class="editor__helper">{{ helperText }}</span>
    </div>
  `,
  styles: [`
    .editor { display: flex; flex-direction: column; gap: var(--space-1); }

    .editor__label {
      font-family: var(--font-family);
      font-size: var(--text-caption2-size);
      font-weight: var(--text-caption2-weight);
      color: var(--color-text-secondary);
    }

    .editor__wrapper {
      border: 1.5px solid var(--color-stone-400);
      border-radius: var(--radius-sm);
      background: var(--color-stone-200);
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .editor--focused .editor__wrapper { border-color: var(--color-primary-500); background: var(--color-stone-0); }
    .editor--disabled .editor__wrapper { opacity: 0.45; }

    .editor__toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0 var(--space-2);
      height: 40px;
      border-bottom: 1px solid var(--color-divider);
      background: var(--color-stone-0);
    }

    .editor__tool {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: 14px;
      transition: background 0.1s, color 0.1s;
    }
    .editor__tool:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .editor__tool--active { background: var(--color-primary-50); color: var(--color-primary-500); }

    .editor__sep {
      width: 1px;
      height: 20px;
      background: var(--color-divider);
      margin: 0 var(--space-1);
      flex-shrink: 0;
    }

    .editor__content {
      min-height: 120px;
      padding: var(--space-3);
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      line-height: var(--text-base-s-lh);
      color: var(--color-text-primary);
      outline: none;
      background: var(--color-stone-0);
    }
    .editor__content:empty::before {
      content: attr(data-placeholder);
      color: var(--color-text-placeholder);
      pointer-events: none;
    }

    .editor__helper {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
    }
  `],
})
export class TextEditorComponent implements ControlValueAccessor {
  @ViewChild('content') contentEl!: ElementRef<HTMLDivElement>;
  @Input() label = '';
  @Input() placeholder = 'Enter text...';
  @Input() disabled = false;
  @Input() helperText = '';

  focused = false;

  actions: EditorAction[] = [
    { cmd: 'bold',        icon: 'edit',       title: 'Bold' },
    { cmd: 'italic',      icon: 'edit',       title: 'Italic' },
    { cmd: 'underline',   icon: 'edit',       title: 'Underline' },
    { cmd: 'insertOrderedList',   icon: 'sort',  title: 'Ordered list',   group: 'list' },
    { cmd: 'insertUnorderedList', icon: 'filter',title: 'Unordered list', group: 'list' },
    { cmd: 'createLink',  icon: 'link',       title: 'Insert link',    group: 'link' },
  ];

  isFirstInGroup(i: number): boolean {
    return !!this.actions[i].group && (!this.actions[i-1] || this.actions[i-1].group !== this.actions[i].group);
  }

  isActive(cmd: string): boolean {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }

  exec(action: EditorAction): void {
    if (action.cmd === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand(action.cmd, false, url);
    } else {
      document.execCommand(action.cmd, false);
    }
  }

  onInput(): void {
    const html = this.contentEl?.nativeElement.innerHTML ?? '';
    this.onChange(html);
  }

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string): void {
    if (this.contentEl) this.contentEl.nativeElement.innerHTML = v ?? '';
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }
}
