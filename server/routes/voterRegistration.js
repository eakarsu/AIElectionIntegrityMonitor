const express = require('express');
const router = express.Router();
const VoterRegistration = require('../models/VoterRegistration');
const { authenticateToken } = require('../middleware/auth');
const { analyzeVoterRegistration } = require('../services/openRouterService');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const records = await VoterRegistration.findAll({ order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await VoterRegistration.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const record = await VoterRegistration.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await VoterRegistration.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const record = await VoterRegistration.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const record = await VoterRegistration.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    const analysis = await analyzeVoterRegistration(record);
    await record.update({ aiAnalysis: analysis });
    res.json({ record, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
