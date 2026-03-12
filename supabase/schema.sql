-- FVDR Prototype Platform — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- Tables:
--   proto_events  — tracker events (clicks, scrolls, page views, tasks)
--   prototypes    — prototype registry managed from dashboard UI

-- Events table
create table if not exists proto_events (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  session_id  text        not null,
  proto_slug  text        not null,
  event_type  text        not null check (event_type in ('page_view','click','scroll','task_complete','task_fail')),
  x           numeric(6,2),          -- % of viewport width (0–100)
  y           numeric(6,2),          -- % of viewport height (0–100)
  vw          int,                   -- viewport width in px
  vh          int,                   -- viewport height in px
  scroll_depth int,                  -- scroll checkpoint (25/50/75/100)
  label       text,                  -- data-track attribute value
  meta        jsonb
);

-- Indexes for common query patterns
create index if not exists proto_events_slug_type on proto_events (proto_slug, event_type);
create index if not exists proto_events_session   on proto_events (session_id);
create index if not exists proto_events_created   on proto_events (created_at desc);

-- Summary view — useful in Supabase dashboard
create or replace view proto_summary as
select
  proto_slug,
  count(distinct session_id)                                        as sessions,
  count(*) filter (where event_type = 'page_view')                  as page_views,
  count(*) filter (where event_type = 'click')                      as clicks,
  count(*) filter (where event_type = 'task_complete')              as completions,
  count(*) filter (where event_type = 'task_fail')                  as failures,
  round(
    count(*) filter (where event_type = 'task_complete')::numeric
    / nullif(count(*) filter (where event_type in ('task_complete','task_fail')), 0) * 100,
    1
  )                                                                  as completion_pct,
  max(created_at)                                                    as last_activity
from proto_events
group by proto_slug
order by sessions desc;

-- Row-level security: allow anonymous inserts (tracker) and selects (heatmap)
alter table proto_events enable row level security;

create policy "anon insert"
  on proto_events for insert
  to anon
  with check (true);

create policy "anon select"
  on proto_events for select
  to anon
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Prototype registry (managed from dashboard UI)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists prototypes (
  id          uuid        default gen_random_uuid() primary key,
  slug        text        unique not null,
  title       text        not null,
  description text        default '',
  figma       text        default '',
  status      text        default 'pending'
                          check (status in ('pending','wip','live','archived')),
  created_at  timestamptz default now()
);

alter table prototypes enable row level security;

create policy "anon read"
  on prototypes for select
  to anon
  using (true);

create policy "anon insert"
  on prototypes for insert
  to anon
  with check (true);

create policy "anon update"
  on prototypes for update
  to anon
  using (true);
