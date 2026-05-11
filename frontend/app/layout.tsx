import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeProvider from './components/ThemeProvider'
import ThemeToggle from './components/ThemeToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProspectWeb — Trouvez vos prochains clients',
  description: 'Repérez les commerces sans site web autour de vous, prêts à être prospectés.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Anti-flash : applique le thème avant le premier rendu */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t=localStorage.getItem('pw_theme')||'light';
            var h=document.documentElement;
            h.setAttribute('data-theme',t);
            if(t==='dark'||t==='darker')h.classList.add('dark');
          })()
        `}} />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
        <ThemeToggle />
      </body>
    </html>
  )
}
