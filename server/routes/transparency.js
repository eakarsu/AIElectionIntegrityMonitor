// Minimal stub router — restored to allow server to boot. Public read-only aggregates.
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ status: 'ok', note: 'public transparency endpoint stub' }));

module.exports = router;
