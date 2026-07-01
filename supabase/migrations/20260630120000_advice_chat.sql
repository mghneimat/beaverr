-- Coach chat threads and messages (advice-chat edge function)

create table public.advice_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid,
  tab_key text not null,
  locale text not null,
  country_code text not null default 'CZ',
  snapshot_hash text not null,
  context_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index advice_threads_user_id_updated_at_idx
  on public.advice_threads (user_id, updated_at desc);

create table public.advice_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.advice_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  kb_chunk_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index advice_messages_thread_id_created_at_idx
  on public.advice_messages (thread_id, created_at asc);

create table public.advice_chat_runs (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.advice_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  status text not null check (status in ('ok', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index advice_chat_runs_user_id_created_at_idx
  on public.advice_chat_runs (user_id, created_at desc);

alter table public.advice_threads enable row level security;
alter table public.advice_messages enable row level security;
alter table public.advice_chat_runs enable row level security;

create policy advice_threads_select_own on public.advice_threads
  for select to authenticated
  using (auth.uid() = user_id);

create policy advice_threads_insert_own on public.advice_threads
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy advice_threads_update_own on public.advice_threads
  for update to authenticated
  using (auth.uid() = user_id);

create policy advice_messages_select_own on public.advice_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.advice_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy advice_messages_insert_own on public.advice_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.advice_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  );

create policy advice_chat_runs_select_own on public.advice_chat_runs
  for select to authenticated
  using (auth.uid() = user_id);
