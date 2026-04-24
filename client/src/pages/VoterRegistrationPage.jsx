import React, { useState, useEffect } from 'react';
import { voterRegistration } from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const statusBadge = (status) => {
  const map = { clean: 'badge-success', anomaly_detected: 'badge-warning', under_investigation: 'badge-danger', resolved: 'badge-info' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace(/_/g, ' ')}</span>;
};

const emptyForm = {
  county: '', state: '', registrationType: 'new', totalRegistrations: '',
  flaggedRecords: '0', duplicateRecords: '0', deceasedMatches: '0',
  addressMismatches: '0', reportDate: '', anomalyScore: '0', status: 'clean', notes: ''
};

export default function VoterRegistrationPage() {
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
    voterRegistration.getAll().then(setRecords).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (record) => { setSelected(record); setEditing(false); setShowForm(false); };
  const handleNew = () => { setFormData(emptyForm); setEditing(false); setShowForm(true); setSelected(null); };

  const handleEdit = () => {
    setFormData({
      county: selected.county, state: selected.state, registrationType: selected.registrationType,
      totalRegistrations: selected.totalRegistrations, flaggedRecords: selected.flaggedRecords,
      duplicateRecords: selected.duplicateRecords, deceasedMatches: selected.deceasedMatches,
      addressMismatches: selected.addressMismatches, reportDate: selected.reportDate,
      anomalyScore: selected.anomalyScore, status: selected.status, notes: selected.notes || ''
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, totalRegistrations: Number(formData.totalRegistrations), flaggedRecords: Number(formData.flaggedRecords), duplicateRecords: Number(formData.duplicateRecords), deceasedMatches: Number(formData.deceasedMatches), addressMismatches: Number(formData.addressMismatches), anomalyScore: Number(formData.anomalyScore) };
      if (editing && selected) { await voterRegistration.update(selected.id, payload); }
      else { await voterRegistration.create(payload); }
      setShowForm(false); setSelected(null); load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try { await voterRegistration.delete(deleteTarget.id); setDeleteTarget(null); setSelected(null); load(); }
    catch (err) { alert(err.message); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await voterRegistration.analyze(selected.id);
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
            <h2>{selected.county} County, {selected.state}</h2>
            {statusBadge(selected.status)}
          </div>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">County</div><div className="detail-value">{selected.county}</div></div>
              <div className="detail-item"><div className="detail-label">State</div><div className="detail-value">{selected.state}</div></div>
              <div className="detail-item"><div className="detail-label">Registration Type</div><div className="detail-value" style={{ textTransform: 'capitalize' }}>{selected.registrationType}</div></div>
              <div className="detail-item"><div className="detail-label">Total Registrations</div><div className="detail-value">{selected.totalRegistrations?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Flagged Records</div><div className="detail-value" style={{ color: selected.flaggedRecords > 500 ? 'var(--accent)' : 'inherit' }}>{selected.flaggedRecords?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Duplicate Records</div><div className="detail-value">{selected.duplicateRecords?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Deceased Matches</div><div className="detail-value" style={{ color: selected.deceasedMatches > 20 ? 'var(--accent)' : 'inherit' }}>{selected.deceasedMatches?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Address Mismatches</div><div className="detail-value">{selected.addressMismatches?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Anomaly Score</div><div className="detail-value" style={{ color: selected.anomalyScore > 7 ? 'var(--accent)' : selected.anomalyScore > 4 ? 'var(--warning)' : 'var(--success)' }}>{selected.anomalyScore}/10</div></div>
              <div className="detail-item"><div className="detail-label">Flag Rate</div><div className="detail-value">{((selected.flaggedRecords / selected.totalRegistrations) * 100).toFixed(2)}%</div></div>
            </div>
            {selected.notes && <div className="detail-item"><div className="detail-label">Notes</div><div className="detail-value" style={{ fontSize: 14, fontWeight: 400 }}>{selected.notes}</div></div>}
            <AIAnalysisPanel analysis={selected.aiAnalysis} loading={analyzing} onAnalyze={handleAnalyze} />
          </div>
        </div>
        {deleteTarget && <ConfirmDialog title="Delete Record" message={`Delete voter registration record for ${deleteTarget.county}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="animate-in">
        <button className="btn btn-outline" onClick={() => { setShowForm(false); if (editing && selected) setSelected(selected); }} style={{ marginBottom: 20 }}>← Cancel</button>
        <div className="data-table-container">
          <div className="table-header"><h2>{editing ? 'Edit' : 'New'} Voter Registration Record</h2></div>
          <div style={{ padding: 24 }}>
            <div className="form-row">
              <div className="form-group"><label>County</label><input value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})} /></div>
              <div className="form-group"><label>State</label><input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Registration Type</label><select value={formData.registrationType} onChange={e => setFormData({...formData, registrationType: e.target.value})}><option value="new">New</option><option value="update">Update</option><option value="transfer">Transfer</option><option value="purge">Purge</option><option value="reinstatement">Reinstatement</option></select></div>
              <div className="form-group"><label>Total Registrations</label><input type="number" value={formData.totalRegistrations} onChange={e => setFormData({...formData, totalRegistrations: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Flagged Records</label><input type="number" value={formData.flaggedRecords} onChange={e => setFormData({...formData, flaggedRecords: e.target.value})} /></div>
              <div className="form-group"><label>Duplicate Records</label><input type="number" value={formData.duplicateRecords} onChange={e => setFormData({...formData, duplicateRecords: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Deceased Matches</label><input type="number" value={formData.deceasedMatches} onChange={e => setFormData({...formData, deceasedMatches: e.target.value})} /></div>
              <div className="form-group"><label>Address Mismatches</label><input type="number" value={formData.addressMismatches} onChange={e => setFormData({...formData, addressMismatches: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Report Date</label><input type="date" value={formData.reportDate} onChange={e => setFormData({...formData, reportDate: e.target.value})} /></div>
              <div className="form-group"><label>Anomaly Score (0-10)</label><input type="number" step="0.1" value={formData.anomalyScore} onChange={e => setFormData({...formData, anomalyScore: e.target.value})} /></div>
            </div>
            <div className="form-group"><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="clean">Clean</option><option value="anomaly_detected">Anomaly Detected</option><option value="under_investigation">Under Investigation</option><option value="resolved">Resolved</option></select></div>
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
          <h2>Voter Registration Records ({records.length})</h2>
          <button className="btn btn-success" onClick={handleNew}>+ New Record</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>County</th><th>State</th><th>Type</th><th>Total</th><th>Flagged</th><th>Anomaly Score</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} onClick={() => handleRowClick(r)}>
                <td style={{ fontWeight: 600 }}>{r.county}</td>
                <td>{r.state}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.registrationType}</td>
                <td>{r.totalRegistrations?.toLocaleString()}</td>
                <td style={{ color: r.flaggedRecords > 500 ? 'var(--accent)' : 'inherit' }}>{r.flaggedRecords?.toLocaleString()}</td>
                <td style={{ color: r.anomalyScore > 7 ? 'var(--accent)' : r.anomalyScore > 4 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>{r.anomalyScore}</td>
                <td>{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
