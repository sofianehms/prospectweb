import Link from 'next/link'
import AppHeader from './components/AppHeader'
import LogoutButton from './components/LogoutButton'
import SearchForm from './components/SearchForm'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      <AppHeader wide>
        <Link href="/prospects" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span className="hidden sm:inline">Mes prospects</span>
        </Link>
        <LogoutButton />
      </AppHeader>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 tracking-tight mb-3">
              Trouvez vos<br/>
              <span style={{ color: 'var(--accent)' }}>prochains clients</span>
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-base leading-relaxed">
              Repérez les commerces sans site web autour de vous, prêts à<br className="hidden sm:block" /> être prospectés.
            </p>
          </div>
          <SearchForm />
        </div>
      </main>

      <footer className="py-5 text-center">
        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          Données issues de Google Maps · OpenStreetMap
        </p>
      </footer>

    </div>
  )
}
