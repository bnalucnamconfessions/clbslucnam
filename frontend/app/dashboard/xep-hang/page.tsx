'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import RequireAuth from '../../components/RequireAuth'
import XepHangContent from '../../components/XepHangContent'

const TIME_TABS: readonly string[] = ['Tháng này', 'Tháng trước', 'Toàn thời gian']

export default function DashboardXepHangPage() {
  const [isViewOnly, setIsViewOnly] = useState(true)
  const [timeTab, setTimeTab] = useState('Tháng này')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('userInfo')
      const info = raw ? JSON.parse(raw) : {}
      setIsViewOnly((info.clubPermission || 'user') === 'user')
    } catch {
      setIsViewOnly(true)
    }
  }, [])

  return (
    <RequireAuth>
      <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Bảng xếp hạng Người đọc
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  {isViewOnly
                    ? 'Xem bảng xếp hạng người đọc trong khu vực của bạn.'
                    : 'Xem và quản lý bảng xếp hạng trong khu vực quản trị.'}
                </p>
              </div>
              <div className="flex h-10 bg-slate-100 rounded-lg p-1">
                {TIME_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTimeTab(tab)}
                    className={`px-4 h-full flex items-center justify-center rounded text-sm font-medium transition-colors ${timeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'hover:bg-black/5 text-slate-500 hover:text-slate-900'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </header>
            <XepHangContent timeTab={timeTab} onTimeTabChange={setTimeTab} />
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
