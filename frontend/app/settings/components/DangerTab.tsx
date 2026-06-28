'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

export default function DangerTab({ toast }: { toast: (msg: string) => void }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    toast('Export en cours de préparation…')
    try {
      const prospects = await fetch('/api/prospects').then(r => r.ok ? r.json() : [])
      const payload = {
        exportedAt: new Date().toISOString(),
        account: {
          id: user?.id,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
          firstName: user?.firstName ?? null,
          lastName: user?.lastName ?? null,
        },
        prospects,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `nosite-export_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      toast("Erreur lors de l'export.")
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!user) return
    const confirmed = window.confirm(
      'Supprimer définitivement votre compte ?\n\nToutes vos données (prospects, recherches, abonnement) seront perdues. Cette action est irréversible.',
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await user.delete()
      await signOut({ redirectUrl: '/sign-in' })
    } catch {
      toast('Erreur lors de la suppression. Contactez support@nosite.fr.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--t3)' }}>Ces actions sont irréversibles. Procédez avec prudence.</p>
      <div style={{ border: '1px solid var(--error-border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--error-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Exporter mes données</p>
            <p style={{ fontSize: 12, color: 'var(--t4)' }}>Télécharger toutes vos données au format JSON.</p>
          </div>
          <button className="btn-ghost" onClick={handleExport} disabled={exporting}>{exporting ? 'Export…' : 'Exporter'}</button>
        </div>
        <div style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--error)' }}>Supprimer mon compte</p>
            <p style={{ fontSize: 12, color: 'var(--t4)' }}>Toutes vos données seront définitivement supprimées.</p>
          </div>
          <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--error-border)', background: 'var(--error-d)', fontSize: 13, fontWeight: 600, color: 'var(--error)', cursor: deleting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
