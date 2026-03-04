import { formatBookId } from '@/lib/bookId'

type BookItem = { id: string; title: string; author: string; genre: string; publisher: string; price: string; isBorrowed: boolean }

const getQRUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${formatBookId(id)}`

export default function QRCodeTable({ books = [], loading = false, onRefresh }: { books?: BookItem[]; loading?: boolean; onRefresh?: () => void }) {
  const qrCodes = books.map(b => ({
    id: formatBookId(b.id),
    qrImage: getQRUrl(b.id),
    status: b.title && !b.title.startsWith('Mã QR - Chờ') ? 'linked' : 'pending',
    statusText: b.title && !b.title.startsWith('Mã QR - Chờ') ? 'Đã liên kết' : 'Chờ cập nhật',
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">Danh sách Mã gần đây</h3>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              className="rounded-lg bg-slate-50 border border-slate-300 pl-3 pr-8 py-2 text-sm w-40 sm:w-64 focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400 shadow-sm" 
              placeholder="Tìm theo ID 12 số..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">search</span>
          </div>
          <button className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-primary hover:border-primary hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b-2 border-slate-300">
              <th className="px-6 py-3 w-10">
                <input 
                  className="rounded border-2 border-slate-400 text-primary focus:ring-2 focus:ring-primary bg-white w-4 h-4 cursor-pointer" 
                  type="checkbox"
                />
              </th>
              <th className="px-6 py-3">Mã QR</th>
              <th className="px-6 py-3">ID 12 Chữ số (Bảo mật)</th>
              <th className="px-6 py-3">Ngày tạo</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-5xl mb-3 block text-slate-400">progress_activity</span>
                  <p className="font-medium">Đang tải...</p>
                </td>
              </tr>
            ) : qrCodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <span className="material-symbols-outlined text-5xl mb-3 block text-slate-300">qr_code_2</span>
                  <p className="font-medium">Chưa có mã QR nào</p>
                  <p className="text-sm mt-1">Tạo mã QR mới bằng form bên trái hoặc nút &quot;Tạo hàng loạt&quot;</p>
                </td>
              </tr>
            ) : (
              qrCodes.map((qr, index) => (
                <tr key={qr.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-100">
                  <td className="px-6 py-4">
                    <input 
                      className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" 
                      type="checkbox"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-1 rounded border border-slate-200 shrink-0 size-10 flex items-center justify-center overflow-hidden">
                        <img 
                          alt="QR" 
                          className="w-full h-full object-contain brightness-100 contrast-100" 
                          src={qr.qrImage}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-lg font-bold text-slate-900">{qr.id}</span>
                      <span className="text-xs text-slate-500 italic mt-0.5">Thông tin chi tiết đã ẩn</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    —
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      qr.status === 'linked' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        qr.status === 'linked' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></span>
                      {qr.statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="p-2 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                        title="In Tem"
                      >
                        <span className="material-symbols-outlined text-[20px]">print</span>
                      </button>
                      <button 
                        className="p-2 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                        title="Xoá"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - ẩn khi không có dữ liệu */}
      {qrCodes.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600 font-medium">Hiển thị 1-{qrCodes.length} trên {qrCodes.length}</span>
          <div className="flex gap-2">
            <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="size-8 flex items-center justify-center rounded-lg bg-[#137fec] text-white">1</button>
            <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

