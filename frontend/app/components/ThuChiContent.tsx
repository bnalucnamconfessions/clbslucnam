'use client'

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import { apiUrl } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'
import { canAddFinanceTransaction, canApproveFinance } from '../../lib/permissions'

export type ThuChiContentRef = { exportReport: () => Promise<void> }

type FundStats = {
  totalBalance: number
  totalIncomeMonth: number
  totalExpenseMonth: number
  pendingCount: number
}

type FundTransaction = {
  id: number
  transactionDate: string
  content: string
  type: 'income' | 'expense'
  amount: number
  requesterName: string
  requesterAvatarUrl?: string | null
  requesterEmail?: string | null
  status: 'pending' | 'confirmed'
}

type ListResponse = {
  results: FundTransaction[]
  total: number
  page: number
  pageSize: number
}

const PAGE_SIZE = 10
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function formatDate(s: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const EXPORT_PAGE_SIZE = 10000

/** Chuẩn hóa tên để so sánh: bỏ dấu, lowercase, gộp khoảng trắng (tránh "Nguyễn" vs "Nguyen" không khớp). */
function normalizeNameForCompare(name: string): string {
  const s = (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const ThuChiContent = forwardRef<ThuChiContentRef, object>(function ThuChiContent(_, ref) {
  const [stats, setStats] = useState<FundStats | null>(null)
  const [list, setList] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [page, setPage] = useState(1)
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [canAddTransaction, setCanAddTransaction] = useState<boolean>(false)
  const [canApprove, setCanApprove] = useState<boolean>(false)
  const [currentUserFullName, setCurrentUserFullName] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [form, setForm] = useState({
    content: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    requesterName: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  })
  const [submitting, setSubmitting] = useState(false)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  const monthParam = getMonthParam(selectedYear, selectedMonth)
  const exportMonthParamRef = useRef(monthParam)
  const exportSearchRef = useRef(searchDebounced)
  exportMonthParamRef.current = monthParam
  exportSearchRef.current = searchDebounced

  const loadUserPermissionAndName = useCallback(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
      const adminName = typeof window !== 'undefined' ? localStorage.getItem('adminName') : ''
      if (raw) {
        const p = JSON.parse(raw)
        const perm = p?.clubPermission || ''
        setCanAddTransaction(canAddFinanceTransaction(perm))
        setCanApprove(canApproveFinance(perm))
        setCurrentUserFullName((p?.fullName || adminName || '').trim())
        setCurrentUserEmail((p?.accountEmail || p?.email || '').trim().toLowerCase())
      } else if (adminName) {
        setCurrentUserFullName(adminName.trim())
      }
    } catch {
      setCanAddTransaction(false)
      setCanApprove(false)
    }
  }, [])

  useEffect(() => {
    loadUserPermissionAndName()
  }, [loadUserPermissionAndName])

  useEffect(() => {
    const handler = () => loadUserPermissionAndName()
    window.addEventListener('userInfoUpdated', handler)
    return () => window.removeEventListener('userInfoUpdated', handler)
  }, [loadUserPermissionAndName])

  /** Người tạo giao dịch không được duyệt chính giao dịch đó — so sánh theo email tài khoản (hoặc fallback theo tên). */
  const isCreatorOfTransaction = (row: FundTransaction): boolean => {
    const reqEmail = (row.requesterEmail ?? '').trim().toLowerCase()
    const curEmail = (currentUserEmail ?? '').trim().toLowerCase()
    if (reqEmail && curEmail) return reqEmail === curEmail
    const a = normalizeNameForCompare(currentUserFullName)
    const b = normalizeNameForCompare(row.requesterName ?? '')
    return !!(a && b && a === b)
  }
  /** Chỉ hiện nút duyệt khi user không phải tài khoản tạo giao dịch (theo email hoặc tên). */
  const canShowApproveButton = (row: FundTransaction) => !isCreatorOfTransaction(row)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/fund/stats'))
      if (!res.ok) throw new Error('Lỗi tải thống kê')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchList = useCallback(async () => {
    setListLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', monthParam)
      params.set('page', String(page))
      params.set('page_size', String(PAGE_SIZE))
      if (searchDebounced) params.set('search', searchDebounced)
      const res = await fetch(apiUrl(`/api/fund/transactions?${params}`))
      if (!res.ok) throw new Error('Lỗi tải danh sách')
      const data = await res.json()
      setList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setListLoading(false)
    }
  }, [monthParam, page, searchDebounced])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useRefetchOnFocusAndInterval(() => {
    fetchStats()
    fetchList()
  }, { intervalMs: 20 * 1000 })

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.content.trim() || !form.requesterName.trim()) {
      alert('Vui lòng nhập nội dung và người yêu cầu.')
      return
    }
    const amount = parseInt(form.amount.replace(/\D/g, ''), 10)
    if (!amount || amount <= 0) {
      alert('Số tiền không hợp lệ.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/fund/transactions/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: form.content.trim(),
          type: form.type,
          amount,
          requesterName: form.requesterName.trim(),
          transactionDate: form.transactionDate,
          createdByEmail: (currentUserEmail || '').trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Tạo giao dịch thất bại')
      }
      logActivity('Tạo giao dịch thu chi', `Nội dung: ${form.content.trim()} | ${form.type === 'income' ? 'Thu' : 'Chi'} ${formatVND(amount)} | Người yêu cầu: ${form.requesterName.trim()} | Ngày: ${form.transactionDate}`)
      setModalOpen(false)
      setForm({ content: '', type: 'expense', amount: '', requesterName: '', transactionDate: new Date().toISOString().slice(0, 10) })
      fetchStats()
      fetchList()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmStatus = async (id: number, status: 'pending' | 'confirmed') => {
    setConfirmingId(id)
    try {
      const res = await fetch(apiUrl(`/api/fund/transactions/${id}/update`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Cập nhật thất bại')
      const row = list?.results?.find((r) => r.id === id)
      const details = row
        ? `Nội dung: ${row.content} | ${row.type === 'income' ? 'Thu' : 'Chi'} ${formatVND(row.amount)} | Người yêu cầu: ${row.requesterName} | Trạng thái: ${status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}`
        : `Trạng thái: ${status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}`
      logActivity('Cập nhật giao dịch thu chi', details)
      fetchStats()
      fetchList()
      setDetailId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi')
    } finally {
      setConfirmingId(null)
    }
  }

  const exportReport = useCallback(async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.set('month', exportMonthParamRef.current)
      params.set('page', '1')
      params.set('page_size', String(EXPORT_PAGE_SIZE))
      if (exportSearchRef.current) params.set('search', exportSearchRef.current)
      const res = await fetch(apiUrl(`/api/fund/transactions?${params}`))
      if (!res.ok) throw new Error('Không tải được dữ liệu để xuất')
      const data = await res.json()
      const rows = (data.results || []) as FundTransaction[]
      const headers = ['Ngày', 'Nội dung', 'Loại', 'Số tiền', 'Người yêu cầu', 'Trạng thái']
      const lines = [headers.map(escapeCsvCell).join(',')]
      for (const r of rows) {
        const dateStr = r.transactionDate ? formatDate(r.transactionDate) : ''
        const typeLabel = r.type === 'income' ? 'Thu' : 'Chi'
        const amountStr = r.type === 'income' ? `+${r.amount}` : `-${r.amount}`
        const statusLabel = r.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'
        lines.push([
          dateStr,
          r.content || '',
          typeLabel,
          amountStr,
          r.requesterName || '',
          statusLabel,
        ].map(escapeCsvCell).join(','))
      }
      const csv = '\uFEFF' + lines.join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thu-chi-${exportMonthParamRef.current}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xuất báo cáo thất bại')
    } finally {
      setExporting(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({ exportReport }), [exportReport])

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 lg:py-8">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-sm font-medium">Tổng quỹ hiện tại</p>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <span className="material-symbols-outlined text-[20px] fill-1">account_balance_wallet</span>
              </div>
            </div>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">{stats ? formatVND(stats.totalBalance) : '0 ₫'}</p>
            <p className="text-emerald-600 text-xs font-medium flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Tổng thu trừ tổng chi (đã xác nhận)
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-sm font-medium">Tổng thu (Tháng)</p>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <span className="material-symbols-outlined text-[20px] fill-1">arrow_downward</span>
              </div>
            </div>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">+{stats ? formatVND(stats.totalIncomeMonth) : '0 ₫'}</p>
            <p className="text-emerald-600 text-xs font-medium mt-1">Thu trong tháng</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-sm font-medium">Tổng chi (Tháng)</p>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <span className="material-symbols-outlined text-[20px] fill-1">arrow_upward</span>
              </div>
            </div>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">-{stats ? formatVND(stats.totalExpenseMonth) : '0 ₫'}</p>
            <p className="text-rose-600 text-xs font-medium mt-1">Chi trong tháng</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 text-sm font-medium">Đơn chờ duyệt</p>
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <span className="material-symbols-outlined text-[20px] fill-1">pending_actions</span>
              </div>
            </div>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">{stats?.pendingCount ?? 0} Yêu cầu</p>
            <p className="text-slate-400 text-xs font-medium mt-1">Cần xử lý ngay</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all"
            placeholder="Tìm kiếm nội dung, người yêu cầu..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm whitespace-nowrap shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            {MONTH_NAMES[selectedMonth - 1]}, {selectedYear}
          </div>
          <select
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm shadow-sm"
            value={monthParam}
            onChange={(e) => {
              const v = e.target.value
              const [y, m] = v.split('-').map(Number)
              setSelectedYear(y)
              setSelectedMonth(m)
              setPage(1)
            }}
          >
            {(() => {
              const opts: { value: string; label: string }[] = []
              for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
                for (let m = 12; m >= 1; m--) {
                  opts.push({ value: getMonthParam(y, m), label: `${MONTH_NAMES[m - 1]}, ${y}` })
                }
              }
              return opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
            })()}
          </select>
          {canAddTransaction && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#137fec] hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap ml-auto md:ml-0"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Thêm giao dịch
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Ngày</th>
                <th className="px-6 py-4 whitespace-nowrap">Nội dung</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Loại</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Số tiền</th>
                <th className="px-6 py-4 whitespace-nowrap">Người yêu cầu</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-3xl text-[#137fec]">progress_activity</span>
                  </td>
                </tr>
              ) : !list?.results?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Chưa có giao dịch nào. Nhấn &quot;Thêm giao dịch&quot; để tạo.
                  </td>
                </tr>
              ) : (
                list.results.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{formatDate(row.transactionDate)}</td>
                    <td className="px-6 py-4 text-slate-900 text-sm font-medium">{row.content}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${row.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {row.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm whitespace-nowrap ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.type === 'income' ? '+' : '-'}{formatVND(row.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {row.requesterName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${row.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'confirmed' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        {row.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(row.id)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        {Boolean(canApprove) && row.status === 'pending' && canShowApproveButton(row) && (
                          <button
                            type="button"
                            onClick={() => handleConfirmStatus(row.id, 'confirmed')}
                            disabled={confirmingId === row.id}
                            className="p-1.5 rounded hover:bg-[#137fec]/10 text-[#137fec] transition-colors disabled:opacity-50"
                            title="Xác nhận"
                          >
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {list && list.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Hiển thị <span className="font-bold text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> đến{' '}
              <span className="font-bold text-slate-900">{Math.min(page * PAGE_SIZE, list.total)}</span> trong tổng số{' '}
              <span className="font-bold text-slate-900">{list.total}</span> giao dịch
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = page
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1
                  else if (page >= totalPages - 2) p = totalPages - 4 + i
                  else p = page - 2 + i
                } else p = i + 1
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`p-1 rounded-md text-xs w-7 h-7 font-medium transition-colors ${page === p ? 'bg-[#137fec] text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'}`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {detailId != null && (() => {
        const row = list?.results?.find((r) => r.id === detailId)
        if (!row) return null
        const isThu = row.type === 'income'
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setDetailId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/80"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header với màu theo loại Thu/Chi */}
              <div className={`px-6 py-4 flex items-center justify-between ${isThu ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-rose-50 border-b border-rose-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isThu ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                    <span className="material-symbols-outlined text-[24px] fill-1">{isThu ? 'arrow_downward' : 'arrow_upward'}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Chi tiết giao dịch</h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(row.transactionDate)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailId(null)}
                  className="p-2 rounded-lg hover:bg-white/80 text-slate-500 hover:text-slate-700 transition-colors"
                  title="Đóng"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Số tiền nổi bật */}
                <div className={`rounded-xl p-4 text-center ${isThu ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Số tiền</p>
                  <p className={`text-2xl font-black tracking-tight ${isThu ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isThu ? '+' : '-'}{formatVND(row.amount)}
                  </p>
                </div>

                {/* Nội dung */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nội dung</p>
                  <p className="text-slate-900 font-medium leading-snug">{row.content}</p>
                </div>

                {/* Người yêu cầu với avatar */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="w-10 h-10 rounded-full bg-[#137fec] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {row.requesterName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người yêu cầu</p>
                    <p className="text-slate-900 font-medium">{row.requesterName}</p>
                  </div>
                </div>

                {/* Loại + Trạng thái trên một hàng */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Loại</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${isThu ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {isThu ? 'Thu' : 'Chi'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${row.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {row.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                {Boolean(canApprove) && row.status === 'pending' && canShowApproveButton(row) && (
                  <button
                    type="button"
                    onClick={() => { handleConfirmStatus(row.id, 'confirmed'); setDetailId(null); }}
                    disabled={confirmingId === row.id}
                    className="px-4 py-2.5 bg-[#137fec] text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Xác nhận
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailId(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-white hover:border-slate-300 transition-colors bg-white"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Thêm giao dịch</h2>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
                >
                  <option value="income">Thu</option>
                  <option value="expense">Chi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="VD: Mua sách mới tháng 10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))}
                  placeholder="500000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Người yêu cầu</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={form.requesterName}
                  onChange={(e) => setForm((f) => ({ ...f, requesterName: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giao dịch</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={form.transactionDate}
                  onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => !submitting && setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo giao dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

export default ThuChiContent
