-- Volunteer status dimensions: separate staffing from action
create type staffing_status as enum ('available', 'on_shift', 'delayed', 'committed', 'unavailable');
create type action_status as enum ('idle', 'responding', 'on_scene', 'returning');

alter table users add column staffing staffing_status not null default 'available';
alter table users add column action action_status not null default 'idle';
alter table users add column status_updated_at timestamptz default now();
