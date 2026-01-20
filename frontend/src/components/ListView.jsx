import React from 'react';
import { formatDate, parseDate } from '../utils/dateUtils';

function ListView({ schedules, dateAssignments, filterMode, onDateClick, isSelectionMode, selectedDates }) {
  const filteredAssignments = filterMode
    ? dateAssignments.filter(a => {
        const schedule = schedules.find(s => s.id === a.scheduleId);
        return schedule && schedule.mode === filterMode;
      })
    : dateAssignments;

  // Group assignments by date - keep only the first assignment per date
  const dateMap = new Map();
  filteredAssignments.forEach(assignment => {
    if (!dateMap.has(assignment.date)) {
      dateMap.set(assignment.date, assignment);
    }
  });

  const uniqueAssignments = Array.from(dateMap.values());
  const sortedAssignments = uniqueAssignments.sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  const today = formatDate(new Date());

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

  if (isSelectionMode) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            📅 Selection Mode Active
          </p>
        </div>
        <p className="text-center text-gray-600 py-8">
          Please use Calendar view for date selection. Dates with existing schedules cannot be selected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {sortedAssignments.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No scheduled dates found</div>
          <div className="text-sm">Click on a date in the calendar to assign a schedule</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sortedAssignments.map(assignment => {
            const schedule = schedules.find(s => s.id === assignment.scheduleId);
            const date = parseDate(assignment.date);
            const isTodayDate = assignment.date === today;
            const schedColor = getScheduleColor(assignment.scheduleId);
            
            return schedule ? (
              <div
                key={assignment.id}
                onClick={() => onDateClick(date)}
                className={`p-5 hover:bg-gray-50 cursor-pointer transition-all border-l-4 ${
                  isTodayDate ? 'bg-blue-50' : ''
                }`}
                style={{ borderLeftColor: schedColor.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`font-medium text-lg ${isTodayDate ? 'text-blue-900' : 'text-gray-900'}`}>
                      {date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {isTodayDate && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-medium"
                        style={{
                          backgroundColor: schedColor.value,
                          borderColor: schedColor.border,
                          color: schedColor.text
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: schedColor.border }}
                        />
                        {schedule.name}
                      </div>
                      <span 
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: schedColor.value,
                          color: schedColor.text
                        }}
                      >
                        {schedule.mode}
                      </span>
                      {assignment.customTimes && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Custom Times
                        </span>
                      )}
                    </div>
                    {assignment.description && (
                      <div className="text-sm text-gray-600 mt-2 italic">
                        "{assignment.description}"
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg"
                      style={{
                        backgroundColor: schedColor.value,
                        borderColor: schedColor.border,
                        color: schedColor.text
                      }}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export default ListView;