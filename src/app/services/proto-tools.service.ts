import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'fvdr-hidden-tools';

/*
  Per-prototype switch for the platform tools — the 🔥 click-heatmap (analytics) and
  ✏️ comments FABs — set from the dashboard row.

  Shared for everyone through `prototypes.hide_tools` once that column exists:

    ALTER TABLE prototypes ADD COLUMN IF NOT EXISTS hide_tools BOOLEAN DEFAULT false;

  Until then the choice is remembered in this browser only.
*/
@Injectable({ providedIn: 'root' })
export class ProtoToolsService {
  private supabase: SupabaseClient | null = null;
  /** true once Supabase answered with the hide_tools column */
  private shared = false;
  private loading?: Promise<void>;

  /** Slugs whose prototype renders without the platform tools */
  readonly hidden = signal<ReadonlySet<string>>(readLocal());

  constructor() {
    if (environment.supabaseUrl && environment.supabaseAnonKey && environment.supabaseUrl !== 'YOUR_SUPABASE_URL') {
      try {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
      } catch {
        // placeholder URL in dev — browser-only mode
      }
    }
  }

  load(): Promise<void> {
    return (this.loading ??= this.fetch());
  }

  isHidden(slug: string): boolean {
    return this.hidden().has(slug);
  }

  async setHidden(slug: string, hide: boolean, title: string): Promise<void> {
    const next = new Set(this.hidden());
    if (hide) next.add(slug); else next.delete(slug);
    this.commit(next);

    if (!this.shared || !this.supabase) return;
    const { data, error } = await this.supabase
      .from('prototypes')
      .update({ hide_tools: hide })
      .eq('slug', slug)
      .select('id');
    if (error) { console.warn('[ProtoTools]', error.message); return; }
    // Local-registry-only prototype — no row yet
    if (!data?.length) {
      const { error: insertError } = await this.supabase.from('prototypes').insert({ slug, title, hide_tools: hide });
      if (insertError) console.warn('[ProtoTools]', insertError.message);
    }
  }

  private async fetch(): Promise<void> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase.from('prototypes').select('slug, hide_tools');
    if (error) return; // column not added yet → stay browser-only
    this.shared = true;
    this.commit(new Set((data ?? []).filter((r: any) => r.hide_tools).map((r: any) => r.slug as string)));
  }

  private commit(set: Set<string>): void {
    this.hidden.set(set);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch { /* private mode */ }
  }
}

function readLocal(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
