'use client'

import Link from 'next/link'
import { useState } from 'react'

/* ─── Header ─── */
function Header() {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-slate-100">Nosite</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-gray-500 dark:text-slate-400 sm:flex">
            <a href="#fonctionnalites" className="transition hover:text-gray-900 dark:hover:text-slate-100">Produit</a>
            <a href="#tarifs" className="transition hover:text-gray-900 dark:hover:text-slate-100">Tarifs</a>
            <a href="#faq" className="transition hover:text-gray-900 dark:hover:text-slate-100">FAQ</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 transition hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">Se connecter</Link>
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--accent)' }}>
            Essai gratuit &rarr;
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="px-6 py-16 text-center sm:py-24">
      <p className="mb-7 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Nouveau &middot; Intelligence IA intégrée
      </p>
      <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-6xl">
        Détectez vos prochains clients{' '}
        <span style={{ color: 'var(--accent)' }}>avant la concurrence.</span>
      </h1>
      <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-500 dark:text-slate-400 sm:text-lg">
        Nosite identifie les entreprises locales sans site web dans n&apos;importe quelle zone —
        avec un score IA et des recommandations d&apos;action pour chaque prospect.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/login" className="rounded-lg px-6 py-3 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--accent)' }}>
          Commencer gratuitement &rarr;
        </Link>
        <a href="#comment-ca-marche" className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          Voir comment ça marche
        </a>
      </div>
      <p className="mt-6 text-xs text-gray-400 dark:text-slate-500">
        14 jours gratuits &middot; Aucune carte requise &middot; Annulez à tout moment
      </p>
    </section>
  )
}

