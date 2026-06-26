'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'

/* ══════════════════════════════════════════════════════
   NAV
   ══════════════════════════════════════════════════════ */
function Nav() {
  const { isSignedIn } = useUser()
  const loggedIn = !!isSignedIn

  return (
    <nav className="fixed top-0 left-0 right-0 z-200 h-16 px-6 md:px-16 flex items-center justify-between backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-transparent">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" fill="var(--on-accent)" /><path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13M3.7 3.7l1.1 1.1M10.2 10.2l1.1 1.1M3.7 11.3l1.1-1.1M10.2 4.8l1.1-1.1" stroke="var(--on-accent)" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </div>
        <span className="font-display font-bold text-[19px] tracking-tight text-gray-900 dark:text-slate-100">nosite</span>
      </Link>
      <div className="hidden md:flex items-center gap-9">
        <a href="#produit" className="text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">Produit</a>
        <a href="#tarifs" className="text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">Tarifs</a>
        <a href="#avis" className="text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">Avis</a>
        <a href="#faq" className="text-sm font-medium text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">FAQ</a>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {loggedIn ? (
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--on-accent)] px-5 py-2.5 rounded-[9px] whitespace-nowrap transition-all hover:-translate-y-px" style={{ background: 'var(--accent)' }}>Mon espace →</Link>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 px-4 py-2 rounded-lg transition-colors">Se connecter</Link>
            <Link href="/login" className="text-sm font-semibold text-[var(--on-accent)] px-5 py-2.5 rounded-[9px] whitespace-nowrap transition-all hover:-translate-y-px" style={{ background: 'var(--accent)' }}>Essai gratuit →</Link>
          </>
        )}
      </div>
    </nav>
  )
}

