'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [userInfo, setUserInfo] = useState({
    fullName: 'Nguyễn Văn A',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxFU7ZacUewoYf1iGAJlkUaT1gIpPuzbG9fbquHnXuIJX323oHeG_Ozbp8Ea0f9ekUppKUcvuoAz_hhJUcPXBp8tu_KbE5_Zfm7Nucp8fMm6Zs4TIhHtKoxUIaBKT3DZJS9Zs5LuY7p-zHEO0m-aXoBfu4fXiZfI5xrQ22ZpQymAlVnNnu-tC6B6hZ3erQkLfACDdlLPm-ui4eyRDsWlqe-tt2jwgGefN4ocSeIDXHnxQA7gxSR4fHbzCsIuSbvoFsajFYF07VuuGS',
    role: 'Quản trị viên'
  })

  useEffect(() => {
    // Load user info from localStorage or API
    const loadUserInfo = () => {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo)
          setUserInfo(prev => ({ ...prev, ...parsed }))
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
    }
    
    // Load on mount
    loadUserInfo()
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadUserInfo()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userInfoUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userInfoUpdated', handleStorageChange)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const active = isActive(path)
    if (active) {
      return "flex items-center gap-3 px-3 py-2 rounded-lg text-white"
    }
    return "flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:text-black hover:bg-slate-100 transition-colors"
  }

  return (
    <div className="hidden lg:flex flex-col w-64 border-r bg-white h-screen overflow-y-auto" style={{ borderRightColor: 'rgba(199, 199, 199, 1)' }}>
      <div className="flex flex-col px-4 py-6 bg-white text-black">
        {/* Logo & User Info */}
        <div className="flex gap-3 mb-8">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" 
            style={{
              backgroundImage: userInfo.avatar ? `url("${userInfo.avatar}")` : 'none',
              backgroundColor: userInfo.avatar ? 'transparent' : '#137fec'
            }}
          />
          <div className="flex flex-col">
            <h1 className="text-black text-base font-medium leading-normal">{userInfo.fullName}</h1>
            <p className="text-slate-700 text-sm font-normal leading-normal">{userInfo.role}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-col gap-2">
          <Link 
            className={getLinkClasses('/dashboard')} 
            style={isActive('/dashboard') ? { backgroundColor: '#137fec' } : {}}
            href="/dashboard"
          >
            <span className={`material-symbols-outlined ${isActive('/dashboard') ? 'fill-1' : ''}`}>dashboard</span>
            <span className="text-sm font-medium leading-normal">Tổng quan</span>
          </Link>
          <Link 
            className={getLinkClasses('/thong-bao')} 
            style={isActive('/thong-bao') ? { backgroundColor: '#137fec' } : {}}
            href="/thong-bao"
          >
            <span className={`material-symbols-outlined ${isActive('/thong-bao') ? 'fill-1' : ''}`}>campaign</span>
            <span className="text-sm font-medium leading-normal">Thông báo</span>
          </Link>
          <Link 
            className={getLinkClasses('/books')} 
            style={isActive('/books') ? { backgroundColor: '#137fec' } : {}}
            href="/books"
          >
            <span className={`material-symbols-outlined ${isActive('/books') ? 'fill-1' : ''}`}>library_books</span>
            <span className="text-sm font-medium leading-normal">Kho sách</span>
          </Link>
          <Link 
            className={getLinkClasses('/qr')} 
            style={isActive('/qr') ? { backgroundColor: '#137fec' } : {}}
            href="/qr"
          >
            <span className={`material-symbols-outlined ${isActive('/qr') ? 'fill-1' : ''}`}>qr_code_scanner</span>
            <span className="text-sm font-medium leading-normal">Mã QR</span>
          </Link>
          <Link 
            className={getLinkClasses('/muon')} 
            style={isActive('/muon') ? { backgroundColor: '#137fec' } : {}}
            href="/muon"
          >
            <span className={`material-symbols-outlined ${isActive('/muon') ? 'fill-1' : ''}`}>book</span>
            <span className="text-sm font-medium leading-normal">Mượn sách</span>
          </Link>
          <Link 
            className={getLinkClasses('/tra')} 
            style={isActive('/tra') ? { backgroundColor: '#137fec' } : {}}
            href="/tra"
          >
            <span className={`material-symbols-outlined ${isActive('/tra') ? 'fill-1' : ''}`}>assignment_return</span>
            <span className="text-sm font-medium leading-normal">Trả sách</span>
          </Link>
          <Link 
            className={getLinkClasses('/thanh-vien')} 
            style={isActive('/thanh-vien') ? { backgroundColor: '#137fec' } : {}}
            href="/thanh-vien"
          >
            <span className={`material-symbols-outlined ${isActive('/thanh-vien') ? 'fill-1' : ''}`}>group</span>
            <span className="text-sm font-medium leading-normal">Thành viên</span>
          </Link>
          <Link 
            className={getLinkClasses('/ho-so')} 
            style={isActive('/ho-so') ? { backgroundColor: '#137fec' } : {}}
            href="/ho-so"
          >
            <span className={`material-symbols-outlined ${isActive('/ho-so') ? 'fill-1' : ''}`}>person</span>
            <span className="text-sm font-medium leading-normal">Thông Tin Cá Nhân</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-300">
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:text-red-600 hover:bg-red-50 transition-colors" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium leading-normal">Đăng xuất</span>
          </a>
        </div>
      </div>
    </div>
  )
}

