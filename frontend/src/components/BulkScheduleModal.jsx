import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { SYSTEM_NO_BELL_SCHEDULE } from '../constants';

function BulkScheduleModal({ selectedDates, schedules, onClose, onSave }) {
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState(selectedDates.length > 0 ? 'dates' : 'range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);

  const availableSchedules = [SYSTEM_NO_BELL_SCHEDULE, ...schedules];

  const generateDatesInRange = (start, end, weekdaysOnly) => {
    const dates = [];
    const current = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    while (current <= last) {
      const day = current.getDay();
      if (!weekdaysOnly || (day !== 0 && day !== 6)) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const previewCount = startDate && endDate && startDate <= endDate
    ? generateDatesInRange(startDate, endDate, weekdaysOnly).length
    : 0;

  const handleSave = () => {
    if (!selectedSchedule) { alert('Please select a schedule'); return; }
    if (mode === 'range') {
      if (!startDate || !endDate) { alert('Please select start and end dates'); return; }
      if (startDate > endDate) { alert('Start date must be before end date'); return; }
      const dates = generateDatesInRange(startDate, endDate, weekdaysOnly);
      if (dates.length === 0) { alert('No dates in that range'); return; }
      onSave(selectedSchedule, description, dates);
    } else {
      if (selectedDates.length === 0) { alert('Please select at least one date'); return; }
      onSave(selectedSchedule, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Assign Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('dates')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'dates' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Selected Dates ({selectedDates.length})
            </button>
            <button
              onClick={() => setMode('range')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'range' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Date Range
            </button>
          </div>

          {mode === 'dates' ? (
            <div className="mb-6">
              {selectedDates.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                  No dates selected. Go back and click dates on the calendar first.
                </p>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {[...selectedDates].sort().map(dateStr => {
                      const date = new Date(dateStr + 'T00:00:00');
                      return (
                        <div key={dateStr} className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-md border border-gray-200">
                          <Calendar size={14} className="text-gray-400" />
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weekdaysOnly}
                  onChange={e => setWeekdaysOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Weekdays only (skip weekends)</span>
              </label>
              {previewCount > 0 && (
                <p className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                  📅 {previewCount} days will be assigned
                </p>
              )}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule *</label>
            <select
              value={selectedSchedule}
              onChange={e => setSelectedSchedule(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a schedule...</option>
              {availableSchedules.map(schedule => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}{schedule.isSystem ? ' (System)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Christmas Break, Late Start..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedSchedule || (mode === 'dates' && selectedDates.length === 0)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              Apply Schedule
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkScheduleModal;