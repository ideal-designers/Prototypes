import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { filter, Subscription } from 'rxjs';

interface ClickDot {
  x: number; // percentage of viewport width
  y: number; // percentage of viewport height
  count: number;
}

@Component({
  selector: 'fvdr-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="heatmap-fab"
      (click)="toggle()"
      title="Toggle click heatmap"
      [class.heatmap-fab--active]="visible"
    >🔥</button>

    <div *ngIf="visible" class="heatmap-overlay" (click)="onOverlayClick($event)">
      <div class="heatmap-toolbar">
        <span class="heatmap-toolbar__title">Click heatmap — {{ currentSlug || 'all' }}</span>
        <span class="heatmap-toolbar__count">{{ dots.length }} clicks</span>
        <button class="heatmap-toolbar__close" (click)="toggle()">✕</button>
      </div>

      <ng-container *ngIf="loading">
        <div class="heatmap-loading">Loading…</div>
      </ng-container>

      <svg *ngIf="!loading" class="heatmap-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="dot-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#F4640C" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#F4640C" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle
          *ngFor="let dot of dots"
          [attr.cx]="dot.x"
          [attr.cy]="dot.y"
          [attr.r]="1.5 + Math.min(dot.count - 1, 8) * 0.5"
          fill="url(#dot-grad)"
        />
      </svg>

      <div *ngIf="!loading && dots.length === 0" class="heatmap-empty">
        No click events recorded yet.
      </div>
    </div>
  `,
  styles: [`
    .heatmap-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #101A16;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      font-size: 1.4rem;
      cursor: pointer;
      z-index: 9000;
      transition: transform 0.15s;
    }
    .heatmap-fab:hover { transform: scale(1.1); }
    .heatmap-fab--active { background: #2C9C74; }

    .heatmap-overlay {
      position: fixed;
      inset: 0;
      z-index: 9001;
      background: rgba(11,20,16,0.92);
      display: flex;
      flex-direction: column;
    }
    .heatmap-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #101A16;
      border-bottom: 1px solid #1e2e28;
      font-family: 'Open Sans', sans-serif;
    }
    .heatmap-toolbar__title {
      font-weight: 600;
      color: #e8f5f0;
      flex: 1;
    }
    .heatmap-toolbar__count {
      color: #9bbfb0;
      font-size: 0.875rem;
    }
    .heatmap-toolbar__close {
      background: none;
      border: none;
      color: #9bbfb0;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .heatmap-toolbar__close:hover { background: #1e2e28; color: #e8f5f0; }

    .heatmap-svg {
      flex: 1;
      width: 100%;
      height: 100%;
    }
    .heatmap-loading, .heatmap-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9bbfb0;
      font-family: 'Open Sans', sans-serif;
    }
  `],
})
export class HeatmapComponent implements OnInit, OnDestroy {
  visible = false;
  loading = false;
  dots: ClickDot[] = [];
  currentSlug = '';
  Math = Math;

  private supabase: SupabaseClient | null = null;
  private routerSub?: Subscription;
  private router = inject(Router);

  constructor() {
    if (environment.supabaseUrl && environment.supabaseAnonKey) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
  }

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const slug = e.urlAfterRedirects.replace(/^\//, '').split('/')[0];
        this.currentSlug = slug || '';
        if (this.visible) this.loadDots();
      });
    // capture initial route
    const slug = this.router.url.replace(/^\//, '').split('/')[0];
    this.currentSlug = slug || '';
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  async toggle(): Promise<void> {
    this.visible = !this.visible;
    if (this.visible) await this.loadDots();
  }

  onOverlayClick(e: MouseEvent): void {
    // prevent closing when clicking inside the toolbar
    e.stopPropagation();
  }

  private async loadDots(): Promise<void> {
    if (!this.supabase) return;
    this.loading = true;
    this.dots = [];
    try {
      let query = this.supabase
        .from('proto_events')
        .select('x, y')
        .eq('event_type', 'click')
        .not('x', 'is', null)
        .not('y', 'is', null);

      if (this.currentSlug) {
        query = query.eq('proto_slug', this.currentSlug);
      }

      const { data, error } = await query.limit(2000);
      if (error) throw error;

      // Aggregate duplicates within 1% radius
      const map = new Map<string, ClickDot>();
      for (const row of (data ?? [])) {
        const key = `${Math.round(row.x)},${Math.round(row.y)}`;
        const existing = map.get(key);
        if (existing) {
          existing.count++;
        } else {
          map.set(key, { x: row.x, y: row.y, count: 1 });
        }
      }
      this.dots = Array.from(map.values());
    } catch (err) {
      console.warn('[Heatmap]', err);
    } finally {
      this.loading = false;
    }
  }
}
