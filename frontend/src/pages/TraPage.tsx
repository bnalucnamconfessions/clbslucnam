import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '@/lib/api'
import { formatBookId } from '@/lib/bookId'
import { logActivity } from '@/lib/activityLog'
import { useRefetchOnFocusAndInterval } from '@/lib/refetch'

interface BorrowRecord {
  id: number
  bookId: number
  bookTitle: string
  memberId: string
  memberName: string
  borrowDate: string
  dueDate: string
}

interface Book {
  id: string
  title: string
  author: string
  genre?: string
  bookId: string
}

interface LoanInfo {
  memberName: string
  memberId: string
  borrowDate: string
  dueDate: string
  returnDate: string
  status: 'on-time' | 'overdue'
  daysRemaining: number
  daysAgo: number
}

interface MemberItem {
  id: string
  name: string
  userId: string
  avatarUrl?: string
}

export default function TraPage() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedBookId, setScannedBookId] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null)
  const [scannedBook, setScannedBook] = useState<Book | null>(null)
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null)
  const [returnNotes, setReturnNotes] = useState('')

  const fetchBorrows = async () => {
    try {
      const { headers } = getApiAuth()
      const [borrowsRes, membersRes, booksRes] = await Promise.all([
        fetch(apiUrlWithAuth('/api/borrow'), { headers }),
        fetch(apiUrlWithAuth('/api/members'), { headers }),
        fetch(apiUrlWithAuth('/api/books'), { headers }),
      ])
      if (borrowsRes.ok) {
        const data = await borrowsRes.json()
        setBorrows(Array.isArray(data) ? data : [])
      }
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(Array.isArray(data) ? data : [])
      }
      if (booksRes.ok) {
        const data = await booksRes.json()
        setBooks(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('Không tải được danh sách mượn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBorrows()
  }, [])

  useRefetchOnFocusAndInterval(fetchBorrows, { intervalMs: 20 * 1000 })

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return iso
    }
  }

  const handleScanBook = (bookId: string) => {
    setScannedBookId(bookId)
    const id = Number(bookId)
    if (!isNaN(id) && borrows.length > 0) {
      const record = borrows.find(b => b.bookId === id)
      if (record) {
        setSelectedRecord(record)
        const fullBook = books.find((b: Book) => String(b.id) === String(record.bookId))
        setScannedBook({
          id: String(record.bookId),
          title: record.bookTitle,
          author: fullBook?.author ?? '',
          genre: fullBook?.genre,
          bookId: String(record.bookId),
        })
        const due = new Date(record.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)
        const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        setLoanInfo({
          memberName: record.memberName,
          memberId: String(record.memberId),
          borrowDate: formatDate(record.borrowDate),
          dueDate: formatDate(record.dueDate),
          returnDate: formatDate(new Date().toISOString()),
          status: daysRemaining >= 0 ? 'on-time' : 'overdue',
          daysRemaining,
          daysAgo: 0
        })
      } else {
        setSelectedRecord(null)
        setScannedBook(null)
        setLoanInfo(null)
      }
    } else {
      setSelectedRecord(null)
      setScannedBook(null)
      setLoanInfo(null)
    }
  }

  const handleConfirm = async () => {
    if (!selectedRecord) {
      alert('Vui lòng quét mã sách hoặc chọn phiếu mượn!')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { headers, accountEmail } = getApiAuth()
      const payload = { recordId: selectedRecord.id, returnNotes: returnNotes || undefined, accountEmail: accountEmail || undefined }
      const res = await fetch(apiUrl('/api/return'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi trả sách')
      }
      logActivity('Trả sách', selectedRecord ? `Sách: ${selectedRecord.bookTitle} | Thành viên: ${selectedRecord.memberName} | Hạn trả: ${selectedRecord.dueDate}${returnNotes ? ` | Ghi chú: ${returnNotes}` : ''}` : '')
      alert('Xác nhận trả sách thành công!')
      setScannedBookId('')
      setScannedBook(null)
      setLoanInfo(null)
      setSelectedRecord(null)
      setReturnNotes('')
      fetchBorrows()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
            <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
              <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
                <div className="flex flex-col gap-2">
                  <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Trả Sách</h2>
                  <p className="text-slate-500 text-base font-normal leading-normal">Quét mã QR để tiến hành trả sách</p>
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
                {loading && (
                  <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Đang tải danh sách phiếu mượn...
                  </div>
                )}
                <div className="flex flex-col gap-6">

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
              {/* Left Column - Book Scan */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h2 className="text-slate-900 text-xl font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">1</span>
                  Quét mã sách
                </h2>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Mã sách (QR 12 số)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400">qr_code_2</span>
                      </div>
                      <input
                        autoFocus
                        className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                        placeholder="Nhập mã sách hoặc quét mã (Enter để tìm)"
                        type="text"
                        value={scannedBookId}
                        onChange={(e) => {
                          const value = e.target.value
                          setScannedBookId(value)
                          if (!value.trim()) {
                            setScannedBook(null)
                            setLoanInfo(null)
                            setSelectedRecord(null)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && scannedBookId.trim()) {
                            handleScanBook(scannedBookId.trim())
                          }
                        }}
                      />
                      {scannedBook && (
                        <button className="absolute inset-y-0 right-0 pr-2 flex items-center">
                          <span className="material-symbols-outlined text-green-500" title="Đã tìm thấy">check_circle</span>
                        </button>
                      )}
                    </div>
                  </div>
                    {scannedBook && (
                      <div className="border-t border-slate-100 mt-2 pt-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Thông tin sách</p>
                        <div className="text-sm text-slate-700 space-y-1">
                          <p><span className="text-slate-500">Tên:</span> {scannedBook.title}</p>
                          {scannedBook.author && <p><span className="text-slate-500">Tác giả:</span> {scannedBook.author}</p>}
                          {scannedBook.genre && <p><span className="text-slate-500">Thể loại:</span> {scannedBook.genre}</p>}
                          <p><span className="text-slate-500">Mã sách:</span> <span className="font-mono">{formatBookId(scannedBook.bookId)}</span></p>
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/* Right Column - Loan Info & Confirmation */}
              <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                <h2 className="text-slate-900 text-xl font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">2</span>
                  Thông tin phiếu mượn & Xác nhận
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
                  {loanInfo ? (
                    <>
                      <div className="p-6 border-b border-slate-100 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        <div className="size-16 rounded-full bg-gradient-to-tr from-primary to-blue-300 p-0.5 shrink-0 overflow-hidden flex items-center justify-center bg-[#137fec] text-white text-2xl font-bold border-2 border-white">
                          {(() => {
                            const member = members.find(x => String(x.id) === String(loanInfo.memberId))
                            if (member?.avatarUrl) {
                              return <div className="size-full rounded-full bg-cover bg-center border-0" style={{ backgroundImage: `url("${member.avatarUrl}")` }} />
                            }
                            return <span className="w-full h-full flex items-center justify-center">{loanInfo.memberName ? loanInfo.memberName.charAt(0).toUpperCase() : ''}</span>
                          })()}
                        </div>
                        <div className="flex flex-col mr-auto">
                          <h3 className="text-xl font-bold text-slate-900">{loanInfo.memberName}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="font-mono">ID: {loanInfo.memberId}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end pl-4 border-l border-slate-100">
                          <span className="text-xs text-slate-500 uppercase font-semibold mb-1">Trạng thái</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                            loanInfo.status === 'on-time' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            <span className="material-symbols-outlined text-base">verified</span>
                            {loanInfo.status === 'on-time' ? 'Đúng hạn' : 'Quá hạn'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                        <div className="flex flex-col gap-1 p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">event_note</span> Ngày mượn
                          </span>
                          <span className="text-lg font-bold text-slate-700">{loanInfo.borrowDate}</span>
                          <span className="text-xs text-slate-400">Cách đây {loanInfo.daysAgo} ngày</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">notifications_active</span> Hạn trả
                          </span>
                          <span className="text-lg font-bold text-slate-700">{loanInfo.dueDate}</span>
                          <span className={`text-xs font-medium ${loanInfo.daysRemaining > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {loanInfo.daysRemaining > 0 ? `Còn ${loanInfo.daysRemaining} ngày` : 'Đã quá hạn'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-green-50 rounded-lg border border-green-100 relative overflow-hidden ring-1 ring-green-200">
                          <div className="absolute right-0 top-0 p-2 opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl text-green-600">today</span>
                          </div>
                          <span className="text-xs text-green-700 font-medium uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span> Ngày trả thực tế
                          </span>
                          <span className="text-xl font-bold text-green-700">{loanInfo.returnDate}</span>
                          <span className="text-xs text-green-600 font-medium">Hôm nay</span>
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú tình trạng sách (nếu có)</label>
                        <textarea 
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none h-24 placeholder:text-slate-400"
                          placeholder="Nhập ghi chú về hư hỏng hoặc các vấn đề khác..."
                          value={returnNotes}
                          onChange={(e) => setReturnNotes(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">Hệ thống tự động cập nhật kho sách sau khi xác nhận.</span>
                        <div className="flex gap-3 ml-auto w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              setScannedBookId('')
                              setScannedBook(null)
                              setLoanInfo(null)
                              setReturnNotes('')
                            }}
                            className="px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors flex-1 sm:flex-none justify-center"
                          >
                            Hủy bỏ
                          </button>
                          <button 
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="px-6 py-3 rounded-lg bg-[#137fec] text-white font-bold hover:bg-[#0f6fd6] shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#137fec' }}
                          >
                            {submitting ? (
                              <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            ) : (
                              <span className="material-symbols-outlined">assignment_return</span>
                            )}
                            Xác nhận trả sách
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center text-slate-400">
                        <span className="material-symbols-outlined text-6xl mb-4 block">qr_code_2</span>
                        <p className="text-sm">Vui lòng quét mã sách ở bên trái để xem thông tin phiếu mượn</p>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
              </div>
            </div>
          </main>
        </div>
  )
}
