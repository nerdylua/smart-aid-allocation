-- RPC function for proximity query using PostGIS
create or replace function get_nearby_case_count(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters double precision default 5000
)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from cases
  where location is not null
    and status in ('new', 'triaged', 'matched', 'assigned', 'in_progress')
    and ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_meters
    );
$$;
