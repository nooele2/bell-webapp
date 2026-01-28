import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Edit2, Save, X, Plus, Trash2, BellOff } from 'lucide-react';

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function StatusSummary({ schedules = [], dateAssignments = [], onUpdateAssignment, onRefresh }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedTimes, setEditedTimes] = useState([]);
  const [editedScheduleId, setEditedScheduleId] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  const selectedDateStr = formatDate(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isToday = formatDate(new Date()) === selectedDateStr;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const dateAssignmentsForSelected = dateAssignments.filter(a => a.date === selectedDateStr);
  let dateSchedule = null;
  let bellTimes = null;
  let currentAssignment = null;
  let scheduleColor = { value: '#fef3c7', border: '#fbbf24', text: '#854d0e' };
  let isNoBellSchedule = false;

  if (dateAssignmentsForSelected.length > 0) {
    currentAssignment = dateAssignmentsForSelected[0];
    isNoBellSchedule = currentAssignment.scheduleId === 'system-no-bell';
    
    if (isNoBellSchedule) {
      dateSchedule = { id: 'system-no-bell', name: 'No Bell', isSystem: true };
      bellTimes = null;
      scheduleColor = { value: '#fee2e2', border: '#ef4444', text: '#991b1b' };
    } else {
      dateSchedule = schedules.find(s => s.id === currentAssignment.scheduleId);
      bellTimes = currentAssignment.customTimes || dateSchedule?.times;
      if (dateSchedule?.color) {
        scheduleColor = dateSchedule.color;
      }
    }
  } else if (!isWeekend) {
    dateSchedule = schedules.find(s => s.isDefault === true);
    bellTimes = dateSchedule?.times;
    if (dateSchedule?.color) {
      scheduleColor = dateSchedule.color;
    }
  }

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setIsEditing(false);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setIsEditing(false);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (currentAssignment) {
      // Editing existing assignment
      setEditedScheduleId(currentAssignment.scheduleId);
      setEditedDescription(currentAssignment.description || '');
      if (currentAssignment.scheduleId === 'system-no-bell') {
        setEditedTimes([]);
      } else {
        setEditedTimes(JSON.parse(JSON.stringify(bellTimes || [])));
      }
    } else if (dateSchedule) {
      // Creating new assignment from default schedule
      setEditedScheduleId(dateSchedule.id);
      setEditedDescription('');
      setEditedTimes(JSON.parse(JSON.stringify(bellTimes || [])));
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTimes([]);
    setEditedScheduleId('');
    setEditedDescription('');
  };

  const handleScheduleChange = (newScheduleId) => {
    setEditedScheduleId(newScheduleId);
    
    if (newScheduleId === 'system-no-bell') {
      setEditedTimes([]);
    } else {
      const newSchedule = schedules.find(s => s.id === newScheduleId);
      if (newSchedule?.times) {
        setEditedTimes(JSON.parse(JSON.stringify(newSchedule.times)));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editedScheduleId) {
      alert('Please select a schedule');
      return;
    }

    const isNoBell = editedScheduleId === 'system-no-bell';

    if (!isNoBell) {
      const hasEmpty = editedTimes.some(t => !t.time || !t.description.trim());
      if (hasEmpty) {
        alert('Please fill in all bell times and descriptions');
        return;
      }
    }

    try {
      const updateData = {
        date: selectedDateStr,
        scheduleId: editedScheduleId,
        description: editedDescription,
        customTimes: isNoBell ? null : editedTimes
      };

      if (currentAssignment) {
        // Update existing assignment
        if (onUpdateAssignment) {
          await onUpdateAssignment(currentAssignment.id, updateData);
        }
      } else {
        // Create new assignment (was using default)
        const API_BASE_URL = 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}/assignments`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dates: [selectedDateStr],
            scheduleId: editedScheduleId,
            description: editedDescription,
            customTimes: isNoBell ? null : editedTimes
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create assignment');
        }
      }
      
      setIsEditing(false);
      
      // Refresh the parent component's data
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Schedule updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const addBellTime = () => {
    setEditedTimes([...editedTimes, { time: '', description: '' }]);
  };

  const removeBellTime = (index) => {
    if (editedTimes.length <= 1) {
      alert('You must have at least one bell time');
      return;
    }
    setEditedTimes(editedTimes.filter((_, i) => i !== index));
  };

  const updateBellTime = (index, field, value) => {
    const newTimes = [...editedTimes];
    newTimes[index][field] = value;
    setEditedTimes(newTimes);
  };

  const displayTimes = isEditing ? editedTimes : bellTimes;
  const displaySchedule = isEditing 
    ? (editedScheduleId === 'system-no-bell' 
        ? { id: 'system-no-bell', name: 'No Bell', isSystem: true }
        : schedules.find(s => s.id === editedScheduleId))
    : dateSchedule;
  const displayColor = displaySchedule?.color || scheduleColor;
  const displayIsNoBell = isEditing ? editedScheduleId === 'system-no-bell' : isNoBellSchedule;

  // Include system "No Bell" schedule in available schedules
  const availableSchedules = [
    { id: 'system-no-bell', name: 'No Bell', isSystem: true },
    ...schedules
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-4 overflow-hidden">
      {/* Gradient Header */}
      <div 
        className="p-4 border-b border-gray-200"
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              disabled={isEditing}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-50 transition-colors text-white"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            
            <button
              onClick={goToNextDay}
              disabled={isEditing}
              className="p-1 hover:bg-white/20 rounded disabled:opacity-50 transition-colors text-white"
            >
              <ChevronRight size={20} />
            </button>

            {!isToday && !isEditing && (
              <button
                onClick={goToToday}
                className="ml-2 px-2 py-1 text-xs bg-white text-purple-700 hover:bg-white/90 rounded transition-colors font-medium"
              >
                Go to Today
              </button>
            )}
          </div>

          <div className="text-2xl font-bold tabular-nums text-white">
            {formatCurrentTime()}
          </div>
        </div>
      </div>

      {/* Content area */}
      {isWeekend && !dateSchedule ? (
        <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">It's the Weekend!</h3>
          <p className="text-gray-600 text-lg">Time to relax and recharge. No bells scheduled.</p>
        </div>
      ) : (displayTimes && displayTimes.length > 0) || displayIsNoBell ? (
        <div className="p-4">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={editedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose schedule...</option>
                  {availableSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} {schedule.isSystem ? '(System)' : ''}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Note (optional)"
                  className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={handleSaveEdit}
                  className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center gap-1"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {dateSchedule ? (
                  <>
                    <h3 className="text-base font-semibold text-gray-900">
                      Bell Schedule
                    </h3>
                    <span 
                      className="px-2 py-0.5 rounded text-sm font-medium"
                      style={{ 
                        backgroundColor: scheduleColor.value,
                        color: scheduleColor.text
                      }}
                    >
                      {dateSchedule.name}
                    </span>
                    {!currentAssignment && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    {dateSchedule.isSystem && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        System
                      </span>
                    )}
                  </>
                ) : (
                  <h3 className="text-base font-semibold text-gray-900">
                    Bell Schedule
                  </h3>
                )}
                {currentAssignment?.description && (
                  <span className="text-sm text-gray-500 italic">
                    ({currentAssignment.description})
                  </span>
                )}
                {currentAssignment?.customTimes && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </div>

              {/* Show edit button for both assigned schedules and default schedule */}
              {dateSchedule && !isWeekend && (
                <button
                  onClick={handleStartEdit}
                  className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              )}
            </div>
          )}

          {isEditing ? (
            editedScheduleId === 'system-no-bell' ? (
              <div className="text-center py-4 bg-red-50 text-red-900 text-sm rounded border-2 border-red-200">
                <BellOff size={24} className="mx-auto mb-2 text-red-600" />
                <span className="font-medium">No bells will ring on this day</span>
              </div>
            ) : (
              <div className="space-y-2">
                {editedTimes.map((bell, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                    <input
                      type="time"
                      value={bell.time}
                      onChange={(e) => updateBellTime(index, 'time', e.target.value)}
                      className="px-2 py-1 text-sm border rounded w-24"
                    />
                    <input
                      type="text"
                      value={bell.description}
                      onChange={(e) => updateBellTime(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                    <button
                      onClick={() => removeBellTime(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      disabled={editedTimes.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addBellTime}
                  className="w-full text-blue-600 border border-dashed border-blue-300 hover:bg-blue-50 px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                >
                  <Plus size={16} />
                  Add Bell Time
                </button>
              </div>
            )
          ) : (
            isNoBellSchedule ? (
              <div className="text-center py-4 bg-red-50 text-red-900 text-sm rounded border-2 border-red-200">
                <BellOff size={24} className="mx-auto mb-2 text-red-600" />
                <span className="font-medium">No bells will ring on this day</span>
              </div>
            ) : (
              <div className="space-y-2">
                {displayTimes && displayTimes.map((bell, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded border"
                  >
                    <span className="text-sm font-bold tabular-nums w-12 text-gray-700">
                      {bell.time}
                    </span>
                    <span className="text-sm text-gray-700">
                      {bell.description}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="text-6xl mb-4">🏖️</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No School Today</h3>
          <p className="text-gray-600 text-lg">Enjoy your day off! No bell schedule assigned.</p>
        </div>
      )}
    </div>
  );
}

export default StatusSummary;