import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Plus, Clock } from 'lucide-react';
import { formatDate, formatDisplayDate } from '../utils/dateUtils';

function DateDetailsModal({ date, schedules, dateAssignments, onClose, onSave, onDelete }) {
  const dateStr = formatDate(date);
  const assignments = dateAssignments.filter(a => a.date === dateStr);
  const currentAssignment = assignments[0]; // Only one assignment per date
  
  // Find default schedule
  const defaultSchedule = schedules.find(s => s.isDefault === true);
  
  // Determine if we're using default schedule
  const isUsingDefault = !currentAssignment && defaultSchedule;
  
  const [isEditing, setIsEditing] = useState(!currentAssignment && !isUsingDefault);
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    currentAssignment?.scheduleId || defaultSchedule?.id || ''
  );
  const [description, setDescription] = useState(currentAssignment?.description || '');
  const [customTimes, setCustomTimes] = useState(null);
  const [useCustomTimes, setUseCustomTimes] = useState(false);

  // Get the selected schedule
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  
  // Get the display schedule (either assignment schedule or default)
  const displaySchedule = currentAssignment 
    ? schedules.find(s => s.id === currentAssignment.scheduleId)
    : defaultSchedule;

  // Get bell times to display
  const displayBellTimes = currentAssignment?.customTimes 
    || (currentAssignment 
      ? schedules.find(s => s.id === currentAssignment.scheduleId)?.times
      : defaultSchedule?.times);

  // Initialize custom times from current assignment or selected schedule
  // Initialize custom times from current assignment or selected schedule
  useEffect(() => {
    if (currentAssignment?.customTimes) {
      // Has custom times saved for this date
      setCustomTimes(JSON.parse(JSON.stringify(currentAssignment.customTimes)));
      setUseCustomTimes(true);
    } else if (selectedSchedule?.times) {
      // Use selected schedule's default times
      setCustomTimes(JSON.parse(JSON.stringify(selectedSchedule.times)));
      setUseCustomTimes(false);
    }
  }, [currentAssignment]);

  const handleSave = async () => {
    if (!selectedScheduleId) {
      alert('Please select a schedule');
      return;
    }

    // Validate custom times if being used
    if (useCustomTimes && customTimes) {
      const hasEmptyFields = customTimes.some(t => !t.time || !t.description.trim());
      if (hasEmptyFields) {
        alert('Please fill in all bell times and descriptions');
        return;
      }
    }

    try {
      if (currentAssignment) {
        // Update existing assignment
        // Only pass customTimes if user has modified them
        await onSave(
          [dateStr], 
          selectedScheduleId, 
          description, 
          useCustomTimes ? customTimes : null, // Pass null if not using custom times
          currentAssignment.id
        );
      } else {
        // Create new assignment
        await onSave(
          [dateStr], 
          selectedScheduleId, 
          description, 
          useCustomTimes ? customTimes : null
        );
      }
      
      // Don't close editing mode here - let Dashboard handle modal closing
    } catch (error) {
      console.error('Error saving in modal:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove this schedule assignment? The date will revert to using the default schedule.')) {
      try {
        await onDelete(currentAssignment.id);
        onClose();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete: ' + error.message);
      }
    }
  };

  const handleScheduleChange = (scheduleId) => {
    console.log('Schedule changed to:', scheduleId);
    setSelectedScheduleId(scheduleId);
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (schedule?.times) {
      console.log('Loading new schedule times:', schedule.times);
      // IMPORTANT: When schedule changes, load that schedule's times
      setCustomTimes(JSON.parse(JSON.stringify(schedule.times)));
      // CRITICAL: Always reset to NOT using custom times when changing schedule
      // This ensures that any previously saved custom times are discarded
      setUseCustomTimes(false);
    } else {
      // If no times, reset everything
      setCustomTimes(null);
      setUseCustomTimes(false);
    }
  };

  const addBellTime = () => {
    setCustomTimes([...customTimes, { time: '', description: '' }]);
    setUseCustomTimes(true);
  };

  const removeBellTime = (index) => {
    if (customTimes.length <= 1) {
      alert('You must have at least one bell time');
      return;
    }
    setCustomTimes(customTimes.filter((_, i) => i !== index));
    setUseCustomTimes(true);
  };

  const updateBellTime = (index, field, value) => {
    const newTimes = [...customTimes];
    newTimes[index][field] = value;
    setCustomTimes(newTimes);
    // Mark as custom only when user manually edits
    setUseCustomTimes(true);
  };

  const resetToDefaultTimes = () => {
    if (selectedSchedule?.times) {
      setCustomTimes(JSON.parse(JSON.stringify(selectedSchedule.times)));
      setUseCustomTimes(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {formatDisplayDate(date)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing 
                ? 'Edit schedule for this date' 
                : isUsingDefault 
                  ? 'Using default schedule (click Edit to assign a specific schedule)'
                  : 'Manage schedule for this date'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {!isEditing && (currentAssignment || isUsingDefault) ? (
            /* View Mode */
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  {isUsingDefault ? 'Default Schedule' : 'Current Schedule'}
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-lg">
                        {displaySchedule?.name}
                        {isUsingDefault && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        {currentAssignment?.customTimes && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Custom Times
                          </span>
                        )}
                      </div>
                      {description && (
                        <div className="text-sm text-gray-600 mt-2">{description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit schedule"
                      >
                        <Edit2 size={20} />
                      </button>
                      {currentAssignment && (
                        <button
                          onClick={handleDelete}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display Times */}
                  {displayBellTimes && displayBellTimes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Bell Schedule
                      </div>
                      <div className="space-y-2">
                        {displayBellTimes.map((bell, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm bg-white p-2 rounded-lg">
                            <Clock size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-900 min-w-[60px]">{bell.time}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-gray-700">{bell.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div>
              {/* Schedule Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Schedule *
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a schedule...</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} {schedule.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Changing the schedule will load that schedule's default bell times
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a note about this schedule..."
                />
              </div>

              {/* Custom Times */}
              {selectedScheduleId && customTimes && customTimes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Bell Times {useCustomTimes && <span className="text-blue-600">(Modified - Custom for this date)</span>}
                      {!useCustomTimes && <span className="text-gray-500">(From {selectedSchedule?.name})</span>}
                    </label>
                    <div className="flex gap-2">
                      {useCustomTimes && (
                        <button
                          onClick={resetToDefaultTimes}
                          className="text-gray-600 hover:text-gray-700 text-sm px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Reset to Schedule Default
                        </button>
                      )}
                      <button
                        onClick={addBellTime}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={16} />
                        Add Bell
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {customTimes.map((bell, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <Clock size={18} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="time"
                          value={bell.time}
                          onChange={(e) => updateBellTime(index, 'time', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                        />
                        <input
                          type="text"
                          value={bell.description}
                          onChange={(e) => updateBellTime(index, 'description', e.target.value)}
                          placeholder="e.g., Class Start, Break, Lunch"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeBellTime(index)}
                          className="text-red-600 hover:text-red-700 p-2 flex-shrink-0"
                          disabled={customTimes.length <= 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>Note:</strong> {useCustomTimes 
                        ? 'You have modified the bell times. These custom times will only apply to this specific date.'
                        : 'These are the default times from the selected schedule. You can modify them for this date only by editing any field.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!selectedScheduleId}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-lg flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {currentAssignment ? 'Update Schedule' : 'Save Schedule'}
                </button>
                {(currentAssignment || isUsingDefault) && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                )}
                {!currentAssignment && !isUsingDefault && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DateDetailsModal;