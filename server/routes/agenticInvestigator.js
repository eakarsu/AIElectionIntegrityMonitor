// Agentic investigator: NL query → historical-data analysis.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, cleanJsonResponse } = require('../services/openRouterService');
const BallotCount = require('../models/BallotCount');
const CampaignFinance = require('../models/CampaignFinance');

// POST /api/agentic-investigator/ask { question, scope?: { race_id?, jurisdiction? } }
router.post('/ask', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { question, scope = {} } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY missing' });

    const where = {};
    if (scope.race_id) where.race_id = scope.race_id;
    const ballots = await BallotCount.findAll({ where, limit: 100 });
    const finance = await CampaignFinance.findAll({ limit: 100 });

    const system = 'You are an election integrity analyst. Use only the supplied data. Output JSON {"answer":"...","evidence":[{type, summary, ids:[...]}],"open_questions":["..."]}.';
    const ctx = `Question: ${question}\nBallots(sample): ${JSON.stringify(ballots).slice(0, 3000)}\nFinance(sample): ${JSON.stringify(finance).slice(0, 3000)}`;
    let raw, parsed;
    try {
      raw = await queryAI([{ role: 'system', content: system }, { role: 'user', content: ctx }]);
      parsed = JSON.parse(cleanJsonResponse(raw));
    } catch (e) {
      return res.status(502).json({ error: 'AI response invalid', detail: e.message, raw });
    }

    return res.json({ question, scope, answer: parsed });
  } catch (e) {
    console.error('agentic-investigator error:', e);
    return res.status(500).json({ error: 'investigation failed' });
  }
});

module.exports = router;
