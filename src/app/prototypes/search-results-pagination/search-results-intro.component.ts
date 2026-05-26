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
  dividerBefore?: boolean;
  sectionTitle?: string;
  externalLink?: string;
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

          <!-- Section header -->
          <div *ngIf="card.sectionTitle" class="section-header">
            <span class="section-header__label">{{ card.sectionTitle }}</span>
            <div class="section-header__line"></div>
          </div>

          <!-- Internal route card -->
          <a *ngIf="!card.comingSoon && !card.externalLink"
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

          <!-- External link widget -->
          <div *ngIf="card.externalLink" class="cta-widget-wrap">
            <a [href]="card.externalLink"
               target="_blank"
               rel="noopener"
               class="cta-widget">
              <svg class="cta-widget__icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v.4M8 7.5v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              <span class="cta-widget__text">{{ card.title }}</span>
              <svg class="cta-widget__ext" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5 9.5 2.5M5 2.5h4.5V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>

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
    .back-link:hover { color: var(--color-interactive-primary, #2C9C74); }
    .heading-block h1 {
      font-size: 2rem; font-weight: 700;
      color: var(--color-interactive-primary, #2C9C74); margin: 0 0 8px;
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
    .section-header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 4px;
    }
    .section-header__label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-section-label, #4a7a68);
      white-space: nowrap;
    }
    .section-header__line {
      flex: 1;
      height: 1px;
      background: #1e2e28;
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

    /* ── CTA Widget (external link) ── */
    .cta-widget-wrap {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      padding: 16px 0 4px;
    }
    .cta-widget {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: color-mix(in srgb, var(--color-interactive-primary, #2C9C74) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-interactive-primary, #2C9C74) 35%, transparent);
      border-radius: 40px;
      text-decoration: none;
      color: #9bbfb0;
      font-size: 0.875rem;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .cta-widget:hover {
      background: color-mix(in srgb, var(--color-interactive-primary, #2C9C74) 18%, transparent);
      border-color: var(--color-interactive-primary, #2C9C74);
      color: #e8f5f0;
    }
    .cta-widget__icon {
      color: var(--color-interactive-primary, #2C9C74);
      flex-shrink: 0;
      opacity: 0.75;
    }
    .cta-widget__text {
      flex: 1;
    }
    .cta-widget__ext {
      color: var(--color-interactive-primary, #2C9C74);
      opacity: 0.55;
      flex-shrink: 0;
      transition: opacity 0.15s, transform 0.15s;
    }
    .cta-widget:hover .cta-widget__ext {
      opacity: 1;
      transform: translate(2px, -2px);
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
      sectionTitle: 'Small number of files — up to 200',
    },
    {
      title: '> 200+ files/folders found — Option 1',
      description: 'Results show 200+. Select all to act on the complete 345 — lazy-loaded batches appear pre-selected.',
      tag: '200+',
      pill: '345 results',
      route: '/search-results-pagination/large',
      accent: '#C88B00',
      sectionTitle: 'Large number of files — more than 200',
    },
    {
      title: '> 200 files/folders found — Option 2',
      description: 'Large result set: 345 items found. Scroll to load more.',
      tag: 'exact number',
      pill: '345 results',
      route: '/search-results-pagination/option3',
      accent: '#B06FD8',
    },
    {
      title: 'Share a few thoughts about your experience',
      description: 'Spreadsheet with questions, answers and notes collected during prototype testing sessions.',
      tag: 'Q&A',
      pill: 'spreadsheet',
      route: '',
      externalLink: 'https://docs.google.com/forms/d/e/1FAIpQLSe6AYgY3RlkGDYUiOz0PiXzoky7Rbi47Vi2foUT_0iqWCYzSA/viewform',
      accent: '#4CAF8A',
    },
  ];
}
