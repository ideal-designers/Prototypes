import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  SidebarNavComponent,
  DropdownOption,
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
  [style.--color-primary-100]="appliedColor100"
  [style.--color-primary-400]="appliedColor400"
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
      *ngIf="!isMobile"
      [breadcrumbs]="breadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="DT"
    ></fvdr-header>

    <!-- ── Mobile header (Settings Figma 679:39208): burger + section, tabs as a dropdown ── -->
    <div *ngIf="isMobile" class="m-header">
      <div class="m-header__top">
        <fvdr-btn variant="ghost" size="m" iconName="menu" [iconOnly]="true" ariaLabel="Open menu" dataTrack="m-menu" (clicked)="openSidebar()"></fvdr-btn>
        <span class="m-header__title">Project</span>
      </div>
      <fvdr-dropdown size="l" [options]="settingsTabOptions" [value]="activeTab" (valueChange)="onTabSelect($event)"></fvdr-dropdown>
    </div>

    <div class="bp-content">

      <!-- Settings sub-tabs (Branding active; others out of prototype scope) -->
      <fvdr-tabs
        *ngIf="!isMobile"
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

    <!-- ── Mobile bottom panel: Preview is always here; Discard / Save join it once something changed ── -->
    <div *ngIf="isMobile" class="m-bar">
      <fvdr-btn *ngIf="!dirty" class="m-bar__fill" variant="secondary" size="l" iconName="eye" label="Preview login page" dataTrack="m-preview" (clicked)="openPreview()"></fvdr-btn>
      <ng-container *ngIf="dirty">
        <fvdr-btn variant="secondary" size="l" iconName="eye" [iconOnly]="true" ariaLabel="Preview login page" dataTrack="m-preview" (clicked)="openPreview()"></fvdr-btn>
        <fvdr-btn class="m-bar__fill" variant="secondary" size="l" label="Cancel" data-track="discard" (clicked)="discard()"></fvdr-btn>
        <fvdr-btn class="m-bar__fill" variant="primary" size="l" label="Save" data-track="save" (clicked)="save()"></fvdr-btn>
      </ng-container>
    </div>

    <!-- ── Sticky save bar — pinned to the bottom of the screen (Settings Figma 610:2213): Cancel, then Save ── -->
    <div *ngIf="!isMobile" class="save-bar" [class.save-bar--visible]="dirty">
      <div class="save-bar__actions">
        <fvdr-btn variant="secondary" size="m" label="Cancel" data-track="discard" (clicked)="discard()"></fvdr-btn>
        <fvdr-btn variant="primary" size="m" label="Save" data-track="save" (clicked)="save()"></fvdr-btn>
      </div>
    </div>
  </div>
</div>

<!-- Hidden file inputs -->
<input #logoInput type="file" accept="image/*" hidden (change)="onFileSelected($event, 'logo')" />
<input #bgInput type="file" accept="image/*" hidden (change)="onFileSelected($event, 'background')" />

<!-- ── Crop: modal on desktop, action sheet on mobile (Settings Figma 679:39511 / 679:39683) ── -->
<fvdr-modal
  [visible]="cropOpen && !isMobile"
  [title]="cropKind === 'logo' ? 'Crop logo' : 'Crop background'"
  size="m"
  confirmLabel="Apply"
  cancelLabel="Cancel"
  cancelVariant="secondary"
  (confirmed)="applyCrop()"
  (cancelled)="cropOpen = false"
  (closed)="cropOpen = false"
>
  <ng-container *ngTemplateOutlet="cropBody"></ng-container>
</fvdr-modal>

<fvdr-bottom-sheet
  [visible]="cropOpen && isMobile"
  [title]="cropKind === 'logo' ? 'Crop logo' : 'Crop background'"
  (closed)="cropOpen = false"
>
  <ng-container *ngTemplateOutlet="cropBody"></ng-container>
  <div class="crop-sheet__actions">
    <fvdr-btn class="m-bar__fill" variant="primary" size="l" label="Crop" dataTrack="crop-apply" (clicked)="applyCrop()"></fvdr-btn>
    <fvdr-btn class="m-bar__fill" variant="secondary" size="l" label="Cancel" dataTrack="crop-cancel" (clicked)="cropOpen = false"></fvdr-btn>
  </div>
