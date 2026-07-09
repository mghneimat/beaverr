-- Salt Edge open banking — customer mapping, connections, callback audit

create table public.saltedge_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  saltedge_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saltedge_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  saltedge_connection_id text not null unique,
  saltedge_customer_id text,
  provider_code text,
  status text not null default 'pending',
  last_stage text,
  last_error_class text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saltedge_connections_user_id_idx on public.saltedge_connections (user_id);

create table public.saltedge_callback_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  callback_url text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index saltedge_callback_events_kind_received_idx
  on public.saltedge_callback_events (kind, received_at desc);

alter table public.saltedge_customers enable row level security;
alter table public.saltedge_connections enable row level security;
alter table public.saltedge_callback_events enable row level security;

create policy saltedge_customers_select_own on public.saltedge_customers
  for select to authenticated
  using (auth.uid() = user_id);

create policy saltedge_connections_select_own on public.saltedge_connections
  for select to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates only via Edge Functions (service role)
