const API_BASE_URL = 'http://localhost:5001/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important for auth cookies/sessions
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

// Default export for auth operations
const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
};

export default api;

// Schedules
export const getSchedules = async () => {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch schedules');
  return response.json();
};

export const createSchedule = async (schedule) => {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error('Failed to create schedule');
  return response.json();
};

export const updateSchedule = async (id, schedule) => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error('Failed to update schedule');
  return response.json();
};

export const deleteSchedule = async (id) => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete schedule');
  return response.json();
};

// Assignments
export const getAssignments = async () => {
  const response = await fetch(`${API_BASE_URL}/assignments`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch assignments');
  return response.json();
};

export const createAssignment = async (dates, scheduleId, description = '', customTimes = null) => {
  const response = await fetch(`${API_BASE_URL}/assignments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dates, scheduleId, description, customTimes }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create assignment' }));
    throw new Error(error.error || 'Failed to create assignment');
  }
  return response.json();
};

export const updateAssignment = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update assignment' }));
    throw new Error(error.error || 'Failed to update assignment');
  }
  return response.json();
};

export const deleteAssignment = async (id) => {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete assignment');
  return response.json();
};