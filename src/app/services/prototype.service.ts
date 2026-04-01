import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { PROTO_REGISTRY, ProtoMeta } from '../proto-registry';

/*
  Supabase table (run once in your Supabase SQL editor):

  CREATE TABLE prototypes (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    slug        TEXT        UNIQUE NOT NULL,
    title       TEXT        NOT NULL,
    description TEXT        DEFAULT '',
    figma       TEXT        DEFAULT '',
    status      TEXT        DEFAULT 'pending'
                            CHECK (status IN ('pending','wip','live','archived')),
    created_at  TIMESTAMPTZ DEFAULT now()
  );

  -- Allow anonymous read + insert + update (adjust RLS to your needs):
  ALTER TABLE prototypes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public read"   ON prototypes FOR SELECT USING (true);
  CREATE POLICY "public insert" ON prototypes FOR INSERT WITH CHECK (true);
  CREATE POLICY "public update" ON prototypes FOR UPDATE USING (true);
*/

export interface PrototypeDef {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  figma?: string;
  status: 'pending' | 'wip' | 'live' | 'archived';
  created_at?: string;
  /** true when an Angular component exists in proto-registry.ts */
  hasComponent: boolean;
}

@Injectable({ providedIn: 'root' })
export class PrototypeService {
  private supabase: SupabaseClient | null = null;
  readonly hasSupabase: boolean;

  private get localSlugs(): Set<string> {
    return new Set(PROTO_REGISTRY.map(p => p.slug));
  }

  constructor() {
    this.hasSupabase = !!(
      environment.supabaseUrl &&
      environment.supabaseAnonKey &&
      environment.supabaseUrl !== 'YOUR_SUPABASE_URL'
    );
    if (this.hasSupabase) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
  }

  /** Returns all non-archived prototypes, merging Supabase + local registry. */
  async list(): Promise<PrototypeDef[]> {
    if (!this.supabase) {
      return PROTO_REGISTRY.map(p => ({ ...p, hasComponent: true })) as PrototypeDef[];
    }

    const { data, error } = await this.supabase
      .from('prototypes')
      .select('*')
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[PrototypeService] Supabase error, falling back to local registry:', error.message);
      return PROTO_REGISTRY.map(p => ({ ...p, hasComponent: true })) as PrototypeDef[];
    }

    const supabaseEntries: PrototypeDef[] = (data ?? []).map((row: any) => ({
      ...row,
      hasComponent: this.localSlugs.has(row.slug),
    }));

    // Auto-promote: if component now exists but Supabase status is still 'pending', bump to 'wip'
    for (const entry of supabaseEntries) {
      if (entry.status === 'pending' && entry.hasComponent) {
        entry.status = 'wip';
        this.supabase!.from('prototypes').update({ status: 'wip' }).eq('slug', entry.slug);
      }
    }

    // Append local-only entries not yet in Supabase
    const supabaseSlugs = new Set(supabaseEntries.map(p => p.slug));
    const localOnly: PrototypeDef[] = PROTO_REGISTRY
      .filter(p => !supabaseSlugs.has(p.slug) && p.status !== 'archived')
      .map(p => ({ ...p, hasComponent: true }));

    return [...supabaseEntries, ...localOnly];
  }

  /** Creates a new prototype entry in Supabase (status = 'pending'). */
  async create(proto: Pick<PrototypeDef, 'slug' | 'title' | 'description' | 'figma'>): Promise<PrototypeDef> {
    if (!this.supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await this.supabase
      .from('prototypes')
      .insert({ ...proto, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return { ...data, hasComponent: false };
  }

  /** Soft-deletes a prototype by setting status = 'archived'. */
  async archive(proto: PrototypeDef): Promise<void> {
    if (proto.id && this.supabase) {
      const { error } = await this.supabase
        .from('prototypes')
        .update({ status: 'archived' })
        .eq('id', proto.id);
      if (error) throw error;
    }
    // If no Supabase id (local-only), nothing to do — user must edit proto-registry.ts manually
  }
}
