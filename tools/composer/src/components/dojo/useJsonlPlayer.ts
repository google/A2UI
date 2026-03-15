import { useState, useEffect, useCallback, useRef } from 'react';

export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface UseJsonlPlayerOptions<T> {
  messages: T[];
  autoPlay?: boolean;
  baseIntervalMs?: number;
}

export function useJsonlPlayer<T>({
  messages,
  autoPlay = false,
  baseIntervalMs = 500,
}: UseJsonlPlayerOptions<T>) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    autoPlay ? 'playing' : 'stopped'
  );
  // progress represents the *number of messages* currently active (0 to totalMessages)
  const [progress, setProgress] = useState(0); 
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalMessages = messages.length;

  const play = useCallback(() => {
    if (progress >= totalMessages) {
      setProgress(0); // Loop or restart
    }
    setPlaybackState('playing');
  }, [progress, totalMessages]);

  const pause = useCallback(() => {
    setPlaybackState('paused');
  }, []);

  const stop = useCallback(() => {
    setPlaybackState('stopped');
    setProgress(0);
  }, []);

  const seek = useCallback((index: number) => {
    if (index >= 0 && index <= totalMessages) {
      setProgress(index);
    }
  }, [totalMessages]);

  useEffect(() => {
    if (playbackState === 'playing') {
      const ms = baseIntervalMs / speed;
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= totalMessages) {
            setPlaybackState('paused');
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playbackState, speed, totalMessages, baseIntervalMs]);

  const activeMessages = messages.slice(0, progress);

  return {
    playbackState,
    progress,
    speed,
    totalMessages,
    activeMessages,
    play,
    pause,
    stop,
    seek,
    setSpeed,
  };
}
