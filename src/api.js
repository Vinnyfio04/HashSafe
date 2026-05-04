// All API calls to the HashSafe backend (http://localhost:3000)
const BASE = 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, username, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, password }),
    }),

  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),
};

// ── Hash ──────────────────────────────────────────────────────────────
export const hashAPI = {
  generate: (input, type = 'sha256', inputEncoding = 'utf8') =>
    request('/hash/generate', {
      method: 'POST',
      body: JSON.stringify({ input, type, inputEncoding }),
    }),

  batch: (items) =>
    request('/hash/batch', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getRecent: () => request('/hash/recent'),

  getStats: () => request('/hash/stats'),

  getById: (id) => request(`/hash/${id}`),

  getByContentId: (contentId) => request(`/hash/content/${contentId}`),

  deleteById: (id) =>
    request(`/hash/${id}`, { method: 'DELETE' }),
};

// ── Content ───────────────────────────────────────────────────────────
export const contentAPI = {
  upload: (data) =>
    request('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => request('/content'),

  getById: (id) => request(`/content/${id}`),

  search: (q) => request(`/content/search?q=${encodeURIComponent(q)}`),

  deleteById: (id) =>
    request(`/content/${id}`, { method: 'DELETE' }),
};

// ── Stats ─────────────────────────────────────────────────────────────
export const statsAPI = {
  byContentType: () => request('/stats/content/type'),
  recentUploads: () => request('/stats/recent/uploads'),
};