// Public transparency portal: real-time ballot tracking with media access.
// Read-only, no auth — exposes aggregated rollups only.
const express = require('express');
const router = express.Router();

// GET /api/transparency-portal/rollup?race_id=...
router.get('/rollup', (req, res) => {
  return res.status(501).json({
    error: 'Public race reporting is not implemented from the native ballot records.',
    code: 'NATIVE_RACE_REPORTING_UNAVAILABLE'
  });
});

// GET /api/transparency-portal/finance/top-donors?limit=20
router.get('/finance/top-donors', (req, res) => {
  // CampaignFinance stores aggregate campaign amounts, not donor receipts.
  return res.status(501).json({
    error: 'Donor rankings require actual donor receipts; native campaign aggregates do not provide them.',
    code: 'NATIVE_DONOR_RECEIPTS_UNAVAILABLE'
  });
});

module.exports = router;
