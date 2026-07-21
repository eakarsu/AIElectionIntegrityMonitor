const crypto = require('crypto');

const STATES = Object.freeze({ intake: ['triaged', 'dismissed'], triaged: ['in_review', 'dismissed'], in_review: ['approved', 'returned'], returned: ['triaged'], approved: ['published'], dismissed: [], published: [] });
class IntegrityError extends Error { constructor(message, code = 'INVALID_INTEGRITY_CASE') { super(message); this.code = code; } }
const clean = (v, field, max = 2000) => { const s = String(v || '').trim(); if (!s) throw new IntegrityError(`${field} is required`); if (s.length > max) throw new IntegrityError(`${field} is too long`); return s; };

function validateSignal(input, allowedHosts = []) {
  const url = new URL(clean(input.source_url, 'source_url', 2000));
  if (url.protocol !== 'https:') throw new IntegrityError('source_url must use HTTPS');
  if (allowedHosts.length && !allowedHosts.includes(url.hostname)) throw new IntegrityError('source host is not authorized');
  const serialized = JSON.stringify(input);
  if (/\b(voter[_ -]?id|social security|ssn|date of birth)\b/i.test(serialized)) throw new IntegrityError('individual voter identifiers are prohibited');
  const uncertainty = Number(input.uncertainty);
  if (!Number.isFinite(uncertainty) || uncertainty < 0 || uncertainty > 1) throw new IntegrityError('uncertainty must be between 0 and 1');
  return {
    source_url: url.toString(), source_type: clean(input.source_type, 'source_type', 80),
    source_published_at: clean(input.source_published_at, 'source_published_at', 40),
    jurisdiction: clean(input.jurisdiction, 'jurisdiction', 100), signal_type: clean(input.signal_type, 'signal_type', 100),
    observed_facts: clean(input.observed_facts, 'observed_facts', 5000), baseline: clean(input.baseline, 'baseline', 2000),
    uncertainty, languages: Array.isArray(input.languages) ? input.languages.slice(0, 20) : [],
    checksum: clean(input.checksum, 'checksum', 128),
  };
}

function assertTransition(from, to) { if (!(STATES[from] || []).includes(to)) throw new IntegrityError(`transition ${from} -> ${to} is not allowed`, 'INVALID_TRANSITION'); }
function assertClaimLanguage(text) {
  if (/\b(fraud|rigged|stolen election|illegal voter)\b/i.test(String(text || ''))) throw new IntegrityError('unsupported fraud conclusions are prohibited; record observed facts and uncertainty');
}
function hasBipartisanApproval(signoffs) {
  const approvers = signoffs.filter((s) => s.decision === 'approve');
  const actors = new Set(approvers.map((s) => String(s.actor_id)));
  const affiliations = new Set(approvers.map((s) => s.party_affiliation).filter(Boolean));
  return actors.size >= 2 && (affiliations.size >= 2 || (affiliations.size === 1 && affiliations.has('N')));
}
function fingerprint(signal) { return crypto.createHash('sha256').update(JSON.stringify(signal)).digest('hex'); }
module.exports = { IntegrityError, validateSignal, assertTransition, assertClaimLanguage, hasBipartisanApproval, fingerprint };
