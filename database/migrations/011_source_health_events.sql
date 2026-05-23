create table if not exists source_health_events (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references data_sources(id) on delete cascade,
  endpoint_url text,
  probe_type text not null default 'http' check (probe_type in ('http', 'wms', 'wfs', 'arcgis_rest', 'keos', 'manual')),
  status text not null check (
    status in ('live', 'fallback', 'unavailable', 'requires_credentials', 'captcha_required', 'rate_limited', 'provider_error', 'degraded', 'unknown')
  ),
  raw_status text,
  success boolean not null default false,
  http_status integer,
  latency_ms integer,
  error_code text,
  error_message text,
  previous_status text,
  next_check_at timestamptz,
  checked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists source_health_events_source_checked_idx on source_health_events (source_id, checked_at desc);
create index if not exists source_health_events_status_idx on source_health_events (status, checked_at desc);
create index if not exists source_health_events_next_check_idx on source_health_events (next_check_at) where next_check_at is not null;
