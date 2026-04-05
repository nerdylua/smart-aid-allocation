# Sahaya — Feature Implementation Tasks

> 13 features to implement, ordered by priority and dependency.
> Each task includes context, affected files, and implementation guidance.

---

## Project Context

- **Stack**: Next.js 16 (App Router), Supabase (PostgreSQL + PostGIS), Vercel AI SDK 6, OpenAI GPT-5.4-mini, React Leaflet 5, shadcn/ui, TypeScript
- **DB Client**: `lib/supabase/server.ts` (service role, bypasses RLS), `lib/supabase/client.ts` (anon key, browser)
- **Types**: `lib/supabase/types.ts` (manual interfaces matching `supabase/migrations/001_initial_schema.sql`)
- **Agents**: `lib/agents/triage.ts`, `lib/agents/matching.ts`, `lib/agents/dispatch.ts` — each uses `ToolLoopAgent` with `tool()` definitions
- **Current schema**: 8 tables — organizations, users, cases, assessments, assignments, verifications, feedback, audit_events
- **Current enums**: user_role, case_source, case_status, assignment_status, verification_outcome
- **API routes**: `/api/intakes`, `/api/intakes/batch`, `/api/cases`, `/api/cases/[id]`, `/api/assess`, `/api/match`, `/api/assignments`, `/api/assignments/[id]`, `/api/verify`, `/api/volunteers`, `/api/volunteers/[id]`, `/api/reports`
- **Pages**: `/dashboard`, `/cases`, `/cases/[id]`, `/intake`, `/assignments`, `/volunteers`
- **Seed script**: `scripts/seed.ts` — 4 orgs, 20 users, 16 cases, pre-computed assessments/assignments

---

## Task 1: Fix Priority Formula

**Priority**: Critical (scoring bug)
**Effort**: 30 minutes
**Inspired by**: dssg/triage — "the top of the priority list is what matters"

### Problem
The current `priority_score` in `assessments` is a generated column:
```sql
priority_score numeric(5,2) generated always as (
  (severity * 0.35 + vulnerability * 0.30 + confidence * 10 * 0.20 + freshness * 10 * 0.15)
) stored
```
This means high confidence inflates the score. A severity-9 case with low confidence gets buried below a severity-6 case with perfect confidence. Uncertain severe cases should be **escalated**, not suppressed.

### What to do
1. **New formula**: Decouple confidence from ranking. Use it only for flagging.
   ```
   priority_score = severity * 0.45 + vulnerability * 0.35 + freshness * 10 * 0.20
   ```
   Confidence remains in the assessment but no longer suppresses priority.

2. **Migration**: Create `supabase/migrations/002_fix_priority_formula.sql`:
   - Drop and recreate the generated column with the new formula
   - Add flagging trigger: `vulnerability >= 9` should also set `is_flagged = true`

3. **Update triage agent** (`lib/agents/triage.ts`):
   - Add to flagging rules in the system prompt: "If vulnerability >= 9: flag with reason 'Extremely vulnerable population — requires coordinator review'"

4. **No UI changes needed** — the dashboard and case queue already read `priority_score` and `is_flagged`.

### Files to modify
- `supabase/migrations/002_fix_priority_formula.sql` (new)
- `lib/agents/triage.ts` (add vulnerability flagging rule to instructions)

---

## Task 2: Case Activity Timeline / Notes

**Priority**: High
**Effort**: 2 hours
**Inspired by**: Resgrid — cases need a living activity feed, not just a static description

### Problem
A case has a single `description` field. During a multi-day response, field workers need to post updates, coordinators need to add notes, and status changes should appear in a chronological timeline.

### What to do
1. **Migration** `supabase/migrations/003_case_notes.sql`:
   ```sql
   create table case_notes (
     id uuid primary key default gen_random_uuid(),
     case_id uuid not null references cases(id) on delete cascade,
     author_id uuid references users(id) on delete set null,
     author_name text, -- denormalized for display when author is null
     content text not null,
     note_type text not null default 'comment', -- 'comment', 'status_change', 'system', 'escalation'
     created_at timestamptz default now()
   );
   create index idx_case_notes_case on case_notes(case_id, created_at);
   alter table case_notes enable row level security;
   create policy "Allow all for authenticated" on case_notes for all using (true);
   ```

