import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { inject } from '@vercel/analytics';
import posthog from 'posthog-js';
import { environment } from './environments/environment';

inject();

if (environment.posthogKey) {
  posthog.init(environment.posthogKey, {
    api_host: 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,  // керуємо вручну через TrackerService
    capture_pageleave: true,
    autocapture: true,
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
