'use client'

import dynamic from 'next/dynamic'
import type { SearchResult } from '@/app/types/establishment'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-xl border border-gray-200 bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span className="text-xs">Chargement de la carte…</span>
      </div>
    </div>
  ),
})

export default function MapWrapper({ data }: { data: SearchResult }) {
  return <Map data={data} />
}
