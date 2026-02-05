import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react';
import { formatDate, getDaysInMonth, isToday, isWeekend } from '../utils/dateUtils';
import { SYSTEM_NO_BELL_SCHEDULE } from '../constants';
import { getScheduleColorById } from '../utils/scheduleUtils';

function CalendarView({ schedules, dateAssignments, onDateClick, isSelectionMode, selectedDates }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getAssignmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return dateAssignments.filter(a => a.date === dateStr);
  };

  const hasDefaultSchedule = (date) => {
    if (!date) return false;
    const assignments = getAssignmentsForDate(date);
    const defaultSchedule = schedules.find(s => s.isDefault === true);
    // FIXED: Only apply default if NOT weekend
    return assignments.length === 0 && !isWeekend(date) && defaultSchedule;
  };

  const getDefaultSchedule = () => {
    return schedules.find(s => s.isDefault === true);
  };

  const isDateSelected = (date) => {
    if (!date || !isSelectionMode) return false;
    const dateStr = formatDate(date);
    return selectedDates.includes(dateStr);
  };

  const hasAssignment = (date) => {
    if (!date) return false;
    const assignments = getAssignmentsForDate(date);
    return assignments.length > 0;
  };

  const canSelectDate = (date) => {
    if (!date || !isSelectionMode) return true;
    return !isWeekend(date) && !hasAssignment(date);
  };

  const getScheduleColor = (scheduleId) => {
    return getScheduleColorById(scheduleId, schedules);
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const defaultSchedule = getDefaultSchedule();
  const defaultColor = defaultSchedule?.color || { value: '#fef3c7', border: '#fbbf24', text: '#854d0e' };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            📅 Selection Mode: Click on dates to select/deselect them (weekends and dates with existing schedules cannot be selected)
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
            className="px-3 py-1.5 text-base font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          
          <select
            value={currentMonth.getFullYear()}
            onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))}
            className="px-3 py-1.5 text-base font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={nextMonth}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => {
          const assignments = getAssignmentsForDate(date);
          const isTodayDate = date && isToday(date);
          const isWeekendDay = date && isWeekend(date);
          const hasDefault = hasDefaultSchedule(date);
          const isSelected = isDateSelected(date);
          const dateHasAssignment = hasAssignment(date);
          const isClickable = canSelectDate(date);
          
          // FIXED: Better color logic with weekend check
          let cellColor = { value: 'transparent', border: '#e5e7eb', text: '#111827' };
          if (assignments.length > 0) {
            // Has assignment - use its color
            cellColor = getScheduleColor(assignments[0].scheduleId);
          } else if (hasDefault && !isWeekendDay) {
            // Has default and NOT weekend - use default color
            cellColor = defaultColor;
          }
          // else: no assignment, no default, or is weekend - use transparent
          
          return (
            <div
              key={index}
              onClick={() => date && isClickable && onDateClick(date)}
              className={`min-h-24 p-2 rounded-lg transition-all relative ${
                !date ? 'bg-gray-50 cursor-default' : 
                isWeekendDay ? 'bg-white border border-gray-500 cursor-pointer' :
                isSelected ? 'bg-green-100 border-2 border-green-400 ring-2 ring-green-300 cursor-pointer' :
                isTodayDate ? 'border-4 border-blue-600 shadow-lg cursor-pointer' :
                isSelectionMode && dateHasAssignment ? 'cursor-not-allowed' :
                'hover:shadow-md cursor-pointer'
              }`}
              style={!isWeekendDay && !isSelected && !isTodayDate && date ? {
                backgroundColor: cellColor.value
              } : isTodayDate && date ? {
                backgroundColor: '#3b82f6',
                borderColor: '#1d4ed8'
              } : {}}
            >
              {date && (
                <>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5">
                      <Check size={12} />
                    </div>
                  )}
                  
                  {isSelectionMode && (dateHasAssignment || isWeekendDay) && (
                    <div className="absolute top-1 right-1 bg-gray-500 text-white rounded-full p-0.5">
                      <Lock size={12} />
                    </div>
                  )}
                  
                  <div className={`text-base font-black mb-1 ${
                    isTodayDate ? 'text-white text-2xl' :
                    isSelected ? 'text-green-700' :
                    isWeekendDay ? 'text-gray-800' :
                    'text-gray-900'
                  }`}
                  style={!isWeekendDay && !isSelected && !isTodayDate && date ? {
                    color: cellColor.text
                  } : {}}
                  >
                    {date.getDate()}
                  </div>
                  
                  {!isSelectionMode && (
                    <>
                      {/* WEEKEND LABEL */}
                      {isWeekendDay && (
                        <div className="text-xs text-gray-800 text-center">
                          Weekend
                        </div>
                      )}
                      
                      {/* DEFAULT SCHEDULE (Only on weekdays) - Use schedule's text color */}
                      {!isWeekendDay && assignments.length === 0 && defaultSchedule && !isTodayDate && (
                        <div 
                          className="text-xs text-center font-medium"
                          style={{ color: defaultColor.text }}
                        >
                          {defaultSchedule.name}
                        </div>
                      )}
                      
                      {/* DEFAULT SCHEDULE ON TODAY (Only on weekdays) */}
                      {!isWeekendDay && assignments.length === 0 && defaultSchedule && isTodayDate && (
                        <div className="text-xs text-center font-bold text-white">
                          {defaultSchedule.name}
                        </div>
                      )}
                      
                      {/* ASSIGNED SCHEDULES (Not today) */}
                      {assignments.length > 0 && !isTodayDate && (
                        <div className="space-y-1">
                          {assignments.slice(0, 3).map(assignment => {
                            const schedule = schedules.find(s => s.id === assignment.scheduleId);
                            const isNoBell = assignment.scheduleId === 'system-no-bell';
                            const schedColor = getScheduleColor(assignment.scheduleId);
                            
                            if (isNoBell) {
                              return (
                                <div
                                  key={assignment.id}
                                  className="text-xs text-center font-bold"
                                  style={{ color: schedColor.text }}
                                  title="No Bell"
                                >
                                  No Bell
                                </div>
                              );
                            }
                            
                            return schedule ? (
                              <div
                                key={assignment.id}
                                className="text-xs bg-white rounded px-1.5 py-0.5 truncate shadow-sm border-2 font-medium"
                                style={{ 
                                  borderColor: schedColor.border,
                                  color: schedColor.text
                                }}
                                title={schedule.name}
                              >
                                {schedule.name}
                              </div>
                            ) : null;
                          })}
                          {assignments.length > 3 && (
                            <div className="text-xs px-1" style={{ color: cellColor.text }}>
                              +{assignments.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* ASSIGNED SCHEDULES (Today) */}
                      {assignments.length > 0 && isTodayDate && (
                        <div className="space-y-1">
                          {assignments.slice(0, 3).map(assignment => {
                            const schedule = schedules.find(s => s.id === assignment.scheduleId);
                            const isNoBell = assignment.scheduleId === 'system-no-bell';
                            
                            if (isNoBell) {
                              return (
                                <div
                                  key={assignment.id}
                                  className="text-xs text-center font-bold text-white"
                                  title="No Bell"
                                >
                                  No Bell
                                </div>
                              );
                            }
                            
                            return schedule ? (
                              <div
                                key={assignment.id}
                                className="text-xs bg-white rounded px-1.5 py-0.5 truncate shadow-sm border-2 border-blue-700 font-bold text-blue-900"
                                title={schedule.name}
                              >
                                {schedule.name}
                              </div>
                            ) : null;
                          })}
                          {assignments.length > 3 && (
                            <div className="text-xs px-1 text-white font-bold">
                              +{assignments.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {isSelectionMode && (dateHasAssignment || isWeekendDay) && (
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {isWeekendDay ? 'Weekend' : 'Assigned'}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {!isSelectionMode && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-blue-600 border-4 border-blue-800"></div>
            <span className="text-gray-900 font-bold">Today</span>
          </div>
          {defaultSchedule && (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 border-2 rounded"
                style={{
                  backgroundColor: defaultColor.value,
                  borderColor: defaultColor.border
                }}
              ></div>
              <span className="text-gray-600">{defaultSchedule.name} (Default - Weekdays only)</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 border-2 rounded"
              style={{
                backgroundColor: '#fee2e2',
                borderColor: '#ef4444'
              }}
            ></div>
            <span className="text-gray-600">No Bell</span>
          </div>
          {schedules.filter(s => !s.isDefault).map(schedule => {
            const hasAssignments = dateAssignments.some(a => a.scheduleId === schedule.id);
            if (!hasAssignments) return null;
            
            const schedColor = schedule.color || { value: '#d1fae5', border: '#10b981', text: '#065f46' };
            return (
              <div key={schedule.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 border-2 rounded"
                  style={{
                    backgroundColor: schedColor.value,
                    borderColor: schedColor.border
                  }}
                ></div>
                <span className="text-gray-600">{schedule.name}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span className="text-gray-600">Weekend</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;