'use client'

import { useState, useEffect, useRef } from 'react'

type Theme = 'sable' | 'violet' | 'minuit' | 'cosmos'

const DARK_THEMES: Theme[] = ['minuit', 'cosmos']

const THEMES: { id: Theme; label: string; color: string; border: string }[] = [
  { id: 'sable',  label: 'Sable',  color: '#faf7f0', border: '#c4a060' },
  { id: 'violet', label: 'Violet', color: '#f5f3ff', border: '#c4b5fd' },
  { id: 'minuit', label: 'Minuit', color: '#14141e', border: '#504880' },
  { id: 'cosmos', label: 'Cosmos', color: '#0f0f1e', border: '#3a4070' },
]

function applyTheme(t: Theme) {
  const html = document.documentElement
  html.setAttribute('data-theme', t)
  html.classList.toggle('dark', DARK_THEMES.includes(t))
  document.cookie = `pw_theme=${t};path=/;max-age=31536000;SameSite=Lax`
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('sable')
  const [open,  setOpen]  = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') ?? 'sable') as Theme
    setTheme(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(t: Theme) {
    applyTheme(t)
    setTheme(t)
    setOpen(false)
  }

  const isDark = DARK_THEMES.includes(theme)

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {open && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 min-w-[130px]">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition w-full text-left ${
                theme === t.id
                  ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 ring-1"
                style={{ background: t.color, '--tw-ring-color': t.border } as React.CSSProperties}
              />
              {t.label}
              {theme === t.id && (
                <svg className="ml-auto" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Changer de thème"
        className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-transform"
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
