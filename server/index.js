const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const ballotCountRoutes = require('./routes/ballotCounts');
const redistrictingRoutes = require('./routes/redistricting');
const voterRegistrationRoutes = require('./routes/voterRegistration');
const campaignFinanceRoutes = require('./routes/campaignFinance');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ballot-counts', ballotCountRoutes);
app.use('/api/redistricting', redistrictingRoutes);
app.use('/api/voter-registration', voterRegistrationRoutes);
app.use('/api/campaign-finance', campaignFinanceRoutes);

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

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
