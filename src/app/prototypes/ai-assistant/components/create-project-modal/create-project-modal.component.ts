import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DS_COMPONENTS } from '../../../../shared/ds';
import { MOCK_PROJECT_NAMES } from '../../data/mock-data';

/**
 * Scenario D — confirmed action. Creating a project changes data, so the assistant
 * never does it silently: it opens this dialog and waits for confirmation.
 */
@Component({
  selector: 'fvdr-create-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ...DS_COMPONENTS],
  template: `
    <fvdr-modal
      [visible]="visible"
      title="Create new project"
      size="m"
      confirmLabel="Create"
      cancelLabel="Cancel"
      confirmVariant="primary"
      [confirmDisabled]="!isValid"
      (confirmed)="onCreate()"
      (cancelled)="cancelled.emit()"
      (closed)="cancelled.emit()"
    >
      <fvdr-input
        label="Name"
        placeholder="e.g. ACME acquisition"
        [(ngModel)]="name"
        [state]="collision ? 'error' : 'default'"
        [errorText]="collision ? 'A project with this name already exists.' : ''"
        helperText="The project name is visible to everyone you invite."
      ></fvdr-input>
    </fvdr-modal>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-family); }
  `],
})
export class CreateProjectModalComponent {
  @Input() visible = false;

  /** Prefill parsed from the "create a project called X" utterance. */
  @Input() set initialName(value: string) {
    this.name = value ?? '';
  }

  @Output() created = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';

  get collision(): boolean {
    const trimmed = this.name.trim().toLowerCase();
    return !!trimmed && MOCK_PROJECT_NAMES.some(p => p.toLowerCase() === trimmed);
  }

  get isValid(): boolean {
    return !!this.name.trim() && !this.collision;
  }

  onCreate(): void {
    if (!this.isValid) return;
    this.created.emit(this.name.trim());
  }
}
