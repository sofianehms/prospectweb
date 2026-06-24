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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${BACKEND}/api/prospects/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const endpoint = body.notes !== undefined ? 'notes' : 'status'
  const res = await fetch(`${BACKEND}/api/prospects/${id}/${endpoint}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
