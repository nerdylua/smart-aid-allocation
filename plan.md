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
- `ADR-002` Decision mode: AI assistive, human-approved for critical actions.
- `ADR-003` Data boundary: canonical case schema + channel adapters, HSDS-compatible.
- `ADR-004` Reliability: Supabase Realtime for subscriptions, simple async for background work.
- `ADR-005` Observability: audit_events table is a mandatory feature, not optional.
- `ADR-006` Agent framework: Vercel AI SDK (ToolLoopAgent + tool()) for triage, matching, dispatch.

---

## 3) Scope Lock (MVP vs Stretch)
### Must-Have MVP
1. Unified case intake via manual form + CSV import.
2. Case normalization and duplicate detection (AI-assisted).
3. Priority scoring: severity, vulnerability, confidence, freshness.
4. Volunteer matching by skill, language, distance, availability.
5. Assignment workflow: assigned -> accepted/rejected -> in-progress -> completed -> closed.
6. Human review gate for high-risk or low-confidence cases.
7. Closure verification with proof notes/media.
8. Command dashboard: case queue, hotspot map, assignment state, closure metrics.
9. Audit trail of key decisions/actions.
10. Multilingual support for at least 2 demo languages.

### Stretch (only if MVP is stable)
1. OCR/voice-note assisted intake.
2. Travel-time-aware matching.
3. Hotspot forecasting.
4. Volunteer reliability score.
5. Cross-org data sharing adapter.
6. SMS/WhatsApp notification integration.

### Out of Scope
1. Deep enterprise integrations.
2. Full production identity verification.
3. Fully autonomous dispatch without human override.
4. Complex legal/compliance automation.

---

## 4) User Personas and Core Journeys
### Field Worker
1. Capture need via form.
2. Track case state updates.
3. Add follow-up notes.

### NGO Coordinator
1. Review prioritized queue.
2. Check explainable score + confidence.
3. Approve or adjust volunteer match.
4. Escalate risky cases.
5. Drive case to closure.

### Volunteer
1. Receive assignment.
2. Accept/decline.
3. Update progress.
4. Submit completion proof.

### Command Center
1. View demand hotspots on map.
2. Monitor SLA and backlog.
3. Track closure and unmet demand.
4. Trigger reallocation.

---

## 5) Architecture

```
Next.js 16 App (Vercel)
├── /app (pages + layouts)
│   ├── /dashboard      — Command center view
│   ├── /cases          — Case queue + detail
│   ├── /intake         — Field worker intake form
│   ├── /assignments    — Volunteer assignment portal
│   └── /reports        — KPI dashboard
├── /app/api (API routes)
│   ├── /intakes        — POST intake, POST batch
│   ├── /cases          — GET list, GET detail, PATCH update
│   ├── /assess         — POST trigger triage agent
│   ├── /match          — POST trigger matching agent
│   ├── /assignments    — POST create, PATCH status update
│   ├── /verify         — POST closure verification
│   ├── /volunteers     — GET list, PATCH availability
│   └── /reports        — GET ops metrics
├── /lib
│   ├── /agents         — Vercel AI SDK ToolLoopAgent definitions
│   │   ├── triage.ts   — Triage Agent (score + explain + flag)
│   │   ├── matching.ts — Matching Agent (rank volunteers)
│   │   └── dispatch.ts — Dispatch Agent (assign + notify)
│   ├── /tools          — Agent tool definitions
│   ├── /supabase       — Supabase client + helpers
│   └── /utils          — Shared utilities
└── /supabase
    └── /migrations     — SQL migration files
```

### Data Flow
1. Field worker submits intake -> API route -> Supabase insert -> case created
2. API triggers Triage Agent -> scores case -> stores assessment
3. Coordinator reviews queue (realtime via Supabase subscriptions)
4. Coordinator requests match -> Matching Agent -> ranked volunteers returned
5. Coordinator approves -> Dispatch Agent -> assignment created + volunteer notified
6. Volunteer accepts -> updates progress -> submits proof
7. Closure verification -> case closed -> metrics updated
8. Dashboard shows KPIs via realtime subscriptions

---

## 6) Data Model (8 tables)

### organizations
id, name, type, settings (jsonb), created_at

### users
id, org_id (FK), role (enum: admin/coordinator/field_worker/volunteer), email, name, language, skills (text[]), location (geography point), availability (jsonb), created_at

### cases
id, org_id (FK), source_channel (enum: form/csv/api/helpline), title, description, location (geography point), location_label (text), needs (jsonb), person_info (jsonb), status (enum: new/triaged/matched/assigned/in_progress/completed/closed), language, created_by (FK users), created_at, updated_at

### assessments
id, case_id (FK), severity (1-10), vulnerability (1-10), confidence (0-1), freshness (0-1), priority_score (computed), rationale (text), is_flagged (bool), flagged_reason (text), reviewed_by (FK users nullable), reviewed_at, created_at

### assignments
id, case_id (FK), volunteer_id (FK users), status (enum: assigned/accepted/rejected/in_progress/completed/closed), match_rationale (text), match_score (float), sla_deadline (timestamptz), accepted_at, completed_at, created_at

