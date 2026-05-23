create table if not exists notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_reference text not null,
  channel text not null check (channel in ('webhook', 'push')),
  target text not null,
  platform text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_reference, channel, target)
);

create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  change_id uuid not null references plan_changes_log(id) on delete cascade,
  subscription_id uuid references notification_subscriptions(id) on delete set null,
  channel text not null check (channel in ('webhook', 'push')),
  target text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('queued', 'sent', 'failed', 'requires_provider', 'dry_run')),
  response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_subscriptions_user_idx
  on notification_subscriptions (user_reference, active, channel);

create index if not exists notification_deliveries_change_idx
  on notification_deliveries (change_id, created_at desc);
