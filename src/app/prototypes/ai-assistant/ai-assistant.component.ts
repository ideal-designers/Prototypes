import { Component, HostBinding, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { AiConversationService } from './services/ai-conversation.service';
import { AiEngineService } from './services/ai-engine.service';
import { AiLlmService } from './services/ai-llm.service';
import { AiFullscreenComponent } from './shells/ai-fullscreen.component';
import { AiSidebarComponent } from './shells/ai-sidebar.component';
import { AiFloatingComponent } from './shells/ai-floating.component';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { ProjectAnswer } from './models/ai-scenario.model';
import { VDR_PRODUCT_COMPONENTS, VdrPageId } from './product';

/**
 * Global AI Assistant — routed host and mode switcher.
 *
 * Owns the conversation engine, so promoting a chat between the full-screen,
 * docked and floating shells swaps only the container: messages, scope and
 * recents live in the services and survive every transition.
 */
@Component({
  selector: 'fvdr-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    ...DS_COMPONENTS,
    ...VDR_PRODUCT_COMPONENTS,
    AiFullscreenComponent,
    AiSidebarComponent,
    AiFloatingComponent,
    CreateProjectModalComponent,
  ],
  providers: [AiConversationService, AiEngineService, AiLlmService],
  template: `
    <fvdr-ai-fullscreen *ngIf="conv.shell() === 'fullscreen'"></fvdr-ai-fullscreen>

    <!-- Real-product pages — the surface the assistant opens on top of. -->
    <div class="host" *ngIf="conv.shell() !== 'fullscreen'">
      <!-- No rightInset for the drawer: it sits beside the shell in the flex row, so
           the shell (and the Intercom launcher inside it) already reflows. The input
           stays available for a panel that overlays instead of docking. -->
      <fvdr-vdr-shell
        [page]="page()"
        (pageChange)="page.set($event)"
        (themeToggle)="conv.toggleDark()"
      >
        <fvdr-ask-ideon topbar-actions (clicked)="openFloating()"></fvdr-ask-ideon>

        <ng-container [ngSwitch]="page()">
          <fvdr-vdr-dashboard *ngSwitchCase="'dashboard'"></fvdr-vdr-dashboard>
          <fvdr-vdr-documents *ngSwitchCase="'documents'"></fvdr-vdr-documents>
          <fvdr-vdr-signatures *ngSwitchCase="'signatures'"></fvdr-vdr-signatures>
          <fvdr-vdr-dd-checklist *ngSwitchCase="'dd-checklist'"></fvdr-vdr-dd-checklist>
          <fvdr-vdr-participants *ngSwitchCase="'participants'"></fvdr-vdr-participants>
          <fvdr-vdr-permissions *ngSwitchCase="'permissions'"></fvdr-vdr-permissions>
          <fvdr-vdr-qna *ngSwitchCase="'qna'"></fvdr-vdr-qna>
          <fvdr-vdr-activity-log *ngSwitchCase="'activity-log'"></fvdr-vdr-activity-log>
          <fvdr-vdr-documents-overview *ngSwitchCase="'documents-overview'"></fvdr-vdr-documents-overview>
          <fvdr-vdr-archiving *ngSwitchCase="'archiving'"></fvdr-vdr-archiving>
          <fvdr-vdr-recycle-bin *ngSwitchCase="'recycle-bin'"></fvdr-vdr-recycle-bin>
        </ng-container>
      </fvdr-vdr-shell>

      <!-- Docked assistant — sits beside the page, never over the Intercom launcher -->
      <fvdr-ai-sidebar *ngIf="conv.shell() === 'sidebar'"></fvdr-ai-sidebar>
    </div>

    <!-- Floating assistant — overlays whichever page is open -->
    <fvdr-ai-floating *ngIf="conv.shell() === 'floating'"></fvdr-ai-floating>

    <fvdr-create-project-modal
      [visible]="conv.createProjectRequest() !== null"
      [initialName]="conv.createProjectRequest() || ''"
      (created)="onProjectCreated($event)"
      (cancelled)="conv.dismissCreateProject()"
    ></fvdr-create-project-modal>

    <fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .host { display: flex; height: 100%; min-height: 0; }
    .host > fvdr-vdr-shell { flex: 1; min-width: 0; }
  `],
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);
  readonly conv = inject(AiConversationService);

  /** Which product page is showing behind the assistant. */
  readonly page = signal<VdrPageId>('documents');

  @HostBinding('class.dark-theme') get dark(): boolean {
    return this.conv.isDark();
  }

  /** Docked mode is only available at desktop width — keep the service in sync. */
  @HostListener('window:resize')
  onResize(): void {
    this.conv.setViewportWidth(window.innerWidth);
  }

  /** Ask Ideon — always opens the floating window, per the agreed entry-point model. */
  openFloating(): void {
    this.conv.resetScope();
    this.conv.seededTitle.set('New AI chat');
    this.conv.setShell('floating');
  }

  ngOnInit(): void {
    this.tracker.trackPageView('ai-assistant');
    this.conv.setViewportWidth(window.innerWidth);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  /** Scenario D — confirmed creation, answered with a citation and next steps. */
  onProjectCreated(name: string): void {
    this.conv.dismissCreateProject();

    const answer: ProjectAnswer = {
      kind: 'project',
      text: `“${name}” has been created. It's empty for now — here's what usually comes next.`,
      projectName: name,
      nextSteps: ['Upload documents', 'Invite users', 'Apply a folder template'],
      followUp: 'I can also seed the folder structure from a due-diligence template.',
    };

    this.conv.addAssistantAnswer(
      answer,
      `${answer.text}\nProject: ${name}\n${answer.nextSteps.map(s => `· ${s}`).join('\n')}`,
    );
    this.toast.show({ variant: 'success', message: `Project “${name}” created` });
  }
}