/* ─── App Preview Mockup ─── */
function AppPreview() {
  const prospects = [
    { name: 'Pizzeria Da Luigi', rating: 4.8, reviews: 892, area: 'Paris 11e', status: 'PAS DE SITE', statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', score: 94 },
    { name: 'Le Café du Commerce', rating: 4.5, reviews: 1247, area: 'Paris 3e', status: 'SITE OBSOLÈTE', statusColor: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', score: 78 },
    { name: 'Boulangerie Artisan Bernard', rating: 4.9, reviews: 567, area: 'Paris 15e', status: 'PAS DE SITE', statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', score: 89 },
  ]

  return (
    <section className="mx-auto w-full max-w-4xl px-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <p className="ml-2 truncate text-xs text-gray-400 dark:text-slate-500">app.nosite.fr/resultats?zone=Paris+3ème&amp;rayon=3km&amp;types=restaurant,café</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 text-sm dark:border-slate-700">
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100">📍 Paris 3e &middot; 3 km</span>
          <span className="text-gray-400 dark:text-slate-500">Restaurant &middot; Café &middot; Boulangerie</span>
          <div className="ml-auto flex gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">34 sans site</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">12 obsolètes</span>
          </div>
        </div>
        {prospects.map((p, i) => (
          <div key={i} className={`flex items-center justify-between gap-4 px-5 py-4 ${i < prospects.length - 1 ? 'border-b border-gray-100 dark:border-slate-700/50' : ''}`}>
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">{p.name}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">⭐ {p.rating} &middot; {p.reviews.toLocaleString('fr-FR')} avis &middot; {p.area}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.statusColor}`}>{p.status}</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{p.score}</p>
                <p className="text-[10px] uppercase text-gray-400 dark:text-slate-500">score</p>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t border-gray-100 px-5 py-3 text-center dark:border-slate-700/50">
          <p className="text-xs text-gray-400 dark:text-slate-500">+ 31 opportunités supplémentaires &rarr;</p>
        </div>
      </div>
    </section>
  )
}

/* ─── Stats ─── */
function Stats() {
  const stats = [
    { value: '50 000+', label: 'entreprises analysées' },
    { value: '12 000+', label: 'opportunités détectées' },
    { value: '3 min', label: 'pour votre 1er lead' },
    { value: '4,8/5', label: 'satisfaction utilisateurs' },
  ]
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl" style={{ color: 'var(--accent)' }}>{s.value}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Comment ça marche ─── */
function HowItWorks() {
  const steps = [
    { step: 'ÉTAPE 1', title: 'Définissez votre zone', desc: 'Saisissez une adresse et choisissez un rayon de 1 à 10 km. Nosite interroge automatiquement tous les commerces de la zone via Google Places.', icon: '🔍' },
    { step: 'ÉTAPE 2', title: "L'IA analyse tout", desc: "Notre moteur vérifie chaque site web, calcule un score d'opportunité sur 100 et génère des insights IA pour chaque entreprise détectée.", icon: '⭐', highlight: true },
    { step: 'ÉTAPE 3', title: 'Contactez et signez', desc: "Liste priorisée avec coordonnées, score et recommandations. Ajoutez au CRM intégré, suivez votre pipeline, exportez en un clic.", icon: '➡️' },
  ]
  return (
    <section id="comment-ca-marche" className="bg-gray-50 px-6 py-16 dark:bg-slate-900/50 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Comment ça marche</p>
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">
          De l&apos;adresse au prospect qualifié
        </h2>
        <p className="mb-12 text-center text-lg text-gray-400 dark:text-slate-500">en moins de 3 minutes.</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className={`rounded-2xl border p-6 ${s.highlight ? 'border-emerald-300 dark:border-emerald-700' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}>
              {s.highlight && <p className="mb-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Cœur du produit</p>}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg dark:bg-slate-700">{s.icon}</div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{s.step}</p>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-slate-100">{s.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Score IA (mockup statique) ─── */
function ScoreSection() {
  const criteria = [
    { label: 'Pas de site web', points: '+30' },
    { label: 'Concurrents équipés', points: '+20' },
    { label: 'Présence locale forte', points: '+15' },
    { label: '900+ avis Google', points: '+12' },
    { label: 'Activité récente', points: '+10' },
  ]
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">Pizzeria Da Luigi</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">⭐ 4.8 &middot; 892 avis &middot; Paris 11e</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">94</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">/100</p>
            </div>
          </div>
          <div className="mb-4 rounded-lg px-3 py-2" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>● Très forte opportunité commerciale</p>
          </div>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <span style={{ color: 'var(--accent)' }}>✓</span> {c.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                    <div className="h-full rounded-full" style={{ width: `${parseInt(c.points) * 3}%`, backgroundColor: 'var(--accent)' }} />
                  </div>
                  <span className="w-8 text-right font-medium" style={{ color: 'var(--accent)' }}>{c.points}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Score total</span>
            <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>94 / 100</span>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-slate-700/50">
            <p className="text-xs leading-relaxed text-gray-500 dark:text-slate-400">
              <span style={{ color: 'var(--accent)' }}>★ IA Nosite</span> — 892 avis Google, zéro présence web. 4 concurrents directs ont un site actif. Fenêtre d&apos;opportunité optimale. Action recommandée : appel direct.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Intelligence artificielle</p>
          <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Un score qui explique pourquoi contacter.</h2>
          <p className="mb-8 text-base leading-relaxed text-gray-500 dark:text-slate-400">
            Chaque prospect reçoit un score IA de 0 à 100 basé sur 5 critères. Vous savez exactement pourquoi un prospect est prioritaire — et comment l&apos;approcher efficacement.
          </p>
          <div className="space-y-5">
            {[
              { title: 'Score transparent et explicable', desc: 'Chaque point est justifié. Pas de boîte noire.' },
              { title: 'Analyse concurrentielle automatique', desc: 'Nosite compare votre prospect à ses voisins équipés.' },
              { title: 'Next Best Action recommandée', desc: "Appeler, envoyer un email, relancer — l'IA décide pour vous." },
            ].map((f, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: 'var(--accent)' }}>✓</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{f.title}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Fonctionnalités ─── */
function Features() {
  const features = [
    { icon: '🔍', title: 'Détection Intelligente', desc: "Identifie automatiquement les entreprises sans site ou avec un site obsolète dans n'importe quelle zone géographique." },
    { icon: '⭐', title: 'Score IA 0–100', desc: "Chaque prospect reçoit un score basé sur 5 critères. Priorisez votre prospection avec une précision chirurgicale." },
    { icon: '📍', title: 'Carte & Heatmap', desc: 'Visualisez les opportunités sur une carte interactive. Identifiez les zones géographiques les plus prometteuses.' },
    { icon: '📋', title: 'CRM Intégré', desc: "Pipeline Kanban, suivi d'avancement, notes et historique. Gérez tous vos prospects sans quitter Nosite." },
    { icon: '📥', title: 'Export multi-format', desc: 'CSV, Google Sheets, Notion, Airtable, HubSpot, Pipedrive. Intégrez vos prospects à vos outils existants.' },
    { icon: '⚡', title: 'Insights IA temps réel', desc: 'Analyse concurrentielle automatique, potentiel commercial estimé, script de prospection personnalisé.' },
  ]
  return (
    <section id="fonctionnalites" className="bg-gray-50 px-6 py-16 dark:bg-slate-900/50 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Fonctionnalités</p>
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Tout ce qu&apos;il faut pour</h2>
        <p className="mb-12 text-center text-lg text-gray-400 dark:text-slate-500">trouver et signer des clients.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg dark:bg-slate-700">{f.icon}</div>
              <h3 className="mb-2 font-bold text-gray-900 dark:text-slate-100">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── ROI Calculator ─── */
function RoiCalculator() {
  const [clients, setClients] = useState(3)
  const [value, setValue] = useState(2000)
  const proPriceMonthly = 79
  const revenueMonth = Math.round(clients * value * 0.987)
  const revenueYear = revenueMonth * 12
  const roi = Math.round(revenueMonth / proPriceMonthly)

  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Retour sur investissement</p>
          <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Nosite est un investissement.</h2>
          <p className="mb-6 text-2xl font-bold text-gray-400 dark:text-slate-500">Pas une dépense.</p>
          <p className="mb-8 text-base text-gray-500 dark:text-slate-400">
            1 client signé via Nosite peut couvrir plusieurs mois d&apos;abonnement. Calculez votre ROI personnalisé ci-contre.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>&times;8</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-slate-100">ROI moyen de nos utilisateurs</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">par rapport au coût de l&apos;abonnement</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">7j</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-slate-100">Délai moyen avant le 1er client</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">selon nos utilisateurs actifs</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-slate-100">Calculez votre ROI</h3>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Nouveaux clients / mois</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{clients}</span>
            </div>
            <input type="range" min="1" max="10" value={clients} onChange={e => setClients(+e.target.value)} className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500"><span>1</span><span>10</span></div>
          </div>
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Valeur moyenne par client</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{value.toLocaleString('fr-FR')}&euro;</span>
            </div>
            <input type="range" min="500" max="10000" step="100" value={value} onChange={e => setValue(+e.target.value)} className="w-full accent-emerald-500" />
            <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500"><span>500&euro;</span><span>10 000&euro;</span></div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">Revenus supplémentaires / mois</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>+{revenueMonth.toLocaleString('fr-FR')}&euro;</span>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">Revenus supplémentaires / an</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">{revenueYear.toLocaleString('fr-FR')}&euro;</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-slate-600">
              <span className="text-sm text-gray-600 dark:text-slate-400">Multiplicateur ROI</span>
              <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>&times;{roi}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-slate-500">Basé sur le plan Pro à 79&euro;/mois &middot; Estimation indicative</p>
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const [annual, setAnnual] = useState(false)
  const plans = [
    {
      name: 'SOLO', price: 29, desc: 'Pour les freelances qui débutent la prospection locale.', cta: 'Démarrer gratuitement', ctaStyle: 'border',
      features: ['5 recherches / mois', '200 prospects analysés', 'Export CSV', 'Score IA basique', 'CRM basique'],
    },
    {
      name: 'PRO', price: 79, desc: 'Pour les agences et freelances actifs en prospection.', cta: 'Commencer Pro →', ctaStyle: 'filled', popular: true,
      features: ['Recherches illimitées', '2 000 prospects / mois', 'CSV, Sheets, Notion, Airtable', 'Score IA complet', 'CRM Kanban complet', 'Insights IA + Analyse concurrents', 'Vue carte interactive'],
    },
    {
      name: 'EXPERT', price: 149, desc: 'Pour les équipes et agences à fort volume de prospection.', cta: 'Nous contacter', ctaStyle: 'border',
      features: ['Tout le plan Pro inclus', 'Illimité', 'Multi-utilisateurs (5 sièges)', 'HubSpot & Pipedrive', 'Accès API', 'Support prioritaire', 'Onboarding personnalisé'],
    },
  ]
  return (
    <section id="tarifs" className="bg-gray-50 px-6 py-16 dark:bg-slate-900/50 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Tarifs</p>
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Simples, transparents,</h2>
        <p className="mb-4 text-center text-3xl font-bold text-gray-400 dark:text-slate-500 sm:text-4xl">sans surprise.</p>
        <p className="mb-8 text-center text-base text-gray-500 dark:text-slate-400">Commencez gratuitement. Passez au plan suivant quand vous êtes prêt.</p>
        <div className="mb-10 flex items-center justify-center gap-3">
          <button onClick={() => setAnnual(false)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${!annual ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'}`}>Mensuel</button>
          <button onClick={() => setAnnual(true)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${annual ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'}`}>
            Annuel <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">-20%</span>
          </button>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((p, i) => {
            const price = annual ? Math.round(p.price * 0.8) : p.price
            return (
              <div key={i} className={`relative rounded-2xl border p-6 ${p.popular ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}>
                {p.popular && <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Le plus populaire</p>}
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">{p.name}</p>
                <p className="mb-1"><span className="text-4xl font-bold text-gray-900 dark:text-slate-100">{price}&euro;</span><span className="text-sm text-gray-400 dark:text-slate-500">/mois</span></p>
                <p className="mb-5 text-sm text-gray-500 dark:text-slate-400">{p.desc}</p>
                <Link href="/login" className={`mb-6 block rounded-lg py-3 text-center text-sm font-medium transition ${p.ctaStyle === 'filled' ? 'text-white hover:opacity-90' : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'}`} style={p.ctaStyle === 'filled' ? { backgroundColor: 'var(--accent)' } : undefined}>
                  {p.cta}
                </Link>
                <ul className="space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                      <span className="mt-0.5" style={{ color: 'var(--accent)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ─── */
function Testimonials() {
  const testimonials = [
    { quote: "J'ai signé 4 clients en 2 semaines. Le score IA m'évite de contacter des prospects non qualifiés. Un outil véritablement indispensable pour ma prospection.", name: 'Thomas D.', role: 'Dev freelance · Bordeaux', badge: '4 clients signés', initial: 'T' },
    { quote: "Notre pipeline a triplé en 1 mois. On utilise Nosite pour prospecter toutes nos nouvelles zones. L'export Google Sheets s'intègre parfaitement à notre workflow.", name: 'Sophie M.', role: 'Directrice · Agence Lyon', badge: 'Pipeline ×3', initial: 'S' },
    { quote: "Un seul client signé m'a couvert 6 mois d'abonnement. Je n'aurais jamais pu identifier ces prospects manuellement. Le ROI est évident et immédiat.", name: 'Marc B.', role: 'Consultant SEO · Paris', badge: 'ROI ×8', initial: 'M' },
  ]
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Résultats</p>
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Ils ont trouvé leurs clients.</h2>
        <p className="mb-12 text-center text-3xl font-bold text-gray-400 dark:text-slate-500 sm:text-4xl">Avec Nosite.</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 text-sm" style={{ color: 'var(--accent)' }}>★★★★★</div>
              <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-slate-300">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600 dark:bg-slate-700 dark:text-slate-300">{t.initial}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{t.role}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ─── */
function Faq() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'Les données utilisées sont-elles légales ?', a: "Oui. Nosite utilise exclusivement des données publiques accessibles via les APIs officielles de Google Maps et OpenStreetMap. Aucune donnée personnelle n'est collectée sans consentement." },
    { q: 'Nosite respecte-t-il le RGPD ?', a: "Absolument. Nosite est conforme au RGPD. Vos données sont hébergées en Europe, chiffrées en transit et au repos. Vous pouvez exporter ou supprimer vos données à tout moment." },
    { q: 'En combien de temps puis-je trouver mon premier client ?', a: "La plupart de nos utilisateurs identifient des prospects qualifiés dès leur première recherche (moins de 3 minutes). Le délai moyen avant la première signature est de 7 jours." },
    { q: "Quels types d'entreprises puis-je cibler ?", a: "Tous les commerces et entreprises locales : restaurants, artisans, commerces de proximité, professions libérales, PME... Nosite fonctionne dans toute la France et dans plus de 40 pays." },
    { q: 'Puis-je annuler mon abonnement à tout moment ?', a: "Oui, sans engagement. Vous pouvez annuler votre abonnement en un clic depuis votre espace. L'annulation prend effet à la fin de la période en cours." },
  ]
  return (
    <section id="faq" className="bg-gray-50 px-6 py-16 dark:bg-slate-900/50 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>FAQ</p>
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Questions fréquentes.</h2>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 dark:text-slate-100">
                {item.q}
                <span className="ml-4 shrink-0 text-gray-400 transition-transform dark:text-slate-500" style={{ transform: open === i ? 'rotate(180deg)' : undefined }}>▾</span>
              </button>
              {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA Final ─── */
function CtaFinal() {
  return (
    <section className="px-6 py-16 text-center sm:py-24">
      <p className="mb-6 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
        14 jours d&apos;essai gratuit — aucune carte requise
      </p>
      <h2 className="mx-auto mb-4 max-w-2xl text-3xl font-bold text-gray-900 dark:text-slate-100 sm:text-4xl">Prêt à trouver vos prochains clients ?</h2>
      <p className="mx-auto mb-8 max-w-xl text-base text-gray-500 dark:text-slate-400">
        Rejoignez des centaines d&apos;agences et freelances qui prospectent plus intelligemment avec Nosite.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/login" className="rounded-lg px-6 py-3 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--accent)' }}>
          Commencer gratuitement &rarr;
        </Link>
        <a href="#tarifs" className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          Voir les tarifs
        </a>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-12 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 grid gap-8 sm:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Nosite</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 dark:text-slate-500">Le moteur de détection d&apos;opportunités commerciales pour les agences et freelances du web.</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Produit</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><a href="#fonctionnalites" className="transition hover:text-gray-900 dark:hover:text-slate-100">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="transition hover:text-gray-900 dark:hover:text-slate-100">Tarifs</a></li>
              <li><span className="cursor-default">Changelog</span></li>
              <li><span className="cursor-default">API</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Ressources</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><span className="cursor-default">Documentation</span></li>
              <li><a href="#faq" className="transition hover:text-gray-900 dark:hover:text-slate-100">FAQ</a></li>
              <li><span className="cursor-default">Blog</span></li>
              <li><span className="cursor-default">Support</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Légal</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><span className="cursor-default">Confidentialité</span></li>
              <li><span className="cursor-default">CGU</span></li>
              <li><span className="cursor-default">RGPD</span></li>
              <li><span className="cursor-default">Mentions légales</span></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
          <p>&copy; 2024 Nosite. Tous droits réservés.</p>
          <p>Fait en France &middot; Données Google Maps et OpenStreetMap</p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ─── */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <AppPreview />
        <Stats />
        <HowItWorks />
        <ScoreSection />
        <Features />
        <RoiCalculator />
        <Pricing />
        <Testimonials />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  )
}
