import { NextRequest, NextResponse } from 'next/server'
import { backendHeaders } from '@/app/lib/auth'

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000'

async function readBackendJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return {
      error: 'Réponse backend invalide.',
      status: res.status,
      contentType: res.headers.get('content-type') ?? 'unknown',
    }
  }
}

export async function GET() {
  const res = await fetch(`${BACKEND}/api/prospects`, { headers: await backendHeaders(), cache: 'no-store' })
  const data = await readBackendJson(res)
  const status = data?.error === 'Réponse backend invalide.' ? 502 : res.status
  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${BACKEND}/api/prospects`, {
    method: 'POST',
    headers: await backendHeaders(),
    body: JSON.stringify(body),
  })
  const data = await readBackendJson(res)
  const status = data?.error === 'Réponse backend invalide.' ? 502 : res.status
  return NextResponse.json(data, { status })
}
