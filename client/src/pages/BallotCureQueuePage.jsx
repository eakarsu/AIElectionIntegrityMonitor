import React, { useEffect, useState } from 'react';

export default function BallotCureQueuePage() {
  const [data, setData] = useState({ summary: {}, cureItems: [] });
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    fetch('/api/ballot-cure-queue').then((res) => res.json()).then(setData);
  }, []);

  const assign = async (id) => {
    const res = await fetch('/api/ballot-cure-queue/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAssignment(await res.json());
  };

  return (
    <div>
      <h2>Ballot Cure Queue</h2>
      <p>Prioritize cure notices and outreach before statutory deadlines.</p>
      <div className="stats-grid">
        {Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key}</span><strong>{value}</strong></div>)}
      </div>
      {data.cureItems.map((item) => (
        <div className="card" key={item.id} style={{ marginBottom: 12 }}>
          <strong>{item.id}</strong> · {item.county} · {item.reason}
          <div>{item.dueHours} hours remaining · {item.status}</div>
          <button className="btn btn-primary btn-sm" onClick={() => assign(item.id)}>Assign outreach</button>
        </div>
      ))}
      {assignment && <div className="card">{assignment.assignment}: {assignment.script}</div>}
    </div>
  );
}
