import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeatmapComponent } from './components/heatmap/heatmap.component';
import { AnnotateComponent } from './components/annotate/annotate.component';
import { ProtoToolsService } from './services/proto-tools.service';

@Component({
  selector: 'fvdr-root',
  standalone: true,
  imports: [RouterOutlet, HeatmapComponent, AnnotateComponent],
  template: `
    <router-outlet />
    @if (showTools()) {
      <fvdr-heatmap />
      <fvdr-annotate />
    }
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class AppComponent {
  private router = inject(Router);
  private tools = inject(ProtoToolsService);

  private slug = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => slugOf(e.urlAfterRedirects)),
    ),
    // Read the address bar up front so a hidden prototype never flashes the FABs on load
    { initialValue: slugOf(typeof location !== 'undefined' ? location.pathname : '') },
  );

  /** Heatmap + comments FABs, unless the prototype's dashboard toggle turned them off */
  readonly showTools = computed(() => !this.tools.hidden().has(this.slug()));

  constructor() {
    this.tools.load();
  }
}

function slugOf(url: string): string {
  return url.replace(/^\//, '').split(/[/?#]/)[0];
}