</fvdr-bottom-sheet>

<ng-template #cropBody>
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
</ng-template>

<!-- ── Mobile: full-screen login preview (Settings Figma 679:40607 / 679:40759) ── -->
<div *ngIf="previewOpen" class="pv" role="dialog" aria-label="Login page preview">
  <div class="pv__head">
    <span class="pv__title">Login page preview</span>
    <fvdr-btn variant="ghost" size="m" iconName="close" [iconOnly]="true" ariaLabel="Close preview" dataTrack="preview-close" (clicked)="previewOpen = false"></fvdr-btn>
  </div>
  <!-- Desktop sign-in (User account Figma 24778:6461), scaled down to the phone width -->
  <div class="pv__screen pv__screen--desktop">
    <div class="dsk-frame" [style.height.px]="dskHeight * dskScale">
      <div
        class="dsk"
        [class.dsk--default]="!backgroundUrl"
        [style.transform]="'scale(' + dskScale + ')'"
        [style.background-image]="backgroundUrl ? 'url(' + backgroundUrl + ')' : null"
      >
        <ng-container *ngIf="!backgroundUrl">
          <span class="dsk__ring dsk__ring--1"></span>
          <span class="dsk__ring dsk__ring--2"></span>
          <span class="dsk__ring dsk__ring--3"></span>
        </ng-container>
        <svg class="dsk__wordmark" viewBox="0 0 86 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ideals.">
          <path d="M0.380615 3.0228C0.380615 1.67609 1.47081 0.650024 2.84959 0.650024C4.1963 0.650024 5.25444 1.67609 5.25444 3.0228C5.25444 4.40158 4.1963 5.39558 2.84959 5.39558C1.43875 5.39558 0.380615 4.40158 0.380615 3.0228ZM0.861584 22.967V7.25533H4.67727V22.967H0.861584Z" fill="currentColor"/>
          <path d="M23.2427 1.00281V22.9991H19.5232V20.947C18.3689 22.3258 16.7336 23.3839 14.457 23.3839C9.93588 23.3839 6.56909 19.8247 6.56909 15.1433C6.56909 10.526 9.96794 6.93476 14.4249 6.93476C16.6694 6.93476 18.2727 7.96083 19.427 9.30754V1.00281H23.2427ZM19.6514 15.1112C19.6514 12.514 17.8238 10.3336 15.0021 10.3336C12.2125 10.3336 10.3848 12.514 10.3848 15.1112C10.3848 17.7726 12.2125 19.9209 15.0021 19.9209C17.7917 19.9209 19.6514 17.7726 19.6514 15.1112Z" fill="currentColor"/>
          <path d="M40.9744 16.4579H28.8861C29.367 18.478 30.842 20.0812 33.7278 20.0812C35.5234 20.0812 37.5756 19.4078 38.9544 18.4459L40.4614 21.1393C38.9864 22.2295 36.4533 23.3197 33.5675 23.3197C27.6035 23.3197 24.9742 19.2796 24.9742 15.1112C24.9742 10.4298 28.2768 6.90265 33.2148 6.90265C37.6718 6.90265 41.0706 9.82053 41.0706 14.7905C41.1027 15.4318 41.0386 15.9449 40.9744 16.4579ZM28.8861 13.6041H37.3511C37.0305 11.3917 35.3952 10.045 33.2148 10.045C31.0344 10.045 29.3991 11.4238 28.8861 13.6041Z" fill="currentColor"/>
          <path d="M59.1871 7.28742V22.967H55.5638V21.0431C54.3774 22.3899 52.6779 23.3518 50.4014 23.3518C45.8161 23.3518 42.5455 19.6964 42.5455 15.0471C42.5455 10.3336 45.8803 6.90265 50.4014 6.90265C52.6779 6.90265 54.3453 7.92872 55.5638 9.27543V7.28742H59.1871ZM55.66 15.1112C55.66 12.514 53.7681 10.3336 50.9785 10.3336C48.1889 10.3336 46.3292 12.514 46.3292 15.1112C46.3292 17.7405 48.1889 19.9209 50.9785 19.9209C53.7361 19.9209 55.66 17.7405 55.66 15.1112Z" fill="currentColor"/>
          <path d="M61.5919 22.9671V1.00281H65.3755V22.9991H61.5919V22.9671Z" fill="currentColor"/>
          <path d="M66.9468 20.2735L69.0951 17.9649C70.1853 19.3757 71.8206 20.1773 73.3597 20.1773C74.7385 20.1773 75.7004 19.4399 75.7004 18.5421C75.7004 17.8687 75.2515 17.4198 74.514 17.035C73.6162 16.5861 71.5641 15.9128 70.5701 15.3997C68.7745 14.534 67.9087 13.1231 67.9087 11.3916C67.9087 8.69822 70.1532 6.74228 73.6803 6.74228C75.7004 6.74228 77.6884 7.4477 79.1313 9.05093L77.1433 11.4558C76.0211 10.3015 74.6743 9.82048 73.5841 9.82048C72.3657 9.82048 71.6603 10.4938 71.6603 11.2955C71.6603 11.8406 72.013 12.4498 73.0391 12.8346C74.0651 13.2514 75.6042 13.7644 76.8547 14.4057C78.6183 15.3356 79.5482 16.554 79.5482 18.4138C79.5482 21.2034 77.1433 23.3838 73.3918 23.3838C70.8587 23.3838 68.4538 22.3577 66.9468 20.2735Z" fill="currentColor"/>
          <path d="M80.51 21.1714C80.51 19.9209 81.5361 18.959 82.8187 18.959C84.0371 18.959 85.0311 19.9209 85.0311 21.1714C85.0311 22.4861 84.0371 23.416 82.8187 23.416C81.5361 23.448 80.51 22.4861 80.51 21.1714Z" fill="currentColor"/>
        </svg>
        <div class="dsk__card">
          <span class="dsk__logo">
            <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" />
            <span *ngIf="!logoUrl" class="logo-ph">Logo</span>
          </span>
          <h2 class="dsk__title">Sign in to Project Alpha</h2>
          <div class="dsk__field">
            <span class="dsk__label">Email</span>
            <span class="dsk__input"><fvdr-icon name="envelope"></fvdr-icon>name&#64;company.com</span>
          </div>
          <span class="dsk__btn" [style.background]="themeColor">Continue</span>
        </div>
        <div class="dsk__footer">
          <span class="dsk__links">
            <span class="dsk__link"><fvdr-icon name="help"></fvdr-icon>Help</span>
            <span class="dsk__link"><fvdr-icon name="language"></fvdr-icon>English<fvdr-icon name="chevron-down"></fvdr-icon></span>
          </span>
          <span class="dsk__links dsk__links--small">
            <span>© 2026 iDeals. All rights reserved.</span><span>Privacy Policy</span><span>Terms of Use</span>
          </span>
        </div>
      </div>
    </div>
    <p class="pv__caption">How participants see the sign-in page on a computer</p>
  </div>
