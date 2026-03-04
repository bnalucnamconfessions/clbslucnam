'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '../../../components/Sidebar'
import RequireAuth from '../../../components/RequireAuth'
import { canEditCaiDat, PERM_LABELS } from '../../../../lib/permissions'
import { apiUrl, getApiAuth } from '../../../../lib/api'

const BORROW_ROLE_KEYS = [
  'admin', 'chairperson', 'vice_chairperson',
  'head_book', 'vice_head_book', 'member_book',
  'head_communication', 'vice_head_communication', 'member_communication',
  'head_hr_finance', 'vice_head_hr_finance', 'member_hr_finance',
  'user',
] as const

type BorrowRule = { dueDays: number; maxBooks: number }
type BorrowRules = Record<string, BorrowRule>

const defaultBorrowRules = (): BorrowRules =>
  Object.fromEntries(BORROW_ROLE_KEYS.map((role) => [role, { dueDays: 14, maxBooks: 3 }]))

export default function CaiDatQuyTacMuonPage() {
  const router = useRouter()
  const [canEdit, setCanEdit] = useState(false)
  const [borrowRules, setBorrowRules] = useState<BorrowRules>(defaultBorrowRules())
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
        router.replace('/dashboard')
        return
      }
    } catch {
      router.replace('/dashboard')
      return
    }
  }, [router])

  useEffect(() => {
    if (!canEdit) return
    let cancelled = false
    setLoading(true)
    fetch(apiUrl('/api/website-config'), { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled && data.borrowRules && typeof data.borrowRules === 'object') {
          setBorrowRules({ ...defaultBorrowRules(), ...data.borrowRules })
        }
      })
      .catch(() => {})
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
          borrowRules,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.detail || 'Lưu thất bại')
      }
      setMessage({ type: 'success', text: 'Đã lưu quy tắc mượn sách.' })
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lỗi khi lưu.' })
    } finally {
      setSaving(false)
    }
  }

  if (!canEdit) return null

  return (
    <RequireAuth>
      <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
          <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
            <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 bg-white">
              <div className="flex flex-col gap-2">
                <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Cài đặt
                </h2>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Chỉ Ban chủ nhiệm có quyền chỉnh sửa hạn trả dự kiến và số sách tối đa theo từng vai trò.
                </p>
              </div>
            </header>
            <div className="px-4 md:px-6 lg:px-8 py-6 w-full">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
                <Link
                  href="/dashboard/cai-dat/website"
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-600 hover:bg-slate-100"
                >
                  Cấu hình website
                </Link>
                <span className="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-[#137fec] text-white shadow-sm">
                  Quy tắc mượn sách
                </span>
              </div>
            <div className="max-w-3xl">
              {message && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}
              {loading ? (
                <p className="text-slate-500">Đang tải...</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-3 py-2 font-medium text-slate-700">Vai trò</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-700">Hạn trả (ngày)</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-700">Số sách tối đa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {BORROW_ROLE_KEYS.map((role) => (
                          <tr key={role} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">{PERM_LABELS[role] ?? role}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={borrowRules[role]?.dueDays ?? 14}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10)
                                  if (!Number.isNaN(v)) setBorrowRules((prev) => ({
                                    ...prev,
                                    [role]: { ...prev[role], dueDays: Math.max(1, Math.min(365, v)), maxBooks: prev[role]?.maxBooks ?? 3 },
                                  }))
                                }}
                                className="w-20 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#137fec]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={borrowRules[role]?.maxBooks ?? 3}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10)
                                  if (!Number.isNaN(v)) setBorrowRules((prev) => ({
                                    ...prev,
                                    [role]: { dueDays: prev[role]?.dueDays ?? 14, maxBooks: Math.max(1, Math.min(20, v)) },
                                  }))
                                }}
                                className="w-20 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#137fec]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2.5 bg-[#137fec] text-white font-medium rounded-lg hover:bg-[#0d6bd4] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu quy tắc'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
