import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import type { SidebarNavItem, HeaderAction, TabItem, SegmentItem, DropdownOption, RadioOption, MultiselectOption } from '../../shared/ds';
import type { FvdrIconName } from '../../shared/ds/icons/icons';

/* ──────────────────────────────────────────────────────────────────────────
   Q&A Setup — Advanced flow canvas
   One screen instead of "Workflow → Users": build the flow as nodes (n8n-like),
   add standard or custom roles, drop people & question teams right onto nodes.
   ────────────────────────────────────────────────────────────────────────── */

type Side = 'question' | 'answer';
type Port = 'l' | 'r' | 't' | 'b';
type EdgeKind = 'main' | 'return' | 'reject';
type TemplateId = 'basic' | 'advanced' | 'advisory' | 'multilevel';

interface Person { id: string; name: string; initials: string; email: string; group: string; tone: number; }
interface Membership { personId: string; categories: string[]; }
interface RoleDef {
  key: string; name: string; side: Side; icon: FvdrIconName; description: string;
  perms: Record<string, boolean>; custom?: boolean;
}
interface FlowNode {
  id: string; roleKey: string; name: string; side: Side; icon: FvdrIconName;
  x: number; y: number; members: Membership[]; perms: Record<string, boolean>;
  custom: boolean; assignMode: 'manual' | 'auto';
}
interface FlowEdge { id: string; from: string; to: string; fs: Port; ts: Port; label: string; kind: EdgeKind; /** ports follow geometry (edges added by the user) */ auto?: boolean; }
interface PermDef { key: string; label: string; hint: string; }
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
const A_PERMS: PermDef[] = [
  { key: 'seeAll',      label: 'See all questions',                  hint: 'Off — only questions assigned to them' },
  { key: 'assign',      label: 'Assign questions',                   hint: 'Route questions to other people in the flow' },
  { key: 'draftA',      label: 'Draft answers',                      hint: 'Write or propose an answer' },
  { key: 'editA',       label: "Edit others' answers",               hint: 'Change answers proposed by others' },
  { key: 'approve',     label: 'Approve or reject answers',          hint: 'Sign-off step before release' },
  { key: 'sendFinal',   label: 'Send final answer to question side', hint: 'Release the answer to the bidder' },
  { key: 'seeFinal',    label: 'See final answer',                   hint: 'See what was sent to the question side' },
  { key: 'seeAuthor',   label: 'See who asked the question',         hint: 'Show author and team of the question' },
];

