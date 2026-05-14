// Public transparency portal: real-time ballot tracking with media access.
// Read-only, no auth — exposes aggregated rollups only.
const express = require('express');
const router = express.Router();
const BallotCount = require('../models/BallotCount');
const CampaignFinance = require('../models/CampaignFinance');

// GET /api/transparency-portal/rollup?race_id=...
router.get('/rollup', async (req, res) => {
  try {
    const where = {};
    if (req.query.race_id) where.race_id = req.query.race_id;
    const ballots = await BallotCount.findAll({ where });
    let total = 0, precincts = 0, reporting = 0;
    for (const b of ballots) {
      total += Number(b.total_votes || 0);
      precincts++;
      if (b.reported_at || b.reportedAt) reporting++;
    }
    return res.json({
      race_id: req.query.race_id || null,
      precincts,
      precincts_reporting: reporting,
      total_votes: total,
      reporting_pct: precincts ? Math.round((reporting / precincts) * 100) : 0,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: 'rollup failed' });
  }
});

// GET /api/transparency-portal/finance/top-donors?limit=20
router.get('/finance/top-donors', async (req, res) => {
  try {
    const rows = await CampaignFinance.findAll({ limit: 1000 });
    const map = new Map();
    for (const r of rows) {
      const name = r.donor_name || r.donorName || 'Anonymous';
      map.set(name, (map.get(name) || 0) + Number(r.amount || 0));
    }
    const top = Array.from(map.entries())
      .map(([name, total]) => ({ name, total: Math.round(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, Math.min(parseInt(req.query.limit) || 20, 100));
    return res.json({ top_donors: top });
  } catch (e) {
    return res.status(500).json({ error: 'lookup failed' });
  }
});

module.exports = router;