</div>

<!-- Toast host -->
<fvdr-toast-host />
  `,
  styles: [`
    /* dvh = the visible viewport, so on phones the bottom panel stays on screen above the browser toolbar */
    :host { display: block; height: 100vh; height: 100dvh; }

    /* Sidebar always full viewport height; only the main content scrolls */
    .bp-layout { display: flex; height: 100vh; height: 100dvh; overflow: hidden; background: var(--color-stone-0); }
    .bp-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: var(--color-stone-0); position: relative; }
    .bp-content { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 32px calc(var(--space-8) * 3); } /* clears the 73px save bar */

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
      padding: var(--space-4) var(--space-8);
      transform: translateY(100%); pointer-events: none;
      transition: transform .25s ease;
    }
    .save-bar--visible { transform: translateY(0); pointer-events: auto; }
    .save-bar__actions { display: flex; gap: var(--space-3); }

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

    /* ══ Mobile (< 768px) — Settings Figma "Mobile" row ══════════════════════ */
    .m-header { flex-shrink: 0; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5) var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .m-header__top { display: flex; align-items: center; gap: var(--space-1); }
    .m-header__title { font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-lg, 24px); color: var(--color-text-primary); }
    .m-header fvdr-dropdown { display: block; padding: 0 var(--space-1); }

    .m-bar { flex-shrink: 0; display: flex; gap: var(--space-3); padding: var(--space-4); padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px)); background: var(--color-stone-0); border-top: 1px solid var(--color-divider); }
    .m-bar__fill { flex: 1; min-width: 0; display: flex; }
    :host ::ng-deep .m-bar__fill .btn { width: 100%; }
    .crop-sheet__actions { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-6); }

    @media (max-width: 767px) {
      /* The page draws its own burger in the mobile header */
      :host ::ng-deep fvdr-sidebar-nav .burger-btn { display: none !important; }
      .bp-content { padding: var(--space-4) var(--space-4) var(--space-6); }
      .bp-preview-col { display: none; }
      /* Background tile: full content width × 200 (Settings Figma 679:39063) */
      .bp-card__control { align-self: stretch; }
      .upload-tile--wide { width: 100%; height: 200px; }
      .swatches { gap: var(--space-3); }
      .invite-card { padding-top: 0; }
    }
    /* No hover on touch: edit / delete sit in the corner of the image, no dim */
    @media (max-width: 767px), (hover: none) {
      .upload-tile__overlay { opacity: 1; align-items: flex-end; justify-content: flex-end; gap: var(--space-2); padding: var(--space-2); }
      .upload-tile__overlay::before { display: none; }
      :host ::ng-deep .upload-tile__overlay .btn { background: var(--color-stone-0); }
    }

    /* ── Full-screen login preview ── */
    .pv { position: fixed; inset: 0; z-index: 900; display: flex; flex-direction: column; background: var(--color-stone-0); animation: pv-in .2s ease; }
    @keyframes pv-in { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
    .pv__head { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-5) var(--space-1) var(--space-5) var(--space-4); }
    .pv__title { font-size: var(--font-size-lg, 16px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-lg, 24px); color: var(--color-text-primary); }
    .pv__screen { flex: 1; min-height: 0; overflow-y: auto; border-top: 1px solid var(--color-divider); }
    .pv__screen--desktop { display: flex; flex-direction: column; justify-content: center; gap: var(--space-3); padding: var(--space-4); background: var(--color-stone-200); }
    .pv__caption { margin: 0; text-align: center; font-size: var(--font-size-base, 14px); line-height: var(--line-height-base, 20px); color: var(--color-text-secondary); }

    .logo-ph { width: 100%; height: 100%; border-radius: var(--radius-sm); background: var(--color-text-placeholder); color: var(--color-stone-0); display: grid; place-items: center; font-size: var(--font-size-base, 14px); }

    /* Desktop sign-in (User account Figma 24778:6461) — laid out at 880×640, scaled to fit */
    .dsk-frame { position: relative; width: 100%; overflow: hidden; border-radius: var(--radius-md); }
    .dsk {
      position: absolute; left: 0; top: 0; width: 880px; height: 640px; transform-origin: 0 0; overflow: hidden;
      background-color: var(--color-signin-bg); background-size: cover; background-position: center; color: var(--color-stone-0);
    }
    .dsk__ring { position: absolute; border-radius: 50%; border: 1.5px solid var(--color-signin-ring); opacity: .7; }
    .dsk__ring--1 { width: 420px; height: 420px; left: -120px; top: -260px; }
    .dsk__ring--2 { width: 900px; height: 900px; left: -160px; top: -420px; }
    .dsk__ring--3 { width: 1300px; height: 1300px; left: -300px; top: -700px; }
    .dsk__wordmark { position: absolute; left: 50%; top: 28px; width: 86px; height: 24px; transform: translateX(-50%); color: var(--color-stone-0); }
    .dsk__card {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -54%); width: 384px; box-sizing: border-box;
      display: flex; flex-direction: column; gap: var(--space-5); padding: 28px var(--space-8);
      background: var(--color-stone-0); border-radius: var(--radius-sm); color: var(--color-text-primary);
    }
    .dsk__logo { width: 40px; height: 40px; display: block; }
    .dsk__logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
    .dsk__title { margin: 0; font-size: var(--font-size-2xl, 20px); font-weight: var(--font-weight-bold, 700); line-height: 28px; }
    .dsk__field { display: flex; flex-direction: column; gap: var(--space-1); }
    .dsk__label { font-size: var(--font-size-md, 15px); font-weight: var(--font-weight-semi, 600); line-height: var(--line-height-lg, 24px); color: var(--color-text-primary); }
    .dsk__input { display: flex; align-items: center; gap: var(--space-2); height: 40px; padding: 0 var(--space-4); border: 1px solid var(--color-stone-400); border-radius: var(--radius-sm); font-size: var(--font-size-base, 14px); color: var(--color-text-placeholder); }
    .dsk__input fvdr-icon { font-size: var(--font-size-lg, 16px); color: var(--color-text-secondary); }
    .dsk__btn { display: grid; place-items: center; height: 40px; border-radius: var(--radius-sm); color: var(--color-stone-0); font-size: var(--font-size-base, 14px); }
    .dsk__link { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); font-size: var(--font-size-base, 14px); line-height: var(--line-height-base, 20px); }
    .dsk__footer { position: absolute; left: var(--space-6); right: var(--space-6); bottom: var(--space-5); display: flex; align-items: center; justify-content: space-between; }
    .dsk__links { display: flex; align-items: center; gap: var(--space-2); }
    .dsk__links--small { gap: var(--space-6); font-size: var(--font-size-xs, 12px); }
  `],
})
export class BrandingPageComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);

  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bgInput') bgInput!: ElementRef<HTMLInputElement>;
  @ViewChild(TabsComponent) private tabsRef?: TabsComponent;
  @ViewChild(SidebarNavComponent) private sidebarRef?: SidebarNavComponent;

  sidebarCollapsed = false;
  activeTab = 'branding';

  // Phone layout (< 768px): mobile header, bottom panel, crop as an action sheet, full-screen preview
  private static readonly BP_MOBILE = 768;
  viewportW = typeof window !== 'undefined' ? window.innerWidth : 1440;
  get isMobile(): boolean { return this.viewportW < BrandingPageComponent.BP_MOBILE; }

  previewOpen = false;
  /** Desktop sign-in mock is laid out at 880×640 and scaled to the phone width. */
  readonly dskHeight = 640;
  get dskScale(): number { return Math.max(0.2, (this.viewportW - 32) / 880); }

  @HostListener('window:resize')
  onResize(): void {
    this.viewportW = window.innerWidth;
    if (!this.isMobile) this.previewOpen = false;
    if (this.cropOpen) this.clampCropOffset();
    this.syncFabLift();
  }

  /** Lift the platform FABs (annotate / heatmap) above the mobile bottom panel. */
  private syncFabLift(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement.style;
    if (this.isMobile) root.setProperty('--fab-lift', '80px');
    else root.removeProperty('--fab-lift');
  }

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
  settingsTabOptions: DropdownOption[] = this.settingsTabs.map(t => ({ value: t.id, label: t.label }));

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
  get appliedColor100(): string {
    return this.isDefaultColor ? '#AAE2BA' : this.mix(this.saved.themeColor, '#FFFFFF', 0.62);
  }
  get appliedColor400(): string {
    return this.isDefaultColor ? '#5AC778' : this.mix(this.saved.themeColor, '#FFFFFF', 0.22);
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
    this.syncFabLift();
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
    document.documentElement.style.removeProperty('--fab-lift');
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

  /** Mobile tab dropdown — same behaviour as the tabs, then snap back to Branding. */
  onTabSelect(v: string | string[]): void {
    const id = Array.isArray(v) ? v[0] : v;
    if (!id || id === 'branding') return;
    this.activeTab = id;
    this.onTabClick(id);
    setTimeout(() => (this.activeTab = 'branding'));
  }

  openSidebar(): void {
    if (!this.sidebarRef) return;
    this.sidebarRef.mobileOpen = true;
    this.sidebarRef.cdr.markForCheck();
  }

  openPreview(): void {
    this.previewOpen = true;
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

  /** Crop frame dimensions per asset (Figma: logo 300×300, background 390×234; on a phone they shrink to the sheet width). */
  get cropFrameW(): number {
    const base = this.cropKind === 'logo' ? 300 : 390;
    return this.isMobile ? Math.min(base, this.viewportW - 32) : base;
  }
  get cropFrameH(): number { return this.cropKind === 'logo' ? this.cropFrameW : Math.round(this.cropFrameW * 0.6); }
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
