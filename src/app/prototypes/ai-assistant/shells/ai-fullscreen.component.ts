import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DS_COMPONENTS,
  SidebarNavItem,
  BreadcrumbItem,
  HeaderAction,
} from '../../../shared/ds';
import { AiConversationService } from '../services/ai-conversation.service';
import { AiConversationComponent } from '../components/ai-conversation/ai-conversation.component';
import { MOCK_DATA_ROOM } from '../data/mock-data';
import { vdrNavItems } from '../data/vdr-nav';

/** Full-screen shell — product chrome + AI conversation rail + centered transcript. */
@Component({
  selector: 'fvdr-ai-fullscreen',
  standalone: true,
  imports: [CommonModule, ...DS_COMPONENTS, AiConversationComponent],
  template: `
<div class="ai-shell">

  <!-- ── Room sidebar ─────────────────────────────────────────────── -->
  <fvdr-sidebar-nav
    variant="vdr"
    [accountName]="room.name"
    [items]="navItems"
    [(collapsed)]="sidebarCollapsed"
    (itemClick)="onNavClick($event)"
  ></fvdr-sidebar-nav>

  <!-- ── Main ─────────────────────────────────────────────────────── -->
  <div class="ai-main">
    <fvdr-header
      [breadcrumbs]="breadcrumbs"
      [actions]="headerActions"
      [showMenu]="false"
      userName="DT"
      (actionClick)="onHeaderAction($event)"
    ></fvdr-header>

    <div class="ai-body">

      <!-- Conversation rail -->
      <aside class="rail">
        <div class="rail__action rail__action--primary">
          <fvdr-btn
            label="New chat"
            variant="ghost"
            size="m"
            iconName="plus"
            (clicked)="onNewChat()"
          ></fvdr-btn>
        </div>
        <div class="rail__action">
          <fvdr-btn
            label="Add project"
            variant="ghost"
            size="m"
            iconName="add-project"
            (clicked)="onAddProject()"
          ></fvdr-btn>
        </div>

        <div class="rail__section">
          <span class="rail__label">Recents</span>
          <ul class="rail__list">
            <li *ngFor="let r of conv.recents()">
              <button
                type="button"
                class="rail__item"
                [class.rail__item--active]="conv.activeChatId() === r.id"
                (click)="conv.openRecent(r.id)"
              >
                <span class="rail__item-title">{{ r.title }}</span>
                <span class="rail__item-meta">{{ r.updatedAt }}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Conversation column -->
      <main class="ai-col">
        <div class="ai-col__inner">
          <fvdr-ai-conversation></fvdr-ai-conversation>
        </div>
      </main>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; height: 100vh; font-family: var(--font-family); color: var(--color-text-primary); }

    .ai-shell { display: flex; height: 100vh; overflow: hidden; background: var(--color-stone-0); }
    .ai-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .ai-body { flex: 1; display: flex; min-height: 0; }

    /* ── Conversation rail ── */
    .rail {
      width: 280px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: var(--space-2);
      padding: var(--space-4) var(--space-3);
      border-right: 1px solid var(--color-divider);
      background: var(--color-stone-0);
      overflow-y: auto;
    }
    .rail__action { display: flex; }
    .rail__action ::ng-deep .btn { width: 100%; justify-content: flex-start; }
    /* Both rail buttons are ghost — "New chat" stays the lead affordance via brand colour + weight. */
    .rail__action--primary ::ng-deep .btn { color: var(--color-primary-500); }
    .rail__action--primary ::ng-deep .btn:hover:not(:disabled) { color: var(--color-primary-600); }
    .rail__action--primary ::ng-deep .btn__label { font-weight: var(--font-weight-semi, 600); }

    .rail__section { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-4); }
    .rail__label {
      padding: 0 var(--space-2);
      font-size: var(--font-size-xs, 12px);
      font-weight: var(--font-weight-semi, 600);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .rail__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
    .rail__item {
      width: 100%; text-align: left;
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--space-2);
      border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      font-family: var(--font-family);
    }
    .rail__item:hover { background: var(--color-hover-bg); }
    .rail__item--active { background: var(--color-primary-50); }
    .rail__item-title {
      font-size: var(--font-size-base, 14px);
      color: var(--color-text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .rail__item-meta { font-size: var(--font-size-xs, 12px); color: var(--color-text-secondary); }

    /* ── Conversation column ── */
    .ai-col { flex: 1; min-width: 0; display: flex; justify-content: center; padding: 0 var(--space-8); }
    .ai-col__inner { width: 100%; max-width: 1040px; height: 100%; min-height: 0; }
  `],
})
export class AiFullscreenComponent {
  readonly conv = inject(AiConversationService);

  readonly room = MOCK_DATA_ROOM;
  sidebarCollapsed = false;

  breadcrumbs: BreadcrumbItem[] = [
    { id: 'room', label: 'Nike' },
    { id: 'ai', label: 'AI Assistant' },
  ];

  headerActions: HeaderAction[] = [
    { id: 'dock', icon: 'ai-assistant', label: 'Dock' },
    { id: 'theme', icon: 'theme-dark' },
    { id: 'bell', icon: 'bell', badge: 2 },
  ];

  navItems: SidebarNavItem[] = vdrNavItems('ai');

  onNewChat(): void {
    this.conv.newChat();
  }

  /** Scenario D — adding a project starts from the same confirmed-creation dialog. */
  onAddProject(): void {
    this.conv.requestCreateProject('');
  }

  onNavClick(item: SidebarNavItem): void {
    if (item.id === 'documents') this.conv.setShell('documents');
  }

  onHeaderAction(id: string): void {
    if (id === 'dock') this.conv.setShell('sidebar');
    if (id === 'theme') this.conv.toggleDark();
  }
}
