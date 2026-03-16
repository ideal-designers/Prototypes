import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

/**
 * DS Drag & Drop Area — Figma: liyNDiFf1piO8SQmHNKoeU, node 35319-17829
 *
 * DS specs:
 *   Border: 1.5px dashed #DEE0EB, hover/drag #2C9C74
 *   Bg: #FAFAFA, drag-over: #EBF8EF
 *   Radius: 8px
 *   Icon: upload, 24px
 *   Text: primary 14px, secondary 12px
 *   Accept file types shown
 *
 * Usage:
 *   <fvdr-drop-area (filesDropped)="onFiles($event)" accept=".pdf,.doc" />
 *   <fvdr-drop-area title="Upload logo" subtitle="SVG, PNG up to 2MB" />
 */
@Component({
  selector: 'fvdr-drop-area',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div
      class="drop"
      [class.drop--drag-over]="dragOver"
      [class.drop--disabled]="disabled"
      (click)="!disabled && fileInput.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver = false"
      (drop)="onDrop($event)"
    >
      <fvdr-icon name="upload" class="drop__icon" />
      <span class="drop__title">{{ title }}</span>
      <span class="drop__subtitle">{{ subtitle }}</span>
      <span *ngIf="accept" class="drop__accept">{{ accept }}</span>
      <input
        #fileInput
        type="file"
        class="drop__input"
        [accept]="accept"
        [multiple]="multiple"
        (change)="onFileInput($event)"
      />
    </div>
  `,
  styles: [`
    .drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: var(--space-8) var(--space-6);
      border: 1.5px dashed var(--color-stone-400);
      border-radius: var(--radius-md);
      background: var(--color-stone-100);
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .drop:hover { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .drop--drag-over { border-color: var(--color-primary-500); background: var(--color-primary-50); border-style: solid; }
    .drop--disabled { opacity: 0.45; cursor: not-allowed; }

    .drop__icon { font-size: 24px; color: var(--color-primary-500); margin-bottom: var(--space-1); }
    .drop__title {
      font-family: var(--font-family);
      font-size: var(--text-base-s-size);
      font-weight: var(--text-base-s-sb-weight);
      color: var(--color-text-primary);
    }
    .drop__subtitle {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
    }
    .drop__accept {
      font-family: var(--font-family);
      font-size: var(--text-caption1-size);
      color: var(--color-text-disabled);
    }
    .drop__input { display: none; }
  `],
})
export class DropAreaComponent {
  @Input() title = 'Drag & drop files here';
  @Input() subtitle = 'or click to browse';
  @Input() accept = '';
  @Input() multiple = false;
  @Input() disabled = false;
  @Output() filesDropped = new EventEmitter<File[]>();

  dragOver = false;

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (!this.disabled) this.dragOver = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    if (this.disabled) return;
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) this.filesDropped.emit(files);
  }

  onFileInput(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (files.length) this.filesDropped.emit(files);
  }
}
