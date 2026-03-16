interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_DURATION = 5 * 60 * 1000;

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

export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  cacheDuration: number = DEFAULT_DURATION,
  fallbackUrl?: string
): Promise<T> {
  const cached = getCachedData<T>(cacheKey);

  if (cached && !isCacheExpired(cached.timestamp, cacheDuration)) {
    // Fresh cache — return immediately, refresh in background
    fetchWithFallback(url, fallbackUrl)
      .then(r => r.json())
      .then(data => setCachedData(cacheKey, data))
      .catch(() => {});
    return cached.data;
  }

  try {
    const res = await fetchWithFallback(url, fallbackUrl);
    const data: T = await res.json();
    setCachedData(cacheKey, data);
    return data;
  } catch {
    if (cached) return cached.data;
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

export function getCacheTimestamp(cacheKey: string): number | null {
  try {
    const item = localStorage.getItem(`cache_${cacheKey}`);
    if (!item) return null;
    return JSON.parse(item).timestamp || null;
  } catch {
    return null;
  }
}
