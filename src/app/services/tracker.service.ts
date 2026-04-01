import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import posthog from 'posthog-js';

export interface ProtoEvent {
  session_id: string;
  proto_slug: string;
  event_type: 'page_view' | 'click' | 'scroll' | 'task_complete' | 'task_fail';
  x?: number;
  y?: number;
  vw?: number;
  vh?: number;
  scroll_depth?: number;
  label?: string;
  meta?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class TrackerService {
  private supabase: SupabaseClient | null = null;
  private sessionId = this.generateSessionId();
  private clickHandler?: (e: MouseEvent) => void;
  private scrollHandler?: () => void;
  private scrollCheckpoints = new Set<number>();

  constructor() {
    if (environment.supabaseUrl && environment.supabaseAnonKey) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  async trackPageView(slug: string): Promise<void> {
    posthog.capture('$pageview', { proto_slug: slug, session_id: this.sessionId });
    await this.send({
      session_id: this.sessionId,
      proto_slug: slug,
      event_type: 'page_view',
    });
    this.attachGlobalListeners(slug);
  }

  async trackTask(slug: string, result: 'task_complete' | 'task_fail', label?: string): Promise<void> {
    posthog.capture(result, { proto_slug: slug, session_id: this.sessionId, label });
    await this.send({
      session_id: this.sessionId,
      proto_slug: slug,
      event_type: result,
      label,
    });
  }

  destroyListeners(): void {
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
      this.clickHandler = undefined;
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = undefined;
    }
    this.scrollCheckpoints.clear();
  }

  private attachGlobalListeners(slug: string): void {
    this.destroyListeners();

    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const label = target.closest('[data-track]')?.getAttribute('data-track') ?? undefined;
      this.send({
        session_id: this.sessionId,
        proto_slug: slug,
        event_type: 'click',
        x: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
        y: Math.round((e.clientY / window.innerHeight) * 10000) / 100,
        vw: window.innerWidth,
        vh: window.innerHeight,
        label,
      });
    };

    this.scrollHandler = () => {
      const el = document.documentElement;
      const depth = Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100);
      const checkpoint = Math.floor(depth / 25) * 25;
      if (checkpoint > 0 && !this.scrollCheckpoints.has(checkpoint)) {
        this.scrollCheckpoints.add(checkpoint);
        this.send({
          session_id: this.sessionId,
          proto_slug: slug,
          event_type: 'scroll',
          scroll_depth: checkpoint,
        });
      }
    };

    document.addEventListener('click', this.clickHandler, { passive: true });
    window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
  }

  private async send(event: ProtoEvent): Promise<void> {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase.from('proto_events').insert(event);
      if (error) console.warn('[Tracker]', error.message);
    } catch (err) {
      console.warn('[Tracker] network error', err);
    }
  }
}
