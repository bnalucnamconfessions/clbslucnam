'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import RequireAuth from '../components/RequireAuth'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

type BookItem = {
  id: string
  title: string
  author: string
  genre: string
  publisher: string
  price: string
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
  })

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth('/api/books'), { headers })
      if (!res.ok) throw new Error('Lỗi tải danh sách sách')
      const data = await res.json()
      setBooks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  useRefetchOnFocusAndInterval(fetchBooks, { intervalMs: 20 * 1000 })

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
      setFormBook({ title: '', author: '', genre: '', publisher: '', price: '' })
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
      setFormBook({ title: '', author: '', genre: '', publisher: '', price: '' })
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

  const totalBooks = books.length
  const borrowedCount = books.filter(b => b.isBorrowed).length
  const availableCount = totalBooks - borrowedCount

  return (
    <RequireAuth>
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
              <div className="flex gap-3 w-full md:w-auto">
                <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none">
                  <span className="material-symbols-outlined text-[18px]">file_upload</span>
                  <span className="truncate">Nhập Excel</span>
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
                {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng đầu sách */}
          <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Tổng đầu sách</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">library_books</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-slate-900 text-3xl font-bold leading-tight">{loading ? '...' : totalBooks}</p>
              <p className="text-emerald-600 text-sm font-medium mb-1 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> dau sach
              </p>
            </div>
          </div>

          {/* Tổng số lượng tồn */}
          <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Sách có sẵn</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">inventory_2</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-slate-900 text-3xl font-bold leading-tight">{loading ? '...' : availableCount}</p>
              <p className="text-emerald-600 text-sm font-medium mb-1 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> chua muon
              </p>
            </div>
          </div>

          {/* Sách đang mượn */}
          <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Sách đang mượn</p>
              <span className="material-symbols-outlined text-[#fa6238] bg-[#fa6238]/10 p-1.5 rounded-lg">menu_book</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-slate-900 text-3xl font-bold leading-tight">{loading ? '...' : borrowedCount}</p>
              <p className="text-[#fa6238] text-sm font-medium mb-1 flex items-center gap-0.5 bg-orange-50 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[16px]">trending_down</span> 2%
              </p>
            </div>
          </div>

          {/* Cần nhập thêm */}
          <div className="flex flex-col gap-2 rounded-xl p-5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Cần nhập thêm</p>
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-1.5 rounded-lg">warning</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-slate-900 text-3xl font-bold leading-tight">0</p>
              <p className="text-slate-400 text-sm font-medium mb-1">Đầu sách sắp hết</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="w-full h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-sm transition-all hover:bg-white" 
              placeholder="Tìm kiếm theo tên sách, mã sách hoặc tác giả..."
              type="text"
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
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider min-w-[120px]">Trạng thái</th>
                    <th className="p-4 text-slate-500 text-xs font-semibold uppercase tracking-wider w-[80px] text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {books.map((book) => {
                    return (
                      <tr key={book.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <input className="h-4 w-4 rounded border-slate-300 bg-white text-primary focus:ring-0 focus:ring-offset-0" type="checkbox"/>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{book.id}</td>
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
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.isBorrowed 
                              ? 'bg-orange-50 text-orange-700 border border-orange-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {book.isBorrowed ? 'Đã mượn' : 'Chưa mượn'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
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
                Hien thi <span className="text-slate-900 font-semibold">1-{books.length}</span> trong tong so <span className="text-slate-900 font-semibold">{books.length}</span> ket qua
              </p>
              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded bg-[#137fec] text-white text-sm font-medium shadow-sm">1</button>
                <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm">2</button>
                <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm">3</button>
                <span className="text-slate-400 text-sm px-1">...</span>
                <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm">12</button>
                <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
          )}
              </div>

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
            </div>
          </div>
        </div>
      </main>
    </div>
    </RequireAuth>
  )
}

