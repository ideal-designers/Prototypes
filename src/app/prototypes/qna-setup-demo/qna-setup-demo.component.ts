import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { QnaUsersStepComponent } from './qna-users-step.component';
import type { SidebarNavItem, HeaderAction, TabItem, SegmentItem, DropdownOption, RadioOption } from '../../shared/ds';
import type { FvdrIconName } from '../../shared/ds/icons/icons';

/* ──────────────────────────────────────────────────────────────────────────
   Q&A Setup — demo
   Standard flow (submitter → coordinator → expert) with roles that can be
   added or removed, and optional separate workflows for Finance, Legal, Tax.
   ──
   Q&A Setup — Advanced flow canvas
   One screen instead of "Workflow → Users": build the flow as nodes (n8n-like),
   add standard or custom roles, drop people & question teams right onto nodes.
   ────────────────────────────────────────────────────────────────────────── */

type Side = 'question' | 'answer';
type Port = 'l' | 'r' | 't' | 'b';
type EdgeKind = 'main' | 'return' | 'reject';
type TemplateId = 'experts';

export interface Person { id: string; name: string; initials: string; email: string; group: string; tone: number; /** invited by email, not a project participant yet */ external?: boolean; }
export interface Membership { personId: string; categories: string[]; /** question side: which question team this person acts for */ teamId?: string; }
export interface QuestionTeam { id: string; name: string; }
interface RoleDef {
  key: string; name: string; side: Side; icon: FvdrIconName; description: string;
  perms: Record<string, boolean>; custom?: boolean;
}
export interface FlowNode {
  id: string; roleKey: string; name: string; side: Side; icon: FvdrIconName;
  x: number; y: number; members: Membership[]; perms: Record<string, boolean>;
  custom: boolean; assignMode: 'manual' | 'auto';
  /** approver by category: which categories this approver signs off */
  approveCategories?: string[];
  /** avatar colour; falls back to the side/custom default */
  color?: AvatarColor;
}
interface FlowEdge { id: string; from: string; to: string; fs: Port; ts: Port; label: string; kind: EdgeKind; /** label before an approver switched to routing by category */ manualLabel?: string; /** ports follow geometry (edges added by the user) */ auto?: boolean; }
interface PermDef { key: string; label: string; hint: string; }
interface LinkOpt { label: string; apply: () => void; }
type AvatarColor = 'green' | 'teal' | 'blue' | 'orange' | 'red' | 'grey' | 'dark';
const AVATAR_COLORS: { id: AvatarColor; label: string; bg: string; fg: string }[] = [
  { id: 'green',  label: 'Green',  bg: 'var(--color-primary-50)',    fg: 'var(--color-primary-600)' },
  { id: 'teal',   label: 'Teal',   bg: 'var(--color-malachite-100)', fg: 'var(--color-primary-800)' },
  { id: 'blue',   label: 'Blue',   bg: 'var(--color-info-50)',       fg: 'var(--color-info-500)' },
  { id: 'orange', label: 'Orange', bg: 'var(--color-warning-50)',    fg: 'var(--color-warning-700)' },
  { id: 'red',    label: 'Red',    bg: 'var(--color-error-50)',      fg: 'var(--color-error-600)' },
  { id: 'grey',   label: 'Grey',   bg: 'var(--color-stone-200)',     fg: 'var(--color-stone-700)' },
  { id: 'dark',   label: 'Dark',   bg: 'var(--color-stone-900)',     fg: 'var(--color-text-inverse)' },
];
type PendingInsert = { edgeId: string } | { afterNodeId: string; side: Port } | null;

const NODE_W = 272;
const NODE_H = 136;
const COL_W = 390;
const ROW_H = 200;

const Q_PERMS: PermDef[] = [
  { key: 'draftQ',      label: 'Draft questions',                    hint: 'Prepare questions that someone else submits' },
  { key: 'submitQ',     label: 'Submit questions to the answer side', hint: 'Send questions without extra review' },
  { key: 'followUp',    label: 'Ask follow-up questions',            hint: 'Continue a thread after an answer' },
  { key: 'otherTeams',  label: "See other teams' questions",         hint: 'Cross-team visibility on the question side' },
];
/** Answer-side permissions, grouped per role:
 *  fixed — always on for the role, shown for transparency
 *  config — the admin can switch them
 *  open — still being validated with customers */
interface RolePerms { fixed: PermDef[]; config: PermDef[]; open: PermDef[]; }
const AP = {
  seeAll:          { key: 'seeAll',          label: 'See all questions',                       hint: 'Not just ones assigned to them' },
  assign:          { key: 'assign',          label: 'Assign questions to experts',             hint: 'Route incoming questions to experts' },
  draftCoord:      { key: 'draftA',          label: 'Draft and edit answers',                  hint: 'Write an answer or change a proposed one' },
  assignCoord:     { key: 'assignCoord',     label: 'Assign to other coordinators',            hint: 'Hand a question to another coordinator, not only to experts' },
  finalCoord:      { key: 'finalSignoff',    label: 'Final sign-off & answer directly at any step',
                     hint: 'Approved answers come back to coordinators, who send them to the bidder. They can also take a question back at any step to answer or re-assign it.' },
  draftExpert:     { key: 'draftA',          label: 'Draft answers',                           hint: 'Propose answers for review' },
  seeFinal:        { key: 'seeFinal',        label: 'See final answers',                       hint: 'See the answer sent to the question team' },
  reassignExperts: { key: 'reassignExperts', label: 'Reassign to experts',                     hint: 'Allow experts to assign questions to other experts' },
  seeTeam:         { key: 'seeTeam',         label: 'See who asked',                           hint: "Show the question team's name" },
  answerDirect:    { key: 'answerDirect',    label: 'Answer directly to the question side',    hint: 'Skip review and send the answer to the bidder' },
  approve:         { key: 'approve',         label: 'Approve or reject answers, propose own',  hint: 'Sign off, send back, or write a better answer' },
  finalApprover:   { key: 'finalSignoff',    label: 'Answer directly at any step',
                     hint: 'CFO case: re-assign, answer directly and give final sign-off. The final answer goes from this approver to the bidder.' },
  approvalOnly:    { key: 'seeApprovalOnly', label: 'See only questions sent for approval',    hint: "Replaces 'See all questions'" },
  // demo wording
  reviewAnswers:   { key: 'approve',         label: 'Review answers',                          hint: 'Approve or reject answers and send them back for revision' },
  approverSeeAll:  { key: 'seeAll',          label: 'See all questions',                       hint: 'When off, only questions sent for approval' },
  anyStage:        { key: 'anyStage',        label: 'Answer at any stage',                     hint: 'Send a final answer or move a question at any stage' },
  anyStageLastAp:  { key: 'anyStage',        label: 'Answer at any stage',                     hint: 'Send a final answer at any stage. When off, approved answers go back to the coordinator, who sends them' },
  coordSeeAll:     { key: 'seeAll',          label: 'See all questions',                       hint: 'See questions from all question teams' },
  assignExperts:   { key: 'assign',          label: 'Assign to experts',                       hint: 'Send incoming questions to the experts' },
  provideAnswers:  { key: 'draftA',          label: 'Provide answers',                         hint: "Send an answer or edit an expert's draft" },
  provideNoExpert: { key: 'draftA',          label: 'Provide answers',                         hint: 'Send an answer' },
  // question side
  draftQ:          { key: 'draftQ',          label: 'Draft questions',                         hint: 'Prepare questions that someone else submits' },
  draftFollowUp:   { key: 'followUp',        label: 'Draft follow-up questions',               hint: 'Prepare a follow-up after an answer' },
  draftQOwn:       { key: 'draftQ',          label: 'Draft questions',                         hint: 'Prepare questions before sending them' },
  submitQ:         { key: 'submitQ',         label: 'Submit questions to the answer side',     hint: 'Send questions without extra review' },
  draftSubmitQ:    { key: 'submitQ',         label: 'Draft and submit questions',              hint: 'Including follow-ups after an answer' },
  answerFollowUp:  { key: 'followUp',        label: 'Answer follow-up questions',              hint: 'Continue a thread after an answer' },
  // viewer
  viewAllQ:        { key: 'seeAll',          label: 'View all questions',                      hint: 'Every question in the project' },
  viewAllA:        { key: 'seeFinal',        label: 'View all answers',                        hint: 'Read-only — cannot answer, assign, edit or delete anything' },
} satisfies Record<string, PermDef>;
const ROLE_PERMS: Record<string, RolePerms> = {
  coordinator: { fixed: [AP.coordSeeAll, AP.assignExperts, AP.provideAnswers], config: [AP.anyStage], open: [] },
  expert:      { fixed: [AP.draftExpert], config: [AP.seeAll, AP.seeFinal, AP.seeTeam, AP.reassignExperts], open: [] },
  approver:    { fixed: [AP.reviewAnswers], config: [AP.approverSeeAll, AP.anyStageLastAp], open: [] },
  drafter:     { fixed: [AP.draftQ, AP.draftFollowUp], config: [], open: [] },
  submitter:   { fixed: [AP.draftSubmitQ], config: [], open: [] },
  viewer:      { fixed: [AP.viewAllQ, AP.viewAllA], config: [], open: [] },
};
/** roles a workflow holds once — add people to them instead of a second role */
const SINGLE_ROLES = new Set(['submitter', 'drafter', 'coordinator', 'viewer']);
/** roles every flow needs — they can't be removed */
const PROTECTED_ROLES = new Set(['submitter', 'coordinator']);
/** custom answer-side roles can switch anything */
const A_PERMS: PermDef[] = [
  AP.seeAll, AP.assign, AP.assignCoord, AP.draftCoord, AP.approve, AP.finalCoord,
  AP.seeFinal, AP.reassignExperts, AP.seeTeam, AP.answerDirect,
];

const STANDARD_ROLES: RoleDef[] = [
  { key: 'drafter',     name: 'Question drafter',   side: 'question', icon: 'edit',
    description: 'Drafts questions for submitters',
    perms: { draftQ: true, followUp: true } },
  { key: 'submitter',   name: 'Question submitter', side: 'question', icon: 'send',
    description: 'Submits questions to the answer side',
    perms: { draftQ: true, submitQ: true, followUp: true } },
  { key: 'coordinator', name: 'Answer coordinator', side: 'answer',   icon: 'comment',
    description: 'Manages incoming questions and assigns them',
    perms: { seeAll: true, assign: true, draftA: true, assignCoord: false, finalSignoff: false, anyStage: true, seeFinal: true, seeTeam: true } },
  { key: 'expert',      name: 'Expert',             side: 'answer',   icon: 'user-check',
    description: 'Answers questions assigned to them',
    perms: { seeAll: false, assign: false, draftA: true, seeFinal: true, reassignExperts: true, seeTeam: true, answerDirect: false } },
  { key: 'approver',    name: 'Answer approver',    side: 'answer',   icon: 'finished',
    description: 'Approves answers before they are released',
    perms: { seeAll: true, approve: true, draftA: true, finalSignoff: false, anyStage: false, seeFinal: true, seeTeam: true } },
  { key: 'viewer',      name: 'Viewer',             side: 'answer',   icon: 'eye',
    description: 'Views all questions and answers, read-only',
    perms: { seeAll: true, seeFinal: true } },
];

const PEOPLE: Person[] = [
  { id: 'p1',  name: 'Dmytro Siniehin',  initials: 'DS', email: 'dmytro@ideals.com',      group: 'Administrators',    tone: 0 },
  { id: 'p2',  name: 'Anna Kovalenko',   initials: 'AK', email: 'anna@northbridge.com',   group: 'Sell-side advisors', tone: 1 },
  { id: 'p3',  name: 'Mark Chen',        initials: 'MC', email: 'mark@northbridge.com',   group: 'Sell-side advisors', tone: 1 },
  { id: 'p4',  name: 'Olivia Hartman',   initials: 'OH', email: 'olivia.h@target.com',    group: 'Target management', tone: 2 },
  { id: 'p5',  name: 'Daniel Brooks',    initials: 'DB', email: 'daniel.b@target.com',    group: 'Target management', tone: 2 },
  { id: 'p6',  name: 'Sophia Hernandez', initials: 'SH', email: 'sophia@target.com',      group: 'Target experts',    tone: 3 },
  { id: 'p7',  name: 'Kaylee Murphy',    initials: 'KM', email: 'kaylee@target.com',      group: 'Target experts',    tone: 3 },
  { id: 'p8',  name: 'Liam Novak',       initials: 'LN', email: 'liam@target.com',        group: 'Target experts',    tone: 3 },
  { id: 'p9',  name: 'Ethan Ross',       initials: 'ER', email: 'ethan@alphacap.com',     group: 'Bidder A',          tone: 4 },
  { id: 'p10', name: 'Mia Patel',        initials: 'MP', email: 'mia@alphacap.com',       group: 'Bidder A',          tone: 4 },
  { id: 'p11', name: 'Noah Kim',         initials: 'NK', email: 'noah@betapartners.com',  group: 'Bidder B',          tone: 5 },
  { id: 'p12', name: 'Ava Laurent',      initials: 'AL', email: 'ava@betapartners.com',   group: 'Bidder B',          tone: 5 },
  { id: 'p13', name: 'Robert Hale',      initials: 'RH', email: 'robert.hale@target.com', group: 'Target management', tone: 2 },
  { id: 'p14', name: 'Grace Liu',        initials: 'GL', email: 'grace@target.com',       group: 'Target finance',    tone: 0 },
  { id: 'p15', name: 'Nadia Farouk',     initials: 'NF', email: 'nadia@lexlaw.com',       group: 'Legal counsel',     tone: 5 },
];


const TONES = [
  { bg: 'var(--color-stone-300)',   fg: 'var(--color-text-primary)' },
  { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-800)' },
  { bg: 'var(--color-warning-50)',  fg: 'var(--color-warning-700)' },
  { bg: 'var(--color-info-50)',     fg: 'var(--color-info-800)' },
  { bg: 'var(--color-malachite-100)', fg: 'var(--color-primary-900)' },
  { bg: 'var(--color-error-50)',    fg: 'var(--color-error-700)' },
];

