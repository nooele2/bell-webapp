import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Search } from 'lucide-react';

export function BellSoundSelector({ 
  bellSounds, 
  selectedBellSoundId, 
  onSelect, 
  playingBellSoundId, 
  onPlay 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const filteredSounds = bellSounds.filter(sound =>
    sound.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSound = bellSounds.find(s => s.id === selectedBellSoundId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between p-3 border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-all bg-white"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Volume2 size={20} className={`flex-shrink-0 ${selectedSound ? 'text-gray-400' : 'text-red-400'}`} />
          <span className={`font-medium truncate ${selectedSound ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedSound ? selectedSound.name : 'Select a bell sound *'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedSound && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlay(selectedSound.id);
              }}
              className={`p-2 rounded-full transition-colors ${
                playingBellSoundId === selectedSound.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title="Preview sound"
            >
              {playingBellSoundId === selectedSound.id ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </button>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bell sounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredSounds.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Volume2 size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No bell sounds found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredSounds.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => {
                    onSelect(sound.id);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedBellSoundId === sound.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Volume2 size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{sound.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(sound.id);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        playingBellSoundId === sound.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title="Preview sound"
                    >
                      {playingBellSoundId === sound.id ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} className="ml-0.5" />
                      )}
                    </button>
                    
                    {selectedBellSoundId === sound.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {searchQuery ? (
                <>
                  {filteredSounds.length} of {bellSounds.length} sound{bellSounds.length !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  {bellSounds.length} bell sound{bellSounds.length !== 1 ? 's' : ''} available
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BellSoundSelector;