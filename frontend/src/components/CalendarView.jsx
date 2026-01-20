import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react';
import { formatDate, getDaysInMonth, isToday, isWeekend } from '../utils/dateUtils';

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
    const schedule = schedules.find(s => s.id === scheduleId);
    // Default to green if not set
    const defaultColor = { value: '#d1fae5', border: '#34d399', text: '#065f46' };
    
    if (!schedule || !schedule.color) {
      return defaultColor;
    }
    
    // Return the schedule's color (works for both preset and custom colors)
    return schedule.color;
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
  const defaultColor = defaultSchedule?.color || { value: '#fef3c7', border: '#fde047', text: '#854d0e' };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            📅 Selection Mode: Click on dates to select/deselect them (dates with existing schedules cannot be selected)
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
        <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
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
          
          // Get the color for this date
          let cellColor = { value: 'transparent', border: '#e5e7eb', text: '#111827' };
          if (assignments.length > 0) {
            cellColor = getScheduleColor(assignments[0].scheduleId);
          } else if (hasDefault) {
            cellColor = defaultColor;
          }
          
          return (
            <div
              key={index}
              onClick={() => date && isClickable && onDateClick(date)}
              className={`min-h-24 p-2 border-2 rounded-md transition-all relative ${
                !date ? 'bg-gray-50 cursor-default' : 
                isWeekendDay ? 'bg-gray-100 border-gray-300 cursor-not-allowed' :
                isSelected ? 'bg-green-100 border-green-400 ring-2 ring-green-300 cursor-pointer' :
                isTodayDate ? 'ring-2 ring-blue-400 cursor-pointer' :
                isSelectionMode && dateHasAssignment ? 'cursor-not-allowed' :
                'hover:shadow-md cursor-pointer'
              }`}
              style={!isWeekendDay && !isSelected && date ? {
                backgroundColor: cellColor.value,
                borderColor: cellColor.border
              } : {}}
            >
              {date && (
                <>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5">
                      <Check size={12} />
                    </div>
                  )}
                  
                  {isSelectionMode && dateHasAssignment && (
                    <div className="absolute top-1 right-1 bg-gray-500 text-white rounded-full p-0.5">
                      <Lock size={12} />
                    </div>
                  )}
                  
                  <div className={`text-sm font-medium mb-1 ${
                    isSelected ? 'text-green-700' :
                    isTodayDate ? 'text-blue-700' : 
                    isWeekendDay ? 'text-gray-400' :
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
                      {isWeekendDay && (
                        <div className="text-xs text-gray-400 text-center">
                          Weekend
                        </div>
                      )}
                      
                      {!isWeekendDay && assignments.length === 0 && defaultSchedule && (
                        <div className="text-xs text-center font-medium" style={{ color: defaultColor.text }}>
                          {defaultSchedule.name}
                        </div>
                      )}
                      
                      {assignments.length > 0 && (
                        <div className="space-y-1">
                          {assignments.slice(0, 3).map(assignment => {
                            const schedule = schedules.find(s => s.id === assignment.scheduleId);
                            const schedColor = getScheduleColor(assignment.scheduleId);
                            return schedule ? (
                              <div
                                key={assignment.id}
                                className="text-xs bg-white rounded px-1.5 py-0.5 truncate shadow-sm border font-medium"
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
                    </>
                  )}
                  
                  {isSelectionMode && dateHasAssignment && (
                    <div className="text-xs text-gray-500 text-center mt-1">
                      Assigned
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
            <div className="w-4 h-4 border-2 border-blue-400 rounded ring-2 ring-blue-200"></div>
            <span className="text-gray-600">Today</span>
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
              <span className="text-gray-600">{defaultSchedule.name} (Default)</span>
            </div>
          )}
          {schedules.filter(s => !s.isDefault).map(schedule => {
            const hasAssignments = dateAssignments.some(a => a.scheduleId === schedule.id);
            if (!hasAssignments) return null;
            
            const schedColor = schedule.color || { value: '#d1fae5', border: '#34d399', text: '#065f46' };
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
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Weekend</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;