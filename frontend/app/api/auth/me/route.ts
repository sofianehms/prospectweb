import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET() {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })
  }
  return NextResponse.json({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
  })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 })
  }
  return NextResponse.json({ error: 'Suppression de compte via les parametres Clerk.' }, { status: 501 })
}
