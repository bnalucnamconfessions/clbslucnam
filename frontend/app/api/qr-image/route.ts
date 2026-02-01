import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id || id.length > 20) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const paddedId = String(id).padStart(12, '0')
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paddedId}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('QR fetch failed')
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch QR' }, { status: 502 })
  }
}
