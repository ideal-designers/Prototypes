-- Dashboard groups prototypes by product module and lets you drag them between modules.
-- The chosen module is stored here; NULL means "use the module from src/app/proto-registry.ts".
-- Valid values live in PROTO_MODULES (proto-registry.ts); unknown values are ignored by the app.
--
-- Run once: Supabase Dashboard → SQL Editor → New query → paste → Run.

alter table prototypes add column if not exists module text;

comment on column prototypes.module is
  'Dashboard module (Documents, Permissions, …). NULL → module from proto-registry.ts';
