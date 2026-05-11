'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Establishment, SearchResult } from '@/app/types/establishment'
import AppHeader from '@/app/components/AppHeader'
import DetailClient from './components/DetailClient'

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('pw_search_results')
    if (!raw) { setNotFound(true); return }
    const data: SearchResult = JSON.parse(raw)
    const found = data.establishments.find(e => e.id === id)
    found ? setEstablishment(found) : setNotFound(true)
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">

      <AppHeader>
        <button className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
      </AppHeader>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-6">

        <Link href="/results" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Retour aux résultats
        </Link>

        {notFound && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-400 dark:text-slate-500 text-sm">
            Commerce introuvable. <Link href="/results" className="text-emerald-600 underline">Retour aux résultats</Link>
          </div>
        )}

        {!notFound && !establishment && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-400 dark:text-slate-500 text-sm">
            Chargement…
          </div>
        )}

        {establishment && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
            <DetailClient e={establishment} />
          </div>
        )}

      </main>
    </div>
  )
}
