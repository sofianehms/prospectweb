'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Establishment } from '@/app/types/establishment'

export type CrmStatus = 'to_contact' | 'contacted' | 'discussing' | 'won' | 'lost'

export interface SavedProspect {
  id:        string
  name:      string
  address:   string
  type:      string
  phone:     string | null
  mapsUrl:   string
  rating:    number | null
  ratingCount: number | null
  websiteStatus: Establishment['websiteStatus']
  crmStatus: CrmStatus
  notes:     string
  addedAt:   string
}

const STORAGE_KEY = 'pw_prospects'

function loadLocal(): SavedProspect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedProspect[]) : []
  } catch {
    return []
  }
}

async function migrateLocal(): Promise<void> {
  const local = loadLocal()
  if (local.length === 0) return

  for (const p of local) {
    try {
      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
    } catch { /* best effort */ }
  }

  localStorage.removeItem(STORAGE_KEY)
}

export function useProspects() {
  const [prospects, setProspects] = useState<SavedProspect[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      await migrateLocal()

      try {
        const res = await fetch('/api/prospects')
        if (res.ok) {
          const data: SavedProspect[] = await res.json()
          setProspects(data)
        }
      } catch { /* offline fallback: empty list */ }

      setReady(true)
    })()
  }, [])

  const add = useCallback((e: Establishment) => {
    const body = {
      id:            e.id,
      name:          e.name,
      address:       e.address,
      type:          e.type,
      phone:         e.phone,
      mapsUrl:       e.mapsUrl,
      rating:        e.rating,
      ratingCount:   e.ratingCount,
      websiteStatus: e.websiteStatus,
    }

    setProspects(prev => {
      if (prev.some(p => p.id === e.id)) return prev
      return [{ ...body, crmStatus: 'to_contact' as CrmStatus, notes: '', addedAt: new Date().toISOString() }, ...prev]
    })

    fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }, [])

  const remove = useCallback((id: string) => {
    setProspects(prev => prev.filter(p => p.id !== id))
    fetch(`/api/prospects/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const setStatus = useCallback((id: string, status: CrmStatus) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, crmStatus: status } : p))
    fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }, [])

  const setNotes = useCallback((id: string, notes: string) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, notes } : p))
    fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => {})
  }, [])

  const isAdded = useCallback((id: string) => prospects.some(p => p.id === id), [prospects])

  const exportCsv = useCallback(() => {
    const header = ['Nom', 'Adresse', 'Téléphone', 'Type', 'Statut CRM', 'Ajouté le', 'Notes']
    const rows = prospects.map(p => [
      p.name, p.address, p.phone ?? '', p.type,
      p.crmStatus, new Date(p.addedAt).toLocaleDateString('fr-FR'), p.notes,
    ])
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [prospects])

  return { prospects, ready, add, remove, setStatus, setNotes, isAdded, exportCsv }
}
