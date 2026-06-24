import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q || q.length < 2) return NextResponse.json([])

  const res = await fetch(`${BACKEND}/api/autocomplete?q=${encodeURIComponent(q)}`, {
    headers: { 'x-internal-secret': process.env.BACKEND_SECRET ?? '' },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
