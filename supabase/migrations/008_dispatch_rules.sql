-- Configurable dispatch rules
create table dispatch_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  condition_min_severity smallint default 1,
  condition_max_severity smallint default 10,
  condition_min_priority numeric(5,2) default 0,
  sla_hours integer not null default 48,
  auto_escalate boolean not null default false,
  notify_channels text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table dispatch_rules enable row level security;
create policy "Allow all for authenticated" on dispatch_rules for all using (true);
