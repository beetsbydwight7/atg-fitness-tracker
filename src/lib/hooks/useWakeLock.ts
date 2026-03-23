'use client';

import { useEffect, useRef } from 'react';

/**
 * Requests a Screen Wake Lock while `active` is true, so the display
 * doesn't turn off during a workout. Automatically releases the lock
 * when the component unmounts or `active` becomes false.
 *
 * Re-acquires the lock if the page visibility changes back to visible
 * (e.g. user switches apps and returns).
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      return;
    }

    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;

    async function acquire() {
      try {
        lockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        lockRef.current.addEventListener('release', () => {
          if (!cancelled) lockRef.current = null;
        });
      } catch {
        // Wake Lock not supported or permission denied — silently ignore.
      }
    }

    acquire();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !lockRef.current) {
        acquire();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
