import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { TrackerService } from '../../services/tracker.service';

const SLUG = 'permission-search';

@Component({
  selector: 'fvdr-permission-search',
  standalone: true,
  imports: [],
  template: `<iframe src="/assets/permission-search.html" class="proto-frame"></iframe>`,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; overflow: hidden; }
    .proto-frame { width: 100%; height: 100%; border: none; display: block; }
  `],
})
export class PermissionSearchComponent implements OnInit, OnDestroy {
  private tracker = inject(TrackerService);

  ngOnInit(): void {
    this.tracker.trackPageView(SLUG);
  }

  ngOnDestroy(): void {
    this.tracker.destroyListeners();
  }
}
