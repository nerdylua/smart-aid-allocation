-- Community Need Intelligence Grid - Initial Schema
-- 8 tables: organizations, users, cases, assessments, assignments, verifications, feedback, audit_events

-- Enable PostGIS for geography/geometry support
create extension if not exists postgis;

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'coordinator', 'field_worker', 'volunteer');
create type case_source as enum ('form', 'csv', 'api', 'helpline');
create type case_status as enum ('new', 'triaged', 'matched', 'assigned', 'in_progress', 'completed', 'closed');
create type assignment_status as enum ('assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'closed');
create type verification_outcome as enum ('confirmed', 'partial', 'failed');

-- ============================================================
-- TABLES
-- ============================================================

-- 1. Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text, -- e.g. 'medical_relief', 'food_bank', 'disaster_response'
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- 2. Users (all roles: admin, coordinator, field_worker, volunteer)
create table users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  role user_role not null default 'field_worker',
  email text unique not null,
  name text not null,
  language text default 'en',
  skills text[] default '{}',
  location geography(Point, 4326),
  availability jsonb default '{"available": true}',
  created_at timestamptz default now()
);

-- 3. Cases
create table cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  source_channel case_source not null default 'form',
  title text not null,
  description text,
  location geography(Point, 4326),
  location_label text,
  needs jsonb default '[]', -- e.g. [{"type": "medical", "detail": "insulin"}]
  person_info jsonb default '{}', -- e.g. {"name": "...", "age": 65, "family_size": 4}
  status case_status not null default 'new',
  language text default 'en',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Assessments (AI triage output)
create table assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  severity smallint not null check (severity between 1 and 10),
  vulnerability smallint not null check (vulnerability between 1 and 10),
  confidence numeric(3,2) not null check (confidence between 0 and 1),
  freshness numeric(3,2) not null check (freshness between 0 and 1),
  priority_score numeric(5,2) generated always as (
    (severity * 0.35 + vulnerability * 0.30 + confidence * 10 * 0.20 + freshness * 10 * 0.15)
  ) stored,
  rationale text not null,
  is_flagged boolean not null default false,
  flagged_reason text,
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 5. Assignments
create table assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  volunteer_id uuid not null references users(id) on delete cascade,
  status assignment_status not null default 'assigned',
  match_rationale text,
  match_score numeric(5,2),
  sla_deadline timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 6. Verifications
create table verifications (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  proof_notes text,
  proof_media_url text,
  verified_by uuid references users(id) on delete set null,
  outcome verification_outcome not null,
  created_at timestamptz default now()
);

-- 7. Feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comments text,
  submitted_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- 8. Audit Events
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'case', 'assignment', 'assessment', etc.
  entity_id uuid not null,
  action text not null, -- 'created', 'assessed', 'assigned', 'completed', etc.
  actor_id uuid references users(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_cases_status on cases(status);
create index idx_cases_org on cases(org_id);
create index idx_cases_created on cases(created_at desc);
create index idx_cases_location on cases using gist(location);
create index idx_users_role on users(role);
create index idx_users_org on users(org_id);
create index idx_users_location on users using gist(location);
create index idx_assessments_case on assessments(case_id);
create index idx_assessments_priority on assessments(priority_score desc);
create index idx_assignments_case on assignments(case_id);
create index idx_assignments_volunteer on assignments(volunteer_id);
create index idx_assignments_status on assignments(status);
create index idx_audit_entity on audit_events(entity_type, entity_id);
create index idx_audit_created on audit_events(created_at desc);

-- ============================================================
-- AUTO-UPDATE updated_at ON CASES
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at
  before update on cases
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (multi-org isolation)
-- ============================================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table cases enable row level security;
alter table assessments enable row level security;
alter table assignments enable row level security;
alter table verifications enable row level security;
alter table feedback enable row level security;
alter table audit_events enable row level security;

-- For hackathon demo: permissive policies (service role bypasses RLS)
-- In production these would be scoped to org_id via JWT claims

create policy "Allow all for authenticated" on organizations for all using (true);
create policy "Allow all for authenticated" on users for all using (true);
create policy "Allow all for authenticated" on cases for all using (true);
create policy "Allow all for authenticated" on assessments for all using (true);
create policy "Allow all for authenticated" on assignments for all using (true);
create policy "Allow all for authenticated" on verifications for all using (true);
create policy "Allow all for authenticated" on feedback for all using (true);
create policy "Allow all for authenticated" on audit_events for all using (true);
