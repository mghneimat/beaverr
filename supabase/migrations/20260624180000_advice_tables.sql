-- Advice narration audit + cache (AI integration plan §13)

create table public.advice_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid,
  snapshot_hash text not null,
  model text not null,
  prompt_version text not null,
  locale text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  cost_usd_micros bigint not null default 0,
  rule_ids jsonb not null default '[]'::jsonb,
  kb_chunk_ids jsonb not null default '[]'::jsonb,
  status text not null check (status in ('ok', 'error', 'cached', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create index advice_runs_user_id_created_at_idx on public.advice_runs (user_id, created_at desc);

create table public.advice_cache (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_hash text not null,
  locale text not null,
  model text not null,
  prompt_version text not null,
  narrative jsonb not null,
  run_id uuid references public.advice_runs (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, snapshot_hash, locale, model, prompt_version)
);

alter table public.advice_runs enable row level security;
alter table public.advice_cache enable row level security;

create policy advice_runs_select_own on public.advice_runs
  for select to authenticated
  using (auth.uid() = user_id);

create policy advice_cache_select_own on public.advice_cache
  for select to authenticated
  using (auth.uid() = user_id);

create table public.knowledge_chunks (
  id text primary key,
  source_id text not null,
  locale text not null,
  topic_tags text[] not null default '{}',
  excerpt text not null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.knowledge_chunks enable row level security;

create policy knowledge_chunks_select_all on public.knowledge_chunks
  for select to authenticated
  using (true);
