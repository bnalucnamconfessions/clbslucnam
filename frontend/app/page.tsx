'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PublicHeader from './components/PublicHeader'

const AUTH_KEY = 'adminToken'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(AUTH_KEY)) {
      router.replace('/dashboard')
      return
    }
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec] mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
      <PublicHeader />
      <main className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="max-w-xl text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
                BnA Lục Nam
              </h1>
              <p className="text-slate-600 text-base md:text-lg">
                Khám phá bảng xếp hạng người đọc, nhà tài trợ & đối tác. Đăng nhập để quản lý thư viện.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/xep-hang"
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">emoji_events</span>
                Bảng xếp hạng
              </Link>
              <Link
                href="/doi-tac"
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">handshake</span>
                Nhà tài trợ & Đối tác
              </Link>
              <Link
                href="/quyen-gop"
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold shadow-sm hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">volunteer_activism</span>
                Quyên góp
              </Link>
              <Link
                href="/dang-nhap"
                className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold shadow-lg shadow-blue-500/20 transition-colors"
              >
                <span className="material-symbols-outlined">login</span>
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
