const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, party_affiliation: user.party_affiliation, jurisdiction_id: user.jurisdiction_id }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    if (process.env.ALLOW_SELF_REGISTRATION !== 'true' || process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Self-registration is disabled; use an authorized administrator' });
    }
    const { name, email, password, jurisdiction_id } = req.body;
    if (!name || !email || !password || !jurisdiction_id) {
      return res.status(400).json({ error: 'name, email, password and jurisdiction_id are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: 'viewer',
      party_affiliation: 'N',
      jurisdiction_id
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, party_affiliation: user.party_affiliation, jurisdiction_id: user.jurisdiction_id }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'name', 'role', 'party_affiliation', 'jurisdiction_id']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