2. **API route** `app/api/cases/[id]/notes/route.ts`:
   - `GET`: Fetch notes for a case ordered by `created_at asc`
   - `POST`: Create a new note (body: `{ content, note_type?, author_name? }`)

3. **Auto-log status changes**: In existing routes that update case status (`app/api/assess/route.ts`, `app/api/assignments/route.ts`, `app/api/assignments/[id]/route.ts`, `app/api/verify/route.ts`), insert a `case_notes` entry with `note_type: 'status_change'` alongside the audit event.

4. **UI**: In `app/(app)/cases/[id]/client.tsx`, add a timeline section below the existing case detail. Show notes chronologically with type badges (comment, status_change, system). Add a text input + submit button for adding new comments.

5. **Types**: Add `CaseNote` interface to `lib/supabase/types.ts`.

### Files to modify
- `supabase/migrations/003_case_notes.sql` (new)
- `app/api/cases/[id]/notes/route.ts` (new)
- `app/(app)/cases/[id]/client.tsx` (add timeline UI)
- `lib/supabase/types.ts` (add CaseNote type)
- `app/api/assess/route.ts` (add status_change note)
- `app/api/assignments/route.ts` (add status_change note)
- `app/api/assignments/[id]/route.ts` (add status_change note)
- `app/api/verify/route.ts` (add status_change note)

---

## Task 3: Volunteer Status Dimensions

**Priority**: High
**Effort**: 1 hour
**Inspired by**: Resgrid — separate staffing availability from action status

### Problem
Volunteers have a single `availability: { available: boolean }`. A coordinator can't tell if someone is "available but currently en route to another case" vs "fully free" vs "on leave."

### What to do
1. **Migration** `supabase/migrations/004_volunteer_status.sql`:
   ```sql
   create type staffing_status as enum ('available', 'on_shift', 'delayed', 'committed', 'unavailable');
   create type action_status as enum ('idle', 'responding', 'on_scene', 'returning');
   
   alter table users add column staffing staffing_status not null default 'available';
   alter table users add column action action_status not null default 'idle';
   alter table users add column status_updated_at timestamptz default now();
   ```

2. **API**: Update `app/api/volunteers/[id]/route.ts` PATCH to accept `staffing` and `action` fields. Auto-set `status_updated_at` on change.

3. **Matching agent** (`lib/agents/matching.ts`): Update `getAvailableVolunteers` tool to filter by `staffing in ('available', 'on_shift')` and `action = 'idle'` instead of the current `availability->available = true` check.

4. **UI**: Update `app/(app)/volunteers/page.tsx` to show staffing + action badges. Update `app/(app)/assignments/page.tsx` — when a volunteer accepts an assignment, auto-update their action to `'responding'`; when they complete, set back to `'idle'`.

5. **Seed script**: Update `scripts/seed.ts` to set varied staffing/action statuses on volunteers.

### Files to modify
- `supabase/migrations/004_volunteer_status.sql` (new)
- `app/api/volunteers/[id]/route.ts` (accept new fields)
- `lib/agents/matching.ts` (update volunteer query filter)
- `app/(app)/volunteers/page.tsx` (show status badges)
- `app/(app)/assignments/page.tsx` (auto-update volunteer action on accept/complete)
- `scripts/seed.ts` (varied statuses)
- `lib/supabase/types.ts` (add StaffingStatus, ActionStatus types)

---

## Task 4: Bias Audit Panel

**Priority**: High (hackathon differentiator)
**Effort**: 3 hours
**Inspired by**: dssg/triage + Aequitas — fairness as a first-class concern

### Problem
No visibility into whether the AI triage systematically scores certain regions, languages, or case types differently. Judges will notice if we address equity.

### What to do
1. **API route** `app/api/reports/bias/route.ts`:
   - Query assessments joined with cases
   - Group by: `location_label`, `language`, `needs[0].type` (primary need category)
   - For each group compute: avg_severity, avg_vulnerability, avg_priority_score, flag_rate (% flagged), case_count
   - Compute disparity_ratio: `max_flag_rate / min_flag_rate` across groups (>1.2 = warning)
   - Return JSON with per-group stats + overall disparity metrics

