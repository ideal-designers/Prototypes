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
import { MockDocument, MockFolder } from '../../models/mock-doc.model';
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
    ></fvdr-header>

    <div class="docs-body">
      <section class="docs-col">
        <header class="docs-head">
          <div class="docs-path">
            <fvdr-file-icon type="folder-open"></fvdr-file-icon>
            <span class="docs-path__room">{{ room.name }}</span>
            <fvdr-icon name="chevron-right" class="docs-path__sep"></fvdr-icon>
            <span class="docs-path__leaf">Documents</span>
          </div>

          <button type="button" class="docs-ai" (click)="openSidebar()">
            <fvdr-icon name="api"></fvdr-icon>
            <span>Ask AI</span>
          </button>
        </header>

        <div class="docs-folders">
          <div class="docs-folder" *ngFor="let f of room.folders">
            <fvdr-file-icon type="folder"></fvdr-file-icon>
            <span class="docs-folder__name">{{ f.name }}</span>
            <span class="docs-folder__count">{{ countIn(f) }} documents</span>
            <button
              type="button"
              class="docs-folder__ai"
              [attr.title]="'Ask AI about ' + f.name"
              (click)="openFloating(f)"
            >
              <fvdr-icon name="api"></fvdr-icon>
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        <fvdr-table [columns]="columns" [data]="documents">
          <ng-template fvdrCell="name" let-value let-row="row">
            <span class="docs-name">
              <fvdr-file-icon [type]="row.type"></fvdr-file-icon>
              <button type="button" class="docs-link" (click)="onDocClick(row)">{{ value }}</button>
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

    .docs-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-4);
      border-bottom: 1px solid var(--color-divider);
      padding-bottom: var(--space-3);
    }
    .docs-path { display: flex; align-items: center; gap: var(--space-2); }
    .docs-path__room {
      font-size: var(--font-size-xl, 18px);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-primary);
    }
    .docs-path__sep { font-size: var(--font-size-xs, 12px); color: var(--color-stone-600); }
    .docs-path__leaf { font-size: var(--font-size-md, 15px); color: var(--color-text-secondary); }

    .docs-ai, .docs-folder__ai {
      display: inline-flex; align-items: center; gap: var(--space-2);
      border: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      color: var(--color-primary-500);
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      font-family: var(--font-family);
      font-size: var(--font-size-base, 14px);
      cursor: pointer;
    }
    .docs-ai:hover, .docs-folder__ai:hover {
      background: var(--color-primary-50); border-color: var(--color-primary-500);
    }

    .docs-folders { display: flex; flex-direction: column; }
    .docs-folder {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-2);
      border-bottom: 1px solid var(--color-divider);
    }
    .docs-folder:hover { background: var(--color-hover-bg); }
    .docs-folder__name { font-size: var(--font-size-base, 14px); color: var(--color-text-primary); }
    .docs-folder__count {
      flex: 1;
      font-size: var(--font-size-xs, 12px);
      color: var(--color-text-secondary);
    }
    .docs-folder__ai { padding: var(--space-1) var(--space-2); font-size: var(--font-size-xs, 12px); }

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
    { id: 'ai', icon: 'api', label: 'AI' },
    { id: 'theme', icon: 'theme-dark' },
    { id: 'bell', icon: 'bell', badge: 2 },
  ];

  navItems: SidebarNavItem[] = [
    { id: 'overview', label: 'Overview', icon: 'nav-overview', iconActive: 'nav-overview-active' },
    { id: 'documents', label: 'Documents', icon: 'nav-projects', iconActive: 'nav-projects-active', active: true },
    { id: 'ai', label: 'AI Assistant', icon: 'api', iconActive: 'api' },
    { id: 'participants', label: 'Participants', icon: 'nav-participants', iconActive: 'nav-participants-active' },
    { id: 'reports', label: 'Reports', icon: 'nav-reports', iconActive: 'nav-reports-active' },
  ];

  countIn(folder: MockFolder): number {
    return this.documents.filter(d => d.folderPath === folder.name).length;
  }

  // ── Assistant entry points ──

  /** Sparkle in the local header — docks the assistant to the right. */
  openSidebar(): void {
    this.conv.resetScope();
    this.conv.seededTitle.set('New AI chat');
    this.conv.setShell('sidebar');
  }

  /** Folder action — opens a floating window pre-scoped to that folder. */
  openFloating(folder: MockFolder): void {
    this.conv.setScope({ kind: 'folder', label: folder.name, folderName: folder.name });
    this.conv.seededTitle.set(`Find the documents in the “${folder.name}” folder`);
    this.conv.setShell('floating');
  }

  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'ai') this.conv.setShell('fullscreen');
  }

  onHeaderAction(id: string): void {
    if (id === 'ai') this.openSidebar();
    if (id === 'theme') this.conv.toggleDark();
  }

  onDocClick(doc: MockDocument): void {
    this.toast.show({ variant: 'info', message: `Would open ${doc.name}` });
  }
}
