'use client'

type BookItem = { id: string; title: string; author: string; genre: string; publisher: string; price: string; isBorrowed: boolean }

export default function StatsCards({ books = [], loading = false }: { books?: BookItem[]; loading?: boolean }) {
  const total = books.length
  const linked = books.filter(b => b.title && !b.title.startsWith('Mã QR - Chờ')).length
  const pendingPrint = books.filter(b => b.title && b.title.startsWith('Mã QR - Chờ')).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">Tổng mã đã tạo</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : total}</h4>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-primary">
          <span className="material-symbols-outlined">qr_code</span>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">Đã liên kết sách</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '—' : linked}</h4>
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <span className="material-symbols-outlined">link</span>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">Chờ in tem</p>
          <h4 className="text-2xl font-bold text-orange-600 mt-1">{loading ? '—' : pendingPrint}</h4>
        </div>
        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
          <span className="material-symbols-outlined">print_disabled</span>
        </div>
      </div>
    </div>
  )
}

