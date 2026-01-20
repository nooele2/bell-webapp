import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function StatusSummary({ schedules = [], dateAssignments = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const today = formatDate(new Date());
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay();
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Find today's assignment
  const todayAssignments = dateAssignments.filter(a => a.date === today);
  let todaySchedule = null;
  let isUsingDefault = false;
  let scheduleColor = { value: '#fef3c7', border: '#fde047', text: '#854d0e' }; // Default yellow

  if (todayAssignments.length > 0) {
    // Has specific assignment for today
    const assignment = todayAssignments[0];
    todaySchedule = schedules.find(s => s.id === assignment.scheduleId);
    isUsingDefault = false;
    if (todaySchedule?.color) {
      scheduleColor = todaySchedule.color;
    }
  } else if (!isWeekend) {
    // Use default schedule for weekdays without specific assignment
    todaySchedule = schedules.find(s => s.isDefault === true);
    isUsingDefault = true;
    if (todaySchedule?.color) {
      scheduleColor = todaySchedule.color;
    }
  }

  const getScheduleDisplay = () => {
    if (isWeekend && !todaySchedule) {
      return 'Weekend - No school';
    }
    if (todaySchedule) {
      // Just return the schedule name, no (Default) suffix
      return todaySchedule.name;
    }
    return 'No schedule assigned';
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 mb-6 border border-blue-100">
      {/* Date and Time Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {todayDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        
        <div className="text-4xl font-bold tabular-nums bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {formatCurrentTime()}
        </div>
      </div>
      
      {/* Active Schedule Row */}
      <div>
        <div className="text-sm font-semibold text-indigo-700 mb-2">Active Schedule</div>
        {todaySchedule ? (
          <span 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm"
            style={{ 
              backgroundColor: scheduleColor.value,
              color: scheduleColor.text,
              border: `2px solid ${scheduleColor.border}`
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: scheduleColor.border }}
            />
            {todaySchedule.name}
          </span>
        ) : (
          <span className="inline-block px-3 py-1.5 rounded-md font-medium text-sm bg-gray-100 text-gray-500 border-2 border-gray-300">
            {isWeekend ? 'Weekend - No school' : 'No bell'}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatusSummary;