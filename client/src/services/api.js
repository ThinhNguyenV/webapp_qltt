const BASE = '/api';

async function request(url, options = {}) {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const login = (username, password) =>
  request('/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (fullName, username, email, password) =>
  request('/register', { method: 'POST', body: JSON.stringify({ fullName, username, email, password }) });

// ── Meta ─────────────────────────────────────────────────────
export const getCategories = () => request('/categories');
export const getTags = () => request('/tags');
export const getTopSearches = () => request('/top-searches');

// ── Documents ────────────────────────────────────────────────
export const getDocuments = ({ q, categoryId, userId } = {}) => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (categoryId) params.append('categoryId', categoryId);
  if (userId) params.append('userId', userId);
  return request(`/documents?${params}`);
};

export const getDocumentById = (id) => request(`/documents/${id}`);

export const addDocument = ({ title, summary, content, categoryId, authorId, tags }) =>
  request('/documents', {
    method: 'POST',
    body: JSON.stringify({ title, summary, content, categoryId, authorId, tags }),
  });

export const updateDocument = (docId, { title, summary, content, categoryId, tags }, userId, userRole) =>
  request(`/documents/${docId}`, {
    method: 'PUT',
    headers: { 'x-user-id': userId, 'x-user-role': userRole },
    body: JSON.stringify({ title, summary, content, categoryId, tags }),
  });

// ── Interactions ─────────────────────────────────────────────
export const postInteraction = ({ userId, docId, type, commentText }) =>
  request('/interactions', {
    method: 'POST',
    body: JSON.stringify({ userId, docId, type, commentText }),
  });

// ── SQL Lab ───────────────────────────────────────────────────
export const getSqlObjects = () => request('/demos');
export const getSqlSource = (name) => request(`/sqllab/source/${name}`);
export const executeSqlObject = (name, params = {}) =>
  request('/sqllab/execute', { method: 'POST', body: JSON.stringify({ name, params }) });

// ── Users (Admin) ─────────────────────────────────────────────
export const getUsers = () => request('/users');

export const updateUserRole = (id, role, adminRole) =>
  request(`/users/${id}/role`, {
    method: 'PUT',
    headers: { 'x-user-role': adminRole },
    body: JSON.stringify({ role })
  });

export const deleteUser = (id, adminRole) =>
  request(`/users/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-role': adminRole }
  });

