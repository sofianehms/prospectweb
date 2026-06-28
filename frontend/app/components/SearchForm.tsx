'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { track, events } from '@/app/lib/analytics'

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
  const [geoLoading, setGeoLoading]   = useState(false)
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

  const activeFilterLabel = activeFilters.length > 0
    ? FILTERS.filter(f => activeFilters.includes(f.id)).map(f => f.label).join(', ')
        + ' actif' + (activeFilters.length > 1 ? 's' : '')
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setShowSugg(false); setShowCatMenu(false)
    if (!address.trim() && !coords) { setError('Entrez une adresse ou utilisez votre position.'); return }
    setLoading(true)
    const params = new URLSearchParams({ radius: String(radius * 1000) })
    if (categories.length > 0) params.set('types', categories.join(','))
    if (activeFilters.length > 0) params.set('filters', activeFilters.join(','))
    if (coords) { params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)) }
    else params.set('address', address.trim())
    track(events.SEARCH, { types: categories, radius, filters: activeFilters })
    router.push(`/results?${params.toString()}`)
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setAddress('Ma position actuelle')
        setSuggestions([]); setShowSugg(false); setGeoLoading(false)
      },
      () => setGeoLoading(false),
    )
  }

  return (
    <form
      className="pw-search-form"
      onSubmit={handleSubmit}
      style={{ background: 'var(--surface)', border: '1px solid var(--border-b)', borderRadius: 20, padding: 32, boxShadow: '0 4px 32px rgba(0,0,0,.06)' }}
    >
      {/* Address + Category */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4" style={{ marginBottom: 24 }}>
        {/* Address */}
        <div>
          <label htmlFor="address" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
            Ville ou adresse
            <span style={{ fontWeight: 400, color: 'var(--t3)', marginLeft: 4 }}>— point de départ</span>
          </label>
          <div ref={addrRef} className="pw-address-control flex gap-2 relative">
            <div className="relative flex-1">
              <input
                id="address" type="text" value={address} autoComplete="off"
                role="combobox"
                aria-expanded={showSugg && suggestions.length > 0}
                aria-autocomplete="list"
                aria-controls="address-listbox"
                aria-activedescendant={activeIdx >= 0 ? `address-option-${activeIdx}` : undefined}
                onChange={e => { setAddress(e.target.value); setCoords(null); setError('') }}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSugg(true)}
                placeholder="Paris 11e, Cergy, Lyon…"
                className="field-input"
              />
              {showSugg && suggestions.length > 0 && (
                <ul
                  id="address-listbox" role="listbox"
                  className="absolute left-0 right-0 overflow-hidden"
                  style={{ top: 'calc(100% + 6px)', zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border-b)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.14)' }}
                >
                  {suggestions.map((s, i) => (
                    <li key={i} id={`address-option-${i}`} role="option" aria-selected={i === activeIdx}>
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(s) }}
                        className="flex items-start gap-2.5 w-full text-left"
                        style={{
                          padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                          border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                          background: i === activeIdx ? 'var(--surface2)' : 'transparent',
                          color: 'var(--t1)',
                        }}
                      >
                        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ marginTop: 2 }}>
                          <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5 2.5 7.5 6 11 6 11S9.5 7.5 9.5 4.5C9.5 2.57 7.93 1 6 1z" fill="var(--accent)" opacity=".6" />
                          <circle cx="6" cy="4.5" r="1.5" fill="var(--surface)" />
                        </svg>
                        <span className="line-clamp-2 leading-snug">{s.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button" onClick={handleGeolocate} title="Utiliser ma position" aria-label="Utiliser ma position"
              className="flex items-center justify-center shrink-0 transition-all duration-150"
              style={{ height: 44, width: 44, border: '1px solid var(--border-b)', borderRadius: 9, background: 'var(--surface)', color: 'var(--t3)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-b)'; e.currentTarget.style.color = 'var(--t3)' }}
            >
              {geoLoading ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin .7s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="24" strokeDashoffset="8" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Category multi-select */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Type de commerce</label>
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCatMenu(v => !v)}
              aria-expanded={showCatMenu}
              aria-haspopup="listbox"
              className="flex items-center justify-between gap-2 w-full text-left"
              style={{ height: 44, padding: '0 14px', borderRadius: 9, border: '1px solid var(--border-b)', background: 'var(--bg1)', fontSize: 14, cursor: 'pointer' }}
            >
              <span style={{ color: categories.length > 0 ? 'var(--t1)' : 'var(--t4)' }}>{categoryLabel}</span>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 transition-transform" style={{ color: 'var(--t4)', transform: showCatMenu ? 'rotate(180deg)' : undefined }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showCatMenu && (
              <div
                className="absolute left-0 right-0 overflow-hidden"
                style={{ top: 'calc(100% + 6px)', zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border-b)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.14)' }}
              >
                <div className="flex items-center justify-between" style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{categories.length} sélectionné(s)</span>
                  <button
                    type="button" onClick={() => setCategories([])}
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Tout effacer
                  </button>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                  {CATEGORIES.map(c => (
                    <label
                      key={c.value}
                      className="flex items-center gap-2.5 cursor-pointer transition-colors"
                      style={{ padding: '8px 12px', borderRadius: 7 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={categories.includes(c.value)}
                        onChange={() => toggleCategory(c.value)}
                        className="shrink-0 cursor-pointer"
                        style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--t1)' }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radius */}
      <div style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Rayon de recherche</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{radius} km</span>
        </div>
        <input type="range" min={1} max={10} step={1} value={radius}
          onChange={e => setRadius(Number(e.target.value))} aria-label="Rayon de recherche" />
        <div className="flex justify-between" style={{ marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--t4)' }}>1 km</span>
          <span style={{ fontSize: 11, color: 'var(--t4)' }}>10 km</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Filtres :</span>
          {activeFilters.length > 0 && (
            <span className="flex items-center" style={{ gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="4" fill="var(--accent)" /></svg>
              {activeFilterLabel}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.id)
            return (
              <button key={f.id} type="button" onClick={() => toggleFilter(f.id)} aria-pressed={active} className={active ? 'chip-on' : 'chip-off'}>
                {f.label}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 8 }}>
          Filtre « Sans site web » activé par défaut pour maximiser vos opportunités.
        </p>
      </div>

      {/* Error */}
      <div aria-live="assertive">
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 9, background: 'var(--error-d)', border: '1px solid var(--error-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--error)' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pw-search-submit flex justify-end">
        <button
          type="submit" disabled={loading}
          className="inline-flex items-center gap-2 btn-accent"
          style={{ padding: '12px 28px', borderRadius: 9, fontSize: 14 }}
        >
          {loading ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ animation: 'spin .7s linear infinite' }}>
              <circle cx="7.5" cy="7.5" r="5.5" stroke="var(--on-accent)" strokeWidth="1.8" strokeDasharray="24" strokeDashoffset="8" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="var(--on-accent)" strokeWidth="1.5" />
              <path d="M13 13l-2.5-2.5" stroke="var(--on-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Recherche en cours…' : 'Lancer la recherche'}
        </button>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--t4)', textAlign: 'center' }}>
        💡 Conseil : commencez par un arrondissement ou un quartier précis pour des résultats plus pertinents.
      </p>
    </form>
  )
}
