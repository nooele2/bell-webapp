export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://192.168.5.25:5001/api';

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
};

// Auth
export const login = (email, password) =>
  apiCall('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const logout = () => apiCall('/logout', { method: 'POST' });
export const checkAuth = () => apiCall('/check-auth', { method: 'GET' });

// Schedules
export const getSchedules = () => apiCall('/schedules', { method: 'GET' });
export const createSchedule = (data) =>
  apiCall('/schedules', { method: 'POST', body: JSON.stringify(data) });
export const updateSchedule = (id, data) =>
  apiCall(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSchedule = (id) =>
  apiCall(`/schedules/${id}`, { method: 'DELETE' });

// Table rows
export const getTableRows = () => apiCall('/table-rows', { method: 'GET' });
export const createTableRow = (data) =>
  apiCall('/table-rows', { method: 'POST', body: JSON.stringify(data) });
export const updateTableRow = (id, data) =>
  apiCall(`/table-rows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTableRow = (id) =>
  apiCall(`/table-rows/${id}`, { method: 'DELETE' });
export const replaceDateRows = (dateStr, rows) =>
  apiCall(`/table-rows/date/${dateStr}`, { method: 'PUT', body: JSON.stringify(rows) });

// Ringtone mappings
export const getRingtoneMappings = () => apiCall('/ringtone-mappings', { method: 'GET' });
export const saveRingtoneMappings = (data) =>
  apiCall('/ringtone-mappings', { method: 'PUT', body: JSON.stringify(data) });

// Default export for AuthContext compatibility
export default {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) }),
};