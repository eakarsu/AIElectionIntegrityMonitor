// Precinct anomaly detection: statistical model — expected vs reported votes.
// v0 uses a simple z-score against precinct mean turnout & a Benford check.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const BallotCount = require('../models/BallotCount');

function stddev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
  return Math.sqrt(v);
}

function benfordFirstDigit(values) {
  const counts = Array(10).fill(0);
  let n = 0;
  for (const v of values) {
    const s = String(Math.abs(v)).replace(/^0+/, '');
    const d = parseInt(s[0], 10);
    if (d >= 1 && d <= 9) { counts[d]++; n++; }
  }
  const observed = counts.slice(1).map(c => n ? c / n : 0);
  const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => Math.log10(1 + 1 / d));
  let chi2 = 0;
  for (let i = 0; i < 9; i++) chi2 += Math.pow(observed[i] - expected[i], 2) / (expected[i] || 1);
  return { observed, expected, chi2 };
}

// GET /api/precinct-anomaly/:race_id
router.get('/:race_id', authenticateToken, async (req, res) => {
  try {
    const rows = await BallotCount.findAll({ where: { race_id: req.params.race_id } });
    if (!rows.length) return res.json({ race_id: req.params.race_id, count: 0, anomalies: [] });
    const turnouts = rows.map(r => Number(r.total_votes || 0));
    const mean = turnouts.reduce((a, b) => a + b, 0) / turnouts.length;
    const sd = stddev(turnouts);
    const anomalies = rows
      .map(r => ({
        precinct: r.precinct,
        total_votes: Number(r.total_votes || 0),
        z_score: sd ? ((Number(r.total_votes || 0) - mean) / sd) : 0,
      }))
      .filter(r => Math.abs(r.z_score) > 2.5)
      .sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));

    const benford = benfordFirstDigit(turnouts);
    return res.json({
      race_id: req.params.race_id,
      precinct_count: rows.length,
      turnout_mean: Math.round(mean),
      turnout_stddev: Math.round(sd),
      anomalies: anomalies.slice(0, 50),
      benford,
    });
  } catch (e) {
    console.error('precinct-anomaly error:', e);
    return res.status(500).json({ error: 'analysis failed' });
  }
});

module.exports = router;
