'use client'

import PublicHeader from '../components/PublicHeader'
import QuyenGopContent from '../components/QuyenGopContent'
import Link from 'next/link'

export default function QuyenGopPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display flex flex-col">
      <PublicHeader />
      <main className="flex-1 w-full">
        <QuyenGopContent />
      </main>
      <footer className="border-t border-slate-100 py-12 mt-16 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 text-slate-400 bg-white shadow-sm rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">local_library</span>
            </div>
            <span className="text-sm font-semibold text-slate-500">© 2023 Thư Viện Câu Lạc Bộ</span>
          </div>
          <div className="flex gap-10">
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-[#137fec] transition-colors">
              Điều khoản
            </Link>
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-[#137fec] transition-colors">
              Bảo mật
            </Link>
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-[#137fec] transition-colors">
              Liên hệ BQT
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
