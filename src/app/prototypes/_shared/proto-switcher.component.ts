import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../shared/ds/icons/icon.component';

export interface ProtoOption { id: string; label: string }
export interface ProtoGroup { id: string; label?: string; options: ProtoOption[]; value: string }

/**
 * Prototype-only control bar: a compact row of option groups pinned to the bottom of the
 * screen, used to flip between solution variants. Not product UI — kept small (24px
 * buttons, 12px text) so every group fits on one line over the prototype.
 *
 *   <fvdr-vdr-proto-switcher [groups]="groups" (changed)="onOption($event)" (restart)="reset()" />
 */
@Component({
  selector: 'fvdr-vdr-proto-switcher',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="sw" role="toolbar" aria-label="Prototype options">
      <ng-container *ngFor="let g of groups; let first = first; trackBy: byId">
        <span class="sw__div" *ngIf="!first" aria-hidden="true"></span>
        <span class="sw__label" *ngIf="g.label">{{ g.label }}</span>
        <div class="sw__seg" role="radiogroup" [attr.aria-label]="g.label || g.id">
          <button type="button" class="sw__opt" *ngFor="let o of g.options; trackBy: byId" role="radio"
                  [class.sw__opt--on]="o.id === g.value" [attr.aria-checked]="o.id === g.value"
                  (click)="o.id !== g.value && changed.emit({ group: g.id, value: o.id })">{{ o.label }}</button>
        </div>
      </ng-container>
      <span class="sw__div" aria-hidden="true"></span>
      <button type="button" class="sw__reset" title="Restart the prototype" (click)="restart.emit()">
        <fvdr-icon name="refresh"></fvdr-icon>Restart
      </button>
    </div>
  `,
  styles: [`
    :host { position: fixed; left: 50%; bottom: var(--space-4); transform: translateX(-50%); z-index: 350;
      max-width: calc(100vw - var(--space-8)); font-family: var(--font-family); }
    .sw { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-2);
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md);
      box-shadow: var(--shadow-popup, 0 4px 16px rgba(0, 0, 0, 0.12)); white-space: nowrap; overflow-x: auto; }
    .sw__label { font-size: var(--font-size-3xs, 10px); font-weight: var(--font-weight-semi, 600); letter-spacing: 0.04em;
      text-transform: uppercase; color: var(--color-text-secondary); }
    .sw__div { flex: 0 0 auto; width: 1px; height: 16px; background: var(--color-divider); }
    .sw__seg { display: inline-flex; padding: 2px; gap: 2px; border-radius: var(--radius-sm); background: var(--color-stone-200); }
    .sw__opt { height: 24px; padding: 0 var(--space-2); border: none; border-radius: var(--radius-sm); background: transparent;
      cursor: pointer; font-family: var(--font-family); font-size: var(--text-caption1-size, 12px); line-height: 16px;
      color: var(--color-text-secondary); }
    .sw__opt:hover { color: var(--color-text-primary); }
    .sw__opt--on { background: var(--color-stone-0); color: var(--color-text-primary); font-weight: var(--font-weight-semi, 600);
      box-shadow: var(--shadow-card); }
    .sw__opt:focus-visible, .sw__reset:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 1px; }
    .sw__reset { display: inline-flex; align-items: center; gap: var(--space-1); height: 24px; padding: 0 var(--space-2);
      border: none; background: transparent; border-radius: var(--radius-sm); cursor: pointer;
      font-family: var(--font-family); font-size: var(--text-caption1-size, 12px); color: var(--color-text-secondary); }
    .sw__reset:hover { background: var(--color-hover-bg); color: var(--color-text-primary); }
  `],
})
export class VdrProtoSwitcherComponent {
  @Input() groups: ProtoGroup[] = [];
  @Output() changed = new EventEmitter<{ group: string; value: string }>();
  @Output() restart = new EventEmitter<void>();

  /** Hosts often rebuild `groups` per change — track by id so a button isn't replaced mid-click. */
  byId = (_: number, x: { id: string }) => x.id;
}
