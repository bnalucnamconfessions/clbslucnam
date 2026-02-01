'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../../lib/api'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'

type TopReaderApi = { id: number; name: string; bookCount: number; rank: number; avatarUrl?: string }
type StatsApi = { borrowMonth: number; activeMembers: number }

type XepHangContentProps = { timeTab?: string; onTimeTabChange?: (tab: string) => void }

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

export default function XepHangContent({ timeTab = 'Tháng này', onTimeTabChange }: XepHangContentProps) {
  const [hideIdentity, setHideIdentity] = useState(false)
  const [topReaders, setTopReaders] = useState<TopReaderApi[]>([])
  const [stats, setStats] = useState<StatsApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const [readersRes, statsRes] = await Promise.all([
        fetch(apiUrl('/api/dashboard/top-readers')),
        fetch(apiUrl('/api/dashboard/stats')),
      ])
      if (!readersRes.ok) throw new Error('Lỗi tải bảng xếp hạng')
      const readers = await readersRes.json()
      setTopReaders(readers)
      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats({ borrowMonth: s.borrowMonth ?? 0, activeMembers: s.activeMembers ?? 0 })
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

  useRefetchOnFocusAndInterval(fetchData, { intervalMs: 60 * 1000 })

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
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-pink-500/20 p-2 rounded-lg text-pink-500">
                  <span className="material-symbols-outlined fill-1">card_giftcard</span>
                </div>
                <h2 className="text-slate-900 font-bold text-xl">Quà tặng Tháng {new Date().getMonth() + 1}</h2>
              </div>
              <p className="text-slate-500 text-sm mb-6">Những phần quà hấp dẫn dành riêng cho Top 3 người đọc chăm chỉ nhất tháng này.</p>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="w-16 h-16 rounded-lg bg-slate-200 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBOtF31QubkOC7P9HFHTtEF8vjq_YU6ysz1Z9Aq4Ezj0xlA2iwdY1UN3VhP8bQfddL8rRyYSUNo2wLdC_gZ2ofPFa4lFgXDs4RbccKwhPQPV4pUGFC9A5KZJu6PxSy6nFkBtXDCtnv5pHjaceQYPP0zlTCze5BidfOtyF_h7jOy7lFmsBLKJBqB--5lHwuqBR3T6ojInJEp9GvnEl_8EHlBrOV8EgN94CNnMZkyPmo2ARdDW7lAMhYpoPnH0yEPPnZRYeMVBT112arq")', backgroundSize: 'cover' }} />
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 font-bold text-sm">Voucher Tiki 200k</p>
                    <p className="text-slate-500 text-xs">Dành cho Hạng #1</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="w-16 h-16 rounded-lg bg-slate-200 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDvg1085xtY4_1_KsnQSW0nFfO-ak-He21GMTL4wY82I4ew6NQcmVWRI-DH_cd1eckM7lRkw-EXTdCqIuG6PGf9auFd6jNJDM53g94xHGhOATBwE2QfxU-ge5mg8ZOzQsZNds1gTjXe3W96_Wm8AKEZFVKpDLI439SarQLBDn9A5CRLEH9Y0JTe3_9OD2FdogysA86jaym6cEkuTAgg7SG94V1DGmiohv0ovOIRRYRSGq6jhrikZFFAP9GhOLaI3dCpOoJiqJYY1vIa")', backgroundSize: 'cover' }} />
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 font-bold text-sm">Túi Tote CLB</p>
                    <p className="text-slate-500 text-xs">Dành cho Hạng #2 & #3</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="w-16 h-16 rounded-lg bg-slate-200 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAGr39HK8MuZX52nNDiS09fjibC6FfjZoyTLTfN3Id1Hoyo0VSEG12TFa8CKvTTI5WA1_aTnWEkaaBs-p-a5o6US4QJgvKXwerBRRxUnLLOaRUmNHZHjkNtTBDLylxJEkRjFUh3DpJK-58DH4KVqBuRLv0E0RBuZv8PiBmWlduwxt8_9RJR3vK2oJ43Y0GDkhqDDQGp-YrsIFjQ8j1ul0Ax-Z7Yq2_v7eVcqafgdHwszGY2W-uAAaXTRUt4C7Qv6kiYA6UFBsr_yK03")', backgroundSize: 'cover' }} />
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 font-bold text-sm">Sách Tự Chọn</p>
                    <p className="text-slate-500 text-xs">Bốc thăm may mắn Top 10</p>
                  </div>
                </div>
              </div>
              <button className="mt-6 w-full flex items-center justify-center h-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors">
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
      </div>
    </div>
  )
}
