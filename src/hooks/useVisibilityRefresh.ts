import { useState, useEffect, useRef } from 'react';

const MIN_INTERVAL_MS = 30_000; // Don't refresh more than once per 30s

export function useVisibilityRefresh(): number {
  const [refreshKey, setRefreshKey] = useState(0);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefresh.current >= MIN_INTERVAL_MS) {
          lastRefresh.current = now;
          setRefreshKey(k => k + 1);
        }
      }
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return refreshKey;
}
