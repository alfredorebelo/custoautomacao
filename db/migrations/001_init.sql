-- CustoAutomação: primeira migração. Aplicar só quando houver Postgres.
-- Não cria dados de audiência nem preços históricos.

create table if not exists submissions (
  id uuid primary key,
  kind text not null check (kind in ('correction', 'sponsor_inquiry')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists newsletter_signups (
  id uuid primary key,
  email_normalized text not null unique,
  status text not null check (status in ('pending', 'confirmed', 'unsubscribed')),
  consent_text text not null,
  consent_at timestamptz not null default now(),
  confirm_token_hash text not null,
  unsubscribe_token_hash text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz
);

create table if not exists search_events (
  id bigserial primary key,
  query text not null,
  result_count integer not null,
  zero_result boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists pageviews (
  id bigserial primary key,
  path text not null,
  created_at timestamptz not null default now()
);

create table if not exists sponsor_weeks (
  id uuid primary key,
  slug text not null,
  starts_on date not null,
  price_minor integer not null,
  currency text not null,
  tax_label text not null,
  status text not null check (status in ('proposed', 'booked', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists sponsor_clicks (
  id bigserial primary key,
  slug text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_errors (
  id bigserial primary key,
  source text not null,
  message text not null,
  created_at timestamptz not null default now()
);
