'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../../lib/api'

const PRIMARY = '#137fec'

type DonationApi = { id: number; donorName: string; amount: number; message?: string; isAnonymous?: boolean; createdAt: string | null }

type CampaignApi = {
  id: number | null
  title: string
  description: string
  goal: number
  bannerUrl: string | null
  startDate: string | null
  endDate: string | null
  isActive?: boolean
  raised: number
  supportCount: number
  topDonor: string | null
  daysLeft: number | null
}

const defaultCampaign: CampaignApi = {
  id: null,
  title: 'Chung tay xây dựng thư viện tri thức',
  description: '',
  goal: 20_000_000,
  bannerUrl: null,
  startDate: null,
  endDate: null,
  isActive: true,
  raised: 0,
  supportCount: 0,
  topDonor: null,
  daysLeft: null,
}

type QuyenGopDashboardContentProps = { canEdit?: boolean }

function getAccountEmail(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = localStorage.getItem('userInfo')
    const info = raw ? JSON.parse(raw) : {}
    return (info.email || info.accountEmail || '').trim()
  } catch {
    return ''
  }
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  return d.toLocaleDateString('vi-VN')
}

export default function QuyenGopDashboardContent({ canEdit = false }: QuyenGopDashboardContentProps) {
  const [campaign, setCampaign] = useState<CampaignApi>(defaultCampaign)
  const [donors, setDonors] = useState<DonationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null)
  const [form, setForm] = useState({ title: '', description: '', goal: 20000000, startDate: '', endDate: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    try {
      const [campRes, donRes] = await Promise.all([
        fetch(apiUrl('/api/quyen-gop/campaign')),
        fetch(apiUrl('/api/quyen-gop/donations?page=1&page_size=20')),
      ])
      if (campRes.ok) {
        const j = await campRes.json()
        setCampaign({
          id: j.id ?? null,
          title: j.title ?? defaultCampaign.title,
          description: j.description ?? '',
          goal: j.goal ?? defaultCampaign.goal,
          bannerUrl: j.bannerUrl ?? null,
          startDate: j.startDate ?? null,
          endDate: j.endDate ?? null,
          isActive: j.isActive !== false,
          raised: j.raised ?? 0,
          supportCount: j.supportCount ?? 0,
          topDonor: j.topDonor ?? null,
          daysLeft: j.daysLeft ?? null,
        })
      }
      if (donRes.ok) {
        const d = await donRes.json()
        setDonors(d.results ?? [])
      }
    } catch {
      setCampaign(defaultCampaign)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const openEdit = () => {
    setForm({
      title: campaign.title,
      description: campaign.description,
      goal: campaign.goal,
      startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
      endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
      isActive: campaign.isActive !== false,
    })
    setSaveError(null)
    setModalMode('edit')
  }

  const openCreate = () => {
    setForm({
      title: 'Chiến dịch quyên góp mới',
      description: '',
      goal: 20000000,
      startDate: '',
      endDate: '',
      isActive: true,
    })
    setSaveError(null)
    setModalMode('create')
  }

  const saveEdit = async () => {
    if (campaign.id == null) return
    setSaving(true)
    setSaveError(null)
    const email = getAccountEmail()
    if (!email) {
      setSaveError('Vui lòng đăng nhập lại.')
      setSaving(false)
      return
    }
    try {
      const res = await fetch(apiUrl(`/api/quyen-gop/campaign/${campaign.id}/update`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          goal: form.goal,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          isActive: form.isActive,
          accountEmail: email,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Lưu thất bại')
      }
      setModalMode(null)
      fetchCampaign()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const saveCreate = async () => {
    setSaving(true)
    setSaveError(null)
    const email = getAccountEmail()
    if (!email) {
      setSaveError('Vui lòng đăng nhập lại.')
      setSaving(false)
      return
    }
    try {
      const res = await fetch(apiUrl('/api/quyen-gop/campaign/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          goal: form.goal,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          isActive: form.isActive,
          accountEmail: email,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Tạo thất bại')
      }
      setModalMode(null)
      fetchCampaign()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Tạo thất bại')
    } finally {
      setSaving(false)
    }
  }

  const raised = campaign.raised
  const goal = campaign.goal
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  const supportCount = campaign.supportCount

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: PRIMARY }}>progress_activity</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Chỉnh sửa chiến dịch
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Tạo chiến dịch mới
          </button>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setModalMode(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {modalMode === 'edit' ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Tiêu đề chiến dịch"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn (tùy chọn)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mục tiêu (VNĐ)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  value={form.goal || ''}
                  onChange={e => setForm(f => ({ ...f, goal: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="20000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Chiến dịch đang hoạt động</span>
              </label>
            </div>
            {saveError && (
              <p className="mt-3 text-sm text-red-600 font-medium">{saveError}</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !saving && setModalMode(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={modalMode === 'edit' ? saveEdit : saveCreate}
                className="px-4 py-2 text-white font-bold rounded-lg disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                {saving ? 'Đang lưu...' : modalMode === 'edit' ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đã gây quỹ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(raised)}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mục tiêu</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(goal)}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tiến độ</p>
          <p className="text-2xl font-bold text-[#137fec] mt-1">{percent}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lượt ủng hộ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{supportCount}</p>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tiến độ {campaign.title}</h3>
        <div className="w-full bg-slate-100 rounded-full h-3.5">
          <div
            className="h-3.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percent}%`, backgroundColor: PRIMARY }}
          />
        </div>
        <p className="text-slate-500 text-sm mt-2">
          {campaign.daysLeft != null ? `Còn ${campaign.daysLeft} ngày` : ''}
          {campaign.topDonor ? ` • Top 1: ${campaign.topDonor}` : ''}
          {!campaign.daysLeft && !campaign.topDonor ? '—' : ''}
        </p>
      </div>

      {/* Danh sách đóng góp gần đây */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Đóng góp gần đây</h3>
          <p className="text-slate-500 text-sm">Danh sách người ủng hộ trong khu vực quản trị.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Người ủng hộ</th>
                <th className="px-6 py-4 font-semibold">Số tiền</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{d.donorName}</td>
                  <td className="px-6 py-4 font-bold text-[#137fec]">
                    {new Intl.NumberFormat('vi-VN').format(d.amount)}đ
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatTimeAgo(d.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <span className="material-symbols-outlined text-[14px]">check</span> Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-center border-t border-slate-50 bg-slate-50/30">
          <a
            href="/quyen-gop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-[#137fec] hover:underline"
          >
            Xem trang Quyên góp công khai →
          </a>
        </div>
      </div>
    </div>
  )
}
