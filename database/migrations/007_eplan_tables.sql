create table if not exists eplan_plans (
  id uuid primary key default gen_random_uuid(),
  source_id text not null default 'csb-e-plan' references data_sources(id),
  municipality_id uuid references municipalities(id),
  plan_external_id text,
  plan_type text not null check (plan_type in ('nip','uip','cevreduzeni','ozel','diger')),
  status text not null check (status in ('askida','yururlukte','iptal','arsiv')),
  title text not null,
  province text,
  district text,
  approval_date date,
  aski_start_date date,
  aski_end_date date,
  plan_number text,
  scale text,
  gml_url text,
  pdf_url text,
  document_urls text[] not null default '{}',
  geom geometry(MultiPolygon, 4326),
  metadata jsonb not null default '{}'::jsonb,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, plan_external_id)
);

create index if not exists eplan_plans_geom_gix on eplan_plans using gist (geom);
create index if not exists eplan_plans_status_idx on eplan_plans (status, aski_end_date desc);
create index if not exists eplan_plans_municipality_idx on eplan_plans (municipality_id, status);
create index if not exists eplan_plans_province_idx on eplan_plans (province, district);

create table if not exists plan_changes_log (
  id uuid primary key default gen_random_uuid(),
  eplan_plan_id uuid not null references eplan_plans(id) on delete cascade,
  change_type text not null check (change_type in (
    'new_plan', 'status_change', 'emsal_change', 'geometry_change',
    'aski_started', 'aski_ended', 'document_added', 'metadata_change'
  )),
  previous_value jsonb,
  new_value jsonb,
  detected_at timestamptz not null default now(),
  notified boolean not null default false
);

create index if not exists plan_changes_log_plan_idx on plan_changes_log (eplan_plan_id, detected_at desc);
create index if not exists plan_changes_log_unnotified_idx on plan_changes_log (notified, detected_at) where notified = false;

create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_reference text not null,
  watch_type text not null check (watch_type in ('municipality', 'province', 'district', 'parcel', 'coordinate_area')),
  watch_target text not null,
  geom geometry(Polygon, 4326),
  notify_channels text[] not null default array['webhook'],
  webhook_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watchlist_active_idx on watchlist (active, watch_type, watch_target);
