'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'restaurant',         label: 'Restaurant' },
  { value: 'cafe',               label: 'Café / Bar' },
  { value: 'bar',                label: 'Bar / Pub' },
  { value: 'hotel',              label: 'Hôtel' },
  { value: 'bakery',             label: 'Boulangerie / Pâtisserie' },
  { value: 'clothing_store',     label: 'Boutique / Commerce' },
  { value: 'pharmacy',           label: 'Pharmacie / Santé' },
  { value: 'hair_salon',         label: 'Coiffeur' },
  { value: 'beauty_salon',       label: 'Institut beauté' },
  { value: 'real_estate_agency', label: 'Immobilier' },
  { value: 'gym',                label: 'Sport / Fitness' },
  { value: 'car_repair',         label: 'Garagiste' },
  { value: 'florist',            label: 'Fleuriste' },
  { value: 'dentist',            label: 'Dentiste' },
  { value: 'doctor',             label: 'Médecin' },
  { value: 'supermarket',        label: 'Supermarché' },
  { value: 'pet_store',          label: 'Animalerie' },
  { value: 'travel_agency',      label: 'Agence de voyage' },
]

const FILTERS = [
  { id: 'no_website', label: 'Sans site web' },
  { id: 'outdated',   label: 'Site obsolète' },
]

interface Suggestion { display_name: string; lat: string; lon: string }

export default function SearchForm() {
  const router = useRouter()

  const [address, setAddress]         = useState('')
  const [coords, setCoords]           = useState<{ lat: number; lng: number } | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSugg, setShowSugg]       = useState(false)
  const [activeIdx, setActiveIdx]     = useState(-1)
  const [categories, setCategories]   = useState<string[]>([])
  const [showCatMenu, setShowCatMenu] = useState(false)
  const [radius, setRadius]           = useState(5)
  const [activeFilters, setActiveFilters] = useState<string[]>(['no_website'])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addrRef     = useRef<HTMLDivElement>(null)
  const catRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (addrRef.current && !addrRef.current.contains(e.target as Node)) setShowSugg(false)
      if (catRef.current  && !catRef.current.contains(e.target as Node))  setShowCatMenu(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!address.trim() || coords || address.trim().length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/autocomplete?q=${encodeURIComponent(address)}`)
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setShowSugg(data.length > 0)
        setActiveIdx(-1)
      } catch { setSuggestions([]) }
    }, 300)
  }, [address, coords])

  function selectSuggestion(s: Suggestion) {
    setAddress(s.display_name)
    setCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) })
    setSuggestions([]); setShowSugg(false); setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSugg || !suggestions.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx]) }
    else if (e.key === 'Escape') setShowSugg(false)
  }

  function toggleFilter(id: string) {
    setActiveFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  function toggleCategory(value: string) {
    setCategories(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const categoryLabel =
    categories.length === 0 ? 'Tous les types' :
    categories.length === 1 ? (CATEGORIES.find(c => c.value === categories[0])?.label ?? categories[0]) :
    `${categories.length} types sélectionnés`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setShowSugg(false); setShowCatMenu(false)
    if (!address.trim() && !coords) { setError('Entrez une adresse ou utilisez votre position.'); return }
    setLoading(true)
    const params = new URLSearchParams({ radius: String(radius * 1000) })
    if (categories.length > 0) params.set('types', categories.join(','))
    if (activeFilters.length > 0) params.set('filters', activeFilters.join(','))
    if (coords) { params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)) }
    else params.set('address', address.trim())
    router.push(`/results?${params.toString()}`)
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setAddress('Ma position actuelle')
      setSuggestions([]); setShowSugg(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-8">

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 mb-6">
        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Ville ou adresse
          </label>
          <div ref={addrRef} className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                id="address" type="text" value={address} autoComplete="off"
                onChange={e => { setAddress(e.target.value); setCoords(null) }}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                placeholder="Paris 11e, Cergy, Lyon…"
                className="w-full h-11 px-3.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              {showSugg && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(s) }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-2.5 transition ${
                          i === activeIdx
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                        } ${i < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-slate-500">
                          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="line-clamp-2 leading-snug">{s.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={handleGeolocate} title="Utiliser ma position"
              className="h-11 px-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Category multi-select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Type de commerce</label>
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCatMenu(v => !v)}
              className="w-full h-11 px-3.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            >
              <span className={categories.length === 0 ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}>
                {categoryLabel}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`flex-shrink-0 text-gray-400 transition-transform ${showCatMenu ? 'rotate-180' : ''}`}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {showCatMenu && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                {/* Tout sélectionner / désélectionner */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCategories([])}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    {categories.length === 0 ? 'Tous les types (par défaut)' : 'Tout désélectionner'}
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {CATEGORIES.map(c => (
                    <label
                      key={c.value}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={categories.includes(c.value)}
                        onChange={() => toggleCategory(c.value)}
                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radius */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Rayon de recherche</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{radius} km</span>
        </div>
        <input type="range" min={1} max={10} step={1} value={radius}
          onChange={e => setRadius(Number(e.target.value))} aria-label="Rayon de recherche" />
      </div>

      {/* Quick filters */}
      <div className="mb-8">
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 mr-3">Filtres rapides :</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.id)
            return (
              <button key={f.id} type="button" onClick={() => toggleFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  active
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500'
                }`}
              >{f.label}</button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition">
          {loading
            ? <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          }
          {loading ? 'Recherche…' : 'Lancer la recherche'}
        </button>
      </div>
    </form>
  )
}
