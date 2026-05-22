// Minimal stub router — restored to allow server to boot.
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ items: [] }));
router.get('/queue', (req, res) => res.json({ queue: [] }));

module.exports = router;
