import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** `hero` — the glowing sphere with sparkles on the chat empty state (Figma 622:72586).
 *  `inline` — the small gradient ball next to "Thinking…", live steps and suggestions (627:80203). */
export type AiOrbVariant = 'hero' | 'inline';

/**
 * AI Orb — the assistant's mark, taken from the designer's renders in Figma AI-Assistant
 * (Vhy3jLaJ9nasbzTtqbu3qB, "AI Assistant - Chat V2" 622:9873).
 *
 *   <fvdr-ai-orb variant="hero"></fvdr-ai-orb>
 *   <fvdr-ai-orb [thinking]="true" label="Thinking..."></fvdr-ai-orb>
 *
 * `thinking` spins the angular-gradient ring around the inline ball. The hero glow is
 * part of the image and spills outside the 120px box on purpose (pointer-events off).
 */
@Component({
  selector: 'fvdr-ai-orb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="orb" [class.orb--hero]="variant === 'hero'" [class.orb--thinking]="thinking && variant === 'inline'"
          [style.--orb-size.px]="variant === 'inline' ? size : null"
          [attr.role]="label ? 'status' : null" [attr.aria-label]="label || null" [attr.aria-hidden]="label ? null : 'true'">
      <img *ngIf="variant === 'hero'" class="orb__hero" src="assets/ai/orb-hero.png" alt="" draggable="false" />
      <ng-container *ngIf="variant === 'inline'">
        <span class="orb__ring" *ngIf="thinking"></span>
        <img class="orb__ball" src="assets/ai/orb-ball.png" alt="" draggable="false" />
      </ng-container>
    </span>
    <span class="orb__label" *ngIf="label && showLabel" aria-hidden="true">{{ label }}</span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: var(--space-2); vertical-align: middle; font-family: var(--font-family); }

    .orb { position: relative; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
      width: var(--orb-size, 20px); height: var(--orb-size, 20px); }

    /* Hero — 120px box, the render's glow reaches ~236px */
    .orb--hero { width: 120px; height: 120px; isolation: isolate; }
    .orb__hero { position: absolute; left: 50%; top: 50%; width: 236px; height: 236px; transform: translate(-50%, -50%);
      z-index: -1; pointer-events: none; user-select: none; animation: orb-float 6s ease-in-out infinite; }

    /* Inline — the render carries a soft halo, so the image is 1.4× the ball; while thinking the
       box grows to that size and a 2px angular ring wraps it (28px ring around a 20px ball) */
    .orb__ball { flex: 0 0 auto; width: calc(var(--orb-size, 20px) * 1.4); height: calc(var(--orb-size, 20px) * 1.4);
      pointer-events: none; user-select: none; }
    .orb--thinking { width: calc(var(--orb-size, 20px) * 1.4); height: calc(var(--orb-size, 20px) * 1.4); }
    .orb--thinking .orb__ball { animation: orb-breathe 1.6s ease-in-out infinite; }
    .orb__ring { position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--ai-ring-start), var(--ai-ring-mid), var(--ai-ring-end), var(--ai-ring-start));
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
              mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
      animation: orb-spin 1.1s linear infinite; }

    .orb__label { font-size: var(--font-size-base, 14px); line-height: 20px; color: var(--color-text-secondary); white-space: nowrap; }

    @keyframes orb-spin { to { transform: rotate(360deg); } }
    @keyframes orb-breathe { 0%, 100% { transform: scale(0.92); } 50% { transform: scale(1); } }
    @keyframes orb-float { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -52%) scale(1.02); } }
    @media (prefers-reduced-motion: reduce) {
      .orb__hero, .orb__ball, .orb__ring { animation: none; }
    }
  `],
})
export class AiOrbComponent {
  @Input() variant: AiOrbVariant = 'inline';
  /** Inline ball diameter in px (the ring adds 40%). */
  @Input() size = 20;
  @Input() thinking = false;
  /** Accessible name; shown next to the orb unless `showLabel` is false. */
  @Input() label = '';
  @Input() showLabel = true;
}
