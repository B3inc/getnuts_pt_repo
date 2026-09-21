# Wellness Match — Personal Tracker

A personal self-tracking app, built for a single user (no login screen —
the backend auto-provisions one account on first boot from
`DEFAULT_USER_EMAIL`/`DEFAULT_USER_PASSWORD` in `.env`): log what you're
taking (peptides, amino acids, protein, whatever), connect your Oura Ring,
and chart your own sleep/readiness/HRV/activity data alongside a daily
energy/mood/soreness check-in — so you can look at your own trends and
judge for yourself whether something is making a difference. You can also
export everything as CSV any time from the dashboard.

Multi-user auth code (signup/login) is still in `backend/routes/auth.js`
if you ever want to reintroduce it — the frontend just doesn't use it
right now.

## Important: what this does and doesn't do

**This codebase never generates or hardcodes health/supplement advice.**
For personal tracking, it only stores what you log and shows you your own
data — it doesn't tell you what anything means. The one interpretive
feature (`/insights/compare/:substanceId`, a before/after average) returns
an explicit caveat that it's a descriptive comparison, not a causal or
statistical claim.

If you later reintroduce the multi-user "recommend a substance" direction,
that logic must still come from `recommendation_rules`, authored and
approved by a licensed nutritionist or physician — see
`backend/services/recommendationEngine.js` for how that's enforced
structurally.

## Project structure

```
peptide-app/
├── backend/          Node/Express API
│   ├── routes/        auth, oura, questionnaire, tracking, insights
│   ├── services/      auth middleware + recommendation engine
│   └── db/            Postgres schema
└── frontend/         React (Vite) app
    └── src/components/  Login, Signup, Dashboard, SubstanceLog,
                          DailyCheckin, Trends, Questionnaire
```

## The personal tracker, specifically

- **Substance log** (`/substances` page, `backend/routes/tracking.js`):
  free-text log of what you're taking, dose, start/end dates, notes. Not
  validated or interpreted by the app.
- **Daily check-in** (dashboard widget): quick 1-10 energy/mood/soreness
  sliders, since Oura can't capture how you actually feel.
- **Trends** (`/trends` page, `backend/routes/insights.js`): line charts of
  your Oura metrics and check-ins over time, with vertical markers for when
  you started each substance, plus a simple before/after average comparison
  for any substance you select. The comparison endpoint always returns a
  caveat string reminding you it's descriptive, not a controlled experiment
  — small sample sizes and confounders (stress, travel, illness, other
  changes) mean a shift after starting something isn't proof it caused it.

## Local setup

### 1. Database
You need a Postgres instance (local, or a free tier on Supabase/Neon/Railway).
```bash
createdb wellness_match
psql wellness_match < backend/db/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, Oura credentials
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173.

## Setting up Oura API access

1. Go to https://cloud.ouraring.com/oauth/applications and register an app.
2. Set its redirect URI to `http://localhost:4000/oura/callback` (must match
   `OURA_REDIRECT_URI` in your `.env` exactly).
3. Copy the client ID/secret into `backend/.env`.
4. Scopes used: `daily`, `heartrate`, `personal` — adjust in `routes/oura.js`
   if you need more (e.g. `workout`).

## Deploying / hosting

Straightforward options to get this live quickly:
- **Backend:** Railway or Render (both support Postgres + Node out of the box)
- **Frontend:** Vercel or Netlify (point it at your deployed backend via `VITE_API_URL`)
- **Database:** Railway/Render's managed Postgres, or Supabase/Neon free tier

None of this requires a native app yet, since Oura has a cloud API.

## Adding Apple Watch / HealthKit later

Apple HealthKit data is device-local — there's no server-side API Apple
exposes for it. To support Apple Watch users you'll eventually need a
native iOS companion app (Swift) that:
1. Requests HealthKit read permissions (sleep, heart rate, workouts, etc.)
2. Reads the data on-device
3. Forwards it to this same backend, ideally through a new
   `POST /healthkit/sync` endpoint mirroring the shape of `wearable_daily_data`

This is a separate, larger workstream — happy to help scope it once the
web + Oura version is working.

## Bringing on a nutritionist/physician

Their job is to populate `recommendation_rules` with real content:
- `conditions`: JSON logic matched against questionnaire answers + wearable
  metrics (see examples in `recommendationEngine.js`)
- `recommendation_content`: the actual text shown to users
- `authored_by` / `reviewed_by`: for accountability and audit trail
- `is_active`: only active, reviewed rules are ever shown to users

Consider building a simple internal admin UI for them to manage this table
without touching the database directly — that's a good next milestone.

## Legal/compliance note

This is a starting technical scaffold, not legal advice. Before launch,
have a lawyer review: DSHEA supplement-marketing rules, FDA's stance on
peptides sold for human consumption, HIPAA applicability (health data +
identifiable users can trigger obligations even outside clinical settings),
and standard privacy/ToS requirements for handling wearable health data.
