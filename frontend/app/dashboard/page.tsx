'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import RequireAuth from '../components/RequireAuth'
import { API_BASE, apiUrl } from '../../lib/api'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

type DashboardStats = {
  borrowToday: number
  borrowMonth: number
  overdueCount: number
  activeMembers: number
  borrowTodayChange: number
  borrowMonthChange: number
  activeMembersChange: number
}

type TopReader = {
  id: number
  name: string
  bookCount: number
  rank: number
  avatarUrl?: string
}

type OverdueBook = {
  id: number
  bookTitle: string
  memberName: string
  dueDate: string
  daysOverdue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topReaders, setTopReaders] = useState<TopReader[]>([])
  const [overdue, setOverdue] = useState<OverdueBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsRes, readersRes, overdueRes] = await Promise.all([
        fetch(apiUrl('/api/dashboard/stats')),
        fetch(apiUrl('/api/dashboard/top-readers')),
        fetch(apiUrl('/api/dashboard/overdue')),
      ])
      if (!statsRes.ok || !readersRes.ok || !overdueRes.ok) throw new Error('Lỗi tải dữ liệu')
      const [statsData, readersData, overdueData] = await Promise.all([
        statsRes.json(),
        readersRes.json(),
        overdueRes.json(),
      ])
      setStats(statsData)
      setTopReaders(readersData)
      setOverdue(overdueData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Cập nhật khi quay lại tab hoặc mỗi 60 giây (giống các trang mạng realtime)
  useRefetchOnFocusAndInterval(fetchDashboard, { intervalMs: 60 * 1000 })

  const currentDate = new Date()
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  return (
    <>
      <RequireAuth>
        <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          {/* Header */}
          <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Dashboard Hoạt động Mượn & Trả Sách
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Tổng quan tình hình mượn trả và thành viên tích cực
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-slate-400 text-sm mr-2">calendar_month</span>
                <span className="text-slate-700 text-sm font-medium">{currentMonth}, {currentYear}</span>
              </div>
              <button 
                className="group flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal transition-all duration-200 shadow-lg shadow-blue-500/20 hover:bg-white hover:text-[#137fec] hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px] mr-2 group-hover:text-[#137fec] transition-colors">download</span>
                <span className="truncate">Xuất báo cáo</span>
              </button>
            </div>
          </header>
          
          <div className="p-4 md:p-6 lg:px-8 lg:py-8">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}. Kiểm tra backend chạy tại {API_BASE}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
            </div>
          ) : (
          <div className="flex flex-col gap-6">
            {/* Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mượn hôm nay */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Mượn hôm nay
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">today</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.borrowToday ?? 0}</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +{stats?.borrowTodayChange ?? 0}%
                  </p>
                </div>
              </div>

              {/* Mượn tháng này */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Mượn tháng này
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">calendar_view_month</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.borrowMonth ?? 0}</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +{stats?.borrowMonthChange ?? 0}%
                  </p>
                </div>
              </div>

              {/* Sách quá hạn */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-red-200 bg-white hover:border-red-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-red-600 text-sm font-medium leading-normal group-hover:text-red-500 transition-colors">
                    Sách quá hạn
                  </p>
                  <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-1.5 rounded-lg">warning</span>
                </div>
                <div className="flex items-end gap-2 relative z-10">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.overdueCount ?? 0}</p>
                  <p className="text-red-500 text-sm font-medium mb-1">sách</p>
                </div>
              </div>

              {/* Thành viên hoạt động */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Thành viên hoạt động
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">diversity_3</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.activeMembers ?? 0}</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +{stats?.activeMembersChange ?? 0}%
                  </p>
                </div>
              </div>
            </section>

            {/* Chart and Top Readers */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart - placeholder khi chưa có dữ liệu */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-slate-900 text-lg font-bold leading-normal">Xu hướng Mượn & Trả Sách</h3>
                  <p className="text-slate-500 text-sm">Thống kê theo tuần trong tháng</p>
                </div>
                <div className="w-full h-[240px] mt-4 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 border-dashed">
                  <div className="text-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-2 block">stacked_line_chart</span>
                    <p className="text-sm font-medium">Chưa có dữ liệu mượn trả</p>
                    <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi có phiếu mượn trong tháng</p>
                  </div>
                </div>
              </div>

              {/* Top Readers */}
              <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-full shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-slate-900 text-lg font-bold leading-normal">Độc giả tích cực</h3>
                  <p className="text-slate-500 text-sm">Top thành viên mượn nhiều nhất tháng</p>
                </div>
                <div className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto max-h-[340px]">
                  {topReaders.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <div className="text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">emoji_events</span>
                        <p className="text-sm font-medium">Chưa có dữ liệu</p>
                        <p className="text-xs mt-1">Danh sách sẽ cập nhật khi có phiếu mượn</p>
                      </div>
                    </div>
                  ) : topReaders.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${r.rank === 1 ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50'}`}
                    >
                      <div className="relative">
                        <div
                          className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-slate-200 bg-slate-100"
                          style={r.avatarUrl ? { backgroundImage: `url("${r.avatarUrl}")` } : undefined}
                        />
                        {r.rank <= 3 && (
                          <div className={`absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${r.rank === 1 ? 'bg-yellow-500 text-black' : r.rank === 2 ? 'bg-gray-400 text-black' : 'bg-orange-700'}`}>
                            {r.rank}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-sm font-medium truncate">{r.name}</p>
                        <p className={r.rank === 1 ? 'text-primary text-xs font-normal' : 'text-slate-500 text-xs font-normal'}>{r.bookCount} sách</p>
                      </div>
                      {r.rank === 1 && <span className="material-symbols-outlined text-yellow-500">emoji_events</span>}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Overdue Books Table */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">priority_high</span>
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold leading-normal">Danh sách quá hạn chưa trả</h3>
                    <p className="text-slate-500 text-sm">Cần gửi thông báo nhắc nhở ngay</p>
                  </div>
                </div>
                <button className="text-sm text-primary font-medium hover:text-blue-400">Xem tất cả</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 font-medium">Tên Sách</th>
                      <th className="p-4 font-medium">Người Mượn</th>
                      <th className="p-4 font-medium">Ngày Hẹn Trả</th>
                      <th className="p-4 font-medium text-center">Số Ngày Quá Hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {overdue.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500">
                          <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">check_circle</span>
                          <p className="font-medium">Không có sách quá hạn</p>
                          <p className="text-xs mt-1">Tất cả sách đều được trả đúng hạn</p>
                        </td>
                      </tr>
                    ) : overdue.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-10 rounded bg-slate-100 shadow-sm shrink-0" />
                            <span className="font-medium text-slate-900">{row.bookTitle}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-900">{row.memberName}</td>
                        <td className="p-4 text-slate-500">{row.dueDate ? new Date(row.dueDate).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.daysOverdue > 3 ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                            {row.daysOverdue} ngày
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          )}
          </div>
        </div>
          </main>
        </div>
      </RequireAuth>
    </>
  )
}
