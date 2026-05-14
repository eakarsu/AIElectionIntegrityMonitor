// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated frontend page (lean v0). Wires Custom Feature Suggestions
// and Gap endpoints (AI counterparts + non-AI features) to backend routes.
import React, { useState } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || 'http://localhost:4000/api';

const FEATURES = [
  { kind: 'cfs', slug: 'cf-precinct-anomaly-detection', label: 'Precinct anomaly detection', desc: 'Statistical model expected vs. reported votes', endpoint: '/cf-precinct-anomaly-detection' },
  { kind: 'cfs', slug: 'cf-agentic-investigator', label: 'Agentic investigator', desc: 'NL query → historical-data analysis', endpoint: '/cf-agentic-investigator' },
  { kind: 'cfs', slug: 'cf-public-transparency-portal', label: 'Public transparency portal', desc: 'Real-time ballot tracking with media access', endpoint: '/cf-public-transparency-portal' },
  { kind: 'cfs', slug: 'cf-multi-language-voter-guides', label: 'Multi-language voter guides', desc: 'AI-translated registration / how-to-vote content', endpoint: '/cf-multi-language-voter-guides' },
  { kind: 'cfs', slug: 'cf-security-checklist-agent', label: 'Security checklist agent', desc: 'Pre/day-of/post-election compliance steps', endpoint: '/cf-security-checklist-agent' },
  { kind: 'cfs', slug: 'cf-observer-network-management', label: 'Observer-network management', desc: 'Recruit, schedule, communicate', endpoint: '/cf-observer-network-management' },
  { kind: 'gap-ai', slug: 'gap-ai-no-precinct-level-benford-style-statistical-anomaly-model', label: 'No precinct-level Benford-style statistical anomaly model', desc: 'No precinct-level Benford-style statistical anomaly model', endpoint: '/gap-no-precinct-level-benford-style-statistical-anomaly-model' },
  { kind: 'gap-ai', slug: 'gap-ai-no-machine-learning-duplicate-registration-matcher', label: 'No machine-learning duplicate-registration matcher', desc: 'No machine-learning duplicate-registration matcher', endpoint: '/gap-no-machine-learning-duplicate-registration-matcher' },
  { kind: 'gap-ai', slug: 'gap-ai-no-multilingual-voter-guide-generation', label: 'No multilingual voter-guide generation', desc: 'No multilingual voter-guide generation', endpoint: '/gap-no-multilingual-voter-guide-generation' },
  { kind: 'gap-non', slug: 'gap-non-no-webhooks-no-sos-push-delivery', label: 'No webhooks (no SOS push delivery)', desc: 'No webhooks (no SOS push delivery)', endpoint: '/gap-no-webhooks-no-sos-push-delivery' },
  { kind: 'gap-non', slug: 'gap-non-no-search-endpoint-no-full-text-query', label: 'No search endpoint (no full-text query)', desc: 'No search endpoint (no full-text query)', endpoint: '/gap-no-search-endpoint-no-full-text-query' },
  { kind: 'gap-non', slug: 'gap-non-no-file-upload-module-no-scanned-ballot-ingest', label: 'No file-upload module (no scanned-ballot ingest)', desc: 'No file-upload module (no scanned-ballot ingest)', endpoint: '/gap-no-file-upload-module-no-scanned-ballot-ingest' },
  { kind: 'gap-non', slug: 'gap-non-limited-observer-network-scheduling', label: 'Limited observer-network scheduling', desc: 'Limited observer-network scheduling', endpoint: '/gap-limited-observer-network-scheduling' },
  { kind: 'gap-non', slug: 'gap-non-no-payment-donation-processing-campaign-finance-side', label: 'No payment/donation processing (campaign-finance side)', desc: 'No payment/donation processing (campaign-finance side)', endpoint: '/gap-no-payment-donation-processing-campaign-finance-side' },
];

function authHeaders() {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export default function Batch03Features() {
  const [active, setActive] = useState(FEATURES[0]?.slug);
  const [input, setInput] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const current = FEATURES.find(f => f.slug === active) || FEATURES[0];

  async function run() {
    if (!current) return;
    setLoading(true); setError(null);
    try {
      let parsed;
      try { parsed = input ? JSON.parse(input) : {}; } catch { parsed = { input }; }
      const r = await fetch(`${API_BASE}${current.endpoint}`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed)
      });
      let body; try { body = await r.json(); } catch { body = { raw: await r.text() }; }
      if (!r.ok) setError(body.error || `HTTP ${r.status}`);
      setResults(prev => ({ ...prev, [current.slug]: body }));
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>Batch 03 Features <small style={{ color: '#64748b', fontWeight: 400 }}>(AIElectionIntegrityMonitor)</small></h2>
      <p style={{ color: '#475569', maxWidth: 720 }}>
        Audit-driven AI counterparts, non-AI feature gaps, and custom feature suggestions.
        Backend endpoints prefixed <code>/api/cf-*</code> (custom features) and <code>/api/gap-*</code> (gap fills).
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {FEATURES.map(f => (
          <button key={f.slug} onClick={() => setActive(f.slug)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1',
                     background: active === f.slug ? '#1e40af' : '#f8fafc',
                     color: active === f.slug ? 'white' : '#0f172a', cursor: 'pointer', fontSize: 12 }}>
            <span style={{ opacity: 0.7, marginRight: 4 }}>[{f.kind}]</span>{f.label}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{current.label}</strong>
            <div style={{ color: '#475569', fontSize: 13 }}>{current.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>POST <code>{current.endpoint}</code></div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder='Optional JSON input (e.g. {"query":"..."})'
            style={{ width: '100%', minHeight: 80, padding: 8, fontFamily: 'monospace', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run} disabled={loading}
              style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
          {error && (<div style={{ marginTop: 12, padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>{error}</div>)}
          {results[current.slug] && (
            <pre style={{ marginTop: 12, padding: 10, background: '#0b1020', color: '#cbd5e1', borderRadius: 4, overflow: 'auto', maxHeight: 360, fontSize: 12 }}>
              {typeof results[current.slug] === 'string' ? results[current.slug] : JSON.stringify(results[current.slug], null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
