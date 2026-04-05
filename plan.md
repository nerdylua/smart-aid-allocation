# Community Need Intelligence Grid - Build Plan

## 0) Purpose
This file is the execution blueprint for building our hackathon project from `idea.md`.

It answers:
- What we are building now (concrete MVP scope)
- How we will build it (architecture + sequencing)
- How we will prove value (metrics + demo)
- How future agents should continue work consistently

---

## 1) Project Context
### Problem
NGO/community need data is scattered across forms, chats, helplines, and field notes. This causes duplicate records, delayed prioritization, and poor closure visibility.

### Strategy We Selected
Primary: Concept 1 (Community Need Intelligence Grid)
Plus selected modules from:
- Concept 2 (Volunteer Dispatch and Reliability Engine)
- Concept 3 (Social Impact Control Tower)

### Hackathon Goal
Deliver a working end-to-end system:
`intake -> normalize -> triage -> match -> dispatch -> close -> measure impact`

---

## 2) Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Full-stack framework | Next.js 16 (App Router + API Routes) | SSR, server actions, single deployment |
| UI | Tailwind CSS + shadcn/ui | Fast, consistent, accessible components |
| Database + Auth + Realtime + Storage | Supabase (PostgreSQL) | Zero-config auth, realtime dashboard, RLS multi-org, file storage |
| AI Model | OpenAI GPT-5.4-mini | Fast, cheap, strong tool calling + reasoning |
| Agent Framework | Vercel AI SDK (ai + @ai-sdk/openai) | ToolLoopAgent, native Next.js integration, structured outputs, streaming |
| Maps | React Leaflet + OpenStreetMap | Free, no API key for demo, React-native component model |
| Deployment | Vercel (frontend + API) | Free tier, instant deploys |
| Language | TypeScript (100%) | Single language across entire stack |

### ADR Log
- `ADR-001` Architecture: Next.js monolith (API routes + frontend in one app).
- `ADR-002` Decision mode: AI assistive, human-approved for critical actions. Severity 9-10 auto-escalates via dispatch rules.
- `ADR-003` Data boundary: canonical case schema + channel adapters (form, CSV, email), HSDS-compatible.
- `ADR-004` Reliability: Supabase Realtime for subscriptions, simple async for background work.
- `ADR-005` Observability: audit_events table + case_notes timeline — every action logged.
- `ADR-006` Agent framework: Vercel AI SDK (ToolLoopAgent + tool()) for triage, matching, dispatch.
- `ADR-007` Auth: Google OAuth via Supabase Auth. Route protection via proxy.ts (cookie check) + Server Layout Guard (session verification). Follows Next.js 16 proxy pattern.
- `ADR-008` Geocoding: Nominatim (free, no API key). PostGIS `geography(Point, 4326)` for storage. WKB hex parsing on client for map rendering.
- `ADR-009` Priority formula: Confidence decoupled from ranking. `priority_score = severity*0.45 + vulnerability*0.35 + freshness*10*0.20`. Confidence used for flagging only.
- `ADR-010` Dispatch rules: Data-driven SLA tiers stored in `dispatch_rules` table. Agent queries rules by severity, not hardcoded.

---

## 3) Scope Lock (MVP vs Stretch)
### Must-Have MVP (all delivered)
1. Unified case intake via manual form + CSV import.
2. Case normalization and duplicate detection (AI-assisted).
3. Priority scoring: severity, vulnerability, freshness (confidence decoupled — used for flagging only).
4. Volunteer matching by skill, language, distance, availability (staffing + action status).
5. Assignment workflow: assigned -> accepted/rejected -> in-progress -> completed -> closed.
6. Human review gate for high-risk or low-confidence cases.
7. Closure verification with proof notes/media.
8. Command dashboard: case queue, hotspot map, assignment state, closure metrics.
9. Audit trail of key decisions/actions.
10. Multilingual support for at least 2 demo languages.

