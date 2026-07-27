const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('splitkaro_token');
  
  const headers = { ...options.headers };
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API error: ${res.status}`);
  }
  
  return res.json();
}

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('splitkaro_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}/api/parse`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!res.ok) throw new Error('Failed to parse invoice');
  return res.json();
}

export function getAuthUrl() {
  const telegramId = localStorage.getItem('splitkaro_user_id');
  return `${API_BASE}/api/auth/url${telegramId ? `?user_id=${telegramId}` : ''}`;
}

export function isLoggedIn() {
  return !!localStorage.getItem('splitkaro_token');
}

export function logout() {
  localStorage.removeItem('splitkaro_token');
  localStorage.removeItem('splitkaro_user');
  localStorage.removeItem('splitkaro_flatmates');
}
