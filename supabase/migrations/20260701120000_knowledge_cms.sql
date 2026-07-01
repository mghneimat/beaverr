-- Knowledge CMS schema extensions + routing tables

alter table public.knowledge_chunks
  add column if not exists country_code text,
  add column if not exists is_published boolean not null default false,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users (id) on delete set null,
  add column if not exists version int not null default 1;

create table if not exists public.knowledge_sources (
  id text primary key,
  type text not null check (type in ('book', 'country')),
  title text not null,
  locale text not null default 'en',
  doc_path text,
  country_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_routes (
  id uuid primary key default gen_random_uuid(),
  route_type text not null check (route_type in ('rule', 'tab', 'chat_keyword')),
  rule_id text,
  tab_key text,
  country_code text not null default 'CZ',
  keywords text[] not null default '{}',
  chunk_ids text[] not null default '{}',
  priority int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_routes_route_type_idx
  on public.knowledge_routes (route_type, country_code);

create table if not exists public.prompt_versions (
  key text not null check (key in ('coach', 'chat')),
  version text not null,
  body text,
  is_active boolean not null default false,
  published_at timestamptz,
  primary key (key, version)
);

-- Seed sources (book + CZ country pack)
insert into public.knowledge_sources (id, type, title, locale, doc_path, country_code, is_active)
values
  ('sethi_csp', 'book', 'I Will Teach You To Be Rich — CSP', 'en', 'docs/knowledge-sethi-csp.md', null, true),
  ('cfpb', 'book', 'CFPB household finance', 'en', 'docs/knowledge-cfpb.md', null, true),
  ('tightwad', 'book', 'Tightwad Gazette', 'en', 'docs/knowledge-tightwad.md', null, true),
  ('ymyl', 'book', 'Your Money or Your Life', 'en', 'docs/knowledge-ymyl.md', null, true),
  ('millionaire_next_door', 'book', 'The Millionaire Next Door', 'en', 'docs/knowledge-mnd.md', null, true),
  ('cz_official', 'country', 'Czech Republic official resources', 'en', 'docs/knowledge-country-cz.md', 'CZ', true)
on conflict (id) do nothing;

-- Seed routing maps (mirrors lib/advice/knowledgeChunkRouter.js + countryKnowledgeRouter.js)
insert into public.knowledge_routes (route_type, rule_id, tab_key, country_code, keywords, chunk_ids, priority)
values
  ('rule', 'fixed_cost_ratio_tight', null, 'CZ', '{}', array['sethi_csp#fixed_costs_crisis', 'cfpb#fragility'], 0),
  ('rule', 'overcommitted', null, 'CZ', '{}', array['sethi_csp#fixed_costs_crisis', 'cfpb#dti_thresholds'], 0),
  ('rule', 'negative_surplus', null, 'CZ', '{}', array['cfpb#fragility', 'tightwad#cost_per_use'], 0),
  ('rule', 'high_apr', null, 'CZ', '{}', array['sethi_csp#debt_priority', 'cfpb#dti_thresholds'], 0),
  ('rule', 'housing_cost_share_elevated', null, 'CZ', '{}', array['cfpb#dti_thresholds', 'sethi_csp#fixed_costs_crisis'], 0),
  ('rule', 'debt_payment_ratio_high', null, 'CZ', '{}', array['cfpb#dti_thresholds', 'sethi_csp#debt_priority'], 0),
  ('rule', 'savings_buffer_low', null, 'CZ', '{}', array['cfpb#emergency_fund', 'cfpb#fragility'], 0),
  ('rule', 'single_income_household', null, 'CZ', '{}', array['cfpb#emergency_fund', 'sethi_csp#positive_signals'], 0),
  ('rule', 'income_concentration', null, 'CZ', '{}', array['sethi_csp#fixed_costs_crisis', 'mnd#lifestyle_inflation'], 0),
  ('rule', 'household_overview', null, 'CZ', '{}', array['sethi_csp#positive_signals', 'cfpb#emergency_fund'], 0),
  ('rule', 'income_empty', null, 'CZ', '{}', array['sethi_csp#fixed_costs_crisis', 'cfpb#fragility'], 0),
  ('rule', 'income_sources_recorded', null, 'CZ', '{}', array['sethi_csp#positive_signals', 'mnd#lifestyle_inflation'], 0),
  ('rule', 'health_coverage_gap', null, 'CZ', '{}', array['cfpb#fragility'], 0),
  ('rule', 'vehicle_tpl_exposure', null, 'CZ', '{}', array['cfpb#fragility'], 0),
  ('rule', 'health_coverage_gap', null, 'CZ', '{}', array['cz_official#health_insurance'], 0),
  ('rule', 'housing_cost_share_elevated', null, 'CZ', '{}', array['cz_official#renting'], 0),
  ('rule', 'vehicle_tpl_exposure', null, 'CZ', '{}', array['cz_official#transport'], 0),
  ('tab', null, 'expenses', 'CZ', '{}', array['tightwad#cost_per_use', 'ymyl#gazingus_pins'], 0),
  ('tab', null, 'budget', 'CZ', '{}', array['sethi_csp#fixed_costs_crisis', 'cfpb#dti_thresholds'], 0),
  ('tab', null, 'savings', 'CZ', '{}', array['cfpb#emergency_fund', 'sethi_csp#positive_signals'], 0),
  ('tab', null, 'goals', 'CZ', '{}', array['cfpb#emergency_fund', 'ymyl#fulfillment_curve'], 0),
  ('tab', null, 'income', 'CZ', '{}', array['mnd#lifestyle_inflation', 'sethi_csp#positive_signals'], 0),
  ('tab', null, 'tracker', 'CZ', '{}', array['ymyl#gazingus_pins', 'tightwad#cost_per_use'], 0),
  ('tab', null, 'expenses', 'CZ', '{}', array['cz_official#renting', 'cz_official#utilities', 'cz_official#transport'], 0),
  ('tab', null, 'budget', 'CZ', '{}', array['cz_official#taxes', 'cz_official#utilities'], 0),
  ('tab', null, 'alerts', 'CZ', '{}', array['cz_official#health_insurance', 'cz_official#permits'], 0),
  ('tab', null, 'home', 'CZ', '{}', array['cz_official#permits', 'cz_official#health_insurance'], 0),
  ('chat_keyword', null, null, 'CZ', array['permit', 'visa', 'residence', 'moi', 'pobyt', 'povolen', 'cizinc'], array['cz_official#permits'], 0),
  ('chat_keyword', null, null, 'CZ', array['rent', 'tenant', 'landlord', 'lease', 'nájem', 'pronájem', 'nájemn'], array['cz_official#renting'], 0),
  ('chat_keyword', null, null, 'CZ', array['health', 'insurance', 'vzp', 'pojist', 'zdravot', 'pojištění'], array['cz_official#health_insurance'], 0),
  ('chat_keyword', null, null, 'CZ', array['tax', 'daně', 'daň', 'finanční', 'financni', 'příjem', 'prijem'], array['cz_official#taxes'], 0),
  ('chat_keyword', null, null, 'CZ', array['utility', 'utilities', 'energy', 'waste', 'popeln', 'energie', 'vodné'], array['cz_official#utilities'], 0),
  ('chat_keyword', null, null, 'CZ', array['transport', 'vignette', 'dalnice', 'parking', 'vehicle', 'auto', 'stk', 'ručení'], array['cz_official#transport'], 0);

insert into public.prompt_versions (key, version, is_active, published_at)
values
  ('coach', 'v3', true, now()),
  ('chat', 'v1', true, now())
on conflict (key, version) do nothing;
