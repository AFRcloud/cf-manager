interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
}

class APICache {
  private cache = new Map<string, CacheEntry>()
  private pendingRequests = new Map<string, Promise<any>>()

  // Cache duration in milliseconds
  private defaultTTL = 30000 // 30 seconds

  generateKey(url: string, body?: any): string {
    return `${url}:${JSON.stringify(body || {})}`
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    })
  }

  async dedupe<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check cache first
    const cached = this.get(key)
    if (cached) {
      console.log("[v0] Cache hit for:", key)
      return cached
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log("[v0] Deduplicating request for:", key)
      return this.pendingRequests.get(key)!
    }

    // Make new request
    console.log("[v0] Making new request for:", key)
    const promise = fetcher()
      .then((data) => {
        this.set(key, data, ttl)
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  // Preload data in background
  async preload(key: string, fetcher: () => Promise<any>, ttl?: number): Promise<void> {
    if (!this.get(key)) {
      try {
        await this.dedupe(key, fetcher, ttl)
      } catch (error) {
        console.warn("[v0] Preload failed for:", key, error)
      }
    }
  }
}

export const apiCache = new APICache()
