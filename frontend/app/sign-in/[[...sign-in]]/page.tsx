import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import Logo from '../../components/Logo'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
      <div className="fixed inset-0 landing-dot-grid opacity-30 pointer-events-none" />
      <div
        className="fixed top-[-180px] left-1/2 -translate-x-1/2 w-[760px] h-[560px] pointer-events-none anim-pulse-glow"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 62%)' }}
      />

      <div className="relative z-10 px-6 md:px-10 py-5 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center">
          <Logo size={26} textSize={19} gap={10} />
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Retour
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-6 relative z-10">
        <SignIn fallbackRedirectUrl="/dashboard" />
      </div>

      <div className="relative z-10 px-6 md:px-10 py-4 text-center shrink-0">
        <span className="text-xs text-gray-400 dark:text-slate-600">
          &copy; 2024 Nosite &middot;{' '}
          <Link href="/privacy" className="text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 transition-colors">Confidentialit&eacute;</Link> &middot;{' '}
          <span className="text-gray-400 dark:text-slate-600">CGU</span>
        </span>
      </div>
    </div>
  )
}
