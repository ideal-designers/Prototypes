import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PROTO_REGISTRY } from '../../proto-registry';

@Component({
  selector: 'fvdr-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <header class="home__header">
        <h1>FVDR Prototypes</h1>
        <p class="home__subtitle">Click a prototype to test it. Use the 🔥 button to view the heatmap.</p>
      </header>
      <div class="home__grid">
        <a
          *ngFor="let proto of protos"
          [routerLink]="['/', proto.slug]"
          class="proto-card"
          [class.proto-card--wip]="proto.status === 'wip'"
          [class.proto-card--live]="proto.status === 'live'"
          [class.proto-card--archived]="proto.status === 'archived'"
        >
          <div class="proto-card__status">{{ proto.status }}</div>
          <h2 class="proto-card__title">{{ proto.title }}</h2>
          <p *ngIf="proto.description" class="proto-card__desc">{{ proto.description }}</p>
          <div class="proto-card__slug">/{{ proto.slug }}</div>
        </a>
        <div *ngIf="protos.length === 0" class="home__empty">
          <p>No prototypes yet.</p>
          <code>node scripts/new-proto.js --slug my-flow --title "My Flow"</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home {
      min-height: 100vh;
      background: #0B1410;
      color: #e8f5f0;
      font-family: 'Open Sans', sans-serif;
      padding: 48px 24px;
    }
    .home__header {
      max-width: 960px;
      margin: 0 auto 40px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #2C9C74;
      margin: 0 0 8px;
    }
    .home__subtitle {
      color: #9bbfb0;
      margin: 0;
    }
    .home__grid {
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .home__empty {
      grid-column: 1 / -1;
      text-align: center;
      color: #9bbfb0;
      padding: 48px;
    }
    .home__empty code {
      display: block;
      margin-top: 12px;
      background: #101A16;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #3FB67D;
    }
    .proto-card {
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 12px;
      padding: 20px;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, transform 0.15s;
      position: relative;
      display: block;
    }
    .proto-card:hover {
      border-color: #2C9C74;
      transform: translateY(-2px);
    }
    .proto-card__status {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 12px;
    }
    .proto-card--wip .proto-card__status {
      background: rgba(244,100,12,0.15);
      color: #F4640C;
    }
    .proto-card--live .proto-card__status {
      background: rgba(44,156,116,0.15);
      color: #2C9C74;
    }
    .proto-card--archived .proto-card__status {
      background: rgba(155,191,176,0.1);
      color: #9bbfb0;
    }
    .proto-card__title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 6px;
    }
    .proto-card__desc {
      font-size: 0.875rem;
      color: #9bbfb0;
      margin: 0 0 12px;
    }
    .proto-card__slug {
      font-size: 0.75rem;
      color: #358CEB;
      font-family: monospace;
    }
  `],
})
export class HomeComponent implements OnInit {
  protos = PROTO_REGISTRY;

  ngOnInit(): void {}
}
