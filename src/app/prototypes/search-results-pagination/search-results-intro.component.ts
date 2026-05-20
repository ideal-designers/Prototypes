import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ScenarioCard {
  title: string;
  description: string;
  tag: string;
  route: string;
  accent: string;
  pill?: string;
  comingSoon?: boolean;
}

@Component({
  selector: 'fvdr-search-results-intro',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <header class="page-header">
        <a class="back-link" routerLink="/">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          All prototypes
        </a>
        <div class="heading-block">
          <h1>Search results</h1>
          <p class="subtitle">Scenarios for search results page — files and folders found in the document library.</p>
        </div>
      </header>

      <div class="grid">
        <ng-container *ngFor="let card of cards">

          <!-- Active card -->
          <a *ngIf="!card.comingSoon"
             [routerLink]="card.route"
             class="card"
             [style.--accent]="card.accent">
            <div class="card__top">
              <span class="card__tag">{{ card.tag }}</span>
              <span class="card__count">{{ card.pill }}</span>
            </div>
            <h2 class="card__title">{{ card.title }}</h2>
            <p class="card__desc">{{ card.description }}</p>
            <div class="card__footer">
              <span class="card__route">{{ card.route }}</span>
              <svg class="card__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </a>

          <!-- Coming soon card -->
          <div *ngIf="card.comingSoon"
               class="card card--soon"
               [style.--accent]="card.accent">
            <div class="card__top">
              <span class="card__tag card__tag--soon">soon</span>
            </div>
            <h2 class="card__title">{{ card.title }}</h2>
            <p class="card__desc">{{ card.description }}</p>
          </div>

        </ng-container>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Inter', 'Open Sans', sans-serif;
      padding: 48px 24px 80px;
    }

    /* ── Header ── */
    .page-header {
      max-width: 960px;
      margin: 0 auto 40px;
    }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.85rem; color: #9bbfb0;
      text-decoration: none; margin-bottom: 24px;
      transition: color 0.12s;
    }
    .back-link:hover { color: #2C9C74; }
    .heading-block h1 {
      font-size: 2rem; font-weight: 700;
      color: #2C9C74; margin: 0 0 8px;
    }
    .subtitle { color: #9bbfb0; margin: 0; font-size: 0.95rem; }

    /* ── Grid ── */
    .grid {
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    /* ── Card ── */
    .card {
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 12px;
      padding: 20px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s, transform 0.15s;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%);
      pointer-events: none;
    }
    a.card:hover {
      border-color: var(--accent, #2C9C74);
      transform: translateY(-2px);
    }
    .card--soon {
      border-style: dashed;
      border-color: #1e2e28;
      opacity: 0.55;
      cursor: default;
    }

    .card__top {
      display: flex; align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .card__tag {
      font-size: 0.7rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 8px; border-radius: 20px;
      background: color-mix(in srgb, var(--accent) 14%, transparent);
      color: var(--accent);
    }
    .card__tag--soon {
      background: rgba(155,191,176,.08);
      color: #9bbfb0;
    }
    .card__count {
      font-size: 0.72rem;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
      white-space: nowrap;
    }
    .card__title {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0 0 8px;
      color: #e8f5f0;
    }
    .card__desc {
      font-size: 0.875rem;
      color: #9bbfb0;
      margin: 0;
      flex: 1;
      line-height: 1.55;
    }
    .card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #1e2e28;
    }
    .card__route {
      font-size: 0.75rem;
      color: #358CEB;
      font-family: monospace;
    }
    .card__arrow {
      color: var(--accent, #2C9C74);
      opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    a.card:hover .card__arrow {
      opacity: 1;
      transform: translateX(3px);
    }
  `],
})
export class SearchResultsIntroComponent {
  cards: ScenarioCard[] = [
    {
      title: '< 200 files/folders found',
      description: 'Search returns 187 results — mix of folders and documents with highlighted matches, lazy loading (20 per batch), bulk checkbox selection and contextual actions.',
      tag: 'few results',
      pill: '187 results',
      route: '/search-results-pagination/view',
      accent: '#2C9C74',
    },
    {
      title: '> 200+ files/folders found — Option 1',
      description: 'Results show 200+. Select all to act on the complete 345 — lazy-loaded batches appear pre-selected.',
      tag: '200+',
      pill: '345 results',
      route: '/search-results-pagination/large',
      accent: '#C88B00',
    },
    {
      title: '> 200+ files/folders found — Option 2',
      description: 'Gmail approach — bulk select picks first 50. Inline prompt to extend selection to all 200+.',
      tag: '200+ gmail',
      pill: '345 results',
      route: '/search-results-pagination/option2',
      accent: '#358CEB',
    },
    {
      title: '> 200 files/folders found — Option 3',
      description: 'Large result set: 345 items found. Scroll to load more.',
      tag: "Max's fav",
      pill: '345 results',
      route: '/search-results-pagination/option3',
      accent: '#B06FD8',
    },
    {
      title: 'No results found',
      description: 'Empty state when the search query returns zero matches — illustration, suggested actions.',
      tag: 'scenario',
      pill: '0 results',
      route: '/search-results-pagination/empty',
      accent: '#F4640C',
      comingSoon: true,
    },
  ];
}
