// Observer-network management: recruit, schedule, communicate.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const observers = new Map(); // in-memory v0 (model can be added later)

// POST /api/observer-network/register { name, email, jurisdiction, languages? }
router.post('/register', async (req, res) => {
  try {
    const { name, email, jurisdiction, languages = [] } = req.body || {};
    if (!name || !email || !jurisdiction) return res.status(400).json({ error: 'name, email, jurisdiction required' });
    const id = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    observers.set(id, { id, name, email, jurisdiction, languages, status: 'pending', shifts: [] });
    return res.json({ id, status: 'pending' });
  } catch (e) {
    return res.status(500).json({ error: 'register failed' });
  }
});

// POST /api/observer-network/:id/schedule  { polling_place, shift_start, shift_end }
router.post('/:id/schedule', authenticateToken, async (req, res) => {
  const o = observers.get(req.params.id);
  if (!o) return res.status(404).json({ error: 'observer not found' });
  const { polling_place, shift_start, shift_end } = req.body || {};
  if (!polling_place || !shift_start || !shift_end) return res.status(400).json({ error: 'polling_place, shift_start, shift_end required' });
  o.shifts.push({ polling_place, shift_start, shift_end, assigned_at: new Date().toISOString() });
  o.status = 'scheduled';
  return res.json({ id: o.id, shifts: o.shifts });
});

// GET /api/observer-network — list
router.get('/', authenticateToken, async (req, res) => {
  return res.json({ count: observers.size, observers: Array.from(observers.values()) });
});

module.exports = router;
