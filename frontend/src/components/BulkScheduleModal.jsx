import React, { useState } from 'react';
import { X, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { parseDate, formatDisplayDate } from '../utils/dateUtils';
import { SYSTEM_NO_BELL_SCHEDULE } from '../constants';

function BulkScheduleModal({ selectedDates, schedules, onClose, onSave, isListViewMode, dateAssignments }) {
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [description, setDescription] = useState('');
  const [manualDates, setManualDates] = useState(['']);

  const availableSchedules = [SYSTEM_NO_BELL_SCHEDULE, ...schedules];

  const datesWithSchedules = selectedDates.filter(dateStr => 
    dateAssignments.some(assignment => assignment.date === dateStr)
  );

  const handleSave = () => {
    if (!selectedSchedule) {
      alert('Please select a schedule');
      return;
    }

    if (isListViewMode) {
      const validDates = manualDates.filter(d => d.trim() !== '');
      if (validDates.length === 0) {
        alert('Please add at least one date');
        return;
      }

      const conflictDates = validDates.filter(dateStr =>
        dateAssignments.some(assignment => assignment.date === dateStr)
      );

      if (conflictDates.length > 0) {
        const conflictDatesList = conflictDates.map(d => {
          const date = parseDate(d);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }).join(', ');
        
        alert(`The following dates already have schedules assigned:\n${conflictDatesList}\n\nPlease remove these dates or delete their existing schedules first.`);
        return;
      }

      onSave(selectedSchedule, description, validDates);
    } else {
      if (datesWithSchedules.length > 0) {
        const conflictDatesList = datesWithSchedules.map(dateStr => {
          const date = parseDate(dateStr);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }).join(', ');
        
        alert(`The following dates already have schedules assigned:\n${conflictDatesList}\n\nThis should not happen. Please refresh and try again.`);
        return;
      }

      onSave(selectedSchedule, description);
    }
  };

  const addDateField = () => {
    setManualDates([...manualDates, '']);
  };

  const removeDateField = (index) => {
    setManualDates(manualDates.filter((_, i) => i !== index));
  };

  const updateDate = (index, value) => {
    const newDates = [...manualDates];
    newDates[index] = value;
    setManualDates(newDates);
  };

  const sortedSelectedDates = [...selectedDates].sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isListViewMode ? 'Set Schedule for Dates' : 'Set Schedule for Multiple Dates'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isListViewMode 
                ? 'Choose dates and assign a schedule'
                : `Assign a schedule to ${selectedDates.length} selected date${selectedDates.length !== 1 ? 's' : ''}`
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
          {!isListViewMode && datesWithSchedules.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <strong>Warning:</strong> Some selected dates already have schedules assigned. These dates should not have been selectable. Please close this modal and try again.
              </div>
            </div>
          )}

          {isListViewMode ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Dates *</h3>
                <button
                  onClick={addDateField}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Another Date
                </button>
              </div>
              <div className="space-y-3">
                {manualDates.map((date, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => updateDate(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {manualDates.length > 1 && (
                      <button
                        onClick={() => removeDateField(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Note:</strong> Each date can only have one schedule. Dates that already have schedules will be rejected.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Selected Dates</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {sortedSelectedDates.map((dateStr) => {
                    const date = parseDate(dateStr);
                    return (
                      <div
                        key={dateStr}
                        className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-md border border-gray-200"
                      >
                        <Calendar size={14} className="text-gray-400" />
                        {date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Schedule *
            </label>
            <select
              value={selectedSchedule}
              onChange={(e) => setSelectedSchedule(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a schedule...</option>
              {availableSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                  {schedule.isSystem ? ' (System)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a note about this schedule assignment..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedSchedule || (!isListViewMode && datesWithSchedules.length > 0)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {isListViewMode ? 'Save Schedule' : 'Apply to All Selected Dates'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkScheduleModal;