-- RPCs for the matching agent: return rows with numeric lat/lng already
-- extracted from the geography columns, so the agent can feed them into
-- its distance tool directly instead of trying to parse WKB hex.

create or replace function get_case_for_matching(p_case_id uuid)
returns table (
  id uuid,
  title text,
  needs jsonb,
  location_label text,
  language text,
  person_info jsonb,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    c.id,
    c.title,
    c.needs,
    c.location_label,
    c.language,
    c.person_info,
    case when c.location is null then null::double precision
         else ST_Y(c.location::geometry) end as lat,
    case when c.location is null then null::double precision
         else ST_X(c.location::geometry) end as lng
  from cases c
  where c.id = p_case_id;
$$;

create or replace function get_available_volunteers_for_matching()
returns table (
  id uuid,
  name text,
  skills text[],
  language text,
  availability jsonb,
  staffing staffing_status,
  action action_status,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    u.id,
    u.name,
    u.skills,
    u.language,
    u.availability,
    u.staffing,
    u.action,
    case when u.location is null then null::double precision
         else ST_Y(u.location::geometry) end as lat,
    case when u.location is null then null::double precision
         else ST_X(u.location::geometry) end as lng
  from users u
  where u.role = 'volunteer'
    and u.staffing in ('available', 'on_shift')
    and u.action = 'idle'
  limit 20;
$$;
