import { useState } from 'react'
import { apiUrl, getApiAuth } from '@/lib/api'
import { formatBookId } from '@/lib/bookId'
import { logActivity } from '@/lib/activityLog'
import DatePickerButton from './DatePickerButton'

const THE_LOAI_OPTIONS = ['Kỹ năng sống', 'Văn học', 'Khoa học', 'Thiếu nhi'] as const

export default function QRForm({ onCreated, onBulkClick }: { onCreated?: () => void; onBulkClick?: () => void }) {
  const [formData, setFormData] = useState({
    tenSach: '',
    tacGia: '',
    theLoai: '',
    giaTien: '',
    ngayMua: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl('/api/books/create'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.tenSach.trim(),
          author: formData.tacGia.trim(),
          genre: formData.theLoai || '',
          publisher: '',
          price: formData.giaTien ? String(formData.giaTien) : '',
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi tạo sách')
      }
      const data = await res.json()
      logActivity('Thêm sách (QR)', `Tên: ${formData.tenSach.trim()} | Tác giả: ${formData.tacGia.trim() || '—'} | Thể loại: ${formData.theLoai || '—'}`)
      setFormData({ tenSach: '', tacGia: '', theLoai: '', giaTien: '', ngayMua: '' })
      onCreated?.()
      const displayId = data.displayId ?? formatBookId(data.id)
      alert(`Đã tạo mã QR sách thành công. Mã sách: ${displayId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">qr_code_2</span>
        Tạo Mã QR Mới
      </h3>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Tên sách</label>
          <input 
            name="tenSach"
            value={formData.tenSach}
            onChange={handleInputChange}
            className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
            placeholder="Nhập tên sách..." 
            type="text"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Tác giả</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">person_search</span>
            <input 
              name="tacGia"
              value={formData.tacGia}
              onChange={handleInputChange}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
              placeholder="Tìm hoặc nhập tên tác giả" 
              type="text"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Thể loại</label>
            <select
              name="theLoai"
              value={formData.theLoai}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer bg-white text-slate-900 text-sm"
              required
            >
              <option value="">-- Chọn thể loại --</option>
              {THE_LOAI_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Giá tiền</label>
            <input 
              name="giaTien"
              value={formData.giaTien}
              onChange={handleInputChange}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              placeholder="0" 
              type="number"
              min="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày mua</label>
            <DatePickerButton
              value={formData.ngayMua}
              onChange={(v) => setFormData((prev) => ({ ...prev, ngayMua: v }))}
              placeholder="Chọn ngày"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={onBulkClick}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors" 
            type="button"
          >
            Tạo hàng loạt
          </button>
          <button 
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 disabled:opacity-50" 
            type="submit"
          >
            {submitting ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <><span>Tạo Mã QR</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
          </button>
        </div>
      </form>
    </div>
  )
}

