'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'

interface Book {
  id: string
  title: string
  author: string
  bookId: string
  coverImage: string
}

interface LoanInfo {
  memberName: string
  memberId: string
  className: string
  memberAvatar: string
  borrowDate: string
  dueDate: string
  returnDate: string
  status: 'on-time' | 'overdue'
  daysRemaining: number
  daysAgo: number
}

export default function TraPage() {
  const [scannedBookId, setScannedBookId] = useState('123456789012')
  const [scannedBook, setScannedBook] = useState<Book | null>({
    id: '1',
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    bookId: '123456789012',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrjiLoo6Gbc-gDi4sf1Mks-VIlLTX7GgTE53nUM2ETVnJEx7PHUEaPd8ejwSR1abwZr-mXxPiVEI0aA267NAXqIc-zOwSYnzpGkI__TxvxrqOCbUQFAUGBTDJAjoPBVRYfzIdl8XFEijZ8r2c8Rm3u-LfYpeH-NcvnDt5dP-AyH9zYOr-drLUAzvD5Ntz9ixiZ5vMbF78RX-1rzAMLsSMqzQ5p4L5PuTT6QcH_IQpaGDQJHHsHEfqrar8ZAXnyGQ-rwySYMN2Ui5Cb'
  })
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>({
    memberName: 'Nguyễn Văn An',
    memberId: '098765432101',
    className: '12A1',
    memberAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj9U70a_pSB-PDGn1hROw_7HrprwPJMUNkHqBp-dgdrKZdayHZ94qIM3W1bBV2jIyi7_YQdUxJtLgBlelETw7WZnMD7y0csfq2dcbLkrJoPNY4gtLpxrNbJc_c-ydWzagphVznsinU-LZvGNPfAbwRhKftLhDGzZk0iUR7TqcITOFniOrGgOYOepmv39bFPLv7v4HVDL0E9pU4ABRtq1I03dJMPZOi-caqNt6VfPa-WbxACL4g3JVoga0syBTeLYpMjrrGtbI-aZGG',
    borrowDate: '01/10/2023',
    dueDate: '15/10/2023',
    returnDate: '14/10/2023',
    status: 'on-time',
    daysRemaining: 1,
    daysAgo: 13
  })
  const [returnNotes, setReturnNotes] = useState('')

  const handleScanBook = (bookId: string) => {
    setScannedBookId(bookId)
    // Mock: Tìm thông tin sách và phiếu mượn
    if (bookId === '123456789012') {
      setScannedBook({
        id: '1',
        title: 'Đắc Nhân Tâm',
        author: 'Dale Carnegie',
        bookId: '123456789012',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrjiLoo6Gbc-gDi4sf1Mks-VIlLTX7GgTE53nUM2ETVnJEx7PHUEaPd8ejwSR1abwZr-mXxPiVEI0aA267NAXqIc-zOwSYnzpGkI__TxvxrqOCbUQFAUGBTDJAjoPBVRYfzIdl8XFEijZ8r2c8Rm3u-LfYpeH-NcvnDt5dP-AyH9zYOr-drLUAzvD5Ntz9ixiZ5vMbF78RX-1rzAMLsSMqzQ5p4L5PuTT6QcH_IQpaGDQJHHsHEfqrar8ZAXnyGQ-rwySYMN2Ui5Cb'
      })
      setLoanInfo({
        memberName: 'Nguyễn Văn An',
        memberId: '098765432101',
        className: '12A1',
        memberAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj9U70a_pSB-PDGn1hROw_7HrprwPJMUNkHqBp-dgdrKZdayHZ94qIM3W1bBV2jIyi7_YQdUxJtLgBlelETw7WZnMD7y0csfq2dcbLkrJoPNY4gtLpxrNbJc_c-ydWzagphVznsinU-LZvGNPfAbwRhKftLhDGzZk0iUR7TqcITOFniOrGgOYOepmv39bFPLv7v4HVDL0E9pU4ABRtq1I03dJMPZOi-caqNt6VfPa-WbxACL4g3JVoga0syBTeLYpMjrrGtbI-aZGG',
        borrowDate: '01/10/2023',
        dueDate: '15/10/2023',
        returnDate: '14/10/2023',
        status: 'on-time',
        daysRemaining: 1,
        daysAgo: 13
      })
    } else {
      setScannedBook(null)
      setLoanInfo(null)
    }
  }

  const handleConfirm = () => {
    if (!scannedBook || !loanInfo) {
      alert('Vui lòng quét mã sách trước!')
      return
    }
    // TODO: Xử lý xác nhận trả sách
    alert('Xác nhận trả sách thành công!')
    setScannedBookId('')
    setScannedBook(null)
    setLoanInfo(null)
    setReturnNotes('')
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-white text-slate-900 font-display overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="shrink-0 pt-4 md:pt-6 px-4 md:px-6 lg:px-8 pb-6 border-b border-slate-200 bg-white z-10">
          
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Trả Sách</h1>
              <p className="text-slate-500 text-base font-normal leading-normal">Quét mã QR để tiến hành trả sách</p>
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
                        placeholder="Quét mã..."
                        type="text"
                        value={scannedBookId}
                        onChange={(e) => {
                          const value = e.target.value
                          setScannedBookId(value)
                          if (value.length === 12) {
                            handleScanBook(value)
                          } else {
                            setScannedBook(null)
                            setLoanInfo(null)
                          }
                        }}
                        maxLength={12}
                      />
                      {scannedBook && (
                        <button className="absolute inset-y-0 right-0 pr-2 flex items-center">
                          <span className="material-symbols-outlined text-green-500" title="Đã tìm thấy">check_circle</span>
                        </button>
                      )}
                    </div>
                  </div>
                    {scannedBook && (
                      <div className="border-t border-slate-100 mt-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Kết quả tìm kiếm</p>
                        <div className="flex gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <div 
                            className="w-16 h-24 bg-slate-200 rounded bg-cover bg-center shrink-0 shadow-sm"
                            style={{ backgroundImage: `url("${scannedBook.coverImage}")` }}
                          ></div>
                          <div className="flex flex-col justify-center">
                            <h4 className="text-slate-900 font-bold text-base line-clamp-2">{scannedBook.title}</h4>
                            <p className="text-slate-500 text-sm mb-1">{scannedBook.author}</p>
                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[11px] font-mono">ID: {scannedBook.bookId}</span>
                          </div>
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
                        <div className="size-16 rounded-full bg-gradient-to-tr from-primary to-blue-300 p-0.5 shrink-0">
                          <div 
                            className="size-full rounded-full bg-cover bg-center border-2 border-white"
                            style={{ backgroundImage: `url("${loanInfo.memberAvatar}")` }}
                          ></div>
                        </div>
                        <div className="flex flex-col mr-auto">
                          <h3 className="text-xl font-bold text-slate-900">{loanInfo.memberName}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">school</span> Lớp <b className="text-slate-700">{loanInfo.className}</b>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
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
                            className="px-6 py-3 rounded-lg bg-[#137fec] text-white font-bold hover:bg-[#0f6fd6] shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                            style={{ backgroundColor: '#137fec' }}
                          >
                            <span className="material-symbols-outlined">assignment_return</span>
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
      </main>
    </div>
  )
}
