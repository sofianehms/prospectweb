'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', whiteSpace: 'nowrap', minWidth: 110 }}>{label}</label>
      {children}
    </div>
  )
}

export default function ProfileTab({ toast }: { toast: (msg: string) => void }) {
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setUsername(user.username ?? '')
  }, [user])

  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initial = (firstName || email || '?').charAt(0).toUpperCase()
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email || '…'

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      await user.update({
        firstName,
        lastName,
        ...(username !== (user.username ?? '') ? { username } : {}),
      })
      toast('Profil sauvegardé')
    } catch (err) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message
      toast(msg ?? 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded) {
    return <div className="animate-pulse" style={{ background: 'var(--surface2)', borderRadius: 14, height: 280 }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'var(--accent)', border: '2px solid var(--accent-border)', flexShrink: 0, overflow: 'hidden' }}>
          {user?.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{fullName}</p>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>{username ? `@${username}` : email}</p>
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-header"><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Informations personnelles</p></div>
        <FieldRow label="Prénom">
          <input type="text" className="set-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </FieldRow>
        <FieldRow label="Nom">
          <input type="text" className="set-field" value={lastName} onChange={e => setLastName(e.target.value)} />
        </FieldRow>
        <FieldRow label="Pseudo">
          <input type="text" className="set-field" placeholder="@votre_pseudo" value={username} onChange={e => setUsername(e.target.value)} />
        </FieldRow>
        <FieldRow label="E-mail">
          <input type="email" className="set-field" value={email} disabled title="L'e-mail se modifie depuis la section Sécurité" />
        </FieldRow>
        <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg1)' }}>
          <button className="btn-save" onClick={save} disabled={saving}>{saving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
        </div>
      </div>
    </div>
  )
}