2. **UI component** `components/bias-audit-panel.tsx`:
   - Client component with horizontal bar charts (use simple div-based bars, no charting library needed)
   - Show avg priority by region, flag rate by language, severity distribution by case type
   - Display disparity ratio with green/yellow/red indicator
   - Include a text explanation: "Disparity ratio measures whether AI triage flags cases at similar rates across groups. Values >1.2 may indicate bias."

3. **Dashboard integration**: Add the bias panel to `app/(app)/dashboard/page.tsx` as a collapsible section below the existing grid, or as a new `/reports` page.

### Files to modify
- `app/api/reports/bias/route.ts` (new)
- `components/bias-audit-panel.tsx` (new)
- `app/(app)/dashboard/page.tsx` (add bias panel section)

---

## Task 5: Supabase Realtime Subscriptions

**Priority**: High
**Effort**: 2 hours
**Inspired by**: Resgrid — real-time status push eliminates stale dashboards

### Problem
The dashboard fetches data on page load but never updates. A coordinator doesn't see new cases or status changes until they refresh.

### What to do
1. **Realtime hook** `hooks/use-realtime.ts`:
   - Create a custom hook that subscribes to Supabase Realtime channels
   - Use `supabase.channel('cases').on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, callback)`
   - Same for `assignments` and `assessments` tables
   - Return a `lastEvent` state that components can react to
   - Use the **browser client** (`lib/supabase/client.ts`) for subscriptions

2. **Dashboard**: In `app/(app)/dashboard/page.tsx`, the server component fetches initial data. Wrap the client components in a `<RealtimeProvider>` or pass a refresh signal. When a realtime event fires, use `router.refresh()` to re-fetch server data.

3. **Case detail page**: Subscribe to changes on the specific case being viewed. Auto-update when assignment status changes.

4. **Supabase config**: Realtime must be enabled on the tables in Supabase dashboard (Project Settings → Database → Replication). Add a note in the README or `.env.local.example`.

### Important notes
- Supabase Realtime uses the **anon key** (browser client), not the service role key
- The `@supabase/supabase-js` v2.100.1 already includes realtime support
- Keep subscriptions in client components only (not server components)

### Files to modify
- `hooks/use-realtime.ts` (new)
- `app/(app)/dashboard/page.tsx` (add realtime refresh)
- `app/(app)/cases/[id]/client.tsx` (subscribe to case changes)
- `app/(app)/assignments/page.tsx` (subscribe to assignment changes)

---

## Task 6: Quick Templates for Intake

**Priority**: Medium
**Effort**: 1 hour
**Inspired by**: allReady / Resgrid — reduce data entry with pre-filled case types

### Problem
Field workers manually fill every field for recurring case types (food distribution, medical check, shelter request). This is slow and error-prone.

### What to do
1. **No new DB table needed** — store templates as a static config for the hackathon.

2. **Template config** `lib/case-templates.ts`:
   ```typescript
   export const caseTemplates = [
     {
       id: "medical_emergency",
       label: "Medical Emergency",
       defaults: {
         title: "Medical emergency: ",
         needs: [{ type: "medical_supplies" }],
         language: "hi",
       },
     },
     {
       id: "food_distribution",
       label: "Food / Ration Need",
       defaults: {
         title: "Food assistance needed: ",
         needs: [{ type: "food" }],
       },
     },
     {
       id: "shelter_request",
       label: "Shelter / Housing",
       defaults: { title: "Shelter needed: ", needs: [{ type: "shelter" }] },
     },
     {
       id: "elder_care",
       label: "Elder Care",
       defaults: {
         title: "Elder care needed: ",
         needs: [{ type: "elder_care" }],
       },
     },
     // ... more templates
   ];
   ```

3. **UI**: In `app/(app)/intake/page.tsx`, add a template dropdown/chips at the top of the form. When selected, pre-fill the form fields. User can still edit everything.

### Files to modify
- `lib/case-templates.ts` (new)
- `app/(app)/intake/page.tsx` (add template selector, pre-fill logic)

---

## Task 7: Incident / Campaign Grouping

**Priority**: High
**Effort**: Half day
**Inspired by**: allReady — group related cases under a parent incident

### Problem
A flood in Dharavi generates 40 cases but they're all flat in the queue. No way to see per-incident status, SLA, or resource allocation.

