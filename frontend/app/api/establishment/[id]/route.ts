import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'
const SECRET = process.env.BACKEND_SECRET ?? ''

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = await cookies()
  const token = store.get('pw_token')?.value ?? ''

  const details = req.nextUrl.searchParams.get('details') === '1'
  const endpoint = details
    ? `${BACKEND}/api/establishment/${id}/details`
    : `${BACKEND}/api/establishment/${id}`

  const res = await fetch(endpoint, {
    headers: {
      'x-internal-secret': SECRET,
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
