const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { collections, capabilities, nativeReadContext, scopeWhere } = require('../services/nativeRecords');
const router = express.Router();
router.use(authenticateToken, nativeReadContext);
router.get('/dashboard', async (req, res, next) => {
  try {
    const counts = await Promise.all(Object.values(collections).map(model => model.count({ where: scopeWhere(req.actor) })));
    const samples = await Promise.all(Object.values(collections).map(model => model.count({ where: { ...scopeWhere(req.actor), is_demo: true } })));
    const [ballotFlags, voterFlags, financeFlags, districtFlags] = await Promise.all([collections['ballot-counts'].count({where:{...scopeWhere(req.actor),status:['flagged','under_review']}}), collections['voter-registration'].count({where:{...scopeWhere(req.actor),status:['anomaly_detected','under_investigation']}}), collections['campaign-finance'].count({where:{...scopeWhere(req.actor),complianceStatus:['major_violations','flagged']}}), collections.redistricting.count({where:{...scopeWhere(req.actor),status:['flagged','rejected']}})]);
    res.json({ ballotCounts: { total: counts[0], flagged: ballotFlags }, voterRegistrations: { total: counts[1], anomalies: voterFlags }, campaignFinances: { total: counts[2], flagged: financeFlags }, redistricting: { total: counts[3], flagged: districtFlags }, ballotCureQueue: { total: counts[4] }, totalAlerts: ballotFlags + voterFlags + financeFlags + districtFlags, sampleRecords: samples.reduce((a,b)=>a+b,0), reviewStatus: 'Unreviewed records; these counts do not certify election integrity.' });
  } catch (error) { next(error); }
});
router.get('/:collection', async (req, res, next) => {
  const model = collections[req.params.collection];
  if (!model) return res.status(404).json({ error: 'Unknown record collection.' });
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1), limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { count, rows } = await model.findAndCountAll({ where: scopeWhere(req.actor), order: [['id','ASC']], limit, offset: (page-1)*limit });
    res.json({ data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count/limit) }, capabilities });
  } catch (error) { next(error); }
});
router.get('/:collection/:id', async (req, res, next) => {
  const model = collections[req.params.collection];
  if (!model) return res.status(404).json({ error: 'Unknown record collection.' });
  try {
    const item = await model.findOne({ where: { id: req.params.id, ...scopeWhere(req.actor) } });
    if (!item) return res.status(404).json({ error: 'Record not found in your jurisdiction.' });
    res.json({ item, capabilities });
  } catch (error) { next(error); }
});
router.all('*', (req,res) => res.status(410).json({ error: capabilities.reason }));
router.use((error,req,res,next) => res.status(['42703','42P01'].includes(error.original?.code)?503:500).json({ error: ['42703','42P01'].includes(error.original?.code)?'Native record migration is required. Run scripts/migrate.sh explicitly.': 'Could not read election records. Try again or check the local database.' }));
module.exports = router;
