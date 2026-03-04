import { useState, useEffect, useCallback } from 'react'
import { apiUrl, getApiAuth } from '@/lib/api'

type SponsorGold = { name: string; description: string; image: string; icon: string; url?: string }
type PartnerStrategic = { name: string; desc: string; image: string; url?: string }
type PartnerCommunity = { name: string; icon: string }

type DoiTacData = {
  sponsorsGold: SponsorGold[]
  partnersStrategic: PartnerStrategic[]
  partnersCommunity: PartnerCommunity[]
}

/** Trả về nhãn nút theo link (Facebook, Zalo, Telegram, hoặc "Ghé thăm Website"). */
function linkButtonLabel(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.me')) return 'Mở Facebook'
  if (u.includes('zalo.me') || u.includes('zalo.')) return 'Mở Zalo'
  if (u.includes('t.me') || u.includes('telegram')) return 'Mở Telegram'
  return 'Ghé thăm Website'
}

const DEFAULT_DATA: DoiTacData = {
  sponsorsGold: [
    { name: 'TechEdu Solutions', description: 'Đơn vị cung cấp giải pháp công nghệ giáo dục hàng đầu.', image: '', icon: 'verified', url: '' },
    { name: 'NXB Tri Thức Trẻ', description: 'Đối tác cung cấp nguồn sách bản quyền phong phú.', image: '', icon: 'school', url: '' },
  ],
  partnersStrategic: [
    { name: 'Innovation Hub', desc: 'Hỗ trợ không gian làm việc nhóm.', image: '', url: '' },
    { name: 'Coffee & Books', desc: 'Tài trợ voucher đồ uống.', image: '', url: '' },
  ],
  partnersCommunity: [
    { name: 'BookWorm', icon: 'menu_book' },
    { name: 'Global Lang', icon: 'language' },
  ],
}

