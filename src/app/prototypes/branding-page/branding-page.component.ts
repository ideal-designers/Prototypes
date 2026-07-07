import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DS_COMPONENTS,
  ToastService,
  SidebarNavItem,
  BreadcrumbItem,
  HeaderAction,
  TabsComponent,
  TabItem,
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
      <fvdr-tabs
        class="settings-tabs"
        [tabs]="settingsTabs"
        [activeId]="activeTab"
        (tabChange)="onTabClick($event)"
      ></fvdr-tabs>

      <!-- ── Two columns: settings form + live preview ── -->
      <div class="bp-cols">
        <div class="bp-form">

      <!-- ── Logo ─────────────────────────────────────────────────── -->
      <section class="bp-card">
        <div class="bp-card__info">
          <h2 class="bp-card__title">Logo</h2>
          <p class="bp-card__desc">Shown on the login page and in the data room header.<br>PNG, JPG or SVG · 1:1 square · recommended 256×256&nbsp;px.</p>
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
            <span class="add-anim" aria-hidden="true">
              <span class="add-anim__back"></span>
              <span class="add-anim__front">
                <svg viewBox="0 0 46.5455 34.9091" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="46.5455" height="34.9091" rx="5.81818" fill="var(--color-primary-100, #AAE2BA)"/>
                  <path d="M14.871 14.865C15.4169 14.0072 16.6519 13.9598 17.2619 14.7731L23.7211 23.3855C24.2522 24.0936 25.2874 24.1672 25.9133 23.5413L30.8142 18.6403C31.4401 18.0144 32.4753 18.088 33.0064 18.7961L38.9819 26.7635C39.7011 27.7224 39.0169 29.0908 37.8183 29.0908H8.468C7.3202 29.0908 6.6246 27.8237 7.2409 26.8553L14.871 14.865Z" fill="var(--color-primary-500, #2C9C74)"/>
                  <circle cx="34.1818" cy="9.4545" r="3.63636" fill="var(--color-primary-500, #2C9C74)"/>
                </svg>
              </span>
              <span class="add-anim__plus"><fvdr-icon name="plus"></fvdr-icon></span>
            </span>
            <span class="upload-tile__label">Add image</span>
          </button>

          <!-- Filled state: preview + hover actions (icon-only, fit inside tile) -->
          <div *ngIf="logoUrl" class="upload-tile upload-tile--filled upload-tile--square">
            <img [src]="logoUrl" class="upload-tile__img" alt="Logo preview" />
            <div class="upload-tile__overlay">
              <fvdr-btn variant="secondary" size="s" iconName="edit" [iconOnly]="true" ariaLabel="Replace" dataTrack="logo-edit" (clicked)="pickFile('logo')"></fvdr-btn>
              <fvdr-btn variant="danger-secondary" size="s" iconName="trash" [iconOnly]="true" ariaLabel="Delete" dataTrack="logo-delete" (clicked)="removeAsset('logo')"></fvdr-btn>
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
          <p class="bp-card__desc">A full-screen image behind the sign-in form.<br>JPG or PNG · up to 10&nbsp;MB · recommended 1920×1080&nbsp;px.</p>
        </div>

        <div class="bp-card__control">
          <button
            *ngIf="!backgroundUrl"
            type="button"
            class="upload-tile upload-tile--empty upload-tile--wide"
            data-track="bg-add"
            (click)="pickFile('background')"
          >
            <span class="add-anim" aria-hidden="true">
              <span class="add-anim__back"></span>
              <span class="add-anim__front">
                <svg viewBox="0 0 46.5455 34.9091" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="46.5455" height="34.9091" rx="5.81818" fill="var(--color-primary-100, #AAE2BA)"/>
                  <path d="M14.871 14.865C15.4169 14.0072 16.6519 13.9598 17.2619 14.7731L23.7211 23.3855C24.2522 24.0936 25.2874 24.1672 25.9133 23.5413L30.8142 18.6403C31.4401 18.0144 32.4753 18.088 33.0064 18.7961L38.9819 26.7635C39.7011 27.7224 39.0169 29.0908 37.8183 29.0908H8.468C7.3202 29.0908 6.6246 27.8237 7.2409 26.8553L14.871 14.865Z" fill="var(--color-primary-500, #2C9C74)"/>
                  <circle cx="34.1818" cy="9.4545" r="3.63636" fill="var(--color-primary-500, #2C9C74)"/>
                </svg>
              </span>
              <span class="add-anim__plus"><fvdr-icon name="plus"></fvdr-icon></span>
            </span>
            <span class="upload-tile__label">Add image</span>
          </button>

          <div *ngIf="backgroundUrl" class="upload-tile upload-tile--filled upload-tile--wide">
            <img [src]="backgroundUrl" class="upload-tile__img upload-tile__img--cover" alt="Background preview" />
            <div class="upload-tile__overlay">
              <fvdr-btn variant="secondary" size="s" iconName="edit" [iconOnly]="true" ariaLabel="Replace" dataTrack="bg-edit" (clicked)="pickFile('background')"></fvdr-btn>
              <fvdr-btn variant="danger-secondary" size="s" iconName="trash" [iconOnly]="true" ariaLabel="Delete" dataTrack="bg-delete" (clicked)="removeAsset('background')"></fvdr-btn>
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

        </div><!-- /.bp-form -->

        <!-- ── Live login preview (second column) ── -->
        <aside class="bp-preview-col">
          <div class="bp-card__info">
            <h3 class="preview-panel__title">Login page preview</h3>
            <p class="bp-card__desc">Live preview of the invited-user sign-in screen.</p>
          </div>
          <div class="login-preview" [style.background-image]="backgroundUrl ? 'url(' + backgroundUrl + ')' : null">
            <div *ngIf="backgroundUrl" class="login-preview__scrim"></div>
            <div class="login-preview__card">
              <div class="login-preview__logo">
                <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" />
                <span *ngIf="!logoUrl" class="login-preview__logo-ph">Logo</span>
              </div>
              <div class="login-preview__fields">
                <div class="login-preview__field"><span>Email</span><i></i></div>
              </div>
              <button class="login-preview__btn" [style.background]="themeColor">Continue</button>
            </div>
          </div>
        </aside>

      </div><!-- /.bp-cols -->

    </div>

    <!-- ── Sticky save bar — pinned to the bottom of the screen ── -->
    <div class="save-bar" [class.save-bar--visible]="dirty">
      <div class="save-bar__actions">
        <fvdr-btn variant="primary" size="m" label="Save changes" data-track="save" (clicked)="save()"></fvdr-btn>
        <fvdr-btn variant="secondary" size="m" label="Discard" data-track="discard" (clicked)="discard()"></fvdr-btn>
      </div>
      <fvdr-inline-message variant="warning" size="m" text="You have unsaved changes" class="save-bar__msg"></fvdr-inline-message>
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
  cancelVariant="secondary"
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
    <div class="crop__controls">
      <div class="crop__zoom">
        <span class="crop__zoom-icon crop__zoom-icon--sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" rx="3" fill="var(--color-primary-100, #AAE2BA)"/>
            <path d="M4.91785 6.74806C5.19929 6.30579 5.83606 6.28133 6.1506 6.70071L7.98115 9.14145C8.25499 9.50658 8.78874 9.54451 9.11148 9.22178L10.3885 7.94473C10.7113 7.622 11.245 7.65993 11.5189 8.02506L13.1 10.1333C13.4708 10.6277 13.118 11.3333 12.5 11.3333H3.36626C2.77444 11.3333 2.41578 10.6799 2.73351 10.1806L4.91785 6.74806Z" fill="var(--color-primary-500, #2C9C74)"/>
            <circle cx="11.75" cy="4.58325" r="1.25" fill="var(--color-primary-500, #2C9C74)"/>
          </svg>
        </span>
        <input type="range" min="1" max="3" step="0.01" [(ngModel)]="cropZoom" (ngModelChange)="clampCropOffset()" [style.--range-pct]="rangePct" aria-label="Zoom" />
        <span class="crop__zoom-icon crop__zoom-icon--lg" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="3" fill="var(--color-primary-100, #AAE2BA)"/>
            <path d="M7.66785 9.6648C7.9493 9.22254 8.58606 9.19808 8.9006 9.61746L12.2311 14.0582C12.505 14.4233 13.0387 14.4613 13.3615 14.1385L15.8885 11.6115C16.2113 11.2887 16.745 11.3267 17.0189 11.6918L20.1 15.8C20.4708 16.2944 20.118 17 19.5 17H4.36626C3.77444 17 3.41578 16.3466 3.73351 15.8473L7.66785 9.6648Z" fill="var(--color-primary-500, #2C9C74)"/>
            <circle cx="17.625" cy="6.875" r="1.875" fill="var(--color-primary-500, #2C9C74)"/>
          </svg>
        </span>
      </div>
      <p class="crop__hint">Drag the image to reposition. Slide to zoom.</p>
    </div>
  </div>
