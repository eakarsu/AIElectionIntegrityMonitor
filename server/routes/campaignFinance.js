const express = require('express');
const router = express.Router();
const CampaignFinance = require('../models/CampaignFinance');
const { authenticateToken } = require('../middleware/auth');
const { analyzeCampaignFinance } = require('../services/openRouterService');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const sequelize = require('../config/database');

router.use(authenticateToken);

// GET with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await CampaignFinance.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await CampaignFinance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const record = await CampaignFinance.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await CampaignFinance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await CampaignFinance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI analyze with rate limiting and audit log
router.post('/:id/analyze', aiRateLimiter, async (req, res) => {
  try {
    const record = await CampaignFinance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const analysis = await analyzeCampaignFinance(record);
    const structuredAnalysis = analysis.parsedContent || analysis;

    await record.update({ aiAnalysis: structuredAnalysis });

    try {
      await sequelize.query(
        `INSERT INTO ai_audit_logs (user_id, entity_type, entity_id, model_used, created_at)
         VALUES (:userId, :entityType, :entityId, :modelUsed, NOW())`,
        {
          replacements: {
            userId: req.user.id,
            entityType: 'campaign_finance',
            entityId: record.id,
            modelUsed: analysis.model || 'anthropic/claude-3-5-sonnet-20241022'
          }
        }
      );
    } catch (logErr) {
      console.warn('Audit log failed (table may not exist yet):', logErr.message);
    }

    res.json({ record, analysis: structuredAnalysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
