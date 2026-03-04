import { useState, useEffect } from 'react'

export default function FontLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await document.fonts?.load?.("24px 'Material Symbols Outlined'")
      } catch {
        /* font có thể đã load hoặc không tồn tại */
      }
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <>
        <span className="material-symbols-outlined absolute opacity-0 w-0 h-0 overflow-hidden" aria-hidden>circle</span>
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#137fec]/30 border-t-[#137fec] animate-spin" />
            <p className="text-sm text-slate-500">Đang tải...</p>
          </div>
        </div>
      </>
    )
  }

  return <>{children}</>
}
