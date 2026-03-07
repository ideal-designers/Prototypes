import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeatmapComponent } from './components/heatmap/heatmap.component';

@Component({
  selector: 'fvdr-root',
  standalone: true,
  imports: [RouterOutlet, HeatmapComponent],
  template: `
    <router-outlet />
    <fvdr-heatmap />
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class AppComponent {}
