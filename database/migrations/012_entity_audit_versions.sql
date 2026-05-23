create table if not exists entity_audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('parcel', 'source', 'report')),
  entity_id text not null,
  operation text not null check (operation in ('create', 'update', 'delete', 'rollback', 'status_change', 'source_refresh', 'report_generated')),
  actor_ref text not null,
  reason text not null,
  before_value jsonb,
  after_value jsonb,
  before_hash text generated always as (case when before_value is null then null else encode(sha256(before_value::text::bytea), 'hex') end) stored,
  after_hash text generated always as (case when after_value is null then null else encode(sha256(after_value::text::bytea), 'hex') end) stored,
  source_id text references data_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists entity_audit_log_entity_idx
  on entity_audit_log (entity_type, entity_id, created_at desc);

create table if not exists entity_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('parcel', 'source', 'report')),
  entity_id text not null,
  version_no integer not null,
  value jsonb not null,
  source_id text references data_sources(id) on delete set null,
  created_by text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version_no)
);

create index if not exists entity_versions_entity_idx
  on entity_versions (entity_type, entity_id, version_no desc);

alter table if exists notification_deliveries
  drop constraint if exists notification_deliveries_status_check;

alter table if exists notification_deliveries
  add constraint notification_deliveries_status_check
  check (status in ('queued', 'sent', 'failed', 'requires_provider', 'dry_run'));
