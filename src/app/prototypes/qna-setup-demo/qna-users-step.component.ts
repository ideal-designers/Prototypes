import { Component, ElementRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../shared/ds';
import type { FlowNode, Membership, QuestionTeam } from './qna-setup-demo.component';
import type { QnaSetupDemoComponent } from './qna-setup-demo.component';

/* ──────────────────────────────────────────────────────────────────────────
   Q&A Setup demo — step 2 "Users" (Figma 1:170774)
   A last check before inviting: every question team and every role with its
   people, add or remove someone quickly. Reads and edits the same workflows
   as the canvas on step 1; the question side is shared by all workflows,
   the answer side is split per workflow when Workflow by category is on.
   ────────────────────────────────────────────────────────────────────────── */

const PLURAL: Record<string, string> = {
  drafter: 'Drafters', submitter: 'Submitters', coordinator: 'Coordinators',
  expert: 'Experts', approver: 'Approvers', viewer: 'Viewers',
};

@Component({
  selector: 'fvdr-qna-users-step',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
<div class="us">
  <!-- ── Question side ── -->
  <section class="col" aria-label="Question side">
    <div class="col-head">
      <span class="col-title">Question side</span>
      <button class="link" (click)="startNewTeam()"><fvdr-icon name="plus"></fvdr-icon>New question team</button>
    </div>
    <fvdr-search class="col-search" placeholder="Search" size="s" [(ngModel)]="qSearch"></fvdr-search>

    <div class="tree">
      <ng-container *ngFor="let t of demo.teams; trackBy: trackId">
        <div class="row row--team" *ngIf="teamVisible(t)">
          <button class="chev" [attr.aria-expanded]="!isClosed('t:' + t.id)" [attr.aria-label]="'Toggle ' + t.name" (click)="toggle('t:' + t.id)">
            <fvdr-icon [name]="isClosed('t:' + t.id) ? 'chevron-right' : 'chevron-down'"></fvdr-icon>
          </button>
          <span class="team-ic"><fvdr-icon name="participants"></fvdr-icon></span>
          <input *ngIf="renaming === t.id; else teamName" class="field" [value]="t.name" aria-label="Team name"
                 (keydown.enter)="rename(t, $any($event.target).value)" (keydown.escape)="renaming = null"
                 (blur)="rename(t, $any($event.target).value)" />
          <ng-template #teamName><span class="name">{{ t.name }}</span></ng-template>
          <span class="acts">
            <button class="icon-btn" fvdrTooltip="Rename" (click)="renaming = t.id"><fvdr-icon name="edit"></fvdr-icon></button>
            <button class="icon-btn icon-btn--danger" fvdrTooltip="Delete team" (click)="demo.askDeleteTeam(t)"><fvdr-icon name="trash"></fvdr-icon></button>
          </span>
        </div>
        <ng-container *ngIf="teamVisible(t) && !isClosed('t:' + t.id)">
          <ng-container *ngFor="let r of demo.questionRoleKeys()">
            <div class="row row--role row--l1">
              <button class="chev" [attr.aria-expanded]="!isClosed('q:' + t.id + r)" [attr.aria-label]="'Toggle ' + plural(r)" (click)="toggle('q:' + t.id + r)">
                <fvdr-icon [name]="isClosed('q:' + t.id + r) ? 'chevron-right' : 'chevron-down'"></fvdr-icon>
              </button>
              <span class="role-ic" [style.background]="demo.avatar(demo.questionNodes(r)[0]).bg" [style.color]="demo.avatar(demo.questionNodes(r)[0]).fg">
                <fvdr-icon [name]="demo.questionNodes(r)[0].icon"></fvdr-icon>
              </span>
              <span class="name">{{ plural(r) }}</span>
              <span class="count">{{ demo.teamPeopleIn(r, t.id).length }}</span>
              <button class="link link--end" (click)="demo.addToTeamRole(r, t.id)"><fvdr-icon name="user-add"></fvdr-icon>Add</button>
            </div>
            <ng-container *ngIf="!isClosed('q:' + t.id + r)">
              <div class="row row--person row--l2" *ngFor="let id of match(demo.teamPeopleIn(r, t.id), qSearch)">
                <span class="av" [style.background]="demo.tone(id).bg" [style.color]="demo.tone(id).fg">{{ demo.person(id).initials }}</span>
                <span class="name">{{ demo.person(id).name }}</span>
                <button class="icon-btn icon-btn--danger acts" fvdrTooltip="Remove" tooltipPosition="left" (click)="demo.removeFromTeamRole(r, t.id, id)"><fvdr-icon name="user-remove"></fvdr-icon></button>
              </div>
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>

      <!-- new team, named inline -->
      <div class="row row--new" *ngIf="addingTeam">
        <span class="team-ic team-ic--new"><fvdr-icon name="participants"></fvdr-icon></span>
        <div class="new-field">
          <input class="field" [class.field--error]="teamError" placeholder="Question team name" aria-label="Question team name" [(ngModel)]="newTeamName"
                 (keydown.enter)="createTeam()" (keydown.escape)="addingTeam = false" />
          <span class="error" *ngIf="teamError">Fill in to continue</span>
        </div>
        <button class="icon-btn" fvdrTooltip="Add team" (click)="createTeam()"><fvdr-icon name="check"></fvdr-icon></button>
        <button class="icon-btn" fvdrTooltip="Cancel" (click)="addingTeam = false"><fvdr-icon name="close"></fvdr-icon></button>
      </div>
      <p class="empty" *ngIf="!demo.teams.length && !addingTeam">No question teams yet — create one to add drafters and submitters.</p>
    </div>
  </section>

  <!-- ── Answer side ── -->
  <section class="col" aria-label="Answer side">
    <div class="col-head"><span class="col-title">Answer side</span></div>
    <fvdr-search class="col-search" placeholder="Search" size="s" [(ngModel)]="aSearch"></fvdr-search>

    <div class="tree">
      <ng-container *ngFor="let w of demo.usersWorkflows(); trackBy: trackKey">
        <!-- one section per workflow when Workflow by category is on -->
        <div class="row row--wf" *ngIf="w.label">
          <button class="chev" [attr.aria-expanded]="!isClosed('w:' + w.key)" [attr.aria-label]="'Toggle ' + w.label" (click)="toggle('w:' + w.key)">
            <fvdr-icon [name]="isClosed('w:' + w.key) ? 'chevron-right' : 'chevron-down'"></fvdr-icon>
          </button>
          <fvdr-icon name="label" class="cat" [ngClass]="'cat--' + (w.color || 'grey')"></fvdr-icon>
          <span class="name name--wf">{{ w.label }}</span>
          <span class="sub" *ngIf="w.key === demo.DEFAULT_WF">{{ demo.defaultCatsLabel() }}</span>
        </div>
        <ng-container *ngIf="!w.label || !isClosed('w:' + w.key)">
          <ng-container *ngFor="let n of answerNodes(w.nodes); trackBy: trackId">
            <div class="row row--role" [class.row--l1]="!!w.label" [class.row--empty]="!n.members.length">
              <button class="chev" [attr.aria-expanded]="!isClosed('a:' + w.key + n.id)" [attr.aria-label]="'Toggle ' + roleLabel(n)" (click)="toggle('a:' + w.key + n.id)">
                <fvdr-icon [name]="isClosed('a:' + w.key + n.id) ? 'chevron-right' : 'chevron-down'"></fvdr-icon>
              </button>
              <span class="role-ic" [style.background]="demo.avatar(n).bg" [style.color]="demo.avatar(n).fg"><fvdr-icon [name]="n.icon"></fvdr-icon></span>
              <span class="name">{{ roleLabel(n) }}</span>
              <span class="count" [class.count--error]="!n.members.length">{{ n.members.length }}</span>
              <button class="link link--end" (click)="add(n, w.key)"><fvdr-icon name="user-add"></fvdr-icon>Add</button>
            </div>
            <ng-container *ngIf="!isClosed('a:' + w.key + n.id)">
              <span class="error error--row" [class.row--l2]="!!w.label" *ngIf="!n.members.length">No one yet — add people to continue</span>
              <div class="row row--person" [class.row--l2]="!!w.label" [class.row--l1]="!w.label" *ngFor="let m of matchMembers(n.members, aSearch)">
                <span class="av" [style.background]="demo.tone(m.personId).bg" [style.color]="demo.tone(m.personId).fg">{{ demo.person(m.personId).initials }}</span>
                <span class="name">{{ demo.person(m.personId).name }}</span>
                <span class="sub" *ngIf="m.categories.length && (n.roleKey === 'expert' || n.roleKey === 'approver')">{{ m.categories.join(', ') }}</span>
                <button class="icon-btn icon-btn--danger acts" fvdrTooltip="Remove" tooltipPosition="left" (click)="remove(n, m)"><fvdr-icon name="user-remove"></fvdr-icon></button>
              </div>
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
    </div>
  </section>
</div>
  `,
  styles: [`
    :host { flex: 1; min-height: 0; overflow-y: auto; display: block; }
    .us { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); padding: var(--space-6); align-items: start; }
    .col { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
    .col-head { display: flex; align-items: center; justify-content: space-between; height: var(--space-12); padding: 0 var(--space-4); background: var(--color-stone-100); border-radius: var(--radius-sm); }
    .col-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semi); }
    .col-search { display: block; margin: 0 var(--space-3); }
    .tree { display: flex; flex-direction: column; }
    .row { position: relative; display: flex; align-items: center; gap: var(--space-2); min-height: var(--space-10); padding: 0 var(--space-4); border-radius: var(--radius-sm); }
    .row:hover { background: var(--color-hover-bg); }
    .row--l1 { padding-left: var(--space-10); }
    .row--l2 { padding-left: calc(var(--space-10) * 2); }
    .row--person { padding-left: calc(var(--space-10) + var(--space-6)); }
    .row--person.row--l2 { padding-left: calc(var(--space-10) * 2 + var(--space-6)); }
    .row--wf { margin-top: var(--space-2); }
    .row--new { background: var(--color-primary-50); padding: var(--space-2) var(--space-4); align-items: flex-start; }
    .chev { display: inline-flex; align-items: center; justify-content: center; width: var(--space-6); height: var(--space-6); border: none; background: none; padding: 0; color: var(--color-text-secondary); cursor: pointer; border-radius: var(--radius-sm); }
    .team-ic { display: inline-flex; align-items: center; justify-content: center; width: var(--space-6); height: var(--space-6); border-radius: 50%; background: var(--color-primary-50); color: var(--color-primary-600); }
    .team-ic--new { margin-top: var(--space-1); background: var(--color-info-500); color: var(--color-stone-0); border-radius: var(--radius-sm); }
    .role-ic { display: inline-flex; align-items: center; justify-content: center; width: var(--space-6); height: var(--space-6); border-radius: var(--radius-sm); }
    .av { display: inline-flex; align-items: center; justify-content: center; width: var(--space-6); height: var(--space-6); border-radius: 50%; font-size: var(--text-caption1-size); }
    .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .name--wf { font-weight: var(--font-weight-semi); }
    .sub { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
    .count { display: inline-flex; align-items: center; justify-content: center; min-width: var(--space-6); padding: 0 var(--space-1); border-radius: var(--radius-lg); background: var(--color-stone-300); font-size: var(--text-caption1-size); }
    .count--error { background: var(--color-error-50); color: var(--color-error-600); }
    .cat { color: var(--color-stone-500); }
    .cat--teal { color: var(--color-primary-400); } .cat--green { color: var(--color-primary-600); } .cat--blue { color: var(--color-info-500); }
    .cat--orange { color: var(--color-warning-600); } .cat--red { color: var(--color-error-500); }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); border: none; background: none; padding: var(--space-1); font: inherit; color: var(--color-primary-500); cursor: pointer; white-space: nowrap; }
    .link:hover { color: var(--color-primary-600); }
    .link--end { margin-left: auto; }
    .acts { margin-left: auto; display: inline-flex; gap: var(--space-1); opacity: 0; transition: opacity 0.15s; }
    .row:hover .acts, .acts:focus-within, .acts:focus-visible { opacity: 1; }
    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: var(--space-8); height: var(--space-8); border: none; background: none; border-radius: var(--radius-sm); color: var(--color-text-secondary); cursor: pointer; }
    .icon-btn:hover { background: var(--color-stone-300); }
    .icon-btn--danger { color: var(--color-error-600); }
    .field { flex: 1; min-width: 0; height: var(--space-8); padding: 0 var(--space-2); border: 1px solid var(--color-stone-400); border-radius: var(--radius-sm); font: inherit; background: var(--color-stone-0); }
    .field:focus { outline: none; border-color: var(--color-primary-500); }
    .field--error { border-color: var(--color-error-600); }
    .new-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .error { font-size: var(--text-caption1-size); color: var(--color-error-600); }
    .error--row { display: block; padding: var(--space-1) var(--space-4) var(--space-1) calc(var(--space-10) + var(--space-6)); }
    .error--row.row--l2 { padding-left: calc(var(--space-10) * 2 + var(--space-6)); }
    .empty { margin: var(--space-2) var(--space-4); font-size: var(--text-caption1-size); color: var(--color-text-secondary); }
  `],
})
export class QnaUsersStepComponent {
  @Input({ required: true }) demo!: QnaSetupDemoComponent;
  private readonly host = inject(ElementRef<HTMLElement>);

  qSearch = '';
  aSearch = '';
  /** collapsed rows; everything starts open so the whole set-up is visible at a glance */
  private closed = new Set<string>();
  renaming: string | null = null;
  addingTeam = false;
  newTeamName = '';
  teamError = false;

  trackId = (_: number, x: { id: string }) => x.id;
  trackKey = (_: number, x: { key: string }) => x.key;
  isClosed(k: string) { return this.closed.has(k) && !this.searching; }
  toggle(k: string) { this.closed.has(k) ? this.closed.delete(k) : this.closed.add(k); }
  private get searching() { return !!(this.qSearch.trim() || this.aSearch.trim()); }

  plural(roleKey: string) { return PLURAL[roleKey] ?? roleKey; }
  /** standard roles read in plural; a renamed or custom role keeps its own name */
  roleLabel(n: FlowNode) {
    const std = this.demo.roleDef(n.roleKey);
    return !n.custom && std && std.name === n.name ? (PLURAL[n.roleKey] ?? n.name) : n.name;
  }
  answerNodes(nodes: FlowNode[]) {
    const order = ['coordinator', 'expert', 'approver', 'viewer'];
    const rank = (n: FlowNode) => { const i = order.indexOf(n.roleKey); return i < 0 ? order.length : i; };
    return nodes.filter(n => n.side === 'answer').sort((a, b) => rank(a) - rank(b));
  }

  match(ids: string[], q: string) {
    const s = q.trim().toLowerCase();
    return s ? ids.filter(id => this.demo.person(id).name.toLowerCase().includes(s)) : ids;
  }
  matchMembers(ms: Membership[], q: string) {
    const s = q.trim().toLowerCase();
    return s ? ms.filter(m => this.demo.person(m.personId).name.toLowerCase().includes(s)) : ms;
  }
  teamVisible(t: QuestionTeam) {
    const s = this.qSearch.trim().toLowerCase();
    if (!s) return true;
    return t.name.toLowerCase().includes(s) || this.demo.questionRoleKeys().some(r => this.match(this.demo.teamPeopleIn(r, t.id), s).length);
  }

  add(n: FlowNode, wfKey: string) {
    const scope = wfKey.startsWith('cat:') ? wfKey.slice(4) : undefined;
    this.demo.openPeopleModal(n, { scope });
  }
  remove(n: FlowNode, m: Membership) {
    this.demo.removeMember(n, m);
    this.demo.toast.show({ variant: 'info', message: `${this.demo.person(m.personId).name} removed from ${this.roleLabel(n)}` });
  }

  startNewTeam() {
    this.addingTeam = true;
    this.newTeamName = '';
    this.teamError = false;
    setTimeout(() => (this.host.nativeElement.querySelector('.row--new input') as HTMLInputElement | null)?.focus());
  }
  createTeam() {
    if (!this.newTeamName.trim()) { this.teamError = true; return; }
    const t = this.demo.addTeam(this.newTeamName);
    if (!t) return;
    this.addingTeam = false;
    this.demo.toast.show({ variant: 'success', message: `${t.name} created — add drafters or submitters` });
  }
  rename(t: QuestionTeam, value: string) {
    if (this.renaming !== t.id) return;
    const name = value.trim();
    if (name && !this.demo.teams.some(x => x !== t && x.name.toLowerCase() === name.toLowerCase())) t.name = name;
    this.renaming = null;
  }
}
