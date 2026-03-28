import type { QueryClient } from '@tanstack/react-query';

/**
 * Seeds React Query cache from pre-fetched data stored in window.__prefetchCache.
 * Called once at app startup to eliminate loading states on first render.
 */
export async function seedQueryCache(queryClient: QueryClient) {
  const cache = window.__prefetchCache;
  if (!cache) return;

  const keyMap: Record<string, readonly unknown[]> = {
    'banners': ['banners'],
    'categories': ['categories'],
    'products-featured': ['products', 'featured'],
    'products-new': ['products', 'new'],
    'products-flash': ['products', 'flash-sale'],
  };

  // Seed site-settings separately (needs transform)
  const settingsPromise = cache['site-settings'];
  if (settingsPromise) {
    try {
      const data = await settingsPromise;
      if (data && Array.isArray(data)) {
        const map: Record<string, string> = {};
        data.forEach((item: { key: string; value: string }) => {
          map[item.key] = item.value;
        });
        queryClient.setQueryData(['site-settings'], map);
      }
    } catch {}
  }

  // Seed all other caches in parallel
  const entries = Object.entries(keyMap);
  await Promise.allSettled(
    entries.map(async ([cacheKey, queryKey]) => {
      const promise = cache[cacheKey];
      if (!promise) return;
      try {
        const data = await promise;
        if (data !== null) {
          queryClient.setQueryData(queryKey, data);
        }
      } catch {}
    })
  );

  // Clean up
  delete window.__prefetchCache;
}
