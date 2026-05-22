import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BallotCountPage from './pages/BallotCountPage';
import RedistrictingPage from './pages/RedistrictingPage';
import VoterRegistrationPage from './pages/VoterRegistrationPage';
import CampaignFinancePage from './pages/CampaignFinancePage';
import BallotIntegrityCheckPage from './pages/BallotIntegrityCheckPage';
import CampaignFinanceAnalysisPage from './pages/CampaignFinanceAnalysisPage';
import VoterRegistrationAuditPage from './pages/VoterRegistrationAuditPage';
import GerrymanderingAnalysisPage from './pages/GerrymanderingAnalysisPage';
import BallotCureQueuePage from './pages/BallotCureQueuePage';

import Batch03Features from './pages/Batch03Features';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    }
  }, [token]);

  const handleLogin = (loginData) => {
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    setToken(loginData.token);
    setUser(loginData.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pageMap = {
    dashboard: <Dashboard onNavigate={setCurrentPage} />,
    'ballot-counts': <BallotCountPage />,
    redistricting: <RedistrictingPage />,
    'voter-registration': <VoterRegistrationPage />,
    'campaign-finance': <CampaignFinancePage />,
    'ai-ballot-integrity': <BallotIntegrityCheckPage />,
    'ai-campaign-finance': <CampaignFinanceAnalysisPage />,
    'ai-voter-audit': <VoterRegistrationAuditPage />,
    'ai-gerrymandering': <GerrymanderingAnalysisPage />,
    'ballot-cure-queue': <BallotCureQueuePage />
  };

  const pageTitles = {
    dashboard: 'Dashboard',
    'ballot-counts': 'Ballot Counting Verification',
    redistricting: 'Redistricting Fairness Analysis',
    'voter-registration': 'Voter Registration Anomaly Detection',
    'campaign-finance': 'Campaign Finance Tracking',
    'ai-ballot-integrity': 'AI Ballot Integrity Check',
    'ai-campaign-finance': 'AI Campaign Finance Analysis',
    'ai-voter-audit': 'AI Voter Registration Audit',
    'ai-gerrymandering': 'AI Gerrymandering Analysis',
    'ballot-cure-queue': 'Ballot Cure Queue'
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ballot-counts', label: 'Ballot Verification', icon: '🗳️' },
    { id: 'redistricting', label: 'Redistricting', icon: '🗺️' },
    { id: 'voter-registration', label: 'Voter Registration', icon: '📋' },
    { id: 'campaign-finance', label: 'Campaign Finance', icon: '💰' },
    { id: 'ai-ballot-integrity', label: 'AI Ballot Integrity', icon: '🤖' },
    { id: 'ai-campaign-finance', label: 'AI Finance Analysis', icon: '🔍' },
    { id: 'ai-voter-audit', label: 'AI Voter Audit', icon: '🧾' },
    { id: 'ai-gerrymandering', label: 'AI Gerrymandering', icon: '🧭' },
    { id: 'ballot-cure-queue', label: 'Ballot Cure Queue', icon: '📬' }
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🛡️ Election Monitor</h2>
          <p>AI Integrity System</p>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0] || 'U'}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="top-bar">
          <h1>{pageTitles[currentPage]}</h1>
          <div className="top-bar-actions">
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Welcome, {user?.name}</span>
          </div>
        </div>
        <div className="page-content animate-in" key={currentPage}>
          {pageMap[currentPage]}
        </div>
      </main>
    </div>
  );
}
