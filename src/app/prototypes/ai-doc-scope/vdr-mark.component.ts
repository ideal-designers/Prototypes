import { Component } from '@angular/core';

/** The VDR rings mark shown in the empty-state greeting (Figma "First title", 32 × 32). */
@Component({
  selector: 'fvdr-ai-doc-mark',
  standalone: true,
  template: `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" />
      <ellipse cx="12" cy="16" rx="11" ry="13" />
      <ellipse cx="8" cy="16" rx="7" ry="11" />
      <ellipse cx="4" cy="16" rx="3" ry="7" />
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; width: 32px; height: 32px; flex: 0 0 32px; }
    svg * { stroke: var(--color-primary-500); stroke-width: 2; }
  `],
})
export class VdrMarkComponent {}
