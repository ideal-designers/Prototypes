import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FvdrFileType =
  | 'folder'
  | 'folder-colored'
  | 'folder-locked'
  | 'folder-files'
  | 'folder-requests'
  | 'folder-recycle'
  | 'folder-qa'
  | 'doc'
  | 'ppt'
  | 'pdf'
  | 'xls'
  | 'image'
  | 'video'
  | 'dwg'
  | 'zip'
  | 'code'
  | 'txt'
  | 'xml'
  | 'eml'
  | 'svg-file'
  | 'placeholder';

const ICON_MAP: Record<FvdrFileType, string> = {
  'folder':           'assets/file-icons/folder.svg',
  'folder-colored':   'assets/file-icons/folder-colored.svg',
  'folder-locked':    'assets/file-icons/folder-locked.svg',
  'folder-files':     'assets/file-icons/folder-files.svg',
  'folder-requests':  'assets/file-icons/folder-requests.svg',
  'folder-recycle':   'assets/file-icons/folder-recycle.svg',
  'folder-qa':        'assets/file-icons/folder-qa.svg',
  'doc':              'assets/file-icons/doc.svg',
  'ppt':              'assets/file-icons/ppt.svg',
  'pdf':              'assets/file-icons/pdf.svg',
  'xls':              'assets/file-icons/xls.svg',
  'image':            'assets/file-icons/image.svg',
  'video':            'assets/file-icons/video.svg',
  'dwg':              'assets/file-icons/dwg.svg',
  'zip':              'assets/file-icons/zip.svg',
  'code':             'assets/file-icons/code.svg',
  'txt':              'assets/file-icons/txt.svg',
  'xml':              'assets/file-icons/xml.svg',
  'eml':              'assets/file-icons/eml.svg',
  'svg-file':         'assets/file-icons/svg-file.svg',
  'placeholder':      'assets/file-icons/placeholder.svg',
};

/**
 * DS File Icon — Figma: liyNDiFf1piO8SQmHNKoeU, node 1212-8794
 *
 * Renders the correct Figma file/folder icon at 20×20px.
 * Source images live in /assets/file-icons/*.png.
 *
 * Usage:
 *   <fvdr-file-icon type="folder" />
 *   <fvdr-file-icon type="pdf" />
 *   <fvdr-file-icon type="folder-locked" />
 */
@Component({
  selector: 'fvdr-file-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      [src]="src"
      [alt]="type"
      class="file-icon"
      draggable="false"
    />
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .file-icon {
      width: 20px;
      height: 18px;
      object-fit: contain;
      display: block;
    }
  `],
})
export class FileIconComponent {
  @Input() type: FvdrFileType = 'folder';

  get src(): string {
    return ICON_MAP[this.type] ?? ICON_MAP['folder'];
  }
}
