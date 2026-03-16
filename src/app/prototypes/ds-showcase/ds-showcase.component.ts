import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type {
  TabItem, DroplistItem, DropdownOption, RadioOption,
  SearchFilter, SegmentItem, TableColumn, TreeNode,
  HeaderNavItem, HeaderAction,
} from '../../shared/ds';

/**
 * DS Showcase — all FVDR Design System components on one page
 * Route: /ds
 */
@Component({
  selector: 'app-ds-showcase',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <!-- Toast host -->
    <fvdr-toast-host />

    <div class="showcase">
      <!-- Sidebar nav -->
      <nav class="showcase__nav">
        <div class="showcase__nav-logo">DS Components</div>
        <a *ngFor="let s of sections" class="showcase__nav-link" [href]="'#' + s.id">{{ s.label }}</a>
      </nav>

      <!-- Content -->
      <main class="showcase__main">
        <div class="showcase__hero">
          <h1 class="showcase__h1">FVDR Design System</h1>
          <p class="showcase__subtitle">All components in one place · Figma: <a href="https://www.figma.com/design/liyNDiFf1piO8SQmHNKoeU" target="_blank">liyNDiFf1piO8SQmHNKoeU</a></p>
          <div class="showcase__stats">
            <span class="showcase__stat"><b>35</b> components</span>
            <span class="showcase__stat"><b>51</b> icons</span>
            <span class="showcase__stat"><b>1</b> token file</span>
          </div>
        </div>

        <!-- ── BUTTONS ── -->
        <section class="section" id="buttons">
          <h2 class="section__title">Buttons</h2>
          <div class="section__desc">Figma: node 15023-113844</div>
          <div class="row wrap">
            <fvdr-btn label="Primary" variant="primary" />
            <fvdr-btn label="Secondary" variant="secondary" />
            <fvdr-btn label="Ghost" variant="ghost" />
            <fvdr-btn label="Danger" variant="danger" />
          </div>
          <div class="row wrap">
            <fvdr-btn label="Small" variant="primary" size="s" />
            <fvdr-btn label="Medium" variant="primary" size="m" />
            <fvdr-btn label="Large" variant="primary" size="l" />
          </div>
          <div class="row wrap">
            <fvdr-btn label="Loading..." variant="primary" [loading]="true" />
            <fvdr-btn label="Disabled" variant="primary" [disabled]="true" />
          </div>
        </section>

        <!-- ── INPUTS ── -->
        <section class="section" id="inputs">
          <h2 class="section__title">Input / Text field</h2>
          <div class="section__desc">Figma: node 15032-12127</div>
          <div class="col" style="max-width: 400px; gap: 12px;">
            <fvdr-input label="Default" placeholder="Enter value..." />
            <fvdr-input label="With icon" placeholder="Search..." iconLeft="search" />
            <fvdr-input label="Error state" placeholder="Email" state="error" errorText="Invalid email address" />
            <fvdr-input label="Success state" placeholder="Username" state="success" helperText="Username is available" />
            <fvdr-input label="Disabled" placeholder="Can't edit" state="disabled" />
            <fvdr-input label="Required" placeholder="Full name" [required]="true" />
          </div>
          <div class="row wrap" style="margin-top: 12px;">
            <fvdr-input placeholder="Size S" size="s" style="width:200px" />
            <fvdr-input placeholder="Size M" size="m" style="width:200px" />
            <fvdr-input placeholder="Size L" size="l" style="width:200px" />
          </div>
        </section>

        <!-- ── TEXTAREA ── -->
        <section class="section" id="textarea">
          <h2 class="section__title">Input / Text area</h2>
          <div class="section__desc">Figma: node 15032-12204</div>
          <div class="col" style="max-width: 400px; gap: 12px;">
            <fvdr-textarea label="Description" placeholder="Enter description..." />
            <fvdr-textarea label="With counter" placeholder="Max 200 chars" [maxlength]="200" />
            <fvdr-textarea label="Error" state="error" errorText="Required field" />
          </div>
        </section>

        <!-- ── SEARCH ── -->
        <section class="section" id="search">
          <h2 class="section__title">Input / Search with filters</h2>
          <div class="section__desc">Figma: node 15032-12166</div>
          <div class="col" style="max-width: 400px; gap: 12px;">
            <fvdr-search placeholder="Search users..." />
            <fvdr-search placeholder="Search with filters..." [filters]="searchFilters" (filterToggle)="toggleFilter($event)" />
            <fvdr-search placeholder="Search + filter btn" [showFilterBtn]="true" />
          </div>
        </section>

        <!-- ── DATEPICKER ── -->
        <section class="section" id="datepicker">
          <h2 class="section__title">Input / Calendar (Date picker)</h2>
          <div class="section__desc">Figma: node 15032-12231</div>
          <div class="row wrap" style="gap: 24px; align-items: flex-start;">
            <div style="width: 220px;">
              <fvdr-datepicker label="Single date" [(ngModel)]="selectedDate" />
            </div>
            <div style="width: 260px;">
              <fvdr-datepicker label="Date range" [rangeMode]="true" [(rangeStart)]="rangeStart" [(rangeEnd)]="rangeEnd" />
            </div>
          </div>
        </section>

        <!-- ── CALENDAR ── -->
        <section class="section" id="calendar">
          <h2 class="section__title">Calendar (inline)</h2>
          <div class="section__desc">Figma: node 15032-12446</div>
          <div class="row wrap" style="gap: 24px; align-items: flex-start;">
            <fvdr-calendar [(selected)]="calDate" />
            <fvdr-calendar [rangeMode]="true" [(rangeStart)]="rangeStart" [(rangeEnd)]="rangeEnd" />
          </div>
        </section>

        <!-- ── TIMEPICKER ── -->
        <section class="section" id="timepicker">
          <h2 class="section__title">Input / Time picker</h2>
          <div class="section__desc">Figma: node 15032-12265</div>
          <div class="row wrap" style="gap: 24px;">
            <fvdr-timepicker label="Start time" style="width: 180px;" />
            <fvdr-timepicker label="End time" style="width: 180px;" />
          </div>
        </section>

        <!-- ── PHONE ── -->
        <section class="section" id="phone">
          <h2 class="section__title">Input / Phone number</h2>
          <div class="section__desc">Figma: node 19635-3445</div>
          <div style="max-width: 300px;">
            <fvdr-phone-input label="Phone number" />
          </div>
        </section>

        <!-- ── TEXT EDITOR ── -->
        <section class="section" id="editor">
          <h2 class="section__title">Text editor</h2>
          <div class="section__desc">Figma: node 15339-6092</div>
          <div style="max-width: 600px;">
            <fvdr-text-editor label="Notes" placeholder="Start typing..." helperText="Supports bold, italic, lists and links" />
          </div>
        </section>

        <!-- ── RADIO ── -->
        <section class="section" id="radio">
          <h2 class="section__title">Radio button</h2>
          <div class="section__desc">Figma: node 15851-7241</div>
          <div class="row wrap" style="gap: 40px;">
            <fvdr-radio [options]="radioOptions" [(value)]="radioValue" layout="vertical" />
            <fvdr-radio [options]="radioOptions" [(value)]="radioValue" layout="horizontal" />
          </div>
        </section>

        <!-- ── TOGGLES ── -->
        <section class="section" id="toggles">
          <h2 class="section__title">Toggles</h2>
          <div class="section__desc">Figma: node 15851-7316</div>
          <div class="col" style="gap: 12px;">
            <fvdr-toggle label="Enable notifications" [(checked)]="toggle1" />
            <fvdr-toggle label="Dark mode" [(checked)]="toggle2" />
            <fvdr-toggle label="Disabled" [checked]="true" [disabled]="true" />
          </div>
        </section>

        <!-- ── CHECKBOXES ── -->
        <section class="section" id="checkboxes">
          <h2 class="section__title">Checkboxes</h2>
          <div class="section__desc">Figma: node 15851-7222</div>
          <div class="col" style="gap: 12px;">
            <fvdr-checkbox label="Unchecked" />
            <fvdr-checkbox label="Checked" [checked]="true" />
            <fvdr-checkbox label="Indeterminate" [indeterminate]="true" />
            <fvdr-checkbox label="Disabled" [disabled]="true" />
          </div>
        </section>

        <!-- ── SEGMENT ── -->
        <section class="section" id="segment">
          <h2 class="section__title">Segment controls</h2>
          <div class="section__desc">Figma: node 18667-538</div>
          <div class="col" style="gap: 12px;">
            <fvdr-segment [items]="segItems" [(activeId)]="segActive" />
            <fvdr-segment [items]="segItems4" [(activeId)]="segActive4" />
          </div>
        </section>

        <!-- ── CHIPS ── -->
        <section class="section" id="chips">
          <h2 class="section__title">Chips</h2>
          <div class="section__desc">Figma: node 15032-13859</div>
          <div class="row wrap">
            <fvdr-chip label="Default" />
            <fvdr-chip label="Primary" variant="primary" />
            <fvdr-chip label="Success" variant="success" />
            <fvdr-chip label="Warning" variant="warning" />
            <fvdr-chip label="Error" variant="error" />
          </div>
          <div class="row wrap">
            <fvdr-chip label="Removable" [removable]="true" />
            <fvdr-chip label="Selected" [selected]="true" />
            <fvdr-chip label="Clickable" [clickable]="true" icon="edit" />
          </div>
        </section>

        <!-- ── DROPDOWN ── -->
        <section class="section" id="dropdown">
          <h2 class="section__title">Dropdown control</h2>
          <div class="section__desc">Figma: node 15032-13756</div>
          <div class="col" style="max-width: 300px; gap: 12px;">
            <fvdr-dropdown label="Single select" [options]="dropOpts" placeholder="Select option..." />
            <fvdr-dropdown label="Searchable" [options]="dropOpts" [searchable]="true" placeholder="Search & select..." />
            <fvdr-dropdown label="Multi select" [options]="dropOpts" [multi]="true" placeholder="Select multiple..." />
          </div>
        </section>

        <!-- ── DROPLIST ── -->
        <section class="section" id="droplist">
          <h2 class="section__title">Droplist</h2>
          <div class="section__desc">Figma: node 15032-13916 / 18501-1954</div>
          <fvdr-droplist [items]="droplistItems" activeId="edit" />
        </section>

        <!-- ── STATUSES ── -->
        <section class="section" id="statuses">
          <h2 class="section__title">Statuses</h2>
          <div class="section__desc">Figma: node 30725-10146</div>
          <div class="row wrap">
            <fvdr-status variant="active" />
            <fvdr-status variant="inactive" />
            <fvdr-status variant="pending" />
            <fvdr-status variant="in-progress" />
            <fvdr-status variant="done" />
            <fvdr-status variant="error" />
            <fvdr-status variant="cancelled" />
            <fvdr-status variant="new" />
          </div>
        </section>

        <!-- ── COUNTERS ── -->
        <section class="section" id="counters">
          <h2 class="section__title">Counters</h2>
          <div class="section__desc">Figma: node 35020-79605</div>
          <div class="row wrap">
            <fvdr-counter [value]="3" variant="default" size="s" />
            <fvdr-counter [value]="12" variant="primary" size="s" />
            <fvdr-counter [value]="99" variant="error" size="s" />
            <fvdr-counter [value]="150" variant="warning" size="s" />
            <fvdr-counter [value]="7" variant="default" size="m" />
            <fvdr-counter [value]="42" variant="primary" size="m" />
          </div>
        </section>

        <!-- ── BADGE ── -->
        <section class="section" id="badge">
          <h2 class="section__title">Badges</h2>
          <div class="row wrap">
            <fvdr-badge variant="success" label="Success" />
            <fvdr-badge variant="error" label="Error" />
            <fvdr-badge variant="warning" label="Warning" />
            <fvdr-badge variant="info" label="Info" />
            <fvdr-badge variant="neutral" label="Neutral" />
            <fvdr-badge variant="primary" label="Primary" />
          </div>
        </section>

        <!-- ── INLINE MESSAGES ── -->
        <section class="section" id="inline-messages">
          <h2 class="section__title">Inline messages</h2>
          <div class="section__desc">Figma: node 16160-9495</div>
          <div class="col" style="gap: 8px;">
            <fvdr-inline-message variant="info" text="Changes will apply on next login" />
            <fvdr-inline-message variant="success" text="Your settings have been saved" />
            <fvdr-inline-message variant="warning" text="This action cannot be undone" />
            <fvdr-inline-message variant="error" text="This field is required" />
          </div>
        </section>

        <!-- ── INFO BANNER ── -->
        <section class="section" id="info-banner">
          <h2 class="section__title">Info Banner</h2>
          <div class="col" style="max-width: 500px; gap: 12px;">
            <fvdr-info-banner variant="info" title="Information" message="Your account will be reviewed within 24 hours." />
            <fvdr-info-banner variant="success" title="Success!" message="Your changes have been saved successfully." />
            <fvdr-info-banner variant="warning" title="Warning" message="You have unsaved changes. Please save before leaving." />
            <fvdr-info-banner variant="error" title="Error" message="Something went wrong. Please try again later." />
          </div>
        </section>

        <!-- ── TOASTS ── -->
        <section class="section" id="toasts">
          <h2 class="section__title">Toasts</h2>
          <div class="section__desc">Figma: node 15032-16725</div>
          <div class="row wrap">
            <fvdr-btn label="Success toast" variant="primary" size="s" (clicked)="showToast('success')" />
            <fvdr-btn label="Error toast" variant="danger" size="s" (clicked)="showToast('error')" />
            <fvdr-btn label="Warning toast" variant="ghost" size="s" (clicked)="showToast('warning')" />
            <fvdr-btn label="Info toast" variant="secondary" size="s" (clicked)="showToast('info')" />
          </div>
          <div style="margin-top: 12px; max-width: 400px;">
            <fvdr-toast variant="success" title="Saved!" message="Your changes have been saved successfully." [duration]="0" />
          </div>
        </section>

        <!-- ── MODALS ── -->
        <section class="section" id="modals">
          <h2 class="section__title">Modals</h2>
          <div class="section__desc">Figma: node 15032-15799</div>
          <div class="row wrap">
            <fvdr-btn label="Open Modal" variant="primary" size="s" (clicked)="modalVisible = true" />
            <fvdr-btn label="Open Bottom Sheet" variant="secondary" size="s" (clicked)="sheetVisible = true" />
          </div>
          <fvdr-modal
            [visible]="modalVisible"
            title="Confirm action"
            content="Are you sure you want to proceed? This action cannot be undone."
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            (closed)="modalVisible = false"
          />
          <fvdr-bottom-sheet
            [visible]="sheetVisible"
            title="Options"
            confirmLabel="Apply"
            cancelLabel="Cancel"
            (closed)="sheetVisible = false"
          >
            <p style="color: var(--color-text-secondary); font-size: 14px; margin: 0;">Select an option from below to apply changes to your account settings.</p>
          </fvdr-bottom-sheet>
        </section>

        <!-- ── TABLE ── -->
        <section class="section" id="table">
          <h2 class="section__title">Tables</h2>
          <div class="section__desc">Figma: node 15032-15291</div>
          <fvdr-table
            [columns]="tableCols"
            [data]="tableData"
            [selectable]="true"
            [sortState]="tableSort"
            (sortChange)="tableSort = $event"
          />
        </section>

        <!-- ── TREE VIEW ── -->
        <section class="section" id="tree">
          <h2 class="section__title">Tree view</h2>
          <div class="section__desc">Figma: node 19202-13644</div>
          <div style="max-width: 280px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); padding: 8px;">
            <fvdr-tree [nodes]="treeNodes" />
          </div>
        </section>

        <!-- ── DROP AREA ── -->
        <section class="section" id="drop-area">
          <h2 class="section__title">Drag & Drop Area</h2>
          <div class="section__desc">Figma: node 35319-17829</div>
          <div style="max-width: 400px;">
            <fvdr-drop-area
              title="Drag & drop files here"
              subtitle="or click to browse"
              accept=".pdf, .doc, .docx"
              [multiple]="true"
              (filesDropped)="onFilesDropped($event)"
            />
          </div>
        </section>

        <!-- ── SPECIAL CONTROLS ── -->
        <section class="section" id="special-controls">
          <h2 class="section__title">Special controls</h2>
          <div class="section__desc">Figma: node 15032-7631</div>
          <div class="col" style="max-width: 320px; gap: 20px;">
            <fvdr-number-stepper label="Quantity" [min]="0" [max]="100" [(ngModel)]="stepperValue" />
            <fvdr-range label="Volume" [showValue]="true" [(ngModel)]="rangeValue" />
            <fvdr-progress label="Upload progress" [value]="65" [showValue]="true" />
            <fvdr-progress label="Warning" [value]="85" variant="warning" [showValue]="true" />
            <fvdr-progress label="Error" [value]="100" variant="error" [showValue]="true" />
          </div>
        </section>

        <!-- ── AVATAR ── -->
        <section class="section" id="avatar">
          <h2 class="section__title">Avatar</h2>
          <div class="row wrap">
            <fvdr-avatar initials="JD" size="sm" />
            <fvdr-avatar initials="AB" size="md" />
            <fvdr-avatar initials="BS" size="lg" />
            <fvdr-avatar initials="CX" size="xl" />
            <fvdr-avatar initials="AK" size="md" color="#358CEB" />
          </div>
        </section>

        <!-- ── TABS ── -->
        <section class="section" id="tabs">
          <h2 class="section__title">Tabs</h2>
          <fvdr-tabs [tabs]="tabItems" [activeId]="activeTab" (tabChange)="activeTab = $event" />
        </section>

        <!-- ── CARDS ── -->
        <section class="section" id="cards">
          <h2 class="section__title">Cards</h2>
          <div class="row wrap" style="gap: 12px;">
            <fvdr-card title="Default card" style="width: 220px;">
              <p style="font-size: 14px; color: var(--color-text-secondary); margin: 0;">Card content goes here.</p>
            </fvdr-card>
            <fvdr-card title="Active card" state="active" style="width: 220px;">
              <p style="font-size: 14px; color: var(--color-text-secondary); margin: 0;">Active state with green border.</p>
            </fvdr-card>
            <fvdr-card title="Hoverable" [hoverable]="true" style="width: 220px;">
              <p style="font-size: 14px; color: var(--color-text-secondary); margin: 0;">Hover to see shadow effect.</p>
            </fvdr-card>
          </div>
        </section>

        <!-- ── HEADER ── -->
        <section class="section" id="header">
          <h2 class="section__title">Desktop Header</h2>
          <div class="section__desc">Figma: node 16471-25871</div>
          <div style="border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden;">
            <fvdr-header
              appName="FVDR"
              [navItems]="headerNav"
              activeNavId="overview"
              [actions]="headerActions"
              userName="John Doe"
            />
          </div>

          <h2 class="section__title" style="margin-top: 24px;">Mobile Header</h2>
          <div class="section__desc">Figma: node 16411-25469</div>
          <div style="border: 1px solid var(--color-divider); border-radius: var(--radius-md); overflow: hidden; max-width: 390px;">
            <fvdr-mobile-header title="Dashboard" [showBack]="false" [actions]="mobileActions" userName="JD" />
          </div>
        </section>

        <!-- ── ICONS ── -->
        <section class="section" id="icons">
          <h2 class="section__title">Icons (51)</h2>
          <div class="section__desc">Figma: node 15846-7469</div>
          <div class="icons-grid">
            <div *ngFor="let icon of iconNames" class="icon-item">
              <fvdr-icon [name]="icon" style="font-size: 20px;" />
              <span>{{ icon }}</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .showcase {
      display: flex;
      min-height: 100vh;
      background: var(--color-stone-100);
    }

    /* ── Sidebar ── */
    .showcase__nav {
      position: sticky;
      top: 0;
      width: 200px;
      min-width: 200px;
      height: 100vh;
      overflow-y: auto;
      background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      padding: var(--space-4) 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .showcase__nav-logo {
      padding: var(--space-2) var(--space-4) var(--space-3);
      font-size: var(--text-label-s-size);
      font-weight: var(--text-label-s-weight);
      color: var(--color-primary-500);
      border-bottom: 1px solid var(--color-divider);
      margin-bottom: var(--space-2);
    }
    .showcase__nav-link {
      display: block;
      padding: 6px var(--space-4);
      font-size: 13px;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: 0;
      transition: background 0.1s, color 0.1s;
    }
    .showcase__nav-link:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }

    /* ── Main ── */
    .showcase__main {
      flex: 1;
      padding: var(--space-6) var(--space-8);
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* ── Hero ── */
    .showcase__hero {
      padding: var(--space-8);
      background: var(--color-stone-0);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-divider);
    }
    .showcase__h1 {
      font-size: var(--text-h2-size);
      font-weight: var(--text-h2-weight);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2);
    }
    .showcase__subtitle {
      font-size: var(--text-body3-size);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-4);
    }
    .showcase__subtitle a { color: var(--color-primary-500); }
    .showcase__stats { display: flex; gap: var(--space-6); }
    .showcase__stat { font-size: var(--text-base-s-size); color: var(--color-text-secondary); }
    .showcase__stat b { color: var(--color-text-primary); }

    /* ── Section ── */
    .section {
      background: var(--color-stone-0);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .section__title {
      font-size: var(--text-sub2-size);
      font-weight: var(--text-sub2-weight);
      color: var(--color-text-primary);
      margin: 0;
    }
    .section__desc {
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      margin-top: -12px;
    }

    /* ── Layout helpers ── */
    .row { display: flex; align-items: center; gap: var(--space-3); }
    .wrap { flex-wrap: wrap; }
    .col { display: flex; flex-direction: column; }

    /* ── Icons grid ── */
    .icons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--space-2);
    }
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-caption1-size);
      color: var(--color-text-secondary);
      text-align: center;
      border: 1px solid var(--color-divider);
    }
    .icon-item:hover { background: var(--color-hover-bg); }
  `],
})
export class DsShowcaseComponent {
  private toastSvc = inject(ToastService);

  sections = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Input / Text field' },
    { id: 'textarea', label: 'Input / Textarea' },
    { id: 'search', label: 'Input / Search' },
    { id: 'datepicker', label: 'Input / Calendar' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'timepicker', label: 'Time picker' },
    { id: 'phone', label: 'Phone number' },
    { id: 'editor', label: 'Text editor' },
    { id: 'radio', label: 'Radio button' },
    { id: 'toggles', label: 'Toggles' },
    { id: 'checkboxes', label: 'Checkboxes' },
    { id: 'segment', label: 'Segment controls' },
    { id: 'chips', label: 'Chips' },
    { id: 'dropdown', label: 'Dropdown' },
    { id: 'droplist', label: 'Droplist' },
    { id: 'statuses', label: 'Statuses' },
    { id: 'counters', label: 'Counters' },
    { id: 'badge', label: 'Badges' },
    { id: 'inline-messages', label: 'Inline messages' },
    { id: 'info-banner', label: 'Info Banner' },
    { id: 'toasts', label: 'Toasts' },
    { id: 'modals', label: 'Modals' },
    { id: 'table', label: 'Tables' },
    { id: 'tree', label: 'Tree view' },
    { id: 'drop-area', label: 'Drag & Drop' },
    { id: 'special-controls', label: 'Special controls' },
    { id: 'avatar', label: 'Avatar' },
    { id: 'tabs', label: 'Tabs' },
    { id: 'cards', label: 'Cards' },
    { id: 'header', label: 'Headers' },
    { id: 'icons', label: 'Icons' },
  ];

  // Inputs
  selectedDate?: Date;
  calDate?: Date;
  rangeStart?: Date;
  rangeEnd?: Date;

  // Radio
  radioOptions: RadioOption[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C', disabled: true },
  ];
  radioValue = 'a';

  // Toggle
  toggle1 = true;
  toggle2 = false;

  // Search filters
  searchFilters: SearchFilter[] = [
    { id: 'active', label: 'Active', active: true },
    { id: 'pending', label: 'Pending' },
    { id: 'draft', label: 'Draft' },
  ];
  toggleFilter(f: SearchFilter): void { f.active = !f.active; }

  // Segment
  segItems: SegmentItem[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'archived', label: 'Archived' },
  ];
  segActive = 'all';
  segItems4: SegmentItem[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];
  segActive4 = 'week';

  // Dropdown
  dropOpts: DropdownOption[] = [
    { value: 'ua', label: 'Ukraine' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ];

  // Droplist
  droplistItems: DroplistItem[] = [
    { id: 'edit',   label: 'Edit',   icon: 'edit' },
    { id: 'copy',   label: 'Copy',   icon: 'link', rightText: '⌘C' },
    { id: 'share',  label: 'Share',  icon: 'share', dividerAfter: true },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' },
  ];

  // Tabs
  tabItems: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members',  label: 'Members', counter: 12 },
    { id: 'settings', label: 'Settings' },
    { id: 'disabled', label: 'Archived', disabled: true },
  ];
  activeTab = 'overview';

  // Table
  tableCols: TableColumn[] = [
    { key: 'name',   label: 'Name',   sortable: true },
    { key: 'role',   label: 'Role',   sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'date',   label: 'Date',   sortable: true, align: 'right' },
  ];
  tableData = [
    { name: 'Alice Johnson', role: 'Admin',   status: 'Active',   date: '2026-01-15' },
    { name: 'Bob Smith',     role: 'Editor',  status: 'Pending',  date: '2026-02-01' },
    { name: 'Carol White',   role: 'Viewer',  status: 'Inactive', date: '2026-03-10' },
    { name: 'Dan Brown',     role: 'Editor',  status: 'Active',   date: '2026-03-12' },
    { name: 'Eva Green',     role: 'Admin',   status: 'Active',   date: '2026-03-14' },
  ];
  tableSort: import('../../shared/ds').SortState = { key: 'name', direction: 'asc' };

  // Tree
  treeNodes: TreeNode[] = [
    {
      id: 'docs', label: 'Documents', icon: 'folder',
      children: [
        { id: 'contracts', label: 'Contracts', icon: 'folder',
          children: [
            { id: 'c1', label: 'Contract_2026.pdf' },
            { id: 'c2', label: 'NDA_signed.pdf' },
          ]
        },
        { id: 'reports', label: 'Reports', icon: 'folder',
          children: [
            { id: 'r1', label: 'Q1_report.xlsx' },
          ]
        },
      ]
    },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'billing',  label: 'Billing',  icon: 'billing' },
  ];

  // Header
  headerNav: HeaderNavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'projects', label: 'Projects', icon: 'folder' },
    { id: 'reports',  label: 'Reports',  icon: 'reports' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  headerActions: HeaderAction[] = [
    { id: 'bell',   icon: 'bell',   badge: 3 },
    { id: 'search', icon: 'search' },
  ];
  mobileActions: HeaderAction[] = [
    { id: 'bell', icon: 'bell', badge: 5 },
    { id: 'more', icon: 'more' },
  ];

  // Special controls
  stepperValue = 5;
  rangeValue = 40;

  // Modal
  modalVisible = false;
  sheetVisible = false;

  // Toasts
  showToast(variant: 'success' | 'error' | 'warning' | 'info'): void {
    const messages = {
      success: { title: 'Saved!', message: 'Your changes have been saved successfully.' },
      error:   { title: 'Error', message: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning', message: 'This action may have unintended consequences.' },
      info:    { title: 'Info', message: 'Your session will expire in 5 minutes.' },
    };
    this.toastSvc.show({ variant, ...messages[variant] });
  }

  onFilesDropped(files: File[]): void {
    this.toastSvc.show({ variant: 'success', title: 'Files received', message: `${files.length} file(s) ready to upload.` });
  }

  iconNames: import('../../shared/ds').FvdrIconName[] = [
    'angle-double-left','angle-double-right','api','attention','bell','billing',
    'cancel','check','chevron-down','chevron-left','chevron-right','chevron-up',
    'close','download','drag','edit','error','filter','finished','folder',
    'info','link','lock-close','lock-open','minus','more','move',
    'nav-api','nav-api-active','nav-billing','nav-billing-active',
    'nav-overview','nav-overview-active','nav-participants','nav-participants-active',
    'nav-projects','nav-projects-active','nav-reports','nav-reports-active',
    'nav-settings','nav-settings-active',
    'overview','participants','plus','reports','search','settings',
    'share','sort','spinner','storage','theme-dark','theme-light','trash','upload',
  ];
}
