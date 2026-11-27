-- Fluent30 — Supabase schema (run in the SQL editor of your Supabase project).
-- One generic table stores every synced row as JSON, protected by Row Level Security:
-- each user can only read and write their own rows.

create table if not exists public.fluent_rows (
  user_id    uuid    not null references auth.users(id) on delete cascade,
  tbl        text    not null,
  row_id     text    not null,
  data       jsonb,
  deleted    boolean not null default false,
  updated_at bigint  not null,
  primary key (user_id, tbl, row_id)
);

create index if not exists fluent_rows_user_updated on public.fluent_rows (user_id, updated_at);

alter table public.fluent_rows enable row level security;

drop policy if exists "own rows - select" on public.fluent_rows;
drop policy if exists "own rows - insert" on public.fluent_rows;
drop policy if exists "own rows - update" on public.fluent_rows;
drop policy if exists "own rows - delete" on public.fluent_rows;

create policy "own rows - select" on public.fluent_rows for select using (auth.uid() = user_id);
create policy "own rows - insert" on public.fluent_rows for insert with check (auth.uid() = user_id);
create policy "own rows - update" on public.fluent_rows for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows - delete" on public.fluent_rows for delete using (auth.uid() = user_id);

-- Shared illustration cache (written by the server with the service role key, readable by nobody else).
insert into storage.buckets (id, name, public) values ('illustrations', 'illustrations', false)
on conflict (id) do nothing;

-- =====================================================================================
-- Server-only tables: AI usage & costs, error log, budget alerts, shared generic cache.
-- RLS is enabled with NO policy: only the service role key (server side) can read/write them.
-- No personal content is stored here: users are pseudonymous hashes, errors are technical codes.
-- =====================================================================================

create table if not exists public.ai_usage_daily (
  day        date    not null,
  feature    text    not null,
  user_hash  text    not null,
  calls      integer not null default 0,
  in_tokens  bigint  not null default 0,
  out_tokens bigint  not null default 0,
  cost_usd   numeric(12,6) not null default 0,
  errors     integer not null default 0,
  quota_hits integer not null default 0,
  cache_hits integer not null default 0,
  saved_usd  numeric(12,6) not null default 0,
  primary key (day, feature, user_hash)
);
create index if not exists ai_usage_daily_user on public.ai_usage_daily (user_hash, day);
alter table public.ai_usage_daily enable row level security;

-- Atomic increment used by the server (src/lib/server/usage.ts).
create or replace function public.ai_usage_add(
  p_day date, p_feature text, p_user text, p_calls integer, p_in bigint, p_out bigint, p_cost numeric,
  p_errors integer, p_quota integer, p_cache_hits integer default 0, p_saved numeric default 0
) returns void language sql security definer set search_path = public as $$
  insert into public.ai_usage_daily as u (day, feature, user_hash, calls, in_tokens, out_tokens, cost_usd, errors, quota_hits, cache_hits, saved_usd)
  values (p_day, p_feature, p_user, p_calls, p_in, p_out, p_cost, p_errors, p_quota, p_cache_hits, p_saved)
  on conflict (day, feature, user_hash) do update set
    calls = u.calls + excluded.calls, in_tokens = u.in_tokens + excluded.in_tokens, out_tokens = u.out_tokens + excluded.out_tokens,
    cost_usd = u.cost_usd + excluded.cost_usd, errors = u.errors + excluded.errors, quota_hits = u.quota_hits + excluded.quota_hits,
    cache_hits = u.cache_hits + excluded.cache_hits, saved_usd = u.saved_usd + excluded.saved_usd;
$$;
revoke all on function public.ai_usage_add(date, text, text, integer, bigint, bigint, numeric, integer, integer, integer, numeric) from public, anon, authenticated;

-- hash → user id, only for signed-in users, so the admin can see an email next to heavy usage.
create table if not exists public.ai_usage_users (
  user_hash text primary key,
  user_id   uuid not null references auth.users(id) on delete cascade
);
alter table public.ai_usage_users enable row level security;

create table if not exists public.ai_error_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  feature text not null,
  code    text not null,
  message text not null
);
create index if not exists ai_error_log_at on public.ai_error_log (at desc);
alter table public.ai_error_log enable row level security;

create table if not exists public.ai_budget_alerts (
  month      text    not null,
  threshold  integer not null,
  spent_usd  numeric(12,4) not null,
  created_at timestamptz not null default now(),
  primary key (month, threshold)
);
alter table public.ai_budget_alerts enable row level security;

-- Shared cache of GENERIC answers only (word cards, lookups, public-domain book translations/adaptations).
-- Never personal content (journal, captures, photos, conversations, postcards, writing assessments).
create table if not exists public.shared_ai_cache (
  key        text primary key,
  feature    text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  hits       integer not null default 0
);
create index if not exists shared_ai_cache_created on public.shared_ai_cache (created_at);
alter table public.shared_ai_cache enable row level security;

create or replace function public.shared_ai_cache_hit(p_key text) returns void
language sql security definer set search_path = public as $$
  update public.shared_ai_cache set hits = hits + 1 where key = p_key;
$$;
revoke all on function public.shared_ai_cache_hit(text) from public, anon, authenticated;

-- Optional housekeeping (run periodically, e.g. with pg_cron):
--   delete from public.ai_error_log where at < now() - interval '90 days';
--   delete from public.shared_ai_cache where created_at < now() - interval '90 days';
