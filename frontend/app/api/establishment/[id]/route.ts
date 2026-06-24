import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'
const SECRET = process.env.BACKEND_SECRET ?? ''

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''

  const res = await fetch(`${BACKEND}/api/establishment/${id}`, {
    headers: {
      'x-internal-secret': SECRET,
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
