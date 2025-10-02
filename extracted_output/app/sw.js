const CACHE_NAME = "cloudflare-manager-v1"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  // Add other static assets
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)))
})

self.addEventListener("fetch", (event) => {
  // Cache API responses for offline access
  if (event.request.url.includes("/api/cloudflare/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Serve from cache, but also fetch fresh data in background
            fetch(event.request).then((fetchResponse) => {
              cache.put(event.request, fetchResponse.clone())
            })
            return response
          }

          // Not in cache, fetch and cache
          return fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      }),
    )
  }
})
