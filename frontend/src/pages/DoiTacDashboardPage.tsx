import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import DoiTacContent from '@/components/DoiTacContent'
import { canEditDoiTac } from '@/lib/permissions'

export default function DoiTacDashboardPage() {
  const [canEdit, setCanEdit] = useState(false)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
      if (raw) {
        const p = JSON.parse(raw)
        setCanEdit(canEditDoiTac(p?.clubPermission || ''))
      }
    } catch {}
  }, [])

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Nhà tài trợ & Đối tác
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  {canEdit ? 'Ban chủ nhiệm và Ban Nhân sự - Tài Chính có quyền chỉnh sửa nội dung nhà tài trợ và đối tác.' : 'Xem thông tin nhà tài trợ và đối tác trong khu vực quản trị.'}
                </p>
              </div>
            </header>
            <DoiTacContent canEdit={canEdit} />
          </div>
        </main>
      </div>
  )
}
