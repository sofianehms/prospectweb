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
  cachedAt?: string
  stale?:    boolean
  followUpAt?: string | null
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

function saveLocal(prospects: SavedProspect[]) {
  if (prospects.length === 0) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects))
}

function upsertLocal(prospect: SavedProspect) {
  const local = loadLocal()
  saveLocal([prospect, ...local.filter(p => p.id !== prospect.id)])
}

function removeLocal(id: string) {
  saveLocal(loadLocal().filter(p => p.id !== id))
}

function updateLocal(id: string, patch: Partial<SavedProspect>) {
  const local = loadLocal()
  if (local.some(p => p.id === id)) {
    saveLocal(local.map(p => p.id === id ? { ...p, ...patch } : p))
  }
}

function mergeProspects(server: SavedProspect[], local: SavedProspect[]): SavedProspect[] {
  const seen = new Set<string>()
  return [...local, ...server].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

async function migrateLocal(): Promise<SavedProspect[]> {
  const local = loadLocal()
  if (local.length === 0) return []

  const failed: SavedProspect[] = []
  for (const p of local) {
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      if (!res.ok) failed.push(p)
    } catch {
      failed.push(p)
    }
  }

  saveLocal(failed)
  return failed
}

export function useProspects() {
  const [prospects, setProspects] = useState<SavedProspect[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      const local = await migrateLocal()

      try {
        const res = await fetch('/api/prospects')
        if (res.ok) {
          const data: SavedProspect[] = await res.json()
          setProspects(mergeProspects(data, local))
        } else {
          setProspects(local)
        }
      } catch {
        setProspects(local)
      }

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
    const optimistic: SavedProspect = {
      ...body,
      crmStatus: 'to_contact',
      notes: '',
      addedAt: new Date().toISOString(),
    }

    setProspects(prev => {
      if (prev.some(p => p.id === e.id)) return prev
      return [optimistic, ...prev]
    })
    upsertLocal(optimistic)

    fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async res => {
      if (!res.ok) return
      const saved = await res.json().catch(() => null)
      removeLocal(e.id)
      if (saved) setProspects(prev => prev.map(p => p.id === e.id ? saved : p))
    }).catch(() => {})
  }, [])

  const remove = useCallback((id: string) => {
    setProspects(prev => prev.filter(p => p.id !== id))
    removeLocal(id)
    fetch(`/api/prospects/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [])

  const setStatus = useCallback((id: string, status: CrmStatus) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, crmStatus: status } : p))
    updateLocal(id, { crmStatus: status })
    fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }, [])

  const setNotes = useCallback((id: string, notes: string) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, notes } : p))
    updateLocal(id, { notes })
    fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => {})
  }, [])

  const setFollowUp = useCallback((id: string, followUpAt: string | null) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, followUpAt } : p))
    updateLocal(id, { followUpAt })
    fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpAt }),
    }).catch(() => {})
  }, [])

  const isAdded = useCallback((id: string) => prospects.some(p => p.id === id), [prospects])

  const exportCsv = useCallback(() => {
    const header = ['Place ID', 'Nom', 'Adresse', 'Type', 'Fiche Google Maps', 'Statut CRM', 'Ajouté le', 'Notes']
    const rows = prospects.map(p => [
      p.id, p.name, p.address, p.type, p.mapsUrl,
      p.crmStatus, new Date(p.addedAt).toLocaleDateString('fr-FR'), p.notes,
    ])
    const notice = [['# Données commerciales issues de Google Places. Place ID conservé conformément aux conditions d\'utilisation Google Maps Platform.']]
    const csv = [...notice, header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [prospects])

  return { prospects, ready, add, remove, setStatus, setNotes, setFollowUp, isAdded, exportCsv }
}
