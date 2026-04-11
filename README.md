# Sahaya: Community Need Intelligence Grid

Sahaya is an AI-assisted coordination platform for community aid operations. It unifies intake from multiple channels, prioritizes cases with triage scoring, matches volunteers, dispatches with SLA rules, and tracks closure with verification and audit trails.

## What It Does

- Ingests needs from form, CSV, email, and message promotion flows.
- Prioritizes and routes cases with AI triage, matching, and dispatch.
- Tracks assignments, incidents, notes, itineraries, and closure verification.
- Surfaces equity metrics through bias/disparity reporting.

## Tech Stack

- Framework: Next.js 16 (App Router + Route Handlers)
- Language: TypeScript + React 19
- Database: Supabase Postgres + PostGIS
- Auth: Supabase Auth (Google OAuth + email/password client flow)
- AI: Vercel AI SDK `ToolLoopAgent` + OpenAI model provider
- UI: Tailwind CSS v4 + shadcn/ui
- Maps: Leaflet / React Leaflet + OpenStreetMap + Nominatim geocoding

## Architecture Flow

```text
intake (form/csv/email/messages)
	-> geocode + normalize
	-> triage agent (severity, vulnerability, confidence, freshness)
	-> match agent (skills, language, distance, load)
	-> dispatch agent (SLA rules, assignment/escalation)
	-> volunteer execution
	-> verification
	-> case closure + audit + notes
```

## Product Areas (UI)

- `/dashboard`: KPIs, queue, maps, incident snapshots.
- `/cases` and `/cases/[id]`: case listing and detailed operations.
- `/intake`: manual intake and batch creation.
- `/assignments`, `/volunteers`, `/messages`: day-to-day operations.
- `/incidents` and `/incidents/[id]`: incident grouping and progress.
- `/volunteer-hub` and `/itineraries`: self-service and route planning.
- `/login`: branded sign-in (Google + email/password form).

## API Surface (Route Handlers)

### Cases

- `GET /api/cases`
- `GET /api/cases/[id]`
- `PATCH /api/cases/[id]`
- `GET /api/cases/available`
- `POST /api/cases/[id]/interest`
- `GET /api/cases/[id]/notes`
- `POST /api/cases/[id]/notes`

### Intake

- `POST /api/intakes`
- `POST /api/intakes/batch`
- `POST /api/intake/email`

### AI Operations

- `POST /api/assess` (triage)
- `POST /api/match` (candidate ranking)
- `POST /api/assignments` (dispatch / escalate)

### Assignments and Verification

- `PATCH /api/assignments/[id]`
- `POST /api/verify`

### Messages

- `GET /api/messages`
- `PATCH /api/messages/[id]`
- `POST /api/messages/[id]/promote`

### Volunteers

- `GET /api/volunteers`
- `PATCH /api/volunteers/[id]`

### Incidents

- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/[id]`
- `PATCH /api/incidents/[id]`

### Itineraries

- `GET /api/itineraries`
- `POST /api/itineraries`
- `GET /api/itineraries/[id]`
- `PATCH /api/itineraries/[id]`

### Reports

- `GET /api/reports`
- `GET /api/reports/bias`

## AI Agents

- `lib/agents/triage.ts`
	- Produces severity, vulnerability, confidence, freshness, rationale, flagging.
	- Persists assessment output.
- `lib/agents/matching.ts`
	- Ranks volunteers with skill/language/proximity/load context.
	- Returns structured top candidates.
- `lib/agents/dispatch.ts`
	- Applies severity-based SLA rules.
	- Creates assignment or escalates when needed.

## Authentication and Access Control

- Public entry points: `/`, `/login`, `/auth/*`, and `/api/*` through proxy allow-list.
- App shell (`app/(app)`) performs server-side session check and redirects to `/login` when unauthenticated.
- Supabase client helpers support:
	- `signInWithGoogle()`
	- `signInWithPassword(email, password)`
	- `signOut()`

Important: the email/password form is implemented client-side, but Supabase email/password provider must be enabled and users must exist with password credentials.

## Data Model (Migrations)

Migrations live in `supabase/migrations/` and currently include:

- `001_initial_schema.sql`
- `002_fix_priority_formula.sql`
- `003_case_notes.sql`
- `004_volunteer_status.sql`
- `005_incidents.sql`
- `006_messages.sql`
- `007_geo_rpc.sql`
- `008_dispatch_rules.sql`
- `009_itineraries.sql`
- `010_add_email_source.sql`

Core entities include organizations, users, cases, assessments, assignments, verifications, audit events, case notes, incidents, messages, itineraries, and dispatch rules.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill required values in `.env.local`, then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin operations |
| `OPENAI_API_KEY` | Yes | AI agent model access |
| `RESEND_API_KEY` | No | Email intake confirmation sending |
| `RESEND_FROM_EMAIL` | No | Sender identity for Resend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Optional Google client identifier |
| `GOOGLE_CLIENT_SECRET` | No | Optional Google OAuth secret |

## Scripts

- `npm run dev`: start development server.
- `npm run build`: production build.
- `npm run start`: run production server.
- `npm run lint`: ESLint checks.

## Project Structure (High Level)

```text
app/
	(marketing)/      Landing pages
	(app)/            Auth-protected operations UI
	api/              Route handlers
	auth/callback/    OAuth code exchange
	login/            Login page
components/
	landing/          Marketing + login section UI blocks
	global/, ui/      Shared app shell + primitives
lib/
	agents/           AI agents
	supabase/         Auth/client/server helpers
	config/           Sidebar/header/footer configuration
supabase/migrations/
```