// ---------------------------------------------------------------------------
// cacheManager.js — Open Caching implementation for PWA
// Uses the standard CacheStorage API: caches.open(CACHE_NAME)
// ---------------------------------------------------------------------------

export const APP_CACHE_NAME = 'bore-barrel-cache-v1'

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/guns/pistol.svg',
  '/guns/rifle.svg',
  '/guns/shotgun.svg',
  '/logo.png',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

/**
 * Open the application cache using the Cache Storage API.
 * Demonstrates the open caching pattern.
 */
export async function openAppCache() {
  if (!('caches' in window)) {
    console.warn('[OpenCache] Cache Storage API is not supported in this browser.')
    return null
  }

  try {
    const cache = await window.caches.open(APP_CACHE_NAME)
    console.info(`[OpenCache] Successfully opened cache: "${APP_CACHE_NAME}"`)
    return cache
  } catch (err) {
    console.error('[OpenCache] Failed to open cache:', err)
    return null
  }
}

/**
 * Pre-cache core application assets.
 */
export async function precacheCoreAssets() {
  const cache = await openAppCache()
  if (!cache) return { success: false, count: 0 }

  try {
    await cache.addAll(CORE_ASSETS)
    console.info(`[OpenCache] Pre-cached ${CORE_ASSETS.length} core assets.`)
    return { success: true, count: CORE_ASSETS.length }
  } catch (err) {
    console.warn('[OpenCache] Some assets could not be pre-cached:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Store a custom key-value or API response in the open cache.
 */
export async function putInCache(url, data) {
  const cache = await openAppCache()
  if (!cache) return false

  try {
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cached-At': new Date().toISOString(),
      },
    })
    await cache.put(url, response)
    return true
  } catch (err) {
    console.error('[OpenCache] Error writing to cache:', err)
    return false
  }
}

/**
 * Retrieve cached data from the open cache.
 */
export async function getFromCache(url) {
  const cache = await openAppCache()
  if (!cache) return null

  try {
    const match = await cache.match(url)
    if (!match) return null
    return await match.json()
  } catch (err) {
    console.error('[OpenCache] Error reading from cache:', err)
    return null
  }
}

/**
 * List all entries currently stored in the open cache.
 */
export async function listCachedEntries() {
  const cache = await openAppCache()
  if (!cache) return []

  try {
    const requests = await cache.keys()
    return requests.map((req) => req.url)
  } catch (err) {
    console.error('[OpenCache] Error listing cache entries:', err)
    return []
  }
}

/**
 * Clear the open cache.
 */
export async function clearAppCache() {
  if (!('caches' in window)) return false
  try {
    const deleted = await window.caches.delete(APP_CACHE_NAME)
    return deleted
  } catch (err) {
    console.error('[OpenCache] Error deleting cache:', err)
    return false
  }
}
