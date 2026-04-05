-- Itinerary / route planning
create type itinerary_status as enum ('planned', 'in_progress', 'completed');

create table itineraries (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references users(id) on delete cascade,
  name text,
  status itinerary_status not null default 'planned',
  planned_date date not null,
  assignments uuid[] default '{}', -- ordered array of assignment IDs
  total_distance_km numeric(6,2),
  estimated_hours numeric(4,1),
  created_at timestamptz default now()
);

create index idx_itineraries_volunteer on itineraries(volunteer_id);
create index idx_itineraries_date on itineraries(planned_date);

alter table itineraries enable row level security;
create policy "Allow all for authenticated" on itineraries for all using (true);
