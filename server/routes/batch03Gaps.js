// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-no-precinct-level-benford-style-statistical-anomaly-model', buildHandler('gap-ai-no-precinct-level-benford-style-statistical-anomaly-model', 'No precinct-level Benford-style statistical anomaly model', 'No precinct-level Benford-style statistical anomaly model'));
router.post('/gap-no-machine-learning-duplicate-registration-matcher', buildHandler('gap-ai-no-machine-learning-duplicate-registration-matcher', 'No machine-learning duplicate-registration matcher', 'No machine-learning duplicate-registration matcher'));
router.post('/gap-no-multilingual-voter-guide-generation', buildHandler('gap-ai-no-multilingual-voter-guide-generation', 'No multilingual voter-guide generation', 'No multilingual voter-guide generation'));
router.post('/gap-no-webhooks-no-sos-push-delivery', buildHandler('gap-non-no-webhooks-no-sos-push-delivery', 'No webhooks (no SOS push delivery)', 'No webhooks (no SOS push delivery)'));
router.post('/gap-no-search-endpoint-no-full-text-query', buildHandler('gap-non-no-search-endpoint-no-full-text-query', 'No search endpoint (no full-text query)', 'No search endpoint (no full-text query)'));
router.post('/gap-no-file-upload-module-no-scanned-ballot-ingest', buildHandler('gap-non-no-file-upload-module-no-scanned-ballot-ingest', 'No file-upload module (no scanned-ballot ingest)', 'No file-upload module (no scanned-ballot ingest)'));
router.post('/gap-limited-observer-network-scheduling', buildHandler('gap-non-limited-observer-network-scheduling', 'Limited observer-network scheduling', 'Limited observer-network scheduling'));
router.post('/gap-no-payment-donation-processing-campaign-finance-side', buildHandler('gap-non-no-payment-donation-processing-campaign-finance-side', 'No payment/donation processing (campaign-finance side)', 'No payment/donation processing (campaign-finance side)'));

module.exports = router;
