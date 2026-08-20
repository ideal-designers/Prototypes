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
/** Per-instance counter used to namespace ids inside icons that carry <defs>. */
let iconSeq = 0;

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
  private readonly uid = `i${++iconSeq}`;
  svg: SafeHtml = '';

  ngOnChanges(): void {
    const raw = FVDR_ICONS[this.name];
    this.svg = this.sanitizer.bypassSecurityTrustHtml(raw ? this.namespaceIds(raw) : '');
  }

  /**
   * Icons carrying <defs> (gradients, masks, clip paths) would otherwise share one
   * global id across every instance. Duplicate ids resolve to the first match in the
   * document, and a paint server inside a `display: none` subtree resolves to nothing
   * — so one hidden instance silently blanks the fill for all the others (this bit the
   * gradient Ideon mark once the responsive sidebar hid its copy). Namespacing the ids
   * per instance keeps each icon self-contained.
   */
  private namespaceIds(svg: string): string {
    if (!svg.includes('id="')) return svg;
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    return ids.reduce(
      (out, id) =>
        out
          .split(`id="${id}"`).join(`id="${id}-${this.uid}"`)
          .split(`url(#${id})`).join(`url(#${id}-${this.uid})`),
      svg,
    );
  }
}