### What to do
1. **Migration** `supabase/migrations/005_incidents.sql`:
   ```sql
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
     target_cases integer, -- goal: serve N households (from allReady's campaign goals)
     org_id uuid references organizations(id) on delete set null,
     created_at timestamptz default now()
   );
   
   -- Add optional FK on cases
   alter table cases add column incident_id uuid references incidents(id) on delete set null;
   create index idx_cases_incident on cases(incident_id);
   
   alter table incidents enable row level security;
   create policy "Allow all for authenticated" on incidents for all using (true);
   ```

2. **API routes**:
   - `app/api/incidents/route.ts`: GET (list with case counts), POST (create)
   - `app/api/incidents/[id]/route.ts`: GET (detail with cases), PATCH (update status/target)

3. **UI**:
   - Add "Incidents" to sidebar nav in `components/app-sidebar.tsx`
   - New page `app/(app)/incidents/page.tsx` — list active incidents with case counts, progress toward target
   - New page `app/(app)/incidents/[id]/page.tsx` — incident detail showing grouped cases, per-incident KPIs
   - On intake form (`app/(app)/intake/page.tsx`), add optional incident dropdown to link new cases to an incident

4. **Dashboard**: On `app/(app)/dashboard/page.tsx`, add an "Active Incidents" summary card or section.

5. **Types**: Add `Incident` interface to `lib/supabase/types.ts`.

### Files to modify
- `supabase/migrations/005_incidents.sql` (new)
- `app/api/incidents/route.ts` (new)
- `app/api/incidents/[id]/route.ts` (new)
- `app/(app)/incidents/page.tsx` (new)
- `app/(app)/incidents/[id]/page.tsx` (new)
- `components/app-sidebar.tsx` (add nav item)
- `app/(app)/intake/page.tsx` (add incident selector)
- `app/(app)/dashboard/page.tsx` (add incidents summary)
- `lib/supabase/types.ts` (add Incident type)

---

## Task 8: SMS Intake via Twilio Webhook

**Priority**: High (demo wow-factor)
**Effort**: Half day
**Inspired by**: Ushahidi — in a crisis, people text, not fill web forms

### Problem
Sahaya only accepts cases via web form and CSV. Real crisis reporting happens via SMS. AI triage on raw SMS text is a powerful demo moment.

### What to do
1. **Migration** `supabase/migrations/006_messages.sql`:
   ```sql
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
   ```

2. **Add `'sms'` to case_source enum**:
   ```sql
   alter type case_source add value 'sms';
   ```

3. **Twilio webhook** `app/api/intake/sms/route.ts`:
   - Receives Twilio POST (form-urlencoded: `Body`, `From`, `To`, `MessageSid`)
   - Store raw message in `messages` table
   - Auto-create a case: title = first 80 chars of SMS body, description = full body, source_channel = 'sms', language = detect from body or default 'hi'
   - Link message to case via `promoted_case_id`
   - Auto-trigger triage agent on the new case (import and call `triageAgent.generate()`)
   - Return TwiML XML response: `<Response><Message>Thank you, your need has been registered. Case ID: {id}</Message></Response>`
   - Set response header: `Content-Type: text/xml`

4. **Message inbox UI** `app/(app)/messages/page.tsx`:
   - Show pending messages with sender, body preview, timestamp
   - "Promote to Case" button that prefills the intake form (or auto-creates)
   - "Dismiss" button for spam/irrelevant messages
   - Add "Messages" to sidebar nav

5. **Twilio setup note**: Add to `.env.local.example`:
   ```
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_PHONE_NUMBER=
   ```
   For demo: use Twilio trial account, configure webhook URL to `https://<your-vercel-url>/api/intake/sms`

### Files to modify
- `supabase/migrations/006_messages.sql` (new)
- `app/api/intake/sms/route.ts` (new)
- `app/(app)/messages/page.tsx` (new)
- `components/app-sidebar.tsx` (add Messages nav item)
- `.env.local.example` (add Twilio vars)
- `lib/supabase/types.ts` (add Message type, update CaseSource)

---

## Task 9: Volunteer Self-Service Portal

**Priority**: Medium-High
**Effort**: Half day
**Inspired by**: allReady — volunteers pull work, not just get pushed assignments

