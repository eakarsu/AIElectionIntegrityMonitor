# Audit Notes — AIElectionIntegrityMonitor

Audit source: `_AUDIT/reports/batch_03.md` § 10 (skeleton, audit reported 0 AI endpoints).

## Original audit recommendations

### Missing AI counterparts
- `/gerrymandering-analysis` — partisan-bias district analysis.
- `/campaign-finance-analysis` — flag unusual contributions / dark money.
- `/ballot-integrity-check` — anomaly detection in vote counts.
- `/voter-registration-audit` — duplicate / invalid registrations.

### Missing non-AI features
- Data import / validation pipeline.
- Real-time results reporting.
- Stakeholder portal.
- Audit trail.

### Custom feature suggestions
- Precinct-level statistical anomaly model.
- Agentic investigator.
- Public transparency dashboard.
- Multi-language voter registration guides.
- Election-security checklist.
- Trained-observer network management.

## Current state observed

`routes/aiNew.js` already had `/cross-entity-correlation`, `/county-risk-score`,
`/flagged-report`, leveraging Sequelize models for BallotCount, VoterRegistration,
and CampaignFinance.

## Implementations applied this pass

1. **`POST /api/ai/ballot-integrity-check`** — analyses BallotCount rows for
   precinct-level anomalies (turnout outliers, rejection spikes, count vs.
   registration mismatches), returning structured JSON.
2. **`POST /api/ai/campaign-finance-analysis`** — analyses CampaignFinance
   rows for dark-money / structuring / foreign-donation / timing-cluster
   patterns, returning structured JSON.

Both follow the existing `queryAI` + `cleanJsonResponse` pattern; pass
`node --check`.

## Prioritized backlog

1. **MECHANICAL** — Add `/api/ai/voter-registration-audit` reading
   VoterRegistration rows for duplicate / invalid patterns (mirrors above).
2. **MECHANICAL** — Add `/api/ai/gerrymandering-analysis` reading
   Redistricting rows; needs a polygon-area / compactness metric helper.
3. **NEEDS-CREDS** — Real-time election-night results integration requires
   per-state SOS feeds.
4. **NEEDS-PRODUCT-DECISION** — Stakeholder portal needs role + access
   policy decisions (media / observer / official).
5. **TOO-RISKY** — Public transparency dashboards require legal review
   for jurisdictional reporting requirements.

## Apply pass 3 (frontend)

Inspected `client/src/App.jsx` and confirmed the Vite/React frontend already
surfaces both pass-2 AI endpoints:

- `client/src/pages/BallotIntegrityCheckPage.jsx` — full form (state /
  county / election year), calls `POST /api/ai/ballot-integrity-check` via
  `services/api.js → ai.ballotIntegrityCheck`. Renders structured analysis
  (anomalies table, flags, recommended actions, risk badge, confidence).
- `client/src/pages/CampaignFinanceAnalysisPage.jsx` — wired to `POST
  /api/ai/campaign-finance-analysis` via `ai.campaignFinanceAnalysis`.

Both pages registered in the sidebar nav (`ai-ballot-integrity` and
`ai-campaign-finance`). JWT via `localStorage.getItem('token')` in
`services/api.js`. Backend AI router mounted at `/api/ai` in
`server/index.js:58`.

The other three endpoints (`cross-entity-correlation`, `county-risk-score`,
`flagged-report`) are exposed indirectly through the per-record `/analyze`
buttons on each entity page (BallotCount/Redistricting/VoterRegistration/
CampaignFinance) — sufficient for now.

**Action: LEFT-AS-IS — frontend already wired.**

### Backlog (frontend, optional)
- Dedicated cross-entity correlation dashboard (combine all four entities
  into a single state/county view) would be a useful next FE iteration.

## Apply pass 4 (mechanical backlog)

Implemented the two MECHANICAL backlog items:

1. `POST /api/ai/voter-registration-audit` — body `{state, county?, registration_type?}`. Reads `VoterRegistration` rows, asks the existing `queryAI` helper to flag duplicate / invalid / suspicious patterns. Returns structured JSON
   (`risk_level`, `confidence`, `summary`, `issues[]`, `flags[]`, `recommended_actions[]`).
2. `POST /api/ai/gerrymandering-analysis` — body `{state, district_name?}`. Reads `Redistricting` rows, asks `queryAI` to identify packing / cracking / low-compactness / non-contiguous indicators. Returns structured JSON
   (`risk_level`, `confidence`, `summary`, `indicators[]`, `flags[]`, `recommended_actions[]`).

Both endpoints short-circuit with HTTP 503 + `{error: "AI service unavailable: OPENROUTER_API_KEY not configured"}` when no API key is configured (via a new `ensureKey(res)` helper at the top of `routes/aiNew.js`). Auth, rate-limit middleware, and JSON parsing follow the existing pass-2 pattern.

Frontend wiring:

- `client/src/services/api.js` — added `ai.voterRegistrationAudit` and `ai.gerrymanderingAnalysis`.
- `client/src/pages/VoterRegistrationAuditPage.jsx` — new form (state required; county / registration type optional) with structured result rendering, JWT via existing `request()` helper, friendly 503 message.
- `client/src/pages/GerrymanderingAnalysisPage.jsx` — same pattern for state + district name.
- `client/src/App.jsx` — registered `ai-voter-audit` and `ai-gerrymandering` page IDs in `pageMap`, `pageTitles`, and `navItems` (sidebar).

Smoke test: booted a minimal server loading only `routes/auth` + `routes/aiNew` (the full server requires several pre-existing-missing route files unrelated to this pass), logged in as `admin@electionmonitor.gov`, and confirmed both new endpoints return HTTP 503 with the expected error body when `OPENROUTER_API_KEY` is empty.

### Backlog still open
- Real-time election-night results integration — NEEDS-CREDS.
- Stakeholder portal — NEEDS-PRODUCT-DECISION.
- Public transparency dashboards — TOO-RISKY (legal review).
- Restoring the missing route files (`auditLogs`, `reviewWorkflow`, `stateRollup`, `transparency`) referenced by `server/index.js` is a separate cleanup task.

## Apply pass 5 (all backlog)

Implemented 3 additive backlog endpoints in `server/routes/aiNew.js`:

| Endpoint | Category | Env / Default |
|---|---|---|
| `POST /api/ai/state-sos-feed` | NEEDS-CREDS | `SOS_FEED_API_KEY`, `SOS_FEED_BASE_URL` |
| `GET /api/ai/transparency-dashboard` | TOO-RISKY → additive (counts only) | `// PRODUCT-DECISION: aggregate_counts_only` mode pending legal review |
| `POST /api/ai/stakeholder-portal-access` | NEEDS-PRODUCT-DECISION | default 3-role (`media`/`observer`/`official`) policy; `.gov`/`.edu`/`.org` allowlist |

The `state-sos-feed` route returns HTTP 503 + `{ error, missing: <ENV_NAME> }` when either env var is unset. Smoke test (mini-server on port 4812 mirroring pass-4 approach): logged in as `admin@electionmonitor.gov / Admin123!`; transparency-dashboard returned 200 with record counts, stakeholder-portal-access returned 200 with role assignment, state-sos-feed returned 503 with `missing: SOS_FEED_API_KEY`. No new deps; pre-existing missing route files (`auditLogs`, `reviewWorkflow`, etc.) remain untouched.
