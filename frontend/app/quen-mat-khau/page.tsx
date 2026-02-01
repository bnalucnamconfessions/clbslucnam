'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicHeader from '../components/PublicHeader'
import { apiUrl } from '../../lib/api'

export default function QuenMatKhauPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugResetUrl, setDebugResetUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setDebugResetUrl('')
    if (!email.trim()) {
      setError('Vui lòng nhập email đã đăng ký.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage(data.message || 'Nếu email tồn tại, bạn sẽ nhận hướng dẫn đặt lại mật khẩu qua email.')
        if (data.debugResetUrl) {
          const smtpNote = data.debugNote || 'Gửi email thất bại (SMTP).'
          setMessage((data.message || '') + ' ' + smtpNote)
          setDebugResetUrl(data.debugResetUrl)
        } else {
          setDebugResetUrl('')
        }
        setEmail('')
      } else {
        setError(data.detail || data.message || 'Có lỗi xảy ra. Kiểm tra terminal backend để xem chi tiết.')
      }
    } catch {
      setError('Không kết nối được máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
      <PublicHeader />
      <main className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Quên mật khẩu</h1>
              <p className="text-sm text-slate-500 mb-6">
                Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-900">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                    placeholder="tài khoản@gmail.com"
                    required
                    autoComplete="email"
                  />
                </label>
                {message && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm text-green-600">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      {message}
                    </p>
                    {debugResetUrl && (
                      <p className="text-sm">
                        <a href={debugResetUrl} className="text-[#137fec] underline font-medium">
                          Nhấn vào đây để đặt lại mật khẩu
                        </a>
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Nếu không thấy email, hãy kiểm tra thư mục <strong>Spam</strong> hoặc <strong>Rác</strong>.
                    </p>
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
                  className="h-12 w-full rounded-lg bg-[#137fec] text-white text-base font-bold hover:bg-[#0f6fd6] disabled:opacity-70 transition-colors"
                >
                  {loading ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại mật khẩu'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">
                <Link href="/dang-nhap" className="text-[#137fec] hover:underline font-medium">
                  ← Quay lại đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
