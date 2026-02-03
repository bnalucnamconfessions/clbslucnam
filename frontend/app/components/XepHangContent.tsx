'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../../lib/api'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

type TopReaderApi = { id: number; name: string; bookCount: number; rank: number; avatarUrl?: string }
type StatsApi = { borrowMonth: number; activeMembers: number }
type GiftItem = { title: string; subtitle: string; imageUrl: string }
type RankingGiftsApi = { intro: string; items: GiftItem[] }

type XepHangContentProps = { timeTab?: string; onTimeTabChange?: (tab: string) => void; canEdit?: boolean }

function getCurrentUserName(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = localStorage.getItem('userInfo')
    const info = raw ? JSON.parse(raw) : {}
    return (info.fullName || info.adminName || '').trim()
  } catch {
    return ''
  }
}

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

export default function XepHangContent({ timeTab = 'Tháng này', onTimeTabChange, canEdit = false }: XepHangContentProps) {
  const [hideIdentity, setHideIdentity] = useState(false)
  const [topReaders, setTopReaders] = useState<TopReaderApi[]>([])
  const [stats, setStats] = useState<StatsApi | null>(null)
  const [gifts, setGifts] = useState<RankingGiftsApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [giftModalOpen, setGiftModalOpen] = useState(false)
  const [giftEditIntro, setGiftEditIntro] = useState('')
  const [giftEditItems, setGiftEditItems] = useState<GiftItem[]>([])
  const [giftSaving, setGiftSaving] = useState(false)
  const [giftSaveError, setGiftSaveError] = useState<string | null>(null)
  const [giftImageUploadingIndex, setGiftImageUploadingIndex] = useState<number | null>(null)

  const currentUserName = getCurrentUserName()
  const myRankEntry = currentUserName
    ? topReaders.find((r) => r.name.trim().toLowerCase() === currentUserName.trim().toLowerCase())
    : null
  const myRank = myRankEntry?.rank ?? null
  const myBooks = myRankEntry?.bookCount ?? 0
  const top20MinBooks = topReaders.length >= 20 ? topReaders[19].bookCount : topReaders[topReaders.length - 1]?.bookCount ?? 0
  const hasGoalData = topReaders.length > 0 && currentUserName
  const booksNeeded = hasGoalData && (myRank == null || myRank > 20) ? Math.max(0, top20MinBooks - myBooks) : 0
  const goalTarget = Math.max(top20MinBooks, myBooks, 1)
  const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((myBooks / goalTarget) * 100)) : 0

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [readersRes, statsRes, giftsRes] = await Promise.all([
        fetch(apiUrl('/api/dashboard/top-readers')),
        fetch(apiUrl('/api/dashboard/stats')),
        fetch(apiUrl('/api/dashboard/ranking-gifts')),
      ])
      if (!readersRes.ok) throw new Error('Lỗi tải bảng xếp hạng')
      const readers = await readersRes.json()
      setTopReaders(readers)
      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats({ borrowMonth: s.borrowMonth ?? 0, activeMembers: s.activeMembers ?? 0 })
      }
      if (giftsRes.ok) {
        const g = await giftsRes.json()
        setGifts({ intro: g.intro ?? '', items: Array.isArray(g.items) ? g.items : [] })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRefetchOnFocusAndInterval(fetchData, { intervalMs: 20 * 1000 })

  const handleRefreshRanking = async () => {
    const email = getAccountEmail()
    if (!email) {
      setRefreshError('Vui lòng đăng nhập lại.')
      return
    }
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await fetch(apiUrl('/api/dashboard/top-readers/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountEmail: email }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Cập nhật thất bại')
      }
      await fetchData()
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : 'Cập nhật thất bại')
    } finally {
      setRefreshing(false)
    }
  }

  const openGiftModal = () => {
    setGiftEditIntro(gifts?.intro ?? '')
    setGiftEditItems(gifts?.items?.length ? [...gifts.items] : [{ title: '', subtitle: '', imageUrl: '' }])
    setGiftSaveError(null)
    setGiftModalOpen(true)
  }

  const handleSaveGifts = async () => {
    const email = getAccountEmail()
    if (!email) {
      setGiftSaveError('Vui lòng đăng nhập lại.')
      return
    }
    setGiftSaving(true)
    setGiftSaveError(null)
    try {
      const res = await fetch(apiUrl('/api/dashboard/ranking-gifts/update'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountEmail: email,
          intro: giftEditIntro.trim() || undefined,
          items: giftEditItems.filter((i) => (i.title || i.subtitle || i.imageUrl)).map((i) => ({
            title: i.title.trim(),
            subtitle: i.subtitle.trim(),
            imageUrl: i.imageUrl.trim(),
          })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Lưu thất bại')
      }
      const data = await res.json()
      setGifts({ intro: data.intro ?? giftEditIntro, items: data.items ?? giftEditItems })
      setGiftModalOpen(false)
    } catch (e) {
      setGiftSaveError(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setGiftSaving(false)
    }
  }

  const addGiftItem = () => setGiftEditItems((prev) => [...prev, { title: '', subtitle: '', imageUrl: '' }])
  const removeGiftItem = (idx: number) => setGiftEditItems((prev) => prev.filter((_, i) => i !== idx))
  const updateGiftItem = (idx: number, field: keyof GiftItem, value: string) => {
    setGiftEditItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const podiumList = [topReaders[1], topReaders[0], topReaders[2]]
    .filter(Boolean)
    .map((r) => ({ rank: r.rank, name: r.name, books: r.bookCount, avatar: r.avatarUrl ?? '' }))
  const tableRows = topReaders.map((r) => ({
    rank: r.rank,
    name: r.name,
    dept: '-',
    books: r.bookCount,
    avatar: r.avatarUrl ?? '',
    anonymous: false,
  }))

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:px-8 lg:py-8">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:px-8 lg:py-8 flex justify-center">
      <div className="flex flex-col max-w-[1280px] flex-1 gap-6 w-full">
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshRanking}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#137fec' }}
            >
              <span className={`material-symbols-outlined text-[20px] ${refreshing ? 'animate-spin' : ''}`}>{refreshing ? 'progress_activity' : 'refresh'}</span>
              {refreshing ? 'Đang cập nhật...' : 'Cập nhật bảng xếp hạng'}
            </button>
            {refreshError && <p className="text-sm text-red-600 font-medium">{refreshError}</p>}
          </div>
        )}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/20 text-primary">
                  <span className="material-symbols-outlined fill-1">menu_book</span>
                </div>
                <p className="text-slate-900 text-base font-medium leading-normal">Tổng số sách đã đọc</p>
              </div>
              <p className="text-slate-900 tracking-light text-3xl font-bold leading-tight mt-2">{stats?.borrowMonth ?? 0}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-500/20 text-green-500">
                  <span className="material-symbols-outlined fill-1">group</span>
                </div>
                <p className="text-slate-900 text-base font-medium leading-normal">Độc giả tích cực</p>
              </div>
              <p className="text-slate-900 tracking-light text-3xl font-bold leading-tight mt-2">{stats?.activeMembers ?? 0}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-white border border-primary/30 relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-6 -mt-6" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 rounded-md bg-orange-500/20 text-orange-500">
                  <span className="material-symbols-outlined fill-1">emoji_events</span>
                </div>
                <p className="text-slate-900 text-base font-medium leading-normal">Hạng của bạn</p>
              </div>
              <div className="flex items-baseline gap-2 mt-2 relative z-10 flex-wrap">
                <p className="text-slate-900 tracking-light text-3xl font-bold leading-tight">
                  {myRank != null ? `#${myRank}` : '—'}
                </p>
                <span className="text-slate-500 text-sm font-medium flex items-center">
                  Chưa có dữ liệu thay đổi hạng
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-4">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex justify-center items-end gap-4 md:gap-8 min-h-[280px] pt-8 pb-4">
              {podiumList.map((r) => (
                <div
                  key={r.rank}
                  className={`flex flex-col items-center gap-3 w-1/3 max-w-[180px] ${r.rank === 1 ? 'order-2 -mt-8 relative z-10' : r.rank === 2 ? 'order-1 max-w-[160px]' : 'order-3 max-w-[160px]'}`}
                >
                  {r.rank === 1 && (
                    <span className="material-symbols-outlined text-[#FFD700] text-4xl">emoji_events</span>
                  )}
                  <div className="relative">
                    <div
                      className={`rounded-full bg-slate-200 bg-center bg-cover ${r.rank === 1 ? 'w-20 h-20 md:w-28 md:h-28 border-4 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'w-16 h-16 md:w-20 md:h-20 border-4 border-[#C0C0C0]'}`}
                      style={{ backgroundImage: r.avatar ? `url("${r.avatar}")` : undefined }}
                    />
                    <div
                      className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-slate-900 font-bold px-2 py-0.5 rounded-full shadow-lg border border-white ${r.rank === 1 ? 'bg-[#FFD700] text-sm px-3 py-1 border-2' : 'bg-[#C0C0C0] text-xs'}`}
                    >
                      #{r.rank}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-slate-900 truncate max-w-[150px] ${r.rank === 1 ? 'font-black text-base md:text-lg' : 'font-bold text-sm md:text-base'}`}>{r.name}</p>
                    <p className={r.rank === 1 ? 'text-primary text-base font-bold' : 'text-primary text-sm font-medium'}>{r.books} sách</p>
                  </div>
                  <div className={`w-full rounded-t-lg bg-gradient-to-t from-white to-transparent ${r.rank === 1 ? 'h-32' : 'h-24 opacity-80'}`} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-slate-900 font-bold text-lg">Bảng xếp hạng chi tiết</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Ẩn danh tính của tôi</span>
                  <button
                    onClick={() => setHideIdentity(!hideIdentity)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${hideIdentity ? 'bg-primary' : 'bg-slate-200 hover:bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${hideIdentity ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-sm border-b border-slate-100">
                      <th className="p-4 font-medium w-16 text-center">Hạng</th>
                      <th className="p-4 font-medium">Thành viên</th>
                      <th className="p-4 font-medium hidden sm:table-cell">Lớp</th>
                      <th className="p-4 font-medium text-right">Số sách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((row) => (
                      <tr key={row.rank} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-center font-bold text-slate-500">{row.rank}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full bg-cover bg-center bg-slate-200 ${row.anonymous ? 'grayscale opacity-70' : ''}`}
                              style={row.avatar ? { backgroundImage: `url("${row.avatar}")` } : undefined}
                            />
                            <p className={`text-slate-900 font-medium text-sm ${row.anonymous ? 'italic opacity-80' : ''}`}>{row.name}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500 hidden sm:table-cell">{row.dept}</td>
                        <td className="p-4 text-right font-bold text-slate-900">{row.books}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-100 text-center">
                <button className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">Xem thêm danh sách</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-500/20 p-2 rounded-lg text-pink-500">
                    <span className="material-symbols-outlined fill-1">card_giftcard</span>
                  </div>
                  <h2 className="text-slate-900 font-bold text-xl">Quà tặng Tháng {new Date().getMonth() + 1}</h2>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={openGiftModal}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Chỉnh sửa quà
                  </button>
                )}
              </div>
              <p className="text-slate-500 text-sm mb-6">{gifts?.intro || 'Những phần quà hấp dẫn dành riêng cho Top 3 người đọc chăm chỉ nhất tháng này.'}</p>
              <div className="flex flex-col gap-4">
                {(gifts?.items?.length ? gifts.items : [
                  { title: 'Voucher Tiki 200k', subtitle: 'Dành cho Hạng #1', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOtF31QubkOC7P9HFHTtEF8vjq_YU6ysz1Z9Aq4Ezj0xlA2iwdY1UN3VhP8bQfddL8rRyYSUNo2wLdC_gZ2ofPFa4lFgXDs4RbccKwhPQPV4pUGFC9A5KZJu6PxSy6nFkBtXDCtnv5pHjaceQYPP0zlTCze5BidfOtyF_h7jOy7lFmsBLKJBqB--5lHwuqBR3T6ojInJEp9GvnEl_8EHlBrOV8EgN94CNnMZkyPmo2ARdDW7lAMhYpoPnH0yEPPnZRYeMVBT112arq' },
                  { title: 'Túi Tote CLB', subtitle: 'Dành cho Hạng #2 & #3', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvg1085xtY4_1_KsnQSW0nFfO-ak-He21GMTL4wY82I4ew6NQcmVWRI-DH_cd1eckM7lRkw-EXTdCqIuG6PGf9auFd6jNJDM53g94xHGhOATBwE2QfxU-ge5mg8ZOzQsZNds1gTjXe3W96_Wm8AKEZFVKpDLI439SarQLBDn9A5CRLEH9Y0JTe3_9OD2FdogysA86jaym6cEkuTAgg7SG94V1DGmiohv0ovOIRRYRSGq6jhrikZFFAP9GhOLaI3dCpOoJiqJYY1vIa' },
                  { title: 'Sách Tự Chọn', subtitle: 'Bốc thăm may mắn Top 10', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGr39HK8MuZX52nNDiS09fjibC6FfjZoyTLTfN3Id1Hoyo0VSEG12TFa8CKvTTI5WA1_aTnWEkaaBs-p-a5o6US4QJgvKXwerBRRxUnLLOaRUmNHZHjkNtTBDLylxJEkRjFUh3DpJK-58DH4KVqBuRLv0E0RBuZv8PiBmWlduwxt8_9RJR3vK2oJ43Y0GDkhqDDQGp-YrsIFjQ8j1ul0Ax-Z7Yq2_v7eVcqafgdHwszGY2W-uAAaXTRUt4C7Qv6kiYA6UFBsr_yK03' },
                ]).map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="w-16 h-16 rounded-lg bg-slate-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: item.imageUrl ? `url("${item.imageUrl}")` : undefined }} />
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-slate-900 font-bold text-sm">{item.title || 'Quà'}</p>
                      <p className="text-slate-500 text-xs">{item.subtitle || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-6 w-full flex items-center justify-center h-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors">
                Xem chi tiết quy định
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              {hasGoalData ? (
                <>
                  <h3 className="text-slate-900 font-bold text-base mb-2">
                    {booksNeeded === 0 ? 'Bạn đã trong Top 20!' : 'Bạn sắp đạt mục tiêu!'}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {booksNeeded === 0
                      ? `Giữ phong độ đọc sách để nhận huy hiệu "Mọt sách Tháng".`
                      : <>Chỉ cần <strong>{booksNeeded} cuốn sách</strong> nữa để lọt vào Top 20 và nhận huy hiệu &quot;Mọt sách Tháng&quot;.</>}
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${goalPercent}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-500 mt-1">{myBooks}/{goalTarget} cuốn</p>
                </>
              ) : (
                <>
                  <h3 className="text-slate-900 font-bold text-base mb-2">Tiến độ đọc của bạn</h3>
                  <p className="text-slate-600 text-sm">Chưa có dữ liệu. Mượn sách và trả sách để cập nhật tiến độ và lọt Top 20.</p>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-slate-300 h-full w-0 rounded-full" />
                  </div>
                  <p className="text-right text-xs text-slate-500 mt-1">— cuốn</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal chỉnh sửa quà tặng */}
        {giftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !giftSaving && setGiftModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Chỉnh sửa quà tặng tháng</h3>
                <button type="button" onClick={() => !giftSaving && setGiftModalOpen(false)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Mô tả ngắn (intro)</span>
                  <textarea
                    value={giftEditIntro}
                    onChange={(e) => setGiftEditIntro(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Những phần quà hấp dẫn dành riêng cho Top 3..."
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Các phần quà</span>
                  <button type="button" onClick={addGiftItem} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm quà
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {giftEditItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500">Quà #{idx + 1}</span>
                        <button type="button" onClick={() => removeGiftItem(idx)} className="text-red-500 hover:text-red-600 p-1">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGiftItem(idx, 'title', e.target.value)}
                        placeholder="Tên quà (VD: Voucher Tiki 200k)"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={item.subtitle}
                        onChange={(e) => updateGiftItem(idx, 'subtitle', e.target.value)}
                        placeholder="Mô tả (VD: Dành cho Hạng #1)"
                        className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                      />
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-slate-500">Ảnh quà (URL hoặc tải từ máy)</span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={item.imageUrl}
                            onChange={(e) => updateGiftItem(idx, 'imageUrl', e.target.value)}
                            placeholder="URL ảnh quà"
                            className="flex-1 min-w-0 rounded border border-slate-200 px-3 py-2 text-sm"
                          />
                          <label className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer disabled:opacity-50">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="sr-only"
                              disabled={giftImageUploadingIndex !== null}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setGiftImageUploadingIndex(idx)
                                try {
                                  const form = new FormData()
                                  form.append('file', file)
                                  const res = await fetch(apiUrl('/api/upload-image'), { method: 'POST', body: form })
                                  if (!res.ok) throw new Error('Lỗi tải ảnh')
                                  const data = await res.json()
                                  if (data?.url) updateGiftItem(idx, 'imageUrl', data.url)
                                } catch {
                                  setGiftSaveError('Không thể tải ảnh lên. Thử lại hoặc dán link ảnh.')
                                } finally {
                                  setGiftImageUploadingIndex(null)
                                }
                                e.target.value = ''
                              }}
                            />
                            {giftImageUploadingIndex === idx ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-primary" />
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            )}
                            <span>{giftImageUploadingIndex === idx ? 'Đang tải...' : 'Chọn từ máy'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {giftSaveError && <p className="text-sm text-red-600">{giftSaveError}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveGifts}
                    disabled={giftSaving}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
                  >
                    {giftSaving ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Đang lưu...</> : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => !giftSaving && setGiftModalOpen(false)}
                    disabled={giftSaving}
                    className="px-4 h-10 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
