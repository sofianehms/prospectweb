'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Establishment, WebsiteStatus } from '@/app/types/establishment'
import { useProspects, type CrmStatus } from '@/app/hooks/useProspects'
import { track, events } from '@/app/lib/analytics'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'infos' | 'script' | 'notes'

const CRM_STATUSES: { id: CrmStatus; label: string }[] = [
  { id: 'to_contact', label: 'À contacter'   },
  { id: 'contacted',  label: 'Contacté'      },
  { id: 'discussing', label: 'En discussion' },
  { id: 'won',        label: 'Client gagné'  },
  { id: 'lost',       label: 'Pas intéressé' },
]

// Badge restylé sur les tokens de la charte : « pas de site » = l'opportunité (accent),
// « obsolète/bloqué » = avertissement (warn), « actif » = neutre (déjà accompagné).
const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', padding: '4px 12px', borderRadius: 20,
  fontSize: 12, fontWeight: 700,
}
const BADGE_ACCENT: React.CSSProperties = { ...BADGE_BASE, background: 'var(--accent-d)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
const BADGE_WARN:   React.CSSProperties = { ...BADGE_BASE, background: 'var(--warn-d)', color: 'var(--warn)', border: '1px solid rgba(217,119,6,.25)' }
const BADGE_NEUTRAL: React.CSSProperties = { ...BADGE_BASE, background: 'var(--surface2)', color: 'var(--t3)', border: '1px solid var(--border-b)' }

const BADGE_STYLE: Record<WebsiteStatus, { label: string; style: React.CSSProperties }> = {
  none:        { label: 'Pas de site web',  style: BADGE_ACCENT },
  unreachable: { label: 'Site injoignable', style: BADGE_ACCENT },
  outdated:    { label: 'Site obsolète',    style: BADGE_WARN },
  blocked:     { label: 'Bloqué anti-bot',  style: BADGE_WARN },
  active:      { label: 'Site actif',       style: BADGE_NEUTRAL },
}

import { typeLabel as getTypeLabel, typeIcon } from '@/app/lib/typeConfig'

// ── Script personnalisé ───────────────────────────────────────────────────────
function buildScript(e: Establishment): string {
  const typeStr = getTypeLabel(e.type).toLowerCase()
  if (e.websiteStatus === 'none') {
    return `« Bonjour, je m'appelle [prénom], je crée des sites web pour les artisans et commerçants du quartier. J'ai vu que vous n'aviez pas encore de site — vos clients pourraient vous trouver facilement en ligne. Est-ce que vous auriez 5 minutes pour que je vous montre ce que ça pourrait donner ? »`
  }
  return `« Bonjour, je m'appelle [prénom], je crée des sites web pour les ${typeStr}s de la région. J'ai regardé votre site et il mériterait une petite mise à jour pour refléter ce que vous proposez aujourd'hui. Est-ce que vous auriez 5 minutes pour en discuter ? »`
}


// ── Composant ─────────────────────────────────────────────────────────────────
export default function DetailClient({ e }: { e: Establishment }) {
  const { prospects, add, remove, setStatus, setNotes: persistNotes, isAdded } = useProspects()
  const added = isAdded(e.id)
  const saved = prospects.find(p => p.id === e.id)

  const [tab, setTab]       = useState<Tab>('infos')
  const [crm, setCrmLocal]  = useState<CrmStatus>(saved?.crmStatus ?? 'to_contact')
  const [notes, setNotesLocal] = useState(saved?.notes ?? '')
  const [script, setScript] = useState(buildScript(e))
  const [notesSaved, setNotesSaved] = useState(false)
  const [enrichment, setEnrichment] = useState(e.enrichment ?? null)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    track(events.PROSPECT_VIEW, { type: e.type, websiteStatus: e.websiteStatus })
  }, [e])

  useEffect(() => {
    if (enrichment || enrichLoading) return
    setEnrichLoading(true)
    fetch(`/api/establishment/${encodeURIComponent(e.id)}?enrich=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.found) setEnrichment(data) })
      .catch(() => {})
      .finally(() => setEnrichLoading(false))
  }, [e.id, enrichment, enrichLoading])

  function handleToggleProspect() {
    if (added) {
      remove(e.id)
    } else {
      add(e)
      track(events.PROSPECT_STATUS_CHANGE, { status: 'to_contact', type: e.type })
    }
  }

  useEffect(() => {
    if (saved) {
      setCrmLocal(saved.crmStatus)
      setNotesLocal(saved.notes)
    }
  }, [saved])

  const handleCrmChange = useCallback((status: CrmStatus) => {
    setCrmLocal(status)
    setStatus(e.id, status)
    track(events.PROSPECT_STATUS_CHANGE, { status, type: e.type })
  }, [e.id, e.type, setStatus])

  const handleNotesChange = useCallback((value: string) => {
    setNotesLocal(value)
    setNotesSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      persistNotes(e.id, value)
      setNotesSaved(true)
    }, 500)
  }, [e.id, persistNotes])

  const badge  = BADGE_STYLE[e.websiteStatus]
  const icon   = typeIcon(e.type)
  const label  = getTypeLabel(e.type)

  return (
    <>
      {/* En-tête établissement */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 26 }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 4 }}>{e.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 10 }}>
                {label}{e.rating ? ` · ⭐ ${e.rating} (${e.ratingCount} avis)` : ''}
              </p>
              <span style={badge.style}>{badge.label}</span>
            </div>
            <button
              onClick={handleToggleProspect}
              className="shrink-0"
              style={added
                ? { padding: '9px 18px', borderRadius: 9, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }
                : { padding: '9px 18px', borderRadius: 9, background: 'var(--surface)', color: 'var(--t2)', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-b)', cursor: 'pointer' }
              }
            >
              {added ? '✓ Dans mes prospects' : '+ Ajouter à mes prospects'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
        {(added ? ['infos', 'script', 'notes'] as Tab[] : ['infos'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`tabpanel-${t}`}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'infos' ? 'Infos' : t === 'script' ? "Script d'appel" : 'Notes'}
          </button>
        ))}
      </div>

      {/* Contenu tabs */}
      {tab === 'infos' && (
        <div role="tabpanel" id="tabpanel-infos" aria-labelledby="tab-infos" className="space-y-6">

          {/* Coordonnées */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Coordonnées</h2>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-3">
              <Row icon="📍">{e.address}</Row>
              {e.phone
                ? <Row icon="📞"><a href={`tel:${e.phone}`} className="hover:text-emerald-600 transition">{e.phone}</a></Row>
                : <Row icon="📞"><span className="text-gray-400 italic">Non renseigné</span></Row>
              }
              {e.website && (
                <Row icon="✉️">
                  {(() => {
                    try { const host = new URL(e.website.startsWith('http') ? e.website : `https://${e.website}`).hostname.replace('www.', ''); return <a href={`mailto:contact@${host}`} className="hover:text-emerald-600 transition">contact@{host}</a> } catch { return <span className="text-gray-400 italic">E-mail indisponible</span> }
                  })()}
                  <span className="text-gray-400 text-xs ml-1">(estimé)</span>
                </Row>
              )}
              {e.rating && (
                <Row icon="⭐">{e.rating} / 5 · {e.ratingCount} avis Google</Row>
              )}
            </div>
          </section>

          {/* Identité entreprise (enrichissement) */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Identité entreprise</h2>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-3">
              {enrichLoading && <Row icon="🔄"><span className="text-gray-400 italic">Recherche en cours...</span></Row>}
              {!enrichLoading && !enrichment && <Row icon="🏢"><span className="text-gray-400 italic">Aucune correspondance trouvée dans le registre français</span></Row>}
              {enrichment?.siret && <Row icon="🏢">SIRET : <span className="font-mono text-xs">{enrichment.siret}</span></Row>}
              {enrichment?.dirigeant && <Row icon="👤">Dirigeant : {enrichment.dirigeant}</Row>}
              {enrichment?.activite && <Row icon="📋">Activité (NAF) : {enrichment.activite}</Row>}
              {enrichment?.dateCreation && <Row icon="📅">Création : {new Date(enrichment.dateCreation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</Row>}
              {enrichment?.siret && (
                <Row icon="🔗">
                  <a href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${enrichment.siren ?? enrichment.siret}`} target="_blank" rel="noopener" className="text-emerald-600 underline">
                    Voir sur l&apos;Annuaire des Entreprises
                  </a>
                </Row>
              )}
            </div>
          </section>

          {/* Opportunité */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Opportunité</h2>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-3">
              {e.websiteStatus === 'none' && <Row icon="🌐">Aucun site web détecté</Row>}
              {e.websiteStatus === 'unreachable' && (
                <Row icon="🌐">Site web renseigné mais injoignable — <a href={e.website!} target="_blank" rel="noopener" className="text-emerald-600 underline">{e.website}</a></Row>
              )}
              {e.websiteStatus === 'outdated' && (
                <Row icon="🌐">Site web présent mais obsolète (confiance {e.confidenceScore}%) — <a href={e.website!} target="_blank" rel="noopener" className="text-emerald-600 underline">{e.website}</a></Row>
              )}
              {e.websiteStatus === 'blocked' && (
                <Row icon="🌐">Site protégé par anti-bot (403/captcha) — statut réel indéterminé — <a href={e.website!} target="_blank" rel="noopener" className="text-emerald-600 underline">{e.website}</a></Row>
              )}
              {e.websiteStatus === 'active' && (
                <Row icon="🌐">Site web actif (confiance {e.confidenceScore}%) — <a href={e.website!} target="_blank" rel="noopener" className="text-emerald-600 underline">{e.website}</a></Row>
              )}
              <Row icon="🗺️">
                <a href={e.mapsUrl} target="_blank" rel="noopener" className="text-emerald-600 underline">
                  Voir la fiche Google Maps
                </a>
              </Row>
            </div>
          </section>

          {/* Script suggéré */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">Script de prospection suggéré</h2>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <div
                className="rounded-xl p-4 text-sm leading-relaxed italic"
                style={{ background: 'var(--bg1)', border: '1px solid var(--border-b)', borderTop: '3px solid var(--accent)', color: 'var(--t2)' }}
              >
                {buildScript(e)}
              </div>
            </div>
          </section>

        </div>
      )}

      {tab === 'script' && (
        <div role="tabpanel" id="tabpanel-script" aria-labelledby="tab-script" className="space-y-3">
          <p className="text-sm text-gray-500">Personnalisez votre script avant l&apos;appel.</p>
          <textarea
            aria-label="Script de prospection"
            value={script}
            onChange={e => setScript(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-800 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={() => setScript(buildScript(e))}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div role="tabpanel" id="tabpanel-notes" aria-labelledby="tab-notes" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Vos notes privées sur ce prospect.</p>
            <span aria-live="polite">
              {notesSaved && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 anim-fade-in">
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Sauvegardé
                </span>
              )}
            </span>
          </div>
          <textarea
            aria-label="Notes sur le prospect"
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Ex : Propriétaire sympa, à rappeler jeudi matin…"
            rows={10}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-4 text-sm text-gray-700 dark:text-slate-200 leading-relaxed focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Statut CRM — visible uniquement si ajouté */}
      {!added && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">Ajoutez ce prospect pour accéder au CRM, aux notes et au script de prospection.</p>
          <button
            onClick={handleToggleProspect}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition"
          >
            + Ajouter à mes prospects
          </button>
        </div>
      )}
      {added && <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500">Statut CRM</h2>
        <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {CRM_STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => handleCrmChange(s.id)}
                className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition ${
                  crm === s.id
                    ? 'bg-gray-900 dark:bg-slate-100 border-gray-900 dark:border-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {e.phone && (
              <a
                href={`tel:${e.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.37 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                </svg>
                Appeler
              </a>
            )}
            {e.website && (
              <a
                href={(() => { try { const host = new URL(e.website.startsWith('http') ? e.website : `https://${e.website}`).hostname.replace('www.', ''); return `mailto:contact@${host}` } catch { return '#' } })()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                E-mail
              </a>
            )}
            <a
              href={e.mapsUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Itinéraire
            </a>
          </div>
        </div>
      </div>}
    </>
  )
}

function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
      <span className="w-5 text-center flex-shrink-0 mt-0.5">{icon}</span>
      <span className="leading-snug">{children}</span>
    </div>
  )
}
