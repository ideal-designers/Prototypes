import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/home/home.component').then(m => m.HomeComponent),
  },
  // Prototype routes are registered here dynamically via new-proto.js
  {
    path: 'deal-room',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./prototypes/deal-room/deal-room.component').then(m => m.DealRoomComponent),
  },
  {
    path: 'ca-settings-integrations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./prototypes/ca-settings-integrations/ca-settings-integrations.component').then(m => m.CaSettingsIntegrationsComponent),
  },
  {
    path: 'ds',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./prototypes/ds-showcase/ds-showcase.component').then(m => m.DsShowcaseComponent),
  },
  {
    path: 'docs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/docs/docs.component').then(m => m.DocsComponent),
  },
    {
    path: 'project-archive-creation-flow-testing',
    loadComponent: () =>
      import('./prototypes/project-archive-creation-flow-testing/project-archive-creation-flow-testing.component').then(m => m.ProjectArchiveCreationFlowTestingComponent),
  },
  {
    path: 'insights-activity-log',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./prototypes/insights-activity-log/insights-activity-log.component').then(m => m.InsightsActivityLogComponent),
  },
  {
    path: 'ca-create-api-key',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./prototypes/ca-create-api-key/ca-create-api-key.component').then(m => m.CaCreateApiKeyComponent),
  },
    {
    path: 'quick-access-panel',
    loadComponent: () =>
      import('./prototypes/quick-access-panel/quick-access-panel.component').then(m => m.QuickAccessPanelComponent),
  },
  // PROTO_ROUTES_PLACEHOLDER
  {
    path: '**',
    redirectTo: '',
  },
];
