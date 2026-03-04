import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import QRForm from '@/components/QRForm'
import StatsCards from '@/components/StatsCards'
import DatePickerButton from '@/components/DatePickerButton'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '@/lib/api'
import { formatBookId } from '@/lib/bookId'
import { logActivity } from '@/lib/activityLog'
import { useRefetchOnFocusAndInterval } from '@/lib/refetch'

type BookItem = {
  id: string
  displayId?: string
  title: string
  author: string
  genre: string
  publisher: string
  price: string
  purchaseDate?: string | null
  isBorrowed: boolean
}

const GENRE_COLORS: Record<string, string> = {
  'ky nang song': 'blue',
  'van hoc': 'purple',
  'khoa hoc': 'teal',
  'thieu nhi': 'yellow',
}

export default function BooksPage() {
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBook, setEditingBook] = useState<BookItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formBook, setFormBook] = useState({
    title: '',
    author: '',
    genre: '',
    publisher: '',
    price: '',
    ngayMua: '',
  })
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const perPage = 10

  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'books/page.tsx:mount', message: 'BooksPage mounted', data: {}, timestamp: Date.now(), hypothesisId: 'C' }) }).catch(() => {})
  }, [])
  // #endregion

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const { headers, accountEmail } = getApiAuth()
      if (!accountEmail) {
        setError('Phiên đăng nhập không đầy đủ. Vui lòng đăng xuất và đăng nhập lại.')
        return
      }
      const url = apiUrlWithAuth('/api/books')
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'books/page.tsx:fetchBooks:start', message: 'fetchBooks start', data: { url: url.substring(0, 80), hasAuth: !!headers['Authorization'] }, timestamp: Date.now(), hypothesisId: 'B' }) }).catch(() => {})
      // #endregion
      const res = await fetch(url, { headers })
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'books/page.tsx:fetchBooks:response', message: 'fetchBooks response', data: { ok: res.ok, status: res.status }, timestamp: Date.now(), hypothesisId: 'B' }) }).catch(() => {})
      // #endregion
      const data = await res.json()
      if (!res.ok) {
        const msg = (data && typeof data.detail === 'string') ? data.detail : 'Lỗi tải danh sách sách'
        throw new Error(msg)
      }
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'books/page.tsx:fetchBooks:data', message: 'fetchBooks data', data: { isArray: Array.isArray(data), length: Array.isArray(data) ? data.length : undefined }, timestamp: Date.now(), hypothesisId: 'E' }) }).catch(() => {})
      // #endregion
      if (!Array.isArray(data)) {
        setBooks([])
        setError('Dữ liệu từ máy chủ không hợp lệ.')
        return
      }
      setBooks(data)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('booksStatsChanged'))
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'books/page.tsx:fetchBooks:catch', message: 'fetchBooks error', data: { message: e instanceof Error ? e.message : String(e) }, timestamp: Date.now(), hypothesisId: 'B' }) }).catch(() => {})
      // #endregion
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
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

  const handleDeleteBook = async (book: BookItem) => {
    if (!confirm(`Bạn có chắc muốn xóa sách "${book.title}"?`)) return
    if (book.isBorrowed) {
      alert('Không thể xóa sách đang được mượn')
      return
    }
    setError(null)
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/books/${book.id}/delete`), { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi xóa sách')
      }
      logActivity('Xóa sách', `Tên: ${book.title} | Tác giả: ${book.author || '—'} | Thể loại: ${book.genre || '—'}`)
      fetchBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    }
  }

  const handleOpenEdit = (book: BookItem) => {
    setEditingBook(book)
    setFormBook({
      title: book.title,
      author: book.author,
      genre: book.genre,
      publisher: book.publisher,
      price: book.price,
      ngayMua: book.purchaseDate || '',
    })
    setShowEditModal(true)
  }

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBook || !formBook.title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl(`/api/books/${editingBook.id}`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formBook, accountEmail: accountEmail || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi cập nhật sách')
      }
      logActivity('Cập nhật sách', `Tên: ${formBook.title} | Tác giả: ${formBook.author || '—'} | Thể loại: ${formBook.genre || '—'}`)
      setShowEditModal(false)
      setEditingBook(null)
      setFormBook({ title: '', author: '', genre: '', publisher: '', price: '', ngayMua: '' })
      fetchBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formBook.title.trim()) {
      alert('Vui lòng nhập tên sách')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl('/api/books/create'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formBook, accountEmail: accountEmail || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi thêm sách')
      }
      logActivity('Thêm sách', `Tên: ${formBook.title} | Tác giả: ${formBook.author || '—'} | Thể loại: ${formBook.genre || '—'}`)
      setShowAddModal(false)
      setFormBook({ title: '', author: '', genre: '', publisher: '', price: '', ngayMua: '' })
      fetchBooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const getGenreColorClasses = (genre: string) => {
    const key = genre.toLowerCase()
    const color = GENRE_COLORS[key] || 'blue'
    const classes: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-blue-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-100',
      teal: 'bg-teal-50 text-teal-700 border-teal-100',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    }
    return classes[color] || classes.blue
  }

  const padId = (id: string) => String(id).padStart(12, '0')
  const getBookDisplayId = (book: BookItem) => (book.displayId ?? formatBookId(book.id))
  const getQRUrl = (displayId12: string) => `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${displayId12}`
  const getQRProxyUrl = (displayId12: string) => `/api/qr-image?id=${displayId12}`
  const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(new RegExp('<', 'g'), '&lt;').replace(new RegExp('>', 'g'), '&gt;')
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
  const renderPrintCards = (dataUrls: string[]) =>
    books.map((b, i) => {
      const meta = [esc(b.author || '') ? 'Tác giả: ' + esc(b.author) + '<br>' : '', esc(b.genre || '') ? 'Thể loại: ' + esc(b.genre) + '<br>' : '', esc(b.price || '') ? 'Giá: ' + esc(b.price) + 'đ' : ''].join('')
      return '<div class="card"><img src="' + dataUrls[i] + '" alt="QR ' + getBookDisplayId(b) + '" /><div class="id">' + getBookDisplayId(b) + '</div><div class="title">' + esc(b.title || '') + '</div><div class="meta">' + meta + '</div></div>'
    }).join('')
  const handlePrint = async (style: 'list' | 'labels' = 'list') => {
    setPrinting(true)
    try {
      const isLabels = style === 'labels'
      const cols = isLabels ? 3 : 4
      const imgSize = isLabels ? 140 : 100
      const urls = books.map(b => getQRProxyUrl(getBookDisplayId(b)))
      const dataUrls = await Promise.all(urls.map(fetchImageAsDataUrl))
      const cardsHtml = renderPrintCards(dataUrls)
      const printContent = '<!DOCTYPE html><html><head><title>Danh sách mã QR sách</title><style>body{font-family:system-ui,sans-serif;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{font-size:18px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:50px}.card{border:1px solid #e2e8f0;padding:16px;border-radius:8px;text-align:center;break-inside:avoid}.card img{width:' + imgSize + 'px;height:' + imgSize + 'px;display:block;margin:0 auto;object-fit:contain}.card .id{font-family:monospace;font-weight:bold;font-size:12px;margin-top:20px;margin-bottom:4px}.card .title{font-size:' + (isLabels ? 12 : 11) + 'px;font-weight:600;color:#1e293b;margin-top:4px}.card .meta{font-size:10px;color:#64748b;margin-top:2px;line-height:1.3}</style></head><body><h1>Danh sách mã QR sách - ' + new Date().toLocaleDateString('vi-VN') + '</h1><div class="grid">' + cardsHtml + '</div></body></html>'
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
  const getLinkStatus = (book: BookItem) => {
    const linked = book.title && !book.title.startsWith('Mã QR - Chờ')
    return { linked, label: linked ? 'Đã liên kết' : 'Chờ cập nhật' }
  }
  const handlePrintOne = async (book: BookItem) => {
    setPrinting(true)
    try {
      const url = getQRProxyUrl(getBookDisplayId(book))
      const dataUrl = await fetchImageAsDataUrl(url)
      const metaPart = (esc(book.author || '') ? 'Tác giả: ' + esc(book.author) : '') + ' ' + (esc(book.genre || '') ? ' · ' + esc(book.genre) : '')
      const printContent = '<!DOCTYPE html><html><head><title>Mã QR - ' + esc(book.title || '') + '</title><style>body{font-family:system-ui,sans-serif;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.card{border:1px solid #e2e8f0;padding:24px;border-radius:8px;text-align:center;break-inside:avoid;max-width:280px;margin:0 auto}.card img{width:140px;height:140px;display:block;margin:0 auto;object-fit:contain}.card .id{font-family:monospace;font-weight:bold;font-size:14px;margin-top:16px}.card .title{font-size:14px;font-weight:600;color:#1e293b;margin-top:8px}.card .meta{font-size:12px;color:#64748b;margin-top:4px}</style></head><body><div class="card"><img src="' + dataUrl + '" alt="QR ' + getBookDisplayId(book) + '" /><div class="id">' + getBookDisplayId(book) + '</div><div class="title">' + esc(book.title || '') + '</div><div class="meta">' + metaPart + '</div></div></body></html>'
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
    const rows = books.map(b => [b.id, getBookDisplayId(b), `"${(b.title || '').replace(/"/g, '""')}"`, `"${(b.author || '').replace(/"/g, '""')}"`, `"${(b.genre || '').replace(/"/g, '""')}"`, `"${(b.publisher || '').replace(/"/g, '""')}"`, `"${(b.price || '').replace(/"/g, '""')}"`, b.isBorrowed ? 'Đã mượn' : 'Chưa mượn'].join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `danh-sach-ma-QR-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkCount < 1 || bulkCount > 100) {
      setError('Số lượng phải từ 1 đến 100')
      return
    }
    setBulkSubmitting(true)
    setError(null)
    try {
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl('/api/books/bulk-create'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: bulkCount, accountEmail: accountEmail || undefined }),
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
      setBulkSubmitting(false)
    }
  }

  const totalBooks = books.length
  const borrowedCount = books.filter(b => b.isBorrowed).length
  const availableCount = totalBooks - borrowedCount

  const searchLower = searchQuery.trim().toLowerCase()
  const filteredBooks = searchLower
    ? books.filter((b) => {
        const title = (b.title || '').toLowerCase()
        const author = (b.author || '').toLowerCase()
        const displayId = (b.displayId ?? formatBookId(b.id)).toLowerCase()
        const id = (b.id || '').toLowerCase()
        return title.includes(searchLower) || author.includes(searchLower) || displayId.includes(searchLower) || id.includes(searchLower)
      })
    : books

  const totalFiltered = filteredBooks.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage))
  const startIdx = (page - 1) * perPage
  const endIdx = Math.min(startIdx + perPage, totalFiltered)
  const pageBooks = filteredBooks.slice(startIdx, endIdx)

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Quản lý kho sách
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Theo dõi, chỉnh sửa và cập nhật danh mục sách trong thư viện CLB
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto flex-wrap">
                <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none">
                  <span className="material-symbols-outlined text-[18px]">file_upload</span>
                  <span className="truncate">Nhập Excel</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span className="truncate">In mã sách</span>
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="truncate">Thêm sách mới</span>
                </button>
              </div>
            </header>
            <div className="p-4 md:p-6 lg:px-8 lg:py-8">
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-6 w-full">
                {/* 6 thẻ thống kê: 2 hàng dọc, mỗi hàng 3 thẻ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-sm font-medium">Tổng đầu sách</p>
                      <h4 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : totalBooks}</h4>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-primary shrink-0">
                      <span className="material-symbols-outlined">library_books</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-sm font-medium">Sách có sẵn</p>
                      <h4 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '—' : availableCount}</h4>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between min-w-0">
                    <div className="min-w-0">
                      <p className="text-slate-500 text-sm font-medium">Sách đang mượn</p>
                      <h4 className="text-2xl font-bold text-orange-600 mt-1">{loading ? '—' : borrowedCount}</h4>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600 shrink-0">
                      <span className="material-symbols-outlined">menu_book</span>
                    </div>
                  </div>
                  <StatsCards books={books} loading={loading} inline />
                </div>

                {/* Form tạo mã QR: rộng ra giữa */}
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-2xl">
                    <QRForm onCreated={fetchBooks} onBulkClick={() => setShowBulkModal(true)} />
                  </div>
                </div>

                {/* Search and Filter: full width */}
                <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-sm transition-all hover:bg-white"
              placeholder="Tìm kiếm theo tên sách, mã sách hoặc tác giả..."
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative min-w-[180px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">category</span>
              <select className="w-full h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-8 focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none text-sm cursor-pointer transition-all hover:bg-white">
                <option value="">Tất cả thể loại</option>
                <option value="kinang">Kỹ năng sống</option>
                <option value="vanhoc">Văn học</option>
                <option value="khoahoc">Khoa học</option>
                <option value="thieunhi">Thiếu nhi</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
            <div className="relative min-w-[180px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">business</span>
              <select className="w-full h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-8 focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none text-sm cursor-pointer transition-all hover:bg-white">
                <option value="">Tất cả NXB</option>
                <option value="tre">NXB Trẻ</option>
                <option value="kimdong">NXB Kim Đồng</option>
                <option value="nhanam">Nhã Nam</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
            <button className="h-12 w-12 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-primary hover:border-primary hover:bg-white transition-all shadow-sm" title="Bộ lọc nâng cao">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 w-full">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
            </div>
          ) : (
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col h-full shadow-sm">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12">
                      <input className="h-4 w-4 rounded border-slate-300 bg-white text-primary focus:ring-0 focus:ring-offset-0" type="checkbox"/>
                    </th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[140px]">Mã sách</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[200px]">Tên sách</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[160px] hidden md:table-cell">Tác giả</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[140px] hidden lg:table-cell">Thể loại</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[140px] hidden xl:table-cell">NXB</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[100px]">Giá bìa</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[100px]">Ngày mua</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[120px]">Trạng thái</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[120px]">Liên kết</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider w-[80px] text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pageBooks.map((book) => {
                    return (
                      <tr key={book.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <input className="h-4 w-4 rounded border-slate-300 bg-white text-primary focus:ring-0 focus:ring-offset-0" type="checkbox"/>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-1 rounded border border-slate-200 shrink-0 size-10 flex items-center justify-center overflow-hidden">
                              <img
                                alt="QR"
                                className="w-full h-full object-contain brightness-100 contrast-100"
                                src={getQRUrl(getBookDisplayId(book))}
                              />
                            </div>
                            <span className="text-slate-500 font-mono text-sm">{getBookDisplayId(book)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-slate-900 font-semibold hover:text-primary cursor-pointer line-clamp-2">{book.title}</p>
                        </td>
                        <td className="p-4 text-slate-600 hidden md:table-cell">{book.author}</td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getGenreColorClasses(book.genre)}`}>
                            {book.genre || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 hidden xl:table-cell">{book.publisher}</td>
                        <td className="p-4 text-slate-900 font-medium">{book.price}</td>
                        <td className="p-4 text-slate-600">{book.purchaseDate ? new Date(book.purchaseDate).toLocaleDateString('vi-VN') : '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.isBorrowed 
                              ? 'bg-orange-50 text-orange-700 border border-orange-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {book.isBorrowed ? 'Đã mượn' : 'Chưa mượn'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            getLinkStatus(book).linked
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              getLinkStatus(book).linked ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                            {getLinkStatus(book).label}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintOne(book)}
                              disabled={printing}
                              className="p-2 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-50"
                              title="In tem"
                            >
                              <span className="material-symbols-outlined text-[20px]">print</span>
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(book)}
                              className="text-slate-400 hover:text-primary p-1 rounded hover:bg-slate-100"
                              title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteBook(book)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 p-4 bg-slate-50">
              <p className="text-slate-500 text-sm">
                Hiển thị <span className="text-slate-900 font-semibold">{totalFiltered === 0 ? 0 : startIdx + 1}-{endIdx}</span> trong tổng số <span className="text-slate-900 font-semibold">{totalFiltered}</span> kết quả
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-[#137fec] text-white shadow-sm'
                        : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
          )}
                </div>
              </div>
              </div>
            </div>

        {/* Modal In / Xuất danh sách mã sách */}
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">In / Xuất danh sách mã sách</h2>
                  <button onClick={() => setShowPrintModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-5xl mb-3 block text-slate-300">qr_code_2</span>
                    <p className="font-medium">Chưa có sách nào</p>
                    <p className="text-sm mt-1">Thêm sách trước khi in mã</p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-4">Có {books.length} sách. In hoặc tải file để dán mã QR lên sách.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[50px] mb-6">
                      {books.map((b) => (
                        <div key={b.id} className="border border-slate-200 p-4 rounded-lg bg-white shadow-sm">
                          <img src={getQRUrl(getBookDisplayId(b))} alt={`QR ${getBookDisplayId(b)}`} className="w-24 h-24 mx-auto block" />
                          <p className="text-center font-mono text-sm font-bold mt-5">{getBookDisplayId(b)}</p>
                          <p className="text-center text-xs font-medium text-slate-800 truncate" title={b.title}>{b.title}</p>
                          {b.author && <p className="text-center text-[11px] text-slate-600 truncate">Tác giả: {b.author}</p>}
                          {b.genre && <p className="text-center text-[11px] text-slate-600 truncate">Thể loại: {b.genre}</p>}
                          {b.price && <p className="text-center text-[11px] text-slate-600">Giá: {b.price}đ</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined">download</span>
                        Tải Excel (CSV)
                      </button>
                      <button
                        type="button"
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

        {/* Modal Tạo mã QR hàng loạt */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !bulkSubmitting && setShowBulkModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Tạo mã QR hàng loạt</h2>
                <button onClick={() => !bulkSubmitting && setShowBulkModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleBulkCreate} className="flex flex-col gap-4">
                <p className="text-slate-600 text-sm">
                  Tạo nhiều sách placeholder với mã QR, sau đó có thể cập nhật thông tin chi tiết tại đây.
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
                  <button type="button" onClick={() => !bulkSubmitting && setShowBulkModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={bulkSubmitting} className="px-6 py-2.5 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2">
                    {bulkSubmitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">add</span>}
                    Tạo {bulkCount} mã
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Sửa sách */}
        {showEditModal && editingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setShowEditModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa sách</h2>
                <button onClick={() => !submitting && setShowEditModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleUpdateBook} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên sách <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formBook.title}
                    onChange={e => setFormBook(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nhập tên sách"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={formBook.author}
                    onChange={e => setFormBook(p => ({ ...p, author: e.target.value }))}
                    placeholder="Nhập tên tác giả"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Thể loại</label>
                  <select
                    value={formBook.genre}
                    onChange={e => setFormBook(p => ({ ...p, genre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- Chọn thể loại --</option>
                    <option value="Kỹ năng sống">Kỹ năng sống</option>
                    <option value="Văn học">Văn học</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Thiếu nhi">Thiếu nhi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formBook.publisher}
                    onChange={e => setFormBook(p => ({ ...p, publisher: e.target.value }))}
                    placeholder="VD: NXB Trẻ"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giá bìa</label>
                  <input
                    type="text"
                    value={formBook.price}
                    onChange={e => setFormBook(p => ({ ...p, price: e.target.value }))}
                    placeholder="VD: 89000"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 mt-2 justify-end">
                  <button type="button" onClick={() => !submitting && setShowEditModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">save</span>}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thêm sách */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setShowAddModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Thêm sách mới</h2>
                <button onClick={() => !submitting && setShowAddModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateBook} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên sách <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formBook.title}
                    onChange={e => setFormBook(p => ({ ...p, title: e.target.value }))}
                    placeholder="Nhập tên sách"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={formBook.author}
                    onChange={e => setFormBook(p => ({ ...p, author: e.target.value }))}
                    placeholder="Nhập tên tác giả"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Thể loại</label>
                  <select
                    value={formBook.genre}
                    onChange={e => setFormBook(p => ({ ...p, genre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- Chọn thể loại --</option>
                    <option value="Kỹ năng sống">Kỹ năng sống</option>
                    <option value="Văn học">Văn học</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Thiếu nhi">Thiếu nhi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={formBook.publisher}
                    onChange={e => setFormBook(p => ({ ...p, publisher: e.target.value }))}
                    placeholder="VD: NXB Trẻ"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giá bìa</label>
                  <input
                    type="text"
                    value={formBook.price}
                    onChange={e => setFormBook(p => ({ ...p, price: e.target.value }))}
                    placeholder="VD: 89000"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày mua</label>
                  <DatePickerButton
                    value={formBook.ngayMua}
                    onChange={(v) => setFormBook((p) => ({ ...p, ngayMua: v }))}
                    placeholder="Chọn ngày"
                  />
                </div>
                <div className="flex gap-3 mt-2 justify-end">
                  <button type="button" onClick={() => !submitting && setShowAddModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2">
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">add</span>}
                    Thêm sách
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

