import { useState, useEffect, useRef, useCallback } from 'react';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/pepa65/piring/master/soundfiles';

export function getGithubSoundUrl(filename) {
  return `${GITHUB_RAW_BASE}/${filename}`;
}

/**
 * Custom hook for managing audio playback
 * Plays sounds directly from GitHub raw URLs
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

  const togglePlay = useCallback((filename) => {
    // If clicking the same sound that's playing, stop it
    if (playingId === filename && audioRef.current) {
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
      const url = getGithubSoundUrl(filename);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.play();
      setPlayingId(filename);

      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Error playing audio:', filename);
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
    isPlaying: (filename) => playingId === filename,
  };
}

export default useAudioPlayer;