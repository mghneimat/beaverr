-- Salt Edge imported accounts and transactions (server-synced, user read-only)

create table public.saltedge_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  saltedge_account_id text not null,
  saltedge_connection_id text not null,
  name text,
  nature text,
  balance numeric,
  currency_code text,
  extra jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (saltedge_account_id)
);

create index saltedge_accounts_user_id_idx on public.saltedge_accounts (user_id);
create index saltedge_accounts_connection_id_idx on public.saltedge_accounts (saltedge_connection_id);

create table public.saltedge_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  saltedge_transaction_id text not null,
  saltedge_account_id text not null,
  saltedge_connection_id text not null,
  amount numeric not null,
  currency_code text,
  description text,
  made_on date,
  status text,
  category text,
  duplicated boolean not null default false,
  extra jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (saltedge_transaction_id)
);

create index saltedge_transactions_user_id_idx on public.saltedge_transactions (user_id);
create index saltedge_transactions_made_on_idx on public.saltedge_transactions (user_id, made_on desc);
create index saltedge_transactions_connection_id_idx on public.saltedge_transactions (saltedge_connection_id);

alter table public.saltedge_accounts enable row level security;
alter table public.saltedge_transactions enable row level security;

create policy saltedge_accounts_select_own on public.saltedge_accounts
  for select to authenticated
  using (auth.uid() = user_id);

create policy saltedge_transactions_select_own on public.saltedge_transactions
  for select to authenticated
  using (auth.uid() = user_id);

alter table public.saltedge_connections
  add column if not exists consent_status text,
  add column if not exists consent_revoke_reason text;
