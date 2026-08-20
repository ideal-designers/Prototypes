import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';

/**
 * fvdr-ask-ideon — branded entry point for Ideon, the global AI assistant.
 *
 * A fully-rounded glass pill: sparkle glyph + label over a slowly drifting
 * iridescent mesh gradient, frosted by a translucent surface, with an
 * occasional specular sweep so it reads as glass rather than a colour chip.
 *
 * ── Layers (bottom → top) ────────────────────────────────────
 *   ::before   → mesh gradient (4 blurred radial blobs, 32s transform drift)
 *   ::after    → frosted glass tint (backdrop-filter) + top-lit inner edges
 *   .__shine   → specular highlight, sweeps across then rests (9s cycle)
 *   .__content → sparkle icon + label
 *
 * Everything animated is transform/opacity only, so it stays on the compositor.
 * Both motions freeze under `prefers-reduced-motion: reduce`.
 *
 * Palette lives in tokens.css (--gradient-ideon-*, --ideon-*) and is remapped
 * onto :host so a consumer can override it per instance.
 *
 * Usage:
 *   <fvdr-ask-ideon (clicked)="openAssistant()" />
 *   <fvdr-ask-ideon label="Ask Ideon about this file" />
 *   <fvdr-header ...><fvdr-ask-ideon header-actions /></fvdr-header>
 */
@Component({
  selector: 'fvdr-ask-ideon',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ideon"
      [disabled]="disabled"
      [attr.aria-label]="label"
      (click)="clicked.emit()"
    >
      <span class="ideon__shine" aria-hidden="true"></span>
      <span class="ideon__content">
        <span class="ideon__label">{{ label }}</span>
      </span>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;

      /* Palette — single source of truth, overridable per instance */
      --ideon-blob-1: var(--gradient-ideon-1);
      --ideon-blob-2: var(--gradient-ideon-2);
      --ideon-blob-3: var(--gradient-ideon-3);
      --ideon-blob-4: var(--gradient-ideon-4);
    }

    .ideon {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      height: 36px;
      padding: 0 var(--space-4);
      /* Chromatic 1px ring: transparent padding-box over a gradient border-box */
      border: 1px solid transparent;
      background:
        linear-gradient(transparent, transparent) padding-box,
        var(--ideon-edge) border-box;
      border-radius: var(--radius-full);
      box-shadow: var(--ideon-shadow);
      cursor: pointer;
      font-family: var(--font-family);
      transition: box-shadow 0.2s ease, transform 0.12s ease;
    }

    /* ── Mesh gradient — blurred blobs, clipped to the pill ── */
    .ideon::before {
      content: '';
      position: absolute;
      inset: -60%;
      background:
        radial-gradient(circle at 22% 30%, var(--ideon-blob-1) 0%, transparent 55%),
        radial-gradient(circle at 76% 24%, var(--ideon-blob-2) 0%, transparent 55%),
        radial-gradient(circle at 62% 78%, var(--ideon-blob-3) 0%, transparent 55%),
        radial-gradient(circle at 28% 74%, var(--ideon-blob-4) 0%, transparent 55%);
      filter: blur(16px);
      opacity: var(--ideon-mesh-opacity);
      /* transform-only drift → stays on the compositor */
      animation: ideon-drift 32s ease-in-out infinite alternate;
      will-change: transform;
      transition: opacity 0.2s ease;
    }

    /* ── Frosted glass over the mesh, top-lit for convexity ── */
    .ideon::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-full);
      background: var(--ideon-surface);
      backdrop-filter: blur(6px) saturate(160%);
      -webkit-backdrop-filter: blur(6px) saturate(160%);
      box-shadow:
        inset 0 1px 0 var(--ideon-inner-top),
        inset 0 -1px 0 var(--ideon-inner-bottom);
      transition: background 0.2s ease;
    }

    /* ── Specular sweep — travels across the surface, then rests ── */
    .ideon__shine {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -45%;
      width: 26%;
      z-index: 1;
      pointer-events: none;
      background: linear-gradient(
        105deg,
        transparent 0%,
        var(--ideon-shine) 50%,
        transparent 100%
      );
      filter: blur(3px);
      opacity: 0;
      animation: ideon-shine 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      will-change: transform, opacity;
    }

    .ideon__content {
      position: relative;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
    /* Label only — the gradient surface carries the brand, so no glyph is needed. */
    .ideon__label {
      font-size: var(--font-size-base, 14px);
      font-weight: var(--font-weight-semi, 600);
      line-height: 1;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    /* ── States ── */
    .ideon:hover:not(:disabled) {
      box-shadow: var(--ideon-shadow-hover);
      transform: translateY(-1px);
    }
    .ideon:hover:not(:disabled)::before { opacity: var(--ideon-mesh-opacity-hover); }
    .ideon:hover:not(:disabled)::after  { background: var(--ideon-surface-hover); }

    .ideon:active:not(:disabled) { transform: translateY(0) scale(0.98); }

    .ideon:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    .ideon:disabled {
      cursor: not-allowed;
      box-shadow: none;
    }
    .ideon:disabled .ideon__label,
    .ideon:disabled .ideon__icon { color: var(--color-text-disabled); }
    .ideon:disabled::before { animation: none; opacity: 0.2; }
    .ideon:disabled .ideon__shine { animation: none; opacity: 0; }

    @keyframes ideon-drift {
      0%   { transform: translate3d(-6%, -4%, 0) scale(1.10) rotate(0deg); }
      50%  { transform: translate3d(6%, 5%, 0)   scale(1.24) rotate(7deg); }
      100% { transform: translate3d(-4%, 6%, 0)  scale(1.16) rotate(-5deg); }
    }

    /* ~4s travel, ~5s rest — occasional, not a repeating shimmer */
    @keyframes ideon-shine {
      0%   { transform: translate3d(0, 0, 0);     opacity: 0; }
      6%   { opacity: 1; }
      38%  { opacity: 1; }
      45%  { transform: translate3d(520%, 0, 0);  opacity: 0; }
      100% { transform: translate3d(520%, 0, 0);  opacity: 0; }
    }

    /* Both motions frozen for users who ask for reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .ideon::before,
      .ideon__shine { animation: none; }
      .ideon__shine { opacity: 0; }
      .ideon { transition: none; }
    }
  `],
})
export class AskIdeonComponent {
  /** Button label. */
  @Input() label = 'Ask Ideon';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();
}
