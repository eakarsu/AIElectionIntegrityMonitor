import React, { useState, useEffect } from 'react';
import { campaignFinance } from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const statusBadge = (status) => {
  const map = { compliant: 'badge-success', minor_violations: 'badge-warning', major_violations: 'badge-danger', under_audit: 'badge-info', flagged: 'badge-danger' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace(/_/g, ' ')}</span>;
};

const formatCurrency = (val) => {
  const num = Number(val);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
};

const emptyForm = {
  candidateName: '', party: '', office: '', state: '', totalContributions: '',
  totalExpenditures: '', individualDonations: '', pacContributions: '',
  foreignFlaggedDonations: '0', largestSingleDonation: '', reportingPeriod: '',
  complianceStatus: 'compliant', notes: ''
};

export default function CampaignFinancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    campaignFinance.getAll().then(setRecords).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (record) => { setSelected(record); setEditing(false); setShowForm(false); };
  const handleNew = () => { setFormData(emptyForm); setEditing(false); setShowForm(true); setSelected(null); };

  const handleEdit = () => {
    setFormData({
      candidateName: selected.candidateName, party: selected.party, office: selected.office,
      state: selected.state, totalContributions: selected.totalContributions,
      totalExpenditures: selected.totalExpenditures, individualDonations: selected.individualDonations,
      pacContributions: selected.pacContributions, foreignFlaggedDonations: selected.foreignFlaggedDonations,
      largestSingleDonation: selected.largestSingleDonation, reportingPeriod: selected.reportingPeriod,
      complianceStatus: selected.complianceStatus, notes: selected.notes || ''
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, totalContributions: Number(formData.totalContributions), totalExpenditures: Number(formData.totalExpenditures), individualDonations: Number(formData.individualDonations), pacContributions: Number(formData.pacContributions), foreignFlaggedDonations: Number(formData.foreignFlaggedDonations), largestSingleDonation: Number(formData.largestSingleDonation) };
      if (editing && selected) { await campaignFinance.update(selected.id, payload); }
      else { await campaignFinance.create(payload); }
      setShowForm(false); setSelected(null); load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try { await campaignFinance.delete(deleteTarget.id); setDeleteTarget(null); setSelected(null); load(); }
    catch (err) { alert(err.message); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await campaignFinance.analyze(selected.id);
      setSelected({ ...selected, aiAnalysis: result.analysis });
    } catch (err) { alert(err.message); }
    setAnalyzing(false);
  };

  if (loading) return <div className="ai-loading"><div className="ai-spinner"></div>Loading records...</div>;

  if (selected && !showForm) {
    return (
      <div className="animate-in">
        <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setSelected(null)}>← Back to List</button>
          <button className="btn btn-primary" onClick={handleEdit}>✏️ Edit</button>
          <button className="btn btn-danger" onClick={() => setDeleteTarget(selected)}>🗑️ Delete</button>
        </div>
        <div className="data-table-container">
          <div className="table-header">
            <h2>{selected.candidateName} ({selected.party})</h2>
            {statusBadge(selected.complianceStatus)}
          </div>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Candidate</div><div className="detail-value">{selected.candidateName}</div></div>
              <div className="detail-item"><div className="detail-label">Party</div><div className="detail-value">{selected.party}</div></div>
              <div className="detail-item"><div className="detail-label">Office</div><div className="detail-value">{selected.office}</div></div>
              <div className="detail-item"><div className="detail-label">State</div><div className="detail-value">{selected.state}</div></div>
              <div className="detail-item"><div className="detail-label">Total Contributions</div><div className="detail-value">${Number(selected.totalContributions).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Total Expenditures</div><div className="detail-value">${Number(selected.totalExpenditures).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Individual Donations</div><div className="detail-value">{selected.individualDonations?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">PAC Contributions</div><div className="detail-value">${Number(selected.pacContributions).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Foreign-Flagged</div><div className="detail-value" style={{ color: selected.foreignFlaggedDonations > 0 ? 'var(--accent)' : 'var(--success)' }}>{selected.foreignFlaggedDonations}</div></div>
              <div className="detail-item"><div className="detail-label">Largest Donation</div><div className="detail-value">${Number(selected.largestSingleDonation).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Reporting Period</div><div className="detail-value">{selected.reportingPeriod}</div></div>
              <div className="detail-item"><div className="detail-label">Balance</div><div className="detail-value" style={{ color: Number(selected.totalExpenditures) > Number(selected.totalContributions) ? 'var(--accent)' : 'var(--success)' }}>${(Number(selected.totalContributions) - Number(selected.totalExpenditures)).toLocaleString()}</div></div>
            </div>
            {selected.notes && <div className="detail-item"><div className="detail-label">Notes</div><div className="detail-value" style={{ fontSize: 14, fontWeight: 400 }}>{selected.notes}</div></div>}
            <AIAnalysisPanel analysis={selected.aiAnalysis} loading={analyzing} onAnalyze={handleAnalyze} />
          </div>
        </div>
        {deleteTarget && <ConfirmDialog title="Delete Record" message={`Delete finance record for ${deleteTarget.candidateName}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="animate-in">
        <button className="btn btn-outline" onClick={() => { setShowForm(false); if (editing && selected) setSelected(selected); }} style={{ marginBottom: 20 }}>← Cancel</button>
        <div className="data-table-container">
          <div className="table-header"><h2>{editing ? 'Edit' : 'New'} Campaign Finance Record</h2></div>
          <div style={{ padding: 24 }}>
            <div className="form-row">
              <div className="form-group"><label>Candidate Name</label><input value={formData.candidateName} onChange={e => setFormData({...formData, candidateName: e.target.value})} /></div>
              <div className="form-group"><label>Party</label><select value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})}><option value="">Select...</option><option value="Democratic">Democratic</option><option value="Republican">Republican</option><option value="Independent">Independent</option><option value="Libertarian">Libertarian</option><option value="Green">Green</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Office</label><input value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})} placeholder="e.g., US Senate, US House, Governor" /></div>
              <div className="form-group"><label>State</label><input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Total Contributions ($)</label><input type="number" value={formData.totalContributions} onChange={e => setFormData({...formData, totalContributions: e.target.value})} /></div>
              <div className="form-group"><label>Total Expenditures ($)</label><input type="number" value={formData.totalExpenditures} onChange={e => setFormData({...formData, totalExpenditures: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Individual Donations (count)</label><input type="number" value={formData.individualDonations} onChange={e => setFormData({...formData, individualDonations: e.target.value})} /></div>
              <div className="form-group"><label>PAC Contributions ($)</label><input type="number" value={formData.pacContributions} onChange={e => setFormData({...formData, pacContributions: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Foreign-Flagged Donations</label><input type="number" value={formData.foreignFlaggedDonations} onChange={e => setFormData({...formData, foreignFlaggedDonations: e.target.value})} /></div>
              <div className="form-group"><label>Largest Single Donation ($)</label><input type="number" value={formData.largestSingleDonation} onChange={e => setFormData({...formData, largestSingleDonation: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Reporting Period</label><input value={formData.reportingPeriod} onChange={e => setFormData({...formData, reportingPeriod: e.target.value})} placeholder="e.g., Q3 2024" /></div>
              <div className="form-group"><label>Compliance Status</label><select value={formData.complianceStatus} onChange={e => setFormData({...formData, complianceStatus: e.target.value})}><option value="compliant">Compliant</option><option value="minor_violations">Minor Violations</option><option value="major_violations">Major Violations</option><option value="under_audit">Under Audit</option><option value="flagged">Flagged</option></select></div>
            </div>
            <div className="form-group"><label>Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <button className="btn btn-success btn-lg" onClick={handleSave}>{editing ? 'Update' : 'Create'} Record</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="data-table-container">
        <div className="table-header">
          <h2>Campaign Finance Records ({records.length})</h2>
          <button className="btn btn-success" onClick={handleNew}>+ New Record</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Candidate</th><th>Party</th><th>Office</th><th>State</th><th>Contributions</th><th>Foreign Flags</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} onClick={() => handleRowClick(r)}>
                <td style={{ fontWeight: 600 }}>{r.candidateName}</td>
                <td>{r.party}</td>
                <td>{r.office}</td>
                <td>{r.state}</td>
                <td>{formatCurrency(r.totalContributions)}</td>
                <td style={{ color: r.foreignFlaggedDonations > 0 ? 'var(--accent)' : 'inherit', fontWeight: r.foreignFlaggedDonations > 0 ? 700 : 400 }}>{r.foreignFlaggedDonations}</td>
                <td>{statusBadge(r.complianceStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
