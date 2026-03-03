import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Volume2, Play, Pause, Hash } from 'lucide-react';
import { useAudioPlayer, getGithubSoundUrl } from '../hooks/useAudioPlayer';

const GITHUB_API_URL = 'https://api.github.com/repos/pepa65/piring/contents/soundfiles';
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function RingtoneSetup({ onBack }) {
  const [sounds, setSounds] = useState([]);
  const [mappings, setMappings] = useState(
    Object.fromEntries(SLOTS.map(s => [String(s), null]))
  );
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
        .map(f => ({
          filename: f.name,
          name: f.name.replace(/\.[^/.]+$/, ''),
        }));
      setSounds(audioFiles);
    } catch (err) {
      console.error('Failed to load sounds:', err);
    } finally {
      setLoadingSounds(false);
    }
  };

  const loadMappings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ringtone-mappings`, {
        credentials: 'include',
      });
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
      alert('Failed to save ringtone mappings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Hash size={24} />
                Ringtone Setup
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              <Save size={18} />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Mappings'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>How this works:</strong> Each slot (0–9) maps to a sound file.
            The slot number appears as <code className="bg-blue-100 px-1 rounded">R</code> in the ringtimes file (e.g. <code className="bg-blue-100 px-1 rounded">09:00L3</code>).
            On Mr. Peter's machine, he runs <code className="bg-blue-100 px-1 rounded">ln -s ringbell.wav 3.ring</code> to connect slot 3 to a sound.
            Make sure the filename you pick here matches what he has softlinked.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Ringtone Slots</h3>
            <p className="text-sm text-gray-500 mt-1">
              Assign a sound file to each slot number
            </p>
          </div>

          <div className="divide-y">
            {SLOTS.map(slot => {
              const selectedFilename = mappings[String(slot)];
              const selectedSound = sounds.find(s => s.filename === selectedFilename);

              return (
                <div key={slot} className="p-4 flex items-center gap-4">
                  {/* Slot number badge */}
                  <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {slot}
                  </div>

                  {/* Sound selector */}
                  <div className="flex-1">
                    {loadingSounds ? (
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                      <select
                        value={selectedFilename || ''}
                        onChange={(e) => handleSelect(slot, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">— Not assigned —</option>
                        {sounds.map(sound => (
                          <option key={sound.filename} value={sound.filename}>
                            {sound.name} ({sound.filename})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Preview button */}
                  {selectedFilename && (
                    <button
                      onClick={() => togglePlay(selectedFilename)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        playingId === selectedFilename
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Preview sound"
                    >
                      {playingId === selectedFilename ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} className="ml-0.5" />
                      )}
                    </button>
                  )}

                  {/* Softlink hint */}
                  {selectedFilename && (
                    <code className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                      ln -s {selectedFilename} {slot}.ring
                    </code>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RingtoneSetup;