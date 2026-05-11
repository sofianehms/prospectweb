import Link from 'next/link'

export default function AppHeader({
  wide     = false,
  children,
}: {
  wide?:    boolean
  children?: React.ReactNode
}) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
      <div className={`${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-6 h-14 flex items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
          </svg>
          <span className="font-semibold text-gray-900 dark:text-slate-100 text-[15px] tracking-tight">ProspectWeb</span>
        </Link>
        {children && (
          <div className="flex items-center gap-3">{children}</div>
        )}
      </div>
    </header>
  )
}
