import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';

@Component({
  selector: 'fvdr-project-archive-creation-flow-testing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="proto">
      <h1>Project Archive Creation flow - testing</h1>
      <!-- TODO: implement prototype UI -->
      <button data-track="primary-cta" (click)="onSuccess()">Complete task</button>
      <button data-track="cancel" (click)="onFail()">Cancel</button>
    </div>
  `,
  styles: [`
    .proto {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Open Sans', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
    }
    h1 { color: #2C9C74; margin: 0 0 24px; }
    button {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
    }
    [data-track="primary-cta"] { background: #2C9C74; color: #fff; }
    [data-track="primary-cta"]:hover { background: #3FB67D; }
    [data-track="cancel"] { background: #101A16; color: #9bbfb0; border: 1px solid #1e2e28; }
  `],
})
export class ProjectArchiveCreationFlowTestingComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit(): void {
    this.tracker.trackPageView('project-archive-creation-flow-testing');
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }

  onSuccess(): void {
    this.tracker.trackTask('project-archive-creation-flow-testing', 'task_complete');
  }

  onFail(): void {
    this.tracker.trackTask('project-archive-creation-flow-testing', 'task_fail');
  }
}
