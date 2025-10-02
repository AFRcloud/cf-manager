interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APIOptimizer {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  async optimizedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 30000, // 30 seconds default
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[v0] Cache hit for: ${key}`)
      return cached.data
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`[v0] Request deduplication for: ${key}`)
      return this.pendingRequests.get(key)!
    }

    // Make new request
    console.log(`[v0] Making new optimized request for: ${key}`)
    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, { data, timestamp: Date.now(), ttl })
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

  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    console.log(`[v0] Executing ${requests.length} requests in parallel`)
    return Promise.all(requests.map((req) => req()))
  }

  preloadData(key: string, fetcher: () => Promise<any>, ttl?: number) {
    setTimeout(() => {
      this.optimizedFetch(key, fetcher, ttl).catch(() => {
        // Silent fail for preload
      })
    }, 100)
  }

  clearCache() {
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

export const apiOptimizer = new APIOptimizer()
