import React, { useState, useEffect } from 'react';
import { Calendar, List, CalendarPlus, Settings } from 'lucide-react';
import Header from '../components/Header';
import StatusSummary from '../components/StatusSummary';
import CalendarView from '../components/CalendarView';
import ListView from '../components/ListView';
import DateDetailsModal from '../components/DateDetailsModal';
import BulkScheduleModal from '../components/BulkScheduleModal';
import AddBellSound from '../pages/AddBellSound';
import { getSchedules, getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../services/api';

function Dashboard({ user, onLogout, onManageSchedules }) {
  const [schedules, setSchedules] = useState([]);
  const [dateAssignments, setDateAssignments] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBellSounds, setShowBellSounds] = useState(false);

  const loadData = async () => {
    try {
      const [schedulesData, assignmentsData] = await Promise.all([
        getSchedules(),
        getAssignments()
      ]);
      setSchedules(schedulesData);
      setDateAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateClick = (date) => {
    if (isSelectionMode) {
      const dateStr = formatDateString(date);
      
      const hasSchedule = dateAssignments.some(a => a.date === dateStr);
      if (hasSchedule) {
        alert('This date already has a schedule assigned. Please delete the existing schedule first if you want to change it.');
        return;
      }

      setSelectedDates(prev => {
        if (prev.includes(dateStr)) {
          return prev.filter(d => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
    } else {
      setSelectedDate(date);
    }
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSetScheduleMode = () => {
    if (viewMode === 'calendar') {
      setIsSelectionMode(true);
      setSelectedDates([]);
    } else {
      setShowBulkModal(true);
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedDates([]);
  };

  const handleConfirmSelection = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date');
      return;
    }
    setShowBulkModal(true);
  };

  const handleSaveAssignment = async (dates, scheduleId, description, customTimes = null, assignmentId = null, bellSoundId = null) => {
    try {
      if (assignmentId) {
        const updateData = { 
          date: dates[0],
          scheduleId, 
          description, 
          customTimes,
          bellSoundId
        };
        
        await updateAssignment(assignmentId, updateData);
      } else {
        await createAssignment(dates, scheduleId, description, customTimes, bellSoundId);
      }
      
      await loadData();
      
      setSelectedDate(null);
      
      alert(assignmentId ? 'Schedule updated successfully!' : 'Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment: ' + error.message);
    }
  };

  const handleBulkSave = async (scheduleId, description, dates = null) => {
    try {
      const datesToSave = dates || selectedDates;
      await createAssignment(datesToSave, scheduleId, description);
      await loadData();
      setShowBulkModal(false);
      setIsSelectionMode(false);
      setSelectedDates([]);
      alert('Schedules assigned successfully!');
    } catch (error) {
      console.error('Error saving bulk assignment:', error);
      alert('Failed to save schedule assignments: ' + error.message);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await deleteAssignment(assignmentId);
      await loadData();
      alert('Schedule deleted successfully!');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showBellSounds) {
    return <AddBellSound onBack={() => setShowBellSounds(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={onLogout} 
        onManageSchedules={onManageSchedules}
        onManageBellSounds={() => setShowBellSounds(true)}
      />

      <div className="max-w-7xl mx-auto p-6">
        <StatusSummary 
          schedules={schedules} 
          dateAssignments={dateAssignments} 
          onUpdateAssignment={updateAssignment}
          onRefresh={loadData}
        />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                } rounded-l-lg transition-colors`}
              >
                <Calendar size={18} /> Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                } rounded-r-lg transition-colors`}
              >
                <List size={18} /> List
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSelectionMode ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedDates.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Selection
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onManageSchedules}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Settings size={18} />
                  Manage Schedules
                </button>
                <button
                  onClick={handleSetScheduleMode}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CalendarPlus size={18} />
                  Set Schedule
                </button>
              </>
            )}
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <CalendarView
            schedules={schedules}
            dateAssignments={dateAssignments}
            onDateClick={handleDateClick}
            isSelectionMode={isSelectionMode}
            selectedDates={selectedDates}
          />
        ) : (
          <ListView
            schedules={schedules}
            dateAssignments={dateAssignments}
            onDateClick={handleDateClick}
            isSelectionMode={isSelectionMode}
            selectedDates={selectedDates}
          />
        )}

        {selectedDate && !isSelectionMode && (
          <DateDetailsModal
            date={selectedDate}
            schedules={schedules}
            dateAssignments={dateAssignments}
            onClose={() => setSelectedDate(null)}
            onSave={handleSaveAssignment}
            onDelete={handleDeleteAssignment}
          />
        )}

        {showBulkModal && (
          <BulkScheduleModal
            selectedDates={selectedDates}
            schedules={schedules}
            dateAssignments={dateAssignments}
            onClose={() => setShowBulkModal(false)}
            onSave={handleBulkSave}
            isListViewMode={viewMode === 'list'}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;