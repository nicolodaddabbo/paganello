interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  cacheDuration: number = CACHE_DURATION
): Promise<T> {
  try {
    // Try to get cached data
    const cached = getCachedData<T>(cacheKey);

    if (cached && !isCacheExpired(cached.timestamp, cacheDuration)) {
      // Return cached data immediately
      // Optionally fetch fresh data in background for next time
      fetchInBackground<T>(url, cacheKey).catch(() => {
        // Silent fail for background fetch
      });
      return cached.data;
    }

    // No valid cache, fetch fresh data
    const response = await fetch(url);
    if (!response.ok) {
      // If fetch fails but we have expired cache, return it anyway
      if (cached) {
        return cached.data;
      }
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data: T = await response.json();

    // Cache the fresh data
    setCachedData(cacheKey, data);

    return data;
  } catch (error) {
    // If there's any error and we have cached data (even expired), use it
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

async function fetchInBackground<T>(url: string, cacheKey: string): Promise<void> {
  const response = await fetch(url);
  if (response.ok) {
    const data: T = await response.json();
    setCachedData(cacheKey, data);
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
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch (error) {
    // Silent fail if localStorage is full or unavailable
    console.warn('Failed to cache data:', error);
  }
}

function isCacheExpired(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp > duration;
}

export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(`cache_${key}`);
  } else {
    // Clear all cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('cache_')) {
        localStorage.removeItem(k);
      }
    });
  }
}
