const express = require('express');
const router = express.Router();
// The earlier hardcoded queue/assignment was a prototype, not persisted evidence
// or real outreach. Keep this namespace outside the governed record contract.
router.get('/', (req,res) => res.status(410).json({ error: 'This prototype queue is retired. Read your persisted draft exercises in the native Ballot Cure Queue.' }));
router.post('/assign', (req,res) => res.status(501).json({ error: 'Outreach assignment is not implemented. No voter contact, assignment or notice was created. Persisted drafts require a supported human-reviewed outreach integration.' }));
module.exports = router;