</fvdr-modal>

<!-- Toast host -->
<fvdr-toast-host />
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    /* Sidebar always full viewport height; only the main content scrolls */
    .bp-layout { display: flex; height: 100vh; overflow: hidden; background: var(--color-stone-0); }
    .bp-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: var(--color-stone-0); position: relative; }
    .bp-content { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 32px 64px; }

    /* Two equal columns (50/50): settings form (left) + live preview (right, sticky) */
    .bp-cols { display: flex; align-items: flex-start; gap: 40px; }
    .bp-form { flex: 1 1 0; min-width: 0; }
    .bp-preview-col { flex: 1 1 0; min-width: 0; position: sticky; top: 0; display: flex; flex-direction: column; gap: 24px; }
    .preview-panel__title { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-base, 20px); color: var(--color-text-primary); margin: 0; }
    @media (max-width: 1080px) {
      .bp-cols { flex-direction: column; gap: 28px; }
      .bp-form, .bp-preview-col { width: 100%; flex: none; }
      .bp-preview-col { position: static; }
    }

    /* ── Settings sub-tabs (DS fvdr-tabs) ── */
    .settings-tabs { display: block; margin-bottom: var(--space-6); }

    /* ── Setting section — info stacked above the control (Figma vertical) ── */
    .bp-form { display: flex; flex-direction: column; gap: 24px; }
    .bp-card { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
    .bp-card__info { display: flex; flex-direction: column; gap: 8px; }
    .bp-card__title { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-base, 20px); color: var(--color-text-primary); margin: 0; display: flex; align-items: center; gap: 6px; }
    .bp-card__desc { font-size: var(--font-size-base, 14px); color: var(--color-text-secondary); margin: 0; line-height: var(--line-height-base, 20px); }
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
    .upload-tile--wide { width: 244px; height: 152px; }
    .upload-tile--square { width: 152px; height: 152px; }
    .upload-tile--empty {
      appearance: none; cursor: pointer;
      border: 1px dashed var(--color-stone-400); background: var(--color-stone-200);
      transition: border-color .15s ease, background .15s ease;
      padding: 12px;
    }
    .upload-tile--empty:hover { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .upload-tile__label { font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-regular, 400); line-height: var(--line-height-lg, 24px); color: var(--color-primary-500); }

    /* ── Animated add-image placeholder (Figma 609:1267) ── */
    .add-anim { position: relative; width: 64px; height: 64px; }
    .add-anim__back {
      position: absolute; left: 5.8px; top: 11.6px; width: 46.5px; height: 34.9px;
      border-radius: 5.8px; background: var(--color-primary-400);
      transform-origin: 6.25% 91.667%;
      transition: transform .4s cubic-bezier(.5, 0, .5, 1);
    }
    .add-anim__front {
      position: absolute; left: 11.6px; top: 17.5px; width: 46.5px; height: 34.9px;
      transform-origin: 95.313% 91.667%;
      transition: transform .4s cubic-bezier(.5, 0, .5, 1);
    }
    .add-anim__front svg { display: block; width: 100%; height: 100%; }
    .add-anim__plus {
      position: absolute; right: 0; bottom: 5.8px; z-index: 2;
      width: 20.4px; height: 20.4px; border-radius: 50%;
      background: var(--color-stone-0); box-shadow: var(--shadow-card);
      display: grid; place-items: center;
    }
    .add-anim__plus fvdr-icon { font-size: var(--font-size-sm, 13px); color: var(--color-primary-500); }
    /* Hover: the two cards fan apart */
    .upload-tile--empty:hover .add-anim__back { transform: rotate(-10.77deg); }
    .upload-tile--empty:hover .add-anim__front { transform: rotate(5.84deg); }

    .upload-tile--filled { border: 1px solid var(--color-divider); background: var(--color-stone-0); overflow: hidden; }
    .upload-tile__img { width: 100%; height: 100%; object-fit: cover; }
    .upload-tile__img--cover { width: 100%; height: 100%; object-fit: cover; }
    .upload-tile__overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px;
      opacity: 0; transition: opacity .15s ease;
    }
    /* 90% white dim over the image (Figma) */
    .upload-tile__overlay::before {
      content: ''; position: absolute; inset: 0;
      background: var(--color-stone-0); opacity: .9;
    }
    .upload-tile__overlay fvdr-btn { position: relative; z-index: 1; }
    .upload-tile--filled:hover .upload-tile__overlay { opacity: 1; }

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
    /* Pinned to the bottom of the screen; slides up when there are unsaved changes */
    .save-bar {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 20;
      display: flex; align-items: center; justify-content: flex-start; gap: 16px;
      background: var(--color-stone-0);
      border-top: 1px solid var(--color-divider);
      padding: 12px 32px;
      transform: translateY(100%); pointer-events: none;
      transition: transform .25s ease;
    }
    .save-bar--visible { transform: translateY(0); pointer-events: auto; }
    .save-bar__actions { display: flex; gap: 8px; }

    /* ── Login preview (Figma 603:14837) ── */
    .login-preview {
      position: relative; border-radius: var(--radius-md); overflow: hidden;
      width: 100%; aspect-ratio: 16 / 11;
      display: flex; align-items: center; justify-content: center;
      background-color: var(--color-stone-200); background-size: cover; background-position: center;
    }
    .login-preview__scrim { position: absolute; inset: 0; background: var(--color-overlay-light); }
    .login-preview__card {
      position: relative; z-index: 1; background: var(--color-stone-0);
      border-radius: var(--radius-md); padding: 24px 32px 32px;
      display: flex; flex-direction: column; align-items: flex-start; gap: 16px;
      box-shadow: var(--shadow-card);
    }
    .login-preview__logo { display: flex; align-items: center; justify-content: center; }
    .login-preview__logo img { width: 46px; height: 46px; object-fit: contain; border-radius: var(--radius-sm); }
    .login-preview__logo-ph {
      width: 46px; height: 46px; border-radius: var(--radius-sm);
      background: var(--color-text-placeholder); color: var(--color-stone-0);
      display: grid; place-items: center;
      font-size: var(--font-size-base, 14px); line-height: var(--line-height-base, 20px);
    }
    .login-preview__fields { display: flex; flex-direction: column; gap: 10px; width: 200px; }
    .login-preview__field {
      height: 32px; box-sizing: border-box; overflow: hidden;
      border: 1px solid var(--color-stone-300); border-radius: var(--radius-sm);
      padding: 5px 6px; display: flex; flex-direction: column; gap: 4px;
      font-size: var(--font-size-2xs, 11px); line-height: 1; color: var(--color-text-placeholder);
    }
    .login-preview__field i { display: block; height: 4px; width: 92px; background: var(--color-stone-300); border-radius: var(--radius-sm); }
    .login-preview__btn {
      width: 200px; height: 32px; border: none; border-radius: var(--radius-sm);
      color: var(--color-stone-0); font-weight: var(--font-weight-regular, 400);
      font-size: var(--font-size-base, 14px); cursor: default; font-family: var(--font-family);
    }

    /* ── Crop modal (Figma 611:2471 / 611:2579) ── */
    .crop { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .crop__frame {
      position: relative; overflow: hidden; border-radius: var(--radius-md);
      background: var(--color-stone-200); border: 1px solid var(--color-stone-400);
      cursor: grab; touch-action: none; max-width: 100%;
    }
    .crop__frame:active { cursor: grabbing; }
    .crop__img { position: absolute; left: 50%; top: 50%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
    /* Rule-of-thirds grid (interior lines only) */
    .crop__grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(to right, transparent calc(33.333% - 0.5px), var(--color-stone-400) calc(33.333% - 0.5px) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), var(--color-stone-400) calc(66.666% - 0.5px) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)),
        linear-gradient(to bottom, transparent calc(33.333% - 0.5px), var(--color-stone-400) calc(33.333% - 0.5px) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), var(--color-stone-400) calc(66.666% - 0.5px) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px));
    }
    .crop__controls { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
    .crop__zoom { display: flex; align-items: center; justify-content: center; gap: 24px; width: 100%; max-width: 380px; }
    /* ── DS slider (Figma 21176:1948): green fill + grey track + white/green thumb ── */
    .crop__zoom input[type=range] {
      -webkit-appearance: none; appearance: none;
      flex: 1; height: 24px; margin: 0; background: transparent; cursor: pointer;
    }
    .crop__zoom input[type=range]::-webkit-slider-runnable-track {
      height: 4px; border-radius: var(--radius-sm);
      background: linear-gradient(to right, var(--color-primary-500) var(--range-pct, 0%), var(--color-stone-300) var(--range-pct, 0%));
    }
    .crop__zoom input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; margin-top: -7px;
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--color-stone-0); border: 2px solid var(--color-primary-500);
      box-shadow: 0 0 0 2px var(--color-primary-50);
    }
    .crop__zoom input[type=range]:active::-webkit-slider-thumb { cursor: grabbing; }
    .crop__zoom input[type=range]::-moz-range-track { height: 4px; border-radius: var(--radius-sm); background: var(--color-stone-300); }
    .crop__zoom input[type=range]::-moz-range-progress { height: 4px; border-radius: var(--radius-sm); background: var(--color-primary-500); }
    .crop__zoom input[type=range]::-moz-range-thumb {
      width: 18px; height: 18px; border: 2px solid var(--color-primary-500); border-radius: 50%;
      background: var(--color-stone-0); box-shadow: 0 0 0 2px var(--color-primary-50);
    }
    .crop__zoom-icon { flex-shrink: 0; display: block; }
    .crop__zoom-icon svg { display: block; width: 100%; height: auto; }
    .crop__zoom-icon--sm { width: 16px; }
    .crop__zoom-icon--lg { width: 24px; }
    .crop__hint { font-size: var(--font-size-base, 14px); line-height: var(--line-height-base, 20px); color: var(--color-text-secondary); margin: 0; text-align: center; }

    @media (max-width: 760px) {
      .bp-content { padding: 18px 16px 48px; }
      .save-bar { padding: 12px 16px; }
    }
  `],
})
export class BrandingPageComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bgInput') bgInput!: ElementRef<HTMLInputElement>;
  @ViewChild(TabsComponent) private tabsRef?: TabsComponent;

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

  settingsTabs: TabItem[] = [
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
    // Keep Branding visually active — fvdr-tabs self-mutates its activeId on click, so reset it.
    if (this.tabsRef) this.tabsRef.activeId = 'branding';
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
  /** Zoom slider fill percentage (cropZoom 1→3 maps to 0→100%). */
  get rangePct(): string { return `${((this.cropZoom - 1) / 2) * 100}%`; }

  /** Crop frame dimensions per asset (Figma: logo 300×300, background 390×234). */
  get cropFrameW(): number { return this.cropKind === 'logo' ? 300 : 390; }
  get cropFrameH(): number { return this.cropKind === 'logo' ? 300 : 234; }
  /** Output/frame aspect ratio (derived from the frame so the crop is not distorted). */
  private get cropAspect(): number { return this.cropFrameW / this.cropFrameH; }

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
