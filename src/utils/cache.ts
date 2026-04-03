interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_DURATION = 30 * 60 * 1000;

async function fetchWithFallback(url: string, fallbackUrl?: string): Promise<Response> {
  try {
    const res = await fetch(url);
    if (res.ok) return res;
  } catch {}

  if (fallbackUrl) {
    const res = await fetch(fallbackUrl);
    if (res.ok) return res;
  }

  throw new Error('All fetch attempts failed');
}

// Subscribers get notified when fresh data arrives
const subscribers = new Map<string, Set<(data: unknown) => void>>();

export function onCacheUpdate<T>(cacheKey: string, cb: (data: T) => void): () => void {
  if (!subscribers.has(cacheKey)) subscribers.set(cacheKey, new Set());
  const cbs = subscribers.get(cacheKey)!;
  const wrapper = cb as (data: unknown) => void;
  cbs.add(wrapper);
  return () => cbs.delete(wrapper);
}

function notifySubscribers(cacheKey: string, data: unknown) {
  const cbs = subscribers.get(cacheKey);
  if (cbs) cbs.forEach(cb => cb(data));
}

export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  cacheDuration: number = DEFAULT_DURATION,
  fallbackUrl?: string
): Promise<T> {
  const cached = getCachedData<T>(cacheKey);

  if (cached && !isCacheExpired(cached.timestamp, cacheDuration)) {
    return cached.data;
  }

  // Stale cache exists — return it immediately, refresh in background
  // Server guarantees fresh data, so brief staleness is OK to prevent flash
  if (cached) {
    fetchWithFallback(url, fallbackUrl)
      .then(r => r.json())
      .then((data: T) => {
        setCachedData(cacheKey, data);
        notifySubscribers(cacheKey, data);
      })
      .catch(() => {});
    return cached.data;
  }

  // No cache at all — must wait for fresh data
  try {
    const res = await fetchWithFallback(url, fallbackUrl);
    const data: T = await res.json();
    setCachedData(cacheKey, data);
    return data;
  } catch {
    throw new Error('Failed to fetch data and no cache available');
  }
}

function getCachedData<T>(key: string): CacheEntry<T> | null {
  try {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;
    return JSON.parse(item) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

function isCacheExpired(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp > duration;
}
