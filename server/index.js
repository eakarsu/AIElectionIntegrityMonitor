const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Helmet is optional — install with `npm install helmet` to enable strict
// security headers in production. We try to load it dynamically so the server
// still starts in development without the dependency.
let helmet;
try { helmet = require('helmet'); } catch { helmet = null; }

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const ballotCountRoutes = require('./routes/ballotCounts');
const redistrictingRoutes = require('./routes/redistricting');
const voterRegistrationRoutes = require('./routes/voterRegistration');
const campaignFinanceRoutes = require('./routes/campaignFinance');
const aiNewRoutes = require('./routes/aiNew');
const auditLogRoutes = require('./routes/auditLogs');
const reviewWorkflowRoutes = require('./routes/reviewWorkflow');
const stateRollupRoutes = require('./routes/stateRollup');
const transparencyRoutes = require('./routes/transparency');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Security headers (only when helmet is installed)
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
  }));
} else {
  console.warn('[SECURITY] helmet not installed — add it with `npm install helmet` for production deployments');
}

// CORS — env-driven allowlist (comma-separated), defaults to localhost
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ballot-counts', ballotCountRoutes);
app.use('/api/redistricting', redistrictingRoutes);
app.use('/api/voter-registration', voterRegistrationRoutes);
app.use('/api/campaign-finance', campaignFinanceRoutes);
app.use('/api/ai', aiNewRoutes);
app.use('/api/export', aiNewRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/review-workflow', reviewWorkflowRoutes);
app.use('/api/state-rollup', stateRollupRoutes);
// Public transparency portal — no auth required (read-only aggregated data)
app.use('/api/transparency', transparencyRoutes);
app.use('/api/precinct-anomaly', require('./routes/precinctAnomaly'));
app.use('/api/agentic-investigator', require('./routes/agenticInvestigator'));
app.use('/api/transparency-portal', require('./routes/transparencyPortal'));
app.use('/api/voter-guides', require('./routes/multiLanguageGuides'));
app.use('/api/security-checklist', require('./routes/securityChecklist'));
app.use('/api/observer-network', require('./routes/observerNetwork'));

// Dashboard stats
app.use('/api/dashboard', require('./middleware/auth').authenticateToken, async (req, res) => {
  try {
    const BallotCount = require('./models/BallotCount');
    const Redistricting = require('./models/Redistricting');
    const VoterRegistration = require('./models/VoterRegistration');
    const CampaignFinance = require('./models/CampaignFinance');

    const [ballotCounts, redistricting, voterRegistrations, campaignFinances] = await Promise.all([
      BallotCount.findAll(),
      Redistricting.findAll(),
      VoterRegistration.findAll(),
      CampaignFinance.findAll()
    ]);

    const flaggedBallots = ballotCounts.filter(b => b.status === 'flagged' || b.status === 'under_review').length;
    const flaggedDistricts = redistricting.filter(r => r.status === 'flagged' || r.status === 'rejected').length;
    const anomalyRegistrations = voterRegistrations.filter(v => v.status === 'anomaly_detected' || v.status === 'under_investigation').length;
    const flaggedFinances = campaignFinances.filter(c => c.complianceStatus === 'major_violations' || c.complianceStatus === 'flagged').length;

    res.json({
      ballotCounts: { total: ballotCounts.length, flagged: flaggedBallots },
      redistricting: { total: redistricting.length, flagged: flaggedDistricts },
      voterRegistrations: { total: voterRegistrations.length, anomalies: anomalyRegistrations },
      campaignFinances: { total: campaignFinances.length, flagged: flaggedFinances },
      totalAlerts: flaggedBallots + flaggedDistricts + anomalyRegistrations + flaggedFinances
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await sequelize.sync();
    console.log('Database synced.');

    // Create audit log table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        model_used VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Audit log table ready.');

    
// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
