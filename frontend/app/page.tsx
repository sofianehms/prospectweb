import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--accent)' }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              Nosite
            </span>
          </div>

          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Se connecter
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
        <section className="w-full max-w-3xl text-center">
          <p className="mb-7 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Nouveau · Intelligence IA intégrée
          </p>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-6xl">
            Détectez vos prochains clients{' '}
            <span style={{ color: 'var(--accent)' }}>avant la concurrence.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500 dark:text-slate-400 sm:text-lg">
            Nosite identifie les entreprises locales sans site web dans n&apos;importe quelle zone —
            avec un score IA et des recommandations d&apos;action pour chaque prospect.
          </p>

          <p className="mt-6 text-xs text-gray-400 dark:text-slate-500">
            14 jours gratuits · Aucune carte requise · Annulez à tout moment
          </p>
        </section>

        <section
          aria-label="Aperçu des résultats Nosite"
          className="mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <p className="ml-2 truncate text-xs text-gray-400 dark:text-slate-500">
              app.nosite.fr/resultats?zone=Paris+3ème&amp;rayon=3km&amp;types=restaurant,café
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 text-sm dark:border-slate-700">
            <span className="font-medium text-gray-900 dark:text-slate-100">Paris 3e · 3 km</span>
            <span className="text-gray-400 dark:text-slate-500">Restaurant · Café · Boulangerie</span>
            <span className="ml-auto text-emerald-600">34 sans site</span>
            <span className="text-amber-500">12 obsolètes</span>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Pizzeria Da Luigi</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Paris 3e</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-emerald-600">Pas de site</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">94</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
