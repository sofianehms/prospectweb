import { NextRequest, NextResponse } from 'next/server'
import { backendHeaders } from '@/app/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${BACKEND}/api/prospects/${id}`, {
    method: 'DELETE',
    headers: await backendHeaders(),
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const endpoint = body.followUpAt !== undefined ? 'follow-up' : body.notes !== undefined ? 'notes' : 'status'
  const res = await fetch(`${BACKEND}/api/prospects/${id}/${endpoint}`, {
    method: 'PATCH',
    headers: await backendHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
