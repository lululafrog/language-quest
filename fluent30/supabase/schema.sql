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
