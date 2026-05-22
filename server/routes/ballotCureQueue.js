const express = require('express');

const router = express.Router();

const cureItems = [
  { id: 'BC-2201', county: 'Marion', voterBatch: 'VB-14', reason: 'signature mismatch', dueHours: 18, status: 'outreach queued' },
  { id: 'BC-2202', county: 'Franklin', voterBatch: 'VB-22', reason: 'missing envelope date', dueHours: 31, status: 'pending notice' },
  { id: 'BC-2203', county: 'Union', voterBatch: 'VB-08', reason: 'ID copy needed', dueHours: 9, status: 'urgent' },
];

router.get('/', (req, res) => {
  res.json({
    summary: {
      openCures: cureItems.length,
      urgent: cureItems.filter((item) => item.dueHours <= 12).length,
      counties: [...new Set(cureItems.map((item) => item.county))].length,
    },
    cureItems,
  });
});

router.post('/assign', (req, res) => {
  const item = cureItems.find((entry) => entry.id === req.body?.id) || cureItems[0];
  res.json({
    id: item.id,
    assignment: item.dueHours <= 12 ? 'same-day bilingual phone outreach' : 'standard cure notice workflow',
    script: `Explain ${item.reason} cure requirement and document voter contact attempt.`,
  });
});

module.exports = router;
