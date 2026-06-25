import { auth } from '@clerk/nextjs/server'

const SECRET = process.env.BACKEND_SECRET ?? ''

export async function backendHeaders(): Promise<Record<string, string>> {
  const { getToken } = await auth()
  const token = await getToken() ?? ''
  return {
    'x-internal-secret': SECRET,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}
