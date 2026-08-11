import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeatmapComponent } from './components/heatmap/heatmap.component';
import { AnnotateComponent } from './components/annotate/annotate.component';

@Component({
  selector: 'fvdr-root',
  standalone: true,
  imports: [RouterOutlet, HeatmapComponent, AnnotateComponent],
  template: `
    <router-outlet />
    <fvdr-heatmap />
    <fvdr-annotate />
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class AppComponent {}
