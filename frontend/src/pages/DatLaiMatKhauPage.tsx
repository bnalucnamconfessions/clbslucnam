import { useState, useEffect, Suspense } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import PublicHeader from '@/components/PublicHeader'
import { apiUrl } from '@/lib/api'

function DatLaiMatKhauContent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''

  const [token, setToken] = useState(tokenFromUrl)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setToken(tokenFromUrl)
  }, [tokenFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!token.trim()) {
      setError('Thiếu token. Vui lòng dùng link trong email đã gửi.')
      return
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage(data.message || 'Đã đặt lại mật khẩu thành công.')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => navigate('/dang-nhap'), 2000)
      } else {
        setError(data.detail || 'Token không hợp lệ hoặc đã hết hạn.')
      }
    } catch {
      setError('Không kết nối được máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenFromUrl) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
        <PublicHeader />
        <main className="flex flex-col min-h-[calc(100vh-56px)]">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
              <p className="text-slate-600 mb-4">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <Link to="/quen-mat-khau" className="text-[#137fec] hover:underline font-medium">Yêu cầu gửi lại link</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
      <PublicHeader />
      <main className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Đặt lại mật khẩu</h1>
              <p className="text-sm text-slate-500 mb-6">Nhập mật khẩu mới (ít nhất 8 ký tự).</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-900">Mật khẩu mới</span>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]" placeholder="Ít nhất 8 ký tự" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#137fec]">
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-900">Xác nhận mật khẩu</span>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]" placeholder="Nhập lại mật khẩu" required />
                </label>
                {message && <p className="flex items-center gap-2 text-sm text-green-600"><span className="material-symbols-outlined text-lg">check_circle</span>{message}</p>}
                {error && <p className="flex items-center gap-2 text-sm text-red-600"><span className="material-symbols-outlined text-lg">error</span>{error}</p>}
                <button type="submit" disabled={loading} className="h-12 w-full rounded-lg bg-[#137fec] text-white text-base font-bold hover:bg-[#0f6fd6] disabled:opacity-70 transition-colors">
                  {loading ? 'Đang xử lý...' : 'Đặt mật khẩu mới'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                <Link to="/dang-nhap" className="text-[#137fec] hover:underline font-medium">← Quay lại đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DatLaiMatKhauPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
      </div>
    }>
      <DatLaiMatKhauContent />
    </Suspense>
  )
}
