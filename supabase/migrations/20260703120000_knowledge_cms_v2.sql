-- Knowledge CMS v2: countries[], tags[], reference URLs, tag registry

alter table public.knowledge_sources
  add column if not exists country_codes text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists reference_url text;

alter table public.knowledge_chunks
  add column if not exists country_codes text[] not null default '{}';

alter table public.knowledge_routes
  add column if not exists country_codes text[] not null default '{}';

create table if not exists public.knowledge_tags (
  slug text primary key,
  label_en text not null,
  label_cs text not null,
  created_at timestamptz not null default now()
);

alter table public.knowledge_tags enable row level security;

create policy knowledge_tags_select_all on public.knowledge_tags
  for select to authenticated
  using (true);

-- Backfill source country_codes from legacy type/country_code
update public.knowledge_sources
set country_codes = case
  when type = 'country' and country_code is not null and country_code <> ''
    then array[upper(country_code)]
  else '{}'::text[]
end
where country_codes = '{}'::text[];

-- Backfill route country_codes from legacy country_code
update public.knowledge_routes
set country_codes = case
  when country_code is not null and country_code <> ''
    then array[upper(country_code)]
  else '{}'::text[]
end
where country_codes = '{}'::text[];

-- Backfill chunk country_codes: country bundle rows → CZ
update public.knowledge_chunks
set country_codes = array['CZ']::text[]
where country_codes = '{}'::text[]
  and (country_code = 'CZ' or id like 'cz_official#%');

-- Seed default tags
insert into public.knowledge_tags (slug, label_en, label_cs)
values
  ('book', 'Book / guide', 'Kniha / průvodce'),
  ('official', 'Official source', 'Oficiální zdroj'),
  ('regulation', 'Regulation', 'Regulace'),
  ('debt', 'Debt', 'Dluhy'),
  ('housing', 'Housing', 'Bydlení'),
  ('savings', 'Savings', 'Spoření'),
  ('taxes', 'Taxes', 'Daně'),
  ('health', 'Health', 'Zdraví'),
  ('transport', 'Transport', 'Doprava')
on conflict (slug) do nothing;

-- Tag sources from legacy type
update public.knowledge_sources
set tags = array['book']::text[]
where type = 'book' and tags = '{}'::text[];

update public.knowledge_sources
set tags = array['official', 'regulation']::text[]
where type = 'country' and tags = '{}'::text[];
