import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  ToastService,
  SidebarNavItem,
  BreadcrumbItem,
  HeaderAction,
} from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';

interface ThemePreset {
  name: string;
  hex: string;
}

type AssetKind = 'logo' | 'background';

@Component({
  selector: 'fvdr-branding-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="bp-layout"
  [style.--color-primary-50]="appliedColor50"
  [style.--color-primary-500]="appliedColor"
  [style.--color-primary-600]="appliedColor600"
  [style.--color-primary-700]="appliedColor700">

  <!-- ── DS Sidebar ─────────────────────────────────────────────── -->
  <fvdr-sidebar-nav
    variant="vdr"
    accountName="Project Apollo"
    [items]="navItems"
    [(collapsed)]="sidebarCollapsed"
    (itemClick)="onNavClick($event)"
  ></fvdr-sidebar-nav>

  <!-- ── Main ───────────────────────────────────────────────────── -->
  <div class="bp-main">

    <fvdr-header
      [breadcrumbs]="breadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="DT"
    ></fvdr-header>

    <div class="bp-content">

      <!-- Settings sub-tabs (Branding active; others out of prototype scope) -->
      <div class="settings-tabs" role="tablist">
        <button
          *ngFor="let t of settingsTabs"
          class="stab"
          role="tab"
          [class.stab--active]="t.id === activeTab"
          [attr.aria-selected]="t.id === activeTab"
          (click)="onTabClick(t.id)"
        >{{ t.label }}</button>
      </div>

      <!-- Page heading -->
      <div class="bp-head">
        <div>
          <h1 class="bp-title">Branding</h1>
          <p class="bp-subtitle">
            Customize how your data room looks for invited users — logo, accent
            color and the login page background.
          </p>
        </div>
      </div>

      <!-- Audit-trail note (Issue #3 — Paul / compliance) -->
      <div class="bp-audit-note">
        <fvdr-icon name="history" class="bp-audit-note__icon"></fvdr-icon>
        <span>All branding changes are recorded in the project
          <a href="#" (click)="$event.preventDefault()">activity log</a>.</span>
      </div>

      <!-- ── Two columns: settings form + live preview ── -->
      <div class="bp-cols">
        <div class="bp-form">

      <!-- ── Logo ─────────────────────────────────────────────────── -->
      <section class="bp-card">
        <div class="bp-card__info">
          <h2 class="bp-card__title">Logo</h2>
          <p class="bp-card__desc">Shown on the login page and in the data room header. PNG, JPG or SVG · 1:1 square · recommended 256×256&nbsp;px.</p>
        </div>

        <div class="bp-card__control">
          <!-- Empty state: whole 1:1 tile is clickable (Issue #1) -->
          <button
            *ngIf="!logoUrl"
            type="button"
            class="upload-tile upload-tile--empty upload-tile--square"
            data-track="logo-add"
            (click)="pickFile('logo')"
          >
            <span class="logo-ph" aria-hidden="true">
              <span class="logo-ph__ring"></span>
              <span class="logo-ph__tile">
                <fvdr-icon name="image" class="logo-ph__icon"></fvdr-icon>
              </span>
              <span class="logo-ph__badge"><fvdr-icon name="plus"></fvdr-icon></span>
            </span>
            <span class="upload-tile__label">+ Add logo</span>
          </button>

          <!-- Filled state: preview + hover actions (icon-only, fit inside tile) -->
          <div *ngIf="logoUrl" class="upload-tile upload-tile--filled upload-tile--square">
            <img [src]="logoUrl" class="upload-tile__img" alt="Logo preview" />
            <div class="upload-tile__overlay">
              <button type="button" class="tile-action" title="Replace" aria-label="Replace" data-track="logo-edit" (click)="pickFile('logo')">
                <fvdr-icon name="edit"></fvdr-icon>
              </button>
              <button type="button" class="tile-action tile-action--danger" title="Delete" aria-label="Delete" data-track="logo-delete" (click)="removeAsset('logo')">
                <fvdr-icon name="trash"></fvdr-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Theme color ──────────────────────────────────────────── -->
      <section class="bp-card">
        <div class="bp-card__info">
          <h2 class="bp-card__title">Theme color</h2>
          <p class="bp-card__desc">The accent color used for buttons and links across the room.</p>
        </div>

        <div class="bp-card__control">
          <div class="swatches">
            <button
              *ngFor="let p of themePresets"
              type="button"
              class="swatch"
              [class.swatch--active]="p.hex === themeColor"
              [style.--sw]="p.hex"
              [attr.title]="p.name"
              [attr.aria-label]="p.name"
              [attr.data-track]="'theme-' + p.name.toLowerCase()"
              (click)="selectColor(p)"
            >
              <fvdr-icon *ngIf="p.hex === themeColor" name="check" class="swatch__check"></fvdr-icon>
            </button>
          </div>
        </div>
      </section>

      <!-- ── Login page background ────────────────────────────────── -->
      <section class="bp-card">
        <div class="bp-card__info">
          <h2 class="bp-card__title">Login page background</h2>
          <p class="bp-card__desc">A full-screen image behind the sign-in form. JPG or PNG · up to 10&nbsp;MB · recommended 1920×1080&nbsp;px.</p>
        </div>

        <div class="bp-card__control">
          <button
            *ngIf="!backgroundUrl"
            type="button"
            class="upload-tile upload-tile--empty upload-tile--wide"
            data-track="bg-add"
            (click)="pickFile('background')"
          >
            <span class="logo-ph" aria-hidden="true">
              <span class="logo-ph__ring"></span>
              <span class="logo-ph__tile">
                <fvdr-icon name="image" class="logo-ph__icon"></fvdr-icon>
              </span>
              <span class="logo-ph__badge"><fvdr-icon name="plus"></fvdr-icon></span>
            </span>
            <span class="upload-tile__label">+ Add image</span>
          </button>

          <div *ngIf="backgroundUrl" class="upload-tile upload-tile--filled upload-tile--wide">
            <img [src]="backgroundUrl" class="upload-tile__img upload-tile__img--cover" alt="Background preview" />
            <div class="upload-tile__overlay">
              <button type="button" class="tile-action" title="Replace" aria-label="Replace" data-track="bg-edit" (click)="pickFile('background')">
                <fvdr-icon name="edit"></fvdr-icon>
              </button>
              <button type="button" class="tile-action tile-action--danger" title="Delete" aria-label="Delete" data-track="bg-delete" (click)="removeAsset('background')">
                <fvdr-icon name="trash"></fvdr-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Customize invitations (Premier+ — original product block) ── -->
      <section class="invite-card">
        <div class="invite-card__head">
          <div class="invite-card__title-row">
            <h2 class="invite-card__title">Customize invitations</h2>
            <span class="invite-badge">Upgrade</span>
          </div>
          <fvdr-toggle [checked]="false" [disabled]="true"></fvdr-toggle>
        </div>
        <p class="invite-card__desc">
          Control how the invitation sender appears by using a custom alias instead of the
          administrator's real name. <a href="#" class="invite-link" (click)="$event.preventDefault()">Learn more</a>
        </p>
        <div class="invite-banner">
          <fvdr-plan-icon name="premier" size="s"></fvdr-plan-icon>
          <span>This feature is available only with a <strong>Premier</strong> or higher
            subscription. <a href="#" class="invite-link" (click)="$event.preventDefault()">Learn more</a></span>
        </div>
      </section>

      <!-- ── Save bar (matches other settings tabs — explicit Save) ── -->
      <div class="save-bar" [class.save-bar--visible]="dirty">
        <div class="save-bar__actions">
          <fvdr-btn variant="primary" size="m" label="Save changes" data-track="save" (clicked)="save()"></fvdr-btn>
          <fvdr-btn variant="secondary" size="m" label="Discard" data-track="discard" (clicked)="discard()"></fvdr-btn>
        </div>
        <span class="save-bar__hint">
          <fvdr-icon name="info" class="save-bar__hint-icon"></fvdr-icon>
          You have unsaved changes
        </span>
      </div>

        </div><!-- /.bp-form -->

        <!-- ── Live login preview (second column) ── -->
        <aside class="bp-preview-col">
          <h3 class="preview-panel__title">Login page preview</h3>
          <div class="login-preview" [style.background-image]="backgroundUrl ? 'url(' + backgroundUrl + ')' : null">
            <div class="login-preview__scrim"></div>
            <div class="login-preview__card">
              <div class="login-preview__logo">
                <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" />
                <span *ngIf="!logoUrl" class="login-preview__logo-ph">Your logo</span>
              </div>
              <div class="login-preview__field"><span>Email</span><i></i></div>
              <div class="login-preview__field"><span>Password</span><i></i></div>
              <button class="login-preview__btn" [style.background]="themeColor">Sign in</button>
              <a class="login-preview__link" [style.color]="themeColor">Forgot password?</a>
            </div>
          </div>
          <p class="login-preview__note">Live preview of the invited-user sign-in screen.</p>
        </aside>

      </div><!-- /.bp-cols -->

    </div>
  </div>
</div>

<!-- Hidden file inputs -->
<input #logoInput type="file" accept="image/*" hidden (change)="onFileSelected($event, 'logo')" />
<input #bgInput type="file" accept="image/*" hidden (change)="onFileSelected($event, 'background')" />

<!-- ── Crop modal ──────────────────────────────────────────────────── -->
<fvdr-modal
  [visible]="cropOpen"
  [title]="cropKind === 'logo' ? 'Crop logo' : 'Crop background'"
  size="m"
  confirmLabel="Apply"
  cancelLabel="Cancel"
  (confirmed)="applyCrop()"
  (cancelled)="cropOpen = false"
  (closed)="cropOpen = false"
>
  <div class="crop">
    <div
      class="crop__frame"
      [style.width.px]="cropFrameW"
      [style.height.px]="cropFrameH"
      (pointerdown)="onCropDown($event)"
      (pointermove)="onCropMove($event)"
      (pointerup)="onCropUp()"
      (pointerleave)="onCropUp()"
    >
      <img
        *ngIf="cropSrc"
        [src]="cropSrc"
        class="crop__img"
        alt="Crop source"
        draggable="false"
        [style.width.px]="cropDispW"
        [style.height.px]="cropDispH"
        [style.transform]="cropTransform"
      />
      <div class="crop__grid" aria-hidden="true"></div>
    </div>
    <div class="crop__zoom">
      <fvdr-icon name="image" class="crop__zoom-icon crop__zoom-icon--sm"></fvdr-icon>
      <input type="range" min="1" max="3" step="0.01" [(ngModel)]="cropZoom" (ngModelChange)="clampCropOffset()" aria-label="Zoom" />
      <fvdr-icon name="image" class="crop__zoom-icon"></fvdr-icon>
    </div>
    <p class="crop__hint">Drag the image to reposition · slide to zoom</p>
  </div>
</fvdr-modal>

<!-- Toast host -->
<fvdr-toast-host />
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    /* Sidebar always full viewport height; only the main content scrolls */
    .bp-layout { display: flex; height: 100vh; overflow: hidden; background: var(--color-stone-0); }
    .bp-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: var(--color-stone-0); }
    .bp-content { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 32px 64px; }

    /* Two equal columns (50/50): settings form (left) + live preview (right, sticky) */
    .bp-cols { display: flex; align-items: flex-start; gap: 40px; }
    .bp-form { flex: 1 1 0; min-width: 0; }
    .bp-preview-col { flex: 1 1 0; min-width: 0; position: sticky; top: 0; }
    .preview-panel__title { font-size: var(--font-size-sm, 13px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-secondary); margin: 0 0 10px; }
    @media (max-width: 1080px) {
      .bp-cols { flex-direction: column; gap: 28px; }
      .bp-form, .bp-preview-col { width: 100%; flex: none; }
      .bp-preview-col { position: static; }
    }

    /* ── Settings sub-tabs ── */
    .settings-tabs {
      display: flex; gap: 4px; border-bottom: 1px solid var(--color-divider);
      margin-bottom: 24px;
    }
    .stab {
      appearance: none; background: none; border: none; cursor: pointer;
      font-family: var(--font-family); font-size: var(--font-size-base, 14px);
      color: var(--color-text-secondary); padding: 10px 14px;
      border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: 0;
      transition: color .15s ease;
    }
    .stab:hover { color: var(--color-text-primary); }
    .stab--active {
      color: var(--color-primary-600); font-weight: 600;
      border-bottom-color: var(--color-primary-500);
    }

    /* ── Page head ── */
    .bp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .bp-title { font-size: var(--font-size-3xl, 22px); font-weight: var(--font-weight-bold, 700); color: var(--color-text-primary); margin: 0 0 4px; }
    .bp-subtitle { font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); margin: 0; max-width: 540px; line-height: 1.5; }

    /* ── Audit note (borderless, on white) ── */
    .bp-audit-note {
      display: flex; align-items: center; gap: 7px;
      padding: 0; margin: 0 0 8px;
      font-size: var(--font-size-xs, 12px); color: var(--color-text-placeholder);
    }
    .bp-audit-note__icon { font-size: var(--font-size-base, 14px); color: var(--color-stone-500); }
    .bp-audit-note a { color: var(--color-info-500); }

    /* ── Setting row (borderless, white bg, separated by spacing) ── */
    .bp-card {
      display: grid; grid-template-columns: 260px 1fr; gap: 32px;
      padding: 18px 0 24px;
    }
    .bp-card__title { font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-lg, 24px); color: var(--color-text-primary); margin: 0 0 4px; display: flex; align-items: center; gap: 6px; }
    .bp-card__desc { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
    .bp-card__control { min-width: 0; }
    .bp-card__filehint { font-size: var(--font-size-xs, 12px); color: var(--color-text-placeholder); margin: 10px 0 0; }
    .bp-card__filehint code { background: var(--color-stone-100); padding: 1px 6px; border-radius: var(--radius-sm); color: var(--color-text-secondary); }
    .bp-lock { font-size: var(--font-size-sm, 13px); color: var(--color-stone-500); }

    /* ── Upload tile ── */
    .upload-tile {
      position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; width: 280px; height: 132px; border-radius: var(--radius-md);
      font-family: var(--font-family);
    }
    .upload-tile--wide { width: 100%; max-width: 420px; height: 160px; }
    .upload-tile--square { width: 168px; height: 168px; }
    .upload-tile--empty {
      appearance: none; cursor: pointer;
      border: 1.5px dashed var(--color-stone-400); background: transparent;
      transition: border-color .15s ease, background .15s ease;
      padding: 12px;
    }
    .upload-tile--empty:hover { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .upload-tile__label { font-size: var(--font-size-sm, 13px); font-weight: var(--font-weight-semi, 600); color: var(--color-text-primary); }

    /* ── Decorative empty-state placeholder ── */
    .logo-ph {
      position: relative; width: 60px; height: 60px; margin-bottom: 4px;
      display: grid; place-items: center;
    }
    .logo-ph__ring {
      position: absolute; inset: -6px; border-radius: 50%;
      background: radial-gradient(circle at 30% 25%, var(--color-primary-50), transparent 70%);
      opacity: .9;
    }
    .logo-ph__tile {
      position: relative; width: 52px; height: 52px; border-radius: var(--radius-md);
      display: grid; place-items: center;
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
      box-shadow: var(--shadow-hover);
      transform: rotate(-4deg); transition: transform .18s ease;
    }
    .logo-ph__icon { font-size: var(--font-size-4xl, 24px); color: var(--color-stone-0); }
    .logo-ph__badge {
      position: absolute; right: -2px; bottom: -2px; z-index: 2;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--color-stone-0); color: var(--color-primary-600);
      display: grid; place-items: center; font-size: var(--font-size-xs, 12px);
      border: 2px solid var(--color-stone-0); box-shadow: var(--shadow-card);
    }
    .logo-ph__badge fvdr-icon { font-size: var(--font-size-2xs, 11px); }
    .upload-tile--empty:hover .logo-ph__tile { transform: rotate(0deg) scale(1.05); }

    .upload-tile--filled { border: 1px solid var(--color-divider); background: var(--color-stone-0); overflow: hidden; }
    .upload-tile__img { width: 100%; height: 100%; object-fit: cover; }
    .upload-tile__img--cover { width: 100%; height: 100%; object-fit: cover; }
    .upload-tile__overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--color-overlay-dark); opacity: 0; transition: opacity .15s ease;
    }
    .upload-tile--filled:hover .upload-tile__overlay { opacity: 1; }
    /* Icon-only actions — fit inside the tile, no overflow */
    .tile-action {
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      width: 34px; height: 34px; padding: 0;
      background: var(--color-stone-0); border: none; border-radius: var(--radius-md);
      color: var(--color-text-primary);
    }
    .tile-action:hover { background: var(--color-stone-200); }
    .tile-action--danger { color: var(--color-error-600); }
    .tile-action fvdr-icon { font-size: var(--font-size-md, 15px); }

    /* ── Color swatches ── */
    .swatches { display: flex; flex-wrap: wrap; gap: 10px; }
    .swatch {
      position: relative; width: 32px; height: 32px; border-radius: 50%;
      background: var(--sw); border: 2px solid var(--color-stone-0);
      box-shadow: 0 0 0 1px var(--color-divider); cursor: pointer;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .swatch:hover { transform: scale(1.08); }
    .swatch--active { box-shadow: 0 0 0 2px var(--color-stone-0), 0 0 0 4px var(--sw); }
    .swatch__check { color: var(--color-stone-0); font-size: var(--font-size-base, 14px); position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

    /* ── Customize invitations (Premier+ — borderless, on white) ── */
    .invite-card { padding: 18px 0 24px; }
    .invite-card__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .invite-card__title-row { display: flex; align-items: center; gap: 10px; }
    .invite-card__title { font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-lg, 24px); color: var(--color-text-primary); margin: 0; }
    .invite-badge {
      font-size: var(--font-size-xs, 12px); font-weight: var(--font-weight-semi, 600); line-height: 1;
      color: var(--color-primary-600); background: var(--color-primary-50);
      padding: 4px 9px; border-radius: var(--radius-sm);
    }
    .invite-card__desc {
      font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); line-height: 1.5;
      margin: 10px 0 0; max-width: 620px;
    }
    .invite-link { color: var(--color-info-500); text-decoration: none; }
    .invite-link:hover { text-decoration: underline; }
    .invite-banner {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 0; margin-top: 14px;
      font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); line-height: 1.5;
    }
    .invite-banner strong { color: var(--color-text-primary); }
    .invite-banner fvdr-plan-icon { flex-shrink: 0; }

    /* ── Sticky save bar ── */
    .save-bar {
      position: sticky; bottom: 0; z-index: 5;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: var(--color-stone-0);
      padding: 14px 0; margin-top: 16px;
      box-shadow: var(--shadow-popup);
      opacity: 0; transform: translateY(12px); pointer-events: none;
      transition: opacity .2s ease, transform .2s ease;
    }
    .save-bar--visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .save-bar__hint { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm, 13px); color: var(--color-text-secondary); }
    .save-bar__hint-icon { font-size: var(--font-size-md, 15px); color: var(--color-warning-600); }
    .save-bar__actions { display: flex; gap: 8px; }

    /* ── Login preview ── */
    .login-preview {
      position: relative; border-radius: var(--radius-md); overflow: hidden;
      width: 100%; aspect-ratio: 16 / 11;
      display: flex; align-items: center; justify-content: center;
      background-color: var(--color-stone-300); background-size: cover; background-position: center;
    }
    .login-preview__scrim { position: absolute; inset: 0; background: var(--color-overlay-light); }
    .login-preview__card {
      position: relative; z-index: 1; background: var(--color-stone-0);
      border-radius: var(--radius-md); padding: 32px 30px; width: 340px; max-width: 80%;
      display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-modal);
    }
    .login-preview__logo { height: 40px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .login-preview__logo img { max-height: 40px; max-width: 180px; object-fit: contain; }
    .login-preview__logo-ph { font-size: var(--font-size-xs, 12px); color: var(--color-text-placeholder); border: 1px dashed var(--color-stone-400); padding: 6px 14px; border-radius: var(--radius-sm); }
    .login-preview__field { border: 1px solid var(--color-divider); border-radius: var(--radius-sm); padding: 8px 10px; font-size: var(--font-size-xs, 12px); color: var(--color-text-placeholder); display: flex; flex-direction: column; gap: 5px; }
    .login-preview__field i { display: block; height: 6px; width: 60%; background: var(--color-stone-300); border-radius: var(--radius-sm); }
    .login-preview__btn { border: none; border-radius: var(--radius-sm); padding: 10px; color: var(--color-stone-0); font-weight: var(--font-weight-semi, 600); font-size: var(--font-size-sm, 13px); cursor: default; font-family: var(--font-family); }
    .login-preview__link { font-size: var(--font-size-xs, 12px); text-align: center; text-decoration: none; }
    .login-preview__note { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); margin: 14px 0 0; text-align: center; }

    /* ── Crop modal ── */
    .crop { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .crop__frame {
      position: relative; overflow: hidden; border-radius: var(--radius-md);
      background: var(--color-stone-200); cursor: grab; touch-action: none;
      max-width: 100%;
    }
    .crop__frame:active { cursor: grabbing; }
    .crop__img { position: absolute; left: 50%; top: 50%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
    .crop__grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px);
      background-size: 33.333% 33.333%;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.5);
    }
    .crop__zoom { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 340px; }
    .crop__zoom input[type=range] { flex: 1; accent-color: var(--color-primary-500); cursor: pointer; }
    .crop__zoom-icon { color: var(--color-stone-600); font-size: var(--font-size-2xl, 20px); }
    .crop__zoom-icon--sm { font-size: var(--font-size-sm, 13px); }
    .crop__hint { font-size: var(--font-size-xs, 12px); color: var(--color-text-placeholder); margin: 0; }

    @media (max-width: 760px) {
      .bp-content { padding: 18px 16px 48px; }
      .bp-card { grid-template-columns: 1fr; gap: 14px; }
      .bp-head { flex-direction: column; }
    }
  `],
})
export class BrandingPageComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bgInput') bgInput!: ElementRef<HTMLInputElement>;

  sidebarCollapsed = false;
  activeTab = 'branding';

  // Working (edited) state
  logoUrl: string | null = null;
  backgroundUrl: string | null = null;
  themeColor = '#2C9C74';

  // Crop state
  cropOpen = false;
  cropKind: AssetKind = 'logo';
  cropSrc: string | null = null;
  cropZoom = 1;
  cropOffX = 0;
  cropOffY = 0;
  private cropImage: HTMLImageElement | null = null;
  private cropDragging = false;
  private cropLastX = 0;
  private cropLastY = 0;

  // Last saved snapshot — Save/Discard compare against this (like other settings tabs)
  private saved = { logoUrl: null as string | null, backgroundUrl: null as string | null, themeColor: '#2C9C74' };

  get dirty(): boolean {
    return this.logoUrl !== this.saved.logoUrl
      || this.backgroundUrl !== this.saved.backgroundUrl
      || this.themeColor !== this.saved.themeColor;
  }

  themePresets: ThemePreset[] = [
    { name: 'Emerald', hex: '#2C9C74' },
    { name: 'Teal',    hex: '#0E7C7B' },
    { name: 'Blue',    hex: '#358CEB' },
    { name: 'Indigo',  hex: '#4F46E5' },
    { name: 'Violet',  hex: '#7C3AED' },
    { name: 'Rose',    hex: '#E5484D' },
    { name: 'Amber',   hex: '#D97A16' },
    { name: 'Slate',   hex: '#5F616A' },
    { name: 'Graphite', hex: '#1F2129' },
  ];

  settingsTabs = [
    { id: 'general',   label: 'General' },
    { id: 'documents', label: 'Documents' },
    { id: 'security',  label: 'Security' },
    { id: 'branding',  label: 'Branding' },
    { id: 'notifications', label: 'Notifications' },
  ];

  navItems: SidebarNavItem[] = [
    { id: 'overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Overview',     active: false },
    { id: 'documents',    icon: 'nav-projects',     iconActive: 'nav-projects-active',     label: 'Documents',    active: false },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'qa',           icon: 'nav-qa',           iconActive: 'nav-qa-active',           label: 'Q&A',          active: false },
    { id: 'reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',      label: 'Reports',      active: false },
    { id: 'settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Settings',     active: true  },
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'branding', label: 'Branding' },
  ];

  headerActions: HeaderAction[] = [
    { id: 'help', icon: 'help' },
  ];

  // ── Applied theme accent — reflects the SAVED color (takes effect after Save) ──
  /** Default Emerald maps to the exact DS primary tokens; other colors are computed. */
  private static readonly DEFAULT_HEX = '#2C9C74';
  get appliedColor(): string { return this.saved.themeColor; }
  get appliedColor600(): string {
    return this.isDefaultColor ? '#1C8269' : this.mix(this.saved.themeColor, '#000000', 0.14);
  }
  get appliedColor700(): string {
    return this.isDefaultColor ? '#12695C' : this.mix(this.saved.themeColor, '#000000', 0.28);
  }
  get appliedColor50(): string {
    return this.isDefaultColor ? '#EBF8EF' : this.mix(this.saved.themeColor, '#FFFFFF', 0.90);
  }
  private get isDefaultColor(): boolean {
    return this.saved.themeColor.toUpperCase() === BrandingPageComponent.DEFAULT_HEX;
  }

  private mix(hex: string, toward: string, w: number): string {
    const a = this.hexToRgb(hex), b = this.hexToRgb(toward);
    const ch = (x: number, y: number) => {
      const v = Math.round(x + (y - x) * w).toString(16).padStart(2, '0');
      return v;
    };
    return `#${ch(a.r, b.r)}${ch(a.g, b.g)}${ch(a.b, b.b)}`;
  }
  private hexToRgb(h: string): { r: number; g: number; b: number } {
    const s = h.replace('#', '');
    return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
  }

  ngOnInit(): void {
    this.tracker.trackPageView('branding-page');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  // ── Sidebar / tabs ──────────────────────────────────────────────
  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'settings') return;
    this.toast.show({ variant: 'info', message: `“${item.label}” is outside this prototype.`, duration: 2200 });
  }

  onTabClick(id: string): void {
    if (id === 'branding') return;
    const label = this.settingsTabs.find(t => t.id === id)?.label ?? id;
    this.toast.show({ variant: 'info', message: `Only “Branding” is implemented in this prototype.`, title: label, duration: 2400 });
  }

  // ── File handling ───────────────────────────────────────────────
  pickFile(kind: AssetKind): void {
    const ref = kind === 'logo' ? this.logoInput : this.bgInput;
    ref?.nativeElement.click();
  }

  onFileSelected(event: Event, kind: AssetKind): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Crop launches immediately on upload — not committed until Apply
      this.startCrop(kind, reader.result as string);
      input.value = ''; // allow re-selecting the same file
    };
    reader.readAsDataURL(file);
  }

  // ── Theme color ─────────────────────────────────────────────────
  selectColor(p: ThemePreset): void {
    this.themeColor = p.hex;
  }

  // ── Stage a removal (committed on Save; revertible via Discard — Issue #3) ──
  removeAsset(kind: AssetKind): void {
    if (kind === 'logo') this.logoUrl = null;
    else this.backgroundUrl = null;
  }

  // ── Crop ────────────────────────────────────────────────────────
  /** Output dimensions & frame aspect per asset. Logo = 1:1, background = 16:9. */
  private get cropAspect(): number { return this.cropKind === 'logo' ? 1 : 16 / 9; }
  get cropFrameW(): number { return this.cropKind === 'logo' ? 300 : 360; }
  get cropFrameH(): number { return Math.round(this.cropFrameW / this.cropAspect); }

  private get cropBaseScale(): number {
    if (!this.cropImage) return 1;
    return Math.max(this.cropFrameW / this.cropImage.naturalWidth, this.cropFrameH / this.cropImage.naturalHeight);
  }
  private get cropScale(): number { return this.cropBaseScale * this.cropZoom; }
  get cropDispW(): number { return this.cropImage ? this.cropImage.naturalWidth * this.cropScale : 0; }
  get cropDispH(): number { return this.cropImage ? this.cropImage.naturalHeight * this.cropScale : 0; }
  get cropTransform(): string {
    return `translate(calc(-50% + ${this.cropOffX}px), calc(-50% + ${this.cropOffY}px))`;
  }

  /** Launch the crop dialog for a freshly-picked image (not committed until Apply). */
  startCrop(kind: AssetKind, src: string): void {
    this.cropKind = kind;
    this.cropSrc = src;
    this.cropZoom = 1;
    this.cropOffX = 0;
    this.cropOffY = 0;
    const img = new Image();
    img.onload = () => { this.cropImage = img; this.clampCropOffset(); };
    img.src = src;
    this.cropImage = null;
    this.cropOpen = true;
  }

  clampCropOffset(): void {
    const maxX = Math.max(0, (this.cropDispW - this.cropFrameW) / 2);
    const maxY = Math.max(0, (this.cropDispH - this.cropFrameH) / 2);
    this.cropOffX = Math.min(maxX, Math.max(-maxX, this.cropOffX));
    this.cropOffY = Math.min(maxY, Math.max(-maxY, this.cropOffY));
  }

  onCropDown(e: PointerEvent): void {
    this.cropDragging = true;
    this.cropLastX = e.clientX;
    this.cropLastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  onCropMove(e: PointerEvent): void {
    if (!this.cropDragging) return;
    this.cropOffX += e.clientX - this.cropLastX;
    this.cropOffY += e.clientY - this.cropLastY;
    this.cropLastX = e.clientX;
    this.cropLastY = e.clientY;
    this.clampCropOffset();
  }
  onCropUp(): void { this.cropDragging = false; }

  applyCrop(): void {
    if (!this.cropImage) { this.cropOpen = false; return; }
    const outW = this.cropKind === 'logo' ? 256 : 1280;
    const outH = Math.round(outW / this.cropAspect);
    const scale = this.cropScale;
    const sx = (this.cropDispW / 2 - this.cropFrameW / 2 - this.cropOffX) / scale;
    const sy = (this.cropDispH / 2 - this.cropFrameH / 2 - this.cropOffY) / scale;
    const sw = this.cropFrameW / scale;
    const sh = this.cropFrameH / scale;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.cropOpen = false; return; }
    ctx.drawImage(this.cropImage, sx, sy, sw, sh, 0, 0, outW, outH);
    const url = canvas.toDataURL('image/png');

    if (this.cropKind === 'logo') this.logoUrl = url;
    else this.backgroundUrl = url;
    this.cropOpen = false;
  }

  // ── Explicit Save / Discard (matches other settings tabs — Issue #2) ──
  save(): void {
    if (!this.dirty) return;
    this.saved = { logoUrl: this.logoUrl, backgroundUrl: this.backgroundUrl, themeColor: this.themeColor };
    this.toast.show({ variant: 'success', title: 'Changes saved', message: 'Your branding has been updated.', duration: 2600 });
    this.tracker.trackTask('branding-page', 'task_complete', 'save');
  }

  discard(): void {
    if (!this.dirty) return;
    this.logoUrl = this.saved.logoUrl;
    this.backgroundUrl = this.saved.backgroundUrl;
    this.themeColor = this.saved.themeColor;
    this.toast.show({ variant: 'info', message: 'Changes discarded.', duration: 2000 });
  }
}
