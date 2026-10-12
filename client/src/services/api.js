const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function readRows(body) {
  if (!Array.isArray(body.data)) throw new Error('The native records response is invalid. Reload after checking the database.');
  return body.data;
}
export const records = { getAll: name => request('/records/' + encodeURIComponent(name)).then(readRows) };

export const auth = {
  login: (email, password, options = {}) => request('/auth/login', { ...options, method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me')
};

export const dashboard = {
  getStats: () => request('/records/dashboard')
};

export const ballotCounts = {
  getAll: () => request('/records/ballot-counts').then(readRows),
  getOne: (id) => request(`/ballot-counts/${id}`),
  create: (data) => request('/ballot-counts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/ballot-counts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/ballot-counts/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/ballot-counts/${id}/analyze`, { method: 'POST' })
};

export const redistricting = {
  getAll: () => request('/records/redistricting').then(readRows),
  getOne: (id) => request(`/redistricting/${id}`),
  create: (data) => request('/redistricting', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/redistricting/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/redistricting/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/redistricting/${id}/analyze`, { method: 'POST' })
};

export const voterRegistration = {
  getAll: () => request('/records/voter-registration').then(readRows),
  getOne: (id) => request(`/voter-registration/${id}`),
  create: (data) => request('/voter-registration', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/voter-registration/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/voter-registration/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/voter-registration/${id}/analyze`, { method: 'POST' })
};

export const campaignFinance = {
  getAll: () => request('/records/campaign-finance').then(readRows),
  getOne: (id) => request(`/campaign-finance/${id}`),
  create: (data) => request('/campaign-finance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/campaign-finance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/campaign-finance/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/campaign-finance/${id}/analyze`, { method: 'POST' })
};

export const ai = {
  ballotIntegrityCheck: (data) =>
    request('/ai/ballot-integrity-check', { method: 'POST', body: JSON.stringify(data) }),
  campaignFinanceAnalysis: (data) =>
    request('/ai/campaign-finance-analysis', { method: 'POST', body: JSON.stringify(data) }),
  voterRegistrationAudit: (data) =>
    request('/ai/voter-registration-audit', { method: 'POST', body: JSON.stringify(data) }),
  gerrymanderingAnalysis: (data) =>
    request('/ai/gerrymandering-analysis', { method: 'POST', body: JSON.stringify(data) })
};