const STANDARD_ROLES: RoleDef[] = [
  { key: 'drafter',     name: 'Question drafter',   side: 'question', icon: 'edit',
    description: 'Drafts questions for submitters',
    perms: { draftQ: true, submitQ: false, followUp: true, otherTeams: false } },
  { key: 'submitter',   name: 'Question submitter', side: 'question', icon: 'send',
    description: 'Submits questions to the answer side',
    perms: { draftQ: true, submitQ: true, followUp: true, otherTeams: false } },
  { key: 'coordinator', name: 'Answer coordinator', side: 'answer',   icon: 'comment',
    description: 'Manages incoming questions and assigns them',
    perms: { seeAll: true, assign: true, draftA: true, editA: true, approve: false, sendFinal: true, seeFinal: true, seeAuthor: true } },
  { key: 'expert',      name: 'Expert',             side: 'answer',   icon: 'user-check',
    description: 'Answers questions assigned to them',
    perms: { seeAll: false, assign: false, draftA: true, editA: false, approve: false, sendFinal: false, seeFinal: false, seeAuthor: false } },
  { key: 'approver',    name: 'Answer approver',    side: 'answer',   icon: 'finished',
    description: 'Approves answers before they are released',
    perms: { seeAll: true, assign: false, draftA: false, editA: true, approve: true, sendFinal: true, seeFinal: true, seeAuthor: true } },
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
  selector: 'fvdr-qna-setup-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="page-layout">
  <fvdr-sidebar-nav variant="vdr" accountName="Project Nova" [items]="navItems" [(collapsed)]="sidebarCollapsed" />

  <div class="main-area">
    <fvdr-header [breadcrumbs]="breadcrumbs" [actions]="headerActions" userName="DS" />

    <!-- ── Stepper ── -->
    <div class="stepper">
      <button class="step" [class.step--active]="step === 1" [class.step--done]="step === 2" (click)="step = 1">
        <span class="step-num"><fvdr-icon *ngIf="step === 2" name="check"></fvdr-icon><ng-container *ngIf="step === 1">1</ng-container></span>
        Workflow &amp; people
      </button>
      <span class="step-sep"></span>
      <button class="step" [class.step--active]="step === 2" [disabled]="errorNodes.length > 0" (click)="goNext()">
        <span class="step-num">2</span> Preferences
      </button>
    </div>

    <!-- ══════════════ STEP 1 — Canvas ══════════════ -->
    <div class="workspace" *ngIf="step === 1">

      <div class="canvas"
           #canvas
           [class.canvas--panning]="panning"
           [class.canvas--drop]="canvasDropActive"
           (mousedown)="onCanvasMouseDown($event)"
           (wheel)="onWheel($event)"
           (dragover)="onCanvasDragOver($event)"
           (dragleave)="canvasDropActive = false"
           (drop)="onCanvasDrop($event)">

        <!-- top toolbar -->
        <div class="canvas-top" (mousedown)="$event.stopPropagation()">
          <div class="tpl">
            <span class="tpl-label">Start from</span>
            <div class="tpl-segment">
              <fvdr-segment variant="table" size="sm" [items]="templateItems" [activeId]="templateId" (activeIdChange)="loadTemplate($any($event))"></fvdr-segment>
            </div>
          </div>
          <button class="health" [class.health--error]="errorNodes.length" (click)="focusFirstError()">
            <fvdr-icon [name]="errorNodes.length ? 'warning' : 'check'"></fvdr-icon>
            <span *ngIf="!errorNodes.length">All roles have people</span>
            <span *ngIf="errorNodes.length">{{ errorNodes.length }} {{ errorNodes.length === 1 ? 'role needs' : 'roles need' }} people</span>
          </button>
        </div>

        <div class="world" [style.transform]="'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')'">

          <!-- lanes: question team always on the left -->
          <ng-container *ngIf="lanes as L">
            <div class="lane-divider" [style.left.px]="L.x" [style.top.px]="L.top" [style.height.px]="L.height"></div>
            <span class="lane-label lane-label--q" [style.left.px]="L.x - 16" [style.top.px]="L.top"><fvdr-icon name="group"></fvdr-icon>Question side</span>
            <span class="lane-label lane-label--a" [style.left.px]="L.x + 16" [style.top.px]="L.top"><fvdr-icon name="comment"></fvdr-icon>Answer side</span>
          </ng-container>

          <!-- edges -->
          <svg class="edges" width="4000" height="3000">
            <defs>
              <marker id="qsc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="arrow-main"></path>
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
                    [attr.marker-end]="e.kind === 'reject' ? 'url(#qsc-arrow-reject)' : 'url(#qsc-arrow)'"></path>
            </g>
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
              <button class="mini-btn" title="Insert a role here" (click)="startInsertOnEdge(e)"><fvdr-icon name="plus"></fvdr-icon></button>
              <button class="mini-btn" title="Delete connection" (click)="deleteEdge(e)"><fvdr-icon name="trash"></fvdr-icon></button>
            </span>
          </div>

          <!-- nodes -->
          <div class="node"
               *ngFor="let n of nodes; trackBy: trackById"
               [style.left.px]="n.x" [style.top.px]="n.y"
               [class.node--selected]="selectedId === n.id"
               [class.node--error]="!n.members.length"
               [class.node--drop]="dropNodeId === n.id"
               [class.node--dragging]="dragNodeId === n.id && dragMoved"
               (mousedown)="onNodeMouseDown($event, n)"
               (dragover)="onNodeDragOver($event, n)"
               (dragleave)="dropNodeId = null"
               (drop)="onNodeDrop($event, n)">

            <div class="node-head">
              <span class="node-icon" [class.node-icon--q]="n.side === 'question'" [class.node-icon--custom]="n.custom">
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
                      <fvdr-icon name="group"></fvdr-icon>{{ t.team }} <b>{{ t.count }}</b>
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
                <span class="node-note" *ngIf="dualCount(n) as d">
                  <fvdr-icon name="info"></fvdr-icon>{{ d }} {{ d === 1 ? 'person also has' : 'people also have' }} another role
                </span>
              </ng-container>
              <ng-template #emptyDrop>
                <div class="drop-empty"><fvdr-icon name="user-add"></fvdr-icon> Drop people here</div>
              </ng-template>
            </div>

            <!-- dot = where a message leaves the role; the arrowhead marks where it arrives -->
            <span class="port" *ngFor="let s of outPorts(n); trackBy: trackSelf" [ngClass]="'port--' + s"></span>
            <button class="node-add" *ngFor="let s of freeSides(n); trackBy: trackSelf" [ngClass]="'node-add--' + s"
                    title="Add next role" (mousedown)="$event.stopPropagation()" (click)="startInsertAfter(n, s)">
              <fvdr-icon name="plus"></fvdr-icon>
            </button>
          </div>
        </div>

        <!-- canvas controls -->
        <div class="canvas-controls" (mousedown)="$event.stopPropagation()">
          <button class="ctl" title="Zoom in" (click)="zoomBy(0.1)"><fvdr-icon name="plus"></fvdr-icon></button>
          <button class="ctl" title="Zoom out" (click)="zoomBy(-0.1)"><fvdr-icon name="minus"></fvdr-icon></button>
          <button class="ctl" title="Fit to screen" (click)="fit()"><fvdr-icon name="expand"></fvdr-icon></button>
          <button class="ctl" title="Tidy up" (click)="tidy()"><fvdr-icon name="sparkle"></fvdr-icon></button>
          <span class="zoom-val">{{ (zoom * 100) | number:'1.0-0' }}%</span>
        </div>

        <div class="legend" (mousedown)="$event.stopPropagation()">
          <span><i class="lg lg--main"></i>Question / answer moves</span>
          <span><i class="lg lg--reject"></i>Rejected</span>
          <span><i class="lg lg--dual"></i>Person with 2+ roles</span>
        </div>
      </div>

      <!-- ── Right panel ── -->
      <aside class="panel">

        <!-- Node panel -->
        <ng-container *ngIf="selectedNode as n; else libraryTpl">
          <div class="panel-head">
            <span class="node-icon node-icon--lg" [class.node-icon--q]="n.side === 'question'" [class.node-icon--custom]="n.custom">
              <fvdr-icon [name]="n.icon"></fvdr-icon>
            </span>
            <div class="panel-titles">
              <input class="name-input" [(ngModel)]="n.name" aria-label="Role name" />
              <span class="panel-sub">
                {{ n.side === 'question' ? 'Question side' : 'Answer side' }} ·
                {{ n.custom ? 'Custom role' : (isCustomized(n) ? 'Customized' : 'Standard role') }}
              </span>
            </div>
            <button class="icon-btn" title="Close" (click)="selectedId = null"><fvdr-icon name="close"></fvdr-icon></button>
          </div>

          <div class="panel-tabs">
            <fvdr-tabs size="s" [tabs]="nodeTabs(n)" [activeId]="nodeTab" (tabChange)="nodeTab = $event"></fvdr-tabs>
          </div>

          <div class="panel-body">

            <!-- People -->
            <ng-container *ngIf="nodeTab === 'people'">
              <fvdr-dropdown
                [options]="addPeopleOptions(n)" [value]="''" placeholder="Add people or a whole group"
                [searchable]="true" searchPlaceholder="Search participants"
                (valueChange)="addFromDropdown(n, $event)"></fvdr-dropdown>
              <p class="hint">or drag people from the <b>People</b> library onto any role on the canvas</p>

              <div class="empty-panel" *ngIf="!n.members.length">
                <fvdr-icon name="user-add"></fvdr-icon>
                <span>No one in this role yet. Q&amp;A can't be activated until every role has at least one person.</span>
              </div>

              <ng-container *ngIf="n.side === 'question'">
                <div class="team-block" *ngFor="let t of teamsOf(n)">
                  <div class="team-title"><fvdr-icon name="group"></fvdr-icon>{{ t.team }}<span class="team-count">{{ t.count }}</span></div>
                  <ng-container *ngFor="let m of n.members">
                    <ng-container *ngIf="person(m.personId).group === t.team">
                      <ng-container *ngTemplateOutlet="memberRow; context: { n: n, m: m }"></ng-container>
                    </ng-container>
                  </ng-container>
                </div>
                <p class="hint" *ngIf="n.members.length">Each question team sees only its own questions unless <b>See other teams' questions</b> is on.</p>
              </ng-container>

              <ng-container *ngIf="n.side === 'answer'">
                <div class="assign-mode" *ngIf="n.roleKey === 'expert'">
                  <span class="field-label">Assignment</span>
                  <fvdr-segment variant="table" size="sm" [items]="assignItems" [activeId]="n.assignMode" (activeIdChange)="setAssignMode(n, $any($event))"></fvdr-segment>
                </div>
                <ng-container *ngFor="let m of n.members">
                  <ng-container *ngTemplateOutlet="memberRow; context: { n: n, m: m }"></ng-container>
                </ng-container>

                <!-- Auto-assign: categories → experts (full-width DS multiselect with checkboxes) -->
                <div class="cat-section" *ngIf="n.roleKey === 'expert' && n.assignMode === 'auto' && n.members.length">
                  <div class="cat-section-head">
                    <span class="field-label">Categories</span>
                    <span class="hint">New questions go to every expert of their category</span>
                  </div>
                  <div class="cat-block" *ngFor="let c of categories">
                    <div class="cat-head">
                      <fvdr-icon name="label" class="cat-ic" [ngClass]="'cat-ic--' + c.color"></fvdr-icon>
                      <span class="cat-name">{{ c.name }}</span>
                      <span class="cat-count">{{ expertsFor(n, c.name).length || 'No' }} {{ expertsFor(n, c.name).length === 1 ? 'expert' : 'experts' }}</span>
                    </div>
                    <fvdr-multiselect
                      [options]="expertOptions(n)"
                      [values]="expertsFor(n, c.name)"
                      [maxChips]="2"
                      placeholder="Choose experts"
                      searchPlaceholder="Search experts"
                      [helperText]="expertsFor(n, c.name).length ? '' : 'Questions in ' + c.name + ' will wait for the coordinator to assign them'"
                      (valuesChange)="setCategoryExperts(n, c.name, $event)"></fvdr-multiselect>
                  </div>
                </div>
              </ng-container>
            </ng-container>

            <!-- Permissions -->
            <ng-container *ngIf="nodeTab === 'permissions'">
              <div class="perm" *ngFor="let p of permsFor(n)">
                <div class="perm-text">
                  <span class="perm-label">{{ p.label }}</span>
                  <span class="perm-hint">{{ p.hint }}</span>
                </div>
                <fvdr-toggle size="s" [checked]="!!n.perms[p.key]" (checkedChange)="n.perms[p.key] = $event"></fvdr-toggle>
              </div>
              <button class="link-btn" *ngIf="!n.custom && isCustomized(n)" (click)="resetPerms(n)">Reset to {{ roleDef(n.roleKey)?.name }} defaults</button>
            </ng-container>

            <!-- Routing -->
            <ng-container *ngIf="nodeTab === 'routing'">
              <span class="field-label">Receives from</span>
              <div class="route" *ngFor="let e of incoming(n)">
                <span class="route-dot" [class.route-dot--reject]="e.kind === 'reject'"></span>
                <span class="route-node">{{ nodeById(e.from)?.name }}</span>
                <span class="route-label">{{ e.label }}</span>
              </div>
              <p class="hint" *ngIf="!incoming(n).length">Nothing routes here yet. Connect a role with <b>+</b> on the canvas.</p>

              <span class="field-label field-label--gap">Sends to</span>
              <div class="route" *ngFor="let e of outgoing(n)">
                <span class="route-dot" [class.route-dot--reject]="e.kind === 'reject'"></span>
                <input class="route-input" [(ngModel)]="e.label" aria-label="Step label" />
                <fvdr-icon name="chevron-right" class="route-arrow"></fvdr-icon>
                <span class="route-node">{{ nodeById(e.to)?.name }}</span>
              </div>

              <ng-container *ngIf="!!n.perms['approve']">
                <span class="field-label field-label--gap">When an answer is rejected, return it to</span>
                <fvdr-dropdown [options]="rejectTargets(n)" [value]="rejectTargetOf(n)"
                               (valueChange)="setRejectTarget(n, $any($event))"></fvdr-dropdown>
              </ng-container>
            </ng-container>
          </div>

          <div class="panel-foot">
            <fvdr-btn label="Delete role" variant="ghost" size="s" iconName="trash" (clicked)="deleteNode(n)"></fvdr-btn>
          </div>
        </ng-container>

        <!-- Library panel -->
        <ng-template #libraryTpl>
          <div class="panel-head panel-head--lib">
            <div class="panel-titles">
              <span class="lib-title">{{ pendingInsert ? 'Add a role' : 'Library' }}</span>
              <span class="panel-sub" *ngIf="pendingInsert">{{ pendingInsertCaption }}</span>
              <span class="panel-sub" *ngIf="!pendingInsert">Click or drag roles and people onto the canvas</span>
            </div>
            <button class="icon-btn" *ngIf="pendingInsert" title="Cancel" (click)="pendingInsert = null"><fvdr-icon name="close"></fvdr-icon></button>
          </div>
          <div class="panel-tabs" *ngIf="!pendingInsert">
            <fvdr-tabs size="s" [tabs]="libTabs" [activeId]="libTab" (tabChange)="libTab = $event"></fvdr-tabs>
          </div>

          <div class="panel-body">
            <!-- Roles -->
            <ng-container *ngIf="libTab === 'roles' || pendingInsert">
              <div class="lib-search"><fvdr-search placeholder="Search roles" size="s" [(ngModel)]="roleQuery"></fvdr-search></div>

              <span class="field-label">Question side</span>
              <ng-container *ngFor="let r of filteredRoles('question')">
                <ng-container *ngTemplateOutlet="roleRow; context: { r: r }"></ng-container>
              </ng-container>

              <span class="field-label field-label--gap">Answer side</span>
              <ng-container *ngFor="let r of filteredRoles('answer')">
                <ng-container *ngTemplateOutlet="roleRow; context: { r: r }"></ng-container>
              </ng-container>

              <button class="create-role" (click)="openCreateRole()">
                <span class="create-icon"><fvdr-icon name="plus"></fvdr-icon></span>
                <span class="role-text">
                  <span class="role-name">Create custom role</span>
                  <span class="role-desc">Name it and pick exactly what it can see and do</span>
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
                    <span class="person-name">{{ p.name }}</span>
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
    <div class="prefs" *ngIf="step === 2">
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
      <fvdr-btn *ngIf="step === 2" label="Back" variant="secondary" (clicked)="step = 1"></fvdr-btn>
      <fvdr-btn *ngIf="step === 1" label="Next" [disabled]="errorNodes.length > 0" (clicked)="goNext()"></fvdr-btn>
      <fvdr-btn *ngIf="step === 2" label="Activate Q&A" (clicked)="activate()"></fvdr-btn>
      <span class="footer-hint" *ngIf="step === 1 && errorNodes.length">Add people to {{ errorNamesLabel }} to continue</span>
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
      <span class="person-name">{{ person(m.personId).name }}</span>
      <ng-container *ngIf="n.roleKey === 'expert' && n.assignMode === 'auto'; else plainCaption">
        <span class="person-roles" *ngIf="m.categories.length">{{ m.categories.join(' · ') }}</span>
        <span class="person-roles person-roles--warn" *ngIf="!m.categories.length">No category — gets questions only manually</span>
      </ng-container>
      <ng-template #plainCaption>
        <span class="person-roles" *ngIf="otherRoles(m.personId, n) as other">Also {{ other }}</span>
        <span class="person-roles" *ngIf="!otherRoles(m.personId, n)">{{ person(m.personId).group }}</span>
      </ng-template>
    </span>
    <button class="icon-btn icon-btn--sm" title="Remove" (click)="removeMember(n, m)"><fvdr-icon name="close"></fvdr-icon></button>
  </div>
</ng-template>

<!-- role row (library) -->
<ng-template #roleRow let-r="r">
  <button class="role" draggable="true" (dragstart)="onRoleDragStart($event, r)" (click)="addRole(r)">
    <span class="node-icon" [class.node-icon--q]="r.side === 'question'" [class.node-icon--custom]="r.custom"><fvdr-icon [name]="r.icon"></fvdr-icon></span>
    <span class="role-text">
      <span class="role-name">{{ r.name }}<span class="role-tag" *ngIf="r.custom">Custom</span></span>
      <span class="role-desc">{{ r.description }}</span>
    </span>
    <fvdr-icon name="plus" class="role-plus"></fvdr-icon>
  </button>
</ng-template>

<!-- Create custom role -->
<fvdr-modal [visible]="createOpen" title="Create custom role" size="m"
            confirmLabel="Create role" cancelLabel="Cancel" [confirmDisabled]="!draft.name.trim()"
            (confirmed)="createRole()" (cancelled)="createOpen = false" (closed)="createOpen = false">
  <div class="cr">
    <fvdr-input label="Role name" placeholder="e.g. Final sign-off, Legal reviewer" [(ngModel)]="draft.name"></fvdr-input>
    <div class="cr-row">
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

<fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; font-family: var(--font-family); font-size: var(--font-size-base); color: var(--color-text-primary); }
    .page-layout { display: flex; height: 100%; background: var(--color-stone-100); }
    .main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--color-stone-0); }
    button { font-family: inherit; }

    /* stepper */
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
    .edge--hover { stroke: var(--color-primary-600); stroke-width: 2.5; }
    .edge-hit { fill: none; stroke: transparent; stroke-width: 16; pointer-events: stroke; cursor: pointer; }
    .arrow-main { fill: var(--color-stone-600); }
    .arrow-reject { fill: var(--color-error-500); }

    .edge-label {
      position: absolute; transform: translate(-50%, -50%);
      display: flex; align-items: center; gap: var(--space-1);
      padding: 2px var(--space-2); border-radius: var(--radius-full);
      background: var(--color-stone-0); border: 1px solid var(--color-stone-400);
      font-size: var(--text-caption2-size); color: var(--color-text-secondary); white-space: nowrap; cursor: default;
      z-index: 1;
    }
    .edge-label--reject { color: var(--color-error-600); border-color: var(--color-error-200); }
    .edge-label--hover { border-color: var(--color-primary-500); color: var(--color-text-primary); z-index: 3; }
    .edge-actions { display: none; gap: 2px; }
    .edge-label--hover .edge-actions { display: inline-flex; }
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
    .node-titles { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .node-name { font-weight: var(--font-weight-semi); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .node-sub { font-size: var(--text-caption1-size); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .node-step { align-self: flex-start; font-size: var(--text-caption2-size); color: var(--color-text-secondary); background: var(--color-stone-200); border-radius: var(--radius-sm); padding: 0 var(--space-1); white-space: nowrap; }
    .node-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: var(--space-1); min-height: 0; }
    .node-note { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-caption2-size); color: var(--color-text-secondary); }
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
    .node-add {
      position: absolute; width: 24px; height: 24px;
      border-radius: var(--radius-sm); border: 1px solid var(--color-stone-500); background: var(--color-stone-0);
      color: var(--color-text-secondary); display: none; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;
    }
    .node-add--r { right: -36px; top: 50%; margin-top: -12px; }
    .node-add--l { left: -36px; top: 50%; margin-top: -12px; }
    .node-add--t { top: -36px; left: 50%; margin-left: -12px; }
    .node-add--b { bottom: -36px; left: 50%; margin-left: -12px; }
    .node:hover .node-add, .node--selected .node-add { display: inline-flex; }
    .node-add:hover { border-color: var(--color-primary-500); color: var(--color-primary-600); }

    /* canvas chrome */
    .canvas-top { position: absolute; left: var(--space-4); right: var(--space-4); top: var(--space-4); display: flex; justify-content: space-between; align-items: center; z-index: 10; pointer-events: none; }
    .canvas-top > * { pointer-events: auto; }
    .tpl { display: flex; white-space: nowrap; align-items: center; gap: var(--space-2); background: var(--color-stone-0); border-radius: var(--radius-md); padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3); box-shadow: var(--shadow-card); }
    .tpl-label { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .health { display: inline-flex; white-space: nowrap; flex-shrink: 0; align-items: center; gap: var(--space-2); border: 1px solid var(--color-success-border); background: var(--color-success-bg); color: var(--color-success-text); border-radius: var(--radius-full); padding: var(--space-1) var(--space-3); font-size: var(--text-caption1-size); cursor: pointer; }
    .health--error { border-color: var(--color-error-border); background: var(--color-error-bg); color: var(--color-error-text); }
    .canvas-controls { position: absolute; left: var(--space-4); bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-1); z-index: 10; }
    .ctl { width: 32px; height: 32px; border-radius: var(--radius-md); border: 1px solid var(--color-stone-400); background: var(--color-stone-0); color: var(--color-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
    .ctl:hover { color: var(--color-text-primary); border-color: var(--color-stone-600); }
    .zoom-val { margin-left: var(--space-2); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .legend { position: absolute; right: var(--space-4); bottom: var(--space-4); display: flex; gap: var(--space-4); background: var(--color-stone-0); border: 1px solid var(--color-stone-400); border-radius: var(--radius-md); padding: var(--space-1) var(--space-3); font-size: var(--text-caption1-size); color: var(--color-text-secondary); z-index: 10; }
    .legend span { display: inline-flex; align-items: center; gap: var(--space-1); }
    .lg { display: inline-block; width: 18px; height: 0; border-top: 2px solid var(--color-stone-600); }
    .lg--reject { border-top: 2px dashed var(--color-error-500); }
    .lg--dual { width: 9px; height: 9px; border: 0; border-radius: var(--radius-full); background: var(--color-warning-500); }

    /* right panel */
    .panel { width: 392px; flex-shrink: 0; border-left: 1px solid var(--color-divider); display: flex; flex-direction: column; background: var(--color-stone-0); min-height: 0; }
    .panel-head { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-4) var(--space-3); }
    .panel-head--lib { padding-bottom: var(--space-2); }
    .panel-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .lib-title { font-size: var(--text-sub1-size); font-weight: var(--font-weight-semi); }
    .panel-sub { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .name-input { border: 1px solid transparent; border-radius: var(--radius-sm); padding: 2px var(--space-1); margin-left: calc(var(--space-1) * -1); font: inherit; font-size: var(--text-sub1-size); font-weight: var(--font-weight-semi); color: var(--color-text-primary); background: none; width: 100%; box-sizing: border-box; }
    .name-input:hover { border-color: var(--color-stone-400); }
    .name-input:focus { outline: none; border-color: var(--color-primary-500); }
    .panel-tabs { padding: 0 var(--space-4); border-bottom: 1px solid var(--color-divider); }
    .panel-body { flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .panel-foot { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-divider); }
    .icon-btn { width: 32px; height: 32px; border: 0; background: none; border-radius: var(--radius-md); color: var(--color-text-secondary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; flex-shrink: 0; }
    .icon-btn:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
    .icon-btn--sm { width: 24px; height: 24px; font-size: 14px; }
    .hint { margin: 0; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .field-label { font-size: var(--text-caption1-size); font-weight: var(--font-weight-semi); color: var(--color-text-secondary); }
    .field-label--gap { margin-top: var(--space-3); }
    .empty-panel { display: flex; gap: var(--space-2); align-items: flex-start; padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-error-50); color: var(--color-error-700); font-size: var(--text-caption1-size); }
    .team-block { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-2); }
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
    .assign-mode { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin: var(--space-2) 0; }
    .group { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--space-2); }
    .lib-search { margin-bottom: var(--space-2); }

    .perm { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-divider); }
    .perm--compact { padding: var(--space-1) 0; }
    .perm-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .perm-label { font-size: var(--font-size-base); }
    .perm-hint { font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
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
export class QnaSetupCanvasComponent {
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLDivElement>;
  private toast = inject(ToastService);

  readonly qPerms = Q_PERMS;
  readonly aPerms = A_PERMS;

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

  step: 1 | 2 = 1;

  templateItems: SegmentItem[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'advisory', label: 'Advisory' },
    { id: 'multilevel', label: 'Multi-level approval' },
  ];
  templateId: TemplateId = 'advanced';
  assignItems: SegmentItem[] = [
    { id: 'manual', label: 'Manual', icon: 'edit' },
    { id: 'auto', label: 'Auto by category', icon: 'sparkle' },
  ];
  libTabs: TabItem[] = [{ id: 'roles', label: 'Roles' }, { id: 'people', label: 'People' }];
  libTab = 'roles';
  nodeTab = 'people';
  roleQuery = '';
  peopleQuery = '';
  categories = [
    { name: 'Finance', color: 'teal' },
    { name: 'Legal', color: 'green' },
    { name: 'Tax', color: 'blue' },
    { name: 'HR', color: 'orange' },
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
    this.loadTemplate('advanced');
  }

  // ── lookups ───────────────────────────────────────────────────────────────
  trackById = (_: number, x: { id: string }) => x.id;
  trackSelf = (_: number, x: string) => x;

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
  person(id: string): Person { return PEOPLE.find(p => p.id === id)!; }
  tone(id: string) { return TONES[this.person(id).tone % TONES.length]; }
  nodeById(id: string) { return this.nodes.find(n => n.id === id); }
  get selectedNode(): FlowNode | undefined { return this.selectedId ? this.nodeById(this.selectedId) : undefined; }
  get allRoles(): RoleDef[] { return [...STANDARD_ROLES, ...this.customRoles]; }
  roleDef(key: string) { return this.allRoles.find(r => r.key === key); }
  get errorNodes(): FlowNode[] { return this.nodes.filter(n => !n.members.length); }
  get errorNamesLabel(): string { return this.errorNodes.map(n => n.name).join(', '); }
  permsFor(n: FlowNode): PermDef[] { return n.side === 'question' ? Q_PERMS : A_PERMS; }
  rolesOf(personId: string): FlowNode[] { return this.nodes.filter(n => n.members.some(m => m.personId === personId)); }
  rolesLabel(personId: string): string { return this.rolesOf(personId).map(n => n.name).join(' · '); }
  otherRoles(personId: string, n: FlowNode): string {
    return this.rolesOf(personId).filter(r => r.id !== n.id).map(r => r.name).join(', ');
  }
  dualCount(n: FlowNode): number { return n.members.filter(m => this.rolesOf(m.personId).length > 1).length; }
  incoming(n: FlowNode) { return this.edges.filter(e => e.to === n.id); }
  outgoing(n: FlowNode) { return this.edges.filter(e => e.from === n.id); }
  isEdgeRelated(e: FlowEdge) { return !!this.selectedId && (e.from === this.selectedId || e.to === this.selectedId); }

  isCustomized(n: FlowNode): boolean {
    const def = this.roleDef(n.roleKey);
    if (!def || n.custom) return false;
    return this.permsFor(n).some(p => !!def.perms[p.key] !== !!n.perms[p.key]);
  }
  resetPerms(n: FlowNode) { const def = this.roleDef(n.roleKey); if (def) n.perms = { ...def.perms }; }

  teamsOf(n: FlowNode): { team: string; count: number }[] {
    const map = new Map<string, number>();
    n.members.forEach(m => { const g = this.person(m.personId).group; map.set(g, (map.get(g) || 0) + 1); });
    return [...map.entries()].map(([team, count]) => ({ team, count }));
  }

  nodeSubtitle(n: FlowNode): string {
    if (n.roleKey === 'expert') return n.assignMode === 'auto' ? 'Auto-assign by category' : 'Assigned manually';
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
    const starts = this.nodes.filter(n => !this.edges.some(e => e.to === n.id && e.kind !== 'reject'));
    let cur = starts[0] ?? this.nodes[0];
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
    this.selectedId = null;
    this.pendingInsert = null;
    const mk = (roleKey: string, col: number, row: number, people: string[], extra: Partial<FlowNode> = {}): FlowNode => {
      const def = this.roleDef(roleKey) ?? STANDARD_ROLES[0];
      return {
        id: 'n' + this.seq++, roleKey, name: def.name, side: def.side, icon: def.icon,
        x: 60 + col * COL_W, y: 90 + row * ROW_H,
        members: people.map(p => ({ personId: p, categories: [] })),
        perms: { ...def.perms }, custom: !!def.custom, assignMode: 'manual', ...extra,
      };
    };
    const ed = (from: FlowNode, to: FlowNode, fs: Port, ts: Port, label: string, kind: EdgeKind = 'main'): FlowEdge =>
      ({ id: 'e' + this.seq++, from: from.id, to: to.id, fs, ts, label, kind });
    const expertMembers = (n: FlowNode) => {
      n.assignMode = 'auto';
      n.members = [
        { personId: 'p6', categories: ['Finance', 'Tax'] },
        { personId: 'p7', categories: ['Legal'] },
        { personId: 'p8', categories: ['HR'] },
      ];
      return n;
    };

    if (id === 'basic') {
      const s = mk('submitter', 0, 1, ['p9', 'p10', 'p11']);
      const c = mk('coordinator', 1, 1, ['p1']);
      this.nodes = [s, c];
      this.edges = [ed(s, c, 'r', 'l', 'Submits question'), ed(c, s, 'b', 'b', 'Sends answer', 'return')];
    } else if (id === 'advanced') {
      const d = mk('drafter', 0, 1, ['p10', 'p12']);
      const s = mk('submitter', 1, 1, ['p9', 'p11']);
      const c = mk('coordinator', 2, 1, ['p1', 'p2']);
      const x = expertMembers(mk('expert', 3, 0, []));
      const a = mk('approver', 3, 2, ['p4']);
      this.nodes = [d, s, c, x, a];
      this.edges = [
        ed(d, s, 'r', 'l', 'Proposes question'),
        ed(s, c, 'r', 'l', 'Submits question'),
        ed(c, x, 't', 'l', 'Assigns'),
        ed(x, c, 'b', 'r', 'Proposes answer', 'return'),
        ed(c, a, 'b', 'l', 'Sends for approval'),
        ed(a, c, 't', 'r', 'Rejects', 'reject'),
        ed(a, s, 'b', 'b', 'Final answer', 'return'),
      ];
    } else if (id === 'advisory') {
      if (!this.customRoles.some(r => r.key === 'final-signoff')) {
        this.customRoles.push({
          key: 'final-signoff', name: 'Final sign-off', side: 'answer', icon: 'user-edit', custom: true,
          description: 'Advisors release the approved answer',
          perms: { seeAll: true, assign: true, draftA: true, editA: true, approve: false, sendFinal: true, seeFinal: true, seeAuthor: true },
        });
      }
      const s = mk('submitter', 0, 1, ['p9', 'p11']);
      const c = mk('coordinator', 1, 1, ['p2', 'p3']);
      const x = expertMembers(mk('expert', 2, 0, []));
      const a = mk('approver', 2, 2, ['p4', 'p5']);
      const f = mk('final-signoff', 3, 1, ['p2']);
      this.nodes = [s, c, x, a, f];
      this.edges = [
        ed(s, c, 'r', 'l', 'Submits question'),
        ed(c, x, 't', 'l', 'Assigns'),
        ed(x, c, 'b', 'r', 'Proposes answer', 'return'),
        ed(c, a, 'b', 'l', 'Sends for approval'),
        ed(a, c, 't', 'r', 'Rejects', 'reject'),
        ed(a, f, 'r', 'b', 'Approved'),
        ed(f, s, 't', 't', 'Sends final answer', 'return'),
      ];
    } else {
      const s = mk('submitter', 0, 1, ['p9', 'p11']);
      const c = mk('coordinator', 1, 1, ['p1']);
      const x = expertMembers(mk('expert', 2, 0, []));
      const a1 = mk('approver', 2, 2, ['p5'], { name: 'Legal approver' });
      const a2 = mk('approver', 3, 2, [], { name: 'Final approver' });
      this.nodes = [s, c, x, a1, a2];
      this.edges = [
        ed(s, c, 'r', 'l', 'Submits question'),
        ed(c, x, 't', 'l', 'Assigns'),
        ed(x, c, 'b', 'r', 'Proposes answer', 'return'),
        ed(c, a1, 'b', 'l', 'Sends for approval'),
        ed(a1, a2, 'r', 'l', 'Approved · level 1'),
        ed(a1, c, 't', 'r', 'Rejects', 'reject'),
        ed(a2, s, 'b', 'b', 'Final answer', 'return'),
      ];
    }
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
    const c = this.curve(e);
    if (!c) return '';
    return `M${c.p0.x},${c.p0.y} C${c.c1.x},${c.c1.y} ${c.c2.x},${c.c2.y} ${c.p3.x},${c.p3.y}`;
  }
  edgeMid(e: FlowEdge) {
    const c = this.curve(e);
    if (!c) return { x: 0, y: 0 };
    return {
      x: (c.p0.x + 3 * c.c1.x + 3 * c.c2.x + c.p3.x) / 8,
      y: (c.p0.y + 3 * c.c1.y + 3 * c.c2.y + c.p3.y) / 8,
    };
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
    if (ev.button !== 0) return;
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
    } else if (this.panning) {
      this.panX = this.panStart.px + ev.clientX - this.panStart.x;
      this.panY = this.panStart.py + ev.clientY - this.panStart.y;
    }
  }
  @HostListener('document:mouseup')
  onUp() {
    if (this.dragNodeId && !this.dragMoved) this.selectNode(this.dragNodeId);
    this.dragNodeId = null;
    this.panning = false;
  }
  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    const t = ev.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
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
    const nz = Math.min(1.5, Math.max(0.4, +(this.zoom + d).toFixed(2)));
    const wx = (cx - r.left - this.panX) / this.zoom, wy = (cy - r.top - this.panY) / this.zoom;
    this.zoom = nz;
    this.panX = cx - r.left - wx * nz;
    this.panY = cy - r.top - wy * nz;
  }
  fit() {
    const el = this.canvasRef?.nativeElement;
    if (!el || !this.nodes.length) return;
    const minX = Math.min(...this.nodes.map(n => n.x)) - 40;
    const minY = Math.min(...this.nodes.map(n => n.y)) - 70;
    const maxX = Math.max(...this.nodes.map(n => n.x + NODE_W)) + 80;
    const maxY = Math.max(...this.nodes.map(n => n.y + NODE_H)) + 110;
    const w = el.clientWidth, h = el.clientHeight - 120;
    this.zoom = Math.min(1.1, Math.max(0.4, Math.min(w / (maxX - minX), h / (maxY - minY))));
    this.panX = (w - (maxX - minX) * this.zoom) / 2 - minX * this.zoom;
    this.panY = 60 + (h - (maxY - minY) * this.zoom) / 2 - minY * this.zoom;
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
    if (this.selectedId !== id) this.nodeTab = 'people';
    this.selectedId = id;
    this.pendingInsert = null;
  }
  focusFirstError() {
    const n = this.errorNodes[0];
    if (n) { this.selectNode(n.id); this.nodeTab = 'people'; }
  }
  deleteNode(n: FlowNode) {
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
    if (e) e.label = mode === 'auto' ? 'Auto-assigns by category' : 'Assigns';
  }

  // Stable arrays per node/category so fvdr-multiselect doesn't re-render on every change detection.
  private optCache = new Map<string, { key: string; value: MultiselectOption[] }>();
  private valCache = new Map<string, { key: string; value: string[] }>();
  expertOptions(n: FlowNode): MultiselectOption[] {
    const key = n.members.map(m => m.personId).join(',');
    const hit = this.optCache.get(n.id);
    if (hit && hit.key === key) return hit.value;
    const value = n.members.map(m => ({ value: m.personId, label: this.person(m.personId).name }));
    this.optCache.set(n.id, { key, value });
    return value;
  }
  expertsFor(n: FlowNode, cat: string): string[] {
    const ids = n.members.filter(m => m.categories.includes(cat)).map(m => m.personId);
    const ck = n.id + '|' + cat, key = ids.join(',');
    const hit = this.valCache.get(ck);
    if (hit && hit.key === key) return hit.value;
    this.valCache.set(ck, { key, value: ids });
    return ids;
  }
  setCategoryExperts(n: FlowNode, cat: string, ids: string[]) {
    n.members.forEach(m => {
      const has = m.categories.includes(cat);
      if (ids.includes(m.personId) && !has) m.categories = [...m.categories, cat];
      if (!ids.includes(m.personId) && has) m.categories = m.categories.filter(c => c !== cat);
    });
  }

  private addCache = new Map<string, { key: string; value: DropdownOption[] }>();
  addPeopleOptions(n: FlowNode): DropdownOption[] {
    const key = n.members.map(m => m.personId).join(',');
    const hit = this.addCache.get(n.id);
    if (hit && hit.key === key) return hit.value;
    const value = this.buildAddPeopleOptions(n);
    this.addCache.set(n.id, { key, value });
    return value;
  }
  private buildAddPeopleOptions(n: FlowNode): DropdownOption[] {
    const groups = [...new Set(PEOPLE.map(p => p.group))];
    const groupOpts = groups.map(g => ({ value: 'group:' + g, label: `All of ${g}`, group: 'Groups' }));
    const people = PEOPLE.filter(p => !n.members.some(m => m.personId === p.id))
      .map(p => ({ value: p.id, label: p.name, sublabel: p.group, group: 'People' }));
    return [...groupOpts, ...people];
  }
  addFromDropdown(n: FlowNode, v: string | string[]) {
    const val = Array.isArray(v) ? v[0] : v;
    if (!val) return;
    if (val.startsWith('group:')) {
      const g = val.slice(6);
      PEOPLE.filter(p => p.group === g).forEach(p => this.addMember(n, p.id, false));
      this.toast.show({ variant: 'success', message: `${g} added to ${n.name}` });
    } else {
      this.addMember(n, val);
    }
  }
  private addMember(n: FlowNode, personId: string, notify = true) {
    if (n.members.some(m => m.personId === personId)) return;
    n.members = [...n.members, { personId, categories: [] }];
    const other = this.otherRoles(personId, n);
    if (notify) {
      this.toast.show(other
        ? { variant: 'info', message: `${this.person(personId).name} now has 2 roles: ${other} and ${n.name}. Their permissions are combined.` }
        : { variant: 'success', message: `${this.person(personId).name} added to ${n.name}` });
    }
  }

  rejectTargets(n: FlowNode): DropdownOption[] {
    return this.nodes.filter(x => x.side === 'answer' && x.id !== n.id).map(x => ({ value: x.id, label: x.name }));
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
    const groups = [...new Set(PEOPLE.map(p => p.group))];
    return groups
      .map(group => ({ group, people: PEOPLE.filter(p => p.group === group && (!q || p.name.toLowerCase().includes(q) || group.toLowerCase().includes(q))) }))
      .filter(g => g.people.length);
  }
  get pendingInsertCaption(): string {
    const p = this.pendingInsert;
    if (!p) return '';
    if ('edgeId' in p) {
      const e = this.edges.find(x => x.id === p.edgeId);
      return e ? `Between ${this.nodeById(e.from)?.name} and ${this.nodeById(e.to)?.name}` : '';
    }
    return `${p.side === 'r' ? 'After' : p.side === 'l' ? 'Before' : p.side === 't' ? 'Above' : 'Below'} ${this.nodeById(p.afterNodeId)?.name}`;
  }
  startInsertOnEdge(e: FlowEdge) { this.selectedId = null; this.pendingInsert = { edgeId: e.id }; this.libTab = 'roles'; }
  startInsertAfter(n: FlowNode, side: Port = 'r') { this.selectedId = null; this.pendingInsert = { afterNodeId: n.id, side }; this.libTab = 'roles'; }

  private newNode(r: RoleDef, x: number, y: number): FlowNode {
    return {
      id: 'n' + this.seq++, roleKey: r.key, name: r.name, side: r.side, icon: r.icon, x, y,
      members: [], perms: { ...r.perms }, custom: !!r.custom, assignMode: 'manual',
    };
  }
  addRole(r: RoleDef, at?: { x: number; y: number }) {
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
    this.selectNode(node.id);
    if (!at) setTimeout(() => this.fit(), 0);
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
  onRoleDragStart(ev: DragEvent, r: RoleDef) { ev.dataTransfer?.setData('text/plain', 'role:' + r.key); }
  onNodeDragOver(ev: DragEvent, n: FlowNode) { ev.preventDefault(); ev.stopPropagation(); this.dropNodeId = n.id; this.canvasDropActive = false; }
  onNodeDrop(ev: DragEvent, n: FlowNode) {
    ev.preventDefault(); ev.stopPropagation();
    this.dropNodeId = null;
    const data = ev.dataTransfer?.getData('text/plain') ?? '';
    if (data.startsWith('person:')) { this.addMember(n, data.slice(7)); this.selectNode(n.id); }
  }
  onCanvasDragOver(ev: DragEvent) { ev.preventDefault(); this.canvasDropActive = true; this.dropNodeId = null; }
  onCanvasDrop(ev: DragEvent) {
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
  baseRoleOptions(): DropdownOption[] {
    return this.allRoles.filter(r => r.side === this.draft.side).map(r => ({ value: r.key, label: r.name }));
  }
  openCreateRole() {
    this.draft = { name: '', side: 'answer', base: 'coordinator', perms: { ...this.roleDef('coordinator')!.perms } };
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
    if (this.errorNodes.length) { this.focusFirstError(); return; }
    this.step = 2;
  }
  activate() {
    this.toast.show({ variant: 'success', title: 'Q&A is active', message: `${this.nodes.length} roles and ${new Set(this.nodes.flatMap(n => n.members.map(m => m.personId))).size} people are set up` });
  }
}
