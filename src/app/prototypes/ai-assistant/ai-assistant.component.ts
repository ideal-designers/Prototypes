import { Component, HostBinding, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DS_COMPONENTS, ToastService } from '../../shared/ds';
import { TrackerService } from '../../services/tracker.service';
import { AiConversationService } from './services/ai-conversation.service';
import { AiEngineService } from './services/ai-engine.service';
import { AiFullscreenComponent } from './shells/ai-fullscreen.component';
import { MockDocumentsViewComponent } from './components/mock-documents-view/mock-documents-view.component';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { ProjectAnswer } from './models/ai-scenario.model';

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
    AiFullscreenComponent,
    MockDocumentsViewComponent,
    CreateProjectModalComponent,
  ],
  providers: [AiConversationService, AiEngineService],
  template: `
    <fvdr-ai-fullscreen *ngIf="conv.shell() === 'fullscreen'"></fvdr-ai-fullscreen>

    <!-- Documents host page — also renders the docked and floating shells -->
    <fvdr-mock-documents-view *ngIf="conv.shell() !== 'fullscreen'"></fvdr-mock-documents-view>

    <fvdr-create-project-modal
      [visible]="conv.createProjectRequest() !== null"
      [initialName]="conv.createProjectRequest() || ''"
      (created)="onProjectCreated($event)"
      (cancelled)="conv.dismissCreateProject()"
    ></fvdr-create-project-modal>

    <fvdr-toast-host></fvdr-toast-host>
  `,
  styles: [`:host { display: block; height: 100vh; }`],
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);
  private toast = inject(ToastService);
  readonly conv = inject(AiConversationService);

  @HostBinding('class.dark-theme') get dark(): boolean {
    return this.conv.isDark();
  }

  ngOnInit(): void {
    this.tracker.trackPageView('ai-assistant');
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
