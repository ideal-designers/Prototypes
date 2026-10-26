import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import type { SegmentItem } from '../../shared/ds';

type Variant = 'v1' | 'v2' | 'v3';

interface Member { initials: string; name: string; teams: string[]; }
interface Group { name: string; count?: number; open: boolean; members: Member[]; }
interface Team { name: string; open: boolean; groups: Group[]; }

@Component({
  selector: 'app-qna-hover-variants',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="page">
      <header class="top">
        <span class="top__title">Q&A Setup</span>
        <fvdr-segment [items]="variants" [activeId]="variant" (activeIdChange)="variant = $any($event)"></fvdr-segment>
      </header>

      <p class="hint">{{ hints[variant] }}</p>

      <div class="cols">
        <section class="panel">
          <div class="panel__head">
            <span class="panel__title">Question side</span>
            <button class="link"><fvdr-icon name="plus"></fvdr-icon>New question team</button>
          </div>
          <fvdr-search placeholder="Search"></fvdr-search>

          <div class="tree" [ngClass]="'tree--' + variant">
            <ng-container *ngFor="let t of teams">
              <div class="row row--team">
                <button class="chev" (click)="t.open = !t.open" [attr.aria-label]="t.open ? 'Collapse' : 'Expand'">
                  <fvdr-icon [name]="t.open ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                </button>
                <fvdr-icon name="group" class="team-icon"></fvdr-icon>
                <span class="row__name">{{ t.name }}</span>
              </div>

              <ng-container *ngIf="t.open">
                <ng-container *ngFor="let g of t.groups">
                  <div class="row row--group">
                    <button class="chev" (click)="g.open = !g.open" [attr.aria-label]="g.open ? 'Collapse' : 'Expand'">
                      <fvdr-icon [name]="g.open ? 'chevron-down' : 'chevron-right'"></fvdr-icon>
                    </button>
                    <span class="role-icon"><fvdr-icon name="chevron-right"></fvdr-icon></span>
                    <span class="row__name">{{ g.name }}</span>
                    <fvdr-counter *ngIf="g.count" [value]="g.count"></fvdr-counter>
                    <button class="link link--end"><fvdr-icon name="user-add"></fvdr-icon>Add</button>
                  </div>

                  <ng-container *ngIf="g.open">
                    <div class="row row--user" tabindex="0" *ngFor="let m of g.members">
                      <fvdr-avatar [initials]="m.initials" size="sm"></fvdr-avatar>
                      <span class="row__name">{{ m.name }}</span>

                      <!-- chips + hover action; layout differs per variant via CSS -->
                      <span class="tail">
                        <span class="chips">
                          <span class="chip" *ngFor="let c of m.teams">{{ c }}</span>
                        </span>
                        <span class="actions">
                          <button class="icon-btn icon-btn--danger" fvdrTooltip="Remove from group" tooltipPosition="top"
                                  aria-label="Remove from group" (click)="remove(g, m)">
                            <fvdr-icon name="user-remove"></fvdr-icon>
                          </button>
                          <button *ngIf="variant === 'v3'" class="icon-btn" fvdrTooltip="More" tooltipPosition="top" aria-label="More">
                            <fvdr-icon name="more"></fvdr-icon>
                          </button>
                        </span>
                      </span>
                    </div>
                  </ng-container>
                </ng-container>
              </ng-container>
            </ng-container>
          </div>
        </section>

        <section class="panel">
          <div class="panel__head">
            <span class="panel__title">Answer side</span>
          </div>
          <fvdr-search placeholder="Search"></fvdr-search>
          <div class="tree" [ngClass]="'tree--' + variant">
            <div class="row row--group" *ngFor="let a of answer">
              <span class="chev chev--blank"></span>
              <span class="role-icon" [ngClass]="'role-icon--' + a.tone"><fvdr-icon [name]="a.icon"></fvdr-icon></span>
              <span class="row__name">{{ a.name }}</span>
              <button class="link link--end"><fvdr-icon name="user-add"></fvdr-icon>Add</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--color-stone-0); font-family: var(--font-family); color: var(--color-text-primary); }
    .page { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-3); }
    .top__title { font-size: var(--font-size-base); font-weight: 600; }
    .hint { margin: 0 0 var(--space-4); color: var(--color-text-secondary); font-size: var(--text-caption1-size); }

    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
    @media (max-width: 1024px) { .cols { grid-template-columns: 1fr; } }
    .panel { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
    .panel__head { display: flex; align-items: center; justify-content: space-between; background: var(--color-stone-200); padding: var(--space-2) var(--space-3); min-height: var(--space-8); }
    .panel__title { font-weight: 600; }

    .link { display: inline-flex; align-items: center; gap: var(--space-1); border: 0; background: none; color: var(--color-primary-500); font: inherit; font-size: var(--text-caption1-size); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); }
    .link:hover { color: var(--color-primary-600); }
    .link--end { margin-left: auto; }

    .tree { display: flex; flex-direction: column; }
    .row { display: flex; align-items: center; gap: var(--space-2); min-height: var(--space-8); padding: 0 var(--space-3); border-radius: var(--radius-sm); }
    .row--group { padding-left: var(--space-8); }
    .row--user { padding-left: calc(var(--space-10) + var(--space-4)); cursor: default; outline: none; }
    .row--user:hover, .row--user:focus-within, .row--user:focus-visible { background: var(--color-hover-bg); }
    .row__name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

    .chev { display: inline-flex; align-items: center; justify-content: center; width: var(--space-5); height: var(--space-5); border: 0; background: none; color: var(--color-stone-700); cursor: pointer; padding: 0; }
    .chev--blank { cursor: default; }
    .team-icon { color: var(--color-primary-500); font-size: var(--space-5); }
    .role-icon { display: inline-flex; align-items: center; justify-content: center; width: var(--space-5); height: var(--space-5); border-radius: var(--radius-sm); background: var(--color-primary-500); color: var(--color-stone-0); font-size: var(--text-caption1-size); }
    .role-icon--blue { background: var(--color-info-500); }
    .role-icon--stone { background: var(--color-stone-700); }

    .tail { display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 0; position: relative; }
    .chips { display: flex; gap: var(--space-1); min-width: 0; }
    .chip { padding: 0 var(--space-2); border-radius: var(--radius-sm); background: var(--color-stone-300); color: var(--color-text-secondary); font-size: var(--text-caption1-size); line-height: var(--space-5); white-space: nowrap; }
    .actions { display: flex; align-items: center; gap: var(--space-1); }

    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: var(--space-6); height: var(--space-6); border: 0; border-radius: var(--radius-sm); background: none; color: var(--color-stone-700); cursor: pointer; font-size: var(--font-size-base); }
    .icon-btn:hover { background: var(--color-stone-400); }
    .icon-btn--danger { color: var(--color-error-600); }

    /* V1 — chips right-aligned, action slot always reserved; only visibility toggles → zero shift */
    .tree--v1 .chips { margin-left: auto; }
    .tree--v1 .actions { visibility: hidden; }
    .tree--v1 .row--user:hover .actions,
    .tree--v1 .row--user:focus-within .actions { visibility: visible; }

    /* V2 — chips left-aligned next to name; action appears at the end */
    .tree--v2 .actions { display: none; margin-left: auto; }
    .tree--v2 .row--user:hover .actions,
    .tree--v2 .row--user:focus-within .actions { display: flex; }

    /* V3 — chips hug the right edge (no wasted gutter); on hover the action toolbar
       fades in on top of the chips' end with a soft background veil → no layout shift, no reserved space */
    .tree--v3 .chips { margin-left: auto; }
    .tree--v3 .actions {
      position: absolute; right: calc(-1 * var(--space-1)); top: 50%; transform: translate(var(--space-1), -50%);
      padding-left: var(--space-8);
      background: linear-gradient(to right, transparent, var(--color-hover-bg) var(--space-6));
      opacity: 0; pointer-events: none; transition: opacity .12s ease, transform .12s ease;
    }
    .tree--v3 .row--user:hover .actions,
    .tree--v3 .row--user:focus-within .actions { opacity: 1; pointer-events: auto; transform: translate(0, -50%); }
  `],
})
export class QnaHoverVariantsComponent {
  variant: Variant = 'v1';
  variants: SegmentItem[] = [
    { id: 'v1', label: 'V1 · Reserved slot' },
    { id: 'v2', label: 'V2 · Left chips' },
    { id: 'v3', label: 'V3 · Overlay toolbar' },
  ];
  hints: Record<Variant, string> = {
    v1: 'Chips are right-aligned; the space for the hover icon is always reserved, so nothing moves on hover.',
    v2: 'Chips sit next to the name; the hover icon appears at the row end and pushes nothing else.',
    v3: 'Chips hug the right edge with no reserved gutter; on hover/focus an action toolbar fades in over their end with a soft veil — zero layout shift, keyboard accessible, room for more actions.',
  };

  teams: Team[] = [
    { name: 'Alfa project', open: true, groups: [
      { name: 'Submitters', open: true, members: [
        { initials: 'AR', name: 'Alejandro Ruiz', teams: ['Bidder 2', 'Alfa project'] },
      ] },
    ] },
    { name: 'Bidder 2', open: true, groups: [
      { name: 'Submitters', count: 3, open: true, members: [
        { initials: 'AR', name: 'Alejandro Ruiz', teams: ['Bidder 2', 'Alfa project'] },
        { initials: 'AL', name: 'Anya Lee', teams: [] },
        { initials: 'MC', name: 'Milo Chen', teams: [] },
      ] },
    ] },
  ];

  answer = [
    { name: 'Coordinators', icon: 'group' as const, tone: 'green' },
    { name: 'Experts', icon: 'user' as const, tone: 'blue' },
    { name: 'Approvers', icon: 'user-check' as const, tone: 'stone' },
  ];

  remove(g: Group, m: Member) {
    g.members = g.members.filter(x => x !== m);
    if (g.count) g.count = g.members.length;
  }
}
