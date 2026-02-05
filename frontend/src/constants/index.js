// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = 'http://localhost:5001/api';

// ============================================================================
// Color Presets
// ============================================================================

export const COLOR_PRESETS = [
  { name: 'Yellow', value: '#fef3c7', border: '#fbbf24', text: '#854d0e' },
  { name: 'Blue', value: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'Green', value: '#d1fae5', border: '#10b981', text: '#065f46' },
  { name: 'Purple', value: '#e9d5ff', border: '#a855f7', text: '#5b21b6' },
  { name: 'Pink', value: '#fce7f3', border: '#ec4899', text: '#9f1239' },
  { name: 'Orange', value: '#fed7aa', border: '#f97316', text: '#7c2d12' },
  { name: 'Red', value: '#fecaca', border: '#ef4444', text: '#7f1d1d' },
  { name: 'Teal', value: '#ccfbf1', border: '#14b8a6', text: '#134e4a' },
  { name: 'Indigo', value: '#e0e7ff', border: '#6366f1', text: '#312e81' },
  { name: 'Lime', value: '#ecfccb', border: '#84cc16', text: '#365314' },
  { name: 'Gray', value: '#f3f4f6', border: '#6b7280', text: '#374151' },
  { name: 'Cyan', value: '#cffafe', border: '#06b6d4', text: '#164e63' },
];

// Default color for schedules without a color set
export const DEFAULT_SCHEDULE_COLOR = COLOR_PRESETS[0]; // Yellow

// ============================================================================
// System Schedules
// ============================================================================

export const SYSTEM_NO_BELL_SCHEDULE = {
  id: 'system-no-bell',
  name: 'No Bell',
  mode: 'No Bell',
  isDefault: false,
  isSystem: true,
  color: { name: 'Gray', value: '#f3f4f6', border: '#6b7280', text: '#374151' },
  times: []
};

// ============================================================================
// File Upload Constraints
// ============================================================================

export const AUDIO_UPLOAD_CONSTRAINTS = {
  maxSizeMB: 10,
  maxSizeBytes: 10 * 1024 * 1024,
  acceptedFormats: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
  acceptedExtensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
};

// ============================================================================
// Date/Time Formats
// ============================================================================

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD', // For API/storage
  DISPLAY_LONG: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  DISPLAY_SHORT: { month: 'short', day: 'numeric', year: 'numeric' },
  DISPLAY_MONTH: { year: 'numeric', month: 'long' },
};

export const TIME_FORMATS = {
  DISPLAY_24H: { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false },
  DISPLAY_12H: { hour: '2-digit', minute: '2-digit', hour12: true },
};