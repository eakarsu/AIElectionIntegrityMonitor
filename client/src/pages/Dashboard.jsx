import React, { useState, useEffect } from 'react';
import { dashboard } from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ai-loading"><div className="ai-spinner"></div>Loading dashboard...</div>;

  const statCards = [
    {
      title: 'Ballot Verifications',
      total: stats?.ballotCounts?.total || 0,
      flagged: stats?.ballotCounts?.flagged || 0,
      icon: '🗳️',
      color: 'blue',
      page: 'ballot-counts',
      flagLabel: 'Flagged'
    },
    {
      title: 'Redistricting Reviews',
      total: stats?.redistricting?.total || 0,
      flagged: stats?.redistricting?.flagged || 0,
      icon: '🗺️',
      color: 'green',
      page: 'redistricting',
      flagLabel: 'Issues'
    },
    {
      title: 'Voter Registrations',
      total: stats?.voterRegistrations?.total || 0,
      flagged: stats?.voterRegistrations?.anomalies || 0,
      icon: '📋',
      color: 'yellow',
      page: 'voter-registration',
      flagLabel: 'Anomalies'
    },
    {
      title: 'Campaign Finance',
      total: stats?.campaignFinances?.total || 0,
      flagged: stats?.campaignFinances?.flagged || 0,
      icon: '💰',
      color: 'red',
      page: 'campaign-finance',
      flagLabel: 'Violations'
    }
  ];

  return (
    <div>
      {/* Alert Banner */}
      {stats?.totalAlerts > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
          border: '1px solid #feb2b2',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
              {stats.totalAlerts} Active Alerts Require Attention
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
              Review flagged items across all monitoring categories
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="dashboard-grid">
        {statCards.map(card => (
          <div key={card.page} className="stat-card" onClick={() => onNavigate(card.page)}>
            <div className="stat-card-header">
              <div>
                <h3>{card.title}</h3>
                <div className="stat-number">{card.total}</div>
                <div className="stat-detail">
                  {card.flagged > 0 ? (
                    <span className="stat-alert">{card.flagged} {card.flagLabel}</span>
                  ) : (
                    <span>All Clear</span>
                  )}
                </div>
              </div>
              <div className={`stat-card-icon ${card.color}`}>
                <span>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>
        Monitoring Modules
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
        Click any module to access detailed records and AI-powered analysis
      </p>

      <div className="feature-cards">
        <div className="feature-card ballot" onClick={() => onNavigate('ballot-counts')}>
          <div className="feature-card-icon">🗳️</div>
          <h3>Ballot Counting Verification</h3>
          <p>Automated verification of machine vs. hand counts, turnout anomaly detection, and statistical analysis of ballot counting discrepancies across precincts.</p>
          <div className="feature-stats">
            <div className="feature-stat">
              <div className="feature-stat-value">{stats?.ballotCounts?.total || 0}</div>
              <div className="feature-stat-label">Records</div>
            </div>
            <div className="feature-stat">
              <div className="feature-stat-value" style={{ color: 'var(--accent)' }}>{stats?.ballotCounts?.flagged || 0}</div>
              <div className="feature-stat-label">Flagged</div>
            </div>
          </div>
        </div>

        <div className="feature-card redistricting" onClick={() => onNavigate('redistricting')}>
          <div className="feature-card-icon">🗺️</div>
          <h3>Redistricting Fairness Analysis</h3>
          <p>AI-driven evaluation of district proposals for gerrymandering, compactness, contiguity, and minority representation compliance with VRA standards.</p>
          <div className="feature-stats">
            <div className="feature-stat">
              <div className="feature-stat-value">{stats?.redistricting?.total || 0}</div>
              <div className="feature-stat-label">Proposals</div>
            </div>
            <div className="feature-stat">
              <div className="feature-stat-value" style={{ color: 'var(--accent)' }}>{stats?.redistricting?.flagged || 0}</div>
              <div className="feature-stat-label">Issues</div>
            </div>
          </div>
        </div>

        <div className="feature-card voter" onClick={() => onNavigate('voter-registration')}>
          <div className="feature-card-icon">📋</div>
          <h3>Voter Registration Anomaly Detection</h3>
          <p>Pattern detection for duplicate registrations, deceased voter matches, address mismatches, and bulk registration anomalies in voter rolls.</p>
          <div className="feature-stats">
            <div className="feature-stat">
              <div className="feature-stat-value">{stats?.voterRegistrations?.total || 0}</div>
              <div className="feature-stat-label">Reports</div>
            </div>
            <div className="feature-stat">
              <div className="feature-stat-value" style={{ color: 'var(--warning)' }}>{stats?.voterRegistrations?.anomalies || 0}</div>
              <div className="feature-stat-label">Anomalies</div>
            </div>
          </div>
        </div>

        <div className="feature-card finance" onClick={() => onNavigate('campaign-finance')}>
          <div className="feature-card-icon">💰</div>
          <h3>Campaign Finance Tracking</h3>
          <p>Comprehensive monitoring of campaign contributions, expenditure patterns, PAC coordination, foreign donation flags, and FEC compliance analysis.</p>
          <div className="feature-stats">
            <div className="feature-stat">
              <div className="feature-stat-value">{stats?.campaignFinances?.total || 0}</div>
              <div className="feature-stat-label">Candidates</div>
            </div>
            <div className="feature-stat">
              <div className="feature-stat-value" style={{ color: 'var(--accent)' }}>{stats?.campaignFinances?.flagged || 0}</div>
              <div className="feature-stat-label">Violations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
