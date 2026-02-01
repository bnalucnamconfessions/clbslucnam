import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const errorParam = request.nextUrl.searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.nextUrl.origin || 'http://localhost:3000')
  const loginUrl = `${baseUrl}/dang-nhap`
  const dashboardUrl = `${baseUrl}/dashboard`
  if (errorParam) {
    return NextResponse.redirect(`${loginUrl}?error=auth_failed`)
  }
  if (!code) {
    return NextResponse.redirect(`${loginUrl}?error=missing_code`)
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const exchangeUrl = `${API_BASE.replace(/\/$/, '')}/api/auth/google/exchange`
  try {
    const res = await fetch(exchangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && (data as { token?: string }).token) {
      const d = data as { token: string; fullName?: string; role?: string; email?: string; picture?: string; clubPermission?: string }
      const params = new URLSearchParams({
        token: d.token,
        fullName: d.fullName || 'User',
        role: d.role || 'Người dùng',
        clubPermission: d.clubPermission || 'user',
      })
      if (d.email) params.set('email', d.email)
      const resRedirect = NextResponse.redirect(`${dashboardUrl}?${params.toString()}`)
      if (d.picture) {
        resRedirect.cookies.set('auth_picture', d.picture, { maxAge: 60, path: '/', sameSite: 'lax' })
      }
      return resRedirect
    }
  } catch {
    // fall through
  }
  return NextResponse.redirect(`${loginUrl}?error=auth_failed`)
}
