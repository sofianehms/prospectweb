'use client'

import { useEffect } from 'react'

type Theme = 'light' | 'beige' | 'dark' | 'darker'
const DARK_THEMES: Theme[] = ['dark', 'darker']

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = (localStorage.getItem('pw_theme') ?? 'light') as Theme
    const html  = document.documentElement
    html.setAttribute('data-theme', saved)
    html.classList.toggle('dark', DARK_THEMES.includes(saved))
  }, [])

  return <>{children}</>
}
