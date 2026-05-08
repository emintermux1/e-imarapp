create table if not exists municipal_gis_endpoints (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id) on delete cascade,
  municipality_id uuid references municipalities(id) on delete set null,
  base_url text not null,
  wms_url text not null,
  wms_get_capabilities_url text not null,
  wms_version text,
  wfs_url text,
  wfs_get_capabilities_url text,
  available_layers jsonb not null default '[]'::jsonb,
  supported_srs text[] not null default '{}',
  supported_formats text[] not null default '{}',
  status text not null default 'available' check (
    status in ('available', 'unavailable', 'requires_credentials', 'captcha_required', 'rate_limited', 'unsupported_format', 'endpoint_changed')
  ),
  discovered_at timestamptz not null default now(),
  refresh_after timestamptz not null default now() + interval '7 days',
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, base_url)
);

create index if not exists municipal_gis_endpoints_source_idx on municipal_gis_endpoints (source_id, status, refresh_after);
create index if not exists municipal_gis_endpoints_layers_gin on municipal_gis_endpoints using gin (available_layers);
