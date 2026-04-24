const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function queryAI(prompt, systemPrompt = '') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Election Integrity Monitor'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
            return;
          }
          const content = parsed.choices?.[0]?.message?.content || 'No response generated';
          resolve({
            content,
            model: parsed.model,
            usage: parsed.usage
          });
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
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

Provide analysis covering:
1. Turnout anomaly assessment
2. Machine vs hand count discrepancy evaluation
3. Statistical outlier check
4. Risk level (Low/Medium/High/Critical)
5. Recommended actions`;

  return queryAI(prompt, 'You are an expert election integrity analyst. Provide thorough, impartial analysis of ballot counting data. Focus on statistical anomalies and potential irregularities.');
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

Analyze for:
1. Potential gerrymandering indicators
2. Minority representation impact
3. Compactness assessment
4. Community of interest preservation
5. Overall fairness rating (1-10)
6. Recommendations`;

  return queryAI(prompt, 'You are a nonpartisan redistricting fairness analyst. Evaluate district proposals based on legal standards, fairness principles, and demographic equity.');
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

Analyze for:
1. Anomaly pattern assessment
2. Duplicate registration concern level
3. Deceased voter roll comparison
4. Address verification issues
5. Risk classification (Low/Medium/High/Critical)
6. Recommended investigation steps`;

  return queryAI(prompt, 'You are a voter registration integrity specialist. Analyze registration data for anomalies while being mindful of legitimate explanations for data patterns.');
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

Analyze for:
1. Contribution limit compliance
2. Source of funds assessment
3. Foreign donation concerns
4. Expenditure pattern analysis
5. Dark money indicators
6. Compliance risk level (Low/Medium/High/Critical)
7. Recommended audit actions`;

  return queryAI(prompt, 'You are a campaign finance compliance expert. Analyze financial records for FEC compliance, potential violations, and suspicious patterns.');
}

module.exports = {
  queryAI,
  analyzeBallotCount,
  analyzeRedistricting,
  analyzeVoterRegistration,
  analyzeCampaignFinance
};
