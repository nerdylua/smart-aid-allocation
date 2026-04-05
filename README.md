# Sahaya — Community Need Intelligence Grid

A unified decision layer that ingests scattered need signals, prioritizes by severity and vulnerability, then routes requests to best-fit volunteers with closure tracking and equity monitoring.

## Stack

- **Framework**: Next.js 16 (App Router + API Routes)
- **Database**: Supabase (PostgreSQL + PostGIS)
- **AI**: Vercel AI SDK (ToolLoopAgent) + OpenAI GPT-5.4-mini
- **Maps**: React Leaflet + OpenStreetMap + Nominatim geocoding
- **Auth**: Google OAuth via Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase, OpenAI, and (optionally) Google OAuth + Twilio credentials
```

Run all migrations in `supabase/migrations/` (001–009) against your Supabase project, then seed:

```bash
npx tsx scripts/seed.ts
```

Start the dev server:

```bash
npm run dev
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI agents |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID (SMS intake) |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio phone number |

## Core Pipeline

```
intake (form / CSV / SMS) → geocode → AI triage → AI match → dispatch (SLA rules) → accept → complete → verify → close
```

Every step is audited, logged to the case timeline, and visible in the realtime dashboard.

## Key Features

- **3 AI agents**: Triage (scoring + flagging), Matching (skill/language/distance), Dispatch (SLA-aware assignment + auto-escalation)
- **Bias audit panel**: Disparity analysis by region, language, and need type
- **SMS intake**: Twilio webhook auto-creates cases and triggers AI triage
- **Real geocoding**: Nominatim + PostGIS for map pins from any location
- **Incident grouping**: Bundle related cases under campaigns with progress tracking
- **Volunteer self-service**: Browse and claim cases matching your skills
- **Route planning**: Nearest-neighbor itineraries with distance estimates
- **Configurable dispatch rules**: Data-driven SLA tiers and auto-escalation policy
- **Supabase Realtime**: Dashboard and case detail auto-refresh on changes

## UN SDG Alignment

- SDG 1 (No Poverty) — routing aid to most vulnerable
- SDG 3 (Good Health) — medical need prioritization
- SDG 10 (Reduced Inequalities) — bias audit + vulnerability-aware scoring
- SDG 11 (Sustainable Cities) — hotspot detection for urban response
- SDG 17 (Partnerships) — multi-org design with incident grouping
