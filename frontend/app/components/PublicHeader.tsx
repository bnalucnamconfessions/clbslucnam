'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function PublicHeader() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/dang-nhap' || pathname === '/quen-mat-khau' || pathname === '/dat-lai-mat-khau'

  const nav = [
    { href: '/', label: 'Trang chủ' },
    { href: '/xep-hang', label: 'Bảng xếp hạng' },
    { href: '/doi-tac', label: 'Nhà tài trợ & Đối tác' },
    { href: '/quyen-gop', label: 'Quyên góp' },
  ]

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="flex w-full max-w-[1280px] mx-auto px-4 md:px-10 py-3 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-slate-900">
          <Image
            src="/image/chung/logoclb.jpg"
            alt="BnA Lục Nam"
            width={32}
            height={32}
            className="size-8 rounded object-contain"
          />
          <span className="text-lg font-bold tracking-tight">BnA Lục Nam</span>
        </Link>
        <nav className="flex items-center gap-6 md:gap-8">
          {nav.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${isActive ? 'text-[#137fec]' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </Link>
            )
          })}
          {!isAuthPage && (
            <Link
              href="/dang-nhap"
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