### Beyond MVP (delivered)
1. Email intake via Resend — auto-creates cases, triggers AI triage, sends confirmation email.
2. Case activity timeline — chronological notes auto-logged on every status change.
3. Volunteer status dimensions — staffing (available/on_shift/delayed/committed/unavailable) + action (idle/responding/on_scene/returning).
4. Bias audit panel — disparity analysis by region, language, and need type.
5. Supabase Realtime subscriptions — dashboard and case detail auto-refresh on changes.
6. Quick intake templates — 7 pre-filled case types for fast field entry.
7. Incident/campaign grouping — group cases under a parent incident with progress tracking.
8. Volunteer self-service portal — browse available cases, express interest.
9. Real geocoding via Nominatim — intake auto-geocodes, map reads PostGIS coordinates.
10. Google OAuth via Supabase Auth — login page, auth provider, proxy-based route protection.
11. Configurable dispatch rules — data-driven SLA tiers and auto-escalation policy.
12. Itinerary/route planning — bundle assignments into ordered routes with distance estimates.

### Out of Scope
1. Deep enterprise integrations.
2. Full production identity verification.
3. Fully autonomous dispatch without human override.
4. Complex legal/compliance automation.

---

## 4) User Personas and Core Journeys
### Field Worker
1. Capture need via form (with quick templates) or email.
2. Track case state updates (realtime).
3. Add follow-up notes to the case timeline.
4. Link cases to active incidents.

### NGO Coordinator
1. Review prioritized queue (realtime updates).
2. Check explainable score + confidence + bias metrics.
3. Approve or adjust volunteer match.
4. Escalate risky cases (auto-escalation for severity 9-10).
5. Drive case to closure.
6. Manage incidents and group related cases.
7. Plan volunteer routes/itineraries.

### Volunteer
1. Browse available cases matching skills/language (self-service hub).
2. Express interest or receive assignment.
3. Accept/decline.
4. Update progress.
5. Submit completion proof.
6. View planned itineraries/routes.

### Command Center
1. View demand hotspots on map (real geocoded coordinates).
2. Monitor SLA and backlog.
3. Track closure and unmet demand.
4. Review bias audit panel for equity.
5. Manage active incidents.
6. Configure dispatch rules (SLA tiers, auto-escalation).

---

## 5) Architecture

