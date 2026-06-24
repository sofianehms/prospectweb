import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'
const SECRET = process.env.BACKEND_SECRET ?? ''

async function authHeaders() {
  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''
  return {
    'x-internal-secret': SECRET,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  const res = await fetch(`${BACKEND}/api/prospects`, { headers: await authHeaders(), cache: 'no-store' })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${BACKEND}/api/prospects`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
