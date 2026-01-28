import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Clock, Edit2, Trash2, Save, X, Star, BellOff, Volume2, Palette } from 'lucide-react';
import { getBellSounds, getBellSoundUrl } from '../services/bellSoundsApi';
import BellSoundSelector from '../components/Bellsoundselector';
import ColorPicker from '../components/Colorpicker';

// API functions
const API_BASE_URL = 'http://localhost:5001/api';

const getSchedules = async () => {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch schedules');
  return response.json();
};

const createSchedule = async (schedule) => {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error('Failed to create schedule');
  return response.json();
};

const updateSchedule = async (id, schedule) => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) throw new Error('Failed to update schedule');
  return response.json();
};

const deleteSchedule = async (id) => {
  const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete schedule');
  return response.json();
};

// Color presets for fallback with border colors
const COLOR_PRESETS = [
  { name: 'Yellow', value: '#fef3c7', border: '#fbbf24', text: '#854d0e' },
  { name: 'Blue', value: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'Green', value: '#d1fae5', border: '#10b981', text: '#065f46' },
  { name: 'Purple', value: '#e9d5ff', border: '#a855f7', text: '#5b21b6' },
  { name: 'Pink', value: '#fce7f3', border: '#ec4899', text: '#9f1239' },
  { name: 'Orange', value: '#fed7aa', border: '#f97316', text: '#7c2d12' },
  { name: 'Red', value: '#fecaca', border: '#ef4444', text: '#7f1d1d' },
  { name: 'Teal', value: '#ccfbf1', border: '#14b8a6', text: '#134e4a' },
  { name: 'Indigo', value: '#e0e7ff', border: '#6366f1', text: '#312e81' },
  { name: 'Lime', value: '#ecfccb', border: '#84cc16', text: '#365314' },
  { name: 'Gray', value: '#f3f4f6', border: '#6b7280', text: '#374151' },
  { name: 'Cyan', value: '#cffafe', border: '#06b6d4', text: '#164e63' },
];

// System "No Bell" schedule configuration
const SYSTEM_NO_BELL_SCHEDULE = {
  id: 'system-no-bell',
  name: 'No Bell',
  mode: 'No Bell',
  isDefault: false,
  isSystem: true,
  color: { name: 'Gray', value: '#f3f4f6', border: '#6b7280', text: '#374151' },
  times: []
};

