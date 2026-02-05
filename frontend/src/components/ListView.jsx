import React, { useState } from 'react';
import { formatDate, parseDate } from '../utils/dateUtils';
import { Filter } from 'lucide-react';
import { SYSTEM_NO_BELL_SCHEDULE } from '../constants';
import { getScheduleColorById, getScheduleName } from '../utils/scheduleUtils';

function ListView({ schedules, dateAssignments, onDateClick, isSelectionMode, selectedDates }) {
  const [filterScheduleId, setFilterScheduleId] = useState('all');

  const allSchedules = [SYSTEM_NO_BELL_SCHEDULE, ...schedules];

  const getScheduleCount = (scheduleId) => {
    if (scheduleId === 'all') {
      return dateAssignments.length;
    }
    return dateAssignments.filter(a => a.scheduleId === scheduleId).length;
  };

  const filteredAssignments = filterScheduleId === 'all'
    ? dateAssignments
    : dateAssignments.filter(a => a.scheduleId === filterScheduleId);

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

  const groupedByMonth = sortedAssignments.reduce((groups, assignment) => {
    const date = parseDate(assignment.date);
    const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(assignment);
    return groups;
  }, {});

  return (
    <>
      <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-gray-600" />
          <select
            value={filterScheduleId}
            onChange={(e) => setFilterScheduleId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Schedules ({getScheduleCount('all')})</option>
            {allSchedules.map((schedule) => {
              const count = getScheduleCount(schedule.id);
              if (count === 0) return null;
              return (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {sortedAssignments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-lg font-medium mb-2">
              {filterScheduleId === 'all' 
                ? 'No scheduled dates found' 
                : `No dates found for "${allSchedules.find(s => s.id === filterScheduleId)?.name}" schedule`
              }
            </div>
            <div className="text-sm">
              {filterScheduleId === 'all'
                ? 'Click on a date in the calendar to assign a schedule'
                : 'Select "All Schedules" to see all assignments'
              }
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedByMonth).map(([monthYear, assignments]) => (
              <div key={monthYear}>
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-300 sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-gray-900">{monthYear}</h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {assignments.map(assignment => {
                    const scheduleName = getScheduleName(assignment.scheduleId, schedules);
                    const date = parseDate(assignment.date);
                    const isTodayDate = assignment.date === today;
                    const schedColor = getScheduleColorById(assignment.scheduleId, schedules);
                    const isNoBell = assignment.scheduleId === 'system-no-bell';
                    
                    return (
                      <div
                        key={assignment.id}
                        onClick={() => onDateClick(date)}
                        className={`p-5 hover:bg-gray-50 cursor-pointer transition-all border-l-[6px] ${
                          isTodayDate ? 'bg-blue-50' : ''
                        }`}
                        style={{ borderLeftColor: schedColor.border }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-medium text-lg ${isTodayDate ? 'text-blue-900' : 'text-gray-900'}`}>
                              {date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                              {isTodayDate && (
                                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span 
                                className="text-xs px-2 py-1 rounded font-medium"
                                style={{
                                  backgroundColor: schedColor.value,
                                  color: schedColor.text
                                }}
                              >
                                {scheduleName}
                              </span>
                              {isNoBell && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  System
                                </span>
                              )}
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ListView;