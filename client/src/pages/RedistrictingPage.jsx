import React, { useState, useEffect } from 'react';
import { redistricting } from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const statusBadge = (status) => {
  const map = { approved: 'badge-success', proposed: 'badge-neutral', under_review: 'badge-warning', flagged: 'badge-danger', rejected: 'badge-danger' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace('_', ' ')}</span>;
};

const emptyForm = {
  districtName: '', state: '', proposedBy: '', population: '', minorityPopulationPct: '',
  compactnessScore: '', contiguityCheck: true, competitivenessIndex: '', previousDistrictId: '',
  proposalDate: '', status: 'proposed', fairnessScore: '', notes: ''
};

export default function RedistrictingPage() {
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
    redistricting.getAll().then(setRecords).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (record) => { setSelected(record); setEditing(false); setShowForm(false); };
  const handleNew = () => { setFormData(emptyForm); setEditing(false); setShowForm(true); setSelected(null); };

  const handleEdit = () => {
    setFormData({
      districtName: selected.districtName, state: selected.state, proposedBy: selected.proposedBy,
      population: selected.population, minorityPopulationPct: selected.minorityPopulationPct || '',
      compactnessScore: selected.compactnessScore || '', contiguityCheck: selected.contiguityCheck,
      competitivenessIndex: selected.competitivenessIndex || '', previousDistrictId: selected.previousDistrictId || '',
      proposalDate: selected.proposalDate, status: selected.status, fairnessScore: selected.fairnessScore || '',
      notes: selected.notes || ''
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, population: Number(formData.population), minorityPopulationPct: formData.minorityPopulationPct ? Number(formData.minorityPopulationPct) : null, compactnessScore: formData.compactnessScore ? Number(formData.compactnessScore) : null, competitivenessIndex: formData.competitivenessIndex ? Number(formData.competitivenessIndex) : null, fairnessScore: formData.fairnessScore ? Number(formData.fairnessScore) : null };
      if (editing && selected) { await redistricting.update(selected.id, payload); }
      else { await redistricting.create(payload); }
      setShowForm(false); setSelected(null); load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try { await redistricting.delete(deleteTarget.id); setDeleteTarget(null); setSelected(null); load(); }
    catch (err) { alert(err.message); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await redistricting.analyze(selected.id);
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
            <h2>{selected.districtName} — {selected.state}</h2>
            {statusBadge(selected.status)}
          </div>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">District Name</div><div className="detail-value">{selected.districtName}</div></div>
              <div className="detail-item"><div className="detail-label">State</div><div className="detail-value">{selected.state}</div></div>
              <div className="detail-item"><div className="detail-label">Proposed By</div><div className="detail-value">{selected.proposedBy}</div></div>
              <div className="detail-item"><div className="detail-label">Population</div><div className="detail-value">{selected.population?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Minority Population</div><div className="detail-value">{selected.minorityPopulationPct}%</div></div>
              <div className="detail-item"><div className="detail-label">Compactness Score</div><div className="detail-value" style={{ color: selected.compactnessScore < 0.4 ? 'var(--accent)' : 'var(--success)' }}>{selected.compactnessScore}</div></div>
              <div className="detail-item"><div className="detail-label">Contiguity</div><div className="detail-value">{selected.contiguityCheck ? '✅ Yes' : '❌ No'}</div></div>
              <div className="detail-item"><div className="detail-label">Competitiveness</div><div className="detail-value">{selected.competitivenessIndex}</div></div>
              <div className="detail-item"><div className="detail-label">Fairness Score</div><div className="detail-value" style={{ color: selected.fairnessScore < 5 ? 'var(--accent)' : 'var(--success)' }}>{selected.fairnessScore || 'N/A'}/10</div></div>
              <div className="detail-item"><div className="detail-label">Proposal Date</div><div className="detail-value">{selected.proposalDate}</div></div>
            </div>
            {selected.notes && <div className="detail-item"><div className="detail-label">Notes</div><div className="detail-value" style={{ fontSize: 14, fontWeight: 400 }}>{selected.notes}</div></div>}
            <AIAnalysisPanel analysis={selected.aiAnalysis} loading={analyzing} onAnalyze={handleAnalyze} />
          </div>
        </div>
        {deleteTarget && <ConfirmDialog title="Delete Record" message={`Delete ${deleteTarget.districtName}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="animate-in">
        <button className="btn btn-outline" onClick={() => { setShowForm(false); if (editing && selected) setSelected(selected); }} style={{ marginBottom: 20 }}>← Cancel</button>
        <div className="data-table-container">
          <div className="table-header"><h2>{editing ? 'Edit' : 'New'} Redistricting Proposal</h2></div>
          <div style={{ padding: 24 }}>
            <div className="form-row">
              <div className="form-group"><label>District Name</label><input value={formData.districtName} onChange={e => setFormData({...formData, districtName: e.target.value})} /></div>
              <div className="form-group"><label>State</label><input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Proposed By</label><input value={formData.proposedBy} onChange={e => setFormData({...formData, proposedBy: e.target.value})} /></div>
              <div className="form-group"><label>Population</label><input type="number" value={formData.population} onChange={e => setFormData({...formData, population: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Minority Population %</label><input type="number" step="0.1" value={formData.minorityPopulationPct} onChange={e => setFormData({...formData, minorityPopulationPct: e.target.value})} /></div>
              <div className="form-group"><label>Compactness Score (0-1)</label><input type="number" step="0.01" value={formData.compactnessScore} onChange={e => setFormData({...formData, compactnessScore: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Competitiveness Index</label><input type="number" step="0.01" value={formData.competitivenessIndex} onChange={e => setFormData({...formData, competitivenessIndex: e.target.value})} /></div>
              <div className="form-group"><label>Fairness Score (1-10)</label><input type="number" step="0.1" value={formData.fairnessScore} onChange={e => setFormData({...formData, fairnessScore: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Proposal Date</label><input type="date" value={formData.proposalDate} onChange={e => setFormData({...formData, proposalDate: e.target.value})} /></div>
              <div className="form-group"><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="proposed">Proposed</option><option value="under_review">Under Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="flagged">Flagged</option></select></div>
            </div>
            <div className="form-group"><label>Contiguity Check</label><select value={formData.contiguityCheck} onChange={e => setFormData({...formData, contiguityCheck: e.target.value === 'true'})}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="form-group"><label>Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <button className="btn btn-success btn-lg" onClick={handleSave}>{editing ? 'Update' : 'Create'} Proposal</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="data-table-container">
        <div className="table-header">
          <h2>Redistricting Proposals ({records.length})</h2>
          <button className="btn btn-success" onClick={handleNew}>+ New Proposal</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>District</th><th>State</th><th>Proposed By</th><th>Population</th><th>Compactness</th><th>Fairness</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} onClick={() => handleRowClick(r)}>
                <td style={{ fontWeight: 600 }}>{r.districtName}</td>
                <td>{r.state}</td>
                <td>{r.proposedBy}</td>
                <td>{r.population?.toLocaleString()}</td>
                <td style={{ color: r.compactnessScore < 0.4 ? 'var(--accent)' : 'inherit' }}>{r.compactnessScore}</td>
                <td style={{ color: r.fairnessScore < 5 ? 'var(--accent)' : 'var(--success)', fontWeight: 700 }}>{r.fairnessScore || '-'}</td>
                <td>{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
