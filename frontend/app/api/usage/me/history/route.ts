import { NextRequest, NextResponse } from 'next/server'
import { backendHeaders } from '@/app/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get('days') ?? '30'
  const res = await fetch(`${BACKEND}/api/usage/me/history?days=${days}`, {
    headers: await backendHeaders(),
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
