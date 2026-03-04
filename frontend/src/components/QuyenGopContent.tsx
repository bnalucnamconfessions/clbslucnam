import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api'

const PRIMARY = '#137fec'

type CampaignApi = {
  id: number | null
  title: string
  description: string
  goal: number
  bannerUrl: string | null
  startDate: string | null
  endDate: string | null
  raised: number
  supportCount: number
  topDonor: string | null
  daysLeft: number | null
}

type DonationApi = { id: number; donorName: string; amount: number; message?: string; isAnonymous?: boolean; createdAt: string | null }

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
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

const COLOR_CLASSES = ['bg-blue-100 text-[#137fec]', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600']

export default function QuyenGopContent() {
  const [campaign, setCampaign] = useState<CampaignApi | null>(null)
  const [donors, setDonors] = useState<DonationApi[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100000)
  const [customAmount, setCustomAmount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const amounts = [50000, 100000, 200000, 500000]

  const fetchData = useCallback(async () => {
    try {
      const [campRes, donRes] = await Promise.all([
        fetch(apiUrl('/api/quyen-gop/campaign')),
        fetch(apiUrl('/api/quyen-gop/donations?page=1&page_size=20')),
      ])
      if (campRes.ok) {
        const j = await campRes.json()
        setCampaign({
          id: j.id ?? null,
          title: j.title ?? 'Chung tay xây dựng thư viện tri thức',
          description: j.description ?? '',
          goal: j.goal ?? 20_000_000,
          bannerUrl: j.bannerUrl ?? null,
          startDate: j.startDate ?? null,
          endDate: j.endDate ?? null,
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
      setCampaign({
        id: null,
        title: 'Chung tay xây dựng thư viện tri thức',
        description: '',
        goal: 20_000_000,
        bannerUrl: null,
        startDate: null,
        endDate: null,
        raised: 0,
        supportCount: 0,
        topDonor: null,
        daysLeft: null,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const raised = campaign?.raised ?? 0
  const goal = campaign?.goal ?? 20_000_000
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  const daysLeft = campaign?.daysLeft ?? 0
  const supportCount = campaign?.supportCount ?? 0
  const topDonor = campaign?.topDonor ?? '—'

  const copyToClipboard = () => {
    navigator.clipboard.writeText('0908123456')
  }

  const handleSubmitDonation = async () => {
    const amt = customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) : selectedAmount
    if (!amt || amt <= 0) {
      setSubmitError('Vui lòng chọn hoặc nhập số tiền ủng hộ.')
      return
    }
    if (!anonymous && !senderName.trim()) {
      setSubmitError('Vui lòng nhập tên người gửi hoặc chọn ủng hộ ẩn danh.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      let accountEmail = ''
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
        if (raw) {
          const p = JSON.parse(raw)
          accountEmail = (p.accountEmail || p.email || '').trim()
        }
      } catch { /* ignore */ }
      const res = await fetch(apiUrl('/api/quyen-gop/donate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          donorName: senderName.trim(),
          message: message.trim(),
          anonymous,
          campaignId: campaign?.id ?? undefined,
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Gửi thất bại')
      }
      setSelectedAmount(100000)
      setCustomAmount('')
      setSenderName('')
      setMessage('')
      setAnonymous(false)
      fetchData()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Gửi thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-[1280px] mx-auto p-4 lg:p-8 flex justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: PRIMARY }}>progress_activity</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột trái - Nội dung chiến dịch */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Banner chiến dịch */}
          <div className="relative rounded-2xl overflow-hidden group shadow-lg">
            <div
              className="w-full aspect-video bg-cover bg-center"
              style={{
                backgroundImage: campaign?.bannerUrl
                  ? `url("${campaign.bannerUrl}")`
                  : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqX3zyYmvRLH6gb8NM2ZZZfWAUsb1A8m99gYYco8MQpiD0NVznL7okzb8JTGy3DphFbJBC2NrN47sbC7nowGexYeUmvsTExDcOCuVm61wDMK89ziZYWbej_V_ctd-n5qeEUsKZpfWFx1Mg9u6laT8OcTV2Ri151bpVuqwngo2v9g6-5-zRx0CNHpTZ4-wEFrHzxcoZ5siunLH0-gT8AE7GWZjOwCcfx92wemtOhqwBDM1yR_9mqhfCPsOR5MIkmuVEnydJ-hhjbEyM")',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 lg:p-10 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 text-white text-xs font-bold rounded-full uppercase tracking-wider" style={{ backgroundColor: PRIMARY }}>
                  Chiến dịch tháng 10
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-2">
                {campaign?.title ?? 'Chung tay xây dựng thư viện tri thức'}
              </h1>
              <p className="text-slate-200 text-sm lg:text-base max-w-xl">
                {campaign?.description || 'Mọi đóng góp của bạn sẽ giúp chúng tôi mua thêm sách mới, bảo trì cơ sở vật chất và tổ chức các sự kiện đọc sách ý nghĩa cho cộng đồng.'}
              </p>
            </div>
          </div>

          {/* Tiến độ gây quỹ */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex gap-6 justify-between items-end">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tiến độ gây quỹ</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl lg:text-3xl font-bold text-slate-900">
                      {new Intl.NumberFormat('vi-VN').format(raised)}đ
                    </span>
                    <span className="text-slate-500 text-sm">/ {new Intl.NumberFormat('vi-VN').format(goal)}đ mục tiêu</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end font-bold text-xl" style={{ color: PRIMARY }}>
                    {percent}%
                  </div>
                  <p className="text-slate-400 text-xs">Còn {daysLeft} ngày</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5">
                <div
                  className="h-3.5 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${percent}%`, backgroundColor: PRIMARY }}
                >
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white rounded-full shadow-md border-2"
                    style={{ borderColor: PRIMARY }}
                  />
                </div>
              </div>
              <div className="flex gap-8 pt-4 border-t border-slate-50 mt-2">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">{supportCount}</span>
                  <span className="text-xs text-slate-400 font-medium">Lượt ủng hộ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">Top 1</span>
                  <span className="text-xs text-slate-400 font-medium">{topDonor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minh bạch chi tiêu */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-slate-900">
              <span className="material-symbols-outlined" style={{ color: PRIMARY }}>verified</span>
              Minh bạch chi tiêu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3" style={{ color: PRIMARY }}>
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Mua sách mới</h4>
                <p className="text-xs text-slate-500 leading-relaxed">60% ngân sách dùng để cập nhật các đầu sách mới mỗi tháng.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-green-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3">
                  <span className="material-symbols-outlined">build</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Bảo trì cơ sở</h4>
                <p className="text-xs text-slate-500 leading-relaxed">30% dùng để sửa chữa bàn ghế, đèn và máy lạnh.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Sự kiện</h4>
                <p className="text-xs text-slate-500 leading-relaxed">10% hỗ trợ tổ chức các buổi workshop đọc sách.</p>
              </div>
            </div>
          </div>

          {/* Danh sách tấm lòng vàng */}
          <div>
            <h3 className="text-xl font-bold mb-4 px-1 text-slate-900">Danh sách tấm lòng vàng</h3>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
                    {donors.map((d, idx) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${COLOR_CLASSES[idx % COLOR_CLASSES.length]}`}>
                              {getInitials(d.donorName)}
                            </div>
                            <span className="font-medium text-slate-900">{d.donorName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold" style={{ color: PRIMARY }}>{new Intl.NumberFormat('vi-VN').format(d.amount)}đ</td>
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
                <button type="button" className="text-sm font-bold hover:underline" style={{ color: PRIMARY }}>
                  Xem tất cả người ủng hộ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải - Form ủng hộ */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700">Chọn mức ủng hộ</label>
                <div className="grid grid-cols-2 gap-3">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`flex h-11 items-center justify-center rounded-lg border-2 transition-all shadow-sm relative ${
                        selectedAmount === amt
                          ? 'bg-blue-50 border-[#137fec] text-[#137fec] font-bold'
                          : 'border border-slate-200 bg-white hover:border-[#137fec] hover:text-[#137fec] hover:bg-blue-50 font-semibold'
                      }`}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                    >
                      <span className="text-sm">{new Intl.NumberFormat('vi-VN').format(amt)}đ</span>
                      {amt === 100000 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md">
                          HOT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">VNĐ</span>
                  <input
                    type="number"
                    className="w-full h-12 pl-14 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none text-slate-900 font-bold transition-all placeholder:font-normal"
                    placeholder="Nhập số tiền khác"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Thông tin người gửi</label>
                  <input
                    type="text"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none text-sm transition-all"
                    placeholder="Họ và tên của bạn"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <textarea
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none text-sm resize-none transition-all"
                    placeholder="Lời nhắn gửi đến thư viện (tùy chọn)"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 focus:ring-[#137fec]"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 group-hover:text-[#137fec] transition-colors font-medium">
                    Tôi muốn ủng hộ ẩn danh
                  </span>
                </label>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center gap-4 text-center">
                <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full text-slate-900 fill-current" viewBox="0 0 100 100">
                    <path d="M10 10h20v20h-20z M40 10h10v10h-10z M60 10h10v10h-10z M80 10h10v10h-10z M10 40h10v10h-10z M30 40h40v40h-40z M80 40h10v10h-10z M10 60h10v10h-10z M80 60h10v10h-10z M10 80h20v10h-20z M80 80h10v10h-10z" opacity="0.1" />
                    <rect fill="black" height="30" width="30" x="10" y="10" />
                    <rect fill="black" height="30" width="30" x="60" y="10" />
                    <rect fill="black" height="30" width="30" x="10" y="60" />
                    <rect fill="white" height="20" width="20" x="15" y="15" />
                    <rect fill="white" height="20" width="20" x="65" y="15" />
                    <rect fill="white" height="20" width="20" x="15" y="65" />
                    <rect fill="black" height="10" width="10" x="20" y="20" />
                    <rect fill="black" height="10" width="10" x="70" y="20" />
                    <rect fill="black" height="10" width="10" x="20" y="70" />
                    <rect fill="black" height="10" width="10" x="50" y="50" />
                    <rect fill="black" height="10" width="10" x="60" y="60" />
                    <rect fill="black" height="10" width="10" x="80" y="80" />
                  </svg>
                </div>
                <div className="flex flex-col w-full text-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em]">Ngân hàng MB Bank</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-xl font-bold font-mono tracking-wider text-slate-900">0908 123 456</p>
                    <button
                      type="button"
                      className="text-slate-300 hover:text-[#137fec] transition-colors"
                      title="Sao chép"
                      onClick={copyToClipboard}
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </div>
                  <p className="text-sm font-bold mt-1 text-slate-600">QUY KHUYEN HOC CLB</p>
                </div>
              </div>
              {submitError && (
                <p className="text-sm text-red-600 font-medium">{submitError}</p>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitDonation}
                className="w-full h-12 bg-[#137fec] hover:bg-[#0f6fd6] disabled:opacity-70 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận đã chuyển khoản</span>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-400 font-medium">
                Mọi đóng góp đều được ghi nhận và công khai minh bạch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
