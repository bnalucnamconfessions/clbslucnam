'use client'

import { useState, useEffect } from 'react'
import { apiUrl, getApiAuth } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import DatePickerButton from './DatePickerButton'

const GENRE_MAP: Record<string, string> = {
  giaokhoa: 'Giáo khoa',
  tieuthuyet: 'Tiểu thuyết',
  kynang: 'Kỹ năng',
  tapchi: 'Tạp chí',
}

export default function QRForm({ onCreated }: { onCreated?: () => void }) {
  const [formData, setFormData] = useState({
    tenSach: '',
    tacGia: '',
    loaiSach: '',
    giaTien: '',
    ngayMua: ''
  })
  const [qrId, setQrId] = useState<string | null>(null)
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tạo ID 12 chữ số ngẫu nhiên
  const generateQRId = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString()
  }

  // Chỉ tạo ID sau khi component mount trên client để tránh hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    if (!defaultId) {
      setDefaultId(generateQRId())
    }
  }, [defaultId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Tự động tạo ID khi có đủ thông tin
    if (name === 'tenSach' && value && !qrId) {
      setQrId(generateQRId())
    }
  }

  const handleRefresh = () => {
    setQrId(generateQRId())
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
          genre: GENRE_MAP[formData.loaiSach] || formData.loaiSach || '',
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
      logActivity('Thêm sách (QR)', `Tên: ${formData.tenSach.trim()} | Tác giả: ${formData.tacGia.trim() || '—'} | Loại: ${GENRE_MAP[formData.loaiSach] || formData.loaiSach || '—'}`)
      setFormData({ tenSach: '', tacGia: '', loaiSach: '', giaTien: '', ngayMua: '' })
      setQrId(null)
      setDefaultId(null)
      onCreated?.()
      alert(`Đã tạo mã QR sách thành công. ID: ${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  // Sử dụng placeholder khi chưa mount để tránh hydration mismatch
  const displayId = qrId || defaultId || '000000000000'

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
            <label className="text-sm font-medium text-slate-700">Loại sách</label>
            <select 
              name="loaiSach"
              value={formData.loaiSach}
              onChange={handleInputChange}
              className={`w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm appearance-none cursor-pointer hover:bg-white transition-colors ${
                formData.loaiSach ? 'text-slate-900' : 'text-slate-400'
              }`}
              required
            >
              <option value="" disabled className="text-slate-400">Chọn loại</option>
              <option value="giaokhoa" className="text-slate-900 bg-white py-2">Giáo khoa</option>
              <option value="tieuthuyet" className="text-slate-900 bg-white py-2">Tiểu thuyết</option>
              <option value="kynang" className="text-slate-900 bg-white py-2">Kỹ năng</option>
              <option value="tapchi" className="text-slate-900 bg-white py-2">Tạp chí</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Giá tiền</label>
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
            <label className="text-sm font-medium text-slate-700">Ngày mua</label>
            <DatePickerButton
              value={formData.ngayMua}
              onChange={(v) => setFormData((prev) => ({ ...prev, ngayMua: v }))}
              placeholder="Chọn ngày"
            />
          </div>
        </div>
        <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-4">
          <div className="bg-white p-2 rounded border border-slate-200 shrink-0">
            {isMounted && displayId !== '000000000000' ? (
              <img 
                alt="QR Code Preview" 
                className="size-16 object-contain" 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${displayId}`}
              />
            ) : (
              <div className="size-16 bg-slate-100 rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400 text-2xl">qr_code_2</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview (Bảo mật)</span>
            <span className="text-sm font-mono font-bold text-slate-900 truncate">
              {isMounted && displayId !== '000000000000' ? displayId : 'Đang tạo...'}
            </span>
            <span className="text-xs text-slate-500 truncate">Thông tin chi tiết đã ẩn</span>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={handleRefresh}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors" 
            type="button"
          >
            Làm mới
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

