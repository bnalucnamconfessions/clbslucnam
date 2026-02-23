'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import RequireAuth from '../components/RequireAuth'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

interface BookItem {
  id: string
  title: string
  author: string
  genre?: string
  isBorrowed: boolean
}

interface MemberItem {
  id: string
  name: string
  userId: string
  department?: string
  role?: string
  avatarUrl?: string
}

interface BookInCart {
  id: string
  title: string
  author: string
  genre?: string
  bookId: string
  status: string
}

interface BorrowRecordItem {
  id: number
  memberId: string
  bookId: number
  borrowDate: string
  dueDate: string
}

export default function MuonPage() {
  const [inputMode, setInputMode] = useState<'qr' | 'manual'>('qr')
  const [memberId, setMemberId] = useState('')
  const [manualMemberId, setManualMemberId] = useState('')
  const [availableBooks, setAvailableBooks] = useState<BookItem[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [manualInfo, setManualInfo] = useState({
    name: '',
    className: '',
    borrowDate: ''
  })
  const [bookInput, setBookInput] = useState('')
  const [books, setBooks] = useState<BookInCart[]>([])
  const [borrows, setBorrows] = useState<BorrowRecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { headers } = getApiAuth()
      const [booksRes, membersRes, borrowsRes] = await Promise.all([
        fetch(apiUrlWithAuth('/api/books'), { headers }),
        fetch(apiUrlWithAuth('/api/members'), { headers }),
        fetch(apiUrlWithAuth('/api/borrow'), { headers }),
      ])
      if (booksRes.ok) {
        const data = await booksRes.json()
        setAvailableBooks(data.filter((b: BookItem) => !b.isBorrowed))
      }
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data)
      }
      if (borrowsRes.ok) {
        const data = await borrowsRes.json()
        setBorrows(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRefetchOnFocusAndInterval(fetchData, { intervalMs: 20 * 1000 })

  const selectedMember = inputMode === 'qr'
    ? (() => {
        const t = memberId.trim()
        return members.find(m => m.userId === t) || (t && members.find(m => String(m.id) === t))
      })()
    : members.find(m => String(m.id) === manualMemberId)

  const memberBorrows = selectedMember
    ? borrows.filter(b => String(b.memberId) === String(selectedMember.id))
    : []
  const todayStr = new Date().toISOString().slice(0, 10)
  const memberStats = {
    currentBorrowing: memberBorrows.length,
    overdue: memberBorrows.filter(b => b.dueDate && b.dueDate < todayStr).length,
    maxBorrow: 3,
  }

  const handleAddBook = () => {
    const id = bookInput.trim()
    if (!id || books.length >= 3) return
    const found = availableBooks.find(b => b.id === id)
    if (found && !books.some(b => b.id === found.id)) {
      setBooks([...books, {
        id: found.id,
        title: found.title,
        author: found.author,
        genre: found.genre,
        bookId: found.id,
        status: 'Mượn mới',
      }])
      setBookInput('')
    }
  }

  const handleRemoveBook = (id: string) => {
    setBooks(books.filter(book => book.id !== id))
  }

  const handleClearAll = () => {
    setBooks([])
  }

  const handleConfirm = async () => {
    if (!selectedMember) {
      alert('Vui lòng nhập mã thành viên đúng hoặc chọn thành viên.')
      return
    }
    if (books.length === 0) {
      alert('Vui lòng thêm ít nhất một sách.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      for (const book of books) {
        const { headers, accountEmail } = getApiAuth()
        const res = await fetch(apiUrl('/api/borrow/create'), {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: Number(book.id), memberId: selectedMember.id, accountEmail: accountEmail || undefined }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || 'Lỗi tạo phiếu mượn')
        }
      }
      const bookList = books.map(b => b.title).join(', ')
      logActivity('Mượn sách', selectedMember ? `Thành viên: ${selectedMember.name} | Sách: ${bookList || `${books.length} cuốn`}` : `Sách: ${bookList || `${books.length} cuốn`}`)
      alert('Xác nhận mượn sách thành công!')
      setBooks([])
      setBookInput('')
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const isLimitReached = books.length >= 3
  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 14)
  const borrowDate = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const returnDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <RequireAuth>
      <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Mượn sách</h2>
                <p className="text-slate-500 text-base font-normal leading-normal">Quét mã QR và thêm người mượn.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
                <span className="text-slate-700 text-sm font-medium">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </header>
            <div className="p-4 md:p-6 lg:px-8 lg:py-8">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
              {/* Left Column - Borrower Info */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h2 className="text-slate-900 text-xl font-bold flex items-center gap-2 leading-tight">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold">1</span>
                  <span className="leading-tight">Thông tin người mượn</span>
                </h2>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
                  <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-100">
                    <button
                      onClick={() => {
                        setInputMode('qr')
                        setManualInfo({ name: '', className: '', borrowDate: '' })
                      }}
                      className={`flex-1 py-2 text-sm font-bold rounded shadow-sm transition-all ${
                        inputMode === 'qr' 
                          ? 'text-primary bg-white' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Quét QR ID
                    </button>
                    <button
                      onClick={() => {
                        setInputMode('manual')
                        setMemberId('')
                        setManualMemberId(manualMemberId || (members[0] ? String(members[0].id) : ''))
                      }}
                      className={`flex-1 py-2 text-sm font-medium rounded transition-all ${
                        inputMode === 'manual' 
                          ? 'text-primary bg-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Nhập thủ công
                    </button>
                  </div>
                  
                  {inputMode === 'qr' ? (
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Mã tài khoản (12 số)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="material-symbols-outlined text-slate-400">qr_code_scanner</span>
                        </div>
                        <input
                          className="block w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                          placeholder="Nhập hoặc quét mã..."
                          type="text"
                          value={memberId}
                          onChange={(e) => setMemberId(e.target.value)}
                          maxLength={12}
                        />
                        <button className="absolute inset-y-0 right-0 pr-2 flex items-center">
                          <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer p-1">search</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Chọn thành viên</label>
                        <select
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          value={manualMemberId}
                          onChange={(e) => setManualMemberId(e.target.value)}
                        >
                          <option value="">-- Chọn thành viên --</option>
                          {members.map((m) => (
                            <option key={m.id} value={String(m.id)}>
                              {m.name} (ID: {m.userId})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Tên (ghi chú)</label>
                        <input
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="Nhập tên người mượn..."
                          type="text"
                          value={manualInfo.name}
                          onChange={(e) => setManualInfo(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Lớp (ghi chú)</label>
                        <input
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="Nhập lớp..."
                          type="text"
                          value={manualInfo.className}
                          onChange={(e) => setManualInfo(prev => ({ ...prev, className: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Member Info Card - show when có thành viên được chọn (QR hoặc thủ công) */}
                {selectedMember && (
                  <div className="bg-gradient-to-br from-white to-slate-50 p-0 rounded-xl shadow-md border border-slate-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Đang hoạt động
                      </span>
                    </div>
                    <div className="p-5 flex flex-col items-center text-center pt-8">
                      <div className="relative mb-4">
                        <div className="size-24 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-300 overflow-hidden flex items-center justify-center bg-[#137fec] text-white text-2xl font-bold border-4 border-white">
                          {selectedMember.avatarUrl ? (
                            <div className="size-full rounded-full bg-cover bg-center border-0" style={{ backgroundImage: `url("${selectedMember.avatarUrl}")` }} />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center">{selectedMember.name ? selectedMember.name.charAt(0).toUpperCase() : ''}</span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-slate-900 text-lg font-bold">{selectedMember.name}</h3>
                      <p className="text-slate-500 text-sm mb-1">ID: <span className="font-mono text-slate-700">{selectedMember.userId}</span></p>
                      <p className="text-slate-500 text-sm">Phân quyền: <span className="font-medium text-slate-700">{selectedMember.department || selectedMember.role || '-'}</span></p>
                      <div className="grid grid-cols-4 gap-2 w-full mt-6 border-t border-slate-200 pt-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">Đang mượn</span>
                          <span className="text-lg font-bold text-slate-700">{memberStats.currentBorrowing}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Quá hạn</span>
                          <span className="text-lg font-bold text-red-500">{memberStats.overdue}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Tối đa</span>
                          <span className="text-lg font-bold text-primary">{memberStats.maxBorrow}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Tổng</span>
                          <span className="text-lg font-bold text-slate-700">{memberStats.currentBorrowing}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Book Scanning */}
              <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                <h2 className="text-slate-900 text-xl font-bold flex items-center gap-2 leading-tight">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold">2</span>
                  <span className="leading-tight">Quét sách (Tối đa 3 quyển)</span>
                </h2>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-3 items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400">barcode_reader</span>
                    </div>
                    <input
                      autoFocus
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Quét mã QR sách"
                      type="text"
                      value={bookInput}
                      onChange={(e) => setBookInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLimitReached) {
                          handleAddBook()
                        }
                      }}
                      disabled={isLimitReached}
                    />
                  </div>
                  <button
                    onClick={handleAddBook}
                    disabled={isLimitReached || !bookInput.trim()}
                    className="h-[46px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">add</span>
                    <span className="hidden sm:inline">Nhập mã</span>
                  </button>
                </div>

                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
                  <div className="flex flex-col">
                    {isLimitReached && (
                      <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center gap-2 text-amber-800 text-sm">
                        <span className="material-symbols-outlined text-lg">info</span>
                        <span>Đã đạt giới hạn mượn 3 quyển cùng lúc. Vui lòng hoàn thành giao dịch.</span>
                      </div>
                    )}
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-700 text-base">Danh sách chờ ({books.length}/3)</h3>
                      {books.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete_sweep</span> Xóa tất cả
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="p-4 font-medium w-16">STT</th>
                          <th className="p-4 font-medium w-32">Mã sách</th>
                          <th className="p-4 font-medium">Thông tin sách</th>
                          <th className="p-4 font-medium w-32">Thể loại</th>
                          <th className="p-4 font-medium w-32">Trạng thái</th>
                          <th className="p-4 font-medium w-16 text-right">Hủy</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {books.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              Chưa có sách nào được thêm vào danh sách
                            </td>
                          </tr>
                        ) : (
                          books.map((book, index) => (
                            <tr key={book.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-400">{index + 1}</td>
                              <td className="p-4 font-mono text-slate-600">{book.bookId}</td>
                              <td className="p-4">
                                <div className="flex flex-col justify-center min-w-0">
                                  <span className="text-slate-900 font-medium line-clamp-1">{book.title}</span>
                                  <span className="text-slate-500 text-xs">{book.author}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600">{book.genre || '-'}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                  {book.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleRemoveBook(book.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100"
                                >
                                  <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-slate-600">
                        Ngày mượn: <span className="font-medium text-slate-900 ml-1">{borrowDate}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        Tổng số sách: <span className="font-bold text-primary text-lg ml-1">{books.length}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Hạn trả dự kiến: <span className="font-medium text-slate-900 ml-1">{returnDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setBooks([])
                          setBookInput('')
                        }}
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={books.length === 0 || submitting || !selectedMember}
                        className="flex-[2] px-4 py-3 rounded-lg text-white font-bold shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                        style={{ backgroundColor: '#137fec' }}
                      >
                        <span>Xác nhận mượn ({books.length})</span>
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
