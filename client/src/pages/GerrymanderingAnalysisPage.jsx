import React, { useState } from 'react';
import { ai } from '../services/api';

const riskBadge = (level) => {
  const map = {
    Low: 'badge-success',
    Medium: 'badge-warning',
    High: 'badge-danger',
    Critical: 'badge-danger'
  };
  return <span className={`badge ${map[level] || 'badge-neutral'}`}>{level || 'unknown'}</span>;
};

export default function GerrymanderingAnalysisPage() {
  const [form, setForm] = useState({ state: '', district_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state.trim()) {
      setError('State is required.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const payload = { state: form.state.trim() };
      if (form.district_name.trim()) payload.district_name = form.district_name.trim();
      const data = await ai.gerrymanderingAnalysis(payload);
      setResult(data);
    } catch (err) {
      const msg = err.message || 'Request failed.';
      if (/unavailable|503/i.test(msg)) {
        setError('AI service unavailable — OPENROUTER_API_KEY is not configured on the server.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis || {};

  return (
    <div className="animate-in">
      <div className="data-table-container" style={{ marginBottom: 20 }}>
        <div className="table-header">
          <h2>🗺️ Gerrymandering Analysis</h2>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>
            Run AI partisan-bias / compactness analysis over redistricting proposals.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>State (required)</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. TX"
                />
              </div>
              <div className="form-group">
                <label>District Name (optional)</label>
                <input
                  value={form.district_name}
                  onChange={(e) => setForm({ ...form, district_name: e.target.value })}
                  placeholder="e.g. District 23"
                />
              </div>
            </div>
            {error && (
              <div className="badge badge-danger" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : '🤖 Run Gerrymandering Analysis'}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="ai-analysis-container">
          <div className="ai-analysis-header">
            <span>🤖</span>
            <h3>AI Analysis</h3>
          </div>
          <div className="ai-loading">
            <div className="ai-spinner"></div>
            Generating gerrymandering analysis...
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="data-table-container">
          <div className="table-header">
            <h2>Analysis Result</h2>
            {analysis.risk_level && riskBadge(analysis.risk_level)}
          </div>
          <div style={{ padding: 24 }}>
            <div className="detail-grid" style={{ marginBottom: 20 }}>
              <div className="detail-item">
                <div className="detail-label">State</div>
                <div className="detail-value">{result.state}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">District</div>
                <div className="detail-value">{result.district_name || 'All'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Records</div>
                <div className="detail-value">{result.record_count}</div>
              </div>
              {analysis.confidence !== undefined && (
                <div className="detail-item">
                  <div className="detail-label">Confidence</div>
                  <div className="detail-value">{analysis.confidence}%</div>
                </div>
              )}
            </div>

            {analysis.summary && (
              <div className="detail-item" style={{ marginBottom: 16 }}>
                <div className="detail-label">Summary</div>
                <div className="detail-value" style={{ fontSize: 14, fontWeight: 400 }}>
                  {analysis.summary}
                </div>
              </div>
            )}

            {Array.isArray(analysis.indicators) && analysis.indicators.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="detail-label" style={{ marginBottom: 8 }}>
                  Indicators ({analysis.indicators.length})
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.indicators.map((a, i) => (
                      <tr key={i}>
                        <td>{a.district || '—'}</td>
                        <td>{a.type || '—'}</td>
                        <td>{riskBadge(a.severity)}</td>
                        <td>{a.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {Array.isArray(analysis.flags) && analysis.flags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="detail-label" style={{ marginBottom: 8 }}>Flags</div>
                <ul>
                  {analysis.flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {Array.isArray(analysis.recommended_actions) && analysis.recommended_actions.length > 0 && (
              <div>
                <div className="detail-label" style={{ marginBottom: 8 }}>Recommended Actions</div>
                <ul>
                  {analysis.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {analysis.raw && (
              <pre style={{
                background: 'var(--bg-secondary, #f4f4f5)',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflow: 'auto',
                marginTop: 12
              }}>{analysis.raw}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
