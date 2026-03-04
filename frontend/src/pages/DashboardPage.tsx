import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { API_BASE, apiUrl, apiUrlWithAuth, getApiAuth } from '@/lib/api'
import { useRefetchOnFocusAndInterval } from '@/lib/refetch'

type DashboardStats = {
  borrowToday: number
  borrowMonth: number
  overdueCount: number
  activeMembers: number
  borrowTodayChange: number
  borrowMonthChange: number
  activeMembersChange: number
}

type FundStats = {
  totalBalance: number
  totalIncomeMonth: number
  totalExpenseMonth: number
  pendingCount: number
}

type CampaignStats = {
  raised: number
  goal: number
  supportCount: number
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

type TrendPoint = {
  label: string
  borrowCount: number
  returnCount: number
}

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [fundStats, setFundStats] = useState<FundStats | null>(null)
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [topReaders, setTopReaders] = useState<TopReader[]>([])
  const [overdue, setOverdue] = useState<OverdueBook[]>([])
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year'>('day')
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { headers } = getApiAuth()
      const [statsRes, readersRes, overdueRes, fundRes, campaignRes, notifRes] = await Promise.all([
        fetch(apiUrlWithAuth('/api/dashboard/stats'), { headers }),
        fetch(apiUrl('/api/dashboard/top-readers')),
        fetch(apiUrlWithAuth('/api/dashboard/overdue'), { headers }),
        fetch(apiUrlWithAuth('/api/fund/stats'), { headers }),
        fetch(apiUrl('/api/quyen-gop/campaign')),
        fetch(apiUrlWithAuth('/api/notifications'), { headers }),
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

      if (fundRes.ok) {
        const fundData = await fundRes.json()
        setFundStats({
          totalBalance: fundData.totalBalance ?? 0,
          totalIncomeMonth: fundData.totalIncomeMonth ?? 0,
          totalExpenseMonth: fundData.totalExpenseMonth ?? 0,
          pendingCount: fundData.pendingCount ?? 0,
        })
      }
      if (campaignRes.ok) {
        const campData = await campaignRes.json()
        setCampaignStats({
          raised: campData.raised ?? 0,
          goal: campData.goal ?? 0,
          supportCount: campData.supportCount ?? 0,
        })
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setNotificationCount(Array.isArray(notifData) ? notifData.length : 0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const fetchTrend = useCallback(async (period: 'day' | 'month' | 'year') => {
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/dashboard/borrow-trend?period=${period}`), { headers })
      if (res.ok) {
        const data = await res.json()
        setTrendData(Array.isArray(data) ? data : [])
      } else {
        setTrendData([])
      }
    } catch {
      setTrendData([])
    }
  }, [])

  useEffect(() => {
    fetchTrend(chartPeriod)
  }, [chartPeriod, fetchTrend])

  // Cập nhật khi quay lại tab hoặc mỗi 60 giây (giống các trang mạng realtime)
  useRefetchOnFocusAndInterval(fetchDashboard, { intervalMs: 20 * 1000 })

  const currentDate = new Date()
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  const handleExportReport = useCallback(() => {
    const rows: string[] = []
    const csv = (arr: string[]) => rows.push(arr.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    csv(['Báo cáo tổng quan', `${currentMonth}, ${currentYear}`])
    rows.push('')
    csv(['Chỉ số', 'Giá trị'])
    if (stats) {
      csv(['Mượn hôm nay', String(stats.borrowToday)])
      csv(['Mượn tháng này', String(stats.borrowMonth)])
      csv(['Sách quá hạn', String(stats.overdueCount)])
      csv(['Thành viên đang hoạt động', String(stats.activeMembers)])
    }
    rows.push('')
    csv(['Độc giả tích cực (Top mượn sách)'])
    csv(['Hạng', 'Tên', 'Số sách'])
    topReaders.forEach(r => csv([String(r.rank), r.name, String(r.bookCount)]))
    rows.push('')
    csv(['Sách quá hạn chưa trả'])
    csv(['Tên sách', 'Người mượn', 'Hạn trả', 'Số ngày quá hạn'])
    overdue.forEach(o => csv([o.bookTitle, o.memberName, o.dueDate || '', String(o.daysOverdue)]))
    rows.push('')
    csv(['Xu hướng mượn/trả', chartPeriod === 'day' ? 'Theo ngày' : chartPeriod === 'month' ? 'Theo tháng' : 'Theo năm'])
    csv(['Kỳ', 'Mượn', 'Trả'])
    trendData.forEach(p => csv([p.label, String(p.borrowCount), String(p.returnCount)]))
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bao-cao-tong-quan-${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [stats, topReaders, overdue, trendData, chartPeriod, currentMonth, currentYear])

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          {/* Header */}
          <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Tổng quan
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Mượn trả sách, thu chi, quyên góp và hoạt động CLB
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-slate-400 text-sm mr-2">calendar_month</span>
                <span className="text-slate-700 text-sm font-medium">{currentMonth}, {currentYear}</span>
              </div>
              <button 
                type="button"
                onClick={handleExportReport}
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
                  <div>
                    <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                      Mượn hôm nay
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">Phiếu mượn trong ngày</p>
                  </div>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg" aria-hidden>today</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.borrowToday ?? 0}</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>trending_up</span>
                    {(stats?.borrowTodayChange ?? 0) === 0 ? '0%' : `+${stats?.borrowTodayChange}%`}
                  </p>
                </div>
              </div>

              {/* Mượn tháng này */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                      Mượn tháng này
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">Phiếu mượn trong tháng</p>
                  </div>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg" aria-hidden>calendar_view_month</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">{stats?.borrowMonth ?? 0}</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>trending_up</span>
                    {(stats?.borrowMonthChange ?? 0) === 0 ? '0%' : `+${stats?.borrowMonthChange}%`}
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
                  <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-1.5 rounded-lg" aria-hidden>warning</span>
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

            {/* Thu chi & Quyên góp & Thông báo */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tổng quỹ */}
              <Link to="/dashboard/tai-chinh" className="flex flex-col gap-2 rounded-xl p-6 border border-emerald-200 bg-white hover:border-emerald-300 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-emerald-600 transition-colors">
                    Tổng quỹ hiện tại
                  </p>
                  <span className="material-symbols-outlined text-emerald-600 bg-emerald-500/10 p-1.5 rounded-lg">account_balance_wallet</span>
                </div>
                <p className="text-slate-900 text-2xl font-bold leading-tight">{formatVND(fundStats?.totalBalance ?? 0)} ₫</p>
                <p className="text-emerald-600 text-xs font-medium">Thu trừ chi (đã xác nhận)</p>
              </Link>

              {/* Đơn chờ duyệt */}
              <Link to="/dashboard/tai-chinh" className="flex flex-col gap-2 rounded-xl p-6 border border-amber-200 bg-white hover:border-amber-300 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-amber-600 transition-colors">
                    Đơn chờ duyệt
                  </p>
                  <span className="material-symbols-outlined text-amber-600 bg-amber-500/10 p-1.5 rounded-lg">pending_actions</span>
                </div>
                <p className="text-slate-900 text-3xl font-bold leading-tight">{fundStats?.pendingCount ?? 0}</p>
                <p className="text-amber-600 text-xs font-medium">Yêu cầu thu chi cần xử lý</p>
              </Link>

              {/* Quyên góp */}
              <Link to="/dashboard/quyen-gop" className="flex flex-col gap-2 rounded-xl p-6 border border-violet-200 bg-white hover:border-violet-300 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-violet-600 transition-colors">
                    Tiến độ quyên góp
                  </p>
                  <span className="material-symbols-outlined text-violet-600 bg-violet-500/10 p-1.5 rounded-lg">volunteer_activism</span>
                </div>
                <p className="text-slate-900 text-2xl font-bold leading-tight">
                  {campaignStats && campaignStats.goal > 0
                    ? `${Math.min(100, Math.round((campaignStats.raised / campaignStats.goal) * 100))}%`
                    : '—'}
                </p>
                <p className="text-violet-600 text-xs font-medium">
                  {formatVND(campaignStats?.raised ?? 0)} / {formatVND(campaignStats?.goal ?? 0)} ₫ · {campaignStats?.supportCount ?? 0} lượt ủng hộ
                </p>
              </Link>

              {/* Thông báo */}
              <Link to="/thong-bao" className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Thông báo
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">campaign</span>
                </div>
                <p className="text-slate-900 text-3xl font-bold leading-tight">{notificationCount}</p>
                <p className="text-slate-500 text-xs font-medium">Tin đã đăng</p>
              </Link>
            </section>

            {/* Shortcuts */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-slate-900 text-lg font-bold leading-normal mb-4">Truy cập nhanh</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/muon"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-blue-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary">book</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-primary">Mượn sách</span>
                </Link>
                <Link
                  to="/tra"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-blue-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary">assignment_return</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-primary">Trả sách</span>
                </Link>
                <Link
                  to="/dashboard/tai-chinh"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-emerald-600">payments</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-600">Thu chi</span>
                </Link>
                <Link
                  to="/thong-bao"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-blue-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-primary">Thông báo</span>
                </Link>
                <Link
                  to="/books"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-blue-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary">library_books</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-primary">Kho sách</span>
                </Link>
                <Link
                  to="/dashboard/xep-hang"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-blue-50 transition-colors group"
                >
                  <span className="material-symbols-outlined text-primary">emoji_events</span>
                  <span className="text-sm font-medium text-slate-900 group-hover:text-primary">Bảng xếp hạng</span>
                </Link>
              </div>
            </section>

            {/* Chart and Top Readers */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart - placeholder khi chưa có dữ liệu */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold leading-normal">Xu hướng Mượn & Trả Sách</h3>
                    <p className="text-slate-500 text-sm mt-0.5">
                      {chartPeriod === 'day' && 'Thống kê theo ngày trong tuần'}
                      {chartPeriod === 'month' && 'Thống kê theo tháng trong năm'}
                      {chartPeriod === 'year' && 'Thống kê theo năm'}
                    </p>
                  </div>
                  <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                    {(['day', 'month', 'year'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setChartPeriod(p)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          chartPeriod === p
                            ? 'bg-white text-primary shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p === 'day' && 'Theo ngày'}
                        {p === 'month' && 'Theo tháng'}
                        {p === 'year' && 'Theo năm'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full h-[240px] min-h-[200px] mt-4 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                  {trendData.length > 0 ? (
                    <div className="w-full h-full min-h-[180px] p-2">
                      <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                        <LineChart
                          data={trendData.map((p) => ({ label: p.label, muon: p.borrowCount, tra: p.returnCount }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={{ stroke: '#cbd5e1' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={{ stroke: '#cbd5e1' }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                            labelFormatter={(label) => `Kỳ: ${label}`}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 12 }}
                            formatter={(value) => <span className="text-slate-600">{value}</span>}
                            iconType="line"
                            iconSize={10}
                          />
                          <Line type="monotone" dataKey="muon" stroke="#137fec" strokeWidth={2.5} dot={{ r: 4 }} name="Mượn sách" />
                          <Line type="monotone" dataKey="tra" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Trả sách" strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <span className="material-symbols-outlined text-5xl mb-2 block" aria-hidden>stacked_line_chart</span>
                      <p className="text-sm font-medium">Chưa có dữ liệu</p>
                      <p className="text-xs mt-1">Biểu đồ sẽ hiển thị khi có phiếu mượn trong tháng</p>
                    </div>
                  )}
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
                        <span className="material-symbols-outlined text-4xl mb-2 block" aria-hidden>emoji_events</span>
                        <p className="text-sm font-medium">Chưa có dữ liệu</p>
                        <p className="text-xs mt-1">Danh sách sẽ có khi có phiếu mượn đã trả trong tháng</p>
                      </div>
                    </div>
                  ) : topReaders.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${r.rank === 1 ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50'}`}
                    >
                      <div className="relative">
                        <div
                          className="flex items-center justify-center rounded-full h-10 w-10 border-2 border-slate-200 bg-slate-100 overflow-hidden"
                          style={r.avatarUrl ? { backgroundImage: `url("${r.avatarUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                        >
                          {!r.avatarUrl && <span className="material-symbols-outlined text-slate-400 text-2xl" aria-hidden>person</span>}
                        </div>
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
                <Link to="/tra" className="text-sm text-primary font-medium hover:text-blue-400">Xem tất cả</Link>
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
  )
}