/* ══════════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-16 pt-32 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 landing-dot-grid opacity-35 pointer-events-none" />
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none anim-pulse-glow" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 60%)' }} />

      <h1 className="font-display text-[clamp(44px,5.8vw,82px)] font-bold tracking-[-0.045em] text-center leading-[1.03] max-w-[920px] mb-6 anim-fade-up [animation-delay:0.08s] text-gray-900 dark:text-slate-100">
        Détectez vos prochains<br />clients <span style={{ color: 'var(--accent)' }}>avant la concurrence.</span>
      </h1>
      <p className="text-[clamp(16px,1.8vw,20px)] text-gray-500 dark:text-slate-400 text-center max-w-[520px] leading-relaxed mb-10 anim-fade-up [animation-delay:0.16s]">
        Nosite identifie les entreprises locales sans site web dans n&apos;importe quelle zone — avec le statut exact du site web et un script de prospection pour chaque résultat.
      </p>
      <div className="flex items-center gap-3.5 mb-5 flex-wrap justify-center anim-fade-up [animation-delay:0.24s]">
        <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-bold text-[var(--on-accent)] rounded-[10px] transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
          Commencer gratuitement
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5H12M8.5 4l3.5 3.5-3.5 3.5" stroke="var(--on-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <a href="#produit" className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 text-[15px] font-medium rounded-[10px] transition-all hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800">
          Voir comment ça marche
        </a>
      </div>
      <p className="text-[13px] text-gray-400 dark:text-slate-600 anim-fade-up [animation-delay:0.3s]">Votre première recherche gratuite · Aucune carte requise</p>

      {/* Product preview */}
      <div className="w-full max-w-[880px] mt-16 relative anim-fade-up [animation-delay:0.42s]">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[70%] h-16 pointer-events-none blur-xl" style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)' }} />
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl dark:shadow-[0_40px_80px_rgba(0,0,0,0.55)]">
          {/* Chrome bar */}
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-70" />
            </div>
            <div className="flex-1 h-[26px] bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md flex items-center px-2.5 gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.2" className="text-gray-400 dark:text-slate-500" /><path d="M9 9L6.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-gray-400 dark:text-slate-500" /></svg>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">app.nosite.fr/resultats?zone=Paris+3ème&amp;rayon=3km&amp;types=restaurant,café</span>
            </div>
          </div>
          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C4.02 1 2 3.02 2 5.5c0 3.5 4.5 6.5 4.5 6.5S11 9 11 5.5C11 3.02 8.98 1 6.5 1z" fill="var(--accent)" opacity="0.85" /><circle cx="6.5" cy="5.5" r="1.8" className="fill-white dark:fill-slate-900" /></svg>
                <span className="text-[13px] font-medium text-gray-900 dark:text-slate-100">Paris 3e · 3 km</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500">Restaurant · Café · Boulangerie</span>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-[7px]" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)' }}>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--accent)' }}>34 sans site</span>
              </div>
              <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-[7px]">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">12 obsolètes</span>
              </div>
            </div>
          </div>
          {/* Rows */}
          {[
            { emoji: '🍕', name: 'Pizzeria Da Luigi', rating: '4.8', reviews: '892', area: 'Paris 11e', status: 'Pas de site', statusType: 'green', score: 94 },
            { emoji: '☕', name: 'Le Café du Commerce', rating: '4.5', reviews: '1 247', area: 'Paris 3e', status: 'Site obsolète', statusType: 'amber', score: 78 },
            { emoji: '🥐', name: 'Boulangerie Artisan Bernard', rating: '4.9', reviews: '567', area: 'Paris 15e', status: 'Pas de site', statusType: 'green', score: 89 },
          ].map((r, i) => (
            <div key={i} className={`px-5 py-3.5 flex items-center justify-between gap-4 ${i < 2 ? 'border-b border-gray-100 dark:border-slate-700/50' : ''} ${r.statusType === 'green' && i === 0 ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0 border ${r.statusType === 'green' ? 'border-emerald-200 dark:border-emerald-700/30' : 'border-amber-200 dark:border-amber-700/30'}`} style={{ background: r.statusType === 'green' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : undefined }}>
                  {r.statusType === 'amber' && <span className="bg-amber-50 dark:bg-amber-900/20 w-full h-full rounded-[10px] flex items-center justify-center">{r.emoji}</span>}
                  {r.statusType === 'green' && r.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis text-gray-900 dark:text-slate-100">{r.name}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500">⭐ {r.rating} · {r.reviews} avis · {r.area}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <div className={`px-2.5 py-1 rounded-md border ${r.statusType === 'green' ? 'border-emerald-200 dark:border-emerald-700/30' : 'border-amber-200 dark:border-amber-700/30'}`} style={r.statusType === 'green' ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)' } : { background: 'var(--warn-d)' }}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${r.statusType === 'green' ? '' : 'text-amber-500 dark:text-amber-400'}`} style={r.statusType === 'green' ? { color: 'var(--accent)' } : undefined}>{r.status}</span>
                </div>
                <div className="text-center min-w-[40px]">
                  <div className="font-display text-[22px] font-bold leading-none" style={{ color: r.statusType === 'green' ? 'var(--accent)' : 'var(--warn)' }}>{r.score}</div>
                  <div className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">score</div>
                </div>
              </div>
            </div>
          ))}
          <div className="px-5 py-2.5 bg-gray-50 dark:bg-slate-900 flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500">+ 31 opportunités supplémentaires</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-slate-500" /></svg>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   STATS
   ══════════════════════════════════════════════════════ */
function Stats() {
  const stats = [
    { value: '50 000+', label: 'entreprises analysées', accent: false },
    { value: '12 000+', label: 'opportunités détectées', accent: true },
    { value: '3 min', label: 'pour votre 1er lead', accent: false },
    { value: '4.8/5', label: 'satisfaction utilisateurs', accent: false },
  ]
  return (
    <div className="border-t border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-[1140px] mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className={`text-center py-10 px-8 ${i < stats.length - 1 ? 'md:border-r border-gray-200 dark:border-slate-700' : ''}`}>
            <div className={`font-display text-[clamp(28px,4vw,38px)] font-bold tracking-tight mb-1.5 ${s.accent ? '' : 'text-gray-900 dark:text-slate-100'}`} style={s.accent ? { color: 'var(--accent)' } : undefined}>{s.value}</div>
            <div className="text-sm text-gray-400 dark:text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   HOW IT WORKS
   ══════════════════════════════════════════════════════ */
function HowItWorks() {
  return (
    <section id="produit" className="py-24 px-6 md:px-16">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>Comment ça marche</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-[72px] text-gray-900 dark:text-slate-100">
          De l&apos;adresse au prospect qualifié<br /><span className="text-gray-400 dark:text-slate-500">en moins de 3 minutes.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-[31px] left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px pointer-events-none" style={{ background: `linear-gradient(90deg, color-mix(in srgb, var(--accent) 20%, transparent), var(--accent), color-mix(in srgb, var(--accent) 20%, transparent))` }} />
          {/* Step 1 */}
          <div className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5 border" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="var(--accent)" strokeWidth="1.5" /><path d="M16 16l-3.5-3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--accent)' }}>Étape 1</div>
            <h3 className="font-display text-[19px] font-semibold tracking-tight mb-3 text-gray-900 dark:text-slate-100">Définissez votre zone</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">Saisissez une adresse et choisissez un rayon de 1 à 10 km. Nosite interroge automatiquement tous les commerces de la zone via Google Places.</p>
          </div>
          {/* Step 2 — highlight */}
          <div className="p-8 bg-white dark:bg-slate-800 border rounded-2xl relative" style={{ borderColor: 'var(--accent)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 8px 32px color-mix(in srgb, var(--accent) 6%, transparent)' }}>
            <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-b-lg" style={{ background: 'var(--accent)' }}>
              <span className="text-[10px] font-bold text-[var(--on-accent)] uppercase tracking-wider">Cœur du produit</span>
            </div>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5 mt-2 border" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5L10.9 6.8H16.5L11.9 9.9L13.8 15.2L9 12.1L4.2 15.2L6.1 9.9L1.5 6.8H7.1L9 1.5Z" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--accent)' }}>Étape 2</div>
            <h3 className="font-display text-[19px] font-semibold tracking-tight mb-3 text-gray-900 dark:text-slate-100">Nosite analyse tout</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">Notre moteur visite chaque site web et lui attribue un statut : sans site, obsolète ou actif — résultats triés par priorité commerciale.</p>
          </div>
          {/* Step 3 */}
          <div className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5 border" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9.5 4.5L14 9l-4.5 4.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--accent)' }}>Étape 3</div>
            <h3 className="font-display text-[19px] font-semibold tracking-tight mb-3 text-gray-900 dark:text-slate-100">Contactez et signez</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">Liste triée avec coordonnées complètes et script de prospection adapté au statut. Ajoutez au CRM intégré et exportez en un clic.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   SCORING SECTION
   ══════════════════════════════════════════════════════ */
function Scoring() {
  const checks = [
    { label: 'Pas de site web', pct: 100 },
    { label: 'Téléphone disponible', pct: 67 },
    { label: 'Note Google · 4.8/5', pct: 50 },
    { label: '892 avis Google', pct: 40 },
    { label: 'Lien Google Maps', pct: 33 },
  ]
  return (
    <section className="py-24 px-6 md:px-16 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-22 items-center">
        {/* Score Card */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[18px] overflow-hidden shadow-xl dark:shadow-[0_24px_56px_rgba(0,0,0,0.32)]">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>🍕</div>
            <div>
              <div className="text-[15px] font-semibold mb-0.5 text-gray-900 dark:text-slate-100">Pizzeria Da Luigi</div>
              <div className="text-xs text-gray-400 dark:text-slate-500">⭐ 4.8 · 892 avis · Paris 11e</div>
            </div>
          </div>
          <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <div className="w-2 h-2 rounded-full anim-pulse-glow shrink-0" style={{ background: 'var(--accent)' }} />
            <span className="text-[13px] font-bold" style={{ color: 'var(--accent)' }}>Sans site web — Détecté automatiquement</span>
          </div>
          <div className="px-6 py-5 flex flex-col gap-3.5">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-[17px] h-[17px] rounded flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className="text-[13px] text-gray-500 dark:text-slate-400">{c.label}</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-[72px] h-1 bg-gray-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm" style={{ width: `${c.pct}%`, background: 'var(--accent)', opacity: 1 - (i * 0.12) }} />
                  </div>
                  <span className="font-display text-xs font-bold min-w-[26px] text-right" style={{ color: 'var(--accent)' }}>✓</span>
                </div>
              </div>
            ))}
            <div className="h-px bg-gray-200 dark:bg-slate-700 my-0.5" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">Statut</span>
              <div className="px-3 py-1 rounded-[7px]" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <span className="text-[13px] font-bold" style={{ color: 'var(--accent)' }}>Pas de site web</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-3.5 border-t border-gray-200 dark:border-slate-700 flex gap-2.5 items-start" style={{ background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
            <div className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L6.2 4H9.5L6.9 5.8L7.9 9L5 7.2L2.1 9L3.1 5.8L.5 4H3.8L5 1Z" fill="var(--accent)" /></svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed"><span className="font-semibold">Source</span> — Données Google Places API. Informations professionnelles publiques. Statut du site vérifié automatiquement par Nosite.</p>
          </div>
        </div>
        {/* Text */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] block mb-4" style={{ color: 'var(--accent)' }}>Détection de site</span>
          <h2 className="font-display text-[clamp(28px,3.5vw,46px)] font-bold tracking-tight leading-[1.08] mb-5 text-gray-900 dark:text-slate-100">Trois statuts détectés.<br />Une priorité claire.</h2>
          <p className="text-base text-gray-500 dark:text-slate-400 leading-relaxed mb-8">Nosite visite automatiquement chaque site web trouvé sur Google Places et lui attribue un statut. Résultat : une liste priorisée prête à prospecter.</p>
          <div className="flex flex-col gap-4">
            {[
              { title: 'Pas de site · Priorité maximale', desc: "L'entreprise n'a aucune présence web. C'est votre meilleure opportunité à contacter en premier." },
              { title: 'Site obsolète · Opportunité réelle', desc: "Le site est inaccessible ou n'a pas été mis à jour depuis plus de 2 ans." },
              { title: 'Site actif · Déjà accompagné', desc: 'Le site est récent et accessible. Cette entreprise est certainement déjà accompagnée.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-0.5 text-gray-900 dark:text-slate-100">{item.title}</div>
                  <div className="text-sm text-gray-400 dark:text-slate-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   PROMESSES
   ══════════════════════════════════════════════════════ */
function Promises() {
  const items = [
    { icon: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 1l2.5 6.5H20l-5.3 4 2 6.5L11 14l-5.7 4 2-6.5L2 7.5h6.5L11 1z" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" /></svg>, title: 'Données fiables, pas de scraping', desc: 'Nosite utilise exclusivement les APIs officielles de Google Maps. Chaque résultat est vérifié, sourcé et conforme aux conditions d\'utilisation.' },
    { icon: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--accent)" strokeWidth="1.4" /><path d="M11 7v4l3 3" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" /></svg>, title: '3 minutes pour votre premier lead', desc: 'Saisissez une adresse, lancez la recherche : les résultats arrivent en temps réel. Pas de configuration, pas d\'import, pas d\'attente.' },
    { icon: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11h16M11.5 6l5 5-5 5" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>, title: 'Du prospect au client, sans quitter Nosite', desc: 'CRM intégré, script de prospection par statut, export CSV et Google Sheets. Tout est pensé pour convertir, pas juste pour lister.' },
  ]
  return (
    <section className="py-24 px-6 md:px-16">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>Pourquoi Nosite</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-[72px] text-gray-900 dark:text-slate-100">
          Les promesses qu&apos;on tient.<br /><span className="text-gray-400 dark:text-slate-500">Vraiment.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                {item.icon}
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   FEATURES
   ══════════════════════════════════════════════════════ */
function Features() {
  const features = [
    { title: 'Détection intelligente', desc: "Identifie automatiquement les entreprises sans site ou avec un site obsolète dans n'importe quelle zone géographique.", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="var(--accent)" strokeWidth="1.5" /><path d="M17 17L13 13" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></svg> },
    { title: 'Tri & filtres avancés', desc: "Filtrez par statut (sans site, obsolète, actif), triez par note Google, nombre d'avis ou distance. Repérez les meilleures opportunités en un coup d'œil.", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.2 7.8H18.5L13.7 11.2L15.9 17L10 13.6L4.1 17L6.3 11.2L1.5 7.8H7.8L10 2Z" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" /></svg> },
    { title: 'Vue carte interactive', desc: 'Visualisez tous les résultats sur une carte Leaflet avec des marqueurs colorés selon le statut du site web. Cercle de recherche inclus.', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C6.68 2 4 4.68 4 8c0 4.9 6 10 6 10s6-5.1 6-10c0-3.32-2.68-6-6-6z" stroke="var(--accent)" strokeWidth="1.5" /><circle cx="10" cy="8" r="2" stroke="var(--accent)" strokeWidth="1.5" /></svg> },
    { title: 'CRM intégré', desc: "Pipeline Kanban, suivi d'avancement, notes et historique. Gérez tous vos prospects sans quitter Nosite.", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.5" /><path d="M6 5V4a2 2 0 014 0v1M10 10v3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></svg> },
    { title: 'Export multi-format', desc: 'CSV, Google Sheets, Notion. Exportez vos prospects vers vos outils depuis la page résultats, en un clic.', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M4 17h12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { title: 'Script de prospection', desc: "Un script d'approche généré automatiquement selon le statut du site (sans site ou site obsolète). Prêt à utiliser sur chaque fiche prospect.", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="var(--accent)" strokeWidth="1.5" /><path d="M10 7v3l2 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></svg> },
  ]
  return (
    <section className="py-24 px-6 md:px-16">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>Fonctionnalités</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-[72px] text-gray-900 dark:text-slate-100">
          Tout ce qu&apos;il faut pour<br /><span className="text-gray-400 dark:text-slate-500">trouver et signer des clients.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <div key={i} className="p-8 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-[18px]" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                {f.icon}
              </div>
              <h3 className="font-display text-[17px] font-semibold tracking-tight mb-2.5 text-gray-900 dark:text-slate-100">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   ROI CALCULATOR
   ══════════════════════════════════════════════════════ */
function RoiCalculator() {
  const [clients, setClients] = useState(3)
  const [value, setValue] = useState(2000)
  const monthly = clients * value
  const annual = monthly * 12
  const mult = Math.round(monthly / 29)

  return (
    <section className="py-24 px-6 md:px-16 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-22 items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] block mb-4" style={{ color: 'var(--accent)' }}>Retour sur investissement</span>
          <h2 className="font-display text-[clamp(28px,3.5vw,46px)] font-bold tracking-tight leading-[1.08] mb-5 text-gray-900 dark:text-slate-100">Nosite est un investissement.<br /><span className="text-gray-400 dark:text-slate-500">Pas une dépense.</span></h2>
          <p className="text-base text-gray-500 dark:text-slate-400 leading-relaxed mb-8">1 client signé via Nosite peut couvrir plusieurs mois d&apos;abonnement. Calculez votre ROI personnalisé ci-contre.</p>
          <div className="flex flex-col gap-3.5">
            <div className="px-5 py-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center gap-4">
              <div className="font-display text-[32px] font-bold min-w-[56px]" style={{ color: 'var(--accent)' }}>×8</div>
              <div>
                <div className="text-sm font-semibold mb-0.5 text-gray-900 dark:text-slate-100">ROI moyen de nos utilisateurs</div>
                <div className="text-[13px] text-gray-400 dark:text-slate-500">par rapport au coût de l&apos;abonnement</div>
              </div>
            </div>
            <div className="px-5 py-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center gap-4">
              <div className="font-display text-[32px] font-bold min-w-[56px] text-gray-900 dark:text-slate-100">7j</div>
              <div>
                <div className="text-sm font-semibold mb-0.5 text-gray-900 dark:text-slate-100">Délai moyen avant le 1er client</div>
                <div className="text-[13px] text-gray-400 dark:text-slate-500">selon nos utilisateurs actifs</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8">
          <h3 className="font-display text-xl font-semibold tracking-tight mb-7 text-gray-900 dark:text-slate-100">Calculez votre ROI</h3>
          <div className="mb-7">
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-slate-100">Nouveaux clients / mois</label>
              <span className="font-display text-[22px] font-bold" style={{ color: 'var(--accent)' }}>{clients}</span>
            </div>
            <input type="range" min={1} max={10} value={clients} onChange={e => setClients(+e.target.value)} />
            <div className="flex justify-between mt-1.5"><span className="text-[11px] text-gray-400 dark:text-slate-500">1</span><span className="text-[11px] text-gray-400 dark:text-slate-500">10</span></div>
          </div>
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-slate-100">Valeur moyenne par client</label>
              <span className="font-display text-[22px] font-bold" style={{ color: 'var(--accent)' }}>{value.toLocaleString('fr-FR')}€</span>
            </div>
            <input type="range" min={500} max={10000} step={250} value={value} onChange={e => setValue(+e.target.value)} />
            <div className="flex justify-between mt-1.5"><span className="text-[11px] text-gray-400 dark:text-slate-500">500€</span><span className="text-[11px] text-gray-400 dark:text-slate-500">10 000€</span></div>
          </div>
          <div className="p-5 rounded-xl mb-3.5 border" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[13px] text-gray-500 dark:text-slate-400">Revenus supplémentaires / mois</span>
              <span className="font-display text-[22px] font-bold" style={{ color: 'var(--accent)' }}>+{monthly.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex justify-between items-center mb-2.5 pb-2.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              <span className="text-[13px] text-gray-500 dark:text-slate-400">Revenus supplémentaires / an</span>
              <span className="font-display text-base font-bold text-gray-900 dark:text-slate-100">{annual.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-500 dark:text-slate-400">Multiplicateur ROI</span>
              <span className="font-display text-[26px] font-bold" style={{ color: 'var(--accent)' }}>×{mult}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">Basé sur le plan Pro à 29€/mois · Estimation indicative</p>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════════════════ */
function Pricing() {
  return (
    <section id="tarifs" className="py-24 px-6 md:px-16">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>Tarifs</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-3.5 text-gray-900 dark:text-slate-100">Simples, transparents,<br />sans surprise.</h2>
        <p className="text-base text-gray-500 dark:text-slate-400 text-center mb-14">Commencez gratuitement. Passez au plan suivant quand vous êtes prêt.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Gratuit */}
          <div className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl">
            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Gratuit</div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-display text-[42px] font-bold tracking-tight text-gray-900 dark:text-slate-100">0€</span>
              <span className="text-sm text-gray-400 dark:text-slate-500">/mois</span>
            </div>
            <p className="text-[13px] text-gray-400 dark:text-slate-500 mb-6 leading-relaxed">Pour découvrir Nosite et tester la prospection locale.</p>
            <Link href="/sign-up" className="flex items-center justify-center py-3 border border-gray-200 dark:border-slate-700 rounded-[9px] text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all mb-6">Démarrer gratuitement</Link>
            <div className="flex flex-col gap-2.5">
              {['50 recherches / jour', '100 prospects en base', 'Export CSV', 'CRM basique', 'Score site web'].map((f, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Pro — highlighted */}
          <div className="p-8 rounded-2xl relative" style={{ background: 'var(--accent)', boxShadow: '0 24px 56px color-mix(in srgb, var(--accent) 22%, transparent)' }}>
            <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full border whitespace-nowrap bg-white dark:bg-slate-900" style={{ borderColor: 'var(--accent)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Le plus populaire</span>
            </div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'color-mix(in srgb, var(--on-accent) 55%, transparent)' }}>Pro</div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-display text-[42px] font-bold tracking-tight" style={{ color: 'var(--on-accent)' }}>29€</span>
              <span className="text-sm" style={{ color: 'color-mix(in srgb, var(--on-accent) 55%, transparent)' }}>/mois</span>
            </div>
            <p className="text-[13px] mb-6 leading-relaxed" style={{ color: 'color-mix(in srgb, var(--on-accent) 60%, transparent)' }}>Pour les freelances et agences actifs en prospection.</p>
            <Link href="/sign-up" className="flex items-center justify-center py-3 bg-[var(--on-accent)] rounded-[9px] text-sm font-bold transition-all mb-6 hover:opacity-85" style={{ color: 'var(--accent)' }}>Commencer Pro →</Link>
            <div className="flex flex-col gap-2.5">
              {['300 recherches / jour', '1 000 prospects en base', 'CRM Kanban complet', 'Export CSV & Sheets', 'Score IA avancé', 'Support prioritaire', 'Vue carte interactive'].map((f, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="var(--on-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="text-sm" style={{ color: 'color-mix(in srgb, var(--on-accent) 78%, transparent)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Business */}
          <div className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl">
            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">Business</div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-display text-[42px] font-bold tracking-tight text-gray-900 dark:text-slate-100">79€</span>
              <span className="text-sm text-gray-400 dark:text-slate-500">/mois</span>
            </div>
            <p className="text-[13px] text-gray-400 dark:text-slate-500 mb-6 leading-relaxed">Pour les équipes et agences à fort volume de prospection.</p>
            <Link href="/sign-up" className="flex items-center justify-center py-3 border border-gray-200 dark:border-slate-700 rounded-[9px] text-sm font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all mb-6">Commencer Business →</Link>
            <div className="flex flex-col gap-2.5">
              {['1 000 recherches / jour', '10 000 prospects en base', 'Tout le plan Pro inclus', 'Multi-utilisateurs', 'Accès API', 'Support prioritaire', 'Onboarding personnalisé'].map((f, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center mt-10">
          <Link href="/pricing" className="text-sm font-semibold hover:underline transition" style={{ color: 'var(--accent)' }}>
            Voir tous les plans et comparer en détail →
          </Link>
        </p>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   TESTIMONIALS
   ══════════════════════════════════════════════════════ */
function Testimonials() {
  const testimonials = [
    { quote: "J'ai signé 4 clients en 2 semaines. Le statut détecté par Nosite m'évite de contacter des prospects non qualifiés. Un outil véritablement indispensable.", name: 'Thomas D.', role: 'Dev freelance · Bordeaux', badge: '4 clients signés', initial: 'T' },
    { quote: "Notre pipeline a triplé en 1 mois. On utilise Nosite pour prospecter toutes nos nouvelles zones. L'export Google Sheets s'intègre parfaitement à notre workflow.", name: 'Sophie M.', role: 'Directrice · Agence Lyon', badge: 'Pipeline ×3', initial: 'S' },
    { quote: "Un seul client signé m'a couvert 6 mois d'abonnement. Je n'aurais jamais pu identifier ces prospects manuellement. Le ROI est évident et immédiat.", name: 'Marc B.', role: 'Consultant SEO · Paris', badge: 'ROI ×8', initial: 'M' },
  ]
  return (
    <section id="avis" className="py-24 px-6 md:px-16 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-[1140px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>Avis clients</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-[72px] text-gray-900 dark:text-slate-100">
          Ils ont trouvé leurs clients.<br /><span className="text-gray-400 dark:text-slate-500">Avec Nosite.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl">
              <div className="text-sm mb-4" style={{ color: 'var(--accent)' }}>★★★★★</div>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-slate-300">{t.initial}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t.name}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{t.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>{t.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   FAQ
   ══════════════════════════════════════════════════════ */
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
    <section id="faq" className="py-24 px-6 md:px-16">
      <div className="max-w-[680px] mx-auto">
        <div className="text-center mb-3.5"><span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent)' }}>FAQ</span></div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-center leading-[1.08] mb-14 text-gray-900 dark:text-slate-100">Questions fréquentes.</h2>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 dark:text-slate-100">
                {item.q}
                <span className="ml-4 shrink-0 text-gray-400 dark:text-slate-500 transition-transform" style={{ transform: open === i ? 'rotate(180deg)' : undefined }}>▾</span>
              </button>
              {open === i && <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   CTA FINAL
   ══════════════════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section className="py-24 px-6 md:px-16 bg-gray-50 dark:bg-slate-900/50 relative overflow-hidden">
      <div className="absolute inset-0 landing-dot-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 60%)' }} />
      <div className="max-w-[640px] mx-auto text-center relative">
        <span className="inline-flex text-xs font-semibold px-3 py-1 rounded-full mb-6 border" style={{ color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
          Votre première recherche gratuite — aucune carte requise
        </span>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold tracking-tight leading-[1.08] mb-5 text-gray-900 dark:text-slate-100">Prêt à trouver vos<br />prochains clients ?</h2>
        <p className="text-base text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">Rejoignez des centaines d&apos;agences et freelances qui prospectent plus intelligemment avec Nosite.</p>
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-bold text-[var(--on-accent)] rounded-[10px] transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent)' }}>
            Commencer gratuitement
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5H12M8.5 4l3.5 3.5-3.5 3.5" stroke="var(--on-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <a href="#tarifs" className="inline-flex items-center px-7 py-3.5 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 text-[15px] font-medium rounded-[10px] transition-all hover:border-gray-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800">
            Voir les tarifs
          </a>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════ */
function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-700 px-6 md:px-16 py-14">
      <div className="max-w-[1140px] mx-auto">
        <div className="mb-10 grid gap-8 grid-cols-2 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <svg width="11" height="11" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" fill="var(--on-accent)" /><path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13M3.7 3.7l1.1 1.1M10.2 10.2l1.1 1.1M3.7 11.3l1.1-1.1M10.2 4.8l1.1-1.1" stroke="var(--on-accent)" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </div>
              <span className="font-display font-bold text-sm text-gray-900 dark:text-slate-100">nosite</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">Le moteur de détection d&apos;opportunités commerciales pour les agences et freelances du web.</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Produit</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><a href="#produit" className="hover:text-gray-900 dark:hover:text-slate-100 transition">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-gray-900 dark:hover:text-slate-100 transition">Tarifs</a></li>
              <li><span className="cursor-default">Changelog</span></li>
              <li><span className="cursor-default">API</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Ressources</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><span className="cursor-default">Documentation</span></li>
              <li><a href="#faq" className="hover:text-gray-900 dark:hover:text-slate-100 transition">FAQ</a></li>
              <li><span className="cursor-default">Blog</span></li>
              <li><span className="cursor-default">Support</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Légal</p>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <li><Link href="/privacy" className="hover:text-gray-900 dark:hover:text-slate-100 transition">Confidentialité</Link></li>
              <li><span className="cursor-default">CGU</span></li>
              <li><span className="cursor-default">RGPD</span></li>
              <li><span className="cursor-default">Mentions légales</span></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 dark:border-slate-800 pt-6 text-xs text-gray-400 dark:text-slate-500 sm:flex-row">
          <p>© 2024 Nosite. Tous droits réservés.</p>
          <p>Fait en France · Données Google Maps et OpenStreetMap</p>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Stats />
        <HowItWorks />
        <Scoring />
        <Promises />
        <Features />
        <RoiCalculator />
        <Pricing />
        <Testimonials />
        <Faq />
        <CtaFinal />
      </main>
      <LandingFooter />
    </div>
  )
}
