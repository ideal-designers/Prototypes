import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbItem, DS_COMPONENTS, HeaderAction, RadioOption, SidebarNavItem, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { ProtoGroup, VdrProtoSwitcherComponent } from '../_shared/proto-switcher.component';
import { BrStore, ExistingMarksMode } from './br-store.service';
import { BrRedactionPageComponent } from './br-redaction-page.component';
import { BrDocumentsPageComponent } from './br-documents-page.component';
import { BrViewerComponent } from './br-viewer.component';
import { StartRequest, ViewRequest } from './br-types';
import { BrPdfService } from './br-pdf.service';

type Concept = 'c1' | 'c2';

/**
 * Bulk redaction — one prototype, two concepts for *where* a redaction batch is managed:
 *   Concept 1 · a dedicated Redaction section (Documents → Redaction) — Figma node 16500:33397
 *   Concept 2 · the standard Documents list with a Redaction column — Figma node 20555:93107
 * Everything that is the same in both (rules editor, templates, detection, statuses, viewer)
 * is one shared implementation fed by one shared store.
 */
@Component({
  selector: 'fvdr-bulk-redaction',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ...DS_COMPONENTS, VdrProtoSwitcherComponent,
    BrRedactionPageComponent, BrDocumentsPageComponent, BrViewerComponent,
  ],
  providers: [BrStore],
  template: `
    <div class="page">
      <fvdr-sidebar-nav variant="vdr" accountName="Project Alpha" accountMark="PA" [items]="navItems"
                        [(collapsed)]="sidebarCollapsed" (itemClick)="onNav($event)"
                        (subItemClick)="onSub($event.subItem.id)"></fvdr-sidebar-nav>

      <div class="main">
        <fvdr-header [breadcrumbs]="crumbs" [actions]="headerActions" userName="TN" (breadcrumbClick)="onCrumb($event)"></fvdr-header>

        <ng-container *ngFor="let e of [epoch]">
          <fvdr-br-redaction-page #c1 *ngIf="concept === 'c1'" (crumbsChange)="crumbs = $event"
                                  (startRequest)="onStart($event)" (viewRequest)="onView($event)"></fvdr-br-redaction-page>
          <fvdr-br-documents-page #c2 *ngIf="concept === 'c2'" (crumbsChange)="crumbs = $event"
                                  (startRequest)="onStart($event)" (viewRequest)="onView($event)"></fvdr-br-documents-page>
        </ng-container>
      </div>

      <!-- Full-screen viewer, shared by both concepts -->
      <fvdr-br-viewer *ngIf="viewer" [ids]="viewer.ids" [index]="viewer.index" concept="c2"
                      (indexChange)="viewer.index = $event" (closed)="viewer = null"
                      (openFolder)="onOpenFolder($event)"></fvdr-br-viewer>

      <!-- Same decision in both concepts: what to do with files that already have marks -->
      <fvdr-modal [visible]="!!pending" title="Redaction marks found" size="s" confirmLabel="Continue" cancelLabel="Cancel"
                  (confirmed)="confirmExisting()" (cancelled)="cancelExisting()" (closed)="cancelExisting()">
        <p class="ex__txt">Some of the selected files already have redaction marks. Choose how you want to proceed:</p>
        <fvdr-radio [options]="existingOptions" [value]="existingMode" (valueChange)="existingMode = $any($event)"></fvdr-radio>
      </fvdr-modal>

      <fvdr-vdr-proto-switcher [groups]="groups" (changed)="onOption($event)" (restart)="restart()"></fvdr-vdr-proto-switcher>
      <fvdr-toast-host></fvdr-toast-host>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family);
      font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .page { display: flex; height: 100%; background: var(--color-stone-0); }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .ex__txt { margin: 0 0 var(--space-4); }
    /* sidebar: sub-items sit 16px under their section (the DS list gap leaves 24px) and the active one is black, not green */
    :host ::ng-deep .nav-subitems { margin-top: -8px; }
    :host ::ng-deep .nav-subitem--active { color: var(--color-text-primary); }
    /* every modal in this prototype is 512px wide */
    :host ::ng-deep .modal__title { font-size: var(--font-size-lg) !important; font-weight: var(--font-weight-semi) !important; }
    :host ::ng-deep .modal { width: 512px !important; max-width: calc(100vw - var(--space-8)); }
    /* the wizard / progress bars live at the bottom, so the prototype switcher goes to the top */
    fvdr-vdr-proto-switcher { top: var(--space-3); bottom: auto; }
  `],
})
export class BulkRedactionComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);
  private store = inject(BrStore);
  private pdf = inject(BrPdfService);

  @ViewChild('c1') c1?: BrRedactionPageComponent;
  @ViewChild('c2') c2?: BrDocumentsPageComponent;

  concept: Concept = 'c1';
  templates: 'saved' | 'none' = 'saved';
  epoch = 0;
  sidebarCollapsed = false;
  crumbs: BreadcrumbItem[] = [{ id: 'documents', label: 'Documents' }, { id: 'redaction', label: 'Redaction' }];
  viewer: ViewRequest | null = null;
  pending: StartRequest | null = null;
  existingMode: ExistingMarksMode = 'merge';

  readonly headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark', label: 'Dark mode' },
    { id: 'help', icon: 'help', label: 'Help' },
  ];
  readonly existingOptions: RadioOption[] = [
    { value: 'merge', label: 'Merge with existing marks' },
    { value: 'keep', label: 'Keep existing marks only' },
    { value: 'replace', label: 'Replace with new detection results' },
  ];

  navItems: SidebarNavItem[] = [];

  get groups(): ProtoGroup[] {
    return [
      { id: 'concept', label: 'Concept', value: this.concept, options: [
        { id: 'c1', label: '1 · Redaction section' }, { id: 'c2', label: '2 · Documents list' } ] },
      { id: 'templates', label: 'Templates', value: this.templates, options: [
        { id: 'saved', label: '3 saved' }, { id: 'none', label: 'None' } ] },
    ];
  }

  ngOnInit(): void {
    this.tracker.trackPageView('bulk-redaction');
    this.pdf.items(); // warm the mock document so detection and the viewer feel instant
    this.store.reset(true);
    this.buildNav();
  }
  ngOnDestroy(): void { this.tracker.destroyListeners(); }

  // ── Prototype controls ───────────────────────────────────────────────────
  onOption(e: { group: string; value: string }): void {
    if (e.group === 'concept') { this.concept = e.value as Concept; this.viewer = null; this.buildNav(); }
    if (e.group === 'templates') { this.templates = e.value as 'saved' | 'none'; this.restart(); }
  }
  restart(): void {
    this.store.reset(this.templates === 'saved');
    this.viewer = null;
    this.pending = null;
    this.epoch++;
  }

  // ── Shell ────────────────────────────────────────────────────────────────
  private buildNav(): void {
    const docSubs = this.concept === 'c1'
      ? [{ id: 'all', label: 'All' }, { id: 'external', label: 'External links' }, { id: 'signatures', label: 'Signatures' },
         { id: 'redaction', label: 'Redaction', active: true }, { id: 'recycle', label: 'Recycle bin' }]
      : [{ id: 'all', label: 'All', active: true }, { id: 'notes', label: 'Notes' }, { id: 'external', label: 'External links' },
         { id: 'signatures', label: 'Signatures' }];
    this.navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'nav-overview', iconActive: 'nav-overview-active' },
      { id: 'documents', label: 'Documents', icon: 'documents', iconActive: 'documents-active', active: true, open: true, children: docSubs },
      { id: 'checklist', label: 'Due diligence checklist', icon: 'nav-checklist', iconActive: 'nav-checklist' },
      { id: 'participants', label: 'Participants', icon: 'users-groups', iconActive: 'users-groups-active' },
      { id: 'permissions', label: 'Permissions', icon: 'nav-permissions', iconActive: 'nav-permissions-active' },
      { id: 'qna', label: 'Q&A', icon: 'nav-qa', iconActive: 'nav-qa-active' },
      { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
      { id: 'settings', label: 'Settings', icon: 'nav-settings', iconActive: 'nav-settings-active' },
      { id: 'archiving', label: 'Project archiving', icon: 'nav-archiving', iconActive: 'nav-archiving-active' },
    ];
  }
  onNav(_: SidebarNavItem): void { /* only Documents is wired up in this prototype */ }
  onSub(id: string): void {
    if (this.concept === 'c1' && id === 'redaction') this.c1?.backToList();
  }
  onCrumb(id: string): void {
    if (this.concept === 'c1' && id === 'redaction') this.c1?.backToList();
  }

  // ── Shared flows ─────────────────────────────────────────────────────────
  onView(r: ViewRequest): void { this.viewer = r; }
  /** Folder clicked in the viewer: leave the viewer and show that folder in the active concept. */
  onOpenFolder(id: string): void {
    this.viewer = null;
    setTimeout(() => (this.concept === 'c2' ? this.c2?.go(id || null) : this.c1?.reveal(id)));
  }

  /** PRD #1: detection starts immediately — only question is what to do with files that already have marks. */
  onStart(req: StartRequest): void {
    if (this.store.files(req.nodes).some(f => this.store.hasMarks(f))) {
      this.existingMode = 'merge';
      req.closeUi?.();          // never a modal over a modal: close the Redact modal first, then ask
      this.pending = req;
      return;
    }
    this.run(req, 'replace');
  }
  cancelExisting(): void {
    const req = this.pending;
    this.pending = null;
    req?.reopen?.();
  }
  confirmExisting(): void {
    const req = this.pending;
    this.pending = null;
    if (req) this.run(req, this.existingMode);
  }
  private run(req: StartRequest, mode: ExistingMarksMode): void {
    this.store.startDetection(req.nodes, req.rules, mode);
    if (req.toast) this.toast.show({ variant: 'success', message: 'Detection started', duration: 4000 });
    req.done();
    this.tracker.trackTask('bulk-redaction', 'task_complete');
  }
}
