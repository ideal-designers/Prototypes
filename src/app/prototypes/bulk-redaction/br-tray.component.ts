import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS } from '../../shared/ds';
import { BrStore } from './br-store.service';

/**
 * Background tray for a redaction batch — "Creating redaction drafts · 3 / 6 files" while detection runs,
 * "Redaction drafts ready" with Review results afterwards. Shared by the Documents list and the Redaction page.
 */
@Component({
  selector: 'fvdr-br-tray',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS],
  template: `
    <div class="prog" *ngIf="store.batch as b">
      <div class="prog__head">
        <b>{{ running ? 'Creating redaction drafts' : drafted ? 'Redaction drafts ready' : 'No redaction drafts created' }}</b>
        <span class="grow"></span>
        <fvdr-btn *ngIf="!running" variant="ghost" size="s" [iconName]="minimized ? 'chevron-up' : 'chevron-down'" [iconOnly]="true"
                  [ariaLabel]="minimized ? 'Expand' : 'Minimize'" (clicked)="minimized = !minimized"></fvdr-btn>
        <fvdr-btn variant="ghost" size="s" iconName="close" [iconOnly]="true" ariaLabel="Dismiss" (clicked)="dismissed.emit()"></fvdr-btn>
      </div>
      <ng-container *ngIf="!minimized || running">
        <div class="prog__row">
          <span>{{ running ? doneCount + ' / ' + b.ids.length + ' files' : drafted + ' files drafted · ' + noMatch + ' with no matches' }}</span>
          <span>{{ pct }}%</span>
        </div>
        <fvdr-progress [value]="pct" [variant]="running ? 'default' : 'success'"></fvdr-progress>
        <fvdr-btn *ngIf="!running && drafted" class="prog__btn" label="Review results" variant="primary" size="s" (clicked)="review.emit(withMarks)"></fvdr-btn>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-family); color: var(--color-text-primary); }
    .grow { flex: 1; }
    .prog { position: fixed; right: var(--space-18); bottom: var(--space-6); width: 480px; z-index: 300; padding: var(--space-4);
      background: var(--color-stone-0); border: 1px solid var(--color-divider); border-radius: var(--radius-md); box-shadow: var(--shadow-toast);
      display: flex; flex-direction: column; gap: var(--space-3); }
    .prog__head { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-md); }
    .prog__row { display: flex; justify-content: space-between; font-size: var(--font-size-base); color: var(--color-text-secondary); }
    .prog__btn { align-self: flex-start; }
  `],
})
export class BrTrayComponent {
  store = inject(BrStore);
  @Output() dismissed = new EventEmitter<void>();
  @Output() review = new EventEmitter<string[]>();
  minimized = false;

  get ids(): string[] { return this.store.batch?.ids ?? []; }
  get running(): boolean { return this.ids.some(i => this.store.status(i) === 'detecting'); }
  get doneCount(): number { return this.ids.filter(i => this.store.status(i) !== 'detecting').length; }
  get pct(): number { return this.ids.length ? Math.round((this.doneCount / this.ids.length) * 100) : 0; }
  get withMarks(): string[] { return this.ids.filter(i => this.store.hasMarks(i)); }
  get drafted(): number { return this.withMarks.length; }
  get noMatch(): number { return this.ids.length - this.drafted; }
}
