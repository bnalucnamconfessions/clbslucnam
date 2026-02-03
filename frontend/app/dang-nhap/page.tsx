'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PublicHeader from '../components/PublicHeader'
import { apiUrl } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'

const AUTH_KEY = 'adminToken'
const LIBRARY_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhfIadDZdqVvwmp3Imf6W56SF2XhI-8-CRSn_2mNAP_dDa3rtegI9ilOW_-bljYp5forjdrJXvpe9VfMfb5NBi2hUNjkRqS2zYAUwnsrEaXbo32Uq4RvCkpTTAJ0Vg2Hrg7YCeqDiqPd62YIIcj9vHPEhoGpArhvR-Ta1SUppsRskkfYJbw_43BfLqWe4kNln5X97sKVe5CrTdG2pMQdvm3TAnXo8eeb4OY6npwFcboM1mPZGJoZIhSfbCim7nyHf5L2JWkNCIMeiA'

export default function DangNhapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [registerStep, setRegisterStep] = useState<'form' | 'verify'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [alreadyGoogleMessage, setAlreadyGoogleMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || searchParams.get('token')
    const err = params.get('error') || searchParams.get('error')
    if (token) {
      localStorage.setItem(AUTH_KEY, token)
      const fn = params.get('fullName') || searchParams.get('fullName')
      const role = params.get('role') || searchParams.get('role')
      const clubPermission = params.get('clubPermission') || searchParams.get('clubPermission') || 'user'
      const picture = params.get('picture') || searchParams.get('picture')
      if (fn) localStorage.setItem('adminName', fn)
      if (role) localStorage.setItem('adminRole', role)
      if (picture) localStorage.setItem('adminAvatar', picture)
      const email = params.get('email') || searchParams.get('email') || ''
      const userInfo = { fullName: fn || 'User', email, accountEmail: email, role: role || 'Người dùng', clubPermission, avatar: picture || '' }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      window.dispatchEvent(new Event('userInfoUpdated'))
      if (token.startsWith('google-') && (email || '').trim()) logActivity('Đăng nhập', `Đăng nhập qua Google | Email: ${(email || '').trim() || '—'}`, (email || '').trim() || undefined)
      const dest = clubPermission === 'user' ? '/dashboard/xep-hang' : '/dashboard'
      router.replace(dest)
      return
    }
    if (err) {
      setError(err === 'auth_failed' ? 'Xác thực Google thất bại.' : err === 'config' ? 'Chưa cấu hình OAuth.' : 'Lỗi đăng nhập.')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) && !searchParams.get('token')) {
      try {
        const ui = localStorage.getItem('userInfo')
        const parsed = ui ? JSON.parse(ui) : {}
        const dest = parsed.clubPermission === 'user' ? '/dashboard/xep-hang' : '/dashboard'
        router.replace(dest)
      } catch {
        router.replace('/dashboard')
      }
    }
  }, [router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_KEY, data.token)
          const fn = data.fullName || 'User'
          const role = data.role || 'Quản trị viên'
          const clubPermission = data.clubPermission || 'admin'
          localStorage.setItem('adminName', fn)
          localStorage.setItem('adminRole', role)
          localStorage.setItem('adminAvatar', '')
          const userInfo = { fullName: fn, email: data.email || '', accountEmail: data.email || '', role, clubPermission, avatar: '' }
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
          window.dispatchEvent(new Event('userInfoUpdated'))
          logActivity('Đăng nhập', `Đăng nhập bằng tài khoản | Email: ${data.email || username.trim() || '—'}`, data.email || undefined)
        }
        router.replace('/dashboard')
        return
      }
      setError(data.detail || 'Tên đăng nhập hoặc mật khẩu không đúng.')
    } catch {
      setError('Không kết nối được backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setAlreadyGoogleMessage('')
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (!agreeTerms) {
      setError('Vui lòng đồng ý điều khoản sử dụng.')
      return
    }
    if (!registerEmail?.trim()) {
      setError('Vui lòng nhập email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail.trim(),
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.sent) {
        setError('')
        setSuccessMessage(data.message || 'Mã xác thực 6 chữ số đã gửi đến email của bạn.')
        setRegisterStep('verify')
        setVerificationCode('')
        return
      }
      if (data.code === 'already_google') {
        setError('')
        setAlreadyGoogleMessage(data.detail || 'Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google.')
        setSuccessMessage('')
        return
      }
      setAlreadyGoogleMessage('')
      setError(data.detail || 'Gửi mã thất bại.')
    } catch {
      setError('Không kết nối được backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = verificationCode.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/register/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail.trim(),
          code,
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        logActivity('Đăng ký tài khoản', `Email: ${registerEmail.trim()}`, registerEmail.trim())
        setError('')
        setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.')
        setActiveTab('login')
        setUsername(registerEmail.trim())
        setPassword('')
        setConfirmPassword('')
        setRegisterEmail('')
        setVerificationCode('')
        setRegisterStep('form')
        return
      }
      if (data.code === 'already_google') {
        setError('')
        setAlreadyGoogleMessage(data.detail || 'Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google.')
        return
      }
      setAlreadyGoogleMessage('')
      setError(data.detail || 'Mã không đúng hoặc đã hết hạn.')
    } catch {
      setError('Không kết nối được backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
      <PublicHeader />
      <main className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          <div className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-20">
            <div className="flex max-w-[1200px] flex-1 flex-col">
              <div className="flex h-full flex-col items-start justify-center gap-8 lg:flex-row lg:gap-12">
            {/* Left - Promo */}
            <div className="order-2 flex w-full flex-col gap-6 lg:order-1 lg:sticky lg:top-8 lg:w-1/2">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat group lg:aspect-auto lg:h-[600px]"
                style={{ backgroundImage: `url("${LIBRARY_IMAGE}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h1 className="mb-3 text-3xl font-black leading-tight tracking-tight">Khám phá tri thức, kết nối đam mê.</h1>
                  <p className="text-lg text-gray-200">Tham gia cộng đồng đọc sách lớn nhất trường và tham gia các sự kiện thú vị hàng tuần.</p>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="order-1 mx-auto w-full max-w-[520px] lg:order-2 lg:mx-0">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="mb-2 text-2xl font-bold text-slate-900">Chào mừng bạn!</h2>
                  <p className="text-sm text-slate-500">Hãy đăng nhập hoặc tạo tài khoản để bắt đầu hành trình đọc sách.</p>
                </div>

                {/* Tabs */}
                <div className="mb-8 grid w-full grid-cols-2 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); setAlreadyGoogleMessage(''); setRegisterStep('form'); setVerificationCode('') }}
                    className={`border-b-2 py-2 pb-3 pt-2 text-center text-sm font-bold transition-colors ${activeTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary'}`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(''); setSuccessMessage(''); setAlreadyGoogleMessage(''); if (activeTab !== 'register') setRegisterStep('form') }}
                    className={`border-b-2 py-2 pb-3 pt-2 text-center text-sm font-bold transition-colors ${activeTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-primary'}`}
                  >
                    Đăng ký
                  </button>
                </div>

                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Email hoặc tên đăng nhập</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">mail</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Nhập tài khoản"
                          required
                          autoComplete="username"
                        />
                      </div>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Mật khẩu</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">lock</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password ?? ''}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Ít nhất 8 ký tự"
                          required
                          autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 flex items-center text-slate-500 hover:text-primary">
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                    </label>
                    <div className="flex justify-end">
                      <Link href="/quen-mat-khau" className="text-sm text-[#137fec] hover:underline font-medium">
                        Quên mật khẩu?
                      </Link>
                    </div>
                    {successMessage && (
                      <p className="flex items-center gap-2 text-sm text-green-600">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {successMessage}
                      </p>
                    )}
                    {error && (
                      <p className="flex items-center gap-2 text-sm text-red-600">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white shadow-lg shadow-[#137fec]/20 transition-all hover:bg-[#0f6fd6] active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Đang đăng nhập...</> : 'Đăng nhập'}
                    </button>
                  </form>
                ) : registerStep === 'verify' ? (
                  <form onSubmit={handleVerifyRegister} className="flex flex-col gap-4">
                    {alreadyGoogleMessage && (
                      <div className="flex flex-col gap-1 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                        <p className="flex items-center gap-2 font-medium">
                          <span className="material-symbols-outlined text-lg">info</span>
                          {alreadyGoogleMessage}
                        </p>
                        <p className="text-blue-700">Dùng nút &quot;Tiếp tục với Google&quot; bên dưới để đăng nhập.</p>
                      </div>
                    )}
                    <p className="text-sm text-slate-600">
                      Mã 6 chữ số đã gửi đến <strong className="text-slate-900">{registerEmail}</strong>. Nhập mã bên dưới để hoàn tất đăng ký.
                    </p>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Mã xác thực (6 chữ số)</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">pin</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-lg tracking-[0.4em] font-mono text-slate-900 text-center transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="000000"
                          autoComplete="one-time-code"
                        />
                      </div>
                    </label>
                    {error && (
                      <p className="flex items-center gap-2 text-sm text-red-600">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading || verificationCode.replace(/\D/g, '').length !== 6}
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white shadow-lg shadow-[#137fec]/20 transition-all hover:bg-[#0f6fd6] active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Đang xác thực...</> : 'Xác nhận đăng ký'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRegisterStep('form'); setError(''); setSuccessMessage(''); setAlreadyGoogleMessage(''); setVerificationCode('') }}
                      className="text-sm text-slate-500 hover:text-primary"
                    >
                      ← Quay lại nhập email
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Email</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">mail</span>
                        <input
                          type="email"
                          value={registerEmail ?? ''}
                          onChange={(e) => { setRegisterEmail(e.target.value); setAlreadyGoogleMessage('') }}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="tài khoản@gmail.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Mật khẩu</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">lock</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Ít nhất 8 ký tự"
                          required
                          minLength={8}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 flex items-center text-slate-500 hover:text-primary">
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-slate-900">Xác nhận mật khẩu</span>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-[20px] text-slate-500">lock_reset</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword ?? ''}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Nhập lại mật khẩu"
                        />
                      </div>
                    </label>
                    <label className="mt-2 flex cursor-pointer select-none items-start gap-3 group">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border border-slate-200 text-primary focus:ring-primary"
                      />
                      <span className="text-sm leading-snug text-slate-500 transition-colors group-hover:text-primary">
                        Tôi đồng ý cho phép sử dụng thông tin cá nhân để mượn sách và nhận quà tặng từ câu lạc bộ.
                      </span>
                    </label>
                    {alreadyGoogleMessage && (
                      <div className="flex flex-col gap-1 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                        <p className="flex items-center gap-2 font-medium">
                          <span className="material-symbols-outlined text-lg">info</span>
                          {alreadyGoogleMessage}
                        </p>
                        <p className="text-blue-700">Dùng nút &quot;Tiếp tục với Google&quot; bên dưới để đăng nhập.</p>
                      </div>
                    )}
                    {error && (
                      <p className="flex items-center gap-2 text-sm text-red-600">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white shadow-lg shadow-[#137fec]/20 transition-all hover:bg-[#0f6fd6] active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Đang gửi mã...</> : 'Gửi mã xác thực'}
                    </button>
                  </form>
                )}

                {/* Divider & Google */}
                <div className="relative flex items-center py-6">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="mx-4 flex-shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">Hoặc</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
                <a
                  href={apiUrl('/api/auth/google/start')}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white h-12 px-4 hover:bg-slate-50 transition-colors text-slate-900 font-bold text-sm"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Tiếp tục với Google</span>
                </a>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Bằng cách đăng ký, bạn đồng ý với{' '}
                  <Link href="#" className="text-primary hover:underline">Điều khoản sử dụng</Link> và{' '}
                  <Link href="#" className="text-primary hover:underline">Chính sách bảo mật</Link> của chúng tôi.
                </p>

              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
