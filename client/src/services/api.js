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

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me')
};

export const dashboard = {
  getStats: () => request('/dashboard')
};

export const ballotCounts = {
  getAll: () => request('/ballot-counts'),
  getOne: (id) => request(`/ballot-counts/${id}`),
  create: (data) => request('/ballot-counts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/ballot-counts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/ballot-counts/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/ballot-counts/${id}/analyze`, { method: 'POST' })
};

export const redistricting = {
  getAll: () => request('/redistricting'),
  getOne: (id) => request(`/redistricting/${id}`),
  create: (data) => request('/redistricting', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/redistricting/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/redistricting/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/redistricting/${id}/analyze`, { method: 'POST' })
};

export const voterRegistration = {
  getAll: () => request('/voter-registration'),
  getOne: (id) => request(`/voter-registration/${id}`),
  create: (data) => request('/voter-registration', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/voter-registration/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/voter-registration/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/voter-registration/${id}/analyze`, { method: 'POST' })
};

export const campaignFinance = {
  getAll: () => request('/campaign-finance'),
  getOne: (id) => request(`/campaign-finance/${id}`),
  create: (data) => request('/campaign-finance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/campaign-finance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/campaign-finance/${id}`, { method: 'DELETE' }),
  analyze: (id) => request(`/campaign-finance/${id}/analyze`, { method: 'POST' })
};
