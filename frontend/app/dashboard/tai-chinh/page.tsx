'use client'

import { useRef } from 'react'
import Sidebar from '../../components/Sidebar'
import RequireAuth from '../../components/RequireAuth'
import ThuChiContent, { type ThuChiContentRef } from '../../components/ThuChiContent'

export default function TaiChinhPage() {
  const thuChiRef = useRef<ThuChiContentRef>(null)

  return (
    <RequireAuth>
      <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Quản lý thu chi
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Theo dõi và kiểm soát dòng tiền của câu lạc bộ
                </p>
              </div>
              <button
                type="button"
                onClick={() => thuChiRef.current?.exportReport()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                Xuất báo cáo
              </button>
            </header>
            <ThuChiContent ref={thuChiRef} />
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
