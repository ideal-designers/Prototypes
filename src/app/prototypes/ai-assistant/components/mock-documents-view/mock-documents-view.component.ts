import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DS_COMPONENTS,
  BreadcrumbItem,
  HeaderAction,
  SidebarNavItem,
  TableColumn,
  ToastService,
} from '../../../../shared/ds';
import { AiConversationService } from '../../services/ai-conversation.service';
import { MOCK_DATA_ROOM, PERMITTED_DOCUMENTS } from '../../data/mock-data';
import { vdrNavItems } from '../../data/vdr-nav';
import { MockDocument } from '../../models/mock-doc.model';
import { AiSidebarComponent } from '../../shells/ai-sidebar.component';
import { AiFloatingComponent } from '../../shells/ai-floating.component';

/**
 * Mock Documents screen — the host page the sidebar docks beside and the floating
 * window overlays. Deliberately thin: enough VDR chrome to make the assistant's
 * in-context entry points read as real.
 */
@Component({
  selector: 'fvdr-mock-documents-view',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, AiSidebarComponent, AiFloatingComponent],
  template: `
<div class="docs-shell">

  <fvdr-sidebar-nav
    variant="vdr"
    [accountName]="room.name"
    [items]="navItems"
    [(collapsed)]="sidebarCollapsed"
    (itemClick)="onNavClick($event)"
  ></fvdr-sidebar-nav>

  <div class="docs-main">
    <fvdr-header
      [breadcrumbs]="breadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="DT"
      (actionClick)="onHeaderAction($event)"
    >
      <fvdr-ask-ideon header-actions (clicked)="openFloating()"></fvdr-ask-ideon>
    </fvdr-header>

    <div class="docs-body">
      <section class="docs-col">
        <fvdr-table [columns]="columns" [data]="documents">
          <ng-template fvdrCell="name" let-value let-row="row">
            <span class="docs-name">
              <fvdr-file-icon [type]="row.type"></fvdr-file-icon>
              <button type="button" class="docs-link" (click)="onDocClick(row)">{{ value }}</button>
            </span>
          </ng-template>

          <!-- Folder cell doubles as the context-seeded assistant entry point. -->
          <ng-template fvdrCell="folderPath" let-value>
            <span class="docs-loc">
              <span class="docs-loc__name">{{ value }}</span>
              <button
                type="button"
                class="docs-loc__ai"
                [attr.title]="'Ask AI about ' + value"
                (click)="openFloatingForFolderName(value)"
              >
                <fvdr-icon name="ai-assistant"></fvdr-icon>
                <span>Ask AI</span>
              </button>
            </span>
          </ng-template>

          <ng-template fvdrCell="sizeLabel" let-value let-row="row">
            {{ value }} · {{ row.pages }} pages
          </ng-template>

          <ng-template fvdrCell="signatureStatus" let-value>
            <span class="docs-sig" *ngIf="value; else noSig">{{ value }}</span>
            <ng-template #noSig><span class="docs-sig docs-sig--none">—</span></ng-template>
          </ng-template>
        </fvdr-table>
      </section>

      <!-- Docked assistant — the table column reflows to make room -->
      <fvdr-ai-sidebar *ngIf="conv.shell() === 'sidebar'"></fvdr-ai-sidebar>
    </div>
  </div>

  <!-- Floating assistant — overlays the current view -->
  <fvdr-ai-floating *ngIf="conv.shell() === 'floating'"></fvdr-ai-floating>
</div>
  `,
  styles: [`
    :host { display: block; height: 100%; font-family: var(--font-family); color: var(--color-text-primary); }

    .docs-shell { display: flex; height: 100vh; overflow: hidden; background: var(--color-stone-0); }
    .docs-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .docs-body { flex: 1; display: flex; min-height: 0; }

    .docs-col {
      flex: 1; min-width: 0; overflow-y: auto;
      padding: var(--space-6) var(--space-8);
      display: flex; flex-direction: column; gap: var(--space-5);
    }

    /* Location cell — the Ask AI action stays hidden until the row is hovered. */
    .docs-loc { display: inline-flex; align-items: center; gap: var(--space-2); }
    .docs-loc__name { color: var(--color-text-secondary); }
    .docs-loc__ai {
      display: inline-flex; align-items: center; gap: var(--space-1);
      border: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      color: var(--color-primary-500);
      border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-2);
      font-family: var(--font-family);
      font-size: var(--font-size-xs, 12px);
      cursor: pointer;
      opacity: 0; visibility: hidden;
      transition: opacity 0.12s ease;
    }
    :host ::ng-deep tr:hover .docs-loc__ai,
    .docs-loc__ai:focus-visible { opacity: 1; visibility: visible; }
    .docs-loc__ai:hover {
      background: var(--color-primary-50); border-color: var(--color-primary-500);
    }

    .docs-name { display: inline-flex; align-items: center; gap: var(--space-2); }
    .docs-link {
      border: none; background: transparent; padding: 0; margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
      cursor: pointer; text-align: left;
    }
    .docs-link:hover { color: var(--color-primary-500); text-decoration: underline; }

    .docs-sig { font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .docs-sig--none { color: var(--color-text-placeholder); }
  `],
})
export class MockDocumentsViewComponent {
  readonly conv = inject(AiConversationService);
  private toast = inject(ToastService);

  readonly room = MOCK_DATA_ROOM;
  readonly documents: MockDocument[] = PERMITTED_DOCUMENTS;

  sidebarCollapsed = false;

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'folderPath', label: 'Location' },
    { key: 'sizeLabel', label: 'Size', width: '190px' },
    { key: 'addedOn', label: 'Added on', width: '150px' },
    { key: 'signatureStatus', label: 'Signature', width: '130px' },
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { id: 'room', label: 'Nike' },
    { id: 'documents', label: 'Documents' },
  ];

  headerActions: HeaderAction[] = [
    { id: 'theme', icon: 'theme-dark' },
    { id: 'bell', icon: 'bell', badge: 2 },
  ];

  navItems: SidebarNavItem[] = vdrNavItems('documents');

  // ── Assistant entry points ──

  /** Ask Ideon — always opens the floating window, scoped to the whole room. */
  openFloating(): void {
    this.conv.resetScope();
    this.conv.seededTitle.set('New AI chat');
    this.conv.setShell('floating');
  }

  /** Location-cell action — opens a floating window pre-scoped to that folder. */
  openFloatingForFolderName(folderName: string): void {
    this.conv.setScope({ kind: 'folder', label: folderName, folderName });
    this.conv.seededTitle.set(`Find the documents in the “${folderName}” folder`);
    this.conv.setShell('floating');
  }

  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'ai') this.conv.setShell('fullscreen');
  }

  onHeaderAction(id: string): void {
    if (id === 'theme') this.conv.toggleDark();
  }

  onDocClick(doc: MockDocument): void {
    this.toast.show({ variant: 'info', message: `Would open ${doc.name}` });
  }
}
