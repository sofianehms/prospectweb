'use client'

import { useEffect, useState } from 'react'
import { useUser, useSession } from '@clerk/nextjs'

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>
type SessionActivity = Awaited<ReturnType<ClerkUser['getSessions']>>[number]

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'Maintenant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.round(h / 24)
  return `Il y a ${d} jour${d > 1 ? 's' : ''}`
}

function deviceIcon(s: SessionActivity): string {
  return s.latestActivity?.isMobile ? '📱' : '💻'
}

function deviceName(s: SessionActivity): string {
  const a = s.latestActivity
  const browser = [a?.browserName, a?.browserVersion].filter(Boolean).join(' ')
  const device = a?.deviceType || (a?.isMobile ? 'Mobile' : 'Ordinateur')
  return browser ? `${device} — ${browser}` : device
}

function deviceLocation(s: SessionActivity): string {
  const a = s.latestActivity
  return [a?.city, a?.country].filter(Boolean).join(', ') || 'Localisation inconnue'
}

export default function SecurityTab({ toast }: { toast: (msg: string) => void }) {
  const { user, isLoaded } = useUser()
  const { session } = useSession()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const [sessions, setSessions] = useState<SessionActivity[]>([])

  const refreshSessions = () => {
    user?.getSessions().then(setSessions).catch(() => {})
  }

  useEffect(() => {
    if (user) refreshSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function savePassword() {
    if (!user) return
    if (next.length < 12) { toast('12 caractères minimum'); return }
    if (next !== confirm) { toast('Les mots de passe ne correspondent pas'); return }
    setSaving(true)
    try {
      await user.updatePassword({
        newPassword: next,
        ...(user.passwordEnabled ? { currentPassword: current } : {}),
      })
      toast('Mot de passe mis à jour')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message
      toast(msg ?? 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  async function revoke(s: SessionActivity) {
    try {
      await s.revoke()
      toast('Session révoquée')
      refreshSessions()
    } catch {
      toast('Impossible de révoquer cette session')
    }
  }

  if (!isLoaded) {
    return <div className="animate-pulse" style={{ background: 'var(--surface2)', borderRadius: 14, height: 320 }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Password */}
      <div className="set-card">
        <div className="set-card-header"><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Mot de passe</p></div>
        {user?.passwordEnabled ? (
          <>
            <div className="set-row">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', minWidth: 150 }}>Mot de passe actuel</label>
              <input type="password" className="set-field" placeholder="••••••••" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
            <div className="set-row">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', minWidth: 150 }}>Nouveau mot de passe</label>
              <input type="password" className="set-field" placeholder="12 caractères minimum" value={next} onChange={e => setNext(e.target.value)} />
            </div>
            <div className="set-row">
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', minWidth: 150 }}>Confirmation</label>
              <input type="password" className="set-field" placeholder="Répétez le nouveau mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg1)' }}>
              <button className="btn-save" onClick={savePassword} disabled={saving}>{saving ? 'Mise à jour…' : 'Mettre à jour'}</button>
            </div>
          </>
        ) : (
          <div style={{ padding: '18px 22px', fontSize: 13, color: 'var(--t3)' }}>
            Votre connexion est gérée par un fournisseur externe (Google, etc.). Aucun mot de passe à définir.
          </div>
        )}
      </div>

      {/* Devices */}
      <div className="set-card">
        <div className="set-card-header">
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Appareils connectés</p>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Sessions actives sur votre compte</p>
        </div>
        {sessions.length === 0 && (
          <div style={{ padding: '18px 22px', fontSize: 13, color: 'var(--t3)' }}>Chargement des sessions…</div>
        )}
        {sessions.map(s => {
          const isCurrent = s.id === session?.id
          return (
            <div key={s.id} className="set-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{deviceIcon(s)}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deviceName(s)}</p>
                  <p style={{ fontSize: 12, color: 'var(--t4)' }}>{deviceLocation(s)} · {relativeTime(new Date(s.lastActiveAt))}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {isCurrent ? (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--accent-d)', color: 'var(--accent)' }}>Actuel</span>
                ) : (
                  <button onClick={() => revoke(s)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 6 }}>Révoquer</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
