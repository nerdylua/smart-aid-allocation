-- Fix priority formula: decouple confidence from ranking
-- Confidence inflated scores — uncertain severe cases got buried.
-- New formula: severity * 0.45 + vulnerability * 0.35 + freshness * 10 * 0.20

-- Drop and recreate the generated column with new formula
alter table assessments drop column priority_score;
alter table assessments add column priority_score numeric(5,2) generated always as (
  (severity * 0.45 + vulnerability * 0.35 + freshness * 10 * 0.20)
) stored;

-- Recreate index on priority_score
drop index if exists idx_assessments_priority;
create index idx_assessments_priority on assessments(priority_score desc);

-- Trigger: auto-flag when vulnerability >= 9
create or replace function flag_high_vulnerability()
returns trigger as $$
begin
  if new.vulnerability >= 9 and not new.is_flagged then
    new.is_flagged := true;
    new.flagged_reason := coalesce(
      new.flagged_reason,
      'Extremely vulnerable population — requires coordinator review'
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger assessments_flag_vulnerability
  before insert or update on assessments
  for each row execute function flag_high_vulnerability();
