// Minimal stub router — restored to allow server to boot.
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ states: [] }));
router.get('/:state', (req, res) => res.json({ state: req.params.state, summary: {} }));

module.exports = router;
