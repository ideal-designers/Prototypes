import { Routes } from '@angular/router';

// Client-only build (ng build --configuration client-demo).
// Swaps app.routes.ts via fileReplacements: only the demo prototype is
// registered, there is no dashboard, no login shell and no other prototypes.
// Any other URL falls back to the demo.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'qna-setup-demo' },
  {
    path: 'qna-setup-demo',
    loadComponent: () =>
      import('./prototypes/qna-setup-demo/qna-setup-demo.component').then(m => m.QnaSetupDemoComponent),
  },
  { path: '**', redirectTo: 'qna-setup-demo' },
];
