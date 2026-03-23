'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerReturn {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  adjust: (delta: number) => void;
}

export function useTimer(): UseTimerReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      setTotalSeconds(seconds);
      setSecondsRemaining(seconds);
      setIsComplete(false);
      setIsRunning(true);
    },
    [clearTimer]
  );

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (secondsRemaining > 0 && !isComplete) {
      setIsRunning(true);
    }
  }, [secondsRemaining, isComplete]);

  const reset = useCallback(() => {
    clearTimer();
    setSecondsRemaining(0);
    setTotalSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
  }, [clearTimer]);

  const adjust = useCallback(
    (delta: number) => {
      setSecondsRemaining((prev) => {
        const next = Math.max(0, prev + delta);
        setTotalSeconds((t) => Math.max(t, next));
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          setIsComplete(true);
          try {
            navigator.vibrate(200);
          } catch {
            // vibration not supported
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  return {
    secondsRemaining,
    totalSeconds,
    isRunning,
    isComplete,
    start,
    pause,
    resume,
    reset,
    adjust,
  };
}
