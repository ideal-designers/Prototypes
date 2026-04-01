import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FVDR_ICONS, FvdrIconName } from './icons';

/**
 * FVDR Icon Component
 * Source: Figma "FVDR - Design System" › Icons (node 15846-7469)
 *
 * Usage: <fvdr-icon name="trash" />
 *
 * Color is inherited via CSS `color` property (uses currentColor).
 * Size defaults to 1em — override via CSS width/height on the host.
 */
@Component({
  selector: 'fvdr-icon',
  standalone: true,
  template: `<span class="fvdr-icon" [innerHTML]="svg" aria-hidden="true"></span>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .fvdr-icon { display: inline-flex; }
    :host ::ng-deep svg { width: 1em; height: 1em; display: block; }
  `],
})
export class FvdrIconComponent implements OnChanges {
  @Input({ required: true }) name!: FvdrIconName;

  private sanitizer = inject(DomSanitizer);
  svg: SafeHtml = '';

  ngOnChanges(): void {
    const raw = FVDR_ICONS[this.name];
    this.svg = raw
      ? this.sanitizer.bypassSecurityTrustHtml(raw)
      : this.sanitizer.bypassSecurityTrustHtml('');
  }
}
