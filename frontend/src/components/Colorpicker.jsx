import React, { useState, useEffect, useRef } from 'react';
import { Check, Palette } from 'lucide-react';

// Simple color options for schedules with border colors
const COLOR_OPTIONS = [
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

/**
 * Compact Color Picker Component
 */
function ColorPicker({ selectedColor, onColorSelect, className = '' }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState({ value: '#ffffff', border: '#000000', text: '#000000' });
  const pickerRef = useRef(null);

  // Close custom picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowCustomPicker(false);
      }
    };

    if (showCustomPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomPicker]);

  // Initialize custom color from selected color if it's custom
  useEffect(() => {
    if (selectedColor && selectedColor.name === 'Custom') {
      setCustomColor({
        value: selectedColor.value,
        border: selectedColor.border || '#000000',
        text: selectedColor.text
      });
    }
  }, [selectedColor]);

  const isColorSelected = (color) => {
    return selectedColor?.value === color.value && selectedColor?.text === color.text;
  };

  const isCustomColorSelected = selectedColor?.name === 'Custom';

  const handleCustomColorSave = () => {
    onColorSelect({
      name: 'Custom',
      value: customColor.value,
      border: customColor.border,
      text: customColor.text
    });
    setShowCustomPicker(false);
  };

  // Get contrasting text color for a background
  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const handleCustomColorChange = (field, value) => {
    const newCustomColor = { ...customColor, [field]: value };
    
    // Auto-calculate text color and border if background changes
    if (field === 'value') {
      newCustomColor.text = getContrastColor(value);
      // Make border a darker/more saturated version of the background
      newCustomColor.border = value; // User can customize if needed
    }
    
    setCustomColor(newCustomColor);
  };

  const handleResetToDefault = () => {
    const defaultColor = COLOR_OPTIONS[0]; // Yellow
    setCustomColor({ value: defaultColor.value, border: defaultColor.border, text: defaultColor.text });
  };

  return (
    <div className={className}>
      {/* Boxed Color Picker matching other input fields */}
      <div className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
        <div className="flex items-center gap-2">
          {/* Color circles */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => onColorSelect(color)}
                className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
                  isColorSelected(color)
                    ? 'ring-2 ring-blue-500 ring-offset-1 scale-110'
                    : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {isColorSelected(color) && (
                  <div className="flex items-center justify-center h-full">
                    <Check size={10} className="text-gray-700" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Button */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center ${
                isCustomColorSelected
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1 scale-110'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
              title="Custom Color"
              style={isCustomColorSelected ? { backgroundColor: selectedColor.value } : {}}
            >
              {!isCustomColorSelected && <Palette size={12} className="text-gray-600" />}
              {isCustomColorSelected && <Check size={10} className="text-gray-700" strokeWidth={3} />}
            </button>

            {/* Custom Color Picker Dropdown */}
            {showCustomPicker && (
              <div className="absolute z-50 mt-2 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                <div className="space-y-2.5">
                  <div className="text-sm font-medium text-gray-900">Custom Color</div>
                  
                  {/* Background Color */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor.value}
                        onChange={(e) => handleCustomColorChange('value', e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            handleCustomColorChange('value', value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Border Color */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Border</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor.border}
                        onChange={(e) => handleCustomColorChange('border', e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor.border}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            handleCustomColorChange('border', value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor.text}
                        onChange={(e) => handleCustomColorChange('text', e.target.value)}
                        className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor.text}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            handleCustomColorChange('text', value);
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCustomColorSave}
                      className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomPicker(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;