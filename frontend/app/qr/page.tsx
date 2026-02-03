'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import RequireAuth from '../components/RequireAuth'
import QRForm from '../components/QRForm'
import StatsCards from '../components/StatsCards'
import QRCodeTable from '../components/QRCodeTable'
import { apiUrl } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

type BookItem = { id: string; title: string; author: string; genre: string; publisher: string; price: string; isBorrowed: boolean }

export default function QRPage() {
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [books, setBooks] = useState<BookItem[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [bulkCount, setBulkCount] = useState(10)
  const [submitting, setSubmitting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = async () => {
    setLoadingBooks(true)
    try {
      const res = await fetch(apiUrl('/api/books'))
      if (res.ok) {
        const data = await res.json()
        setBooks(data)
      }
    } catch {
      setBooks([])
    } finally {
      setLoadingBooks(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  useRefetchOnFocusAndInterval(fetchBooks, { intervalMs: 20 * 1000 })

  useEffect(() => {
    if (showPrintModal) fetchBooks()
  }, [showPrintModal])

  useEffect(() => {
    if (!showPrintModal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPrintModal(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showPrintModal])
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkCount < 1 || bulkCount > 100) {
      setError('Số lượng phải từ 1 đến 100')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/books/bulk-create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: bulkCount }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi tạo mã QR')
      }
      logActivity('Tạo mã QR hàng loạt', `${bulkCount} sách`)
      setShowBulkModal(false)
      setBulkCount(10)
      fetchBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const padId = (id: string) => String(id).padStart(12, '0')
  const getQRUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${padId(id)}`
  const getQRProxyUrl = (id: string) => `/api/qr-image?id=${padId(id)}`

  const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const fetchImageAsDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  }

  const handlePrint = async (style: 'list' | 'labels' = 'list') => {
    setPrinting(true)
    try {
      const isLabels = style === 'labels'
      const cols = isLabels ? 3 : 4
      const imgSize = isLabels ? 140 : 100

      const loadDataUrls = async () => {
        const urls = books.map(b => getQRProxyUrl(b.id))
        return Promise.all(urls.map(fetchImageAsDataUrl))
      }

      const dataUrls = await loadDataUrls()

      const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Danh sách mã QR sách</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 50px; }
            .card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; break-inside: avoid; }
            .card img { width: ${imgSize}px; height: ${imgSize}px; display: block; margin: 0 auto; object-fit: contain; }
            .card .id { font-family: monospace; font-weight: bold; font-size: 12px; margin-top: 20px; margin-bottom: 4px; }
            .card .title { font-size: ${isLabels ? 12 : 11}px; font-weight: 600; color: #1e293b; margin-top: 4px; }
            .card .meta { font-size: 10px; color: #64748b; margin-top: 2px; line-height: 1.3; }
          </style>
        </head>
        <body>
          <h1>Danh sách mã QR sách - ${new Date().toLocaleDateString('vi-VN')}</h1>
          <div class="grid">
            ${books.map((b, i) => `
              <div class="card">
                <img src="${dataUrls[i]}" alt="QR ${padId(b.id)}" />
                <div class="id">${padId(b.id)}</div>
                <div class="title">${esc(b.title || '')}</div>
                <div class="meta">${esc(b.author || '') ? `Tác giả: ${esc(b.author)}<br>` : ''}${esc(b.genre || '') ? `Thể loại: ${esc(b.genre)}<br>` : ''}${esc(b.price || '') ? `Giá: ${esc(b.price)}đ` : ''}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(printContent)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print(); setPrinting(false) }, 200)
      } else {
        alert('Vui lòng cho phép popup để in')
        setPrinting(false)
      }
    } catch {
      setPrinting(false)
      alert('Không thể tải ảnh QR. Vui lòng thử lại.')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Mã sách', 'Mã 12 số', 'Tên sách', 'Tác giả', 'Thể loại', 'NXB', 'Giá', 'Trạng thái']
    const rows = books.map(b => [
      b.id,
      padId(b.id),
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${(b.genre || '').replace(/"/g, '""')}"`,
      `"${(b.publisher || '').replace(/"/g, '""')}"`,
      `"${(b.price || '').replace(/"/g, '""')}"`,
      b.isBorrowed ? 'Đã mượn' : 'Chưa mượn'
    ].join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `danh-sach-ma-QR-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RequireAuth>
    <div className="relative flex min-h-screen w-full flex-row bg-white text-slate-900 font-display overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 lg:py-8 w-full">
        <div className="flex flex-col gap-6 w-full">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
          {/* Title and Action Buttons */}
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Tạo & Quản lý Mã QR Sách
              </h1>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Hệ thống tự động tạo ID 12 chữ số bảo mật cho sách mới.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => { setError(null); setShowPrintModal(true) }}
                className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span className="truncate">In danh sách</span>
              </button>
              <button 
                onClick={() => { setError(null); setShowBulkModal(true) }}
                className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="truncate">Tạo hàng loạt</span>
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - QR Form */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                <QRForm onCreated={fetchBooks} />
              </div>

              {/* Right Column - Stats & Table */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                <StatsCards books={books} loading={loadingBooks} />
                <QRCodeTable books={books} loading={loadingBooks} onRefresh={fetchBooks} />
              </div>
            </div>
        </div>

        {/* Modal In / Xuất danh sách QR */}
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">In / Xuất danh sách mã QR</h2>
                  <button onClick={() => setShowPrintModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                {loadingBooks ? (
                  <div className="flex justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-5xl mb-3 block text-slate-300">qr_code_2</span>
                    <p className="font-medium">Chưa có sách nào</p>
                    <p className="text-sm mt-1">Tạo sách hoặc mã QR trước khi in</p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-4">Có {books.length} sách. In hoặc tải file để dán mã QR lên sách.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[50px] mb-6">
                      {books.map((b) => (
                        <div key={b.id} className="border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
                          <img src={getQRUrl(b.id)} alt={`QR ${b.id}`} className="w-24 h-24 mx-auto block" />
                          <p className="text-center font-mono text-sm font-bold mt-5">{padId(b.id)}</p>
                          <p className="text-center text-xs font-medium text-slate-800 truncate" title={b.title}>{b.title}</p>
                          {b.author && <p className="text-center text-[11px] text-slate-600 truncate">Tác giả: {b.author}</p>}
                          {b.genre && <p className="text-center text-[11px] text-slate-600 truncate">Thể loại: {b.genre}</p>}
                          {b.price && <p className="text-center text-[11px] text-slate-600">Giá: {b.price}đ</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined">download</span>
                        Tải Excel (CSV)
                      </button>
                      <button
                        onClick={() => handlePrint('labels')}
                        disabled={printing}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50"
                      >
                        {printing ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">image</span>}
                        Xuất ảnh mã QR
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Tạo hàng loạt */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setShowBulkModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Tạo mã QR hàng loạt</h2>
                <button onClick={() => !submitting && setShowBulkModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleBulkCreate} className="flex flex-col gap-4">
                <p className="text-slate-600 text-sm">
                  Tạo nhiều sách placeholder với mã QR, sau đó có thể cập nhật thông tin chi tiết tại trang Quản lý kho sách.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Số lượng cần tạo <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkCount}
                    onChange={e => setBulkCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-slate-500 mt-1">Từ 1 đến 100 mã</p>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => !submitting && setShowBulkModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">add</span>}
                    Tạo {bulkCount} mã
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
    </RequireAuth>
  )
}
