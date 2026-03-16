const BASE = `${import.meta.env.VITE_API_URL}/api`;

function getToken() { return localStorage.getItem('token'); }
function getRefreshToken() { return localStorage.getItem('refreshToken'); }

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, options);

  if (res.status === 401) {
    const rt = getRefreshToken();
    if (!rt) throw new Error('Unauthorized');

    const refreshRes = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!refreshRes.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.reload();
      throw new Error('Session expired');
    }

    const data = await refreshRes.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);

    options.headers = { ...options.headers, Authorization: `Bearer ${data.token}` };
    res = await fetch(url, options);
  }

  return res;
}

export async function register(username, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data.title ?? 'Registration failed'));
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : 'Login failed');
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetchWithRefresh(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function getApplications({ status, search, sort, dir, page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);
  if (dir) params.set('dir', dir);
  if (page) params.set('page', page);
  if (pageSize) params.set('pageSize', pageSize);

  const res = await fetchWithRefresh(`${BASE}/applications?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

export async function getStats() {
  const res = await fetchWithRefresh(`${BASE}/applications/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

async function parseResponse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(text || `HTTP ${res.status}`); }
}

export async function createApplication(data) {
  const res = await fetchWithRefresh(`${BASE}/applications`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await parseResponse(res);
  if (!res.ok) throw new Error(JSON.stringify(json.errors ?? json));
  return json;
}

export async function updateApplication(id, data) {
  const res = await fetchWithRefresh(`${BASE}/applications/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await parseResponse(res);
  if (!res.ok) throw new Error(JSON.stringify(json.errors ?? json));
  return json;
}

export async function patchStatus(id, status) {
  const res = await fetchWithRefresh(`${BASE}/applications/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json.errors ?? json));
  return json;
}

export async function deleteApplication(id) {
  const res = await fetchWithRefresh(`${BASE}/applications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete');
}

export function exportCsvUrl() {
  return `${BASE}/applications/export`;
}

export async function getSavedJobs() {
  const res = await fetchWithRefresh(`${BASE}/saved-jobs`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch saved jobs');
  return res.json();
}

export async function createSavedJob(url, note) {
  const res = await fetchWithRefresh(`${BASE}/saved-jobs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ url, note }),
  });
  if (!res.ok) throw new Error('Failed to save job');
  return res.json();
}

export async function deleteSavedJob(id) {
  const res = await fetchWithRefresh(`${BASE}/saved-jobs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete saved job');
}
