import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type UseAsyncResourceOptions<T> = {
  enabled?: boolean
  initialData: T
  load: () => Promise<T>
  dependencies: ReadonlyArray<unknown>
  cacheKey?: string
}

type AsyncResourceResult<T> = {
  data: T
  error: string | null
  loading: boolean
  refreshing: boolean
  hasLoaded: boolean
  reload: () => Promise<T | undefined>
}

type CacheEntry = {
  data: unknown
}

const resourceCache = new Map<string, CacheEntry>()

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  return 'Something went wrong while loading this data.'
}

export function useAsyncResource<T>({
  enabled = true,
  initialData,
  load,
  dependencies,
  cacheKey,
}: UseAsyncResourceOptions<T>): AsyncResourceResult<T> {
  const cachedEntry = cacheKey ? resourceCache.get(cacheKey) : undefined
  const cachedData = (cachedEntry?.data as T | undefined) ?? initialData
  const hasCachedData = cacheKey ? resourceCache.has(cacheKey) : false

  const requestIdRef = useRef(0)
  const hasLoadedRef = useRef(hasCachedData)
  const cacheKeyRef = useRef(cacheKey)
  const [data, setData] = useState(cachedData)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled && !hasCachedData)
  const [refreshing, setRefreshing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(hasCachedData)

  useEffect(() => {
    if (cacheKeyRef.current === cacheKey) {
      return
    }

    cacheKeyRef.current = cacheKey

    if (!cacheKey) {
      hasLoadedRef.current = false
      setData(initialData)
      setError(null)
      setLoading(enabled)
      setRefreshing(false)
      setHasLoaded(false)
      return
    }

    const nextCachedEntry = resourceCache.get(cacheKey)

    if (nextCachedEntry) {
      hasLoadedRef.current = true
      setData(nextCachedEntry.data as T)
      setError(null)
      setLoading(false)
      setRefreshing(false)
      setHasLoaded(true)
      return
    }

    hasLoadedRef.current = false
    setData(initialData)
    setError(null)
    setLoading(enabled)
    setRefreshing(false)
    setHasLoaded(false)
  }, [cacheKey, enabled, initialData])

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1
      hasLoadedRef.current = false
      setData(initialData)
      setError(null)
      setLoading(false)
      setRefreshing(false)
      setHasLoaded(false)
      return initialData
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const isRefresh = hasLoadedRef.current

    setError(null)
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const nextData = await load()

      if (requestId !== requestIdRef.current) {
        return undefined
      }

      if (cacheKey) {
        resourceCache.set(cacheKey, { data: nextData })
      }

      hasLoadedRef.current = true
      setData(nextData)
      setHasLoaded(true)
      return nextData
    } catch (nextError) {
      if (requestId !== requestIdRef.current) {
        return undefined
      }

      hasLoadedRef.current = true
      setError(getErrorMessage(nextError))
      setHasLoaded(true)
      return undefined
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [cacheKey, enabled, initialData, load])

  useEffect(() => {
    void reload()
  }, [reload, ...dependencies])

  return useMemo(
    () => ({ data, error, loading, refreshing, hasLoaded, reload }),
    [data, error, hasLoaded, loading, refreshing, reload],
  )
}
