create table if not exists coordinate_reference_systems (
  srid integer primary key,
  auth_name text not null default 'EPSG',
  name text not null,
  proj4text text,
  usage_notes text,
  created_at timestamptz not null default now()
);

insert into coordinate_reference_systems (srid, auth_name, name, usage_notes)
values
  (4326, 'EPSG', 'WGS 84', 'Default API input/output coordinate system.'),
  (5254, 'EPSG', 'TUREF / TM27', 'Common Turkish projected CRS zone.'),
  (5255, 'EPSG', 'TUREF / TM30', 'Common Turkish projected CRS zone.'),
  (5256, 'EPSG', 'TUREF / TM33', 'Common Turkish projected CRS zone.'),
  (5257, 'EPSG', 'TUREF / TM36', 'Common Turkish projected CRS zone.'),
  (5258, 'EPSG', 'TUREF / TM39', 'Common Turkish projected CRS zone.'),
  (5259, 'EPSG', 'TUREF / TM42', 'Common Turkish projected CRS zone.'),
  (23035, 'EPSG', 'ED50 / UTM zone 35N', 'Legacy cadastral/geospatial data may reference ED50.'),
  (23036, 'EPSG', 'ED50 / UTM zone 36N', 'Legacy cadastral/geospatial data may reference ED50.'),
  (23037, 'EPSG', 'ED50 / UTM zone 37N', 'Legacy cadastral/geospatial data may reference ED50.'),
  (23038, 'EPSG', 'ED50 / UTM zone 38N', 'Legacy cadastral/geospatial data may reference ED50.')
on conflict (srid) do update set
  name = excluded.name,
  usage_notes = excluded.usage_notes;

create table if not exists legends (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  plan_id uuid references plans(id) on delete cascade,
  code text,
  label text not null,
  fill_color text,
  stroke_color text,
  semantic_class text,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists source_access_requirements (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id) on delete cascade,
  requirement_type text not null check (
    requirement_type in ('api_key', 'oauth', 'edevlet_login', 'institutional_login', 'captcha_session', 'legal_protocol', 'commercial_token')
  ),
  status text not null default 'needed' check (status in ('needed', 'provided', 'verified', 'blocked')),
  description text not null,
  secret_env_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, requirement_type, secret_env_name)
);

create table if not exists ingestion_tasks (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id),
  connector_id uuid references connectors(id) on delete set null,
  task_type text not null check (task_type in ('api', 'wms', 'wfs', 'arcgis_rest', 'scrape', 'browser', 'webhook', 'tile_index', 'ocr')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'requires_credentials', 'blocked')),
  priority integer not null default 100,
  payload jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  run_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text references data_sources(id),
  plan_id uuid references plans(id) on delete set null,
  parcel_id uuid references parcels(id) on delete set null,
  analysis_type text not null check (
    analysis_type in ('plan_note_summary', 'legend_classification', 'pdf_ocr', 'zoning_risk', 'source_confidence', 'provenance_explanation')
  ),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'requires_review')),
  input_ref jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legends_source_idx on legends (source_id, semantic_class);
create index if not exists source_access_requirements_source_idx on source_access_requirements (source_id, status);
create index if not exists ingestion_tasks_source_status_idx on ingestion_tasks (source_id, status, created_at desc);
create index if not exists ai_analysis_runs_type_status_idx on ai_analysis_runs (analysis_type, status, created_at desc);