```
Next.js 16 App (Vercel)
├── proxy.ts              — Route-level proxy (auth cookie check, public path bypass)
├── /app (pages + layouts)
│   ├── /login            — Google OAuth login page
│   ├── /(app)/layout.tsx — Server Layout Guard (session verification)
│   ├── /dashboard        — Command center: KPIs, hotspot map, case queue, bias panel, incidents
│   ├── /cases            — Case queue + detail with activity timeline
│   ├── /intake           — Field worker intake form with templates + incident linking
│   ├── /assignments      — Volunteer assignment portal
│   ├── /volunteers       — Volunteer list with staffing/action badges
│   ├── /messages         — Email message inbox (promote/dismiss)
│   ├── /incidents        — Incident list + detail with grouped cases
│   ├── /volunteer-hub    — Self-service case finder for volunteers
│   └── /itineraries      — Route planner with map visualization
├── /app/api (API routes — 24 endpoints)
│   ├── /intakes          — POST intake (with geocoding), POST batch
│   ├── /intake/email     — POST email intake (auto-creates case + triggers triage + Resend confirmation)
│   ├── /cases            — GET list, GET detail, PATCH update
│   ├── /cases/[id]/notes — GET/POST case activity notes
│   ├── /cases/[id]/interest — POST volunteer self-selection
│   ├── /cases/available  — GET cases ready for volunteer pickup
│   ├── /assess           — POST trigger triage agent
│   ├── /match            — POST trigger matching agent
│   ├── /assignments      — POST create (dispatch agent, severity-aware SLA)
│   ├── /assignments/[id] — PATCH status update (auto-logs notes)
│   ├── /verify           — POST closure verification (auto-closes case)
│   ├── /volunteers       — GET list, PATCH availability + staffing/action
│   ├── /incidents        — GET list (with counts), POST create
│   ├── /incidents/[id]   — GET detail (with cases), PATCH update
│   ├── /messages         — GET list, PATCH status
│   ├── /messages/[id]/promote — POST promote message to case
│   ├── /itineraries      — GET list, POST create (nearest-neighbor routing)
│   ├── /itineraries/[id] — GET detail (with stops), PATCH status
│   ├── /reports          — GET operational KPIs
│   └── /reports/bias     — GET bias/disparity analysis
├── /lib
│   ├── /agents
│   │   ├── triage.ts     — Triage Agent (score + explain + flag + PostGIS proximity)
│   │   ├── matching.ts   — Matching Agent (staffing/action-aware, haversine distance)
│   │   └── dispatch.ts   — Dispatch Agent (data-driven SLA via dispatch_rules table)
│   ├── /supabase
│   │   ├── server.ts     — Service role client (bypasses RLS)
│   │   ├── client.ts     — Browser client (publishable key, respects RLS)
│   │   ├── auth.ts       — Google OAuth helpers (signIn, signOut, getSession)
│   │   └── types.ts      — Full TypeScript interfaces for all 13 tables
│   ├── geocode.ts        — Nominatim geocoding utility
│   └── case-templates.ts — 7 quick-fill intake templates
├── /hooks
│   └── use-realtime.ts   — Supabase Realtime subscription hooks
├── /components
│   ├── app-sidebar.tsx   — Navigation (9 sections) + user info + sign out
│   ├── auth-provider.tsx — React context for auth state
│   ├── bias-audit-panel.tsx — Disparity analysis UI
│   ├── realtime-refresh.tsx — Realtime wrapper component
│   ├── hotspot-map.tsx   — Map with PostGIS WKB parsing + fallback coords
│   ├── route-map.tsx     — Itinerary polyline map
│   ├── kpi-cards.tsx     — Dashboard KPI cards
│   └── case-queue.tsx    — Priority-sorted case list
└── /supabase
    └── /migrations       — 9 SQL migration files (001–009)
```

### Data Flow
1. Field worker submits intake (form/CSV/email) -> API route -> Supabase insert -> geocode location -> case created
2. API triggers Triage Agent -> scores case -> stores assessment -> auto-flags vulnerability >= 9 via DB trigger
3. Coordinator reviews queue (realtime via Supabase subscriptions) + bias audit panel
4. Coordinator requests match -> Matching Agent -> ranked volunteers (filtered by staffing=available/on_shift, action=idle)
5. Coordinator approves -> Dispatch Agent -> fetches dispatch_rules for severity-based SLA -> assignment created (or auto-escalated for critical cases)
6. Volunteer accepts -> updates progress -> submits proof (each transition auto-logged as case note)
7. Closure verification -> case + assignment closed -> metrics updated
8. Dashboard shows KPIs via realtime subscriptions; incidents group related cases

---

## 6) Data Model (13 tables)

### organizations
id, name, type, settings (jsonb), created_at

### users
id, org_id (FK), role (enum: admin/coordinator/field_worker/volunteer), email, name, language, skills (text[]), location (geography point), availability (jsonb), **staffing** (enum: available/on_shift/delayed/committed/unavailable), **action** (enum: idle/responding/on_scene/returning), **status_updated_at**, created_at

