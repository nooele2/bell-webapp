import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Clock, Edit2, Trash2, Save, X, Star, Palette } from 'lucide-react';

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

// Predefined color options
const COLOR_PRESETS = [
  { name: 'Yellow', value: '#fef3c7', border: '#fde047', text: '#854d0e' },
  { name: 'Blue', value: '#dbeafe', border: '#60a5fa', text: '#1e3a8a' },
  { name: 'Green', value: '#d1fae5', border: '#34d399', text: '#065f46' },
  { name: 'Purple', value: '#e9d5ff', border: '#a78bfa', text: '#5b21b6' },
  { name: 'Pink', value: '#fce7f3', border: '#f9a8d4', text: '#9f1239' },
  { name: 'Orange', value: '#fed7aa', border: '#fb923c', text: '#7c2d12' },
  { name: 'Red', value: '#fecaca', border: '#f87171', text: '#7f1d1d' },
  { name: 'Teal', value: '#ccfbf1', border: '#2dd4bf', text: '#134e4a' },
  { name: 'Indigo', value: '#e0e7ff', border: '#818cf8', text: '#312e81' },
  { name: 'Lime', value: '#ecfccb', border: '#a3e635', text: '#365314' },
];

function ManageSchedules({ onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColorValues, setCustomColorValues] = useState({
    background: '#ffffff',
    border: '#000000',
    text: '#000000'
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSchedule({
      id: null,
      name: '',
      mode: '',
      isDefault: false,
      color: COLOR_PRESETS[0], // Default to yellow
      times: [{ time: '', description: '' }]
    });
    setIsCustomColor(false);
    setIsEditing(true);
  };

  const handleEdit = (schedule) => {
    // Check if schedule has a custom color (not in presets)
    const isPreset = COLOR_PRESETS.some(preset => 
      preset.name === schedule.color?.name
    );
    
    const scheduleWithColor = {
      ...schedule,
      color: schedule.color || COLOR_PRESETS[0]
    };
    
    setEditingSchedule(scheduleWithColor);
    
    if (!isPreset && schedule.color) {
      setIsCustomColor(true);
      setCustomColorValues({
        background: schedule.color.value,
        border: schedule.color.border,
        text: schedule.color.text
      });
    } else {
      setIsCustomColor(false);
    }
    
    setIsEditing(true);
  };

  const handleDelete = async (scheduleId) => {
    const scheduleToDelete = schedules.find(s => s.id === scheduleId);
    
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
    if (window.confirm('Set this schedule as the default for all weekdays? This will apply to all dates that don\'t have a specific schedule assigned.')) {
      try {
        const updatedSchedules = schedules.map(s => ({
          ...s,
          isDefault: s.id === scheduleId
        }));

        for (const schedule of updatedSchedules) {
          await updateSchedule(schedule.id, schedule);
        }

        setSchedules(updatedSchedules);
      } catch (error) {
        console.error('Error setting default schedule:', error);
        alert('Failed to set default schedule');
      }
    }
  };

  const handlePresetColorSelect = (color) => {
    setIsCustomColor(false);
    setEditingSchedule({ ...editingSchedule, color });
  };

  const handleCustomColorToggle = () => {
    if (!isCustomColor) {
      // Switching to custom
      setIsCustomColor(true);
      const currentColor = editingSchedule.color;
      setCustomColorValues({
        background: currentColor.value,
        border: currentColor.border,
        text: currentColor.text
      });
    } else {
      // Switching back to preset
      setIsCustomColor(false);
      setEditingSchedule({ ...editingSchedule, color: COLOR_PRESETS[0] });
    }
  };

  const handleCustomColorChange = (field, value) => {
    const newColors = { ...customColorValues, [field]: value };
    setCustomColorValues(newColors);
    
    // Update the editing schedule with custom color
    setEditingSchedule({
      ...editingSchedule,
      color: {
        name: 'Custom',
        value: newColors.background,
        border: newColors.border,
        text: newColors.text
      }
    });
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
      setIsCustomColor(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSchedule(null);
    setIsCustomColor(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          /* Edit Form */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {editingSchedule.id ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>

            {/* Schedule Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Name *
              </label>
              <input
                type="text"
                value={editingSchedule.name}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                placeholder="e.g., Normal Schedule, Late Start, Early Dismissal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Schedule Color *
                </label>
                <button
                  onClick={handleCustomColorToggle}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isCustomColor 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Palette size={16} />
                  {isCustomColor ? 'Using Custom Color' : 'Create Custom Color'}
                </button>
              </div>

              {!isCustomColor ? (
                /* Preset Colors */
                <div className="grid grid-cols-5 gap-3">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handlePresetColorSelect(color)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        editingSchedule.color?.name === color.name && !isCustomColor
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: color.value,
                        borderColor: color.border
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: color.text }}>
                          {color.name}
                        </span>
                        {editingSchedule.color?.name === color.name && !isCustomColor && (
                          <Palette size={16} style={{ color: color.text }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Color Picker */
                <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                  <p className="text-sm text-gray-600 mb-4">
                    Click on each color box below to pick your custom colors
                  </p>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={customColorValues.background}
                        onChange={(e) => handleCustomColorChange('background', e.target.value)}
                        className="w-full h-24 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {customColorValues.background}
                      </div>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Border Color
                      </label>
                      <input
                        type="color"
                        value={customColorValues.border}
                        onChange={(e) => handleCustomColorChange('border', e.target.value)}
                        className="w-full h-24 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {customColorValues.border}
                      </div>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={customColorValues.text}
                        onChange={(e) => handleCustomColorChange('text', e.target.value)}
                        className="w-full h-24 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {customColorValues.text}
                      </div>
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preview - This is how your schedule will look
                    </label>
                    <div
                      className="p-8 rounded-lg border-4 text-center"
                      style={{
                        backgroundColor: customColorValues.background,
                        borderColor: customColorValues.border,
                        color: customColorValues.text
                      }}
                    >
                      <div className="text-2xl font-bold mb-3">
                        {editingSchedule.name || 'Schedule Name'}
                      </div>
                      <div className="text-base">
                        Sample text - make sure you can read this clearly!
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
          /* Schedule List */
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules yet</h3>
                <p className="text-gray-600 mb-4">Create your first schedule to get started</p>
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
                return (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                      schedule.isDefault ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={schedule.isDefault ? { ringColor: scheduleColor.border } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full border-2"
                            style={{
                              backgroundColor: scheduleColor.value,
                              borderColor: scheduleColor.border
                            }}
                          />
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
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-600">
                            {schedule.times.length} bell{schedule.times.length !== 1 ? 's' : ''}
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
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!schedule.isDefault && (
                          <button
                            onClick={() => handleMakeDefault(schedule.id)}
                            className="px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            title="Make default schedule"
                          >
                            <Star size={18} />
                            Make Default
                          </button>
                        )}
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete schedule"
                          disabled={schedule.isDefault}
                        >
                          <Trash2 size={18} />
                        </button>
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