@Component({
  selector: 'fvdr-qna-setup-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS, QnaUsersStepComponent],
  template: `
<div class="page-layout">
  <fvdr-sidebar-nav variant="vdr" accountName="Project Nova" [items]="navItems" [(collapsed)]="sidebarCollapsed" />

  <div class="main-area">
    <fvdr-header [breadcrumbs]="breadcrumbs" [actions]="headerActions" userName="DS" />

    <!-- ── Stepper ── -->
    <div class="stepper">
      <button class="step" [class.step--active]="step === 1" [class.step--done]="step > 1" (click)="toStep(1)">
        <span class="step-num"><fvdr-icon *ngIf="step > 1" name="check"></fvdr-icon><ng-container *ngIf="step === 1">1</ng-container></span>
        Workflow &amp; people
      </button>
      <span class="step-sep"></span>
      <button class="step" [class.step--active]="step === 2" [class.step--done]="step > 2" [disabled]="errorNodes.length > 0" (click)="toStep(2)">
        <span class="step-num"><fvdr-icon *ngIf="step > 2" name="check"></fvdr-icon><ng-container *ngIf="step <= 2">2</ng-container></span>
        Users
      </button>
      <span class="step-sep"></span>
      <button class="step" [class.step--active]="step === 3" [disabled]="errorNodes.length > 0" (click)="toStep(3)">
        <span class="step-num">3</span> Preferences
      </button>
    </div>

    <!-- ══════════════ STEP 1 — Canvas ══════════════ -->
    <div class="workspace" *ngIf="step === 1">

      <div class="canvas"
           #canvas
           [class.canvas--panning]="panning"
           [class.canvas--drop]="canvasDropActive"
           [class.canvas--preview]="!editable"
           (mousedown)="onCanvasMouseDown($event)"
           (wheel)="onWheel($event)"
           (dragover)="onCanvasDragOver($event)"
           (dragleave)="canvasDropActive = false"
           (drop)="onCanvasDrop($event)">

        <!-- top toolbar -->
        <div class="canvas-top" (mousedown)="$event.stopPropagation()">
          <!-- one workflow, or several: by category, by question team, or fully separate (e.g. one per deal) -->
          <div class="wf-bar" *ngIf="templateConfirmed">
            <fvdr-toggle size="s" label="Workflow by category" [checked]="multiWf" (checkedChange)="setMultiWf($event)"></fvdr-toggle>
            <ng-container *ngIf="multiWf">
              <div class="wf-tabs" role="tablist" aria-label="Workflows by category">
                <button class="wf-tab" role="tab" [attr.aria-selected]="activeWf === OVERVIEW" [class.wf-tab--on]="activeWf === OVERVIEW"
                        fvdrTooltip="See every workflow on the canvas" (click)="switchWf(OVERVIEW)"><fvdr-icon name="overview"></fvdr-icon>All</button>
                <!-- All categories: the shared workflow; hover lists the categories that follow it -->
                <button class="wf-tab" role="tab" [attr.aria-selected]="activeWf === DEFAULT_WF" [class.wf-tab--on]="activeWf === DEFAULT_WF"
                        [fvdrTooltip]="defaultCatsLabel()" (click)="switchWf(DEFAULT_WF)">
                  All categories<span class="wf-count">{{ defaultCats().length }}</span>
                </button>
                <!-- categories with their own workflow -->
                <button class="wf-tab" role="tab" *ngFor="let t of customCats(); trackBy: trackKey" [attr.aria-selected]="activeWf === t.key" [class.wf-tab--on]="activeWf === t.key"
                        (click)="switchWf(t.key)">
                  <fvdr-icon name="label" class="cat-ic" [ngClass]="'cat-ic--' + t.color"></fvdr-icon>{{ t.label }}
                </button>
                <!-- one popover to pick a category or create a new one -->
                <span class="wf-add-wrap">
                  <button class="wf-tab wf-tab--add" fvdrTooltip="Select or create category" aria-label="Select or create category" [attr.aria-expanded]="addingCat" (click)="toggleCatPop()"><fvdr-icon name="plus"></fvdr-icon></button>
                  <div class="wf-pop" *ngIf="addingCat" role="dialog" aria-label="Select or create category">
                    <span class="field-label">Select or create category</span>
                    <input class="wf-name wf-pop-search" placeholder="Search or type a new name" aria-label="Select or create category" [(ngModel)]="newCategory"
                           (keydown.enter)="pickOrCreate()" (keydown.escape)="closeCatPop()" />
                    <button class="wf-pop-item" *ngFor="let t of filteredDefaultCats(); trackBy: trackKey" (click)="customizeFromBar(t.label)">
                      <fvdr-icon name="label" class="cat-ic" [ngClass]="'cat-ic--' + t.color"></fvdr-icon>{{ t.label }}
                    </button>
                    <button class="wf-pop-item wf-pop-item--new" *ngIf="canCreateCat" (click)="addWfCategory()"><fvdr-icon name="plus"></fvdr-icon>Create “{{ newCategory.trim() }}”</button>
                    <span class="hint wf-pop-item" *ngIf="!filteredDefaultCats().length && !canCreateCat">Type a name to create a category</span>
                  </div>
                </span>
                <!-- rename, delete and add categories in one place -->
                <span class="wf-add-wrap">
                  <button class="wf-tab wf-tab--add" fvdrTooltip="Category settings" aria-label="Category settings" [attr.aria-expanded]="managingCats" (click)="toggleManage()"><fvdr-icon name="settings"></fvdr-icon></button>
                  <div class="wf-pop wf-pop--wide" *ngIf="managingCats" role="dialog" aria-label="Category settings">
                    <span class="field-label">All categories · {{ manageCats(false).length }}</span>
                    <ng-container *ngTemplateOutlet="catRows; context: { list: manageCats(false), own: false }"></ng-container>
                    <span class="wf-mrow">
                      <fvdr-icon name="plus" class="wf-m-add"></fvdr-icon>
                      <input class="cat-input" placeholder="New category" aria-label="New category name" [(ngModel)]="manageNew" (keydown.enter)="addManagedCategory()" />
                      <button class="icon-btn icon-btn--sm" *ngIf="manageNew.trim()" fvdrTooltip="Add" (click)="addManagedCategory()"><fvdr-icon name="check"></fvdr-icon></button>
                    </span>
                    <span class="field-label field-label--gap">Own workflow · {{ manageCats(true).length }}</span>
                    <ng-container *ngTemplateOutlet="catRows; context: { list: manageCats(true), own: true }"></ng-container>
                    <span class="hint" *ngIf="!manageCats(true).length">None yet</span>
                  </div>
                </span>
              </div>
            </ng-container>
          </div>
          <button class="health health--error" *ngIf="templateConfirmed && errorNodes.length" (click)="focusFirstError()">
            <fvdr-icon name="warning"></fvdr-icon>
            <span>{{ errorNodes.length }} {{ errorNodes.length === 1 ? 'role needs' : 'roles need' }} people</span>
          </button>
        </div>

        <div class="world" [style.transform]="'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')'">

          <!-- lanes: question team always on the left -->
          <!-- overview: one labelled frame per workflow -->
          <div class="wf-group" *ngFor="let g of overviewGroups; trackBy: trackKey"
               [style.left.px]="g.x" [style.top.px]="g.y" [style.width.px]="g.w" [style.height.px]="g.h">
            <div class="wf-group-head" [style.font-size.px]="groupHeadPx" (mousedown)="$event.stopPropagation()">
              <fvdr-icon *ngIf="g.color" name="label" class="cat-ic" [ngClass]="'cat-ic--' + g.color"></fvdr-icon>
              <span class="wf-group-name">{{ g.label }}</span>
              <span class="wf-group-sub" *ngIf="zoom >= 0.45">{{ g.sub }}</span>
              <button class="wf-group-open" *ngIf="templateConfirmed" [fvdrTooltip]="'Open ' + g.label" [attr.aria-label]="'Open ' + g.label" (click)="switchWf(g.key)"><fvdr-icon name="edit"></fvdr-icon></button>
            </div>
          </div>
          <ng-container *ngIf="lanes as L">
            <div class="lane-divider" [style.left.px]="L.x" [style.top.px]="L.top" [style.height.px]="L.height"></div>
            <span class="lane-label lane-label--q" [style.left.px]="L.x - 16" [style.top.px]="L.top">Question side</span>
            <span class="lane-label lane-label--a" [style.left.px]="L.x + 16" [style.top.px]="L.top">Answer side</span>
          </ng-container>

          <!-- edges -->
          <svg class="edges" width="8000" height="6000">
            <defs>
              <marker id="qsc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="arrow-main"></path>
              </marker>
              <marker id="qsc-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="arrow-active"></path>
              </marker>
              <marker id="qsc-arrow-reject" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="arrow-reject"></path>
              </marker>
            </defs>
            <g *ngFor="let e of edges; trackBy: trackById">
              <path [attr.d]="edgePath(e)" class="edge-hit"
                    (mouseenter)="hoverEdgeId = e.id" (mouseleave)="hoverEdgeId = null"></path>
              <path [attr.d]="edgePath(e)" class="edge"
                    [class.edge--reject]="e.kind === 'reject'"
                    [class.edge--return]="e.kind === 'return'"
                    [class.edge--hover]="hoverEdgeId === e.id"
                    [class.edge--related]="isEdgeRelated(e)"
                    [attr.marker-end]="e.kind === 'reject' ? 'url(#qsc-arrow-reject)' : (isEdgeActive(e) ? 'url(#qsc-arrow-active)' : 'url(#qsc-arrow)')"></path>
              <!-- dot = where the message leaves the role -->
              <circle *ngIf="edgeStart(e) as p" [attr.cx]="p.x" [attr.cy]="p.y" r="4.5" class="edge-start"
                      [class.edge-start--reject]="e.kind === 'reject'" [class.edge-start--active]="e.kind !== 'reject' && isEdgeActive(e)"></circle>
            </g>
            <path *ngIf="link" [attr.d]="linkPath()" class="edge edge--draft" marker-end="url(#qsc-arrow-active)"></path>
          </svg>

          <!-- edge labels (+ insert / delete on hover) -->
          <div class="edge-label"
               *ngFor="let e of edges; trackBy: trackById"
               [style.left.px]="edgeMid(e).x" [style.top.px]="edgeMid(e).y"
               [class.edge-label--reject]="e.kind === 'reject'"
               [class.edge-label--hover]="hoverEdgeId === e.id"
               (mouseenter)="hoverEdgeId = e.id" (mouseleave)="hoverEdgeId = null"
               (mousedown)="$event.stopPropagation()">
            <span class="edge-text">{{ e.label }}</span>
            <span class="edge-actions">
              <button class="mini-btn" fvdrTooltip="Insert a role here" (click)="startInsertOnEdge(e)"><fvdr-icon name="plus"></fvdr-icon></button>
              <button class="mini-btn" fvdrTooltip="Delete connection" (click)="deleteEdge(e)"><fvdr-icon name="trash"></fvdr-icon></button>
            </span>
          </div>

          <!-- nodes -->
          <div class="node"
               *ngFor="let n of nodes; trackBy: trackById"
               [style.left.px]="n.x" [style.top.px]="n.y"
               [class.node--selected]="selectedId === n.id"
               [class.node--error]="editable && !n.members.length"
               [class.node--drop]="dropNodeId === n.id"
               [class.node--dragging]="dragNodeId === n.id && dragMoved"
               [class.node--link-target]="link && linkTarget(n)"
               [attr.data-node-id]="n.id"
               (mousedown)="onNodeMouseDown($event, n)"
               (dragover)="onNodeDragOver($event, n)"
               (dragleave)="dropNodeId = null"
               (drop)="onNodeDrop($event, n)">

            <div class="node-head">
              <span class="node-icon" [style.background]="avatar(n).bg" [style.color]="avatar(n).fg">
                <fvdr-icon [name]="n.icon"></fvdr-icon>
              </span>
              <div class="node-titles">
                <span class="node-name">{{ n.name }}</span>
                <span class="node-sub">{{ nodeSubtitle(n) }}</span>
              </div>
              <span class="node-step">{{ stepLabel(n) }}</span>
            </div>

            <!-- members -->
            <div class="node-body">
              <ng-container *ngIf="n.members.length; else emptyDrop">
                <ng-container *ngIf="n.side === 'question'; else answerMembers">
                  <div class="team-chips">
                    <span class="team-chip" *ngFor="let t of teamsOf(n)">
                      {{ t.team.name }} <b>{{ t.members.length }}</b>
                    </span>
                  </div>
                </ng-container>
                <ng-template #answerMembers>
                  <div class="avatars">
                    <span class="av" *ngFor="let m of n.members.slice(0, 5)" [title]="person(m.personId).name"
                          [style.background]="tone(m.personId).bg" [style.color]="tone(m.personId).fg">
                      {{ person(m.personId).initials }}
                      <i class="av-dual" *ngIf="rolesOf(m.personId).length > 1"></i>
                    </span>
                    <span class="av av--more" *ngIf="n.members.length > 5">+{{ n.members.length - 5 }}</span>
                    <span class="members-count">{{ n.members.length }} {{ n.members.length === 1 ? 'person' : 'people' }}</span>
                  </div>
                </ng-template>
                <span class="node-note node-note--power" *ngIf="n.perms['finalSignoff']">
                  <fvdr-icon name="lock-open"></fvdr-icon> Final sign-off · can answer at any step
                </span>
                <span class="node-note" *ngIf="dualCount(n) as d">
                  {{ d }} {{ d === 1 ? 'person also has' : 'people also have' }} another role
                </span>
              </ng-container>
              <ng-template #emptyDrop>
                <div class="drop-empty">Drop people here</div>
              </ng-template>
            </div>

            <button class="node-link" *ngIf="canDrawFrom(n)" fvdrTooltip="Drag to another role to draw an arrow"
                    (mousedown)="startLink($event, n)"><fvdr-icon name="chevron-right"></fvdr-icon></button>
            <button class="node-add" *ngFor="let s of freeSides(n); trackBy: trackSelf" [ngClass]="'node-add--' + s"
                    fvdrTooltip="Add a role here" (mousedown)="$event.stopPropagation()" (click)="startInsertAfter(n, s)">
              <span class="node-add-dot"><fvdr-icon name="plus"></fvdr-icon></span>
            </button>
          </div>
        </div>

        <!-- canvas controls -->
        <div class="canvas-controls" (mousedown)="$event.stopPropagation()">
          <button class="ctl" fvdrTooltip="Zoom in" (click)="zoomBy(0.1)"><fvdr-icon name="plus"></fvdr-icon></button>
          <button class="ctl" fvdrTooltip="Zoom out" (click)="zoomBy(-0.1)"><fvdr-icon name="minus"></fvdr-icon></button>
          <button class="ctl" fvdrTooltip="Fit to screen" (click)="fit()"><fvdr-icon name="expand"></fvdr-icon></button>
          <button class="ctl" fvdrTooltip="Auto-arrange roles" (click)="tidy()"><fvdr-icon name="sparkle"></fvdr-icon></button>
          <span class="zoom-val">{{ (zoom * 100) | number:'1.0-0' }}%</span>
        </div>

        <div class="link-menu" *ngIf="linkMenu as lm" [style.left.px]="lm.x" [style.top.px]="lm.y" (mousedown)="$event.stopPropagation()">
          <span class="link-menu-head">What does this arrow do?</span>
          <button *ngFor="let o of lm.opts" (click)="applyLink(o)">{{ o.label }}</button>
        </div>

        <div class="legend" (mousedown)="$event.stopPropagation()">
          <span><i class="lg lg--main"></i>Question / answer moves</span>
          <span><i class="lg lg--reject"></i>Rejected</span>
          <span *ngIf="editable"><i class="lg-link"><fvdr-icon name="chevron-right"></fvdr-icon></i>Drag from a coordinator or approver to draw an arrow</span>
          <span><i class="lg lg--dual"></i>Person with 2+ roles</span>
        </div>
      </div>

      <!-- ── Right panel ── -->
      <aside class="panel" [style.width.px]="panelW" [class.panel--resizing]="panelResizing">
        <div class="panel-resize" role="separator" aria-orientation="vertical" aria-label="Resize panel" tabindex="0"
             [attr.aria-valuenow]="panelW" fvdrTooltip="Drag to resize" tooltipPosition="left"
             (mousedown)="startPanelResize($event)" (dblclick)="panelW = PANEL_MIN"
             (keydown.arrowleft)="nudgePanel(24)" (keydown.arrowright)="nudgePanel(-24)"></div>

        <!-- Node panel -->
        <ng-container *ngTemplateOutlet="editPanel"></ng-container>

        <ng-template #editPanel>
        <!-- a category or question team that still follows the default workflow -->
        <ng-container *ngIf="activeWf === OVERVIEW">
          <div class="panel-head panel-head--lib">
            <div class="panel-titles">
              <span class="lib-title">All workflows</span>
              <span class="panel-sub">{{ overviewGroups.length }} on the canvas · {{ splitLabel }}</span>
            </div>
          </div>
          <div class="panel-body">
            <p class="hint">Each frame on the canvas is one workflow. Open one to change its roles, people or routing.</p>
            <div class="ov-row" *ngFor="let g of overviewGroups; trackBy: trackKey">
              <span class="role-text">
                <span class="role-name">{{ g.label }}</span>
                <span class="role-desc">{{ g.sub }}</span>
              </span>
              <button class="link-btn" (click)="switchWf(g.key)">Open</button>
            </div>
          </div>
        </ng-container>
        <ng-container *ngIf="activeWf !== OVERVIEW && inherited; else nodeOrLibraryOrNothing">
          <div class="panel-head panel-head--lib">
            <div class="panel-titles">
              <span class="lib-title">{{ wfLabel(activeWf) }}</span>
              <span class="panel-sub">Follows the All categories workflow</span>
            </div>
          </div>
          <div class="panel-body">
            <p class="tp-desc">{{ wfSplit === 'team' ? 'Questions from ' + wfLabel(activeWf) : wfLabel(activeWf) + ' questions' }} go through the All categories workflow shown on the canvas.</p>
            <p class="hint">Customize it to give {{ wfLabel(activeWf) }} its own roles, people and routing — for example skip approval, or add a dedicated expert team. Everything else keeps using the default.</p>
            <span class="field-label field-label--gap">{{ wfSplit === 'team' ? 'Question teams' : 'Categories' }} with their own workflow</span>
            <p class="hint" *ngIf="!customKeys().length">None yet</p>
            <div class="wf-list" *ngFor="let k of customKeys()">
              <button class="link-btn" (click)="switchWf(k)"><fvdr-icon [name]="wfSplit === 'team' ? 'participants' : 'label'"></fvdr-icon>{{ wfLabel(k) }}</button>
            </div>
          </div>
          <div class="panel-foot">
            <fvdr-btn [label]="'Customize for ' + wfLabel(activeWf)" iconName="edit" (clicked)="customizeWf(activeWf)"></fvdr-btn>
          </div>
        </ng-container>
        <ng-template #nodeOrLibraryOrNothing><ng-container *ngIf="activeWf !== OVERVIEW"><ng-container *ngTemplateOutlet="nodeOrLibrary"></ng-container></ng-container></ng-template>
        <ng-template #nodeOrLibrary>
        <ng-container *ngIf="selectedNode as n; else libraryTpl">
          <div class="panel-head">
            <div class="avatar-pick">
              <button class="node-icon node-icon--lg node-icon--btn" fvdrTooltip="Change color" tooltipPosition="bottom"
                      [style.background]="avatar(n).bg" [style.color]="avatar(n).fg"
                      [attr.aria-expanded]="colorOpen" (click)="colorOpen = !colorOpen">
                <fvdr-icon [name]="n.icon"></fvdr-icon>
              </button>
              <div class="color-pop" *ngIf="colorOpen" role="listbox" aria-label="Avatar color">
                <button class="swatch" *ngFor="let c of avatarColors" role="option"
                        [attr.aria-selected]="avatar(n).id === c.id" [class.swatch--on]="avatar(n).id === c.id"
                        [fvdrTooltip]="c.label" [style.background]="c.bg" [style.color]="c.fg"
                        (click)="setColor(n, c.id)">
                  <fvdr-icon [name]="avatar(n).id === c.id ? 'check' : n.icon"></fvdr-icon>
                </button>
              </div>
            </div>
            <div class="panel-titles">
              <input class="name-input" [(ngModel)]="n.name" aria-label="Role name" />
            </div>
            <button class="icon-btn" [fvdrTooltip]="panelW > PANEL_MIN ? 'Collapse panel' : 'Expand panel'" tooltipPosition="bottom" (click)="togglePanelWide()"><fvdr-icon [name]="panelW > PANEL_MIN ? 'angle-double-right' : 'angle-double-left'"></fvdr-icon></button>
            <button class="icon-btn" fvdrTooltip="Close" tooltipPosition="bottom" (click)="selectedId = null"><fvdr-icon name="close"></fvdr-icon></button>
          </div>

          <div class="panel-tabs">
            <fvdr-tabs size="s" [tabs]="nodeTabs(n)" [activeId]="nodeTab" (tabChange)="nodeTab = $event"></fvdr-tabs>
          </div>

          <div class="panel-body">

            <!-- People -->
            <ng-container *ngIf="nodeTab === 'people'">
              <!-- question side: teams first -->
              <div class="people-bar" *ngIf="n.side === 'question'">
                <span class="field-label">Question teams</span>
                <span class="people-info" fvdrTooltip="Each question team sees only its own questions unless See other teams' questions is on. One person can be in several teams." tooltipPosition="bottom"><fvdr-icon name="info"></fvdr-icon></span>
                <fvdr-btn label="New team" variant="secondary" size="s" iconName="plus" (clicked)="newTeam()"></fvdr-btn>
              </div>
              <!-- answer side: one clear way in -->
              <div class="people-bar" *ngIf="n.side === 'answer'">
                <span class="field-label">{{ n.members.length }} {{ n.members.length === 1 ? 'person' : 'people' }}</span>
                <fvdr-btn label="Add people" variant="secondary" size="s" iconName="user-add" (clicked)="openPeopleModal(n)"></fvdr-btn>
              </div>

              <div class="empty-panel" *ngIf="!n.members.length">
                <fvdr-icon name="user-add"></fvdr-icon>
                <span>No one in this role yet. Q&amp;A can't be activated until every role has at least one person.</span>
              </div>

              <ng-container *ngIf="n.side === 'question'">
                <!-- one block per question team: rename, delete, add people straight into the team -->
                <div class="team-block" *ngFor="let t of teams; trackBy: trackById">
                  <div class="team-head">
                    <input class="team-name" [(ngModel)]="t.name" aria-label="Question team name" />
                    <span class="team-count">{{ teamMembers(n, t).length }}</span>
                    <button class="icon-btn icon-btn--sm" fvdrTooltip="Delete team" tooltipPosition="left" (click)="askDeleteTeam(t)"><fvdr-icon name="trash"></fvdr-icon></button>
                  </div>
                  <ng-container *ngFor="let m of teamMembers(n, t)">
                    <ng-container *ngTemplateOutlet="memberRow; context: { n: n, m: m }"></ng-container>
                  </ng-container>
                  <button class="link-btn link-btn--add" (click)="openPeopleModal(n, { teamId: t.id })"><fvdr-icon name="user-add"></fvdr-icon>Add people to {{ t.name }}</button>
                </div>
                <p class="hint" *ngIf="!teams.length">No question teams yet — create one with <b>New team</b>.</p>
              </ng-container>

              <ng-container *ngIf="n.side === 'answer'">
                <div class="assign-mode" *ngIf="n.roleKey === 'expert' && !prevExpert(n)">
                  <span class="field-label">Assignment</span>
                  <fvdr-segment variant="table" size="sm" [items]="assignItems" [activeId]="n.assignMode" (activeIdChange)="setAssignMode(n, $any($event))"></fvdr-segment>
                </div>
                <p class="hint" *ngIf="prevExpert(n) as pe">Gets the draft from {{ pe.name }}. Manual or auto assignment is set on {{ orderedExperts()[0].name }}.</p>
                <!-- approver: any approver signs off, or approvers grouped by category -->
                <ng-container *ngIf="n.roleKey === 'approver'">
                  <div class="assign-mode">
                    <span class="field-label">Who approves</span>
                    <fvdr-segment variant="table" size="sm" [items]="approveModeItems" [activeId]="n.assignMode" (activeIdChange)="setAssignMode(n, $any($event))"></fvdr-segment>
                  </div>
                  <p class="hint">{{ approverAssignHint(n) }}</p>
                </ng-container>
                <!-- Auto-assign: list or category tree (Figma 392:77972) -->
                <ng-container *ngIf="(n.roleKey === 'expert' || n.roleKey === 'approver') && n.assignMode === 'auto'; else plainMembers">
                  <ng-container *ngTemplateOutlet="catAssign; context: { n: n }"></ng-container>
                </ng-container>
                <ng-template #plainMembers>
                  <ng-container *ngFor="let m of n.members">
                    <ng-container *ngTemplateOutlet="memberRow; context: { n: n, m: m }"></ng-container>
                  </ng-container>
                </ng-template>
              </ng-container>
            </ng-container>

            <!-- Permissions -->
            <ng-container *ngIf="nodeTab === 'permissions'">
              <ng-container *ngIf="rolePerms(n) as rp; else flatPerms">
                <!-- approver: where an approved answer goes next -->
                <div class="rt-setting perm-after" *ngIf="n.roleKey === 'approver'">
                  <span class="field-label">After approval, the answer goes</span>
                  <fvdr-radio [options]="afterApproveOptions" [value]="afterApprove" layout="vertical" (valueChange)="setAfterApprove($any($event))"></fvdr-radio>
                </div>
                <!-- every permission in one list; the ones that come with the role are on and locked -->
                <div class="perm" *ngFor="let p of rp.fixed">
                  <div class="perm-text">
                    <span class="perm-label">{{ p.label }}</span>
                    <span class="perm-hint">{{ fixedLimited(n, p) ? 'Limited — only questions sent for approval' : p.hint }}</span>
                  </div>
                  <fvdr-toggle size="s" [checked]="!fixedLimited(n, p)" [disabled]="true" fvdrTooltip="Always on for this role" tooltipPosition="left"></fvdr-toggle>
                </div>
                <ng-container *ngFor="let p of rp.config">
                  <ng-container *ngIf="permShown(n, p)"><ng-container *ngTemplateOutlet="permRow; context: { n: n, p: p }"></ng-container></ng-container>
                </ng-container>
                <ng-container *ngFor="let p of rp.open">
                  <ng-container *ngTemplateOutlet="permRow; context: { n: n, p: p }"></ng-container>
                </ng-container>
                <p class="hint perm-route" *ngIf="routeHint(n) as h"><fvdr-icon name="info"></fvdr-icon>{{ h }}</p>
              </ng-container>
              <ng-template #flatPerms>
                <ng-container *ngFor="let p of permsFor(n)">
                  <ng-container *ngTemplateOutlet="permRow; context: { n: n, p: p }"></ng-container>
                </ng-container>
              </ng-template>
              <button class="link-btn" *ngIf="!n.custom && isCustomized(n)" (click)="resetPerms(n)">Reset to {{ roleDef(n.roleKey)?.name }} defaults</button>
            </ng-container>

            <!-- Routing -->
            <ng-container *ngIf="nodeTab === 'routing'">
              <span class="field-label">How a question travels</span>
              <ol class="rt">
                <li class="rt-step" *ngFor="let st of routePath(); let i = index"
                    [class.rt-step--here]="st.node.id === n.id && !st.end" [class.rt-step--end]="st.end">
                  <span class="rt-num"><fvdr-icon *ngIf="st.end" name="check"></fvdr-icon><ng-container *ngIf="!st.end">{{ i + 1 }}</ng-container></span>
                  <div class="rt-body">
                    <span class="rt-role">{{ st.node.name }}<span class="rt-here" *ngIf="st.node.id === n.id && !st.end">This role</span></span>
                    <span class="rt-action" *ngIf="st.label">{{ st.label }}</span>
                  </div>
                </li>
              </ol>
              <p class="hint" *ngIf="n.roleKey === 'viewer'">Viewers aren't part of the route — they only read questions and answers.</p>

              <ng-container *ngIf="rejectEdges().length">
                <span class="field-label field-label--gap">Sent back when rejected</span>
                <div class="route" *ngFor="let e of rejectEdges()">
                  <span class="route-dot route-dot--reject"></span>
                  <span class="route-node">{{ nodeById(e.from)?.name }}</span>
                  <fvdr-icon name="chevron-right" class="route-arrow"></fvdr-icon>
                  <span class="route-node">{{ nodeById(e.to)?.name }}</span>
                </div>
              </ng-container>

              <span class="field-label field-label--gap rt-settings-head">Routing settings</span>
              <ng-container *ngIf="approvers().length; else noApprover">
                <div class="rt-setting">
                  <span class="rt-q">After approval, the answer goes</span>
                  <fvdr-radio [options]="afterApproveOptions" [value]="afterApprove" layout="vertical" (valueChange)="setAfterApprove($any($event))"></fvdr-radio>
                </div>
                <div class="rt-setting">
                  <span class="rt-q">When an answer is rejected, it goes back to</span>
                  <fvdr-radio *ngIf="hasExpert; else onlyCoordinator" [options]="rejectToOptions()" [value]="rejectTo" layout="vertical" (valueChange)="setRejectTo($any($event))"></fvdr-radio>
                  <ng-template #onlyCoordinator><span class="rt-fixed"><fvdr-icon name="lock-close"></fvdr-icon>The answer coordinator</span></ng-template>
                </div>
                <div class="rt-setting" *ngIf="approvers().length > 1">
                  <span class="rt-q">With several approvers, a rejection from a later approver goes back to</span>
                  <fvdr-radio [options]="rejectChainOptions()" [value]="rejectChain" layout="vertical" (valueChange)="setRejectChain($any($event))"></fvdr-radio>
                </div>
              </ng-container>
              <ng-template #noApprover>
                <p class="hint">Add an <b>Answer approver</b> role to choose where approved and rejected answers go.</p>
              </ng-template>
            </ng-container>
          </div>

          <div class="panel-foot" *ngIf="!isProtected(n)">
            <fvdr-btn label="Delete role" variant="ghost" size="s" iconName="trash" (clicked)="deleteNode(n)"></fvdr-btn>
          </div>
        </ng-container>

        </ng-template>
        </ng-template>

        <!-- Library panel -->
        <ng-template #libraryTpl>
          <div class="panel-head panel-head--lib">
            <div class="panel-titles">
              <span class="lib-title">{{ pendingInsert ? 'Add a role' : 'Add to workflow' }}</span>
              <span class="panel-sub" *ngIf="pendingInsert">{{ pendingInsertCaption }}</span>
              <span class="panel-sub" *ngIf="!pendingInsert">Click a role to add it, or drag roles and people onto the canvas</span>
            </div>
            <button class="icon-btn" *ngIf="pendingInsert" fvdrTooltip="Cancel" tooltipPosition="bottom" (click)="pendingInsert = null"><fvdr-icon name="close"></fvdr-icon></button>
          </div>
          <div class="panel-tabs" *ngIf="!pendingInsert">
            <fvdr-tabs size="s" [tabs]="libTabs" [activeId]="libTab" (tabChange)="libTab = $event"></fvdr-tabs>
          </div>

          <div class="panel-body">
            <!-- Roles -->
            <ng-container *ngIf="libTab === 'roles' || pendingInsert">
              <div class="lib-search"><fvdr-search placeholder="Search roles" size="s" [(ngModel)]="roleQuery"></fvdr-search></div>

              <!-- when inserting, only roles of the lane the insertion point is in -->
              <ng-container *ngIf="insertSide !== 'answer'">
                <span class="field-label">Question side</span>
                <ng-container *ngFor="let r of filteredRoles('question')">
                  <ng-container *ngTemplateOutlet="roleRow; context: { r: r }"></ng-container>
                </ng-container>
              </ng-container>

              <ng-container *ngIf="insertSide !== 'question'">
                <span class="field-label" [class.field-label--gap]="insertSide !== 'answer'">Answer side</span>
                <ng-container *ngFor="let r of filteredRoles('answer')">
                  <ng-container *ngTemplateOutlet="roleRow; context: { r: r }"></ng-container>
                </ng-container>
              </ng-container>

              <button class="create-role" (click)="openCreateRole()">
                <span class="create-icon"><fvdr-icon name="plus"></fvdr-icon></span>
                <span class="role-text">
                  <span class="role-name">Create custom role</span>
                  <span class="role-desc">Name it and pick exactly what it can see and do</span>
                </span>
              </button>
            </ng-container>

            <!-- Teams -->
            <ng-container *ngIf="libTab === 'teams' && !pendingInsert">
              <p class="hint">Question teams group drafters and submitters of one bidder. Each team sees only its own questions.</p>
              <div class="team-card" *ngFor="let t of teams; trackBy: trackById">
                <div class="team-head">
                  <input class="team-name" [(ngModel)]="t.name" aria-label="Question team name" />
                  <button class="icon-btn icon-btn--sm" fvdrTooltip="Delete team" tooltipPosition="left" (click)="askDeleteTeam(t)"><fvdr-icon name="trash"></fvdr-icon></button>
                </div>
                <span class="person-roles">{{ teamSummary(t) }}</span>
                <div class="avatars" *ngIf="teamPeople(t).length">
                  <span class="av" *ngFor="let pid of teamPeople(t)" [fvdrTooltip]="person(pid).name"
                        [style.background]="tone(pid).bg" [style.color]="tone(pid).fg">{{ person(pid).initials }}</span>
                </div>
              </div>
              <button class="create-role" (click)="newTeam()">
                <span class="create-icon"><fvdr-icon name="plus"></fvdr-icon></span>
                <span class="role-text">
                  <span class="role-name">New question team</span>
                  <span class="role-desc">Then add drafters and submitters to it from their roles</span>
                </span>
              </button>
            </ng-container>

            <!-- People -->
            <ng-container *ngIf="libTab === 'people' && !pendingInsert">
              <div class="lib-search"><fvdr-search placeholder="Search participants" size="s" [(ngModel)]="peopleQuery"></fvdr-search></div>
              <div class="group" *ngFor="let g of filteredGroups()">
                <div class="group-title"><fvdr-icon name="group"></fvdr-icon>{{ g.group }}<span class="team-count">{{ g.people.length }}</span></div>
                <div class="person" *ngFor="let p of g.people" draggable="true" (dragstart)="onPersonDragStart($event, p)">
                  <fvdr-icon name="drag" class="drag-ic"></fvdr-icon>
                  <span class="av av--sm" [style.background]="tone(p.id).bg" [style.color]="tone(p.id).fg">{{ p.initials }}</span>
                  <span class="person-text">
                    <span class="person-name">{{ p.name }}<span class="invited-tag" *ngIf="p.external">Invited</span></span>
                    <span class="person-roles">{{ rolesOf(p.id).length ? rolesLabel(p.id) : 'No Q&A role' }}</span>
                  </span>
                </div>
              </div>
            </ng-container>
          </div>
        </ng-template>
      </aside>
    </div>

    <!-- ══════════════ STEP 2 — Preferences ══════════════ -->
    <!-- ══════════════ STEP 2 — Users: check every team and role before inviting ══════════════ -->
    <fvdr-qna-users-step *ngIf="step === 2" [demo]="this"></fvdr-qna-users-step>

    <div class="prefs" *ngIf="step === 3">
      <div class="prefs-inner">
        <h2 class="prefs-title">Preferences</h2>
        <div class="pref" *ngFor="let p of prefs">
          <div class="perm-text">
            <span class="perm-label">{{ p.label }}</span>
            <span class="perm-hint">{{ p.hint }}</span>
          </div>
          <fvdr-toggle [checked]="p.on" (checkedChange)="p.on = $event"></fvdr-toggle>
        </div>
        <div class="pref pref--col">
          <span class="perm-label">Automatic question indexing</span>
          <fvdr-radio [options]="indexingOptions" [value]="indexing" layout="horizontal" (valueChange)="indexing = $event"></fvdr-radio>
        </div>
        <div class="summary">
          <span class="field-label">Your flow</span>
          <div class="summary-row">
            <span class="sum-chip" *ngFor="let n of orderedNodes()">
              <fvdr-icon [name]="n.icon"></fvdr-icon>{{ n.name }} <b>{{ n.members.length }}</b>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- footer -->
    <div class="footer">
      <fvdr-btn *ngIf="step === 1" label="Cancel" variant="secondary"></fvdr-btn>
      <fvdr-btn *ngIf="step > 1" label="Back" variant="secondary" (clicked)="toStep(step === 3 ? 2 : 1)"></fvdr-btn>
      <fvdr-btn *ngIf="step < 3" label="Next" [disabled]="!templateConfirmed || errorNodes.length > 0" (clicked)="goNext()"></fvdr-btn>
      <fvdr-btn *ngIf="step === 3" label="Activate Q&A" (clicked)="activate()"></fvdr-btn>
      <span class="footer-hint" *ngIf="step < 3 && templateConfirmed && errorNodes.length">Add people to {{ errorNamesLabel }} to continue</span>
    </div>
  </div>
</div>

<!-- member row -->
<ng-template #memberRow let-n="n" let-m="m">
  <div class="member">
    <span class="av av--sm" [style.background]="tone(m.personId).bg" [style.color]="tone(m.personId).fg">
      {{ person(m.personId).initials }}<i class="av-dual" *ngIf="rolesOf(m.personId).length > 1"></i>
    </span>
    <span class="person-text">
      <span class="person-name">{{ person(m.personId).name }}<span class="invited-tag" *ngIf="person(m.personId).external">Invited</span></span>
      <ng-container *ngIf="n.roleKey === 'expert' && n.assignMode === 'auto'; else plainCaption">
        <span class="person-roles" *ngIf="m.categories.length">{{ m.categories.join(' · ') }}</span>
        <span class="person-roles" *ngIf="!m.categories.length">No category</span>
      </ng-container>
      <ng-template #plainCaption>
        <span class="person-roles" *ngIf="otherRoles(m.personId, n) as other">Also {{ other }}</span>
        <span class="person-roles" *ngIf="!otherRoles(m.personId, n)">{{ person(m.personId).external ? person(m.personId).email : person(m.personId).group }}</span>
      </ng-template>
    </span>
    <button class="icon-btn icon-btn--sm" fvdrTooltip="Remove from role" tooltipPosition="left" (click)="removeMember(n, m)"><fvdr-icon name="close"></fvdr-icon></button>
  </div>
</ng-template>

<!-- role row (library) -->
<ng-template #roleRow let-r="r">
  <button class="role" [class.role--used]="roleMaxed(r)" [disabled]="roleMaxed(r)" [attr.draggable]="!roleMaxed(r)"
          (dragstart)="onRoleDragStart($event, r)" (click)="addRole(r)">
    <span class="node-icon" [class.node-icon--q]="r.side === 'question'" [class.node-icon--custom]="r.custom"><fvdr-icon [name]="r.icon"></fvdr-icon></span>
    <span class="role-text">
      <span class="role-name">{{ r.name }}<span class="role-tag" *ngIf="r.custom">Custom</span></span>
      <span class="role-desc">{{ roleMaxed(r) ? 'Already in this workflow — only one per workflow' : r.description }}</span>
    </span>
    <fvdr-icon [name]="roleMaxed(r) ? 'check' : 'plus'" class="role-plus"></fvdr-icon>
  </button>
</ng-template>

<!-- Create custom role -->

<!-- add people: one modal for roles, question teams and categories -->
<fvdr-modal [visible]="!!peopleModal" [title]="peopleModalTitle" size="m"
            [confirmLabel]="peopleSel.size ? 'Add ' + peopleSel.size : 'Add'" cancelLabel="Cancel" [confirmDisabled]="!peopleSel.size"
            (confirmed)="confirmPeople()" (cancelled)="peopleModal = null" (closed)="peopleModal = null">
  <div class="pm" *ngIf="peopleModal">
    <fvdr-search placeholder="Search people or groups" size="s" [(ngModel)]="pmQuery"></fvdr-search>
    <div class="pm-list">
      <div class="pm-group" *ngFor="let g of pmGroups(); trackBy: trackGroup">
        <div class="pm-group-head">
          <fvdr-checkbox [label]="g.group" [checked]="pmGroupChecked(g.people)" [disabled]="pmGroupDone(g.people)" (checkedChange)="pmToggleGroup(g.people, $event)"></fvdr-checkbox>
          <span class="pm-count">{{ g.people.length }}</span>
        </div>
        <div class="pm-person" *ngFor="let p of g.people; trackBy: trackById">
          <fvdr-checkbox [label]="p.name" [checked]="peopleSel.has(p.id) || pmIsIn(p.id)" [disabled]="pmIsIn(p.id)" (checkedChange)="pmToggle(p.id, $event)"></fvdr-checkbox>
          <span class="pm-sub">{{ pmIsIn(p.id) ? 'Already added' : p.email }}</span>
        </div>
      </div>
      <p class="hint" *ngIf="!pmGroups().length">No one matches “{{ pmQuery }}”</p>
    </div>
  </div>
</fvdr-modal>

<fvdr-modal [visible]="!!catToDelete" [title]="'Delete ' + (catToDelete?.name || 'category') + '?'" size="s"
            confirmLabel="Delete category" confirmVariant="danger" cancelLabel="Cancel"
            (confirmed)="catToDelete && deleteCategory(catToDelete); catToDelete = null" (cancelled)="catToDelete = null" (closed)="catToDelete = null">
  <p class="modal-text">Experts and approvers assigned to {{ catToDelete?.name }} lose it.
    <ng-container *ngIf="catToDelete && customWf.has('cat:' + catToDelete.name)">Its own workflow is deleted too.</ng-container></p>
</fvdr-modal>

<fvdr-modal [visible]="!!teamToDelete" [title]="'Delete ' + (teamToDelete?.name || 'team') + '?'" size="s"
            confirmLabel="Delete team" confirmVariant="danger" cancelLabel="Cancel"
            (confirmed)="deleteTeam()" (cancelled)="teamToDelete = null" (closed)="teamToDelete = null">
  <p class="modal-text">{{ teamToDelete ? teamPeople(teamToDelete).length : 0 }} {{ teamToDelete && teamPeople(teamToDelete).length === 1 ? 'person' : 'people' }} will lose their role in this team. Their questions stay in Q&amp;A.</p>
</fvdr-modal>

<fvdr-modal [visible]="createOpen" title="Create custom role" size="m"
            confirmLabel="Create role" cancelLabel="Cancel" [confirmDisabled]="!draft.name.trim()"
            (confirmed)="createRole()" (cancelled)="createOpen = false" (closed)="createOpen = false">
  <div class="cr">
    <fvdr-input label="Role name" placeholder="e.g. Final sign-off, Legal reviewer" [(ngModel)]="draft.name"></fvdr-input>
    <div class="cr-row" *ngIf="!draftSideLocked">
      <span class="field-label">Side</span>
      <fvdr-radio [options]="sideOptions" [value]="draft.side" layout="horizontal" (valueChange)="setDraftSide($any($event))"></fvdr-radio>
    </div>
    <div class="cr-row">
      <span class="field-label">Start from</span>
      <fvdr-dropdown [options]="baseRoleOptions()" [value]="draft.base" (valueChange)="setDraftBase($any($event))"></fvdr-dropdown>
    </div>
    <div class="cr-row">
      <span class="field-label">What this role can do</span>
      <div class="perm perm--compact" *ngFor="let p of draft.side === 'question' ? qPerms : aPerms">
        <div class="perm-text"><span class="perm-label">{{ p.label }}</span></div>
        <fvdr-toggle size="s" [checked]="!!draft.perms[p.key]" (checkedChange)="draft.perms[p.key] = $event"></fvdr-toggle>
      </div>
    </div>
  </div>
</fvdr-modal>

<ng-template #catRows let-list="list" let-own="own">
  <span class="wf-mrow" *ngFor="let c of list; trackBy: trackName">
    <fvdr-icon name="label" class="cat-ic" [ngClass]="'cat-ic--' + c.color"></fvdr-icon>
    <input class="cat-input" [value]="c.name" [attr.aria-label]="'Rename ' + c.name"
           (change)="renameCategory(c, $any($event.target).value, $any($event.target))" (keydown.enter)="$any($event.target).blur()" />
    <button class="icon-btn icon-btn--sm" *ngIf="own" [fvdrTooltip]="'Use the All categories workflow for ' + c.name" tooltipPosition="left" (click)="resetWf('cat:' + c.name)"><fvdr-icon name="undo"></fvdr-icon></button>
    <button class="icon-btn icon-btn--sm" [fvdrTooltip]="'Delete ' + c.name" tooltipPosition="left" (click)="catToDelete = c"><fvdr-icon name="trash"></fvdr-icon></button>
  </span>
</ng-template>

<ng-template #catAssign let-n="n">
  <div class="ct-bar">
    <span class="field-label">{{ roleWord(n, true, true) }}</span>
    <span class="hint ct-optional">{{ scopedCategory ? scopedCategory + ' only' : 'Categories are optional' }}</span>
  </div>
  <div class="ex-list">
    <div class="ex ex--stack" *ngFor="let m of n.members" [class.ex--open]="catEdit === m.personId">
      <div class="ex-row">
        <span class="av av--xs" [style.background]="tone(m.personId).bg" [style.color]="tone(m.personId).fg">{{ person(m.personId).initials }}</span>
        <div class="ex-main">
          <span class="ex-name">{{ person(m.personId).name }}</span>
          <div class="ex-tags">
            <span class="ex-tag ex-tag--chip" *ngFor="let c of memberCats(m)">
              <fvdr-icon name="label" class="cat-ic" [ngClass]="'cat-ic--' + c.color"></fvdr-icon>{{ c.name }}
              <button class="ex-tag-x" [attr.aria-label]="'Remove ' + c.name" (click)="toggleCategory(m, c.name, false)"><fvdr-icon name="close"></fvdr-icon></button>
            </span>
            <button class="ex-tag ex-tag--add" *ngIf="!scopedCategory" (click)="toggleCatEdit(m)"><fvdr-icon name="plus"></fvdr-icon>Category</button>
          </div>
        </div>
        <button class="icon-btn icon-btn--sm ct-remove" [fvdrTooltip]="'Remove from ' + n.name" tooltipPosition="left" (click)="removeMember(n, m)"><fvdr-icon name="user-remove"></fvdr-icon></button>
      </div>
      <div class="ex-edit" *ngIf="catEdit === m.personId">
        <fvdr-checkbox *ngFor="let c of wfCategories()" [label]="c.name" [checked]="m.categories.includes(c.name)" (checkedChange)="toggleCategory(m, c.name, $event)"></fvdr-checkbox>
      </div>
    </div>
  </div>

</ng-template>

<ng-template #permRow let-n="n" let-p="p">
  <div class="perm">
    <div class="perm-text">
      <span class="perm-label">{{ p.label }}</span>
      <span class="perm-hint">{{ p.hint }}</span>
    </div>
    <fvdr-toggle size="s" [checked]="!!n.perms[p.key]" (checkedChange)="setPerm(n, p.key, $event)"></fvdr-toggle>
  </div>
</ng-template>

<fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); font-size: var(--font-size-base); color: var(--color-text-primary); }
    .page-layout { display: flex; height: 100%; background: var(--color-stone-100); }
    .main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--color-stone-0); }
    button { font-family: inherit; }

    /* stepper */
    .wf-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); background: var(--color-stone-0); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); box-shadow: var(--shadow-card); max-width: 100%; }
    .wf-tabs { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .wf-tab { display: inline-flex; align-items: center; gap: var(--space-1); height: var(--space-8); padding: 0 var(--space-3); border: 1px solid var(--color-divider); border-radius: var(--radius-sm); background: var(--color-stone-0); color: var(--color-text-primary); font: inherit; cursor: pointer; white-space: nowrap; }
    .wf-tab:hover { background: var(--color-hover-bg); }
    .wf-tab--on { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .wf-group { position: absolute; border: 1px dashed var(--color-stone-500); border-radius: var(--radius-lg); background: var(--color-stone-0); pointer-events: none; }
    .wf-group-head { position: absolute; left: var(--space-4); right: var(--space-4); top: var(--space-3); display: flex; align-items: center; gap: 0.5em; pointer-events: auto; white-space: nowrap; overflow: hidden; }
    .wf-group-open { display: inline-flex; align-items: center; justify-content: center; border: none; background: none; padding: 0.15em; color: var(--color-primary-500); cursor: pointer; font-size: 1em; border-radius: var(--radius-sm); }
    .wf-group-open:hover { background: var(--color-primary-50); }

    .wf-group-name { font-size: 1.15em; font-weight: var(--font-weight-semi); overflow: hidden; text-overflow: ellipsis; }
    .wf-group-sub { font-size: 0.9em; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; }
    .ov-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .ov-row .link-btn { margin-left: auto; }
    .role--used { cursor: default; opacity: 0.6; }
    .role--used:hover { background: none; }
    .wf-add-wrap { position: relative; }
    .wf-pop { position: absolute; right: 0; top: calc(100% + var(--space-1)); z-index: 30; width: 240px; padding: var(--space-2); display: flex; flex-direction: column; gap: 2px; background: var(--color-stone-0); border-radius: var(--radius-md); box-shadow: var(--shadow-card); }
    .wf-pop .wf-pop-search { width: 100%; box-sizing: border-box; margin-bottom: var(--space-1); }
    .wf-pop-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2); border: none; border-radius: var(--radius-sm); background: none; font: inherit; text-align: left; cursor: pointer; }
    .wf-pop-item:hover { background: var(--color-hover-bg); }
    .wf-pop-item--new { color: var(--color-primary-500); }
    .wf-pop--wide { width: 280px; max-height: 60vh; overflow-y: auto; }
    .wf-mrow { display: flex; align-items: center; gap: var(--space-1); }
    .wf-m-add { color: var(--color-primary-500); margin: 0 2px; }
    .rt-fixed { display: inline-flex; align-items: center; gap: var(--space-2); }
    .perm-after { padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-divider); }
    .wf-count { display: inline-flex; align-items: center; justify-content: center; min-width: var(--space-5); padding: 0 var(--space-1); margin-left: var(--space-1); border-radius: var(--radius-lg); background: var(--color-stone-300); color: var(--color-text-secondary); font-size: var(--text-caption1-size); font-weight: normal; }
    .wf-tab--add { padding: 0 var(--space-2); color: var(--color-primary-500); }
    .wf-name { width: 10em; border: 1px solid var(--color-stone-400); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); font: inherit; }
    .wf-name:focus { outline: none; border-color: var(--color-primary-500); }
    .wf-list { display: flex; }
    .canvas--preview .node, .canvas--preview .edge-label { cursor: default; }
    .canvas--preview .node-add, .canvas--preview .edge-actions { display: none; }
    .tp-desc { margin: 0 0 var(--space-2); }
    .stepper { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-divider); flex-shrink: 0; }
    .step { display: flex; align-items: center; gap: var(--space-2); border: 0; background: none; padding: 0; cursor: pointer; color: var(--color-text-secondary); font-size: var(--font-size-base); }
    .step:disabled { cursor: not-allowed; }
    .step--active { color: var(--color-text-primary); font-weight: var(--font-weight-semi); }
    .step-num { width: 20px; height: 20px; border-radius: var(--radius-full); display: inline-flex; align-items: center; justify-content: center; font-size: var(--text-caption1-size); background: var(--color-stone-300); color: var(--color-text-secondary); }
    .step--active .step-num, .step--done .step-num { background: var(--color-primary-500); color: var(--color-stone-0); }
    .step-sep { width: 24px; height: 1px; background: var(--color-stone-500); }

    /* workspace */
    .workspace { flex: 1; min-height: 0; display: flex; }
    .canvas {
      position: relative; flex: 1; min-width: 0; overflow: hidden; cursor: grab;
      background-color: var(--color-stone-100);
      background-image: radial-gradient(var(--color-stone-400) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .canvas--panning { cursor: grabbing; }
    .canvas--drop { box-shadow: inset 0 0 0 2px var(--color-primary-500); }
    .world { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
    .edges { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }

    .edge { fill: none; stroke: var(--color-stone-600); stroke-width: 1.5; transition: stroke 0.15s; }
    .edge--return { stroke: var(--color-stone-600); }
    .edge--reject { stroke: var(--color-error-500); stroke-dasharray: 5 4; }
    .edge--related { stroke: var(--color-primary-500); stroke-width: 2; }
    .edge--hover { stroke: var(--color-primary-500); stroke-width: 2.5; }
    .edge-hit { fill: none; stroke: transparent; stroke-width: 16; pointer-events: stroke; cursor: pointer; }
    .arrow-main { fill: var(--color-stone-600); }
    .edge-start { fill: var(--color-stone-600); stroke: var(--color-stone-0); stroke-width: 2; }
    .edge-start--reject { fill: var(--color-error-500); }
    .arrow-reject { fill: var(--color-error-500); }
    .arrow-active { fill: var(--color-primary-500); }
    .edge-start--active { fill: var(--color-primary-500); }
    /* rejected path keeps its red meaning when active, just gets thicker */
    .edge--reject.edge--related, .edge--reject.edge--hover { stroke: var(--color-error-500); stroke-width: 2; }

    .edge-label {
      position: absolute; transform: translate(-50%, -50%);
      display: flex; align-items: center; gap: var(--space-1);
      padding: 2px var(--space-2); border-radius: var(--radius-full);
      background: var(--color-stone-0); border: 1px solid var(--color-stone-400);
      font-size: var(--text-caption2-size); color: var(--color-text-secondary); white-space: nowrap; cursor: default;
      z-index: 1;
      transition: border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
    }
    .edge-label--reject { color: var(--color-error-600); border-color: var(--color-error-200); }
    .edge-label--hover { border-color: var(--color-primary-500); color: var(--color-text-primary); z-index: 3; }
    /* actions slide open inside the label instead of popping in */
    .edge-actions {
      display: inline-flex; gap: 2px; overflow: hidden;
      max-width: 0; opacity: 0; margin-left: calc(var(--space-1) * -1);
      transition: max-width 0.22s ease, opacity 0.16s ease, margin-left 0.22s ease;
    }
    .edge-label--hover { box-shadow: var(--shadow-card); }
    .edge-label--hover .edge-actions { max-width: 48px; opacity: 1; margin-left: 0; transition-delay: 0s, 0.06s, 0s; }
    .mini-btn { width: 20px; height: 20px; border-radius: var(--radius-full); border: 0; background: var(--color-stone-200); color: var(--color-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: var(--text-caption1-size); }
    .mini-btn:hover { background: var(--color-primary-50); color: var(--color-primary-600); }

    /* node */
    .node {
      position: absolute; width: ${NODE_W}px; height: ${NODE_H}px; box-sizing: border-box;
      background: var(--color-stone-0); border: 1px solid var(--color-stone-400); border-radius: var(--radius-lg);
      padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);
      cursor: pointer; user-select: none; z-index: 2; transition: border-color 0.15s, box-shadow 0.15s;
    }
    .node:hover { border-color: var(--color-stone-600); box-shadow: var(--shadow-card-hover); }
    .node--selected { border: 2px solid var(--color-primary-500); padding: calc(var(--space-3) - 1px); box-shadow: var(--shadow-card-hover); }
    .node--error { border-color: var(--color-error-300); }
    .node--error.node--selected { border-color: var(--color-error-600); }
    .node--drop { border: 2px dashed var(--color-primary-500); background: var(--color-primary-50); padding: calc(var(--space-3) - 1px); }
    .node--dragging { cursor: grabbing; box-shadow: var(--shadow-popover); z-index: 5; }
    .node-head { display: flex; align-items: center; gap: var(--space-2); }
    .node-icon { width: 32px; height: 32px; flex-shrink: 0; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary-50); color: var(--color-primary-600); font-size: 16px; }
    .node-icon--q { background: var(--color-info-50); color: var(--color-info-500); }
    .node-icon--custom { background: var(--color-warning-50); color: var(--color-warning-700); }
    .node-icon--lg { width: 40px; height: 40px; font-size: 20px; }
    .avatar-pick { position: relative; flex-shrink: 0; }
    .node-icon--btn { border: 0; padding: 0; cursor: pointer; transition: box-shadow 0.15s; }
    .node-icon--btn:hover, .node-icon--btn[aria-expanded="true"] { box-shadow: 0 0 0 2px var(--color-stone-0), 0 0 0 4px var(--color-stone-400); }
    .color-pop {
      position: absolute; top: calc(100% + var(--space-2)); left: 0; z-index: 20;
      display: grid; grid-template-columns: repeat(7, 28px); gap: var(--space-2);
      padding: var(--space-3); background: var(--color-stone-0); border-radius: var(--radius-md); box-shadow: var(--shadow-popover);
    }
    .swatch { width: 28px; height: 28px; border: 0; border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
    .swatch:hover { box-shadow: 0 0 0 2px var(--color-stone-400); }
    .swatch--on { box-shadow: 0 0 0 2px var(--color-primary-500); }
    .node-titles { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .node-name { font-weight: var(--font-weight-semi); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .node-sub { font-size: var(--text-caption1-size); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .node-step { align-self: flex-start; font-size: var(--text-caption2-size); color: var(--color-text-secondary); background: var(--color-stone-200); border-radius: var(--radius-sm); padding: 0 var(--space-1); white-space: nowrap; }
    .node-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: var(--space-1); min-height: 0; }
    .node-note { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-caption2-size); color: var(--color-text-secondary); }
    .node-note--power { color: var(--color-primary-600); font-weight: 500; }
    .drop-empty {
      display: flex; align-items: center; justify-content: center; gap: var(--space-1); height: 40px;
      border: 1px dashed var(--color-error-300); border-radius: var(--radius-md);
      color: var(--color-error-600); font-size: var(--text-caption1-size); background: var(--color-error-50);
    }
    .node--drop .drop-empty { border-color: var(--color-primary-500); color: var(--color-primary-600); background: var(--color-stone-0); }

    .avatars { display: flex; align-items: center; }
    .av {
      position: relative; width: 26px; height: 26px; border-radius: var(--radius-full); flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: var(--text-caption2-size); font-weight: var(--font-weight-semi);
      border: 2px solid var(--color-stone-0); margin-left: -6px;
    }
    .avatars .av:first-child { margin-left: 0; }
    .av--more { background: var(--color-stone-300); color: var(--color-text-secondary); }
    .av--sm { width: 28px; height: 28px; margin-left: 0; border: 0; }
    .av-dual { position: absolute; right: -2px; bottom: -2px; width: 9px; height: 9px; border-radius: var(--radius-full); background: var(--color-warning-500); border: 2px solid var(--color-stone-0); }
    .members-count { margin-left: var(--space-2); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .team-chips { display: flex; flex-wrap: wrap; gap: var(--space-1); }
    .team-chip { display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2); border-radius: var(--radius-sm); background: var(--color-info-50); color: var(--color-info-800); font-size: var(--text-caption1-size); }
    .team-chip b { font-weight: var(--font-weight-semi); }

    .port { position: absolute; width: 10px; height: 10px; border-radius: var(--radius-full); background: var(--color-stone-600); border: 2px solid var(--color-stone-0); }
    .port--l { left: -6px; top: 50%; margin-top: -5px; } .port--r { right: -6px; top: 50%; margin-top: -5px; }
    .port--t { top: -6px; left: 50%; margin-left: -5px; } .port--b { bottom: -6px; left: 50%; margin-left: -5px; }
    .lane-divider { position: absolute; width: 0; border-left: 1px dashed var(--color-stone-500); pointer-events: none; }
    .lane-label { position: absolute; display: inline-flex; align-items: center; gap: var(--space-1); white-space: nowrap; transform: translateY(-50%); font-size: var(--text-caption1-size); font-weight: var(--font-weight-semi); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; pointer-events: none; }
    .lane-label--q { transform: translate(-100%, -50%); color: var(--color-info-500); }
    .lane-label--a { color: var(--color-primary-600); }
    /* hit area starts at the card edge so the cursor never leaves hover on the way to "+" */
    .node-link {
      position: absolute; top: -10px; right: -10px; z-index: 3; width: 20px; height: 20px; padding: 0; border-radius: 50%;
      border: 1px solid var(--color-primary-500); background: var(--color-stone-0); color: var(--color-primary-600);
      display: inline-flex; align-items: center; justify-content: center; font-size: 12px; cursor: crosshair;
      opacity: 0; transition: opacity 0.15s;
    }
    .node:hover .node-link, .node--selected .node-link { opacity: 1; }
    .node-link:hover { background: var(--color-primary-50); }
    .node--link-target { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px var(--color-primary-50); }
    .edge--draft { stroke: var(--color-primary-500); stroke-dasharray: 6 4; }
    .link-menu { position: absolute; z-index: 30; min-width: 240px; padding: var(--space-2); display: flex; flex-direction: column; gap: 2px; background: var(--color-stone-0); border-radius: var(--radius-md); box-shadow: var(--shadow-card); }
    .link-menu-head { padding: var(--space-1) var(--space-2); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .link-menu button { text-align: left; padding: var(--space-2); border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-primary); cursor: pointer; }
    .link-menu button:hover { background: var(--color-hover-bg); }
    .lg-link { display: inline-flex; width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--color-primary-500); color: var(--color-primary-600); font-size: 10px; align-items: center; justify-content: center; font-style: normal; }
    .node-add {
      position: absolute; display: inline-flex; padding: 0; border: 0; background: transparent; cursor: pointer;
      opacity: 0; visibility: hidden; pointer-events: none;
      /* fade out a touch later so a quick move toward "+" still catches it */
      transition: opacity 0.18s ease 0.08s, visibility 0s linear 0.26s;
    }
    .node-add-dot {
      width: 24px; height: 24px; border-radius: var(--radius-sm); border: 1px solid var(--color-stone-500);
      background: var(--color-stone-0); color: var(--color-text-secondary);
      display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
      transform: scale(0.7); transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.15s, border-color 0.15s, color 0.15s;
    }
    .node-add:hover .node-add-dot { border-color: var(--color-primary-500); color: var(--color-primary-600); background: var(--color-primary-50); }
    .node-add--r { right: -40px; top: 50%; width: 40px; height: 32px; margin-top: -16px; justify-content: flex-end; align-items: center; }
    .node-add--l { left: -40px; top: 50%; width: 40px; height: 32px; margin-top: -16px; justify-content: flex-start; align-items: center; }
    .node-add--t { top: -40px; left: 50%; width: 32px; height: 40px; margin-left: -16px; justify-content: center; align-items: flex-start; }
    .node-add--b { bottom: -40px; left: 50%; width: 32px; height: 40px; margin-left: -16px; justify-content: center; align-items: flex-end; }
    .node:hover .node-add, .node--selected .node-add {
      opacity: 1; visibility: visible; pointer-events: auto;
      transition: opacity 0.18s ease, visibility 0s;
    }
    .node:hover .node-add-dot, .node--selected .node-add-dot { transform: scale(1); }
    @media (prefers-reduced-motion: reduce) {
      .node-add, .node-add-dot, .edge-actions, .edge-label { transition: none !important; }
    }

    /* canvas chrome */
    .canvas-top { position: absolute; left: var(--space-4); right: var(--space-4); top: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; z-index: 10; pointer-events: none; }
    .canvas-top > * { pointer-events: auto; }
    .canvas-top > .health { margin-left: auto; }
    .health { display: inline-flex; white-space: nowrap; flex-shrink: 0; align-items: center; gap: var(--space-2); border: 1px solid var(--color-success-border); background: var(--color-success-bg); color: var(--color-success-text); border-radius: var(--radius-full); padding: var(--space-1) var(--space-3); font-size: var(--text-caption1-size); cursor: pointer; }
    .health--error { border-color: var(--color-error-border); background: var(--color-error-bg); color: var(--color-error-text); }
    .canvas-controls { position: absolute; left: var(--space-4); bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-1); z-index: 10; }
    .ctl { width: 32px; height: 32px; border-radius: var(--radius-md); border: 1px solid var(--color-stone-400); background: var(--color-stone-0); color: var(--color-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
    .ctl:hover { color: var(--color-text-primary); border-color: var(--color-stone-600); }
    .zoom-val { margin-left: var(--space-2); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .legend { position: absolute; right: var(--space-4); bottom: var(--space-4); max-width: calc(100% - 280px); flex-wrap: wrap; justify-content: flex-end; display: flex; gap: var(--space-1) var(--space-4); background: var(--color-stone-0); border: 1px solid var(--color-stone-400); border-radius: var(--radius-md); padding: var(--space-1) var(--space-3); font-size: var(--text-caption1-size); color: var(--color-text-secondary); z-index: 10; }
    .legend span { display: inline-flex; align-items: center; gap: var(--space-1); }
    .lg { display: inline-block; width: 18px; height: 0; border-top: 2px solid var(--color-stone-600); }
    .lg--reject { border-top: 2px dashed var(--color-error-500); }
    .lg--dual { width: 9px; height: 9px; border: 0; border-radius: var(--radius-full); background: var(--color-warning-500); }

    /* right panel */
    .panel { position: relative; width: 392px; flex-shrink: 0; border-left: 1px solid var(--color-divider); display: flex; flex-direction: column; background: var(--color-stone-0); min-height: 0; }
    .panel-head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-4) var(--space-3); }
    .panel-head--lib { padding-bottom: var(--space-2); }
    .panel-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .lib-title { font-size: var(--text-sub1-size); font-weight: var(--font-weight-semi); }
    .panel-sub { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .name-input { border: 1px solid transparent; border-radius: var(--radius-sm); padding: 2px var(--space-1); margin-left: calc(var(--space-1) * -1); font: inherit; font-size: var(--font-size-lg); font-weight: var(--font-weight-semi); color: var(--color-text-primary); background: none; width: 100%; box-sizing: border-box; }
    .name-input:hover { border-color: var(--color-stone-400); }
    .name-input:focus { outline: none; border-color: var(--color-primary-500); }
    .panel-tabs { padding: 0 var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .panel-resize { position: absolute; left: calc(var(--space-1) * -1); top: 0; bottom: 0; width: var(--space-2); cursor: col-resize; z-index: 20; }
    .panel-resize::after { content: ''; position: absolute; left: 3px; top: 0; bottom: 0; width: 2px; background: transparent; transition: background 0.15s; }
    .panel-resize:hover::after, .panel-resize:focus-visible::after, .panel--resizing .panel-resize::after { background: var(--color-primary-500); }
    .panel-resize:focus-visible { outline: none; }
    .panel--resizing { user-select: none; }
    .panel-body { flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .panel-foot { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-divider); }
    .icon-btn { width: 32px; height: 32px; border: 0; background: none; border-radius: var(--radius-md); color: var(--color-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; flex-shrink: 0; }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .icon-btn--sm { width: 24px; height: 24px; font-size: 14px; }
    .hint { margin: 0; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .field-label { font-size: var(--text-caption1-size); font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .field-label--gap { margin-top: var(--space-3); }
    .empty-panel { display: flex; gap: var(--space-2); align-items: flex-start; padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-error-50); color: var(--color-error-700); font-size: var(--text-caption1-size); }
    .team-block { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-2); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-divider); }
    .team-head { display: flex; align-items: center; gap: var(--space-2); }
    .team-name { flex: 1; min-width: 0; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 2px var(--space-1); margin-left: calc(var(--space-1) * -1); font: inherit; font-weight: var(--font-weight-semi); color: var(--color-text-primary); background: none; }
    .team-name:hover { border-color: var(--color-stone-400); }
    .team-name:focus { outline: none; border-color: var(--color-primary-500); }
    .team-card { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider); }
    .link-btn--add { display: inline-flex; align-items: center; gap: var(--space-1); }
    .invited-tag { margin-left: var(--space-2); padding: 0 var(--space-1); border-radius: var(--radius-sm); background: var(--color-info-50); color: var(--color-info-800); font-size: var(--text-caption2-size); font-weight: var(--font-weight-regular); }
    .invite { display: flex; flex-direction: column; }
    .invite-form { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-stone-100); }
    .invite-actions { display: flex; gap: var(--space-2); }
    .modal-text { margin: 0; color: var(--color-text-secondary); }
    .ct-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin: var(--space-2) 0; }
    .ct-row { display: flex; align-items: center; gap: var(--space-2); min-height: var(--space-10); border-radius: var(--radius-sm); }
    .ct-row--person { padding-left: var(--space-10); padding-right: var(--space-1); }
    .ct-row--person:hover { background: var(--color-hover-bg); }
    .ct-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ct-add { margin-left: auto; display: inline-flex; align-items: center; gap: var(--space-1); border: none; background: none; padding: var(--space-1); font: inherit; color: var(--color-primary-500); cursor: pointer; white-space: nowrap; }
    .ct-add:hover { color: var(--color-primary-600); }
    .ct-remove { opacity: 0; color: var(--color-error-600); transition: opacity 0.15s; }
    .ct-row:hover .ct-remove, .ct-remove:focus-visible { opacity: 1; }
    .ct-optional { margin: 0; }
    .ex-list { display: flex; flex-direction: column; }
    .ex { border-radius: var(--radius-sm); }
    .ex--open { background: var(--color-stone-100); }
    .ex-row { display: flex; align-items: center; gap: var(--space-2); min-height: var(--space-10); padding: var(--space-1); border-radius: var(--radius-sm); }
    .ex-row:hover { background: var(--color-hover-bg); }
    .ex-row:hover .ct-remove, .ex-row .ct-remove:focus-visible { opacity: 1; }
    .ex--stack .ex-row { align-items: flex-start; padding-top: var(--space-2); padding-bottom: var(--space-2); }
    .ex-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ex-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ex-tags { display: flex; flex-wrap: wrap; gap: var(--space-1); padding-top: 2px; }
    .ex-tag { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-caption1-size); color: var(--color-text-primary); white-space: nowrap; }
    .ex-tag .cat-ic { font-size: var(--space-3); }
    .ex-tag--chip { padding: 2px var(--space-1) 2px var(--space-2); border: 1px solid var(--color-divider); border-radius: var(--radius-lg); background: var(--color-stone-0); }
    .ex-tag--add { padding: 2px var(--space-2); border: 1px dashed var(--color-stone-500); border-radius: var(--radius-lg); background: none; color: var(--color-primary-500); cursor: pointer; font: inherit; font-size: var(--text-caption1-size); }
    .ex-tag-x { display: inline-flex; border: none; background: none; padding: 0; color: var(--color-text-secondary); cursor: pointer; font-size: var(--space-3); }
    .ex-tag-x:hover { color: var(--color-error-600); }
    .ex-edit { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); padding: var(--space-2) var(--space-3) var(--space-3) var(--space-10); }
    .cat-input { flex: 1; min-width: 0; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 2px var(--space-1); font: inherit; color: var(--color-text-primary); background: none; }
    .cat-input:hover { border-color: var(--color-stone-400); }
    .cat-input:focus { outline: none; border-color: var(--color-primary-500); background: var(--color-stone-0); }
    .av--xs { width: 24px; height: 24px; margin-left: 0; border: 0; font-size: var(--text-caption2-size); }
    .team-title, .group-title { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); font-size: var(--text-caption1-size); color: var(--color-text-secondary); padding: var(--space-1) 0; }
    .team-count { margin-left: auto; font-weight: var(--font-weight-regular); }
    .member, .person { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-1); border-radius: var(--radius-md); }
    .member:hover, .person:hover { background: var(--color-stone-200); }
    .person { cursor: grab; }
    .drag-ic { color: var(--color-stone-500); font-size: 14px; }
    .person-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .person-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-roles { font-size: var(--text-caption1-size); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-roles--warn { color: var(--color-warning-700); }
    .cat-section { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-divider); }
    .cat-section-head { display: flex; flex-direction: column; gap: 2px; }
    .cat-block { display: flex; flex-direction: column; gap: var(--space-2); }
    .cat-head { display: flex; align-items: center; gap: var(--space-2); }
    .cat-name { font-weight: var(--font-weight-semi); }
    .cat-count { margin-left: auto; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .cat-ic { font-size: 16px; }
    .cat-ic--teal { color: var(--color-primary-400); }
    .cat-ic--green { color: var(--color-primary-600); }
    .cat-ic--blue { color: var(--color-info-500); }
    .cat-ic--orange { color: var(--color-warning-600); }
    .cat-ic--red { color: var(--color-error-500); }
    .cat-ic--grey { color: var(--color-stone-500); }
    .assign-mode { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin: var(--space-2) 0; }
    .group { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--space-2); }
    .lib-search { margin-bottom: var(--space-2); }

    .perm { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .perm--compact { padding: var(--space-1) 0; }
    .perm-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .perm-label { font-size: var(--font-size-base); }
    .rt { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .rt-step { position: relative; display: flex; gap: var(--space-3); padding-bottom: var(--space-3); }
    .rt-step:not(:last-child)::before { content: ''; position: absolute; left: 11px; top: var(--space-6); bottom: 0; width: 2px; background: var(--color-divider); }
    .rt-num { flex: none; width: var(--space-6); height: var(--space-6); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: var(--text-caption1-size); background: var(--color-stone-300); color: var(--color-text-secondary); }
    .rt-step--here .rt-num { background: var(--color-primary-500); color: var(--color-stone-0); }
    .rt-step--end .rt-num { background: var(--color-primary-50); color: var(--color-primary-600); }
    .rt-body { display: flex; flex-direction: column; gap: 2px; padding-top: 2px; min-width: 0; }
    .rt-role { display: flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semi); }
    .rt-step--end .rt-role { font-weight: normal; }
    .rt-here { font-size: var(--text-caption1-size); font-weight: normal; color: var(--color-primary-600); background: var(--color-primary-50); border-radius: var(--radius-lg); padding: 0 var(--space-2); }
    .rt-action { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .rt-settings-head { padding-top: var(--space-3); border-top: 1px solid var(--color-divider); }
    .rt-setting { display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-3); }
    .rt-q { font-size: var(--font-size-base); }
    .people-bar { display: flex; align-items: center; gap: var(--space-2); }
    .people-bar fvdr-btn { margin-left: auto; }
    .people-info { display: inline-flex; color: var(--color-text-secondary); cursor: help; }
    .pm { display: flex; flex-direction: column; gap: var(--space-3); }
    .pm-list { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-3); }
    .pm-group { display: flex; flex-direction: column; }
    .pm-group-head { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0; border-bottom: 1px solid var(--color-divider); font-weight: var(--font-weight-semi); }
    .pm-count { margin-left: auto; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .pm-person { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0 var(--space-1) var(--space-6); }
    .pm-sub { margin-left: auto; font-size: var(--text-caption1-size); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .perm-hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .perm-sub { padding: var(--space-2) 0 var(--space-3); border-bottom: 1px solid var(--color-divider); }
    .perm-route { display: flex; gap: var(--space-2); align-items: flex-start; margin-top: var(--space-3); }
    .perm-route fvdr-icon { flex: none; margin-top: 2px; color: var(--color-info-500); }
    .link-btn { align-self: flex-start; border: 0; background: none; padding: var(--space-2) 0; color: var(--color-primary-600); cursor: pointer; font-size: var(--text-caption1-size); }

    .route { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0; }
    .route-dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-stone-600); flex-shrink: 0; }
    .route-dot--reject { background: var(--color-error-500); }
    .route-node { font-weight: var(--font-weight-semi); white-space: nowrap; }
    .route-label { color: var(--color-text-secondary); font-size: var(--text-caption1-size); margin-left: auto; }
    .route-input { flex: 1; min-width: 0; border: 1px solid var(--color-stone-400); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); font: inherit; font-size: var(--text-caption1-size); }
    .route-input:focus { outline: none; border-color: var(--color-primary-500); }
    .route-arrow { color: var(--color-stone-600); }

    .role, .create-role { display: flex; align-items: center; gap: var(--space-3); width: 100%; text-align: left; border: 1px solid transparent; background: none; padding: var(--space-2); border-radius: var(--radius-md); cursor: pointer; color: inherit; }
    .role:hover { background: var(--color-stone-200); }
    .role:hover .role-plus { opacity: 1; }
    .role-plus { opacity: 0; color: var(--color-primary-600); }
    .role-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .role-name { font-weight: var(--font-weight-semi); display: flex; align-items: center; gap: var(--space-2); }
    .role-desc { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .role-tag { font-size: var(--text-caption2-size); font-weight: var(--font-weight-regular); color: var(--color-warning-700); background: var(--color-warning-50); border-radius: var(--radius-sm); padding: 0 var(--space-1); }
    .create-role { margin-top: var(--space-3); border: 1px dashed var(--color-stone-500); }
    .create-role:hover { border-color: var(--color-primary-500); background: var(--color-primary-50); }
    .create-icon { width: 32px; height: 32px; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; background: var(--color-stone-200); color: var(--color-text-secondary); }

    /* prefs */
    .prefs { flex: 1; overflow-y: auto; }
    .prefs-inner { max-width: 640px; padding: var(--space-6); display: flex; flex-direction: column; }
    .prefs-title { margin: 0 0 var(--space-4); font-size: var(--text-h3-size); }
    .pref { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-4) 0; border-bottom: 1px solid var(--color-divider); }
    .pref--col { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
    .summary { margin-top: var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); }
    .summary-row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .sum-chip { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); background: var(--color-stone-200); }

    .footer { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-divider); flex-shrink: 0; }
    .footer-hint { font-size: var(--text-caption1-size); color: var(--color-error-600); }

    .cr { display: flex; flex-direction: column; gap: var(--space-4); }
    .cr-row { display: flex; flex-direction: column; gap: var(--space-2); }
  `],
})
export class QnaSetupDemoComponent {
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLDivElement>;
  readonly toast = inject(ToastService);

