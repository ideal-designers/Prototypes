import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * DS Avatar — Figma: User/Avatar (used in headers, cards, participants)
 *
 * DS specs (from Header organisms analysis):
 *   sm → 24px
 *   md → 32px  (header default)
 *   lg → 40px
 *   xl → 48px
 *   bg: primary green #2C9C74 (default), or any custom color
 *   text: 2-letter initials, white, font-weight 700
 *   radius: 50% (circle)
 *
 * Usage:
 *   <fvdr-avatar initials="PA" />
 *   <fvdr-avatar initials="TN" size="lg" color="#4862D3" />
 *   <fvdr-avatar [imgSrc]="user.avatarUrl" size="md" />
 */
@Component({
  selector: 'fvdr-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar avatar--{{ size }}"
      [style.background]="imgSrc ? 'transparent' : (color || 'var(--color-primary-500)')"
      [title]="title || initials"
    >
      <img *ngIf="imgSrc" [src]="imgSrc" [alt]="initials || title" class="avatar__img" />
      <span *ngIf="!imgSrc" class="avatar__initials" [style.color]="textColor || null">{{ initials | slice:0:2 }}</span>
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      user-select: none;
    }

    /* DS: sizes */
    .avatar--sm { width: var(--avatar-sm); height: var(--avatar-sm); }
    .avatar--md { width: var(--avatar-md); height: var(--avatar-md); }
    .avatar--lg { width: var(--avatar-lg); height: var(--avatar-lg); }
    .avatar--xl { width: var(--avatar-xl); height: var(--avatar-xl); }

    .avatar__img { width: 100%; height: 100%; object-fit: cover; }

    .avatar__initials {
      color: var(--color-text-inverse);
      font-family: var(--font-family);
      font-weight: 700;
      line-height: 1;
      text-transform: uppercase;
    }
    .avatar--sm .avatar__initials { font-size: 9px; }
    .avatar--md .avatar__initials { font-size: 11px; }
    .avatar--lg .avatar__initials { font-size: 16px; font-weight: 400; line-height: 24px; }
    .avatar--xl .avatar__initials { font-size: 15px; }
  `],
})
export class AvatarComponent {
  @Input() initials = '';
  @Input() size: AvatarSize = 'md';
  @Input() color?: string;
  @Input() textColor?: string;
  @Input() imgSrc?: string;
  @Input() title?: string;
}
