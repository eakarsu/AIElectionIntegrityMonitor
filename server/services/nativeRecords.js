const User = require('../models/User');
const BallotCount = require('../models/BallotCount');
const VoterRegistration = require('../models/VoterRegistration');
const CampaignFinance = require('../models/CampaignFinance');
const Redistricting = require('../models/Redistricting');
const BallotCureDraft = require('../models/BallotCureDraft');
const collections = {
  'ballot-counts': BallotCount, 'voter-registration': VoterRegistration,
  'campaign-finance': CampaignFinance, redistricting: Redistricting,
  'ballot-cure-queue': BallotCureDraft
};
const capabilities = Object.freeze({ read: true, create: false, edit: false, delete: false, analyze: false,
  reason: 'Read-only jurisdiction records. Legacy mutations and outreach remain quarantined; use the AI workspace for advisory review.' });
async function nativeReadContext(req, res, next) {
  try {
    const actor = await User.findByPk(req.user?.id, { attributes: ['id', 'email', 'role', 'jurisdiction_id'] });
    if (!actor || actor.email !== req.user.email || actor.role !== req.user.role) return res.status(401).json({ error: 'Sign in again; the authenticated account has changed.' });
    if ((actor.jurisdiction_id || null) !== (req.user.jurisdiction_id || null)) return res.status(403).json({ error: 'Sign in again; the jurisdiction context has changed.' });
    req.actor = actor;
    next();
  } catch (error) { next(error); }
}
const recordScope = actor => actor.jurisdiction_id || 'local-demo-actor:' + actor.id;
const scopeWhere = actor => actor.jurisdiction_id ? { jurisdiction_id: actor.jurisdiction_id } : { jurisdiction_id: recordScope(actor), created_by: actor.id, is_demo: true };
module.exports = { collections, capabilities, nativeReadContext, recordScope, scopeWhere };
