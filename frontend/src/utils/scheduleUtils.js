import { COLOR_PRESETS, DEFAULT_SCHEDULE_COLOR, SYSTEM_NO_BELL_SCHEDULE } from '../constants';

/**
 * Get the color configuration for a schedule
 */
export const getScheduleColor = (schedule) => {
  // Check if it's the system "No Bell" schedule
  if (!schedule || schedule.id === 'system-no-bell' || schedule.isSystem) {
    return { value: '#fee2e2', border: '#ef4444', text: '#991b1b' };
  }
  
  // Return schedule's color or default
  return schedule.color || DEFAULT_SCHEDULE_COLOR;
};

/**
 * Get color by schedule ID from a list of schedules
 */
export const getScheduleColorById = (scheduleId, schedules) => {
  if (scheduleId === 'system-no-bell') {
    return { value: '#fee2e2', border: '#ef4444', text: '#991b1b' };
  }
  
  const schedule = schedules.find(s => s.id === scheduleId);
  return getScheduleColor(schedule);
};

/**
 * Get the name of a schedule by ID
 */
export const getScheduleName = (scheduleId, schedules) => {
  if (scheduleId === 'system-no-bell') {
    return 'No Bell';
  }
  
  const schedule = schedules.find(s => s.id === scheduleId);
  return schedule?.name || 'Unknown';
};

/**
 * Get all schedules including system schedules
 */
export const getAllSchedules = (schedules) => {
  return [SYSTEM_NO_BELL_SCHEDULE, ...schedules];
};

/**
 * Check if a schedule is the "No Bell" system schedule
 */
export const isNoBellSchedule = (scheduleOrId) => {
  if (typeof scheduleOrId === 'string') {
    return scheduleOrId === 'system-no-bell';
  }
  return scheduleOrId?.id === 'system-no-bell' || scheduleOrId?.isSystem;
};

/**
 * Check if a schedule can be deleted
 */
export const canDeleteSchedule = (schedule) => {
  return !schedule.isSystem && !schedule.isDefault;
};

/**
 * Check if a schedule can be set as default
 */
export const canSetAsDefault = (schedule) => {
  return !schedule.isSystem && !schedule.isDefault;
};

/**
 * Validate schedule data before save
 */
export const validateSchedule = (schedule) => {
  if (!schedule.name?.trim()) {
    return { valid: false, error: 'Please enter a schedule name' };
  }

  if (!isNoBellSchedule(schedule)) {
    if (!schedule.times || schedule.times.length === 0) {
      return { valid: false, error: 'Please add at least one bell time' };
    }

    // Only validate that time is filled in - description is optional
    const hasEmptyTime = schedule.times.some(t => !t.time);
    if (hasEmptyTime) {
      return { valid: false, error: 'Please fill in all bell times' };
    }
  }

  return { valid: true, error: null };
};

/**
 * Get bell sound name by ID
 */
export const getBellSoundName = (bellSoundId, bellSounds) => {
  if (!bellSoundId) return 'Default Bell';
  const sound = bellSounds.find(s => s.id === bellSoundId);
  return sound ? sound.name : 'Default Bell';
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Ensure schedule has all required fields with defaults
 */
export const normalizeSchedule = (schedule) => {
  return {
    ...schedule,
    color: schedule.color || DEFAULT_SCHEDULE_COLOR,
    bellSoundId: schedule.bellSoundId || null,
    isDefault: schedule.isDefault || false,
    isSystem: schedule.isSystem || false,
    times: schedule.times || [],
  };
};