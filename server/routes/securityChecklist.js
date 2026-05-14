// Security checklist agent: pre / day-of / post-election compliance steps.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const CHECKLISTS = {
  pre: [
    { id: 'pre.01', name: 'Verify voter roll audit completed' },
    { id: 'pre.02', name: 'Polling-place security walkthrough' },
    { id: 'pre.03', name: 'Test ballot scanners (logic & accuracy)' },
    { id: 'pre.04', name: 'Train election workers' },
    { id: 'pre.05', name: 'Cyber-hygiene scan on EMS' },
    { id: 'pre.06', name: 'Backup paper-ballot supply confirmed' },
  ],
  day_of: [
    { id: 'day.01', name: 'Verify scanner seals before opening' },
    { id: 'day.02', name: 'Open log signed by 2 officials' },
    { id: 'day.03', name: 'Hourly reconciliation of voters vs. ballots' },
    { id: 'day.04', name: 'Provisional ballot tracking' },
    { id: 'day.05', name: 'Incident-report channel active' },
  ],
  post: [
    { id: 'post.01', name: 'Risk-limiting audit sample drawn' },
    { id: 'post.02', name: 'Chain-of-custody documents archived' },
    { id: 'post.03', name: 'Post-election public report' },
    { id: 'post.04', name: 'After-action review with workers' },
    { id: 'post.05', name: 'Retention of election records (22 months)' },
  ],
};

// GET /api/security-checklist/:phase
router.get('/:phase', authenticateToken, (req, res) => {
  const phase = req.params.phase;
  if (!CHECKLISTS[phase]) return res.status(400).json({ error: `unknown phase ${phase}` });
  return res.json({ phase, items: CHECKLISTS[phase] });
});

// POST /api/security-checklist/:phase/complete { item_id, completed_by, notes? }
router.post('/:phase/complete', authenticateToken, async (req, res) => {
  const { item_id, completed_by, notes } = req.body || {};
  if (!item_id || !completed_by) return res.status(400).json({ error: 'item_id + completed_by required' });
  return res.json({ phase: req.params.phase, item_id, completed_by, notes: notes || null, completed_at: new Date().toISOString() });
});

module.exports = router;