### Problem
Only coordinators can assign volunteers. Volunteers can't browse available cases matching their skills and express interest.

### What to do
1. **API route** `app/api/cases/available/route.ts`:
   - GET: Return cases with status `triaged` or `matched` (ready for assignment)
   - Accept query params: `language`, `skills`, `lat`, `lng`, `radiusKm`
   - Join with assessments to include priority_score
   - Sort by priority_score desc
   - Filter to cases matching volunteer's language and skill requirements from the `needs` jsonb

2. **API route** `app/api/cases/[id]/interest/route.ts`:
   - POST: Volunteer expresses interest in a case
   - Creates a pending assignment with `status: 'assigned'` and a `match_rationale: 'Volunteer self-selected'`
   - OR: Create a new `case_interests` table if you want coordinator approval before assignment
   - Log audit event

3. **UI page** `app/(app)/volunteer-hub/page.tsx`:
   - Filtered list of available cases (by language, skills, distance)
   - Each case shows: title, severity badge, location, distance from volunteer, required skills
   - "I Can Help" button that calls the interest endpoint
   - Only show cases the volunteer is qualified for (filter by matching skills/language)

4. **Sidebar**: Add "Find Cases" nav item pointing to `/volunteer-hub`

### Important
- Filter by AI match score if possible — don't show a medical case to a construction volunteer
- Coordinator still approves (the interest creates a pending state, not a confirmed assignment)

### Files to modify
- `app/api/cases/available/route.ts` (new)
- `app/api/cases/[id]/interest/route.ts` (new)
- `app/(app)/volunteer-hub/page.tsx` (new)
- `components/app-sidebar.tsx` (add nav item)

---

## Task 10: Real Geocoding (Replace Hardcoded Coords)

**Priority**: Medium-High
**Effort**: 2 hours
**Inspired by**: Ushahidi — arbitrary location support, not just 14 Mumbai neighborhoods

### Problem
`components/hotspot-map-inner.tsx` has a hardcoded `locationCoords` dictionary mapping 14 Mumbai neighborhood names to lat/lng. Cases with location labels not in this dictionary don't appear on the map. The intake form doesn't set `location` (PostGIS geography), only `location_label`.

### What to do
1. **Geocoding utility** `lib/geocode.ts`:
   ```typescript
   // Use Nominatim (free, no API key) for geocoding
   export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
     const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
     const res = await fetch(url, {
       headers: { "User-Agent": "Sahaya-Hackathon/1.0" }, // Nominatim requires User-Agent
     });
     const data = await res.json();
     if (data.length === 0) return null;
     return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lng) };
   }
   ```

2. **Update intake route** `app/api/intakes/route.ts`:
   - After creating the case, if `location_label` is provided but `location_coords` is not, call `geocode(location_label)`
   - If result found, update the case's `location` field: `ST_MakePoint(lng, lat)::geography`
   - Use Supabase RPC or raw SQL for the PostGIS update

3. **Update hotspot map** `components/hotspot-map-inner.tsx`:
   - Remove the hardcoded `locationCoords` dictionary
   - Read lat/lng directly from the case's `location` field (you'll need to include it in the query)
   - Cases without coordinates simply don't appear on the map (graceful degradation)

4. **Update dashboard query** in `app/(app)/dashboard/page.tsx`:
   - Add `location` to the select query on cases
   - Parse the PostGIS geography point into lat/lng for the map component

5. **Update triage agent** `lib/agents/triage.ts`:
   - In `getAreaStatistics` tool, if the case has coordinates, do a real proximity count using Supabase RPC with `ST_DWithin`
   - Create an RPC function in the migration: `get_nearby_case_count(lat, lng, radius_meters)` that uses PostGIS

### Files to modify
- `lib/geocode.ts` (new)
- `app/api/intakes/route.ts` (add geocoding call)
- `components/hotspot-map-inner.tsx` (remove hardcoded coords, use real location data)
- `app/(app)/dashboard/page.tsx` (include location in query)
- `lib/agents/triage.ts` (real geo-query in getAreaStatistics)
- `supabase/migrations/007_geo_rpc.sql` (new — RPC function for proximity query)

---

## Task 11: Google OAuth via Supabase Auth

