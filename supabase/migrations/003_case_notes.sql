-- Case activity timeline / notes
create table case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  author_name text,
  content text not null,
  note_type text not null default 'comment', -- 'comment', 'status_change', 'system', 'escalation'
  created_at timestamptz default now()
);

create index idx_case_notes_case on case_notes(case_id, created_at);

alter table case_notes enable row level security;
create policy "Allow all for authenticated" on case_notes for all using (true);
