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
    path: 'my-prototype-delete-account',
    loadComponent: () =>
      import('./prototypes/my-prototype-delete-account/my-prototype-delete-account.component').then(m => m.MyPrototypeDeleteAccountComponent),
  },
  {
    path: 'insights-activity-log',
    loadComponent: () =>
      import('./prototypes/insights-activity-log/insights-activity-log.component').then(m => m.InsightsActivityLogComponent),
  },
  // PROTO_ROUTES_PLACEHOLDER
  {
    path: '**',
    redirectTo: '',
  },
];