**Priority**: Medium
**Effort**: 2 hours
**Inspired by**: allReady — Google login scores well at Google Solution Challenge

### Problem
No authentication. Anyone can access everything. For a Google hackathon, Google login is both practical and strategic.

### What to do
1. **Supabase setup** (manual, in Supabase dashboard):
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add Google OAuth client ID and secret (from Google Cloud Console)
   - Set redirect URL

2. **Auth utility** `lib/supabase/auth.ts`:
   ```typescript
   import { createBrowserClient } from "@/lib/supabase/client";
   
   export async function signInWithGoogle() {
     const supabase = createBrowserClient();
     return supabase.auth.signInWithOAuth({
       provider: "google",
       options: { redirectTo: `${window.location.origin}/dashboard` },
     });
   }
   
   export async function signOut() {
     const supabase = createBrowserClient();
     return supabase.auth.signOut();
   }
   
   export async function getSession() {
     const supabase = createBrowserClient();
     return supabase.auth.getSession();
   }
   ```

3. **Auth context** `components/auth-provider.tsx`:
   - Client component wrapping the app
   - Subscribes to `supabase.auth.onAuthStateChange`
   - Provides user info via React context

4. **Login page** `app/login/page.tsx`:
   - Simple page with "Sign in with Google" button
   - Redirect to `/dashboard` on success

5. **Middleware** `middleware.ts`:
   - Check for Supabase auth session
   - Redirect unauthenticated users to `/login`
   - Allow `/login` and `/api/intake/sms` (webhook) without auth

6. **Sidebar**: Show user name/avatar from Google profile in the sidebar header. Add sign-out button.

