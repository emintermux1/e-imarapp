create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists data_sources (
  id text primary key,
  name text not null,
  jurisdiction text not null check (jurisdiction in ('national', 'municipal', 'regional', 'global')),
  category text not null,
  homepage_url text not null,
  access_status text not null,
  access_notes text not null,
  capabilities text[] not null default '{}',
  documentation_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  province_name text,
  official_url text,
  geom geometry(MultiPolygon, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, province_name)
);

create table if not exists connectors (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id) on delete cascade,
  municipality_id uuid references municipalities(id) on delete set null,
  kind text not null,
  base_url text not null,
  status text not null default 'unavailable' check (
    status in ('available', 'unavailable', 'requires_credentials', 'captcha_required', 'rate_limited', 'unsupported_format', 'endpoint_changed')
  ),
  last_http_status integer,
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists parcels (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  municipality_id uuid references municipalities(id),
  ada text,
  parsel_no text,
  external_id text,
  geom geometry(MultiPolygon, 4326) not null,
  centroid geometry(Point, 4326) generated always as (ST_PointOnSurface(geom)) stored,
  attributes jsonb not null default '{}'::jsonb,
  source_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  municipality_id uuid references municipalities(id),
  plan_number text,
  title text not null,
  scale text,
  approval_date date,
  effective_date date,
  document_url text,
  geom geometry(MultiPolygon, 4326),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists zoning_layers (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  plan_id uuid references plans(id) on delete set null,
  layer_type text not null,
  zoning_function text,
  legend_code text,
  geom geometry(MultiPolygon, 4326) not null,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_sheets (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  plan_id uuid references plans(id) on delete cascade,
  sheet_code text,
  document_url text not null,
  object_storage_key text,
  mime_type text,
  ocr_status text not null default 'not_started',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_notes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  source_id text not null references data_sources(id),
  note_text text not null,
  parsed_rules jsonb not null default '{}'::jsonb,
  source_document_url text,
  created_at timestamptz not null default now()
);

create table if not exists suspension_notices (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  municipality_id uuid references municipalities(id),
  title text not null,
  announcement_url text not null,
  published_at timestamptz,
  objection_deadline timestamptz,
  status text not null default 'discovered' check (status in ('discovered', 'parsed', 'requires_review', 'archived')),
  extracted_text text,
  diff_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists parcel_zoning_snapshots (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  source_id text not null references data_sources(id),
  zoning_layer_id uuid references zoning_layers(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  emsal numeric,
  taks numeric,
  kaks numeric,
  gabari text,
  building_height text,
  approach_rules jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists connector_runs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid references connectors(id) on delete set null,
  source_id text not null references data_sources(id),
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'requires_credentials')),
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists municipalities_geom_gix on municipalities using gist (geom);
create index if not exists parcels_geom_gix on parcels using gist (geom);
create index if not exists parcels_centroid_gix on parcels using gist (centroid);
create index if not exists parcels_source_ada_parsel_idx on parcels (source_id, ada, parsel_no);
create index if not exists plans_geom_gix on plans using gist (geom);
create index if not exists zoning_layers_geom_gix on zoning_layers using gist (geom);
create index if not exists suspension_notices_source_idx on suspension_notices (source_id, published_at desc);
create index if not exists connector_runs_source_idx on connector_runs (source_id, created_at desc);