### cases
id, org_id (FK), source_channel (enum: form/csv/api/helpline/sms/**email**), title, description, location (geography point), location_label (text), needs (jsonb), person_info (jsonb), status (enum: new/triaged/matched/assigned/in_progress/completed/closed), language, created_by (FK users), **incident_id** (FK incidents nullable), created_at, updated_at

### assessments
id, case_id (FK), severity (1-10), vulnerability (1-10), confidence (0-1), freshness (0-1), **priority_score** (generated: severity*0.45 + vulnerability*0.35 + freshness*10*0.20), rationale (text), is_flagged (bool), flagged_reason (text), reviewed_by (FK users nullable), reviewed_at, created_at
- DB trigger: auto-flags when vulnerability >= 9

### assignments
id, case_id (FK), volunteer_id (FK users), status (enum: assigned/accepted/rejected/in_progress/completed/closed), match_rationale (text), match_score (float), sla_deadline (timestamptz), accepted_at, completed_at, created_at

### verifications
id, assignment_id (FK), proof_notes (text), proof_media_url (text), verified_by (FK users), outcome (enum: confirmed/partial/failed), created_at

### feedback
id, case_id (FK), assignment_id (FK nullable), rating (1-5), comments (text), submitted_by (FK users), created_at

### audit_events
id, entity_type (text), entity_id (uuid), action (text), actor_id (FK users nullable), metadata (jsonb), created_at

### case_notes (new — Task 2)
id, case_id (FK), author_id (FK users nullable), author_name (text), content (text), note_type (enum: comment/status_change/system/escalation), created_at

### incidents (new — Task 7)
id, name, type, description, status (enum: active/monitoring/resolved/closed), location_label, location (geography point), started_at, resolved_at, target_cases, org_id (FK), created_at

### messages (new — Task 8)
id, channel (text), sender (text), body (text), status (enum: pending/promoted/dismissed), promoted_case_id (FK cases nullable), metadata (jsonb), created_at

### dispatch_rules (new — Task 12)
id, name, condition_min_severity, condition_max_severity, condition_min_priority, sla_hours, auto_escalate (bool), notify_channels (text[]), is_active (bool), created_at

### itineraries (new — Task 13)
id, volunteer_id (FK users), name, status (enum: planned/in_progress/completed), planned_date (date), assignments (uuid[]), total_distance_km, estimated_hours, created_at

### RPC functions
- `get_nearby_case_count(lat, lng, radius_meters)` — PostGIS proximity query for triage agent

---

## 7) Agent Design (Vercel AI SDK - ToolLoopAgent)

### Triage Agent
- Instructions: Humanitarian case triage specialist. Score severity, vulnerability, confidence, freshness. Explain reasoning. Flag uncertain or critical cases for human review.
- Tools:
  - `getCaseDetails(caseId)` — fetch case from Supabase
  - `getAreaStatistics(lat, lng, radiusKm)` — real PostGIS proximity query via `get_nearby_case_count` RPC, with fallback to total open case count
  - `checkDuplicates(caseId)` — fuzzy match title + location + person_info
  - `saveAssessment(caseId, scores, rationale, isFlagged)` — write to assessments table
- Gate: if confidence < 0.6 OR severity >= 9 OR vulnerability >= 9 -> is_flagged = true, requires human review
- Priority formula: `severity * 0.45 + vulnerability * 0.35 + freshness * 10 * 0.20` (confidence decoupled)

### Matching Agent
- Tools:
  - `getAvailableVolunteers(skills, language)` — filters by `staffing in ('available', 'on_shift')` and `action = 'idle'`; client-side skill overlap scoring
  - `computeDistance(fromLat, fromLng, toLat, toLng)` — haversine km
  - `checkExistingAssignments(volunteerId)` — prevent overloading
- Output: top 3 ranked volunteers with match rationale, skills_matched, distance, language_match

### Dispatch Agent
- Tools:
  - `getDispatchRules(severity)` — queries dispatch_rules table for SLA hours and auto-escalate policy; fallback defaults if no rule found
  - `createAssignment(caseId, volunteerId, slaHours, rationale)` — insert assignment
  - `updateCaseStatus(caseId, status)` — transition case state
  - `escalateCase(caseId, reason)` — flag for coordinator re-route
  - `logAuditEvent(entityType, entityId, action, metadata)` — record audit trail
- The API route pre-fetches case severity from assessments and passes it in the prompt to ensure correct SLA lookup
- Output: assignment confirmation or escalation

---

## 8) NGO Data Strategy

### Layer 1: Seed Data Generator (demo)
Script generates realistic synthetic data:
- 3-5 NGOs (medical relief, food bank, disaster response, education, women's shelter)
- 20+ volunteers with varied skills, languages, geo-coordinates (Mumbai area)
- 50+ cases across diverse needs and pipeline stages
- Pre-computed assessments and assignments for a "living" dashboard

### Layer 2: Multi-Channel Intake (live demo)
- Manual form submission by field worker (with quick templates and incident linking)
- CSV batch import from partner NGO spreadsheet
- Email intake via Resend (auto-geocodes, auto-triages, sends confirmation)

### Layer 3: Open Data Adapters (scale story for judges)
- HDX Humanitarian API (population displacement, needs assessments)
- India Open Government Data (disaster records)
- Open Referral HSDS schema compatibility
- Pitch: "Integrates with OCHA HDX and Open Referral standard"

---

## 9) API Surface (24 endpoints)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/intakes | Create single case intake (with auto-geocoding) |
| POST | /api/intakes/batch | CSV batch import |
| POST | /api/intake/email | Email intake via Resend (auto-creates case + triggers triage) |
| GET | /api/cases | List cases (filtered by status, priority, org) |
| GET | /api/cases/[id] | Case detail with assessments + assignments |
| PATCH | /api/cases/[id] | Update case fields/status |
| GET | /api/cases/[id]/notes | Case activity timeline |
| POST | /api/cases/[id]/notes | Add note/comment to case |
| POST | /api/cases/[id]/interest | Volunteer expresses interest in a case |
| GET | /api/cases/available | Available cases for volunteer self-service |
| POST | /api/assess | Trigger triage agent for a case |
| POST | /api/match | Trigger matching agent for a case |
| POST | /api/assignments | Create assignment (dispatch agent with severity-aware SLA) |
| PATCH | /api/assignments/[id] | Update assignment status (auto-logs case notes) |
| POST | /api/verify | Submit closure verification (auto-closes case) |
| GET | /api/volunteers | List volunteers (with staffing/action status) |
| PATCH | /api/volunteers/[id] | Update availability, staffing, action |
| GET | /api/incidents | List incidents with case counts |
| POST | /api/incidents | Create incident |
| GET | /api/incidents/[id] | Incident detail with grouped cases |
| PATCH | /api/incidents/[id] | Update incident status/target |
| GET | /api/messages | List email messages |
| PATCH | /api/messages/[id] | Update message status (dismiss) |
| POST | /api/messages/[id]/promote | Promote message to case |
| GET | /api/itineraries | List itineraries for a volunteer |
| POST | /api/itineraries | Create itinerary (nearest-neighbor routing) |
| GET | /api/itineraries/[id] | Itinerary detail with populated stops |
| PATCH | /api/itineraries/[id] | Update itinerary status |
| GET | /api/reports | Operational KPI metrics |
| GET | /api/reports/bias | Bias/disparity analysis by region, language, need type |

---

## 10) Execution Phases

| Phase | What | Deliverable | Verify |
|-------|------|------------|--------|
| 1 | Next.js scaffold + Supabase schema + seed data | Bootable app with populated DB | `npm run dev` works, seed data visible in Supabase |
| 2 | Agent layer (triage + match + dispatch) | AI intelligence endpoints working | POST /api/assess returns scored assessment with rationale |
| 3 | Dashboard UI (case queue + hotspot map + KPIs) | Visual proof of intelligence | Cases render sorted by priority, map shows pins |
| 4 | Workflow UI (intake form + coordinator review + volunteer portal) | Complete user loop | Can submit case -> triage -> match -> assign -> complete |
| 5 | Audit trail + verification + CSV import | Accountability + data onboarding | Audit events logged, CSV creates cases |
| 6 | Polish + demo rehearsal | Ship-ready | Demo script runs < 5 min, twice consecutively |

---

## 11) Demo Plan (3 min, judge-facing)

### Story
1. Open: Dashboard shows live backlog with hotspot map (geocoded pins), active incidents, bias audit panel.
2. Email Intake: A crisis email arrives — auto-creates case, auto-geocodes location, triggers AI triage.
3. AI Triage: System scores severity 8/10, vulnerability 9/10, flags for coordinator review. Rationale cites specific case details. Case note auto-logged.
4. Duplicate check: AI checks nearby cases — "different household, not duplicate" (explains why).
5. AI Match: Volunteers filtered by staffing=available, action=idle. Top candidate: speaks the language, has medical skills, 7km away.
6. Dispatch: Agent fetches dispatch rule (severity 8 → 24h SLA). Coordinator approves → assignment created.
7. Timeline: Every step auto-logged — triage, assignment, acceptance, progress, completion.
8. Volunteer completes → submits proof → closure verification → case closed. Dashboard updates realtime.
9. Bias check: Show disparity ratios by region and language — "Our AI triage flags cases at similar rates across groups."
10. Key line: "We're not a volunteer listing app — we're a need-to-response intelligence layer with equity built in."

### Proof Points
1. Confidence-aware triage with decoupled priority formula — uncertain severe cases escalated, not buried
2. Explainable AI decisions with human-in-the-loop gates and configurable dispatch rules
3. Closed-loop accountability: every decision audited, every status change timestamped
4. Equity: bias audit panel quantifies disparity across regions, languages, and need types
5. Multi-channel intake: web form, CSV batch, email — all feed the same intelligence pipeline

---

## 12) UN SDG Alignment
- SDG 1 (No Poverty) — routing aid to most vulnerable
- SDG 3 (Good Health) — medical need prioritization
- SDG 10 (Reduced Inequalities) — vulnerability-aware scoring prevents bias
- SDG 11 (Sustainable Cities) — hotspot detection for urban response
- SDG 17 (Partnerships) — multi-org data sharing design

---

## 13) Judging Criteria Mapping

| Criteria | How We Score |
|----------|-------------|
| UN SDG alignment (5pts) | 5 SDGs with clear feature mapping + bias audit directly addresses SDG 10 |
| User feedback + iteration (5pts) | Document 3 feedback rounds with NGO patterns |
| Impact + metrics (5pts) | Live KPI dashboard, bias disparity metrics, incident progress tracking |
| Innovation | Confidence-decoupled priority, explainable AI, data-driven dispatch rules, bias audit panel, email-to-triage pipeline |
| Technical depth | 3 AI agents (ToolLoopAgent + tool calling), PostGIS geocoding, Supabase Realtime, 13-table schema with 9 migrations |
| Scalability | Multi-org by design, configurable dispatch rules, incident grouping, multi-channel intake |

---

## 14) KPI Targets
1. 90%+ seeded cases complete end-to-end.
2. 100% flagged cases follow escalation policy (severity >= 9 auto-escalated via dispatch rules).
3. Obvious seeded duplicates detected.
4. Dashboard counts reconcile with audit events.
5. Bias disparity ratios computed and visible for all demographic groups.
6. Email intake auto-creates cases and triggers triage within one request cycle.
7. Every status transition produces an audit event and a case note.

---

## 15) Risk Register

| Risk | Mitigation | Contingency |
|------|-----------|-------------|
| Scope creep | Scope freeze (Section 3) | Cut to single intake + single dispatch |
| Weak AI output | GPT-5.4-mini with structured outputs + tool calling | Rule-based fallback scoring |
| Demo failure | Scripted seed flow + backups | Offline screenshots/video |
| Supabase limits | Free tier is generous for demo scale | Local PostgreSQL fallback |
| Agent latency | GPT-5.4-mini is fast + cheap | Pre-compute assessments for seed data |

---

## 16) Non-Negotiables
1. Preserve end-to-end chain: intake -> triage -> dispatch -> closure -> proof.
2. Human review for sensitive/low-confidence cases. Never auto-dispatch critical.
3. Every AI decision must be explainable and auditable.
4. Small, reversible changes. No unrelated refactors.
5. Seed data always available so demo is never broken.
