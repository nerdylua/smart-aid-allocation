-- Incident / campaign grouping
create type incident_status as enum ('active', 'monitoring', 'resolved', 'closed');

create table incidents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text, -- 'flood', 'earthquake', 'disease_outbreak', 'fire', etc.
  description text,
  status incident_status not null default 'active',
  location_label text,
  location geography(Point, 4326),
  started_at timestamptz default now(),
  resolved_at timestamptz,
  target_cases integer, -- goal: serve N households
  org_id uuid references organizations(id) on delete set null,
  created_at timestamptz default now()
);

-- Add optional FK on cases
alter table cases add column incident_id uuid references incidents(id) on delete set null;
create index idx_cases_incident on cases(incident_id);

alter table incidents enable row level security;
create policy "Allow all for authenticated" on incidents for all using (true);
