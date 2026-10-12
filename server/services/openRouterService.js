require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { parseAIJson } = require('../utils/parseAIJson');

async function queryAI(prompt, systemPrompt = '', { signal } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw Object.assign(new Error('OpenRouter is not configured.'), { statusCode: 503 });
  const response = await fetch((process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'AI Election Integrity Monitor' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt + ' Fictional training records are exercises, not actual election evidence; do not certify outcomes or make unsupported fraud claims.' }] : []), { role: 'user', content: prompt }],
      max_tokens: 2000, temperature: 0.3 })
  });
  let body;
  try { body = await response.json(); } catch { throw Object.assign(new Error('OpenRouter returned an unreadable response.'), { statusCode: 502 }); }
  if (!response.ok || body.error) throw Object.assign(new Error('OpenRouter could not complete this request. Check provider configuration and try again.'), { statusCode: 502 });
  const choice = body.choices?.[0], content = choice?.message?.content;
  if (choice?.message?.refusal || ['length','content_filter'].includes(choice?.finish_reason) || typeof content !== 'string' || !content.trim()) throw Object.assign(new Error('OpenRouter did not return a complete usable answer.'), { statusCode: 502 });
  if (signal?.aborted) throw Object.assign(new Error('Request cancelled.'), { name: 'AbortError' });
  return { content, model: body.model, usage: body.usage };
}

// Backwards-compat wrapper around shared 3-strategy parser. Throws on total failure
// to preserve original semantics for callers that catch and provide fallbacks.
function cleanJsonResponse(content) {
  const parsed = parseAIJson(content);
  if (parsed && parsed.parseError) {
    throw new Error(parsed.parseError);
  }
  return parsed;
}

async function analyzeBallotCount(record) {
  const prompt = `Analyze this ballot counting record for potential irregularities:
- Precinct: ${record.precinct}, County: ${record.county}, State: ${record.state}
- Election Date: ${record.electionDate}
- Registered Voters: ${record.registeredVoters}
- Total Ballots Cast: ${record.totalBallotsCast}
- Machine Count: ${record.machineCount}
- Hand Count: ${record.handCount || 'N/A'}
- Current Discrepancy: ${record.discrepancy}
- Turnout Rate: ${((record.totalBallotsCast / record.registeredVoters) * 100).toFixed(1)}%

Respond ONLY with valid JSON in this exact format:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief summary of findings",
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

  const result = await queryAI(prompt, 'You are an expert election integrity analyst. Provide thorough, impartial analysis of ballot counting data. Return only valid JSON.');
  try {
    result.parsedContent = cleanJsonResponse(result.content);
  } catch (e) {
    result.parsedContent = { risk_level: 'Unknown', confidence: 0, summary: result.content, flags: [], recommended_actions: [] };
  }
  return result;
}

async function analyzeRedistricting(record) {
  const prompt = `Analyze this redistricting proposal for fairness:
- District: ${record.districtName}, State: ${record.state}
- Proposed By: ${record.proposedBy}
- Population: ${record.population.toLocaleString()}
- Minority Population: ${record.minorityPopulationPct}%
- Compactness Score: ${record.compactnessScore}
- Contiguity: ${record.contiguityCheck ? 'Yes' : 'No'}
- Competitiveness Index: ${record.competitivenessIndex}
- Current Fairness Score: ${record.fairnessScore || 'Not scored'}

Respond ONLY with valid JSON in this exact format:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief summary of findings",
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

  const result = await queryAI(prompt, 'You are a nonpartisan redistricting fairness analyst. Evaluate district proposals based on legal standards, fairness principles, and demographic equity. Return only valid JSON.');
  try {
    result.parsedContent = cleanJsonResponse(result.content);
  } catch (e) {
    result.parsedContent = { risk_level: 'Unknown', confidence: 0, summary: result.content, flags: [], recommended_actions: [] };
  }
  return result;
}

async function analyzeVoterRegistration(record) {
  const prompt = `Analyze this voter registration data for anomalies:
- County: ${record.county}, State: ${record.state}
- Registration Type: ${record.registrationType}
- Total Registrations: ${record.totalRegistrations}
- Flagged Records: ${record.flaggedRecords}
- Duplicate Records: ${record.duplicateRecords}
- Deceased Matches: ${record.deceasedMatches}
- Address Mismatches: ${record.addressMismatches}
- Current Anomaly Score: ${record.anomalyScore}
- Flag Rate: ${((record.flaggedRecords / record.totalRegistrations) * 100).toFixed(2)}%

Respond ONLY with valid JSON in this exact format:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief summary of findings",
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

  const result = await queryAI(prompt, 'You are a voter registration integrity specialist. Analyze registration data for anomalies while being mindful of legitimate explanations for data patterns. Return only valid JSON.');
  try {
    result.parsedContent = cleanJsonResponse(result.content);
  } catch (e) {
    result.parsedContent = { risk_level: 'Unknown', confidence: 0, summary: result.content, flags: [], recommended_actions: [] };
  }
  return result;
}

async function analyzeCampaignFinance(record) {
  const prompt = `Analyze this campaign finance record for compliance and anomalies:
- Candidate: ${record.candidateName} (${record.party})
- Office: ${record.office}, State: ${record.state}
- Total Contributions: $${Number(record.totalContributions).toLocaleString()}
- Total Expenditures: $${Number(record.totalExpenditures).toLocaleString()}
- Individual Donations: ${record.individualDonations}
- PAC Contributions: $${Number(record.pacContributions).toLocaleString()}
- Foreign-Flagged Donations: ${record.foreignFlaggedDonations}
- Largest Single Donation: $${Number(record.largestSingleDonation).toLocaleString()}
- Reporting Period: ${record.reportingPeriod}

Respond ONLY with valid JSON in this exact format:
{
  "risk_level": "Low|Medium|High|Critical",
  "confidence": 0-100,
  "summary": "brief summary of findings",
  "flags": ["flag1", "flag2"],
  "recommended_actions": ["action1", "action2"]
}`;

  const result = await queryAI(prompt, 'You are a campaign finance compliance expert. Analyze financial records for FEC compliance, potential violations, and suspicious patterns. Return only valid JSON.');
  try {
    result.parsedContent = cleanJsonResponse(result.content);
  } catch (e) {
    result.parsedContent = { risk_level: 'Unknown', confidence: 0, summary: result.content, flags: [], recommended_actions: [] };
  }
  return result;
}

module.exports = {
  queryAI,
  cleanJsonResponse,
  analyzeBallotCount,
  analyzeRedistricting,
  analyzeVoterRegistration,
  analyzeCampaignFinance
};
