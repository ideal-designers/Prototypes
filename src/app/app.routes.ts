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
  // PROTO_ROUTES_PLACEHOLDER
  {
    path: '**',
    redirectTo: '',
  },
];
