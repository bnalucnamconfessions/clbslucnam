'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { canEditCaiDat } from '../../../lib/permissions'

/** Trang /dashboard/cai-dat chỉ redirect sang Cấu hình website. Sidebar "Cài đặt" dẫn thẳng tới /dashboard/cai-dat/website. */
export default function DashboardCaiDatPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('userInfo')
      const info = raw ? JSON.parse(raw) : {}
      if (!canEditCaiDat(info.clubPermission || '')) {
        router.replace('/dashboard')
        return
      }
      router.replace('/dashboard/cai-dat/website')
    } catch {
      router.replace('/dashboard')
    }
  }, [router])

  return null
}
