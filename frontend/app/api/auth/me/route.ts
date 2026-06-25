import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

export async function GET() {
  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''

  const res = await fetch(`${BACKEND}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE() {
  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''

  const res = await fetch(`${BACKEND}/api/auth/me`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (res.status === 204) {
    const response = new NextResponse(null, { status: 204 })
    response.cookies.delete('pw_token')
    return response
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
