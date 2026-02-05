import { useState, useEffect, useRef, useCallback } from 'react';
import { getBellSoundUrl } from '../services/api';

/**
 * Custom hook for managing audio playback
 * Handles play/pause, cleanup, and state management
 */
export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = useCallback((soundId) => {
    // If clicking the same sound that's playing, stop it
    if (playingId === soundId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingId(null);
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
      setPlayingId(soundId);
      
      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Error playing audio');
        setPlayingId(null);
        audioRef.current = null;
        alert('Failed to play audio');
      };
    } catch (error) {
      console.error('Playback error:', error);
      alert('Failed to play audio');
      setPlayingId(null);
      audioRef.current = null;
    }
  }, [playingId]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingId(null);
    }
  }, []);

  return {
    playingId,
    togglePlay,
    stopAudio,
    isPlaying: (id) => playingId === id,
  };
}

export default useAudioPlayer;