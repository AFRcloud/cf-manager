const CACHE_NAME = "cloudflare-manager-v1"
const STATIC_ASSETS = ["/", "/manifest.json"]

self.addEventListener("install", (event) => {
  console.log("[v0] Service Worker installing")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  // Cache API responses for offline access and faster loading
  if (event.request.url.includes("/api/cloudflare/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log("[v0] Serving from cache:", event.request.url)
            // Serve from cache, but also fetch fresh data in background
            fetch(event.request)
              .then((fetchResponse) => {
                if (fetchResponse.ok) {
                  cache.put(event.request, fetchResponse.clone())
                }
              })
              .catch(() => {
                // Ignore background fetch errors
              })
            return response
          }

          // Not in cache, fetch and cache
          return fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone())
            }
            return fetchResponse
          })
        })
      }),
    )
  }
})

self.addEventListener("activate", (event) => {
  console.log("[v0] Service Worker activated")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[v0] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
