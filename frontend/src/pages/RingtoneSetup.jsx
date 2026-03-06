import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Play, Pause, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const GITHUB_API_URL = 'https://api.github.com/repos/pepa65/piring/contents/soundfiles';
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5001/api';
const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function RingtoneSetup({ onBack }) {
  const [sounds, setSounds] = useState([]);
  const [mappings, setMappings] = useState(Object.fromEntries(SLOTS.map(s => [String(s), null])));
  const [loadingSounds, setLoadingSounds] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { playingId, togglePlay } = useAudioPlayer();

  useEffect(() => {
    loadSounds();
    loadMappings();
  }, []);

  const loadSounds = async () => {
    try {
      const res = await fetch(GITHUB_API_URL);
      const files = await res.json();
      const audioFiles = files
        .filter(f => AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
        .map(f => ({ filename: f.name, name: f.name.replace(/\.[^/.]+$/, '') }));
      setSounds(audioFiles);
    } catch (err) {
      console.error('Failed to load sounds:', err);
    } finally {
      setLoadingSounds(false);
    }
  };

  const loadMappings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ringtone-mappings`, { credentials: 'include' });
      const data = await res.json();
      setMappings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load mappings:', err);
    }
  };

  const handleSelect = (slot, filename) => {
    setMappings(prev => ({ ...prev, [String(slot)]: filename || null }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ringtone-mappings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappings),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const slotLabels = {
    0: 'Default Bell Sound',
    1: 'Bell Sound 1',
    2: 'Bell Sound 2',
    3: 'Bell Sound 3',
    4: 'Bell Sound 4',
    5: 'Bell Sound 5',
    6: 'Bell Sound 6',
    7: 'Bell Sound 7',
    8: 'Bell Sound 8',
    9: 'Bell Sound 9',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Volume2 size={24} /> Bell Sounds
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'}`}
          >
            <Save size={18} />
            {saving ? 'Saving...' : saved ? 'Saved! ✓' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-900">
            🔔 <strong>Choose a sound for each bell slot.</strong> Press the play button to preview a sound before selecting it. Slot 0 is the default bell that rings unless you choose a different one for a schedule.
          </p>
        </div>

        <div className="space-y-3">
          {SLOTS.map(slot => {
            const selectedFilename = mappings[String(slot)];
            const selectedSound = sounds.find(s => s.filename === selectedFilename);

            return (
              <div key={slot} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${slot === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {slot}
                  </div>
                  <span className="font-medium text-gray-900">{slotLabels[slot]}</span>
                  {slot === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {loadingSounds ? (
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                      <select
                        value={selectedFilename || ''}
                        onChange={(e) => handleSelect(slot, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">— No sound selected —</option>
                        {sounds.map(sound => (
                          <option key={sound.filename} value={sound.filename}>
                            {sound.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedFilename && (
                    <button
                      onClick={() => togglePlay(selectedFilename)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${playingId === selectedFilename ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      title="Preview sound"
                    >
                      {playingId === selectedFilename ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                  )}
                </div>

                {selectedSound && (
                  <p className="text-xs text-gray-400 mt-2">
                    🎵 {selectedSound.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RingtoneSetup;