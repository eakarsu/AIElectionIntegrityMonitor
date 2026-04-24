import React, { useState, useEffect } from 'react';
import { ballotCounts } from '../services/api';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ConfirmDialog from '../components/ConfirmDialog';

const statusBadge = (status) => {
  const map = { verified: 'badge-success', pending: 'badge-neutral', flagged: 'badge-danger', under_review: 'badge-warning' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace('_', ' ')}</span>;
};

const emptyForm = {
  precinct: '', county: '', state: '', electionDate: '', totalBallotsCast: '',
  registeredVoters: '', machineCount: '', handCount: '', discrepancy: '0', status: 'pending', notes: ''
};

export default function BallotCountPage() {
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
    ballotCounts.getAll().then(setRecords).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (record) => {
    setSelected(record);
    setEditing(false);
    setShowForm(false);
  };

  const handleNew = () => {
    setFormData(emptyForm);
    setEditing(false);
    setShowForm(true);
    setSelected(null);
  };

  const handleEdit = () => {
    setFormData({
      precinct: selected.precinct, county: selected.county, state: selected.state,
      electionDate: selected.electionDate, totalBallotsCast: selected.totalBallotsCast,
      registeredVoters: selected.registeredVoters, machineCount: selected.machineCount,
      handCount: selected.handCount || '', discrepancy: selected.discrepancy,
      status: selected.status, notes: selected.notes || ''
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, totalBallotsCast: Number(formData.totalBallotsCast), registeredVoters: Number(formData.registeredVoters), machineCount: Number(formData.machineCount), handCount: formData.handCount ? Number(formData.handCount) : null, discrepancy: Number(formData.discrepancy) };
      if (editing && selected) {
        await ballotCounts.update(selected.id, payload);
      } else {
        await ballotCounts.create(payload);
      }
      setShowForm(false);
      setSelected(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try {
      await ballotCounts.delete(deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await ballotCounts.analyze(selected.id);
      setSelected({ ...selected, aiAnalysis: result.analysis });
    } catch (err) { alert(err.message); }
    setAnalyzing(false);
  };

  if (loading) return <div className="ai-loading"><div className="ai-spinner"></div>Loading records...</div>;

  // Detail View
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
            <h2>Precinct {selected.precinct} — {selected.county}, {selected.state}</h2>
            {statusBadge(selected.status)}
          </div>
          <div style={{ padding: 24 }}>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Precinct</div><div className="detail-value">{selected.precinct}</div></div>
              <div className="detail-item"><div className="detail-label">County</div><div className="detail-value">{selected.county}</div></div>
              <div className="detail-item"><div className="detail-label">State</div><div className="detail-value">{selected.state}</div></div>
              <div className="detail-item"><div className="detail-label">Election Date</div><div className="detail-value">{selected.electionDate}</div></div>
              <div className="detail-item"><div className="detail-label">Registered Voters</div><div className="detail-value">{selected.registeredVoters?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Total Ballots Cast</div><div className="detail-value">{selected.totalBallotsCast?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Machine Count</div><div className="detail-value">{selected.machineCount?.toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Hand Count</div><div className="detail-value">{selected.handCount?.toLocaleString() || 'N/A'}</div></div>
              <div className="detail-item"><div className="detail-label">Discrepancy</div><div className="detail-value" style={{ color: selected.discrepancy > 5 ? 'var(--accent)' : 'inherit' }}>{selected.discrepancy}</div></div>
              <div className="detail-item"><div className="detail-label">Turnout Rate</div><div className="detail-value">{((selected.totalBallotsCast / selected.registeredVoters) * 100).toFixed(1)}%</div></div>
            </div>
            {selected.notes && (
              <div className="detail-item" style={{ marginBottom: 0 }}>
                <div className="detail-label">Notes</div>
                <div className="detail-value" style={{ fontSize: 14, fontWeight: 400 }}>{selected.notes}</div>
              </div>
            )}

            <AIAnalysisPanel analysis={selected.aiAnalysis} loading={analyzing} onAnalyze={handleAnalyze} />
          </div>
        </div>

        {deleteTarget && <ConfirmDialog title="Delete Record" message={`Delete ballot count for ${deleteTarget.precinct}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    );
  }

  // Form View
  if (showForm) {
    return (
      <div className="animate-in">
        <button className="btn btn-outline" onClick={() => { setShowForm(false); if (editing && selected) setSelected(selected); }} style={{ marginBottom: 20 }}>← Cancel</button>
        <div className="data-table-container">
          <div className="table-header">
            <h2>{editing ? 'Edit' : 'New'} Ballot Count Record</h2>
          </div>
          <div style={{ padding: 24 }}>
            <div className="form-row">
              <div className="form-group"><label>Precinct</label><input value={formData.precinct} onChange={e => setFormData({...formData, precinct: e.target.value})} /></div>
              <div className="form-group"><label>County</label><input value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>State</label><input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
              <div className="form-group"><label>Election Date</label><input type="date" value={formData.electionDate} onChange={e => setFormData({...formData, electionDate: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Registered Voters</label><input type="number" value={formData.registeredVoters} onChange={e => setFormData({...formData, registeredVoters: e.target.value})} /></div>
              <div className="form-group"><label>Total Ballots Cast</label><input type="number" value={formData.totalBallotsCast} onChange={e => setFormData({...formData, totalBallotsCast: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Machine Count</label><input type="number" value={formData.machineCount} onChange={e => setFormData({...formData, machineCount: e.target.value})} /></div>
              <div className="form-group"><label>Hand Count</label><input type="number" value={formData.handCount} onChange={e => setFormData({...formData, handCount: e.target.value})} placeholder="Optional" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Discrepancy</label><input type="number" value={formData.discrepancy} onChange={e => setFormData({...formData, discrepancy: e.target.value})} /></div>
              <div className="form-group"><label>Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="pending">Pending</option><option value="verified">Verified</option><option value="flagged">Flagged</option><option value="under_review">Under Review</option></select></div>
            </div>
            <div className="form-group"><label>Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <button className="btn btn-success btn-lg" onClick={handleSave}>{editing ? 'Update Record' : 'Create Record'}</button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="animate-in">
      <div className="data-table-container">
        <div className="table-header">
          <h2>Ballot Count Records ({records.length})</h2>
          <button className="btn btn-success" onClick={handleNew}>+ New Record</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Precinct</th>
              <th>County</th>
              <th>State</th>
              <th>Ballots Cast</th>
              <th>Discrepancy</th>
              <th>Turnout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} onClick={() => handleRowClick(r)}>
                <td style={{ fontWeight: 600 }}>{r.precinct}</td>
                <td>{r.county}</td>
                <td>{r.state}</td>
                <td>{r.totalBallotsCast?.toLocaleString()}</td>
                <td style={{ color: r.discrepancy > 5 ? 'var(--accent)' : 'inherit', fontWeight: r.discrepancy > 5 ? 700 : 400 }}>{r.discrepancy}</td>
                <td>{((r.totalBallotsCast / r.registeredVoters) * 100).toFixed(1)}%</td>
                <td>{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
