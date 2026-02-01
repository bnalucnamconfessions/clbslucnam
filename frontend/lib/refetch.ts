'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Các trang như Facebook "realtime" vì họ dùng:
 * - WebSocket / long polling: server đẩy dữ liệu mới ngay khi có.
 * - Polling: client gọi API định kỳ (vài giây / vài chục giây).
 * - Refetch khi quay lại tab: khi user quay lại tab thì gọi lại API.
 *
 * Ứng dụng của chúng ta mặc định chỉ fetch 1 lần khi load trang (useEffect với []),
 * nên phải reload trang mới thấy dữ liệu mới. Hook này giúp:
 * - Refetch khi user quay lại tab (visibilitychange).
 * - Refetch định kỳ mỗi intervalMs (tùy chọn).
 */
export function useRefetchOnFocusAndInterval(
  refetch: () => void | Promise<void>,
  options: { intervalMs?: number; enabled?: boolean } = {}
) {
  const { intervalMs = 0, enabled = true } = options
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  const stableRefetch = useCallback(() => {
    void Promise.resolve(refetchRef.current()).catch(() => {})
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') stableRefetch()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    let intervalId: ReturnType<typeof setInterval> | null = null
    if (intervalMs > 0) {
      intervalId = setInterval(stableRefetch, intervalMs)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (intervalId) clearInterval(intervalId)
    }
  }, [enabled, intervalMs, stableRefetch])
}
