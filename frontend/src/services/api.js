import { API_BASE_URL } from '../constants';

// ============================================================================
// Core API Helper
// ============================================================================

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
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

// ============================================================================
// Authentication API
// ============================================================================

export const login = async (email, password) => {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const logout = async () => {
  return apiCall('/logout', { method: 'POST' });
};

export const checkAuth = async () => {
  return apiCall('/check-auth', { method: 'GET' });
};

// ============================================================================
// Schedules API
// ============================================================================

export const getSchedules = async () => {
  return apiCall('/schedules', { method: 'GET' });
};

export const createSchedule = async (schedule) => {
  return apiCall('/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });
};

export const updateSchedule = async (id, schedule) => {
  return apiCall(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schedule),
  });
};

export const deleteSchedule = async (id) => {
  return apiCall(`/schedules/${id}`, { method: 'DELETE' });
};

// ============================================================================
// Assignments API
// ============================================================================

export const getAssignments = async () => {
  return apiCall('/assignments', { method: 'GET' });
};

export const createAssignment = async (dates, scheduleId, description, customTimes = null, bellSoundId = null) => {
  return apiCall('/assignments', {
    method: 'POST',
    body: JSON.stringify({
      dates,
      scheduleId,
      description,
      customTimes,
      bellSoundId,
    }),
  });
};

export const updateAssignment = async (id, data) => {
  return apiCall(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      date: data.date,
      scheduleId: data.scheduleId,
      description: data.description,
      customTimes: data.customTimes,
      bellSoundId: data.bellSoundId,
    }),
  });
};

export const deleteAssignment = async (id) => {
  return apiCall(`/assignments/${id}`, { method: 'DELETE' });
};

// ============================================================================
// Legacy API (for backward compatibility)
// ============================================================================

export const getScheduleTimes = async () => {
  return apiCall('/schedule/times', { method: 'GET' });
};

export const healthCheck = async () => {
  return apiCall('/health', { method: 'GET' });
};

// Default export for backward compatibility
export default {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};