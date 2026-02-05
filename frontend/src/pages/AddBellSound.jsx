import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Play, Pause, Trash2, Volume2, Search, X, Edit2, Check } from 'lucide-react';
import { getBellSounds, uploadBellSound, getBellSoundUrl, updateBellSound, deleteBellSound } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AUDIO_UPLOAD_CONSTRAINTS } from '../constants';
import { formatFileSize } from '../utils/scheduleUtils';

function AddBellSound({ onBack }) {
  const [bellSounds, setBellSounds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { playingId, togglePlay: handlePlay, stopAudio } = useAudioPlayer();

  useEffect(() => {
    loadBellSounds();
  }, []);

  const loadBellSounds = async () => {
    try {
      const sounds = await getBellSounds();
      setBellSounds(sounds);
    } catch (error) {
      console.error('Failed to load bell sounds:', error);
      alert('Failed to load bell sounds');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    if (file.size > AUDIO_UPLOAD_CONSTRAINTS.maxSizeBytes) {
      alert(`File size must be less than ${AUDIO_UPLOAD_CONSTRAINTS.maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    setUploading(true);

    try {
      await uploadBellSound(file);
      await loadBellSounds();
      setShowUploadModal(false);
      alert('Bell sound uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + error.message);
    } finally {
      setUploading(false);
    }

    e.target.value = '';
  };

  const handleStartEdit = (sound) => {
    setEditingId(sound.id);
    setEditName(sound.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      await updateBellSound(id, { name: editName.trim() });
      await loadBellSounds();
      setEditingId(null);
      setEditName('');
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update bell sound name');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bell sound?')) {
      return;
    }

    if (playingId === id) {
      stopAudio();
    }

    try {
      await deleteBellSound(id);
      await loadBellSounds();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete bell sound');
    }
  };

  const filteredSounds = bellSounds.filter(sound =>
    sound.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading bell sounds...</div>
      </div>
    );
  }

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
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Upload Bell Sound"
          >
            <Upload size={20} />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              Bell Sounds ({filteredSounds.length})
            </h3>
          </div>
          
          {filteredSounds.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Volume2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No bell sounds yet</p>
              <p className="text-sm">Click the upload button to add your first bell sound</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSounds.map((sound) => (
                <div
                  key={sound.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => handlePlay(sound.id)}
                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                          playingId === sound.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {playingId === sound.id ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} className="ml-0.5" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        {editingId === sound.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(sound.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(sound.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-medium text-gray-900 truncate">
                              {sound.name}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span>{sound.fileName}</span>
                              <span>•</span>
                              <span>{formatFileSize(sound.size)}</span>
                              <span>•</span>
                              <span>{new Date(sound.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingId !== sound.id && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleStartEdit(sound)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit name"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(sound.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Upload Bell Sound</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {uploading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-700 font-medium mb-2">Click to upload</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="font-medium text-gray-700 mb-1">Supported formats:</p>
                    <p>MP3, WAV, OGG, M4A, AAC</p>
                    <p className="mt-2 text-xs">Maximum file size: {AUDIO_UPLOAD_CONSTRAINTS.maxSizeMB}MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddBellSound;