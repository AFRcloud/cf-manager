"use client"

import { useState, useEffect, useCallback } from "react"
import { apiCache } from "@/lib/api-cache"

interface UseFetchOptions {
  enabled?: boolean
  cacheTime?: number
  staleTime?: number
}

export function useOptimizedFetch<T>(key: string, fetcher: () => Promise<T>, options: UseFetchOptions = {}) {
  const { enabled = true, cacheTime = 300000, staleTime = 30000 } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const result = await apiCache.dedupe(key, fetcher, cacheTime)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, enabled, cacheTime])

  const refetch = useCallback(() => {
    apiCache.cache.delete(key)
    return fetchData()
  }, [key, fetchData])

  const prefetch = useCallback(() => {
    apiCache.preload(key, fetcher, cacheTime)
  }, [key, fetcher, cacheTime])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch, prefetch }
}
