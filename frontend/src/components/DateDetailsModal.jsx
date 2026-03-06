import React, { useState } from 'react';
import { X, Trash2, Plus, Clock } from 'lucide-react';
import { formatDate, formatDisplayDate, isWeekend } from '../utils/dateUtils';
import { SYSTEM_NO_BELL_SCHEDULE } from '../constants';
import { getScheduleColorById } from '../utils/scheduleUtils';

function DateDetailsModal({ date, schedules, dateAssignments, onClose, onSave, onDelete }) {
  const dateStr = formatDate(date);
  const assignments = dateAssignments.filter(a => a.date === dateStr);
  const isWeekendDay = isWeekend(date);
  const defaultSchedule = schedules.find(s => s.isDefault);
  const availableSchedules = [SYSTEM_NO_BELL_SCHEDULE, ...schedules];

  const [isAdding, setIsAdding] = useState(assignments.length === 0 && !isWeekendDay);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!selectedScheduleId) { alert('Please select a schedule'); return; }
    setSaving(true);
    try {
      await onSave([dateStr], selectedScheduleId, description, null, null, null);
      setSelectedScheduleId('');
      setDescription('');
      setIsAdding(false);
    } catch (error) {
      alert('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Remove this schedule from this date?')) {
      try {
        await onDelete(assignmentId);
      } catch (error) {
        alert('Failed to delete: ' + error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formatDisplayDate(date)}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isWeekendDay
                ? 'Weekend — no bells by default'
                : assignments.length === 0
                  ? `Default: ${defaultSchedule?.name || 'Normal Schedule'}`
                  : `${assignments.length} schedule${assignments.length > 1 ? 's' : ''} assigned`
              }
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Current assignments */}
          {assignments.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assigned Schedules</h3>
              <div className="space-y-2">
                {assignments.map(assignment => {
                  const schedule = availableSchedules.find(s => s.id === assignment.scheduleId);
                  const color = getScheduleColorById(assignment.scheduleId, schedules);
                  const bellTimes = schedule?.times || [];

                  return (
                    <div
                      key={assignment.id}
                      className="border-2 rounded-xl p-4"
                      style={{ borderColor: color.border, backgroundColor: color.value }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base" style={{ color: color.text }}>
                            {schedule?.name || 'Unknown'}
                          </div>
                          {assignment.description && (
                            <div className="text-sm mt-0.5 opacity-75" style={{ color: color.text }}>
                              {assignment.description}
                            </div>
                          )}
                          {bellTimes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {bellTimes.slice(0, 4).map((bell, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: color.text }}>
                                  <Clock size={11} />
                                  <span className="font-medium w-10">{bell.time}</span>
                                  <span className="opacity-70">{bell.description}</span>
                                </div>
                              ))}
                              {bellTimes.length > 4 && (
                                <div className="text-xs opacity-50 ml-4" style={{ color: color.text }}>
                                  +{bellTimes.length - 4} more bells
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add schedule section */}
          {isAdding ? (
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                {assignments.length === 0 ? 'Assign a Schedule' : 'Add Another Schedule'}
              </h3>
              <div className="space-y-3">
                <select
                  value={selectedScheduleId}
                  onChange={e => setSelectedScheduleId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  autoFocus
                >
                  <option value="">Choose a schedule...</option>
                  {availableSchedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                      {schedule.isDefault ? ' (Default)' : ''}
                      {schedule.isSystem ? ' (System)' : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Note (optional) e.g. Buddy Class, Chapel..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!selectedScheduleId || saving}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {assignments.length > 0 && (
                    <button
                      onClick={() => { setIsAdding(false); setSelectedScheduleId(''); setDescription(''); }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={18} />
              Add {assignments.length > 0 ? 'Another' : 'a'} Schedule
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateDetailsModal;