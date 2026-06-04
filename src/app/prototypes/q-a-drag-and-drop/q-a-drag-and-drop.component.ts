import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { FvdrIconName } from '../../shared/ds/icons/icons';

interface QaUser {
  id: string;
  name: string;
  email?: string;
  initials: string;
}

type GroupColor = 'green' | 'teal' | 'indigo' | 'purple';

interface QaGroup {
  id: string;
  name: string;
  icon: FvdrIconName;
  color: GroupColor;
  side: 'question' | 'answer';
  expanded: boolean;
  users: QaUser[];
}

interface QaTeam {
  id: string;
  name: string;
  icon: FvdrIconName;
  expanded: boolean;
  groupIds: string[];
}

@Component({
  selector: 'app-q-a-drag-and-drop',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <div class="shell">
      <!-- icons-only sidebar -->
      <aside class="rail">
        <div class="rail__proj">NZ</div>
        <nav class="rail__nav">
          <button class="rail__item" *ngFor="let ic of railIcons; let i = index"
                  [class.rail__item--active]="i === 3" type="button">
            <fvdr-icon [name]="ic"></fvdr-icon>
          </button>
        </nav>
        <div class="rail__logo" aria-hidden="true"></div>
      </aside>

      <div class="main">
        <!-- header -->
        <header class="topbar">
          <div class="topbar__title">Q&amp;A Setup</div>
          <div class="topbar__actions">
            <button class="icon-btn" type="button"><fvdr-icon name="theme-dark"></fvdr-icon></button>
            <button class="icon-btn" type="button"><fvdr-icon name="help"></fvdr-icon></button>
            <button class="icon-btn" type="button"><fvdr-icon name="view-as"></fvdr-icon></button>
            <fvdr-avatar initials="TN" size="sm" color="var(--chip-icon-indigo)"></fvdr-avatar>
          </div>
        </header>

        <!-- content -->
        <div class="content">
          <!-- stepper -->
          <div class="stepper">
            <div class="step step--done">
              <span class="step__dot step__dot--done"><fvdr-icon name="check"></fvdr-icon></span>
              <span class="step__label">Workflow</span>
            </div>
            <span class="step__sep"></span>
            <div class="step step--active">
              <span class="step__dot step__dot--active">2</span>
              <span class="step__label step__label--active">Users</span>
            </div>
            <span class="step__sep"></span>
            <div class="step">
              <span class="step__dot">3</span>
              <span class="step__label">Settings</span>
            </div>
          </div>

          <div class="panels">
            <!-- ── Question side ── -->
            <section class="panel">
              <div class="panel__head">
                <span class="panel__title">Question side</span>
                <button class="link-btn" type="button">
                  <fvdr-icon name="plus"></fvdr-icon> New question team
                </button>
              </div>
              <fvdr-search [(ngModel)]="searchQuestion" placeholder="Search"></fvdr-search>

              <div class="tree">
                <ng-container *ngFor="let team of teams">
                  <button class="row row--team" type="button" (click)="team.expanded = !team.expanded">
                    <fvdr-icon class="row__chev" [name]="team.expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                    <span class="gicon gicon--green"><fvdr-icon [name]="team.icon"></fvdr-icon></span>
                    <span class="row__name">{{ team.name }}</span>
                  </button>

                  <ng-container *ngIf="team.expanded">
                    <ng-container *ngFor="let gid of team.groupIds">
                      <ng-container *ngTemplateOutlet="groupTpl; context: { $implicit: groupById(gid), indent: 2 }"></ng-container>
                    </ng-container>
                  </ng-container>
                </ng-container>
              </div>
            </section>

            <!-- ── Answer side ── -->
            <section class="panel">
              <div class="panel__head">
                <span class="panel__title">Answer side</span>
              </div>
              <fvdr-search [(ngModel)]="searchAnswer" placeholder="Search"></fvdr-search>

              <div class="tree">
                <ng-container *ngFor="let g of answerGroups">
                  <ng-container *ngTemplateOutlet="groupTpl; context: { $implicit: g, indent: 1 }"></ng-container>
                </ng-container>
              </div>
            </section>
          </div>
        </div>

        <!-- footer -->
        <footer class="footer">
          <fvdr-btn label="Cancel" variant="secondary" (clicked)="onCancel()"></fvdr-btn>
          <fvdr-btn label="Next" variant="primary" (clicked)="onNext()"></fvdr-btn>
        </footer>
      </div>
    </div>

    <!-- ── group + users template ── -->
    <ng-template #groupTpl let-g let-indent="indent">
      <div class="group-block"
           [class.group-block--over]="dragOverGroup === g.id && canDrop(g)"
           (dragover)="onDragOver($event, g)"
           (dragleave)="onDragLeave($event, g)"
           (drop)="onDrop($event, g)">
        <button class="row row--group" type="button"
                [style.paddingLeft.px]="12 + indent * 20"
                (click)="g.expanded = !g.expanded">
          <fvdr-icon class="row__chev" [name]="g.expanded ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
          <span class="gicon gicon--{{ g.color }}"><fvdr-icon [name]="g.icon"></fvdr-icon></span>
          <span class="row__name">{{ g.name }}</span>
          <fvdr-counter [value]="g.users.length" variant="default" size="s"></fvdr-counter>
          <span class="row__spacer"></span>
          <span class="row__add"><fvdr-icon name="user-add"></fvdr-icon> Add</span>
        </button>

        <ng-container *ngIf="g.expanded">
          <div class="row row--user"
               *ngFor="let u of g.users"
               [class.row--user-dragging]="dragUser?.id === u.id"
               [style.paddingLeft.px]="12 + (indent + 1) * 20"
               draggable="true"
               (dragstart)="onDragStart($event, u, g)"
               (dragend)="onDragEnd()">
            <fvdr-icon class="row__handle" name="drag"></fvdr-icon>
            <fvdr-avatar [initials]="u.initials" size="sm"
                         color="var(--color-stone-300)" textColor="var(--color-stone-800)"></fvdr-avatar>
            <span class="row__uname">{{ u.name }}</span>
            <span class="row__spacer"></span>
            <button class="row__remove" type="button" title="Remove" (click)="$event.stopPropagation()">
              <fvdr-icon name="user-remove"></fvdr-icon>
            </button>
          </div>
        </ng-container>
      </div>
    </ng-template>

    <!-- coach mark -->
    <div class="coach" *ngIf="showCoach" [style.top.px]="coachTop" [style.left.px]="coachLeft">
      <div class="coach__arrow"></div>
      <div class="coach__body">
        <div class="coach__title">Drag to reassign</div>
        <p class="coach__text">Drag any user onto another group to move them between teams.</p>
        <button class="coach__btn" type="button" (click)="dismissCoach()">Got it</button>
      </div>
    </div>

    <!-- hidden drag ghost -->
    <div #dragGhost class="drag-ghost">
      <fvdr-avatar *ngIf="dragUser" [initials]="dragUser.initials" size="sm"
                   color="var(--color-stone-300)" textColor="var(--color-stone-800)"></fvdr-avatar>
      <span>{{ dragUser?.name }}</span>
    </div>

    <fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: var(--font-family); }

    .shell { display: flex; height: 100vh; background: var(--color-stone-0); color: var(--color-text-primary); }

    /* ── rail ── */
    .rail {
      width: 56px; flex: 0 0 56px; background: var(--color-stone-0);
      border-right: 1px solid var(--color-divider);
      display: flex; flex-direction: column; align-items: center;
      padding: 12px 0; gap: 16px;
    }
    .rail__proj {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      background: var(--chip-icon-orange); color: var(--color-stone-0);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
    }
    .rail__nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .rail__item {
      width: 40px; height: 40px; border: none; background: none; cursor: pointer;
      border-radius: var(--radius-md); color: var(--color-stone-600);
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .rail__item:hover { background: var(--color-stone-200); color: var(--color-stone-900); }
    .rail__item--active { color: var(--color-primary-500); }
    .rail__logo {
      width: 28px; height: 28px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, var(--color-primary-400), var(--color-primary-700));
    }

    /* ── topbar ── */
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      height: 64px; flex: 0 0 64px; display: flex; align-items: center;
      justify-content: space-between; padding: 0 24px;
      border-bottom: 1px solid var(--color-divider);
    }
    .topbar__title { font-size: 16px; font-weight: 600; }
    .topbar__actions { display: flex; align-items: center; gap: 12px; }
    .icon-btn {
      border: none; background: none; cursor: pointer; color: var(--color-stone-600);
      font-size: 20px; display: flex; align-items: center; padding: 4px;
    }
    .icon-btn:hover { color: var(--color-stone-900); }

    /* ── content ── */
    .content { flex: 1; overflow: auto; padding: 24px 40px; }
    .stepper { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .step { display: flex; align-items: center; gap: 8px; }
    .step__dot {
      width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 600;
      background: var(--color-stone-200); color: var(--color-stone-700);
    }
    .step__dot--done { background: var(--color-primary-500); color: var(--color-stone-0); font-size: 13px; }
    .step__dot--active { background: var(--color-primary-500); color: var(--color-stone-0); }
    .step__label { font-size: 14px; color: var(--color-text-secondary); }
    .step__label--active { color: var(--color-text-primary); font-weight: 600; }
    .step__sep { width: 28px; height: 1px; background: var(--color-stone-400); }

    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

    .panel {
      border: 1px solid var(--color-divider); border-radius: var(--radius-lg);
      background: var(--color-stone-0); overflow: hidden;
    }
    .panel__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; background: var(--color-stone-100);
      border-bottom: 1px solid var(--color-divider);
    }
    .panel__title { font-size: 14px; font-weight: 600; }
    .link-btn {
      border: none; background: none; cursor: pointer; color: var(--color-primary-500);
      font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;
    }
    .link-btn:hover { color: var(--color-primary-600); }
    .panel fvdr-search { display: block; padding: 12px 16px 4px; }

    /* ── tree rows ── */
    .tree { padding: 4px 8px 12px; }
    .row {
      width: 100%; display: flex; align-items: center; gap: 8px;
      min-height: 40px; padding: 0 12px; border: none; background: none;
      cursor: pointer; text-align: left; border-radius: var(--radius-md);
      color: var(--color-text-primary); font-size: 14px;
    }
    .row:hover { background: var(--color-stone-200); }
    .row__chev { font-size: 14px; color: var(--color-stone-600); flex: 0 0 auto; }
    .row__name { font-weight: 500; }
    .row__uname { font-weight: 400; }
    .row__spacer { flex: 1; }
    .row__add {
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
      color: var(--color-primary-500); font-weight: 500; opacity: 0; transition: opacity .12s;
    }
    .row--group:hover .row__add { opacity: 1; }
    .gicon {
      width: 24px; height: 24px; border-radius: var(--radius-sm); flex: 0 0 auto;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .gicon--green  { background: var(--chip-bg-green);  color: var(--chip-icon-green); }
    .gicon--teal   { background: var(--chip-bg-teal);   color: var(--chip-icon-teal); }
    .gicon--indigo { background: var(--chip-bg-indigo); color: var(--chip-icon-indigo); }
    .gicon--purple { background: var(--chip-bg-purple); color: var(--chip-icon-purple); }

    .row--user { cursor: grab; }
    .row--user:active { cursor: grabbing; }
    .row--user-dragging { opacity: .4; }
    .row__handle { font-size: 14px; color: var(--color-stone-500); cursor: grab; }
    .row__remove {
      border: none; background: none; cursor: pointer; color: var(--color-error-600);
      font-size: 16px; padding: 4px; opacity: 0; transition: opacity .12s;
    }
    .row--user:hover .row__remove { opacity: 1; }

    /* drop target highlight */
    .group-block { border-radius: var(--radius-md); }
    .group-block--over {
      outline: 1px dashed var(--color-primary-500);
      outline-offset: -1px; background: var(--color-primary-50);
    }

    /* ── footer ── */
    .footer {
      flex: 0 0 auto; display: flex; gap: 12px; padding: 16px 40px;
      border-top: 1px solid var(--color-divider);
    }

    /* ── coach mark ── */
    .coach { position: fixed; z-index: 400; width: 260px; }
    .coach__arrow {
      position: absolute; top: -6px; left: 28px; width: 12px; height: 12px;
      background: var(--color-stone-900); transform: rotate(45deg); border-radius: 2px;
    }
    .coach__body {
      position: relative; background: var(--color-stone-900); color: var(--color-stone-0);
      border-radius: var(--radius-md); padding: 14px 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
    }
    .coach__title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .coach__text { font-size: 13px; line-height: 1.4; margin: 0 0 12px; color: var(--color-stone-300); }
    .coach__btn {
      border: none; background: var(--color-primary-500); color: var(--color-stone-0);
      border-radius: var(--radius-sm); padding: 6px 14px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    .coach__btn:hover { background: var(--color-primary-600); }

    /* ── drag ghost ── */
    .drag-ghost {
      position: fixed; top: -1000px; left: -1000px; pointer-events: none;
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--color-stone-0); border: 1px solid var(--color-primary-500);
      border-radius: var(--radius-md); padding: 6px 12px; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,.12); color: var(--color-text-primary);
    }
  `],
})
export class QaDragAndDropComponent {
  private toast = inject(ToastService);
  @ViewChild('dragGhost') dragGhost!: ElementRef<HTMLElement>;

  searchQuestion = '';
  searchAnswer = '';

  railIcons: FvdrIconName[] = [
    'documents', 'participants', 'nav-permissions', 'nav-qa', 'billing', 'settings-filter', 'trash',
  ];

  groups: QaGroup[] = [
    {
      id: 'drafters', name: 'Drafters', icon: 'edit', color: 'green', side: 'question', expanded: true,
      users: [
        { id: 'u1', name: 'Sophia Tran', email: 'sophia.tran@jdh.com', initials: 'ST' },
        { id: 'u2', name: "James O'Connor", initials: 'JO' },
        { id: 'u3', name: 'Aisha Patel', initials: 'AP' },
        { id: 'u4', name: 'Liam Zhang', initials: 'LZ' },
      ],
    },
    {
      id: 'submitters', name: 'Submitters', icon: 'nav-qa', color: 'teal', side: 'question', expanded: true,
      users: [
        { id: 'u5', name: 'Tony Trapatoni', initials: 'TT' },
        { id: 'u6', name: 'Jürgen Klopp', initials: 'JK' },
        { id: 'u7', name: 'Alex Ferguson', initials: 'AF' },
      ],
    },
    {
      id: 'coordinators', name: 'Coordinators', icon: 'users-groups', color: 'green', side: 'answer', expanded: true,
      users: [
        { id: 'u8', name: 'Michael Hamir', initials: 'MH' },
        { id: 'u9', name: 'Elena Costa', initials: 'EC' },
        { id: 'u10', name: 'David Kim', initials: 'DK' },
      ],
    },
    {
      id: 'experts', name: 'Experts', icon: 'user-check', color: 'indigo', side: 'answer', expanded: false,
      users: [
        { id: 'u11', name: 'Nadia Rahman', initials: 'NR' },
        { id: 'u12', name: 'Omar Farouk', initials: 'OF' },
        { id: 'u13', name: 'Yuki Sato', initials: 'YS' },
      ],
    },
    {
      id: 'approvers', name: 'Approvers', icon: 'finished', color: 'purple', side: 'answer', expanded: false,
      users: [
        { id: 'u14', name: 'Grace Lee', initials: 'GL' },
        { id: 'u15', name: 'Mateo Rossi', initials: 'MR' },
        { id: 'u16', name: 'Hana Novak', initials: 'HN' },
      ],
    },
  ];

  teams: QaTeam[] = [
    { id: 'bidder1', name: 'Bidder 1', icon: 'participants', expanded: true, groupIds: ['drafters', 'submitters'] },
  ];

  get answerGroups(): QaGroup[] {
    return this.groups.filter(g => g.side === 'answer');
  }

  groupById(id: string): QaGroup {
    return this.groups.find(g => g.id === id)!;
  }

  // ── drag & drop ──
  dragUser: QaUser | null = null;
  dragFromGroup: QaGroup | null = null;
  dragOverGroup: string | null = null;

  onDragStart(event: DragEvent, user: QaUser, group: QaGroup): void {
    this.dragUser = user;
    this.dragFromGroup = group;
    this.dismissCoach();
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', user.id);
      // custom ghost so the cursor carries the styled chip
      setTimeout(() => {
        const ghost = this.dragGhost?.nativeElement;
        if (ghost) {
          event.dataTransfer!.setDragImage(ghost, 20, 18);
        }
      });
    }
  }

  canDrop(group: QaGroup): boolean {
    return !!this.dragUser && !!this.dragFromGroup && this.dragFromGroup.id !== group.id;
  }

  onDragOver(event: DragEvent, group: QaGroup): void {
    if (!this.canDrop(group)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverGroup = group.id;
  }

  onDragLeave(event: DragEvent, group: QaGroup): void {
    if (this.dragOverGroup === group.id) this.dragOverGroup = null;
  }

  onDrop(event: DragEvent, group: QaGroup): void {
    event.preventDefault();
    if (!this.dragUser || !this.dragFromGroup || this.dragFromGroup.id === group.id) {
      this.onDragEnd();
      return;
    }
    const user = this.dragUser;
    const from = this.dragFromGroup;
    from.users = from.users.filter(u => u.id !== user.id);
    group.users = [...group.users, user];
    group.expanded = true;
    this.toast.show({
      variant: 'success',
      message: `${user.name} moved to ${group.name}`,
    });
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.dragUser = null;
    this.dragFromGroup = null;
    this.dragOverGroup = null;
  }

  // ── coach mark ──
  showCoach = true;
  coachTop = 360;
  coachLeft = 150;
  dismissCoach(): void { this.showCoach = false; }

  onCancel(): void {
    this.toast.show({ variant: 'info', message: 'Setup cancelled' });
  }
  onNext(): void {
    this.toast.show({ variant: 'success', message: 'Users saved — moving to Settings' });
  }
}
