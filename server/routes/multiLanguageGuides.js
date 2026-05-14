// Multi-language voter guides: AI-translated registration / how-to-vote
// content.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, cleanJsonResponse } = require('../services/openRouterService');

const SUPPORTED = ['es', 'zh', 'vi', 'tl', 'ko', 'ar', 'ru', 'hi'];

// POST /api/voter-guides/translate { source_text, target_lang }
router.post('/translate', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { source_text, target_lang } = req.body || {};
    if (!source_text || !target_lang) return res.status(400).json({ error: 'source_text + target_lang required' });
    if (!SUPPORTED.includes(target_lang)) return res.status(400).json({ error: `unsupported target_lang. Supported: ${SUPPORTED.join(',')}` });
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'OPENROUTER_API_KEY missing' });

    const system = `Translate voter-information content into the target language (${target_lang}). Preserve civic terminology accuracy. Output plain text only.`;
    const raw = await queryAI([{ role: 'system', content: system }, { role: 'user', content: source_text.slice(0, 8000) }]);
    return res.json({ target_lang, translation: raw });
  } catch (e) {
    console.error('translate error:', e);
    return res.status(500).json({ error: 'translate failed' });
  }
});

// GET /api/voter-guides/supported
router.get('/supported', (req, res) => res.json({ supported: SUPPORTED }));

module.exports = router;
