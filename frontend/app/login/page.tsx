'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login'
        ? { email, password }
        : { email, password, firstName, lastName }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erreur inconnue')
        return
      }

      document.cookie = `pw_token=${data.token}; path=/; max-age=${7 * 86400}; SameSite=Lax`
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Background dot grid */}
      <div className="fixed inset-0 landing-dot-grid opacity-30 pointer-events-none" />
      {/* Accent glow */}
      <div
        className="fixed top-[-180px] left-1/2 -translate-x-1/2 w-[760px] h-[560px] pointer-events-none anim-pulse-glow"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 62%)' }}
      />

      {/* Top bar */}
      <div className="relative z-10 px-6 md:px-10 py-5 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" fill="#09090B" /><path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13M3.7 3.7l1.1 1.1M10.2 10.2l1.1 1.1M3.7 11.3l1.1-1.1M10.2 4.8l1.1-1.1" stroke="#09090B" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </div>
          <span className="font-display font-bold text-[19px] tracking-tight">nosite</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Retour à l&apos;accueil
        </Link>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-5 py-6 relative z-10">
        <div className="w-full max-w-[440px] anim-fade-up">
          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="font-display text-[28px] font-bold tracking-tight mb-2">
              {isLogin ? 'Content de vous revoir' : 'Commencez gratuitement'}
            </h1>
            <p className="text-[15px] text-gray-400 dark:text-slate-500">
              Trouvez dès maintenant vos premiers prospects — Votre première recherche gratuite
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Signup-only fields */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-gray-500 dark:text-slate-400">Prénom</label>
                  <input
                    type="text"
                    placeholder="Marie"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[10px] text-[15px] text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-gray-500 dark:text-slate-400">Nom</label>
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[10px] text-[15px] text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-gray-500 dark:text-slate-400">Adresse e-mail</label>
              <input
                type="email"
                required
                placeholder="vous@exemple.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[10px] text-[15px] text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-gray-500 dark:text-slate-400">Mot de passe</label>
                {isLogin && (
                  <button type="button" className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--accent)' }}>Mot de passe oublié ?</button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                placeholder={isLogin ? '••••••••' : '8 caractères minimum'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[10px] text-[15px] text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Confirm password (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-gray-500 dark:text-slate-400">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[10px] text-[15px] text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] placeholder:text-gray-400 dark:placeholder:text-slate-600"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-[15px] font-bold text-[#09090B] rounded-[10px] border-none cursor-pointer mt-1 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? '…' : isLogin ? 'Se connecter →' : 'Créer mon compte →'}
            </button>

            {/* Terms (signup only) */}
            {!isLogin && (
              <p className="text-xs text-gray-400 dark:text-slate-600 text-center leading-relaxed">
                En créant un compte, vous acceptez nos{' '}
                <span className="text-gray-500 dark:text-slate-500">conditions d&apos;utilisation</span> et notre{' '}
                <Link href="/privacy" className="text-gray-500 dark:text-slate-500">politique de confidentialité</Link>.
              </p>
            )}

            {/* Toggle mode */}
            <p className="text-[13px] text-gray-400 dark:text-slate-500 text-center">
              {isLogin ? (
                <>Pas encore de compte ?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0" style={{ color: 'var(--accent)' }}>Créer un compte</button>
                </>
              ) : (
                <>Déjà un compte ?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="bg-transparent border-none cursor-pointer text-[13px] font-semibold p-0" style={{ color: 'var(--accent)' }}>Se connecter</button>
                </>
              )}
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3.5 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 md:px-10 py-4 text-center shrink-0">
        <span className="text-xs text-gray-400 dark:text-slate-600">
          © 2024 Nosite ·{' '}
          <Link href="/privacy" className="text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 transition-colors">Confidentialité</Link> ·{' '}
          <span className="text-gray-400 dark:text-slate-600">CGU</span>
        </span>
      </div>
    </div>
  )
}
