const express = require('express');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { IntegrityError, validateSignal, assertTransition, assertClaimLanguage, hasBipartisanApproval, fingerprint } = require('../services/integrityWorkflow');

const router = express.Router();
router.use(authenticateToken);
const jurisdiction = (req) => String(req.user.jurisdiction_id || '').trim();
router.use((req, res, next) => jurisdiction(req) ? next() : res.status(403).json({ error: 'jurisdiction-bound identity required' }));

router.get('/queue', async (req, res, next) => {
  try {
    const rows = await sequelize.query(
      `SELECT id,status,version,signal,created_by,created_at,updated_at FROM integrity_cases
       WHERE jurisdiction_id=:jurisdiction ORDER BY updated_at DESC LIMIT 200`,
      { replacements: { jurisdiction: jurisdiction(req) }, type: QueryTypes.SELECT }
    );
    res.json({ data: rows });
  } catch (error) { next(error); }
});

router.post('/cases', async (req, res, next) => {
  const key = String(req.get('Idempotency-Key') || '').trim();
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  let signal;
  try {
    const hosts = String(process.env.OFFICIAL_SOURCE_HOSTS || '').split(',').map((v) => v.trim()).filter(Boolean);
    if (hosts.length === 0) return res.status(503).json({ error: 'OFFICIAL_SOURCE_HOSTS is not configured' });
    signal = validateSignal(req.body, hosts);
  } catch (error) { return next(error); }
  const transaction = await sequelize.transaction();
  try {
    const [rows] = await sequelize.query(
      `INSERT INTO integrity_cases (jurisdiction_id,idempotency_key,status,signal,source_fingerprint,created_by)
       VALUES (:jurisdiction,:key,'intake',CAST(:signal AS jsonb),:fingerprint,:actor)
       ON CONFLICT (jurisdiction_id,idempotency_key) DO UPDATE SET updated_at=integrity_cases.updated_at RETURNING *`,
      { replacements: { jurisdiction: jurisdiction(req), key, signal: JSON.stringify(signal), fingerprint: fingerprint(signal), actor: String(req.user.id) }, transaction }
    );
    await sequelize.query(
      `INSERT INTO integrity_events (jurisdiction_id,case_id,actor_id,event_type,details)
       VALUES (:jurisdiction,:caseId,:actor,'signal_ingested',CAST(:details AS jsonb))`,
      { replacements: { jurisdiction: jurisdiction(req), caseId: rows[0].id, actor: String(req.user.id), details: JSON.stringify({ source_fingerprint: fingerprint(signal) }) }, transaction }
    );
    await transaction.commit(); res.status(201).json(rows[0]);
  } catch (error) { await transaction.rollback(); next(error); }
});

router.post('/cases/:id/signoffs', async (req, res, next) => {
  if (!['auditor','admin'].includes(req.user.role)) return res.status(403).json({ error: 'authorized reviewer role required' });
  const decision = String(req.body.decision || '');
  if (!['approve','return','dismiss'].includes(decision) || !String(req.body.rationale || '').trim()) return res.status(400).json({ error: 'decision and rationale required' });
  try {
    assertClaimLanguage(req.body.rationale);
    const [rows] = await sequelize.query(
      `INSERT INTO integrity_signoffs (jurisdiction_id,case_id,actor_id,party_affiliation,decision,rationale)
       SELECT :jurisdiction,id,:actor,:party,:decision,:rationale FROM integrity_cases WHERE id=:caseId AND jurisdiction_id=:jurisdiction
       ON CONFLICT (case_id,actor_id) DO UPDATE SET decision=EXCLUDED.decision,rationale=EXCLUDED.rationale,created_at=NOW() RETURNING *`,
      { replacements: { jurisdiction: jurisdiction(req), caseId: req.params.id, actor: String(req.user.id), party: req.user.party_affiliation || 'N', decision, rationale: req.body.rationale }, type: QueryTypes.INSERT }
    );
    if (!rows[0]) return res.status(404).json({ error: 'case not found' });
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/cases/:id/transition', async (req, res, next) => {
  if (!['auditor','admin'].includes(req.user.role)) return res.status(403).json({ error: 'authorized reviewer role required' });
  const version = Number(req.body.version); const target = String(req.body.status || '');
  if (!Number.isInteger(version) || !req.body.rationale) return res.status(400).json({ error: 'version and rationale required' });
  const transaction = await sequelize.transaction();
  try {
    const cases = await sequelize.query('SELECT * FROM integrity_cases WHERE id=:id AND jurisdiction_id=:jurisdiction FOR UPDATE', { replacements:{ id:req.params.id,jurisdiction:jurisdiction(req) }, type:QueryTypes.SELECT, transaction });
    if (!cases[0]) { await transaction.rollback(); return res.status(404).json({ error:'case not found' }); }
    assertTransition(cases[0].status,target); assertClaimLanguage(req.body.rationale);
    if (cases[0].version !== version) { await transaction.rollback(); return res.status(409).json({ error:'version conflict' }); }
    if (['approved','published'].includes(target)) {
      const signoffs = await sequelize.query('SELECT actor_id,party_affiliation,decision FROM integrity_signoffs WHERE case_id=:id', { replacements:{id:req.params.id},type:QueryTypes.SELECT,transaction });
      if (!hasBipartisanApproval(signoffs)) throw new IntegrityError('two independent bipartisan/nonpartisan approvals are required','REVIEW_REQUIRED');
    }
    const [rows] = await sequelize.query(
      `UPDATE integrity_cases SET status=:target,version=version+1,updated_at=NOW(),published_at=CASE WHEN :target='published' THEN NOW() ELSE published_at END
       WHERE id=:id AND jurisdiction_id=:jurisdiction AND version=:version RETURNING *`,
      { replacements:{target,id:req.params.id,jurisdiction:jurisdiction(req),version},transaction }
    );
    await sequelize.query(`INSERT INTO integrity_events (jurisdiction_id,case_id,actor_id,event_type,details) VALUES (:jurisdiction,:id,:actor,'status_changed',CAST(:details AS jsonb))`, { replacements:{jurisdiction:jurisdiction(req),id:req.params.id,actor:String(req.user.id),details:JSON.stringify({from:cases[0].status,to:target,rationale:req.body.rationale})},transaction });
    await transaction.commit(); res.json(rows[0]);
  } catch (error) { await transaction.rollback(); next(error); }
});

router.use((error, req, res, next) => error instanceof IntegrityError ? res.status(422).json({ error:error.message,code:error.code }) : next(error));
module.exports = router;
