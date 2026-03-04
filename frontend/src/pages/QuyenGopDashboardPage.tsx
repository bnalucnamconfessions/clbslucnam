import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import QuyenGopDashboardContent from '@/components/QuyenGopDashboardContent'
import { canEditQuyenGop } from '@/lib/permissions'

export default function QuyenGopDashboardPage() {
  const [canEdit, setCanEdit] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userInfo')
      const info = raw ? JSON.parse(raw) : {}
      setCanEdit(canEditQuyenGop(info.clubPermission || 'user'))
    } catch {
      setCanEdit(false)
    }
  }, [])
  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Quyên góp & Ủng hộ
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Theo dõi tiến độ gây quỹ và danh sách đóng góp trong khu vực quản trị.
                </p>
              </div>
            </header>
            <QuyenGopDashboardContent canEdit={canEdit} />
          </div>
        </main>
      </div>
  )
}
