import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Volume2, Search, RefreshCw } from 'lucide-react';
import { useAudioPlayer, getGithubSoundUrl } from '../hooks/useAudioPlayer';

const GITHUB_API_URL = 'https://api.github.com/repos/pepa65/piring/contents/soundfiles';
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];

function AddBellSound({ onBack }) {
  const [sounds, setSounds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { playingId, togglePlay } = useAudioPlayer();

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(GITHUB_API_URL);
      if (!res.ok) throw new Error('Failed to fetch from GitHub');
      const files = await res.json();
      const audioFiles = files
        .filter(f => AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
        .map(f => ({
          filename: f.name,
          name: f.name.replace(/\.[^/.]+$/, ''), // strip extension
          url: getGithubSoundUrl(f.name),
          size: f.size,
        }));
      setSounds(audioFiles);
    } catch (err) {
      console.error('Failed to load sounds:', err);
      setError('Failed to load sounds from GitHub. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSounds = sounds.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Volume2 size={28} />
              Bell Sound Library
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search bell sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadSounds}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {loading ? 'Loading...' : `Bell Sounds (${filteredSounds.length})`}
            </h3>
            <span className="text-xs text-gray-500">Source: github.com/pepa65/piring</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading sounds from GitHub...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              <p className="mb-4">{error}</p>
              <button
                onClick={loadSounds}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredSounds.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Volume2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No sounds found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSounds.map((sound) => (
                <div key={sound.filename} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(sound.filename)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        playingId === sound.filename
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {playingId === sound.filename ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} className="ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{sound.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{sound.filename}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddBellSound;