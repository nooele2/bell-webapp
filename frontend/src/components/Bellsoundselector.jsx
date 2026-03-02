import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Search, RefreshCw } from 'lucide-react';
import { useAudioPlayer, getGithubSoundUrl } from '../hooks/useAudioPlayer';

const GITHUB_API_URL = 'https://api.github.com/repos/pepa65/piring/contents/soundfiles';
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];

export function BellSoundSelector({ selectedBellSoundId, onSelect }) {
  const [sounds, setSounds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const dropdownRef = useRef(null);

  const { playingId, togglePlay } = useAudioPlayer();

  // Fetch sounds when dropdown first opens
  useEffect(() => {
    if (isDropdownOpen && !fetched) {
      loadSounds();
    }
  }, [isDropdownOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const loadSounds = async () => {
    setLoading(true);
    try {
      const res = await fetch(GITHUB_API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      const files = await res.json();
      const audioFiles = files
        .filter(f => AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
        .map(f => ({
          filename: f.name,
          name: f.name.replace(/\.[^/.]+$/, ''),
        }));
      setSounds(audioFiles);
      setFetched(true);
    } catch (err) {
      console.error('Failed to load sounds:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSounds = sounds.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSound = sounds.find(s => s.filename === selectedBellSoundId)
    || (selectedBellSoundId ? { filename: selectedBellSoundId, name: selectedBellSoundId.replace(/\.[^/.]+$/, '') } : null);

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
                togglePlay(selectedSound.filename);
              }}
              className={`p-2 rounded-full transition-colors ${
                playingId === selectedSound.filename
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title="Preview sound"
            >
              {playingId === selectedSound.filename ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </button>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
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
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading sounds...</p>
              </div>
            ) : filteredSounds.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Volume2 size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No sounds found</p>
              </div>
            ) : (
              filteredSounds.map((sound) => (
                <button
                  key={sound.filename}
                  type="button"
                  onClick={() => {
                    onSelect(sound.filename);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedBellSoundId === sound.filename ? 'bg-blue-50' : ''
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
                        togglePlay(sound.filename);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        playingId === sound.filename
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {playingId === sound.filename ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} className="ml-0.5" />
                      )}
                    </button>

                    {selectedBellSoundId === sound.filename && (
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
            <p className="text-xs text-gray-500 text-center">
              {filteredSounds.length} of {sounds.length} sounds • github.com/pepa65/piring
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BellSoundSelector;