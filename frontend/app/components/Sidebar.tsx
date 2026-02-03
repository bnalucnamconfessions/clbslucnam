'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useLayoutEffect } from 'react'
import { apiUrl } from '../../lib/api'
import { SIDEBAR_SHOW_BOOK_MENU, PERM_LABELS, normalizePermission } from '../../lib/permissions'
import { logActivity } from '../../lib/activityLog'

const AUTH_KEY = 'adminToken'
const PERMISSION_POLL_INTERVAL_MS = 20 * 1000 // 20 giây — tự động cập nhật quyền khi admin đổi trên máy/tab khác

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userInfo, setUserInfo] = useState({ fullName: '', avatar: '', role: '', clubPermission: 'user' })
  const showBookMenu = SIDEBAR_SHOW_BOOK_MENU.includes(userInfo.clubPermission || '')
  const showOverviewMenu = userInfo.clubPermission !== 'user'
  const showDoiTacMenu = true

  const loadUserInfo = () => {
      const savedUserInfo = localStorage.getItem('userInfo')
      const adminName = localStorage.getItem('adminName')
      const adminRole = localStorage.getItem('adminRole')
      const adminAvatar = localStorage.getItem('adminAvatar')
      let profileAvatar = ''
      try {
        const accEmail = savedUserInfo ? (JSON.parse(savedUserInfo)?.accountEmail || JSON.parse(savedUserInfo)?.email) : ''
        if (accEmail) {
          const profileKey = `profileInfo_${accEmail.replace(/[^a-zA-Z0-9@._-]/g, '_')}`
          const pf = localStorage.getItem(profileKey)
          if (pf) {
            const p = JSON.parse(pf)
            profileAvatar = p?.personalInfo?.avatar || ''
          }
        }
      } catch {}
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo)
          const avatar = profileAvatar || parsed.avatar || adminAvatar || ''
          setUserInfo(prev => ({
            ...prev,
            ...parsed,
            fullName: parsed.fullName || adminName || prev.fullName,
            role: parsed.role || adminRole || prev.role,
            avatar,
            clubPermission: parsed.clubPermission || prev.clubPermission || 'user'
          }))
          return
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
      if (adminName || adminRole) {
        setUserInfo(prev => ({
          ...prev,
          fullName: adminName || prev.fullName,
          role: adminRole || prev.role,
          avatar: adminAvatar || '',
          clubPermission: prev.clubPermission || 'user'
        }))
      }
    }
  useLayoutEffect(() => {
    setMounted(true)
    loadUserInfo()
  }, [])

  useEffect(() => {
    const handleStorageChange = () => loadUserInfo()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userInfoUpdated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userInfoUpdated', handleStorageChange)
    }
  }, [])

  // Đồng bộ với backend: luôn cập nhật role + clubPermission từ auth/me để Sidebar, Hồ sơ, Thông tin CLB hiển thị cùng một nguồn
  useEffect(() => {
    if (!mounted) return
    const syncFromBackend = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
        const raw = localStorage.getItem('userInfo')
        // #region agent log
        const _parsed = raw ? (() => { try { return JSON.parse(raw) } catch { return {} } })() : {}
        const _email = (_parsed.accountEmail || _parsed.email || '').trim()
        fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar:syncFromBackend',message:'Before auth/me',data:{hasRaw:!!raw,hasToken:!!token,tokenPre:token?String(token).slice(0,10)+'..':'',hasEmail:!!_email,emailLen:_email.length},hypothesisId:'H1,H2,H3',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!raw) return
        const parsed = JSON.parse(raw)
        const email = (parsed.accountEmail || parsed.email || '').trim()
        if (!token && !email) return
        const url = email ? apiUrl(`/api/auth/me?email=${encodeURIComponent(email)}`) : apiUrl('/api/auth/me')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(url, { credentials: 'include', headers })
        // #region agent log
        if (!res.ok) fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar:syncFromBackend:resNotOk',message:'auth/me failed',data:{status:res.status,urlHadEmail:url.includes('email=')},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!res.ok) return
        const data = await res.json()
        const newPerm = (data.clubPermission || 'user').toLowerCase()
        const newRole = data.role || parsed.role || 'Người dùng'
        const newFullName = data.fullName || parsed.fullName || ''
        const newJoinDate = data.joinDate ?? parsed.joinDate ?? ''
        const updated = { ...parsed, clubPermission: newPerm, role: newRole, fullName: newFullName, joinDate: newJoinDate }
        localStorage.setItem('userInfo', JSON.stringify(updated))
        localStorage.setItem('adminRole', newRole)
        setUserInfo(prev => ({ ...prev, ...updated, clubPermission: newPerm, role: newRole, fullName: newFullName }))
        window.dispatchEvent(new Event('userInfoUpdated'))
      } catch (_) {}
    }
    syncFromBackend()
    const t = setInterval(syncFromBackend, PERMISSION_POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [mounted])

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const active = isActive(path)
    const base = "w-full flex items-center gap-3 px-3 py-2 rounded-lg outline-none focus:outline-none focus-visible:outline-none"
    if (active) {
      return `${base} text-white`
    }
    return `${base} text-slate-700 hover:text-black hover:bg-slate-100`
  }

  return (
    <div className="hidden lg:flex flex-col w-64 border-r bg-white h-screen overflow-y-auto no-scrollbar" style={{ borderRightColor: 'rgba(199, 199, 199, 1)' }}>
      <div className="flex flex-col px-4 py-6 bg-white text-black">
        {/* Logo & User Info - render placeholder until mounted to avoid hydration mismatch */}
        <div className="flex gap-3 mb-8">
          <div className="rounded-full size-10 flex items-center justify-center overflow-hidden shrink-0 bg-[#137fec] text-white font-bold text-sm relative">
            {!mounted ? (
              <span className="invisible" aria-hidden>.</span>
            ) : userInfo.avatar ? (
              <>
                <img
                  src={userInfo.avatar}
                  alt=""
                  className="w-full h-full object-cover absolute inset-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <span className="w-full h-full flex items-center justify-center bg-[#137fec] text-white font-bold text-sm" style={{ display: 'none' }}>
                  {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : ''}
                </span>
              </>
            ) : (
              userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : ''
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-black text-base font-medium leading-normal truncate">{mounted ? userInfo.fullName : '\u00A0'}</h1>
            <p className="text-slate-700 text-sm font-normal leading-normal truncate">{mounted ? (PERM_LABELS[normalizePermission(userInfo.clubPermission)] || userInfo.role) : '\u00A0'}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col gap-2">
          {showOverviewMenu && (
            <Link 
              className={getLinkClasses('/dashboard')} 
              style={isActive('/dashboard') ? { backgroundColor: '#137fec' } : {}}
              href="/dashboard"
              scroll={false}
            >
              <span className={`material-symbols-outlined ${isActive('/dashboard') ? 'fill-1' : ''}`}>dashboard</span>
              <span className="text-sm font-medium leading-normal">Tổng quan</span>
            </Link>
          )}
          <Link 
            className={getLinkClasses('/thong-bao')} 
            style={isActive('/thong-bao') ? { backgroundColor: '#137fec' } : {}}
            href="/thong-bao"
            scroll={false}
          >
            <span className={`material-symbols-outlined ${isActive('/thong-bao') ? 'fill-1' : ''}`}>campaign</span>
            <span className="text-sm font-medium leading-normal">Thông báo</span>
          </Link>
          {showBookMenu && (
            <>
              <Link 
                className={getLinkClasses('/books')} 
                style={isActive('/books') ? { backgroundColor: '#137fec' } : {}}
                href="/books"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/books') ? 'fill-1' : ''}`}>library_books</span>
                <span className="text-sm font-medium leading-normal">Kho sách</span>
              </Link>
              <Link 
                className={getLinkClasses('/qr')} 
                style={isActive('/qr') ? { backgroundColor: '#137fec' } : {}}
                href="/qr"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/qr') ? 'fill-1' : ''}`}>qr_code_scanner</span>
                <span className="text-sm font-medium leading-normal">Mã QR</span>
              </Link>
              <Link 
                className={getLinkClasses('/muon')} 
                style={isActive('/muon') ? { backgroundColor: '#137fec' } : {}}
                href="/muon"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/muon') ? 'fill-1' : ''}`}>book</span>
                <span className="text-sm font-medium leading-normal">Mượn sách</span>
              </Link>
              <Link 
                className={getLinkClasses('/tra')} 
                style={isActive('/tra') ? { backgroundColor: '#137fec' } : {}}
                href="/tra"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/tra') ? 'fill-1' : ''}`}>assignment_return</span>
                <span className="text-sm font-medium leading-normal">Trả sách</span>
              </Link>
            </>
          )}
          {showOverviewMenu && (
            <>
              <Link 
                className={getLinkClasses('/thanh-vien')} 
                style={isActive('/thanh-vien') ? { backgroundColor: '#137fec' } : {}}
                href="/thanh-vien"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/thanh-vien') ? 'fill-1' : ''}`}>group</span>
                <span className="text-sm font-medium leading-normal">Thành viên</span>
              </Link>
              <Link 
                className={getLinkClasses('/dashboard/tai-chinh')} 
                style={isActive('/dashboard/tai-chinh') ? { backgroundColor: '#137fec' } : {}}
                href="/dashboard/tai-chinh"
                scroll={false}
              >
                <span className={`material-symbols-outlined ${isActive('/dashboard/tai-chinh') ? 'fill-1' : ''}`}>payments</span>
                <span className="text-sm font-medium leading-normal">Tài chính</span>
              </Link>
            </>
          )}
          <Link 
            className={getLinkClasses('/dashboard/xep-hang')} 
            style={isActive('/dashboard/xep-hang') ? { backgroundColor: '#137fec' } : {}}
            href="/dashboard/xep-hang"
            scroll={false}
          >
            <span className={`material-symbols-outlined ${isActive('/dashboard/xep-hang') ? 'fill-1' : ''}`}>emoji_events</span>
            <span className="text-sm font-medium leading-normal">Bảng xếp hạng</span>
          </Link>
          {showDoiTacMenu && (
            <Link 
              className={getLinkClasses('/dashboard/doi-tac')} 
              style={isActive('/dashboard/doi-tac') ? { backgroundColor: '#137fec' } : {}}
              href="/dashboard/doi-tac"
              scroll={false}
            >
              <span className={`material-symbols-outlined ${isActive('/dashboard/doi-tac') ? 'fill-1' : ''}`}>handshake</span>
              <span className="text-sm font-medium leading-normal">Nhà tài trợ & Đối tác</span>
            </Link>
          )}
          <Link 
            className={getLinkClasses('/dashboard/quyen-gop')} 
            style={isActive('/dashboard/quyen-gop') ? { backgroundColor: '#137fec' } : {}}
            href="/dashboard/quyen-gop"
            scroll={false}
          >
            <span className={`material-symbols-outlined ${isActive('/dashboard/quyen-gop') ? 'fill-1' : ''}`}>volunteer_activism</span>
            <span className="text-sm font-medium leading-normal">Quyên góp</span>
          </Link>
          <Link 
            className={getLinkClasses('/ho-so')} 
            style={isActive('/ho-so') ? { backgroundColor: '#137fec' } : {}}
            href="/ho-so"
            scroll={false}
          >
            <span className={`material-symbols-outlined ${isActive('/ho-so') ? 'fill-1' : ''}`}>person</span>
            <span className="text-sm font-medium leading-normal">Thông Tin Cá Nhân</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-300">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                try {
                  const raw = localStorage.getItem('userInfo')
                  const info = raw ? JSON.parse(raw) : {}
                  const email = (info.accountEmail || info.email || '').trim()
                  if (email) logActivity('Đăng xuất', `Email: ${email}`, email)
                } catch (_) {}
                localStorage.removeItem(AUTH_KEY)
                localStorage.removeItem('userInfo')
                localStorage.removeItem('adminName')
                localStorage.removeItem('adminRole')
                localStorage.removeItem('adminAvatar')
                router.push('/dang-nhap')
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:text-red-600 hover:bg-red-50 outline-none focus:outline-none focus-visible:outline-none text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium leading-normal">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  )
}

