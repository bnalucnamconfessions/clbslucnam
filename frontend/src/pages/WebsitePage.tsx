import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import { canEditCaiDat } from '@/lib/permissions'
import { apiUrl, getApiAuth } from '@/lib/api'

type WebsiteConfig = {
  siteName: string
  logoUrl: string
  contactEmail: string
  footerText: string
}

const DEFAULT_CONFIG: WebsiteConfig = {
  siteName: 'CLB Sách và Hành động THPT Lục Nam',
  logoUrl: '',
  contactEmail: '',
  footerText: '',
}

export default function WebsitePage() {
  const navigate = useNavigate()
  const [canEdit, setCanEdit] = useState(false)
  const [config, setConfig] = useState<WebsiteConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('userInfo')
      const info = raw ? JSON.parse(raw) : {}
      const edit = canEditCaiDat(info.clubPermission || '')
      setCanEdit(edit)
      if (!edit) {
        navigate('/dashboard', { replace: true })
        return
      }
    } catch {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [navigate])

  useEffect(() => {
    if (!canEdit) return
    let cancelled = false
    setLoading(true)
    fetch(apiUrl('/api/website-config'), { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : DEFAULT_CONFIG))
      .then((data) => {
        if (!cancelled) {
          setConfig({
            siteName: data.siteName ?? DEFAULT_CONFIG.siteName,
            logoUrl: data.logoUrl ?? DEFAULT_CONFIG.logoUrl,
            contactEmail: data.contactEmail ?? DEFAULT_CONFIG.contactEmail,
            footerText: data.footerText ?? DEFAULT_CONFIG.footerText,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setConfig(DEFAULT_CONFIG)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [canEdit])

  const handleSave = async () => {
    const { headers, accountEmail } = getApiAuth()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(apiUrl('/api/website-config/update'), {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountEmail: accountEmail || undefined,
          siteName: config.siteName.trim(),
          logoUrl: config.logoUrl.trim(),
          contactEmail: config.contactEmail.trim(),
          footerText: config.footerText.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Lưu thất bại')
      }
      setMessage({ type: 'success', text: 'Đã lưu cấu hình website.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi lưu.' })
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) return null

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Cài đặt</h2>
              <p className="text-slate-500 text-base font-normal leading-normal">Chỉ Ban chủ nhiệm có quyền chỉnh sửa tên website, logo, liên hệ và chân trang.</p>
            </div>
          </header>
          <div className="px-4 md:px-6 lg:px-8 py-6 w-full">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
              <span className="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#137fec] text-white shadow-sm">Cấu hình website</span>
              <Link to="/dashboard/cai-dat/quy-tac-muon" className="px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-600 hover:bg-slate-100">Quy tắc mượn sách</Link>
            </div>
            <div className="max-w-2xl">
              {message && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{message.text}</div>
              )}
              {loading ? (
                <p className="text-slate-500">Đang tải...</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên website / CLB</label>
                    <input type="text" value={config.siteName} onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] outline-none" placeholder="VD: CLB Sách và Hành động THPT Lục Nam" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL logo (tùy chọn)</label>
                    <input type="url" value={config.logoUrl} onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email liên hệ (tùy chọn)</label>
                    <input type="email" value={config.contactEmail} onChange={(e) => setConfig((c) => ({ ...c, contactEmail: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] outline-none" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung chân trang (tùy chọn)</label>
                    <textarea value={config.footerText} onChange={(e) => setConfig((c) => ({ ...c, footerText: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] outline-none resize-y" placeholder="Văn bản hiển thị ở chân trang" />
                  </div>
                  <div className="pt-2">
                    <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-[#137fec] text-white font-medium rounded-lg hover:bg-[#0d6bd4] disabled:opacity-60 disabled:cursor-not-allowed">
                      {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
