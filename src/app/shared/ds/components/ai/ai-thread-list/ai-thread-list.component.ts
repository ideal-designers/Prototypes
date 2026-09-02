import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FvdrIconComponent } from '../../../icons/icon.component';
import { AiThread } from '../ai.models';

interface ThreadGroup {
  label: string;
  threads: AiThread[];
}

/**
 * Recent conversations — resume, rename, pin, delete.
 *
 * In a data room a thread is also a record of what was asked about the deal, so
 * delete is destructive (the host must confirm) and pinning matters on long
 * transactions. Follows the FVDR sidebar rule: the active row is bold, never a
 * filled background.
 */
@Component({
  selector: 'fvdr-ai-thread-list',
  standalone: true,
  imports: [CommonModule, FvdrIconComponent],
  template: `
    <div class="threads">
      <p class="threads__empty" *ngIf="!threads.length">No conversations yet.</p>

      <section class="threads__group" *ngFor="let group of groups">
        <h4 class="threads__label" *ngIf="group.label">{{ group.label }}</h4>

        <div class="threads__row" *ngFor="let t of group.threads" [class.threads__row--active]="t.id === activeId">
          <button type="button" class="threads__main" (click)="opened.emit(t)">
            <span class="threads__title">
              <fvdr-icon class="threads__pin" *ngIf="t.pinned" name="pin"></fvdr-icon>
              <span class="threads__title-text">{{ t.title }}</span>
            </span>
            <span class="threads__preview" *ngIf="t.lastMessagePreview">{{ t.lastMessagePreview }}</span>
          </button>

          <span class="threads__actions">
            <button type="button" class="threads__act" [title]="t.pinned ? 'Unpin' : 'Pin'" [attr.aria-label]="t.pinned ? 'Unpin' : 'Pin'" (click)="pinned.emit(t)">
              <fvdr-icon name="pin"></fvdr-icon>
            </button>
            <button type="button" class="threads__act" title="Rename" aria-label="Rename" (click)="renamed.emit(t)">
              <fvdr-icon name="edit"></fvdr-icon>
            </button>
            <button type="button" class="threads__act threads__act--danger" title="Delete" aria-label="Delete" (click)="deleted.emit(t)">
              <fvdr-icon name="trash"></fvdr-icon>
            </button>
          </span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }

    .threads { display: flex; flex-direction: column; gap: var(--space-4); }

    .threads__empty {
      margin: 0; padding: var(--space-4);
      font-size: var(--font-size-sm, 13px);
      color: var(--color-text-secondary);
    }

    .threads__group { display: flex; flex-direction: column; }
    .threads__label {
      margin: 0 0 var(--space-1);
      padding: 0 var(--space-3);
      font-size: var(--font-size-2xs, 11px);
      font-weight: var(--font-weight-semi, 600);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-secondary);
    }

    .threads__row {
      display: flex; align-items: center; gap: var(--space-1);
      padding: 0 var(--space-2) 0 var(--space-3);
      border-radius: var(--radius-sm);
    }
    .threads__row:hover { background: var(--color-hover-bg); }

    .threads__main {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 1px;
      border: none; background: transparent; padding: var(--space-2) 0; margin: 0;
      font-family: var(--font-family);
      cursor: pointer; text-align: left;
    }

    .threads__title { display: flex; align-items: center; gap: var(--space-1); min-width: 0; }
    .threads__pin { flex: 0 0 auto; font-size: var(--font-size-2xs, 11px); color: var(--color-text-secondary); }
    .threads__title-text {
      min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
    }
    /* FVDR sidebar rule: active = bold text, no background fill. */
    .threads__row--active .threads__title-text { font-weight: var(--font-weight-semi, 600); }

    .threads__preview {
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }

    /* Row actions stay hidden until hover — 3 icons per row is visual noise. */
    .threads__actions { display: flex; align-items: center; gap: 0; flex: 0 0 auto; opacity: 0; }
    .threads__row:hover .threads__actions,
    .threads__row:focus-within .threads__actions { opacity: 1; }

    .threads__act {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0;
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs, 12px);
    }
    .threads__act:hover { background: var(--color-stone-300); color: var(--color-text-primary); }
    .threads__act--danger:hover { color: var(--color-error-600); }
  `],
})
export class AiThreadListComponent {
  private _threads: AiThread[] = [];
  groups: ThreadGroup[] = [];

  @Input()
  set threads(value: AiThread[]) {
    this._threads = value ?? [];
    this.groups = this.buildGroups();
  }
  get threads(): AiThread[] { return this._threads; }

  @Input() activeId?: string;

  @Input()
  set groupByDay(value: boolean) {
    this._groupByDay = value;
    this.groups = this.buildGroups();
  }
  get groupByDay(): boolean { return this._groupByDay; }
  private _groupByDay = true;

  @Output() opened = new EventEmitter<AiThread>();
  @Output() renamed = new EventEmitter<AiThread>();
  @Output() pinned = new EventEmitter<AiThread>();
  @Output() deleted = new EventEmitter<AiThread>();

  /** Pinned first, then one group per `updatedAt` label, in arrival order. */
  private buildGroups(): ThreadGroup[] {
    const pinned = this._threads.filter(t => t.pinned);
    const rest = this._threads.filter(t => !t.pinned);
    const groups: ThreadGroup[] = [];

    if (pinned.length) groups.push({ label: 'Pinned', threads: pinned });

    if (!this._groupByDay) {
      if (rest.length) groups.push({ label: pinned.length ? 'Recents' : '', threads: rest });
      return groups;
    }

    for (const thread of rest) {
      const last = groups.at(-1);
      if (last && last.label === thread.updatedAt) last.threads.push(thread);
      else groups.push({ label: thread.updatedAt, threads: [thread] });
    }
    return groups;
  }
}
