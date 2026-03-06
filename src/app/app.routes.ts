import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then(m => m.HomeComponent),
  },
  // Prototype routes are registered here dynamically via new-proto.js
    {
    path: 'deal-room',
    loadComponent: () =>
      import('./prototypes/deal-room/deal-room.component').then(m => m.DealRoomComponent),
  },
    {
    path: 'ca-settings-integrations',
    loadComponent: () =>
      import('./prototypes/ca-settings-integrations/ca-settings-integrations.component').then(m => m.CaSettingsIntegrationsComponent),
  },
  // PROTO_ROUTES_PLACEHOLDER
  {
    path: '**',
    redirectTo: '',
  },
];
