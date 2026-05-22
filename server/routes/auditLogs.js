// Minimal stub router — restored to allow server to boot. Returns empty audit log list.
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 200');
    return res.json({ logs: rows || [] });
  } catch (e) {
    return res.json({ logs: [] });
  }
});

module.exports = router;
