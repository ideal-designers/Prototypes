import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { DS_COMPONENTS } from '../../shared/ds';
import type { HeaderNavItem } from '../../shared/ds';

type PortalSection = 'prototypes' | 'ds' | 'docs';

const SECTION_ROUTES: Record<PortalSection, string> = {
  prototypes: '/',
  ds: '/ds',
  docs: '/docs',
};

/**
 * Shared shell for the prototype platform's own pages — dashboard (/),
 * design system (/ds, /ds/:id) and session guide (/docs).
 * One DS header with section nav; pages render below it.
 * Pages read `--portal-header-h` to offset sticky / full-height layouts.
 */
@Component({
  selector: 'fvdr-portal-shell',
  standalone: true,
  imports: [RouterOutlet, ...DS_COMPONENTS],
  template: `
    <div class="portal">
      <fvdr-header class="portal__header" appName="FVDR Prototypes"
                   [navItems]="navItems" [activeNavId]="active()"
                   (navClick)="go($any($event))" (logoClick)="go('prototypes')" />
      <main class="portal__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .portal {
      --portal-header-h: var(--space-16);
      min-height: 100vh;
      background: var(--color-stone-0);
      font-family: var(--font-family);
    }
    .portal__header {
      display: block;
      position: sticky; top: 0;
      z-index: var(--z-sticky);
    }
  `],
})
export class PortalShellComponent {
  private readonly router = inject(Router);

  readonly navItems: HeaderNavItem[] = [
    { id: 'prototypes', label: 'Prototypes',     icon: 'nav-projects', activeIcon: 'nav-projects-active' },
    { id: 'ds',         label: 'Design system',  icon: 'grid-view' },
    { id: 'docs',       label: 'Session guide',  icon: 'documents', activeIcon: 'documents-active' },
  ];

  readonly active = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => sectionOf(e.urlAfterRedirects)),
    ),
    { initialValue: sectionOf(this.router.url) },
  );

  go(section: PortalSection): void {
    this.router.navigateByUrl(SECTION_ROUTES[section]);
  }
}

function sectionOf(url: string): PortalSection {
  const path = url.split(/[?#]/)[0];
  if (path === '/ds' || path.startsWith('/ds/')) return 'ds';
  if (path.startsWith('/docs')) return 'docs';
  return 'prototypes';
}