7. **Env vars**: Add to `.env.local.example`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```

### Files to modify
- `lib/supabase/auth.ts` (new)
- `components/auth-provider.tsx` (new)
- `app/login/page.tsx` (new)
- `middleware.ts` (new)
- `app/(app)/layout.tsx` (wrap with AuthProvider)
- `components/app-sidebar.tsx` (show user info + sign out)
- `.env.local.example` (add Google OAuth vars)

---

## Task 12: Configurable Dispatch Rules

**Priority**: Medium
**Effort**: Half day
**Inspired by**: Resgrid — dispatch behavior should be data-driven, not buried in LLM prompts

### Problem
SLA tiers (24h, 48h, 72h) and dispatch behavior (auto-dispatch vs escalate) are hardcoded in the dispatch agent's system prompt. Can't adjust without re-prompting AI. Not auditable.

### What to do
1. **Migration** `supabase/migrations/008_dispatch_rules.sql`:
   ```sql
   create table dispatch_rules (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     condition_min_severity smallint default 1,
     condition_max_severity smallint default 10,
     condition_min_priority numeric(5,2) default 0,
     sla_hours integer not null default 48,
     auto_escalate boolean not null default false, -- auto-escalate if no match found
     notify_channels text[] default '{}', -- future: 'email', 'sms', 'push'
     is_active boolean not null default true,
     created_at timestamptz default now()
   );
   
   alter table dispatch_rules enable row level security;
   create policy "Allow all for authenticated" on dispatch_rules for all using (true);
   ```

2. **Seed default rules** in `scripts/seed.ts`:
   ```
   - "Critical" (severity 9-10): SLA 12h, auto_escalate = true
   - "High" (severity 7-8): SLA 24h, auto_escalate = false
   - "Medium" (severity 4-6): SLA 48h
   - "Low" (severity 1-3): SLA 72h
   ```

3. **Dispatch agent update** (`lib/agents/dispatch.ts`):
   - Add a new tool `getDispatchRules(severity)` that queries the dispatch_rules table and returns the matching rule (SLA hours, auto_escalate flag)
   - Update agent instructions to call this tool first and use the returned SLA/escalation config
   - Remove hardcoded SLA values from the system prompt

4. **Admin UI** (optional stretch): `app/(app)/settings/dispatch-rules/page.tsx` — simple table editor for dispatch rules.

### Files to modify
- `supabase/migrations/008_dispatch_rules.sql` (new)
- `lib/agents/dispatch.ts` (add getDispatchRules tool, update instructions)
- `scripts/seed.ts` (seed default rules)
- `lib/supabase/types.ts` (add DispatchRule type)

---

## Task 13: Simplified Itinerary / Route Planning

**Priority**: Medium
**Effort**: Half day to 1 day
**Inspired by**: allReady — volunteers get a planned day of work, not isolated assignments

### Problem
Each volunteer gets individual assignments with no routing or grouping. If a volunteer has 3 cases in nearby areas, there's no way to bundle them into an efficient route.

### What to do
1. **Migration** `supabase/migrations/009_itineraries.sql`:
   ```sql
   create type itinerary_status as enum ('planned', 'in_progress', 'completed');
   
   create table itineraries (
     id uuid primary key default gen_random_uuid(),
     volunteer_id uuid not null references users(id) on delete cascade,
     name text, -- e.g. "Dharavi Route - Apr 5"
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
   ```

2. **API route** `app/api/itineraries/route.ts`:
   - `GET`: List itineraries for a volunteer (query param: `volunteer_id`, `date`)
   - `POST`: Create itinerary
     - Accept: `volunteer_id`, `assignment_ids[]`, `planned_date`
     - Fetch locations for all assignments (via their cases)
     - Order by nearest-neighbor (simple greedy algorithm: start from volunteer location, go to nearest unvisited case, repeat)
     - Compute total distance using haversine between consecutive stops
     - Estimate hours = total_distance / avg_speed_kmh + (num_stops * avg_time_per_stop)

3. **API route** `app/api/itineraries/[id]/route.ts`:
   - `GET`: Detail with populated assignment/case data
   - `PATCH`: Update status

4. **UI page** `app/(app)/itineraries/page.tsx`:
   - Show planned/in-progress itineraries for the logged-in volunteer
   - Display route on a mini React Leaflet map with numbered markers and polylines connecting them
   - Show estimated time and total distance

5. **Coordinator UI**: On the case detail page or assignments page, add a "Plan Route" button that selects multiple assignments for one volunteer and creates an itinerary.

6. **Map component**: Extend `components/hotspot-map-inner.tsx` or create a new `components/route-map.tsx` that renders a Leaflet Polyline between ordered points with numbered markers.

### Simplification for hackathon
- Use greedy nearest-neighbor instead of proper TSP solver
- No real-time tracking — just planned routes
- Distance estimates only (no actual driving directions)
- The `assignments` column stores ordered UUIDs (Postgres array) instead of a full join table

### Files to modify
- `supabase/migrations/009_itineraries.sql` (new)
- `app/api/itineraries/route.ts` (new)
- `app/api/itineraries/[id]/route.ts` (new)
- `app/(app)/itineraries/page.tsx` (new)
- `components/route-map.tsx` (new — Leaflet with polyline)
- `components/app-sidebar.tsx` (add Routes nav item)
- `lib/supabase/types.ts` (add Itinerary type)

---

## Dependency Order

```
Task 1  (Fix Priority Formula)     — no dependencies, do first
Task 2  (Case Notes)               — no dependencies
Task 3  (Volunteer Status)         — no dependencies
Task 4  (Bias Audit Panel)         — depends on Task 1 (new formula)
Task 5  (Supabase Realtime)        — no dependencies
Task 6  (Quick Templates)          — no dependencies
Task 7  (Incidents)                — no dependencies
Task 8  (SMS Intake)               — no dependencies, but runs after Task 10 (geocoding) for full value
Task 9  (Volunteer Self-Service)   — benefits from Task 3 (volunteer status)
Task 10 (Real Geocoding)           — no dependencies
Task 11 (Google OAuth)             — no dependencies, but affects all pages
Task 12 (Dispatch Rules)           — no dependencies
Task 13 (Itineraries)              — depends on Task 10 (geocoding for route distances)
```

## Suggested Execution Order
1. Task 1 → Task 4 (fix scoring, then build bias panel on top)
2. Task 2 + Task 3 + Task 6 (parallel — independent schema + UI changes)
3. Task 5 (realtime — enhances everything built so far)
4. Task 10 → Task 8 (geocoding first, then SMS intake benefits from it)
5. Task 7 (incidents — standalone feature)
6. Task 12 (dispatch rules — agent improvement)
7. Task 9 (volunteer self-service — benefits from Task 3)
8. Task 11 (auth — do last since it affects middleware/routing)
9. Task 13 (itineraries — most complex, do last)
