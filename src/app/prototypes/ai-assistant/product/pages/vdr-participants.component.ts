import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, TableColumn } from '../../../../shared/ds';
import { VdrActionBarComponent, VdrActionBarButton } from '../vdr-action-bar.component';

/**
 * Participants — replica of `.design/real-product-spec.md` section 2.5.
 * Action bar plus the group table with its sortable first column, status chips
 * and a user count badge. One row, as captured. Inert.
 */
@Component({
  selector: 'fvdr-vdr-participants',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, VdrActionBarComponent],
  template: `
<div class="page page--flush parts">

  <div class="parts__bar">
    <fvdr-vdr-action-bar
      [primary]="primary"
      [secondaries]="secondaries"
      [overflow]="false"
      searchPlaceholder="Search participants"
    ></fvdr-vdr-action-bar>
  </div>

  <div class="parts__body">
    <div class="table-wrap">
      <fvdr-table [columns]="columns" [data]="rows">
        <ng-template fvdrCell="group" let-value let-row="row">
          <span class="cell-name">
            <span class="cell-icon"><fvdr-icon name="chevron-right"></fvdr-icon></span>
            <span class="cell-icon"><fvdr-icon name="users-groups"></fvdr-icon></span>
            <span>{{ value }} <strong>{{ row.groupSuffix }}</strong></span>
          </span>
        </ng-template>

        <ng-template fvdrCell="access" let-value>
          <fvdr-chip [label]="value" variant="green" size="s" icon="check"></fvdr-chip>
        </ng-template>

        <ng-template fvdrCell="invitation" let-value>
          <fvdr-chip [label]="value" variant="grey" size="s" icon="close"></fvdr-chip>
        </ng-template>

        <ng-template fvdrCell="users" let-value>
          <fvdr-counter [value]="value" size="s"></fvdr-counter>
        </ng-template>
      </fvdr-table>

      <fvdr-ghost-btn
        class="table-wrap__cols"
        size="small"
        icon="table-view"
        tooltip="Customize columns"
      ></fvdr-ghost-btn>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./vdr-page.css'],
  styles: [`
    :host { display: block; }
    .parts__bar { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .parts__body { padding: var(--space-4) var(--space-6) var(--space-8); }
  `],
})
export class VdrParticipantsComponent {
  readonly primary: VdrActionBarButton = { id: 'add', label: 'Add participants', icon: 'user-add' };
  readonly secondaries: VdrActionBarButton[] = [
    { id: 'group', label: 'Create group' },
    { id: 'import', label: 'Import' },
    { id: 'export', label: 'Export' },
    { id: 'reports', label: 'View reports' },
  ];

  readonly columns: TableColumn[] = [
    { key: 'group', label: 'Group', sortable: true },
    { key: 'role', label: 'Role', width: '160px' },
    { key: 'access', label: 'Project access', width: '150px' },
    { key: 'invitation', label: 'Invitation status', width: '160px' },
    { key: 'lastSignIn', label: 'Last sign-in', width: '150px' },
    { key: 'users', label: 'Users', width: '110px' },
  ];

  readonly rows = [
    {
      group: 'Administrators',
      groupSuffix: '(your group)',
      role: 'Administrator',
      access: 'Enabled',
      invitation: 'Not sent',
      lastSignIn: 'Today, 12:33',
      users: 1,
    },
  ];
}
