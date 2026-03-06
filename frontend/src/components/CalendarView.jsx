import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
    return assignments.length === 0 && !isWeekend(date) && defaultSchedule;
  };

  const getDefaultSchedule = () => schedules.find(s => s.isDefault === true);

  const isDateSelected = (date) => {
    if (!date || !isSelectionMode) return false;
    return selectedDates.includes(formatDate(date));
  };

  const getScheduleColor = (scheduleId) => getScheduleColorById(scheduleId, schedules);

  const days = getDaysInMonth(currentMonth);
  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const defaultSchedule = getDefaultSchedule();
  const defaultColor = defaultSchedule?.color || { value: '#fef3c7', border: '#fbbf24', text: '#854d0e' };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            📅 Click dates to select them. You can select dates that already have schedules to add more!
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={previousMonth} className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
            className="px-3 py-1.5 text-base font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
          >
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month, index) => (
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

        <button onClick={nextMonth} className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">{day}</div>
        ))}

        {days.map((date, index) => {
          const assignments = getAssignmentsForDate(date);
          const isTodayDate = date && isToday(date);
          const isWeekendDay = date && isWeekend(date);
          const hasDefault = hasDefaultSchedule(date);
          const isSelected = isDateSelected(date);
          const isClickable = date && !isWeekendDay;

          return (
            <div
              key={index}
              onClick={() => isClickable && onDateClick(date)}
              className={`min-h-24 p-2 rounded-lg transition-all relative ${
                !date ? 'bg-gray-50 cursor-default' :
                isWeekendDay ? 'bg-white border border-gray-200 cursor-default' :
                isSelected ? 'bg-green-100 border-2 border-green-400 ring-2 ring-green-300 cursor-pointer' :
                isTodayDate ? 'border-4 border-blue-600 shadow-lg cursor-pointer' :
                'hover:shadow-md cursor-pointer border border-transparent hover:border-gray-200'
              }`}
              style={!isWeekendDay && !isSelected && !isTodayDate && date ? {
                backgroundColor: assignments.length > 0
                  ? getScheduleColor(assignments[0].scheduleId).value
                  : hasDefault ? defaultColor.value : 'white'
              } : isTodayDate && date ? { backgroundColor: '#3b82f6' } : {}}
            >
              {date && (
                <>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5">
                      <Check size={12} />
                    </div>
                  )}

                  <div className={`text-base font-black mb-1 ${
                    isTodayDate ? 'text-white text-2xl' :
                    isSelected ? 'text-green-700' :
                    isWeekendDay ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>

                  {!isSelectionMode && (
                    <>
                      {isWeekendDay && (
                        <div className="text-xs text-gray-400 text-center">Weekend</div>
                      )}

                      {!isWeekendDay && assignments.length === 0 && defaultSchedule && !isTodayDate && (
                        <div className="text-xs text-center font-medium" style={{ color: defaultColor.text }}>
                          {defaultSchedule.name}
                        </div>
                      )}

                      {!isWeekendDay && assignments.length === 0 && defaultSchedule && isTodayDate && (
                        <div className="text-xs text-center font-bold text-white">{defaultSchedule.name}</div>
                      )}

                      {assignments.length > 0 && (
                        <div className="space-y-1">
                          {assignments.slice(0, 3).map(assignment => {
                            const schedule = [...schedules, SYSTEM_NO_BELL_SCHEDULE].find(s => s.id === assignment.scheduleId);
                            const isNoBell = assignment.scheduleId === 'system-no-bell';
                            const schedColor = getScheduleColor(assignment.scheduleId);

                            if (isNoBell) {
                              return (
                                <div key={assignment.id} className="text-xs text-center font-bold" style={{ color: schedColor.text }}>
                                  No Bell
                                </div>
                              );
                            }

                            return schedule ? (
                              <div
                                key={assignment.id}
                                className={`text-xs rounded px-1.5 py-0.5 truncate border font-medium ${isTodayDate ? 'bg-white border-blue-700 text-blue-900' : 'bg-white'}`}
                                style={!isTodayDate ? { borderColor: schedColor.border, color: schedColor.text } : {}}
                                title={schedule.name}
                              >
                                {schedule.name}
                              </div>
                            ) : null;
                          })}
                          {assignments.length > 3 && (
                            <div className="text-xs text-gray-500 px-1">+{assignments.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </>
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
              <div className="w-4 h-4 border-2 rounded" style={{ backgroundColor: defaultColor.value, borderColor: defaultColor.border }}></div>
              <span className="text-gray-600">{defaultSchedule.name} (Default)</span>
            </div>
          )}
          {schedules.filter(s => !s.isDefault).map(schedule => {
            const hasAssignments = dateAssignments.some(a => a.scheduleId === schedule.id);
            if (!hasAssignments) return null;
            const schedColor = schedule.color || { value: '#d1fae5', border: '#10b981', text: '#065f46' };
            return (
              <div key={schedule.id} className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 rounded" style={{ backgroundColor: schedColor.value, borderColor: schedColor.border }}></div>
                <span className="text-gray-600">{schedule.name}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
            <span className="text-gray-600">Weekend</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;