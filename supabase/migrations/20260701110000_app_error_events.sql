-- Client + server error telemetry for admin blocker triage

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  severity text not null check (severity in ('debug', 'warning', 'error', 'blocker')),
  category text not null check (category in (
    'auth', 'sync', 'advice', 'chat', 'onboarding', 'ui', 'unknown'
  )),
  message text not null,
  stack text,
  context jsonb not null default '{}'::jsonb,
  platform text,
  app_version text,
  locale text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists app_error_events_created_at_idx
  on public.app_error_events (created_at desc);

create index if not exists app_error_events_severity_created_at_idx
  on public.app_error_events (severity, created_at desc);

create index if not exists app_error_events_user_id_created_at_idx
  on public.app_error_events (user_id, created_at desc);

alter table public.app_error_events enable row level security;

-- Inserts via log-error edge (service role). No direct client SELECT.