### verifications
id, assignment_id (FK), proof_notes (text), proof_media_url (text), verified_by (FK users), outcome (enum: confirmed/partial/failed), created_at

### feedback
id, case_id (FK), assignment_id (FK nullable), rating (1-5), comments (text), submitted_by (FK users), created_at

### audit_events
id, entity_type (text), entity_id (uuid), action (text), actor_id (FK users nullable), metadata (jsonb), created_at

---

## 7) Agent Design (Vercel AI SDK - ToolLoopAgent)

### Triage Agent
- Instructions: Humanitarian case triage specialist. Score severity, vulnerability, confidence, freshness. Explain reasoning. Flag uncertain or critical cases for human review.
- Tools:
  - `getCaseDetails(caseId)` — fetch case from Supabase
  - `getAreaStatistics(lat, lng, radiusKm)` — count nearby open cases
  - `checkDuplicates(caseId)` — fuzzy match title + location + person_info
  - `saveAssessment(caseId, scores, rationale, isFlagged)` — write to assessments table
- Gate: if confidence < 0.6 OR severity >= 9 -> is_flagged = true, requires human review

### Matching Agent
- Tools:
  - `getAvailableVolunteers(skills, language, lat, lng, radiusKm)` — filtered query
  - `computeDistance(fromLat, fromLng, toLat, toLng)` — haversine km
  - `rankCandidates(candidates, caseNeeds)` — weighted scoring
- Output: top 3 ranked volunteers with match rationale

### Dispatch Agent
- Tools:
  - `createAssignment(caseId, volunteerId, slaHours, rationale)` — insert assignment
  - `updateCaseStatus(caseId, status)` — transition case state
  - `escalateCase(caseId, reason)` — flag for coordinator re-route
- Output: assignment confirmation or escalation

---

## 8) NGO Data Strategy

### Layer 1: Seed Data Generator (demo)
Script generates realistic synthetic data:
- 3-5 NGOs (medical relief, food bank, disaster response, education, women's shelter)
- 20+ volunteers with varied skills, languages, geo-coordinates (Mumbai area)
- 50+ cases across diverse needs and pipeline stages
- Pre-computed assessments and assignments for a "living" dashboard

### Layer 2: CSV/Form Intake (live demo)
- Manual form submission by field worker
- CSV batch import from partner NGO spreadsheet

### Layer 3: Open Data Adapters (scale story for judges)
- HDX Humanitarian API (population displacement, needs assessments)
- India Open Government Data (disaster records)
- Open Referral HSDS schema compatibility
- Pitch: "Integrates with OCHA HDX and Open Referral standard"

---

## 9) API Surface (MVP)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/intakes | Create single case intake |
| POST | /api/intakes/batch | CSV batch import |
| GET | /api/cases | List cases (filtered by status, priority, org) |
| GET | /api/cases/[id] | Case detail with assessments + assignments |
| PATCH | /api/cases/[id] | Update case fields/status |
| POST | /api/assess | Trigger triage agent for a case |
| POST | /api/match | Trigger matching agent for a case |
| POST | /api/assignments | Create assignment (dispatch agent) |
| PATCH | /api/assignments/[id] | Update assignment status |
| POST | /api/verify | Submit closure verification |
| GET | /api/volunteers | List volunteers (filtered) |
| PATCH | /api/volunteers/[id] | Update availability |
| GET | /api/reports/ops | Operational KPI metrics |

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
1. Open: Dashboard shows live backlog (47 cases, 3 hotspots, 12 volunteers available)
2. Create: Field worker submits case — family in flood-affected area needs medical + food
3. AI Triage: System scores severity 9/10, vulnerability 8/10, confidence 0.85 -> priority #2. Rationale shown.
4. Duplicate check: "Similar case detected — different household, not duplicate" (AI explains)
5. AI Match: Top 3 volunteers ranked — #1 speaks family's language, has medical training, is 2km away
6. Coordinator approves -> assignment dispatched
7. Volunteer completes -> submits proof photo + notes
8. Close: Dashboard metrics update realtime — median response: 2.4h, closure rate: 89%
9. Key line: "We're not a volunteer listing app — we're a need-to-response intelligence layer."

### Proof Points
1. Confidence-aware triage, not just severity sorting
2. Explainable AI decisions with human-in-the-loop gates
3. Closed-loop accountability with measurable outcomes

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
| UN SDG alignment (5pts) | 5 SDGs with clear feature mapping |
| User feedback + iteration (5pts) | Document 3 feedback rounds with NGO patterns |
| Impact + metrics (5pts) | Live KPI dashboard: response time, closure rate, unmet demand |
| Innovation | Confidence-aware triage, explainable AI, human-in-loop gates |
| Technical depth | Vercel AI SDK ToolLoopAgent with tool calling, Supabase realtime, RLS multi-tenancy |
| Scalability | Multi-org by design, Supabase scales horizontally |

---

## 14) KPI Targets
1. 90%+ seeded cases complete end-to-end.
2. 100% flagged cases follow escalation policy.
3. Obvious seeded duplicates detected.
4. Dashboard counts reconcile with audit events.

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
