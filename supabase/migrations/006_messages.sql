-- SMS / multi-channel message inbox
create type message_status as enum ('pending', 'promoted', 'dismissed');

create table messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null, -- 'sms', 'email', 'whatsapp'
  sender text not null, -- phone number, email address
  body text not null,
  status message_status not null default 'pending',
  promoted_case_id uuid references cases(id) on delete set null,
  metadata jsonb default '{}', -- raw webhook payload
  created_at timestamptz default now()
);

create index idx_messages_status on messages(status);
create index idx_messages_created on messages(created_at desc);

alter table messages enable row level security;
create policy "Allow all for authenticated" on messages for all using (true);

-- Add 'sms' to case_source enum
alter type case_source add value 'sms';