  readonly qPerms = Q_PERMS;
  readonly aPerms = A_PERMS;

  readonly avatarColors = AVATAR_COLORS;
  colorOpen = false;
  /** Avatar colour of a role: chosen one, else blue for question side, orange for custom, green for answer side. */
  avatar(n: FlowNode) {
    const id: AvatarColor = n.color ?? (n.side === 'question' ? 'blue' : n.custom ? 'orange' : 'green');
    return AVATAR_COLORS.find(c => c.id === id)!;
  }
  setColor(n: FlowNode, c: AvatarColor) { n.color = c; this.colorOpen = false; }

  sidebarCollapsed = true;
  navItems: SidebarNavItem[] = [
    { id: 'overview',     icon: 'nav-overview',     iconActive: 'nav-overview-active',     label: 'Dashboard',    active: false },
    { id: 'projects',     icon: 'nav-projects',     iconActive: 'nav-projects-active',     label: 'Documents',    active: false },
    { id: 'participants', icon: 'nav-participants', iconActive: 'nav-participants-active', label: 'Participants', active: false },
    { id: 'qna',          icon: 'nav-qa',           iconActive: 'nav-qa-active',           label: 'Q&A',          active: true  },
    { id: 'reports',      icon: 'nav-reports',      iconActive: 'nav-reports-active',      label: 'Reports',      active: false },
    { id: 'settings',     icon: 'nav-settings',     iconActive: 'nav-settings-active',     label: 'Settings',     active: false },
  ];
  breadcrumbs = [{ id: 'qna', label: 'Q&A' }, { id: 'setup', label: 'Setup' }];
  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'help', icon: 'help' },
  ];

  step: 1 | 2 | 3 = 1;

  // ── multiple workflows ──
  // Keys: DEFAULT_WF, 'cat:<name>', 'team:<id>', 'ws:<id>'. Category and team splits inherit the default
  // until customized; separate workflows (one per deal) are always their own.
  readonly DEFAULT_WF = '__default';
  readonly OVERVIEW = '__all';
  overviewGroups: { key: string; label: string; sub: string; x: number; y: number; w: number; h: number; color?: string }[] = [];
  multiWf = false;
  wfSplit: 'category' | 'team' | 'separate' = 'category';
  get splitLabel() { return this.wfSplit === 'category' ? 'by category' : this.wfSplit === 'team' ? 'by question team' : 'separate'; }
  get splitNoun() { return this.wfSplit === 'team' ? 'question team' : 'category'; }
  activeWf = this.DEFAULT_WF;
  customWf = new Map<string, { nodes: FlowNode[]; edges: FlowEdge[] }>();
  private defaultWf: { nodes: FlowNode[]; edges: FlowEdge[] } | null = null;
  workspaces: { id: string; name: string }[] = [];
  private wsSeq = 1;
  trackKey = (_: number, t: { key: string }) => t.key;
  wfTabs(): { key: string; label: string; color?: string }[] {
    const src = this.wfSplit === 'category' ? this.categories.map(c => ({ key: 'cat:' + c.name, label: c.name, color: c.color }))
      : this.wfSplit === 'team' ? this.teams.map(t => ({ key: 'team:' + t.id, label: t.name }))
      : this.workspaces.map(w => ({ key: 'ws:' + w.id, label: w.name }));
    return this.stable('wfTabs', this.wfSplit + '|' + src.map(t => t.key + t.label).join(','), () => src);
  }
  wfLabel(key: string): string {
    if (key === this.DEFAULT_WF) return 'All categories';
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'team') return this.teams.find(t => t.id === id)?.name ?? 'Team';
    if (kind === 'ws') return this.workspaces.find(w => w.id === id)?.name ?? 'Workflow';
    return id;
  }
  /** customized keys of the current split */
  customKeys(): string[] {
    const prefix = this.wfSplit === 'category' ? 'cat:' : 'team:';
    const keys = [...this.customWf.keys()].filter(k => k.startsWith(prefix));
    return this.stable('customKeys', keys.join('|'), () => keys);
  }
  /** a category or team that still follows the default — shown read-only */
  get inherited(): boolean { return this.multiWf && this.activeWf !== this.DEFAULT_WF && this.activeWf !== this.OVERVIEW && !this.customWf.has(this.activeWf); }
  /** frame titles keep the same on-screen size at any zoom, so workflows stay findable when zoomed out */
  get groupHeadPx(): number { return Math.round(14 / this.zoom); }
  get editable(): boolean { return this.templateConfirmed && !this.inherited && this.activeWf !== this.OVERVIEW; }
  /** keep edits of the workflow on screen before switching away */
  private stashActive() {
    if (this.activeWf === this.DEFAULT_WF) this.defaultWf = { nodes: this.nodes, edges: this.edges };
    else if (this.customWf.has(this.activeWf)) this.customWf.set(this.activeWf, { nodes: this.nodes, edges: this.edges });
  }
  private show(key: string) {
    this.overviewGroups = [];
    if (key === this.OVERVIEW) { this.activeWf = key; this.buildOverview(); return; }
    this.activeWf = key;
    const w = (key !== this.DEFAULT_WF && this.customWf.get(key)) || this.defaultWf;
    if (w) { this.nodes = w.nodes; this.edges = w.edges; }
    this.selectedId = null;
    this.pendingInsert = null;
    setTimeout(() => this.fit(), 0);
  }
  /** every workflow of the current split, stacked on one canvas, read-only */
  private buildOverview() {
    const def = this.defaultWf ?? { nodes: this.nodes, edges: this.edges };
    const sets: { key: string; label: string; sub: string; wf: { nodes: FlowNode[]; edges: FlowEdge[] } }[] = [];
    if (this.wfSplit === 'separate') {
      this.workspaces.forEach(w => { const wf = this.customWf.get('ws:' + w.id); if (wf) sets.push({ key: 'ws:' + w.id, label: w.name, sub: 'Own people and questions', wf }); });
    } else {
      const tabs = this.wfTabs();
      const inheriting = tabs.filter(t => !this.customWf.has(t.key)).map(t => t.label);
      sets.push({ key: this.DEFAULT_WF, label: 'All categories', sub: inheriting.length ? 'Used by ' + inheriting.join(', ') : 'Not used — every ' + this.splitNoun + ' has its own', wf: def });
      tabs.filter(t => this.customWf.has(t.key)).forEach(t => sets.push({ key: t.key, label: t.label, sub: this.wfSplit === 'team' ? 'Questions from ' + t.label : t.label + ' questions only', wf: this.customWf.get(t.key)! }));
    }
    const nodes: FlowNode[] = [], edges: FlowEdge[] = [];
    // two columns of frames; each row is as tall as its tallest frame
    const GAP = 64, COLS = 2;
    let rowTop = 40, rowH = 0, colX = 40;
    sets.filter(set => set.wf.nodes.length).forEach((set, i) => {
      if (i % COLS === 0 && i) { rowTop += rowH + GAP; rowH = 0; colX = 40; }
      const minX = Math.min(...set.wf.nodes.map(n => n.x)), minY = Math.min(...set.wf.nodes.map(n => n.y));
      const maxX = Math.max(...set.wf.nodes.map(n => n.x + NODE_W)), maxY = Math.max(...set.wf.nodes.map(n => n.y + NODE_H));
      const w = Math.max(maxX - minX + 160, 980), h = maxY - minY + 96 + 120;
      const dx = colX + 80 - minX, dy = rowTop + 120 - minY, p = i + '~';
      set.wf.nodes.forEach(n => nodes.push({ ...n, id: p + n.id, x: n.x + dx, y: n.y + dy }));
      set.wf.edges.forEach(e => edges.push({ ...e, id: p + e.id, from: p + e.from, to: p + e.to }));
      this.overviewGroups.push({ key: set.key, label: set.label, sub: set.sub, x: colX, y: rowTop, w, h, color: set.key.startsWith('cat:') ? this.categories.find(c => 'cat:' + c.name === set.key)?.color : undefined });
      colX += w + GAP;
      rowH = Math.max(rowH, h);
    });
    this.nodes = nodes;
    this.edges = edges;
    this.selectedId = null;
    this.pendingInsert = null;
    setTimeout(() => this.fit(), 0);
  }
  switchWf(key: string) {
    if (key === this.activeWf) return;
    this.stashActive();
    this.show(key);
  }
  setMultiWf(on: boolean) {
    this.stashActive();
    this.multiWf = on;
    this.show(this.DEFAULT_WF);
    if (!on && this.customWf.size) this.toast.show({ variant: 'info', message: 'One workflow for all questions now. Your other workflows are kept if you switch back.' });
  }
  customizeWf(key: string) {
    const base = this.defaultWf ?? { nodes: this.nodes, edges: this.edges };
    const nodes: FlowNode[] = structuredClone(base.nodes);
    if (key.startsWith('cat:')) this.scopeToCategory(nodes, key.slice(4));
    this.customWf.set(key, { nodes, edges: structuredClone(base.edges) });
    this.show(key);
    this.toast.show({ variant: 'success', message: `${this.wfLabel(key)} has its own workflow now — change its roles, people or routing` });
  }
  resetWf(key: string) {
    this.customWf.delete(key);
    this.show(key);
    this.toast.show({ variant: 'info', message: `${this.wfLabel(key)} follows the All categories workflow again` });
  }

  /** the demo has one standard template, applied up front */
  templateConfirmed = true;
  templateId: TemplateId = 'experts';
  assignItems: SegmentItem[] = [
    { id: 'manual', label: 'Manual', icon: 'edit' },
    { id: 'auto', label: 'Auto by category', icon: 'sparkle' },
  ];
  libTabs: TabItem[] = [{ id: 'roles', label: 'Roles' }, { id: 'teams', label: 'Teams' }, { id: 'people', label: 'People' }];
  libTab = 'roles';
  nodeTab = 'people';
  roleQuery = '';
  peopleQuery = '';
  /** project participants + people invited by email in this session */
  people: Person[] = [...PEOPLE];
  teams: QuestionTeam[] = [];
  teamToDelete: QuestionTeam | null = null;
  inviteFor: string | null = null;
  inviteEmail = '';
  inviteError = '';
  inviteTeam = '';
  newCategory = '';
  categories = [
    { name: 'Finance', color: 'teal' },
    { name: 'Legal', color: 'green' },
    { name: 'Taxes', color: 'blue' },
    { name: 'HR', color: 'orange' },
    { name: 'Accounting', color: 'red' },
    { name: 'Marketing', color: 'grey' },
    { name: 'Corporate', color: 'teal' },
  ];
  sideOptions: RadioOption[] = [{ value: 'question', label: 'Question side' }, { value: 'answer', label: 'Answer side' }];

  customRoles: RoleDef[] = [];
  nodes: FlowNode[] = [];
  edges: FlowEdge[] = [];
  selectedId: string | null = null;
  hoverEdgeId: string | null = null;
  pendingInsert: PendingInsert = null;

  zoom = 1;
  panX = 0;
  panY = 0;
  panning = false;
  private panStart = { x: 0, y: 0, px: 0, py: 0 };
  dragNodeId: string | null = null;
  dragMoved = false;
  private dragStart = { x: 0, y: 0, nx: 0, ny: 0 };
  dropNodeId: string | null = null;
  canvasDropActive = false;
  private seq = 1;

  createOpen = false;
  draft = { name: '', side: 'answer' as Side, base: 'coordinator', perms: {} as Record<string, boolean> };

  prefs = [
    { label: 'Extended email notifications', hint: 'Include subject, author, priority, category, message text, and attachments in all Q&A notifications', on: false },
    { label: 'Team name visibility', hint: 'Display the name of the team that submitted a question to assigned experts', on: true },
    { label: 'Answer side anonymity', hint: 'Show aliases instead of real answer side participant names', on: false },
    { label: 'Question limits', hint: 'Set the number of questions that can be submitted per time period and priority', on: false },
  ];
  indexingOptions: RadioOption[] = [{ value: 'random', label: 'Random ID' }, { value: 'seq', label: 'Sequential numbering' }];
  indexing = 'random';

  constructor() {
    this.loadTemplate('experts');
    this.seedCategoryWorkflows();
  }
  /** Finance and Legal start with their own workflows; every other category follows All categories */
  private seedCategoryWorkflows() {
    const def = { nodes: this.nodes, edges: this.edges };
    const own = (cat: string, extra: () => void = () => {}) => {
      this.nodes = structuredClone(def.nodes);
      this.edges = structuredClone(def.edges);
      this.scopeToCategory(this.nodes, cat);
      extra();
      this.customWf.set('cat:' + cat, { nodes: this.nodes, edges: this.edges });
    };
    // Finance: Finance experts, an approver, the coordinator sends the final answer
    own('Finance', () => {
      const a = this.newNode(this.roleDef('approver')!, 0, 0);
      a.members = [{ personId: 'p13', categories: ['Finance'] }];
      this.nodes = [...this.nodes, a];
      this.routeApprovedToCoordinator();
    });
    // Legal: same route as the default, legal experts only
    own('Legal');
    this.nodes = def.nodes;
    this.edges = def.edges;
    this.defaultWf = def;
  }

  // ── lookups ───────────────────────────────────────────────────────────────
  trackById = (_: number, x: { id: string }) => x.id;
  trackSelf = (_: number, x: string) => x;
  trackGroup = (_: number, g: { group: string }) => g.group;

  private readonly sideCache = new Map<string, { key: string; out: Port[]; free: Port[] }>();
  private portsOf(n: FlowNode) {
    const out = [...new Set(this.edges.filter(e => e.from === n.id).map(e => e.fs))] as Port[];
    const used = new Set<Port>([...out, ...this.edges.filter(e => e.to === n.id).map(e => e.ts)]);
    const free = (['t', 'r', 'b', 'l'] as Port[]).filter(p => !used.has(p));
    const key = out.join('') + '|' + free.join('');
    const hit = this.sideCache.get(n.id);
    if (hit && hit.key === key) return hit;
    const v = { key, out, free };
    this.sideCache.set(n.id, v);
    return v;
  }
  /** Sides where a message leaves this role. */
  outPorts(n: FlowNode): Port[] { return this.portsOf(n).out; }
  /** Sides with no connection — the "+" appears there on hover. */
  freeSides(n: FlowNode): Port[] { return this.portsOf(n).free; }

  /** Divider between question side (left) and answer side (right). */
  get lanes(): { x: number; top: number; height: number } | null {
    if (this.activeWf === this.OVERVIEW) return null;
    const q = this.nodes.filter(n => n.side === 'question'), a = this.nodes.filter(n => n.side === 'answer');
    if (!q.length || !a.length) return null;
    const qRight = Math.max(...q.map(n => n.x + NODE_W)), aLeft = Math.min(...a.map(n => n.x));
    if (qRight >= aLeft) return null;
    const top = Math.min(...this.nodes.map(n => n.y)) - 56;
    const bottom = Math.max(...this.nodes.map(n => n.y + NODE_H)) + 120;
    return { x: Math.round((qRight + aLeft) / 2), top, height: bottom - top };
  }
  /** Re-pick ports of user-made edges from geometry so the arrow points the way the message travels. */
  private autoPorts() {
    this.edges.forEach(e => {
      if (!e.auto) return;
      const a = this.nodeById(e.from), b = this.nodeById(e.to);
      if (!a || !b) return;
      const dx = (b.x + NODE_W / 2) - (a.x + NODE_W / 2), dy = (b.y + NODE_H / 2) - (a.y + NODE_H / 2);
      if (Math.abs(dx) * (NODE_H / NODE_W) >= Math.abs(dy)) { e.fs = dx >= 0 ? 'r' : 'l'; e.ts = dx >= 0 ? 'l' : 'r'; }
      else { e.fs = dy >= 0 ? 'b' : 't'; e.ts = dy >= 0 ? 't' : 'b'; }
    });
  }
  /** Question-side roles must sit left of every answer-side role; re-layout if not. */
  private enforceLanes() {
    const q = this.nodes.filter(n => n.side === 'question'), a = this.nodes.filter(n => n.side === 'answer');
    if (q.length && a.length && Math.max(...q.map(n => n.x + NODE_W)) + 40 > Math.min(...a.map(n => n.x))) this.tidy();
    else this.autoPorts();
  }
  person(id: string): Person { return this.people.find(p => p.id === id)!; }
  tone(id: string) { return TONES[this.person(id).tone % TONES.length]; }
  nodeById(id: string) { return this.nodes.find(n => n.id === id); }
  get selectedNode(): FlowNode | undefined { return this.selectedId ? this.nodeById(this.selectedId) : undefined; }
  get allRoles(): RoleDef[] { return [...STANDARD_ROLES, ...this.customRoles]; }
  roleDef(key: string) { return this.allRoles.find(r => r.key === key); }
  /** empty roles in every workflow that is in use, not just the one on screen */
  get wfErrors(): { key: string; label: string; node: FlowNode }[] {
    if (!this.multiWf) return this.nodes.filter(n => !n.members.length).map(node => ({ key: this.activeWf, label: '', node }));
    const live = (key: string, wf: { nodes: FlowNode[] } | null | undefined) =>
      key === this.activeWf ? this.nodes : (wf?.nodes ?? []);
    const sets: { key: string; nodes: FlowNode[] }[] = this.wfSplit === 'separate'
      ? this.workspaces.map(w => ({ key: 'ws:' + w.id, nodes: live('ws:' + w.id, this.customWf.get('ws:' + w.id)) }))
      : [{ key: this.DEFAULT_WF, nodes: live(this.DEFAULT_WF, this.defaultWf ?? { nodes: this.nodes }) },
         ...this.wfTabs().filter(t => this.customWf.has(t.key)).map(t => ({ key: t.key, nodes: live(t.key, this.customWf.get(t.key)) }))];
    return sets.flatMap(set => set.nodes.filter(n => !n.members.length).map(node => ({ key: set.key, label: this.wfLabel(set.key), node })));
  }
  get errorNodes(): FlowNode[] { return this.wfErrors.map(e => e.node); }
  get errorNamesLabel(): string { return this.wfErrors.map(e => e.label ? `${e.node.name} (${e.label})` : e.node.name).join(', '); }
  permsFor(n: FlowNode): PermDef[] {
    const rp = this.rolePerms(n);
    if (rp) return [...rp.config, ...rp.open];
    return n.side === 'question' ? Q_PERMS : A_PERMS;
  }
  rolePerms(n: FlowNode): RolePerms | null {
    if (n.custom) return null;
    // a coordinator assigns to experts and edits their drafts only when the workflow has experts
    if (n.roleKey === 'coordinator' && !this.hasExpert) return this.coordinatorSolo;
    return ROLE_PERMS[n.roleKey] ?? null;
  }
  private readonly coordinatorSolo: RolePerms = { fixed: [AP.coordSeeAll, AP.provideNoExpert], config: [AP.anyStage], open: [] };
  fixedLimited(n: FlowNode, p: PermDef) { return p.key === 'seeAll' && n.roleKey === 'approver' && !!n.perms['seeApprovalOnly']; }
  categoryOptions() {
    return this.stable('catOpts', this.categories.map(c => c.name).join('|'), () => this.categories.map(c => ({ value: c.name, label: c.name })));
  }
  /** Who gives final sign-off — decides how the answer travels. */
  private finalOwner(): FlowNode | undefined { return this.nodes.find(x => x.side === 'answer' && x.perms['finalSignoff']); }
  routeHint(n: FlowNode): string {
    if (n.roleKey !== 'coordinator' && n.roleKey !== 'approver') return '';
    const f = this.finalOwner();
    if (!f) return 'Route now: expert → coordinator → approvers → bidder.';
    if (f.roleKey === 'coordinator') return `Route now: expert → approvers → ${f.name} → bidder. Final sign-off: ${f.name}.`;
    return `Route now: expert → coordinator → approvers → ${f.name} → bidder. Final sign-off: ${f.name}.`;
  }
  setPerm(n: FlowNode, key: string, on: boolean) {
    n.perms[key] = on;
    if (key === 'anyStage' && n.roleKey === 'approver') {
      this.syncApproverRoute();
      this.toast.show({ variant: 'success', message: on ? `Routing updated: ${n.name} sends the final answer to the bidder` : 'Routing updated: approved answers go back to the coordinator, who sends them' });
      return;
    }
    if (key !== 'finalSignoff') return;
    if (on) {
      // only one role can give final sign-off
      this.nodes.filter(x => x !== n && x.perms['finalSignoff']).forEach(x => {
        x.perms['finalSignoff'] = false;
        this.toast.show({ variant: 'info', message: `Final sign-off moved from ${x.name} to ${n.name}` });
      });
    }
    if (this.rebuildAnswerRoute()) this.toast.show({ variant: 'success', message: this.routeHint(n).replace('Route now: ', 'Routing updated: ') });
  }

  /**
   * Re-draws the answer side from who has final sign-off:
   *   coordinator signs off → expert → approvers → coordinator → bidder
   *   otherwise             → expert → coordinator → approvers → bidder (sign-off approver last)
   * Only for the standard chain (one coordinator, one expert role, approvers); returns false otherwise.
   */
  /** a rejected answer always goes back to whoever drafted it: the expert when there is one */
  get hasExpert(): boolean { return this.nodes.some(n => n.roleKey === 'expert'); }
  private rebuildAnswerRoute(quiet = false, expertOrder?: FlowNode[]): boolean {
    // without an expert there is only the coordinator to send it back to
    if (!this.hasExpert) this.rejectTo = 'coordinator';
    if (this.rejectTo === 'lastExpert' && this.experts().length < 2) this.rejectTo = 'expert';
    const a = this.nodes.filter(x => x.side === 'answer' && x.roleKey !== 'viewer');
    const cs = a.filter(x => x.roleKey === 'coordinator');
    const xs = expertOrder ?? this.orderedExperts();
    let aps = this.orderedApprovers();
    const s = this.nodes.find(x => x.side === 'question' && this.edges.some(e => e.from === x.id && e.to === cs[0]?.id));
    if (cs.length !== 1 || !xs.length || !s || a.length !== 1 + xs.length + aps.length) {
      if (!quiet) this.toast.show({ variant: 'warning', message: 'This flow has extra roles — update the connections on the canvas by hand' });
      return false;
    }
    const c = cs[0], x = xs[0], xl = xs[xs.length - 1], K = xs.length;
    const fin = this.finalOwner();
    if (fin?.roleKey === 'approver') aps = [...aps.filter(p => p !== fin), fin];
    const coordFinal = !aps.length || fin === c;
    const N = aps.length;
    // a rejected answer goes back to the first expert, the last expert, or the coordinator
    const back = this.rejectTo === 'coordinator' ? c : this.rejectTo === 'lastExpert' ? xl : x;
    const col = (k: number) => c.x + k * COL_W, row = (r: number) => 90 + r * ROW_H;
    const ed = (from: FlowNode, to: FlowNode, fs: Port, ts: Port, label: string, kind: EdgeKind = 'main'): FlowEdge =>
      ({ id: 'e' + this.seq++, from: from.id, to: to.id, fs, ts, label, kind });
    const keep = this.edges.filter(e => this.nodeById(e.from)?.side === 'question' && this.nodeById(e.to)?.side === 'question' || (e.to === c.id && e.from === s.id));
    const out: FlowEdge[] = [ed(c, x, 't', 'l', x.assignMode === 'auto' ? 'Auto-assigns by category' : 'Assigns')];
    // experts run along the top row, each passing the draft to the next
    c.y = row(1);
    xs.forEach((e, i) => { e.x = col(i + 1); e.y = row(0); });
    xs.slice(1).forEach((e, i) => out.push(ed(xs[i], e, 'r', 'l', 'Passes draft')));
    if (!N) {
      out.push(ed(xl, c, 'b', K > 1 ? 't' : 'r', 'Proposes answer', 'return'));
      out.push(ed(c, s, 'b', 'b', 'Sends answer', 'return'));
    } else if (coordFinal) {
      // approvers on the top row after the experts, the last one drops below and hands back to the coordinator
      aps.forEach((p, i) => {
        const last = i === N - 1;
        p.x = N === 1 ? col(K) : col(last ? K + N - 1 : K + i + 1); p.y = last ? row(2) : row(0);
      });
      out.push(N === 1 ? ed(xl, aps[0], 'b', 't', 'Suggests draft') : ed(xl, aps[0], 'r', 'l', 'Suggests draft'));
      aps.slice(1).forEach((p, i) => out.push(i + 1 === N - 1 ? ed(aps[i], p, 'b', 't', `Approved · level ${i + 1}`) : ed(aps[i], p, 'r', 'l', `Approved · level ${i + 1}`)));
      out.push(ed(aps[N - 1], c, 'l', 'r', N > 1 ? `Approved · level ${N}` : 'Approved'));
      out.push(back === c
        ? { ...ed(aps[0], c, 'l', 'r', 'Rejects', 'reject'), auto: true }
        : back === x && K === 1 && N === 1 ? ed(aps[0], x, 'r', 'r', 'Rejects', 'reject')
        : back === x && K === 1 ? ed(aps[0], x, 't', 't', 'Rejects', 'reject')
        : { ...ed(aps[0], back, 't', 't', 'Rejects', 'reject'), auto: true });
      aps.slice(1).forEach((p, i) => out.push(this.rejectChain === 'previous'
        ? ed(p, aps[i], 'r', 'r', 'Rejects', 'reject')
        : { ...ed(p, back, 'l', 'r', 'Rejects', 'reject'), auto: true }));
      out.push(ed(c, s, 'b', 'b', 'Submits final answer', 'return'));
    } else {
      // the last expert hands back to the coordinator, approvers run along the bottom row, the last one releases
      aps.forEach((p, i) => { p.x = col(i + 1); p.y = row(2); });
      out.push(ed(xl, c, 'b', K > 1 ? 't' : 'r', 'Proposes answer', 'return'));
      out.push(ed(c, aps[0], 'b', 'l', 'Sends for approval'));
      aps.slice(1).forEach((p, i) => out.push(ed(aps[i], p, 'r', 'l', `Approved · level ${i + 1}`)));
      out.push(back === c
        ? ed(aps[0], c, 't', 'r', 'Rejects', 'reject')
        : { ...ed(aps[0], back, 't', 'b', 'Rejects', 'reject'), auto: true });
      aps.slice(1).forEach((p, i) => out.push(this.rejectChain === 'previous'
        ? ed(p, aps[i], 't', 'b', 'Rejects', 'reject')
        : { ...ed(p, back, 't', 'r', 'Rejects', 'reject'), auto: true }));
      out.push(ed(aps[N - 1], s, 'b', 'b', fin ? 'Final sign-off · sends answer' : 'Final answer', 'return'));
    }
    this.edges = [...keep, ...out];
    this.autoPorts();
    this.renumberRoles();
    setTimeout(() => this.fit(), 0);
    return true;
  }

  // ── routing settings ──
  rejectTo: 'expert' | 'lastExpert' | 'coordinator' = 'coordinator';
  rejectChain: 'previous' | 'first' = 'previous';
  readonly afterApproveOptions: RadioOption[] = [
    { value: 'direct', label: 'Straight to the question side' },
    { value: 'coordinator', label: 'Back to the answer coordinator, who sends it' },
  ];
  rejectToOptions(): RadioOption[] {
    const many = this.experts().length > 1;
    return this.stable('rejectTo', String(many), () => many
      ? [{ value: 'expert', label: 'The first expert' }, { value: 'lastExpert', label: 'The last expert' }, { value: 'coordinator', label: 'The answer coordinator' }]
      : [{ value: 'expert', label: 'The expert' }, { value: 'coordinator', label: 'The answer coordinator' }]);
  }
  setRejectTo(v: string) { this.rejectTo = v as 'expert' | 'lastExpert' | 'coordinator'; this.applyRouting(); }
  private rejectTargetLabel(): string {
    return this.rejectTo === 'coordinator' ? 'The answer coordinator'
      : this.experts().length < 2 ? 'The expert' : this.rejectTo === 'lastExpert' ? 'The last expert' : 'The first expert';
  }
  rejectChainOptions(): RadioOption[] {
    return this.stable('rejectChain', this.rejectTo + this.experts().length, () => [
      { value: 'previous', label: 'The previous approver' },
      { value: 'first', label: this.rejectTargetLabel() },
    ]);
  }
  approvers(): FlowNode[] { return this.nodes.filter(x => x.roleKey === 'approver'); }
  experts(): FlowNode[] { return this.nodes.filter(x => x.roleKey === 'expert'); }
  /** experts in the order the draft reaches them */
  orderedExperts(): FlowNode[] {
    const order = this.stepMap();
    return this.experts().sort((p, q) => (order.get(p.id)?.[0] ?? 99) - (order.get(q.id)?.[0] ?? 99));
  }
  /** the expert before this one in the chain — only the first expert has the manual / auto assignment setting */
  prevExpert(n: FlowNode): FlowNode | undefined {
    if (n.roleKey !== 'expert') return undefined;
    const xs = this.orderedExperts(), i = xs.indexOf(n);
    return i > 0 ? xs[i - 1] : undefined;
  }
  /** a second Expert or Approver gets a number: Expert 2, Answer approver 2 … */
  private renumberRoles() {
    this.orderedExperts().slice(1).forEach(x => x.assignMode = 'manual');
    const list = (k: string) => k === 'expert' ? this.orderedExperts() : this.orderedApprovers();
    ['expert', 'approver'].forEach(k => {
      const base = this.roleDef(k)!.name;
      const re = new RegExp('^' + base + '( \\d+)?$');
      list(k).forEach((n, i) => { if (re.test(n.name)) n.name = i ? `${base} ${i + 1}` : base; });
    });
  }
  private coordinator(): FlowNode | undefined { return this.nodes.find(x => x.roleKey === 'coordinator'); }
  get afterApprove(): 'direct' | 'coordinator' { return this.coordinator()?.perms['finalSignoff'] ? 'coordinator' : 'direct'; }
  setAfterApprove(v: string) {
    const last = this.lastApprover();
    if (last) { if (!!last.perms['anyStage'] !== (v === 'direct')) this.setPerm(last, 'anyStage', v === 'direct'); return; }
    const c = this.coordinator();
    if (c && (v === 'coordinator') !== !!c.perms['finalSignoff']) this.setPerm(c, 'finalSignoff', v === 'coordinator');
  }
  setRejectChain(v: string) { this.rejectChain = v as 'previous' | 'first'; this.applyRouting(); }
  /** standard flows are re-drawn; anything else just gets its reject arrows re-pointed */
  private applyRouting() {
    if (this.rebuildAnswerRoute(true)) return;
    const order = this.stepMap();
    const aps = this.approvers().sort((p, q) => (order.get(p.id)?.[0] ?? 99) - (order.get(q.id)?.[0] ?? 99));
    const xs = this.orderedExperts();
    const target = this.rejectTo === 'coordinator' ? this.coordinator() : this.rejectTo === 'lastExpert' ? xs[xs.length - 1] : xs[0];
    if (!target) return;
    this.edges = this.edges.filter(e => !(e.kind === 'reject' && aps.some(p => p.id === e.from)));
    aps.forEach((p, i) => {
      const to = i > 0 && this.rejectChain === 'previous' ? aps[i - 1] : target;
      this.edges.push({ id: 'e' + this.seq++, from: p.id, to: to.id, fs: 't', ts: 'r', label: 'Rejects', kind: 'reject', auto: true });
    });
    this.edges = [...this.edges];
    this.autoPorts();
  }
  /** the main path as a numbered list, ending where the answer reaches the question side */
  routePath(): { node: FlowNode; label: string; end?: boolean }[] {
    const sig = this.edges.map(e => e.from + '>' + e.to + ':' + e.kind + ':' + e.label).join('|') + '#' + this.nodes.map(n => n.id + n.name).join(',');
    return this.stable('routePath', sig, () => {
      const out: { node: FlowNode; label: string; end?: boolean }[] = [];
      // the start has no incoming step; when the answer returns to the submitter, start from the question side
      let cur = this.nodes.find(n => n.roleKey !== 'viewer' && !this.edges.some(e => e.to === n.id && e.kind !== 'reject'))
        ?? this.nodes.find(n => n.side === 'question');
      const used = new Set<string>();
      for (let i = 0; cur && i < 20; i++) {
        const next = this.edges.find(e => e.from === cur!.id && e.kind !== 'reject' && !used.has(e.id));
        out.push({ node: cur, label: next?.label ?? '' });
        if (!next) break;
        used.add(next.id);
        const to = this.nodeById(next.to);
        if (cur.side === 'answer' && to?.side === 'question') { out.push({ node: to, label: 'Receives the final answer', end: true }); break; }
        cur = to;
      }
      return out;
    });
  }
  rejectEdges(): FlowEdge[] { return this.edges.filter(e => e.kind === 'reject'); }
  rolesOf(personId: string): FlowNode[] { return this.nodes.filter(n => n.members.some(m => m.personId === personId)); }
  rolesLabel(personId: string): string { return this.rolesOf(personId).map(n => n.name).join(' · '); }
  otherRoles(personId: string, n: FlowNode): string {
    return this.rolesOf(personId).filter(r => r.id !== n.id).map(r => r.name).join(', ');
  }
  dualCount(n: FlowNode): number { return n.members.filter(m => this.rolesOf(m.personId).length > 1).length; }
  incoming(n: FlowNode) { return this.edges.filter(e => e.to === n.id); }
  outgoing(n: FlowNode) { return this.edges.filter(e => e.from === n.id); }
  isEdgeActive(e: FlowEdge) { return this.hoverEdgeId === e.id || this.isEdgeRelated(e); }
  isEdgeRelated(e: FlowEdge) { return !!this.selectedId && (e.from === this.selectedId || e.to === this.selectedId); }

  isCustomized(n: FlowNode): boolean {
    const def = this.roleDef(n.roleKey);
    if (!def || n.custom) return false;
    return this.permsFor(n).some(p => !!def.perms[p.key] !== !!n.perms[p.key]);
  }
  resetPerms(n: FlowNode) {
    const def = this.roleDef(n.roleKey);
    if (!def) return;
    const hadFinal = !!n.perms['finalSignoff'];
    n.perms = { ...def.perms };
    if (n.roleKey === 'approver') { this.syncApproverRoute(); return; }
    if (hadFinal !== !!n.perms['finalSignoff']) this.rebuildAnswerRoute();
  }

  teamsOf(n: FlowNode): { team: QuestionTeam; members: Membership[] }[] {
    return this.teams.map(team => ({ team, members: n.members.filter(m => m.teamId === team.id) })).filter(t => t.members.length);
  }
  teamMembers(n: FlowNode, t: QuestionTeam): Membership[] { return n.members.filter(m => m.teamId === t.id); }
  /** unique people of a team across all question-side roles */
  teamPeople(t: QuestionTeam): string[] {
    const ids = [...new Set(this.nodes.filter(n => n.side === 'question').flatMap(n => n.members.filter(m => m.teamId === t.id).map(m => m.personId)))];
    return this.stable('teamPeople:' + t.id, ids.join(','), () => ids);
  }
  teamSummary(t: QuestionTeam): string {
    const parts = this.nodes.filter(n => n.side === 'question')
      .map(n => ({ n, c: n.members.filter(m => m.teamId === t.id).length }))
      .filter(x => x.c)
      .map(x => `${x.c} ${x.n.name.toLowerCase().replace('question ', '')}${x.c === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' · ') : 'No people yet';
  }
  teamOptions(): DropdownOption[] {
    return this.stable('teamOpts', this.teams.map(t => t.id + ':' + t.name).join('|'), () => this.teams.map(t => ({ value: t.id, label: t.name })));
  }
  private teamSeq = 1;
  /** team named after a participant group (templates seed teams from bidder groups) */
  private teamFor(name: string): QuestionTeam {
    let t = this.teams.find(x => x.name === name);
    if (!t) { t = { id: 'qt' + this.teamSeq++, name }; this.teams = [...this.teams, t]; }
    return t;
  }
  newTeam() {
    let i = this.teams.length + 1;
    while (this.teams.some(t => t.name === `Team ${i}`)) i++;
    const t = this.teamFor(`Team ${i}`);
    this.toast.show({ variant: 'success', message: `${t.name} created — rename it and add drafters or submitters` });
  }
  askDeleteTeam(t: QuestionTeam) {
    if (this.teamPeople(t).length) this.teamToDelete = t;
    else this.teams = this.teams.filter(x => x.id !== t.id);
  }
  deleteTeam() {
    const t = this.teamToDelete;
    if (!t) return;
    [this.nodes, this.defaultWf?.nodes ?? [], ...[...this.customWf.values()].map(w => w.nodes)]
      .forEach(list => list.forEach(n => n.members = n.members.filter(m => m.teamId !== t.id)));
    this.teams = this.teams.filter(x => x.id !== t.id);
    this.teamToDelete = null;
    this.toast.show({ variant: 'info', message: `${t.name} deleted` });
  }
  addToTeamOptions(n: FlowNode, t: QuestionTeam): DropdownOption[] {
    const taken = new Set(n.members.filter(m => m.teamId === t.id).map(m => m.personId));
    const sig = [...taken].join(',') + '|' + this.people.length;
    return this.stable('addTeam:' + n.id + ':' + t.id, sig, () => [
      ...[...new Set(this.people.map(p => p.group))].map(g => ({ value: 'group:' + g, label: `All of ${g}`, group: 'Groups' })),
      ...this.people.filter(p => !taken.has(p.id)).map(p => ({ value: p.id, label: p.name, sublabel: p.external ? 'Invited' : p.group, group: 'People' })),
    ]);
  }

  // ── resizable side panel ──
  readonly PANEL_MIN = 392;
  panelW = 392;
  panelResizing = false;
  private panelMax() { return Math.max(this.PANEL_MIN, Math.round(window.innerWidth * 0.7)); }
  private clampPanel(w: number) { return Math.min(this.panelMax(), Math.max(this.PANEL_MIN, Math.round(w))); }
  startPanelResize(ev: MouseEvent) {
    ev.preventDefault();
    const right = (ev.currentTarget as HTMLElement).parentElement!.getBoundingClientRect().right;
    this.panelResizing = true;
    const move = (e: MouseEvent) => { this.panelW = this.clampPanel(right - e.clientX); };
    const up = () => {
      this.panelResizing = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }
  nudgePanel(dx: number) { this.panelW = this.clampPanel(this.panelW + dx); }
  togglePanelWide() { this.panelW = this.panelW > this.PANEL_MIN ? this.PANEL_MIN : this.clampPanel(window.innerWidth * 0.5); }

  // ── add-people modal ──
  peopleModal: { nodeId: string; node?: FlowNode; targets?: FlowNode[]; scope?: string; teamId?: string; category?: string } | null = null;
  peopleSel = new Set<string>();
  pmQuery = '';
  openPeopleModal(n: FlowNode, ctx: { teamId?: string; category?: string; targets?: FlowNode[]; scope?: string } = {}) {
    if (n.side === 'question' && !ctx.teamId) ctx.teamId = this.teams[0]?.id ?? this.teamFor('Team 1').id;
    // keep the node itself: workflows share node ids, so an id alone is ambiguous on step 2
    this.peopleModal = { nodeId: n.id, node: n, ...ctx };
    this.peopleSel = new Set();
    this.pmQuery = '';
  }
  get peopleModalTitle(): string {
    const m = this.peopleModal, n = m && (m.node ?? this.nodeById(m.nodeId));
    if (!m || !n) return '';
    if (m.category) return `Add ${this.roleWord(n, true)} to ${m.category}`;
    if (n.side === 'question') return `Add ${n.roleKey === 'drafter' ? 'question drafters' : 'question submitters'} to ${this.teams.find(t => t.id === m.teamId)?.name ?? 'team'}`;
    return `Add people to ${n.name}`;
  }
  pmIsIn(id: string): boolean {
    const m = this.peopleModal, n = m && (m.node ?? this.nodeById(m.nodeId));
    if (!m || !n) return false;
    if (m.category) return n.members.some(x => x.personId === id && x.categories.includes(m.category!));
    if (n.side === 'question') return n.members.some(x => x.personId === id && x.teamId === m.teamId);
    return n.members.some(x => x.personId === id);
  }
  pmGroups(): { group: string; people: Person[] }[] {
    const q = this.pmQuery.trim().toLowerCase();
    return this.stable('pmGroups', q + '|' + this.people.length, () => [...new Set(this.people.map(p => p.group))]
      .map(group => ({ group, people: this.people.filter(p => p.group === group && (!q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || group.toLowerCase().includes(q))) }))
      .filter(g => g.people.length));
  }
  pmToggle(id: string, on: boolean) { on ? this.peopleSel.add(id) : this.peopleSel.delete(id); }
  pmGroupDone(ps: Person[]) { return ps.every(p => this.pmIsIn(p.id)); }
  pmGroupChecked(ps: Person[]) { return ps.every(p => this.pmIsIn(p.id) || this.peopleSel.has(p.id)); }
  pmToggleGroup(ps: Person[], on: boolean) { ps.filter(p => !this.pmIsIn(p.id)).forEach(p => this.pmToggle(p.id, on)); }
  confirmPeople() {
    const m = this.peopleModal, n = m && (m.node ?? this.nodeById(m.nodeId));
    if (!m || !n) return;
    const ids = [...this.peopleSel];
    ids.forEach(id => {
      (m.targets ?? [n]).forEach(t => this.addMember(t, id, false, m.teamId));
      if (m.category) this.toggleCategory(n.members.find(x => x.personId === id)!, m.category, true);
      // a category's own workflow: its experts and approvers only hold that category
      if (m.scope && (n.roleKey === 'expert' || n.roleKey === 'approver')) n.members.find(x => x.personId === id)!.categories = [m.scope];
    });
    const where = m.category ?? (n.side === 'question' ? this.teams.find(t => t.id === m.teamId)?.name : n.name);
    this.toast.show({ variant: 'success', message: ids.length === 1 ? `${this.person(ids[0]).name} added to ${where}` : `${ids.length} people added to ${where}` });
    if (m.category) this.catCollapsed.delete(m.category);
    this.peopleModal = null;
  }

  // ── external invites ──
  openInvite(n: FlowNode) {
    this.inviteFor = n.id;
    this.inviteEmail = '';
    this.inviteError = '';
    this.inviteTeam = this.teams[0]?.id ?? '';
  }
  invite(n: FlowNode) {
    const email = this.inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.inviteError = 'Enter a valid email address'; return; }
    let p = this.people.find(x => x.email.toLowerCase() === email);
    if (!p) {
      const local = email.split('@')[0].split(/[._-]+/).filter(Boolean);
      const name = local.map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || email;
      const initials = (local[0]?.[0] ?? '?').toUpperCase() + (local[1]?.[0] ?? '').toUpperCase();
      p = { id: 'x' + this.seq++, name, initials, email, group: 'Invited', tone: 0, external: true };
      this.people = [...this.people, p];
    }
    if (n.side === 'question' && !this.teams.length) this.inviteTeam = this.teamFor('Team 1').id;
    this.addMember(n, p.id, false, n.side === 'question' ? (this.inviteTeam || this.teams[0]?.id) : undefined);
    this.inviteFor = null;
    this.toast.show({ variant: 'success', message: `Invitation sent to ${email} — added to ${n.name}` });
  }

  // ── categories ──
  readonly UNASSIGNED = '__unassigned';
  approveModeItems: SegmentItem[] = [
    { id: 'manual', label: 'Any approver', icon: 'participants' },
    { id: 'auto', label: 'By category', icon: 'label' },
  ];
  approverAssignHint(n: FlowNode): string {
    return n.assignMode === 'auto'
      ? 'Answers are approved only by approvers of the same category — e.g. Finance answers go to Finance approvers, Legal to Legal. A category with no approver falls back to any approver.'
      : 'Any approver in this role can approve any answer, whatever its category.';
  }
  roleWord(n: FlowNode, plural = false, cap = false): string {
    const w = (n.roleKey === 'approver' ? 'approver' : 'expert') + (plural ? 's' : '');
    return cap ? w[0].toUpperCase() + w.slice(1) : w;
  }
  catCollapsed = new Set<string>();
  catEdit: string | null = null;
  toggleCatEdit(m: Membership) { this.catEdit = this.catEdit === m.personId ? null : m.personId; }
  memberCats(m: Membership) { return this.categories.filter(c => m.categories.includes(c.name)); }
  toggleCat(name: string) { this.catCollapsed.has(name) ? this.catCollapsed.delete(name) : this.catCollapsed.add(name); }
  membersIn(n: FlowNode, cat: string): Membership[] { return n.members.filter(m => m.categories.includes(cat)); }
  unassignedIn(n: FlowNode): Membership[] { return n.members.filter(m => !m.categories.length); }
  toggleCategory(m: Membership, cat: string, on: boolean) {
    m.categories = on ? [...new Set([...m.categories, cat])] : m.categories.filter(c => c !== cat);
  }
  private readonly catColors = ['teal', 'green', 'blue', 'orange', 'red', 'grey'];
  addingCat = false;
  catToDelete: { name: string; color: string } | null = null;
  /** categories that follow the default workflow */
  defaultCats() {
    const tabs = this.wfTabs().filter(t => !this.customWf.has(t.key));
    return this.stable('defaultCats', tabs.map(t => t.key).join('|'), () => tabs);
  }
  /** categories with their own workflow — they no longer count towards Default */
  customCats() {
    const tabs = this.wfTabs().filter(t => this.customWf.has(t.key));
    return this.stable('customCats', tabs.map(t => t.key).join('|'), () => tabs);
  }
  /** in a category's own workflow, experts and approvers can only hold that category */
  get scopedCategory(): string | null { return this.activeWf.startsWith('cat:') ? this.activeWf.slice(4) : null; }
  wfCategories() {
    const only = this.scopedCategory;
    const list = only ? this.categories.filter(c => c.name === only) : this.categories;
    return this.stable('wfCats', (only ?? '*') + '|' + this.categories.map(c => c.name).join(','), () => list);
  }
  /** keep only the people of that category in expert and approver roles, and only that category on them */
  private scopeToCategory(nodes: FlowNode[], cat: string) {
    nodes.filter(n => n.roleKey === 'expert' || n.roleKey === 'approver').forEach(n => {
      const inCat = n.members.filter(m => m.categories.includes(cat));
      n.members = (inCat.length ? inCat : n.members).map(m => ({ ...m, categories: [cat] }));
    });
  }
  defaultCatsLabel(): string {
    const names = this.defaultCats().map(t => t.label);
    return names.length ? names.join(', ') : 'Every category has its own workflow';
  }
  managingCats = false;
  manageNew = '';
  trackName = (_: number, c: { name: string }) => c.name;
  toggleManage() { this.managingCats = !this.managingCats; this.addingCat = false; this.manageNew = ''; }
  /** categories split by whether they have their own workflow */
  manageCats(own: boolean) {
    const list = this.categories.filter(c => this.customWf.has('cat:' + c.name) === own);
    return this.stable('manage' + own, list.map(c => c.name).join('|'), () => list);
  }
  /** a new category joins All categories */
  addManagedCategory() {
    const name = this.manageNew.trim();
    if (!name) return;
    if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.toast.show({ variant: 'warning', message: `${name} already exists` });
      return;
    }
    this.categories = [...this.categories, { name, color: this.catColors[this.categories.length % this.catColors.length] }];
    this.manageNew = '';
    this.toast.show({ variant: 'success', message: `${name} added to All categories` });
  }
  toggleCatPop() {
    this.managingCats = false;
    this.addingCat = !this.addingCat;
    this.newCategory = '';
    if (this.addingCat) setTimeout(() => (this.canvasRef?.nativeElement.querySelector('.wf-pop-search') as HTMLInputElement | null)?.focus());
  }
  closeCatPop() { this.addingCat = false; this.newCategory = ''; }
  filteredDefaultCats() {
    const q = this.newCategory.trim().toLowerCase();
    const list = this.defaultCats().filter(t => !q || t.label.toLowerCase().includes(q));
    return this.stable('popCats', q + '|' + list.map(t => t.key).join(','), () => list);
  }
  get canCreateCat(): boolean {
    const name = this.newCategory.trim().toLowerCase();
    return !!name && !this.categories.some(c => c.name.toLowerCase() === name);
  }
  /** Enter: create the typed category, or take the only match */
  pickOrCreate() {
    if (this.canCreateCat) { this.addWfCategory(); return; }
    const hit = this.filteredDefaultCats()[0];
    if (hit) this.customizeFromBar(hit.label);
  }
  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    const inside = (ev.target as HTMLElement).closest?.('.wf-add-wrap, fvdr-modal');
    if (inside) return;
    if (this.addingCat) this.closeCatPop();
    this.managingCats = false;
  }
  /** pick a category that follows All categories and give it its own workflow */
  customizeFromBar(v: string | string[]) {
    const name = Array.isArray(v) ? v[0] : v;
    if (!name) return;
    this.closeCatPop();
    this.stashActive();
    this.customizeWf('cat:' + name);
  }
  get activeCategory() { return this.categories.find(c => 'cat:' + c.name === this.activeWf); }
  /** add from the workflow bar and open it — it follows the default until customized */
  addWfCategory() {
    const name = this.newCategory.trim();
    const before = this.categories.length;
    this.addCategory();
    if (this.categories.length === before) return;
    this.addingCat = false;
    this.stashActive();
    this.customizeWf('cat:' + name);
  }
  addCategory() {
    const name = this.newCategory.trim();
    if (!name) return;
    if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.toast.show({ variant: 'warning', message: `${name} already exists` });
      return;
    }
    this.categories = [...this.categories, { name, color: this.catColors[this.categories.length % this.catColors.length] }];
    this.newCategory = '';
  }
  renameCategory(c: { name: string; color: string }, value: string, input?: HTMLInputElement) {
    const name = value.trim();
    if (!name || this.categories.some(x => x !== c && x.name.toLowerCase() === name.toLowerCase())) {
      if (input) input.value = c.name;
      return;
    }
    const old = c.name;
    c.name = name;
    const wf = this.customWf.get('cat:' + old);
    if (wf) { this.customWf.delete('cat:' + old); this.customWf.set('cat:' + name, wf); }
    if (this.activeWf === 'cat:' + old) this.activeWf = 'cat:' + name;
    [this.nodes, this.defaultWf?.nodes ?? [], ...[...this.customWf.values()].map(w => w.nodes)]
      .forEach(list => list.forEach(n => n.members.forEach(m => m.categories = m.categories.map(x => x === old ? name : x))));
    this.categories = [...this.categories];
  }
  deleteCategory(c: { name: string; color: string }) {
    const key = 'cat:' + c.name;
    this.categories = this.categories.filter(x => x !== c);
    this.customWf.delete(key);
    if (this.activeWf === key) this.show(this.DEFAULT_WF);
    else if (this.activeWf === this.OVERVIEW) this.show(this.OVERVIEW);
    // people keep no trace of the category in any workflow
    [this.nodes, this.defaultWf?.nodes ?? [], ...[...this.customWf.values()].map(w => w.nodes)]
      .forEach(list => list.forEach(n => n.members.forEach(m => m.categories = m.categories.filter(x => x !== c.name))));
    this.toast.show({ variant: 'info', message: `Category ${c.name} deleted` });
  }


  nodeSubtitle(n: FlowNode): string {
    if (n.roleKey === 'expert' && this.prevExpert(n)) return `Gets the draft from ${this.prevExpert(n)!.name}`;
    if (n.roleKey === 'expert') return n.assignMode === 'auto' ? 'Auto-assign by category' : 'Assigned manually';
    if (n.roleKey === 'approver' && n.assignMode === 'auto') return 'Approves by category';
    if (n.side === 'question') return n.members.length ? `${this.teamsOf(n).length} question ${this.teamsOf(n).length === 1 ? 'team' : 'teams'}` : 'Question side';
    return this.roleDef(n.roleKey)?.description ?? '';
  }

  /** Step number along the main path, e.g. "Step 3, 5" for a role visited twice. */
  stepLabel(n: FlowNode): string {
    const steps = this.stepMap();
    const s = steps.get(n.id);
    return s && s.length ? 'Step ' + s.join(', ') : '';
  }
  private stepMap(): Map<string, number[]> {
    const map = new Map<string, number[]>();
    // a role that isn't connected yet is never the start; when the answer returns to the submitter, start from the question side
    const starts = this.nodes.filter(n => n.roleKey !== 'viewer' && !this.edges.some(e => e.to === n.id && e.kind !== 'reject') && this.edges.some(e => e.from === n.id));
    let cur = starts[0] ?? this.nodes.find(n => n.side === 'question') ?? this.nodes[0];
    const used = new Set<string>();
    let i = 1;
    while (cur && i < 20) {
      map.set(cur.id, [...(map.get(cur.id) || []), i++]);
      const next = this.edges.find(e => e.from === cur!.id && e.kind !== 'reject' && !used.has(e.id));
      if (!next) break;
      used.add(next.id);
      // the answer going back to the question side ends the journey
      if (cur.side === 'answer' && this.nodeById(next.to)?.side === 'question') break;
      cur = this.nodeById(next.to)!;
    }
    return map;
  }

  orderedNodes(): FlowNode[] {
    const m = this.stepMap();
    return [...this.nodes].sort((a, b) => (m.get(a.id)?.[0] ?? 99) - (m.get(b.id)?.[0] ?? 99));
  }

  /** Stable array so fvdr-tabs doesn't re-render its buttons on every change detection. */
  private readonly nodeTabItems: TabItem[] = [
    { id: 'people', label: 'People', counter: 0 },
    { id: 'permissions', label: 'Permissions' },
    { id: 'routing', label: 'Routing' },
  ];
  nodeTabs(n: FlowNode): TabItem[] {
    this.nodeTabItems[0].counter = n.members.length;
    return this.nodeTabItems;
  }

  // ── templates ─────────────────────────────────────────────────────────────
  loadTemplate(id: TemplateId) {
    this.templateId = id;
    // every template starts as a single workflow
    this.multiWf = false;
    this.wfSplit = 'category';
    this.customWf = new Map();
    this.defaultWf = null;
    this.workspaces = [];
    this.activeWf = this.DEFAULT_WF;
    this.overviewGroups = [];
    this.rejectTo = 'expert';
    this.rejectChain = 'previous';
    this.selectedId = null;
    this.pendingInsert = null;
    this.teams = [];
    const mk = (roleKey: string, col: number, row: number, people: string[], extra: Partial<FlowNode> = {}): FlowNode => {
      const def = this.roleDef(roleKey) ?? STANDARD_ROLES[0];
      return {
        id: 'n' + this.seq++, roleKey, name: def.name, side: def.side, icon: def.icon,
        x: 60 + col * COL_W, y: 90 + row * ROW_H,
        members: people.map(p => ({ personId: p, categories: [], teamId: def.side === 'question' ? this.teamFor(this.person(p).group).id : undefined })),
        perms: { ...def.perms }, custom: !!def.custom, assignMode: 'manual', ...extra,
      };
    };
    const ed = (from: FlowNode, to: FlowNode, fs: Port, ts: Port, label: string, kind: EdgeKind = 'main'): FlowEdge =>
      ({ id: 'e' + this.seq++, from: from.id, to: to.id, fs, ts, label, kind });
    const expertMembers = (n: FlowNode) => {
      n.assignMode = 'auto';
      n.members = [
        { personId: 'p6', categories: ['Finance', 'Taxes', 'Legal'] },
        { personId: 'p7', categories: ['Legal'] },
        { personId: 'p8', categories: ['Taxes'] },
      ];
      return n;
    };

    const s = mk('submitter', 0, 1, ['p9', 'p11']);
    const c = mk('coordinator', 1, 1, ['p1', 'p2']);
    const x = expertMembers(mk('expert', 2, 0, []));
    this.nodes = [s, c, x];
    this.edges = [
      ed(s, c, 'r', 'l', 'Submits question'),
      ed(c, x, 't', 'l', 'Assigns'),
      ed(x, c, 'b', 'r', 'Proposes answer', 'return'),
      ed(c, s, 'b', 'b', 'Sends answer', 'return'),
    ];
    setTimeout(() => this.fit(), 0);
  }

  // ── geometry ──────────────────────────────────────────────────────────────
  private portPoint(n: FlowNode, p: Port) {
    switch (p) {
      case 'l': return { x: n.x, y: n.y + NODE_H / 2 };
      case 'r': return { x: n.x + NODE_W, y: n.y + NODE_H / 2 };
      case 't': return { x: n.x + NODE_W / 2, y: n.y };
      case 'b': return { x: n.x + NODE_W / 2, y: n.y + NODE_H };
    }
  }
  private dir(p: Port) { return p === 'l' ? { x: -1, y: 0 } : p === 'r' ? { x: 1, y: 0 } : p === 't' ? { x: 0, y: -1 } : { x: 0, y: 1 }; }
  private curve(e: FlowEdge) {
    const a = this.nodeById(e.from), b = this.nodeById(e.to);
    if (!a || !b) return null;
    const p0 = this.portPoint(a, e.fs), p3 = this.portPoint(b, e.ts);
    const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
    const k = e.fs === e.ts ? 90 : Math.max(50, Math.min(140, dist / 2.5));
    const d0 = this.dir(e.fs), d3 = this.dir(e.ts);
    const end = { x: p3.x + d3.x * 3, y: p3.y + d3.y * 3 };
    const c1 = { x: p0.x + d0.x * k, y: p0.y + d0.y * k };
    const c2 = { x: end.x + d3.x * k, y: end.y + d3.y * k };
    return { p0, c1, c2, p3: end };
  }
  edgePath(e: FlowEdge): string {
    const r = this.routeOf(e);
    if (r) return r.d;
    const c = this.curve(e);
    if (!c) return '';
    return `M${c.p0.x},${c.p0.y} C${c.c1.x},${c.c1.y} ${c.c2.x},${c.c2.y} ${c.p3.x},${c.p3.y}`;
  }
  edgeStart(e: FlowEdge) { return this.routeOf(e)?.start ?? null; }
  edgeMid(e: FlowEdge) {
    const r = this.routeOf(e);
    if (r) return r.mid;
    const c = this.curve(e);
    if (!c) return { x: 0, y: 0 };
    return {
      x: (c.p0.x + 3 * c.c1.x + 3 * c.c2.x + c.p3.x) / 8,
      y: (c.p0.y + 3 * c.c1.y + 3 * c.c2.y + c.p3.y) / 8,
    };
  }

  // ── orthogonal routing around roles ───────────────────────────────────────
  // Connections leave a port perpendicular to the card, then run along a sparse
  // grid built from card edges (+ clearance) and never cross another card.
  private routeSig = '';
  private routes = new Map<string, { d: string; mid: { x: number; y: number }; start: { x: number; y: number } }>();
  private routeOf(e: FlowEdge) {
    const sig = this.nodes.map(n => `${n.id}:${n.x},${n.y}`).join(';') + '|' +
      this.edges.map(x => `${x.id}:${x.from}>${x.to}:${x.fs}${x.ts}`).join(';');
    if (sig !== this.routeSig) {
      this.routeSig = sig;
      this.routes.clear();
      this.edges.forEach(x => { const r = this.route(x); if (r) this.routes.set(x.id, r); });
    }
    return this.routes.get(e.id);
  }

  /** Port point, spread out when several connections share one side of a card. */
  private slotPoint(n: FlowNode, side: Port, edgeId: string) {
    const list = this.edges.filter(x => (x.from === n.id && x.fs === side) || (x.to === n.id && x.ts === side));
    const idx = Math.max(0, list.findIndex(x => x.id === edgeId));
    const off = (idx - (list.length - 1) / 2) * 24;
    const p = this.portPoint(n, side);
    return side === 'l' || side === 'r' ? { x: p.x, y: p.y + off } : { x: p.x + off, y: p.y };
  }

  private route(e: FlowEdge): { d: string; mid: { x: number; y: number }; start: { x: number; y: number } } | null {
    const a = this.nodeById(e.from), b = this.nodeById(e.to);
    if (!a || !b) return null;
    const M = 24;                         // clearance around cards
    const rects = this.nodes.map(n => ({ x1: n.x - M, y1: n.y - M, x2: n.x + NODE_W + M, y2: n.y + NODE_H + M }));
    const p0 = this.slotPoint(a, e.fs, e.id), p3 = this.slotPoint(b, e.ts, e.id);
    const d0 = this.dir(e.fs), d3 = this.dir(e.ts);
    const s = { x: p0.x + d0.x * M, y: p0.y + d0.y * M };
    const t = { x: p3.x + d3.x * M, y: p3.y + d3.y * M };

    const uniq = (v: number[]) => [...new Set(v.map(n => Math.round(n)))].sort((x, y) => x - y);
    const xs = uniq([s.x, t.x, (s.x + t.x) / 2, ...rects.flatMap(r => [r.x1, r.x2])]);
    const ys = uniq([s.y, t.y, (s.y + t.y) / 2, ...rects.flatMap(r => [r.y1, r.y2])]);
    const inside = (x: number, y: number) => rects.some(r => x > r.x1 && x < r.x2 && y > r.y1 && y < r.y2);
    const hBlocked = (y: number, xa: number, xb: number) => rects.some(r => y > r.y1 && y < r.y2 && Math.max(xa, xb) > r.x1 && Math.min(xa, xb) < r.x2);
    const vBlocked = (x: number, ya: number, yb: number) => rects.some(r => x > r.x1 && x < r.x2 && Math.max(ya, yb) > r.y1 && Math.min(ya, yb) < r.y2);

    const si = xs.indexOf(Math.round(s.x)), sj = ys.indexOf(Math.round(s.y));
    const ti = xs.indexOf(Math.round(t.x)), tj = ys.indexOf(Math.round(t.y));
    const W = xs.length, H = ys.length;
    // state = (i, j, axis) ; axis 0 = horizontal, 1 = vertical
    const key = (i: number, j: number, ax: number) => (j * W + i) * 2 + ax;
    const dist = new Map<number, number>(), prev = new Map<number, number>();
    const BEND = 60;
    const startAx = d0.x !== 0 ? 0 : 1, endAx = d3.x !== 0 ? 0 : 1;
    const open: [number, number][] = [[0, key(si, sj, startAx)]];
    dist.set(key(si, sj, startAx), 0);
    let best = -1;
    while (open.length) {
      open.sort((x, y) => x[0] - y[0]);
      const [cost, k] = open.shift()!;
      if (cost > (dist.get(k) ?? Infinity)) continue;
      const ax = k % 2, cell = (k - ax) / 2, i = cell % W, j = (cell - i) / W;
      if (i === ti && j === tj) {
        const total = cost + (ax === endAx ? 0 : BEND);
        if (best < 0 || total < (dist.get(-1) ?? Infinity)) { dist.set(-1, total); best = k; }
        continue;
      }
      const step = (ni: number, nj: number, nax: number) => {
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) return;
        const x0 = xs[i], y0 = ys[j], x1 = xs[ni], y1 = ys[nj];
        if (inside(x1, y1)) return;
        if (nax === 0 ? hBlocked(y0, x0, x1) : vBlocked(x0, y0, y1)) return;
        const nk = key(ni, nj, nax);
        const nc = cost + Math.abs(x1 - x0) + Math.abs(y1 - y0) + (nax === ax ? 0 : BEND);
        if (nc < (dist.get(nk) ?? Infinity)) { dist.set(nk, nc); prev.set(nk, k); open.push([nc, nk]); }
      };
      step(i + 1, j, 0); step(i - 1, j, 0); step(i, j + 1, 1); step(i, j - 1, 1);
    }
    if (best < 0) return null;

    const pts: { x: number; y: number }[] = [];
    for (let k: number | undefined = best; k !== undefined; k = prev.get(k)) {
      const ax = k % 2, cell = (k - ax) / 2, i = cell % W, j = (cell - i) / W;
      pts.unshift({ x: xs[i], y: ys[j] });
    }
    const end = { x: p3.x + d3.x * 3, y: p3.y + d3.y * 3 };
    const raw = [p0, ...pts, end];
    // drop duplicates and collinear points
    const poly: { x: number; y: number }[] = [];
    raw.forEach(pt => {
      const last = poly[poly.length - 1];
      if (last && last.x === pt.x && last.y === pt.y) return;
      if (poly.length >= 2) {
        const a2 = poly[poly.length - 2];
        if ((a2.x === last.x && last.x === pt.x) || (a2.y === last.y && last.y === pt.y)) poly.pop();
      }
      poly.push(pt);
    });

    // rounded corners
    let d = `M${poly[0].x},${poly[0].y}`;
    for (let k = 1; k < poly.length - 1; k++) {
      const pA = poly[k - 1], c = poly[k], pB = poly[k + 1];
      const lenA = Math.hypot(c.x - pA.x, c.y - pA.y), lenB = Math.hypot(pB.x - c.x, pB.y - c.y);
      const r = Math.min(12, lenA / 2, lenB / 2);
      const ia = { x: c.x - Math.sign(c.x - pA.x) * r, y: c.y - Math.sign(c.y - pA.y) * r };
      const ob = { x: c.x + Math.sign(pB.x - c.x) * r, y: c.y + Math.sign(pB.y - c.y) * r };
      d += ` L${ia.x},${ia.y} Q${c.x},${c.y} ${ob.x},${ob.y}`;
    }
    d += ` L${poly[poly.length - 1].x},${poly[poly.length - 1].y}`;

    // label sits halfway along the route
    const segs = poly.slice(1).map((pt, k) => ({ a: poly[k], b: pt, len: Math.abs(pt.x - poly[k].x) + Math.abs(pt.y - poly[k].y) }));
    let half = segs.reduce((sum, sg) => sum + sg.len, 0) / 2;
    let mid = poly[0];
    for (const sg of segs) {
      if (half <= sg.len) {
        const f = sg.len ? half / sg.len : 0;
        mid = { x: sg.a.x + (sg.b.x - sg.a.x) * f, y: sg.a.y + (sg.b.y - sg.a.y) * f };
        break;
      }
      half -= sg.len;
    }
    return { d, mid, start: p0 };
  }

  // ── pan / zoom / drag ─────────────────────────────────────────────────────
  onCanvasMouseDown(ev: MouseEvent) {
    if (ev.button !== 0) return;
    this.panning = true;
    this.panStart = { x: ev.clientX, y: ev.clientY, px: this.panX, py: this.panY };
    this.selectedId = null;
  }
  onNodeMouseDown(ev: MouseEvent, n: FlowNode) {
    ev.stopPropagation();
    if (ev.button !== 0 || !this.editable) return;
    this.dragNodeId = n.id;
    this.dragMoved = false;
    this.dragStart = { x: ev.clientX, y: ev.clientY, nx: n.x, ny: n.y };
  }
  @HostListener('document:mousemove', ['$event'])
  onMove(ev: MouseEvent) {
    if (this.dragNodeId) {
      const dx = (ev.clientX - this.dragStart.x) / this.zoom;
      const dy = (ev.clientY - this.dragStart.y) / this.zoom;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.dragMoved = true;
      const n = this.nodeById(this.dragNodeId);
      if (n && this.dragMoved) {
        let x = Math.round((this.dragStart.nx + dx) / 10) * 10;
        // keep each role in its lane: question side left, answer side right
        const others = this.nodes.filter(o => o.id !== n.id);
        if (n.side === 'question') {
          const aLeft = Math.min(Infinity, ...others.filter(o => o.side === 'answer').map(o => o.x));
          x = Math.min(x, aLeft - NODE_W - 60);
        } else {
          const qRight = Math.max(-Infinity, ...others.filter(o => o.side === 'question').map(o => o.x + NODE_W));
          x = Math.max(x, qRight + 60);
        }
        n.x = x;
        n.y = Math.round((this.dragStart.ny + dy) / 10) * 10;
        this.autoPorts();
      }
    } else if (this.link) {
      const w = this.toWorld(ev.clientX, ev.clientY);
      this.link.x = w.x; this.link.y = w.y;
    } else if (this.panning) {
      this.panX = this.panStart.px + ev.clientX - this.panStart.x;
      this.panY = this.panStart.py + ev.clientY - this.panStart.y;
    }
  }
  @HostListener('document:mouseup', ['$event'])
  onUp(ev?: MouseEvent) {
    if (this.link && ev) {
      const from = this.link.from;
      this.link = null;
      const id = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest('[data-node-id]')?.getAttribute('data-node-id');
      const to = id ? this.nodeById(id) : undefined;
      if (to && to !== from) this.finishLink(from, to, ev.clientX, ev.clientY);
      return;
    }
    if (this.dragNodeId && !this.dragMoved) this.selectNode(this.dragNodeId);
    this.dragNodeId = null;
    this.panning = false;
  }
  @HostListener('document:mousedown', ['$event'])
  onDocDown(ev: MouseEvent) {
    if (this.colorOpen && !(ev.target as HTMLElement).closest?.('.avatar-pick')) this.colorOpen = false;
    if (this.linkMenu && !(ev.target as HTMLElement).closest?.('.link-menu')) this.linkMenu = null;
  }
  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    const t = ev.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (ev.key === 'Escape' && this.colorOpen) { this.colorOpen = false; return; }
    if (ev.key === 'Escape') { this.selectedId = null; this.pendingInsert = null; }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && this.selectedNode) this.deleteNode(this.selectedNode);
  }
  onWheel(ev: WheelEvent) {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) {
      this.zoomAt(-ev.deltaY * 0.01, ev.clientX, ev.clientY);
    } else {
      this.panX -= ev.deltaX;
      this.panY -= ev.deltaY;
    }
  }
  zoomBy(d: number) {
    const r = this.canvasRef?.nativeElement.getBoundingClientRect();
    this.zoomAt(d, r ? r.left + r.width / 2 : 0, r ? r.top + r.height / 2 : 0);
  }
  private zoomAt(d: number, cx: number, cy: number) {
    const r = this.canvasRef?.nativeElement.getBoundingClientRect();
    if (!r) return;
    const nz = Math.min(1.5, Math.max(0.15, +(this.zoom + d).toFixed(2)));
    const wx = (cx - r.left - this.panX) / this.zoom, wy = (cy - r.top - this.panY) / this.zoom;
    this.zoom = nz;
    this.panX = cx - r.left - wx * nz;
    this.panY = cy - r.top - wy * nz;
  }
  fit() {
    const el = this.canvasRef?.nativeElement;
    if (!el || !this.nodes.length) return;
    const g = this.overviewGroups;
    // overview: fit the workflow frames, not just the roles
    const minX = g.length ? Math.min(...g.map(f => f.x)) - 24 : Math.min(...this.nodes.map(n => n.x)) - 40;
    const minY = g.length ? Math.min(...g.map(f => f.y)) - 24 : Math.min(...this.nodes.map(n => n.y)) - 70;
    const maxX = g.length ? Math.max(...g.map(f => f.x + f.w)) + 24 : Math.max(...this.nodes.map(n => n.x + NODE_W)) + 80;
    const maxY = g.length ? Math.max(...g.map(f => f.y + f.h)) + 24 : Math.max(...this.nodes.map(n => n.y + NODE_H)) + 110;
    // leave room for the toolbar over the canvas, however many lines it wraps to
    const bar = el.querySelector('.canvas-top') as HTMLElement | null;
    const top = (bar ? bar.offsetTop + bar.offsetHeight : 40) + 16;
    const w = el.clientWidth, h = el.clientHeight - top - 72;
    this.zoom = Math.min(1.1, Math.max(g.length ? 0.15 : 0.4, Math.min(w / (maxX - minX), h / (maxY - minY))));
    this.panX = Math.max(0, (w - (maxX - minX) * this.zoom) / 2) - minX * this.zoom;
    this.panY = top + Math.max(0, (h - (maxY - minY) * this.zoom) / 2) - minY * this.zoom;
  }
  /** Auto-layout: column = depth along forward edges, row = order within column. */
  tidy() {
    const depth = new Map<string, number>();
    const starts = this.nodes.filter(n => !this.edges.some(e => e.to === n.id && e.kind === 'main'));
    const queue = (starts.length ? starts : this.nodes.slice(0, 1)).map(n => { depth.set(n.id, 0); return n.id; });
    while (queue.length) {
      const id = queue.shift()!;
      this.edges.filter(e => e.from === id && e.kind === 'main').forEach(e => {
        if (!depth.has(e.to)) { depth.set(e.to, depth.get(id)! + 1); queue.push(e.to); }
      });
    }
    let maxD = Math.max(0, ...depth.values());
    this.nodes.forEach(n => { if (!depth.has(n.id)) depth.set(n.id, ++maxD); });
    // question side gets the left columns, answer side the columns after it
    const qDepths = [...new Set(this.nodes.filter(n => n.side === 'question').map(n => depth.get(n.id)!))].sort((a, b) => a - b);
    const aDepths = [...new Set(this.nodes.filter(n => n.side === 'answer').map(n => depth.get(n.id)!))].sort((a, b) => a - b);
    const colOf = (n: FlowNode) => n.side === 'question'
      ? qDepths.indexOf(depth.get(n.id)!)
      : qDepths.length + aDepths.indexOf(depth.get(n.id)!);
    const cols = new Map<number, FlowNode[]>();
    this.nodes.forEach(n => { const d = colOf(n); cols.set(d, [...(cols.get(d) || []), n]); });
    cols.forEach((list, d) => {
      // centre each column around row 1; two roles in a column sit on rows 0 and 2
      const spread = list.length === 2 ? 2 : 1;
      list.forEach((n, i) => {
        n.x = 60 + d * COL_W;
        n.y = Math.round(90 + ROW_H * (1 + (i - (list.length - 1) / 2) * spread));
      });
    });
    this.autoPorts();
    setTimeout(() => this.fit(), 0);
  }

  // ── selection / editing ───────────────────────────────────────────────────
  selectNode(id: string) {
    if (this.selectedId !== id) { this.nodeTab = 'people'; this.colorOpen = false; }
    this.selectedId = id;
    this.pendingInsert = null;
  }
  focusFirstError() {
    const e = this.wfErrors[0];
    if (!e) return;
    if (e.key !== this.activeWf) this.switchWf(e.key);
    this.selectNode(e.node.id);
    this.nodeTab = 'people';
  }
  isProtected(n: FlowNode) { return PROTECTED_ROLES.has(n.roleKey); }
  deleteNode(n: FlowNode) {
    if (this.isProtected(n)) {
      this.toast.show({ variant: 'warning', message: `${n.name} is required in every Q&A flow and can't be deleted` });
      return;
    }
    const ins = this.incoming(n).filter(e => e.kind === 'main');
    const outs = this.outgoing(n).filter(e => e.kind === 'main');
    // keep the chain connected: A → (deleted) → B becomes A → B
    const bridges: FlowEdge[] = [];
    ins.forEach(i => outs.forEach(o => {
      if (i.from !== o.to) bridges.push({ id: 'e' + this.seq++, from: i.from, to: o.to, fs: i.fs, ts: o.ts, label: o.label, kind: 'main' });
    }));
    this.edges = [...this.edges.filter(e => e.from !== n.id && e.to !== n.id), ...bridges];
    this.nodes = this.nodes.filter(x => x.id !== n.id);
    this.selectedId = null;
    if (n.roleKey === 'approver') this.syncApproverRoute();
    else if (n.roleKey === 'expert' && this.hasExpert) { this.rebuildAnswerRoute(true); this.renumberRoles(); }
    this.toast.show({ variant: 'info', message: `${n.name} removed from the flow` });
  }
  deleteEdge(e: FlowEdge) {
    this.edges = this.edges.filter(x => x.id !== e.id);
    this.hoverEdgeId = null;
  }
  removeMember(n: FlowNode, m: Membership) { n.members = n.members.filter(x => x !== m); }
  setAssignMode(n: FlowNode, mode: 'manual' | 'auto') {
    n.assignMode = mode;
    const e = this.edges.find(x => x.to === n.id && x.kind === 'main');
    if (!e) return;
    if (n.roleKey === 'approver') {
      // remember the hand-written label so switching back restores it
      if (mode === 'auto') { e.manualLabel = e.label; e.label = 'To category approvers'; }
      else e.label = e.manualLabel ?? 'Sends for approval';
      return;
    }
    e.label = mode === 'auto' ? 'Auto-assigns by category' : 'Assigns';
  }

  expertsFor(n: FlowNode, cat: string): string[] {
    return n.members.filter(m => m.categories.includes(cat)).map(m => m.personId);
  }


  private addCache = new Map<string, { key: string; value: DropdownOption[] }>();
  addPeopleOptions(n: FlowNode): DropdownOption[] {
    const key = n.members.map(m => m.personId).join(',') + '|' + this.people.length;
    const hit = this.addCache.get(n.id);
    if (hit && hit.key === key) return hit.value;
    const value = this.buildAddPeopleOptions(n);
    this.addCache.set(n.id, { key, value });
    return value;
  }
  private buildAddPeopleOptions(n: FlowNode): DropdownOption[] {
    const groups = [...new Set(this.people.map(p => p.group))];
    const groupOpts = groups.map(g => ({ value: 'group:' + g, label: `All of ${g}`, group: 'Groups' }));
    const people = this.people.filter(p => !n.members.some(m => m.personId === p.id))
      .map(p => ({ value: p.id, label: p.name, sublabel: p.external ? 'Invited' : p.group, group: 'People' }));
    return [...groupOpts, ...people];
  }
  addFromDropdown(n: FlowNode, v: string | string[], teamId?: string) {
    const val = Array.isArray(v) ? v[0] : v;
    if (!val) return;
    if (val.startsWith('group:')) {
      const g = val.slice(6);
      this.people.filter(p => p.group === g).forEach(p => this.addMember(n, p.id, false, teamId));
      this.toast.show({ variant: 'success', message: `${g} added to ${n.name}` });
    } else {
      this.addMember(n, val, true, teamId);
    }
  }
  private addMember(n: FlowNode, personId: string, notify = true, teamId?: string) {
    if (n.side === 'question') {
      // question side: a person acts for a team; default to the team named after their group, else the first team
      teamId = teamId ?? this.teams.find(t => t.name === this.person(personId).group)?.id ?? this.teams[0]?.id ?? this.teamFor('Team 1').id;
      if (n.members.some(m => m.personId === personId && m.teamId === teamId)) return;
    } else if (n.members.some(m => m.personId === personId)) return;
    const cats = this.scopedCategory && (n.roleKey === 'expert' || n.roleKey === 'approver') ? [this.scopedCategory] : [];
    n.members = [...n.members, { personId, categories: cats, teamId: n.side === 'question' ? teamId : undefined }];
    const other = this.otherRoles(personId, n);
    if (notify) {
      this.toast.show(other
        ? { variant: 'info', message: `${this.person(personId).name} now has 2 roles: ${other} and ${n.name}. Their permissions are combined.` }
        : { variant: 'success', message: `${this.person(personId).name} added to ${n.name}` });
    }
  }

  rejectTargets(n: FlowNode): DropdownOption[] {
    const list = this.nodes.filter(x => x.side === 'answer' && x.id !== n.id);
    return this.stable('reject:' + n.id, list.map(x => x.id + ':' + x.name).join('|'),
      () => list.map(x => ({ value: x.id, label: x.name })));
  }
  rejectTargetOf(n: FlowNode): string { return this.edges.find(e => e.from === n.id && e.kind === 'reject')?.to ?? ''; }
  setRejectTarget(n: FlowNode, target: string) {
    const v = Array.isArray(target) ? target[0] : target;
    const existing = this.edges.find(e => e.from === n.id && e.kind === 'reject');
    if (existing) { existing.to = v; existing.ts = 'r'; }
    else this.edges = [...this.edges, { id: 'e' + this.seq++, from: n.id, to: v, fs: 't', ts: 'r', label: 'Rejects', kind: 'reject' }];
  }

  // ── adding roles ──────────────────────────────────────────────────────────
  filteredRoles(side: Side): RoleDef[] {
    const q = this.roleQuery.trim().toLowerCase();
    return this.allRoles.filter(r => r.side === side && (!q || r.name.toLowerCase().includes(q)));
  }
  filteredGroups(): { group: string; people: Person[] }[] {
    const q = this.peopleQuery.trim().toLowerCase();
    const groups = [...new Set(this.people.map(p => p.group))];
    return groups
      .map(group => ({ group, people: this.people.filter(p => p.group === group && (!q || p.name.toLowerCase().includes(q) || group.toLowerCase().includes(q))) }))
      .filter(g => g.people.length);
  }
  /**
   * Which side a pending insertion belongs to, decided by the lane the new role lands in:
   * the middle of the connection, or the spot next to the card for "+".
   * null = no restriction (nothing pending, or no lanes and the step crosses sides).
   */
  private get sideSuffix(): string { const s = this.insertSide; return s ? ` · ${s === 'question' ? 'Question side' : 'Answer side'}` : ''; }
  get insertSide(): Side | null {
    const p = this.pendingInsert;
    if (!p) return null;
    const lanes = this.lanes;
    if ('edgeId' in p) {
      const e = this.edges.find(x => x.id === p.edgeId);
      if (!e) return null;
      const a = this.nodeById(e.from), b = this.nodeById(e.to);
      if (!a || !b) return null;
      // a step between the two teams (e.g. Submitter → Coordinator) can take a role from either side
      if (a.side !== b.side) return null;
      if (lanes) return this.edgeMid(e).x < lanes.x ? 'question' : 'answer';
      return a.side;
    }
    const src = this.nodeById(p.afterNodeId);
    if (!src) return null;
    const d = this.dir(p.side);
    if (lanes) return src.x + NODE_W / 2 + d.x * COL_W < lanes.x ? 'question' : 'answer';
    return d.x === 0 ? src.side : null;
  }
  get pendingInsertCaption(): string {
    const p = this.pendingInsert;
    if (!p) return '';
    if ('edgeId' in p) {
      const e = this.edges.find(x => x.id === p.edgeId);
      return e ? `Between ${this.nodeById(e.from)?.name} and ${this.nodeById(e.to)?.name}${this.sideSuffix}` : '';
    }
    return `${p.side === 'r' ? 'After' : p.side === 'l' ? 'Before' : p.side === 't' ? 'Above' : 'Below'} ${this.nodeById(p.afterNodeId)?.name}${this.sideSuffix}`;
  }
  startInsertOnEdge(e: FlowEdge) { this.selectedId = null; this.pendingInsert = { edgeId: e.id }; this.libTab = 'roles'; }
  startInsertAfter(n: FlowNode, side: Port = 'r') { this.selectedId = null; this.pendingInsert = { afterNodeId: n.id, side }; this.libTab = 'roles'; }

  private newNode(r: RoleDef, x: number, y: number): FlowNode {
    return {
      id: 'n' + this.seq++, roleKey: r.key, name: r.name, side: r.side, icon: r.icon, x, y,
      members: [], perms: { ...r.perms }, custom: !!r.custom, assignMode: 'manual',
    };
  }
  /** roles a workflow can hold only once */
  roleMaxed(r: RoleDef): boolean { return SINGLE_ROLES.has(r.key) && this.nodes.some(n => n.roleKey === r.key); }
  addRole(r: RoleDef, at?: { x: number; y: number }) {
    if (this.roleMaxed(r)) {
      this.toast.show({ variant: 'warning', message: `A workflow has one ${r.name} role — add more people to it instead` });
      return;
    }
    if (r.key === 'expert' && this.hasExpert) {
      const added = this.addExpert(r);
      this.pendingInsert = null;
      if (added) this.selectNode(added.id);
      return;
    }
    const p = this.pendingInsert;
    let node: FlowNode;
    if (p && 'edgeId' in p) {
      const e = this.edges.find(x => x.id === p.edgeId)!;
      const mid = this.edgeMid(e);
      node = this.newNode(r, Math.round(mid.x - NODE_W / 2), Math.round(mid.y - NODE_H / 2));
      this.edges = [
        ...this.edges.filter(x => x.id !== e.id),
        { id: 'e' + this.seq++, from: e.from, to: node.id, fs: e.fs, ts: 'l', label: e.label, kind: e.kind, auto: true },
        { id: 'e' + this.seq++, from: node.id, to: e.to, fs: 'r', ts: e.ts, label: r.perms['approve'] ? 'Approved' : 'Passes on', kind: e.kind, auto: true },
      ];
      this.nodes = [...this.nodes, node];
      this.tidy();
    } else if (p && 'afterNodeId' in p) {
      const src = this.nodeById(p.afterNodeId)!;
      const d = this.dir(p.side);
      node = this.newNode(r, src.x + d.x * COL_W, src.y + d.y * ROW_H);
      // step further in the same direction until the spot is free
      while (this.nodes.some(n => Math.abs(n.x - node.x) < NODE_W && Math.abs(n.y - node.y) < NODE_H)) {
        if (d.x) node.y += ROW_H; else node.y += d.y * ROW_H;
      }
      this.nodes = [...this.nodes, node];
      const opp: Record<Port, Port> = { l: 'r', r: 'l', t: 'b', b: 't' };
      this.edges = [...this.edges, { id: 'e' + this.seq++, from: src.id, to: node.id, fs: p.side, ts: opp[p.side], label: 'Passes on', kind: 'main', auto: true }];
      this.enforceLanes();
    } else {
      const pos = at ?? this.freeSpot(r.side);
      node = this.newNode(r, pos.x, pos.y);
      this.nodes = [...this.nodes, node];
      this.enforceLanes();
    }
    this.pendingInsert = null;
    if (r.key === 'approver') this.routeApprovedToCoordinator();
    this.renumberRoles();
    this.selectNode(node.id);
    if (!at) setTimeout(() => this.fit(), 0);
  }
  /** by default an approved answer goes back to the coordinator, who sends it; the approver's Permissions can change that */
  private routeApprovedToCoordinator() { this.syncApproverRoute(); }
  /** another expert joins the expert chain — only right after an existing expert */
  private addExpert(r: RoleDef): FlowNode | null {
    const xs = this.orderedExperts();
    const p = this.pendingInsert;
    const src = p && 'afterNodeId' in p ? this.nodeById(p.afterNodeId)
      : p && 'edgeId' in p ? this.nodeById(this.edges.find(e => e.id === p.edgeId)?.from ?? '')
      : xs[xs.length - 1];
    if (!src || src.roleKey !== 'expert') {
      this.toast.show({ variant: 'warning', message: 'A new expert can be added only after an existing expert' });
      return null;
    }
    const node = this.newNode(r, src.x + COL_W, src.y);
    const next = this.edges.find(e => e.from === src.id && e.kind !== 'reject');
    this.nodes = [...this.nodes, node];
    this.edges = [
      ...this.edges.filter(e => e !== next),
      { id: 'e' + this.seq++, from: src.id, to: node.id, fs: 'r', ts: 'l', label: 'Passes draft', kind: 'main', auto: true },
      ...(next ? [{ ...next, id: 'e' + this.seq++, from: node.id, auto: true }] : []),
    ];
    const order = [...xs];
    order.splice(order.indexOf(src) + 1, 0, node);
    if (!this.rebuildAnswerRoute(true, order)) { this.renumberRoles(); this.tidy(); }
    return node;
  }

  // ── drawing arrows ──
  link: { from: FlowNode; x: number; y: number } | null = null;
  linkMenu: { x: number; y: number; opts: LinkOpt[] } | null = null;
  canDrawFrom(n: FlowNode): boolean {
    return this.editable && (n.roleKey === 'approver' || n.roleKey === 'coordinator' && this.approvers().length > 0);
  }
  private toWorld(cx: number, cy: number) {
    const r = this.canvasRef?.nativeElement.getBoundingClientRect();
    return r ? { x: (cx - r.left - this.panX) / this.zoom, y: (cy - r.top - this.panY) / this.zoom } : { x: 0, y: 0 };
  }
  startLink(ev: MouseEvent, n: FlowNode) {
    ev.stopPropagation(); ev.preventDefault();
    this.linkMenu = null;
    const w = this.toWorld(ev.clientX, ev.clientY);
    this.link = { from: n, x: w.x, y: w.y };
  }
  linkPath(): string {
    const l = this.link!;
    const n = l.from, cx = n.x + NODE_W / 2, cy = n.y + NODE_H / 2;
    const dx = l.x - cx, dy = l.y - cy;
    const p = this.portPoint(n, Math.abs(dx) * (NODE_H / NODE_W) >= Math.abs(dy) ? (dx >= 0 ? 'r' : 'l') : (dy >= 0 ? 'b' : 't'));
    return `M${p.x},${p.y} L${l.x},${l.y}`;
  }
  linkTarget(n: FlowNode): boolean { return !!this.link && n !== this.link.from && this.linkOptions(this.link.from, n).opts.length > 0; }
  /**
   * What an arrow between two roles can mean:
   *   coordinator / last approver → question side: who sends the final answer
   *   approver → first or last expert, coordinator, previous approver: where a rejected answer goes
   *   last approver → coordinator: the coordinator sends the final answer
   */
  linkOptions(a: FlowNode, b: FlowNode): { opts: LinkOpt[]; reason?: string } {
    const c = this.coordinator(), aps = this.orderedApprovers(), xs = this.orderedExperts();
    const last = aps[aps.length - 1], ai = aps.indexOf(a);
    const opts: LinkOpt[] = [];
    if (b.side === 'question') {
      if (a === c) opts.push({ label: 'The coordinator sends the final answer', apply: () => this.setAfterApprove('coordinator') });
      else if (a === last) opts.push({ label: `${a.name} sends the final answer`, apply: () => this.setAfterApprove('direct') });
      else return { opts, reason: 'Only the coordinator or the last approver can send the final answer' };
      return { opts };
    }
    if (a.roleKey !== 'approver') return { opts, reason: 'From the coordinator, draw an arrow to the question side to have it send the final answer' };
    const reject = (to: 'expert' | 'lastExpert' | 'coordinator', label: string): LinkOpt => ({
      label, apply: () => {
        this.rejectTo = to;
        if (ai > 0) this.rejectChain = 'first';
        this.applyRouting();
        this.toast.show({ variant: 'success', message: `Routing updated: rejected answers go back to ${this.rejectTargetLabel().toLowerCase()}` });
      },
    });
    if (b.roleKey === 'expert') {
      if (b === xs[0]) opts.push(reject('expert', xs.length > 1 ? 'Rejects — back to the first expert' : 'Rejects — back to the expert'));
      else if (b === xs[xs.length - 1]) opts.push(reject('lastExpert', 'Rejects — back to the last expert'));
      else return { opts, reason: 'A rejected answer goes back to the first or the last expert' };
    } else if (b === c) {
      if (a === last && !c.perms['finalSignoff']) opts.push({ label: 'Approved — the coordinator sends the final answer', apply: () => this.setAfterApprove('coordinator') });
      opts.push(reject('coordinator', 'Rejects — back to the coordinator'));
    } else if (b.roleKey === 'approver') {
      if (ai > 0 && aps[ai - 1] === b) opts.push({
        label: 'Rejects — back to the previous approver',
        apply: () => { this.rejectChain = 'previous'; this.applyRouting(); this.toast.show({ variant: 'success', message: 'Routing updated: a rejection goes back to the previous approver' }); },
      });
      else return { opts, reason: 'A rejection can go back only to the previous approver' };
    } else return { opts, reason: "This arrow isn't supported" };
    return { opts };
  }
  private finishLink(a: FlowNode, b: FlowNode, cx: number, cy: number) {
    const { opts, reason } = this.linkOptions(a, b);
    if (!opts.length) { if (reason) this.toast.show({ variant: 'warning', message: reason }); return; }
    if (opts.length === 1) { opts[0].apply(); return; }
    const r = this.canvasRef?.nativeElement.getBoundingClientRect();
    this.linkMenu = { x: cx - (r?.left ?? 0) + 8, y: cy - (r?.top ?? 0) + 8, opts };
  }
  applyLink(o: LinkOpt) { this.linkMenu = null; o.apply(); }
  /** approvers in the order the answer reaches them */
  private orderedApprovers(): FlowNode[] {
    const order = this.stepMap();
    return this.approvers().sort((p, q) => (order.get(p.id)?.[0] ?? 99) - (order.get(q.id)?.[0] ?? 99));
  }
  lastApprover(): FlowNode | undefined { return this.orderedApprovers().at(-1); }
  /** 'Answer at any stage' belongs to the last approver only */
  permShown(n: FlowNode, p: PermDef): boolean {
    return !(n.roleKey === 'approver' && p.key === 'anyStage' && n !== this.lastApprover());
  }
  /**
   * Approvers form a chain: approver 1 → 2 → … → last.
   * The last approver hands the answer back to the coordinator, who sends it —
   * unless the last approver can answer at any stage, then it goes straight to the bidder.
   */
  private syncApproverRoute() {
    const c = this.coordinator();
    const aps = this.orderedApprovers();
    if (!c || !aps.length) return;
    const last = aps[aps.length - 1];
    aps.slice(0, -1).forEach(p => { p.perms['anyStage'] = false; p.perms['finalSignoff'] = false; });
    const direct = !!last.perms['anyStage'];
    this.nodes.filter(x => x !== c && x !== last).forEach(x => x.perms['finalSignoff'] = false);
    last.perms['finalSignoff'] = direct;
    c.perms['finalSignoff'] = !direct;
    this.rebuildAnswerRoute(true);
  }
  private freeSpot(side: Side) {
    const maxY = Math.max(90, ...this.nodes.map(n => n.y));
    if (side === 'question') {
      // below the question lane, so it stays on the left
      const q = this.nodes.filter(n => n.side === 'question');
      return { x: q.length ? Math.min(...q.map(n => n.x)) : 60, y: maxY + ROW_H };
    }
    const maxX = Math.max(60, ...this.nodes.map(n => n.x));
    return { x: maxX + COL_W, y: 90 + ROW_H };
  }

  // ── drag & drop from library ──────────────────────────────────────────────
  onPersonDragStart(ev: DragEvent, p: Person) { ev.dataTransfer?.setData('text/plain', 'person:' + p.id); }
  onRoleDragStart(ev: DragEvent, r: RoleDef) {
    if (this.roleMaxed(r)) { ev.preventDefault(); return; }
    ev.dataTransfer?.setData('text/plain', 'role:' + r.key);
  }
  onNodeDragOver(ev: DragEvent, n: FlowNode) { ev.preventDefault(); ev.stopPropagation(); this.dropNodeId = n.id; this.canvasDropActive = false; }
  onNodeDrop(ev: DragEvent, n: FlowNode) {
    if (!this.editable) return;
    ev.preventDefault(); ev.stopPropagation();
    this.dropNodeId = null;
    const data = ev.dataTransfer?.getData('text/plain') ?? '';
    if (data.startsWith('person:')) { this.addMember(n, data.slice(7)); this.selectNode(n.id); }
  }
  onCanvasDragOver(ev: DragEvent) { ev.preventDefault(); this.canvasDropActive = true; this.dropNodeId = null; }
  onCanvasDrop(ev: DragEvent) {
    if (!this.editable) return;
    ev.preventDefault();
    this.canvasDropActive = false;
    const data = ev.dataTransfer?.getData('text/plain') ?? '';
    const r = this.canvasRef?.nativeElement.getBoundingClientRect();
    if (!r) return;
    const x = (ev.clientX - r.left - this.panX) / this.zoom - NODE_W / 2;
    const y = (ev.clientY - r.top - this.panY) / this.zoom - NODE_H / 2;
    if (data.startsWith('role:')) {
      const role = this.roleDef(data.slice(5));
      if (role) { this.pendingInsert = null; this.addRole(role, { x: Math.round(x), y: Math.round(y) }); }
    } else if (data.startsWith('person:')) {
      this.toast.show({ variant: 'info', message: 'Drop people onto a role to add them' });
    }
  }

  // ── custom role ───────────────────────────────────────────────────────────
  /** Returns the same array while the inputs are unchanged, so DS dropdowns keep their option elements between mousedown and click. */
  private stable<T>(key: string, sig: string, build: () => T[]): T[] {
    const hit = this.stableCache.get(key);
    if (hit && hit.sig === sig) return hit.value as T[];
    const value = build();
    this.stableCache.set(key, { sig, value });
    return value;
  }
  private stableCache = new Map<string, { sig: string; value: unknown[] }>();

  baseRoleOptions(): DropdownOption[] {
    const roles = this.allRoles.filter(r => r.side === this.draft.side);
    return this.stable('base', roles.map(r => r.key + ':' + r.name).join('|'),
      () => roles.map(r => ({ value: r.key, label: r.name })));
  }
  /** true while creating a role for a specific insertion point — its side is decided by the lane */
  draftSideLocked = false;
  openCreateRole() {
    this.draft = { name: '', side: 'answer', base: 'coordinator', perms: { ...this.roleDef('coordinator')!.perms } };
    const side = this.insertSide;
    this.draftSideLocked = !!side;
    if (side) this.setDraftSide(side);
    this.createOpen = true;
  }
  setDraftSide(side: Side) {
    this.draft.side = side;
    this.setDraftBase(side === 'question' ? 'submitter' : 'coordinator');
  }
  setDraftBase(key: string) {
    const v = Array.isArray(key) ? key[0] : key;
    this.draft.base = v;
    this.draft.perms = { ...(this.roleDef(v)?.perms ?? {}) };
  }
  createRole() {
    const name = this.draft.name.trim();
    if (!name) return;
    const role: RoleDef = {
      key: 'custom-' + this.seq++, name, side: this.draft.side, icon: 'user-edit', custom: true,
      description: 'Custom role · based on ' + (this.roleDef(this.draft.base)?.name ?? 'scratch'),
      perms: { ...this.draft.perms },
    };
    this.customRoles = [...this.customRoles, role];
    this.createOpen = false;
    this.addRole(role);
    this.toast.show({ variant: 'success', message: `Custom role “${name}” created` });
  }

  // ── steps ─────────────────────────────────────────────────────────────────
  goNext() {
    if (this.errorNodes.length) { if (this.step === 1) this.focusFirstError(); return; }
    this.toStep(this.step === 1 ? 2 : 3);
  }
  toStep(to: 1 | 2 | 3) {
    if (to > 1 && this.errorNodes.length) return;
    if (this.step === 1 && to !== 1) this.stashActive();
    // back on the canvas: redraw from the stored workflows, people may have changed on step 2
    if (to === 1 && this.step !== 1) this.show(this.activeWf);
    this.step = to;
  }

  // ── step 2: users ──
  /** every workflow in use, with its roles; the canvas keeps the same objects */
  usersWorkflows(): { key: string; label: string; color?: string; nodes: FlowNode[] }[] {
    const def = this.defaultWf ?? { nodes: this.nodes, edges: this.edges };
    const list: { key: string; label: string; color?: string; nodes: FlowNode[] }[] = [{ key: this.DEFAULT_WF, label: this.multiWf ? 'All categories' : '', nodes: def.nodes }];
    if (this.multiWf) this.customCats().forEach(t => list.push({ key: t.key, label: t.label, color: t.color, nodes: this.customWf.get(t.key)!.nodes }));
    return this.stable('usersWf', list.map(w => w.key + ':' + w.nodes.map(n => n.id + n.members.length).join(',')).join('|'), () => list);
  }
  /** question-side roles are shared: the same people in every workflow */
  questionNodes(roleKey: string): FlowNode[] { return this.usersWorkflows().flatMap(w => w.nodes.filter(n => n.roleKey === roleKey)); }
  questionRoleKeys(): string[] {
    const keys = ['drafter', 'submitter'].filter(k => this.questionNodes(k).length);
    return this.stable('qKeys', keys.join(','), () => keys);
  }
  teamPeopleIn(roleKey: string, teamId: string): string[] {
    const ids = [...new Set(this.questionNodes(roleKey).flatMap(n => n.members.filter(m => m.teamId === teamId).map(m => m.personId)))];
    return this.stable('tp:' + roleKey + teamId, ids.join(','), () => ids);
  }
  removeFromTeamRole(roleKey: string, teamId: string, personId: string) {
    this.questionNodes(roleKey).forEach(n => n.members = n.members.filter(m => !(m.personId === personId && m.teamId === teamId)));
    this.toast.show({ variant: 'info', message: `${this.person(personId).name} removed from ${this.teams.find(t => t.id === teamId)?.name}` });
  }
  addToTeamRole(roleKey: string, teamId: string) {
    const nodes = this.questionNodes(roleKey);
    if (nodes.length) this.openPeopleModal(nodes[0], { teamId, targets: nodes });
  }
  /** adds a question team without any people; step 1 seeds teams from people instead */
  addTeam(name: string): QuestionTeam | null {
    const n = name.trim();
    if (!n) return null;
    if (this.teams.some(t => t.name.toLowerCase() === n.toLowerCase())) { this.toast.show({ variant: 'warning', message: `${n} already exists` }); return null; }
    const t = { id: 'qt' + this.teamSeqNext(), name: n };
    this.teams = [...this.teams, t];
    return t;
  }
  private teamSeqNext() { let i = this.teams.length + 1; while (this.teams.some(t => t.id === 'qt' + i)) i++; return i; }
  activate() {
    this.toast.show({ variant: 'success', title: 'Q&A is active', message: `${this.nodes.length} roles and ${new Set(this.nodes.flatMap(n => n.members.map(m => m.personId))).size} people are set up` });
  }
}
