create table if not exists parcel_query_history (
  id uuid primary key default gen_random_uuid(),
  user_reference text not null,
  query_type text not null,
  query_payload jsonb not null,
  result_count integer,
  created_at timestamptz not null default now()
);

create table if not exists user_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_reference text not null,
  item_type text not null check (item_type in ('parcel', 'plan', 'municipality', 'search', 'report')),
  item_reference text not null,
  label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_reference, item_type, item_reference)
);

create table if not exists report_requests (
  id uuid primary key default gen_random_uuid(),
  user_reference text not null,
  parcel_id uuid references parcels(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  report_type text not null check (report_type in ('bank', 'architect', 'notary', 'investment', 'zoning_summary')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  output_storage_key text,
  share_token text unique,
  requested_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists building_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  user_reference text,
  parcel_id uuid not null references parcels(id) on delete cascade,
  input_payload jsonb not null default '{}'::jsonb,
  envelope jsonb not null default '{}'::jsonb,
  shadow_analysis jsonb not null default '{}'::jsonb,
  view_corridor_analysis jsonb not null default '{}'::jsonb,
  status text not null default 'computed' check (status in ('queued', 'computed', 'requires_data', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists satellite_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_reference text,
  parcel_id uuid references parcels(id) on delete set null,
  source_id text references data_sources(id) on delete set null,
  analysis_type text not null check (analysis_type in ('illegal_building', 'empty_parcel', 'new_construction', 'construction_progress', 'excavation')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'requires_provider')),
  provider text,
  area geometry(Polygon, 4326),
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists merge_candidate_analyses (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  adjacent_parcel_id uuid not null references parcels(id) on delete cascade,
  combined_area_m2 numeric,
  estimated_advantage jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (parcel_id, adjacent_parcel_id)
);

create table if not exists real_estate_value_requests (
  id uuid primary key default gen_random_uuid(),
  user_reference text,
  parcel_id uuid references parcels(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'requires_market_data')),
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists parcel_query_history_user_idx on parcel_query_history (user_reference, created_at desc);
create index if not exists user_saved_items_user_idx on user_saved_items (user_reference, item_type);
create index if not exists report_requests_user_idx on report_requests (user_reference, created_at desc);
create index if not exists building_simulation_runs_parcel_idx on building_simulation_runs (parcel_id, created_at desc);
create index if not exists satellite_analysis_area_gix on satellite_analysis_requests using gist (area);
create index if not exists merge_candidate_parcel_idx on merge_candidate_analyses (parcel_id);