export default function DoiTacContent({ canEdit = false }: { canEdit?: boolean }) {
  const [data, setData] = useState<DoiTacData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState<DoiTacData>(DEFAULT_DATA)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/doi-tac'))
      if (res.ok) {
        const json = await res.json()
        setData({
          sponsorsGold: Array.isArray(json.sponsorsGold) ? json.sponsorsGold : DEFAULT_DATA.sponsorsGold,
          partnersStrategic: Array.isArray(json.partnersStrategic) ? json.partnersStrategic : DEFAULT_DATA.partnersStrategic,
          partnersCommunity: Array.isArray(json.partnersCommunity) ? json.partnersCommunity : DEFAULT_DATA.partnersCommunity,
        })
      }
    } catch {
      setData(DEFAULT_DATA)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEdit = () => {
    setEditDraft({ ...data })
    setSaveError(null)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    setSaving(true)
    setSaveError(null)
    let accountEmail = ''
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
      if (raw) {
        const parsed = JSON.parse(raw)
        accountEmail = (parsed.accountEmail || parsed.email || '').trim()
      }
    } catch { /* ignore */ }
    try {
      const res = await fetch(apiUrl('/api/doi-tac/update'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editDraft, accountEmail }),
      })
      if (!res.ok) throw new Error('Lưu thất bại')
      setData({ ...editDraft })
      setEditOpen(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
      </div>
    )
  }

  const sponsorsGold = data.sponsorsGold || []
  const partnersStrategic = data.partnersStrategic || []
  const partnersCommunity = data.partnersCommunity || []

  return (
    <div className="flex flex-col w-full">
      {canEdit && (
        <div className="px-4 md:px-6 lg:px-8 pt-4 flex justify-end">
          <button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#137fec] hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Chỉnh sửa nội dung
          </button>
        </div>
      )}

      <div className="w-full p-4 md:p-6 lg:px-8 lg:py-8">
        <div className="min-h-[320px] flex flex-col gap-6 md:gap-8 rounded-xl items-center justify-center p-8 relative overflow-hidden bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(17, 26, 34, 0.85) 0%, rgba(17, 26, 34, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGs8XBV2fZi6e8-QthGma0tiOwZhLGAT6auFxasgCNTtR5Cq6orU94zctmvkbU-dVvsO4WpwJSgE_IK6PDLy53lootA13Z1xfUVj_F4ett8yiO8eet2DCauefjI5Of-6K6OvG9baryQiqImmosSL1g2UFDa_G9MwO7hZeLlekVvKQg_OArmlTIM3t_CBpRVGOrzpohUTC4PZHOQ1jrp0f5_N79-Vw937Hq7glszV3WhtC3l_SneUHvuX4YBhfLnQkJmN_AgJe_6c7D")' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
          <div className="flex flex-col gap-4 text-center z-10 max-w-[600px]">
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              Nhà tài trợ & Đối tác
            </h1>
            <p className="text-gray-200 text-base md:text-lg font-normal leading-relaxed">
              Cảm ơn các đơn vị đã đồng hành cùng sự phát triển của thư viện.
            </p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('doi-tac-lien-he')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="relative z-10 flex cursor-pointer items-center justify-center rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-white text-base font-bold shadow-lg shadow-primary/30"
          >
            Liên hệ tài trợ
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 lg:px-8 pb-8 md:pb-12 flex flex-col gap-10">
        <section>
          <div className="flex items-center gap-3 pb-6 pt-2">
            <div className="h-8 w-1 bg-yellow-500 rounded-full" />
            <h2 className="text-slate-900 text-[24px] font-bold leading-tight tracking-[-0.015em]">Nhà tài trợ Vàng</h2>
          </div>
          <div className="flex flex-col gap-6">
            {sponsorsGold.length === 0 ? (
              <p className="text-slate-500 text-sm">Chưa có nhà tài trợ. Nhấn &quot;Chỉnh sửa nội dung&quot; để thêm.</p>
            ) : (
              sponsorsGold.map((s) => (
                <div key={s.name} className="flex flex-col md:flex-row items-stretch justify-between gap-0 md:gap-6 rounded-xl bg-white overflow-hidden border border-slate-200 shadow-lg hover:border-yellow-500/50 transition-colors">
                  <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded bg-yellow-50 flex items-center justify-center text-yellow-600">
                          <span className="material-symbols-outlined">{s.icon || 'verified'}</span>
                        </div>
                        <h3 className="text-slate-900 text-xl font-bold leading-tight">{s.name}</h3>
                      </div>
                      <p className="text-slate-600 text-sm md:text-base font-normal leading-relaxed">{s.description}</p>
                    </div>
                    {s.url?.trim() ? (
                      <a href={s.url.trim()} target="_blank" rel="noopener noreferrer" className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-900 gap-2 text-sm font-medium w-fit transition-colors">
                        <span>{linkButtonLabel(s.url)}</span>
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </a>
                    ) : null}
                  </div>
                  {s.image ? (
                    <div className="w-full md:w-[40%] min-h-[200px] md:min-h-full relative bg-cover bg-center" style={{ backgroundImage: `url("${s.image}")` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent md:bg-gradient-to-l md:from-white/50 md:to-transparent opacity-80" />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 pb-6 pt-4 border-t border-slate-200 mt-4">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-slate-900 text-[22px] font-bold leading-tight tracking-[-0.015em]">Đối tác Chiến lược</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partnersStrategic.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-full">Chưa có đối tác chiến lược.</p>
            ) : (
              partnersStrategic.map((p) => (
                <div key={p.name} className="flex flex-col gap-4 rounded-xl bg-white p-4 border border-slate-200 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-md">
                  {p.image ? (
                    <div className="w-full aspect-video rounded-lg relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${p.image}')` }}>
                      <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-all" />
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-lg bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300">business</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <h3 className="text-slate-900 text-lg font-bold">{p.name}</h3>
                    <p className="text-slate-600 text-sm line-clamp-3">{p.desc}</p>
                  </div>
                  {p.url?.trim() ? (
                    <a href={p.url.trim()} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2">
                      Xem chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById('doi-tac-lien-he')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2"
                    >
                      Xem chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 pb-6 pt-4 border-t border-slate-200 mt-4">
            <div className="h-8 w-1 bg-gray-500 rounded-full" />
            <h2 className="text-slate-900 text-[20px] font-bold leading-tight tracking-[-0.015em]">Đối tác Cộng đồng</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {partnersCommunity.map((p) => (
              <div key={p.name} className="group flex flex-col items-center justify-center gap-2 aspect-[4/3] bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors">{p.icon || 'groups'}</span>
                <span className="text-slate-600 text-xs font-medium group-hover:text-primary transition-colors">{p.name}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => document.getElementById('doi-tac-lien-he')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="group flex flex-col items-center justify-center gap-2 aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 hover:bg-white hover:border-primary transition-all cursor-pointer w-full"
            >
              <span className="material-symbols-outlined text-3xl text-primary/70 group-hover:text-primary transition-colors">add</span>
              <span className="text-primary/70 text-xs font-medium group-hover:text-primary transition-colors text-center">Trở thành đối tác</span>
            </button>
          </div>
        </section>

        <div
          id="doi-tac-lien-he"
          className="relative overflow-hidden rounded-2xl mt-8 border border-slate-200/80 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(19, 127, 236, 0.12) 0%, rgba(19, 127, 236, 0.06) 50%, rgba(59, 130, 246, 0.1) 100%)',
          }}
        >
          {/* Nền trang trí */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
            <span className="material-symbols-outlined absolute top-6 right-8 text-6xl text-primary/10">handshake</span>
            <span className="material-symbols-outlined absolute bottom-4 left-6 text-5xl text-primary/10">volunteer_activism</span>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center ring-4 ring-primary/10">
                <span className="material-symbols-outlined text-3xl text-primary">groups</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-slate-900 text-2xl md:text-[26px] font-bold leading-tight tracking-tight">
                  Bạn muốn đồng hành cùng chúng tôi?
                </h3>
                <p className="text-slate-600 text-sm md:text-base max-w-xl leading-relaxed">
                  Hãy cùng nhau lan tỏa tri thức và tạo ra giá trị cho cộng đồng.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex-shrink-0 flex items-center justify-center gap-2 h-12 px-8 text-white text-sm font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-[0.98]"
              style={{ backgroundColor: '#137fec', boxShadow: '0 4px 20px rgba(19, 127, 236, 0.35)' }}
            >
              <span className="material-symbols-outlined text-[22px]">mail</span>
              Liên hệ ngay
            </button>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setEditOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa nội dung Nhà tài trợ & Đối tác</h2>
                <p className="text-sm text-slate-500 mt-0.5">Thêm, sửa hoặc xóa từng mục trong ba nhóm bên dưới. Nhấn &quot;Lưu&quot; để áp dụng thay đổi lên trang.</p>
              </div>
              <button type="button" onClick={() => !saving && setEditOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{saveError}</div>
              )}

              {/* Nhà tài trợ Vàng */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 bg-yellow-500 rounded-full" />
                  Nhà tài trợ Vàng
                </h3>
                <p className="text-xs text-slate-500 mb-2">Các đơn vị tài trợ chính, hiển thị nổi bật với tên, mô tả và ảnh trên trang.</p>
                <div className="space-y-3">
                  {editDraft.sponsorsGold.map((s, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
<div className="flex justify-between items-end gap-2">
                        <div className="flex-1">
                          <label htmlFor={`sponsor-name-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Tên nhà tài trợ</label>
                          <input
                            id={`sponsor-name-${i}`}
                            type="text"
                            placeholder="VD: TechEdu Solutions"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={s.name}
                            onChange={(e) => {
                              const next = [...editDraft.sponsorsGold]
                              next[i] = { ...next[i], name: e.target.value }
                              setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                            }}
                          />
                        </div>
                        <button type="button" onClick={() => setEditDraft((d) => ({ ...d, sponsorsGold: editDraft.sponsorsGold.filter((_, j) => j !== i) }))} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Xóa mục này">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                      <div>
                        <label htmlFor={`sponsor-desc-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Mô tả ngắn</label>
                        <input
                          id={`sponsor-desc-${i}`}
                          type="text"
                          placeholder="VD: Đơn vị cung cấp giải pháp công nghệ giáo dục..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={s.description}
                          onChange={(e) => {
                            const next = [...editDraft.sponsorsGold]
                            next[i] = { ...next[i], description: e.target.value }
                            setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`sponsor-image-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Link ảnh (URL)</label>
                        <div className="flex gap-2 items-stretch">
                          <input
                            id={`sponsor-image-${i}`}
                            type="text"
                            placeholder="Dán link ảnh hoặc chọn từ máy bên cạnh"
                            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={s.image}
                            onChange={(e) => {
                              const next = [...editDraft.sponsorsGold]
                              next[i] = { ...next[i], image: e.target.value }
                              setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                            }}
                          />
                          <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const { headers, accountEmail } = getApiAuth()
                              const form = new FormData()
                              form.append('file', file)
                              if (accountEmail) form.append('accountEmail', accountEmail)
                              try {
                                const res = await fetch(apiUrl('/api/upload-image'), { method: 'POST', headers, body: form })
                                if (!res.ok) throw new Error('Lỗi tải ảnh')
                                const data = await res.json()
                                if (data?.url) {
                                  const next = [...editDraft.sponsorsGold]
                                  next[i] = { ...next[i], image: data.url }
                                  setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                                }
                              } catch {
                                alert('Không thể tải ảnh lên. Thử lại hoặc dán link ảnh.')
                              }
                              e.target.value = ''
                            }}
                          />
                          <span className="material-symbols-outlined text-lg">upload_file</span>
                            <span>Chọn từ máy</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`sponsor-url-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Link (website, Facebook, Zalo, Telegram…)</label>
                        <input
                          id={`sponsor-url-${i}`}
                          type="url"
                          placeholder="VD: https://facebook.com/..., https://zalo.me/..., https://t.me/... — để trống thì nút ẩn"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={s.url ?? ''}
                          onChange={(e) => {
                            const next = [...editDraft.sponsorsGold]
                            next[i] = { ...next[i], url: e.target.value }
                            setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`sponsor-icon-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Biểu tượng (icon)</label>
                        <select
                          id={`sponsor-icon-${i}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={s.icon}
                          onChange={(e) => {
                            const next = [...editDraft.sponsorsGold]
                            next[i] = { ...next[i], icon: e.target.value }
                            setEditDraft((d) => ({ ...d, sponsorsGold: next }))
                          }}
                        >
                        <option value="verified">Huy chương (verified)</option>
                        <option value="school">Sách / Giáo dục (school)</option>
                        <option value="business">Doanh nghiệp (business)</option>
                        <option value="star">Ngôi sao (star)</option>
                        <option value="volunteer_activism">Tình nguyện (volunteer_activism)</option>
                      </select>
                    </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditDraft((d) => ({ ...d, sponsorsGold: [...d.sponsorsGold, { name: '', description: '', image: '', icon: 'verified', url: '' }] }))} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Thêm nhà tài trợ
                  </button>
                </div>
              </div>

              {/* Đối tác Chiến lược */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#137fec] rounded-full" />
                  Đối tác Chiến lược
                </h3>
                <p className="text-xs text-slate-500 mb-2">Đối tác hợp tác dài hạn, hiển thị dạng thẻ có ảnh và mô tả ngắn.</p>
                <div className="space-y-3">
                  {editDraft.partnersStrategic.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex justify-between items-end gap-2">
                        <div className="flex-1">
                          <label htmlFor={`partner-name-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Tên đối tác</label>
                          <input
                            id={`partner-name-${i}`}
                            type="text"
                            placeholder="VD: Innovation Hub"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={p.name}
                            onChange={(e) => {
                              const next = [...editDraft.partnersStrategic]
                              next[i] = { ...next[i], name: e.target.value }
                              setEditDraft((d) => ({ ...d, partnersStrategic: next }))
                            }}
                          />
                        </div>
                        <button type="button" onClick={() => setEditDraft((d) => ({ ...d, partnersStrategic: editDraft.partnersStrategic.filter((_, j) => j !== i) }))} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Xóa mục này">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                      <div>
                        <label htmlFor={`partner-desc-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Mô tả ngắn</label>
                        <input
                          id={`partner-desc-${i}`}
                          type="text"
                          placeholder="VD: Hỗ trợ không gian làm việc nhóm..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={p.desc}
                          onChange={(e) => {
                            const next = [...editDraft.partnersStrategic]
                            next[i] = { ...next[i], desc: e.target.value }
                            setEditDraft((d) => ({ ...d, partnersStrategic: next }))
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`partner-image-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Link ảnh (URL)</label>
                        <div className="flex gap-2 items-stretch">
                          <input
                            id={`partner-image-${i}`}
                            type="text"
                            placeholder="Dán link ảnh hoặc chọn từ máy bên cạnh"
                            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            value={p.image}
                            onChange={(e) => {
                              const next = [...editDraft.partnersStrategic]
                              next[i] = { ...next[i], image: e.target.value }
                              setEditDraft((d) => ({ ...d, partnersStrategic: next }))
                            }}
                          />
                          <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const { headers, accountEmail } = getApiAuth()
                              const form = new FormData()
                              form.append('file', file)
                              if (accountEmail) form.append('accountEmail', accountEmail)
                              try {
                                const res = await fetch(apiUrl('/api/upload-image'), { method: 'POST', headers, body: form })
                                if (!res.ok) throw new Error('Lỗi tải ảnh')
                                const data = await res.json()
                                if (data?.url) {
                                  const next = [...editDraft.partnersStrategic]
                                  next[i] = { ...next[i], image: data.url }
                                  setEditDraft((d) => ({ ...d, partnersStrategic: next }))
                                }
                              } catch {
                                alert('Không thể tải ảnh lên. Thử lại hoặc dán link ảnh.')
                              }
                              e.target.value = ''
                            }}
                          />
                          <span className="material-symbols-outlined text-lg">upload_file</span>
                            <span>Chọn từ máy</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`partner-url-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Link website (Xem chi tiết)</label>
                        <input
                          id={`partner-url-${i}`}
                          type="url"
                          placeholder="VD: https://example.com — để trống thì nút sẽ cuộn xuống khối Liên hệ"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={p.url ?? ''}
                          onChange={(e) => {
                            const next = [...editDraft.partnersStrategic]
                            next[i] = { ...next[i], url: e.target.value }
                            setEditDraft((d) => ({ ...d, partnersStrategic: next }))
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditDraft((d) => ({ ...d, partnersStrategic: [...d.partnersStrategic, { name: '', desc: '', image: '', url: '' }] }))} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Thêm đối tác chiến lược
                  </button>
                </div>
              </div>

              {/* Đối tác Cộng đồng */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gray-500 rounded-full" />
                  Đối tác Cộng đồng
                </h3>
                <p className="text-xs text-slate-500 mb-2">Các đối tác cộng đồng, hiển thị dạng ô nhỏ chỉ tên và icon.</p>
                <div className="space-y-3">
                  {editDraft.partnersCommunity.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex gap-3 items-end flex-wrap">
                      <div className="flex-1 min-w-[140px]">
                        <label htmlFor={`community-name-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Tên đối tác cộng đồng</label>
                        <input
                          id={`community-name-${i}`}
                          type="text"
                          placeholder="VD: BookWorm"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={p.name}
                          onChange={(e) => {
                            const next = [...editDraft.partnersCommunity]
                            next[i] = { ...next[i], name: e.target.value }
                            setEditDraft((d) => ({ ...d, partnersCommunity: next }))
                          }}
                        />
                      </div>
                      <div className="w-[180px]">
                        <label htmlFor={`community-icon-${i}`} className="block text-sm font-bold text-slate-800 mb-1.5">Biểu tượng (icon)</label>
                        <select
                          id={`community-icon-${i}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={p.icon}
                          onChange={(e) => {
                            const next = [...editDraft.partnersCommunity]
                            next[i] = { ...next[i], icon: e.target.value }
                            setEditDraft((d) => ({ ...d, partnersCommunity: next }))
                          }}
                        >
                          <option value="menu_book">Sách (menu_book)</option>
                          <option value="language">Ngôn ngữ (language)</option>
                          <option value="palette">Nghệ thuật (palette)</option>
                          <option value="science">Khoa học (science)</option>
                          <option value="sports_esports">Thể thao / Game (sports_esports)</option>
                          <option value="groups">Cộng đồng (groups)</option>
                          <option value="handshake">Đối tác (handshake)</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => setEditDraft((d) => ({ ...d, partnersCommunity: editDraft.partnersCommunity.filter((_, j) => j !== i) }))} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Xóa mục này">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditDraft((d) => ({ ...d, partnersCommunity: [...d.partnersCommunity, { name: '', icon: 'menu_book' }] }))} className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Thêm đối tác cộng đồng
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => !saving && setEditOpen(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">
                Hủy
              </button>
              <button type="button" onClick={saveEdit} disabled={saving} className="px-4 py-2.5 bg-[#137fec] text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
