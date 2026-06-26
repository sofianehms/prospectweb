import { NextResponse } from 'next/server'
import { backendHeaders } from '@/app/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

export async function POST() {
  const res = await fetch(`${BACKEND}/api/billing/portal`, {
    method: 'POST',
    headers: await backendHeaders(),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
