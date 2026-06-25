'use client'

import { useClerk } from '@clerk/nextjs'

export default function LogoutButton() {
  const { signOut } = useClerk()

  function handleLogout() {
    signOut({ redirectUrl: '/sign-in' })
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition"
    >
      Déconnexion
    </button>
  )
}
