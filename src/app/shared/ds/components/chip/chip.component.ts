import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../icons/icon.component';
import { FvdrIconName } from '../../icons/icons';

export type ChipVariant =
  | 'default' | 'green' | 'yellow' | 'orange' | 'lime' | 'teal'
  | 'danger' | 'blue' | 'indigo' | 'purple' | 'magenta' | 'grey' | 'coffee' | 'theme'
  | 'primary' | 'success' | 'warning' | 'error'; // backward-compat aliases

export type ChipSize = 'xs' | 's' | 'm' | 'l' | 'xl'; // 20 / 24 / 28 / 32 / 36 px

/**
 * DS Chips — Figma: liyNDiFf1piO8SQmHNKoeU, node 15032-13859
 *
 * Usage:
 *   <fvdr-chip label="Tag" />
 *   <fvdr-chip label="Green" variant="green" size="l" [rounded]="true" />
 *   <fvdr-chip label="Removable" [removable]="true" (removed)="onRemove()" />
 *   <fvdr-chip label="Count" variant="blue" [counter]="12" />
 */
@Component({
  selector: 'fvdr-chip',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <span
      class="chip"
      [ngClass]="chipClasses"
      (click)="onClick()"
    >
      <!-- Avatar (fills full height, flush left — no left padding when present) -->
      <span *ngIf="avatarSrc || avatarInitials" class="chip__avatar">
        <img *ngIf="avatarSrc" [src]="avatarSrc" [alt]="label" class="chip__avatar-img" />
        <span *ngIf="!avatarSrc && avatarInitials" class="chip__avatar-initials">{{ avatarInitials }}</span>
      </span>
      <fvdr-icon *ngIf="icon && !avatarSrc && !avatarInitials" [name]="icon" class="chip__icon" />
      <span *ngIf="statusColor && !avatarSrc && !avatarInitials" class="chip__dot" [style.background]="statusColor"></span>
      <span class="chip__label">{{ label }}</span>
      <span *ngIf="counter != null" class="chip__counter">{{ counter }}</span>
      <button *ngIf="removable" class="chip__remove" type="button" (click)="onRemove($event)">
        <fvdr-icon name="close" />
      </button>
    </span>
  `,
  styles: [`
    /* NOTE: uses only tokens from src/app/shared/ds/tokens.css (the Angular build file).
       --space-*, --radius-*, --text-base-*-size, --color-* are all defined there.
       --primitive-* tokens are in src/tokens.css which is NOT in angular.json styles[]. */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--color-text-primary);
      white-space: nowrap;
      user-select: none;
      transition: filter var(--duration-base, 150ms) var(--ease, ease);
    }

    /* ── Sizes — exact Figma specs (node 4069-19936) ── */
    /* xs=20px: gap 4px, icon 14px, font 12px/16px, pad 0 6px */
    .chip--xs { height: 20px; min-width: 20px; padding: 0 6px;                gap: 4px; font-size: var(--font-size-xs, 12px); line-height: 16px; }
    /* s=24px:  gap 4px, icon 14px, font 12px/16px, pad 0 8px */
    .chip--s  { height: 24px; min-width: 24px; padding: 0 var(--space-2, 8px); gap: 4px; font-size: var(--font-size-xs, 12px); line-height: 16px; }
    /* m=28px:  gap 8px, icon 16px, font 14px/20px, pad 0 8px */
    .chip--m  { height: 28px; min-width: 28px; padding: 0 var(--space-2, 8px); gap: var(--space-2, 8px); font-size: var(--text-base-s-size, 14px); line-height: 20px; }
    /* l=32px:  gap 8px, icon 16px, font 15px/24px, pad 0 12px */
    .chip--l  { height: 32px; min-width: 32px; padding: 0 var(--space-3, 12px); gap: var(--space-2, 8px); font-size: var(--text-base-m-size, 15px); line-height: 24px; }
    /* xl=36px: gap 8px, icon 16px, font 15px/24px, pad 0 12px */
    .chip--xl { height: 36px; min-width: 36px; padding: 0 var(--space-3, 12px); gap: var(--space-2, 8px); font-size: var(--text-base-m-size, 15px); line-height: 24px; }

    /* ── Shape: rect=4px, pill=100% ── */
    .chip--rect    { border-radius: var(--radius-sm, 4px); }
    .chip--rounded { border-radius: var(--radius-full, 9999px); }

    /* ── Color variants — background only ── */
    .chip--default { background: var(--chip-bg-default, #eceef9); }
    .chip--green   { background: var(--chip-bg-green,   #eaf6ed); }
    .chip--yellow  { background: var(--chip-bg-yellow,  #fff5e0); }
    .chip--orange  { background: var(--chip-bg-orange,  #ffede1); }
    .chip--lime    { background: var(--chip-bg-lime,    #eef6e3); }
    .chip--teal    { background: var(--chip-bg-teal,    #e8fafa); }
    .chip--danger  { background: var(--chip-bg-danger,  #fff0ee); }
    .chip--blue    { background: var(--chip-bg-blue,    #eaf2fa); }
    .chip--indigo  { background: var(--chip-bg-indigo,  #f0f0ff); }
    .chip--purple  { background: var(--chip-bg-purple,  #f9f1ff); }
    .chip--magenta { background: var(--chip-bg-magenta, #feeff9); }
    .chip--grey    { background: var(--chip-bg-grey,    #f7f7f7); }
    .chip--coffee  { background: var(--chip-bg-coffee,  #f0edea); }
    .chip--theme   { background: var(--chip-bg-green,   #eaf6ed); }

    /* ── Icon accent color per variant (icon only — close is always black) ── */
    .chip--default .chip__icon { color: var(--chip-icon-default, #6b74c8); }
    .chip--green   .chip__icon { color: var(--chip-icon-green,   #2c9c74); }
    .chip--yellow  .chip__icon { color: var(--chip-icon-yellow,  #d4900a); }
    .chip--orange  .chip__icon { color: var(--chip-icon-orange,  #e07332); }
    .chip--lime    .chip__icon { color: var(--chip-icon-lime,    #5fa832); }
    .chip--teal    .chip__icon { color: var(--chip-icon-teal,    #0ea5b5); }
    .chip--danger  .chip__icon { color: var(--chip-icon-danger,  #e54430); }
    .chip--blue    .chip__icon { color: var(--chip-icon-blue,    #358ceb); }
    .chip--indigo  .chip__icon { color: var(--chip-icon-indigo,  #4862d3); }
    .chip--purple  .chip__icon { color: var(--chip-icon-purple,  #8b5cf6); }
    .chip--magenta .chip__icon { color: var(--chip-icon-magenta, #c026d3); }
    .chip--grey    .chip__icon { color: var(--chip-icon-grey,    #9c9ea8); }
    .chip--coffee  .chip__icon { color: var(--chip-icon-coffee,  #8c7355); }
    .chip--theme   .chip__icon { color: var(--chip-icon-green,   #2c9c74); }

    /* ── Clickable ── */
    .chip--clickable { cursor: pointer; }
    .chip--clickable:hover { filter: brightness(0.96); }

    /* ── Selected ── */
    .chip--selected {
      background: var(--chip-bg-green, #eaf6ed);
      outline: 1.5px solid var(--color-interactive-primary, #2c9c74);
      outline-offset: -1.5px;
    }

    /* ── Elements ── */
    .chip__icon    { font-size: var(--font-size-lg, 16px); flex-shrink: 0; }
    .chip__label   { flex-shrink: 0; }
    .chip__counter { opacity: 0.65; flex-shrink: 0; }

    /* xs/s: smaller icons to match Figma size-[14px] */
    .chip--xs .chip__icon, .chip--s .chip__icon { font-size: var(--font-size-base, 14px); }

    .chip__dot {
      width: 8px; height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Avatar ── */
    /* When avatar is present: remove left padding, avatar circle fills full height */
    .chip--with-avatar { padding-left: 0; }

    .chip__avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-divider, #dee0eb);
    }

    /* Avatar size = chip height */
    .chip--xs .chip__avatar { width: 20px; height: 20px; }
    .chip--s  .chip__avatar { width: 24px; height: 24px; }
    .chip--m  .chip__avatar { width: 28px; height: 28px; }
    .chip--l  .chip__avatar { width: 32px; height: 32px; }
    .chip--xl .chip__avatar { width: 36px; height: 36px; }

    /* Avatar bg per variant */
    .chip--danger  .chip__avatar { background: var(--color-chip-avatar-danger, #ffe1de); }
    .chip--yellow  .chip__avatar { background: var(--color-chip-avatar-yellow, #ffe5b0); }

    .chip__avatar-img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }

    .chip__avatar-initials {
      font-family: var(--font-family);
      font-weight: 400;
      color: var(--color-text-primary);
      line-height: 1;
    }

    /* Initials font-size per chip size */
    .chip--xs .chip__avatar-initials,
    .chip--s  .chip__avatar-initials { font-size: var(--font-size-3xs, 10px); }
    .chip--m  .chip__avatar-initials { font-size: var(--font-size-xs, 12px); }
    .chip--l  .chip__avatar-initials,
    .chip--xl .chip__avatar-initials { font-size: var(--font-size-base, 14px); }

    /* Close button: icon-main color (#5F616A = --color-text-secondary), regardless of variant */
    .chip__remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px; height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: var(--color-text-secondary, #5F616A);
      opacity: 1;
      font-size: var(--font-size-xs, 12px);
      flex-shrink: 0;
    }
    .chip--xs .chip__remove, .chip--s .chip__remove { width: 14px; height: 14px; font-size: var(--font-size-3xs, 10px); }
    .chip__remove:hover { opacity: 0.65; }
  `],
})
export class ChipComponent {
  @Input() label = '';
  @Input() variant: ChipVariant = 'default';
  @Input() size: ChipSize = 'm';
  @Input() rounded = false;
  @Input() selected = false;
  @Input() removable = false;
  @Input() clickable = false;
  @Input() icon?: FvdrIconName;
  @Input() counter?: number | null = null;
  @Input() statusColor?: string;
  @Input() avatarInitials?: string;
  @Input() avatarSrc?: string;
  @Output() clicked = new EventEmitter<void>();
  @Output() removed = new EventEmitter<void>();

  get effectiveVariant(): string {
    const aliases: Partial<Record<ChipVariant, string>> = {
      primary: 'green', success: 'green', warning: 'yellow', error: 'danger',
    };
    return aliases[this.variant] ?? this.variant;
  }

  get hasAvatar(): boolean { return !!(this.avatarInitials || this.avatarSrc); }

  get chipClasses(): string[] {
    return [
      `chip--${this.effectiveVariant}`,
      `chip--${this.size}`,
      this.rounded ? 'chip--rounded' : 'chip--rect',
      this.selected ? 'chip--selected' : '',
      this.clickable || this.clicked.observed ? 'chip--clickable' : '',
      this.hasAvatar ? 'chip--with-avatar' : '',
    ].filter(Boolean);
  }

  onClick(): void { this.clicked.emit(); }
  onRemove(e: Event): void { e.stopPropagation(); this.removed.emit(); }
}
