const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, cleanJsonResponse } = require('../services/openRouterService');
const BallotCount = require('../models/BallotCount');
const VoterRegistration = require('../models/VoterRegistration');
const CampaignFinance = require('../models/CampaignFinance');
const Redistricting = require('../models/Redistricting');

// Helper: 503 if no API key configured. Match existing helper style.
function ensureKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    return false;
  }
  return true;
}

router.use(authenticateToken);

// POST /api/ai/cross-entity-correlation
// Accepts {county, state}, fetches all domain data for that location, identifies correlated anomalies
router.post('/cross-entity-correlation', aiRateLimiter, async (req, res) => {
  try {
    const { county, state } = req.body;
    if (!county || !state) {
      return res.status(400).json({ error: 'county and state are required' });
    }

    const [ballotCounts, voterRegs, campaignFinances] = await Promise.all([
      BallotCount.findAll({ where: { county, state } }),
      VoterRegistration.findAll({ where: { county, state } }),
      CampaignFinance.findAll({ where: { state } })
    ]);

    const prompt = `Analyze cross-entity correlations for election integrity in ${county}, ${state}.

Ballot Count Records (${ballotCounts.length}):
${ballotCounts.map(b => `- Precinct: ${b.precinct}, Total: ${b.totalBallotsCast}, Status: ${b.status}, AI Risk: ${b.aiAnalysis?.risk_level || 'N/A'}`).join('\n') || 'No records'}

Voter Registration Records (${voterRegs.length}):
${voterRegs.map(v => `- Type: ${v.registrationType}, Total: ${v.totalRegistrations}, Flagged: ${v.flaggedRecords}, Status: ${v.status}, AI Risk: ${v.aiAnalysis?.risk_level || 'N/A'}`).join('\n') || 'No records'}

Campaign Finance Records (${campaignFinances.length}):
${campaignFinances.map(c => `- Candidate: ${c.candidateName}, Total: $${c.totalContributions}, Foreign Flagged: ${c.foreignFlaggedDonations}, Status: ${c.complianceStatus}, AI Risk: ${c.aiAnalysis?.risk_level || 'N/A'}`).join('\n') || 'No records'}

Identify correlated anomalies across these domains. Respond ONLY with valid JSON:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "summary of cross-entity correlations found",
  "correlated_anomalies": [{"domains": ["domain1","domain2"], "description": "...", "severity": "Low|Medium|High|Critical"}],
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are a senior election integrity analyst specializing in cross-domain correlation analysis. Return only valid JSON.');

    let analysis;
    try {
      analysis = cleanJsonResponse(result.content);
    } catch (e) {
      analysis = { risk_level: 'Unknown', confidence: 0, summary: result.content, correlated_anomalies: [], flags: [], recommended_actions: [] };
    }

    res.json({
      county,
      state,
      data_summary: {
        ballot_count_records: ballotCounts.length,
        voter_registration_records: voterRegs.length,
        campaign_finance_records: campaignFinances.length
      },
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/county-risk-score
// Accepts {county, state}, aggregates all domain flags, returns unified risk score
router.post('/county-risk-score', aiRateLimiter, async (req, res) => {
  try {
    const { county, state } = req.body;
    if (!county || !state) {
      return res.status(400).json({ error: 'county and state are required' });
    }

    const [ballotCounts, voterRegs, campaignFinances] = await Promise.all([
      BallotCount.findAll({ where: { county, state } }),
      VoterRegistration.findAll({ where: { county, state } }),
      CampaignFinance.findAll({ where: { state } })
    ]);

    const flaggedBallots = ballotCounts.filter(b => b.status === 'flagged' || b.status === 'under_review');
    const anomalyRegs = voterRegs.filter(v => v.status === 'anomaly_detected' || v.status === 'under_investigation');
    const flaggedFinances = campaignFinances.filter(c => c.complianceStatus === 'major_violations' || c.complianceStatus === 'flagged');

    const highRiskBallots = ballotCounts.filter(b => b.aiAnalysis?.risk_level === 'High' || b.aiAnalysis?.risk_level === 'Critical');
    const highRiskRegs = voterRegs.filter(v => v.aiAnalysis?.risk_level === 'High' || v.aiAnalysis?.risk_level === 'Critical');
    const highRiskFinances = campaignFinances.filter(c => c.aiAnalysis?.risk_level === 'High' || c.aiAnalysis?.risk_level === 'Critical');

    const prompt = `Generate a unified risk score for ${county}, ${state} based on the following data:

BALLOT COUNTS:
- Total records: ${ballotCounts.length}
- Flagged/Under review: ${flaggedBallots.length}
- High/Critical AI risk: ${highRiskBallots.length}

VOTER REGISTRATIONS:
- Total records: ${voterRegs.length}
- Anomaly/Under investigation: ${anomalyRegs.length}
- High/Critical AI risk: ${highRiskRegs.length}

CAMPAIGN FINANCE:
- Total records: ${campaignFinances.length}
- Flagged/Major violations: ${flaggedFinances.length}
- High/Critical AI risk: ${highRiskFinances.length}

Return a unified county risk score from 0-100 with contributing factors. Respond ONLY with valid JSON:
{
  "risk_score": 0-100,
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "overall assessment",
  "contributing_factors": [
    {"domain": "ballot_counts", "contribution": 0-100, "reason": "..."},
    {"domain": "voter_registrations", "contribution": 0-100, "reason": "..."},
    {"domain": "campaign_finance", "contribution": 0-100, "reason": "..."}
  ],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are an election integrity risk aggregation specialist. Return only valid JSON.');

    let analysis;
    try {
      analysis = cleanJsonResponse(result.content);
    } catch (e) {
      analysis = { risk_score: 0, risk_level: 'Unknown', confidence: 0, summary: result.content, contributing_factors: [], recommended_actions: [] };
    }

    res.json({ county, state, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/flagged-report
// Fetches all high/critical risk records, generates CSV
router.get('/flagged-report', async (req, res) => {
  try {
    const [ballotCounts, voterRegs, campaignFinances] = await Promise.all([
      BallotCount.findAll({
        where: {
          status: ['flagged', 'under_review']
        }
      }),
      VoterRegistration.findAll({
        where: {
          status: ['anomaly_detected', 'under_investigation']
        }
      }),
      CampaignFinance.findAll({
        where: {
          complianceStatus: ['major_violations', 'flagged']
        }
      })
    ]);

    const rows = [];
    rows.push('domain,id,county,state,status,risk_level,confidence,summary,created_at');

    for (const b of ballotCounts) {
      const ai = b.aiAnalysis || {};
      rows.push([
        'ballot_count',
        b.id,
        b.county,
        b.state,
        b.status,
        ai.risk_level || 'N/A',
        ai.confidence || 'N/A',
        `"${(ai.summary || '').replace(/"/g, '""')}"`,
        b.createdAt
      ].join(','));
    }

    for (const v of voterRegs) {
      const ai = v.aiAnalysis || {};
      rows.push([
        'voter_registration',
        v.id,
        v.county,
        v.state,
        v.status,
        ai.risk_level || 'N/A',
        ai.confidence || 'N/A',
        `"${(ai.summary || '').replace(/"/g, '""')}"`,
        v.createdAt
      ].join(','));
    }

    for (const c of campaignFinances) {
      const ai = c.aiAnalysis || {};
      rows.push([
        'campaign_finance',
        c.id,
        'N/A',
        c.state,
        c.complianceStatus,
        ai.risk_level || 'N/A',
        ai.confidence || 'N/A',
        `"${(ai.summary || '').replace(/"/g, '""')}"`,
        c.createdAt
      ].join(','));
    }

    const csv = rows.join('\n');
    const filename = `flagged-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/ballot-integrity-check
// Accepts { county, state, election_year }
// Returns AI-driven anomaly assessment over BallotCount rows
router.post('/ballot-integrity-check', aiRateLimiter, async (req, res) => {
  try {
    const { county, state, election_year } = req.body;
    if (!state) return res.status(400).json({ error: 'state is required' });

    const where = { state };
    if (county) where.county = county;
    if (election_year) where.electionYear = election_year;

    const ballots = await BallotCount.findAll({ where });
    if (!ballots.length) {
      return res.status(404).json({ error: 'No ballot count records found for the given filters' });
    }

    const summary = ballots.map(b =>
      `- Precinct ${b.precinct}: cast=${b.totalBallotsCast}, registered=${b.totalRegisteredVoters}, rejected=${b.rejectedBallots || 0}, status=${b.status}`
    ).join('\n');

    const prompt = `Analyze the following precinct-level ballot counts for integrity concerns.

Filters: state=${state}, county=${county || 'ALL'}, year=${election_year || 'ALL'}

Records (${ballots.length}):
${summary}

Identify statistical anomalies (turnout outliers, rejection-rate spikes, count
discrepancies vs. registration totals, precinct-pair inconsistencies). Respond
ONLY with valid JSON:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief overall assessment",
  "anomalies": [{"precinct": "...", "type": "...", "severity": "Low|Medium|High|Critical", "description": "..."}],
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are a senior election integrity analyst specializing in ballot count anomaly detection. Return only valid JSON.');
    let parsed;
    try { parsed = cleanJsonResponse(result.content); } catch { parsed = { raw: result.content }; }

    res.json({
      county: county || null,
      state,
      election_year: election_year || null,
      record_count: ballots.length,
      analysis: parsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/campaign-finance-analysis
// Accepts { state, candidate_name (optional) }
// Returns analysis of contribution patterns, dark-money / foreign indicators
router.post('/campaign-finance-analysis', aiRateLimiter, async (req, res) => {
  try {
    const { state, candidate_name } = req.body;
    if (!state) return res.status(400).json({ error: 'state is required' });

    const where = { state };
    if (candidate_name) where.candidateName = candidate_name;

    const records = await CampaignFinance.findAll({ where });
    if (!records.length) {
      return res.status(404).json({ error: 'No campaign finance records found for the given filters' });
    }

    const summary = records.map(c =>
      `- ${c.candidateName}: total=$${c.totalContributions}, foreignFlagged=${c.foreignFlaggedDonations || 0}, individualCount=${c.individualDonationCount || 'N/A'}, status=${c.complianceStatus}`
    ).join('\n');

    const prompt = `Analyze the following campaign finance records for unusual patterns.

State: ${state}${candidate_name ? `, Candidate: ${candidate_name}` : ''}

Records (${records.length}):
${summary}

Look for: dark-money / shell-PAC indicators, foreign-donation patterns,
structuring (many small to evade reporting), unusual donor concentration,
and timing clusters. Respond ONLY with valid JSON:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief overall assessment",
  "patterns": [{"type": "...", "description": "...", "severity": "Low|Medium|High|Critical"}],
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are a senior campaign finance analyst specializing in pattern detection across contribution records. Return only valid JSON.');
    let parsed;
    try { parsed = cleanJsonResponse(result.content); } catch { parsed = { raw: result.content }; }

    res.json({
      state,
      candidate_name: candidate_name || null,
      record_count: records.length,
      analysis: parsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/voter-registration-audit
// Accepts { state, county (optional), registration_type (optional) }
// Returns AI-driven audit of duplicate / invalid / suspicious patterns over
// VoterRegistration rows.
router.post('/voter-registration-audit', aiRateLimiter, async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { state, county, registration_type } = req.body;
    if (!state) return res.status(400).json({ error: 'state is required' });

    const where = { state };
    if (county) where.county = county;
    if (registration_type) where.registrationType = registration_type;

    const records = await VoterRegistration.findAll({ where });
    if (!records.length) {
      return res.status(404).json({ error: 'No voter registration records found for the given filters' });
    }

    const summary = records.map(v =>
      `- County ${v.county}, type=${v.registrationType}: total=${v.totalRegistrations}, flagged=${v.flaggedRecords || 0}, duplicates=${v.duplicateRecords || 0}, deceased=${v.deceasedMatches || 0}, addrMismatch=${v.addressMismatches || 0}, status=${v.status}`
    ).join('\n');

    const prompt = `Audit the following voter registration records for duplicate / invalid / suspicious patterns.

Filters: state=${state}, county=${county || 'ALL'}, type=${registration_type || 'ALL'}

Records (${records.length}):
${summary}

Identify: duplicate concentration, deceased-match clusters, address-mismatch
spikes, suspicious flag-rate outliers vs. county peers, and unusual purge /
reinstatement activity. Respond ONLY with valid JSON:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief overall assessment",
  "issues": [{"county": "...", "type": "...", "severity": "Low|Medium|High|Critical", "description": "..."}],
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are a senior voter registration integrity auditor specializing in duplicate / invalid record detection. Return only valid JSON.');
    let parsed;
    try { parsed = cleanJsonResponse(result.content); } catch { parsed = { raw: result.content }; }

    res.json({
      state,
      county: county || null,
      registration_type: registration_type || null,
      record_count: records.length,
      analysis: parsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/gerrymandering-analysis
// Accepts { state, district_name (optional) }
// Returns AI-driven partisan-bias / compactness analysis over Redistricting rows.
router.post('/gerrymandering-analysis', aiRateLimiter, async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { state, district_name } = req.body;
    if (!state) return res.status(400).json({ error: 'state is required' });

    const where = { state };
    if (district_name) where.districtName = district_name;

    const records = await Redistricting.findAll({ where });
    if (!records.length) {
      return res.status(404).json({ error: 'No redistricting records found for the given filters' });
    }

    const summary = records.map(r =>
      `- District ${r.districtName}: pop=${r.population}, minority%=${r.minorityPopulationPct || 'N/A'}, compactness=${r.compactnessScore || 'N/A'}, contiguous=${r.contiguityCheck}, competitiveness=${r.competitivenessIndex || 'N/A'}, fairness=${r.fairnessScore || 'N/A'}, status=${r.status}, proposedBy=${r.proposedBy}`
    ).join('\n');

    const prompt = `Analyze the following redistricting proposals for partisan-bias / gerrymandering indicators.

Filters: state=${state}, district=${district_name || 'ALL'}

Records (${records.length}):
${summary}

Look for: low compactness scores, low competitiveness, packing / cracking of
minority populations, non-contiguous segments, and outlier fairness scores.
Cross-reference with the proposing party where available. Respond ONLY with
valid JSON:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief overall assessment",
  "indicators": [{"district": "...", "type": "packing|cracking|low_compactness|non_contiguous|other", "severity": "Low|Medium|High|Critical", "description": "..."}],
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

    const result = await queryAI(prompt, 'You are a nonpartisan redistricting fairness analyst specializing in gerrymandering pattern detection. Return only valid JSON.');
    let parsed;
    try { parsed = cleanJsonResponse(result.content); } catch { parsed = { raw: result.content }; }

    res.json({
      state,
      district_name: district_name || null,
      record_count: records.length,
      analysis: parsed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Apply pass 5 backlog (additive) ──────────────────────────────────────

// Helper: gate on a specific env var with explicit `missing: <ENV>` field.
function requireEnv(res, envName) {
  if (!process.env[envName]) {
    res.status(503).json({
      error: `Integration unavailable: ${envName} not configured`,
      missing: envName,
    });
    return false;
  }
  return true;
}

// POST /api/ai/state-sos-feed — pull real-time election results from a SOS feed.
// NEEDS-CREDS — env: SOS_FEED_API_KEY, SOS_FEED_BASE_URL.
// Each US state SOS exposes a different API; this is a configurable gate.
router.post('/state-sos-feed', aiRateLimiter, async (req, res) => {
  if (!requireEnv(res, 'SOS_FEED_API_KEY')) return;
  if (!requireEnv(res, 'SOS_FEED_BASE_URL')) return;
  // NEEDS-CREDS: per-state secretary-of-state APIs. When configured, fetch
  // `${SOS_FEED_BASE_URL}/{state}/results?key=${SOS_FEED_API_KEY}`.
  res.json({ status: 'configured', message: 'State SOS feed integration is configured (per-state adapter required).' });
});

// GET /api/ai/transparency-dashboard
// Public-style aggregate view for stakeholders. PRODUCT-DECISION: aggregates
// counts only (no PII, no per-precinct results) until legal review approves
// jurisdiction-specific reporting requirements.
router.get('/transparency-dashboard', aiRateLimiter, async (req, res) => {
  try {
    // PRODUCT-DECISION: counts-only aggregates pending legal sign-off.
    const [bcCount, vrCount, cfCount, rdCount] = await Promise.all([
      BallotCount.count().catch(() => 0),
      VoterRegistration.count().catch(() => 0),
      CampaignFinance.count().catch(() => 0),
      Redistricting.count().catch(() => 0),
    ]);
    res.json({
      generated_at: new Date().toISOString(),
      mode: 'aggregate_counts_only',
      product_decision_note: 'Detail-level reporting deferred until legal review for each jurisdiction.',
      totals: {
        ballot_count_records: bcCount,
        voter_registration_records: vrCount,
        campaign_finance_records: cfCount,
        redistricting_records: rdCount,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/stakeholder-portal-access
// PRODUCT-DECISION: default access policy = 3 roles {media, observer, official}
// granted via static allowlist on email domain. Replace with full RBAC when
// product confirms which jurisdictions require credentialing.
router.post('/stakeholder-portal-access', aiRateLimiter, async (req, res) => {
  try {
    const { email, requested_role } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    // PRODUCT-DECISION: simple domain-based default. Real implementation
    // should integrate with state-issued media/observer credentials.
    const validRoles = ['media', 'observer', 'official'];
    const role = validRoles.includes(requested_role) ? requested_role : 'observer';
    const trusted = /\.(gov|edu|org)$/i.test(email);
    res.json({
      email,
      granted_role: role,
      access: trusted ? 'granted_pending_review' : 'pending_manual_approval',
      product_decision_note: 'Default policy — replace with credentialing API when product confirms jurisdictional requirements.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
