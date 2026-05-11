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
  addedAt:   string // ISO date
}

const STORAGE_KEY = 'pw_prospects'

function load(): SavedProspect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedProspect[]) : []
  } catch {
    return []
  }
}

function save(prospects: SavedProspect[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects))
}

export function useProspects() {
  const [prospects, setProspects] = useState<SavedProspect[]>([])
  const [ready, setReady] = useState(false)

  // Hydration depuis localStorage (client seulement)
  useEffect(() => {
    setProspects(load())
    setReady(true)
  }, [])

  const update = useCallback((next: SavedProspect[]) => {
    setProspects(next)
    save(next)
  }, [])

  const add = useCallback((e: Establishment) => {
    setProspects(prev => {
      if (prev.some(p => p.id === e.id)) return prev
      const next: SavedProspect[] = [
        {
          id:            e.id,
          name:          e.name,
          address:       e.address,
          type:          e.type,
          phone:         e.phone,
          mapsUrl:       e.mapsUrl,
          rating:        e.rating,
          ratingCount:   e.ratingCount,
          websiteStatus: e.websiteStatus,
          crmStatus:     'to_contact',
          notes:         '',
          addedAt:       new Date().toISOString(),
        },
        ...prev,
      ]
      save(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setProspects(prev => {
      const next = prev.filter(p => p.id !== id)
      save(next)
      return next
    })
  }, [])

  const setStatus = useCallback((id: string, status: CrmStatus) => {
    setProspects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, crmStatus: status } : p)
      save(next)
      return next
    })
  }, [])

  const setNotes = useCallback((id: string, notes: string) => {
    setProspects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, notes } : p)
      save(next)
      return next
    })
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
