'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RadiusSlider() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialKm = Math.round(Number(searchParams.get('radius') ?? 5000) / 1000)
  const [radius, setRadius] = useState(initialKm)

  function apply(km: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('radius', String(km * 1000))
    startTransition(() => router.push(`/results?${params.toString()}`))
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-5 py-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Élargir la zone de recherche</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{radius} km</span>
          {isPending && (
            <svg className="animate-spin text-emerald-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
        </div>
      </div>
      <input
        type="range" min={1} max={50} step={1} value={radius}
        onChange={e => setRadius(Number(e.target.value))}
        onMouseUp={e  => apply(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={e => apply(Number((e.currentTarget as HTMLInputElement).value))}
        disabled={isPending}
        aria-label="Élargir la zone"
        className="disabled:opacity-50"
      />
      <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-1 px-0.5">
        <span>1 km</span><span>10 km</span><span>25 km</span><span>50 km</span>
      </div>
    </div>
  )
}