function ManageSchedules({ onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [bellSounds, setBellSounds] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingBellSoundId, setPlayingBellSoundId] = useState(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    loadSchedules();
    loadBellSounds();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await getSchedules();
      const schedulesWithNoBell = [SYSTEM_NO_BELL_SCHEDULE, ...data];
      setSchedules(schedulesWithNoBell);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([SYSTEM_NO_BELL_SCHEDULE]);
    } finally {
      setLoading(false);
    }
  };

  const loadBellSounds = async () => {
    try {
      const sounds = await getBellSounds();
      setBellSounds(sounds);
    } catch (error) {
      console.error('Error loading bell sounds:', error);
    }
  };

  const handlePlayBellSound = (soundId) => {
    if (playingBellSoundId === soundId && audioRef.current) {
      // Stop playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingBellSoundId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const audio = new Audio(getBellSoundUrl(soundId));
      audioRef.current = audio;
      
      audio.play();
      setPlayingBellSoundId(soundId);
      
      audio.onended = () => {
        setPlayingBellSoundId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Error playing audio');
        setPlayingBellSoundId(null);
        audioRef.current = null;
        alert('Failed to play audio');
      };
    } catch (error) {
      console.error('Playback error:', error);
      alert('Failed to play audio');
      setPlayingBellSoundId(null);
      audioRef.current = null;
    }
  };

  const handleAddNew = () => {
    setEditingSchedule({
      id: null,
      name: '',
      mode: '',
      isDefault: false,
      color: { name: 'Yellow', value: '#fef3c7', border: '#fbbf24', text: '#854d0e' },
      bellSoundId: null,
      times: [{ time: '', description: '' }]
    });
    setIsEditing(true);
  };

  const handleEdit = (schedule) => {
    if (schedule.isSystem) {
      alert('System schedules cannot be edited.');
      return;
    }
    
    const scheduleWithColor = {
      ...schedule,
      color: schedule.color || { name: 'Yellow', value: '#fef3c7', border: '#fbbf24', text: '#854d0e' },
      bellSoundId: schedule.bellSoundId || null
    };
    
    setEditingSchedule(scheduleWithColor);
    setIsEditing(true);
  };

  const handleDelete = async (scheduleId) => {
    const scheduleToDelete = schedules.find(s => s.id === scheduleId);
    
    if (scheduleToDelete?.isSystem) {
      alert('System schedules cannot be deleted.');
      return;
    }

    if (scheduleToDelete?.isDefault) {
      alert('Cannot delete the default schedule. Please set another schedule as default first.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(scheduleId);
        setSchedules(schedules.filter(s => s.id !== scheduleId));
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
      }
    }
  };

  const handleMakeDefault = async (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (schedule?.isSystem) {
      alert('The "No Bell" system schedule cannot be set as the default schedule. Please choose a regular schedule with bell times.');
      return;
    }

    if (window.confirm('Set this schedule as the default for all weekdays? This will apply to all dates that don\'t have a specific schedule assigned.')) {
      try {
        const updatedSchedules = schedules.map(s => {
          if (s.isSystem) return s;
          return {
            ...s,
            isDefault: s.id === scheduleId
          };
        });

        for (const schedule of updatedSchedules) {
          if (!schedule.isSystem) {
            await updateSchedule(schedule.id, schedule);
          }
        }

        setSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error setting default schedule:', error);
        alert('Failed to set default schedule');
      }
    }
  };

  const handleSave = async () => {
    if (!editingSchedule.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    if (editingSchedule.times.some(t => !t.time || !t.description)) {
      alert('Please fill in all bell times and descriptions');
      return;
    }

    try {
      const scheduleToSave = {
        ...editingSchedule,
        mode: editingSchedule.name
      };

      if (editingSchedule.id) {
        const savedSchedule = await updateSchedule(editingSchedule.id, scheduleToSave);
        setSchedules(schedules.map(s => s.id === editingSchedule.id ? savedSchedule : s));
      } else {
        const savedSchedule = await createSchedule(scheduleToSave);
        setSchedules([...schedules, savedSchedule]);
      }
      
      setIsEditing(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSchedule(null);
  };

  const addBellTime = () => {
    setEditingSchedule({
      ...editingSchedule,
      times: [...editingSchedule.times, { time: '', description: '' }]
    });
  };

  const removeBellTime = (index) => {
    setEditingSchedule({
      ...editingSchedule,
      times: editingSchedule.times.filter((_, i) => i !== index)
    });
  };

  const updateBellTime = (index, field, value) => {
    const newTimes = [...editingSchedule.times];
    newTimes[index][field] = value;
    setEditingSchedule({
      ...editingSchedule,
      times: newTimes
    });
  };

  const getBellSoundName = (bellSoundId) => {
    if (!bellSoundId) return 'Default Bell';
    const sound = bellSounds.find(s => s.id === bellSoundId);
    return sound ? sound.name : 'Default Bell';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Manage Schedules</h1>
            </div>
            {!isEditing && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {editingSchedule.id ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>

            {/* Schedule Name and Color - Two Column Layout */}
            <div className="mb-6 grid grid-cols-2 gap-6">
              {/* Schedule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={editingSchedule.name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  placeholder="e.g., Normal Schedule, Late Start, Early Release"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Color *
                </label>
                <ColorPicker
                  selectedColor={editingSchedule.color}
                  onColorSelect={(color) => setEditingSchedule({ ...editingSchedule, color })}
                />
              </div>
            </div>

            {/* Bell Sound Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bell Sound
              </label>
              
              <BellSoundSelector
                bellSounds={bellSounds}
                selectedBellSoundId={editingSchedule.bellSoundId}
                onSelect={(soundId) => setEditingSchedule({ ...editingSchedule, bellSoundId: soundId })}
                playingBellSoundId={playingBellSoundId}
                onPlay={handlePlayBellSound}
              />
              
              <p className="text-xs text-gray-500 mt-2">
                Select a custom bell sound or use the default. Click the play button to preview.
              </p>
            </div>

            {/* Bell Times */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Bell Times *
                </label>
                <button
                  onClick={addBellTime}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Bell Time
                </button>
              </div>

              <div className="space-y-3">
                {editingSchedule.times.map((bell, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <Clock size={18} className="text-gray-400" />
                    <input
                      type="time"
                      value={bell.time}
                      onChange={(e) => updateBellTime(index, 'time', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={bell.description}
                      onChange={(e) => updateBellTime(index, 'description', e.target.value)}
                      placeholder="e.g., Class Start, Break, Lunch"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {editingSchedule.times.length > 1 && (
                      <button
                        onClick={() => removeBellTime(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Save size={18} />
                Save Schedule
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.length === 1 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No custom schedules yet</h3>
                <p className="text-gray-600 mb-4">The system "No Bell" schedule is available. Create your first custom schedule to get started.</p>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Schedule
                </button>
              </div>
            ) : (
              schedules.map((schedule) => {
                const scheduleColor = schedule.color || COLOR_PRESETS[0];
                const isCustom = scheduleColor.name === 'Custom';
                const isNoBell = !schedule.times || schedule.times.length === 0;
                const isSystem = schedule.isSystem || false;
                const bellSoundName = getBellSoundName(schedule.bellSoundId);
                
                return (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                      isSystem ? 'border-2 border-gray-300' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: scheduleColor.value
                            }}
                          >
                            {isNoBell && (
                              <BellOff size={14} style={{ color: scheduleColor.text }} />
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">{schedule.name}</h3>
                          {schedule.isDefault && (
                            <span
                              className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium"
                              style={{
                                backgroundColor: scheduleColor.value,
                                color: scheduleColor.text
                              }}
                            >
                              <Star size={14} fill="currentColor" />
                              Default Schedule
                            </span>
                          )}
                          {isSystem && (
                            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                              System Schedule
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-600">
                            {isNoBell ? 'No bells will ring' : `${schedule.times.length} bell${schedule.times.length !== 1 ? 's' : ''}`}
                          </span>
                          <span
                            className="text-xs px-2 py-1 rounded flex items-center gap-1"
                            style={{
                              backgroundColor: scheduleColor.value,
                              color: scheduleColor.text
                            }}
                          >
                            {isCustom && <Palette size={12} />}
                            {isCustom ? 'Custom Color' : scheduleColor.name}
                          </span>
                          {!isNoBell && (
                            <span className="text-xs px-2 py-1 rounded flex items-center gap-1 bg-gray-100 text-gray-700">
                              <Volume2 size={12} />
                              {bellSoundName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isSystem && !schedule.isDefault && (
                          <button
                            onClick={() => handleMakeDefault(schedule.id)}
                            className="px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            title="Make default schedule"
                          >
                            <Star size={18} />
                            Make Default
                          </button>
                        )}
                        {!isSystem && (
                          <>
                            <button
                              onClick={() => handleEdit(schedule)}
                              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                              title="Edit schedule"
                            >
                              <Edit2 size={18} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                schedule.isDefault
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={schedule.isDefault ? 'Cannot delete default schedule' : 'Delete schedule'}
                              disabled={schedule.isDefault}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageSchedules;