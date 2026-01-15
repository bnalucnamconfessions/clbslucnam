'use client'

import { useState } from 'react'
import Sidebar from '../components/Sidebar'

interface Book {
  id: string
  title: string
  author: string
  bookId: string
  status: string
  coverImage: string
}

export default function MuonPage() {
  const [inputMode, setInputMode] = useState<'qr' | 'manual'>('qr')
  const [memberId, setMemberId] = useState('098765432101')
  const [manualInfo, setManualInfo] = useState({
    name: '',
    className: '',
    borrowDate: ''
  })
  const [bookInput, setBookInput] = useState('')
  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      bookId: 'BK-001293',
      status: 'Mượn mới',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrjiLoo6Gbc-gDi4sf1Mks-VIlLTX7GgTE53nUM2ETVnJEx7PHUEaPd8ejwSR1abwZr-mXxPiVEI0aA267NAXqIc-zOwSYnzpGkI__TxvxrqOCbUQFAUGBTDJAjoPBVRYfzIdl8XFEijZ8r2c8Rm3u-LfYpeH-NcvnDt5dP-AyH9zYOr-drLUAzvD5Ntz9ixiZ5vMbF78RX-1rzAMLsSMqzQ5p4L5PuTT6QcH_IQpaGDQJHHsHEfqrar8ZAXnyGQ-rwySYMN2Ui5Cb'
    },
    {
      id: '2',
      title: 'Nhà Giả Kim',
      author: 'Paulo Coelho',
      bookId: 'BK-004412',
      status: 'Mượn mới',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj5uWvxYyS_Pr5Rc_W48XsKjJXo0_mwPp2H8o9wXNmTnf_0pTlBoS70HMuadSQq3mGawyEYyvWVsZOGRB2sjuDp1FZ5NVKQpMoB7Yekydjf4eLsn3hgoWYeFw09-2ziKamQYUNYxYB_nDIx2Bge2hQqnL_u_hcRRXkG0AHhq6RfVjnnaWH2BhCVlHE2OY5pBXP4aL_AU3bD1winkXxUSugzm9P2sYmhezwEGRXVFCe-zgA7ARSA5CMzr7Rm28WFHuNFP901C9tCIpr'
    },
    {
      id: '3',
      title: 'Harry Potter và Hòn Đá Phù Thủy',
      author: 'J.K. Rowling',
      bookId: 'BK-009981',
      status: 'Mượn mới',
      coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKla3kBwsIgwvw07gRoGlYlc-ARmYfPR8zqBRaRtJ-TYzMDgBMQgn9gomTYp8lMaSZZilp_FGBJPMQyenI7awJcGV4r-ZR0NFtVkneLj3zcVpJtZGg8_f15l4g8_cfBl9wornp1ZFGDa7_x8MlUCq6quw8QNT2OkI5Simq3MgHm1cz0evkXYQKtk3Yu8jwqusylfZ7OCLBE-DP7ChD-P7LQ6u8kfVM2dFxXAz3q4QhAkxury90iog1KvmZWsN7bs6PNYn3oAeCjdZa'
    }
  ])

  const handleAddBook = () => {
    if (bookInput.trim() && books.length < 3) {
      // Mock: Thêm sách mới
      const newBook: Book = {
        id: String(books.length + 1),
        title: `Sách ${books.length + 1}`,
        author: 'Tác giả',
        bookId: bookInput,
        status: 'Mượn mới',
        coverImage: 'https://via.placeholder.com/40x56'
      }
      setBooks([...books, newBook])
      setBookInput('')
    }
  }

  const handleRemoveBook = (id: string) => {
    setBooks(books.filter(book => book.id !== id))
  }

  const handleClearAll = () => {
    setBooks([])
  }

  const handleConfirm = () => {
    // TODO: Xử lý xác nhận mượn sách
    alert('Xác nhận mượn sách thành công!')
    setBooks([])
    setBookInput('')
  }

  const isLimitReached = books.length >= 3
  const borrowDate = '14/10/2023'
  const returnDate = '28/10/2023'

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-white text-slate-900 font-display overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="shrink-0 pt-4 md:pt-6 px-4 md:px-6 lg:px-8 pb-6 border-b border-slate-200 bg-white z-10">
          
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Mượn sách</h1>
              <p className="text-slate-500 text-base font-normal leading-normal">Quét mã QR và thêm người mượn.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
              <span className="text-slate-700 text-sm font-medium">Thứ Hai, 14/10/2023</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:py-8">
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
                        <label className="text-xs font-semibold text-slate-500 uppercase">Tên</label>
                        <input
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="Nhập tên người mượn..."
                          type="text"
                          value={manualInfo.name}
                          onChange={(e) => setManualInfo(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Lớp</label>
                        <input
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="Nhập lớp..."
                          type="text"
                          value={manualInfo.className}
                          onChange={(e) => setManualInfo(prev => ({ ...prev, className: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Ngày mượn</label>
                        <input
                          className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="Chọn ngày mượn..."
                          type="date"
                          value={manualInfo.borrowDate}
                          onChange={(e) => setManualInfo(prev => ({ ...prev, borrowDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Member Info Card - Only show when QR mode and valid 12-digit ID */}
                {inputMode === 'qr' && memberId.length === 12 && /^\d+$/.test(memberId) && (
                  <div className="bg-gradient-to-br from-white to-slate-50 p-0 rounded-xl shadow-md border border-slate-200 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Đang hoạt động
                      </span>
                    </div>
                    <div className="p-5 flex flex-col items-center text-center pt-8">
                      <div className="relative mb-4">
                        <div className="size-24 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-300">
                          <div 
                            className="size-full rounded-full bg-slate-200 bg-center bg-cover border-4 border-white"
                            style={{
                              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCj9U70a_pSB-PDGn1hROw_7HrprwPJMUNkHqBp-dgdrKZdayHZ94qIM3W1bBV2jIyi7_YQdUxJtLgBlelETw7WZnMD7y0csfq2dcbLkrJoPNY4gtLpxrNbJc_c-ydWzagphVznsinU-LZvGNPfAbwRhKftLhDGzZk0iUR7TqcITOFniOrGgOYOepmv39bFPLv7v4HVDL0E9pU4ABRtq1I03dJMPZOi-caqNt6VfPa-WbxACL4g3JVoga0syBTeLYpMjrrGtbI-aZGG")'
                            }}
                          ></div>
                        </div>
                      </div>
                      <h3 className="text-slate-900 text-lg font-bold">Nguyễn Văn An</h3>
                      <p className="text-slate-500 text-sm mb-1">ID: <span className="font-mono text-slate-700">{memberId}</span></p>
                      <p className="text-slate-500 text-sm">Lớp: <span className="font-medium text-slate-700">12A1</span></p>
                      <div className="grid grid-cols-4 gap-2 w-full mt-6 border-t border-slate-200 pt-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">Đang mượn</span>
                          <span className="text-lg font-bold text-slate-700">0</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Quá hạn</span>
                          <span className="text-lg font-bold text-red-500">0</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Tối đa</span>
                          <span className="text-lg font-bold text-primary">3</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200">
                          <span className="text-xs text-slate-500">Tổng</span>
                          <span className="text-lg font-bold text-slate-700">0</span>
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
                      placeholder="Quét mã vạch sách (ISBN/BookID)..."
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
                          <th className="p-4 font-medium w-16">#</th>
                          <th className="p-4 font-medium">Thông tin sách</th>
                          <th className="p-4 font-medium w-32">Mã sách</th>
                          <th className="p-4 font-medium w-32">Trạng thái</th>
                          <th className="p-4 font-medium w-16 text-right">Hủy</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {books.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              Chưa có sách nào được thêm vào danh sách
                            </td>
                          </tr>
                        ) : (
                          books.map((book, index) => (
                            <tr key={book.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-400">{index + 1}</td>
                              <td className="p-4">
                                <div className="flex gap-3">
                                  <div
                                    className="w-10 h-14 bg-slate-200 rounded bg-cover bg-center shrink-0 shadow-sm"
                                    style={{ backgroundImage: `url("${book.coverImage}")` }}
                                  ></div>
                                  <div className="flex flex-col justify-center">
                                    <span className="text-slate-900 font-medium line-clamp-1">{book.title}</span>
                                    <span className="text-slate-500 text-xs">{book.author}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-600">{book.bookId}</td>
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
                        disabled={books.length === 0}
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
      </main>
    </div>
  )
}
