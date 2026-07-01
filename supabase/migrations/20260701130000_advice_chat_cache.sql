-- Repeat chat Q&A cache (same snapshot + message → skip Gemini)

create table public.advice_chat_cache (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_hash text not null,
  message_hash text not null,
  locale text not null,
  model text not null,
  prompt_version text not null,
  reply text not null,
  sources jsonb not null default '[]'::jsonb,
  kb_chunk_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, snapshot_hash, message_hash, locale, model, prompt_version)
);

alter table public.advice_chat_cache enable row level security;

create policy advice_chat_cache_select_own on public.advice_chat_cache
  for select to authenticated
  using (auth.uid() = user_id);
