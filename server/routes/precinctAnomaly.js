// Precinct anomaly detection: statistical model — expected vs reported votes.
// v0 uses a simple z-score against precinct mean turnout & a Benford check.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/precinct-anomaly/:race_id
router.get('/:race_id', authenticateToken, (req, res) => {
  return res.status(501).json({
    error: 'Race-scoped precinct statistics are not implemented for the native ballot records.',
    code: 'NATIVE_RACE_ASSOCIATION_UNAVAILABLE'
  });
});

module.exports = router;
