// Agentic investigator: NL query → historical-data analysis.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// POST /api/agentic-investigator/ask { question, scope?: { race_id?, jurisdiction? } }
router.post('/ask', authenticateToken, aiRateLimiter, (req, res) => {
  // Native ballots have no race association. Never discard the requested scope
  // or present unrelated records/provider output as a grounded investigation.
  return res.status(501).json({
    error: 'Race-scoped investigation is not implemented for the native ballot records.',
    code: 'NATIVE_RACE_ASSOCIATION_UNAVAILABLE',
    supportedWorkspace: '/api/ai/ballot-integrity-check'
  });
});

module.exports = router;
